// ═══════════════════════════════════════════════════════
//  INPUT.JS
//  Centraliza todos os inputs do jogador:
//  - Click / tap no canvas (batalha e lobby)
//  - Multi-touch com detecção de dedo individual
//  - Arrasto de câmera com inércia (lobby)
//  - Pinch-to-zoom bloqueado (mobile)
//  - Double-tap rápido (burst de cliques)
//  - Teclas de atalho globais
//  - Auto-click (acessibilidade)
//  - Vibração tátil (mobile)
//  - Ripple visual no ponto de toque
//
//  Depende de: battle.js, camera.js, ui-modals.js,
//              event-bus.js, state.js
//  Usado por: main.js
// ═══════════════════════════════════════════════════════

"use strict";

const Input = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Input"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Batalha
        CLICK_THROTTLE_MS   : 16,       // ~60 cliques/s máx
        DOUBLE_TAP_MS       : 280,      // janela de double-tap
        BURST_CLICKS        : 3,        // cliques extras no double-tap
        BURST_DELAY_MS      : 40,       // delay entre cliques do burst

        // Vibração (ms)
        VIB_CLICK           : [8],
        VIB_KILL            : [20, 10, 20],
        VIB_LEVEL_UP        : [30, 15, 30, 15, 60],
        VIB_LENDARIO        : [50, 20, 50, 20, 100],

        // Ripple
        RIPPLE_DURACAO_MS   : 450,
        RIPPLE_RAIO_MAX     : 38,
        RIPPLE_COR_BATALHA  : "rgba(255, 100, 200, 0.55)",
        RIPPLE_COR_LOBBY    : "rgba(157, 78, 221, 0.45)",

        // Auto-click (acessibilidade)
        AUTO_CLICK_MS       : 800,

        // Teclas de atalho
        ATALHOS: {
            "Escape"     : "_fecharModal",
            "KeyB"       : "_toggleBatalha",
            "KeyU"       : "_abrirUpgrades",
            "KeyI"       : "_abrirInvocar",
            "KeyC"       : "_abrirConfig",
            "F1"         : "_toggleDebug",
            "F5"         : null,          // bloqueia refresh acidental
        },
    });

    // ════════════════════════════════════════════════════
    // REFERÊNCIAS
    // ════════════════════════════════════════════════════
    let _canvas     = null;
    let _ctx        = null;

    // ════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════
    const _estado = {
        // Batalha
        ultimoClick    : 0,
        ultimoTap      : 0,

        // Auto-click
        autoClickAtivo : false,
        autoClickTimer : null,

        // Ripples ativos
        ripples        : [],

        // Câmera lobby (estado de drag)
        drag: {
            ativo  : false,
            startX : 0,
            startY : 0,
            lastX  : 0,
            lastY  : 0,
            vx     : 0,
            vy     : 0,
        },

        // Touch tracking (multi-touch)
        touches        : new Map(),   // id → {x, y}
    };

    // ════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════
    function _emBatalha() {
        try   { return GameState.get("emBatalha") === true; }
        catch { return false; }
    }

    function _vibrar(padrao) {
        try { navigator.vibrate?.(padrao); } catch(_) {}
    }

    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch { return String(Math.floor(n ?? 0)); }
    }

    /** Posição do evento relativa ao canvas (respeitando DPR) */
    function _posCanvas(e) {
        const rect = _canvas.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        // clientX/Y são coordenadas CSS — sem multiplicar por DPR
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    function _posTouchCanvas(touch) {
        const rect = _canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    }

    /** Verifica se o toque foi dentro da área de batalha (monstro) */
    function _dentroAreaBatalha(x, y) {
        if (!_canvas) return false;
        // Área central da tela — onde o monstro fica
        const W  = _canvas.getBoundingClientRect().width;
        const H  = _canvas.getBoundingClientRect().height;
        // Exclui faixa superior (HUD) e inferior (painel)
        return x > W * 0.05 && x < W * 0.95 &&
               y > H * 0.05 && y < H * 0.80;
    }

    // ════════════════════════════════════════════════════
    // RIPPLE VISUAL
    // Anel que expande no ponto de toque
    // ════════════════════════════════════════════════════
    function _criarRipple(x, y, cor) {
        _estado.ripples.push({
            x, y,
            raio    : 0,
            raioMax : CFG.RIPPLE_RAIO_MAX,
            alpha   : 0.8,
            cor,
            inicio  : performance.now(),
        });
    }

    /** Chamado a cada frame pelo renderer — via EventBus */
    function _tickRipples(ctx) {
        if (!ctx || _estado.ripples.length === 0) return;

        const agora = performance.now();

        _estado.ripples = _estado.ripples.filter(r => {
            const t = (agora - r.inicio) / CFG.RIPPLE_DURACAO_MS;
            if (t >= 1) return false;

            const ease  = 1 - Math.pow(1 - t, 2);   // ease-out quadratic
            r.raio  = r.raioMax * ease;
            r.alpha = 0.8 * (1 - t);

            ctx.save();
            ctx.strokeStyle = r.cor;
            ctx.lineWidth   = 2.5 * (1 - t * 0.5);
            ctx.globalAlpha = r.alpha;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.raio, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            return true;
        });
    }

    // ════════════════════════════════════════════════════
    // CLIQUE NA BATALHA
    // ════════════════════════════════════════════════════
    function _processarClickBatalha(x, y) {
        const agora = performance.now();

        // Throttle
        if (agora - _estado.ultimoClick < CFG.CLICK_THROTTLE_MS) return;
        _estado.ultimoClick = agora;

        // Double-tap → burst
        const deltaTap = agora - _estado.ultimoTap;
        _estado.ultimoTap = agora;

        if (deltaTap < CFG.DOUBLE_TAP_MS) {
            _dispararBurst(x, y);
        } else {
            _dispararClick(x, y);
        }
    }

    function _dispararClick(x, y) {
        // Ripple
        _criarRipple(x, y, CFG.RIPPLE_COR_BATALHA);

        // Vibração
        _vibrar(CFG.VIB_CLICK);

        // Dano
        try { Battle.clickDano(); }
        catch(_) {
            try { EventBus.emit("input:click", { x, y }); } catch(_) {}
        }

        // Camera shake
        try { Camera.batalha.shakeClick(); } catch(_) {}

        // Animação da Santa
        try {
            EventBus.emit("damage:click:visual", { x, y });
        } catch(_) {}
    }

    /** Double-tap: dispara vários cliques em sequência */
    function _dispararBurst(x, y) {
        _criarRipple(x, y, "rgba(255, 215, 0, 0.65)");

        for (let i = 0; i < CFG.BURST_CLICKS; i++) {
            setTimeout(() => {
                _dispararClick(
                    x + (Math.random() - 0.5) * 20,
                    y + (Math.random() - 0.5) * 20
                );
            }, i * CFG.BURST_DELAY_MS);
        }
    }

    // ════════════════════════════════════════════════════
    // MOUSE — BATALHA E LOBBY
    // ════════════════════════════════════════════════════
    function _onMouseDown(e) {
        if (e.button !== 0) return;   // só botão esquerdo

        if (_emBatalha()) {
            // Batalha: clique direto
            const pos = _posCanvas(e);
            if (_dentroAreaBatalha(pos.x, pos.y)) {
                _processarClickBatalha(pos.x, pos.y);
            }
        } else {
            // Lobby: inicia drag da câmera
            _estado.drag.ativo  = true;
            _estado.drag.startX = e.clientX;
            _estado.drag.startY = e.clientY;
            _estado.drag.lastX  = e.clientX;
            _estado.drag.lastY  = e.clientY;
            _estado.drag.vx     = 0;
            _estado.drag.vy     = 0;
            _canvas.style.cursor = "grabbing";
        }
    }

    function _onMouseMove(e) {
        if (!_estado.drag.ativo || _emBatalha()) return;

        const dx = e.clientX - _estado.drag.lastX;
        const dy = e.clientY - _estado.drag.lastY;

        _estado.drag.vx = dx;
        _estado.drag.vy = dy;

        try { Camera.lobby.mover(-dx, -dy); } catch(_) {}

        _estado.drag.lastX = e.clientX;
        _estado.drag.lastY = e.clientY;
    }

    function _onMouseUp(e) {
        if (!_estado.drag.ativo) return;
        _estado.drag.ativo   = false;
        _canvas.style.cursor = "default";

        // Aplica inércia residual
        try {
            Camera.lobby.aplicarInercia(
                -_estado.drag.vx,
                -_estado.drag.vy
            );
        } catch(_) {}
    }

    function _onMouseLeave() {
        if (_estado.drag.ativo) _onMouseUp({});
    }

    // ════════════════════════════════════════════════════
    // TOUCH — MOBILE
    // ════════════════════════════════════════════════════
    function _onTouchStart(e) {
        // Bloqueia comportamentos padrão (scroll, zoom)
        e.preventDefault();

        Array.from(e.changedTouches).forEach(t => {
            _estado.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
        });

        // Pinch-to-zoom: 2+ dedos → ignora como clique
        if (e.touches.length >= 2) {
            _estado.drag.ativo = false;
            return;
        }

        const touch = e.changedTouches[0];
        const pos   = _posTouchCanvas(touch);

        if (_emBatalha()) {
            if (_dentroAreaBatalha(pos.x, pos.y)) {
                _processarClickBatalha(pos.x, pos.y);
            }
        } else {
            _estado.drag.ativo  = true;
            _estado.drag.startX = touch.clientX;
            _estado.drag.startY = touch.clientY;
            _estado.drag.lastX  = touch.clientX;
            _estado.drag.lastY  = touch.clientY;
            _estado.drag.vx     = 0;
            _estado.drag.vy     = 0;
        }
    }

    function _onTouchMove(e) {
        e.preventDefault();

        // Pinch-to-zoom bloqueado
        if (e.touches.length >= 2) return;

        if (!_estado.drag.ativo || _emBatalha()) return;

        const touch = e.changedTouches[0];
        const dx    = touch.clientX - _estado.drag.lastX;
        const dy    = touch.clientY - _estado.drag.lastY;

        _estado.drag.vx = dx;
        _estado.drag.vy = dy;

        try { Camera.lobby.mover(-dx, -dy); } catch(_) {}

        _estado.drag.lastX = touch.clientX;
        _estado.drag.lastY = touch.clientY;

        // Atualiza tracking
        Array.from(e.changedTouches).forEach(t => {
            _estado.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
        });
    }

    function _onTouchEnd(e) {
        e.preventDefault();

        Array.from(e.changedTouches).forEach(t => {
            _estado.touches.delete(t.identifier);
        });

        if (e.touches.length === 0 && _estado.drag.ativo) {
            _estado.drag.ativo = false;
            try {
                Camera.lobby.aplicarInercia(-_estado.drag.vx, -_estado.drag.vy);
            } catch(_) {}
        }
    }

    function _onTouchCancel(e) {
        _estado.drag.ativo = false;
        _estado.touches.clear();
    }

    // ════════════════════════════════════════════════════
    // PREVENÇÃO DE ZOOM (mobile)
    // ════════════════════════════════════════════════════
    function _prevenirZoom() {
        // Double-tap zoom no body
        document.addEventListener("touchstart", e => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        // Pinch zoom no document
        document.addEventListener("gesturestart",  e => e.preventDefault(), { passive: false });
        document.addEventListener("gesturechange", e => e.preventDefault(), { passive: false });
        document.addEventListener("gestureend",    e => e.preventDefault(), { passive: false });

        // CSS extra
        document.documentElement.style.touchAction = "pan-x pan-y";
    }

    // ════════════════════════════════════════════════════
    // SCROLL — bloqueia zoom com Ctrl+Wheel
    // ════════════════════════════════════════════════════
    function _onWheel(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            return;
        }

        // No lobby: scroll move a câmera verticalmente
        if (!_emBatalha()) {
            try { Camera.lobby.mover(0, e.deltaY * 0.5); } catch(_) {}
        }
    }

    // ════════════════════════════════════════════════════
    // TECLADO — atalhos globais
    // ════════════════════════════════════════════════════
    const _acoes = {
        _fecharModal() {
            try { UIModals.fechar(); } catch(_) {}
        },

        _toggleBatalha() {
            if (_emBatalha()) {
                try { Battle.sair(); } catch(_) {
                    try { EventBus.emit("batalha:pedidoSair"); } catch(_) {}
                }
            } else {
                try { Battle.iniciar(); } catch(_) {
                    try { EventBus.emit("batalha:pedidoIniciar"); } catch(_) {}
                }
            }
        },

        _abrirUpgrades() {
            try { UIUpgrades.togglePainel?.(); } catch(_) {}
        },

        _abrirInvocar() {
            try { UIGacha.abrir(); } catch(_) {
                try { UIModals.abrir("modalInvocar"); } catch(_) {}
            }
        },

        _abrirConfig() {
            try { UIConfig.abrir(); } catch(_) {
                try { UIModals.abrir("janelaConfig"); } catch(_) {}
            }
        },

        _toggleDebug() {
            try {
                const ativo = Renderer.stats().debug ?? false;
                EventBus.emit("debug:toggle", { ativo: !ativo });
            } catch(_) {}
        },

        // Espaço = clique no canvas quando em batalha
        _clickPorTeclado() {
            if (!_emBatalha()) return;
            const W = _canvas?.getBoundingClientRect().width  ?? 300;
            const H = _canvas?.getBoundingClientRect().height ?? 400;
            _processarClickBatalha(W * 0.50, H * 0.38);
        },
    };

    function _onKeyDown(e) {
        // Ignora se está digitando em input/textarea
        const tag = document.activeElement?.tagName ?? "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        // Espaço = clique
        if (e.code === "Space") {
            e.preventDefault();
            _acoes._clickPorTeclado();
            return;
        }

        // F5 — bloqueia refresh acidental durante batalha
        if (e.code === "F5" && _emBatalha()) {
            e.preventDefault();
            try { Toast.aviso("💾 Use o menu para sair — seu progresso é salvo automaticamente!"); } catch(_) {}
            return;
        }

        const acao = CFG.ATALHOS[e.code];
        if (!acao || !(acao in _acoes)) return;

        e.preventDefault();
        try { _acoes[acao](); }
        catch(err) { _log.warn(`Erro no atalho "${e.code}":`, err); }
    }

    // ════════════════════════════════════════════════════
    // AUTO-CLICK (acessibilidade)
    // Permite jogar sem segurar o dedo na tela
    // ════════════════════════════════════════════════════
    function _toggleAutoClick(ativo) {
        _estado.autoClickAtivo = ativo;

        if (_estado.autoClickTimer) {
            clearInterval(_estado.autoClickTimer);
            _estado.autoClickTimer = null;
        }

        if (ativo) {
            _estado.autoClickTimer = setInterval(() => {
                if (!_emBatalha()) return;
                const W = _canvas?.getBoundingClientRect().width  ?? 300;
                const H = _canvas?.getBoundingClientRect().height ?? 400;
                _processarClickBatalha(W * 0.50, H * 0.38);
            }, CFG.AUTO_CLICK_MS);
            try { Toast.info("🤖 Auto-clique ativado!"); } catch(_) {}
        } else {
            try { Toast.info("🤖 Auto-clique desativado."); } catch(_) {}
        }

        try { EventBus.emit("input:autoclick", { ativo }); } catch(_) {}
        _log.debug(`Auto-click: ${ativo}`);
    }

    // ════════════════════════════════════════════════════
    // EVENTOS DO EVENTBUS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Vibração em eventos especiais
            EventBus.on("kill:registrado",         () => _vibrar(CFG.VIB_KILL));
            EventBus.on("nivel:up",                () => _vibrar(CFG.VIB_LEVEL_UP));
            EventBus.on("gacha:pull:lendario",     () => _vibrar(CFG.VIB_LENDARIO));

            // Ripples via evento externo
            EventBus.on("input:ripple", ({ x, y, cor }) => {
                _criarRipple(x, y, cor ?? CFG.RIPPLE_COR_BATALHA);
            });

            // Auto-click toggle
            EventBus.on("input:autoclick:toggle", ({ ativo }) => {
                _toggleAutoClick(ativo ?? !_estado.autoClickAtivo);
            });

            // Renderer requisita draw dos ripples
            EventBus.on("renderer:preframe", ({ ctx }) => {
                if (ctx) _tickRipples(ctx);
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR TODOS OS LISTENERS NO CANVAS
    // ════════════════════════════════════════════════════
    function _registrarListeners() {
        // Mouse
        _canvas.addEventListener("mousedown",   _onMouseDown);
        _canvas.addEventListener("mousemove",   _onMouseMove);
        _canvas.addEventListener("mouseup",     _onMouseUp);
        _canvas.addEventListener("mouseleave",  _onMouseLeave);

        // Touch
        _canvas.addEventListener("touchstart",  _onTouchStart,  { passive: false });
        _canvas.addEventListener("touchmove",   _onTouchMove,   { passive: false });
        _canvas.addEventListener("touchend",    _onTouchEnd,    { passive: false });
        _canvas.addEventListener("touchcancel", _onTouchCancel, { passive: false });

        // Wheel
        _canvas.addEventListener("wheel",       _onWheel,       { passive: false });

        // Teclado — global
        document.addEventListener("keydown",    _onKeyDown);

        // Context menu — desabilita clique direito no canvas
        _canvas.addEventListener("contextmenu", e => e.preventDefault());

        _log.debug("Listeners registrados no canvas.");
    }

    // ════════════════════════════════════════════════════
    // CSS — cursor customizado e ripple container
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__input_css__")) return;

        const s = document.createElement("style");
        s.id    = "__input_css__";
        s.textContent = `
            #game {
                cursor          : crosshair;
                user-select     : none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
                touch-action    : none;
            }
            #game:active { cursor: crosshair; }

            /* Cursor especial na batalha */
            body.__em_batalha__ #game {
                cursor          : url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ctext y='20' font-size='20'%3E🌹%3C/text%3E%3C/svg%3E") 12 12, crosshair;
            }

            /* Overlay de atalhos (F1) */
            .__atalhos_overlay__ {
                position        : fixed;
                bottom          : 80px;
                left            : 50%;
                transform       : translateX(-50%);
                background      : rgba(0,0,0,0.80);
                color           : rgba(255,255,255,0.85);
                padding         : 10px 16px;
                border-radius   : 10px;
                font-size       : 12px;
                font-family     : monospace;
                border          : 1px solid rgba(255,255,255,0.15);
                pointer-events  : none;
                z-index         : 9999;
                display         : grid;
                grid-template-columns: auto auto;
                gap             : 4px 16px;
            }
            .__atalho_key__ {
                background      : rgba(255,255,255,0.12);
                padding         : 1px 6px;
                border-radius   : 4px;
                font-weight     : 700;
                color           : #c084fc;
            }
        `;
        document.head.appendChild(s);
    }

    // ════════════════════════════════════════════════════
    // OVERLAY DE ATALHOS (F1)
    // ════════════════════════════════════════════════════
    let _overlayAtalhos = null;

    function _toggleOverlayAtalhos() {
        if (_overlayAtalhos) {
            _overlayAtalhos.remove();
            _overlayAtalhos = null;
            return;
        }

        const atalhosList = [
            ["Space / Toque", "Atacar"],
            ["B",             "Entrar/Sair batalha"],
            ["U",             "Upgrades"],
            ["I",             "Invocar (Gacha)"],
            ["C",             "Configurações"],
            ["Esc",           "Fechar modal"],
            ["F1",            "Este menu"],
        ];

        _overlayAtalhos = document.createElement("div");
        _overlayAtalhos.className = "__atalhos_overlay__";

        atalhosList.forEach(([tecla, desc]) => {
            const k = document.createElement("span");
            k.className   = "__atalho_key__";
            k.textContent = tecla;

            const d = document.createElement("span");
            d.textContent = desc;

            _overlayAtalhos.appendChild(k);
            _overlayAtalhos.appendChild(d);
        });

        document.body.appendChild(_overlayAtalhos);

        // Auto-remove em 4s
        setTimeout(() => {
            _overlayAtalhos?.remove();
            _overlayAtalhos = null;
        }, 4000);
    }

    // Sobrescreve a ação de F1 para mostrar overlay
    _acoes._toggleDebug = function() {
        _toggleOverlayAtalhos();
    };

    // ════════════════════════════════════════════════════
    // REAGE À MUDANÇA DE MODO (batalha/lobby)
    // ════════════════════════════════════════════════════
    function _registrarModoEvents() {
        try {
            EventBus.on("batalha:iniciou", () => {
                document.body.classList.add("__em_batalha__");
            });
            EventBus.on("batalha:saiu", () => {
                document.body.classList.remove("__em_batalha__");
                _estado.drag.ativo = false;
            });
        } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init(canvas) {
        if (!canvas) {
            _log.error("init: canvas não fornecido.");
            return;
        }

        _canvas = canvas;
        _ctx    = canvas.getContext("2d");

        _injetarCSS();
        _prevenirZoom();
        _registrarListeners();
        _registrarEventos();
        _registrarModoEvents();

        _log.info("Input inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            autoClick  : _estado.autoClickAtivo,
            ripples    : _estado.ripples.length,
            touches    : _estado.touches.size,
            drag       : _estado.drag.ativo,
            ultimoClick: _estado.ultimoClick,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        toggleAutoClick: _toggleAutoClick,
        stats,

        // Expõe para testes
        processarClick: _processarClickBatalha,
    });

})();
window.Input = Input;
