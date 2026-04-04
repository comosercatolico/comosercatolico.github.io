// ===================================================
// BATALHA (CORE COMPLETO)
// ===================================================

import { canvas, ctx } from "./config.js";
import { imagens } from "./imagens.js";
import { formatarNum } from "./utils.js";
import { adicionarMoeda, adicionarGema } from "./economia.js";
import { calcularDanoClick, calcularDps, atualizarUIUpgrades } from "./upgrades.js";


// ===================================================
// ESTADO GLOBAL
// ===================================================
export let emBatalha = false;
let estagio = 1;

let textos = [];

let personagem = {
    nivel: 1,
    exp: 0,
    expMax: 100
};


// ===================================================
// INIMIGO
// ===================================================
let inimigo = {
    nome: "Demônio",
    hp: 100,
    maxHp: 100,
    nivel: 1,
    recompensaMoeda: 20,
    recompensaGema: 0
};

const listaMonstros = ["Demônio","Espírito Maligno","Sombra Corrompida","Chefe das Trevas"];

function nomeMonstro(e){
    return e % 10 === 0
        ? "Chefe das Trevas"
        : listaMonstros[Math.floor((e-1)/3) % (listaMonstros.length-1)];
}


// ===================================================
// FALAS
// ===================================================
const falasPorMonstro = {
    "Demônio":["Você é uma inútil mesmo!","Nem suas orações te salvam!"],
    "Espírito Maligno":["Sua fé não vale nada aqui!","Desista, santinha!"],
    "Sombra Corrompida":["A escuridão vence a luz!","Corre enquanto pode!"],
    "Chefe das Trevas":["Eu sou eterno.","Sua luz está se apagando!"]
};

let timerFala = null;
let falaAtiva = false;

function exibirFala(nomeMonstro){
    const falas = falasPorMonstro[nomeMonstro] || falasPorMonstro["Demônio"];
    const fala = falas[Math.floor(Math.random()*falas.length)];

    const el = document.getElementById("falaInimigo");
    if(!el) return;

    el.innerText = `"${fala}"`;
    el.classList.add("visivel");
    falaAtiva = true;

    if(timerFala) clearTimeout(timerFala);

    timerFala = setTimeout(()=>{
        el.classList.remove("visivel");
        falaAtiva = false;
    }, 3500);
}


// ===================================================
// PERSONAGEM (ANIMAÇÃO)
// ===================================================
const personagemBatalha = {
    get x(){ return canvas.width * 0.22; },
    get y(){ return canvas.height * 0.62; },

    atacando: 0,
    duracaoAtaque: 18,
    offX: 0,

    frame: 0,
    tempo: 0
};

function atualizarPersonagem(){
    personagemBatalha.tempo++;

    if(personagemBatalha.tempo > 8){
        personagemBatalha.tempo = 0;
        personagemBatalha.frame = (personagemBatalha.frame + 1) % imagens.santaAnda.length;
    }

    if(personagemBatalha.atacando > 0){
        personagemBatalha.atacando--;
        const p = personagemBatalha.atacando / personagemBatalha.duracaoAtaque;
        personagemBatalha.offX = Math.sin(p * Math.PI) * 55;
    } else {
        personagemBatalha.offX = 0;
    }
}

function atacarAnimacao(){
    personagemBatalha.atacando = personagemBatalha.duracaoAtaque;
}


// ===================================================
// MONSTRO (VISUAL)
// ===================================================
const monstroBatalha = {
    get x(){ return canvas.width * 0.62; },
    get y(){ return canvas.height * 0.55; },

    tremendo: 0,
    flash: 0
};

function reagirDano(){
    monstroBatalha.tremendo = 10;
    monstroBatalha.flash = 6;
}


// ===================================================
// DANO / PROGRESSÃO
// ===================================================
function darDano(valor, tipo){
    if(!emBatalha) return;

    inimigo.hp -= valor;

    reagirDano();

    textos.push({
        x: monstroBatalha.x + (Math.random()-0.5)*80,
        y: monstroBatalha.y - 20,
        valor: "-" + formatarNum(valor),
        vida: 60
    });

    if(inimigo.hp <= 0){
        matarInimigo();
    }
}


function matarInimigo(){

    adicionarMoeda(inimigo.recompensaMoeda);

    if(inimigo.recompensaGema > 0){
        adicionarGema(inimigo.recompensaGema);
    }

    ganharExp(5 + estagio * 2);

    estagio++;

    configurarInimigo(estagio);
}


function ganharExp(qtd){

    personagem.exp += qtd;

    while(personagem.exp >= personagem.expMax){
        personagem.exp -= personagem.expMax;
        personagem.nivel++;
        personagem.expMax = Math.floor(100 * Math.pow(1.3, personagem.nivel-1));
    }
}


// ===================================================
// INICIALIZAÇÃO
// ===================================================
export function iniciarBatalha(){

    emBatalha = true;

    document.getElementById("uiBatalha").style.display = "flex";
    document.getElementById("lobbyHUD").style.display = "none";
    document.getElementById("lobbybotoes").style.display = "none";

    configurarInimigo(estagio);
    atualizarUIUpgrades();
    atualizarUIBatalha();
}


function configurarInimigo(e){

    const nome = nomeMonstro(e);
    const chefe = e % 10 === 0;

    inimigo.nome = nome + (chefe ? " [CHEFE]" : "") + " Lv." + e;
    inimigo.nivel = e;

    inimigo.maxHp = Math.floor(80 * Math.pow(1.22, e));
    inimigo.hp = inimigo.maxHp;

    inimigo.recompensaMoeda = Math.floor(10 * Math.pow(1.15, e));
    inimigo.recompensaGema = chefe ? Math.floor(5 + e/5) : (Math.random()<0.05 ? 1 : 0);

    setTimeout(()=>exibirFala(nome), 800);
}


// ===================================================
// INPUT (CLICK)
// ===================================================
canvas.addEventListener("click", ()=>{
    if(!emBatalha) return;

    darDano(calcularDanoClick(), "click");
    atacarAnimacao();
});


// ===================================================
// DPS PASSIVO
// ===================================================
setInterval(()=>{
    if(!emBatalha) return;
    darDano(calcularDps(), "dps");
}, 1000);


// ===================================================
// UI
// ===================================================
export function atualizarUIBatalha(){

    if(!emBatalha) return;

    const hp = Math.max(0, inimigo.hp);
    const pct = (hp / inimigo.maxHp) * 100;

    document.getElementById("hpInimigo").style.width = pct + "%";
    document.getElementById("nomeInimigo").innerText = inimigo.nome;
    document.getElementById("hpTexto").innerText =
        `❤ ${formatarNum(hp)} / ${formatarNum(inimigo.maxHp)}`;

    document.getElementById("estagioNum").innerText = estagio;

    document.getElementById("danoTaqueUI").innerText =
        "👆 " + formatarNum(calcularDanoClick());

    document.getElementById("dpsUI").innerText =
        "⚡ " + formatarNum(calcularDps());
}


// ===================================================
// UPDATE (CHAMADO PELO LOOP)
// ===================================================
export function atualizarBatalha(){

    if(!emBatalha) return;

    atualizarPersonagem();

    textos.forEach(t=>{
        t.y -= 1.2;
        t.vida--;
    });

    textos = textos.filter(t => t.vida > 0);
}
