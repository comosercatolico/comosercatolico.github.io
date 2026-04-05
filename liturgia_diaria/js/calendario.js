/* ================================================================
   CALENDÁRIO LITÚRGICO PROFISSIONAL - Lux Fidei
   Renderização via HTML5 Canvas — precisão total
   ================================================================ */

'use strict';

/* ================================================================
   1. CÁLCULO DA PÁSCOA
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
  const diaNatal = natal.getDay();
  const diasAteUltimoDomingo = diaNatal === 0 ? 7 : diaNatal;
  const ultimoDomingoAntes = somarDias(natal, -diasAteUltimoDomingo);
  return somarDias(ultimoDomingoAntes, -21);
}

function batismoDoSenhor(ano) {
  const epifania = new Date(ano, 0, 6);
  const dia = epifania.getDay();
  if (dia === 0) return new Date(ano, 0, 13);
  return somarDias(epifania, 7 - dia);
}

/* ================================================================
   2. DETECTAR TEMPO ATUAL
   ================================================================ */
function detectarTempoAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  const pascoa       = calcularPascoa(ano);
  const quartaCinzas = somarDias(pascoa, -46);
  const quintaSanta  = somarDias(pascoa, -3);
  const sabadoSanto  = somarDias(pascoa, -1);
  const pentecostes  = somarDias(pascoa, 49);
  const batismo      = batismoDoSenhor(ano);
  const advento      = primeiroDomingoAdvento(ano);
  const aventoAnt    = primeiroDomingoAdvento(ano - 1);

  if (dataEntre(hoje, new Date(ano - 1, 11, 25), somarDias(batismo, -1))) return 'natal';
  if (dataEntre(hoje, batismo, somarDias(quartaCinzas, -1)))               return 'tempoComum';
  if (dataEntre(hoje, quartaCinzas, somarDias(quintaSanta, -1)))           return 'quaresma';
  if (dataEntre(hoje, quintaSanta, sabadoSanto))                           return 'triduo';
  if (dataEntre(hoje, pascoa, pentecostes))                                return 'pascoa';
  if (dataEntre(hoje, somarDias(pentecostes, 1), somarDias(advento, -1))) return 'tempoComum';
  if (dataEntre(hoje, advento, new Date(ano, 11, 24)))                     return 'advento';
  if (dataEntre(hoje, aventoAnt, new Date(ano - 1, 11, 24)))               return 'advento';
  if (dataEntre(hoje, new Date(ano, 11, 25), new Date(ano, 11, 31)))       return 'natal';
  return 'tempoComum';
}

/* ================================================================
   3. DADOS DOS TEMPOS LITÚRGICOS
   ================================================================ */
const TEMPOS = {
  advento: {
    id: 'advento',
    nome: 'Advento',
    cor: '#5c2d91',
    corClara: '#7b52b0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'O Advento é o tempo de preparação e esperança que abre o Ano Litúrgico. Durante quatro semanas, a Igreja nos convida à vigilância, à conversão do coração e à espera jubilosa da vinda do Senhor.',
    celebracoes: [
      '1ª Semana do Advento',
      '2ª Semana do Advento',
      '3ª Semana — Gaudete',
      '4ª Semana do Advento',
    ]
  },
  natal: {
    id: 'natal',
    nome: 'Natal',
    cor: '#b8976a',
    corClara: '#d4b88a',
    corTexto: '#2a1a00',
    corVeste: 'Branco',
    descricao: 'O Tempo do Natal celebra o mistério da Encarnação: o Verbo Eterno de Deus se fez carne e habitou entre nós. A liturgia contempla a humildade de Deus que nasce em Belém.',
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
    corClara: '#2d8a50',
    corTexto: '#ffffff',
    corVeste: 'Verde',
    descricao: 'O Tempo Comum representa o crescimento da Igreja no seguimento de Cristo. Durante as semanas distribuídas ao longo do ano, aprofundamos os mistérios da fé e crescemos na caridade.',
    celebracoes: [
      '1ª a 9ª semana (pré-Quaresma)',
      '10ª a 34ª semana (pós-Pentecostes)',
      'Santíssima Trindade',
      'Corpus Christi',
      'Sagrado Coração de Jesus',
      'Cristo Rei do Universo',
    ]
  },
  quaresma: {
    id: 'quaresma',
    nome: 'Quaresma',
    cor: '#5c2d91',
    corClara: '#7b52b0',
    corTexto: '#ffffff',
    corVeste: 'Roxo',
    descricao: 'A Quaresma é o tempo de penitência, oração e jejum que prepara o coração para a Páscoa. Quarenta dias caminhando com Cristo no deserto, purificando a alma pela conversão sincera.',
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
    corClara: '#b03030',
    corTexto: '#ffffff',
    corVeste: 'Vermelho / Branco',
    descricao: 'O Tríduo Pascal é o ápice de todo o Ano Litúrgico. Em três dias sagrados contemplamos o mistério central da fé: a Paixão, Morte e Ressurreição de Nosso Senhor Jesus Cristo.',
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
    corClara: '#d4a820',
    corTexto: '#1a0f00',
    corVeste: 'Branco / Dourado',
    descricao: 'O Tempo Pascal são cinquenta dias de alegria pela Ressurreição de Cristo. Do Domingo de Páscoa a Pentecostes, proclamamos que Cristo venceu a morte e nos abriu as portas da vida eterna. Aleluia!',
    celebracoes: [
      '2ª a 6ª Semana de Páscoa',
      'Ascensão do Senhor',
      'Pentecostes',
      'Santíssima Trindade',
      'Corpus Christi',
    ]
  }
};

/* ================================================================
   4. SEGMENTOS DO CALENDÁRIO
   Ângulos: 0° = topo, sentido horário
   ================================================================ */
const SEGMENTOS = [
  {
    tempoId: 'advento',
    angIni: 0, angFim: 52,
    fatias: [
      { nome: '1ª semana' },
      { nome: '2ª semana' },
      { nome: '3ª semana' },
      { nome: '4ª semana' },
    ]
  },
  {
    tempoId: 'natal',
    angIni: 52, angFim: 96,
    fatias: [
      { nome: 'Natal' },
      { nome: 'Sag. Família' },
      { nome: 'Mãe de Deus' },
      { nome: 'Epifania' },
      { nome: 'Batismo' },
    ]
  },
  {
    tempoId: 'tempoComum',
    angIni: 96, angFim: 168,
    fatias: [
      { nome: '1ª' }, { nome: '2ª' }, { nome: '3ª' },
      { nome: '4ª' }, { nome: '5ª' }, { nome: '6ª' },
      { nome: '7ª' }, { nome: '8ª' }, { nome: '9ª' },
    ]
  },
  {
    tempoId: 'quaresma',
    angIni: 168, angFim: 232,
    fatias: [
      { nome: 'Cinzas', peso: 0.6 },
      { nome: '1ª semana' },
      { nome: '2ª semana' },
      { nome: '3ª semana' },
      { nome: '4ª semana' },
      { nome: '5ª semana' },
      { nome: 'Ramos', peso: 0.6 },
    ]
  },
  {
    tempoId: 'triduo',
    angIni: 232, angFim: 264,
    fatias: [
      { nome: '5ª Santa' },
      { nome: '6ª Santa' },
      { nome: 'Vigília' },
      { nome: 'Páscoa' },
    ]
  },
  {
    tempoId: 'pascoa',
    angIni: 264, angFim: 336,
    fatias: [
      { nome: '2ª sem.' }, { nome: '3ª sem.' },
      { nome: '4ª sem.' }, { nome: '5ª sem.' },
      { nome: '6ª sem.' }, { nome: 'Ascensão' },
      { nome: 'Pentec.' }, { nome: 'Trindade' },
      { nome: 'Corpus'  },
    ]
  },
  {
    tempoId: 'tempoComum',
    angIni: 336, angFim: 360,
    fatias: [
      { nome: '…' },
      { nome: '33ª' },
      { nome: 'Cristo Rei' },
    ]
  }
];

/* ================================================================
   5. UTILITÁRIOS CANVAS
   ================================================================ */

// Converter graus para radianos com offset de -90° (topo = 0°)
function toRad(graus) {
  return (graus - 90) * Math.PI / 180;
}

// Desenhar setor de anel (donut slice)
function desenharSetor(ctx, cx, cy, rExt, rInt, angIni, angFim) {
  const ai = toRad(angIni);
  const af = toRad(angFim);
  ctx.beginPath();
  ctx.arc(cx, cy, rExt, ai, af);
  ctx.arc(cx, cy, rInt, af, ai, true);
  ctx.closePath();
}

// Escrever texto curvado ao longo de um arco
function textoArco(ctx, texto, cx, cy, raio, angIni, angFim, fontSize, cor, fontWeight, fontFamily) {
  const angMeio = (angIni + angFim) / 2;
  const totalChars = texto.length;

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Medir largura total do texto
  const larguraTotal = ctx.measureText(texto).width;
  // Ângulo que o texto ocupa no arco
  const angTextoTotal = larguraTotal / raio; // em radianos

  // Decidir se inverte (texto na metade de baixo)
  const angMeioRad = toRad(angMeio);
  // Normalizar para [0, 2PI]
  const angNorm = ((angMeioRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const invertido = angNorm > Math.PI;

  // Ângulo de início do texto (centralizado)
  let angAtual;
  if (!invertido) {
    angAtual = toRad(angMeio) - angTextoTotal / 2;
  } else {
    angAtual = toRad(angMeio) + angTextoTotal / 2;
  }

  for (let i = 0; i < totalChars; i++) {
    const char = texto[i];
    const larguraChar = ctx.measureText(char).width;
    const meioDaLetra = larguraChar / 2;
    const angLetra = meioDaLetra / raio;

    if (!invertido) {
      angAtual += angLetra;
    } else {
      angAtual -= angLetra;
    }

    ctx.save();
    ctx.translate(
      cx + raio * Math.cos(angAtual),
      cy + raio * Math.sin(angAtual)
    );

    if (!invertido) {
      ctx.rotate(angAtual + Math.PI / 2);
    } else {
      ctx.rotate(angAtual - Math.PI / 2);
    }

    ctx.fillText(char, 0, 0);
    ctx.restore();

    if (!invertido) {
      angAtual += angLetra;
    } else {
      angAtual -= angLetra;
    }
  }

  ctx.restore();
}

// Criar gradiente radial
function gradienteRadial(ctx, cx, cy, r0, r1, cor1, cor2) {
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  g.addColorStop(0, cor1);
  g.addColorStop(1, cor2);
  return g;
}

// Criar gradiente cônico simulado (overlay de brilho)
function aplicarBrilhoSetor(ctx, cx, cy, rExt, rInt, angIni, angFim) {
  ctx.save();
  desenharSetor(ctx, cx, cy, rExt, rInt, angIni, angFim);
  ctx.clip();
  const grad = ctx.createLinearGradient(
    cx + rInt * Math.cos(toRad((angIni + angFim) / 2)),
    cy + rInt * Math.sin(toRad((angIni + angFim) / 2)),
    cx + rExt * Math.cos(toRad((angIni + angFim) / 2)),
    cy + rExt * Math.sin(toRad((angIni + angFim) / 2))
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.00)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(255,255,255,0.14)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

/* ================================================================
   6. RENDERIZAR CALENDÁRIO NO CANVAS
   ================================================================ */
function renderizarCalendario(canvas, tempoAtual, tamanho) {
  canvas.width  = tamanho;
  canvas.height = tamanho;

  const ctx = canvas.getContext('2d');
  const cx  = tamanho / 2;
  const cy  = tamanho / 2;
  const DPR = window.devicePixelRatio || 1;

  // Para telas retina
  canvas.width  = tamanho * DPR;
  canvas.height = tamanho * DPR;
  canvas.style.width  = tamanho + 'px';
  canvas.style.height = tamanho + 'px';
  ctx.scale(DPR, DPR);

  const S = tamanho;

  // ── Raios ────────────────────────────────────────────────────
  const R_BORDA   = S * 0.488;  // borda externa total
  const R_EXT     = S * 0.458;  // anel externo (fatias)
  const R_DIV     = S * 0.368;  // divisória entre anel externo e interno
  const R_INT     = S * 0.228;  // borda interna
  const R_CENTRO  = S * 0.216;  // círculo central

  const GAP = 0.8; // graus de espaço entre segmentos

  // ── FUNDO CIRCULAR ───────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur    = 32;
  ctx.shadowOffsetY = 10;
  const gFundo = gradienteRadial(ctx, cx, cy * 0.85, 0, R_BORDA + 10, '#ffffff', '#f0ebe0');
  ctx.fillStyle = gFundo;
  ctx.beginPath();
  ctx.arc(cx, cy, R_BORDA + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Anel borda externo decorativo
  ctx.save();
  ctx.strokeStyle = 'rgba(160,130,70,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R_BORDA + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── RENDERIZAR CADA SEGMENTO ─────────────────────────────────
  SEGMENTOS.forEach((seg, segIdx) => {
    const tempo   = TEMPOS[seg.tempoId];
    const isAtual = seg.tempoId === tempoAtual;
    const spanSeg = seg.angFim - seg.angIni;
    const angMeio = (seg.angIni + seg.angFim) / 2;

    // Calcular pesos das fatias
    const fatias = seg.fatias.map(f => ({ ...f, peso: f.peso || 1 }));
    const pesoTotal = fatias.reduce((s, f) => s + f.peso, 0);

    // ── HALO DOURADO (tempo atual) ──
    if (isAtual) {
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur  = 22;
      desenharSetor(ctx, cx, cy, R_EXT + 14, R_INT - 8, seg.angIni, seg.angFim);
      ctx.fillStyle = tempo.cor + '30';
      ctx.fill();
      ctx.restore();
    }

    // ══════════════════════════════════
    // ANEL EXTERNO — Fatias individuais
    // ══════════════════════════════════
    let angAcum = seg.angIni;

    fatias.forEach((fatia, fIdx) => {
      const proporcao = fatia.peso / pesoTotal;
      const fSpan     = spanSeg * proporcao;
      const fAngIni   = angAcum + (fIdx === 0 ? GAP : GAP * 0.5);
      const fAngFim   = angAcum + fSpan - (fIdx === fatias.length - 1 ? GAP : GAP * 0.5);
      angAcum        += fSpan;

      if (fAngFim <= fAngIni + 0.1) return;

      // Alternar tonalidade
      const corFatia = fIdx % 2 === 0 ? tempo.cor : tempo.corClara;

      // Fatia
      ctx.save();
      desenharSetor(ctx, cx, cy, R_EXT, R_DIV, fAngIni, fAngFim);
      ctx.fillStyle = corFatia;
      ctx.fill();

      // Borda branca entre fatias
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      // Brilho de profundidade
      aplicarBrilhoSetor(ctx, cx, cy, R_EXT, R_DIV, fAngIni, fAngFim);

      // Texto da fatia
      const fSpanReal = fAngFim - fAngIni;
      if (fSpanReal >= 5.5 && fatia.nome && fatia.nome !== '…') {
        const rTextoFatia = (R_EXT + R_DIV) / 2;
        const fs = Math.max(S * 0.017, 7.5);
        textoArco(ctx, fatia.nome, cx, cy, rTextoFatia, fAngIni, fAngFim,
          fs, 'rgba(255,255,255,0.92)', '500', "'Inter', sans-serif");
      }
    });

    // ══════════════════════════════════
    // ANEL INTERNO — Nome do tempo
    // ══════════════════════════════════
    const iAngIni = seg.angIni + GAP;
    const iAngFim = seg.angFim - GAP;

    if (iAngFim > iAngIni + 0.1) {
      // Fatia interna
      ctx.save();
      desenharSetor(ctx, cx, cy, R_DIV, R_INT, iAngIni, iAngFim);
      ctx.fillStyle = tempo.cor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();

      // Brilho
      aplicarBrilhoSetor(ctx, cx, cy, R_DIV, R_INT, iAngIni, iAngFim);

      // Borda dourada no tempo atual
      if (isAtual) {
        // Borda externa dourada
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur  = 12;
        desenharSetor(ctx, cx, cy, R_EXT + 7, R_EXT, seg.angIni, seg.angFim);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();

        // Borda interna dourada
        ctx.save();
        desenharSetor(ctx, cx, cy, R_INT, R_INT - 5, seg.angIni, seg.angFim);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      }

      // Nome do tempo (texto curvado)
      const spanInterno = iAngFim - iAngIni;
      if (spanInterno >= 18) {
        const rTextoInt = (R_DIV + R_INT) / 2 + S * 0.005;
        const fsNome    = Math.min(Math.max(S * 0.028, 10), 17);
        const corNome   = isAtual ? '#ffffff' : tempo.corTexto;
        textoArco(ctx, tempo.nome, cx, cy, rTextoInt, iAngIni, iAngFim,
          fsNome, corNome, '700', "'Libre Baskerville', serif");

        // "● AGORA" abaixo do nome
        if (isAtual && spanInterno >= 38) {
          const rBadge = rTextoInt - S * 0.050;
          const fsBadge = Math.max(S * 0.019, 8);
          textoArco(ctx, '● TEMPO ATUAL', cx, cy, rBadge, iAngIni, iAngFim,
            fsBadge, '#FFD700', '700', "'Inter', sans-serif");
        }
      }
    }
  });

  // ── SEPARADORES ───────────────────────────────────────────────
  const angulos = new Set();
  SEGMENTOS.forEach(s => { angulos.add(s.angIni); angulos.add(s.angFim); });

  angulos.forEach(ang => {
    const rad = toRad(ang);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + (R_INT - 5) * Math.cos(rad), cy + (R_INT - 5) * Math.sin(rad));
    ctx.lineTo(cx + (R_EXT + 7) * Math.cos(rad), cy + (R_EXT + 7) * Math.sin(rad));
    ctx.stroke();
    ctx.restore();
  });

  // ── ANÉIS DECORATIVOS ─────────────────────────────────────────
  // Divisória externa/interna
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_DIV, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Anel dourado interno
  ctx.save();
  ctx.shadowColor = 'rgba(200,160,40,0.4)';
  ctx.shadowBlur  = 6;
  const gAnel = ctx.createLinearGradient(cx - R_INT, cy, cx + R_INT, cy);
  gAnel.addColorStop(0,   '#f0c040');
  gAnel.addColorStop(0.5, '#c8860c');
  gAnel.addColorStop(1,   '#f0c040');
  ctx.strokeStyle = gAnel;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R_INT, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── CÍRCULO CENTRAL ───────────────────────────────────────────
  // Sombra
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur    = 24;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle     = '#1a0a02';
  ctx.beginPath();
  ctx.arc(cx, cy, R_CENTRO, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Gradiente dourado
  const gCentro = ctx.createRadialGradient(
    cx - R_CENTRO * 0.3, cy - R_CENTRO * 0.3, 0,
    cx, cy, R_CENTRO
  );
  gCentro.addColorStop(0,    '#d4a030');
  gCentro.addColorStop(0.4,  '#9a6018');
  gCentro.addColorStop(0.75, '#6a3c0a');
  gCentro.addColorStop(1,    '#3a1e04');
  ctx.fillStyle = gCentro;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CENTRO, 0, Math.PI * 2);
  ctx.fill();

  // Anel externo dourado do centro
  ctx.save();
  ctx.shadowColor = 'rgba(240,192,60,0.5)';
  ctx.shadowBlur  = 8;
  const gAnelCentro = ctx.createLinearGradient(cx - R_CENTRO, cy, cx + R_CENTRO, cy);
  gAnelCentro.addColorStop(0,   '#f0c840');
  gAnelCentro.addColorStop(0.5, '#c88010');
  gAnelCentro.addColorStop(1,   '#f0c840');
  ctx.strokeStyle = gAnelCentro;
  ctx.lineWidth   = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CENTRO, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Anel interno decorativo do centro
  ctx.save();
  ctx.strokeStyle = 'rgba(240,200,80,0.28)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R_CENTRO - 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── CRUZ ──────────────────────────────────────────────────────
  const cL  = R_CENTRO * 0.70;   // metade do comprimento vertical
  const cB  = R_CENTRO * 0.60;   // metade do comprimento horizontal
  const cW  = S * 0.030;         // espessura
  const cOY = -R_CENTRO * 0.06;  // offset vertical do braço horizontal

  function desenharCruz(ox, oy, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = alpha < 1 ? '#000000' : 'rgba(255,230,140,0.97)';

    // Braço vertical
    ctx.beginPath();
    ctx.roundRect(ox + cx - cW / 2, oy + cy - cL, cW, cL * 2, 4);
    ctx.fill();

    // Braço horizontal
    ctx.beginPath();
    ctx.roundRect(ox + cx - cB, oy + cy + cOY - cW / 2, cB * 2, cW, 4);
    ctx.fill();

    ctx.restore();
  }

  // Sombra da cruz
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0)';
  ctx.shadowBlur    = 0;
  desenharCruz(3, 5, 0.30);
  ctx.restore();

  // Cruz principal com brilho
  ctx.save();
  ctx.shadowColor = 'rgba(255,220,100,0.35)';
  ctx.shadowBlur  = 12;
  desenharCruz(0, 0, 1);
  ctx.restore();

  // Destaque brilhante na cruz
  ctx.save();
  ctx.fillStyle   = 'rgba(255,255,220,0.28)';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.roundRect(cx - cW / 2 + 2, cy - cL + 4, cW * 0.38, cL * 2 - 8, 2);
  ctx.fill();
  ctx.restore();

  // ── ALFA E ÔMEGA ──────────────────────────────────────────────
  const szGrk  = S * 0.072;
  const yGrk   = cy + R_CENTRO * 0.28;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur  = 6;
  ctx.shadowOffsetY = 2;
  ctx.font        = `700 ${szGrk}px 'Libre Baskerville', serif`;
  ctx.fillStyle   = 'rgba(255,240,170,0.96)';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Α', cx - R_CENTRO * 0.43, yGrk);
  ctx.fillText('Ω', cx + R_CENTRO * 0.43, yGrk);
  ctx.restore();

  // ── SETA E LABEL "início do ano litúrgico" ────────────────────
  const setaY = cy - R_BORDA - 14;

  // Seta
  ctx.save();
  ctx.fillStyle   = '#8b6f3d';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx, setaY - 4);
  ctx.lineTo(cx - 6, setaY + 8);
  ctx.lineTo(cx + 6, setaY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Texto
  ctx.save();
  ctx.font        = `600 ${S * 0.022}px 'Inter', sans-serif`;
  ctx.fillStyle   = '#8b6f3d';
  ctx.globalAlpha = 0.72;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('início do ano litúrgico', cx, setaY - 8);
  ctx.restore();
}

/* ================================================================
   7. CRIAR/ATUALIZAR CANVAS
   ================================================================ */
function criarCanvas(id, tamanho) {
  let canvas = document.getElementById(id);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = id;
  }
  renderizarCalendario(canvas, detectarTempoAtual(), tamanho);
  return canvas;
}

/* ================================================================
   8. MINI CALENDÁRIO
   ================================================================ */
function gerarMiniCalendario() {
  const tempoAtual = detectarTempoAtual();
  const tempo      = TEMPOS[tempoAtual];
  const container  = document.getElementById('mini-calendario-container');
  if (!container) return;

  container.innerHTML = `
    <div class="mini-cal-card"
      role="button" tabindex="0"
      aria-label="Abrir calendário litúrgico completo"
      onclick="abrirModalCalendario()">

      <div class="mini-cal-topo">
        <div class="mini-cal-linha"></div>
        <span class="mini-cal-label">Calendário Litúrgico</span>
        <div class="mini-cal-linha"></div>
      </div>

      <div class="mini-cal-ring" id="mini-cal-ring-wrap"></div>

      <div class="mini-cal-tempo-row">
        <span class="mini-dot" style="background:${tempo.cor}"></span>
        <span class="mini-tempo-txt">${tempo.nome}</span>
      </div>

      <div class="mini-cal-veste" style="color:${tempo.cor}">${tempo.corVeste}</div>

      <div class="mini-cal-cta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        Ver calendário completo
      </div>
    </div>`;

  // Inserir canvas no wrapper
  const wrap   = document.getElementById('mini-cal-ring-wrap');
  const canvas = criarCanvas('canvas-mini-cal', 190);
  wrap.appendChild(canvas);

  // Teclado
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

  // Canvas grande no modal
  const svgWrap = document.getElementById('modal-cal-svg');
  svgWrap.innerHTML = '';
  const canvasModal = criarCanvas('canvas-modal-cal', 520);
  svgWrap.appendChild(canvasModal);

  // Painel de informações
  document.getElementById('modal-cal-info').innerHTML = `
    <div class="mci-topo">
      <div class="mci-barra"
        style="background:linear-gradient(180deg,${tempo.cor},${tempo.corClara})">
      </div>
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
  const ordemTempos = ['advento','natal','tempoComum','quaresma','triduo','pascoa'];
  document.getElementById('modal-cal-legenda').innerHTML = ordemTempos.map(id => {
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
