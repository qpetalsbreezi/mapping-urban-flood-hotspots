# Paper Changes for Reviewer Comments

Point-by-point responses for manuscript revision. Use the **progress table** below, then jump to each **Comment #** section for detail and draft text.

### Instructions for paper-integration agent

1. **In paper (#6, #13, #15)** — Already applied to the manuscript. Do not re-insert; use those sections only as reference.
2. **Needs paper (#1, #2, #3, #8, #9, #10, #18)** — Copy the **Manuscript / rebuttal text** and tables from each comment section (and **Appendix B** for Results). Content below is ready to integrate.
3. **Not done (#4, #5, #14, #16, #17)** — Placeholders only. When analysis or drafting is completed in this repo, the corresponding **Comment #** section will be expanded with **What we did**, numbers, and **Manuscript / rebuttal text** — integrate at that time.
4. **Do not** restore old headline metrics (88.9% accuracy, circular validation design).

### Progress legend

| Manuscript column | Meaning |
|-------------------|---------|
| **In paper** | Change applied to the manuscript |
| **Needs paper** | Addressed in repo/docs or analysis; draft text below — still to insert in manuscript |
| **Partial** | Partly done; remaining work noted in comment section |
| **Not done** | Not yet addressed |

---

## Progress at a glance

| # | Reviewer concern | Repo / analysis | Manuscript |
|---|------------------|-----------------|------------|
| **1** | Circular validation | **Partial** — N−M design | **Needs paper** |
| **2** | Threshold overfitting | **Addressed** | **Needs paper** |
| **3** | Buffer distance; “coin flip” | **Addressed** | **Needs paper** |
| **4** | No FEMA / baseline comparison | Not done | Not done |
| **5** | Urban SAR limits understated | Not done | Not done |
| **6** | Unsupported “local knowledge” claims | **Addressed** | **In paper** |
| **7** | Weak control event | **Partial** — one control documented | **Needs paper** |
| **8** | Arbitrary USGS gauge thresholds | **Addressed** | **Needs paper** |
| **9** | Image window bias | **Partial** — in event catalog | **Needs paper** |
| **10** | Precision / recall / IoU | **Partial** — recall defined | **Needs paper** |
| **11** | Control event poorly documented | **Addressed** | **Needs paper** |
| **12** | Temporal aggregation bias | **Addressed** — analysis below | **Needs paper** |
| **13** | No flood depth / severity | **Addressed** | **In paper** |
| **14** | No random / simple baselines | Not done | Not done |
| **15** | Title and terminology | **Addressed** | **In paper** |
| **16** | Citation accuracy | Not done | Not done |
| **17** | Limited statistics | Not done | Not done |
| **18** | Study period; event table | **Addressed** | **Needs paper** |

**Summary:** **3 in paper** (#6, #13, #15) · **10 need paper** (#1–#3, #7–#12, #18) · **5 not done** (#4, #5, #14, #16, #17)

---

## Comment #1 — Circular validation

**Reviewer concern:** NOAA data used for both event selection and accuracy testing; headline **88.9%** likely overoptimistic.

**Status:** **Partial** (repo) · **Needs paper**

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

**Status:** **Addressed** (repo) · **Needs paper**

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

**Status:** **Addressed** (repo) · **Needs paper**

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

**Status:** Not done · **Future — expand this section when analysis is ready**

### Planned response (when addressed)

> Compare ever-flooded / hotspot layers to FEMA NFHL zones (or equivalent) for overlap statistics; report as supplementary validation, not headline metric.

---

## Comment #5 — Urban SAR limits understated

**Reviewer concern:** Double-bounce, lack of coherence/polarimetry baseline; urban SAR limitations under-discussed.

**Status:** Not done · **Future — expand this section when analysis is ready**

### Planned response (when addressed)

> Expand Discussion on SAR limits in urban areas; cite double-bounce and mixed land-cover effects; note validation uses pre-urban ever-flooded layer for point recall.

---

## Comment #6 — Unsupported local knowledge claims

**Reviewer concern:** City reports / news cited without proper sources.

**Status:** **Addressed** (repo) · **In paper**

### What we did (manuscript)

- Removed uncited claims: city engineering reports, news coverage, local stormwater assessments.
- Dropped refs 4–5 from the discussion sentence that relied on those sources.
- Discussion now rests on NOAA, USGS (context), and SAR only.

---

## Comment #7 — Weak control event

**Reviewer concern:** Only one non-flood control; no false-positive metrics.

**Status:** **Partial** (repo) · **Needs paper**

### What we did

- Houston includes **one** deliberate non-flood **Sentinel-1 control** (`control_2024-10-15`).
- Control is processed in the event viewer but **excluded** from ever-flooded and hotspot aggregation in `generate_flood_hotspots.js`.
- We **do not** report false-positive rate or commission error from this single scene — acknowledge as limitation (see **#11** for full documentation).

### What remains

- A single control cannot support robust false-alarm statistics; expanding controls is future work.

### Manuscript / rebuttal text (template)

> As a qualitative sanity check, we include one Houston non-flood Sentinel-1 pair (15 October 2024) with no corresponding NOAA flood report and below-threshold streamflow (Table S1). This control is viewable in the single-event workflow but is excluded from ever-flooded and hotspot maps. We do not derive false-positive rates from a single control date; formal commission-error metrics would require additional non-flood observations or a full reference inundation layer.

---

## Comment #8 — Arbitrary USGS gauge thresholds

**Reviewer concern:** 10 ft / 40 ft cutoffs not justified; limits generalizability.

**Status:** **Addressed** (repo) · **Needs paper**

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

**Status:** **Partial** (repo) · **Needs paper**

### What we did

- Pre/post lags and S1 image IDs documented per event in [`event_catalog_2015_2025.csv`](../data/processed/event_catalog_2015_2025.csv).

### Manuscript / rebuttal text (template)

> Sentinel-1 pairs were selected within a 30-day pre- and 2-day post-event window (same relative orbit). Event-level pre/post dates and lag days are listed in Table S1. We acknowledge that very rapid flash floods may fall outside ideal observation windows; this is stated as a limitation.

---

## Comment #10 — Precision, recall terminology, IoU

**Reviewer concern:** Only buffered recall reported; imprecise use of “accuracy”; no precision / IoU.

**Status:** **Partial** (repo) · **Needs paper**

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

**Status:** **Addressed** (repo) · **Needs paper**

### What we did

Documented in [`event_catalog_sar_composites_2015_2025.csv`](../data/processed/event_catalog_sar_composites_2015_2025.csv) (`study_role = control_sar_no_flood`):

| Field | Value |
|-------|--------|
| **Composite ID** | `control_2024-10-15` |
| **City** | Houston |
| **Reference date** | 2024-10-15 |
| **NOAA flood report** | None (`noaa_event_ids = none`) |
| **USGS Buffalo Bayou (08073700)** | **27.87 ft** on 2024-10-15 (legacy 40 ft reference — not used as filter) |
| **S1 before / after** | 2024-10-03 / 2024-10-15 (12-day pre, 0-day post lag) |
| **In ever-flooded / hotspot map** | **No** |
| **Purpose** | Visual sanity check in `visualize_flood_events.js` |

Regenerate catalog: `python3 code/validation/build_event_catalog.py`

### Manuscript / rebuttal text (template)

> Table S1 includes a documented non-flood control for Houston (composite `control_2024-10-15`, 15 October 2024): Sentinel-1 before/after images on 3 and 15 October 2024, no NOAA flood entry on that date, and Buffalo Bayou gage height 27.87 ft. This pair was excluded from ever-flooded and hotspot aggregation and is used only for qualitative inspection of detections under non-flood conditions.

---

## Comment #12 — Temporal aggregation bias

**Reviewer concern:** Uneven Sentinel-1 coverage across events skews hotspot frequency.

**Status:** **Addressed** (repo) · **Needs paper**

### Analysis

Hotspot **frequency** counts how many **mapped** SAR events flooded each pixel. Mapped events are unevenly spaced in time because they depend on Sentinel-1 availability and successful pairing, not uniform sampling.

**Raleigh — 5 SAR composites in map (event dates):**

| Year | Map composite dates |
|------|---------------------|
| 2018 | May, July |
| 2022 | May |
| 2024 | May, August |

**Houston — 10 SAR composites in map:**

| Year | Count | Example dates |
|------|-------|----------------|
| 2015 | 1 | May |
| 2017 | 3 | Jan, Jun, Aug (Harvey) |
| 2019 | 2 | May, Sep |
| 2020–2022 | 1 each | Jun 2020, Jun 2021, Jan 2022 |

Gaps (e.g., Raleigh 2019–2021, 2023) mean **zero** frequency contribution in those years — not proof of no flooding. The **ever-flooded** validation layer and **N−M** NOAA test use the full 2015–2025 report catalog (Table S1), not the frequency map alone.

### Manuscript / rebuttal text (template)

> Hotspot frequency reflects the number of **Sentinel-1-observed** flood events at each pixel, not the total number of NOAA-reported floods. Mapped events are irregularly spaced in time (Table S1): for example, Raleigh map composites fall in 2018, 2022, and 2024, while Houston includes clusters in 2017 (including Hurricane Harvey) and 2019. We therefore interpret frequency as “recurrence under observable SAR conditions” rather than a complete historical count. Independent validation uses all N−M NOAA report locations (2015–2025), separate from the frequency product.

---

## Comment #13 — No flood depth / severity

**Reviewer concern:** Surface water only; no depth or severity.

**Status:** **Addressed** (repo) · **In paper**

### What we did (manuscript)

- Added Limitations text: the method detects **flood presence (extent)**, not **depth or velocity**.

---

## Comment #14 — No random / simple baselines

**Reviewer concern:** No stream-proximity, random-point, or FEMA overlay baselines.

**Status:** Not done · **Future — expand this section when analysis is ready**

### Notes

- Proper null for our recall metric: random points in AOI → hit rate ≈ (buffered flood area) / (AOI area), **not 50%** (see **#3**).

### Planned response (when addressed)

> Report random-point and stream-buffer baselines in supplement; compare to SAR recall at each buffer distance.

---

## Comment #15 — Title and terminology

**Reviewer concern:** “Safeguarding,” “multi-sensor,” “flash floods” may mislead.

**Status:** **Addressed** (repo) · **In paper**

### What we did (manuscript)

- **New title:** *Identifying Recurring Urban Flood Hotspots Using Open-Access Sentinel-1 SAR Imagery*
- **Terminology:** “flash flooding” → **“urban flooding”**; “multi-sensor” → **“multi-source”**

---

## Comment #16 — Citation accuracy

**Reviewer concern:** Some citations do not support claims made.

**Status:** Not done · **Future — expand this section when analysis is ready**

### Planned response (when addressed)

> Audit each citation against claim; remove or replace unsupported references.

---

## Comment #17 — Limited statistics

**Reviewer concern:** No confidence intervals, per-event breakdown, mean distance error.

**Status:** Not done · **Future — expand this section when analysis is ready**

### Planned response (when addressed)

> Add per-city recall with exact hit counts (already in table); optional bootstrap CIs and median distance-to-nearest flood pixel in supplement.

---

## Comment #18 — Study period and event-level catalog

**Reviewer concern:** 2010–2025 vs Sentinel-1 (2014+); need reproducible event table.

**Status:** **Addressed** (repo) · **Needs paper**

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

**`study_role` values:** `independent_validation`, `map_sar`, `map_sar_threshold_train`, `sar_matched_not_in_gee_map`, `excluded_no_coordinates`, `control_sar_no_flood` (Houston only).

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
- S1 window and temporal sampling (**#9**, **#12** — **#12** draft in comment section).
- Houston non-flood control documented (**#7**, **#11** — draft in comment sections); single control, no FP rate.
- SAR detects flood **presence, not depth or velocity** (**#13** — **in paper**).
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
