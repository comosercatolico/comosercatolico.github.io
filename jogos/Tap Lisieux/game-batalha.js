// ═══════════════════════════════════════
//  GAME-BATALHA.JS
//  Lógica + renderização da batalha (estilo Tap Titans 2)
// ═══════════════════════════════════════

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

// ── Nomes de estágio (tema católico vs trevas) ──
const nomesEstagio = [
    "Jardim das Sombras","Cripta Maldita","Floresta Corrompida",
    "Vale das Trevas","Torre do Mal","Abismo Profundo",
    "Santuário Profanado","Catedral Sombria","Portal Infernal","Domínio do Caos"
];

const tiposMonstros = [
    { nome:"Demônio",         emojis:{ normal:"😈", dor:"😖", medo:"😱", raiva:"👿" } },
    { nome:"Espírito Maligno",emojis:{ normal:"👻", dor:"😵", medo:"😨", raiva:"💢" } },
    { nome:"Sombra Corrompida",emojis:{ normal:"🕷", dor:"💀", medo:"😰", raiva:"🕷" } },
    { nome:"Chefe das Trevas",emojis:{ normal:"💀", dor:"😣", medo:"😱", raiva:"😡" } },
    { nome:"Anjo Caído",      emojis:{ normal:"😤", dor:"🥴", medo:"😰", raiva:"🔥" } }
];

const falasMonstros = {
    "Demônio":         ["Você é uma inútil mesmo!","Nem suas orações te salvam!","Que fraquinha!","Vai chorar pro seu Deus?","Isso é tudo que você tem?"],
    "Espírito Maligno":["Florzinhas? Ridículo!","Desista, santinha!","Sua fé não vale nada!","Nunca vai me derrotar!"],
    "Sombra Corrompida":["A escuridão vence a luz!","Suas rosas não têm poder aqui!","Corre enquanto pode!"],
    "Chefe das Trevas":["Eu sou eterno!","A santa mais fraca que já enfrentei!","Sua luz está se apagando...","Patética!"],
    "Anjo Caído":      ["Caí por escolha!","O Paraíso me abandonou!","Agora sirvo a mim mesmo!","Você não pode me redimir!"]
};

function tipoMonstroIdx(e) {
    if (e % 10 === 0) return 3; // Chefe das Trevas
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
    const idx    = tipoMonstroIdx(e);
    const tipo   = tiposMonstros[idx];
    const chefe  = e % 10 === 0;
    inimigo.nome  = tipo.nome + (chefe ? " [CHEFE]" : "") + " Lv." + e;
    inimigo.nivel = e;
    inimigo.maxHp = Math.floor(80 * Math.pow(1.22, e));
    inimigo.hp    = inimigo.maxHp;
    inimigo.rMoeda= Math.floor(10 * Math.pow(1.15, e));
    inimigo.rGema = chefe ? Math.floor(5 + e / 5) : (Math.random() < 0.05 ? 1 : 0);
    setTimeout(() => exibirFala(tipo.nome), 900);
}

// ── Iniciar batalha ──
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

// ── Navegação de estágio ──
function irEstagioAnterior() { if (estagio > 1) { estagio--; configurarInimigo(estagio); atualizarUIBatalha(); } }
function irProximoEstagio()  { estagio++; configurarInimigo(estagio); atualizarUIBatalha(); }
function irParaChefe()       { estagio = Math.ceil(estagio / 10) * 10; configurarInimigo(estagio); atualizarUIBatalha(); }

// ── Dar dano ──
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
    // moedas animadas caindo
    for (let i = 0; i < Math.min(5, 1 + Math.floor(inimigo.rMoeda / 10)); i++) {
        criarMoedaCaindo();
    }
    ganharExp(5 + estagio * 2);
    estagio++;
    floresAtaque = [];
    configurarInimigo(estagio);
    atualizarUIBatalha();
    // desbloquear prestigiar
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
    // reset com bônus (placeholder)
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

// ── Click no canvas ──
canvas.addEventListener("click", () => {
    if (!emBatalha) return;
    darDano(calcDanoClick(), "click");
    dispararAtaquePersonagem();
    dispararFlor();
});

// ═══════════════════════════════════════
//  PERSONAGEM NA BATALHA
// ═══════════════════════════════════════
const pb = {
    get x() { return canvas.width  * 0.18; },
    get y() { return canvas.height * 0.72; },   // na linha do chão
    atacando: 0, durAtaque: 20,
    offX: 0, frame: 0, tempo: 0
};

function dispararAtaquePersonagem() { pb.atacando = pb.durAtaque; }

function atualizarPB() {
    pb.tempo++;
    if (pb.tempo > 7) { pb.tempo = 0; pb.frame = (pb.frame + 1) % (imagens.santaAnda.length || 9); }
    if (pb.atacando > 0) {
        pb.atacando--;
        pb.offX = Math.sin((pb.atacando / pb.durAtaque) * Math.PI) * 60;
    } else {
        pb.offX = 0;
    }
}

function desenharPB() {
    const img    = imagens.santaAnda[pb.frame];
    const escala = 1.6;
    const px     = pb.x + pb.offX;
    const py     = pb.y;

    // sombra elíptica no chão
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    const sw = img && img.naturalWidth ? img.width * escala * 0.4 : 32;
    ctx.ellipse(px, py + 4, sw, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (img && img.complete && img.naturalWidth !== 0) {
        const larg = img.width  * escala;
        const alt  = img.height * escala;
        ctx.drawImage(img, px - larg / 2, py - alt, larg, alt);
    } else {
        // fallback: círculo com inicial
        ctx.save();
        ctx.fillStyle = "#d4a8ff";
        ctx.beginPath(); ctx.arc(px, py - 30, 28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🌸", px, py - 30);
        ctx.restore();
    }
}

// ═══════════════════════════════════════
//  MONSTRO
// ═══════════════════════════════════════
const mb = {
    get x() { return canvas.width  * 0.65; },
    get y() { return canvas.height * 0.60; }
};

function emojiMonstroAtual() {
    const idx  = tipoMonstroIdx(estagio);
    const tipo = tiposMonstros[idx];
    const pct  = inimigo.hp / inimigo.maxHp;
    if (hitState.flash   > 0) return tipo.emojis.dor;
    if (pct < 0.2)            return tipo.emojis.medo;
    if (pct < 0.5)            return tipo.emojis.raiva;
    return tipo.emojis.normal;
}

function desenharMonstro() {
    if (hitState.flash    > 0) hitState.flash--;
    let ox = 0, oy = 0;
    if (hitState.tremendo > 0) { hitState.tremendo--; ox = (Math.random() - 0.5) * 16; oy = (Math.random() - 0.5) * 10; }

    const pct    = Math.max(0.05, inimigo.hp / inimigo.maxHp);
    const tam    = (canvas.height * 0.22) * (0.75 + pct * 0.25);
    const mx     = mb.x + ox, my = mb.y + oy;

    ctx.save();

    // flash de dano
    if (hitState.flash > 0) {
        ctx.filter = "sepia(1) saturate(15) hue-rotate(300deg)";
        ctx.globalAlpha = 0.85 + hitState.flash * 0.015;
    }

    // glow pulsante
    ctx.shadowBlur  = 28 + Math.sin(Date.now() * 0.004) * 12;
    ctx.shadowColor = pct < 0.2 ? "rgba(255,220,0,0.9)" : "rgba(255,60,60,0.75)";

    ctx.font = `${tam}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiMonstroAtual(), mx, my);

    // sombra no chão
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(mb.x, canvas.height * 0.73, tam * 0.38, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ═══════════════════════════════════════
//  FLORES CONJURADAS DO CÉU (estilo magia)
// ═══════════════════════════════════════
let flores = [], floresAtaque = [];
const QTD_FLORES_CEU = 10;

function inicializarFlores() {
    flores = [];
    for (let i = 0; i < QTD_FLORES_CEU; i++) flores.push(criarFlorCeu(true));
    floresAtaque = [];
}

function criarFlorCeu(randY = false) {
    return {
        x:   Math.random() * canvas.width * 0.9,
        y:   randY ? Math.random() * canvas.height * 0.5 : -40,
        vy:  0.25 + Math.random() * 0.4,
        vx:  (Math.random() - 0.5) * 0.4,
        size:20 + Math.random() * 16,
        rot: Math.random() * Math.PI * 2,
        vRot:(Math.random() - 0.5) * 0.02,
        fase:Math.random() * Math.PI * 2
    };
}

function atualizarFloresCeu() {
    flores.forEach(f => {
        f.y   += f.vy;
        f.x   += Math.sin(Date.now() * 0.001 + f.fase) * 0.35;
        f.rot += f.vRot;
        if (f.y > canvas.height * 0.5) { f.y = -40; f.x = Math.random() * canvas.width * 0.9; }
    });
}

function desenharFloresCeu() {
    flores.forEach(f => {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = `${f.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🌹", 0, 0);
        ctx.restore();
    });
}

function dispararFlor() {
    const idx = Math.floor(Math.random() * flores.length);
    const fo  = flores[idx];
    flores[idx] = criarFlorCeu(false);  // repõe no topo

    const qtd = Math.min(1 + Math.floor(upgrades.rosa.nivel / 3), 6);
    for (let i = 0; i < qtd; i++) {
        const ox = fo.x + (Math.random() - 0.5) * 60;
        const oy = fo.y + (Math.random() - 0.5) * 30;
        const tx = mb.x  + (Math.random() - 0.5) * 50;
        const ty = mb.y  + (Math.random() - 0.5) * 40;
        const dist = Math.hypot(tx - ox, ty - oy);
        const spd  = 7 + Math.random() * 4;
        const ang  = Math.atan2(ty - oy, tx - ox);
        floresAtaque.push({
            x: ox, y: oy,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            tx, ty,
            size: 18 + Math.random() * 10,
            rot:  Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.28,
            vida: Math.ceil(dist / spd) + 6,
            acertou: false
        });
    }
}

function atualizarFloresAtaque() {
    floresAtaque.forEach(f => {
        f.x += f.vx; f.y += f.vy; f.rot += f.vRot; f.vida--;
        if (!f.acertou && Math.hypot(f.x - f.tx, f.y - f.ty) < 30) {
            f.acertou = true; f.vida = 0;
            for (let p = 0; p < 6; p++) criarParticula(f.x, f.y);
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

// ═══════════════════════════════════════
//  PARTÍCULAS
// ═══════════════════════════════════════
let particulas = [];
function criarParticula(x, y) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 3.5;
    particulas.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        vida: 22 + Math.random() * 14,
        size: 5 + Math.random() * 8,
        cor: `hsl(${330 + Math.random() * 40},90%,65%)`
    });
}

function atualizarParticulas() {
    particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vida--; });
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

// ═══════════════════════════════════════
//  MOEDAS CAINDO (animação estilo TT2)
// ═══════════════════════════════════════
let moedasAnim = [];
function criarMoedaCaindo() {
    moedasAnim.push({
        x: mb.x + (Math.random() - 0.5) * 80,
        y: mb.y,
        vy: -(3 + Math.random() * 2),
        vx: (Math.random() - 0.5) * 2,
        vida: 60,
        size: 18 + Math.random() * 8
    });
}

function atualizarMoedas() {
    moedasAnim.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.2; m.vida--; });
    moedasAnim = moedasAnim.filter(m => m.vida > 0);
}

function desenharMoedas() {
    moedasAnim.forEach(m => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, m.vida / 15);
        ctx.font = `${m.size}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🪙", m.x, m.y);
        ctx.restore();
    });
}

// ═══════════════════════════════════════
//  TEXTOS FLUTUANTES
// ═══════════════════════════════════════
function criarTexto(valor, tipo) {
    textos.push({
        x: mb.x + (Math.random() - 0.5) * 80,
        y: mb.y - 40,
        valor, tipo, vida: 75
    });
}

function desenharTextos() {
    textos.forEach(t => {
        const alpha = Math.min(1, t.vida / 20);
        ctx.save();
        ctx.globalAlpha = alpha;
        let cor = "#fff", tam = 18;
        if (t.tipo === "levelup") { cor = "#ffd700"; tam = 22; }
        else if (t.tipo === "dps") { cor = "#aaffaa"; tam = 13; }
        ctx.font = `bold ${tam}px 'Nunito', sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 4;
        ctx.strokeText(t.valor, t.x, t.y);
        ctx.fillStyle = cor;
        ctx.fillText(t.valor, t.x, t.y);
        ctx.restore();
        t.y -= 1.6; t.vida--;
    });
    textos = textos.filter(t => t.vida > 0);
}

// ═══════════════════════════════════════
//  FUNDO DA BATALHA (estilo TT2)
//  Fundo horizontal: céu + chão + montanhas
// ═══════════════════════════════════════
function desenharFundoBatalha() {
    const W = canvas.width, H = canvas.height;
    const chaoY = H * 0.73;

    // ── Céu (degradê dia/noite dramático) ──
    const gradCeu = ctx.createLinearGradient(0, 0, 0, chaoY);
    gradCeu.addColorStop(0,   "#0a0618");
    gradCeu.addColorStop(0.35,"#130d3a");
    gradCeu.addColorStop(0.7, "#1e1060");
    gradCeu.addColorStop(1,   "#2a1878");
    ctx.fillStyle = gradCeu;
    ctx.fillRect(0, 0, W, chaoY);

    // ── Estrelas ──
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 80; i++) {
        const sx = (i * 191 + 7)  % W;
        const sy = (i * 97  + 13) % (chaoY * 0.7);
        const br = Math.abs(Math.sin(Date.now() * 0.0007 + i)) * 0.8 + 0.2;
        ctx.globalAlpha = br * 0.55;
        ctx.beginPath();
        ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Lua / auréola ──
    const luaX = W * 0.82, luaY = H * 0.15;
    const gradLua = ctx.createRadialGradient(luaX, luaY, 0, luaX, luaY, 55);
    gradLua.addColorStop(0,   "rgba(255,240,200,0.95)");
    gradLua.addColorStop(0.6, "rgba(255,220,120,0.4)");
    gradLua.addColorStop(1,   "rgba(255,200,80,0)");
    ctx.fillStyle = gradLua;
    ctx.beginPath(); ctx.arc(luaX, luaY, 55, 0, Math.PI * 2); ctx.fill();

    // ── Montanhas ao fundo ──
    ctx.fillStyle = "rgba(20,12,50,0.9)";
    ctx.beginPath();
    ctx.moveTo(0, chaoY);
    const montanhas = [0,0.12,0.2,0.1,0.28,0.05,0.38,0.18,0.5,0.04,0.6,0.22,0.72,0.08,0.82,0.20,0.92,0.06,1,0];
    for (let i = 0; i < montanhas.length; i += 2) {
        ctx.lineTo(W * montanhas[i], chaoY - H * 0.28 * montanhas[i+1] - H * 0.05);
    }
    ctx.lineTo(W, chaoY); ctx.closePath(); ctx.fill();

    // ── Chão (gramado/pedras) ──
    const gradChao = ctx.createLinearGradient(0, chaoY, 0, H);
    gradChao.addColorStop(0, "#1a0a3a");
    gradChao.addColorStop(0.3,"#150830");
    gradChao.addColorStop(1, "#0a0520");
    ctx.fillStyle = gradChao;
    ctx.fillRect(0, chaoY, W, H - chaoY);

    // linha de glow no chão
    const gradLinha = ctx.createLinearGradient(0, 0, W, 0);
    gradLinha.addColorStop(0,   "rgba(100,60,200,0)");
    gradLinha.addColorStop(0.3, "rgba(160,80,255,0.5)");
    gradLinha.addColorStop(0.7, "rgba(160,80,255,0.5)");
    gradLinha.addColorStop(1,   "rgba(100,60,200,0)");
    ctx.strokeStyle = gradLinha;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, chaoY); ctx.lineTo(W, chaoY); ctx.stroke();

    // ── Pedras decorativas no chão ──
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 6; i++) {
        const px = (i * 193 + 50) % W;
        const pw = 30 + (i * 37) % 60;
        const ph = 8  + (i * 19) % 14;
        ctx.beginPath();
        ctx.ellipse(px, chaoY + ph, pw * 0.5, ph * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ── Função principal de desenho da batalha ──
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
