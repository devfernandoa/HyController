@echo off
REM HyController - Quick Start Script for Windows

echo ==============================================
echo   HyController - Quick Start
echo ==============================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado!
    echo Por favor, instale Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não está disponível!
    echo Por favor, instale Docker Compose v2+
    exit /b 1
)

echo ✅ Docker detectado
echo ✅ Docker Compose detectado
echo.

REM Build runner image
echo 🔨 Construindo imagem do runner Hytale...
cd runner
docker build -t hycontroller-runner:latest .
cd ..
echo ✅ Imagem do runner construída!
echo.

REM Start services
echo 🚀 Iniciando serviços do HyController...
cd compose
docker compose up -d
cd ..
echo ✅ Serviços iniciados!
echo.

REM Wait for services
echo ⏳ Aguardando serviços ficarem prontos...
timeout /t 5 /nobreak >nul

echo.
echo ==============================================
echo   🎉 HyController está pronto!
echo ==============================================
echo.
echo 📱 Acesse o painel em:
echo    http://localhost:3000
echo.
echo 📚 Próximos passos:
echo    1. Acesse o painel no navegador
echo    2. Crie seu primeiro servidor
echo    3. Faça upload dos arquivos do Hytale
echo    4. Inicie o servidor e autentique
echo.
echo 📖 Documentação completa: README.md
echo 🔧 Para parar: cd compose ^&^& docker compose down
echo.

pause
