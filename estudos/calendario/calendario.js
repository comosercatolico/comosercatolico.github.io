/* ══════════════════════════════════════════════════════════════════════════════
   ✦ CALENDÁRIO LITÚRGICO ✦  ──  JAVASCRIPT
   ─────────────────────────────────────────────────────────────────────────────
   Gera dinamicamente os 3 anéis da roda (datas, tempos, semanas) e gerencia
   toda a interatividade (hover, click, teclado, tooltip, painel de detalhes).
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  01 · CONSTANTES GEOMÉTRICAS                                            │
   └─────────────────────────────────────────────────────────────────────────┘ */

const CX = 500;
const CY = 500;

// Raios dos anéis (do externo ao interno)
const R_OUTER       = 490;   // borda externa
const R_DATE_OUT    = 488;
const R_DATE_IN     = 438;
const R_GAP_1       = 436;
const R_SEASON_OUT  = 432;
const R_SEASON_IN   = 398;
const R_GAP_2       = 396;
const R_WEEK_OUT    = 394;
const R_WEEK_IN     = 218;
const R_GUIDE       = 215;
const R_CENTER      = 175;   // raio do emblema central


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  02 · PALETA DE CORES (sincronizada com o CSS)                          │
   └─────────────────────────────────────────────────────────────────────────┘ */

const COLORS = {
  advento:     '#b9a8d4',
  adventoLo:   '#8c79b0',
  rosa:        '#e8b8c8',
  natal:       '#fdfaf2',
  natalEdge:   '#c9b88e',
  comum:       '#4ea045',
  comumLo:     '#357a2c',
  quaresma:    '#a690c2',
  quaresmaLo:  '#80679f',
  triduo:      '#a31827',
  triduoLo:    '#7a0e1a',
  pascoa:      '#fdfaf2',
  pentecostes: '#cc1f2e',
  neutralBg:   '#faf3e0',
};


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  03 · DADOS DOS TEMPOS LITÚRGICOS                                       │
   │  Total: 52 semanas distribuídas em 360°                                 │
   └─────────────────────────────────────────────────────────────────────────┘ */

const SEASONS = [
  {
    id: 'advento',
    label: 'Advento',
    latin: 'Adventus Domini',
    color: COLORS.advento,
    weekCount: 4,
    labelOnDark: false,
  },
  {
    id: 'natal',
    label: 'Natal',
    latin: 'Tempus Nativitatis',
    color: COLORS.natal,
    weekCount: 5,
    labelOnDark: false,
  },
  {
    id: 'comum1',
    label: 'Tempo Comum',
    latin: 'Tempus per Annum',
    color: COLORS.comum,
    weekCount: 6,
    labelOnDark: true,
  },
  {
    id: 'quaresma',
    label: 'Quaresma',
    latin: 'Quadragesima',
    color: COLORS.quaresma,
    weekCount: 7,
    labelOnDark: false,
  },
  {
    id: 'triduo',
    label: 'Tríduo Pascal',
    latin: 'Triduum Paschale',
    color: COLORS.triduo,
    weekCount: 2,
    labelOnDark: true,
  },
  {
    id: 'pascoa',
    label: 'Páscoa',
    latin: 'Tempus Paschale',
    color: COLORS.pascoa,
    weekCount: 7,
    labelOnDark: false,
  },
  {
    id: 'pentecostes',
    label: 'Pentecostes',
    latin: 'Pentecostes',
    color: COLORS.pentecostes,
    weekCount: 1,
    labelOnDark: true,
  },
  {
    id: 'comum2',
    label: 'Tempo Comum',
    latin: 'Tempus per Annum',
    color: COLORS.comum,
    weekCount: 20,
    labelOnDark: true,
  },
];


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  04 · DADOS DAS SEMANAS                                                 │
   │  52 entradas — TODAS CLICÁVEIS                                          │
   └─────────────────────────────────────────────────────────────────────────┘ */

const WEEKS = [

  // ─── ADVENTO ── 4 semanas ───────────────────────────────────────────
  { id: 'adv-1', label: '1ª semana',         season: 'advento',  color: COLORS.advento },
  { id: 'adv-2', label: '2ª semana',         season: 'advento',  color: COLORS.advento },
  { id: 'adv-3', label: '3ª semana',         season: 'advento',  color: COLORS.rosa,    note: 'Gaudete' },
  { id: 'adv-4', label: '4ª semana',         season: 'advento',  color: COLORS.advento },

  // ─── NATAL ── 5 marcadores ──────────────────────────────────────────
  { id: 'nat-1', label: 'Natal',             season: 'natal',    color: COLORS.natal,    special: true },
  { id: 'nat-2', label: 'Sagrada Família',   season: 'natal',    color: COLORS.natal,    special: true },
  { id: 'nat-3', label: 'Mãe de Deus',       season: 'natal',    color: COLORS.natal,    special: true },
  { id: 'nat-4', label: 'Epifania do Senhor',season: 'natal',    color: COLORS.natal,    special: true },
  { id: 'nat-5', label: 'Batismo do Senhor', season: 'natal',    color: COLORS.natal,    special: true },

  // ─── TEMPO COMUM I ── 6 entradas ────────────────────────────────────
  { id: 'tc1-1', label: '1ª semana',         season: 'comum1',   color: COLORS.comum,    onDark: true },
  { id: 'tc1-2', label: '2ª semana',         season: 'comum1',   color: COLORS.comum,    onDark: true },
  { id: 'tc1-3', label: '3ª semana',         season: 'comum1',   color: COLORS.comum,    onDark: true },
  { id: 'tc1-4', label: '4ª semana',         season: 'comum1',   color: COLORS.comum,    onDark: true },
  { id: 'tc1-5', label: '5ª semana',         season: 'comum1',   color: COLORS.comum,    onDark: true },
  { id: 'tc1-6', label: '…',                 season: 'comum1',   color: COLORS.comum,    onDark: true },

  // ─── QUARESMA ── 7 entradas (Cinzas + 5 sem + Ramos) ────────────────
  { id: 'qua-0', label: '4ª f. Cinzas',      season: 'quaresma', color: COLORS.quaresma, special: true },
  { id: 'qua-1', label: '1ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-2', label: '2ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-3', label: '3ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-4', label: '4ª semana',         season: 'quaresma', color: COLORS.rosa,     note: 'Laetare' },
  { id: 'qua-5', label: '5ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-6', label: 'Dom. de Ramos',     season: 'quaresma', color: COLORS.triduo,   onDark: true, special: true },

  // ─── TRÍDUO PASCAL ── 2 entradas ────────────────────────────────────
  { id: 'tri-1', label: '5ª f. Santa',       season: 'triduo',   color: COLORS.triduo,   onDark: true, special: true },
  { id: 'tri-2', label: '6ª f. Santa',       season: 'triduo',   color: COLORS.triduo,   onDark: true, special: true },

  // ─── PÁSCOA ── 7 entradas ───────────────────────────────────────────
  { id: 'pas-1', label: 'Páscoa',            season: 'pascoa',   color: COLORS.pascoa,   special: true },
  { id: 'pas-2', label: '2ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-3', label: '3ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-4', label: '4ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-5', label: '5ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-6', label: '6ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-7', label: 'Ascensão do Senhor',season: 'pascoa',   color: COLORS.pascoa,   special: true },

  // ─── PENTECOSTES ── 1 entrada ───────────────────────────────────────
  { id: 'pen-1', label: 'Pentecostes',       season: 'pentecostes', color: COLORS.pentecostes, onDark: true, special: true },

  // ─── TEMPO COMUM II ── 20 entradas ──────────────────────────────────
  { id: 'tc2-ss', label: 'Ssma Trindade',    season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
  { id: 'tc2-cc', label: 'Corpus Christi',   season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
  { id: 'tc2-12', label: '12ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-13', label: '13ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-14', label: '14ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-15', label: '15ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-16', label: '16ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-17', label: '17ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-18', label: '18ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-19', label: '19ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-20', label: '20ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-21', label: '21ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-22', label: '22ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-23', label: '…',                season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-28', label: '28ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-29', label: '29ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-30', label: '30ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-31', label: '31ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-32', label: '32ª semana',       season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-cr', label: 'Cristo Rei',       season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
];


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  05 · DATAS DO CALENDÁRIO CIVIL                                         │
   │  52 marcações genéricas (apenas referência visual)                      │
   └─────────────────────────────────────────────────────────────────────────┘ */

const DATES = [
  '29/11', '6/12', '13/12', '20/12',                       // Advento
  '25/12', '27/12', '1/1', '3/1', '10/1',                  // Natal
  '17/1', '24/1', '31/1', '7/2', '14/2', '21/2',           // Comum I
  '28/2', '6/3', '13/3', '20/3', '27/3', '3/4', '10/4',    // Quaresma
  '14/4', '15/4',                                           // Tríduo
  '17/4', '24/4', '1/5', '8/5', '15/5', '22/5', '29/5',    // Páscoa
  '5/6',                                                    // Pentecostes
  '12/6', '19/6', '26/6', '3/7', '10/7', '17/7', '24/7',   // Comum II
  '31/7', '7/8', '14/8', '21/8', '28/8', '4/9', '11/9',
  '18/9', '25/9', '2/10', '9/10', '16/10', '23/10',
];


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  06 · FUNÇÕES UTILITÁRIAS                                               │
   └─────────────────────────────────────────────────────────────────────────┘ */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Converte ângulo (0° = topo, sentido horário) em coordenadas cartesianas
 */
function polarToXY(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Gera o path SVG de uma fatia de anel (donut slice)
 */
function arcSlice(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const s1 = polarToXY(cx, cy, rOuter, startDeg);
  const e1 = polarToXY(cx, cy, rOuter, endDeg);
  const s2 = polarToXY(cx, cy, rInner, endDeg);
  const e2 = polarToXY(cx, cy, rInner, startDeg);
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;

  return [
    `M ${s1.x} ${s1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

/**
 * Cria elemento SVG com atributos
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/**
 * Determina a rotação ideal para texto radial mantendo legibilidade
 */
function getRadialRotation(deg) {
  // Texto perpendicular ao raio (lendo de dentro para fora)
  // Se na metade inferior, gira 180° para não ficar de cabeça pra baixo
  if (deg > 90 && deg < 270) {
    return deg + 90;
  }
  return deg - 90;
}


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  07 · CONSTRUÇÃO DA RODA                                                │
   └─────────────────────────────────────────────────────────────────────────┘ */

const TOTAL_WEEKS = WEEKS.length;
const DEG_PER_WEEK = 360 / TOTAL_WEEKS;


/**
 * ANEL 1 — DATAS (anel mais externo)
 */
function buildDateRing() {
  const layer = document.getElementById('layer-dates');
  const labelLayer = document.getElementById('layer-date-labels');

  // Background do anel inteiro
  const ringBg = svgEl('path', {
    d: arcSlice(CX, CY, R_DATE_OUT, R_DATE_IN, 0, 359.999),
    fill: COLORS.neutralBg,
    stroke: 'none',
  });
  layer.appendChild(ringBg);

  // Linha separadora externa do anel
  layer.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: R_DATE_OUT,
    class: 'ring-separator',
  }));
  layer.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: R_DATE_IN,
    class: 'ring-separator',
  }));

  // Cria células e labels
  DATES.forEach((dateStr, i) => {
    const startDeg = i * DEG_PER_WEEK;
    const endDeg = startDeg + DEG_PER_WEEK;
    const midDeg = startDeg + DEG_PER_WEEK / 2;

    // Célula
    const cell = svgEl('path', {
      d: arcSlice(CX, CY, R_DATE_OUT, R_DATE_IN, startDeg, endDeg),
      class: 'date-cell',
    });
    layer.appendChild(cell);

    // Label radial
    const labelR = (R_DATE_OUT + R_DATE_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);
    const rotation = getRadialRotation(midDeg);

    const label = svgEl('text', {
      x: pos.x,
      y: pos.y,
      class: 'date-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: `rotate(${rotation}, ${pos.x}, ${pos.y})`,
    });
    label.textContent = dateStr;
    labelLayer.appendChild(label);
  });
}


/**
 * ANEL 2 — TEMPOS LITÚRGICOS (anel médio)
 */
function buildSeasonRing() {
  const layer = document.getElementById('layer-seasons');
  const labelLayer = document.getElementById('layer-season-labels');

  // Background do anel
  const ringBg = svgEl('path', {
    d: arcSlice(CX, CY, R_SEASON_OUT, R_SEASON_IN, 0, 359.999),
    fill: COLORS.neutralBg,
    stroke: 'none',
  });
  layer.appendChild(ringBg);

  // Linhas separadoras
  layer.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: R_SEASON_OUT,
    class: 'ring-separator',
  }));
  layer.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: R_SEASON_IN,
    class: 'ring-separator',
  }));

  let currentDeg = 0;

  for (const season of SEASONS) {
    const spanDeg = season.weekCount * DEG_PER_WEEK;
    const startDeg = currentDeg;
    const endDeg = currentDeg + spanDeg;
    const midDeg = (startDeg + endDeg) / 2;

    // Fatia do tempo litúrgico
    const slice = svgEl('path', {
      d: arcSlice(CX, CY, R_SEASON_OUT, R_SEASON_IN, startDeg, endDeg),
      fill: season.color,
      class: 'season-cell',
      'data-season': season.id,
      tabindex: '0',
      role: 'button',
      'aria-label': `Tempo litúrgico: ${season.label}`,
    });
    layer.appendChild(slice);

    // Label (curvado para tempos longos, radial para curtos)
    if (spanDeg > 20) {
      buildCurvedSeasonLabel(labelLayer, season, midDeg);
    } else {
      buildRadialSeasonLabel(labelLayer, season, midDeg);
    }

    currentDeg = endDeg;
  }
}


/**
 * Cria texto curvado seguindo o arco do tempo litúrgico
 */
function buildCurvedSeasonLabel(layer, season, midDeg) {
  const defs = document.querySelector('#liturgical-wheel defs');
  const pathId = `season-path-${season.id}`;
  const labelR = (R_SEASON_OUT + R_SEASON_IN) / 2;

  // Determina direção: textos no topo seguem horário, embaixo anti-horário
  const isBottom = midDeg > 90 && midDeg < 270;
  const arcSpan = 30;

  let pathD;
  if (isBottom) {
    // Texto na parte de baixo: arco anti-horário (texto fica de pé)
    const s = polarToXY(CX, CY, labelR - 4, midDeg + arcSpan);
    const e = polarToXY(CX, CY, labelR - 4, midDeg - arcSpan);
    pathD = `M ${s.x} ${s.y} A ${labelR - 4} ${labelR - 4} 0 0 0 ${e.x} ${e.y}`;
  } else {
    // Texto no topo: arco horário
    const s = polarToXY(CX, CY, labelR + 4, midDeg - arcSpan);
    const e = polarToXY(CX, CY, labelR + 4, midDeg + arcSpan);
    pathD = `M ${s.x} ${s.y} A ${labelR + 4} ${labelR + 4} 0 0 1 ${e.x} ${e.y}`;
  }

  const path = svgEl('path', {
    id: pathId,
    d: pathD,
    fill: 'none',
  });
  defs.appendChild(path);

  const text = svgEl('text', {
    class: `season-arc-label ${season.labelOnDark ? 'on-dark' : ''}`,
  });
  const textPath = svgEl('textPath', {
    href: `#${pathId}`,
    startOffset: '50%',
    'text-anchor': 'middle',
  });
  textPath.textContent = season.label;
  text.appendChild(textPath);
  layer.appendChild(text);
}


/**
 * Cria texto radial (perpendicular) para tempos curtos
 */
function buildRadialSeasonLabel(layer, season, midDeg) {
  const labelR = (R_SEASON_OUT + R_SEASON_IN) / 2;
  const pos = polarToXY(CX, CY, labelR, midDeg);
  const rotation = getRadialRotation(midDeg);

  const label = svgEl('text', {
    x: pos.x,
    y: pos.y,
    class: `season-label ${season.labelOnDark ? 'on-dark' : ''}`,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    transform: `rotate(${rotation}, ${pos.x}, ${pos.y})`,
  });
  label.textContent = season.label;
  layer.appendChild(label);
}


/**
 * ANEL 3 — SEMANAS CLICÁVEIS (anel interno)
 */
function buildWeekRing() {
  const layer = document.getElementById('layer-weeks');
  const labelLayer = document.getElementById('layer-week-labels');

  WEEKS.forEach((week, i) => {
    const startDeg = i * DEG_PER_WEEK;
    const endDeg = startDeg + DEG_PER_WEEK;
    const midDeg = startDeg + DEG_PER_WEEK / 2;

    // Célula clicável
    const cell = svgEl('path', {
      d: arcSlice(CX, CY, R_WEEK_OUT, R_WEEK_IN, startDeg, endDeg),
      fill: week.color,
      class: 'week-cell',
      'data-week-id': week.id,
      'data-week-index': i,
      'data-season': week.season,
      tabindex: '0',
      role: 'button',
      'aria-label': `${week.label} — ${getSeasonLabel(week.season)}`,
    });
    layer.appendChild(cell);

    // Label radial
    const labelR = (R_WEEK_OUT + R_WEEK_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);
    const rotation = getRadialRotation(midDeg);

    const cls = [
      'week-label',
      week.onDark ? 'on-dark' : '',
      week.special ? 'special' : '',
    ].filter(Boolean).join(' ');

    const label = svgEl('text', {
      x: pos.x,
      y: pos.y,
      class: cls,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: `rotate(${rotation}, ${pos.x}, ${pos.y})`,
    });
    label.textContent = week.label;
    labelLayer.appendChild(label);
  });
}


/**
 * Linhas divisórias entre células
 */
function buildSpokes() {
  const layer = document.getElementById('layer-spokes');

  // Spokes finos entre cada semana (todo o anel)
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const deg = i * DEG_PER_WEEK;
    const outer = polarToXY(CX, CY, R_DATE_OUT, deg);
    const inner = polarToXY(CX, CY, R_WEEK_IN, deg);

    layer.appendChild(svgEl('line', {
      x1: outer.x, y1: outer.y,
      x2: inner.x, y2: inner.y,
      class: 'spoke',
    }));
  }

  // Spokes maiores nas transições entre tempos litúrgicos
  let currentDeg = 0;
  for (const season of SEASONS) {
    const outer = polarToXY(CX, CY, R_DATE_OUT, currentDeg);
    const inner = polarToXY(CX, CY, R_WEEK_IN, currentDeg);

    layer.appendChild(svgEl('line', {
      x1: outer.x, y1: outer.y,
      x2: inner.x, y2: inner.y,
      class: 'spoke major',
    }));

    currentDeg += season.weekCount * DEG_PER_WEEK;
  }
}


/**
 * Anel guia tracejado interno
 */
function buildGuideRing() {
  const layer = document.getElementById('layer-guide');

  layer.appendChild(svgEl('circle', {
    cx: CX, cy: CY, r: R_GUIDE,
    class: 'guide-ring',
  }));
}


/**
 * Anotação "início do ano litúrgico" + seta curva
 */
function buildAnnotation() {
  const layer = document.getElementById('layer-annotation');

  // Posição do texto (acima e à esquerda do início do Advento)
  const textX = 380;
  const textY = 145;

  const text = svgEl('text', {
    x: textX,
    y: textY,
    class: 'start-annotation',
    'text-anchor': 'end',
  });
  text.textContent = 'início do ano litúrgico';
  layer.appendChild(text);

  // Seta curva apontando para o topo da roda (0°)
  const arrowTarget = polarToXY(CX, CY, R_DATE_OUT + 6, 1);

  const arrow = svgEl('path', {
    d: `M ${textX + 8} ${textY + 4}
        Q ${textX + 70} ${textY + 12},
          ${arrowTarget.x - 3} ${arrowTarget.y - 8}`,
    class: 'start-arrow',
  });
  layer.appendChild(arrow);
}


/**
 * Indicador "HOJE" — calcula a semana atual e marca na roda
 */
function buildTodayMarker() {
  const layer = document.getElementById('layer-today');

  const todayWeekIndex = getTodayWeekIndex();
  const midDeg = (todayWeekIndex + 0.5) * DEG_PER_WEEK;
  const markerPos = polarToXY(CX, CY, R_DATE_OUT + 18, midDeg);

  // Círculo pulsante (background animado)
  const pulse = svgEl('circle', {
    cx: markerPos.x,
    cy: markerPos.y,
    r: 7,
    class: 'today-pulse',
  });
  layer.appendChild(pulse);

  // Marcador sólido
  const marker = svgEl('circle', {
    cx: markerPos.x,
    cy: markerPos.y,
    r: 7,
    class: 'today-marker',
  });
  layer.appendChild(marker);

  // Label "HOJE"
  const labelPos = polarToXY(CX, CY, R_DATE_OUT + 36, midDeg);
  const rotation = getRadialRotation(midDeg);

  const label = svgEl('text', {
    x: labelPos.x,
    y: labelPos.y,
    class: 'today-label',
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    transform: `rotate(${rotation}, ${labelPos.x}, ${labelPos.y})`,
  });
  label.textContent = 'HOJE';
  layer.appendChild(label);
}


/**
 * Calcula aproximadamente em qual semana litúrgica estamos
 * (versão genérica baseada em mês/dia)
 */
function getTodayWeekIndex() {
  const today = new Date();
  const year = today.getFullYear();

  // 1º Domingo do Advento: aproximadamente final de novembro
  let advStart = new Date(year, 10, 29); // 29 de novembro (genérico)
  if (today < advStart) {
    advStart = new Date(year - 1, 10, 29);
  }

  const diffMs = today - advStart;
  const weekIndex = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weekIndex, 0), TOTAL_WEEKS - 1);
}


/**
 * Helper: retorna label do tempo litúrgico pelo id
 */
function getSeasonLabel(seasonId) {
  const s = SEASONS.find(ss => ss.id === seasonId);
  return s ? s.label : '';
}

function getSeasonByWeek(weekId) {
  const w = WEEKS.find(ww => ww.id === weekId);
  if (!w) return null;
  return SEASONS.find(s => s.id === w.season);
}


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  08 · INTERATIVIDADE                                                    │
   └─────────────────────────────────────────────────────────────────────────┘ */

let activeWeekId = null;
let activeSeasonId = null;


/**
 * Click em uma semana
 */
function handleWeekClick(weekId) {
  const week = WEEKS.find(w => w.id === weekId);
  if (!week) return;

  // Toggle: se clicar na mesma semana, deseleciona
  if (activeWeekId === weekId) {
    clearSelection();
    return;
  }

  // Limpa estados
  document.querySelectorAll('.week-cell').forEach(cell => {
    cell.classList.remove('active');
    cell.classList.add('dimmed');
  });
  document.querySelectorAll('.season-cell').forEach(cell => {
    cell.classList.remove('active');
  });
  document.querySelectorAll('.legend-item').forEach(li => {
    li.classList.remove('active');
  });

  // Marca célula ativa
  const cell = document.querySelector(`.week-cell[data-week-id="${weekId}"]`);
  if (cell) {
    cell.classList.add('active');
    cell.classList.remove('dimmed');
  }

  activeWeekId = weekId;
  activeSeasonId = null;
  showWeekDetail(week);
}


/**
 * Click em um tempo litúrgico (anel médio)
 */
function handleSeasonClick(seasonId) {
  // Toggle
  if (activeSeasonId === seasonId) {
    clearSelection();
    return;
  }

  // Destaca todas as semanas daquele tempo
  document.querySelectorAll('.week-cell').forEach(cell => {
    if (cell.dataset.season === seasonId) {
      cell.classList.remove('dimmed');
      cell.classList.add('active');
    } else {
      cell.classList.add('dimmed');
      cell.classList.remove('active');
    }
  });

  document.querySelectorAll('.season-cell').forEach(cell => {
    cell.classList.toggle('active', cell.dataset.season === seasonId);
  });

  document.querySelectorAll('.legend-item').forEach(li => {
    li.classList.remove('active');
  });

  activeWeekId = null;
  activeSeasonId = seasonId;
  showSeasonDetail(seasonId);
}


/**
 * Limpa toda seleção
 */
function clearSelection() {
  document.querySelectorAll('.week-cell').forEach(cell => {
    cell.classList.remove('active', 'dimmed');
  });
  document.querySelectorAll('.season-cell').forEach(cell => {
    cell.classList.remove('active');
  });
  document.querySelectorAll('.legend-item').forEach(li => {
    li.classList.remove('active');
  });
  activeWeekId = null;
  activeSeasonId = null;
  resetDetailPanel();
}


/**
 * Reset do painel
 */
function resetDetailPanel() {
  const inner = document.getElementById('detail-inner');
  inner.innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon" aria-hidden="true">✦ ✦ ✦</div>
      <p>
        Clique em uma semana ou tempo litúrgico na roda
        para conhecer seus detalhes
      </p>
    </div>
  `;
}


/**
 * Detalhe de uma semana específica
 */
function showWeekDetail(week) {
  const season = getSeasonByWeek(week.id);
  const colorName = getColorName(week.color);
  const inner = document.getElementById('detail-inner');

  const isWhite = week.color === COLORS.natal || week.color === COLORS.pascoa;
  const colorBarStyle = isWhite
    ? `background: ${week.color}; border-right: 1px solid var(--c-natal-edge);`
    : `background: ${week.color};`;

  const noteBadge = week.note
    ? `<span class="detail-meta-badge">✦ Domingo ${week.note}</span>`
    : '';

  const specialBadge = week.special && !week.note
    ? `<span class="detail-meta-badge">✦ Celebração</span>`
    : '';

  inner.innerHTML = `
    <article class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="${colorBarStyle}"></div>
        <div class="detail-header-content">
          <p class="detail-eyebrow">${season ? season.label : 'Tempo Litúrgico'}</p>
          <h2 class="detail-title">${week.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background: ${week.color}"></span>
              Cor litúrgica: <strong>${colorName}</strong>
            </span>
            ${season ? `<span class="detail-meta-item"><em>${season.latin}</em></span>` : ''}
            ${noteBadge}
            ${specialBadge}
          </div>
        </div>
      </div>
    </article>
  `;
}


/**
 * Detalhe de um tempo litúrgico
 */
function showSeasonDetail(seasonId) {
  const season = SEASONS.find(s => s.id === seasonId);
  if (!season) return;

  const weeksInSeason = WEEKS.filter(w => w.season === seasonId);
  const colorName = getColorName(season.color);
  const isWhite = season.color === COLORS.natal || season.color === COLORS.pascoa;

  const colorBarStyle = isWhite
    ? `background: ${season.color}; border-right: 1px solid var(--c-natal-edge);`
    : `background: ${season.color};`;

  const inner = document.getElementById('detail-inner');

  inner.innerHTML = `
    <article class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="${colorBarStyle}"></div>
        <div class="detail-header-content">
          <p class="detail-eyebrow">Tempo Litúrgico</p>
          <h2 class="detail-title">${season.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background: ${season.color}"></span>
              Cor: <strong>${colorName}</strong>
            </span>
            <span class="detail-meta-item"><em>${season.latin}</em></span>
            <span class="detail-meta-badge">
              ${weeksInSeason.length} ${weeksInSeason.length === 1 ? 'semana' : 'semanas'}
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}


/**
 * Nome legível da cor
 */
function getColorName(hex) {
  const map = {
    [COLORS.advento]:     'Roxo (Advento)',
    [COLORS.rosa]:        'Rosa',
    [COLORS.natal]:       'Branco',
    [COLORS.comum]:       'Verde',
    [COLORS.quaresma]:    'Roxo (Quaresma)',
    [COLORS.triduo]:      'Vermelho (Tríduo)',
    [COLORS.pascoa]:      'Branco',
    [COLORS.pentecostes]: 'Vermelho (Pentecostes)',
  };
  return map[hex] || 'Litúrgica';
}


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  09 · TOOLTIP                                                           │
   └─────────────────────────────────────────────────────────────────────────┘ */

const tooltip = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipSubtitle = document.getElementById('tooltip-subtitle');
const tooltipBar = document.getElementById('tooltip-bar');


function showTooltipForWeek(week, x, y) {
  const season = getSeasonByWeek(week.id);
  tooltipTitle.textContent = week.label;
  tooltipSubtitle.textContent = season ? season.label : '';
  tooltipBar.style.background = week.color;
  tooltipBar.style.boxShadow =
    `0 0 8px ${week.color}, inset 0 1px 0 rgba(255,255,255,0.3)`;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
}


function showTooltipForSeason(season, x, y) {
  tooltipTitle.textContent = season.label;
  tooltipSubtitle.textContent = season.latin;
  tooltipBar.style.background = season.color;
  tooltipBar.style.boxShadow =
    `0 0 8px ${season.color}, inset 0 1px 0 rgba(255,255,255,0.3)`;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.classList.add('visible');
  tooltip.setAttribute('aria-hidden', 'false');
}


function hideTooltip() {
  tooltip.classList.remove('visible');
  tooltip.setAttribute('aria-hidden', 'true');
}


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  10 · EVENT LISTENERS                                                   │
   └─────────────────────────────────────────────────────────────────────────┘ */

function attachEvents() {
  const wheel = document.getElementById('liturgical-wheel');
  const wrapper = document.querySelector('.wheel-wrapper');


  // ─── Clique no SVG ──────────────────────────────────────────────────
  wheel.addEventListener('click', (e) => {
    const weekCell = e.target.closest('.week-cell');
    if (weekCell) {
      handleWeekClick(weekCell.dataset.weekId);
      return;
    }

    const seasonCell = e.target.closest('.season-cell');
    if (seasonCell) {
      handleSeasonClick(seasonCell.dataset.season);
    }
  });


  // ─── Mousemove → tooltip ────────────────────────────────────────────
  wheel.addEventListener('mousemove', (e) => {
    const weekCell = e.target.closest('.week-cell');
    const seasonCell = e.target.closest('.season-cell');

    if (!weekCell && !seasonCell) {
      hideTooltip();
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (weekCell) {
      const week = WEEKS.find(w => w.id === weekCell.dataset.weekId);
      if (week) showTooltipForWeek(week, x, y);
    } else if (seasonCell) {
      const season = SEASONS.find(s => s.id === seasonCell.dataset.season);
      if (season) showTooltipForSeason(season, x, y);
    }
  });

  wheel.addEventListener('mouseleave', hideTooltip);


  // ─── Teclado ────────────────────────────────────────────────────────
  wheel.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const active = document.activeElement;

    if (active && active.classList.contains('week-cell')) {
      e.preventDefault();
      handleWeekClick(active.dataset.weekId);
    } else if (active && active.classList.contains('season-cell')) {
      e.preventDefault();
      handleSeasonClick(active.dataset.season);
    }
  });


  // ─── Atalhos globais ────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    // Escape limpa seleção
    if (e.key === 'Escape') {
      clearSelection();
      return;
    }

    // Setas navegam entre semanas
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (!activeWeekId) return;

    e.preventDefault();
    const currentIdx = WEEKS.findIndex(w => w.id === activeWeekId);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (currentIdx + dir + WEEKS.length) % WEEKS.length;
    handleWeekClick(WEEKS[nextIdx].id);
  });


  // ─── Legenda → filtro por categoria ─────────────────────────────────
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.season;
      const wasActive = item.classList.contains('active');

      // Limpa estados anteriores
      document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
      document.querySelectorAll('.season-cell').forEach(c => c.classList.remove('active'));

      if (wasActive) {
        clearSelection();
        return;
      }

      item.classList.add('active');

      // Mapeia categoria → tempos
      const seasonMap = {
        advento:     ['advento'],
        natal:       ['natal'],
        comum:       ['comum1', 'comum2'],
        quaresma:    ['quaresma'],
        triduo:      ['triduo'],
        pascoa:      ['pascoa'],
        pentecostes: ['pentecostes'],
        rosa:        [], // especial: filtra por cor
      };

      const targets = seasonMap[key] || [];

      document.querySelectorAll('.week-cell').forEach(cell => {
        const week = WEEKS.find(w => w.id === cell.dataset.weekId);
        let match = false;

        if (key === 'rosa') {
          match = week && week.color === COLORS.rosa;
        } else {
          match = targets.includes(cell.dataset.season);
        }

        if (match) {
          cell.classList.remove('dimmed');
          cell.classList.add('active');
        } else {
          cell.classList.add('dimmed');
          cell.classList.remove('active');
        }
      });

      activeWeekId = null;
      activeSeasonId = null;

      // Se filtro mapeia para 1 tempo único, mostra info dele
      if (targets.length === 1) {
        showSeasonDetail(targets[0]);
      } else {
        resetDetailPanel();
      }
    });
  });
}


/* ┌─────────────────────────────────────────────────────────────────────────┐
   │  11 · INICIALIZAÇÃO                                                     │
   └─────────────────────────────────────────────────────────────────────────┘ */

function init() {
  buildDateRing();
  buildSeasonRing();
  buildWeekRing();
  buildSpokes();
  buildGuideRing();
  buildAnnotation();
  buildTodayMarker();
  attachEvents();

  console.log(
    `✦ Calendário Litúrgico carregado\n` +
    `  · ${TOTAL_WEEKS} semanas\n` +
    `  · ${SEASONS.length} tempos litúrgicos\n` +
    `  · Hoje: semana ${getTodayWeekIndex() + 1}`
  );
}

document.addEventListener('DOMContentLoaded', init);


/* ──────────────────────── FIM DO ARQUIVO ─────────────────────────────── */
