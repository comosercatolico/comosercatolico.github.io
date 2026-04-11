// ═══════════════════════════════════════════════════════
//  RENDERER-BATTLE.JS
//  Renderiza a tela de batalha completa:
//  - Fundo / cenário com parallax sutil
//  - Chão (piso1.png com remoção de fundo preto)
//  - Monstro (emoji grande, glow dinâmico, hit flash, tremor)
//  - Santa Teresinha (sprite animado, flip, ataque)
//  - Barra de HP animada sobre o monstro
//  - Efeitos via Effects.js
//
//  Depende de: asset-loader.js, camera.js, effects.js
//  Usado por: renderer-main.js
// ═══════════════════════════════════════════════════════

"use strict";

const RendererBattle = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("RendererBattle"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Layout (% do canvas)
        CHAO_Y_PCT         : 0.78,
        SANTA_X_PCT        : 0.22,
        MONSTRO_X_PCT      : 0.62,
        MONSTRO_Y_PCT      : 0.40,

        // Santa
        SANTA_FRAMES       : 8,
        SANTA_FRAME_TICKS  : 5,
        SANTA_ALTURA_PCT   : 0.20,   // altura como % do canvas.height
        SANTA_ATAQUE_DUR   : 28,     // ticks que dura animação de ataque

        // Monstro
        MONSTRO_TAM_BASE   : 0.34,   // % canvas.height
        MONSTRO_TAM_BONUS  : 0.06,   // escala adicional quando HP alto
        MONSTRO_GLOW_BASE  : 40,
        MONSTRO_GLOW_AMP   : 15,
        MONSTRO_GLOW_FREQ  : 0.004,
        MONSTRO_TREMOR_AMP : 16,

        // Chão processado (remove fundo preto)
        CHAO_PRETO_THRESH  : 30,     // brilho abaixo = transparente
        CHAO_SUAVE_THRESH  : 60,     // brilho abaixo = semi-transparente
        CHAO_ANCORA_PCT    : 0.30,   // % da altura da imagem = superfície

        // Parallax do cenário
        PARALLAX_FATOR     : 0.018,

        // Barra de HP flutuante
        HP_BAR_LARGURA     : 0.28,   // % canvas.width
        HP_BAR_ALTURA      : 10,
        HP_BAR_OFFSET_Y    : 0.16,   // acima do centro do monstro
        HP_BAR_RAIO        : 5,
        HP_ANIM_SPEED      : 0.06,   // velocidade do lerp da barra
    });

    // ════════════════════════════════════════════════════
    // REFERÊNCIAS EXTERNAS
    // ════════════════════════════════════════════════════
    let _canvas = null;
    let _ctx    = null;

    // ════════════════════════════════════════════════════
    // HELPERS DE POSIÇÃO
    // Calculados em runtime para suportar resize
    // ════════════════════════════════════════════════════
    function _chaoY()    { return _canvas.height * CFG.CHAO_Y_PCT;    }
    function _santaX()   { return _canvas.width  * CFG.SANTA_X_PCT;   }
    function _monstroX() { return _canvas.width  * CFG.MONSTRO_X_PCT; }
    function _monstroY() { return _canvas.height * CFG.MONSTRO_Y_PCT; }

    // ════════════════════════════════════════════════════
    // CHÃO PROCESSADO
    // Remove fundo preto do piso1.png uma única vez
    // usando canvas auxiliar offscreen
    // ════════════════════════════════════════════════════
    const _chaoCache = {
        canvas     : null,
        processado : false,
    };

    function _processarChao(imgChao) {
        if (_chaoCache.processado) return;
        if (!imgChao?.complete || imgChao.naturalWidth === 0) return;

        const oc  = document.createElement("canvas");
        oc.width  = imgChao.naturalWidth;
        oc.height = imgChao.naturalHeight;
        const oc2 = oc.getContext("2d");
        oc2.drawImage(imgChao, 0, 0);

        const id   = oc2.getImageData(0, 0, oc.width, oc.height);
        const data = id.data;

        for (let i = 0; i < data.length; i += 4) {
            const brilho = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brilho < CFG.CHAO_PRETO_THRESH) {
                data[i+3] = 0;
            } else if (brilho < CFG.CHAO_SUAVE_THRESH) {
                data[i+3] = Math.floor(
                    ((brilho - CFG.CHAO_PRETO_THRESH) /
                     (CFG.CHAO_SUAVE_THRESH - CFG.CHAO_PRETO_THRESH)) * 255
                );
            }
        }

        oc2.putImageData(id, 0, 0);
        _chaoCache.canvas     = oc;
        _chaoCache.processado = true;
        _log.info("Chão processado — fundo preto removido.");
    }

    // ════════════════════════════════════════════════════
    // HIT STATE
    // Controla tremor e flash ao levar dano
    // ════════════════════════════════════════════════════
    const _hit = {
        tremendo : 0,   // ticks restantes de tremor
        flash    : 0,   // ticks restantes de flash vermelho
    };

    function ativarHit(intensidade = 1) {
        _hit.tremendo = Math.round(14 * intensidade);
        _hit.flash    = Math.round(10 * intensidade);
    }

    function _tickHit() {
        if (_hit.tremendo > 0) _hit.tremendo--;
        if (_hit.flash    > 0) _hit.flash--;
    }

    // ════════════════════════════════════════════════════
    // SANTA — estado de animação
    // ════════════════════════════════════════════════════
    const _santa = {
        frame    : 0,
        tick     : 0,
        atacando : 0,    // ticks restantes de animação de ataque
    };

    function ativarAtaqueSanta() {
        _santa.atacando = CFG.SANTA_ATAQUE_DUR;
    }

    function _tickSanta() {
        _santa.tick++;
        if (_santa.tick >= CFG.SANTA_FRAME_TICKS) {
            _santa.tick  = 0;
            _santa.frame = (_santa.frame + 1) % CFG.SANTA_FRAMES;
        }
        if (_santa.atacando > 0) _santa.atacando--;
    }

    // ════════════════════════════════════════════════════
    // HP BAR — animada com lerp
    // ════════════════════════════════════════════════════
    const _hpBar = {
        pctAtual  : 1.0,   // valor exibido (lerp suave)
        pctAlvo   : 1.0,   // valor real do inimigo
    };

    function setHpAlvo(pct) {
        _hpBar.pctAlvo = Math.max(0, Math.min(1, pct));
    }

    function _tickHpBar() {
        _hpBar.pctAtual += (_hpBar.pctAlvo - _hpBar.pctAtual) * CFG.HP_ANIM_SPEED;
    }

    // ════════════════════════════════════════════════════
    // MONSTRO — estado visual
    // ════════════════════════════════════════════════════

    /** Dados do monstro atual — injetados de fora */
    const _monstro = {
        emoji      : "😈",
        emojiDor   : "😖",
        emojiMedo  : "😱",
        emojiRaiva : "👿",
        nome       : "",
        hpPct      : 1.0,   // 0~1
        chefe      : false,
    };

    function setMonstro(dados) {
        Object.assign(_monstro, dados);
        setHpAlvo(dados.hpPct ?? 1);
    }

    function _emojiAtual() {
        if (_hit.flash    > 0)          return _monstro.emojiDor;
        if (_monstro.hpPct < 0.20)      return _monstro.emojiMedo;
        if (_monstro.hpPct < 0.50)      return _monstro.emojiRaiva;
        return _monstro.emoji;
    }

    // ════════════════════════════════════════════════════
    // PARALLAX — offset baseado na posição do monstro
    // ════════════════════════════════════════════════════
    const _parallax = { ox: 0, oy: 0 };

    function _atualizarParallax(shakeX, shakeY) {
        // Oscila levemente com o tempo para dar vida ao cenário
        const t = Date.now();
        _parallax.ox = Math.sin(t * 0.0003) * 6 + shakeX * CFG.PARALLAX_FATOR;
        _parallax.oy = Math.cos(t * 0.0002) * 3 + shakeY * CFG.PARALLAX_FATOR;
    }

    // ════════════════════════════════════════════════════
    // DRAW — FUNDO / CENÁRIO
    // ════════════════════════════════════════════════════
    function _desenharFundo(assets, shakeX, shakeY) {
        const W  = _canvas.width;
        const H  = _canvas.height;
        const cy = _chaoY();

        _atualizarParallax(shakeX, shakeY);
        const px = _parallax.ox;
        const py = _parallax.oy;

        const img = assets?.cenario;

        if (img?.complete && img.naturalWidth > 0) {
            // Cobre o canvas inteiro mantendo proporção, com parallax
            const esc = Math.max(
                (W + Math.abs(px) * 2 + 20) / img.naturalWidth,
                (H + Math.abs(py) * 2 + 20) / img.naturalHeight
            );
            const dw = img.naturalWidth  * esc;
            const dh = img.naturalHeight * esc;
            const dx = (W - dw) / 2 + px;
            const dy = (H - dh) / 2 + py;

            _ctx.drawImage(img, dx, dy, dw, dh);
        } else {
            _desenharFundoFallback(W, H, cy);
        }
    }

    function _desenharFundoFallback(W, H, cy) {
        const t = Date.now();

        // Gradiente céu noturno
        const g = _ctx.createLinearGradient(0, 0, 0, cy);
        g.addColorStop(0,    "#050210");
        g.addColorStop(0.45, "#0e0930");
        g.addColorStop(1,    "#221470");
        _ctx.fillStyle = g;
        _ctx.fillRect(0, 0, W, H);

        // Estrelas
        for (let i = 0; i < 90; i++) {
            const sx = (i * 191 + 7)  % W;
            const sy = (i * 97  + 13) % (cy * 0.75);
            _ctx.globalAlpha = (Math.abs(Math.sin(t * 0.0008 + i)) * 0.6 + 0.3) * 0.55;
            _ctx.fillStyle   = "#fff";
            _ctx.beginPath();
            _ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2);
            _ctx.fill();
        }
        _ctx.globalAlpha = 1;

        // Lua
        const lx = W * 0.78, ly = H * 0.15;
        const gl = _ctx.createRadialGradient(lx, ly, 0, lx, ly, 58);
        gl.addColorStop(0,   "rgba(255,245,190,1)");
        gl.addColorStop(0.5, "rgba(255,220,120,0.45)");
        gl.addColorStop(1,   "rgba(255,200,80,0)");
        _ctx.fillStyle = gl;
        _ctx.beginPath();
        _ctx.arc(lx, ly, 58, 0, Math.PI * 2);
        _ctx.fill();

        // Silhueta de montanhas
        const pontos = [
            [0,0],[0.10,0.22],[0.22,0.09],[0.36,0.28],[0.50,0.07],
            [0.63,0.25],[0.76,0.11],[0.89,0.23],[1,0],
        ];
        _ctx.fillStyle = "rgba(12,6,32,0.85)";
        _ctx.beginPath();
        _ctx.moveTo(0, cy);
        pontos.forEach(([px, py]) => _ctx.lineTo(W * px, cy - H * 0.3 * py));
        _ctx.lineTo(W, cy);
        _ctx.closePath();
        _ctx.fill();
    }

    // ════════════════════════════════════════════════════
    // DRAW — CHÃO
    // ════════════════════════════════════════════════════
    function _desenharChao(assets) {
        const W  = _canvas.width;
        const cy = _chaoY();

        const imgChao = assets?.chao;
        if (!imgChao?.complete || imgChao.naturalWidth === 0) {
            _desenharChaoFallback(W, cy);
            return;
        }

        // Processa o fundo preto na primeira vez
        _processarChao(imgChao);

        const src    = _chaoCache.processado ? _chaoCache.canvas : imgChao;
        const pisoW  = W * 1.04;   // ligeiramente maior para cobrir bordas
        const pisoH  = imgChao.naturalHeight * (W / imgChao.naturalWidth) * 1.04;

        // Âncora: superfície do piso alinha com cy
        const pisoY = cy - pisoH * CFG.CHAO_ANCORA_PCT;

        _ctx.drawImage(src, -(pisoW - W) / 2, pisoY, pisoW, pisoH);

        // Sombra de transição chão→céu
        const gs = _ctx.createLinearGradient(0, cy - 24, 0, cy + 36);
        gs.addColorStop(0, "rgba(0,0,0,0)");
        gs.addColorStop(1, "rgba(0,0,0,0.32)");
        _ctx.fillStyle = gs;
        _ctx.fillRect(0, cy - 24, W, 60);
    }

    function _desenharChaoFallback(W, cy) {
        const H = _canvas.height;

        const g = _ctx.createLinearGradient(0, cy, 0, H);
        g.addColorStop(0,   "#2a1060");
        g.addColorStop(0.3, "#1a0840");
        g.addColorStop(1,   "#080420");
        _ctx.fillStyle = g;
        _ctx.fillRect(0, cy, W, H - cy);

        const gl = _ctx.createLinearGradient(0, 0, W, 0);
        gl.addColorStop(0,   "rgba(100,50,220,0)");
        gl.addColorStop(0.3, "rgba(160,80,255,0.55)");
        gl.addColorStop(0.7, "rgba(160,80,255,0.55)");
        gl.addColorStop(1,   "rgba(100,50,220,0)");
        _ctx.strokeStyle = gl;
        _ctx.lineWidth   = 2.5;
        _ctx.beginPath();
        _ctx.moveTo(0,  cy);
        _ctx.lineTo(W, cy);
        _ctx.stroke();
    }

    // ════════════════════════════════════════════════════
    // DRAW — MONSTRO
    // ════════════════════════════════════════════════════
    function _desenharMonstro() {
        const t   = Date.now();
        const pct = _monstro.hpPct;

        // Offset de tremor
        const ox = _hit.tremendo > 0 ? (Math.random() - 0.5) * CFG.MONSTRO_TREMOR_AMP : 0;
        const oy = _hit.tremendo > 0 ? (Math.random() - 0.5) * (CFG.MONSTRO_TREMOR_AMP * 0.6) : 0;

        // Tamanho proporcional ao HP (monstro "encolhe" ao morrer)
        const pctClamped = Math.max(0.05, pct);
        const tam = _canvas.height * (CFG.MONSTRO_TAM_BASE + pctClamped * CFG.MONSTRO_TAM_BONUS);

        const mx = _monstroX() + ox;
        const my = _monstroY() + oy;

        _ctx.save();

        // Flash vermelho ao levar dano
        if (_hit.flash > 0) {
            _ctx.filter      = "sepia(1) saturate(20) hue-rotate(300deg)";
            _ctx.globalAlpha = 0.90;
        }

        // Glow pulsante (mais intenso com pouco HP)
        const glowInt  = CFG.MONSTRO_GLOW_BASE + Math.sin(t * CFG.MONSTRO_GLOW_FREQ) * CFG.MONSTRO_GLOW_AMP;
        _ctx.shadowBlur  = glowInt;
        _ctx.shadowColor = pct < 0.25
            ? `rgba(255,220,0,0.95)`   // dourado — chefe/quase morto
            : `rgba(255,50,50,0.80)`;  // vermelho padrão

        // Emoji do monstro
        _ctx.font         = `${tam}px serif`;
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";
        _ctx.fillText(_emojiAtual(), mx, my);

        _ctx.restore();

        // Sombra elíptica no chão
        _ctx.save();
        _ctx.fillStyle = "rgba(0,0,0,0.22)";
        _ctx.beginPath();
        _ctx.ellipse(
            _monstroX(), _chaoY() + 8,
            tam * 0.30, 12,
            0, 0, Math.PI * 2
        );
        _ctx.fill();
        _ctx.restore();

        // Se for chefe — coroa flutuante acima
        if (_monstro.chefe) {
            _desenharCoroa(mx, my - tam * 0.55, t);
        }
    }

    /** Coroa animada que flutua acima do chefe */
    function _desenharCoroa(x, y, t) {
        const bob = Math.sin(t * 0.003) * 5;
        _ctx.save();
        _ctx.font         = `${_canvas.height * 0.06}px serif`;
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "bottom";
        _ctx.shadowBlur   = 20;
        _ctx.shadowColor  = "rgba(255,215,0,0.9)";
        _ctx.fillText("👑", x, y + bob);
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // DRAW — HP BAR FLUTUANTE (sobre o monstro)
    // ════════════════════════════════════════════════════
    function _desenharHpBarMonstro() {
        const W   = _canvas.width;
        const bW  = W * CFG.HP_BAR_LARGURA;
        const bH  = CFG.HP_BAR_ALTURA;
        const bX  = _monstroX() - bW / 2;
        const bY  = _monstroY() - _canvas.height * CFG.HP_BAR_OFFSET_Y;
        const r   = CFG.HP_BAR_RAIO;
        const pct = _hpBar.pctAtual;

        // Fundo
        _ctx.save();
        _ctx.fillStyle   = "rgba(0,0,0,0.60)";
        _ctx.strokeStyle = "rgba(255,255,255,0.15)";
        _ctx.lineWidth   = 1;
        _arredondado(bX, bY, bW, bH, r);
        _ctx.fill();
        _ctx.stroke();

        // Preenchimento — cor muda com HP
        let corHP;
        if (pct > 0.50)      corHP = `hsl(${120 * pct}, 80%, 45%)`;   // verde→amarelo
        else if (pct > 0.25) corHP = "#e8a020";                         // laranja
        else                 corHP = "#cc2222";                          // vermelho crítico

        const fillW = Math.max(r * 2, (bW - 2) * pct);
        _ctx.fillStyle = corHP;
        _arredondado(bX + 1, bY + 1, fillW, bH - 2, r - 1);
        _ctx.fill();

        // Brilho superior (gloss)
        const gloss = _ctx.createLinearGradient(0, bY, 0, bY + bH / 2);
        gloss.addColorStop(0,   "rgba(255,255,255,0.25)");
        gloss.addColorStop(1,   "rgba(255,255,255,0.00)");
        _ctx.fillStyle = gloss;
        _arredondado(bX + 1, bY + 1, fillW, (bH - 2) / 2, r - 1);
        _ctx.fill();

        _ctx.restore();
    }

    /** Path de retângulo com bordas arredondadas */
    function _arredondado(x, y, w, h, r) {
        _ctx.beginPath();
        _ctx.moveTo(x + r,     y);
        _ctx.lineTo(x + w - r, y);
        _ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        _ctx.lineTo(x + w,     y + h - r);
        _ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        _ctx.lineTo(x + r,     y + h);
        _ctx.quadraticCurveTo(x,     y + h, x, y + h - r);
        _ctx.lineTo(x,         y + r);
        _ctx.quadraticCurveTo(x,     y,     x + r, y);
        _ctx.closePath();
    }

    // ════════════════════════════════════════════════════
    // DRAW — SANTA TERESINHA
    // ════════════════════════════════════════════════════
    function _desenharSanta(assets) {
        const cy   = _chaoY();
        const px   = _santaX();
        const ALTO = _canvas.height * CFG.SANTA_ALTURA_PCT;

        // Offset de avanço durante ataque
        const ataqueT  = _santa.atacando / CFG.SANTA_ATAQUE_DUR;
        const offX     = _santa.atacando > 0
            ? Math.sin(ataqueT * Math.PI) * (_canvas.width * 0.06)
            : 0;

        // Respiração suave quando idle
        const t     = Date.now();
        const respY = _santa.atacando > 0
            ? 0
            : Math.sin(t * 0.002) * 3;

        const frames = assets?.santa;
        const img    = frames?.[_santa.frame];

        if (img?.complete && img.naturalWidth > 0) {
            const lar = ALTO * (img.naturalWidth / img.naturalHeight);
            const dx  = Math.floor(px + offX - lar / 2);
            const dy  = Math.floor(cy - ALTO + respY);

            // Sombra elíptica no chão
            _ctx.save();
            _ctx.fillStyle = "rgba(0,0,0,0.28)";
            _ctx.beginPath();
            _ctx.ellipse(px + offX, cy + 5, lar * 0.38, 7, 0, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.restore();

            // Aura de ataque (brilho roxo enquanto ataca)
            if (_santa.atacando > 0) {
                _ctx.save();
                const auraAlpha = ataqueT * 0.5;
                const aura = _ctx.createRadialGradient(
                    px + offX, cy - ALTO * 0.5, 0,
                    px + offX, cy - ALTO * 0.5, lar * 0.9
                );
                aura.addColorStop(0,   `rgba(200,100,255,${auraAlpha})`);
                aura.addColorStop(1,   "rgba(200,100,255,0)");
                _ctx.fillStyle = aura;
                _ctx.fillRect(dx - 20, dy - 20, lar + 40, ALTO + 40);
                _ctx.restore();
            }

            // Sprite — sempre virada para direita (flip do sprite original)
            _ctx.save();
            _ctx.translate(px + offX, cy + respY);
            _ctx.scale(-1, 1);
            _ctx.drawImage(img, -lar / 2, -ALTO, lar, ALTO);
            _ctx.restore();

        } else {
            _desenharSantaFallback(px, cy, ALTO, offX, respY);
        }
    }

    function _desenharSantaFallback(px, cy, ALTO, offX, respY) {
        const r = ALTO * 0.13;
        const x = px + offX;
        const y = cy + respY;

        _ctx.save();
        _ctx.shadowBlur  = 18;
        _ctx.shadowColor = "rgba(200,150,255,0.8)";

        // Cabeça
        _ctx.fillStyle = "#e8c5ff";
        _ctx.beginPath();
        _ctx.arc(x, y - ALTO * 0.82, r, 0, Math.PI * 2);
        _ctx.fill();

        // Auréola
        _ctx.strokeStyle = "#ffd700";
        _ctx.lineWidth   = 2.5;
        _ctx.beginPath();
        _ctx.ellipse(x, y - ALTO * 0.82 - r * 1.05, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
        _ctx.stroke();

        // Corpo
        _ctx.fillStyle = "#6d28d9";
        _ctx.beginPath();
        _ctx.moveTo(x - r * 0.5,  y - ALTO * 0.66);
        _ctx.lineTo(x - r * 0.85, y);
        _ctx.lineTo(x + r * 0.85, y);
        _ctx.lineTo(x + r * 0.5,  y - ALTO * 0.66);
        _ctx.closePath();
        _ctx.fill();

        // Braço com rosa
        _ctx.strokeStyle = "#c4b5fd";
        _ctx.lineWidth   = 3;
        _ctx.beginPath();
        _ctx.moveTo(x + r * 0.35, y - ALTO * 0.58);
        _ctx.lineTo(x + r * 1.40, y - ALTO * 0.74);
        _ctx.stroke();

        _ctx.font         = `${r * 1.4}px serif`;
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";
        _ctx.fillText("🌹", x + r * 1.65, y - ALTO * 0.78);

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // DRAW — VINHETA (overlay escuro nas bordas)
    // Aumenta o foco no centro da tela
    // ════════════════════════════════════════════════════
    function _desenharVinheta() {
        const W = _canvas.width;
        const H = _canvas.height;

        const g = _ctx.createRadialGradient(
            W / 2, H / 2, H * 0.20,
            W / 2, H / 2, H * 0.85
        );
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.55)");

        _ctx.save();
        _ctx.fillStyle = g;
        _ctx.fillRect(0, 0, W, H);
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // TICK — atualiza estados internos (a cada frame)
    // ════════════════════════════════════════════════════
    function _tick() {
        _tickHit();
        _tickSanta();
        _tickHpBar();
    }

    // ════════════════════════════════════════════════════
    // RENDER PRINCIPAL
    //
    // Ordem de renderização (de trás para frente):
    //  1.  Fundo / cenário (com parallax)
    //  2.  Chão / piso1.png (fundo preto removido)
    //  3.  Vinheta (overlay escuro nas bordas)
    //  4.  Effects: flores do céu
    //  5.  Effects: projéteis
    //  6.  Effects: partículas de impacto
    //  7.  Effects: moedas caindo
    //  8.  Monstro (glow + tremor)
    //  9.  HP bar flutuante
    //  10. Santa Teresinha (sprite animado)
    //  11. Effects: textos de dano
    // ════════════════════════════════════════════════════
    function desenhar(assets, shakeX = 0, shakeY = 0) {
        if (!_canvas || !_ctx) return;

        _tick();

        _ctx.save();

        // Aplica shake da câmera
        if (shakeX !== 0 || shakeY !== 0) {
            _ctx.translate(shakeX, shakeY);
        }

        // 1-2. Fundo e chão
        _desenharFundo(assets, shakeX, shakeY);
        _desenharChao(assets);

        // 3. Vinheta
        _desenharVinheta();

        // 4-7. Efeitos (via Effects.js)
        try {
            Effects.desenhar();
        } catch(e) {
            // Effects pode não estar pronto no primeiro frame
        }

        // 8-9. Monstro + HP
        _desenharMonstro();
        _desenharHpBarMonstro();

        // 10. Santa
        _desenharSanta(assets);

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // INTEGRAÇÃO COM EventBus
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Hit ao clicar
            EventBus.on("damage:click", () => {
                ativarHit(1.0);
                ativarAtaqueSanta();
            });

            // Hit crítico — tremor mais intenso
            EventBus.on("damage:critico", () => {
                ativarHit(1.8);
                ativarAtaqueSanta();
            });

            // DPS passivo — hit leve sem tremor visual forte
            EventBus.on("damage:dps", () => {
                ativarHit(0.3);
            });

            // Novo inimigo
            EventBus.on("inimigo:configurado", (dados) => {
                setMonstro(dados);
            });

            // HP atualizado em tempo real
            EventBus.on("inimigo:hp", ({ pct }) => {
                _monstro.hpPct = pct;
                setHpAlvo(pct);
            });

            // Chefe entrou em campo
            EventBus.on("estagio:avancou", ({ chefe }) => {
                _monstro.chefe = !!chefe;
                if (chefe) ativarHit(2.0);
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
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

        _registrarEventos();
        _log.info("RendererBattle inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            hit     : { ..._hit },
            santa   : { frame: _santa.frame, atacando: _santa.atacando },
            hpBar   : { atual: _hpBar.pctAtual.toFixed(3), alvo: _hpBar.pctAlvo.toFixed(3) },
            monstro : { emoji: _monstro.emoji, hpPct: _monstro.hpPct, chefe: _monstro.chefe },
            chaoOk  : _chaoCache.processado,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        desenhar,
        stats,

        // Controles externos (usados por battle.js e input.js)
        ativarHit,
        ativarAtaqueSanta,
        setMonstro,
        setHpAlvo,
    });

})();
