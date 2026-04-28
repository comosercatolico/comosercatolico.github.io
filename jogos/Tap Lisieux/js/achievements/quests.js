// ═══════════════════════════════════════════════════════
//  QUESTS.JS
//  Sistema de Missões Diárias e Semanais completo:
//  - Pool de missões declarativas com progressão
//  - Reset automático (diárias: 00h00, semanais: segunda)
//  - Coleta de recompensas com animação
//  - Persistência via GameState/localStorage
//  - Contagem regressiva em tempo real
//  - Missões encadeadas (série: completa A para liberar B)
//  - Badge no HUD e abas
//  - Bônus de streak (dias consecutivos)
//
//  Depende de: event-bus.js, state.js, economy.js,
//              toast.js, dom-cache.js
//  Usado por: main.js
// ═══════════════════════════════════════════════════════

"use strict";

const Quests = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Quests"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        STORAGE_KEY        : "taplisieux_quests_v2",
        TIMER_TICK_MS      : 1000,       // atualiza countdown a cada 1s
        MAX_DIARIAS        : 4,          // quantas diárias sortear por dia
        MAX_SEMANAIS       : 3,          // quantas semanais sortear por semana
        STREAK_BONUS_PCT   : 0.10,       // +10% por dia consecutivo
        STREAK_MAX         : 7,          // cap de streak para bônus
        SEED_DIARIA_KEY    : "questSeedDiaria",
        SEED_SEMANAL_KEY   : "questSeedSemanal",
    });

    // ════════════════════════════════════════════════════
    // TIPOS DE MISSÃO
    // ════════════════════════════════════════════════════
    const TIPO = Object.freeze({
        KILLS    : "kills",
        ESTAGIO  : "estagio",
        MOEDA    : "moeda",
        UPGRADE  : "upgrade",
        COMBO    : "combo",
        GACHA    : "gacha",
        BOSS     : "boss",
        CLICK    : "click",
        DANO     : "dano",
        LOGIN    : "login",
    });

    // ════════════════════════════════════════════════════
    // POOL DE MISSÕES DIÁRIAS
    // Sorteadas a cada reset diário
    // ════════════════════════════════════════════════════
    const POOL_DIARIAS = Object.freeze([
        {
            id         : "d_kills_20",
            tipo       : TIPO.KILLS,
            emoji      : "⚔️",
            nome       : "Guerreira do Dia",
            desc       : "Derrote {meta} inimigos",
            meta       : 20,
            recompensa : { moeda: 500,  gema: 5  },
        },
        {
            id         : "d_kills_50",
            tipo       : TIPO.KILLS,
            emoji      : "💀",
            nome       : "Implacável",
            desc       : "Derrote {meta} inimigos",
            meta       : 50,
            recompensa : { moeda: 1200, gema: 10 },
        },
        {
            id         : "d_kills_100",
            tipo       : TIPO.KILLS,
            emoji      : "🗡️",
            nome       : "Aniquiladora",
            desc       : "Derrote {meta} inimigos",
            meta       : 100,
            recompensa : { moeda: 2500, gema: 20 },
        },
        {
            id         : "d_estagio_5",
            tipo       : TIPO.ESTAGIO,
            emoji      : "🗺️",
            nome       : "Exploradora",
            desc       : "Avance {meta} estágios",
            meta       : 5,
            recompensa : { moeda: 400,  gema: 5  },
        },
        {
            id         : "d_estagio_15",
            tipo       : TIPO.ESTAGIO,
            emoji      : "🌍",
            nome       : "Desbravadora",
            desc       : "Avance {meta} estágios",
            meta       : 15,
            recompensa : { moeda: 1000, gema: 12 },
        },
        {
            id         : "d_upgrade_5",
            tipo       : TIPO.UPGRADE,
            emoji      : "📈",
            nome       : "Aprimorada",
            desc       : "Faça {meta} upgrades",
            meta       : 5,
            recompensa : { moeda: 300,  gema: 3  },
        },
        {
            id         : "d_upgrade_15",
            tipo       : TIPO.UPGRADE,
            emoji      : "⚙️",
            nome       : "Engenheira",
            desc       : "Faça {meta} upgrades",
            meta       : 15,
            recompensa : { moeda: 800,  gema: 8  },
        },
        {
            id         : "d_combo_5",
            tipo       : TIPO.COMBO,
            emoji      : "🔥",
            nome       : "Em Chamas",
            desc       : "Alcance {meta}x de combo",
            meta       : 5,
            recompensa : { moeda: 350,  gema: 4  },
        },
        {
            id         : "d_combo_15",
            tipo       : TIPO.COMBO,
            emoji      : "💥",
            nome       : "Combo Explosivo",
            desc       : "Alcance {meta}x de combo",
            meta       : 15,
            recompensa : { moeda: 900,  gema: 10 },
        },
        {
            id         : "d_boss_1",
            tipo       : TIPO.BOSS,
            emoji      : "👹",
            nome       : "Caça ao Chefe",
            desc       : "Derrote {meta} chefe(s)",
            meta       : 1,
            recompensa : { moeda: 600,  gema: 8  },
        },
        {
            id         : "d_boss_3",
            tipo       : TIPO.BOSS,
            emoji      : "👑",
            nome       : "Domadora de Chefes",
            desc       : "Derrote {meta} chefes",
            meta       : 3,
            recompensa : { moeda: 1500, gema: 18 },
        },
        {
            id         : "d_click_100",
            tipo       : TIPO.CLICK,
            emoji      : "👆",
            nome       : "Toque Sagrado",
            desc       : "Toque {meta} vezes na batalha",
            meta       : 100,
            recompensa : { moeda: 200,  gema: 3  },
        },
        {
            id         : "d_click_500",
            tipo       : TIPO.CLICK,
            emoji      : "✋",
            nome       : "Tocadora Incansável",
            desc       : "Toque {meta} vezes na batalha",
            meta       : 500,
            recompensa : { moeda: 800,  gema: 8  },
        },
        {
            id         : "d_gacha_1",
            tipo       : TIPO.GACHA,
            emoji      : "✨",
            nome       : "Invocadora",
            desc       : "Faça {meta} invocação(ões)",
            meta       : 1,
            recompensa : { moeda: 200,  gema: 5  },
        },
        {
            id         : "d_login",
            tipo       : TIPO.LOGIN,
            emoji      : "🌅",
            nome       : "Presença Diária",
            desc       : "Entre no jogo hoje",
            meta       : 1,
            recompensa : { moeda: 100,  gema: 3  },
            auto       : true,   // completa automaticamente no login
        },
    ]);

    // ════════════════════════════════════════════════════
    // POOL DE MISSÕES SEMANAIS
    // ════════════════════════════════════════════════════
    const POOL_SEMANAIS = Object.freeze([
        {
            id         : "s_kills_500",
            tipo       : TIPO.KILLS,
            emoji      : "⚔️",
            nome       : "Limpeza Semanal",
            desc       : "Derrote {meta} inimigos nesta semana",
            meta       : 500,
            recompensa : { moeda: 5000,  gema: 50  },
        },
        {
            id         : "s_kills_2000",
            tipo       : TIPO.KILLS,
            emoji      : "💀",
            nome       : "Massacre Sagrado",
            desc       : "Derrote {meta} inimigos nesta semana",
            meta       : 2000,
            recompensa : { moeda: 15000, gema: 150 },
        },
        {
            id         : "s_estagio_30",
            tipo       : TIPO.ESTAGIO,
            emoji      : "🌍",
            nome       : "Grande Jornada",
            desc       : "Avance {meta} estágios nesta semana",
            meta       : 30,
            recompensa : { moeda: 8000,  gema: 80  },
        },
        {
            id         : "s_upgrade_50",
            tipo       : TIPO.UPGRADE,
            emoji      : "🔧",
            nome       : "Mestra dos Upgrades",
            desc       : "Faça {meta} upgrades nesta semana",
            meta       : 50,
            recompensa : { moeda: 6000,  gema: 60  },
        },
        {
            id         : "s_boss_10",
            tipo       : TIPO.BOSS,
            emoji      : "👑",
            nome      : "Limpeza de Chefes",
            desc      : "Derrote {meta} chefes nesta semana",
            meta      : 10,
            recompensa: { moeda: 10000, gema: 100 },
        },
        {
            id         : "s_gacha_10",
            tipo       : TIPO.GACHA,
            emoji      : "🌟",
            nome       : "Invocadora Dedicada",
            desc       : "Faça {meta} invocações nesta semana",
            meta       : 10,
            recompensa : { moeda: 4000,  gema: 80  },
        },
        {
            id         : "s_prestigio_1",
            tipo       : TIPO.KILLS,  // gatilho via EventBus
            emoji      : "🌸",
            nome       : "Renascida",
            desc       : "Faça {meta} prestígio nesta semana",
            meta       : 1,
            gatilho    : "prestigio:feito",
            recompensa : { moeda: 20000, gema: 200 },
        },
        {
            id         : "s_streak_7",
            tipo       : TIPO.LOGIN,
            emoji      : "🔥",
            nome       : "Semana Perfeita",
            desc       : "Entre no jogo por {meta} dias seguidos",
            meta       : 7,
            recompensa : { moeda: 5000,  gema: 100, titulo: "Dedicada" },
        },
    ]);

    // ════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════

    /**
     * Missão ativa:
     * {
     *   def         : ref para POOL
     *   progresso   : number  (acumulado na sessão atual)
     *   coletada    : boolean
     *   tipo        : "diaria" | "semanal"
     * }
     */
    let _diarias  = [];
    let _semanais = [];

    let _streak       = 0;
    let _ultimoLogin  = 0;   // timestamp do último login (meia-noite)
    let _timerTick    = null;
    let _inicializado = false;

    // Contadores de sessão (resetam ao fechar o jogo)
    const _sessao = {
        kills   : 0,
        estagios: 0,
        upgrades: 0,
        combo   : 0,
        boss    : 0,
        clicks  : 0,
        gacha   : 0,
    };

    // ════════════════════════════════════════════════════
    // HELPERS DE DATA
    // ════════════════════════════════════════════════════

    /** Retorna meia-noite do dia atual (timestamp) */
    function _meiaNoiteHoje() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    /** Retorna meia-noite da última segunda-feira */
    function _inicioSemana() {
        const d = new Date();
        const dia = d.getDay();          // 0=dom, 1=seg...
        const diff = (dia === 0 ? -6 : 1 - dia);   // volta para seg
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
        }

    /** Formata ms restantes em "Xh Ym" ou "Xm Ys" */
    function _formatarTempo(ms) {
        if (ms <= 0) return "00:00:00";
        const s  = Math.floor(ms / 1000);
        const h  = Math.floor(s / 3600);
        const m  = Math.floor((s % 3600) / 60);
        const sc = s % 60;
        return [h, m, sc].map(v => String(v).padStart(2, "0")).join(":");
    }

    /** Seed determinístico por dia para sortear as mesmas missões */
    function _seedDia(ts) {
        return Math.floor(ts / 86400000);
    }

    /** RNG seeded simples (LCG) */
    function _rng(seed) {
        let s = seed;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
            return (s >>> 0) / 0xFFFFFFFF;
        };
    }

    /** Sorteia `qtd` itens únicos de `pool` usando seed */
    function _sortear(pool, qtd, seed) {
        const rand   = _rng(seed);
        const copia  = [...pool];
        const result = [];
        while (result.length < qtd && copia.length > 0) {
            const idx = Math.floor(rand() * copia.length);
            result.push(copia.splice(idx, 1)[0]);
        }
        return result;
    }

    // ════════════════════════════════════════════════════
    // HELPER — formata número
    // ════════════════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch { return String(Math.floor(n ?? 0)); }
    }

    // ════════════════════════════════════════════════════
    // PERSISTÊNCIA
    // ════════════════════════════════════════════════════
    function _salvar() {
        try {
            const data = {
                v           : 2,
                ts          : Date.now(),
                streak      : _streak,
                ultimoLogin : _ultimoLogin,
                diarias     : _diarias.map(m => ({
                    id       : m.def.id,
                    progresso: m.progresso,
                    coletada : m.coletada,
                })),
                semanais    : _semanais.map(m => ({
                    id       : m.def.id,
                    progresso: m.progresso,
                    coletada : m.coletada,
                })),
            };
            localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(data));
        } catch(e) {
            _log.error("Erro ao salvar quests:", e);
        }
    }

    function _carregar() {
        try {
            const raw = localStorage.getItem(CFG.STORAGE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (data.v !== 2) return null;
            return data;
        } catch {
            return null;
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAR MISSÕES DO DIA/SEMANA
    // ════════════════════════════════════════════════════
    function _inicializarDiarias(save) {
        const seedDia   = _seedDia(_meiaNoiteHoje());
        const sorteadas = _sortear(POOL_DIARIAS, CFG.MAX_DIARIAS, seedDia + 1);

        _diarias = sorteadas.map(def => {
            // Restaura progresso do save se existir e for do mesmo dia
            const salvo = save?.diarias?.find(s => s.id === def.id);
            return {
                def,
                progresso : salvo?.progresso ?? 0,
                coletada  : salvo?.coletada  ?? false,
                tipo      : "diaria",
            };
        });

        // Completa missão de login automaticamente
        _diarias.forEach(m => {
            if (m.def.auto) {
                m.progresso = m.def.meta;
            }
        });

        _log.debug(`${_diarias.length} diárias inicializadas.`);
    }

    function _inicializarSemanais(save) {
        const seedSem   = _seedDia(_inicioSemana());
        const sorteadas = _sortear(POOL_SEMANAIS, CFG.MAX_SEMANAIS, seedSem + 99);

        _semanais = sorteadas.map(def => {
            const salvo = save?.semanais?.find(s => s.id === def.id);
            return {
                def,
                progresso : salvo?.progresso ?? 0,
                coletada  : salvo?.coletada  ?? false,
                tipo      : "semanal",
            };
        });

        _log.debug(`${_semanais.length} semanais inicializadas.`);
    }

    // ════════════════════════════════════════════════════
    // STREAK — dias consecutivos de login
    // ════════════════════════════════════════════════════
    function _verificarStreak(save) {
        const hoje    = _meiaNoiteHoje();
        const ontem   = hoje - 86400000;
        const ultimo  = save?.ultimoLogin ?? 0;

        if (ultimo === hoje) {
            // Já logou hoje — mantém streak
            _streak      = save?.streak ?? 1;
            _ultimoLogin = hoje;
            return;
        }

        if (ultimo === ontem) {
            // Logou ontem — incrementa streak
            _streak = Math.min((save?.streak ?? 0) + 1, CFG.STREAK_MAX * 2);
        } else if (ultimo < ontem) {
            // Pulou um dia — quebra streak
            _streak = 1;
        }

        _ultimoLogin = hoje;
        _salvar();
    }

    function _bonusStreak() {
        const dias = Math.min(_streak, CFG.STREAK_MAX);
        return 1 + (dias - 1) * CFG.STREAK_BONUS_PCT;
    }

    // ════════════════════════════════════════════════════
    // VERIFICAR RESETS
    // ════════════════════════════════════════════════════
    function _verificarResets(save) {
        const agora      = Date.now();
        const seedDiaAtual = _seedDia(_meiaNoiteHoje());
        const seedSalvo    = save ? _seedDia(save.ts ?? 0) : -1;

        // Reset diário
        if (seedDiaAtual !== seedSalvo) {
            _log.info("Reset diário de quests.");
            _inicializarDiarias(null);    // null = sem restaurar progresso
        } else {
            _inicializarDiarias(save);
        }

        // Reset semanal
        const inicioSem   = _inicioSemana();
        const inicioSemSalvo = save ? _inicioSemana() : -1;
        if (!save || save.ts < inicioSem) {
            _log.info("Reset semanal de quests.");
            _inicializarSemanais(null);
        } else {
            _inicializarSemanais(save);
        }
    }

    // ════════════════════════════════════════════════════
    // INCREMENTAR PROGRESSO
    // ════════════════════════════════════════════════════
    function _incrementar(tipo, qtd = 1) {
        let atualizou = false;

        const todas = [..._diarias, ..._semanais];
        todas.forEach(m => {
            if (m.coletada) return;
            if (m.def.tipo !== tipo) return;

            const anterior = m.progresso;
            m.progresso    = Math.min(m.def.meta, m.progresso + qtd);

            if (m.progresso !== anterior) {
                atualizou = true;

                // Chegou na meta?
                if (m.progresso >= m.def.meta) {
                    _notificarPronta(m);
                }
            }
        });

        if (atualizou) {
            _salvar();
            _atualizarBadge();
        }
    }

    // ════════════════════════════════════════════════════
    // COLETAR RECOMPENSA
    // ════════════════════════════════════════════════════
    function coletar(questId) {
        const missao = [..._diarias, ..._semanais].find(m => m.def.id === questId);

        if (!missao) {
            _log.warn(`Quest "${questId}" não encontrada.`);
            return false;
        }
        if (missao.progresso < missao.def.meta) {
            try { Toast.aviso("⏳ Missão ainda não concluída!"); } catch(_) {}
            return false;
        }
        if (missao.coletada) {
            try { Toast.info("✅ Recompensa já coletada!"); } catch(_) {}
            return false;
        }

        missao.coletada = true;

        // Aplica recompensa com bônus de streak
        const bonus  = _bonusStreak();
        const r      = missao.def.recompensa ?? {};
        const moedaR = Math.floor((r.moeda ?? 0) * bonus);
        const gemaR  = r.gema ?? 0;

        try {
            if (moedaR > 0) {
                GameState.increment("moeda", moedaR);
                EventBus.emit("moeda:update", { valor: GameState.get("moeda"), delta: moedaR });
            }
            if (gemaR > 0) {
                GameState.increment("gema", gemaR);
                EventBus.emit("gema:update", { valor: GameState.get("gema"), delta: gemaR });
            }
            if (r.titulo) {
                const titulos = GameState.get("titulosDesbloqueados") ?? [];
                if (!titulos.includes(r.titulo)) GameState.push("titulosDesbloqueados", r.titulo);
            }
        } catch(e) {
            _log.error("Erro ao aplicar recompensa:", e);
        }

        // Toast de recompensa
        const bonusTxt = bonus > 1 ? ` (×${bonus.toFixed(1)} streak!)` : "";
        const partes   = [];
        if (moedaR > 0) partes.push(`🪙 ${_fmt(moedaR)}`);
        if (gemaR  > 0) partes.push(`💎 ${_fmt(gemaR)}`);
        if (r.titulo)   partes.push(`🏷️ "${r.titulo}"`);

        try {
            Toast.sucesso(
                `${missao.def.emoji} ${missao.def.nome} concluída!\n🎁 ${partes.join("  ")}${bonusTxt}`,
                5000
            );
        } catch(_) {}

        // Efeito visual
        try { Effects.criarMoedasCaindo(5); } catch(_) {}

        _salvar();
        _atualizarBadge();
        _renderizar();

        try {
            EventBus.emit("quest:coletada", {
                id      : questId,
                tipo    : missao.tipo,
                restantes: _contarProntas(),
            });
        } catch(_) {}

        _log.info(`Quest coletada: "${missao.def.nome}" (+${partes.join(", ")}${bonusTxt})`);
        return true;
    }

    // ════════════════════════════════════════════════════
    // NOTIFICAÇÕES
    // ════════════════════════════════════════════════════
    function _notificarPronta(missao) {
        const tipo = missao.tipo === "diaria" ? "Diária" : "Semanal";
        try {
            Toast.mostrar(
                `📜 ${missao.def.emoji} Missão ${tipo} concluída!\n"${missao.def.nome}" — Clique para coletar!`,
                "sucesso",
                5000
            );
        } catch(_) {}

        try {
            EventBus.emit("quest:disponivel", { count: _contarProntas() });
        } catch(_) {}
    }

    function _contarProntas() {
        return [..._diarias, ..._semanais]
            .filter(m => m.progresso >= m.def.meta && !m.coletada)
            .length;
    }

    // ════════════════════════════════════════════════════
    // BADGE NO HUD
    // ════════════════════════════════════════════════════
    function _atualizarBadge() {
        const prontas = _contarProntas();

        try { UIHud.setBadge("questBadge",        prontas); } catch(_) {}
        try { UIHud.setBadge("questBadgeBatalha",  prontas); } catch(_) {}
        try { UIUpgrades.setAbaBadge("missoes",    prontas); } catch(_) {}

        // Fallback direto no DOM
        ["questBadge", "questBadgeBatalha"].forEach(id => {
            try {
                const el = document.getElementById(id);
                if (!el) return;
                el.textContent   = prontas > 0 ? String(prontas > 99 ? "99+" : prontas) : "";
                el.style.display = prontas > 0 ? "inline-flex" : "none";
            } catch(_) {}
        });
    }

    // ════════════════════════════════════════════════════
    // CSS
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__quests_css__")) return;

        const s = document.createElement("style");
        s.id    = "__quests_css__";
        s.textContent = `
            /* ── Cabeçalho de seção ── */
            .__quest_header__ {
                display         : flex;
                align-items     : center;
                justify-content : space-between;
                margin-bottom   : 10px;
            }
            .__quest_titulo__ {
                font-size       : 13px;
                font-weight     : 800;
                color           : #c084fc;
                letter-spacing  : 0.3px;
            }
            .__quest_reset__ {
                font-size       : 11px;
                color           : rgba(255,255,255,0.40);
                font-variant-numeric: tabular-nums;
            }

            /* ── Streak banner ── */
            .__streak_banner__ {
                display         : flex;
                align-items     : center;
                gap             : 8px;
                padding         : 8px 12px;
                background      : linear-gradient(135deg,
                    rgba(255,140,0,0.15), rgba(255,60,0,0.10));
                border          : 1px solid rgba(255,140,0,0.30);
                border-radius   : 10px;
                margin-bottom   : 10px;
                font-size       : 12px;
                color           : rgba(255,255,255,0.80);
            }
            .__streak_fogo__ {
                font-size       : 20px;
                animation       : __streak_bob__ 0.8s ease-in-out infinite alternate;
            }
            @keyframes __streak_bob__ {
                from { transform: scale(1);    }
                to   { transform: scale(1.15); }
            }
            .__streak_info__ { flex: 1; }
            .__streak_num__ {
                font-size       : 16px;
                font-weight     : 800;
                color           : #f5a623;
            }
            .__streak_bonus__ {
                font-size       : 11px;
                color           : #44ff88;
            }

            /* ── Card de quest ── */
            .__quest_card__ {
                display         : flex;
                align-items     : center;
                gap             : 10px;
                padding         : 10px 12px;
                border-radius   : 10px;
                border          : 1px solid rgba(255,255,255,0.07);
                background      : rgba(255,255,255,0.03);
                margin-bottom   : 6px;
                transition      : border-color 0.2s, background 0.2s;
            }
            .__quest_card__.pronta {
                border-color    : rgba(68,255,136,0.35);
                background      : rgba(68,255,136,0.05);
            }
            .__quest_card__.coletada {
                opacity         : 0.45;
            }

            /* ── Ícone ── */
            .__quest_icone__ {
                font-size       : 26px;
                width           : 36px;
                text-align      : center;
                flex-shrink     : 0;
            }

            /* ── Info ── */
            .__quest_info__  { flex: 1; min-width: 0; }
            .__quest_nome__ {
                font-size       : 13px;
                font-weight     : 700;
                color           : #fff;
                white-space     : nowrap;
                overflow        : hidden;
                text-overflow   : ellipsis;
            }
            .__quest_desc__ {
                font-size       : 11px;
                color           : rgba(255,255,255,0.50);
                margin-top      : 1px;
            }
            .__quest_recomp__ {
                font-size       : 11px;
                color           : #c084fc;
                margin-top      : 2px;
            }

            /* ── Barra de progresso ── */
            .__quest_prog_wrap__ {
                height          : 5px;
                background      : rgba(255,255,255,0.10);
                border-radius   : 3px;
                margin-top      : 5px;
                overflow        : hidden;
            }
            .__quest_prog_fill__ {
                height          : 100%;
                border-radius   : 3px;
                background      : linear-gradient(90deg, #6d28d9, #44ff88);
                transition      : width 0.5s cubic-bezier(.4,1.2,.6,1);
            }
            .__quest_prog_txt__ {
                font-size       : 10px;
                color           : rgba(255,255,255,0.35);
                margin-top      : 2px;
            }

            /* ── Botão de coletar ── */
            .__quest_btn__ {
                flex-shrink     : 0;
                padding         : 7px 12px;
                border          : none;
                border-radius   : 8px;
                font-size       : 12px;
                font-weight     : 700;
                cursor          : pointer;
                transition      : transform 0.1s, opacity 0.15s;
                line-height     : 1;
                white-space     : nowrap;
            }
            .__quest_btn__:active { transform: scale(0.93); }
            .__quest_btn__.pronto {
                background      : linear-gradient(135deg, #16a34a, #22c55e);
                color           : #fff;
                animation       : __quest_pulso__ 1.2s ease-in-out infinite alternate;
            }
            @keyframes __quest_pulso__ {
                from { box-shadow: 0 0 6px rgba(34,197,94,0.4); }
                to   { box-shadow: 0 0 16px rgba(34,197,94,0.9); }
            }
            .__quest_btn__.andamento {
                background      : rgba(255,255,255,0.07);
                color           : rgba(255,255,255,0.35);
                cursor          : not-allowed;
            }
            .__quest_btn__.coletada {
                background      : rgba(255,255,255,0.04);
                color           : rgba(255,255,255,0.25);
                cursor          : default;
            }

            /* ── Vazio ── */
            .__quest_vazio__ {
                text-align      : center;
                color           : rgba(255,255,255,0.30);
                font-size       : 13px;
                padding         : 20px 0;
            }
        `;
        document.head.appendChild(s);
    }

    // ════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════
    function _renderizar() {
        _renderSecao("listaQuestsDiarias",         _diarias,  "diaria");
        _renderSecao("listaQuestsSemanais",        _semanais, "semanal");
        _renderSecao("listaQuestsDiariasBatalha",  _diarias,  "diaria");
        _renderSecao("listaQuestsSemanaisBatalha", _semanais, "semanal");
        _renderStreak();
        _atualizarTimers();
    }

    function _renderSecao(containerId, missoes, tipo) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = "";

        if (missoes.length === 0) {
            const p = document.createElement("p");
            p.className   = "__quest_vazio__";
            p.textContent = "Nenhuma missão disponível.";
            container.appendChild(p);
            return;
        }

        missoes.forEach(m => _renderCard(m, container));
    }

    function _renderCard(missao, container) {
        const { def, progresso, coletada } = missao;
        const pronta  = progresso >= def.meta && !coletada;
        const pct     = Math.min(1, progresso / def.meta);

        const r = def.recompensa ?? {};
        const bonus = _bonusStreak();
        const moedaR = Math.floor((r.moeda ?? 0) * bonus);
        const recompTxt = [
            moedaR > 0 ? `🪙 ${_fmt(moedaR)}` : "",
            r.gema   ? `💎 ${_fmt(r.gema)}`    : "",
            r.titulo ? `🏷️ "${r.titulo}"`      : "",
        ].filter(Boolean).join("  ");

        const descFormatada = (def.desc ?? "").replace("{meta}", _fmt(def.meta));

        const card = document.createElement("div");
        card.className = `__quest_card__${pronta ? " pronta" : ""}${coletada ? " coletada" : ""}`;

        const icone = document.createElement("div");
        icone.className   = "__quest_icone__";
        icone.textContent = coletada ? "✅" : def.emoji;

        const info = document.createElement("div");
        info.className = "__quest_info__";

        const nome = document.createElement("div");
        nome.className   = "__quest_nome__";
        nome.textContent = def.nome;

        const desc = document.createElement("div");
        desc.className   = "__quest_desc__";
        desc.textContent = descFormatada;

        const recomp = document.createElement("div");
        recomp.className   = "__quest_recomp__";
        recomp.textContent = `🎁 ${recompTxt}`;

        // Barra de progresso
        const progWrap = document.createElement("div");
        progWrap.className = "__quest_prog_wrap__";
        const progFill = document.createElement("div");
        progFill.className = "__quest_prog_fill__";
        progFill.style.width = `${(pct * 100).toFixed(1)}%`;
        progWrap.appendChild(progFill);

        const progTxt = document.createElement("div");
        progTxt.className   = "__quest_prog_txt__";
        progTxt.textContent = coletada
            ? "✅ Recompensa coletada"
            : `${_fmt(progresso)} / ${_fmt(def.meta)}`;

        info.append(nome, desc, recomp, progWrap, progTxt);

        // Botão
        const btn = document.createElement("button");
        if (coletada) {
            btn.className   = "__quest_btn__ coletada";
            btn.textContent = "✅";
            btn.disabled    = true;
        } else if (pronta) {
            btn.className   = "__quest_btn__ pronto";
            btn.textContent = "🎁 Coletar";
            btn.addEventListener("click", () => coletar(def.id));
        } else {
            btn.className   = "__quest_btn__ andamento";
            btn.textContent = `${Math.round(pct * 100)}%`;
            btn.disabled    = true;
        }

        card.append(icone, info, btn);
        container.appendChild(card);
    }

    function _renderStreak() {
        const bonus    = _bonusStreak();
        const bonusTxt = bonus > 1
            ? `+${Math.round((bonus - 1) * 100)}% de bônus nas recompensas!`
            : "Entre amanhã para iniciar o streak!";

        const banner = `
            <div class="__streak_banner__">
                <span class="__streak_fogo__">🔥</span>
                <div class="__streak_info__">
                    <div>Streak: <span class="__streak_num__">${_streak} dia${_streak !== 1 ? "s" : ""}</span></div>
                    <div class="__streak_bonus__">${bonusTxt}</div>
                </div>
            </div>
        `;

        // Insere nos containers de quests se existirem
        ["listaQuestsDiarias", "listaQuestsDiariasBatalha"].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            // Remove banner anterior se existir
            el.previousElementSibling?.classList.contains("__streak_banner__")
                && el.previousElementSibling.remove();
            el.insertAdjacentHTML("beforebegin", banner);
        });
    }

    // ════════════════════════════════════════════════════
    // TIMERS DE RESET
    // ════════════════════════════════════════════════════
    function _atualizarTimers() {
        const agora   = Date.now();

        // Próximo reset diário
        const proxDia = _meiaNoiteHoje() + 86400000;
        const restDia = proxDia - agora;

        // Próximo reset semanal (próxima segunda)
        const proxSem = _inicioSemana() + 7 * 86400000;
        const restSem = proxSem - agora;

        _setTimer("questResetTimer",        _formatarTempo(restDia), "Diárias resetam em");
        _setTimer("questResetTimerBatalha", _formatarTempo(restDia), "Diárias resetam em");
        _setTimer("questResetTimerSemanal", _formatarTempo(restSem), "Semanais resetam em");
    }

    function _setTimer(id, tempo, label) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML =
            `<span style="color:rgba(255,255,255,0.40);font-size:11px">
                ⏱️ ${label}: <strong style="font-variant-numeric:tabular-nums">${tempo}</strong>
            </span>`;
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR EVENTOS DO EVENTBUS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // ── Kills ──
            EventBus.on("kill:registrado", ({ chefe }) => {
                _sessao.kills++;
                _incrementar(TIPO.KILLS, 1);
                if (chefe) {
                    _sessao.boss++;
                    _incrementar(TIPO.BOSS, 1);
                }
            });

            // ── Estágio avançou ──
            EventBus.on("estagio:avancou", () => {
                _sessao.estagios++;
                _incrementar(TIPO.ESTAGIO, 1);
            });

            // ── Upgrade comprado ──
            EventBus.on("upgrade:comprado", () => {
                _sessao.upgrades++;
                _incrementar(TIPO.UPGRADE, 1);
            });

            // ── Combo ──
            EventBus.on("combo:atualizado", ({ combo }) => {
                if (combo > _sessao.combo) {
                    const delta  = combo - _sessao.combo;
                    _sessao.combo = combo;
                    _incrementar(TIPO.COMBO, delta);
                }
            });
            EventBus.on("combo:resetado", () => {
                _sessao.combo = 0;
            });

            // ── Click na batalha ──
            EventBus.on("damage:click", () => {
                _sessao.clicks++;
                _incrementar(TIPO.CLICK, 1);
            });

            // ── Gacha pull ──
            EventBus.on("gacha:pull", ({ resultados }) => {
                const qtd = resultados?.length ?? 1;
                _sessao.gacha += qtd;
                _incrementar(TIPO.GACHA, qtd);
            });

            // ── Prestígio ──
            EventBus.on("prestigio:feito", () => {
                _incrementar(TIPO.KILLS, 0);   // trigger genérico
                // Missão específica de prestígio
                _semanais.forEach(m => {
                    if (m.def.gatilho === "prestigio:feito" && !m.coletada) {
                        m.progresso = Math.min(m.def.meta, m.progresso + 1);
                        if (m.progresso >= m.def.meta) _notificarPronta(m);
                        _salvar();
                    }
                });
            });

            // ── Abrir tela de missões ──
            EventBus.on("modal:aberto", ({ id }) => {
                if (id === "modalMissoes") {
                    _renderizar();
                }
            });
            EventBus.on("aba:aberta", ({ id }) => {
                if (id === "missoes") _renderizar();
            });

            // ── State carregado (reload do save) ──
            EventBus.on("state:carregado", () => {
                _renderizar();
                _atualizarBadge();
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // TIMER TICK — atualiza countdown a cada segundo
    // ════════════════════════════════════════════════════
    function _iniciarTimer() {
        if (_timerTick) clearInterval(_timerTick);
        _timerTick = setInterval(() => {
            _atualizarTimers();

            // Verifica se o dia mudou
            const seedAtual = _seedDia(_meiaNoiteHoje());
            const seedDiarias = _seedDia(
                _diarias[0] ? (_ultimoLogin || Date.now()) : Date.now()
            );
        }, CFG.TIMER_TICK_MS);
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        _injetarCSS();

        const save = _carregar();
        _verificarStreak(save);
        _verificarResets(save);

        _registrarEventos();
        _iniciarTimer();
        _renderizar();
        _atualizarBadge();

        _inicializado = true;

        _log.info(`Quests inicializado. Streak: ${_streak}. Prontas: ${_contarProntas()}.`);
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            streak   : _streak,
            bonus    : `${Math.round((_bonusStreak() - 1) * 100)}%`,
            diarias  : {
                total   : _diarias.length,
                prontas : _diarias.filter(m => m.progresso >= m.def.meta && !m.coletada).length,
                coletadas: _diarias.filter(m => m.coletada).length,
            },
            semanais : {
                total   : _semanais.length,
                prontas : _semanais.filter(m => m.progresso >= m.def.meta && !m.coletada).length,
                coletadas: _semanais.filter(m => m.coletada).length,
            },
            sessao   : { ..._sessao },
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        coletar,
        renderizar: _renderizar,
        stats,
    });

})();
window.Quests = Quests;
