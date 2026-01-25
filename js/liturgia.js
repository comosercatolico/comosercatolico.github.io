function mostrarLiturgia() {
  document.getElementById("conteudo").innerHTML = `
    <div class="liturgia-box">
      <div id="liturgia">Carregando Liturgia…</div>
    </div>
  `;
  carregarLiturgia(); // mesma função que você já tem
}
