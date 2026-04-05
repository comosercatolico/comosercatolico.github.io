/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 1  (REBUILD TOTAL)
   Base: configurações, matemática, desenho do anel
   ================================================ */

/* ════════════════════════════════════════════════
   CONFIGURAÇÕES GLOBAIS
════════════════════════════════════════════════ */

const CAL = {

  cores: {
    advento:     { base: "#6B3FA0", light: "#9B6FD0", dark: "#3D1A6E", text: "#E8D5FF" },
    natal:       { base: "#C8A84B", light: "#F0CC70", dark: "#8B6914", text: "#FFF8DC" },
    tempoComum:  { base: "#2E8B4E", light: "#4DBF72", dark: "#1A5C30", text: "#D4FFE4" },
    quaresma:    { base: "#7B3FA0", light: "#A866D4", dark: "#4A1060", text: "#F0D8FF" },
    semanaS:     { base: "#C0392B", light: "#E74C3C", dark: "#7B1A10", text: "#FFD5D0" },
    triduo:      { base: "#8B1A1A", light: "#B22222", dark: "#4A0000", text: "#FFCCCC" },
    pascal:      { base: "#D4860A", light: "#F5A623", dark: "#8B5500", text: "#FFF3CC" },
    pentecostes: { base: "#CC2200", light: "#FF4422", dark: "#881100", text: "#FFE0DA" },

    fundo:       "#080808",
    centro:      "#0D0D0D",
    bordaOuro:   "#C8A84B",
    ouroClaro:   "#F0CC70",
    ouroDark:    "#8B6914",
    hoje:        "#00F5A0",
    hojeGlow:    "rgba(0,245,160,0.5)",
    texto:       "rgba(255,255,255,0.92)",
    textoSuave:  "rgba(255,255,255,0.50)",
  },

  /* Raios como fração de R */
  r: {
    externo:      0.980,   // borda exterior do anel
    dataBorda:    0.945,   // anel externo de datas
    dataInterna:  0.870,   // borda interna do anel de datas
    anelouro:     0.865,   // linha dourada separadora
    nomeData:     0.908,   // texto das datas
    segOuter:     0.860,   // fatia outer
    segInner:     0.480,   // fatia inner (borda do centro)
    textoSemana:  0.800,   // texto das semanas nas fatias
    textoTempo:   0.660,   // texto dos tempos (anel interno)
    centro:       0.465,   // círculo central
    centroInner:  0.360,   // anel decorativo 1
    centroInner2: 0.260,   // anel decorativo 2
  },

  font: {
    data:    (s) => `${Math.max(7,  Math.round(s * 0.0135))}px Inter, system-ui, sans-serif`,
    semana:  (s) => `${Math.max(6,  Math.round(s * 0.013))}px Inter, system-ui, sans-serif`,
    semanaB: (s) => `600 ${Math.max(7, Math.round(s * 0.014))}px Inter, system-ui, sans-serif`,
    tempo:   (s) => `700 ${Math.max(7, Math.round(s * 0.016))}px Inter, system-ui, sans-serif`,
    centro:  (s) => `300 ${Math.round(s * 0.040)}px Inter, system-ui, sans-serif`,
    alfa:    (s) => `300 ${Math.round(s * 0.060)}px 'Libre Baskerville', Georgia, serif`,
    simbolo: (s) => `${Math.round(s * 0.10)}px serif`,
  },
};

/* ════════════════════════════════════════════════
   MATEMÁTICA
════════════════════════════════════════════════ */

/** Semana → ângulo. Topo (-90°) = início do Advento */
function sToAng(semana, total) {
  return -Math.PI / 2 + (semana / total) * (2 * Math.PI);
}

function pt(cx, cy, r, ang) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

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

function calcPascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

function calcAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const dow   = natal.getDay();
  const adv   = new Date(natal);
  adv.setDate(25 - dow - 21);
  return adv;
}

function diffSem(a, b) {
  return Math.floor((b - a) / (7 * 86400000));
}

function semanaAtual() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  let ini    = calcAdvento(ano - 1);
  const prox = calcAdvento(ano);
  if (hoje >= prox) ini = prox;
  return Math.max(0, Math.min(51, diffSem(ini, hoje)));
}

/* ════════════════════════════════════════════════
   SEGMENTOS DO ANO LITÚRGICO
════════════════════════════════════════════════ */

function buildSegmentos(ano) {
  const ini    = calcAdvento(ano - 1);
  const pascoa = calcPascoa(ano);
  const TOTAL  = 52;

  const sw = (d) => Math.max(0, Math.min(TOTAL - 1, diffSem(ini, d)));

  const natal       = new Date(ano - 1, 11, 25);
  const epifania    = new Date(ano, 0, 6);
  const batismo     = new Date(ano, 0, 13);
  const cinzas      = new Date(pascoa); cinzas.setDate(pascoa.getDate() - 46);
  const palmas      = new Date(pascoa); palmas.setDate(pascoa.getDate() - 7);
  const quintaS     = new Date(pascoa); quintaS.setDate(pascoa.getDate() - 3);
  const pentecostes = new Date(pascoa); pentecostes.setDate(pascoa.getDate() + 49);
  const corpus      = new Date(pascoa); corpus.setDate(pascoa.getDate() + 63);
  const trindade    = new Date(pascoa); trindade.setDate(pascoa.getDate() + 56);
  const ascensao    = new Date(pascoa); ascensao.setDate(pascoa.getDate() + 39);
  const cristoRei   = calcAdvento(ano); cristoRei.setDate(cristoRei.getDate() - 7);

  const C = CAL.cores;

  const iAdv    = 0;
  const iNatal  = sw(natal);
  const iBat    = sw(batismo) + 1;
  const iCinzas = sw(cinzas);
  const iPalmas = sw(palmas);
  const iTriduo = sw(quintaS);
  const iPascoa = sw(pascoa);
  const iAscen  = sw(ascensao);
  const iPente  = sw(pentecostes);
  const iTrind  = sw(trindade);
  const iCorpus = sw(corpus);
  const iCRei   = sw(cristoRei);

  const segs = [];

  const push = (inicio, fim, cor, nome, tempo, destaque) =>
    segs.push({ inicio, fim, cor, nome, tempo, destaque: !!destaque });

  // ── ADVENTO ──
  for (let i = iAdv; i < iNatal; i++) {
    const n = i - iAdv + 1;
    push(i, i + 1, C.advento,
      n === 1 ? "1ª semana" : `${n}ª semana`,
      "Advento",
      i === iAdv
    );
  }

  // ── NATAL ──
  for (let i = iNatal; i < iBat; i++) {
    let nome = `${i - iNatal + 1}ª sem.`;
    let dest = false;
    if (i === iNatal)       { nome = "Natal";     dest = true; }
    if (i === sw(epifania)) { nome = "Epifania";  dest = true; }
    if (i === sw(batismo))  { nome = "Batismo N."; dest = true; }
    push(i, i + 1, C.natal, nome, "Natal", dest);
  }

  // ── TEMPO COMUM I ──
  for (let i = iBat; i < iCinzas; i++) {
    push(i, i + 1, C.tempoComum, `${i - iBat + 2}ª semana`, "Tempo Comum");
  }

  // ── QUARESMA ──
  for (let i = iCinzas; i < iPalmas; i++) {
    const nome = i === iCinzas ? "4ª feira de Cinzas" : `${i - iCinzas + 1}ª semana`;
    push(i, i + 1, C.quaresma, nome, "Quaresma", i === iCinzas);
  }

  // ── SEMANA SANTA ──
  push(iPalmas, iTriduo, C.semanaS,
    "Dom. de Ramos / Semana Santa", "Semana Santa", true);

  // ── TRÍDUO PASCAL ──
  push(iTriduo, iPascoa, C.triduo, "Tríduo Pascal", "Tríduo Pascal", true);

  // ── TEMPO PASCAL ──
  for (let i = iPascoa; i < iPente; i++) {
    let nome = `${i - iPascoa + 1}ª semana`;
    let dest = false;
    if (i === iPascoa) { nome = "Páscoa";   dest = true; }
    if (i === iAscen)  { nome = "Ascensão"; dest = true; }
    push(i, i + 1, C.pascal, nome, "Tempo Pascal", dest);
  }

  // ── PENTECOSTES ──
  push(iPente, iPente + 1, C.pentecostes, "Pentecostes", "Pentecostes", true);

  // ── TEMPO COMUM II ──
  for (let i = iPente + 1; i < TOTAL; i++) {
    let nome = `${i - iPente}ª semana`;
    let dest = false;
    if (i === iTrind)  { nome = "Trindade";       dest = true; }
    if (i === iCorpus) { nome = "Corpus Christi";  dest = true; }
    if (i === iCRei)   { nome = "Cristo Rei";      dest = true; }
    push(i, i + 1, C.tempoComum, nome, "Tempo Comum", dest);
  }

  return { segs, ini, total: TOTAL };
}

/* ════════════════════════════════════════════════
   FUNDO
════════════════════════════════════════════════ */

function desenharFundo(ctx, cx, cy, R, mini) {
  ctx.clearRect(0, 0, cx * 2, cy * 2);

  // Fundo muito escuro com vinheta
  const g = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, R * 1.15);
  g.addColorStop(0,   "#141414");
  g.addColorStop(0.5, "#0C0C0C");
  g.addColorStop(1,   "#050505");

  ctx.beginPath();
  ctx.arc(cx, cy, R + 8, 0, 2 * Math.PI);
  ctx.fillStyle = g;
  ctx.fill();
}

/* ════════════════════════════════════════════════
   ANEL BASE — fatias ricas com gradientes
════════════════════════════════════════════════ */

function desenharAnelBase(ctx, cx, cy, R, segs, total) {
  const rO = R * CAL.r.segOuter;
  const rI = R * CAL.r.segInner;

  segs.forEach((seg, idx) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;
    const C    = seg.cor;

    /* ── Gradiente radial da fatia ── */
    const gRad = ctx.createRadialGradient(cx, cy, rI, cx, cy, rO);
    gRad.addColorStop(0,    C.dark  + "CC");
    gRad.addColorStop(0.45, C.base  + "FF");
    gRad.addColorStop(0.80, C.light + "FF");
    gRad.addColorStop(1,    C.base  + "BB");

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = gRad;
    ctx.fill();

    /* ── Overlay de luz (reflexo superior) ── */
    const gLight = ctx.createLinearGradient(
      cx + rI * Math.cos(aMid), cy + rI * Math.sin(aMid),
      cx + rO * Math.cos(aMid), cy + rO * Math.sin(aMid)
    );
    gLight.addColorStop(0,   "rgba(255,255,255,0.18)");
    gLight.addColorStop(0.3, "rgba(255,255,255,0.07)");
    gLight.addColorStop(1,   "rgba(0,0,0,0.10)");

    ctx.beginPath();
    ctx.arc(cx, cy, rO, a1, a2);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = gLight;
    ctx.fill();

    /* ── Separadores finos entre fatias ── */
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.lineTo(cx + rO * Math.cos(a1), cy + rO * Math.sin(a1));
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    ctx.restore();
  });

  /* ── Borda exterior do anel ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0,0,0,0.70)";
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();

  /* ── Borda interior do anel (círculo centro) ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0,0,0,0.80)";
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();
}

/* ════════════════════════════════════════════════
   ANEL EXTERNO DE DATAS
════════════════════════════════════════════════ */

function desenharAnelDatas(ctx, cx, cy, R, ini, segs, total, tam) {
  const rO   = R * CAL.r.externo;
  const rD   = R * CAL.r.dataBorda;
  const rI   = R * CAL.r.dataInterna;
  const rTxt = R * CAL.r.nomeData;

  /* ── Faixa de fundo ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rD, 0, 2 * Math.PI);
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI, true);

  const gFaixa = ctx.createRadialGradient(cx, cy, rI, cx, cy, rD);
  gFaixa.addColorStop(0, "rgba(0,0,0,0.70)");
  gFaixa.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = gFaixa;
  ctx.fill("evenodd");
  ctx.restore();

  /* ── Borda exterior dourada ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rD, 0, 2 * Math.PI);
  const gOuro = ctx.createLinearGradient(cx - rD, cy, cx + rD, cy);
  gOuro.addColorStop(0,    CAL.cores.ouroDark + "80");
  gOuro.addColorStop(0.25, CAL.cores.ouroClaro + "CC");
  gOuro.addColorStop(0.5,  CAL.cores.ouroClaro + "FF");
  gOuro.addColorStop(0.75, CAL.cores.ouroClaro + "CC");
  gOuro.addColorStop(1,    CAL.cores.ouroDark + "80");
  ctx.strokeStyle = gOuro;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  /* ── Borda interior dourada fina ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(200,168,75,0.35)";
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();

  /* ── Texto das datas ── */
  for (let i = 0; i < total; i++) {
    const a1   = sToAng(i, total);
    const a2   = sToAng(i + 1, total);
    const aMid = (a1 + a2) / 2;

    const d = new Date(ini);
    d.setDate(ini.getDate() + i * 7);

    // Dia e mês abreviado
    const dia = d.getDate();
    const mes = ["jan","fev","mar","abr","mai","jun",
                 "jul","ago","set","out","nov","dez"][d.getMonth()];
    const label = `${dia} ${mes}`;

    /* Separador por semana */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
    ctx.lineTo(cx + rD * Math.cos(a1), cy + rD * Math.sin(a1));
    ctx.strokeStyle = "rgba(200,168,75,0.20)";
    ctx.lineWidth   = 0.6;
    ctx.stroke();
    ctx.restore();

    /* Texto rotacionado */
    ctx.save();
    ctx.translate(cx + rTxt * Math.cos(aMid), cy + rTxt * Math.sin(aMid));
    ctx.rotate(aMid + Math.PI / 2);
    ctx.fillStyle    = "rgba(240,210,140,0.80)";
    ctx.font         = CAL.font.data(tam);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

/* ════════════════════════════════════════════════
   TEXTOS NAS FATIAS (semanas + tempos)
════════════════════════════════════════════════ */

function desenharTextosFatias(ctx, cx, cy, R, segs, total, tam) {
  const rO   = R * CAL.r.segOuter;
  const rI   = R * CAL.r.segInner;
  const rTxt = R * CAL.r.textoSemana;

  segs.forEach((seg) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = Math.abs(a2 - a1);

    if (span < 0.06) return; // muito pequeno

    const fontSize = Math.max(6, Math.round(tam * (seg.destaque ? 0.0145 : 0.0120)));

    ctx.save();
    ctx.translate(cx + rTxt * Math.cos(aMid), cy + rTxt * Math.sin(aMid));
    ctx.rotate(aMid + Math.PI / 2);

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.95)";
    ctx.shadowBlur   = 5;

    if (seg.destaque) {
      ctx.font      = `700 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = seg.cor.text || "rgba(255,255,255,0.96)";
    } else {
      ctx.font      = `500 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.80)";
    }

    ctx.fillText(seg.nome, 0, 0);
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   RÓTULOS DOS TEMPOS — texto curvado no anel médio
════════════════════════════════════════════════ */

function desenharRotulosTempos(ctx, cx, cy, R, segs, total, tam) {
  const rTxt = R * CAL.r.textoTempo;

  // Agrupar por tempo
  const grupos = new Map();
  segs.forEach((seg) => {
    if (!grupos.has(seg.tempo)) {
      grupos.set(seg.tempo, { inicio: seg.inicio, fim: seg.fim, cor: seg.cor });
    } else {
      grupos.get(seg.tempo).fim = seg.fim;
    }
  });

  grupos.forEach((g, nome) => {
    const a1    = sToAng(g.inicio, total);
    const a2    = sToAng(g.fim,    total);
    const aMid  = (a1 + a2) / 2;
    const span  = Math.abs(a2 - a1);

    if (span < 0.18) return;

    const texto    = nome.toUpperCase();
    const fontSize = Math.max(7, Math.round(tam * 0.016));
    const charAng  = (fontSize * 0.60) / rTxt;
    const totalAng = texto.length * charAng;

    // Cabe no arco?
    if (totalAng > span * 0.88) {
      // Versão plana
      ctx.save();
      ctx.translate(cx + rTxt * Math.cos(aMid), cy + rTxt * Math.sin(aMid));
      ctx.rotate(aMid + Math.PI / 2);
      ctx.fillStyle    = g.cor.text ? g.cor.text + "55" : "rgba(255,255,255,0.28)";
      ctx.font         = `700 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor  = "rgba(0,0,0,0.80)";
      ctx.shadowBlur   = 4;
      ctx.fillText(texto, 0, 0);
      ctx.restore();
      return;
    }

    // Versão curvada
    const startAng = aMid - totalAng / 2;

    ctx.save();
    ctx.fillStyle    = g.cor.text ? g.cor.text + "55" : "rgba(255,255,255,0.28)";
    ctx.font         = `700 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.80)";
    ctx.shadowBlur   = 4;

    for (let i = 0; i < texto.length; i++) {
      const ang = startAng + (i + 0.5) * charAng;
      ctx.save();
      ctx.translate(cx + rTxt * Math.cos(ang), cy + rTxt * Math.sin(ang));
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillText(texto[i], 0, 0);
      ctx.restore();
    }

    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   SEPARADORES DE TEMPO (linhas grandes)
════════════════════════════════════════════════ */

function desenharSeparadores(ctx, cx, cy, R, segs, total) {
  const rI = R * CAL.r.segInner;
  const rO = R * CAL.r.segOuter;
  const rD = R * CAL.r.dataBorda;

  let tempoAtual = null;

  segs.forEach((seg) => {
    if (seg.tempo === tempoAtual) return;
    tempoAtual = seg.tempo;

    const ang = sToAng(seg.inicio, total);

    // Linha do centro ao exterior
    ctx.save();
    const gLinha = ctx.createLinearGradient(
      cx + rI * Math.cos(ang), cy + rI * Math.sin(ang),
      cx + rD * Math.cos(ang), cy + rD * Math.sin(ang)
    );
    gLinha.addColorStop(0,    "rgba(200,168,75,0.10)");
    gLinha.addColorStop(0.35, "rgba(200,168,75,0.50)");
    gLinha.addColorStop(0.80, "rgba(200,168,75,0.70)");
    gLinha.addColorStop(1,    "rgba(200,168,75,0.20)");

    ctx.beginPath();
    ctx.moveTo(cx + rI * Math.cos(ang), cy + rI * Math.sin(ang));
    ctx.lineTo(cx + rD * Math.cos(ang), cy + rD * Math.sin(ang));
    ctx.strokeStyle = gLinha;
    ctx.lineWidth   = 1.8;
    ctx.stroke();
    ctx.restore();

    // Diamante na borda exterior
    const px = cx + rD * Math.cos(ang);
    const py = cy + rD * Math.sin(ang);
    const ds = 4;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -ds);
    ctx.lineTo(ds * 0.5, 0);
    ctx.lineTo(0, ds);
    ctx.lineTo(-ds * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle   = CAL.cores.ouroClaro;
    ctx.shadowColor = CAL.cores.ouroClaro;
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   CÍRCULO CENTRAL — rico e detalhado
════════════════════════════════════════════════ */

function desenharCentro(ctx, cx, cy, R, tam, mini) {
  const rC  = R * CAL.r.centro;
  const rC1 = R * CAL.r.centroInner;
  const rC2 = R * CAL.r.centroInner2;

  /* ── Fundo profundo ── */
  const gFundo = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, rC);
  gFundo.addColorStop(0,   "#1C1810");
  gFundo.addColorStop(0.5, "#120F08");
  gFundo.addColorStop(1,   "#080604");

  ctx.beginPath();
  ctx.arc(cx, cy, rC, 0, 2 * Math.PI);
  ctx.fillStyle = gFundo;
  ctx.fill();

  /* ── Anel ouro externo ── */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rC, 0, 2 * Math.PI);
  const gAnel = ctx.createLinearGradient(cx - rC, cy - rC, cx + rC, cy + rC);
  gAnel.addColorStop(0,    "#8B6914AA");
  gAnel.addColorStop(0.25, "#F0CC70FF");
  gAnel.addColorStop(0.50, "#FFE090FF");
  gAnel.addColorStop(0.75, "#C8A84BFF");
  gAnel.addColorStop(1,    "#8B6914AA");
  ctx.strokeStyle = gAnel;
  ctx.lineWidth   = mini ? 1.5 : 2.5;
  ctx.shadowColor = "rgba(200,168,75,0.40)";
  ctx.shadowBlur  = mini ? 4 : 10;
  ctx.stroke();
  ctx.restore();

  if (mini) {
    // Mini: cruz + símbolo simples
    ctx.save();
    ctx.font         = `${Math.round(rC * 0.90)}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = "rgba(200,168,75,0.85)";
    ctx.shadowColor  = "rgba(200,168,75,0.50)";
    ctx.shadowBlur   = 6;
    ctx.fillText("✝", cx, cy);
    ctx.restore();
    return;
  }

  /* ── Anéis decorativos internos ── */
  [rC1, rC2].forEach((r, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(200,168,75,${0.22 - i * 0.06})`;
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  });

  /* ── Cruz moderna com gradiente ── */
  desenharCruzCentro(ctx, cx, cy, rC * 0.55, tam);

  /* ── Símbolos Α e Ω ── */
  const alfaSize = Math.round(tam * 0.052);
  ctx.save();
  ctx.font         = `300 ${alfaSize}px 'Libre Baskerville', Georgia, serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  // Alfa
  ctx.fillStyle    = "rgba(200,168,75,0.70)";
  ctx.shadowColor  = "rgba(200,168,75,0.30)";
  ctx.shadowBlur   = 6;
  ctx.fillText("Α", cx - rC * 0.46, cy + rC * 0.22);

  // Ômega
  ctx.fillText("Ω", cx + rC * 0.46, cy + rC * 0.22);
  ctx.restore();

  /* ── Label "ANO LITÚRGICO" ── */
  ctx.save();
  ctx.font         = `300 ${Math.round(tam * 0.016)}px Inter, sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "rgba(200,168,75,0.28)";
  ctx.letterSpacing = "2.5px";
  ctx.fillText("ANO LITÚRGICO", cx, cy - rC * 0.70);
  ctx.restore();

  /* ── Pontos decorativos nos 4 eixos ── */
  const ptDist = rC * 0.88;
  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((ang) => {
    const px = cx + ptDist * Math.cos(ang - Math.PI / 2);
    const py = cy + ptDist * Math.sin(ang - Math.PI / 2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, 2 * Math.PI);
    ctx.fillStyle   = "rgba(200,168,75,0.55)";
    ctx.shadowColor = "rgba(200,168,75,0.40)";
    ctx.shadowBlur  = 5;
    ctx.fill();
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   CRUZ DO CENTRO
════════════════════════════════════════════════ */

function desenharCruzCentro(ctx, cx, cy, tam, canvasTam) {
  const espV  = tam * 0.165;
  const altV  = tam * 1.15;
  const espH  = tam * 0.165;
  const largH = tam * 0.76;
  const posH  = -tam * 0.10;
  const raio  = espV * 0.38;

  // Gradiente vertical
  const gV = ctx.createLinearGradient(cx, cy - altV / 2, cx, cy + altV / 2);
  gV.addColorStop(0,    "rgba(139,105,20,0.20)");
  gV.addColorStop(0.15, "rgba(200,168,75,0.80)");
  gV.addColorStop(0.40, "rgba(255,220,120,1.00)");
  gV.addColorStop(0.60, "rgba(255,228,130,1.00)");
  gV.addColorStop(0.85, "rgba(200,168,75,0.80)");
  gV.addColorStop(1,    "rgba(139,105,20,0.20)");

  // Gradiente horizontal
  const gH = ctx.createLinearGradient(cx - largH / 2, cy, cx + largH / 2, cy);
  gH.addColorStop(0,    "rgba(139,105,20,0.20)");
  gH.addColorStop(0.20, "rgba(200,168,75,0.80)");
  gH.addColorStop(0.45, "rgba(255,220,120,1.00)");
  gH.addColorStop(0.55, "rgba(255,228,130,1.00)");
  gH.addColorStop(0.80, "rgba(200,168,75,0.80)");
  gH.addColorStop(1,    "rgba(139,105,20,0.20)");

  ctx.save();
  ctx.shadowColor   = "rgba(220,180,80,0.35)";
  ctx.shadowBlur    = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;

  // Vertical
  ctx.fillStyle = gV;
  roundRect(ctx, cx - espV / 2, cy - altV / 2, espV, altV, raio);
  ctx.fill();

  // Horizontal
  ctx.fillStyle = gH;
  roundRect(ctx, cx - largH / 2, cy + posH - espH / 2, largH, espH, raio);
  ctx.fill();

  ctx.restore();

  // Brilho central na intersecção
  ctx.save();
  const gBrilho = ctx.createRadialGradient(cx, cy + posH, 0, cx, cy + posH, espV * 1.2);
  gBrilho.addColorStop(0,   "rgba(255,245,200,0.60)");
  gBrilho.addColorStop(0.5, "rgba(255,220,120,0.20)");
  gBrilho.addColorStop(1,   "rgba(255,220,120,0)");
  ctx.beginPath();
  ctx.arc(cx, cy + posH, espV * 1.2, 0, 2 * Math.PI);
  ctx.fillStyle = gBrilho;
  ctx.fill();
  ctx.restore();
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
  desenharAnelDatas,
  desenharTextosFatias,
  desenharRotulosTempos,
  desenharSeparadores,
  desenharCentro,
  desenharCruzCentro,
};
