/* ══════════════════════════════════════════════════════════════
   CALENDÁRIO LITÚRGICO — JS
   Constrói a roda dinamicamente e gerencia interações
   ══════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════════════════
   CONSTANTES GEOMÉTRICAS
   ══════════════════════════════════════════════════════════════ */

const CX = 500;
const CY = 500;

// Raios dos anéis (do externo ao interno)
const R_OUTER       = 490;   // borda externa
const R_DATE_OUT    = 488;   // borda externa do anel de datas
const R_DATE_IN     = 430;   // borda interna do anel de datas
const R_SEASON_OUT  = 428;   // borda externa do anel de tempos
const R_SEASON_IN   = 395;   // borda interna do anel de tempos
const R_WEEK_OUT    = 393;   // borda externa do anel de semanas
const R_WEEK_IN     = 195;   // borda interna do anel de semanas (toca o centro)
const R_GUIDE       = 200;   // anel guia tracejado
const R_CENTER      = 185;   // raio do emblema central

/* ══════════════════════════════════════════════════════════════
   DADOS DO CALENDÁRIO LITÚRGICO
   Genérico — sem ano específico
   Total: 52 semanas distribuídas em 360°
   ══════════════════════════════════════════════════════════════ */

// Cores litúrgicas (mesmas variáveis do CSS)
const COLORS = {
  advento:    '#c9bce0',
  adventoDk:  '#a896c4',
  gaudete:    '#f0c8d8',  // rosa
  natal:      '#ffffff',
  natalStk:   '#d4c5a0',
  comum:      '#4a9b3f',
  comumDk:    '#357a2c',
  comumLt:    '#6bb85e',
  quaresma:   '#b8a8d4',
  quaresmaDk: '#9888b8',
  laetare:    '#f0c8d8',  // rosa
  triduo:     '#a01825',
  triduoDk:   '#7a0f1a',
  pascoa:     '#ffffff',
  pentecostes:'#c8202d',
};

/* ─── TEMPOS LITÚRGICOS (anel médio) ─── */
// Cada tempo ocupa um arco que agrupa várias semanas
const SEASONS = [
  { id: 'advento',  label: 'Advento',      color: COLORS.advento,    textColor: '#2a2218', weekCount: 4 },
  { id: 'natal',    label: 'Natal',        color: COLORS.natal,      textColor: '#2a2218', weekCount: 4 },  // Natal, Sagrada Família, Mãe de Deus, Epifania, Batismo do Senhor
  { id: 'comum1',   label: 'Tempo Comum',  color: COLORS.comum,      textColor: '#ffffff', weekCount: 6 },
  { id: 'quaresma', label: 'Quaresma',     color: COLORS.quaresma,   textColor: '#2a2218', weekCount: 7 },  // Cinzas + 5 semanas + Ramos
  { id: 'triduo',   label: 'Tríduo Pascal',color: COLORS.triduo,     textColor: '#ffffff', weekCount: 1 },
  { id: 'pascoa',   label: 'Páscoa',       color: COLORS.pascoa,     textColor: '#2a2218', weekCount: 8 },  // Páscoa, 2ª-6ª, Ascensão, 7ª
  { id: 'pentecostes', label: 'Pentecostes', color: COLORS.pentecostes, textColor: '#ffffff', weekCount: 1 },
  { id: 'comum2',   label: 'Tempo Comum',  color: COLORS.comum,      textColor: '#ffffff', weekCount: 23 }, // 12ª até 34ª (Cristo Rei)
];

/* ─── SEMANAS (anel interno — TODAS CLICÁVEIS) ─── */
// Cada semana tem: id único, label, tempo a que pertence, cor opcional (sobrescreve a do tempo)
const WEEKS = [
  // ADVENTO (4 semanas)
  { id: 'adv-1', label: '1ª semana',         season: 'advento',  color: COLORS.advento },
  { id: 'adv-2', label: '2ª semana',         season: 'advento',  color: COLORS.advento },
  { id: 'adv-3', label: '3ª semana',         season: 'advento',  color: COLORS.gaudete }, // Gaudete (rosa)
  { id: 'adv-4', label: '4ª semana',         season: 'advento',  color: COLORS.advento },

  // NATAL (5 marcadores)
  { id: 'nat-1', label: 'Natal',             season: 'natal',    color: COLORS.natal, special: true },
  { id: 'nat-2', label: 'Sagrada Família',   season: 'natal',    color: COLORS.natal },
  { id: 'nat-3', label: 'Mãe de Deus',       season: 'natal',    color: COLORS.natal },
  { id: 'nat-4', label: 'Epifania do Senhor',season: 'natal',    color: COLORS.natal },
  { id: 'nat-5', label: 'Batismo do Senhor', season: 'natal',    color: COLORS.natal },

  // TEMPO COMUM I (5 semanas + reticências)
  { id: 'tc1-1', label: '1ª semana',         season: 'comum1',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc1-2', label: '2ª semana',         season: 'comum1',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc1-3', label: '3ª semana',         season: 'comum1',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc1-4', label: '4ª semana',         season: 'comum1',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc1-5', label: '5ª semana',         season: 'comum1',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc1-6', label: '…',                 season: 'comum1',   color: COLORS.comum, textColor: '#fff' },

  // QUARESMA (Cinzas + 5 semanas + Ramos)
  { id: 'qua-0', label: '4ª feira de Cinzas',season: 'quaresma', color: COLORS.quaresma, special: true },
  { id: 'qua-1', label: '1ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-2', label: '2ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-3', label: '3ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-4', label: '4ª semana',         season: 'quaresma', color: COLORS.laetare }, // Laetare (rosa)
  { id: 'qua-5', label: '5ª semana',         season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-6', label: 'Domingo de Ramos',  season: 'quaresma', color: COLORS.triduo, textColor: '#fff', special: true },

  // TRÍDUO PASCAL
  { id: 'tri-1', label: '5ª feira Santa',    season: 'triduo',   color: COLORS.triduo, textColor: '#fff', special: true },
  { id: 'tri-2', label: '6ª feira Santa',    season: 'triduo',   color: COLORS.triduo, textColor: '#fff', special: true },

  // PÁSCOA (8 marcadores)
  { id: 'pas-1', label: 'Páscoa',            season: 'pascoa',   color: COLORS.pascoa, special: true },
  { id: 'pas-2', label: '2ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-3', label: '3ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-4', label: '4ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-5', label: '5ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-6', label: '6ª semana',         season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-7', label: 'Ascensão do Senhor',season: 'pascoa',   color: COLORS.pascoa, special: true },
  { id: 'pas-8', label: '7ª semana',         season: 'pascoa',   color: COLORS.pascoa },

  // PENTECOSTES
  { id: 'pen-1', label: 'Pentecostes',       season: 'pentecostes', color: COLORS.pentecostes, textColor: '#fff', special: true },

  // TEMPO COMUM II (12ª até 34ª = Cristo Rei) — 23 entradas
  { id: 'tc2-x', label: '…',                 season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-cc',label: 'Corpus Christi',    season: 'comum2',   color: COLORS.comum, textColor: '#fff', special: true },
  { id: 'tc2-ss',label: 'Ssma Trindade',     season: 'comum2',   color: COLORS.comum, textColor: '#fff', special: true },
  { id: 'tc2-12',label: '12ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-13',label: '13ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-14',label: '14ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-15',label: '15ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-16',label: '16ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-17',label: '17ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-18',label: '18ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-19',label: '19ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-20',label: '20ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-21',label: '21ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-22',label: '22ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-23',label: '23ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-24',label: '24ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-25',label: '25ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-26',label: '26ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-27',label: '27ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-28',label: '28ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-29',label: '29ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-30',label: '30ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-31',label: '31ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-32',label: '32ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-33',label: '33ª semana',        season: 'comum2',   color: COLORS.comum, textColor: '#fff' },
  { id: 'tc2-cr',label: 'Cristo Rei',        season: 'comum2',   color: COLORS.comum, textColor: '#fff', special: true },
];

/* ─── DATAS (anel externo — apenas referência visual, genérico) ─── */
// 52 marcadores de data — um por semana
// Distribuídos a partir do 1º Domingo do Advento (≈ final de Novembro)
const DATES = [
  '29/11', '6/12', '13/12', '20/12',        // Advento
  '25/12', '27/12', '1/1', '3/1', '10/1',   // Natal
  '17/1', '24/1', '31/1', '7/2', '14/2', '21/2',  // Comum I
  '28/2', '6/3', '13/3', '20/3', '27/3', '3/4',   // Quaresma
  '10/4', '17/4',                            // Tríduo + início Páscoa
  '24/4', '1/5', '8/5', '15/5', '22/5', '29/5',  // Páscoa
  '5/6', '12/6', '19/6', '26/6',             // Pentecostes + início Comum II
  '3/7', '10/7', '17/7', '24/7', '31/7',
  '7/8', '14/8', '21/8', '28/8',
  '4/9', '11/9', '18/9', '25/9',
  '2/10', '9/10', '16/10', '23/10', '30/10',
  '6/11', '13/11', '20/11', '27/11',         // Cristo Rei + retorno ao Advento
];

/* ══════════════════════════════════════════════════════════════
   FUNÇÕES UTILITÁRIAS
   ══════════════════════════════════════════════════════════════ */

/**
 * Converte ângulo em graus (0° no topo, sentido horário) para coordenadas
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
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/**
 * Calcula a rotação ideal para um texto radial
 * Garante que o texto sempre seja legível (não fica de cabeça para baixo)
 */
function getRadialRotation(deg) {
  // Se o ângulo está na metade inferior (90°-270°), gira 180°
  if (deg > 90 && deg < 270) {
    return deg + 180;
  }
  return deg;
}

/* ══════════════════════════════════════════════════════════════
   CONSTRUÇÃO DA RODA
   ══════════════════════════════════════════════════════════════ */

const TOTAL_WEEKS = WEEKS.length;
const DEG_PER_WEEK = 360 / TOTAL_WEEKS;

/**
 * Constrói o anel externo de datas (52 células)
 */
function buildDateRing() {
  const layer = document.getElementById('layer-dates');
  const labelLayer = document.getElementById('layer-date-labels');

  const totalDates = DATES.length;
  const degPerDate = 360 / totalDates;

  for (let i = 0; i < totalDates; i++) {
    const startDeg = i * degPerDate;
    const endDeg = startDeg + degPerDate;
    const midDeg = (startDeg + endDeg) / 2;

    // Célula
    const cell = svgEl('path', {
      d: arcSlice(CX, CY, R_DATE_OUT, R_DATE_IN, startDeg, endDeg),
      class: 'date-cell',
    });
    layer.appendChild(cell);

    // Label da data — radial, perpendicular ao raio (texto "deitado")
    const labelR = (R_DATE_OUT + R_DATE_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);
    const rotation = getRadialRotation(midDeg);

    const label = svgEl('text', {
      x: pos.x,
      y: pos.y,
      class: 'date-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: `rotate(${rotation - 90}, ${pos.x}, ${pos.y})`,
    });
    label.textContent = DATES[i];
    labelLayer.appendChild(label);
  }
}

/**
 * Constrói o anel médio de tempos litúrgicos
 */
function buildSeasonRing() {
  const layer = document.getElementById('layer-seasons');
  const labelLayer = document.getElementById('layer-season-labels');

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
    });
    layer.appendChild(slice);

    // Label do tempo — perpendicular ao raio (lendo no sentido radial)
    const labelR = (R_SEASON_OUT + R_SEASON_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);

    // Para spans largos, usa textPath em arco. Para pequenos, usa texto reto.
    if (spanDeg > 30) {
      // Texto curvado ao longo do arco
      buildCurvedText(labelLayer, season.label, labelR, midDeg, season.textColor, 'season-label');
    } else {
      // Texto radial (perpendicular)
      const rotation = getRadialRotation(midDeg);
      const label = svgEl('text', {
        x: pos.x,
        y: pos.y,
        class: 'season-label',
        fill: season.textColor,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        transform: `rotate(${rotation - 90}, ${pos.x}, ${pos.y})`,
      });
      label.textContent = season.label;
      labelLayer.appendChild(label);
    }

    currentDeg = endDeg;
  }
}

/**
 * Constrói texto curvado ao longo de um arco (para tempos longos como "Tempo Comum")
 */
function buildCurvedText(layer, text, radius, midDeg, color, className) {
  const defs = document.querySelector('#liturgical-wheel defs');
  const pathId = `arc-text-${Math.random().toString(36).slice(2, 9)}`;

  // Verifica se o texto deve ser desenhado "de cabeça para baixo" no topo ou normal embaixo
  // Para textos no topo (entre -90° e 90°), arco no sentido horário, texto vira de cabeça para baixo
  // Solução: para esses casos, usa um arco "invertido" (raio interno) com texto correto
  const isBottom = midDeg > 90 && midDeg < 270;
  const arcRadius = isBottom ? radius - 8 : radius + 8;
  const sweep = isBottom ? 1 : 1; // sempre horário

  // Define um arco amplo para o texto seguir
  const arcSpan = 40; // graus de cada lado do mid
  const startDeg = midDeg - arcSpan;
  const endDeg = midDeg + arcSpan;

  let pathD;
  if (isBottom) {
    // No fundo: arco invertido (sentido anti-horário) para o texto ficar de pé
    const s = polarToXY(CX, CY, arcRadius, endDeg);
    const e = polarToXY(CX, CY, arcRadius, startDeg);
    pathD = `M ${s.x} ${s.y} A ${arcRadius} ${arcRadius} 0 0 0 ${e.x} ${e.y}`;
  } else {
    // No topo: arco normal (sentido horário)
    const s = polarToXY(CX, CY, arcRadius, startDeg);
    const e = polarToXY(CX, CY, arcRadius, endDeg);
    pathD = `M ${s.x} ${s.y} A ${arcRadius} ${arcRadius} 0 0 1 ${e.x} ${e.y}`;
  }

  const path = svgEl('path', { id: pathId, d: pathD, fill: 'none' });
  defs.appendChild(path);

  const text = svgEl('text', { class: className, fill: color });
  const textPath = svgEl('textPath', {
    href: `#${pathId}`,
    startOffset: '50%',
    'text-anchor': 'middle',
  });
  textPath.textContent = text;
  text.appendChild(textPath);
  layer.appendChild(text);
}

/**
 * Constrói o anel interno de semanas (CLICÁVEIS)
 */
function buildWeekRing() {
  const layer = document.getElementById('layer-weeks');
  const labelLayer = document.getElementById('layer-week-labels');

  WEEKS.forEach((week, i) => {
    const startDeg = i * DEG_PER_WEEK;
    const endDeg = startDeg + DEG_PER_WEEK;
    const midDeg = (startDeg + endDeg) / 2;

    // Célula clicável
    const cell = svgEl('path', {
      d: arcSlice(CX, CY, R_WEEK_OUT, R_WEEK_IN, startDeg, endDeg),
      fill: week.color,
      class: 'week-cell',
      'data-week-id': week.id,
      'data-season': week.season,
      'data-week-index': i,
      tabindex: '0',
      role: 'button',
      'aria-label': `${week.label}, ${getSeasonLabel(week.season)}`,
    });
    layer.appendChild(cell);

    // Label da semana — radial (texto perpendicular ao raio, lendo de dentro para fora)
    const labelR = (R_WEEK_OUT + R_WEEK_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);

    // Rotação para texto radial: na metade superior, texto aponta "para fora"
    // Na metade inferior, gira 180° para manter legibilidade
    const isBottom = midDeg > 90 && midDeg < 270;
    const rotation = isBottom ? midDeg + 90 : midDeg - 90;

    const textColor = week.textColor || '#2a2218';
    const labelClass = week.special
      ? `week-label special ${week.textColor === '#fff' ? 'on-red' : ''}`
      : 'week-label';

    const label = svgEl('text', {
      x: pos.x,
      y: pos.y,
      class: labelClass,
      fill: textColor,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      transform: `rotate(${rotation}, ${pos.x}, ${pos.y})`,
    });
    label.textContent = week.label;
    labelLayer.appendChild(label);
  });
}

/**
 * Constrói as linhas divisórias (spokes) entre datas e semanas
 */
function buildSpokes() {
  const layer = document.getElementById('layer-spokes');

  // Spokes entre cada semana (interno)
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const deg = i * DEG_PER_WEEK;
    const outer = polarToXY(CX, CY, R_DATE_OUT, deg);
    const inner = polarToXY(CX, CY, R_WEEK_IN, deg);

    const line = svgEl('line', {
      x1: outer.x, y1: outer.y,
      x2: inner.x, y2: inner.y,
      class: 'spoke',
    });
    layer.appendChild(line);
  }

  // Spokes maiores nas transições entre tempos litúrgicos
  let currentDeg = 0;
  for (const season of SEASONS) {
    const outer = polarToXY(CX, CY, R_DATE_OUT, currentDeg);
    const inner = polarToXY(CX, CY, R_WEEK_IN, currentDeg);

    const line = svgEl('line', {
      x1: outer.x, y1: outer.y,
      x2: inner.x, y2: inner.y,
      class: 'spoke major',
    });
    layer.appendChild(line);

    currentDeg += season.weekCount * DEG_PER_WEEK;
  }
}

/**
 * Constrói o anel guia tracejado (separa semanas do centro)
 */
function buildGuideRing() {
  const layer = document.getElementById('layer-guide');

  const guide = svgEl('circle', {
    cx: CX, cy: CY, r: R_GUIDE,
    class: 'guide-ring',
  });
  layer.appendChild(guide);
}

/**
 * Constrói a anotação "início do ano litúrgico" com seta
 */
function buildAnnotation() {
  const layer = document.getElementById('layer-annotation');

  // Posição do texto (acima e à esquerda do topo da roda)
  const textX = 380;
  const textY = 180;

  const text = svgEl('text', {
    x: textX,
    y: textY,
    class: 'start-annotation',
    'text-anchor': 'end',
  });
  text.textContent = 'início do ano litúrgico';
  layer.appendChild(text);

  // Seta apontando do texto para o início do Advento (topo da roda)
  const startPoint = polarToXY(CX, CY, R_DATE_OUT + 5, 0);

  const arrow = svgEl('path', {
    d: `M ${textX + 5} ${textY + 3} Q ${textX + 60} ${textY + 10}, ${startPoint.x - 5} ${startPoint.y - 5}`,
    class: 'start-arrow',
  });
  layer.appendChild(arrow);
}

/**
 * Indicador "HOJE" — posicionado em uma semana aleatória por enquanto
 * (na versão genérica, sem datas reais, usamos a semana atual aproximada)
 */
function buildTodayMarker() {
  const layer = document.getElementById('layer-today');

  // Calcula aproximadamente em qual semana estamos hoje
  // Por enquanto, fixo na "1ª semana do Advento" como exemplo
  const todayWeekIndex = getTodayWeekIndex();
  const deg = (todayWeekIndex + 0.5) * DEG_PER_WEEK;

  const markerPos = polarToXY(CX, CY, R_DATE_OUT + 18, deg);

  // Círculo pulsante
  const pulse = svgEl('circle', {
    cx: markerPos.x, cy: markerPos.y, r: 6,
    class: 'today-pulse',
  });
  layer.appendChild(pulse);

  // Marcador sólido
  const marker = svgEl('circle', {
    cx: markerPos.x, cy: markerPos.y, r: 6,
    class: 'today-marker',
  });
  layer.appendChild(marker);

  // Label "HOJE"
  const labelPos = polarToXY(CX, CY, R_DATE_OUT + 38, deg);
  const rotation = getRadialRotation(deg);
  const label = svgEl('text', {
    x: labelPos.x, y: labelPos.y,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    transform: `rotate(${rotation - 90}, ${labelPos.x}, ${labelPos.y})`,
    'font-family': 'Cinzel, serif',
    'font-size': '9',
    'font-weight': '700',
    'letter-spacing': '2',
    fill: '#b8891a',
  });
  label.textContent = 'HOJE';
  layer.appendChild(label);
}

/**
 * Calcula aproximadamente a semana atual no ano litúrgico (genérico)
 */
function getTodayWeekIndex() {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const day = today.getDate();

  // Mapeamento aproximado: cada mês ≈ certas semanas
  // Início do Advento: ~ final de novembro
  // 52 semanas começam em ~29/11
  const yearStart = new Date(today.getFullYear(), 10, 29); // 29 de novembro
  let diffMs = today - yearStart;
  if (diffMs < 0) {
    // ainda no ano litúrgico anterior
    diffMs += 365 * 24 * 60 * 60 * 1000;
  }
  const weekIndex = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weekIndex, 0), TOTAL_WEEKS - 1);
}

/**
 * Helper: retorna o label do tempo litúrgico pelo id
 */
function getSeasonLabel(seasonId) {
  const s = SEASONS.find(ss => ss.id === seasonId);
  return s ? s.label : '';
}

/* ══════════════════════════════════════════════════════════════
   INTERATIVIDADE
   ══════════════════════════════════════════════════════════════ */

let activeWeekId = null;

/**
 * Lida com clique em uma semana
 */
function handleWeekClick(weekId) {
  const week = WEEKS.find(w => w.id === weekId);
  if (!week) return;

  // Toggle: se clicar na mesma, deseleciona
  if (activeWeekId === weekId) {
    clearActive();
    return;
  }

  // Limpa estados anteriores
  document.querySelectorAll('.week-cell').forEach(cell => {
    cell.classList.remove('active');
    cell.classList.add('dimmed');
  });

  // Marca a célula ativa
  const cell = document.querySelector(`.week-cell[data-week-id="${weekId}"]`);
  if (cell) {
    cell.classList.add('active');
    cell.classList.remove('dimmed');
  }

  activeWeekId = weekId;
  showWeekDetail(week);
}

/**
 * Lida com clique em um tempo litúrgico (anel médio)
 */
function handleSeasonClick(seasonId) {
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

  activeWeekId = null;
  showSeasonDetail(seasonId);
}

/**
 * Limpa seleção
 */
function clearActive() {
  document.querySelectorAll('.week-cell').forEach(cell => {
    cell.classList.remove('active', 'dimmed');
  });
  document.querySelectorAll('.legend-item').forEach(li => {
    li.classList.remove('active');
  });
  activeWeekId = null;
  resetDetailPanel();
}

/**
 * Reset do painel de detalhes
 */
function resetDetailPanel() {
  const inner = document.getElementById('detail-inner');
  inner.innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon">✦ ✦ ✦</div>
      <p>Clique em uma semana ou tempo litúrgico para ver detalhes</p>
    </div>
  `;
}

/**
 * Mostra detalhes de uma semana no painel
 */
function showWeekDetail(week) {
  const season = SEASONS.find(s => s.id === week.season);
  const inner = document.getElementById('detail-inner');

  inner.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="background: ${week.color}; ${week.color === '#ffffff' ? 'border-right: 1px solid #d4c5a0;' : ''}"></div>
        <div class="detail-header-content">
          <p class="detail-eyebrow">${season ? season.label : 'Tempo Litúrgico'}</p>
          <h2 class="detail-title">${week.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background: ${week.color}"></span>
              Cor: ${getColorName(week.color)}
            </span>
            ${week.special ? `<span class="detail-meta-item">✦ Celebração especial</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mostra detalhes de um tempo litúrgico
 */
function showSeasonDetail(seasonId) {
  const season = SEASONS.find(s => s.id === seasonId);
  if (!season) return;

  const weeksInSeason = WEEKS.filter(w => w.season === seasonId);
  const inner = document.getElementById('detail-inner');

  inner.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="background: ${season.color}; ${season.color === '#ffffff' ? 'border-right: 1px solid #d4c5a0;' : ''}"></div>
        <div class="detail-header-content">
          <p class="detail-eyebrow">Tempo Litúrgico</p>
          <h2 class="detail-title">${season.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background: ${season.color}"></span>
              Cor: ${getColorName(season.color)}
            </span>
            <span class="detail-meta-item">📅 ${weeksInSeason.length} ${weeksInSeason.length === 1 ? 'semana/marcador' : 'semanas/marcadores'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Nome legível da cor
 */
function getColorName(hex) {
  const map = {
    [COLORS.advento]:    'Roxo (Advento)',
    [COLORS.gaudete]:    'Rosa (Gaudete/Laetare)',
    [COLORS.natal]:      'Branco',
    [COLORS.comum]:      'Verde',
    [COLORS.quaresma]:   'Roxo (Quaresma)',
    [COLORS.triduo]:     'Vermelho escuro',
    [COLORS.pentecostes]:'Vermelho',
  };
  return map[hex] || 'Litúrgica';
}

/* ══════════════════════════════════════════════════════════════
   TOOLTIP
   ══════════════════════════════════════════════════════════════ */

const tooltip = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipSubtitle = document.getElementById('tooltip-subtitle');
const tooltipBar = document.getElementById('tooltip-bar');

function showTooltip(week, x, y) {
  const season = SEASONS.find(s => s.id === week.season);
  tooltipTitle.textContent = week.label;
  tooltipSubtitle.textContent = season ? season.label : '';
  tooltipBar.style.background = week.color;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.classList.add('visible');
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

/* ══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ══════════════════════════════════════════════════════════════ */

function attachEvents() {
  const wheel = document.getElementById('liturgical-wheel');
  const wrapper = document.querySelector('.wheel-wrapper');

  // Clique em semana
  wheel.addEventListener('click', (e) => {
    const cell = e.target.closest('.week-cell');
    if (cell) {
      handleWeekClick(cell.dataset.weekId);
      return;
    }

    const seasonCell = e.target.closest('.season-cell');
    if (seasonCell) {
      handleSeasonClick(seasonCell.dataset.season);
    }
  });

  // Hover em semana → tooltip
  wheel.addEventListener('mousemove', (e) => {
    const cell = e.target.closest('.week-cell');
    if (!cell) {
      hideTooltip();
      return;
    }
    const week = WEEKS.find(w => w.id === cell.dataset.weekId);
    if (!week) return;

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    showTooltip(week, x, y);
  });

  wheel.addEventListener('mouseleave', hideTooltip);

  // Teclado: Enter/Espaço em célula com foco
  wheel.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const active = document.activeElement;
    if (active && active.classList.contains('week-cell')) {
      e.preventDefault();
      handleWeekClick(active.dataset.weekId);
    }
  });

  // Escape para limpar seleção
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearActive();
  });

  // Setas para navegar entre semanas
  document.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    if (!activeWeekId) return;

    e.preventDefault();
    const currentIdx = WEEKS.findIndex(w => w.id === activeWeekId);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const nextIdx = (currentIdx + dir + WEEKS.length) % WEEKS.length;
    handleWeekClick(WEEKS[nextIdx].id);
  });

  // Legenda → filtra/destaca
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const seasonKey = item.dataset.season;
      const isActive = item.classList.contains('active');

      // Limpa estados
      document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));

      if (isActive) {
        clearActive();
        return;
      }

      item.classList.add('active');

      // Mapeia chave da legenda para tempos da roda
      const seasonMap = {
        advento: ['advento'],
        natal: ['natal'],
        comum: ['comum1', 'comum2'],
        quaresma: ['quaresma'],
        triduo: ['triduo'],
        pascoa: ['pascoa', 'pentecostes'],
        rosa: [], // tratamento especial: destaca células rosas
      };

      const targets = seasonMap[seasonKey] || [];

      document.querySelectorAll('.week-cell').forEach(cell => {
        const week = WEEKS.find(w => w.id === cell.dataset.weekId);
        let match = false;

        if (seasonKey === 'rosa') {
          match = week && week.color === COLORS.gaudete;
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

      // Mostra info do tempo no painel (apenas se 1 tempo)
      if (targets.length === 1) {
        showSeasonDetail(targets[0]);
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ══════════════════════════════════════════════════════════════ */

function init() {
  buildDateRing();
  buildSeasonRing();
  buildWeekRing();
  buildSpokes();
  buildGuideRing();
  buildAnnotation();
  buildTodayMarker();
  attachEvents();

  console.log(`✦ Calendário Litúrgico carregado · ${TOTAL_WEEKS} semanas · ${SEASONS.length} tempos`);
}

document.addEventListener('DOMContentLoaded', init);
