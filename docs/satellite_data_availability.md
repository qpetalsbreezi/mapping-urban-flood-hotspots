# Satellite Data Availability for Selected Flood Events

## Data Sources
- **Sentinel-1 SAR**: Cloud-penetrating radar for flood detection
- **Sentinel-2 Optical/Infrared**: Land cover and water index analysis
- **Time Window**: ±48 hours from flood event date

## Flood Events and Satellite Availability

### Event 1: 2010-09-30 (Crabtree Creek flooding)
- **Water Level**: 11.20 ft
- **Sentinel-1 Launch**: April 2014 (NOT available for this event)
- **Sentinel-2 Launch**: June 2015 (NOT available for this event)
- **Status**: ❌ No Sentinel data available - too early

### Event 2: 2011-08-06 (Major evacuations)
- **Water Level**: 12.17 ft
- **Sentinel-1 Launch**: April 2014 (NOT available)
- **Sentinel-2 Launch**: June 2015 (NOT available)
- **Status**: ❌ No Sentinel data available - too early

### Event 3: 2011-09-21 (Multiple road closures)
- **Water Level**: 10.95 ft
- **Sentinel-1 Launch**: April 2014 (NOT available)
- **Sentinel-2 Launch**: June 2015 (NOT available)
- **Status**: ❌ No Sentinel data available - too early

### Event 4: 2013-09-01 (Crabtree Valley Mall flooding)
- **Water Level**: 12.54 ft
- **Sentinel-1 Launch**: April 2014 (NOT available)
- **Sentinel-2 Launch**: June 2015 (NOT available)
- **Status**: ❌ No Sentinel data available - too early

### Event 5: 2014-08-12 (Major evacuations, $2.5M damage)
- **Water Level**: 12.37 ft
- **Sentinel-1 Launch**: April 2014 (Marginal coverage - system just launched)
- **Sentinel-2 Launch**: June 2015 (NOT available)
- **Status**: ⚠️ Limited Sentinel-1 data - may need to check availability

### Event 6: 2016-07-17 (10+ hours over flood stage)
- **Water Level**: 15.24 ft
- **Sentinel-1 Coverage**: Full operational
- **Sentinel-2 Coverage**: Full operational
- **Status**: ✅ Good satellite coverage expected

### Event 7: 2017-04-25 (Road closures, major flooding)
- **Water Level**: 16.57 ft
- **Sentinel-1 Coverage**: Full operational
- **Sentinel-2 Coverage**: Full operational
- **Status**: ✅ Good satellite coverage expected

## Summary

### Events with Full Coverage (2)
- **2016-07-17**: Highest priority - highest water level (15.24 ft) with good coverage
- **2017-04-25**: Second highest water level (16.57 ft) with good coverage

### Events with Limited/No Coverage (5)
- **2010-2013 events**: Too early for Sentinel satellites
- **2014 event**: Marginal Sentinel-1 coverage (system just launched)

## Recommended Action Plan

### Phase 1: Check 2016 and 2017 Events
1. Verify Sentinel-1 SAR data availability for July 2016 and April 2017
2. Verify Sentinel-2 optical data availability for same periods
3. Check for cloud-free optical imagery

### Phase 2: Alternative Data Sources for Early Events
- **Landsat**: Available for 2010-2014 events (16-day revisit cycle)
- **RADARSAT**: May have coverage for earlier events
- **Commercial satellites**: IKONOS, QuickBird (limited coverage)

### Phase 3: Focus on Best Available Events
Priority events with both significant impact AND satellite coverage:
1. **2016-07-17** (Water level: 15.24 ft)
2. **2017-04-25** (Water level: 16.57 ft)

## Next Steps
1. Access Copernicus Open Access Hub or Google Earth Engine
2. Search for Sentinel-1 and Sentinel-2 data for July 2016 and April 2017
3. Verify scene availability and cloud cover
4. Download qualifying scenes for flood mapping
