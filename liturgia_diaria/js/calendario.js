/* ==============================================
   CALENDÁRIO LITÚRGICO - Lux Fidei
   Versão 2.0 - Design Refinado
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

/* ==============================================
   2. UTILITÁRIOS
   ============================================== */
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
   3. DETECTAR TEMPO LITÚRGICO ATUAL
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
  const batismoAnt = batismoSenhor(ano);

  // Natal do ano anterior (25/Dez ano-1 até Batismo do Senhor)
  if (entreDatas(hoje, new Date(ano - 1, 11, 25), batismo)) return 'natal';

  // Tempo Comum 1 (Batismo até Quarta de Cinzas)
  if (entreDatas(hoje, addDias(batismo, 1), addDias(quartaCinzas, -1))) return 'tempoComum';

  // Quaresma
  if (entreDatas(hoje, quartaCinzas, addDias(quintaSanta, -1))) return 'quaresma';

  // Tríduo Pascal
  if (entreDatas(hoje, quintaSanta, addDias(pascoa, -1))) return 'triduo';

  // Tempo Pascal
  if (entreDatas(hoje, pascoa, pentecostes)) return 'pascoa';

  // Tempo Comum 2 (após Pentecostes até Advento)
  if (entreDatas(hoje, addDias(pentecostes, 1), addDias(inicioAdvento, -1))) return 'tempoComum';

  // Advento
  if (entreDatas(hoje, inicioAdvento, new Date(ano, 11, 24))) return 'advento';
  if (entreDatas(hoje, inicioAdventoAnt, new Date(ano - 1, 11, 24))) return 'advento';

  // Natal atual
  if (entreDatas(hoje, new Date(ano, 11, 25), new Date(ano, 11, 31))) return 'natal';

  return 'tempoComum';
}

/* ==============================================
   4. DADOS DOS TEMPOS LITÚRGICOS
   ============================================== */
const TEMPOS = [
  {
    id: 'advento',
    nome: 'Advento',
    cor: '#5b2d8e',
    corClara: '#7b4db0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    icone: '✦',
    angInicio: 0,
    angFim: 55,
    descricao: 'Tempo de preparação e esperança pela vinda do Senhor. A Igreja nos convida à conversão, à oração e à vigilância.'
  },
  {
    id: 'natal',
    nome: 'Natal',
    cor: '#c8a96e',
    corClara: '#e8c98e',
    corTexto: '#2a1a00',
    corVeste: 'Branco / Dourado',
    icone: '★',
    angInicio: 55,
    angFim: 95,
    descricao: 'Celebramos o mistério da Encarnação. O Verbo se fez carne e habitou entre nós cheio de graça e verdade.'
  },
  {
    id: 'tempoComum',
    nome: 'Tempo Comum',
    cor: '#1e6b3a',
    corClara: '#2d9150',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    icone: '✿',
    angInicio: 95,
    angFim: 175,
    descricao: 'Tempo de crescimento na fé. A Igreja medita a vida e os ensinamentos de Cristo, crescendo na caridade.'
  },
  {
    id: 'quaresma',
    nome: 'Quaresma',
    cor: '#6b2d8e',
    corClara: '#8b4db0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    icone: '✞',
    angInicio: 175,
    angFim: 235,
    descricao: 'Quarenta dias de penitência, oração e jejum. Caminhamos com Cristo ao deserto, preparando o coração.'
  },
  {
    id: 'triduo',
    nome: 'Tríduo Pascal',
    cor: '#8b1a1a',
    corClara: '#b02d2d',
    corTexto: '#ffffff',
    corVeste: 'Vermelho / Branco',
    icone: '✝',
    angInicio: 235,
    angFim: 265,
    descricao: 'O coração do ano litúrgico. Paixão, Morte e Ressurreição de Nosso Senhor Jesus Cristo.'
  },
  {
    id: 'pascoa',
    nome: 'Tempo Pascal',
    cor: '#b8860b',
    corClara: '#d4a017',
    corTexto: '#1a0f00',
    corVeste: 'Branco / Dourado',
    icone: '☀',
    angInicio: 265,
    angFim: 340,
    descricao: 'Cinquenta dias de alegria! Cristo ressuscitou, aleluia! Celebramos a vitória da vida sobre a morte.'
  },
  {
    id: 'tempoComum',
    nome: 'Tempo Comum',
    cor: '#1e6b3a',
    corClara: '#2d9150',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    icone: '✿',
    angInicio: 340,
    angFim: 360,
    descricao: 'Tempo de crescimento na fé. A Igreja medita a vida e os ensinamentos de Cristo.'
  }
];

// Versão sem duplicata para legenda
const TEMPOS_UNICOS = [
  TEMPOS[0], TEMPOS[1], TEMPOS[2], TEMPOS[3], TEMPOS[4], TEMPOS[5]
];

/* ==============================================
   5. GERAR SVG BONITO
   ============================================== */
function polarXY(cx, cy, angulo, raio) {
  const rad = (angulo - 90) * Math.PI / 180;
  return {
    x: cx + raio * Math.cos(rad),
    y: cy + raio * Math.sin(rad)
  };
}

function arcPath(cx, cy, rExt, rInt, angIni, angFim) {
  const p1 = polarXY(cx, cy, angIni, rExt);
  const p2 = polarXY(cx, cy, angFim, rExt);
  const p3 = polarXY(cx, cy, angFim, rInt);
  const p4 = polarXY(cx, cy, angIni, rInt);
  const grande = (angFim - angIni) > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rExt} ${rExt} 0 ${grande} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInt} ${rInt} 0 ${grande} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z'
  ].join(' ');
}

function gerarSVG(tempoAtual, size) {
  const cx = size / 2;
  const cy = size / 2;
  const rExt = size * 0.45;
  const rMed = size * 0.30;
  const rInt = size * 0.18;
  const rTexto = size * 0.375;

  let defs = `
    <defs>
      <radialGradient id="gCenter" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a07840"/>
        <stop offset="100%" stop-color="#4a2e0a"/>
      </radialGradient>
      <radialGradient id="gBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fdfbf7"/>
        <stop offset="100%" stop-color="#f0ece4"/>
      </radialGradient>
      <filter id="fSombra">
        <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.18)"/>
      </filter>
      <filter id="fBrilho">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="rgba(255,215,0,0.6)"/>
      </filter>
      <filter id="fCenter">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="rgba(0,0,0,0.4)"/>
      </filter>
    </defs>`;

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += defs;

  // Fundo circular
  svg += `<circle cx="${cx}" cy="${cy}" r="${rExt + 18}" fill="url(#gBg)" filter="url(#fSombra)"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${rExt + 18}" fill="none" stroke="rgba(139,111,61,0.2)" stroke-width="1.5"/>`;

  // === FATIAS ===
  TEMPOS.forEach((tempo, idx) => {
    const isAtual = tempo.id === tempoAtual;
    const angIni = tempo.angInicio;
    const angFim = tempo.angFim;
    const angMeio = (angIni + angFim) / 2;

    const rExtFatia = isAtual ? rExt + 6 : rExt;

    // Sombra dourada no tempo atual
    if (isAtual) {
      svg += `<path d="${arcPath(cx, cy, rExt + 14, rInt - 4, angIni, angFim)}"
        fill="${tempo.cor}" opacity="0.15"/>`;
    }

    // Fatia principal
    svg += `<path d="${arcPath(cx, cy, rExtFatia, rInt, angIni, angFim)}"
      fill="${tempo.cor}"
      stroke="rgba(255,255,255,0.25)"
      stroke-width="1.2"/>`;

    // Gradiente de brilho interno
    svg += `<path d="${arcPath(cx, cy, rExtFatia, rMed, angIni, angFim)}"
      fill="${tempo.corClara}"
      opacity="0.35"/>`;

    // Borda dourada no tempo atual
    if (isAtual) {
      svg += `<path d="${arcPath(cx, cy, rExt + 8, rExt, angIni, angFim)}"
        fill="#FFD700" opacity="0.9" filter="url(#fBrilho)"/>`;
      svg += `<path d="${arcPath(cx, cy, rInt, rInt - 6, angIni, angFim)}"
        fill="#FFD700" opacity="0.7"/>`;
    }

    // Texto do tempo
    const posTexto = polarXY(cx, cy, angMeio, rTexto);
    const rotTexto = angMeio <= 180 ? angMeio - 90 : angMeio + 90;

    svg += `<text
      x="${posTexto.x.toFixed(2)}"
      y="${posTexto.y.toFixed(2)}"
      text-anchor="middle"
      dominant-baseline="middle"
      transform="rotate(${rotTexto.toFixed(1)}, ${posTexto.x.toFixed(2)}, ${posTexto.y.toFixed(2)})"
      font-family="'Inter', sans-serif"
      font-size="${size * 0.028}"
      font-weight="${isAtual ? '700' : '500'}"
      fill="${isAtual ? '#fff' : tempo.corTexto}"
      opacity="${isAtual ? '1' : '0.92'}"
      letter-spacing="0.3">
      ${tempo.nome}
    </text>`;

    // "AGORA" no tempo atual
    if (isAtual) {
      const posAgora = polarXY(cx, cy, angMeio, rExt - 14);
      svg += `<text
        x="${posAgora.x.toFixed(2)}"
        y="${posAgora.y.toFixed(2)}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${rotTexto.toFixed(1)}, ${posAgora.x.toFixed(2)}, ${posAgora.y.toFixed(2)})"
        font-family="'Inter', sans-serif"
        font-size="${size * 0.022}"
        font-weight="800"
        fill="#FFD700"
        letter-spacing="1.5">AGORA</text>`;
    }
  });

  // === DIVISÓRIAS ===
  TEMPOS.forEach(tempo => {
    const p1 = polarXY(cx, cy, tempo.angInicio, rExt + 8);
    const p2 = polarXY(cx, cy, tempo.angInicio, rInt - 8);
    svg += `<line
      x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}"
      x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"
      stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>`;
  });

  // === ANEL DECORATIVO ===
  svg += `<circle cx="${cx}" cy="${cy}" r="${rInt + 2}" fill="none"
    stroke="rgba(160,120,64,0.4)" stroke-width="2.5"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${rExt}" fill="none"
    stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;

  // === CENTRO DOURADO ===
  svg += `<circle cx="${cx}" cy="${cy}" r="${rInt}" fill="url(#gCenter)" filter="url(#fCenter)"/>`;

  // Anel interno dourado
  svg += `<circle cx="${cx}" cy="${cy}" r="${rInt}" fill="none"
    stroke="rgba(212,180,80,0.6)" stroke-width="3"/>`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${rInt - 8}" fill="none"
    stroke="rgba(212,180,80,0.3)" stroke-width="1.5"/>`;

  // Cruz
  const cBracoV = size * 0.022;
  const cAlturaV = rInt * 1.1;
  const cBracoH = size * 0.022;
  const cLarguraH = rInt * 0.9;
  const cPosH = -rInt * 0.1;

  svg += `<rect
    x="${(cx - cBracoV / 2).toFixed(2)}" y="${(cy - cAlturaV / 2).toFixed(2)}"
    width="${cBracoV.toFixed(2)}" height="${cAlturaV.toFixed(2)}"
    fill="rgba(255,230,140,0.95)" rx="2"/>`;
  svg += `<rect
    x="${(cx - cLarguraH / 2).toFixed(2)}" y="${(cy + cPosH - cBracoH / 2).toFixed(2)}"
    width="${cLarguraH.toFixed(2)}" height="${cBracoH.toFixed(2)}"
    fill="rgba(255,230,140,0.95)" rx="2"/>`;

  // Alpha e Omega
  svg += `<text x="${(cx - rInt * 0.42).toFixed(2)}" y="${(cy + rInt * 0.18).toFixed(2)}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="serif" font-size="${(size * 0.055).toFixed(1)}"
    fill="rgba(255,240,180,0.9)" font-weight="bold">Α</text>`;
  svg += `<text x="${(cx + rInt * 0.42).toFixed(2)}" y="${(cy + rInt * 0.18).toFixed(2)}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="serif" font-size="${(size * 0.055).toFixed(1)}"
    fill="rgba(255,240,180,0.9)" font-weight="bold">Ω</text>`;

  svg += `</svg>`;
  return svg;
}

/* ==============================================
   6. MINI CALENDÁRIO NA SIDEBAR
   ============================================== */
function gerarMiniCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo = TEMPOS_UNICOS.find(t => t.id === tempoAtual) || TEMPOS_UNICOS[2];
  const container = document.getElementById('mini-calendario-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mini-cal-card" onclick="abrirModalCalendario()" role="button" tabindex="0"
      aria-label="Abrir calendário litúrgico completo">

      <div class="mini-cal-topo">
        <span class="mini-cal-label">Calendário Litúrgico</span>
      </div>

      <div class="mini-cal-ring">
        ${gerarSVG(tempoAtual, 170)}
      </div>

      <div class="mini-cal-rodape">
        <div class="mini-cal-tempo-info">
          <span class="mini-dot" style="background:${tempo.cor}"></span>
          <span class="mini-tempo-nome">${tempo.nome}</span>
        </div>
        <div class="mini-cal-cta">
          <span>Ver calendário</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

    </div>`;

  // Acessibilidade teclado
  const card = container.querySelector('.mini-cal-card');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') abrirModalCalendario();
  });
}

/* ==============================================
   7. MODAL
   ============================================== */
function abrirModalCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo = TEMPOS_UNICOS.find(t => t.id === tempoAtual) || TEMPOS_UNICOS[2];

  // SVG grande
  document.getElementById('modal-cal-svg').innerHTML = gerarSVG(tempoAtual, 500);

  // Info do tempo atual
  document.getElementById('modal-cal-info').innerHTML = `
    <div class="modal-info-header">
      <span class="modal-tempo-icone">${tempo.icone}</span>
      <div>
        <p class="modal-info-label">Estamos no</p>
        <h3 class="modal-info-nome" style="color:${tempo.cor}">${tempo.nome}</h3>
      </div>
    </div>

    <div class="modal-info-badge" style="background:${tempo.cor}1a; border-color:${tempo.cor}40">
      <span class="modal-info-veste-label">Cor litúrgica</span>
      <span class="modal-info-veste-valor" style="color:${tempo.cor}">
        <span class="modal-dot-cor" style="background:${tempo.cor}"></span>
        ${tempo.corVeste}
      </span>
    </div>

    <p class="modal-info-desc">${tempo.descricao}</p>

    <a href="../estudos/estudos.html" class="modal-btn-lermais">
      <span>Ler mais sobre o ${tempo.nome}</span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>`;

  // Legenda
  document.getElementById('modal-cal-legenda').innerHTML = TEMPOS_UNICOS.map(t => `
    <div class="legenda-pill ${t.id === tempoAtual ? 'legenda-pill-ativa' : ''}">
      <span class="legenda-dot" style="background:${t.cor}"></span>
      <span>${t.nome}</span>
    </div>`).join('');

  // Abrir
  const modal = document.getElementById('modal-calendario');
  modal.classList.add('modal-aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalCalendario() {
  document.getElementById('modal-calendario').classList.remove('modal-aberto');
  document.body.style.overflow = '';
}

/* ==============================================
   8. INICIALIZAÇÃO
   ============================================== */
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
