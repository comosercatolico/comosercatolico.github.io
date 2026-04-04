// ===================================================
// CONFIGURAÇÃO BASE DO JOGO
// ===================================================

// 📐 TAMANHO DO MAPA E TILE
export const TILE = 32;
export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 100;


// ===================================================
// CANVAS E CONTEXTO
// ===================================================
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");

// qualidade pixel art
ctx.imageSmoothingEnabled = false;


// ===================================================
// AJUSTE AUTOMÁTICO DE TELA
// ===================================================
export function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

export function initCanvas(){
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
}


// ===================================================
// (OPCIONAL) CONFIGURAÇÕES GLOBAIS FUTURAS
// ===================================================
export const CONFIG = {
    FPS_PADRAO: 60,
    ZOOM_PADRAO: 1
};
