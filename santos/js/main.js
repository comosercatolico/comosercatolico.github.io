/* =========================
      IMPORTS
========================= */
import { renderizarGrid } from "./core/render.js";
import { iniciarPesquisa, inicializarCategorias } from "./core/filtros.js";
import { criarModal, abrirModal, eventosModal } from "./core/modal.js";
import { listaSantos } from "./dados/santos.js";
/* =========================
      ELEMENTOS DOM
========================= */
const grid = document.getElementById("santosGrid");
const pesquisaInput = document.getElementById("pesquisaSantos");
const categoriasContainer = document.getElementById("categoriasContainer");
const contador = document.getElementById("santoContador");

/* =========================
      BASE DE DADOS
========================= */
const baseDados = listaSantos;
/* =========================
      CONTADOR
========================= */
function atualizarContador(num) {
    if (contador) {
        contador.textContent = `${num} santos encontrados`;
    }
}

/* =========================
      INICIALIZAÇÃO
========================= */
document.addEventListener("DOMContentLoaded", () => {

    // 🔥 cria modal
    criarModal(baseDados);

    // 🔥 ativa eventos do modal
    eventosModal();

    // 🔥 render inicial
    renderizarGrid(baseDados, grid, (nome) => abrirModal(nome, baseDados));

    // 🔥 filtros
    iniciarPesquisa(
        pesquisaInput,
        baseDados,
        (lista) => renderizarGrid(lista, grid, (nome) => abrirModal(nome, baseDados)),
        atualizarContador
    );

    inicializarCategorias(
        categoriasContainer,
        baseDados,
        (lista) => renderizarGrid(lista, grid, (nome) => abrirModal(nome, baseDados)),
        atualizarContador
    );

    // 🔥 contador inicial
    atualizarContador(baseDados.length);
});
