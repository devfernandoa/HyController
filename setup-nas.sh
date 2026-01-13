#!/bin/bash

echo "======================================"
echo "  HyController - Setup for NAS"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if running as root or with docker permissions
if ! docker ps &> /dev/null; then
    echo "⚠️  Warning: Current user doesn't have permission to run Docker"
    echo "   You may need to run this script with sudo or add your user to docker group:"
    echo "   sudo usermod -aG docker $USER"
    echo ""
fi

# Get NAS IP address
NAS_IP=$(hostname -I | awk '{print $1}')
echo "📍 Detected NAS IP: $NAS_IP"
echo ""

# Ask for port configuration
read -p "Use default ports (3000 for web, 3001 for API)? [Y/n]: " use_defaults
use_defaults=${use_defaults:-Y}

if [[ $use_defaults =~ ^[Nn]$ ]]; then
    read -p "Enter port for web interface [3000]: " WEB_PORT
    WEB_PORT=${WEB_PORT:-3000}
    read -p "Enter port for API [3001]: " API_PORT
    API_PORT=${API_PORT:-3001}
else
    WEB_PORT=3000
    API_PORT=3001
fi

echo ""
echo "Configuration:"
echo "  Web Interface: http://$NAS_IP:$WEB_PORT"
echo "  API Backend: http://$NAS_IP:$API_PORT"
echo ""

# Update docker-compose.yml if needed
if [ "$WEB_PORT" != "3000" ] || [ "$API_PORT" != "3001" ]; then
    echo "⚙️  Updating docker-compose.yml with custom ports..."
    sed -i.bak \
        -e "s/\"3000:80\"/\"$WEB_PORT:80\"/" \
        -e "s/\"3001:3001\"/\"$API_PORT:3001\"/" \
        -e "s|http://localhost:3001/api|http://$NAS_IP:$API_PORT/api|" \
        -e "s|ws://localhost:3001|ws://$NAS_IP:$API_PORT|" \
        docker-compose.yml
fi

echo ""
read -p "Start building and deploying HyController? [Y/n]: " start_deploy
start_deploy=${start_deploy:-Y}

if [[ $start_deploy =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔨 Building Docker images... (this may take a few minutes)"
    docker-compose build --no-cache
    
    echo ""
    echo "🚀 Starting HyController..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        echo ""
        echo "✅ HyController is running!"
        echo ""
        echo "======================================"
        echo "  Access your panel at:"
        echo "  http://$NAS_IP:$WEB_PORT"
        echo "======================================"
        echo ""
        echo "Useful commands:"
        echo "  View logs:    docker-compose logs -f"
        echo "  Stop:         docker-compose down"
        echo "  Restart:      docker-compose restart"
        echo ""
    else
        echo ""
        echo "❌ Something went wrong. Check logs with:"
        echo "   docker-compose logs"
    fi
else
    echo ""
    echo "Setup complete. To start manually, run:"
    echo "  docker-compose up -d"
fi
