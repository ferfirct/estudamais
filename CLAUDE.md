# Estuda+ — Guia de Arquitetura

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Lucide (`EstudaMais/`)
- **Backend**: Node.js, Express, TypeScript, better-sqlite3 (`backend/src/`)
- **IA**: Groq API (llama-3.3-70b-versatile)
- **Auth**: JWT (Bearer token)

## Padrões Obrigatórios no Backend

### Vertical Slice Architecture

Cada funcionalidade vive em `features/<nome>/`. Um slice é autossuficiente.

```
features/<nome>/
├── <nome>.types.ts       domínio: interfaces e tipos
├── <nome>.domain.ts      funções puras (sem dependências externas)
├── <nome>.schema.ts      schemas Zod para validação HTTP
├── <nome>.repository.ts  interface IXRepository + implementação SQLite
├── <nome>.service.ts     use cases (orquestram repo + domínio)
└── <nome>.routes.ts      controllers finos (≤15 linhas por handler)
```

**Dependência explícita entre slices**: quiz depende de `session.repository`, dashboard/streak/records/reviews/summary dependem de `session.repository`.

### Clean Architecture (camadas dentro do slice)

```
Domain (types, domain)
  ↑ importado por
Application (service — use cases)
  ↑ importado por
Infrastructure (repository — SQLite)
Interface (routes — HTTP adapters)
```

**Regra**: camadas superiores não conhecem Express nem SQLite diretamente.

### Shared

```
shared/
├── types/result.ts          Result<T, E>, ok(), fail()
├── middleware/errorHandler.ts  HttpError + errorHandler
├── middleware/auth.ts          requireAuth + AuthRequest
└── infra/
    ├── database.ts          singleton better-sqlite3
    └── schema.sql           DDL SQLite
```

## Clean Code — Regras

- Funções com verbos descritivos (`calculateEfficiencyIndex`, não `calcEff`)
- Máximo 20 linhas por função, um nível de abstração
- Constantes em `UPPER_SNAKE_CASE`
- Sem comentários óbvios; JSDoc só em interfaces públicas de domínio
- `Result<T, E>` para erros de domínio; `HttpError` para erros HTTP
- Injeção de dependência manual via construtores (sem frameworks DI)

## Funções de Domínio Puras (session.domain.ts)

```typescript
calculateEfficiencyIndex(score, durationMinutes) // E = nota ÷ horas
isSessionScoreCritical(score)                     // score < 6
```

## Interfaces-Chave

- `ISessionRepository` — CRUD de sessões de estudo
- `IUserRepository` — CRUD de usuários
- `IStreakRepository` — estado de freeze de streak
- `ISettingsRepository` — configurações de usuário
- `IAiService` — geração e avaliação de quiz via IA

## Adicionando um Novo Slice

1. Criar `features/<nome>/` com todos os arquivos acima
2. Implementar interface do repositório em `<nome>.repository.ts`
3. Criar use cases em `<nome>.service.ts` (recebem repositório por injeção)
4. Criar controller fino em `<nome>.routes.ts`
5. Montar o router em `server.ts`
6. Não quebrar endpoints existentes

## Endpoints Ativos

| Método | Path | Feature |
|--------|------|---------|
| POST/GET | `/api/auth/register`, `/login`, `/me` | auth |
| GET/PATCH | `/api/settings` | settings |
| POST/PATCH/GET | `/api/sessions` | session |
| POST | `/api/quiz/generate`, `/evaluate` | quiz |
| GET | `/api/dashboard/stats` | dashboard |
| GET/PATCH | `/api/streak`, `/freeze` | streak |
| GET | `/api/records`, `/:theme` | records |
| GET | `/api/reviews/due`, `/schedule` | reviews |
| GET | `/api/summary/weekly` | summary |

## Variáveis de Ambiente

```
PORT=3333
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=<obrigatório>
JWT_EXPIRES_IN=7d
GROQ_API_KEY=<obrigatório para IA>
GROQ_MODEL=llama-3.3-70b-versatile
DB_PATH=estuda.db
```

## Rodar o Projeto

```bash
# Backend
cd backend && npm run dev

# Frontend
cd EstudaMais && npm run dev
```
