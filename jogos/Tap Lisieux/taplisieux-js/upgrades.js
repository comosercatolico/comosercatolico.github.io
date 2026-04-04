// ===================================================
// UPGRADES (dano, DPS, velocidade, custo)
// ===================================================

import { moeda, gastarMoeda } from "./economia.js";
import { formatarNum } from "./utils.js";


// ===================================================
// DADOS DOS UPGRADES
// ===================================================
export const upgrades = {
    forca:{
        nivel:1,
        base:5,
        mult:1.5,
        custoBase:15,
        custoCres:1.6,

        get dano(){
            return Math.floor(this.base * Math.pow(this.mult, this.nivel - 1));
        },

        get custo(){
            return Math.floor(this.custoBase * Math.pow(this.custoCres, this.nivel - 1));
        }
    },

    rosa:{
        nivel:1,
        base:3,
        mult:1.4,
        custoBase:20,
        custoCres:1.65,

        get dano(){
            return Math.floor(this.base * Math.pow(this.mult, this.nivel - 1));
        },

        get custo(){
            return Math.floor(this.custoBase * Math.pow(this.custoCres, this.nivel - 1));
        }
    },

    velocidade:{
        nivel:1,
        base:1,
        mult:1.1,
        custoBase:30,
        custoCres:1.7,

        get bonus(){
            return parseFloat(
                (this.base * Math.pow(this.mult, this.nivel - 1)).toFixed(2)
            );
        },

        get custo(){
            return Math.floor(this.custoBase * Math.pow(this.custoCres, this.nivel - 1));
        }
    },

    dps:{
        nivel:1,
        base:2,
        mult:1.6,
        custoBase:25,
        custoCres:1.7,

        get valor(){
            return Math.floor(this.base * Math.pow(this.mult, this.nivel - 1));
        },

        get custo(){
            return Math.floor(this.custoBase * Math.pow(this.custoCres, this.nivel - 1));
        }
    }
};


// ===================================================
// CÁLCULOS
// ===================================================
export function calcularDanoClick(){
    return Math.floor(
        (upgrades.forca.dano + upgrades.rosa.dano) *
        upgrades.velocidade.bonus
    );
}

export function calcularDps(){
    return upgrades.dps.valor;
}


// ===================================================
// COMPRA DE UPGRADE
// ===================================================
export function comprarUpgrade(tipo){

    const up = upgrades[tipo];
    if(!up) return;

    // usa sistema de economia (boa prática)
    if(!gastarMoeda(up.custo)) return;

    up.nivel++;

    atualizarUIUpgrades();
}


// ===================================================
// UI DOS UPGRADES
// ===================================================
export function atualizarUIUpgrades(){

    const u = upgrades;

    const el = (id, txt)=>{
        const e = document.getElementById(id);
        if(e) e.innerText = txt;
    };

    const btn = (id, txt, desativado)=>{
        const e = document.getElementById(id);
        if(e){
            e.innerText = txt;
            e.disabled = desativado;
        }
    };

    // textos
    el("forcaAtualTxt", `Nv.${u.forca.nivel} | +${formatarNum(u.forca.dano)} dano`);
    el("rosaAtualTxt",  `Nv.${u.rosa.nivel}  | +${formatarNum(u.rosa.dano)} dano`);
    el("velAtualTxt",   `Nv.${u.velocidade.nivel} | x${u.velocidade.bonus}`);
    el("dpsAtualTxt",   `Nv.${u.dps.nivel}  | +${formatarNum(u.dps.valor)} DPS`);

    // botões
    btn("btnForca",      `🪙 ${formatarNum(u.forca.custo)}`,      moeda < u.forca.custo);
    btn("btnRosa",       `🪙 ${formatarNum(u.rosa.custo)}`,       moeda < u.rosa.custo);
    btn("btnVelocidade", `🪙 ${formatarNum(u.velocidade.custo)}`, moeda < u.velocidade.custo);
    btn("btnDps",        `🪙 ${formatarNum(u.dps.custo)}`,        moeda < u.dps.custo);
}
