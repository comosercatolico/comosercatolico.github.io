// ═══════════════════════════════════════════════════════════
//  UPGRADES.JS
//  Sistema completo de upgrades do jogo.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, os upgrades eram objetos soltos com
//  getters espalhados, sem validação, sem eventos, sem
//  histórico. "comprarUpgrade(tipo)" vivia em game-batalha.js
//  misturado com lógica de renderização.
//
//  SOLUÇÃO:
//  Sistema centralizado com definição declarativa de upgrades.
//  Fácil adicionar novos upgrades sem tocar em lógica existente.
//
//  UPGRADES ATUAIS:
//  ┌─────────────┬──────────────────────────────────────────┐
//  │ forca       │ +dano por toque (base 5, x1.50/nível)   │
//  │ rosa        │ +dano por toque (base 3, x1.40/nível)   │
//  │ velocidade  │ multiplicador de dano (base 1.0, x1.10) │
//  │ dps         │ dano por segundo (base 2, x1.60/nível)  │
//  └─────────────┴──────────────────────────────────────────┘
//
//  FÓRMULAS:
//  - Dano    = base × mult^(nivel-1)
//  - Custo   = custoBase × custoMult^(nivel-1)
//  - DanoTotal clique = (forca.dano + rosa.dano) × velocidade.bonus
//  - DPS total = dps.valor + bônus de heróis equipados
//
//  COMPRA EM LOTE:
//  - Comprar x1, x10, x25, x100, "max" (tudo que puder)
//
//  API:
//    Upgrades.comprar(tipo, qtd)      → boolean
//    Upgrades.calcDanoClick()         → number
//    Upgrades.calcDps()               → number
//    Upgrades.info(tipo)              → objeto com tudo
//    Upgrades.custoLote(tipo, qtd)    → number
//    Upgrades.maxCompravel(tipo)      → number
//    Upgrades.resetar()               → volta tudo ao nível 1
//    Upgrades.carregar(dados)         → restaura do save
//    Upgrades.snapshot()              → para o save
//
//  Depende de: constants.js, economy.js, event-bus.js,
//              state.js, logger.js
//  Usado por: battle.js, damage.js, ui-upgrades.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Upgrades = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Upgrades"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Upgrades]",  ...a),
            error : (...a) => console.error("[Upgrades]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // DEFINIÇÃO DECLARATIVA DOS UPGRADES
    // Adicionar novo upgrade = adicionar entrada aqui
    // ════════════════════════════════════════

    /**
     * @typedef {object} UpgradeDef
     * @property {string}   id          — chave única
     * @property {string}   nome        — nome exibido na UI
     * @property {string}   desc        — descrição curta
     * @property {string}   emoji       — ícone
     * @property {string}   tipo        — "dano_click"|"multiplicador"|"dps"|"util"
     * @property {number}   base        — valor base (nível 1)
     * @property {number}   mult        — multiplicador por nível
     * @property {number}   custoBase   — custo no nível 1
     * @property {number}   custoMult   — crescimento de custo
     * @property {number}   nivelMax    — nível máximo (0 = sem limite)
     * @property {string}   chaveState  — chave no GameState
     * @property {Function} calcValor   — (def, nivel) → valor do bônus
     * @property {Function} descNivel   — (def, nivel) → string para UI
     */
    const _DEFS = Object.freeze([
        {
            id         : "forca",
            nome       : "Força de Ataque",
            desc       : "Aumenta o dano base por toque",
            emoji      : "⚔️",
            tipo       : "dano_click",
            base       : 5,
            mult       : 1.50,
            custoBase  : 15,
            custoMult  : 1.60,
            nivelMax   : 0,
            chaveState : "nivelForca",
            calcValor  : (def, nivel) =>
                Math.floor(def.base * Math.pow(def.mult, nivel - 1)),
            descNivel  : (def, nivel) => {
                const val = Math.floor(def.base * Math.pow(def.mult, nivel - 1));
                return `Nv.${nivel} · +${_fmt(val)} dano/toque`;
            }
        },
        {
            id         : "rosa",
            nome       : "Poder das Rosas",
            desc       : "Bênção das rosas sagradas aumenta o toque",
            emoji      : "🌹",
            tipo       : "dano_click",
            base       : 3,
            mult       : 1.40,
            custoBase  : 20,
            custoMult  : 1.65,
            nivelMax   : 0,
            chaveState : "nivelRosa",
            calcValor  : (def, nivel) =>
                Math.floor(def.base * Math.pow(def.mult, nivel - 1)),
            descNivel  : (def, nivel) => {
                const val = Math.floor(def.base * Math.pow(def.mult, nivel - 1));
                return `Nv.${nivel} · +${_fmt(val)} dano/toque`;
            }
        },
        {
            id         : "velocidade",
            nome       : "Rapidez Celestial",
            desc       : "Multiplica todo o dano de toque",
            emoji      : "⚡",
            tipo       : "multiplicador",
            base       : 1.0,
            mult       : 1.10,
            custoBase  : 30,
            custoMult  : 1.70,
            nivelMax   : 0,
            chaveState : "nivelVelocidade",
            calcValor  : (def, nivel) =>
                parseFloat((def.base * Math.pow(def.mult, nivel - 1)).toFixed(2)),
            descNivel  : (def, nivel) => {
                const val = parseFloat(
                    (def.base * Math.pow(def.mult, nivel - 1)).toFixed(2)
                );
                return `Nv.${nivel} · x${val} velocidade`;
            }
        },
        {
            id         : "dps",
            nome       : "Fé Passiva",
            desc       : "Dano automático por segundo (DPS)",
            emoji      : "🙏",
            tipo       : "dps",
            base       : 2,
            mult       : 1.60,
            custoBase  : 25,
            custoMult  : 1.70,
            nivelMax   : 0,
            chaveState : "nivelDps",
            calcValor  : (def, nivel) =>
                Math.floor(def.base * Math.pow(def.mult, nivel - 1)),
            descNivel  : (def, nivel) => {
                const val = Math.floor(def.base * Math.pow(def.mult, nivel - 1));
                return `Nv.${nivel} · +${_fmt(val)} DPS`;
            }
        }
    ]);

    // Mapa rápido: id → definição
    const _MAPA = new Map(_DEFS.map(d => [d.id, d]));

    // ════════════════════════════════════════
    // LEITURA DE NÍVEL DO GameState
    // ════════════════════════════════════════
    function _nivel(def) {
        try   { return Math.max(1, GameState.get(def.chaveState) ?? 1); }
        catch { return 1; }
    }

    function _setNivel(def, nivel) {
        try { GameState.set(def.chaveState, Math.max(1, nivel)); }
        catch (e) { _log.error(`_setNivel(${def.id}): GameState falhou:`, e); }
    }

    // ════════════════════════════════════════
    // CÁLCULO DE CUSTO
    // ════════════════════════════════════════

    /**
     * Custo de um nível específico de um upgrade.
     * @param {UpgradeDef} def
     * @param {number}     nivel
     * @returns {number}
     */
    function _custoPorNivel(def, nivel) {
        return Math.floor(def.custoBase * Math.pow(def.custoMult, nivel - 1));
    }

    /**
     * Custo total para comprar `qtd` níveis a partir do nível atual.
     *
     * @param {string} id  — ex: "forca"
     * @param {number} qtd — quantidade de níveis a comprar
     * @returns {number}   — custo total, ou Infinity se inválido
     */
    function custoLote(id, qtd = 1) {
        const def = _MAPA.get(id);
        if (!def) {
            _log.warn(`custoLote("${id}"): upgrade não encontrado.`);
            return Infinity;
        }
        if (qtd <= 0) return 0;

        const nivelAtual = _nivel(def);
        let total = 0;

        for (let i = 0; i < qtd; i++) {
            const n = nivelAtual + i;
            // Respeita nivelMax
            if (def.nivelMax > 0 && n >= def.nivelMax) break;
            total += _custoPorNivel(def, n);
        }

        return total;
    }

    /**
     * Quantos níveis o jogador pode comprar agora com o saldo atual.
     *
     * @param {string} id
     * @returns {number}
     */
    function maxCompravel(id) {
        const def = _MAPA.get(id);
        if (!def) return 0;

        let saldo;
        try   { saldo = Economy.saldo("moeda"); }
        catch { return 0; }

        const nivelAtual = _nivel(def);
        let qtd   = 0;
        let gasto = 0;

        while (true) {
            const n = nivelAtual + qtd;
            if (def.nivelMax > 0 && n >= def.nivelMax) break;

            const custo = _custoPorNivel(def, n);
            if (gasto + custo > saldo) break;

            gasto += custo;
            qtd++;

            // Segurança: não calcular mais de 10.000 níveis
            if (qtd >= 10_000) break;
        }

        return qtd;
    }

    // ════════════════════════════════════════
    // COMPRAR
    // ════════════════════════════════════════

    /**
     * Compra um ou mais níveis de um upgrade.
     *
     * @param {string}          id
     * @param {number|"max"}    [qtd=1] — quantidade ou "max"
     * @returns {boolean}               — true se comprou pelo menos 1
     *
     * @example
     * Upgrades.comprar("forca");          // compra 1 nível
     * Upgrades.comprar("dps", 10);        // compra 10 níveis
     * Upgrades.comprar("rosa", "max");    // compra tudo que puder
     */
    function comprar(id, qtd = 1) {
        const def = _MAPA.get(id);
        if (!def) {
            _log.warn(`comprar("${id}"): upgrade não encontrado.`);
            return false;
        }

        // Resolve "max"
        const qtdReal = qtd === "max" ? maxCompravel(id) : Number(qtd);

        if (!Number.isInteger(qtdReal) || qtdReal <= 0) {
            _log.warn(`comprar("${id}"): quantidade inválida: ${qtd}`);
            return false;
        }

        const nivelAtual = _nivel(def);

        // Verifica nivelMax
        if (def.nivelMax > 0 && nivelAtual >= def.nivelMax) {
            _log.info(`comprar("${id}"): já está no nível máximo (${def.nivelMax}).`);
            return false;
        }

        // Calcula custo real (pode ser menos que qtdReal se bater no nivelMax)
        let custoTotal = 0;
        let qtdPossivel = 0;

        for (let i = 0; i < qtdReal; i++) {
            const n = nivelAtual + i;
            if (def.nivelMax > 0 && n >= def.nivelMax) break;
            custoTotal  += _custoPorNivel(def, n);
            qtdPossivel++;
        }

        if (qtdPossivel === 0) return false;

        // Tenta gastar via Economy
        const gastou = (() => {
            try {
                return Economy.gastar("moeda", custoTotal, `upgrade:${id}:x${qtdPossivel}`);
            } catch (e) {
                _log.error(`comprar(): Economy.gastar falhou:`, e);
                return false;
            }
        })();

        if (!gastou) {
            _log.debug(
                `comprar("${id}" x${qtdPossivel}):` +
                ` saldo insuficiente. Custo: ${_fmt(custoTotal)}`
            );
            return false;
        }

        // Aplica os novos níveis
        const novoNivel = nivelAtual + qtdPossivel;
        _setNivel(def, novoNivel);

        // Incrementa contador global de upgrades
        try { GameState.increment("totalUpgrades", qtdPossivel); } catch { /* não crítico */ }

        _log.info(
            `${def.emoji} ${def.nome}: Nv.${nivelAtual} → Nv.${novoNivel}` +
            ` (x${qtdPossivel}) | Custo: ${_fmt(custoTotal)} 🪙`
        );

        // Emite evento
        try {
            EventBus.emit("upgrade:comprado", {
                id,
                nivelAnterior : nivelAtual,
                nivelNovo     : novoNivel,
                qtd           : qtdPossivel,
                custo         : custoTotal
            });
        } catch (e) {
            _log.error("comprar(): falha ao emitir evento:", e);
        }

        return true;
    }

    // ════════════════════════════════════════
    // INFO — snapshot completo de um upgrade
    // ════════════════════════════════════════

    /**
     * Retorna todas as informações de um upgrade para a UI.
     *
     * @param {string} id
     * @returns {{
     *   id, nome, desc, emoji, tipo,
     *   nivel, nivelMax,
     *   valor, valorProximo,
     *   custo, custoLote10, custoLote25, custoMax,
     *   podePagar, podePagar10,
     *   descNivel, descProximo
     * }}
     */
    function info(id) {
        const def = _MAPA.get(id);
        if (!def) {
            _log.warn(`info("${id}"): upgrade não encontrado.`);
            return null;
        }

        const nivel      = _nivel(def);
        const valor      = def.calcValor(def, nivel);
        const valorProx  = def.calcValor(def, nivel + 1);
        const custo      = _custoPorNivel(def, nivel);
        const cLote10    = custoLote(id, 10);
        const cLote25    = custoLote(id, 25);
        const cMax       = custoLote(id, maxCompravel(id));

        let saldoMoeda = 0;
        try { saldoMoeda = Economy.saldo("moeda"); } catch { /* não crítico */ }

        const maxAtual   = def.nivelMax > 0 && nivel >= def.nivelMax;

        return {
            id,
            nome         : def.nome,
            desc         : def.desc,
            emoji        : def.emoji,
            tipo         : def.tipo,

            nivel,
            nivelMax     : def.nivelMax,
            noMaximo     : maxAtual,

            valor,
            valorProximo : valorProx,
            ganhoProximo : valorProx - valor,

            custo,
            custoLote10  : cLote10,
            custoLote25  : cLote25,
            custoMax     : cMax,
            maxCompravel : maxCompravel(id),

            podePagar    : !maxAtual && saldoMoeda >= custo,
            podePagar10  : !maxAtual && saldoMoeda >= cLote10,
            podePagar25  : !maxAtual && saldoMoeda >= cLote25,

            descNivel    : def.descNivel(def, nivel),
            descProximo  : def.descNivel(def, nivel + 1)
        };
    }

    /**
     * Retorna info de todos os upgrades.
     * @returns {Array}
     */
    function infoTodos() {
        return _DEFS.map(def => info(def.id));
    }

    // ════════════════════════════════════════
    // CÁLCULOS DE COMBATE
    // Usados por damage.js e ui-battle.js
    // ════════════════════════════════════════

    /**
     * Dano total por clique.
     * (forca.valor + rosa.valor) × velocidade.bonus
     *
     * @returns {number}
     */
    function calcDanoClick() {
        const defForca = _MAPA.get("forca");
        const defRosa  = _MAPA.get("rosa");
        const defVel   = _MAPA.get("velocidade");

        const danoBase = defForca.calcValor(defForca, _nivel(defForca))
                       + defRosa.calcValor(defRosa,   _nivel(defRosa));

        const bonus    = defVel.calcValor(defVel, _nivel(defVel));

        return Math.floor(danoBase * bonus);
    }

    /**
     * DPS total (dano por segundo automático).
     *
     * @returns {number}
     */
    function calcDps() {
        const defDps = _MAPA.get("dps");
        return defDps.calcValor(defDps, _nivel(defDps));
    }

    /**
     * Dano total por clique COM bônus de item equipado.
     * Delegado ao Inventory se disponível.
     *
     * @returns {number}
     */
    function calcDanoClickTotal() {
        const base = calcDanoClick();
        let bonus  = 0;

        try { bonus = Inventory.bonusEquipado() ?? 0; } catch { /* não disponível */ }

        return base + bonus;
    }

    /**
     * DPS total COM bônus de heróis.
     * @returns {number}
     */
    function calcDpsTotal() {
        const base = calcDps();
        let bonus  = 0;

        try { bonus = Inventory.bonusDpsHerois() ?? 0; } catch { /* não disponível */ }

        return base + bonus;
    }

    // ════════════════════════════════════════
    // VALOR DIRETO DE UM UPGRADE
    // ════════════════════════════════════════

    /**
     * Retorna o valor atual de bônus de um upgrade.
     *
     * @param {string} id
     * @returns {number}
     *
     * @example
     * Upgrades.valor("forca")      // ex: 45 (dano base)
     * Upgrades.valor("velocidade") // ex: 2.14 (multiplicador)
     * Upgrades.valor("dps")        // ex: 128 (dps)
     */
    function valor(id) {
        const def = _MAPA.get(id);
        if (!def) { _log.warn(`valor("${id}"): upgrade não encontrado.`); return 0; }
        return def.calcValor(def, _nivel(def));
    }

    /**
     * Retorna o nível atual de um upgrade.
     * @param {string} id
     * @returns {number}
     */
    function nivel(id) {
        const def = _MAPA.get(id);
        if (!def) { _log.warn(`nivel("${id}"): upgrade não encontrado.`); return 1; }
        return _nivel(def);
    }

    // ════════════════════════════════════════
    // RESET (prestígio)
    // ════════════════════════════════════════

    /**
     * Reseta todos os upgrades para o nível 1.
     * Chamado pelo Prestige.js.
     */
    function resetar() {
        _DEFS.forEach(def => _setNivel(def, 1));
        _log.info("Todos os upgrades resetados para Nv.1.");

        try {
            EventBus.emit("upgrades:resetados");
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════

    /**
     * Retorna snapshot dos níveis para o SaveSystem.
     * @returns {object} — { forca: 5, rosa: 3, ... }
     */
    function snapshot() {
        const dados = {};
        _DEFS.forEach(def => {
            dados[def.id] = _nivel(def);
        });
        return dados;
    }

    /**
     * Restaura níveis de um save.
     * @param {object} dados — { forca: 5, rosa: 3, ... }
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.warn("carregar(): dados inválidos.");
            return;
        }

        let restaurados = 0;

        _DEFS.forEach(def => {
            const nivel = dados[def.id];
            if (typeof nivel === "number" && nivel >= 1) {
                const nivelValido = def.nivelMax > 0
                    ? Math.min(nivel, def.nivelMax)
                    : nivel;
                _setNivel(def, nivelValido);
                restaurados++;
            }
        });

        _log.debug(`carregar(): ${restaurados} upgrade(s) restaurados.`);
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Loga o estado atual de todos os upgrades.
     */
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Upgrades — Status Atual", () => {
            _DEFS.forEach(def => {
                const n   = _nivel(def);
                const val = def.calcValor(def, n);
                const c   = _custoPorNivel(def, n);
                _log.debug(
                    `${def.emoji} ${def.nome.padEnd(20)}` +
                    ` Nv.${String(n).padStart(4)}` +
                    ` | Valor: ${_fmt(val).padStart(10)}` +
                    ` | Próximo: ${_fmt(c).padStart(10)} 🪙`
                );
            });

            _log.debug(`📊 Dano/Clique: ${_fmt(calcDanoClick())}`);
            _log.debug(`📊 DPS        : ${_fmt(calcDps())}`);
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        // UI reage automaticamente quando upgrade é comprado
        EventBus.on("upgrade:comprado", () => {
            // ui-upgrades.js escuta esse evento e se atualiza
        });

        // Reset no prestígio
        EventBus.on("prestigio:feito", () => {
            resetar();
        });

        // Restaurar do save
        EventBus.on("state:carregado", (snapshot) => {
            // O save.js chama carregar() diretamente
            // Este listener é para upgrades futuros via EventBus
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
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
            return String(Math.floor(n));
        }
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Compra
        comprar,

        // Custo e capacidade
        custoLote,
        maxCompravel,

        // Informações para UI
        info,
        infoTodos,
        valor,
        nivel,

        // Cálculos de combate
        calcDanoClick,
        calcDps,
        calcDanoClickTotal,
        calcDpsTotal,

        // Save/Load
        snapshot,
        carregar,
        resetar,

        // Diagnóstico
        logStatus,

        // Lista de definições (somente leitura)
        get DEFS() { return _DEFS; },
        get IDS()  { return _DEFS.map(d => d.id); }
    });

})();
window.Upgrades = Upgrades;
