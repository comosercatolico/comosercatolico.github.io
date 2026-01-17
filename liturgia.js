// Leituras EXEMPLO (você pode trocar depois)
const liturgiaHoje = {
  primeira: "1 Samuel 8:4-7,10-22",
  salmo: "Psalm 88",
  evangelho: "Mark 2:1-12"
};

async function buscarLeitura(titulo, referencia) {
  const ref = encodeURIComponent(referencia);
  const url = `https://bible-api.com/${ref}?translation=tb`;

  const res = await fetch(url);
  const data = await res.json();

  let texto = "";
  data.verses.forEach(v => {
    texto += `<p><strong>${v.verse}</strong> ${v.text}</p>`;
  });

  return `
    <div class="leitura">
      <h2>${titulo}</h2>
      <div class="ref">${referencia}</div>
      ${texto}
    </div>
  `;
}

async function carregarLiturgia() {
  let html = "";

  html += await buscarLeitura("Primeira Leitura", liturgiaHoje.primeira);
  html += await buscarLeitura("Salmo", liturgiaHoje.salmo);
  html += await buscarLeitura("Evangelho", liturgiaHoje.evangelho);

  document.getElementById("conteudo").innerHTML = html;
}

carregarLiturgia();
