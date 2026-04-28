// ═══════════════════════════════════════
//  GAME-LOBBY.JS
//  Canvas, mapa, NPC Santa no lobby
// ═══════════════════════════════════════

const TILE = 32, MAP_WIDTH = 100, MAP_HEIGHT = 100;
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let camera = {
    x: MAP_WIDTH  * TILE / 2 - window.innerWidth  / 2,
    y: MAP_HEIGHT * TILE / 2 - window.innerHeight / 2
};

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", () => {
    resizeCanvas();
    camera.x = MAP_WIDTH  * TILE / 2 - canvas.width  / 2;
    camera.y = MAP_HEIGHT * TILE / 2 - canvas.height / 2;
});

// ── Câmera arrastável (só lobby) ──
let dragging = false, lastX = 0, lastY = 0;
canvas.onmousedown  = e => { if (emBatalha) return; dragging = true;  lastX = e.clientX; lastY = e.clientY; };
canvas.onmouseup    = () => { dragging = false; };
canvas.onmouseleave = () => { dragging = false; };
canvas.onmousemove  = e => {
    if (!dragging) return;
    camera.x -= e.clientX - lastX;
    camera.y -= e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
};

// ── Imagens ──
const imagens = {
    gramas: [], mesa: new Image(), cadeiraEsq: new Image(),
    cadeiraDir: new Image(), biblioteca: new Image(), estrada: new Image()
};
imagens.santaAnda = [];

for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = `tiles/chaop1/grama${i}.jpg`;
    imagens.gramas.push(img);
}
for (let i = 1; i <= 9; i++) {
    const img = new Image();
    img.src = `tiles/trzn/anda${i}.png`;
    imagens.santaAnda.push(img);
}
imagens.estrada.src    = "tiles/chaop1/ti.png";
imagens.mesa.src       = "tiles/estruturas/mesa.png";
imagens.cadeiraEsq.src = "tiles/estruturas/cadeira_esquerda.png";
imagens.cadeiraDir.src = "tiles/estruturas/cadeira_direita.png";
imagens.biblioteca.src = "tiles/estruturas/bb.png";

// ── Mapa ──
const mapaGrama = [];
const centroX = Math.floor(MAP_WIDTH / 2);
const centroY = Math.floor(MAP_HEIGHT / 2);
const escolaY = 12, lCam = 1;

for (let y = 0; y < MAP_HEIGHT; y++) {
    mapaGrama[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
        let tipo = 0;
        if (y >= centroY - lCam && y <= centroY + lCam) tipo = 5;
        if (x >= centroX - lCam && x <= centroX + lCam) tipo = 5;
        if (y >= escolaY - lCam && y <= escolaY + lCam) tipo = 5;
        if (x >= centroX - lCam && x <= centroX + lCam &&
            y >= Math.min(escolaY, centroY) && y <= Math.max(escolaY, centroY)) tipo = 5;
        mapaGrama[y][x] = { tipo, sombra: Math.random() * 0.03 };
    }
}

// ── Objetos do lobby ──
const cTX = 50, cTY = 50;
const objetos = [
    { tipo: "biblioteca", tileX: 7,         tileY: 10,       escala: 0.9,  layer: 0 },
    { tipo: "cadeiraEsq", tileX: cTX - 1.77,tileY: cTY - .2, escala: 0.22, layer: 0 },
    { tipo: "cadeiraDir", tileX: cTX + 1.77,tileY: cTY - .2, escala: 0.22, layer: 0 },
    { tipo: "mesa",       tileX: cTX,        tileY: cTY,      escala: 0.42, layer: 1 }
];

// ── NPC Santa (lobby) ──
const santa = { tileX: 50, tileY: 50, frame: 0, tempo: 0, velocidade: 0.03, escala: 0.28, dirX: 1, dirY: 0 };

function atualizarSanta() {
    santa.tempo++;
    if (santa.tempo > 8) { santa.tempo = 0; santa.frame = (santa.frame + 1) % imagens.santaAnda.length; }
    santa.tileX += santa.dirX * santa.velocidade;
    santa.tileY += santa.dirY * santa.velocidade;
    const cx = Math.round(santa.tileX), cy = Math.round(santa.tileY);
    if (Math.abs(santa.tileX - cx) < santa.velocidade && Math.abs(santa.tileY - cy) < santa.velocidade) {
        santa.tileX = cx; santa.tileY = cy;
        const dirs = [{ x:1,y:0 },{ x:-1,y:0 },{ x:0,y:1 },{ x:0,y:-1 }];
        const ok = dirs.filter(d => {
            const nx = cx + d.x, ny = cy + d.y;
            return nx >= 0 && ny >= 0 && nx < MAP_WIDTH && ny < MAP_HEIGHT &&
                   mapaGrama[ny][nx].tipo === 5 &&
                   !(d.x === -santa.dirX && d.y === -santa.dirY);
        });
        if (ok.length > 0) { const e = ok[Math.floor(Math.random() * ok.length)]; santa.dirX = e.x; santa.dirY = e.y; }
    }
}

function desenharChao() {
    const sX = Math.floor(camera.x / TILE), sY = Math.floor(camera.y / TILE);
    const vW = Math.ceil(canvas.width  / TILE) + 2;
    const vH = Math.ceil(canvas.height / TILE) + 2;
    for (let y = sY; y < sY + vH; y++) {
        for (let x = sX; x < sX + vW; x++) {
            if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) continue;
            const tile = mapaGrama[y][x];
            const img  = tile.tipo === 5 ? imagens.estrada : imagens.gramas[tile.tipo];
            const dX   = x * TILE - camera.x, dY = y * TILE - camera.y;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, dX, dY, TILE, TILE);
                ctx.fillStyle = `rgba(0,0,0,${tile.sombra})`;
                ctx.fillRect(dX, dY, TILE, TILE);
            } else {
                ctx.fillStyle = "#2ecc71"; ctx.fillRect(dX, dY, TILE, TILE);
            }
        }
    }
}

function desenharObjetos() {
    objetos.sort((a, b) => a.layer !== b.layer ? a.layer - b.layer : (a.tileY - b.tileY));
    objetos.forEach(obj => {
        const img = imagens[obj.tipo];
        if (!img.complete || img.naturalWidth === 0) return;
        const larg = img.width * obj.escala, alt = img.height * obj.escala;
        const bX = obj.tileX * TILE + TILE / 2, bY = obj.tileY * TILE + TILE;
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(bX - larg / 4 - camera.x, bY - camera.y - 3, larg / 2, 5);
        ctx.drawImage(img, bX - larg / 2 - camera.x, bY - alt - camera.y, larg, alt);
    });
}

function desenharSantaLobby() {
    const img = imagens.santaAnda[Math.floor(santa.frame)];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const larg = img.width * santa.escala, alt = img.height * santa.escala;
    const bX = santa.tileX * TILE + TILE / 2, bY = santa.tileY * TILE + TILE;
    const dX = bX - larg / 2 - camera.x, dY = bY - alt - camera.y;
    ctx.save();
    if (santa.dirX < 0) { ctx.scale(-1, 1); ctx.drawImage(img, -(dX + larg), dY, larg, alt); }
    else { ctx.drawImage(img, dX, dY, larg, alt); }
    ctx.restore();
}

// Expõe para o loop principal
window.desenharLobby = function () {
    atualizarSanta();
    desenharChao();
    desenharObjetos();
    desenharSantaLobby();
};
