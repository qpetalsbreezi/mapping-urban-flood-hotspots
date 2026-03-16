# Mapping Urban Flood Hotspots with Sentinel‑1

## Project Overview
This project maps recurring urban flood hotspots in **Raleigh, NC** and **Houston, TX** using Sentinel‑1 SAR imagery combined with NOAA Storm Events flood reports and USGS stream gauge data. For each city, historical flood events (2010–2025) are filtered using location criteria and high water levels, matched to pre‑ and post‑storm Sentinel‑1 image pairs, converted into per‑event flood masks, and then aggregated into multi‑event flood frequency maps. Validation compares the aggregate SAR‑derived flood extent to NOAA flood report locations (within 500 m and 1000 m) and, for Hurricane Harvey, independent aerial imagery.

## Project Structure

### Data Organization
- `data/raw/` - Original datasets (NOAA storm events for Wake/Harris Counties, USGS gauge data, event–imagery match CSVs)
- `data/processed/` - Processed event tables and any derived data products
- `data/external/` - Reference data and ground truth (e.g., Harvey aerial imagery links, land‑cover datasets)

### Code Organization
- `code/gee/generate_flood_hotspots.js` – Earth Engine script to build aggregate hotspot maps and run NOAA‑point validation.
- `code/gee/visualize_flood_events.js` – Event viewer for individual storms (before/after Sentinel‑1, optional optical, and flood masks).
- `code/gee/match_event_imagery.py` – Python helper to match NOAA events to Sentinel‑1/2 and Landsat imagery and export event/imagery CSVs.
- `code/gee/filter_noaa_events.py` – Filters NOAA Storm Events and joins with USGS gauge data to select major flood events.
- `code/gee/csv_to_js_events.py` – Converts event/imagery CSV into the JavaScript event configuration used by the GEE scripts.

### Documentation
- `docs/abstract.txt` – Science‑fair abstract.
- `docs/poster_content.txt` – Draft content and layout notes for the poster.
- `docs/event_selection_methodology.md` – Detailed description of how flood events were selected (NOAA + USGS, 2010–2025).
- `docs/harvey_validation.md` – Notes on Harvey (2017) validation using NOAA aerial imagery.
- `docs/validation_assessment.md` – Discussion of the evaluation design (NOAA points, buffers, aggregate map) and its strengths/limitations.
- `docs/goal_and_rationale.txt` – Plain‑language explanation of the project goal and why it matters.

## Methodology (High Level)
1. **Event Selection (2010–2025)**  
   Filter NOAA Storm Events for Wake County (Raleigh) and Harris County (Houston) using location keywords and impact descriptions, then require high water levels at USGS gauges (Crabtree Creek and Buffalo Bayou) to identify major urban flood events.

2. **Event–Imagery Matching**  
   For each selected event, use `match_event_imagery.py` to find suitable pre‑ and post‑storm Sentinel‑1 GRD scenes (same orbit, within a few days of the event) and optional Sentinel‑2/Landsat optical scenes.

3. **Per‑Event Flood Mapping (GEE)**  
   In Earth Engine, load the matched Sentinel‑1 before/after pair, smooth VV (and VH when available), compute change (after − before), and detect flood where backscatter drops below a tuned threshold (fixed or adaptive), after masking permanent water and focusing on built‑up/impervious areas.

4. **Hotspot Aggregation**  
   For each city, sum all per‑event flood masks to create a frequency map (how many events flooded each pixel) and classify it into hotspot levels (e.g., 1 event, 2–3 events, 4+ events).

5. **Validation**  
   Compare the aggregate (pre‑urban) flood map to NOAA flood report locations using 500 m and 1000 m buffers around each point (hit rate), and visually compare Hurricane Harvey flood extent with NOAA aerial imagery.

## Key Outputs
- Urban flood hotspot maps for Raleigh, NC and Houston, TX (Sentinel‑1–based frequency maps).
- Summary statistics on hotspot areas, event counts, and validation hit rates (500 m / 1000 m).
- Documentation for event selection, validation design, and science‑fair abstract/poster content.

## Dependencies (non‑exhaustive)
- Google Earth Engine (for `code/gee/*.js` scripts).
- Python 3.10+ (for helper scripts in `code/gee/*.py`).
- Common Python packages: `pandas`, `geopandas` (optional), and Earth Engine Python API if running `match_event_imagery.py` locally.
