// ===================================================
// ECONOMIA (moedas, gemas, energia, HUD básico)
// ===================================================

import { formatarNum } from "./utils.js";


// ===================================================
// RECURSOS DO JOGADOR
// ===================================================
export let moeda = 0;
export let gema = 50;


// ===================================================
// ENERGIA (SISTEMA PASSIVO)
// ===================================================
export const energia = {
    atual: 100,
    max: 100
};


// ===================================================
// ATUALIZAR HUD DO LOBBY
// ===================================================
export function atualizarHUDLobby(){
    const moedaEl = document.getElementById("hudMoedaVal");
    const gemaEl  = document.getElementById("hudGemaVal");

    if(moedaEl) moedaEl.innerText = formatarNum(moeda);
    if(gemaEl)  gemaEl.innerText  = formatarNum(gema);
}


// ===================================================
// ATUALIZAR ENERGIA AUTOMATICAMENTE
// ===================================================
export function iniciarEnergia(){

    setInterval(()=>{

        if(energia.atual < energia.max){
            energia.atual = Math.min(energia.max, energia.atual + 1);
        }

        const el = document.getElementById("hudEnergiaVal");
        if(el){
            el.innerText = energia.atual + "/" + energia.max;
        }

    }, 30000); // 30 segundos
}


// ===================================================
// FUNÇÕES DE ALTERAÇÃO (MELHOR PRÁTICA)
// ===================================================

export function adicionarMoeda(valor){
    moeda += valor;
    atualizarHUDLobby();
}

export function gastarMoeda(valor){
    if(moeda < valor) return false;
    moeda -= valor;
    atualizarHUDLobby();
    return true;
}

export function adicionarGema(valor){
    gema += valor;
    atualizarHUDLobby();
}

export function gastarGema(valor){
    if(gema < valor) return false;
    gema -= valor;
    atualizarHUDLobby();
    return true;
}
