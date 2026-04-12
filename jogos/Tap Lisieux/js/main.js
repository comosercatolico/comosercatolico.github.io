// ═══════════════════════════════════════════════════════
//  MAIN.JS — Entry point do jogo Tap Lisieux
//  Inicializa todos os módulos na ordem correta,
//  exibe tela de loading com progresso real,
//  e conecta sistemas novos + legados em paralelo.
//
//  Arquitetura de inicialização:
//  FASE 1 → Verificação de suporte
//  FASE 2 → Módulos base (logger, events, dom, utils)
//  FASE 3 → Assets (imagens)
//  FASE 4 → Canvas
//  FASE 5 → Estado + Save
//  FASE 6 → Sistemas de lógica
//  FASE 7 → UI
//  FASE 8 → Input + Áudio
//  FASE 9 → Renderer (loop)
//  FASE 10→ Pós-init (eventos, autosave, debug)
//
//  Depende de: TODOS os módulos carregados antes no HTML
// ═══════════════════════════════════════════════════════

"use strict";

// ════════════════════════════════════════════════════════
// FASE 1 — VERIFICAÇÃO DE SUPORTE
// ════════════════════════════════════════════════════════
(function _verificarSuporte() {
    const requisitos = [
        { ok: typeof Map                              !== "undefined", nome: "Map"                   },
        { ok: typeof Set                              !== "undefined", nome: "Set"                   },
        { ok: typeof Promise                          !== "undefined", nome: "Promise"               },
        { ok: typeof requestAnimationFrame            !== "undefined", nome: "requestAnimationFrame" },
        { ok: typeof localStorage                     !== "undefined", nome: "localStorage"          },
        { ok: typeof performance?.now                 === "function",  nome: "performance.now"       },
        { ok: !!document.createElement("canvas").getContext,           nome: "Canvas 2D"             },
    ];

    const falhou = requisitos.filter(r => !r.ok);
    if (falhou.length === 0) return;

    const lista = falhou.map(r => r.nome).join(", ");

    document.body.innerHTML = `
        <div style="
            min-height:100vh; display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            font-family:'Nunito',sans-serif; background:#06030f; color:#fff;
            padding:40px 20px; text-align:center; box-sizing:border-box;">
            <div style="font-size:52px; margin-bottom:16px">🌹</div>
            <h2 style="color:#f5a623; font-size:22px; margin-bottom:12px">
                Navegador incompatível
            </h2>
            <p style="color:rgba(255,255,255,0.6); max-width:380px; line-height:1.7; font-size:14px">
                Seu navegador não suporta:<br>
                <strong style="color:#ff6b6b">${lista}</strong><br><br>
                Use Chrome 90+, Firefox 90+, Edge 90+ ou Safari 15+.
            </p>
        </div>`;

    throw new Error(`[Main] Suporte insuficiente: ${lista}`);
})();

// ════════════════════════════════════════════════════════
// TELA DE LOADING
// ════════════════════════════════════════════════════════
const Loading = (() => {
    const _raiz     = document.getElementById("telaLoading");
    const _barra    = document.getElementById("loadingBarra");
    const _texto    = document.getElementById("loadingTexto");
    const _subTexto = document.getElementById("loadingSubTexto");

    let _pct = 0;

    function progresso(pct, msg, sub) {
        _pct = Math.max(_pct, Math.min(100, pct));
        if (_barra)                         _barra.style.width  = `${_pct}%`;
        if (_texto    && msg)               _texto.textContent  = msg;
        if (_subTexto && sub !== undefined) _subTexto.textContent = sub;
    }

    function esconder() {
        if (!_raiz) return;
        _raiz.style.transition = "opacity 0.55s ease";
        _raiz.style.opacity    = "0";
        setTimeout(() => { if (_raiz) _raiz.style.display = "none"; }, 580);
    }

    function erroFatal(mensagem, detalhes) {
        if (!_raiz) return;
        _raiz.style.opacity = "1";
        _raiz.style.display = "flex";
        _raiz.innerHTML = `
            <div id="loadingConteudo" style="text-align:center">
                <div style="font-size:48px; margin-bottom:16px">⚠️</div>
                <h2 style="color:#f5a623; margin-bottom:10px">Erro ao iniciar</h2>
                <p style="color:rgba(255,255,255,0.6); font-size:13px;
                           max-width:320px; line-height:1.7; margin-bottom:20px">
                    ${mensagem ?? "Ocorreu um erro inesperado."}
                </p>
                <button onclick="location.reload()"
                    style="background:linear-gradient(135deg,#6d28d9,#9d4edd);
                           border:none; border-radius:12px; color:#fff;
                           padding:12px 28px; font-size:14px; font-weight:700;
                           cursor:pointer; font-family:inherit">
                    🔄 Recarregar
                </button>
                ${detalhes ? `
                <details style="margin-top:20px; color:#555; font-size:11px; max-width:320px">
                    <summary style="cursor:pointer; color:#777; user-select:none">
                        Detalhes técnicos
                    </summary>
                    <pre style="margin-top:8px; text-align:left; white-space:pre-wrap;
                                word-break:break-all; color:#f87171">${detalhes}</pre>
                </details>` : ""}
            </div>`;
    }

    return { progresso, esconder, erroFatal };
})();

// ════════════════════════════════════════════════════════
// REGISTRO DE MÓDULOS
// ════════════════════════════════════════════════════════
const _M = (() => {
    function get(nome) {
        try { return typeof window[nome] !== "undefined" ? window[nome] : null; }
        catch { return null; }
    }

    function chamar(nome, fn, ...args) {
        const m = get(nome);
        if (!m) return false;
        if (typeof m[fn] !== "function") return false;
        try   { m[fn](...args); return true; }
        catch(e) { console.warn(`[Main] ${nome}.${fn}() falhou:`, e); return false; }
    }

    function checar(nome, obrigatorio = false) {
        const presente = get(nome) !== null;
        if (!presente) {
            obrigatorio
                ? console.error(`[Main] ❌ Módulo obrigatório ausente: ${nome}`)
                : console.warn( `[Main] ⚠️ Módulo opcional ausente: ${nome}`);
        }
        return presente;
    }

    return { get, chamar, checar };
})();

// ════════════════════════════════════════════════════════
// ENTRY POINT
// ════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await _inicializarJogo();
    } catch(e) {
        console.error("[Main] ERRO FATAL:", e);
        Loading.erroFatal(
            "Ocorreu um erro inesperado ao iniciar o jogo.",
            e?.stack ?? e?.message ?? String(e)
        );
    }
});

// ════════════════════════════════════════════════════════
// INICIALIZAÇÃO PRINCIPAL
// ════════════════════════════════════════════════════════
async function _inicializarJogo() {
    const t0 = performance.now();
    _log("🌹 Tap Lisieux — iniciando...");

    Loading.progresso(5,  "Inicializando...",        "Módulos base");
    _inicializarBase();

    Loading.progresso(12, "Carregando imagens...",   "Assets");
    await _carregarAssets();                          // ← aguarda assets 100%

    Loading.progresso(48, "Preparando canvas...",    "Renderização");
    _inicializarCanvas();

    Loading.progresso(54, "Carregando progresso...", "Save");
    const dadosSave = await _inicializarEstadoESave();

    Loading.progresso(62, "Inicializando sistemas...","Lógica");
    _inicializarSistemas();

    Loading.progresso(78, "Construindo interface...", "UI");
    _inicializarUI();

    Loading.progresso(88, "Registrando controles...", "Input / Áudio");
    _inicializarInputAudio();

    Loading.progresso(94, "Iniciando renderização...", "Loop");
    _iniciarLoop();                                   // ← Renderer.start()

    Loading.progresso(98, "Finalizando...", "");
    _posInit(dadosSave);

    Loading.progresso(100, "Pronto! 🌹");
    const ms = (performance.now() - t0).toFixed(0);
    _log(`✅ Jogo iniciado em ${ms}ms`);

    setTimeout(() => {
        Loading.esconder();
        _emitir("jogo:pronto", { ms: Number(ms) });
    }, 350);
}

// ════════════════════════════════════════════════════════
// FASE 2 — MÓDULOS BASE
// ════════════════════════════════════════════════════════
function _inicializarBase() {
    _M.chamar("Logger", "init");

    _M.checar("EventBus", true);
    _M.checar("DOM",      true);
    _M.checar("Utils",    true);

    if (typeof window.formatarNum === "undefined") {
        window.formatarNum = _M.get("Utils")?.formatarNum
            ?? (n => n >= 1e9 ? (n/1e9).toFixed(1)+"B"
                   : n >= 1e6 ? (n/1e6).toFixed(1)+"M"
                   : n >= 1e3 ? (n/1e3).toFixed(1)+"K"
                   : String(Math.floor(n)));
    }

    _M.checar("BALANCE");
    _M.checar("Toast");
    _M.checar("Camera");

    _log("Fase 2 OK — Módulos base.");
}

// ════════════════════════════════════════════════════════
// FASE 3 — ASSETS
// ✅ CORRIGIDO: garante que AssetLoader.carregar() é
//    chamado e aguardado antes de prosseguir
// ════════════════════════════════════════════════════════
async function _carregarAssets() {
    const AL = _M.get("AssetLoader");

    // ── Sem AssetLoader → fallback legado ───────────────
    if (!AL?.carregar) {
        if (typeof window.carregarAssets === "function") {
            window.carregarAssets();
        }
        await _esperar(800);
        _log("Fase 3 OK — fallback legado.");
        return;
    }

    // ── Já carregou numa corrida anterior ───────────────
    if (AL.estado === "COMPLETO") {
        _log("Fase 3 OK — assets já estavam em cache.");
        return;
    }

    // ── Carregamento real ────────────────────────────────
    return new Promise(resolve => {
        let _resolvido = false;
        const _resolver = () => {
            if (_resolvido) return;
            _resolvido = true;
            _log("Fase 3 OK — assets carregados.");
            resolve();
        };

        const EB = _M.get("EventBus");
        if (EB) {
            // Progresso visual
            EB.on("assets:progresso", ({ pct }) => {
                Loading.progresso(
                    12 + Math.round(pct * 36),
                    "Carregando imagens...",
                    `${Math.round(pct * 100)}%`
                );
            });

            // Sucesso
            EB.on("assets:completo", _resolver);

            // Falha parcial — jogo continua com fallbacks
            EB.on("assets:erro_critico", ({ assets }) => {
                console.warn("[Main] Assets críticos falharam:", assets);
                _resolver();
            });
        }

        // Inicia carregamento — .then() garante resolve
        // mesmo se EventBus não estiver disponível
        AL.carregar()
            .then(_resolver)
            .catch(e => {
                console.warn("[Main] AssetLoader.carregar() rejeitou:", e);
                _resolver();
            });
    });
}

// ════════════════════════════════════════════════════════
// FASE 4 — CANVAS
// ════════════════════════════════════════════════════════
function _inicializarCanvas() {
    const canvas = document.getElementById("game");
    if (!canvas) throw new Error("[Main] Canvas #game não encontrado no DOM.");

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    window.canvas = window.canvas ?? canvas;
    window.ctx    = window.ctx    ?? (() => {
        const c = canvas.getContext("2d");
        c.imageSmoothingEnabled = false;
        return c;
    })();

    _M.chamar("RendererLobby",  "init", canvas, window.ctx);
    _M.chamar("RendererBattle", "init", canvas, window.ctx);
    _M.chamar("Effects",        "init", canvas, window.ctx);
    _M.chamar("Input",          "init", canvas);

    const _onResize = _debounce(() => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        window.ctx.imageSmoothingEnabled = false;
        _M.chamar("RendererLobby", "aoRedimensionar");
        _M.chamar("Camera",        "redimensionar");
        _emitir("canvas:resize", { w: canvas.width, h: canvas.height });
    }, 150);

    window.addEventListener("resize", _onResize);

    _log("Fase 4 OK — Canvas.");
}

// ════════════════════════════════════════════════════════
// FASE 5 — ESTADO + SAVE
// ════════════════════════════════════════════════════════
async function _inicializarEstadoESave() {
    _M.chamar("GameState", "init");
    _garantirVariaveisLegadas();

    let dadosSave = null;
    const SS = _M.get("SaveSystem");

    if (SS) {
        if (typeof SS.init === "function") {
            dadosSave = SS.init();
        } else if (typeof window.inicializarSave === "function") {
            window.inicializarSave();
        } else {
            dadosSave = SS.carregar?.();
            if (dadosSave) _aplicarSaveLegado(dadosSave);
        }
    } else if (typeof window.inicializarSave === "function") {
        window.inicializarSave();
    }

    _log("Fase 5 OK — Estado + Save.");
    return dadosSave;
}

function _garantirVariaveisLegadas() {
    const B = _M.get("BALANCE") ?? {};
    if (typeof window.moeda      === "undefined") window.moeda      = B.MOEDA_INICIAL ?? 0;
    if (typeof window.gema       === "undefined") window.gema       = B.GEMA_INICIAL  ?? 50;
    if (typeof window.estagio    === "undefined") window.estagio    = 1;
    if (typeof window.emBatalha  === "undefined") window.emBatalha  = false;
    if (typeof window.personagem === "undefined") window.personagem = { nivel:1, exp:0, expMax:100 };
    if (typeof window.inimigo    === "undefined") window.inimigo    = { nome:"", hp:0, maxHp:0, nivel:1, rMoeda:0, rGema:0 };

    window._totalKills      = window._totalKills      ?? 0;
    window._totalUpgrades   = window._totalUpgrades   ?? 0;
    window._totalPrestígios = window._totalPrestígios ?? 0;
}

function _aplicarSaveLegado(save) {
    try {
        if (!save) return;
        const B = _M.get("BALANCE") ?? {};
        window.moeda   = save.moeda   ?? B.MOEDA_INICIAL ?? 0;
        window.gema    = save.gema    ?? B.GEMA_INICIAL  ?? 50;
        window.estagio = save.estagio ?? 1;

        if (save.upgrades && window.upgrades) {
            Object.entries(save.upgrades).forEach(([k, nivel]) => {
                if (window.upgrades[k]) window.upgrades[k].nivel = nivel;
            });
        }
        if (save.personagem && window.personagem) Object.assign(window.personagem, save.personagem);
        if (save.herois)      window.heroisObtidos       = save.herois;
        if (save.equips)      window.equipamentosObtidos = save.equips;
        if (save.pity)        _M.get("GachaSystem")?.setPity?.(save.pity);
        if (save.conquistas && window.conquistasDesbloqueadas) {
            save.conquistas.forEach(id => window.conquistasDesbloqueadas.add(id));
        }
    } catch(e) {
        console.warn("[Main] _aplicarSaveLegado falhou:", e);
    }
}

// ════════════════════════════════════════════════════════
// FASE 6 — SISTEMAS DE LÓGICA
// ════════════════════════════════════════════════════════
function _inicializarSistemas() {
    const sistemas = [
        ["Economy",      "init"],
        ["Upgrades",     "init"],
        ["Experience",   "init"],
        ["ComboSystem",  "init"],
        ["Enemy",        "init"],
        ["Damage",       "init"],
        ["Battle",       "init"],
        ["GachaPool",    "init"],
        ["Inventory",    "init"],
        ["GachaSystem",  "init"],
        ["Prestige",     "init"],
        ["Achievements", "init"],
        ["Quests",       "init"],
    ];

    sistemas.forEach(([nome, fn]) => {
        if (_M.chamar(nome, fn)) _log(`  ✓ ${nome}`);
    });

    if (typeof window.configurarInimigo === "function") {
        window.configurarInimigo(window.estagio ?? 1);
    }

    _log("Fase 6 OK — Sistemas.");
}

// ════════════════════════════════════════════════════════
// FASE 7 — UI
// ════════════════════════════════════════════════════════
function _inicializarUI() {
    ["UIModals","UIHud","UIBattle","UIUpgrades","UIGacha","UIConfig"]
        .forEach(nome => { if (_M.chamar(nome, "init")) _log(`  ✓ ${nome}`); });

    _chamarLegado("atualizarHUDLobby");
    _chamarLegado("atualizarUIUpgrades");
    _chamarLegado("atualizarListaInvocacao");
    _chamarLegado("atualizarBotaoPrestigiar");

    const nivel = _M.get("GameState")?.get("nivelPersonagem")
                ?? window.personagem?.nivel
                ?? 1;
    document.querySelectorAll(".santaLvUI").forEach(el => { el.textContent = nivel; });

    _log("Fase 7 OK — UI.");
}

// ════════════════════════════════════════════════════════
// FASE 8 — INPUT + ÁUDIO
// ════════════════════════════════════════════════════════
function _inicializarInputAudio() {
    if (!_M.chamar("Input", "init", window.canvas)) {
        _registrarInputFallback();
    }
    _M.chamar("Audio", "init");
    _log("Fase 8 OK — Input + Áudio.");
}

// ════════════════════════════════════════════════════════
// FASE 9 — LOOP DE RENDERIZAÇÃO
// ✅ CORRIGIDO: delega ao Renderer centralizado
//    (renderer-main.js) em vez de loop próprio
// ════════════════════════════════════════════════════════
const _loopState = {
    rodando  : false,
    rafId    : null,
    ultimo   : 0,
    fps      : 0,
    frames   : 0,
    tempoFPS : 0,
    countFPS : 0,
};

function _iniciarLoop() {
    if (_loopState.rodando) return;

    const canvas = document.getElementById("game");
    if (!canvas) {
        console.error("[Main] Canvas não encontrado — loop não iniciado.");
        return;
    }

    // ── Tenta usar o Renderer centralizado ──────────────
    const R = _M.get("Renderer");
    if (R?.start) {
        R.start(canvas);
        _loopState.rodando = true;

        // Sincroniza stats para TapLisieux.debug
        setInterval(() => {
            try {
                const s = R.stats?.();
                if (!s) return;
                _loopState.fps    = s.fps?.media ?? 0;
                _loopState.frames = s.fps?.total ?? 0;
            } catch(_) {}
        }, 500);

        _log("Fase 9 OK — Renderer.start() chamado.");
        return;
    }

    // ── Fallback: loop próprio (sem renderer-main.js) ───
    console.warn("[Main] Renderer centralizado não encontrado — usando loop fallback.");
    _loopState.rodando = true;
    _loopState.ultimo  = performance.now();
    _loopState.rafId   = requestAnimationFrame(_frameFallback);
    _log("Fase 9 OK — loop fallback iniciado.");
}

function _pararLoop() {
    _loopState.rodando = false;

    // Para o Renderer centralizado se existir
    const R = _M.get("Renderer");
    if (R?.stop) { R.stop(); return; }

    // Para o fallback
    if (_loopState.rafId) {
        cancelAnimationFrame(_loopState.rafId);
        _loopState.rafId = null;
    }
}

// Loop fallback — só usado se renderer-main.js não existir
function _frameFallback(agora) {
    _loopState.rafId = requestAnimationFrame(_frameFallback);
    if (!_loopState.rodando) return;

    const delta = Math.min(agora - _loopState.ultimo, 100);
    _loopState.ultimo = agora;
    _loopState.frames++;

    _loopState.countFPS++;
    _loopState.tempoFPS += delta;
    if (_loopState.tempoFPS >= 1000) {
        _loopState.fps      = _loopState.countFPS;
        _loopState.countFPS = 0;
        _loopState.tempoFPS = 0;
        _emitir("fps:update", _loopState.fps);
    }

    try { _M.get("Camera")?.atualizar(_emBatalha()); } catch(_) {}
    _emitir("renderer:preframe", { ctx: window.ctx, delta });

    const canvas = window.canvas;
    const ctx    = window.ctx;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
        if (window.emBatalha) {
            window.desenharBatalha?.();
        } else {
            window.desenharLobby?.();
        }
    } catch(e) {
        console.error("[Loop Fallback]", e);
    }

    try { _M.get("Effects")?.atualizar?.(); } catch(_) {}
    try { _M.get("UIHud")?.tick?.();        } catch(_) {}
    try { _M.get("UIBattle")?.tick?.();     } catch(_) {}
}

// ════════════════════════════════════════════════════════
// FASE 10 — PÓS-INICIALIZAÇÃO
// ════════════════════════════════════════════════════════
function _posInit(dadosSave) {
    _iniciarAutoSave();
    _registrarEventosSistema();
    _registrarVisibilidade();
    _notificarOffline(dadosSave);

    setTimeout(() => { _M.chamar("Achievements", "verificar"); }, 600);

    _log("Fase 10 OK — Pós-init.");
}

// ════════════════════════════════════════════════════════
// AUTO-SAVE
// ════════════════════════════════════════════════════════
function _iniciarAutoSave() {
    const intervalo = _M.get("BALANCE")?.SAVE_INTERVALO_MS ?? 30_000;
    setInterval(_salvar, intervalo);
    _log(`Auto-save configurado (${intervalo / 1000}s).`);
}

function _salvar() {
    try {
        const SS = _M.get("SaveSystem");
        if (SS?.salvar) { SS.salvar(); return; }
        console.warn("[Main] SaveSystem.salvar não encontrado.");
    } catch(e) {
        console.error("[Main] Falha no save:", e);
    }
}

// ════════════════════════════════════════════════════════
// EVENTOS DE SISTEMA
// ════════════════════════════════════════════════════════
function _registrarEventosSistema() {
    const EB = _M.get("EventBus");
    if (!EB) return;

    EB.on("kill:registrado",  () => { window._totalKills      = (window._totalKills      ?? 0) + 1; });
    EB.on("upgrade:comprado", () => { window._totalUpgrades   = (window._totalUpgrades   ?? 0) + 1; });
    EB.on("prestigio:feito",  () => { window._totalPrestígios = (window._totalPrestígios ?? 0) + 1; _salvar(); });

    EB.on("moeda:update", () => { _chamarLegado("atualizarHUDLobby"); _M.get("UIHud")?.atualizar?.(); });
    EB.on("gema:update",  () => { _chamarLegado("atualizarHUDLobby"); _M.get("UIHud")?.atualizar?.(); });

    EB.on("batalha:iniciou", () => {
        window.emBatalha = true;
        _chamarLegado("iniciarBatalha");
        _M.get("Effects")?.inicializarFlores?.();
    });
    EB.on("batalha:saiu", () => {
        window.emBatalha = false;
        _chamarLegado("sairBatalha");
        _salvar();
    });

    EB.on("gacha:pull",             _salvar);
    EB.on("conquista:desbloqueada", _salvar);
    EB.on("quest:coletada",         _salvar);
    EB.on("nivel:up",               _salvar);

    EB.on("fps:update", fps => {
        if (_isDev()) document.title = `[${fps}fps] Tap Lisieux`;
    });

    EB.on("modulo:erro", ({ modulo, erro }) => {
        console.error(`[Sistema] Erro em ${modulo}:`, erro);
    });

    _log("Eventos de sistema registrados.");
}

// ════════════════════════════════════════════════════════
// VISIBILIDADE DA ABA
// ════════════════════════════════════════════════════════
function _registrarVisibilidade() {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            _salvar();
            _emitir("jogo:saiu");
        } else {
            _emitir("jogo:voltou");
        }
    });

    window.addEventListener("beforeunload", _salvar);
    window.addEventListener("pagehide",     _salvar);
}

// ════════════════════════════════════════════════════════
// PROGRESSO OFFLINE
// ════════════════════════════════════════════════════════
function _notificarOffline(dadosSave) {
    if (!dadosSave?.timestamp) return;

    const agora     = Date.now();
    const deltaMs   = agora - dadosSave.timestamp;
    const maxMs     = (_M.get("BALANCE")?.MAX_OFFLINE_HORAS ?? 8) * 3_600_000;
    const efetivoMs = Math.min(deltaMs, maxMs);
    const segundos  = Math.floor(efetivoMs / 1000);

    if (segundos < 60) return;

    let dps = 0;
    try   { dps = _M.get("Damage")?.calcDps?.() ?? 0; }
    catch { dps = Math.floor(2 * Math.pow(1.60, (dadosSave.nivelDps ?? 1) - 1)); }

    const moedas = Math.floor(dps * segundos * 0.5);
    if (moedas <= 0) return;

    try {
        _M.get("GameState")?.increment("moeda", moedas);
        _emitir("moeda:update", { valor: _M.get("GameState")?.get("moeda"), delta: moedas });
    } catch(_) {
        window.moeda = (window.moeda ?? 0) + moedas;
    }

    setTimeout(() => {
        const fmt = window.formatarNum ?? (n => String(n));
        const h   = Math.floor(segundos / 3600);
        const m   = Math.floor((segundos % 3600) / 60);
        const s   = segundos % 60;
        const txt = h > 0 ? `${h}h ${m}min` : m > 0 ? `${m}min` : `${s}s`;

        const Toast = _M.get("Toast");
        try {
            Toast?.sucesso
                ? Toast.sucesso(`⏰ Offline ${txt} → +${fmt(moedas)} 🪙`)
                : Toast?.mostrar?.(`⏰ Offline ${txt} → +${fmt(moedas)} 🪙`, "sucesso", 6000);
        } catch(_) {}

        _emitir("save:offline", { segundos, moedas, dps });
    }, 2000);
}

// ════════════════════════════════════════════════════════
// INPUT FALLBACK
// ════════════════════════════════════════════════════════
function _registrarInputFallback() {
    const canvas = window.canvas;
    if (!canvas) return;

    const _click = () => {
        if (!window.emBatalha) return;
        const dano = typeof calcDanoClick === "function" ? calcDanoClick() : 1;
        if (typeof darDano                  === "function") darDano(dano, "click");
        if (typeof dispararAtaquePersonagem === "function") dispararAtaquePersonagem();
        if (typeof dispararFlor             === "function") dispararFlor();
        _emitir("damage:click", { valor: dano });
    };

    canvas.addEventListener("click",      _click);
    canvas.addEventListener("touchstart", e => { e.preventDefault(); _click(); }, { passive: false });
    canvas.addEventListener("touchend",   e => e.preventDefault(), { passive: false });

    document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;
        ["janelaConfig","modalInvocar","modalEquipar","modalConquistas","modalMissoes"]
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "none";
            });
        _emitir("modal:fechado", { origem: "ESC" });
    });

    console.warn("[Main] Input fallback ativo — input.js não encontrado.");
}

// ════════════════════════════════════════════════════════
// UTILITÁRIOS INTERNOS
// ════════════════════════════════════════════════════════
function _esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function _emitir(evento, dados) {
    try { _M.get("EventBus")?.emit(evento, dados); } catch(_) {}
}

function _chamarLegado(fn, ...args) {
    if (typeof window[fn] === "function") {
        try { window[fn](...args); } catch(e) {
            console.warn(`[Main] ${fn}() falhou:`, e);
        }
    }
}

function _emBatalha() {
    try   { return _M.get("GameState")?.get("emBatalha") === true ?? window.emBatalha; }
    catch { return window.emBatalha ?? false; }
}

function _isDev() {
    return location.hostname === "localhost"  ||
           location.hostname === "127.0.0.1" ||
           location.search.includes("debug");
}

function _log(...args) {
    try   { _M.get("Logger")?.info?.("[Main]", ...args); }
    catch { console.log("[Main]", ...args); }
}

function _debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ════════════════════════════════════════════════════════
// API PÚBLICA — window.TapLisieux
// ════════════════════════════════════════════════════════
window.TapLisieux = Object.freeze({
    versao : "2.0.0",

    get fps()     { return _loopState.fps;     },
    get frames()  { return _loopState.frames;  },
    get rodando() { return _loopState.rodando; },

    salvar  : _salvar,
    pausar  : _pararLoop,
    retomar : () => {
        const R = _M.get("Renderer");
        if (R?.start && !_loopState.rodando) {
            const canvas = document.getElementById("game");
            if (canvas) { R.start(canvas); _loopState.rodando = true; }
            return;
        }
        if (!_loopState.rodando) {
            _loopState.rodando = true;
            _loopState.ultimo  = performance.now();
            _loopState.rafId   = requestAnimationFrame(_frameFallback);
        }
    },

    debug: {
        estado() {
            console.table({
                moeda        : window.moeda,
                gema         : window.gema,
                estagio      : window.estagio,
                emBatalha    : window.emBatalha,
                nivelSanta   : window.personagem?.nivel,
                fps          : _loopState.fps,
                frames       : _loopState.frames,
                assetEstado  : _M.get("AssetLoader")?.estado,
                assetCache   : _M.get("AssetLoader")?.statsDetalhado().cacheSize,
            });
        },
        modulos() {
            const nomes = [
                "Logger","EventBus","DOM","Utils","BALANCE",
                "GameState","SaveSystem","Economy","Upgrades",
                "Experience","ComboSystem","Enemy","Damage","Battle",
                "GachaPool","Inventory","GachaSystem","Prestige",
                "AssetLoader","Effects","Camera",
                "RendererLobby","RendererBattle","Renderer",
                "UIModals","UIHud","UIBattle","UIUpgrades","UIGacha","UIConfig",
                "Achievements","Quests","Input","Audio","Toast",
            ];
            const resultado = {};
            nomes.forEach(n => { resultado[n] = _M.get(n) ? "✅" : "❌"; });
            console.table(resultado);
            return resultado;
        },
        assets() {
            const AL = _M.get("AssetLoader");
            if (!AL) { console.warn("AssetLoader não encontrado."); return; }
            console.table(AL.statsDetalhado());
        },
        save()        { console.log(_M.get("SaveSystem")?.info?.() ?? "SaveSystem não disponível"); },
        renderer()    { console.log({ lobby: _M.get("RendererLobby")?.stats?.(), battle: _M.get("RendererBattle")?.stats?.(), effects: _M.get("Effects")?.stats?.(), loop: { fps: _loopState.fps, frames: _loopState.frames } }); },
        achievements(){ console.table(_M.get("Achievements")?.stats?.()); },
        quests()      { console.table(_M.get("Quests")?.stats?.());       },
        audio()       { console.table(_M.get("Audio")?.stats?.());        },
    },
});
