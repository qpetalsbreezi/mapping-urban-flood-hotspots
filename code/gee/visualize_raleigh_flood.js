/**
 * Raleigh Flood Event Visualization (April 2017)
 *
 * Paste this script into the Google Earth Engine Code Editor to inspect
 * Sentinel-1 scenes before and after the flood. AOI coordinates mirror
 * `data/raleigh_aoi.json` (full Raleigh metro flood footprint).
 */

var outerAOICoords = [
  [-78.9000, 35.6000],
  [-78.4000, 35.6000],
  [-78.4000, 36.1000],
  [-78.9000, 36.1000],
  [-78.9000, 35.6000]
];
var outerAOI = ee.Geometry.Polygon([outerAOICoords]);

// Tighten the AOI slightly for visualization (buffer inward by 5 km)
var focusAOI = outerAOI.buffer(-5000).bounds();

// Clear previous layers and zoom to the focus area
Map.clear();
Map.centerObject(focusAOI, 13);

// Sentinel-1 visualization stretch (VV polarization)
var vis = {min: -20, max: 0};

// Catalog of vetted Raleigh flood events with Sentinel-1 coverage
var events = [
  {
    id: '755610',
    name: 'Crabtree flooding (May 2018)',
    eventDate: '2018-05-21',
    beforeDate: '2018-05-10',
    afterDate: '2018-05-22'
  },
  {
    id: '775029',
    name: 'Urban flooding (July 7, 2018 – event A)',
    eventDate: '2018-07-07',
    beforeDate: '2018-06-27',
    afterDate: '2018-07-09'
  },
  {
    id: '775031',
    name: 'Urban flooding (July 7, 2018 – event B)',
    eventDate: '2018-07-07',
    beforeDate: '2018-06-27',
    afterDate: '2018-07-09'
  },
  {
    id: '1029187',
    name: 'Downtown flooding (May 23, 2022)',
    eventDate: '2022-05-23',
    beforeDate: '2022-05-13',
    afterDate: '2022-05-25'
  },
  {
    id: '1173317',
    name: 'Union Station flooding (May 25, 2024)',
    eventDate: '2024-05-25',
    beforeDate: '2024-05-14',
    afterDate: '2024-05-26'
  },
  {
    id: '1208432',
    name: 'Capital Blvd flooding (Aug 4, 2024)',
    eventDate: '2024-08-04',
    beforeDate: null,
    afterDate: '2024-08-06'
  }
];

// Pick an event ID from the list above
var selectedEventId = '755610';

function nextDay(dateStr) {
  var d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function findEvent(eventId) {
  for (var i = 0; i < events.length; i++) {
    if (events[i].id === eventId) {
      return events[i];
    }
  }
  throw new Error('Event ID not found: ' + eventId);
}

// Helper to fetch the first Sentinel-1 image in a one-day window
function getSentinelImage(startDate, endDate, region) {
  return ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']))
    .first();
}

var eventInfo = findEvent(selectedEventId);
print('Selected event', eventInfo);

var before = null;
if (eventInfo.beforeDate) {
  before = getSentinelImage(eventInfo.beforeDate, nextDay(eventInfo.beforeDate), focusAOI);
}
var after = getSentinelImage(eventInfo.afterDate, nextDay(eventInfo.afterDate), focusAOI);

// Display the images clipped to the focus AOI
if (before) {
  Map.addLayer(
    before.select('VV').clip(focusAOI),
    vis,
    'Before (VV) ' + eventInfo.beforeDate
  );
}

Map.addLayer(
  after.select('VV').clip(focusAOI),
  vis,
  'After (VV) ' + eventInfo.afterDate
);

// Outline the focus AOI for reference
Map.addLayer(ee.Image().paint(focusAOI, 1, 2), {palette: 'yellow'}, 'Focus AOI');