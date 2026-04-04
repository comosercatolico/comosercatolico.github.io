// ===================================================
// MAPA (dados + geração)
// ===================================================

import { MAP_WIDTH, MAP_HEIGHT } from "./config.js";

// matriz do mapa
export let mapaGrama = [];

// centro do mapa
const centroX = Math.floor(MAP_WIDTH / 2);
const centroY = Math.floor(MAP_HEIGHT / 2);

// configuração de caminhos
const escolaY = 12;
const larguraCam = 1;


// ===================================================
// GERAR MAPA
// ===================================================
export function gerarMapa(){

    mapaGrama = [];

    for(let y = 0; y < MAP_HEIGHT; y++){
        mapaGrama[y] = [];

        for(let x = 0; x < MAP_WIDTH; x++){

            let tipo = 0;

            // caminho horizontal central
            if(y >= centroY - larguraCam && y <= centroY + larguraCam){
                tipo = 5;
            }

            // caminho vertical central
            if(x >= centroX - larguraCam && x <= centroX + larguraCam){
                tipo = 5;
            }

            // caminho da escola (horizontal superior)
            if(y >= escolaY - larguraCam && y <= escolaY + larguraCam){
                tipo = 5;
            }

            // conexão entre escola e centro
            if(
                x >= centroX - larguraCam && x <= centroX + larguraCam &&
                y >= Math.min(escolaY, centroY) &&
                y <= Math.max(escolaY, centroY)
            ){
                tipo = 5;
            }

            // salvar tile
            mapaGrama[y][x] = {
                tipo,
                sombra: Math.random() * 0.03
            };
        }
    }
}


// ===================================================
// (OPCIONAL) PEGAR TILE
// ===================================================
export function getTile(x, y){
    if(x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT){
        return null;
    }
    return mapaGrama[y][x];
}
