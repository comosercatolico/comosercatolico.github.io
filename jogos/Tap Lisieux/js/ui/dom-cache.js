// ═══════════════════════════════════════════════════════════
//  DOM-CACHE.JS
//  Cache inteligente de elementos do DOM.
//
//  PROBLEMA QUE RESOLVE:
//  getElementById é lento quando chamado 60x por segundo.
//  Este módulo chama 1x e reutiliza o resultado.
//
//  FUNCIONALIDADES:
//  - get()        → busca e cacheia elemento por ID
//  - set()        → define textContent com segurança
//  - html()       → define innerHTML (com aviso de XSS)
//  - show()       → exibe elemento (flex por padrão)
//  - hide()       → esconde elemento
//  - toggle()     → mostra ou esconde condicionalmente
//  - addClass()   → adiciona classe CSS
//  - removeClass() → remove classe CSS
//  - toggleClass() → alterna classe CSS
//  - attr()       → lê ou define atributo
//  - invalidar()  → força novo getElementById
//  - limpar()     → limpa todo o cache
//  - existe()     → verifica se elemento existe no DOM
//  - query()      → querySelector com cache opcional
//
//  SEGURANÇA:
//  - html() loga aviso se detectar < ou > (XSS potencial)
//  - set() usa textContent (nunca interpreta HTML)
//
//  DIAGNÓSTICO (só em desenvolvimento):
//  - Conta hits e misses do cache
//  - Avisa sobre IDs não encontrados no DOM
//
//  Depende de: logger.js
//  Usado por: TODOS os arquivos de UI
// ═══════════════════════════════════════════════════════════

"use strict";

const DOM = (() => {

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════

    // Cache principal: id → HTMLElement
    const _cache = new Map();

    // Cache de querySelectors: seletor → HTMLElement
    const _queryCache = new Map();

    // Diagnóstico (zerado em produção para não ocupar memória)
    const _stats = {
        hits   : 0,
        misses : 0,
        nulos  : 0   // IDs não encontrados no DOM
    };

    // Sub-logger (depende de logger.js carregado antes)
    // Usa fallback seguro caso Logger ainda não exista
    const _log = (() => {
        const fallback = {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[DOM]", ...a),
            error : (...a) => console.error("[DOM]", ...a)
        };
        // Logger pode não estar disponível em testes unitários
        if (typeof Logger !== "undefined") return Logger.de("DOM");
        return fallback;
    })();

    // ════════════════════════════════════════
    // GET — NÚCLEO DO CACHE
    // ════════════════════════════════════════

    /**
     * Retorna o elemento com o ID fornecido.
     * Na primeira chamada, faz getElementById e armazena.
     * Nas chamadas seguintes, retorna do cache (O(1)).
     *
     * @param   {string}      id
     * @returns {HTMLElement|null}
     */
    function get(id) {
        if (_cache.has(id)) {
            _stats.hits++;
            return _cache.get(id);
        }

        // Miss — busca no DOM
        _stats.misses++;
        const el = document.getElementById(id);

        if (!el) {
            _stats.nulos++;
            // Avisa apenas em dev e apenas 1x por ID
            _log.warn(`Elemento não encontrado: #${id}`);
            // Armazena null para não repetir o aviso
            // (se o elemento for criado depois, use invalidar())
            _cache.set(id, null);
            return null;
        }

        _cache.set(id, el);
        _log.debug(`Cache miss → #${id} encontrado e cacheado.`);
        return el;
    }

    // ════════════════════════════════════════
    // CONTEÚDO
    // ════════════════════════════════════════

    /**
     * Define o textContent do elemento.
     * SEGURO contra XSS — nunca interpreta HTML.
     *
     * @param {string} id
     * @param {string|number} txt
     */
    function set(id, txt) {
        const el = get(id);
        if (!el) return;
        el.textContent = txt;
    }

    /**
     * Define o innerHTML do elemento.
     * ⚠️ ATENÇÃO: só use com HTML gerado internamente,
     * NUNCA com dados do usuário sem sanitização.
     *
     * @param {string} id
     * @param {string} htmlStr
     */
    function html(id, htmlStr) {
        const el = get(id);
        if (!el) return;

        // Aviso de segurança em dev se parecer dado externo
        if (
            typeof Logger !== "undefined" &&
            Logger.isDev &&
            /<script/i.test(htmlStr)
        ) {
            _log.warn(`html() com <script> detectado em #${id} — possível XSS!`);
        }

        el.innerHTML = htmlStr;
    }

    // ════════════════════════════════════════
    // VISIBILIDADE
    // ════════════════════════════════════════

    /**
     * Exibe o elemento.
     * @param {string} id
     * @param {string} [displayVal="flex"] — valor de display
     */
    function show(id, displayVal = "flex") {
        const el = get(id);
        if (el) el.style.display = displayVal;
    }

    /**
     * Esconde o elemento (display: none).
     * @param {string} id
     */
    function hide(id) {
        const el = get(id);
        if (el) el.style.display = "none";
    }

    /**
     * Mostra ou esconde o elemento condicionalmente.
     *
     * DOM.toggle("meuEl", condicao);
     * DOM.toggle("meuEl", condicao, "block"); // display customizado
     *
     * @param {string}  id
     * @param {boolean} visivel
     * @param {string}  [displayVal="flex"]
     */
    function toggle(id, visivel, displayVal = "flex") {
        const el = get(id);
        if (el) el.style.display = visivel ? displayVal : "none";
    }

    // ════════════════════════════════════════
    // CLASSES CSS
    // ════════════════════════════════════════

    /**
     * Adiciona uma ou mais classes ao elemento.
     * @param {string}    id
     * @param {...string} classes
     */
    function addClass(id, ...classes) {
        const el = get(id);
        if (el) el.classList.add(...classes);
    }

    /**
     * Remove uma ou mais classes do elemento.
     * @param {string}    id
     * @param {...string} classes
     */
    function removeClass(id, ...classes) {
        const el = get(id);
        if (el) el.classList.remove(...classes);
    }

    /**
     * Adiciona a classe se `ativo` for true, remove se false.
     *
     * DOM.toggleClass("btnMin", "minimizado", painelMin);
     *
     * @param {string}  id
     * @param {string}  classe
     * @param {boolean} ativo
     */
    function toggleClass(id, classe, ativo) {
        const el = get(id);
        if (el) el.classList.toggle(classe, ativo);
    }

    /**
     * Verifica se o elemento possui a classe.
     * @param   {string}  id
     * @param   {string}  classe
     * @returns {boolean}
     */
    function hasClass(id, classe) {
        const el = get(id);
        return el ? el.classList.contains(classe) : false;
    }

    // ════════════════════════════════════════
    // ATRIBUTOS
    // ════════════════════════════════════════

    /**
     * Lê ou define um atributo do elemento.
     *
     * DOM.attr("hpBarra", "aria-valuenow")        → lê
     * DOM.attr("hpBarra", "aria-valuenow", "75")  → define
     *
     * @param   {string}          id
     * @param   {string}          nome
     * @param   {string}          [valor]   — se omitido, lê o atributo
     * @returns {string|null|void}
     */
    function attr(id, nome, valor) {
        const el = get(id);
        if (!el) return null;
        if (valor === undefined) return el.getAttribute(nome);
        el.setAttribute(nome, valor);
    }

    /**
     * Remove um atributo do elemento.
     * @param {string} id
     * @param {string} nome
     */
    function removeAttr(id, nome) {
        const el = get(id);
        if (el) el.removeAttribute(nome);
    }

    // ════════════════════════════════════════
    // ESTILO INLINE
    // ════════════════════════════════════════

    /**
     * Define uma propriedade de estilo diretamente.
     *
     * DOM.style("hpInimigo", "width", pct + "%");
     * DOM.style("btnForca",  "boxShadow", "0 0 8px gold");
     *
     * @param {string} id
     * @param {string} propriedade — camelCase (ex: "backgroundColor")
     * @param {string} valor
     */
    function style(id, propriedade, valor) {
        const el = get(id);
        if (el) el.style[propriedade] = valor;
    }

    // ════════════════════════════════════════
    // HABILITADO / DESABILITADO
    // ════════════════════════════════════════

    /**
     * Habilita ou desabilita um botão/input.
     *
     * DOM.setDisabled("btnForca", moeda < custo);
     *
     * @param {string}  id
     * @param {boolean} desabilitado
     */
    function setDisabled(id, desabilitado) {
        const el = get(id);
        if (el) el.disabled = desabilitado;
    }

    // ════════════════════════════════════════
    // QUERY SELECTOR COM CACHE
    // ════════════════════════════════════════

    /**
     * querySelector com cache opcional.
     * Use quando não há ID mas há seletor CSS único.
     *
     * DOM.query(".abaRodapeBtn.ativa") → HTMLElement|null
     *
     * @param   {string}       seletor
     * @param   {boolean}      [cachear=false] — cuidado: só cacheia se o elemento não muda
     * @returns {HTMLElement|null}
     */
    function query(seletor, cachear = false) {
        if (cachear && _queryCache.has(seletor)) {
            return _queryCache.get(seletor);
        }

        const el = document.querySelector(seletor);

        if (cachear && el) {
            _queryCache.set(seletor, el);
        }

        return el;
    }

    /**
     * querySelectorAll — sempre sem cache (retorna NodeList viva).
     * @param   {string}   seletor
     * @returns {NodeList}
     */
    function queryAll(seletor) {
        return document.querySelectorAll(seletor);
    }

    // ════════════════════════════════════════
    // EXISTÊNCIA
    // ════════════════════════════════════════

    /**
     * Verifica se o elemento existe no DOM.
     * Não armazena null no cache se não existir.
     *
     * @param   {string}  id
     * @returns {boolean}
     */
    function existe(id) {
        return document.getElementById(id) !== null;
    }

    // ════════════════════════════════════════
    // GERENCIAMENTO DE CACHE
    // ════════════════════════════════════════

    /**
     * Remove um ID do cache, forçando novo getElementById
     * na próxima chamada. Use quando o elemento for
     * removido e recriado dinamicamente.
     *
     * @param {string} id
     */
    function invalidar(id) {
        if (_cache.has(id)) {
            _cache.delete(id);
            _log.debug(`Cache invalidado: #${id}`);
        }
        if (_queryCache.has(id)) {
            _queryCache.delete(id);
        }
    }

    /**
     * Invalida múltiplos IDs de uma vez.
     * @param {...string} ids
     */
    function invalidarVarios(...ids) {
        ids.forEach(invalidar);
    }

    /**
     * Limpa TODO o cache.
     * Use após navegação de tela ou recriação de UI inteira.
     */
    function limpar() {
        const tamanho = _cache.size;
        _cache.clear();
        _queryCache.clear();
        _log.debug(`Cache limpo. ${tamanho} entradas removidas.`);
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas de uso do cache.
     * Útil para detectar IDs incorretos ou elementos faltando.
     *
     * @returns {{ hits, misses, nulos, tamanho, taxaAcerto }}
     */
    function stats() {
        const total     = _stats.hits + _stats.misses;
        const taxaAcerto = total > 0
            ? (((_stats.hits / total) * 100).toFixed(1) + "%")
            : "N/A";

        return {
            hits      : _stats.hits,
            misses    : _stats.misses,
            nulos     : _stats.nulos,
            tamanho   : _cache.size,
            taxaAcerto
        };
    }

    /**
     * Loga as estatísticas no console (só dev).
     */
    function logStats() {
        if (typeof Logger === "undefined" || !Logger.isDev) return;
        const s = stats();
        _log.info(
            `Cache stats → Hits: ${s.hits} | Misses: ${s.misses}` +
            ` | Nulos: ${s.nulos} | Tamanho: ${s.tamanho}` +
            ` | Taxa de acerto: ${s.taxaAcerto}`
        );
    }

    /**
     * Lista todos os IDs cacheados atualmente.
     * @returns {string[]}
     */
    function listarCacheados() {
        return [..._cache.keys()];
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO DA API PÚBLICA
    // ════════════════════════════════════════
    return Object.freeze({
        // Núcleo
        get,

        // Conteúdo
        set,
        html,

        // Visibilidade
        show,
        hide,
        toggle,

        // Classes
        addClass,
        removeClass,
        toggleClass,
        hasClass,

        // Atributos
        attr,
        removeAttr,

        // Estilo inline
        style,

        // Estado
        setDisabled,

        // Query
        query,
        queryAll,

        // Existência
        existe,

        // Cache
        invalidar,
        invalidarVarios,
        limpar,

        // Diagnóstico
        stats,
        logStats,
        listarCacheados
    });

})();
