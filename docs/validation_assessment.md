# Validation Process Assessment

This document summarizes whether our evaluation process (SAR-derived flood map vs. NOAA report locations) is methodologically sound, based on the current implementation and common practice in the literature.

---

## What We Do

- **Product validated:** Aggregate pre-urban flood mask (pixel = 1 if *any* event detected flood there).
- **Reference:** NOAA Storm Events report locations (begin/end or similar points per event), merged across events and filtered to the focus AOI.
- **Metric:** For each NOAA point, we check whether the aggregate mask has at least one flood pixel within a **500 m** or **1000 m** buffer (using `reduceRegion` with max). We report the fraction of points that “hit” at each buffer (e.g. 72% within 500 m, 97% within 1000 m for Houston).

---

## Is This Solid?

**Yes, for the type of product and reference data we have.** Below is the reasoning and where the main caveats are.

### 1. Buffer choice (500 m and 1000 m)

- **Literature:** Validating flood inundation maps against point observations often uses spatial tolerance buffers (e.g. 500 m–1 km) to account for:
  - Positional uncertainty in the reference points (e.g. report location vs. actual inundation).
  - Coarse resolution and geometric/classification uncertainty in the flood map.
- **Conclusion:** Using both 500 m and 1000 m is **reasonable and consistent with common practice** for point-to-map validation.

### 2. Aggregate map vs. per-event

- We validate the **union of all event extents** (aggregate pre-urban mask) against **all** NOAA points.
- This answers: “Do reported flood locations fall inside areas where we *ever* detected flooding?” — which fits a **hotspot/frequency** product.
- Per-event validation (each event’s mask vs. that event’s points only) would be stricter but requires correct event–event matching; the aggregate approach is a **valid and interpretable** summary for a multi-event hotspot map.

### 3. Pre-urban mask for validation

- Validation uses the **pre-urban** mask (threshold + permanent water exclusion + speckle filter; **no** urban mask).
- So we do **not** require SAR to detect flood in dense urban areas where SAR is often unreliable; we only validate where we allow flood to be mapped.
- **Permanent water is excluded** from the validation mask, which aligns with recommendations to avoid inflating accuracy by counting permanent water as “correct” flood.

### 4. Circularity / bias (NOAA used twice)

- **How NOAA is used:**  
  (1) **Event selection:** We include only events that have NOAA flood reports (and USGS + Sentinel coverage).  
  (2) **Validation:** We use NOAA report locations as the reference points.
- **Effect:** We are **not** evaluating “did we miss events?” — we only evaluate “for events we know had reported flooding, is our SAR flood near the reported locations?” So:
  - Hit rates can be **optimistic** in the sense that we preselected events with known flooding.
  - We are **not** double-using NOAA to train or tune the algorithm; the flood *extent* comes only from SAR. So the circularity is **moderate** and mainly a limitation to state, not a fatal flaw.
- **Recommendation:** In the poster/abstract, state clearly that validation is “agreement between SAR-derived flood extent and NOAA report locations for events that had both NOAA reports and Sentinel-1 coverage,” and that event set is chosen using NOAA + USGS + satellite availability.

### 5. Standard metrics (CSI, POD, FAR)

- **Common practice:** Binary accuracy metrics (Critical Success Index, Probability of Detection, False Alarm Ratio) are usually computed when both **predicted** and **reference** are full binary maps (pixel vs. pixel).
- **Our case:** Reference is **point-based** (NOAA locations only), not a full inundation map. With point reference, **“hit rate within distance buffer”** is a standard and acceptable way to assess spatial agreement.
- **Optional improvement:** If you later derive a reference flood map (e.g. from NOAA Harvey aerial imagery for a subset area), you could add pixel-wise CSI/POD/FAR for that area; the current point-based validation remains valid for the rest.

---

## Summary

| Aspect | Verdict |
|--------|--------|
| 500 m / 1000 m buffers | **Solid** — in line with spatial tolerance in flood map validation. |
| Aggregate map + all NOAA points | **Solid** — appropriate for a hotspot product. |
| Pre-urban mask, permanent water excluded | **Solid** — avoids known inflation and focuses on detectable flood. |
| NOAA used for event selection and validation | **Limitation** — state it; not circular in the “training” sense. |
| Point-based hit rate vs. pixel-wise metrics | **Solid** for point reference; pixel metrics would need a reference map. |

**Overall:** The evaluation process is **methodologically sound** for a science-fair level and for the data we have. The main improvement is to **state the limitation** (event set and reference both tied to NOAA) and to mention that Harvey has stronger validation potential via NOAA aerial imagery where that is used.

