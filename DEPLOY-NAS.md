# HyController - Deploy no NAS

## Pré-requisitos

- Docker instalado no NAS
- Docker Compose instalado
- Portas 3000 e 3001 disponíveis
- Pelo menos 2GB de RAM livre
- Espaço em disco suficiente para os servidores Hytale

## Instalação Rápida

### 1. Clone ou transfira o projeto para o NAS

```bash
# Via Git (se disponível)
git clone <seu-repositorio> /volume1/docker/HyController
cd /volume1/docker/HyController

# OU copie manualmente os arquivos via SFTP/SMB para:
# /volume1/docker/HyController (ou seu caminho preferido)
```

### 2. Build e inicialização

```bash
cd /volume1/docker/HyController
docker-compose up -d --build
```

### 3. Verifique se está rodando

```bash
docker-compose ps
```

Você deve ver 3 containers:
- `hycontroller-backend` (rodando)
- `hycontroller-frontend` (rodando)  
- `hycontroller-runner-builder` (exited - é normal)

### 4. Acesse a interface

Abra no navegador: `http://IP-DO-NAS:3000`

## Configuração de Portas

Se as portas padrão (3000, 3001) já estiverem em uso, edite o `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:3001"  # Altere 8001 para a porta desejada
  
  frontend:
    ports:
      - "8000:80"    # Altere 8000 para a porta desejada
    environment:
      - REACT_APP_API_URL=http://IP-DO-NAS:8001/api
      - REACT_APP_WS_URL=ws://IP-DO-NAS:8001
```

## Portas dos Servidores Hytale

Cada servidor Hytale criado usará uma porta UDP. Por padrão:
- Primeiro servidor: 5520/udp
- Segundo servidor: 5521/udp (configure manualmente)
- etc.

**Importante:** Libere essas portas no firewall do NAS para acesso externo.

## Comandos Úteis

### Ver logs
```bash
docker-compose logs -f backend    # Logs do backend
docker-compose logs -f frontend   # Logs do frontend
```

### Parar os serviços
```bash
docker-compose down
```

### Reiniciar
```bash
docker-compose restart
```

### Atualizar após mudanças no código
```bash
docker-compose up -d --build
```

### Limpar tudo (CUIDADO: remove servidores)
```bash
docker-compose down -v
docker system prune -a
```

## Backup

Os dados dos servidores Hytale ficam em volumes Docker:
- Listar volumes: `docker volume ls | grep hytale`
- Backup de um servidor: `docker run --rm -v hytale-NOME:/data -v /volume1/backups:/backup alpine tar czf /backup/hytale-NOME.tar.gz /data`

## Troubleshooting

### Backend não conecta ao Docker
Verifique se o socket do Docker está no caminho correto:
```bash
ls -la /var/run/docker.sock
```

Se estiver em outro local no seu NAS, ajuste no `docker-compose.yml`.

### Frontend não carrega
1. Limpe o cache do navegador (Ctrl+Shift+R)
2. Verifique se o backend está rodando: `http://IP-DO-NAS:3001/api/health`
3. Verifique os logs: `docker-compose logs frontend`

### Erro de permissão nos volumes
O backend precisa de permissão para acessar `/var/lib/docker/volumes`. Se houver problemas, você pode rodar o backend como root adicionando no `docker-compose.yml`:
```yaml
backend:
  user: root
```

### Servidor Hytale não inicia
1. Verifique se o ZIP contém `HytaleServer.jar` e `Assets.zip`
2. Verifique os logs: `docker logs hytale-NOME`
3. Certifique-se de que a imagem runner foi construída: `docker images | grep hycontroller-runner`

## Acesso Remoto (opcional)

### Opção 1: Reverse Proxy (Recomendado)
Use Nginx Proxy Manager ou Traefik para expor com HTTPS.

### Opção 2: Port Forwarding
No roteador, redirecione as portas:
- 3000 -> NAS:3000 (Interface Web)
- 5520-5530/UDP -> NAS:5520-5530/UDP (Servidores Hytale)

## Segurança

⚠️ **IMPORTANTE:**
- Não exponha a porta 3001 (backend) diretamente para a internet
- Use firewall para limitar acesso à porta 3000
- Considere adicionar autenticação (não incluída nesta versão)
- Mantenha o Docker atualizado

## Recursos do Sistema

### Mínimo por servidor Hytale:
- RAM: 2-4 GB
- CPU: 2 cores
- Disco: 5-10 GB

### Para o painel (backend + frontend):
- RAM: 512 MB
- CPU: 1 core  
- Disco: 500 MB

## Atualização

```bash
cd /volume1/docker/HyController
git pull  # Se usando Git
docker-compose down
docker-compose up -d --build
```
