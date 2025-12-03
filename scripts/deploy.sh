#!/bin/bash
# Pet QR System - VPS Deployment Script
# Usage: ./scripts/deploy.sh [tag]
# Example: ./scripts/deploy.sh main
#          ./scripts/deploy.sh v1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/pet-qr-app"
COMPOSE_FILE="docker-compose.prod.yml"
TAG="${1:-main}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Pet QR System - Deployment Script    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env.production exists
if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
    echo -e "${RED}Error: .env.production not found in $DEPLOY_DIR${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

cd "$DEPLOY_DIR"

echo -e "${YELLOW}[1/5] Logging in to GitHub Container Registry...${NC}"
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

echo -e "${YELLOW}[2/5] Pulling latest images (tag: $TAG)...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file .env.production pull

echo -e "${YELLOW}[3/5] Stopping current containers...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file .env.production down

echo -e "${YELLOW}[4/5] Starting new containers...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file .env.production up -d

echo -e "${YELLOW}[5/5] Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!                 ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Health check
echo -e "${YELLOW}Running health checks...${NC}"
sleep 10

if curl -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}Frontend: OK${NC}"
else
    echo -e "${RED}Frontend: FAILED${NC}"
fi

BACKEND_HEALTH=$(docker exec pet-qr-backend curl -s http://localhost:8000/health 2>/dev/null || echo "FAILED")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}Backend: OK${NC}"
else
    echo -e "${RED}Backend: FAILED${NC}"
fi

echo ""
echo "Container status:"
docker-compose -f "$COMPOSE_FILE" ps
