/**
 * Raleigh Flood Event Visualization (April 2017)
 *
 * Paste this script into the Google Earth Engine Code Editor to inspect
 * Sentinel-1 scenes before and after the flood. AOI coordinates mirror
 * `data/raleigh_aoi.json` (Brier Creek / Lumley Road corridor).
 */

var outerAOICoords = [
  [-78.8200, 35.9300],
  [-78.7400, 35.9300],
  [-78.7400, 35.8700],
  [-78.8200, 35.8700],
  [-78.8200, 35.9300]
];
var outerAOI = ee.Geometry.Polygon([outerAOICoords]);

// Tighten the AOI slightly for visualization (buffer inward by 1.5 km)
var focusAOI = outerAOI.buffer(-1500).bounds();

// Clear previous layers and zoom to the focus area
Map.clear();
Map.centerObject(focusAOI, 13);

// Sentinel-1 visualization stretch (VV polarization)
var vis = {min: -20, max: 0};

// Helper to fetch the first Sentinel-1 image in a one-day window
function getSentinelImage(startDate, endDate, region) {
  return ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']))
    .first();
}

var before = getSentinelImage('2017-04-21', '2017-04-22', focusAOI);
var after = getSentinelImage('2017-05-03', '2017-05-04', focusAOI);

// Display the images clipped to the focus AOI
Map.addLayer(before.select('VV').clip(focusAOI), vis, 'Before Flood (Apr 21, 2017)');
Map.addLayer(after.select('VV').clip(focusAOI), vis, 'After Flood (May 3, 2017)');

// Outline the focus AOI for reference
Map.addLayer(ee.Image().paint(focusAOI, 1, 2), {palette: 'yellow'}, 'Focus AOI');

