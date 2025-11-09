#!/usr/bin/env python3
"""Download the April 2017 Raleigh flood Sentinel-1 scenes via GEE."""

from __future__ import annotations

from datetime import datetime, timedelta
import json
from pathlib import Path

import ee

PROJECT_ROOT = Path(__file__).resolve().parents[2]
AOI_PATH = PROJECT_ROOT / "data" / "raleigh_aoi.json"


def initialize_gee() -> bool:
    """Initialize Google Earth Engine for the configured project."""
    try:
        ee.Initialize(project="science-project-1-394520")
        print("✅ Google Earth Engine initialized successfully")
        return True
    except Exception as exc:  # pylint: disable=broad-except
        print(f"❌ Failed to initialize GEE: {exc}")
        return False


def load_rectangle_bounds(geojson_path: Path) -> list[float]:
    """Return [west, south, east, north] bounds derived from the AOI GeoJSON."""
    with geojson_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    feature = data["features"][0]
    geometry = feature["geometry"]
    coords = geometry["coordinates"]

    if geometry["type"] == "LineString":
        xs = [pt[0] for pt in coords]
        ys = [pt[1] for pt in coords]
    elif geometry["type"] == "Polygon":
        ring = coords[0]
        xs = [pt[0] for pt in ring]
        ys = [pt[1] for pt in ring]
    else:
        raise ValueError(f"Unsupported AOI geometry type: {geometry['type']}")

    return [min(xs), min(ys), max(xs), max(ys)]


def download_sentinel1_data(
    city: str,
    before_date: str,
    after_date: str,
    aoi_bounds: list[float],
):
    """Launch Google Drive exports for the specified before/after dates."""

    print(f"DOWNLOADING SENTINEL-1 DATA FOR {city.upper()}")
    print("=" * 50)

    aoi = ee.Geometry.Rectangle(aoi_bounds)

    before_collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterDate(
            before_date,
            (datetime.strptime(before_date, "%Y-%m-%d") + timedelta(days=1)).strftime(
                "%Y-%m-%d"
            ),
        )
        .filterBounds(aoi)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.eq("transmitterReceiverPolarisation", ["VV", "VH"]))
    )

    after_collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterDate(
            after_date,
            (datetime.strptime(after_date, "%Y-%m-%d") + timedelta(days=1)).strftime(
                "%Y-%m-%d"
            ),
        )
        .filterBounds(aoi)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .filter(ee.Filter.eq("transmitterReceiverPolarisation", ["VV", "VH"]))
    )

    print(f"Found {before_collection.size().getInfo()} before images")
    print(f"Found {after_collection.size().getInfo()} after images")

    before_image = before_collection.first()
    after_image = after_collection.first()

    if before_image is None:
        print(f"❌ No before image found for {before_date}")
        return None

    if after_image is None:
        print(f"❌ No after image found for {after_date}")
        return None

    print("✅ Found both images")
    print("\nExporting to Google Drive...")

    before_task = ee.batch.Export.image.toDrive(
        image=before_image,
        description=f"{city.lower()}_before_flood",
        folder="flood_data",
        region=aoi,
        scale=30,
        crs="EPSG:4326",
        maxPixels=1e9,
    )

    after_task = ee.batch.Export.image.toDrive(
        image=after_image,
        description=f"{city.lower()}_after_flood",
        folder="flood_data",
        region=aoi,
        scale=30,
        crs="EPSG:4326",
        maxPixels=1e9,
    )

    before_task.start()
    after_task.start()

    print("✅ Export tasks started!")
    print("\nCheck your Google Drive 'flood_data' folder for:")
    print(f"- {city.lower()}_before_flood")
    print(f"- {city.lower()}_after_flood")

    return {
        "before_task": before_task,
        "after_task": after_task,
        "before_image": before_image,
        "after_image": after_image,
    }


def main():
    """Download the April 2017 Raleigh before/after images."""
    print("GOOGLE EARTH ENGINE DATA DOWNLOAD")
    print("=" * 40)

    if not initialize_gee():
        return

    print("\nDOWNLOADING RALEIGH APRIL 2017 FLOOD EVENT")
    raleigh_aoi = load_rectangle_bounds(AOI_PATH)

    result = download_sentinel1_data(
        city="Raleigh",
        before_date="2017-04-21",
        after_date="2017-05-03",
        aoi_bounds=raleigh_aoi,
    )

    if result:
        print("\n🎉 Data download tasks launched!")
        print("\nNext steps:")
        print("1. Monitor the Tasks tab in the GEE Code Editor or `earthengine task list`.")
        print("2. Download the GeoTIFFs from Google Drive once exports finish.")
        print("3. Move the files into `data/processed/raleigh/` for analysis.")
    else:
        print("\n❌ Download failed")


if __name__ == "__main__":
    main()

