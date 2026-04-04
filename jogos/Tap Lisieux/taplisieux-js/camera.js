// ===================================================
// CÂMERA + CANVAS
// ===================================================

import { canvas, TILE, MAP_WIDTH, MAP_HEIGHT } from "./config.js";

// posição inicial (centralizada no mapa)
export const camera = {
    x: MAP_WIDTH * TILE / 2 - window.innerWidth / 2,
    y: MAP_HEIGHT * TILE / 2 - window.innerHeight / 2
};

// ===================================================
// RESIZE DO CANVAS
// ===================================================
export function initCamera(){

    function resizeCanvas(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // centraliza novamente ao redimensionar
        camera.x = MAP_WIDTH * TILE / 2 - canvas.width / 2;
        camera.y = MAP_HEIGHT * TILE / 2 - canvas.height / 2;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
}


// ===================================================
// LIMITE DA CÂMERA (não sair do mapa)
// ===================================================
function limitarCamera(){
    const maxX = MAP_WIDTH * TILE - canvas.width;
    const maxY = MAP_HEIGHT * TILE - canvas.height;

    camera.x = Math.max(0, Math.min(camera.x, maxX));
    camera.y = Math.max(0, Math.min(camera.y, maxY));
}


// ===================================================
// ARRASTAR CÂMERA (LOBBY)
// ===================================================
let dragging = false;
let lastX = 0;
let lastY = 0;

// ⚠️ emBatalha vem de outro arquivo (não definir aqui)
export function ativarControleCamera(getEmBatalha){

    canvas.onmousedown = (e) => {
        if(getEmBatalha()) return;
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    };

    canvas.onmouseup = () => dragging = false;
    canvas.onmouseleave = () => dragging = false;

    canvas.onmousemove = (e) => {
        if(!dragging) return;

        camera.x -= (e.clientX - lastX);
        camera.y -= (e.clientY - lastY);

        lastX = e.clientX;
        lastY = e.clientY;

        limitarCamera(); // 🔥 melhora importante
    };
}
