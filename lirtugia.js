import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

// Cache simples
let cache = {data: null, date: null};

app.get("/liturgia", async (req, res) => {
  const hoje = new Date().toISOString().split("T")[0];

  // usa cache se já buscou hoje
  if (cache.date === hoje && cache.data) {
    return res.json(cache.data);
  }

  try {
    const response = await fetch(
      `https://cpbjr.github.io/catholic-readings-api/readings/${hoje.slice(0,4)}/${hoje.slice(5)}.json`
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Erro ao buscar leituras" });
    }

    const dados = await response.json();
    // atualiza cache
    cache = { data: dados, date: hoje };
    res.json(dados);

  } catch (e) {
    res.status(500).json({ error: "Falha na API" });
  }
});

app.listen(3000, () => {
  console.log("Liturgia API rodando na porta 3000");
});
