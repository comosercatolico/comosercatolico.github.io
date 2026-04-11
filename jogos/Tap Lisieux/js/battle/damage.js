// ═══════════════════════════════════════════════════════════
//  DAMAGE.JS
//  Sistema completo de cálculo e aplicação de dano.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, calcDanoClick() e calcDps() eram funções
//  soltas que somavam upgrades diretamente. Sem crítico, sem
//  combo, sem bônus de herói/arma, sem histórico, sem eventos
//  distintos por tipo de dano.
//
//  SOLUÇÃO:
//  Pipeline de dano completo e modular. Cada fonte de bônus
//  é aplicada em camadas independentes — fácil adicionar
//  novas fontes sem quebrar as existentes.
//
//  PIPELINE DE DANO (clique):
//  ┌─────────────────────────────────────────────────────┐
//  │ 1. Dano base      = forca.dano + rosa.dano          │
//  │ 2. × velocidade   = bonus de velocidade             │
//  │ 3. + arma         = dano flat da arma equipada      │
//  │ 4. × herói        = bonusClick do herói ativo       │
//  │ 5. × nível        = bonusDano de Experience         │
//  │ 6. × combo        = ComboSystem.multiplicador()     │
//  │ 7. × crítico      = 1.0 ou CRIT_MULT (chance%)      │
//  │ 8. × estagio      = escala suave por estágio        │
//  │ = DANO FINAL (floor)                                │
//  └─────────────────────────────────────────────────────┘
//
//  PIPELINE DE DPS:
//  ┌─────────────────────────────────────────────────────┐
//  │ 1. DPS base       = dps.valor                       │
//  │ 2. + arma DPS     = bonusDpsArma()                  │
//  │ 3. + herói DPS    = bonusDpsHerois()                │
//  │ 4. × nível        = bonusDps de Experience          │
//  │ 5. × estagio      = escala suave por estágio        │
//  │ = DPS FINAL (floor)                                 │
//  └─────────────────────────────────────────────────────┘
//
//  DANO CRÍTICO:
//  - Chance base: 5%
//  - Multiplicador: 2.5x
//  - Visual: texto dourado pulsante, shake especial
//  - Futuramente: upgrades que aumentam chance/mult
//
//  API:
//    Damage.calcClick()         → número (sem aplicar)
//    Damage.calcDps()           → número (sem aplicar)
//    Damage.calcBreakdown()     → todas as camadas detalhadas
//    Damage.aplicarClick()      → aplica no inimigo + efeitos
//    Damage.aplicarDps()        → aplica DPS tick
//    Damage.simular(fonte)      → simula sem aplicar (UI preview)
//    Damage.stats()             → estatísticas da sessão
//
//  Depende de: constants.js, upgrades.js, state.js,
//              event-bus.js, logger.js, enemy.js,
//              experience.js, combo.js, inventory.js
//  Usado por: battle.js, input.js, ui-battle.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Damage = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Damage"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Damage]",  ...a),
            error : (...a) => console.error("[Damage]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        // Crítico
        CRIT_CHANCE_BASE  : 0.05,    // 5% base
        CRIT_MULT_BASE    : 2.50,    // 2.5x dano
        CRIT_CHANCE_MAX   : 0.75,    // cap em 75%
        CRIT_MULT_MAX     : 10.0,    // cap em 10x

        // Escala por estágio (suaviza a progressão)
        ESTAGIO_ESCALA    : 0.002,   // +0.2% de dano por estágio
        ESTAGIO_CAP       : 2.0,     // cap em +100%

        // DPS tick
        DPS_INTERVALO_MS  : 1000,    // intervalo do tick de DPS

        // Histórico
        HISTORICO_MAX     : 200,

        // Dano mínimo garantido
        DANO_MIN          : 1
    });

    // ════════════════════════════════════════
    // BÔNUS EXTERNOS (upgrades via prestígio, etc.)
    // Outros módulos podem registrar bônus aqui
    // ════════════════════════════════════════

    // Array de funções () → { mult?, flat? }
    const _bonusExtras = [];

    /**
     * Registra um bônus externo que é aplicado em todo cálculo.
     * Útil para relíquias de prestígio, eventos, buffs temporários.
     *
     * @param {Function} fn — () => { mult?: number, flat?: number }
     * @returns {Function}    — cancelar o bônus
     *
     * @example
     * const cancelar = Damage.registrarBonus(() => ({ mult: 1.1 }));
     * cancelar(); // remove o bônus
     */
    function registrarBonus(fn) {
        if (typeof fn !== "function") {
            _log.warn("registrarBonus(): argumento deve ser função.");
            return () => {};
        }
        _bonusExtras.push(fn);
        _log.debug(`Bônus externo registrado. Total: ${_bonusExtras.length}`);
        return () => {
            const idx = _bonusExtras.indexOf(fn);
            if (idx >= 0) _bonusExtras.splice(idx, 1);
        };
    }

    // Soma todos os bônus externos
    function _calcBonusExtras() {
        let multTotal = 1.0;
        let flatTotal = 0;

        _bonusExtras.forEach(fn => {
            try {
                const b = fn();
                if (typeof b?.mult  === "number") multTotal *= b.mult;
                if (typeof b?.flat  === "number") flatTotal += b.flat;
            } catch (e) {
                _log.warn("Bônus externo lançou erro:", e);
            }
        });

        return { mult: multTotal, flat: flatTotal };
    }

    // ════════════════════════════════════════
    // HELPERS DE LEITURA SEGURA
    // Cada módulo pode não estar disponível
    // ════════════════════════════════════════

    function _upgradesDanoClick() {
        try   { return Upgrades.calcDanoClick(); }
        catch { return 1; }
    }

    function _upgradesDps() {
        try   { return Upgrades.calcDps(); }
        catch { return 0; }
    }

    function _inventoryBonus() {
        try   { return Inventory.bonusTotal(); }
        catch { return { danoArma: 0, dpsArma: 0, multClickHeroi: 1.0, dpsTotalBonus: 0 }; }
    }

    function _experienceBonusDano() {
        try   { return Experience.bonusDano(); }
        catch { return 1.0; }
    }

    function _experienceBonusDps() {
        try   { return Experience.bonusDps(); }
        catch { return 1.0; }
    }

    function _comboMult() {
        try   { return ComboSystem.multiplicador(); }
        catch { return 1.0; }
    }

    function _estagio() {
        try   { return Math.max(1, GameState.get("estagio") ?? 1); }
        catch { return 1; }
    }

    // Escala suave por estágio: 1.0 → CFG.ESTAGIO_CAP
    function _escalaEstagio() {
        const e = _estagio();
        return Math.min(CFG.ESTAGIO_CAP, 1 + e * CFG.ESTAGIO_ESCALA);
    }

    // ════════════════════════════════════════
    // CÁLCULO CRÍTICO
    // ════════════════════════════════════════

    // Modificadores de crítico externos (futura expansão)
    let _critChanceBonus = 0;
    let _critMultBonus   = 0;

    function _chanceCrit() {
        return Math.min(CFG.CRIT_CHANCE_MAX,
            CFG.CRIT_CHANCE_BASE + _critChanceBonus
        );
    }

    function _multCrit() {
        return Math.min(CFG.CRIT_MULT_MAX,
            CFG.CRIT_MULT_BASE + _critMultBonus
        );
    }

    function _rollarCrit() {
        return Math.random() < _chanceCrit();
    }

    // ════════════════════════════════════════
    // BREAKDOWN — todas as camadas
    // ════════════════════════════════════════

    /**
     * Retorna o detalhamento completo de todas as camadas de dano.
     * Usado por ui-battle.js para mostrar preview de dano.
     *
     * @param {"click"|"dps"} [fonte="click"]
     * @param {boolean}       [comCritico=false]
     * @returns {object}
     */
    function calcBreakdown(fonte = "click", comCritico = false) {
        const inv       = _inventoryBonus();
        const extras    = _calcBonusExtras();
        const escEstagio = _escalaEstagio();

        if (fonte === "click") {
            const danoUpgrade  = _upgradesDanoClick();     // forca+rosa × velocidade
            const danoArma     = inv.danoArma;             // flat da arma
            const danoBase     = danoUpgrade + danoArma;
            const multHeroi    = inv.multClickHeroi;       // x1.xx do herói
            const multNivel    = _experienceBonusDano();   // x1.xx por nível
            const multCombo    = _comboMult();             // x1.0 → x3.0
            const multEstagio  = escEstagio;
            const multExtras   = extras.mult;
            const flatExtras   = extras.flat;

            const semCrit = Math.max(CFG.DANO_MIN, Math.floor(
                (danoBase + flatExtras)
                * multHeroi
                * multNivel
                * multCombo
                * multEstagio
                * multExtras
            ));

            const critico    = comCritico || _rollarCrit();
            const multCritVal = critico ? _multCrit() : 1.0;
            const final      = Math.floor(semCrit * multCritVal);

            return {
                fonte        : "click",
                // Camadas individuais
                danoUpgrade,
                danoArma,
                danoBase,
                flatExtras,
                multHeroi,
                multNivel,
                multCombo,
                multEstagio,
                multExtras,
                // Crítico
                critico,
                chanceCrit   : _chanceCrit(),
                multCrit     : multCritVal,
                // Resultados
                semCrit,
                final,
                // Contexto
                estagio      : _estagio(),
                comboAtual   : (() => { try { return ComboSystem.combo(); } catch { return 0; } })()
            };
        }

        // DPS
        const dpsUpgrade = _upgradesDps();
        const dpsBonusInv = inv.dpsTotalBonus;
        const dpsBase    = dpsUpgrade + dpsBonusInv;
        const multNivel  = _experienceBonusDps();
        const multEstagio = escEstagio;
        const multExtras  = extras.mult;
        const flatExtras  = extras.flat;

        const final = Math.max(0, Math.floor(
            (dpsBase + flatExtras)
            * multNivel
            * multEstagio
            * multExtras
        ));

        return {
            fonte        : "dps",
            dpsUpgrade,
            dpsBonusInv,
            dpsBase,
            flatExtras,
            multNivel,
            multEstagio,
            multExtras,
            // DPS não tem crítico
            critico      : false,
            chanceCrit   : 0,
            multCrit     : 1.0,
            final,
            estagio      : _estagio()
        };
    }

    // ════════════════════════════════════════
    // CALCULAR (sem aplicar)
    // ════════════════════════════════════════

    /**
     * Calcula o dano de um clique sem aplicar.
     * O crítico é rolado internamente.
     *
     * @returns {number}
     */
    function calcClick() {
        return calcBreakdown("click").final;
    }

    /**
     * Calcula o DPS sem aplicar.
     * @returns {number}
     */
    function calcDps() {
        return calcBreakdown("dps").final;
    }

    /**
     * Simula dano sem rolar crítico (para preview de UI).
     * @param {"click"|"dps"} [fonte="click"]
     * @returns {object} breakdown com crítico = false
     */
    function simular(fonte = "click") {
        return calcBreakdown(fonte, false);
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS DA SESSÃO
    // ════════════════════════════════════════
    const _stats = {
        totalDanoClick  : 0,
        totalDanoDps    : 0,
        totalCliques    : 0,
        totalCrits      : 0,
        maiorDanoClick  : 0,
        maiorDanoDps    : 0,
        ultimoClick     : 0,
        ultimoDps       : 0
    };

    // ════════════════════════════════════════
    // HISTÓRICO (últimos N danos)
    // ════════════════════════════════════════
    const _historico = [];

    function _registrarHistorico(entrada) {
        _historico.push({ ...entrada, timestamp: Date.now() });
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();
    }

    // ════════════════════════════════════════
    // APLICAR CLIQUE
    // ════════════════════════════════════════

    /**
     * Calcula, aplica no inimigo e emite todos os efeitos de um clique.
     * Deve ser chamado por input.js em cada clique no canvas.
     *
     * @returns {{
     *   dano     : number,
     *   critico  : boolean,
     *   morreu   : boolean,
     *   breakdown: object
     * }}
     */
    function aplicarClick() {
        const emBatalha = (() => {
            try { return GameState.get("emBatalha"); } catch { return false; }
        })();

        if (!emBatalha) {
            return { dano: 0, critico: false, morreu: false, breakdown: null };
        }

        const bd     = calcBreakdown("click");
        const dano   = bd.final;
        const crit   = bd.critico;

        // Atualiza estatísticas
        _stats.totalDanoClick += dano;
        _stats.totalCliques++;
        if (crit) _stats.totalCrits++;
        if (dano > _stats.maiorDanoClick) _stats.maiorDanoClick = dano;
        _stats.ultimoClick = dano;

        _registrarHistorico({ fonte: "click", dano, critico: crit });

        // Aplica no inimigo
        let morreu = false;
        try {
            const resultado = Enemy.receberDano(dano);
            morreu = resultado.morreu;
        } catch (e) {
            _log.error("aplicarClick(): Enemy.receberDano falhou:", e);
            return { dano, critico: crit, morreu: false, breakdown: bd };
        }

        // Atualiza hitState para o renderer
        try {
            GameState.set("hitStateTremendo", 14);
            GameState.set("hitStateFlash",    crit ? 18 : 10);
        } catch { /* não crítico */ }

        // Emite eventos
        _emitirDano("click", dano, crit, morreu, bd);

        _log.debug(
            `Click: ${_fmt(dano)}${crit ? " 💥CRIT!" : ""}` +
            ` | Combo x${bd.comboAtual}` +
            ` | Mult x${bd.multCombo}`
        );

        return { dano, critico: crit, morreu, breakdown: bd };
    }

    // ════════════════════════════════════════
    // APLICAR DPS (tick automático)
    // ════════════════════════════════════════

    /**
     * Aplica um tick de DPS ao inimigo.
     * Deve ser chamado pelo setInterval em battle.js.
     *
     * @returns {{
     *   dano   : number,
     *   morreu : boolean
     * }}
     */
    function aplicarDps() {
        const emBatalha = (() => {
            try { return GameState.get("emBatalha"); } catch { return false; }
        })();

        if (!emBatalha) return { dano: 0, morreu: false };

        const bd   = calcBreakdown("dps");
        const dano = bd.final;

        if (dano <= 0) return { dano: 0, morreu: false };

        // Atualiza estatísticas
        _stats.totalDanoDps += dano;
        if (dano > _stats.maiorDanoDps) _stats.maiorDanoDps = dano;
        _stats.ultimoDps = dano;

        _registrarHistorico({ fonte: "dps", dano, critico: false });

        // Aplica no inimigo
        let morreu = false;
        try {
            const resultado = Enemy.receberDano(dano);
            morreu = resultado.morreu;
        } catch (e) {
            _log.error("aplicarDps(): Enemy.receberDano falhou:", e);
            return { dano, morreu: false };
        }

        // Emite eventos (sem shake de câmera para DPS)
        _emitirDano("dps", dano, false, morreu, bd);

        return { dano, morreu };
    }

    // ════════════════════════════════════════
    // EMITIR EVENTOS DE DANO
    // ════════════════════════════════════════
    function _emitirDano(fonte, dano, critico, morreu, bd) {
        try {
            // Evento genérico de dano
            EventBus.emit("damage:aplicado", {
                fonte,
                dano,
                critico,
                morreu,
                breakdown: bd
            });

            // Evento específico por fonte
            EventBus.emit(`damage:${fonte}`, { dano, critico, morreu });

            // Crítico — evento especial para efeitos visuais
            if (critico) {
                EventBus.emit("damage:critico", {
                    dano,
                    mult: bd.multCrit,
                    fonte
                });
            }

            // Texto flutuante
            EventBus.emit("effects:texto", {
                texto : _fmt(dano) + (critico ? "!" : ""),
                tipo  : critico ? "critico" : fonte,
                x     : null,  // renderer usa posição padrão do monstro
                y     : null
            });

        } catch (e) {
            _log.error("_emitirDano(): falha ao emitir eventos:", e);
        }
    }

    // ════════════════════════════════════════
    // MODIFICADORES EXTERNOS
    // Para upgrades futuros de crítico
    // ════════════════════════════════════════

    /**
     * Adiciona bônus à chance de crítico.
     * @param {number} bonus — ex: 0.10 = +10%
     */
    function addBonusCritChance(bonus) {
        _critChanceBonus = Math.max(0, _critChanceBonus + bonus);
        _log.info(`Chance crit: ${Math.round(_chanceCrit() * 100)}%`);
    }

    /**
     * Adiciona bônus ao multiplicador de crítico.
     * @param {number} bonus — ex: 0.5 = +0.5x
     */
    function addBonusCritMult(bonus) {
        _critMultBonus = Math.max(0, _critMultBonus + bonus);
        _log.info(`Mult crit: x${_multCrit()}`);
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS E DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas de dano da sessão.
     */
    function stats() {
        const taxaCrit = _stats.totalCliques > 0
            ? ((_stats.totalCrits / _stats.totalCliques) * 100).toFixed(1) + "%"
            : "0%";

        return {
            totalDanoClick  : _stats.totalDanoClick,
            totalDanoDps    : _stats.totalDanoDps,
            totalDano       : _stats.totalDanoClick + _stats.totalDanoDps,
            totalCliques    : _stats.totalCliques,
            totalCrits      : _stats.totalCrits,
            taxaCrit,
            maiorDanoClick  : _stats.maiorDanoClick,
            maiorDanoDps    : _stats.maiorDanoDps,
            ultimoClick     : _stats.ultimoClick,
            ultimoDps       : _stats.ultimoDps,
            // Valores atuais
            dpsAtual        : calcDps(),
            danoPorClickAtual: simular("click").semCrit,
            chanceCrit      : Math.round(_chanceCrit() * 100) + "%",
            multCrit        : `x${_multCrit()}`
        };
    }

    /**
     * Retorna histórico de danos.
     * @param {number} [ultimos]
     * @returns {Array}
     */
    function historico(ultimos) {
        const h = [..._historico];
        return ultimos ? h.slice(-ultimos) : h;
    }

    /**
     * Loga breakdown completo no console (só dev).
     */
    function logBreakdown() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Damage — Breakdown Atual", () => {
            const click = simular("click");
            const dps   = simular("dps");

            _log.debug("── CLIQUE ──────────────────────");
            _log.debug(`Base (upgrades)   : ${_fmt(click.danoUpgrade)}`);
            _log.debug(`+ Arma            : ${_fmt(click.danoArma)}`);
            _log.debug(`× Herói           : x${click.multHeroi}`);
            _log.debug(`× Nível           : x${click.multNivel}`);
            _log.debug(`× Combo           : x${click.multCombo}`);
            _log.debug(`× Estágio         : x${click.multEstagio.toFixed(3)}`);
            _log.debug(`× Extras          : x${click.multExtras}`);
            _log.debug(`= Sem crítico     : ${_fmt(click.semCrit)}`);
            _log.debug(`× Crítico (${Math.round(_chanceCrit()*100)}%) : x${_multCrit()}`);
            _log.debug(`= Com crítico     : ${_fmt(Math.floor(click.semCrit * _multCrit()))}`);
            _log.debug("");
            _log.debug("── DPS ──────────────────────────");
            _log.debug(`Base (upgrades)   : ${_fmt(dps.dpsUpgrade)}`);
            _log.debug(`+ Inventário      : ${_fmt(dps.dpsBonusInv)}`);
            _log.debug(`× Nível           : x${dps.multNivel}`);
            _log.debug(`× Estágio         : x${dps.multEstagio.toFixed(3)}`);
            _log.debug(`= DPS final       : ${_fmt(dps.final)}/s`);
        }, true);
    }

    // ════════════════════════════════════════
    // UTILITÁRIOS INTERNOS
    // ════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
            if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
            if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
            if (n >= 1e3)  return (n / 1e3).toFixed(1)  + "K";
            return String(Math.floor(n ?? 0));
        }
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        // Reset de stats ao sair da batalha
        EventBus.on("batalha:saiu", () => {
            _stats.totalDanoClick = 0;
            _stats.totalDanoDps   = 0;
            _stats.totalCliques   = 0;
            _stats.totalCrits     = 0;
            _historico.length     = 0;
            _log.debug("Stats de dano resetadas.");
        });

        // Bônus de crítico via prestígio (exemplo)
        EventBus.on("prestigio:feito", ({ total = 1 } = {}) => {
            addBonusCritChance(0.005 * total); // +0.5% por prestígio
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Cálculo (sem aplicar)
        calcClick,
        calcDps,
        calcBreakdown,
        simular,

        // Aplicação
        aplicarClick,
        aplicarDps,

        // Bônus externos
        registrarBonus,
        addBonusCritChance,
        addBonusCritMult,

        // Diagnóstico
        stats,
        historico,
        logBreakdown,

        // Config (readonly)
        get CFG()          { return CFG;          },
        get chanceCrit()   { return _chanceCrit(); },
        get multCrit()     { return _multCrit();   }
    });

})();
window.Damage = Damage;
