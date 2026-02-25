# Results for Science Fair Poster

Use this as a checklist and source of numbers/figures for the **Results** section. Include **more rather than less**; the filtering funnel is strong evidence of a rigorous pipeline.

---

## 1. Event selection funnel (include this)

Showing how many events remain after each filter makes the method transparent and defensible. Use a **table or diagram** (e.g. funnel or flow).

### Raleigh, NC

| Step | Filter | Count | Notes |
|------|--------|-------|--------|
| 1 | NOAA Storm Events (Wake County, flood types) | **198** | Raw events from NOAA database |
| 2 | Raleigh-specific (location/narrative keyword) | **64** | Events mentioning Raleigh |
| 3 | USGS Crabtree Creek gage >10 ft + significant impact | **15** | Cross-reference with gauge; doc: event_selection_methodology.md |
| 4 | Sentinel-1 pre/post pair matched (same orbit) | **7** | From event_imagery_matches.csv |
| 5 | Used in hotspot map | **7** | All 7 have valid flood masks |

### Houston, TX

| Step | Filter | Count | Notes |
|------|--------|-------|--------|
| 1 | NOAA Storm Events (Harris County, flood types) | **129** | Raw events from NOAA database |
| 2 | Houston-specific (keyword filter) | **70** | Events mentioning Houston |
| 3 | USGS Buffalo Bayou gage >40 ft + significant impact | **9** | Major events (Memorial Day, Tax Day, Harvey, Imelda, etc.) |
| 4 | Sentinel-1 pre/post pair matched (same orbit) | **10** | From event_imagery_matches.csv (includes 1 control) |
| 5 | Used in hotspot map (flood events only) | **9** | Control event excluded from aggregation |

### Combined

- **Initial NOAA (county):** 198 + 129 = **327** events  
- **After location + USGS + significance:** 15 + 9 = **24** events  
- **With matched Sentinel-1 imagery:** 7 + 9 = **16** flood events (Houston control excluded)  
- **In hotspot maps:** **16 events** (7 Raleigh, 9 Houston)

*Why include this:* Judges and viewers see exactly how you went from hundreds of reports to a small, well-defined set of events with both ground truth and satellite data.

---

## 2. Flood hotspot maps (main visual)

- **Raleigh:** Aggregated map over 7 events. Colors: 1 event = yellow/orange, 2–3 = orange/red, 4+ = dark red (exact palette in code).
- **Houston:** Aggregated map over 9 events, same color scheme.
- **Caption:** Urban flood hotspot maps from Sentinel-1 SAR change detection; only urban/impervious areas (WorldCover + NLCD); permanent water excluded (JRC). Colors = number of events that detected flooding at each pixel.

*Generate:* Run `generate_flood_hotspots.js` in GEE for `raleigh` and `houston`; screenshot or export the hotspot layer.

---

## 3. Hotspot statistics (from GEE Console)

After running `generate_flood_hotspots.js`, copy from the Console:

- **Events aggregated:** 7 (Raleigh) or 9 (Houston)
- **Max frequency:** Highest number of events detecting flood at the same pixel (e.g. “up to 4 events at one location”).
- **Frequency distribution:** Table or bar chart of pixel counts (or area) at frequency 1, 2, 3, 4+.

Put these in a small **table or bar chart** on the poster.

---

## 4. Validation: NOAA point match rates

From the same script, the Console prints **NOAA point validation** per event (500 m and 1000 m buffers). Include:

- **Table:** Event | Date | NOAA pts | 500 m hit % | 1000 m hit %
- **Harvey (2017-08-27):** Call out explicitly—6 NOAA report locations; report 500 m and 1000 m match rates.
- **Short takeaway:** e.g. “X of Y reported flood locations (Z%) fell within 500 m of SAR-detected flood.”

*Generate:* Run script, copy the printed table into a poster table or figure.

---

## 5. Harvey ground-truth (validation case)

- **Statement:** Hurricane Harvey (Aug 2017) is the **only event** in our pipeline with both Sentinel-1 coverage and NOAA high-resolution emergency aerial imagery.
- **Event ID:** 721084_and_5_more (6 NOAA reports); S1 before 2017-08-05, after 2017-08-29.
- **Use:** Compare SAR flood extent to (1) NOAA report points and (2) NOAA NGS aerial imagery (storms.ngs.noaa.gov/storms/harvey/index.html).
- **Figure idea:** Map with SAR flood mask + NOAA points; optional side-by-side with aerial.

---

## 6. Single-event flood detection (example)

From `visualize_flood_events.js`, for **one** event (e.g. Harvey or one Raleigh event), show:

- S1 before (VV or false color)
- S1 after
- VV dB change (before − after)
- Final flood mask (urban-only, speckle filtered) with NOAA locations overlaid

*Caption:* “Example flood detection for [Event], [Date]. Red = SAR-detected flood; circles = NOAA report locations.”

---

## 7. Algorithm / filtering steps (short)

You can list these as “Processing steps” or “Detection pipeline”:

1. **Pre-event / post-event S1:** Same orbit; pre within ~30 days, post within ~2 days.
2. **Change detection:** dB difference (post − pre); negative = possible flood.
3. **Threshold:** Fixed −1.8 dB (VV+VH) or −2.0 dB (VV only); optional adaptive percentile.
4. **Urban mask:** WorldCover built-up or NLCD impervious ≥20%.
5. **Exclude permanent water:** JRC ≥50% occurrence.
6. **Speckle filter:** 90 m smoothing; keep only connected areas ≥5 pixels.

This shows that “flood” is not raw SAR drop but a defined, repeatable product.

---

## 8. Data sources (one line or small list)

- **Satellite:** Sentinel-1 GRD (VV, VH) — Google Earth Engine
- **Ground truth:** NOAA Storm Events (points), USGS gages (Crabtree Creek, Buffalo Bayou), NOAA NGS Harvey imagery
- **Masks:** ESA WorldCover, USGS NLCD, JRC Global Surface Water

---

## Suggested poster layout (Results section)

| Element | Content |
|--------|--------|
| **Funnel** | Table or diagram: NOAA → location filter → USGS → S1 matched → in hotspot (Raleigh + Houston counts) |
| **Maps** | Raleigh and Houston hotspot maps side by side |
| **Stats** | Events aggregated, max frequency, frequency distribution (table or bar) |
| **Validation table** | 500 m / 1000 m hit % for each event (or key events); highlight Harvey |
| **Harvey** | One sentence + one map (SAR + NOAA points; optional aerial comparison) |
| **Example event** | One before/after + change + flood mask + NOAA points |
| **Pipeline** | Short bullet list of algorithm steps (optional but good) |
| **Data** | One-line or short list of data sources |

---

## File references

- **Funnel counts:** `data/raw/*/event_detection/*.csv` (row counts minus header); `docs/event_selection_methodology.md`
- **Validation numbers:** GEE Console output from `generate_flood_hotspots.js`
- **Harvey validation:** `docs/harvey_validation.md`
- **Algorithm detail:** `docs/flood_hotspot_algorithm_plain.txt`
