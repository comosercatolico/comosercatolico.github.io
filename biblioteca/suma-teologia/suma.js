// ═══════════════════════════════════════════════════
//  SUMA.JS  —  Navegação, Busca e Progresso de Leitura
//  Substitui completamente o suma.js anterior
// ═══════════════════════════════════════════════════

(function () {
    'use strict';

    // ──────────────────────────────────────────────
    //  CONFIGURAÇÃO
    //  Ajuste TOTAL_PAGINAS conforme o total real do
    //  seu livro. O padrão de nome de arquivo é:
    //  "suma-paginaN.html"  (ex: suma-pagina42.html)
    // ──────────────────────────────────────────────
    var TOTAL_PAGINAS   = 3000;
    var CHAVE_STORAGE   = 'suma_pagina_atual';    // chave do localStorage
    var PREFIXO_ARQUIVO = 'suma-pagina';          // prefixo do nome do HTML
    var EXTENSAO        = '.html';

    // ──────────────────────────────────────────────
    //  DETECTAR PÁGINA ATUAL
    //  Lê o número da página do nome do arquivo atual
    //  ex: "suma-pagina42.html" → 42
    // ──────────────────────────────────────────────
    function getPaginaAtual() {
        var arquivo = window.location.pathname.split('/').pop();
        var match   = arquivo.match(/suma-pagina(\d+)\.html/i);
        return match ? parseInt(match[1], 10) : null;
    }

    // ──────────────────────────────────────────────
    //  SALVAR / LER PROGRESSO
    // ──────────────────────────────────────────────
    function salvarProgresso(pagina) {
        try { localStorage.setItem(CHAVE_STORAGE, pagina); } catch(e) {}
    }

    function lerProgresso() {
        try { return parseInt(localStorage.getItem(CHAVE_STORAGE), 10) || 1; } catch(e) { return 1; }
    }

    // ──────────────────────────────────────────────
    //  CONSTRUIR URL para uma dada página
    //  Mantém o mesmo diretório da página atual
    // ──────────────────────────────────────────────
    function urlParaPagina(n) {
        var dir  = window.location.pathname.split('/').slice(0, -1).join('/');
        return dir + '/' + PREFIXO_ARQUIVO + n + EXTENSAO;
    }

    // ──────────────────────────────────────────────
    //  NAVEGAR PARA UMA PÁGINA (valida e redireciona)
    // ──────────────────────────────────────────────
    function irParaPagina(n) {
        n = parseInt(n, 10);
        if (isNaN(n) || n < 1)            n = 1;
        if (n > TOTAL_PAGINAS)            n = TOTAL_PAGINAS;
        window.location.href = urlParaPagina(n);
    }

    // ──────────────────────────────────────────────
    //  CRIAR WIDGET DE BUSCA (substitui .info-centena
    //  ou qualquer elemento com data-busca-suma)
    // ──────────────────────────────────────────────
    function criarWidgetBusca(pagAtual) {
        var widget = document.createElement('div');
        widget.id  = 'suma-busca-widget';
        widget.innerHTML =
            '<form id="suma-busca-form" autocomplete="off">'
            + '<label for="suma-busca-input" class="suma-busca-label">Ir para a página</label>'
            + '<div class="suma-busca-row">'
            + '<input id="suma-busca-input" type="number" min="1" max="' + TOTAL_PAGINAS + '"'
            + ' placeholder="' + pagAtual + '"'
            + ' value="' + pagAtual + '"'
            + ' aria-label="Número da página" />'
            + '<span class="suma-busca-total">/ ' + TOTAL_PAGINAS + '</span>'
            + '<button type="submit" class="suma-busca-btn">Ir</button>'
            + '</div>'
            + '</form>'
            + '<div id="suma-busca-erro" class="suma-busca-erro" role="alert" aria-live="polite"></div>';
        return widget;
    }

    // ──────────────────────────────────────────────
    //  INJETAR CSS DINÂMICO (evita dependência de
    //  arquivo extra, mas pode mover para suma.css)
    // ──────────────────────────────────────────────
    function injetarCSS() {
        if (document.getElementById('suma-busca-style')) return;
        var s = document.createElement('style');
        s.id  = 'suma-busca-style';
        s.textContent = [
            '#suma-busca-widget {',
            '  display: flex;',
            '  flex-direction: column;',
            '  align-items: center;',
            '  gap: 4px;',
            '}',
            '.suma-busca-label {',
            '  font-size: 0.75rem;',
            '  color: #888;',
            '  letter-spacing: 0.5px;',
            '  text-transform: uppercase;',
            '  font-weight: 600;',
            '}',
            '.suma-busca-row {',
            '  display: flex;',
            '  align-items: center;',
            '  gap: 6px;',
            '  background: #f7f3ec;',
            '  border: 1.5px solid #d4af37;',
            '  border-radius: 10px;',
            '  padding: 5px 10px;',
            '  transition: box-shadow 0.2s;',
            '}',
            '.suma-busca-row:focus-within {',
            '  box-shadow: 0 0 0 3px rgba(212,175,55,0.25);',
            '}',
            '#suma-busca-input {',
            '  width: 72px;',
            '  border: none;',
            '  background: transparent;',
            '  font-size: 1.05rem;',
            '  font-weight: 700;',
            '  color: #2c1f17;',
            '  text-align: center;',
            '  outline: none;',
            '  font-family: inherit;',
            '  -moz-appearance: textfield;',
            '}',
            '#suma-busca-input::-webkit-inner-spin-button,',
            '#suma-busca-input::-webkit-outer-spin-button { -webkit-appearance: none; }',
            '.suma-busca-total {',
            '  font-size: 0.9rem;',
            '  color: #888;',
            '  white-space: nowrap;',
            '}',
            '.suma-busca-btn {',
            '  background: #5b2c83;',
            '  color: #fff;',
            '  border: none;',
            '  border-radius: 7px;',
            '  padding: 5px 13px;',
            '  font-weight: 700;',
            '  font-size: 0.9rem;',
            '  cursor: pointer;',
            '  transition: background 0.2s, transform 0.1s;',
            '  font-family: inherit;',
            '}',
            '.suma-busca-btn:hover { background: #4a246a; transform: scale(1.04); }',
            '.suma-busca-btn:active { transform: scale(0.97); }',
            '.suma-busca-erro {',
            '  font-size: 0.78rem;',
            '  color: #c0392b;',
            '  min-height: 16px;',
            '  font-weight: 600;',
            '}',

            /* Toast de progresso salvo */
            '#suma-toast {',
            '  position: fixed;',
            '  bottom: 28px;',
            '  left: 50%;',
            '  transform: translateX(-50%) translateY(20px);',
            '  background: rgba(44,31,23,0.92);',
            '  color: #d4af37;',
            '  padding: 10px 22px;',
            '  border-radius: 30px;',
            '  font-size: 0.9rem;',
            '  font-weight: 700;',
            '  box-shadow: 0 4px 20px rgba(0,0,0,0.3);',
            '  opacity: 0;',
            '  transition: opacity 0.35s, transform 0.35s;',
            '  z-index: 9999;',
            '  pointer-events: none;',
            '  white-space: nowrap;',
            '}',
            '#suma-toast.visivel {',
            '  opacity: 1;',
            '  transform: translateX(-50%) translateY(0);',
            '}',

            /* Banner "continuar leitura" na index */
            '#suma-continuar {',
            '  display: none;',
            '  align-items: center;',
            '  gap: 14px;',
            '  background: linear-gradient(135deg, #fffdf5, #faf5eb);',
            '  border: 1.5px solid #d4af37;',
            '  border-radius: 12px;',
            '  padding: 16px 22px;',
            '  margin-bottom: 20px;',
            '  box-shadow: 0 4px 15px rgba(0,0,0,0.06);',
            '}',
            '#suma-continuar.visivel { display: flex; }',
            '#suma-continuar .sc-texto { flex: 1; }',
            '#suma-continuar .sc-titulo {',
            '  font-weight: 800;',
            '  color: #2c1f17;',
            '  font-size: 1rem;',
            '  margin-bottom: 3px;',
            '}',
            '#suma-continuar .sc-sub {',
            '  color: #888;',
            '  font-size: 0.88rem;',
            '}',
            '#suma-continuar .sc-btn {',
            '  background: linear-gradient(135deg, #5b2c83, #7a3eb5);',
            '  color: #fff;',
            '  border: none;',
            '  border-radius: 9px;',
            '  padding: 10px 20px;',
            '  font-weight: 700;',
            '  font-size: 0.95rem;',
            '  cursor: pointer;',
            '  white-space: nowrap;',
            '  transition: filter 0.2s, transform 0.15s;',
            '  font-family: inherit;',
            '}',
            '#suma-continuar .sc-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }',
        ].join('\n');
        document.head.appendChild(s);
    }

    // ──────────────────────────────────────────────
    //  TOAST (notificação breve)
    // ──────────────────────────────────────────────
    var toastTimer = null;
    function mostrarToast(msg) {
        var el = document.getElementById('suma-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'suma-toast';
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add('visivel');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('visivel'); }, 2400);
    }

    // ──────────────────────────────────────────────
    //  LÓGICA DA PÁGINA DE LEITURA
    // ──────────────────────────────────────────────
    function iniciarPaginaLeitura(pagAtual) {
        // 1. Salvar progresso imediatamente ao carregar
        salvarProgresso(pagAtual);

        // 2. Substituir .info-centena pelo widget de busca
        var alvo = document.querySelector('.info-centena');
        if (alvo) {
            var widget = criarWidgetBusca(pagAtual);
            alvo.parentNode.replaceChild(widget, alvo);
        }

        // 3. Submissão do formulário de busca
        var form = document.getElementById('suma-busca-form');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var input = document.getElementById('suma-busca-input');
                var erro  = document.getElementById('suma-busca-erro');
                var n     = parseInt(input.value, 10);

                if (isNaN(n) || n < 1 || n > TOTAL_PAGINAS) {
                    erro.textContent = 'Digite um número entre 1 e ' + TOTAL_PAGINAS + '.';
                    input.focus();
                    return;
                }
                erro.textContent = '';
                irParaPagina(n);
            });

            // Limpar erro ao digitar
            var inp = document.getElementById('suma-busca-input');
            if (inp) {
                inp.addEventListener('input', function () {
                    var err = document.getElementById('suma-busca-erro');
                    if (err) err.textContent = '';
                });
                // Selecionar tudo ao focar (fácil de sobrescrever)
                inp.addEventListener('focus', function () { this.select(); });
            }
        }

        // 4. Navegação por teclado (setas ← →)
        document.addEventListener('keydown', function (e) {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                var seletor = e.key === 'ArrowLeft'
                    ? '.btn-nav:not(.desabilitado):not([href*="Próxima"]), .btn-primary:not(.desabilitado):not([href*="Próxima"])'
                    : '.btn-nav:not(.desabilitado):not([href*="Anterior"]), .btn-primary:not(.desabilitado):not([href*="Anterior"])';
                // Abordagem mais simples: ler href diretamente dos botões de nav
                var botoes = document.querySelectorAll('.btn-nav, .btn-primary');
                botoes.forEach(function (btn) {
                    if (btn.classList.contains('desabilitado')) return;
                    var href = btn.getAttribute('href') || '';
                    if (e.key === 'ArrowLeft'  && href.includes('Anterior')) btn.click();
                    if (e.key === 'ArrowRight' && href.includes('Próxima'))  btn.click();
                });
            }
        });

        // 5. Botões desabilitados não navegam
        document.querySelectorAll('.desabilitado').forEach(function (el) {
            el.addEventListener('click', function (ev) { ev.preventDefault(); });
        });
    }

    // ──────────────────────────────────────────────
    //  LÓGICA DA PÁGINA DE ÍNDICE (index.html da Suma)
    //  Mostra banner "Continuar leitura" se houver
    //  progresso salvo
    // ──────────────────────────────────────────────
    function iniciarPaginaIndice() {
        var prog = lerProgresso();
        if (prog <= 1) return; // sem progresso relevante

        // Criar banner
        var banner = document.createElement('div');
        banner.id = 'suma-continuar';
        banner.innerHTML =
            '<div class="sc-texto">'
            + '<div class="sc-titulo">📖 Continuar leitura</div>'
            + '<div class="sc-sub">Você parou na <strong>página ' + prog + '</strong> de ' + TOTAL_PAGINAS + '</div>'
            + '</div>'
            + '<button class="sc-btn" id="sc-continuar-btn">Continuar →</button>';

        // Inserir antes do btn-start (ou no início do hero-card)
        var btnStart = document.querySelector('.btn-start');
        if (btnStart) {
            btnStart.parentNode.insertBefore(banner, btnStart);
        } else {
            var heroCard = document.querySelector('.hero-card');
            if (heroCard) heroCard.prepend(banner);
        }

        banner.classList.add('visivel');

        document.getElementById('sc-continuar-btn').addEventListener('click', function () {
            // Descobre o caminho para a pasta das páginas
            // O índice está em suma-teologia/index.html
            // As páginas em suma-teologia/sumateologia1-100/suma-paginaN.html
            window.location.href = 'sumateologia1-100/' + PREFIXO_ARQUIVO + prog + EXTENSAO;
        });
    }

    // ──────────────────────────────────────────────
    //  LÓGICA DA BIBLIOTECA (biblioteca.html)
    //  Mostra badge/aviso de progresso no card da Suma
    // ──────────────────────────────────────────────
    function iniciarPaginaBiblioteca() {
        var prog = lerProgresso();
        if (prog <= 1) return;

        // Atualizar a barra de progresso da Suma se existir
        var fill = document.querySelector('.progress-fill');
        if (fill) {
            var pct = Math.min(100, Math.round((prog / TOTAL_PAGINAS) * 100));
            fill.style.width = Math.max(pct, 0.5) + '%';
        }

        // Atualizar texto de progresso
        var small = document.querySelector('.progresso-traducao small');
        if (small) {
            small.textContent = '~' + prog + ' de ' + TOTAL_PAGINAS + ' páginas lidas por você';
        }

        // Trocar texto do botão de acesso
        var btnDestaque = document.querySelector('.btn-destaque');
        if (btnDestaque) {
            btnDestaque.textContent = '📖 Continuar leitura (pág. ' + prog + ')';
            btnDestaque.href = 'suma-teologia/sumateologia1-100/' + PREFIXO_ARQUIVO + prog + EXTENSAO;
        }
    }

    // ──────────────────────────────────────────────
    //  INICIALIZAÇÃO  —  detecta em qual página estamos
    // ──────────────────────────────────────────────
    function init() {
        injetarCSS();

        var pathname = window.location.pathname;
        var arquivo  = pathname.split('/').pop();

        if (/suma-pagina\d+\.html/i.test(arquivo)) {
            // ── Página de leitura ──
            var pag = getPaginaAtual();
            if (pag) iniciarPaginaLeitura(pag);

        } else if (/index\.html$/i.test(arquivo) && pathname.includes('suma-teologia')) {
            // ── Índice da Suma ──
            iniciarPaginaIndice();

        } else if (/biblioteca\.html/i.test(arquivo)) {
            // ── Biblioteca ──
            iniciarPaginaBiblioteca();
        }
    }

    // Espera o DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
