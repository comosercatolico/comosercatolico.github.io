/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCRIPT PARA NAVEGAÇÃO - HISTÓRIA DE UMA ALMA                               */
/* Baseado no padrão da Suma Teológica                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function() {
  // Obter número da página atual do meta tag
  const metaLeitor = document.querySelector('meta[name="leitor-pagina"]');
  const paginaAtual = metaLeitor ? parseInt(metaLeitor.getAttribute('content')) : 1;
  
  // Total de páginas (ajuste conforme necessário)
  const totalPaginas = 150; // Aproximadamente 150 páginas
  
  // Atualizar informações de página
  atualizarInfoPagina(paginaAtual, totalPaginas);
  
  // Configurar teclas de navegação
  configurarTeclasNavegacao(paginaAtual, totalPaginas);
});

/**
 * Atualiza as informações de página exibidas
 */
function atualizarInfoPagina(paginaAtual, totalPaginas) {
  // Atualizar span de informação de página
  const infoSpans = document.querySelectorAll('.info-centena, .info-pagina');
  infoSpans.forEach(span => {
    span.textContent = `Pág. ${paginaAtual}/${totalPaginas}`;
  });
  
  // Atualizar span de página atual
  const paginaAtualSpan = document.querySelector('.pagina-atual');
  if (paginaAtualSpan) {
    paginaAtualSpan.textContent = paginaAtual;
  }
}

/**
 * Configura navegação por teclado
 */
function configurarTeclasNavegacao(paginaAtual, totalPaginas) {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      // Página anterior
      const btnAnterior = document.querySelector('a.btn-nav:not(.desabilitado)');
      if (btnAnterior && !btnAnterior.classList.contains('desabilitado')) {
        btnAnterior.click();
      }
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      // Próxima página
      const btnProxima = document.querySelectorAll('a.btn-nav');
      const ultimoBotao = btnProxima[btnProxima.length - 1];
      if (ultimoBotao && !ultimoBotao.classList.contains('desabilitado')) {
        ultimoBotao.click();
      }
    }
  });
}

/**
 * Função para ir para uma página específica
 */
function irParaPagina(numeroPagina) {
  // Determinar a pasta e o arquivo
  const pasta = determinarPasta(numeroPagina);
  const arquivo = `historia-pagina${numeroPagina}.html`;
  const caminho = `../${pasta}/${arquivo}`;
  window.location.href = caminho;
}

/**
 * Determina em qual pasta a página está
 */
function determinarPasta(numeroPagina) {
  if (numeroPagina >= 1 && numeroPagina <= 30) return 'historia1-30';
  if (numeroPagina >= 31 && numeroPagina <= 60) return 'historia31-60';
  if (numeroPagina >= 61 && numeroPagina <= 90) return 'historia61-90';
  if (numeroPagina >= 91 && numeroPagina <= 120) return 'historia91-120';
  if (numeroPagina >= 121 && numeroPagina <= 150) return 'historia121-150';
  return 'historia1-30'; // Padrão
}

/**
 * Função para voltar ao índice
 */
function voltarAoIndice() {
  window.location.href = '../index.html';
}
