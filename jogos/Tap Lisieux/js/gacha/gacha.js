// ═══════════════════════════════════════════════════════════
//  GACHA.JS
//  Sistema completo de invocação (gacha).
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, "invocar(qtd)" era uma função solta em
//  game-ui.js que misturava cálculo de raridade, pity, custo,
//  UI e inventário em ~50 linhas. Sem banner, sem garantia
//  de épico, sem histórico estruturado, sem animação.
//
//  SOLUÇÃO:
//  Sistema modular com pipeline de pull separado em etapas
//  claras, múltiplos tipos de pity, banners configuráveis
//  e histórico completo.
//
//  SISTEMA DE PITY:
//  ┌───────────────────────────────────────────────────────┐
//  │  PITY LENDÁRIO                                        │
//  │  - Pulls 1-74  : chance base (0.6%)                  │
//  │  - Pulls 75-89 : soft pity (+6% por pull)            │
//  │  - Pull 90     : garantido (hard pity)               │
//  │  - Reseta ao obter lendário                          │
//  ├───────────────────────────────────────────────────────┤
//  │  PITY ÉPICO                                           │
//  │  - Garantido a cada 10 pulls sem épico ou lendário   │
//  ├───────────────────────────────────────────────────────┤
//  │  GARANTIA DE BANNER                                   │
//  │  - 50% chance do lendário ser do rate-up             │
//  │  - Se não cair rate-up, o próximo lendário é garante │
//  └───────────────────────────────────────────────────────┘
//
//  PIPELINE DE UM PULL:
//  1. Verificar custo → Economy.gastar()
//  2. _selecionarRaridade()  → aplica pity
//  3. _selecionarItem()      → filtra por raridade no banner
//  4. _aplicarGarantia()     → verifica garantia de rate-up
//  5. Inventory.adicionar()  → salva no inventário
//  6. _atualizarPity()       → incrementa/reseta contadores
//  7. EventBus.emit()        → notifica UI e efeitos
//
//  API:
//    GachaSystem.invocar(qtd, bannerId)    → ResultadoPull[]
//    GachaSystem.pityAtual(bannerId)       → { lendario, epico }
//    GachaSystem.historico(ultimos)        → registros
//    GachaSystem.custoTotal(qtd, bannerId) → number
//    GachaSystem.infoBanner(bannerId)      → objeto completo
//    GachaSystem.simularPull(bannerId)     → preview sem gastar
//    GachaSystem.snapshot()               → para save
//    GachaSystem.carregar(dados)          → restaura do save
//
//  Depende de: constants.js, economy.js, inventory.js,
//              gacha-pool.js, event-bus.js, logger.js, state.js
//  Usado por: ui-gacha.js
// ═══════════════════════════════════════════════════════════

"use strict";

const GachaSystem = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Gacha"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Gacha]",  ...a),
            error : (...a) => console.error("[Gacha]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO DE PITY E CHANCES
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        // Lendário
        LEND_CHANCE_BASE    : 0.006,   // 0.6% base
        LEND_HARD_PITY      : 90,      // garantido no pull 90
        LEND_SOFT_PITY      : 75,      // soft pity começa aqui
        LEND_SOFT_BONUS     : 0.06,    // +6% por pull acima do soft pity

        // Épico
        EPICO_CHANCE_BASE   : 0.051,   // 5.1% base
        EPICO_PITY          : 10,      // garantido a cada 10 pulls sem épico+

        // Raro
        RARO_CHANCE_BASE    : 0.201,   // 20.1% base

        // Garantia de rate-up (50/50)
        RATE_UP_CHANCE      : 0.50,

        // Custos padrão (fallback se o banner não definir)
        CUSTO_X1_PADRAO     : 100,
        CUSTO_X10_PADRAO    : 900,

        // Limites
        MAX_PULL_UNICO      : 100,     // máximo de pulls por chamada
        HISTORICO_MAX       : 500
    });

    // ════════════════════════════════════════
    // ESTADO POR BANNER
    // Cada banner tem seu próprio pity e garantia
    // ════════════════════════════════════════

    /**
     * @typedef {object} EstadoBanner
     * @property {number}  pityLend        — pulls desde o último lendário
     * @property {number}  pityEpico       — pulls desde o último épico ou lendário
     * @property {boolean} garantiaRateUp  — true se o próximo lend é rate-up garantido
     */

    // bannerId → EstadoBanner
    const _estadoBanners = new Map();

    function _getBannerEstado(bannerId) {
        if (!_estadoBanners.has(bannerId)) {
            _estadoBanners.set(bannerId, {
                pityLend       : 0,
                pityEpico      : 0,
                garantiaRateUp : false
            });
        }
        return _estadoBanners.get(bannerId);
    }

    // ════════════════════════════════════════
    // HISTÓRICO GLOBAL DE PULLS
    // ════════════════════════════════════════

    /**
     * @typedef {object} RegistroPull
     * @property {string}  bannerId
     * @property {string}  itemId
     * @property {string}  itemNome
     * @property {string}  raridade
     * @property {boolean} critico      — false (reservado)
     * @property {boolean} foiPity      — lendário por pity?
     * @property {boolean} foiRateUp    — foi o item de rate-up?
     * @property {number}  pityNoMomento
     * @property {number}  pullNumGlobal
     * @property {number}  timestamp
     */
    const _historico = [];
    let   _pullsGlobais = 0;

    // Estatísticas globais
    const _stats = {
        totalPulls    : 0,
        totalLendarios: 0,
        totalEpicos   : 0,
        totalRaros    : 0,
        totalComuns   : 0,
        gemasGastas   : 0,
        porBanner     : {}    // bannerId → { pulls, lendarios }
    };

    // ════════════════════════════════════════
    // CÁLCULO DE CHANCE COM PITY
    // ════════════════════════════════════════
    function _calcChanceLendario(pity) {
        if (pity >= CFG.LEND_HARD_PITY)  return 1.0;
        if (pity >= CFG.LEND_SOFT_PITY) {
            const bonus = CFG.LEND_SOFT_BONUS * (pity - CFG.LEND_SOFT_PITY);
            return Math.min(1.0, CFG.LEND_CHANCE_BASE + bonus);
        }
        return CFG.LEND_CHANCE_BASE;
    }

    function _calcChanceEpico(pityEpico) {
        // Pity épico: garante épico+ a cada N pulls
        if (pityEpico >= CFG.EPICO_PITY) return 1.0;
        return CFG.EPICO_CHANCE_BASE;
    }

    // ════════════════════════════════════════
    // SELECIONAR RARIDADE
    // ════════════════════════════════════════
    function _selecionarRaridade(estado) {
        const r = Math.random();

        const chanceLend  = _calcChanceLendario(estado.pityLend);
        const chanceEpico = _calcChanceEpico(estado.pityEpico);

        if (r < chanceLend)                     return "Lendário";
        if (r < chanceLend + chanceEpico)        return "Épico";
        if (r < chanceLend + chanceEpico + CFG.RARO_CHANCE_BASE) return "Raro";
        return "Comum";
    }

    // ════════════════════════════════════════
    // SELECIONAR ITEM
    // ════════════════════════════════════════
    function _selecionarItem(raridade, bannerId, estado) {
        let pool = [];

        try {
            pool = GachaPool.porRaridade(raridade, bannerId);
        } catch (e) {
            _log.error("_selecionarItem(): GachaPool.porRaridade falhou:", e);
        }

        if (pool.length === 0) {
            _log.warn(`Pool vazia para "${raridade}" no banner "${bannerId}". Fallback Comum.`);
            try {
                pool = GachaPool.porRaridade("Comum", bannerId);
            } catch { /* não crítico */ }
        }

        if (pool.length === 0) {
            _log.error("Pool completamente vazia! Verificar GachaPool.");
            return null;
        }

        // Aplica garantia de rate-up para lendários
        if (raridade === "Lendário") {
            return _aplicarGarantiaRateUp(pool, bannerId, estado);
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    // ════════════════════════════════════════
    // GARANTIA DE RATE-UP (50/50)
    // ════════════════════════════════════════
    function _aplicarGarantiaRateUp(poolLend, bannerId, estado) {
        let bannerDef = null;
        try { bannerDef = GachaPool.banner(bannerId); } catch { /* não crítico */ }

        const rateUpIds = bannerDef?.rateUp ?? [];

        // Se não há rate-up no banner, retorna qualquer lendário
        if (rateUpIds.length === 0) {
            return poolLend[Math.floor(Math.random() * poolLend.length)];
        }

        const poolRateUp = poolLend.filter(i => rateUpIds.includes(i.id));
        const poolNormal = poolLend.filter(i => !rateUpIds.includes(i.id));

        // Garantia ativa ou ganhou o 50/50
        const ganhouRateUp = estado.garantiaRateUp || Math.random() < CFG.RATE_UP_CHANCE;

        if (ganhouRateUp && poolRateUp.length > 0) {
            estado.garantiaRateUp = false; // reseta garantia
            return poolRateUp[Math.floor(Math.random() * poolRateUp.length)];
        } else {
            // Perdeu o 50/50 — próximo lendário é garantido rate-up
            estado.garantiaRateUp = true;
            const fallback = poolNormal.length > 0 ? poolNormal : poolLend;
            return fallback[Math.floor(Math.random() * fallback.length)];
        }
    }

    // ════════════════════════════════════════
    // ATUALIZAR PITY APÓS PULL
    // ════════════════════════════════════════
    function _atualizarPity(estado, raridade) {
        const foiLend  = raridade === "Lendário";
        const foiEpico = raridade === "Épico" || foiLend;

        // Pity lendário
        if (foiLend) {
            estado.pityLend = 0;
        } else {
            estado.pityLend++;
        }

        // Pity épico reseta em épico OU lendário
        if (foiEpico) {
            estado.pityEpico = 0;
        } else {
            estado.pityEpico++;
        }
    }

    // ════════════════════════════════════════
    // EXECUTAR UM PULL (interno)
    // ════════════════════════════════════════

    /**
     * Executa um único pull sem cobrar custo.
     * O custo é cobrado uma vez pela função invocar().
     *
     * @param {string} bannerId
     * @returns {RegistroPull|null}
     */
    function _executarUmPull(bannerId) {
        const estado   = _getBannerEstado(bannerId);
        const pityAntes = estado.pityLend;

        const raridade = _selecionarRaridade(estado);
        const item     = _selecionarItem(raridade, bannerId, estado);

        if (!item) {
            _log.error(`_executarUmPull("${bannerId}"): item nulo após seleção.`);
            return null;
        }

        _atualizarPity(estado, raridade);

        _pullsGlobais++;

        const foiPity   = raridade === "Lendário" && pityAntes >= CFG.LEND_SOFT_PITY;
        const bannerDef = (() => { try { return GachaPool.banner(bannerId); } catch { return null; } })();
        const foiRateUp = raridade === "Lendário" && (bannerDef?.rateUp ?? []).includes(item.id);

        const registro = {
            bannerId,
            itemId        : item.id,
            itemNome      : item.nome,
            raridade,
            foiPity,
            foiRateUp,
            garantiaAtiva : estado.garantiaRateUp,
            pityNoMomento : pityAntes,
            pityEpicoMom  : estado.pityEpico,
            pullNumGlobal : _pullsGlobais,
            timestamp     : Date.now()
        };

        // Adiciona ao inventário
        try {
            Inventory.adicionar(item);
        } catch (e) {
            _log.error(`_executarUmPull(): Inventory.adicionar falhou:`, e);
        }

        // Registra no histórico
        _historico.push(registro);
        if (_historico.length > CFG.HISTORICO_MAX) _historico.shift();

        // Atualiza stats
        _stats.totalPulls++;
        if (!_stats.porBanner[bannerId]) {
            _stats.porBanner[bannerId] = { pulls: 0, lendarios: 0 };
        }
        _stats.porBanner[bannerId].pulls++;

        switch (raridade) {
            case "Lendário": _stats.totalLendarios++; _stats.porBanner[bannerId].lendarios++; break;
            case "Épico"   : _stats.totalEpicos++;    break;
            case "Raro"    : _stats.totalRaros++;     break;
            default        : _stats.totalComuns++;    break;
        }

        _log.debug(
            `Pull: ${item.emoji} ${item.nome} (${raridade})` +
            ` | Pity: ${pityAntes} → ${estado.pityLend}` +
            (foiPity   ? " [PITY]"    : "") +
            (foiRateUp ? " [RATE-UP]" : "")
        );

        return registro;
    }

    // ════════════════════════════════════════
    // CUSTO TOTAL
    // ════════════════════════════════════════

    /**
     * Calcula o custo total de N pulls em um banner.
     * Aplica desconto de x10 automaticamente.
     *
     * @param {number} qtd
     * @param {string} [bannerId="padrao"]
     * @returns {number}
     */
    function custoTotal(qtd, bannerId = "padrao") {
        let bannerDef = null;
        try { bannerDef = GachaPool.banner(bannerId); } catch { /* não crítico */ }

        const custoX1  = bannerDef?.custoX1  ?? CFG.CUSTO_X1_PADRAO;
        const custoX10 = bannerDef?.custoX10 ?? CFG.CUSTO_X10_PADRAO;

        if (qtd <= 0) return 0;

        const lotes10  = Math.floor(qtd / 10);
        const resto    = qtd % 10;

        return (lotes10 * custoX10) + (resto * custoX1);
    }

    // ════════════════════════════════════════
    // INVOCAR — API PRINCIPAL
    // ════════════════════════════════════════

    /**
     * Executa N pulls em um banner, cobra o custo e retorna resultados.
     *
     * @param {number} qtd                — quantidade (1, 10, etc.)
     * @param {string} [bannerId="padrao"]
     * @returns {{
     *   sucesso    : boolean,
     *   resultados : RegistroPull[],
     *   resumo     : { lend, epico, raro, comum, custoGasto },
     *   pityDepois : { lend, epico }
     * }}
     *
     * @example
     * GachaSystem.invocar(1);
     * GachaSystem.invocar(10, "herois");
     * GachaSystem.invocar(1, "sao_miguel_rateup");
     */
    function invocar(qtd = 1, bannerId = "padrao") {
        // Validações
        if (typeof qtd !== "number" || qtd < 1 || !Number.isInteger(qtd)) {
            _log.warn(`invocar(): qtd inválida "${qtd}".`);
            return _resultadoFalha("Quantidade inválida.");
        }

        if (qtd > CFG.MAX_PULL_UNICO) {
            _log.warn(`invocar(): qtd ${qtd} > MAX ${CFG.MAX_PULL_UNICO}. Limitando.`);
            qtd = CFG.MAX_PULL_UNICO;
        }

        // Verifica se o banner existe e está ativo
        let bannerDef = null;
        try { bannerDef = GachaPool.banner(bannerId); } catch { /* não crítico */ }

        if (!bannerDef) {
            _log.warn(`invocar(): banner "${bannerId}" não encontrado. Usando padrão.`);
            bannerId = "padrao";
        }

        // Calcula e cobra custo
        const custo = custoTotal(qtd, bannerId);

        const gastou = (() => {
            try {
                return Economy.gastar("gema", custo, `gacha:${bannerId}:x${qtd}`);
            } catch (e) {
                _log.error("invocar(): Economy.gastar falhou:", e);
                return false;
            }
        })();

        if (!gastou) {
            _log.warn(`invocar(): gemas insuficientes. Custo: ${custo}`);
            return _resultadoFalha("Gemas insuficientes!");
        }

        _stats.gemasGastas += custo;

        // Executa pulls
        const resultados = [];

        for (let i = 0; i < qtd; i++) {
            const registro = _executarUmPull(bannerId);
            if (registro) resultados.push(registro);
        }

        // Monta resumo
        const resumo = _calcResumo(resultados, custo);

        // Atualiza GameState
        try {
            const estado = _getBannerEstado(bannerId);
            GameState.set("pityGacha", estado.pityLend);
        } catch { /* não crítico */ }

        // Emite eventos
        _emitirEventos(resultados, resumo, bannerId);

        _log.info(
            `invocar(x${qtd}, "${bannerId}") — Custo: ${custo}💎` +
            ` | Lend: ${resumo.lend} | Épico: ${resumo.epico}`
        );

        const estadoFinal = _getBannerEstado(bannerId);

        return {
            sucesso    : true,
            resultados,
            resumo,
            pityDepois : {
                lend  : estadoFinal.pityLend,
                epico : estadoFinal.pityEpico,
                garantiaRateUp: estadoFinal.garantiaRateUp
            }
        };
    }

    // ════════════════════════════════════════
    // CALCULAR RESUMO DOS PULLS
    // ════════════════════════════════════════
    function _calcResumo(resultados, custoGasto) {
        return {
            lend      : resultados.filter(r => r.raridade === "Lendário").length,
            epico     : resultados.filter(r => r.raridade === "Épico").length,
            raro      : resultados.filter(r => r.raridade === "Raro").length,
            comum     : resultados.filter(r => r.raridade === "Comum").length,
            rateUps   : resultados.filter(r => r.foiRateUp).length,
            pitys     : resultados.filter(r => r.foiPity).length,
            custoGasto,
            melhor    : resultados.reduce((m, r) => {
                const peso = { "Lendário": 4, "Épico": 3, "Raro": 2, "Comum": 1 };
                return !m || (peso[r.raridade] ?? 0) > (peso[m.raridade] ?? 0) ? r : m;
            }, null)
        };
    }

    // ════════════════════════════════════════
    // EMITIR EVENTOS
    // ════════════════════════════════════════
    function _emitirEventos(resultados, resumo, bannerId) {
        try {
            // Evento principal do gacha
            EventBus.emit("gacha:pull", {
                resultados,
                resumo,
                bannerId
            });

            // Evento por raridade dos melhores itens
            if (resumo.lend > 0) {
                const lendarios = resultados.filter(r => r.raridade === "Lendário");
                lendarios.forEach(r => {
                    EventBus.emit("gacha:pull:lendario", {
                        item     : Inventory.possui(r.itemId)
                            ? { id: r.itemId, nome: r.itemNome }
                            : null,
                        foiRateUp: r.foiRateUp,
                        foiPity  : r.foiPity
                    });
                });

                // Toast especial
                const primeiro = lendarios[0];
                Toast.mostrar(
                    `🌟 LENDÁRIO! ${primeiro.itemNome}` +
                    (primeiro.foiRateUp ? " ⭐ RATE-UP!" : ""),
                    { tipo: "lendario", duracao: 6000, icone: "🌟" }
                );
            }

            if (resumo.epico > 0 && resumo.lend === 0) {
                EventBus.emit("gacha:pull:epico", { qtd: resumo.epico });
            }

            // Atualiza conquistas
            EventBus.emit("conquistas:verificar");

        } catch (e) {
            _log.error("_emitirEventos(): falhou:", e);
        }
    }

    // ════════════════════════════════════════
    // RESULTADO DE FALHA
    // ════════════════════════════════════════
    function _resultadoFalha(motivo) {
        return {
            sucesso    : false,
            resultados : [],
            resumo     : { lend: 0, epico: 0, raro: 0, comum: 0, custoGasto: 0, melhor: null },
            pityDepois : null,
            motivo
        };
    }

    // ════════════════════════════════════════
    // SIMULAR PULL (sem gastar gemas)
    // Para preview na UI
    // ════════════════════════════════════════

    /**
     * Simula as probabilidades de N pulls sem gastar nada.
     * Útil para mostrar preview na UI.
     *
     * @param {string} [bannerId="padrao"]
     * @returns {{
     *   chanceLend      : number,   — % chance de ao menos 1 lendário em x10
     *   pityAtual       : number,
     *   pullsParaHard   : number,
     *   pullsParaSoft   : number,
     *   custoX1         : number,
     *   custoX10        : number,
     *   garantiaRateUp  : boolean
     * }}
     */
    function simularPull(bannerId = "padrao") {
        const estado     = _getBannerEstado(bannerId);
        const pity       = estado.pityLend;
        const chanceUm   = _calcChanceLendario(pity);
        // Chance de ao menos 1 lendário em 10 pulls
        const chance10   = 1 - Math.pow(1 - chanceUm, 10);

        let custoX1  = CFG.CUSTO_X1_PADRAO;
        let custoX10 = CFG.CUSTO_X10_PADRAO;
        try {
            const b  = GachaPool.banner(bannerId);
            custoX1  = b?.custoX1  ?? CFG.CUSTO_X1_PADRAO;
            custoX10 = b?.custoX10 ?? CFG.CUSTO_X10_PADRAO;
        } catch { /* não crítico */ }

        return {
            chanceLend      : parseFloat((chanceUm  * 100).toFixed(2)),
            chanceLend10    : parseFloat((chance10  * 100).toFixed(2)),
            pityAtual       : pity,
            pityEpico       : estado.pityEpico,
            pullsParaHard   : Math.max(0, CFG.LEND_HARD_PITY - pity),
            pullsParaSoft   : Math.max(0, CFG.LEND_SOFT_PITY - pity),
            pullsParaEpico  : Math.max(0, CFG.EPICO_PITY - estado.pityEpico),
            custoX1,
            custoX10,
            garantiaRateUp  : estado.garantiaRateUp,
            saldoGema       : (() => { try { return Economy.saldo("gema"); } catch { return 0; } })(),
            podeX1          : (() => { try { return Economy.podeGastar("gema", custoX1); } catch { return false; } })(),
            podeX10         : (() => { try { return Economy.podeGastar("gema", custoX10); } catch { return false; } })(),
        };
    }

    // ════════════════════════════════════════
    // LEITURA DE PITY
    // ════════════════════════════════════════

    /**
     * Retorna o estado de pity de um banner.
     * @param {string} [bannerId="padrao"]
     * @returns {{ lendario, epico, garantiaRateUp }}
     */
    function pityAtual(bannerId = "padrao") {
        const e = _getBannerEstado(bannerId);
        return {
            lendario      : e.pityLend,
            epico         : e.pityEpico,
            garantiaRateUp: e.garantiaRateUp,
            pullsParaHard : Math.max(0, CFG.LEND_HARD_PITY - e.pityLend),
            pullsParaSoft : Math.max(0, CFG.LEND_SOFT_PITY - e.pityLend),
            esSoftPity    : e.pityLend >= CFG.LEND_SOFT_PITY
        };
    }

    // ════════════════════════════════════════
    // INFO COMPLETA DO BANNER PARA UI
    // ════════════════════════════════════════

    /**
     * Retorna objeto completo do banner para a UI renderizar.
     * @param {string} [bannerId="padrao"]
     */
    function infoAtual(bannerId = "padrao") {
        const simulacao = simularPull(bannerId);
        const pity      = pityAtual(bannerId);

        let bannerDef = null;
        try { bannerDef = GachaPool.banner(bannerId); } catch { /* não crítico */ }

        return {
            banner   : bannerDef,
            bannerId,
            pity,
            simulacao,
            historicoBanner: historico(20).filter(h => h.bannerId === bannerId),
            texto: {
                pity : `🎯 Pity: ${pity.lendario}/${CFG.LEND_HARD_PITY}` +
                       ` · Lendário em ${pity.pullsParaHard} pull${pity.pullsParaHard !== 1 ? "s" : ""}` +
                       (pity.esSoftPity ? " ⚡ SOFT PITY!" : ""),
                epico: `🔮 Épico garantido em ${pity.pullsParaEpico ?? 0} pull${pity.pullsParaEpico !== 1 ? "s" : ""}`,
                garantia: pity.garantiaRateUp
                    ? "⭐ Próximo lendário é RATE-UP GARANTIDO!"
                    : ""
            }
        };
    }

    // ════════════════════════════════════════
    // HISTÓRICO
    // ════════════════════════════════════════

    /**
     * @param {number} [ultimos]
     * @returns {RegistroPull[]}
     */
    function historico(ultimos) {
        const h = [..._historico];
        return ultimos ? h.slice(-ultimos) : h;
    }

    /**
     * Retorna apenas os lendários do histórico.
     */
    function historicoLendarios() {
        return _historico.filter(r => r.raridade === "Lendário");
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas globais do gacha.
     */
    function stats() {
        const total = _stats.totalPulls;
        return {
            totalPulls      : total,
            totalLendarios  : _stats.totalLendarios,
            totalEpicos     : _stats.totalEpicos,
            totalRaros      : _stats.totalRaros,
            totalComuns     : _stats.totalComuns,
            gemasGastas     : _stats.gemasGastas,
            taxaLend        : total > 0 ? (_stats.totalLendarios / total * 100).toFixed(2) + "%" : "0%",
            taxaEpico       : total > 0 ? (_stats.totalEpicos    / total * 100).toFixed(2) + "%" : "0%",
            porBanner       : { ..._stats.porBanner },
            mediaGemasLend  : _stats.totalLendarios > 0
                ? Math.floor(_stats.gemasGastas / _stats.totalLendarios)
                : 0
        };
    }

    // ════════════════════════════════════════
    // SAVE / LOAD
    // ════════════════════════════════════════

    /**
     * Retorna snapshot para o SaveSystem.
     */
    function snapshot() {
        const estadosBanners = {};
        _estadoBanners.forEach((estado, bannerId) => {
            estadosBanners[bannerId] = { ...estado };
        });

        return {
            estadosBanners,
            pullsGlobais   : _pullsGlobais,
            historico      : _historico.slice(-100), // salva últimos 100
            stats          : { ..._stats }
        };
    }

    /**
     * Restaura do save.
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.warn("carregar(): dados inválidos.");
            return;
        }

        // Restaura estados de banner
        if (dados.estadosBanners) {
            for (const [id, estado] of Object.entries(dados.estadosBanners)) {
                _estadoBanners.set(id, {
                    pityLend       : estado.pityLend       ?? 0,
                    pityEpico      : estado.pityEpico      ?? 0,
                    garantiaRateUp : estado.garantiaRateUp ?? false
                });
            }
        }

        // Fallback: pity salvo no formato antigo
        if (dados.pityLend !== undefined && !dados.estadosBanners) {
            _getBannerEstado("padrao").pityLend = dados.pityLend ?? 0;
        }

        if (dados.pullsGlobais) _pullsGlobais = dados.pullsGlobais;

        if (Array.isArray(dados.historico)) {
            dados.historico.forEach(r => _historico.push(r));
        }

        _log.debug(
            `carregar(): ${_estadoBanners.size} banner(s) restaurados.` +
            ` Pity padrão: ${_getBannerEstado("padrao").pityLend}`
        );
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("GachaSystem — Status", () => {
            const s = stats();
            _log.debug(`Total pulls    : ${s.totalPulls}`);
            _log.debug(`Lendários      : ${s.totalLendarios} (${s.taxaLend})`);
            _log.debug(`Épicos         : ${s.totalEpicos} (${s.taxaEpico})`);
            _log.debug(`Gemas gastas   : ${s.gemasGastas}💎`);
            _log.debug(`Gemas/Lendário : ${s.mediaGemasLend}💎`);
            _estadoBanners.forEach((e, id) => {
                _log.debug(`Banner "${id}": pity ${e.pityLend}/${CFG.LEND_HARD_PITY} | épico ${e.pityEpico}/${CFG.EPICO_PITY}`);
            });
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        EventBus.on("state:reset:total", () => {
            _estadoBanners.clear();
            _historico.length = 0;
            _pullsGlobais     = 0;
            _stats.totalPulls = 0;
            _stats.totalLendarios = 0;
            _stats.totalEpicos    = 0;
            _stats.gemasGastas    = 0;
            _log.info("GachaSystem resetado.");
        });
    } catch { /* não crítico */ }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // API principal
        invocar,
        custoTotal,

        // Leitura
        pityAtual,
        infoAtual,
        simularPull,

        // Histórico
        historico,
        historicoLendarios,

        // Save/Load
        snapshot,
        carregar,

        // Diagnóstico
        stats,
        logStatus,

        // Constantes (readonly)
        get CFG() { return CFG; }
    });

})();
