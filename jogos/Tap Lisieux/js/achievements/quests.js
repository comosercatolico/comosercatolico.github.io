// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/achievements/quests.js
//  Sistema de Missões Diárias e Semanais
//
//  Depende de: game-ui.js (Toast, DOM, EventBus, formatarNum)
//              game-batalha.js (estagio, moeda, gema)
// ═══════════════════════════════════════════════════════════

"use strict";

const QuestSystem = (() => {

    // ════════════════════════════════════════
    //  DEFINIÇÃO DAS MISSÕES
    // ════════════════════════════════════════

    const MISSOES_DIARIAS_DEF = [
        {
            id:         "d_kills_20",
            nome:       "Caça Diária",
            desc:       "Derrote 20 inimigos hoje",
            emoji:      "⚔️",
            tipo:       "kill",
            meta:       20,
            recompensa: { moeda: 500, gema: 0 }
        },
        {
            id:         "d_estagios_5",
            nome:       "Avançar",
            desc:       "Avance 5 estágios hoje",
            emoji:      "🗺️",
            tipo:       "estagio",
            meta:       5,
            recompensa: { moeda: 300, gema: 5 }
        },
        {
            id:         "d_upgrades_3",
            nome:       "Melhorias",
            desc:       "Compre 3 upgrades hoje",
            emoji:      "📈",
            tipo:       "upgrade",
            meta:       3,
            recompensa: { moeda: 400, gema: 0 }
        },
        {
            id:         "d_invocar_1",
            nome:       "Invocação do Dia",
            desc:       "Faça 1 invocação hoje",
            emoji:      "✨",
            tipo:       "invocar",
            meta:       1,
            recompensa: { moeda: 0, gema: 15 }
        },
        {
            id:         "d_click_50",
            nome:       "Toque Sagrado",
            desc:       "Clique 50 vezes em batalha",
            emoji:      "👆",
            tipo:       "click",
            meta:       50,
            recompensa: { moeda: 200, gema: 0 }
        }
    ];

    const MISSOES_SEMANAIS_DEF = [
        {
            id:         "w_kills_200",
            nome:       "Guerreira Semanal",
            desc:       "Derrote 200 inimigos esta semana",
            emoji:      "💀",
            tipo:       "kill",
            meta:       200,
            recompensa: { moeda: 3000, gema: 30 }
        },
        {
            id:         "w_estagios_30",
            nome:       "Grande Jornada",
            desc:       "Avance 30 estágios esta semana",
            emoji:      "🌟",
            tipo:       "estagio",
            meta:       30,
            recompensa: { moeda: 2000, gema: 50 }
        },
        {
            id:         "w_invocar_5",
            nome:       "Bênçãos da Semana",
            desc:       "Faça 5 invocações esta semana",
            emoji:      "🎴",
            tipo:       "invocar",
            meta:       5,
            recompensa: { moeda: 1000, gema: 80 }
        },
        {
            id:         "w_upgrades_15",
            nome:       "Fortalecida",
            desc:       "Compre 15 upgrades esta semana",
            emoji:      "⚡",
            tipo:       "upgrade",
            meta:       15,
            recompensa: { moeda: 2500, gema: 25 }
        }
    ];

    // ════════════════════════════════════════
    //  ESTADO INTERNO
    // ════════════════════════════════════════

    // Progresso atual das missões
    // Estrutura: { missaoId: { progresso, coletado } }
    let _estado = {};

    // Timestamps de reset
    let _ultimoResetDiario   = 0;
    let _ultimoResetSemanal  = 0;

    // ════════════════════════════════════════
    //  UTILITÁRIOS DE TEMPO
    // ════════════════════════════════════════

    function _inicioHojeMidnight() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    function _inicioSemanaAtual() {
        const d = new Date();
        // Segunda-feira como início da semana
        const dia = d.getDay(); // 0=dom, 1=seg...
        const diff = (dia === 0 ? -6 : 1 - dia);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }

    function _tempoAteResetDiario() {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        amanha.setHours(0, 0, 0, 0);
        const ms = amanha.getTime() - Date.now();
        const h  = Math.floor(ms / 3_600_000);
        const m  = Math.floor((ms % 3_600_000) / 60_000);
        return `${h}h ${m}min`;
    }

    // ════════════════════════════════════════
    //  RESET AUTOMÁTICO
    // ════════════════════════════════════════

    function _verificarResets() {
        const agora         = Date.now();
        const hojeInicio    = _inicioHojeMidnight();
        const semanaInicio  = _inicioSemanaAtual();

        // Reset diário
        if (_ultimoResetDiario < hojeInicio) {
            _resetarMissoes(MISSOES_DIARIAS_DEF, "diaria");
            _ultimoResetDiario = agora;
            console.log("[Quests] Missões diárias resetadas.");
        }

        // Reset semanal (segunda-feira)
        if (_ultimoResetSemanal < semanaInicio) {
            _resetarMissoes(MISSOES_SEMANAIS_DEF, "semanal");
            _ultimoResetSemanal = agora;
            console.log("[Quests] Missões semanais resetadas.");
        }
    }

    function _resetarMissoes(definicoes, tipo) {
        definicoes.forEach(m => {
            // Mantém coletado=true apenas se já coletou antes do reset
            _estado[m.id] = { progresso: 0, coletado: false };
        });

        if (tipo === "diaria") {
            ToastSystem.mostrar("📋 Novas missões diárias disponíveis!", "info", 4000);
        }

        _salvar();
        _atualizarUI();
    }

    // ════════════════════════════════════════
    //  REGISTRAR PROGRESSO
    // ════════════════════════════════════════

    /**
     * Registra progresso em missões de um tipo específico.
     * Chamado pelo EventBus ao detectar eventos do jogo.
     *
     * @param {string} tipo  - "kill" | "estagio" | "upgrade" | "invocar" | "click"
     * @param {number} qtd   - Quantidade de progresso a adicionar
     */
    function registrar(tipo, qtd = 1) {
        let atualizou = false;

        const todasMissoes = [...MISSOES_DIARIAS_DEF, ...MISSOES_SEMANAIS_DEF];

        todasMissoes.forEach(m => {
            if (m.tipo !== tipo) return;

            const est = _estado[m.id] ?? { progresso: 0, coletado: false };
            if (est.coletado) return;
            if (est.progresso >= m.meta) return;

            est.progresso = Math.min(est.progresso + qtd, m.meta);
            _estado[m.id] = est;
            atualizou = true;

            // Missão completada!
            if (est.progresso >= m.meta) {
                ToastSystem.mostrar(
                    `✅ Missão completa: ${m.emoji} ${m.nome}! Clique para coletar.`,
                    "sucesso",
                    5000
                );
                if (typeof EventBus !== "undefined") {
                    EventBus.emit("quest:completada", m);
                }
            }
        });

        if (atualizou) {
            _salvar();
            _atualizarUI();
        }
    }

    // ════════════════════════════════════════
    //  COLETAR RECOMPENSA
    // ════════════════════════════════════════

    function coletar(missaoId) {
        const est = _estado[missaoId];
        if (!est) return;
        if (est.coletado) {
            ToastSystem.mostrar("⚠️ Recompensa já coletada!", "aviso");
            return;
        }

        // Encontra a definição
        const def = [...MISSOES_DIARIAS_DEF, ...MISSOES_SEMANAIS_DEF]
            .find(m => m.id === missaoId);
        if (!def) return;

        // Verifica se completou
        if (est.progresso < def.meta) {
            ToastSystem.mostrar("❌ Missão não completada ainda!", "erro");
            return;
        }

        // Aplica recompensa
        if (typeof moeda !== "undefined" && def.recompensa.moeda > 0) {
            moeda += def.recompensa.moeda;
        }
        if (typeof gema !== "undefined" && def.recompensa.gema > 0) {
            gema += def.recompensa.gema;
        }

        est.coletado = true;
        _estado[missaoId] = est;

        // Feedback
        const partes = [];
        if (def.recompensa.moeda > 0) partes.push(`🪙 ${formatarNum(def.recompensa.moeda)}`);
        if (def.recompensa.gema  > 0) partes.push(`💎 ${def.recompensa.gema}`);

        ToastSystem.mostrar(
            `🎁 ${def.emoji} ${def.nome}: +${partes.join(" + ")}!`,
            "sucesso",
            4000
        );

        if (typeof EventBus !== "undefined") {
            EventBus.emit("quest:coletada", def);
            EventBus.emit("moeda:update", moeda);
            EventBus.emit("gema:update",  gema);
        }

        _salvar();
        _atualizarUI();
    }

    // ════════════════════════════════════════
    //  COLETAR TODAS AS COMPLETAS
    // ════════════════════════════════════════

    function coletarTodas() {
        const todasMissoes = [...MISSOES_DIARIAS_DEF, ...MISSOES_SEMANAIS_DEF];
        let totalMoeda = 0;
        let totalGema  = 0;
        let qtdColetadas = 0;

        todasMissoes.forEach(m => {
            const est = _estado[m.id];
            if (!est || est.coletado || est.progresso < m.meta) return;

            est.coletado = true;
            _estado[m.id] = est;
            totalMoeda += m.recompensa.moeda;
            totalGema  += m.recompensa.gema;
            qtdColetadas++;
        });

        if (qtdColetadas === 0) {
            ToastSystem.mostrar("Nenhuma missão completa para coletar.", "info");
            return;
        }

        if (typeof moeda !== "undefined") moeda += totalMoeda;
        if (typeof gema  !== "undefined") gema  += totalGema;

        ToastSystem.mostrar(
            `🎁 ${qtdColetadas} missões coletadas! +${formatarNum(totalMoeda)} 🪙 +${totalGema} 💎`,
            "sucesso",
            5000
        );

        if (typeof EventBus !== "undefined") {
            EventBus.emit("moeda:update", moeda);
            EventBus.emit("gema:update",  gema);
        }

        _salvar();
        _atualizarUI();
    }

    // ════════════════════════════════════════
    //  SAVE / LOAD
    // ════════════════════════════════════════

    const _SAVE_KEY = "taplisieux_quests_v1";

    function _salvar() {
        try {
            localStorage.setItem(_SAVE_KEY, JSON.stringify({
                estado:             _estado,
                ultimoResetDiario:  _ultimoResetDiario,
                ultimoResetSemanal: _ultimoResetSemanal
            }));
        } catch (e) {
            console.warn("[Quests] Falha ao salvar:", e);
        }
    }

    function _carregar() {
        try {
            const raw = localStorage.getItem(_SAVE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            _estado             = data.estado             ?? {};
            _ultimoResetDiario  = data.ultimoResetDiario  ?? 0;
            _ultimoResetSemanal = data.ultimoResetSemanal ?? 0;
        } catch {
            console.warn("[Quests] Save corrompido — resetando missões.");
            _estado = {};
        }
    }

    // ════════════════════════════════════════
    //  RENDER DA UI
    // ════════════════════════════════════════

    function _atualizarUI() {
        _renderSecao("listaQuestsDiarias",  MISSOES_DIARIAS_DEF,  "diaria");
        _renderSecao("listaQuestsSemanais", MISSOES_SEMANAIS_DEF, "semanal");

        // Contador de missões prontas para coletar
        const prontas = _contarProntas();
        const badge = document.getElementById("questBadge");
        if (badge) {
            badge.textContent = prontas > 0 ? String(prontas) : "";
            badge.style.display = prontas > 0 ? "flex" : "none";
        }

        // Tempo até reset diário
        const timerEl = document.getElementById("questResetTimer");
        if (timerEl) {
            timerEl.textContent = `⏱️ Reset em: ${_tempoAteResetDiario()}`;
        }
    }

    function _renderSecao(elementoId, definicoes, tipo) {
        const container = document.getElementById(elementoId);
        if (!container) return;

        container.innerHTML = definicoes.map(m => {
            const est       = _estado[m.id] ?? { progresso: 0, coletado: false };
            const prog      = Math.min(est.progresso, m.meta);
            const pct       = Math.round((prog / m.meta) * 100);
            const completa  = prog >= m.meta;
            const coletado  = est.coletado;

            // Cor da barra de progresso
            const corBarra = coletado
                ? "#444"
                : completa
                    ? "#44ff88"
                    : "#8b5cf6";

            // Texto do botão
            const btnTxt  = coletado ? "✅ Coletado" : completa ? "🎁 Coletar!" : "Em andamento";
            const btnDis  = coletado || !completa;
            const btnCor  = completa && !coletado ? "#f5a623" : "#444";

            // Recompensa formatada
            const recomp  = [];
            if (m.recompensa.moeda > 0) recomp.push(`🪙 ${formatarNum(m.recompensa.moeda)}`);
            if (m.recompensa.gema  > 0) recomp.push(`💎 ${m.recompensa.gema}`);

            return `
                <div class="questCard" style="
                    background: rgba(255,255,255,0.04);
                    border: 1px solid ${completa && !coletado ? "#f5a623" : "rgba(255,255,255,0.1)"};
                    border-radius: 10px;
                    padding: 10px 12px;
                    margin-bottom: 8px;
                    opacity: ${coletado ? 0.5 : 1};
                ">
                    <!-- Cabeçalho -->
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                        <span style="font-size:20px">${m.emoji}</span>
                        <div style="flex:1">
                            <div style="font-weight:700; font-size:13px; color:#fff">
                                ${m.nome}
                            </div>
                            <div style="font-size:11px; color:#aaa">
                                ${m.desc}
                            </div>
                        </div>
                        <div style="font-size:11px; color:#f5a623; white-space:nowrap">
                            ${recomp.join(" + ")}
                        </div>
                    </div>

                    <!-- Barra de progresso -->
                    <div style="
                        background: rgba(255,255,255,0.08);
                        border-radius: 999px;
                        height: 6px;
                        margin-bottom: 6px;
                        overflow: hidden;
                    ">
                        <div style="
                            width: ${pct}%;
                            height: 100%;
                            background: ${corBarra};
                            border-radius: 999px;
                            transition: width 0.4s ease;
                        "></div>
                    </div>

                    <!-- Rodapé: progresso + botão -->
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:11px; color:#aaa">
                            ${prog} / ${m.meta}
                            ${completa ? " ✓" : ""}
                        </span>
                        <button
                            onclick="QuestSystem.coletar('${m.id}')"
                            style="
                                background: ${btnCor};
                                border: none;
                                border-radius: 6px;
                                color: #fff;
                                padding: 4px 10px;
                                font-size: 11px;
                                cursor: ${btnDis ? 'default' : 'pointer'};
                                opacity: ${btnDis ? 0.5 : 1};
                                font-weight: 600;
                            "
                            ${btnDis ? "disabled" : ""}
                        >${btnTxt}</button>
                    </div>
                </div>`;
        }).join("");
    }

    // ════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════

    function _contarProntas() {
        return [...MISSOES_DIARIAS_DEF, ...MISSOES_SEMANAIS_DEF]
            .filter(m => {
                const est = _estado[m.id];
                return est && !est.coletado && est.progresso >= m.meta;
            }).length;
    }

    function obterResumo() {
        const todas   = [...MISSOES_DIARIAS_DEF, ...MISSOES_SEMANAIS_DEF];
        const total   = todas.length;
        const prontas = _contarProntas();
        const feitas  = todas.filter(m => _estado[m.id]?.coletado).length;
        return { total, prontas, feitas };
    }

    // ════════════════════════════════════════
    //  INICIALIZAÇÃO
    // ════════════════════════════════════════

    function init() {
        _carregar();
        _verificarResets();
        _atualizarUI();

        // Verifica resets a cada minuto
        setInterval(() => {
            _verificarResets();
            _atualizarUI();
        }, 60_000);

        // Registra eventos do jogo via EventBus
        if (typeof EventBus !== "undefined") {
            EventBus.on("kill:registrado",    ()  => registrar("kill",    1));
            EventBus.on("estagio:update",     ()  => registrar("estagio", 1));
            EventBus.on("upgrade:comprado",   ()  => registrar("upgrade", 1));
            EventBus.on("gacha:pull",         (d) => registrar("invocar", d?.resultados?.length ?? 1));
            EventBus.on("click:batalha",      ()  => registrar("click",   1));
        }

        console.log("[Quests] Sistema inicializado.");
    }

    // ════════════════════════════════════════
    //  API PÚBLICA
    // ════════════════════════════════════════
    return {
        init,
        registrar,
        coletar,
        coletarTodas,
        obterResumo,
        atualizarUI: _atualizarUI
    };

})();

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => QuestSystem.init());
