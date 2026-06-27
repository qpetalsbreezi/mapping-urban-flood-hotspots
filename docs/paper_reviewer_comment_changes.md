# Paper Changes for Reviewer Comments

Summary of revised methodology, validation results, and documentation updates addressing reviewer feedback. Use this when drafting the manuscript.

## Reviewer comment status (summary)

| # | Topic | Status |
|---|--------|--------|
| **1** | Circular validation | **Partial** — N−M independent test; NOAA still reference |
| **2** | Threshold overfitting | **Addressed** — train subset of M, locked thresholds |
| **3** | 1 km buffer too coarse | **Addressed** — 100, 250, 500, 1000 m buffers |
| **4** | No FEMA baseline | Not done |
| **5** | SAR urban limits | Not done |
| **6** | Unsupported local knowledge | Not done |
| **7** / **11** | Control event | Not done |
| **8** | Gauge thresholds | **Addressed** — not used as filter; catalog metadata only |
| **9** | Image windows | In event catalog (S1 lags) |
| **10** | Precision / IoU | **Partial** — recall only |
| **12**–**17** | Various | Not done |
| **15** | Title / terminology | Not done |
| **18** | Timeline + event table | **Addressed** — 2015–2025 + reproducible catalogs (below) |

---

## What We Did

### Goal

Map recurring urban flood hotspots in **Raleigh, NC** and **Houston, TX** using **Sentinel-1 SAR** combined with **NOAA** flood reports, then validate the map in a way that addresses reviewer concerns about circular evaluation and overfitted thresholds. **USGS gage data** is recorded per event in the supplementary catalog but is **not** used to include or exclude events.

### Study period

**2015–2025** for all screening, mapping, and validation — aligned with Sentinel-1 availability (operational from late 2014). Events before 2015 are excluded because no SAR imagery existed. This replaces the original manuscript’s ambiguous **2010–2025** wording (reviewer **#18**).

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

| City | Train composites (GEE event IDs) |
|------|----------------------------------|
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

## Comment #8 — USGS gauge thresholds (not an inclusion filter)

### Manuscript text (template)

> The event universe consists of NOAA-reported urban flood events with coordinates during **2015–2025**. USGS daily gage height at Crabtree Creek (Raleigh, station 02087324) and Buffalo Bayou (Houston, station 08073700) was recorded for each event date and reported in the supplementary event catalog. **Gage exceedance was not used as an inclusion criterion.** Requiring arbitrary gage cutoffs (e.g., 10 ft / 40 ft from early manual screening) would exclude documented local floods where report locations may not align with downstream gage timing or magnitude. Sentinel-1 availability determines which events contribute to the ever-flooded map (M) versus independent validation (N−M).

### What changed from the original manuscript

| Original claim | Current practice |
|----------------|------------------|
| Events required NOAA **and** USGS above 10 ft / 40 ft | **NOAA + coordinates only** for inclusion |
| ~15 Raleigh / ~9 Houston “major” floods | **49 / 55** events with coordinates (2015–2025) |
| USGS as validation gate | USGS as **supplementary column** in event catalog |

See [`event_selection_methodology.md`](event_selection_methodology.md) for the full pipeline.

---

## Comment #18 — Study period and event-level catalog

### Manuscript text (template)

> All analyses use the **2015–2025** study period, consistent with Sentinel-1 availability. Events before 2015 are excluded from screening, mapping, and validation because no SAR imagery existed. A complete event-level catalog (Table S1 / supplementary CSV) lists every NOAA flood report with coordinates in this window, USGS gauge stage on the event date, Sentinel-1 pairing when available, and the study role of each event (map, threshold training, independent test, or excluded).

### Reproducible catalogs

Regenerate with:

```bash
python3 code/validation/build_event_catalog.py
```

**Outputs:**

| File | Contents |
|------|----------|
| [`data/processed/event_catalog_2015_2025.csv`](../data/processed/event_catalog_2015_2025.csv) | One row per NOAA event (2015–2025) with study role and SAR metadata |
| [`data/processed/event_catalog_sar_composites_2015_2025.csv`](../data/processed/event_catalog_sar_composites_2015_2025.csv) | One row per Sentinel-1 composite from the imagery-matching pipeline |

### NOAA catalog columns

- **Identity:** `noaa_event_id`, `event_date`, `county`, `begin_location`, `begin_lat`, `begin_lon`
- **USGS:** `usgs_gauge_id`, `usgs_gage_ft_on_event_date`, `usgs_exceeds_city_threshold` — **informational only** (legacy reference levels: Raleigh 10 ft, Houston 40 ft; not used for inclusion)
- **SAR:** `gee_composite_id`, `pipeline_sar_composite_id`, `s1_before_date`, `s1_after_date`, `s1_pre_lag_days`, `s1_post_lag_days`, `s1_before_image_id`, `s1_after_image_id`, `s1_polarization`, `s1_relative_orbit`
- **Study role:** `study_role`, `inclusion_or_exclusion_reason`

### `study_role` values

| Role | Meaning |
|------|---------|
| `independent_validation` | N−M — NOAA flood with no SAR pair; used for buffered recall test |
| `map_sar_threshold_train` | In GEE ever-flooded map **and** threshold-training subset |
| `map_sar` | In GEE ever-flooded map only |
| `sar_matched_not_in_gee_map` | SAR pair exists in pipeline but composite not selected for final GEE map |
| `excluded_no_coordinates` | Missing `BEGIN_LAT` / `BEGIN_LON` |

**GEE composite IDs are authoritative** for mapping roles (`generate_flood_hotspots_gee_upload.js`). Pipeline composite IDs may differ (e.g. Raleigh pipeline `775032_and_4_more` vs GEE `775029_and_1_more` for the same July 2018 imagery).

### Event counts (2015–2025, with coordinates)

| City | N (total) | Independent (N−M) | Map SAR | Threshold train (NOAA points) | SAR matched, not in GEE map |
|------|-----------|-------------------|---------|-------------------------------|-----------------------------|
| **Raleigh** | 49 | 37 | 3 | 3 | 6 |
| **Houston** | 55 | 29 | 20 | 5 | 1 |

Houston’s single `sar_matched_not_in_gee_map` event is a pipeline match not carried into the final 10-composite GEE map. Raleigh’s six similar events are July–August 2018 and 2022–2024 storms where SAR pairs exist but were not among the five composites selected for the published map.

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

> Independent validation used NOAA-reported flood locations from events without Sentinel-1 coverage (N−M), which did not contribute to the ever-flooded map built from SAR events (M). Buffered detection recall increased with tolerance distance as expected. For Raleigh (n = 36), recall was 36% at 100 m, 61% at 250 m, 89% at 500 m, and 100% at 1000 m. For Houston (n = 28), recall was 11% at 100 m, 36% at 250 m, 61% at 500 m, and 89% at 1000 m. Houston's lower recall at fine buffers likely reflects the larger metropolitan AOI and greater spatial spread of report locations relative to bayou-aligned flood detections. Detection thresholds (−1.8 dB VV+VH, −2.0 dB VV-only) were locked per city using a training subset of M events before map construction. All events are documented in a supplementary event catalog for 2015–2025 (Table S1).

---

## Limitations (for Discussion)

- NOAA remains the spatial reference (not independent aerial imagery or FEMA zones for headline metric)
- USGS gage at a single station may not reflect localized floods at NOAA report locations; gage was not used to filter events
- 100 m recall is limited, especially in Houston
- Ever-flooded layer is intentionally generous
- NOAA point locations carry positional uncertainty
- Hotspot frequency map and validation ever-flooded layer answer different questions

---

## Reproducibility

```bash
python3 code/validation/build_independent_validation.py
python3 code/validation/build_event_catalog.py
```

GEE: paste `code/gee_mapping/generate_flood_hotspots_gee_upload.js` into Earth Engine; set `selectedCity` to `raleigh` or `houston`.

Config: [`data/processed/validation_split.json`](../data/processed/validation_split.json)
