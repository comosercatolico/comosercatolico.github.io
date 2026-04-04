// ===================================================
// INVOCAÇÃO (gacha de heróis e equipamentos)
// ===================================================

import { gema, gastarGema, atualizarHUDLobby } from "./economia.js";


// ===================================================
// POOLS
// ===================================================
export const poolHerois = [
    {nome:"Anjo Gabriel",  raridade:"Raro",    emoji:"😇", arma:"Espada de Luz"},
    {nome:"São Francisco", raridade:"Comum",   emoji:"🕊", arma:"Cajado Sagrado"},
    {nome:"São José",      raridade:"Comum",   emoji:"⚒",  arma:"Martelo Bento"},
    {nome:"Santa Cecília", raridade:"Épico",   emoji:"🎵", arma:"Harpa Celestial"},
    {nome:"São Miguel",    raridade:"Lendário",emoji:"⚔", arma:"Lança Divina"},
    {nome:"Santa Luzia",   raridade:"Raro",    emoji:"👁", arma:"Vela da Graça"}
];

export const poolArmas = [
    {nome:"Rosas Sagradas",   raridade:"Comum",   emoji:"🌹", dano:50},
    {nome:"Lírios do Céu",    raridade:"Raro",    emoji:"🌸", dano:120},
    {nome:"Coroa de Espinhos",raridade:"Épico",   emoji:"👑", dano:300},
    {nome:"Pétala Divina",    raridade:"Lendário",emoji:"✨", dano:800}
];


// ===================================================
// INVENTÁRIO
// ===================================================
export let heroisObtidos = [];
export let equipamentosObtidos = [];

export const corRar = {
    "Comum":"#aaaaaa",
    "Raro":"#4488ff",
    "Épico":"#aa44ff",
    "Lendário":"#ffaa00"
};


// ===================================================
// SISTEMA DE INVOCAR
// ===================================================
export function invocar(qtd){

    const custo = 100 * qtd;

    // usa economia (melhor prática)
    if(!gastarGema(custo)){
        mostrarErroInvocacao(custo);
        return;
    }

    const resultados = [];

    for(let i = 0; i < qtd; i++){

        const roll = Math.random();
        let pool;

        if(roll < 0.01){
            pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Lendário");
        }
        else if(roll < 0.05){
            pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Épico");
        }
        else if(roll < 0.25){
            pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Raro");
        }
        else{
            pool = [...poolHerois, ...poolArmas].filter(x => x.raridade === "Comum");
        }

        const sorteado = pool[Math.floor(Math.random() * pool.length)];
        resultados.push(sorteado);
    }

    // separar heróis e armas
    resultados.forEach(r => {
        if(r.arma && !r.dano){
            heroisObtidos.push(r);
        }else{
            equipamentosObtidos.push(r);
        }
    });

    mostrarResultadoInvocacao(resultados);

    atualizarListaInvocacao();
    atualizarHUDLobby();
}


// ===================================================
// UI RESULTADO
// ===================================================
function mostrarResultadoInvocacao(resultados){

    const lend = resultados.filter(r => r.raridade === "Lendário").length;
    const epic = resultados.filter(r => r.raridade === "Épico").length;

    const texto = (resultados.length === 1)
        ? `${resultados[0].emoji} ${resultados[0].nome} (${resultados[0].raridade})!`
        : `✨ ${resultados.length} invocações! Lendários:${lend} Épicos:${epic}`;

    const cor = lend > 0 ? "#ffaa00" :
                epic > 0 ? "#aa44ff" :
                "#eeddff";

    ["invocarResultado","invocarResultado2"].forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.innerText = texto;
            el.style.color = cor;
        }
    });
}


// ===================================================
// ERRO (SEM GEMAS)
// ===================================================
function mostrarErroInvocacao(custo){

    ["invocarResultado","invocarResultado2"].forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.innerText = "❌ Gemas insuficientes! Precisa de 💎" + custo;
            el.style.color = "#ff4444";
        }
    });
}


// ===================================================
// LISTAS (UI)
// ===================================================
function tagHTML(item){
    return `<span class="heroiTag" 
        style="border-color:${corRar[item.raridade]};
               color:${corRar[item.raridade]}">
        ${item.emoji} ${item.nome}
    </span>`;
}

export function atualizarListaInvocacao(){

    ["listaHerois","listaHerois2"].forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.innerHTML = heroisObtidos.map(tagHTML).join("");
        }
    });

    ["listaEquipamentos","listaEquipamentos2"].forEach(id=>{
        const el = document.getElementById(id);
        if(el){
            el.innerHTML = equipamentosObtidos.map(a=>`
                <span class="armaTag"
                    style="border-color:${corRar[a.raridade]};
                           color:${corRar[a.raridade]}">
                    ${a.emoji} ${a.nome} (+${a.dano})
                </span>
            `).join("");
        }
    });
}


// ===================================================
// EQUIPAR (MODAL)
// ===================================================
export function atualizarListaEquipar(){

    const el = document.getElementById("listaEquipamentosEquipar");
    if(!el) return;

    if(equipamentosObtidos.length === 0){
        el.innerHTML = "<p style='color:#aaa;font-size:13px;'>Nenhuma arma obtida ainda.</p>";
        return;
    }

    el.innerHTML = equipamentosObtidos.map(a=>`
        <div class="upgradeItem">
            <div>
                ${a.emoji} <b>${a.nome}</b><br>
                <small style="color:${corRar[a.raridade]}">
                    ${a.raridade} | +${a.dano} dano
                </small>
            </div>
            <button class="btnUpgrade">Equipar</button>
        </div>
    `).join("");
}
