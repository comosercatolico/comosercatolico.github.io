/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 3  (REBUILD TOTAL)
   Render, marcador HOJE, botão, modal, CSS
   ================================================ */

/* ════════════════════════════════════════════════
   RENDER COMPLETO
════════════════════════════════════════════════ */

function renderCalendario(canvasId, tamanho, mini) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const {
    CAL, buildSegmentos, semanaAtual,
    desenharFundo, desenharAnelBase,
    desenharAnelDatas, desenharSeparadores,
    desenharCentro,
  } = window.CalBase;

  const {
    desenharNomesSemanas,
    desenharNomesTempos,
    desenharSeparadoresTempos,
    desenharPulseSemana,
  } = window.CalDetalhes;

  const ctx = canvas.getContext("2d");
  canvas.width  = tamanho;
  canvas.height = tamanho;

  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const R  = tamanho / 2 - 6;

  const ano              = new Date().getFullYear();
  const { segs, ini, total } = buildSegmentos(ano);
  const sAtual           = semanaAtual();

  // 1 · Fundo
  desenharFundo(ctx, cx, cy, R, mini);

  // 2 · Fatias coloridas
  desenharAnelBase(ctx, cx, cy, R, segs, total);

  // 3 · Separadores de tempo
  desenharSeparadoresTempos(ctx, cx, cy, R, segs, total);

  if (!mini) {
    // 4 · Pulse da semana atual (atrás dos textos)
    desenharPulseSemana(ctx, cx, cy, R, sAtual, total);

    // 5 · Nomes das semanas nas fatias
    desenharNomesSemanas(ctx, cx, cy, R, segs, total, tamanho);

    // 6 · Rótulos dos tempos litúrgicos (anel médio)
    desenharNomesTempos(ctx, cx, cy, R, segs, total, tamanho);

    // 7 · Anel externo de datas
    desenharAnelDatas(ctx, cx, cy, R, ini, segs, total, tamanho);
  }

  // 8 · Centro decorativo
  desenharCentro(ctx, cx, cy, R, tamanho, mini);

  // 9 · Marcador HOJE (sempre por cima)
  desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini, tamanho);
}

/* ════════════════════════════════════════════════
   MARCADOR HOJE
════════════════════════════════════════════════ */

function desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini, tam) {
  const { CAL, sToAng } = window.CalBase;

  const a1   = sToAng(sAtual,     total);
  const a2   = sToAng(sAtual + 1, total);
  const aMid = (a1 + a2) / 2;                  // centro da fatia atual

  const rI  = R * CAL.r.segInner;
  const rO  = R * CAL.r.segOuter;
  const rD  = R * CAL.r.nomeData;              // posição do ponto externo
  const rDB = R * CAL.r.dataBorda;

  /* ══ MINI ══════════════════════════════════════ */
  if (mini) {
    ctx.save();

    // Linha radial brilhante
    ctx.beginPath();
    ctx.moveTo(cx + rI * 1.02 * Math.cos(aMid), cy + rI * 1.02 * Math.sin(aMid));
    ctx.lineTo(cx + rO * 0.98 * Math.cos(aMid), cy + rO * 0.98 * Math.sin(aMid));
    ctx.strokeStyle = CAL.cores.hoje;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.shadowColor = CAL.cores.hojeGlow;
    ctx.shadowBlur  = 12;
    ctx.stroke();

    // Ponto na borda
    const px = cx + rO * 0.98 * Math.cos(aMid);
    const py = cy + rO * 0.98 * Math.sin(aMid);
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle   = CAL.cores.hoje;
    ctx.shadowColor = CAL.cores.hojeGlow;
    ctx.shadowBlur  = 14;
    ctx.fill();

    ctx.restore();
    return;
  }

  /* ══ GRANDE ════════════════════════════════════ */

  // ── Linha radial com gradiente ──
  ctx.save();
  const x1 = cx + rI * 1.01 * Math.cos(aMid);
  const y1 = cy + rI * 1.01 * Math.sin(aMid);
  const x2 = cx + rO * 1.00 * Math.cos(aMid);
  const y2 = cy + rO * 1.00 * Math.sin(aMid);

  const gLinha = ctx.createLinearGradient(x1, y1, x2, y2);
  gLinha.addColorStop(0,    "rgba(0,245,160,0.30)");
  gLinha.addColorStop(0.40, "rgba(0,245,160,0.90)");
  gLinha.addColorStop(1,    "rgba(0,245,160,1.00)");

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = gLinha;
  ctx.lineWidth   = 3;
  ctx.lineCap     = "round";
  ctx.shadowColor = CAL.cores.hojeGlow;
  ctx.shadowBlur  = 20;
  ctx.stroke();
  ctx.restore();

  // ── Extensão até o anel de datas ──
  ctx.save();
  const x3 = cx + rDB * 0.995 * Math.cos(aMid);
  const y3 = cy + rDB * 0.995 * Math.sin(aMid);

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.strokeStyle = "rgba(0,245,160,0.45)";
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.lineCap     = "round";
  ctx.shadowColor = CAL.cores.hojeGlow;
  ctx.shadowBlur  = 8;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ── Halo externo ──
  const px = cx + rD * Math.cos(aMid);
  const py = cy + rD * Math.sin(aMid);

  ctx.save();
  const gHalo = ctx.createRadialGradient(px, py, 0, px, py, 22);
  gHalo.addColorStop(0,    "rgba(0,245,160,0.55)");
  gHalo.addColorStop(0.40, "rgba(0,245,160,0.18)");
  gHalo.addColorStop(1,    "rgba(0,245,160,0.00)");
  ctx.beginPath();
  ctx.arc(px, py, 22, 0, Math.PI * 2);
  ctx.fillStyle = gHalo;
  ctx.fill();
  ctx.restore();

  // ── Anel branco + núcleo verde ──
  ctx.save();
  // Anel externo
  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth   = 1.8;
  ctx.shadowColor = CAL.cores.hojeGlow;
  ctx.shadowBlur  = 16;
  ctx.stroke();

  // Anel verde médio
  ctx.beginPath();
  ctx.arc(px, py, 5.5, 0, Math.PI * 2);
  ctx.fillStyle   = "rgba(0,245,160,0.25)";
  ctx.fill();

  // Núcleo sólido
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle   = CAL.cores.hoje;
  ctx.shadowColor = CAL.cores.hojeGlow;
  ctx.shadowBlur  = 18;
  ctx.fill();
  ctx.restore();

  // ── Label "HOJE" curvado ──
  const rLabel = R * CAL.r.dataBorda + (R * (CAL.r.externo - CAL.r.dataBorda)) / 2 + 2;
  desenharTextoArco(ctx, cx, cy, rLabel, aMid, "● HOJE", CAL.cores.hoje, Math.max(9, Math.round(tam * 0.018)));
}

/* ════════════════════════════════════════════════
   TEXTO CURVADO GENÉRICO
════════════════════════════════════════════════ */

function desenharTextoArco(ctx, cx, cy, raio, angBase, texto, cor, fontSize) {
  ctx.save();
  ctx.fillStyle    = cor;
  ctx.font         = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = cor;
  ctx.shadowBlur   = 12;
  ctx.globalAlpha  = 0.95;

  const charWidth = fontSize * 0.60;
  const totalLen  = texto.length * charWidth;
  const angTotal  = totalLen / raio;
  const angStart  = angBase - angTotal / 2;

  for (let i = 0; i < texto.length; i++) {
    const angChar = angStart + (i + 0.5) * (angTotal / texto.length);
    ctx.save();
    ctx.translate(
      cx + raio * Math.cos(angChar),
      cy + raio * Math.sin(angChar)
    );
    ctx.rotate(angChar + Math.PI / 2);
    ctx.fillText(texto[i], 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

/* ════════════════════════════════════════════════
   BOTÃO MINIATURA NO HEADER
════════════════════════════════════════════════ */

function criarBotao() {
  const header = document.querySelector(".liturgia-super-header");
  if (!header) return;

  const btn = document.createElement("button");
  btn.id    = "btn-calendario";
  btn.title = "Calendário Litúrgico";

  btn.innerHTML = `
    <span id="cal-btn-pill">
      <span class="cal-pill-dot"></span>
      AO VIVO
    </span>
    <canvas id="cal-mini" width="84" height="84"></canvas>
    <span id="cal-btn-label">Calendário</span>
  `;

  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);

  setTimeout(() => renderCalendario("cal-mini", 84, true), 250);
}

/* ════════════════════════════════════════════════
   MODAL
════════════════════════════════════════════════ */

function criarModal() {
  const overlay = document.createElement("div");
  overlay.id    = "cal-overlay";
  overlay.setAttribute("role", "presentation");

  overlay.innerHTML = `
    <div id="cal-modal" role="dialog" aria-modal="true"
         aria-label="Calendário Litúrgico">

      <!-- Header -->
      <div id="cal-modal-header">
        <div id="cal-header-info">
          <span id="cal-chip">
            <span class="cal-chip-dot"></span>
            Ano Litúrgico ${new Date().getFullYear()}
          </span>
          <h3 id="cal-titulo">Calendário Litúrgico</h3>
          <p  id="cal-data-texto"></p>
        </div>
        <button id="cal-fechar" aria-label="Fechar calendário">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Divisor -->
      <div class="cal-hr"></div>

      <!-- Canvas -->
      <div id="cal-canvas-wrap">
        <div id="cal-glow-bg"></div>
        <canvas id="cal-grande"></canvas>
      </div>

      <!-- Divisor -->
      <div class="cal-hr"></div>

      <!-- Legenda -->
      <div id="cal-legenda">${legendaHTML()}</div>

    </div>
  `;

  document.body.appendChild(overlay);

  // Fechar ao clicar fora
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal();
  });

  document.getElementById("cal-fechar")
          .addEventListener("click", fecharModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });
}

/* ════════════════════════════════════════════════
   LEGENDA
════════════════════════════════════════════════ */

function legendaHTML() {
  const itens = [
    { cor: "#6B3FA0", nome: "Advento"      },
    { cor: "#C8A84B", nome: "Natal"        },
    { cor: "#2E8B4E", nome: "Tempo Comum"  },
    { cor: "#7B3FA0", nome: "Quaresma"     },
    { cor: "#C0392B", nome: "Semana Santa" },
    { cor: "#8B1A1A", nome: "Tríduo"       },
    { cor: "#D4860A", nome: "Tempo Pascal" },
    { cor: "#CC2200", nome: "Pentecostes"  },
    { cor: "#00F5A0", nome: "Hoje"         },
  ];

  return itens.map(({ cor, nome }) => `
    <div class="cal-leg-item">
      <span class="cal-leg-dot" style="background:${cor};
            box-shadow:0 0 7px ${cor}88;"></span>
      <span class="cal-leg-nome">${nome}</span>
    </div>
  `).join("");
}

/* ════════════════════════════════════════════════
   ABRIR / FECHAR
════════════════════════════════════════════════ */

function abrirModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;

  atualizarDataTexto();
  overlay.classList.add("ativo");
  document.body.style.overflow = "hidden";

  // Calcula tamanho ideal do canvas
  const maxW = Math.min(window.innerWidth  * 0.80, 520);
  const maxH = window.innerHeight * 0.54;
  const tam  = Math.floor(Math.min(maxW, maxH));

  requestAnimationFrame(() => {
    setTimeout(() => renderCalendario("cal-grande", tam, false), 90);
  });
}

function fecharModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  document.body.style.overflow = "";
}

/* ════════════════════════════════════════════════
   DATA ATUAL
════════════════════════════════════════════════ */

function atualizarDataTexto() {
  const el = document.getElementById("cal-data-texto");
  if (!el) return;

  const hoje  = new Date();
  const dias  = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira",
                 "Quinta-feira","Sexta-feira","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const dow = hoje.getDay();
  const ini = new Date(hoje); ini.setDate(hoje.getDate() - dow);
  const fim = new Date(ini);  fim.setDate(ini.getDate() + 6);

  const fmt = (d) =>
    `${d.getDate()} de ${meses[d.getMonth()]}`;

  el.innerHTML = `
    <span class="cal-hoje-dia">${dias[dow]}</span>,
    ${hoje.getDate()} de ${meses[hoje.getMonth()]}
    de ${hoje.getFullYear()}
    <br>
    <span class="cal-hoje-semana">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
           style="vertical-align:middle;margin-right:4px;opacity:.7">
        <circle cx="5.5" cy="5.5" r="4.5"
                stroke="currentColor" stroke-width="1.1"/>
        <path d="M5.5 2.8v2.7l1.8 1.8"
              stroke="currentColor" stroke-width="1.1"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${fmt(ini)} — ${fmt(fim)}
    </span>
  `;
}

/* ════════════════════════════════════════════════
   CSS COMPLETO
════════════════════════════════════════════════ */

function injetarCSS() {
  const style = document.createElement("style");
  style.textContent = `

  /* ═══════════════════════════════════════════
     BOTÃO
  ═══════════════════════════════════════════ */

  #btn-calendario {
    position: absolute;
    bottom: 22px;
    right: 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 13px 12px;
    background: rgba(8, 6, 3, 0.72);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    cursor: pointer;
    z-index: 20;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition:
      border-color  0.28s ease,
      box-shadow    0.28s ease,
      transform     0.28s cubic-bezier(0.34,1.56,0.64,1);
  }

  #btn-calendario:hover {
    border-color: rgba(0,245,160,0.30);
    box-shadow:
      0 0 0 1px rgba(0,245,160,0.12),
      0 14px 36px rgba(0,0,0,0.55),
      0  0  40px rgba(0,245,160,0.07);
    transform: translateY(-4px) scale(1.02);
  }

  #btn-calendario:active {
    transform: translateY(-1px) scale(0.99);
    transition-duration: 0.10s;
  }

  /* Pill "AO VIVO" */
  #cal-btn-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    font: 700 0.52rem/1.6 Inter, system-ui, sans-serif;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: #00F5A0;
    background: rgba(0,245,160,0.10);
    border: 1px solid rgba(0,245,160,0.28);
    border-radius: 99px;
    padding: 2px 8px 2px 6px;
  }

  .cal-pill-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #00F5A0;
    box-shadow: 0 0 8px #00F5A0;
    animation: calDotPulse 2.2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes calDotPulse {
    0%, 100% { opacity: 1;   transform: scale(1);    }
    50%      { opacity: 0.4; transform: scale(0.70); }
  }

  /* Canvas mini */
  #cal-mini {
    display: block;
    border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,0.09);
    box-shadow:
      0 4px 18px rgba(0,0,0,0.60),
      0 0  12px rgba(0,245,160,0.06);
    transition: box-shadow 0.28s ease;
  }

  #btn-calendario:hover #cal-mini {
    box-shadow:
      0 6px 24px rgba(0,0,0,0.65),
      0 0  20px rgba(0,245,160,0.14);
  }

  /* Label */
  #cal-btn-label {
    font: 500 0.60rem/1 Inter, system-ui, sans-serif;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.38);
    transition: color 0.25s;
  }

  #btn-calendario:hover #cal-btn-label {
    color: rgba(255,255,255,0.65);
  }

  /* ═══════════════════════════════════════════
     OVERLAY
  ═══════════════════════════════════════════ */

  #cal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.80);
    backdrop-filter: blur(18px) saturate(0.55);
    -webkit-backdrop-filter: blur(18px) saturate(0.55);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.30s ease;
  }

  #cal-overlay.ativo {
    opacity: 1;
    pointer-events: all;
  }

  /* ═══════════════════════════════════════════
     MODAL
  ═══════════════════════════════════════════ */

  #cal-modal {
    position: relative;
    width: min(96vw, 640px);
    max-height: 96vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 30px 28px 26px;
    border-radius: 26px;
    background:
      linear-gradient(
        150deg,
        rgba(20, 16, 8,  0.97) 0%,
        rgba(10,  8,  4,  0.99) 100%
      );
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.035),
      0 48px 100px rgba(0,0,0,0.85),
      0  0  160px rgba(0,245,160,0.035);
    transform: scale(0.92) translateY(22px);
    transition: transform 0.36s cubic-bezier(0.34,1.44,0.64,1);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.07) transparent;
  }

  #cal-overlay.ativo #cal-modal {
    transform: scale(1) translateY(0);
  }

  /* ═══════════════════════════════════════════
     HEADER
  ═══════════════════════════════════════════ */

  #cal-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
  }

  #cal-header-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Chip ano */
  #cal-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: 600 0.65rem/1 Inter, system-ui, sans-serif;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(200,168,75,0.85);
    background: rgba(200,168,75,0.07);
    border: 1px solid rgba(200,168,75,0.20);
    border-radius: 99px;
    padding: 4px 11px 4px 8px;
    width: fit-content;
  }

  .cal-chip-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(200,168,75,0.75);
    box-shadow: 0 0 6px rgba(200,168,75,0.50);
    flex-shrink: 0;
  }

  /* Título */
  #cal-titulo {
    font: 700 1.40rem/1.20 'Libre Baskerville', Georgia, serif;
    color: #F0E4B8;
    margin: 0;
    letter-spacing: 0.2px;
  }

  /* Data */
  #cal-data-texto {
    font: 400 0.83rem/1.75 Inter, system-ui, sans-serif;
    color: rgba(255,255,255,0.42);
    margin: 0;
  }

  .cal-hoje-dia {
    font-weight: 600;
    color: rgba(255,255,255,0.68);
  }

  .cal-hoje-semana {
    display: inline-flex;
    align-items: center;
    font-size: 0.76rem;
    color: rgba(255,255,255,0.28);
  }

  /* Botão fechar */
  #cal-fechar {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.40);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  #cal-fechar:hover {
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.90);
  }

  /* ═══════════════════════════════════════════
     DIVISOR
  ═══════════════════════════════════════════ */

  .cal-hr {
    height: 1px;
    margin: 0 -4px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.055) 25%,
      rgba(255,255,255,0.055) 75%,
      transparent 100%
    );
  }

  /* ═══════════════════════════════════════════
     ÁREA DO CANVAS
  ═══════════════════════════════════════════ */

  #cal-canvas-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px 0;
  }

  /* Glow ambiente atrás do canvas */
  #cal-glow-bg {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at 50% 50%,
      rgba(0,245,160,0.055) 0%,
      rgba(200,168,75,0.035) 40%,
      transparent 70%
    );
    pointer-events: none;
    filter: blur(20px);
  }

  #cal-grande {
    position: relative;
    z-index: 1;
    display: block;
    border-radius: 50%;
    max-width: 100%;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 24px 64px rgba(0,0,0,0.70),
      0  0  90px rgba(0,245,160,0.06),
      0  0  60px rgba(200,168,75,0.05);
  }

  /* ═══════════════════════════════════════════
     LEGENDA
  ═══════════════════════════════════════════ */

  #cal-legenda {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    justify-content: center;
    padding: 18px 0 2px;
  }

  .cal-leg-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font: 400 0.72rem/1 Inter, system-ui, sans-serif;
    color: rgba(255,255,255,0.38);
    cursor: default;
    transition: color 0.22s;
    white-space: nowrap;
  }

  .cal-leg-item:hover {
    color: rgba(255,255,255,0.78);
  }

  .cal-leg-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: transform 0.22s;
  }

  .cal-leg-item:hover .cal-leg-dot {
    transform: scale(1.35);
  }

  .cal-leg-nome {
    letter-spacing: 0.15px;
  }

  /* ═══════════════════════════════════════════
     RESPONSIVO
  ═══════════════════════════════════════════ */

  @media (max-width: 600px) {
    #btn-calendario {
      bottom: 14px;
      right: 14px;
      padding: 8px 10px 10px;
      gap: 5px;
    }

    #cal-mini {
      width: 70px !important;
      height: 70px !important;
    }

    #cal-modal {
      padding: 22px 18px 20px;
      border-radius: 20px;
    }

    #cal-titulo {
      font-size: 1.15rem;
    }

    #cal-legenda {
      gap: 7px 12px;
    }

    .cal-leg-item {
      font-size: 0.68rem;
    }
  }

  @media (max-width: 380px) {
    #cal-modal {
      padding: 18px 14px 16px;
    }

    #cal-titulo {
      font-size: 1.05rem;
    }
  }

  `;
  document.head.appendChild(style);
}

/* ════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════ */

function iniciarCalendario() {
  injetarCSS();
  criarBotao();
  criarModal();
}

document.addEventListener("DOMContentLoaded", iniciarCalendario);
