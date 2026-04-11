// ═══════════════════════════════════════════════════════
//  RENDERER-LOBBY.JS
//  Renderiza o lobby:
//  - Tilemap (grama, estrada) com culling por viewport
//  - Objetos isométricos (mesa, cadeiras, biblioteca)
//  - NPC Santa com pathfinding em estrada + animação
//  - Câmera arrastável com inércia
//  - Sombras, névoa, iluminação ambiente
//
//  Depende de: asset-loader.js, camera.js
//  Usado por: renderer-main.js
// ═══════════════════════════════════════════════════════

"use strict";

const RendererLobby = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("RendererLobby"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO DO MAPA
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        TILE          : 32,
        MAP_W         : 100,
        MAP_H         : 100,

        // NPC
        NPC_ESCALA        : 0.28,
        NPC_FRAMES        : 9,
        NPC_FRAME_DURACAO : 8,      // ticks por frame
        NPC_VELOCIDADE    : 0.03,   // tiles por tick

        // Visual
        SOMBRA_OBJETO_ALPHA : 0.25,
        SOMBRA_OBJETO_H     : 5,
        NEVOA_INICIO        : 0.55, // % altura onde névoa começa
        NEVOA_ALPHA         : 0.18,

        // Variação de grama
        GRAMAS_QTD    : 5,

        // Luz ambiente (pisca suave)
        LUZ_AMP       : 0.04,
        LUZ_FREQ      : 0.0004,
    });

    const { TILE, MAP_W, MAP_H } = CFG;

    // ════════════════════════════════════════════════════
    // REFERÊNCIAS EXTERNAS
    // ════════════════════════════════════════════════════
    let _canvas = null;
    let _ctx    = null;

    // ════════════════════════════════════════════════════
    // MAPA — tiles e dados
    // ════════════════════════════════════════════════════

    /**
     * Tipos de tile:
     *   0-4 → grama (variação visual)
     *   5   → estrada
     */
    let _mapa = [];         // _mapa[y][x] = { tipo, sombra, luz }

    /** Conjunto de coords de estrada para o pathfinding do NPC */
    const _estradaSet = new Set(); // "x,y"

    function _eEstrada(x, y) {
        return _estradaSet.has(`${x},${y}`);
    }

    function _construirMapa() {
        const cX = Math.floor(MAP_W / 2);  // centro X
        const cY = Math.floor(MAP_H / 2);  // centro Y
        const esY = 12;                     // estrada horizontal superior
        const lC  = 1;                      // largura do caminho (±lC tiles)

        _mapa = [];
        _estradaSet.clear();

        for (let y = 0; y < MAP_H; y++) {
            _mapa[y] = [];
            for (let x = 0; x < MAP_W; x++) {

                // --- Define tipo ---
                let tipo = Math.floor(Math.random() * CFG.GRAMAS_QTD); // 0-4 grama

                // Estrada horizontal central
                if (y >= cY - lC && y <= cY + lC) tipo = 5;
                // Estrada vertical central
                if (x >= cX - lC && x <= cX + lC) tipo = 5;
                // Estrada horizontal superior
                if (y >= esY - lC && y <= esY + lC) tipo = 5;
                // Conexão vertical: une cX ao trecho superior
                if (x >= cX - lC && x <= cX + lC &&
                    y >= Math.min(esY, cY) && y <= Math.max(esY, cY)) tipo = 5;

                // --- Variação de sombra por tile ---
                const sombra = tipo === 5
                    ? 0
                    : Math.random() * 0.06;   // grama tem micro-sombras

                // --- Variação de luz (seed por posição) ---
                const luzFase = (x * 7 + y * 13) % 628 / 100;

                _mapa[y][x] = { tipo, sombra, luzFase };

                if (tipo === 5) _estradaSet.add(`${x},${y}`);
            }
        }

        _log.info(`Mapa construído: ${MAP_W}×${MAP_H} tiles, ${_estradaSet.size} estrada`);
    }

    // ════════════════════════════════════════════════════
    // OBJETOS DO LOBBY
    // ════════════════════════════════════════════════════

    /**
     * layer 0 → desenhado ANTES do NPC
     * layer 1 → desenhado DEPOIS do NPC (frente)
     */
    const _objetos = [
        { tipo: "biblioteca",  tileX: 7,          tileY: 10,         escala: 0.9,  layer: 0 },
        { tipo: "cadeiraEsq",  tileX: 50 - 1.77,  tileY: 50 - 0.20, escala: 0.22, layer: 0 },
        { tipo: "cadeiraDir",  tileX: 50 + 1.77,  tileY: 50 - 0.20, escala: 0.22, layer: 0 },
        { tipo: "mesa",        tileX: 50,          tileY: 50,         escala: 0.42, layer: 1 },
    ];

    // ════════════════════════════════════════════════════
    // NPC — Santa Teresinha andando
    // ════════════════════════════════════════════════════
    const _npc = {
        tileX   : 50,
        tileY   : 50,
        dirX    : 1,
        dirY    : 0,
        frame   : 0,
        tick    : 0,       // controla troca de frame
        escala  : CFG.NPC_ESCALA,
        sombra  : 0.30,
        // Smooth position (interpolada entre tiles)
        renderX : 50,
        renderY : 50,
    };

    /**
     * Escolhe nova direção para o NPC.
     * Regras:
     *  - Só anda em tiles de estrada
     *  - Não vai na direção oposta (evita zigue-zague)
     *  - Prioriza continuar em frente quando possível
     */
    function _escolherDirecao() {
        const cx = Math.round(_npc.tileX);
        const cy = Math.round(_npc.tileY);

        const dirs = [
            { x:  1, y:  0 },
            { x: -1, y:  0 },
            { x:  0, y:  1 },
            { x:  0, y: -1 },
        ];

        // Direção oposta (a evitar)
        const opX = -_npc.dirX;
        const opY = -_npc.dirY;

        // Direções válidas: dentro do mapa, na estrada, não é oposta
        const validas = dirs.filter(d => {
            const nx = cx + d.x;
            const ny = cy + d.y;
            return (
                nx >= 1 && ny >= 1 && nx < MAP_W - 1 && ny < MAP_H - 1 &&
                _eEstrada(nx, ny) &&
                !(d.x === opX && d.y === opY)
            );
        });

        if (validas.length === 0) {
            // Sem saída — permite voltar
            const qualquer = dirs.filter(d => {
                const nx = cx + d.x;
                const ny = cy + d.y;
                return nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H && _eEstrada(nx, ny);
            });
            if (qualquer.length > 0) {
                const d = qualquer[Math.floor(Math.random() * qualquer.length)];
                _npc.dirX = d.x;
                _npc.dirY = d.y;
            }
            return;
        }

        // 70% chance de continuar em frente se possível
        const emFrente = validas.find(d => d.x === _npc.dirX && d.y === _npc.dirY);
        if (emFrente && Math.random() < 0.70) {
            _npc.dirX = emFrente.x;
            _npc.dirY = emFrente.y;
        } else {
            const d = validas[Math.floor(Math.random() * validas.length)];
            _npc.dirX = d.x;
            _npc.dirY = d.y;
        }
    }

    function _atualizarNPC() {
        // Avança posição
        _npc.tileX += _npc.dirX * CFG.NPC_VELOCIDADE;
        _npc.tileY += _npc.dirY * CFG.NPC_VELOCIDADE;

        // Smooth render position (lerp suave)
        _npc.renderX += (_npc.tileX - _npc.renderX) * 0.25;
        _npc.renderY += (_npc.tileY - _npc.renderY) * 0.25;

        // Verifica se chegou perto do centro do próximo tile
        const cx = Math.round(_npc.tileX);
        const cy = Math.round(_npc.tileY);

        if (
            Math.abs(_npc.tileX - cx) < CFG.NPC_VELOCIDADE &&
            Math.abs(_npc.tileY - cy) < CFG.NPC_VELOCIDADE
        ) {
            // Snap ao centro do tile
            _npc.tileX = cx;
            _npc.tileY = cy;
            _escolherDirecao();
        }

        // Animação de frame
        _npc.tick++;
        if (_npc.tick >= CFG.NPC_FRAME_DURACAO) {
            _npc.tick  = 0;
            _npc.frame = (_npc.frame + 1) % CFG.NPC_FRAMES;
        }
    }

    // ════════════════════════════════════════════════════
    // CÂMERA
    // ════════════════════════════════════════════════════
    const _cam = {
        x  : 0,
        y  : 0,
        vx : 0,     // velocidade inercial
        vy : 0,
        // drag state
        _drag  : false,
        _lastX : 0,
        _lastY : 0,
        _atrito: 0.88,
    };

    function _camLimitar() {
        const maxX = MAP_W * TILE - (_canvas?.width  ?? 800);
        const maxY = MAP_H * TILE - (_canvas?.height ?? 600);
        _cam.x = Math.max(0, Math.min(maxX, _cam.x));
        _cam.y = Math.max(0, Math.min(maxY, _cam.y));
    }

    function _camAtualizarInercia() {
        if (_cam._drag) return;
        _cam.x  += _cam.vx;
        _cam.y  += _cam.vy;
        _cam.vx *= _cam._atrito;
        _cam.vy *= _cam._atrito;
        if (Math.abs(_cam.vx) < 0.1) _cam.vx = 0;
        if (Math.abs(_cam.vy) < 0.1) _cam.vy = 0;
        _camLimitar();
    }

    /** Centraliza câmera em um ponto do mapa (tile coords) */
    function centralizar(tileX, tileY) {
        _cam.x  = tileX * TILE - (_canvas?.width  ?? 800)  / 2;
        _cam.y  = tileY * TILE - (_canvas?.height ?? 600) / 2;
        _cam.vx = 0;
        _cam.vy = 0;
        _camLimitar();
    }

    // ════════════════════════════════════════════════════
    // DRAW — CHÃO (Tilemap com culling)
    // ════════════════════════════════════════════════════
    function _desenharChao(assets) {
        const W  = _canvas.width;
        const H  = _canvas.height;
        const t  = Date.now();

        // Viewport culling — só desenha tiles visíveis
        const startX = Math.max(0, Math.floor(_cam.x / TILE) - 1);
        const startY = Math.max(0, Math.floor(_cam.y / TILE) - 1);
        const endX   = Math.min(MAP_W, startX + Math.ceil(W / TILE) + 2);
        const endY   = Math.min(MAP_H, startY + Math.ceil(H / TILE) + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = _mapa[y]?.[x];
                if (!tile) continue;

                const dx = Math.floor(x * TILE - _cam.x);
                const dy = Math.floor(y * TILE - _cam.y);

                // Escolhe imagem
                let img;
                if (tile.tipo === 5) {
                    img = assets.estrada;
                } else {
                    img = assets.gramas?.[tile.tipo] ?? assets.gramas?.[0];
                }

                if (img?.complete && img.naturalWidth > 0) {
                    _ctx.drawImage(img, dx, dy, TILE, TILE);
                } else {
                    // Fallback cor
                    _ctx.fillStyle = tile.tipo === 5 ? "#7c6a44" : "#3a8c3f";
                    _ctx.fillRect(dx, dy, TILE, TILE);
                }

                // Micro-sombra de variação de grama
                if (tile.sombra > 0) {
                    _ctx.fillStyle = `rgba(0,0,0,${tile.sombra})`;
                    _ctx.fillRect(dx, dy, TILE, TILE);
                }

                // Luz ambiente pulsante (só grama)
                if (tile.tipo !== 5) {
                    const luzAlpha = Math.sin(t * CFG.LUZ_FREQ + tile.luzFase) * CFG.LUZ_AMP;
                    if (luzAlpha > 0) {
                        _ctx.fillStyle = `rgba(255,255,200,${luzAlpha})`;
                        _ctx.fillRect(dx, dy, TILE, TILE);
                    }
                }
            }
        }

        // Névoa nas bordas do mapa (atmosfera)
        _desenharNevoaBordas(W, H);
    }

    /** Névoa suave nas 4 bordas do viewport */
    function _desenharNevoaBordas(W, H) {
        const fade = 80;

        const bordas = [
            { x: 0,      y: 0,      w: W,    h: fade, dir: "bottom" },
            { x: 0,      y: H-fade, w: W,    h: fade, dir: "top"    },
            { x: 0,      y: 0,      w: fade, h: H,    dir: "right"  },
            { x: W-fade, y: 0,      w: fade, h: H,    dir: "left"   },
        ];

        bordas.forEach(b => {
            let g;
            if (b.dir === "bottom") {
                g = _ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
            } else if (b.dir === "top") {
                g = _ctx.createLinearGradient(0, b.y + b.h, 0, b.y);
            } else if (b.dir === "right") {
                g = _ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
            } else {
                g = _ctx.createLinearGradient(b.x + b.w, 0, b.x, 0);
            }
            g.addColorStop(0,   `rgba(10,8,20,${CFG.NEVOA_ALPHA})`);
            g.addColorStop(1,   "rgba(10,8,20,0)");
            _ctx.fillStyle = g;
            _ctx.fillRect(b.x, b.y, b.w, b.h);
        });
    }

    // ════════════════════════════════════════════════════
    // DRAW — OBJETOS (ordenados por Y para pseudo-3D)
    // ════════════════════════════════════════════════════
    function _desenharObjetos(assets, layer) {
        // Ordena por tileY dentro do layer — pseudo-isométrico
        const filtrados = _objetos
            .filter(o => o.layer === layer)
            .sort((a, b) => a.tileY - b.tileY);

        filtrados.forEach(obj => {
            const img = assets[obj.tipo];
            if (!img?.complete || img.naturalWidth === 0) return;

            const larg = img.width  * obj.escala;
            const alt  = img.height * obj.escala;

            // Base do objeto = canto inferior do tile
            const bX = obj.tileX * TILE + TILE / 2 - _cam.x;
            const bY = obj.tileY * TILE + TILE       - _cam.y;

            // Culling — não desenha se fora do viewport
            if (bX + larg / 2 < 0 || bX - larg / 2 > _canvas.width)  return;
            if (bY < 0            || bY - alt         > _canvas.height) return;

            const dx = Math.floor(bX - larg / 2);
            const dy = Math.floor(bY - alt);

            // Sombra elíptica no chão
            _ctx.save();
            _ctx.fillStyle = `rgba(0,0,0,${CFG.SOMBRA_OBJETO_ALPHA})`;
            _ctx.beginPath();
            _ctx.ellipse(bX, bY - CFG.SOMBRA_OBJETO_H, larg * 0.35, 7, 0, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.restore();

            // Objeto
            _ctx.drawImage(img, dx, dy, larg, alt);
        });
    }

    // ════════════════════════════════════════════════════
    // DRAW — NPC Santa
    // ════════════════════════════════════════════════════
    function _desenharNPC(assets) {
        const frames = assets.santaAnda;
        if (!frames?.length) return;

        const img = frames[_npc.frame];
        if (!img?.complete || img.naturalWidth === 0) {
            _desenharNPCFallback();
            return;
        }

        const larg = img.width  * _npc.escala;
        const alt  = img.height * _npc.escala;

        // Posição renderizada (suavizada)
        const bX = _npc.renderX * TILE + TILE / 2 - _cam.x;
        const bY = _npc.renderY * TILE + TILE       - _cam.y;

        const dx = Math.floor(bX - larg / 2);
        const dy = Math.floor(bY - alt);

        // Culling
        if (bX + larg < 0 || bX - larg > _canvas.width)  return;
        if (bY < 0        || bY - alt  > _canvas.height)  return;

        // Sombra elíptica
        _ctx.save();
        _ctx.fillStyle = "rgba(0,0,0,0.22)";
        _ctx.beginPath();
        _ctx.ellipse(bX, bY - 3, larg * 0.38, 6, 0, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.restore();

        // Halo suave (efeito "personagem jogável")
        _ctx.save();
        const halo = _ctx.createRadialGradient(bX, bY - alt * 0.5, 2, bX, bY - alt * 0.5, larg * 0.7);
        halo.addColorStop(0,   "rgba(255,220,255,0.10)");
        halo.addColorStop(1,   "rgba(255,220,255,0.00)");
        _ctx.fillStyle = halo;
        _ctx.fillRect(dx - 10, dy - 10, larg + 20, alt + 20);
        _ctx.restore();

        // Flip horizontal: se andando para esquerda, espelha o sprite
        _ctx.save();
        if (_npc.dirX < 0) {
            // Espelha em relação ao centro do sprite
            _ctx.translate(bX, 0);
            _ctx.scale(-1, 1);
            _ctx.drawImage(img, -larg / 2, dy, larg, alt);
        } else {
            _ctx.drawImage(img, dx, dy, larg, alt);
        }
        _ctx.restore();
    }

    /** NPC Fallback: boneca simples quando sprite não carregou */
    function _desenharNPCFallback() {
        const bX = _npc.renderX * TILE + TILE / 2 - _cam.x;
        const bY = _npc.renderY * TILE + TILE       - _cam.y;
        const r  = 10;

        _ctx.save();
        _ctx.fillStyle   = "#e8c5ff";
        _ctx.strokeStyle = "#9d4edd";
        _ctx.lineWidth   = 2;
        _ctx.beginPath();
        _ctx.arc(bX, bY - r * 2.5, r, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.stroke();

        _ctx.fillStyle = "#6d28d9";
        _ctx.fillRect(bX - r * 0.7, bY - r * 1.6, r * 1.4, r * 1.8);

        _ctx.font         = "14px serif";
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "bottom";
        _ctx.fillStyle    = "#fff";
        _ctx.fillText("🌹", bX, bY - r * 0.2);
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // RENDER PRINCIPAL
    // Ordem:
    //  1. Chão (com névoa)
    //  2. Objetos layer 0 (atrás do NPC)
    //  3. NPC
    //  4. Objetos layer 1 (frente do NPC)
    // ════════════════════════════════════════════════════
    function _render(assets) {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        _desenharChao(assets);
        _desenharObjetos(assets, 0);
        _desenharNPC(assets);
        _desenharObjetos(assets, 1);
    }

    // ════════════════════════════════════════════════════
    // INPUT — Câmera arrastável
    // ════════════════════════════════════════════════════
    function _registrarInput() {
        if (!_canvas) return;

        // ── Mouse ──
        _canvas.addEventListener("mousedown", e => {
            _cam._drag  = true;
            _cam._lastX = e.clientX;
            _cam._lastY = e.clientY;
            _cam.vx     = 0;
            _cam.vy     = 0;
        });

        window.addEventListener("mouseup", () => {
            _cam._drag = false;
        });

        window.addEventListener("mousemove", e => {
            if (!_cam._drag) return;
            const dx  = e.clientX - _cam._lastX;
            const dy  = e.clientY - _cam._lastY;
            _cam.vx   = -dx;
            _cam.vy   = -dy;
            _cam.x   -= dx;
            _cam.y   -= dy;
            _cam._lastX = e.clientX;
            _cam._lastY = e.clientY;
            _camLimitar();
        });

        // ── Touch ──
        _canvas.addEventListener("touchstart", e => {
            if (e.touches.length !== 1) return;
            _cam._drag  = true;
            _cam._lastX = e.touches[0].clientX;
            _cam._lastY = e.touches[0].clientY;
            _cam.vx     = 0;
            _cam.vy     = 0;
        }, { passive: true });

        window.addEventListener("touchend", () => {
            _cam._drag = false;
        });

        window.addEventListener("touchmove", e => {
            if (!_cam._drag || e.touches.length !== 1) return;
            const dx    = e.touches[0].clientX - _cam._lastX;
            const dy    = e.touches[0].clientY - _cam._lastY;
            _cam.vx     = -dx;
            _cam.vy     = -dy;
            _cam.x     -= dx;
            _cam.y     -= dy;
            _cam._lastX = e.touches[0].clientX;
            _cam._lastY = e.touches[0].clientY;
            _camLimitar();
        }, { passive: true });

        _log.debug("Input do lobby registrado.");
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR (chamado a cada frame pelo renderer-main)
    // ════════════════════════════════════════════════════
    function atualizar(assets) {
        _atualizarNPC();
        _camAtualizarInercia();
        _render(assets);
    }

    // ════════════════════════════════════════════════════
    // RESIZE
    // ════════════════════════════════════════════════════
    function aoRedimensionar() {
        if (!_canvas) return;
        _camLimitar();
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init(canvas, ctx) {
        if (!canvas || !ctx) {
            _log.error("init: canvas ou ctx inválido.");
            return;
        }

        _canvas = canvas;
        _ctx    = ctx;

        // Desativa suavização — pixel art nítido
        _ctx.imageSmoothingEnabled = false;

        // Constrói mapa
        _construirMapa();

        // Câmera começa centralizada no meio do mapa
        centralizar(MAP_W / 2, MAP_H / 2);

        // Input
        _registrarInput();

        _log.info("RendererLobby inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            camera  : { x: Math.floor(_cam.x), y: Math.floor(_cam.y), vx: _cam.vx.toFixed(2), vy: _cam.vy.toFixed(2) },
            npc     : { tileX: _npc.tileX.toFixed(2), tileY: _npc.tileY.toFixed(2), frame: _npc.frame, dir: { x: _npc.dirX, y: _npc.dirY } },
            mapa    : { w: MAP_W, h: MAP_H, estrada: _estradaSet.size },
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        atualizar,
        aoRedimensionar,
        centralizar,
        stats,

        // Expõe câmera para input.js se precisar
        get camX() { return _cam.x; },
        get camY() { return _cam.y; },
    });

})();
