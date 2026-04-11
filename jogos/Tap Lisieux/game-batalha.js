// ═══════════════════════════════════════════════════════════
//  GAME-BATALHA.JS  — Estilo Tap Titans 2
//  ATENÇÃO: canvas e ctx são declarados no arquivo principal
// ═══════════════════════════════════════════════════════════

"use strict";

// ════════════════════════════════════════
//  CONSTANTES
// ════════════════════════════════════════
const ASSET_BASE        = "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/";
const QTD_FLORES_CEU    = 14;
const DPS_INTERVALO_MS  = 1000;
const FALA_INTERVALO_MS = 9000;
const FALA_DURACAO_MS   = 3500;
const FALA_CHANCE       = 0.3;

// ════════════════════════════════════════
//  ECONOMIA
// ════════════════════════════════════════
let moeda = 0;
let gema  = 50;

// ════════════════════════════════════════
//  UPGRADES
// ════════════════════════════════════════
const upgrades = {
    forca: {
        nivel: 1, base: 5, mult: 1.50, cBase: 15, cCres: 1.60,
        get dano()  { return Math.floor(this.base  * Math.pow(this.mult,  this.nivel - 1)); },
        get custo() { return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel - 1)); }
    },
    rosa: {
        nivel: 1, base: 3, mult: 1.40, cBase: 20, cCres: 1.65,
        get dano()  { return Math.floor(this.base  * Math.pow(this.mult,  this.nivel - 1)); },
        get custo() { return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel - 1)); }
    },
    velocidade: {
        nivel: 1, base: 1.0, mult: 1.10, cBase: 30, cCres: 1.70,
        get bonus() { return parseFloat((this.base * Math.pow(this.mult, this.nivel - 1)).toFixed(2)); },
        get custo() { return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel - 1)); }
    },
    dps: {
        nivel: 1, base: 2, mult: 1.60, cBase: 25, cCres: 1.70,
        get valor() { return Math.floor(this.base  * Math.pow(this.mult,  this.nivel - 1)); },
        get custo() { return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel - 1)); }
    }
};

function calcDanoClick() {
    return Math.floor((upgrades.forca.dano + upgrades.rosa.dano) * upgrades.velocidade.bonus);
}

function calcDps() {
    return upgrades.dps.valor;
}

function comprarUpgrade(tipo) {
    const up = upgrades[tipo];
    if (!up || moeda < up.custo) return;
    moeda -= up.custo;
    up.nivel++;
    atualizarUIUpgrades();
    atualizarUIBatalha();
}

// ════════════════════════════════════════
//  PERSONAGEM
// ════════════════════════════════════════
const personagem = { nivel: 1, exp: 0, expMax: 100 };

// ════════════════════════════════════════
//  ESTADO DE BATALHA
// ════════════════════════════════════════
let emBatalha = false;
let estagio   = 1;

// ════════════════════════════════════════
//  INIMIGO
// ════════════════════════════════════════
const inimigo = { nome: "", hp: 0, maxHp: 0, nivel: 1, rMoeda: 0, rGema: 0 };

// ════════════════════════════════════════
//  HIT STATE
// ════════════════════════════════════════
const hitState = { tremendo: 0, flash: 0 };

// ════════════════════════════════════════
//  ASSETS
// ════════════════════════════════════════
const assets = {
    cenario: null,
    chao:    null,
    santa:   new Array(8).fill(null)
};

function carregarAssets() {
    const imgCenario       = new Image();
    imgCenario.crossOrigin = "anonymous";
    imgCenario.onload      = () => { assets.cenario = imgCenario; };
    imgCenario.onerror     = () => { console.warn("Cenário não carregado — usando fallback."); };
    imgCenario.src         = ASSET_BASE + "piso-de-batalha/cenario1.png";

    const imgChao          = new Image();
    imgChao.crossOrigin    = "anonymous";
    imgChao.onload         = () => { assets.chao = imgChao; };
    imgChao.onerror        = () => { console.warn("Chão não carregado — usando fallback."); };
    imgChao.src            = ASSET_BASE + "piso-de-batalha/piso1.png";

    for (let i = 1; i <= 8; i++) {
        const img          = new Image();
        img.crossOrigin    = "anonymous";
        const idx          = i - 1;
        img.onload         = () => { assets.santa[idx] = img; };
        img.onerror        = () => { console.warn(`Frame ${i} da santa não carregado.`); };
        img.src            = ASSET_BASE + "animation_summon/str-conjurando" + i + ".png";
    }
}
carregarAssets();

// ════════════════════════════════════════
//  NOMES / MONSTROS
// ════════════════════════════════════════
const nomesEstagio = [
    "Jardim das Sombras",  "Cripta Maldita",       "Floresta Corrompida",
    "Vale das Trevas",     "Torre do Mal",          "Abismo Profundo",
    "Santuário Profanado", "Catedral Sombria",      "Portal Infernal",
    "Domínio do Caos"
];

const tiposMonstros = [
    { nome: "Demônio",           emojis: { normal: "😈", dor: "😖", medo: "😱", raiva: "👿" } },
    { nome: "Espírito Maligno",  emojis: { normal: "👻", dor: "😵", medo: "😨", raiva: "💢" } },
    { nome: "Sombra Corrompida", emojis: { normal: "🕷", dor: "💀", medo: "😰", raiva: "🕷" } },
    { nome: "Chefe das Trevas",  emojis: { normal: "💀", dor: "😣", medo: "😱", raiva: "😡" } },
    { nome: "Anjo Caído",        emojis: { normal: "😤", dor: "🥴", medo: "😰", raiva: "🔥" } }
];

const falasMonstros = {
    "Demônio":           ["Você é uma inútil mesmo!", "Nem suas orações te salvam!", "Que fraquinha!", "Vai chorar pro seu Deus?"],
    "Espírito Maligno":  ["Florzinhas? Ridículo!", "Desista, santinha!", "Sua fé não vale nada!"],
    "Sombra Corrompida": ["A escuridão vence a luz!", "Suas rosas não têm poder aqui!"],
    "Chefe das Trevas":  ["Eu sou eterno!", "A santa mais fraca que já enfrentei!"],
    "Anjo Caído":        ["Caí por escolha!", "Agora sirvo a mim mesmo!"]
};

function tipoMonstroIdx(e) {
    if (e % 10 === 0) return 3;
    return Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
}

function nomeStageName(e) {
    return nomesEstagio[(e - 1) % nomesEstagio.length];
}

// ── Falas ──
let timerFala = null;
let falaAtiva = false;

function exibirFala(nomeBase) {
    const falas = falasMonstros[nomeBase] ?? falasMonstros["Demônio"];
    const txt   = falas[Math.floor(Math.random() * falas.length)];
    const el    = document.getElementById("falaInimigo");
    const tel   = document.getElementById("falaTexto");
    if (!el || !tel) return;

    tel.innerText = `"${txt}"`;
    el.classList.add("visivel");
    falaAtiva = true;

    if (timerFala) clearTimeout(timerFala);
    timerFala = setTimeout(() => {
        el.classList.remove("visivel");
        falaAtiva = false;
    }, FALA_DURACAO_MS);
}

// ════════════════════════════════════════
//  INIMIGO — configurar / matar
// ════════════════════════════════════════
function configurarInimigo(e) {
    const idx   = tipoMonstroIdx(e);
    const tipo  = tiposMonstros[idx];
    const chefe = e % 10 === 0;

    inimigo.nome   = tipo.nome + (chefe ? " [CHEFE]" : "") + " Lv." + e;
    inimigo.nivel  = e;
    inimigo.maxHp  = Math.floor(80 * Math.pow(1.22, e));
    inimigo.hp     = inimigo.maxHp;
    inimigo.rMoeda = Math.floor(10 * Math.pow(1.15, e));
    inimigo.rGema  = chefe ? Math.floor(5 + e / 5) : (Math.random() < 0.05 ? 1 : 0);

    setTimeout(() => exibirFala(tipo.nome), 900);
}

function darDano(valor, tipo) {
    if (!emBatalha || valor <= 0) return;
    inimigo.hp        -= valor;
    hitState.tremendo  = 14;
    hitState.flash     = 10;
    criarTexto("-" + formatarNum(valor), tipo);
    if (inimigo.hp <= 0) matarInimigo();
}

function matarInimigo() {
    moeda += inimigo.rMoeda;
    if (inimigo.rGema > 0) gema += inimigo.rGema;

    const qtdMoedas = Math.min(5, 1 + Math.floor(inimigo.rMoeda / 10));
    for (let i = 0; i < qtdMoedas; i++) criarMoedaCaindo();

    ganharExp(5 + estagio * 2);
    estagio++;
    floresAtaque = [];
    configurarInimigo(estagio);
    atualizarUIBatalha();
    atualizarBotaoPrestigiar();
}

function atualizarBotaoPrestigiar() {
    const btnP = document.getElementById("btnPrestigiar");
    if (!btnP) return;
    btnP.disabled  = estagio < 60;
    btnP.innerText = estagio >= 60 ? "🌟 Prestigiar!" : `Alcance o Est. 60`;
}

function ganharExp(qtd) {
    personagem.exp += qtd;
    while (personagem.exp >= personagem.expMax) {
        personagem.exp   -= personagem.expMax;
        personagem.nivel++;
        personagem.expMax = Math.floor(100 * Math.pow(1.3, personagem.nivel - 1));
        criarTexto("LEVEL UP! Lv." + personagem.nivel, "levelup");
    }
    // Atualiza qualquer elemento com a classe santaLvUI
    document.querySelectorAll(".santaLvUI").forEach(el => {
        el.innerText = personagem.nivel;
    });
}

function prestigiar() {
    if (estagio < 60) return;
    estagio = 1;
    moeda   = 0;
    Object.values(upgrades).forEach(u => { u.nivel = 1; });
    configurarInimigo(1);
    atualizarUIBatalha();
    atualizarUIUpgrades();
    atualizarBotaoPrestigiar();
    criarTexto("✨ PRESTIGIADO!", "levelup");
}

// ════════════════════════════════════════
//  CONTROLE DE BATALHA
// ════════════════════════════════════════
function iniciarBatalha() {
    emBatalha = true;
    const uiBatalha   = document.getElementById("uiBatalha");
    const lobbyHUD    = document.getElementById("lobbyHUD");
    const lobbyBotoes = document.getElementById("lobbybotoes");
    if (uiBatalha)   uiBatalha.style.display   = "flex";
    if (lobbyHUD)    lobbyHUD.style.display     = "none";
    if (lobbyBotoes) lobbyBotoes.style.display  = "none";
    inicializarFlores();
    configurarInimigo(estagio);
    atualizarUIBatalha();
    atualizarUIUpgrades();
}

function sairBatalha() {
    emBatalha = false;
    const uiBatalha   = document.getElementById("uiBatalha");
    const lobbyHUD    = document.getElementById("lobbyHUD");
    const lobbyBotoes = document.getElementById("lobbybotoes");
    if (uiBatalha)   uiBatalha.style.display   = "none";
    if (lobbyHUD)    lobbyHUD.style.display     = "flex";
    if (lobbyBotoes) lobbyBotoes.style.display  = "flex";
    floresAtaque = [];
}

function irEstagioAnterior() {
    if (estagio <= 1) return;
    estagio--;
    configurarInimigo(estagio);
    atualizarUIBatalha();
}

function irProximoEstagio() {
    estagio++;
    configurarInimigo(estagio);
    atualizarUIBatalha();
}

function irParaChefe() {
    estagio = Math.ceil(estagio / 10) * 10;
    configurarInimigo(estagio);
    atualizarUIBatalha();
}

// ════════════════════════════════════════
//  FORMATAÇÃO
// ════════════════════════════════════════
function formatarNum(n) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1)     + "M";
    if (n >= 1_000)         return (n / 1_000).toFixed(1)         + "K";
    return String(n);
}

// ════════════════════════════════════════
//  HELPERS DE POSIÇÃO
// ════════════════════════════════════════
function getChaoY()    { return canvas.height * 0.72; }
function getSantaX()   { return canvas.width  * 0.28; }
function getMonstroX() { return canvas.width  * 0.70; }
function getMonstroY() { return canvas.height * 0.52; }

// ════════════════════════════════════════
//  HELPER — imagem pronta para uso
// ════════════════════════════════════════
function imagemPronta(img) {
    return img && img.complete && img.naturalWidth > 0;
}

// ════════════════════════════════════════
//  FUNDO — cenário + chão
// ════════════════════════════════════════
function desenharFundoBatalha() {
    const W  = canvas.width;
    const H  = canvas.height;
    const cy = getChaoY();

    // Cenário (cover)
    if (imagemPronta(assets.cenario)) {
        const img = assets.cenario;
        const esc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw  = img.naturalWidth  * esc;
        const dh  = img.naturalHeight * esc;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
        desenharFundoFallback(W, H, cy);
    }

    // Chão
    const chaoH = H - cy;
    if (imagemPronta(assets.chao)) {
        ctx.drawImage(assets.chao, 0, cy, W, chaoH);
    } else {
        desenharChaoFallback(W, H, cy, chaoH);
    }

    // Sombra de transição
    const gs = ctx.createLinearGradient(0, cy - 20, 0, cy + 35);
    gs.addColorStop(0, "rgba(0,0,0,0)");
    gs.addColorStop(1, "rgba(0,0,0,0.40)");
    ctx.fillStyle = gs;
    ctx.fillRect(0, cy - 20, W, 55);
}

function desenharFundoFallback(W, H, cy) {
    const g = ctx.createLinearGradient(0, 0, 0, cy);
    g.addColorStop(0,    "#050210");
    g.addColorStop(0.45, "#0e0930");
    g.addColorStop(1,    "#221470");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Estrelas
    const t = Date.now();
    for (let i = 0; i < 90; i++) {
        const sx = (i * 191 + 7)  % W;
        const sy = (i * 97  + 13) % (cy * 0.75);
        ctx.globalAlpha = (Math.abs(Math.sin(t * 0.0008 + i)) * 0.6 + 0.3) * 0.55;
        ctx.fillStyle   = "#fff";
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Lua
    const luaX = W * 0.78, luaY = H * 0.15;
    const gl   = ctx.createRadialGradient(luaX, luaY, 0, luaX, luaY, 58);
    gl.addColorStop(0,   "rgba(255,245,190,1)");
    gl.addColorStop(0.5, "rgba(255,220,120,0.45)");
    gl.addColorStop(1,   "rgba(255,200,80,0)");
    ctx.fillStyle = gl;
    ctx.beginPath();
    ctx.arc(luaX, luaY, 58, 0, Math.PI * 2);
    ctx.fill();

    // Montanhas
    const pontos = [
        [0,0],[0.10,0.22],[0.22,0.09],[0.36,0.28],[0.50,0.07],
        [0.63,0.25],[0.76,0.11],[0.89,0.23],[1,0]
    ];
    ctx.fillStyle = "rgba(12,6,32,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    pontos.forEach(([px, py]) => ctx.lineTo(W * px, cy - H * 0.3 * py));
    ctx.lineTo(W, cy);
    ctx.closePath();
    ctx.fill();
}

function desenharChaoFallback(W, H, cy, chaoH) {
    const g = ctx.createLinearGradient(0, cy, 0, H);
    g.addColorStop(0,   "#2a1060");
    g.addColorStop(0.3, "#1a0840");
    g.addColorStop(1,   "#080420");
    ctx.fillStyle = g;
    ctx.fillRect(0, cy, W, chaoH);

    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0,   "rgba(100,50,220,0)");
    gl.addColorStop(0.3, "rgba(160,80,255,0.55)");
    gl.addColorStop(0.7, "rgba(160,80,255,0.55)");
    gl.addColorStop(1,   "rgba(100,50,220,0)");
    ctx.strokeStyle = gl;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();
}

// ════════════════════════════════════════
//  PERSONAGEM — Santa Teresinha
// ════════════════════════════════════════
const pb = {
    atacando:  0,
    durAtaque: 28,
    frame:     0,
    tempo:     0
};

function dispararAtaquePersonagem() {
    pb.atacando = pb.durAtaque;
}

function atualizarPB() {
    pb.tempo++;
    if (pb.tempo >= 5) { pb.tempo = 0; pb.frame = (pb.frame + 1) % 8; }
    if (pb.atacando > 0) pb.atacando--;
}

function desenharPB() {
    const px   = getSantaX();
    const py   = getChaoY();
    const ALTO = canvas.height * 0.30;
    const offX = pb.atacando > 0
        ? Math.sin((pb.atacando / pb.durAtaque) * Math.PI) * 16
        : 0;
    const img  = assets.santa[pb.frame];

    if (imagemPronta(img)) {
        const lar = ALTO * (img.naturalWidth / img.naturalHeight);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.30)";
        ctx.beginPath();
        ctx.ellipse(px + offX, py + 5, lar * 0.34, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.drawImage(img, px + offX - lar / 2, py - ALTO, lar, ALTO);
    } else {
        desenharSantaFallback(px, py, ALTO, offX);
    }
}

function desenharSantaFallback(px, py, ALTO, offX) {
    const r = ALTO * 0.13;
    ctx.save();
    ctx.shadowBlur  = 20;
    ctx.shadowColor = "rgba(200,150,255,0.8)";

    ctx.fillStyle = "#e8c5ff";
    ctx.beginPath();
    ctx.arc(px + offX, py - ALTO * 0.80, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.ellipse(px + offX, py - ALTO * 0.80 - r * 1.05, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#6d28d9";
    ctx.beginPath();
    ctx.moveTo(px + offX - r * 0.5,  py - ALTO * 0.66);
    ctx.lineTo(px + offX - r * 0.85, py);
    ctx.lineTo(px + offX + r * 0.85, py);
    ctx.lineTo(px + offX + r * 0.5,  py - ALTO * 0.66);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#c4b5fd";
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(px + offX + r * 0.35, py - ALTO * 0.55);
    ctx.lineTo(px + offX + r * 1.35, py - ALTO * 0.73);
    ctx.stroke();

    ctx.font         = `${r * 1.5}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🌹", px + offX + r * 1.6, py - ALTO * 0.78);
    ctx.restore();
}

// ════════════════════════════════════════
//  MONSTRO
// ════════════════════════════════════════
function emojiMonstroAtual() {
    const tipo = tiposMonstros[tipoMonstroIdx(estagio)];
    const pct  = inimigo.maxHp > 0 ? inimigo.hp / inimigo.maxHp : 1;
    if (hitState.flash > 0) return tipo.emojis.dor;
    if (pct < 0.20)         return tipo.emojis.medo;
    if (pct < 0.50)         return tipo.emojis.raiva;
    return tipo.emojis.normal;
}

function desenharMonstro() {
    // ── Decrementa em um único lugar ──
    if (hitState.flash    > 0) hitState.flash--;
    if (hitState.tremendo > 0) hitState.tremendo--;

    const ox  = hitState.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
    const oy  = hitState.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;
    const pct = Math.max(0.05, inimigo.maxHp > 0 ? inimigo.hp / inimigo.maxHp : 1);
    const tam = canvas.height * (0.20 + pct * 0.06);
    const mx  = getMonstroX() + ox;
    const my  = getMonstroY() + oy;

    ctx.save();
    if (hitState.flash > 0) {
        ctx.filter      = "sepia(1) saturate(20) hue-rotate(300deg)";
        ctx.globalAlpha = 0.88;
    }
    ctx.shadowBlur  = 30 + Math.sin(Date.now() * 0.004) * 12;
    ctx.shadowColor = pct < 0.25 ? "rgba(255,220,0,0.9)" : "rgba(255,50,50,0.75)";
    ctx.font         = `${tam}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiMonstroAtual(), mx, my);
    ctx.restore();

    // Sombra no chão (sem offset de tremor)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(getMonstroX(), getChaoY() + 4, tam * 0.28, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ════════════════════════════════════════
//  ROSAS DO CÉU
// ════════════════════════════════════════
let flores       = [];
let floresAtaque = [];

function criarFlorCeu(randPos = false) {
    const baseX = canvas.width  * (0.04 + Math.random() * 0.90);
    const baseY = canvas.height * (0.04 + Math.random() * (randPos ? 0.58 : 0.50));
    return {
        baseX, baseY, x: baseX, y: baseY,
        size:  20 + Math.random() * 16,
        fase:  Math.random() * Math.PI * 2,
        fasev: Math.random() * Math.PI * 2,
        ampH:  5 + Math.random() * 8,
        ampV:  2 + Math.random() * 3,
        spd:   0.0007 + Math.random() * 0.0006,
        alpha: 0.65 + Math.random() * 0.30
    };
}

function inicializarFlores() {
    flores       = Array.from({ length: QTD_FLORES_CEU }, () => criarFlorCeu(true));
    floresAtaque = [];
}

function atualizarFloresCeu() {
    const t = Date.now();
    flores.forEach(f => {
        f.x = f.baseX + Math.sin(t * f.spd        + f.fase)  * f.ampH;
        f.y = f.baseY + Math.sin(t * f.spd * 0.65 + f.fasev) * f.ampV;
    });
}

function desenharFloresCeu() {
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    flores.forEach(f => {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.font        = `${f.size}px serif`;
        ctx.fillText("🌹", f.x, f.y);
        ctx.restore();
    });
}

function dispararFlor() {
    if (flores.length === 0) return;

    // Rosa mais próxima do monstro
    let idx = 0, dist = Infinity;
    flores.forEach((f, i) => {
        const d = Math.hypot(f.x - getMonstroX(), f.y - getMonstroY());
        if (d < dist) { dist = d; idx = i; }
    });

    const fo = flores[idx];
    const tx = getMonstroX() + (Math.random() - 0.5) * 50;
    const ty = getMonstroY() + (Math.random() - 0.5) * 50;
    const d  = Math.hypot(tx - fo.x, ty - fo.y);
    const sp = 10 + Math.random() * 4;
    const ag = Math.atan2(ty - fo.y, tx - fo.x);

    floresAtaque.push({
        x: fo.x, y: fo.y,
        vx: Math.cos(ag) * sp,
        vy: Math.sin(ag) * sp,
        tx, ty,
        size:    fo.size,
        vida:    Math.ceil(d / sp) + 8,
        acertou: false
    });

    // Repõe com rosa nova
    flores[idx] = criarFlorCeu(true);
}

function atualizarFloresAtaque() {
    floresAtaque.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        f.vida--;
        if (!f.acertou && Math.hypot(f.x - f.tx, f.y - f.ty) < 28) {
            f.acertou = true;
            f.vida    = 0;
            for (let p = 0; p < 8; p++) criarParticula(f.x, f.y);
        }
    });
    floresAtaque = floresAtaque.filter(f => f.vida > 0);
}

function desenharFloresAtaque() {
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    floresAtaque.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.vida / 10);
        ctx.font        = `${f.size}px serif`;
        ctx.fillText("🌹", f.x, f.y);
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  PARTÍCULAS
// ════════════════════════════════════════
let particulas = [];

function criarParticula(x, y) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 3.5;
    particulas.push({
        x, y,
        vx:   Math.cos(ang) * spd,
        vy:   Math.sin(ang) * spd,
        vida: 22 + Math.random() * 14,
        size: 5  + Math.random() * 8,
        cor:  `hsl(${325 + Math.random() * 50},90%,65%)`
    });
}

function atualizarParticulas() {
    particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.vida--; });
    particulas = particulas.filter(p => p.vida > 0);
}

function desenharParticulas() {
    particulas.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.vida / 12);
        ctx.fillStyle   = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  MOEDAS CAINDO
// ════════════════════════════════════════
let moedasAnim = [];

function criarMoedaCaindo() {
    moedasAnim.push({
        x:    getMonstroX() + (Math.random() - 0.5) * 80,
        y:    getMonstroY(),
        vy:   -(3.5 + Math.random() * 2.5),
        vx:   (Math.random() - 0.5) * 2.5,
        vida: 65,
        size: 20 + Math.random() * 10
    });
}

function atualizarMoedas() {
    moedasAnim.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.22; m.vida--; });
    moedasAnim = moedasAnim.filter(m => m.vida > 0);
}

function desenharMoedas() {
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    moedasAnim.forEach(m => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, m.vida / 18);
        ctx.font        = `${m.size}px serif`;
        ctx.fillText("🪙", m.x, m.y);
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  TEXTOS FLUTUANTES
// ════════════════════════════════════════
let textos = [];

function criarTexto(valor, tipo) {
    textos.push({
        x:    getMonstroX() + (Math.random() - 0.5) * 80,
        y:    getMonstroY() - 50,
        valor, tipo, vida: 75
    });
}

function desenharTextos() {
    textos.forEach(t => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.vida / 20);

        let cor = "#fff", tam = 19;
        if      (t.tipo === "levelup") { cor = "#ffd700"; tam = 24; }
        else if (t.tipo === "dps")     { cor = "#aaffaa"; tam = 13; }
        else if (t.tipo === "click")   { cor = "#ff9de2"; tam = 20; }

        ctx.font         = `bold ${tam}px 'Nunito', sans-serif`;
        ctx.textAlign    = "center";
        ctx.strokeStyle  = "rgba(0,0,0,0.85)";
        ctx.lineWidth    = 4;
        ctx.strokeText(t.valor, t.x, t.y);
        ctx.fillStyle    = cor;
        ctx.fillText(t.valor, t.x, t.y);
        ctx.restore();

        t.y -= 1.7;
        t.vida--;
    });
    textos = textos.filter(t => t.vida > 0);
}

// ════════════════════════════════════════
//  EVENTOS DE INPUT
//  (canvas já existe aqui pois este script
//   carrega depois do arquivo principal)
// ════════════════════════════════════════
canvas.addEventListener("click", () => {
    if (!emBatalha) return;
    darDano(calcDanoClick(), "click");
    dispararAtaquePersonagem();
    dispararFlor();
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!emBatalha) return;
    darDano(calcDanoClick(), "click");
    dispararAtaquePersonagem();
    dispararFlor();
}, { passive: false });

// ════════════════════════════════════════
//  TIMERS
// ════════════════════════════════════════
setInterval(() => {
    if (emBatalha) darDano(calcDps(), "dps");
}, DPS_INTERVALO_MS);

setInterval(() => {
    if (!emBatalha || falaAtiva) return;
    if (Math.random() < FALA_CHANCE) {
        exibirFala(tiposMonstros[tipoMonstroIdx(estagio)].nome);
    }
}, FALA_INTERVALO_MS);

// ════════════════════════════════════════
//  LOOP PRINCIPAL
// ════════════════════════════════════════
window.desenharBatalha = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharFundoBatalha();
    atualizarFloresCeu();    desenharFloresCeu();
    atualizarFloresAtaque(); desenharFloresAtaque();
    atualizarParticulas();   desenharParticulas();
    atualizarMoedas();       desenharMoedas();
    atualizarPB();           desenharPB();
    desenharMonstro();
    desenharTextos();
};
