/* =========================
   🚀 CARREGAR LITURGIA
========================= */
async function carregarLiturgia(forceRefresh = false) {
  try {
    const hoje = new Date();
    const hojeISO = hoje.toISOString().split("T")[0];
    const chaveCache = "liturgia-" + hojeISO;

    const container = document.getElementById("liturgia-conteudo");
    if (!container) {
      console.error("Elemento #liturgia-conteudo não encontrado!");
      return;
    }

    // ⏳ CACHE
    const cacheBruto = localStorage.getItem(chaveCache);
    if (cacheBruto && !forceRefresh) {
      let cache;
      try {
        cache = JSON.parse(cacheBruto);
      } catch {
        console.warn("Cache corrompido → limpando");
        localStorage.removeItem(chaveCache);
        cache = null;
      }

      if (cache && cache.timestamp && cache.data) {
        const agora = Date.now();
        if (agora - cache.timestamp < 1000 * 60 * 60 * 6) {
          console.log("⚡ Usando cache");
          usarDados(cache.data);
          return;
        }
      }
    }

    let dados = null;

    // 🥇 SUA API
    try {
      console.log("🔵 Tentando sua API...");
      const res = await fetch("https://api-lirtugico-lux-fidei.vercel.app/cn");
      if (!res.ok) throw new Error("Erro na sua API");
      const api = await res.json();
      dados = adaptarLuxFidei(api);
      if (!dados) throw new Error("Dados inválidos");
    } catch (e1) {
      console.warn("⚠️ Sua API falhou:", e1.message);

      // 🥈 API VERCEL ANTIGA
      try {
        console.log("🟡 Tentando API antiga...");
        const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");
        if (!res.ok) throw new Error();
        const api = await res.json();
        dados = adaptarVercel(api);
        if (!dados) throw new Error("Dados inválidos");
      } catch (e2) {
        console.warn("⚠️ API antiga falhou");

        // 🥉 RAILWAY
        console.log("🔴 Tentando Railway...");
        const d = new Date();
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");

        const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);
        if (!res.ok) throw new Error("Nenhuma API respondeu");
        dados = await res.json();
      }
    }

    if (!dados) throw new Error("Nenhum dado válido recebido");

    // 💾 SALVA CACHE
    localStorage.setItem(
      chaveCache,
      JSON.stringify({
        timestamp: Date.now(),
        data: dados,
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
      container.innerHTML = `<p style="text-align:center;font-size:18px;color:#666">
        ⚠️ Não foi possível carregar a liturgia.
      </p>`;
    }
  }
}

/* =========================
   🔄 ADAPTADORES SEGUROS
========================= */
function adaptarLuxFidei(api) {
  if (!api || !api.today) return null;
  const t = api.today;
  return {
    liturgia: t.entry_title || "Liturgia do Dia",
    data: t.date || "",
    cor: t.color || "verde",
    primeiraLeitura: t.readings?.first_reading || null,
    salmo: t.readings?.psalm || null,
    segundaLeitura: t.readings?.second_reading || null,
    evangelho: t.readings?.gospel || null,
  };
}

function adaptarVercel(api) {
  if (!api) return null;
  return {
    liturgia: api.titulo || "Liturgia do Dia",
    data: api.data || "",
    cor: api.cor || "verde",
    primeiraLeitura: api.primeiraLeitura || null,
    salmo: api.salmo || null,
    segundaLeitura: api.segundaLeitura || null,
    evangelho: api.evangelho || null,
  };
}

/* =========================
   🎯 USAR DADOS SEGUROS
========================= */
function usarDados(dados) {
  if (!dados) return;
  const tituloEl = document.getElementById("liturgia-titulo");
  const dataEl = document.getElementById("liturgia-data");
  const container = document.getElementById("liturgia-conteudo");
  if (!container) return;

  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const hoje = new Date();

  if (tituloEl) tituloEl.innerText = `${dados.liturgia || "Liturgia do Dia"} — ${dados.cor || ""}`;
  if (dataEl) dataEl.innerText = `${dias[hoje.getDay()]} • ${dados.data || ""}`;

  const cores = { roxo: "#6a1b9a", verde: "#2e7d32", vermelho: "#c62828", branco: "#d4af37" };
  document.documentElement.style.setProperty("--cor-liturgica", cores[(dados.cor || "").toLowerCase()] || "#5b2c83");

  container.innerHTML = "";

  function renderLeitura(titulo, leitura) {
    if (!leitura) return;
    const referencia = leitura.referencia || "";
    let texto = leitura.texto || leitura || "";
    if (typeof texto !== "string") {
      if (Array.isArray(texto)) texto = texto.join(" ");
      else if (typeof texto === "object") texto = JSON.stringify(texto);
      else texto = String(texto);
    }
    container.innerHTML += `
      <div class="liturgia-card">
        <h2>${titulo}</h2>
        <p class="referencia">${referencia}</p>
        <div class="texto-liturgico">${formatarVersiculos(texto)}</div>
      </div>
    `;
  }

  // =========================
  // FORMATO COMPLETO
  if (dados.evangelho || dados.primeiraLeitura || dados.salmo || dados.segundaLeitura) {
    renderLeitura("Primeira Leitura", dados.primeiraLeitura);

    if (dados.salmo) {
      let salmoTexto = dados.salmo.texto || dados.salmo || "";
      if (typeof salmoTexto !== "string") {
        if (Array.isArray(salmoTexto)) salmoTexto = salmoTexto.join(" ");
        else if (typeof salmoTexto === "object") salmoTexto = JSON.stringify(salmoTexto);
        else salmoTexto = String(salmoTexto);
      }
      container.innerHTML += `
        <div class="liturgia-card salmo">
          <h2>Salmo Responsorial</h2>
          <p class="referencia">${dados.salmo.referencia || ""}</p>
          ${dados.salmo.refrao ? `<p><strong>${dados.salmo.refrao}</strong></p>` : ""}
          <div class="texto-liturgico">${formatarVersiculos(salmoTexto)}</div>
        </div>
      `;
    }

    renderLeitura("Segunda Leitura", dados.segundaLeitura);
    renderLeitura("✝️ Evangelho", dados.evangelho);
  }
  // =========================
  // FORMATO SIMPLES (Railway)
  else {
    renderLeitura("Liturgia do Dia", dados.dia);
    renderLeitura("Oferendas", dados.oferendas);
    renderLeitura("Comunhão", dados.comunhao);
    if (!dados.dia && !dados.oferendas && !dados.comunhao) {
      container.innerHTML = `<p style="text-align:center;color:#666">⚠️ Liturgia indisponível no momento.</p>`;
    }
  }

  if (typeof mostrarConteudo === "function") mostrarConteudo();
}

/* =========================
   🧠 FORMATAÇÃO DE VERSÍCULOS SEGURO
========================= */
function formatarVersiculos(texto) {
  if (texto == null) return "";
  if (typeof texto !== "string") {
    if (Array.isArray(texto)) texto = texto.join(" ");
    else if (typeof texto === "object") texto = JSON.stringify(texto);
    else texto = String(texto);
  }
  return texto.replace(/(^|\s)(\d+)(?!,\d)(?=[A-Za-zÁÉÍÓÚ])/g, (match, espaco, numero) => `${espaco}<sup>${numero}</sup> `);
}
let fontSize = 1.25;
function ajustarFonte(delta) {
    fontSize += delta * 0.1;
    document.querySelectorAll('.texto-liturgico').forEach(el => {
        el.style.fontSize = fontSize + 'rem';
    });
}
