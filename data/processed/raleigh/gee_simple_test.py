#!/usr/bin/env python3
"""
Simple Google Earth Engine Test
This script tests GEE connection and gets basic Sentinel-1 data
"""

import ee

def test_gee_connection():
    """Test GEE connection"""
    try:
        # Initialize GEE with project ID
        ee.Initialize(project='science-project-1-394520')
        print("✅ Google Earth Engine initialized successfully")
        
        # Test basic functionality
        print("\\nTesting basic GEE functionality...")
        
        # Create a simple geometry (Raleigh area)
        raleigh = ee.Geometry.Rectangle([-78.8, 35.6, -78.5, 36.0])
        print(f"✅ Created geometry: {raleigh.getInfo()}")
        
        # Get Sentinel-1 collection
        collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
            .filterDate('2017-04-20', '2017-04-30') \
            .filterBounds(raleigh) \
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
        
        print(f"✅ Found {collection.size().getInfo()} Sentinel-1 images")
        
        # Get first image
        first_image = collection.first()
        if first_image:
            print("✅ Successfully retrieved first image")
            print(f"Image ID: {first_image.get('system:id').getInfo()}")
            print(f"Date: {first_image.get('system:time_start').getInfo()}")
        else:
            print("❌ No images found")
            
        return True
        
    except Exception as e:
        print(f"❌ GEE Error: {e}")
        return False

def main():
    """Main function"""
    print("GOOGLE EARTH ENGINE CONNECTION TEST")
    print("=" * 40)
    
    if test_gee_connection():
        print("\\n🎉 GEE is working! Ready for flood detection")
    else:
        print("\\n❌ GEE setup failed")
        print("\\nTo fix this:")
        print("1. Go to https://earthengine.google.com/")
        print("2. Sign up for Earth Engine")
        print("3. Create a project")
        print("4. Run: earthengine authenticate --project=YOUR_PROJECT_ID")

if __name__ == "__main__":
    main()
