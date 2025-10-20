# SIMPLE_WAYOUT Production Dockerfile
# Fully standalone: builds Greenfield from source, then builds the app.

# ==============================================================================
# Stage 1: Base image with all system dependencies for building Greenfield
# ==============================================================================
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build tools and Greenfield runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ninja-build \
    pkg-config \
    curl \
    unzip \
    # Node.js for building TS projects
    nodejs \
    npm \
    # Greenfield dependencies
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    libgl1-mesa-dev \
    libgles2-mesa-dev \
    libegl1-mesa-dev \
    libgbm-dev \
    libinput-dev \
    libxkbcommon-dev \
    libpixman-1-dev \
    libwayland-dev \
    libwayland-egl1-mesa \
    wayland-protocols \
    # For running GUI apps
    libgtk-3-0 \
    gnome-calculator \
    gnome-terminal \
    firefox \
    gedit \
    nautilus \
    chromium-browser \
    && rm -rf /var/lib/apt/lists/*

# ==============================================================================
# Stage 2: Build Greenfield compositor-proxy from source
# ==============================================================================
WORKDIR /greenfield

# Copy only the necessary source code for the proxy
COPY ../packages/compositor-proxy ./packages/compositor-proxy
COPY ../packages/compositor-proxy-cli ./packages/compositor-proxy-cli
COPY ../packages/compositor-protocol ./packages/compositor-protocol
COPY ../libs/client-protocol ./libs/client-protocol
COPY ../libs/common ./libs/common
COPY ../package.json ./
COPY ../yarn.lock ./

# Install dependencies and build the proxy
RUN npm install -g yarn && \
    yarn install --frozen-lockfile && \
    yarn workspace @gfld/compositor-proxy-cli run build

# ==============================================================================
# Stage 3: Build the SIMPLE_WAYOUT application
# ==============================================================================
WORKDIR /app

# Build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ==============================================================================
# Stage 4: Final production image
# ==============================================================================
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    libxkbcommon0 \
    libpixman-1-0 \
    libwayland-client0 \
    libinput10 \
    libgbm1 \
    # GUI Apps
    gnome-calculator \
    gnome-terminal \
    firefox \
    gedit \
    nautilus \
    chromium-browser \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts from previous stages
COPY --from=builder /greenfield/packages/compositor-proxy-cli/dist/main.js /usr/local/bin/compositor-proxy-cli
COPY --from=builder /greenfield/node_modules /greenfield/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy runtime configuration
COPY applications.json .

# Create startup script
WORKDIR /app
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting SIMPLE_WAYOUT..."

# Set Node path to find Greenfield modules
export NODE_PATH=/greenfield/node_modules

# Start compositor-proxy in background
echo "Starting compositor-proxy..."
node /usr/local/bin/compositor-proxy-cli \
  --bind-port 8081 \
  --bind-ip 0.0.0.0 \
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
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start
CMD ["/app/start.sh"]
