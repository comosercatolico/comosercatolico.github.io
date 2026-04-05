/* =========================
   📅 CALENDÁRIO LITÚRGICO
========================= */

const CALENDARIO_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Calendario_liturgico.svg/1200px-Calendario_liturgico.svg.png";

// =========================
// INICIALIZAR
// =========================
function iniciarCalendario() {
  criarBotaoCalendario();
  criarModal();
}

// =========================
// BOTÃO (miniatura no header)
// =========================
function criarBotaoCalendario() {
  const header = document.querySelector(".liturgia-super-header");
  if (!header) return;

  const btn = document.createElement("button");
  btn.id = "btn-calendario";
  btn.title = "Calendário Litúrgico";
  btn.innerHTML = `
    <img 
      src="${CALENDARIO_IMG}" 
      alt="Calendário Litúrgico"
      id="cal-thumb"
    />
    <span>Calendário Litúrgico</span>
  `;

  btn.addEventListener("click", abrirModal);
  header.appendChild(btn);
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
        <img 
          src="${CALENDARIO_IMG}" 
          alt="Calendário Litúrgico Circular"
          id="cal-imagem"
        />
        <div id="cal-destaque"></div>
      </div>
      <p id="cal-legenda">
        A semana atual está indicada pelo marcador
      </p>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal();
  });

  document.getElementById("cal-fechar")?.addEventListener("click", fecharModal);
  document.body.appendChild(overlay);

  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
  });

  // Evento de fechar após overlay ser inserido no DOM
  document.getElementById("cal-fechar").addEventListener("click", fecharModal);
}

function abrirModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;

  overlay.classList.add("ativo");
  document.body.style.overflow = "hidden";

  // Aguarda imagem carregar para posicionar marcador
  const img = document.getElementById("cal-imagem");
  if (img.complete) {
    posicionarMarcador();
  } else {
    img.onload = posicionarMarcador;
  }

  // Info da semana atual
  atualizarInfoSemana();
}

function fecharModal() {
  const overlay = document.getElementById("cal-overlay");
  if (!overlay) return;
  overlay.classList.remove("ativo");
  document.body.style.overflow = "";
}

// =========================
// SEMANA ATUAL
// =========================
function atualizarInfoSemana() {
  const info = document.getElementById("cal-semana-info");
  if (!info) return;

  const hoje = new Date();
  const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
                "Quinta-feira", "Sexta-feira", "Sábado"];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  // Início da semana (domingo)
  const diaSemana = hoje.getDay();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - diaSemana);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const formatarData = (d) =>
    `${d.getDate()} de ${meses[d.getMonth()]}`;

  info.innerHTML = `
    <strong>${dias[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}</strong><br>
    <small>Semana: ${formatarData(inicioSemana)} — ${formatarData(fimSemana)}</small>
  `;
}

// =========================
// POSICIONAR MARCADOR
// =========================
function posicionarMarcador() {
  const destaque = document.getElementById("cal-destaque");
  const container = document.getElementById("cal-container");
  if (!destaque || !container) return;

  // Calcular semana do ano (0-51)
  const hoje = new Date();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const diff = hoje - inicioAno;
  const semanaDoAno = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));

  // O calendário litúrgico começa no Advento (final de novembro)
  // Mapeamento aproximado: semana litúrgica → ângulo no círculo
  // O círculo tem 52 semanas distribuídas em 360°
  // O Advento começa ~semana 47-48 do ano civil = topo do círculo (0°)
  
  const SEMANA_ADVENTO = 47; // semana do ano em que começa o Advento (aprox.)
  const totalSemanas = 52;
  
  let semanaLiturgica = semanaDoAno - SEMANA_ADVENTO;
  if (semanaLiturgica < 0) semanaLiturgica += totalSemanas;
  
  // Ângulo: Advento = topo (270° em coordenadas de canvas, -90° no CSS)
  // Girando no sentido horário
  const angulo = (semanaLiturgica / totalSemanas) * 360;

  // Centro do container
  const tamanho = container.offsetWidth;
  const centro = tamanho / 2;
  
  // Raio onde o marcador aparece (no anel externo de datas)
  const raio = centro * 0.90;

  // Ângulo em radianos (-90° para começar do topo)
  const rad = ((angulo - 90) * Math.PI) / 180;

  const x = centro + raio * Math.cos(rad);
  const y = centro + raio * Math.sin(rad);

  destaque.style.left = `${x}px`;
  destaque.style.top = `${y}px`;
  destaque.style.display = "block";

  // Linha do marcador (rotação)
  destaque.style.transform = `translate(-50%, -50%) rotate(${angulo}deg)`;
}

// =========================
// AUTO INIT
// =========================
document.addEventListener("DOMContentLoaded", iniciarCalendario);
