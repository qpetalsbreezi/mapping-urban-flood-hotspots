# Google Earth Engine Setup Guide

## Step 1: Create GEE Account
1. Go to https://earthengine.google.com/
2. Click "Sign up for Earth Engine"
3. Use your Google account to sign up
4. Wait for approval (usually takes a few hours to a few days)

## Step 2: Create a Project
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Note your project ID (e.g., "my-project-12345")

## Step 3: Enable Earth Engine API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Earth Engine API"
3. Click "Enable"

## Step 4: Authenticate
Run this command with your project ID:
```bash
earthengine authenticate --project=YOUR_PROJECT_ID
```

## Step 5: Test Connection
```bash
python3 data/processed/raleigh/gee_simple_test.py
```

## Alternative: Use GEE Code Editor
If the Python API setup is complex, you can use the GEE Code Editor:
1. Go to https://code.earthengine.google.com/
2. Use the web-based interface
3. Export results as GeoTIFF files

## Benefits of GEE
- ✅ Pre-processed, georeferenced data
- ✅ No need to download large files
- ✅ Built-in flood detection algorithms
- ✅ Easy to compare before/after images
- ✅ Cloud-based processing

## Next Steps
Once GEE is set up, we can:
1. Get properly georeferenced Sentinel-1 data
2. Create accurate flood detection maps
3. Compare before/after images correctly
4. Generate flood hotspot maps
