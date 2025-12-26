#!/usr/bin/env python3
"""
Filter NOAA Storm Events CSV for flood analysis.

Given one or more NOAA Storm Events CSV files (as downloaded from the NOAA Storm
Events database), this script filters rows by state, county, event type, and
optional keyword matches. The result is written to a new CSV that can be used
as input to the imagery matcher (`match_event_imagery.py`).

Examples:
    # Filter Wake County flood events in NC
    python code/gee/filter_noaa_events.py \
        --input data/raw/noaa/storm_events_*.csv \
        --state NC \
        --county \"WAKE\" \
        --event-types \"Flash Flood,Flood\" \
        --output data/raw/raleigh/event_detection/noaa_raleigh_flood_events.csv

    # Filter Harris County flood events in TX with keyword match on Houston
    python code/gee/filter_noaa_events.py \
        --input data/raw/noaa/storm_events_*.csv \
        --state TX \
        --county \"HARRIS\" \
        --keywords \"Houston\" \
        --output data/raw/houston/event_detection/noaa_houston_flood_events.csv
"""

from __future__ import annotations

import argparse
import csv
import fnmatch
import sys
from pathlib import Path
from typing import Iterable, List


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        required=True,
        nargs="+",
        help="Input NOAA Storm Events CSV file(s). Globs are allowed.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Output CSV path for filtered events.",
    )
    parser.add_argument(
        "--state",
        required=True,
        help="State abbreviation to keep (e.g., NC, TX).",
    )
    parser.add_argument(
        "--county",
        required=True,
        help="County name (case-insensitive, e.g., WAKE, HARRIS).",
    )
    parser.add_argument(
        "--county-fips",
        help="Optional county FIPS code (string). If provided, must match CZ_FIPS.",
    )
    parser.add_argument(
        "--event-types",
        default="Flash Flood,Flood,Coastal Flood",
        help="Comma-separated event types to keep (exact match). Default includes Flash Flood,Flood,Coastal Flood.",
    )
    parser.add_argument(
        "--keywords",
        default="",
        help="Optional comma-separated keywords; at least one must appear (case-insensitive) in EVENT_NARRATIVE or BEGIN_LOCATION.",
    )
    return parser.parse_args()


def expand_inputs(patterns: List[str]) -> List[Path]:
    files: List[Path] = []
    for pattern in patterns:
        p = Path(pattern)
        if "*" in pattern or "?" in pattern or "[" in pattern:
            parent = p.parent if p.parent != Path("") else Path(".")
            name = p.name
            for candidate in parent.glob(name):
                if candidate.is_file():
                    files.append(candidate)
        else:
            if p.is_file():
                files.append(p)
    return files


def keyword_match(row: dict, keywords: Iterable[str]) -> bool:
    text_fields = [
        row.get("EVENT_NARRATIVE", "") or "",
        row.get("EPISODE_NARRATIVE", "") or "",
        row.get("BEGIN_LOCATION", "") or "",
        row.get("END_LOCATION", "") or "",
    ]
    haystack = " ".join(text_fields).lower()
    return any(kw.lower() in haystack for kw in keywords if kw)


def normalize(s: str | None) -> str:
    return (s or "").strip().upper()


def filter_rows(
    files: List[Path],
    state: str,
    county: str,
    county_fips: str | None,
    event_types: List[str],
    keywords: List[str],
) -> List[dict[str, str]]:
    kept: List[dict[str, str]] = []
    for file_path in files:
        with file_path.open("r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if normalize(row.get("STATE_ABBR")) != normalize(state):
                    continue
                if normalize(row.get("CZ_NAME_STR")) != normalize(county):
                    continue
                if county_fips and normalize(row.get("CZ_FIPS")) != normalize(county_fips):
                    continue
                if row.get("EVENT_TYPE", "").strip() not in event_types:
                    continue
                if keywords and not keyword_match(row, keywords):
                    continue
                kept.append(row)
    return kept


def write_output(rows: List[dict[str, str]], output: Path, fieldnames: List[str]) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> None:
    args = parse_args()
    files = expand_inputs(args.input)
    if not files:
        sys.exit(f"No input files found for patterns: {args.input}")

    event_types = [et.strip() for et in args.event_types.split(",") if et.strip()]
    keywords = [kw.strip() for kw in args.keywords.split(",") if kw.strip()]

    rows = filter_rows(files, args.state, args.county, args.county_fips, event_types, keywords)
    if not rows:
        sys.exit("No rows matched the filters.")

    # Use the fieldnames from the first file to preserve column order.
    with files[0].open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []

    write_output(rows, args.output, fieldnames)
    print(f"Wrote {len(rows)} events to {args.output}")


if __name__ == "__main__":
    main()
