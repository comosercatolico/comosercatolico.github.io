/* =========================
   🚀 CARREGAR LITURGIA
========================= */
async function carregarLiturgia(forceRefresh = false) {
  try {
    const hoje = new Date();
    const hojeISO = hoje.toISOString().split("T")[0];
    const chaveCache = "liturgia-" + hojeISO;

    const container = document.getElementById("liturgia-conteudo");

    // 🛑 GARANTE QUE O HTML EXISTE
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

          // 🔥 AGORA ACEITA QUALQUER FORMATO VÁLIDO
          if (cache.data) {
            usarDados(cache.data);
            return;
          } else {
            console.warn("⚠️ Cache inválido → ignorando");
            localStorage.removeItem(chaveCache);
          }
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
      console.log("📦 SUA API:", api);

      dados = adaptarLuxFidei(api);
      console.log("📦 ADAPTADO:", dados);

      if (!dados) throw new Error("Dados inválidos");
    } catch (e1) {
      console.warn("⚠️ Sua API falhou:", e1.message);

      // 🥈 API VERCEL ANTIGA
      try {
        console.log("🟡 Tentando API antiga...");
        const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");
        if (!res.ok) throw new Error();

        const api = await res.json();
        console.log("📦 API ANTIGA:", api);

        dados = adaptarVercel(api);
        console.log("📦 ADAPTADO:", dados);

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
        console.log("📦 RAILWAY:", dados);
      }
    }

    // 🛑 VALIDAÇÃO FINAL (MAIS FLEXÍVEL)
    if (!dados) {
      throw new Error("Nenhum dado válido recebido");
    }

    // 💾 SALVA CACHE
    localStorage.setItem(
      chaveCache,
      JSON.stringify({
        timestamp: Date.now(),
        data: dados,
      })
    );

    // 🎨 ANIMAÇÃO
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
        <p style="text-align:center;font-size:18px;color:#666">
          ⚠️ Não foi possível carregar a liturgia.
        </p>
      `;
    }
  }
}

/* =========================
   🔄 ADAPTADORES
========================= */
function adaptarLuxFidei(api) {
  if (!api || !api.today) {
    console.error("❌ LuxFidei inválida:", api);
    return null;
  }
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
  if (!api) {
    console.error("❌ Vercel inválida:", api);
    return null;
  }
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
   🎨 USAR DADOS (SUPORTE DUPLO)
========================= */
function usarDados(dados) {
  console.log("🎯 Renderizando:", dados);

  const titulo = document.getElementById("liturgia-titulo");
  const dataEl = document.getElementById("liturgia-data");
  const container = document.getElementById("liturgia-conteudo");

  if (!container) return;

  // 📅 DIA
  const dias = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const hoje = new Date();

  if (titulo) {
    titulo.innerText = `${dados.liturgia || "Liturgia do Dia"} — ${dados.cor || ""}`;
  }

  if (dataEl) {
    dataEl.innerText = `${dias[hoje.getDay()]} • ${dados.data || ""}`;
  }

  // 🎨 COR
  let cor = (dados.cor || "").toLowerCase();
  const cores = {
    roxo: "#6a1b9a",
    verde: "#2e7d32",
    vermelho: "#c62828",
    branco: "#d4af37",
  };
  let corCSS = "#5b2c83";
  for (let nome in cores) {
    if (cor.includes(nome)) {
      corCSS = cores[nome];
    }
  }
  document.documentElement.style.setProperty("--cor-liturgica", corCSS);

  // 🧹 LIMPA
  container.innerHTML = "";

  /* =========================
     🥇 FORMATO COMPLETO
  ========================= */
  if (dados.evangelho) {
    if (dados.primeiraLeitura?.texto) {
      container.innerHTML += criarLeitura(
        "Primeira Leitura",
        dados.primeiraLeitura.referencia,
        dados.primeiraLeitura.texto
      );
    }
    if (dados.salmo?.texto) {
      container.innerHTML += `
        <div class="liturgia-card salmo">
          <h2>Salmo Responsorial</h2>
          <p class="referencia">${dados.salmo.referencia || ""}</p>
          <p><strong>${dados.salmo.refrao || ""}</strong></p>
          <div class="texto-liturgico">
            ${formatarVersiculos(dados.salmo.texto)}
          </div>
        </div>
      `;
    }
    if (dados.segundaLeitura?.texto) {
      container.innerHTML += criarLeitura(
        "Segunda Leitura",
        dados.segundaLeitura.referencia,
        dados.segundaLeitura.texto
      );
    }
    if (dados.evangelho?.texto) {
      container.innerHTML += `
        <div class="liturgia-card evangelho">
          <h2>✝️ Evangelho</h2>
          <p class="referencia">${dados.evangelho.referencia || ""}</p>
          <p><strong>${dados.evangelho.titulo || ""}</strong></p>
          <div class="texto-liturgico">
            ${formatarVersiculos(dados.evangelho.texto)}
          </div>
        </div>
      `;
    }
  }

  /* =========================
     🥈 FORMATO SIMPLES (RAILWAY)
  ========================= */
  else {
    console.warn("⚠️ Usando formato simples");
    if (dados.dia) {
      container.innerHTML += criarLeitura("Liturgia do Dia", "", dados.dia);
    }
    if (dados.oferendas) {
      container.innerHTML += criarLeitura("Oferendas", "", dados.oferendas);
    }
    if (dados.comunhao) {
      container.innerHTML += criarLeitura("Comunhão", "", dados.comunhao);
    }
    if (!dados.dia && !dados.oferendas && !dados.comunhao) {
      container.innerHTML = `
        <p style="text-align:center;color:#666">
          ⚠️ Liturgia indisponível no momento.
        </p>
      `;
    }
  }

  if (typeof mostrarConteudo === "function") {
    mostrarConteudo();
  }
}

/* =========================
   📖 COMPONENTES
========================= */
function criarLeitura(titulo, referencia, texto) {
  return `
    <div class="liturgia-card">
      <h2>${titulo}</h2>
      <p class="referencia">${referencia || ""}</p>
      <div class="texto-liturgico">
        ${formatarVersiculos(texto || "")}
      </div>
    </div>
  `;
}

/* =========================
   🧠 FORMATAÇÃO
========================= */
function formatarVersiculos(texto) {
  return (texto || "").replace(/(^|\s)(\d+)(?!,\d)(?=[A-Za-zÁÉÍÓÚ])/g,
    (match, espaco, numero) => {
      return espaco + "<sup>" + numero + "</sup> ";
    }
  );
}
