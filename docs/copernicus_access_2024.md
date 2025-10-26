# Copernicus Access 2024 - Updated Information

## ⚠️ Important Update

In 2024, ESA Copernicus migrated from the old SciHub to a new **Copernicus Data Space Ecosystem (CDSE)** platform. The old URLs may no longer work.

---

## New Platform: Copernicus Data Space Ecosystem

### Official Website
**URL**: https://dataspace.copernicus.eu/

### What Changed?
- ✅ New user interface and improved search
- ✅ Better API access
- ✅ Free registration still available
- ❌ Old URLs (`scihub.copernicus.eu`) may be deprecated

---

## How to Access Sentinel Data (Updated 2024)

### Option 1: New CDSE Portal (Recommended)

1. **Register**:
   - Go to: https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/registrations
   - Create a free account
   - Verify your email

2. **Access Data**:
   - Portal: https://dataspace.copernicus.eu/
   - Search for Sentinel-1 and Sentinel-2 products
   - Download directly through web interface

3. **Python Access**:
   - New API may be different from old `sentinelsat`
   - Check: https://documentation.dataspace.copernicus.eu/

### Option 2: Google Earth Engine (Easier Alternative)

**Why GEE is Better Now**:
- ✅ Copernicus data already integrated
- ✅ No broken URLs to worry about
- ✅ Easier Python access
- ✅ Free for research

**Use GEE Instead**:
1. Apply for GEE: https://earthengine.google.com/signup/
2. Access Sentinel data directly through GEE
3. Download or process in the cloud

**Code Example**:
```python
import ee
ee.Initialize()

# Access Sentinel-1 directly
collection = ee.ImageCollection('COPERNICUS/S1_GRD')

# Access Sentinel-2 directly
collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
```

### Option 3: Microsoft Planetary Computer

**URL**: https://planetarycomputer.microsoft.com/

**Advantages**:
- ✅ Free access to Sentinel data
- ✅ Python API ready
- ✅ Similar to GEE
- ✅ Fast approval

**Setup**:
```python
import planetary_computer
import pystac_client

catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=planetary_computer.sign_inplace
)
```

### Option 4: USGS EarthExplorer (Backup)

**URL**: https://earthexplorer.usgs.gov/

**For Sentinel Data**:
- Select "Sentinel" when searching
- Free registration
- Slower than other options

---

## Recommended Approach for This Project

Given the Copernicus URL issues, **prioritize Google Earth Engine**:

### Why GEE Makes Sense:

1. **No URL Issues**: Always accessible
2. **All Sentinel Data**: Full archive available
3. **Easier to Use**: Better Python integration
4. **Cloud Processing**: No downloads needed
5. **Free**: No cost for research

### What to Do Now:

1. **Primary**: Apply for Google Earth Engine (https://earthengine.google.com/signup/)
2. **Backup**: Try the new Copernicus portal (https://dataspace.copernicus.eu/)
3. **Alternative**: Use Microsoft Planetary Computer

### Updated Python Setup (GEE):

```bash
pip install earthengine-api
earthengine authenticate
```

```python
import ee
ee.Initialize()

# Search for Sentinel-1
s1 = ee.ImageCollection('COPERNICUS/S1_GRD') \
    .filterDate('2016-07-15', '2016-07-19') \
    .filterBounds(ee.Geometry.Point(-78.6382, 35.7796))

# Search for Sentinel-2  
s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterDate('2016-07-15', '2016-07-19') \
    .filterBounds(ee.Geometry.Point(-78.6382, 35.7796))
```

---

## Platform Comparison (2024)

| Platform | URL Status | Python API | Approval Time | Best For |
|----------|-----------|------------|---------------|----------|
| Google Earth Engine | ✅ Working | Excellent | 1-3 days | Primary choice |
| Copernicus CDSE | ⚠️ Changing | Unknown | Immediate | Official source |
| Microsoft Planetary | ✅ Working | Good | Hours | Backup |
| USGS EarthExplorer | ✅ Working | Fair | Immediate | Last resort |

---

## Action Plan

1. **Today**: Apply for Google Earth Engine
   - Most reliable option
   - Best for this project

2. **This Week**: Try new Copernicus portal
   - If URL works, register there too
   - Good for official downloads

3. **If Needed**: Set up Microsoft Planetary Computer
   - Fast approval
   - Good alternative

---

## Summary

The old Copernicus SciHub URLs are no longer reliable. **Use Google Earth Engine as your primary data source**. It has all Sentinel data and is easier to work with.

---

**Last Updated**: 2024 - Copernicus platform migration
**Status**: Old URLs deprecated, new platform available

