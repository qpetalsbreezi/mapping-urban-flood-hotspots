# Flood Event Selection Methodology

## Overview
This document describes the process used to select 7 major flood events for flood hotspot analysis in Raleigh, North Carolina.

## Data Sources
- **NOAA Storm Event Database**: 199 flood events in Wake County (2010-2025)
- **NOAA Raleigh-Specific Events**: 41 events mentioning Raleigh
- **USGS Station 02087324**: Daily water level data for Crabtree Creek at US 1, Raleigh

## Selection Criteria

### Step 1: NOAA Event Identification
- Filtered NOAA data for events that specifically mentioned "Raleigh" in location or impact descriptions
- Identified 41 Raleigh-specific flood events across the study period

### Step 2: USGS Water Level Analysis
- Analyzed 15 years of daily gage height data (2010-2025)
- Identified high water events where gage height exceeded 10 feet
- Peak events ranged from 11.20 to 17.49 feet

### Step 3: Cross-Reference Validation
Events were selected only if they met ALL of the following criteria:
1. **NOAA reported flooding** in Raleigh with documented impacts
2. **USGS recorded high water levels** (>10 feet at Crabtree Creek)
3. **Significant impact** documented (evacuations, damage, road closures)

## Selected Events (15 total, 9 with Sentinel coverage)

### Events with Full Sentinel Coverage (9 events)
| Date | Water Level | Event Highlights |
|------|-------------|------------------|
| 2016-07-16 | 14.41 ft | Water rescues, $250K damage |
| 2016-07-17 | 15.24 ft | 10+ hours over flood stage |
| 2017-04-25 | 16.57 ft | Road closures, major flooding |
| 2018-05-21 | 12.37 ft | Crabtree Valley Mall, $600K damage |
| 2018-05-22 | 12.49 ft | Newton Road collapsed |
| 2018-07-06 | 10.50 ft | Multiple water rescues |
| 2018-08-20 | 13.42 ft | Multiple rescues, $80K damage |
| 2018-11-13 | 13.77 ft | Water rescues |

### Events with Limited/No Sentinel Coverage (6 events)
| Date | Water Level | Event Highlights |
|------|-------------|------------------|
| 2010-09-30 | 11.20 ft | Crabtree Creek flooding |
| 2011-08-06 | 12.17 ft | 50+ people evacuated |
| 2011-09-21 | 10.95 ft | Multiple road closures |
| 2013-09-01 | 12.54 ft | Crabtree Valley Mall flooding |
| 2014-08-12 | 12.37 ft | $2.5M damage, 71 people rescued |

## Why These Events?
These 15 events represent the best candidates for flood hotspot analysis because they:
- Have both official flood reports (NOAA) and measured water levels (USGS)
- Document significant urban impacts suitable for remote sensing analysis
- Provide comprehensive temporal coverage (2010-2018)
- Include the highest recorded water levels (10.50-16.57 ft)
- **9 events have full Sentinel satellite coverage** (2016-2018)

## Key Findings
- **Total events identified**: 15 flood events
- **Events with Sentinel coverage**: 9 events (2016-2018)
- **Water level range**: 10.50-16.57 feet
- **Impact severity**: Major evacuations, water rescues, significant damage
- **Geographic consistency**: All Raleigh/Crabtree Creek area

## Next Steps
- Verify actual Sentinel-1 SAR and Sentinel-2 optical data availability for 9 events
- Check cloud cover for optical imagery
- Download qualifying scenes for flood mapping analysis
- Proceed with hotspot analysis using 9 events (excellent sample size for robust analysis)
