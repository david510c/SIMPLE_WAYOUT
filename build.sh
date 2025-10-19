#!/bin/bash
set -e

# SIMPLE_WAYOUT Build Script

echo "========================================="
echo "Building SIMPLE_WAYOUT"
echo "========================================="

# Configuration
IMAGE_NAME="${IMAGE_NAME:-simple-wayout}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "Build Date: ${BUILD_DATE}"
echo "Git Commit: ${GIT_COMMIT}"
echo "========================================="

# Build Docker image
docker build \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  .

echo ""
echo "✅ Build complete: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "To run:"
echo "  docker run -p 8080:8080 --device /dev/dri/renderD128 ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up -d"
echo "========================================="
