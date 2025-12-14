/**
 * Raleigh Flood Event Visualization (April 2017)
 *
 * Paste this script into the Google Earth Engine Code Editor to inspect
 * Sentinel-1 scenes before and after the flood. AOI coordinates mirror
 * `data/raleigh_aoi.json` (full Raleigh metro flood footprint). Dates and
 * image IDs are curated ahead of time (see `code/gee/list_raleigh_s1_passes.py`
 * and related helpers) so this script focuses purely on visualization.
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

// ============================================================================
// EVENT SELECTION - Change this number (1-11) to view different events
// ============================================================================
var selectedEventIndex = 1; // 1-based index (1 = first event, 11 = last event)

// Sentinel-1 visualization stretch (VV polarization)
var radarVis = {min: -20, max: 0};
var opticalWindowDays = 10;
var s2Vis = {bands: ['B4', 'B3', 'B2'], min: 0.04, max: 0.25};
var landsatVis = {bands: ['red', 'green', 'blue'], min: 0.03, max: 0.22};
// Note: All layers are loaded but unchecked by default (except AOI and flood markers)
// You can toggle them on/off in the layers panel without reloading

// Catalog of vetted Raleigh flood events with Sentinel-1 coverage
var events = [
  {
    id: '755610',
    label: 'Crabtree flooding (May 2018)',
    sentinel1: {
      before: {
        date: '2018-05-10',
        imageId: 'S1A_IW_GRDH_1SDV_20180510T231408_20180510T231433_021849_025BA5_EB89'
      },
      after: {
        date: '2018-05-22',
        imageId: 'S1A_IW_GRDH_1SDV_20180522T231409_20180522T231434_022024_026137_6DDC'
      }
    },
    sentinel2: {
      before: {
        date: '2018-05-09',
        imageId: 'COPERNICUS/S2_SR/20180509T155859_20180509T160532_T17SQV',
        validFraction: 0.768
      },
      after: {
        date: '2018-05-24',
        imageId: 'COPERNICUS/S2_SR/20180524T160231_20180524T161104_T17SQV',
        validFraction: 0.431
      }
    },
    landsat: {
      before: {
        date: '2018-05-12',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180512',
        validFraction: 0.99
      },
      after: null
    }
  },
  {
    id: '775029',
    label: 'Urban flooding (July 7, 2018 – event A)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: {
        date: '2018-06-28',
        imageId: 'COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV',
        validFraction: 0.238
      },
      after: {
        date: '2018-07-08',
        imageId: 'COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV',
        validFraction: 0.769
      }
    },
    landsat: {
      before: {
        date: '2018-06-29',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629',
        validFraction: 0.709
      },
      after: {
        date: '2018-07-08',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708',
        validFraction: 0.851
      }
    }
  },
  {
    id: '775031',
    label: 'Urban flooding (July 7, 2018 – event B)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: {
        date: '2018-06-28',
        imageId: 'COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV',
        validFraction: 0.238
      },
      after: {
        date: '2018-07-08',
        imageId: 'COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV',
        validFraction: 0.769
      }
    },
    landsat: {
      before: {
        date: '2018-06-29',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629',
        validFraction: 0.709
      },
      after: {
        date: '2018-07-08',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708',
        validFraction: 0.851
      }
    }
  },
  {
    id: '775032',
    label: 'Urban flooding (July 6, 2018 – event 775032)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: {
        date: '2018-06-28',
        imageId: 'COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV',
        validFraction: 0.238
      },
      after: {
        date: '2018-07-08',
        imageId: 'COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV',
        validFraction: 0.769
      }
    },
    landsat: {
      before: {
        date: '2018-06-29',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629',
        validFraction: 0.709
      },
      after: {
        date: '2018-07-08',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708',
        validFraction: 0.851
      }
    }
  },
  {
    id: '775034',
    label: 'Urban flooding (July 6, 2018 – event 775034)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: {
        date: '2018-06-28',
        imageId: 'COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV',
        validFraction: 0.238
      },
      after: {
        date: '2018-07-08',
        imageId: 'COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV',
        validFraction: 0.769
      }
    },
    landsat: {
      before: {
        date: '2018-06-29',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629',
        validFraction: 0.709
      },
      after: {
        date: '2018-07-08',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708',
        validFraction: 0.851
      }
    }
  },
  {
    id: '775037',
    label: 'Urban flooding (July 6, 2018 – event 775037)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: {
        date: '2018-06-28',
        imageId: 'COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV',
        validFraction: 0.238
      },
      after: {
        date: '2018-07-08',
        imageId: 'COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV',
        validFraction: 0.769
      }
    },
    landsat: {
      before: {
        date: '2018-06-29',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629',
        validFraction: 0.709
      },
      after: {
        date: '2018-07-08',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708',
        validFraction: 0.851
      }
    }
  },
  {
    id: '775031',
    label: 'Urban flooding (July 7, 2018 – event B)',
    sentinel1: {
      before: {
        date: '2018-06-27',
        imageId: 'S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E'
      },
      after: {
        date: '2018-07-09',
        imageId: 'S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8'
      }
    },
    sentinel2: {
      before: null,
      after: null
    },
    landsat: {
      before: null,
      after: null
    }
  },
  {
    id: '1029187',
    label: 'Downtown flooding (May 23, 2022)',
    sentinel1: {
      before: {
        date: '2022-05-13',
        imageId: 'S1A_IW_GRDH_1SDV_20220513T231430_20220513T231455_043199_0528C5_5077'
      },
      after: {
        date: '2022-05-25',
        imageId: 'S1A_IW_GRDH_1SDV_20220525T231430_20220525T231455_043374_052DF9_09E0'
      }
    },
    sentinel2: {
      before: {
        date: '2022-05-20',
        imageId: 'COPERNICUS/S2_SR/20220520T154821_20220520T155606_T17SQA',
        validFraction: 0.051
      },
      after: {
        date: '2022-05-23',
        imageId: 'COPERNICUS/S2_SR/20220523T155831_20220523T160634_T17SQV',
        validFraction: 0.181
      }
    },
    landsat: {
      before: {
        date: '2022-05-16',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20220516',
        validFraction: 0.016
      },
      after: {
        date: '2022-05-23',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20220523',
        validFraction: 0.309
      }
    }
  },
  {
    id: '1173317',
    label: 'Union Station flooding (May 25, 2024)',
    sentinel1: {
      before: {
        date: '2024-05-14',
        imageId: 'S1A_IW_GRDH_1SDV_20240514T231439_20240514T231504_053874_068C4B_5E79'
      },
      after: {
        date: '2024-05-26',
        imageId: 'S1A_IW_GRDH_1SDV_20240526T231440_20240526T231505_054049_069253_4EF3'
      }
    },
    sentinel2: {
      before: {
        date: '2024-05-19',
        imageId: 'COPERNICUS/S2_SR/20240519T154941_20240519T155829_T17SQA',
        validFraction: 0.0
      },
      after: {
        date: '2024-05-29',
        imageId: 'COPERNICUS/S2_SR/20240529T154941_20240529T155815_T17SQV',
        validFraction: 0.594
      }
    },
    landsat: {
      before: {
        date: '2024-05-21',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_015035_20240521',
        validFraction: 0.828
      },
      after: {
        date: '2024-05-28',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20240528',
        validFraction: 0.702
      }
    }
  },
  {
    id: '1208861',
    label: 'Raleigh flooding (Aug 3, 2024)',
    sentinel1: {
      before: null,
      after: {
        date: '2024-08-06',
        imageId: 'S1A_IW_GRDH_1SDV_20240806T231437_20240806T231502_055099_06B6C2_779E'
      }
    },
    sentinel2: {
      before: {
        date: '2024-07-28',
        imageId: 'COPERNICUS/S2_SR/20240728T154941_20240728T160102_T17SQV',
        validFraction: 0.662
      },
      after: {
        date: '2024-08-05',
        imageId: 'COPERNICUS/S2_SR/20240805T155819_20240805T160928_T17SQA',
        validFraction: 0.0
      }
    },
    landsat: {
      before: {
        date: '2024-07-31',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20240731',
        validFraction: 1.0
      },
      after: null
    }
  },
  {
    id: '1208432',
    label: 'Capital Blvd flooding (Aug 4, 2024)',
    sentinel1: {
      before: null,
      after: {
        date: '2024-08-06',
        imageId: 'S1A_IW_GRDH_1SDV_20240806T231437_20240806T231502_055099_06B6C2_779E'
      }
    },
    sentinel2: {
      before: {
        date: '2024-07-28',
        imageId: 'COPERNICUS/S2_SR/20240728T154941_20240728T160102_T17SQV',
        validFraction: 0.662
      },
      after: {
        date: '2024-08-05',
        imageId: 'COPERNICUS/S2_SR/20240805T155819_20240805T160928_T17SQA',
        validFraction: 0.0
      }
    },
    landsat: {
      before: {
        date: '2024-07-31',
        imageId: 'LANDSAT/LC08/C02/T1_L2/LC08_016035_20240731',
        validFraction: 1.0
      },
      after: null
    }
  }
];

// Known flood locations from NOAA data (coordinates and descriptions)
var floodLocations = {
  '755610': [
    {lat: 35.89, lon: -78.71, desc: 'Begin: Crabtree Valley Mall area'},
    {lat: 35.82, lon: -78.71, desc: 'End: Crabtree Creek overflow'},
    {lat: 35.85, lon: -78.70, desc: 'Crabtree Valley Mall (approx)'},
    {lat: 35.86, lon: -78.68, desc: 'Newton Road near Six Forks Road (approx)'},
    {lat: 35.88, lon: -78.71, desc: 'Leesville Road & Millbrook Road (approx)'}
  ],
  '775032': [
    {lat: 35.8, lon: -78.61, desc: 'North Raleigh Boulevard near Millbank Street'}
  ],
  '775034': [
    {lat: 35.79, lon: -78.64, desc: 'Peace Street and Capitol Boulevard'}
  ],
  '775037': [
    {lat: 35.8148, lon: -78.6198, desc: 'Atlantic Avenue at Hodges Street'}
  ],
  '775029': [
    {lat: 35.6332, lon: -78.7092, desc: 'Banks Road and Ten Ten Road'}
  ],
  '775031': [
    {lat: 35.7294, lon: -78.6466, desc: 'Gideon Creek Way near Durham Drive'}
  ],
  '781167': [
    {lat: 35.8049, lon: -78.623, desc: 'Wake Forest Road near Georgetown Road'}
  ],
  '1029187': [
    {lat: 35.7864, lon: -78.7353, desc: 'Wolf Creek Circle'}
  ],
  '1173317': [
    {lat: 35.7794, lon: -78.6435, desc: 'Union Station (S West St & W Martin St)'}
  ],
  '1208861': [
    {lat: 35.7742, lon: -78.6469, desc: 'Union Station (West St & Martin St)'}
  ],
  '1208432': [
    {lat: 35.77, lon: -78.73, desc: 'I-440 eastbound (closed)'}
  ]
};

// Function to create and display flood location markers
function addFloodLocationMarkers(eventId) {
  var locations = floodLocations[eventId];
  if (!locations || locations.length === 0) {
    print('No location data available for event ' + eventId);
    return;
  }
  
  var features = locations.map(function(loc) {
    return ee.Feature(
      ee.Geometry.Point([loc.lon, loc.lat]),
      {description: loc.desc}
    );
  });
  
  var locationCollection = ee.FeatureCollection(features);
  
  // Add point markers
  Map.addLayer(
    locationCollection,
    {
      color: 'red',
      pointSize: 5,
      pointShape: 'circle'
    },
    'Known Flood Locations (NOAA)'
  );
  
  // Add buffered areas around points (100m radius)
  var buffered = locationCollection.map(function(feature) {
    return feature.buffer(100); // 100 meters
  });
  
  Map.addLayer(
    buffered,
    {
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.2
    },
    'Flood Location Buffers (100m)',
    false // Start with layer turned off
  );
  
  print('Added ' + locations.length + ' flood location markers for event ' + eventId);
}

// Get selected event by index (1-based)
function getEventByIndex(index) {
  if (index < 1 || index > events.length) {
    throw new Error('Event index out of range. Use 1-' + events.length);
  }
  return events[index - 1];
}

var selectedEvent = getEventByIndex(selectedEventIndex);
var selectedEventId = selectedEvent.id;

function formatLabel(prefix, scene) {
  if (!scene || !scene.date) {
    return prefix;
  }
  return prefix + ' ' + scene.date;
}

function nextDay(dateStr) {
  var d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Keep findEvent for backward compatibility, but use selectedEvent directly
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

function maskS2Clouds(image) {
  var scaled = image.select(['B4', 'B3', 'B2']).divide(10000);
  var sclMask = ee.Image(ee.Algorithms.If(
    image.bandNames().contains('SCL'),
    image.select('SCL')
      .neq(3)
      .and(image.select('SCL').neq(7))
      .and(image.select('SCL').neq(8))
      .and(image.select('SCL').neq(9))
      .and(image.select('SCL').neq(10))
      .and(image.select('SCL').neq(11)),
    ee.Image(1)
  ));
  return scaled.updateMask(sclMask);
}

function loadSentinel2(scene, region) {
  if (!scene) {
    return null;
  }
  var img = null;
  if (scene.imageId) {
    img = maskS2Clouds(ee.Image(scene.imageId));
  } else if (scene.date) {
    var date = ee.Date(scene.date);
    var start = date.advance(-opticalWindowDays, 'day');
    var end = date.advance(opticalWindowDays + 1, 'day');
    img = ee.ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(region)
      .filterDate(start, end)
      .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 80))
      .map(maskS2Clouds)
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .first();
  }
  if (img) {
    img = img.clip(region);
  }
  return img;
}

function prepareLandsat(image) {
  var qaPixel = image.select('QA_PIXEL');
  var cloudShadowBitMask = 1 << 4;
  var cloudsBitMask = 1 << 3;
  var mask = qaPixel.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qaPixel.bitwiseAnd(cloudsBitMask).eq(0));

  var scaled = image.select(['SR_B4', 'SR_B3', 'SR_B2'])
    .multiply(0.0000275)
    .add(-0.2)
    .rename(['red', 'green', 'blue']);

  return scaled.updateMask(mask);
}

function loadLandsat(scene, region) {
  if (!scene) {
    return null;
  }
  var img = null;
  if (scene.imageId) {
    img = prepareLandsat(ee.Image(scene.imageId));
  } else if (scene.date) {
    var date = ee.Date(scene.date);
    var start = date.advance(-opticalWindowDays, 'day');
    var end = date.advance(opticalWindowDays + 1, 'day');
    img = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
      .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2'))
      .filterBounds(region)
      .filterDate(start, end)
      .map(prepareLandsat)
      .sort('system:time_start')
      .first();
  }
  if (img) {
    img = img.clip(region);
  }
  return img;
}

function loadSentinel1(scene, region) {
  if (!scene) {
    return null;
  }
  if (scene.imageId) {
    var prefix = 'COPERNICUS/S1_GRD/';
    var id = scene.imageId.indexOf(prefix) === 0 ? scene.imageId : prefix + scene.imageId;
    return ee.Image(id).clip(region);
  }
  if (scene.date) {
    return getSentinelImage(scene.date, nextDay(scene.date), region);
  }
  return null;
}

var eventInfo = selectedEvent;
print('Selected event [' + selectedEventIndex + '/' + events.length + ']:', eventInfo.label);
print('  Event ID:', eventInfo.id);
print('  Sentinel-1 before ->', eventInfo.sentinel1.before);
print('  Sentinel-1 after  ->', eventInfo.sentinel1.after);
print('  Sentinel-2 before ->', eventInfo.sentinel2.before);
print('  Sentinel-2 after  ->', eventInfo.sentinel2.after);
print('  Landsat before   ->', eventInfo.landsat.before);
print('  Landsat after    ->', eventInfo.landsat.after);

var before = loadSentinel1(eventInfo.sentinel1.before, focusAOI);
var after = loadSentinel1(eventInfo.sentinel1.after, focusAOI);
var s2Before = loadSentinel2(eventInfo.sentinel2.before, focusAOI);
var s2After = loadSentinel2(eventInfo.sentinel2.after, focusAOI);
var landsatBefore = loadLandsat(eventInfo.landsat.before, focusAOI);
var landsatAfter = loadLandsat(eventInfo.landsat.after, focusAOI);

if (before) {
  Map.addLayer(before.select('VV'), radarVis,
    'Sentinel-1 Before ' + (eventInfo.sentinel1.before && eventInfo.sentinel1.before.date),
    false // Default: hidden for faster visualization
  );
} else {
  print('Warning: missing Sentinel-1 "before" scene.');
}

if (after) {
  Map.addLayer(after.select('VV'), radarVis,
    'Sentinel-1 After ' + (eventInfo.sentinel1.after && eventInfo.sentinel1.after.date),
    false // Default: hidden for faster visualization
  );
} else {
  print('Warning: missing Sentinel-1 "after" scene!');
}

Map.addLayer(
  ee.Image().paint(focusAOI, 1, 2),
  {palette: 'red'},
  eventInfo.label + ' (' + eventInfo.sentinel1.after.date + ') AOI'
);

function formatLabel(prefix, scene) {
  if (!scene || !scene.date) {
    return prefix;
  }
  return prefix + ' ' + scene.date;
}

// Add Sentinel-2 layers (unchecked by default for faster visualization)
if (s2Before) {
  Map.addLayer(s2Before, s2Vis, formatLabel('Sentinel-2 Before', eventInfo.sentinel2.before), false);
}
if (s2After) {
  Map.addLayer(s2After, s2Vis, formatLabel('Sentinel-2 After', eventInfo.sentinel2.after), false);
}
if (!s2Before && !s2After) {
  print('No Sentinel-2 imagery available within ±' + opticalWindowDays + ' days.');
}

// Add Landsat layers (unchecked by default for faster visualization)
if (landsatBefore) {
  Map.addLayer(landsatBefore, landsatVis, formatLabel('Landsat Before', eventInfo.landsat.before), false);
}
if (landsatAfter) {
  Map.addLayer(landsatAfter, landsatVis, formatLabel('Landsat After', eventInfo.landsat.after), false);
}
if (!landsatBefore && !landsatAfter) {
  print('No Landsat imagery available within ±' + opticalWindowDays + ' days.');
}

// Add known flood location markers from NOAA data
addFloodLocationMarkers(selectedEventId);