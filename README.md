# HyController

Um painel de controle completo para gerenciar servidores Hytale via Docker.

## 🎮 Características

- **Gerenciamento de Servidores**: Criar, iniciar, parar, reiniciar e deletar servidores Hytale
- **Gerenciador de Arquivos**: Visualizar, editar, upload, download e deletar arquivos do servidor
- **Console Interativo**: Executar comandos no servidor em tempo real
- **Visualização de Logs**: Logs ao vivo e históricos
- **Configurações**: Interface para ajustar memória, portas, autenticação e mais
- **Suporte Docker**: Isolamento completo entre painel e servidor
- **Multi-plataforma**: Suporte para linux/amd64 e linux/arm64

## 📋 Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Mínimo 4GB RAM disponível
- Porta 3000 (UI) e 3001 (API) disponíveis
- Portas UDP para servidores (padrão: 5520+)

## 🚀 Início Rápido

### 1. Clone o repositório

```bash
git clone <repository-url>
cd HyController
```

### 2. Build da imagem do runner

```bash
cd runner
docker build -t hycontroller-runner:latest .
cd ..
```

### 3. Inicie o painel

```bash
cd compose
docker-compose up -d
```

### 4. Acesse o painel

Abra seu navegador em: http://localhost:3000

## 📖 Como Usar

### Criando seu primeiro servidor

1. Clique em **"Criar Servidor"**
2. Preencha as informações:
   - Nome do servidor
   - Porta UDP (padrão: 5520)
   - Memória mínima e máxima
   - Modo de autenticação
3. (Opcional) Faça upload de um ZIP contendo `HytaleServer.jar` e `Assets.zip`
4. Clique em **"Criar Servidor"**

### Importando arquivos do servidor

Se você não fez upload durante a criação, você pode adicionar os arquivos depois:

1. Acesse o servidor criado
2. Clique em **"Gerenciador de Arquivos"**
3. Faça upload de:
   - `HytaleServer.jar` (obrigatório)
   - `Assets.zip` (obrigatório)
   - `HytaleServer.aot` (opcional, melhora boot time)

### Iniciando o servidor

1. Na lista de servidores ou página de detalhes, clique em **"Iniciar"**
2. Aguarde o servidor inicializar
3. Acesse o **Console** para ver o processo de boot

### Autenticando o servidor

Após o primeiro boot, você precisa autenticar:

1. Acesse o **Console** do servidor
2. Digite: `/auth login device`
3. Copie o código e a URL exibida
4. Acesse a URL no navegador e insira o código
5. Aguarde a confirmação no console

### Gerenciando arquivos

O gerenciador de arquivos permite:

- **Navegar** por diretórios
- **Editar** arquivos de configuração (JSON, etc.)
- **Upload** de mods para `/data/mods/`
- **Download** de backups
- **Deletar** arquivos não utilizados
- **Criar** novas pastas

### Instalando Mods

1. Acesse **Gerenciador de Arquivos**
2. Navegue até `/data/mods/`
3. Faça upload dos arquivos `.jar` ou `.zip` dos mods
4. Reinicie o servidor

### Fazendo Backups

**Manual:**
1. Acesse **Gerenciador de Arquivos**
2. Clique no menu superior
3. Selecione **"Criar Backup"**
4. O backup será salvo em `/data/backups/`

**Automático:**
1. Acesse **Configurações**
2. Ative **"Habilitar Backups Automáticos"**
3. Configure a frequência (em minutos)
4. Salve e reinicie o servidor

## 🏗️ Arquitetura

### Componentes

```
HyController/
├── panel/              # Painel de controle
│   ├── backend/        # API Node.js
│   └── frontend/       # Interface React
├── runner/             # Container do servidor Hytale
├── compose/            # Docker Compose
└── docs/               # Documentação
```

### Fluxo de dados

```
Browser → Frontend (React) → Backend API (Express) → Docker Engine → Runner Container (Hytale Server)
```

### Portas

- **3000**: Frontend (UI)
- **3001**: Backend (API + WebSocket)
- **5520+**: Servidores Hytale (UDP)

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

**Backend** (`panel/backend/.env`):
```env
PORT=3001
NODE_ENV=production
```

**Frontend** (`panel/frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001
```

### Estrutura do Volume do Servidor

Cada servidor tem um volume Docker dedicado:

```
/data/
├── HytaleServer.jar       # Binário do servidor
├── Assets.zip             # Assets do jogo
├── HytaleServer.aot       # Cache AOT (opcional)
├── config.json            # Configuração principal
├── permissions.json       # Permissões
├── whitelist.json         # Lista de permitidos
├── bans.json              # Banidos
├── logs/                  # Logs do servidor
├── mods/                  # Mods instalados
├── universe/              # Dados dos mundos
│   └── worlds/            # Mundos individuais
├── .cache/                # Cache do servidor
└── backups/               # Backups
```

### Ajustando Memória

A memória do servidor deve ser ajustada baseado em:

- **Número de jogadores** esperados
- **View distance** configurada
- **Quantidade de mods**
- **RAM disponível** no host

Regras gerais:
- **2-4 jogadores**: 2-4GB
- **5-10 jogadores**: 4-6GB
- **10+ jogadores**: 6-8GB+

## 🔒 Segurança

### Boas Práticas

1. **Firewall**: Abra apenas as portas UDP necessárias
2. **Backups**: Configure backups automáticos
3. **Volumes**: Nunca delete volumes sem backup
4. **Atualizações**: Mantenha as imagens Docker atualizadas
5. **Monitoramento**: Verifique logs regularmente

### Isolamento

- O runner executa como usuário não-root
- Apenas o painel tem acesso ao Docker socket
- Cada servidor tem volume isolado
- Rede bridge separada

## 🐛 Troubleshooting

### Servidor não inicia

1. Verifique se `HytaleServer.jar` e `Assets.zip` existem em `/data`
2. Verifique logs do container: `docker logs <container-name>`
3. Confirme que há memória suficiente disponível
4. Verifique se a porta UDP está livre

### Erro de porta em uso

```bash
# Verificar portas em uso
sudo netstat -tulpn | grep :5520

# Mudar a porta nas configurações do servidor
```

### Problemas de conectividade

1. Confirme que o servidor foi autenticado
2. Verifique firewall: `sudo ufw status`
3. Configure port forwarding no roteador (UDP!)
4. Teste conexão local primeiro

### Alto uso de RAM

1. Reduza view distance nas configurações do mundo
2. Diminua `-Xmx` nas configurações
3. Desative mods não utilizados
4. Considere aumentar RAM do host

## 📚 Documentação Adicional

- [Guia de Instalação Completo](docs/install-guide.md)
- [Segurança e Ameaças](docs/security.md)
- [Como Importar Arquivos do Servidor](docs/import-server.md)
- [Autenticação de Servidor](docs/authentication.md)

## ⚠️ Limitações Conhecidas

### Console do Servidor

O **console** exibido no painel é apenas para **visualização de logs** em tempo real. O Hytale Server em modo servidor não aceita comandos via stdin.

**Para administração do servidor, use:**
- Comandos in-game (se estiver jogando como admin)
- Arquivo de configuração (editar settings via UI)
- Futuro suporte a RCON (em desenvolvimento)

**Nota:** Comandos como `/auth login device` devem ser executados durante o primeiro boot acessando os logs do container diretamente:
```bash
docker logs -f hytale-<nome-do-servidor>
```

### Modo de Autenticação

- **Offline**: Funciona apenas em singleplayer. Em multiplayer, jogadores não conseguem conectar.
- **Authenticated**: Requerido para multiplayer. Você deve autenticar o servidor após primeira inicialização.

### Arquivos Necessários

O servidor **não inicia** sem:
- `HytaleServer.jar` (executável do servidor)
- `Assets.zip` (assets do jogo)

Certifique-se de fazer upload desses arquivos antes de iniciar o servidor.

## 🔄 Atualizações

### Atualizando o painel

```bash
cd HyController
git pull
cd compose
docker-compose down
docker-compose up -d --build
```

### Atualizando o servidor Hytale

1. Faça backup do servidor
2. Baixe novos arquivos `HytaleServer.jar` e `Assets.zip`
3. Substitua via Gerenciador de Arquivos
4. Reinicie o servidor

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## ⚠️ Disclaimer

Este é um projeto não-oficial e não é afiliado com Hypixel Studios. Hytale é uma marca registrada de Hypixel Studios.

## 🔗 Links Úteis

- [Manual Oficial do Servidor Hytale](https://support.hytale.com/hc/en-us/articles/hytale-server-manual)
- [Guia de Autenticação para Provedores](https://support.hytale.com/hc/en-us/articles/server-provider-authentication-guide)
- [Java 25 Download (Adoptium)](https://adoptium.net/)
- [Documentação Docker](https://docs.docker.com/)

## 💬 Suporte

Para bugs e sugestões, abra uma issue no GitHub.
