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
        NPC_FRAME_DURACAO : 8,
        NPC_VELOCIDADE    : 0.03,

        // Visual
        SOMBRA_OBJETO_ALPHA : 0.25,
        SOMBRA_OBJETO_H     : 5,
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
    // ASSETS — cache local para não depender do objeto
    // externo a cada frame
    // ════════════════════════════════════════════════════
    let _assets         = null;   // último objeto assets recebido
    let _assetsOk       = false;  // true quando tiles críticos existem
    let _assetsChecados = false;  // evita checar todo frame

    function _checarAssets(assets) {
        if (_assetsChecados && _assetsOk) return;

        _assets = assets;

        // Verifica se tiles críticos estão presentes
        const temEstrada = assets?.estrada?.complete && assets.estrada.naturalWidth > 0;
        const temGrama   = assets?.gramas?.[0]?.complete && assets.gramas[0].naturalWidth > 0;

        _assetsOk       = temEstrada && temGrama;
        _assetsChecados = true;

        if (_assetsOk) {
            _log.info("Assets do lobby prontos para renderizar.");
        }
    }

    // ════════════════════════════════════════════════════
    // MAPA
    // ════════════════════════════════════════════════════
    let _mapa = [];
    const _estradaSet = new Set();

    function _eEstrada(x, y) {
        return _estradaSet.has(`${x},${y}`);
    }

    function _construirMapa() {
        const cX  = Math.floor(MAP_W / 2);
        const cY  = Math.floor(MAP_H / 2);
        const esY = 12;
        const lC  = 1;

        _mapa = [];
        _estradaSet.clear();

        for (let y = 0; y < MAP_H; y++) {
            _mapa[y] = [];
            for (let x = 0; x < MAP_W; x++) {

                let tipo = Math.floor(Math.random() * CFG.GRAMAS_QTD);

                if (y >= cY - lC && y <= cY + lC) tipo = 5;
                if (x >= cX - lC && x <= cX + lC) tipo = 5;
                if (y >= esY - lC && y <= esY + lC) tipo = 5;
                if (x >= cX - lC && x <= cX + lC &&
                    y >= Math.min(esY, cY) && y <= Math.max(esY, cY)) tipo = 5;

                const sombra   = tipo === 5 ? 0 : Math.random() * 0.06;
                const luzFase  = (x * 7 + y * 13) % 628 / 100;

                _mapa[y][x] = { tipo, sombra, luzFase };

                if (tipo === 5) _estradaSet.add(`${x},${y}`);
            }
        }

        _log.info(`Mapa construído: ${MAP_W}×${MAP_H}, estrada: ${_estradaSet.size} tiles`);
    }

    // ════════════════════════════════════════════════════
    // OBJETOS DO LOBBY
    // ════════════════════════════════════════════════════
    const _objetos = [
        { tipo: "biblioteca", tileX: 7,         tileY: 10,         escala: 0.9,  layer: 0 },
        { tipo: "cadeiraEsq", tileX: 50 - 1.77, tileY: 50 - 0.20, escala: 0.22, layer: 0 },
        { tipo: "cadeiraDir", tileX: 50 + 1.77, tileY: 50 - 0.20, escala: 0.22, layer: 0 },
        { tipo: "mesa",       tileX: 50,         tileY: 50,         escala: 0.42, layer: 1 },
    ];

    // ════════════════════════════════════════════════════
    // NPC
    // ════════════════════════════════════════════════════
    const _npc = {
        tileX   : 50,
        tileY   : 50,
        dirX    : 1,
        dirY    : 0,
        frame   : 0,
        tick    : 0,
        escala  : CFG.NPC_ESCALA,
        renderX : 50,
        renderY : 50,
    };

    function _escolherDirecao() {
        const cx = Math.round(_npc.tileX);
        const cy = Math.round(_npc.tileY);

        const dirs = [
            { x:  1, y:  0 },
            { x: -1, y:  0 },
            { x:  0, y:  1 },
            { x:  0, y: -1 },
        ];

        const opX = -_npc.dirX;
        const opY = -_npc.dirY;

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
        _npc.tileX += _npc.dirX * CFG.NPC_VELOCIDADE;
        _npc.tileY += _npc.dirY * CFG.NPC_VELOCIDADE;

        _npc.renderX += (_npc.tileX - _npc.renderX) * 0.25;
        _npc.renderY += (_npc.tileY - _npc.renderY) * 0.25;

        const cx = Math.round(_npc.tileX);
        const cy = Math.round(_npc.tileY);

        if (
            Math.abs(_npc.tileX - cx) < CFG.NPC_VELOCIDADE &&
            Math.abs(_npc.tileY - cy) < CFG.NPC_VELOCIDADE
        ) {
            _npc.tileX = cx;
            _npc.tileY = cy;
            _escolherDirecao();
        }

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
        x      : 0,
        y      : 0,
        vx     : 0,
        vy     : 0,
        _drag  : false,
        _lastX : 0,
        _lastY : 0,
        _atrito: 0.88,
    };

    function _camLimitar() {
        const W   = _canvas?.width  ?? 800;
        const H   = _canvas?.height ?? 600;
        const maxX = MAP_W * TILE - W;
        const maxY = MAP_H * TILE - H;
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

    function centralizar(tileX, tileY) {
        const W = _canvas?.width  ?? 800;
        const H = _canvas?.height ?? 600;
        _cam.x  = tileX * TILE - W / 2;
        _cam.y  = tileY * TILE - H / 2;
        _cam.vx = 0;
        _cam.vy = 0;
        _camLimitar();
    }

    // ════════════════════════════════════════════════════
    // DRAW — FALLBACK (quando assets ainda não carregaram)
    // ════════════════════════════════════════════════════
    function _desenharFallback() {
        const W = _canvas.width;
        const H = _canvas.height;

        // Fundo verde escuro
        _ctx.fillStyle = "#2d5a27";
        _ctx.fillRect(0, 0, W, H);

        // Grade simples de tiles
        const startX = Math.max(0, Math.floor(_cam.x / TILE));
        const startY = Math.max(0, Math.floor(_cam.y / TILE));
        const endX   = Math.min(MAP_W, startX + Math.ceil(W / TILE) + 1);
        const endY   = Math.min(MAP_H, startY + Math.ceil(H / TILE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = _mapa[y]?.[x];
                if (!tile) continue;

                const dx = Math.floor(x * TILE - _cam.x);
                const dy = Math.floor(y * TILE - _cam.y);

                _ctx.fillStyle = tile.tipo === 5 ? "#7c6a44" : "#3a8c3f";
                _ctx.fillRect(dx, dy, TILE - 1, TILE - 1);
            }
        }

        // NPC fallback
        _desenharNPCFallback();

        // Texto informativo
        _ctx.save();
        _ctx.fillStyle    = "rgba(0,0,0,0.5)";
        _ctx.fillRect(W/2 - 120, H/2 - 20, 240, 36);
        _ctx.font         = "13px 'Nunito', sans-serif";
        _ctx.fillStyle    = "rgba(255,255,255,0.8)";
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";
        _ctx.fillText("⏳ Carregando assets...", W / 2, H / 2);
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // DRAW — CHÃO
    // ════════════════════════════════════════════════════
    function _desenharChao(assets) {
        const W = _canvas.width;
        const H = _canvas.height;
        const t = Date.now();

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

                let img;
                if (tile.tipo === 5) {
                    img = assets.estrada;
                } else {
                    img = assets.gramas?.[tile.tipo] ?? assets.gramas?.[0];
                }

                if (img?.complete && img.naturalWidth > 0) {
                    _ctx.drawImage(img, dx, dy, TILE, TILE);
                } else {
                    _ctx.fillStyle = tile.tipo === 5 ? "#7c6a44" : "#3a8c3f";
                    _ctx.fillRect(dx, dy, TILE, TILE);
                }

                if (tile.sombra > 0) {
                    _ctx.fillStyle = `rgba(0,0,0,${tile.sombra})`;
                    _ctx.fillRect(dx, dy, TILE, TILE);
                }

                if (tile.tipo !== 5) {
                    const luzAlpha = Math.sin(t * CFG.LUZ_FREQ + tile.luzFase) * CFG.LUZ_AMP;
                    if (luzAlpha > 0) {
                        _ctx.fillStyle = `rgba(255,255,200,${luzAlpha})`;
                        _ctx.fillRect(dx, dy, TILE, TILE);
                    }
                }
            }
        }

        _desenharNevoaBordas(W, H);
    }

    function _desenharNevoaBordas(W, H) {
        const fade = 80;
        const bordas = [
            { x: 0,      y: 0,      w: W,    h: fade, x1: 0, y1: 0,      x2: 0,      y2: fade  },
            { x: 0,      y: H-fade, w: W,    h: fade, x1: 0, y1: H,      x2: 0,      y2: H-fade},
            { x: 0,      y: 0,      w: fade, h: H,    x1: 0, y1: 0,      x2: fade,   y2: 0     },
            { x: W-fade, y: 0,      w: fade, h: H,    x1: W, y1: 0,      x2: W-fade, y2: 0     },
        ];

        bordas.forEach(b => {
            const g = _ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
            g.addColorStop(0, `rgba(10,8,20,${CFG.NEVOA_ALPHA})`);
            g.addColorStop(1, "rgba(10,8,20,0)");
            _ctx.fillStyle = g;
            _ctx.fillRect(b.x, b.y, b.w, b.h);
        });
    }

    // ════════════════════════════════════════════════════
    // DRAW — OBJETOS
    // ════════════════════════════════════════════════════
    function _desenharObjetos(assets, layer) {
        _objetos
            .filter(o => o.layer === layer)
            .sort((a, b) => a.tileY - b.tileY)
            .forEach(obj => {
                const img = assets[obj.tipo];
                if (!img?.complete || img.naturalWidth === 0) return;

                const larg = img.width  * obj.escala;
                const alt  = img.height * obj.escala;

                const bX = obj.tileX * TILE + TILE / 2 - _cam.x;
                const bY = obj.tileY * TILE + TILE       - _cam.y;

                if (bX + larg / 2 < 0 || bX - larg / 2 > _canvas.width)  return;
                if (bY < 0            || bY - alt        > _canvas.height) return;

                const dx = Math.floor(bX - larg / 2);
                const dy = Math.floor(bY - alt);

                _ctx.save();
                _ctx.fillStyle = `rgba(0,0,0,${CFG.SOMBRA_OBJETO_ALPHA})`;
                _ctx.beginPath();
                _ctx.ellipse(bX, bY - CFG.SOMBRA_OBJETO_H, larg * 0.35, 7, 0, 0, Math.PI * 2);
                _ctx.fill();
                _ctx.restore();

                _ctx.drawImage(img, dx, dy, larg, alt);
            });
    }

    // ════════════════════════════════════════════════════
    // DRAW — NPC
    // ════════════════════════════════════════════════════
    function _desenharNPC(assets) {
        const frames = assets.santaAnda;
        if (!frames?.length) {
            _desenharNPCFallback();
            return;
        }

        const img = frames[_npc.frame];
        if (!img?.complete || img.naturalWidth === 0) {
            _desenharNPCFallback();
            return;
        }

        const larg = img.width  * _npc.escala;
        const alt  = img.height * _npc.escala;

        const bX = _npc.renderX * TILE + TILE / 2 - _cam.x;
        const bY = _npc.renderY * TILE + TILE       - _cam.y;

        const dx = Math.floor(bX - larg / 2);
        const dy = Math.floor(bY - alt);

        if (bX + larg < 0 || bX - larg > _canvas.width)  return;
        if (bY < 0        || bY - alt  > _canvas.height)  return;

        // Sombra
        _ctx.save();
        _ctx.fillStyle = "rgba(0,0,0,0.22)";
        _ctx.beginPath();
        _ctx.ellipse(bX, bY - 3, larg * 0.38, 6, 0, 0, Math.PI * 2);
        _ctx.fill();
        _ctx.restore();

        // Halo
        _ctx.save();
        const halo = _ctx.createRadialGradient(
            bX, bY - alt * 0.5, 2,
            bX, bY - alt * 0.5, larg * 0.7
        );
        halo.addColorStop(0, "rgba(255,220,255,0.10)");
        halo.addColorStop(1, "rgba(255,220,255,0.00)");
        _ctx.fillStyle = halo;
        _ctx.fillRect(dx - 10, dy - 10, larg + 20, alt + 20);
        _ctx.restore();

        // Sprite (com flip horizontal)
        _ctx.save();
        if (_npc.dirX < 0) {
            _ctx.translate(bX, 0);
            _ctx.scale(-1, 1);
            _ctx.drawImage(img, -larg / 2, dy, larg, alt);
        } else {
            _ctx.drawImage(img, dx, dy, larg, alt);
        }
        _ctx.restore();
    }

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
    // ════════════════════════════════════════════════════
    function _render(assets) {
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        // ✅ Se assets não estão prontos, desenha fallback
        // mas ainda mostra o mapa com cores sólidas
        if (!_assetsOk) {
            _desenharFallback();
            return;
        }

        _desenharChao(assets);
        _desenharObjetos(assets, 0);
        _desenharNPC(assets);
        _desenharObjetos(assets, 1);
    }

    // ════════════════════════════════════════════════════
    // INPUT
    // ════════════════════════════════════════════════════
    function _registrarInput() {
        if (!_canvas) return;

        _canvas.addEventListener("mousedown", e => {
            _cam._drag  = true;
            _cam._lastX = e.clientX;
            _cam._lastY = e.clientY;
            _cam.vx     = 0;
            _cam.vy     = 0;
        });

        window.addEventListener("mouseup", () => { _cam._drag = false; });

        window.addEventListener("mousemove", e => {
            if (!_cam._drag) return;
            const dx    = e.clientX - _cam._lastX;
            const dy    = e.clientY - _cam._lastY;
            _cam.vx     = -dx;
            _cam.vy     = -dy;
            _cam.x     -= dx;
            _cam.y     -= dy;
            _cam._lastX = e.clientX;
            _cam._lastY = e.clientY;
            _camLimitar();
        });

        _canvas.addEventListener("touchstart", e => {
            if (e.touches.length !== 1) return;
            _cam._drag  = true;
            _cam._lastX = e.touches[0].clientX;
            _cam._lastY = e.touches[0].clientY;
            _cam.vx     = 0;
            _cam.vy     = 0;
        }, { passive: true });

        window.addEventListener("touchend", () => { _cam._drag = false; });

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
    // ATUALIZAR — chamado a cada frame
    // ════════════════════════════════════════════════════
    function atualizar(assets) {
        if (!_canvas || !_ctx) return;

        // Checa assets uma vez quando ficam prontos
        _checarAssets(assets);

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
    // INIT
    // ════════════════════════════════════════════════════
    function init(canvas, ctx) {
        if (!canvas || !ctx) {
            _log.error("init: canvas ou ctx inválido.");
            return;
        }

        _canvas = canvas;
        _ctx    = ctx;
        _ctx.imageSmoothingEnabled = false;

        _construirMapa();
        centralizar(MAP_W / 2, MAP_H / 2);
        _registrarInput();

        // Invalida cache de assets quando recarregam
        try {
            EventBus.on("assets:completo", () => {
                _assetsOk       = false;
                _assetsChecados = false;
                _log.debug("Cache de assets invalidado — será rechecado no próximo frame.");
            });
        } catch(_) {}

        _log.info("RendererLobby inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            camera : {
                x  : Math.floor(_cam.x),
                y  : Math.floor(_cam.y),
                vx : _cam.vx.toFixed(2),
                vy : _cam.vy.toFixed(2),
            },
            npc    : {
                tileX : _npc.tileX.toFixed(2),
                tileY : _npc.tileY.toFixed(2),
                frame : _npc.frame,
                dir   : { x: _npc.dirX, y: _npc.dirY },
            },
            mapa   : {
                w       : MAP_W,
                h       : MAP_H,
                estrada : _estradaSet.size,
            },
            assets : {
                ok       : _assetsOk,
                checados : _assetsChecados,
            },
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

        get camX() { return _cam.x; },
        get camY() { return _cam.y; },
    });

})();

window.RendererLobby = RendererLobby;
