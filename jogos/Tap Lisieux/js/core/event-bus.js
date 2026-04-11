// ═══════════════════════════════════════════════════════════
//  EVENT-BUS.JS
//  Sistema de eventos global (pub/sub).
//  Permite que módulos se comuniquem sem se conhecer.
//
//  FUNCIONALIDADES:
//  - on()      → assina um evento (com opção de executar 1x só)
//  - once()    → assina e remove automaticamente após 1 disparo
//  - off()     → cancela assinatura
//  - emit()    → dispara evento para todos os assinantes
//  - onAny()   → escuta TODOS os eventos (debug/log global)
//  - offAny()  → remove listener global
//  - clear()   → remove todos os listeners de um evento
//  - clearAll() → remove absolutamente tudo
//  - waitFor() → Promise que resolve no próximo emit do evento
//  - listeners() → lista listeners registrados (diagnóstico)
//
//  SEGURANÇA:
//  - Erros em listeners não derrubam os outros
//  - Cada erro é capturado e logado individualmente
//  - Emissão de evento sem listeners é silenciosa
//
//  DIAGNÓSTICO (só em dev):
//  - Avisa sobre eventos emitidos sem nenhum listener
//  - Conta total de emissões por evento
//  - Logger integrado com fallback seguro
//
//  EVENTOS DO JOGO (convenção de nomenclatura):
//  - "modulo:acao"       → ex: "moeda:update", "estagio:avancou"
//  - "modulo:acao:dado"  → ex: "gacha:pull:lendario"
//
//  Depende de: logger.js (opcional — fallback seguro)
//  Usado por: TODOS os outros arquivos
// ═══════════════════════════════════════════════════════════

"use strict";

const EventBus = (() => {

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════

    // Mapa principal: evento → [ { fn, once } ]
    const _listeners = new Map();

    // Listeners globais — escutam todos os eventos
    const _anyListeners = new Set();

    // Estatísticas por evento (diagnóstico)
    const _stats = new Map(); // evento → { emissoes, listeners }

    // ════════════════════════════════════════
    // LOGGER (fallback seguro)
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("EventBus"); }
        catch { return {
            debug : () => {},
            warn  : (...a) => console.warn("[EventBus]",  ...a),
            error : (...a) => console.error("[EventBus]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // VALIDAÇÃO
    // ════════════════════════════════════════
    function _validar(evento, fn, metodo) {
        if (typeof evento !== "string" || evento.trim() === "") {
            _log.error(`${metodo}(): evento deve ser uma string não vazia.`);
            return false;
        }
        if (fn !== undefined && typeof fn !== "function") {
            _log.error(`${metodo}(): listener deve ser uma função. Recebido: ${typeof fn}`);
            return false;
        }
        return true;
    }

    // ════════════════════════════════════════
    // ON — assina um evento
    // ════════════════════════════════════════

    /**
     * Assina um evento. O listener é chamado toda vez que
     * o evento for emitido.
     *
     * @param   {string}   evento
     * @param   {Function} fn       — callback(dados)
     * @param   {object}   [opcoes]
     * @param   {boolean}  [opcoes.once=false] — remove após 1 disparo
     * @returns {Function}           — função para cancelar a assinatura
     *
     * @example
     * const cancelar = EventBus.on("moeda:update", ({ valor }) => {
     *     DOM.set("hudMoedaVal", formatarNum(valor));
     * });
     * // Mais tarde:
     * cancelar(); // equivale a EventBus.off("moeda:update", fn)
     */
    function on(evento, fn, { once = false } = {}) {
        if (!_validar(evento, fn, "on")) return () => {};

        if (!_listeners.has(evento)) {
            _listeners.set(evento, []);
        }

        const entrada = { fn, once };
        _listeners.get(evento).push(entrada);

        // Atualiza stats
        if (!_stats.has(evento)) _stats.set(evento, { emissoes: 0 });

        _log.debug(`on("${evento}") — total: ${_listeners.get(evento).length} listener(s)`);

        // Retorna função de cancelamento (unsubscribe)
        return () => _removerEntrada(evento, entrada);
    }

    // ════════════════════════════════════════
    // ONCE — assina e remove após 1 disparo
    // ════════════════════════════════════════

    /**
     * Assina um evento e remove o listener automaticamente
     * após o primeiro disparo.
     *
     * @param   {string}   evento
     * @param   {Function} fn
     * @returns {Function}  — função para cancelar antes de disparar
     *
     * @example
     * EventBus.once("batalha:iniciou", () => {
     *     console.log("Primeira batalha iniciada!");
     * });
     */
    function once(evento, fn) {
        return on(evento, fn, { once: true });
    }

    // ════════════════════════════════════════
    // OFF — cancela assinatura
    // ════════════════════════════════════════

    /**
     * Remove um listener de um evento.
     * Usa comparação por referência de função.
     *
     * @param {string}   evento
     * @param {Function} fn — a mesma referência passada no on()
     *
     * @example
     * function onMoeda(dados) { ... }
     * EventBus.on("moeda:update", onMoeda);
     * EventBus.off("moeda:update", onMoeda); // remove
     */
    function off(evento, fn) {
        if (!_validar(evento, fn, "off")) return;

        const lista = _listeners.get(evento);
        if (!lista) {
            _log.warn(`off("${evento}"): evento não possui listeners.`);
            return;
        }

        const antes = lista.length;
        const nova  = lista.filter(e => e.fn !== fn);

        if (nova.length === antes) {
            _log.warn(`off("${evento}"): listener não encontrado. Verifique a referência.`);
        }

        if (nova.length === 0) {
            _listeners.delete(evento);
        } else {
            _listeners.set(evento, nova);
        }

        _log.debug(`off("${evento}") — removido. Restam: ${nova.length}`);
    }

    // ════════════════════════════════════════
    // REMOVER ENTRADA (interno)
    // ════════════════════════════════════════
    function _removerEntrada(evento, entrada) {
        const lista = _listeners.get(evento);
        if (!lista) return;

        const nova = lista.filter(e => e !== entrada);

        if (nova.length === 0) {
            _listeners.delete(evento);
        } else {
            _listeners.set(evento, nova);
        }
    }

    // ════════════════════════════════════════
    // EMIT — dispara evento
    // ════════════════════════════════════════

    /**
     * Dispara um evento, chamando todos os listeners registrados.
     * Erros em listeners individuais são capturados e logados,
     * sem interromper os outros listeners.
     *
     * @param {string} evento
     * @param {*}      [dados]  — qualquer valor passado aos listeners
     *
     * @example
     * EventBus.emit("moeda:update",  { valor: moeda, delta: +50 });
     * EventBus.emit("estagio:avancou", { estagio: 5 });
     * EventBus.emit("kill:registrado");
     */
    function emit(evento, dados) {
        if (!_validar(evento, undefined, "emit")) return;

        const lista = _listeners.get(evento);

        // Avisa sobre eventos órfãos (só em dev)
        if (!lista || lista.length === 0) {
            _log.debug(`emit("${evento}"): nenhum listener registrado.`);
        }

        // Atualiza contador de emissões
        const stat = _stats.get(evento);
        if (stat) stat.emissoes++;

        // ── Listeners globais (onAny) ──
        _anyListeners.forEach(fn => {
            try { fn(evento, dados); }
            catch (e) {
                _log.error(`Erro em listener onAny para "${evento}":`, e);
            }
        });

        if (!lista || lista.length === 0) return;

        // Cópia da lista para suportar modificações durante iteração
        // (ex: once() remove o listener durante o emit)
        const copia      = [...lista];
        const paraRemover = [];

        copia.forEach(entrada => {
            try {
                entrada.fn(dados);
            } catch (e) {
                _log.error(`Erro em listener de "${evento}":`, e);
            }

            if (entrada.once) {
                paraRemover.push(entrada);
            }
        });

        // Remove os once() usados
        paraRemover.forEach(entrada => _removerEntrada(evento, entrada));
    }

    // ════════════════════════════════════════
    // ON ANY — escuta todos os eventos
    // ════════════════════════════════════════

    /**
     * Registra um listener que recebe TODOS os eventos emitidos.
     * Útil para logging global, analytics, ou debug.
     *
     * @param   {Function} fn — callback(evento, dados)
     * @returns {Function}     — função para cancelar
     *
     * @example
     * const cancelar = EventBus.onAny((evento, dados) => {
     *     Logger.debug(`[Event] ${evento}`, dados);
     * });
     */
    function onAny(fn) {
        if (typeof fn !== "function") {
            _log.error("onAny(): argumento deve ser uma função.");
            return () => {};
        }
        _anyListeners.add(fn);
        _log.debug(`onAny() registrado. Total: ${_anyListeners.size}`);
        return () => offAny(fn);
    }

    /**
     * Remove um listener global registrado com onAny().
     * @param {Function} fn
     */
    function offAny(fn) {
        _anyListeners.delete(fn);
        _log.debug(`offAny() removido. Total: ${_anyListeners.size}`);
    }

    // ════════════════════════════════════════
    // WAIT FOR — Promise que resolve no próximo emit
    // ════════════════════════════════════════

    /**
     * Retorna uma Promise que resolve com os dados
     * do próximo disparo do evento.
     *
     * Útil para sequências assíncronas ou testes.
     *
     * @param   {string} evento
     * @param   {number} [timeoutMs=0] — rejeita após N ms (0 = sem timeout)
     * @returns {Promise<*>}
     *
     * @example
     * const dados = await EventBus.waitFor("batalha:terminou");
     * console.log("Batalha terminou com:", dados);
     *
     * // Com timeout:
     * try {
     *     await EventBus.waitFor("batalha:terminou", 5000);
     * } catch {
     *     console.log("Batalha não terminou em 5s");
     * }
     */
    function waitFor(evento, timeoutMs = 0) {
        return new Promise((resolve, reject) => {
            let timerTimeout = null;

            const cancelar = once(evento, (dados) => {
                if (timerTimeout) clearTimeout(timerTimeout);
                resolve(dados);
            });

            if (timeoutMs > 0) {
                timerTimeout = setTimeout(() => {
                    cancelar();
                    reject(new Error(
                        `[EventBus] waitFor("${evento}") expirou após ${timeoutMs}ms`
                    ));
                }, timeoutMs);
            }
        });
    }

    // ════════════════════════════════════════
    // CLEAR — remove listeners
    // ════════════════════════════════════════

    /**
     * Remove TODOS os listeners de um evento específico.
     * @param {string} evento
     */
    function clear(evento) {
        if (!_validar(evento, undefined, "clear")) return;

        const tinha = _listeners.has(evento);
        _listeners.delete(evento);

        if (tinha) {
            _log.debug(`clear("${evento}"): todos os listeners removidos.`);
        } else {
            _log.warn(`clear("${evento}"): evento não tinha listeners.`);
        }
    }

    /**
     * Remove absolutamente todos os listeners de todos os eventos.
     * Use com cuidado — normalmente só em testes ou reset total.
     */
    function clearAll() {
        const total = [..._listeners.values()]
            .reduce((acc, lista) => acc + lista.length, 0);

        _listeners.clear();
        _anyListeners.clear();
        _stats.clear();

        _log.warn(`clearAll(): ${total} listener(s) removidos de todos os eventos.`);
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Lista todos os eventos registrados e quantos
     * listeners cada um possui.
     *
     * @returns {Array<{ evento, total, emissoes }>}
     */
    function listeners() {
        const resultado = [];

        _listeners.forEach((lista, evento) => {
            resultado.push({
                evento,
                total   : lista.length,
                emissoes: _stats.get(evento)?.emissoes ?? 0,
                ones    : lista.filter(e => e.once).length
            });
        });

        return resultado.sort((a, b) => b.emissoes - a.emissoes);
    }

    /**
     * Loga um resumo dos eventos registrados.
     * Chamado pelo Logger.logAmbiente() ou manualmente.
     */
    function logDiagnostico() {
        try {
            if (!Logger.isDev) return;
        } catch { return; }

        const lista = listeners();

        if (lista.length === 0) {
            _log.debug("Nenhum evento registrado.");
            return;
        }

        Logger.grupo("EventBus — Diagnóstico", () => {
            lista.forEach(({ evento, total, emissoes, ones }) => {
                _log.debug(
                    `"${evento}" → ${total} listener(s)` +
                    (ones    > 0 ? ` (${ones} once)`      : "") +
                    (emissoes > 0 ? ` · ${emissoes} emissões` : "")
                );
            });
        }, true);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Core
        on,
        once,
        off,
        emit,

        // Global
        onAny,
        offAny,

        // Async
        waitFor,

        // Limpeza
        clear,
        clearAll,

        // Diagnóstico
        listeners,
        logDiagnostico
    });

})();
