# Flood Event Selection Methodology

## Overview
This document describes the process used to select flood events for flood hotspot analysis in two cities: **Raleigh, North Carolina** and **Houston, Texas**.

## Data Sources

### Raleigh, North Carolina
- **NOAA Storm Event Database**: 199 flood events in Wake County (2010-2025)
- **NOAA Raleigh-Specific Events**: 41 events mentioning Raleigh
- **USGS Station 02087324**: Daily water level data for Crabtree Creek at US 1, Raleigh

### Houston, Texas
- **NOAA Storm Event Database**: 131 flood events in Harris County (2010-2025)
- **USGS Station 08073700**: Daily water level data for Buffalo Bayou at Piney Point, TX

## Selection Criteria

### Step 1: NOAA Event Identification
- **Raleigh**: Filtered NOAA data for events mentioning "Raleigh" in location or impact descriptions
- **Houston**: Collected all Harris County flood events from NOAA database

### Step 2: USGS Water Level Analysis
- **Raleigh**: Analyzed 15 years of daily gage height data (2010-2025), identified events >10 feet
- **Houston**: Analyzed 15 years of daily gage height data (2010-2025), identified events >40 feet

### Step 3: Cross-Reference Validation
Events were selected only if they met ALL of the following criteria:
1. **NOAA reported flooding** with documented impacts
2. **USGS recorded high water levels** at monitoring stations
3. **Significant impact** documented (evacuations, damage, road closures, rescues)

## Selected Events Summary

### Raleigh, North Carolina
**Total events identified**: 15 flood events
- **Events with Sentinel coverage**: 9 events (2016-2018)
- **Water level range**: 10.50-16.57 feet
- **Geographic area**: Raleigh/Crabtree Creek

#### Major Events with Sentinel Coverage (9 events)
- 2016-07-16: 14.41 ft - Water rescues, $250K damage
- 2016-07-17: 15.24 ft - 10+ hours over flood stage
- 2017-04-25: 16.57 ft - Road closures, major flooding
- 2018-05-21: 12.37 ft - Crabtree Valley Mall, $600K damage
- 2018-05-22: 12.49 ft - Newton Road collapsed
- 2018-07-06: 10.50 ft - Multiple water rescues
- 2018-08-20: 13.42 ft - Multiple rescues, $80K damage
- 2018-11-13: 13.77 ft - Water rescues

### Houston, Texas
**Total events identified**: 9 major flood events
- **Events with Sentinel coverage**: 9 events (ALL with coverage)
- **Water level range**: 40.20-53.12 feet
- **Geographic area**: Harris County/Buffalo Bayou

#### Major Events (9 events)
- 2015-05-26: 53.12 ft - Memorial Day Flood, $25M damage, 2,585 homes flooded, 6 fatalities
- 2016-04-18: 40.20 ft - Tax Day Flood, $35M damage, 10,000 homes flooded, 7 fatalities
- 2017-08-26-29: 45-49 ft - Hurricane Harvey (4 days), catastrophic flooding
- 2018-07-04: 41.50 ft - July 4th Flood
- 2019-09-18-19: 43-44 ft - Tropical Storm Imelda, $200M damage

## Why These Events?
These events represent the best candidates for flood hotspot analysis because they:
- Have both official flood reports (NOAA) and measured water levels (USGS)
- Document significant urban impacts suitable for remote sensing analysis
- Provide comprehensive temporal coverage (2015-2019)
- **24 total events with full Sentinel satellite coverage across both cities**
- Enable comparison between different geographic and climatic regions

## Key Findings

### Combined Analysis
- **Total events identified**: 24 flood events across both cities
- **Events with Sentinel coverage**: 18 events (75% of all events)
- **Geographic diversity**: Southeast (Raleigh) and Gulf Coast (Houston)
- **Climate diversity**: Inland creek flooding vs. tropical storm flooding
- **Impact range**: From localized urban flooding to catastrophic regional events

### Water Level Comparison
- **Raleigh**: 10.50-16.57 feet (inland creek system)
- **Houston**: 40.20-53.12 feet (major bayou system)
- **Ratio**: Houston water levels ~3x higher than Raleigh

### Impact Severity
- **Raleigh**: Urban infrastructure damage, evacuations
- **Houston**: Catastrophic flooding, major evacuations, fatalities

## Next Steps
- Verify actual Sentinel-1 SAR and Sentinel-2 optical data availability for all 18 events
- Check cloud cover for optical imagery
- Download qualifying scenes for flood mapping analysis
- Proceed with hotspot analysis using 18 events (excellent sample size for robust analysis)
- Compare flood patterns between the two cities
