/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 1
   Base: configurações, matemática, dados
   ================================================ */

const CAL = {

  // ── Paleta moderna e minimalista ───────────────
  cores: {
    advento:     { base: "#8B5CF6", brilho: "#A78BFA", sombra: "#4C1D95" },
    natal:       { base: "#F59E0B", brilho: "#FCD34D", sombra: "#92400E" },
    tempoComum:  { base: "#10B981", brilho: "#34D399", sombra: "#064E3B" },
    quaresma:    { base: "#7C3AED", brilho: "#8B5CF6", sombra: "#3B0764" },
    semanaS:     { base: "#DC2626", brilho: "#EF4444", sombra: "#7F1D1D" },
    triduo:      { base: "#991B1B", brilho: "#DC2626", sombra: "#450A0A" },
    pascal:      { base: "#D97706", brilho: "#F59E0B", sombra: "#78350F" },
    pentecostes: { base: "#EF4444", brilho: "#F87171", sombra: "#7F1D1D" },

    // UI
    fundo:       "#080808",
    anel:        "rgba(255,255,255,0.04)",
    bordaOuro:   "#D4A853",
    ouroClaro:   "#F0C96A",
    ouroDark:    "#8B6914",
    hoje:        "#00F5A0",
    hojeGlow:    "rgba(0,245,160,0.4)",
    texto:       "rgba(255,255,255,0.90)",
    textoSuave:  "rgba(255,255,255,0.45)",
  },

  // ── Raios (proporção do raio total R) ──────────
  r: {
    externo:  0.96,
    datas:    0.875,
    semanas:  0.75,
    tempos:   0.60,
    centro:   0.48,
  },

  // ── Fontes ─────────────────────────────────────
  font: {
    data:   (s) => `${Math.max(8,  Math.round(s * 0.0155))}px Inter, sans-serif`,
    semana: (s) => `${Math.max(7,  Math.round(s * 0.0165))}px Inter, sans-serif`,
    tempo:  (s) => `600 ${Math.max(8, Math.round(s * 0.019))}px Inter, sans-serif`,
    centro: (s) => `300 ${Math.round(s * 0.038)}px Inter, sans-serif`,
    simbolo:(s) => `${Math.round(s * 0.13)}px serif`,
  },

};

/* ════════════════════════════════════════════════
   MATEMÁTICA BASE
════════════════════════════════════════════════ */

/** Semana → ângulo. Topo (-90°) = início do Advento */
function sToAng(semana, total) {
  return -Math.PI / 2 + (semana / total) * (2 * Math.PI);
}

/** Ponto num ângulo e raio */
function pt(cx, cy, r, ang) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

/** Path de retângulo com cantos arredondados */
function roundRect(ctx, x, y, w, h, r) {
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

/* ════════════════════════════════════════════════
   CÁLCULOS LITÚRGICOS
════════════════════════════════════════════════ */

/** Páscoa — Meeus/Jones/Butcher */
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

/** 1º domingo do Advento */
function calcAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const dow   = natal.getDay();
  const adv   = new Date(natal);
  adv.setDate(25 - dow - 21);
  return adv;
}

/** Diferença em semanas */
function diffSem(a, b) {
  return Math.floor((b - a) / (7 * 86400000));
}

/** Semana litúrgica atual (0-based) */
function semanaAtual() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  let ini    = calcAdvento(ano - 1);
  const prox = calcAdvento(ano);
  if (hoje >= prox) ini = prox;
  return Math.max(0, Math.min(51, diffSem(ini, hoje)));
}

/* ════════════════════════════════════════════════
   CONSTRUIR SEGMENTOS DO ANO LITÚRGICO
════════════════════════════════════════════════ */

function buildSegmentos(ano) {
  const ini    = calcAdvento(ano - 1);
  const pascoa = calcPascoa(ano);
  const TOTAL  = 52;

  const sw = (d) => Math.max(0, Math.min(TOTAL - 1, diffSem(ini, d)));

  // Datas-chave
  const natal       = new Date(ano - 1, 11, 25);
  const epifania    = new Date(ano, 0, 6);
  const batismo     = new Date(ano, 0, 12);
  const cinzas      = new Date(pascoa); cinzas.setDate(pascoa.getDate() - 46);
  const palmas      = new Date(pascoa); palmas.setDate(pascoa.getDate() - 7);
  const quintaS     = new Date(pascoa); quintaS.setDate(pascoa.getDate() - 3);
  const pentecostes = new Date(pascoa); pentecostes.setDate(pascoa.getDate() + 49);
  const corpus      = new Date(pascoa); corpus.setDate(pascoa.getDate() + 63);
  const cristoRei   = calcAdvento(ano); cristoRei.setDate(cristoRei.getDate() - 7);

  const C = CAL.cores;

  // Índices
  const iAdv    = 0;
  const iNatal  = sw(natal);
  const iBat    = sw(batismo) + 1;
  const iCinzas = sw(cinzas);
  const iPalmas = sw(palmas);
  const iTriduo = sw(quintaS);
  const iPascoa = sw(pascoa);
  const iPente  = sw(pentecostes);
  const iCorpus = sw(corpus);
  const iCRei   = sw(cristoRei);

  const segs = [];

  const push = (inicio, fim, cor, nome, tempo) =>
    segs.push({ inicio, fim, cor, nome, tempo });

  // ADVENTO
  for (let i = iAdv; i < iNatal; i++) {
    push(i, i + 1, C.advento, `${i + 1}ª sem.`, "Advento");
  }

  // NATAL
  for (let i = iNatal; i < iBat; i++) {
    let nome = `${i - iNatal + 1}ª sem.`;
    if (i === iNatal)        nome = "Natal";
    if (i === sw(epifania))  nome = "Epifania";
    if (i === sw(batismo))   nome = "Batismo";
    push(i, i + 1, C.natal, nome, "Natal");
  }

  // TEMPO COMUM I
  for (let i = iBat; i < iCinzas; i++) {
    push(i, i + 1, C.tempoComum, `${i - iBat + 1}ª sem.`, "Tempo Comum");
  }

  // QUARESMA
  for (let i = iCinzas; i < iPalmas; i++) {
    const nome = i === iCinzas ? "Cinzas" : `${i - iCinzas + 1}ª sem.`;
    push(i, i + 1, C.quaresma, nome, "Quaresma");
  }

  // SEMANA SANTA
  push(iPalmas, iTriduo, C.semanaS, "Semana Santa", "Semana Santa");

  // TRÍDUO
  push(iTriduo, iPascoa, C.triduo, "Tríduo", "Tríduo Pascal");

  // TEMPO PASCAL
  for (let i = iPascoa; i < iPente; i++) {
    const nome = i === iPascoa ? "Páscoa" : `${i - iPascoa + 1}ª sem.`;
    push(i, i + 1, C.pascal, nome, "Tempo Pascal");
  }

  // PENTECOSTES
  push(iPente, iPente + 1, C.pentecostes, "Pentecostes", "Pentecostes");

  // TEMPO COMUM II
  for (let i = iPente + 1; i < TOTAL; i++) {
    let nome = `${i - iPente}ª sem.`;
    if (i === iCorpus) nome = "Corpus Christi";
    if (i === iCRei)   nome = "Cristo Rei";
    push(i, i + 1, C.tempoComum, nome, "Tempo Comum");
  }

  return { segs, ini, total: TOTAL };
}

/* ════════════════════════════════════════════════
   DESENHAR FUNDO
════════════════════════════════════════════════ */

function desenharFundo(ctx, cx, cy, R, mini) {
  ctx.clearRect(0, 0, cx * 2, cy * 2);

  // Fundo preto profundo com gradiente sutil
  const g = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, R * 1.1);
  g.addColorStop(0,   mini ? "#1a1a1a" : "#111111");
  g.addColorStop(0.5, mini ? "#111111" : "#0a0a0a");
  g.addColorStop(1,   "#050505");

  ctx.beginPath();
  ctx.arc(cx, cy, R + 4, 0, 2 * Math.PI);
  ctx.fillStyle = g;
  ctx.fill();
}

/* ════════════════════════════════════════════════
   DESENHAR ANEL BASE (fatias)
════════════════════════════════════════════════ */

function desenharAnelBase(ctx, cx, cy, R, segs, total) {
  const rO = R * CAL.r.externo;
  const rI = R * CAL.r.centro;

  segs.forEach((seg) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;

    // ── Fatia base ──
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = seg.cor.base;
    ctx.fill();

    // ── Overlay de brilho angular (lado claro) ──
    const gBrilho = ctx.createLinearGradient(
      cx + rI * Math.cos(aMid - 0.05), cy + rI * Math.sin(aMid - 0.05),
      cx + rO * Math.cos(aMid + 0.05), cy + rO * Math.sin(aMid + 0.05)
    );
    gBrilho.addColorStop(0,   "rgba(255,255,255,0.14)");
    gBrilho.addColorStop(0.4, "rgba(255,255,255,0.05)");
    gBrilho.addColorStop(1,   "rgba(0,0,0,0.15)");

    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = gBrilho;
    ctx.fill();

    // ── Linha divisória fina ──
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.lineTo(cx + rO * Math.cos(a1), cy + rO * Math.sin(a1));
    ctx.strokeStyle = "rgba(0,0,0,0.40)";
    ctx.lineWidth   = 0.7;
    ctx.stroke();
  });

  // ── Borda externa nítida ──
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Borda interna ──
  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  ctx.stroke();
}

/* ════════════════════════════════════════════════
   EXPORTAR
════════════════════════════════════════════════ */

window.CalBase = {
  CAL,
  sToAng,
  pt,
  roundRect,
  calcPascoa,
  calcAdvento,
  diffSem,
  semanaAtual,
  buildSegmentos,
  desenharFundo,
  desenharAnelBase,
};
