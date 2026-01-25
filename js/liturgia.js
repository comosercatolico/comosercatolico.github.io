async function carregarLiturgia() {
  const res = await fetch("https://liturgia.up.railway.app/12-04");
  const dados = await res.json();

  document.getElementById("liturgia-titulo").innerText =
    dados.liturgia + " — " + dados.cor;

  document.getElementById("liturgia-data").innerText = dados.data;

  const c = document.getElementById("liturgia-conteudo");
  c.innerHTML = "";

  c.innerHTML += criarLeitura(
    "Primeira Leitura",
    dados.primeiraLeitura.referencia,
    dados.primeiraLeitura.texto
  );

  c.innerHTML += `
    <div class="liturgia-card salmo">
      <h2>Salmo Responsorial</h2>
      <p class="referencia">${dados.salmo.referencia}</p>
      <div class="texto-liturgico">${dados.salmo.texto}</div>
    </div>
  `;

  if (dados.segundaLeitura) {
    c.innerHTML += criarLeitura(
      "Segunda Leitura",
      dados.segundaLeitura.referencia,
      dados.segundaLeitura.texto
    );
  }

  c.innerHTML += `
    <div class="liturgia-card evangelho">
      <h2>✝️ Evangelho</h2>
      <p class="referencia"><strong>${dados.evangelho.referencia}</strong></p>
      <p><em>${dados.evangelho.titulo}</em></p>
      <div class="texto-liturgico">${dados.evangelho.texto}</div>
    </div>
  `;
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
