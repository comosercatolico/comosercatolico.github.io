/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 3  (REDESIGN)
   UI: botão, modal, marcador HOJE, render final
   ================================================ */

/* ────────────────────────────────────────────────
   RENDER COMPLETO
──────────────────────────────────────────────── */

function renderCalendario(canvasId, tamanho, mini) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const CAL               = window.CalBase.CAL;
  const buildSegmentos    = window.CalBase.buildSegmentos;
  const semanaAtual       = window.CalBase.semanaAtual;
  const desenharFundo     = window.CalBase.desenharFundo;
  const desenharAnelBase  = window.CalBase.desenharAnelBase;

  const desenharDatas             = window.CalDetalhes.desenharDatas;
  const desenharNomesSemanas      = window.CalDetalhes.desenharNomesSemanas;
  const desenharNomesTempos       = window.CalDetalhes.desenharNomesTempos;
  const desenharSeparadoresTempos = window.CalDetalhes.desenharSeparadoresTempos;
  const desenharCentro            = window.CalDetalhes.desenharCentro;

  const ctx = canvas.getContext("2d");
  canvas.width  = tamanho;
  canvas.height = tamanho;

  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const R  = tamanho / 2 - 6;

  const ano = new Date().getFullYear();
  const { segs, inicioAdv, total } = buildSegmentos(ano);
  const sAtual = semanaAtual();

  desenharFundo(ctx, cx, cy, R, mini);
  desenharAnelBase(ctx, cx, cy, R, segs, total);
  desenharSeparadoresTempos(ctx, cx, cy, R, segs, total);

  if (!mini) {
    desenharDatas(ctx, cx, cy, R, inicioAdv, total, tamanho);
    desenharNomesSemanas(ctx, cx, cy, R, segs, total, tamanho);
    desenharNomesTempos(ctx, cx, cy, R, segs, total, tamanho);
  }

  desenharCentro(ctx, cx, cy, R, tamanho, mini);
  desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini);
}

/* ────────────────────────────────────────────────
   MARCADOR "HOJE"  —  visual mais limpo
──────────────────────────────────────────────── */

function desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const ang = sToAng(sAtual, total) + (Math.PI / total);
  const rI  = R * CAL.raios.interno;
  const rO  = R * CAL.raios.externo;
  const rD  = R * CAL.raios.datas;

  /* ── versão MINI ── */
  if (mini) {
    ctx.save();

    // linha brilhante
    ctx.beginPath();
    ctx.moveTo(cx + rI * 1.02 * Math.cos(ang), cy + rI * 1.02 * Math.sin(ang));
    ctx.lineTo(cx + rO * 0.98 * Math.cos(ang), cy + rO * 0.98 * Math.sin(ang));
    ctx.strokeStyle = "#34EE8A";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.shadowColor = "#34EE8A";
    ctx.shadowBlur  = 10;
    ctx.stroke();

    // ponto externo
    const px = cx + rO * 0.98 * Math.cos(ang);
    const py = cy + rO * 0.98 * Math.sin(ang);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#34EE8A";
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
    return;
  }

  /* ── versão GRANDE ── */

  // linha principal com gradiente
  ctx.save();
  const x1 = cx + rI * 1.02 * Math.cos(ang);
  const y1 = cy + rI * 1.02 * Math.sin(ang);
  const x2 = cx + rO * 0.99 * Math.cos(ang);
  const y2 = cy + rO * 0.99 * Math.sin(ang);

  const gLinha = ctx.createLinearGradient(x1, y1, x2, y2);
  gLinha.addColorStop(0,   "rgba(52,238,138,0.4)");
  gLinha.addColorStop(0.5, "rgba(52,238,138,1)");
  gLinha.addColorStop(1,   "rgba(52,238,138,0.7)");

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = gLinha;
  ctx.lineWidth   = 3.5;
  ctx.lineCap     = "round";
  ctx.shadowColor = "#34EE8A";
  ctx.shadowBlur  = 18;
  ctx.stroke();
  ctx.restore();

  // halo + ponto
  ctx.save();
  const px = cx + rD * Math.cos(ang);
  const py = cy + rD * Math.sin(ang);

  // halo externo suave
  const gHalo = ctx.createRadialGradient(px, py, 0, px, py, 18);
  gHalo.addColorStop(0,   "rgba(52,238,138,0.40)");
  gHalo.addColorStop(0.45,"rgba(52,238,138,0.12)");
  gHalo.addColorStop(1,   "rgba(52,238,138,0)");

  ctx.beginPath();
  ctx.arc(px, py, 18, 0, Math.PI * 2);
  ctx.fillStyle = gHalo;
  ctx.fill();

  // anel branco fino
  ctx.beginPath();
  ctx.arc(px, py, 6.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.90)";
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = "#34EE8A";
  ctx.shadowBlur  = 12;
  ctx.stroke();

  // núcleo sólido
  ctx.beginPath();
  ctx.arc(px, py, 4.5, 0, Math.PI * 2);
  ctx.fillStyle   = "#34EE8A";
  ctx.shadowColor = "#34EE8A";
  ctx.shadowBlur  = 16;
  ctx.fill();
  ctx.restore();

  // label "HOJE" curvado
  desenharTextoArco(ctx, cx, cy, rO + 16, ang, "◆ HOJE", "#34EE8A", 10.5);
}

/* ────────────────────────────────────────────────
   TEXTO CURVADO
──────────────────────────────────────────────── */

function desenharTextoArco(ctx, cx, cy, raio, angBase, texto, cor, fontSize) {
  ctx.save();
  ctx.fillStyle    = cor;
  ctx.font         = `700 ${fontSize}px 'Inter', sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = cor;
  ctx.shadowBlur   = 10;
  ctx.globalAlpha  = 0.92;

  const charWidth = fontSize * 0.58;
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

/* ────────────────────────────────────────────────
   BOTÃO MINIATURA
──────────────────────────────────────────────── */

function criarBotao() {
  const header = document.querySelector(".liturgia-super-header");
  if (!header) return;

  const btn   = document.createElement("button");
  btn.id      = "btn-calendario";
  btn.title   = "Calendário Litúrgico";

  // pill de status "AO VIVO"
  const pill       = document.createElement("span");
  pill.id          = "cal-btn-pill";
  pill.textContent = "AO VIVO";

  const canvasMini  = document.createElement("canvas");
  canvasMini.id     = "cal-mini";
  canvasMini.width  = 80;
  canvasMini.height = 80;

  const label       = document.createElement("span");
  label.id          = "cal-btn-label";
  label.textContent = "Calendário";

  btn.appendChild(pill);
  btn.appendChild(canvasMini);
  btn.appendChild(label);
  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);

  setTimeout(() => renderCalendario("cal-mini", 80, true), 200);
}

/* ────────────────────────────────────────────────
   MODAL
──────────────────────────────────────────────── */

function criarModal() {
  const overlay = document.createElement("div");
  overlay.id    = "cal-overlay";

  overlay.innerHTML = `
    <div id="cal-modal" role="dialog" aria-modal="true" aria-label="Calendário Litúrgico">

      <div id="cal-modal-header">
        <div id="cal-header-left">
          <span id="cal-chip">Ano Litúrgico ${new Date().getFullYear()}</span>
          <h3 id="cal-titulo">Calendário Litúrgico</h3>
          <p id="cal-data-texto"></p>
        </div>
        <button id="cal-fechar" aria-label="Fechar">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div id="cal-divider"></div>

      <div id="cal-canvas-wrap">
        <canvas id="cal-grande"></canvas>
        <div id="cal-canvas-glow"></div>
      </div>

      <div id="cal-legenda">
        ${legendaHTML()}
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal();
  });

  document.getElementById("cal-fechar")
          .addEventListener("click", fecharModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });
}

/* ────────────────────────────────────────────────
   LEGENDA
──────────────────────────────────────────────── */

function legendaHTML() {
  const itens = [
    { cor: "#7B2FBE", nome: "Advento"      },
    { cor: "#C8A84B", nome: "Natal"        },
    { cor: "#2D6A2D", nome: "Tempo Comum"  },
    { cor: "#4A1060", nome: "Quaresma"     },
    { cor: "#8B0000", nome: "Semana Santa" },
    { cor: "#B8860B", nome: "Tempo Pascal" },
    { cor: "#CC2200", nome: "Pentecostes"  },
    { cor: "#34EE8A", nome: "Hoje"         },
  ];

  return itens.map(({ cor, nome }) => `
    <div class="cal-leg">
      <span class="cal-leg-cor" style="--c:${cor}; background:${cor}"></span>
      <span class="cal-leg-nome">${nome}</span>
    </div>
  `).join("");
}

/* ────────────────────────────────────────────────
   ABRIR / FECHAR
──────────────────────────────────────────────── */

function abrirModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;

  atualizarDataTexto();
  overlay.classList.add("ativo");
  document.body.style.overflow = "hidden";

  const maxW = Math.min(window.innerWidth  * 0.82, 540);
  const maxH = window.innerHeight * 0.58;
  const tam  = Math.floor(Math.min(maxW, maxH));

  requestAnimationFrame(() => {
    setTimeout(() => renderCalendario("cal-grande", tam, false), 80);
  });
}

function fecharModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  document.body.style.overflow = "";
}

/* ────────────────────────────────────────────────
   DATA ATUAL
──────────────────────────────────────────────── */

function atualizarDataTexto() {
  const el = document.getElementById("cal-data-texto");
  if (!el) return;

  const hoje  = new Date();
  const dias  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const dow = hoje.getDay();
  const ini = new Date(hoje); ini.setDate(hoje.getDate() - dow);
  const fim = new Date(ini);  fim.setDate(ini.getDate() + 6);

  const fmt = (d) => `${d.getDate()} de ${meses[d.getMonth()]}`;

  el.innerHTML = `
    <span class="cal-data-dia">${dias[dow]}</span>,
    ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}
    <br>
    <span class="cal-data-semana">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
           style="vertical-align:middle; margin-right:3px">
        <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/>
        <path d="M5 2.5V5l1.5 1.5" stroke="currentColor"
              stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      ${fmt(ini)} — ${fmt(fim)}
    </span>
  `;
}

/* ────────────────────────────────────────────────
   CSS INJETADO  —  redesign moderno
──────────────────────────────────────────────── */

function injetarCSS() {
  const style = document.createElement("style");
  style.textContent = `

  /* ── BOTÃO ──────────────────────────────────── */

  #btn-calendario {
    position: absolute;
    bottom: 20px;
    right: 24px;
    background: rgba(15, 12, 6, 0.75);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px;
    padding: 10px 14px 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: 20;
  }

  #btn-calendario:hover {
    border-color: rgba(52,238,138,0.35);
    box-shadow:
      0 0 0 1px rgba(52,238,138,0.15),
      0 12px 32px rgba(0,0,0,0.50);
    transform: translateY(-3px);
  }

  #cal-btn-pill {
    font-size: 0.55rem;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #34EE8A;
    background: rgba(52,238,138,0.12);
    border: 1px solid rgba(52,238,138,0.30);
    border-radius: 99px;
    padding: 2px 7px;
    display: flex;
    align-items: center;
    gap: 4px;
    line-height: 1.6;
  }

  #cal-btn-pill::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #34EE8A;
    box-shadow: 0 0 6px #34EE8A;
    animation: cal-pulse 2s ease infinite;
  }

  @keyframes cal-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.75); }
  }

  #cal-mini {
    border-radius: 50%;
    display: block;
    border: 1.5px solid rgba(255,255,255,0.10);
    box-shadow: 0 4px 20px rgba(0,0,0,0.55);
  }

  #cal-btn-label {
    font-family: 'Inter', sans-serif;
    font-size: 0.64rem;
    font-weight: 500;
    letter-spacing: 0.5px;
    color: rgba(255,255,255,0.50);
    text-transform: uppercase;
  }

  /* ── OVERLAY ────────────────────────────────── */

  #cal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(14px) saturate(0.6);
    -webkit-backdrop-filter: blur(14px) saturate(0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.28s ease;
  }

  #cal-overlay.ativo {
    opacity: 1;
    pointer-events: all;
  }

  /* ── MODAL ──────────────────────────────────── */

  #cal-modal {
    background: linear-gradient(
      155deg,
      rgba(18, 14, 8, 0.98) 0%,
      rgba(10, 8, 4, 0.99)  100%
    );
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 28px;
    padding: 28px 26px 24px;
    width: min(94vw, 620px);
    max-height: 94vh;
    overflow-y: auto;
    position: relative;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 40px 90px rgba(0,0,0,0.80),
      0  0 120px rgba(52,238,138,0.04);
    transform: scale(0.93) translateY(20px);
    transition: transform 0.34s cubic-bezier(0.34,1.42,0.64,1);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  #cal-overlay.ativo #cal-modal {
    transform: scale(1) translateY(0);
  }

  /* ── HEADER ─────────────────────────────────── */

  #cal-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  #cal-header-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  #cal-chip {
    display: inline-flex;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: rgba(197,169,106,0.80);
    background: rgba(197,169,106,0.08);
    border: 1px solid rgba(197,169,106,0.18);
    border-radius: 99px;
    padding: 3px 10px;
    width: fit-content;
  }

  #cal-titulo {
    font-family: 'Libre Baskerville', Georgia, serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #f0e4b8;
    margin: 0;
    letter-spacing: 0.3px;
    line-height: 1.25;
  }

  #cal-data-texto {
    font-family: 'Inter', sans-serif;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.40);
    margin: 0;
    line-height: 1.8;
  }

  .cal-data-dia {
    color: rgba(255,255,255,0.65);
    font-weight: 500;
  }

  .cal-data-semana {
    font-size: 0.76rem;
    color: rgba(255,255,255,0.28);
    display: inline-flex;
    align-items: center;
  }

  #cal-fechar {
    flex-shrink: 0;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.45);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  #cal-fechar:hover {
    background: rgba(255,255,255,0.10);
    border-color: rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.90);
  }

  /* ── DIVISOR ────────────────────────────────── */

  #cal-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.06) 30%,
      rgba(255,255,255,0.06) 70%,
      transparent
    );
    margin-bottom: 22px;
  }

  /* ── CANVAS ÁREA ────────────────────────────── */

  #cal-canvas-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 8px 0;
  }

  #cal-canvas-glow {
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(52,238,138,0.05) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
  }

  #cal-grande {
    border-radius: 50%;
    display: block;
    max-width: 100%;
    position: relative;
    z-index: 1;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.05),
      0 20px 60px rgba(0,0,0,0.65),
      0  0  80px rgba(52,238,138,0.06);
  }

  /* ── LEGENDA ────────────────────────────────── */

  #cal-legenda {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    justify-content: center;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .cal-leg {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Inter', sans-serif;
    font-size: 0.73rem;
    font-weight: 450;
    color: rgba(255,255,255,0.40);
    transition: color 0.2s;
    cursor: default;
  }

  .cal-leg:hover {
    color: rgba(255,255,255,0.75);
  }

  .cal-leg-cor {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
    box-shadow: 0 0 8px var(--c, transparent);
    opacity: 0.85;
  }

  .cal-leg-nome {
    white-space: nowrap;
    letter-spacing: 0.2px;
  }

  /* ── RESPONSIVO ─────────────────────────────── */

  @media (max-width: 600px) {
    #btn-calendario {
      bottom: 14px;
      right: 14px;
      padding: 8px 10px 10px;
    }

    #cal-modal {
      padding: 22px 18px 20px;
      border-radius: 22px;
    }

    #cal-titulo {
      font-size: 1.15rem;
    }

    #cal-legenda {
      gap: 7px 12px;
    }
  }

  `;
  document.head.appendChild(style);
}

/* ────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────── */

function iniciarCalendario() {
  injetarCSS();
  criarBotao();
  criarModal();
}

document.addEventListener("DOMContentLoaded", iniciarCalendario);
