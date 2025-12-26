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
var selectedCity = 'raleigh'; // 'raleigh' or 'houston'
var selectedEventIndex = 1;   // 1-based index within the chosen city
var opticalWindowDays = 10;

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
      [-95.6, 29.6],
      [-95.1, 29.6],
      [-95.1, 29.9],
      [-95.6, 29.9],
      [-95.6, 29.6]
    ],
    focusBuffer: -7000,
    centerZoom: 11,
    highlightBoxes: [],
    floodLocations: {}
  }
};

// Placeholder; replaced below with curated events per city.
var eventsByCity = {
  "raleigh": [
    {
      "id": "755610",
      "label": "Raleigh flood 2018-05-21",
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
        "after": {
          "date": "2018-05-24",
          "imageId": "COPERNICUS/S2_SR/20180524T160231_20180524T161104_T17SQV",
          "validFraction": 0.431
        }
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
      "id": "775032",
      "label": "Raleigh flood 2018-07-06",
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
      "id": "775034",
      "label": "Raleigh flood 2018-07-06",
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
      "id": "775037",
      "label": "Raleigh flood 2018-07-06",
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
      "id": "775029",
      "label": "Raleigh flood 2018-07-07",
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
      "id": "775031",
      "label": "Raleigh flood 2018-07-07",
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
        "after": {
          "date": "2024-05-29",
          "imageId": "COPERNICUS/S2_SR/20240529T154941_20240529T155815_T17SQV",
          "validFraction": 0.594
        }
      },
      "landsat": {
        "before": {
          "date": "2024-05-21",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_015035_20240521",
          "validFraction": 0.828
        },
        "after": {
          "date": "2024-05-28",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_016035_20240528",
          "validFraction": 0.702
        }
      }
    },
    {
      "id": "1208861",
      "label": "Raleigh flood 2024-08-03",
      "sentinel1": {
        "before": null,
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
    },
    {
      "id": "1208432",
      "label": "Raleigh flood 2024-08-04",
      "sentinel1": {
        "before": null,
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
      "sentinel1": {
        "before": null,
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
      "id": "604968",
      "label": "Houston flood 2015-10-31",
      "sentinel1": {
        "before": {
          "date": "2015-10-22",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20151022T122242_20151022T122312_008265_00BA50_0708"
        },
        "after": {
          "date": "2015-11-03",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20151103T122242_20151103T122312_008440_00BEDF_2FDA"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2015-10-22",
          "imageId": "COPERNICUS/S2_SR/20151022T170012_20151022T170014_T15RTP",
          "validFraction": 0.049
        },
        "after": null
      },
      "landsat": {
        "before": {
          "date": "2015-10-26",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20151026",
          "validFraction": 0.675
        },
        "after": {
          "date": "2015-11-02",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20151102",
          "validFraction": 0.021
        }
      }
    },
    {
      "id": "620705",
      "label": "Houston flood 2016-03-18",
      "sentinel1": {
        "before": {
          "date": "2016-03-14",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20160314T122234_20160314T122304_010365_00F5C2_BB20"
        },
        "after": {
          "date": "2016-03-21",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SSV_20160321T121433_20160321T121458_010467_00F895_08E0"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2016-03-13",
          "imageId": "COPERNICUS/S2_SR/20160313T171512_20160313T171515_T15RTN",
          "validFraction": 0.639
        },
        "after": {
          "date": "2016-03-20",
          "imageId": "COPERNICUS/S2_SR/20160320T165302_20160320T170440_T15RTN",
          "validFraction": 0.539
        }
      },
      "landsat": {
        "before": null,
        "after": {
          "date": "2016-03-18",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20160318",
          "validFraction": 0.141
        }
      }
    },
    {
      "id": "675235",
      "label": "Houston flood 2017-01-18",
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
      "id": "675098",
      "label": "Houston flood 2017-01-20",
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
        "before": null,
        "after": {
          "date": "2017-01-24",
          "imageId": "COPERNICUS/S2_SR/20170124T165551_20170124T165554_T15RTN",
          "validFraction": 0.424
        }
      },
      "landsat": {
        "before": {
          "date": "2017-01-16",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20170116",
          "validFraction": 0.677
        },
        "after": {
          "date": "2017-01-23",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20170123",
          "validFraction": 0.26
        }
      }
    },
    {
      "id": "710731",
      "label": "Houston flood 2017-06-04",
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
        "after": {
          "date": "2017-06-06",
          "imageId": "COPERNICUS/S2_SR/20170606T171521_20170606T171521_T15RTP",
          "validFraction": 0.313
        }
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
      "id": "710726",
      "label": "Houston flood 2017-06-24",
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
        "after": {
          "date": "2017-06-26",
          "imageId": "COPERNICUS/S2_SR/20170626T171521_20170626T171518_T15RTP",
          "validFraction": 0.354
        }
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
      "id": "710727",
      "label": "Houston flood 2017-06-25",
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
        "after": {
          "date": "2017-06-26",
          "imageId": "COPERNICUS/S2_SR/20170626T171521_20170626T171518_T15RTP",
          "validFraction": 0.354
        }
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
      "id": "714368",
      "label": "Houston flood 2017-07-09",
      "sentinel1": {
        "before": {
          "date": "2017-06-30",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170630T002617_20170630T002642_017256_01CCBA_1392"
        },
        "after": {
          "date": "2017-07-12",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170712T002617_20170712T002642_017431_01D208_BF55"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2017-07-03",
          "imageId": "COPERNICUS/S2_SR/20170703T170521_20170703T170522_T15RTN",
          "validFraction": 0.365
        },
        "after": {
          "date": "2017-07-11",
          "imageId": "COPERNICUS/S2_SR/20170711T171519_20170711T171520_T15RTP",
          "validFraction": 0.312
        }
      },
      "landsat": {
        "before": {
          "date": "2017-07-02",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20170702",
          "validFraction": 0.107
        },
        "after": {
          "date": "2017-07-11",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20170711",
          "validFraction": 0.493
        }
      }
    },
    {
      "id": "720858",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "720860",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "720861",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "720867",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "720869",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "720873",
      "label": "Houston flood 2017-08-26",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "721084",
      "label": "Houston flood 2017-08-27",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "721085",
      "label": "Houston flood 2017-08-27",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "721091",
      "label": "Houston flood 2017-08-27",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
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
        "after": {
          "date": "2017-08-30",
          "imageId": "COPERNICUS/S2_SR/20170830T165849_20170830T170423_T15RTN",
          "validFraction": 0.032
        }
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
      "id": "721096",
      "label": "Houston flood 2017-08-28",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
        },
        "after": {
          "date": "2017-08-29",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170829T002620_20170829T002645_018131_01E74D_D734"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2017-08-17",
          "imageId": "COPERNICUS/S2_SR/20170817T164859_20170817T165603_T15RTN",
          "validFraction": 0.446
        },
        "after": {
          "date": "2017-09-01",
          "imageId": "COPERNICUS/S2_SR/20170901T170521_20170901T170523_T15RTN",
          "validFraction": 0.324
        }
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
      "id": "721101",
      "label": "Houston flood 2017-08-28",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
        },
        "after": {
          "date": "2017-08-29",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170829T002620_20170829T002645_018131_01E74D_D734"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2017-08-17",
          "imageId": "COPERNICUS/S2_SR/20170817T164859_20170817T165603_T15RTN",
          "validFraction": 0.446
        },
        "after": {
          "date": "2017-09-01",
          "imageId": "COPERNICUS/S2_SR/20170901T170521_20170901T170523_T15RTN",
          "validFraction": 0.324
        }
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
      "id": "721136",
      "label": "Houston flood 2017-08-29",
      "sentinel1": {
        "before": {
          "date": "2017-08-24",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170824T122248_20170824T122318_018065_01E54E_A87C"
        },
        "after": {
          "date": "2017-08-29",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170829T002620_20170829T002645_018131_01E74D_D734"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2017-08-17",
          "imageId": "COPERNICUS/S2_SR/20170817T164859_20170817T165603_T15RTN",
          "validFraction": 0.446
        },
        "after": {
          "date": "2017-09-01",
          "imageId": "COPERNICUS/S2_SR/20170901T170521_20170901T170523_T15RTN",
          "validFraction": 0.324
        }
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
      "id": "757973",
      "label": "Houston flood 2018-07-04",
      "sentinel1": {
        "before": {
          "date": "2018-06-25",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180625T002623_20180625T002648_022506_027003_2E1D"
        },
        "after": {
          "date": "2018-07-07",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180707T002623_20180707T002648_022681_02751D_506E"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2018-07-01",
          "imageId": "COPERNICUS/S2_SR/20180701T165851_20180701T171438_T15RTN",
          "validFraction": 0.577
        },
        "after": {
          "date": "2018-07-06",
          "imageId": "COPERNICUS/S2_SR/20180706T165849_20180706T170955_T15RTN",
          "validFraction": 0.63
        }
      },
      "landsat": {
        "before": {
          "date": "2018-06-28",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20180628",
          "validFraction": 0.626
        },
        "after": {
          "date": "2018-07-05",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20180705",
          "validFraction": 0.14
        }
      }
    },
    {
      "id": "797758",
      "label": "Houston flood 2018-12-08",
      "sentinel1": {
        "before": {
          "date": "2018-12-05",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20181205T122255_20181205T122325_024890_02BDBF_F260"
        },
        "after": {
          "date": "2018-12-11",
          "imageId": "COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20181211T122213_20181211T122243_013994_019F7E_D44C"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2018-12-03",
          "imageId": "COPERNICUS/S2_SR/20181203T170659_20181203T170958_T15RTN",
          "validFraction": 0.686
        },
        "after": {
          "date": "2018-12-10",
          "imageId": "COPERNICUS/S2_SR/20181210T165659_20181210T165847_T15RTN",
          "validFraction": 0.554
        }
      },
      "landsat": {
        "before": {
          "date": "2018-12-05",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20181205",
          "validFraction": 0.998
        },
        "after": null
      }
    },
    {
      "id": "830461",
      "label": "Houston flood 2019-05-09",
      "sentinel1": {
        "before": {
          "date": "2019-05-04",
          "imageId": "COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20190504T122213_20190504T122242_016094_01E464_F28C"
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
      "id": "830464",
      "label": "Houston flood 2019-05-09",
      "sentinel1": {
        "before": {
          "date": "2019-05-04",
          "imageId": "COPERNICUS/S1_GRD/S1B_IW_GRDH_1SDV_20190504T122213_20190504T122242_016094_01E464_F28C"
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
      "id": "853617",
      "label": "Houston flood 2019-08-23",
      "sentinel1": {
        "before": {
          "date": "2019-08-14",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190814T001836_20190814T001901_028558_033ACC_2A62"
        },
        "after": {
          "date": "2019-08-26",
          "imageId": "COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20190826T001837_20190826T001902_028733_0340D4_1130"
        }
      },
      "sentinel2": {
        "before": {
          "date": "2019-08-15",
          "imageId": "COPERNICUS/S2_SR/20190815T165901_20190815T170855_T15RTP",
          "validFraction": 0.327
        },
        "after": {
          "date": "2019-08-27",
          "imageId": "COPERNICUS/S2_SR/20190827T164849_20190827T165942_T15RTN",
          "validFraction": 0.262
        }
      },
      "landsat": {
        "before": {
          "date": "2019-08-18",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_025039_20190818",
          "validFraction": 0.272
        },
        "after": {
          "date": "2019-08-25",
          "imageId": "LANDSAT/LC08/C02/T1_L2/LC08_026039_20190825",
          "validFraction": 0.127
        }
      }
    },
    {
      "id": "857803",
      "label": "Houston flood 2019-09-18",
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
        "after": {
          "date": "2019-09-21",
          "imageId": "COPERNICUS/S2_SR/20190921T165001_20190921T170157_T15RTN",
          "validFraction": 0.239
        }
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
      "id": "858108",
      "label": "Houston flood 2019-09-19",
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
        "after": {
          "date": "2019-09-21",
          "imageId": "COPERNICUS/S2_SR/20190921T165001_20190921T170157_T15RTN",
          "validFraction": 0.239
        }
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
      "id": "858116",
      "label": "Houston flood 2019-09-19",
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
        "after": {
          "date": "2019-09-21",
          "imageId": "COPERNICUS/S2_SR/20190921T165001_20190921T170157_T15RTN",
          "validFraction": 0.239
        }
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
      "id": "858117",
      "label": "Houston flood 2019-09-19",
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
        "after": {
          "date": "2019-09-21",
          "imageId": "COPERNICUS/S2_SR/20190921T165001_20190921T170157_T15RTN",
          "validFraction": 0.239
        }
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
      "id": "869176",
      "label": "Houston flood 2019-09-19",
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
        "after": {
          "date": "2019-09-21",
          "imageId": "COPERNICUS/S2_SR/20190921T165001_20190921T170157_T15RTN",
          "validFraction": 0.239
        }
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
        "after": {
          "date": "2020-06-27",
          "imageId": "COPERNICUS/S2_SR/20200627T164901_20200627T170048_T15RTP",
          "validFraction": 0.0
        }
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
          "date": "2021-06-25",
          "imageId": "COPERNICUS/S2_SR/20210625T165851_20210625T170701_T15RTN",
          "validFraction": 0.263
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
      "id": "1004355",
      "label": "Houston flood 2022-01-09",
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
        "after": {
          "date": "2022-01-13",
          "imageId": "COPERNICUS/S2_SR/20220113T165639_20220113T170031_T15RTN",
          "validFraction": 0.549
        }
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
      "id": "1004356",
      "label": "Houston flood 2022-01-09",
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
        "after": {
          "date": "2022-01-13",
          "imageId": "COPERNICUS/S2_SR/20220113T165639_20220113T170031_T15RTN",
          "validFraction": 0.549
        }
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
      "id": "1004366",
      "label": "Houston flood 2022-01-09",
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
        "after": {
          "date": "2022-01-13",
          "imageId": "COPERNICUS/S2_SR/20220113T165639_20220113T170031_T15RTN",
          "validFraction": 0.549
        }
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
      "id": "1004373",
      "label": "Houston flood 2022-01-09",
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
        "after": {
          "date": "2022-01-13",
          "imageId": "COPERNICUS/S2_SR/20220113T165639_20220113T170031_T15RTN",
          "validFraction": 0.549
        }
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
      "id": "1004376",
      "label": "Houston flood 2022-01-09",
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
        "after": {
          "date": "2022-01-13",
          "imageId": "COPERNICUS/S2_SR/20220113T165639_20220113T170031_T15RTN",
          "validFraction": 0.549
        }
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
  ]
};

// Helper to build AOI from config
function buildFocusAOI(cityKey) {
  var cfg = cityConfig[cityKey];
  var outer = ee.Geometry.Polygon([cfg.outerAOICoords]);
  return cfg.focusBuffer ? outer.buffer(cfg.focusBuffer).bounds() : outer;
}

var focusAOI = buildFocusAOI(selectedCity);
Map.clear();
Map.centerObject(focusAOI, cityConfig[selectedCity].centerZoom);

var events = eventsByCity[selectedCity];
if (!events || events.length === 0) {
  throw new Error('No curated events found for city: ' + selectedCity);
}

// Sentinel-1 visualization stretch (VV polarization)
var radarVis = {min: -20, max: 0};
var s2Vis = {bands: ['B4', 'B3', 'B2'], min: 0.04, max: 0.25};
var landsatVis = {bands: ['red', 'green', 'blue'], min: 0.03, max: 0.22};
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
function addFloodLocationMarkers(eventId) {
  var locations = (cityConfig[selectedCity].floodLocations || {})[eventId];
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
      color: '#ff9800', // orange to distinguish from flood mask
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
      color: '#ff9800',
      fillColor: '#ff9800',
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
    // Polarisation filter using listContains to avoid empty collections
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .first();
}

// Convert linear sigma0 to dB for easier interpretation
function toDb(img) {
  return ee.Image(img).log10().multiply(10);
}

// Safer dB conversion that guards against zeros and adds an optional linear preview.
function toDbSafe(img, bandName) {
  var band = ee.Image(img).select(bandName);
  var clipped = band.max(1e-6); // avoid log of zero
  return clipped.log10().multiply(10);
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
  var img = null;
  if (scene.imageId) {
    var prefix = 'COPERNICUS/S1_GRD/';
    var id = scene.imageId.indexOf(prefix) === 0 ? scene.imageId : prefix + scene.imageId;
    img = ee.Image(id);
  } else if (scene.date) {
    img = getSentinelImage(scene.date, nextDay(scene.date), region);
  }
  return img ? img.clip(region) : null;
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

// Urban reference mask (built-up OR >=20% impervious) for context
var worldCover = ee.Image('ESA/WorldCover/v200/2021').select('Map').rename('landcover');
var worldCoverBuilt = worldCover.eq(50); // WorldCover built class
var nlcdImpervious = ee.Image('USGS/NLCD_RELEASES/2021_REL/NLCD/2021')
  .select('impervious')
  .divide(100);
var nlcdImperviousMask = nlcdImpervious
  .updateMask(nlcdImpervious.mask())
  .gte(0.2); // >=20% impervious
var urbanMask = worldCoverBuilt.or(nlcdImperviousMask);

// Permanent water mask for reference (not applied to flood mask yet)
var jrcWater = ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence');
// Unmask to 0 so the mask doesn't disappear where JRC has nodata
var permanentWater = jrcWater.gte(50).unmask(0).rename('perm_water'); // occurrence >=50%

// Holder for the flood mask so we can overlay it last (above optical layers)
var floodMaskLayer = null;
// Sentinel-1 VV/VH in dB plus difference/ratio helpers for debugging flood signal
print('Has S1 before:', !!before, 'Has S1 after:', !!after);

// Log the actual S1 system IDs to verify correct scenes are loaded per event
if (before || after) {
  print('Loaded S1 image IDs', ee.Dictionary({
    before_id: before ? before.get('system:id') : 'none',
    after_id: after ? after.get('system:id') : 'none'
  }));
}

var beforeVV = before ? toDbSafe(before, 'VV') : null;
var afterVV = after ? toDbSafe(after, 'VV') : null;
var beforeVH = before && before.bandNames().contains('VH') ? toDbSafe(before, 'VH') : null;
var afterVH = after && after.bandNames().contains('VH') ? toDbSafe(after, 'VH') : null;

if (beforeVV) {
  Map.addLayer(beforeVV, radarVis, 'S1 VV dB Before ' + (eventInfo.sentinel1.before && eventInfo.sentinel1.before.date), false);
  Map.addLayer(before.select('VV'), {min: 0, max: 0.25}, 'S1 VV Linear Before (debug)', false);
} else {
  print('Warning: missing Sentinel-1 "before" scene.');
}

if (afterVV) {
  Map.addLayer(afterVV, radarVis, 'S1 VV dB After ' + (eventInfo.sentinel1.after && eventInfo.sentinel1.after.date), false);
  Map.addLayer(after.select('VV'), {min: 0, max: 0.25}, 'S1 VV Linear After (debug)', false);
} else {
  print('Warning: missing Sentinel-1 "after" scene!');
}

// Change layers to highlight flooding (negative = darker after)
if (beforeVV && afterVV) {
  var vvChange = afterVV.subtract(beforeVV);
  var changePalette = ['#0b4f6c', '#4f9cf6', '#d1d5db', '#fbbf24', '#b91c1c']; // blue → gray → red
  Map.addLayer(
    vvChange,
    {min: -4, max: 4, palette: changePalette},
    'S1 VV dB Change',
    true
  );

  // Smoothed change (basic speckle reduction) and flood mask
  var smoothRadius = 90; // meters
  var beforeVVSmoothed = beforeVV.focal_mean(smoothRadius, 'circle', 'meters');
  var afterVVSmoothed = afterVV.focal_mean(smoothRadius, 'circle', 'meters');
  var vvChangeSmoothed = afterVVSmoothed.subtract(beforeVVSmoothed);

  Map.addLayer(
    vvChangeSmoothed,
    {min: -3, max: 3, palette: changePalette},
    'S1 VV dB Change (smoothed)',
    false
  );

  // Flood mask: stricter threshold and VH confirmation when available
  var vvMask = vvChangeSmoothed.lt(-1.3);
  var vhMask = beforeVH && afterVH
    ? afterVH.focal_mean(smoothRadius, 'circle', 'meters')
        .subtract(beforeVH.focal_mean(smoothRadius, 'circle', 'meters'))
        .lt(-1.3)
    : null;
  var floodMask = vhMask ? vvMask.and(vhMask) : vvMask;

  // Keep only built/impervious pixels before cleaning speckle
  floodMask = floodMask.updateMask(urbanMask);

  // Drop permanent water pixels (JRC occurrence >=50%)
  floodMask = floodMask.updateMask(permanentWater.not());

  // Remove tiny speckle blobs (min 3 connected pixels)
  floodMask = floodMask.updateMask(floodMask.connectedPixelCount(8, true).gte(3));

  // Quick diagnostic: how many flood pixels inside focusAOI?
  var floodPixelCount = floodMask.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: focusAOI,
    scale: 20,
    bestEffort: true
  }).get('VV');
  print('Flood mask pixel count (VV pixels within focus AOI):', floodPixelCount);

  floodMaskLayer = floodMask.selfMask();

  var vvRatio = afterVV.subtract(beforeVV).divide(beforeVV.abs().max(1e-6));
  Map.addLayer(
    vvRatio,
    {min: -0.5, max: 0.5, palette: ['#0b4f6c', '#4f9cf6', '#d1d5db', '#fbbf24', '#b91c1c']},
    'S1 VV Rel Change',
    false
  );
}

if (beforeVH && afterVH) {
  Map.addLayer(beforeVH, radarVis, 'S1 VH dB Before', false);
  Map.addLayer(afterVH, radarVis, 'S1 VH dB After', false);
  var vhChange = afterVH.subtract(beforeVH);
  Map.addLayer(vhChange, {min: -4, max: 4, palette: changePalette}, 'S1 VH dB Change', false);
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

// Add flood mask last so it stays visible over optical/radar backdrops
if (floodMaskLayer) {
  var floodFill = floodMaskLayer.visualize({
    palette: ['#e60000'], // red fill
    opacity: 0.55
  });
  var floodOutline = floodMaskLayer
    .focal_max(40, 'circle', 'meters')
    .subtract(floodMaskLayer)
    .selfMask()
    .visualize({palette: ['#8b0000'], opacity: 0.9}); // darker red outline
  var floodVis = ee.ImageCollection([floodFill, floodOutline]).mosaic();
  Map.addLayer(floodVis, {}, 'S1 VV Flood Mask (< -1.3 dB)', true);
}

// Add known flood location markers from NOAA data
addFloodLocationMarkers(selectedEventId);
