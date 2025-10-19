#!/bin/bash
set -e

# SIMPLE_WAYOUT Development Startup Script

echo "========================================="
echo "Starting SIMPLE_WAYOUT (Development)"
echo "========================================="

# Check if compositor-proxy is running
if ! docker ps | grep -q compositor-proxy; then
  echo "Starting compositor-proxy..."
  docker run -d \
    --name compositor-proxy \
    -p 8081:8081 \
    -v /tmp/.X11-unix:/tmp/.X11-unix \
    -e DISPLAY=$DISPLAY \
    --device /dev/dri/renderD128:/dev/dri/renderD128 \
    david510c/greenfield-base:v1.5-diagnostic-fixed-v4 \
    compositor-proxy-cli \
      --bind-port 8081 \
      --bind-ip 0.0.0.0 \
      --base-url ws://localhost:8080 \
      --allow-origin '*'
  
  echo "Waiting for compositor-proxy to start..."
  sleep 3
else
  echo "✓ Compositor-proxy already running"
fi

# Start backend in background
echo "Starting backend server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend dev server..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "✅ SIMPLE_WAYOUT Development Started"
echo "========================================="
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Compositor: ws://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"
echo "========================================="

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker stop compositor-proxy; exit" INT TERM

wait
