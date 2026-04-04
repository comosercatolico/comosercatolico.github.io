// ═══════════════════════════════════════
//  GAME-UI.JS
//  UI: modais, abas, upgrades, invocação, HUDs
// ═══════════════════════════════════════

// ── Formatador de números ──
function formatarNum(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
    if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
    if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
    if (n >= 1e3)  return (n / 1e3).toFixed(1)  + "K";
    return Math.floor(n).toString();
}

// ── Navegação geral ──
function abrirConfig()   { document.getElementById("janelaConfig").style.display = "flex"; }
function fecharConfig()  { document.getElementById("janelaConfig").style.display = "none"; }
function voltarSite()    { window.location.href = "index.html"; }
function fecharModal(id) { document.getElementById(id).style.display = "none"; }

function fecharSeForaModal(e, id) {
    if (e.target.id === id) fecharModal(id);
}

function abrirModalInvocar() { document.getElementById("modalInvocar").style.display = "flex"; }
function abrirModalEquipar() {
    atualizarListaEquipar();
    document.getElementById("modalEquipar").style.display = "flex";
}

// ── Energia (decorativa) ──
let energia = { atual: 100, max: 100 };
setInterval(() => {
    if (energia.atual < energia.max) energia.atual = Math.min(energia.max, energia.atual + 1);
    const el = document.getElementById("hudEnergiaVal");
    if (el) el.innerText = energia.atual + "/" + energia.max;
}, 30000);

// ── Atualizar HUD Lobby ──
function atualizarHUDLobby() {
    const m = document.getElementById("hudMoedaVal");
    const g = document.getElementById("hudGemaVal");
    if (m) m.innerText = formatarNum(moeda);
    if (g) g.innerText = formatarNum(gema);
}

// ── Atualizar UI Batalha ──
function atualizarUIBatalha() {
    if (!emBatalha) return;

    // HP barra
    const hp  = Math.max(0, inimigo.hp);
    const pct = (hp / inimigo.maxHp) * 100;
    const bar = document.getElementById("hpInimigo");
    if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + "%";

    const nom = document.getElementById("nomeInimigo");
    if (nom) nom.innerText = inimigo.nome;

    const hpN = document.getElementById("hpNumero");
    if (hpN) hpN.innerText = formatarNum(hp) + " / " + formatarNum(inimigo.maxHp);

    const estN = document.getElementById("estagioNum");
    if (estN) estN.innerText = estagio;

    const estNome = document.getElementById("estagioNome");
    if (estNome) estNome.innerText = nomeStageName(estagio);

    const mc = document.getElementById("moedaCentroVal");
    if (mc) mc.innerText = formatarNum(moeda);

    const dtu = document.getElementById("danoTaqueUI");
    if (dtu) dtu.innerText = "👆 " + formatarNum(calcDanoClick()) + " Dano de Toque";

    const mu = document.getElementById("moedaUIBatalha");
    if (mu) mu.innerText = "🪙 " + formatarNum(moeda);

    const gu = document.getElementById("gemaUIBatalha");
    if (gu) gu.innerText = "💎 " + formatarNum(gema);

    atualizarUIUpgrades();
    atualizarHUDLobby();
}

// ── Atualizar upgrades ──
function atualizarUIUpgrades() {
    const u = upgrades;
    const set = (id, txt) => { const e = document.getElementById(id); if(e) e.innerText = txt; };
    const btn = (id, txt, dis) => { const e = document.getElementById(id); if(e){ e.innerText = txt; e.disabled = dis; } };

    set("forcaDesc",  `Nv.${u.forca.nivel} · +${formatarNum(u.forca.dano)} dano/toque`);
    set("rosaDesc",   `Nv.${u.rosa.nivel}  · +${formatarNum(u.rosa.dano)} dano/toque`);
    set("velDesc",    `Nv.${u.velocidade.nivel} · x${u.velocidade.bonus} velocidade`);
    set("dpsDesc",    `Nv.${u.dps.nivel}  · +${formatarNum(u.dps.valor)} DPS`);

    btn("btnForca",      `🪙 ${formatarNum(u.forca.custo)}`,      moeda < u.forca.custo);
    btn("btnRosa",       `🪙 ${formatarNum(u.rosa.custo)}`,       moeda < u.rosa.custo);
    btn("btnVelocidade", `🪙 ${formatarNum(u.velocidade.custo)}`, moeda < u.velocidade.custo);
    btn("btnDps",        `🪙 ${formatarNum(u.dps.custo)}`,        moeda < u.dps.custo);
}

// ── Minimizar painel ──
let painelMin = false;
function togglePainel() {
    painelMin = !painelMin;
    const c = document.getElementById("abaConteudo");
    const b = document.getElementById("btnMinimizar");
    const r = document.getElementById("abaRodape");
    if (c) c.classList.toggle("minimizado", painelMin);
    if (b) b.innerText = painelMin ? "▲" : "▼";
    if (r) r.style.display = painelMin ? "none" : "flex";
}

// ── Abas da batalha ──
function abrirAba(nome, btn) {
    ["abaUpgrades","abaHerois","abaArmas","abaInvocacao"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    const alvo = document.getElementById("aba" + nome.charAt(0).toUpperCase() + nome.slice(1));
    if (alvo) alvo.style.display = "block";

    document.querySelectorAll(".abaRodapeBtn").forEach(b => b.classList.remove("ativa"));
    if (btn) btn.classList.add("ativa");
}

// ═══════════════════════════════════════
//  INVOCAÇÃO (GACHA)
// ═══════════════════════════════════════
const poolHerois = [
    { nome:"Anjo Gabriel",   raridade:"Raro",    emoji:"😇", arma:"Espada de Luz" },
    { nome:"São Francisco",  raridade:"Comum",   emoji:"🕊",  arma:"Cajado Sagrado" },
    { nome:"São José",       raridade:"Comum",   emoji:"⚒",   arma:"Martelo Bento" },
    { nome:"Santa Cecília",  raridade:"Épico",   emoji:"🎵",  arma:"Harpa Celestial" },
    { nome:"São Miguel",     raridade:"Lendário",emoji:"⚔",   arma:"Lança Divina" },
    { nome:"Santa Luzia",    raridade:"Raro",    emoji:"👁",   arma:"Vela da Graça" },
    { nome:"Santo Antônio",  raridade:"Raro",    emoji:"📖",  arma:"Livro Sagrado" },
    { nome:"São Bento",      raridade:"Épico",   emoji:"✝",   arma:"Cruz de São Bento" }
];

const poolArmas = [
    { nome:"Rosas Sagradas",      raridade:"Comum",   emoji:"🌹", dano: 50 },
    { nome:"Lírios do Céu",       raridade:"Raro",    emoji:"🌸", dano: 120 },
    { nome:"Coroa de Espinhos",   raridade:"Épico",   emoji:"👑", dano: 300 },
    { nome:"Pétala Divina",       raridade:"Lendário",emoji:"✨", dano: 800 },
    { nome:"Terço Abençoado",     raridade:"Raro",    emoji:"📿", dano: 110 },
    { nome:"Vela da Misericórdia",raridade:"Épico",   emoji:"🕯",  dano: 280 }
];

const corRar = {
    "Comum":    "#aaaaaa",
    "Raro":     "#4a8fff",
    "Épico":    "#b44dff",
    "Lendário": "#f5a623"
};

let heroisObtidos = [], equipamentosObtidos = [];

function invocar(qtd) {
    const custo = 100 * qtd;
    if (gema < custo) {
        setResultado("❌ Gemas insuficientes! Precisa de 💎" + custo, "#ff4444");
        return;
    }
    gema -= custo;

    const resultados = [];
    for (let i = 0; i < qtd; i++) {
        const r = Math.random();
        let pool;
        if      (r < 0.01) pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Lendário");
        else if (r < 0.05) pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Épico");
        else if (r < 0.25) pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Raro");
        else               pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Comum");
        resultados.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    resultados.forEach(r => {
        if (r.arma && !r.dano) heroisObtidos.push(r);
        else                   equipamentosObtidos.push(r);
    });

    const lend = resultados.filter(r => r.raridade === "Lendário").length;
    const epic = resultados.filter(r => r.raridade === "Épico").length;
    const primeiroItem = resultados[0];
    const txt = qtd === 1
        ? `${primeiroItem.emoji} ${primeiroItem.nome} (${primeiroItem.raridade})!`
        : `✨ ${qtd} invocações! Lendários: ${lend} · Épicos: ${epic}`;
    const cor = lend > 0 ? "#f5a623" : epic > 0 ? "#b44dff" : "#eeddff";

    setResultado(txt, cor);
    atualizarListaInvocacao();
    atualizarListaHeroisBatalha();
    atualizarUIBatalha();
    atualizarHUDLobby();
}

function setResultado(txt, cor) {
    ["invocarResultado","invocarResultado2"].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerText = txt; el.style.color = cor; el.style.borderLeftColor = cor; }
    });
}

function itemTagHTML(item) {
    const c = corRar[item.raridade] || "#aaa";
    const extra = item.dano ? ` +${item.dano}` : "";
    return `<span class="itemTag" style="border-color:${c};color:${c}">${item.emoji} ${item.nome}${extra}</span>`;
}

function atualizarListaInvocacao() {
    ["listaHerois"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = heroisObtidos.map(itemTagHTML).join("");
    });
    ["listaEquipamentos"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = equipamentosObtidos.map(itemTagHTML).join("");
    });
}

function atualizarListaHeroisBatalha() {
    const el = document.getElementById("listaHeroisBatalha2");
    if (el) el.innerHTML = [...heroisObtidos, ...equipamentosObtidos].map(itemTagHTML).join("");
}

function atualizarListaEquipar() {
    const el = document.getElementById("listaEquipamentosEquipar");
    if (!el) return;
    if (equipamentosObtidos.length === 0) {
        el.innerHTML = "<p class='dica'>Nenhuma arma obtida ainda. Invoque para obter!</p>";
        return;
    }
    el.innerHTML = equipamentosObtidos.map(a => `
        <div class="upgradeItem" style="margin-bottom:6px;">
            <div class="upIcone">${a.emoji}</div>
            <div class="upInfo">
                <span class="upNome" style="color:${corRar[a.raridade]}">${a.nome}</span>
                <span class="upDesc">${a.raridade} · +${a.dano} dano</span>
            </div>
            <button class="btnUp" onclick="fecharModal('modalEquipar')">Equipar</button>
        </div>
    `).join("");
}

// ── Armas na aba batalha ──
function atualizarListaArmasBatalha() {
    const el = document.getElementById("listaArmasBatalha");
    if (!el) return;
    if (equipamentosObtidos.length === 0) {
        el.innerHTML = "<p class='dica'>Nenhuma arma extra ainda. Invoque para obter!</p>";
        return;
    }
    el.innerHTML = equipamentosObtidos.map(a => itemTagHTML(a)).join("");
}


