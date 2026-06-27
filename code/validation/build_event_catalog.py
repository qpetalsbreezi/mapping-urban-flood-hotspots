#!/usr/bin/env python3
"""
Build reproducible event catalog for reviewer comment #18 (2015-2025 study period).

Outputs:
  data/processed/event_catalog_2015_2025.csv
  data/processed/event_catalog_sar_composites_2015_2025.csv
"""

from __future__ import annotations

import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STUDY_YEAR_MIN = 2015
STUDY_YEAR_MAX = 2025

# NOAA event ID -> GEE composite ID (source of truth for mapping roles; see generate_flood_hotspots_gee_upload.js)
GEE_NOAA_TO_COMPOSITE: dict[str, dict[str, str]] = {
    "raleigh": {
        "755610": "755610",
        "775029": "775029_and_1_more",
        "775031": "775029_and_1_more",
        "1029187": "1029187",
        "1173317": "1173317",
        "1208432": "1208432",
    },
    "houston": {
        "579534": "579534",
        "675235": "675098",
        "675098": "675235_and_1_more",
        "710731": "710731",
        "710726": "710726_and_1_more",
        "710727": "710726_and_1_more",
        "721084": "721084_and_5_more",
        "721085": "721084_and_5_more",
        "721091": "721084_and_5_more",
        "721096": "721084_and_5_more",
        "721101": "721084_and_5_more",
        "721136": "721084_and_5_more",
        "830461": "830461_and_1_more",
        "830464": "830461_and_1_more",
        "857803": "857803_and_4_more",
        "858108": "857803_and_4_more",
        "858116": "857803_and_4_more",
        "858117": "857803_and_4_more",
        "869176": "857803_and_4_more",
        "899524": "899524",
        "963117": "963117",
        "1004355": "1004355_and_4_more",
        "1004356": "1004355_and_4_more",
        "1004366": "1004355_and_4_more",
        "1004373": "1004355_and_4_more",
        "1004376": "1004355_and_4_more",
    },
}

GEE_SAR = {
    "raleigh": {
        "train": ["755610", "775029_and_1_more"],
        "map": ["755610", "775029_and_1_more", "1029187", "1173317", "1208432"],
    },
    "houston": {
        "train": ["579534", "675235_and_1_more", "710731", "830461_and_1_more"],
        "map": [
            "579534", "675235_and_1_more", "710731", "710726_and_1_more",
            "721084_and_5_more", "830461_and_1_more", "857803_and_4_more",
            "899524", "963117", "1004355_and_4_more",
        ],
        "control": "control_2024-10-15",
    },
}

GAGE = {
    # Reference levels for catalog column usgs_exceeds_city_threshold only — NOT inclusion filters.
    "raleigh": {"id": "02087324", "name": "Crabtree Creek", "threshold_ft": 10.0},
    "houston": {"id": "08073700", "name": "Buffalo Bayou", "threshold_ft": 40.0},
}


def parse_noaa_date(s: str) -> datetime | None:
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s.strip(), fmt)
        except ValueError:
            continue
    return None


def load_usgs_daily(city: str) -> dict[str, float]:
    path = ROOT / "data" / "raw" / city / "event_detection" / (
        "usgs_crabtree_creek_data.csv" if city == "raleigh" else "usgs_buffalo_bayou_data.csv"
    )
    out: dict[str, float] = {}
    with path.open() as f:
        for line in f:
            if not line.startswith("USGS\t"):
                continue
            parts = line.strip().split("\t")
            if len(parts) < 4:
                continue
            date_str = parts[2]
            try:
                out[date_str] = float(parts[3])
            except ValueError:
                continue
    return out


def parse_s1_granule(image_id: str) -> dict[str, str]:
    if not image_id:
        return {}
    granule = image_id.split("/")[-1]
    tokens = granule.split("_")
    if len(tokens) < 5:
        return {"granule": granule}
    rel_orbit = tokens[6] if len(tokens) > 6 else ""
    return {
        "satellite": tokens[0],
        "mode": tokens[1],
        "product": tokens[2],
        "polarization": tokens[3],
        "relative_orbit": rel_orbit,
    }


def load_sar_composites(city: str) -> list[dict]:
    path = ROOT / "data" / "raw" / city / "event_detection" / "event_imagery_matches.csv"
    rows = []
    with path.open() as f:
        for row in csv.DictReader(f):
            meta = parse_s1_granule(row.get("s1_before_image_id", ""))
            rows.append(
                {
                    "city": city,
                    "composite_id": row["event_id"],
                    "event_date": row["event_date"],
                    "noaa_event_ids": row.get("noaa_event_ids", ""),
                    "s1_before_date": row.get("s1_before_date", ""),
                    "s1_after_date": row.get("s1_after_date", ""),
                    "s1_before_offset_days": row.get("s1_before_offset_days", ""),
                    "s1_after_offset_days": row.get("s1_after_offset_days", ""),
                    "s1_before_image_id": row.get("s1_before_image_id", ""),
                    "s1_after_image_id": row.get("s1_after_image_id", ""),
                    **meta,
                }
            )
    return rows


def build_noaa_to_composite(city: str) -> dict[str, dict]:
    mapping: dict[str, dict] = {}
    for comp in load_sar_composites(city):
        for eid in comp["noaa_event_ids"].split(";"):
            eid = eid.strip()
            if eid:
                mapping[eid] = comp
    return mapping


def classify_noaa(city: str, event_id: str) -> tuple[str, str, str]:
    """Return (study_role, reason, gee_composite_id)."""
    cfg = GEE_SAR[city]
    gee_comp = GEE_NOAA_TO_COMPOSITE.get(city, {}).get(event_id, "")
    if gee_comp:
        if gee_comp in cfg["train"]:
            return (
                "map_sar_threshold_train",
                "included_in_gee_map_and_threshold_training",
                gee_comp,
            )
        if gee_comp in cfg.get("map", []):
            return "map_sar", "included_in_gee_ever_flooded_map", gee_comp
    noaa_to_comp = build_noaa_to_composite(city)
    if event_id not in noaa_to_comp:
        return "independent_validation", "no_sentinel1_pair_in_pipeline", ""
    return (
        "sar_matched_not_in_gee_map",
        "sentinel1_pair_in_pipeline_but_not_selected_for_gee_map",
        "",
    )


def load_noaa_rows(city: str) -> list[dict]:
    path = ROOT / "data" / "raw" / city / "event_detection" / f"noaa_{city}_flood_events.csv"
    usgs = load_usgs_daily(city)
    gage = GAGE[city]
    noaa_to_comp = build_noaa_to_composite(city)
    rows = []
    with path.open() as f:
        for row in csv.DictReader(f):
            dt = parse_noaa_date(row["BEGIN_DATE"])
            if dt is None:
                continue
            if dt.year < STUDY_YEAR_MIN or dt.year > STUDY_YEAR_MAX:
                continue
            lat = row.get("BEGIN_LAT", "").strip()
            lon = row.get("BEGIN_LON", "").strip()
            if not lat or not lon:
                status = "excluded"
                role = "excluded_no_coordinates"
                reason = "missing_begin_lat_lon"
                gee_comp = ""
            else:
                role, reason, gee_comp = classify_noaa(city, row["EVENT_ID"].strip())
                status = "included"
            iso_date = dt.strftime("%Y-%m-%d")
            gage_ft = usgs.get(iso_date, "")
            exceeds = ""
            if gage_ft != "":
                exceeds = "yes" if float(gage_ft) >= gage["threshold_ft"] else "no"
            eid = row["EVENT_ID"].strip()
            comp = noaa_to_comp.get(eid, {})
            rows.append(
                {
                    "city": city,
                    "noaa_event_id": row["EVENT_ID"].strip(),
                    "event_date": row["BEGIN_DATE"].strip(),
                    "event_date_iso": iso_date,
                    "county": row.get("CZ_NAME_STR", "").strip(),
                    "begin_location": row.get("BEGIN_LOCATION", "").strip(),
                    "event_type": row.get("EVENT_TYPE", "").strip(),
                    "begin_lat": lat,
                    "begin_lon": lon,
                    "catalog_status": status,
                    "study_role": role,
                    "inclusion_or_exclusion_reason": reason,
                    "usgs_gauge_id": gage["id"],
                    "usgs_gage_ft_on_event_date": gage_ft,
                    "usgs_exceeds_city_threshold": exceeds,
                    "gee_composite_id": gee_comp if status == "included" else "",
                    "pipeline_sar_composite_id": comp.get("composite_id", ""),
                    "sar_composite_id": (
                        gee_comp
                        if status == "included" and gee_comp
                        else comp.get("composite_id", "")
                    ),
                    "s1_before_date": comp.get("s1_before_date", ""),
                    "s1_after_date": comp.get("s1_after_date", ""),
                    "s1_pre_lag_days": comp.get("s1_before_offset_days", ""),
                    "s1_post_lag_days": comp.get("s1_after_offset_days", ""),
                    "s1_before_image_id": comp.get("s1_before_image_id", ""),
                    "s1_after_image_id": comp.get("s1_after_image_id", ""),
                    "s1_satellite": comp.get("satellite", ""),
                    "s1_mode": comp.get("mode", ""),
                    "s1_polarization": comp.get("polarization", ""),
                    "s1_relative_orbit": comp.get("relative_orbit", ""),
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        path.write_text("")
        return
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)


def summary_counts(rows: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for r in rows:
        key = r["study_role"]
        counts[key] = counts.get(key, 0) + 1
    return counts


def main() -> int:
    all_noaa: list[dict] = []
    sar_rows: list[dict] = []
    for city in ("raleigh", "houston"):
        all_noaa.extend(load_noaa_rows(city))
        for comp in load_sar_composites(city):
            cfg = GEE_SAR[city]
            cid = comp["composite_id"]
            if cid in cfg.get("map", []):
                map_role = "map_sar_threshold_train" if cid in cfg["train"] else "map_sar"
            else:
                map_role = "sar_composite_not_in_gee_map"
            sar_rows.append(
                {
                    **comp,
                    "study_role": map_role,
                    "in_gee_hotspot_map": "yes" if cid in cfg.get("map", []) else "no",
                    "threshold_train": "yes" if cid in cfg.get("train", []) else "no",
                }
            )

    out_all = ROOT / "data" / "processed" / "event_catalog_2015_2025.csv"
    out_sar = ROOT / "data" / "processed" / "event_catalog_sar_composites_2015_2025.csv"
    write_csv(out_all, all_noaa)
    write_csv(out_sar, sar_rows)

    print(f"Wrote {out_all} ({len(all_noaa)} NOAA rows)")
    print(f"Wrote {out_sar} ({len(sar_rows)} SAR composite rows)")
    for city in ("raleigh", "houston"):
        city_rows = [r for r in all_noaa if r["city"] == city]
        print(f"\n{city.upper()} role counts:")
        for role, n in sorted(summary_counts(city_rows).items()):
            print(f"  {role}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
