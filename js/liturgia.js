async function carregarLiturgia() {
  try {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");

    const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);
    const dados = await res.json();

    document.getElementById("liturgia-titulo").innerText =
      `${dados.liturgia} — ${dados.cor}`;
let cor = dados.cor.toLowerCase();

let corCSS = "#5b2c83";

if(cor.includes("roxo")) corCSS = "#4a2c6d";      // quaresma
if(cor.includes("verde")) corCSS = "#2e7d32";     // tempo comum
if(cor.includes("vermelho")) corCSS = "#b71c1c";  // mártires
if(cor.includes("branco")) corCSS = "#c7b46a";    // solenidades

document.documentElement.style.setProperty("--cor-liturgica", corCSS);;

document.documentElement.style.setProperty("--cor-liturgica", corCSS);
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
        <p><strong>${dados.salmo.refrao}</strong></p>
        <div class="texto-liturgico">${dados.salmo.texto}</div>
      </div>
    `;

   // Segunda Leitura (somente se existir de verdade)
if (
  dados.segundaLeitura &&
  dados.segundaLeitura.texto &&
  dados.segundaLeitura.texto.trim() !== ""
) {
  c.innerHTML += criarLeitura(
    "Segunda Leitura",
    dados.segundaLeitura.referencia,
    dados.segundaLeitura.texto
  );
}

    // Evangelho
    c.innerHTML += `
      <div class="liturgia-card evangelho">
        <h2>✝️ Evangelho</h2>
        <p class="referencia">${dados.evangelho.referencia}</p>
        <p><strong>${dados.evangelho.titulo}</strong></p>
        <div class="texto-liturgico">${dados.evangelho.texto}</div>
      </div>
    `;

  } catch (erro) {
    document.getElementById("liturgia-conteudo").innerHTML =
      "<p>Erro ao carregar a liturgia.</p>";
    console.error(erro);
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
