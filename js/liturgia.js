function mostrarLiturgia() {
  const conteudo = document.getElementById("conteudo");

  conteudo.innerHTML = `
    <h2>Liturgia Diária</h2>
    <p>Carregando liturgia...</p>
  `;

  // data de hoje no formato DD-MM
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const url = `https://liturgia.up.railway.app/${dia}-${mes}`;

  fetch(url)
    .then(res => res.text())
    .then(html => {
      conteudo.innerHTML = `
        <h2>Liturgia Diária</h2>
        <div style="text-align:left; max-width:800px; margin:auto;">
          ${html}
        </div>
      `;
    })
    .catch(err => {
      conteudo.innerHTML = `
        <h2>Erro</h2>
        <p>Não foi possível carregar a liturgia.</p>
      `;
      console.error(err);
    });
}
