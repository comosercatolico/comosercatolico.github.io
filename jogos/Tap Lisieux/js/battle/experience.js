// ═══════════════════════════════════════════════════════════
//  EXPERIENCE.JS
//  Sistema completo de experiência e progressão da Santa.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, ganharExp() vivia em game-batalha.js
//  misturado com lógica de renderização. Level up era um
//  simples while loop sem eventos, sem bônus, sem histórico.
//
//  SOLUÇÃO:
//  Sistema dedicado com curva de progressão configurável,
//  bônus por nível, marcos especiais e histórico completo.
//
//  MECÂNICA:
//  - XP ganho ao matar inimigos (escala com estágio)
//  - XP ganho por outros eventos (conquistas, prestígio)
//  - Level up: expMax = 100 × 1.3^(nivel-1)
//  - Bônus de dano por nível: +2% por nível acima de 1
//  - Marcos a cada 10 níveis (recompensas especiais)
//  - Nível máximo configurável (0 = sem limite)
//
//  FÓRMULAS:
//  expMax(n)     = floor(EXP_BASE × EXP_ESCALA^(n-1))
//  bonusDano(n)  = 1 + (n-1) × 0.02   → +2% por nível
//  expKill(e)    = floor(5 + estagio × 2)
//
//  API:
//    Experience.ganhar(qtd, origem)
//    Experience.nivel()              → number
//    Experience.exp()                → number
//    Experience.expMax()             → number (para próximo nível)
//    Experience.progresso()          → 0.0 a 1.0
//    Experience.bonusDano()          → multiplicador (ex: 1.24)
//    Experience.bonusDps()           → multiplicador
//    Experience.expParaProximo()     → exp faltando
//    Experience.infoNivel()          → objeto completo para UI
//    Experience.resetar()            → volta ao nível 1
//    Experience.snapshot()           → para save
//    Experience.carregar(dados)      → restaura do save
//
//  Depende de: constants.js, state.js, event-bus.js, logger.js
//  Usado por: battle.js, damage.js, ui-battle.js, ui-hud.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Experience = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Experience"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Experience]",  ...a),
            error : (...a) => console.error("[Experience]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // Todos os números em um lugar só
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        // Curva de XP
        EXP_BASE          : 100,      // XP para chegar ao nível 2
        EXP_ESCALA        : 1.30,     // multiplicador por nível
        NIVEL_MAX         : 0,        // 0 = sem limite

        // Bônus por nível
        BONUS_DANO_POR_NV : 0.02,     // +2% de dano por nível acima de 1
        BONUS_DPS_POR_NV  : 0.015,    // +1.5% de DPS por nível

        // XP por kill
        EXP_KILL_BASE     : 5,        // XP base por kill
        EXP_KILL_ESCALA   : 2,        // × estagio atual
        EXP_KILL_CHEFE    : 3.0,      // multiplicador para chefes

        // Marcos de nível (a cada N níveis — recompensa especial)
        INTERVALO_MARCO   : 10,

        // Histórico
        HISTORICO_MAX     : 50
    });

    // ════════════════════════════════════════
    // MARCOS DE NÍVEL
    // Recompensas especiais a cada 10 níveis
    // ════════════════════════════════════════
    const _MARCOS = Object.freeze([
        { nivel: 10,  emoji: "🌟", nome: "Aprendiz da Fé",
          recompensa: { gema: 5 },    desc: "Primeiros passos sagrados" },
        { nivel: 20,  emoji: "✝️",  nome: "Devota",
          recompensa: { gema: 10 },   desc: "A fé se fortalece" },
        { nivel: 30,  emoji: "🌹",  nome: "Missionária",
          recompensa: { gema: 20 },   desc: "Espalhando o amor divino" },
        { nivel: 40,  emoji: "🙏",  nome: "Serva do Senhor",
          recompensa: { gema: 30 },   desc: "Humildade e coragem" },
        { nivel: 50,  emoji: "👑",  nome: "Santa Guerreira",
          recompensa: { gema: 50 },   desc: "Meio caminho andado" },
        { nivel: 75,  emoji: "⚔️",  nome: "Campeã Celestial",
          recompensa: { gema: 75 },   desc: "Força além do comum" },
        { nivel: 100, emoji: "✨",  nome: "Santa Teresinha Plena",
          recompensa: { gema: 150 },  desc: "A santa em todo seu esplendor" },
    ]);

    // ════════════════════════════════════════
    // HISTÓRICO
    // ════════════════════════════════════════
    const _historico = []; // { tipo, qtd, origem, nivelAntes, timestamp }

    // ════════════════════════════════════════
    // ACESSO AO STATE
    // ════════════════════════════════════════
    function _nivel()    {
        try { return Math.max(1, GameState.get("nivelPersonagem") ?? 1); }
        catch { return 1; }
    }

    function _exp()      {
        try { return Math.max(0, GameState.get("expPersonagem") ?? 0); }
        catch { return 0; }
    }

    function _expMax()   {
        try { return Math.max(1, GameState.get("expMaxPersonagem") ?? CFG.EXP_BASE); }
        catch { return CFG.EXP_BASE; }
    }

    function _setNivel(n)  {
        try { GameState.set("nivelPersonagem",   Math.max(1, n)); } catch { /* não crítico */ }
    }
    function _setExp(e)    {
        try { GameState.set("expPersonagem",     Math.max(0, e)); } catch { /* não crítico */ }
    }
    function _setExpMax(m) {
        try { GameState.set("expMaxPersonagem",  Math.max(1, m)); } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // CÁLCULO DE expMax POR NÍVEL
    // ════════════════════════════════════════

    /**
     * Calcula o XP necessário para atingir o nível n+1.
     * @param {number} n — nível atual
     * @returns {number}
     */
    function _calcExpMax(n) {
        return Math.floor(CFG.EXP_BASE * Math.pow(CFG.EXP_ESCALA, n - 1));
    }

    // ════════════════════════════════════════
    // CÁLCULO DE BÔNUS
    // ════════════════════════════════════════

    /**
     * Multiplicador de dano por nível.
     * Nível 1 → 1.00 (sem bônus)
     * Nível 10 → 1.18 (+18%)
     * Nível 50 → 1.98 (+98%)
     *
     * @param {number} [n] — nível (padrão: nível atual)
     * @returns {number}
     */
    function bonusDano(n) {
        const nv = n ?? _nivel();
        return parseFloat((1 + (nv - 1) * CFG.BONUS_DANO_POR_NV).toFixed(4));
    }

    /**
     * Multiplicador de DPS por nível.
     * @param {number} [n]
     * @returns {number}
     */
    function bonusDps(n) {
        const nv = n ?? _nivel();
        return parseFloat((1 + (nv - 1) * CFG.BONUS_DPS_POR_NV).toFixed(4));
    }

    // ════════════════════════════════════════
    // LEITURA PÚBLICA
    // ════════════════════════════════════════

    /** Nível atual. */
    function nivel()          { return _nivel();   }

    /** XP atual dentro do nível. */
    function exp()            { return _exp();     }

    /** XP necessário para o próximo nível. */
    function expMax()         { return _expMax();  }

    /** XP faltando para o próximo nível. */
    function expParaProximo() { return Math.max(0, _expMax() - _exp()); }

    /**
     * Progresso de 0.0 a 1.0 dentro do nível atual.
     * @returns {number}
     */
    function progresso() {
        const max = _expMax();
        return max > 0 ? Math.min(1, _exp() / max) : 0;
    }

    /**
     * XP total acumulado desde o nível 1.
     * Útil para ranking / estatísticas.
     * @returns {number}
     */
    function expTotal() {
        let total = _exp();
        const nv  = _nivel();
        for (let i = 1; i < nv; i++) {
            total += _calcExpMax(i);
        }
        return total;
    }

    // ════════════════════════════════════════
    // GANHAR XP
    // ════════════════════════════════════════

    /**
     * Concede XP ao personagem.
     * Processa múltiplos level ups em cascata se necessário.
     *
     * @param {number} qtd    — quantidade de XP a ganhar
     * @param {string} origem — fonte ("kill", "conquista", "missao", etc.)
     *
     * @example
     * Experience.ganhar(15, "kill:estagio5");
     * Experience.ganhar(50, "conquista:exploradora");
     */
    function ganhar(qtd, origem = "desconhecido") {
        if (typeof qtd !== "number" || qtd <= 0 || isNaN(qtd)) {
            _log.warn(`ganhar(): quantidade inválida: ${qtd}`);
            return;
        }

        // Verifica nível máximo
        if (CFG.NIVEL_MAX > 0 && _nivel() >= CFG.NIVEL_MAX) {
            _log.debug(`ganhar(): nível máximo atingido (${CFG.NIVEL_MAX}). XP ignorado.`);
            return;
        }

        const nivelAntes = _nivel();
        const qtdReal    = Math.floor(qtd);

        _historico.push({
            tipo      : "ganho",
            qtd       : qtdReal,
            origem,
            nivelAntes,
            timestamp : Date.now()
        });
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();

        _log.debug(`ganhar(${qtdReal} XP) [${origem}] | Nv.${nivelAntes} ${_exp()}/${_expMax()}`);

        // Aplica XP e processa level ups
        let expAtual = _exp() + qtdReal;
        let nivelAtual = _nivel();
        let levelUps   = 0;

        while (expAtual >= _calcExpMax(nivelAtual)) {
            // Verifica nível máximo
            if (CFG.NIVEL_MAX > 0 && nivelAtual >= CFG.NIVEL_MAX) {
                expAtual = _calcExpMax(nivelAtual) - 1; // cap no máximo
                break;
            }

            expAtual  -= _calcExpMax(nivelAtual);
            nivelAtual++;
            levelUps++;

            _processarLevelUp(nivelAtual);
        }

        // Salva estado final
        _setNivel(nivelAtual);
        _setExp(expAtual);
        _setExpMax(_calcExpMax(nivelAtual));

        // Emite evento de XP ganho
        try {
            EventBus.emit("exp:ganho", {
                qtd       : qtdReal,
                origem,
                nivelAntes,
                nivelNovo : nivelAtual,
                levelUps,
                expAtual,
                expMax    : _calcExpMax(nivelAtual)
            });
        } catch (e) {
            _log.error("ganhar(): falha ao emitir exp:ganho:", e);
        }

        if (levelUps > 0) {
            _log.info(
                `LEVEL UP! Nv.${nivelAntes} → Nv.${nivelAtual}` +
                ` (${levelUps} nível${levelUps > 1 ? "s" : ""})` +
                ` | Bônus dano: x${bonusDano(nivelAtual)}`
            );
        }
    }

    // ════════════════════════════════════════
    // PROCESSAR LEVEL UP
    // ════════════════════════════════════════
    function _processarLevelUp(novoNivel) {
        // Toast de level up
        try {
            Toast.nivel(`⬆️ LEVEL UP! Santa Teresinha Lv.${novoNivel}`);
        } catch { /* não crítico */ }

        // Emite evento de level up
        try {
            EventBus.emit("nivel:up", {
                nivel  : novoNivel,
                bonus  : bonusDano(novoNivel),
                expMax : _calcExpMax(novoNivel)
            });
        } catch { /* não crítico */ }

        // Verifica marcos
        _verificarMarco(novoNivel);

        // Registra no histórico
        _historico.push({
            tipo      : "levelup",
            qtd       : novoNivel,
            origem    : "levelup",
            nivelAntes: novoNivel - 1,
            timestamp : Date.now()
        });
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();
    }

    // ════════════════════════════════════════
    // MARCOS DE NÍVEL
    // ════════════════════════════════════════
    function _verificarMarco(novoNivel) {
        // Marco fixo (lista _MARCOS)
        const marco = _MARCOS.find(m => m.nivel === novoNivel);
        if (marco) {
            _aplicarMarco(marco);
            return;
        }

        // Marco periódico (a cada INTERVALO_MARCO)
        if (novoNivel > 0 && novoNivel % CFG.INTERVALO_MARCO === 0) {
            const marcoGenerico = {
                nivel     : novoNivel,
                emoji     : "🌸",
                nome      : `Marco do Nível ${novoNivel}`,
                recompensa: { gema: Math.floor(novoNivel / 10) * 2 },
                desc      : `Alcançou o nível ${novoNivel}!`
            };
            _aplicarMarco(marcoGenerico);
        }
    }

    function _aplicarMarco(marco) {
        // Recompensa em gema
        if (marco.recompensa?.gema > 0) {
            try {
                Economy.ganhar("gema", marco.recompensa.gema, `marco:nv${marco.nivel}`);
            } catch { /* Economy pode não estar disponível */ }
        }

        // Toast especial de marco
        try {
            Toast.mostrar(
                `${marco.emoji} ${marco.nome}! +${marco.recompensa?.gema ?? 0} 💎`,
                {
                    tipo    : "nivel",
                    duracao : 5000,
                    icone   : marco.emoji
                }
            );
        } catch { /* não crítico */ }

        _log.info(
            `Marco atingido! Nv.${marco.nivel} — "${marco.nome}"` +
            ` | +${marco.recompensa?.gema ?? 0} 💎`
        );

        try {
            EventBus.emit("nivel:marco", {
                nivel     : marco.nivel,
                nome      : marco.nome,
                emoji     : marco.emoji,
                recompensa: marco.recompensa
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // XP POR KILL (cálculo)
    // ════════════════════════════════════════

    /**
     * Calcula o XP ganho ao matar um inimigo.
     * Chamado pelo battle.js ao matar inimigo.
     *
     * @param {number}  estagio — estágio atual
     * @param {boolean} chefe   — se é chefe (a cada 10 estágios)
     * @returns {number}
     *
     * @example
     * const xp = Experience.calcXpKill(5, false); // → 15
     * const xp = Experience.calcXpKill(10, true);  // → 75 (chefe)
     */
    function calcXpKill(estagio, chefe = false) {
        const base = Math.floor(CFG.EXP_KILL_BASE + estagio * CFG.EXP_KILL_ESCALA);
        return chefe ? Math.floor(base * CFG.EXP_KILL_CHEFE) : base;
    }

    // ════════════════════════════════════════
    // INFO COMPLETO PARA UI
    // ════════════════════════════════════════

    /**
     * Retorna um objeto completo com tudo que a UI precisa.
     *
     * @returns {{
     *   nivel, exp, expMax, expParaProximo, progresso,
     *   expTotal, bonusDano, bonusDps,
     *   proximoMarco, descBonusDano, descBonusDps
     * }}
     */
    function infoNivel() {
        const nv      = _nivel();
        const bDano   = bonusDano(nv);
        const bDps    = bonusDps(nv);
        const pct     = progresso();

        // Próximo marco
        const proximoMarco = _MARCOS.find(m => m.nivel > nv) ?? null;

        // Próximo marco periódico
        const proximoPeriodico = nv > 0
            ? Math.ceil((nv + 1) / CFG.INTERVALO_MARCO) * CFG.INTERVALO_MARCO
            : CFG.INTERVALO_MARCO;

        return {
            nivel          : nv,
            exp            : _exp(),
            expMax         : _expMax(),
            expParaProximo : expParaProximo(),
            progresso      : pct,
            porcentagem    : Math.floor(pct * 100),
            expTotal       : expTotal(),

            bonusDano      : bDano,
            bonusDps       : bDps,
            descBonusDano  : `+${Math.round((bDano - 1) * 100)}% dano`,
            descBonusDps   : `+${Math.round((bDps  - 1) * 100)}% DPS`,

            proximoMarco   : proximoMarco ?? {
                nivel     : proximoPeriodico,
                emoji     : "🌸",
                nome      : `Marco do Nível ${proximoPeriodico}`,
                recompensa: { gema: Math.floor(proximoPeriodico / 10) * 2 }
            },

            nivelMax       : CFG.NIVEL_MAX,
            noMaximo       : CFG.NIVEL_MAX > 0 && nv >= CFG.NIVEL_MAX
        };
    }

    // ════════════════════════════════════════
    // RESETAR (prestígio)
    // ════════════════════════════════════════

    /**
     * Reseta o personagem para o nível 1.
     * ⚠️ No prestígio padrão, o nível NÃO reseta.
     * Essa função existe para reset total de save.
     */
    function resetar() {
        _setNivel(1);
        _setExp(0);
        _setExpMax(CFG.EXP_BASE);
        _historico.length = 0;

        _log.info("Experience resetado para Nv.1.");

        try {
            EventBus.emit("nivel:resetado");
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════

    /**
     * Retorna snapshot para o SaveSystem.
     * @returns {{ nivel, exp, expMax }}
     */
    function snapshot() {
        return {
            nivel  : _nivel(),
            exp    : _exp(),
            expMax : _expMax()
        };
    }

    /**
     * Restaura estado do save.
     * @param {{ nivel, exp, expMax }} dados
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.warn("carregar(): dados inválidos.");
            return;
        }

        const nv = Math.max(1, dados.nivel ?? 1);
        const ex = Math.max(0, dados.exp   ?? 0);
        const em = Math.max(1, dados.expMax ?? _calcExpMax(nv));

        // Valida consistência: exp não pode ser maior que expMax
        const exValido = Math.min(ex, em - 1);

        _setNivel(nv);
        _setExp(exValido);
        _setExpMax(em);

        _log.debug(
            `carregar(): Nv.${nv} | ${exValido}/${em} XP` +
            ` | Bônus dano: x${bonusDano(nv)}`
        );
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Loga o estado atual no console (só dev).
     */
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        const info = infoNivel();

        Logger.grupo("Experience — Status", () => {
            _log.debug(`Nível        : ${info.nivel}${info.noMaximo ? " (MÁXIMO)" : ""}`);
            _log.debug(`XP           : ${info.exp} / ${info.expMax} (${info.porcentagem}%)`);
            _log.debug(`Faltando     : ${info.expParaProximo} XP`);
            _log.debug(`XP Total     : ${info.expTotal}`);
            _log.debug(`Bônus Dano   : x${info.bonusDano} (${info.descBonusDano})`);
            _log.debug(`Bônus DPS    : x${info.bonusDps}  (${info.descBonusDps})`);
            _log.debug(`Próximo Marco: Nv.${info.proximoMarco.nivel} ${info.proximoMarco.emoji}`);
        }, true);
    }

    /**
     * Retorna o histórico de eventos de XP.
     * @param {number} [ultimas]
     * @returns {Array}
     */
    function historico(ultimas) {
        const h = [..._historico];
        return ultimas ? h.slice(-ultimas) : h;
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // ════════════════════════════════════════
    try {
        // XP ao matar inimigo (automático)
        EventBus.on("kill:registrado", ({ estagio: e = 1, chefe = false } = {}) => {
            const xp = calcXpKill(e, chefe);
            ganhar(xp, chefe ? `kill:chefe:${e}` : `kill:${e}`);
        });

        // XP por conquistas desbloqueadas
        EventBus.on("conquista:desbloqueada", ({ id } = {}) => {
            ganhar(25, `conquista:${id}`);
        });

        // XP por missão completa
        EventBus.on("missao:completa", ({ id, dificuldade = 1 } = {}) => {
            const xp = Math.floor(30 * dificuldade);
            ganhar(xp, `missao:${id}`);
        });

        // XP por prestígio
        EventBus.on("prestigio:feito", ({ total = 1 } = {}) => {
            ganhar(100 * total, "prestigio");
        });

        // Atualiza UI ao ganhar nível
        EventBus.on("nivel:up", ({ nivel: nv } = {}) => {
            // ui-hud.js e ui-battle.js escutam e atualizam ".santaLvUI"
        });

        // Reset total de save
        EventBus.on("state:reset:total", () => {
            resetar();
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Ação principal
        ganhar,

        // Leitura
        nivel,
        exp,
        expMax,
        expParaProximo,
        progresso,
        expTotal,

        // Bônus
        bonusDano,
        bonusDps,

        // Cálculo de XP por kill
        calcXpKill,

        // UI
        infoNivel,

        // Save/Load
        snapshot,
        carregar,
        resetar,

        // Diagnóstico
        logStatus,
        historico,

        // Referências (readonly)
        get MARCOS() { return _MARCOS; },
        get CFG()    { return CFG;     }
    });

})();
window.Experience = Experience;
