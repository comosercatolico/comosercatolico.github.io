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

      if (!dados || !dados.evangelho) {
        throw new Error("Dados incompletos");
      }

    } catch (e1) {

      console.warn("⚠️ Sua API falhou:", e1.message);

      // 🥈 API VERCEL ANTIGA
      try {
        console.log("🟡 Tentando API antiga...");

        const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");

        if (!res.ok) throw new Error();

        const api = await res.json();

        dados = adaptarVercel(api);

        if (!dados || !dados.evangelho) {
          throw new Error("Dados incompletos");
        }

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

    // 🛑 VALIDAÇÃO FINAL
    if (!dados) {
      throw new Error("Nenhum dado válido recebido");
    }

    // 💾 SALVA CACHE
    localStorage.setItem(chaveCache, JSON.stringify({
      timestamp: Date.now(),
      data: dados
    }));

    // 🎨 ANIMAÇÃO SUAVE
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
