# Quick Answer: Greenfield Image Compatibility

## Question
> Is SIMPLE_WAYOUT compatible with the original https://github.com/udevbe/greenfield docker image if I decide to not use the david510c/greenfield-base?

## Answer: YES! ✅

SIMPLE_WAYOUT is **fully compatible** with the official Greenfield Docker image.

## How to Use Official Greenfield Image

### Option 1: Use Provided Config (Easiest)

```bash
# Use the official compose file
docker compose -f docker-compose.official.yml up -d
```

This builds the official Greenfield image from source and uses it with SIMPLE_WAYOUT.

### Option 2: Manual Setup

1. **Build official Greenfield image:**
```bash
cd /path/to/greenfield
docker build -f docker/Dockerfile -t greenfield-official:latest .
```

2. **Update docker-compose.yml:**
```yaml
services:
  compositor-proxy:
    image: greenfield-official:latest  # Change this line
    command: >
      --bind-port 8081
      --bind-ip 0.0.0.0
      --allow-origin '*'
      --encoder x264
    # ... rest stays the same
```

3. **Start:**
```bash
docker compose up -d
```

## Why It Works

SIMPLE_WAYOUT only requires:
- ✅ WebSocket on port 8081
- ✅ Standard compositor-proxy-cli interface
- ✅ H.264 encoding support
- ✅ CORS support

Both the community image (`david510c/greenfield-base`) and official Greenfield image provide these features.

## Comparison

| Feature | Community Image | Official Image |
|---------|----------------|----------------|
| **Ready to use** | ✅ Instant | ⚠️ ~10 min build |
| **Official** | ❌ No | ✅ Yes |
| **Up-to-date** | ⚠️ Depends | ✅ Always |
| **Works with SIMPLE_WAYOUT** | ✅ Yes | ✅ Yes |

## Recommendation

- **For quick testing:** Use community image (current default)
- **For production:** Build official image
- **For development:** Either works fine

## Files Provided

- ✅ `docker-compose.yml` - Uses community image (default)
- ✅ `docker-compose.official.yml` - Uses official Greenfield build
- ✅ `GREENFIELD_IMAGE_COMPATIBILITY.md` - Complete guide

## Quick Start with Official Image

```bash
# One command!
docker compose -f docker-compose.official.yml up -d

# Check status
docker compose -f docker-compose.official.yml ps

# View logs
docker compose -f docker-compose.official.yml logs -f

# Access
open http://localhost:8080
```

## Summary

**Yes, you can absolutely use the official Greenfield image!**

The architecture is designed to be compositor-agnostic. As long as the image provides a standard compositor-proxy-cli interface, it will work with SIMPLE_WAYOUT.

Both images are tested and working. Choose based on your preference:
- Community image = faster setup
- Official image = official support

Either way, SIMPLE_WAYOUT works perfectly! 🎉

---

For detailed information, see **GREENFIELD_IMAGE_COMPATIBILITY.md**
