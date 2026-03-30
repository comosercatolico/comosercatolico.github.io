/* =========================
   🚀 CARREGAR LITURGIA
========================= */
async function carregarLiturgia(forceRefresh = false) {
  try {
    const hoje = new Date();
    const hojeISO = hoje.toISOString().split("T")[0];
    const chaveCache = "liturgia-" + hojeISO;

    const container = document.getElementById("liturgia-conteudo");
    if (!container) return console.error("❌ #liturgia-conteudo não encontrado");

    // =========================
    // ⏳ CACHE
    const cacheBruto = localStorage.getItem(chaveCache);
    if (cacheBruto && !forceRefresh) {
      try {
        const cache = JSON.parse(cacheBruto);
        if (cache?.timestamp && cache?.data) {
          if (Date.now() - cache.timestamp < 1000 * 60 * 60 * 6) {
            console.log("⚡ Cache usado");
            return usarDados(cache.data);
          }
        }
      } catch {
        localStorage.removeItem(chaveCache);
      }
    }

    let dados = null;

    // =========================
    // 🥇 SUA API
    try {
      const res = await fetch("https://api-lirtugico-lux-fidei.vercel.app/cn");
      if (!res.ok) throw new Error();
      const api = await res.json();
      dados = adaptarLuxFidei(api);
      if (!dados) throw new Error();
    } catch {
      console.warn("⚠️ API principal falhou");

      // 🥈 API ANTIGA
      try {
        const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");
        if (!res.ok) throw new Error();
        const api = await res.json();
        dados = adaptarVercel(api);
        if (!dados) throw new Error();
      } catch {
        console.warn("⚠️ API antiga falhou");

        // 🥉 RAILWAY
        const d = new Date();
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");

        const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);
        if (!res.ok) throw new Error("Nenhuma API respondeu");
        dados = await res.json();
      }
    }

    if (!dados) throw new Error("Sem dados válidos");

    // 💾 SALVAR CACHE
    localStorage.setItem(
      chaveCache,
      JSON.stringify({
        timestamp: Date.now(),
        data: dados
      })
    );

    container.style.opacity = 0;
    setTimeout(() => {
      usarDados(dados);
      container.style.opacity = 1;
    }, 200);

  } catch (erro) {
    console.error("❌ Erro geral:", erro);
    const container = document.getElementById("liturgia-conteudo");
    if (container) {
      container.innerHTML = `
        <p style="text-align:center;color:#666;font-size:18px">
          ⚠️ Não foi possível carregar a liturgia.
        </p>`;
    }
  }
}

/* =========================
   🔄 ADAPTADORES
========================= */
function adaptarLuxFidei(api) {
  if (!api?.today) return null;

  return {
    liturgia: api.today.entry_title,
    data: api.today.date,
    cor: api.today.color,
    primeiraLeitura: api.today.readings?.first_reading,
    salmo: api.today.readings?.psalm,
    segundaLeitura: api.today.readings?.second_reading,
    evangelho: api.today.readings?.gospel
  };
}

function adaptarVercel(api) {
  if (!api) return null;

  return {
    liturgia: api.titulo,
    data: api.data,
    cor: api.cor,
    primeiraLeitura: api.primeiraLeitura,
    salmo: api.salmo,
    segundaLeitura: api.segundaLeitura,
    evangelho: api.evangelho
  };
}

/* =========================
   🎯 RENDERIZAÇÃO
========================= */
function usarDados(dados) {
  const tituloEl = document.getElementById("liturgia-titulo");
  const dataEl = document.getElementById("liturgia-data");
  const container = document.getElementById("liturgia-conteudo");

  if (!container) return;

  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const hoje = new Date();

  if (tituloEl) tituloEl.innerText = `${dados.liturgia || "Liturgia do Dia"} — ${dados.cor || ""}`;
  if (dataEl) dataEl.innerText = `${dias[hoje.getDay()]} • ${dados.data || ""}`;

  const cores = {
    roxo: "#6a1b9a",
    verde: "#2e7d32",
    vermelho: "#c62828",
    branco: "#d4af37"
  };

  document.documentElement.style.setProperty(
    "--cor-liturgica",
    cores[(dados.cor || "").toLowerCase()] || "#5b2c83"
  );

  container.innerHTML = "";

  function renderLeitura(titulo, leitura) {
    if (!leitura) return;

    const referencia = leitura?.referencia || leitura?.title || "";

    let texto = leitura?.texto || leitura?.text || leitura?.conteudo || leitura;

    // normalização total
    if (typeof texto !== "string") {
      if (Array.isArray(texto)) texto = texto.join(" ");
      else if (typeof texto === "object") texto = texto.text || texto.conteudo || "";
      else texto = String(texto);
    }

    // remove título duplicado no início
    texto = texto.replace(/^Primeira Leitura.*?\.\s*/i, "");

    container.innerHTML += `
      <div class="liturgia-card">
        <h2>${titulo}</h2>
        ${referencia ? `<p class="referencia">${referencia}</p>` : ""}
        <div class="texto-liturgico">
          ${formatarVersiculos(texto)}
        </div>
      </div>
    `;
  }

  // =========================
  // FORMATO COMPLETO
  if (dados.evangelho || dados.primeiraLeitura) {
    renderLeitura("Primeira Leitura", dados.primeiraLeitura);

    if (dados.salmo) {
      let salmoTexto = dados.salmo?.texto || dados.salmo;

      if (typeof salmoTexto !== "string") {
        if (Array.isArray(salmoTexto)) salmoTexto = salmoTexto.join(" ");
        else if (typeof salmoTexto === "object") salmoTexto = salmoTexto.text || "";
        else salmoTexto = String(salmoTexto);
      }

      container.innerHTML += `
        <div class="liturgia-card salmo">
          <h2>Salmo Responsorial</h2>
          <p class="referencia">${dados.salmo?.referencia || ""}</p>
          ${dados.salmo?.refrao ? `<p><strong>${dados.salmo.refrao}</strong></p>` : ""}
          <div class="texto-liturgico">
            ${formatarVersiculos(salmoTexto)}
          </div>
        </div>
      `;
    }

    renderLeitura("Segunda Leitura", dados.segundaLeitura);
    renderLeitura("✝️ Evangelho", dados.evangelho);
  } else {
    renderLeitura("Liturgia do Dia", dados.dia);
    renderLeitura("Oferendas", dados.oferendas);
    renderLeitura("Comunhão", dados.comunhao);

    if (!dados.dia && !dados.oferendas && !dados.comunhao) {
      container.innerHTML = `
        <p style="text-align:center;color:#666">
          ⚠️ Liturgia indisponível no momento.
        </p>`;
    }
  }
}

/* =========================
   🧠 FORMATAÇÃO FINAL
========================= */
function formatarVersiculos(texto) {
  if (!texto) return "";

  if (typeof texto !== "string") {
    if (Array.isArray(texto)) texto = texto.join(" ");
    else if (typeof texto === "object") texto = texto.text || texto.conteudo || "";
    else texto = String(texto);
  }

  // remove JSON lixo
  texto = texto.replace(/^\{.*?"text"\s*:\s*"/, "");
  texto = texto.replace(/"\}$/, "");

  // limpa escape
  texto = texto.replace(/\\"/g, '"');

  // quebra parágrafo
  texto = texto.replace(/\n/g, "<br><br>");

  // versículos
  texto = texto.replace(
    /(^|\s)(\d+)(?!,\d)(?=[A-Za-zÁÉÍÓÚ])/g,
    (m, espaco, num) => `${espaco}<sup>${num}</sup> `
  );

  return texto.trim();
}
