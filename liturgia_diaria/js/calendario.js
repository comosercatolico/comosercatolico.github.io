/* ================================================================
   CALENDÁRIO LITÚRGICO PROFISSIONAL - Lux Fidei
   Canvas — Texto curvado correto, tudo na orientação certa
   ================================================================ */

'use strict';

/* ================================================================
   1. PÁSCOA E DATAS
   ================================================================ */
function calcularPascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function somarDias(data, n) {
  const d = new Date(data);
  d.setDate(d.getDate() + n);
  return d;
}

function dataEntre(data, ini, fim) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const i = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
  const f = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  return d >= i && d <= f;
}

function primeiroDomingoAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const dw = natal.getDay();
  const ult = somarDias(natal, -(dw === 0 ? 7 : dw));
  return somarDias(ult, -21);
}

function batismoDoSenhor(ano) {
  const ep = new Date(ano, 0, 6);
  const dw = ep.getDay();
  return dw === 0 ? new Date(ano, 0, 13) : somarDias(ep, 7 - dw);
}

/* ================================================================
   2. TEMPO ATUAL
   ================================================================ */
function detectarTempoAtual() {
  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const pascoa      = calcularPascoa(ano);
  const cinzas      = somarDias(pascoa, -46);
  const quintaSanta = somarDias(pascoa, -3);
  const sabado      = somarDias(pascoa, -1);
  const pentec      = somarDias(pascoa, 49);
  const batismo     = batismoDoSenhor(ano);
  const advento     = primeiroDomingoAdvento(ano);
  const aventoAnt   = primeiroDomingoAdvento(ano - 1);

  if (dataEntre(hoje, new Date(ano-1,11,25), somarDias(batismo,-1))) return 'natal';
  if (dataEntre(hoje, batismo, somarDias(cinzas,-1)))                return 'tempoComum';
  if (dataEntre(hoje, cinzas, somarDias(quintaSanta,-1)))            return 'quaresma';
  if (dataEntre(hoje, quintaSanta, sabado))                          return 'triduo';
  if (dataEntre(hoje, pascoa, pentec))                               return 'pascoa';
  if (dataEntre(hoje, somarDias(pentec,1), somarDias(advento,-1)))   return 'tempoComum';
  if (dataEntre(hoje, advento, new Date(ano,11,24)))                 return 'advento';
  if (dataEntre(hoje, aventoAnt, new Date(ano-1,11,24)))             return 'advento';
  if (dataEntre(hoje, new Date(ano,11,25), new Date(ano,11,31)))     return 'natal';
  return 'tempoComum';
}

/* ================================================================
   3. DADOS DOS TEMPOS
   ================================================================ */
const TEMPOS = {
  advento: {
    nome: 'Advento', cor: '#5c2d91', corClara: '#7b52b0',
    corTexto: '#ffffff', corVeste: 'Roxo',
    descricao: 'O Advento é o tempo de preparação e esperança que abre o Ano Litúrgico. Durante quatro semanas, a Igreja nos convida à vigilância, à conversão do coração e à espera jubilosa da vinda do Senhor.',
    celebracoes: ['1ª Semana do Advento','2ª Semana do Advento','3ª Semana — Gaudete','4ª Semana do Advento']
  },
  natal: {
    nome: 'Natal', cor: '#b09060', corClara: '#cdb080',
    corTexto: '#2a1a00', corVeste: 'Branco',
    descricao: 'O Tempo do Natal celebra o mistério da Encarnação: o Verbo Eterno de Deus se fez carne e habitou entre nós. A liturgia contempla a humildade de Deus que nasce em Belém.',
    celebracoes: ['Natividade do Senhor','Sagrada Família','Santa Maria, Mãe de Deus','Epifania do Senhor','Batismo do Senhor']
  },
  tempoComum: {
    nome: 'Tempo Comum', cor: '#1a6b35', corClara: '#2d8a50',
    corTexto: '#ffffff', corVeste: 'Verde',
    descricao: 'O Tempo Comum representa o crescimento da Igreja no seguimento de Cristo. Durante as semanas distribuídas ao longo do ano, aprofundamos os mistérios da fé e crescemos na caridade.',
    celebracoes: ['1ª a 9ª semana (pré-Quaresma)','10ª a 34ª semana (pós-Pentecostes)','Santíssima Trindade','Corpus Christi','Cristo Rei do Universo']
  },
  quaresma: {
    nome: 'Quaresma', cor: '#5c2d91', corClara: '#7b52b0',
    corTexto: '#ffffff', corVeste: 'Roxo',
    descricao: 'A Quaresma é o tempo de penitência, oração e jejum que prepara o coração para a Páscoa. Quarenta dias caminhando com Cristo no deserto, purificando a alma.',
    celebracoes: ['4ª feira de Cinzas','1ª Semana','2ª Semana','3ª Semana','4ª Semana','5ª Semana','Domingo de Ramos']
  },
  triduo: {
    nome: 'Tríduo Pascal', cor: '#8b1a1a', corClara: '#b03030',
    corTexto: '#ffffff', corVeste: 'Vermelho / Branco',
    descricao: 'O Tríduo Pascal é o ápice de todo o Ano Litúrgico. Em três dias sagrados contemplamos o mistério central da fé: Paixão, Morte e Ressurreição de Nosso Senhor.',
    celebracoes: ['Quinta-feira Santa','Sexta-feira Santa','Sábado Santo — Vigília Pascal','Domingo de Páscoa']
  },
  pascoa: {
    nome: 'Tempo Pascal', cor: '#b8860b', corClara: '#d4a820',
    corTexto: '#1a0f00', corVeste: 'Branco / Dourado',
    descricao: 'O Tempo Pascal são cinquenta dias de alegria pela Ressurreição de Cristo. Do Domingo de Páscoa a Pentecostes, proclamamos que Cristo venceu a morte. Aleluia!',
    celebracoes: ['2ª a 6ª Semana de Páscoa','Ascensão do Senhor','Pentecostes','Santíssima Trindade','Corpus Christi']
  }
};

/* ================================================================
   4. SEGMENTOS
   Ângulo 0° = topo, sentido horário
   O Advento começa no topo (0°)
   ================================================================ */
const SEGMENTOS = [
  {
    tempoId: 'advento', angIni: 0, angFim: 52,
    fatias: [
      {nome:'1ª semana'},{nome:'2ª semana'},
      {nome:'3ª semana'},{nome:'4ª semana'}
    ]
  },
  {
    tempoId: 'natal', angIni: 52, angFim: 96,
    fatias: [
      {nome:'Natal'},{nome:'Sag. Família'},
      {nome:'Mãe de Deus'},{nome:'Epifania'},{nome:'Batismo'}
    ]
  },
  {
    tempoId: 'tempoComum', angIni: 96, angFim: 168,
    fatias: [
      {nome:'1ª'},{nome:'2ª'},{nome:'3ª'},
      {nome:'4ª'},{nome:'5ª'},{nome:'6ª'},
      {nome:'7ª'},{nome:'8ª'},{nome:'9ª'}
    ]
  },
  {
    tempoId: 'quaresma', angIni: 168, angFim: 232,
    fatias: [
      {nome:'Cinzas',peso:0.6},{nome:'1ª semana'},
      {nome:'2ª semana'},{nome:'3ª semana'},
      {nome:'4ª semana'},{nome:'5ª semana'},
      {nome:'Ramos',peso:0.6}
    ]
  },
  {
    tempoId: 'triduo', angIni: 232, angFim: 264,
    fatias: [
      {nome:'5ª Santa'},{nome:'6ª Santa'},
      {nome:'Vigília'},{nome:'Páscoa'}
    ]
  },
  {
    tempoId: 'pascoa', angIni: 264, angFim: 336,
    fatias: [
      {nome:'2ª sem.'},{nome:'3ª sem.'},{nome:'4ª sem.'},
      {nome:'5ª sem.'},{nome:'6ª sem.'},{nome:'Ascensão'},
      {nome:'Pentec.'},{nome:'Trindade'},{nome:'Corpus'}
    ]
  },
  {
    tempoId: 'tempoComum', angIni: 336, angFim: 360,
    fatias: [
      {nome:'33ª'},{nome:'Cristo Rei'}
    ]
  }
];

/* ================================================================
   5. MATEMÁTICA DO CANVAS
   ================================================================ */

// 0° = topo, sentido horário → rad
function toRad(deg) {
  return (deg - 90) * Math.PI / 180;
}

function pontoArco(cx, cy, r, deg) {
  const rad = toRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* ================================================================
   6. TEXTO CURVADO — LÓGICA CORRETA
   
   Regra:
   - Se o arco está na metade SUPERIOR (angMeio entre 270° e 360° 
     ou 0° e 90°), texto fica com a base voltada para fora 
     → rotação normal
   - Se o arco está na metade INFERIOR (angMeio entre 90° e 270°),
     texto fica com a base voltada para dentro (invertido) para 
     ser legível
   ================================================================ */
function textoArco(ctx, texto, cx, cy, raio, angIniDeg, angFimDeg,
                   fontSize, cor, fontWeight, fontFamily) {
  if (!texto || texto === '…') return;

  const angMeio = (angIniDeg + angFimDeg) / 2;

  // Normalizar angMeio para [0, 360)
  const angNorm = ((angMeio % 360) + 360) % 360;

  // Na metade superior (315° a 360° e 0° a 135°) → texto normal (base para fora)
  // Na metade inferior (135° a 315°) → texto invertido (base para dentro = legível)
  const invertido = angNorm > 135 && angNorm < 315;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Medir texto
  const largura = ctx.measureText(texto).width;
  // Ângulo em radianos que o texto ocupa no arco
  const angSpan = largura / raio;

  // Ângulo de início do desenho (centralizado no angMeio)
  const angMeioRad = toRad(angMeio);

  let angAtual;
  if (!invertido) {
    // Sentido horário: começa à esquerda do centro
    angAtual = angMeioRad - angSpan / 2;
  } else {
    // Invertido: começa à direita do centro (percorre no sentido anti-horário)
    angAtual = angMeioRad + angSpan / 2;
  }

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const w    = ctx.measureText(char).width;
    const half = w / raio / 2;

    if (!invertido) {
      angAtual += half;
    } else {
      angAtual -= half;
    }

    ctx.save();
    ctx.translate(
      cx + raio * Math.cos(angAtual),
      cy + raio * Math.sin(angAtual)
    );

    if (!invertido) {
      // Texto na parte superior: letra aponta para cima/fora
      ctx.rotate(angAtual + Math.PI / 2);
    } else {
      // Texto na parte inferior: letra aponta para baixo/fora (legível)
      ctx.rotate(angAtual - Math.PI / 2);
    }

    ctx.fillText(char, 0, 0);
    ctx.restore();

    if (!invertido) {
      angAtual += half;
    } else {
      angAtual -= half;
    }
  }

  ctx.restore();
}

/* ================================================================
   7. DESENHAR SETOR DE ANEL
   ================================================================ */
function setor(ctx, cx, cy, rExt, rInt, angIni, angFim) {
  const ai = toRad(angIni);
  const af = toRad(angFim);
  ctx.beginPath();
  ctx.arc(cx, cy, rExt, ai, af);
  ctx.arc(cx, cy, rInt, af, ai, true);
  ctx.closePath();
}

/* ================================================================
   8. BRILHO DE PROFUNDIDADE
   ================================================================ */
function brilhoSetor(ctx, cx, cy, rExt, rInt, angIni, angFim) {
  ctx.save();
  setor(ctx, cx, cy, rExt, rInt, angIni, angFim);
  ctx.clip();
  // Gradiente do centro para fora
  const angM  = toRad((angIni + angFim) / 2);
  const x0    = cx + rInt  * Math.cos(angM);
  const y0    = cy + rInt  * Math.sin(angM);
  const x1    = cx + rExt  * Math.cos(angM);
  const y1    = cy + rExt  * Math.sin(angM);
  const grad  = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0,   'rgba(255,255,255,0.00)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1,   'rgba(255,255,255,0.13)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

/* ================================================================
   9. RENDER PRINCIPAL
   ================================================================ */
function renderizar(canvas, tempoAtual, tam) {
  const DPR = window.devicePixelRatio || 1;
  canvas.width  = tam * DPR;
  canvas.height = tam * DPR;
  canvas.style.width  = tam + 'px';
  canvas.style.height = tam + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  const S  = tam;
  const cx = S / 2;
  const cy = S / 2;

  // ── Raios ────────────────────────────────────────────────────
  const R_OUT    = S * 0.488;  // borda externa total
  const R_EXT    = S * 0.456;  // anel externo das fatias
  const R_MID    = S * 0.364;  // divisória anel externo / interno
  const R_INT    = S * 0.226;  // borda interna
  const R_CEN    = S * 0.214;  // círculo central
  const GAP      = 0.9;        // gap em graus entre segmentos

  // ── FUNDO ────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur    = 36;
  ctx.shadowOffsetY = 12;
  const gFundo = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, R_OUT + 12);
  gFundo.addColorStop(0,   '#ffffff');
  gFundo.addColorStop(0.7, '#f8f4ec');
  gFundo.addColorStop(1,   '#ede6d6');
  ctx.fillStyle = gFundo;
  ctx.beginPath();
  ctx.arc(cx, cy, R_OUT + 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Anel decorativo externo
  ctx.save();
  ctx.strokeStyle = 'rgba(160,130,70,0.22)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R_OUT + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── SEGMENTOS ────────────────────────────────────────────────
  SEGMENTOS.forEach(seg => {
    const tempo   = TEMPOS[seg.tempoId];
    const isAtual = seg.tempoId === tempoAtual;
    const span    = seg.angFim - seg.angIni;

    // Pesos das fatias
    const fatias    = seg.fatias.map(f => ({...f, peso: f.peso || 1}));
    const pesoTotal = fatias.reduce((s, f) => s + f.peso, 0);

    // Halo dourado no tempo atual
    if (isAtual) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,210,0,0.5)';
      ctx.shadowBlur  = 28;
      setor(ctx, cx, cy, R_EXT + 16, R_INT - 10, seg.angIni, seg.angFim);
      ctx.fillStyle = tempo.cor + '25';
      ctx.fill();
      ctx.restore();
    }

    // ── ANEL EXTERNO: fatias ──────────────────────────────────
    let acum = seg.angIni;
    fatias.forEach((fatia, idx) => {
      const prop   = fatia.peso / pesoTotal;
      const fSpan  = span * prop;
      const fIni   = acum + (idx === 0 ? GAP : GAP * 0.5);
      const fFim   = acum + fSpan - (idx === fatias.length - 1 ? GAP : GAP * 0.5);
      acum += fSpan;

      if (fFim - fIni < 0.2) return;

      // Cor alternada
      const cor = idx % 2 === 0 ? tempo.cor : tempo.corClara;

      ctx.save();
      setor(ctx, cx, cy, R_EXT, R_MID, fIni, fFim);
      ctx.fillStyle   = cor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth   = 0.8;
      ctx.stroke();
      ctx.restore();

      brilhoSetor(ctx, cx, cy, R_EXT, R_MID, fIni, fFim);

      // Texto da fatia
      const fSpanReal = fFim - fIni;
      if (fSpanReal >= 5 && fatia.nome) {
        const rTxt = (R_EXT + R_MID) / 2;
        const fs   = Math.max(S * 0.016, 7);
        textoArco(ctx, fatia.nome, cx, cy, rTxt, fIni, fFim,
          fs, 'rgba(255,255,255,0.93)', '500', "'Inter',sans-serif");
      }
    });

    // ── ANEL INTERNO: nome do tempo ───────────────────────────
    const iIni = seg.angIni + GAP;
    const iFim = seg.angFim - GAP;
    if (iFim - iIni < 0.2) return;

    ctx.save();
    setor(ctx, cx, cy, R_MID, R_INT, iIni, iFim);
    ctx.fillStyle   = tempo.cor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    ctx.restore();

    brilhoSetor(ctx, cx, cy, R_MID, R_INT, iIni, iFim);

    // Bordas douradas no tempo atual
    if (isAtual) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 14;
      // Borda externa
      setor(ctx, cx, cy, R_EXT + 8, R_EXT, seg.angIni, seg.angFim);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      // Borda interna
      setor(ctx, cx, cy, R_INT, R_INT - 5, seg.angIni, seg.angFim);
      ctx.fill();
      ctx.restore();
    }

    // Nome do tempo
    const spanInt = iFim - iIni;
    if (spanInt >= 16) {
      const rNome = (R_MID + R_INT) / 2;
      const fsN   = Math.min(Math.max(S * 0.028, 10), 17);
      textoArco(ctx, tempo.nome, cx, cy, rNome, iIni, iFim,
        fsN, '#ffffff', '700', "'Libre Baskerville',serif");

      // "● TEMPO ATUAL"
      if (isAtual && spanInt >= 36) {
        const rBadge = rNome - S * 0.052;
        const fsB    = Math.max(S * 0.019, 8);
        textoArco(ctx, '● TEMPO ATUAL', cx, cy, rBadge, iIni, iFim,
          fsB, '#FFD700', '700', "'Inter',sans-serif");
      }
    }
  });

  // ── SEPARADORES ───────────────────────────────────────────────
  const angulos = new Set();
  SEGMENTOS.forEach(s => { angulos.add(s.angIni); angulos.add(s.angFim); });
  angulos.forEach(deg => {
    const rad = toRad(deg);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + (R_INT - 6) * Math.cos(rad), cy + (R_INT - 6) * Math.sin(rad));
    ctx.lineTo(cx + (R_EXT + 8) * Math.cos(rad), cy + (R_EXT + 8) * Math.sin(rad));
    ctx.stroke();
    ctx.restore();
  });

  // ── ANÉIS DECORATIVOS ─────────────────────────────────────────
  // Divisória
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_MID, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Anel dourado interno
  ctx.save();
  ctx.shadowColor = 'rgba(200,160,40,0.5)';
  ctx.shadowBlur  = 8;
  const gAnel = ctx.createLinearGradient(cx - R_INT, cy, cx + R_INT, cy);
  gAnel.addColorStop(0,   '#f0c840');
  gAnel.addColorStop(0.5, '#c88010');
  gAnel.addColorStop(1,   '#f0c840');
  ctx.strokeStyle = gAnel;
  ctx.lineWidth   = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_INT, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── CENTRO ───────────────────────────────────────────────────
  // Sombra
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CEN, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0a02';
  ctx.fill();
  ctx.restore();

  // Gradiente dourado
  const gCen = ctx.createRadialGradient(
    cx - R_CEN * 0.32, cy - R_CEN * 0.28, 0,
    cx, cy, R_CEN
  );
  gCen.addColorStop(0,    '#d4a030');
  gCen.addColorStop(0.38, '#9a6018');
  gCen.addColorStop(0.72, '#6a3c0a');
  gCen.addColorStop(1,    '#3a1e04');
  ctx.fillStyle = gCen;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CEN, 0, Math.PI * 2);
  ctx.fill();

  // Anel dourado centro
  ctx.save();
  ctx.shadowColor = 'rgba(240,192,60,0.55)';
  ctx.shadowBlur  = 10;
  const gAnelCen = ctx.createLinearGradient(cx - R_CEN, cy, cx + R_CEN, cy);
  gAnelCen.addColorStop(0,   '#f0c840');
  gAnelCen.addColorStop(0.5, '#c88010');
  gAnelCen.addColorStop(1,   '#f0c840');
  ctx.strokeStyle = gAnelCen;
  ctx.lineWidth   = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CEN, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Anel interno decorativo
  ctx.save();
  ctx.strokeStyle = 'rgba(240,200,80,0.26)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CEN - 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── CRUZ ─────────────────────────────────────────────────────
  const cH  = R_CEN * 1.38;    // altura total da cruz
  const cL  = cH / 2;          // metade
  const cW  = S * 0.030;       // espessura
  const cAW = R_CEN * 1.18;    // largura do braço horizontal
  const cAH = S * 0.030;       // altura do braço horizontal
  const cAY = cy - R_CEN * 0.08; // posição Y do braço horizontal

  // Sombra da cruz
  ctx.save();
  ctx.fillStyle   = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.roundRect(cx - cW/2 + 3, cy - cL + 5, cW, cH, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx - cAW/2 + 3, cAY - cAH/2 + 5, cAW, cAH, 4);
  ctx.fill();
  ctx.restore();

  // Cruz dourada
  ctx.save();
  ctx.shadowColor = 'rgba(255,220,100,0.4)';
  ctx.shadowBlur  = 16;
  ctx.fillStyle   = 'rgba(255,232,148,0.97)';
  // Vertical
  ctx.beginPath();
  ctx.roundRect(cx - cW/2, cy - cL, cW, cH, 4);
  ctx.fill();
  // Horizontal
  ctx.beginPath();
  ctx.roundRect(cx - cAW/2, cAY - cAH/2, cAW, cAH, 4);
  ctx.fill();
  ctx.restore();

  // Brilho na cruz
  ctx.save();
  ctx.fillStyle   = 'rgba(255,255,220,0.30)';
  ctx.beginPath();
  ctx.roundRect(cx - cW/2 + 3, cy - cL + 6, cW * 0.35, cH - 12, 2);
  ctx.fill();
  ctx.restore();

  // ── ALFA E ÔMEGA ─────────────────────────────────────────────
  const szG = S * 0.070;
  const yG  = cy + R_CEN * 0.26;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetY = 2;
  ctx.font          = `700 ${szG}px 'Libre Baskerville',serif`;
  ctx.fillStyle     = 'rgba(255,240,172,0.97)';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';
  ctx.fillText('Α', cx - R_CEN * 0.42, yG);
  ctx.fillText('Ω', cx + R_CEN * 0.42, yG);
  ctx.restore();

  // ── SETA INÍCIO DO ANO ────────────────────────────────────────
  // Pequena seta apontando para cima no ângulo 0° (topo)
  const sy = cy - R_OUT - 6;

  ctx.save();
  ctx.fillStyle   = '#8b6f3d';
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.moveTo(cx, sy - 6);
  ctx.lineTo(cx - 7, sy + 8);
  ctx.lineTo(cx + 7, sy + 8);
  ctx.closePath();
  ctx.fill();

  ctx.font          = `600 ${S * 0.021}px 'Inter',sans-serif`;
  ctx.fillStyle     = '#7a5f2a';
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'bottom';
  ctx.globalAlpha   = 0.70;
  ctx.fillText('início do ano litúrgico', cx, sy - 10);
  ctx.restore();
}

/* ================================================================
   10. CRIAR CANVAS
   ================================================================ */
function criarCanvas(id, tam) {
  let c = document.getElementById(id);
  if (!c) { c = document.createElement('canvas'); c.id = id; }
  renderizar(c, detectarTempoAtual(), tam);
  return c;
}

/* ================================================================
   11. MINI CALENDÁRIO
   ================================================================ */
function gerarMiniCalendario() {
  const ta  = detectarTempoAtual();
  const t   = TEMPOS[ta];
  const el  = document.getElementById('mini-calendario-container');
  if (!el) return;

  el.innerHTML = `
    <div class="mini-cal-card" onclick="abrirModalCalendario()"
      role="button" tabindex="0" aria-label="Ver calendário litúrgico completo">
      <div class="mini-cal-topo">
        <div class="mini-cal-linha"></div>
        <span class="mini-cal-label">Calendário Litúrgico</span>
        <div class="mini-cal-linha"></div>
      </div>
      <div class="mini-cal-ring" id="mini-ring-wrap"></div>
      <div class="mini-cal-tempo-row">
        <span class="mini-dot" style="background:${t.cor}"></span>
        <span class="mini-tempo-txt">${t.nome}</span>
      </div>
      <div class="mini-cal-veste" style="color:${t.cor}">${t.corVeste}</div>
      <div class="mini-cal-cta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        Ver calendário completo
      </div>
    </div>`;

  document.getElementById('mini-ring-wrap')
    .appendChild(criarCanvas('canvas-mini', 190));

  el.querySelector('.mini-cal-card').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      abrirModalCalendario();
    }
  });
}

/* ================================================================
   12. MODAL
   ================================================================ */
function abrirModalCalendario() {
  const ta = detectarTempoAtual();
  const t  = TEMPOS[ta];

  // Canvas modal
  const wrap = document.getElementById('modal-cal-svg');
  wrap.innerHTML = '';
  wrap.appendChild(criarCanvas('canvas-modal', 520));

  // Info
  document.getElementById('modal-cal-info').innerHTML = `
    <div class="mci-topo">
      <div class="mci-barra" style="background:linear-gradient(180deg,${t.cor},${t.corClara})"></div>
      <div>
        <p class="mci-rotulo">Tempo Litúrgico Atual</p>
        <h3 class="mci-titulo" style="color:${t.cor}">${t.nome}</h3>
      </div>
    </div>
    <div class="mci-veste-box">
      <span class="mci-veste-label">Cor Litúrgica</span>
      <div class="mci-veste-val">
        <span class="mci-bolinha" style="background:${t.cor}"></span>
        <strong style="color:${t.cor}">${t.corVeste}</strong>
      </div>
    </div>
    <p class="mci-desc">${t.descricao}</p>
    <div class="mci-celebracoes">
      <p class="mci-celeb-titulo">Celebrações deste tempo</p>
      ${t.celebracoes.map(c => `
        <div class="mci-celeb-item">
          <span class="mci-celeb-dot" style="background:${t.cor}"></span>
          <span>${c}</span>
        </div>`).join('')}
    </div>
    <a href="../estudos/estudos.html" class="mci-btn">
      Aprofundar sobre o ${t.nome}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>`;

  // Legenda
  const ordem = ['advento','natal','tempoComum','quaresma','triduo','pascoa'];
  document.getElementById('modal-cal-legenda').innerHTML = ordem.map(id => {
    const tm = TEMPOS[id];
    const ia = id === ta;
    return `<div class="leg-pill ${ia ? 'leg-ativa' : ''}">
      <span class="leg-dot" style="background:${tm.cor}"></span>
      <span>${tm.nome}</span>
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
   13. INIT
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
