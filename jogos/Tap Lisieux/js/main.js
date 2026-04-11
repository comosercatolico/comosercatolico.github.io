// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/main.js
//  Entry point do jogo — inicializa tudo na ordem correta.
//
//  Fluxo:
//  1. Verifica suporte do navegador
//  2. Inicializa módulos base (logger, eventos, DOM)
//  3. Carrega assets com barra de progresso
//  4. Carrega save do jogador
//  5. Inicializa sistemas de lógica
//  6. Inicializa sistemas de UI
//  7. Inicia loop de renderização
//
//  Depende de: TODOS os módulos (carregados antes no HTML)
// ═══════════════════════════════════════════════════════════

"use strict";

// ════════════════════════════════════════
//  VERIFICAÇÃO DE SUPORTE
//  Detecta navegadores muito antigos antes
//  de qualquer inicialização
// ════════════════════════════════════════

(function verificarSuporteNavegador() {
    const requisitos = [
        { api: typeof Map          !== "undefined", nome: "Map"           },
        { api: typeof Set          !== "undefined", nome: "Set"           },
        { api: typeof Promise      !== "undefined", nome: "Promise"       },
        { api: typeof localStorage !== "undefined", nome: "localStorage"  },
        { api: typeof requestAnimationFrame !== "undefined", nome: "requestAnimationFrame" },
        { api: !!document.createElement("canvas").getContext, nome: "Canvas 2D" }
    ];

    const falhou = requisitos.filter(r => !r.api);

    if (falhou.length > 0) {
        document.body.innerHTML = `
            <div style="
                font-family: sans-serif;
                text-align: center;
                padding: 60px 20px;
                color: #fff;
                background: #0a0118;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🌹</div>
                <h2 style="color:#f5a623; margin-bottom:12px;">Navegador incompatível</h2>
                <p style="color:#aaa; max-width:400px; line-height:1.6;">
                    Seu navegador não suporta: 
                    <strong style="color:#ff6b6b">
                        ${falhou.map(r => r.nome).join(", ")}
                    </strong>.<br><br>
                    Por favor, use Chrome, Firefox, Edge ou Safari atualizados.
                </p>
            </div>`;
        throw new Error(`[Main] Navegador incompatível: ${falhou.map(r => r.nome).join(", ")}`);
    }
})();

// ════════════════════════════════════════
//  CONTROLE DA TELA DE LOADING
// ════════════════════════════════════════

const Loading = (() => {
    const _el    = document.getElementById("telaLoading");
    const _barra = document.getElementById("loadingBarra");
    const _texto = document.getElementById("loadingTexto");

    let _progresso = 0;

    function setProgresso(pct, mensagem) {
        _progresso = Math.min(100, Math.max(0, pct));
        if (_barra) _barra.style.width = _progresso + "%";
        if (_texto && mensagem) _texto.textContent = mensagem;
    }

    function esconder() {
        if (!_el) return;
        _el.style.transition = "opacity 0.6s ease";
        _el.style.opacity    = "0";
        setTimeout(() => {
            _el.style.display = "none";
        }, 650);
    }

    return { setProgresso, esconder };
})();

// ════════════════════════════════════════
//  ENTRY POINT PRINCIPAL
// ════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await inicializarJogo();
    } catch (erro) {
        _tratarErroFatal(erro);
    }
});

async function inicializarJogo() {

    console.log("🌹 Tap Lisieux — iniciando...");
    const tempoInicio = performance.now();

    // ── ETAPA 1: Logger (primeiro de tudo) ──────────────────
    Loading.setProgresso(5, "Inicializando...");

    if (typeof Logger !== "undefined") {
        Logger.init?.();
        Logger.info?.("Main", "Logger inicializado.");
    }

    // ── ETAPA 2: EventBus ───────────────────────────────────
    Loading.setProgresso(10, "Carregando sistema de eventos...");

    _checar("EventBus", typeof EventBus !== "undefined");

    // ── ETAPA 3: Cache do DOM ───────────────────────────────
    Loading.setProgresso(15, "Preparando interface...");

    _checar("DOM", typeof DOM !== "undefined");

    // ── ETAPA 4: Utils ──────────────────────────────────────
    Loading.setProgresso(18, "Carregando utilitários...");

    _checar("Utils", typeof Utils !== "undefined");

    // Expõe formatarNum globalmente para compatibilidade
    // com chamadas diretas ainda não refatoradas
    if (typeof formatarNum === "undefined") {
        window.formatarNum = Utils.formatarNum;
    }

    // ── ETAPA 5: Constantes ─────────────────────────────────
    Loading.setProgresso(20, "Carregando configurações...");

    _checar("BALANCE", typeof BALANCE !== "undefined");

    // ── ETAPA 6: Assets ─────────────────────────────────────
    Loading.setProgresso(22, "Carregando imagens...");

    await _carregarAssets();

    // ── ETAPA 7: Canvas e contexto 2D ───────────────────────
    Loading.setProgresso(50, "Preparando canvas...");

    _inicializarCanvas();

    // ── ETAPA 8: Estado global ──────────────────────────────
    Loading.setProgresso(55, "Inicializando estado do jogo...");

    _inicializarEstado();

    // ── ETAPA 9: Economia ───────────────────────────────────
    Loading.setProgresso(58, "Inicializando economia...");

    if (typeof Economy !== "undefined") Economy.init?.();

    // ── ETAPA 10: Upgrades ──────────────────────────────────
    Loading.setProgresso(61, "Inicializando upgrades...");

    if (typeof Upgrades !== "undefined") Upgrades.init?.();

    // ── ETAPA 11: Inimigos ──────────────────────────────────
    Loading.setProgresso(64, "Configurando inimigos...");

    if (typeof Enemy !== "undefined") Enemy.init?.();

    // ── ETAPA 12: Sistema de batalha ────────────────────────
    Loading.setProgresso(67, "Inicializando batalha...");

    if (typeof Battle !== "undefined") Battle.init?.();

    // ── ETAPA 13: Sistema de experiência ────────────────────
    Loading.setProgresso(69, "Inicializando experiência...");

    if (typeof Experience !== "undefined") Experience.init?.();

    // ── ETAPA 14: Sistema de combo ──────────────────────────
    Loading.setProgresso(71, "Inicializando combo...");

    if (typeof ComboSystem !== "undefined") ComboSystem.init?.();

    // ── ETAPA 15: Pool de items do Gacha ────────────────────
    Loading.setProgresso(73, "Carregando pool de invocação...");

    if (typeof GachaPool !== "undefined") GachaPool.init?.();

    // ── ETAPA 16: Inventário ────────────────────────────────
    Loading.setProgresso(75, "Inicializando inventário...");

    if (typeof Inventory !== "undefined") Inventory.init?.();

    // ── ETAPA 17: Sistema Gacha ─────────────────────────────
    Loading.setProgresso(77, "Inicializando invocação...");

    if (typeof GachaSystem !== "undefined") GachaSystem.init?.();

    // ── ETAPA 18: Prestígio ─────────────────────────────────
    Loading.setProgresso(79, "Inicializando prestígio...");

    if (typeof Prestige !== "undefined") Prestige.init?.();

    // ── ETAPA 19: Save — carrega progresso salvo ────────────
    Loading.setProgresso(82, "Carregando progresso salvo...");

    await _carregarSave();

    // ── ETAPA 20: Conquistas ────────────────────────────────
    Loading.setProgresso(85, "Carregando conquistas...");

    if (typeof AchievementSystem !== "undefined") {
        AchievementSystem.init?.();
    }

    // ── ETAPA 21: Missões ───────────────────────────────────
    Loading.setProgresso(87, "Carregando missões...");

    if (typeof QuestSystem !== "undefined") {
        QuestSystem.init?.();
    }

    // ── ETAPA 22: UI ────────────────────────────────────────
    Loading.setProgresso(90, "Inicializando interface...");

    _inicializarUI();

    // ── ETAPA 23: Input ─────────────────────────────────────
    Loading.setProgresso(93, "Registrando controles...");

    if (typeof Input !== "undefined") {
        Input.init?.();
    } else {
        // Fallback: registra inputs diretamente
        // (compatibilidade enquanto input.js não está implementado)
        _registrarInputsFallback();
    }

    // ── ETAPA 24: Áudio ─────────────────────────────────────
    Loading.setProgresso(95, "Inicializando áudio...");

    if (typeof Audio !== "undefined") Audio.init?.();

    // ── ETAPA 25: Renderer — inicia o loop ──────────────────
    Loading.setProgresso(98, "Iniciando renderização...");

    _iniciarLoop();

    // ── ETAPA 26: Auto-save ─────────────────────────────────
    _iniciarAutoSave();

    // ── ETAPA 27: Eventos globais de sistema ────────────────
    _registrarEventosSistema();

    // ── CONCLUÍDO ───────────────────────────────────────────
    Loading.setProgresso(100, "Pronto!");

    const tempoTotal = ((performance.now() - tempoInicio) / 1000).toFixed(2);
    console.log(`✅ Tap Lisieux iniciado em ${tempoTotal}s`);

    // Esconde a tela de loading após pequeno delay
    setTimeout(() => Loading.esconder(), 400);

    // Notifica que o jogo está pronto
    EventBus.emit("jogo:pronto", { tempoInicializacao: tempoTotal });
}

// ════════════════════════════════════════
//  CARREGAR ASSETS
// ════════════════════════════════════════

async function _carregarAssets() {
    // Se AssetLoader estiver implementado, usa ele
    if (typeof AssetLoader !== "undefined" && AssetLoader.carregar) {
        return new Promise((resolve) => {
            AssetLoader.onProgresso = (pct) => {
                // Mapeia progresso de assets para 22%-50% da barra
                Loading.setProgresso(22 + pct * 0.28, `Carregando assets... ${pct}%`);
            };
            AssetLoader.onCompleto = () => resolve();
            AssetLoader.carregar();
        });
    }

    // Fallback: carrega assets diretamente
    // (compatibilidade com game-batalha.js e game-lobby.js)
    return new Promise((resolve) => {
        if (typeof carregarAssets === "function") {
            carregarAssets();
        }
        // Aguarda 800ms para assets começarem a carregar
        setTimeout(resolve, 800);
    });
}

// ════════════════════════════════════════
//  INICIALIZAR CANVAS
// ════════════════════════════════════════

function _inicializarCanvas() {
    // O canvas pode já ter sido inicializado pelo game-lobby.js
    // Se não, inicializa aqui
    const canvas = document.getElementById("game");
    if (!canvas) {
        throw new Error("[Main] Canvas #game não encontrado no DOM.");
    }

    // Garante tamanho correto
    if (!canvas.width || canvas.width === 300) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Expõe globalmente para módulos que ainda referenciam diretamente
    if (typeof window.canvas === "undefined") {
        window.canvas = canvas;
    }
    if (typeof window.ctx === "undefined") {
        window.ctx = canvas.getContext("2d");
        window.ctx.imageSmoothingEnabled = false;
    }

    // Resize responsivo
    window.addEventListener("resize", Utils.debounce(() => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        EventBus.emit("canvas:resize", {
            largura: canvas.width,
            altura:  canvas.height
        });
    }, 150));
}

// ════════════════════════════════════════
//  INICIALIZAR ESTADO
// ════════════════════════════════════════

function _inicializarEstado() {
    // Se GameState estiver implementado, usa ele
    if (typeof GameState !== "undefined" && GameState.init) {
        GameState.init();
        return;
    }

    // Fallback: garante que as variáveis globais existem
    // (compatibilidade com game-batalha.js enquanto
    //  state.js não está implementado)
    if (typeof window.moeda     === "undefined") window.moeda     = BALANCE.MOEDA_INICIAL ?? 0;
    if (typeof window.gema      === "undefined") window.gema      = BALANCE.GEMA_INICIAL  ?? 50;
    if (typeof window.estagio   === "undefined") window.estagio   = 1;
    if (typeof window.emBatalha === "undefined") window.emBatalha = false;

    if (typeof window.personagem === "undefined") {
        window.personagem = { nivel: 1, exp: 0, expMax: 100 };
    }
    if (typeof window.inimigo === "undefined") {
        window.inimigo = { nome: "", hp: 0, maxHp: 0, nivel: 1, rMoeda: 0, rGema: 0 };
    }

    // Contadores para conquistas
    window._totalKills      = window._totalKills      ?? 0;
    window._totalUpgrades   = window._totalUpgrades   ?? 0;
    window._totalPrestígios = window._totalPrestígios ?? 0;
}

// ════════════════════════════════════════
//  CARREGAR SAVE
// ════════════════════════════════════════

async function _carregarSave() {
    // Se SaveSystem modular estiver implementado, usa ele
    if (typeof SaveSystem !== "undefined" && SaveSystem.carregar) {

        // Verifica se é o SaveSystem novo (modular) ou o antigo
        const isNovo = SaveSystem.init && typeof SaveSystem.init === "function";

        if (isNovo) {
            SaveSystem.init();
            return;
        }

        // Compatibilidade com SaveSystem do game-ui.js
        if (typeof inicializarSave === "function") {
            inicializarSave();
            return;
        }

        // SaveSystem novo sem init — chama carregar manualmente
        const save = SaveSystem.carregar();
        if (save) {
            _aplicarSave(save);
        }

        return;
    }

    // Fallback: tenta carregar save legado
    if (typeof inicializarSave === "function") {
        inicializarSave();
    }
}

function _aplicarSave(save) {
    try {
        if (typeof window.moeda     !== "undefined") window.moeda     = save.moeda     ?? 0;
        if (typeof window.gema      !== "undefined") window.gema      = save.gema      ?? 50;
        if (typeof window.estagio   !== "undefined") window.estagio   = save.estagio   ?? 1;
        if (typeof window.upgrades  !== "undefined" && save.upgrades) {
            Object.entries(save.upgrades).forEach(([k, nivel]) => {
                if (window.upgrades[k]) window.upgrades[k].nivel = nivel;
            });
        }
        if (typeof window.personagem !== "undefined" && save.personagem) {
            Object.assign(window.personagem, save.personagem);
        }
        if (typeof window.heroisObtidos      !== "undefined" && save.herois) {
            window.heroisObtidos = save.herois;
        }
        if (typeof window.equipamentosObtidos !== "undefined" && save.equips) {
            window.equipamentosObtidos = save.equips;
        }
        if (typeof GachaSystem !== "undefined" && save.pity) {
            GachaSystem.setPity?.(save.pity);
        }
        if (typeof conquistasDesbloqueadas !== "undefined" && save.conquistas) {
            save.conquistas.forEach(id => conquistasDesbloqueadas.add(id));
        }

        // Progresso offline
        _calcularProgressoOffline(save);

        console.log("[Main] Save carregado com sucesso.");
    } catch (e) {
        console.warn("[Main] Erro ao aplicar save:", e);
    }
}

function _calcularProgressoOffline(save) {
    if (!save?.timestamp) return;

    const agora        = Date.now();
    const segundos     = Math.floor((agora - save.timestamp) / 1000);
    const maxSeg       = (BALANCE.MAX_OFFLINE_HORAS ?? 8) * 3600;
    const tempoEfetivo = Math.min(segundos, maxSeg);

    if (tempoEfetivo < 60) return;

    // Calcula DPS atual
    const dpsAtual = typeof calcDps === "function"
        ? calcDps()
        : (window.upgrades?.dps?.valor ?? 0);

    const moedasGanhas = Math.floor(dpsAtual * tempoEfetivo * 0.5);
    if (moedasGanhas <= 0) return;

    window.moeda = (window.moeda ?? 0) + moedasGanhas;

    // Mostra toast após UI estar pronta
    setTimeout(() => {
        const tempo = Utils.formatarTempo(tempoEfetivo * 1000);
        if (typeof ToastSystem !== "undefined") {
            ToastSystem.mostrar(
                `⏰ Offline ${tempo} → +${Utils.formatarNum(moedasGanhas)} 🪙`,
                "sucesso",
                5000
            );
        }
        EventBus.emit("moeda:update", window.moeda);
    }, 1500);
}

// ════════════════════════════════════════
//  INICIALIZAR UI
// ════════════════════════════════════════

function _inicializarUI() {
    // Módulos de UI novos
    if (typeof UIModals    !== "undefined") UIModals.init?.();
    if (typeof UIHud       !== "undefined") UIHud.init?.();
    if (typeof UIBattle    !== "undefined") UIBattle.init?.();
    if (typeof UIUpgrades  !== "undefined") UIUpgrades.init?.();
    if (typeof UIGacha     !== "undefined") UIGacha.init?.();
    if (typeof UIConfig    !== "undefined") UIConfig.init?.();

    // Fallback: funções de UI do game-ui.js
    if (typeof atualizarHUDLobby   === "function") atualizarHUDLobby();
    if (typeof atualizarUIUpgrades  === "function") atualizarUIUpgrades();
    if (typeof atualizarListaInvocacao === "function") atualizarListaInvocacao();
    if (typeof atualizarBotaoPrestigiar === "function") atualizarBotaoPrestigiar();

    // Sincroniza nível da Santa em todos os elementos .santaLvUI
    document.querySelectorAll(".santaLvUI").forEach(el => {
        el.textContent = window.personagem?.nivel ?? 1;
    });

    console.log("[Main] UI inicializada.");
}

// ════════════════════════════════════════
//  LOOP PRINCIPAL DE RENDERIZAÇÃO
// ════════════════════════════════════════

let _loopAtivo    = false;
let _ultimoFrame  = 0;
let _fps          = 0;
let _contadorFPS  = 0;
let _tempoFPS     = 0;

function _iniciarLoop() {
    if (_loopAtivo) return;
    _loopAtivo   = true;
    _ultimoFrame = performance.now();
    requestAnimationFrame(_loop);
    console.log("[Main] Loop de renderização iniciado.");
}

function _loop(agora) {
    if (!_loopAtivo) return;

    // Delta time (ms entre frames)
    const delta = agora - _ultimoFrame;
    _ultimoFrame = agora;

    // Contador de FPS
    _contadorFPS++;
    _tempoFPS += delta;
    if (_tempoFPS >= 1000) {
        _fps       = _contadorFPS;
        _contadorFPS = 0;
        _tempoFPS    = 0;
        EventBus.emit("fps:update", _fps);
    }

    // Renderização — usa Renderer modular ou fallback
    if (typeof Renderer !== "undefined" && Renderer.loop) {
        Renderer.loop(agora, delta);
    } else {
        _loopFallback();
    }

    requestAnimationFrame(_loop);
}

/**
 * Fallback do loop — compatibilidade com
 * game-batalha.js e game-lobby.js enquanto
 * os renderers modulares não estão prontos.
 */
function _loopFallback() {
    const canvas = window.canvas;
    const ctx    = window.ctx;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (window.emBatalha) {
        // Renderiza batalha
        if (typeof window.desenharBatalha === "function") {
            window.desenharBatalha();
        }
        // Atualiza UI de batalha (throttled)
        if (typeof atualizarUIBatalha === "function") {
            atualizarUIBatalha();
        }
    } else {
        // Renderiza lobby
        if (typeof window.desenharLobby === "function") {
            window.desenharLobby();
        }
    }
}

// ════════════════════════════════════════
//  AUTO-SAVE
// ════════════════════════════════════════

function _iniciarAutoSave() {
    const intervalo = BALANCE.SAVE_INTERVALO_MS ?? 30_000;

    setInterval(() => {
        _salvar();
    }, intervalo);

    // Salva ao fechar / minimizar
    window.addEventListener("beforeunload",    () => _salvar());
    window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") _salvar();
    });

    console.log(`[Main] Auto-save ativo (a cada ${intervalo / 1000}s).`);
}

function _salvar() {
    try {
        // Usa SaveSystem modular se disponível
        if (typeof SaveSystem !== "undefined" && SaveSystem.salvar) {
            SaveSystem.salvar();
            return;
        }
        console.warn("[Main] SaveSystem não encontrado — save ignorado.");
    } catch (e) {
        console.error("[Main] Falha ao salvar:", e);
    }
}

// ════════════════════════════════════════
//  INPUTS FALLBACK
//  Registra inputs diretamente enquanto
//  input.js não está implementado
// ════════════════════════════════════════

function _registrarInputsFallback() {
    const canvas = window.canvas;
    if (!canvas) return;

    // Click no canvas
    canvas.addEventListener("click", () => {
        if (!window.emBatalha) return;
        if (typeof darDano === "function") {
            darDano(
                typeof calcDanoClick === "function" ? calcDanoClick() : 1,
                "click"
            );
        }
        if (typeof dispararAtaquePersonagem === "function") dispararAtaquePersonagem();
        if (typeof dispararFlor             === "function") dispararFlor();

        EventBus.emit("click:batalha");
    });

    // Touch no canvas (mobile)
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!window.emBatalha) return;
        if (typeof darDano === "function") {
            darDano(
                typeof calcDanoClick === "function" ? calcDanoClick() : 1,
                "click"
            );
        }
        if (typeof dispararAtaquePersonagem === "function") dispararAtaquePersonagem();
        if (typeof dispararFlor             === "function") dispararFlor();

        EventBus.emit("click:batalha");
    }, { passive: false });

    // Previne zoom duplo toque no mobile
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
    }, { passive: false });

    // Tecla ESC — fecha modais
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const modais = [
            "janelaConfig", "modalInvocar", "modalEquipar",
            "modalConquistas", "modalMissoes", "modalConfirmReset"
        ];
        modais.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.style.display !== "none") el.style.display = "none";
        });
        EventBus.emit("modal:fechado", { tecla: "ESC" });
    });

    console.log("[Main] Inputs fallback registrados.");
}

// ════════════════════════════════════════
//  EVENTOS DE SISTEMA
//  Reage a eventos globais do jogo
// ════════════════════════════════════════

function _registrarEventosSistema() {

    // Quando um inimigo morre — registra kill
    EventBus.on("kill:registrado", () => {
        window._totalKills = (window._totalKills ?? 0) + 1;
    });

    // Quando upgrade é comprado
    EventBus.on("upgrade:comprado", () => {
        window._totalUpgrades = (window._totalUpgrades ?? 0) + 1;
    });

    // Quando prestígio é feito
    EventBus.on("prestigio:feito", () => {
        window._totalPrestígios = (window._totalPrestígios ?? 0) + 1;
        _salvar(); // salva imediatamente após prestígio
    });

    // Quando conquista é desbloqueada
    EventBus.on("conquista:desbloqueada", (conquista) => {
        console.log(`[Main] 🏆 Conquista: ${conquista.nome}`);
    });

    // Quando quest é completada
    EventBus.on("quest:completada", (quest) => {
        console.log(`[Main] 📋 Quest completa: ${quest.nome}`);
        // Atualiza badge no botão de missões
        const badge = document.getElementById("questBadge");
        if (badge) badge.style.display = "flex";
    });

    // Quando moeda/gema muda — atualiza HUD
    EventBus.on("moeda:update", () => {
        if (typeof atualizarHUDLobby === "function") atualizarHUDLobby();
        if (typeof UIHud !== "undefined") UIHud.atualizar?.();
    });
    EventBus.on("gema:update", () => {
        if (typeof atualizarHUDLobby === "function") atualizarHUDLobby();
        if (typeof UIHud !== "undefined") UIHud.atualizar?.();
    });

    // Quando jogo fica em segundo plano
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            EventBus.emit("jogo:voltou");
            console.log("[Main] Jogo retomado.");
        } else {
            EventBus.emit("jogo:saiu");
            _salvar();
        }
    });
}

// ════════════════════════════════════════
//  TRATAMENTO DE ERRO FATAL
// ════════════════════════════════════════

function _tratarErroFatal(erro) {
    console.error("[Main] ERRO FATAL:", erro);

    const tela = document.getElementById("telaLoading");
    if (tela) {
        tela.innerHTML = `
            <div id="loadingConteudo">
                <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
                <h2 style="color:#f5a623; font-family:'Cinzel',serif; margin-bottom:12px;">
                    Erro ao iniciar
                </h2>
                <p style="color:#aaa; font-size:14px; max-width:300px;
                           line-height:1.6; margin-bottom:24px;">
                    Ocorreu um erro inesperado.<br>
                    Tente recarregar a página.
                </p>
                <button
                    onclick="location.reload()"
                    style="
                        background: linear-gradient(135deg,#7c3aed,#a855f7);
                        border: none;
                        border-radius: 12px;
                        color: #fff;
                        padding: 12px 28px;
                        font-size: 15px;
                        font-weight: 700;
                        cursor: pointer;
                        font-family: 'Nunito', sans-serif;
                    ">
                    🔄 Recarregar
                </button>
                <details style="margin-top:20px; color:#666; font-size:11px; max-width:300px;">
                    <summary style="cursor:pointer; color:#888;">Detalhes do erro</summary>
                    <pre style="margin-top:8px; text-align:left; white-space:pre-wrap;
                                word-break:break-all;">
${erro?.message ?? String(erro)}
                    </pre>
                </details>
            </div>`;
        tela.style.opacity = "1";
        tela.style.display = "flex";
    }
}

// ════════════════════════════════════════
//  HELPERS INTERNOS
// ════════════════════════════════════════

/**
 * Verifica se um módulo está presente.
 * Lança warning mas não bloqueia — o jogo tenta
 * continuar mesmo sem módulos opcionais.
 */
function _checar(nome, condicao) {
    if (!condicao) {
        console.warn(`[Main] Módulo não encontrado: ${nome}`);
    }
}

// ════════════════════════════════════════
//  API PÚBLICA
//  Exposta em window para debug no console
// ════════════════════════════════════════

window.TapLisieux = Object.freeze({
    get fps()          { return _fps; },
    get versao()       { return "2.0.0"; },
    salvar:            () => _salvar(),
    pausar:            () => { _loopAtivo = false; },
    retomar:           () => { if (!_loopAtivo) { _loopAtivo = true; requestAnimationFrame(_loop); } },
    debug: {
        pools: () => {
            if (typeof PoolParticulas !== "undefined") PoolParticulas.debug("Partículas");
            if (typeof PoolTextos     !== "undefined") PoolTextos.debug("Textos");
            if (typeof PoolMoedas     !== "undefined") PoolMoedas.debug("Moedas");
            if (typeof PoolProjéteis  !== "undefined") PoolProjéteis.debug("Projéteis");
        },
        estado: () => console.table({
            moeda:      window.moeda,
            gema:       window.gema,
            estagio:    window.estagio,
            emBatalha:  window.emBatalha,
            nivel:      window.personagem?.nivel,
            fps:        _fps
        }),
        eventBus: () => console.log("[Debug] EventBus ativo.")
    }
});
