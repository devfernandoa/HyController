# Contribuindo para o HyController

Obrigado por considerar contribuir para o HyController! Este documento fornece diretrizes para contribuições.

## Código de Conduta

Seja respeitoso e profissional em todas as interações. Não toleramos:
- Assédio ou discriminação
- Linguagem ofensiva
- Spam ou autopromoção excessiva
- Violação de privacidade

## Como Contribuir

### Reportando Bugs

Antes de reportar um bug:

1. **Procure issues existentes** para evitar duplicatas
2. **Verifique se está usando a versão mais recente**
3. **Teste em ambiente limpo** se possível

Ao reportar, inclua:

- **Descrição clara** do problema
- **Passos para reproduzir**
- **Comportamento esperado vs atual**
- **Screenshots/logs** se aplicável
- **Informações do ambiente**:
  - SO e versão
  - Versão do Docker
  - Versão do HyController
  - Versão do Hytale Server

Template:

```markdown
**Descrição:**
[Descrição clara do bug]

**Passos para reproduzir:**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento esperado:**
[O que deveria acontecer]

**Comportamento atual:**
[O que realmente acontece]

**Ambiente:**
- OS: Ubuntu 22.04
- Docker: 24.0.7
- HyController: v1.0.0
- Hytale Server: latest

**Logs:**
```
[Cole logs relevantes aqui]
```
```

### Sugerindo Funcionalidades

Para sugerir novas features:

1. **Verifique o roadmap** em README.md
2. **Procure issues existentes**
3. **Descreva o caso de uso**

Template:

```markdown
**Problema/Necessidade:**
[Qual problema esta feature resolve?]

**Solução proposta:**
[Como você imagina que deveria funcionar?]

**Alternativas consideradas:**
[Outras abordagens que você pensou?]

**Informações adicionais:**
[Screenshots, mockups, etc.]
```

### Pull Requests

#### Antes de começar

1. **Crie ou comente em uma issue** descrevendo o que você quer fazer
2. **Aguarde feedback** dos mantenedores
3. **Fork o repositório**

#### Durante o desenvolvimento

1. **Crie uma branch** a partir de `main`:
   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/meu-bugfix
   ```

2. **Faça commits atômicos** com mensagens descritivas:
   ```bash
   git commit -m "feat: adiciona suporte para templates de servidor"
   git commit -m "fix: corrige vazamento de memória no logs stream"
   ```

3. **Siga os padrões de código**:
   - **Backend**: ESLint padrão
   - **Frontend**: React best practices
   - **Docker**: Hadolint rules

4. **Teste suas mudanças**:
   ```bash
   # Backend
   cd panel/backend
   npm test
   
   # Frontend
   cd panel/frontend
   npm test
   
   # Build Docker
   docker build -t hycontroller-runner:test runner/
   ```

5. **Atualize documentação** se necessário

#### Enviando o Pull Request

1. **Push para seu fork**:
   ```bash
   git push origin feature/minha-feature
   ```

2. **Abra o Pull Request** no GitHub

3. **Preencha o template**:

```markdown
**Descrição:**
[O que esta PR faz?]

**Issue relacionada:**
Closes #123

**Tipo de mudança:**
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

**Checklist:**
- [ ] Código segue style guidelines
- [ ] Self-review realizado
- [ ] Comentários adicionados em código complexo
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Testes passando
- [ ] Nenhum warning novo

**Screenshots (se aplicável):**
[Adicione screenshots aqui]

**Como testar:**
1. [Passo 1]
2. [Passo 2]
```

4. **Responda a feedback** construtivamente

## Padrões de Código

### JavaScript/Node.js (Backend)

```javascript
// Use ES6+ features
import express from 'express';
const router = express.Router();

// Async/await preferível a callbacks
async function getServers() {
  try {
    const servers = await serversAPI.getAll();
    return servers;
  } catch (error) {
    console.error('Error fetching servers:', error);
    throw error;
  }
}

// Nomes descritivos
function calculateMemoryUsage(stats) {
  return stats.memory_stats.usage / 1024 / 1024; // MB
}

// Comentários para lógica complexa
// Calculate CPU percentage using Docker stats formula
const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - 
                 stats.precpu_stats.cpu_usage.total_usage;
```

### React (Frontend)

```javascript
// Componentes funcionais com hooks
function ServerCard({ server, onAction }) {
  const [loading, setLoading] = useState(false);
  
  const handleStart = async () => {
    setLoading(true);
    try {
      await onAction('start');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="server-card">
      <h3>{server.name}</h3>
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Starting...' : 'Start'}
      </button>
    </div>
  );
}

// PropTypes ou TypeScript para type safety (futuro)
ServerCard.propTypes = {
  server: PropTypes.object.isRequired,
  onAction: PropTypes.func.isRequired
};
```

### Docker

```dockerfile
# Use imagens específicas, não :latest em produção
FROM node:20-alpine

# Minimize camadas
RUN apk add --no-cache \
    curl \
    wget

# Use multi-stage builds quando apropriado
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
```

### Commits

Siga [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona template de servidor
fix: corrige bug em file upload
docs: atualiza guia de instalação
style: formata código com prettier
refactor: reorganiza estrutura de pastas
test: adiciona testes para API de logs
chore: atualiza dependências
```

## Estrutura do Projeto

```
HyController/
├── panel/
│   ├── backend/          # API Node.js/Express
│   │   ├── src/
│   │   │   ├── routes/   # Endpoints da API
│   │   │   ├── utils/    # Utilitários
│   │   │   └── server.js # Entry point
│   │   └── package.json
│   └── frontend/         # React UI
│       ├── public/
│       ├── src/
│       │   ├── pages/    # Páginas
│       │   ├── App.js
│       │   └── api.js    # API client
│       └── package.json
├── runner/               # Container Hytale
│   ├── Dockerfile
│   └── entrypoint.sh
├── compose/              # Orquestração
│   └── docker-compose.yml
├── docs/                 # Documentação
└── README.md
```

## Áreas que Precisam de Ajuda

### Alta Prioridade

- [ ] **Autenticação de usuários** - Sistema de login para o painel
- [ ] **Testes automatizados** - Unit e integration tests
- [ ] **Segurança** - Audit e hardening

### Média Prioridade

- [ ] **Métricas avançadas** - Integração com Prometheus/Grafana
- [ ] **Templates de servidor** - Configs pré-definidas
- [ ] **Backup/restore melhorado** - UI mais robusta

### Baixa Prioridade

- [ ] **Temas** - Dark/light mode
- [ ] **Internacionalização** - Suporte a múltiplos idiomas
- [ ] **Marketplace de mods** - Browser de mods integrado

## Processo de Review

Pull Requests são revisados por mantenedores. Esperamos:

1. **Funcionalidade** - A mudança faz o que promete?
2. **Qualidade** - Código é limpo e manutenível?
3. **Testes** - Mudanças estão testadas?
4. **Documentação** - Docs estão atualizadas?
5. **Segurança** - Não introduz vulnerabilidades?

O processo pode levar alguns dias. Seja paciente!

## Configurando Ambiente de Desenvolvimento

```bash
# Clone seu fork
git clone https://github.com/SEU_USUARIO/HyController.git
cd HyController

# Backend
cd panel/backend
npm install
npm run dev  # Inicia com nodemon

# Frontend (novo terminal)
cd panel/frontend
npm install
npm start  # Inicia dev server

# Runner (build local)
cd runner
docker build -t hycontroller-runner:dev .

# Compose para testes
cd compose
docker compose up
```

## Testando

### Backend

```bash
cd panel/backend
npm test
npm run lint
```

### Frontend

```bash
cd panel/frontend
npm test
npm run lint
```

### End-to-End

```bash
# Subir ambiente completo
cd compose
docker compose up -d

# Executar testes E2E (futuro)
npm run test:e2e
```

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a licença MIT do projeto.

## Dúvidas?

- Abra uma issue com a tag `question`
- Entre em contato com os mantenedores

## Agradecimentos

Agradecemos a todos os contribuidores! 🎉

Contribuições, por menores que sejam, fazem diferença!
