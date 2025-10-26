# Satellite Data Acquisition Plan

## Overview
This document outlines the plan for acquiring Sentinel-1 and Sentinel-2 satellite data for 18 major flood events across Raleigh, NC and Houston, TX.

## Data Platforms

### Primary Platforms
1. **Copernicus Open Access Hub** (https://scihub.copernicus.eu/)
   - Direct access to Sentinel-1 and Sentinel-2 data
   - Registration required (free)
   - Download via API or browser interface

2. **Google Earth Engine** (https://earthengine.google.com/)
   - Cloud-based processing platform
   - Pre-processed Sentinel data
   - Python and JavaScript APIs
   - Requires Google account (free with approval)

## Search Strategy

### Time Window
- **Primary**: ±48 hours from flood event date (for immediate flood impact)
- **Secondary**: ±7 days (for pre/post comparison)

### Data Requirements

#### Sentinel-1 SAR (Cloud-penetrating radar)
- **Use**: Flood water detection, all-weather capability
- **Priority**: CRITICAL - works through clouds
- **Interferometric Wide Swath (IW)** mode preferred
- **VH polarization** (vertical-horizontal) optimal for water detection

#### Sentinel-2 Optical (Multispectral)
- **Use**: Land cover analysis, Normalized Difference Water Index (NDWI)
- **Priority**: HIGH - for comparison and validation
- **Target**: Cloud cover < 20%
- **Bands**: Blue (B2), Green (B3), Red (B4), NIR (B8), SWIR (B11, B12)

## Geographic Areas of Interest

### Raleigh, North Carolina
**Coordinates**: 35.7796° N, 78.6382° W  
**Study Area**: ~25 km × 25 km centered on Crabtree Creek  
**Tiles**:
- Sentinel-2 Tile: **17SPF** (or 18SVE depending on area)
- Sentinel-1 Track: Various (check archive)

### Houston, Texas
**Coordinates**: 29.7604° N, 95.3698° W  
**Study Area**: ~30 km × 30 km covering Buffalo Bayou and Harris County  
**Tiles**:
- Sentinel-2 Tile: **15RTQ** (or 15RTN depending on area)
- Sentinel-1 Track: Various (check archive)

## Priority Event List

### Raleigh Events (9 with Sentinel coverage)

| Date | Water Level | Search Date Range | Priority |
|------|-------------|-------------------|----------|
| 2016-07-16 | 14.41 ft | 2016-07-14 to 2016-07-18 | HIGH |
| 2016-07-17 | 15.24 ft | 2016-07-15 to 2016-07-19 | CRITICAL |
| 2017-04-25 | 16.57 ft | 2017-04-23 to 2017-04-27 | CRITICAL |
| 2018-05-21 | 12.37 ft | 2018-05-19 to 2018-05-23 | HIGH |
| 2018-05-22 | 12.49 ft | 2018-05-20 to 2018-05-24 | HIGH |
| 2018-07-06 | 10.50 ft | 2018-07-04 to 2018-07-08 | MEDIUM |
| 2018-08-20 | 13.42 ft | 2018-08-18 to 2018-08-22 | HIGH |
| 2018-11-13 | 13.77 ft | 2018-11-11 to 2018-11-15 | HIGH |

### Houston Events (9 with Sentinel coverage)

| Date | Water Level | Search Date Range | Priority |
|------|-------------|-------------------|----------|
| 2015-05-26 | 53.12 ft | 2015-05-24 to 2015-05-28 | CRITICAL |
| 2016-04-18 | 40.20 ft | 2016-04-16 to 2016-04-20 | CRITICAL |
| 2017-08-26 | 45.50 ft | 2017-08-24 to 2017-08-28 | CRITICAL |
| 2017-08-27 | 48.30 ft | 2017-08-25 to 2017-08-29 | CRITICAL |
| 2017-08-28 | 49.10 ft | 2017-08-26 to 2017-08-30 | CRITICAL |
| 2017-08-29 | 47.80 ft | 2017-08-27 to 2017-08-31 | CRITICAL |
| 2018-07-04 | 41.50 ft | 2018-07-02 to 2018-07-06 | HIGH |
| 2019-09-18 | 43.20 ft | 2019-09-16 to 2019-09-20 | HIGH |
| 2019-09-19 | 44.50 ft | 2019-09-17 to 2019-09-21 | HIGH |

## Data Acquisition Steps

### Step 1: Google Earth Engine Setup
```python
import ee
ee.Authenticate()
ee.Initialize()

# Define area of interest for each city
raleigh_aoi = ee.Geometry.Point(-78.6382, 35.7796).buffer(15000)  # 15km radius
houston_aoi = ee.Geometry.Point(-95.3698, 29.7604).buffer(15000)
```

### Step 2: Sentinel-1 Search
```python
# Example for Raleigh 2016-07-17
start_date = '2016-07-15'
end_date = '2016-07-19'

collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
    .filterBounds(raleigh_aoi) \
    .filterDate(start_date, end_date) \
    .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']))
```

### Step 3: Sentinel-2 Search
```python
collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(raleigh_aoi) \
    .filterDate(start_date, end_date) \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
```

### Step 4: Data Download
1. Export images to Google Drive or Google Cloud Storage
2. Download for local processing
3. Pre-process Sentinel-1 (thermal noise removal, calibration)
4. Pre-process Sentinel-2 (atmospheric correction already applied)

## Expected Data Availability

### Sentinel-1 Coverage
- **Revisit period**: 6 days (with two satellites)
- **Expected scenes**: 1-2 scenes per event date
- **Confidence**: HIGH - SAR operates in all weather

### Sentinel-2 Coverage
- **Revisit period**: 5 days (with two satellites)
- **Expected scenes**: 1-2 scenes per event date
- **Cloud cover risk**: HIGH during flood events
- **Confidence**: MEDIUM - may have cloud cover issues

## Quality Control

### Acceptance Criteria
1. **Sentinel-1**: 
   - VH polarization available
   - IW mode preferred
   - Geometric accuracy validated

2. **Sentinel-2**:
   - Cloud cover < 20%
   - All RGB + NIR + SWIR bands available
   - Processing baseline 02.05 or later (atmospheric correction)

### Data Rejection Criteria
- Cloud cover > 30% (Sentinel-2)
- Missing polarizations (Sentinel-1)
- Processing errors in metadata
- Geometric distortion or missing data over AOI

## Storage Plan

### Directory Structure
```
data/processed/satellite/
├── raleigh/
│   ├── sentinel1/
│   ├── sentinel2/
│   └── preprocessed/
└── houston/
    ├── sentinel1/
    ├── sentinel2/
    └── preprocessed/
```

### Expected Data Volume
- Sentinel-1 scene: ~1 GB
- Sentinel-2 scene: ~1.5 GB
- Total estimated: ~50-60 GB for 18 events

## Next Steps

1. **Register** for Copernicus Open Access Hub
2. **Apply** for Google Earth Engine access
3. **Test search** for one event to validate workflow
4. **Download** all available scenes for priority events
5. **Verify** data quality and completeness
6. **Proceed** with flood mapping and hotspot analysis

## Timeline Estimate

- **Setup and registration**: 1-2 days
- **Data search and download**: 1 week
- **Quality control**: 2-3 days
- **Total**: ~10 days
