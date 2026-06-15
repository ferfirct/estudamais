# servico-mongodb

Serviço de validação de conectividade com o MongoDB Atlas (Estuda+). Usado para testar a connection string antes de integrar ao microsserviço de sessões.

## Stack

- Node.js
- Express
- Mongoose
- MongoDB Atlas M0 (free tier)

## Como rodar

```bash
npm install
# edite index.js e substitua <password> pela senha do Atlas
node index.js
# servidor em http://localhost:3000
```

## Nota

Este serviço é auxiliar/diagnóstico. O microsserviço de sessões em produção é `estudamais-ms-sessions`.

## Equipe

Fernando Chociai  
Gabriel Coltre  
João Marcelo  
João Vitor Franzedo Carmo  
Leander Hallu  

PUCPR — Projeto PJBL 2026
