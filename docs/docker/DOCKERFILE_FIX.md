# Dockerfile Fix Summary

## Problem

The original Dockerfile was trying to copy files from parent directories:

```dockerfile
COPY ../packages/compositor-proxy ./packages/compositor-proxy
COPY ../packages/compositor-proxy-cli ./packages/compositor-proxy-cli
COPY ../libs/client-protocol ./libs/client-protocol
# etc...
```

**Error:**
```
ERROR: failed to compute cache key: "/yarn.lock": not found
```

**Root Cause:** Docker's build context is limited to the directory where the Dockerfile is located (SIMPLE_WAYOUT/). Docker cannot access files outside this context (like ../packages/).

## Solution

We've implemented **three different approaches**, with Option 1 being the recommended solution:

### ✅ Option 1: Docker Compose with Pre-built Image (RECOMMENDED)

**File:** `docker-compose.yml` (updated)

**Approach:**
- Use pre-built Greenfield compositor-proxy Docker image
- Build only SIMPLE_WAYOUT frontend/backend
- Run as separate containers

**Advantages:**
- ✅ Fast build (only builds SIMPLE_WAYOUT)
- ✅ Reliable (uses tested compositor image)
- ✅ Easy to maintain
- ✅ Clear separation of concerns
- ✅ Easy to update individual components

**Usage:**
```bash
./build.sh
docker-compose up -d
```

**How it works:**
1. Compositor runs in its own container from `david510c/greenfield-base:v1.5-diagnostic-fixed-v4`
2. SIMPLE_WAYOUT builds frontend/backend only
3. Backend connects to compositor via network

---

### Option 2: Standalone with NPM Package

**File:** `Dockerfile` (updated)

**Approach:**
- Install compositor-proxy-cli from npm
- Build frontend/backend
- Run everything in one container

**Advantages:**
- ✅ Single container
- ✅ Self-contained
- ✅ Uses official npm package

**Disadvantages:**
- ⚠️ Longer build time
- ⚠️ Larger image size

**Usage:**
```bash
docker build -t simple-wayout:latest .
docker run -d -p 8080:8080 -p 8081:8081 \
  --device /dev/dri/renderD128 \
  simple-wayout:latest
```

---

### Option 3: Docker-in-Docker

**File:** `Dockerfile.prebuilt`

**Approach:**
- Use Docker-in-Docker to run pre-built compositor
- Build SIMPLE_WAYOUT
- Manage compositor container from within

**Advantages:**
- ✅ Uses proven compositor image
- ✅ Single container from user perspective

**Disadvantages:**
- ⚠️ Requires Docker socket access
- ⚠️ More complex
- ⚠️ Security considerations

**Usage:**
```bash
docker build -f Dockerfile.prebuilt -t simple-wayout:prebuilt .
docker run -d -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --device /dev/dri/renderD128 \
  simple-wayout:prebuilt
```

---

## What Changed

### 1. Dockerfile (Main)

**Before:**
```dockerfile
# Tried to copy from parent directory
COPY ../packages/compositor-proxy ./packages/compositor-proxy
COPY ../yarn.lock ./
```

**After:**
```dockerfile
# Install from npm instead
RUN npm install -g @gfld/compositor-proxy-cli

# Only copy SIMPLE_WAYOUT files
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/backend/dist ./backend/dist
```

### 2. docker-compose.yml

**Before:**
```yaml
services:
  simple-wayout:
    # Single service, tried to build everything
```

**After:**
```yaml
services:
  compositor-proxy:
    # Pre-built image
    image: david510c/greenfield-base:v1.5-diagnostic-fixed-v4
    
  simple-wayout:
    # Only builds SIMPLE_WAYOUT
    depends_on:
      compositor-proxy:
        condition: service_healthy
```

### 3. New Files

- **DOCKER_SETUP.md** - Comprehensive Docker deployment guide
- **Dockerfile.prebuilt** - Alternative Docker-in-Docker approach
- **DOCKERFILE_FIX.md** - This file

---

## Recommended Workflow

### Development

```bash
# Use the dev script (unchanged)
./start-dev.sh
```

This starts:
1. Compositor in Docker
2. Backend with hot reload
3. Frontend with hot reload

### Production

```bash
# Build
./build.sh

# Start
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f

# Stop
docker-compose down
```

---

## Testing the Fix

### 1. Clean Build

```bash
# Remove old images
docker-compose down -v
docker rmi simple-wayout:latest

# Build fresh
./build.sh
```

### 2. Verify Build

```bash
# Should complete without errors
docker images | grep simple-wayout
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Check Health

```bash
# Wait for services to be healthy
docker-compose ps

# Test health endpoint
curl http://localhost:8080/health

# Should return:
# {"status":"healthy","uptime":...}
```

### 5. Test Application

```bash
# Open in browser
open http://localhost:8080

# Should see application list
# Click an app to test
```

---

## Troubleshooting

### Build Still Fails

**Check:**
```bash
# Verify you're in the right directory
pwd
# Should show: .../greenfield/SIMPLE_WAYOUT

# Check Docker version
docker --version
# Should be 20.10+

# Check Docker Compose version
docker-compose --version
# Should be 1.29+ or 2.0+
```

### Compositor Won't Start

**Check:**
```bash
# Verify DRI device exists
ls -la /dev/dri/renderD128

# Check compositor logs
docker logs compositor-proxy

# Restart compositor
docker-compose restart compositor-proxy
```

### Backend Can't Connect to Compositor

**Check:**
```bash
# Verify network
docker network ls
docker network inspect simple_wayout_default

# Test connectivity
docker exec simple-wayout ping compositor-proxy

# Check compositor is listening
docker exec compositor-proxy netstat -tlnp | grep 8081
```

---

## Why This Approach?

### Docker Build Context Limitation

Docker's build context is a fundamental security and design feature:

1. **Security:** Prevents builds from accessing arbitrary files
2. **Reproducibility:** Ensures builds are consistent
3. **Efficiency:** Only sends necessary files to Docker daemon

### Solutions Comparison

| Approach | Build Time | Complexity | Reliability | Recommended |
|----------|-----------|------------|-------------|-------------|
| Docker Compose | Fast | Low | High | ✅ Yes |
| NPM Package | Medium | Medium | High | ⚠️ Alternative |
| Docker-in-Docker | Fast | High | Medium | ❌ No |

### Why Docker Compose Wins

1. **Separation of Concerns**
   - Compositor is a stable, proven component
   - SIMPLE_WAYOUT is custom application logic
   - Keep them separate for easier updates

2. **Build Speed**
   - Only rebuild what changes
   - Compositor image is cached
   - Frontend/backend build quickly

3. **Debugging**
   - Easy to check compositor logs separately
   - Easy to restart individual services
   - Clear service boundaries

4. **Updates**
   - Update compositor: change image tag
   - Update SIMPLE_WAYOUT: rebuild only app
   - No need to rebuild everything

---

## Migration Guide

If you have existing deployments:

### From Old Dockerfile

```bash
# 1. Stop old container
docker stop simple-wayout
docker rm simple-wayout

# 2. Pull new code
git pull

# 3. Use new approach
./build.sh
docker-compose up -d
```

### From Manual Setup

```bash
# 1. Stop manual services
docker stop compositor-proxy
pkill -f "npm run dev"

# 2. Use docker-compose
./build.sh
docker-compose up -d
```

---

## Summary

**Problem:** Dockerfile couldn't access parent directory files

**Solution:** Use Docker Compose with pre-built compositor image

**Result:** 
- ✅ Fast, reliable builds
- ✅ Easy to maintain
- ✅ Production ready
- ✅ Clear architecture

**Next Steps:**
1. Test the build: `./build.sh`
2. Start services: `docker-compose up -d`
3. Verify: `curl http://localhost:8080/health`
4. Use: `open http://localhost:8080`

---

For detailed deployment instructions, see **DOCKER_SETUP.md**.
