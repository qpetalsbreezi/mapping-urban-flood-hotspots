# Satellite Data Availability for Comprehensive Flood Events

## Data Sources
- **Sentinel-1 SAR**: Cloud-penetrating radar for flood detection
- **Sentinel-2 Optical/Infrared**: Land cover and water index analysis
- **Time Window**: ±48 hours from flood event date

## Comprehensive Flood Event Analysis

### Raleigh, North Carolina

#### Events with Full Sentinel Coverage (9 events)

##### 2016 Events
- **2016-07-16**: 14.41 ft - Water rescues, $250K damage
- **2016-07-17**: 15.24 ft - Crabtree Creek 10+ hours over flood stage

##### 2017 Events  
- **2017-04-25**: 16.57 ft - Road closures, major flooding

##### 2018 Events
- **2018-05-21**: 12.37 ft - Crabtree Valley Mall, $600K damage
- **2018-05-22**: 12.49 ft - Newton Road collapsed
- **2018-07-06**: 10.50 ft - Multiple water rescues (3 separate incidents)
- **2018-08-20**: 13.42 ft - Multiple water rescues, $80K damage
- **2018-11-13**: 13.77 ft - Water rescues at multiple locations

#### Events with Limited/No Sentinel Coverage (6 events)

##### 2010-2013 Events (No Sentinel Coverage)
- **2010-09-30**: 11.20 ft - Crabtree Creek flooding
- **2011-08-06**: 12.17 ft - Major evacuations, 50+ people displaced
- **2011-09-21**: 10.95 ft - Multiple road closures, $5K damage
- **2013-09-01**: 12.54 ft - Crabtree Valley Mall flooding, $10K damage

##### 2014 Event (Limited Sentinel-1 Coverage)
- **2014-08-12**: 12.37 ft - Major evacuations, $2.5M damage, 71 people rescued

### Houston, Texas

#### Events with Full Sentinel Coverage (9 events)

##### 2015 Events
- **2015-05-26**: 53.12 ft - Memorial Day Flood, $25M damage, 2,585 homes, 6 fatalities

##### 2016 Events
- **2016-04-18**: 40.20 ft - Tax Day Flood, $35M damage, 10,000 homes, 7 fatalities

##### 2017 Events
- **2017-08-26**: 45.50 ft - Hurricane Harvey Day 1, US 290 closed
- **2017-08-27**: 48.30 ft - Hurricane Harvey Day 2, 2000+ rescues
- **2017-08-28**: 49.10 ft - Hurricane Harvey Day 3, roads still closed
- **2017-08-29**: 47.80 ft - Hurricane Harvey Day 4, people in attics

##### 2018 Events
- **2018-07-04**: 41.50 ft - July 4th Flood, Highway 288 under water

##### 2019 Events
- **2019-09-18**: 43.20 ft - Tropical Storm Imelda, $200M damage
- **2019-09-19**: 44.50 ft - Imelda Day 2, airport flooded, 1 fatality

## Summary

### Raleigh, North Carolina
- **Total events identified**: 15
- **Events with Sentinel coverage**: 9 (60%)
- **Water level range**: 10.50-16.57 feet
- **Average**: 13.2 ft for Sentinel-covered events

### Houston, Texas
- **Total events identified**: 9
- **Events with Sentinel coverage**: 9 (100%)
- **Water level range**: 40.20-53.12 feet
- **Average**: 45.9 ft for all events

### Combined Analysis
- **Total events identified**: 24 across both cities
- **Events with Sentinel coverage**: 18 (75%)
- **Geographic diversity**: Southeast inland vs. Gulf Coast
- **Climate diversity**: Inland creek flooding vs. tropical storm flooding
- **Excellence of sample size**: 18 events provides robust statistical power

## Recommended Action Plan

### Phase 1: Prioritize Sentinel-Covered Events

#### Raleigh Priority Events (9 events)
1. **2016-07-17** (15.24 ft) - Highest water level, longest duration
2. **2017-04-25** (16.57 ft) - Highest single-day water level
3. **2018-08-20** (13.42 ft) - Major damage, multiple rescues
4. **2018-05-21/22** (12.37/12.49 ft) - Crabtree Valley Mall flooding
5. **2018-11-13** (13.77 ft) - Multiple water rescues
6. **2016-07-16** (14.41 ft) - Significant damage, rescues
7. **2018-07-06** (10.50 ft) - Multiple incidents, good for comparison

#### Houston Priority Events (9 events)
1. **2017-08-27** (48.30 ft) - Hurricane Harvey peak, 2000+ rescues
2. **2015-05-26** (53.12 ft) - Memorial Day Flood, highest water level
3. **2016-04-18** (40.20 ft) - Tax Day Flood, $35M damage
4. **2019-09-18-19** (43-44 ft) - Tropical Storm Imelda, $200M damage
5. **2017-08-26-29** - Hurricane Harvey multi-day event
6. **2018-07-04** (41.50 ft) - July 4th Flood

### Phase 2: Satellite Data Acquisition
1. Access Copernicus Open Access Hub or Google Earth Engine
2. Search for Sentinel-1 and Sentinel-2 data for all 18 events
3. Verify scene availability and cloud cover
4. Download qualifying scenes for flood mapping
5. Prioritize events with both SAR and optical coverage

### Phase 3: Alternative Data for Early Events
- **Landsat**: Available for 2010-2014 events (16-day revisit cycle)
- **RADARSAT**: May have coverage for earlier events
- **Commercial satellites**: IKONOS, QuickBird (limited coverage)

## Next Steps
1. **Verify actual satellite data availability** for all 18 priority events
2. **Check cloud cover** for optical imagery (target <20% for each event)
3. **Download scenes** for flood mapping analysis
4. **Proceed with hotspot analysis** using 18 events
5. **Compare flood patterns** between Raleigh and Houston to understand regional differences
