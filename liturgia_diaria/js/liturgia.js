async function carregarLiturgia(forceRefresh = false) {
  try {

    const hoje = new Date();
    const hojeISO = hoje.toISOString().split("T")[0];
    const chaveCache = "liturgia-" + hojeISO;

    // ⏳ EXPIRA EM 6 HORAS
    const cacheBruto = localStorage.getItem(chaveCache);

    if (cacheBruto && !forceRefresh) {
      const cache = JSON.parse(cacheBruto);

      const agora = Date.now();
      if (agora - cache.timestamp < 1000 * 60 * 60 * 6) {
        usarDados(cache.data);
        return;
      }
    }

    let dados;

    // 🥇 SUA API (PRIORIDADE AGORA)
    try {
      const res = await fetch("https://api-lirtugico-lux-fidei.vercel.app/cn");

      if (!res.ok) throw new Error("Erro na sua API");

      const api = await res.json();

      dados = adaptarLuxFidei(api);

    } catch (e1) {

      console.warn("Sua API falhou, tentando Vercel antiga...");

      try {
        const res = await fetch("https://api-liturgia-diaria.vercel.app/cn");

        if (!res.ok) throw new Error();

        const api = await res.json();

        dados = adaptarVercel(api);

      } catch (e2) {

        console.warn("Fallback 2... Railway");

        const d = new Date();
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");

        const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`);

        if (!res.ok) throw new Error("Nenhuma API respondeu");

        dados = await res.json();
      }
    }

    // 💾 SALVA CACHE COM TIMESTAMP
    localStorage.setItem(chaveCache, JSON.stringify({
      timestamp: Date.now(),
      data: dados
    }));

    usarDados(dados);

  } catch (erro) {

    document.getElementById("liturgia-conteudo").innerHTML =
      "<p style='text-align:center;font-size:18px;color:#666'>⚠️ Não foi possível carregar a liturgia.</p>";

    console.error(erro);
  }
}
