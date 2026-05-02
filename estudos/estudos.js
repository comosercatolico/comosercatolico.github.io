/* ================================================
   VARIÁVEIS GLOBAIS
   historico  = estudos que o usuário JÁ VISITOU
   finalizados = estudos que o usuário CONCLUIU
   Ambos são salvos no localStorage (ficam mesmo fechando o navegador)
   ================================================ */

let historico = [];
let finalizados = [];

/* ================================================
   MENU LATERAL (celular)
   abrirMenu()  → desliza o menu para dentro da tela
   fecharMenu() → esconde o menu novamente
   ================================================ */

function abrirMenu() {
  document.getElementById("sidebar").style.left = "0";
}

function fecharMenu() {
  document.getElementById("sidebar").style.left = "-260px";
}

/* ================================================
   FILTRO DE CATEGORIAS
   Mostra só os cards que têm o data-cat igual à categoria clicada
   Se cat === "todos", mostra todos

   Como funciona:
   - Pega todos os elementos com classe .estudo-card
   - Para cada um, verifica se o data-cat bate com o filtro
   - Se sim → mostra (display: block)
   - Se não → esconde (display: none)
   ================================================ */

function filtrar(cat) {

  const cards = document.querySelectorAll(".estudo-card");

  cards.forEach(card => {
    if (cat === "todos" || card.dataset.cat === cat) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });

  /* Atualiza o botão ativo (dourado) */
  document.querySelectorAll(".categoria-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  /* Marca como ativo o botão que foi clicado */
  event.target.classList.add("active");

}

/* ================================================
   ABRIR / FECHAR ESTUDO (quando o estudo fica NA MESMA PÁGINA)
   Usado para estudos sem página própria.
   Se o estudo tem página própria (onclick="window.location.href=...")
   essas funções não são chamadas.

   abrirEstudo(id):
   - Esconde a grade de cards
   - Mostra o bloco de conteúdo com aquele id
   - Adiciona ao histórico se ainda não estiver

   fecharEstudo():
   - Volta a mostrar a grade
   - Esconde todos os conteúdos
   ================================================ */

function abrirEstudo(id) {

  /* Esconde a grade de cards */
  document.querySelector(".estudos-grid").style.display = "none";

  /* Esconde todos os conteúdos que possam estar abertos */
  document.querySelectorAll(".estudo-conteudo").forEach(c => {
    c.style.display = "none";
  });

  /* Mostra apenas o conteúdo com o id passado */
  document.getElementById(id).style.display = "block";

  /* Adiciona ao histórico (sem repetir) */
  if (!historico.includes(id)) {
    historico.push(id);
    localStorage.setItem("historico", JSON.stringify(historico));
    atualizarHistorico();
  }

}

function fecharEstudo() {

  /* Volta a mostrar a grade */
  document.querySelector(".estudos-grid").style.display = "grid";

  /* Esconde todos os conteúdos abertos */
  document.querySelectorAll(".estudo-conteudo").forEach(c => {
    c.style.display = "none";
  });

}

/* ================================================
   FINALIZAR ESTUDO
   Marca o estudo como concluído (✅ no histórico)
   Chame no botão "Concluir" dentro do estudo:
   onclick="finalizarEstudo('id-do-estudo')"
   ================================================ */

function finalizarEstudo(id) {

  if (!finalizados.includes(id)) {
    finalizados.push(id);
    localStorage.setItem("finalizados", JSON.stringify(finalizados));
  }

  atualizarHistorico();
  fecharEstudo();

}

/* ================================================
   CONCÍLIOS
   Redireciona para a página dos concílios
   ================================================ */

function abrirConcilios() {
  window.location.href = "concilios/index.html";
}

/* ================================================
   PAINEL DE HISTÓRICO
   toggleHistorico() → abre ou fecha o painel lateral
   A classe .ativo no CSS faz o painel deslizar para dentro
   ================================================ */

function toggleHistorico() {

  const painel = document.getElementById("historico");
  const seta = document.querySelector(".fechar-historico");

  painel.classList.toggle("ativo");

  /* Muda a seta de direção */
  if (painel.classList.contains("ativo")) {
    seta.innerHTML = "❮"; /* aponta para fechar */
  } else {
    seta.innerHTML = "❯"; /* aponta para abrir */
  }

}

/* ================================================
   ATUALIZAR LISTA DO HISTÓRICO
   Lê o array "historico" e monta os itens no painel
   Cada item mostra o título do estudo + status:
   ✅ = concluído | ⏳ = em andamento
   ================================================ */

function atualizarHistorico() {

  const lista = document.getElementById("lista-historico");

  /* Se não visitou nada ainda */
  if (historico.length === 0) {
    lista.innerHTML = "<p style='color:#777;'>Nenhum estudo visto ainda.</p>";
    return;
  }

  lista.innerHTML = "";

  /* Mostra do mais recente ao mais antigo (.reverse()) */
  historico.slice().reverse().forEach(id => {

    /* Pega o título do estudo (h2 dentro do bloco de conteúdo) */
    const el = document.querySelector(`#${id} h2`);
    if (!el) return; /* se não encontrar, pula */

    const titulo = el.innerText;

    const item = document.createElement("div");
    item.className = "historico-item";

    /* Ícone de status */
    const status = finalizados.includes(id) ? " ✅" : " ⏳";

    item.innerText = titulo + status;

    /* Clicar no item reabre o estudo */
    item.onclick = () => {
      abrirEstudo(id);
    };

    lista.appendChild(item);

  });

}

/* ================================================
   ANIMAÇÃO DO INDICADOR DO MENU SUPERIOR
   A barrinha dourada que desliza sob o item ativo
   ================================================ */

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

/* ================================================
   INICIALIZAÇÃO
   Roda assim que a página termina de carregar:
   1. Posiciona o indicador no item ativo
   2. Carrega histórico e finalizados do localStorage
   3. Atualiza o painel de histórico
   ================================================ */

window.onload = () => {

  /* Posiciona a barrinha no link ativo atual */
  const ativo = document.querySelector(".menu-item.active");
  if (ativo) updateIndicator(ativo);

  /* Carrega dados salvos (ou array vazio se não houver) */
  historico = JSON.parse(localStorage.getItem("historico")) || [];
  finalizados = JSON.parse(localStorage.getItem("finalizados")) || [];

  /* Monta o painel de histórico */
  atualizarHistorico();

};

/* ================================================
   💡 COMO ADICIONAR UM NOVO ESTUDO COM PÁGINA PRÓPRIA:

   1. Crie uma pasta: estudos/meutema/
   2. Crie o arquivo: estudos/meutema/index.html
   3. No estudos.html, adicione o card dentro de .estudos-grid:

   <div class="estudo-card" data-cat="suacategoria"
        onclick="window.location.href='meutema/index.html'">
     <h3>🔖 Título</h3>
     <p>Descrição curta do estudo.</p>
   </div>

   ================================================
   💡 COMO ADICIONAR UM ESTUDO QUE ABRE NA MESMA PÁGINA:

   1. No estudos.html, adicione o card:

   <div class="estudo-card" data-cat="suacategoria"
        onclick="abrirEstudo('meu-estudo')">
     <h3>🔖 Título</h3>
     <p>Descrição curta.</p>
   </div>

   2. E adicione o bloco de conteúdo (pode ser após o .estudos-grid):

   <div class="estudo-conteudo" id="meu-estudo">
     <h2>Título Completo</h2>
     <p>Conteúdo do estudo aqui...</p>
     <button class="voltar" onclick="fecharEstudo()">← Voltar</button>
   </div>

   ================================================ */
