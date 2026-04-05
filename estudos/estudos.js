let historico = [];
let finalizados = [];

/* ── MENU LATERAL ── */

function abrirMenu() {
  document.getElementById("sidebar").style.left = "0";
}

function fecharMenu() {
  document.getElementById("sidebar").style.left = "-260px";
}

/* ── FILTRO DE CATEGORIAS ── */

function filtrar(cat) {

  const cards = document.querySelectorAll(".estudo-card");

  cards.forEach(card => {
    if (cat === "todos" || card.dataset.cat === cat) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

}

/* ── ABRIR / FECHAR ESTUDO ── */

function abrirEstudo(id) {

  document.querySelector(".estudos-grid").style.display = "none";

  document.querySelectorAll(".estudo-conteudo").forEach(c => {
    c.style.display = "none";
  });

  document.getElementById(id).style.display = "block";

  if (!historico.includes(id)) {
    historico.push(id);
    localStorage.setItem("historico", JSON.stringify(historico));
    atualizarHistorico();
  }

}

function fecharEstudo() {

  document.querySelector(".estudos-grid").style.display = "grid";

  document.querySelectorAll(".estudo-conteudo").forEach(c => {
    c.style.display = "none";
  });

}

/* ── FINALIZAR ESTUDO ── */

function finalizarEstudo(id) {

  if (!finalizados.includes(id)) {
    finalizados.push(id);
    localStorage.setItem("finalizados", JSON.stringify(finalizados));
  }

  atualizarHistorico();
  fecharEstudo();

}

/* ── HISTÓRICO ── */

function toggleHistorico() {

  const painel = document.getElementById("historico");
  const seta = document.querySelector(".fechar-historico");

  painel.classList.toggle("ativo");

  if (painel.classList.contains("ativo")) {
    seta.innerHTML = "❮";
  } else {
    seta.innerHTML = "❯";
  }

}

function atualizarHistorico() {

  const lista = document.getElementById("lista-historico");

  if (historico.length === 0) {
    lista.innerHTML = "<p style='color:#777;'>Nenhum estudo visto ainda.</p>";
    return;
  }

  lista.innerHTML = "";

  historico.slice().reverse().forEach(id => {

    const el = document.querySelector(`#${id} h2`);
    if (!el) return;

    const titulo = el.innerText;

    const item = document.createElement("div");
    item.className = "historico-item";

    const status = finalizados.includes(id) ? " ✅" : " ⏳";

    item.innerText = titulo + status;

    item.onclick = () => {
      abrirEstudo(id);
    };

    lista.appendChild(item);

  });

}

/* ── MENU ANIMAÇÃO ── */

const indicator = document.querySelector(".menu-indicator");
const items = document.querySelectorAll(".menu-item");

function updateIndicator(el) {
  indicator.style.width = el.offsetWidth + "px";
  indicator.style.left = el.offsetLeft + "px";
}

items.forEach(item => {
  item.addEventListener("click", function () {
    items.forEach(i => i.classList.remove("active"));
    this.classList.add("active");
    updateIndicator(this);
  });
});

/* ── INIT ── */

window.onload = () => {

  updateIndicator(document.querySelector(".menu-item.active"));

  historico = JSON.parse(localStorage.getItem("historico")) || [];
  finalizados = JSON.parse(localStorage.getItem("finalizados")) || [];

  atualizarHistorico();

};
