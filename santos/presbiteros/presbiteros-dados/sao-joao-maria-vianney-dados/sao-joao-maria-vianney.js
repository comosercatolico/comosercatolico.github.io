// sao-joao-maria-vianney.js
// Menu compartilhado — injetado via <script src="...">
// NÃO usa document.write — usa inserção segura no DOM

(function() {
    // Cria o container do menu
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = `
<div class="sl-wrap">
  <div class="sl-cabecalho">
    <h1 class="sl-santo-nome">São João Maria Vianney</h1>
    <div class="sl-divisor">
      <span class="sl-divisor-linha"></span>
      <span class="sl-divisor-orn">✦</span>
      <span class="sl-divisor-linha"></span>
    </div>
    <p class="sl-santo-titulo">Presbítero · Pastor</p>
    <p class="sl-intro-frase">Pároco de Ars, confessor e padroeiro dos sacerdotes</p>
  </div>

  <nav class="sl-nav">
    <ul class="sl-lista">
      <li><a href="/santos/presbiteros/sao-joao-maria-vianney.html"><span class="sl-nome">História</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/ars.html"><span class="sl-nome">Ars</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/confessionario.html"><span class="sl-nome">O Confessionário</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/combate.html"><span class="sl-nome">Combate Espiritual</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/espiritualidade.html"><span class="sl-nome">Espiritualidade</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/relacoes.html"><span class="sl-nome">Relações</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/milagres.html"><span class="sl-nome">Milagres</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/morte.html"><span class="sl-nome">Morte</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/legado.html"><span class="sl-nome">Legado</span></a></li>
      <li><a href="/santos/presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/referencias.html"><span class="sl-nome">Referências</span></a></li>
    </ul>
  </nav>
</div>
`;

    // Insere o menu no início do body (antes de qualquer outro conteúdo)
    document.body.insertBefore(menuContainer.firstElementChild, document.body.firstChild);

    // Destaque automático da aba ativa
    document.addEventListener("DOMContentLoaded", function() {
        const links = document.querySelectorAll('.sl-lista a');
        const urlAtual = window.location.pathname;

        let melhorMatch = null;
        let melhorTamanho = 0;

        links.forEach(function(link) {
            const href = link.getAttribute('href');
            const arquivo = href.split('/').pop();

            if (urlAtual.endsWith(arquivo) && arquivo.length > melhorTamanho) {
                melhorMatch = link;
                melhorTamanho = arquivo.length;
            }
        });

        if (melhorMatch) {
            melhorMatch.classList.add('ativo');
        }
    });
})();
