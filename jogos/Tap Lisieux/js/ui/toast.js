// ═══════════════════════════════════════════════════════════
//  TOAST.JS
//  Sistema de notificações toast não-intrusivas.
//
//  FUNCIONALIDADES:
//  - 6 tipos visuais: info, sucesso, aviso, erro, lendario, nivel
//  - Fila inteligente — nunca sobrepõe mais de MAX_VISIVEIS
//  - Animação CSS suave de entrada e saída
//  - Clique no toast para dispensar manualmente
//  - Ícone animado por tipo
//  - Barra de progresso de tempo restante
//  - Pausa ao passar o mouse (hover)
//  - Posição configurável (top-right, top-left, bottom-right, etc.)
//  - Acessibilidade: aria-live, role="alert"
//  - Deduplica toasts idênticos (não empilha a mesma msg)
//  - Sem dependências externas
//
//  API:
//    Toast.mostrar("mensagem", "sucesso", 3000)
//    Toast.mostrar("mensagem", { tipo, duracao, icone, onClick })
//    Toast.limparTodos()
//    Toast.setConfig({ posicao, maxVisiveis })
//
//  Depende de: logger.js (opcional — fallback seguro)
//  Usado por: gacha.js, achievements.js, economy.js, battle.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Toast = (() => {

    // ════════════════════════════════════════
    // CONFIGURAÇÃO PADRÃO
    // ════════════════════════════════════════
    const _cfg = {
        posicao    : "top-right",   // top-right | top-left | bottom-right | bottom-left | top-center
        maxVisiveis: 4,             // máximo de toasts na tela ao mesmo tempo
        gapPx      : 10,            // espaço entre toasts
        zIndex     : 99999
    };

    // ════════════════════════════════════════
    // TIPOS VISUAIS
    // ════════════════════════════════════════
    const TIPOS = Object.freeze({
        info: {
            borda : "#4a8fff",
            fundo : "rgba(8,18,55,0.97)",
            icone : "ℹ️",
            sombra: "rgba(74,143,255,0.35)"
        },
        sucesso: {
            borda : "#44ff88",
            fundo : "rgba(5,35,18,0.97)",
            icone : "✅",
            sombra: "rgba(68,255,136,0.35)"
        },
        aviso: {
            borda : "#f5a623",
            fundo : "rgba(38,22,5,0.97)",
            icone : "⚠️",
            sombra: "rgba(245,166,35,0.35)"
        },
        erro: {
            borda : "#ff4444",
            fundo : "rgba(38,5,5,0.97)",
            icone : "❌",
            sombra: "rgba(255,68,68,0.35)"
        },
        lendario: {
            borda : "#f5a623",
            fundo : "rgba(38,22,0,0.97)",
            icone : "🌟",
            sombra: "rgba(245,166,35,0.60)"
        },
        nivel: {
            borda : "#b44dff",
            fundo : "rgba(25,5,45,0.97)",
            icone : "⬆️",
            sombra: "rgba(180,77,255,0.45)"
        }
    });

    // Duração padrão por tipo (ms)
    const DURACAO_PADRAO = Object.freeze({
        info    : 3000,
        sucesso : 3500,
        aviso   : 4000,
        erro    : 5000,
        lendario: 6000,
        nivel   : 4500
    });

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════
    let _container  = null;
    let _fila       = [];       // toasts aguardando (quando maxVisiveis atingido)
    let _ativos     = [];       // toasts atualmente na tela
    let _injetouCSS = false;

    // ════════════════════════════════════════
    // LOGGER (fallback seguro)
    // ════════════════════════════════════════
    const _log = (() => {
        try { return Logger.de("Toast"); }
        catch { return { debug: () => {}, warn: () => {}, error: () => {} }; }
    })();

    // ════════════════════════════════════════
    // INJEÇÃO DE CSS
    // Estilos em JS para não depender de arquivo externo
    // ════════════════════════════════════════
    function _injetarCSS() {
        if (_injetouCSS) return;
        _injetouCSS = true;

        const style = document.createElement("style");
        style.id    = "toast-styles";
        style.textContent = `

            /* Container */
            #toast-container {
                position      : fixed;
                z-index       : ${_cfg.zIndex};
                display       : flex;
                flex-direction: column;
                gap           : ${_cfg.gapPx}px;
                pointer-events: none;
                max-width      : 320px;
                width          : 90vw;
            }

            /* Toast base */
            .toast-item {
                position       : relative;
                display        : flex;
                align-items    : flex-start;
                gap            : 10px;
                padding        : 12px 14px 14px;
                border-radius  : 12px;
                border-left    : 4px solid transparent;
                font-family    : 'Nunito', sans-serif;
                font-size      : 13px;
                line-height    : 1.45;
                color          : #f0f0f0;
                pointer-events : all;
                cursor         : pointer;
                overflow       : hidden;
                box-sizing     : border-box;
                backdrop-filter: blur(6px);

                /* Entrada */
                opacity         : 0;
                transform       : translateX(24px);
                transition      :
                    opacity   0.28s ease,
                    transform 0.28s ease;
            }

            /* Entrada visível */
            .toast-item.toast-visivel {
                opacity  : 1;
                transform: translateX(0);
            }

            /* Saída */
            .toast-item.toast-saindo {
                opacity  : 0;
                transform: translateX(24px);
                transition:
                    opacity   0.22s ease,
                    transform 0.22s ease;
            }

            /* Saída para esquerda */
            .toast-posicao-esq .toast-item,
            .toast-posicao-esq .toast-item.toast-saindo {
                transform: translateX(-24px);
            }
            .toast-posicao-esq .toast-item.toast-visivel {
                transform: translateX(0);
            }

            /* Ícone */
            .toast-icone {
                font-size  : 18px;
                flex-shrink: 0;
                margin-top : 1px;
                line-height: 1;
            }

            /* Corpo */
            .toast-corpo {
                flex      : 1;
                min-width : 0;
                word-break: break-word;
            }

            /* Mensagem */
            .toast-msg {
                display    : block;
                font-weight: 600;
            }

            /* Botão fechar */
            .toast-fechar {
                position   : absolute;
                top        : 6px;
                right      : 8px;
                background : none;
                border     : none;
                color      : rgba(255,255,255,0.45);
                font-size  : 14px;
                cursor     : pointer;
                padding    : 0;
                line-height: 1;
                transition : color 0.15s;
                pointer-events: all;
            }
            .toast-fechar:hover {
                color: rgba(255,255,255,0.90);
            }

            /* Barra de progresso */
            .toast-progress {
                position     : absolute;
                bottom       : 0;
                left         : 0;
                height       : 3px;
                width        : 100%;
                border-radius: 0 0 12px 12px;
                transform-origin: left center;
                transition   : transform linear;
            }

            /* Lendário — brilho pulsante */
            .toast-lendario {
                animation: toastLendGlow 1.4s ease-in-out infinite alternate;
            }

            @keyframes toastLendGlow {
                from { box-shadow: 0 0 10px rgba(245,166,35,0.40); }
                to   { box-shadow: 0 0 24px rgba(245,166,35,0.85),
                                   0 0 48px rgba(245,166,35,0.30); }
            }

            /* Lendário — texto dourado */
            .toast-lendario .toast-msg {
                background             : linear-gradient(90deg, #f5a623, #ffe066, #f5a623);
                background-size        : 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip        : text;
                animation              : toastShine 2s linear infinite;
            }

            @keyframes toastShine {
                to { background-position: 200% center; }
            }

            /* Nível — brilho roxo */
            .toast-nivel {
                animation: toastNivelGlow 1.2s ease-in-out infinite alternate;
            }

            @keyframes toastNivelGlow {
                from { box-shadow: 0 0 8px rgba(180,77,255,0.40); }
                to   { box-shadow: 0 0 20px rgba(180,77,255,0.80),
                                   0 0 40px rgba(180,77,255,0.25); }
            }

        `;

        document.head.appendChild(style);
    }

    // ════════════════════════════════════════
    // CONTAINER
    // ════════════════════════════════════════
    function _garantirContainer() {
        if (_container) return;

        _injetarCSS();

        _container    = document.createElement("div");
        _container.id = "toast-container";

        _aplicarPosicao();
        document.body.appendChild(_container);
    }

    function _aplicarPosicao() {
        if (!_container) return;

        // Remove estilos de posição anteriores
        Object.assign(_container.style, {
            top: "", bottom: "", left: "", right: "",
            alignItems: "", transform: ""
        });

        _container.classList.remove("toast-posicao-esq");

        const pos = _cfg.posicao;

        // Vertical
        if (pos.startsWith("top"))    _container.style.top    = "72px";
        if (pos.startsWith("bottom")) _container.style.bottom = "80px";

        // Horizontal
        if (pos.endsWith("right"))  {
            _container.style.right = "12px";
        } else if (pos.endsWith("left")) {
            _container.style.left = "12px";
            _container.classList.add("toast-posicao-esq");
        } else if (pos.endsWith("center")) {
            _container.style.left      = "50%";
            _container.style.transform = "translateX(-50%)";
            _container.style.alignItems = "center";
        }
    }

    // ════════════════════════════════════════
    // DEDUPLICAÇÃO
    // Não empilha toasts com a mesma mensagem
    // ════════════════════════════════════════
    function _isDuplicata(msg, tipo) {
        return _ativos.some(t => t.msg === msg && t.tipo === tipo);
    }

    // ════════════════════════════════════════
    // CRIAR ELEMENTO DO TOAST
    // ════════════════════════════════════════
    function _criarElemento(msg, tipoObj, tipo, duracao, iconeCustom, onClickCustom) {
        const el = document.createElement("div");

        el.className   = `toast-item toast-${tipo}`;
        el.style.background  = tipoObj.fundo;
        el.style.borderColor = tipoObj.borda;
        el.style.boxShadow   = `0 4px 20px ${tipoObj.sombra}, 0 2px 8px rgba(0,0,0,0.5)`;

        // Acessibilidade
        el.setAttribute("role",      tipo === "erro" ? "alert" : "status");
        el.setAttribute("aria-live", tipo === "erro" ? "assertive" : "polite");
        el.setAttribute("aria-atomic", "true");
        el.setAttribute("tabindex",  "0");
        el.setAttribute("title",     "Clique para fechar");

        const icone = iconeCustom ?? tipoObj.icone;

        el.innerHTML = `
            <span class="toast-icone" aria-hidden="true">${icone}</span>
            <div class="toast-corpo">
                <span class="toast-msg">${_escapar(msg)}</span>
            </div>
            <button class="toast-fechar" aria-label="Fechar notificação">✕</button>
            <div class="toast-progress"
                 style="background:${tipoObj.borda}; opacity:0.6;"></div>
        `;

        return el;
    }

    // ════════════════════════════════════════
    // ESCAPE DE HTML (segurança)
    // ════════════════════════════════════════
    function _escapar(str) {
        return String(str)
            .replace(/&/g,  "&amp;")
            .replace(/</g,  "&lt;")
            .replace(/>/g,  "&gt;")
            .replace(/"/g,  "&quot;")
            .replace(/'/g,  "&#039;");
    }

    // ════════════════════════════════════════
    // REMOVER TOAST
    // ════════════════════════════════════════
    function _remover(entrada) {
        if (entrada.removido) return;
        entrada.removido = true;

        // Para os timers
        clearTimeout(entrada.timerSaida);
        clearInterval(entrada.timerProgress);

        const el = entrada.el;
        el.classList.remove("toast-visivel");
        el.classList.add("toast-saindo");

        setTimeout(() => {
            el.remove();
            _ativos = _ativos.filter(t => t !== entrada);

            // Processa próximo da fila
            if (_fila.length > 0) {
                _mostrarEntrada(_fila.shift());
            }
        }, 250);
    }

    // ════════════════════════════════════════
    // MOSTRAR ENTRADA (interna)
    // ════════════════════════════════════════
    function _mostrarEntrada(entrada) {
        _garantirContainer();

        const { msg, tipo, tipoObj, duracao, iconeCustom, onClickCustom } = entrada;

        const el      = _criarElemento(msg, tipoObj, tipo, duracao, iconeCustom, onClickCustom);
        entrada.el    = el;
        entrada.removido = false;

        _container.appendChild(el);
        _ativos.push(entrada);

        // Animação de entrada no próximo frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.classList.add("toast-visivel");
            });
        });

        // ── Barra de progresso ──
        const progressEl = el.querySelector(".toast-progress");
        let tempoRestante = duracao;
        let pausado       = false;
        let ultimoTick    = performance.now();

        // Barra começa cheia e vai para 0
        if (progressEl) {
            progressEl.style.transition  = `transform ${duracao}ms linear`;
            progressEl.style.transform   = "scaleX(1)";
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    progressEl.style.transform = "scaleX(0)";
                });
            });
        }

        // ── Pause ao hover ──
        el.addEventListener("mouseenter", () => {
            if (entrada.removido) return;
            pausado = true;

            // Para a animação da barra
            if (progressEl) {
                const computado = getComputedStyle(progressEl).transform;
                progressEl.style.transition = "none";
                progressEl.style.transform  = computado;
            }
        });

        el.addEventListener("mouseleave", () => {
            if (entrada.removido) return;
            pausado = false;
            ultimoTick = performance.now();

            // Retoma a barra com o tempo restante
            if (progressEl) {
                progressEl.style.transition = `transform ${tempoRestante}ms linear`;
                progressEl.style.transform  = "scaleX(0)";
            }

            // Reconfigura o timer de saída
            clearTimeout(entrada.timerSaida);
            entrada.timerSaida = setTimeout(() => _remover(entrada), tempoRestante);
        });

        // ── Tick para calcular tempo restante durante hover ──
        entrada.timerProgress = setInterval(() => {
            if (entrada.removido) { clearInterval(entrada.timerProgress); return; }
            if (!pausado) {
                const agora = performance.now();
                tempoRestante -= (agora - ultimoTick);
                ultimoTick = agora;
                if (tempoRestante <= 0) tempoRestante = 0;
            } else {
                ultimoTick = performance.now();
            }
        }, 100);

        // ── Clique para fechar ──
        const btnFechar = el.querySelector(".toast-fechar");
        const fechar    = (e) => {
            e.stopPropagation();
            _remover(entrada);
        };

        btnFechar?.addEventListener("click", fechar);

        // Clique no toast chama callback customizado (se houver)
        el.addEventListener("click", (e) => {
            if (e.target === btnFechar) return;
            if (typeof onClickCustom === "function") {
                try { onClickCustom(); } catch (err) { _log.error("onClick do toast falhou:", err); }
            }
            _remover(entrada);
        });

        // Teclado: Enter/Space para fechar
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                _remover(entrada);
            }
        });

        // ── Timer de saída automática ──
        entrada.timerSaida = setTimeout(() => _remover(entrada), duracao);

        _log.debug(`Toast "${tipo}" exibido por ${duracao}ms.`);
    }

    // ════════════════════════════════════════
    // API PÚBLICA — mostrar()
    // ════════════════════════════════════════

    /**
     * Exibe um toast.
     *
     * Uso simples:
     *   Toast.mostrar("Salvo!", "sucesso");
     *   Toast.mostrar("Erro crítico", "erro", 6000);
     *
     * Uso avançado:
     *   Toast.mostrar("Lendário obtido! 🌟", {
     *       tipo    : "lendario",
     *       duracao : 7000,
     *       icone   : "✨",
     *       onClick : () => UIGacha.abrir()
     *   });
     *
     * @param {string}          msg
     * @param {string|object}   [tipoOuOpcoes="info"]
     * @param {number}          [duracao]
     */
    function mostrar(msg, tipoOuOpcoes = "info", duracao) {
        if (!msg) return;

        // Resolve opções
        let tipo, iconeCustom, onClickCustom;

        if (typeof tipoOuOpcoes === "object" && tipoOuOpcoes !== null) {
            tipo          = tipoOuOpcoes.tipo    ?? "info";
            duracao       = tipoOuOpcoes.duracao ?? DURACAO_PADRAO[tipo] ?? 3000;
            iconeCustom   = tipoOuOpcoes.icone   ?? null;
            onClickCustom = tipoOuOpcoes.onClick ?? null;
        } else {
            tipo    = String(tipoOuOpcoes);
            duracao = duracao ?? DURACAO_PADRAO[tipo] ?? 3000;
        }

        const tipoObj = TIPOS[tipo] ?? TIPOS.info;

        // Deduplicação
        if (_isDuplicata(msg, tipo)) {
            _log.debug(`Toast duplicado ignorado: "${msg}"`);
            return;
        }

        const entrada = { msg, tipo, tipoObj, duracao, iconeCustom, onClickCustom };

        // Se já atingiu o máximo de visíveis, enfileira
        if (_ativos.length >= _cfg.maxVisiveis) {
            _fila.push(entrada);
            _log.debug(`Toast enfileirado. Fila: ${_fila.length}`);
            return;
        }

        _mostrarEntrada(entrada);
    }

    // ════════════════════════════════════════
    // ATALHOS SEMÂNTICOS
    // ════════════════════════════════════════

    /** Toast de informação azul */
    const info = (msg, duracao) => mostrar(msg, "info", duracao);

    /** Toast de sucesso verde */
    const sucesso = (msg, duracao) => mostrar(msg, "sucesso", duracao);

    /** Toast de aviso amarelo */
    const aviso = (msg, duracao) => mostrar(msg, "aviso", duracao);

    /** Toast de erro vermelho (mais duradouro) */
    const erro = (msg, duracao) => mostrar(msg, "erro", duracao);

    /** Toast de item lendário dourado com brilho */
    const lendario = (msg, duracao) => mostrar(msg, "lendario", duracao);

    /** Toast de level up roxo */
    const nivel = (msg, duracao) => mostrar(msg, "nivel", duracao);

    // ════════════════════════════════════════
    // CONTROLES
    // ════════════════════════════════════════

    /**
     * Remove todos os toasts ativos e limpa a fila.
     */
    function limparTodos() {
        [..._ativos].forEach(t => _remover(t));
        _fila = [];
        _log.debug("Todos os toasts removidos.");
    }

    /**
     * Configura o sistema de toasts.
     *
     * Toast.setConfig({
     *     posicao    : "bottom-right",
     *     maxVisiveis: 3
     * });
     *
     * @param {object} opcoes
     */
    function setConfig(opcoes = {}) {
        if (opcoes.posicao     !== undefined) _cfg.posicao      = opcoes.posicao;
        if (opcoes.maxVisiveis !== undefined) _cfg.maxVisiveis  = opcoes.maxVisiveis;
        if (opcoes.gapPx       !== undefined) _cfg.gapPx        = opcoes.gapPx;

        _aplicarPosicao();
        _log.debug("Config atualizada:", { ..._cfg });
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Principal
        mostrar,

        // Atalhos semânticos
        info,
        sucesso,
        aviso,
        erro,
        lendario,
        nivel,

        // Controles
        limparTodos,
        setConfig,

        // Referência dos tipos (para extensão externa)
        get TIPOS() { return TIPOS; }
    });

})();
