#!/usr/bin/env python3
"""Match flood events with Sentinel-1, Sentinel-2, and Landsat imagery.

This script generalises the earlier Raleigh-only matcher so it can be reused for
any city as long as the flood-event catalogue and AOI GeoJSON are supplied.

Example usage:
    python code/gee/match_event_imagery.py --city raleigh
    python code/gee/match_event_imagery.py --event-csv data/raw/raleigh/event_detection/noaa_raleigh_flood_events.csv \
        --aoi data/raleigh_aoi.json --output data/raw/raleigh/event_detection/event_imagery_matches.csv

The output CSV contains the curated imagery metadata that the GEE visualisation
script reads (or that can be manually copied into the curated event list).
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import ee

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_CITY_CONFIG = {
    "raleigh": {
        "event_csv": Path("data/raw/raleigh/event_detection/noaa_raleigh_flood_events.csv"),
        "aoi": Path("data/raleigh_aoi.json"),
        "output": Path("data/raw/raleigh/event_detection/event_imagery_matches.csv"),
    },
    "houston": {
        "event_csv": Path("data/raw/houston/event_detection/noaa_houston_flood_events.csv"),
        "aoi": Path("data/houston_aoi.json"),
        "output": Path("data/raw/houston/event_detection/event_imagery_matches.csv"),
    },
}

PROJECT_ID = "science-project-1-394520"

# How far before/after an event we search for imagery per sensor.
LOOKBACK_DAYS_S1 = 20
LOOKAHEAD_DAYS_S1 = 3
LOOKBACK_DAYS_OPTICAL = 12
LOOKAHEAD_DAYS_OPTICAL = 5

# Minimum valid pixel ratio required to accept an optical scene. If no scene
# reaches this threshold we still record the best one but note the low coverage.
MIN_VALID_FRACTION = 0.15

MAX_CANDIDATES = 12  # max collections pulled back for evaluation per window


@dataclass
class ImagerySelection:
    date: Optional[datetime]
    image_id: Optional[str]
    offset_days: Optional[int]
    valid_fraction: Optional[float] = None

    def as_csv_fields(self, prefix: str) -> dict[str, str]:
        def fmt(value: Optional[datetime | int | float | str]) -> str:
            if value is None:
                return ""
            if isinstance(value, datetime):
                return value.strftime("%Y-%m-%d")
            if isinstance(value, float):
                return f"{value:.3f}"
            return str(value)

        return {
            f"{prefix}_date": fmt(self.date),
            f"{prefix}_offset_days": fmt(self.offset_days),
            f"{prefix}_image_id": fmt(self.image_id),
            f"{prefix}_valid_fraction": fmt(self.valid_fraction),
        }


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--city", choices=sorted(DEFAULT_CITY_CONFIG.keys()), help="City key to use predefined paths")
    parser.add_argument("--event-csv", type=Path, help="Path to flood-event CSV (NOAA export)")
    parser.add_argument("--aoi", type=Path, help="Path to AOI GeoJSON")
    parser.add_argument("--output", type=Path, help="Where to write the imagery summary CSV")
    parser.add_argument("--min-optical-fraction", type=float, default=MIN_VALID_FRACTION,
                        help="Minimum valid pixel fraction required for optical imagery (default: %(default)s)")
    parser.add_argument("--max-candidates", type=int, default=MAX_CANDIDATES,
                        help="Maximum number of imagery candidates to evaluate per window (default: %(default)s)")
    parser.add_argument("--project", default=PROJECT_ID, help="Earth Engine project ID for authentication")
    return parser.parse_args()


def resolve_paths(args: argparse.Namespace) -> tuple[Path, Path, Path]:
    if args.city:
        config = DEFAULT_CITY_CONFIG.get(args.city)
        if not config:
            raise SystemExit(f"No configuration found for city '{args.city}'.")
        event_csv = args.event_csv or config["event_csv"]
        aoi_path = args.aoi or config["aoi"]
        output = args.output or config["output"]
    else:
        if not (args.event_csv and args.aoi and args.output):
            raise SystemExit("When --city is not provided you must specify --event-csv, --aoi, and --output.")
        event_csv = args.event_csv
        aoi_path = args.aoi
        output = args.output
    return event_csv, aoi_path, output


def initialize_gee(project_id: str) -> None:
    ee.Initialize(project=project_id)


def load_aoi(path: Path) -> ee.Geometry:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    coords = data["features"][0]["geometry"]["coordinates"]
    geom_type = data["features"][0]["geometry"]["type"]
    if geom_type == "Polygon":
        return ee.Geometry.Polygon(coords)
    if geom_type == "MultiPolygon":
        return ee.Geometry.MultiPolygon(coords)
    raise ValueError(f"Unsupported AOI geometry type: {geom_type}")


def read_events(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def to_datetime(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%m/%d/%Y")


def days_offset(image_dt: datetime, event_dt: datetime) -> int:
    return int((image_dt - event_dt).days)


# ---------------------------------------------------------------------------
# Sentinel-1 helpers
# ---------------------------------------------------------------------------


def match_sentinel1(event_dt: datetime, aoi: ee.Geometry, max_candidates: int) -> tuple[ImagerySelection, ImagerySelection, int]:
    start = (event_dt - timedelta(days=LOOKBACK_DAYS_S1)).strftime("%Y-%m-%d")
    end = (event_dt + timedelta(days=LOOKAHEAD_DAYS_S1 + 1)).strftime("%Y-%m-%d")
    collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .sort("system:time_start")
        .limit(max_candidates * 2)
    )

    times = collection.aggregate_array("system:time_start").getInfo()
    ids = collection.aggregate_array("system:id").getInfo()
    entries = []
    for ts_ms, img_id in zip(times, ids):
        dt = datetime.utcfromtimestamp(ts_ms / 1000.0)
        entries.append((dt, img_id))

    before_candidates = [ImagerySelection(date=dt, image_id=img_id, offset_days=days_offset(dt, event_dt))
                         for dt, img_id in entries if dt <= event_dt]
    after_candidates = [ImagerySelection(date=dt, image_id=img_id, offset_days=days_offset(dt, event_dt))
                        for dt, img_id in entries if dt >= event_dt]

    def pick_s1(candidates: list[ImagerySelection], reverse: bool) -> Optional[ImagerySelection]:
        if not candidates:
            return None
        # For before we want the latest (closest to event), for after earliest.
        sorted_candidates = sorted(candidates, key=lambda c: c.offset_days or 0, reverse=reverse)
        return sorted_candidates[0]

    before = pick_s1(before_candidates, reverse=True)
    after = pick_s1(after_candidates, reverse=False)
    return before, after, len(entries)


# ---------------------------------------------------------------------------
# Optical helpers
# ---------------------------------------------------------------------------


def mask_sentinel2(image: ee.Image) -> ee.Image:
    scaled = image.select(["B4", "B3", "B2"]).divide(10000)
    if ee.Algorithms.IsEqual(image.bandNames().contains("SCL"), ee.Number(1)):
        scl = image.select("SCL")
        mask = (scl.neq(3).And(scl.neq(7)).And(scl.neq(8))
                .And(scl.neq(9)).And(scl.neq(10)).And(scl.neq(11)))
        scaled = scaled.updateMask(mask)
    return scaled


def mask_landsat(image: ee.Image) -> ee.Image:
    qa = image.select("QA_PIXEL")
    cloud_shadow = 1 << 4
    clouds = 1 << 3
    mask = qa.bitwiseAnd(cloud_shadow).eq(0).And(qa.bitwiseAnd(clouds).eq(0))
    scaled = image.select(["SR_B4", "SR_B3", "SR_B2"]).multiply(0.0000275).add(-0.2)
    return scaled.rename(["red", "green", "blue"]).updateMask(mask)


def compute_valid_fraction(image: ee.Image, band_name: str, aoi: ee.Geometry) -> Optional[float]:
    mask_img = image.mask().select(band_name)
    stats = mask_img.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=aoi,
        scale=30,
        maxPixels=1_000_000_000,
        bestEffort=True,
    ).getInfo()
    if not stats:
        return None
    value = list(stats.values())[0]
    if value is None:
        return None
    # Clamp due to potential numerical issues.
    return max(0.0, min(1.0, float(value)))


def gather_optical_candidates(collection: ee.ImageCollection, mask_fn, band_name: str,
                              aoi: ee.Geometry, event_dt: datetime,
                              max_candidates: int) -> list[ImagerySelection]:
    collection = collection.sort("system:time_start").limit(max_candidates)
    ids = collection.aggregate_array("system:id").getInfo()
    times = collection.aggregate_array("system:time_start").getInfo()
    candidates: list[ImagerySelection] = []
    for img_id, ts_ms in zip(ids, times):
        dt = datetime.utcfromtimestamp(ts_ms / 1000.0)
        image = mask_fn(ee.Image(img_id))
        try:
            valid_fraction = compute_valid_fraction(image, band_name, aoi)
        except Exception:
            valid_fraction = None
        candidates.append(
            ImagerySelection(
                date=dt,
                image_id=img_id,
                offset_days=days_offset(dt, event_dt),
                valid_fraction=valid_fraction,
            )
        )
    return candidates


def choose_best_optical(candidates: list[ImagerySelection], is_before: bool,
                        event_dt: datetime, min_fraction: float) -> Optional[ImagerySelection]:
    if is_before:
        candidates = [c for c in candidates if c.date and c.date <= event_dt]
    else:
        candidates = [c for c in candidates if c.date and c.date >= event_dt]
    if not candidates:
        return None

    def score(c: ImagerySelection) -> tuple[float, float]:
        frac = c.valid_fraction if c.valid_fraction is not None else 0.0
        offset_penalty = abs(c.offset_days or 0)
        return (-frac, offset_penalty)

    candidates.sort(key=score)
    best = candidates[0]
    # If best fraction is below the threshold, keep it but note via valid_fraction.
    return best


def match_optical(event_dt: datetime, aoi: ee.Geometry, collection_id: str,
                  mask_fn, band_name: str, max_candidates: int,
                  min_valid_fraction: float) -> tuple[Optional[ImagerySelection], Optional[ImagerySelection]]:
    start = event_dt - timedelta(days=LOOKBACK_DAYS_OPTICAL)
    end = event_dt + timedelta(days=LOOKAHEAD_DAYS_OPTICAL)
    collection = ee.ImageCollection(collection_id).filterBounds(aoi).filterDate(start, end)

    before_candidates = gather_optical_candidates(
        collection.filterDate(start, event_dt + timedelta(days=1)),
        mask_fn, band_name, aoi, event_dt, max_candidates,
    )
    after_candidates = gather_optical_candidates(
        collection.filterDate(event_dt, end + timedelta(days=1)),
        mask_fn, band_name, aoi, event_dt, max_candidates,
    )

    best_before = choose_best_optical(before_candidates, True, event_dt, min_valid_fraction)
    best_after = choose_best_optical(after_candidates, False, event_dt, min_valid_fraction)

    return best_before, best_after


# ---------------------------------------------------------------------------
# Main processing loop
# ---------------------------------------------------------------------------


def build_record(city: str, event_row: dict[str, str], aoi: ee.Geometry,
                 min_fraction: float, max_candidates: int) -> Optional[dict[str, str]]:
    event_dt = to_datetime(event_row["BEGIN_DATE"])
    event_id = event_row["EVENT_ID"]

    s1_before, s1_after, s1_total = match_sentinel1(event_dt, aoi, max_candidates)
    if not s1_after:
        # Without an after-scene we cannot meaningfully compare flooding impact.
        return None

    s2_before, s2_after = match_optical(
        event_dt,
        aoi,
        "COPERNICUS/S2_SR",
        mask_sentinel2,
        "B4",
        max_candidates,
        min_fraction,
    )

    landsat_before, landsat_after = match_optical(
        event_dt,
        aoi,
        "LANDSAT/LC08/C02/T1_L2",
        mask_landsat,
        "red",
        max_candidates,
        min_fraction,
    )

    record: dict[str, str] = {
        "city": city,
        "event_id": event_id,
        "event_date": event_dt.strftime("%Y-%m-%d"),
        "s1_total_passes": str(s1_total),
    }

    def update(prefix: str, selection: Optional[ImagerySelection]) -> None:
        record.update(selection.as_csv_fields(prefix) if selection else {
            f"{prefix}_date": "",
            f"{prefix}_offset_days": "",
            f"{prefix}_image_id": "",
            f"{prefix}_valid_fraction": "",
        })

    update("s1_before", s1_before)
    update("s1_after", s1_after)
    update("s2_before", s2_before)
    update("s2_after", s2_after)
    update("landsat_before", landsat_before)
    update("landsat_after", landsat_after)

    return record


# ---------------------------------------------------------------------------


def main() -> None:
    args = parse_args()
    event_csv, aoi_path, output = resolve_paths(args)

    initialize_gee(args.project)
    aoi = load_aoi(aoi_path)
    events = read_events(event_csv)

    city = args.city or "custom"
    records: list[dict[str, str]] = []
    skipped_no_s1_after = 0

    for row in events:
        record = build_record(city, row, aoi, args.min_optical_fraction, args.max_candidates)
        if record is None:
            skipped_no_s1_after += 1
            continue
        records.append(record)
        print(f"Processed event {record['event_id']} ({record['event_date']})")

    headers = [
        "city",
        "event_id",
        "event_date",
        "s1_total_passes",
        "s1_before_date",
        "s1_before_offset_days",
        "s1_before_image_id",
        "s1_before_valid_fraction",
        "s1_after_date",
        "s1_after_offset_days",
        "s1_after_image_id",
        "s1_after_valid_fraction",
        "s2_before_date",
        "s2_before_offset_days",
        "s2_before_image_id",
        "s2_before_valid_fraction",
        "s2_after_date",
        "s2_after_offset_days",
        "s2_after_image_id",
        "s2_after_valid_fraction",
        "landsat_before_date",
        "landsat_before_offset_days",
        "landsat_before_image_id",
        "landsat_before_valid_fraction",
        "landsat_after_date",
        "landsat_after_offset_days",
        "landsat_after_image_id",
        "landsat_after_valid_fraction",
    ]

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

    print(f"\nWrote {len(records)} matched events to {output}")
    if skipped_no_s1_after:
        print(f"Skipped {skipped_no_s1_after} events without a Sentinel-1 after-scene.")


if __name__ == "__main__":
    main()
