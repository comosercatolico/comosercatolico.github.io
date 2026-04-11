// ═══════════════════════════════════════════════════════
//  UI-HUD.JS
//  Atualiza o HUD principal (sempre visível):
//  - Moedas, gemas e energia com animação de pulso
//  - Barra de XP da Santa animada
//  - Nível com animação de level up
//  - Throttle inteligente por recurso
//  - Contadores animados (número "rola" até o alvo)
//  - Badge de notificação (conquistas, missões)
//
//  Depende de: dom-cache.js, event-bus.js, state.js
//  Usado por: main.js (via EventBus)
// ═══════════════════════════════════════════════════════

"use strict";

const UIHud = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIHud"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Throttle por recurso (ms)
        THROTTLE_MOEDA    : 100,   // 10x/s — moeda muda rápido
        THROTTLE_GEMA     : 500,   // 2x/s  — gema muda raramente
        THROTTLE_ENERGIA  : 1000,  // 1x/s  — energia muda lento
        THROTTLE_NIVEL    : 200,   // 5x/s  — XP muda em combate

        // Contador animado
        COUNTER_DURACAO   : 600,   // ms para rolar até o alvo
        COUNTER_PASSOS    : 20,    // frames do contador

        // Pulso visual ao ganhar recurso
        PULSO_CLASSE      : "__hud_pulso__",
        PULSO_DURACAO     : 400,   // ms

        // Barra de XP
        XP_ANIM_SPEED     : 0.08,  // lerp por frame

        // Energia — recarga
        ENERGIA_MAX       : 100,
        ENERGIA_RECARGA_MS: 30_000,
    });

    // ════════════════════════════════════════════════════
    // CSS — injetado uma única vez
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_hud_css__")) return;

        const s = document.createElement("style");
        s.id = "__ui_hud_css__";
        s.textContent = `
            /* Pulso ao ganhar recurso */
            .${CFG.PULSO_CLASSE} {
                animation: __hud_pulso_anim__ ${CFG.PULSO_DURACAO}ms ease-out;
            }
            @keyframes __hud_pulso_anim__ {
                0%   { transform: scale(1);    filter: brightness(1);   }
                35%  { transform: scale(1.18); filter: brightness(1.6); }
                100% { transform: scale(1);    filter: brightness(1);   }
            }

            /* Level up — flash dourado */
            .__hud_levelup__ {
                animation: __hud_levelup_anim__ 0.7s ease-out;
            }
            @keyframes __hud_levelup_anim__ {
                0%   { color: inherit; text-shadow: none; }
                20%  { color: #ffd700; text-shadow: 0 0 12px #ffd700, 0 0 24px #ffa500; }
                100% { color: inherit; text-shadow: none; }
            }

            /* Barra de XP */
            .__hud_xp_bar_fill__ {
                transition: width 0.3s cubic-bezier(.4,1.4,.6,1);
                will-change: width;
            }

            /* Badge de notificação */
            .__hud_badge__ {
                display          : inline-flex;
                align-items      : center;
                justify-content  : center;
                min-width        : 18px;
                height           : 18px;
                padding          : 0 4px;
                border-radius    : 9px;
                background       : #e74c3c;
                color            : #fff;
                font-size        : 11px;
                font-weight      : 700;
                line-height      : 1;
                position         : absolute;
                top              : -6px;
                right            : -6px;
                pointer-events   : none;
                transition       : transform 0.2s ease, opacity 0.2s ease;
            }
            .__hud_badge__.oculto {
                transform        : scale(0);
                opacity          : 0;
            }

            /* Energia — barra fina embaixo do ícone */
            .__hud_energia_bar__ {
                height           : 3px;
                border-radius    : 2px;
                background       : rgba(255,255,255,0.15);
                overflow         : hidden;
                margin-top       : 2px;
            }
            .__hud_energia_bar_fill__ {
                height           : 100%;
                background       : linear-gradient(90deg, #56ccf2, #2f80ed);
                border-radius    : 2px;
                transition       : width 0.6s linear;
                will-change      : width;
            }
        `;
        document.head.appendChild(s);
    }

    // ════════════════════════════════════════════════════
    // HELPER — lê do GameState com fallback seguro
    // ════════════════════════════════════════════════════
    function _estado(chave, fallback = 0) {
        try   { return GameState.get(chave) ?? fallback; }
        catch { return fallback; }
    }

    // ════════════════════════════════════════════════════
    // HELPER — formata número
    // ════════════════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
            if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
            if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
            return String(Math.floor(n));
        }
    }

    // ════════════════════════════════════════════════════
    // HELPER DOM — acesso seguro
    // ════════════════════════════════════════════════════
    function _el(id) {
        try   { return DOM.get(id); }
        catch { return document.getElementById(id); }
    }

    function _set(id, txt) {
        const el = _el(id);
        if (el) el.textContent = txt;
    }

    // ════════════════════════════════════════════════════
    // THROTTLE INDIVIDUAL POR RECURSO
    // Cada recurso tem seu próprio timestamp
    // ════════════════════════════════════════════════════
    const _ultima = {
        moeda  : 0,
        gema   : 0,
        energia: 0,
        nivel  : 0,
    };

    function _podeatualizar(chave, intervalo) {
        const agora = performance.now();
        if (agora - _ultima[chave] >= intervalo) {
            _ultima[chave] = agora;
            return true;
        }
        return false;
    }

    // ════════════════════════════════════════════════════
    // PULSO VISUAL
    // Adiciona e remove a classe de animação
    // ════════════════════════════════════════════════════
    function _pulsar(id) {
        const el = _el(id);
        if (!el) return;
        el.classList.remove(CFG.PULSO_CLASSE);
        // Force reflow para reiniciar animação
        void el.offsetWidth;
        el.classList.add(CFG.PULSO_CLASSE);
        setTimeout(() => el?.classList.remove(CFG.PULSO_CLASSE), CFG.PULSO_DURACAO);
    }

    // ════════════════════════════════════════════════════
    // CONTADOR ANIMADO
    // "Rola" de um valor para outro visualmente
    // ════════════════════════════════════════════════════
    const _contadores = new Map();   // id → { de, ate, inicio, duracao, formato }

    function _animarContador(id, ate, formato = _fmt) {
        const el = _el(id);
        if (!el) return;

        const de = _contadores.has(id)
            ? _contadores.get(id).ate
            : _extrairNumero(el.textContent);

        // Diferença pequena — não anima
        if (Math.abs(ate - de) < 1) {
            el.textContent = formato(ate);
            return;
        }

        _contadores.set(id, {
            de,
            ate,
            inicio  : performance.now(),
            duracao : CFG.COUNTER_DURACAO,
            formato,
            el,
        });
    }

    function _extrairNumero(txt) {
        const n = parseFloat(String(txt).replace(/[^0-9.]/g, ""));
        return isNaN(n) ? 0 : n;
    }

    function _tickContadores() {
        if (_contadores.size === 0) return;

        const agora = performance.now();

        _contadores.forEach((c, id) => {
            const t = Math.min(1, (agora - c.inicio) / c.duracao);
            // Easing out-cubic
            const ease = 1 - Math.pow(1 - t, 3);
            const atual = c.de + (c.ate - c.de) * ease;

            c.el.textContent = c.formato(Math.floor(atual));

            if (t >= 1) {
                c.el.textContent = c.formato(c.ate);
                _contadores.delete(id);
            }
        });
    }

    // ════════════════════════════════════════════════════
    // BARRA DE XP
    // ════════════════════════════════════════════════════
    const _xp = {
        pctAtual : 0,
        pctAlvo  : 0,
        barEl    : null,
    };

    function _garantirBarraXP() {
        if (_xp.barEl) return;
        _xp.barEl = _el("hudXpFill") ?? _el("xpBarFill") ?? null;
    }

    function _tickXP() {
        if (!_xp.barEl) return;
        _xp.pctAtual += (_xp.pctAlvo - _xp.pctAtual) * CFG.XP_ANIM_SPEED;
        const pct = Math.min(100, Math.max(0, _xp.pctAtual * 100));
        _xp.barEl.style.width = pct.toFixed(2) + "%";
    }

    // ════════════════════════════════════════════════════
    // ENERGIA — com recarga em tempo real
    // ════════════════════════════════════════════════════
    const _energia = {
        atual    : CFG.ENERGIA_MAX,
        max      : CFG.ENERGIA_MAX,
        proxRecarga: 0,
        barFill  : null,
        timer    : null,
    };

    function _garantirBarraEnergia() {
        if (_energia.barFill) return;
        _energia.barFill = _el("hudEnergiaBar") ?? null;
    }

    function _iniciarTimerEnergia() {
        if (_energia.timer) clearInterval(_energia.timer);

        _energia.timer = setInterval(() => {
            if (_energia.atual >= _energia.max) return;
            _energia.atual = Math.min(_energia.max, _energia.atual + 1);
            _atualizarEnergiaDOM();
        }, CFG.ENERGIA_RECARGA_MS);
    }

    function _atualizarEnergiaDOM() {
        _set("hudEnergiaVal", `${_energia.atual}/${_energia.max}`);

        if (_energia.barFill) {
            const pct = (_energia.atual / _energia.max) * 100;
            _energia.barFill.style.width = pct.toFixed(1) + "%";
        }
    }

    // ════════════════════════════════════════════════════
    // BADGES DE NOTIFICAÇÃO
    // ════════════════════════════════════════════════════
    const _badges = new Map();   // id → { el, count }

    function _getBadge(ancorId) {
        if (_badges.has(ancorId)) return _badges.get(ancorId).el;

        const ancora = _el(ancorId);
        if (!ancora) return null;

        // Garante position relative no pai
        const pai = ancora.parentElement;
        if (pai) pai.style.position = "relative";

        const badge = document.createElement("span");
        badge.className = "__hud_badge__ oculto";
        badge.setAttribute("aria-hidden", "true");
        ancora.appendChild(badge);

        _badges.set(ancorId, { el: badge, count: 0 });
        return badge;
    }

    function setBadge(ancorId, count) {
        const badge = _getBadge(ancorId);
        if (!badge) return;

        const entrada = _badges.get(ancorId);
        entrada.count = count;

        if (count <= 0) {
            badge.classList.add("oculto");
            badge.textContent = "";
        } else {
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.classList.remove("oculto");
        }
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR MOEDA
    // ════════════════════════════════════════════════════
    function _atualizarMoeda(forcado = false) {
        if (!forcado && !_podeatualizar("moeda", CFG.THROTTLE_MOEDA)) return;
        const v = _estado("moeda");
        _animarContador("hudMoedaVal",   v);
        _animarContador("moedaUIBatalha", v, n => `🪙 ${_fmt(n)}`);
        _animarContador("moedaCentroVal", v);
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR GEMA
    // ════════════════════════════════════════════════════
    function _atualizarGema(forcado = false) {
        if (!forcado && !_podeatualizar("gema", CFG.THROTTLE_GEMA)) return;
        const v = _estado("gema");
        _animarContador("hudGemaVal",    v);
        _animarContador("gemaUIBatalha", v, n => `💎 ${_fmt(n)}`);
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR ENERGIA
    // ════════════════════════════════════════════════════
    function _atualizarEnergiaState(forcado = false) {
        if (!forcado && !_podeatualizar("energia", CFG.THROTTLE_ENERGIA)) return;
        _atualizarEnergiaDOM();
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR NÍVEL / XP
    // ════════════════════════════════════════════════════
    function _atualizarNivel(forcado = false) {
        if (!forcado && !_podeatualizar("nivel", CFG.THROTTLE_NIVEL)) return;

        const nivel  = _estado("nivelPersonagem", 1);
        const exp    = _estado("expPersonagem",   0);
        const expMax = _estado("expMaxPersonagem", 100);

        // Atualiza todos os elementos de nível
        document.querySelectorAll(".santaLvUI").forEach(el => {
            el.textContent = nivel;
        });

        // XP bar
        _xp.pctAlvo = expMax > 0 ? exp / expMax : 0;
    }

    // ════════════════════════════════════════════════════
    // TICK — chamado pelo renderer a cada frame
    // ════════════════════════════════════════════════════
    function tick() {
        _tickContadores();
        _tickXP();
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR TUDO (para forçar refresh completo)
    // ════════════════════════════════════════════════════
    function atualizar() {
        _atualizarMoeda(true);
        _atualizarGema(true);
        _atualizarEnergiaState(true);
        _atualizarNivel(true);
    }

    // ════════════════════════════════════════════════════
    // EVENTOS DO EVENTBUS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // ── Moeda ──
            EventBus.on("moeda:update", ({ valor, delta }) => {
                _atualizarMoeda();
                if (delta > 0) _pulsar("hudMoedaVal");
            });

            // ── Gema ──
            EventBus.on("gema:update", ({ valor, delta }) => {
                _atualizarGema();
                if (delta > 0) _pulsar("hudGemaVal");
            });

            // ── Energia ──
            EventBus.on("energia:update", () => {
                _atualizarEnergiaState();
            });

            EventBus.on("energia:gasta", ({ atual, max }) => {
                _energia.atual = atual;
                _energia.max   = max ?? CFG.ENERGIA_MAX;
                _atualizarEnergiaDOM();
                _pulsar("hudEnergiaVal");
            });

            // ── Nível ──
            EventBus.on("nivel:up", ({ nivel }) => {
                _atualizarNivel(true);

                // Animação de level up em todos os elementos
                document.querySelectorAll(".santaLvUI").forEach(el => {
                    el.classList.remove("__hud_levelup__");
                    void el.offsetWidth;
                    el.classList.add("__hud_levelup__");
                    setTimeout(() => el.classList.remove("__hud_levelup__"), 700);
                });

                _log.debug(`Level up exibido: ${nivel}`);
            });

            // ── XP ganho ──
            EventBus.on("exp:ganhou", () => {
                _atualizarNivel();
            });

            // ── Conquistas — badge ──
            EventBus.on("conquista:desbloqueada", () => {
                const el = _el("conquistaBadge");
                if (el) {
                    el.style.display = "inline-flex";
                    _pulsar("conquistaBadge");
                }
            });

            // ── Missões — badge ──
            EventBus.on("quest:disponivel", ({ count }) => {
                setBadge("questBadge",        count ?? 1);
                setBadge("questBadgeBatalha", count ?? 1);
            });

            EventBus.on("quest:coletada", ({ restantes }) => {
                setBadge("questBadge",        restantes ?? 0);
                setBadge("questBadgeBatalha", restantes ?? 0);
            });

            // ── Batalha — mostra/esconde HUDs ──
            EventBus.on("batalha:iniciou", () => {
                try { DOM.hide("lobbyHUD");    } catch(_) {}
                try { DOM.hide("lobbybotoes"); } catch(_) {}
                try { DOM.show("uiBatalha");   } catch(_) {}
                atualizar();
            });

            EventBus.on("batalha:saiu", () => {
                try { DOM.show("lobbyHUD");    } catch(_) {}
                try { DOM.show("lobbybotoes"); } catch(_) {}
                try { DOM.hide("uiBatalha");   } catch(_) {}
                atualizar();
            });

            // ── State genérico — fallback ──
            EventBus.on("state:changed", ({ chave }) => {
                if (chave === "moeda")            _atualizarMoeda();
                if (chave === "gema")             _atualizarGema();
                if (chave === "nivelPersonagem" ||
                    chave === "expPersonagem")    _atualizarNivel();
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        _injetarCSS();
        _garantirBarraXP();
        _garantirBarraEnergia();
        _iniciarTimerEnergia();
        _registrarEventos();

        // Primeiro render
        atualizar();

        _log.info("UIHud inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            contadoresAtivos : _contadores.size,
            badges           : Object.fromEntries(
                [..._badges.entries()].map(([k,v]) => [k, v.count])
            ),
            energia : { atual: _energia.atual, max: _energia.max },
            xp      : { pctAtual: _xp.pctAtual.toFixed(3), pctAlvo: _xp.pctAlvo.toFixed(3) },
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        tick,
        atualizar,
        setBadge,
        stats,
    });

})();
