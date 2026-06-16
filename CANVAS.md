# Software Architecture Canvas — Estuda+

## Caso de Negócio
Plataforma web que permite ao estudante cronometrar sessões de estudo, ser avaliado por IA e medir o índice de eficiência cognitiva. E = Nota / Horas. "Não apenas conte as horas, teste a sua absorção."

## Visão Funcional
- Registro de tema e cronometragem de sessões
- Quiz dinâmico gerado por IA (Groq / Llama 3.3 70B)
- Múltiplos tipos de questão (múltipla escolha, somatória, dissertativa)
- Cálculo do índice de eficiência (Azure Function serverless)
- Dashboard com gráficos de evolução
- Flashcards com spaced repetition
- Streak system com freeze semanal
- Endpoint BFF GET /aggregated-data

## Contexto de Negócio
- Público: estudantes de vestibular e concurso público
- Técnica: Active Recall comprovada pela ciência
- Diferencial: mede absorção, não só tempo de estudo
- Groq API: 1M tokens/dia gratuito

## Restrições Organizacionais
- Projeto acadêmico PUCPR — PJBL 2026
- 5 integrantes generalistas
- Custo zero (free tier em todos os serviços)
- Azure SQL bloqueado na subscription estudante → substituído por PostgreSQL Railway (ADR-05)
- Prazo: junho 2026

## Metas de Qualidade
1. Usabilidade — interface minimalista
2. Confiabilidade da IA — questões relevantes ao tema
3. Desempenho — quiz gerado em menos de 10s
4. Acessibilidade — ARIA + contraste
5. Manutenibilidade — Clean Architecture
6. Escalabilidade — microserviços independentes

## Estilo Arquitetural
- Microserviços + BFF + Database per Service
- Serverless (Azure Function)
- Clean Architecture + Vertical Slice
- API Gateway (Azure APIM)
- EDA — coordenação assíncrona via Promise.allSettled
- Microfrontend (React 19 SPA independente)

## Restrições Técnicas
- Groq API (sem modelo local)
- MongoDB Atlas M0 (max 512MB)
- Railway free tier ($4.81/mês)
- Internet obrigatória para IA e bancos
- Node.js 20 + TypeScript strict
- Swagger OpenAPI em todos os serviços

## Hipóteses Arquiteturais
- Frontend consome apenas o BFF, nunca os microserviços diretamente
- BFF sem lógica de negócio — apenas agrega e faz proxy
- Sessão sempre persistida antes de chamar a IA
- Cada microserviço com banco próprio (Database per Service)

## Desafios e Riscos
- Dependência da Groq API (rate limit 30 req/min)
- Railway free tier com limite de crédito mensal
- Azure SQL indisponível na subscription estudante
- Cold start da Azure Function
- Qualidade variável das respostas da IA
