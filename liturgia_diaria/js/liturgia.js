async function carregarLiturgia() {
  try {

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");

    const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);

    if (!res.ok) {
      throw new Error("API não respondeu");
    }

    const dados = await res.json();

    // TITULO
    document.getElementById("liturgia-titulo").innerText =
      `${dados.liturgia} — ${dados.cor}`;

    // DATA
    document.getElementById("liturgia-data").innerText = dados.data;

    // COR LITÚRGICA
    let cor = dados.cor.toLowerCase();
    let corCSS = "#5b2c83";

    if (cor.includes("roxo")) corCSS = "#5b2c83";
    if (cor.includes("verde")) corCSS = "#2e7d32";
    if (cor.includes("vermelho")) corCSS = "#b71c1c";
    if (cor.includes("branco")) corCSS = "#c7a25a";

    document.documentElement.style.setProperty("--cor-liturgica", corCSS);

    const c = document.getElementById("liturgia-conteudo");
    c.innerHTML = "";

    // PRIMEIRA LEITURA
    if (dados.primeiraLeitura) {
      c.innerHTML += criarLeitura(
        "Primeira Leitura",
        dados.primeiraLeitura.referencia,
        dados.primeiraLeitura.texto
      );
    }

    // SALMO
    if (dados.salmo) {
      c.innerHTML += `
        <div class="liturgia-card salmo">
          <h2>Salmo Responsorial</h2>
          <p class="referencia">${dados.salmo.referencia}</p>
          <p><strong>${dados.salmo.refrao}</strong></p>
          <div class="texto-liturgico">${dados.salmo.texto}</div>
        </div>
      `;
    }

    // SEGUNDA LEITURA (só se existir)
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

    // EVANGELHO
    if (dados.evangelho) {
      c.innerHTML += `
        <div class="liturgia-card evangelho">
          <h2>✝️ Evangelho</h2>
          <p class="referencia">${dados.evangelho.referencia}</p>
          <p><strong>${dados.evangelho.titulo}</strong></p>
          <div class="texto-liturgico">${dados.evangelho.texto}</div>
        </div>
      `;
    }

  } catch (erro) {

    document.getElementById("liturgia-conteudo").innerHTML =
      "<p style='text-align:center;font-size:18px;color:#666'>⚠️ Não foi possível carregar a liturgia.</p>";

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
function formatarVersiculos(texto) {
  return texto.replace(/\b(\d+)(?=[A-ZÁÉÍÓÚÂÊÔÃÕ])/g, (match) => {
    return `<sup>${numeroParaSup(match)}</sup> `;
  });
}

function numeroParaSup(num) {
  const mapa = {
    "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴",
    "5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"
  };

  return num.split("").map(n => mapa[n]).join("");
}
