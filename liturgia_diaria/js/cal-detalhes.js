/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 2
   Detalhes: textos nos anéis, datas, centro
   ================================================ */

/* ────────────────────────────────────────────────
   ANEL DE DATAS (anel externo)
──────────────────────────────────────────────── */

function desenharDatas(ctx, cx, cy, R, inicioAdv, total, tamanho) {
  const CAL   = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rO    = R * CAL.raios.externo;
  const rData = R * CAL.raios.datas;

  // Faixa escura de fundo para as datas
  ctx.beginPath();
  ctx.arc(cx, cy, rO, 0, 2 * Math.PI);
  ctx.arc(cx, cy, rData, 0, 2 * Math.PI, true);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();

  // Borda separadora
  ctx.beginPath();
  ctx.arc(cx, cy, rData, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(197,169,106,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Datas
  for (let i = 0; i < total; i++) {
    const ang = sToAng(i, total) + (Math.PI / total);

    const dataRef = new Date(inicioAdv);
    dataRef.setDate(inicioAdv.getDate() + i * 7);

    const dia   = dataRef.getDate();
    const mes   = dataRef.getMonth() + 1;
    const label = `${dia}/${mes}`;

    const raioTexto = (rData + rO) / 2;

    ctx.save();
    ctx.translate(
      cx + raioTexto * Math.cos(ang),
      cy + raioTexto * Math.sin(ang)
    );
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle    = "rgba(255,245,220,0.80)";
    ctx.font         = CAL.fonte.data(tamanho);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

/* ────────────────────────────────────────────────
   NOMES DAS SEMANAS (anel médio interno)
──────────────────────────────────────────────── */

function desenharNomesSemanas(ctx, cx, cy, R, segs, total, tamanho) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rNomes = R * CAL.raios.nomes;
  const rData  = R * CAL.raios.datas;
  const raio   = (rNomes + rData) / 2;

  segs.forEach((seg) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;

    if (!seg.nome) return;

    ctx.save();
    ctx.translate(
      cx + raio * Math.cos(aMid),
      cy + raio * Math.sin(aMid)
    );
    ctx.rotate(aMid + Math.PI / 2);

    ctx.fillStyle    = "rgba(255,255,255,0.88)";
    ctx.font         = CAL.fonte.semana(tamanho);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.shadowColor   = "rgba(0,0,0,0.70)";
    ctx.shadowBlur    = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    ctx.fillText(seg.nome, 0, 0);
    ctx.restore();
  });
}

/* ────────────────────────────────────────────────
   NOMES DOS TEMPOS LITÚRGICOS (anel interno)
──────────────────────────────────────────────── */

function desenharNomesTempos(ctx, cx, cy, R, segs, total, tamanho) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rTempos = R * CAL.raios.tempos;
  const rNomes  = R * CAL.raios.nomes;
  const raio    = (rTempos + rNomes) / 2;

  // Agrupar segmentos por tempo
  const grupos = {};
  segs.forEach((seg) => {
    if (!grupos[seg.tempo]) {
      grupos[seg.tempo] = { inicio: seg.inicio, fim: seg.fim, cor: seg.cor };
    } else {
      grupos[seg.tempo].fim = seg.fim;
    }
  });

  Object.entries(grupos).forEach(([nome, g]) => {
    const a1   = sToAng(g.inicio, total);
    const a2   = sToAng(g.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = a2 - a1;

    if (span < 0.18) return;

    ctx.save();
    ctx.translate(
      cx + raio * Math.cos(aMid),
      cy + raio * Math.sin(aMid)
    );
    ctx.rotate(aMid + Math.PI / 2);

    ctx.fillStyle    = "rgba(255,255,255,0.55)";
    ctx.font         = CAL.fonte.tempo(tamanho);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    ctx.shadowColor = "rgba(0,0,0,0.80)";
    ctx.shadowBlur  = 4;

    ctx.fillText(nome.toUpperCase(), 0, 0);
    ctx.restore();
  });
}

/* ────────────────────────────────────────────────
   SEPARADORES DE TEMPO (linhas maiores)
──────────────────────────────────────────────── */

function desenharSeparadoresTempos(ctx, cx, cy, R, segs, total) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rI = R * CAL.raios.interno;
  const rO = R * CAL.raios.externo;

  let tempoAtual = null;

  segs.forEach((seg) => {
    if (seg.tempo !== tempoAtual) {
      tempoAtual = seg.tempo;
      const ang  = sToAng(seg.inicio, total);

      ctx.beginPath();
      ctx.moveTo(cx + rI * Math.cos(ang), cy + rI * Math.sin(ang));
      ctx.lineTo(cx + rO * Math.cos(ang), cy + rO * Math.sin(ang));
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth   = 1.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

/* ────────────────────────────────────────────────
   CÍRCULO CENTRAL
──────────────────────────────────────────────── */

function desenharCentro(ctx, cx, cy, R, tamanho, mini) {
  const CAL = window.CalBase.CAL;
  const rI  = R * CAL.raios.interno;

  // Fundo do centro
  const gCentro = ctx.createRadialGradient(cx, cy, 0, cx, cy, rI);
  if (mini) {
    gCentro.addColorStop(0, "#222");
    gCentro.addColorStop(1, "#111");
  } else {
    gCentro.addColorStop(0,   "#2a1f0a");
    gCentro.addColorStop(0.5, "#1a1206");
    gCentro.addColorStop(1,   "#0f0c04");
  }

  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.fillStyle = gCentro;
  ctx.fill();

  // Anel dourado do centro
  ctx.beginPath();
  ctx.arc(cx, cy, rI, 0, 2 * Math.PI);
  ctx.strokeStyle = CAL.cores.bordaOuro;
  ctx.lineWidth   = mini ? 1.5 : 3;
  ctx.stroke();

  // Mini: só cruz
  if (mini) {
    ctx.fillStyle    = CAL.cores.bordaOuro;
    ctx.font         = `bold ${tamanho * 0.32}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✝", cx, cy);
    return;
  }

  // Círculos decorativos internos
  ctx.beginPath();
  ctx.arc(cx, cy, rI * 0.80, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(197,169,106,0.30)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, rI * 0.55, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(197,169,106,0.20)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Cruz
  desenharCruz(ctx, cx, cy, rI * 0.58, tamanho);

  // Alfa e Ômega
  ctx.save();
  ctx.fillStyle    = "rgba(197,169,106,0.75)";
  ctx.font         = `bold ${tamanho * 0.042}px 'Libre Baskerville', serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.5)";
  ctx.shadowBlur   = 6;
  ctx.fillText("Α", cx - rI * 0.42, cy + rI * 0.14);
  ctx.fillText("Ω", cx + rI * 0.42, cy + rI * 0.14);
  ctx.restore();

  // Texto "ANO LITÚRGICO"
  ctx.save();
  ctx.fillStyle    = "rgba(197,169,106,0.35)";
  ctx.font         = `${tamanho * 0.022}px 'Inter', sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ANO LITÚRGICO", cx, cy - rI * 0.70);
  ctx.restore();
}

/* ────────────────────────────────────────────────
   CRUZ ESTILIZADA
──────────────────────────────────────────────── */

function desenharCruz(ctx, cx, cy, tamanho, canvasSize) {
  const pathRect = window.CalBase.pathRect;

  const larg  = tamanho * 0.16;
  const altV  = tamanho * 0.95;
  const largH = tamanho * 0.70;
  const posH  = -tamanho * 0.18;
  const r     = larg * 0.35;

  const gV = ctx.createLinearGradient(
    cx - larg / 2, cy - altV / 2,
    cx + larg / 2, cy - altV / 2
  );
  gV.addColorStop(0,   "#6b4c1a");
  gV.addColorStop(0.3, "#c5a96a");
  gV.addColorStop(0.6, "#e8cc8a");
  gV.addColorStop(1,   "#8b6914");

  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,0.55)";
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  // Vertical
  ctx.fillStyle = gV;
  pathRect(ctx, cx - larg / 2, cy - altV / 2, larg, altV, r);
  ctx.fill();

  // Horizontal
  const gH = ctx.createLinearGradient(
    cx - largH / 2, cy + posH,
    cx + largH / 2, cy + posH
  );
  gH.addColorStop(0,   "#6b4c1a");
  gH.addColorStop(0.3, "#c5a96a");
  gH.addColorStop(0.6, "#e8cc8a");
  gH.addColorStop(1,   "#6b4c1a");

  ctx.fillStyle = gH;
  pathRect(ctx, cx - largH / 2, cy + posH - larg / 2, largH, larg, r);
  ctx.fill();

  ctx.restore();
}

/* ────────────────────────────────────────────────
   EXPORTAR
──────────────────────────────────────────────── */

window.CalDetalhes = {
  desenharDatas,
  desenharNomesSemanas,
  desenharNomesTempos,
  desenharSeparadoresTempos,
  desenharCentro,
  desenharCruz,
};
