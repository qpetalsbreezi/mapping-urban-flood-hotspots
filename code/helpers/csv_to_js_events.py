#!/usr/bin/env python3
"""Convert event_imagery_matches.csv to JavaScript event format for visualize_flood_events.js"""

import csv
import json
from pathlib import Path


def parse_float(value):
    """Parse float value, return None if empty."""
    if not value or value.strip() == '':
        return None
    try:
        return float(value)
    except ValueError:
        return None


def create_scene(row, prefix):
    """Create a scene object from CSV row."""
    date = row.get(f'{prefix}_date', '').strip()
    image_id = row.get(f'{prefix}_image_id', '').strip()
    valid_fraction = parse_float(row.get(f'{prefix}_valid_fraction', ''))
    
    if not date and not image_id:
        return None
    
    scene = {}
    if date:
        scene['date'] = date
    if image_id:
        scene['imageId'] = image_id
    if valid_fraction is not None:
        scene['validFraction'] = valid_fraction
    
    return scene if scene else None


def convert_csv_to_js_events(csv_path):
    """Convert CSV to JavaScript events array."""
    events = []
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            event_id = row['event_id'].strip()
            event_date = row['event_date'].strip()
            city = row['city'].strip()
            
            # Create label - handle composite events
            if '_and_' in event_id:
                # Extract first event ID for label
                first_id = event_id.split('_and_')[0]
                label = f"{city.capitalize()} flood {event_date} (composite: {row.get('noaa_event_count', '?')} events)"
            else:
                label = f"{city.capitalize()} flood {event_date}"
            
            event = {
                'id': event_id,
                'label': label,
                'event_date': event_date,
                'noaa_event_ids': row.get('noaa_event_ids', event_id),
                'noaa_event_count': row.get('noaa_event_count', '1'),
                'sentinel1': {
                    'before': create_scene(row, 's1_before'),
                    'after': create_scene(row, 's1_after')
                },
                'sentinel2': {
                    'before': create_scene(row, 's2_before'),
                    'after': create_scene(row, 's2_after')
                },
                'landsat': {
                    'before': create_scene(row, 'landsat_before'),
                    'after': create_scene(row, 'landsat_after')
                }
            }
            
            events.append(event)
    
    return events


def format_js_event(event, indent=4):
    """Format a single event as JavaScript object."""
    spaces = ' ' * indent
    
    def format_value(value, level=0):
        if value is None:
            return 'null'
        if isinstance(value, dict):
            if not value:
                return 'null'
            lines = ['{']
            items = list(value.items())
            for i, (k, v) in enumerate(items):
                comma = ',' if i < len(items) - 1 else ''
                lines.append(f'{" " * (level + 4)}{json.dumps(k)}: {format_value(v, level + 4)}{comma}')
            lines.append(f'{" " * level}}}')
            return '\n'.join(lines)
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, bool):
            return 'true' if value else 'false'
        return json.dumps(value)
    
    lines = [f'{spaces}{{']
    lines.append(f'{spaces}    "id": {json.dumps(event["id"])},')
    lines.append(f'{spaces}    "label": {json.dumps(event["label"])},')
    lines.append(f'{spaces}    "event_date": {json.dumps(event["event_date"])},')
    lines.append(f'{spaces}    "noaa_event_ids": {json.dumps(event["noaa_event_ids"])},')
    lines.append(f'{spaces}    "noaa_event_count": {json.dumps(event["noaa_event_count"])},')
    lines.append(f'{spaces}    "sentinel1": {format_value(event["sentinel1"], indent + 4)},')
    lines.append(f'{spaces}    "sentinel2": {format_value(event["sentinel2"], indent + 4)},')
    lines.append(f'{spaces}    "landsat": {format_value(event["landsat"], indent + 4)}')
    lines.append(f'{spaces}}}')
    
    return '\n'.join(lines)


def main():
    base_dir = Path(__file__).parent.parent.parent
    
    raleigh_csv = base_dir / 'data' / 'raw' / 'raleigh' / 'event_detection' / 'event_imagery_matches.csv'
    houston_csv = base_dir / 'data' / 'raw' / 'houston' / 'event_detection' / 'event_imagery_matches.csv'
    
    raleigh_events = convert_csv_to_js_events(raleigh_csv)
    houston_events = convert_csv_to_js_events(houston_csv)
    
    print('// Auto-generated from event_imagery_matches.csv files')
    print('// Format: {id, label, event_date, noaa_event_ids, noaa_event_count, sentinel1, sentinel2, landsat}')
    print('var eventsByCity = {')
    print('  "raleigh": [')
    
    for i, event in enumerate(raleigh_events):
        print(format_js_event(event, indent=4))
        if i < len(raleigh_events) - 1:
            print(',')
    
    print('  ],')
    print('  "houston": [')
    
    for i, event in enumerate(houston_events):
        print(format_js_event(event, indent=4))
        if i < len(houston_events) - 1:
            print(',')
    
    print('  ]')
    print('};')


if __name__ == '__main__':
    main()

