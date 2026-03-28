async function carregarLiturgia() {
  try {

    const hoje = new Date().toISOString().split("T")[0];

    // 🔥 CACHE
    const cache = localStorage.getItem("liturgia-" + hoje);
    if (cache) {
      usarDados(JSON.parse(cache));
      return;
    }

    let dados;

    // 🥇 API PRINCIPAL (VERCEL)
    try {
      const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");

      if (!res.ok) throw new Error();

      dados = await res.json();

      // adapta formato da API nova → padrão antigo
      dados = adaptarVercel(dados);

    } catch {

      // 🥈 FALLBACK (RAILWAY)
      const d = new Date();
      const dia = String(d.getDate()).padStart(2, "0");
      const mes = String(d.getMonth() + 1).padStart(2, "0");

      const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);

      if (!res.ok) throw new Error("Nenhuma API respondeu");

      dados = await res.json();
    }

    // 💾 SALVA CACHE
    localStorage.setItem("liturgia-" + hoje, JSON.stringify(dados));

    usarDados(dados);

  } catch (erro) {

    document.getElementById("liturgia-conteudo").innerHTML =
      "<p style='text-align:center;font-size:18px;color:#666'>⚠️ Não foi possível carregar a liturgia.</p>";

    console.error(erro);
  }
}


// 🔄 ADAPTA API NOVA (VERCEL → SEU FORMATO)
function adaptarVercel(api) {
  return {
    liturgia: api.titulo || "Liturgia do Dia",
    data: api.data || "",
    cor: api.cor || "verde",

    primeiraLeitura: api.primeiraLeitura ? {
      referencia: api.primeiraLeitura.referencia,
      texto: api.primeiraLeitura.texto
    } : null,

    salmo: api.salmo ? {
      referencia: api.salmo.referencia,
      refrao: api.salmo.refrao,
      texto: api.salmo.texto
    } : null,

    segundaLeitura: api.segundaLeitura ? {
      referencia: api.segundaLeitura.referencia,
      texto: api.segundaLeitura.texto
    } : null,

    evangelho: api.evangelho ? {
      referencia: api.evangelho.referencia,
      titulo: api.evangelho.titulo,
      texto: api.evangelho.texto
    } : null
  };
}


// 🎨 USA OS DADOS (SEU CÓDIGO ORIGINAL MELHORADO)
function usarDados(dados) {

  document.getElementById("liturgia-titulo").innerText =
    `${dados.liturgia} — ${dados.cor}`;

  document.getElementById("liturgia-data").innerText = dados.data;

  // 🎨 COR LITÚRGICA
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
        <div class="texto-liturgico">
          ${formatarVersiculos(dados.salmo.texto)}
        </div>
      </div>
    `;
  }

  // SEGUNDA LEITURA
  if (dados.segundaLeitura && dados.segundaLeitura.texto?.trim()) {
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
        <div class="texto-liturgico">
          ${formatarVersiculos(dados.evangelho.texto)}
        </div>
      </div>
    `;
  }
}


// 🔥 LEITURAS
function criarLeitura(titulo, referencia, texto) {
  return `
    <div class="liturgia-card">
      <h2>${titulo}</h2>
      <p class="referencia">${referencia}</p>
      <div class="texto-liturgico">
        ${formatarVersiculos(texto)}
      </div>
    </div>
  `;
}


// 🧠 FORMATAÇÃO
function formatarVersiculos(texto) {
  return texto.replace(/(^|\\s)(\\d+)(?!,\\d)(?=[A-Za-zÁÉÍÓÚÂÊÔÃÕáéíóúâêôãõ])/g,
    (match, espaco, numero) => {
      return espaco + "<sup>" + numeroParaSup(numero) + "</sup> ";
    }
  );
}


// 🔢 SOBRESCRITO
function numeroParaSup(num) {
  const mapa = {
    "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴",
    "5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"
  };

  return num.split("").map(n => mapa[n]).join("");
}
