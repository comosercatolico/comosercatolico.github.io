/* ================================================================
   CALENDÁRIO LITÚRGICO PROFISSIONAL - Lux Fidei
   Versão Definitiva - SVG puro, preciso e elegante
   ================================================================ */

'use strict';

/* ================================================================
   1. CÁLCULO DA PÁSCOA (Algoritmo de Butcher)
   ================================================================ */
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

/* ================================================================
   2. UTILITÁRIOS DE DATA
   ================================================================ */
function somarDias(data, n) {
  const d = new Date(data);
  d.setDate(d.getDate() + n);
  return d;
}

function datasSaoIguais(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function dataEntre(data, ini, fim) {
  const d = dataSemHora(data);
  return d >= dataSemHora(ini) && d <= dataSemHora(fim);
}

function dataSemHora(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function primeiroDomingoAdvento(ano) {
  // Primeiro domingo do Advento = 4 domingos antes do Natal
  const natal = new Date(ano, 11, 25);
  const diaNatal = natal.getDay(); // 0=Dom
  // Domingo anterior mais próximo de 25/Nov a 3/Dez
  const diasAteUltimoDomingo = diaNatal === 0 ? 7 : diaNatal;
  const ultimoDomingoAntes = somarDias(natal, -diasAteUltimoDomingo);
  return somarDias(ultimoDomingoAntes, -21); // 3 domingos antes
}

function batismoDoSenhor(ano) {
  // Domingo após 6 de Janeiro (Epifania)
  // Se 6/Jan for domingo → Batismo no domingo seguinte (13/Jan)
  const epifania = new Date(ano, 0, 6);
  const dia = epifania.getDay();
  if (dia === 0) return new Date(ano, 0, 13);
  return somarDias(epifania, 7 - dia);
}

/* ================================================================
   3. DETECTAR TEMPO LITÚRGICO ATUAL
   ================================================================ */
function detectarTempoAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  const pascoa        = calcularPascoa(ano);
  const quartaCinzas  = somarDias(pascoa, -46);
  const quintaSanta   = somarDias(pascoa, -3);
  const sabadoSanto   = somarDias(pascoa, -1);
  const pentecostes   = somarDias(pascoa, 49);
  const batismo       = batismoDoSenhor(ano);
  const advento       = primeiroDomingoAdvento(ano);
  const aventoAnt     = primeiroDomingoAdvento(ano - 1);
  const natalAnt      = new Date(ano - 1, 11, 25);
  const batismoAnt    = batismoDoSenhor(ano);

  // Natal do ano anterior → até Batismo do Senhor
  if (dataEntre(hoje, natalAnt, somarDias(batismo, -1))) return 'natal';

  // Tempo Comum I → Batismo até véspera de Cinzas
  if (dataEntre(hoje, batismo, somarDias(quartaCinzas, -1))) return 'tempoComum';

  // Quaresma → Cinzas até Quinta Santa
  if (dataEntre(hoje, quartaCinzas, somarDias(quintaSanta, -1))) return 'quaresma';

  // Tríduo → Quinta Santa, Sexta, Sábado Santo
  if (dataEntre(hoje, quintaSanta, sabadoSanto)) return 'triduo';

  // Tempo Pascal → Domingo de Páscoa até Pentecostes
  if (dataEntre(hoje, pascoa, pentecostes)) return 'pascoa';

  // Tempo Comum II → Após Pentecostes até Advento
  if (dataEntre(hoje, somarDias(pentecostes, 1), somarDias(advento, -1))) return 'tempoComum';

  // Advento atual
  if (dataEntre(hoje, advento, new Date(ano, 11, 24))) return 'advento';

  // Advento anterior
  if (dataEntre(hoje, aventoAnt, new Date(ano - 1, 11, 24))) return 'advento';

  // Natal atual (25/Dez em diante)
  if (dataEntre(hoje, new Date(ano, 11, 25), new Date(ano, 11, 31))) return 'natal';

  return 'tempoComum';
}

/* ================================================================
   4. DADOS COMPLETOS DOS TEMPOS LITÚRGICOS
   ================================================================ */
const TEMPOS = {
  advento: {
    id: 'advento',
    nome: 'Advento',
    cor: '#5c2d91',
    corSecundaria: '#7b52a8',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'O Advento é o tempo de preparação e esperança que abre o Ano Litúrgico. Durante quatro semanas, a Igreja nos convida à vigilância, à conversão do coração e à espera jubilosa da vinda do Senhor — tanto em Belém quanto no fim dos tempos.',
    celebracoes: [
      '1ª Semana do Advento',
      '2ª Semana do Advento',
      '3ª Semana do Advento (Gaudete)',
      '4ª Semana do Advento',
    ]
  },
  natal: {
    id: 'natal',
    nome: 'Natal',
    cor: '#c8a96e',
    corSecundaria: '#e8cfa0',
    corTexto: '#2a1a00',
    corVeste: 'Branco',
    descricao: 'O Tempo do Natal celebra o grande mistério da Encarnação: o Verbo Eterno de Deus se fez carne e habitou entre nós. A liturgia nos faz contemplar a humildade de Deus que nasce em Belém, revelando seu amor infinito pela humanidade.',
    celebracoes: [
      'Natividade do Senhor',
      'Sagrada Família',
      'Santa Maria, Mãe de Deus',
      'Epifania do Senhor',
      'Batismo do Senhor',
    ]
  },
  tempoComum: {
    id: 'tempoComum',
    nome: 'Tempo Comum',
    cor: '#1a6b35',
    corSecundaria: '#2d8a50',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    descricao: 'O Tempo Comum representa o crescimento da Igreja no seguimento de Cristo. Durante as 33 ou 34 semanas distribuídas ao longo do ano, a liturgia nos conduz a aprofundar os mistérios da fé, crescendo na caridade, na sabedoria e na virtude cristã.',
    celebracoes: [
      '1ª a 9ª semana (pré-Quaresma)',
      '10ª a 34ª semana (pós-Pentecostes)',
      'Corpus Christi',
      'Sagrado Coração de Jesus',
      'Solenidade de Cristo Rei',
    ]
  },
  quaresma: {
    id: 'quaresma',
    nome: 'Quaresma',
    cor: '#5c2d91',
    corSecundaria: '#7b52a8',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'A Quaresma é o grande tempo de penitência, oração e jejum que prepara o coração para a Páscoa. Durante quarenta dias, caminhamos com Cristo no deserto, purificando nossa alma pela conversão sincera, pelas obras de misericórdia e pela escuta da Palavra.',
    celebracoes: [
      '4ª feira de Cinzas',
      '1ª Semana da Quaresma',
      '2ª Semana da Quaresma',
      '3ª Semana da Quaresma',
      '4ª Semana da Quaresma',
      '5ª Semana da Quaresma',
      'Domingo de Ramos',
    ]
  },
  triduo: {
    id: 'triduo',
    nome: 'Tríduo Pascal',
    cor: '#8b1a1a',
    corSecundaria: '#c0302e',
    corTexto: '#ffffff',
    corVeste: 'Vermelho / Branco',
    descricao: 'O Tríduo Pascal é o ápice e o coração de todo o Ano Litúrgico. Em três dias sagrados contemplamos o mistério central da fé cristã: a Paixão e Morte de Nosso Senhor na Sexta-feira Santa, o silêncio do Sábado Santo e a glória da Ressurreição no Domingo de Páscoa.',
    celebracoes: [
      'Quinta-feira Santa — Ceia do Senhor',
      'Sexta-feira Santa — Paixão do Senhor',
      'Sábado Santo — Vigília Pascal',
      'Domingo de Páscoa — Ressurreição',
    ]
  },
  pascoa: {
    id: 'pascoa',
    nome: 'Tempo Pascal',
    cor: '#b8860b',
    corSecundaria: '#d4a820',
    corTexto: '#1a0f00',
    corVeste: 'Branco / Dourado',
    descricao: 'O Tempo Pascal é a grande festa de cinquenta dias em que a Igreja exulta de alegria pela Ressurreição de Cristo. Do Domingo de Páscoa a Pentecostes, proclamamos com júbilo que Cristo venceu a morte e nos abriu as portas da vida eterna. Aleluia!',
    celebracoes: [
      '2ª Semana de Páscoa',
      '3ª Semana de Páscoa',
      '4ª Semana de Páscoa',
      '5ª Semana de Páscoa',
      '6ª Semana de Páscoa',
      'Ascensão do Senhor',
      'Pentecostes',
      'Santíssima Trindade',
      'Corpus Christi',
    ]
  }
};

/* ================================================================
   5. ESTRUTURA DO CALENDÁRIO CIRCULAR
   
   Cada segmento define:
   - tempoId: qual tempo litúrgico pertence
   - angulo: onde começa e termina no círculo (0° = topo)
   - fatias: subdivisões internas (semanas/celebrações)
   ================================================================ */
const SEGMENTOS_CALENDARIO = [
  {
    tempoId: 'advento',
    angIni: 0,
    angFim: 52,
    fatias: [
      { nome: '1ª semana', peso: 1 },
      { nome: '2ª semana', peso: 1 },
      { nome: '3ª semana', peso: 1 }, // Gaudete
      { nome: '4ª semana', peso: 1 },
    ]
  },
  {
    tempoId: 'natal',
    angIni: 52,
    angFim: 96,
    fatias: [
      { nome: 'Natal',             peso: 1 },
      { nome: 'Sagrada Família',   peso: 1 },
      { nome: 'Mãe de Deus',       peso: 1 },
      { nome: 'Epifania',          peso: 1 },
      { nome: 'Batismo',           peso: 1 },
    ]
  },
  {
    tempoId: 'tempoComum',
    angIni: 96,
    angFim: 168,
    fatias: [
      { nome: '1ª',  peso: 1 }, { nome: '2ª',  peso: 1 },
      { nome: '3ª',  peso: 1 }, { nome: '4ª',  peso: 1 },
      { nome: '5ª',  peso: 1 }, { nome: '6ª',  peso: 1 },
      { nome: '7ª',  peso: 1 }, { nome: '8ª',  peso: 1 },
      { nome: '9ª',  peso: 1 },
    ]
  },
  {
    tempoId: 'quaresma',
    angIni: 168,
    angFim: 232,
    fatias: [
      { nome: 'Cinzas',    peso: 0.5 },
      { nome: '1ª semana', peso: 1 },
      { nome: '2ª semana', peso: 1 },
      { nome: '3ª semana', peso: 1 },
      { nome: '4ª semana', peso: 1 },
      { nome: '5ª semana', peso: 1 },
      { nome: 'Ramos',     peso: 0.5 },
    ]
  },
  {
    tempoId: 'triduo',
    angIni: 232,
    angFim: 262,
    fatias: [
      { nome: '5ª Santa',  peso: 1 },
      { nome: '6ª Santa',  peso: 1 },
      { nome: 'Sábado',    peso: 0.6 },
      { nome: 'Páscoa',    peso: 1 },
    ]
  },
  {
    tempoId: 'pascoa',
    angIni: 262,
    angFim: 336,
    fatias: [
      { nome: '2ª sem.',    peso: 1 },
      { nome: '3ª sem.',    peso: 1 },
      { nome: '4ª sem.',    peso: 1 },
      { nome: '5ª sem.',    peso: 1 },
      { nome: '6ª sem.',    peso: 1 },
      { nome: 'Ascensão',   peso: 0.8 },
      { nome: 'Pentecoste', peso: 0.8 },
      { nome: 'Trindade',   peso: 0.8 },
      { nome: 'Corpus',     peso: 0.8 },
    ]
  },
  {
    tempoId: 'tempoComum',
    angIni: 336,
    angFim: 360,
    fatias: [
      { nome: '…',        peso: 1 },
      { nome: '33ª',      peso: 1 },
      { nome: 'Cristo Rei', peso: 1 },
    ]
  }
];

/* ================================================================
   6. NÚCLEO SVG — Funções matemáticas precisas
   ================================================================ */

const f2 = n => parseFloat(n.toFixed(4));

function angParaRad(graus) {
  // 0° = topo (norte), cresce no sentido horário
  return (graus - 90) * (Math.PI / 180);
}

function pontoNoCirculo(cx, cy, raio, graus) {
  const rad = angParaRad(graus);
  return {
    x: f2(cx + raio * Math.cos(rad)),
    y: f2(cy + raio * Math.sin(rad))
  };
}

/**
 * Gera o path de um setor de anel (donut slice)
 * @param {number} cx - centro x
 * @param {number} cy - centro y
 * @param {number} rExt - raio externo
 * @param {number} rInt - raio interno
 * @param {number} angIni - ângulo inicial (graus)
 * @param {number} angFim - ângulo final (graus)
 */
function setorAnel(cx, cy, rExt, rInt, angIni, angFim) {
  // Garantir que angFim > angIni e diferença < 360
  const span = angFim - angIni;
  if (span <= 0 || span >= 360) return '';

  const p1 = pontoNoCirculo(cx, cy, rExt, angIni);
  const p2 = pontoNoCirculo(cx, cy, rExt, angFim);
  const p3 = pontoNoCirculo(cx, cy, rInt, angFim);
  const p4 = pontoNoCirculo(cx, cy, rInt, angIni);
  const grande = span > 180 ? 1 : 0;

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rExt} ${rExt} 0 ${grande} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInt} ${rInt} 0 ${grande} 0 ${p4.x} ${p4.y}`,
    'Z'
  ].join(' ');
}

/**
 * Gera path de arco (apenas a linha, para textPath)
 */
function arcoPath(cx, cy, raio, angIni, angFim) {
  const span = angFim - angIni;
  const p1 = pontoNoCirculo(cx, cy, raio, angIni);
  const p2 = pontoNoCirculo(cx, cy, raio, angFim);
  const grande = span > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${raio} ${raio} 0 ${grande} 1 ${p2.x} ${p2.y}`;
}

/**
 * Gera path de arco invertido (para texto na metade inferior)
 */
function arcoPathInvertido(cx, cy, raio, angIni, angFim) {
  const span = angFim - angIni;
  const p1 = pontoNoCirculo(cx, cy, raio, angFim);
  const p2 = pontoNoCirculo(cx, cy, raio, angIni);
  const grande = span > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${raio} ${raio} 0 ${grande} 0 ${p2.x} ${p2.y}`;
}

/* ================================================================
   7. GERADOR PRINCIPAL DO SVG
   ================================================================ */
function gerarSVG(tempoAtual, tamanho) {
  const S  = tamanho;
  const cx = S / 2;
  const cy = S / 2;

  // ── Raios dos anéis ──────────────────────────────────────────
  const R_FUNDO     = S * 0.490;  // círculo de fundo (borda branca)
  const R_EXT       = S * 0.460;  // borda externa das fatias
  const R_FATIAS    = S * 0.385;  // divisória entre anel externo e interno
  const R_INTERNO   = S * 0.230;  // borda interna (limite do centro)
  const R_CENTRO    = S * 0.218;  // círculo dourado central
  const GAP_GRAUS   = 0.7;        // gap entre segmentos em graus

  // Raios de texto
  const R_TXT_EXT   = S * 0.425;  // texto anel externo (fatias)
  const R_TXT_INT   = S * 0.305;  // texto anel interno (nome do tempo)

  let ids = 0;
  const uid = () => `lc${++ids}`;

  // ── Acumulador SVG ────────────────────────────────────────────
  const partes = [];

  // ── DEFS ──────────────────────────────────────────────────────
  partes.push(`<defs>
    <!-- Gradientes radiais do fundo -->
    <radialGradient id="gFundo" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f2ede2"/>
    </radialGradient>

    <!-- Centro dourado -->
    <radialGradient id="gCentro" cx="38%" cy="32%" r="65%">
      <stop offset="0%"   stop-color="#c49a3c"/>
      <stop offset="45%"  stop-color="#8a5e1a"/>
      <stop offset="100%" stop-color="#3d2005"/>
    </radialGradient>

    <!-- Anel dourado decorativo -->
    <linearGradient id="gAnel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#f0c040"/>
      <stop offset="50%"  stop-color="#c8860c"/>
      <stop offset="100%" stop-color="#f0c040"/>
    </linearGradient>

    <!-- Filtros -->
    <filter id="fSombra" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.22"/>
    </filter>
    <filter id="fGlowOuro">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd700" flood-opacity="0.75"/>
    </filter>
    <filter id="fGlowSeg">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#ffd700" flood-opacity="0.45"/>
    </filter>
    <filter id="fSombraCentro" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="#000" flood-opacity="0.50"/>
    </filter>
    <filter id="fBrilhoCentro" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>`);

  // ── FUNDO ─────────────────────────────────────────────────────
  // Sombra externa
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_FUNDO + 8}"
    fill="url(#gFundo)" filter="url(#fSombra)"/>`);
  // Anel decorativo externo
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_FUNDO + 1}"
    fill="none" stroke="rgba(180,150,80,0.3)" stroke-width="2"/>`);
  // Fundo principal
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_FUNDO}"
    fill="url(#gFundo)"/>`);

  // ── RENDERIZAR SEGMENTOS ──────────────────────────────────────
  SEGMENTOS_CALENDARIO.forEach((seg, segIdx) => {
    const tempo    = TEMPOS[seg.tempoId];
    const isAtual  = seg.tempoId === tempoAtual;
    const spanSeg  = seg.angFim - seg.angIni;
    const angMeio  = (seg.angIni + seg.angFim) / 2;

    // Cor do segmento (com leve variação para distinguir duplicatas de tempoComum)
    const corBase  = tempo.cor;
    const corSec   = tempo.corSecundaria;
    const corTxt   = tempo.corTexto;

    // ── HALO DOURADO no tempo atual (atrás de tudo) ──
    if (isAtual) {
      const haloPath = setorAnel(cx, cy, R_EXT + 14, R_INTERNO - 6,
        seg.angIni, seg.angFim);
      partes.push(`<path d="${haloPath}"
        fill="${corBase}" opacity="0.18" filter="url(#fGlowSeg)"/>`);
    }

    // ══════════════════════════════════════════════
    // ANEL EXTERNO — Fatias (semanas/celebrações)
    // ══════════════════════════════════════════════
    const totalPeso = seg.fatias.reduce((s, f) => s + f.peso, 0);
    let angAcum = seg.angIni;

    seg.fatias.forEach((fatia, fIdx) => {
      const proporcao = fatia.peso / totalPeso;
      const fSpan     = spanSeg * proporcao;
      const fAngIni   = angAcum + (fIdx === 0 ? GAP_GRAUS : GAP_GRAUS * 0.5);
      const fAngFim   = angAcum + fSpan - (fIdx === seg.fatias.length - 1 ? GAP_GRAUS : GAP_GRAUS * 0.5);
      angAcum        += fSpan;

      if (fAngFim <= fAngIni) return;

      // Alternar leve tonalidade entre fatias
      const corFatia = fIdx % 2 === 0 ? corBase : corSec;

      partes.push(`<path d="${setorAnel(cx, cy, R_EXT, R_FATIAS, fAngIni, fAngFim)}"
        fill="${corFatia}"
        stroke="rgba(255,255,255,0.22)"
        stroke-width="0.6"/>`);

      // Texto da fatia (apenas se houver ângulo suficiente)
      const fSpanReal = fAngFim - fAngIni;
      if (fSpanReal >= 6 && fatia.nome && fatia.nome !== '…') {
        const tId = uid();
        const angMeioF = (fAngIni + fAngFim) / 2;

        // Decidir sentido do texto baseado na posição
        const invertido = angMeioF > 90 && angMeioF < 270;
        const pathTxt = invertido
          ? arcoPathInvertido(cx, cy, R_TXT_EXT, fAngIni, fAngFim)
          : arcoPath(cx, cy, R_TXT_EXT, fAngIni, fAngFim);

        const fs = Math.max(S * 0.016, 8);
        partes.push(`
          <path id="${tId}" d="${pathTxt}" fill="none"/>
          <text font-family="'Inter',sans-serif" font-size="${f2(fs)}"
            font-weight="500" fill="rgba(255,255,255,0.88)">
            <textPath href="#${tId}" startOffset="50%" text-anchor="middle">
              ${fatia.nome}
            </textPath>
          </text>`);
      }
    });

    // ══════════════════════════════════════════════
    // ANEL INTERNO — Nome do tempo litúrgico
    // ══════════════════════════════════════════════
    const iAngIni = seg.angIni + GAP_GRAUS;
    const iAngFim = seg.angFim - GAP_GRAUS;

    if (iAngFim > iAngIni) {
      partes.push(`<path d="${setorAnel(cx, cy, R_FATIAS, R_INTERNO, iAngIni, iAngFim)}"
        fill="${corBase}"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="0.8"/>`);

      // Overlay gradiente de profundidade
      partes.push(`<path d="${setorAnel(cx, cy, R_FATIAS, R_INTERNO, iAngIni, iAngFim)}"
        fill="rgba(255,255,255,${isAtual ? '0.08' : '0.04'})"
        stroke="none"/>`);
    }

    // Borda dourada luminosa no tempo atual
    if (isAtual) {
      // Borda externa
      partes.push(`<path d="${setorAnel(cx, cy, R_EXT + 6, R_EXT, seg.angIni, seg.angFim)}"
        fill="url(#gAnel)" filter="url(#fGlowOuro)" opacity="0.95"/>`);
      // Borda interna
      partes.push(`<path d="${setorAnel(cx, cy, R_INTERNO, R_INTERNO - 5, seg.angIni, seg.angFim)}"
        fill="url(#gAnel)" opacity="0.8"/>`);
    }

    // ── Texto nome do tempo (curvado no anel interno) ──
    const spanInterno = iAngFim - iAngIni;
    if (spanInterno >= 20) {
      const tId2   = uid();
      const angM   = (iAngIni + iAngFim) / 2;
      const invertido2 = angM > 90 && angM < 270;
      const rTxt   = R_TXT_INT + (isAtual ? 0 : 0);

      const pathNome = invertido2
        ? arcoPathInvertido(cx, cy, rTxt, iAngIni, iAngFim)
        : arcoPath(cx, cy, rTxt, iAngIni, iAngFim);

      const fsNome = f2(Math.min(Math.max(S * 0.030, 11), 18));
      partes.push(`
        <path id="${tId2}" d="${pathNome}" fill="none"/>
        <text font-family="'Libre Baskerville',serif"
          font-size="${fsNome}"
          font-weight="700"
          fill="${isAtual ? '#ffffff' : corTxt}">
          <textPath href="#${tId2}" startOffset="50%" text-anchor="middle">
            ${tempo.nome}
          </textPath>
        </text>`);

      // Badge "● AGORA" abaixo do nome, se for tempo atual
      if (isAtual && spanInterno >= 35) {
        const tId3 = uid();
        const rBadge = rTxt - S * 0.048;
        const pathBadge = invertido2
          ? arcoPathInvertido(cx, cy, rBadge, iAngIni, iAngFim)
          : arcoPath(cx, cy, rBadge, iAngIni, iAngFim);

        const fsBadge = f2(Math.max(S * 0.020, 8));
        partes.push(`
          <path id="${tId3}" d="${pathBadge}" fill="none"/>
          <text font-family="'Inter',sans-serif"
            font-size="${fsBadge}"
            font-weight="700"
            fill="#FFD700"
            letter-spacing="1">
            <textPath href="#${tId3}" startOffset="50%" text-anchor="middle">
              ● TEMPO ATUAL
            </textPath>
          </text>`);
      }
    }
  });

  // ── SEPARADORES ENTRE SEGMENTOS ───────────────────────────────
  // Usar Set para evitar duplicatas nos ângulos
  const angulos = new Set();
  SEGMENTOS_CALENDARIO.forEach(seg => {
    angulos.add(seg.angIni);
    angulos.add(seg.angFim);
  });

  angulos.forEach(ang => {
    const pExt = pontoNoCirculo(cx, cy, R_EXT + 6,   ang);
    const pInt = pontoNoCirculo(cx, cy, R_INTERNO - 2, ang);
    partes.push(`<line
      x1="${pExt.x}" y1="${pExt.y}"
      x2="${pInt.x}" y2="${pInt.y}"
      stroke="rgba(255,255,255,0.6)"
      stroke-width="1.8"
      stroke-linecap="round"/>`);
  });

  // ── ANÉIS DECORATIVOS ─────────────────────────────────────────
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_FATIAS}"
    fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1.2"/>`);
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_INTERNO}"
    fill="none" stroke="url(#gAnel)" stroke-width="2.5"/>`);
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_INTERNO + 6}"
    fill="none" stroke="rgba(200,160,60,0.25)" stroke-width="1"/>`);

  // ── CÍRCULO CENTRAL ───────────────────────────────────────────
  // Sombra
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_CENTRO}"
    fill="#2a1408" filter="url(#fSombraCentro)"/>`);
  // Gradiente dourado
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_CENTRO}"
    fill="url(#gCentro)"/>`);
  // Anel dourado externo do centro
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_CENTRO}"
    fill="none" stroke="url(#gAnel)" stroke-width="3.5"/>`);
  // Anel interno decorativo
  partes.push(`<circle cx="${cx}" cy="${cy}" r="${R_CENTRO - 10}"
    fill="none" stroke="rgba(240,192,64,0.30)" stroke-width="1.2"/>`);

  // ── CRUZ ─────────────────────────────────────────────────────
  const cL = R_CENTRO * 0.68;   // metade do comprimento vertical
  const cB = R_CENTRO * 0.60;   // metade do comprimento horizontal
  const cW = S * 0.030;         // espessura do braço
  const cY = -R_CENTRO * 0.05;  // posição vertical do braço horizontal

  // Sombra da cruz
  partes.push(`<g transform="translate(2,4)" opacity="0.35">
    <rect x="${f2(cx - cW/2)}" y="${f2(cy - cL)}" width="${f2(cW)}" height="${f2(cL*2)}" rx="3" fill="#000"/>
    <rect x="${f2(cx - cB)}" y="${f2(cy + cY - cW/2)}" width="${f2(cB*2)}" height="${f2(cW)}" rx="3" fill="#000"/>
  </g>`);

  // Cruz principal
  partes.push(`<rect x="${f2(cx - cW/2)}" y="${f2(cy - cL)}" width="${f2(cW)}" height="${f2(cL*2)}"
    rx="3.5" fill="rgba(255,230,140,0.97)"/>`);
  partes.push(`<rect x="${f2(cx - cB)}" y="${f2(cy + cY - cW/2)}" width="${f2(cB*2)}" height="${f2(cW)}"
    rx="3.5" fill="rgba(255,230,140,0.97)"/>`);

  // Destaque luminoso na cruz
  partes.push(`<rect x="${f2(cx - cW/2 + 2)}" y="${f2(cy - cL + 4)}" width="${f2(cW * 0.4)}" height="${f2(cL*2 - 8)}"
    rx="2" fill="rgba(255,255,220,0.35)"/>`);

  // ── ALFA E ÔMEGA ──────────────────────────────────────────────
  const szGrk  = f2(S * 0.068);
  const yGrk   = f2(cy + R_CENTRO * 0.25);
  const xAlfa  = f2(cx - R_CENTRO * 0.42);
  const xOmega = f2(cx + R_CENTRO * 0.42);

  partes.push(`<text x="${xAlfa}" y="${yGrk}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Libre Baskerville',serif"
    font-size="${szGrk}" font-weight="700"
    fill="rgba(255,238,170,0.95)">Α</text>`);

  partes.push(`<text x="${xOmega}" y="${yGrk}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="'Libre Baskerville',serif"
    font-size="${szGrk}" font-weight="700"
    fill="rgba(255,238,170,0.95)">Ω</text>`);

  // ── INDICADOR DE INÍCIO DO ANO LITÚRGICO (topo) ───────────────
  // Pequena seta apontando para o topo (ângulo 0° = início do Advento)
  const setaCx = cx;
  const setaY  = cy - R_FUNDO - 18;
  partes.push(`<g opacity="0.65">
    <polygon points="${f2(setaCx)},${f2(setaY)} ${f2(setaCx-7)},${f2(setaY+12)} ${f2(setaCx+7)},${f2(setaY+12)}"
      fill="#8b6f3d"/>
    <line x1="${f2(setaCx)}" y1="${f2(setaY+12)}" x2="${f2(setaCx)}" y2="${f2(cy - R_FUNDO + 2)}"
      stroke="#8b6f3d" stroke-width="1.5"/>
  </g>`);

  // Label "início do ano litúrgico"
  const tIdLabel = uid();
  const rLabel   = R_FUNDO - 8;
  const angLabelIni = -22;
  const angLabelFim = 22;
  const pathLabel = arcoPath(cx, cy, rLabel, angLabelIni < 0 ? 360 + angLabelIni : angLabelIni, angLabelFim);
  // Texto simples centralizado no topo
  partes.push(`<text
    x="${cx}" y="${f2(cy - R_FUNDO + 14)}"
    text-anchor="middle"
    font-family="'Inter',sans-serif"
    font-size="${f2(S * 0.022)}"
    font-weight="600"
    fill="#8b6f3d"
    opacity="0.75">início do ano litúrgico</text>`);

  // ── WRAPPER SVG ───────────────────────────────────────────────
  return `<svg
    viewBox="0 0 ${S} ${S}"
    xmlns="http://www.w3.org/2000/svg"
    style="width:100%;height:100%;display:block;overflow:visible">
    ${partes.join('\n')}
  </svg>`;
}

/* ================================================================
   8. MINI CALENDÁRIO (sidebar)
   ================================================================ */
function gerarMiniCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo      = TEMPOS[tempoAtual];
  const container  = document.getElementById('mini-calendario-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mini-cal-card"
      onclick="abrirModalCalendario()"
      role="button"
      tabindex="0"
      aria-label="Abrir calendário litúrgico completo">

      <div class="mini-cal-topo">
        <div class="mini-cal-linha"></div>
        <span class="mini-cal-label">Calendário Litúrgico</span>
        <div class="mini-cal-linha"></div>
      </div>

      <div class="mini-cal-ring">
        ${gerarSVG(tempoAtual, 190)}
      </div>

      <div class="mini-cal-tempo-row">
        <span class="mini-dot" style="background:${tempo.cor}"></span>
        <span class="mini-tempo-txt">${tempo.nome}</span>
      </div>

      <div class="mini-cal-veste" style="color:${tempo.cor}">
        ${tempo.corVeste}
      </div>

      <div class="mini-cal-cta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
          stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        Ver calendário completo
      </div>

    </div>`;

  container.querySelector('.mini-cal-card').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModalCalendario(); }
  });
}

/* ================================================================
   9. MODAL
   ================================================================ */
function abrirModalCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo      = TEMPOS[tempoAtual];

  // SVG grande
  document.getElementById('modal-cal-svg').innerHTML = gerarSVG(tempoAtual, 520);

  // Painel de info
  document.getElementById('modal-cal-info').innerHTML = `
    <div class="mci-topo">
      <div class="mci-barra" style="background:linear-gradient(180deg,${tempo.cor},${tempo.corSecundaria})"></div>
      <div>
        <p class="mci-rotulo">Tempo Litúrgico Atual</p>
        <h3 class="mci-titulo" style="color:${tempo.cor}">${tempo.nome}</h3>
      </div>
    </div>

    <div class="mci-veste-box">
      <span class="mci-veste-label">Cor Litúrgica</span>
      <div class="mci-veste-val">
        <span class="mci-bolinha" style="background:${tempo.cor}"></span>
        <strong style="color:${tempo.cor}">${tempo.corVeste}</strong>
      </div>
    </div>

    <p class="mci-desc">${tempo.descricao}</p>

    <div class="mci-celebracoes">
      <p class="mci-celeb-titulo">Celebrações deste tempo</p>
      ${tempo.celebracoes.map(c => `
        <div class="mci-celeb-item">
          <span class="mci-celeb-dot" style="background:${tempo.cor}"></span>
          <span>${c}</span>
        </div>`).join('')}
    </div>

    <a href="../estudos/estudos.html" class="mci-btn">
      Aprofundar sobre o ${tempo.nome}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>`;

  // Legenda
  const temposUnicos = ['advento','natal','tempoComum','quaresma','triduo','pascoa'];
  document.getElementById('modal-cal-legenda').innerHTML = temposUnicos.map(id => {
    const t  = TEMPOS[id];
    const ia = id === tempoAtual;
    return `<div class="leg-pill ${ia ? 'leg-ativa' : ''}">
      <span class="leg-dot" style="background:${t.cor}"></span>
      <span>${t.nome}</span>
      ${ia ? '<span class="leg-badge">agora</span>' : ''}
    </div>`;
  }).join('');

  document.getElementById('modal-calendario').classList.add('modal-aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalCalendario() {
  document.getElementById('modal-calendario').classList.remove('modal-aberto');
  document.body.style.overflow = '';
}

/* ================================================================
   10. INICIALIZAÇÃO
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  gerarMiniCalendario();

  const modal = document.getElementById('modal-calendario');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) fecharModalCalendario();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModalCalendario();
  });
});
