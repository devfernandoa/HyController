# Guia de Teste - HyController

## 🎮 Testando com Arquivos Mock

Como o Hytale ainda não foi lançado, criamos arquivos **mock** para permitir testar todas as funcionalidades do painel.

### 📦 Localização do Bundle

O bundle mock está em:
```
mock/hytale-server-mock/hytale-server-bundle.zip
```

**Tamanho:** ~5.1MB  
**Conteúdo:**
- `HytaleServer.jar` - JAR simulado (não executável)
- `Assets.zip` - Assets simulados
- `HytaleServer.aot` - Arquivo AOT simulado (5MB)
- `README.md` - Documentação

---

## 🧪 Passo a Passo de Teste

### 1️⃣ Garantir que o HyController está rodando

```bash
cd /home/fernando/Documents/HyController
./start.sh
```

Verifique se os containers estão ativos:
```bash
docker ps
```

Você deve ver:
- `hycontroller-panel-backend-1` (porta 3001)
- `hycontroller-panel-frontend-1` (porta 3000)

### 2️⃣ Acessar o painel

Abra no navegador:
```
http://localhost:3000
```

### 3️⃣ Criar um servidor mock

1. No Dashboard, clique em **"Create New Server"**

2. Preencha o formulário:
   - **Server Name:** `test-server`
   - **Memory (MB):** `1024`
   - **Server Files:** Clique e selecione `mock/hytale-server-mock/hytale-server-bundle.zip`

3. Clique em **"Create Server"**

O painel irá:
- ✅ Fazer upload do bundle (~5MB)
- ✅ Extrair os arquivos
- ✅ Criar um container Docker
- ✅ Preparar o servidor para execução

### 4️⃣ Testar funcionalidades

#### 📁 Gerenciamento de Arquivos

1. Clique no card do servidor criado
2. Vá para a aba **"Files"**
3. Teste:
   - ✅ Navegar entre diretórios
   - ✅ Ver arquivos (HytaleServer.jar, Assets.zip, etc)
   - ✅ Baixar arquivos
   - ✅ Fazer upload de novos arquivos
   - ✅ Criar pastas
   - ✅ Deletar arquivos

#### 📊 Logs

1. Vá para a aba **"Logs"**
2. Verifique:
   - ✅ Logs aparecem em tempo real
   - ✅ Filtros funcionam (Info, Warning, Error)
   - ✅ Botão "Clear Logs" funciona

#### 🖥️ Console

1. Vá para a aba **"Console"**
2. Teste comandos (mesmo que não funcionem no mock):
   ```
   /list
   /say Hello World
   /stop
   ```
3. Verifique:
   - ✅ Comandos são enviados
   - ✅ Input limpa após enviar
   - ✅ Histórico de comandos aparece

#### ⚙️ Settings

1. Vá para a aba **"Settings"**
2. Teste editar:
   - Memória alocada
   - Porta do servidor
   - Argumentos JVM
3. Clique em **"Save Settings"**

#### ▶️ Controles do Servidor

No Dashboard ou na página do servidor:
- ✅ **Start** - Inicia o container
- ✅ **Stop** - Para o container
- ✅ **Restart** - Reinicia o container
- ✅ **Delete** - Remove servidor e arquivos

---

## ⚠️ Limitações do Mock

### O que **FUNCIONA**:
- ✅ Upload e download de arquivos
- ✅ Gerenciamento de arquivos (criar, editar, deletar)
- ✅ Criação e remoção de servidores
- ✅ Controles de container (start/stop/restart)
- ✅ Interface do console
- ✅ Visualização de logs
- ✅ Edição de configurações
- ✅ Monitoramento de recursos (CPU, RAM)

### O que **NÃO funciona**:
- ❌ Execução real do servidor (não há código)
- ❌ Conexão de jogadores (não é um servidor real)
- ❌ Comandos do console (sem servidor rodando)
- ❌ Geração de logs do jogo (só logs do container)

### Por quê?

O `HytaleServer.jar` mock é apenas um arquivo ZIP válido com estrutura de JAR, mas sem código executável. Quando você clicar em "Start", o Docker tentará executar:

```bash
java -jar HytaleServer.jar
```

Mas como não há uma classe `Main` real, o processo terminará imediatamente. Isso é esperado e permite testar a interface sem o jogo real.

---

## 🔧 Troubleshooting

### Container não inicia
```bash
# Ver logs do container
docker logs hycontroller-test-server-1

# Verificar se a imagem está disponível
docker images | grep hycontroller-runner
```

### Arquivo não faz upload
- Verifique o tamanho (limite: 500MB por padrão)
- Verifique espaço em disco
- Veja logs do backend: `docker logs hycontroller-panel-backend-1`

### Porta 3000 não acessível
```bash
# Verificar se frontend está rodando
docker ps | grep panel-frontend

# Ver logs
docker logs hycontroller-panel-frontend-1

# Testar porta
curl http://localhost:3000
```

### Container reinicia constantemente
```bash
# Ver último erro
docker logs hycontroller-test-server-1 --tail 50

# Isso é esperado com o mock - o JAR não tem código real
```

---

## 🎯 Cenários de Teste Completos

### Cenário 1: Criar e Gerenciar Servidor
1. ✅ Criar servidor com bundle mock
2. ✅ Navegar pelos arquivos
3. ✅ Editar arquivo de configuração
4. ✅ Fazer backup (download)
5. ✅ Deletar servidor

### Cenário 2: Upload de Assets Customizados
1. ✅ Criar servidor
2. ✅ Ir para Files
3. ✅ Criar pasta `custom-assets/`
4. ✅ Fazer upload de arquivos
5. ✅ Verificar que aparecem na lista

### Cenário 3: Múltiplos Servidores
1. ✅ Criar `server-survival`
2. ✅ Criar `server-creative`
3. ✅ Criar `server-minigames`
4. ✅ Verificar todos no Dashboard
5. ✅ Gerenciar cada um independentemente

### Cenário 4: Monitoramento
1. ✅ Criar servidor
2. ✅ Iniciar servidor
3. ✅ Ver stats de CPU/RAM no Dashboard
4. ✅ Verificar uso de disco
5. ✅ Parar servidor e ver stats zeradas

---

## 🚀 Quando o Hytale for Lançado

Quando os arquivos reais estiverem disponíveis:

1. **Baixe o servidor oficial** do site do Hytale

2. **Substitua o mock** pelos arquivos reais:
   ```bash
   # Dentro do HyController
   rm mock/hytale-server-mock/hytale-server-bundle.zip
   
   # Crie novo bundle com arquivos reais
   cd ~/Downloads/hytale-server-official
   zip -r hytale-server-bundle.zip *
   ```

3. **Use o bundle real** no painel

4. **Tudo funcionará automaticamente:**
   - ✅ Servidor executará de verdade
   - ✅ Comandos do console funcionarão
   - ✅ Logs reais aparecerão
   - ✅ Jogadores poderão conectar

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs:**
   ```bash
   docker logs hycontroller-panel-backend-1
   docker logs hycontroller-panel-frontend-1
   ```

2. **Reinicie os containers:**
   ```bash
   docker-compose -f compose/docker-compose.yml restart
   ```

3. **Reconstrua se necessário:**
   ```bash
   docker-compose -f compose/docker-compose.yml up -d --build
   ```

4. **Veja a FAQ:** `docs/FAQ.md`

---

## ✅ Checklist de Teste

Use este checklist para validar todas as funcionalidades:

- [ ] Dashboard carrega sem erros
- [ ] Criar novo servidor funciona
- [ ] Upload do bundle completa
- [ ] Servidor aparece na lista
- [ ] Clicar no servidor abre detalhes
- [ ] Aba Files mostra arquivos corretos
- [ ] Download de arquivo funciona
- [ ] Upload de arquivo funciona
- [ ] Criar pasta funciona
- [ ] Deletar arquivo funciona
- [ ] Aba Console aparece
- [ ] Enviar comando no console funciona
- [ ] Aba Logs aparece
- [ ] Filtros de log funcionam
- [ ] Aba Settings mostra configurações
- [ ] Editar settings funciona
- [ ] Botão Start inicia container
- [ ] Botão Stop para container
- [ ] Botão Restart funciona
- [ ] Botão Delete remove servidor
- [ ] Stats (CPU/RAM) aparecem

---

**Pronto!** Agora você pode testar completamente o HyController mesmo antes do lançamento do Hytale! 🎮
