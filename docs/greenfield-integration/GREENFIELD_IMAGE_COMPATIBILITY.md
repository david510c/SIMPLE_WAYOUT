# Greenfield Docker Image Compatibility Guide

## Overview

SIMPLE_WAYOUT is compatible with multiple Greenfield compositor images. This guide explains your options.

## Available Options

### Option 1: Pre-built Community Image (Current Default) ✅

**Image:** `david510c/greenfield-base:v1.5-diagnostic-fixed-v4`

**Pros:**
- ✅ Ready to use immediately
- ✅ No build time required
- ✅ Tested and working
- ✅ Includes diagnostic tools
- ✅ Fast deployment

**Cons:**
- ⚠️ Community maintained (not official)
- ⚠️ May lag behind latest Greenfield updates

**Usage:**
```yaml
# docker-compose.yml (current default)
services:
  compositor-proxy:
    image: david510c/greenfield-base:v1.5-diagnostic-fixed-v4
    ports:
      - "8081:8081"
    devices:
      - /dev/dri/renderD128:/dev/dri/renderD128
```

**Start:**
```bash
docker compose up -d
```

---

### Option 2: Official Greenfield Image (Build from Source) 🏗️

**Source:** `https://github.com/udevbe/greenfield`

**Pros:**
- ✅ Official implementation
- ✅ Always up-to-date with repository
- ✅ Full control over build
- ✅ Can customize build options

**Cons:**
- ⚠️ Requires building from source (~10-15 minutes)
- ⚠️ Larger build context
- ⚠️ No pre-built image available yet

**Usage:**
```yaml
# docker-compose.official.yml (provided)
services:
  compositor-proxy:
    build:
      context: ..  # Parent directory (greenfield repo root)
      dockerfile: docker/Dockerfile
    command: >
      --bind-port 8081
      --bind-ip 0.0.0.0
      --allow-origin '*'
      --encoder x264
    ports:
      - "8081:8081"
    devices:
      - /dev/dri/renderD128:/dev/dri/renderD128
```

**Start:**
```bash
# First time (builds image)
docker compose -f docker-compose.official.yml up -d

# Subsequent starts
docker compose -f docker-compose.official.yml up -d
```

---

### Option 3: Build Your Own Image 🔧

**Pros:**
- ✅ Complete control
- ✅ Can optimize for your hardware
- ✅ Can add custom patches
- ✅ Can use different base images

**Cons:**
- ⚠️ Most complex
- ⚠️ Requires maintenance
- ⚠️ Need to understand Greenfield build process

**Steps:**

1. **Build from Greenfield repository:**
```bash
cd /path/to/greenfield
docker build -f docker/Dockerfile -t my-greenfield:latest .
```

2. **Use in docker-compose.yml:**
```yaml
services:
  compositor-proxy:
    image: my-greenfield:latest
    # ... rest of config
```

---

## Compatibility Matrix

| Feature | Community Image | Official Build | Custom Build |
|---------|----------------|----------------|--------------|
| **Ready to use** | ✅ Yes | ⚠️ Build required | ⚠️ Build required |
| **Build time** | 0 min | ~10-15 min | ~10-15 min |
| **Official support** | ❌ No | ✅ Yes | ❌ No |
| **Customizable** | ❌ No | ⚠️ Limited | ✅ Yes |
| **Up-to-date** | ⚠️ Depends | ✅ Always | ✅ You control |
| **Tested with SIMPLE_WAYOUT** | ✅ Yes | ✅ Yes | ⚠️ Your responsibility |

---

## Testing Compatibility

To test if an image works with SIMPLE_WAYOUT:

### 1. Test Compositor Standalone

```bash
# Start the compositor
docker run -d \
  --name test-compositor \
  -p 8081:8081 \
  --device /dev/dri/renderD128 \
  YOUR_IMAGE:TAG \
  --bind-port 8081 \
  --bind-ip 0.0.0.0 \
  --allow-origin '*'

# Check if it's running
docker logs test-compositor

# Test WebSocket endpoint
curl -i http://localhost:8081

# Clean up
docker stop test-compositor
docker rm test-compositor
```

### 2. Test with SIMPLE_WAYOUT

```bash
# Update docker-compose.yml
services:
  compositor-proxy:
    image: YOUR_IMAGE:TAG
    # ... rest of config

# Start everything
docker compose up -d

# Check logs
docker compose logs -f

# Test health
curl http://localhost:8080/health

# Test in browser
open http://localhost:8080
```

---

## Switching Between Images

### From Community to Official

```bash
# Stop current setup
docker compose down

# Use official compose file
docker compose -f docker-compose.official.yml up -d
```

### From Official to Community

```bash
# Stop current setup
docker compose -f docker-compose.official.yml down

# Use default compose file
docker compose up -d
```

### To Custom Image

```bash
# Build your image
docker build -f docker/Dockerfile -t my-greenfield:latest .

# Update docker-compose.yml
# Change: image: david510c/greenfield-base:v1.5-diagnostic-fixed-v4
# To:     image: my-greenfield:latest

# Start
docker compose up -d
```

---

## Required Compositor Features

For SIMPLE_WAYOUT to work, the compositor image must:

1. ✅ **Expose WebSocket on port 8081** (or configurable)
2. ✅ **Support `--bind-ip` and `--bind-port` flags**
3. ✅ **Support `--allow-origin` for CORS**
4. ✅ **Have H.264 encoding** (x264, nvh264, or vaapih264)
5. ✅ **Support `/dev/dri` device access**
6. ✅ **Run compositor-proxy-cli command**

### Verification Checklist

```bash
# 1. Check if compositor starts
docker logs compositor-proxy | grep -i "listening\|started\|ready"

# 2. Check if WebSocket is accessible
curl -i http://localhost:8081

# 3. Check if it accepts connections
# (Should see upgrade to WebSocket)

# 4. Check device access
docker exec compositor-proxy ls -la /dev/dri/

# 5. Check encoding support
docker logs compositor-proxy | grep -i "encoder\|codec"
```

---

## Troubleshooting

### Image Won't Start

**Check logs:**
```bash
docker logs compositor-proxy
```

**Common issues:**
- Missing `/dev/dri` device
- Wrong command syntax
- Port already in use
- Insufficient permissions

### WebSocket Connection Fails

**Check CORS:**
```bash
# Ensure --allow-origin is set
docker inspect compositor-proxy | grep allow-origin
```

**Check network:**
```bash
# Ensure containers can communicate
docker network inspect simple_wayout_default
```

### Performance Issues

**Check encoding:**
```bash
# Use hardware encoding if available
--encoder nvh264  # NVIDIA
--encoder vaapih264  # Intel/AMD
```

**Check device:**
```bash
# Ensure correct device
ls -la /dev/dri/
# Use the correct renderD device
```

---

## Recommendations

### For Development
**Use:** Community image (`david510c/greenfield-base`)
- Fast setup
- No build time
- Good for testing

### For Production
**Use:** Official build or custom image
- More control
- Can optimize
- Official support

### For Contributing
**Use:** Official build from source
- Always latest
- Can test changes
- Can submit PRs

---

## Building Official Image

If you want to build the official Greenfield image yourself:

```bash
# Clone Greenfield repository (if not already)
cd /path/to/greenfield

# Build the image
docker build -f docker/Dockerfile -t greenfield-official:latest .

# Tag it
docker tag greenfield-official:latest greenfield-official:$(date +%Y%m%d)

# Use in SIMPLE_WAYOUT
# Update docker-compose.yml:
services:
  compositor-proxy:
    image: greenfield-official:latest
```

---

## Future: Official Docker Hub Image

The Greenfield project may publish official images to Docker Hub in the future:

**Expected:** `udevbe/compositor-proxy-cli:latest`

When available, update docker-compose.yml:
```yaml
services:
  compositor-proxy:
    image: udevbe/compositor-proxy-cli:latest
```

---

## Summary

**Yes, SIMPLE_WAYOUT is compatible with the official Greenfield image!**

You have three options:

1. **Community image** (current default) - Fast, easy, works now
2. **Official build** (from source) - Official, customizable, requires build
3. **Custom build** - Full control, most complex

All three work with SIMPLE_WAYOUT. Choose based on your needs:

- **Quick start?** → Use community image
- **Production?** → Build official image
- **Custom needs?** → Build your own

The architecture is designed to work with any compatible Greenfield compositor image!

---

## Files Provided

- **docker-compose.yml** - Uses community image (default)
- **docker-compose.official.yml** - Uses official build from source
- **GREENFIELD_IMAGE_COMPATIBILITY.md** - This guide

Choose the approach that works best for you! 🚀
