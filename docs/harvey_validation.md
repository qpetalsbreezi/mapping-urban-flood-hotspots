# Hurricane Harvey (Aug 2017) — Ground-Truth Validation Case

We use **Houston, Hurricane Harvey (August 2017)** as the primary event for validating SAR-based flood detection, because it is the only event in our pipeline with both **Sentinel-1 SAR** coverage and **NOAA high-resolution aerial emergency imagery**.

## In the pipeline

- **Event ID:** `721084_and_5_more` (composite of 6 NOAA reports)
- **Event date:** 2017-08-27
- **S1 before:** 2017-08-05 | **S1 after:** 2017-08-29 (2 days after peak)
- **NOAA event IDs:** 721084, 721085, 721091, 721096, 721101, 721136 (Aug 27–29)
- **Validation points:** 6 NOAA report locations (begin/end) used for 500 m / 1000 m hit checks in the hotspot script and single-event viewer

## Ground truth

- **NOAA Storm Events:** Reported flood locations (lat/lon) for the 6 Harvey reports in Harris County.
- **NOAA NGS Emergency Response Imagery:** Aerial imagery (35–50 cm resolution) acquired over the Houston region after Harvey. Use for visual comparison or to derive flood extent for validation.
  - **Viewer and download:** [storms.ngs.noaa.gov/storms/harvey/index.html](https://storms.ngs.noaa.gov/storms/harvey/index.html) (use index.html; the folder URL can return Access Denied). Or start at [storms.ngs.noaa.gov](https://storms.ngs.noaa.gov/) and click **Hurricane Harvey (2017)**.
  - **Metadata:** [NOAA InPort — Hurricane Harvey Emergency Response Imagery](https://www.fisheries.noaa.gov/inport/item/52376) (or search “Harvey” at storms.ngs.noaa.gov)

## How we use it

- In **generate_flood_hotspots.js**, Harvey is one of the Houston events; NOAA point validation (match % at 500 m and 1000 m) is printed for this event.
- In **visualize_flood_events.js**, select city **Houston** and event **2017-08-27 (composite: 6 events)** to view S1 before/after, flood mask, and NOAA flood location markers.
- For a report or poster: state that Harvey is the validation case where SAR-derived flood extent can be compared to NOAA point reports and to NOAA aerial imagery.
