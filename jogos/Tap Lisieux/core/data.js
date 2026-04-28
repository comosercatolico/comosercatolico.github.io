// ═══════════════════════════════════════════════════════════
//  DATA.JS — Dados estáticos do jogo (monstros, pool gacha)
// ═══════════════════════════════════════════════════════════
"use strict";

// ════════════════════════════════════════
//  MONSTROS
// ════════════════════════════════════════
const tiposMonstros = Object.freeze([
    {
        nome: "Demônio da Ira",
        emojis: { normal:"😈", dor:"😖", medo:"😱", raiva:"👿", morte:"💀" },
        cor: "#ff4444",
        asset: "slime"
    },
    {
        nome: "Espírito Maligno",
        emojis: { normal:"👻", dor:"😵", medo:"😨", raiva:"💢", morte:"💀" },
        cor: "#8844ff",
        asset: "slime"
    },
    {
        nome: "Sombra Corrompida",
        emojis: { normal:"🕷️", dor:"😣", medo:"😰", raiva:"🕷️", morte:"💀" },
        cor: "#444488",
        asset: "saga"
    },
    {
        nome: "Pavão do Orgulho",
        emojis: { normal:"🦚", dor:"👁️", medo:"😨", raiva:"💢", morte:"✨" },
        cor: "#ffd700",
        asset: "orgulho"
    },
    {
        nome: "Hidra da Inveja",
        emojis: { normal:"🐍", dor:"🤢", medo:"😰", raiva:"🐲", morte:"💀" },
        cor: "#2ecc71",
        asset: "inveja"
    },
    {
        nome: "Anjo Caído",
        emojis: { normal:"😤", dor:"🥴", medo:"😰", raiva:"🔥", morte:"💀" },
        cor: "#ff8844",
        asset: "saga"
    },
    {
        nome: "Chefe das Trevas",
        emojis: { normal:"💀", dor:"😣", medo:"😱", raiva:"😡", morte:"✨" },
        cor: "#ffaa00",
        asset: "saga"
    }
]);

const nomesEstagio = Object.freeze([
    "Jardim das Sombras",     "Cripta Maldita",          "Floresta Corrompida",
    "Vale Glacial",           "Picos de Gelo",            "Fortaleza de Cristal",
    "Portões do Inferno",     "Rio de Lava",              "Trono de Lúcifer",
    "Domínio do Orgulho",     "Palácio das Vaidades",     "Labirinto da Inveja",
    "Pântano Corrosivo",      "Abismo do Caos",           "Cume Celestial",
]);

const cenariosEstagio = Object.freeze([
    { min: 1,  max: 10, asset: "cenario1" },
    { min: 11, max: 20, asset: "cenario_glacial" },
    { min: 21, max: 30, asset: "cenario_inferno" },
    { min: 31, max: 999, asset: "cenario1" }
]);

function getCenarioEstagio(e) {
    const c = cenariosEstagio.find(s => e >= s.min && e <= s.max);
    return c ? c.asset : "cenario1";
}

const falasMonstros = Object.freeze({
    "Demônio da Ira":     ["Sua fé não te salva!", "Nem suas rosas te protegem!", "Você é fraca demais!", "Vai chorar pro seu Deus?", "Suas orações são vazias!"],
    "Espírito Maligno":   ["Florzinhas? Ridículo!", "Desista, santinha!", "Sua fé não vale nada aqui!", "A escuridão é eterna!"],
    "Sombra Corrompida":  ["A escuridão vence!", "Suas rosas murcham diante de mim!", "A luz não alcança aqui!"],
    "Pavão do Orgulho":   ["Olhe para minha beleza!", "Você é pequena e insignificante!", "Curve-se diante da minha glória!", "Sua humildade me enoja!"],
    "Hidra da Inveja":    ["Eu quero o que é seu!", "Por que você tem tanta luz?", "Vou apagar seu brilho!", "Sua pureza me consome!"],
    "Chefe das Trevas":   ["Eu sou ETERNO!", "A santa mais fraca que já enfrentei!", "Nenhuma prece te salva de mim!"],
    "Anjo Caído":         ["Caí por ESCOLHA!", "A liberdade tem um preço!", "A luz me repulsa!"],
});

function getNomeMonstro(e) {
    if (e % 10 === 0) return 3; // sempre chefe a cada 10
    return Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
}

function getNomeEstagio(e) {
    return nomesEstagio[(e - 1) % nomesEstagio.length];
}

function getFalaMonstro(nomeBase) {
    const falas = falasMonstros[nomeBase] ?? falasMonstros["Demônio da Ira"];
    return falas[Math.floor(Math.random() * falas.length)];
}

// ════════════════════════════════════════
//  POOL GACHA
// ════════════════════════════════════════
const poolHerois = Object.freeze([
    { nome:"Anjo Gabriel",       raridade:"Raro",     emoji:"😇", arma:"Espada de Luz",    bonus: "Ataque +15%" },
    { nome:"São Francisco",      raridade:"Comum",    emoji:"🕊️", arma:"Cajado Sagrado",   bonus: "DPS +8%"    },
    { nome:"São José",           raridade:"Comum",    emoji:"🔨", arma:"Martelo Bento",    bonus: "Defesa +5%" },
    { nome:"Santa Cecília",      raridade:"Épico",    emoji:"🎵", arma:"Harpa Celestial",  bonus: "Moeda +20%" },
    { nome:"São Miguel",         raridade:"Lendário", emoji:"⚔️", arma:"Lança Divina",     bonus: "Ataque +50%"},
    { nome:"Santa Luzia",        raridade:"Raro",     emoji:"👁️", arma:"Vela da Graça",    bonus: "Crítico +5%"},
    { nome:"Santo Antônio",      raridade:"Raro",     emoji:"📖", arma:"Livro Sagrado",    bonus: "Exp +15%"  },
    { nome:"São Bento",          raridade:"Épico",    emoji:"✝️", arma:"Cruz de São Bento",bonus: "DPS +30%"  },
    { nome:"Santa Catarina",     raridade:"Raro",     emoji:"⚙️", arma:"Roda da Sabedoria",bonus: "Custo -10%"},
    { nome:"São Sebastião",      raridade:"Comum",    emoji:"🏹", arma:"Arco Abençoado",   bonus: "Ataque +6%"},
    { nome:"São Jorge",          raridade:"Épico",    emoji:"🐉", arma:"Lança de São Jorge",bonus:"Chefe +40%"},
    { nome:"Nossa Senhora",      raridade:"Lendário", emoji:"🌹", arma:"Rosário Sagrado",  bonus: "Todos +35%"},
]);

const poolArmas = Object.freeze([
    { nome:"Rosas Sagradas",        raridade:"Comum",    emoji:"🌹", dano: 50   },
    { nome:"Lírios do Céu",         raridade:"Raro",     emoji:"🌸", dano: 130  },
    { nome:"Coroa de Espinhos",     raridade:"Épico",    emoji:"👑", dano: 320  },
    { nome:"Pétala Divina",         raridade:"Lendário", emoji:"✨", dano: 900  },
    { nome:"Terço Abençoado",       raridade:"Raro",     emoji:"📿", dano: 120  },
    { nome:"Vela da Misericórdia",  raridade:"Épico",    emoji:"🕯️", dano: 300  },
    { nome:"Incensário Celestial",  raridade:"Raro",     emoji:"🔥", dano: 140  },
    { nome:"Cálice da Graça",       raridade:"Épico",    emoji:"🏆", dano: 350  },
    { nome:"Coroa Estelar",         raridade:"Lendário", emoji:"⭐", dano: 1100 },
    { nome:"Espinho Sagrado",       raridade:"Comum",    emoji:"🌿", dano: 40   },
    { nome:"Sino da Paz",           raridade:"Raro",     emoji:"🔔", dano: 110  },
    { nome:"Martelo Bento",         raridade:"Épico",    emoji:"🔱", dano: 280  },
]);

const POOL_TOTAL = Object.freeze([...poolHerois, ...poolArmas]);

// ════════════════════════════════════════
//  CONQUISTAS
// ════════════════════════════════════════
const CONQUISTAS_DEF = Object.freeze([
    { id:"primeiro_kill",  nome:"Primeira Batalha",   desc:"Derrote seu 1º inimigo",        emoji:"⚔️", recompensa:{gema:10},          check:()=>(window._totalKills??0)>=1 },
    { id:"kill_10",        nome:"Guerreira",           desc:"Derrote 10 inimigos",            emoji:"💀", recompensa:{gema:25},          check:()=>(window._totalKills??0)>=10 },
    { id:"kill_50",        nome:"Caçadora",            desc:"Derrote 50 inimigos",            emoji:"🗡️", recompensa:{gema:50},          check:()=>(window._totalKills??0)>=50 },
    { id:"kill_100",       nome:"Caçadora Santa",      desc:"Derrote 100 inimigos",           emoji:"🌟", recompensa:{gema:100},         check:()=>(window._totalKills??0)>=100 },
    { id:"estagio_10",     nome:"Exploradora",         desc:"Alcance o estágio 10",           emoji:"🗺️", recompensa:{gema:30},          check:()=>BattleState.estagio>=10 },
    { id:"estagio_30",     nome:"Peregrina",           desc:"Alcance o estágio 30",           emoji:"🌸", recompensa:{gema:80},          check:()=>BattleState.estagio>=30 },
    { id:"estagio_50",     nome:"Cruzada",             desc:"Alcance o estágio 50",           emoji:"✝️", recompensa:{gema:150},         check:()=>BattleState.estagio>=50 },
    { id:"primeiro_lend",  nome:"Abençoada",           desc:"Obtenha um item Lendário",       emoji:"✨", recompensa:{gema:100},         check:()=>[...Inventario.herois,...Inventario.armas].some(i=>i.raridade==="Lendário") },
    { id:"upgrade_10",     nome:"Aprimorada",          desc:"Realize 10 upgrades",            emoji:"📈", recompensa:{moeda:500},        check:()=>(window._totalUpgrades??0)>=10 },
    { id:"upgrade_50",     nome:"Mestra",              desc:"Realize 50 upgrades",            emoji:"💪", recompensa:{gema:75},          check:()=>(window._totalUpgrades??0)>=50 },
    { id:"prestigio_1",    nome:"Renascida",           desc:"Faça seu 1º Prestígio",          emoji:"🌸", recompensa:{gema:200},         check:()=>(window._totalPrestígios??0)>=1 },
    { id:"gacha_10",       nome:"Devota",              desc:"Faça 10 invocações",             emoji:"🙏", recompensa:{gema:50},          check:()=>(window._totalPulls??0)>=10 },
    { id:"gacha_50",       nome:"Mística",             desc:"Faça 50 invocações",             emoji:"🌙", recompensa:{gema:150},         check:()=>(window._totalPulls??0)>=50 },
    { id:"crit_50",        nome:"Toque Divino",        desc:"Acerte 50 críticos",             emoji:"💥", recompensa:{gema:40},          check:()=>(window._totalCrits??0)>=50 },
]);
