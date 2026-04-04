// ===================================================
// RENDER (DESENHO + LOOP PRINCIPAL)
// ===================================================

import { canvas, ctx } from "./config.js";
import { camera } from "./camera.js";
import { imagens } from "./imagens.js";

import { emBatalha, atualizarBatalha } from "./batalha.js";
import { atualizarSanta, santa } from "./lobby.js";
import { mapaGrama, MAP_WIDTH, MAP_HEIGHT, TILE } from "./mapa.js";
import { objetos } from "./lobby.js";


// ===================================================
// CHÃO (LOBBY)
// ===================================================
function desenharChao(){

    const startX = Math.floor(camera.x / TILE);
    const startY = Math.floor(camera.y / TILE);

    const viewW = Math.ceil(canvas.width / TILE) + 2;
    const viewH = Math.ceil(canvas.height / TILE) + 2;

    for(let y = startY; y < startY + viewH; y++){
        for(let x = startX; x < startX + viewW; x++){

            if(x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) continue;

            const tile = mapaGrama[y][x];
            const img = (tile.tipo === 5)
                ? imagens.estrada
                : imagens.gramas[tile.tipo];

            const drawX = x * TILE - camera.x;
            const drawY = y * TILE - camera.y;

            if(img && img.complete && img.naturalWidth !== 0){
                ctx.drawImage(img, drawX, drawY, TILE, TILE);

                ctx.fillStyle = `rgba(0,0,0,${tile.sombra})`;
                ctx.fillRect(drawX, drawY, TILE, TILE);

            } else {
                ctx.fillStyle = "#2ecc71";
                ctx.fillRect(drawX, drawY, TILE, TILE);
            }
        }
    }
}


// ===================================================
// OBJETOS (LOBBY)
// ===================================================
function desenharObjetos(){

    objetos.sort((a,b)=>{
        if(a.layer !== b.layer) return a.layer - b.layer;
        return (a.tileY + 1) * TILE - (b.tileY + 1) * TILE;
    });

    objetos.forEach(obj => {

        const img = imagens[obj.tipo];
        if(!img || !img.complete || img.naturalWidth === 0) return;

        const largura = img.width * obj.escala;
        const altura  = img.height * obj.escala;

        const baseX = obj.tileX * TILE + TILE/2;
        const baseY = obj.tileY * TILE + TILE;

        // sombra
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(
            baseX - largura/4 - camera.x,
            baseY - camera.y - 3,
            largura/2,
            5
        );

        ctx.drawImage(
            img,
            baseX - largura/2 - camera.x,
            baseY - altura - camera.y,
            largura,
            altura
        );
    });
}


// ===================================================
// PERSONAGEM (LOBBY)
// ===================================================
function desenharSantaLobby(){

    const img = imagens.santaAnda[Math.floor(santa.frame)];
    if(!img || !img.complete || img.naturalWidth === 0) return;

    const largura = img.width * santa.escala;
    const altura  = img.height * santa.escala;

    const baseX = santa.tileX * TILE + TILE/2;
    const baseY = santa.tileY * TILE + TILE;

    const drawX = baseX - largura/2 - camera.x;
    const drawY = baseY - altura - camera.y;

    ctx.save();

    if(santa.dirX < 0){
        ctx.scale(-1, 1);
        ctx.drawImage(img, -(drawX + largura), drawY, largura, altura);
    } else {
        ctx.drawImage(img, drawX, drawY, largura, altura);
    }

    ctx.restore();
}


// ===================================================
// LOOP PRINCIPAL
// ===================================================
function loop(){

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(emBatalha){

        // 👉 batalha desenha TUDO dela
        atualizarBatalha();

    } else {

        atualizarSanta();

        desenharChao();
        desenharObjetos();
        desenharSantaLobby();
    }

    requestAnimationFrame(loop);
}


// ===================================================
// INICIAR RENDER
// ===================================================
export function iniciarRender(){
    loop();
}
