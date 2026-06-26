# Validation Independence Protocol

Study period: **2015–2025** (Sentinel‑1 operational from late 2014; all analysis and metrics use this window).

Addresses **reviewer comments 1 and 2** using a design that matches the **universal ever-flooded hotspot map**.

## Core idea

| Set | Definition | Role |
|-----|------------|------|
| **N** | All NOAA flood events in the city (with coordinates) | Screening universe |
| **M** | NOAA events linked to Sentinel-1 composites | **Build the ever-flooded map** |
| **N − M** | NOAA events with **no** SAR coverage | **Independent test** locations |

```
M events (SAR)  →  detect floods  →  ever-flooded map (union across all M)
N−M events      →  NOAA report points only  →  test: do they fall on the map?
```

**N − M events never contributed to the map** → much less circular than tuning and scoring on the same events.

Cities are **fully independent** (Raleigh thresholds tuned on Raleigh train-M only; Houston on Houston train-M only).

## Locked thresholds

| Parameter | Value |
|-----------|-------|
| VV+VH | **−1.8 dB** |
| VV-only | **−2.0 dB** |
| Adaptive mode | **off** |

Tune on a **train subset of M** per city, then lock before building the map from **all M**.

### Threshold-train composites (subset of M)

**Houston (4):** `579534`, `675235_and_1_more`, `710731`, `830461_and_1_more`

**Raleigh (2):** `755610`, `775029_and_1_more`

## Validation metric (generous)

**Buffered detection recall** against the **ever-flooded** layer (any pixel flooded in ≥1 M event):

> Of NOAA report points from **N−M** events, what fraction fall within **100 m, 250 m, 500 m, or 1000 m** of a detected flood pixel?

This is intentionally **generous** (union / “ever flooded”) vs the frequency hotspot (2–3×, 4+×).

## Counts (from NOAA CSVs, 2015–2025 only)

| City | M (SAR-linked NOAA points) | N−M (independent test points) | SAR composites in map |
|------|---------------------------|-------------------------------|------------------------|
| Raleigh | 12 | **37** | 5 |
| Houston | 26 | **29** | 10 |

Regenerate after data changes:

```bash
python3 code/validation/build_independent_validation.py
```

Outputs:
- `data/processed/validation_split.json`
- `code/gee_mapping/independent_validation_locations.js`

## How to run in GEE

1. Open Earth Engine Code Editor.
2. Add **both** scripts to the same project:
   - `code/gee_mapping/independent_validation_locations.js`
   - `code/gee_mapping/generate_flood_hotspots.js`
3. Set `selectedCity` to `houston` or `raleigh`.
4. Confirm `useAdaptiveThreshold = false`.
5. Run and read console:
   - **HEADLINE — independent N−M NOAA test** → manuscript number
   - **DIAGNOSTIC — M-event NOAA points** → circular, do not use as headline

## Manuscript language (template)

> For each city, flood detections from all Sentinel-1–covered events (M) were aggregated into an ever-flooded map. Detection thresholds were selected on a training subset of M events and fixed before map construction. Independent validation used NOAA-reported flood locations from events without Sentinel-1 coverage (N−M), which did not contribute to the map. We report buffered detection recall at 100 m, 250 m, 500 m, and 1000 m: the fraction of these independent NOAA points falling within each buffer of any SAR-detected flood pixel. Houston and Raleigh were processed independently.

## What this fixes vs old paper

| Old approach | New approach |
|--------------|--------------|
| 88.9% from aggregate map + same-event NOAA | N−M independent NOAA vs ever-flooded map |
| Thresholds tuned on all events | Train subset of M per city, then locked |
| Cross-city threshold leakage possible | Cities independent |

## Remaining limitations (still disclose)

- N−M events are still NOAA reports (not aerial imagery or FEMA).
- M-event diagnostic recall will be higher than N−M (expected).

Pre-2015 floods are excluded entirely: no Sentinel‑1 imagery was available in that period.
