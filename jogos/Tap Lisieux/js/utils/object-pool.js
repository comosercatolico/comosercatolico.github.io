// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/utils/object-pool.js
//  Pool de objetos reutilizáveis
//
//  Problema que resolve:
//  Criar e destruir objetos a cada frame (partículas, textos
//  flutuantes, projéteis, moedas) causa pausas do Garbage
//  Collector, gerando "stutters" visíveis no jogo.
//
//  Solução:
//  Mantém um estoque de objetos prontos. Quando precisar de
//  um objeto, pega do estoque (obter). Quando terminar,
//  devolve ao estoque (devolver) em vez de destruir.
//
//  Uso básico:
//    const pool = new ObjectPool(() => ({ x:0, y:0, vida:0 }));
//    const p    = pool.obter();       // pega do estoque
//    p.x = 100; p.y = 200;           // configura
//    pool.devolver(p);               // devolve quando terminar
//
//  Uso com reset automático:
//    const pool = new ObjectPool(
//      () => ({ x:0, y:0, vida:0 }),  // factory
//      (obj) => { obj.x=0; obj.y=0; obj.vida=0; } // reset
//    );
//
//  Depende de: (nenhum — módulo base)
//  Usado por:  js/renderer/effects.js
// ═══════════════════════════════════════════════════════════

"use strict";

class ObjectPool {

    // ════════════════════════════════════════
    //  CONSTRUTOR
    // ════════════════════════════════════════

    /**
     * @param {Function} factory
     *   Função que cria um novo objeto quando o pool está vazio.
     *   Exemplo: () => ({ x: 0, y: 0, vida: 0, ativo: false })
     *
     * @param {Function|null} [resetFn=null]
     *   Função chamada ao DEVOLVER um objeto ao pool.
     *   Usa para zerar valores sem criar novo objeto.
     *   Exemplo: (obj) => { obj.x = 0; obj.ativo = false; }
     *   Se null, o objeto é devolvido sem reset.
     *
     * @param {number} [tamanhoInicial=0]
     *   Pré-aquece o pool criando N objetos imediatamente.
     *   Use para evitar picos de alocação na primeira cena.
     *
     * @param {number} [tamanhoMaximo=Infinity]
     *   Limite máximo de objetos no estoque.
     *   Objetos devolvidos além desse limite são descartados.
     */
    constructor(factory, resetFn = null, tamanhoInicial = 0, tamanhoMaximo = Infinity) {
        if (typeof factory !== "function") {
            throw new TypeError("[ObjectPool] factory deve ser uma função.");
        }

        this._factory      = factory;
        this._resetFn      = resetFn;
        this._estoque      = [];       // objetos disponíveis
        this._tamanhoMax   = tamanhoMaximo;

        // Estatísticas (úteis para debug e balanceamento)
        this._stats = {
            criados:    0,   // total de objetos criados pela factory
            reutilizados: 0, // quantas vezes um objeto foi reutilizado
            descartados:  0, // objetos devolvidos além do tamanhoMaximo
            pico:         0  // maior número de objetos fora do pool ao mesmo tempo
        };

        this._emUso = 0; // contador de objetos atualmente fora do pool

        // Pré-aquecimento
        if (tamanhoInicial > 0) {
            this._preAquecer(tamanhoInicial);
        }
    }

    // ════════════════════════════════════════
    //  OBTER — pega um objeto do pool
    // ════════════════════════════════════════

    /**
     * Retorna um objeto disponível do estoque.
     * Se o estoque estiver vazio, cria um novo via factory.
     *
     * @returns {Object} — objeto pronto para uso
     */
    obter() {
        let obj;

        if (this._estoque.length > 0) {
            // Reutiliza objeto existente (operação O(1) com pop)
            obj = this._estoque.pop();
            this._stats.reutilizados++;
        } else {
            // Estoque vazio — cria novo objeto
            obj = this._factory();
            this._stats.criados++;
        }

        this._emUso++;

        // Atualiza estatística de pico
        if (this._emUso > this._stats.pico) {
            this._stats.pico = this._emUso;
        }

        return obj;
    }

    // ════════════════════════════════════════
    //  DEVOLVER — retorna objeto ao pool
    // ════════════════════════════════════════

    /**
     * Devolve um objeto ao estoque para reutilização futura.
     * Chama resetFn automaticamente se foi definida.
     *
     * @param {Object} obj — objeto a devolver
     */
    devolver(obj) {
        if (obj === null || obj === undefined) return;

        this._emUso = Math.max(0, this._emUso - 1);

        // Verifica se o estoque já está cheio
        if (this._estoque.length >= this._tamanhoMax) {
            this._stats.descartados++;
            return; // descarta — não guarda além do limite
        }

        // Reseta o objeto antes de guardar
        if (this._resetFn) {
            try {
                this._resetFn(obj);
            } catch (e) {
                console.warn("[ObjectPool] Erro no resetFn:", e);
            }
        }

        this._estoque.push(obj);
    }

    // ════════════════════════════════════════
    //  DEVOLVER ARRAY — devolve vários de uma vez
    // ════════════════════════════════════════

    /**
     * Devolve todos os objetos de um array ao pool e limpa o array.
     * Atalho para o padrão:
     *   lista.forEach(obj => pool.devolver(obj));
     *   lista.length = 0;
     *
     * @param {Array} arr — array de objetos a devolver
     */
    devolverTodos(arr) {
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) {
            this.devolver(arr[i]);
        }
        arr.length = 0;
    }

    // ════════════════════════════════════════
    //  FILTRAR ARRAY — remove inativos e os devolve
    // ════════════════════════════════════════

    /**
     * Filtra um array in-place:
     * - Objetos que passam no predicado ficam no array
     * - Objetos que falham são devolvidos ao pool
     *
     * Substitui o padrão:
     *   lista = lista.filter(obj => {
     *     if (!obj.ativo) { pool.devolver(obj); return false; }
     *     return true;
     *   });
     *
     * Vantagem: não cria novo array a cada frame.
     *
     * @param {Array}    arr       — array a filtrar (mutado in-place)
     * @param {Function} predicado — fn(obj) → boolean
     * @returns {Array} o mesmo array, modificado
     */
    filtrar(arr, predicado) {
        let escrita = 0;
        for (let leitura = 0; leitura < arr.length; leitura++) {
            const obj = arr[leitura];
            if (predicado(obj)) {
                arr[escrita++] = obj;
            } else {
                this.devolver(obj);
            }
        }
        arr.length = escrita;
        return arr;
    }

    // ════════════════════════════════════════
    //  PRÉ-AQUECIMENTO
    // ════════════════════════════════════════

    /**
     * Cria N objetos antecipadamente e os guarda no estoque.
     * Chame antes de uma cena intensa para evitar picos de GC.
     *
     * @param {number} quantidade
     */
    preAquecer(quantidade) {
        this._preAquecer(quantidade);
    }

    _preAquecer(quantidade) {
        const qtd = Math.max(0, Math.floor(quantidade));
        for (let i = 0; i < qtd; i++) {
            if (this._estoque.length >= this._tamanhoMax) break;
            const obj = this._factory();
            this._stats.criados++;
            // Aplica reset se definido (garante estado limpo)
            if (this._resetFn) this._resetFn(obj);
            this._estoque.push(obj);
        }
    }

    // ════════════════════════════════════════
    //  LIMPAR — esvazia o estoque
    // ════════════════════════════════════════

    /**
     * Remove todos os objetos do estoque.
     * Use ao trocar de cena para liberar memória.
     */
    limpar() {
        this._estoque.length = 0;
    }

    // ════════════════════════════════════════
    //  GETTERS DE ESTADO
    // ════════════════════════════════════════

    /** Número de objetos disponíveis no estoque */
    get tamanho()     { return this._estoque.length; }

    /** Número de objetos atualmente fora do pool (em uso) */
    get emUso()       { return this._emUso; }

    /** Total de objetos gerenciados (estoque + em uso) */
    get totalGerenciado() { return this._estoque.length + this._emUso; }

    /** Cópia das estatísticas internas */
    get stats() { return { ...this._stats }; }

    // ════════════════════════════════════════
    //  DEBUG
    // ════════════════════════════════════════

    /**
     * Exibe um relatório no console (use durante desenvolvimento).
     * @param {string} [nome="Pool"] — nome para identificar no log
     */
    debug(nome = "Pool") {
        console.group(`[ObjectPool] ${nome}`);
        console.log(`  Estoque disponível : ${this._estoque.length}`);
        console.log(`  Em uso             : ${this._emUso}`);
        console.log(`  Total gerenciado   : ${this.totalGerenciado}`);
        console.log(`  Criados (factory)  : ${this._stats.criados}`);
        console.log(`  Reutilizados       : ${this._stats.reutilizados}`);
        console.log(`  Descartados        : ${this._stats.descartados}`);
        console.log(`  Pico de uso        : ${this._stats.pico}`);
        const taxa = this._stats.criados > 0
            ? ((this._stats.reutilizados / (this._stats.criados + this._stats.reutilizados)) * 100).toFixed(1)
            : "0.0";
        console.log(`  Taxa de reutilização: ${taxa}%`);
        console.groupEnd();
    }
}

// ════════════════════════════════════════
//  POOLS GLOBAIS DO JOGO
//  Pré-configurados para cada tipo de efeito.
//  Importados por effects.js
// ════════════════════════════════════════

/**
 * Pool de partículas de impacto
 * (rosa acerta monstro → explosão de pétalas)
 */
const PoolParticulas = new ObjectPool(
    // Factory — estrutura de uma partícula
    () => ({
        x: 0, y: 0,
        vx: 0, vy: 0,
        vida: 0, vidaMax: 0,
        size: 0,
        cor: "#ff9de2",
        ativo: false
    }),
    // Reset — zera tudo ao devolver
    (p) => {
        p.x = 0; p.y = 0;
        p.vx = 0; p.vy = 0;
        p.vida = 0; p.vidaMax = 0;
        p.size = 0;
        p.cor = "#ff9de2";
        p.ativo = false;
    },
    30,   // pré-aquece com 30 partículas
    200   // máximo 200 no estoque
);

/**
 * Pool de textos flutuantes de dano
 * ("-150", "LEVEL UP!", "DPS +2")
 */
const PoolTextos = new ObjectPool(
    () => ({
        x: 0, y: 0,
        valor: "",
        tipo: "click",
        vida: 0,
        ativo: false
    }),
    (t) => {
        t.x = 0; t.y = 0;
        t.valor = "";
        t.tipo = "click";
        t.vida = 0;
        t.ativo = false;
    },
    10,   // pré-aquece com 10
    50    // máximo 50 no estoque
);

/**
 * Pool de moedas caindo
 * (aparecem ao matar inimigo)
 */
const PoolMoedas = new ObjectPool(
    () => ({
        x: 0, y: 0,
        vx: 0, vy: 0,
        vida: 0,
        size: 0,
        ativo: false
    }),
    (m) => {
        m.x = 0; m.y = 0;
        m.vx = 0; m.vy = 0;
        m.vida = 0;
        m.size = 0;
        m.ativo = false;
    },
    10,   // pré-aquece com 10
    50    // máximo 50 no estoque
);

/**
 * Pool de projéteis (rosas atacando o monstro)
 */
const PoolProjéteis = new ObjectPool(
    () => ({
        x: 0, y: 0,
        vx: 0, vy: 0,
        tx: 0, ty: 0,
        size: 0,
        vida: 0,
        acertou: false,
        ativo: false
    }),
    (p) => {
        p.x = 0; p.y = 0;
        p.vx = 0; p.vy = 0;
        p.tx = 0; p.ty = 0;
        p.size = 0;
        p.vida = 0;
        p.acertou = false;
        p.ativo = false;
    },
    10,   // pré-aquece com 10
    100   // máximo 100 no estoque
);
