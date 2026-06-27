# Flood Event Selection Methodology

## Overview

This document describes how flood events are selected for hotspot mapping and validation in **Raleigh, North Carolina** and **Houston, Texas**. The **study period is 2015–2025**, aligned with Sentinel‑1 availability (operational from late 2014).

**Inclusion rule:** NOAA-reported urban flood events with coordinates in the study period. **USGS gauge levels are not used as a filter** (see [USGS role](#usgs-stream-gauge-role) below).

## Data Sources

### Raleigh, North Carolina
- **NOAA Storm Event Database**: Wake County flood events filtered for the Raleigh area (`noaa_raleigh_flood_events.csv`)
- **USGS Station 02087324**: Daily gage height for Crabtree Creek at US 1, Raleigh (supplementary metadata only)

### Houston, Texas
- **NOAA Storm Event Database**: Harris County flood events filtered for Houston (`noaa_houston_flood_events.csv`)
- **USGS Station 08073700**: Daily gage height for Buffalo Bayou at Piney Point, TX (supplementary metadata only)

## Selection Criteria

### Step 1: NOAA event identification

Automated filter via `code/event_selection/filter_noaa_events.py`:

| City | NOAA filter |
|------|-------------|
| **Raleigh** | North Carolina, Wake County, Flash Flood / Flood event types; keywords matching Raleigh area |
| **Houston** | Texas, Harris County, Flash Flood / Flood event types; keywords matching Houston |

This produces the raw event CSVs used by the imagery matcher and validation scripts. **No USGS join is applied.**

### Step 2: Study-period and coordinate filter

For mapping and validation (`build_independent_validation.py`, `build_event_catalog.py`):

1. Event date in **2015–2025**
2. Valid **BEGIN_LAT** / **BEGIN_LON**

Events missing coordinates are excluded from analysis but listed in the event catalog with reason `excluded_no_coordinates`.

### Step 3: SAR availability (defines M vs N−M)

| Group | Definition | Role |
|-------|------------|------|
| **N** | All NOAA events passing Steps 1–2 | Event universe |
| **M** | Subset with usable Sentinel‑1 before/after pairs | Build ever‑flooded map |
| **N − M** | NOAA floods without SAR coverage | Independent validation locations |

SAR composites included in the final GEE map are **manually curated** from the imagery-matching pipeline (see `validation_split.json` and `generate_flood_hotspots_gee_upload.js`).

## USGS stream gauge role

USGS data is **not** an inclusion criterion in the current pipeline.

- **Early project work (Oct 2025):** A manual cross-reference identified ~15 Raleigh and ~9 Houston events where NOAA reports coincided with high gage readings (historically >10 ft Crabtree Creek, >40 ft Buffalo Bayou). That curated list was replaced in Dec 2025 by the broader NOAA-only filter above.
- **Current practice:** Daily gage height on each event date is recorded in [`data/processed/event_catalog_2015_2025.csv`](../data/processed/event_catalog_2015_2025.csv) for context. Columns `usgs_gage_ft_on_event_date` and `usgs_exceeds_city_threshold` are **informational** (legacy reference levels: 10 ft Raleigh, 40 ft Houston)—they do **not** determine whether an event is included.

**Why not filter on gauge?** NOAA report locations capture localized street and creek flooding that may not align with a single downstream gage on the event date; requiring arbitrary gage cutoffs would shrink the validation set without improving reproducibility (reviewer comment **#8**).

## Event counts (2015–2025, with coordinates)

| City | N (total) | N−M (independent test) | SAR in GEE map |
|------|-----------|------------------------|----------------|
| **Raleigh** | 49 | 37 | 5 composites |
| **Houston** | 55 | 29 | 10 composites (+ 1 control, excluded from map) |

Regenerate counts and catalogs:

```bash
python3 code/validation/build_independent_validation.py
python3 code/validation/build_event_catalog.py
```

## Reproducibility

| Script | Output |
|--------|--------|
| `filter_noaa_events.py` | `data/raw/{city}/event_detection/noaa_{city}_flood_events.csv` |
| `match_event_imagery.py` | `event_imagery_matches.csv` (Sentinel‑1/2 pairing) |
| `build_independent_validation.py` | `validation_split.json`, GEE validation locations |
| `build_event_catalog.py` | `event_catalog_2015_2025.csv` (full event table) |

See also: [`validation_independence.md`](validation_independence.md), [`paper_reviewer_comment_changes.md`](paper_reviewer_comment_changes.md).
