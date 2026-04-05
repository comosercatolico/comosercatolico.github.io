/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 1
   Base: Canvas, anéis, estrutura, cores
   ================================================ */

const CAL = {

  // ── Paleta moderna ──────────────────────────────
  cores: {
    advento:      { principal: "#7B2FBE", claro: "#9D5FD6", escuro: "#4A1080" },
    natal:        { principal: "#C8A84B", claro: "#E8CC7A", escuro: "#8B6914" },
    tempoComum:   { principal: "#2D6A2D", claro: "#4A9A4A", escuro: "#1A3D1A" },
    quaresma:     { principal: "#4A1060", claro: "#7B2FA0", escuro: "#280838" },
    semanaS:      { principal: "#8B0000", claro: "#B22020", escuro: "#500000" },
    triduo:       { principal: "#5A0010", claro: "#8B1020", escuro: "#300008" },
    pascal:       { principal: "#B8860B", claro: "#DCA520", escuro: "#785808" },
    pentecostes:  { principal: "#CC2200", claro: "#E84422", escuro: "#881400" },
    fundo:        "#0D0D0D",
    bordaOuro:    "#C5A96A",
    bordaOuroClaro: "#E8CC8A",
    centro:       "#1A1208",
  },

  // ── Raios relativos (proporção do raio total) ───
  raios: {
    externo:    0.97,   // borda de fora
    datas:      0.90,   // faixa das datas
    nomes:      0.76,   // faixa dos nomes das semanas
    tempos:     0.61,   // faixa do nome do tempo
    interno:    0.50,   // início do círculo central
  },

  // ── Tipografia ──────────────────────────────────
  fonte: {
    data:   (s) => `${Math.max(9, s * 0.016)}px 'Inter', sans-serif`,
    semana: (s) => `${Math.max(8, s * 0.018)}px 'Inter', sans-serif`,
    tempo:  (s) => `bold ${Math.max(9, s * 0.020)}px 'Inter', sans-serif`,
  },

};

/* ────────────────────────────────────────────────
   FUNÇÕES MATEMÁTICAS BASE
──────────────────────────────────────────────── */

/** Converte semana (índice) → ângulo em radianos
 *  Topo = -90° = início do Advento */
function sToAng(semana, total) {
  return -Math.PI / 2 + (semana / total) * (2 * Math.PI);
}

/** Ponto (x,y) num raio e ângulo */
function ponto(cx, cy, raio, ang) {
  return {
    x: cx + raio * Math.cos(ang),
    y: cy + raio * Math.sin(ang),
  };
}

/** Retângulo com cantos arredondados (path) */
function pathRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ────────────────────────────────────────────────
   ALGORITMOS LITÚRGICOS
──────────────────────────────────────────────── */

/** Páscoa — algoritmo de Meeus/Jones/Butcher */
function calcPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

/** 1º domingo do Advento (4 domingos antes do Natal) */
function calcAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const dow   = natal.getDay(); // 0=Dom
  const dias  = dow === 0 ? 28 : 28 - dow + (dow > 0 ? 0 : 0);
  // 4 domingos antes = natal - dow - 21 dias
  const adv = new Date(natal);
  adv.setDate(25 - dow - 21);
  return adv;
}

/** Diferença em semanas inteiras entre duas datas */
function semanasDiff(dataA, dataB) {
  return Math.floor((dataB - dataA) / (7 * 24 * 3600 * 1000));
}

/** Semana litúrgica atual (0-based desde o Advento) */
function semanaAtual() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();

  let inicio = calcAdvento(ano - 1);
  const prox = calcAdvento(ano);

  if (hoje >= prox) inicio = prox;

  const s = semanasDiff(inicio, hoje);
  return Math.max(0, Math.min(51, s));
}

/* ────────────────────────────────────────────────
   CONSTRUIR SEGMENTOS DO ANO LITÚRGICO
   Retorna array de { inicio, fim, cor, nome, tempo }
──────────────────────────────────────────────── */

function buildSegmentos(ano) {
  const inicioAdv = calcAdvento(ano - 1);
  const pascoa    = calcPascoa(ano);
  const total     = 52;

  // Helper: semana desde o início do Advento
  const sw = (data) => Math.max(0, Math.min(total - 1, semanasDiff(inicioAdv, data)));

  // Datas-chave
  const natal         = new Date(ano - 1, 11, 25);
  const epifania      = new Date(ano, 0, 6);
  const batismo       = new Date(ano, 0, 13); // domingo após epifania
  const cinzas        = new Date(pascoa); cinzas.setDate(pascoa.getDate() - 46);
  const domPalmas     = new Date(pascoa); domPalmas.setDate(pascoa.getDate() - 7);
  const quintaSanta   = new Date(pascoa); quintaSanta.setDate(pascoa.getDate() - 3);
  const pentecostes   = new Date(pascoa); pentecostes.setDate(pascoa.getDate() + 49);
  const corpusChristi = new Date(pascoa); corpusChristi.setDate(pascoa.getDate() + 63);
  const cristoRei     = calcAdvento(ano); cristoRei.setDate(cristoRei.getDate() - 7);

  const C = CAL.cores;

  // ── Índices de semana ──
  const iAdv      = 0;
  const iNatal    = sw(natal);
  const iBatismo  = sw(batismo) + 1;
  const iCinzas   = sw(cinzas);
  const iPalmas   = sw(domPalmas);
  const iTriduo   = sw(quintaSanta);
  const iPascoa   = sw(pascoa);
  const iPente    = sw(pentecostes);
  const iCorpus   = sw(corpusChristi);
  const iCristoRei = sw(cristoRei);

  const segs = [];

  // ── ADVENTO (roxo) ──
  for (let i = iAdv; i < iNatal; i++) {
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.advento.principal,
      corBrilho: C.advento.claro,
      nome: `${i - iAdv + 1}ª sem.`,
      tempo: "Advento",
    });
  }

  // ── NATAL (dourado) ──
  for (let i = iNatal; i < iBatismo; i++) {
    let nome = `${i - iNatal + 1}ª sem.`;
    if (i === iNatal)           nome = "Natal";
    if (i === sw(epifania))     nome = "Epifania";
    if (i === sw(batismo))      nome = "Batismo";
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.natal.principal,
      corBrilho: C.natal.claro,
      nome, tempo: "Natal",
    });
  }

  // ── TEMPO COMUM I (verde) ──
  for (let i = iBatismo; i < iCinzas; i++) {
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.tempoComum.principal,
      corBrilho: C.tempoComum.claro,
      nome: `${i - iBatismo + 1}ª sem.`,
      tempo: "Tempo Comum",
    });
  }

  // ── QUARESMA (roxo escuro) ──
  for (let i = iCinzas; i < iPalmas; i++) {
    let nome = `${i - iCinzas + 1}ª sem.`;
    if (i === iCinzas) nome = "Cinzas";
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.quaresma.principal,
      corBrilho: C.quaresma.claro,
      nome, tempo: "Quaresma",
    });
  }

  // ── SEMANA SANTA (vermelho escuro) ──
  segs.push({
    inicio: iPalmas, fim: iTriduo,
    cor: C.semanaS.principal,
    corBrilho: C.semanaS.claro,
    nome: "Semana Santa",
    tempo: "Semana Santa",
  });

  // ── TRÍDUO PASCAL (bordô) ──
  segs.push({
    inicio: iTriduo, fim: iPascoa,
    cor: C.triduo.principal,
    corBrilho: C.triduo.claro,
    nome: "Tríduo",
    tempo: "Tríduo Pascal",
  });

  // ── TEMPO PASCAL (âmbar/dourado) ──
  for (let i = iPascoa; i < iPente; i++) {
    let nome = `${i - iPascoa + 1}ª sem.`;
    if (i === iPascoa) nome = "Páscoa";
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.pascal.principal,
      corBrilho: C.pascal.claro,
      nome, tempo: "Tempo Pascal",
    });
  }

  // ── PENTECOSTES (vermelho vivo) ──
  segs.push({
    inicio: iPente, fim: iPente + 1,
    cor: C.pentecostes.principal,
    corBrilho: C.pentecostes.claro,
    nome: "Pentecostes",
    tempo: "Pentecostes",
  });

  // ── TEMPO COMUM II (verde) ──
  for (let i = iPente + 1; i <= total - 1; i++) {
    let nome = `${i - iPente}ª sem.`;
    if (i === iCorpus)    nome = "Corpus Christi";
    if (i === iCristoRei) nome = "Cristo Rei";
    segs.push({
      inicio: i, fim: i + 1,
      cor: C.tempoComum.principal,
      corBrilho: C.tempoComum.claro,
      nome, tempo: "Tempo Comum",
    });
  }

  return { segs, inicioAdv, total };
}

/* ────────────────────────────────────────────────
   DESENHAR ANEL BASE (fatias)
──────────────────────────────────────────────── */

function desenharAnelBase(ctx, cx, cy, R, segs, total) {
  const rO = R * CAL.raios.externo;
  const rI = R * CAL.raios.interno;

  segs.forEach((seg) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = a2 - a1;

    // ── Fatia principal ──
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = seg.cor;
    ctx.fill();

    // ── Brilho radial (toque moderno) ──
    const gBrilho = ctx.createRadialGradient(cx, cy, rI * 0.95, cx, cy, rO);
    gBrilho.addColorStop(0,   "rgba(255,255,255,0.12)");
    gBrilho.addColorStop(0.5, "rgba(255,255,255,0.04)");
    gBrilho.addColorStop(1,   "rgba(0,0,0,0.18)");
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = gBrilho;
    ctx.fill();

    // ── Linha divisória entre semanas ──
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.lineTo(cx + rO * Math.cos(a1), cy + rO * Math.sin(a1));
    ctx.strokeStyle = "rgba(0,0,0,0.30)";
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  });

  // ── Borda externa ──
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, 2 * Math.PI);
  ctx.strokeStyle = CAL.cores.bordaOuro;
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // ── Borda interna do anel ──
  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(197,169,106,0.40)";
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}

/* ────────────────────────────────────────────────
   FUNDO DO CANVAS
──────────────────────────────────────────────── */

function desenharFundo(ctx, cx, cy, R, mini) {
  // Fundo geral do canvas
  ctx.clearRect(0, 0, cx * 2, cy * 2);

  // Fundo circular escuro com gradiente sutil
  const gFundo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  gFundo.addColorStop(0,   mini ? "#1a1a1a" : "#161008");
  gFundo.addColorStop(0.6, mini ? "#111111" : "#0D0A04");
  gFundo.addColorStop(1,   mini ? "#0a0a0a" : "#050300");

  ctx.beginPath();
  ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI);
  ctx.fillStyle = gFundo;
  ctx.fill();
}

/* ────────────────────────────────────────────────
   EXPORTAR para os outros arquivos
──────────────────────────────────────────────── */

window.CalBase = {
  CAL,
  sToAng,
  ponto,
  pathRect,
  calcPascoa,
  calcAdvento,
  semanasDiff,
  semanaAtual,
  buildSegmentos,
  desenharFundo,
  desenharAnelBase,
};
