// ===================================================
// IMAGENS DO JOGO
// ===================================================

export const imagens = {
    gramas: [],
    santaAnda: [],
    mesa: new Image(),
    cadeiraEsq: new Image(),
    cadeiraDir: new Image(),
    biblioteca: new Image(),
    estrada: new Image()
};


// ===================================================
// CARREGAMENTO DAS IMAGENS
// ===================================================
export function carregarImagens(){

    // 🌱 GRAMA (tiles)
    for(let i=1;i<=5;i++){
        const img = new Image();
        img.src = `tiles/chaop1/grama${i}.jpg`;
        imagens.gramas.push(img);
    }

    // 🚶 SANTA (animação andando)
    for(let i=1;i<=9;i++){
        const img = new Image();
        img.src = `tiles/trzn/anda${i}.png`;
        imagens.santaAnda.push(img);
    }

    // 🛣️ CHÃO / ESTRADA
    imagens.estrada.src = "tiles/chaop1/ti.png";

    // 🪑 OBJETOS DO LOBBY
    imagens.mesa.src = "tiles/estruturas/mesa.png";
    imagens.cadeiraEsq.src = "tiles/estruturas/cadeira_esquerda.png";
    imagens.cadeiraDir.src = "tiles/estruturas/cadeira_direita.png";
    imagens.biblioteca.src = "tiles/estruturas/bb.png";
}


// ===================================================
// (OPCIONAL) ESPERAR TODAS AS IMAGENS CARREGAREM
// ===================================================
export function preloadImagens(callback){
    const todas = [
        ...imagens.gramas,
        ...imagens.santaAnda,
        imagens.mesa,
        imagens.cadeiraEsq,
        imagens.cadeiraDir,
        imagens.biblioteca,
        imagens.estrada
    ];

    let carregadas = 0;

    todas.forEach(img=>{
        if(img.complete){
            carregadas++;
        } else {
            img.onload = () => {
                carregadas++;
                if(carregadas === todas.length) callback();
            };
        }
    });

    // caso já estejam todas carregadas
    if(carregadas === todas.length) callback();
}
