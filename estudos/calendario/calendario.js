/* ══════════════════════════════════════════════════════════════════════════
   CALENDÁRIO LITÚRGICO — JS v2.0
   ─────────────────────────────────────────────────────────────────────────
   Arquitetura:
   • Módulos isolados (Config, Data, Geometry, Render, State, Events, App)
   • Renderização única via string SVG (sem appendChild)
   • Estado centralizado e imutável
   • Tratamento de erros em camadas
   • Logging estruturado
   • Validação de dados na inicialização
   ══════════════════════════════════════════════════════════════════════════ */

'use strict';


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 01 · CONFIG (constantes globais)                              ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Config = Object.freeze({

  // ─── Geometria SVG ─────────────────────────────────────────────────
  geometry: Object.freeze({
    cx: 500,
    cy: 500,
    viewBox: '0 0 1000 1000',
    radii: Object.freeze({
      outer:      490,
      dateOut:    488,
      dateIn:     438,
      seasonOut:  432,
      seasonIn:   392,
      weekOut:    386,
      weekIn:     200,
      guide:      197,
      center:     175,
    }),
  }),

  // ─── Paleta litúrgica ──────────────────────────────────────────────
  colors: Object.freeze({
    advento:     '#b9a8d4',
    rosa:        '#e8b8c8',
    natal:       '#fdfaf2',
    comum:       '#4ea045',
    quaresma:    '#a690c2',
    triduo:      '#a31827',
    pascoa:      '#fdfaf2',
    pentecostes: '#cc1f2e',
    neutralBg:   '#faf3e0',
    gold:        '#b8891a',
    goldDark:    '#7a5a0e',
    whiteEdge:   '#c9b88e',
  }),

  // ─── Comportamento ────────────────────────────────────────────────
  behavior: Object.freeze({
    tooltipOffset: { x: 0, y: -125 },
    debounceMs: 50,
    minSpanForCurvedLabel: 22,
    arcLabelOffsetTop: 4,
    arcLabelOffsetBottom: -4,
  }),

  // ─── Debug ────────────────────────────────────────────────────────
  debug: Object.freeze({
    enabled: true,
    verbose: false,
  }),
});


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 02 · LOGGER (saídas formatadas no console)                    ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Logger = {
  _prefix: '✦ Calendário',

  info(...args) {
    if (Config.debug.enabled) {
      console.log(`%c${this._prefix}%c`, 'color:#b8891a;font-weight:bold', '', ...args);
    }
  },

  warn(...args) {
    console.warn(`%c${this._prefix} ⚠%c`, 'color:#cc8800;font-weight:bold', '', ...args);
  },

  error(...args) {
    console.error(`%c${this._prefix} ✗%c`, 'color:#cc1f2e;font-weight:bold', '', ...args);
  },

  success(...args) {
    if (Config.debug.enabled) {
      console.log(`%c${this._prefix} ✓%c`, 'color:#4ea045;font-weight:bold', '', ...args);
    }
  },

  debug(...args) {
    if (Config.debug.enabled && Config.debug.verbose) {
      console.log(`%c${this._prefix} ⚙%c`, 'color:#888', '', ...args);
    }
  },

  group(label, fn) {
    if (!Config.debug.enabled) { fn(); return; }
    console.group(`${this._prefix} · ${label}`);
    try { fn(); } finally { console.groupEnd(); }
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 03 · DATA (tempos, semanas, datas)                            ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const { colors: C } = Config;

const Data = Object.freeze({

  /* ─── Tempos litúrgicos ─────────────────────────────────────────── */
  seasons: Object.freeze([
    { id: 'advento',     label: 'Advento',       latin: 'Adventus Domini',     color: C.advento,     weekCount: 4,  onDark: false },
    { id: 'natal',       label: 'Natal',         latin: 'Tempus Nativitatis',  color: C.natal,       weekCount: 5,  onDark: false },
    { id: 'comum1',      label: 'Tempo Comum',   latin: 'Tempus per Annum',    color: C.comum,       weekCount: 6,  onDark: true  },
    { id: 'quaresma',    label: 'Quaresma',      latin: 'Quadragesima',        color: C.quaresma,    weekCount: 7,  onDark: false },
    { id: 'triduo',      label: 'Tríduo Pascal', latin: 'Triduum Paschale',    color: C.triduo,      weekCount: 2,  onDark: true  },
    { id: 'pascoa',      label: 'Páscoa',        latin: 'Tempus Paschale',     color: C.pascoa,      weekCount: 7,  onDark: false },
    { id: 'pentecostes', label: 'Pentecostes',   latin: 'Pentecostes',         color: C.pentecostes, weekCount: 1,  onDark: true  },
    { id: 'comum2',      label: 'Tempo Comum',   latin: 'Tempus per Annum',    color: C.comum,       weekCount: 20, onDark: true  },
  ]),

  /* ─── 52 semanas ────────────────────────────────────────────────── */
  weeks: Object.freeze([
    // Advento (4)
    { id: 'adv-1', label: '1ª semana',          season: 'advento',  color: C.advento },
    { id: 'adv-2', label: '2ª semana',          season: 'advento',  color: C.advento },
    { id: 'adv-3', label: '3ª semana',          season: 'advento',  color: C.rosa, note: 'Gaudete' },
    { id: 'adv-4', label: '4ª semana',          season: 'advento',  color: C.advento },

    // Natal (5)
    { id: 'nat-1', label: 'Natal',              season: 'natal',    color: C.natal, special: true },
    { id: 'nat-2', label: 'Sagrada Família',    season: 'natal',    color: C.natal, special: true },
    { id: 'nat-3', label: 'Mãe de Deus',        season: 'natal',    color: C.natal, special: true },
    { id: 'nat-4', label: 'Epifania do Senhor', season: 'natal',    color: C.natal, special: true },
    { id: 'nat-5', label: 'Batismo do Senhor',  season: 'natal',    color: C.natal, special: true },

    // Comum I (6)
    { id: 'tc1-1', label: '1ª semana',          season: 'comum1',   color: C.comum, onDark: true },
    { id: 'tc1-2', label: '2ª semana',          season: 'comum1',   color: C.comum, onDark: true },
    { id: 'tc1-3', label: '3ª semana',          season: 'comum1',   color: C.comum, onDark: true },
    { id: 'tc1-4', label: '4ª semana',          season: 'comum1',   color: C.comum, onDark: true },
    { id: 'tc1-5', label: '5ª semana',          season: 'comum1',   color: C.comum, onDark: true },
    { id: 'tc1-6', label: '…',                  season: 'comum1',   color: C.comum, onDark: true },

    // Quaresma (7)
    { id: 'qua-0', label: '4ª f. Cinzas',       season: 'quaresma', color: C.quaresma, special: true },
    { id: 'qua-1', label: '1ª semana',          season: 'quaresma', color: C.quaresma },
    { id: 'qua-2', label: '2ª semana',          season: 'quaresma', color: C.quaresma },
    { id: 'qua-3', label: '3ª semana',          season: 'quaresma', color: C.quaresma },
    { id: 'qua-4', label: '4ª semana',          season: 'quaresma', color: C.rosa, note: 'Laetare' },
    { id: 'qua-5', label: '5ª semana',          season: 'quaresma', color: C.quaresma },
    { id: 'qua-6', label: 'Dom. de Ramos',      season: 'quaresma', color: C.triduo, onDark: true, special: true },

    // Tríduo (2)
    { id: 'tri-1', label: '5ª f. Santa',        season: 'triduo',   color: C.triduo, onDark: true, special: true },
    { id: 'tri-2', label: '6ª f. Santa',        season: 'triduo',   color: C.triduo, onDark: true, special: true },

    // Páscoa (7)
    { id: 'pas-1', label: 'Páscoa',             season: 'pascoa',   color: C.pascoa, special: true },
    { id: 'pas-2', label: '2ª semana',          season: 'pascoa',   color: C.pascoa },
    { id: 'pas-3', label: '3ª semana',          season: 'pascoa',   color: C.pascoa },
    { id: 'pas-4', label: '4ª semana',          season: 'pascoa',   color: C.pascoa },
    { id: 'pas-5', label: '5ª semana',          season: 'pascoa',   color: C.pascoa },
    { id: 'pas-6', label: '6ª semana',          season: 'pascoa',   color: C.pascoa },
    { id: 'pas-7', label: 'Ascensão do Senhor', season: 'pascoa',   color: C.pascoa, special: true },

    // Pentecostes (1)
    { id: 'pen-1', label: 'Pentecostes',        season: 'pentecostes', color: C.pentecostes, onDark: true, special: true },

    // Comum II (20)
    { id: 'tc2-ss', label: 'Ssma Trindade',     season: 'comum2',   color: C.comum, onDark: true, special: true },
    { id: 'tc2-cc', label: 'Corpus Christi',    season: 'comum2',   color: C.comum, onDark: true, special: true },
    { id: 'tc2-12', label: '12ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-13', label: '13ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-14', label: '14ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-15', label: '15ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-16', label: '16ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-17', label: '17ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-18', label: '18ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-19', label: '19ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-20', label: '20ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-21', label: '21ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-22', label: '22ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-23', label: '…',                 season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-28', label: '28ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-29', label: '29ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-30', label: '30ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-31', label: '31ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-32', label: '32ª semana',        season: 'comum2',   color: C.comum, onDark: true },
    { id: 'tc2-cr', label: 'Cristo Rei',        season: 'comum2',   color: C.comum, onDark: true, special: true },
  ]),

  /* ─── 52 datas civis (referência visual) ────────────────────────── */
  dates: Object.freeze([
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
  ]),

  /* ─── Nomes legíveis das cores ──────────────────────────────────── */
  colorNames: Object.freeze({
    [C.advento]:     'Roxo (Advento)',
    [C.rosa]:        'Rosa',
    [C.natal]:       'Branco',
    [C.comum]:       'Verde',
    [C.quaresma]:    'Roxo (Quaresma)',
    [C.triduo]:      'Vermelho (Tríduo)',
    [C.pentecostes]: 'Vermelho (Pentecostes)',
  }),

  /* ─── Mapeamento legenda → tempos ───────────────────────────────── */
  legendMap: Object.freeze({
    advento:     ['advento'],
    natal:       ['natal'],
    comum:       ['comum1', 'comum2'],
    quaresma:    ['quaresma'],
    triduo:      ['triduo'],
    pascoa:      ['pascoa'],
    pentecostes: ['pentecostes'],
    rosa:        [], // tratamento especial por cor
  }),
});


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 04 · VALIDATION (sanidade dos dados)                          ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Validation = {

  /**
   * Valida toda a estrutura de dados antes da renderização.
   * Lança erro descritivo se algo estiver inconsistente.
   */
  validateAll() {
    const errors = [];

    // Total de semanas == total de datas
    if (Data.weeks.length !== Data.dates.length) {
      errors.push(
        `Inconsistência: ${Data.weeks.length} semanas vs ${Data.dates.length} datas`
      );
    }

    // Soma das weekCount dos tempos == total de semanas
    const totalSeasonWeeks = Data.seasons.reduce((sum, s) => sum + s.weekCount, 0);
    if (totalSeasonWeeks !== Data.weeks.length) {
      errors.push(
        `Inconsistência: soma de weekCount = ${totalSeasonWeeks}, mas existem ${Data.weeks.length} semanas`
      );
    }

    // Cada semana referencia um tempo existente
    const seasonIds = new Set(Data.seasons.map(s => s.id));
    Data.weeks.forEach((w, i) => {
      if (!seasonIds.has(w.season)) {
        errors.push(`Semana #${i} (${w.id}) referencia tempo inexistente: ${w.season}`);
      }
    });

    // IDs únicos
    const weekIds = Data.weeks.map(w => w.id);
    const uniqueIds = new Set(weekIds);
    if (uniqueIds.size !== weekIds.length) {
      errors.push(`Existem IDs de semana duplicados`);
    }

    // Datas no formato dd/mm
    Data.dates.forEach((d, i) => {
      if (!/^\d{1,2}\/\d{1,2}$/.test(d)) {
        errors.push(`Data #${i} em formato inválido: "${d}"`);
      }
    });

    if (errors.length > 0) {
      throw new Error(`Validação falhou:\n  • ${errors.join('\n  • ')}`);
    }

    Logger.success(`Validação OK: ${Data.weeks.length} semanas, ${Data.seasons.length} tempos`);
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 05 · GEOMETRY (matemática vetorial)                           ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Geometry = {

  TOTAL_WEEKS: Data.weeks.length,
  DEG_PER_WEEK: 360 / Data.weeks.length,

  /**
   * Converte ângulo em graus (0° = topo, sentido horário) para coordenadas (x, y)
   */
  polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  },

  /**
   * Gera path SVG de uma fatia de anel (donut slice)
   */
  arcSlice(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const s1 = this.polar(cx, cy, rOuter, startDeg);
    const e1 = this.polar(cx, cy, rOuter, endDeg);
    const s2 = this.polar(cx, cy, rInner, endDeg);
    const e2 = this.polar(cx, cy, rInner, startDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)}` +
           ` A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x.toFixed(2)} ${e1.y.toFixed(2)}` +
           ` L ${s2.x.toFixed(2)} ${s2.y.toFixed(2)}` +
           ` A ${rInner} ${rInner} 0 ${large} 0 ${e2.x.toFixed(2)} ${e2.y.toFixed(2)} Z`;
  },

  /**
   * Path SVG de um arco simples (sem preenchimento)
   */
  arcPath(cx, cy, r, startDeg, endDeg, sweepFlag = 1) {
    const s = this.polar(cx, cy, r, startDeg);
    const e = this.polar(cx, cy, r, endDeg);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweepFlag} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  },

  /**
   * Rotação para texto radial — sempre legível (nunca de cabeça pra baixo)
   */
  radialRotation(deg) {
    return (deg > 90 && deg < 270) ? deg + 90 : deg - 90;
  },

  /**
   * Retorna {startDeg, endDeg, midDeg} para a célula de índice i
   */
  cellAngles(i) {
    const start = i * this.DEG_PER_WEEK;
    const end = start + this.DEG_PER_WEEK;
    return { startDeg: start, endDeg: end, midDeg: start + this.DEG_PER_WEEK / 2 };
  },

  /**
   * Calcula ângulos para um tempo litúrgico baseado em seus índices
   */
  seasonAngles(startIdx, weekCount) {
    const startDeg = startIdx * this.DEG_PER_WEEK;
    const endDeg = startDeg + weekCount * this.DEG_PER_WEEK;
    return { startDeg, endDeg, midDeg: (startDeg + endDeg) / 2, spanDeg: endDeg - startDeg };
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 06 · DATEUTILS (cálculo do ano litúrgico)                     ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const DateUtils = {

  /**
   * Dias acumulados até o início de cada mês (não-bissexto)
   */
  CUMULATIVE_DAYS: [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],

  /**
   * Início do ano litúrgico ≈ 29/11 = dia 333 do ano civil
   */
  LITURGICAL_START_DAY: 333,
  YEAR_LENGTH: 365,

  /**
   * Converte (mês, dia) em "dia desde o início do ano litúrgico" (0–364)
   */
  toLiturgicalDay(month, day) {
    if (month < 1 || month > 12) {
      throw new RangeError(`Mês inválido: ${month}`);
    }
    if (day < 1 || day > 31) {
      throw new RangeError(`Dia inválido: ${day}`);
    }

    const dayOfYear = this.CUMULATIVE_DAYS[month - 1] + day;

    if (dayOfYear >= this.LITURGICAL_START_DAY) {
      return dayOfYear - this.LITURGICAL_START_DAY;
    }
    return dayOfYear + (this.YEAR_LENGTH - this.LITURGICAL_START_DAY);
  },

  /**
   * Parseia string "dd/mm" → { day, month }
   */
  parseDate(str) {
    const [d, m] = str.split('/').map(n => parseInt(n, 10));
    if (isNaN(d) || isNaN(m)) {
      throw new Error(`Data inválida: "${str}"`);
    }
    return { day: d, month: m };
  },

  /**
   * Encontra o índice da célula cuja data está mais próxima de hoje
   * (procura a célula cuja data já passou e é a mais recente)
   */
  findTodayCellIndex(dates = Data.dates) {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayLitDay = this.toLiturgicalDay(todayMonth, todayDay);

    // Calcula dia litúrgico de cada célula
    const cellDays = dates.map(str => {
      const { day, month } = this.parseDate(str);
      return this.toLiturgicalDay(month, day);
    });

    // Procura a célula mais recente cujo dia <= hoje
    let bestIdx = 0;
    let bestDay = -1;

    for (let i = 0; i < cellDays.length; i++) {
      if (cellDays[i] <= todayLitDay && cellDays[i] > bestDay) {
        bestDay = cellDays[i];
        bestIdx = i;
      }
    }

    Logger.debug(`Hoje: ${todayDay}/${todayMonth} (dia litúrgico ${todayLitDay}) → célula ${bestIdx}`);

    return bestIdx;
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 07 · QUERIES (consultas aos dados)                            ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Queries = {

  // Caches para acelerar lookups
  _seasonById: null,
  _weekById: null,
  _weeksBySeason: null,
  _weekIndexById: null,

  _initCaches() {
    this._seasonById = new Map(Data.seasons.map(s => [s.id, s]));
    this._weekById = new Map(Data.weeks.map(w => [w.id, w]));
    this._weekIndexById = new Map(Data.weeks.map((w, i) => [w.id, i]));

    this._weeksBySeason = new Map();
    Data.seasons.forEach(s => this._weeksBySeason.set(s.id, []));
    Data.weeks.forEach(w => {
      const arr = this._weeksBySeason.get(w.season);
      if (arr) arr.push(w);
    });
  },

  seasonById(id) {
    if (!this._seasonById) this._initCaches();
    return this._seasonById.get(id) || null;
  },

  weekById(id) {
    if (!this._weekById) this._initCaches();
    return this._weekById.get(id) || null;
  },

  weekIndex(id) {
    if (!this._weekIndexById) this._initCaches();
    return this._weekIndexById.has(id) ? this._weekIndexById.get(id) : -1;
  },

  weeksBySeason(id) {
    if (!this._weeksBySeason) this._initCaches();
    return this._weeksBySeason.get(id) || [];
  },

  colorName(hex) {
    return Data.colorNames[hex] || 'Litúrgica';
  },

  /**
   * Retorna o índice de início (cumulativo) de um tempo no array de weeks
   */
  seasonStartIndex(seasonId) {
    let idx = 0;
    for (const s of Data.seasons) {
      if (s.id === seasonId) return idx;
      idx += s.weekCount;
    }
    return -1;
  },

  isWhiteColor(hex) {
    return hex === Config.colors.natal || hex === Config.colors.pascoa;
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 08 · STATE (estado global da aplicação)                       ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const State = {
  activeWeekId: null,
  activeSeasonId: null,
  activeLegendKey: null,
  isInitialized: false,

  reset() {
    this.activeWeekId = null;
    this.activeSeasonId = null;
    this.activeLegendKey = null;
  },

  hasSelection() {
    return this.activeWeekId !== null || this.activeSeasonId !== null;
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 09 · DOM (helpers seguros para manipulação DOM)               ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const DOM = {

  /** Pega um elemento, lança erro se não existir */
  get(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Elemento #${id} não encontrado no DOM`);
    return el;
  },

  /** Pega elemento (pode ser null) */
  find(selector) {
    return document.querySelector(selector);
  },

  /** Pega múltiplos elementos */
  findAll(selector) {
    return document.querySelectorAll(selector);
  },

  /** Escapa caracteres especiais para uso em atributos HTML */
  escape(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 10 · RENDER (geração de SVG)                                  ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Render = {

  /* ─── Definitions ────────────────────────────────────────────────── */
  defs() {
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
  },

  /* ─── Fundo ────────────────────────────────────────────────────── */
  background() {
    const { cx, cy } = Config.geometry;
    const { outer } = Config.geometry.radii;
    return `
      <circle cx="${cx}" cy="${cy}" r="${outer}" fill="${Config.colors.neutralBg}" />
      <circle cx="${cx}" cy="${cy}" r="${outer}" class="outer-ring" />
    `;
  },

  /* ─── Anel de DATAS ─────────────────────────────────────────────── */
  dateRing() {
    const { cx, cy } = Config.geometry;
    const { dateOut, dateIn } = Config.geometry.radii;

    let cells = `<path d="${Geometry.arcSlice(cx, cy, dateOut, dateIn, 0, 359.999)}" fill="${Config.colors.neutralBg}" />`;
    let labels = '';

    Data.dates.forEach((dateStr, i) => {
      const { startDeg, endDeg, midDeg } = Geometry.cellAngles(i);

      cells += `<path d="${Geometry.arcSlice(cx, cy, dateOut, dateIn, startDeg, endDeg)}" class="date-cell" />`;

      const labelR = (dateOut + dateIn) / 2;
      const pos = Geometry.polar(cx, cy, labelR, midDeg);
      const rot = Geometry.radialRotation(midDeg);

      labels += `<text x="${pos.x.toFixed(2)}" y="${pos.y.toFixed(2)}" class="date-label"
                       text-anchor="middle" dominant-baseline="central"
                       transform="rotate(${rot.toFixed(2)}, ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})">${DOM.escape(dateStr)}</text>`;
    });

    cells += `<circle cx="${cx}" cy="${cy}" r="${dateOut}" class="ring-divider" />`;
    cells += `<circle cx="${cx}" cy="${cy}" r="${dateIn}" class="ring-divider" />`;

    return `<g id="layer-dates">${cells}${labels}</g>`;
  },

  /* ─── Anel de TEMPOS LITÚRGICOS ─────────────────────────────────── */
  seasonRing() {
    const { cx, cy } = Config.geometry;
    const { seasonOut, seasonIn } = Config.geometry.radii;

    let cells = `<path d="${Geometry.arcSlice(cx, cy, seasonOut, seasonIn, 0, 359.999)}" fill="${Config.colors.neutralBg}" />`;
    let labels = '';
    let arcPaths = '';
    let currentIdx = 0;

    Data.seasons.forEach((season, sIdx) => {
      const { startDeg, endDeg, midDeg, spanDeg } = Geometry.seasonAngles(currentIdx, season.weekCount);

      cells += `<path d="${Geometry.arcSlice(cx, cy, seasonOut, seasonIn, startDeg, endDeg)}"
                      fill="${season.color}" class="season-cell"
                      data-season="${DOM.escape(season.id)}"
                      tabindex="0" role="button"
                      aria-label="Tempo litúrgico: ${DOM.escape(season.label)}" />`;

      const onDarkClass = season.onDark ? 'on-dark' : '';

      if (spanDeg > Config.behavior.minSpanForCurvedLabel) {
        // Texto curvo
        const labelR = (seasonOut + seasonIn) / 2;
        const isBottom = midDeg > 90 && midDeg < 270;
        const arcSpan = Math.min(25, spanDeg / 3);
        const pathId = `season-arc-${sIdx}`;
        const radius = isBottom
          ? labelR + Config.behavior.arcLabelOffsetBottom
          : labelR + Config.behavior.arcLabelOffsetTop;

        let pathD;
        if (isBottom) {
          const s = Geometry.polar(cx, cy, radius, midDeg + arcSpan);
          const e = Geometry.polar(cx, cy, radius, midDeg - arcSpan);
          pathD = `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${radius} ${radius} 0 0 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
        } else {
          const s = Geometry.polar(cx, cy, radius, midDeg - arcSpan);
          const e = Geometry.polar(cx, cy, radius, midDeg + arcSpan);
          pathD = `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
        }

        arcPaths += `<path id="${pathId}" d="${pathD}" fill="none" />`;
        labels += `<text class="season-label ${onDarkClass}">
                     <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${DOM.escape(season.label)}</textPath>
                   </text>`;
      } else {
        // Texto radial
        const labelR = (seasonOut + seasonIn) / 2;
        const pos = Geometry.polar(cx, cy, labelR, midDeg);
        const rot = Geometry.radialRotation(midDeg);
        labels += `<text x="${pos.x.toFixed(2)}" y="${pos.y.toFixed(2)}"
                         class="season-label ${onDarkClass}"
                         text-anchor="middle" dominant-baseline="central"
                         transform="rotate(${rot.toFixed(2)}, ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})">${DOM.escape(season.label)}</text>`;
      }

      currentIdx += season.weekCount;
    });

    cells += `<circle cx="${cx}" cy="${cy}" r="${seasonOut}" class="ring-divider" />`;
    cells += `<circle cx="${cx}" cy="${cy}" r="${seasonIn}" class="ring-divider" />`;

    return `<defs>${arcPaths}</defs><g id="layer-seasons">${cells}${labels}</g>`;
  },

  /* ─── Anel de SEMANAS (CLICÁVEL) ─────────────────────────────────── */
  weekRing() {
    const { cx, cy } = Config.geometry;
    const { weekOut, weekIn } = Config.geometry.radii;

    let cells = '';
    let labels = '';

    Data.weeks.forEach((week, i) => {
      const { startDeg, endDeg, midDeg } = Geometry.cellAngles(i);
      const season = Queries.seasonById(week.season);

      cells += `<path d="${Geometry.arcSlice(cx, cy, weekOut, weekIn, startDeg, endDeg)}"
                      fill="${week.color}" class="week-cell"
                      data-week-id="${DOM.escape(week.id)}"
                      data-week-index="${i}"
                      data-season="${DOM.escape(week.season)}"
                      tabindex="0" role="button"
                      aria-label="${DOM.escape(week.label)} - ${DOM.escape(season?.label || '')}" />`;

      const labelR = (weekOut + weekIn) / 2;
      const pos = Geometry.polar(cx, cy, labelR, midDeg);
      const rot = Geometry.radialRotation(midDeg);

      const cls = ['week-label',
                   week.onDark ? 'on-dark' : '',
                   week.special ? 'special' : '']
                  .filter(Boolean).join(' ');

      labels += `<text x="${pos.x.toFixed(2)}" y="${pos.y.toFixed(2)}" class="${cls}"
                       text-anchor="middle" dominant-baseline="central"
                       transform="rotate(${rot.toFixed(2)}, ${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})">${DOM.escape(week.label)}</text>`;
    });

    return `<g id="layer-weeks">${cells}${labels}</g>`;
  },

  /* ─── Linhas divisórias ─────────────────────────────────────────── */
  spokes() {
    const { cx, cy } = Config.geometry;
    const { dateOut, weekIn } = Config.geometry.radii;

    let spokes = '';

    // Spokes finos entre todas as semanas
    for (let i = 0; i < Geometry.TOTAL_WEEKS; i++) {
      const deg = i * Geometry.DEG_PER_WEEK;
      const o = Geometry.polar(cx, cy, dateOut, deg);
      const inn = Geometry.polar(cx, cy, weekIn, deg);
      spokes += `<line x1="${o.x.toFixed(2)}" y1="${o.y.toFixed(2)}" x2="${inn.x.toFixed(2)}" y2="${inn.y.toFixed(2)}" class="spoke" />`;
    }

    // Spokes principais nas transições de tempos
    let currentDeg = 0;
    for (const season of Data.seasons) {
      const o = Geometry.polar(cx, cy, dateOut, currentDeg);
      const inn = Geometry.polar(cx, cy, weekIn, currentDeg);
      spokes += `<line x1="${o.x.toFixed(2)}" y1="${o.y.toFixed(2)}" x2="${inn.x.toFixed(2)}" y2="${inn.y.toFixed(2)}" class="spoke major" />`;
      currentDeg += season.weekCount * Geometry.DEG_PER_WEEK;
    }

    return `<g id="layer-spokes">${spokes}</g>`;
  },

  /* ─── Anel guia tracejado ────────────────────────────────────────── */
  guideRing() {
    const { cx, cy } = Config.geometry;
    const { guide } = Config.geometry.radii;
    return `<circle cx="${cx}" cy="${cy}" r="${guide}" class="guide-ring" />`;
  },

  /* ─── Anotação "início do ano litúrgico" ─────────────────────────── */
  annotation() {
    const { cx, cy } = Config.geometry;
    const { dateOut } = Config.geometry.radii;
    const target = Geometry.polar(cx, cy, dateOut + 4, 2);
    return `
      <g id="layer-annotation">
        <text x="380" y="140" class="start-annotation" text-anchor="end">início do ano litúrgico</text>
        <path d="M 388 144 Q 460 152, ${(target.x - 5).toFixed(2)} ${(target.y - 5).toFixed(2)}"
              class="start-arrow" marker-end="url(#arrow)" />
      </g>
    `;
  },

  /* ─── Indicador HOJE ─────────────────────────────────────────────── */
  todayMarker() {
    const { cx, cy } = Config.geometry;
    const { dateOut } = Config.geometry.radii;

    let idx;
    try {
      idx = DateUtils.findTodayCellIndex();
    } catch (err) {
      Logger.warn('Falha ao calcular HOJE, usando célula 0:', err.message);
      idx = 0;
    }

    const { midDeg } = Geometry.cellAngles(idx);
    const pos = Geometry.polar(cx, cy, dateOut + 18, midDeg);
    const labelPos = Geometry.polar(cx, cy, dateOut + 38, midDeg);
    const rot = Geometry.radialRotation(midDeg);

    const todayWeek = Data.weeks[idx];
    Logger.info(`HOJE → célula ${idx} (${Data.dates[idx]}) — ${todayWeek?.label || '?'}`);

    return `
      <g id="layer-today" data-today-index="${idx}">
        <circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="7" class="today-pulse" />
        <circle cx="${pos.x.toFixed(2)}" cy="${pos.y.toFixed(2)}" r="7" class="today-marker" />
        <text x="${labelPos.x.toFixed(2)}" y="${labelPos.y.toFixed(2)}" class="today-label"
              text-anchor="middle" dominant-baseline="central"
              transform="rotate(${rot.toFixed(2)}, ${labelPos.x.toFixed(2)}, ${labelPos.y.toFixed(2)})">HOJE</text>
      </g>
    `;
  },

  /* ─── Centro PLACEHOLDER ─────────────────────────────────────────── */
  center() {
    const { cx, cy } = Config.geometry;
    const { center } = Config.geometry.radii;
    return `
      <g id="center-emblem" transform="translate(${cx}, ${cy})">
        <circle cx="0" cy="0" r="${center}" class="center-placeholder" />
        <circle cx="0" cy="0" r="${center - 8}" class="center-placeholder-inner" />
        <circle cx="0" cy="0" r="${center - 16}" class="center-placeholder-inner" />
        <text y="-12" class="center-placeholder-text">AGNUS DEI</text>
        <text y="14" class="center-placeholder-subtext">[ imagem aqui ]</text>
        <text y="38" class="center-placeholder-subtext" style="font-size:10px;opacity:0.7">Α · Ω</text>
      </g>
    `;
  },

  /* ─── Roda completa ──────────────────────────────────────────────── */
  wheel() {
    return [
      this.defs(),
      this.background(),
      this.dateRing(),
      this.seasonRing(),
      this.weekRing(),
      this.spokes(),
      this.guideRing(),
      this.annotation(),
      this.todayMarker(),
      this.center(),
    ].join('');
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 11 · DETAIL PANEL (renderização do painel inferior)           ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const DetailPanel = {

  _getInner() {
    return DOM.find('#detail-inner');
  },

  reset() {
    const inner = this._getInner();
    if (!inner) return;
    inner.innerHTML = `
      <div class="detail-placeholder">
        <div class="placeholder-icon">✦ ✦ ✦</div>
        <p>Clique em uma semana ou tempo litúrgico para ver detalhes</p>
      </div>
    `;
  },

  _colorBarStyle(color) {
    return Queries.isWhiteColor(color)
      ? `background:${color};border-right:1px solid ${Config.colors.whiteEdge}`
      : `background:${color}`;
  },

  showWeek(week) {
    const inner = this._getInner();
    if (!inner || !week) return;

    const season = Queries.seasonById(week.season);
    const colorName = Queries.colorName(week.color);
    const barStyle = this._colorBarStyle(week.color);

    const noteMeta = week.note
      ? `<span class="detail-meta-item">✦ Domingo ${DOM.escape(week.note)}</span>`
      : '';

    const specialMeta = week.special && !week.note
      ? `<span class="detail-meta-item">✦ Celebração</span>`
      : '';

    const latinMeta = season
      ? `<span class="detail-meta-item"><em>${DOM.escape(season.latin)}</em></span>`
      : '';

    inner.innerHTML = `
      <article class="detail-card">
        <div class="detail-header">
          <div class="detail-color-bar" style="${barStyle}"></div>
          <div class="detail-body">
            <p class="detail-eyebrow">${DOM.escape(season?.label || 'Tempo Litúrgico')}</p>
            <h2 class="detail-title">${DOM.escape(week.label)}</h2>
            <div class="detail-meta">
              <span class="detail-meta-item">
                <span class="detail-meta-dot" style="background:${week.color}"></span>
                <strong>${DOM.escape(colorName)}</strong>
              </span>
              ${latinMeta}
              ${noteMeta}
              ${specialMeta}
            </div>
          </div>
        </div>
      </article>
    `;
  },

  showSeason(seasonId) {
    const inner = this._getInner();
    if (!inner) return;

    const season = Queries.seasonById(seasonId);
    if (!season) return;

    const weeks = Queries.weeksBySeason(seasonId);
    const colorName = Queries.colorName(season.color);
    const barStyle = this._colorBarStyle(season.color);

    inner.innerHTML = `
      <article class="detail-card">
        <div class="detail-header">
          <div class="detail-color-bar" style="${barStyle}"></div>
          <div class="detail-body">
            <p class="detail-eyebrow">Tempo Litúrgico</p>
            <h2 class="detail-title">${DOM.escape(season.label)}</h2>
            <div class="detail-meta">
              <span class="detail-meta-item">
                <span class="detail-meta-dot" style="background:${season.color}"></span>
                <strong>${DOM.escape(colorName)}</strong>
              </span>
              <span class="detail-meta-item"><em>${DOM.escape(season.latin)}</em></span>
              <span class="detail-meta-item">${weeks.length} ${weeks.length === 1 ? 'semana' : 'semanas'}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 12 · TOOLTIP                                                  ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Tooltip = {

  _el: null,
  _title: null,
  _subtitle: null,
  _bar: null,

  init() {
    this._el = DOM.find('#tooltip');
    if (!this._el) {
      Logger.warn('Tooltip element não encontrado');
      return;
    }
    this._title = this._el.querySelector('.tooltip-title');
    this._subtitle = this._el.querySelector('.tooltip-subtitle');
    this._bar = this._el.querySelector('.tooltip-bar');
  },

  show({ title, subtitle, color }, x, y) {
    if (!this._el) return;
    if (this._title) this._title.textContent = title || '';
    if (this._subtitle) this._subtitle.textContent = subtitle || '';
    if (this._bar) {
      this._bar.style.background = color;
      this._bar.style.boxShadow = `0 0 8px ${color}`;
    }
    this._el.style.left = `${x}px`;
    this._el.style.top = `${y}px`;
    this._el.classList.add('visible');
    this._el.setAttribute('aria-hidden', 'false');
  },

  hide() {
    if (!this._el) return;
    this._el.classList.remove('visible');
    this._el.setAttribute('aria-hidden', 'true');
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 13 · SELECTION (gerencia seleção visual)                      ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Selection = {

  selectWeek(weekId) {
    const week = Queries.weekById(weekId);
    if (!week) {
      Logger.warn(`Semana não encontrada: ${weekId}`);
      return;
    }

    if (State.activeWeekId === weekId) {
      this.clear();
      return;
    }

    this._clearVisuals();

    DOM.findAll('.week-cell').forEach(c => c.classList.add('dimmed'));

    const cell = DOM.find(`.week-cell[data-week-id="${CSS.escape(weekId)}"]`);
    if (cell) {
      cell.classList.add('active');
      cell.classList.remove('dimmed');
    }

    State.reset();
    State.activeWeekId = weekId;
    DetailPanel.showWeek(week);
  },

  selectSeason(seasonId) {
    if (!Queries.seasonById(seasonId)) {
      Logger.warn(`Tempo não encontrado: ${seasonId}`);
      return;
    }

    if (State.activeSeasonId === seasonId) {
      this.clear();
      return;
    }

    this._clearVisuals();

    DOM.findAll('.week-cell').forEach(c => {
      if (c.dataset.season === seasonId) {
        c.classList.add('active');
      } else {
        c.classList.add('dimmed');
      }
    });

    DOM.findAll('.season-cell').forEach(c => {
      if (c.dataset.season === seasonId) c.classList.add('active');
    });

    State.reset();
    State.activeSeasonId = seasonId;
    DetailPanel.showSeason(seasonId);
  },

  selectByLegend(key) {
    const wasActive = State.activeLegendKey === key;

    this._clearVisuals();

    if (wasActive) {
      this.clear();
      return;
    }

    const item = DOM.find(`.legend-item[data-key="${CSS.escape(key)}"]`);
    if (item) item.classList.add('active');

    const targets = Data.legendMap[key] || [];

    DOM.findAll('.week-cell').forEach(c => {
      const week = Queries.weekById(c.dataset.weekId);
      if (!week) return;

      const match = key === 'rosa'
        ? week.color === Config.colors.rosa
        : targets.includes(c.dataset.season);

      if (match) {
        c.classList.remove('dimmed');
        c.classList.add('active');
      } else {
        c.classList.add('dimmed');
        c.classList.remove('active');
      }
    });

    State.reset();
    State.activeLegendKey = key;

    if (targets.length === 1) {
      DetailPanel.showSeason(targets[0]);
    } else {
      DetailPanel.reset();
    }
  },

  clear() {
    this._clearVisuals();
    State.reset();
    DetailPanel.reset();
  },

  _clearVisuals() {
    DOM.findAll('.week-cell').forEach(c => c.classList.remove('active', 'dimmed'));
    DOM.findAll('.season-cell').forEach(c => c.classList.remove('active'));
    DOM.findAll('.legend-item').forEach(li => li.classList.remove('active'));
  },

  /** Navega para próxima/anterior semana */
  navigate(direction) {
    if (!State.activeWeekId) return;
    const idx = Queries.weekIndex(State.activeWeekId);
    if (idx === -1) return;
    const total = Data.weeks.length;
    const next = (idx + direction + total) % total;
    this.selectWeek(Data.weeks[next].id);
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 14 · EVENTS (delegação de eventos)                            ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const Events = {

  _wheel: null,
  _wrapper: null,

  init() {
    this._wheel = DOM.get('liturgical-wheel');
    this._wrapper = DOM.find('.wheel-wrapper');

    this._attachClicks();
    this._attachHover();
    this._attachKeyboard();
    this._attachLegend();

    Logger.success('Eventos vinculados');
  },

  _attachClicks() {
    this._wheel.addEventListener('click', (e) => {
      const week = e.target.closest('.week-cell');
      if (week) {
        Selection.selectWeek(week.dataset.weekId);
        return;
      }
      const season = e.target.closest('.season-cell');
      if (season) {
        Selection.selectSeason(season.dataset.season);
      }
    });
  },

  _attachHover() {
    this._wheel.addEventListener('mousemove', (e) => {
      const week = e.target.closest('.week-cell');
      const season = e.target.closest('.season-cell');

      if (!week && !season) {
        Tooltip.hide();
        return;
      }

      const rect = this._wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (week) {
        const w = Queries.weekById(week.dataset.weekId);
        if (!w) return;
        const s = Queries.seasonById(w.season);
        Tooltip.show({
          title: w.label,
          subtitle: s?.label || '',
          color: w.color,
        }, x, y);
      } else if (season) {
        const s = Queries.seasonById(season.dataset.season);
        if (!s) return;
        Tooltip.show({
          title: s.label,
          subtitle: s.latin,
          color: s.color,
        }, x, y);
      }
    });

    this._wheel.addEventListener('mouseleave', () => Tooltip.hide());
  },

  _attachKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Selection.clear();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (State.activeWeekId) {
          e.preventDefault();
          Selection.navigate(e.key === 'ArrowRight' ? 1 : -1);
        }
      }

      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement) {
        const active = document.activeElement;
        if (active.classList.contains('week-cell')) {
          e.preventDefault();
          Selection.selectWeek(active.dataset.weekId);
        } else if (active.classList.contains('season-cell')) {
          e.preventDefault();
          Selection.selectSeason(active.dataset.season);
        }
      }
    });
  },

  _attachLegend() {
    DOM.findAll('.legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        if (key) Selection.selectByLegend(key);
      });
    });
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  MÓDULO 15 · APP (orquestração)                                       ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

const App = {

  init() {
    Logger.group('Inicialização', () => {
      try {
        const t0 = performance.now();

        // 1. Valida dados
        Validation.validateAll();

        // 2. Renderiza a roda
        this._renderWheel();

        // 3. Inicializa tooltip
        Tooltip.init();

        // 4. Vincula eventos
        Events.init();

        // 5. Reset inicial do painel
        DetailPanel.reset();

        State.isInitialized = true;
        const elapsed = (performance.now() - t0).toFixed(1);

        Logger.success(
          `Calendário Litúrgico carregado em ${elapsed}ms\n` +
          `   • ${Data.weeks.length} semanas\n` +
          `   • ${Data.seasons.length} tempos litúrgicos\n` +
          `   • ${Data.dates.length} datas`
        );

      } catch (err) {
        Logger.error('Falha na inicialização:', err);
        this._showFallback(err);
      }
    });
  },

  _renderWheel() {
    const svg = DOM.get('liturgical-wheel');
    svg.innerHTML = Render.wheel();
    Logger.debug('SVG renderizado');
  },

  _showFallback(err) {
    const svg = document.getElementById('liturgical-wheel');
    if (svg) {
      svg.innerHTML = `
        <text x="500" y="490" text-anchor="middle"
              style="font-family:serif;font-size:18px;fill:#a31827;">
          Erro ao carregar calendário
        </text>
        <text x="500" y="520" text-anchor="middle"
              style="font-family:monospace;font-size:11px;fill:#666;">
          ${DOM.escape(err.message)}
        </text>
      `;
    }
  },

  /** API pública para debug no console */
  api: {
    selectWeek: (id) => Selection.selectWeek(id),
    selectSeason: (id) => Selection.selectSeason(id),
    clear: () => Selection.clear(),
    state: () => ({ ...State }),
    data: () => Data,
  },
};


/* ╔═══════════════════════════════════════════════════════════════════════╗
   ║  BOOTSTRAP                                                            ║
   ╚═══════════════════════════════════════════════════════════════════════╝ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Expõe API global para debug
window.LitCal = App.api;
