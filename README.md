# Estuda+

Não apenas conte as horas, teste a sua absorção.

## Deploy em Produção

| Componente | URL |
|---|---|
| Frontend | https://estudamais.pages.dev |
| API Gateway | https://estudamais-apim.azure-api.net |
| BFF (Swagger) | https://estudamais-bff-production.up.railway.app/docs |
| MS Sessions (Swagger) | https://estudamais-ms-sessions-production.up.railway.app/docs |
| MS Users (Swagger) | https://estudamais-ms-users-production.up.railway.app/docs |
| Azure Function | https://estudamais-bxamfjdkcteqhrfs.eastus-01.azurewebsites.net/api/calculate-efficiency |

## Arquitetura

Sistema distribuído com microsserviços + BFF:
Frontend (React) → API Gateway (Azure APIM) → BFF (Express)
├─→ MS Sessions (MongoDB Atlas)
├─→ MS Users (PostgreSQL Railway)
└─→ Azure Function (cálculo de eficiência)

## Estrutura do Monorepo
estuda+project/
├── EstudaMais/          # Frontend React 19 + Vite
├── bff/                 # BFF — agrega MS Sessions + MS Users + Azure Function
├── ms-sessions/         # Microsserviço de sessões (MongoDB)
├── ms-users/            # Microsserviço de usuários e auth (PostgreSQL)
├── estudamais-function/ # Azure Function — cálculo de eficiência
└── backend/             # (legado) monólito original, mantido para referência

## Frontend

```bash
cd EstudaMais
npm install
cp .env.example .env
npm run dev
```

Por padrão, `VITE_API_URL` aponta para o BFF em produção. Para usar o BFF local, ajuste essa variável no `.env`.

## BFF

```bash
cd bff
npm install
cp .env.example .env
npm run dev
```

| Método | Rota | Descrição |
|---|---|---|
| GET | /aggregated-data | Agrega dados de usuário, sessões e eficiência em uma resposta |

Swagger disponível em `/docs`.

## MS Sessions (MongoDB)

```bash
cd ms-sessions
npm install
cp .env.example .env
npm run dev
```

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/sessions | Cria sessão de estudo |
| GET | /api/sessions | Lista sessões do usuário |
| GET | /api/sessions/:id | Busca sessão por id |
| PATCH | /api/sessions/:id | Atualiza sessão |
| DELETE | /api/sessions/:id | Remove sessão |

## MS Users (PostgreSQL)

```bash
cd ms-users
npm install
cp .env.example .env
npm run dev
```

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Registra novo usuário |
| POST | /api/auth/login | Autentica usuário (retorna JWT) |
| GET | /api/users/me | Retorna usuário autenticado |
| PATCH | /api/users/me | Atualiza usuário autenticado |
| DELETE | /api/users/me | Remove usuário autenticado |

## Azure Function

HTTP Trigger que calcula o índice de eficiência:
POST /api/calculate-efficiency
{ "score": 8, "durationMinutes": 60 }
→ { "efficiencyIndex": 8, "classification": "Média" }

## IA — Groq API

Geração e avaliação de quiz usa Groq (Llama 3.3 70B), gratuito:

1. Crie conta em console.groq.com
2. Gere uma API Key
3. Adicione em `ms-sessions/.env`: `GROQ_API_KEY=gsk_...`

Pool de chaves com fallback automático em caso de rate limit.

## Testes

```bash
npm run test:arch   # testes de arquitetura (ArchUnitTS)
npm test             # testes unitários de domínio
```

Implementados em BFF, MS Sessions, MS Users e Frontend — 28 testes no total.

## Segurança

- HTTPS em todos os serviços
- JWT Bearer token para autenticação (MS Users)
- Chave Groq apenas no backend — frontend nunca recebe a chave
- Azure APIM subscription key para acesso externo ao gateway

## Equipe

- Fernando Chociai
- Gabriel Coltre
- João Marcelo
- João Vitor Franzedo Carmo
- Leander Hallu

PUCPR — Projeto PJBL 2026
