# Paper Changes for Reviewer Comments

**Single source of truth for the paper-integration agent.** All numbers, tables, and draft text are in this file.

### Instructions for paper-integration agent

**You do not need to run code, open GEE, read other repo docs, or wait on another agent.**

#### Your tasks

1. **Skip (already in manuscript):** #6, #13, #15 — do not re-insert.
2. **Insert from this doc:** #1–#5, #7–#12, #14, #17, #18 — copy **Manuscript / rebuttal text** and tables from each section.
3. **Bulk paste from appendices:**
   - **Appendix B** — Results paragraph
   - **Appendix C** — Limitations
   - **Appendix E** — Table SX (random baseline)
   - **Appendix F** — Table SY (recall + Wilson 95% CI)
   - **Appendix G** — Table SZ (FEMA point baseline)
4. **Citation audit (#16)** — manuscript only; see Comment #16 section.
5. **Do not** restore 88.9% accuracy or the old circular validation design.

#### Sample-size note (use consistently)

| Metric | Raleigh n | Houston n | Notes |
|--------|-----------|-----------|-------|
| Buffered recall (#3, #14, #17) | 36 | 28 | N−M points inside GEE focus AOI |
| FEMA point-in-SFHA (#4) | 37 | 29 | Full N−M catalog with coordinates |
| Event catalog (#18) | 49 total, 37 N−M | 55 total, 29 N−M | Table S1 |

#### Repo “Partial” vs your work

Comments #1, #7, #9, #10 show **Partial** in repo because limitations are acknowledged — **draft manuscript text below is still complete and ready to paste.**

#### Skip for manuscript

- GEE FEMA pixel area overlap — not required (Table SZ is sufficient).
- Appendix D — repo reproducibility only.

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
| **4** | No FEMA / baseline comparison | **Addressed** — NFHL point-in-SFHA baseline | **Needs paper** |
| **5** | Urban SAR limits understated | **Addressed** — discussion draft | **Needs paper** |
| **6** | Unsupported “local knowledge” claims | **Addressed** | **In paper** |
| **7** | Weak control event | **Partial** — one control documented | **Needs paper** |
| **8** | Arbitrary USGS gauge thresholds | **Addressed** | **Needs paper** |
| **9** | Image window bias | **Partial** — in event catalog | **Needs paper** |
| **10** | Precision / recall / IoU | **Partial** — recall defined | **Needs paper** |
| **11** | Control event poorly documented | **Addressed** | **Needs paper** |
| **12** | Temporal aggregation bias | **Addressed** — analysis below | **Needs paper** |
| **13** | No flood depth / severity | **Addressed** | **In paper** |
| **14** | No random / simple baselines | **Addressed** — random-point baseline | **Needs paper** |
| **15** | Title and terminology | **Addressed** | **In paper** |
| **16** | Citation accuracy | Not done | **Paper agent task** |
| **17** | Limited statistics | **Addressed** — Wilson 95% CIs | **Needs paper** |
| **18** | Study period; event table | **Addressed** | **Needs paper** |

**Summary:** **3 in paper** (#6, #13, #15) · **14 need paper** (#1–#5, #7–#12, #14, #17, #18) · **1 paper-agent task** (#16 citations)

---

## Comment #1 — Circular validation

**Reviewer concern:** NOAA data used for both event selection and accuracy testing; headline **88.9%** likely overoptimistic.

**Status:** **Partial** (repo) · **Needs paper**

### What we did

- **Map (M):** ever-flooded union built only from events with Sentinel-1 pairs.
- **Test (N−M):** NOAA locations from events **without** SAR — never used to build the map.
- **Cities independent:** Raleigh thresholds not tuned on Houston data (and vice versa).

**Design in one sentence:** Map = SAR events (M); test = NOAA events without SAR (N−M); cities processed separately.

### What remains (state in Limitations)

- NOAA still defines the **event universe** and the **spatial reference** (not FEMA, aerial imagery, or road closures).
- Threshold tuning on M train events still uses NOAA point locations.

### Manuscript / rebuttal text

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

Config reference (optional): `data/processed/validation_split.json`

### Manuscript / rebuttal text

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
- A spatial null (random points in AOI) depends on flooded area and buffer width — Raleigh 6–63%, Houston 13–70% at 100–1000 m (**#14**), not 50%. At 500 m, Houston NOAA recall (**61%**) exceeds random (**41%**).

### Random baseline cross-check (see **#14** for full table)

| Buffer | Raleigh NOAA vs random | Houston NOAA vs random |
|--------|------------------------|------------------------|
| 100 m | 36% vs 6% | 11% vs 13% (comparable) |
| 500 m | 89% vs 33% | 61% vs 41% |
| 1000 m | 100% vs 63% | 89% vs 70% |

### Manuscript / rebuttal text

> We report buffered detection recall at 100–1000 m for independent NOAA locations (N−M events). This is not overall classification accuracy; the denominator contains only documented flood locations, so comparison to a 50% coin flip is not applicable. Recall increases with buffer distance as expected for a distance-tolerance metric. We replaced the prior single 1 km “accuracy” figure with this multi-buffer recall table. A random-point spatial null (500 points per city, seed 42) yielded hit rates of 6–63% (Raleigh) and 13–70% (Houston) at the same buffers — well below NOAA recall at most distances (Table SX), confirming that mid- and coarse-buffer performance is not explained by chance placement in the AOI.

---

## Comment #4 — No FEMA / baseline comparison

**Reviewer concern:** Claims about complementing existing maps not tested against FEMA or other baselines.

**Status:** **Addressed** (repo) · **Needs paper**

**Minimal scope:** FEMA NFHL **Special Flood Hazard Area (SFHA)** comparison as **supplement only** — headline validation remains NOAA N−M recall (**#1**, **#3**).

### What we did (analysis complete — use table below in paper)

FEMA NFHL **Special Flood Hazard Area (SFHA)** comparison as **supplement only** — headline validation remains NOAA N−M recall.

**Results — N−M NOAA points in FEMA SFHA** (also **Appendix G**):

| City | N−M points | Inside FEMA SFHA | Outside SFHA |
|------|------------|------------------|--------------|
| Raleigh | 37 | 4 (**10.8%**) | 33 (**89.2%**) |
| Houston | 29 | 10 (**34.5%**) | 19 (**65.5%**) |

Most independent urban flood reports lie **outside** FEMA SFHA in both cities — especially Raleigh (~89% outside). SAR complements regulatory floodplain maps; this is not the headline validation metric.

### Manuscript / rebuttal text

> We compared independent validation locations to FEMA National Flood Hazard Layer (NFHL) Special Flood Hazard Areas as a supplementary baseline, not as the primary accuracy metric. Most independent NOAA flood report locations fell **outside** FEMA SFHA (Raleigh 33/37; Houston 19/29), indicating that event-based urban flood reports and SAR-detected recurring extents are not fully represented by regulatory floodplain maps alone. Headline validation remains buffered detection recall against independent NOAA locations (**#1**, **#3**).

### What we did not do

- Replace NOAA with FEMA as validation reference.
- Stream-buffer or full NFHL zone-type breakdown (A vs AE vs X).

---

## Comment #5 — Urban SAR limits understated

**Reviewer concern:** Double-bounce, lack of coherence/polarimetry baseline; urban SAR limitations under-discussed.

**Status:** **Addressed** (repo) · **Needs paper**

### What the method actually does (accurate to code)

Our pipeline uses **C-band Sentinel-1 GRD** (VV primary; VH when both scenes have it) and **change detection** (after − before, dB), not coherence, InSAR, or polarimetric decomposition.

| Layer / step | Urban-related behavior |
|--------------|------------------------|
| **Hotspot frequency map** | Flood pixels **masked to urban/built-up**: ESA WorldCover class 50 **or** NLCD ≥20% impervious |
| **Independent validation (ever-flooded map)** | Uses **pre-urban** mask: same threshold + speckle filter + permanent-water exclusion, **without** urban mask — intentionally more generous for point recall |
| **Permanent water** | JRC Global Surface Water ≥50% occurrence excluded |
| **Speckle** | 90 m focal smoothing; ≥5 connected pixels retained |
| **What we do not use** | Coherence, PolSAR, street-scale DEM hydraulics, building-level inundation models |

Urban environments introduce **volume scattering, double-bounce, layover, and shadow** that can mimic or obscure real water signals in C-band SAR. We do **not** claim street-level or building-footprint inundation mapping.

### What we did not change

- No new urban-specific threshold or polarimetric processing (out of scope for this revision).
- Headline validation remains **buffered detection recall** at NOAA points — appropriate for a **hotspot / extent** product, not sub-meter urban flood depth.

### Manuscript / rebuttal text — Discussion

> Sentinel-1 C-band backscatter change detection is less reliable in dense urban settings than over open water or rural floodplains. In cities, corner reflectors, roads, and building geometry produce **layover, shadow, and double-bounce** effects that can complicate interpretation of VV/VH decreases as inundation. Our approach does not use **interferometric coherence** or **polarimetric decomposition**, which can improve discrimination in complex scenes but require different data products and processing chains. We therefore treat SAR outputs as **regional flood-extent indicators** rather than parcel- or street-level inundation maps.
>
> Operationally, we apply an **urban mask** (WorldCover built-up or NLCD ≥20% impervious) when aggregating **hotspot frequency** maps so that recurring detections are summarized over developed land. For **independent validation**, we score NOAA report locations against a **pre-urban ever-flooded layer** (same detection thresholds and speckle filtering, but without restricting to the urban mask) so that agreement is not artificially reduced by masking out pixels near report coordinates. Even with this design, fine-buffer recall remains limited in Houston (11% at 100 m), consistent with positional uncertainty in NOAA reports and the spatial scale of bayou-aligned SAR detections relative to dispersed urban report points.
>
> We do not claim that SAR alone can resolve flood **depth**, **velocity**, or interior building flooding (**#13**). Hotspot maps should be interpreted as **where open-channel and surface flooding was repeatedly detectable from Sentinel-1** under our observation windows, not as a substitute for high-resolution lidar, municipal stormwater models, or field surveys.

### Manuscript / rebuttal text — Methods (optional short paragraph)

> Flood masks were derived from Sentinel-1 GRD VV (and VH when available) using pre/post change thresholds (−1.8 dB dual-pol, −2.0 dB VV-only). Hotspot frequency was computed over an urban mask (WorldCover built-up or NLCD impervious ≥20%). Validation used a pre-urban ever-flooded union so that recall was not evaluated only within the urban mask.

### Suggested citations

Use refs already in the manuscript where possible, or add one widely cited Sentinel-1 urban flood / SAR limitation review.

### Relation to other comments

| # | Link |
|---|------|
| **#3** | Fine-buffer recall limits consistent with urban scale mismatch, not proof of method failure |
| **#10** | Point recall only; no pixel IoU in urban canyons |
| **#13** | Extent only, not depth — cross-reference in same Discussion subsection |

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

### Manuscript / rebuttal text

> As a qualitative sanity check, we include one Houston non-flood Sentinel-1 pair (15 October 2024) with no corresponding NOAA flood report and below-threshold streamflow (Table S1). This control is viewable in the single-event workflow but is excluded from ever-flooded and hotspot maps. We do not derive false-positive rates from a single control date; formal commission-error metrics would require additional non-flood observations or a full reference inundation layer.

---

## Comment #8 — Arbitrary USGS gauge thresholds

**Reviewer concern:** 10 ft / 40 ft cutoffs not justified; limits generalizability.

**Status:** **Addressed** (repo) · **Needs paper**

### What we did

- **Inclusion:** NOAA floods with coordinates, **2015–2025** — **no gage filter**.
- USGS recorded in event catalog as **metadata only** (legacy 10 ft / 40 ft flags are informational, not filters).

| Original claim | Current practice |
|----------------|------------------|
| Events required NOAA **and** USGS >10 ft / >40 ft | **NOAA + coordinates only** |
| ~15 Raleigh / ~9 Houston “major” floods | **49 / 55** events (2015–2025) |

### Manuscript / rebuttal text

> The event universe consists of NOAA-reported urban flood events with coordinates during 2015–2025. USGS daily gage height at Crabtree Creek (Raleigh) and Buffalo Bayou (Houston) was recorded per event in the supplementary catalog but was not used as an inclusion criterion. Sentinel-1 availability determines map (M) versus independent test (N−M) roles.

---

## Comment #9 — Image window bias

**Reviewer concern:** 30-day pre / 2-day post windows may miss flash floods.

**Status:** **Partial** (repo) · **Needs paper**

### What we did

- Pre/post lags and S1 image IDs are in supplementary **Table S1** (`event_catalog_2015_2025.csv` in repo).
- Windows: **30-day pre-event**, **2-day post-event**, same relative orbit.

### Manuscript / rebuttal text

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

### Manuscript / rebuttal text

> We report buffered detection recall for independent NOAA flood locations, following common practice for point-referenced flood map evaluation. Pixel-wise precision, false-alarm rate, and IoU require a complete reference inundation layer and are left for future work with aerial or survey data.

---

## Comment #11 — Control event poorly documented

**Reviewer concern:** Control (non-flood) event date and verification unclear.

**Status:** **Addressed** (repo) · **Needs paper**

### What we did

Documented for **Table S1** (Houston control row):

| Field | Value |
|-------|--------|
| **Composite ID** | `control_2024-10-15` |
| **City** | Houston |
| **Reference date** | 2024-10-15 |
| **NOAA flood report** | None |
| **USGS Buffalo Bayou (08073700)** | **27.87 ft** on 2024-10-15 (metadata only) |
| **S1 before / after** | 2024-10-03 / 2024-10-15 |
| **In ever-flooded / hotspot map** | **No** |

### Manuscript / rebuttal text

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

### Manuscript / rebuttal text

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

**Status:** **Addressed** (repo) · **Needs paper**

**Minimal scope:** Random-point baseline only (no stream-buffer or FEMA overlap in this revision; see **#4** for FEMA).

### What we did (results below — paste into paper)

- Random-point spatial null: **500** points per city, **seed 42**, same buffers as validation.
- Compared to independent N−M NOAA recall on pre-urban ever-flooded map.

### GEE console output (reference — numbers already in tables)

**Raleigh** (`seed=42`, n=500):

```
100 m buffered recall:  28/500 = 6%
250 m buffered recall:  78/500 = 16%
500 m buffered recall:  165/500 = 33%
1000 m buffered recall: 315/500 = 63%
```

**Houston** (`seed=42`, n=500):

```
100 m buffered recall:  64/500 = 13%
250 m buffered recall:  112/500 = 22%
500 m buffered recall:  203/500 = 41%
1000 m buffered recall: 352/500 = 70%
```

### Results table (NOAA vs random)

| Buffer | Raleigh random (500 pts) | Raleigh N−M NOAA | Houston random (500 pts) | Houston N−M NOAA |
|--------|--------------------------|------------------|--------------------------|------------------|
| 100 m | 28/500 = **6%** | 13/36 = **36%** | 64/500 = **13%** | 3/28 = **11%** |
| 250 m | 78/500 = **16%** | 22/36 = **61%** | 112/500 = **22%** | 10/28 = **36%** |
| 500 m | 165/500 = **33%** | 32/36 = **89%** | 203/500 = **41%** | 17/28 = **61%** |
| 1000 m | 315/500 = **63%** | 36/36 = **100%** | 352/500 = **70%** | 25/28 = **89%** |

**Readout:**

- **Raleigh:** NOAA recall exceeds random at every buffer (e.g. **36% vs 6%** at 100 m; **89% vs 33%** at 500 m).
- **Houston:** At 100 m, NOAA recall (**11%**) is comparable to random (**13%**) — consistent with fine-buffer limits in **#3** (large AOI, dispersed reports). At wider buffers NOAA clearly exceeds random: **36% vs 22%** (250 m), **61% vs 41%** (500 m), **89% vs 70%** (1000 m). The old coin-flip argument is still invalid: 500 m recall is **61%**, not ~50%, and the spatial null at 500 m is **41%**, not 50%.

### Supplement table (Table SX — for manuscript)

| Buffer (m) | Raleigh NOAA (n=36) | Raleigh random (n=500) | Houston NOAA (n=28) | Houston random (n=500) |
|------------|---------------------|------------------------|---------------------|------------------------|
| 100 | 36% (13/36) | 6% (28/500) | 11% (3/28) | 13% (64/500) |
| 250 | 61% (22/36) | 16% (78/500) | 36% (10/28) | 22% (112/500) |
| 500 | 89% (32/36) | 33% (165/500) | 61% (17/28) | 41% (203/500) |
| 1000 | 100% (36/36) | 63% (315/500) | 89% (25/28) | 70% (352/500) |

*NOAA: N−M events only (independent test). Random: uniform AOI sample, seed 42, same ever-flooded map and metric.*

### Manuscript / rebuttal text

> To quantify performance relative to spatial chance, we compared independent NOAA recall to a **random-point baseline**: 500 locations drawn uniformly within each city AOI (seed 42), scored with the same buffered hit-rate metric on the pre-urban ever-flooded map. Random hit rates were well below NOAA recall at most buffers in both cities (Table SX). In Raleigh, random rates were 6%, 16%, 33%, and 63% at 100–1000 m, versus NOAA recall of 36%, 61%, 89%, and 100%. In Houston, random rates were 13%, 22%, 41%, and 70%, versus NOAA recall of 11%, 36%, 61%, and 89%; fine-buffer recall was comparable to random in Houston (11% vs 13% at 100 m), but exceeded the null at 250 m and wider (e.g. 61% vs 41% at 500 m). These baselines show that mid- and coarse-buffer recall is not explained by chance placement in the AOI. We did not use stream-buffer or FEMA overlays as headline baselines in this revision.

### What we did not do (out of minimal scope)

- Stream-proximity baseline (NHD buffers).
- FEMA NFHL overlap (**#4**) — point-in-SFHA baseline complete.

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

**Status:** **Not done** — **paper-integration agent task** (no repo dependency)

### What to do

1. For each in-text citation, confirm the source supports the specific claim (method, statistic, or general statement).
2. Remove or replace citations that overclaim (especially SAR capability, validation strength, or “multi-sensor” claims already fixed in #15).
3. Ensure Table S1 / validation citations point to NOAA, FEMA NFHL, Sentinel-1, and USGS metadata descriptions in Methods — not unsourced “local knowledge.”

### Suggested rebuttal sentence (if needed)

> We audited references against claims and removed or replaced citations that did not directly support the associated statements.

---

## Comment #17 — Limited statistics

**Reviewer concern:** No confidence intervals, per-event breakdown, mean distance error.

**Status:** **Addressed** (repo) · **Needs paper**

**Minimal scope:** Exact hit counts + Wilson 95% CIs; distance handled via multi-buffer design (**#3**). No per-event table, bootstrap, or median-distance GEE run.

### What we did

- All recall values reported as **hits/total** (Tables in **#3**, **Appendix E**, **Appendix F**).
- **Wilson 95% confidence intervals** on independent N−M recall (table below and **Appendix F**).

### Results — independent N−M recall with 95% CI (Wilson)

| Buffer | Raleigh | 95% CI | Houston | 95% CI |
|--------|---------|--------|---------|--------|
| 100 m | 13/36 = 36% | 22–52% | 3/28 = 11% | 4–27% |
| 250 m | 22/36 = 61% | 45–75% | 10/28 = 36% | 21–54% |
| 500 m | 32/36 = 89% | 75–96% | 17/28 = 61% | 42–76% |
| 1000 m | 36/36 = 100% | 90–100% | 25/28 = 89% | 73–96% |

Wide CIs at fine buffers (especially Houston, n = 28) reflect small independent test samples, not omitted analysis.

### Distance error (rebuttal — no new metric)

We report **buffered detection recall** at fixed tolerances (100–1000 m), not continuous distance-to-nearest-flood. Multi-buffer recall encodes spatial uncertainty in NOAA report locations (**#3**). Median distance to nearest SAR pixel was not computed in this revision.

### What we did not do

- Per-event recall breakdown.
- Bootstrap CIs (Wilson exact intervals suffice for binomial proportions).
- Median / mean distance to nearest flood pixel (GEE).

### Manuscript / rebuttal text

> Independent validation recall is reported with exact hit counts and **Wilson 95% confidence intervals** (Table SY). For Raleigh (n = 36), 500 m recall was 89% (32/36; 95% CI 75–96%). For Houston (n = 28), 500 m recall was 61% (17/28; 95% CI 42–76%). We evaluate agreement at fixed spatial buffers rather than reporting mean geolocation error; recall increases with buffer width as expected when NOAA points have positional uncertainty.

---

## Comment #18 — Study period and event-level catalog

**Reviewer concern:** 2010–2025 vs Sentinel-1 (2014+); need reproducible event table.

**Status:** **Addressed** (repo) · **Needs paper**

### What we did

- Unified study period: **2015–2025** everywhere.
- **Table S1** lists every NOAA event with coordinates, USGS gage on event date, SAR pairing when available, and study role.

| File (repo) | Contents |
|------|----------|
| `event_catalog_2015_2025.csv` | One row per NOAA event |
| `event_catalog_sar_composites_2015_2025.csv` | One row per S1 composite (includes Houston control) |

**Event counts (with coordinates):**

| City | N | N−M (test) | SAR in GEE map |
|------|---|------------|----------------|
| Raleigh | 49 | 37 | 5 composites |
| Houston | 55 | 29 | 10 composites (+ 1 control) |

**`study_role` values (Table S1 column):** `independent_validation`, `map_sar`, `map_sar_threshold_train`, `sar_matched_not_in_gee_map`, `excluded_no_coordinates`, `control_sar_no_flood` (Houston only).

### Manuscript / rebuttal text

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

> Independent validation used NOAA-reported flood locations from events without Sentinel-1 coverage (N−M), which did not contribute to the ever-flooded map built from SAR events (M). Buffered detection recall increased with tolerance distance as expected. For Raleigh (n = 36), recall was 36% at 100 m, 61% at 250 m, 89% at 500 m, and 100% at 1000 m. For Houston (n = 28), recall was 11% at 100 m, 36% at 250 m, 61% at 500 m, and 89% at 1000 m. Houston's lower recall at fine buffers likely reflects the larger metropolitan AOI and greater spatial spread of report locations relative to bayou-aligned flood detections. A random-point spatial null (500 locations per city, seed 42) yielded substantially lower hit rates at most buffers (Table SX). Detection thresholds (−1.8 dB VV+VH, −2.0 dB VV-only) were locked per city using a training subset of M events before map construction. Wilson 95% confidence intervals are in Table SY. All events are documented in a supplementary event catalog for 2015–2025 (Table S1).

---

## Appendix E — Random-point baseline (Table SX)

| Buffer (m) | Raleigh NOAA | Raleigh random | Houston NOAA | Houston random |
|------------|--------------|----------------|--------------|----------------|
| 100 | 36% (13/36) | 6% (28/500) | 11% (3/28) | 13% (64/500) |
| 250 | 61% (22/36) | 16% (78/500) | 36% (10/28) | 22% (112/500) |
| 500 | 89% (32/36) | 33% (165/500) | 61% (17/28) | 41% (203/500) |
| 1000 | 100% (36/36) | 63% (315/500) | 89% (25/28) | 70% (352/500) |

*NOAA: N−M independent test (focus AOI). Random: 500 points, uniform AOI, seed 42, same ever-flooded map and buffered hit-rate metric.*

---

## Appendix F — Recall with Wilson 95% CI (Table SY)

| Buffer (m) | Raleigh recall | 95% CI | Houston recall | 95% CI |
|------------|----------------|--------|----------------|--------|
| 100 | 36% (13/36) | 22–52% | 11% (3/28) | 4–27% |
| 250 | 61% (22/36) | 45–75% | 36% (10/28) | 21–54% |
| 500 | 89% (32/36) | 75–96% | 61% (17/28) | 42–76% |
| 1000 | 100% (36/36) | 90–100% | 89% (25/28) | 73–96% |

*Wilson score interval, 95% confidence, independent N−M NOAA points only.*

---

## Appendix G — FEMA NFHL point baseline (Table SZ)

| City | N−M points | Inside FEMA SFHA | Outside FEMA SFHA |
|------|------------|------------------|-------------------|
| Raleigh | 37 | 4 (10.8%) | 33 (89.2%) |
| Houston | 29 | 10 (34.5%) | 19 (65.5%) |

*FEMA NFHL Special Flood Hazard Areas (SFHA_TF = T); supplementary context only — not headline validation.*

---

## Appendix C — Limitations (Discussion)

- Urban SAR limits: layover, double-bounce; no coherence/PolSAR (**#5** — draft in comment section).
- NOAA remains the spatial reference (**#1**); not FEMA or aerial imagery for headline metric.
- FEMA NFHL point baseline (**#4**, Appendix G).
- USGS gage not used to filter events (**#8**); single station may not reflect local report locations.
- 100 m recall limited, especially Houston (**#3**).
- Recall with Wilson 95% CIs (**#17**, Table SY in Appendix F); no precision/IoU (**#10**).
- Random-point baseline (**#14**, Table SX in Appendix E).
- FEMA NFHL point baseline (**#4**, Table SZ in Appendix G).
- S1 window and temporal sampling (**#9**, **#12** — **#12** draft in comment section).
- Houston non-flood control documented (**#7**, **#11** — draft in comment sections); single control, no FP rate.
- SAR detects flood **presence, not depth or velocity** (**#13** — **in paper**).
- Ever-flooded layer intentionally generous; NOAA positional uncertainty.

---

## Appendix D — Reproducibility (repo maintainers only — paper agent can skip)

```bash
python3 code/validation/build_independent_validation.py
python3 code/validation/build_event_catalog.py
python3 code/validation/compute_recall_ci.py
python3 code/validation/compute_fema_overlap.py
```

GEE: `code/gee_mapping/generate_flood_hotspots_gee_upload.js` — for re-running validation, not required for manuscript integration.

Related docs: `validation_independence.md`, `event_selection_methodology.md`
