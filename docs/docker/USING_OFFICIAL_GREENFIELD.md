# Using Official Greenfield Image - Quick Guide

## What Was Wrong

The `docker-compose.official.yml` was trying to pull `udevbe/compositor-proxy-cli:latest` from Docker Hub, but this image doesn't exist yet (the Greenfield project hasn't published it).

## What Was Fixed

Changed from pulling a non-existent image to **building from source** using the official Greenfield Dockerfile.

**Before (broken):**
```yaml
compositor-proxy:
  image: udevbe/compositor-proxy-cli  # ❌ Doesn't exist
```

**After (fixed):**
```yaml
compositor-proxy:
  build:
    context: ..  # Parent directory (greenfield repo root)
    dockerfile: docker/Dockerfile  # Official Greenfield Dockerfile
  image: greenfield-official:latest  # Tag it locally
```

## How to Use

### First Time (Builds from Source)

```bash
cd SIMPLE_WAYOUT

# This will build the official Greenfield compositor from source
# Build time: ~15-20 minutes (one time)
docker compose -f docker-compose.official.yml up -d
```

**What happens:**
1. Builds official Greenfield compositor (~15-20 min)
2. Builds SIMPLE_WAYOUT (~5 min)
3. Starts both containers
4. Total: ~20-25 minutes first time

### Subsequent Starts

```bash
# After first build, starts instantly
docker compose -f docker-compose.official.yml up -d
```

**What happens:**
1. Uses cached images
2. Starts in seconds

## Comparison

### Option 1: Pre-built Community Image (Current Default)
**File:** `docker-compose.yml`

```bash
docker compose up -d
```

**Pros:**
- ✅ Instant start (no build)
- ✅ Tested and working
- ✅ Fast deployment

**Cons:**
- ⚠️ Community maintained
- ⚠️ May lag behind Greenfield updates

**Use when:** You want fast deployment and don't need latest Greenfield

### Option 2: Official Build from Source
**File:** `docker-compose.official.yml`

```bash
docker compose -f docker-compose.official.yml up -d
```

**Pros:**
- ✅ Official Greenfield code
- ✅ Always up-to-date with repo
- ✅ Full control

**Cons:**
- ⚠️ 15-20 min first build
- ⚠️ Requires build tools
- ⚠️ Larger disk usage during build

**Use when:** You want official code or need latest Greenfield features

## Build Requirements

### Disk Space
- **During build:** ~10GB (temporary)
- **After build:** ~2GB (final image)

### Time
- **First build:** 15-20 minutes
- **Rebuild:** 5-10 minutes (with cache)
- **Start:** Instant (after build)

### System Requirements
- Docker with BuildKit support
- 4GB+ RAM
- /dev/dri/renderD128 device

## Troubleshooting

### Error: "manifest unknown"

**Problem:** Trying to pull non-existent image

**Solution:** Use the fixed `docker-compose.official.yml` (already done)

### Error: "context not found"

**Problem:** Running from wrong directory

**Solution:**
```bash
# Must run from SIMPLE_WAYOUT directory
cd ~/Documents/greenfield/SIMPLE_WAYOUT
docker compose -f docker-compose.official.yml up -d
```

### Error: "Dockerfile not found"

**Problem:** Greenfield repository structure changed

**Solution:**
```bash
# Verify Dockerfile exists
ls -la ../docker/Dockerfile

# If not, check Greenfield repo structure
ls -la ../
```

### Build Takes Too Long

**Problem:** Building GStreamer from source is slow

**Solution:** This is normal. First build takes 15-20 minutes.

**Speed it up:**
```bash
# Use BuildKit for better caching
export DOCKER_BUILDKIT=1
docker compose -f docker-compose.official.yml build
```

### Build Fails: "out of disk space"

**Problem:** Not enough disk space

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Check space
df -h
```

## Monitoring the Build

### Watch Build Progress

```bash
# Build with output
docker compose -f docker-compose.official.yml build --progress=plain

# Or build and start with logs
docker compose -f docker-compose.official.yml up --build
```

### Check Build Logs

```bash
# After starting
docker compose -f docker-compose.official.yml logs -f compositor-proxy
```

## Switching Between Images

### From Community to Official

```bash
# Stop community version
docker compose down

# Start official version
docker compose -f docker-compose.official.yml up -d
```

### From Official to Community

```bash
# Stop official version
docker compose -f docker-compose.official.yml down

# Start community version
docker compose up -d
```

## Updating

### Update Official Build

```bash
# Pull latest Greenfield code
cd ~/Documents/greenfield
git pull

# Rebuild compositor
cd SIMPLE_WAYOUT
docker compose -f docker-compose.official.yml build compositor-proxy

# Restart
docker compose -f docker-compose.official.yml up -d
```

### Update SIMPLE_WAYOUT

```bash
# Rebuild app only
docker compose -f docker-compose.official.yml build simple-wayout

# Restart
docker compose -f docker-compose.official.yml up -d
```

## Quick Commands

```bash
# Build everything
docker compose -f docker-compose.official.yml build

# Start
docker compose -f docker-compose.official.yml up -d

# Stop
docker compose -f docker-compose.official.yml down

# Logs
docker compose -f docker-compose.official.yml logs -f

# Status
docker compose -f docker-compose.official.yml ps

# Rebuild and restart
docker compose -f docker-compose.official.yml up -d --build
```

## Summary

✅ **Fixed:** Changed from pulling non-existent image to building from source
✅ **Works:** Builds official Greenfield compositor from repository
✅ **Time:** 15-20 minutes first build, instant after
✅ **Use:** When you want official Greenfield code

**For most users:** Use the default `docker-compose.yml` with pre-built image (faster)

**For developers/contributors:** Use `docker-compose.official.yml` to build from source
