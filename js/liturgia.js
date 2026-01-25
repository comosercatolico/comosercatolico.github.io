function mostrarLiturgia() {
  const conteudo = document.getElementById("conteudo");

  conteudo.innerHTML = `
    <div class="liturgia-box">
      <p>📖 Carregando Liturgia Diária…</p>
    </div>
  `;

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const url = `https://liturgia.up.railway.app/${dia}-${mes}`;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      // limpeza leve (opcional)
      const limpo = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/style="[^"]*"/gi, "");

      conteudo.innerHTML = `
        <div class="liturgia-box">
          ${limpo}
        </div>
      `;
    })
    .catch(() => {
      conteudo.innerHTML = `
        <div class="liturgia-box">
          <p style="color:red">Erro ao carregar a liturgia.</p>
        </div>
      `;
    });
}
