"""Fetch FEMA NFHL SFHA polygons and point-in-zone checks (stdlib only)."""

from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterator, Optional

ROOT = Path(__file__).resolve().parents[2]
EXTERNAL_DIR = ROOT / "data/external"
NFHL_LAYER_URL = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)

CITY_AOIS = {
    "raleigh": {"xmin": -78.9, "ymin": 35.6, "xmax": -78.4, "ymax": 36.1},
    "houston": {"xmin": -95.95, "ymin": 29.45, "xmax": -94.9, "ymax": 30.2},
}


def fetch_sfha_geojson(city: str, cache: bool = True) -> dict[str, Any]:
    if city not in CITY_AOIS:
        raise ValueError(f"Unknown city: {city}")
    cache_path = EXTERNAL_DIR / f"nfhl_{city}_sfha.geojson"
    if cache and cache_path.is_file():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    bbox = CITY_AOIS[city]
    features: list[dict[str, Any]] = []
    offset = 0
    page_size = 500
    while True:
        params = {
            "where": "SFHA_TF='T'",
            "geometry": json.dumps({**bbox, "spatialReference": {"wkid": 4326}}),
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "outFields": "FLD_ZONE,SFHA_TF,ZONE_SUBTY",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
        }
        url = f"{NFHL_LAYER_URL}?{urllib.parse.urlencode(params)}"
        last_err: Optional[Exception] = None
        page: dict[str, Any] = {}
        for attempt in range(3):
            try:
                with urllib.request.urlopen(url, timeout=180) as resp:
                    page = json.load(resp)
                last_err = None
                break
            except Exception as exc:  # noqa: BLE001 — retry transient FEMA 500s
                last_err = exc
        if last_err is not None:
            raise RuntimeError(f"FEMA NFHL fetch failed at offset {offset}: {last_err}") from last_err
        batch = page.get("features", [])
        features.extend(batch)
        if len(batch) < page_size:
            break
        offset += len(batch)

    geojson = {"type": "FeatureCollection", "features": features}
    EXTERNAL_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(geojson), encoding="utf-8")
    return geojson


def _ring_contains(lon: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        intersects = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def _polygon_contains(lon: float, lat: float, coords: list[list[list[float]]]) -> bool:
    if not coords:
        return False
    if not _ring_contains(lon, lat, coords[0]):
        return False
    for hole in coords[1:]:
        if _ring_contains(lon, lat, hole):
            return False
    return True


def point_in_sfha(lon: float, lat: float, geojson: dict[str, Any]) -> bool:
    for feature in geojson.get("features", []):
        geom = feature.get("geometry") or {}
        gtype = geom.get("type")
        coords = geom.get("coordinates")
        if gtype == "Polygon":
            if _polygon_contains(lon, lat, coords):
                return True
        elif gtype == "MultiPolygon":
            for poly in coords:
                if _polygon_contains(lon, lat, poly):
                    return True
    return False


def iter_point_results(
    points: list[dict[str, Any]], geojson: dict[str, Any]
) -> Iterator[dict[str, Any]]:
    for pt in points:
        lon, lat = float(pt["lon"]), float(pt["lat"])
        yield {
            **pt,
            "in_sfha": point_in_sfha(lon, lat, geojson),
        }
