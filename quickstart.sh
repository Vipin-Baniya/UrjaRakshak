#!/bin/bash
# UrjaRakshak Quick Start Script
# This script sets up and launches UrjaRakshak for first-time users

set -e

echo "⚡ UrjaRakshak - Ethical Energy Integrity System"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from template...${NC}"
    cp .env.example .env
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    
    # Update .env with generated passwords
    sed -i "s/your_db_password/$DB_PASSWORD/" .env
    sed -i "s/your_secure_db_password/$DB_PASSWORD/" .env
    sed -i "s/generate-a-secure-random-key-minimum-32-characters/$SECRET_KEY/" .env
    sed -i "s/your_grafana_password/$GRAFANA_PASSWORD/" .env
    
    echo -e "${GREEN}✓ Generated .env with secure passwords${NC}"
    echo ""
    echo "IMPORTANT: Save these credentials:"
    echo "  Database Password: $DB_PASSWORD"
    echo "  Grafana Password: $GRAFANA_PASSWORD"
    echo ""
    read -p "Press Enter to continue..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo ""
echo "Starting UrjaRakshak services..."
echo ""

# Pull images
docker-compose pull

# Start services
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check health
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is healthy!${NC}"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for API to be ready... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ API failed to start within timeout${NC}"
    echo "Check logs with: docker-compose logs urjarakshak-api"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 UrjaRakshak is running!${NC}"
echo ""
echo "Access points:"
echo "  🌐 API:       http://localhost:8000"
echo "  📊 Dashboard: http://localhost:3000"
echo "  📈 Grafana:   http://localhost:3001"
echo "  📚 API Docs:  http://localhost:8000/api/docs"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose logs -f"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo ""
echo "📖 Read the documentation at: docs/DEPLOYMENT_GUIDE.md"
echo ""
echo "🕊️  Remember: UrjaRakshak protects energy systems without harming people"
echo ""
