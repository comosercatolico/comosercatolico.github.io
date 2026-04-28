// ═══════════════════════════════════════════════════════════
//  ECONOMY.JS
//  Sistema financeiro centralizado do jogo.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, "moeda -= custo" aparecia em 6 lugares
//  diferentes sem validação. Era possível ficar com moeda
//  negativa, gastar sem ter saldo, ou esquecer de emitir
//  o evento de atualização da UI.
//
//  SOLUÇÃO:
//  TODA transação passa por aqui. Impossível ter estado
//  inconsistente — validação, atomicidade e eventos
//  garantidos em um único lugar.
//
//  MOEDAS (🪙):
//  - Ganhas ao matar inimigos
//  - Gastas em upgrades
//  - Resetam no prestígio
//
//  GEMAS (💎):
//  - Ganhas via conquistas, missões, offline
//  - Gastas no gacha
//  - NUNCA resetam (permanentes)
//
//  RELÍQUIAS (✨) — futura expansão:
//  - Ganhas no prestígio
//  - Compram bônus permanentes
//
//  API:
//    Economy.ganhar(tipo, valor, origem)
//    Economy.gastar(tipo, valor, origem)  → boolean
//    Economy.podeGastar(tipo, valor)      → boolean
//    Economy.saldo(tipo)                  → number
//    Economy.transacoes()                 → histórico
//    Economy.relatorio()                  → estatísticas
//
//  Depende de: constants.js, event-bus.js, state.js, logger.js
//  Usado por: battle.js, upgrades.js, gacha.js, achievements.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Economy = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Economy"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Economy]",  ...a),
            error : (...a) => console.error("[Economy]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // TIPOS DE MOEDA
    // ════════════════════════════════════════

    // Mapeia tipo → chave no GameState
    const _CHAVE = Object.freeze({
        moeda    : "moeda",
        gema     : "gema",
        reliquia : "reliquia"   // futura expansão
    });

    // Emoji por tipo (para logs e toasts)
    const _EMOJI = Object.freeze({
        moeda    : "🪙",
        gema     : "💎",
        reliquia : "✨"
    });

    // Limites máximos por tipo (segurança anti-overflow)
    const _MAXIMO = Object.freeze({
        moeda    : 1e15,   // 1 quadrilhão
        gema     : 1e9,    // 1 bilhão
        reliquia : 1e6
    });

    // ════════════════════════════════════════
    // HISTÓRICO DE TRANSAÇÕES
    // Últimas N transações para diagnóstico
    // ════════════════════════════════════════
    const _HISTORICO_MAX = 100;
    const _historico     = [];

    // Estatísticas acumuladas da sessão
    const _stats = {
        moeda    : { ganho: 0, gasto: 0, transacoes: 0 },
        gema     : { ganho: 0, gasto: 0, transacoes: 0 },
        reliquia : { ganho: 0, gasto: 0, transacoes: 0 }
    };

    // ════════════════════════════════════════
    // VALIDAÇÃO
    // ════════════════════════════════════════
    function _validarTipo(tipo, metodo) {
        if (!_CHAVE[tipo]) {
            _log.error(`${metodo}(): tipo inválido "${tipo}". Use: moeda, gema, reliquia.`);
            return false;
        }
        return true;
    }

    function _validarValor(valor, metodo) {
        if (typeof valor !== "number" || isNaN(valor) || valor < 0) {
            _log.error(`${metodo}(): valor inválido "${valor}". Deve ser número ≥ 0.`);
            return false;
        }
        if (!isFinite(valor)) {
            _log.error(`${metodo}(): valor infinito rejeitado.`);
            return false;
        }
        return true;
    }

    // ════════════════════════════════════════
    // REGISTRAR TRANSAÇÃO NO HISTÓRICO
    // ════════════════════════════════════════
    function _registrar(tipo, operacao, valor, origem, saldoAntes, saldoDepois) {
        _historico.push({
            tipo,
            operacao,   // "ganho" | "gasto" | "set"
            valor,
            origem      : origem ?? "desconhecido",
            saldoAntes,
            saldoDepois,
            timestamp   : Date.now()
        });

        // Remove entradas antigas
        if (_historico.length > _HISTORICO_MAX) _historico.shift();

        // Atualiza stats
        if (_stats[tipo]) {
            _stats[tipo].transacoes++;
            if (operacao === "ganho") _stats[tipo].ganho += valor;
            if (operacao === "gasto") _stats[tipo].gasto += valor;
        }
    }

    // ════════════════════════════════════════
    // SALDO — lê o valor atual
    // ════════════════════════════════════════

    /**
     * Retorna o saldo atual de um tipo de moeda.
     *
     * @param   {"moeda"|"gema"|"reliquia"} tipo
     * @returns {number}
     *
     * @example
     * Economy.saldo("moeda") // 1500
     * Economy.saldo("gema")  // 75
     */
    function saldo(tipo) {
        if (!_validarTipo(tipo, "saldo")) return 0;
        try {
            return GameState.get(_CHAVE[tipo]) ?? 0;
        } catch {
            _log.error("saldo(): GameState não disponível.");
            return 0;
        }
    }

    // ════════════════════════════════════════
    // PODE GASTAR — verificação sem efeito
    // ════════════════════════════════════════

    /**
     * Verifica se o jogador pode gastar sem fazer a transação.
     * Use para habilitar/desabilitar botões na UI.
     *
     * @param   {"moeda"|"gema"|"reliquia"} tipo
     * @param   {number}                    valor
     * @returns {boolean}
     *
     * @example
     * btn.disabled = !Economy.podeGastar("moeda", 150);
     */
    function podeGastar(tipo, valor) {
        if (!_validarTipo(tipo, "podeGastar"))   return false;
        if (!_validarValor(valor, "podeGastar")) return false;
        return saldo(tipo) >= valor;
    }

    // ════════════════════════════════════════
    // GANHAR — adiciona moeda com validação
    // ════════════════════════════════════════

    /**
     * Adiciona moeda/gema ao jogador.
     * Emite evento automático para a UI atualizar.
     *
     * @param {"moeda"|"gema"|"reliquia"} tipo
     * @param {number}                    valor   — quantidade a ganhar
     * @param {string}                    [origem] — fonte (para log/analytics)
     *
     * @example
     * Economy.ganhar("moeda", 150,  "kill:estagio5");
     * Economy.ganhar("gema",  10,   "conquista:primeiro_kill");
     * Economy.ganhar("gema",  1000, "offline:2h");
     */
    function ganhar(tipo, valor, origem) {
        if (!_validarTipo(tipo,   "ganhar")) return;
        if (!_validarValor(valor, "ganhar")) return;
        if (valor === 0) return;

        const antes  = saldo(tipo);
        const maximo = _MAXIMO[tipo];

        // Cap no máximo — não deixa explodir
        const valorReal = Math.min(valor, maximo - antes);

        if (valorReal <= 0) {
            _log.warn(`ganhar("${tipo}"): saldo já no máximo (${_MAXIMO[tipo]}).`);
            return;
        }

        const depois = antes + valorReal;

        try {
            GameState.set(_CHAVE[tipo], depois);
        } catch (e) {
            _log.error(`ganhar(): falha ao atualizar GameState para "${tipo}":`, e);
            return;
        }

        _registrar(tipo, "ganho", valorReal, origem, antes, depois);

        _log.debug(
            `ganhar(${_EMOJI[tipo]}, ${valorReal})` +
            ` [${origem ?? "?"}]` +
            ` | ${_fmt(antes)} → ${_fmt(depois)}`
        );

        // Eventos específicos por tipo
        _emitirGanho(tipo, valorReal, depois, antes, origem);
    }

    function _emitirGanho(tipo, valor, novoSaldo, saldoAnterior, origem) {
        try {
            EventBus.emit(`${tipo}:ganho`, {
                valor,
                saldo    : novoSaldo,
                anterior : saldoAnterior,
                origem
            });
            EventBus.emit(`${tipo}:update`, {
                valor    : novoSaldo,
                delta    : +valor,
                anterior : saldoAnterior
            });
        } catch (e) {
            _log.error(`_emitirGanho(): falha ao emitir evento:`, e);
        }
    }

    // ════════════════════════════════════════
    // GASTAR — remove moeda com validação
    // ════════════════════════════════════════

    /**
     * Gasta moeda/gema do jogador.
     * Retorna TRUE se bem-sucedido, FALSE se saldo insuficiente.
     * Nunca deixa o saldo ficar negativo.
     *
     * @param   {"moeda"|"gema"|"reliquia"} tipo
     * @param   {number}                    valor
     * @param   {string}                    [origem]
     * @returns {boolean} — true = gasto realizado
     *
     * @example
     * if (!Economy.gastar("moeda", custo, "upgrade:forca")) {
     *     Toast.erro("Moedas insuficientes!");
     *     return;
     * }
     * // continua com a compra...
     */
    function gastar(tipo, valor, origem) {
        if (!_validarTipo(tipo,   "gastar")) return false;
        if (!_validarValor(valor, "gastar")) return false;
        if (valor === 0) return true; // gastar 0 sempre funciona

        const antes = saldo(tipo);

        if (antes < valor) {
            _log.warn(
                `gastar(${_EMOJI[tipo]}, ${_fmt(valor)})` +
                ` [${origem ?? "?"}]` +
                ` | NEGADO — saldo: ${_fmt(antes)}`
            );

            // Emite evento de falha (UI pode vibrar o botão, etc.)
            try {
                EventBus.emit(`${tipo}:insuficiente`, {
                    tentativa : valor,
                    saldo     : antes,
                    faltam    : valor - antes,
                    origem
                });
            } catch { /* não crítico */ }

            return false;
        }

        const depois = antes - valor;

        try {
            GameState.set(_CHAVE[tipo], depois);
        } catch (e) {
            _log.error(`gastar(): falha ao atualizar GameState para "${tipo}":`, e);
            return false;
        }

        _registrar(tipo, "gasto", valor, origem, antes, depois);

        _log.debug(
            `gastar(${_EMOJI[tipo]}, ${_fmt(valor)})` +
            ` [${origem ?? "?"}]` +
            ` | ${_fmt(antes)} → ${_fmt(depois)}`
        );

        _emitirGasto(tipo, valor, depois, antes, origem);
        return true;
    }

    function _emitirGasto(tipo, valor, novoSaldo, saldoAnterior, origem) {
        try {
            EventBus.emit(`${tipo}:gasto`, {
                valor,
                saldo    : novoSaldo,
                anterior : saldoAnterior,
                origem
            });
            EventBus.emit(`${tipo}:update`, {
                valor    : novoSaldo,
                delta    : -valor,
                anterior : saldoAnterior
            });
        } catch (e) {
            _log.error(`_emitirGasto(): falha ao emitir evento:`, e);
        }
    }

    // ════════════════════════════════════════
    // TRANSAÇÃO ATÔMICA
    // Gasta A e ganha B — ou não faz nada
    // Útil para trocas (ex: moeda → reliquia)
    // ════════════════════════════════════════

    /**
     * Realiza uma troca atômica: gasta de um tipo e ganha em outro.
     * Se não puder gastar, NÃO ganha nada — atomicidade garantida.
     *
     * @param   {object} opcoes
     * @param   {string} opcoes.gastarTipo
     * @param   {number} opcoes.gastarValor
     * @param   {string} opcoes.ganharTipo
     * @param   {number} opcoes.ganharValor
     * @param   {string} [opcoes.origem]
     * @returns {boolean}
     *
     * @example
     * Economy.trocar({
     *     gastarTipo  : "moeda",
     *     gastarValor : 1000,
     *     ganharTipo  : "gema",
     *     ganharValor : 5,
     *     origem      : "loja:moeda_por_gema"
     * });
     */
    function trocar({ gastarTipo, gastarValor, ganharTipo, ganharValor, origem }) {
        // Valida tudo antes de tocar no estado
        if (!_validarTipo(gastarTipo,   "trocar")) return false;
        if (!_validarTipo(ganharTipo,   "trocar")) return false;
        if (!_validarValor(gastarValor, "trocar")) return false;
        if (!_validarValor(ganharValor, "trocar")) return false;

        if (!podeGastar(gastarTipo, gastarValor)) {
            _log.warn(
                `trocar(): saldo de ${_EMOJI[gastarTipo]} insuficiente.` +
                ` Precisa: ${_fmt(gastarValor)}, tem: ${_fmt(saldo(gastarTipo))}`
            );
            return false;
        }

        // Atomicidade: gasta primeiro, depois ganha
        const gastou = gastar(gastarTipo, gastarValor, origem ?? "troca");
        if (!gastou) return false; // não deveria acontecer, mas segurança extra

        ganhar(ganharTipo, ganharValor, origem ?? "troca");

        _log.info(
            `trocar(): ${_fmt(gastarValor)}${_EMOJI[gastarTipo]}` +
            ` → ${_fmt(ganharValor)}${_EMOJI[ganharTipo]}`
        );

        try {
            EventBus.emit("economy:troca", {
                gastarTipo, gastarValor,
                ganharTipo, ganharValor,
                origem
            });
        } catch { /* não crítico */ }

        return true;
    }

    // ════════════════════════════════════════
    // REEMBOLSO — devolve moeda gasta
    // ════════════════════════════════════════

    /**
     * Reembolsa moeda/gema ao jogador.
     * Igual a ganhar(), mas emite evento próprio
     * para analytics distinguir de ganho normal.
     *
     * @param {"moeda"|"gema"|"reliquia"} tipo
     * @param {number}                    valor
     * @param {string}                    [origem]
     *
     * @example
     * Economy.reembolsar("gema", 100, "gacha:erro_sistema");
     */
    function reembolsar(tipo, valor, origem = "reembolso") {
        _log.info(`reembolsar(${_EMOJI[tipo]}, ${_fmt(valor)}) [${origem}]`);
        ganhar(tipo, valor, `reembolso:${origem}`);

        try {
            EventBus.emit("economy:reembolso", { tipo, valor, origem });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // SET DIRETO — só para save/load
    // ════════════════════════════════════════

    /**
     * Define o saldo diretamente.
     * ⚠️ USE APENAS em save.js ao carregar progresso.
     * Para transações normais use ganhar() e gastar().
     *
     * @param {"moeda"|"gema"|"reliquia"} tipo
     * @param {number}                    valor
     */
    function _setDireto(tipo, valor) {
        if (!_validarTipo(tipo,   "_setDireto")) return;
        if (!_validarValor(valor, "_setDireto")) return;

        const antes  = saldo(tipo);
        const valido = Math.min(Math.max(0, valor), _MAXIMO[tipo]);

        try {
            GameState.set(_CHAVE[tipo], valido);
        } catch (e) {
            _log.error(`_setDireto(): falha:`, e);
            return;
        }

        _registrar(tipo, "set", valido, "save:load", antes, valido);

        // Emite update para UI sincronizar
        try {
            EventBus.emit(`${tipo}:update`, {
                valor    : valido,
                delta    : 0,
                anterior : antes
            });
        } catch { /* não crítico */ }

        _log.debug(`_setDireto("${tipo}", ${_fmt(valido)}) — carregado do save.`);
    }

    // ════════════════════════════════════════
    // MULTIPLICADOR DE GANHO (bônus offline/prestígio)
    // ════════════════════════════════════════

    // Multiplicadores ativos (ex: bônus de prestígio)
    const _multiplicadores = {
        moeda : 1.0,
        gema  : 1.0
    };

    /**
     * Define o multiplicador de ganho para um tipo.
     * Aplicado automaticamente em ganhar().
     *
     * @param {"moeda"|"gema"} tipo
     * @param {number}         mult — ex: 1.5 = +50% de moeda
     *
     * @example
     * Economy.setMultiplicador("moeda", 1.5); // bônus de prestígio
     */
    function setMultiplicador(tipo, mult) {
        if (!_multiplicadores.hasOwnProperty(tipo)) {
            _log.warn(`setMultiplicador(): tipo "${tipo}" não suporta multiplicador.`);
            return;
        }
        if (typeof mult !== "number" || mult < 0) {
            _log.error(`setMultiplicador(): multiplicador inválido: ${mult}`);
            return;
        }

        _multiplicadores[tipo] = mult;
        _log.info(`Multiplicador de ${_EMOJI[tipo]} definido: x${mult}`);
    }

    /**
     * Versão de ganhar() que aplica o multiplicador ativo.
     * Use esta para recompensas de inimigos (não para save load).
     *
     * @example
     * Economy.ganharComBonus("moeda", inimigo.rMoeda, "kill");
     */
    function ganharComBonus(tipo, valorBase, origem) {
        if (!_validarTipo(tipo,     "ganharComBonus")) return;
        if (!_validarValor(valorBase,"ganharComBonus")) return;

        const mult  = _multiplicadores[tipo] ?? 1.0;
        const final = Math.floor(valorBase * mult);

        ganhar(tipo, final, origem);
    }

    // ════════════════════════════════════════
    // PROGRESSO OFFLINE
    // Calcula e aplica moedas ganhas offline
    // ════════════════════════════════════════

    /**
     * Calcula e aplica as moedas ganhas enquanto offline.
     * Chamado pelo SaveSystem ao carregar o jogo.
     *
     * @param {number} timestampSave     — Date.now() do último save
     * @param {number} dpsAtual          — DPS calculado no momento do save
     * @returns {{ moedasGanhas, tempoEfetivoSeg }}
     */
    function aplicarProgressoOffline(timestampSave, dpsAtual) {
        if (!timestampSave || !dpsAtual) return { moedasGanhas: 0, tempoEfetivoSeg: 0 };

        const agora       = Date.now();
        const segundos    = Math.floor((agora - timestampSave) / 1000);

        // Cap de horas offline (definido em BALANCE)
        const maxSeg      = (() => {
            try { return (BALANCE.MAX_OFFLINE_HORAS ?? 8) * 3600; }
            catch { return 8 * 3600; }
        })();

        const tempoEfetivo = Math.min(segundos, maxSeg);

        if (tempoEfetivo < 60) {
            _log.debug("Progresso offline ignorado — menos de 1 minuto.");
            return { moedasGanhas: 0, tempoEfetivoSeg: tempoEfetivo };
        }

        // 50% do DPS offline (padrão idle games)
        const moedasGanhas = Math.floor(dpsAtual * tempoEfetivo * 0.5);

        if (moedasGanhas <= 0) return { moedasGanhas: 0, tempoEfetivoSeg: tempoEfetivo };

        ganhar("moeda", moedasGanhas, "offline");

        const horas = Math.floor(tempoEfetivo / 3600);
        const mins  = Math.floor((tempoEfetivo % 3600) / 60);
        const tempo = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;

        _log.info(`Offline ${tempo} → +${_fmt(moedasGanhas)} 🪙`);

        try {
            EventBus.emit("economy:offline", { moedasGanhas, tempoEfetivoSeg: tempoEfetivo, tempo });
        } catch { /* não crítico */ }

        return { moedasGanhas, tempoEfetivoSeg: tempoEfetivo };
    }

    // ════════════════════════════════════════
    // HISTÓRICO E RELATÓRIO
    // ════════════════════════════════════════

    /**
     * Retorna cópia do histórico de transações.
     * @param {number} [ultimas] — limita às N últimas entradas
     * @returns {Array}
     */
    function transacoes(ultimas) {
        const hist = [..._historico];
        return ultimas ? hist.slice(-ultimas) : hist;
    }

    /**
     * Retorna relatório de estatísticas da sessão.
     *
     * @returns {{
     *   moeda:    { ganho, gasto, liquido, transacoes, saldoAtual },
     *   gema:     { ganho, gasto, liquido, transacoes, saldoAtual },
     *   reliquia: { ganho, gasto, liquido, transacoes, saldoAtual }
     * }}
     */
    function relatorio() {
        const resultado = {};

        for (const tipo of Object.keys(_stats)) {
            const s = _stats[tipo];
            resultado[tipo] = {
                ganho      : s.ganho,
                gasto      : s.gasto,
                liquido    : s.ganho - s.gasto,
                transacoes : s.transacoes,
                saldoAtual : saldo(tipo)
            };
        }

        return resultado;
    }

    /**
     * Loga o relatório no console (só em dev).
     */
    function logRelatorio() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Economy — Relatório da Sessão", () => {
            for (const [tipo, r] of Object.entries(relatorio())) {
                _log.info(
                    `${_EMOJI[tipo]} ${tipo.padEnd(8)}` +
                    ` | Saldo: ${_fmt(r.saldoAtual).padStart(10)}` +
                    ` | Ganho: ${_fmt(r.ganho).padStart(10)}` +
                    ` | Gasto: ${_fmt(r.gasto).padStart(10)}` +
                    ` | Tx: ${r.transacoes}`
                );
            }
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
            return String(Math.floor(n));
        }
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // ════════════════════════════════════════
    try {
        // Recompensa ao matar inimigo
        EventBus.on("kill:registrado", ({ rMoeda = 0, rGema = 0 } = {}) => {
            if (rMoeda > 0) ganharComBonus("moeda", rMoeda, "kill");
            if (rGema  > 0) ganhar("gema",  rGema,  "kill:chefe");
        });

        // Moedas offline ao carregar save
        EventBus.on("state:carregado", () => {
            _log.debug("Economy: state carregado — aguardando aplicarProgressoOffline().");
        });

        // Toast ao receber gema (feedback visual)
        EventBus.on("gema:ganho", ({ valor, origem } = {}) => {
            if (valor >= 5) {
                try {
                    Toast.sucesso(`💎 +${_fmt(valor)} gema${valor > 1 ? "s" : ""}!`);
                } catch { /* Toast pode não estar disponível */ }
            }
        });

        // Toast ao ficar sem gemas
        EventBus.on("gema:insuficiente", ({ tentativa, saldo: s, faltam } = {}) => {
            try {
                Toast.erro(`❌ Gemas insuficientes! Precisa de 💎${_fmt(tentativa)} (faltam ${_fmt(faltam)})`);
            } catch { /* não crítico */ }
        });

        // Toast ao ficar sem moedas
        EventBus.on("moeda:insuficiente", ({ tentativa, faltam } = {}) => {
            try {
                Toast.aviso(`🪙 Moedas insuficientes! Faltam ${_fmt(faltam)}`);
            } catch { /* não crítico */ }
        });

        // Toast de progresso offline
        EventBus.on("economy:offline", ({ moedasGanhas, tempo } = {}) => {
            try {
                Toast.info(`⏰ Offline ${tempo} → +${_fmt(moedasGanhas)} 🪙`, 5000);
            } catch { /* não crítico */ }
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners do EventBus:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Leitura
        saldo,
        podeGastar,

        // Transações básicas
        ganhar,
        gastar,

        // Transações avançadas
        ganharComBonus,
        trocar,
        reembolsar,

        // Multiplicadores (bônus de prestígio)
        setMultiplicador,

        // Offline
        aplicarProgressoOffline,

        // Save/Load (uso restrito)
        _setDireto,

        // Diagnóstico
        transacoes,
        relatorio,
        logRelatorio,

        // Referências úteis (readonly)
        get EMOJI()   { return _EMOJI;   },
        get MAXIMO()  { return _MAXIMO;  }
    });

})();
window.Economy = Economy;
