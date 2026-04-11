// ═══════════════════════════════════════════════════════════
//  PRESTIGE.JS
//  Sistema completo de prestígio com recompensas escaladas.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, "prestigiar()" era uma função solta em
//  game-batalha.js que apenas resetava variáveis sem dar
//  recompensas, sem bônus permanentes, sem feedback visual
//  e sem histórico.
//
//  SOLUÇÃO:
//  Sistema de prestígio completo com múltiplas camadas de
//  recompensa, bônus permanentes que escalam com o número
//  de prestígios, marcos especiais e animação de confirmação.
//
//  FLUXO DE PRESTÍGIO:
//  1. podePrestigiar()     → verifica requisito (estágio 60+)
//  2. confirmar()          → exibe modal de confirmação
//  3. executar()           → executa o reset
//     ├── calcularRecompensas()  → gemas + relíquias
//     ├── Economy._setDireto()   → reseta moeda
//     ├── Upgrades.resetar()     → reseta upgrades
//     ├── GameState.resetGrupo() → reseta estado "run"
//     ├── _aplicarBonusPermanente() → registra bônus
//     ├── EventBus.emit("prestigio:feito")
//     └── SaveSystem.salvar()
//
//  BÔNUS PERMANENTES (escalam com nº de prestígios):
//  ┌──────────────────┬────────────────────────────────────┐
//  │ Bônus            │ Valor por prestígio                │
//  ├──────────────────┼────────────────────────────────────┤
//  │ Moeda ganho      │ +5% de moeda por kill              │
//  │ DPS passivo      │ +3% de DPS total                   │
//  │ Dano de clique   │ +2% de dano de clique              │
//  │ XP ganho         │ +2% de XP por kill                 │
//  │ Chance de crítico│ +0.5% de chance de crítico         │
//  └──────────────────┴────────────────────────────────────┘
//
//  RELÍQUIAS (futura moeda de prestígio):
//  - Ganhas em cada prestígio (escala com estágio máximo)
//  - Usadas para comprar upgrades permanentes
//
//  MARCOS DE PRESTÍGIO (recompensas especiais):
//  - 1º:  +50 gemas, toast especial
//  - 5º:  +150 gemas, bônus de moeda aumentado
//  - 10º: +300 gemas, modo especial
//  - 25º: +500 gemas, título especial
//  - 50º: +1000 gemas, máximo prestígio
//
//  API:
//    Prestige.podePrestigiar()       → boolean
//    Prestige.executar()             → boolean
//    Prestige.calcularRecompensas()  → objeto com tudo
//    Prestige.bonusPermanente()      → multiplicadores atuais
//    Prestige.total()                → número de prestígios
//    Prestige.estagioMaxAtingido()   → maior estágio já visto
//    Prestige.infoAtual()            → objeto completo para UI
//    Prestige.historico()            → registros de prestígio
//    Prestige.snapshot()             → para save
//    Prestige.carregar(dados)        → restaura do save
//
//  Depende de: constants.js, economy.js, upgrades.js,
//              state.js, event-bus.js, logger.js,
//              experience.js, damage.js
//  Usado por: battle.js, ui-battle.js, ui-upgrades.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Prestige = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Prestige"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Prestige]",  ...a),
            error : (...a) => console.error("[Prestige]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        // Requisito
        ESTAGIO_MINIMO        : 60,

        // Recompensas base
        GEMAS_BASE            : 10,     // gemas base por prestígio
        GEMAS_POR_ESTAGIO     : 0.5,    // +0.5 gema por estágio acima do mínimo
        GEMAS_POR_PRESTIGIO   : 2,      // +2 gemas por prestígio anterior

        // Relíquias (futura expansão)
        RELIQUIAS_BASE        : 1,
        RELIQUIAS_POR_10EST   : 0.1,    // +0.1 por cada 10 estágios acima do mínimo

        // Bônus permanentes (por prestígio)
        BONUS_MOEDA_PCT       : 0.05,   // +5% moeda por kill
        BONUS_DPS_PCT         : 0.03,   // +3% DPS total
        BONUS_DANO_CLICK_PCT  : 0.02,   // +2% dano de clique
        BONUS_XP_PCT          : 0.02,   // +2% XP por kill
        BONUS_CRIT_PCT        : 0.005,  // +0.5% chance de crítico

        // Cap de bônus (evita ficar infinito)
        BONUS_MOEDA_MAX       : 5.0,    // máx 500%
        BONUS_DPS_MAX         : 5.0,
        BONUS_DANO_CLICK_MAX  : 5.0,
        BONUS_XP_MAX          : 3.0,
        BONUS_CRIT_MAX        : 0.30,   // máx 30% de crit

        // Histórico
        HISTORICO_MAX         : 50
    });

    // ════════════════════════════════════════
    // MARCOS DE PRESTÍGIO
    // Recompensas especiais em números específicos
    // ════════════════════════════════════════
    const _MARCOS = Object.freeze([
        {
            numero    : 1,
            nome      : "Renascida",
            emoji     : "🌸",
            desc      : "Primeiro prestígio! A jornada recomeça mais forte.",
            recompensa: { gema: 50,   reliquia: 0  },
            titulo    : "Penitente"
        },
        {
            numero    : 3,
            nome      : "Perseverante",
            emoji     : "✝️",
            desc      : "Três vezes renascida. A fé se solidifica.",
            recompensa: { gema: 100,  reliquia: 1  },
            titulo    : "Devota"
        },
        {
            numero    : 5,
            nome      : "Campeã da Fé",
            emoji     : "🌟",
            desc      : "Cinco prestígios! O poder das rosas é lendário.",
            recompensa: { gema: 150,  reliquia: 2  },
            titulo    : "Campeã"
        },
        {
            numero    : 10,
            nome      : "Mística",
            emoji     : "💜",
            desc      : "Dez renascimentos. Transcendência espiritual.",
            recompensa: { gema: 300,  reliquia: 5  },
            titulo    : "Mística"
        },
        {
            numero    : 25,
            nome      : "Lenda Sagrada",
            emoji     : "👑",
            desc      : "Vinte e cinco prestígios. Uma lenda viva.",
            recompensa: { gema: 500,  reliquia: 10 },
            titulo    : "Lenda"
        },
        {
            numero    : 50,
            nome      : "Santa Eterna",
            emoji     : "✨",
            desc      : "Cinquenta prestígios. Forma perfeita alcançada.",
            recompensa: { gema: 1000, reliquia: 25 },
            titulo    : "Santa Eterna"
        },
        {
            numero    : 100,
            nome      : "Além da Transcendência",
            emoji     : "🌌",
            desc      : "Cem prestígios. Além do que qualquer santa já alcançou.",
            recompensa: { gema: 2000, reliquia: 50 },
            titulo    : "Imaculada"
        }
    ]);

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════
    let _totalPrestígios    = 0;
    let _estagioMaxAtingido = 0;
    let _tituloAtual        = "";

    // Bônus permanentes acumulados
    const _bonus = {
        multMoeda     : 1.0,
        multDps       : 1.0,
        multDanoClick : 1.0,
        multXp        : 1.0,
        bonusCrit     : 0.0
    };

    // Histórico de prestígios
    const _historico = [];

    // ════════════════════════════════════════
    // LEITURA DO ESTADO ATUAL
    // ════════════════════════════════════════
    function _estagioAtual() {
        try   { return Math.max(1, GameState.get("estagio") ?? 1); }
        catch { return 1; }
    }

    function _totalPrestigiosState() {
        try   { return Math.max(0, GameState.get("totalPrestígios") ?? 0); }
        catch { return _totalPrestígios; }
    }

    // ════════════════════════════════════════
    // VERIFICAR ELEGIBILIDADE
    // ════════════════════════════════════════

    /**
     * Verifica se o jogador pode prestigiar agora.
     * @returns {boolean}
     */
    function podePrestigiar() {
        return _estagioAtual() >= CFG.ESTAGIO_MINIMO;
    }

    /**
     * Retorna quanto falta para poder prestigiar.
     * @returns {{ pode: boolean, estagioAtual: number, estagioMin: number, faltam: number }}
     */
    function requisito() {
        const atual  = _estagioAtual();
        const faltam = Math.max(0, CFG.ESTAGIO_MINIMO - atual);
        return {
            pode       : faltam === 0,
            estagioAtual: atual,
            estagioMin : CFG.ESTAGIO_MINIMO,
            faltam,
            pct        : Math.min(1, atual / CFG.ESTAGIO_MINIMO)
        };
    }

    // ════════════════════════════════════════
    // CALCULAR RECOMPENSAS
    // ════════════════════════════════════════

    /**
     * Calcula as recompensas de um prestígio sem executar.
     * Usado para preview na UI antes de confirmar.
     *
     * @param {number} [estagioOverride] — para simular de outro estágio
     * @returns {{
     *   gemas         : number,
     *   reliquias     : number,
     *   marco         : object|null,
     *   bonusProximo  : object,
     *   descricao     : string[]
     * }}
     */
    function calcularRecompensas(estagioOverride) {
        const estagio   = estagioOverride ?? _estagioAtual();
        const total     = _totalPrestigiosState();
        const proximo   = total + 1;

        // Gemas
        const gemasBase   = CFG.GEMAS_BASE;
        const gemasEst    = Math.floor(
            Math.max(0, estagio - CFG.ESTAGIO_MINIMO) * CFG.GEMAS_POR_ESTAGIO
        );
        const gemasAcum   = total * CFG.GEMAS_POR_PRESTIGIO;
        const gemas       = gemasBase + gemasEst + gemasAcum;

        // Relíquias
        const reliquias   = Math.floor(
            CFG.RELIQUIAS_BASE +
            Math.max(0, estagio - CFG.ESTAGIO_MINIMO) / 10 * CFG.RELIQUIAS_POR_10EST
        );

        // Marco
        const marco = _MARCOS.find(m => m.numero === proximo) ?? null;

        // Bônus permanente do próximo prestígio
        const bonusProximo = _calcBonusParaN(proximo);

        // Bônus extra do marco
        const gemasTotal = gemas + (marco?.recompensa?.gema ?? 0);
        const relTotal   = reliquias + (marco?.recompensa?.reliquia ?? 0);

        // Linhas descritivas para a UI
        const descricao = [
            `💎 +${gemasTotal} Gemas`,
            `✨ +${relTotal} Relíquia${relTotal !== 1 ? "s" : ""}`,
            `🪙 Moeda: x${bonusProximo.multMoeda.toFixed(2)} (+${Math.round(CFG.BONUS_MOEDA_PCT * 100)}%)`,
            `⚡ DPS: x${bonusProximo.multDps.toFixed(2)} (+${Math.round(CFG.BONUS_DPS_PCT * 100)}%)`,
            `👆 Dano: x${bonusProximo.multDanoClick.toFixed(2)} (+${Math.round(CFG.BONUS_DANO_CLICK_PCT * 100)}%)`,
            `🎯 Crítico: +${(bonusProximo.bonusCrit * 100).toFixed(1)}%`,
        ];

        if (marco) {
            descricao.push(`${marco.emoji} Marco: "${marco.nome}"!`);
        }

        return {
            gemas          : gemasTotal,
            reliquias      : relTotal,
            marco,
            bonusProximo,
            descricao,
            estagioAtual   : estagio,
            prestigioNumero: proximo
        };
    }

    // ════════════════════════════════════════
    // CALCULAR BÔNUS PARA N PRESTÍGIOS
    // ════════════════════════════════════════
    function _calcBonusParaN(n) {
        return {
            multMoeda    : Math.min(CFG.BONUS_MOEDA_MAX,
                1 + n * CFG.BONUS_MOEDA_PCT),
            multDps      : Math.min(CFG.BONUS_DPS_MAX,
                1 + n * CFG.BONUS_DPS_PCT),
            multDanoClick: Math.min(CFG.BONUS_DANO_CLICK_MAX,
                1 + n * CFG.BONUS_DANO_CLICK_PCT),
            multXp       : Math.min(CFG.BONUS_XP_MAX,
                1 + n * CFG.BONUS_XP_PCT),
            bonusCrit    : Math.min(CFG.BONUS_CRIT_MAX,
                n * CFG.BONUS_CRIT_PCT)
        };
    }

    // ════════════════════════════════════════
    // APLICAR BÔNUS PERMANENTE
    // ════════════════════════════════════════
    function _aplicarBonusPermanente(novoTotal) {
        const novoBonus = _calcBonusParaN(novoTotal);

        _bonus.multMoeda     = novoBonus.multMoeda;
        _bonus.multDps       = novoBonus.multDps;
        _bonus.multDanoClick = novoBonus.multDanoClick;
        _bonus.multXp        = novoBonus.multXp;
        _bonus.bonusCrit     = novoBonus.bonusCrit;

        // Registra bônus no Damage.js
        try {
            Damage.addBonusCritChance(CFG.BONUS_CRIT_PCT);
        } catch { /* não crítico */ }

        // Registra multiplicador de moeda no Economy.js
        try {
            Economy.setMultiplicador("moeda", _bonus.multMoeda);
        } catch { /* não crítico */ }

        // Registra bônus externo de dano no Damage.js
        try {
            Damage.registrarBonus(() => ({
                mult: _bonus.multDanoClick,
                flat: 0
            }));
        } catch { /* não crítico */ }

        _log.info(
            `Bônus permanente após ${novoTotal} prestígio(s):` +
            ` Moeda x${_bonus.multMoeda.toFixed(2)}` +
            ` | DPS x${_bonus.multDps.toFixed(2)}` +
            ` | Dano x${_bonus.multDanoClick.toFixed(2)}` +
            ` | Crit +${(_bonus.bonusCrit * 100).toFixed(1)}%`
        );
    }

    // ════════════════════════════════════════
    // EXECUTAR PRESTÍGIO
    // ════════════════════════════════════════

    /**
     * Executa o prestígio completo.
     * Verifica elegibilidade, reseta estado, concede recompensas.
     *
     * @returns {boolean} — true se executado com sucesso
     */
    function executar() {
        if (!podePrestigiar()) {
            const req = requisito();
            _log.warn(
                `executar(): requisito não atendido.` +
                ` Faltam ${req.faltam} estágios.`
            );
            try {
                Toast.aviso(
                    `🌟 Alcance o estágio ${CFG.ESTAGIO_MINIMO} para prestigiar!` +
                    ` (Atual: ${req.estagioAtual})`
                );
            } catch { /* não crítico */ }
            return false;
        }

        const estagioFinal  = _estagioAtual();
        const recompensas   = calcularRecompensas(estagioFinal);
        const totalAnterior = _totalPrestigiosState();
        const novoTotal     = totalAnterior + 1;

        _log.info(
            `═══ PRESTÍGIO #${novoTotal} ═══` +
            ` | Estágio: ${estagioFinal}` +
            ` | Recompensa: ${recompensas.gemas}💎 ${recompensas.reliquias}✨`
        );

        // ── 1. Atualiza estágio máximo ──
        if (estagioFinal > _estagioMaxAtingido) {
            _estagioMaxAtingido = estagioFinal;
        }

        // ── 2. Reseta run (moeda, upgrades, estágio) ──
        try { GameState.resetGrupo("run"); } catch { /* não crítico */ }

        // ── 3. Reseta upgrades ──
        try { Upgrades.resetar(); } catch { /* não crítico */ }

        // ── 4. Reseta moeda ──
        try { Economy._setDireto("moeda", 0); } catch { /* não crítico */ }

        // ── 5. Reseta combo ──
        try { ComboSystem.resetar(); } catch { /* não crítico */ }

        // ── 6. Incrementa contador ──
        _totalPrestígios = novoTotal;
        try { GameState.set("totalPrestígios", novoTotal); } catch { /* não crítico */ }

        // ── 7. Aplica bônus permanente ──
        _aplicarBonusPermanente(novoTotal);

        // ── 8. Concede recompensas ──
        try {
            Economy.ganhar("gema",     recompensas.gemas,    `prestigio:${novoTotal}`);
            if (recompensas.reliquias > 0) {
                Economy.ganhar("reliquia", recompensas.reliquias, `prestigio:${novoTotal}`);
            }
        } catch (e) {
            _log.error("executar(): Economy.ganhar falhou:", e);
        }

        // ── 9. Marco especial ──
        if (recompensas.marco) {
            _processarMarco(recompensas.marco, novoTotal);
        }

        // ── 10. Atualiza título ──
        const ultimoMarco = [..._MARCOS].reverse().find(m => m.numero <= novoTotal);
        if (ultimoMarco?.titulo) _tituloAtual = ultimoMarco.titulo;

        // ── 11. Registra no histórico ──
        const registro = {
            numero         : novoTotal,
            estagioFinal,
            gemasRecebidas : recompensas.gemas,
            reliquisRecebidas: recompensas.reliquias,
            marco          : recompensas.marco?.nome ?? null,
            bonus          : { ..._bonus },
            timestamp      : Date.now()
        };
        _historico.push(registro);
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();

        // ── 12. Toast de confirmação ──
        try {
            Toast.mostrar(
                `🌸 PRESTÍGIO #${novoTotal}! +${recompensas.gemas}💎` +
                (recompensas.marco ? ` — ${recompensas.marco.emoji} ${recompensas.marco.nome}!` : ""),
                { tipo: "lendario", duracao: 6000, icone: "🌸" }
            );
        } catch { /* não crítico */ }

        // ── 13. Emite evento principal ──
        try {
            EventBus.emit("prestigio:feito", {
                numero     : novoTotal,
                estagioFinal,
                recompensas,
                bonus      : { ..._bonus },
                marco      : recompensas.marco
            });
        } catch (e) {
            _log.error("executar(): falha ao emitir evento:", e);
        }

        // ── 14. Salva automaticamente ──
        try { SaveSystem.salvar(); } catch { /* não crítico */ }

        _log.info(`Prestígio #${novoTotal} concluído com sucesso!`);
        return true;
    }

    // ════════════════════════════════════════
    // PROCESSAR MARCO
    // ════════════════════════════════════════
    function _processarMarco(marco, novoTotal) {
        _log.info(`Marco de prestígio: ${marco.emoji} "${marco.nome}" (${marco.numero}º)`);

        try {
            Toast.mostrar(
                `${marco.emoji} ${marco.nome}! "${marco.desc}"`,
                { tipo: "nivel", duracao: 8000, icone: marco.emoji }
            );
        } catch { /* não crítico */ }

        try {
            EventBus.emit("prestigio:marco", {
                marco,
                numero : novoTotal
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // BÔNUS PERMANENTE ATUAL
    // ════════════════════════════════════════

    /**
     * Retorna os multiplicadores permanentes atuais.
     * Usado por damage.js, experience.js, economy.js.
     *
     * @returns {{
     *   multMoeda, multDps, multDanoClick, multXp, bonusCrit
     * }}
     */
    function bonusPermanente() {
        return { ..._bonus };
    }

    // ════════════════════════════════════════
    // LEITURA
    // ════════════════════════════════════════

    /** Total de prestígios realizados. */
    function total() {
        return _totalPrestigiosState();
    }

    /** Maior estágio atingido em qualquer run. */
    function estagioMaxAtingido() {
        return _estagioMaxAtingido;
    }

    /** Título atual do jogador. */
    function titulo() {
        return _tituloAtual || "Iniciante";
    }

    /** Próximo marco de prestígio. */
    function proximoMarco() {
        const t = _totalPrestigiosState();
        return _MARCOS.find(m => m.numero > t) ?? null;
    }

    /**
     * Objeto completo para UI do botão de prestígio.
     *
     * @returns {{
     *   podePrestigiar, requisito, recompensas,
     *   total, titulo, bonusAtual,
     *   proximoMarco, historico
     * }}
     */
    function infoAtual() {
        const pode = podePrestigiar();
        const req  = requisito();

        return {
            podePrestigiar  : pode,
            requisito       : req,
            recompensas     : pode ? calcularRecompensas() : null,
            total           : _totalPrestigiosState(),
            titulo          : titulo(),
            estagioMax      : _estagioMaxAtingido,
            bonusAtual      : { ..._bonus },
            proximoMarco    : proximoMarco(),
            historico       : _historico.slice(-5),   // últimos 5 para UI
            // Texto do botão
            textoBotao      : pode
                ? `🌟 Prestigiar! (+${calcularRecompensas().gemas}💎)`
                : `Alcance o Estágio ${CFG.ESTAGIO_MINIMO} (${req.estagioAtual}/${CFG.ESTAGIO_MINIMO})`
        };
    }

    // ════════════════════════════════════════
    // HISTÓRICO
    // ════════════════════════════════════════

    /**
     * @param {number} [ultimos]
     * @returns {Array}
     */
    function historico(ultimos) {
        const h = [..._historico];
        return ultimos ? h.slice(-ultimos) : h;
    }

    // ════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════

    /**
     * Retorna snapshot para o SaveSystem.
     */
    function snapshot() {
        return {
            totalPrestígios   : _totalPrestígios,
            estagioMaxAtingido: _estagioMaxAtingido,
            tituloAtual       : _tituloAtual,
            bonus             : { ..._bonus },
            historico         : _historico.slice(-30)
        };
    }

    /**
     * Restaura do save.
     * Reaplicar bônus permanentes é crítico — sem isso
     * o jogador perde os bônus ao recarregar.
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.warn("carregar(): dados inválidos.");
            return;
        }

        _totalPrestígios     = dados.totalPrestígios     ?? 0;
        _estagioMaxAtingido  = dados.estagioMaxAtingido  ?? 0;
        _tituloAtual         = dados.tituloAtual         ?? "";

        // Reaplicar bônus calculados pelo número de prestígios
        // (não usa o valor salvo para evitar inconsistências)
        if (_totalPrestígios > 0) {
            _aplicarBonusPermanente(_totalPrestígios);
        }

        // Restaura histórico
        if (Array.isArray(dados.historico)) {
            dados.historico.forEach(r => _historico.push(r));
        }

        _log.debug(
            `carregar(): ${_totalPrestígios} prestígio(s)` +
            ` | EstMax: ${_estagioMaxAtingido}` +
            ` | Título: "${_tituloAtual}"` +
            ` | Moeda x${_bonus.multMoeda.toFixed(2)}`
        );
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Prestige — Status", () => {
            _log.debug(`Total          : ${_totalPrestigiosState()}`);
            _log.debug(`Estágio atual  : ${_estagioAtual()}`);
            _log.debug(`Estágio max    : ${_estagioMaxAtingido}`);
            _log.debug(`Título         : ${titulo()}`);
            _log.debug(`Pode prestigiar: ${podePrestigiar()}`);
            _log.debug(`── Bônus ────────────────`);
            _log.debug(`Moeda          : x${_bonus.multMoeda.toFixed(3)}`);
            _log.debug(`DPS            : x${_bonus.multDps.toFixed(3)}`);
            _log.debug(`Dano Clique    : x${_bonus.multDanoClick.toFixed(3)}`);
            _log.debug(`XP             : x${_bonus.multXp.toFixed(3)}`);
            _log.debug(`Crítico        : +${(_bonus.bonusCrit * 100).toFixed(1)}%`);
            _log.debug(`── Próximo Marco ────────`);
            const pm = proximoMarco();
            if (pm) _log.debug(`${pm.emoji} "${pm.nome}" no prestígio #${pm.numero}`);
            else    _log.debug("Nenhum marco pendente.");
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        // Reset total de save
        EventBus.on("state:reset:total", () => {
            _totalPrestígios    = 0;
            _estagioMaxAtingido = 0;
            _tituloAtual        = "";
            _historico.length   = 0;
            _bonus.multMoeda     = 1.0;
            _bonus.multDps       = 1.0;
            _bonus.multDanoClick = 1.0;
            _bonus.multXp        = 1.0;
            _bonus.bonusCrit     = 0.0;
            _log.info("Prestige resetado.");
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Principal
        executar,
        podePrestigiar,

        // Informações
        requisito,
        calcularRecompensas,
        bonusPermanente,
        infoAtual,

        // Leitura
        total,
        estagioMaxAtingido,
        titulo,
        proximoMarco,
        historico,

        // Save/Load
        snapshot,
        carregar,

        // Diagnóstico
        logStatus,

        // Referências (readonly)
        get MARCOS() { return _MARCOS; },
        get CFG()    { return CFG;     }
    });

})();
