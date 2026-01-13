#!/bin/bash
#
# Script para criar arquivos mock do Hytale Server (versão simples sem JDK)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOCK_DIR="$SCRIPT_DIR/hytale-server-mock"

echo "🎮 HyController - Criador de Servidor Mock (Simples)"
echo "===================================================="
echo ""

# Criar diretório
mkdir -p "$MOCK_DIR"
cd "$MOCK_DIR"

# 1. Criar Assets.zip
echo "📦 Criando Assets.zip mock..."
mkdir -p assets_temp/{textures,models,sounds,configs}

echo "# Mock Hytale Assets" > assets_temp/README.txt
echo "texture_data" > assets_temp/textures/blocks.png
echo "model_data" > assets_temp/models/player.obj
echo "sound_data" > assets_temp/sounds/music.ogg
echo "config_data" > assets_temp/configs/server.properties

cd assets_temp
zip -r ../Assets.zip . > /dev/null
cd ..
rm -rf assets_temp
echo "✅ Assets.zip criado ($(du -h Assets.zip | cut -f1))"

# 2. Criar HytaleServer.jar (apenas um ZIP válido com extensão .jar)
echo "☕ Criando HytaleServer.jar mock..."

# Python para criar JAR válido
python3 << 'PYTHON'
import zipfile
import os
import time

with zipfile.ZipFile('HytaleServer.jar', 'w') as jar:
    # Adicionar META-INF/MANIFEST.MF
    manifest = """Manifest-Version: 1.0
Main-Class: com.hypixel.hytale.server.MockServer
Created-By: HyController Mock Generator
Implementation-Version: 0.0.1-MOCK
Built-Date: """ + time.strftime("%Y-%m-%d") + """

"""
    jar.writestr('META-INF/MANIFEST.MF', manifest)
    
    # Adicionar arquivo de configuração mock
    config = """# Hytale Server Mock Configuration
server.name=My Mock Server
server.port=5520
server.max-players=10
authentication.required=true
"""
    jar.writestr('server.properties', config)
    
    # Adicionar README
    readme = """MOCK HYTALE SERVER
==================

This is a MOCK Hytale Server created for testing HyController.
The real Hytale game has not been released yet.

This JAR will NOT actually run a game server - it's just for
testing the file upload and management features of HyController.

Created by: HyController Mock Generator
"""
    jar.writestr('README.txt', readme)
    
    # Adicionar alguns arquivos simulados
    jar.writestr('com/hypixel/hytale/server/MockServer.class', b'\xCA\xFE\xBA\xBE' + b'\x00' * 100)  # Magic number de class files
    jar.writestr('data/version.txt', '0.0.1-MOCK')
    
print("JAR criado com sucesso")
PYTHON

echo "✅ HytaleServer.jar criado ($(du -h HytaleServer.jar | cut -f1))"

# 3. Criar arquivo AOT (Ahead-of-Time compilation mock)
echo "🚀 Criando HytaleServer.aot mock..."
dd if=/dev/urandom of=HytaleServer.aot bs=1M count=5 2>/dev/null
echo "✅ HytaleServer.aot criado ($(du -h HytaleServer.aot | cut -f1))"

# 4. Criar arquivo de documentação
cat > README.md << 'DOC'
# Mock Hytale Server Bundle

Este é um bundle **MOCK** do servidor Hytale criado para testar o HyController.

## ⚠️ IMPORTANTE

O jogo Hytale ainda **NÃO FOI LANÇADO**. Estes arquivos são apenas simulações
para permitir testar as funcionalidades do painel de controle.

## Arquivos incluídos

- `HytaleServer.jar` - JAR mock (não executável)
- `Assets.zip` - Assets simulados
- `HytaleServer.aot` - Arquivo AOT simulado

## Como usar com HyController

1. Crie um ZIP com todos os arquivos:
   ```bash
   ./create-bundle.sh
   ```

2. No HyController, vá em Dashboard > Create Server

3. Faça upload do arquivo `hytale-server-bundle.zip`

4. Configure o servidor (nome, memória, etc)

5. Clique em Create

## Nota sobre execução

Como este é um mock, o "servidor" não irá realmente executar nada.
O HyController irá tentar executar `java -jar HytaleServer.jar`, mas
como não há código real, o processo terminará imediatamente.

Isso ainda permite testar:
- ✅ Upload de arquivos
- ✅ Gerenciamento de arquivos
- ✅ Criação e exclusão de servidores
- ✅ Interface do console (mesmo que vazia)
- ✅ Visualização de logs

Para testar funcionalidades reais de execução, aguarde o lançamento
oficial do Hytale.
DOC

echo "✅ README.md criado"

# 5. Criar script para empacotar tudo
cat > create-bundle.sh << 'BUNDLE'
#!/bin/bash
zip -r hytale-server-bundle.zip HytaleServer.jar Assets.zip HytaleServer.aot README.md
echo "✅ Bundle criado: hytale-server-bundle.zip ($(du -h hytale-server-bundle.zip | cut -f1))"
BUNDLE

chmod +x create-bundle.sh

echo ""
echo "✨ Arquivos mock criados com sucesso!"
echo ""
echo "📂 Localização: $MOCK_DIR"
echo ""
echo "📦 Arquivos criados:"
ls -lh HytaleServer.jar Assets.zip HytaleServer.aot README.md
echo ""
echo "🎯 Próximos passos:"
echo "   1. Criar bundle: cd $MOCK_DIR && ./create-bundle.sh"
echo "   2. Fazer upload do bundle no HyController"
echo "   3. Testar as funcionalidades do painel"
echo ""
