# Study Description and Final Results

Summary of the revised methodology and validation results (2015–2025, independent N−M test). Use this when drafting the manuscript.

## What We Did

### Goal

Map recurring urban flood hotspots in **Raleigh, NC** and **Houston, TX** using **Sentinel-1 SAR** combined with **NOAA** flood reports and **USGS** stream gauge data, then validate the map in a way that addresses reviewer concerns about circular evaluation and overfitted thresholds.

### Study period

**2015–2025** for all screening, mapping, and validation — aligned with Sentinel-1 availability (operational from late 2014). Events before 2015 are excluded because no SAR imagery existed.

### Cities

**Raleigh and Houston were processed independently.** Thresholds, maps, and validation were not shared across cities.

---

### Data and event framework

For each city we worked with three groups of NOAA flood events:

| Group | Meaning | Role |
|-------|---------|------|
| **N** | All NOAA flood events with coordinates (2015–2025) | Screening universe |
| **M** | Events with usable Sentinel-1 before/after image pairs | **Build the flood map** |
| **N − M** | NOAA floods **without** SAR coverage | **Independent validation** |

**M events** were used to:

1. Tune and lock flood-detection thresholds (on a **training subset** only)
2. Detect flooding per event from SAR backscatter change
3. Aggregate detections into an **ever-flooded map** (pixel = flooded in ≥1 event)

**N − M events** were **never** used to build the map. Their NOAA report locations serve as an independent reference: do other documented floods fall where SAR saw flooding in other years?

---

### Flood detection method

- **Sensor:** Copernicus Sentinel-1 GRD (VV and VH when available)
- **Approach:** Compare pre- and post-storm images; flood = backscatter decrease below a fixed dB threshold
- **Locked thresholds** (after training, same for all events in a city):
  - **−1.8 dB** when both VV and VH are available
  - **−2.0 dB** when only VV is available
- **Adaptive per-scene thresholds:** turned **off** for evaluation (to avoid leaking information from the test event)
- **Masks:** Permanent water excluded; speckle filtering applied; urban mask used for hotspot display; validation used a **pre-urban** ever-flooded layer (generous)

**Threshold training (per city, subset of M only):**

| City | Train composites (event IDs) |
|------|------------------------------|
| Raleigh | `755610`, `775029_and_1_more` |
| Houston | `579534`, `675235_and_1_more`, `710731`, `830461_and_1_more` |

Thresholds were locked **before** building the full map and **before** independent validation.

---

### Maps produced

1. **Ever-flooded map** — union of all flood detections across M events (used for validation)
2. **Hotspot frequency map** — counts how many M events flooded each pixel (e.g., 1×, 2–3×, 4+×)

**SAR events in map:**

| City | SAR composites in map |
|------|------------------------|
| Raleigh | 5 |
| Houston | 10 (+ 1 non-flood control excluded from mapping) |

**Hotspot statistics (from GEE runs):**

| City | Max frequency at one pixel |
|------|----------------------------|
| Raleigh | 3 |
| Houston | 6 |

---

### Validation design (revision from original paper)

**Original approach (replaced):**

- Tune thresholds using NOAA locations on the same events
- Build one aggregate map from all events
- Score NOAA points against that map → **88.9% at 1 km** (circular, overoptimistic)

**New approach:**

- **Map:** built from **M** SAR events only
- **Test:** **N − M** NOAA locations (independent — not in the map)
- **Metric:** **buffered detection recall** — fraction of independent NOAA points with ≥1 detected flood pixel within a distance buffer
- **Buffers reported:** **100 m, 250 m, 500 m, 1000 m**

See also: [`validation_independence.md`](validation_independence.md)

---

## Final Results

### Independent validation (headline — use in paper)

Reference: NOAA locations from **N − M** events vs **ever-flooded** SAR map.

| Buffer | Raleigh (n = 36 in AOI) | Houston (n = 28 in AOI) |
|--------|-------------------------|-------------------------|
| **100 m** | 13/36 = **36%** | 3/28 = **11%** |
| **250 m** | 22/36 = **61%** | 10/28 = **36%** |
| **500 m** | 32/36 = **89%** | 17/28 = **61%** |
| **1000 m** | 36/36 = **100%** | 25/28 = **89%** |

Notes:

- Raleigh: 37 independent points total; 1 outside focus AOI → 36 used in recall
- Houston: 29 independent points total; 1 outside focus AOI → 28 used in recall
- **Do not** report diagnostic M-event recall (same events that built the map)

### Interpretation

- Recall **increases with buffer distance** in both cities — expected and internally consistent.
- **Raleigh:** strong agreement at 500 m and 1000 m; moderate at 250 m; weaker at 100 m.
- **Houston:** 89% at 1000 m but only 11% at 100 m — larger metro AOI, more dispersed NOAA reports, bayou-scale SAR detections.
- The old **88.9%** figure should **not** be used; it mixed training and test events and relied on a single 1 km buffer on a circular design.

---

## Draft Results paragraph

> Independent validation used NOAA-reported flood locations from events without Sentinel-1 coverage (N−M), which did not contribute to the ever-flooded map built from SAR events (M). Buffered detection recall increased with tolerance distance as expected. For Raleigh (n = 36), recall was 36% at 100 m, 61% at 250 m, 89% at 500 m, and 100% at 1000 m. For Houston (n = 28), recall was 11% at 100 m, 36% at 250 m, 61% at 500 m, and 89% at 1000 m. Houston's lower recall at fine buffers likely reflects the larger metropolitan AOI and greater spatial spread of report locations relative to bayou-aligned flood detections. Detection thresholds (−1.8 dB VV+VH, −2.0 dB VV-only) were locked per city using a training subset of M events before map construction.

---

## Limitations (for Discussion)

- NOAA remains the spatial reference (not independent aerial imagery or FEMA zones for headline metric)
- 100 m recall is limited, especially in Houston
- Ever-flooded layer is intentionally generous
- NOAA point locations carry positional uncertainty
- Hotspot frequency map and validation ever-flooded layer answer different questions

---

## Reproducibility

```bash
python3 code/validation/build_independent_validation.py
```

GEE: paste `code/gee_mapping/generate_flood_hotspots_gee_upload.js` into Earth Engine; set `selectedCity` to `raleigh` or `houston`.

Config: [`data/processed/validation_split.json`](../data/processed/validation_split.json)
