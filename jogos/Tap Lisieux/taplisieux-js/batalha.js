// ===================================================
// UTILITÁRIOS
// ===================================================
function formatarNum(n){
    if(n>=1e9)  return (n/1e9).toFixed(1)+"B";
    if(n>=1e6)  return (n/1e6).toFixed(1)+"M";
    if(n>=1e3)  return (n/1e3).toFixed(1)+"K";
    return Math.floor(n).toString();
}

// ===================================================
// NAVEGAÇÃO
// ===================================================
function abrirConfig(){ document.getElementById("janelaConfig").style.display="flex"; }
function fecharConfig(){ document.getElementById("janelaConfig").style.display="none"; }
function voltarSite(){ window.location.href="index.html"; }

function abrirModalInvocar(){ document.getElementById("modalInvocar").style.display="flex"; }
function abrirModalEquipar(){ 
    atualizarListaEquipar();
    document.getElementById("modalEquipar").style.display="flex"; 
}
function fecharModal(id){ document.getElementById(id).style.display="none"; }

function sairBatalha(){
    emBatalha=false;
    document.getElementById("uiBatalha").style.display="none";
    document.getElementById("lobbyHUD").style.display="flex";
    document.getElementById("lobbybotoes").style.display="flex";
}

// ===================================================
// CONFIG CANVAS
// ===================================================
const TILE=32, MAP_WIDTH=100, MAP_HEIGHT=100;
const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");
ctx.imageSmoothingEnabled=false;

let camera={
    x: MAP_WIDTH*TILE/2 - window.innerWidth/2,
    y: MAP_HEIGHT*TILE/2 - window.innerHeight/2
};

function resizeCanvas(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize",resizeCanvas);
camera.x=MAP_WIDTH*TILE/2 - canvas.width/2;
camera.y=MAP_HEIGHT*TILE/2 - canvas.height/2;

// ===================================================
// CÂMERA ARRASTÁVEL (só no lobby)
// ===================================================
let dragging=false, lastX=0, lastY=0;
canvas.onmousedown=(e)=>{ if(emBatalha)return; dragging=true; lastX=e.clientX; lastY=e.clientY; };
canvas.onmouseup=()=>{ dragging=false; };
canvas.onmouseleave=()=>{ dragging=false; };
canvas.onmousemove=(e)=>{
    if(!dragging)return;
    camera.x-=e.clientX-lastX; camera.y-=e.clientY-lastY;
    lastX=e.clientX; lastY=e.clientY;
};

// ===================================================
// IMAGENS
// ===================================================
const imagens={ gramas:[], mesa:new Image(), cadeiraEsq:new Image(), cadeiraDir:new Image(), biblioteca:new Image(), estrada:new Image() };
imagens.santaAnda=[];

function registrarImagem(img){ img.onload=()=>{}; }

for(let i=1;i<=5;i++){
    let img=new Image(); img.src=`tiles/chaop1/grama${i}.jpg`; imagens.gramas.push(img);
}
for(let i=1;i<=9;i++){
    let img=new Image(); img.src=`tiles/trzn/anda${i}.png`; imagens.santaAnda.push(img);
}
imagens.estrada.src="tiles/chaop1/ti.png";
imagens.mesa.src="tiles/estruturas/mesa.png";
imagens.cadeiraEsq.src="tiles/estruturas/cadeira_esquerda.png";
imagens.cadeiraDir.src="tiles/estruturas/cadeira_direita.png";
imagens.biblioteca.src="tiles/estruturas/bb.png";

// ===================================================
// MAPA
// ===================================================
const mapaGrama=[];
const centroX=Math.floor(MAP_WIDTH/2), centroY=Math.floor(MAP_HEIGHT/2);
const escolaY=12, larguraCam=1;

for(let y=0;y<MAP_HEIGHT;y++){
    mapaGrama[y]=[];
    for(let x=0;x<MAP_WIDTH;x++){
        let tipo=0;
        if(y>=centroY-larguraCam&&y<=centroY+larguraCam) tipo=5;
        if(x>=centroX-larguraCam&&x<=centroX+larguraCam) tipo=5;
        if(y>=escolaY-larguraCam&&y<=escolaY+larguraCam) tipo=5;
        if(x>=centroX-larguraCam&&x<=centroX+larguraCam&&
           y>=Math.min(escolaY,centroY)&&y<=Math.max(escolaY,centroY)) tipo=5;
        mapaGrama[y][x]={tipo,sombra:Math.random()*0.03};
    }
}

// ===================================================
// OBJETOS LOBBY
// ===================================================
const centroTileX=50, centroTileY=50;
const objetos=[
    {tipo:"biblioteca",tileX:7,tileY:10,escala:0.9,layer:0},
    {tipo:"cadeiraEsq",tileX:centroTileX-1.77,tileY:centroTileY-0.20,escala:0.22,layer:0},
    {tipo:"cadeiraDir",tileX:centroTileX+1.77,tileY:centroTileY-0.20,escala:0.22,layer:0},
    {tipo:"mesa",tileX:centroTileX,tileY:centroTileY,escala:0.42,layer:1}
];

// ===================================================
// NPC LOBBY
// ===================================================
const santa={tileX:50,tileY:50,frame:0,tempo:0,velocidade:0.03,escala:0.28,dirX:1,dirY:0};

function atualizarSanta(){
    santa.tempo++;
    if(santa.tempo>8){santa.tempo=0;santa.frame++;if(santa.frame>=imagens.santaAnda.length)santa.frame=0;}
    santa.tileX+=santa.dirX*santa.velocidade;
    santa.tileY+=santa.dirY*santa.velocidade;
    const cx=Math.round(santa.tileX),cy=Math.round(santa.tileY);
    if(Math.abs(santa.tileX-cx)<santa.velocidade&&Math.abs(santa.tileY-cy)<santa.velocidade){
        santa.tileX=cx;santa.tileY=cy;
        const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
        const possiveis=[];
        for(let d of dirs){
            const nx=cx+d.x,ny=cy+d.y;
            if(nx<0||ny<0||nx>=MAP_WIDTH||ny>=MAP_HEIGHT)continue;
            if(mapaGrama[ny][nx].tipo===5){
                if(d.x===-santa.dirX&&d.y===-santa.dirY)continue;
                possiveis.push(d);
            }
        }
        if(possiveis.length>0){const e=possiveis[Math.floor(Math.random()*possiveis.length)];santa.dirX=e.x;santa.dirY=e.y;}
    }
}

function desenharChao(){
    const sX=Math.floor(camera.x/TILE),sY=Math.floor(camera.y/TILE);
    const vW=Math.ceil(canvas.width/TILE)+2,vH=Math.ceil(canvas.height/TILE)+2;
    for(let y=sY;y<sY+vH;y++){
        for(let x=sX;x<sX+vW;x++){
            if(x<0||y<0||x>=MAP_WIDTH||y>=MAP_HEIGHT)continue;
            const tile=mapaGrama[y][x];
            const img=(tile.tipo===5)?imagens.estrada:imagens.gramas[tile.tipo];
            const dX=x*TILE-camera.x,dY=y*TILE-camera.y;
            if(img&&img.complete&&img.naturalWidth!==0){
                ctx.drawImage(img,dX,dY,TILE,TILE);
                ctx.fillStyle=`rgba(0,0,0,${tile.sombra})`;
                ctx.fillRect(dX,dY,TILE,TILE);
            }else{
                ctx.fillStyle="#2ecc71";ctx.fillRect(dX,dY,TILE,TILE);
            }
        }
    }
}

function desenharObjetos(){
    objetos.sort((a,b)=>a.layer!==b.layer?a.layer-b.layer:(a.tileY+1)*TILE-(b.tileY+1)*TILE);
    objetos.forEach(obj=>{
        const img=imagens[obj.tipo];
        if(!img.complete||img.naturalWidth===0)return;
        const larg=img.width*obj.escala,alt=img.height*obj.escala;
        const bX=obj.tileX*TILE+TILE/2,bY=obj.tileY*TILE+TILE;
        ctx.fillStyle="rgba(0,0,0,0.25)";
        ctx.fillRect(bX-larg/4-camera.x,bY-camera.y-3,larg/2,5);
        ctx.drawImage(img,bX-larg/2-camera.x,bY-alt-camera.y,larg,alt);
    });
}

function desenharSantaLobby(){
    const img=imagens.santaAnda[Math.floor(santa.frame)];
    if(!img||!img.complete||img.naturalWidth===0)return;
    const larg=img.width*santa.escala,alt=img.height*santa.escala;
    const bX=santa.tileX*TILE+TILE/2,bY=santa.tileY*TILE+TILE;
    const dX=bX-larg/2-camera.x,dY=bY-alt-camera.y;
    ctx.save();
    if(santa.dirX<0){ctx.scale(-1,1);ctx.drawImage(img,-(dX+larg),dY,larg,alt);}
    else{ctx.drawImage(img,dX,dY,larg,alt);}
    ctx.restore();
}

// ===================================================
// ECONOMIA
// ===================================================
let moeda=0, gema=50;

function atualizarHUDLobby(){
    document.getElementById("hudMoedaVal").innerText=formatarNum(moeda);
    document.getElementById("hudGemaVal").innerText=formatarNum(gema);
}

// energia (regenera de graça, decorativa por agora)
let energia={atual:100,max:100};
setInterval(()=>{
    if(energia.atual<energia.max)energia.atual=Math.min(energia.max,energia.atual+1);
    document.getElementById("hudEnergiaVal").innerText=energia.atual+"/"+energia.max;
},30000);

// ===================================================
// UPGRADES
// ===================================================
const upgrades={
    forca:{nivel:1,base:5,mult:1.5,custoBase:15,custoCres:1.6,
        get dano(){return Math.floor(this.base*Math.pow(this.mult,this.nivel-1));},
        get custo(){return Math.floor(this.custoBase*Math.pow(this.custoCres,this.nivel-1));}},
    rosa:{nivel:1,base:3,mult:1.4,custoBase:20,custoCres:1.65,
        get dano(){return Math.floor(this.base*Math.pow(this.mult,this.nivel-1));},
        get custo(){return Math.floor(this.custoBase*Math.pow(this.custoCres,this.nivel-1));}},
    velocidade:{nivel:1,base:1,mult:1.1,custoBase:30,custoCres:1.7,
        get bonus(){return parseFloat((this.base*Math.pow(this.mult,this.nivel-1)).toFixed(2));},
        get custo(){return Math.floor(this.custoBase*Math.pow(this.custoCres,this.nivel-1));}},
    dps:{nivel:1,base:2,mult:1.6,custoBase:25,custoCres:1.7,
        get valor(){return Math.floor(this.base*Math.pow(this.mult,this.nivel-1));},
        get custo(){return Math.floor(this.custoBase*Math.pow(this.custoCres,this.nivel-1));}}
};

function calcularDanoClick(){ return Math.floor((upgrades.forca.dano+upgrades.rosa.dano)*upgrades.velocidade.bonus); }
function calcularDps(){ return upgrades.dps.valor; }

function comprarUpgrade(tipo){
    const up=upgrades[tipo];
    if(moeda>=up.custo){ moeda-=up.custo; up.nivel++; atualizarUIUpgrades(); atualizarUIBatalha(); }
}

function atualizarUIUpgrades(){
    const u=upgrades;
    const el=(id,txt)=>{const e=document.getElementById(id);if(e)e.innerText=txt;};
    const btn=(id,txt,dis)=>{const e=document.getElementById(id);if(e){e.innerText=txt;e.disabled=dis;}};

    el("forcaAtualTxt",`Nv.${u.forca.nivel} | +${formatarNum(u.forca.dano)} dano`);
    el("rosaAtualTxt", `Nv.${u.rosa.nivel}  | +${formatarNum(u.rosa.dano)} dano`);
    el("velAtualTxt",  `Nv.${u.velocidade.nivel} | x${u.velocidade.bonus}`);
    el("dpsAtualTxt",  `Nv.${u.dps.nivel}  | +${formatarNum(u.dps.valor)} DPS`);

    btn("btnForca",      `🪙 ${formatarNum(u.forca.custo)}`,      moeda<u.forca.custo);
    btn("btnRosa",       `🪙 ${formatarNum(u.rosa.custo)}`,       moeda<u.rosa.custo);
    btn("btnVelocidade", `🪙 ${formatarNum(u.velocidade.custo)}`, moeda<u.velocidade.custo);
    btn("btnDps",        `🪙 ${formatarNum(u.dps.custo)}`,        moeda<u.dps.custo);
}

// ===================================================
// MINIMIZAR PAINEL
// ===================================================
let painelMinimizado=false;
function toggleUpgrades(){
    painelMinimizado=!painelMinimizado;
    document.getElementById("painelUpgradesConteudo").classList.toggle("minimizado",painelMinimizado);
    document.getElementById("btnMinimizar").innerText=painelMinimizado?"▲":"▼";
}

// ===================================================
// ABAS
// ===================================================
function abrirAba(nome, ev){
    ["painelUpgrades","painelPersonagens","painelInvocacao","painelEquipamentos"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.style.display="none";
    });
    const alvo=document.getElementById("painel"+nome.charAt(0).toUpperCase()+nome.slice(1));
    if(alvo) alvo.style.display="block";
    document.querySelectorAll("#painelUpgradesHeader .abaBtn").forEach(b=>b.classList.remove("ativa"));
    if(ev&&ev.target) ev.target.classList.add("ativa");
}

// ===================================================
// INVOCAÇÃO
// ===================================================
const poolHerois=[
    {nome:"Anjo Gabriel",  raridade:"Raro",    emoji:"😇", arma:"Espada de Luz"},
    {nome:"São Francisco", raridade:"Comum",   emoji:"🕊",  arma:"Cajado Sagrado"},
    {nome:"São José",      raridade:"Comum",   emoji:"⚒",   arma:"Martelo Bento"},
    {nome:"Santa Cecília", raridade:"Épico",   emoji:"🎵",  arma:"Harpa Celestial"},
    {nome:"São Miguel",    raridade:"Lendário",emoji:"⚔",   arma:"Lança Divina"},
    {nome:"Santa Luzia",   raridade:"Raro",    emoji:"👁",   arma:"Vela da Graça"}
];
const poolArmas=[
    {nome:"Rosas Sagradas",  raridade:"Comum",   emoji:"🌹",dano:50},
    {nome:"Lírios do Céu",   raridade:"Raro",    emoji:"🌸",dano:120},
    {nome:"Coroa de Espinhos",raridade:"Épico",  emoji:"👑",dano:300},
    {nome:"Pétala Divina",   raridade:"Lendário",emoji:"✨",dano:800}
];
let heroisObtidos=[], equipamentosObtidos=[];
const corRar={"Comum":"#aaaaaa","Raro":"#4488ff","Épico":"#aa44ff","Lendário":"#ffaa00"};

function invocar(qtd){
    const custo=100*qtd;
    if(gema<custo){
        ["invocarResultado","invocarResultado2"].forEach(id=>{
            const e=document.getElementById(id);
            if(e){e.innerText="❌ Gemas insuficientes! Precisa de 💎"+custo;e.style.color="#ff4444";}
        });
        return;
    }
    gema-=custo;
    const resultados=[];
    for(let i=0;i<qtd;i++){
        const roll=Math.random();
        let pool;
        if(roll<0.01) pool=[...poolHerois,...poolArmas].filter(x=>x.raridade==="Lendário");
        else if(roll<0.05) pool=[...poolHerois,...poolArmas].filter(x=>x.raridade==="Épico");
        else if(roll<0.25) pool=[...poolHerois,...poolArmas].filter(x=>x.raridade==="Raro");
        else pool=[...poolHerois,...poolArmas].filter(x=>x.raridade==="Comum");
        resultados.push(pool[Math.floor(Math.random()*pool.length)]);
    }
    resultados.forEach(r=>{ if(r.arma&&!r.dano) heroisObtidos.push(r); else equipamentosObtidos.push(r); });
    const lend=resultados.filter(r=>r.raridade==="Lendário").length;
    const epic=resultados.filter(r=>r.raridade==="Épico").length;
    const txt=qtd===1?`${resultados[0].emoji} ${resultados[0].nome} (${resultados[0].raridade})!`
        :`✨ ${qtd} invocações! Lendários:${lend} Épicos:${epic}`;
    const cor=lend>0?"#ffaa00":epic>0?"#aa44ff":"#eeddff";
    ["invocarResultado","invocarResultado2"].forEach(id=>{
        const e=document.getElementById(id);
        if(e){e.innerText=txt;e.style.color=cor;}
    });
    atualizarListaInvocacao();
    atualizarUIBatalha();
    atualizarHUDLobby();
}

function tagHTML(item){
    return `<span class="heroiTag" style="border-color:${corRar[item.raridade]};color:${corRar[item.raridade]}">${item.emoji} ${item.nome}</span>`;
}

function atualizarListaInvocacao(){
    ["listaHerois","listaHerois2"].forEach(id=>{
        const e=document.getElementById(id);
        if(e) e.innerHTML=heroisObtidos.map(h=>tagHTML(h)).join("");
    });
    ["listaEquipamentos","listaEquipamentos2"].forEach(id=>{
        const e=document.getElementById(id);
        if(e) e.innerHTML=equipamentosObtidos.map(a=>
            `<span class="armaTag" style="border-color:${corRar[a.raridade]};color:${corRar[a.raridade]}">${a.emoji} ${a.nome} (+${a.dano})</span>`
        ).join("");
    });
}

function atualizarListaEquipar(){
    const el=document.getElementById("listaEquipamentosEquipar");
    if(!el)return;
    el.innerHTML=equipamentosObtidos.length===0
        ? "<p style='color:#aaa;font-size:13px;'>Nenhuma arma obtida ainda.</p>"
        : equipamentosObtidos.map(a=>
            `<div class="upgradeItem">
                <div>${a.emoji} <b>${a.nome}</b><br><small style="color:${corRar[a.raridade]}">${a.raridade} | +${a.dano} dano</small></div>
                <button class="btnUpgrade" onclick="fecharModal('modalEquipar')">Equipar</button>
            </div>`).join("");
}

// ===================================================
// FALAS DOS MONSTROS
// ===================================================
const falasPorMonstro={
    "Demônio":["Você é uma inútil mesmo!","Achei que seria mais difícil...","Nem suas orações te salvam!","Vai chorar pro seu Deus?","Que fraquinha, hahahaha!"],
    "Espírito Maligno":["Sua fé não vale nada aqui!","Florzinhas? Ridículo!","Desista, santinha!","Nunca vai me derrotar!"],
    "Sombra Corrompida":["A escuridão vence a luz!","Suas rosas não têm poder aqui!","Você tremeu, eu vi!","Corre enquanto pode!"],
    "Chefe das Trevas":["Eu sou eterno. Você é um grão de poeira!","Tanta inocência... é patético!","A santa mais fraca que já enfrentei!","Sua luz está se apagando!"]
};

let timerFala=null,falaAtiva=false;
function exibirFala(nomeMonstro){
    const falas=falasPorMonstro[nomeMonstro]||falasPorMonstro["Demônio"];
    const fala=falas[Math.floor(Math.random()*falas.length)];
    const el=document.getElementById("falaInimigo");
    el.innerText=`"${fala}"`;
    el.classList.add("visivel");
    falaAtiva=true;
    if(timerFala)clearTimeout(timerFala);
    timerFala=setTimeout(()=>{el.classList.remove("visivel");falaAtiva=false;},3500);
}

// ===================================================
// SISTEMA DE BATALHA
// ===================================================
let emBatalha=false;
let estagio=1;
let textos=[];
let personagem={nivel:1,exp:0,expMax:100};

let inimigo={
    nome:"Demônio",hp:100,maxHp:100,nivel:1,
    recompensaMoeda:20,recompensaGema:0,
    // estado visual
    tremendo:0,          // frames de tremido
    corAtual:"normal",   // "normal" | "hit" | "quaseMorto"
    expressao:"normal"   // "normal" | "raiva" | "dor" | "medo"
};

const listaMonstros=["Demônio","Espírito Maligno","Sombra Corrompida","Chefe das Trevas"];
function nomeMonstro(e){ return e%10===0?"Chefe das Trevas":listaMonstros[Math.floor((e-1)/3)%(listaMonstros.length-1)]; }

// ===================================================
// ANIMAÇÃO DO PERSONAGEM (SANTA NA BATALHA)
// ===================================================
const personagemBatalha={
    // posição base na tela
    get x(){ return canvas.width*0.22; },
    get y(){ return canvas.height*0.62; },
    // estado de ataque
    atacando:0,         // contador de frames
    duracaoAtaque:18,   // frames de animação de ataque
    offX:0,             // deslocamento horizontal durante ataque
    frame:0, tempo:0    // animação de andar
};

function atualizarPersonagemBatalha(){
    // animação de frame
    personagemBatalha.tempo++;
    if(personagemBatalha.tempo>8){
        personagemBatalha.tempo=0;
        personagemBatalha.frame=(personagemBatalha.frame+1)%imagens.santaAnda.length;
    }
    // animação de ataque
    if(personagemBatalha.atacando>0){
        personagemBatalha.atacando--;
        const prog=personagemBatalha.atacando/personagemBatalha.duracaoAtaque;
        // avança e volta: vai pra frente e retorna
        personagemBatalha.offX=Math.sin(prog*Math.PI)*55;
    } else {
        personagemBatalha.offX=0;
    }
}

function dispararAtaquePersonagem(){
    personagemBatalha.atacando=personagemBatalha.duracaoAtaque;
}

function desenharPersonagemBatalha(){
    const img=imagens.santaAnda[personagemBatalha.frame];
    const escala=1.4;
    if(!img||!img.complete||img.naturalWidth===0){
        // fallback emoji
        ctx.font="60px serif";
        ctx.textAlign="center";
        ctx.fillText("🌸",personagemBatalha.x+personagemBatalha.offX,personagemBatalha.y);
        return;
    }
    const larg=img.width*escala, alt=img.height*escala;
    const px=personagemBatalha.x+personagemBatalha.offX;
    const py=personagemBatalha.y;
    // sombra no chão
    ctx.fillStyle="rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(px, py+8, larg*0.4, 8, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.drawImage(img, px-larg/2, py-alt, larg, alt);
}

// ===================================================
// MONSTRO NA BATALHA (ANIMADO)
// ===================================================
const monstroBatalha={
    get x(){ return canvas.width*0.62; },
    get y(){ return canvas.height*0.55; },
    tremendo:0,
    flashHit:0,
    escalaShake:1
};

function reagirDano(){
    monstroBatalha.tremendo=12;
    monstroBatalha.flashHit=8;
}

const emojisMonstro={
    "Demônio":        {normal:"😈",dor:"😖",medo:"😱",raiva:"👿"},
    "Espírito Maligno":{normal:"👻",dor:"😵",medo:"😨",raiva:"💢"},
    "Sombra Corrompida":{normal:"🕷",dor:"💀",medo:"😰",raiva:"🕷"},
    "Chefe das Trevas":{normal:"💀",dor:"😣",medo:"😱",raiva:"😡"}
};

function emojiAtual(nomeBase){
    const pct=inimigo.hp/inimigo.maxHp;
    const set=emojisMonstro[nomeBase]||emojisMonstro["Demônio"];
    if(monstroBatalha.flashHit>0) return set.dor;
    if(pct<0.2) return set.medo;
    if(pct<0.5) return set.raiva;
    return set.normal;
}

function desenharMonstro(){
    const nomeBase=nomeMonstro(estagio);
    const pct=Math.max(0.1,inimigo.hp/inimigo.maxHp);

    let ox=0, oy=0;
    if(monstroBatalha.tremendo>0){
        monstroBatalha.tremendo--;
        ox=(Math.random()-0.5)*14;
        oy=(Math.random()-0.5)*8;
    }
    if(monstroBatalha.flashHit>0) monstroBatalha.flashHit--;

    const tamanho=110*(0.75+pct*0.25);
    const mx=monstroBatalha.x+ox;
    const my=monstroBatalha.y+oy;

    ctx.save();

    // flash vermelho ao tomar dano
    if(monstroBatalha.flashHit>0){
        ctx.globalAlpha=0.6+monstroBatalha.flashHit*0.04;
        ctx.filter="sepia(1) saturate(10) hue-rotate(-20deg)";
    }

    // sombra pulsando
    ctx.shadowBlur=20+Math.sin(Date.now()*0.004)*10;
    ctx.shadowColor=pct<0.2?"rgba(255,255,0,0.9)":"rgba(255,50,50,0.7)";

    ctx.font=`${tamanho}px serif`;
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(emojiAtual(nomeBase), mx, my);

    ctx.restore();
}

// ===================================================
// FLORES CONJURADAS DO CÉU
// ===================================================
let flores=[];          // flores flutuando no céu (pool)
let floresAtaque=[];    // flores em direção ao monstro

const QTD_FLORES_CEU=8; // flores que ficam flutuando

// Inicializar flores no céu
function inicializarFlores(){
    flores=[];
    for(let i=0;i<QTD_FLORES_CEU;i++){
        flores.push(criarFlorCeu(true));
    }
}

function criarFlorCeu(randY=false){
    return {
        x: canvas.width*0.05 + Math.random()*(canvas.width*0.5),
        y: randY ? Math.random()*(canvas.height*0.35) : -30,
        vy: 0.3+Math.random()*0.4,
        vx: (Math.random()-0.5)*0.5,
        size: 22+Math.random()*14,
        rotacao: Math.random()*Math.PI*2,
        velRot: (Math.random()-0.5)*0.02,
        fase: Math.random()*Math.PI*2,  // para balanço
        emitir: false   // esta não foi ativada
    };
}

function atualizarFloresCeu(){
    flores.forEach(f=>{
        f.y+=f.vy;
        f.x+=Math.sin(Date.now()*0.001+f.fase)*0.4;
        f.rotacao+=f.velRot;
        // se saiu da área visível, recolocar no topo
        if(f.y>canvas.height*0.45){
            f.y=-30;
            f.x=canvas.width*0.05+Math.random()*(canvas.width*0.5);
        }
    });
}

function desenharFloresCeu(){
    flores.forEach(f=>{
        ctx.save();
        ctx.globalAlpha=0.75;
        ctx.translate(f.x,f.y);
        ctx.rotate(f.rotacao);
        ctx.font=`${f.size}px serif`;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText("🌹",0,0);
        ctx.restore();
    });
}

// Ao clicar: pegar flor mais próxima do pool e disparar para o monstro
function dispararFlor(){
    // escolhe flor aleatória do pool do céu
    const idx=Math.floor(Math.random()*flores.length);
    const fOrigem=flores[idx];

    // recriar essa flor no topo para substituir
    flores[idx]=criarFlorCeu(false);

    const qtdRosas=Math.min(1+Math.floor(upgrades.rosa.nivel/3),5);

    for(let i=0;i<qtdRosas;i++){
        // origem: posição atual da flor no céu (+leve dispersão)
        const ox=fOrigem.x+(Math.random()-0.5)*60;
        const oy=fOrigem.y+(Math.random()-0.5)*30;
        const tx=monstroBatalha.x+(Math.random()-0.5)*40;
        const ty=monstroBatalha.y+(Math.random()-0.5)*30;

        const dist=Math.hypot(tx-ox,ty-oy);
        const spd=6+Math.random()*3;
        const ang=Math.atan2(ty-oy,tx-ox);

        floresAtaque.push({
            x:ox, y:oy,
            vx:Math.cos(ang)*spd,
            vy:Math.sin(ang)*spd,
            tx, ty,
            size: 20+Math.random()*10,
            rotacao:Math.random()*Math.PI*2,
            velRot:(Math.random()-0.5)*0.25,
            vida:Math.ceil(dist/spd)+5,
            maxVida:Math.ceil(dist/spd)+5,
            acertou:false
        });
    }
}

function atualizarFloresAtaque(){
    floresAtaque.forEach(f=>{
        f.x+=f.vx;
        f.y+=f.vy;
        f.rotacao+=f.velRot;
        f.vida--;
        if(!f.acertou&&Math.hypot(f.x-f.tx,f.y-f.ty)<25){
            f.acertou=true;
            f.vida=0;
            // partículas ao acertar
            for(let p=0;p<5;p++) criarParticula(f.x,f.y);
        }
    });
    floresAtaque=floresAtaque.filter(f=>f.vida>0);
}

function desenharFloresAtaque(){
    floresAtaque.forEach(f=>{
        const alpha=Math.min(1,f.vida/10);
        ctx.save();
        ctx.globalAlpha=alpha;
        ctx.translate(f.x,f.y);
        ctx.rotate(f.rotacao);
        ctx.font=`${f.size}px serif`;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText("🌹",0,0);
        ctx.restore();
    });
}

// ===================================================
// PARTÍCULAS DE IMPACTO
// ===================================================
let particulas=[];
function criarParticula(x,y){
    const ang=Math.random()*Math.PI*2;
    const spd=1.5+Math.random()*3;
    particulas.push({
        x,y,
        vx:Math.cos(ang)*spd,
        vy:Math.sin(ang)*spd,
        vida:20+Math.random()*15,
        size:8+Math.random()*8,
        cor:`hsl(${340+Math.random()*30},90%,65%)`
    });
}

function atualizarParticulas(){
    particulas.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.vida--; });
    particulas=particulas.filter(p=>p.vida>0);
}

function desenharParticulas(){
    particulas.forEach(p=>{
        ctx.save();
        ctx.globalAlpha=Math.min(1,p.vida/15);
        ctx.fillStyle=p.cor;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size*0.5,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
    });
}

// ===================================================
// TEXTOS FLUTUANTES
// ===================================================
function criarTextoFlutuante(valor,tipo){
    const mx=monstroBatalha.x, my=monstroBatalha.y;
    textos.push({
        x:mx+(Math.random()-0.5)*90,
        y:my-30,
        valor,tipo,
        vida:70
    });
}

// ===================================================
// LÓGICA DE BATALHA
// ===================================================
function iniciarBatalha(){
    emBatalha=true;
    document.getElementById("uiBatalha").style.display="flex";
    document.getElementById("lobbyHUD").style.display="none";
    document.getElementById("lobbybotoes").style.display="none";
    inicializarFlores();
    configurarInimigo(estagio);
    atualizarUIBatalha();
    atualizarUIUpgrades();
}

function configurarInimigo(e){
    const nome=nomeMonstro(e);
    const chefe=e%10===0;
    inimigo.nome=nome+(chefe?" [CHEFE]":"")+" Lv."+e;
    inimigo.nivel=e;
    inimigo.maxHp=Math.floor(80*Math.pow(1.22,e));
    inimigo.hp=inimigo.maxHp;
    inimigo.recompensaMoeda=Math.floor(10*Math.pow(1.15,e));
    inimigo.recompensaGema=chefe?Math.floor(5+e/5):(Math.random()<0.05?1:0);
    setTimeout(()=>exibirFala(nome),900);
}

function darDano(valor, tipo){
    if(!emBatalha)return;
    inimigo.hp-=valor;
    reagirDano();
    criarTextoFlutuante((tipo==="click"?"-":"-")+formatarNum(valor), tipo);
    if(inimigo.hp<=0) matarInimigo();
}

function matarInimigo(){
    moeda+=inimigo.recompensaMoeda;
    if(inimigo.recompensaGema>0) gema+=inimigo.recompensaGema;
    ganharExp(5+estagio*2);
    estagio++;
    floresAtaque=[];
    configurarInimigo(estagio);
    atualizarUIBatalha();
}

function ganharExp(qtd){
    personagem.exp+=qtd;
    while(personagem.exp>=personagem.expMax){
        personagem.exp-=personagem.expMax;
        personagem.nivel++;
        personagem.expMax=Math.floor(100*Math.pow(1.3,personagem.nivel-1));
        criarTextoFlutuante("LEVEL UP! Lv."+personagem.nivel,"levelup");
    }
    const el=document.getElementById("santaLvUI");
    if(el) el.innerText=personagem.nivel;
    const el2=document.getElementById("santaLvUI2");
    if(el2) el2.innerText=personagem.nivel;
}

// clique no canvas = ataque
canvas.addEventListener("click",(e)=>{
    if(!emBatalha)return;
    const dano=calcularDanoClick();
    darDano(dano,"click");
    dispararAtaquePersonagem();
    dispararFlor();
});

// DPS passivo
setInterval(()=>{
    if(!emBatalha)return;
    darDano(calcularDps(),"dps");
},1000);

// Fala periódica
setInterval(()=>{
    if(!emBatalha||falaAtiva)return;
    if(Math.random()<0.3) exibirFala(nomeMonstro(estagio));
},9000);

// ===================================================
// ATUALIZAR UI BATALHA
// ===================================================
function atualizarUIBatalha(){
    if(!emBatalha)return;
    const hp=Math.max(0,inimigo.hp);
    const pct=(hp/inimigo.maxHp)*100;
    document.getElementById("hpInimigo").style.width=Math.max(0,Math.min(100,pct))+"%";
    document.getElementById("nomeInimigo").innerText=inimigo.nome;
    document.getElementById("hpTexto").innerText=`❤ ${formatarNum(hp)} / ${formatarNum(inimigo.maxHp)}`;
    document.getElementById("estagioNum").innerText=estagio;
    document.getElementById("moedaUI").innerText="🪙 "+formatarNum(moeda);
    document.getElementById("gemaUI").innerText="💎 "+formatarNum(gema);
    document.getElementById("danoTaqueUI").innerText="👆 "+formatarNum(calcularDanoClick())+" / click";
    document.getElementById("dpsUI").innerText="⚡ "+formatarNum(calcularDps())+" DPS";
    atualizarUIUpgrades();
    atualizarHUDLobby();
}

// ===================================================
// DESENHAR TELA DE BATALHA
// ===================================================
function desenharFundoBatalha(){
    // Céu gradiente
    const grad=ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,"#0a0a1a");
    grad.addColorStop(0.5,"#1a1060");
    grad.addColorStop(1,"#0d0520");
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // estrelas de fundo (simples)
    ctx.fillStyle="rgba(255,255,255,0.6)";
    // (geradas fixas pelo seed do módulo)
    for(let i=0;i<60;i++){
        const sx=((i*173)%canvas.width);
        const sy=((i*97)%(canvas.height*0.5));
        const br=Math.abs(Math.sin(Date.now()*0.001+i))*0.7+0.3;
        ctx.globalAlpha=br*0.5;
        ctx.beginPath();
        ctx.arc(sx,sy,1.5,0,Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha=1;

    // Chão
    const gradChao=ctx.createLinearGradient(0,canvas.height*0.72,0,canvas.height);
    gradChao.addColorStop(0,"#1a0a3a");
    gradChao.addColorStop(1,"#0a0518");
    ctx.fillStyle=gradChao;
    ctx.fillRect(0,canvas.height*0.72,canvas.width,canvas.height*0.28);

    // linha do chão (glow)
    ctx.strokeStyle="rgba(160,80,255,0.35)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(0,canvas.height*0.72);
    ctx.lineTo(canvas.width,canvas.height*0.72);
    ctx.stroke();
}

function desenharTextosFlut(){
    textos.forEach(t=>{
        ctx.save();
        const alpha=Math.min(1,t.vida/20);
        ctx.globalAlpha=alpha;
        let cor="#ffffff",tam=18;
        if(t.tipo==="levelup"){ cor="#ffd700"; tam=22; }
        else if(t.tipo==="dps"){ cor="#aaffaa"; tam=14; }
        ctx.font=`bold ${tam}px Arial`;
        ctx.textAlign="center";
        ctx.strokeStyle="rgba(0,0,0,0.7)";
        ctx.lineWidth=3;
        ctx.strokeText(t.valor,t.x,t.y);
        ctx.fillStyle=cor;
        ctx.fillText(t.valor,t.x,t.y);
        ctx.restore();
        t.y-=1.5; t.vida--;
    });
    textos=textos.filter(t=>t.vida>0);
}

function desenharBatalha(){
    desenharFundoBatalha();

    // flores no céu
    atualizarFloresCeu();
    desenharFloresCeu();

    // flores voando ao monstro
    atualizarFloresAtaque();
    desenharFloresAtaque();

    // partículas de impacto
    atualizarParticulas();
    desenharParticulas();

    // personagem
    atualizarPersonagemBatalha();
    desenharPersonagemBatalha();

    // monstro
    desenharMonstro();

    // textos
    desenharTextosFlut();
}

// ===================================================
// LOOP
// ===================================================
function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(emBatalha){
        desenharBatalha();
        atualizarUIBatalha();
    }else{
        atualizarSanta();
        desenharChao();
        desenharObjetos();
        desenharSantaLobby();
    }
    requestAnimationFrame(loop);
}
loop();
