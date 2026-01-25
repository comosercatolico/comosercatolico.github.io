async function carregarLiturgia() {
  const res = await fetch("https://liturgia.up.railway.app/12-04");
  const dados = await res.json();

  document.getElementById("liturgia-titulo").innerText =
    dados.liturgia + " — " + dados.cor;

  document.getElementById("liturgia-data").innerText = dados.data;

  const c = document.getElementById("liturgia-conteudo");
  c.innerHTML = "";

  // Primeira Leitura
  c.innerHTML += criarLeitura(
    "Primeira Leitura",
    dados.primeiraLeitura.referencia,
    dados.primeiraLeitura.texto
  );

  // Salmo
  c.innerHTML += `
    <div class="liturgia-card salmo">
      <h2>Salmo Responsorial</h2>
      <p class="referencia">${dados.salmo.referencia}</p>
      <div class="refrao">${dados.salmo.refrao}</div>
      <div class="texto-liturgico">${dados.salmo.texto}</div>
    </div>
  `;

  // Segunda Leitura
  if (dados.segundaLeitura) {
    c.innerHTML += criarLeitura(
      "Segunda Leitura",
      dados.segundaLeitura.referencia,
      dados.segundaLeitura.texto
    );
  }
}

function criarLeitura(titulo, referencia, texto) {
  return `
    <div class="liturgia-card">
      <h2>${titulo}</h2>
      <p class="referencia">${referencia}</p>
      <div class="texto-liturgico">${texto}</div>
    </div>
  `;
}

carregarLiturgia();
