# Como Importar Arquivos do Servidor Hytale

Este guia explica como obter e importar os arquivos necessários para executar um servidor Hytale no HyController.

## Arquivos Necessários

### Obrigatórios

1. **HytaleServer.jar** - O binário do servidor
2. **Assets.zip** - Assets do jogo (texturas, modelos, sons, etc.)

### Opcionais

3. **HytaleServer.aot** - Cache AOT (melhora tempo de boot)
4. **Mods/Plugins** - Arquivos `.jar` ou `.zip` de mods

## Métodos de Obtenção

### Método 1: Copiar da Instalação do Launcher (Mais Rápido)

Se você tem o Hytale Launcher instalado, os arquivos já estão no seu computador.

#### Windows

```powershell
# Localização dos arquivos
cd %appdata%\Hytale\install\release\package\game\latest

# Você verá:
# - Server\ (pasta com HytaleServer.jar)
# - Assets.zip
```

#### Linux

```bash
# Localização dos arquivos
cd $XDG_DATA_HOME/Hytale/install/release/package/game/latest
# ou
cd ~/.local/share/Hytale/install/release/package/game/latest

# Listar arquivos
ls -la
```

#### macOS

```bash
cd ~/Library/Application\ Support/Hytale/install/release/package/game/latest
ls -la
```

**Próximos passos**:
1. Copie a pasta `Server` e o arquivo `Assets.zip`
2. Crie um ZIP contendo:
   - `HytaleServer.jar` (de dentro da pasta Server)
   - `Assets.zip`
   - `HytaleServer.aot` (se existir)

```bash
# Exemplo Linux/macOS
cd Server
zip -r ~/hytale-bundle.zip HytaleServer.jar HytaleServer.aot
cd ..
zip -u ~/hytale-bundle.zip Assets.zip
```

### Método 2: Hytale Downloader CLI (Recomendado para Produção)

O Hytale Downloader é uma ferramenta oficial para baixar arquivos do servidor.

#### 1. Download do Hytale Downloader

Baixe de: https://support.hytale.com/hc/en-us/articles/hytale-server-manual

Arquivo: `hytale-downloader.zip`

#### 2. Extrair e executar

```bash
# Linux
unzip hytale-downloader.zip
chmod +x hytale-downloader
./hytale-downloader

# Windows
# Extrair hytale-downloader.zip
# Executar hytale-downloader.exe no PowerShell/CMD
```

#### 3. Autenticação

O downloader irá pedir autenticação:

```
Visit: https://accounts.hytale.com/device
Enter code: XXXX-XXXX
```

Siga as instruções na tela.

#### 4. Download completo

Após autenticação, o downloader irá baixar:
- `game.zip` contendo todos os arquivos

#### 5. Extrair arquivos necessários

```bash
unzip game.zip
cd Server
# Arquivos estão prontos para upload
```

### Método 3: Download via Interface do HyController

Durante a criação do servidor no HyController, você pode fazer upload direto.

## Importação no HyController

### Opção A: Upload durante criação do servidor

1. Acesse o HyController (http://localhost:3000)
2. Clique em **"Criar Servidor"**
3. Preencha as informações básicas
4. Na seção **"Upload de Arquivos do Servidor"**:
   - Selecione o arquivo ZIP preparado
   - Ou selecione múltiplos arquivos (HytaleServer.jar, Assets.zip)
5. Clique em **"Criar Servidor"**

O painel irá:
- Criar o volume Docker
- Extrair os arquivos para `/data`
- Preparar o container

### Opção B: Upload após criação do servidor

Se você criou o servidor sem fazer upload:

1. Acesse o servidor criado
2. Clique em **"Gerenciador de Arquivos"**
3. Faça upload de cada arquivo:
   - `HytaleServer.jar` → `/data/`
   - `Assets.zip` → `/data/`
   - `HytaleServer.aot` → `/data/` (opcional)

### Opção C: Via Docker Volume (Avançado)

Para servidores grandes ou múltiplos servidores:

```bash
# Encontrar o volume do servidor
docker volume ls | grep hytale-

# Copiar arquivos diretamente para o volume
sudo cp HytaleServer.jar /var/lib/docker/volumes/hytale-myserver/_data/
sudo cp Assets.zip /var/lib/docker/volumes/hytale-myserver/_data/
sudo cp HytaleServer.aot /var/lib/docker/volumes/hytale-myserver/_data/

# Ajustar permissões
sudo chown -R 1000:1000 /var/lib/docker/volumes/hytale-myserver/_data/
```

## Estrutura Final Esperada

Após a importação, o volume deve ter:

```
/data/
├── HytaleServer.jar       ✓ Obrigatório
├── Assets.zip             ✓ Obrigatório
├── HytaleServer.aot       ○ Opcional
├── config.json            (gerado no primeiro boot)
├── permissions.json       (gerado no primeiro boot)
├── whitelist.json         (gerado no primeiro boot)
├── bans.json              (gerado no primeiro boot)
├── logs/                  (gerado no primeiro boot)
├── mods/                  (para seus mods)
├── universe/              (dados do mundo)
└── .cache/                (cache do servidor)
```

## Verificação

Após importação, verifique:

1. **Via Interface**:
   - Acesse "Gerenciador de Arquivos"
   - Confirme que `HytaleServer.jar` existe
   - Confirme que `Assets.zip` existe
   - Verifique tamanhos dos arquivos

2. **Via Logs**:
   - Tente iniciar o servidor
   - Acesse "Logs"
   - Verifique se há erros de "arquivo não encontrado"

3. **Tamanhos esperados**:
   - `HytaleServer.jar`: ~100-200MB
   - `Assets.zip`: ~2-4GB
   - `HytaleServer.aot`: ~50-100MB (se presente)

## Mantendo Atualizado

### Verificar versão atual

```bash
# Via Hytale Downloader
./hytale-downloader -print-version
```

### Atualizar arquivos

1. **Faça backup** do servidor atual
2. Baixe novos arquivos (método 1 ou 2)
3. **Pare o servidor** no HyController
4. Substitua os arquivos via Gerenciador de Arquivos
5. **Reinicie o servidor**

### Automação (Avançado)

Script para atualização automática:

```bash
#!/bin/bash
# update-hytale.sh

SERVER_ID="seu-servidor-id"
VOLUME_PATH="/var/lib/docker/volumes/hytale-${SERVER_ID}/_data"

# Backup
docker run --rm -v hytale-${SERVER_ID}:/data -v /backups:/backup alpine \
  tar czf /backup/pre-update-$(date +%Y%m%d).tar.gz /data

# Download nova versão
./hytale-downloader -download-path new-game.zip

# Extrair
unzip -o new-game.zip -d extracted/

# Copiar arquivos
sudo cp extracted/Server/HytaleServer.jar ${VOLUME_PATH}/
sudo cp extracted/Server/HytaleServer.aot ${VOLUME_PATH}/
sudo cp extracted/Assets.zip ${VOLUME_PATH}/

# Ajustar permissões
sudo chown -R 1000:1000 ${VOLUME_PATH}

echo "Atualização completa. Reinicie o servidor."
```

## Troubleshooting

### "ERROR: HytaleServer.jar not found"

- Verifique que o arquivo está em `/data/` (não em subpasta)
- Confirme nome exato: `HytaleServer.jar` (case-sensitive)
- Verifique permissões: `ls -la` no gerenciador de arquivos

### "ERROR: Assets.zip not found"

- Mesmo que acima
- Confirme que é um arquivo ZIP válido (não corrompido)

### "Server crashes immediately"

- Verifique logs em "Logs"
- Possíveis causas:
  - Versão incompatível Java/Server
  - Assets.zip corrompido
  - Memória insuficiente
  - Falta de permissões

### "Out of memory" no boot

- Aumente `-Xmx` nas configurações
- Verifique RAM disponível no host
- Considere desabilitar cache AOT temporariamente

### Assets.zip muito grande para upload

Opções:
1. Use método de Docker Volume (Opção C acima)
2. Use SCP/SFTP para copiar para o servidor primeiro
3. Monte um compartilhamento de rede
4. Use `wget` dentro do container:

```bash
# Entrar no container
docker exec -it hytale-myserver sh

# Baixar diretamente (se tiver URL)
wget -O /data/Assets.zip <URL>
```

## Próximos Passos

Após importar os arquivos:

1. [Iniciar o servidor](../README.md#iniciando-o-servidor)
2. [Autenticar o servidor](authentication.md)
3. [Instalar mods](../README.md#instalando-mods) (opcional)
4. [Configurar backups](../README.md#fazendo-backups)
