/* ══════════════════════════════════════════════════════════════════════════
   CALENDÁRIO LITÚRGICO — JS
   Abordagem: renderização única via string SVG
   ══════════════════════════════════════════════════════════════════════════ */

'use strict';


/* ─────────────────────── CONSTANTES GEOMÉTRICAS ─────────────────────── */

const CX = 500;
const CY = 500;

const R_OUTER       = 490;
const R_DATE_OUT    = 488;
const R_DATE_IN     = 438;
const R_SEASON_OUT  = 432;
const R_SEASON_IN   = 392;
const R_WEEK_OUT    = 386;
const R_WEEK_IN     = 200;
const R_GUIDE       = 197;
const R_CENTER      = 175;


/* ─────────────────────── PALETA DE CORES ─────────────────────── */

const COLORS = {
  advento:     '#b9a8d4',
  rosa:        '#e8b8c8',
  natal:       '#fdfaf2',
  comum:       '#4ea045',
  quaresma:    '#a690c2',
  triduo:      '#a31827',
  pascoa:      '#fdfaf2',
  pentecostes: '#cc1f2e',
  neutralBg:   '#faf3e0',
};


/* ─────────────────────── TEMPOS LITÚRGICOS ─────────────────────── */

const SEASONS = [
  { id: 'advento',     label: 'Advento',       latin: 'Adventus Domini',     color: COLORS.advento,     weekCount: 4,  onDark: false },
  { id: 'natal',       label: 'Natal',         latin: 'Tempus Nativitatis',  color: COLORS.natal,       weekCount: 5,  onDark: false },
  { id: 'comum1',      label: 'Tempo Comum',   latin: 'Tempus per Annum',    color: COLORS.comum,       weekCount: 6,  onDark: true  },
  { id: 'quaresma',    label: 'Quaresma',      latin: 'Quadragesima',        color: COLORS.quaresma,    weekCount: 7,  onDark: false },
  { id: 'triduo',      label: 'Tríduo Pascal', latin: 'Triduum Paschale',    color: COLORS.triduo,      weekCount: 2,  onDark: true  },
  { id: 'pascoa',      label: 'Páscoa',        latin: 'Tempus Paschale',     color: COLORS.pascoa,      weekCount: 7,  onDark: false },
  { id: 'pentecostes', label: 'Pentecostes',   latin: 'Pentecostes',         color: COLORS.pentecostes, weekCount: 1,  onDark: true  },
  { id: 'comum2',      label: 'Tempo Comum',   latin: 'Tempus per Annum',    color: COLORS.comum,       weekCount: 20, onDark: true  },
];


/* ─────────────────────── SEMANAS (52 total) ─────────────────────── */

const WEEKS = [
  // Advento (4)
  { id: 'adv-1', label: '1ª semana',          season: 'advento',  color: COLORS.advento },
  { id: 'adv-2', label: '2ª semana',          season: 'advento',  color: COLORS.advento },
  { id: 'adv-3', label: '3ª semana',          season: 'advento',  color: COLORS.rosa, note: 'Gaudete' },
  { id: 'adv-4', label: '4ª semana',          season: 'advento',  color: COLORS.advento },

  // Natal (5)
  { id: 'nat-1', label: 'Natal',              season: 'natal',    color: COLORS.natal, special: true },
  { id: 'nat-2', label: 'Sagrada Família',    season: 'natal',    color: COLORS.natal, special: true },
  { id: 'nat-3', label: 'Mãe de Deus',        season: 'natal',    color: COLORS.natal, special: true },
  { id: 'nat-4', label: 'Epifania do Senhor', season: 'natal',    color: COLORS.natal, special: true },
  { id: 'nat-5', label: 'Batismo do Senhor',  season: 'natal',    color: COLORS.natal, special: true },

  // Comum I (6)
  { id: 'tc1-1', label: '1ª semana',          season: 'comum1',   color: COLORS.comum, onDark: true },
  { id: 'tc1-2', label: '2ª semana',          season: 'comum1',   color: COLORS.comum, onDark: true },
  { id: 'tc1-3', label: '3ª semana',          season: 'comum1',   color: COLORS.comum, onDark: true },
  { id: 'tc1-4', label: '4ª semana',          season: 'comum1',   color: COLORS.comum, onDark: true },
  { id: 'tc1-5', label: '5ª semana',          season: 'comum1',   color: COLORS.comum, onDark: true },
  { id: 'tc1-6', label: '…',                  season: 'comum1',   color: COLORS.comum, onDark: true },

  // Quaresma (7)
  { id: 'qua-0', label: '4ª f. Cinzas',       season: 'quaresma', color: COLORS.quaresma, special: true },
  { id: 'qua-1', label: '1ª semana',          season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-2', label: '2ª semana',          season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-3', label: '3ª semana',          season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-4', label: '4ª semana',          season: 'quaresma', color: COLORS.rosa, note: 'Laetare' },
  { id: 'qua-5', label: '5ª semana',          season: 'quaresma', color: COLORS.quaresma },
  { id: 'qua-6', label: 'Dom. de Ramos',      season: 'quaresma', color: COLORS.triduo, onDark: true, special: true },

  // Tríduo (2)
  { id: 'tri-1', label: '5ª f. Santa',        season: 'triduo',   color: COLORS.triduo, onDark: true, special: true },
  { id: 'tri-2', label: '6ª f. Santa',        season: 'triduo',   color: COLORS.triduo, onDark: true, special: true },

  // Páscoa (7)
  { id: 'pas-1', label: 'Páscoa',             season: 'pascoa',   color: COLORS.pascoa, special: true },
  { id: 'pas-2', label: '2ª semana',          season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-3', label: '3ª semana',          season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-4', label: '4ª semana',          season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-5', label: '5ª semana',          season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-6', label: '6ª semana',          season: 'pascoa',   color: COLORS.pascoa },
  { id: 'pas-7', label: 'Ascensão do Senhor', season: 'pascoa',   color: COLORS.pascoa, special: true },

  // Pentecostes (1)
  { id: 'pen-1', label: 'Pentecostes',        season: 'pentecostes', color: COLORS.pentecostes, onDark: true, special: true },

  // Comum II (20)
  { id: 'tc2-ss', label: 'Ssma Trindade',     season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
  { id: 'tc2-cc', label: 'Corpus Christi',    season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
  { id: 'tc2-12', label: '12ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-13', label: '13ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-14', label: '14ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-15', label: '15ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-16', label: '16ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-17', label: '17ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-18', label: '18ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-19', label: '19ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-20', label: '20ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-21', label: '21ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-22', label: '22ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-23', label: '…',                 season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-28', label: '28ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-29', label: '29ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-30', label: '30ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-31', label: '31ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-32', label: '32ª semana',        season: 'comum2',   color: COLORS.comum, onDark: true },
  { id: 'tc2-cr', label: 'Cristo Rei',        season: 'comum2',   color: COLORS.comum, onDark: true, special: true },
];


/* ─────────────────────── DATAS (52) ─────────────────────── */

const DATES = [
  '29/11','6/12','13/12','20/12',
  '25/12','27/12','1/1','3/1','10/1',
  '17/1','24/1','31/1','7/2','14/2','21/2',
  '28/2','6/3','13/3','20/3','27/3','3/4','10/4',
  '14/4','15/4',
  '17/4','24/4','1/5','8/5','15/5','22/5','29/5',
  '5/6',
  '12/6','19/6','26/6','3/7','10/7','17/7','24/7',
  '31/7','7/8','14/8','21/8','28/8','4/9','11/9',
  '18/9','25/9','2/10','9/10','16/10','23/10',
];


/* ═══════════════════════════════════════════════════════════════════════
   FUNÇÕES UTILITÁRIAS
   ═══════════════════════════════════════════════════════════════════════ */

const TOTAL_WEEKS = WEEKS.length;
const DEG_PER_WEEK = 360 / TOTAL_WEEKS;

function polarToXY(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcSlice(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const s1 = polarToXY(cx, cy, rOuter, startDeg);
  const e1 = polarToXY(cx, cy, rOuter, endDeg);
  const s2 = polarToXY(cx, cy, rInner, endDeg);
  const e2 = polarToXY(cx, cy, rInner, startDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s1.x} ${s1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${rInner} ${rInner} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
}

function getRadialRotation(deg) {
  // Mantém texto sempre legível (não fica de cabeça pra baixo)
  if (deg > 90 && deg < 270) {
    return deg + 90;
  }
  return deg - 90;
}

function getSeasonById(id) {
  return SEASONS.find(s => s.id === id);
}


/* ═══════════════════════════════════════════════════════════════════════
   CÁLCULO DA SEMANA ATUAL (HOJE)
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Converte uma data (mês/dia) em "dia desde o início do ano litúrgico"
 * O ano litúrgico começa em ~29/11 (dia 333 do ano civil)
 */
function monthDayToLiturgicalDay(month, day) {
  // Dias acumulados até o início de cada mês (não-bissexto)
  const cumDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const dayOfYear = cumDays[month - 1] + day;

  // Início do ano litúrgico: 29/11 = dia 333 do ano civil
  const liturgicalStart = 333;

  // Datas de nov-dez (>= 333): início do ano litúrgico (0 a 32)
  if (dayOfYear >= liturgicalStart) {
    return dayOfYear - liturgicalStart;
  }
  // Datas de jan-nov (< 333): meio/fim do ano litúrgico (33 a 365)
  return dayOfYear + (365 - liturgicalStart);
}

/**
 * Encontra a célula da roda mais próxima da data de hoje.
 * Procura a DATE cujo "dia litúrgico" está mais próximo (e não no futuro distante).
 */
function getTodayWeekIndex() {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const todayLitDay = monthDayToLiturgicalDay(todayMonth, todayDay);

  let bestIdx = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < DATES.length; i++) {
    const [dayStr, monthStr] = DATES[i].split('/');
    const cellDay = parseInt(dayStr, 10);
    const cellMonth = parseInt(monthStr, 10);
    const cellLitDay = monthDayToLiturgicalDay(cellMonth, cellDay);

    // Diferença: positivo = célula já passou ou é hoje
    const diff = todayLitDay - cellLitDay;

    // Queremos a célula mais recente que já passou (diff entre 0 e 6 dias)
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }

  return bestIdx;
}


/* ═══════════════════════════════════════════════════════════════════════
   RENDERIZADORES (cada um retorna STRING SVG)
   ═══════════════════════════════════════════════════════════════════════ */


/* ─── DEFS (gradientes, filtros) ─── */
function renderDefs() {
  return `
    <defs>
      <radialGradient id="gold-grad" cx="35%" cy="30%" r="80%">
        <stop offset="0%"   stop-color="#fff5d6" />
        <stop offset="25%"  stop-color="#e8c34a" />
        <stop offset="55%"  stop-color="#b8891a" />
        <stop offset="100%" stop-color="#7a5a0e" />
      </radialGradient>

      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a3e2c" />
      </marker>
    </defs>
  `;
}


/* ─── Fundo da roda ─── */
function renderBackground() {
  return `
    <circle cx="${CX}" cy="${CY}" r="${R_OUTER}" fill="${COLORS.neutralBg}" />
    <circle cx="${CX}" cy="${CY}" r="${R_OUTER}" class="outer-ring" />
  `;
}


/* ─── Anel de DATAS ─── */
function renderDateRing() {
  let cells = '';
  let labels = '';

  cells += `<path d="${arcSlice(CX, CY, R_DATE_OUT, R_DATE_IN, 0, 359.999)}" fill="${COLORS.neutralBg}" />`;

  DATES.forEach((dateStr, i) => {
    const startDeg = i * DEG_PER_WEEK;
    const endDeg = startDeg + DEG_PER_WEEK;
    const midDeg = startDeg + DEG_PER_WEEK / 2;

    cells += `<path d="${arcSlice(CX, CY, R_DATE_OUT, R_DATE_IN, startDeg, endDeg)}" class="date-cell" />`;

    const labelR = (R_DATE_OUT + R_DATE_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);
    const rotation = getRadialRotation(midDeg);

    labels += `<text x="${pos.x}" y="${pos.y}" class="date-label"
                     text-anchor="middle" dominant-baseline="central"
                     transform="rotate(${rotation}, ${pos.x}, ${pos.y})">${dateStr}</text>`;
  });

  cells += `<circle cx="${CX}" cy="${CY}" r="${R_DATE_OUT}" class="ring-divider" />`;
  cells += `<circle cx="${CX}" cy="${CY}" r="${R_DATE_IN}" class="ring-divider" />`;

  return `<g id="layer-dates">${cells}${labels}</g>`;
}


/* ─── Anel de TEMPOS LITÚRGICOS ─── */
function renderSeasonRing() {
  let cells = '';
  let labels = '';
  let arcPaths = '';

  cells += `<path d="${arcSlice(CX, CY, R_SEASON_OUT, R_SEASON_IN, 0, 359.999)}" fill="${COLORS.neutralBg}" />`;

  let currentDeg = 0;

  SEASONS.forEach((season, idx) => {
    const spanDeg = season.weekCount * DEG_PER_WEEK;
    const startDeg = currentDeg;
    const endDeg = currentDeg + spanDeg;
    const midDeg = (startDeg + endDeg) / 2;

    cells += `<path d="${arcSlice(CX, CY, R_SEASON_OUT, R_SEASON_IN, startDeg, endDeg)}"
                    fill="${season.color}" class="season-cell"
                    data-season="${season.id}"
                    tabindex="0" role="button"
                    aria-label="Tempo litúrgico: ${season.label}" />`;

    if (spanDeg > 22) {
      const labelR = (R_SEASON_OUT + R_SEASON_IN) / 2;
      const isBottom = midDeg > 90 && midDeg < 270;
      const arcSpan = Math.min(25, spanDeg / 3);
      const pathId = `season-arc-${idx}`;

      let pathD;
      if (isBottom) {
        const s = polarToXY(CX, CY, labelR - 4, midDeg + arcSpan);
        const e = polarToXY(CX, CY, labelR - 4, midDeg - arcSpan);
        pathD = `M ${s.x} ${s.y} A ${labelR - 4} ${labelR - 4} 0 0 0 ${e.x} ${e.y}`;
      } else {
        const s = polarToXY(CX, CY, labelR + 4, midDeg - arcSpan);
        const e = polarToXY(CX, CY, labelR + 4, midDeg + arcSpan);
        pathD = `M ${s.x} ${s.y} A ${labelR + 4} ${labelR + 4} 0 0 1 ${e.x} ${e.y}`;
      }

      arcPaths += `<path id="${pathId}" d="${pathD}" fill="none" />`;
      labels += `<text class="season-label ${season.onDark ? 'on-dark' : ''}">
                   <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${season.label}</textPath>
                 </text>`;
    } else {
      const labelR = (R_SEASON_OUT + R_SEASON_IN) / 2;
      const pos = polarToXY(CX, CY, labelR, midDeg);
      const rotation = getRadialRotation(midDeg);
      labels += `<text x="${pos.x}" y="${pos.y}"
                       class="season-label ${season.onDark ? 'on-dark' : ''}"
                       text-anchor="middle" dominant-baseline="central"
                       transform="rotate(${rotation}, ${pos.x}, ${pos.y})">${season.label}</text>`;
    }

    currentDeg = endDeg;
  });

  cells += `<circle cx="${CX}" cy="${CY}" r="${R_SEASON_OUT}" class="ring-divider" />`;
  cells += `<circle cx="${CX}" cy="${CY}" r="${R_SEASON_IN}" class="ring-divider" />`;

  return `<defs>${arcPaths}</defs><g id="layer-seasons">${cells}${labels}</g>`;
}


/* ─── Anel de SEMANAS (CLICÁVEL) ─── */
function renderWeekRing() {
  let cells = '';
  let labels = '';

  WEEKS.forEach((week, i) => {
    const startDeg = i * DEG_PER_WEEK;
    const endDeg = startDeg + DEG_PER_WEEK;
    const midDeg = startDeg + DEG_PER_WEEK / 2;

    cells += `<path d="${arcSlice(CX, CY, R_WEEK_OUT, R_WEEK_IN, startDeg, endDeg)}"
                    fill="${week.color}" class="week-cell"
                    data-week-id="${week.id}"
                    data-week-index="${i}"
                    data-season="${week.season}"
                    tabindex="0" role="button"
                    aria-label="${week.label} - ${getSeasonById(week.season)?.label || ''}" />`;

    const labelR = (R_WEEK_OUT + R_WEEK_IN) / 2;
    const pos = polarToXY(CX, CY, labelR, midDeg);
    const rotation = getRadialRotation(midDeg);

    const cls = [
      'week-label',
      week.onDark ? 'on-dark' : '',
      week.special ? 'special' : '',
    ].filter(Boolean).join(' ');

    labels += `<text x="${pos.x}" y="${pos.y}" class="${cls}"
                     text-anchor="middle" dominant-baseline="central"
                     transform="rotate(${rotation}, ${pos.x}, ${pos.y})">${week.label}</text>`;
  });

  return `<g id="layer-weeks">${cells}${labels}</g>`;
}


/* ─── Spokes (linhas divisórias) ─── */
function renderSpokes() {
  let spokes = '';

  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const deg = i * DEG_PER_WEEK;
    const o = polarToXY(CX, CY, R_DATE_OUT, deg);
    const inn = polarToXY(CX, CY, R_WEEK_IN, deg);
    spokes += `<line x1="${o.x}" y1="${o.y}" x2="${inn.x}" y2="${inn.y}" class="spoke" />`;
  }

  let currentDeg = 0;
  for (const season of SEASONS) {
    const o = polarToXY(CX, CY, R_DATE_OUT, currentDeg);
    const inn = polarToXY(CX, CY, R_WEEK_IN, currentDeg);
    spokes += `<line x1="${o.x}" y1="${o.y}" x2="${inn.x}" y2="${inn.y}" class="spoke major" />`;
    currentDeg += season.weekCount * DEG_PER_WEEK;
  }

  return `<g id="layer-spokes">${spokes}</g>`;
}


/* ─── Anel guia tracejado ─── */
function renderGuideRing() {
  return `<circle cx="${CX}" cy="${CY}" r="${R_GUIDE}" class="guide-ring" />`;
}


/* ─── Anotação "início do ano litúrgico" ─── */
function renderAnnotation() {
  const target = polarToXY(CX, CY, R_DATE_OUT + 4, 2);
  return `
    <g id="layer-annotation">
      <text x="380" y="140" class="start-annotation" text-anchor="end">início do ano litúrgico</text>
      <path d="M 388 144 Q 460 152, ${target.x - 5} ${target.y - 5}"
            class="start-arrow" marker-end="url(#arrow)" />
    </g>
  `;
}


/* ─── Indicador HOJE ─── */
function renderTodayMarker() {
  const idx = getTodayWeekIndex();
  const midDeg = (idx + 0.5) * DEG_PER_WEEK;
  const pos = polarToXY(CX, CY, R_DATE_OUT + 18, midDeg);
  const labelPos = polarToXY(CX, CY, R_DATE_OUT + 38, midDeg);
  const rotation = getRadialRotation(midDeg);

  console.log(`HOJE → célula ${idx} (${DATES[idx]}) — ${WEEKS[idx]?.label || '?'}`);

  return `
    <g id="layer-today">
      <circle cx="${pos.x}" cy="${pos.y}" r="7" class="today-pulse" />
      <circle cx="${pos.x}" cy="${pos.y}" r="7" class="today-marker" />
      <text x="${labelPos.x}" y="${labelPos.y}" class="today-label"
            text-anchor="middle" dominant-baseline="central"
            transform="rotate(${rotation}, ${labelPos.x}, ${labelPos.y})">HOJE</text>
    </g>
  `;
}


/* ─── Centro PLACEHOLDER (círculo dourado simples) ─── */
function renderCenter() {
  return `
    <g id="center-emblem" transform="translate(${CX}, ${CY})">
      <circle cx="0" cy="0" r="${R_CENTER}" class="center-placeholder" />
      <circle cx="0" cy="0" r="${R_CENTER - 8}" class="center-placeholder-inner" />
      <circle cx="0" cy="0" r="${R_CENTER - 16}" class="center-placeholder-inner" />
      <text y="-12" class="center-placeholder-text">AGNUS DEI</text>
      <text y="14" class="center-placeholder-subtext">[ imagem aqui ]</text>
      <text y="38" class="center-placeholder-subtext" style="font-size:10px;opacity:0.7">Α · Ω</text>
    </g>
  `;
}


/* ═══════════════════════════════════════════════════════════════════════
   RENDERIZAÇÃO COMPLETA
   ═══════════════════════════════════════════════════════════════════════ */

function renderWheel() {
  const svg = document.getElementById('liturgical-wheel');

  const html = `
    ${renderDefs()}
    ${renderBackground()}
    ${renderDateRing()}
    ${renderSeasonRing()}
    ${renderWeekRing()}
    ${renderSpokes()}
    ${renderGuideRing()}
    ${renderAnnotation()}
    ${renderTodayMarker()}
    ${renderCenter()}
  `;

  svg.innerHTML = html;
}


/* ═══════════════════════════════════════════════════════════════════════
   INTERATIVIDADE
   ═══════════════════════════════════════════════════════════════════════ */

let activeWeekId = null;
let activeSeasonId = null;


function handleWeekClick(weekId) {
  const week = WEEKS.find(w => w.id === weekId);
  if (!week) return;

  if (activeWeekId === weekId) {
    clearSelection();
    return;
  }

  document.querySelectorAll('.week-cell').forEach(c => {
    c.classList.remove('active');
    c.classList.add('dimmed');
  });
  document.querySelectorAll('.season-cell').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));

  const cell = document.querySelector(`.week-cell[data-week-id="${weekId}"]`);
  if (cell) {
    cell.classList.add('active');
    cell.classList.remove('dimmed');
  }

  activeWeekId = weekId;
  activeSeasonId = null;
  showWeekDetail(week);
}


function handleSeasonClick(seasonId) {
  if (activeSeasonId === seasonId) {
    clearSelection();
    return;
  }

  document.querySelectorAll('.week-cell').forEach(c => {
    if (c.dataset.season === seasonId) {
      c.classList.remove('dimmed');
      c.classList.add('active');
    } else {
      c.classList.add('dimmed');
      c.classList.remove('active');
    }
  });

  document.querySelectorAll('.season-cell').forEach(c => {
    c.classList.toggle('active', c.dataset.season === seasonId);
  });
  document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));

  activeWeekId = null;
  activeSeasonId = seasonId;
  showSeasonDetail(seasonId);
}


function clearSelection() {
  document.querySelectorAll('.week-cell').forEach(c => c.classList.remove('active', 'dimmed'));
  document.querySelectorAll('.season-cell').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
  activeWeekId = null;
  activeSeasonId = null;
  resetDetail();
}


function resetDetail() {
  document.getElementById('detail-inner').innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon">✦ ✦ ✦</div>
      <p>Clique em uma semana ou tempo litúrgico para ver detalhes</p>
    </div>
  `;
}


function showWeekDetail(week) {
  const season = getSeasonById(week.season);
  const colorName = getColorName(week.color);
  const isWhite = week.color === COLORS.natal || week.color === COLORS.pascoa;
  const barStyle = isWhite
    ? `background:${week.color};border-right:1px solid #c9b88e`
    : `background:${week.color}`;

  document.getElementById('detail-inner').innerHTML = `
    <article class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="${barStyle}"></div>
        <div class="detail-body">
          <p class="detail-eyebrow">${season?.label || 'Tempo Litúrgico'}</p>
          <h2 class="detail-title">${week.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background:${week.color}"></span>
              <strong>${colorName}</strong>
            </span>
            ${season ? `<span class="detail-meta-item"><em>${season.latin}</em></span>` : ''}
            ${week.note ? `<span class="detail-meta-item">✦ Domingo ${week.note}</span>` : ''}
            ${week.special && !week.note ? `<span class="detail-meta-item">✦ Celebração</span>` : ''}
          </div>
        </div>
      </div>
    </article>
  `;
}


function showSeasonDetail(seasonId) {
  const season = getSeasonById(seasonId);
  if (!season) return;
  const weeks = WEEKS.filter(w => w.season === seasonId);
  const colorName = getColorName(season.color);
  const isWhite = season.color === COLORS.natal || season.color === COLORS.pascoa;
  const barStyle = isWhite
    ? `background:${season.color};border-right:1px solid #c9b88e`
    : `background:${season.color}`;

  document.getElementById('detail-inner').innerHTML = `
    <article class="detail-card">
      <div class="detail-header">
        <div class="detail-color-bar" style="${barStyle}"></div>
        <div class="detail-body">
          <p class="detail-eyebrow">Tempo Litúrgico</p>
          <h2 class="detail-title">${season.label}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item">
              <span class="detail-meta-dot" style="background:${season.color}"></span>
              <strong>${colorName}</strong>
            </span>
            <span class="detail-meta-item"><em>${season.latin}</em></span>
            <span class="detail-meta-item">${weeks.length} ${weeks.length === 1 ? 'semana' : 'semanas'}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}


function getColorName(hex) {
  const map = {
    [COLORS.advento]:     'Roxo (Advento)',
    [COLORS.rosa]:        'Rosa',
    [COLORS.natal]:       'Branco',
    [COLORS.comum]:       'Verde',
    [COLORS.quaresma]:    'Roxo (Quaresma)',
    [COLORS.triduo]:      'Vermelho (Tríduo)',
    [COLORS.pentecostes]: 'Vermelho (Pentecostes)',
  };
  return map[hex] || 'Litúrgica';
}


/* ─── Tooltip ─── */
function showTooltip(data, x, y) {
  const tt = document.getElementById('tooltip');
  tt.querySelector('.tooltip-title').textContent = data.title;
  tt.querySelector('.tooltip-subtitle').textContent = data.subtitle;
  const bar = tt.querySelector('.tooltip-bar');
  bar.style.background = data.color;
  bar.style.boxShadow = `0 0 8px ${data.color}`;
  tt.style.left = x + 'px';
  tt.style.top = y + 'px';
  tt.classList.add('visible');
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}


/* ─── Event listeners ─── */
function attachEvents() {
  const wheel = document.getElementById('liturgical-wheel');
  const wrapper = document.querySelector('.wheel-wrapper');

  wheel.addEventListener('click', (e) => {
    const wc = e.target.closest('.week-cell');
    if (wc) { handleWeekClick(wc.dataset.weekId); return; }
    const sc = e.target.closest('.season-cell');
    if (sc) handleSeasonClick(sc.dataset.season);
  });

  wheel.addEventListener('mousemove', (e) => {
    const wc = e.target.closest('.week-cell');
    const sc = e.target.closest('.season-cell');
    if (!wc && !sc) { hideTooltip(); return; }

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (wc) {
      const week = WEEKS.find(w => w.id === wc.dataset.weekId);
      const season = getSeasonById(week.season);
      showTooltip({ title: week.label, subtitle: season?.label || '', color: week.color }, x, y);
    } else if (sc) {
      const season = getSeasonById(sc.dataset.season);
      showTooltip({ title: season.label, subtitle: season.latin, color: season.color }, x, y);
    }
  });

  wheel.addEventListener('mouseleave', hideTooltip);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { clearSelection(); return; }
    if (!activeWeekId || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const idx = WEEKS.findIndex(w => w.id === activeWeekId);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (idx + dir + WEEKS.length) % WEEKS.length;
    handleWeekClick(WEEKS[next].id);
  });

  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      const wasActive = item.classList.contains('active');

      document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
      document.querySelectorAll('.season-cell').forEach(c => c.classList.remove('active'));

      if (wasActive) { clearSelection(); return; }

      item.classList.add('active');

      const map = {
        advento: ['advento'], natal: ['natal'],
        comum: ['comum1', 'comum2'], quaresma: ['quaresma'],
        triduo: ['triduo'], pascoa: ['pascoa'],
        pentecostes: ['pentecostes'], rosa: [],
      };
      const targets = map[key] || [];

      document.querySelectorAll('.week-cell').forEach(c => {
        const week = WEEKS.find(w => w.id === c.dataset.weekId);
        const match = key === 'rosa'
          ? week.color === COLORS.rosa
          : targets.includes(c.dataset.season);
        if (match) { c.classList.remove('dimmed'); c.classList.add('active'); }
        else { c.classList.add('dimmed'); c.classList.remove('active'); }
      });

      activeWeekId = null;
      activeSeasonId = null;
      if (targets.length === 1) showSeasonDetail(targets[0]);
      else resetDetail();
    });
  });
}


/* ═══════════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════════ */

function init() {
  try {
    renderWheel();
    attachEvents();
    console.log(`✓ Calendário Litúrgico OK · ${TOTAL_WEEKS} semanas · ${SEASONS.length} tempos`);
  } catch (err) {
    console.error('Erro ao renderizar:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);
