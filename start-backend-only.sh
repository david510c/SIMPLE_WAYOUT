#!/bin/bash
set -e

echo "========================================="
echo "Starting SIMPLE_WAYOUT (Backend Only)"
echo "========================================="

# Note: Compositor runs in separate container
echo "Compositor: External (compositor-proxy container)"
echo "Backend: Starting..."

# Start backend server
cd /app/backend
PORT=8080 NODE_ENV=production node dist/server.js

