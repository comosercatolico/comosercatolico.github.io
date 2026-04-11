// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/achievements/achievements.js
//  Sistema de Conquistas — Tap Lisieux
//
//  Depende de: game-ui.js (ToastSystem, EventBus, DOM,
//              formatarNum, conquistasDesbloqueadas)
//              game-batalha.js (moeda, gema, estagio,
//              personagem, heroisObtidos, equipamentosObtidos)
//
//  ATENÇÃO: Remova do game-ui.js as seguintes seções:
//  - const CONQUISTAS_DEF = [...]
//  - const conquistasDesbloqueadas = new Set()
//  - function verificarConquistas()
//  - function atualizarTelaConquistas()
//  - Os EventBus.on de conquistas no final do game-ui.js
// ═══════════════════════════════════════════════════════════

"use strict";

const AchievementSystem = (() => {

    // ════════════════════════════════════════
    //  DEFINIÇÃO DAS CONQUISTAS
    //  Cada conquista é imutável após criação
    // ════════════════════════════════════════

    const CONQUISTAS_DEF = Object.freeze([

        // ── COMBATE ─────────────────────────────
        {
            id:         "primeiro_kill",
            categoria:  "combate",
            nome:       "Primeira Batalha",
            desc:       "Derrote seu primeiro inimigo",
            emoji:      "⚔️",
            recompensa: { gema: 10, moeda: 0 },
            check:      () => _contadores.kills >= 1
        },
        {
            id:         "kill_10",
            categoria:  "combate",
            nome:       "Guerreira",
            desc:       "Derrote 10 inimigos",
            emoji:      "💀",
            recompensa: { gema: 20, moeda: 0 },
            check:      () => _contadores.kills >= 10
        },
        {
            id:         "kill_100",
            categoria:  "combate",
            nome:       "Caçadora Santa",
            desc:       "Derrote 100 inimigos",
            emoji:      "🗡️",
            recompensa: { gema: 50, moeda: 0 },
            check:      () => _contadores.kills >= 100
        },
        {
            id:         "kill_500",
            categoria:  "combate",
            nome:       "Exterminadora",
            desc:       "Derrote 500 inimigos",
            emoji:      "💥",
            recompensa: { gema: 100, moeda: 0 },
            check:      () => _contadores.kills >= 500
        },
        {
            id:         "kill_1000",
            categoria:  "combate",
            nome:       "Anjo da Destruição",
            desc:       "Derrote 1.000 inimigos",
            emoji:      "👼",
            recompensa: { gema: 250, moeda: 0 },
            check:      () => _contadores.kills >= 1000
        },
        {
            id:         "primeiro_chefe",
            categoria:  "combate",
            nome:       "Caçadora de Chefes",
            desc:       "Derrote seu primeiro chefe (Estágio 10)",
            emoji:      "👑",
            recompensa: { gema: 30, moeda: 0 },
            check:      () => _contadores.chefes >= 1
        },
        {
            id:         "chefes_10",
            categoria:  "combate",
            nome:       "Matadora de Gigantes",
            desc:       "Derrote 10 chefes",
            emoji:      "🏆",
            recompensa: { gema: 80, moeda: 0 },
            check:      () => _contadores.chefes >= 10
        },

        // ── ESTÁGIOS ────────────────────────────
        {
            id:         "estagio_10",
            categoria:  "estagio",
            nome:       "Exploradora",
            desc:       "Alcance o estágio 10",
            emoji:      "🗺️",
            recompensa: { gema: 30, moeda: 0 },
            check:      () => (typeof estagio !== "undefined") && estagio >= 10
        },
        {
            id:         "estagio_25",
            categoria:  "estagio",
            nome:       "Destemida",
            desc:       "Alcance o estágio 25",
            emoji:      "🌄",
            recompensa: { gema: 60, moeda: 0 },
            check:      () => (typeof estagio !== "undefined") && estagio >= 25
        },
        {
            id:         "estagio_50",
            categoria:  "estagio",
            nome:       "Peregrina",
            desc:       "Alcance o estágio 50",
            emoji:      "🌟",
            recompensa: { gema: 100, moeda: 0 },
            check:      () => (typeof estagio !== "undefined") && estagio >= 50
        },
        {
            id:         "estagio_100",
            categoria:  "estagio",
            nome:       "Lenda Viva",
            desc:       "Alcance o estágio 100",
            emoji:      "🌠",
            recompensa: { gema: 200, moeda: 0 },
            check:      () => (typeof estagio !== "undefined") && estagio >= 100
        },
        {
            id:         "estagio_200",
            categoria:  "estagio",
            nome:       "Transcendente",
            desc:       "Alcance o estágio 200",
            emoji:      "✨",
            recompensa: { gema: 500, moeda: 0 },
            check:      () => (typeof estagio !== "undefined") && estagio >= 200
        },

        // ── UPGRADES ────────────────────────────
        {
            id:         "upgrade_1",
            categoria:  "upgrade",
            nome:       "Primeiros Passos",
            desc:       "Faça seu primeiro upgrade",
            emoji:      "📈",
            recompensa: { gema: 5, moeda: 0 },
            check:      () => _contadores.upgrades >= 1
        },
        {
            id:         "upgrade_10",
            categoria:  "upgrade",
            nome:       "Aprimorada",
            desc:       "Faça 10 upgrades",
            emoji:      "⚡",
            recompensa: { gema: 0, moeda: 500 },
            check:      () => _contadores.upgrades >= 10
        },
        {
            id:         "upgrade_50",
            categoria:  "upgrade",
            nome:       "Mestre dos Upgrades",
            desc:       "Faça 50 upgrades",
            emoji:      "🔧",
            recompensa: { gema: 50, moeda: 0 },
            check:      () => _contadores.upgrades >= 50
        },
        {
            id:         "upgrade_100",
            categoria:  "upgrade",
            nome:       "Maximizada",
            desc:       "Faça 100 upgrades",
            emoji:      "💎",
            recompensa: { gema: 150, moeda: 0 },
            check:      () => _contadores.upgrades >= 100
        },

        // ── GACHA / ITENS ────────────────────────
        {
            id:         "primeiro_lend",
            categoria:  "gacha",
            nome:       "Abençoada",
            desc:       "Obtenha um item Lendário",
            emoji:      "🌟",
            recompensa: { gema: 100, moeda: 0 },
            check:      () => _temItemRaridade("Lendário")
        },
        {
            id:         "primeiro_epico",
            categoria:  "gacha",
            nome:       "Escolhida",
            desc:       "Obtenha um item Épico",
            emoji:      "💜",
            recompensa: { gema: 30, moeda: 0 },
            check:      () => _temItemRaridade("Épico")
        },
        {
            id:         "invocar_10",
            categoria:  "gacha",
            nome:       "Invocadora",
            desc:       "Faça 10 invocações",
            emoji:      "🎴",
            recompensa: { gema: 20, moeda: 0 },
            check:      () => _contadores.invocacoes >= 10
        },
        {
            id:         "invocar_50",
            categoria:  "gacha",
            nome:       "Devota",
            desc:       "Faça 50 invocações",
            emoji:      "🌸",
            recompensa: { gema: 75, moeda: 0 },
            check:      () => _contadores.invocacoes >= 50
        },
        {
            id:         "colecionar_5",
            categoria:  "gacha",
            nome:       "Colecionadora",
            desc:       "Obtenha 5 itens diferentes",
            emoji:      "📦",
            recompensa: { gema: 40, moeda: 0 },
            check:      () => _totalItensUnicos() >= 5
        },

        // ── PRESTÍGIO ────────────────────────────
        {
            id:         "primeiro_prestigio",
            categoria:  "prestigio",
            nome:       "Renascida",
            desc:       "Faça seu primeiro Prestígio",
            emoji:      "🌸",
            recompensa: { gema: 200, moeda: 0 },
            check:      () => _contadores.prestigios >= 1
        },
        {
            id:         "prestigio_3",
            categoria:  "prestigio",
            nome:       "Ciclo Eterno",
            desc:       "Faça 3 prestígios",
            emoji:      "♾️",
            recompensa: { gema: 400, moeda: 0 },
            check:      () => _contadores.prestigios >= 3
        },
        {
            id:         "prestigio_10",
            categoria:  "prestigio",
            nome:       "Divina",
            desc:       "Faça 10 prestígios",
            emoji:      "👼",
            recompensa: { gema: 1000, moeda: 0 },
            check:      () => _contadores.prestigios >= 10
        },

        // ── ECONOMIA ────────────────────────────
        {
            id:         "moeda_1000",
            categoria:  "economia",
            nome:       "Primeiras Riquezas",
            desc:       "Acumule 1.000 moedas de uma vez",
            emoji:      "🪙",
            recompensa: { gema: 10, moeda: 0 },
            check:      () => (typeof moeda !== "undefined") && moeda >= 1000
        },
        {
            id:         "moeda_1M",
            categoria:  "economia",
            nome:       "Tesoureira",
            desc:       "Acumule 1 milhão de moedas de uma vez",
            emoji:      "💰",
            recompensa: { gema: 50, moeda: 0 },
            check:      () => (typeof moeda !== "undefined") && moeda >= 1_000_000
        },

        // ── NÍVEL ───────────────────────────────
        {
            id:         "nivel_5",
            categoria:  "nivel",
            nome:       "Em Crescimento",
            desc:       "Santa Teresinha alcança o nível 5",
            emoji:      "🌱",
            recompensa: { gema: 15, moeda: 0 },
            check:      () => (typeof personagem !== "undefined") && personagem.nivel >= 5
        },
        {
            id:         "nivel_10",
            categoria:  "nivel",
            nome:       "Jovem Santa",
            desc:       "Santa Teresinha alcança o nível 10",
            emoji:      "🌷",
            recompensa: { gema: 30, moeda: 0 },
            check:      () => (typeof personagem !== "undefined") && personagem.nivel >= 10
        },
        {
            id:         "nivel_25",
            categoria:  "nivel",
            nome:       "Santa Poderosa",
            desc:       "Santa Teresinha alcança o nível 25",
            emoji:      "🌹",
            recompensa: { gema: 75, moeda: 0 },
            check:      () => (typeof personagem !== "undefined") && personagem.nivel >= 25
        },
        {
            id:         "nivel_50",
            categoria:  "nivel",
            nome:       "Santa Transcendida",
            desc:       "Santa Teresinha alcança o nível 50",
            emoji:      "👸",
            recompensa: { gema: 200, moeda: 0 },
            check:      () => (typeof personagem !== "undefined") && personagem.nivel >= 50
        },

    ]);

    // ════════════════════════════════════════
    //  ESTADO INTERNO
    // ════════════════════════════════════════

    // IDs das conquistas desbloqueadas — compartilhado com game-ui.js
    // via window para compatibilidade com o SaveSystem existente
    const _desbloqueadas = new Set();

    // Contadores internos (persistidos separadamente)
    let _contadores = {
        kills:       0,
        chefes:      0,
        upgrades:    0,
        invocacoes:  0,
        prestigios:  0
    };

    // Controle anti-spam de notificação (máx 1 por 800ms)
    let _filaNotificacao = [];
    let _processandoFila = false;

    // ════════════════════════════════════════
    //  HELPERS INTERNOS
    // ════════════════════════════════════════

    function _temItemRaridade(raridade) {
        if (typeof heroisObtidos === "undefined" ||
            typeof equipamentosObtidos === "undefined") return false;
        return [...heroisObtidos, ...equipamentosObtidos]
            .some(i => i.raridade === raridade);
    }

    function _totalItensUnicos() {
        if (typeof heroisObtidos === "undefined" ||
            typeof equipamentosObtidos === "undefined") return 0;
        const nomes = new Set([
            ...heroisObtidos.map(i => i.nome),
            ...equipamentosObtidos.map(i => i.nome)
        ]);
        return nomes.size;
    }

    // ════════════════════════════════════════
    //  VERIFICAÇÃO DE CONQUISTAS
    //  Chamada após cada evento relevante.
    //  Só itera conquistas ainda não desbloqueadas.
    // ════════════════════════════════════════

    function verificar() {
        CONQUISTAS_DEF.forEach(c => {
            if (_desbloqueadas.has(c.id)) return;

            let passou = false;
            try { passou = c.check(); } catch { return; }
            if (!passou) return;

            _desbloquear(c);
        });
    }

    function _desbloquear(conquista) {
        _desbloqueadas.add(conquista.id);

        // Expõe para o SaveSystem existente em game-ui.js
        if (typeof conquistasDesbloqueadas !== "undefined") {
            conquistasDesbloqueadas.add(conquista.id);
        }

        // Aplica recompensa
        if (conquista.recompensa.gema > 0 && typeof gema !== "undefined") {
            gema += conquista.recompensa.gema;
        }
        if (conquista.recompensa.moeda > 0 && typeof moeda !== "undefined") {
            moeda += conquista.recompensa.moeda;
        }

        // Enfileira notificação (evita toasts sobrepostos)
        _filaNotificacao.push(conquista);
        _processarFilaNotificacao();

        // Emite evento para outros módulos (QuestSystem, etc.)
        if (typeof EventBus !== "undefined") {
            EventBus.emit("conquista:desbloqueada", conquista);
            EventBus.emit("moeda:update", typeof moeda !== "undefined" ? moeda : 0);
            EventBus.emit("gema:update",  typeof gema  !== "undefined" ? gema  : 0);
        }

        // Texto flutuante no canvas (se estiver em batalha)
        if (typeof criarTexto === "function" && typeof emBatalha !== "undefined" && emBatalha) {
            criarTexto(`🏆 ${conquista.nome}!`, "levelup");
        }

        // Persiste
        _salvar();

        // Atualiza UI de conquistas se estiver visível
        _atualizarTelaConquistas();

        console.log(`[Achievements] ✅ Desbloqueada: ${conquista.emoji} ${conquista.nome}`);
    }

    // ════════════════════════════════════════
    //  FILA DE NOTIFICAÇÕES
    //  Toasts com 900ms de intervalo entre si
    // ════════════════════════════════════════

    function _processarFilaNotificacao() {
        if (_processandoFila || _filaNotificacao.length === 0) return;
        _processandoFila = true;

        const c = _filaNotificacao.shift();

        if (typeof ToastSystem !== "undefined") {
            const recomp = [];
            if (c.recompensa.gema  > 0) recomp.push(`💎 ${c.recompensa.gema}`);
            if (c.recompensa.moeda > 0) recomp.push(`🪙 ${formatarNum(c.recompensa.moeda)}`);
            const recompTxt = recomp.length > 0 ? ` (+${recomp.join(" + ")})` : "";

            ToastSystem.mostrar(
                `🏆 ${c.emoji} ${c.nome}${recompTxt}`,
                "sucesso",
                4500
            );
        }

        setTimeout(() => {
            _processandoFila = false;
            _processarFilaNotificacao();
        }, 900);
    }

    // ════════════════════════════════════════
    //  REGISTRAR EVENTOS (contadores)
    //  Atualiza contadores internos via EventBus
    // ════════════════════════════════════════

    function _registrarEventos() {
        if (typeof EventBus === "undefined") return;

        // Kill registrado
        EventBus.on("kill:registrado", (dados) => {
            _contadores.kills++;

            // Detecta chefe (estágio múltiplo de 10)
            if (typeof estagio !== "undefined" && estagio % 10 === 0) {
                _contadores.chefes++;
            }

            // Mantém compatibilidade com game-ui.js
            window._totalKills = _contadores.kills;

            verificar();
        });

        // Upgrade comprado
        EventBus.on("upgrade:comprado", () => {
            _contadores.upgrades++;
            window._totalUpgrades = _contadores.upgrades;
            verificar();
        });

        // Gacha pull
        EventBus.on("gacha:pull", (dados) => {
            const qtd = dados?.resultados?.length ?? 1;
            _contadores.invocacoes += qtd;
            verificar();
        });

        // Prestígio
        EventBus.on("prestigio:feito", () => {
            _contadores.prestigios++;
            window._totalPrestígios = _contadores.prestigios;
            verificar();
        });

        // Estágio atualizado
        EventBus.on("estagio:update", () => verificar());

        // Moeda / gema atualizados
        EventBus.on("moeda:update", () => verificar());
        EventBus.on("gema:update",  () => verificar());

        // Item equipado (pode desbloquear conquistas de coleção)
        EventBus.on("item:equipado", () => verificar());
    }

    // ════════════════════════════════════════
    //  RENDER DA TELA DE CONQUISTAS
    //  Substitui atualizarTelaConquistas() do game-ui.js
    // ════════════════════════════════════════

    // Mapa de cores por categoria
    const _COR_CATEGORIA = Object.freeze({
        combate:  "#ff6b6b",
        estagio:  "#4a8fff",
        upgrade:  "#f5a623",
        gacha:    "#b44dff",
        prestigio:"#ff9de2",
        economia: "#44ff88",
        nivel:    "#ffd700"
    });

    const _LABEL_CATEGORIA = Object.freeze({
        combate:  "⚔️ Combate",
        estagio:  "🗺️ Estágios",
        upgrade:  "📈 Upgrades",
        gacha:    "✨ Invocação",
        prestigio:"🌸 Prestígio",
        economia: "🪙 Economia",
        nivel:    "⭐ Nível"
    });

    function _atualizarTelaConquistas() {
        const el = typeof DOM !== "undefined"
            ? DOM.get("listaConquistas")
            : document.getElementById("listaConquistas");
        if (!el) return;

        // Agrupa por categoria
        const grupos = {};
        CONQUISTAS_DEF.forEach(c => {
            if (!grupos[c.categoria]) grupos[c.categoria] = [];
            grupos[c.categoria].push(c);
        });

        const totalDesbloqueadas = _desbloqueadas.size;
        const total = CONQUISTAS_DEF.length;

        // Cabeçalho com progresso geral
        let html = `
            <div style="
                text-align: center;
                padding: 8px 0 14px;
                color: #aaa;
                font-size: 13px;
            ">
                🏆 ${totalDesbloqueadas} / ${total} conquistas desbloqueadas
                <div style="
                    background: rgba(255,255,255,0.08);
                    border-radius: 999px;
                    height: 6px;
                    margin: 8px 0 0;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${Math.round((totalDesbloqueadas / total) * 100)}%;
                        height: 100%;
                        background: #ffd700;
                        border-radius: 999px;
                        transition: width 0.5s ease;
                    "></div>
                </div>
            </div>`;

        // Renderiza cada categoria
        Object.entries(grupos).forEach(([categoria, lista]) => {
            const corCat   = _COR_CATEGORIA[categoria]  ?? "#aaa";
            const labelCat = _LABEL_CATEGORIA[categoria] ?? categoria;
            const qtdCat   = lista.filter(c => _desbloqueadas.has(c.id)).length;

            html += `
                <div style="
                    margin-bottom: 6px;
                    border-left: 3px solid ${corCat};
                    padding-left: 10px;
                    color: ${corCat};
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                ">
                    ${labelCat}
                    <span style="color:#aaa;font-weight:400">
                        (${qtdCat}/${lista.length})
                    </span>
                </div>`;

            lista.forEach(c => {
                const desbloqueada = _desbloqueadas.has(c.id);
                const recomp = [];
                if (c.recompensa.gema  > 0) recomp.push(`💎 ${c.recompensa.gema}`);
                if (c.recompensa.moeda > 0) recomp.push(`🪙 ${formatarNum(c.recompensa.moeda)}`);
                const recompTxt = recomp.join(" + ");

                html += `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid ${desbloqueada ? corCat + "55" : "rgba(255,255,255,0.07)"};
                        border-radius: 10px;
                        padding: 9px 12px;
                        margin-bottom: 6px;
                        opacity: ${desbloqueada ? 1 : 0.45};
                        transition: opacity 0.3s ease;
                    ">
                        <div style="
                            font-size: 22px;
                            min-width: 32px;
                            text-align: center;
                            filter: ${desbloqueada ? "none" : "grayscale(1)"};
                        ">
                            ${desbloqueada ? c.emoji : "🔒"}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="
                                font-weight: 700;
                                font-size: 13px;
                                color: ${desbloqueada ? "#fff" : "#888"};
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">
                                ${c.nome}
                            </div>
                            <div style="font-size: 11px; color: #777; margin-top: 2px;">
                                ${c.desc}
                            </div>
                            ${recompTxt ? `
                            <div style="font-size: 11px; color: #f5a623; margin-top: 3px;">
                                Recompensa: ${recompTxt}
                            </div>` : ""}
                        </div>
                        ${desbloqueada
                            ? `<span style="color:#44ff88; font-size:18px; flex-shrink:0;">✅</span>`
                            : `<span style="color:#555; font-size:12px; flex-shrink:0;">🔒</span>`
                        }
                    </div>`;
            });

            // Espaçamento entre categorias
            html += `<div style="height: 8px;"></div>`;
        });

        el.innerHTML = html;
    }

    // ════════════════════════════════════════
    //  SAVE / LOAD
    //  Chave separada do save principal para
    //  não conflitar com o SaveSystem existente
    // ════════════════════════════════════════

    const _SAVE_KEY = "taplisieux_achievements_v1";

    function _salvar() {
        try {
            localStorage.setItem(_SAVE_KEY, JSON.stringify({
                desbloqueadas: [..._desbloqueadas],
                contadores:    { ..._contadores }
            }));
        } catch (e) {
            console.warn("[Achievements] Falha ao salvar:", e);
        }
    }

    function _carregar() {
        try {
            const raw = localStorage.getItem(_SAVE_KEY);
            if (!raw) return;

            const data = JSON.parse(raw);

            // Restaura conquistas desbloqueadas
            if (Array.isArray(data.desbloqueadas)) {
                data.desbloqueadas.forEach(id => {
                    _desbloqueadas.add(id);
                    // Sincroniza com o Set do game-ui.js
                    if (typeof conquistasDesbloqueadas !== "undefined") {
                        conquistasDesbloqueadas.add(id);
                    }
                });
            }

            // Restaura contadores
            if (data.contadores) {
                Object.assign(_contadores, data.contadores);
                // Sincroniza globals do game-ui.js
                window._totalKills      = _contadores.kills;
                window._totalUpgrades   = _contadores.upgrades;
                window._totalPrestígios = _contadores.prestigios;
            }

        } catch {
            console.warn("[Achievements] Save corrompido — resetando contadores.");
            _contadores = { kills:0, chefes:0, upgrades:0, invocacoes:0, prestigios:0 };
        }
    }

    // ════════════════════════════════════════
    //  INTEGRAÇÃO COM SAVESYSTEM EXISTENTE
    //  O SaveSystem em game-ui.js salva
    //  conquistasDesbloqueadas (Set) no save principal.
    //  Aqui garantimos que ao carregar o save principal,
    //  nosso Set interno também seja preenchido.
    // ════════════════════════════════════════

    function _sincronizarComSavePrincipal() {
        if (typeof conquistasDesbloqueadas === "undefined") return;
        conquistasDesbloqueadas.forEach(id => _desbloqueadas.add(id));
    }

    // ════════════════════════════════════════
    //  API PÚBLICA
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas das conquistas.
     */
    function obterResumo() {
        return {
            total:         CONQUISTAS_DEF.length,
            desbloqueadas: _desbloqueadas.size,
            contadores:    { ..._contadores }
        };
    }

    /**
     * Verifica manualmente (útil para chamar após load).
     */
    function verificarTodas() {
        verificar();
    }

    /**
     * Abre/atualiza a tela de conquistas (chamado pelo botão na UI).
     */
    function abrirTela() {
        _atualizarTelaConquistas();
        const el = typeof DOM !== "undefined"
            ? DOM.get("modalConquistas")
            : document.getElementById("modalConquistas");
        if (el) el.style.display = "flex";
    }

    /**
     * Inicializa o sistema. Chamado pelo DOMContentLoaded.
     */
    function init() {
        _carregar();
        _sincronizarComSavePrincipal();
        _registrarEventos();
        _atualizarTelaConquistas();

        // Verificação inicial (pega conquistas que já foram cumpridas antes)
        setTimeout(() => verificar(), 500);

        console.log(
            `[Achievements] Sistema inicializado. ` +
            `${_desbloqueadas.size}/${CONQUISTAS_DEF.length} desbloqueadas.`
        );
    }

    // ════════════════════════════════════════
    //  EXPOSIÇÃO PÚBLICA
    // ════════════════════════════════════════
    return {
        init,
        verificar:      verificarTodas,
        abrirTela,
        obterResumo,
        atualizarUI:    _atualizarTelaConquistas,

        // Acesso somente-leitura para outros módulos
        get desbloqueadas() { return new Set(_desbloqueadas); },
        get contadores()    { return { ..._contadores };       },
        get lista()         { return CONQUISTAS_DEF;           }
    };

})();

// ════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    // Aguarda o SaveSystem do game-ui.js inicializar primeiro
    setTimeout(() => AchievementSystem.init(), 100);
});
