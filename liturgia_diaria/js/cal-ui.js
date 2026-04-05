/* ================================================
   CALENDÁRIO LITÚRGICO — PARTE 3
   UI: botão, modal, marcador HOJE, render final
   ================================================ */

/* ────────────────────────────────────────────────
   RENDER COMPLETO
──────────────────────────────────────────────── */

function renderCalendario(canvasId, tamanho, mini) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const CAL            = window.CalBase.CAL;
  const buildSegmentos = window.CalBase.buildSegmentos;
  const semanaAtual    = window.CalBase.semanaAtual;
  const desenharFundo  = window.CalBase.desenharFundo;
  const desenharAnelBase = window.CalBase.desenharAnelBase;

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

  // 1. Fundo
  desenharFundo(ctx, cx, cy, R, mini);

  // 2. Fatias coloridas
  desenharAnelBase(ctx, cx, cy, R, segs, total);

  // 3. Separadores de tempo
  desenharSeparadoresTempos(ctx, cx, cy, R, segs, total);

  if (!mini) {
    // 4. Datas na borda
    desenharDatas(ctx, cx, cy, R, inicioAdv, total, tamanho);

    // 5. Nomes das semanas
    desenharNomesSemanas(ctx, cx, cy, R, segs, total, tamanho);

    // 6. Nomes dos tempos
    desenharNomesTempos(ctx, cx, cy, R, segs, total, tamanho);
  }

  // 7. Centro decorativo
  desenharCentro(ctx, cx, cy, R, tamanho, mini);

  // 8. Marcador HOJE
  desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini);
}

/* ────────────────────────────────────────────────
   MARCADOR "HOJE"
──────────────────────────────────────────────── */

function desenharMarcadorHoje(ctx, cx, cy, R, sAtual, total, mini) {
  const CAL    = window.CalBase.CAL;
  const sToAng = window.CalBase.sToAng;

  const ang = sToAng(sAtual, total) + (Math.PI / total);
  const rI  = R * CAL.raios.interno;
  const rO  = R * CAL.raios.externo;
  const rD  = R * CAL.raios.datas;

  if (mini) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx + rI * 1.02 * Math.cos(ang), cy + rI * 1.02 * Math.sin(ang));
    ctx.lineTo(cx + rO * 0.98 * Math.cos(ang), cy + rO * 0.98 * Math.sin(ang));
    ctx.strokeStyle = "#00FF88";
    ctx.lineWidth   = 2.5;
    ctx.shadowColor = "#00FF88";
    ctx.shadowBlur  = 8;
    ctx.lineCap     = "round";
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Linha principal
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + rI * 1.02 * Math.cos(ang), cy + rI * 1.02 * Math.sin(ang));
  ctx.lineTo(cx + rO * 0.99 * Math.cos(ang), cy + rO * 0.99 * Math.sin(ang));
  ctx.strokeStyle = "#00FF88";
  ctx.lineWidth   = 4;
  ctx.lineCap     = "round";
  ctx.shadowColor = "#00FF88";
  ctx.shadowBlur  = 14;
  ctx.stroke();
  ctx.restore();

  // Ponto externo com halo
  ctx.save();
  const px = cx + rD * Math.cos(ang);
  const py = cy + rD * Math.sin(ang);

  const gHalo = ctx.createRadialGradient(px, py, 0, px, py, 14);
  gHalo.addColorStop(0,   "rgba(0,255,136,0.5)");
  gHalo.addColorStop(0.5, "rgba(0,255,136,0.15)");
  gHalo.addColorStop(1,   "rgba(0,255,136,0)");

  ctx.beginPath();
  ctx.arc(px, py, 14, 0, 2 * Math.PI);
  ctx.fillStyle = gHalo;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, 5, 0, 2 * Math.PI);
  ctx.fillStyle   = "#00FF88";
  ctx.shadowColor = "#00FF88";
  ctx.shadowBlur  = 10;
  ctx.fill();
  ctx.restore();

  // Label "HOJE" curvado
  desenharTextoArco(ctx, cx, cy, rO + 14, ang, "● HOJE", "#00FF88", 11);
}

/* ────────────────────────────────────────────────
   TEXTO CURVADO NO ARCO
──────────────────────────────────────────────── */

function desenharTextoArco(ctx, cx, cy, raio, angBase, texto, cor, fontSize) {
  ctx.save();
  ctx.fillStyle    = cor;
  ctx.font         = `bold ${fontSize}px 'Inter', sans-serif`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = cor;
  ctx.shadowBlur   = 8;

  const charWidth = fontSize * 0.6;
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
   BOTÃO MINIATURA NO HEADER
──────────────────────────────────────────────── */

function criarBotao() {
  const header = document.querySelector(".liturgia-super-header");
  if (!header) return;

  const btn = document.createElement("button");
  btn.id    = "btn-calendario";
  btn.title = "Calendário Litúrgico";

  const canvasMini  = document.createElement("canvas");
  canvasMini.id     = "cal-mini";
  canvasMini.width  = 88;
  canvasMini.height = 88;

  const label       = document.createElement("span");
  label.textContent = "Calendário";

  btn.appendChild(canvasMini);
  btn.appendChild(label);
  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);

  setTimeout(() => renderCalendario("cal-mini", 88, true), 200);
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
        <div>
          <h3 id="cal-titulo">Calendário Litúrgico</h3>
          <p id="cal-data-texto"></p>
        </div>
        <button id="cal-fechar" aria-label="Fechar">✕</button>
      </div>

      <div id="cal-canvas-wrap">
        <canvas id="cal-grande"></canvas>
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

  document.getElementById("cal-fechar").addEventListener("click", fecharModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });
}

function legendaHTML() {
  const itens = [
    { cor: "#7B2FBE", nome: "Advento"      },
    { cor: "#C8A84B", nome: "Natal"         },
    { cor: "#2D6A2D", nome: "Tempo Comum"   },
    { cor: "#4A1060", nome: "Quaresma"      },
    { cor: "#8B0000", nome: "Semana Santa"  },
    { cor: "#B8860B", nome: "Tempo Pascal"  },
    { cor: "#CC2200", nome: "Pentecostes"   },
    { cor: "#00FF88", nome: "Semana Atual"  },
  ];

  return itens.map(({ cor, nome }) => `
    <div class="cal-leg">
      <span class="cal-leg-cor" style="background:${cor}"></span>
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

  const maxW = Math.min(window.innerWidth  * 0.82, 560);
  const maxH = window.innerHeight * 0.60;
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
   DATA / SEMANA ATUAL
──────────────────────────────────────────────── */

function atualizarDataTexto() {
  const el = document.getElementById("cal-data-texto");
  if (!el) return;

  const hoje  = new Date();
  const dias  = ["Domingo","Segunda","Terça","Quarta",
                 "Quinta","Sexta","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const dow = hoje.getDay();
  const ini = new Date(hoje); ini.setDate(hoje.getDate() - dow);
  const fim = new Date(ini);  fim.setDate(ini.getDate() + 6);

  const fmt = (d) => `${d.getDate()} de ${meses[d.getMonth()]}`;

  el.innerHTML = `
    ${dias[dow]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}
    <br><small>Semana: ${fmt(ini)} — ${fmt(fim)}</small>
  `;
}

/* ────────────────────────────────────────────────
   CSS INJETADO
──────────────────────────────────────────────── */

function injetarCSS() {
  const style = document.createElement("style");
  style.textContent = `

  #btn-calendario {
    position: absolute;
    bottom: 22px;
    right: 28px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(197,169,106,0.35);
    border-radius: 14px;
    padding: 10px 14px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: background 0.25s, transform 0.25s, box-shadow 0.25s;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 20;
    color: rgba(255,255,255,0.70);
    font-size: 0.68rem;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  #btn-calendario:hover {
    background: rgba(197,169,106,0.14);
    border-color: rgba(197,169,106,0.60);
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0,0,0,0.40);
    color: #f0d890;
  }

  #cal-mini {
    border-radius: 50%;
    display: block;
    border: 1.5px solid rgba(197,169,106,0.45);
    box-shadow: 0 4px 16px rgba(0,0,0,0.45);
  }

  #cal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.30s ease;
  }

  #cal-overlay.ativo {
    opacity: 1;
    pointer-events: all;
  }

  #cal-modal {
    background: #0f0c06;
    border: 1px solid rgba(197,169,106,0.28);
    border-radius: 24px;
    padding: 28px 24px 22px;
    width: min(92vw, 620px);
    max-height: 92vh;
    overflow-y: auto;
    position: relative;
    box-shadow:
      0 0 0 1px rgba(197,169,106,0.10),
      0 32px 80px rgba(0,0,0,0.70);
    transform: scale(0.90) translateY(16px);
    transition: transform 0.32s cubic-bezier(0.34, 1.48, 0.64, 1);
    scrollbar-width: thin;
    scrollbar-color: rgba(197,169,106,0.3) transparent;
  }

  #cal-overlay.ativo #cal-modal {
    transform: scale(1) translateY(0);
  }

  #cal-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 12px;
  }

  #cal-titulo {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.25rem;
    color: #e8cc7a;
    margin: 0 0 5px;
    letter-spacing: 0.5px;
  }

  #cal-data-texto {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.50);
    margin: 0;
    line-height: 1.65;
  }

  #cal-data-texto small {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.35);
  }

  #cal-fechar {
    flex-shrink: 0;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.55);
    font-size: 0.9rem;
    transition: background 0.2s, color 0.2s;
    line-height: 1;
  }

  #cal-fechar:hover {
    background: rgba(255,255,255,0.12);
    color: white;
  }

  #cal-canvas-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px 0;
  }

  #cal-grande {
    border-radius: 50%;
    display: block;
    max-width: 100%;
    box-shadow:
      0 0 50px rgba(197,169,106,0.12),
      0 16px 40px rgba(0,0,0,0.55);
  }

  #cal-legenda {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    justify-content: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  .cal-leg {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.76rem;
    color: rgba(255,255,255,0.52);
    font-family: 'Inter', sans-serif;
  }

  .cal-leg-cor {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.12);
  }

  .cal-leg-nome {
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    #btn-calendario {
      bottom: 12px;
      right: 12px;
      padding: 8px 10px;
    }
    #cal-modal {
      padding: 22px 16px 18px;
      border-radius: 20px;
    }
    #cal-titulo {
      font-size: 1.1rem;
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
