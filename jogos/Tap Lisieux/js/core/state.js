// ═══════════════════════════════════════════════════════════
//  STATE.JS
//  Estado global centralizado do jogo.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, variáveis como "let moeda = 0" eram
//  declaradas soltas em game-batalha.js e acessadas por
//  outros arquivos via escopo global — frágil e impossível
//  de rastrear quem alterou o quê.
//
//  SOLUÇÃO:
//  Todo estado compartilhado vive aqui. Módulos leem via
//  GameState.get() e escrevem via GameState.set(), que
//  automaticamente emite eventos para a UI reagir.
//
//  FUNCIONALIDADES:
//  - get(chave)            → lê valor do estado
//  - set(chave, valor)     → define e emite evento de mudança
//  - increment(chave, n)   → atalho para números (moeda += n)
//  - decrement(chave, n)   → atalho para números (moeda -= n)
//  - patch(obj)            → atualiza múltiplas chaves de uma vez
//  - reset(chave)          → volta ao valor inicial de uma chave
//  - resetGrupo(grupo)     → volta um grupo (ex: "run") ao inicial
//  - snapshot()            → cópia completa do estado atual
//  - carregar(dados)       → restaura estado de um save
//  - assinar(chave, fn)    → escuta mudanças de uma chave específica
//
//  GRUPOS DE ESTADO:
//  - "run"       → reseta no prestígio (moeda, upgrades, estágio)
//  - "sessao"    → reseta ao fechar (emBatalha, hitState, etc.)
//  - "permanente"→ nunca reseta (gema, conquistas, heróis)
//
//  Depende de: constants.js, event-bus.js, logger.js
//  Usado por: economy.js, battle.js, ui-hud.js, save.js
// ═══════════════════════════════════════════════════════════

"use strict";

const GameState = (() => {

    // ════════════════════════════════════════
    // LOGGER (fallback seguro)
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("GameState"); }
        catch { return {
            debug : () => {},
            warn  : (...a) => console.warn("[GameState]",  ...a),
            error : (...a) => console.error("[GameState]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // ESTADO INICIAL
    // Fonte da verdade — todos os valores padrão
    // Agrupados por tipo de reset
    // ════════════════════════════════════════
    const _INICIAL = Object.freeze({

        // ── Permanente (nunca reseta) ────────
        gema              : BALANCE.GEMA_INICIAL,
        heroisObtidos     : [],
        equipamentosObtidos: [],
        itemEquipado      : null,
        conquistasIds     : [],        // IDs das conquistas desbloqueadas
        totalPrestígios   : 0,
        totalKills        : 0,
        totalUpgrades     : 0,
        nivelPersonagem   : 1,
        expPersonagem     : 0,
        expMaxPersonagem  : 100,
        pityGacha         : 0,

        // ── Run (reseta no prestígio) ────────
        moeda             : BALANCE.MOEDA_INICIAL,
        estagio           : 1,

        // Níveis de upgrade
        nivelForca        : 1,
        nivelRosa         : 1,
        nivelVelocidade   : 1,
        nivelDps          : 1,

        // ── Sessão (reseta ao sair da batalha) ──
        emBatalha         : false,
        hitStateTremendo  : 0,
        hitStateFlash     : 0,
        falaAtiva         : false,
        comboAtual        : 0,
        comboMultiplier   : 1.0,
        ultimoClique      : 0,

        // ── Configurações do jogador ─────────
        volumeMusica      : 0.5,
        volumeSfx         : 0.7,
        qualidade         : "baixa",
    });

    // Grupos de reset — indica quais chaves pertencem a cada grupo
    const _GRUPOS = Object.freeze({
        run: [
            "moeda", "estagio",
            "nivelForca", "nivelRosa", "nivelVelocidade", "nivelDps"
        ],
        sessao: [
            "emBatalha", "hitStateTremendo", "hitStateFlash",
            "falaAtiva", "comboAtual", "comboMultiplier", "ultimoClique"
        ],
        permanente: [
            "gema", "heroisObtidos", "equipamentosObtidos", "itemEquipado",
            "conquistasIds", "totalPrestígios", "totalKills", "totalUpgrades",
            "nivelPersonagem", "expPersonagem", "expMaxPersonagem", "pityGacha",
            "volumeMusica", "volumeSfx", "qualidade"
        ]
    });

    // ════════════════════════════════════════
    // ESTADO ATUAL (mutável, interno)
    // Cópia profunda do inicial para evitar
    // contaminação entre sessões de teste
    // ════════════════════════════════════════
    const _estado = _clonarInicial();

    function _clonarInicial() {
        const clone = {};
        for (const [chave, valor] of Object.entries(_INICIAL)) {
            // Arrays são clonados para não compartilhar referência
            clone[chave] = Array.isArray(valor) ? [...valor] : valor;
        }
        return clone;
    }

    // ════════════════════════════════════════
    // VALIDAÇÃO DE CHAVE
    // ════════════════════════════════════════
    function _chaveValida(chave, metodo) {
        if (typeof chave !== "string" || chave.trim() === "") {
            _log.error(`${metodo}(): chave deve ser uma string não vazia.`);
            return false;
        }
        if (!(chave in _INICIAL)) {
            _log.warn(`${metodo}("${chave}"): chave não existe no estado inicial. ` +
                      `Adicione-a em _INICIAL para evitar estado fantasma.`);
            // Não bloqueia — permite extensão dinâmica com aviso
        }
        return true;
    }

    // ════════════════════════════════════════
    // EMITIR EVENTO DE MUDANÇA
    // ════════════════════════════════════════
    function _emitirMudanca(chave, novoValor, valorAnterior) {
        try {
            // Evento específico da chave
            EventBus.emit(`state:${chave}`, {
                valor    : novoValor,
                anterior : valorAnterior
            });

            // Evento genérico (para observadores globais)
            EventBus.emit("state:changed", {
                chave,
                valor    : novoValor,
                anterior : valorAnterior
            });
        } catch (e) {
            _log.error(`Falha ao emitir evento de mudança para "${chave}":`, e);
        }
    }

    // ════════════════════════════════════════
    // GET — lê valor
    // ════════════════════════════════════════

    /**
     * Lê o valor atual de uma chave do estado.
     *
     * @param   {string} chave
     * @returns {*}
     *
     * @example
     * const moeda = GameState.get("moeda");     // 1500
     * const lista = GameState.get("heroisObtidos"); // [...]
     */
    function get(chave) {
        if (!_chaveValida(chave, "get")) return undefined;

        const valor = _estado[chave];

        // Arrays retornam cópia para evitar mutação externa acidental
        if (Array.isArray(valor)) return [...valor];

        return valor;
    }

    // ════════════════════════════════════════
    // SET — define valor e emite evento
    // ════════════════════════════════════════

    /**
     * Define o valor de uma chave e emite evento de mudança.
     * A UI reage automaticamente via EventBus.
     *
     * @param {string} chave
     * @param {*}      valor
     *
     * @example
     * GameState.set("moeda", 1500);
     * GameState.set("emBatalha", true);
     * GameState.set("heroisObtidos", [...lista, novoHeroi]);
     */
    function set(chave, valor) {
        if (!_chaveValida(chave, "set")) return;

        const anterior = _estado[chave];

        // Evita emissão desnecessária se o valor não mudou
        // (exceto arrays — sempre emite para simplificar)
        if (!Array.isArray(valor) && valor === anterior) return;

        _estado[chave] = Array.isArray(valor) ? [...valor] : valor;

        _log.debug(`set("${chave}"): ${_resumir(anterior)} → ${_resumir(valor)}`);

        _emitirMudanca(chave, _estado[chave], anterior);
    }

    // ════════════════════════════════════════
    // INCREMENT / DECREMENT
    // Atalhos para operações numéricas comuns
    // ════════════════════════════════════════

    /**
     * Incrementa uma chave numérica.
     * Equivale a: set(chave, get(chave) + n)
     *
     * @param {string} chave
     * @param {number} [n=1]
     *
     * @example
     * GameState.increment("moeda", 150);
     * GameState.increment("totalKills");
     */
    function increment(chave, n = 1) {
        if (!_chaveValida(chave, "increment")) return;

        const atual = _estado[chave];
        if (typeof atual !== "number") {
            _log.error(`increment("${chave}"): valor atual não é número (${typeof atual}).`);
            return;
        }
        if (typeof n !== "number" || isNaN(n)) {
            _log.error(`increment("${chave}"): incremento inválido: ${n}`);
            return;
        }

        set(chave, atual + n);
    }

    /**
     * Decrementa uma chave numérica.
     * Não deixa passar de zero por padrão (clampZero).
     *
     * @param {string}  chave
     * @param {number}  [n=1]
     * @param {boolean} [clampZero=false] — impede valor negativo
     *
     * @example
     * GameState.decrement("moeda", 100);
     * GameState.decrement("gema",  50, true); // nunca fica negativo
     */
    function decrement(chave, n = 1, clampZero = false) {
        if (!_chaveValida(chave, "decrement")) return;

        const atual = _estado[chave];
        if (typeof atual !== "number") {
            _log.error(`decrement("${chave}"): valor atual não é número (${typeof atual}).`);
            return;
        }

        const novo = clampZero ? Math.max(0, atual - n) : atual - n;
        set(chave, novo);
    }

    // ════════════════════════════════════════
    // PATCH — atualiza múltiplas chaves
    // ════════════════════════════════════════

    /**
     * Atualiza múltiplas chaves de uma vez.
     * Cada chave emite seu próprio evento.
     *
     * @param {object} obj — { chave: valor, ... }
     *
     * @example
     * GameState.patch({
     *     moeda  : 0,
     *     estagio: 1,
     *     nivelForca: 1
     * });
     */
    function patch(obj) {
        if (typeof obj !== "object" || obj === null) {
            _log.error("patch(): argumento deve ser um objeto.");
            return;
        }

        for (const [chave, valor] of Object.entries(obj)) {
            set(chave, valor);
        }
    }

    // ════════════════════════════════════════
    // PUSH — adiciona item a array
    // ════════════════════════════════════════

    /**
     * Adiciona um item a uma chave que é um array.
     *
     * @param {string} chave
     * @param {*}      item
     *
     * @example
     * GameState.push("heroisObtidos", novoHeroi);
     * GameState.push("conquistasIds", "primeiro_kill");
     */
    function push(chave, item) {
        if (!_chaveValida(chave, "push")) return;

        const atual = _estado[chave];
        if (!Array.isArray(atual)) {
            _log.error(`push("${chave}"): valor não é um array.`);
            return;
        }

        set(chave, [...atual, item]);
    }

    // ════════════════════════════════════════
    // RESET — volta ao valor inicial
    // ════════════════════════════════════════

    /**
     * Reseta uma chave ao seu valor inicial definido em _INICIAL.
     *
     * @param {string} chave
     *
     * @example
     * GameState.reset("moeda");   // moeda volta a 0
     * GameState.reset("estagio"); // estagio volta a 1
     */
    function reset(chave) {
        if (!_chaveValida(chave, "reset")) return;

        if (!(chave in _INICIAL)) {
            _log.warn(`reset("${chave}"): chave não tem valor inicial definido.`);
            return;
        }

        const valorInicial = _INICIAL[chave];
        set(chave, Array.isArray(valorInicial) ? [...valorInicial] : valorInicial);

        _log.debug(`reset("${chave}") → ${_resumir(valorInicial)}`);
    }

    /**
     * Reseta todas as chaves de um grupo ao valor inicial.
     *
     * Grupos disponíveis: "run", "sessao", "permanente"
     *
     * @param {string} grupo
     *
     * @example
     * GameState.resetGrupo("run");    // prestígio — reseta moeda, upgrades, estágio
     * GameState.resetGrupo("sessao"); // ao sair da batalha
     */
    function resetGrupo(grupo) {
        const chaves = _GRUPOS[grupo];
        if (!chaves) {
            _log.error(`resetGrupo("${grupo}"): grupo inválido. Use: run, sessao, permanente.`);
            return;
        }

        _log.debug(`resetGrupo("${grupo}"): resetando ${chaves.length} chave(s).`);
        chaves.forEach(reset);

        EventBus.emit(`state:reset:${grupo}`, { grupo, chaves });
    }

    /**
     * Reseta TUDO ao estado inicial.
     * Use apenas para "Resetar Save".
     */
    function resetTotal() {
        _log.warn("resetTotal(): estado completamente resetado!");

        for (const chave of Object.keys(_INICIAL)) {
            reset(chave);
        }

        EventBus.emit("state:reset:total");
    }

    // ════════════════════════════════════════
    // SNAPSHOT — cópia do estado para save
    // ════════════════════════════════════════

    /**
     * Retorna uma cópia profunda do estado atual.
     * Usado pelo SaveSystem para serializar o progresso.
     *
     * @returns {object}
     */
    function snapshot() {
        const copia = {};
        for (const [chave, valor] of Object.entries(_estado)) {
            copia[chave] = Array.isArray(valor) ? [...valor] : valor;
        }
        return copia;
    }

    // ════════════════════════════════════════
    // CARREGAR — restaura de um save
    // ════════════════════════════════════════

    /**
     * Restaura o estado a partir de dados de save.
     * Chaves desconhecidas são ignoradas com aviso.
     * Chaves ausentes mantêm o valor inicial.
     *
     * @param {object} dados — objeto vindo do localStorage
     *
     * @example
     * const save = SaveSystem.carregar();
     * if (save) GameState.carregar(save);
     */
    function carregar(dados) {
        if (typeof dados !== "object" || dados === null) {
            _log.error("carregar(): dados inválidos — esperava um objeto.");
            return;
        }

        let carregadas = 0;
        let ignoradas  = 0;

        for (const [chave, valor] of Object.entries(dados)) {
            if (!(chave in _INICIAL)) {
                _log.warn(`carregar(): chave desconhecida "${chave}" ignorada.`);
                ignoradas++;
                continue;
            }

            // Define sem emitir evento (carregamento silencioso)
            _estado[chave] = Array.isArray(valor) ? [...valor] : valor;
            carregadas++;
        }

        _log.debug(`carregar(): ${carregadas} chave(s) restauradas, ${ignoradas} ignoradas.`);

        // Emite 1 evento único ao final do carregamento
        EventBus.emit("state:carregado", snapshot());
    }

    // ════════════════════════════════════════
    // ASSINAR — observar mudança de 1 chave
    // ════════════════════════════════════════

    /**
     * Escuta mudanças de uma chave específica.
     * Atalho para EventBus.on("state:chave", fn).
     *
     * @param   {string}   chave
     * @param   {Function} fn — callback({ valor, anterior })
     * @returns {Function}     — cancelar assinatura
     *
     * @example
     * GameState.assinar("moeda", ({ valor }) => {
     *     DOM.set("hudMoedaVal", formatarNum(valor));
     * });
     *
     * GameState.assinar("emBatalha", ({ valor }) => {
     *     DOM.toggle("uiBatalha", valor);
     * });
     */
    function assinar(chave, fn) {
        if (!_chaveValida(chave, "assinar")) return () => {};
        return EventBus.on(`state:${chave}`, fn);
    }

    // ════════════════════════════════════════
    // UTILITÁRIOS INTERNOS
    // ════════════════════════════════════════

    // Resumo legível de um valor para logs
    function _resumir(valor) {
        if (valor === null)      return "null";
        if (valor === undefined) return "undefined";
        if (Array.isArray(valor)) return `Array(${valor.length})`;
        if (typeof valor === "object") return `{${Object.keys(valor).join(",")}}`;
        if (typeof valor === "string" && valor.length > 30) return `"${valor.slice(0, 30)}..."`;
        return String(valor);
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Loga o estado atual completo no console.
     * Só funciona em desenvolvimento.
     */
    function logEstado() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("GameState — Estado Atual", () => {
            const grupos = { permanente: {}, run: {}, sessao: {} };

            for (const [g, chaves] of Object.entries(_GRUPOS)) {
                chaves.forEach(c => {
                    grupos[g][c] = _estado[c];
                });
            }

            _log.debug("── Permanente:", grupos.permanente);
            _log.debug("── Run       :", grupos.run);
            _log.debug("── Sessão    :", grupos.sessao);
        }, true);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Leitura / escrita
        get,
        set,
        increment,
        decrement,
        patch,
        push,

        // Reset
        reset,
        resetGrupo,
        resetTotal,

        // Save
        snapshot,
        carregar,

        // Reatividade
        assinar,

        // Diagnóstico
        logEstado,

        // Referências somente leitura
        get GRUPOS()  { return _GRUPOS;  },
        get INICIAL() { return _INICIAL; }
    });

})();
