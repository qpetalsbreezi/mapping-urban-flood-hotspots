#!/usr/bin/env python3
"""
Wilson 95% confidence intervals for independent N-M buffered detection recall.

Hit counts from GEE ever-flooded validation (generate_flood_hotspots.js).
Regenerate: python3 code/validation/compute_recall_ci.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "data/processed/recall_with_ci.json"

# Independent N-M NOAA recall (hits, total) per city and buffer (m)
NM_RECALL_HITS = {
    "raleigh": {
        100: (13, 36),
        250: (22, 36),
        500: (32, 36),
        1000: (36, 36),
    },
    "houston": {
        100: (3, 28),
        250: (10, 28),
        500: (17, 28),
        1000: (25, 28),
    },
}

BUFFERS_M = [100, 250, 500, 1000]
Z_95 = 1.96


def wilson_ci(successes: int, n: int, z: float = Z_95) -> tuple[float, float]:
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    margin = z * math.sqrt((p * (1 - p) + z**2 / (4 * n)) / n) / denom
    return (max(0.0, centre - margin), min(1.0, centre + margin))


def pct(x: float) -> float:
    return round(100 * x, 1)


def build_table() -> dict:
    cities = {}
    for city, by_buffer in NM_RECALL_HITS.items():
        rows = []
        for buffer_m in BUFFERS_M:
            hits, total = by_buffer[buffer_m]
            lo, hi = wilson_ci(hits, total)
            rows.append(
                {
                    "buffer_m": buffer_m,
                    "hits": hits,
                    "total": total,
                    "recall_pct": pct(hits / total),
                    "ci95_low_pct": pct(lo),
                    "ci95_high_pct": pct(hi),
                    "ci95_label": f"{pct(lo):.0f}–{pct(hi):.0f}%",
                }
            )
        cities[city] = rows
    return {
        "metric": "buffered_detection_recall",
        "reference": "noaa_nm_independent_test",
        "ci_method": "wilson_95",
        "buffers_m": BUFFERS_M,
        "cities": cities,
    }


def main() -> None:
    result = build_table()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")
    for city, rows in result["cities"].items():
        print(f"\n{city.title()} (N-M independent test)")
        for row in rows:
            print(
                f"  {row['buffer_m']:4d} m: {row['hits']}/{row['total']} = "
                f"{row['recall_pct']:.0f}%  (95% CI {row['ci95_label']})"
            )


if __name__ == "__main__":
    main()
