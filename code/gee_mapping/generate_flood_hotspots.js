/**
 * Flood Hotspot Map Generator for Raleigh, NC and Houston, TX
 *
 * This script aggregates flood detections across all events for a city
 * to create a hotspot map showing where flooding occurs most frequently.
 * 
 * Color scheme:
 * - Yellow: 1 event detected flooding
 * - Orange: 2-3 events detected flooding
 * - Red: 4+ events detected flooding
 * - Transparent: 0 events (no flooding detected)
 */

// ============================================================================
// USER SETTINGS
// ============================================================================

var selectedCity = 'raleigh'; // 'raleigh' or 'houston'

// Multi-image baseline: average multiple pre-event images for more stable baseline
// Set to true to enable averaging 3-5 pre-event images (reduces speckle noise)
// Set to false to use single closest pre-event image (current behavior, default)
var useMultiImageBaseline = false;
var multiImageDaysBefore = 30;  // Days before event to search for pre-event images
var multiImageMaxCount = 5;   // Maximum number of images to average

// Adaptive threshold: derive threshold from each scene instead of fixed dB
// Set to true to use scene percentile (clamped); false = use fixed vvVhThreshold / vvOnlyThreshold
var useAdaptiveThreshold = true;

// ============================================================================
// FLOOD DETECTION PARAMETERS (SHARED WITH visualize_flood_events.js)
// ============================================================================
// IMPORTANT: These parameters must match visualize_flood_events.js exactly
// to ensure consistent flood detection across both scripts.

var FLOOD_DETECTION_CONFIG = {
  // Speckle filtering
  smoothRadius: 90,  // meters - radius for focal_mean smoothing
  
  // Change detection thresholds (dB) - used when useAdaptiveThreshold is false
  vvVhThreshold: -1.8,  // dB - threshold when both VV and VH are available
  vvOnlyThreshold: -2.0,  // dB - stricter threshold when only VV is available
  
  // Adaptive threshold (when useAdaptiveThreshold is true): percentile of VV change, clamped
  adaptivePercentile: 7,       // use this percentile of change image over AOI
  adaptiveThresholdMin: -2.8,   // clamp threshold to no more negative than this (dB)
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

// ============================================================================
// CITY CONFIGURATION
// ============================================================================

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
    floodLocations: {
      '755610': [
        {lat: 35.89, lon: -78.71, desc: 'Begin: Crabtree Valley Mall area'},
        {lat: 35.82, lon: -78.71, desc: 'End: Crabtree Creek overflow'},
        {lat: 35.85, lon: -78.70, desc: 'Crabtree Valley Mall (approx)'},
        {lat: 35.86, lon: -78.68, desc: 'Newton Road near Six Forks Road (approx)'},
        {lat: 35.88, lon: -78.71, desc: 'Leesville Road & Millbrook Road (approx)'}
      ],
      '775032': [{lat: 35.8, lon: -78.61, desc: 'North Raleigh Boulevard near Millbank Street'}],
      '775034': [{lat: 35.79, lon: -78.64, desc: 'Peace Street and Capitol Boulevard'}],
      '775037': [{lat: 35.8148, lon: -78.6198, desc: 'Atlantic Avenue at Hodges Street'}],
      '775029': [{lat: 35.6332, lon: -78.7092, desc: 'Banks Road and Ten Ten Road'}],
      '775031': [{lat: 35.7294, lon: -78.6466, desc: 'Gideon Creek Way near Durham Drive'}],
      '781167': [{lat: 35.8049, lon: -78.623, desc: 'Wake Forest Road near Georgetown Road'}],
      '1029187': [{lat: 35.7864, lon: -78.7353, desc: 'Wolf Creek Circle'}],
      '1173317': [{lat: 35.7794, lon: -78.6435, desc: 'Union Station (S West St & W Martin St)'}],
      '1208861': [{lat: 35.7742, lon: -78.6469, desc: 'Union Station (West St & Martin St)'}],
      '1208432': [{lat: 35.77, lon: -78.73, desc: 'I-440 eastbound (closed)'}]
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
    focusBuffer: 0, // No buffer - use full AOI
    centerZoom: 11,
    floodLocations: {
      '579534': [
        {lat: 30.1143, lon: -95.4547, desc: 'SPRING'},
        {lat: 29.5997, lon: -95.6387, desc: 'HOUSTON HULL ARPT'}
      ],
      '675235_and_1_more': [
        {lat: 29.5897, lon: -95.4473, desc: 'ALMEDA'},
        {lat: 29.7156, lon: -95.2048, desc: 'PASADENA'},
        {lat: 29.7598, lon: -95.3668, desc: 'ENGLEWOOD'},
        {lat: 29.6487, lon: -95.5412, desc: 'MISSOURI CITY'}
      ],
      '710731': [
        {lat: 29.7758, lon: -95.5879, desc: 'HERMOSSEY'},
        {lat: 29.7878, lon: -95.3474, desc: 'ENGLEWOOD'}
      ],
      '710726_and_1_more': [
        {lat: 29.8919, lon: -95.3761, desc: 'LITTLE YORK'},
        {lat: 29.8169, lon: -95.165, desc: 'FAUNA'},
        {lat: 29.7227, lon: -95.465, desc: 'BELLAIRE JCT'},
        {lat: 29.88, lon: -95.4626, desc: 'GORDEN PARK'}
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
        {lat: 29.9301, lon: -95.3137, desc: 'TODD MISSION'}
      ],
      '857803_and_4_more': [
        {lat: 29.6666, lon: -95.1575, desc: 'GOLDEN ACRES'},
        {lat: 29.6666, lon: -95.1538, desc: 'GOLDEN ACRES'},
        {lat: 30.0579, lon: -95.1776, desc: 'HUMBLE'},
        {lat: 30.0755, lon: -95.1071, desc: 'HUFFMAN'},
        {lat: 29.963, lon: -95.3391, desc: '(IAH)HOUSTON INTL AR'}
      ],
      '899524': [
        {lat: 29.79, lon: -95.82, desc: 'KATY'},
        {lat: 29.8685, lon: -95.6419, desc: 'HOUSTON LAKESIDE ARP'}
      ],
      '963117': [
        {lat: 29.82, lon: -95.34, desc: 'SETTEGAST'},
        {lat: 29.8231, lon: -95.3407, desc: 'SETTEGAST'}
      ],
      '1004355_and_4_more': [
        {lat: 29.78, lon: -95.54, desc: 'HERMOSSEY'},
        {lat: 29.7881, lon: -95.5383, desc: 'HERMOSSEY'},
        {lat: 29.8228, lon: -95.5298, desc: 'SPRING BRANCH'},
        {lat: 29.8224, lon: -95.5203, desc: 'SPRING BRANCH'},
        {lat: 29.8198, lon: -95.5015, desc: 'SPRING BRANCH'}
      ]
    }
  }
};

// ============================================================================
// EVENT DATA (same as visualize_flood_events.js)
// ============================================================================

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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildFocusAOI(cityKey) {
  var cfg = cityConfig[cityKey];
  var outer = ee.Geometry.Polygon([cfg.outerAOICoords]);
  if (cfg.focusBuffer && cfg.focusBuffer !== 0) {
    return outer.buffer(cfg.focusBuffer).bounds();
  }
  return outer;
}

function toDbSafe(img, band) {
  // Sentinel-1 GRD data in Earth Engine is already in dB scale
  return ee.Image(img).select(band);
}

function loadSentinel1(imageId, eventDate) {
  if (!imageId) return null;
  
  var specificImage = ee.Image(imageId);
  
  if (eventDate) {
    var eventDateObj = ee.Date(eventDate);
    var startDate = eventDateObj.advance(-1, 'day');
    var endDate = eventDateObj.advance(1, 'day');
    
    var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
      .filterBounds(focusAOI)
      .filterDate(startDate, endDate)
      .filter(ee.Filter.listContains('system:band_names', 'VV'));
    
    var count = s1Collection.size();
    
    var result = ee.Algorithms.If(
      count.gt(1),
      s1Collection.mosaic(),
      specificImage
    );
    
    return ee.Image(result);
  }
  return specificImage;
}

function loadSentinel1MultiImageBaseline(imageId, eventDate, beforeDate) {
  if (!imageId || !eventDate || !beforeDate) {
    return loadSentinel1(imageId, eventDate);
  }
  
  var referenceImage = ee.Image(imageId);
  var referenceOrbitPass = referenceImage.get('orbitProperties_pass');
  var referenceOrbitNumber = referenceImage.get('relativeOrbitNumber_start');
  
  var eventDateObj = ee.Date(eventDate);
  var beforeDateObj = ee.Date(beforeDate);
  
  var searchStartDate = beforeDateObj.advance(-multiImageDaysBefore, 'day');
  var searchEndDate = beforeDateObj.advance(1, 'day');
  
  var preEventCollection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(focusAOI)
    .filterDate(searchStartDate, searchEndDate)
    .filter(ee.Filter.listContains('system:band_names', 'VV'))
    .filter(ee.Filter.eq('orbitProperties_pass', referenceOrbitPass))
    .filter(ee.Filter.eq('relativeOrbitNumber_start', referenceOrbitNumber))
    .sort('system:time_start', false)
    .limit(multiImageMaxCount);
  
  var count = preEventCollection.size();
  
  var result = ee.Algorithms.If(
    count.gt(1),
    preEventCollection.mean(),
    ee.Algorithms.If(
      count.eq(1),
      preEventCollection.first(),
      loadSentinel1(imageId, eventDate)
    )
  );
  
  return ee.Image(result);
}

// Generate flood mask for a single event
function generateFloodMask(eventInfo) {
  var beforeImageId = eventInfo.sentinel1.before && eventInfo.sentinel1.before.imageId;
  var beforeDate = eventInfo.sentinel1.before && eventInfo.sentinel1.before.date;
  var afterImageId = eventInfo.sentinel1.after && eventInfo.sentinel1.after.imageId;
  var afterDate = eventInfo.sentinel1.after && eventInfo.sentinel1.after.date;
  
  if (!beforeImageId || !afterImageId) {
    return null;
  }
  
  // Load images
  var before = useMultiImageBaseline 
    ? loadSentinel1MultiImageBaseline(beforeImageId, eventInfo.event_date, beforeDate)
    : loadSentinel1(beforeImageId, beforeDate);
  var after = loadSentinel1(afterImageId, afterDate);
  
  if (!before || !after) {
    return null;
  }
  
  // Clip to AOI
  before = before.clip(focusAOI);
  after = after.clip(focusAOI);
  
  // Urban mask
  var worldCover = ee.Image('ESA/WorldCover/v200/2021').select('Map').rename('landcover');
  var worldCoverBuilt = worldCover.eq(FLOOD_DETECTION_CONFIG.worldCoverBuiltClass);
  var nlcdImpervious = ee.Image('USGS/NLCD_RELEASES/2021_REL/NLCD/2021')
    .select('impervious')
    .divide(100);
  var nlcdImperviousMask = nlcdImpervious
    .updateMask(nlcdImpervious.mask())
    .gte(FLOOD_DETECTION_CONFIG.nlcdImperviousThreshold);
  var urbanMask = worldCoverBuilt.or(nlcdImperviousMask);
  
  // Permanent water mask
  var jrcWater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence');
  var permanentWater = jrcWater.gte(FLOOD_DETECTION_CONFIG.jrcWaterOccurrenceThreshold).unmask(0).rename('perm_water');
  
  // Calculate change detection
  var beforeVV = toDbSafe(before, 'VV');
  var afterVV = toDbSafe(after, 'VV');
  
  // Smooth and calculate change
  var beforeVVSmoothed = beforeVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var afterVVSmoothed = afterVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var vvChangeSmoothed = afterVVSmoothed.subtract(beforeVVSmoothed);
  
  // Threshold: use fixed or adaptive (percentile of VV change over AOI, clamped)
  var thresholdVvVh = ee.Number(FLOOD_DETECTION_CONFIG.vvVhThreshold);
  var thresholdVvOnly = ee.Number(FLOOD_DETECTION_CONFIG.vvOnlyThreshold);
  
  // Check if VH exists
  var beforeBands = before.bandNames();
  var afterBands = after.bandNames();
  var beforeHasVH = beforeBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var afterHasVH = afterBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var bothHaveVH = beforeHasVH.and(afterHasVH);
  
  // Create VV mask
  var vvMask = vvChangeSmoothed.lt(thresholdVvVh).rename('flood');
  
  // Create VH mask if available
  var vhChangeSmoothed = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(toDbSafe(after, 'VH'))
      .focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')
      .subtract(ee.Image(toDbSafe(before, 'VH')).focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')),
    ee.Image.constant(0)
  );
  
  var vhMask = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(vhChangeSmoothed).lt(thresholdVvVh).rename('flood'),
    ee.Image.constant(0).mask(ee.Image.constant(0))
  );
  
  // Combine masks
  var floodMask = ee.Image(ee.Algorithms.If(
    bothHaveVH,
    vvMask.multiply(ee.Image(vhMask)),
    vvChangeSmoothed.lt(thresholdVvOnly)
  )).rename('flood');
  
  // Pre-urban mask for NOAA validation (threshold + permanent water + speckle; no urban)
  var floodMaskPreUrban = floodMask
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  floodMaskPreUrban = floodMaskPreUrban.updateMask(
    floodMaskPreUrban.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  
  // Apply urban and permanent water for hotspot mask
  floodMask = floodMask
    .updateMask(urbanMask)
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  
  // Remove small speckle
  floodMask = floodMask.updateMask(
    floodMask.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  
  return { mask: floodMask, maskPreUrban: floodMaskPreUrban };
}

// Same as generateFloodMask but uses scene-adaptive threshold (percentile of VV change, clamped)
function generateFloodMaskAdaptive(eventInfo) {
  var beforeImageId = eventInfo.sentinel1.before && eventInfo.sentinel1.before.imageId;
  var beforeDate = eventInfo.sentinel1.before && eventInfo.sentinel1.before.date;
  var afterImageId = eventInfo.sentinel1.after && eventInfo.sentinel1.after.imageId;
  var afterDate = eventInfo.sentinel1.after && eventInfo.sentinel1.after.date;
  
  if (!beforeImageId || !afterImageId) {
    return null;
  }
  
  var before = useMultiImageBaseline 
    ? loadSentinel1MultiImageBaseline(beforeImageId, eventInfo.event_date, beforeDate)
    : loadSentinel1(beforeImageId, beforeDate);
  var after = loadSentinel1(afterImageId, afterDate);
  
  if (!before || !after) {
    return null;
  }
  
  before = before.clip(focusAOI);
  after = after.clip(focusAOI);
  
  var worldCover = ee.Image('ESA/WorldCover/v200/2021').select('Map').rename('landcover');
  var worldCoverBuilt = worldCover.eq(FLOOD_DETECTION_CONFIG.worldCoverBuiltClass);
  var nlcdImpervious = ee.Image('USGS/NLCD_RELEASES/2021_REL/NLCD/2021')
    .select('impervious')
    .divide(100);
  var nlcdImperviousMask = nlcdImpervious
    .updateMask(nlcdImpervious.mask())
    .gte(FLOOD_DETECTION_CONFIG.nlcdImperviousThreshold);
  var urbanMask = worldCoverBuilt.or(nlcdImperviousMask);
  
  var jrcWater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence');
  var permanentWater = jrcWater.gte(FLOOD_DETECTION_CONFIG.jrcWaterOccurrenceThreshold).unmask(0).rename('perm_water');
  
  var beforeVV = toDbSafe(before, 'VV');
  var afterVV = toDbSafe(after, 'VV');
  var beforeVVSmoothed = beforeVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var afterVVSmoothed = afterVV.focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters');
  var vvChangeSmoothed = afterVVSmoothed.subtract(beforeVVSmoothed);
  
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
  var thresholdVvVh = adaptiveThreshold;
  var thresholdVvOnly = adaptiveThreshold;
  
  var beforeBands = before.bandNames();
  var afterBands = after.bandNames();
  var beforeHasVH = beforeBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var afterHasVH = afterBands.filter(ee.Filter.eq('item', 'VH')).size().gt(0);
  var bothHaveVH = beforeHasVH.and(afterHasVH);
  
  var vvMask = vvChangeSmoothed.lt(thresholdVvVh).rename('flood');
  var vhChangeSmoothed = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(toDbSafe(after, 'VH'))
      .focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')
      .subtract(ee.Image(toDbSafe(before, 'VH')).focal_mean(FLOOD_DETECTION_CONFIG.smoothRadius, 'circle', 'meters')),
    ee.Image.constant(0)
  );
  var vhMask = ee.Algorithms.If(
    bothHaveVH,
    ee.Image(vhChangeSmoothed).lt(thresholdVvVh).rename('flood'),
    ee.Image.constant(0).mask(ee.Image.constant(0))
  );
  var floodMask = ee.Image(ee.Algorithms.If(
    bothHaveVH,
    vvMask.multiply(ee.Image(vhMask)),
    vvChangeSmoothed.lt(thresholdVvOnly)
  )).rename('flood');
  
  var floodMaskPreUrban = floodMask
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  floodMaskPreUrban = floodMaskPreUrban.updateMask(
    floodMaskPreUrban.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  
  floodMask = floodMask
    .updateMask(urbanMask)
    .updateMask(permanentWater.not())
    .clip(focusAOI);
  floodMask = floodMask.updateMask(
    floodMask.connectedPixelCount(FLOOD_DETECTION_CONFIG.connectedNeighborhood, true)
      .gte(FLOOD_DETECTION_CONFIG.minConnectedPixels)
  );
  return { mask: floodMask, maskPreUrban: floodMaskPreUrban };
}

// Get NOAA validation locations for an event (same logic as visualize_flood_events.js)
function getValidationLocations(eventInfo) {
  var floodLocations = cityConfig[selectedCity].floodLocations || {};
  var eventId = eventInfo.id;
  var noaaIds = eventInfo.noaa_event_ids || '';
  var locations = [];
  if (floodLocations[eventId]) {
    locations = floodLocations[eventId];
  } else if (noaaIds.indexOf(';') >= 0) {
    noaaIds.split(';').forEach(function(id) {
      id = id.trim();
      if (floodLocations[id]) {
        locations = locations.concat(floodLocations[id]);
      }
    });
  } else {
    var checkId = noaaIds.trim();
    if (floodLocations[checkId]) {
      locations = floodLocations[checkId];
    }
  }
  return locations;
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

var focusAOI = buildFocusAOI(selectedCity);
Map.clear();
Map.centerObject(focusAOI, cityConfig[selectedCity].centerZoom);

var allEvents = eventsByCity[selectedCity];
if (!allEvents || allEvents.length === 0) {
  throw new Error('No events found for city: ' + selectedCity);
}

// Filter out control events (noaa_event_ids === 'none' or noaa_event_count === '0')
var floodEvents = allEvents.filter(function(event) {
  return event.noaa_event_ids !== 'none' && parseInt(event.noaa_event_count) > 0;
});

print('City:', selectedCity);
print('Total events:', allEvents.length);
print('Flood events (excluding control):', floodEvents.length);
print('Threshold mode:', useAdaptiveThreshold ? 'adaptive (percentile, clamped)' : 'fixed dB');

// Generate flood masks for all events (fixed or adaptive threshold per flag)
var maskList = [];
var preUrbanMaskList = [];
var eventIndexForMask = [];
for (var i = 0; i < floodEvents.length; i++) {
  var result = useAdaptiveThreshold
    ? generateFloodMaskAdaptive(floodEvents[i])
    : generateFloodMask(floodEvents[i]);
  if (result !== null) {
    maskList.push(result.mask);
    preUrbanMaskList.push(result.maskPreUrban);
    eventIndexForMask.push(i);
  }
}

print('Events with valid flood masks:', maskList.length);

// Build aggregate flood map (pre-urban): pixel = 1 if any event had flood there. Validate all NOAA points against this single map.
var aggregateValidationMask = ee.ImageCollection.fromImages(preUrbanMaskList).sum().gte(1).rename('flood');

// Build per-event list (for table) and merge all points for map-based validation
var validationFeatures = [];
var allPoints = ee.FeatureCollection([]);
for (var j = 0; j < preUrbanMaskList.length; j++) {
  var idx = eventIndexForMask[j];
  var ev = floodEvents[idx];
  var locs = getValidationLocations(ev);
  var pointsFC = ee.FeatureCollection(locs.map(function(loc) {
    return ee.Feature(ee.Geometry.Point([loc.lon, loc.lat]));
  }));
  validationFeatures.push(ee.Feature(null, {
    eventId: ev.id,
    label: ev.label,
    points: pointsFC
  }));
  allPoints = allPoints.merge(pointsFC);
}
allPoints = allPoints.filterBounds(focusAOI);

// Per-event stats: each event's points checked against the aggregate map (for table)
function addValidationStats(f) {
  var points = ee.FeatureCollection(f.get('points'));
  var pointsInAOI = points.filterBounds(focusAOI);
  var total = pointsInAOI.size();
  function hitRateAtBuffer(bufferM) {
    var withBuffer = pointsInAOI.map(function(pt) {
      var buf = pt.geometry().buffer(bufferM);
      var maxVal = aggregateValidationMask.reduceRegion({
        geometry: buf,
        reducer: ee.Reducer.max(),
        scale: 100,
        bestEffort: true
      }).get('flood');
      return pt.set('flood_max', maxVal);
    });
    var withData = withBuffer.filter(ee.Filter.notNull(['flood_max']));
    var n = withData.size();
    var hits = withData.filter(ee.Filter.gte('flood_max', 1)).size();
    var pct = ee.Number(hits).divide(ee.Number(n).max(1)).multiply(100);
    return { total: n, hits: hits, pct: pct };
  }
  var r500 = hitRateAtBuffer(500);
  var r1000 = hitRateAtBuffer(1000);
  return f.set({
    total: r500.total,
    hits500: r500.hits,
    pct500: r500.pct,
    hits1000: r1000.hits,
    pct1000: r1000.pct
  });
}

var validationFC = ee.FeatureCollection(validationFeatures).map(addValidationStats);

// Validation against aggregate map: sample at each point (500 m and 1000 m buffers)
var pointsWithHits = allPoints.map(function(pt) {
  var v500 = aggregateValidationMask.reduceRegion({
    geometry: pt.geometry().buffer(500),
    reducer: ee.Reducer.max(),
    scale: 100,
    bestEffort: true
  }).get('flood');
  var v1000 = aggregateValidationMask.reduceRegion({
    geometry: pt.geometry().buffer(1000),
    reducer: ee.Reducer.max(),
    scale: 100,
    bestEffort: true
  }).get('flood');
  return pt.set({
    hit500: ee.Number(v500).gte(1).toInt(),
    hit1000: ee.Number(v1000).gte(1).toInt()
  });
});
var totalCount = pointsWithHits.size();
var sum500Result = pointsWithHits.reduceColumns(ee.Reducer.sum(), ['hit500']);
var sum1000Result = pointsWithHits.reduceColumns(ee.Reducer.sum(), ['hit1000']);
// Flood pixel % over AOI (for tuning: balance hit rate vs over-detection)
var floodPixelSum = aggregateValidationMask.unmask(0).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: focusAOI,
  scale: 100,
  bestEffort: true
}).get('flood');
var totalPixelCount = ee.Image.constant(1).reduceRegion({
  reducer: ee.Reducer.count(),
  geometry: focusAOI,
  scale: 100,
  bestEffort: true
}).get('constant');
var summaryDict = ee.Dictionary({
  total: totalCount,
  sum500: sum500Result.get('sum'),
  sum1000: sum1000Result.get('sum'),
  sumFlood: floodPixelSum,
  totalPixels: totalPixelCount
});
print('Validation against aggregate flood map (all events, pre-urban mask):');
summaryDict.evaluate(function(s) {
  var tot = s.total;
  var totalPx = s.totalPixels || 1;
  var floodPx = s.sumFlood || 0;
  var pctFlood = totalPx > 0 ? Math.round(100 * floodPx / totalPx) : 0;
  if (tot > 0) {
    var pct500 = Math.round(100 * (s.sum500 || 0) / tot);
    var pct1000 = Math.round(100 * (s.sum1000 || 0) / tot);
    print('  Total NOAA points in AOI: ' + tot);
    print('  Flood pixels: ' + floodPx + ' / ' + totalPx + ' = ' + pctFlood + '% of AOI');
    print('  500 m:  ' + (s.sum500 || 0) + '/' + tot + ' = ' + pct500 + '%');
    print('  1000 m: ' + (s.sum1000 || 0) + '/' + tot + ' = ' + pct1000 + '%');
  } else {
    print('  Flood pixels: ' + floodPx + ' / ' + totalPx + ' = ' + pctFlood + '% of AOI');
    print('  No NOAA points inside AOI.');
  }
  print('');
});

// Per-event table (same map; breakdown by event)
print('NOAA point validation — per event (same aggregate map):');
validationFC.evaluate(function(result) {
  if (result.features && result.features.length > 0) {
    var pad = function(s, n) {
      s = String(s);
      while (s.length < n) s += ' ';
      return s;
    };
    var repeatStr = function(ch, n) {
      var out = '';
      for (var i = 0; i < n; i++) out += ch;
      return out;
    };
    var maxLabel = 0;
    result.features.forEach(function(f) {
      var len = (f.properties.label || '').length;
      if (len > maxLabel) maxLabel = len;
    });
    maxLabel = Math.min(maxLabel + 2, 52);
    print('');
    print('  ' + pad('Event', maxLabel) + '  pts   ' + pad('500 m', 14) + '   ' + pad('1000 m', 14));
    print('  ' + repeatStr('-', maxLabel) + '  ---   ' + repeatStr('-', 14) + '   ' + repeatStr('-', 14));
    result.features.forEach(function(f) {
      var p = f.properties;
      var total = p.total !== undefined ? p.total : 0;
      var label = (p.label || '').substring(0, 50);
      label = pad(label, maxLabel);
      var s500 = total === 0 ? '—' : p.hits500 + '/' + total + ' = ' + (p.pct500 != null ? Math.round(p.pct500) : 0) + '%';
      var s1000 = total === 0 ? '—' : p.hits1000 + '/' + total + ' = ' + (p.pct1000 != null ? Math.round(p.pct1000) : 0) + '%';
      var ptsStr = pad('', 3 - String(total).length) + total;
      print('  ' + label + '  ' + ptsStr + '   ' + pad(s500, 14) + '   ' + pad(s1000, 14));
    });
    print('');
  }
});

// Aggregate masks by summing (each mask is 1 for flood, 0 for no flood)
// Result: frequency map showing how many events detected flooding at each pixel
var frequencyMap = ee.ImageCollection.fromImages(maskList).sum().rename('frequency');

// Apply discrete color mapping
// 0 = transparent (masked), 1 = orange, 2-3 = red, 4+ = dark red
// Use expression to map frequency values to color indices
var hotspotMap = frequencyMap.expression(
  '(freq == 0) ? 0 : ' +  // 0 = transparent (will be masked)
  '(freq == 1) ? 1 : ' +  // 1 = orange
  '(freq >= 2 && freq <= 3) ? 2 : ' +  // 2-3 = red
  '(freq >= 4) ? 3 : 0',  // 4+ = dark red
  {freq: frequencyMap}
).rename('hotspot_class');

// Mask out zeros (no detections)
hotspotMap = hotspotMap.updateMask(hotspotMap.gt(0));

// Color palette: [orange, red, dark red]
var hotspotPalette = ['FF9800', 'FF5252', 'D32F2F'];

// Add hotspot map to map
Map.addLayer(
  hotspotMap,
  {
    min: 1,
    max: 3,
    palette: hotspotPalette,
    opacity: 0.7
  },
  'Flood Hotspot Map (' + selectedCity + ')'
);

// Add AOI (just box outline — line only, no fill)
var aoiOutline = ee.Geometry.LineString(focusAOI.coordinates().get(0));
Map.addLayer(aoiOutline, {color: 'red'}, 'AOI', true);

// Print statistics
var maxFrequency = frequencyMap.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: focusAOI,
  scale: 100,
  bestEffort: true
}).get('frequency');

print('Hotspot Statistics:');
print('  Events aggregated:', maskList.length);
print('  Max frequency (events detecting flood at same pixel):', maxFrequency);

// Calculate area statistics
var frequencyStats = frequencyMap.reduceRegion({
  reducer: ee.Reducer.histogram().combine({
    reducer2: ee.Reducer.count(),
    sharedInputs: true
  }),
  geometry: focusAOI,
  scale: 100,
  bestEffort: true
});

print('Frequency distribution:', frequencyStats);

