const menuHTML = `
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
      <li><a href="presbiteros/sao-joao-maria-vianney.html"><span class="sl-nome">História</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/ars.html"><span class="sl-nome">Ars</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/confessionario.html"><span class="sl-nome">O Confessionário</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/combate.html"><span class="sl-nome">Combate Espiritual</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/espiritualidade.html"><span class="sl-nome">Espiritualidade</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/relacoes.html"><span class="sl-nome">Relações</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/milagres.html"><span class="sl-nome">Milagres</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/morte.html"><span class="sl-nome">Morte</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/legado.html"><span class="sl-nome">Legado</span></a></li>
      <li><a href="presbiteros/presbiteros-dados/sao-joao-maria-vianney-dados/referencias.html"><span class="sl-nome">Referências</span></a></li>
    </ul>
  </nav>
</div>

<style>
  /* ===== WRAPPER ===== */
  .sl-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px 0;
    font-family: Georgia, 'Times New Roman', serif;
  }

  /* ===== CABEÇALHO COM NOME DO SANTO ===== */
  .sl-cabecalho {
    text-align: center;
    margin-bottom: 30px;
  }

  .sl-santo-nome {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 42px;
    font-weight: 400;
    color: #2f2a22;
    letter-spacing: 2px;
    margin: 0 0 14px;
    line-height: 1.15;
  }

  .sl-divisor {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 12px 0;
  }

  .sl-divisor-linha {
    display: inline-block;
    width: 60px;
    height: 1px;
    background: #b08a3c;
    opacity: 0.5;
  }

  .sl-divisor-orn {
    color: #b08a3c;
    font-size: 10px;
  }

  .sl-santo-titulo {
    margin: 8px 0 14px;
    color: #b08a3c;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12px;
    letter-spacing: 4px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .sl-intro-frase {
    margin: 0;
    color: #6f6758;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    font-style: italic;
    letter-spacing: 0.5px;
  }

  /* ===== NAVEGAÇÃO ===== */
  .sl-nav {
    border-top: 1px solid #d8d1c2;
    border-bottom: 1px solid #d8d1c2;
    background: #faf8f3;
    padding: 4px 0;
  }

  /* GRID FORÇA 5 COLUNAS = 2 LINHAS DE 5 */
  .sl-lista {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .sl-lista li {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* REMOVE QUALQUER MARCADOR / ÍCONE ESTRANHO */
  .sl-lista li::marker,
  .sl-lista li::before {
    content: "" !important;
    display: none !important;
  }

  .sl-lista li a {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-decoration: none;
    color: #6e6a60;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 18px 12px;
    position: relative;
    transition: all 0.3s ease;
    background: transparent;
    min-height: 56px;
    box-sizing: border-box;
  }

  /* GARANTE QUE NENHUM ÍCONE/PSEUDOELEMENTO APAREÇA */
  .sl-lista li a::before,
  .sl-lista li a span::before,
  .sl-lista li a span::after {
    content: none !important;
    display: none !important;
  }

  .sl-lista .sl-nome {
    display: inline-block;
    line-height: 1.3;
  }

  /* LINHA DOURADA INFERIOR */
  .sl-lista li a::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 8px;
    width: 0;
    height: 1px;
    background-color: #b08a3c;
    transition: width 0.3s ease;
    transform: translateX(-50%);
  }

  .sl-lista li a:hover {
    color: #2f2a22;
    background-color: #f3eee3;
  }

  .sl-lista li a:hover::after {
    width: 50%;
  }

  .sl-lista li a.ativo {
    color: #2f2a22;
    background-color: #f5f0e5;
  }

  .sl-lista li a.ativo::after {
    width: 50%;
  }

  /* ===== RESPONSIVO ===== */
  @media (max-width: 900px) {
    .sl-santo-nome {
      font-size: 32px;
      letter-spacing: 1px;
    }

    .sl-lista li a {
      font-size: 11px;
      letter-spacing: 1.5px;
      padding: 14px 8px;
    }
  }

  @media (max-width: 600px) {
    .sl-wrap {
      padding: 24px 12px 0;
    }

    .sl-santo-nome {
      font-size: 24px;
    }

    .sl-santo-titulo {
      font-size: 10px;
      letter-spacing: 3px;
    }

    .sl-intro-frase {
      font-size: 13px;
      padding: 0 10px;
    }

    /* No mobile, mantém 5 colunas mas reduz drasticamente o tamanho */
    .sl-lista li a {
      font-size: 9.5px;
      letter-spacing: 1px;
      padding: 12px 4px;
      min-height: 50px;
    }
  }

  @media (max-width: 420px) {
    .sl-lista li a {
      font-size: 8.5px;
      padding: 10px 3px;
      letter-spacing: 0.5px;
    }
  }
</style>
`;

document.write(menuHTML);

document.addEventListener("DOMContentLoaded", function() {
    const links = document.querySelectorAll('.sl-lista a');
    const urlAtual = window.location.pathname;
    
    let melhorMatch = null;
    let melhorTamanho = 0;

    links.forEach(link => {
        const href = link.getAttribute('href');
        // Pega só o nome do arquivo (ex: ars.html)
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
