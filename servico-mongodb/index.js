const mongoose = require('mongoose');
const express = require('express');
const app = express();

// AQUI VOCÊ COLA AQUELA SUA CONNECTION STRING DO MONGODB ATLAS
const mongoURI = "mongodb+srv://trabalhopucquers_db_user:<password>@estudamais.xxxxx.mongodb.net/estudamais_db";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

app.get('/', (req, res) => {
  res.send('Serviço MongoDB do PJBL Rodando! 🚀');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});