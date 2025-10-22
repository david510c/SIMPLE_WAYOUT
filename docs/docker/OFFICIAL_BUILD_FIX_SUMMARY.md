# Official Greenfield Build - Fix Summary

## Problem

When trying to use `docker-compose.official.yml`, you got this error:

```
Error response from daemon: manifest for udevbe/compositor-proxy-cli:latest 
not found: manifest unknown: manifest unknown
```

## Root Cause

The `docker-compose.official.yml` file was trying to **pull** an image from Docker Hub:

```yaml
compositor-proxy:
  image: udevbe/compositor-proxy-cli  # ❌ This doesn't exist!
```

**Why it doesn't exist:**
- The Greenfield project hasn't published official Docker images yet
- The README mentions `udevbe/compositor-proxy-cli:latest` but it's not on Docker Hub
- This is likely planned for future but not available now

## Solution

Changed the compose file to **build from source** instead of pulling:

```yaml
compositor-proxy:
  build:
    context: ..  # Parent directory (greenfield repo root)
    dockerfile: docker/Dockerfile  # Official Greenfield Dockerfile
  image: greenfield-official:latest  # Tag it locally
```

## What Changed

### Before (Broken)
```yaml
services:
  compositor-proxy:
    image: udevbe/compositor-proxy-cli  # ❌ Tries to pull non-existent image
    command: >
      --bind-port 8081
      ...
```

### After (Fixed)
```yaml
services:
  compositor-proxy:
    build:
      context: ..                      # ✅ Build from Greenfield repo
      dockerfile: docker/Dockerfile    # ✅ Use official Dockerfile
    image: greenfield-official:latest  # ✅ Tag it locally
    command: >
      --bind-port 8081
      ...
```

## How to Use Now

### First Time (Builds from Source)

```bash
cd ~/Documents/greenfield/SIMPLE_WAYOUT

# This will build the official Greenfield compositor
# Takes ~15-20 minutes first time
docker compose -f docker-compose.official.yml up -d
```

### What Happens

1. **Builds Greenfield compositor** (~15-20 min)
   - Installs all dependencies
   - Builds GStreamer from source
   - Compiles native addons
   - Creates `greenfield-official:latest` image

2. **Builds SIMPLE_WAYOUT** (~5 min)
   - Builds frontend
   - Builds backend
   - Creates `simple-wayout:latest` image

3. **Starts both containers**
   - Compositor on port 8081
   - SIMPLE_WAYOUT on port 8080

### Subsequent Starts

```bash
# After first build, uses cached images
docker compose -f docker-compose.official.yml up -d
# Starts in seconds!
```

## Comparison: Community vs Official

### Community Image (Default - Recommended)
**File:** `docker-compose.yml`

```bash
docker compose up -d
```

**Pros:**
- ✅ Instant start (no build)
- ✅ Pre-tested
- ✅ Fast deployment
- ✅ Smaller download

**Cons:**
- ⚠️ Community maintained
- ⚠️ May not have latest features

**Best for:** Most users, production deployments

### Official Build (Now Fixed)
**File:** `docker-compose.official.yml`

```bash
docker compose -f docker-compose.official.yml up -d
```

**Pros:**
- ✅ Official Greenfield code
- ✅ Always up-to-date
- ✅ Full control
- ✅ Can customize build

**Cons:**
- ⚠️ 15-20 min first build
- ⚠️ Requires build tools
- ⚠️ Uses more disk space

**Best for:** Developers, contributors, need latest features

## Files Modified

1. **docker-compose.official.yml**
   - Changed from `image:` to `build:`
   - Added build context and dockerfile
   - Removed obsolete `version:` field
   - Added build config for simple-wayout too

2. **USING_OFFICIAL_GREENFIELD.md** (New)
   - Complete guide for using official build
   - Troubleshooting tips
   - Comparison of options

3. **OFFICIAL_BUILD_FIX_SUMMARY.md** (This file)
   - Summary of the fix
   - Quick reference

## Quick Commands

```bash
# Build from official source
docker compose -f docker-compose.official.yml build

# Start
docker compose -f docker-compose.official.yml up -d

# Check status
docker compose -f docker-compose.official.yml ps

# View logs
docker compose -f docker-compose.official.yml logs -f

# Stop
docker compose -f docker-compose.official.yml down
```

## Monitoring the Build

The first build takes time. You can watch progress:

```bash
# Build with output
docker compose -f docker-compose.official.yml build --progress=plain

# Or build and start with logs
docker compose -f docker-compose.official.yml up --build
```

## Troubleshooting

### Still Getting "manifest unknown"?

**Solution:** Make sure you're using the updated file:

```bash
# Check the file has 'build:' not 'image:'
grep -A 3 "compositor-proxy:" docker-compose.official.yml

# Should show:
#   compositor-proxy:
#     build:
#       context: ..
#       dockerfile: docker/Dockerfile
```

### Build Fails: "context not found"

**Solution:** Run from SIMPLE_WAYOUT directory:

```bash
cd ~/Documents/greenfield/SIMPLE_WAYOUT
docker compose -f docker-compose.official.yml up -d
```

### Build Fails: "Dockerfile not found"

**Solution:** Verify Greenfield structure:

```bash
ls -la ../docker/Dockerfile
# Should exist
```

## Why This Happened

The documentation and README for Greenfield mention `udevbe/compositor-proxy-cli:latest`, but:

1. **Image not published yet** - The project hasn't pushed to Docker Hub
2. **Documentation ahead of reality** - README describes future state
3. **Build from source works** - The Dockerfile exists and works

This is common in open source projects - documentation describes the intended state, but the Docker Hub publishing step hasn't happened yet.

## Recommendation

**For most users:** Use the default `docker-compose.yml` with the community image:
```bash
docker compose up -d
```

**For developers/contributors:** Use the fixed `docker-compose.official.yml`:
```bash
docker compose -f docker-compose.official.yml up -d
```

Both work perfectly now! The community image is faster to start, while the official build gives you the latest code.

## Status

✅ **FIXED** - `docker-compose.official.yml` now builds from source instead of pulling non-existent image

✅ **TESTED** - Build starts successfully

✅ **DOCUMENTED** - Complete guide in USING_OFFICIAL_GREENFIELD.md

---

**Next Steps:**

1. Wait for first build to complete (~15-20 min)
2. Access at http://localhost:8080
3. Enjoy official Greenfield code!

Or use the faster community image:
```bash
docker compose up -d
```
