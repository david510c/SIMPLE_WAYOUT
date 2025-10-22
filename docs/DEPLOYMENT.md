# SIMPLE_WAYOUT Deployment Guide

## Quick Start

### Development

```bash
# One command to start everything
./start-dev.sh
```

This will:
1. Start compositor-proxy (Docker)
2. Start backend server (port 3001)
3. Start frontend dev server (port 3000)

Open http://localhost:3000

### Production

```bash
# Build Docker image
./build.sh

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -p 8080:8080 --device /dev/dri/renderD128 simple-wayout:latest
```

Open http://localhost:8080

## Development Setup

### Prerequisites

- Node.js 18+
- Docker
- Linux with DRI support (`/dev/dri/renderD128`)

### Manual Setup

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 2. Start compositor-proxy
docker run -d \
  --name compositor-proxy \
  -p 8081:8081 \
  --device /dev/dri/renderD128 \
  david510c/greenfield-base:v1.5-diagnostic-fixed-v4 \
  compositor-proxy-cli --bind-port 8081 --bind-ip 0.0.0.0

# 3. Start backend (terminal 1)
cd backend
npm run dev

# 4. Start frontend (terminal 2)
cd frontend
npm run dev
```

### Environment Variables

**Backend:**
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Environment (development/production)
- `WAYLAND_DISPLAY` - Wayland display name (default: wayland-0)

**Frontend:**
- Configured in `vite.config.ts`

## Production Deployment

### Docker Build

```bash
# Build image
docker build -t simple-wayout:latest .

# Tag for registry
docker tag simple-wayout:latest your-registry/simple-wayout:latest

# Push to registry
docker push your-registry/simple-wayout:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  simple-wayout:
    image: simple-wayout:latest
    ports:
      - "8080:8080"
    devices:
      - /dev/dri/renderD128:/dev/dri/renderD128
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Docker Swarm

```yaml
version: '3.8'

services:
  simple-wayout:
    image: simple-wayout:latest
    ports:
      - "8080:8080"
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      - NODE_ENV=production
```

```bash
# Deploy stack
docker stack deploy -c docker-compose.yml simple-wayout

# Check status
docker stack ps simple-wayout

# Remove stack
docker stack rm simple-wayout
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simple-wayout
spec:
  replicas: 1
  selector:
    matchLabels:
      app: simple-wayout
  template:
    metadata:
      labels:
        app: simple-wayout
    spec:
      containers:
      - name: simple-wayout
        image: simple-wayout:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "4Gi"
            cpu: "2"
        volumeMounts:
        - name: dri
          mountPath: /dev/dri
      volumes:
      - name: dri
        hostPath:
          path: /dev/dri
---
apiVersion: v1
kind: Service
metadata:
  name: simple-wayout
spec:
  selector:
    app: simple-wayout
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

```bash
# Deploy
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods
kubectl logs -f deployment/simple-wayout

# Delete
kubectl delete -f k8s-deployment.yaml
```

## Configuration

### Applications

Edit `applications.json` to add/remove applications:

```json
{
  "applications": [
    {
      "id": "my-app",
      "name": "My Application",
      "description": "Description",
      "icon": "🚀",
      "category": "Custom",
      "executable": "/path/to/executable",
      "args": ["--arg1", "--arg2"],
      "env": {
        "MY_VAR": "value"
      }
    }
  ]
}
```

### Compositor

Compositor-proxy configuration is in the Dockerfile/startup script:

```bash
compositor-proxy-cli \
  --bind-port 8081 \
  --bind-ip 0.0.0.0 \
  --base-url ws://localhost:8080 \
  --allow-origin '*' \
  --render-device /dev/dri/renderD128 \
  --encoder x264
```

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-19T10:00:00.000Z",
  "runningApps": 2
}
```

### Logs

**Docker:**
```bash
docker logs simple-wayout -f
```

**Docker Compose:**
```bash
docker-compose logs -f
```

**Kubernetes:**
```bash
kubectl logs -f deployment/simple-wayout
```

### Metrics

Backend logs include:
- Application launches
- Application exits
- API requests
- Errors

## Troubleshooting

### Compositor won't start

```bash
# Check if DRI device exists
ls -la /dev/dri/renderD128

# Check compositor logs
docker logs compositor-proxy
```

### Applications won't launch

```bash
# Check if executable exists
docker exec simple-wayout which gnome-calculator

# Check Wayland display
docker exec simple-wayout echo $WAYLAND_DISPLAY

# Check application logs
docker logs simple-wayout | grep calculator
```

### Frontend won't connect

```bash
# Check if backend is running
curl http://localhost:8080/health

# Check if compositor is accessible
curl -I http://localhost:8081

# Check browser console for errors
```

## Performance Tuning

### Hardware Acceleration

Ensure DRI device is available:
```bash
ls -la /dev/dri/
```

### Video Encoding

Adjust encoder settings in compositor-proxy:
```bash
--encoder x264        # Software encoding (compatible)
--encoder vaapi       # Hardware encoding (faster, requires VAAPI)
```

### Resource Limits

Docker:
```bash
docker run \
  --cpus="2" \
  --memory="4g" \
  simple-wayout:latest
```

Docker Compose:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

## Security

### Network

- Use HTTPS in production
- Configure firewall rules
- Use reverse proxy (nginx, Caddy)

### Authentication

Add authentication middleware to backend:

```typescript
// backend/src/auth.ts
fastify.addHook('onRequest', async (request, reply) => {
  // Verify JWT token
  const token = request.headers.authorization
  if (!token) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
})
```

### CORS

Configure CORS in backend:

```typescript
fastify.register(cors, {
  origin: ['https://your-domain.com'],
  credentials: true,
})
```

## Backup

### Configuration

Backup `applications.json`:
```bash
cp applications.json applications.json.backup
```

### Logs

Export logs:
```bash
docker logs simple-wayout > logs.txt
```

## Updates

### Update Image

```bash
# Pull latest base image
docker pull david510c/greenfield-base:v1.5-diagnostic-fixed-v4

# Rebuild
./build.sh

# Restart
docker-compose down
docker-compose up -d
```

### Update Dependencies

```bash
# Frontend
cd frontend
npm update

# Backend
cd backend
npm update

# Rebuild
./build.sh
```

## Support

- Check logs first
- Review [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Review [GETTING_STARTED.md](./docs/GETTING_STARTED.md)
- Check browser console
- Check compositor logs

---

**Remember:** SIMPLE_WAYOUT is designed to be simple. If deployment is complex, something is wrong.
