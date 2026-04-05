/* =========================
   📅 CALENDÁRIO LITÚRGICO CIRCULAR
   Desenhado com Canvas — sem imagem externa
========================= */

function iniciarCalendario() {
  criarBotaoCalendario();
  criarModal();
}

// =========================
// BOTÃO MINIATURA
// =========================
function criarBotaoCalendario() {
  const header = document.querySelector(".liturgia-super-header");
  if (!header) return;

  const btn = document.createElement("button");
  btn.id = "btn-calendario";
  btn.title = "Calendário Litúrgico";

  // Canvas miniatura
  const canvasMini = document.createElement("canvas");
  canvasMini.width = 80;
  canvasMini.height = 80;
  canvasMini.id = "cal-canvas-mini";

  btn.appendChild(canvasMini);

  const label = document.createElement("span");
  label.textContent = "Calendário Litúrgico";
  btn.appendChild(label);

  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);

  // Desenhar miniatura
  setTimeout(() => desenharCalendario("cal-canvas-mini", 80, true), 100);
}

// =========================
// MODAL
// =========================
function criarModal() {
  const overlay = document.createElement("div");
  overlay.id = "cal-overlay";
  overlay.innerHTML = `
    <div id="cal-modal">
      <button id="cal-fechar" title="Fechar">✕</button>
      <h3>📅 Calendário Litúrgico</h3>
      <p id="cal-semana-info"></p>
      <div id="cal-container">
        <canvas id="cal-canvas-grande"></canvas>
      </div>
      <p id="cal-legenda">
        🟢 Marcador verde = semana atual
      </p>
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

function abrirModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.add("ativo");
  document.body.style.overflow = "hidden";

  atualizarInfoSemana();

  // Tamanho responsivo
  const tamanho = Math.min(window.innerWidth * 0.75, 520);
  const canvas = document.getElementById("cal-canvas-grande");
  canvas.width = tamanho;
  canvas.height = tamanho;

  setTimeout(() => desenharCalendario("cal-canvas-grande", tamanho, false), 50);
}

function fecharModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  document.body.style.overflow = "";
}

// =========================
// INFO SEMANA
// =========================
function atualizarInfoSemana() {
  const info = document.getElementById("cal-semana-info");
  if (!info) return;

  const hoje = new Date();
  const dias = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira",
                "Quinta-feira","Sexta-feira","Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const diaSemana = hoje.getDay();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - diaSemana);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const fmt = (d) => `${d.getDate()} de ${meses[d.getMonth()]}`;

  info.innerHTML = `
    <strong>${dias[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}</strong><br>
    <small>Semana: ${fmt(inicioSemana)} — ${fmt(fimSemana)}</small>
  `;
}

// =========================
// 🎨 DESENHAR CALENDÁRIO
// =========================
function desenharCalendario(canvasId, tamanho, mini) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width = tamanho;
  canvas.height = tamanho;

  const cx = tamanho / 2;
  const cy = tamanho / 2;
  const R = tamanho / 2 - 4;

  // Calcular semana litúrgica atual
  const semanaAtual = calcularSemanaLiturgica();

  // ========================
  // TEMPOS LITÚRGICOS
  // Cada tempo tem: nome, cor, semanas, começando do Advento (topo)
  // ========================
  const tempos = [
    { nome: "Advento",        cor: "#6a0dad", semanas: 4  },
    { nome: "Natal",          cor: "#d4af37", semanas: 3  },
    { nome: "Tempo Comum I",  cor: "#2e7d32", semanas: 5  },
    { nome: "Quaresma",       cor: "#4a2060", semanas: 6  },
    { nome: "Páscoa",         cor: "#d4af37", semanas: 7  },
    { nome: "Tempo Comum II", cor: "#2e7d32", semanas: 27 },
  ];

  const totalSemanas = tempos.reduce((s, t) => s + t.semanas, 0); // 52

  // Ângulo de início: topo = -90° = Advento
  const anguloInicio = -Math.PI / 2;
  const anguloPorSemana = (2 * Math.PI) / totalSemanas;

  // ========================
  // FUNDO
  // ========================
  ctx.fillStyle = mini ? "#1a1a1a" : "#faf8f4";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fill();

  // ========================
  // FATIAS DOS TEMPOS
  // ========================
  let semanaAcum = 0;

  tempos.forEach((tempo) => {
    const angStart = anguloInicio + semanaAcum * anguloPorSemana;
    const angEnd = anguloInicio + (semanaAcum + tempo.semanas) * anguloPorSemana;

    // Anel externo (cor do tempo)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.95, angStart, angEnd);
    ctx.closePath();
    ctx.fillStyle = tempo.cor;
    ctx.fill();
    ctx.strokeStyle = mini ? "#1a1a1a" : "#faf8f4";
    ctx.lineWidth = mini ? 0.5 : 1.5;
    ctx.stroke();

    // Anel interno (tom mais claro)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * 0.65, angStart, angEnd);
    ctx.closePath();
    ctx.fillStyle = tempo.cor + "55";
    ctx.fill();

    // Nome do tempo (só no grande)
    if (!mini && tempo.semanas >= 4) {
      const angMedio = angStart + (angEnd - angStart) / 2;
      const raioTexto = R * 0.80;
      ctx.save();
      ctx.translate(
        cx + raioTexto * Math.cos(angMedio),
        cy + raioTexto * Math.sin(angMedio)
      );
      ctx.rotate(angMedio + Math.PI / 2);
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.max(7, tamanho * 0.022)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(tempo.nome.toUpperCase(), 0, 0);
      ctx.restore();
    }

    semanaAcum += tempo.semanas;
  });

  // ========================
  // LINHAS DIVISÓRIAS POR SEMANA
  // ========================
  if (!mini) {
    for (let i = 0; i < totalSemanas; i++) {
      const ang = anguloInicio + i * anguloPorSemana;
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.60 * Math.cos(ang), cy + R * 0.60 * Math.sin(ang));
      ctx.lineTo(cx + R * 0.96 * Math.cos(ang), cy + R * 0.96 * Math.sin(ang));
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // ========================
  // DATAS NAS BORDAS (grande)
  // ========================
  if (!mini) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    // Semana 0 = 1ª semana do Advento (último domingo de novembro ou 1º de dezembro aprox)
    // Calcular data do início do Advento do ano litúrgico atual
    const inicioAdvento = calcularInicioAdvento(anoAtual - 1);

    for (let i = 0; i < totalSemanas; i += 2) {
      const ang = anguloInicio + i * anguloPorSemana + anguloPorSemana / 2;
      const raioData = R * 0.99;

      const dataRef = new Date(inicioAdvento);
      dataRef.setDate(inicioAdvento.getDate() + i * 7);

      const dia = dataRef.getDate();
      const mes = dataRef.getMonth() + 1;
      const label = `${dia}/${mes}`;

      ctx.save();
      ctx.translate(
        cx + raioData * Math.cos(ang),
        cy + raioData * Math.sin(ang)
      );
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `${tamanho * 0.018}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  // ========================
  // CÍRCULO CENTRAL
  // ========================
  const gradCenter = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
  gradCenter.addColorStop(0, "#fff8ee");
  gradCenter.addColorStop(1, "#f0e8d0");

  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = mini ? "#2a2a2a" : gradCenter;
  ctx.fill();
  ctx.strokeStyle = "#c5a96a";
  ctx.lineWidth = mini ? 1 : 2.5;
  ctx.stroke();

  // Cruz no centro
  if (!mini) {
    desenharCruz(ctx, cx, cy, R * 0.18, "#8b6f3d");
    ctx.fillStyle = "#8b6f3d";
    ctx.font = `bold ${tamanho * 0.045}px Libre Baskerville, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✝", cx, cy + R * 0.22);
  } else {
    ctx.fillStyle = "#c5a96a";
    ctx.font = `bold ${tamanho * 0.3}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✝", cx, cy);
  }

  // ========================
  // MARCADOR DA SEMANA ATUAL
  // ========================
  if (!mini) {
    const angMarcador = anguloInicio + (semanaAtual + 0.5) * anguloPorSemana;

    // Linha brilhante
    const x1 = cx + R * 0.58 * Math.cos(angMarcador);
    const y1 = cy + R * 0.58 * Math.sin(angMarcador);
    const x2 = cx + R * 0.96 * Math.cos(angMarcador);
    const y2 = cy + R * 0.96 * Math.sin(angMarcador);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ponto no marcador
    ctx.beginPath();
    ctx.arc(
      cx + R * 0.92 * Math.cos(angMarcador),
      cy + R * 0.92 * Math.sin(angMarcador),
      5, 0, 2 * Math.PI
    );
    ctx.fillStyle = "#00ff88";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label "HOJE"
    ctx.save();
    const xLabel = cx + R * 1.05 * Math.cos(angMarcador);
    const yLabel = cy + R * 1.05 * Math.sin(angMarcador);
    ctx.translate(xLabel, yLabel);
    ctx.rotate(angMarcador + Math.PI / 2);
    ctx.fillStyle = "#00ff88";
    ctx.font = `bold ${tamanho * 0.025}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("HOJE", 0, 0);
    ctx.restore();
  } else {
    // Mini: só uma linha
    const angMarcador = anguloInicio + (semanaAtual + 0.5) * anguloPorSemana;
    const x1 = cx + R * 0.55 * Math.cos(angMarcador);
    const y1 = cy + R * 0.55 * Math.sin(angMarcador);
    const x2 = cx + R * 0.92 * Math.cos(angMarcador);
    const y2 = cy + R * 0.92 * Math.sin(angMarcador);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ========================
  // BORDA FINAL
  // ========================
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.95, 0, 2 * Math.PI);
  ctx.strokeStyle = "#c5a96a";
  ctx.lineWidth = mini ? 1 : 2;
  ctx.stroke();
}

// =========================
// DESENHAR CRUZ
// =========================
function desenharCruz(ctx, cx, cy, tamanho, cor) {
  ctx.fillStyle = cor;
  // Vertical
  ctx.fillRect(cx - tamanho * 0.15, cy - tamanho, tamanho * 0.3, tamanho * 2);
  // Horizontal
  ctx.fillRect(cx - tamanho, cy - tamanho * 0.5, tamanho * 2, tamanho * 0.3);
}

// =========================
// CALCULAR INÍCIO DO ADVENTO
// =========================
function calcularInicioAdvento(ano) {
  // Advento começa no domingo mais próximo de 30 de novembro
  const natal = new Date(ano, 11, 25);
  const diaNatal = natal.getDay(); // 0=Dom ... 6=Sab
  const diasParaDomingo = diaNatal === 0 ? 0 : 7 - diaNatal;
  const domingoAntes = new Date(natal);
  domingoAntes.setDate(25 - diaNatal);

  // 4 domingos antes do Natal
  const advento = new Date(domingoAntes);
  advento.setDate(domingoAntes.getDate() - 21);

  return advento;
}

// =========================
// CALCULAR SEMANA LITÚRGICA ATUAL (0-51)
// =========================
function calcularSemanaLiturgica() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  // Tenta o ano litúrgico atual (começa no advento do ano anterior)
  let inicioAdvento = calcularInicioAdvento(anoAtual - 1);
  let fimAdvento = calcularInicioAdvento(anoAtual);

  // Se hoje é antes do Advento deste ano
  if (hoje >= fimAdvento) {
    inicioAdvento = fimAdvento;
  }

  const diff = hoje - inicioAdvento;
  const semana = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));

  return Math.max(0, Math.min(51, semana));
}

// =========================
// AUTO INIT
// =========================
document.addEventListener("DOMContentLoaded", iniciarCalendario);
