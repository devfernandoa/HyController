# HyController Runner

Este é o container runner que executa o servidor Hytale.

## Características

- **Java 25** (OpenJDK Temurin)
- Suporte para **linux/amd64** e **linux/arm64**
- Execução como usuário não-root para segurança
- Volume persistente montado em `/data`
- Porta UDP 5520 (padrão)

## Build

```bash
docker build -t hycontroller-runner:latest .
```

## Build multi-plataforma

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t hycontroller-runner:latest .
```

## Uso manual

```bash
docker run -d \
  --name hytale-server \
  -v hytale-data:/data \
  -p 5520:5520/udp \
  -e JAVA_OPTS="-Xms2G -Xmx4G" \
  -e SERVER_ARGS="--assets /data/Assets.zip --bind 0.0.0.0:5520" \
  hycontroller-runner:latest
```

## Variáveis de ambiente

- `JAVA_OPTS`: Opções da JVM (padrão: `-Xms2G -Xmx4G`)
- `SERVER_ARGS`: Argumentos do servidor Hytale

## Estrutura do volume /data

```
/data/
├── HytaleServer.jar      # Binário do servidor (obrigatório)
├── Assets.zip            # Assets do jogo (obrigatório)
├── HytaleServer.aot      # Cache AOT (opcional)
├── config.json           # Configuração do servidor
├── permissions.json      # Permissões
├── whitelist.json        # Lista de permitidos
├── bans.json             # Lista de banidos
├── logs/                 # Logs do servidor
├── mods/                 # Mods instalados
├── universe/             # Dados do mundo
├── .cache/               # Cache do servidor
└── backups/              # Backups
```
