# Paper Changes for Reviewer Comments

Point-by-point responses for manuscript revision. Use the **status table** for a quick overview, then jump to each **Comment #** section for detail and draft rebuttal text.

---

## Status at a glance

| # | Reviewer concern | Status |
|---|------------------|--------|
| **1** | Circular validation (NOAA used for selection and testing) | **Partial** |
| **2** | Threshold overfitting (dB tuned on same data evaluated) | **Addressed** |
| **3** | 1 km buffer too coarse; ~55% misread as “coin flip” | **Addressed** |
| **4** | No FEMA / baseline comparison | Not done |
| **5** | Urban SAR limits understated | Not done |
| **6** | Unsupported “local knowledge” claims | Not done |
| **7** | Weak control event (one non-flood case) | Not done |
| **8** | Arbitrary USGS gauge thresholds (10 ft / 40 ft) | **Addressed** |
| **9** | Image window bias (30-day pre / 2-day post) | **Partial** |
| **10** | Missing precision, recall terminology, IoU | **Partial** |
| **11** | Control event poorly documented | Not done |
| **12** | Temporal aggregation bias (uneven S1 coverage) | Not done |
| **13** | No flood depth / severity | Not done |
| **14** | No random / simple baselines | Not done |
| **15** | Title and terminology misleading | Not done |
| **16** | Citation accuracy | Not done |
| **17** | Limited statistics (no CIs, per-event breakdown) | Not done |
| **18** | 2010–2025 vs Sentinel-1; need full event table | **Addressed** |

---

## Comment #1 — Circular validation

**Reviewer concern:** NOAA data used for both event selection and accuracy testing; headline **88.9%** likely overoptimistic.

**Status:** **Partial**

### What we did

- **Map (M):** ever-flooded union built only from events with Sentinel-1 pairs.
- **Test (N−M):** NOAA locations from events **without** SAR — never used to build the map.
- **Cities independent:** Raleigh thresholds not tuned on Houston data (and vice versa).

See [`validation_independence.md`](validation_independence.md).

### What remains

- NOAA still defines the **event universe** and the **spatial reference** (not FEMA, aerial imagery, or road closures).
- Threshold tuning on M train events still uses NOAA point locations.

### Manuscript / rebuttal text (template)

> We revised validation to reduce circularity. The ever-flooded map aggregates SAR detections from M events (Sentinel-1 coverage only). Independent test locations come from N−M events that did not contribute to the map. We no longer report the prior 88.9% aggregate figure, which mixed map-building and test events. NOAA remains the point reference for both screening and validation; fully independent ground truth (e.g., aerial imagery) is noted as future work.

---

## Comment #2 — Threshold overfitting

**Reviewer concern:** dB thresholds tuned on the same events used for evaluation.

**Status:** **Addressed**

### What we did

- Locked thresholds: **−1.8 dB** (VV+VH), **−2.0 dB** (VV-only).
- Tuned on a **train subset of M only** per city; then fixed before full map and before N−M validation.
- **`useAdaptiveThreshold = false`** in GEE (adaptive mode leaks scene information).

| City | Threshold-train composites (GEE IDs) |
|------|----------------------------------------|
| Raleigh | `755610`, `775029_and_1_more` |
| Houston | `579534`, `675235_and_1_more`, `710731`, `830461_and_1_more` |

Config: [`data/processed/validation_split.json`](../data/processed/validation_split.json)

### Manuscript / rebuttal text (template)

> Detection thresholds were selected using a training subset of M events per city, then locked before constructing the ever-flooded map and before independent validation. Adaptive per-scene thresholds were disabled for evaluation. Raleigh and Houston thresholds were tuned independently.

---

## Comment #3 — Buffer distance and “~50% = coin flip”

**Reviewer concern:** 1 km buffer too coarse; 500 m recall (~55.6% in old run) interpreted as near-random / coin-flip performance.

**Status:** **Addressed**

### What we did

- Report **buffered detection recall** at **100 m, 250 m, 500 m, 1000 m** (not only 1 km).
- Rename metric explicitly — **not** “accuracy.”
- Independent N−M validation (see **#1**, **#2**).

**Headline results (N−M, ever-flooded map):**

| Buffer | Raleigh (n = 36) | Houston (n = 28) |
|--------|------------------|------------------|
| 100 m | 13/36 = **36%** | 3/28 = **11%** |
| 250 m | 22/36 = **61%** | 10/28 = **36%** |
| 500 m | 32/36 = **89%** | 17/28 = **61%** |
| 1000 m | 36/36 = **100%** | 25/28 = **89%** |

### Metric clarification (rebuttal to coin-flip argument)

We report **buffered detection recall** on **known flood report points only**:

> recall at buffer B = (NOAA points with ≥1 SAR flood pixel within B) / (NOAA flood points evaluated)

- **Not** overall classification accuracy; no true negatives; **50% coin-flip logic does not apply**.
- Old ~55% was from the **circular** design; revised independent 500 m recall is **89% (Raleigh)** and **61% (Houston)**.
- A spatial null (random points in AOI) depends on flooded area and buffer width — generally **not** 50% (see **#14**).

### Manuscript / rebuttal text (template)

> We report buffered detection recall at 100–1000 m for independent NOAA locations (N−M events). This is not overall classification accuracy; the denominator contains only documented flood locations, so comparison to a 50% coin flip is not applicable. Recall increases with buffer distance as expected for a distance-tolerance metric. We replaced the prior single 1 km “accuracy” figure with this multi-buffer recall table.

---

## Comment #4 — No FEMA / baseline comparison

**Reviewer concern:** Claims about complementing existing maps not tested against FEMA or other baselines.

**Status:** Not done

### Planned response (when addressed)

> Compare ever-flooded / hotspot layers to FEMA NFHL zones (or equivalent) for overlap statistics; report as supplementary validation, not headline metric.

---

## Comment #5 — Urban SAR limits understated

**Reviewer concern:** Double-bounce, lack of coherence/polarimetry baseline; urban SAR limitations under-discussed.

**Status:** Not done

### Planned response (when addressed)

> Expand Discussion on SAR limits in urban areas; cite double-bounce and mixed land-cover effects; note validation uses pre-urban ever-flooded layer for point recall.

---

## Comment #6 — Unsupported local knowledge claims

**Reviewer concern:** City reports / news cited without proper sources.

**Status:** Not done

### Planned response (when addressed)

> Remove or cite all local-knowledge claims; replace with NOAA/USGS/SAR-only statements where citations are unavailable.

---

## Comment #7 — Weak control event

**Reviewer concern:** Only one non-flood control; no false-positive metrics.

**Status:** Not done

### Notes

- Houston GEE config includes `control_2024-10-15` (excluded from hotspot map).
- See also **#11** (documentation).

---

## Comment #8 — Arbitrary USGS gauge thresholds

**Reviewer concern:** 10 ft / 40 ft cutoffs not justified; limits generalizability.

**Status:** **Addressed**

### What we did

- **Inclusion:** NOAA floods with coordinates, **2015–2025** — **no gage filter**.
- USGS recorded in event catalog as **metadata only** (legacy 10 ft / 40 ft flags are informational).

See [`event_selection_methodology.md`](event_selection_methodology.md).

| Original claim | Current practice |
|----------------|------------------|
| Events required NOAA **and** USGS >10 ft / >40 ft | **NOAA + coordinates only** |
| ~15 Raleigh / ~9 Houston “major” floods | **49 / 55** events (2015–2025) |

### Manuscript / rebuttal text (template)

> The event universe consists of NOAA-reported urban flood events with coordinates during 2015–2025. USGS daily gage height at Crabtree Creek (Raleigh) and Buffalo Bayou (Houston) was recorded per event in the supplementary catalog but was not used as an inclusion criterion. Sentinel-1 availability determines map (M) versus independent test (N−M) roles.

---

## Comment #9 — Image window bias

**Reviewer concern:** 30-day pre / 2-day post windows may miss flash floods.

**Status:** **Partial**

### What we did

- Pre/post lags and S1 image IDs documented per event in [`event_catalog_2015_2025.csv`](../data/processed/event_catalog_2015_2025.csv).

### Manuscript / rebuttal text (template)

> Sentinel-1 pairs were selected within a 30-day pre- and 2-day post-event window (same relative orbit). Event-level pre/post dates and lag days are listed in Table S1. We acknowledge that very rapid flash floods may fall outside ideal observation windows; this is stated as a limitation.

---

## Comment #10 — Precision, recall terminology, IoU

**Reviewer concern:** Only buffered recall reported; imprecise use of “accuracy”; no precision / IoU.

**Status:** **Partial**

### What we did

- Headline metric: **buffered detection recall** (point-based, positive references only).
- Do **not** use the term “accuracy” for this metric (see **#3**).

### What remains

- **Precision / FAR** need a full reference inundation map or negative point sample.
- **IoU** needs pixel-wise reference, not point-only NOAA.

### Manuscript / rebuttal text (template)

> We report buffered detection recall for independent NOAA flood locations, following common practice for point-referenced flood map evaluation. Pixel-wise precision, false-alarm rate, and IoU require a complete reference inundation layer and are left for future work with aerial or survey data.

---

## Comment #11 — Control event poorly documented

**Reviewer concern:** Control (non-flood) event date and verification unclear.

**Status:** Not done

### Notes

- Houston control: `control_2024-10-15` in GEE upload script; excluded from map aggregation.
- See also **#7**.

### Planned response (when addressed)

> Add control event to Table S1 with date, S1 pair, and verification source (no NOAA flood report / no gauge exceedance / clear imagery).

---

## Comment #12 — Temporal aggregation bias

**Reviewer concern:** Uneven Sentinel-1 coverage across events skews hotspot frequency.

**Status:** Not done

### Planned response (when addressed)

> Report per-event observation dates in catalog; discuss in Limitations that frequency map reflects detectable events, not uniform temporal sampling.

---

## Comment #13 — No flood depth / severity

**Reviewer concern:** Surface water only; no depth or severity.

**Status:** Not done

### Planned response (when addressed)

> One Limitations paragraph: SAR change detection maps extent, not depth; NOAA narratives provide qualitative severity only.

---

## Comment #14 — No random / simple baselines

**Reviewer concern:** No stream-proximity, random-point, or FEMA overlay baselines.

**Status:** Not done

### Notes

- Proper null for our recall metric: random points in AOI → hit rate ≈ (buffered flood area) / (AOI area), **not 50%** (see **#3**).

### Planned response (when addressed)

> Report random-point and stream-buffer baselines in supplement; compare to SAR recall at each buffer distance.

---

## Comment #15 — Title and terminology

**Reviewer concern:** “Safeguarding,” “multi-sensor,” “flash floods” may mislead.

**Status:** Not done

### Planned response (when addressed)

> Narrow title to SAR hotspot mapping; align “multi-sensor” with actual inputs (S1 primary; S2/Landsat optional); use “urban flood” unless events are specifically flash-flood-only.

---

## Comment #16 — Citation accuracy

**Reviewer concern:** Some citations do not support claims made.

**Status:** Not done

### Planned response (when addressed)

> Audit each citation against claim; remove or replace unsupported references.

---

## Comment #17 — Limited statistics

**Reviewer concern:** No confidence intervals, per-event breakdown, mean distance error.

**Status:** Not done

### Planned response (when addressed)

> Add per-city recall with exact hit counts (already in table); optional bootstrap CIs and median distance-to-nearest flood pixel in supplement.

---

## Comment #18 — Study period and event-level catalog

**Reviewer concern:** 2010–2025 vs Sentinel-1 (2014+); need reproducible event table.

**Status:** **Addressed**

### What we did

- Unified study period: **2015–2025** everywhere.
- Reproducible catalogs via `code/validation/build_event_catalog.py`.

```bash
python3 code/validation/build_event_catalog.py
```

| File | Contents |
|------|----------|
| [`event_catalog_2015_2025.csv`](../data/processed/event_catalog_2015_2025.csv) | One row per NOAA event — study role, USGS, SAR metadata |
| [`event_catalog_sar_composites_2015_2025.csv`](../data/processed/event_catalog_sar_composites_2015_2025.csv) | One row per S1 composite |

**Event counts (with coordinates):**

| City | N | N−M (test) | SAR in GEE map |
|------|---|------------|----------------|
| Raleigh | 49 | 37 | 5 composites |
| Houston | 55 | 29 | 10 composites (+ 1 control) |

**`study_role` values:** `independent_validation`, `map_sar`, `map_sar_threshold_train`, `sar_matched_not_in_gee_map`, `excluded_no_coordinates`.

GEE composite IDs are authoritative for map roles (`generate_flood_hotspots_gee_upload.js`).

### Manuscript / rebuttal text (template)

> All analyses use 2015–2025, consistent with Sentinel-1 availability. Table S1 lists every NOAA flood report with coordinates, USGS gage on the event date, Sentinel-1 pairing when available, and each event’s role (map, threshold training, independent test, or excluded).

---

## Appendix A — Method summary (cross-cutting)

**Goal:** Map recurring urban flood hotspots in **Raleigh** and **Houston** using Sentinel-1 + NOAA; validate with independent N−M design.

**Framework:**

| Group | Role |
|-------|------|
| **N** | All NOAA floods with coordinates (2015–2025) |
| **M** | Build ever-flooded map from SAR |
| **N − M** | Independent validation locations |

**Detection:** S1 GRD change detection; locked dB thresholds; pre-urban ever-flooded layer for validation; urban mask for hotspot display only.

**Maps:** (1) ever-flooded union (validation), (2) hotspot frequency (1× / 2–3× / 4+×).

---

## Appendix B — Draft Results paragraph

> Independent validation used NOAA-reported flood locations from events without Sentinel-1 coverage (N−M), which did not contribute to the ever-flooded map built from SAR events (M). Buffered detection recall increased with tolerance distance as expected. For Raleigh (n = 36), recall was 36% at 100 m, 61% at 250 m, 89% at 500 m, and 100% at 1000 m. For Houston (n = 28), recall was 11% at 100 m, 36% at 250 m, 61% at 500 m, and 89% at 1000 m. Houston's lower recall at fine buffers likely reflects the larger metropolitan AOI and greater spatial spread of report locations relative to bayou-aligned flood detections. Detection thresholds (−1.8 dB VV+VH, −2.0 dB VV-only) were locked per city using a training subset of M events before map construction. All events are documented in a supplementary event catalog for 2015–2025 (Table S1).

---

## Appendix C — Limitations (Discussion)

- NOAA remains the spatial reference (**#1**); not FEMA or aerial imagery for headline metric (**#4**).
- USGS gage not used to filter events (**#8**); single station may not reflect local report locations.
- 100 m recall limited, especially Houston (**#3**).
- Recall only — no precision/IoU (**#10**).
- No random/FEMA baselines yet (**#14**).
- S1 window and temporal sampling (**#9**, **#12**).
- No flood depth (**#13**).
- Ever-flooded layer intentionally generous; NOAA positional uncertainty.

---

## Appendix D — Reproducibility

```bash
python3 code/validation/build_independent_validation.py
python3 code/validation/build_event_catalog.py
```

GEE: paste `code/gee_mapping/generate_flood_hotspots_gee_upload.js`; set `selectedCity` to `raleigh` or `houston`.

Config: [`validation_split.json`](../data/processed/validation_split.json)

Related docs: [`validation_independence.md`](validation_independence.md), [`event_selection_methodology.md`](event_selection_methodology.md)
