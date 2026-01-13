# Segurança e Modelo de Ameaças - HyController

Este documento descreve as considerações de segurança, possíveis ameaças e melhores práticas para operar o HyController de forma segura.

## Modelo de Segurança

### Separação de Responsabilidades

**Painel (Control Plane)**
- Gerencia configuração e orquestração
- Tem acesso ao Docker socket (privilégio elevado)
- Expõe API e interface web

**Runner (Data Plane)**
- Executa o servidor Hytale
- Isolado via container Docker
- Sem acesso ao Docker socket
- Executa como usuário não-root

### Perímetro de Confiança

```
Internet → Firewall → Nginx/Reverse Proxy → Painel Frontend/Backend → Docker Engine → Runner Containers
```

## Ameaças e Mitigações

### 1. Acesso Não Autorizado ao Painel

**Ameaça**: Atacante obtém acesso à interface web do painel.

**Impacto**: 
- Controle total sobre servidores Hytale
- Acesso a arquivos de configuração
- Possibilidade de executar comandos nos containers

**Mitigações**:
- [ ] Implementar autenticação de usuário (não incluída na v0)
- [x] Usar firewall para limitar acesso a IPs confiáveis
- [ ] Implementar HTTPS/TLS com certificado válido
- [ ] Rate limiting na API
- [ ] Logs de auditoria de ações

**Para v0 (single-admin)**:
```bash
# Limitar acesso apenas à rede local
sudo ufw deny 3000/tcp
sudo ufw deny 3001/tcp
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow from 192.168.1.0/24 to any port 3001
```

### 2. Escalação de Privilégios via Docker Socket

**Ameaça**: Acesso ao painel permite acesso ao socket Docker, que tem privilégios root.

**Impacto**: 
- Controle completo sobre o host
- Acesso a todos os containers
- Possibilidade de escapar do container

**Mitigações**:
- [x] Apenas painel backend tem acesso ao socket
- [x] Runner containers NÃO têm acesso ao socket
- [ ] Considerar Docker socket proxy (ex: Tecnativa/docker-socket-proxy)
- [ ] Executar painel em usuário dedicado com permissões mínimas

**Implementação recomendada**:
```yaml
# compose/docker-compose.yml
services:
  docker-proxy:
    image: tecnativa/docker-socket-proxy
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1
      - POST=1
    networks:
      - hycontroller
    
  panel-backend:
    # Remove acesso direto ao socket
    # volumes:
    #   - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_HOST=tcp://docker-proxy:2375
```

### 3. Injeção de Comandos via Console/Arquivos

**Ameaça**: Input malicioso em comandos do console ou conteúdo de arquivos.

**Impacto**:
- Execução de comandos arbitrários no container
- Modificação de arquivos críticos
- Comprometimento do servidor Hytale

**Mitigações**:
- [x] Validação de paths de arquivo (anti path-traversal)
- [ ] Sanitização de input em comandos
- [ ] Limites de tamanho de arquivo
- [ ] Whitelist de extensões permitidas
- [ ] Logs de todas as modificações

**Exemplo de validação**:
```javascript
// Prevenir path traversal
function sanitizePath(userPath) {
  const normalized = path.normalize(userPath);
  if (normalized.includes('..')) {
    throw new Error('Invalid path');
  }
  if (!normalized.startsWith('/data/')) {
    throw new Error('Access denied');
  }
  return normalized;
}
```

### 4. Exposição de Portas de Servidor

**Ameaça**: Servidores Hytale expostos diretamente à internet sem proteção.

**Impacto**:
- DDoS attacks
- Exploits em plugins/mods
- Sobrecarga de recursos

**Mitigações**:
- [x] Apenas portas UDP necessárias expostas
- [ ] Rate limiting via iptables
- [ ] Fail2ban para tentativas de ataque
- [ ] Monitoramento de tráfego
- [ ] Limite de conexões simultâneas

**Configuração de proteção**:
```bash
# Limitar taxa de novos pacotes UDP
sudo iptables -A INPUT -p udp --dport 5520 -m state --state NEW -m recent --set
sudo iptables -A INPUT -p udp --dport 5520 -m state --state NEW -m recent --update --seconds 1 --hitcount 20 -j DROP
```

### 5. Vazamento de Dados Sensíveis

**Ameaça**: Exposição de arquivos de configuração, tokens, ou dados de jogadores.

**Impacto**:
- Comprometimento de contas
- Acesso não autorizado
- Violação de privacidade

**Mitigações**:
- [x] Volumes Docker isolados por servidor
- [ ] Criptografia de dados sensíveis
- [ ] Exclusão de arquivos sensíveis de backups
- [ ] Logs não contêm informações sensíveis
- [ ] Permissões adequadas em arquivos

**Arquivos sensíveis**:
- `config.json` (pode conter tokens)
- `permissions.json`
- `bans.json`
- `whitelist.json`

### 6. Manipulação de Arquivos de Servidor em Execução

**Ameaça**: Edição de arquivos enquanto servidor está rodando pode causar corrupção.

**Impacto**:
- Perda de dados
- Crash do servidor
- Estado inconsistente

**Mitigações**:
- [x] Avisos na UI sobre edição durante execução
- [ ] Lock de arquivos críticos quando servidor está rodando
- [ ] Modo "safe apply" (stop → edit → start)
- [ ] Backup automático antes de mudanças

### 7. Exaustão de Recursos

**Ameaça**: Servidor Hytale consome todos os recursos do host.

**Impacto**:
- Painel fica inacessível
- Outros servidores afetados
- Sistema instável

**Mitigações**:
- [x] Limites de memória via JVM flags
- [ ] Limites de CPU via Docker (`--cpus`)
- [ ] Limites de I/O (`--blkio-weight`)
- [ ] Monitoramento e alertas
- [ ] Kill automático se ultrapassar limites

**Exemplo de limites**:
```yaml
services:
  hytale-server:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

## Boas Práticas

### Para Administradores

1. **Acesso Restrito**
   - Use VPN para acesso remoto
   - Firewall configurado corretamente
   - SSH com chave pública apenas

2. **Atualizações Regulares**
   - Mantenha Docker atualizado
   - Atualize imagens base
   - Patch de segurança do OS

3. **Backups**
   - Backups automáticos diários
   - Teste de restauração mensal
   - Armazenamento off-site

4. **Monitoramento**
   - Logs centralizados
   - Alertas de uso de recursos
   - Detecção de anomalias

5. **Princípio do Menor Privilégio**
   - Usuários com acesso mínimo necessário
   - Separação de ambientes (dev/prod)
   - Revisão periódica de permissões

### Para Desenvolvimento

1. **Code Review**
   - Validação de input
   - Escape de output
   - Gerenciamento de erros

2. **Dependências**
   - Audit de vulnerabilidades (`npm audit`)
   - Atualizações de segurança
   - Scanning de imagens Docker

3. **Secrets Management**
   - Nunca commitar secrets
   - Usar variáveis de ambiente
   - Considerar vault (HashiCorp Vault)

## Checklist de Segurança

Antes de colocar em produção:

- [ ] Autenticação implementada
- [ ] HTTPS configurado
- [ ] Firewall ativo e configurado
- [ ] Backups automáticos funcionando
- [ ] Logs configurados
- [ ] Limites de recursos definidos
- [ ] Docker atualizado
- [ ] Sistema operacional atualizado
- [ ] Dependências auditadas
- [ ] Acesso SSH restrito
- [ ] Port forwarding mínimo
- [ ] Monitoramento ativo

## Resposta a Incidentes

### Em caso de comprometimento:

1. **Contenção**
   ```bash
   # Parar todos os servidores
   docker stop $(docker ps -q)
   
   # Bloquear acesso externo
   sudo ufw deny 3000/tcp
   sudo ufw deny 3001/tcp
   ```

2. **Investigação**
   ```bash
   # Coletar logs
   docker compose logs > incident-logs.txt
   journalctl > system-logs.txt
   
   # Listar containers e volumes
   docker ps -a > containers.txt
   docker volume ls > volumes.txt
   ```

3. **Recuperação**
   - Restaurar de backup conhecido como bom
   - Rotacionar credenciais
   - Atualizar sistema e dependências
   - Revisar logs para ponto de entrada

4. **Pós-Incidente**
   - Documentar o incidente
   - Identificar falhas de segurança
   - Implementar correções
   - Atualizar procedimentos

## Auditoria

Comandos úteis para auditoria:

```bash
# Listar containers em execução
docker ps

# Verificar configuração de rede
docker network inspect hycontroller

# Verificar volumes e permissões
docker volume inspect hytale-<name>

# Verificar logs de acesso
docker compose logs panel-backend | grep -E "POST|PUT|DELETE"

# Verificar processos no host
ps aux | grep -E "docker|node|java"

# Verificar conexões ativas
sudo netstat -tulpn
```

## Referências

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Hytale Server Manual](https://support.hytale.com/hc/en-us/articles/hytale-server-manual)
