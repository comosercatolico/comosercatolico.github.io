/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 2  (REBUILD TOTAL)
   Textos, datas, separadores, centro — alinhado
   com a nova Parte 1
   ================================================ */

/* ════════════════════════════════════════════════
   ANEL DE DATAS (wrapper — chama CalBase)
════════════════════════════════════════════════ */

function desenharDatas(ctx, cx, cy, R, ini, total, tam) {
  window.CalBase.desenharAnelDatas(ctx, cx, cy, R, ini, null, total, tam);
}

/* ════════════════════════════════════════════════
   NOMES DAS SEMANAS NAS FATIAS
════════════════════════════════════════════════ */

function desenharNomesSemanas(ctx, cx, cy, R, segs, total, tam) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rO   = R * CAL.r.segOuter;
  const rI   = R * CAL.r.segInner;
  const rMid = R * CAL.r.textoSemana;

  segs.forEach((seg) => {
    const a1   = sToAng(seg.inicio, total);
    const a2   = sToAng(seg.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = Math.abs(a2 - a1);

    // Fatia muito pequena: pula
    if (span < 0.055) return;

    const fontSize = Math.max(
      6,
      Math.round(tam * (seg.destaque ? 0.0148 : 0.0118))
    );

    // Verifica se o texto cabe na fatia (largura do arco)
    const arcWidth = rMid * span;
    const estimatedTextWidth = seg.nome.length * fontSize * 0.58;

    ctx.save();
    ctx.translate(cx + rMid * Math.cos(aMid), cy + rMid * Math.sin(aMid));
    ctx.rotate(aMid + Math.PI / 2);

    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // Sombra forte para legibilidade sobre qualquer cor
    ctx.shadowColor  = "rgba(0,0,0,1)";
    ctx.shadowBlur   = 6;

    if (seg.destaque) {
      ctx.font      = `700 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = seg.cor.text || "rgba(255,255,255,0.97)";
    } else {
      ctx.font      = `500 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
    }

    // Se texto é maior que o arco, escala para caber
    if (estimatedTextWidth > arcWidth * 0.88) {
      const scale = (arcWidth * 0.88) / estimatedTextWidth;
      ctx.scale(scale, 1);
    }

    ctx.fillText(seg.nome, 0, 0);
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   NOMES DOS TEMPOS — texto curvado no anel médio
════════════════════════════════════════════════ */

function desenharNomesTempos(ctx, cx, cy, R, segs, total, tam) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const rTxt = R * CAL.r.textoTempo;

  // ── Agrupar segmentos por tempo ──
  const grupos = new Map();
  segs.forEach((seg) => {
    if (!grupos.has(seg.tempo)) {
      grupos.set(seg.tempo, {
        inicio: seg.inicio,
        fim:    seg.fim,
        cor:    seg.cor,
      });
    } else {
      grupos.get(seg.tempo).fim = seg.fim;
    }
  });

  grupos.forEach((g, nome) => {
    const a1   = sToAng(g.inicio, total);
    const a2   = sToAng(g.fim,    total);
    const aMid = (a1 + a2) / 2;
    const span = Math.abs(a2 - a1);

    if (span < 0.16) return;

    const texto    = nome.toUpperCase();
    const fontSize = Math.max(7, Math.round(tam * 0.0155));
    const charAng  = (fontSize * 0.62) / rTxt;
    const totalAng = texto.length * charAng;
    const corTexto = g.cor.text
      ? hexToRgba(g.cor.text, 0.45)
      : "rgba(255,255,255,0.28)";

    ctx.save();
    ctx.fillStyle    = corTexto;
    ctx.font         = `700 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor  = "rgba(0,0,0,0.90)";
    ctx.shadowBlur   = 5;

    // Cabe no arco → curva letra a letra
    if (totalAng <= span * 0.88) {
      const startAng = aMid - totalAng / 2;
      for (let i = 0; i < texto.length; i++) {
        const ang = startAng + (i + 0.5) * charAng;
        ctx.save();
        ctx.translate(
          cx + rTxt * Math.cos(ang),
          cy + rTxt * Math.sin(ang)
        );
        ctx.rotate(ang + Math.PI / 2);
        ctx.fillText(texto[i], 0, 0);
        ctx.restore();
      }
    } else {
      // Versão plana — texto centrado na fatia
      ctx.save();
      ctx.translate(cx + rTxt * Math.cos(aMid), cy + rTxt * Math.sin(aMid));
      ctx.rotate(aMid + Math.PI / 2);

      // Escalar para caber
      const arcWidth = rTxt * span;
      const estimatedW = texto.length * fontSize * 0.62;
      if (estimatedW > arcWidth * 0.85) {
        const scale = (arcWidth * 0.85) / estimatedW;
        ctx.scale(scale, 1);
      }

      ctx.fillText(texto, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  });
}

/* ════════════════════════════════════════════════
   SEPARADORES DE TEMPO
   (wrapper — a lógica principal está na Parte 1)
════════════════════════════════════════════════ */

function desenharSeparadoresTempos(ctx, cx, cy, R, segs, total) {
  window.CalBase.desenharSeparadores(ctx, cx, cy, R, segs, total);
}

/* ════════════════════════════════════════════════
   CENTRO
   (wrapper — a lógica principal está na Parte 1)
════════════════════════════════════════════════ */

function desenharCentro(ctx, cx, cy, R, tam, mini) {
  window.CalBase.desenharCentro(ctx, cx, cy, R, tam, mini);
}

/* ════════════════════════════════════════════════
   ANEL DE PULSO — destaque visual da semana atual
   Desenhado sobre tudo, logo antes do marcador
════════════════════════════════════════════════ */

function desenharPulseSemana(ctx, cx, cy, R, sAtual, total) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const a1   = sToAng(sAtual,     total);
  const a2   = sToAng(sAtual + 1, total);
  const rO   = R * CAL.r.segOuter;
  const rI   = R * CAL.r.segInner;

  // Overlay suave na fatia atual
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rO, a1, a2);
  ctx.arc(cx, cy, rI, a2, a1, true);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,245,160,0.14)";
  ctx.fill();

  // Borda brilhante nas arestas da fatia
  // Aresta 1
  ctx.beginPath();
  ctx.moveTo(cx + rI * Math.cos(a1), cy + rI * Math.sin(a1));
  ctx.lineTo(cx + rO * Math.cos(a1), cy + rO * Math.sin(a1));
  ctx.strokeStyle = "rgba(0,245,160,0.55)";
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Aresta 2
  ctx.beginPath();
  ctx.moveTo(cx + rI * Math.cos(a2), cy + rI * Math.sin(a2));
  ctx.lineTo(cx + rO * Math.cos(a2), cy + rO * Math.sin(a2));
  ctx.stroke();

  // Arco externo brilhante
  ctx.beginPath();
  ctx.arc(cx, cy, rO, a1, a2);
  ctx.strokeStyle = "rgba(0,245,160,0.70)";
  ctx.lineWidth   = 2;
  ctx.shadowColor = CAL.cores.hojeGlow;
  ctx.shadowBlur  = 12;
  ctx.stroke();

  // Arco interno
  ctx.beginPath();
  ctx.arc(cx, cy, rI, a1, a2);
  ctx.strokeStyle = "rgba(0,245,160,0.40)";
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 8;
  ctx.stroke();

  ctx.restore();
}

/* ════════════════════════════════════════════════
   UTILITÁRIO — hex → rgba
════════════════════════════════════════════════ */

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ════════════════════════════════════════════════
   EXPORTAR
════════════════════════════════════════════════ */

window.CalDetalhes = {
  desenharDatas,
  desenharNomesSemanas,
  desenharNomesTempos,
  desenharSeparadoresTempos,
  desenharCentro,
  desenharPulseSemana,
  hexToRgba,
};
