// ===================================================
// LOBBY (NPC + OBJETOS + CHÃO)
// ===================================================

import { TILE, MAP_WIDTH, MAP_HEIGHT, canvas, ctx } from "./config.js";
import { camera } from "./camera.js";
import { imagens } from "./imagens.js";
import { mapaGrama } from "./mapa.js";


// ===================================================
// OBJETOS DO LOBBY
// ===================================================
const centroTileX = 50;
const centroTileY = 50;

export const objetos = [
    {tipo:"biblioteca",tileX:7,tileY:10,escala:0.9,layer:0},
    {tipo:"cadeiraEsq",tileX:centroTileX-1.77,tileY:centroTileY-0.20,escala:0.22,layer:0},
    {tipo:"cadeiraDir",tileX:centroTileX+1.77,tileY:centroTileY-0.20,escala:0.22,layer:0},
    {tipo:"mesa",tileX:centroTileX,tileY:centroTileY,escala:0.42,layer:1}
];


// ===================================================
// NPC (SANTA)
// ===================================================
export const santa = {
    tileX:50,
    tileY:50,
    frame:0,
    tempo:0,
    velocidade:0.03,
    escala:0.28,
    dirX:1,
    dirY:0
};


// ===================================================
// ATUALIZAR SANTA (MOVIMENTO)
// ===================================================
export function atualizarSanta(){

    santa.tempo++;

    if(santa.tempo > 8){
        santa.tempo = 0;
        santa.frame++;

        if(santa.frame >= imagens.santaAnda.length){
            santa.frame = 0;
        }
    }

    santa.tileX += santa.dirX * santa.velocidade;
    santa.tileY += santa.dirY * santa.velocidade;

    const cx = Math.round(santa.tileX);
    const cy = Math.round(santa.tileY);

    if(
        Math.abs(santa.tileX - cx) < santa.velocidade &&
        Math.abs(santa.tileY - cy) < santa.velocidade
    ){
        santa.tileX = cx;
        santa.tileY = cy;

        const dirs = [
            {x:1,y:0},
            {x:-1,y:0},
            {x:0,y:1},
            {x:0,y:-1}
        ];

        const possiveis = [];

        for(let d of dirs){

            const nx = cx + d.x;
            const ny = cy + d.y;

            if(nx < 0 || ny < 0 || nx >= MAP_WIDTH || ny >= MAP_HEIGHT) continue;

            if(mapaGrama[ny][nx].tipo === 5){

                // evita voltar pra trás
                if(d.x === -santa.dirX && d.y === -santa.dirY) continue;

                possiveis.push(d);
            }
        }

        if(possiveis.length > 0){
            const escolha = possiveis[Math.floor(Math.random()*possiveis.length)];
            santa.dirX = escolha.x;
            santa.dirY = escolha.y;
        }
    }
}


// ===================================================
// DESENHAR CHÃO
// ===================================================
export function desenharChao(){

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

                // sombra leve
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
// DESENHAR OBJETOS
// ===================================================
export function desenharObjetos(){

    objetos.sort((a,b)=>{
        if(a.layer !== b.layer) return a.layer - b.layer;
        return (a.tileY+1)*TILE - (b.tileY+1)*TILE;
    });

    objetos.forEach(obj=>{

        const img = imagens[obj.tipo];

        if(!img.complete || img.naturalWidth === 0) return;

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
// DESENHAR SANTA NO LOBBY
// ===================================================
export function desenharSantaLobby(){

    const img = imagens.santaAnda[Math.floor(santa.frame)];

    if(!img || !img.complete || img.naturalWidth === 0) return;

    const largura = img.width * santa.escala;
    const altura  = img.height * santa.escala;

    const baseX = santa.tileX * TILE + TILE/2;
    const baseY = santa.tileY * TILE + TILE;

    const drawX = baseX - largura/2 - camera.x;
    const drawY = baseY - altura - camera.y;

    ctx.save();

    // inverter sprite
    if(santa.dirX < 0){
        ctx.scale(-1,1);
        ctx.drawImage(img, -(drawX + largura), drawY, largura, altura);
    }else{
        ctx.drawImage(img, drawX, drawY, largura, altura);
    }

    ctx.restore();
}
