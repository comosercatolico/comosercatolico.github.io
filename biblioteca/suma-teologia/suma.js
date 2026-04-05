// ═══════════════════════════════════════════════════════════════
//  LEITOR.JS  —  Lux Fidei
//  Sistema genérico de leitura: salvar progresso, busca, índice.
//
//  ──────────────────────────────────────────────────────────────
//  COMO USAR NAS PÁGINAS DE LEITURA:
//  Adicione no <head> de cada suma-paginaN.html:
//
//    <meta name="leitor-pagina" content="1">   ← número da página
//    <script src="../../leitor.js"></script>    ← caminho até leitor.js
//
//  O leitor.js fica em:  biblioteca/suma-teologia/leitor.js
//  As páginas ficam em:  biblioteca/suma-teologia/sumateologia1-100/suma-pagina1.html
//  Então o caminho do script é sempre:  ../leitor.js
//
//  Para a biblioteca.html e o index.html da suma, inclua também:
//    <script src="leitor.js"></script>  (ou o caminho relativo correto)
// ═══════════════════════════════════════════════════════════════

(function () {
'use strict';

// ═══════════════════════════════════════════════════════════════
//  ★ ÍNDICE DA SUMA TEOLÓGICA
//
//  Edite esta lista para adicionar/remover entradas.
//  Cada entrada tem:
//    titulo  → texto que aparece no índice
//    pagina  → número da página onde começa
//    secao   → (opcional) true = título de seção, não é clicável
//
//  Exemplo:
//    { titulo: 'Introdução',         pagina: 1  },
//    { titulo: 'Questão 1 — ...',    pagina: 5  },
//    { titulo: '── PARTE II ──',     secao: true },
//    { titulo: 'Questão 50 — ...',   pagina: 120 },
// ═══════════════════════════════════════════════════════════════
var INDICE_SUMA = [

    // ── Coloque aqui as suas entradas ──────────────────────────
    // Exemplos provisórios (substitua pelos seus títulos reais):

    { titulo: 'Prólogo de São Tomás de Aquino',           pagina: 1   },
    { titulo: 'Encíclica Aeterni Patris',                 pagina: 8   },

    { titulo: '── PARTE I: DEUS ──',                     secao: true },
    { titulo: 'Q.1 · A Sagrada Doutrina',                 pagina: 20  },
    { titulo: 'Q.2 · A Existência de Deus',               pagina: 28  },
    { titulo: 'Q.3 · A Simplicidade de Deus',             pagina: 38  },

    { titulo: '── Adicione mais entradas acima ──',       secao: true },

    // ── Fim das entradas ───────────────────────────────────────
];

// ═══════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO  (não precisa mexer aqui normalmente)
// ═══════════════════════════════════════════════════════════════
var TOTAL_PAGINAS = 3000;          // total de páginas do livro
var CHAVE_SAVE    = 'leitor_suma'; // chave do localStorage

// ─────────────────────────────────────────────────────────────
//  LER / SALVAR PROGRESSO
// ─────────────────────────────────────────────────────────────
function salvar(pag) {
    try { localStorage.setItem(CHAVE_SAVE, String(pag)); } catch(e) {}
}

function lerSalvo() {
    try {
        var v = localStorage.getItem(CHAVE_SAVE);
        var n = v ? parseInt(v, 10) : 0;
        return (n >= 1 && n <= TOTAL_PAGINAS) ? n : 0;
    } catch(e) { return 0; }
}

// ─────────────────────────────────────────────────────────────
//  DETECTAR PÁGINA ATUAL
//  Prioridade: meta tag → nome do arquivo
// ─────────────────────────────────────────────────────────────
function getPaginaAtual() {
    // 1. Meta tag (mais confiável — recomendado)
    var meta = document.querySelector('meta[name="leitor-pagina"]');
    if (meta) {
        var n = parseInt(meta.getAttribute('content'), 10);
        if (n >= 1) return n;
    }
    // 2. Nome do arquivo (fallback)
    var arquivo = window.location.pathname.split('/').pop();
    var m = arquivo.match(/pagina(\d+)\.html$/i);
    return m ? parseInt(m[1], 10) : null;
}

// ─────────────────────────────────────────────────────────────
//  CONSTRUIR URL para uma página qualquer
//
//  Estrutura de pastas:
//    sumateologia1-100/suma-pagina1.html   até   suma-pagina100.html
//    sumateologia101-200/suma-pagina101.html ...
//
//  leitor.js fica em:  biblioteca/suma-teologia/leitor.js
//  Página atual fica:  biblioteca/suma-teologia/sumateologia1-100/suma-pagina1.html
//
//  Para ir de qualquer página para outra, subimos um nível (../)
//  e entramos na pasta correta.
// ─────────────────────────────────────────────────────────────
function urlParaPagina(n) {
    n = Math.max(1, Math.min(TOTAL_PAGINAS, parseInt(n, 10) || 1));

    // Calcular a pasta: página 1-100 → sumateologia1-100, 101-200 → sumateologia101-200 ...
    var inicio = Math.floor((n - 1) / 100) * 100 + 1;
    var fim    = inicio + 99;
    var pasta  = 'sumateologia' + inicio + '-' + fim;

    var pathname = window.location.pathname;
    var partes   = pathname.split('/');
    var arquivo  = partes[partes.length - 1];

    // Se estamos dentro de uma subpasta (suma-paginaN.html), subimos um nível
    if (/suma-pagina\d+\.html$/i.test(arquivo)) {
        // Estamos em: .../sumateologiaX-Y/
        // Subir um nível: ../
        return '../' + pasta + '/suma-pagina' + n + '.html';
    }

    // Se estamos no index.html da suma ou em outro lugar, usar caminho direto
    return pasta + '/suma-pagina' + n + '.html';
}

function irParaPagina(n) {
    window.location.href = urlParaPagina(n);
}

// ─────────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────────
function injetarCSS() {
    if (document.getElementById('leitor-css')) return;
    var s = document.createElement('style');
    s.id  = 'leitor-css';
    s.textContent = `

/* ── Widget central (busca + índice) ───────────────────── */
#leitor-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}
.lw-label {
    font-size: 0.7rem;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}
.lw-row {
    display: flex;
    align-items: center;
    gap: 0;
    background: #f7f3ec;
    border: 1.5px solid #d4af37;
    border-radius: 10px;
    overflow: hidden;
    transition: box-shadow 0.2s;
}
.lw-row:focus-within {
    box-shadow: 0 0 0 3px rgba(212,175,55,0.22);
}
#lw-input {
    width: 60px;
    border: none;
    background: transparent;
    font-size: 1rem;
    font-weight: 700;
    color: #2c1f17;
    text-align: center;
    outline: none;
    font-family: inherit;
    padding: 6px 4px;
    -moz-appearance: textfield;
}
#lw-input::-webkit-inner-spin-button,
#lw-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.lw-total {
    font-size: 0.82rem;
    color: #aaa;
    padding-right: 6px;
    white-space: nowrap;
}
.lw-div {
    width: 1px;
    height: 28px;
    background: #ddd;
}
.lw-btn-ir {
    background: #5b2c83;
    color: #fff;
    border: none;
    padding: 6px 13px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    height: 100%;
}
.lw-btn-ir:hover { background: #4a246a; }
.lw-div2 {
    width: 1px;
    height: 28px;
    background: #ddd;
}
.lw-btn-idx {
    background: transparent;
    border: none;
    padding: 6px 12px;
    color: #8b6914;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
}
.lw-btn-idx:hover { color: #5b2c83; background: rgba(91,44,131,0.06); }
.lw-btn-idx svg { width: 13px; height: 13px; }
.lw-erro {
    font-size: 0.72rem;
    color: #c0392b;
    min-height: 14px;
    font-weight: 600;
}

/* ── Painel de Índice ───────────────────────────────────── */
#li-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.42);
    z-index: 8000;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding: 70px 16px 20px;
    backdrop-filter: blur(2px);
}
#li-overlay.aberto { display: flex; }

#li-painel {
    background: #fff;
    border-radius: 14px;
    width: 100%;
    max-width: 480px;
    max-height: 75vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.22);
    overflow: hidden;
    animation: liSlide 0.2s ease;
}
@keyframes liSlide {
    from { transform: translateY(-16px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
}
#li-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 18px 11px;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
}
#li-header h3 {
    font-family: 'Libre Baskerville', serif;
    font-size: 1rem;
    color: #2c1f17;
    margin: 0;
}
#li-fechar {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #aaa;
    cursor: pointer;
    padding: 2px 7px;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
    line-height: 1;
}
#li-fechar:hover { background: #f0e6d2; color: #2c1f17; }
#li-busca-wrap {
    padding: 9px 16px;
    border-bottom: 1px solid #f0ebe0;
    flex-shrink: 0;
}
#li-busca {
    width: 100%;
    border: 1.5px solid #d4af37;
    border-radius: 8px;
    padding: 7px 12px;
    font-family: inherit;
    font-size: 0.9rem;
    outline: none;
    background: #faf7f0;
    color: #2c1f17;
    transition: box-shadow 0.2s;
}
#li-busca:focus { box-shadow: 0 0 0 3px rgba(212,175,55,0.2); }
#li-busca::placeholder { color: #bbb; }
#li-lista {
    overflow-y: auto;
    flex: 1;
    padding: 6px 0 10px;
}
#li-lista::-webkit-scrollbar { width: 4px; }
#li-lista::-webkit-scrollbar-thumb { background: #e0d4c0; border-radius: 4px; }

.li-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 18px;
    gap: 12px;
    cursor: pointer;
    transition: background 0.1s;
    border: none;
    width: 100%;
    background: none;
    font-family: inherit;
    text-align: left;
    color: #2c1f17;
}
.li-item:hover { background: #faf5eb; }
.li-item.atual { background: #fdf3cc; }
.li-item.atual .li-titulo { font-weight: 700; }

/* Entrada de seção (não clicável) */
.li-secao {
    padding: 12px 18px 4px;
    font-size: 0.68rem;
    font-weight: 800;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border-top: 1px solid #f0ebe0;
    margin-top: 4px;
    cursor: default;
}
.li-secao:first-child { border-top: none; margin-top: 0; }

.li-titulo {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    color: #2c1f17;
}
.li-pag {
    font-size: 0.78rem;
    font-weight: 700;
    color: #5b2c83;
    background: #f0e6f8;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    flex-shrink: 0;
}
.li-vazio {
    text-align: center;
    color: #bbb;
    font-size: 0.88rem;
    padding: 28px 16px;
}

/* ── Toast ──────────────────────────────────────────────── */
#leitor-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(12px);
    background: rgba(44,31,23,0.92);
    color: #d4af37;
    padding: 9px 20px;
    border-radius: 30px;
    font-size: 0.85rem;
    font-weight: 700;
    box-shadow: 0 4px 20px rgba(0,0,0,0.28);
    opacity: 0;
    transition: opacity 0.28s, transform 0.28s;
    z-index: 9999;
    pointer-events: none;
    white-space: nowrap;
}
#leitor-toast.visivel {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* ── Banner "continuar leitura" ─────────────────────────── */
#leitor-continuar {
    display: none;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, #fffdf5, #faf5eb);
    border: 1.5px solid #d4af37;
    border-radius: 12px;
    padding: 15px 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}
#leitor-continuar.visivel { display: flex; }
.lc-icone  { font-size: 1.8rem; flex-shrink: 0; }
.lc-txt    { flex: 1; }
.lc-titulo { font-weight: 800; color: #2c1f17; font-size: 0.98rem; margin-bottom: 2px; }
.lc-sub    { color: #999; font-size: 0.85rem; }
.lc-btn {
    background: linear-gradient(135deg, #5b2c83, #7a3eb5);
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 10px 18px;
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    transition: filter 0.15s, transform 0.15s;
    flex-shrink: 0;
}
.lc-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }

@media (max-width: 480px) {
    #leitor-continuar { flex-wrap: wrap; }
    .lc-btn { width: 100%; text-align: center; }
}
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────
var _toastTimer = null;
function toast(msg) {
    var el = document.getElementById('leitor-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'leitor-toast';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() { el.classList.remove('visivel'); }, 2400);
}

// ─────────────────────────────────────────────────────────────
//  PAINEL DE ÍNDICE
// ─────────────────────────────────────────────────────────────
function renderLista(filtro, pagAtual) {
    var lista = document.getElementById('li-lista');
    if (!lista) return;

    var entradas = filtro
        ? INDICE_SUMA.filter(function(e) {
            return !e.secao && e.titulo.toLowerCase().includes(filtro.toLowerCase());
          })
        : INDICE_SUMA;

    if (entradas.length === 0) {
        lista.innerHTML = '<p class="li-vazio">Nenhuma seção encontrada.</p>';
        return;
    }

    var html = '';
    entradas.forEach(function(e) {
        if (e.secao) {
            html += '<div class="li-secao">' + e.titulo + '</div>';
            return;
        }
        var isAtual = (e.pagina === pagAtual);
        html += '<button class="li-item' + (isAtual ? ' atual' : '') + '"'
             +  ' data-pag="' + e.pagina + '">'
             +  '<span class="li-titulo">' + e.titulo + '</span>'
             +  '<span class="li-pag">' + e.pagina + '</span>'
             +  '</button>';
    });
    lista.innerHTML = html;

    // Rolar até item atual
    var atual = lista.querySelector('.li-item.atual');
    if (atual) setTimeout(function() { atual.scrollIntoView({ block: 'center' }); }, 60);

    // Eventos de clique
    lista.querySelectorAll('.li-item[data-pag]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            irParaPagina(parseInt(this.dataset.pag, 10));
        });
    });
}

function abrirIndice(pagAtual) {
    // Criar overlay se não existir
    if (!document.getElementById('li-overlay')) {
        var ov = document.createElement('div');
        ov.id  = 'li-overlay';
        ov.innerHTML =
            '<div id="li-painel">'
            + '<div id="li-header">'
            +   '<h3>📖 Índice</h3>'
            +   '<button id="li-fechar" title="Fechar (Esc)">✕</button>'
            + '</div>'
            + '<div id="li-busca-wrap">'
            +   '<input id="li-busca" type="text" placeholder="Buscar seção..." autocomplete="off">'
            + '</div>'
            + '<div id="li-lista"></div>'
            + '</div>';
        document.body.appendChild(ov);

        // Fechar ao clicar fora
        ov.addEventListener('click', function(e) {
            if (e.target === ov) fecharIndice();
        });
        document.getElementById('li-fechar').addEventListener('click', fecharIndice);

        // Busca interna
        document.getElementById('li-busca').addEventListener('input', function() {
            renderLista(this.value.trim(), pagAtual);
        });
    }

    renderLista('', pagAtual);
    document.getElementById('li-overlay').classList.add('aberto');

    // Focar no campo de busca
    setTimeout(function() {
        var b = document.getElementById('li-busca');
        if (b) b.focus();
    }, 100);
}

function fecharIndice() {
    var ov = document.getElementById('li-overlay');
    if (ov) ov.classList.remove('aberto');
}

// Fechar índice com Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') fecharIndice();
});

// ─────────────────────────────────────────────────────────────
//  PÁGINA DE LEITURA  (suma-paginaN.html)
// ─────────────────────────────────────────────────────────────
function iniciarLeitura(pagAtual) {
    // 1. Salvar progresso
    salvar(pagAtual);
    toast('✦ Progresso salvo — pág. ' + pagAtual);

    // 2. Criar widget e substituir .info-centena
    var alvo = document.querySelector('.info-centena');
    if (!alvo) return; // sem navegação, não faz nada

    var widget = document.createElement('div');
    widget.id  = 'leitor-widget';
    widget.innerHTML =
        '<span class="lw-label">Ir para a página</span>'
        + '<div class="lw-row">'
        +   '<input id="lw-input" type="number" min="1" max="' + TOTAL_PAGINAS + '" value="' + pagAtual + '">'
        +   '<span class="lw-total">/ ' + TOTAL_PAGINAS + '</span>'
        +   '<span class="lw-div"></span>'
        +   '<button class="lw-btn-ir" id="lw-ir">Ir</button>'
        +   '<span class="lw-div2"></span>'
        +   '<button class="lw-btn-idx" id="lw-idx">'
        +     '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h10v2H3v-2z"/></svg>'
        +     'Índice'
        +   '</button>'
        + '</div>'
        + '<span class="lw-erro" id="lw-erro"></span>';

    alvo.parentNode.replaceChild(widget, alvo);

    // 3. Navegar ao clicar em "Ir" ou pressionar Enter
    function navegar() {
        var inp = document.getElementById('lw-input');
        var err = document.getElementById('lw-erro');
        var n   = parseInt(inp.value, 10);
        if (isNaN(n) || n < 1 || n > TOTAL_PAGINAS) {
            err.textContent = 'Digite entre 1 e ' + TOTAL_PAGINAS;
            inp.focus();
            return;
        }
        err.textContent = '';
        irParaPagina(n);
    }

    document.getElementById('lw-ir').addEventListener('click', navegar);

    var inp = document.getElementById('lw-input');
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') navegar(); });
    inp.addEventListener('focus',   function()  { this.select(); });
    inp.addEventListener('input',   function()  {
        var err = document.getElementById('lw-erro');
        if (err) err.textContent = '';
    });

    // 4. Abrir índice
    document.getElementById('lw-idx').addEventListener('click', function() {
        abrirIndice(pagAtual);
    });

    // 5. Navegação por teclado (← →) — mantida do suma.js original
    document.addEventListener('keydown', function(e) {
        if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        document.querySelectorAll('.btn-nav, .btn-primary').forEach(function(btn) {
            if (btn.classList.contains('desabilitado')) return;
            var txt = btn.textContent;
            if (e.key === 'ArrowLeft'  && txt.includes('Anterior')) btn.click();
            if (e.key === 'ArrowRight' && txt.includes('Próxima'))  btn.click();
        });
    });

    // 6. Botões desabilitados não navegam
    document.querySelectorAll('.desabilitado').forEach(function(el) {
        el.addEventListener('click', function(ev) { ev.preventDefault(); });
    });
}

// ─────────────────────────────────────────────────────────────
//  INDEX DA SUMA  (suma-teologia/index.html)
//  Mostra banner "continuar leitura" se houver progresso
// ─────────────────────────────────────────────────────────────
function iniciarIndex() {
    var prog = lerSalvo();
    if (!prog) return;

    var banner = document.createElement('div');
    banner.id  = 'leitor-continuar';
    banner.innerHTML =
        '<span class="lc-icone">📖</span>'
        + '<div class="lc-txt">'
        +   '<div class="lc-titulo">Continuar leitura</div>'
        +   '<div class="lc-sub">Você parou na <strong>página ' + prog + '</strong> de ' + TOTAL_PAGINAS + '</div>'
        + '</div>'
        + '<button class="lc-btn" id="lc-btn">Continuar →</button>';

    // Inserir antes do botão "Iniciar Leitura"
    var ref = document.querySelector('.btn-start') || document.querySelector('.descricao');
    if (ref) {
        ref.parentNode.insertBefore(banner, ref);
        banner.classList.add('visivel');
    }

    document.getElementById('lc-btn').addEventListener('click', function() {
        // Do index.html a URL é: sumateologiaX-Y/suma-paginaN.html
        var inicio = Math.floor((prog - 1) / 100) * 100 + 1;
        var fim    = inicio + 99;
        window.location.href = 'sumateologia' + inicio + '-' + fim + '/suma-pagina' + prog + '.html';
    });
}

// ─────────────────────────────────────────────────────────────
//  BIBLIOTECA  (biblioteca.html)
// ─────────────────────────────────────────────────────────────
function iniciarBiblioteca() {
    var prog = lerSalvo();
    if (!prog) return;

    // Atualizar barra de progresso
    var fill = document.querySelector('.progress-fill');
    if (fill) fill.style.width = Math.max(0.5, Math.min(100, Math.round(prog / TOTAL_PAGINAS * 100))) + '%';

    // Atualizar texto
    var small = document.querySelector('.progresso-traducao small');
    if (small) small.textContent = 'Você está na página ' + prog + ' de ' + TOTAL_PAGINAS;

    // Atualizar botão "Acessar"
    var btn = document.querySelector('a.btn-destaque');
    if (btn) {
        btn.textContent = '📖 Continuar — pág. ' + prog;
        var inicio = Math.floor((prog - 1) / 100) * 100 + 1;
        var fim    = inicio + 99;
        btn.href = 'suma-teologia/sumateologia' + inicio + '-' + fim + '/suma-pagina' + prog + '.html';
    }
}

// ─────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO — detecta em qual página estamos
// ─────────────────────────────────────────────────────────────
function init() {
    injetarCSS();

    var pathname = window.location.pathname.toLowerCase();
    var arquivo  = pathname.split('/').pop();

    if (/suma-pagina\d+\.html$/.test(arquivo)) {
        // Página de leitura
        var pag = getPaginaAtual();
        if (pag) iniciarLeitura(pag);

    } else if (arquivo === 'index.html' && pathname.includes('suma-teologia')) {
        // Índice da Suma
        iniciarIndex();

    } else if (arquivo === 'biblioteca.html') {
        // Biblioteca
        iniciarBiblioteca();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
