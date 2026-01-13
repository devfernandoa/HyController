#!/bin/bash

# HyController - Quick Start Script

set -e

echo "=============================================="
echo "  HyController - Quick Start"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "Por favor, instale Docker primeiro: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está disponível!"
    echo "Por favor, instale Docker Compose v2+"
    exit 1
fi

echo "✅ Docker detectado: $(docker --version)"
echo "✅ Docker Compose detectado: $(docker compose version)"
echo ""

# Check Docker permissions
if ! docker ps &> /dev/null; then
    echo "⚠️  Permissão negada ao Docker socket."
    echo "Tentando com sudo..."
    USE_SUDO="sudo"
    
    if ! sudo docker ps &> /dev/null; then
        echo "❌ Não foi possível acessar o Docker mesmo com sudo!"
        echo ""
        echo "Por favor, adicione seu usuário ao grupo docker:"
        echo "  sudo usermod -aG docker $USER"
        echo "  newgrp docker"
        echo ""
        echo "Ou execute este script com sudo:"
        echo "  sudo ./start.sh"
        exit 1
    fi
else
    USE_SUDO=""
fi

# Build runner image
echo "🔨 Construindo imagem do runner Hytale..."
$USE_SUDO docker build -t hycontroller-runner:latest ./runner
echo "✅ Imagem do runner construída!"
echo ""

# Start services
echo "🚀 Iniciando serviços do HyController..."
$USE_SUDO docker compose -f ./compose/docker-compose.yml up -d
echo "✅ Serviços iniciados!"
echo ""

# Wait for services to be ready
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 5

# Check if services are running
if $USE_SUDO docker compose -f compose/docker-compose.yml ps | grep -q "Up"; then
    echo "✅ Serviços rodando com sucesso!"
else
    echo "⚠️  Aviso: Alguns serviços podem não ter iniciado corretamente"
    echo "Execute: $USE_SUDO docker compose -f compose/docker-compose.yml logs"
fi

echo ""
echo "=============================================="
echo "  🎉 HyController está pronto!"
echo "=============================================="
echo ""
echo "📱 Acesse o painel em:"
echo "   http://localhost:3000"
echo ""
echo "📚 Próximos passos:"
echo "   1. Acesse o painel no navegador"
echo "   2. Crie seu primeiro servidor"
echo "   3. Faça upload dos arquivos do Hytale (HytaleServer.jar e Assets.zip)"
echo "   4. Inicie o servidor e autentique com /auth login device"
echo ""
echo "📖 Documentação completa: README.md"
echo "🔧 Para parar os serviços: $USE_SUDO docker compose -f compose/docker-compose.yml down"
echo ""
