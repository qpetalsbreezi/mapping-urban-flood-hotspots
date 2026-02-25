/**
 * Flood Event Visualization for Raleigh, NC and Houston, TX
 *
 * Paste this script into the Google Earth Engine Code Editor to inspect
 * Sentinel-1/2 and Landsat scenes before and after curated flood events.
 * AOIs align with `data/raleigh_aoi.json` and `data/houston_aoi.json`.
 */

// ============================================================================
// USER SETTINGS
// ============================================================================

// var selectedCity = 'raleigh'; // 'raleigh' or 'houston'
// var selectedEventIndex = 4;   // 1-based index within the chosen city

var selectedCity = 'houston'; // 'raleigh' or 'houston'
var selectedEventIndex = 5;   // 1-based index within the chosen city

var opticalWindowDays = 10;

// Multi-image baseline: average multiple pre-event images for more stable baseline
// Set to true to enable averaging 3-5 pre-event images (reduces speckle noise)
// Set to false to use single closest pre-event image (current behavior, default)
var useMultiImageBaseline = false;
var multiImageDaysBefore = 30;  // Days before event to search for pre-event images
var multiImageMaxCount = 5;   // Maximum number of images to average

// Adaptive threshold: derive threshold from each scene instead of fixed dB
// Set to true to use scene percentile (clamped); false = use fixed vvVhThreshold / vvOnlyThreshold
var useAdaptiveThreshold = false;

// ============================================================================
// FLOOD DETECTION PARAMETERS (SHARED WITH generate_flood_hotspots.js)
// ============================================================================
// IMPORTANT: These parameters must match generate_flood_hotspots.js exactly
// to ensure consistent flood detection across both scripts.

var FLOOD_DETECTION_CONFIG = {
  // Speckle filtering
  smoothRadius: 90,  // meters - radius for focal_mean smoothing
  
  // Change detection thresholds (dB) - used when useAdaptiveThreshold is false
  vvVhThreshold: -1.8,  // dB - threshold when both VV and VH are available
  vvOnlyThreshold: -2.0,  // dB - stricter threshold when only VV is available
  
  // Adaptive threshold (when useAdaptiveThreshold is true): percentile of VV change, clamped
  adaptivePercentile: 5,       // use this percentile of change image over AOI
  adaptiveThresholdMin: -3.5,   // clamp threshold to no more negative than this (dB)
  adaptiveThresholdMax: -1.0,   // clamp threshold to no less negative than this (dB)
  
  // Speckle removal
  minConnectedPixels: 5,  // minimum connected pixels to keep (removes isolated noise)
  connectedNeighborhood: 8,  // 8-connected neighborhood for pixel counting
  
  // Urban mask
  nlcdImperviousThreshold: 0.2,  // >=20% impervious surface
  worldCoverBuiltClass: 50,  // WorldCover built-up class value
  
  // Permanent water exclusion
  jrcWaterOccurrenceThreshold: 50  // >=50% occurrence = permanent water
};

// City-specific configuration (AOI, zoom, and optional highlight boxes)
var cityConfig = {
  raleigh: {
    outerAOICoords: [
      [-78.9, 35.6],
      [-78.4, 35.6],
      [-78.4, 36.1],
      [-78.9, 36.1],
      [-78.9, 35.6]
    ],
    focusBuffer: -5000, // tighten AOI for visualization
    centerZoom: 13,
    highlightBoxes: [
      {
        geom: ee.Geometry.Rectangle({coords: [-78.72, 35.83, -78.68, 35.87], geodesic: false}),
        label: 'Crabtree focus box',
        palette: 'yellow'
      }
    ],
    floodLocations: {
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
    }
  },
  houston: {
    outerAOICoords: [
      [-95.95, 29.45],
      [-94.9, 29.45],
      [-94.9, 30.2],
      [-95.95, 30.2],
      [-95.95, 29.45]
    ],
    // Match Python script: LineString buffered by 1000m then bounds
    // So we use the coordinates directly as Polygon (no buffer needed)
    focusBuffer: 0, // No buffer - use full AOI to match image clipping
    centerZoom: 11,
    highlightBoxes: [],
    floodLocations: {
      '579534': [
        {lat: 30.1143, lon: -95.4547, desc: 'SPRING'},
        {lat: 29.5997, lon: -95.6387, desc: 'HOUSTON HULL ARPT'},
      ],
      '675235_and_1_more': [
        {lat: 29.5897, lon: -95.4473, desc: 'ALMEDA'},
        {lat: 29.7156, lon: -95.2048, desc: 'PASADENA'},
        {lat: 29.7598, lon: -95.3668, desc: 'ENGLEWOOD'},
        {lat: 29.6487, lon: -95.5412, desc: 'MISSOURI CITY'},
      ],
      '710731': [
        {lat: 29.7758, lon: -95.5879, desc: 'HERMOSSEY'},
        {lat: 29.7878, lon: -95.3474, desc: 'ENGLEWOOD'},
      ],
      '710726_and_1_more': [
        {lat: 29.8919, lon: -95.3761, desc: 'LITTLE YORK'},
        {lat: 29.8169, lon: -95.165, desc: 'FAUNA'},
        {lat: 29.7227, lon: -95.465, desc: 'BELLAIRE JCT'},
        {lat: 29.88, lon: -95.4626, desc: 'GORDEN PARK'},
      ],
      '721084_and_5_more': [
        {lat: 29.8067, lon: -95.4204, desc: 'WHITE OAK ACRES'},
        {lat: 29.7525, lon: -95.4228, desc: 'HOUSTON HGTS'},
        {lat: 30.1431, lon: -95.7622, desc: 'TOMBALL'},
        {lat: 30.131, lon: -95.4135, desc: 'SPRING'},
        {lat: 30.0375, lon: -95.4187, desc: 'WESTFIELD'},
        {lat: 29.6896, lon: -95.2072, desc: 'PASADENA (721096)'}
      ],
      '830461_and_1_more': [
        {lat: 29.8976, lon: -95.8261, desc: 'KATY'},
        {lat: 29.6927, lon: -95.8523, desc: 'DELHI'},
        {lat: 29.9508, lon: -95.3076, desc: 'TODD MISSION'},
        {lat: 29.9301, lon: -95.3137, desc: 'TODD MISSION'},
      ],
      '857803_and_4_more': [
        {lat: 29.6666, lon: -95.1575, desc: 'GOLDEN ACRES'},
        {lat: 29.6666, lon: -95.1538, desc: 'GOLDEN ACRES'},
        {lat: 30.0579, lon: -95.1776, desc: 'HUMBLE'},
        {lat: 30.0755, lon: -95.1071, desc: 'HUFFMAN'},
        {lat: 29.963, lon: -95.3391, desc: '(IAH)HOUSTON INTL AR'},
      ],
      '899524': [
        {lat: 29.79, lon: -95.82, desc: 'KATY'},
        {lat: 29.8685, lon: -95.6419, desc: 'HOUSTON LAKESIDE ARP'},
      ],
      '963117': [
        {lat: 29.82, lon: -95.34, desc: 'SETTEGAST'},
        {lat: 29.8231, lon: -95.3407, desc: 'SETTEGAST'},
      ],
      '1004355_and_4_more': [
        {lat: 29.78, lon: -95.54, desc: 'HERMOSSEY'},
        {lat: 29.7881, lon: -95.5383, desc: 'HERMOSSEY'},
        {lat: 29.8228, lon: -95.5298, desc: 'SPRING BRANCH'},
        {lat: 29.8224, lon: -95.5203, desc: 'SPRING BRANCH'},
        {lat: 29.8198, lon: -95.5015, desc: 'SPRING BRANCH'},
      ],
    }
  }
};

var eventsByCity = {
  "raleigh": [
    {
        "id": "755610",
        "label": "Raleigh flood 2018-05-21",
        "event_date": "2018-05-21",
        "noaa_event_ids": "755610",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2018-05-10",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180510T231408_20180510T231433_021849_025BA5_EB89"
            },
            "after": {
                "date": "2018-05-22",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180522T231409_20180522T231434_022024_026137_6DDC"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2018-05-09",
                "imageId": "COPERNICUS/S2_SR/20180509T155859_20180509T160532_T17SQV",
                "validFraction": 0.768
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2018-05-12",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_016035_20180512",
                "validFraction": 0.99
            },
            "after": null
        }
    }
,
    {
        "id": "775029_and_1_more",
        "label": "Raleigh flood 2018-07-07 (composite: 2 events)",
        "event_date": "2018-07-07",
        "noaa_event_ids": "775029;775031",
        "noaa_event_count": "2",
        "sentinel1": {
            "before": {
                "date": "2018-06-27",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180627T231411_20180627T231436_022549_027150_2A0E"
            },
            "after": {
                "date": "2018-07-09",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180709T231411_20180709T231436_022724_02766D_A8A8"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2018-06-28",
                "imageId": "COPERNICUS/S2_SR/20180628T155819_20180628T160601_T17SQV",
                "validFraction": 0.238
            },
            "after": {
                "date": "2018-07-08",
                "imageId": "COPERNICUS/S2_SR/20180708T155819_20180708T161248_T17SQV",
                "validFraction": 0.769
            }
        },
        "landsat": {
            "before": {
                "date": "2018-06-29",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_016035_20180629",
                "validFraction": 0.709
            },
            "after": {
                "date": "2018-07-08",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_015035_20180708",
                "validFraction": 0.851
            }
        }
    }
,
    {
        "id": "1029187",
        "label": "Raleigh flood 2022-05-23",
        "event_date": "2022-05-23",
        "noaa_event_ids": "1029187",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2022-05-13",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20220513T231430_20220513T231455_043199_0528C5_5077"
            },
            "after": {
                "date": "2022-05-25",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20220525T231430_20220525T231455_043374_052DF9_09E0"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2022-05-20",
                "imageId": "COPERNICUS/S2_SR/20220520T154821_20220520T155606_T17SQA",
                "validFraction": 0.052
            },
            "after": {
                "date": "2022-05-23",
                "imageId": "COPERNICUS/S2_SR/20220523T155831_20220523T160634_T17SQV",
                "validFraction": 0.181
            }
        },
        "landsat": {
            "before": {
                "date": "2022-05-16",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_015035_20220516",
                "validFraction": 0.016
            },
            "after": {
                "date": "2022-05-23",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_016035_20220523",
                "validFraction": 0.309
            }
        }
    }
,
    {
        "id": "1173317",
        "label": "Raleigh flood 2024-05-25",
        "event_date": "2024-05-25",
        "noaa_event_ids": "1173317",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2024-05-14",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20240514T231439_20240514T231504_053874_068C4B_5E79"
            },
            "after": {
                "date": "2024-05-26",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20240526T231440_20240526T231505_054049_069253_4EF3"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2024-05-19",
                "imageId": "COPERNICUS/S2_SR/20240519T154941_20240519T155829_T17SQA",
                "validFraction": 0.0
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2024-05-21",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_015035_20240521",
                "validFraction": 0.828
            },
            "after": null
        }
    }
,
    {
        "id": "1208432",
        "label": "Raleigh flood 2024-08-04",
        "event_date": "2024-08-04",
        "noaa_event_ids": "1208432",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2024-07-13",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20240713T231438_20240713T231503_054749_06AA93_B3A0"
            },
            "after": {
                "date": "2024-08-06",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20240806T231437_20240806T231502_055099_06B6C2_779E"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2024-07-28",
                "imageId": "COPERNICUS/S2_SR/20240728T154941_20240728T160102_T17SQV",
                "validFraction": 0.662
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2024-07-31",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_016035_20240731",
                "validFraction": 1.0
            },
            "after": null
        }
    }
  ],
  "houston": [
    {
        "id": "579534",
        "label": "Houston flood 2015-05-30",
        "event_date": "2015-05-30",
        "noaa_event_ids": "579534",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2015-05-07",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20150507T122236_20150507T122305_005815_0077A7_ABD7"
            },
            "after": {
                "date": "2015-05-31",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20150531T122237_20150531T122307_006165_008054_86FA"
            }
        },
        "sentinel2": {
            "before": null,
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2015-05-26",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20150526",
                "validFraction": 0.201
            },
            "after": null
        }
    }
,
    {
        "id": "675235_and_1_more",
        "label": "Houston flood 2017-01-18 (composite: 2 events)",
        "event_date": "2017-01-18",
        "noaa_event_ids": "675235;675098",
        "noaa_event_count": "2",
        "sentinel1": {
            "before": {
                "date": "2017-01-08",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170108T001813_20170108T001842_014733_017FB8_BB4E"
            },
            "after": {
                "date": "2017-01-20",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170120T001812_20170120T001841_014908_018538_5822"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2017-01-07",
                "imageId": "COPERNICUS/S2_SR/20170107T170701_20170107T170831_T15RTN",
                "validFraction": 0.676
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2017-01-16",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20170116",
                "validFraction": 0.677
            },
            "after": null
        }
    }
,
    {
        "id": "710731",
        "label": "Houston flood 2017-06-04",
        "event_date": "2017-06-04",
        "noaa_event_ids": "710731",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2017-05-25",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170525T002614_20170525T002639_016731_01BC9B_8DEE"
            },
            "after": {
                "date": "2017-06-06",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170606T002615_20170606T002640_016906_01C211_F481"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2017-05-24",
                "imageId": "COPERNICUS/S2_SR/20170524T170531_20170524T170526_T15RTN",
                "validFraction": 0.559
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2017-05-24",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20170524",
                "validFraction": 0.999
            },
            "after": null
        }
    }
,
    {
        "id": "710726_and_1_more",
        "label": "Houston flood 2017-06-24 (composite: 2 events)",
        "event_date": "2017-06-24",
        "noaa_event_ids": "710726;710727",
        "noaa_event_count": "2",
        "sentinel1": {
            "before": {
                "date": "2017-06-13",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170613T001820_20170613T001845_017008_01C531_1EE5"
            },
            "after": {
                "date": "2017-06-25",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170625T001820_20170625T001845_017183_01CA88_6F42"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2017-06-16",
                "imageId": "COPERNICUS/S2_SR/20170616T170311_20170616T171505_T15RTN",
                "validFraction": 0.476
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2017-06-16",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20170616",
                "validFraction": 0.176
            },
            "after": {
                "date": "2017-06-25",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20170625",
                "validFraction": 0.303
            }
        }
    }
,
    {
        "id": "721084_and_5_more",
        "label": "Houston flood 2017-08-27 (composite: 6 events)",
        "event_date": "2017-08-27",
        "noaa_event_ids": "721084;721085;721091;721096;721101;721136",
        "noaa_event_count": "6",
        "sentinel1": {
            "before": {
                "date": "2017-08-05",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170805T002619_20170805T002644_017781_01DCB4_1716"
            },
            "after": {
                "date": "2017-08-29",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170829T002620_20170829T002645_018131_01E74D_D734"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2017-08-15",
                "imageId": "COPERNICUS/S2_SR/20170815T165851_20170815T171519_T15RTP",
                "validFraction": 0.458
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2017-08-19",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20170819",
                "validFraction": 0.149
            },
            "after": null
        }
    }
,
    {
        "id": "830461_and_1_more",
        "label": "Houston flood 2019-05-09 (composite: 2 events)",
        "event_date": "2019-05-09",
        "noaa_event_ids": "830461;830464",
        "noaa_event_count": "2",
        "sentinel1": {
            "before": {
                "date": "2019-04-16",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190416T001829_20190416T001854_026808_030341_09F6"
            },
            "after": {
                "date": "2019-05-10",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190510T001830_20190510T001855_027158_030FB5_A959"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2019-05-04",
                "imageId": "COPERNICUS/S2_SR/20190504T164901_20190504T170412_T15RTN",
                "validFraction": 0.439
            },
            "after": {
                "date": "2019-05-09",
                "imageId": "COPERNICUS/S2_SR/20190509T164849_20190509T170403_T15RTP",
                "validFraction": 0.003
            }
        },
        "landsat": {
            "before": {
                "date": "2019-04-28",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20190428",
                "validFraction": 0.362
            },
            "after": null
        }
    }
,
    {
        "id": "857803_and_4_more",
        "label": "Houston flood 2019-09-18 (composite: 5 events)",
        "event_date": "2019-09-18",
        "noaa_event_ids": "857803;858108;858116;858117;869176",
        "noaa_event_count": "5",
        "sentinel1": {
            "before": {
                "date": "2019-09-07",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190907T001837_20190907T001902_028908_0346F0_99F7"
            },
            "after": {
                "date": "2019-09-19",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190919T001837_20190919T001902_029083_034D00_7C4E"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2019-09-14",
                "imageId": "COPERNICUS/S2_SR/20190914T165921_20190914T170704_T15RTN",
                "validFraction": 0.673
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2019-09-10",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20190910",
                "validFraction": 0.135
            },
            "after": null
        }
    }
,
    {
        "id": "899524",
        "label": "Houston flood 2020-06-25",
        "event_date": "2020-06-25",
        "noaa_event_ids": "899524",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2020-06-14",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20200614T002635_20200614T002700_033006_03D2B2_9749"
            },
            "after": {
                "date": "2020-06-26",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20200626T002636_20200626T002701_033181_03D804_3ED2"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2020-06-17",
                "imageId": "COPERNICUS/S2_SR/20200617T164901_20200617T170013_T15RTN",
                "validFraction": 0.391
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2020-06-17",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20200617",
                "validFraction": 0.805
            },
            "after": null
        }
    }
,
    {
        "id": "963117",
        "label": "Houston flood 2021-06-21",
        "event_date": "2021-06-21",
        "noaa_event_ids": "963117",
        "noaa_event_count": "1",
        "sentinel1": {
            "before": {
                "date": "2021-06-09",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20210609T002640_20210609T002705_038256_0483BB_7601"
            },
            "after": {
                "date": "2021-06-21",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20210621T002641_20210621T002706_038431_0488F1_75AA"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2021-06-17",
                "imageId": "COPERNICUS/S2_SR/20210617T164839_20210617T170159_T15RTP",
                "validFraction": 0.407
            },
            "after": {
                "date": "2021-06-22",
                "imageId": "COPERNICUS/S2_SR/20210622T164901_20210622T165949_T15RTP",
                "validFraction": 0.208
            }
        },
        "landsat": {
            "before": {
                "date": "2021-06-11",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20210611",
                "validFraction": 0.183
            },
            "after": null
        }
    }
,
    {
        "id": "1004355_and_4_more",
        "label": "Houston flood 2022-01-09 (composite: 5 events)",
        "event_date": "2022-01-09",
        "noaa_event_ids": "1004355;1004356;1004366;1004373;1004376",
        "noaa_event_count": "5",
        "sentinel1": {
            "before": {
                "date": "2021-12-30",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20211230T002644_20211230T002709_041231_04E66D_5F0B"
            },
            "after": {
                "date": "2022-01-11",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20220111T002644_20220111T002709_041406_04EC59_F1CD"
            }
        },
        "sentinel2": {
            "before": {
                "date": "2022-01-03",
                "imageId": "COPERNICUS/S2_SR/20220103T165709_20220103T170107_T15RTN",
                "validFraction": 0.542
            },
            "after": null
        },
        "landsat": {
            "before": {
                "date": "2022-01-05",
                "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20220105",
                "validFraction": 0.287
            },
            "after": null
        }
    }
,
    {
        "id": "control_2024-10-15",
        "label": "Houston CONTROL (no flood) 2024-10-15",
        "event_date": "2024-10-15",
        "noaa_event_ids": "none",
        "noaa_event_count": "0",
        "sentinel1": {
            "before": {
                "date": "2024-10-03",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20241003T002718_20241003T002743_055931_06D696_ACEF"
            },
            "after": {
                "date": "2024-10-15",
                "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20241015T002719_20241015T002744_056106_06DD72_7C83"
            }
        },
        "sentinel2": {
            "before": null,
            "after": null
        },
        "landsat": {
            "before": null,
            "after": null
        }
    }
  ]
};

// Helper to build AOI from config
function buildFocusAOI(cityKey) {
  var cfg = cityConfig[cityKey];
  var outer = ee.Geometry.Polygon([cfg.outerAOICoords]);
  // If focusBuffer is 0 or undefined, use full AOI (no buffering)
  // Negative buffer shrinks, positive expands
  if (cfg.focusBuffer && cfg.focusBuffer !== 0) {
    return outer.buffer(cfg.focusBuffer).bounds();
  }
  return outer; // Use full AOI without buffering
}

var focusAOI = buildFocusAOI(selectedCity);
Map.clear();
Map.centerObject(focusAOI, cityConfig[selectedCity].centerZoom);

var events = eventsByCity[selectedCity];
if (!events || events.length === 0) {
  throw new Error('No curated events found for city: ' + selectedCity);
}

// Sentinel-1 visualization stretch (VV polarization)
// Based on actual data: min ~-25 dB, max ~22 dB, median ~-9 dB
// Typical range: water (-20 to -30 dB), urban (-5 to -15 dB), vegetation (-10 to -20 dB)
// Use full range to show all detail, but focus on typical values
var radarVis = {min: -25, max: 10};
var s2Vis = {bands: ['B4', 'B3', 'B2'], min: 0.04, max: 0.25};
var landsatVis = {bands: ['red', 'green', 'blue'], min: 0.03, max: 0.22};
var changePalette = ['#0000ff', '#00ffff', '#ffff00', '#ff0000']; // blue to red for change
// Note: All layers are loaded but unchecked by default (except AOI and flood markers)
// You can toggle them on/off in the layers panel without reloading

// Get selected event by index (1-based)
function getEventByIndex(index) {
  if (index < 1 || index > events.length) {
    throw new Error('Event index out of range. Use 1-' + events.length);
  }
  return events[index - 1];
}

// Function to create and display flood location markers
// Handles composite events with multiple NOAA event IDs
function addFloodLocationMarkers(eventId, noaaEventIds) {
  var locations = [];
  var floodLocations = cityConfig[selectedCity].floodLocations || {};
  
  // First, try the event ID directly (works for composite events like '721084_and_5_more')
  if (floodLocations[eventId]) {
    locations = floodLocations[eventId];
  } else {
    // Check if composite event (multiple NOAA IDs separated by ';')
    if (noaaEventIds.indexOf(';') >= 0) {
      // Composite event - check all NOAA event IDs
      var eventIdList = noaaEventIds.split(';');
      for (var i = 0; i < eventIdList.length; i++) {
        var id = eventIdList[i].trim();
        if (floodLocations[id]) {
          locations = locations.concat(floodLocations[id]);
        }
      }
    } else {
      // Single event - use the NOAA event ID
      var checkId = noaaEventIds.trim();
      if (floodLocations[checkId]) {
        locations = floodLocations[checkId];
      }
    }
  }
  
  if (!locations || locations.length === 0) {
    print('No location data available for event ' + eventId + ' (NOAA IDs: ' + noaaEventIds + ')');
    print('  Available flood location keys:', Object.keys(floodLocations));
    return;
  }
  
  print('Found ' + locations.length + ' flood locations for event ' + eventId);
  
  var features = locations.map(function(loc) {
    return ee.Feature(
      ee.Geometry.Point([loc.lon, loc.lat]),
      {description: loc.desc}
    );
  });
  
  var locationCollection = ee.FeatureCollection(features);
  
  // Diagnostic: Check how many features are within the AOI
  var featuresInAOI = locationCollection.filterBounds(focusAOI);
  var countInAOI = featuresInAOI.size();
  print('  Features within AOI:', countInAOI, 'out of', locations.length);
  if (countInAOI.lt(locations.length)) {
    print('  Note: Some locations are outside the AOI and may not be visible in the current map view');
  }
  
  // Add all markers (even if outside AOI) - they'll show if the map view includes them
  // The map might need to be zoomed out or panned to see all markers
  
  // Add point markers
  Map.addLayer(
    locationCollection,
    {
      color: '#9c27b0', // purple to distinguish from flood mask
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
      color: '#9c27b0',
      fillColor: '#9c27b0',
      fillOpacity: 0.2
    },
    'Flood Location Buffers (100m)',
    false // Start with layer turned off
  );
}

var selectedEvent = getEventByIndex(selectedEventIndex);
var selectedEventId = selectedEvent.id;
var eventInfo = selectedEvent;
print('Selected event [' + selectedEventIndex + '/' + events.length + ']:', eventInfo.label);
print('  Event ID:', eventInfo.id);
if (eventInfo.noaa_event_ids === 'none' || parseInt(eventInfo.noaa_event_count) === 0) {
  print('  CONTROL EVENT (no flood) - for comparison with flood events');
} else if (parseInt(eventInfo.noaa_event_count) > 1) {
  print('  NOAA Event IDs (composite):', eventInfo.noaa_event_ids, '(' + eventInfo.noaa_event_count + ' events)');
}
print('  Event Date:', eventInfo.event_date);
print('  Sentinel-1 before ->', eventInfo.sentinel1.before);
print('  Sentinel-1 after  ->', eventInfo.sentinel1.after);
print('  Sentinel-2 before ->', eventInfo.sentinel2.before);
print('  Sentinel-2 after  ->', eventInfo.sentinel2.after);
print('  Landsat before   ->', eventInfo.landsat.before);
print('  Landsat after    ->', eventInfo.landsat.after);

// Helper functions
function formatLabel(prefix, scene) {
  if (!scene || !scene.date) return prefix;
  var label = prefix + ' (' + scene.date + ')';
  if (scene.validFraction != null) {
    var pct = (scene.validFraction * 100).toFixed(1);
    label += ', ' + pct + '% clear';
  }
  return label;
}

function nextDay(dateStr) {
  return ee.Date(dateStr).advance(1, 'day').format('YYYY-MM-dd');
}

function toDbSafe(img, band) {
  // Sentinel-1 GRD data in Earth Engine is already in dB scale
  // Just select the band - no conversion needed
  return ee.Image(img).select(band);
}

// S2_SR in GEE stores reflectance * 10000; scale to 0-1 for vis and NDWI
var S2_REFLECTANCE_SCALE = 0.0001;

// Mask only definite cloud (5) and cloud shadow (4). Keep low/medium cloud prob (6,7) visible so catalog validFraction matches view.
function maskS2Clouds(img) {
  var scl = img.select('SCL');
  var cloudMask = scl.neq(4)  // 4 = cloud shadow
    .and(scl.neq(5));         // 5 = cloud (definite)
  return img.updateMask(cloudMask);
}

// Load Sentinel-1 with mosaicking for full AOI coverage
function loadSentinel1(imageId, eventDate) {
  if (!imageId) return null;
  
  // First, try to load the specific image by ID
  var specificImage = ee.Image(imageId);
  
  // Check if we need to mosaic (for Houston, multiple passes may be needed)
  // Query all S1 images within 1-day window around the event date
  if (eventDate) {
    var eventDateObj = ee.Date(eventDate);
    var startDate = eventDateObj.advance(-1, 'day');
    var endDate = eventDateObj.advance(1, 'day');
    
    var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
      .filterBounds(focusAOI)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.listContains('system:band_names', 'VV'));
    
    var count = s1Collection.size();
    
    // If multiple images, mosaic them for full coverage
    // Otherwise, use the specific image
    var result = ee.Algorithms.If(
      count.gt(1),
      s1Collection.mosaic(), // Multiple images - mosaic them for full coverage
      specificImage // Use the specific image ID
    );
    
    return ee.Image(result);
  }
  return specificImage;
}

// Load multiple pre-event Sentinel-1 images and average them for stable baseline
// This reduces speckle noise and creates a more robust reference image
// Only averages images with the same orbit configuration (orbit direction, relative orbit, pass)
function loadSentinel1MultiImageBaseline(imageId, eventDate, beforeDate) {
  // Fallback to single image if required parameters are missing
  if (!imageId || !eventDate || !beforeDate) {
    return loadSentinel1(imageId, eventDate);
  }
  
  // First, get the orbit configuration from the reference image (beforeDate image)
  var referenceImage = ee.Image(imageId);
  var referenceOrbitPass = referenceImage.get('orbitProperties_pass'); // ASCENDING or DESCENDING
  var referenceOrbitNumber = referenceImage.get('relativeOrbitNumber_start');
  
  var eventDateObj = ee.Date(eventDate);
  var beforeDateObj = ee.Date(beforeDate);
  
  // Search for pre-event images in the window before the event
  // Use the beforeDate as the end of the search window
  var searchStartDate = beforeDateObj.advance(-multiImageDaysBefore, 'day');
  var searchEndDate = beforeDateObj.advance(1, 'day'); // Include the beforeDate image
  
  // Filter to only images with the same orbit configuration as the reference image
  // This ensures consistent viewing geometry across all averaged images
  var preEventCollection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(focusAOI)
    .filterDate(searchStartDate, searchEndDate)
    .filter(ee.Filter.listContains('system:band_names', 'VV'))
    .filter(ee.Filter.eq('orbitProperties_pass', referenceOrbitPass)) // Same orbit direction
    .filter(ee.Filter.eq('relativeOrbitNumber_start', referenceOrbitNumber)) // Same relative orbit
    .sort('system:time_start', false) // Most recent first
    .limit(multiImageMaxCount);
  
  var count = preEventCollection.size();
  
  // If we have multiple images with same orbit config, average them; otherwise use single image
  // The reference image itself should be included in the collection (within date range)
  var result = ee.Algorithms.If(
    count.gt(1),
    preEventCollection.mean(), // Average multiple images for stable baseline
    ee.Algorithms.If(
      count.eq(1),
      preEventCollection.first(), // Single image found (should be the reference image)
      loadSentinel1(imageId, eventDate) // Fallback to single image method if no matches
    )
  );
  
  return ee.Image(result);
}

function loadSentinel2(imageId) {
  if (!imageId) return null;
  var img = maskS2Clouds(ee.Image(imageId));
  return img.select(['B2', 'B3', 'B4', 'B8']).multiply(S2_REFLECTANCE_SCALE);
}

function loadLandsat(imageId) {
  if (!imageId) return null;
  var img = ee.Image(imageId);
  
  // Landsat Collection 2 Level 2 has SR_B2, SR_B3, SR_B4 bands
  // Scale to reflectance and rename to red, green, blue for visualization
  // Scale factor: 0.0000275, offset: -0.2
  var red = img.select('SR_B4').multiply(0.0000275).add(-0.2).rename('red');
  var green = img.select('SR_B3').multiply(0.0000275).add(-0.2).rename('green');
  var blue = img.select('SR_B2').multiply(0.0000275).add(-0.2).rename('blue');
  
  // Apply cloud mask using QA_PIXEL
  var qaPixel = img.select('QA_PIXEL');
  var cloudShadowBitMask = 1 << 4;
  var cloudsBitMask = 1 << 3;
  var mask = qaPixel.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qaPixel.bitwiseAnd(cloudsBitMask).eq(0));
  
  return ee.Image.cat([red, green, blue]).updateMask(mask);
}

// Load images
// For control events, imageId may be null but date should be provided
var beforeImageId = eventInfo.sentinel1.before && eventInfo.sentinel1.before.imageId;
var beforeDate = eventInfo.sentinel1.before && eventInfo.sentinel1.before.date;
var afterImageId = eventInfo.sentinel1.after && eventInfo.sentinel1.after.imageId;
var afterDate = eventInfo.sentinel1.after && eventInfo.sentinel1.after.date;

// Use multi-image baseline if enabled, otherwise use single image (current behavior)
var before = useMultiImageBaseline 
  ? loadSentinel1MultiImageBaseline(beforeImageId, eventInfo.event_date, beforeDate)
  : loadSentinel1(beforeImageId, beforeDate);
var after = loadSentinel1(afterImageId, afterDate);
var s2Before = loadSentinel2(eventInfo.sentinel2.before && eventInfo.sentinel2.before.imageId);
var s2After = loadSentinel2(eventInfo.sentinel2.after && eventInfo.sentinel2.after.imageId);
var landsatBefore = loadLandsat(eventInfo.landsat.before && eventInfo.landsat.before.imageId);
var landsatAfter = loadLandsat(eventInfo.landsat.after && eventInfo.landsat.after.imageId);

// Clip to AOI
if (before) before = before.clip(focusAOI);
if (after) after = after.clip(focusAOI);
if (s2Before) s2Before = s2Before.clip(focusAOI);
if (s2After) s2After = s2After.clip(focusAOI);
if (landsatBefore) landsatBefore = landsatBefore.clip(focusAOI);
if (landsatAfter) landsatAfter = landsatAfter.clip(focusAOI);

// Urban reference mask (built-up OR >=20% impervious) for context
var worldCover = ee.Image('ESA/WorldCover/v200/2021').select('Map').rename('landcover');
var worldCoverBuilt = worldCover.eq(FLOOD_DETECTION_CONFIG.worldCoverBuiltClass);
var nlcdImpervious = ee.Image('USGS/NLCD_RELEASES/2021_REL/NLCD/2021')
  .select('impervious')
  .divide(100);
var nlcdImperviousMask = nlcdImpervious
  .updateMask(nlcdImpervious.mask())
  .gte(FLOOD_DETECTION_CONFIG.nlcdImperviousThreshold);
var urbanMask = worldCoverBuilt.or(nlcdImperviousMask);

// Permanent water mask for reference (not applied to flood mask yet)
var jrcWater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence');
// Unmask to 0 so the mask doesn't disappear where JRC has nodata
var permanentWater = jrcWater.gte(FLOOD_DETECTION_CONFIG.jrcWaterOccurrenceThreshold).unmask(0).rename('perm_water');

// Holder for the flood mask so we can overlay it last (above optical layers)
var floodMaskLayer = null;
var s2FloodMaskLayer = null;

// Sentinel-1 VV/VH in dB plus difference/ratio helpers for debugging flood signal
print('Has S1 before:', !!before, 'Has S1 after:', !!after);
if (eventInfo.sentinel2 && (eventInfo.sentinel2.before || eventInfo.sentinel2.after)) {
  var vfBefore = eventInfo.sentinel2.before && eventInfo.sentinel2.before.validFraction != null ? (eventInfo.sentinel2.before.validFraction * 100).toFixed(1) : '—';
  var vfAfter = eventInfo.sentinel2.after && eventInfo.sentinel2.after.validFraction != null ? (eventInfo.sentinel2.after.validFraction * 100).toFixed(1) : '—';
  print('S2 validFraction (clear-sky % of tile): before', vfBefore + '%', ', after', vfAfter + '%', '(low = cloudy, layer appears white)');
  if (eventInfo.sentinel2.after && eventInfo.sentinel2.after.validFraction != null && eventInfo.sentinel2.after.validFraction < 0.05) {
    print('  → S2 After is mostly clouds; uncheck "Sentinel-2 After" to see S1 flood mask and basemap clearly.');
  }
}
if (useMultiImageBaseline) {
  print('Multi-image baseline enabled: averaging up to', multiImageMaxCount, 'pre-event images from', multiImageDaysBefore, 'days before event');
  print('  Only images with same orbit configuration (pass direction and relative orbit) will be averaged');
}

// Log the actual S1 system IDs to verify correct scenes are loaded per event
if (before || after) {
  print('Loaded S1 image IDs', ee.Dictionary({
    before_id: before ? before.get('system:id') : 'none',
    after_id: after ? after.get('system:id') : 'none'
  }));
}

// Diagnostic: Check raw values before conversion
if (before) {
  var rawVV = before.select('VV');
  var rawStats = rawVV.reduceRegion({
    reducer: ee.Reducer.minMax().combine({
      reducer2: ee.Reducer.percentile([5, 50, 95]),
      sharedInputs: true
    }),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  });
  print('S1 VV Raw (linear) statistics:', rawStats);
}

var beforeVV = before ? toDbSafe(before, 'VV') : null;
var afterVV = after ? toDbSafe(after, 'VV') : null;

// Diagnostic: Check actual dB values in the image
if (beforeVV) {
  var beforeStats = beforeVV.reduceRegion({
    reducer: ee.Reducer.minMax().combine({
      reducer2: ee.Reducer.percentile([5, 50, 95]),
      sharedInputs: true
    }),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  });
  print('S1 VV dB Before statistics:', beforeStats);
  
  // If most values are at -60 dB (clipping threshold), the conversion might be wrong
  // Try using Earth Engine's built-in toNatural() and then log10 conversion
  Map.addLayer(beforeVV, radarVis, 'S1 VV dB Before ' + (eventInfo.sentinel1.before && eventInfo.sentinel1.before.date), false);
} else {
  print('Warning: missing Sentinel-1 "before" scene.');
}

if (afterVV) {
  Map.addLayer(afterVV, radarVis, 'S1 VV dB After ' + (eventInfo.sentinel1.after && eventInfo.sentinel1.after.date), false);
} else {
  print('Warning: missing Sentinel-1 "after" scene!');
}

// Change layers to highlight flooding (negative = darker after = flooding)
// dB change = after_dB - before_dB
// Negative values mean backscatter decreased (darker) = likely flooding
// Positive values mean backscatter increased (brighter) = unlikely flooding
if (beforeVV && afterVV) {
  // Calculate change: after - before
  // If after is darker (lower dB) than before, change is negative = flooding
  var vvChange = afterVV.subtract(beforeVV);
  
  // Diagnostic: Check change statistics
  var vvChangeStats = vvChange.reduceRegion({
    reducer: ee.Reducer.minMax().combine({
      reducer2: ee.Reducer.percentile([5, 50, 95]),
      sharedInputs: true
    }),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  });
  print('S1 VV dB Change statistics:', vvChangeStats);
  
  Map.addLayer(
    vvChange,
    {min: -4, max: 4, palette: changePalette},
    'S1 VV dB Change',
    true
  );

  // Smoothed change (basic speckle reduction) and flood mask
  var beforeVVSmoothed = beforeVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var afterVVSmoothed = afterVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var vvChangeSmoothed = afterVVSmoothed.subtract(beforeVVSmoothed);

  Map.addLayer(
    vvChangeSmoothed,
    {min: -3, max: 3, palette: changePalette},
    'S1 VV dB Change (smoothed)',
    false
  );

  // Flood mask: Hybrid approach
  // If VH is available: use VV AND VH (both must agree) - more accurate
  // If VH not available: use VV with stricter threshold (-2.0 dB) - reduces false positives
  
  // Check if VH exists in both images
  var beforeBands = before.bandNames();
  var afterBands = after.bandNames();
  var beforeHasVH = beforeBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var afterHasVH = afterBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var bothHaveVH = beforeHasVH.and(afterHasVH);
  
  // Threshold: fixed or adaptive (percentile of VV change over AOI, clamped)
  var thresholdVvVh;
  var thresholdVvOnly;
  if (useAdaptiveThreshold) {
    var vvChangeForReduce = vvChangeSmoothed.rename('change');
    var percentileResult = vvChangeForReduce.reduceRegion({
      reducer: ee.Reducer.percentile([FLOOD_DETECTION_CONFIG.adaptivePercentile], ['change']),
      geometry: focusAOI,
      scale: 100,
      bestEffort: true
    });
    var adaptiveThreshold = ee.Number(percentileResult.get('change'))
      .max(FLOOD_DETECTION_CONFIG.adaptiveThresholdMin)
      .min(FLOOD_DETECTION_CONFIG.adaptiveThresholdMax);
    thresholdVvVh = adaptiveThreshold;
    thresholdVvOnly = adaptiveThreshold;
  } else {
    thresholdVvVh = ee.Number(FLOOD_DETECTION_CONFIG.vvVhThreshold);
    thresholdVvOnly = ee.Number(FLOOD_DETECTION_CONFIG.vvOnlyThreshold);
  }
  
  // Create VV mask (threshold to detect flooding)
  // Negative change = backscatter decreased = flooding
  var vvMask = vvChangeSmoothed.lt(thresholdVvVh).rename('flood');
  
  // Diagnostic: Check VV mask pixel count
  var vvMaskCount = vvMask.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('flood');
  print('VV flood mask pixels (before VH combination):', vvMaskCount);
  
  // Create VH mask if available
  // VH change = after_VH_dB - before_VH_dB (negative = flooding)
  // Both images are already in dB, so subtraction gives dB change directly
  var vhChangeSmoothed = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(toDbSafe(after, 'VH'))
      .focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')
      .subtract(ee.Image(toDbSafe(before, 'VH')).focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')),
    ee.Image.constant(0) // dummy value, won't be used
  );
  
  var vhMask = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(vhChangeSmoothed).lt(thresholdVvVh).rename('flood'),
    ee.Image.constant(0).mask(ee.Image.constant(0)) // fully masked dummy
  );
  
  // Diagnostic: Check VH mask pixel count if available
  if (bothHaveVH) {
    var vhMaskCount = ee.Image(vhMask).reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: focusAOI,
      scale: 100,
      bestEffort: true
    }).get('flood');
    print('VH flood mask pixels:', vhMaskCount);
  }
  
  // Combine masks: if VH available, both must agree; otherwise use stricter VV threshold
  // Use .multiply() instead of .and() for binary mask combination
  floodMaskLayer = ee.Image(ee.Algorithms.If(
    bothHaveVH,
    vvMask.multiply(ee.Image(vhMask)), // Both VV and VH must agree (multiply = AND for binary)
    vvChangeSmoothed.lt(thresholdVvOnly) // Stricter VV-only threshold
  )).rename('flood');
  
  // Diagnostic: Check combined mask pixel count
  var combinedMaskCount = floodMaskLayer.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('flood');
  print('Combined flood mask pixels (before urban/water masks):', combinedMaskCount);
  
  // Apply permanent water and speckle first; keep a copy for validation (no urban filter)
  var floodMaskPreUrban = floodMaskLayer
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  floodMaskPreUrban = floodMaskPreUrban.updateMask(
    floodMaskPreUrban.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  
  // Apply urban and permanent water masks
  var beforeFilterCount = floodMaskLayer.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('flood');
  print('Flood pixels before urban/water filtering:', beforeFilterCount);
  
  floodMaskLayer = floodMaskLayer
    .updateMask(urbanMask) // Only urban areas (WorldCover built OR NLCD impervious >=20%)
    .updateMask(permanentWater.not()) // Exclude permanent water (JRC occurrence >=50%)
    .clip(focusAOI);
  
  // Remove small speckle (isolated pixels) - keep only connected areas with at least 5 pixels
  floodMaskLayer = floodMaskLayer.updateMask(
    floodMaskLayer.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  
  // Diagnostic: Check final mask pixel count after all filters
  var finalMaskCount = floodMaskLayer.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('flood');
  print('Final flood mask pixels (after urban/water/speckle filters):', finalMaskCount);
  
  // Diagnostic: Check flood area percentage
  var floodArea = floodMaskLayer.multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('flood');
  var totalArea = ee.Image.pixelArea().reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 100,
    bestEffort: true
  }).get('area');
  var floodPercent = ee.Number(floodArea).divide(ee.Number(totalArea)).multiply(100);
  print('Flood area percentage:', floodPercent, '%');
  
  if (useAdaptiveThreshold) {
    print('Flood mask created using: Adaptive threshold (percentile ' + FLOOD_DETECTION_CONFIG.adaptivePercentile + ', clamped to [' + FLOOD_DETECTION_CONFIG.adaptiveThresholdMin + ', ' + FLOOD_DETECTION_CONFIG.adaptiveThresholdMax + '] dB)');
    print('  Computed threshold (dB):', thresholdVvVh);
  } else {
    print('Flood mask created using:', ee.Algorithms.If(
      bothHaveVH,
      'VV AND VH (both must agree, threshold: ' + FLOOD_DETECTION_CONFIG.vvVhThreshold + ' dB)',
      'VV only (threshold: ' + FLOOD_DETECTION_CONFIG.vvOnlyThreshold + ' dB)'
    ));
  }
}

// NOAA point validation: sample S1 flood mask at reported flood locations
var validationLocations = [];
var validationFloodLocations = cityConfig[selectedCity].floodLocations || {};
var validationEventId = selectedEventId;
var validationNoaaIds = eventInfo.noaa_event_ids || '';
if (validationFloodLocations[validationEventId]) {
  validationLocations = validationFloodLocations[validationEventId];
} else if (validationNoaaIds.indexOf(';') >= 0) {
  validationNoaaIds.split(';').forEach(function(id) {
    id = id.trim();
    if (validationFloodLocations[id]) {
      validationLocations = validationLocations.concat(validationFloodLocations[id]);
    }
  });
} else {
  var checkId = validationNoaaIds.trim();
  if (validationFloodLocations[checkId]) {
    validationLocations = validationFloodLocations[checkId];
  }
}
if (validationLocations.length > 0) {
  var validationPoints = ee.FeatureCollection(validationLocations.map(function(loc) {
    return ee.Feature(ee.Geometry.Point([loc.lon, loc.lat]));
  }));
  var validationPointsInAOI = validationPoints.filterBounds(focusAOI);
  var validationNumPoints = validationPointsInAOI.size();
  print('NOAA point validation (SAR, before urban mask):', validationLocations.length, 'locations for event,', validationNumPoints, 'inside AOI');
  var validationBuffers = [500, 1000];
  function hitRateAtBuffer(bufferM, maskImage) {
    var withBuffer = validationPointsInAOI.map(function(f) {
      var buf = f.geometry().buffer(bufferM);
      var maxVal = maskImage.reduceRegion({
        geometry: buf,
        reducer: ee.Reducer.max(),
        scale: 100,
        bestEffort: true
      }).get('flood');
      return f.set('flood_max', maxVal);
    });
    var withData = withBuffer.filter(ee.Filter.notNull(['flood_max']));
    var total = withData.size();
    var hits = withData.filter(ee.Filter.gte('flood_max', 1)).size();
    return { total: total, hits: hits, pct: ee.Number(hits).divide(ee.Number(total).max(1)).multiply(100) };
  }
  validationBuffers.forEach(function(bufferM) {
    var r = hitRateAtBuffer(bufferM, floodMaskPreUrban);
    print('  Buffer', bufferM, 'm:', r.hits, '/', r.total, '=', r.pct, '%');
  });
} else {
  print('NOAA point validation: no location data for this event');
}

// Sentinel-2 flood mask for validation
if (s2Before && s2After) {
  var s2BeforeFull = s2Before;
  var s2AfterFull = s2After;
  
  // Calculate NDWI: (B3 - B8) / (B3 + B8)
  var ndwiBefore = s2BeforeFull.normalizedDifference(['B3', 'B8']).rename('ndwi');
  var ndwiAfter = s2AfterFull.normalizedDifference(['B3', 'B8']).rename('ndwi');
  
  // Water detection: NDWI > 0.2
  var waterBefore = ndwiBefore.gt(0.2);
  var waterAfter = ndwiAfter.gt(0.2);
  // Where "before" is masked (e.g. cloud), treat as not water so we can see new water in "after"
  waterBefore = waterBefore.unmask(0);
  
  // Flood = water after AND NOT water before
  var s2FloodMask = waterAfter.and(waterBefore.not()).rename('flood');
  
  // Apply permanent water mask (exclude permanent water)
  s2FloodMaskLayer = s2FloodMask
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  
  print('S2 flood mask created (NDWI > 0.2, change detection)');
  var s2FloodPixels = s2FloodMaskLayer.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 20,
    bestEffort: true
  });
  s2FloodPixels.evaluate(function(v) {
    var n = v && v.flood != null ? v.flood : 0;
    print('S2 flood pixel count:', n, n === 0 ? '(no blue pixels: try another event or check clouds)' : '');
  });
} else {
  print('S2 flood mask not available: need both before and after Sentinel-2 images');
}

// Add VH layers if VH is available in both images
if (before && after) {
  var beforeBandsForVis = before.bandNames();
  var afterBandsForVis = after.bandNames();
  var beforeHasVHForVis = beforeBandsForVis.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var afterHasVHForVis = afterBandsForVis.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var bothHaveVHForVis = beforeHasVHForVis.and(afterHasVHForVis);
  
  // Only add VH layers if both images have VH
  // Use conditional to create images only when VH exists
  var beforeVHVis = ee.Image(ee.Algorithms.If(
    bothHaveVHForVis,
    toDbSafe(before, 'VH'),
    ee.Image.constant(0).rename('VH') // dummy image
  ));
  
  var afterVHVis = ee.Image(ee.Algorithms.If(
    bothHaveVHForVis,
    toDbSafe(after, 'VH'),
    ee.Image.constant(0).rename('VH') // dummy image
  ));
  
  // Only add to map if VH actually exists (mask out dummy images)
  var beforeVHLayer = ee.Image(ee.Algorithms.If(
    bothHaveVHForVis,
    beforeVHVis,
    ee.Image.constant(0).mask(ee.Image.constant(0)) // fully masked dummy
  ));
  
  var afterVHLayer = ee.Image(ee.Algorithms.If(
    bothHaveVHForVis,
    afterVHVis,
    ee.Image.constant(0).mask(ee.Image.constant(0)) // fully masked dummy
  ));
  
  Map.addLayer(beforeVHLayer, radarVis, 'S1 VH dB Before', false);
  Map.addLayer(afterVHLayer, radarVis, 'S1 VH dB After', false);
  
  var vhChangeVis = ee.Image(ee.Algorithms.If(
    bothHaveVHForVis,
    afterVHVis.subtract(beforeVHVis),
    ee.Image.constant(0).mask(ee.Image.constant(0)) // fully masked dummy
  ));
  
  Map.addLayer(vhChangeVis, {min: -4, max: 4, palette: changePalette}, 'S1 VH dB Change', false);
  
  // Print info about VH availability
  print('VH available:', bothHaveVHForVis);
  print('Flood detection method:', ee.Algorithms.If(
    bothHaveVHForVis,
    'VV AND VH (both must agree)',
    'VV only (stricter threshold: -1.5 dB)'
  ));
}

Map.addLayer(
  ee.Image().paint(focusAOI, 1, 2),
  {palette: 'red'},
  eventInfo.label + (eventInfo.sentinel1.after && eventInfo.sentinel1.after.date ? ' (' + eventInfo.sentinel1.after.date + ')' : '') + ' AOI'
);

// Optional city-specific highlight boxes (e.g., Crabtree Valley Mall for Raleigh)
var highlightBoxes = cityConfig[selectedCity].highlightBoxes || [];
highlightBoxes.forEach(function(box, idx) {
  Map.addLayer(
    ee.Image().paint(box.geom, 1, 2),
    {palette: box.palette || 'yellow'},
    box.label || ('Highlight ' + (idx + 1)),
    true
  );
});

// Visualize urban mask for reference (union of WorldCover built + NLCD impervious)
Map.addLayer(
  urbanMask.selfMask(),
  {palette: ['#2b2b2b'], opacity: 0.45},
  'Urban Mask (WorldCover built OR NLCD impervious >=20%)',
  false
);

// Visualize permanent water (JRC occurrence >=50%) for reference
var waterFill = permanentWater.selfMask().visualize({
  palette: ['#ff00ff'],
  opacity: 0.5
});
var waterOutline = permanentWater
  .focal_max(60, 'circle', 'meters')
  .subtract(permanentWater)
  .selfMask()
  .visualize({palette: ['#ff00ff'], opacity: 0.9});
Map.addLayer(
  ee.ImageCollection([waterFill, waterOutline]).mosaic(),
  {},
  'Permanent Water (JRC occurrence >=50%)',
  false
);

// Add Sentinel-2 layers (unchecked by default for faster visualization)
if (s2Before) {
  Map.addLayer(s2Before, s2Vis, formatLabel('Sentinel-2 Before', eventInfo.sentinel2.before), false);
  // Diagnostic: what % of AOI is valid in this view (vs catalog validFraction)
  var onesBefore = ee.Image.constant(1).updateMask(s2Before.select(0).mask());
  var statsBefore = onesBefore.reduceRegion({
    reducer: ee.Reducer.sum().combine(ee.Reducer.count(), null, true),
    geometry: focusAOI,
    scale: 60,
    bestEffort: true
  });
  statsBefore.evaluate(function(v) {
    var sum = v && v.constant_sum != null ? v.constant_sum : 0;
    var count = v && v.constant_count != null ? v.constant_count : 1;
    var pct = count > 0 ? ((sum / count) * 100).toFixed(1) : '0';
    var cat = eventInfo.sentinel2.before.validFraction != null ? (eventInfo.sentinel2.before.validFraction * 100).toFixed(1) : '?';
    print('S2 Before: ' + pct + '% of AOI has valid pixels in this view (catalog: ' + cat + '% clear)');
  });
}
if (s2After) {
  Map.addLayer(s2After, s2Vis, formatLabel('Sentinel-2 After', eventInfo.sentinel2.after), false);
  var onesAfter = ee.Image.constant(1).updateMask(s2After.select(0).mask());
  var statsAfter = onesAfter.reduceRegion({
    reducer: ee.Reducer.sum().combine(ee.Reducer.count(), null, true),
    geometry: focusAOI,
    scale: 60,
    bestEffort: true
  });
  statsAfter.evaluate(function(v) {
    var sum = v && v.constant_sum != null ? v.constant_sum : 0;
    var count = v && v.constant_count != null ? v.constant_count : 1;
    var pct = count > 0 ? ((sum / count) * 100).toFixed(1) : '0';
    var cat = eventInfo.sentinel2.after.validFraction != null ? (eventInfo.sentinel2.after.validFraction * 100).toFixed(1) : '?';
    print('S2 After: ' + pct + '% of AOI has valid pixels in this view (catalog: ' + cat + '% clear)');
  });
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

// Add flood masks last so they stay visible over optical/radar backdrops
// S1 Flood Mask (red)
if (floodMaskLayer) {
  // Only visualize pixels where mask value is 1 (flood pixels)
  // Use selfMask() to ensure only non-zero pixels are shown
  var floodFill = floodMaskLayer.selfMask().visualize({
    palette: ['#e60000'], // red fill
    opacity: 0.55
  });
  var floodOutline = floodMaskLayer.selfMask()
    .focal_max(40, 'circle', 'meters')
    .subtract(floodMaskLayer.selfMask())
    .selfMask()
    .visualize({palette: ['#8b0000'], opacity: 0.9}); // darker red outline
  var floodVis = ee.ImageCollection([floodFill, floodOutline]).mosaic();
  Map.addLayer(floodVis, {}, 'S1 Flood Mask (SAR, < -1.8 dB)', true);
}

// S2 Flood Mask (blue) - for visual comparison/validation
if (s2FloodMaskLayer) {
  // Only visualize pixels where mask value is 1 (flood pixels)
  var s2FloodFill = s2FloodMaskLayer.selfMask().visualize({
    palette: ['#0066ff'], // blue fill
    opacity: 0.7
  });
  var s2FloodOutline = s2FloodMaskLayer.selfMask()
    .focal_max(40, 'circle', 'meters')
    .subtract(s2FloodMaskLayer.selfMask())
    .selfMask()
    .visualize({palette: ['#0011aa'], opacity: 1}); // darker blue outline
  var s2FloodVis = ee.ImageCollection([s2FloodFill, s2FloodOutline]).mosaic();
  Map.addLayer(s2FloodVis, {opacity: 0.9}, 'S2 Flood Mask (NDWI, > 0.2)', true);
  
  // Print comparison info
  if (floodMaskLayer) {
    print('=== FLOOD MASK COMPARISON ===');
    print('Toggle S1 (red) and S2 (blue) masks to compare visually');
    print('Overlapping areas = high confidence');
    print('S1 only = check for clouds in S2 or SAR-specific detection');
    print('S2 only = check for shallow water or timing differences');
  }
}

// Add known flood location markers from NOAA data
// Pass both event ID and NOAA event IDs for composite event handling
addFloodLocationMarkers(selectedEventId, eventInfo.noaa_event_ids);
