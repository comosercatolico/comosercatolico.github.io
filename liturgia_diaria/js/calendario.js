/* ==============================================
   CALENDÁRIO LITÚRGICO PROFISSIONAL - Lux Fidei
   Inspirado no calendário tradicional católico
   ============================================== */

/* ==============================================
   1. CÁLCULO DA PÁSCOA
   ============================================== */
function calcularPascoa(ano) {
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
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function entreDatas(data, inicio, fim) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const i = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const f = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  return d >= i && d <= f;
}

function primeiroAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const diaSemana = natal.getDay();
  const diasAteDom = diaSemana === 0 ? 0 : diaSemana;
  const quartoDom = new Date(natal);
  quartoDom.setDate(natal.getDate() - diasAteDom);
  const primeiro = new Date(quartoDom);
  primeiro.setDate(quartoDom.getDate() - 21);
  return primeiro;
}

function batismoSenhor(ano) {
  const ep = new Date(ano, 0, 6);
  const dia = ep.getDay();
  if (dia === 0) return new Date(ano, 0, 13);
  return addDias(ep, 7 - dia);
}

/* ==============================================
   2. DETECTAR TEMPO ATUAL
   ============================================== */
function detectarTempoAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const pascoa = calcularPascoa(ano);
  const quartaCinzas = addDias(pascoa, -46);
  const quintaSanta = addDias(pascoa, -3);
  const pentecostes = addDias(pascoa, 49);
  const batismo = batismoSenhor(ano);
  const inicioAdvento = primeiroAdvento(ano);
  const inicioAdventoAnt = primeiroAdvento(ano - 1);

  if (entreDatas(hoje, new Date(ano - 1, 11, 25), batismo)) return 'natal';
  if (entreDatas(hoje, addDias(batismo, 1), addDias(quartaCinzas, -1))) return 'tempoComum';
  if (entreDatas(hoje, quartaCinzas, addDias(quintaSanta, -1))) return 'quaresma';
  if (entreDatas(hoje, quintaSanta, addDias(pascoa, -1))) return 'triduo';
  if (entreDatas(hoje, pascoa, pentecostes)) return 'pascoa';
  if (entreDatas(hoje, addDias(pentecostes, 1), addDias(inicioAdvento, -1))) return 'tempoComum';
  if (entreDatas(hoje, inicioAdvento, new Date(ano, 11, 24))) return 'advento';
  if (entreDatas(hoje, inicioAdventoAnt, new Date(ano - 1, 11, 24))) return 'advento';
  if (entreDatas(hoje, new Date(ano, 11, 25), new Date(ano, 11, 31))) return 'natal';
  return 'tempoComum';
}

/* ==============================================
   3. DEFINIÇÃO DOS SEGMENTOS DO CALENDÁRIO
   Estrutura em anéis como o calendário tradicional
   ============================================== */

// Segmentos principais (anel externo de tempo)
const SEGMENTOS = [
  // id, nome, cor, ângulo início, ângulo fim, sub-segmentos
  {
    id: 'advento',
    nome: 'Advento',
    cor: '#6b3fa0',
    corClara: '#8b5fc0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'Tempo de preparação e esperança pela vinda do Senhor. A Igreja nos convida à conversão, à oração e à vigilância.',
    angInicio: 0,
    angFim: 52,
    subsegmentos: [
      { nome: '1ª semana', cor: '#7b4fb0' },
      { nome: '2ª semana', cor: '#7b4fb0' },
      { nome: '3ª semana', cor: '#9b6fd0' },
      { nome: '4ª semana', cor: '#7b4fb0' },
    ]
  },
  {
    id: 'natal',
    nome: 'Natal',
    cor: '#c8b89a',
    corClara: '#e8d8ba',
    corTexto: '#3a2a10',
    corVeste: 'Branco / Dourado',
    descricao: 'Celebramos o mistério da Encarnação. O Verbo se fez carne e habitou entre nós cheio de graça e verdade.',
    angInicio: 52,
    angFim: 95,
    subsegmentos: [
      { nome: 'Natal', cor: '#d8c8aa' },
      { nome: 'Sagrada Família', cor: '#c8b89a' },
      { nome: 'Mãe de Deus', cor: '#d8c8aa' },
      { nome: 'Epifania', cor: '#c8b89a' },
      { nome: 'Batismo do Senhor', cor: '#d8c8aa' },
    ]
  },
  {
    id: 'tempoComum1',
    nome: 'Tempo Comum',
    cor: '#1a7a3a',
    corClara: '#2a9a4a',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    descricao: 'Tempo de crescimento na fé. A Igreja medita a vida e os ensinamentos de Cristo, crescendo na caridade.',
    angInicio: 95,
    angFim: 168,
    subsegmentos: [
      { nome: '1ª sem.', cor: '#1a7a3a' },
      { nome: '2ª sem.', cor: '#2a8a4a' },
      { nome: '3ª sem.', cor: '#1a7a3a' },
      { nome: '4ª sem.', cor: '#2a8a4a' },
      { nome: '5ª sem.', cor: '#1a7a3a' },
      { nome: '6ª sem.', cor: '#2a8a4a' },
      { nome: '7ª sem.', cor: '#1a7a3a' },
      { nome: '8ª sem.', cor: '#2a8a4a' },
      { nome: '9ª sem.', cor: '#1a7a3a' },
    ]
  },
  {
    id: 'quaresma',
    nome: 'Quaresma',
    cor: '#6b3fa0',
    corClara: '#8b5fc0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'Quarenta dias de penitência, oração e jejum. Caminhamos com Cristo ao deserto, preparando o coração.',
    angInicio: 168,
    angFim: 230,
    subsegmentos: [
      { nome: '4ª feira de Cinzas', cor: '#7b4fb0' },
      { nome: '1ª semana', cor: '#6b3fa0' },
      { nome: '2ª semana', cor: '#7b4fb0' },
      { nome: '3ª semana', cor: '#6b3fa0' },
      { nome: '4ª semana', cor: '#7b4fb0' },
      { nome: '5ª semana', cor: '#6b3fa0' },
      { nome: 'Dom. de Ramos', cor: '#8b5fc0' },
    ]
  },
  {
    id: 'triduo',
    nome: 'Tríduo Pascal',
    cor: '#8b1a1a',
    corClara: '#b02020',
    corTexto: '#ffffff',
    corVeste: 'Vermelho / Branco',
    descricao: 'O coração do ano litúrgico. Celebramos a Paixão, Morte e Ressurreição de Nosso Senhor Jesus Cristo.',
    angInicio: 230,
    angFim: 260,
    subsegmentos: [
      { nome: '5ª feira Santa', cor: '#8b1a1a' },
      { nome: '6ª feira Santa', cor: '#6b0a0a' },
      { nome: 'Páscoa', cor: '#ab2a2a' },
    ]
  },
  {
    id: 'pascoa',
    nome: 'Páscoa',
    cor: '#c8960c',
    corClara: '#e8b61c',
    corTexto: '#1a0f00',
    corVeste: 'Branco / Dourado',
    descricao: 'Cinquenta dias de alegria! Cristo ressuscitou, aleluia! Celebramos a vitória da vida sobre a morte.',
    angInicio: 260,
    angFim: 332,
    subsegmentos: [
      { nome: '2ª semana', cor: '#d8a61c' },
      { nome: '3ª semana', cor: '#c8960c' },
      { nome: '4ª semana', cor: '#d8a61c' },
      { nome: '5ª semana', cor: '#c8960c' },
      { nome: '6ª semana', cor: '#d8a61c' },
      { nome: 'Ascensão', cor: '#e8b61c' },
      { nome: 'Pentecostes', cor: '#c84040' },
      { nome: 'SS. Trindade', cor: '#d8a61c' },
      { nome: 'Corpus Christi', cor: '#e8b61c' },
    ]
  },
  {
    id: 'tempoComum2',
    nome: 'Tempo Comum',
    cor: '#1a7a3a',
    corClara: '#2a9a4a',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    descricao: 'Tempo de crescimento na fé. A Igreja medita a vida e os ensinamentos de Cristo.',
    angInicio: 332,
    angFim: 360,
    subsegmentos: [
      { nome: '12ª sem.', cor: '#1a7a3a' },
      { nome: '13ª sem.', cor: '#2a8a4a' },
      { nome: '14ª sem.', cor: '#1a7a3a' },
      { nome: '34ª sem.', cor: '#2a8a4a' },
      { nome: 'Cristo Rei', cor: '#2a9a4a' },
    ]
  }
];

const TEMPOS_INFO = {
  advento:     SEGMENTOS[0],
  natal:       SEGMENTOS[1],
  tempoComum:  SEGMENTOS[2],
  quaresma:    SEGMENTOS[3],
  triduo:      SEGMENTOS[4],
  pascoa:      SEGMENTOS[5],
  tempoComum2: SEGMENTOS[6],
};

/* ==============================================
   4. FUNÇÕES SVG
   ============================================== */
function grausParaRad(graus) {
  return (graus - 90) * Math.PI / 180;
}

function polarXY(cx, cy, ang, r) {
  const rad = grausParaRad(ang);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pathArco(cx, cy, rExt, rInt, angIni, angFim) {
  const p1 = polarXY(cx, cy, angIni, rExt);
  const p2 = polarXY(cx, cy, angFim, rExt);
  const p3 = polarXY(cx, cy, angFim, rInt);
  const p4 = polarXY(cx, cy, angIni, rInt);
  const grande = (angFim - angIni) > 180 ? 1 : 0;
  const f = n => n.toFixed(3);
  return `M${f(p1.x)},${f(p1.y)} A${rExt},${rExt} 0 ${grande} 1 ${f(p2.x)},${f(p2.y)} L${f(p3.x)},${f(p3.y)} A${rInt},${rInt} 0 ${grande} 0 ${f(p4.x)},${f(p4.y)} Z`;
}

function textoNoCaminho(id, cx, cy, r, angIni, angFim, texto, fontSize, fill, fontWeight = '500') {
  const ang = (angIni + angFim) / 2;
  // Para texto curvado no arco
  const invertido = ang > 90 && ang < 270;
  const rTexto = invertido ? r + fontSize * 0.4 : r;

  const startAng = invertido ? angFim : angIni;
  const endAng = invertido ? angIni : angFim;
  const p1 = polarXY(cx, cy, startAng, rTexto);
  const p2 = polarXY(cx, cy, endAng, rTexto);
  const grande = Math.abs(angFim - angIni) > 180 ? 1 : 0;
  const sweep = invertido ? 0 : 1;
  const f = n => n.toFixed(3);

  const pathId = `tp-${id}`;
  return `
    <path id="${pathId}" d="M${f(p1.x)},${f(p1.y)} A${rTexto},${rTexto} 0 ${grande} ${sweep} ${f(p2.x)},${f(p2.y)}" fill="none"/>
    <text font-family="'Inter',sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${texto}</textPath>
    </text>`;
}

/* ==============================================
   5. GERAR SVG PROFISSIONAL
   ============================================== */
function gerarSVG(tempoAtual, size) {
  const cx = size / 2;
  const cy = size / 2;

  // Raios dos anéis
  const R_EXTERNO     = size * 0.485; // borda externa
  const R_SUBSEG      = size * 0.420; // anel de subsegmentos (semanas)
  const R_PRINCIPAL   = size * 0.310; // anel principal dos tempos
  const R_INTERNO     = size * 0.195; // borda do círculo central
  const R_CENTRO      = size * 0.185; // círculo dourado
  const R_TEXTO_EXT   = size * 0.455; // texto anel externo
  const R_TEXTO_PRINC = size * 0.358; // texto anel principal

  const GAP = 0.8; // gap em graus entre segmentos

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">`;

  /* --- DEFS --- */
  svg += `<defs>
    <radialGradient id="gBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f0ece2"/>
    </radialGradient>
    <radialGradient id="gCentro" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#b08040"/>
      <stop offset="60%" stop-color="#7a5020"/>
      <stop offset="100%" stop-color="#3a2008"/>
    </radialGradient>
    <radialGradient id="gAnelCentro" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c09050"/>
      <stop offset="100%" stop-color="#5a3510"/>
    </radialGradient>
    <filter id="fSombra" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="rgba(0,0,0,0.22)"/>
    </filter>
    <filter id="fGlow">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="rgba(255,215,0,0.7)"/>
    </filter>
    <filter id="fGlowSeg">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="rgba(255,215,0,0.5)"/>
    </filter>
    <filter id="fSombraCentro">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>`;

  /* --- FUNDO CIRCULAR --- */
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_EXTERNO + 10}" fill="url(#gBg)" filter="url(#fSombra)"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_EXTERNO + 10}" fill="none" stroke="rgba(160,130,80,0.25)" stroke-width="1.5"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_EXTERNO + 3}" fill="none" stroke="rgba(160,130,80,0.15)" stroke-width="1"/>`;

  /* --- ANEL 1: SUBSEGMENTOS (semanas/celebrações) --- */
  SEGMENTOS.forEach((seg, segIdx) => {
    const tempoId = seg.id.replace(/[12]$/, '');
    const isAtual = tempoId === tempoAtual || seg.id === tempoAtual;
    const totalAng = seg.angFim - seg.angInicio;

    seg.subsegmentos.forEach((sub, subIdx) => {
      const subTotal = seg.subsegmentos.length;
      const subAngTotal = totalAng / subTotal;
      const angIni = seg.angInicio + subIdx * subAngTotal + (subIdx === 0 ? GAP : GAP / 2);
      const angFim = seg.angInicio + (subIdx + 1) * subAngTotal - (subIdx === subTotal - 1 ? GAP : GAP / 2);
      const angMeio = (angIni + angFim) / 2;

      const corBase = sub.cor;
      const corFinal = isAtual ? ajustarBrilho(corBase, 1.15) : corBase;

      svg += `<path d="${pathArco(cx, cy, R_EXTERNO, R_SUBSEG, angIni, angFim)}"
        fill="${corFinal}"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="0.8"/>`;

      // Texto subsegmento (se houver espaço suficiente)
      const spanAng = angFim - angIni;
      if (spanAng > 7) {
        const uid = `sub-${segIdx}-${subIdx}`;
        svg += textoNoCaminho(uid, cx, cy, R_TEXTO_EXT - size * 0.01, angIni, angFim,
          sub.nome, size * 0.018, 'rgba(255,255,255,0.92)', '400');
      }
    });
  });

  /* --- ANEL 2: SEGMENTOS PRINCIPAIS (tempos litúrgicos) --- */
  SEGMENTOS.forEach((seg, segIdx) => {
    const tempoId = seg.id.replace(/[12]$/, '');
    const isAtual = tempoId === tempoAtual || seg.id === tempoAtual;
    const angIni = seg.angInicio + GAP;
    const angFim = seg.angFim - GAP;
    const angMeio = (angIni + angFim) / 2;

    // Destaque se for o tempo atual
    if (isAtual) {
      svg += `<path d="${pathArco(cx, cy, R_SUBSEG + 4, R_INTERNO - 4, angIni - GAP, angFim + GAP)}"
        fill="${seg.cor}" opacity="0.2" filter="url(#fGlowSeg)"/>`;
    }

    // Fatia principal
    svg += `<path d="${pathArco(cx, cy, R_SUBSEG, R_PRINCIPAL, angIni, angFim)}"
      fill="${seg.cor}"
      stroke="rgba(255,255,255,0.2)"
      stroke-width="0.8"/>`;

    // Gradiente de profundidade interno
    svg += `<path d="${pathArco(cx, cy, R_PRINCIPAL, R_INTERNO, angIni, angFim)}"
      fill="${seg.corClara}"
      opacity="0.6"
      stroke="rgba(255,255,255,0.15)"
      stroke-width="0.8"/>`;

    // Borda dourada pulsante no tempo atual
    if (isAtual) {
      svg += `<path d="${pathArco(cx, cy, R_EXTERNO + 1, R_EXTERNO - 3, angIni - GAP / 2, angFim + GAP / 2)}"
        fill="#FFD700" filter="url(#fGlow)"/>`;
      svg += `<path d="${pathArco(cx, cy, R_INTERNO + 3, R_INTERNO, angIni - GAP / 2, angFim + GAP / 2)}"
        fill="#FFD700" opacity="0.8"/>`;
    }

    // === TEXTO NOME DO TEMPO (curvado no arco) ===
    const uid = `seg-${segIdx}`;
    const spanAng = angFim - angIni;
    if (spanAng > 20) {
      svg += textoNoCaminho(
        uid, cx, cy, R_TEXTO_PRINC, angIni, angFim,
        seg.nome,
        size * 0.028,
        isAtual ? '#ffffff' : seg.corTexto,
        isAtual ? '700' : '600'
      );
    }

    // "Tempo Atual" badge no segmento ativo
    if (isAtual && spanAng > 30) {
      const uid2 = `agora-${segIdx}`;
      svg += textoNoCaminho(
        uid2, cx, cy, R_TEXTO_PRINC - size * 0.048, angIni, angFim,
        '● TEMPO ATUAL',
        size * 0.019,
        '#FFD700',
        '700'
      );
    }
  });

  /* --- LINHAS DIVISÓRIAS --- */
  SEGMENTOS.forEach(seg => {
    const pExt = polarXY(cx, cy, seg.angInicio, R_EXTERNO + 4);
    const pInt = polarXY(cx, cy, seg.angInicio, R_INTERNO);
    const f = n => n.toFixed(2);
    svg += `<line x1="${f(pExt.x)}" y1="${f(pExt.y)}" x2="${f(pInt.x)}" y2="${f(pInt.y)}"
      stroke="rgba(255,255,255,0.55)" stroke-width="1.8"/>`;
  });

  /* --- ANÉIS DECORATIVOS DE BORDA --- */
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_SUBSEG}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_PRINCIPAL}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_INTERNO}" fill="none" stroke="rgba(160,120,60,0.5)" stroke-width="2.5"/>`;

  /* --- CÍRCULO CENTRAL DOURADO --- */
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_CENTRO}" fill="url(#gCentro)" filter="url(#fSombraCentro)"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_CENTRO}" fill="none" stroke="rgba(212,170,80,0.7)" stroke-width="3"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${R_CENTRO - 8}" fill="none" stroke="rgba(212,170,80,0.3)" stroke-width="1.5"/>`;

  /* --- CRUZ --- */
  const cW = size * 0.028;
  const cH = R_CENTRO * 1.15;
  const cArmW = R_CENTRO * 0.95;
  const cArmH = size * 0.028;
  const cArmY = -R_CENTRO * 0.12;

  // Sombra da cruz
  svg += `<rect x="${(cx - cW / 2 + 2).toFixed(2)}" y="${(cy - cH / 2 + 3).toFixed(2)}"
    width="${cW.toFixed(2)}" height="${cH.toFixed(2)}"
    fill="rgba(0,0,0,0.3)" rx="3"/>`;
  svg += `<rect x="${(cx - cArmW / 2 + 2).toFixed(2)}" y="${(cy + cArmY - cArmH / 2 + 3).toFixed(2)}"
    width="${cArmW.toFixed(2)}" height="${cArmH.toFixed(2)}"
    fill="rgba(0,0,0,0.3)" rx="3"/>`;

  // Cruz dourada
  svg += `<rect x="${(cx - cW / 2).toFixed(2)}" y="${(cy - cH / 2).toFixed(2)}"
    width="${cW.toFixed(2)}" height="${cH.toFixed(2)}"
    fill="rgba(255,225,130,0.95)" rx="3"/>`;
  svg += `<rect x="${(cx - cArmW / 2).toFixed(2)}" y="${(cy + cArmY - cArmH / 2).toFixed(2)}"
    width="${cArmW.toFixed(2)}" height="${cArmH.toFixed(2)}"
    fill="rgba(255,225,130,0.95)" rx="3"/>`;

  /* --- ALFA E ÔMEGA --- */
  const szLetras = size * 0.062;
  svg += `<text x="${(cx - R_CENTRO * 0.45).toFixed(2)}" y="${(cy + R_CENTRO * 0.22).toFixed(2)}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Libre Baskerville',serif" font-size="${szLetras.toFixed(1)}"
    fill="rgba(255,238,170,0.95)" font-weight="700">Α</text>`;
  svg += `<text x="${(cx + R_CENTRO * 0.45).toFixed(2)}" y="${(cy + R_CENTRO * 0.22).toFixed(2)}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Libre Baskerville',serif" font-size="${szLetras.toFixed(1)}"
    fill="rgba(255,238,170,0.95)" font-weight="700">Ω</text>`;

  /* --- SETA "INÍCIO DO ANO LITÚRGICO" (topo) --- */
  const setPonta = polarXY(cx, cy, 0, R_EXTERNO + 22);
  const setBase1 = polarXY(cx, cy, -4, R_EXTERNO + 8);
  const setBase2 = polarXY(cx, cy, 4, R_EXTERNO + 8);
  const f = n => n.toFixed(2);
  svg += `<polygon points="${f(setPonta.x)},${f(setPonta.y)} ${f(setBase1.x)},${f(setBase1.y)} ${f(setBase2.x)},${f(setBase2.y)}"
    fill="#8b6f3d" opacity="0.7"/>`;

  svg += `</svg>`;
  return svg;
}

/* Ajustar brilho de cor hex */
function ajustarBrilho(hex, fator) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r * fator));
  const ng = Math.min(255, Math.round(g * fator));
  const nb = Math.min(255, Math.round(b * fator));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

/* ==============================================
   6. MINI CALENDÁRIO
   ============================================== */
function gerarMiniCalendario() {
  const tempoAtual = detectarTempoAtual();
  const seg = SEGMENTOS.find(s => s.id === tempoAtual || s.id === tempoAtual + '1' || s.id === tempoAtual + '2')
    || SEGMENTOS.find(s => s.id.startsWith('tempoComum'));

  const container = document.getElementById('mini-calendario-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mini-cal-card" onclick="abrirModalCalendario()"
      role="button" tabindex="0" aria-label="Abrir calendário litúrgico completo">

      <div class="mini-cal-topo">
        <div class="mini-cal-linha-decorativa"></div>
        <span class="mini-cal-label">Calendário Litúrgico</span>
        <div class="mini-cal-linha-decorativa"></div>
      </div>

      <div class="mini-cal-ring">
        ${gerarSVG(tempoAtual, 180)}
      </div>

      <div class="mini-cal-info-row">
        <span class="mini-dot-tempo" style="background:${seg.cor}"></span>
        <span class="mini-tempo-nome">${seg.nome}</span>
        <span class="mini-veste" style="color:${seg.cor}">${seg.corVeste}</span>
      </div>

      <div class="mini-cal-cta-btn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <span>Ver calendário completo</span>
      </div>

    </div>`;

  container.querySelector('.mini-cal-card').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') abrirModalCalendario();
  });
}

/* ==============================================
   7. MODAL
   ============================================== */
function abrirModalCalendario() {
  const tempoAtual = detectarTempoAtual();
  const seg = SEGMENTOS.find(s => s.id === tempoAtual)
    || SEGMENTOS.find(s => s.id.startsWith(tempoAtual))
    || SEGMENTOS.find(s => s.id.startsWith('tempoComum'));

  // SVG grande no modal
  document.getElementById('modal-cal-svg').innerHTML = gerarSVG(tempoAtual, 520);

  // Painel de informações
  document.getElementById('modal-cal-info').innerHTML = `
    <div class="mci-header">
      <div class="mci-cor-barra" style="background:linear-gradient(180deg,${seg.cor},${seg.corClara})"></div>
      <div class="mci-header-texto">
        <span class="mci-label-pequeno">Tempo Litúrgico Atual</span>
        <h3 class="mci-nome" style="color:${seg.cor}">${seg.nome}</h3>
      </div>
    </div>

    <div class="mci-veste-row">
      <div class="mci-veste-item">
        <span class="mci-veste-label">Cor litúrgica</span>
        <div class="mci-veste-valor">
          <span class="mci-cor-bolinha" style="background:${seg.cor}"></span>
          <strong style="color:${seg.cor}">${seg.corVeste}</strong>
        </div>
      </div>
    </div>

    <div class="mci-separador"></div>

    <p class="mci-descricao">${seg.descricao}</p>

    <div class="mci-separador"></div>

    <div class="mci-subseg-lista">
      <span class="mci-label-pequeno" style="margin-bottom:10px;display:block">Celebrações deste tempo</span>
      ${seg.subsegmentos.map(s => `
        <div class="mci-subseg-item">
          <span class="mci-subseg-dot" style="background:${s.cor}"></span>
          <span>${s.nome}</span>
        </div>`).join('')}
    </div>

    <a href="../estudos/estudos.html" class="mci-btn-ler">
      <span>Aprofundar sobre o ${seg.nome}</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>`;

  // Legenda
  const legendaUnicos = [SEGMENTOS[0], SEGMENTOS[1], SEGMENTOS[2], SEGMENTOS[3], SEGMENTOS[4], SEGMENTOS[5]];
  document.getElementById('modal-cal-legenda').innerHTML = legendaUnicos.map(s => {
    const isA = s.id === tempoAtual || (tempoAtual === 'tempoComum' && s.id.startsWith('tempoComum'));
    return `<div class="leg-pill ${isA ? 'leg-pill-ativa' : ''}">
      <span class="leg-dot" style="background:${s.cor}"></span>
      <span class="leg-nome">${s.nome}</span>
      ${isA ? '<span class="leg-agora">agora</span>' : ''}
    </div>`;
  }).join('');

  document.getElementById('modal-calendario').classList.add('modal-aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalCalendario() {
  document.getElementById('modal-calendario').classList.remove('modal-aberto');
  document.body.style.overflow = '';
}

/* ==============================================
   8. INIT
   ============================================== */
document.addEventListener('DOMContentLoaded', () => {
  gerarMiniCalendario();

  const modal = document.getElementById('modal-calendario');
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) fecharModalCalendario(); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalCalendario(); });
});
