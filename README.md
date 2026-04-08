# Estuda+

> Não apenas conte as horas, teste a sua absorção.

Deploy do frontend: https://black-bay-0bad40610.6.azurestaticapps.net/

## Estrutura do monorepo

```
estuda+project/
├── EstudaMais/   # Frontend React 19 + Vite
└── backend/      # Backend Node.js + Express + TypeScript
```

## Backend (TypeScript)

### Instalação

```bash
cd backend
npm install
cp .env.example .env
# edite .env e coloque sua GROQ_API_KEY (grátis em console.groq.com)
```

### Chave de API gratuita (Groq)

O backend usa o **Groq** como provider de IA, que é 100% gratuito:

1. Acesse https://console.groq.com
2. Crie conta (só e-mail, sem cartão de crédito)
3. Em "API Keys", clique em "Create API Key"
4. Cole a chave no `.env`: `GROQ_API_KEY=gsk_...`

**Tier gratuito:** 30 req/min, 14.400 req/dia rodando Llama 3.3 70B. Mais que suficiente para uso pessoal/acadêmico.

### Scripts

```bash
npm run dev        # desenvolvimento com hot reload (tsx watch)
npm run build      # compila TypeScript para dist/
npm start          # roda build compilado
npm run typecheck  # valida tipos sem emitir
```

### Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/api/health` | Health check |
| POST   | `/api/sessions` | Cria sessão (`{ theme, startTime? }`) |
| PATCH  | `/api/sessions/:id` | Atualiza sessão ao finalizar |
| GET    | `/api/sessions` | Lista sessões (`?needsReview=true` filtra score < 6) |
| GET    | `/api/sessions/:id` | Detalhe de uma sessão |
| POST   | `/api/quiz/generate` | Gera quiz via Anthropic |
| POST   | `/api/quiz/evaluate` | Avalia respostas e salva score |
| GET    | `/api/dashboard/stats` | Agregados para o dashboard |

Persistência: arquivo `backend/db.json` criado automaticamente.

Todos os erros retornam `{ error: string, details?: unknown }`.

## Frontend (React + Vite)

### Instalação

```bash
cd EstudaMais
npm install
cp .env.example .env
# opcional: ajuste VITE_API_URL se o backend rodar em outro host
npm run dev
```

### Camada de API

Toda comunicação com o backend (e, por consequência, com a Anthropic) passa por
`src/api/`:

```js
import { sessionsApi, quizApi, dashboardApi, ApiError } from './api';

const session = await sessionsApi.createSession('Leis de Newton');
const { questions } = await quizApi.generateQuiz({
  sessionId: session.id,
  theme: session.theme,
  durationMinutes: 25,
});
```

O cliente HTTP centralizado (`src/api/client.js`) trata erros via `ApiError` e
garante degradação graciosa quando o backend está offline.

## Rodando tudo em desenvolvimento

Em dois terminais:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd EstudaMais && npm run dev
```

Frontend em `http://localhost:5173`, backend em `http://localhost:3333`.

## Segurança

A `GROQ_API_KEY` vive **apenas** no backend. O frontend nunca recebe ou
embute a chave — toda geração/avaliação de quiz é proxied pelo Express.
