// ═══════════════════════════════════════════════════════════
//  COMBO.JS
//  Sistema de combo completo para o clicker.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo não existia sistema de combo.
//  Cada clique era idêntico ao anterior — sem progressão
//  tática, sem incentivo para clicar rápido, sem feedback
//  visual de intensidade.
//
//  SOLUÇÃO:
//  Sistema de combo com rampa de multiplicador, janela de
//  tempo configurável, níveis visuais e eventos para o
//  renderer reagir (cor, tamanho, shake).
//
//  MECÂNICA:
//  ┌─────────────┬──────┬────────────┬────────────────────┐
//  │ Combo       │ Mult │ Nome       │ Visual             │
//  ├─────────────┼──────┼────────────┼────────────────────┤
//  │  1 –  4     │ 1.0x │ —          │ normal             │
//  │  5 –  9     │ 1.3x │ Aquecendo  │ amarelo            │
//  │ 10 – 19     │ 1.6x │ Em Chamas  │ laranja            │
//  │ 20 – 29     │ 2.0x │ Fervoroso  │ vermelho           │
//  │ 30 – 49     │ 2.5x │ Sagrado    │ roxo + glow        │
//  │ 50+         │ 3.0x │ Divino     │ dourado + pulsante │
//  └─────────────┴──────┴────────────┴────────────────────┘
//
//  JANELA DE TEMPO:
//  - Clique deve ocorrer dentro de 1.5s do anterior
//  - Janela aumenta levemente em combos altos (+0.1s por tier)
//  - Reset suave: multiplicador cai gradualmente (não zera)
//
//  API:
//    ComboSystem.registrarClique()   → registra clique e retorna info
//    ComboSystem.multiplicador()     → número atual (1.0 – 3.0)
//    ComboSystem.combo()             → contagem atual
//    ComboSystem.tier()              → objeto do tier atual
//    ComboSystem.info()              → tudo para a UI
//    ComboSystem.resetar()           → zera imediatamente
//    ComboSystem.ativo()             → boolean (combo > 0)
//
//  Depende de: constants.js, event-bus.js, logger.js, state.js
//  Usado por: input.js, damage.js, renderer-battle.js
// ═══════════════════════════════════════════════════════════

"use strict";

const ComboSystem = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Combo"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Combo]",  ...a),
            error : (...a) => console.error("[Combo]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        JANELA_BASE_MS   : 1500,    // tempo máximo entre cliques (ms)
        JANELA_BONUS_MS  : 100,     // bônus de janela por tier acima de 0
        DECAY_INTERVALO  : 200,     // ms entre cada tick de decay
        DECAY_POR_TICK   : 1,       // combo perdido por tick no decay suave
        COMBO_MAX        : 999,     // cap de combo (não trava o jogo)
        HISTORICO_MAX    : 20       // últimos N cliques no histórico
    });

    // ════════════════════════════════════════
    // DEFINIÇÃO DOS TIERS
    // Ordem: do maior para o menor (busca do tier ativo)
    // ════════════════════════════════════════

    /**
     * @typedef {object} ComboTier
     * @property {number} minCombo    — combo mínimo para ativar
     * @property {number} mult        — multiplicador de dano
     * @property {string} nome        — nome exibido na UI
     * @property {string} emoji       — ícone
     * @property {string} cor         — cor hex para UI
     * @property {string} corGlow     — cor do glow no canvas
     * @property {boolean} pulsante   — ativa animação pulsante
     * @property {number} shakeIntens — intensidade do shake ao atingir
     */
    const TIERS = Object.freeze([
        {
            minCombo   : 50,
            mult       : 3.0,
            nome       : "✨ DIVINO",
            emoji      : "✨",
            cor        : "#f5a623",
            corGlow    : "rgba(245,166,35,0.90)",
            pulsante   : true,
            shakeIntens: 10
        },
        {
            minCombo   : 30,
            mult       : 2.5,
            nome       : "🔮 SAGRADO",
            emoji      : "🔮",
            cor        : "#b44dff",
            corGlow    : "rgba(180,77,255,0.80)",
            pulsante   : true,
            shakeIntens: 7
        },
        {
            minCombo   : 20,
            mult       : 2.0,
            nome       : "🔥 FERVOROSO",
            emoji      : "🔥",
            cor        : "#ff4444",
            corGlow    : "rgba(255,68,68,0.70)",
            pulsante   : false,
            shakeIntens: 5
        },
        {
            minCombo   : 10,
            mult       : 1.6,
            nome       : "🌶️ EM CHAMAS",
            emoji      : "🌶️",
            cor        : "#ff8c00",
            corGlow    : "rgba(255,140,0,0.60)",
            pulsante   : false,
            shakeIntens: 3
        },
        {
            minCombo   : 5,
            mult       : 1.3,
            nome       : "🔆 AQUECENDO",
            emoji      : "🔆",
            cor        : "#ffe066",
            corGlow    : "rgba(255,224,102,0.50)",
            pulsante   : false,
            shakeIntens: 1
        },
        {
            minCombo   : 1,
            mult       : 1.0,
            nome       : "",          // sem nome no tier base
            emoji      : "",
            cor        : "#ffffff",
            corGlow    : "rgba(255,255,255,0)",
            pulsante   : false,
            shakeIntens: 0
        }
    ]);

    // Tier "zero" — sem combo ativo
    const TIER_ZERO = Object.freeze({
        minCombo   : 0,
        mult       : 1.0,
        nome       : "",
        emoji      : "",
        cor        : "#ffffff",
        corGlow    : "rgba(0,0,0,0)",
        pulsante   : false,
        shakeIntens: 0
    });

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════
    let _combo         = 0;
    let _tierAtual     = TIER_ZERO;
    let _ultimoClique  = 0;         // timestamp do último clique
    let _timerDecay    = null;      // setTimeout do decay suave
    let _timerReset    = null;      // setTimeout do reset por timeout

    // Estatísticas da sessão
    const _stats = {
        maxComboAlcancado : 0,
        totalCliques      : 0,
        totalMult         : 0,      // soma de todos os multiplicadores aplicados
        tiersMais         : {}      // { "DIVINO": 3, ... } quantas vezes atingiu
    };

    // Histórico de cliques (para análise e efeitos)
    const _historico = [];

    // ════════════════════════════════════════
    // BUSCAR TIER PELO COMBO ATUAL
    // ════════════════════════════════════════
    function _buscarTier(comboAtual) {
        if (comboAtual <= 0) return TIER_ZERO;
        // TIERS está ordenado do maior para o menor
        return TIERS.find(t => comboAtual >= t.minCombo) ?? TIER_ZERO;
    }

    // ════════════════════════════════════════
    // JANELA DE TEMPO ATUAL
    // Aumenta levemente em tiers mais altos
    // ════════════════════════════════════════
    function _janelaAtual() {
        const idxTier = TIERS.indexOf(_tierAtual);
        const bonus   = idxTier >= 0
            ? (TIERS.length - 1 - idxTier) * CFG.JANELA_BONUS_MS
            : 0;
        return CFG.JANELA_BASE_MS + bonus;
    }

    // ════════════════════════════════════════
    // CANCELAR TIMERS
    // ════════════════════════════════════════
    function _cancelarTimers() {
        if (_timerDecay !== null) {
            clearTimeout(_timerDecay);
            _timerDecay = null;
        }
        if (_timerReset !== null) {
            clearTimeout(_timerReset);
            _timerReset = null;
        }
    }

    // ════════════════════════════════════════
    // DECAY SUAVE
    // Após timeout, combo cai gradualmente
    // em vez de zerar de uma vez
    // ════════════════════════════════════════
    function _iniciarDecay() {
        _cancelarTimers();

        const janela = _janelaAtual();

        // Timer principal: após janela sem clique, inicia decay
        _timerReset = setTimeout(() => {
            _tickDecay();
        }, janela);
    }

    function _tickDecay() {
        if (_combo <= 0) {
            _combo = 0;
            _tierAtual = TIER_ZERO;
            _emitirUpdate();
            return;
        }

        _combo = Math.max(0, _combo - CFG.DECAY_POR_TICK);

        const novoTier = _buscarTier(_combo);
        const mudouTier = novoTier !== _tierAtual;
        _tierAtual = novoTier;

        _emitirUpdate();

        if (mudouTier && _tierAtual !== TIER_ZERO) {
            _log.debug(`Decay: tier caiu para "${_tierAtual.nome || "base"}"`);
        }

        // Continua decaindo
        _timerDecay = setTimeout(_tickDecay, CFG.DECAY_INTERVALO);
    }

    // ════════════════════════════════════════
    // EMITIR EVENTO DE UPDATE
    // ════════════════════════════════════════
    function _emitirUpdate() {
        try {
            GameState.set("comboAtual",      _combo);
            GameState.set("comboMultiplier", _tierAtual.mult);
        } catch { /* não crítico */ }

        try {
            EventBus.emit("combo:update", {
                combo : _combo,
                mult  : _tierAtual.mult,
                tier  : _tierAtual,
                ativo : _combo > 0
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // REGISTRAR CLIQUE — API PRINCIPAL
    // ════════════════════════════════════════

    /**
     * Registra um clique no sistema de combo.
     * Deve ser chamado em cada clique/toque no canvas.
     *
     * @returns {{
     *   combo, mult, tier,
     *   novoTier, subioTier,
     *   multiplicadorAplicado
     * }}
     *
     * @example
     * canvas.addEventListener("click", () => {
     *     const info = ComboSystem.registrarClique();
     *     const dano = calcDanoBase() * info.mult;
     *     darDano(dano);
     * });
     */
    function registrarClique() {
        const agora      = performance.now();
        const intervalo  = agora - _ultimoClique;
        _ultimoClique    = agora;
        _stats.totalCliques++;

        const tierAntes  = _tierAtual;

        // Cancela decay em andamento
        _cancelarTimers();

        // Incrementa combo (cap em COMBO_MAX)
        _combo = Math.min(_combo + 1, CFG.COMBO_MAX);

        // Atualiza tier
        const novoTier  = _buscarTier(_combo);
        const subioTier = novoTier !== tierAntes && novoTier.minCombo > 0;
        _tierAtual      = novoTier;

        // Estatísticas
        if (_combo > _stats.maxComboAlcancado) {
            _stats.maxComboAlcancado = _combo;
        }
        _stats.totalMult += _tierAtual.mult;

        // Registra no histórico
        _historico.push({
            combo     : _combo,
            mult      : _tierAtual.mult,
            intervalo : Math.round(intervalo),
            timestamp : Date.now()
        });
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();

        // Tier atingido pela primeira vez nesta sessão?
        if (subioTier) {
            _onSubirTier(novoTier, tierAntes);
        }

        // Emite update
        _emitirUpdate();

        // Inicia timer de decay para o próximo clique
        _iniciarDecay();

        _log.debug(
            `Combo x${_combo} | x${_tierAtual.mult}` +
            ` | ${_tierAtual.nome || "base"}` +
            ` | Intervalo: ${Math.round(intervalo)}ms`
        );

        return {
            combo                : _combo,
            mult                 : _tierAtual.mult,
            tier                 : { ..._tierAtual },
            novoTier             : subioTier,
            subioTier,
            multiplicadorAplicado: _tierAtual.mult
        };
    }

    // ════════════════════════════════════════
    // AO SUBIR DE TIER
    // ════════════════════════════════════════
    function _onSubirTier(novoTier, tierAnterior) {
        _log.info(
            `Tier up! "${tierAnterior.nome || "base"}"` +
            ` → "${novoTier.nome}"` +
            ` | x${novoTier.mult}`
        );

        // Registra quantas vezes atingiu este tier
        const nomeTier = novoTier.nome || "base";
        _stats.tiersMais[nomeTier] = (_stats.tiersMais[nomeTier] ?? 0) + 1;

        // Toast nos tiers mais impactantes
        if (novoTier.minCombo >= 20) {
            try {
                Toast.mostrar(
                    `${novoTier.emoji} ${novoTier.nome}! x${novoTier.mult} DANO`,
                    {
                        tipo    : novoTier.minCombo >= 50 ? "lendario" : "nivel",
                        duracao : 2500,
                        icone   : novoTier.emoji
                    }
                );
            } catch { /* não crítico */ }
        }

        // Shake de câmera proporcional ao tier
        if (novoTier.shakeIntens > 0) {
            try {
                Camera.batalha.shake(novoTier.shakeIntens, 200, "click");
            } catch { /* não crítico */ }
        }

        // Evento de tier up para o renderer reagir
        try {
            EventBus.emit("combo:tier_up", {
                tier    : { ...novoTier },
                anterior: { ...tierAnterior },
                combo   : _combo
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // RESETAR (imediato)
    // ════════════════════════════════════════

    /**
     * Zera o combo imediatamente.
     * Chamado ao sair da batalha ou ao morrer (futuro).
     */
    function resetar() {
        _cancelarTimers();
        _combo     = 0;
        _tierAtual = TIER_ZERO;
        _ultimoClique = 0;

        try {
            GameState.set("comboAtual",      0);
            GameState.set("comboMultiplier", 1.0);
        } catch { /* não crítico */ }

        try {
            EventBus.emit("combo:reset", { motivo: "manual" });
        } catch { /* não crítico */ }

        _log.debug("Combo resetado.");
    }

    // ════════════════════════════════════════
    // LEITURA PÚBLICA
    // ════════════════════════════════════════

    /** Contagem atual de combo. */
    function combo()         { return _combo; }

    /** Multiplicador atual (1.0 – 3.0). */
    function multiplicador() { return _tierAtual.mult; }

    /** Tier atual (objeto completo). */
    function tier()          { return { ..._tierAtual }; }

    /** True se há combo ativo (combo > 0). */
    function ativo()         { return _combo > 0; }

    /**
     * Objeto completo para o renderer/UI.
     *
     * @returns {{
     *   combo, mult, tier,
     *   ativo, progresso,
     *   proximoTier, combosParaProximo,
     *   pulsante, cor, corGlow
     * }}
     */
    function info() {
        const proximoTierObj = TIERS.find(t => t.minCombo > _combo) ?? null;
        const combosParaProx = proximoTierObj
            ? proximoTierObj.minCombo - _combo
            : 0;

        // Progresso dentro do tier atual (0.0 → 1.0)
        const tierIdx = TIERS.indexOf(_tierAtual);
        let progresso = 1.0;

        if (proximoTierObj) {
            const tierMin = _tierAtual.minCombo;
            const tierMax = proximoTierObj.minCombo;
            progresso = tierMin > 0
                ? (_combo - tierMin) / (tierMax - tierMin)
                : _combo / tierMax;
            progresso = Math.min(1, Math.max(0, progresso));
        }

        return {
            combo            : _combo,
            mult             : _tierAtual.mult,
            tier             : { ..._tierAtual },
            ativo            : _combo > 0,
            progresso,

            proximoTier      : proximoTierObj ? { ...proximoTierObj } : null,
            combosParaProximo: combosParaProx,

            // Atalhos visuais para o renderer
            pulsante         : _tierAtual.pulsante,
            cor              : _tierAtual.cor,
            corGlow          : _tierAtual.corGlow,
            emoji            : _tierAtual.emoji,
            nome             : _tierAtual.nome
        };
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas de combo da sessão.
     */
    function stats() {
        const totalCliques = _stats.totalCliques;
        return {
            maxComboAlcancado  : _stats.maxComboAlcancado,
            totalCliques,
            multMedia          : totalCliques > 0
                ? parseFloat((_stats.totalMult / totalCliques).toFixed(3))
                : 1.0,
            tiersMais          : { ..._stats.tiersMais },
            comboAtual         : _combo,
            tierAtual          : _tierAtual.nome || "—"
        };
    }

    /**
     * Retorna histórico de cliques.
     * @param {number} [ultimos]
     */
    function historico(ultimos) {
        const h = [..._historico];
        return ultimos ? h.slice(-ultimos) : h;
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("ComboSystem — Status", () => {
            const s = stats();
            _log.debug(`Combo atual   : x${_combo} (${_tierAtual.nome || "sem tier"})`);
            _log.debug(`Multiplicador : x${_tierAtual.mult}`);
            _log.debug(`Max alcançado : x${s.maxComboAlcancado}`);
            _log.debug(`Total cliques : ${s.totalCliques}`);
            _log.debug(`Mult. média   : x${s.multMedia}`);
            _log.debug(`Janela atual  : ${_janelaAtual()}ms`);
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // ════════════════════════════════════════
    try {
        // Reset ao sair da batalha
        EventBus.on("batalha:saiu", () => resetar());

        // Reset ao monstro morrer (opcional — pode manter combo)
        // EventBus.on("kill:registrado", () => { /* manter combo? */ });

        // Reset total de save
        EventBus.on("state:reset:total", () => resetar());

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Ação principal
        registrarClique,

        // Leitura
        combo,
        multiplicador,
        tier,
        ativo,
        info,

        // Controle
        resetar,

        // Estatísticas
        stats,
        historico,

        // Diagnóstico
        logStatus,

        // Referências (readonly)
        get TIERS()    { return TIERS;    },
        get CFG()      { return CFG;      }
    });

})();
