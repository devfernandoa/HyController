# Perguntas Frequentes - HyController

## Geral

### O que é o HyController?

HyController é um painel de controle web completo para gerenciar servidores Hytale via Docker. Ele permite criar, gerenciar, configurar e monitorar servidores Hytale através de uma interface web moderna.

### É oficial?

Não. HyController é um projeto open-source não-oficial e não é afiliado com Hypixel Studios.

### É gratuito?

Sim! HyController é open-source sob licença MIT. Você ainda precisa possuir uma licença válida do Hytale para executar servidores.

### Posso usar em produção?

A versão atual (v0) é adequada para uso pessoal e pequenas comunidades. Para uso em produção em larga escala, considere implementar as melhorias de segurança documentadas em [docs/security.md](docs/security.md).

## Requisitos

### Qual o hardware necessário?

**Mínimo por servidor**:
- 2 CPU cores
- 4GB RAM
- 10GB armazenamento

**Recomendado**:
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD

### Qual sistema operacional é suportado?

Qualquer sistema Linux moderno com Docker:
- Ubuntu 20.04+
- Debian 11+
- CentOS 8+
- Arch Linux

Também funciona no Windows com WSL2 + Docker Desktop.

### Preciso saber programar?

Não! A instalação é feita via scripts simples e a interface é totalmente gráfica.

## Instalação

### Como instalo o HyController?

```bash
git clone <repository-url> HyController
cd HyController
./start.sh
```

Veja o [Guia de Instalação](docs/install-guide.md) completo.

### Posso instalar sem Docker?

Não. Docker é um requisito obrigatório pois garante isolamento e reprodutibilidade.

### Como atualizo o HyController?

```bash
cd HyController
git pull
cd compose
docker compose down
docker compose up -d --build
```

## Servidores

### Quantos servidores posso criar?

Tecnicamente, quantos sua máquina suportar. Porém, você está limitado a 100 servidores por licença Hytale.

### Como obtenho os arquivos do servidor?

Veja [Como Importar Arquivos do Servidor](docs/import-server.md).

Resumo:
1. Copie do Hytale Launcher, ou
2. Use o Hytale Downloader CLI, ou
3. Faça upload via interface do HyController

### Preciso autenticar cada servidor?

Sim, cada servidor precisa ser autenticado uma vez. O token é salvo e reutilizado nos próximos boots.

### Posso rodar múltiplos servidores simultaneamente?

Sim! Cada servidor roda em seu próprio container isolado.

### Como mudo a porta do servidor?

1. Acesse **Configurações** do servidor
2. Altere **"Porta UDP"**
3. Salve e reinicie

Ou edite antes de criar o servidor.

## Problemas Comuns

### Servidor não inicia

**Causas**:
- `HytaleServer.jar` ou `Assets.zip` ausentes
- Memória insuficiente
- Porta já em uso

**Solução**:
1. Verifique logs em "Logs"
2. Confirme arquivos em "Gerenciador de Arquivos"
3. Verifique memória disponível: `free -h`
4. Verifique porta: `sudo netstat -tulpn | grep 5520`

### "Cannot connect to Docker daemon"

**Causa**: Usuário não tem permissão ou Docker não está rodando.

**Solução**:
```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Jogadores não conseguem conectar

**Causas**:
- Servidor não autenticado
- Porta UDP não aberta no firewall
- Port forwarding não configurado no roteador

**Solução**:
1. Autentique: `/auth login device` no console
2. Abra porta UDP: `sudo ufw allow 5520/udp`
3. Configure port forwarding no roteador (UDP, não TCP!)

### Alto uso de RAM

**Causas**:
- `-Xmx` muito alto
- View distance muito alta
- Muitos jogadores/chunks carregados

**Solução**:
1. Reduza `-Xmx` nas configurações
2. Reduza view distance no `config.json`
3. Limite número de jogadores

### Upload de Assets.zip falha

**Causa**: Arquivo muito grande (2-4GB).

**Solução**:
Use método de Docker Volume:
```bash
sudo cp Assets.zip /var/lib/docker/volumes/hytale-myserver/_data/
```

## Gerenciamento

### Como faço backup?

**Manual**: 
- "Gerenciador de Arquivos" → Menu → "Criar Backup"

**Automático**:
- "Configurações" → Ative "Backups Automáticos"

**Via comando**:
```bash
docker run --rm -v hytale-myserver:/data -v /backups:/backup alpine \
  tar czf /backup/backup-$(date +%Y%m%d).tar.gz /data
```

### Como restauro um backup?

```bash
# Parar servidor
docker stop hytale-myserver

# Restaurar
docker run --rm -v hytale-myserver:/data -v /backups:/backup alpine \
  tar xzf /backup/backup-20260112.tar.gz -C /

# Reiniciar servidor
docker start hytale-myserver
```

### Como instalo mods?

1. Acesse "Gerenciador de Arquivos"
2. Navegue até `/data/mods/`
3. Faça upload dos arquivos `.jar` ou `.zip`
4. Reinicie o servidor

### Como edito configurações do mundo?

1. "Gerenciador de Arquivos"
2. Navegue até `/data/universe/worlds/<nome-do-mundo>/`
3. Edite `config.json`
4. Reinicie o servidor

### Posso acessar o painel remotamente?

Sim, mas configure segurança primeiro:

1. Use HTTPS (Let's Encrypt)
2. Configure firewall
3. Considere VPN
4. Implemente autenticação

Veja [docs/security.md](docs/security.md).

## Performance

### Como otimizo performance?

**JVM**:
```
-Xms4G -Xmx4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200
```

**Servidor**:
- Reduza view distance (8-12 chunks)
- Limite spawn de NPCs
- Use SSD para armazenamento
- Aumente CPU cores

**Docker**:
```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 8G
```

### Como monitoro uso de recursos?

No painel, acesse a página do servidor para ver CPU e RAM em tempo real.

Ou via linha de comando:
```bash
docker stats hytale-myserver
```

## Segurança

### É seguro expor o painel à internet?

A versão v0 não inclui autenticação de usuário. Recomendamos:

1. Acesso apenas via VPN
2. Firewall limitando IPs
3. Reverse proxy com autenticação

### Meus dados estão seguros?

Dados estão em volumes Docker persistentes. Recomendamos:

1. Backups regulares
2. Permissões adequadas
3. Criptografia de backups

### Como revogo acesso de um servidor?

1. https://accounts.hytale.com
2. "Connected Devices/Servers"
3. Revogue o servidor

Ou delete o servidor no HyController.

## Desenvolvimento

### Como contribuo?

1. Fork o repositório
2. Crie uma branch
3. Faça suas alterações
4. Teste localmente
5. Envie um Pull Request

### Como reporto bugs?

Abra uma issue no GitHub com:
- Descrição do problema
- Passos para reproduzir
- Logs relevantes
- Informações do sistema

### Posso criar plugins para o HyController?

A arquitetura atual não suporta plugins, mas você pode:
- Modificar o código fonte (é open-source!)
- Adicionar funcionalidades via Pull Request
- Criar ferramentas externas que usem a API

## Outros

### Suporta clustering/load balancing?

Não nativamente na v0. Para isso, você precisaria:
- Proxy reverso (HAProxy, Nginx)
- Sistema de referral do Hytale
- Orquestração (Kubernetes)

### Funciona com Pterodactyl/outros painéis?

Não. HyController é um painel standalone. Não é compatível com Pterodactyl ou similares.

### Posso vender acesso ao meu painel?

Tecnicamente sim (licença MIT permite uso comercial), mas:
1. Implemente segurança robusta
2. Considere implicações legais
3. Esteja ciente que é não-oficial

### Onde obtenho suporte?

- **Documentação**: README.md e docs/
- **Issues**: GitHub Issues
- **Comunidade**: Discord/Reddit da comunidade Hytale

### Roadmap / Próximas features?

Possíveis melhorias futuras:
- [ ] Autenticação de usuários
- [ ] Multi-tenancy
- [ ] Métricas avançadas (Prometheus)
- [ ] Agendamento de tarefas
- [ ] Integração com Discord
- [ ] Editor visual de configurações
- [ ] Templates de servidor
- [ ] Marketplace de mods

Contribuições são bem-vindas!
