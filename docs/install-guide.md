# Guia de Instalação - HyController

Este guia fornece instruções detalhadas para instalar e configurar o HyController.

## Requisitos do Sistema

### Hardware Mínimo

- **CPU**: 2 cores
- **RAM**: 6GB (4GB para servidor Hytale + 2GB para sistema/painel)
- **Armazenamento**: 10GB livres
- **Rede**: Conexão à internet

### Hardware Recomendado

- **CPU**: 4+ cores
- **RAM**: 16GB+
- **Armazenamento**: 50GB+ SSD
- **Rede**: Conexão de banda larga

### Software

- **Sistema Operacional**:
  - Ubuntu 20.04+ (recomendado)
  - Debian 11+
  - CentOS 8+
  - Outro Linux com kernel 4.0+
- **Docker Engine**: 20.10+
- **Docker Compose**: 2.0+

## Instalação no Ubuntu/Debian

### 1. Atualizar sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Docker

```bash
# Adicionar repositório Docker
sudo apt install -y ca-certificates curl gnupg lsb-release
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

### 3. Configurar Firewall

```bash
# Permitir portas do painel
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend API

# Permitir portas UDP para servidores Hytale
sudo ufw allow 5520:5530/udp  # Intervalo para múltiplos servidores

# Ativar firewall se não estiver ativo
sudo ufw enable
```

### 4. Clonar repositório

```bash
cd ~
git clone <repository-url> HyController
cd HyController
```

### 5. Build da imagem do runner

```bash
cd runner
docker build -t hycontroller-runner:latest .
cd ..
```

### 6. Iniciar serviços

```bash
cd compose
docker compose up -d
```

### 7. Verificar status

```bash
docker compose ps
docker compose logs -f
```

### 8. Acessar o painel

Abra seu navegador em: http://SEU_IP:3000

## Instalação no CentOS/RHEL

### 1. Instalar Docker

```bash
# Remover versões antigas
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest \
    docker-latest-logrotate docker-logrotate docker-engine

# Adicionar repositório
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Instalar Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo
sudo usermod -aG docker $USER
```

### 2. Configurar Firewall

```bash
# FirewallD
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=5520-5530/udp
sudo firewall-cmd --reload
```

Continue com os passos 4-8 da seção Ubuntu.

## Configuração Avançada

### Reverse Proxy (Nginx)

Para expor o painel com domínio próprio:

```nginx
# /etc/nginx/sites-available/hycontroller
server {
    listen 80;
    server_name hycontroller.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/hycontroller /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hycontroller.seudominio.com
```

### Backup Automático

Criar script de backup:

```bash
#!/bin/bash
# /usr/local/bin/backup-hycontroller.sh

BACKUP_DIR="/backups/hycontroller"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de volumes Docker
for volume in $(docker volume ls -q | grep hytale-); do
    docker run --rm -v $volume:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/${volume}_${DATE}.tar.gz /data
done

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Adicionar ao cron:

```bash
sudo chmod +x /usr/local/bin/backup-hycontroller.sh
sudo crontab -e

# Adicionar linha para backup diário às 3AM
0 3 * * * /usr/local/bin/backup-hycontroller.sh
```

## Port Forwarding no Roteador

Para permitir que jogadores externos se conectem:

1. Acesse a interface do seu roteador (geralmente 192.168.1.1 ou 192.168.0.1)
2. Encontre a seção de Port Forwarding / Virtual Server
3. Adicione regras:
   - **Protocolo**: UDP
   - **Porta Externa**: 5520 (ou sua porta escolhida)
   - **Porta Interna**: 5520
   - **IP Interno**: IP do servidor
4. Salve e reinicie o roteador

## Verificação da Instalação

Execute os seguintes comandos para verificar:

```bash
# Docker está rodando?
docker ps

# Serviços do painel estão ativos?
docker compose ps

# Portas estão abertas?
sudo netstat -tulpn | grep -E "3000|3001|5520"

# Logs dos serviços
docker compose logs panel-backend
docker compose logs panel-frontend
```

## Próximos Passos

1. Acesse http://SEU_IP:3000
2. Crie seu primeiro servidor
3. Faça upload dos arquivos do Hytale
4. Autentique o servidor
5. Configure backups

## Troubleshooting

### Erro: "Cannot connect to Docker daemon"

```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Iniciar Docker
sudo systemctl start docker

# Verificar permissões
sudo usermod -aG docker $USER
newgrp docker
```

### Porta 3000 já em uso

```bash
# Encontrar processo usando a porta
sudo lsof -i :3000

# Matar processo (use com cuidado)
sudo kill -9 <PID>

# Ou editar docker-compose.yml para usar outra porta
```

### Problemas de permissão em volumes

```bash
# Corrigir permissões
sudo chown -R 1000:1000 /var/lib/docker/volumes/
```

## Desinstalação

```bash
# Parar serviços
cd ~/HyController/compose
docker compose down

# Remover volumes (CUIDADO: deleta dados dos servidores!)
docker volume prune -f

# Remover imagens
docker rmi hycontroller-runner:latest
docker rmi hycontroller-frontend:latest
docker rmi hycontroller-backend:latest

# Remover arquivos
cd ~
rm -rf HyController
```
