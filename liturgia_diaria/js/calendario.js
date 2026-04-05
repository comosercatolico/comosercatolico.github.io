/* =========================
   📅 CALENDÁRIO LITÚRGICO CIRCULAR
   Versão Ultra Detalhada
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

  const canvasMini = document.createElement("canvas");
  canvasMini.width = 90;
  canvasMini.height = 90;
  canvasMini.id = "cal-canvas-mini";

  const label = document.createElement("span");
  label.textContent = "Calendário Litúrgico";

  btn.appendChild(canvasMini);
  btn.appendChild(label);
  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);

  setTimeout(() => desenharCalendario("cal-canvas-mini", 90, true), 150);
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
      <h3>✝ Calendário Litúrgico</h3>
      <p id="cal-semana-info"></p>
      <div id="cal-container">
        <canvas id="cal-canvas-grande"></canvas>
      </div>
      <div id="cal-legenda-container">
        <div class="cal-leg-item"><span style="background:#6a0dad"></span>Advento</div>
        <div class="cal-leg-item"><span style="background:#d4af37"></span>Natal</div>
        <div class="cal-leg-item"><span style="background:#2e7d32"></span>Tempo Comum</div>
        <div class="cal-leg-item"><span style="background:#5a1a7a"></span>Quaresma</div>
        <div class="cal-leg-item"><span style="background:#c8102e"></span>Semana Santa</div>
        <div class="cal-leg-item"><span style="background:#f0c040"></span>Páscoa / Pentecostes</div>
        <div class="cal-leg-item"><span style="background:#00cc66"></span>▌ Semana Atual</div>
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

function abrirModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.add("ativo");
  document.body.style.overflow = "hidden";
  atualizarInfoSemana();

  const tamanho = Math.min(window.innerWidth * 0.80, 580);
  const canvas = document.getElementById("cal-canvas-grande");
  canvas.width = tamanho;
  canvas.height = tamanho;

  setTimeout(() => desenharCalendario("cal-canvas-grande", tamanho, false), 60);
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
  const ini = new Date(hoje);
  ini.setDate(hoje.getDate() - diaSemana);
  const fim = new Date(ini);
  fim.setDate(ini.getDate() + 6);

  const fmt = (d) => `${d.getDate()} de ${meses[d.getMonth()]}`;

  info.innerHTML = `
    <strong>${dias[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}</strong><br>
    <small>Semana litúrgica: ${fmt(ini)} — ${fmt(fim)}</small>
  `;
}

// =========================
// CALCULAR PÁSCOA (algoritmo de Meeus/Jones/Butcher)
// =========================
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
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

// =========================
// CALCULAR INÍCIO DO ADVENTO
// =========================
function calcularInicioAdvento(ano) {
  const natal = new Date(ano, 11, 25);
  const diaNatal = natal.getDay();
  const advento = new Date(natal);
  advento.setDate(25 - diaNatal - 21);
  return advento;
}

// =========================
// CALCULAR SEMANA LITÚRGICA (0..51)
// =========================
function calcularSemanaLiturgica() {
  const hoje = new Date();
  const ano = hoje.getFullYear();

  let inicio = calcularInicioAdvento(ano - 1);
  const proximoAdvento = calcularInicioAdvento(ano);

  if (hoje >= proximoAdvento) inicio = proximoAdvento;

  const diff = hoje - inicio;
  const semana = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(51, semana));
}

// =========================
// ESTRUTURA DO ANO LITÚRGICO
// Baseado no ano litúrgico real com Páscoa calculada
// =========================
function construirAnoLiturgico(anoRef) {
  const inicioAdvento = calcularInicioAdvento(anoRef - 1);
  const pascoa = calcularPascoa(anoRef);

  // Datas-chave
  const natal          = new Date(anoRef - 1, 11, 25);
  const sagradaFamilia = new Date(anoRef - 1, 11, 29);
  const maeDeDeusa     = new Date(anoRef, 0, 1);
  const epifania       = new Date(anoRef, 0, 6);
  const batismoSenhor  = new Date(anoRef, 0, 12);

  const quintaFeira    = new Date(pascoa); quintaFeira.setDate(pascoa.getDate() - 3);
  const sextaFeira     = new Date(pascoa); sextaFeira.setDate(pascoa.getDate() - 2);
  const sabadoSanto    = new Date(pascoa); sabadoSanto.setDate(pascoa.getDate() - 1);
  const domingoPalmas  = new Date(pascoa); domingoPalmas.setDate(pascoa.getDate() - 7);
  const cinzas         = new Date(pascoa); cinzas.setDate(pascoa.getDate() - 46);
  const pentecostes    = new Date(pascoa); pentecostes.setDate(pascoa.getDate() + 49);
  const corpusChristi  = new Date(pascoa); corpusChristi.setDate(pascoa.getDate() + 60);
  const cristoRei      = calcularInicioAdvento(anoRef);
  cristoRei.setDate(cristoRei.getDate() - 7);

  // Semanas calculadas desde início do Advento
  const semanaDe = (data) => {
    const diff = data - inicioAdvento;
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  };

  const totalSemanas = 52;

  // Construir segmentos detalhados
  const segmentos = [];

  // 1. ADVENTO (4 semanas)
  for (let i = 0; i < 4; i++) {
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#6a0dad",
      corClara: "#9b4de0",
      nome: `${i + 1}ª semana`,
      tempo: "Advento"
    });
  }

  // 2. NATAL ao BATISMO
  const sNatal = semanaDe(natal);
  const sBatismo = semanaDe(batismoSenhor) + 1;
  for (let i = sNatal; i < sBatismo; i++) {
    let nome = `${i - sNatal + 1}ª sem.`;
    if (i === sNatal) nome = "Natal";
    else if (i === semanaDe(epifania)) nome = "Epifania";
    else if (i === semanaDe(batismoSenhor)) nome = "Batismo do Senhor";
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#d4af37",
      corClara: "#f0d070",
      nome,
      tempo: "Natal"
    });
  }

  // 3. TEMPO COMUM I (Batismo → Cinzas)
  const sTemComI = sBatismo;
  const sCinzas = semanaDe(cinzas);
  for (let i = sTemComI; i < sCinzas; i++) {
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#1b5e20",
      corClara: "#4caf50",
      nome: `${i - sTemComI + 1}ª sem.`,
      tempo: "Tempo Comum"
    });
  }

  // 4. QUARESMA (Cinzas → Ramos)
  const sPalmas = semanaDe(domingoPalmas);
  for (let i = sCinzas; i < sPalmas; i++) {
    let nome = `${i - sCinzas + 1}ª sem.`;
    if (i === sCinzas) nome = "4ª feira de Cinzas";
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#4a0e6e",
      corClara: "#7b3fa0",
      nome,
      tempo: "Quaresma"
    });
  }

  // 5. SEMANA SANTA
  segmentos.push({
    inicio: sPalmas,
    fim: sPalmas + 1,
    cor: "#c8102e",
    corClara: "#e84060",
    nome: "Dom. de Ramos",
    tempo: "Semana Santa"
  });

  // 6. TRÍDUO PASCAL
  const sTriduo = semanaDe(quintaFeira);
  segmentos.push({
    inicio: sTriduo,
    fim: sTriduo + 1,
    cor: "#8b0000",
    corClara: "#cc2200",
    nome: "Tríduo Pascal",
    tempo: "Tríduo"
  });

  // 7. TEMPO PASCAL (Páscoa → Pentecostes)
  const sPascoa = semanaDe(pascoa);
  const sPentecostes = semanaDe(pentecostes);
  for (let i = sPascoa; i <= sPentecostes; i++) {
    let nome = `${i - sPascoa + 1}ª sem.`;
    if (i === sPascoa) nome = "Páscoa";
    else if (i === sPentecostes) nome = "Pentecostes";
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#c8902e",
      corClara: "#f0c050",
      nome,
      tempo: "Tempo Pascal"
    });
  }

  // 8. TEMPO COMUM II (Pentecostes → Cristo Rei)
  const sTemComII = sPentecostes + 1;
  const sCristoRei = semanaDe(cristoRei);
  for (let i = sTemComII; i <= sCristoRei; i++) {
    let nome = `${i - sTemComII + 1}ª sem.`;
    if (i === semanaDe(corpusChristi)) nome = "Corpus Christi";
    if (i === sCristoRei) nome = "Cristo Rei";
    segmentos.push({
      inicio: i,
      fim: i + 1,
      cor: "#1b5e20",
      corClara: "#4caf50",
      nome,
      tempo: "Tempo Comum"
    });
  }

  return { segmentos, inicioAdvento, totalSemanas: 52 };
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
  const R  = tamanho / 2 - 6;

  const hoje = new Date();
  const ano  = hoje.getFullYear();
  const { segmentos, inicioAdvento } = construirAnoLiturgico(ano);
  const semanaAtual = calcularSemanaLiturgica();
  const totalSemanas = 52;

  const anguloInicio    = -Math.PI / 2; // topo
  const angPorSemana    = (2 * Math.PI) / totalSemanas;

  // ========================
  // FUNDO GERAL
  // ========================
  ctx.fillStyle = mini ? "#111" : "#1a0a00";
  ctx.beginPath();
  ctx.arc(cx, cy, R + 5, 0, 2 * Math.PI);
  ctx.fill();

  // ========================
  // ANÉIS DE REFERÊNCIA (raios)
  // ========================
  const rOuter   = R * 0.97;   // borda externa
  const rDatas   = R * 0.88;   // anel de datas
  const rNomes   = R * 0.75;   // anel de nomes das semanas
  const rTempos  = R * 0.60;   // anel do nome do tempo
  const rInner   = R * 0.52;   // início do centro

  // ========================
  // FATIAS DETALHADAS
  // ========================
  segmentos.forEach((seg) => {
    const a1 = anguloInicio + seg.inicio * angPorSemana;
    const a2 = anguloInicio + seg.fim    * angPorSemana;
    const aMid = (a1 + a2) / 2;

    // -- Anel externo (cor principal) --
    ctx.beginPath();
    ctx.moveTo(cx + rInner * Math.cos(a1), cy + rInner * Math.sin(a1));
    ctx.arc(cx, cy, rOuter, a1, a2);
    ctx.arc(cx, cy, rInner, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = seg.cor;
    ctx.fill();

    // -- Brilho interno --
    const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    grad.addColorStop(0, "rgba(255,255,255,0.18)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.04)");
    grad.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.beginPath();
    ctx.moveTo(cx + rInner * Math.cos(a1), cy + rInner * Math.sin(a1));
    ctx.arc(cx, cy, rOuter, a1, a2);
    ctx.arc(cx, cy, rInner, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // -- Separador entre semanas --
    ctx.beginPath();
    ctx.moveTo(cx + rInner * Math.cos(a1), cy + rInner * Math.sin(a1));
    ctx.lineTo(cx + rOuter * Math.cos(a1), cy + rOuter * Math.sin(a1));
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = mini ? 0.5 : 1;
    ctx.stroke();

    if (!mini) {
      // -- Nome da semana no anel médio --
      if (seg.nome) {
        ctx.save();
        ctx.translate(cx + rNomes * Math.cos(aMid), cy + rNomes * Math.sin(aMid));
        ctx.rotate(aMid + Math.PI / 2);
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `${tamanho * 0.019}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 3;
        ctx.fillText(seg.nome, 0, 0);
        ctx.restore();
      }
    }
  });

  // ========================
  // ANEL DE DATAS (borda externa)
  // ========================
  if (!mini) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, 2 * Math.PI);
    ctx.arc(cx, cy, rDatas, 0, 2 * Math.PI, true);
    ctx.fill();

    // Datas
    for (let i = 0; i < totalSemanas; i++) {
      const ang = anguloInicio + i * angPorSemana + angPorSemana / 2;
      const dataRef = new Date(inicioAdvento);
      dataRef.setDate(inicioAdvento.getDate() + i * 7);
      const label = `${dataRef.getDate()}/${dataRef.getMonth() + 1}`;

      ctx.save();
      ctx.translate(
        cx + (rDatas + 7) * Math.cos(ang),
        cy + (rDatas + 7) * Math.sin(ang)
      );
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,240,0.85)";
      ctx.font = `${tamanho * 0.017}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  // ========================
  // NOMES DOS TEMPOS (anel interno)
  // ========================
  if (!mini) {
    const temposNomes = [
      { nome: "ADVENTO",       angMedio: calcAngMedio(0, 4, totalSemanas, anguloInicio) },
      { nome: "NATAL",         angMedio: calcAngMedio(4, 7, totalSemanas, anguloInicio) },
      { nome: "TEMPO COMUM",   angMedio: calcAngMedio(7, 13, totalSemanas, anguloInicio) },
      { nome: "QUARESMA",      angMedio: calcAngMedio(13, 19, totalSemanas, anguloInicio) },
      { nome: "TEMPO PASCAL",  angMedio: calcAngMedio(20, 27, totalSemanas, anguloInicio) },
      { nome: "TEMPO COMUM",   angMedio: calcAngMedio(27, 51, totalSemanas, anguloInicio) },
    ];

    temposNomes.forEach(({ nome, angMedio }) => {
      ctx.save();
      ctx.translate(
        cx + rTempos * Math.cos(angMedio),
        cy + rTempos * Math.sin(angMedio)
      );
      ctx.rotate(angMedio + Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.60)";
      ctx.font = `bold ${tamanho * 0.021}px 'Libre Baskerville', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "2px";
      ctx.fillText(nome, 0, 0);
      ctx.restore();
    });
  }

  // ========================
  // CÍRCULO CENTRAL DECORATIVO
  // ========================
  // Fundo dourado
  const gradCenter = ctx.createRadialGradient(cx, cy, 0, cx, cy, rInner);
  gradCenter.addColorStop(0, "#fffbe6");
  gradCenter.addColorStop(0.5, "#f0d890");
  gradCenter.addColorStop(1, "#b8860b");

  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, 2 * Math.PI);
  ctx.fillStyle = mini ? "#222" : gradCenter;
  ctx.fill();

  // Borda dourada do centro
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, 2 * Math.PI);
  ctx.strokeStyle = "#c5a96a";
  ctx.lineWidth = mini ? 1 : 3;
  ctx.stroke();

  // Decoração: círculo interno menor
  if (!mini) {
    ctx.beginPath();
    ctx.arc(cx, cy, rInner * 0.75, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(139,111,61,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cruz estilizada
    desenharCruzEstilizada(ctx, cx, cy, rInner * 0.55, tamanho);

    // Alfa e Ômega
    ctx.fillStyle = "#5a3a00";
    ctx.font = `bold ${tamanho * 0.038}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Α", cx - rInner * 0.40, cy + rInner * 0.12);
    ctx.fillText("Ω", cx + rInner * 0.40, cy + rInner * 0.12);
  } else {
    // Mini: só cruz
    ctx.fillStyle = "#c5a96a";
    ctx.font = `bold ${tamanho * 0.35}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✝", cx, cy);
  }

  // ========================
  // BORDA EXTERNA DOURADA
  // ========================
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, 2 * Math.PI);
  ctx.strokeStyle = "#c5a96a";
  ctx.lineWidth = mini ? 1.5 : 3;
  ctx.stroke();

  // Segunda borda
  if (!mini) {
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter - 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(197,169,106,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ========================
  // MARCADOR DA SEMANA ATUAL
  // ========================
  const angAtual = anguloInicio + (semanaAtual + 0.5) * angPorSemana;

  if (!mini) {
    // Sombra do marcador
    ctx.save();
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 20;

    // Linha principal
    ctx.beginPath();
    ctx.moveTo(cx + rInner * 1.02 * Math.cos(angAtual), cy + rInner * 1.02 * Math.sin(angAtual));
    ctx.lineTo(cx + rOuter * 0.99 * Math.cos(angAtual), cy + rOuter * 0.99 * Math.sin(angAtual));
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();

    // Ponto externo
    ctx.beginPath();
    ctx.arc(
      cx + rDatas * Math.cos(angAtual),
      cy + rDatas * Math.sin(angAtual),
      7, 0, 2 * Math.PI
    );
    ctx.fillStyle = "#00ff88";
    ctx.fill();

    ctx.restore();

    // Label "HOJE"
    ctx.save();
    const xL = cx + (rOuter + 14) * Math.cos(angAtual);
    const yL = cy + (rOuter + 14) * Math.sin(angAtual);
    ctx.translate(xL, yL);
    ctx.rotate(angAtual + Math.PI / 2);
    ctx.fillStyle = "#00ff88";
    ctx.font = `bold ${tamanho * 0.026}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.fillText("● HOJE", 0, 0);
    ctx.restore();

  } else {
    // Mini marcador
    ctx.beginPath();
    ctx.moveTo(cx + rInner * 1.02 * Math.cos(angAtual), cy + rInner * 1.02 * Math.sin(angAtual));
    ctx.lineTo(cx + rOuter * Math.cos(angAtual), cy + rOuter * Math.sin(angAtual));
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

// =========================
// ÂNGULO MÉDIO DE UM TRECHO
// =========================
function calcAngMedio(sIni, sFim, total, base) {
  const ang = (2 * Math.PI) / total;
  return base + (sIni + sFim) / 2 * ang;
}

// =========================
// CRUZ ESTILIZADA NO CENTRO
// =========================
function desenharCruzEstilizada(ctx, cx, cy, tamanho, canvasSize) {
  const espessura = tamanho * 0.22;
  const comp      = tamanho * 0.90;
  const transversal = tamanho * 0.60;
  const posT      = tamanho * 0.15;

  // Sombra
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  const gradCruz = ctx.createLinearGradient(cx - espessura, cy - comp, cx + espessura, cy + comp);
  gradCruz.addColorStop(0, "#8b6f3d");
  gradCruz.addColorStop(0.5, "#c5a96a");
  gradCruz.addColorStop(1, "#6b4f2d");

  ctx.fillStyle = gradCruz;

  // Vertical
  arredondadoRect(ctx, cx - espessura / 2, cy - comp, espessura, comp * 2, espessura * 0.3);
  ctx.fill();

  // Horizontal
  arredondadoRect(ctx, cx - transversal / 2, cy - comp + posT, transversal, espessura, espessura * 0.3);
  ctx.fill();

  ctx.restore();
}

function arredondadoRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// =========================
// AUTO INIT
// =========================
document.addEventListener("DOMContentLoaded", iniciarCalendario);
