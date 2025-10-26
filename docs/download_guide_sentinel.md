# Step-by-Step: Downloading Sentinel Data

## Quick Start Guide

This guide walks you through downloading Sentinel-1 and Sentinel-2 data for your flood events using Copernicus Browser.

---

## Example: Download Data for Raleigh Flood Event (2016-07-17)

Let's start with one event to test the process.

### Event Details:
- **Date**: July 17, 2016
- **Location**: Raleigh, NC
- **Search Window**: July 15-19, 2016
- **Priority**: CRITICAL

---

## Step 1: Access Copernicus Browser

1. Log into your Copernicus account: https://dataspace.copernicus.eu/
2. Click **"Copernicus Browser"** in the left sidebar

---

## Step 2: Search for Sentinel-1 SAR Data

### 2a. Set Up Search Filters

1. **Select Dataset**: 
   - Dropdown at top: Select **"Sentinel-1"**

2. **Set Area of Interest**:
   - Click on map to draw a box around Raleigh, NC
   - Or enter coordinates manually:
     - **Latitude**: 35.6 to 35.9 (North)
     - **Longitude**: -78.7 to -78.6 (West)

3. **Set Date Range**:
   - **Start Date**: 2016-07-15
   - **End Date**: 2016-07-19

4. **Click "Search"**

### 2b. Review Results

Look for scenes with:
- ✓ **Product Type**: SLC or GRD (Ground Range Detected)
- ✓ **Orbit**: Any
- ✓ **Mode**: IW (Interferometric Wide Swath)
- ✓ **Polarization**: VV and VH (dual polarization preferred)

### 2c. Select and Download

1. Click on a good scene (usually closest to 2016-07-17)
2. Review metadata (orbit direction, coverage, etc.)
3. Click **"Download"** button
4. File will be large (~1-3 GB) - be patient

### 2d. Save File

- **Destination**: `data/processed/satellite/raleigh/sentinel1/`
- **Filename**: Will be automatically named (something like `S1A_IW_GRDH_1SDV_20160717T...`)

---

## Step 3: Search for Sentinel-2 Optical Data

### 3a. Set Up Search Filters

1. **Select Dataset**: 
   - Change to **"Sentinel-2"**

2. **Same Area**: 
   - Keep same location (Raleigh)

3. **Same Date Range**: 
   - 2016-07-15 to 2016-07-19

4. **Add Cloud Filter**:
   - Cloud cover: **< 20%** (optional but recommended)

5. **Click "Search"**

### 3b. Review Results

Look for scenes with:
- ✓ **Cloud Cover**: < 20% (lower is better)
- ✓ **Processing Level**: L2A (atmospherically corrected)
- ✓ **Tile**: Should cover Raleigh area

### 3c. Select and Download

1. Click on a good scene
2. Check cloud coverage (click to see preview)
3. Click **"Download"**
4. File will be large (~1-2 GB)

### 3d. Save File

- **Destination**: `data/processed/satellite/raleigh/sentinel2/`
- **Filename**: Will be automatically named

---

## Step 4: Repeat for All Events

After successfully downloading the test event, repeat for all 18 flood events:

### Priority Order:

**Start with CRITICAL events:**
- Raleigh: 2016-07-17, 2017-04-25
- Houston: 2015-05-26, 2016-04-18, 2017-08-26 to 2017-08-29

**Then HIGH priority events:**
- Raleigh: 2018-05-21, 2018-05-22, 2018-08-20, 2018-11-13
- Houston: 2018-07-04, 2019-09-18, 2019-09-19

**Finally MEDIUM priority:**
- Raleigh: 2018-07-06

---

## Tips for Success

### Download Strategy:

1. **Download during off-peak hours** - European morning hours are usually faster

2. **Use Download Manager** - For large files, use a download manager to resume if interrupted

3. **Check Credits** - Monitor your credit usage in the dashboard

4. **Organize Files** - Keep files organized by:
   - City (raleigh/houston)
   - Sensor (sentinel1/sentinel2)
   - Date

5. **Check File Integrity** - After download, verify file isn't corrupted

### If Download Fails:

- Try again (network issues are common)
- Try a different scene from same date
- Try a slightly different date range
- Check your credit balance

---

## Expected Results

### Per Event:
- **Sentinel-1**: 1-2 scenes (~1-3 GB each)
- **Sentinel-2**: 0-2 scenes (~1-2 GB each, depends on clouds)
- **Total per event**: ~2-6 GB

### Total for 18 Events:
- **Estimated**: ~50-60 GB
- **Time**: 2-3 weeks if downloading a few per day

---

## Next Steps After Download

1. Verify all files downloaded successfully
2. Check file structure and organization
3. Proceed to preprocessing and flood mapping
4. See: `docs/satellite_data_acquisition_plan.md` for processing steps

---

## Need Help?

- **Copernicus Documentation**: https://documentation.dataspace.copernicus.eu/
- **Browser Help**: Click "?" in Copernicus Browser
- **Credit Issues**: Check dashboard "Credits" panel

---

**Ready to start? Begin with the Raleigh 2016-07-17 event!**
