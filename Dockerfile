# SIMPLE_WAYOUT Production Dockerfile
# Based on Greenfield with clean, simple architecture

FROM david510c/greenfield-base:v1.5-diagnostic-fixed-v4

# Install additional dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy applications configuration
COPY applications.json /app/applications.json

# Build frontend
COPY frontend/package*.json /app/frontend/
WORKDIR /app/frontend
RUN npm ci

COPY frontend/ /app/frontend/
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json /app/backend/
RUN npm ci

COPY backend/ /app/backend/
RUN npm run build

# Create startup script
WORKDIR /app
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting SIMPLE_WAYOUT..."

# Start compositor-proxy in background
echo "Starting compositor-proxy..."
compositor-proxy-cli \
  --bind-port 8081 \
  --bind-ip 0.0.0.0 \
  --base-url ws://localhost:8080 \
  --allow-origin '*' \
  --render-device /dev/dri/renderD128 \
  --encoder x264 &

COMPOSITOR_PID=$!
echo "Compositor-proxy started (PID: $COMPOSITOR_PID)"

# Wait for compositor to be ready
sleep 3

# Start backend server
echo "Starting backend server..."
cd /app/backend
PORT=8080 NODE_ENV=production node dist/server.js &

BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start
CMD ["/app/start.sh"]
