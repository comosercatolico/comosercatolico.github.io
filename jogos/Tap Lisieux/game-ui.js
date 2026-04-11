// ═══════════════════════════════════════════════════════════
//  GAME-UI.JS  — Versão Profissional
//  UI: modais, abas, upgrades, invocação, HUDs
// ═══════════════════════════════════════════════════════════

"use strict";

// ════════════════════════════════════════
//  CONSTANTES DE BALANCEAMENTO
//  Todos os números do jogo em um lugar só
// ════════════════════════════════════════
const BALANCE = Object.freeze({
    GEMA_INICIAL:          50,
    MOEDA_INICIAL:         0,
    CUSTO_INVOCACAO_1:     100,
    CUSTO_INVOCACAO_10:    900,   // desconto no x10
    ENERGIA_MAX:           100,
    ENERGIA_RECARGA_MS:    30_000,
    UI_THROTTLE_MS:        200,
    PITY_MAXIMO:           90,
    PITY_SUAVE:            75,
    CHANCE_LENDARIO_BASE:  0.006,
    CHANCE_EPICO:          0.051,
    CHANCE_RARO:           0.201,
    ESTAGIO_PRESTIGIO:     60,
    MAX_OFFLINE_HORAS:     8,
    SAVE_INTERVALO_MS:     30_000,
});

// ════════════════════════════════════════
//  SISTEMA DE EVENTOS (EventBus)
//  Desacopla completamente os módulos
// ════════════════════════════════════════
const EventBus = (() => {
    const _map = new Map();
    return {
        on(evento, fn) {
            if (!_map.has(evento)) _map.set(evento, []);
            _map.get(evento).push(fn);
        },
        off(evento, fn) {
            if (!_map.has(evento)) return;
            _map.set(evento, _map.get(evento).filter(f => f !== fn));
        },
        emit(evento, dados) {
            (_map.get(evento) ?? []).forEach(fn => {
                try { fn(dados); }
                catch (e) { console.error(`[EventBus] Erro em "${evento}":`, e); }
            });
        }
    };
})();

// ════════════════════════════════════════
//  CACHE DE ELEMENTOS DO DOM
//  getElementById chamado 1x por elemento
// ════════════════════════════════════════
const DOM = (() => {
    const _cache = new Map();
    return {
        get(id) {
            if (!_cache.has(id)) _cache.set(id, document.getElementById(id));
            return _cache.get(id);
        },
        set(id, txt)  { const el = this.get(id); if (el) el.textContent = txt; },
        show(id)      { const el = this.get(id); if (el) el.style.display = "flex"; },
        hide(id)      { const el = this.get(id); if (el) el.style.display = "none"; },
        toggle(id, v) { const el = this.get(id); if (el) el.style.display = v ? "flex" : "none"; },
        invalidar(id) { _cache.delete(id); } // força novo getElementById
    };
})();

// ════════════════════════════════════════
//  SISTEMA DE SAVE (localStorage)
//  Progressão persiste entre sessões
// ════════════════════════════════════════
const SaveSystem = (() => {
    const KEY     = "taplisieux_save_v2";
    const VERSION = 2;

    function salvar() {
        try {
            const data = {
                versao:    VERSION,
                moeda,
                gema,
                estagio,
                upgrades:  Object.fromEntries(
                    Object.entries(upgrades).map(([k, v]) => [k, v.nivel])
                ),
                personagem: { ...personagem },
                herois:    heroisObtidos,
                equips:    equipamentosObtidos,
                pity:      GachaSystem.pityAtual,
                conquistas:[...conquistasDesbloqueadas],
                timestamp: Date.now()
            };
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.error("[Save] Falha ao salvar:", e);
        }
    }

    function carregar() {
        try {
            const raw = localStorage.getItem(KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (data.versao !== VERSION) {
                console.warn("[Save] Versão antiga detectada — resetando.");
                localStorage.removeItem(KEY);
                return null;
            }
            return data;
        } catch {
            console.warn("[Save] Dado corrompido — resetando.");
            localStorage.removeItem(KEY);
            return null;
        }
    }

    function autoSave() {
        setInterval(salvar, BALANCE.SAVE_INTERVALO_MS);
        // Salva também ao fechar a aba
        window.addEventListener("beforeunload", salvar);
        window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") salvar();
        });
    }

    return { salvar, carregar, autoSave };
})();

// ════════════════════════════════════════
//  PROGRESSO OFFLINE
//  Recompensa o jogador por voltar ao jogo
// ════════════════════════════════════════
function calcularProgressoOffline(save) {
    if (!save?.timestamp) return;

    const agora        = Date.now();
    const segundos     = Math.floor((agora - save.timestamp) / 1000);
    const maxSeg       = BALANCE.MAX_OFFLINE_HORAS * 3600;
    const tempoEfetivo = Math.min(segundos, maxSeg);

    if (tempoEfetivo < 60) return; // menos de 1 min — ignora

    const moedasGanhas = Math.floor(calcDps() * tempoEfetivo * 0.5);
    if (moedasGanhas <= 0) return;

    moeda += moedasGanhas;

    const horas = Math.floor(tempoEfetivo / 3600);
    const mins  = Math.floor((tempoEfetivo % 3600) / 60);
    const tempo = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;

    ToastSystem.mostrar(
        `⏰ Offline ${tempo} → +${formatarNum(moedasGanhas)} 🪙`,
        "sucesso",
        5000
    );
}

// ════════════════════════════════════════
//  INICIALIZAÇÃO DO SAVE
// ════════════════════════════════════════
function inicializarSave() {
    const save = SaveSystem.carregar();
    if (save) {
        moeda      = save.moeda      ?? BALANCE.MOEDA_INICIAL;
        gema       = save.gema       ?? BALANCE.GEMA_INICIAL;
        estagio    = save.estagio    ?? 1;

        if (save.upgrades) {
            Object.entries(save.upgrades).forEach(([k, nivel]) => {
                if (upgrades[k]) upgrades[k].nivel = nivel;
            });
        }
        if (save.personagem) Object.assign(personagem, save.personagem);
        if (save.herois)     heroisObtidos      = save.herois;
        if (save.equips)     equipamentosObtidos = save.equips;
        if (save.pity)       GachaSystem.setPity(save.pity);
        if (save.conquistas) save.conquistas.forEach(id => conquistasDesbloqueadas.add(id));

        calcularProgressoOffline(save);
    }
    SaveSystem.autoSave();
}

// ════════════════════════════════════════
//  TOAST NOTIFICATIONS
//  Feedback elegante sem interromper gameplay
// ════════════════════════════════════════
const ToastSystem = (() => {
    let container = null;

    function garantirContainer() {
        if (container) return;
        container = document.createElement("div");
        Object.assign(container.style, {
            position:      "fixed",
            top:           "80px",
            right:         "12px",
            zIndex:        "99999",
            display:       "flex",
            flexDirection: "column",
            gap:           "8px",
            pointerEvents: "none",
            maxWidth:      "280px"
        });
        document.body.appendChild(container);
    }

    const CORES = {
        info:    { borda: "#4a8fff", fundo: "rgba(10,20,60,0.95)"  },
        sucesso: { borda: "#44ff88", fundo: "rgba(10,40,20,0.95)"  },
        aviso:   { borda: "#f5a623", fundo: "rgba(40,25,10,0.95)"  },
        erro:    { borda: "#ff4444", fundo: "rgba(40,10,10,0.95)"  },
        lendario:{ borda: "#f5a623", fundo: "rgba(40,25,0,0.95)"   },
    };

    function mostrar(msg, tipo = "info", duracaoMs = 3000) {
        garantirContainer();
        const c = CORES[tipo] ?? CORES.info;

        const toast = document.createElement("div");
        Object.assign(toast.style, {
            background:   c.fundo,
            border:       `2px solid ${c.borda}`,
            color:        "#fff",
            padding:      "10px 14px",
            borderRadius: "10px",
            fontSize:     "13px",
            lineHeight:   "1.4",
            boxShadow:    `0 0 12px ${c.borda}55`,
            transition:   "opacity 0.3s ease, transform 0.3s ease",
            opacity:      "0",
            transform:    "translateX(20px)"
        });
        toast.textContent = msg;
        container.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.style.opacity   = "1";
            toast.style.transform = "translateX(0)";
        });

        // Animação de saída e remoção
        setTimeout(() => {
            toast.style.opacity   = "0";
            toast.style.transform = "translateX(20px)";
            setTimeout(() => toast.remove(), 300);
        }, duracaoMs);
    }

    return { mostrar };
})();

// ════════════════════════════════════════
//  SISTEMA DE CONQUISTAS
//  Objetivos de curto prazo — aumenta retenção
// ════════════════════════════════════════
const CONQUISTAS_DEF = [
    {
        id:          "primeiro_kill",
        nome:        "Primeira Batalha",
        desc:        "Derrote seu primeiro inimigo",
        emoji:       "⚔️",
        recompensa:  { gema: 10 },
        check:       () => (window._totalKills ?? 0) >= 1
    },
    {
        id:          "kill_10",
        nome:        "Guerreira",
        desc:        "Derrote 10 inimigos",
        emoji:       "💀",
        recompensa:  { gema: 20 },
        check:       () => (window._totalKills ?? 0) >= 10
    },
    {
        id:          "kill_100",
        nome:        "Caçadora Santa",
        desc:        "Derrote 100 inimigos",
        emoji:       "🗡️",
        recompensa:  { gema: 50 },
        check:       () => (window._totalKills ?? 0) >= 100
    },
    {
        id:          "estagio_10",
        nome:        "Exploradora",
        desc:        "Alcance o estágio 10",
        emoji:       "🗺️",
        recompensa:  { gema: 30 },
        check:       () => estagio >= 10
    },
    {
        id:          "estagio_50",
        nome:        "Peregrina",
        desc:        "Alcance o estágio 50",
        emoji:       "🌟",
        recompensa:  { gema: 100 },
        check:       () => estagio >= 50
    },
    {
        id:          "primeiro_lend",
        nome:        "Abençoada",
        desc:        "Obtenha um item Lendário",
        emoji:       "✨",
        recompensa:  { gema: 100 },
        check:       () => [...heroisObtidos, ...equipamentosObtidos].some(i => i.raridade === "Lendário")
    },
    {
        id:          "upgrade_10",
        nome:        "Aprimorada",
        desc:        "Faça 10 upgrades",
        emoji:       "📈",
        recompensa:  { moeda: 500 },
        check:       () => (window._totalUpgrades ?? 0) >= 10
    },
    {
        id:          "primeiro_prestigio",
        nome:        "Renascida",
        desc:        "Faça seu primeiro Prestígio",
        emoji:       "🌸",
        recompensa:  { gema: 200 },
        check:       () => (window._totalPrestígios ?? 0) >= 1
    },
];

const conquistasDesbloqueadas = new Set();

function verificarConquistas() {
    CONQUISTAS_DEF.forEach(c => {
        if (conquistasDesbloqueadas.has(c.id)) return;
        try {
            if (!c.check()) return;
        } catch { return; }

        conquistasDesbloqueadas.add(c.id);

        // Aplica recompensa
        if (c.recompensa.gema)  { gema  += c.recompensa.gema;  }
        if (c.recompensa.moeda) { moeda += c.recompensa.moeda; }

        // Notificação visual
        ToastSystem.mostrar(`🏆 ${c.emoji} ${c.nome} — ${c.desc}`, "sucesso", 4500);
        if (typeof criarTexto === "function") criarTexto(`🏆 ${c.nome}!`, "levelup");

        EventBus.emit("conquista:desbloqueada", c);
    });
}

// ════════════════════════════════════════
//  SISTEMA GACHA PROFISSIONAL
//  Com pity, soft pity e histórico
// ════════════════════════════════════════
const GachaSystem = (() => {
    let _pity    = 0;
    let _historico = [];

    function calcChanceLendario() {
        if (_pity >= BALANCE.PITY_MAXIMO) return 1.0;
        if (_pity >= BALANCE.PITY_SUAVE) {
            // Soft pity: +6% por pull acima do limiar
            return BALANCE.CHANCE_LENDARIO_BASE
                 + 0.06 * (_pity - BALANCE.PITY_SUAVE);
        }
        return BALANCE.CHANCE_LENDARIO_BASE;
    }

    function selecionarRaridade() {
        const r = Math.random();
        if (r < calcChanceLendario())     return "Lendário";
        if (r < BALANCE.CHANCE_EPICO)     return "Épico";
        if (r < BALANCE.CHANCE_RARO)      return "Raro";
        return "Comum";
    }

    function pull(pool) {
        _pity++;
        const raridade   = selecionarRaridade();
        const candidatos = pool.filter(i => i.raridade === raridade);

        // Fallback: se pool vazia para a raridade, pega comum
        const lista  = candidatos.length > 0
            ? candidatos
            : pool.filter(i => i.raridade === "Comum");

        const resultado = lista[Math.floor(Math.random() * lista.length)];

        if (resultado.raridade === "Lendário") _pity = 0; // reset pity

        _historico.push({
            item:      resultado.nome,
            raridade:  resultado.raridade,
            pullNum:   _historico.length + 1,
            timestamp: Date.now()
        });

        return resultado;
    }

    return {
        pull,
        get pityAtual()  { return _pity; },
        get historico()  { return [..._historico]; },
        setPity(v)       { _pity = Number(v) || 0; },
        pullsAteLend()   { return BALANCE.PITY_MAXIMO - _pity; }
    };
})();

// ════════════════════════════════════════
//  THROTTLE DE UI
//  UI HTML não precisa atualizar 60x/segundo
// ════════════════════════════════════════
const UIThrottle = (() => {
    let _ultima = 0;
    return {
        deveAtualizar() {
            const agora = performance.now();
            if (agora - _ultima >= BALANCE.UI_THROTTLE_MS) {
                _ultima = agora;
                return true;
            }
            return false;
        }
    };
})();

// ════════════════════════════════════════
//  FORMATADOR DE NÚMEROS
// ════════════════════════════════════════
function formatarNum(n) {
    if (typeof n !== "number" || isNaN(n)) return "0";
    if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
    if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
    if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
    if (n >= 1e3)  return (n / 1e3).toFixed(1)  + "K";
    return Math.floor(n).toString();
}

// ════════════════════════════════════════
//  NAVEGAÇÃO GERAL
// ════════════════════════════════════════
function abrirConfig()   { DOM.show("janelaConfig"); }
function fecharConfig()  { DOM.hide("janelaConfig"); }
function voltarSite()    { SaveSystem.salvar(); window.location.href = "index.html"; }

function fecharModal(id) {
    const el = DOM.get(id);
    if (el) el.style.display = "none";
}

function fecharSeForaModal(e, id) {
    if (e.target.id === id) fecharModal(id);
}

function abrirModalInvocar() {
    atualizarInfoPity();
    const el = DOM.get("modalInvocar");
    if (el) el.style.display = "flex";
}

function abrirModalEquipar() {
    atualizarListaEquipar();
    const el = DOM.get("modalEquipar");
    if (el) el.style.display = "flex";
}

// ════════════════════════════════════════
//  ENERGIA
// ════════════════════════════════════════
const Energia = (() => {
    let _atual = BALANCE.ENERGIA_MAX;
    const _max = BALANCE.ENERGIA_MAX;

    function tick() {
        if (_atual < _max) _atual = Math.min(_max, _atual + 1);
        DOM.set("hudEnergiaVal", `${_atual}/${_max}`);
    }

    setInterval(tick, BALANCE.ENERGIA_RECARGA_MS);

    return {
        get atual() { return _atual; },
        get max()   { return _max;   },
        gastar(n)   { if (_atual < n) return false; _atual -= n; tick(); return true; }
    };
})();

// ════════════════════════════════════════
//  ATUALIZAR HUD LOBBY
// ════════════════════════════════════════
function atualizarHUDLobby() {
    DOM.set("hudMoedaVal", formatarNum(moeda));
    DOM.set("hudGemaVal",  formatarNum(gema));
}

// ════════════════════════════════════════
//  ATUALIZAR UI BATALHA
//  Throttled — não roda todo frame
// ════════════════════════════════════════
function atualizarUIBatalha() {
    if (!emBatalha) return;

    // Barra de HP
    const hp  = Math.max(0, inimigo.hp);
    const pct = inimigo.maxHp > 0
        ? Math.max(0, Math.min(100, (hp / inimigo.maxHp) * 100))
        : 0;

    const bar = DOM.get("hpInimigo");
    if (bar) bar.style.width = pct + "%";

    DOM.set("nomeInimigo",   inimigo.nome);
    DOM.set("hpNumero",      `${formatarNum(hp)} / ${formatarNum(inimigo.maxHp)}`);
    DOM.set("estagioNum",    String(estagio));
    DOM.set("estagioNome",   nomeStageName(estagio));
    DOM.set("moedaCentroVal",formatarNum(moeda));
    DOM.set("danoTaqueUI",   `👆 ${formatarNum(calcDanoClick())} Dano de Toque`);
    DOM.set("moedaUIBatalha",`🪙 ${formatarNum(moeda)}`);
    DOM.set("gemaUIBatalha", `💎 ${formatarNum(gema)}`);

    atualizarUIUpgrades();
    atualizarHUDLobby();
    verificarConquistas();
}

// ════════════════════════════════════════
//  ATUALIZAR UPGRADES
// ════════════════════════════════════════
function atualizarUIUpgrades() {
    const u = upgrades;

    // Descrições
    DOM.set("forcaDesc", `Nv.${u.forca.nivel} · +${formatarNum(u.forca.dano)} dano/toque`);
    DOM.set("rosaDesc",  `Nv.${u.rosa.nivel} · +${formatarNum(u.rosa.dano)} dano/toque`);
    DOM.set("velDesc",   `Nv.${u.velocidade.nivel} · x${u.velocidade.bonus} velocidade`);
    DOM.set("dpsDesc",   `Nv.${u.dps.nivel} · +${formatarNum(u.dps.valor)} DPS`);

    // Botões com estado de desabilitado
    const botoes = [
        { id: "btnForca",      custo: u.forca.custo      },
        { id: "btnRosa",       custo: u.rosa.custo       },
        { id: "btnVelocidade", custo: u.velocidade.custo },
        { id: "btnDps",        custo: u.dps.custo        },
    ];

    botoes.forEach(({ id, custo }) => {
        const btn = DOM.get(id);
        if (!btn) return;
        const podePagar = moeda >= custo;
        btn.textContent = `🪙 ${formatarNum(custo)}`;
        btn.disabled    = !podePagar;
        // Feedback visual extra: brilha quando pode comprar
        btn.style.boxShadow = podePagar
            ? "0 0 8px rgba(255,215,0,0.5)"
            : "none";
    });
}

// ════════════════════════════════════════
//  MINIMIZAR PAINEL
// ════════════════════════════════════════
let painelMin = false;

function togglePainel() {
    painelMin = !painelMin;
    const c = DOM.get("abaConteudo");
    const b = DOM.get("btnMinimizar");
    const r = DOM.get("abaRodape");
    if (c) c.classList.toggle("minimizado", painelMin);
    if (b) b.textContent = painelMin ? "▲" : "▼";
    if (r) r.style.display = painelMin ? "none" : "flex";
}

// ════════════════════════════════════════
//  ABAS DA BATALHA
// ════════════════════════════════════════
const ABAS = ["abaUpgrades", "abaHerois", "abaArmas", "abaInvocacao"];

function abrirAba(nome, btn) {
    // Esconde todas
    ABAS.forEach(id => {
        const el = DOM.get(id);
        if (el) el.style.display = "none";
    });

    // Mostra a alvo
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
    const alvo = DOM.get("aba" + nomeFormatado);
    if (alvo) alvo.style.display = "block";

    // Atualiza botões de aba
    document.querySelectorAll(".abaRodapeBtn").forEach(b => b.classList.remove("ativa"));
    if (btn) btn.classList.add("ativa");

    // Atualiza conteúdo da aba aberta
    if (nome === "armas")     atualizarListaArmasBatalha();
    if (nome === "herois")    atualizarListaHeroisBatalha();
    if (nome === "invocacao") atualizarInfoPity();
}

// ════════════════════════════════════════
//  DADOS — POOL GACHA
// ════════════════════════════════════════
const poolHerois = [
    { nome:"Anjo Gabriel",   raridade:"Raro",     emoji:"😇", arma:"Espada de Luz"     },
    { nome:"São Francisco",  raridade:"Comum",    emoji:"🕊️", arma:"Cajado Sagrado"    },
    { nome:"São José",       raridade:"Comum",    emoji:"🔨", arma:"Martelo Bento"     },
    { nome:"Santa Cecília",  raridade:"Épico",    emoji:"🎵", arma:"Harpa Celestial"   },
    { nome:"São Miguel",     raridade:"Lendário", emoji:"⚔️", arma:"Lança Divina"      },
    { nome:"Santa Luzia",    raridade:"Raro",     emoji:"👁️", arma:"Vela da Graça"     },
    { nome:"Santo Antônio",  raridade:"Raro",     emoji:"📖", arma:"Livro Sagrado"     },
    { nome:"São Bento",      raridade:"Épico",    emoji:"✝️", arma:"Cruz de São Bento" },
];

const poolArmas = [
    { nome:"Rosas Sagradas",       raridade:"Comum",    emoji:"🌹", dano: 50  },
    { nome:"Lírios do Céu",        raridade:"Raro",     emoji:"🌸", dano: 120 },
    { nome:"Coroa de Espinhos",    raridade:"Épico",    emoji:"👑", dano: 300 },
    { nome:"Pétala Divina",        raridade:"Lendário", emoji:"✨", dano: 800 },
    { nome:"Terço Abençoado",      raridade:"Raro",     emoji:"📿", dano: 110 },
    { nome:"Vela da Misericórdia", raridade:"Épico",    emoji:"🕯️", dano: 280 },
];

const POOL_TOTAL = [...poolHerois, ...poolArmas];

const COR_RARIDADE = Object.freeze({
    "Comum":    "#aaaaaa",
    "Raro":     "#4a8fff",
    "Épico":    "#b44dff",
    "Lendário": "#f5a623"
});

// ════════════════════════════════════════
//  INVENTÁRIO
// ════════════════════════════════════════
let heroisObtidos       = [];
let equipamentosObtidos = [];

// ════════════════════════════════════════
//  INVOCAR (GACHA)
// ════════════════════════════════════════
function invocar(qtd) {
    // Custo com desconto no x10
    const custo = qtd === 10
        ? BALANCE.CUSTO_INVOCACAO_10
        : BALANCE.CUSTO_INVOCACAO_1 * qtd;

    if (gema < custo) {
        ToastSystem.mostrar(`❌ Gemas insuficientes! Precisa de 💎${custo}`, "erro");
        setResultado(`❌ Gemas insuficientes! Precisa de 💎${custo}`, "#ff4444");
        return;
    }

    gema -= custo;

    // Executa pulls via GachaSystem (com pity)
    const resultados = Array.from({ length: qtd }, () => GachaSystem.pull(POOL_TOTAL));

    // Adiciona ao inventário
    resultados.forEach(r => {
        if (r.arma && !r.dano) heroisObtidos.push(r);
        else                   equipamentosObtidos.push(r);
    });

    // Estatísticas do resultado
    const lend = resultados.filter(r => r.raridade === "Lendário").length;
    const epic = resultados.filter(r => r.raridade === "Épico").length;
    const primeiroItem = resultados[0];

    // Mensagem de resultado
    let txt, cor;
    if (qtd === 1) {
        txt = `${primeiroItem.emoji} ${primeiroItem.nome} (${primeiroItem.raridade})!`;
        cor = COR_RARIDADE[primeiroItem.raridade] ?? "#eeddff";
    } else {
        txt = `✨ ${qtd} invocações! Lendários: ${lend} · Épicos: ${epic}`;
        cor = lend > 0 ? "#f5a623" : epic > 0 ? "#b44dff" : "#eeddff";
    }

    setResultado(txt, cor);

    // Toast para lendários
    if (lend > 0) {
        ToastSystem.mostrar(
            `🌟 LENDÁRIO obtido! ${resultados.find(r => r.raridade === "Lendário").emoji}`,
            "lendario",
            5000
        );
    }

    // Info de pity
    atualizarInfoPity();
    atualizarListaInvocacao();
    atualizarListaHeroisBatalha();
    atualizarUIBatalha();
    atualizarHUDLobby();
    verificarConquistas();

    EventBus.emit("gacha:pull", { resultados, lend, epic });
}

// ════════════════════════════════════════
//  INFO DE PITY NA UI
// ════════════════════════════════════════
function atualizarInfoPity() {
    const el = DOM.get("pityInfo");
    if (!el) return;
    const faltam = GachaSystem.pullsAteLend();
    el.textContent = `🎯 Pity: ${GachaSystem.pityAtual}/${BALANCE.PITY_MAXIMO} · Lendário garantido em ${faltam} pulls`;
}

// ════════════════════════════════════════
//  RESULTADO GACHA
// ════════════════════════════════════════
function setResultado(txt, cor) {
    ["invocarResultado", "invocarResultado2"].forEach(id => {
        const el = DOM.get(id);
        if (!el) return;
        el.textContent           = txt;
        el.style.color           = cor;
        el.style.borderLeftColor = cor;
    });
}

// ════════════════════════════════════════
//  GERAÇÃO DE HTML DOS ITENS
// ════════════════════════════════════════
function itemTagHTML(item) {
    const c     = COR_RARIDADE[item.raridade] ?? "#aaa";
    const extra = item.dano ? ` +${formatarNum(item.dano)}` : "";
    // Escapa o conteúdo para evitar XSS
    const nome  = item.nome.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<span class="itemTag" style="border-color:${c};color:${c}">${item.emoji} ${nome}${extra}</span>`;
}

function itemCardHTML(item, mostraBtn = false) {
    const c    = COR_RARIDADE[item.raridade] ?? "#aaa";
    const dano = item.dano ? `+${formatarNum(item.dano)} dano` : item.arma ?? "";
    const nome = item.nome.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const btn  = mostraBtn
        ? `<button class="btnUp" onclick="equiparItem('${item.nome}')">Equipar</button>`
        : "";
    return `
        <div class="upgradeItem" style="margin-bottom:6px;">
            <div class="upIcone">${item.emoji}</div>
            <div class="upInfo">
                <span class="upNome" style="color:${c}">${nome}</span>
                <span class="upDesc">${item.raridade} · ${dano}</span>
            </div>
            ${btn}
        </div>`;
}

// ════════════════════════════════════════
//  EQUIPAR ITEM
// ════════════════════════════════════════
let itemEquipado = null;

function equiparItem(nomeItem) {
    const item = equipamentosObtidos.find(e => e.nome === nomeItem);
    if (!item) return;

    itemEquipado = item;
    ToastSystem.mostrar(`✅ ${item.emoji} ${item.nome} equipado!`, "sucesso");
    fecharModal("modalEquipar");
    atualizarUIBatalha();

    EventBus.emit("item:equipado", item);
}

// Retorna bônus de dano do item equipado
function bonusItemEquipado() {
    return itemEquipado?.dano ?? 0;
}

// ════════════════════════════════════════
//  LISTAS DE INVENTÁRIO
// ════════════════════════════════════════
function atualizarListaInvocacao() {
    const listaH = DOM.get("listaHerois");
    const listaE = DOM.get("listaEquipamentos");

    if (listaH) {
        listaH.innerHTML = heroisObtidos.length > 0
            ? heroisObtidos.map(itemTagHTML).join("")
            : "<p class='dica'>Nenhum herói ainda. Invoque para obter!</p>";
    }

    if (listaE) {
        listaE.innerHTML = equipamentosObtidos.length > 0
            ? equipamentosObtidos.map(itemTagHTML).join("")
            : "<p class='dica'>Nenhuma arma ainda. Invoque para obter!</p>";
    }
}

function atualizarListaHeroisBatalha() {
    const el = DOM.get("listaHeroisBatalha2");
    if (!el) return;
    const todos = [...heroisObtidos, ...equipamentosObtidos];
    el.innerHTML = todos.length > 0
        ? todos.map(itemTagHTML).join("")
        : "<p class='dica'>Nenhum item obtido. Invoque!</p>";
}

function atualizarListaEquipar() {
    const el = DOM.get("listaEquipamentosEquipar");
    if (!el) return;

    if (equipamentosObtidos.length === 0) {
        el.innerHTML = "<p class='dica'>Nenhuma arma obtida ainda. Invoque para obter!</p>";
        return;
    }

    // Ordena por dano decrescente
    const ordenados = [...equipamentosObtidos].sort((a, b) => (b.dano ?? 0) - (a.dano ?? 0));
    el.innerHTML = ordenados.map(a => itemCardHTML(a, true)).join("");
}

function atualizarListaArmasBatalha() {
    const el = DOM.get("listaArmasBatalha");
    if (!el) return;

    if (equipamentosObtidos.length === 0) {
        el.innerHTML = "<p class='dica'>Nenhuma arma extra ainda. Invoque para obter!</p>";
        return;
    }

    el.innerHTML = equipamentosObtidos.map(itemTagHTML).join("");
}

// ════════════════════════════════════════
//  TELA DE CONQUISTAS
// ════════════════════════════════════════
function atualizarTelaConquistas() {
    const el = DOM.get("listaConquistas");
    if (!el) return;

    el.innerHTML = CONQUISTAS_DEF.map(c => {
        const desbloqueada = conquistasDesbloqueadas.has(c.id);
        const recompTxt    = c.recompensa.gema
            ? `💎 ${c.recompensa.gema}`
            : `🪙 ${formatarNum(c.recompensa.moeda ?? 0)}`;

        return `
            <div class="upgradeItem" style="opacity:${desbloqueada ? 1 : 0.45};">
                <div class="upIcone">${desbloqueada ? c.emoji : "🔒"}</div>
                <div class="upInfo">
                    <span class="upNome">${c.nome}</span>
                    <span class="upDesc">${c.desc} · ${recompTxt}</span>
                </div>
                ${desbloqueada ? '<span style="color:#44ff88;font-size:18px">✅</span>' : ""}
            </div>`;
    }).join("");
}

// ════════════════════════════════════════
//  LISTENERS DO EVENTBUS
//  Reage a eventos do jogo automaticamente
// ════════════════════════════════════════
EventBus.on("moeda:update",  () => atualizarHUDLobby());
EventBus.on("gema:update",   () => atualizarHUDLobby());
EventBus.on("estagio:update",() => verificarConquistas());
EventBus.on("kill:registrado", () => {
    window._totalKills = (window._totalKills ?? 0) + 1;
    verificarConquistas();
});
EventBus.on("upgrade:comprado", () => {
    window._totalUpgrades = (window._totalUpgrades ?? 0) + 1;
    verificarConquistas();
});
EventBus.on("prestigio:feito", () => {
    window._totalPrestígios = (window._totalPrestígios ?? 0) + 1;
    verificarConquistas();
});

// ════════════════════════════════════════
//  INICIALIZAÇÃO
//  Roda quando o DOM está pronto
// ════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    inicializarSave();
    atualizarHUDLobby();
    atualizarListaInvocacao();
    console.log("✅ Game-UI inicializado.");
});
