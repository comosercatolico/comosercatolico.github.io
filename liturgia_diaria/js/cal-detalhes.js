/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 2
   Textos, datas, separadores, centro
   ================================================ */

/* ════════════════════════════════════════════════
   ANEL DE DATAS
════════════════════════════════════════════════ */

function desenharDatas(ctx, cx, cy, R, ini, total, tam) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rO   = R * CAL.r.externo;
  const rD   = R * CAL.r.datas;
  const rMid = (rO + rD) / 2;

  // ── Faixa de fundo fosca ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, 2 * Math.PI);
  ctx.arc(cx, cy, rD, 0, 2 * Math.PI, true);

  const gFaixa = ctx.createRadialGradient(cx, cy, rD, cx, cy, rO);
  gFaixa.addColorStop(0, "rgba(0,0,0,0.55)");
  gFaixa.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = gFaixa;
  ctx.fill();
  ctx.restore();

  // ── Linha separadora interna ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rD, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();

  // ── Datas ──
  for (let i = 0; i < total; i++) {
    const angFatia = sToAng(i, total);
    const angProx  = sToAng(i + 1, total);
    const aMid     = (angFatia + angProx) / 2;

    const d = new Date(ini);
    d.setDate(ini.getDate() + i * 7);

    const label = `${d.getDate()}/${d.getMonth() + 1}`;

    ctx.save();
    ctx.translate(cx + rMid * Math.cos(aMid), cy + rMid * Math.sin(aMid));
    ctx.rotate(aMid + Math.PI / 2);

    ctx.fillStyle    = "rgba(255,245,225,0.72)";
    ctx.font         = CAL.font.data(tam);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

/* ════════════════════════════════════════════════
   NOMES DAS SEMANAS
════════════════════════════════════════════════ */

function desenharNomesSemanas(ctx, cx, cy, R, segs, total, tam) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rD   = R * CAL.r.datas;
  const rS   = R * CAL.r.semanas;
  const rMid = (rD + rS) / 2;

  segs.forEach((seg) => {
    if (!seg.nome) return;

    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = a2 - a1;

    // Não desenha se a fatia for muito pequena
    const minSpan = (2 * Math.PI) / total * 0.6;
    if (span < minSpan) return;

    ctx.save();
    ctx.translate(cx + rMid * Math.cos(aMid), cy + rMid * Math.sin(aMid));
    ctx.rotate(aMid + Math.PI / 2);

    ctx.fillStyle    = "rgba(255,255,255,0.82)";
    ctx.font         = CAL.font.semana(tam);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // Sombra para legibilidade
    ctx.shadowColor  = "rgba(0,0,0,0.90)";
    ctx.shadowBlur   = 4;

    ctx.fillText(seg.nome, 0, 0);
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   NOMES DOS TEMPOS LITÚRGICOS
════════════════════════════════════════════════ */

function desenharNomesTempos(ctx, cx, cy, R, segs, total, tam) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rS   = R * CAL.r.semanas;
  const rT   = R * CAL.r.tempos;
  const rMid = (rS + rT) / 2;

  // ── Agrupar por tempo ──
  const grupos = new Map();
  segs.forEach((seg) => {
    if (!grupos.has(seg.tempo)) {
      grupos.set(seg.tempo, { inicio: seg.inicio, fim: seg.fim, cor: seg.cor });
    } else {
      grupos.get(seg.tempo).fim = seg.fim;
    }
  });

  grupos.forEach((g, nome) => {
    const a1   = sToAng(g.inicio, total);
    const a2   = sToAng(g.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = Math.abs(a2 - a1);

    // Só renderiza se houver espaço
    if (span < 0.22) return;

    // ── Texto curvado letra por letra ──
    const texto    = nome.toUpperCase();
    const fontSize = Math.max(8, Math.round(tam * 0.019));
    const arcRaio  = rMid;
    const charAngle = fontSize * 0.65 / arcRaio;
    const totalAng  = texto.length * charAngle;

    // Limita o texto ao espaço disponível
    if (totalAng > span * 0.85) {
      // Versão curta sem curvar
      ctx.save();
      ctx.translate(cx + rMid * Math.cos(aMid), cy + rMid * Math.sin(aMid));
      ctx.rotate(aMid + Math.PI / 2);
      ctx.fillStyle    = "rgba(255,255,255,0.38)";
      ctx.font         = `600 ${fontSize}px Inter, sans-serif`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor  = "rgba(0,0,0,0.80)";
      ctx.shadowBlur   = 3;
      ctx.fillText(texto, 0, 0);
      ctx.restore();
      return;
    }

    // ── Texto curvado ──
    const startAng = aMid - totalAng / 2;

    ctx.save();
    ctx.fillStyle    = "rgba(255,255,255,0.38)";
    ctx.font         = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.80)";
    ctx.shadowBlur   = 3;

    for (let i = 0; i < texto.length; i++) {
      const ang = startAng + (i + 0.5) * charAngle;
      ctx.save();
      ctx.translate(cx + arcRaio * Math.cos(ang), cy + arcRaio * Math.sin(ang));
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillText(texto[i], 0, 0);
      ctx.restore();
    }

    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   SEPARADORES DE TEMPO
════════════════════════════════════════════════ */

function desenharSeparadores(ctx, cx, cy, R, segs, total) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rI = R * CAL.r.centro;
  const rO = R * CAL.r.externo;

  let tempoAtual = null;

  segs.forEach((seg) => {
    if (seg.tempo === tempoAtual) return;
    tempoAtual = seg.tempo;

    const ang = sToAng(seg.inicio, total);
    const p1  = { x: cx + rI * Math.cos(ang), y: cy + rI * Math.sin(ang) };
    const p2  = { x: cx + rO * Math.cos(ang), y: cy + rO * Math.sin(ang) };

    // Linha principal
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Ponto na borda externa
    ctx.save();
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fill();
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   CÍRCULO CENTRAL
════════════════════════════════════════════════ */

function desenharCentro(ctx, cx, cy, R, tam, mini) {
  const CAL      = window.CalBase.CAL;
  const roundRect = window.CalBase.roundRect;

  const rC = R * CAL.r.centro;

  // ── Fundo do centro ──
  const gFundo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rC);
  if (mini) {
    gFundo.addColorStop(0, "#1e1e1e");
    gFundo.addColorStop(1, "#111111");
  } else {
    gFundo.addColorStop(0,   "#1a1714");
    gFundo.addColorStop(0.6, "#111009");
    gFundo.addColorStop(1,   "#0a0906");
  }

  ctx.beginPath();
  ctx.arc(cx, cy, rC, 0, 2 * Math.PI);
  ctx.fillStyle = gFundo;
  ctx.fill();

  if (mini) {
    // Mini: só anel + cruz simples
    ctx.beginPath();
    ctx.arc(cx, cy, rC, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(212,168,83,0.50)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.fillStyle    = "rgba(212,168,83,0.80)";
    ctx.font         = CAL.font.simbolo(tam);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✝", cx, cy);
    return;
  }

  // ── Anéis decorativos internos ──
  [0.90, 0.68, 0.44].forEach((fator, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rC * fator, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(212,168,83,${0.12 - i * 0.03})`;
    ctx.lineWidth   = 1;
    ctx.stroke();
  });

  // ── Anel externo dourado ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rC, 0, 2 * Math.PI);
  const gAnel = ctx.createLinearGradient(cx - rC, cy - rC, cx + rC, cy + rC);
  gAnel.addColorStop(0,    "rgba(212,168,83,0.70)");
  gAnel.addColorStop(0.35, "rgba(240,201,106,0.90)");
  gAnel.addColorStop(0.65, "rgba(212,168,83,0.70)");
  gAnel.addColorStop(1,    "rgba(139,105,20,0.60)");
  ctx.strokeStyle = gAnel;
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();

  // ── Cruz central moderna ──
  desenharCruzModerna(ctx, cx, cy, rC * 0.52, tam);

  // ── Alfa e Ômega ──
  ctx.save();
  ctx.font         = `300 ${Math.round(tam * 0.036)}px Inter, sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "rgba(212,168,83,0.55)";
  ctx.letterSpacing = "1px";
  ctx.fillText("α", cx - rC * 0.44, cy + rC * 0.18);
  ctx.fillText("ω", cx + rC * 0.44, cy + rC * 0.18);
  ctx.restore();

  // ── Label sutil ──
  ctx.save();
  ctx.font         = `300 ${Math.round(tam * 0.018)}px Inter, sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "rgba(212,168,83,0.22)";
  ctx.letterSpacing = "3px";
  ctx.fillText("ANO LITÚRGICO", cx, cy - rC * 0.72);
  ctx.restore();
}

/* ════════════════════════════════════════════════
   CRUZ MODERNA
════════════════════════════════════════════════ */

function desenharCruzModerna(ctx, cx, cy, tam, canvasTam) {
  const espV  = tam * 0.14;
  const altV  = tam * 1.10;
  const espH  = tam * 0.14;
  const largH = tam * 0.72;
  const posH  = -tam * 0.14;
  const raio  = espV * 0.40;

  const roundRect = window.CalBase.roundRect;

  // Gradiente vertical
  const gV = ctx.createLinearGradient(cx, cy - altV / 2, cx, cy + altV / 2);
  gV.addColorStop(0,    "rgba(212,168,83,0.30)");
  gV.addColorStop(0.25, "rgba(240,201,106,0.85)");
  gV.addColorStop(0.5,  "rgba(255,220,120,0.95)");
  gV.addColorStop(0.75, "rgba(212,168,83,0.85)");
  gV.addColorStop(1,    "rgba(139,105,20,0.30)");

  // Gradiente horizontal
  const gH = ctx.createLinearGradient(cx - largH / 2, cy, cx + largH / 2, cy);
  gH.addColorStop(0,    "rgba(139,105,20,0.30)");
  gH.addColorStop(0.25, "rgba(212,168,83,0.85)");
  gH.addColorStop(0.5,  "rgba(255,220,120,0.95)");
  gH.addColorStop(0.75, "rgba(212,168,83,0.85)");
  gH.addColorStop(1,    "rgba(139,105,20,0.30)");

  ctx.save();

  // Sombra suave
  ctx.shadowColor   = "rgba(212,168,83,0.25)";
  ctx.shadowBlur    = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Vertical
  ctx.fillStyle = gV;
  roundRect(ctx, cx - espV / 2, cy - altV / 2, espV, altV, raio);
  ctx.fill();

  // Horizontal
  ctx.fillStyle = gH;
  roundRect(ctx, cx - largH / 2, cy + posH - espH / 2, largH, espH, raio);
  ctx.fill();

  ctx.restore();
}

/* ════════════════════════════════════════════════
   EXPORTAR
════════════════════════════════════════════════ */

window.CalDetalhes = {
  desenharDatas,
  desenharNomesSemanas,
  desenharNomesTempos,
  desenharSeparadores,
  desenharCentro,
  desenharCruzModerna,
};
