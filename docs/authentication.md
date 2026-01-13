# Guia de Autenticação do Servidor Hytale

Este guia explica como autenticar servidores Hytale no HyController.

## Por Que Autenticar?

Os servidores Hytale requerem autenticação para:

- Comunicação com APIs oficiais da Hytale
- Prevenção de abuso e spam
- Acesso a recursos online
- Validação de licenças

**Limite**: 100 servidores por licença Hytale (para prevenir abuso inicial).

## Métodos de Autenticação

### Método 1: Device Authorization (Padrão)

Recomendado para a maioria dos casos.

#### Passo 1: Iniciar o servidor

1. Acesse o HyController
2. Inicie o servidor criado
3. Aguarde o servidor inicializar completamente

#### Passo 2: Abrir o Console

1. No painel do servidor, clique em **"Console"**
2. Aguarde a conexão com o console

#### Passo 3: Executar comando de autenticação

No console, digite:

```
/auth login device
```

#### Passo 4: Você verá uma resposta como:

```
===================================================================
DEVICE AUTHORIZATION
===================================================================
Visit: https://accounts.hytale.com/device
Enter code: ABCD-1234
Or visit: https://accounts.hytale.com/device?user_code=ABCD-1234
===================================================================
Waiting for authorization (expires in 900 seconds)...
```

#### Passo 5: Autorizar no navegador

1. Abra a URL em um navegador: https://accounts.hytale.com/device
2. Faça login com sua conta Hytale
3. Insira o código mostrado (ex: `ABCD-1234`)
4. Confirme a autorização

#### Passo 6: Confirmação

No console do servidor, você verá:

```
> Authentication successful! Mode: OAUTH_DEVICE
```

✅ Seu servidor está autenticado!

### Método 2: Server Provider Authentication (Para Provedores)

Se você opera muitos servidores ou precisa de autenticação automática, use o método Server Provider.

#### Requisitos

- Conta de Server Provider aprovada pela Hypixel Studios
- Client ID e Client Secret fornecidos

#### Configuração

1. Aplique para conta Server Provider: https://support.hytale.com/hc/en-us/articles/server-provider-authentication-guide

2. Após aprovação, você receberá:
   - `CLIENT_ID`
   - `CLIENT_SECRET`

3. Configure no HyController:

Crie arquivo de configuração:

```bash
# No host, criar arquivo de credenciais
mkdir -p ~/hycontroller-config
cat > ~/hycontroller-config/provider-auth.env << EOF
HYTALE_CLIENT_ID=seu_client_id_aqui
HYTALE_CLIENT_SECRET=seu_client_secret_aqui
EOF
```

4. Atualize o docker-compose.yml do servidor:

```yaml
services:
  hytale-server:
    environment:
      - HYTALE_CLIENT_ID=${HYTALE_CLIENT_ID}
      - HYTALE_CLIENT_SECRET=${HYTALE_CLIENT_SECRET}
    env_file:
      - ~/hycontroller-config/provider-auth.env
```

5. O servidor irá autenticar automaticamente no boot.

## Verificando Status de Autenticação

### Via Console

```
/auth status
```

Resposta esperada:
```
Authentication Status: AUTHENTICATED
Mode: OAUTH_DEVICE
Account: seu-email@example.com
```

### Via Logs

No painel, acesse **"Logs"** e procure por:

```
Authentication successful!
```

ou

```
Server authenticated with mode: OAUTH_DEVICE
```

## Modos de Autenticação

### 1. authenticated (Padrão, Recomendado)

```bash
--auth-mode authenticated
```

- Requer autenticação válida
- Acesso completo às APIs
- Jogadores devem ter contas Hytale válidas
- **Uso**: Servidores públicos, produção

### 2. offline (Desenvolvimento apenas)

```bash
--auth-mode offline
```

- Não requer autenticação
- APIs oficiais indisponíveis
- Jogadores não precisam de contas
- **Uso**: Testes locais, desenvolvimento de plugins

⚠️ **Aviso**: Modo offline não deve ser usado em produção!

## Alterando Modo de Autenticação

### Via Interface

1. Acesse **"Configurações"** do servidor
2. Encontre **"Modo de Autenticação"**
3. Selecione o modo desejado
4. Clique em **"Salvar Configurações"**
5. **Reinicie o servidor** para aplicar

### Via Linha de Comando

Edite o startup command do servidor:

```bash
# Modo autenticado
java -jar HytaleServer.jar --assets /data/Assets.zip --auth-mode authenticated

# Modo offline
java -jar HytaleServer.jar --assets /data/Assets.zip --auth-mode offline
```

## Troubleshooting

### "Authentication failed"

**Causas possíveis**:

1. **Código expirado** (15 minutos)
   - Solução: Execute `/auth login device` novamente

2. **Conta não possui Hytale**
   - Solução: Compre Hytale ou use outra conta

3. **Limite de servidores atingido** (100 por licença)
   - Solução: Remova servidores não utilizados ou compre outra licença

4. **Problemas de rede**
   - Solução: Verifique conectividade do container
   ```bash
   docker exec hytale-myserver ping -c 4 accounts.hytale.com
   ```

### "Server requires authentication"

O servidor não está autenticado e está em modo `authenticated`.

**Solução**:

1. Execute `/auth login device` no console, ou
2. Mude para `--auth-mode offline` (apenas para testes)

### "Device code already used"

Você tentou usar o mesmo código duas vezes.

**Solução**: Execute `/auth login device` para obter um novo código.

### "Authorization expired"

Você demorou mais de 15 minutos para autorizar.

**Solução**: Execute `/auth login device` novamente.

### Token expirou após algum tempo

Tokens de autenticação podem expirar.

**Solução**:

1. Verifique logs para erros de autenticação
2. Re-autentique usando `/auth login device`
3. Para servidores de produção, considere Server Provider authentication (auto-renew)

## Re-autenticação

Se você precisa trocar de conta ou re-autenticar:

### Método 1: Via Console

```
/auth logout
/auth login device
```

### Método 2: Deletar tokens salvos

```bash
# Entrar no container
docker exec -it hytale-myserver sh

# Deletar arquivo de autenticação (localização pode variar)
rm -f /data/.hytale-auth
rm -f /data/auth.json

# Sair e reiniciar servidor
exit
```

Depois execute `/auth login device` novamente.

## Múltiplos Servidores

### Cenário 1: Poucos servidores (<10)

Use Device Authorization para cada servidor individualmente.

**Workflow**:
1. Crie servidor 1 → autentique via `/auth login device`
2. Crie servidor 2 → autentique via `/auth login device`
3. Etc.

### Cenário 2: Muitos servidores (10+)

Aplique para Server Provider authentication.

**Vantagens**:
- Autenticação automática
- Gerenciamento centralizado
- Renovação automática de tokens
- Suporte para auto-scaling

**Requisitos**:
- Aplicação aprovada
- Infrastructure adequada
- Planos de segurança

Mais detalhes: https://support.hytale.com/hc/en-us/articles/server-provider-authentication-guide

### Cenário 3: Servidores temporários/testes

Use `--auth-mode offline`.

**Quando usar**:
- Desenvolvimento de plugins
- Testes locais
- Ambientes isolados

**Quando NÃO usar**:
- Servidores públicos
- Produção
- Quando precisar de APIs oficiais

## Segurança de Autenticação

### Boas Práticas

1. **Nunca compartilhe credenciais**
   - Client ID e Client Secret são privados
   - Não commite em Git
   - Use variáveis de ambiente

2. **Proteja tokens**
   - Tokens salvos têm privilégios completos
   - Backups de volumes podem conter tokens
   - Criptografe backups

3. **Monitore uso**
   - Verifique logs de autenticação
   - Detecte tentativas não autorizadas
   - Revogue servidores comprometidos

4. **Rotação de credenciais**
   - Para Server Providers: rotacione secrets regularmente
   - Mantenha registro de servidores ativos

### Revogando Acesso

Se um servidor foi comprometido:

1. **Via Hytale Account Portal**:
   - Acesse https://accounts.hytale.com
   - Vá para "Connected Devices/Servers"
   - Revogue o servidor comprometido

2. **Via HyController**:
   - Delete o servidor
   - Recrie com nova autenticação

## FAQ

### P: Preciso autenticar toda vez que inicio o servidor?

**R**: Não. Uma vez autenticado, o token é salvo em `/data` e reutilizado automaticamente.

### P: Posso usar a mesma conta para múltiplos servidores?

**R**: Sim, até 100 servidores por licença.

### P: O que acontece se não autenticar?

**R**: Em modo `authenticated` (padrão), o servidor não iniciará completamente. Jogadores não conseguirão conectar.

### P: Modo offline é seguro?

**R**: Para desenvolvimento local, sim. Para produção/público, **não use**.

### P: Server Provider authentication é gratuito?

**R**: Depende. Consulte https://support.hytale.com/hc/en-us/articles/server-provider-authentication-guide para detalhes de aplicação.

### P: Token pode expirar?

**R**: Tokens de Device Authorization podem expirar após longo tempo. Server Provider tokens têm auto-renewal.

### P: Preciso de internet para autenticar?

**R**: Sim, autenticação requer conexão com `accounts.hytale.com`.

## Próximos Passos

Após autenticar seu servidor:

1. [Configure permissões e whitelist](../README.md)
2. [Instale mods](../README.md#instalando-mods)
3. [Configure backups](../README.md#fazendo-backups)
4. [Abra portas para jogadores externos](docs/install-guide.md#port-forwarding-no-roteador)

## Recursos

- [Hytale Server Manual](https://support.hytale.com/hc/en-us/articles/hytale-server-manual)
- [Server Provider Authentication Guide](https://support.hytale.com/hc/en-us/articles/server-provider-authentication-guide)
- [Hytale Account Portal](https://accounts.hytale.com)
