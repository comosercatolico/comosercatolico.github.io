// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/utils/utils.js
//  Funções utilitárias gerais — módulo base sem dependências
//
//  Exporta o objeto global Utils com:
//  - formatarNum()   — 1500 → "1.5K", suporte a T/B/M/K
//  - clamp()         — limita valor entre min e max
//  - lerp()          — interpolação linear suave
//  - lerpAngulo()    — interpolação de ângulos (wrap 360°)
//  - aleatorio()     — inteiro aleatório entre min e max
//  - aleatorioF()    — float  aleatório entre min e max
//  - chance()        — retorna true com probabilidade p (0-1)
//  - embaralhar()    — Fisher-Yates shuffle (não muta original)
//  - escolher()      — escolhe item aleatório de um array
//  - estaVisivel()   — checa se ponto está dentro do canvas
//  - retanguloContem()— colisão ponto × retângulo
//  - retanguloColide()— colisão retângulo × retângulo
//  - escaparHTML()   — previne XSS em innerHTML
//  - debounce()      — limita frequência de chamadas
//  - throttle()      — garante intervalo mínimo entre chamadas
//  - formatarTempo() — ms → "2h 30min" ou "45s"
//  - formatarData()  — Date → "dd/mm/aaaa hh:mm"
//  - deepClone()     — cópia profunda segura via structuredClone
//  - uuid()          — ID único simples (não criptográfico)
//  - memoize()       — cache de resultados de funções puras
//
//  Depende de: (nenhum — módulo base)
//  Usado por:  TODOS os outros módulos
// ═══════════════════════════════════════════════════════════

"use strict";

const Utils = (() => {

    // ════════════════════════════════════════
    //  FORMATAÇÃO DE NÚMEROS
    // ════════════════════════════════════════

    /**
     * Formata um número para exibição compacta.
     * Exemplos:
     *   999       → "999"
     *   1500      → "1.5K"
     *   1_000_000 → "1.0M"
     *   2_500_000_000 → "2.5B"
     *
     * @param  {number} n
     * @param  {number} [casas=1] — casas decimais
     * @returns {string}
     */
    function formatarNum(n, casas = 1) {
        if (typeof n !== "number" || !isFinite(n)) return "0";
        if (n < 0) return "-" + formatarNum(-n, casas);

        const fmt = (v, sufixo) => {
            const s = v.toFixed(casas);
            // Remove zeros desnecessários: "1.0K" → "1K", "1.50K" → "1.5K"
            const limpo = casas > 0
                ? s.replace(/\.?0+$/, "")
                : s;
            return limpo + sufixo;
        };

        if (n >= 1e15) return fmt(n / 1e15, "Qa");   // Quadrilhão
        if (n >= 1e12) return fmt(n / 1e12, "T");    // Trilhão
        if (n >= 1e9)  return fmt(n / 1e9,  "B");    // Bilhão
        if (n >= 1e6)  return fmt(n / 1e6,  "M");    // Milhão
        if (n >= 1e3)  return fmt(n / 1e3,  "K");    // Mil
        return Math.floor(n).toString();
    }

    /**
     * Formata um número com separador de milhar (para modais).
     * Exemplo: 1500000 → "1.500.000"
     *
     * @param  {number} n
     * @returns {string}
     */
    function formatarNumCompleto(n) {
        if (typeof n !== "number" || !isFinite(n)) return "0";
        return Math.floor(n).toLocaleString("pt-BR");
    }

    // ════════════════════════════════════════
    //  MATEMÁTICA
    // ════════════════════════════════════════

    /**
     * Limita `valor` entre `min` e `max`.
     *
     * @param  {number} valor
     * @param  {number} min
     * @param  {number} max
     * @returns {number}
     */
    function clamp(valor, min, max) {
        if (min > max) { const t = min; min = max; max = t; } // tolerante
        return Math.max(min, Math.min(max, valor));
    }

    /**
     * Interpolação linear entre `a` e `b` pelo fator `t` (0–1).
     * t=0 → a, t=1 → b, t=0.5 → meio.
     *
     * @param  {number} a
     * @param  {number} b
     * @param  {number} t  — fator (será clampado em 0–1)
     * @returns {number}
     */
    function lerp(a, b, t) {
        t = clamp(t, 0, 1);
        return a + (b - a) * t;
    }

    /**
     * Interpolação linear de ângulos em graus.
     * Garante o caminho mais curto (ex: 350° → 10° = +20°, não −340°).
     *
     * @param  {number} a  — ângulo atual (graus)
     * @param  {number} b  — ângulo alvo  (graus)
     * @param  {number} t  — fator 0–1
     * @returns {number}
     */
    function lerpAngulo(a, b, t) {
        let diff = ((b - a) % 360 + 540) % 360 - 180;
        return a + diff * clamp(t, 0, 1);
    }

    /**
     * Número inteiro aleatório entre `min` e `max` (ambos inclusivos).
     *
     * @param  {number} min
     * @param  {number} max
     * @returns {number}
     */
    function aleatorio(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Float aleatório entre `min` (inclusivo) e `max` (exclusivo).
     *
     * @param  {number} min
     * @param  {number} max
     * @returns {number}
     */
    function aleatorioF(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Retorna `true` com probabilidade `p` (0 = nunca, 1 = sempre).
     *
     * @param  {number} p  — probabilidade (0–1)
     * @returns {boolean}
     */
    function chance(p) {
        return Math.random() < clamp(p, 0, 1);
    }

    // ════════════════════════════════════════
    //  ARRAYS
    // ════════════════════════════════════════

    /**
     * Retorna uma cópia embaralhada do array (Fisher-Yates).
     * Não muta o array original.
     *
     * @param  {Array} arr
     * @returns {Array}
     */
    function embaralhar(arr) {
        const copia = [...arr];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    /**
     * Escolhe um elemento aleatório de um array.
     * Retorna `undefined` se o array estiver vazio.
     *
     * @param  {Array} arr
     * @returns {*}
     */
    function escolher(arr) {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ════════════════════════════════════════
    //  COLISÃO / VISIBILIDADE
    // ════════════════════════════════════════

    /**
     * Verifica se o ponto (px, py) está dentro do canvas
     * com margem opcional.
     *
     * @param  {number} px
     * @param  {number} py
     * @param  {HTMLCanvasElement} canvas
     * @param  {number} [margem=0]  — pixels extras de tolerância
     * @returns {boolean}
     */
    function estaVisivel(px, py, canvas, margem = 0) {
        return (
            px >= -margem &&
            py >= -margem &&
            px <= canvas.width  + margem &&
            py <= canvas.height + margem
        );
    }

    /**
     * Verifica se o ponto (px, py) está dentro de um retângulo.
     *
     * @param  {number} px
     * @param  {number} py
     * @param  {{ x, y, w, h }} rect
     * @returns {boolean}
     */
    function retanguloContem(px, py, rect) {
        return (
            px >= rect.x &&
            py >= rect.y &&
            px <= rect.x + rect.w &&
            py <= rect.y + rect.h
        );
    }

    /**
     * Verifica colisão AABB entre dois retângulos.
     *
     * @param  {{ x, y, w, h }} a
     * @param  {{ x, y, w, h }} b
     * @returns {boolean}
     */
    function retanguloColide(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    // ════════════════════════════════════════
    //  SEGURANÇA / HTML
    // ════════════════════════════════════════

    // Tabela de escape — criada uma vez, reutilizada
    const _escapeMap = Object.freeze({
        "&":  "&amp;",
        "<":  "&lt;",
        ">":  "&gt;",
        '"':  "&quot;",
        "'":  "&#x27;",
        "/":  "&#x2F;",
        "`":  "&#x60;",
        "=":  "&#x3D;"
    });
    const _escapeRegex = /[&<>"'`=/]/g;

    /**
     * Escapa caracteres especiais HTML para prevenir XSS.
     * Use sempre que inserir texto de usuário em innerHTML.
     *
     * @param  {*} valor  — qualquer tipo (convertido para string)
     * @returns {string}
     */
    function escaparHTML(valor) {
        return String(valor ?? "").replace(_escapeRegex, c => _escapeMap[c]);
    }

    // ════════════════════════════════════════
    //  CONTROLE DE FREQUÊNCIA
    // ════════════════════════════════════════

    /**
     * Debounce — executa `fn` somente após `ms` milissegundos
     * sem ser chamada novamente.
     * Útil para: resize, input de busca.
     *
     * @param  {Function} fn
     * @param  {number}   ms
     * @returns {Function}
     */
    function debounce(fn, ms) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    /**
     * Throttle — garante que `fn` seja chamada no máximo
     * 1 vez a cada `ms` milissegundos.
     * Útil para: scroll, mousemove, atualizações de UI.
     *
     * @param  {Function} fn
     * @param  {number}   ms
     * @returns {Function}
     */
    function throttle(fn, ms) {
        let ultima = 0;
        return function (...args) {
            const agora = performance.now();
            if (agora - ultima >= ms) {
                ultima = agora;
                fn.apply(this, args);
            }
        };
    }

    // ════════════════════════════════════════
    //  FORMATAÇÃO DE TEMPO
    // ════════════════════════════════════════

    /**
     * Formata milissegundos em string legível.
     * Exemplos:
     *   45000      → "45s"
     *   90000      → "1min 30s"
     *   3661000    → "1h 1min"
     *   86400000   → "1d 0h"
     *
     * @param  {number} ms
     * @returns {string}
     */
    function formatarTempo(ms) {
        if (typeof ms !== "number" || ms < 0) return "0s";

        const totalSeg = Math.floor(ms / 1000);
        const dias     = Math.floor(totalSeg / 86400);
        const horas    = Math.floor((totalSeg % 86400) / 3600);
        const mins     = Math.floor((totalSeg % 3600) / 60);
        const segs     = totalSeg % 60;

        if (dias  > 0) return `${dias}d ${horas}h`;
        if (horas > 0) return `${horas}h ${mins}min`;
        if (mins  > 0) return `${mins}min ${segs}s`;
        return `${segs}s`;
    }

    /**
     * Formata um objeto Date (ou timestamp) em "dd/mm/aaaa hh:mm".
     *
     * @param  {Date|number} data
     * @returns {string}
     */
    function formatarData(data) {
        const d = data instanceof Date ? data : new Date(data);
        if (isNaN(d.getTime())) return "—";

        const pad = n => String(n).padStart(2, "0");
        return (
            `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
    }

    // ════════════════════════════════════════
    //  UTILITÁRIOS DE OBJETO
    // ════════════════════════════════════════

    /**
     * Cópia profunda segura usando structuredClone (suporte moderno).
     * Fallback: JSON parse/stringify (perde funções e undefined).
     *
     * @param  {*} obj
     * @returns {*}
     */
    function deepClone(obj) {
        if (typeof structuredClone === "function") {
            return structuredClone(obj);
        }
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch {
            console.warn("[Utils.deepClone] Falha ao clonar objeto.");
            return obj;
        }
    }

    /**
     * Gera um ID único simples (não criptográfico).
     * Formato: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
     *
     * @returns {string}
     */
    function uuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Memoize — cacheia o resultado de uma função pura.
     * A chave do cache é baseada nos argumentos (JSON.stringify).
     * Cuidado: não usar com objetos muito grandes ou funções impuras.
     *
     * @param  {Function} fn
     * @returns {Function}
     */
    function memoize(fn) {
        const cache = new Map();
        return function (...args) {
            const chave = JSON.stringify(args);
            if (cache.has(chave)) return cache.get(chave);
            const resultado = fn.apply(this, args);
            cache.set(chave, resultado);
            return resultado;
        };
    }

    // ════════════════════════════════════════
    //  API PÚBLICA
    // ════════════════════════════════════════
    return Object.freeze({
        // Números
        formatarNum,
        formatarNumCompleto,

        // Matemática
        clamp,
        lerp,
        lerpAngulo,
        aleatorio,
        aleatorioF,
        chance,

        // Arrays
        embaralhar,
        escolher,

        // Colisão / visibilidade
        estaVisivel,
        retanguloContem,
        retanguloColide,

        // Segurança
        escaparHTML,

        // Frequência
        debounce,
        throttle,

        // Tempo
        formatarTempo,
        formatarData,

        // Objetos
        deepClone,
        uuid,
        memoize
    });

})();
