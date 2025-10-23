# Flood Hotspot Analysis for Raleigh, NC

## Project Overview
This project analyzes flood hotspots in Raleigh, NC using multi-sensor satellite data (Sentinel-1 SAR and Sentinel-2 optical) combined with ground-based observations and historical flood data.

## Project Structure

### Data Organization
- `data/raw/` - Original datasets (NOAA storm events, USGS gauge data, Sentinel imagery)
- `data/processed/` - Processed and calibrated datasets
- `data/external/` - Reference data and ground truth

### Code Organization
- `code/data_collection/` - Scripts for downloading and organizing data
- `code/preprocessing/` - Image calibration, filtering, and alignment
- `code/flood_mapping/` - Flood detection and mapping algorithms
- `code/hotspot_analysis/` - Frequency and intensity analysis
- `code/validation/` - Accuracy assessment and validation
- `code/utils/` - Utility functions and helper scripts

### Results
- `results/maps/` - Generated flood maps and hotspot visualizations
- `results/plots/` - Analysis plots and time series
- `results/statistics/` - Quantitative analysis results
- `results/validation/` - Validation reports and accuracy metrics

### Documentation
- `docs/` - Project documentation, reports, and references
- `notebooks/` - Jupyter notebooks for exploratory analysis
- `config/` - Configuration files and parameters

## Methodology
1. **Event Selection**: Identify major flood events (2010-2025) using NOAA storm reports and USGS Crabtree Creek gauge data
2. **Data Collection**: Acquire Sentinel-1 and Sentinel-2 scenes for dry and peak conditions
3. **Preprocessing**: Apply radiometric calibration, speckle filtering, and cloud masking
4. **Flood Mapping**: Compute change detection and apply thresholding
5. **Hotspot Analysis**: Overlay all events to create flood frequency and intensity maps
6. **Validation**: Compare with 911 flood incident data and ground observations

## Key Outputs
- Flood hotspot map for Raleigh, NC
- Flood frequency and intensity indices
- Validation against historical flood data
- Accuracy assessment reports

## Dependencies
- Python 3.8+
- GDAL/OGR
- Rasterio
- SentinelHub API
- USGS API
- NOAA API
