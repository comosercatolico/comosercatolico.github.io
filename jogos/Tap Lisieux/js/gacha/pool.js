// ═══════════════════════════════════════════════════════════
//  POOL.JS
//  Pool de itens do sistema Gacha.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, poolHerois e poolArmas eram arrays
//  soltos em game-ui.js sem validação, sem raridades
//  configuráveis, sem filtros, sem banners rotativos.
//
//  SOLUÇÃO:
//  Sistema declarativo completo com definição rica de itens,
//  banners configuráveis (padrão + rate-up), filtros,
//  validação de integridade e suporte a JSON externo futuro.
//
//  ESTRUTURA DE UM ITEM:
//  ┌─────────────┬───────────────────────────────────────────┐
//  │ Campo       │ Descrição                                 │
//  ├─────────────┼───────────────────────────────────────────┤
//  │ id          │ chave única (string)                      │
//  │ nome        │ nome exibido na UI                        │
//  │ tipo        │ "heroi" | "arma"                         │
//  │ raridade    │ "Comum"|"Raro"|"Épico"|"Lendário"        │
//  │ emoji       │ ícone visual                              │
//  │ descricao   │ texto de flavour                          │
//  │ dano        │ (só armas) bônus de dano                 │
//  │ bonusDps    │ (só armas) bônus de DPS                  │
//  │ habilidade  │ (heróis) nome da habilidade passiva       │
//  │ bonusClick  │ (heróis) multiplicador de dano de clique  │
//  │ tags        │ array de tags para filtros               │
//  └─────────────┴───────────────────────────────────────────┘
//
//  BANNERS:
//  - "padrao"   → pool completo com todas as raridades
//  - "armas"    → só armas
//  - "herois"   → só heróis
//  - "evento"   → banner especial (rate-up configurável)
//
//  API:
//    GachaPool.pool(banner)          → array filtrável
//    GachaPool.filtrar(opcoes)       → busca avançada
//    GachaPool.item(id)              → item por ID
//    GachaPool.porRaridade(r,banner) → itens de 1 raridade
//    GachaPool.banner(id)            → config do banner
//    GachaPool.banners()             → lista de banners
//    GachaPool.validar()             → verifica integridade
//    GachaPool.stats()               → estatísticas do pool
//
//  Depende de: constants.js, logger.js
//  Usado por: gacha.js, ui-gacha.js
// ═══════════════════════════════════════════════════════════

"use strict";

const GachaPool = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("GachaPool"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[GachaPool]",  ...a),
            error : (...a) => console.error("[GachaPool]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // RARIDADES — ordem e cores
    // ════════════════════════════════════════
    const RARIDADE = Object.freeze({
        COMUM    : "Comum",
        RARO     : "Raro",
        EPICO    : "Épico",
        LENDARIO : "Lendário"
    });

    const COR_RARIDADE = Object.freeze({
        "Comum"    : "#aaaaaa",
        "Raro"     : "#4a8fff",
        "Épico"    : "#b44dff",
        "Lendário" : "#f5a623"
    });

    // Peso de raridade para ordenação
    const PESO_RARIDADE = Object.freeze({
        "Lendário" : 4,
        "Épico"    : 3,
        "Raro"     : 2,
        "Comum"    : 1
    });

    // ════════════════════════════════════════
    // POOL DE HERÓIS
    // ════════════════════════════════════════
    const _HEROIS = Object.freeze([
        {
            id         : "sao_miguel",
            nome       : "São Miguel Arcanjo",
            tipo       : "heroi",
            raridade   : RARIDADE.LENDARIO,
            emoji      : "⚔️",
            descricao  : "General dos exércitos celestiais. Sua presença dobra o poder das rosas.",
            habilidade : "Escudo Divino",
            bonusClick : 2.0,
            bonusDps   : 1.5,
            tags       : ["anjo", "guerreiro", "lendario"]
        },
        {
            id         : "santa_cecilia",
            nome       : "Santa Cecília",
            tipo       : "heroi",
            raridade   : RARIDADE.EPICO,
            emoji      : "🎵",
            descricao  : "Padroeira da música. Suas melodias celestes potenciam o DPS.",
            habilidade : "Melodia Sagrada",
            bonusClick : 1.3,
            bonusDps   : 1.8,
            tags       : ["santa", "musica", "epico"]
        },
        {
            id         : "sao_bento",
            nome       : "São Bento",
            tipo       : "heroi",
            raridade   : RARIDADE.EPICO,
            emoji      : "✝️",
            descricao  : "A Cruz de São Bento expulsa o mal. Aumenta o dano contra chefes.",
            habilidade : "Cruz Exorcista",
            bonusClick : 1.5,
            bonusDps   : 1.2,
            tags       : ["santo", "exorcismo", "epico"]
        },
        {
            id         : "anjo_gabriel",
            nome       : "Anjo Gabriel",
            tipo       : "heroi",
            raridade   : RARIDADE.RARO,
            emoji      : "😇",
            descricao  : "Mensageiro de Deus. Anuncia vitórias com sua trombeta celestial.",
            habilidade : "Anúncio Celestial",
            bonusClick : 1.2,
            bonusDps   : 1.1,
            tags       : ["anjo", "mensageiro", "raro"]
        },
        {
            id         : "santa_luzia",
            nome       : "Santa Luzia",
            tipo       : "heroi",
            raridade   : RARIDADE.RARO,
            emoji      : "👁️",
            descricao  : "Protetora da visão. Revela fraquezas dos inimigos.",
            habilidade : "Visão da Graça",
            bonusClick : 1.15,
            bonusDps   : 1.25,
            tags       : ["santa", "luz", "raro"]
        },
        {
            id         : "santo_antonio",
            nome       : "Santo Antônio",
            tipo       : "heroi",
            raridade   : RARIDADE.RARO,
            emoji      : "📖",
            descricao  : "Doutor da Igreja. Confunde os demônios com sua sabedoria.",
            habilidade : "Sabedoria Divina",
            bonusClick : 1.1,
            bonusDps   : 1.2,
            tags       : ["santo", "sabedoria", "raro"]
        },
        {
            id         : "sao_francisco",
            nome       : "São Francisco de Assis",
            tipo       : "heroi",
            raridade   : RARIDADE.COMUM,
            emoji      : "🕊️",
            descricao  : "Amigo dos animais e da natureza. Seus pombos distraem os inimigos.",
            habilidade : "Paz Interior",
            bonusClick : 1.05,
            bonusDps   : 1.05,
            tags       : ["santo", "natureza", "comum"]
        },
        {
            id         : "sao_jose",
            nome       : "São José",
            tipo       : "heroi",
            raridade   : RARIDADE.COMUM,
            emoji      : "🔨",
            descricao  : "Carpinteiro e protetor da família. Reforça a estrutura de batalha.",
            habilidade : "Mãos Trabalhadoras",
            bonusClick : 1.08,
            bonusDps   : 1.03,
            tags       : ["santo", "trabalho", "comum"]
        }
    ]);

    // ════════════════════════════════════════
    // POOL DE ARMAS
    // ════════════════════════════════════════
    const _ARMAS = Object.freeze([
        {
            id        : "petala_divina",
            nome      : "Pétala Divina",
            tipo      : "arma",
            raridade  : RARIDADE.LENDARIO,
            emoji     : "✨",
            descricao : "Uma pétala abençoada pela própria Santa Teresinha. Poder inigualável.",
            dano      : 800,
            bonusDps  : 400,
            tags      : ["flor", "divino", "lendario"]
        },
        {
            id        : "coroa_espinhos",
            nome      : "Coroa de Espinhos",
            tipo      : "arma",
            raridade  : RARIDADE.EPICO,
            emoji     : "👑",
            descricao : "Símbolo do sacrifício sagrado. Cada espinho é uma oração.",
            dano      : 300,
            bonusDps  : 150,
            tags      : ["sagrado", "sacrificio", "epico"]
        },
        {
            id        : "vela_misericordia",
            nome      : "Vela da Misericórdia",
            tipo      : "arma",
            raridade  : RARIDADE.EPICO,
            emoji     : "🕯️",
            descricao : "Sua luz afasta as trevas. Causa dano extra a demônios.",
            dano      : 280,
            bonusDps  : 120,
            tags      : ["luz", "misericordia", "epico"]
        },
        {
            id        : "lirios_ceu",
            nome      : "Lírios do Céu",
            tipo      : "arma",
            raridade  : RARIDADE.RARO,
            emoji     : "🌸",
            descricao : "Flores colhidas nos jardins celestiais. Perfume que enfraquece os mal.",
            dano      : 120,
            bonusDps  : 60,
            tags      : ["flor", "ceu", "raro"]
        },
        {
            id        : "terco_abencado",
            nome      : "Terço Abençoado",
            tipo      : "arma",
            raridade  : RARIDADE.RARO,
            emoji     : "📿",
            descricao : "Cada conta é uma prece. Causa dano contínuo pelos salmos.",
            dano      : 110,
            bonusDps  : 80,
            tags      : ["oracao", "rosario", "raro"]
        },
        {
            id        : "rosas_sagradas",
            nome      : "Rosas Sagradas",
            tipo      : "arma",
            raridade  : RARIDADE.COMUM,
            emoji     : "🌹",
            descricao : "As rosas preferidas de Santa Teresinha. Simples mas eficazes.",
            dano      : 50,
            bonusDps  : 20,
            tags      : ["flor", "rosa", "comum"]
        },
        {
            id        : "cajado_sagrado",
            nome      : "Cajado Sagrado",
            tipo      : "arma",
            raridade  : RARIDADE.COMUM,
            emoji     : "🪄",
            descricao : "Um cajado bento pelo bispo. Confiável para iniciantes na fé.",
            dano      : 45,
            bonusDps  : 25,
            tags      : ["cajado", "bento", "comum"]
        },
        {
            id        : "martelo_bento",
            nome      : "Martelo Bento",
            tipo      : "arma",
            raridade  : RARIDADE.COMUM,
            emoji     : "🔨",
            descricao : "Martelado três vezes em nome da Santíssima Trindade.",
            dano      : 55,
            bonusDps  : 15,
            tags      : ["martelo", "trindade", "comum"]
        }
    ]);

    // Pool total combinado
    const _POOL_TOTAL = Object.freeze([..._HEROIS, ..._ARMAS]);

    // Mapa de acesso rápido por ID
    const _MAPA_ID = new Map(_POOL_TOTAL.map(item => [item.id, item]));

    // Índice por raridade (para pulls rápidos)
    const _IDX_RARIDADE = new Map();
    for (const r of Object.values(RARIDADE)) {
        _IDX_RARIDADE.set(r, _POOL_TOTAL.filter(i => i.raridade === r));
    }

    // Índice por tipo
    const _IDX_TIPO = new Map([
        ["heroi", _HEROIS],
        ["arma",  _ARMAS]
    ]);

    // ════════════════════════════════════════
    // BANNERS
    // Define pools e taxas por banner
    // ════════════════════════════════════════

    /**
     * @typedef {object} BannerDef
     * @property {string}   id          — chave única
     * @property {string}   nome        — nome exibido
     * @property {string}   emoji       — ícone
     * @property {string}   descricao   — texto descritivo
     * @property {string[]} tipos       — "heroi"|"arma"|"ambos"
     * @property {string[]} [rateUp]    — IDs com taxa dobrada
     * @property {boolean}  [ativo]     — se está disponível agora
     * @property {number}   [custoX1]   — custo por pull (padrão: BALANCE)
     * @property {number}   [custoX10]  — custo x10
     * @property {Date}     [expira]    — data de expiração (null = permanente)
     */
    const _BANNERS = Object.freeze([
        {
            id        : "padrao",
            nome      : "Convocação Sagrada",
            emoji     : "✨",
            descricao : "Pool padrão com heróis e armas de todas as raridades.",
            tipos     : ["heroi", "arma"],
            rateUp    : [],
            ativo     : true,
            custoX1   : 100,
            custoX10  : 900,
            expira    : null
        },
        {
            id        : "herois",
            nome      : "Chamado dos Santos",
            emoji     : "👤",
            descricao : "Apenas heróis. Maior chance de obter aliados divinos.",
            tipos     : ["heroi"],
            rateUp    : [],
            ativo     : true,
            custoX1   : 120,
            custoX10  : 1080,
            expira    : null
        },
        {
            id        : "armas",
            nome      : "Arsenal Celestial",
            emoji     : "⚔️",
            descricao : "Apenas armas sagradas para equipar sua santa.",
            tipos     : ["arma"],
            rateUp    : [],
            ativo     : true,
            custoX1   : 100,
            custoX10  : 900,
            expira    : null
        },
        {
            id        : "sao_miguel_rateup",
            nome      : "Retorno do Arcanjo",
            emoji     : "⚔️",
            descricao : "São Miguel com taxa de aparição aumentada! Evento limitado.",
            tipos     : ["heroi", "arma"],
            rateUp    : ["sao_miguel"],
            ativo     : false,       // ativado quando evento começa
            custoX1   : 100,
            custoX10  : 900,
            expira    : null
        }
    ]);

    // Mapa de banners por ID
    const _MAPA_BANNERS = new Map(_BANNERS.map(b => [b.id, b]));

    // ════════════════════════════════════════
    // VALIDAÇÃO DE INTEGRIDADE
    // ════════════════════════════════════════

    /**
     * Valida a integridade do pool.
     * Detecta IDs duplicados, campos obrigatórios faltando,
     * raridades inválidas, etc.
     *
     * @returns {{ valido: boolean, erros: string[], avisos: string[] }}
     */
    function validar() {
        const erros   = [];
        const avisos  = [];
        const ids     = new Set();

        const raridadesValidas = new Set(Object.values(RARIDADE));
        const camposObrig      = ["id", "nome", "tipo", "raridade", "emoji"];

        _POOL_TOTAL.forEach((item, idx) => {
            const prefixo = `[${item.tipo ?? "?"}/${item.id ?? idx}]`;

            // Campos obrigatórios
            camposObrig.forEach(campo => {
                if (!item[campo]) {
                    erros.push(`${prefixo} Campo obrigatório ausente: "${campo}"`);
                }
            });

            // ID único
            if (item.id) {
                if (ids.has(item.id)) {
                    erros.push(`${prefixo} ID duplicado: "${item.id}"`);
                }
                ids.add(item.id);
            }

            // Raridade válida
            if (item.raridade && !raridadesValidas.has(item.raridade)) {
                erros.push(`${prefixo} Raridade inválida: "${item.raridade}"`);
            }

            // Tipo válido
            if (item.tipo && !["heroi", "arma"].includes(item.tipo)) {
                erros.push(`${prefixo} Tipo inválido: "${item.tipo}"`);
            }

            // Armas: campo dano obrigatório
            if (item.tipo === "arma" && typeof item.dano !== "number") {
                erros.push(`${prefixo} Arma sem campo "dano" numérico.`);
            }

            // Heróis: campo bonusClick recomendado
            if (item.tipo === "heroi" && typeof item.bonusClick !== "number") {
                avisos.push(`${prefixo} Herói sem "bonusClick" — assume 1.0.`);
            }
        });

        // Valida rate-ups dos banners
        _BANNERS.forEach(banner => {
            (banner.rateUp ?? []).forEach(id => {
                if (!_MAPA_ID.has(id)) {
                    erros.push(`[Banner/${banner.id}] Rate-up ID inexistente: "${id}"`);
                }
            });
        });

        const valido = erros.length === 0;

        if (!valido) {
            erros.forEach(e => _log.error("Validação:", e));
        }
        avisos.forEach(a => _log.warn("Validação:", a));

        if (valido) {
            _log.info(
                `Pool validado ✅ — ${_POOL_TOTAL.length} itens` +
                ` (${_HEROIS.length} heróis + ${_ARMAS.length} armas)`
            );
        }

        return { valido, erros, avisos };
    }

    // ════════════════════════════════════════
    // ACESSO AO POOL
    // ════════════════════════════════════════

    /**
     * Retorna o pool de itens para um banner.
     * Rate-up: itens com rate-up aparecem duplicados
     * na lista (aumenta a chance proporcionalmente).
     *
     * @param {string} [bannerId="padrao"]
     * @returns {readonly Array}
     */
    function pool(bannerId = "padrao") {
        const bannerDef = _MAPA_BANNERS.get(bannerId);

        if (!bannerDef) {
            _log.warn(`pool("${bannerId}"): banner não encontrado. Usando padrão.`);
            return _POOL_TOTAL;
        }

        // Filtra por tipos permitidos no banner
        let itens = _POOL_TOTAL.filter(item =>
            bannerDef.tipos.includes(item.tipo)
        );

        // Aplica rate-up: duplica itens com rate-up no pool
        // (aproxima a taxa deles para o dobro)
        if (bannerDef.rateUp && bannerDef.rateUp.length > 0) {
            const extras = itens.filter(i => bannerDef.rateUp.includes(i.id));
            itens = [...itens, ...extras];
        }

        return Object.freeze(itens);
    }

    /**
     * Retorna itens de uma raridade específica no banner.
     *
     * @param {string} raridade  — "Comum"|"Raro"|"Épico"|"Lendário"
     * @param {string} [bannerId="padrao"]
     * @returns {readonly Array}
     */
    function porRaridade(raridade, bannerId = "padrao") {
        return pool(bannerId).filter(i => i.raridade === raridade);
    }

    /**
     * Retorna um item pelo ID.
     * @param {string} id
     * @returns {object|null}
     */
    function item(id) {
        const encontrado = _MAPA_ID.get(id);
        if (!encontrado) {
            _log.warn(`item("${id}"): não encontrado no pool.`);
            return null;
        }
        return encontrado;
    }

    // ════════════════════════════════════════
    // FILTRO AVANÇADO
    // ════════════════════════════════════════

    /**
     * Busca itens com múltiplos critérios.
     *
     * @param {object}   opcoes
     * @param {string}   [opcoes.tipo]      — "heroi"|"arma"
     * @param {string}   [opcoes.raridade]  — raridade exata
     * @param {string[]} [opcoes.tags]      — deve ter TODAS as tags
     * @param {string}   [opcoes.busca]     — substring no nome/descricao
     * @param {string}   [opcoes.banner]    — filtrar por banner
     * @param {string}   [opcoes.ordenar]   — "raridade"|"dano"|"nome"
     * @param {boolean}  [opcoes.decrescente=true]
     * @returns {Array}
     *
     * @example
     * GachaPool.filtrar({ tipo: "arma", raridade: "Épico" })
     * GachaPool.filtrar({ tags: ["flor"], ordenar: "dano" })
     * GachaPool.filtrar({ busca: "São", tipo: "heroi" })
     */
    function filtrar({
        tipo,
        raridade,
        tags,
        busca,
        banner      = "padrao",
        ordenar     = "raridade",
        decrescente = true
    } = {}) {
        let resultado = [...pool(banner)];

        // Filtro por tipo
        if (tipo) {
            resultado = resultado.filter(i => i.tipo === tipo);
        }

        // Filtro por raridade
        if (raridade) {
            resultado = resultado.filter(i => i.raridade === raridade);
        }

        // Filtro por tags (deve ter TODAS)
        if (tags && tags.length > 0) {
            resultado = resultado.filter(i =>
                tags.every(tag => (i.tags ?? []).includes(tag))
            );
        }

        // Busca textual (nome ou descrição)
        if (busca) {
            const termo = busca.toLowerCase();
            resultado = resultado.filter(i =>
                i.nome.toLowerCase().includes(termo) ||
                (i.descricao ?? "").toLowerCase().includes(termo)
            );
        }

        // Remove duplicatas (causadas por rate-up)
        const vistos = new Set();
        resultado = resultado.filter(i => {
            if (vistos.has(i.id)) return false;
            vistos.add(i.id);
            return true;
        });

        // Ordenação
        resultado.sort((a, b) => {
            let cmp = 0;
            switch (ordenar) {
                case "raridade":
                    cmp = (PESO_RARIDADE[a.raridade] ?? 0) -
                          (PESO_RARIDADE[b.raridade] ?? 0);
                    break;
                case "dano":
                    cmp = (a.dano ?? a.bonusClick ?? 0) -
                          (b.dano ?? b.bonusClick ?? 0);
                    break;
                case "nome":
                    cmp = a.nome.localeCompare(b.nome, "pt-BR");
                    break;
                default:
                    cmp = 0;
            }
            return decrescente ? -cmp : cmp;
        });

        return resultado;
    }

    // ════════════════════════════════════════
    // BANNERS
    // ════════════════════════════════════════

    /**
     * Retorna a definição de um banner.
     * @param {string} id
     * @returns {object|null}
     */
    function banner(id) {
        const b = _MAPA_BANNERS.get(id);
        if (!b) {
            _log.warn(`banner("${id}"): não encontrado.`);
            return null;
        }
        return { ...b };
    }

    /**
     * Retorna todos os banners, opcionalmente só os ativos.
     * @param {boolean} [apenasAtivos=false]
     * @returns {Array}
     */
    function banners(apenasAtivos = false) {
        const lista = [..._BANNERS];
        return apenasAtivos ? lista.filter(b => b.ativo) : lista;
    }

    /**
     * Ativa ou desativa um banner em runtime.
     * Útil para banners de evento.
     *
     * @param {string}  id
     * @param {boolean} ativo
     */
    function setBannerAtivo(id, ativo) {
        const b = _MAPA_BANNERS.get(id);
        if (!b) {
            _log.warn(`setBannerAtivo("${id}"): banner não encontrado.`);
            return;
        }
        // _BANNERS é freeze mas o mapa aponta para o objeto original
        // Usamos um mapa de overrides para não mutar o freeze
        _overridesBanner.set(id, ativo);
        _log.info(`Banner "${id}" ${ativo ? "ativado" : "desativado"}.`);

        try {
            EventBus.emit("pool:banner_alterado", { id, ativo });
        } catch { /* não crítico */ }
    }

    // Overrides de banner (runtime)
    const _overridesBanner = new Map();

    // ════════════════════════════════════════
    // ITEM ALEATÓRIO DO POOL
    // Usado internamente pelo gacha.js
    // ════════════════════════════════════════

    /**
     * Seleciona um item aleatório de uma raridade no banner.
     * Retorna fallback "Comum" se a raridade estiver vazia.
     *
     * @param {string} raridade
     * @param {string} [bannerId="padrao"]
     * @returns {object}
     */
    function aleatorioDeRaridade(raridade, bannerId = "padrao") {
        const candidatos = porRaridade(raridade, bannerId);

        if (candidatos.length === 0) {
            _log.warn(
                `aleatorioDeRaridade("${raridade}", "${bannerId}"): ` +
                `pool vazio — usando fallback Comum.`
            );
            const fallback = porRaridade(RARIDADE.COMUM, bannerId);
            if (fallback.length === 0) {
                _log.error("Pool completamente vazio! Verifique os dados.");
                return _POOL_TOTAL[0]; // último recurso
            }
            return fallback[Math.floor(Math.random() * fallback.length)];
        }

        return candidatos[Math.floor(Math.random() * candidatos.length)];
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS DO POOL
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas detalhadas do pool.
     */
    function stats() {
        const porRar = {};
        const porTipo = { heroi: 0, arma: 0 };

        for (const r of Object.values(RARIDADE)) {
            porRar[r] = _IDX_RARIDADE.get(r)?.length ?? 0;
        }

        porTipo.heroi = _HEROIS.length;
        porTipo.arma  = _ARMAS.length;

        return {
            total        : _POOL_TOTAL.length,
            porRaridade  : porRar,
            porTipo,
            totalBanners : _BANNERS.length,
            bannersAtivos: _BANNERS.filter(b => b.ativo).length
        };
    }

    /**
     * Loga estatísticas do pool (só dev).
     */
    function logStats() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("GachaPool — Estatísticas", () => {
            const s = stats();
            _log.debug(`Total de itens : ${s.total}`);
            _log.debug(`Heróis         : ${s.porTipo.heroi}`);
            _log.debug(`Armas          : ${s.porTipo.arma}`);
            Object.entries(s.porRaridade).forEach(([r, n]) => {
                const cor = COR_RARIDADE[r] ?? "#fff";
                _log.debug(`${r.padEnd(10)}: ${n} item(s)`);
            });
            _log.debug(`Banners        : ${s.totalBanners} (${s.bannersAtivos} ativos)`);
        }, true);
    }

    // ════════════════════════════════════════
    // CARREGAMENTO DE JSON EXTERNO (futuro)
    // Estrutura preparada para quando o pool
    // vier de um arquivo remoto
    // ════════════════════════════════════════

    /**
     * Futura implementação: carrega pool de JSON externo.
     * Por enquanto retorna os dados internos.
     *
     * @returns {Promise<boolean>}
     */
    async function carregarExterno(url) {
        _log.info(`carregarExterno("${url}"): não implementado ainda. Usando pool interno.`);
        // TODO: fetch(url) → validar → substituir _HEROIS/_ARMAS
        return false;
    }

    // ════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════
    (function _init() {
        const resultado = validar();
        if (!resultado.valido) {
            _log.error(`Pool com ${resultado.erros.length} erro(s) de integridade!`);
        }
        logStats();
    })();

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Pool de itens
        pool,
        porRaridade,
        item,
        filtrar,
        aleatorioDeRaridade,

        // Banners
        banner,
        banners,
        setBannerAtivo,

        // Validação e diagnóstico
        validar,
        stats,
        logStats,

        // Futuro
        carregarExterno,

        // Constantes (readonly)
        get RARIDADE()      { return RARIDADE;      },
        get COR_RARIDADE()  { return COR_RARIDADE;  },
        get PESO_RARIDADE() { return PESO_RARIDADE; },
        get HEROIS()        { return _HEROIS;        },
        get ARMAS()         { return _ARMAS;         },
        get TOTAL()         { return _POOL_TOTAL;    }
    });

})();
window.GachaPool = GachaPool;
