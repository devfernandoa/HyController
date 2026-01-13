# GitHub Container Registry Setup

## 📦 Publicando Imagens no GHCR

### 1. Configurar Permissões no GitHub

1. Vá para o seu repositório no GitHub
2. Settings → Actions → General
3. Em "Workflow permissions", selecione:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. Clique em **Save**

### 2. Push do Código

```bash
git add .
git commit -m "Add Docker images CI/CD"
git push origin main  # ou master
```

O GitHub Actions irá automaticamente:
- ✅ Buildar as 3 imagens (backend, frontend, runner)
- ✅ Publicar no GitHub Container Registry
- ✅ Criar tags (latest, branch name, commit SHA)

### 3. Verificar o Build

1. Vá para a aba **Actions** no GitHub
2. Veja o workflow "Build and Push Docker Images" rodando
3. Aguarde ~5-10 minutos para completar

### 4. Tornar Imagens Públicas (Opcional)

Por padrão, as imagens são **privadas**. Para torná-las públicas:

1. Vá para seu perfil GitHub → **Packages**
2. Para cada imagem (backend, frontend, runner):
   - Clique na imagem
   - **Package settings**
   - Role até **Danger Zone**
   - **Change visibility** → Public
   - Confirme

## 🚀 Usando as Imagens no NAS

### Opção 1: Imagens Públicas (Recomendado)

Se tornou as imagens públicas, basta:

```bash
# 1. Copie apenas o docker-compose.ghcr.yml para o NAS
# 2. Renomeie ou crie um .env

cd /volume1/docker/HyController
cp .env.example .env
nano .env  # Edite e configure GITHUB_USERNAME

# 3. Inicie os containers
docker-compose -f docker-compose.ghcr.yml up -d
```

### Opção 2: Imagens Privadas

Se as imagens são privadas, você precisa autenticar:

```bash
# 1. Crie um Personal Access Token no GitHub
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Permissões necessárias: read:packages

# 2. Faça login no GHCR
export GITHUB_TOKEN=ghp_your_token_here
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 3. Configure o .env
cp .env.example .env
nano .env  # Defina GITHUB_USERNAME=seu_usuario

# 4. Inicie os containers
docker-compose -f docker-compose.ghcr.yml up -d
```

## 🔄 Atualizando Imagens

Quando você fizer um novo push/release:

```bash
# No NAS
cd /volume1/docker/HyController

# Pull das novas imagens
docker-compose -f docker-compose.ghcr.yml pull

# Reinicie os containers
docker-compose -f docker-compose.ghcr.yml up -d
```

## 🏷️ Usando Tags Específicas

Por padrão, usa `:latest`. Para usar uma versão específica:

```yaml
services:
  backend:
    image: ghcr.io/OWNER/hycontroller-backend:v1.0.0  # Tag específica
```

## 📋 Nomes das Imagens Publicadas

Após o build, as imagens estarão disponíveis em:

```
ghcr.io/OWNER/hycontroller-backend:latest
ghcr.io/OWNER/hycontroller-frontend:latest
ghcr.io/OWNER/hycontroller-runner:latest
```

Substitua `OWNER` pelo seu username/org do GitHub.

## 🔧 Troubleshooting

### Erro: permission denied ao fazer pull

**Solução:** As imagens estão privadas. Faça login ou torne-as públicas.

```bash
docker login ghcr.io -u YOUR_USERNAME
```

### Build falhou no GitHub Actions

**Causas comuns:**
1. ❌ Permissões do workflow não configuradas (ver passo 1)
2. ❌ Dockerfile com erros
3. ❌ Arquivos faltando no repositório

**Solução:** Veja os logs detalhados em Actions → Workflow run → Job específico

### Imagem não aparece nos Packages

**Solução:** 
1. Certifique-se que o workflow completou com sucesso
2. Espere 1-2 minutos após o build
3. Atualize a página de Packages

## 🎯 Vantagens de Usar GHCR

- ✅ **Builds automáticos** em cada push
- ✅ **Versionamento** via tags Git
- ✅ **Distribuição rápida** sem precisar buildar no NAS
- ✅ **Cache otimizado** - builds mais rápidos
- ✅ **Gratuito** para repositórios públicos e privados
- ✅ **Integração total** com GitHub

## 📝 Workflow de Desenvolvimento

```bash
# 1. Desenvolva localmente
git add .
git commit -m "Feature: nova funcionalidade"

# 2. Push para GitHub
git push origin main

# 3. GitHub Actions builda automaticamente

# 4. No NAS, atualize quando quiser
docker-compose -f docker-compose.ghcr.yml pull
docker-compose -f docker-compose.ghcr.yml up -d
```

## 🏷️ Criando Releases

Para criar versões estáveis:

```bash
# Tag a versão
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# GitHub Actions criará automaticamente:
# - ghcr.io/OWNER/hycontroller-backend:v1.0.0
# - ghcr.io/OWNER/hycontroller-backend:1.0
# - ghcr.io/OWNER/hycontroller-backend:latest
```

No NAS, use a tag específica:

```yaml
services:
  backend:
    image: ghcr.io/OWNER/hycontroller-backend:v1.0.0
```

Isso garante que você sempre rode a mesma versão, mesmo que `latest` seja atualizado.
