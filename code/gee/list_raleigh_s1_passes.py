#!/usr/bin/env python3
"""List closest Sentinel-1 passes for Raleigh flood events with S-1 coverage."""

from __future__ import annotations

import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable

import ee

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CSV_PATH = PROJECT_ROOT / "data" / "raw" / "raleigh" / "event_detection" / "noaa_raleigh_flood_events.csv"
OUTPUT_PATH = PROJECT_ROOT / "data" / "raw" / "raleigh" / "event_detection" / "sentinel1_pass_matches.csv"
AOI_PATH = PROJECT_ROOT / "data" / "raleigh_aoi.json"

# Sentinel-1 product identifier
S1_COLLECTION = "COPERNICUS/S1_GRD"
# Look back this many days for a "before" pass, and look forward for "after"
LOOKBACK_DAYS = 20
LOOKAHEAD_DAYS = 2


def initialize_gee() -> None:
    """Initialize Earth Engine for the configured project."""
    ee.Initialize(project="science-project-1-394520")


def load_polygon(path: Path) -> ee.Geometry:
    """Load AOI polygon from GeoJSON."""
    import json

    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    coords = data["features"][0]["geometry"]["coordinates"]
    return ee.Geometry.Polygon(coords)


def iter_events(csv_path: Path) -> Iterable[tuple[datetime, str]]:
    """Yield event dates and IDs from the NOAA event catalog."""
    with csv_path.open("r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            event_date = datetime.strptime(row["BEGIN_DATE"], "%m/%d/%Y")
            event_id = row["EVENT_ID"]
            yield event_date, event_id


def collect_passes(event_date: datetime, aoi: ee.Geometry) -> dict[str, list[tuple[datetime, str]]]:
    """Return lists of Sentinel-1 passes before/after the event."""
    start = (event_date - timedelta(days=LOOKBACK_DAYS)).strftime("%Y-%m-%d")
    end = (event_date + timedelta(days=LOOKAHEAD_DAYS + 1)).strftime("%Y-%m-%d")

    collection = (
        ee.ImageCollection(S1_COLLECTION)
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
    )

    # Retrieve timestamps and IDs to order locally
    times = collection.aggregate_array("system:time_start").getInfo()
    ids = collection.aggregate_array("system:id").getInfo()

    entries: list[tuple[datetime, str]] = []
    for ts_ms, img_id in zip(times, ids):
        dt = datetime.utcfromtimestamp(ts_ms / 1000.0)
        entries.append((dt, img_id))

    before = sorted((item for item in entries if item[0] <= event_date), key=lambda x: x[0], reverse=True)
    after = sorted((item for item in entries if item[0] > event_date), key=lambda x: x[0])

    return {"before": before, "after": after, "all": sorted(entries, key=lambda x: x[0])}


def describe_closest(event_date: datetime, passes: dict[str, list[tuple[datetime, str]]]) -> str:
    """Format a short description of the closest available passes."""
    def format_entry(entry: tuple[datetime, str] | None) -> str:
        if entry is None:
            return "None"
        dt, img_id = entry
        delta_days = (dt - event_date).days
        return f"{dt.date()} ({delta_days:+d} days) id={img_id.split('/')[-1]}"

    closest_before = passes["before"][0] if passes["before"] else None
    closest_after = passes["after"][0] if passes["after"] else None
    total = len(passes["all"])

    return (
        f"    nearest before (≤{LOOKBACK_DAYS}d): {format_entry(closest_before)}\n"
        f"    nearest after  (≤{LOOKAHEAD_DAYS}d): {format_entry(closest_after)}\n"
        f"    total passes in window: {total}"
    )


def format_record(event_id: str, event_date: datetime, passes: dict[str, list[tuple[datetime, str]]]) -> dict[str, str]:
    """Create a flat record for CSV export."""

    def flatten(entry: tuple[datetime, str] | None) -> tuple[str, str, str]:
        if entry is None:
            return "", "", ""
        dt, img_id = entry
        delta_days = (dt - event_date).days
        return dt.strftime("%Y-%m-%d"), str(delta_days), img_id.split("/")[-1]

    before_entry = passes["before"][0] if passes["before"] else None
    after_entry = passes["after"][0] if passes["after"] else None

    before_date, before_offset, before_id = flatten(before_entry)
    after_date, after_offset, after_id = flatten(after_entry)

    return {
        "event_id": event_id,
        "event_date": event_date.strftime("%Y-%m-%d"),
        "closest_before_date": before_date,
        "closest_before_offset_days": before_offset,
        "closest_before_image_id": before_id,
        "closest_after_date": after_date,
        "closest_after_offset_days": after_offset,
        "closest_after_image_id": after_id,
        "total_passes_in_window": str(len(passes["all"])),
    }


def main() -> None:
    initialize_gee()
    aoi = load_polygon(AOI_PATH)
    print(f"Loaded AOI from {AOI_PATH}")
    print(
        f"Listing Sentinel-1 passes with lookback {LOOKBACK_DAYS} days "
        f"and lookahead {LOOKAHEAD_DAYS} days for all NOAA Raleigh flood events\n"
    )

    records: list[dict[str, str]] = []

    kept = 0
    skipped_no_pass = 0
    skipped_no_after = 0

    for event_date, event_id in iter_events(CSV_PATH):
        passes = collect_passes(event_date, aoi)
        if not passes["all"]:
            skipped_no_pass += 1
            continue

        after_entry = passes["after"][0] if passes["after"] else None
        if after_entry is None:
            skipped_no_after += 1
            continue

        print(f"Event date: {event_date.date()} (event_id={event_id})")
        print(describe_closest(event_date, passes))
        print("-" * 60)
        records.append(format_record(event_id, event_date, passes))
        kept += 1

    headers = [
        "event_id",
        "event_date",
        "closest_before_date",
        "closest_before_offset_days",
        "closest_before_image_id",
        "closest_after_date",
        "closest_after_offset_days",
        "closest_after_image_id",
        "total_passes_in_window",
    ]

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

    print(f"\nSaved summary to {OUTPUT_PATH}")
    print(
        f"Kept {kept} events with valid after-pass, "
        f"skipped {skipped_no_after} lacking post-event coverage, "
        f"skipped {skipped_no_pass} with no passes in window."
    )


if __name__ == "__main__":
    main()

