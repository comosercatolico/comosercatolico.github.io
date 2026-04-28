// ═══════════════════════════════════════════════════════════
//  LOBBY.JS — Canvas do lobby, NPC, mapa
// ═══════════════════════════════════════════════════════════
"use strict";

const LobbyRenderer = (() => {
    const TILE = CONFIG.TILE, MW = CONFIG.MAP_W, MH = CONFIG.MAP_H;

    let camera = { x: 0, y: 0 };

    // ── Assets ──
    const img = {
        gramas: [],
        santaAnda: [],
        estrada:    new Image(),
        mesa:       new Image(),
        cadeiraEsq: new Image(),
        cadeiraDir: new Image(),
        biblioteca: new Image(),
    };

    function carregarAssets() {
        const base = CONFIG.ASSET_BASE;

        for (let i = 1; i <= 5; i++) {
            const g = new Image();
            g.src = `tiles/chaop1/grama${i}.jpg`;
            img.gramas.push(g);
        }
        for (let i = 1; i <= 9; i++) {
            const s = new Image();
            s.src = `tiles/trzn/anda${i}.png`;
            img.santaAnda.push(s);
        }

        img.estrada.src    = 'tiles/chaop1/ti.png';
        img.mesa.src       = 'tiles/estruturas/mesa.png';
        img.cadeiraEsq.src = 'tiles/estruturas/cadeira_esquerda.png';
        img.cadeiraDir.src = 'tiles/estruturas/cadeira_direita.png';
        img.biblioteca.src = 'tiles/estruturas/bb.png';
    }

    // ── Mapa ──
    const mapa = [];
    const cx0  = Math.floor(MW / 2);
    const cy0  = Math.floor(MH / 2);

    function gerarMapa() {
        const escolaY = 12, lCam = 1;
        for (let y = 0; y < MH; y++) {
            mapa[y] = [];
            for (let x = 0; x < MW; x++) {
                let tipo = 0;
                if (y >= cy0 - lCam && y <= cy0 + lCam) tipo = 5;
                if (x >= cx0 - lCam && x <= cx0 + lCam) tipo = 5;
                if (y >= escolaY - lCam && y <= escolaY + lCam) tipo = 5;
                if (x >= cx0 - lCam && x <= cx0 + lCam &&
                    y >= Math.min(escolaY, cy0) && y <= Math.max(escolaY, cy0)) tipo = 5;
                mapa[y][x] = { tipo, sombra: Math.random() * 0.03 };
            }
        }
    }

    // ── Objetos ──
    const objetos = [
        { tipo:'biblioteca', tileX:7,         tileY:10,       escala:0.9,  layer:0 },
        { tipo:'cadeiraEsq', tileX:cx0-1.77,  tileY:cy0-0.2, escala:0.22, layer:0 },
        { tipo:'cadeiraDir', tileX:cx0+1.77,  tileY:cy0-0.2, escala:0.22, layer:0 },
        { tipo:'mesa',       tileX:cx0,        tileY:cy0,     escala:0.42, layer:1 },
    ];

    // ── NPC Santa ──
    const npc = { tileX:50, tileY:50, frame:0, tempo:0, vel:0.03, escala:0.28, dirX:1, dirY:0 };

    function atualizarNPC() {
        npc.tempo++;
        if (npc.tempo > 8) { npc.tempo = 0; npc.frame = (npc.frame + 1) % img.santaAnda.length; }
        npc.tileX += npc.dirX * npc.vel;
        npc.tileY += npc.dirY * npc.vel;
        const rx = Math.round(npc.tileX), ry = Math.round(npc.tileY);
        if (Math.abs(npc.tileX - rx) < npc.vel && Math.abs(npc.tileY - ry) < npc.vel) {
            npc.tileX = rx; npc.tileY = ry;
            const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
            const ok   = dirs.filter(d => {
                const nx = rx + d.x, ny = ry + d.y;
                return nx >= 0 && ny >= 0 && nx < MW && ny < MH &&
                       mapa[ny][nx].tipo === 5 &&
                       !(d.x === -npc.dirX && d.y === -npc.dirY);
            });
            if (ok.length) {
                const e = ok[Math.floor(Math.random() * ok.length)];
                npc.dirX = e.x; npc.dirY = e.y;
            }
        }
    }

    // ── Arrasto da câmera ──
    let drag = false, lx = 0, ly = 0;

    function initDrag(canvas) {
        canvas.addEventListener('mousedown', e => {
            if (BattleState.emBatalha) return;
            drag = true; lx = e.clientX; ly = e.clientY;
        });
        window.addEventListener('mouseup',    () => { drag = false; });
        canvas.addEventListener('mousemove',  e => {
            if (!drag) return;
            camera.x -= e.clientX - lx; camera.y -= e.clientY - ly;
            lx = e.clientX; ly = e.clientY;
        });

        // Touch
        canvas.addEventListener('touchstart', e => {
            if (BattleState.emBatalha) return;
            drag = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY;
        }, { passive: true });
        window.addEventListener('touchend', () => { drag = false; });
        canvas.addEventListener('touchmove', e => {
            if (!drag) return;
            camera.x -= e.touches[0].clientX - lx; camera.y -= e.touches[0].clientY - ly;
            lx = e.touches[0].clientX; ly = e.touches[0].clientY;
        }, { passive: true });
    }

    function resetCamera(W, H) {
        camera.x = cx0 * TILE - W / 2;
        camera.y = cy0 * TILE - H / 2;
    }

    // ── Render ──
    function desenharChao(ctx, W, H) {
        const sX = Math.floor(camera.x / TILE), sY = Math.floor(camera.y / TILE);
        const vW = Math.ceil(W / TILE) + 2,     vH = Math.ceil(H / TILE) + 2;

        for (let y = sY; y < sY + vH; y++) {
            for (let x = sX; x < sX + vW; x++) {
                if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
                const tile = mapa[y][x];
                const ti   = tile.tipo === 5 ? img.estrada : img.gramas[tile.tipo];
                const dX   = x * TILE - camera.x, dY = y * TILE - camera.y;

                if (imgOk(ti)) {
                    ctx.drawImage(ti, dX, dY, TILE, TILE);
                    if (tile.sombra > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${tile.sombra})`;
                        ctx.fillRect(dX, dY, TILE, TILE);
                    }
                } else {
                    ctx.fillStyle = '#2a6e3a';
                    ctx.fillRect(dX, dY, TILE, TILE);
                }
            }
        }
    }

    function desenharObjetos(ctx) {
        objetos.sort((a, b) => a.layer !== b.layer ? a.layer - b.layer : a.tileY - b.tileY);
        objetos.forEach(obj => {
            const i = img[obj.tipo];
            if (!imgOk(i)) return;
            const w = i.width * obj.escala, h = i.height * obj.escala;
            const bx = obj.tileX * TILE + TILE / 2 - camera.x;
            const by = obj.tileY * TILE + TILE - camera.y;

            // Sombra
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            ctx.ellipse(bx, by, w * 0.38, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.drawImage(i, bx - w / 2, by - h, w, h);
        });
    }

    function desenharNPC(ctx) {
        const i = img.santaAnda[Math.floor(npc.frame)];
        if (!imgOk(i)) return;
        const w = i.width * npc.escala, h = i.height * npc.escala;
        const bx = npc.tileX * TILE + TILE / 2 - camera.x;
        const by = npc.tileY * TILE + TILE - camera.y;

        // Sombra
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(bx, by, w * 0.36, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (npc.dirX < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(i, -(bx + w / 2), by - h, w, h);
        } else {
            ctx.drawImage(i, bx - w / 2, by - h, w, h);
        }
        ctx.restore();
    }

    // ── Partículas ambiente do lobby ──
    const partLobby = [];
    function tickPartLobby(W, H) {
        if (partLobby.length < 25 && Math.random() < 0.05) {
            partLobby.push({
                x: Math.random() * W, y: H,
                vy: -(0.3 + Math.random() * 0.6),
                vx: (Math.random() - 0.5) * 0.4,
                vida: 180 + Math.random() * 120,
                max: 0,
                emoji: Math.random() < 0.5 ? '🌹' : '✨',
                size: 10 + Math.random() * 8,
            });
            partLobby[partLobby.length - 1].max = partLobby[partLobby.length - 1].vida;
        }
        for (let i = partLobby.length - 1; i >= 0; i--) {
            const p = partLobby[i];
            p.x += p.vx; p.y += p.vy; p.vida--;
            if (p.vida <= 0) partLobby.splice(i, 1);
        }
    }

    function desenharPartLobby(ctx) {
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        partLobby.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.vida / 40) * Math.min(1, (p.max - p.vida) / 20);
            ctx.font = `${p.size}px serif`;
            ctx.fillText(p.emoji, p.x, p.y);
            ctx.restore();
        });
    }

    return {
        init(canvas) {
            gerarMapa();
            carregarAssets();
            initDrag(canvas);
            resetCamera(canvas.width, canvas.height);
        },
        onResize(W, H) { resetCamera(W, H); },
        render(ctx, W, H) {
            atualizarNPC();
            tickPartLobby(W, H);
            desenharChao(ctx, W, H);
            desenharObjetos(ctx);
            desenharNPC(ctx);
            desenharPartLobby(ctx);
        }
    };
})();
