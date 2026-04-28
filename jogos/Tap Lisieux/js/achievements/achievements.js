// ═══════════════════════════════════════════════════════
//  ACHIEVEMENTS.JS
//  Sistema de Conquistas completo:
//  - Definição declarativa de conquistas
//  - Verificação reativa via EventBus
//  - Recompensas (moeda, gema, título)
//  - Progressão parcial (ex: 47/100 kills)
//  - Categorias: Batalha, Progressão, Coleção, Especial
//  - Toast especial por raridade da conquista
//  - Badge no HUD atualizado
//  - Persistência via GameState
//
//  Depende de: event-bus.js, state.js, economy.js,
//              toast.js, dom-cache.js
//  Usado por: main.js
// ═══════════════════════════════════════════════════════

"use strict";

const Achievements = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Achievements"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CATEGORIAS
    // ════════════════════════════════════════════════════
    const CAT = Object.freeze({
        BATALHA    : { id: "batalha",    label: "⚔️ Batalha",     cor: "#ff6b6b" },
        PROGRESSAO : { id: "progressao", label: "📈 Progressão",  cor: "#4a8fff" },
        COLECAO    : { id: "colecao",    label: "🗝️ Coleção",    cor: "#b44dff" },
        ESPECIAL   : { id: "especial",   label: "✨ Especial",    cor: "#f5a623" },
    });

    // ════════════════════════════════════════════════════
    // RARIDADES DE CONQUISTA
    // (independente da raridade de itens do gacha)
    // ════════════════════════════════════════════════════
    const RAR = Object.freeze({
        BRONZE   : { id: "bronze",   label: "Bronze",   cor: "#cd7f32", iconeUI: "🥉" },
        PRATA    : { id: "prata",    label: "Prata",    cor: "#c0c0c0", iconeUI: "🥈" },
        OURO     : { id: "ouro",     label: "Ouro",     cor: "#ffd700", iconeUI: "🥇" },
        PLATINA  : { id: "platina",  label: "Platina",  cor: "#e5e4e2", iconeUI: "💎" },
        SAGRADA  : { id: "sagrada",  label: "Sagrada",  cor: "#f5a623", iconeUI: "✨" },
    });

    // ════════════════════════════════════════════════════
    // DEFINIÇÃO DAS CONQUISTAS
    //
    // Estrutura:
    // {
    //   id         : string único
    //   categoria  : CAT.*
    //   raridade   : RAR.*
    //   emoji      : string
    //   nome       : string
    //   desc       : string
    //   recompensa : { moeda?, gema?, titulo? }
    //   meta       : number (para progressão)        [opcional]
    //   progresso  : (estado) => number              [opcional, para barra]
    //   check      : (estado) => boolean
    //   oculta     : boolean                         [opcional, mystery]
    //   serie      : string                          [opcional, agrupa em série]
    // }
    // ════════════════════════════════════════════════════
    const DEFS = Object.freeze([

        // ── SÉRIE: Kills ────────────────────────────────
        {
            id        : "kill_1",
            serie     : "kills",
            categoria : CAT.BATALHA,
            raridade  : RAR.BRONZE,
            emoji     : "⚔️",
            nome      : "Primeira Batalha",
            desc      : "Derrote seu primeiro inimigo",
            meta      : 1,
            progresso : s => s.totalKills ?? 0,
            check     : s => (s.totalKills ?? 0) >= 1,
            recompensa: { gema: 5 },
        },
        {
            id        : "kill_10",
            serie     : "kills",
            categoria : CAT.BATALHA,
            raridade  : RAR.BRONZE,
            emoji     : "💀",
            nome      : "Guerreira",
            desc      : "Derrote 10 inimigos",
            meta      : 10,
            progresso : s => s.totalKills ?? 0,
            check     : s => (s.totalKills ?? 0) >= 10,
            recompensa: { gema: 15 },
        },
        {
            id        : "kill_100",
            serie     : "kills",
            categoria : CAT.BATALHA,
            raridade  : RAR.PRATA,
            emoji     : "🗡️",
            nome      : "Caçadora Santa",
            desc      : "Derrote 100 inimigos",
            meta      : 100,
            progresso : s => s.totalKills ?? 0,
            check     : s => (s.totalKills ?? 0) >= 100,
            recompensa: { gema: 40 },
        },
        {
            id        : "kill_1000",
            serie     : "kills",
            categoria : CAT.BATALHA,
            raridade  : RAR.OURO,
            emoji     : "🏹",
            nome      : "Aniquiladora",
            desc      : "Derrote 1.000 inimigos",
            meta      : 1000,
            progresso : s => s.totalKills ?? 0,
            check     : s => (s.totalKills ?? 0) >= 1000,
            recompensa: { gema: 120 },
        },
        {
            id        : "kill_10000",
            serie     : "kills",
            categoria : CAT.BATALHA,
            raridade  : RAR.PLATINA,
            emoji     : "⚰️",
            nome      : "Flagelo das Trevas",
            desc      : "Derrote 10.000 inimigos",
            meta      : 10000,
            progresso : s => s.totalKills ?? 0,
            check     : s => (s.totalKills ?? 0) >= 10000,
            recompensa: { gema: 400 },
        },

        // ── SÉRIE: Estágios ─────────────────────────────
        {
            id        : "estagio_10",
            serie     : "estagios",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.BRONZE,
            emoji     : "🗺️",
            nome      : "Exploradora",
            desc      : "Alcance o estágio 10",
            meta      : 10,
            progresso : s => s.estagio ?? 1,
            check     : s => (s.estagio ?? 1) >= 10,
            recompensa: { gema: 20 },
        },
        {
            id        : "estagio_30",
            serie     : "estagios",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.PRATA,
            emoji     : "🌍",
            nome      : "Peregrina",
            desc      : "Alcance o estágio 30",
            meta      : 30,
            progresso : s => s.estagio ?? 1,
            check     : s => (s.estagio ?? 1) >= 30,
            recompensa: { gema: 60 },
        },
        {
            id        : "estagio_60",
            serie     : "estagios",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.OURO,
            emoji     : "🌟",
            nome      : "Conquistadora",
            desc      : "Alcance o estágio 60",
            meta      : 60,
            progresso : s => s.estagio ?? 1,
            check     : s => (s.estagio ?? 1) >= 60,
            recompensa: { gema: 150 },
        },
        {
            id        : "estagio_100",
            serie     : "estagios",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.PLATINA,
            emoji     : "🏔️",
            nome      : "Ascendida",
            desc      : "Alcance o estágio 100",
            meta      : 100,
            progresso : s => s.estagio ?? 1,
            check     : s => (s.estagio ?? 1) >= 100,
            recompensa: { gema: 300, titulo: "Ascendida" },
        },

        // ── SÉRIE: Level up ─────────────────────────────
        {
            id        : "nivel_5",
            serie     : "nivel",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.BRONZE,
            emoji     : "⭐",
            nome      : "Em Crescimento",
            desc      : "Chegue ao nível 5",
            meta      : 5,
            progresso : s => s.nivelPersonagem ?? 1,
            check     : s => (s.nivelPersonagem ?? 1) >= 5,
            recompensa: { gema: 10 },
        },
        {
            id        : "nivel_20",
            serie     : "nivel",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.PRATA,
            emoji     : "🌙",
            nome      : "Florescendo",
            desc      : "Chegue ao nível 20",
            meta      : 20,
            progresso : s => s.nivelPersonagem ?? 1,
            check     : s => (s.nivelPersonagem ?? 1) >= 20,
            recompensa: { gema: 80, titulo: "Florescida" },
        },
        {
            id        : "nivel_50",
            serie     : "nivel",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.OURO,
            emoji     : "☀️",
            nome      : "Radiante",
            desc      : "Chegue ao nível 50",
            meta      : 50,
            progresso : s => s.nivelPersonagem ?? 1,
            check     : s => (s.nivelPersonagem ?? 1) >= 50,
            recompensa: { gema: 200, titulo: "Radiante" },
        },

        // ── SÉRIE: Upgrades ─────────────────────────────
        {
            id        : "upgrade_5",
            serie     : "upgrades",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.BRONZE,
            emoji     : "📈",
            nome      : "Aprimorada",
            desc      : "Faça 5 upgrades",
            meta      : 5,
            progresso : s => s.totalUpgrades ?? 0,
            check     : s => (s.totalUpgrades ?? 0) >= 5,
            recompensa: { moeda: 200 },
        },
        {
            id        : "upgrade_50",
            serie     : "upgrades",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.PRATA,
            emoji     : "🔧",
            nome      : "Artífice",
            desc      : "Faça 50 upgrades",
            meta      : 50,
            progresso : s => s.totalUpgrades ?? 0,
            check     : s => (s.totalUpgrades ?? 0) >= 50,
            recompensa: { gema: 35 },
        },
        {
            id        : "upgrade_200",
            serie     : "upgrades",
            categoria : CAT.PROGRESSAO,
            raridade  : RAR.OURO,
            emoji     : "⚙️",
            nome      : "Mestra das Artes",
            desc      : "Faça 200 upgrades",
            meta      : 200,
            progresso : s => s.totalUpgrades ?? 0,
            check     : s => (s.totalUpgrades ?? 0) >= 200,
            recompensa: { gema: 100 },
        },

        // ── SÉRIE: Prestígio ────────────────────────────
        {
            id        : "prestigio_1",
            serie     : "prestigio",
            categoria : CAT.ESPECIAL,
            raridade  : RAR.OURO,
            emoji     : "🌸",
            nome      : "Renascida",
            desc      : "Faça seu primeiro Prestígio",
            meta      : 1,
            progresso : s => s.totalPrestígios ?? 0,
            check     : s => (s.totalPrestígios ?? 0) >= 1,
            recompensa: { gema: 200, titulo: "Renascida" },
        },
        {
            id        : "prestigio_5",
            serie     : "prestigio",
            categoria : CAT.ESPECIAL,
            raridade  : RAR.PLATINA,
            emoji     : "🔁",
            nome      : "Eterna",
            desc      : "Faça 5 Prestígios",
            meta      : 5,
            progresso : s => s.totalPrestígios ?? 0,
            check     : s => (s.totalPrestígios ?? 0) >= 5,
            recompensa: { gema: 500, titulo: "Eterna" },
        },
        {
            id        : "prestigio_10",
            serie     : "prestigio",
            categoria : CAT.ESPECIAL,
            raridade  : RAR.SAGRADA,
            emoji     : "♾️",
            nome      : "Transcendida",
            desc      : "Faça 10 Prestígios",
            meta      : 10,
            progresso : s => s.totalPrestígios ?? 0,
            check     : s => (s.totalPrestígios ?? 0) >= 10,
            recompensa: { gema: 1000, titulo: "Transcendida" },
        },

        // ── SÉRIE: Gacha/Coleção ────────────────────────
        {
            id        : "primeiro_lend",
            serie     : "gacha",
            categoria : CAT.COLECAO,
            raridade  : RAR.OURO,
            emoji     : "✨",
            nome      : "Abençoada",
            desc      : "Obtenha seu primeiro item Lendário",
            check     : s => {
                const h = Array.isArray(s.heroisObtidos)       ? s.heroisObtidos       : [];
                const e = Array.isArray(s.equipamentosObtidos) ? s.equipamentosObtidos : [];
                return [...h, ...e].some(i => i.raridade === "Lendário");
            },
            recompensa: { gema: 100 },
        },
        {
            id        : "colecao_10",
            serie     : "gacha",
            categoria : CAT.COLECAO,
            raridade  : RAR.PRATA,
            emoji     : "🗃️",
            nome      : "Colecionadora",
            desc      : "Obtenha 10 itens únicos",
            meta      : 10,
            progresso : s => {
                const h = Array.isArray(s.heroisObtidos)       ? s.heroisObtidos       : [];
                const e = Array.isArray(s.equipamentosObtidos) ? s.equipamentosObtidos : [];
                return h.length + e.length;
            },
            check: s => {
                const h = Array.isArray(s.heroisObtidos)       ? s.heroisObtidos       : [];
                const e = Array.isArray(s.equipamentosObtidos) ? s.equipamentosObtidos : [];
                return h.length + e.length >= 10;
            },
            recompensa: { gema: 50 },
        },
        {
            id        : "colecao_epico",
            serie     : "gacha",
            categoria : CAT.COLECAO,
            raridade  : RAR.PLATINA,
            emoji     : "💜",
            nome      : "Épica",
            desc      : "Obtenha 3 itens Épicos",
            meta      : 3,
            progresso : s => {
                const h = Array.isArray(s.heroisObtidos)       ? s.heroisObtidos       : [];
                const e = Array.isArray(s.equipamentosObtidos) ? s.equipamentosObtidos : [];
                return [...h, ...e].filter(i => i.raridade === "Épico").length;
            },
            check: s => {
                const h = Array.isArray(s.heroisObtidos)       ? s.heroisObtidos       : [];
                const e = Array.isArray(s.equipamentosObtidos) ? s.equipamentosObtidos : [];
                return [...h, ...e].filter(i => i.raridade === "Épico").length >= 3;
            },
            recompensa: { gema: 150 },
        },

        // ── ESPECIAIS / OCULTAS ─────────────────────────
        {
            id        : "primeiro_chefe",
            categoria : CAT.BATALHA,
            raridade  : RAR.PRATA,
            emoji     : "👹",
            nome      : "Mata-Chefes",
            desc      : "Derrote seu primeiro Chefe",
            check     : s => (s.totalChefes ?? 0) >= 1,
            recompensa: { gema: 30 },
        },
        {
            id        : "chefe_10",
            categoria : CAT.BATALHA,
            raridade  : RAR.OURO,
            emoji     : "👑",
            nome      : "Caçadora de Chefes",
            desc      : "Derrote 10 Chefes",
            meta      : 10,
            progresso : s => s.totalChefes ?? 0,
            check     : s => (s.totalChefes ?? 0) >= 10,
            recompensa: { gema: 80 },
        },
        {
            id        : "combo_10",
            categoria : CAT.BATALHA,
            raridade  : RAR.PRATA,
            emoji     : "🔥",
            nome      : "Em Chamas",
            desc      : "Alcance 10 hits de combo",
            check     : s => (s.maiorCombo ?? 0) >= 10,
            recompensa: { gema: 25 },
        },
        {
            id        : "sem_gastar_estagio5",
            categoria : CAT.ESPECIAL,
            raridade  : RAR.SAGRADA,
            emoji     : "🙏",
            nome      : "Fé Pura",
            desc      : "Chegue ao estágio 5 sem comprar upgrades",
            oculta    : true,
            check     : s => (s.estagio ?? 1) >= 5 && (s.totalUpgrades ?? 0) === 0,
            recompensa: { gema: 300, titulo: "Pura Fé" },
        },
    ]);

    // ════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════
    const _desbloqueadas = new Set();    // IDs desbloqueados
    let   _inicializado  = false;

    // ════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch { return String(Math.floor(n ?? 0)); }
    }

    function _snapshot() {
        try   { return GameState.snapshot(); }
        catch { return {}; }
    }

    function _contarDesbloqueadas() {
        return _desbloqueadas.size;
    }

    // ════════════════════════════════════════════════════
    // VERIFICAR CONQUISTAS
    // Chamado reativamente via EventBus
    // ════════════════════════════════════════════════════
    function verificar() {
        if (!_inicializado) return;

        const estado = _snapshot();

        DEFS.forEach(def => {
            if (_desbloqueadas.has(def.id)) return;

            let passou = false;
            try { passou = def.check(estado); }
            catch(e) { _log.warn(`Erro no check de "${def.id}":`, e); return; }

            if (passou) _desbloquear(def, estado);
        });
    }

    // ════════════════════════════════════════════════════
    // DESBLOQUEAR
    // ════════════════════════════════════════════════════
    function _desbloquear(def, estado) {
        _desbloqueadas.add(def.id);

        // Persiste no GameState
        try {
            const ids = GameState.get("conquistasIds") ?? [];
            if (!ids.includes(def.id)) {
                GameState.push("conquistasIds", def.id);
            }
        } catch(_) {}

        // Aplica recompensa
        _aplicarRecompensa(def);

        // Notificações
        _notificar(def);

        // Atualiza badge no HUD
        _atualizarBadge();

        // Emite evento
        try {
            EventBus.emit("conquista:desbloqueada", {
                id       : def.id,
                nome     : def.nome,
                raridade : def.raridade.id,
                recompensa: def.recompensa,
            });
        } catch(_) {}

        _log.info(`Conquista desbloqueada: "${def.nome}" [${def.raridade.label}]`);
    }

    // ════════════════════════════════════════════════════
    // RECOMPENSA
    // ════════════════════════════════════════════════════
    function _aplicarRecompensa(def) {
        const r = def.recompensa ?? {};

        try {
            if (r.moeda) {
                GameState.increment("moeda", r.moeda);
                EventBus.emit("moeda:update", { valor: GameState.get("moeda"), delta: r.moeda });
            }
            if (r.gema) {
                GameState.increment("gema", r.gema);
                EventBus.emit("gema:update", { valor: GameState.get("gema"), delta: r.gema });
            }
            if (r.titulo) {
                // Armazena título desbloqueado
                const titulos = GameState.get("titulosDesbloqueados") ?? [];
                if (!titulos.includes(r.titulo)) {
                    GameState.push("titulosDesbloqueados", r.titulo);
                }
            }
        } catch(e) {
            _log.error("Erro ao aplicar recompensa:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // NOTIFICAÇÃO — toast por raridade
    // ════════════════════════════════════════════════════
    function _notificar(def) {
        const r     = def.raridade;
        const recomp = _textoRecompensa(def.recompensa);

        // Mensagem do toast
        const msg = `${def.emoji} ${def.nome}\n${def.desc}${recomp ? `\n🎁 ${recomp}` : ""}`;

        try {
            switch (r.id) {
                case "sagrada":
                    Toast.lendario?.(msg) ?? Toast.mostrar(msg, "lendario", 7000);
                    break;
                case "platina":
                    Toast.mostrar(msg, "lendario", 6000);
                    break;
                case "ouro":
                    Toast.mostrar(msg, "sucesso", 5000);
                    break;
                default:
                    Toast.mostrar(msg, "info", 4000);
            }
        } catch(_) {}

        // Partículas para conquistas especiais
        if (r.id === "sagrada" || r.id === "platina") {
            try { Effects.criarParticulas(window.innerWidth / 2, 80, 25); } catch(_) {}
        }
    }

    function _textoRecompensa(r) {
        if (!r) return "";
        const partes = [];
        if (r.gema)   partes.push(`💎 +${_fmt(r.gema)}`);
        if (r.moeda)  partes.push(`🪙 +${_fmt(r.moeda)}`);
        if (r.titulo) partes.push(`🏷️ "${r.titulo}"`);
        return partes.join("  ");
    }

    // ════════════════════════════════════════════════════
    // BADGE NO HUD
    // ════════════════════════════════════════════════════
    function _atualizarBadge() {
        // Conta conquistas desbloqueadas recentes (não vistas)
        try { UIHud.setBadge("conquistaBadge", 1); } catch(_) {}

        // Mostra badge no HTML diretamente como fallback
        try {
            const el = document.getElementById("conquistaBadge");
            if (el) {
                el.style.display = "inline-flex";
                el.textContent   = "!";
            }
        } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // PROGRESSO DE UMA CONQUISTA (0~1)
    // ════════════════════════════════════════════════════
    function progressoPct(id) {
        const def    = DEFS.find(d => d.id === id);
        if (!def)    return 0;
        if (_desbloqueadas.has(id)) return 1;
        if (!def.progresso || !def.meta) return 0;

        try {
            const estado = _snapshot();
            const atual  = def.progresso(estado) ?? 0;
            return Math.min(1, atual / def.meta);
        } catch { return 0; }
    }

    // ════════════════════════════════════════════════════
    // RENDER DA TELA DE CONQUISTAS
    // ════════════════════════════════════════════════════

    // CSS injetado uma vez
    function _injetarCSS() {
        if (document.getElementById("__achiev_css__")) return;

        const s = document.createElement("style");
        s.id    = "__achiev_css__";
        s.textContent = `
            .__achiev_filtros__ {
                display         : flex;
                gap             : 6px;
                flex-wrap       : wrap;
                margin-bottom   : 10px;
            }
            .__achiev_filtro__ {
                padding         : 3px 12px;
                border-radius   : 20px;
                border          : 1px solid rgba(255,255,255,0.15);
                background      : rgba(255,255,255,0.05);
                color           : rgba(255,255,255,0.55);
                font-size       : 11px;
                font-weight     : 600;
                cursor          : pointer;
                transition      : all 0.15s;
            }
            .__achiev_filtro__.ativo {
                background      : rgba(157,78,221,0.3);
                border-color    : #9d4edd;
                color           : #fff;
            }

            .__achiev_card__ {
                display         : flex;
                align-items     : center;
                gap             : 10px;
                padding         : 10px 12px;
                border-radius   : 10px;
                border          : 1px solid rgba(255,255,255,0.07);
                background      : rgba(255,255,255,0.03);
                margin-bottom   : 6px;
                transition      : background 0.15s, border-color 0.15s;
            }
            .__achiev_card__.desbloqueada {
                background      : rgba(255,255,255,0.06);
                border-color    : rgba(255,255,255,0.14);
            }
            .__achiev_card__.bloqueada { opacity: 0.50; }

            .__achiev_icone__ {
                font-size       : 28px;
                width           : 38px;
                text-align      : center;
                flex-shrink     : 0;
            }
            .__achiev_info__  { flex: 1; min-width: 0; }
            .__achiev_nome__ {
                font-size       : 13px;
                font-weight     : 700;
                color           : #fff;
                display         : flex;
                align-items     : center;
                gap             : 6px;
            }
            .__achiev_rar__ {
                font-size       : 10px;
                font-weight     : 700;
                padding         : 1px 6px;
                border-radius   : 4px;
            }
            .__achiev_desc__ {
                font-size       : 11px;
                color           : rgba(255,255,255,0.50);
                margin-top      : 2px;
            }
            .__achiev_recomp__ {
                font-size       : 11px;
                color           : #c084fc;
                margin-top      : 2px;
            }
            .__achiev_prog_wrap__ {
                height          : 4px;
                background      : rgba(255,255,255,0.10);
                border-radius   : 2px;
                margin-top      : 5px;
                overflow        : hidden;
            }
            .__achiev_prog_fill__ {
                height          : 100%;
                border-radius   : 2px;
                background      : linear-gradient(90deg, #6d28d9, #9d4edd);
                transition      : width 0.5s ease;
            }
            .__achiev_status__ {
                font-size       : 20px;
                flex-shrink     : 0;
            }
            .__achiev_resumo__ {
                text-align      : center;
                font-size       : 12px;
                color           : rgba(255,255,255,0.45);
                margin-bottom   : 10px;
                padding         : 8px;
                background      : rgba(255,255,255,0.04);
                border-radius   : 8px;
            }
            .__achiev_resumo__ strong { color: #c084fc; }
        `;
        document.head.appendChild(s);
    }

    let _filtroCategoria = "todos";
    let _filtroStatus    = "todos";  // "todos" | "desbloqueada" | "bloqueada"

    function renderTela(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        _injetarCSS();

        const estado = _snapshot();
        const total  = DEFS.filter(d => !d.oculta || _desbloqueadas.has(d.id)).length;
        const desbloq = _desbloqueadas.size;

        // Filtros de categoria
        const categorias = [
            { id: "todos",    label: "🏆 Todos"  },
            { id: CAT.BATALHA.id,    label: CAT.BATALHA.label    },
            { id: CAT.PROGRESSAO.id, label: CAT.PROGRESSAO.label },
            { id: CAT.COLECAO.id,    label: CAT.COLECAO.label    },
            { id: CAT.ESPECIAL.id,   label: CAT.ESPECIAL.label   },
        ];

        // Filtros de status
        const statusOpts = [
            { id: "todos",        label: "Todos"         },
            { id: "desbloqueada", label: "✅ Obtidas"    },
            { id: "bloqueada",    label: "🔒 Bloqueadas" },
        ];

        // Filtra conquistas
        const visiveis = DEFS.filter(d => {
            if (d.oculta && !_desbloqueadas.has(d.id)) return false;

            const catOk = _filtroCategoria === "todos"
                || d.categoria.id === _filtroCategoria;

            const statusOk = _filtroStatus === "todos"
                || (_filtroStatus === "desbloqueada" &&  _desbloqueadas.has(d.id))
                || (_filtroStatus === "bloqueada"    && !_desbloqueadas.has(d.id));

            return catOk && statusOk;
        });

        // Ordena: desbloqueadas primeiro, depois por raridade
        const ordRar = { sagrada: 0, platina: 1, ouro: 2, prata: 3, bronze: 4 };
        visiveis.sort((a, b) => {
            const da = _desbloqueadas.has(a.id);
            const db = _desbloqueadas.has(b.id);
            if (da !== db) return da ? -1 : 1;
            return (ordRar[a.raridade.id] ?? 9) - (ordRar[b.raridade.id] ?? 9);
        });

        // Render
        container.innerHTML = "";

        // Resumo
        const resumo = document.createElement("div");
        resumo.className = "__achiev_resumo__";
        resumo.innerHTML =
            `<strong>${desbloq}</strong> / ${total} conquistas desbloqueadas ` +
            `<span style="color:#ffd700">${"⭐".repeat(Math.min(5, Math.floor(desbloq / Math.max(1, total) * 5)))}</span>`;
        container.appendChild(resumo);

        // Filtros de categoria
        _renderFiltros(container, categorias, statusOpts, containerId);

        // Cards
        if (visiveis.length === 0) {
            const vazio = document.createElement("p");
            vazio.style.cssText = "text-align:center;color:rgba(255,255,255,0.35);padding:20px 0;font-size:13px";
            vazio.textContent   = "Nenhuma conquista nesta categoria.";
            container.appendChild(vazio);
            return;
        }

        visiveis.forEach(def => _renderCard(def, estado, container));
    }

    function _renderFiltros(container, categorias, statusOpts, containerId) {
        const wrap = document.createElement("div");
        wrap.className = "__achiev_filtros__";

        categorias.forEach(c => {
            const btn = document.createElement("button");
            btn.className   = "__achiev_filtro__" + (c.id === _filtroCategoria ? " ativo" : "");
            btn.textContent = c.label;
            btn.addEventListener("click", () => {
                _filtroCategoria = c.id;
                renderTela(containerId);
            });
            wrap.appendChild(btn);
        });

        // Separador visual
        const sep = document.createElement("span");
        sep.style.cssText = "border-left:1px solid rgba(255,255,255,0.15);margin:0 4px";
        wrap.appendChild(sep);

        statusOpts.forEach(s => {
            const btn = document.createElement("button");
            btn.className   = "__achiev_filtro__" + (s.id === _filtroStatus ? " ativo" : "");
            btn.textContent = s.label;
            btn.addEventListener("click", () => {
                _filtroStatus = s.id;
                renderTela(containerId);
            });
            wrap.appendChild(btn);
        });

        container.appendChild(wrap);
    }

    function _renderCard(def, estado, container) {
        const desbloq = _desbloqueadas.has(def.id);
        const r       = def.raridade;
        const pct     = progressoPct(def.id);

        const card = document.createElement("div");
        card.className = `__achiev_card__ ${desbloq ? "desbloqueada" : "bloqueada"}`;
        if (desbloq) card.style.borderColor = r.cor + "44";

        // Ícone
        const icone = document.createElement("div");
        icone.className   = "__achiev_icone__";
        icone.textContent = desbloq ? def.emoji : "🔒";

        // Info
        const info = document.createElement("div");
        info.className = "__achiev_info__";

        const nome = document.createElement("div");
        nome.className = "__achiev_nome__";
        nome.innerHTML =
            `${def.nome}` +
            `<span class="__achiev_rar__"
                style="background:${r.cor}22;color:${r.cor};border:1px solid ${r.cor}44">
                ${r.iconeUI} ${r.label}
            </span>`;

        const desc = document.createElement("div");
        desc.className   = "__achiev_desc__";
        desc.textContent = def.desc;

        const recomp = document.createElement("div");
        recomp.className = "__achiev_recomp__";
        recomp.textContent = `🎁 ${_textoRecompensa(def.recompensa)}`;

        info.appendChild(nome);
        info.appendChild(desc);
        info.appendChild(recomp);

        // Barra de progresso (se não desbloqueada e tem meta)
        if (!desbloq && def.meta && def.progresso) {
            try {
                const atual = def.progresso(estado) ?? 0;
                const progWrap = document.createElement("div");
                progWrap.className = "__achiev_prog_wrap__";

                const progFill = document.createElement("div");
                progFill.className = "__achiev_prog_fill__";
                progFill.style.width = `${(pct * 100).toFixed(1)}%`;

                progWrap.appendChild(progFill);
                info.appendChild(progWrap);

                const progTxt = document.createElement("div");
                progTxt.style.cssText = "font-size:10px;color:rgba(255,255,255,0.35);margin-top:2px";
                progTxt.textContent   = `${_fmt(atual)} / ${_fmt(def.meta)}`;
                info.appendChild(progTxt);
            } catch(_) {}
        }

        // Status
        const status = document.createElement("div");
        status.className   = "__achiev_status__";
        status.textContent = desbloq ? "✅" : "";

        card.appendChild(icone);
        card.appendChild(info);
        card.appendChild(status);
        container.appendChild(card);
    }

    // ════════════════════════════════════════════════════
    // CARREGAR SAVE
    // ════════════════════════════════════════════════════
    function _carregarSave() {
        try {
            const ids = GameState.get("conquistasIds") ?? [];
            ids.forEach(id => _desbloqueadas.add(id));
            _log.debug(`${_desbloqueadas.size} conquistas carregadas do save.`);
        } catch(e) {
            _log.warn("Erro ao carregar conquistas:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR EVENTOS
    // Verificação reativa — não usa polling
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Eventos que podem desbloquear conquistas
            const gatilhos = [
                "kill:registrado",
                "estagio:avancou",
                "nivel:up",
                "upgrade:comprado",
                "prestigio:feito",
                "gacha:pull",
                "gacha:pull:lendario",
                "item:equipado",
                "combo:atualizado",
                "state:carregado",
            ];

            gatilhos.forEach(ev => {
                EventBus.on(ev, () => verificar());
            });

            // Evento específico de kill de chefe
            EventBus.on("kill:registrado", ({ chefe }) => {
                if (chefe) {
                    try { GameState.increment("totalChefes", 1); } catch(_) {}
                }
                verificar();
            });

            // Maior combo
            EventBus.on("combo:atualizado", ({ combo }) => {
                try {
                    const maiorAtual = GameState.get("maiorCombo") ?? 0;
                    if (combo > maiorAtual) GameState.set("maiorCombo", combo);
                } catch(_) {}
                verificar();
            });

            // Tela de conquistas aberta
            EventBus.on("modal:aberto", ({ id }) => {
                if (id === "modalConquistas") {
                    renderTela("listaConquistas");
                    // Limpa badge ao abrir
                    try { UIHud.setBadge("conquistaBadge", 0); } catch(_) {}
                    try {
                        const el = document.getElementById("conquistaBadge");
                        if (el) el.style.display = "none";
                    } catch(_) {}
                }
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        _injetarCSS();
        _carregarSave();
        _registrarEventos();
        _inicializado = true;

        // Verificação inicial (conquistas já merecidas no load)
        setTimeout(verificar, 500);

        _log.info(`Achievements inicializado. ${DEFS.length} conquistas definidas.`);
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            total        : DEFS.length,
            desbloqueadas: _desbloqueadas.size,
            ids          : [..._desbloqueadas],
            pct          : `${Math.round((_desbloqueadas.size / DEFS.length) * 100)}%`,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        verificar,
        renderTela,
        progressoPct,
        estaDesbloqueada : id => _desbloqueadas.has(id),
        stats,

        // Para testes/debug
        get defs() { return DEFS; },
    });

})();
