/* =========================
      IMPORTS
========================= */
import { renderizarGrid, salvarHistorico, renderizarHistorico } from "./core/render.js";
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
        contador.textContent = `${num} santo${num !== 1 ? 's' : ''} encontrado${num !== 1 ? 's' : ''}`;
    }
}

/* =========================
      ABRIR MODAL + HISTÓRICO
========================= */
function abrirModalWrapper(nome) {
    salvarHistorico(nome);
    abrirModal(nome, baseDados);
    setTimeout(() => renderizarHistorico(baseDados, abrirModalWrapper), 300);
}

/* =========================
      INICIALIZAÇÃO
========================= */
document.addEventListener("DOMContentLoaded", () => {
    // 🔥 Cria modal
    criarModal(baseDados);

    // 🔥 Ativa eventos do modal
    eventosModal();

    // 🔥 Histórico
    renderizarHistorico(baseDados, abrirModalWrapper);

    // 🔥 Render inicial
    renderizarGrid(baseDados, grid, abrirModalWrapper);

    // 🔥 Filtros
    iniciarPesquisa(
        pesquisaInput,
        baseDados,
        (lista) => renderizarGrid(lista, grid, abrirModalWrapper),
        atualizarContador
    );

    inicializarCategorias(
        categoriasContainer,
        baseDados,
        (lista) => renderizarGrid(lista, grid, abrirModalWrapper),
        atualizarContador
    );

    // 🔥 Contador inicial
    atualizarContador(baseDados.length);

    // 🔥 Log de sucesso
    console.log(`✅ Lux Fidei carregado | ${baseDados.length} santos disponíveis`);
});
