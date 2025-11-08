#!/usr/bin/env python3
"""
Download and visualize GEE flood detection results
"""

import ee
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='science-project-1-394520')
        print("✅ Google Earth Engine initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize GEE: {e}")
        return False

def get_flood_detection_data():
    """Get flood detection data from GEE"""
    
    print("GETTING FLOOD DETECTION DATA FROM GEE")
    print("=" * 50)
    
    # Define Raleigh area
    raleigh_aoi = ee.Geometry.Rectangle([-78.8, 35.6, -78.5, 36.0])
    
    # Get Sentinel-1 images
    before_collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
        .filterDate('2017-04-21', '2017-04-22') \
        .filterBounds(raleigh_aoi) \
        .filter(ee.Filter.eq('instrumentMode', 'IW')) \
        .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']))
    
    after_collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
        .filterDate('2017-05-03', '2017-05-04') \
        .filterBounds(raleigh_aoi) \
        .filter(ee.Filter.eq('instrumentMode', 'IW')) \
        .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']))
    
    before_image = before_collection.first()
    after_image = after_collection.first()
    
    if before_image is None or after_image is None:
        print("❌ Could not find images")
        return None
    
    print("✅ Found both images")
    
    # Select VV polarization and convert to dB
    before_vv = before_image.select('VV').multiply(ee.Number(10)).log10()
    after_vv = after_image.select('VV').multiply(ee.Number(10)).log10()
    
    # Calculate change
    change = after_vv.subtract(before_vv)
    
    # Get image URLs for visualization
    print("\\nGetting image URLs...")
    
    # Create visualization parameters
    vis_params = {
        'min': -20,
        'max': 5,
        'palette': ['blue', 'white', 'red']
    }
    
    # Define visualization parameters
    vis_params_before = {
        'min': -20,
        'max': 5,
        'palette': 'gray'
    }
    
    vis_params_after = {
        'min': -20,
        'max': 5,
        'palette': 'gray'
    }
    
    vis_params_change = {
        'min': -10,
        'max': 10,
        'palette': 'blue,white,red'
    }
    
    # Get image URLs
    before_url = before_vv.getThumbURL({
        'region': raleigh_aoi,
        'dimensions': 512,
        'format': 'png',
        'min': vis_params_before['min'],
        'max': vis_params_before['max'],
        'palette': vis_params_before['palette']
    })
    
    after_url = after_vv.getThumbURL({
        'region': raleigh_aoi,
        'dimensions': 512,
        'format': 'png',
        'min': vis_params_after['min'],
        'max': vis_params_after['max'],
        'palette': vis_params_after['palette']
    })
    
    change_url = change.getThumbURL({
        'region': raleigh_aoi,
        'dimensions': 512,
        'format': 'png',
        'min': vis_params_change['min'],
        'max': vis_params_change['max'],
        'palette': vis_params_change['palette']
    })
    
    print("✅ Generated image URLs")
    
    return {
        'before_url': before_url,
        'after_url': after_url,
        'change_url': change_url,
        'before_image': before_vv,
        'after_image': after_vv,
        'change_image': change
    }

def create_visualization(data):
    """Create visualization of the results"""
    
    print("\\nCREATING VISUALIZATION")
    print("=" * 30)
    
    # Create figure
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    
    # Before image
    axes[0].set_title('Before Flood (April 21, 2017)', fontsize=14, fontweight='bold')
    axes[0].text(0.5, 0.95, '4 days before flood', transform=axes[0].transAxes, 
                ha='center', va='top', fontsize=10, style='italic')
    axes[0].axis('off')
    
    # After image
    axes[1].set_title('After Flood (May 3, 2017)', fontsize=14, fontweight='bold')
    axes[1].text(0.5, 0.95, '8 days after flood', transform=axes[1].transAxes, 
                ha='center', va='top', fontsize=10, style='italic')
    axes[1].axis('off')
    
    # Change image
    axes[2].set_title('Flood Change Detection', fontsize=14, fontweight='bold')
    axes[2].text(0.5, 0.95, 'Blue = Increased backscatter (possible flooding)', 
                transform=axes[2].transAxes, ha='center', va='top', fontsize=10, style='italic')
    axes[2].axis('off')
    
    # Add note about image loading
    fig.text(0.5, 0.02, 'Note: Images will be loaded from Google Earth Engine', 
             ha='center', va='bottom', fontsize=10, style='italic')
    
    plt.tight_layout()
    plt.savefig('data/processed/raleigh/gee_flood_visualization.png', dpi=150, bbox_inches='tight')
    plt.close()
    
    print("✅ Saved visualization to: data/processed/raleigh/gee_flood_visualization.png")
    
    # Print URLs for manual viewing
    print("\\nImage URLs (open in browser to view):")
    print(f"Before: {data['before_url']}")
    print(f"After: {data['after_url']}")
    print(f"Change: {data['change_url']}")

def main():
    """Main function"""
    print("GOOGLE EARTH ENGINE FLOOD DETECTION RESULTS")
    print("=" * 50)
    
    # Initialize GEE
    if not initialize_gee():
        return
    
    # Get flood detection data
    data = get_flood_detection_data()
    if data is None:
        return
    
    # Create visualization
    create_visualization(data)
    
    print("\\n🎉 GEE flood detection analysis complete!")
    print("\\nNext steps:")
    print("1. Open the image URLs in your browser to view the actual images")
    print("2. Analyze the change detection map for flood areas")
    print("3. Create flood hotspot maps")

if __name__ == "__main__":
    main()
