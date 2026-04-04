// =====================================
// UTILITÁRIOS
// =====================================
function formatarNum(n){
    if(n >= 1e9)  return (n/1e9).toFixed(1)  + "B";
    if(n >= 1e6)  return (n/1e6).toFixed(1)  + "M";
    if(n >= 1e3)  return (n/1e3).toFixed(1)  + "K";
    return Math.floor(n).toString();
}

// =====================================
// NAVEGAÇÃO GERAL
// =====================================
function abrirConfig(){ document.getElementById("janelaConfig").style.display = "block"; }
function fecharConfig(){ document.getElementById("janelaConfig").style.display = "none"; }
function voltarSite(){ window.location.href = "index.html"; }

function sairBatalha(){
    emBatalha = false;
    document.getElementById("uiBatalha").style.display = "none";
    document.getElementById("btnBatalhar").style.display = "block";
}

// =====================================
// CONFIG BÁSICA
// =====================================
const TILE       = 32;
const MAP_WIDTH  = 100;
const MAP_HEIGHT = 100;

const canvas = document.getElementById("game");
const ctx    = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// =====================================
// CÂMERA
// =====================================
let camera = {
    x: MAP_WIDTH  * TILE / 2 - window.innerWidth  / 2,
    y: MAP_HEIGHT * TILE / 2 - window.innerHeight / 2
};

function resizeCanvas(){
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
camera.x = MAP_WIDTH  * TILE / 2 - canvas.width  / 2;
camera.y = MAP_HEIGHT * TILE / 2 - canvas.height / 2;

// =====================================
// CÂMERA ARRASTÁVEL
// =====================================
let dragging = false, lastX = 0, lastY = 0;

canvas.onmousedown = (e)=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; };
canvas.onmouseup   = ()=>{ dragging=false; };
canvas.onmouseleave= ()=>{ dragging=false; };
canvas.onmousemove = (e)=>{
    if(!dragging) return;
    camera.x -= e.clientX - lastX;
    camera.y -= e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
};

// =====================================
// IMAGENS
// =====================================
const imagens = {
    gramas: [],
    mesa: new Image(),
    cadeiraEsq: new Image(),
    cadeiraDir: new Image(),
    biblioteca: new Image(),
    estrada: new Image()
};
imagens.santaAnda = [];

let imagensParaCarregar = 0;
let imagensCarregadas   = 0;

function registrarImagem(img){
    imagensParaCarregar++;
    img.onload = ()=>{ imagensCarregadas++; };
}

for(let i=1;i<=5;i++){
    let img = new Image();
    registrarImagem(img);
    img.src = `tiles/chaop1/grama${i}.jpg`;
    imagens.gramas.push(img);
}
for(let i=1;i<=9;i++){
    let img = new Image();
    registrarImagem(img);
    img.src = `tiles/trzn/anda${i}.png`;
    imagens.santaAnda.push(img);
}

registrarImagem(imagens.mesa);
registrarImagem(imagens.cadeiraEsq);
registrarImagem(imagens.cadeiraDir);
registrarImagem(imagens.biblioteca);
registrarImagem(imagens.estrada);

imagens.estrada.src      = "tiles/chaop1/ti.png";
imagens.mesa.src         = "tiles/estruturas/mesa.png";
imagens.cadeiraEsq.src   = "tiles/estruturas/cadeira_esquerda.png";
imagens.cadeiraDir.src   = "tiles/estruturas/cadeira_direita.png";
imagens.biblioteca.src   = "tiles/estruturas/bb.png";

// =====================================
// MAPA
// =====================================
const mapaGrama = [];
const centroX   = Math.floor(MAP_WIDTH  / 2);
const centroY   = Math.floor(MAP_HEIGHT / 2);
const escolaY   = 12;
const larguraCam= 1;

for(let y=0;y<MAP_HEIGHT;y++){
    mapaGrama[y] = [];
    for(let x=0;x<MAP_WIDTH;x++){
        let tipo = 0;
        if(y>=centroY-larguraCam && y<=centroY+larguraCam) tipo=5;
        if(x>=centroX-larguraCam && x<=centroX+larguraCam) tipo=5;
        if(y>=escolaY-larguraCam && y<=escolaY+larguraCam) tipo=5;
        if(x>=centroX-larguraCam && x<=centroX+larguraCam &&
           y>=Math.min(escolaY,centroY) && y<=Math.max(escolaY,centroY)) tipo=5;
        mapaGrama[y][x]={ tipo, sombra: Math.random()*0.03 };
    }
}

// =====================================
// OBJETOS DO LOBBY
// =====================================
const centroTileX = 50;
const centroTileY = 50;

const objetos = [
    { tipo:"biblioteca", tileX:7,   tileY:10, escala:0.9,  layer:0 },
    { tipo:"cadeiraEsq", tileX:centroTileX-1.77, tileY:centroTileY-0.20, escala:0.22, layer:0 },
    { tipo:"cadeiraDir", tileX:centroTileX+1.77, tileY:centroTileY-0.20, escala:0.22, layer:0 },
    { tipo:"mesa",       tileX:centroTileX,      tileY:centroTileY,      escala:0.42, layer:1 }
];

// =====================================
// NPC SANTA (LOBBY)
// =====================================
const santa = {
    tileX:50, tileY:50,
    frame:0, tempo:0,
    velocidade:0.03,
    escala:0.28,
    dirX:1, dirY:0
};

function atualizarSanta(){
    santa.tempo++;
    if(santa.tempo > 8){ santa.tempo=0; santa.frame++; if(santa.frame>=imagens.santaAnda.length) santa.frame=0; }
    santa.tileX += santa.dirX * santa.velocidade;
    santa.tileY += santa.dirY * santa.velocidade;
    const cx=Math.round(santa.tileX), cy=Math.round(santa.tileY);
    if(Math.abs(santa.tileX-cx)<santa.velocidade && Math.abs(santa.tileY-cy)<santa.velocidade){
        santa.tileX=cx; santa.tileY=cy;
        const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        const possiveis=[];
        for(let d of dirs){
            const nx=cx+d.x, ny=cy+d.y;
            if(nx<0||ny<0||nx>=MAP_WIDTH||ny>=MAP_HEIGHT) continue;
            if(mapaGrama[ny][nx].tipo===5){
                if(d.x===-santa.dirX&&d.y===-santa.dirY) continue;
                possiveis.push(d);
            }
        }
        if(possiveis.length>0){
            const e=possiveis[Math.floor(Math.random()*possiveis.length)];
            santa.dirX=e.x; santa.dirY=e.y;
        }
    }
}

// =====================================
// DESENHAR LOBBY
// =====================================
function desenharChao(){
    const sX=Math.floor(camera.x/TILE), sY=Math.floor(camera.y/TILE);
    const vW=Math.ceil(canvas.width/TILE)+2, vH=Math.ceil(canvas.height/TILE)+2;
    for(let y=sY;y<sY+vH;y++){
        for(let x=sX;x<sX+vW;x++){
            if(x<0||y<0||x>=MAP_WIDTH||y>=MAP_HEIGHT) continue;
            const tile=mapaGrama[y][x];
            const img=(tile.tipo===5)?imagens.estrada:imagens.gramas[tile.tipo];
            const dX=x*TILE-camera.x, dY=y*TILE-camera.y;
            if(img&&img.complete&&img.naturalWidth!==0){
                ctx.drawImage(img,dX,dY,TILE,TILE);
                ctx.fillStyle=`rgba(0,0,0,${tile.sombra})`;
                ctx.fillRect(dX,dY,TILE,TILE);
            }else{
                ctx.fillStyle="#2ecc71";
                ctx.fillRect(dX,dY,TILE,TILE);
            }
        }
    }
}

function desenharObjetos(){
    objetos.sort((a,b)=>{ if(a.layer!==b.layer) return a.layer-b.layer; return (a.tileY+1)*TILE-(b.tileY+1)*TILE; });
    objetos.forEach(obj=>{
        const img=imagens[obj.tipo];
        if(!img.complete||img.naturalWidth===0) return;
        const larg=img.width*obj.escala, alt=img.height*obj.escala;
        const bX=obj.tileX*TILE+TILE/2, bY=obj.tileY*TILE+TILE;
        const dX=bX-larg/2-camera.x, dY=bY-alt-camera.y;
        ctx.fillStyle="rgba(0,0,0,0.25)";
        ctx.fillRect(bX-larg/4-camera.x,bY-camera.y-3,larg/2,5);
        ctx.drawImage(img,dX,dY,larg,alt);
    });
}

function desenharSanta(){
    const img=imagens.santaAnda[Math.floor(santa.frame)];
    if(!img||!img.complete||img.naturalWidth===0) return;
    const larg=img.width*santa.escala, alt=img.height*santa.escala;
    const bX=santa.tileX*TILE+TILE/2, bY=santa.tileY*TILE+TILE;
    const dX=bX-larg/2-camera.x, dY=bY-alt-camera.y;
    ctx.save();
    if(santa.dirX<0){ ctx.scale(-1,1); ctx.drawImage(img,-(dX+larg),dY,larg,alt); }
    else{ ctx.drawImage(img,dX,dY,larg,alt); }
    ctx.restore();
}

// =====================================
// SISTEMA DE MOEDAS SEPARADO
// =====================================
// moeda = cai dos monstros, gasta em upgrades
// gema  = moeda premium, gasta em invocação
let moeda = 0;
let gema  = 50; // começa com 50 de brinde

// =====================================
// UPGRADES DE SANTA TERESINHA
// =====================================
const upgrades = {
    forca: {
        nivel: 1,
        base: 5,
        multiplicador: 1.5,
        custoBase: 15,
        custoCrescimento: 1.6,
        get dano(){ return Math.floor(this.base * Math.pow(this.multiplicador, this.nivel-1)); },
        get custo(){ return Math.floor(this.custoBase * Math.pow(this.custoCrescimento, this.nivel-1)); }
    },
    rosa: {
        nivel: 1,
        base: 3,
        multiplicador: 1.4,
        custoBase: 20,
        custoCrescimento: 1.65,
        get dano(){ return Math.floor(this.base * Math.pow(this.multiplicador, this.nivel-1)); },
        get custo(){ return Math.floor(this.custoBase * Math.pow(this.custoCrescimento, this.nivel-1)); }
    },
    velocidade: {
        nivel: 1,
        base: 1,
        multiplicador: 1.1,
        custoBase: 30,
        custoCrescimento: 1.7,
        get bonus(){ return parseFloat((this.base * Math.pow(this.multiplicador, this.nivel-1)).toFixed(2)); },
        get custo(){ return Math.floor(this.custoBase * Math.pow(this.custoCrescimento, this.nivel-1)); }
    },
    dps: {
        nivel: 1,
        base: 2,
        multiplicador: 1.6,
        custoBase: 25,
        custoCrescimento: 1.7,
        get valor(){ return Math.floor(this.base * Math.pow(this.multiplicador, this.nivel-1)); },
        get custo(){ return Math.floor(this.custoBase * Math.pow(this.custoCrescimento, this.nivel-1)); }
    }
};

function calcularDanoClick(){
    return upgrades.forca.dano + upgrades.rosa.dano;
}
function calcularDps(){
    return upgrades.dps.valor;
}

function comprarUpgrade(tipo){
    const up = upgrades[tipo];
    if(moeda >= up.custo){
        moeda -= up.custo;
        up.nivel++;
        atualizarUIUpgrades();
        atualizarUIBatalha();
    }
}

function atualizarUIUpgrades(){
    const up = upgrades;

    document.getElementById("forcaAtualTxt").innerText    = `Nível ${up.forca.nivel} | +${formatarNum(up.forca.dano)} dano/click`;
    document.getElementById("rosaAtualTxt").innerText     = `Nível ${up.rosa.nivel}  | +${formatarNum(up.rosa.dano)} dano/click`;
    document.getElementById("velAtualTxt").innerText      = `Nível ${up.velocidade.nivel} | x${up.velocidade.bonus} velocidade`;
    document.getElementById("dpsAtualTxt").innerText      = `Nível ${up.dps.nivel}  | +${formatarNum(up.dps.valor)} DPS passivo`;

    const btnF = document.getElementById("btnForca");
    const btnR = document.getElementById("btnRosa");
    const btnV = document.getElementById("btnVelocidade");
    const btnD = document.getElementById("btnDps");

    btnF.innerText = `🪙 ${formatarNum(up.forca.custo)}`;
    btnR.innerText = `🪙 ${formatarNum(up.rosa.custo)}`;
    btnV.innerText = `🪙 ${formatarNum(up.velocidade.custo)}`;
    btnD.innerText = `🪙 ${formatarNum(up.dps.custo)}`;

    btnF.disabled = moeda < up.forca.custo;
    btnR.disabled = moeda < up.rosa.custo;
    btnV.disabled = moeda < up.velocidade.custo;
    btnD.disabled = moeda < up.dps.custo;
}

// =====================================
// ABAS
// =====================================
function abrirAba(nome){
    const paineis = document.querySelectorAll(".painelAba");
    paineis.forEach(p=>p.style.display="none");
    document.getElementById("painel"+nome.charAt(0).toUpperCase()+nome.slice(1)).style.display="block";
    document.querySelectorAll(".abaBtn").forEach(b=>b.classList.remove("ativa"));
    event.target.classList.add("ativa");
}

// =====================================
// SISTEMA DE INVOCAÇÃO
// =====================================
const poolHerois = [
    { nome:"Anjo Gabriel",  raridade:"Raro",   emoji:"😇", arma:"Espada de Luz" },
    { nome:"São Francisco", raridade:"Comum",  emoji:"🕊",  arma:"Cajado Sagrado" },
    { nome:"São José",      raridade:"Comum",  emoji:"⚒",   arma:"Martelo Bento" },
    { nome:"Santa Cecília", raridade:"Épico",  emoji:"🎵",  arma:"Harpa Celestial" },
    { nome:"São Miguel",    raridade:"Lendário",emoji:"⚔",  arma:"Lança Divina" },
    { nome:"Santa Luzia",   raridade:"Raro",   emoji:"👁",   arma:"Vela da Graça" }
];

const poolArmas = [
    { nome:"Rosas Sagradas", raridade:"Comum",   emoji:"🌹", dano:50 },
    { nome:"Lírios do Céu",  raridade:"Raro",    emoji:"🌸", dano:120 },
    { nome:"Coroa de Espinhos",raridade:"Épico", emoji:"👑", dano:300 },
    { nome:"Pétala Divina",  raridade:"Lendário",emoji:"✨", dano:800 }
];

let heroisObtidos      = [];
let equipamentosObtidos= [];

const corRaridade = {
    "Comum":    "#aaaaaa",
    "Raro":     "#4488ff",
    "Épico":    "#aa44ff",
    "Lendário": "#ffaa00"
};

function invocar(quantidade){
    const custoPorInvocacao = 100;
    const custoTotal = custoPorInvocacao * quantidade;

    if(gema < custoTotal){
        document.getElementById("invocarResultado").innerText =
            `❌ Gemas insuficientes! Precisa de 💎 ${custoTotal}`;
        return;
    }
    gema -= custoTotal;

    const resultados = [];
    for(let i=0;i<quantidade;i++){
        const roll = Math.random();
        if(roll < 0.01){
            // Lendário
            const pool = [...poolHerois.filter(h=>h.raridade==="Lendário"),
                          ...poolArmas.filter(a=>a.raridade==="Lendário")];
            resultados.push(pool[Math.floor(Math.random()*pool.length)]);
        } else if(roll < 0.05){
            const pool = [...poolHerois.filter(h=>h.raridade==="Épico"),
                          ...poolArmas.filter(a=>a.raridade==="Épico")];
            resultados.push(pool[Math.floor(Math.random()*pool.length)]);
        } else if(roll < 0.25){
            const pool = [...poolHerois.filter(h=>h.raridade==="Raro"),
                          ...poolArmas.filter(a=>a.raridade==="Raro")];
            resultados.push(pool[Math.floor(Math.random()*pool.length)]);
        } else {
            const pool = [...poolHerois.filter(h=>h.raridade==="Comum"),
                          ...poolArmas.filter(a=>a.raridade==="Comum")];
            resultados.push(pool[Math.floor(Math.random()*pool.length)]);
        }
    }

    // Separar heróis e armas
    resultados.forEach(r=>{
        if(r.arma && !r.dano){
            // é herói
            heroisObtidos.push(r);
        } else {
            equipamentosObtidos.push(r);
        }
    });

    // Mostrar resultado
    if(quantidade === 1){
        const r = resultados[0];
        document.getElementById("invocarResultado").innerText =
            `${r.emoji} ${r.nome} (${r.raridade})!`;
        document.getElementById("invocarResultado").style.color = corRaridade[r.raridade];
    } else {
        const lend = resultados.filter(r=>r.raridade==="Lendário").length;
        const epic = resultados.filter(r=>r.raridade==="Épico").length;
        document.getElementById("invocarResultado").innerText =
            `✨ ${quantidade} invocações! Lendários: ${lend} | Épicos: ${epic}`;
        document.getElementById("invocarResultado").style.color = lend>0 ? "#ffaa00" : epic>0 ? "#aa44ff" : "#fff";
    }

    atualizarUIInvocacao();
    atualizarUIBatalha();
}

function atualizarUIInvocacao(){
    const listaH = document.getElementById("listaHerois");
    const listaE = document.getElementById("listaEquipamentos");

    listaH.innerHTML = heroisObtidos.map(h=>
        `<span class="heroiTag" style="border-color:${corRaridade[h.raridade]};color:${corRaridade[h.raridade]}">${h.emoji} ${h.nome}</span>`
    ).join("");

    listaE.innerHTML = equipamentosObtidos.map(e=>
        `<span class="armaTag" style="border-color:${corRaridade[e.raridade]};color:${corRaridade[e.raridade]}">${e.emoji} ${e.nome} (+${e.dano})</span>`
    ).join("");
}

// =====================================
// FALAS PROVOCADORAS DOS MONSTROS
// =====================================
const falasPorMonstro = {
    "Demônio": [
        "Você é uma inútil mesmo!",
        "Achei que seria mais difícil te enfrentar...",
        "Nem suas orações te salvam agora!",
        "Vai chorar pro seu Deus?",
        "Que fraquinha, hahahaha!"
    ],
    "Espírito Maligno": [
        "Sua fé não vale nada aqui!",
        "Florzinhas? Isso é sua arma? Ridículo!",
        "Desista, santinha!",
        "Nunca vai me derrotar!"
    ],
    "Sombra Corrompida": [
        "A escuridão sempre vence a luz!",
        "Suas rosas não têm poder aqui!",
        "Você tremeu, eu vi!",
        "Corre enquanto pode!"
    ],
    "Chefe das Trevas": [
        "Eu sou eterno. Você é apenas um grão de poeira!",
        "Tanta inocência... é patético!",
        "A santa mais fraca que já enfrentei!",
        "Sua luz está se apagando, sinto o cheiro!"
    ]
};

let timerFala = null;
let falaAtiva = false;

function exibirFalaProvocadora(nomeMonstro){
    const falas = falasPorMonstro[nomeMonstro] || falasPorMonstro["Demônio"];
    const fala  = falas[Math.floor(Math.random()*falas.length)];
    const el    = document.getElementById("falaInimigo");

    el.innerText = `"${fala}"`;
    el.classList.add("visivel");
    falaAtiva = true;

    if(timerFala) clearTimeout(timerFala);
    timerFala = setTimeout(()=>{
        el.classList.remove("visivel");
        falaAtiva = false;
    }, 3500);
}

// =====================================
// ROSAS VOANDO (PROJÉTEIS VISUAIS)
// =====================================
let rosas = []; // lista de projéteis ativos

// posição do monstro na tela (centro)
function posMonstro(){
    return { x: canvas.width/2, y: canvas.height * 0.38 };
}

function criarRosa(){
    // origem: posição visual de Santa na tela de batalha (canto inferior esquerdo)
    const oriX = canvas.width  * 0.12 + Math.random()*30 - 15;
    const oriY = canvas.height * 0.72;

    const { x: tx, y: ty } = posMonstro();

    // dispersão leve
    const angulo = Math.atan2(ty-oriY, tx-oriX);
    const dispersao = (Math.random()-0.5)*0.3;

    rosas.push({
        x: oriX, y: oriY,
        vx: Math.cos(angulo+dispersao)*7,
        vy: Math.sin(angulo+dispersao)*7,
        tamanho: 18 + Math.random()*10,
        vida: 120,
        maxVida: 120,
        rotacao: Math.random()*Math.PI*2,
        velRot: (Math.random()-0.5)*0.3
    });
}

function atualizarRosas(){
    const { x: tx, y: ty } = posMonstro();

    rosas.forEach(r=>{
        r.x += r.vx;
        r.y += r.vy;
        r.rotacao += r.velRot;
        r.vida--;

        // Se chegou perto do monstro, explodir
        const dist = Math.hypot(r.x-tx, r.y-ty);
        if(dist < 40) r.vida = 0;
    });
    rosas = rosas.filter(r=>r.vida>0);
}

function desenharRosas(){
    rosas.forEach(r=>{
        const alpha = Math.min(1, r.vida/20);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(r.x, r.y);
        ctx.rotate(r.rotacao);
        ctx.font = `${r.tamanho}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🌹", 0, 0);
        ctx.restore();
    });
}

// =====================================
// SISTEMA DE BATALHA
// =====================================
let emBatalha = false;

// nível do personagem (exp/level)
let personagem = {
    nivel:  1,
    exp:    0,
    expMax: 100
};

let estagio = 1;
let textos  = [];

let inimigo = {
    nome:   "Demônio",
    hp:     100,
    maxHp:  100,
    nivel:  1,
    recompensaMoeda: 20,
    recompensaGema:  0
};

const listaMonstros = [
    "Demônio",
    "Espírito Maligno",
    "Sombra Corrompida",
    "Chefe das Trevas"
];

function nomeMonstroParaEstagio(e){
    if(e % 10 === 0) return "Chefe das Trevas";
    const idx = Math.floor((e-1)/3) % (listaMonstros.length-1);
    return listaMonstros[idx];
}

function iniciarBatalha(){
    emBatalha = true;
    document.getElementById("uiBatalha").style.display = "flex";
    document.getElementById("btnBatalhar").style.display = "none";
    configurarInimigo(estagio);
    atualizarUIBatalha();
    atualizarUIUpgrades();
}

function configurarInimigo(e){
    const nome = nomeMonstroParaEstagio(e);
    const chefe= e % 10 === 0;

    inimigo.nome    = nome + (chefe ? " [CHEFE]" : "") + " Lv." + e;
    inimigo.nivel   = e;
    inimigo.maxHp   = Math.floor(80 * Math.pow(1.22, e));
    inimigo.hp      = inimigo.maxHp;
    inimigo.recompensaMoeda = Math.floor(10 * Math.pow(1.15, e));
    inimigo.recompensaGema  = (chefe) ? Math.floor(5 + e/5) : (Math.random()<0.05?1:0);

    // fala ao aparecer
    setTimeout(()=>exibirFalaProvocadora(nome), 800);
}

function darDano(valor){
    if(!emBatalha) return;
    inimigo.hp -= valor;
    criarTextoFlutuante("-"+formatarNum(valor), "click");
    if(inimigo.hp <= 0) matarInimigo();
}

function matarInimigo(){
    moeda += inimigo.recompensaMoeda;
    if(inimigo.recompensaGema > 0) gema += inimigo.recompensaGema;
    ganharExp(5 + estagio*2);
    estagio++;
    configurarInimigo(estagio);
    atualizarUIBatalha();
}

// ======= EXP / LEVEL =======
function ganharExp(qtd){
    personagem.exp += qtd;
    while(personagem.exp >= personagem.expMax){
        personagem.exp    -= personagem.expMax;
        personagem.nivel++;
        personagem.expMax  = Math.floor(100 * Math.pow(1.3, personagem.nivel-1));
        criarTextoFlutuante("LEVEL UP! Lv."+personagem.nivel, "levelup");
    }
    document.getElementById("santaLvUI").innerText = personagem.nivel;
}

// ======= CLIQUE NO CANVAS (BATALHA) =======
canvas.addEventListener("click", (e)=>{
    if(!emBatalha) return;

    const danoBase  = calcularDanoClick();
    const velBonus  = upgrades.velocidade.bonus;
    const danoFinal = Math.floor(danoBase * velBonus);

    darDano(danoFinal);

    // criar rosas proporcional ao nível de rosa
    const qtdRosas = Math.min(1 + Math.floor(upgrades.rosa.nivel/3), 6);
    for(let i=0; i<qtdRosas; i++){
        setTimeout(()=>criarRosa(), i*60);
    }
});

// ======= DPS PASSIVO =======
setInterval(()=>{
    if(!emBatalha) return;
    const dps = calcularDps();
    darDano(dps);
    criarTextoFlutuante("-"+formatarNum(dps), "dps");
}, 1000);

// ======= FALA PERIÓDICA =======
setInterval(()=>{
    if(!emBatalha) return;
    if(!falaAtiva && Math.random()<0.35){
        const nomeBase = nomeMonstroParaEstagio(estagio);
        exibirFalaProvocadora(nomeBase);
    }
}, 8000);

// =====================================
// TEXTOS FLUTUANTES
// =====================================
function criarTextoFlutuante(valor, tipo){
    const { x: mx, y: my } = posMonstro();
    textos.push({
        x: mx + (Math.random()-0.5)*80,
        y: my - 20,
        valor: valor,
        vida: 70,
        tipo: tipo
    });
}

// =====================================
// ATUALIZAR UI BATALHA
// =====================================
function atualizarUIBatalha(){
    if(!emBatalha) return;

    // HP barra
    const barra = document.getElementById("hpInimigo");
    let pct = (inimigo.hp/inimigo.maxHp)*100;
    if(pct<0) pct=0; if(pct>100) pct=100;
    barra.style.width = pct+"%";

    document.getElementById("nomeInimigo").innerText = inimigo.nome;
    document.getElementById("hpTexto").innerText     =
        `❤ ${formatarNum(Math.max(0,inimigo.hp))} / ${formatarNum(inimigo.maxHp)}`;

    document.getElementById("estagioUI").innerText   = `⚔ Estágio ${estagio}`;
    document.getElementById("moedaUI").innerText     = `🪙 ${formatarNum(moeda)}`;
    document.getElementById("gemaUI").innerText      = `💎 ${formatarNum(gema)}`;

    document.getElementById("danoTaqueUI").innerText =
        `👆 Dano/Click: ${formatarNum(Math.floor(calcularDanoClick() * upgrades.velocidade.bonus))}`;
    document.getElementById("dpsUI").innerText =
        `⚡ DPS: ${formatarNum(calcularDps())}`;

    atualizarUIUpgrades();
}

// =====================================
// DESENHAR TELA DE BATALHA
// =====================================
function desenharBatalha(){
    // Fundo gradiente
    let grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,"#0d1b2a");
    grad.addColorStop(0.6,"#1e3c72");
    grad.addColorStop(1,"#2a5298");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Chão com grama
    const gradChao = ctx.createLinearGradient(0, canvas.height-160, 0, canvas.height);
    gradChao.addColorStop(0,"#2d6a4f");
    gradChao.addColorStop(1,"#1b4332");
    ctx.fillStyle = gradChao;
    ctx.fillRect(0, canvas.height-160, canvas.width, 160);

    // ====== SANTA (placeholder visual) ======
    const santaX = canvas.width*0.12;
    const santaY = canvas.height*0.68;
    ctx.save();
    ctx.font = "64px serif";
    ctx.textAlign = "center";
    ctx.fillText("🌸", santaX, santaY);
    ctx.restore();

    // ====== ROSAS VOANDO ======
    atualizarRosas();
    desenharRosas();

    // ====== MONSTRO ======
    const { x: mx, y: my } = posMonstro();
    const pct = inimigo.hp / inimigo.maxHp;
    const escalaM = 0.8 + pct*0.2;
    const tamanhoM = 110 * escalaM;

    ctx.save();
    ctx.shadowBlur  = 30;
    ctx.shadowColor = "rgba(255,50,50,0.8)";

    // Emoji do monstro baseado no tipo
    const emojisMonstro = {
        "Demônio":          "😈",
        "Espírito Maligno": "👻",
        "Sombra Corrompida":"🕷",
        "Chefe das Trevas": "💀"
    };
    const nomeBase = nomeMonstroParaEstagio(estagio);
    ctx.font = `${tamanhoM}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojisMonstro[nomeBase]||"👾", mx, my);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ====== TEXTOS FLUTUANTES ======
    textos.forEach(t=>{
        ctx.save();
        const alpha = Math.min(1, t.vida/20);
        ctx.globalAlpha = alpha;
        ctx.font = t.tipo==="levelup" ? "bold 22px Arial" : t.tipo==="dps" ? "14px Arial" : "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = t.tipo==="levelup" ? "#ffd700" : t.tipo==="dps" ? "#aaffaa" : "#ffffff";
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 3;
        ctx.strokeText(t.valor, t.x, t.y);
        ctx.fillText(t.valor, t.x, t.y);
        ctx.restore();
        t.y -= 1.5;
        t.vida--;
    });
    textos = textos.filter(t=>t.vida>0);
}

// =====================================
// LOOP PRINCIPAL
// =====================================
function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(emBatalha){
        desenharBatalha();
        atualizarUIBatalha();
    }else{
        atualizarSanta();
        desenharChao();
        desenharObjetos();
        desenharSanta();
    }

    requestAnimationFrame(loop);
}
loop();
