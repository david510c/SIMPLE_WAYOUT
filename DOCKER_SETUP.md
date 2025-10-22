# SIMPLE_WAYOUT Docker Setup Guide

## Overview

SIMPLE_WAYOUT can be deployed using Docker in multiple ways. This guide explains each approach.

## Deployment Options

### Option 1: Docker Compose (Recommended)

This is the **easiest and most reliable** approach. It uses:
- Pre-built Greenfield compositor-proxy image
- Separate containers for compositor and application
- Automatic dependency management

**Pros:**
- ✅ Fast build (only builds SIMPLE_WAYOUT)
- ✅ Reliable (uses tested compositor image)
- ✅ Easy to update
- ✅ Clear separation of concerns

**Cons:**
- Requires two containers

#### Quick Start

```bash
# Build and start
./build.sh
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Manual Steps

```bash
# Build the image
docker build -t simple-wayout:latest .

# Start with docker-compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f simple-wayout
docker-compose logs -f compositor-proxy

# Stop
docker-compose down
```

---

### Option 2: Standalone Dockerfile

This builds everything from npm packages.

**Pros:**
- ✅ Single container
- ✅ Self-contained

**Cons:**
- ⚠️ Longer build time
- ⚠️ Larger image size
- ⚠️ More complex

#### Usage

```bash
# Build
docker build -t simple-wayout:latest .

# Run
docker run -d \
  --name simple-wayout \
  -p 8080:8080 \
  -p 8081:8081 \
  --device /dev/dri/renderD128:/dev/dri/renderD128 \
  simple-wayout:latest

# View logs
docker logs -f simple-wayout

# Stop
docker stop simple-wayout
docker rm simple-wayout
```

---

### Option 3: Pre-built Compositor (Alternative)

Uses Docker-in-Docker to run pre-built compositor.

**Pros:**
- ✅ Uses proven compositor image
- ✅ Single container

**Cons:**
- ⚠️ Requires Docker socket access
- ⚠️ More complex setup

#### Usage

```bash
# Build with alternative Dockerfile
docker build -f Dockerfile.prebuilt -t simple-wayout:prebuilt .

# Run with Docker socket
docker run -d \
  --name simple-wayout \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --device /dev/dri/renderD128:/dev/dri/renderD128 \
  simple-wayout:prebuilt
```

---

## Troubleshooting

### Build Fails: "not found" errors

**Problem:** Docker can't access parent directory files

**Solution:** Use Option 1 (docker-compose) which uses pre-built images

### Compositor Won't Start

**Problem:** DRI device not available

**Check:**
```bash
ls -la /dev/dri/renderD128
```

**Solution:**
```bash
# Add your user to video/render groups
sudo usermod -a -G video $USER
sudo usermod -a -G render $USER

# Logout and login again
```

### Port Already in Use

**Problem:** Port 8080 or 8081 already in use

**Check:**
```bash
sudo netstat -tlnp | grep -E '8080|8081'
```

**Solution:**
```bash
# Stop conflicting services
docker stop $(docker ps -q)

# Or change ports in docker-compose.yml
ports:
  - "9080:8080"  # Use different host port
```

### Application Won't Launch

**Problem:** Compositor not ready

**Check:**
```bash
# Check compositor logs
docker logs compositor-proxy

# Check if compositor is responding
curl http://localhost:8081
```

**Solution:**
```bash
# Restart compositor
docker-compose restart compositor-proxy

# Wait for it to be healthy
docker-compose ps
```

### Health Check Fails

**Problem:** Health check endpoint not responding

**Check:**
```bash
# Test health endpoint
curl http://localhost:8080/health

# Check backend logs
docker logs simple-wayout
```

**Solution:**
```bash
# Restart the service
docker-compose restart simple-wayout

# Check if backend is running
docker exec simple-wayout ps aux | grep node
```

---

## Configuration

### Environment Variables

Edit `docker-compose.yml` to customize:

```yaml
environment:
  - NODE_ENV=production
  - PORT=8080
  - COMPOSITOR_URL=ws://compositor-proxy:8081
  - LOG_LEVEL=info  # debug, info, warn, error
```

### Applications

Edit `applications.json` to add/remove applications:

```json
{
  "applications": [
    {
      "id": "my-app",
      "name": "My Application",
      "description": "Custom app",
      "icon": "🚀",
      "category": "Custom",
      "executable": "/usr/bin/my-app",
      "args": [],
      "env": {}
    }
  ]
}
```

Then rebuild:
```bash
docker-compose build simple-wayout
docker-compose up -d
```

### Hardware Acceleration

To use hardware encoding (NVIDIA/Intel):

```yaml
# For NVIDIA
devices:
  - /dev/dri/renderD128:/dev/dri/renderD128
environment:
  - ENCODER=nvh264

# For Intel/AMD VAAPI
devices:
  - /dev/dri/renderD128:/dev/dri/renderD128
environment:
  - ENCODER=vaapih264
```

---

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f simple-wayout
docker-compose logs -f compositor-proxy

# Last 100 lines
docker-compose logs --tail=100
```

### Check Status

```bash
# Service status
docker-compose ps

# Health status
docker inspect simple-wayout | grep -A 10 Health

# Resource usage
docker stats simple-wayout compositor-proxy
```

### Access Container

```bash
# Execute commands
docker exec -it simple-wayout bash

# Check processes
docker exec simple-wayout ps aux

# Check network
docker exec simple-wayout netstat -tlnp
```

---

## Production Deployment

### Security

1. **Enable authentication:**
   ```yaml
   environment:
     - BASIC_AUTH=username:password
   ```

2. **Restrict CORS:**
   ```yaml
   command: >
     compositor-proxy-cli
       --allow-origin 'https://yourdomain.com'
   ```

3. **Use HTTPS:**
   - Add reverse proxy (nginx/traefik)
   - Configure SSL certificates

### Scaling

For multiple users, use Docker Swarm or Kubernetes:

```bash
# Docker Swarm
docker stack deploy -c docker-compose.yml simple-wayout

# Scale services
docker service scale simple-wayout_simple-wayout=3
```

### Backup

```bash
# Backup configuration
tar -czf simple-wayout-config.tar.gz \
  applications.json \
  docker-compose.yml

# Backup data (if using volumes)
docker run --rm \
  -v simple-wayout_data:/data \
  -v $(pwd):/backup \
  alpine tar -czf /backup/data-backup.tar.gz /data
```

---

## Recommended Setup

For production use, we recommend **Option 1 (Docker Compose)**:

```bash
# 1. Clone repository
git clone <repo-url>
cd SIMPLE_WAYOUT

# 2. Customize applications
nano applications.json

# 3. Build and start
./build.sh
docker-compose up -d

# 4. Verify
curl http://localhost:8080/health
open http://localhost:8080

# 5. Monitor
docker-compose logs -f
```

This provides the best balance of simplicity, reliability, and maintainability.

---

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify health: `curl http://localhost:8080/health`
3. Check compositor: `docker logs compositor-proxy`
4. Review this guide's troubleshooting section
5. Check main README.md and ARCHITECTURE.md

---

**Remember:** Docker Compose (Option 1) is the recommended approach for most users.
