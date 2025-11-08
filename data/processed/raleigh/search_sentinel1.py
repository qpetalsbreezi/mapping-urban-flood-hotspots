#!/usr/bin/env python3
"""
Search for Sentinel-1 images around Raleigh flood events
This script helps identify the best date ranges for flood detection
"""

from datetime import datetime, timedelta

def search_plan():
    """Generate search plan for Sentinel-1 images around flood events"""
    
    # Flood events with their dates
    flood_events = [
        {
            'name': 'July 2016 Flood',
            'flood_dates': ['2016-07-16', '2016-07-17'],
            'description': '2 consecutive flood days - BEST OPTION',
            'priority': 'HIGHEST'
        },
        {
            'name': 'May 2018 Flood', 
            'flood_dates': ['2018-05-21', '2018-05-22'],
            'description': '2 consecutive flood days - recent data',
            'priority': 'HIGH'
        },
        {
            'name': 'July 2018 Flood',
            'flood_dates': ['2018-07-06'],
            'description': 'Multiple events same day',
            'priority': 'MEDIUM'
        },
        {
            'name': 'August 2018 Flood',
            'flood_dates': ['2018-08-20'],
            'description': 'Single day event',
            'priority': 'MEDIUM'
        }
    ]
    
    print("SENTINEL-1 SEARCH PLAN FOR RALEIGH FLOOD EVENTS")
    print("=" * 60)
    print()
    
    for event in flood_events:
        print(f"EVENT: {event['name']} ({event['priority']} PRIORITY)")
        print(f"Description: {event['description']}")
        print(f"Flood dates: {', '.join(event['flood_dates'])}")
        
        # Calculate search window (3 days before to 3 days after)
        start_date = datetime.strptime(event['flood_dates'][0], '%Y-%m-%d')
        end_date = datetime.strptime(event['flood_dates'][-1], '%Y-%m-%d')
        
        search_start = start_date - timedelta(days=3)
        search_end = end_date + timedelta(days=3)
        
        print(f"Search window: {search_start.strftime('%Y-%m-%d')} to {search_end.strftime('%Y-%m-%d')}")
        
        # Calculate realistic before/after dates (6 days apart)
        before_date = start_date - timedelta(days=3)
        after_date = end_date + timedelta(days=3)
        
        print(f"Target dates: {before_date.strftime('%Y-%m-%d')} (before) and {after_date.strftime('%Y-%m-%d')} (after)")
        print(f"Gap: 6 days (realistic with Sentinel-1 revisit cycle)")
        print()
    
    print("SEARCH INSTRUCTIONS:")
    print("1. Go to: https://browser.dataspace.copernicus.eu/")
    print("2. Upload AOI: data/raleigh_aoi.json")
    print("3. Search for each date range above")
    print("4. Look for images 6 days apart (realistic with Sentinel-1)")
    print("5. Download before flood (3 days before) and after flood (3 days after) pairs")
    print()
    print("EXPECTED RESULT:")
    print("- Before image: Dry conditions (bright areas)")
    print("- During/After image: Wet conditions (dark areas)")
    print("- Clear differences between the two images")

if __name__ == "__main__":
    search_plan()
