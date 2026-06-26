#!/usr/bin/env python3
"""Print summary of validation_split.json (run build_independent_validation.py to regenerate)."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPLIT_PATH = ROOT / "data" / "processed" / "validation_split.json"


def main() -> int:
    if not SPLIT_PATH.exists():
        print(f"Missing {SPLIT_PATH}. Run: python3 code/validation/build_independent_validation.py")
        return 1

    split = json.loads(SPLIT_PATH.read_text())
    print(split.get("approach", "validation split"))
    print("=" * 60)
    for city, data in split.get("cities", {}).items():
        c = data["counts"]
        print(f"{city.upper()}: M={c['m_sar_linked_noaa_points']}, N-M test={c['nm_independent_test_points']}")
    print(f"\nFull config: {SPLIT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
