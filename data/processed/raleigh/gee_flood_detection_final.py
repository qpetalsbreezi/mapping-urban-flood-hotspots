#!/usr/bin/env python3
"""
Google Earth Engine Flood Detection - Final Version
This script creates properly georeferenced flood detection maps
"""

import ee
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timedelta

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='science-project-1-394520')
        print("✅ Google Earth Engine initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize GEE: {e}")
        return False

def get_sentinel1_images(start_date, end_date, aoi):
    """Get Sentinel-1 images from GEE"""
    
    # Define the collection
    collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
        .filterDate(start_date, end_date) \
        .filterBounds(aoi) \
        .filter(ee.Filter.eq('instrumentMode', 'IW')) \
        .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])) \
        .filter(ee.Filter.eq('resolution_meters', 10))
    
    return collection

def create_flood_detection_map():
    """Create flood detection map using GEE"""
    
    print("CREATING FLOOD DETECTION MAP WITH GEE")
    print("=" * 50)
    
    # Define Raleigh area of interest
    raleigh_aoi = ee.Geometry.Rectangle([-78.8, 35.6, -78.5, 36.0])
    
    # Define dates (based on available GEE data)
    before_date = '2017-04-21'  # 4 days before flood
    after_date = '2017-05-03'   # 8 days after flood
    
    print(f"Before date: {before_date}")
    print(f"After date: {after_date}")
    print(f"AOI: Raleigh, NC")
    
    # Get before image
    before_collection = get_sentinel1_images(
        before_date, 
        (datetime.strptime(before_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d'),
        raleigh_aoi
    )
    
    # Get after image  
    after_collection = get_sentinel1_images(
        after_date,
        (datetime.strptime(after_date, '%Y-%m-%d') + timedelta(days=1)).strftime('%Y-%m-%d'),
        raleigh_aoi
    )
    
    print(f"\\nFound {before_collection.size().getInfo()} before images")
    print(f"Found {after_collection.size().getInfo()} after images")
    
    # Get the first image from each collection
    before_image = before_collection.first()
    after_image = after_collection.first()
    
    if before_image is None:
        print("❌ No before image found")
        return None
        
    if after_image is None:
        print("❌ No after image found")
        return None
    
    print("✅ Found both images")
    
    # Select VV polarization
    before_vv = before_image.select('VV')
    after_vv = after_image.select('VV')
    
    # Convert to dB
    before_db = before_vv.multiply(ee.Number(10)).log10()
    after_db = after_vv.multiply(ee.Number(10)).log10()
    
    # Calculate change (flood detection)
    change = after_db.subtract(before_db)
    
    # Create visualization parameters
    vis_params = {
        'min': -10,
        'max': 10,
        'palette': ['blue', 'white', 'red']
    }
    
    # Export the images
    print("\\nExporting images...")
    
    # Export before image
    before_task = ee.batch.Export.image.toDrive(
        image=before_db,
        description='raleigh_before_flood',
        folder='flood_detection',
        region=raleigh_aoi,
        scale=30,
        crs='EPSG:4326'
    )
    
    # Export after image
    after_task = ee.batch.Export.image.toDrive(
        image=after_db,
        description='raleigh_after_flood',
        folder='flood_detection',
        region=raleigh_aoi,
        scale=30,
        crs='EPSG:4326'
    )
    
    # Export change image
    change_task = ee.batch.Export.image.toDrive(
        image=change,
        description='raleigh_flood_change',
        folder='flood_detection',
        region=raleigh_aoi,
        scale=30,
        crs='EPSG:4326'
    )
    
    # Start the export tasks
    before_task.start()
    after_task.start()
    change_task.start()
    
    print("✅ Export tasks started!")
    print("\\nCheck your Google Drive for the exported images:")
    print("- raleigh_before_flood")
    print("- raleigh_after_flood") 
    print("- raleigh_flood_change")
    
    print("\\nThe change image will show:")
    print("- Blue areas: Increased backscatter (possible flooding)")
    print("- Red areas: Decreased backscatter")
    print("- White areas: No significant change")
    
    return {
        'before': before_db,
        'after': after_db,
        'change': change,
        'before_date': before_date,
        'after_date': after_date
    }

def main():
    """Main function"""
    print("GOOGLE EARTH ENGINE FLOOD DETECTION")
    print("=" * 50)
    
    # Initialize GEE
    if not initialize_gee():
        return
    
    # Create flood detection map
    result = create_flood_detection_map()
    
    if result is None:
        print("❌ Failed to create flood detection map")
        return
    
    print("\\n🎉 Flood detection map created successfully!")
    print("\\nNext steps:")
    print("1. Wait for export tasks to complete (check GEE console)")
    print("2. Download images from Google Drive")
    print("3. Analyze the flood change map")
    print("4. Create visualizations")

if __name__ == "__main__":
    main()
