// ═══════════════════════════════════════════════════════════
//  INVENTORY.JS
//  Sistema completo de inventário do jogador.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, "heroisObtidos" e "equipamentosObtidos"
//  eram arrays soltos em game-ui.js. "itemEquipado" era uma
//  variável global. Sem duplicatas controladas, sem stack,
//  sem bônus calculados, sem ordenação, sem save estruturado.
//
//  SOLUÇÃO:
//  Inventário centralizado com slots de equipamento,
//  sistema de duplicatas (fragmentos → upgrade), bônus
//  calculados de heróis e armas, e API completa para UI.
//
//  ESTRUTURA:
//  ┌─────────────────────────────────────────────────────┐
//  │  HERÓIS (até MAX_HEROIS slots)                      │
//  │  - Cada herói tem quantidade (duplicatas = fracos)  │
//  │  - Herói ativo contribui bonusClick e bonusDps      │
//  │  - Futuramente: equipe de 3 heróis                 │
//  ├─────────────────────────────────────────────────────┤
//  │  ARMAS (slots ilimitados, 1 equipada por vez)       │
//  │  - Item equipado contribui dano e bonusDps          │
//  │  - Ordenação automática por poder                   │
//  └─────────────────────────────────────────────────────┘
//
//  DUPLICATAS:
//  - Herói duplicado → +1 fragmento (mostra "x2", "x3")
//  - Arma duplicada  → +1 ao dano (+10% por cópia extra)
//
//  BÔNUS CALCULADOS:
//  - bonusEquipado()    → dano da arma equipada
//  - bonusDpsArma()     → DPS da arma equipada
//  - bonusDpsHerois()   → DPS total dos heróis
//  - bonusClickHerois() → mult. de clique dos heróis
//  - bonusTotal()       → objeto com todos os bônus
//
//  API:
//    Inventory.adicionar(item)          → resultado da adição
//    Inventory.equiparArma(id)          → boolean
//    Inventory.equiparHeroi(id)         → boolean
//    Inventory.removerArma(id)          → boolean
//    Inventory.herois()                 → lista com stacks
//    Inventory.armas()                  → lista ordenada
//    Inventory.armaEquipada()           → item ou null
//    Inventory.heroiAtivo()             → herói ou null
//    Inventory.bonusTotal()             → todos os bônus
//    Inventory.ordenar(tipo, criterio)  → lista ordenada
//    Inventory.snapshot()               → para save
//    Inventory.carregar(dados)          → restaura do save
//
//  Depende de: constants.js, event-bus.js, state.js,
//              logger.js, gacha-pool.js
//  Usado por: gacha.js, ui-gacha.js, damage.js, ui-upgrades.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Inventory = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Inventory"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Inventory]",  ...a),
            error : (...a) => console.error("[Inventory]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        MAX_HEROIS          : 50,    // slots máximos de heróis únicos
        MAX_ARMAS           : 200,   // slots máximos de armas
        MAX_STACK           : 99,    // máximo de duplicatas por item
        BONUS_DUPL_ARMA_PCT : 0.10,  // +10% de dano por duplicata de arma
        BONUS_DUPL_HEROI_PCT: 0.05,  // +5% de bonusClick por duplicata de herói
        PESO_RARIDADE: Object.freeze({
            "Lendário" : 4,
            "Épico"    : 3,
            "Raro"     : 2,
            "Comum"    : 1
        })
    });

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════

    /**
     * @typedef {object} SlotHeroi
     * @property {object} item       — dados completos do herói (do GachaPool)
     * @property {number} quantidade — 1 = único, 2+ = duplicatas
     * @property {string} obtidoEm   — ISO timestamp
     */

    /**
     * @typedef {object} SlotArma
     * @property {object} item
     * @property {number} quantidade
     * @property {string} obtidoEm
     * @property {number} danoReal   — dano base × bônus de duplicatas
     */

    // Mapas por ID do item: id → SlotHeroi/SlotArma
    const _herois = new Map();
    const _armas  = new Map();

    // IDs dos itens selecionados
    let _armaEquipadaId  = null;
    let _heroiAtivoId    = null;

    // Estatísticas de aquisição
    const _stats = {
        totalObtidos    : 0,
        totalDuplicatas : 0,
        porRaridade     : { "Comum": 0, "Raro": 0, "Épico": 0, "Lendário": 0 }
    };

    // ════════════════════════════════════════
    // ADICIONAR ITEM AO INVENTÁRIO
    // ════════════════════════════════════════

    /**
     * Adiciona um item ao inventário após um pull do gacha.
     * Gerencia duplicatas automaticamente.
     *
     * @param {object} item — item vindo do GachaPool
     * @returns {{
     *   adicionado : boolean,
     *   duplicata  : boolean,
     *   stackAntes : number,
     *   stackDepois: number,
     *   bonus      : string,   — descrição do bônus ganho
     *   cheio      : boolean   — inventário cheio?
     * }}
     */
    function adicionar(item) {
        if (!item || !item.id || !item.tipo) {
            _log.error("adicionar(): item inválido:", item);
            return _resultadoAdicao(false);
        }

        const tipo = item.tipo; // "heroi" | "arma"

        if (tipo === "heroi")  return _adicionarHeroi(item);
        if (tipo === "arma")   return _adicionarArma(item);

        _log.warn(`adicionar(): tipo desconhecido "${tipo}".`);
        return _resultadoAdicao(false);
    }

    // ── Adicionar herói ──
    function _adicionarHeroi(item) {
        const existente = _herois.get(item.id);

        if (existente) {
            // Duplicata
            if (existente.quantidade >= CFG.MAX_STACK) {
                _log.debug(`Herói "${item.nome}" já no stack máximo (${CFG.MAX_STACK}).`);
                return _resultadoAdicao(true, true, existente.quantidade, existente.quantidade, "Stack máximo", false);
            }

            const stackAntes  = existente.quantidade;
            existente.quantidade++;
            _stats.totalDuplicatas++;

            const bonusPct = Math.round(CFG.BONUS_DUPL_HEROI_PCT * 100);
            const bonus    = `+${bonusPct}% bonusClick (duplicata ${existente.quantidade}x)`;

            _log.info(`Herói duplicado: "${item.nome}" (x${existente.quantidade})`);
            _emitirAdicao(item, true, existente.quantidade);

            return _resultadoAdicao(true, true, stackAntes, existente.quantidade, bonus);
        }

        // Novo herói
        if (_herois.size >= CFG.MAX_HEROIS) {
            _log.warn(`Inventário de heróis cheio! (${CFG.MAX_HEROIS} máx.)`);
            return _resultadoAdicao(true, false, 0, 0, "", true);
        }

        _herois.set(item.id, {
            item,
            quantidade : 1,
            obtidoEm   : new Date().toISOString()
        });

        _atualizarStats(item, false);
        _log.info(`Novo herói: "${item.nome}" (${item.raridade})`);
        _emitirAdicao(item, false, 1);

        // Auto-equipar se for o primeiro herói
        if (_heroiAtivoId === null) {
            equiparHeroi(item.id);
        }

        return _resultadoAdicao(true, false, 0, 1, "Herói desbloqueado!");
    }

    // ── Adicionar arma ──
    function _adicionarArma(item) {
        const existente = _armas.get(item.id);

        if (existente) {
            // Duplicata — aumenta dano real
            if (existente.quantidade >= CFG.MAX_STACK) {
                return _resultadoAdicao(true, true, existente.quantidade, existente.quantidade, "Stack máximo", false);
            }

            const stackAntes  = existente.quantidade;
            existente.quantidade++;
            existente.danoReal = _calcDanoReal(item.dano ?? 0, existente.quantidade);
            _stats.totalDuplicatas++;

            const bonusExtra = Math.round((existente.danoReal - (item.dano ?? 0)));
            const bonus      = `+${bonusExtra} dano (duplicata ${existente.quantidade}x)`;

            _log.info(`Arma duplicada: "${item.nome}" → ${existente.danoReal} dano`);
            _emitirAdicao(item, true, existente.quantidade);

            // Atualiza bônus se essa arma estiver equipada
            if (_armaEquipadaId === item.id) {
                _emitirBonusUpdate();
            }

            return _resultadoAdicao(true, true, stackAntes, existente.quantidade, bonus);
        }

        // Nova arma
        if (_armas.size >= CFG.MAX_ARMAS) {
            _log.warn(`Inventário de armas cheio! (${CFG.MAX_ARMAS} máx.)`);
            return _resultadoAdicao(true, false, 0, 0, "", true);
        }

        const danoReal = _calcDanoReal(item.dano ?? 0, 1);

        _armas.set(item.id, {
            item,
            quantidade : 1,
            danoReal,
            obtidoEm   : new Date().toISOString()
        });

        _atualizarStats(item, false);
        _log.info(`Nova arma: "${item.nome}" (${item.raridade}) — ${danoReal} dano`);
        _emitirAdicao(item, false, 1);

        // Auto-equipar se for melhor que a atual
        _autoEquiparMelhorArma();

        return _resultadoAdicao(true, false, 0, 1, `${danoReal} dano desbloqueado!`);
    }

    // ── Calcula dano real com bônus de duplicatas ──
    function _calcDanoReal(danoBase, quantidade) {
        const bonus = 1 + (quantidade - 1) * CFG.BONUS_DUPL_ARMA_PCT;
        return Math.floor(danoBase * bonus);
    }

    // ── Auto-equipar melhor arma ──
    function _autoEquiparMelhorArma() {
        if (_armaEquipadaId !== null) return; // já tem arma equipada

        const melhor = _melhorArma();
        if (melhor) {
            equiparArma(melhor.item.id);
        }
    }

    function _melhorArma() {
        let melhor = null;
        let melhorDano = -1;

        _armas.forEach(slot => {
            if (slot.danoReal > melhorDano) {
                melhorDano = slot.danoReal;
                melhor     = slot;
            }
        });

        return melhor;
    }

    // ── Objeto de resultado padronizado ──
    function _resultadoAdicao(
        adicionado  = false,
        duplicata   = false,
        stackAntes  = 0,
        stackDepois = 0,
        bonus       = "",
        cheio       = false
    ) {
        return { adicionado, duplicata, stackAntes, stackDepois, bonus, cheio };
    }

    // ── Atualiza estatísticas globais ──
    function _atualizarStats(item, duplicata) {
        _stats.totalObtidos++;
        if (duplicata) _stats.totalDuplicatas++;
        if (_stats.porRaridade[item.raridade] !== undefined) {
            _stats.porRaridade[item.raridade]++;
        }
    }

    // ── Emite evento de adição ──
    function _emitirAdicao(item, duplicata, quantidade) {
        try {
            EventBus.emit("inventory:adicionado", { item, duplicata, quantidade });

            if (item.raridade === "Lendário") {
                EventBus.emit("gacha:pull:lendario", { item });
            }
        } catch { /* não crítico */ }
    }

    // ── Emite evento de atualização de bônus ──
    function _emitirBonusUpdate() {
        try {
            EventBus.emit("inventory:bonus_update", bonusTotal());
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // EQUIPAR ARMA
    // ════════════════════════════════════════

    /**
     * Equipa uma arma do inventário.
     *
     * @param {string} id — ID da arma
     * @returns {boolean}
     *
     * @example
     * Inventory.equiparArma("petala_divina");
     */
    function equiparArma(id) {
        const slot = _armas.get(id);

        if (!slot) {
            _log.warn(`equiparArma("${id}"): arma não encontrada no inventário.`);
            return false;
        }

        const anterior      = _armaEquipadaId;
        _armaEquipadaId     = id;

        // Atualiza GameState
        try {
            GameState.set("itemEquipado", { ...slot.item, danoReal: slot.danoReal });
        } catch { /* não crítico */ }

        _log.info(
            `Arma equipada: "${slot.item.nome}"` +
            ` | ${slot.danoReal} dano` +
            (slot.item.bonusDps ? ` | +${slot.item.bonusDps} DPS` : "")
        );

        try {
            EventBus.emit("item:equipado", {
                item       : { ...slot.item },
                danoReal   : slot.danoReal,
                anterior   : anterior ? _armas.get(anterior)?.item : null
            });
        } catch { /* não crítico */ }

        _emitirBonusUpdate();
        return true;
    }

    // ════════════════════════════════════════
    // EQUIPAR HERÓI ATIVO
    // ════════════════════════════════════════

    /**
     * Define o herói ativo (contribui bônus passivos).
     *
     * @param {string} id — ID do herói
     * @returns {boolean}
     */
    function equiparHeroi(id) {
        const slot = _herois.get(id);

        if (!slot) {
            _log.warn(`equiparHeroi("${id}"): herói não encontrado.`);
            return false;
        }

        const anterior  = _heroiAtivoId;
        _heroiAtivoId   = id;

        _log.info(
            `Herói ativo: "${slot.item.nome}"` +
            ` | x${_calcBonusClickHeroi(slot)} clique` +
            ` | +${_calcBonusDpsHeroi(slot)} DPS`
        );

        try {
            EventBus.emit("heroi:equipado", {
                heroi    : { ...slot.item },
                anterior : anterior ? _herois.get(anterior)?.item : null
            });
        } catch { /* não crítico */ }

        _emitirBonusUpdate();
        return true;
    }

    // ════════════════════════════════════════
    // REMOVER ARMA
    // ════════════════════════════════════════

    /**
     * Remove uma arma do inventário (descarta).
     * @param {string} id
     * @returns {boolean}
     */
    function removerArma(id) {
        if (!_armas.has(id)) {
            _log.warn(`removerArma("${id}"): não encontrado.`);
            return false;
        }

        const slot = _armas.get(id);
        _armas.delete(id);

        if (_armaEquipadaId === id) {
            _armaEquipadaId = null;
            _autoEquiparMelhorArma();
        }

        _log.info(`Arma descartada: "${slot.item.nome}"`);

        try {
            EventBus.emit("inventory:removido", { item: slot.item });
        } catch { /* não crítico */ }

        return true;
    }

    // ════════════════════════════════════════
    // CÁLCULO DE BÔNUS
    // ════════════════════════════════════════

    // Bônus de arma equipada (dano de clique)
    function bonusEquipado() {
        if (!_armaEquipadaId) return 0;
        const slot = _armas.get(_armaEquipadaId);
        return slot?.danoReal ?? 0;
    }

    // Bônus de DPS da arma equipada
    function bonusDpsArma() {
        if (!_armaEquipadaId) return 0;
        const slot = _armas.get(_armaEquipadaId);
        return slot?.item?.bonusDps ?? 0;
    }

    // ── Bônus do herói ativo ──
    function _calcBonusClickHeroi(slot) {
        if (!slot) return 1.0;
        const base  = slot.item.bonusClick ?? 1.0;
        const extra = (slot.quantidade - 1) * CFG.BONUS_DUPL_HEROI_PCT;
        return parseFloat((base + extra).toFixed(3));
    }

    function _calcBonusDpsHeroi(slot) {
        if (!slot) return 0;
        const base  = slot.item.bonusDps ?? 0;
        const extra = Math.floor(base * (slot.quantidade - 1) * CFG.BONUS_DUPL_HEROI_PCT);
        return base + extra;
    }

    // Multiplicador de dano de clique do herói ativo
    function bonusClickHerois() {
        if (!_heroiAtivoId) return 1.0;
        return _calcBonusClickHeroi(_herois.get(_heroiAtivoId));
    }

    // Bônus de DPS do herói ativo
    function bonusDpsHerois() {
        if (!_heroiAtivoId) return 0;
        return _calcBonusDpsHeroi(_herois.get(_heroiAtivoId));
    }

    /**
     * Retorna todos os bônus calculados em um único objeto.
     * Usado por damage.js para calcular dano final.
     *
     * @returns {{
     *   danoArma      : number,   — dano flat da arma
     *   dpsArma       : number,   — DPS flat da arma
     *   multClickHeroi: number,   — multiplicador x1.xx do herói
     *   dpsHeroi      : number,   — DPS flat do herói
     *   danoTotalBonus: number,   — danoArma somado
     *   dpsTotalBonus : number    — dpsArma + dpsHeroi
     * }}
     */
    function bonusTotal() {
        const danoArma  = bonusEquipado();
        const dpsArma   = bonusDpsArma();
        const multClick = bonusClickHerois();
        const dpsHeroi  = bonusDpsHerois();

        return {
            danoArma,
            dpsArma,
            multClickHeroi : multClick,
            dpsHeroi,
            danoTotalBonus : danoArma,
            dpsTotalBonus  : dpsArma + dpsHeroi
        };
    }

    // ════════════════════════════════════════
    // LEITURA
    // ════════════════════════════════════════

    /**
     * Retorna lista de heróis no inventário.
     * @param {string} [criterio="raridade"] — "raridade"|"nome"|"bonusClick"
     * @returns {Array<SlotHeroi>}
     */
    function herois(criterio = "raridade") {
        return ordenar("heroi", criterio);
    }

    /**
     * Retorna lista de armas no inventário.
     * @param {string} [criterio="dano"]
     * @returns {Array<SlotArma>}
     */
    function armas(criterio = "dano") {
        return ordenar("arma", criterio);
    }

    /**
     * Retorna o slot da arma equipada ou null.
     * @returns {SlotArma|null}
     */
    function armaEquipada() {
        if (!_armaEquipadaId) return null;
        const slot = _armas.get(_armaEquipadaId);
        return slot ? { ...slot } : null;
    }

    /**
     * Retorna o slot do herói ativo ou null.
     * @returns {SlotHeroi|null}
     */
    function heroiAtivo() {
        if (!_heroiAtivoId) return null;
        const slot = _herois.get(_heroiAtivoId);
        return slot ? { ...slot } : null;
    }

    /**
     * Verifica se um item está no inventário.
     * @param {string} id
     * @returns {boolean}
     */
    function possui(id) {
        return _herois.has(id) || _armas.has(id);
    }

    /**
     * Retorna a quantidade de um item (0 se não possui).
     * @param {string} id
     * @returns {number}
     */
    function quantidade(id) {
        return _herois.get(id)?.quantidade
            ?? _armas.get(id)?.quantidade
            ?? 0;
    }

    // ════════════════════════════════════════
    // ORDENAR
    // ════════════════════════════════════════

    /**
     * Retorna lista ordenada de heróis ou armas.
     *
     * @param {"heroi"|"arma"} tipo
     * @param {string}         criterio — "raridade"|"dano"|"nome"|"quantidade"|"obtidoEm"
     * @param {boolean}        [desc=true]
     * @returns {Array}
     */
    function ordenar(tipo, criterio = "raridade", desc = true) {
        const mapa   = tipo === "heroi" ? _herois : _armas;
        const lista  = [...mapa.values()];

        lista.sort((a, b) => {
            let cmp = 0;

            switch (criterio) {
                case "raridade":
                    cmp = (CFG.PESO_RARIDADE[a.item.raridade] ?? 0)
                        - (CFG.PESO_RARIDADE[b.item.raridade] ?? 0);
                    break;
                case "dano":
                    cmp = (a.danoReal ?? a.item.dano ?? a.item.bonusClick ?? 0)
                        - (b.danoReal ?? b.item.dano ?? b.item.bonusClick ?? 0);
                    break;
                case "nome":
                    cmp = a.item.nome.localeCompare(b.item.nome, "pt-BR");
                    break;
                case "quantidade":
                    cmp = a.quantidade - b.quantidade;
                    break;
                case "obtidoEm":
                    cmp = new Date(a.obtidoEm) - new Date(b.obtidoEm);
                    break;
                default:
                    cmp = 0;
            }

            return desc ? -cmp : cmp;
        });

        return lista;
    }

    // ════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════

    /**
     * Retorna snapshot para o SaveSystem.
     *
     * @returns {{
     *   herois        : Array,
     *   armas         : Array,
     *   armaEquipada  : string|null,
     *   heroiAtivo    : string|null
     * }}
     */
    function snapshot() {
        const heroisList = [];
        _herois.forEach(slot => {
            heroisList.push({
                id         : slot.item.id,
                quantidade : slot.quantidade,
                obtidoEm   : slot.obtidoEm
            });
        });

        const armasList = [];
        _armas.forEach(slot => {
            armasList.push({
                id         : slot.item.id,
                quantidade : slot.quantidade,
                obtidoEm   : slot.obtidoEm
            });
        });

        return {
            herois       : heroisList,
            armas        : armasList,
            armaEquipada : _armaEquipadaId,
            heroiAtivo   : _heroiAtivoId
        };
    }

    /**
     * Restaura inventário de um save.
     * Recarrega dados completos dos itens via GachaPool.
     *
     * @param {object} dados — resultado de snapshot()
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.warn("carregar(): dados inválidos.");
            return;
        }

        _herois.clear();
        _armas.clear();
        _armaEquipadaId = null;
        _heroiAtivoId   = null;

        // Restaura heróis
        (dados.herois ?? []).forEach(({ id, quantidade: qtd, obtidoEm }) => {
            let itemDef = null;
            try   { itemDef = GachaPool.item(id); } catch { /* pool pode não estar disponível */ }

            if (!itemDef) {
                _log.warn(`carregar(): herói "${id}" não encontrado no pool — ignorado.`);
                return;
            }

            _herois.set(id, {
                item       : itemDef,
                quantidade : Math.max(1, qtd ?? 1),
                obtidoEm   : obtidoEm ?? new Date().toISOString()
            });
        });

        // Restaura armas
        (dados.armas ?? []).forEach(({ id, quantidade: qtd, obtidoEm }) => {
            let itemDef = null;
            try   { itemDef = GachaPool.item(id); } catch { /* não crítico */ }

            if (!itemDef) {
                _log.warn(`carregar(): arma "${id}" não encontrada no pool — ignorada.`);
                return;
            }

            const quantidade = Math.max(1, qtd ?? 1);
            _armas.set(id, {
                item       : itemDef,
                quantidade,
                danoReal   : _calcDanoReal(itemDef.dano ?? 0, quantidade),
                obtidoEm   : obtidoEm ?? new Date().toISOString()
            });
        });

        // Restaura equipamentos
        if (dados.armaEquipada && _armas.has(dados.armaEquipada)) {
            _armaEquipadaId = dados.armaEquipada;
        }
        if (dados.heroiAtivo && _herois.has(dados.heroiAtivo)) {
            _heroiAtivoId = dados.heroiAtivo;
        }

        _log.debug(
            `carregar(): ${_herois.size} herói(s) | ${_armas.size} arma(s)` +
            ` | Arma: ${_armaEquipadaId ?? "nenhuma"}` +
            ` | Herói: ${_heroiAtivoId ?? "nenhum"}`
        );

        _emitirBonusUpdate();
    }

    /**
     * Limpa todo o inventário.
     * Usado apenas em reset total de save.
     */
    function limpar() {
        _herois.clear();
        _armas.clear();
        _armaEquipadaId = null;
        _heroiAtivoId   = null;
        _log.info("Inventário limpo.");
        _emitirBonusUpdate();
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS E DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas do inventário.
     */
    function stats() {
        return {
            totalHerois      : _herois.size,
            totalArmas       : _armas.size,
            totalObtidos     : _stats.totalObtidos,
            totalDuplicatas  : _stats.totalDuplicatas,
            porRaridade      : { ..._stats.porRaridade },
            armaEquipada     : _armaEquipadaId,
            heroiAtivo       : _heroiAtivoId,
            bonus            : bonusTotal()
        };
    }

    /**
     * Loga o estado atual do inventário (só dev).
     */
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Inventory — Status", () => {
            const b = bonusTotal();
            _log.debug(`Heróis : ${_herois.size} / ${CFG.MAX_HEROIS}`);
            _log.debug(`Armas  : ${_armas.size} / ${CFG.MAX_ARMAS}`);
            _log.debug(`Arma equipada  : ${_armaEquipadaId ?? "—"} (+${b.danoArma} dano)`);
            _log.debug(`Herói ativo    : ${_heroiAtivoId ?? "—"} (x${b.multClickHeroi} clique)`);
            _log.debug(`Bônus total    : +${b.danoTotalBonus} dano | +${b.dpsTotalBonus} DPS`);
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // ════════════════════════════════════════
    try {
        // Item obtido via gacha — adiciona automaticamente
        EventBus.on("gacha:item_obtido", ({ item } = {}) => {
            if (item) adicionar(item);
        });

        // Reset total
        EventBus.on("state:reset:total", () => limpar());

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Ação principal
        adicionar,

        // Equipar
        equiparArma,
        equiparHeroi,
        removerArma,

        // Leitura
        herois,
        armas,
        armaEquipada,
        heroiAtivo,
        possui,
        quantidade,
        ordenar,

        // Bônus (usados por damage.js)
        bonusEquipado,
        bonusDpsArma,
        bonusClickHerois,
        bonusDpsHerois,
        bonusTotal,

        // Save/Load
        snapshot,
        carregar,
        limpar,

        // Diagnóstico
        stats,
        logStatus,

        // Config (readonly)
        get CFG() { return CFG; }
    });

})();
