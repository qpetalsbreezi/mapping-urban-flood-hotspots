# Sentinel-1 Search Plan for Raleigh Flood Events

## Priority Search Windows

### 1. July 2016 Flood (HIGHEST PRIORITY)
- **Flood dates**: July 16-17, 2016 (2 consecutive days)
- **Search window**: July 13-20, 2016
- **Target**: Find images on July 15, 16, 17, or 18
- **Why**: Consecutive flood days = better chance of capturing actual flooding

### 2. May 2018 Flood (HIGH PRIORITY)
- **Flood dates**: May 21-22, 2018 (2 consecutive days)
- **Search window**: May 18-25, 2018
- **Target**: Find images on May 20, 21, 22, or 23
- **Why**: Recent data, consecutive flood days

### 3. July 2018 Flood (MEDIUM PRIORITY)
- **Flood dates**: July 6, 2018 (multiple events same day)
- **Search window**: July 3-9, 2018
- **Target**: Find images on July 5, 6, or 7
- **Why**: Single day with multiple flood reports

### 4. August 2018 Flood (MEDIUM PRIORITY)
- **Flood dates**: August 20, 2018
- **Search window**: August 17-23, 2018
- **Target**: Find images on August 19, 20, or 21
- **Why**: Recent data, single day event

## Search Strategy

1. **Go to**: https://browser.dataspace.copernicus.eu/
2. **Upload AOI**: Use `data/raleigh_aoi.json`
3. **Search for each date range above**
4. **Look for**: Images 6 days apart (realistic with Sentinel-1)
5. **Download**: Before flood (3 days before) and after flood (3 days after) pairs

## Realistic Timing (Sentinel-1 Revisit = 12 days)

- **Before image**: 6 days before flood (dry conditions)
- **After image**: 6 days after flood (wet conditions)
- **Gap**: 12 days total (matches current Sentinel-1 coverage)
- **Note**: Sentinel-1B failed in 2022, so only 12-day cycle available

## What to Look For

- **Before image**: 3 days before flood (dry conditions)
- **After image**: 3 days after flood (wet conditions)
- **Gap**: 6 days total (realistic with Sentinel-1)
- **Priority**: IW GRDH mode, VV polarization

## Expected Results

With proper timing, you should see:
- **Dark areas** in the "during/after" image that weren't there in the "before" image
- **Clear differences** between the two images
- **Actual flood detection** instead of identical images

## Next Steps

1. Search for July 2016 images first (best chance of success)
2. Download 2-3 image pairs from different flood events
3. Process them with the same enhanced contrast method
4. Compare results to see which events show the clearest flood detection
