#!/usr/bin/env python3
"""
Minimal FEMA NFHL comparison for reviewer #4.

1. Fetch SFHA polygons (FEMA MapServer) for each city AOI.
2. Report % of independent N-M NOAA points inside FEMA SFHA.

Pixel-level SAR vs FEMA area overlap: run GEE block in generate_flood_hotspots.js
after uploading data/external/nfhl_{city}_sfha.geojson as an Earth Engine asset.

Regenerate: python3 code/validation/compute_fema_overlap.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

VALIDATION_DIR = Path(__file__).resolve().parent
if str(VALIDATION_DIR) not in sys.path:
    sys.path.insert(0, str(VALIDATION_DIR))

from fema_nfhl import fetch_sfha_geojson, iter_point_results

ROOT = Path(__file__).resolve().parents[2]
SPLIT_PATH = ROOT / "data/processed/validation_split.json"
OUT_PATH = ROOT / "data/processed/fema_overlap.json"


def summarize_city(city: str, split: dict) -> dict:
    geojson = fetch_sfha_geojson(city)
    points = split["cities"][city]["independent_test_points"]
    scored = list(iter_point_results(points, geojson))
    in_sfha = [p for p in scored if p["in_sfha"]]
    n = len(scored)
    n_in = len(in_sfha)
    return {
        "city": city,
        "nfhl_sfha_features": len(geojson.get("features", [])),
        "nm_independent_points": n,
        "points_in_sfha": n_in,
        "points_outside_sfha": n - n_in,
        "pct_in_sfha": round(100 * n_in / n, 1) if n else 0.0,
        "pct_outside_sfha": round(100 * (n - n_in) / n, 1) if n else 0.0,
        "source": "FEMA NFHL MapServer layer 28 (SFHA_TF=T)",
        "cache_geojson": f"data/external/nfhl_{city}_sfha.geojson",
    }


def main() -> None:
    split = json.loads(SPLIT_PATH.read_text(encoding="utf-8"))
    cities = {}
    for city in ("raleigh", "houston"):
        cities[city] = summarize_city(city, split)

    result = {
        "comment": "reviewer_4_fema_baseline",
        "scope": "minimal_point_in_sfha; pixel overlap via GEE asset upload",
        "headline_validation": "NOAA N-M recall remains primary; FEMA is supplementary context",
        "gee_area_overlap": {
            "script": "code/gee_mapping/generate_flood_hotspots.js",
            "config_key": "FEMA_NFHL_ASSETS",
            "upload": "Upload nfhl_{city}_sfha.geojson from data/external/ to EE Assets",
        },
        "cities": cities,
    }
    OUT_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")
    for city, row in cities.items():
        print(
            f"\n{city.title()} N-M points in FEMA SFHA: "
            f"{row['points_in_sfha']}/{row['nm_independent_points']} "
            f"({row['pct_in_sfha']:.1f}%)"
        )
    print("\nPixel overlap: upload NFHL geojson to GEE and set FEMA_NFHL_ASSETS (see doc #4).")


if __name__ == "__main__":
    main()
