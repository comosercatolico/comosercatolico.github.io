/* ==============================================
   CALENDÁRIO LITÚRGICO - Lux Fidei
   ============================================== */

/* ==============================================
   1. CÁLCULO DA PÁSCOA (Algoritmo de Meeus/Jones)
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
   2. UTILITÁRIOS DE DATA
   ============================================== */
function addDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function mesmoDia(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function entreDatas(data, inicio, fim) {
  return data >= inicio && data <= fim;
}

/* ==============================================
   3. TEMPOS LITÚRGICOS & DATAS DO ANO
   ============================================== */
function calcularTemposLiturgicos(ano) {
  const pascoa = calcularPascoa(ano);
  const pasocoaAnterior = calcularPascoa(ano - 1);

  // ADVENTO: 4 domingos antes do Natal
  // Primeiro domingo do Advento = domingo mais próximo de 30/Nov
  function primeiroAdvento(y) {
    const natal = new Date(y, 11, 25);
    const diaSemana = natal.getDay(); // 0=Dom
    const diasAteAnteriorDomingo = diaSemana === 0 ? 0 : diaSemana;
    const quartoDomingoAdvento = new Date(natal);
    quartoDomingoAdvento.setDate(natal.getDate() - diasAteAnteriorDomingo);
    const primeiro = new Date(quartoDomingoAdvento);
    primeiro.setDate(quartoDomingoAdvento.getDate() - 21);
    return primeiro;
  }

  const inicioAdventoAtual = primeiroAdvento(ano);
  const inicioAdventoAnterior = primeiroAdvento(ano - 1);
  const fimAdventoAtual = new Date(ano, 11, 24);

  // NATAL: 25/Dez até Batismo do Senhor (domingo após 6/Jan, ou 6/Jan se for Dom)
  const natal = new Date(ano, 11, 25);
  const epifania = new Date(ano, 0, 6); // 6 de Janeiro

  function batismoSenhor(y) {
    const ep = new Date(y, 0, 6);
    const dia = ep.getDay();
    if (dia === 0) return new Date(y, 0, 13); // Se Epifania for domingo, Batismo é na semana seguinte
    const diasAteDom = 7 - dia;
    return addDias(ep, diasAteDom);
  }

  const batismo = batismoSenhor(ano);
  const inicioNatal = new Date(ano, 11, 25);
  // Natal do ano anterior
  const inicioNatalAnterior = new Date(ano - 1, 11, 25);
  const fimNatalAnterior = batismoSenhor(ano); // até batismo do senhor do ano atual

  // TEMPO COMUM (1ª parte): Batismo do Senhor até Quarta de Cinzas
  const quartaCinzas = addDias(pascoa, -46);
  const inicioTempoComum1 = addDias(batismo, 1);
  const fimTempoComum1 = addDias(quartaCinzas, -1);

  // QUARESMA: Quarta de Cinzas até Sábado Santo
  const inicioQuaresma = quartaCinzas;
  const domingoRamos = addDias(pascoa, -7);
  const sextaFeiraSanta = addDias(pascoa, -2);
  const sabadoSanto = addDias(pascoa, -1);
  const fimQuaresma = addDias(pascoa, -1); // até Sábado Santo

  // TRÍDUO PASCAL: Quinta-feira Santa até Vigília Pascal
  const quintaSanta = addDias(pascoa, -3);
  const inicioTriduo = quintaSanta;
  const fimTriduo = sabadoSanto;

  // PÁSCOA: Domingo de Páscoa até Pentecostes
  const pentecostes = addDias(pascoa, 49);
  const inicioPascoa = pascoa;
  const fimPascoa = pentecostes;

  // TEMPO COMUM (2ª parte): Segunda após Pentecostes até início do Advento
  const inicioTempoComum2 = addDias(pentecostes, 1);
  const fimTempoComum2 = addDias(inicioAdventoAtual, -1);

  return {
    advento: { inicio: inicioAdventoAnterior, fim: new Date(ano - 1, 11, 24) },
    natal: { inicio: inicioNatalAnterior, fim: batismo },
    tempoComum1: { inicio: inicioTempoComum1, fim: fimTempoComum1 },
    quaresma: { inicio: inicioQuaresma, fim: addDias(quintaSanta, -1) },
    triduo: { inicio: inicioTriduo, fim: fimTriduo },
    pascoa: { inicio: inicioPascoa, fim: fimPascoa },
    tempoComum2: { inicio: inicioTempoComum2, fim: fimTempoComum2 },
    adventoProximo: { inicio: inicioAdventoAtual, fim: fimAdventoAtual },
    // datas especiais
    pascoa: { inicio: pascoa, fim: fimPascoa },
    pentecostes,
    domingoRamos,
    quintaSanta,
    sextaFeiraSanta,
    sabadoSanto,
    quartaCinzas,
    batismo,
    epifania: new Date(ano, 0, 6),
  };
}

/* ==============================================
   4. DETECTAR TEMPO ATUAL
   ============================================== */
function detectarTempoAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const t = calcularTemposLiturgicos(ano);

  // Verifica cada período
  if (entreDatas(hoje, t.advento.inicio, t.advento.fim) ||
      entreDatas(hoje, t.adventoProximo.inicio, t.adventoProximo.fim)) {
    return 'advento';
  }
  if (entreDatas(hoje, t.natal.inicio, t.natal.fim)) {
    return 'natal';
  }
  if (entreDatas(hoje, t.triduo.inicio, t.triduo.fim)) {
    return 'triduo';
  }
  if (entreDatas(hoje, t.quaresma.inicio, addDias(t.triduo.inicio, -1))) {
    return 'quaresma';
  }
  if (entreDatas(hoje, t.pascoa.inicio, t.pascoa.fim)) {
    return 'pascoa';
  }
  return 'tempoComum';
}

/* ==============================================
   5. DADOS DOS TEMPOS LITÚRGICOS
   ============================================== */
const TEMPOS_LITURGICOS = [
  {
    id: 'advento',
    nome: 'Advento',
    cor: '#6b3fa0',
    corTexto: '#ffffff',
    angulo: { inicio: 0, fim: 50 },
    descricao: 'Tempo de preparação e espera pela vinda do Senhor. A Igreja nos convida à conversão, à oração e à esperança.',
    corVeste: 'Roxo'
  },
  {
    id: 'natal',
    nome: 'Natal',
    cor: '#f0f0f0',
    corTexto: '#333333',
    angulo: { inicio: 50, fim: 80 },
    descricao: 'Celebramos o mistério da Encarnação do Verbo de Deus. Cristo nasce para nos dar a vida eterna.',
    corVeste: 'Branco'
  },
  {
    id: 'tempoComum1',
    nome: 'Tempo Comum',
    cor: '#2d7a2d',
    corTexto: '#ffffff',
    angulo: { inicio: 80, fim: 130 },
    descricao: 'Tempo de crescimento na fé. A Igreja medita os mistérios da vida de Cristo e cresce na caridade.',
    corVeste: 'Verde'
  },
  {
    id: 'quaresma',
    nome: 'Quaresma',
    cor: '#7a3fa0',
    corTexto: '#ffffff',
    angulo: { inicio: 130, fim: 195 },
    descricao: 'Quarenta dias de penitência, oração e jejum. Caminhamos com Cristo rumo à Páscoa, nossa conversão.',
    corVeste: 'Roxo'
  },
  {
    id: 'triduo',
    nome: 'Tríduo Pascal',
    cor: '#8b0000',
    corTexto: '#ffffff',
    angulo: { inicio: 195, fim: 220 },
    descricao: 'O coração do ano litúrgico. Celebramos a Paixão, Morte e Ressurreição de Nosso Senhor Jesus Cristo.',
    corVeste: 'Vermelho/Branco'
  },
  {
    id: 'pascoa',
    nome: 'Tempo Pascal',
    cor: '#d4a017',
    corTexto: '#1a1a1a',
    angulo: { inicio: 220, fim: 280 },
    descricao: 'Cinquenta dias de alegria pascal! Cristo ressuscitou! Celebramos a vitória da vida sobre a morte.',
    corVeste: 'Branco/Dourado'
  },
  {
    id: 'tempoComum2',
    nome: 'Tempo Comum',
    cor: '#2d7a2d',
    corTexto: '#ffffff',
    angulo: { inicio: 280, fim: 360 },
    descricao: 'Tempo de crescimento na fé. A Igreja medita os mistérios da vida de Cristo e cresce na caridade.',
    corVeste: 'Verde'
  }
];

/* ==============================================
   6. GERAR SVG DO CALENDÁRIO CIRCULAR
   ============================================== */
function gerarCalendarioSVG(tempoAtual, tamanho = 500) {
  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const raioExterno = tamanho * 0.46;
  const raioInterno = tamanho * 0.22;
  const raioTexto = tamanho * 0.355;
  const raioLabel = tamanho * 0.42;

  function polarParaXY(angulo, raio) {
    const rad = (angulo - 90) * Math.PI / 180;
    return {
      x: cx + raio * Math.cos(rad),
      y: cy + raio * Math.sin(rad)
    };
  }

  function gerarArco(anguloInicio, anguloFim, raioExt, raioInt) {
    const p1 = polarParaXY(anguloInicio, raioExt);
    const p2 = polarParaXY(anguloFim, raioExt);
    const p3 = polarParaXY(anguloFim, raioInt);
    const p4 = polarParaXY(anguloInicio, raioInt);
    const largeArc = (anguloFim - anguloInicio) > 180 ? 1 : 0;

    return `M ${p1.x} ${p1.y} 
            A ${raioExt} ${raioExt} 0 ${largeArc} 1 ${p2.x} ${p2.y} 
            L ${p3.x} ${p3.y} 
            A ${raioInt} ${raioInt} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
  }

  let svgContent = '';

  // === SOMBRA/FUNDO ===
  svgContent += `<defs>
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.15)"/>
    </filter>
    <filter id="sombraInterna">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
    <radialGradient id="gradCenter" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#8b6f3d"/>
      <stop offset="100%" stop-color="#5a4020"/>
    </radialGradient>
    <radialGradient id="gradBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f5f3ef"/>
    </radialGradient>
  </defs>`;

  // Círculo de fundo
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${raioExterno + 15}" fill="url(#gradBg)" filter="url(#sombra)"/>`;

  // === FATIAS DOS TEMPOS ===
  TEMPOS_LITURGICOS.forEach(tempo => {
    const isAtual = tempo.id === tempoAtual ||
      (tempoAtual === 'tempoComum' && (tempo.id === 'tempoComum1' || tempo.id === 'tempoComum2'));

    const anguloInicio = tempo.angulo.inicio;
    const anguloFim = tempo.angulo.fim;
    const meio = (anguloInicio + anguloFim) / 2;

    // Fatia principal
    const path = gerarArco(anguloInicio, anguloFim, raioExterno, raioInterno);

    // Destaque se for tempo atual
    const strokeWidth = isAtual ? 3 : 1;
    const strokeColor = isAtual ? '#FFD700' : 'rgba(255,255,255,0.3)';
    const opacidade = isAtual ? 1 : 0.82;

    svgContent += `<path d="${path}" 
      fill="${tempo.cor}" 
      stroke="${strokeColor}" 
      stroke-width="${strokeWidth}"
      opacity="${opacidade}"
      class="fatia-liturgica ${isAtual ? 'fatia-ativa' : ''}"
      data-tempo="${tempo.id}"/>`;

    // Brilho no tempo atual
    if (isAtual) {
      svgContent += `<path d="${gerarArco(anguloInicio, anguloFim, raioExterno + 8, raioExterno)}" 
        fill="${tempo.cor}" 
        opacity="0.4"/>`;
    }

    // Label do tempo
    const posLabel = polarParaXY(meio, raioTexto);
    const anguloTexto = meio - 90;
    const ajuste = meio > 180 ? 180 : 0;

    svgContent += `<text 
      x="${posLabel.x}" 
      y="${posLabel.y}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      transform="rotate(${anguloTexto + ajuste}, ${posLabel.x}, ${posLabel.y})"
      font-family="'Inter', sans-serif"
      font-size="${tamanho * 0.022}"
      font-weight="${isAtual ? '700' : '500'}"
      fill="${tempo.corTexto}"
      opacity="${isAtual ? 1 : 0.9}">
      ${tempo.nome}
    </text>`;

    // Indicador "AGORA" no tempo atual
    if (isAtual) {
      const posNow = polarParaXY(meio, raioExterno - 18);
      svgContent += `<text 
        x="${posNow.x}" 
        y="${posNow.y}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        transform="rotate(${anguloTexto + ajuste}, ${posNow.x}, ${posNow.y})"
        font-family="'Inter', sans-serif"
        font-size="${tamanho * 0.018}"
        font-weight="800"
        fill="#FFD700"
        letter-spacing="1">
        ✦ AGORA
      </text>`;
    }
  });

  // === DIVISÓRIAS ===
  TEMPOS_LITURGICOS.forEach(tempo => {
    const p1 = polarParaXY(tempo.angulo.inicio, raioExterno + 2);
    const p2 = polarParaXY(tempo.angulo.inicio, raioInterno - 2);
    svgContent += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
      stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>`;
  });

  // === ANEL DECORATIVO INTERNO ===
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${raioInterno + 4}" fill="none" 
    stroke="rgba(139,111,61,0.3)" stroke-width="2"/>`;
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${raioInterno}" fill="url(#gradCenter)" 
    filter="url(#sombraInterna)"/>`;

  // === CENTRO - SÍMBOLO ===
  const raioSimbolo = tamanho * 0.14;

  // Cruz central
  const espessura = tamanho * 0.025;
  const altura = raioSimbolo * 1.3;
  const largura = raioSimbolo * 1.1;

  svgContent += `<rect x="${cx - espessura / 2}" y="${cy - altura / 2}" 
    width="${espessura}" height="${altura}" 
    fill="rgba(255,220,120,0.9)" rx="3"/>`;
  svgContent += `<rect x="${cx - largura / 2}" y="${cy - altura * 0.2}" 
    width="${largura}" height="${espessura}" 
    fill="rgba(255,220,120,0.9)" rx="3"/>`;

  // Alfa e Ômega
  svgContent += `<text x="${cx - raioSimbolo * 0.45}" y="${cy + espessura / 2 + tamanho * 0.01}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="serif" font-size="${tamanho * 0.05}" 
    fill="rgba(255,240,180,0.95)" font-weight="bold">Α</text>`;
  svgContent += `<text x="${cx + raioSimbolo * 0.45}" y="${cy + espessura / 2 + tamanho * 0.01}"
    text-anchor="middle" dominant-baseline="middle"
    font-family="serif" font-size="${tamanho * 0.05}" 
    fill="rgba(255,240,180,0.95)" font-weight="bold">Ω</text>`;

  // Anel dourado ao redor do centro
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${raioInterno}" fill="none" 
    stroke="rgba(212,160,23,0.6)" stroke-width="3"/>`;

  return `<svg viewBox="0 0 ${tamanho} ${tamanho}" xmlns="http://www.w3.org/2000/svg" 
    style="width:100%;height:100%;display:block;">
    ${svgContent}
  </svg>`;
}

/* ==============================================
   7. MINI CALENDÁRIO (para a sidebar)
   ============================================== */
function gerarMiniCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo = TEMPOS_LITURGICOS.find(t => t.id === tempoAtual) ||
    TEMPOS_LITURGICOS.find(t => t.id === 'tempoComum2');

  const container = document.getElementById('mini-calendario-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mini-cal-wrapper" onclick="abrirModalCalendario()" title="Ver Calendário Litúrgico Completo">
      <div class="mini-cal-ring">
        ${gerarCalendarioSVG(tempoAtual, 160)}
      </div>
      <div class="mini-cal-info">
        <span class="mini-cal-label">Calendário Litúrgico</span>
        <span class="mini-cal-tempo" style="background:${tempo.cor};color:${tempo.corTexto}">
          ${tempo.nome}
        </span>
      </div>
      <div class="mini-cal-btn">
        <span>Ver completo</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
      </div>
    </div>
  `;
}

/* ==============================================
   8. MODAL DO CALENDÁRIO
   ============================================== */
function abrirModalCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo = TEMPOS_LITURGICOS.find(t => t.id === tempoAtual) ||
    TEMPOS_LITURGICOS.find(t => t.id === 'tempoComum2');

  const modal = document.getElementById('modal-calendario');
  const svgContainer = document.getElementById('modal-cal-svg');
  const infoContainer = document.getElementById('modal-cal-info');

  svgContainer.innerHTML = gerarCalendarioSVG(tempoAtual, 520);

  infoContainer.innerHTML = `
    <div class="modal-tempo-badge" style="background:${tempo.cor};color:${tempo.corTexto}">
      <span class="modal-tempo-dot"></span>
      Estamos no ${tempo.nome}
    </div>
    <p class="modal-tempo-desc">${tempo.descricao}</p>
    <div class="modal-tempo-veste">
      <span class="veste-label">Cor litúrgica:</span>
      <span class="veste-valor">${tempo.corVeste}</span>
    </div>
    <a href="../estudos/estudos.html" class="modal-ler-mais">
      Ler mais sobre o ${tempo.nome}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>
  `;

  // Legenda
  const legendaContainer = document.getElementById('modal-cal-legenda');
  legendaContainer.innerHTML = TEMPOS_LITURGICOS
    .filter((t, i, arr) => arr.findIndex(x => x.nome === t.nome) === i)
    .map(t => `
      <div class="legenda-item ${t.id === tempoAtual || (tempoAtual === 'tempoComum' && t.id === 'tempoComum1') ? 'legenda-ativa' : ''}">
        <span class="legenda-cor" style="background:${t.cor};border:2px solid ${t.id === tempoAtual ? '#FFD700' : 'transparent'}"></span>
        <span class="legenda-nome">${t.nome}</span>
      </div>
    `).join('');

  modal.classList.add('modal-aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalCalendario() {
  const modal = document.getElementById('modal-calendario');
  modal.classList.remove('modal-aberto');
  document.body.style.overflow = '';
}

/* ==============================================
   9. INICIALIZAÇÃO
   ============================================== */
document.addEventListener('DOMContentLoaded', function () {
  gerarMiniCalendario();

  // Fechar modal clicando fora
  const modal = document.getElementById('modal-calendario');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) fecharModalCalendario();
    });
  }

  // Fechar com ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModalCalendario();
  });
});
