// ═══════════════════════════════════════════════════════
//  RENDERER-MAIN.JS
//  Loop principal de renderização:
//  - requestAnimationFrame com delta time real
//  - Decide lobby vs batalha via GameState
//  - FPS counter + frame budget monitor
//  - Pausa automática quando aba fica oculta
//  - Resize responsivo do canvas
//  - Câmera shake integrada com Camera.js
//
//  Depende de: renderer-lobby.js, renderer-battle.js,
//              state.js, camera.js, effects.js
//  Usado por: main.js
// ═══════════════════════════════════════════════════════

"use strict";

const Renderer = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Renderer"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // FPS
        FPS_ALVO          : 60,
        FPS_JANELA        : 60,      // amostras para média
        FPS_DISPLAY_MS    : 500,     // atualiza display a cada Xms

        // Delta time
        DELTA_MAX_MS      : 100,     // cap — evita "espiral da morte"
        DELTA_SUAVE_FATOR : 0.1,     // lerp para suavização do delta

        // Frame budget (ms disponíveis por frame a 60fps)
        FRAME_BUDGET_MS   : 1000 / 60,

        // Pausa quando aba oculta
        PAUSAR_EM_HIDDEN  : true,

        // Canvas
        PIXEL_RATIO       : true,    // usa devicePixelRatio
    });

    // ════════════════════════════════════════════════════
    // REFERÊNCIAS
    // ════════════════════════════════════════════════════
    let _canvas  = null;
    let _ctx     = null;

    // ════════════════════════════════════════════════════
    // ESTADO DO LOOP
    // ════════════════════════════════════════════════════
    const _loop = {
        rodando      : false,
        rafId        : null,
        pausado      : false,    // tab oculta
        ultimoTimestamp: 0,
    };

    // ════════════════════════════════════════════════════
    // DELTA TIME
    // Garante animações independentes do FPS real
    // ════════════════════════════════════════════════════
    const _delta = {
        ms        : CFG.FRAME_BUDGET_MS,   // delta suavizado atual
        msBruto   : CFG.FRAME_BUDGET_MS,   // delta bruto do frame
        fator     : 1.0,                   // delta / frame_budget (1.0 = 60fps perfeito)
    };

    function _calcularDelta(timestamp) {
        const bruto = timestamp - _loop.ultimoTimestamp;
        _loop.ultimoTimestamp = timestamp;

        // Cap para evitar saltos enormes após tab inativa
        const capado = Math.min(bruto, CFG.DELTA_MAX_MS);

        // Suavização exponencial
        _delta.msBruto = capado;
        _delta.ms      = _delta.ms + (capado - _delta.ms) * CFG.DELTA_SUAVE_FATOR;
        _delta.fator   = _delta.ms / CFG.FRAME_BUDGET_MS;
    }

    // ════════════════════════════════════════════════════
    // FPS COUNTER
    // ════════════════════════════════════════════════════
    const _fps = {
        amostras      : new Float32Array(CFG.FPS_JANELA),
        indice        : 0,
        media         : 60,
        min           : 60,
        max           : 60,
        ultimoDisplay : 0,
        total         : 0,          // frames desde init
    };

    function _registrarFPS(timestamp) {
        const fps = _delta.msBruto > 0 ? 1000 / _delta.msBruto : 60;

        _fps.amostras[_fps.indice % CFG.FPS_JANELA] = fps;
        _fps.indice++;
        _fps.total++;

        // Atualiza estatísticas a cada CFG.FPS_DISPLAY_MS
        if (timestamp - _fps.ultimoDisplay >= CFG.FPS_DISPLAY_MS) {
            _fps.ultimoDisplay = timestamp;

            const count = Math.min(_fps.indice, CFG.FPS_JANELA);
            let soma = 0, min = Infinity, max = 0;

            for (let i = 0; i < count; i++) {
                const v = _fps.amostras[i];
                soma += v;
                if (v < min) min = v;
                if (v > max) max = v;
            }

            _fps.media = soma / count;
            _fps.min   = min;
            _fps.max   = max;

            // Emite evento para HUD de debug
            try {
                EventBus.emit("renderer:fps", {
                    media : Math.round(_fps.media),
                    min   : Math.round(_fps.min),
                    max   : Math.round(_fps.max),
                    delta : _delta.ms.toFixed(2),
                    fator : _delta.fator.toFixed(3),
                    frames: _fps.total,
                });
            } catch(_) {}

            // Warning se FPS caiu muito
            if (_fps.media < 30) {
                _log.warn(`FPS baixo: ${Math.round(_fps.media)} (min:${Math.round(_fps.min)})`);
            }
        }
    }

    // ════════════════════════════════════════════════════
    // FRAME BUDGET MONITOR
    // Mede quanto tempo cada frame levou para renderizar
    // ════════════════════════════════════════════════════
    const _budget = {
        ultimoInicio  : 0,
        mediaMs       : 0,
        alertas       : 0,    // frames acima do budget
    };

    function _budgetInicio() {
        _budget.ultimoInicio = performance.now();
    }

    function _budgetFim() {
        const gasto = performance.now() - _budget.ultimoInicio;
        _budget.mediaMs = _budget.mediaMs * 0.95 + gasto * 0.05;

        if (gasto > CFG.FRAME_BUDGET_MS * 1.5) {
            _budget.alertas++;
            if (_budget.alertas % 60 === 1) {
                _log.warn(`Frame lento: ${gasto.toFixed(1)}ms (budget: ${CFG.FRAME_BUDGET_MS.toFixed(1)}ms)`);
            }
        }
    }

    // ════════════════════════════════════════════════════
    // CANVAS — setup e resize
    // ════════════════════════════════════════════════════
    function _setupCanvas(canvas) {
        _canvas = canvas;
        _ctx    = canvas.getContext("2d");

        // Desativa suavização — pixel art nítido
        _ctx.imageSmoothingEnabled = false;

        _redimensionar();

        window.addEventListener("resize", _redimensionar);

        _log.debug(`Canvas configurado: ${canvas.width}×${canvas.height}`);
    }

    function _redimensionar() {
        if (!_canvas) return;

        const dpr = CFG.PIXEL_RATIO ? (window.devicePixelRatio || 1) : 1;
        const W   = window.innerWidth;
        const H   = window.innerHeight;

        // Tamanho CSS (visual)
        _canvas.style.width  = W + "px";
        _canvas.style.height = H + "px";

        // Tamanho real em pixels (para telas HiDPI / Retina)
        _canvas.width  = Math.floor(W * dpr);
        _canvas.height = Math.floor(H * dpr);

        // Escala o ctx para compensar o dpr
        _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Reimporta configurações que o resize reseta
        _ctx.imageSmoothingEnabled = false;

        // Notifica submódulos
        try { RendererLobby.aoRedimensionar();  } catch(_) {}
        try { Camera.lobby.centralizarMapa?.();  } catch(_) {}

        try {
            EventBus.emit("renderer:resize", { width: W, height: H, dpr });
        } catch(_) {}

        _log.debug(`Resize: ${W}×${H} (dpr: ${dpr})`);
    }

    // ════════════════════════════════════════════════════
    // CÂMERA SHAKE — offset aplicado ao canvas
    // ════════════════════════════════════════════════════
    function _obterShake() {
        try {
            return Camera.batalha.obterOffset?.() ?? { x: 0, y: 0 };
        } catch(_) {
            return { x: 0, y: 0 };
        }
    }

    // ════════════════════════════════════════════════════
    // ASSETS — obtém do AssetLoader
    // ════════════════════════════════════════════════════
    function _obterAssets() {
        try   { return AssetLoader.assets; }
        catch { return {}; }
    }

    // ════════════════════════════════════════════════════
    // ESTADO — decide o que renderizar
    // ════════════════════════════════════════════════════
    function _emBatalha() {
        try   { return GameState.get("emBatalha") === true; }
        catch { return false; }
    }

    // ════════════════════════════════════════════════════
    // LOOP PRINCIPAL
    // ════════════════════════════════════════════════════
    function _frame(timestamp) {
        // Agenda próximo frame ANTES de qualquer trabalho
        // (garante que mesmo um erro não trava o loop)
        _loop.rafId = requestAnimationFrame(_frame);

        // Pausa quando aba está oculta
        if (_loop.pausado) {
            _loop.ultimoTimestamp = timestamp;
            return;
        }

        // Primeiro frame — inicializa timestamp
        if (_loop.ultimoTimestamp === 0) {
            _loop.ultimoTimestamp = timestamp;
            return;
        }

        // ── Métricas ──
        _calcularDelta(timestamp);
        _registrarFPS(timestamp);
        _budgetInicio();

        // ── Atualiza câmera ──
        const emBatalha = _emBatalha();
        try { Camera.atualizar(emBatalha); } catch(_) {}

        // ── Renderiza ──
        const assets = _obterAssets();

        if (emBatalha) {
            _renderBatalha(assets);
        } else {
            _renderLobby(assets);
        }

        // ── Effects.atualizar (sempre, para não perder animações em transições) ──
        try { Effects.atualizar(); } catch(_) {}

        // ── Overlay de debug (só em dev) ──
        _desenharDebugOverlay(timestamp);

        _budgetFim();
    }

    // ════════════════════════════════════════════════════
    // RENDER — BATALHA
    // ════════════════════════════════════════════════════
    function _renderBatalha(assets) {
        const shake = _obterShake();

        try {
            RendererBattle.desenhar(assets, shake.x, shake.y);
        } catch(e) {
            _log.error("Erro em RendererBattle.desenhar:", e);
            _desenharTelaDeFallback("⚔️ Batalha");
        }
    }

    // ════════════════════════════════════════════════════
    // RENDER — LOBBY
    // ════════════════════════════════════════════════════
    function _renderLobby(assets) {
        try {
            RendererLobby.atualizar(assets);
        } catch(e) {
            _log.error("Erro em RendererLobby.atualizar:", e);
            _desenharTelaDeFallback("🏛️ Lobby");
        }
    }

    // ════════════════════════════════════════════════════
    // TELA DE FALLBACK
    // Exibida quando um renderer trava — o jogo não morre
    // ════════════════════════════════════════════════════
    function _desenharTelaDeFallback(label) {
        if (!_ctx) return;

        const W = window.innerWidth;
        const H = window.innerHeight;

        _ctx.fillStyle = "#0a0a1a";
        _ctx.fillRect(0, 0, W, H);

        _ctx.save();
        _ctx.font         = "24px 'Nunito', sans-serif";
        _ctx.fillStyle    = "rgba(255,80,80,0.8)";
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";
        _ctx.fillText(`⚠️ Erro no renderer — ${label}`, W / 2, H / 2);
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // DEBUG OVERLAY
    // Exibido apenas em modo dev (localhost / ?debug)
    // ════════════════════════════════════════════════════
    let _debugAtivo = false;

    function _verificarModoDebug() {
        try {
            _debugAtivo = Logger.modoDebug?.() ?? false;
        } catch(_) {
            _debugAtivo = location.hostname === "localhost" ||
                          location.search.includes("debug");
        }
    }

    function _desenharDebugOverlay(timestamp) {
        if (!_debugAtivo || !_ctx) return;

        const linhas = [
            `FPS: ${Math.round(_fps.media)} (min:${Math.round(_fps.min)} max:${Math.round(_fps.max)})`,
            `Delta: ${_delta.ms.toFixed(1)}ms  Fator: ${_delta.fator.toFixed(3)}`,
            `Frame: ${_budget.mediaMs.toFixed(1)}ms  Lentos: ${_budget.alertas}`,
            `Total frames: ${_fps.total}`,
            `Modo: ${_emBatalha() ? "BATALHA" : "LOBBY"}`,
        ];

        // Stats do Effects se disponível
        try {
            const ef = Effects.stats();
            linhas.push(
                `Flores:${ef.floresCeu} Proj:${ef.projeteis} Part:${ef.particulas}`,
                `Moedas:${ef.moedas} Textos:${ef.textos}`
            );
        } catch(_) {}

        const PAD  = 10;
        const LH   = 16;
        const W    = 260;
        const H    = linhas.length * LH + PAD * 2;
        const X    = 8;
        const Y    = 8;

        _ctx.save();

        // Fundo semi-transparente
        _ctx.fillStyle = "rgba(0,0,0,0.65)";
        _ctx.beginPath();
        _ctx.roundRect?.(X, Y, W, H, 6) ?? _ctx.rect(X, Y, W, H);
        _ctx.fill();

        // Borda
        _ctx.strokeStyle = "rgba(255,255,255,0.15)";
        _ctx.lineWidth   = 1;
        _ctx.stroke();

        // Texto
        _ctx.font         = "bold 11px 'Courier New', monospace";
        _ctx.textAlign    = "left";
        _ctx.textBaseline = "top";

        linhas.forEach((linha, i) => {
            // Cor por tipo de linha
            if (i === 0) {
                // FPS — verde se ok, amarelo se médio, vermelho se ruim
                _ctx.fillStyle = _fps.media >= 50 ? "#44ff88"
                               : _fps.media >= 30 ? "#f5a623"
                               : "#ff4444";
            } else if (i === 2 && _budget.alertas > 0) {
                _ctx.fillStyle = "#f5a623";
            } else {
                _ctx.fillStyle = "rgba(255,255,255,0.80)";
            }

            _ctx.fillText(linha, X + PAD, Y + PAD + i * LH);
        });

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // PAUSA POR VISIBILIDADE
    // ════════════════════════════════════════════════════
    function _registrarVisibilidade() {
        if (!CFG.PAUSAR_EM_HIDDEN) return;

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                _loop.pausado = true;
                _log.debug("Loop pausado — tab oculta.");
                try { EventBus.emit("renderer:pausado"); } catch(_) {}
            } else {
                _loop.pausado = false;
                _loop.ultimoTimestamp = 0;   // reset delta para evitar salto
                _log.debug("Loop retomado.");
                try { EventBus.emit("renderer:retomado"); } catch(_) {}
            }
        });
    }

    // ════════════════════════════════════════════════════
    // START / STOP
    // ════════════════════════════════════════════════════
    function start(canvas) {
        if (_loop.rodando) {
            _log.warn("Renderer já está rodando.");
            return;
        }

        if (!canvas) {
            _log.error("start: canvas não fornecido.");
            return;
        }

        _setupCanvas(canvas);
        _verificarModoDebug();
        _registrarVisibilidade();

        _loop.rodando       = true;
        _loop.ultimoTimestamp = 0;

        _log.info("Renderer iniciado.");

        // Kick-off do loop
        _loop.rafId = requestAnimationFrame(_frame);
    }

    function stop() {
        if (!_loop.rodando) return;

        if (_loop.rafId !== null) {
            cancelAnimationFrame(_loop.rafId);
            _loop.rafId = null;
        }

        _loop.rodando = false;
        _log.info(`Renderer parado após ${_fps.total} frames.`);
    }

    // ════════════════════════════════════════════════════
    // SCREENSHOT
    // ════════════════════════════════════════════════════
    function screenshot() {
        if (!_canvas) return null;
        try {
            return _canvas.toDataURL("image/png");
        } catch(e) {
            _log.error("Screenshot falhou:", e);
            return null;
        }
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            rodando  : _loop.rodando,
            pausado  : _loop.pausado,
            fps      : {
                media : Math.round(_fps.media),
                min   : Math.round(_fps.min),
                max   : Math.round(_fps.max),
                total : _fps.total,
            },
            delta    : {
                ms    : +_delta.ms.toFixed(2),
                fator : +_delta.fator.toFixed(3),
            },
            budget   : {
                mediaMs : +_budget.mediaMs.toFixed(2),
                alertas : _budget.alertas,
            },
            canvas   : _canvas
                ? { w: _canvas.width, h: _canvas.height }
                : null,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        start,
        stop,
        screenshot,
        stats,

        // Expõe delta para animações externas (battle.js, effects.js)
        get delta()  { return _delta.fator; },
        get fps()    { return Math.round(_fps.media); },
        get rodando(){ return _loop.rodando; },
    });

})();
