# SIMPLE_WAYOUT Production Dockerfile
# Uses pre-built Greenfield compositor-proxy image

# ==============================================================================
# Stage 1: Build frontend
# ==============================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies (package-lock.json is required for npm ci)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build frontend
COPY frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Build backend
# ==============================================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Install dependencies (package-lock.json is required for npm ci)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Build backend
COPY backend/ ./
RUN npm run build

# ==============================================================================
# Stage 3: Final production image
# ==============================================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    # Greenfield compositor-proxy dependencies
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    libxkbcommon0 \
    libpixman-1-0 \
    libwayland-client0 \
    libwayland-server0 \
    libinput10 \
    libgbm1 \
    libegl1 \
    libgl1 \
    libgles2 \
    # GUI Applications
    gnome-calculator \
    gnome-terminal \
    firefox \
    gedit \
    nautilus \
    chromium-browser \
    dbus-x11 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install compositor-proxy-cli globally from npm
RUN npm install -g @gfld/compositor-proxy-cli

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy runtime configuration
COPY applications.json .

# Create startup script
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "========================================="
echo "Starting SIMPLE_WAYOUT"
echo "========================================="

# Start D-Bus (required for some GUI apps)
mkdir -p /var/run/dbus
dbus-daemon --system --fork || true

# Start compositor-proxy in background
echo "Starting compositor-proxy..."
node /usr/lib/node_modules/@gfld/compositor-proxy-cli/dist/main.js \
  --bind-port 8081 \
  --bind-ip 0.0.0.0 \
  --allow-origin '*' \
  --render-device /dev/dri/renderD128 \
  --encoder x264 &

COMPOSITOR_PID=$!
echo "✓ Compositor-proxy started (PID: $COMPOSITOR_PID)"

# Wait for compositor to be ready
echo "Waiting for compositor to initialize..."
sleep 5

# Start backend server
echo "Starting backend server..."
cd /app/backend
PORT=8080 NODE_ENV=production node dist/server.js &

BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"

echo "========================================="
echo "✅ SIMPLE_WAYOUT is ready!"
echo "Frontend: http://localhost:8080"
echo "Compositor: ws://localhost:8081"
echo "========================================="

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
EOF

RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start
CMD ["/app/start.sh"]
