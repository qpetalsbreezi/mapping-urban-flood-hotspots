# Platform Registration and Setup Guide

⚠️ **URGENT UPDATE (2024)**: Copernicus SciHub URLs have changed. The ESA has migrated to new data portals. See updated URLs below.

## Overview
This guide provides step-by-step instructions for registering and setting up access to Google Earth Engine and Copernicus Open Access Hub.

---

## Part 1: Copernicus Open Access Hub (SciHub)

### ⚠️ **NEW URLs (2024 Update)**

Copernicus has migrated to new data portals. Try these URLs:

**Primary Option - New Copernicus Hub**:
- Go to: https://dataspace.copernicus.eu/
- Registration: https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/registrations

**Alternative - DIAS Access**:
- Sentinel Hub DIAS: https://dataspace.copernicus.eu/
- Requires free registration

**Backup - Old SciHub (if reachable)**:
- https://scihub.copernicus.eu/ (old URL, may be deprecated)

### Registration Steps

1. **Navigate to Registration Page**
   - **NEW URL**: https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/registrations
   - Create a Copernicus account
   - Email verification required

2. **Fill Out Registration Form**
   - **Username**: Choose a unique username
   - **Password**: Create a strong password (save this!)
   - **Email**: Use your email
   - **Name**: Your full name
   - **Organization**: (Optional) Can list as "Student Research"

3. **Verify Email**
   - Check your email for verification link
   - Click link to activate account
   - Usually takes a few minutes

4. **Login**
   - Go to: https://scihub.copernicus.eu/
   - Login with your credentials

### Python Setup

Install the sentinelsat library:
```bash
pip install sentinelsat
```

Test your connection:
```python
from sentinelsat import SentinelAPI

api = SentinelAPI('your_username', 'your_password', 'https://scihub.copernicus.eu/')
print("Connected successfully!")
```

### Expected Timeline
- **Registration**: 5 minutes
- **Email verification**: 1-5 minutes
- **Setup complete**: Ready to use immediately

---

## Part 2: Google Earth Engine (GEE)

### Registration Steps

1. **Navigate to Sign-Up Page**
   - Go to: https://earthengine.google.com/signup/
   - Or visit: https://earthengine.google.com/ and click "Get Started"

2. **Sign In with Google Account**
   - Use your Google account (or create one)
   - Recommended: Use your personal Gmail account
   - For students: School email if it uses Google

3. **Fill Out Application Form**

   **Personal Information**:
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Organization**: List as "Independent Researcher" or "Student"
   - **Department**: (Optional) Leave blank or "Research"
   - **Country**: United States
   - **Email**: Use your primary email

   **Project Information**:
   - **Project Name**: "Flood Hotspot Analysis using Sentinel Imagery"
   - **Institution**: (Optional) Your school name
   - **Are you funded by Google Earth Engine for Research Credits?**: No
   - **What organization/agency funds your work?**: Self-funded / Student Project

   **Usage Information**:
   - **How will you use Google Earth Engine?**: 
     - ☑ Scientific/Research use
   - **Subject Area**: 
     - Select: "Environmental/Climate Science" or "Remote Sensing"
   - **Brief Description** (2-3 sentences):
     ```
     I am conducting a science fair project to map flood hotspots in 
     Raleigh, NC and Houston, TX using Sentinel-1 SAR and Sentinel-2 
     optical satellite imagery. The project will analyze historical 
     flood events (2010-2025) to identify recurring flood-prone areas 
     and assess the relationship between urbanization and flood risk.
     ```

4. **Review and Submit**
   - Check all information is correct
   - Read and accept the Terms of Service
   - Click "Submit"

### Application Review

**Expected Timeline**:
- **Review Time**: 1-3 business days (usually approved within 24 hours)
- **Notification**: You'll receive an email when approved
- **Approval Rate**: ~95% for research applications

**If Approved**:
- You'll receive an email: "Welcome to Google Earth Engine!"
- Can start using immediately

**If Not Approved** (rare):
- Usually happens if application is incomplete
- Can reapply with more detail

### Python Setup (After Approval)

1. **Install Earth Engine Python API**:
```bash
pip install earthengine-api
```

2. **Authenticate**:
```bash
earthengine authenticate
```
This opens a browser for Google authentication - follow the prompts.

3. **Initialize and Test**:
```python
import ee

try:
    ee.Initialize()
    print("✓ Google Earth Engine initialized successfully!")
except Exception as e:
    print(f"✗ Error: {e}")
```

### Troubleshooting GEE Registration

**Issue: "Access Denied" immediately**
- **Solution**: You may need to wait for approval (even if it says access denied, check email)

**Issue: Can't find sign-up page**
- **Solution**: Try: https://earthengine.google.com/signup/

**Issue: Email verification not received**
- **Solution**: Check spam folder, try resending

---

## Part 3: Alternative - Microsoft Planetary Computer

If GEE application is delayed or denied:

1. **Go to**: https://planetarycomputer.microsoft.com/account/request

2. **Sign in**: Use Microsoft account (Hotmail, Outlook, etc.)

3. **Request Access**: Usually approved within hours

4. **Python Setup**:
```bash
pip install planetary-computer pystac-client
```

```python
import planetary_computer
import pystac_client

catalog = pystac_client.Client.open(
    "https://planetarycomputer.microsoft.com/api/stac/v1",
    modifier=planetary_computer.sign_inplace
)
print("Connected!")
```

---

## Part 4: Testing Data Access

Once both platforms are set up, test with this quick script:

### Test Copernicus SciHub:
```python
from sentinelsat import SentinelAPI

# Replace with your credentials
api = SentinelAPI('username', 'password', 'https://scihub.copernicus.eu/')

# Search for a test scene
products = api.query(
    area='POINT(-78.6382 35.7796)',  # Raleigh coordinates
    date=('20160701', '20160731'),   # July 2016
    platformname='Sentinel-2',
    cloudcoverpercentage=(0, 10)
)

print(f"Found {len(products)} scenes")
```

### Test Google Earth Engine:
```python
import ee

ee.Initialize()

# Test access to Sentinel-1
collection = ee.ImageCollection('COPERNICUS/S1_GRD')
print(f"✓ Sentintel-1 collection accessible")
print(f"Total images: {collection.size().getInfo()}")

# Test access to Sentinel-2
collection2 = ee.ImageCollection('COPERNICUS/S2_SR')
print(f"✓ Sentinel-2 collection accessible")
```

---

## Checklist

### Copernicus SciHub
- [ ] Registered at https://scihub.copernicus.eu/dhus/#/self-registration
- [ ] Verified email
- [ ] Can login to web interface
- [ ] Installed `sentinelsat` library
- [ ] Tested Python connection

### Google Earth Engine
- [ ] Submitted application at https://earthengine.google.com/signup/
- [ ] Received approval email
- [ ] Installed `earthengine-api` library
- [ ] Ran `earthengine authenticate`
- [ ] Tested Python initialization

### Both Platforms
- [ ] Credentials saved securely
- [ ] Python scripts tested successfully
- [ ] Ready to download satellite data

---

## Next Steps After Registration

1. **Start with GEE** (if approved): Quick data discovery
2. **Use SciHub** (always available): Official downloads
3. **Download test scene** from each platform
4. **Compare data quality** before bulk download
5. **Proceed with full acquisition** for 18 flood events

---

## Important Notes

- **Keep credentials secure**: Never commit passwords to git
- **Storage requirements**: ~50-60 GB for all 18 events
- **Download time**: Estimate 2-3 weeks for all data
- **Internet speed**: Faster internet = faster downloads

---

**Need Help?**
- Copernicus Support: https://scihub.copernicus.eu/userguide/WebHome
- GEE Documentation: https://developers.google.com/earth-engine
- Issues with registration? Check the troubleshooting sections above.

**Last Updated**: Based on current platform requirements (2024)
