// ═══════════════════════════════════════════════════════════
//  LOGGER.JS
//  Sistema de log inteligente.
//
//  COMPORTAMENTO:
//  - localhost / 127.0.0.1 → mostra TUDO (debug, info, warn, error)
//  - Produção              → mostra APENAS warn e error
//  - Mede performance de funções com Logger.perf()
//  - Agrupa logs relacionados com Logger.grupo()
//  - Histórico dos últimos N logs (útil para bug reports)
//  - Prefixo com módulo: Logger.de("Battle").info("msg")
//  - Em produção, erros críticos são enviáveis (hook externo)
//
//  NÍVEIS (do mais ao menos verboso):
//    DEBUG  → só localhost, detalhes internos
//    INFO   → eventos normais do jogo
//    WARN   → situações inesperadas mas recuperáveis
//    ERROR  → falhas que afetam o jogador
//
//  Usado por: todos os arquivos (opcional mas recomendado)
// ═══════════════════════════════════════════════════════════

"use strict";

const Logger = (() => {

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════

    // Detecta ambiente automaticamente
    const _DEV = (
        location.hostname === "localhost"      ||
        location.hostname === "127.0.0.1"      ||
        location.hostname === ""               ||  // file://
        location.search.includes("debug=true")    // ?debug=true força em produção
    );

    // Níveis numéricos para comparação
    const NIVEL = Object.freeze({
        DEBUG : 0,
        INFO  : 1,
        WARN  : 2,
        ERROR : 3,
        SILENT: 4   // desliga tudo
    });

    // Nível mínimo por ambiente
    const _nivelMinimo = _DEV ? NIVEL.DEBUG : NIVEL.WARN;

    // Histórico circular (últimas N entradas)
    const _HISTORICO_MAX = 200;
    const _historico = [];

    // Hook opcional para envio a serviço externo (ex: Sentry)
    // Logger.setOnError(fn) — chamado em todo ERROR
    let _onError = null;

    // ════════════════════════════════════════
    // ESTILOS DO CONSOLE (só navegadores)
    // ════════════════════════════════════════
    const ESTILOS = Object.freeze({
        DEBUG : "color:#888;font-size:11px",
        INFO  : "color:#4a8fff;font-weight:600",
        WARN  : "color:#f5a623;font-weight:700",
        ERROR : "color:#ff4444;font-weight:700;font-size:13px",
        PERF  : "color:#44ff88;font-weight:600",
        GRUPO : "color:#b44dff;font-weight:700"
    });

    // ════════════════════════════════════════
    // FUNÇÃO CENTRAL DE LOG
    // ════════════════════════════════════════
    function _log(nivel, modulo, args) {
        if (nivel < _nivelMinimo) return;

        const nomesNivel = ["DEBUG", "INFO", "WARN", "ERROR"];
        const nomeN      = nomesNivel[nivel] ?? "INFO";
        const estilo     = ESTILOS[nomeN];
        const agora      = new Date();

        // Timestamp HH:MM:SS.mmm
        const ts = agora.toTimeString().slice(0, 8)
                 + "." + String(agora.getMilliseconds()).padStart(3, "0");

        const prefixo = modulo
            ? `[${ts}] [${nomeN}] [${modulo}]`
            : `[${ts}] [${nomeN}]`;

        // Guarda no histórico
        _historico.push({
            nivel:     nomeN,
            modulo:    modulo ?? "global",
            mensagem:  args.map(a => {
                try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
                catch { return "[objeto circular]"; }
            }).join(" "),
            timestamp: agora.toISOString()
        });

        // Remove entradas antigas
        if (_historico.length > _HISTORICO_MAX) _historico.shift();

        // Chama o console nativo correto
        if (nivel === NIVEL.DEBUG) {
            console.debug(`%c${prefixo}`, estilo, ...args);
        } else if (nivel === NIVEL.INFO) {
            console.info(`%c${prefixo}`, estilo, ...args);
        } else if (nivel === NIVEL.WARN) {
            console.warn(`%c${prefixo}`, estilo, ...args);
        } else if (nivel === NIVEL.ERROR) {
            console.error(`%c${prefixo}`, estilo, ...args);
            // Dispara hook externo se registrado
            if (typeof _onError === "function") {
                try {
                    _onError({
                        modulo:    modulo ?? "global",
                        mensagem:  args[0],
                        detalhes:  args.slice(1),
                        timestamp: agora.toISOString()
                    });
                } catch { /* hook não pode quebrar o jogo */ }
            }
        }
    }

    // ════════════════════════════════════════
    // API PÚBLICA — USO DIRETO
    // ════════════════════════════════════════

    /**
     * Logger.debug("msg", dados)
     * Só aparece em localhost. Use para rastrear lógica interna.
     */
    function debug(...args) { _log(NIVEL.DEBUG, null, args); }

    /**
     * Logger.info("msg", dados)
     * Eventos normais: save carregado, batalha iniciada, etc.
     */
    function info(...args) { _log(NIVEL.INFO, null, args); }

    /**
     * Logger.warn("msg", dados)
     * Situações inesperadas mas o jogo continua funcionando.
     * Ex: save com versão antiga, asset não carregado.
     */
    function warn(...args) { _log(NIVEL.WARN, null, args); }

    /**
     * Logger.error("msg", dados)
     * Falhas que afetam o jogador. Sempre aparece.
     * Ex: erro ao salvar, falha em EventBus.
     */
    function error(...args) { _log(NIVEL.ERROR, null, args); }

    // ════════════════════════════════════════
    // LOGGER COM MÓDULO
    // Retorna um sub-logger com prefixo fixo
    //
    // Uso:
    //   const log = Logger.de("Battle");
    //   log.info("Batalha iniciada");
    //   log.warn("HP negativo corrigido");
    //   log.error("Falha ao configurar inimigo", e);
    // ════════════════════════════════════════
    function de(nomeModulo) {
        const modulo = String(nomeModulo);
        return {
            debug : (...args) => _log(NIVEL.DEBUG, modulo, args),
            info  : (...args) => _log(NIVEL.INFO,  modulo, args),
            warn  : (...args) => _log(NIVEL.WARN,  modulo, args),
            error : (...args) => _log(NIVEL.ERROR, modulo, args),

            /**
             * Mede o tempo de uma função síncrona.
             * log.perf("calcDps", () => calcDps());
             */
            perf(label, fn) {
                return _perf(label, fn, modulo);
            },

            /**
             * Mede o tempo de uma função assíncrona.
             * await log.perfAsync("carregarAssets", async () => { ... });
             */
            perfAsync(label, fn) {
                return _perfAsync(label, fn, modulo);
            }
        };
    }

    // ════════════════════════════════════════
    // MEDIÇÃO DE PERFORMANCE
    // ════════════════════════════════════════

    /**
     * Mede o tempo de execução de uma função síncrona.
     *
     * Logger.perf("calcDps", () => calcDps());
     * → [PERF] [calcDps] 0.42ms
     *
     * Retorna o valor que a função retornar.
     */
    function _perf(label, fn, modulo = null) {
        if (!_DEV) return fn(); // sem overhead em produção

        const t0       = performance.now();
        let   resultado;

        try {
            resultado = fn();
        } finally {
            const ms      = (performance.now() - t0).toFixed(3);
            const prefixo = modulo ? `[PERF] [${modulo}] ${label}` : `[PERF] ${label}`;
            console.log(`%c${prefixo}: ${ms}ms`, ESTILOS.PERF);
        }

        return resultado;
    }

    function perf(label, fn) { return _perf(label, fn); }

    /**
     * Versão assíncrona do perf.
     *
     * await Logger.perfAsync("carregarAssets", async () => { ... });
     */
    async function _perfAsync(label, fn, modulo = null) {
        if (!_DEV) return fn();

        const t0       = performance.now();
        let   resultado;

        try {
            resultado = await fn();
        } finally {
            const ms      = (performance.now() - t0).toFixed(3);
            const prefixo = modulo ? `[PERF] [${modulo}] ${label}` : `[PERF] ${label}`;
            console.log(`%c${prefixo}: ${ms}ms`, ESTILOS.PERF);
        }

        return resultado;
    }

    function perfAsync(label, fn) { return _perfAsync(label, fn); }

    // ════════════════════════════════════════
    // GRUPOS DE LOG
    // Agrupa logs relacionados visualmente
    //
    // Logger.grupo("Inicialização", () => {
    //   Logger.info("Save carregado");
    //   Logger.info("Assets prontos");
    // });
    // ════════════════════════════════════════
    function grupo(titulo, fn, recolhido = false) {
        if (!_DEV) { fn(); return; }

        const prefixo = `%c[GRUPO] ${titulo}`;
        if (recolhido) console.groupCollapsed(prefixo, ESTILOS.GRUPO);
        else            console.group(prefixo,          ESTILOS.GRUPO);

        try { fn(); }
        finally { console.groupEnd(); }
    }

    // ════════════════════════════════════════
    // HISTÓRICO
    // Útil para exibir no painel de debug
    // ou enviar num bug report
    // ════════════════════════════════════════

    /**
     * Retorna cópia do histórico de logs.
     * @returns {Array<{nivel, modulo, mensagem, timestamp}>}
     */
    function obterHistorico() {
        return [..._historico];
    }

    /**
     * Retorna histórico filtrado por nível mínimo.
     * Logger.obterHistoricoFiltrado("WARN") → só warns e errors
     */
    function obterHistoricoFiltrado(nivelMin = "INFO") {
        const nivelN = NIVEL[nivelMin.toUpperCase()] ?? NIVEL.INFO;
        const mapa   = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        return _historico.filter(e => (mapa[e.nivel] ?? 0) >= nivelN);
    }

    /**
     * Exporta histórico como texto (para copiar e colar num report).
     */
    function exportarHistorico() {
        return _historico
            .map(e => `[${e.timestamp}] [${e.nivel}] [${e.modulo}] ${e.mensagem}`)
            .join("\n");
    }

    // ════════════════════════════════════════
    // HOOKS EXTERNOS
    // ════════════════════════════════════════

    /**
     * Registra callback chamado em todo Logger.error().
     * Use para integrar Sentry, LogRocket, etc.
     *
     * Logger.setOnError(({ modulo, mensagem, detalhes, timestamp }) => {
     *     Sentry.captureMessage(`[${modulo}] ${mensagem}`);
     * });
     */
    function setOnError(fn) {
        if (typeof fn !== "function") {
            warn("Logger.setOnError: argumento não é uma função.");
            return;
        }
        _onError = fn;
    }

    // ════════════════════════════════════════
    // INFORMAÇÕES DO AMBIENTE
    // ════════════════════════════════════════

    /**
     * Loga um resumo do ambiente ao iniciar o jogo.
     * Chamado automaticamente em main.js.
     */
    function logAmbiente() {
        if (!_DEV) return;

        grupo("🌹 Tap Lisieux — Ambiente", () => {
            info("Modo         :", _DEV ? "🛠 Desenvolvimento" : "🚀 Produção");
            info("URL          :", location.href);
            info("User Agent   :", navigator.userAgent);
            info("Tela         :", `${screen.width}x${screen.height} (devicePixelRatio: ${devicePixelRatio})`);
            info("Canvas       :", `${window.innerWidth}x${window.innerHeight}`);
            info("Idioma       :", navigator.language);
            info("Online       :", navigator.onLine);
        }, true); // recolhido por padrão
    }

    // ════════════════════════════════════════
    // BANNER DE INICIALIZAÇÃO
    // ════════════════════════════════════════
    if (_DEV) {
        console.log(
            "%c🌹 Logger inicializado — modo DESENVOLVIMENTO",
            "color:#44ff88;font-weight:700;font-size:13px;background:#0a0118;padding:4px 8px;border-radius:6px"
        );
        console.log(
            "%cUse ?debug=true na URL para ativar em produção",
            "color:#888;font-size:11px"
        );
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO DA API PÚBLICA
    // ════════════════════════════════════════
    return Object.freeze({
        // Logs diretos
        debug,
        info,
        warn,
        error,

        // Sub-logger com prefixo de módulo
        de,

        // Performance
        perf,
        perfAsync,

        // Agrupamento visual
        grupo,

        // Histórico
        obterHistorico,
        obterHistoricoFiltrado,
        exportarHistorico,

        // Hooks
        setOnError,

        // Utilitários
        logAmbiente,

        // Informações do ambiente (readonly)
        get isDev()   { return _DEV;          },
        get NIVEL()   { return NIVEL;          },
        get tamanhoHistorico() { return _historico.length; }
    });

})();
