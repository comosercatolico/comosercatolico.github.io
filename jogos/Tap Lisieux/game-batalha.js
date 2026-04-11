// ═══════════════════════════════════════
//  GAME-BATALHA.JS  — Estilo Tap Titans 2
//  Cenário real + chão + personagem + monstro
// ═══════════════════════════════════════

// ── Base URL dos assets no GitHub Pages ──
const ASSET_BASE = "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/";

// ── Economia ──
let moeda = 0, gema = 50;

// ── Upgrades ──
const upgrades = {
    forca:     { nivel:1, base:5,  mult:1.50, cBase:15, cCres:1.60,
                 get dano(){ return Math.floor(this.base * Math.pow(this.mult, this.nivel-1)); },
                 get custo(){ return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel-1)); } },
    rosa:      { nivel:1, base:3,  mult:1.40, cBase:20, cCres:1.65,
                 get dano(){ return Math.floor(this.base * Math.pow(this.mult, this.nivel-1)); },
                 get custo(){ return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel-1)); } },
    velocidade:{ nivel:1, base:1.0,mult:1.10, cBase:30, cCres:1.70,
                 get bonus(){ return parseFloat((this.base * Math.pow(this.mult, this.nivel-1)).toFixed(2)); },
                 get custo(){ return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel-1)); } },
    dps:       { nivel:1, base:2,  mult:1.60, cBase:25, cCres:1.70,
                 get valor(){ return Math.floor(this.base * Math.pow(this.mult, this.nivel-1)); },
                 get custo(){ return Math.floor(this.cBase * Math.pow(this.cCres, this.nivel-1)); } }
};

function calcDanoClick() { return Math.floor((upgrades.forca.dano + upgrades.rosa.dano) * upgrades.velocidade.bonus); }
function calcDps()        { return upgrades.dps.valor; }

function comprarUpgrade(tipo) {
    const up = upgrades[tipo];
    if (moeda < up.custo) return;
    moeda -= up.custo;
    up.nivel++;
    atualizarUIUpgrades();
    atualizarUIBatalha();
}

// ── Personagem ──
let personagem = { nivel: 1, exp: 0, expMax: 100 };

// ── Estado de batalha ──
let emBatalha = false;
let estagio   = 1;
let textos    = [];

// ── Inimigo ──
let inimigo = { nome: "", hp: 0, maxHp: 0, nivel: 1, rMoeda: 0, rGema: 0 };

// ── Hit state ──
const hitState = { tremendo: 0, flash: 0 };

// ════════════════════════════════════════
//  ASSETS — carregamento com fallback
// ════════════════════════════════════════
const assets = {
    cenario:    null,
    chao:       null,
    piso:       null,
    santa:      [],   // 8 frames conjurando
    santaIdle:  null,
    loaded:     { cenario:false, chao:false, piso:false, santa:0 }
};

function carregarAssets() {
    // Cenário de fundo
    const imgCenario = new Image();
    imgCenario.onload  = () => { assets.cenario = imgCenario; assets.loaded.cenario = true; };
    imgCenario.onerror = () => { assets.loaded.cenario = true; }; // fallback desenhado
    imgCenario.src = ASSET_BASE + "piso-de-batalha/cenario1.png";

    // Chão (tile)
    const imgChao = new Image();
    imgChao.onload  = () => { assets.chao = imgChao; assets.loaded.chao = true; };
    imgChao.onerror = () => { assets.loaded.chao = true; };
    imgChao.src = ASSET_BASE + "piso-de-batalha/piso1.png";

    // Animação da Santa conjurando (8 frames)
    for (let i = 1; i <= 8; i++) {
        const img = new Image();
        img.onload  = () => { assets.santa[i-1] = img; assets.loaded.santa++; };
        img.onerror = () => { assets.santa[i-1] = null; assets.loaded.santa++; };
        img.src = ASSET_BASE + "animation_summon/str-conjurando" + i + ".png";
    }
}
carregarAssets();

// ════════════════════════════════════════
//  NOMES / MONSTROS
// ════════════════════════════════════════
const nomesEstagio = [
    "Jardim das Sombras","Cripta Maldita","Floresta Corrompida",
    "Vale das Trevas","Torre do Mal","Abismo Profundo",
    "Santuário Profanado","Catedral Sombria","Portal Infernal","Domínio do Caos"
];

const tiposMonstros = [
    { nome:"Demônio",          emojis:{ normal:"😈", dor:"😖", medo:"😱", raiva:"👿" } },
    { nome:"Espírito Maligno", emojis:{ normal:"👻", dor:"😵", medo:"😨", raiva:"💢" } },
    { nome:"Sombra Corrompida",emojis:{ normal:"🕷", dor:"💀", medo:"😰", raiva:"🕷" } },
    { nome:"Chefe das Trevas", emojis:{ normal:"💀", dor:"😣", medo:"😱", raiva:"😡" } },
    { nome:"Anjo Caído",       emojis:{ normal:"😤", dor:"🥴", medo:"😰", raiva:"🔥" } }
];

const falasMonstros = {
    "Demônio":          ["Você é uma inútil mesmo!","Nem suas orações te salvam!","Que fraquinha!","Vai chorar pro seu Deus?"],
    "Espírito Maligno": ["Florzinhas? Ridículo!","Desista, santinha!","Sua fé não vale nada!"],
    "Sombra Corrompida":["A escuridão vence a luz!","Suas rosas não têm poder aqui!","Corre enquanto pode!"],
    "Chefe das Trevas": ["Eu sou eterno!","A santa mais fraca que já enfrentei!","Sua luz está se apagando..."],
    "Anjo Caído":       ["Caí por escolha!","O Paraíso me abandonou!","Agora sirvo a mim mesmo!"]
};

function tipoMonstroIdx(e) {
    if (e % 10 === 0) return 3;
    return Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
}
function nomeStageName(e) { return nomesEstagio[(e - 1) % nomesEstagio.length]; }

// ── Fala do monstro ──
let timerFala = null, falaAtiva = false;
function exibirFala(nomeBase) {
    const falas = falasMonstros[nomeBase] || falasMonstros["Demônio"];
    const txt   = falas[Math.floor(Math.random() * falas.length)];
    const el    = document.getElementById("falaInimigo");
    const tel   = document.getElementById("falaTexto");
    if (!el || !tel) return;
    tel.innerText = `"${txt}"`;
    el.classList.add("visivel");
    falaAtiva = true;
    if (timerFala) clearTimeout(timerFala);
    timerFala = setTimeout(() => { el.classList.remove("visivel"); falaAtiva = false; }, 3500);
}

// ── Configurar inimigo ──
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

// ── Iniciar / Sair ──
function iniciarBatalha() {
    emBatalha = true;
    document.getElementById("uiBatalha").style.display = "flex";
    document.getElementById("lobbyHUD").style.display  = "none";
    document.getElementById("lobbybotoes").style.display = "none";
    inicializarFlores();
    configurarInimigo(estagio);
    atualizarUIBatalha();
    atualizarUIUpgrades();
}

function sairBatalha() {
    emBatalha = false;
    document.getElementById("uiBatalha").style.display   = "none";
    document.getElementById("lobbyHUD").style.display    = "flex";
    document.getElementById("lobbybotoes").style.display = "flex";
    floresAtaque = [];
}

// ── Navegação ──
function irEstagioAnterior() { if (estagio > 1) { estagio--; configurarInimigo(estagio); atualizarUIBatalha(); } }
function irProximoEstagio()  { estagio++; configurarInimigo(estagio); atualizarUIBatalha(); }
function irParaChefe()       { estagio = Math.ceil(estagio / 10) * 10; configurarInimigo(estagio); atualizarUIBatalha(); }

// ── Dano ──
function darDano(valor, tipo) {
    if (!emBatalha) return;
    inimigo.hp -= valor;
    hitState.tremendo = 14;
    hitState.flash    = 10;
    criarTexto("-" + formatarNum(valor), tipo);
    if (inimigo.hp <= 0) matarInimigo();
}

function matarInimigo() {
    moeda += inimigo.rMoeda;
    if (inimigo.rGema > 0) gema += inimigo.rGema;
    for (let i = 0; i < Math.min(5, 1 + Math.floor(inimigo.rMoeda / 10)); i++) criarMoedaCaindo();
    ganharExp(5 + estagio * 2);
    estagio++;
    floresAtaque = [];
    configurarInimigo(estagio);
    atualizarUIBatalha();
    const btnP = document.getElementById("btnPrestigiar");
    if (btnP) {
        if (estagio >= 60) { btnP.disabled = false; btnP.innerText = "🌟 Prestigiar!"; }
        else { btnP.disabled = true; btnP.innerText = `Alcance o Est. 60`; }
    }
}

function ganharExp(qtd) {
    personagem.exp += qtd;
    while (personagem.exp >= personagem.expMax) {
        personagem.exp    -= personagem.expMax;
        personagem.nivel++;
        personagem.expMax  = Math.floor(100 * Math.pow(1.3, personagem.nivel - 1));
        criarTexto("LEVEL UP! Lv." + personagem.nivel, "levelup");
    }
    ["santaLvUI","santaLvUI2"].forEach(id => { const e = document.getElementById(id); if(e) e.innerText = personagem.nivel; });
}

function prestigiar() {
    if (estagio < 60) return;
    estagio = 1;
    moeda   = 0;
    Object.values(upgrades).forEach(u => { u.nivel = 1; });
    configurarInimigo(1);
    atualizarUIBatalha();
    atualizarUIUpgrades();
    criarTexto("✨ PRESTIGIADO!", "levelup");
}

// DPS passivo
setInterval(() => { if (emBatalha) darDano(calcDps(), "dps"); }, 1000);

// Fala periódica
setInterval(() => {
    if (!emBatalha || falaAtiva) return;
    if (Math.random() < 0.3) exibirFala(tiposMonstros[tipoMonstroIdx(estagio)].nome);
}, 9000);

// Click no canvas
canvas.addEventListener("click", () => {
    if (!emBatalha) return;
    darDano(calcDanoClick(), "click");
    dispararAtaquePersonagem();
    dispararFlor();
});

// ════════════════════════════════════════
//  FUNDO DE BATALHA — Estilo TT2
//  cenário real → fallback gradiente
//  chão real   → fallback gradiente
// ════════════════════════════════════════

// Tile pattern para o chão
let chaoPattern = null;
function obterChaoPattern() {
    if (chaoPattern) return chaoPattern;
    if (assets.chao) {
        try { chaoPattern = ctx.createPattern(assets.chao, "repeat-x"); } catch(e) {}
    }
    return chaoPattern;
}

function desenharFundoBatalha() {
    const W = canvas.width, H = canvas.height;

    // ── Altura do chão: 72% da tela ──
    const chaoY = H * 0.72;
    const chaoH = H - chaoY;

    // ══ CENÁRIO DE FUNDO ══
    if (assets.cenario) {
        // Desenha a imagem cobrindo toda a área acima do chão (stretch/cover)
        const img = assets.cenario;
        const escX = W / img.naturalWidth;
        const escY = chaoY / img.naturalHeight;
        const esc  = Math.max(escX, escY);
        const dw   = img.naturalWidth  * esc;
        const dh   = img.naturalHeight * esc;
        const dx   = (W - dw) / 2;
        ctx.drawImage(img, dx, 0, dw, dh);
    } else {
        // Fallback — céu gradiente dramático
        const gradCeu = ctx.createLinearGradient(0, 0, 0, chaoY);
        gradCeu.addColorStop(0,    "#050210");
        gradCeu.addColorStop(0.3,  "#0e0930");
        gradCeu.addColorStop(0.65, "#1a1050");
        gradCeu.addColorStop(1,    "#231470");
        ctx.fillStyle = gradCeu;
        ctx.fillRect(0, 0, W, chaoY);

        // Estrelas
        for (let i = 0; i < 90; i++) {
            const sx = (i * 191 + 7)  % W;
            const sy = (i * 97  + 13) % (chaoY * 0.75);
            const br = Math.abs(Math.sin(Date.now() * 0.0008 + i)) * 0.7 + 0.3;
            ctx.globalAlpha = br * 0.6;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Lua com auréola
        const luaX = W * 0.82, luaY = H * 0.14;
        const gradLua = ctx.createRadialGradient(luaX, luaY, 0, luaX, luaY, 60);
        gradLua.addColorStop(0,   "rgba(255,240,180,1)");
        gradLua.addColorStop(0.35,"rgba(255,225,120,0.7)");
        gradLua.addColorStop(0.7, "rgba(255,200,80,0.2)");
        gradLua.addColorStop(1,   "rgba(255,200,80,0)");
        ctx.fillStyle = gradLua;
        ctx.beginPath(); ctx.arc(luaX, luaY, 60, 0, Math.PI * 2); ctx.fill();

        // Montanhas
        ctx.fillStyle = "rgba(15,8,40,0.92)";
        ctx.beginPath();
        ctx.moveTo(0, chaoY);
        const pts = [0,0,0.12,0.20,0.22,0.08,0.35,0.26,0.5,0.06,0.62,0.24,0.75,0.10,0.88,0.22,1.0,0];
        for (let i = 0; i < pts.length; i += 2) {
            ctx.lineTo(W * pts[i], chaoY - H * 0.30 * pts[i+1]);
        }
        ctx.lineTo(W, chaoY); ctx.closePath(); ctx.fill();
    }

    // ══ CHÃO ══
    if (assets.chao) {
        // Tenta pattern para repetir
        const p = obterChaoPattern();
        if (p) {
            ctx.save();
            ctx.translate(0, chaoY);
            ctx.fillStyle = p;
            ctx.fillRect(0, 0, W, chaoH);
            ctx.restore();
        } else {
            // Fallback: estica a imagem
            const img = assets.chao;
            const escX = W / img.naturalWidth;
            const dw   = img.naturalWidth  * escX;
            const dh   = img.naturalHeight * escX;
            ctx.drawImage(img, 0, chaoY, dw, Math.max(dh, chaoH));
        }
    } else {
        // Fallback — chão gradiente roxa escuro
        const gradChao = ctx.createLinearGradient(0, chaoY, 0, H);
        gradChao.addColorStop(0,   "#1c0d40");
        gradChao.addColorStop(0.4, "#120830");
        gradChao.addColorStop(1,   "#090520");
        ctx.fillStyle = gradChao;
        ctx.fillRect(0, chaoY, W, chaoH);

        // Linha de glow no chão
        const gradLinha = ctx.createLinearGradient(0, 0, W, 0);
        gradLinha.addColorStop(0,   "rgba(100,50,220,0)");
        gradLinha.addColorStop(0.3, "rgba(160,80,255,0.55)");
        gradLinha.addColorStop(0.7, "rgba(160,80,255,0.55)");
        gradLinha.addColorStop(1,   "rgba(100,50,220,0)");
        ctx.strokeStyle = gradLinha;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, chaoY); ctx.lineTo(W, chaoY); ctx.stroke();
    }

    // Sombra de transição céu→chão (sempre, para suavizar)
    const gradSombra = ctx.createLinearGradient(0, chaoY - 30, 0, chaoY + 20);
    gradSombra.addColorStop(0, "rgba(0,0,0,0)");
    gradSombra.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = gradSombra;
    ctx.fillRect(0, chaoY - 30, W, 50);
}

// ════════════════════════════════════════
//  PERSONAGEM — Santa Teresinha (TT2 style)
//  • Fica no CHÃO (72% da tela)
//  • Costas para o viewer, olhando o monstro
//  • Animação de conjurar ao clicar
// ════════════════════════════════════════
const pb = {
    get x()  { return canvas.width  * 0.20; },
    get y()  { return canvas.height * 0.72; },   // TOPO do chão
    atacando:  0,
    durAtaque: 30,
    frame:     0,
    tempo:     0,
    totalFrames: 8
};

function dispararAtaquePersonagem() { pb.atacando = pb.durAtaque; }

function atualizarPB() {
    pb.tempo++;
    // Avança frame a cada 5 ticks (~12fps num loop de 60fps)
    if (pb.tempo >= 5) {
        pb.tempo = 0;
        pb.frame = (pb.frame + 1) % pb.totalFrames;
    }
}

function desenharPB() {
    const px = pb.x;
    const py = pb.y;           // base do personagem = nível do chão

    // Empurra levemente para frente ao atacar
    const offX = pb.atacando > 0
        ? Math.sin((pb.atacando / pb.durAtaque) * Math.PI) * 18
        : 0;
    if (pb.atacando > 0) pb.atacando--;

    const img  = assets.santa[pb.frame];
    const ALTO = canvas.height * 0.28;   // altura do sprite = 28% da tela

    if (img && img.complete && img.naturalWidth) {
        const lar  = ALTO * (img.naturalWidth / img.naturalHeight);

        // sombra elíptica
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.30)";
        ctx.beginPath();
        ctx.ellipse(px + offX, py + 4, lar * 0.38, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // sprite (de costas = flipado horizontalmente para olhar à direita)
        ctx.save();
        ctx.translate(px + offX + lar / 2, py - ALTO);
        ctx.scale(-1, 1);                  // flip → de costas para o viewer
        ctx.drawImage(img, 0, 0, lar, ALTO);
        ctx.restore();

    } else {
        // Fallback pixel-art placeholder
        const r = ALTO * 0.18;
        ctx.save();
        ctx.shadowBlur  = 20;
        ctx.shadowColor = "rgba(220,160,255,0.7)";
        ctx.fillStyle   = "#c084fc";
        ctx.beginPath(); ctx.arc(px + offX, py - ALTO * 0.6, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(px + offX - r * 0.7, py - ALTO * 0.4, r * 1.4, ALTO * 0.35);
        ctx.font = `${r * 1.3}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🌸", px + offX, py - ALTO * 0.62);
        ctx.restore();
    }
}

// ════════════════════════════════════════
//  MONSTRO — Emoji grande no centro-direita
//  • Fica em frente ao personagem
//  • Nível do chão alinhado
// ════════════════════════════════════════
const mb = {
    get x() { return canvas.width  * 0.65; },
    get y() { return canvas.height * 0.56; }
};

function emojiMonstroAtual() {
    const idx  = tipoMonstroIdx(estagio);
    const tipo = tiposMonstros[idx];
    const pct  = inimigo.maxHp > 0 ? inimigo.hp / inimigo.maxHp : 1;
    if (hitState.flash > 0) return tipo.emojis.dor;
    if (pct < 0.2)          return tipo.emojis.medo;
    if (pct < 0.5)          return tipo.emojis.raiva;
    return tipo.emojis.normal;
}

function desenharMonstro() {
    if (hitState.flash > 0) hitState.flash--;
    let ox = 0, oy = 0;
    if (hitState.tremendo > 0) {
        hitState.tremendo--;
        ox = (Math.random() - 0.5) * 18;
        oy = (Math.random() - 0.5) * 10;
    }

    const pct = Math.max(0.05, inimigo.maxHp > 0 ? inimigo.hp / inimigo.maxHp : 1);
    // Tamanho baseado no HP restante (diminui levemente ao morrer)
    const tam = canvas.height * (0.22 + pct * 0.06);
    const mx  = mb.x + ox, my = mb.y + oy;

    ctx.save();

    // flash vermelho ao tomar dano
    if (hitState.flash > 0) {
        ctx.filter      = "sepia(1) saturate(20) hue-rotate(300deg)";
        ctx.globalAlpha = 0.85 + hitState.flash * 0.015;
    }

    // glow pulsante
    ctx.shadowBlur  = 32 + Math.sin(Date.now() * 0.004) * 14;
    ctx.shadowColor = pct < 0.25 ? "rgba(255,220,0,0.9)" : "rgba(255,50,50,0.75)";

    ctx.font = `${tam}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiMonstroAtual(), mx, my);

    ctx.restore();

    // sombra no chão
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(mb.x, canvas.height * 0.73, tam * 0.35, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ════════════════════════════════════════
//  FLORES DO CÉU (flutua e ataca)
// ════════════════════════════════════════
let flores = [], floresAtaque = [];
const QTD_FLORES_CEU = 12;

function inicializarFlores() {
    flores = [];
    for (let i = 0; i < QTD_FLORES_CEU; i++) flores.push(criarFlorCeu(true));
    floresAtaque = [];
}

function criarFlorCeu(randY = false) {
    return {
        x:    Math.random() * canvas.width * 0.88,
        y:    randY ? Math.random() * canvas.height * 0.52 : -40,
        vy:   0.22 + Math.random() * 0.35,
        vx:   (Math.random() - 0.5) * 0.35,
        size: 18 + Math.random() * 16,
        rot:  Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.018,
        fase: Math.random() * Math.PI * 2,
        alpha:0.4 + Math.random() * 0.4
    };
}

function atualizarFloresCeu() {
    flores.forEach(f => {
        f.y   += f.vy;
        f.x   += Math.sin(Date.now() * 0.001 + f.fase) * 0.3;
        f.rot += f.vRot;
        if (f.y > canvas.height * 0.52) {
            f.y = -40;
            f.x = Math.random() * canvas.width * 0.88;
        }
    });
}

function desenharFloresCeu() {
    flores.forEach(f => {
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = `${f.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🌹", 0, 0);
        ctx.restore();
    });
}

function dispararFlor() {
    const qtd = Math.min(1 + Math.floor(upgrades.rosa.nivel / 3), 6);
    for (let i = 0; i < qtd; i++) {
        const idx = Math.floor(Math.random() * flores.length);
        const fo  = flores[idx];
        flores[idx] = criarFlorCeu(false);

        const tx   = mb.x + (Math.random() - 0.5) * 55;
        const ty   = mb.y + (Math.random() - 0.5) * 45;
        const dist = Math.hypot(tx - fo.x, ty - fo.y);
        const spd  = 7 + Math.random() * 4;
        const ang  = Math.atan2(ty - fo.y, tx - fo.x);

        floresAtaque.push({
            x: fo.x, y: fo.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            tx, ty,
            size: 18 + Math.random() * 10,
            rot:  Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.3,
            vida: Math.ceil(dist / spd) + 6,
            acertou: false
        });
    }
}

function atualizarFloresAtaque() {
    floresAtaque.forEach(f => {
        f.x += f.vx; f.y += f.vy;
        f.rot += f.vRot; f.vida--;
        if (!f.acertou && Math.hypot(f.x - f.tx, f.y - f.ty) < 30) {
            f.acertou = true; f.vida = 0;
            for (let p = 0; p < 7; p++) criarParticula(f.x, f.y);
        }
    });
    floresAtaque = floresAtaque.filter(f => f.vida > 0);
}

function desenharFloresAtaque() {
    floresAtaque.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.vida / 12);
        ctx.translate(f.x, f.y); ctx.rotate(f.rot);
        ctx.font = `${f.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🌹", 0, 0);
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
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        vida: 22 + Math.random() * 14,
        size: 5 + Math.random() * 8,
        cor: `hsl(${325 + Math.random() * 50},90%,65%)`
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
        ctx.fillStyle = p.cor;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  MOEDAS CAINDO
// ════════════════════════════════════════
let moedasAnim = [];
function criarMoedaCaindo() {
    moedasAnim.push({
        x: mb.x + (Math.random() - 0.5) * 90,
        y: mb.y,
        vy: -(3.5 + Math.random() * 2.5),
        vx: (Math.random() - 0.5) * 2.5,
        vida: 65,
        size: 20 + Math.random() * 10
    });
}
function atualizarMoedas() {
    moedasAnim.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.22; m.vida--; });
    moedasAnim = moedasAnim.filter(m => m.vida > 0);
}
function desenharMoedas() {
    moedasAnim.forEach(m => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, m.vida / 18);
        ctx.font = `${m.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🪙", m.x, m.y);
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  TEXTOS FLUTUANTES
// ════════════════════════════════════════
function criarTexto(valor, tipo) {
    textos.push({
        x: mb.x + (Math.random() - 0.5) * 90,
        y: mb.y - 50,
        valor, tipo, vida: 75
    });
}

function desenharTextos() {
    textos.forEach(t => {
        const alpha = Math.min(1, t.vida / 20);
        ctx.save();
        ctx.globalAlpha = alpha;
        let cor = "#ffffff", tam = 19;
        if (t.tipo === "levelup") { cor = "#ffd700"; tam = 24; }
        else if (t.tipo === "dps") { cor = "#aaffaa"; tam = 13; }
        else if (t.tipo === "click") { cor = "#ff9de2"; tam = 20; }
        ctx.font = `bold ${tam}px 'Nunito', sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.lineWidth = 4;
        ctx.strokeText(t.valor, t.x, t.y);
        ctx.fillStyle = cor;
        ctx.fillText(t.valor, t.x, t.y);
        ctx.restore();
        t.y -= 1.7; t.vida--;
    });
    textos = textos.filter(t => t.vida > 0);
}

// ════════════════════════════════════════
//  LOOP PRINCIPAL DE DESENHO
// ════════════════════════════════════════
window.desenharBatalha = function () {
    desenharFundoBatalha();
    atualizarFloresCeu();    desenharFloresCeu();
    atualizarFloresAtaque(); desenharFloresAtaque();
    atualizarParticulas();   desenharParticulas();
    atualizarMoedas();       desenharMoedas();
    atualizarPB();           desenharPB();
    desenharMonstro();
    desenharTextos();
};
