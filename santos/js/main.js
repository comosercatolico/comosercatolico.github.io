import listaSantos from './dados/santos.js';
import { renderizarGrid } from './core/render.js';
import { inicializarFiltros } from './core/filtros.js';
import { abrirModal } from './core/modal.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("App iniciado");
    renderizarGrid(listaSantos);
    inicializarFiltros(listaSantos, renderizarGrid);
});
