// ═══════════════════════════════════════════════════════════
// BATTLE-RENDERER.JS — Todo sistema visual da batalha
// ═══════════════════════════════════════════════════════════
"use strict";

const BattleRenderer = (() => {

const assets = {
    cenario:       null,
    chao:          null,
    santa:         new Array(8).fill(null),
    santaIdle:     new Array(21).fill(null),
    monstroNormal: null,
    monstroHitado: null,
    flor:          null,
    // ── SAPO-GATO ──
    sagaFrames:    new Array(13).fill(null),
    sagaHit:       null,
    sagaHit2:      null,
};

function carregarAssets() {
    const base = CONFIG.ASSET_BASE;

    const c = new Image(); c.crossOrigin = 'anonymous';
    c.onload  = () => { assets.cenario = c; };
    c.onerror = () => console.warn('⚠️ Cenário não carregado');
    c.src = base + 'piso-de-batalha/cenario1.png';

    const f = new Image(); f.crossOrigin = 'anonymous';
    f.onload  = () => { assets.chao = f; };
    f.onerror = () => console.warn('⚠️ Chão não carregado');
    f.src = base + 'piso-de-batalha/piso1.png';

    for (let i = 1; i <= 8; i++) {
        const s = new Image(); s.crossOrigin = 'anonymous';
        const idx = i - 1;
        s.onload  = () => { assets.santa[idx] = s; };
        s.onerror = () => console.warn(`⚠️ Santa frame ${i} não carregada`);
        s.src = base + `animation_summon/str-conjurando${i}.png`;
    }

    // ── SANTA IDLE: 21 frames ──
    for (let i = 1; i <= 21; i++) {
        const si = new Image(); si.crossOrigin = 'anonymous';
        const idx = i - 1;
        si.onload  = () => { assets.santaIdle[idx] = si; };
        si.onerror = () => console.warn(`⚠️ Santa idle frame ${i} não carregada`);
        si.src = base + `trzn/santatereza${i}.png`;
    }

    const mn = new Image(); mn.crossOrigin = 'anonymous';
    mn.onload  = () => { assets.monstroNormal = mn; };
    mn.onerror = () => console.warn('⚠️ Monstro normal não carregado');
    mn.src = base + 'monstros/slime-de-gelo/slime-de-gelo.png';

    const mh = new Image(); mh.crossOrigin = 'anonymous';
    mh.onload  = () => { assets.monstroHitado = mh; };
    mh.onerror = () => console.warn('⚠️ Monstro hitado não carregado');
    mh.src = base + 'monstros/slime-de-gelo/slime-de-gelo-hitado.png';

    const fl = new Image(); fl.crossOrigin = 'anonymous';
    fl.onload  = () => { assets.flor = fl; };
    fl.onerror = () => console.warn('⚠️ Flor não carregada');
    fl.src = base + 'armas/flor-basica.png';

    // ── SAPO-GATO: 13 frames de animação ──
    for (let i = 1; i <= 13; i++) {
        const sg = new Image(); sg.crossOrigin = 'anonymous';
        const idx = i - 1;
        sg.onload  = () => { assets.sagaFrames[idx] = sg; };
        sg.onerror = () => console.warn(`⚠️ Sapo-gato frame ${i} não carregado`);
        sg.src = base + `monstros/sapo-gato/saga${i}.png`;
    }

    const sh = new Image(); sh.crossOrigin = 'anonymous';
    sh.onload  = () => { assets.sagaHit = sh; };
    sh.onerror = () => console.warn('⚠️ Sapo-gato hit não carregado');
    sh.src = base + 'monstros/sapo-gato/saga-hit.png';

    const sh2 = new Image(); sh2.crossOrigin = 'anonymous';
    sh2.onload  = () => { assets.sagaHit2 = sh2; };
    sh2.onerror = () => console.warn('⚠️ Sapo-gato hit2 não carregado');
    sh2.src = base + 'monstros/sapo-gato/saga-hit2.png';
}

// ════════════════════════════════════════
//  ALTERNÂNCIA DE MONSTROS
// ════════════════════════════════════════
let monstroAtivo = 'slime';

EventBus.on('inimigo:morto', () => {
    monstroAtivo = (monstroAtivo === 'slime') ? 'saga' : 'slime';
});

// ════════════════════════════════════════
//  HIT STATE — suporta dois monstros
// ════════════════════════════════════════
const hit = {
    tremendo:     0,
    flash:        0,
    sagaHitTipo:  0,
    sagaFlash:    0,
    sagaTremendo: 0,
};

EventBus.on('inimigo:dano', () => {
    if (monstroAtivo === 'slime') {
        hit.tremendo = 14;
        hit.flash    = 8;
    } else {
        hit.sagaHitTipo  = (hit.sagaHitTipo === 1) ? 2 : 1;
        hit.sagaFlash    = 10;
        hit.sagaTremendo = 14;
    }
});

// ════════════════════════════════════════
//  ANIMAÇÃO PING-PONG DO SAPO-GATO
// ════════════════════════════════════════
const sagaAnim = {
    frame:     0,
    direcao:   1,
    tempo:     0,
    TICK:      6,
    FRAME_MAX: 12,
};

function _atualizarSaga() {
    sagaAnim.tempo++;
    if (sagaAnim.tempo >= sagaAnim.TICK) {
        sagaAnim.tempo = 0;
        sagaAnim.frame += sagaAnim.direcao;
        if (sagaAnim.frame >= sagaAnim.FRAME_MAX) { sagaAnim.frame = sagaAnim.FRAME_MAX; sagaAnim.direcao = -1; }
        if (sagaAnim.frame <= 0)                  { sagaAnim.frame = 0;                  sagaAnim.direcao =  1; }
    }
}

// ════════════════════════════════════════
//  HELPERS DE POSIÇÃO
// ════════════════════════════════════════
function chaoY(canvas)    { return canvas.height * 0.74; }
function centroX(canvas)  { return canvas.width  * 0.50; }
function santaX(canvas)   { return centroX(canvas); }
function monstroX(canvas) { return centroX(canvas); }

// ════════════════════════════════════════
//  FUNDO (cenário)
// ════════════════════════════════════════
function _fundo(ctx, canvas) {
    const W = canvas.width, H = canvas.height, cy = chaoY(canvas);
    if (imgOk(assets.cenario)) {
        const i   = assets.cenario;
        const esc = Math.max(W / i.naturalWidth, H / i.naturalHeight);
        const dw  = i.naturalWidth  * esc;
        const dh  = i.naturalHeight * esc;
        ctx.drawImage(i, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
        _fundoFallback(ctx, W, H, cy);
    }
}

// ════════════════════════════════════════
//  CHÃO
// ════════════════════════════════════════
function _desenharChao(ctx, canvas) {
    const W = canvas.width, H = canvas.height, cy = chaoY(canvas);
    if (imgOk(assets.chao)) {
        ctx.drawImage(assets.chao, 0, cy, W, H - cy);
    } else {
        _chaoFallback(ctx, W, H, cy);
    }
}

function _fundoFallback(ctx, W, H, cy) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    '#030110');
    g.addColorStop(0.45, '#0a0728');
    g.addColorStop(1,    '#1c0f5e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const t = Date.now();
    for (let i = 0; i < 120; i++) {
        const sx = (i * 193 + 7)  % W;
        const sy = (i * 99  + 11) % (cy * 0.72);
        ctx.globalAlpha = (Math.abs(Math.sin(t * 0.0007 + i)) * 0.55 + 0.25) * 0.5;
        ctx.fillStyle   = i % 5 === 0 ? '#ffddaa' : '#fff';
        ctx.beginPath(); ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const lx = W * 0.76, ly = H * 0.14;
    const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, 62);
    gl.addColorStop(0,   'rgba(255,248,200,1)');
    gl.addColorStop(0.5, 'rgba(255,220,130,0.40)');
    gl.addColorStop(1,   'rgba(255,200,80,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(lx, ly, 62, 0, Math.PI * 2); ctx.fill();
}

function _chaoFallback(ctx, W, H, cy) {
    const g = ctx.createLinearGradient(0, cy, 0, H);
    g.addColorStop(0,   '#22095a');
    g.addColorStop(0.3, '#160636');
    g.addColorStop(1,   '#060318');
    ctx.fillStyle = g; ctx.fillRect(0, cy, W, H - cy);
}

// ════════════════════════════════════════
//  PERSONAGEM (Santa Teresinha)
// ════════════════════════════════════════
const pb = {
    frame:       0,
    direcao:     1,
    tempo:       0,
    conjurando:  false,
    TICK_NORMAL: 6,
    TICK_ULTIMO: 38,
    FRAME_MAX:   7,
    offX:        0,
};

// ── IDLE ping-pong (santatereza1–21) ──
const pbIdle = {
    frame:     0,
    direcao:   1,
    tempo:     0,
    TICK:      5,
    FRAME_MAX: 20,
};

EventBus.on('flores:conjurar', () => {
    if (!pb.conjurando) {
        pb.conjurando = true;
        pb.frame      = 0;
        pb.direcao    = 1;
        pb.tempo      = 0;
    }
});

function _atualizarIdleSanta() {
    pbIdle.tempo++;
    if (pbIdle.tempo >= pbIdle.TICK) {
        pbIdle.tempo = 0;
        pbIdle.frame += pbIdle.direcao;
        if (pbIdle.frame >= pbIdle.FRAME_MAX) { pbIdle.frame = pbIdle.FRAME_MAX; pbIdle.direcao = -1; }
        if (pbIdle.frame <= 0)                { pbIdle.frame = 0;                pbIdle.direcao =  1; }
    }
}

function _atualizarPB() {
    if (!pb.conjurando) {
        _atualizarIdleSanta();
        pb.frame = 0;
        pb.offX  = 0;
        return;
    }
    const duracao = pb.frame === pb.FRAME_MAX ? pb.TICK_ULTIMO : pb.TICK_NORMAL;
    pb.tempo++;
    if (pb.tempo >= duracao) {
        pb.tempo = 0;
        pb.frame += pb.direcao;
        if (pb.frame >= pb.FRAME_MAX) {
            pb.frame   = pb.FRAME_MAX;
            pb.direcao = -1;
            EventBus.emit('flores:resetar');
        }
        if (pb.frame <= 0 && pb.direcao === -1) {
            pb.frame      = 0;
            pb.conjurando = false;
            pb.direcao    = 1;
        }
    }
    pb.offX = pb.frame === pb.FRAME_MAX ? Math.sin(Date.now() * 0.018) * 3.5 : 0;
}

// ════════════════════════════════════════
//  EFEITOS IDLE — canvas offscreen para bloom
// ════════════════════════════════════════
let _bloomCanvas = null;
let _bloomCtx    = null;

function _garantirBloom(w, h) {
    // Bloom usa 1/4 da resolução — barato e já cria o blur por escalonamento
    const bw = Math.ceil(w / 4);
    const bh = Math.ceil(h / 4);
    if (!_bloomCanvas || _bloomCanvas.width !== bw || _bloomCanvas.height !== bh) {
        _bloomCanvas = document.createElement('canvas');
        _bloomCanvas.width  = bw;
        _bloomCanvas.height = bh;
        _bloomCtx = _bloomCanvas.getContext('2d');
    }
}

// ── Halo radial atrás da santa (luz sagrada dourada-rosada) ──
function _desenharHalo(ctx, cx, cy, raio, t) {
    const pulse = 0.85 + Math.sin(t * 0.0013) * 0.09 + Math.sin(t * 0.0031) * 0.05;
    const r     = raio * pulse;

    // Halo externo
    const g1 = ctx.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
    g1.addColorStop(0.00, 'rgba(255, 235, 170, 0.28)');
    g1.addColorStop(0.35, 'rgba(255, 185, 215, 0.18)');
    g1.addColorStop(0.65, 'rgba(210, 140, 255, 0.09)');
    g1.addColorStop(1.00, 'rgba(130,  90, 255, 0.00)');
    ctx.save();
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Núcleo interno brilhante
    const r2 = r * 0.32;
    const g2  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r2);
    g2.addColorStop(0.00, 'rgba(255, 255, 255, 0.18)');
    g2.addColorStop(0.50, 'rgba(255, 230, 160, 0.10)');
    g2.addColorStop(1.00, 'rgba(255, 210, 100, 0.00)');
    ctx.save();
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ── God rays: raios de luz girando lentamente ──
function _desenharGodRays(ctx, cx, cy, raio, t) {
    const numRaios = 8;
    const rotBase  = t * 0.00015;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < numRaios; i++) {
        const ang    = rotBase + (i / numRaios) * Math.PI * 2;
        const fase   = i * 1.37;
        const alpha  = (0.038 + Math.sin(t * 0.0009 + fase) * 0.022)
                     * (0.6   + Math.sin(t * 0.0023 + fase * 2) * 0.4);
        const comp   = raio * (0.52 + Math.sin(t * 0.0011 + fase * 0.7) * 0.10);
        const larg   = raio * (0.055 + Math.sin(t * 0.0015 + fase) * 0.018);

        const cosA = Math.cos(ang), sinA = Math.sin(ang);
        const grd  = ctx.createLinearGradient(0, 0, cosA * comp, sinA * comp);
        grd.addColorStop(0.00, `rgba(255,245,195,${alpha})`);
        grd.addColorStop(0.55, `rgba(255,215,155,${alpha * 0.45})`);
        grd.addColorStop(1.00, 'rgba(255,200,110,0)');

        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(-larg * 0.5, 0);
        ctx.lineTo(0, comp);
        ctx.lineTo(larg * 0.5, 0);
        ctx.closePath();
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

// ── Bloom suave: sprite em canvas pequeno, escalado de volta (blur natural) ──
function _desenharBloom(ctx, img, dx, dy, dw, dh, t) {
    if (!imgOk(img)) return;
    _garantirBloom(dw, dh);

    const bw = _bloomCanvas.width;
    const bh = _bloomCanvas.height;

    // Render do sprite na resolução pequena
    _bloomCtx.clearRect(0, 0, bw, bh);
    _bloomCtx.drawImage(img, 0, 0, bw, bh);

    // Intensidade pulsa suavemente
    const alpha = 0.11 + Math.sin(t * 0.0017) * 0.045 + Math.sin(t * 0.0041) * 0.025;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 3 passes com expansão crescente = profundidade de bloom
    ctx.globalAlpha = alpha * 0.5;
    ctx.drawImage(_bloomCanvas, dx - dw * 0.045, dy - dh * 0.045, dw * 1.09, dh * 1.09);

    ctx.globalAlpha = alpha * 0.7;
    ctx.drawImage(_bloomCanvas, dx - dw * 0.022, dy - dh * 0.022, dw * 1.044, dh * 1.044);

    ctx.globalAlpha = alpha;
    ctx.drawImage(_bloomCanvas, dx, dy, dw, dh);

    ctx.restore();
}

// ── Rim light lateral (contorno de luz sagrada) ──
function _aplicarRimLight(ctx, dx, dy, dw, dh, t) {
    const inten = 0.065 + Math.sin(t * 0.0019) * 0.025;
    const g = ctx.createLinearGradient(dx, dy, dx + dw, dy);
    g.addColorStop(0.00, `rgba(255,215,140,${inten * 1.5})`);
    g.addColorStop(0.15, `rgba(255,225,175,${inten})`);
    g.addColorStop(0.50, 'rgba(255,235,200,0)');
    g.addColorStop(0.85, `rgba(210,165,255,${inten * 0.65})`);
    g.addColorStop(1.00, `rgba(185,125,255,${inten * 1.2})`);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
}

// ── Sombra no chão (shadow blob) ──
function _desenharSombra(ctx, cx, cy, largura, t) {
    const pulse = 0.92 + Math.sin(t * 0.0013) * 0.07;
    const w     = largura * 0.52 * pulse;
    const h     = w * 0.20;

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w);
    g.addColorStop(0.00, 'rgba(0, 0, 0, 0.25)');
    g.addColorStop(0.55, 'rgba(0, 0, 0, 0.09)');
    g.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)');

    ctx.save();
    ctx.scale(1, h / w);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy * (w / h), w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// ── Partículas da cruz (florinhas sutis) ──
function _emitirParticulasCruz(px, py, ALT, t) {
    const fase = Math.sin(t * 0.0014);
    const taxa = 0.09 + fase * 0.06;
    if (Math.random() >= taxa) return;

    const cruzX = px + (Math.random() - 0.5) * 22;
    const cruzY = py - ALT * 0.62 + (Math.random() - 0.5) * 14;

    const useEmoji = Math.random() < 0.10;
    const cores    = [
        'rgba(255,200,220,0.95)',
        'rgba(255,165,205,0.90)',
        'rgba(255,242,180,0.88)',
        'rgba(225,165,255,0.85)',
        'rgba(255,255,255,0.92)',
    ];

    particulas.push({
        x:       cruzX,
        y:       cruzY,
        vx:      (Math.random() - 0.5) * 0.65,
        vy:      -(0.28 + Math.random() * 0.85),
        vida:    45 + Math.random() * 30,
        vidaMax: 75,
        size:    useEmoji ? 8 : 1.6 + Math.random() * 2.6,
        cor:     cores[Math.floor(Math.random() * cores.length)],
        emoji:   useEmoji ? '🌸' : null,
        magica:  true,
        fase:    Math.random() * Math.PI * 2,
    });
}

// ════════════════════════════════════════
//  RENDER DO IDLE (todos os efeitos juntos)
// ════════════════════════════════════════
function _desenharPBIdle(ctx, canvas) {
    const px  = santaX(canvas);
    const py  = chaoY(canvas) + 10;
    const ALT = canvas.height * 0.30;
    const t   = Date.now();

    const idleImg   = assets.santaIdle[pbIdle.frame];
    const imgOkIdle = imgOk(idleImg);

    const LAR = imgOkIdle
        ? ALT * (idleImg.naturalWidth / idleImg.naturalHeight)
        : ALT * 0.55;

    const cx = px;
    const cy = py - ALT * 0.50; // centro aproximado do sprite

    // 1. Sombra no chão
    _desenharSombra(ctx, cx, py + 2, LAR, t);

    // 2. God rays atrás
    _desenharGodRays(ctx, cx, cy, ALT * 0.70, t);

    // 3. Halo radial
    _desenharHalo(ctx, cx, cy, ALT * 0.62, t);

    // 4. Bloom (camada atrás do sprite)
    if (imgOkIdle) {
        _desenharBloom(ctx, idleImg, cx - LAR / 2, py - ALT, LAR, ALT, t);
    }

    // 5. Sprite com breathing (escala suave)
    if (imgOkIdle) {
        const breathe = 1.0
            + Math.sin(t * 0.0013) * 0.006
            + Math.sin(t * 0.0031) * 0.002;

        ctx.save();
        ctx.translate(cx, py);
        ctx.scale(-breathe, breathe);
        ctx.drawImage(idleImg, -LAR / 2, -ALT, LAR, ALT);
        ctx.restore();

        // 6. Rim light sobre o sprite
        _aplicarRimLight(ctx, cx - LAR / 2, py - ALT, LAR, ALT, t);
    } else {
        _santaFallback(ctx, px, py, ALT, 0);
    }

    // 7. Partículas da cruz
    _emitirParticulasCruz(px, py, ALT, t);
}

// ════════════════════════════════════════
//  _desenharPB — despacha idle ou conjurando
// ════════════════════════════════════════
function _desenharPB(ctx, canvas) {
    if (!pb.conjurando) {
        _desenharPBIdle(ctx, canvas);
        return;
    }

    // ── CONJURANDO (comportamento original inalterado) ──
    const px  = santaX(canvas);
    const py  = chaoY(canvas) + 10;
    const ALT = canvas.height * 0.30;
    const offX = pb.offX;
    const img  = assets.santa[pb.frame];

    if (imgOk(img)) {
        const lar = ALT * (img.naturalWidth / img.naturalHeight);
        if (Math.random() < 0.35) {
            const t2 = pb.frame / pb.FRAME_MAX;
            _criarParticulaMagica(
                px + offX + (Math.random() - 0.5) * lar * 0.6,
                py - ALT * (0.2 + Math.random() * 0.7),
                t2
            );
        }
        ctx.save();
        ctx.translate(px + offX, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -lar / 2, -ALT, lar, ALT);
        ctx.restore();
    } else {
        _santaFallback(ctx, px, py, ALT, offX);
    }
}

function _santaFallback(ctx, px, py, ALT, offX) {
    const r = ALT * 0.13;
    ctx.save();
    ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(200,150,255,0.8)';
    ctx.fillStyle = '#e8c5ff';
    ctx.beginPath(); ctx.arc(px + offX, py - ALT * 0.82, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(px + offX, py - ALT * 0.82 - r * 1.05, r * 1.15, r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.moveTo(px + offX - r * 0.5, py - ALT * 0.66);
    ctx.lineTo(px + offX - r * 0.85, py);
    ctx.lineTo(px + offX + r * 0.85, py);
    ctx.lineTo(px + offX + r * 0.5, py - ALT * 0.66);
    ctx.closePath(); ctx.fill();
    ctx.restore();
}

// ════════════════════════════════════════
//  MONSTRO — SLIME DE GELO
// ════════════════════════════════════════
function _desenharSlime(ctx, canvas) {
    if (hit.flash > 0)    hit.flash--;
    if (hit.tremendo > 0) hit.tremendo--;

    const ini = BattleState.inimigo;
    const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);
    const tam = canvas.height * (0.88 + pct * 0.05);

    const ox = hit.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
    const oy = hit.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;

    const mx = monstroX(canvas) + ox;
    const my = chaoY(canvas) - tam * 0.20 + oy;

    const imgMonstro = (hit.flash > 0 && imgOk(assets.monstroHitado))
        ? assets.monstroHitado
        : assets.monstroNormal;

    ctx.save();
    ctx.shadowBlur  = 42 + Math.sin(Date.now() * 0.004) * 14;
    ctx.shadowColor = pct < 0.25 ? 'rgba(255,220,0,1)' : 'rgba(255,50,50,0.9)';

    if (imgOk(imgMonstro)) {
        const lar = tam * (imgMonstro.naturalWidth / imgMonstro.naturalHeight);
        ctx.drawImage(imgMonstro, mx - lar / 2, my - tam / 2, lar, tam);
    } else {
        const tipo = tiposMonstros[ini.tipo] ?? tiposMonstros[0];
        ctx.font = `${tam}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tipo.emojis.normal, mx, my);
    }
    ctx.restore();
}

// ════════════════════════════════════════
//  MONSTRO — SAPO-GATO (animado ping-pong)
// ════════════════════════════════════════
function _desenharSaga(ctx, canvas) {
    if (hit.sagaFlash    > 0) hit.sagaFlash--;
    if (hit.sagaTremendo > 0) hit.sagaTremendo--;

    _atualizarSaga();

    const ini = BattleState.inimigo;
    const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);
    const tam = canvas.height * (0.66 + pct * 0.05);

    const ox = hit.sagaTremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
    const oy = hit.sagaTremendo > 0 ? (Math.random() - 0.5) * 10 : 0;

    const mx = monstroX(canvas) + ox;
    const my = chaoY(canvas) - tam * 0.35 + oy;

    let imgSaga = null;
    if (hit.sagaFlash > 0) {
        if (hit.sagaHitTipo === 2 && imgOk(assets.sagaHit2)) imgSaga = assets.sagaHit2;
        else if (imgOk(assets.sagaHit))                      imgSaga = assets.sagaHit;
    }
    if (!imgSaga) imgSaga = assets.sagaFrames[sagaAnim.frame];

    ctx.save();
    ctx.shadowBlur  = 42 + Math.sin(Date.now() * 0.004) * 14;
    ctx.shadowColor = pct < 0.25 ? 'rgba(255,220,0,1)' : 'rgba(100,200,100,0.9)';

    if (imgOk(imgSaga)) {
        const lar = tam * (imgSaga.naturalWidth / imgSaga.naturalHeight);
        ctx.drawImage(imgSaga, mx - lar / 2, my - tam / 2, lar, tam);
    } else {
        ctx.font = `${tam * 0.5}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐸', mx, my);
    }
    ctx.restore();
}

// ════════════════════════════════════════
//  DISPATCHER — desenha o monstro ativo
// ════════════════════════════════════════
function _desenharMonstro(ctx, canvas) {
    if (monstroAtivo === 'saga') _desenharSaga(ctx, canvas);
    else                         _desenharSlime(ctx, canvas);
}

// ════════════════════════════════════════
//  FLORES — Sistema completo
// ════════════════════════════════════════
const FLORES_MAX     = 30;
const FLORES_REABAST = 5;
const FLOR_TAM_MIN   = 28;
const FLOR_TAM_MAX   = 42;

let _posFixas = [];
let flores    = [];
let floresAtt = [];

function _gerarPosFixas(canvas) {
    const W  = canvas.width;
    const H  = canvas.height;
    const cy = chaoY(canvas);
    const mx = monstroX(canvas);
    const my = cy - canvas.height * 0.30;

    const BOSS_R   = 200;
    const TETO_Y   = H * 0.04;
    const CHAO_Y   = cy * 0.80;
    const MIN_DIST = 52;

    const posicoes = [];
    let tentativas = 0;

    while (posicoes.length < FLORES_MAX && tentativas < 3000) {
        tentativas++;
        const x    = FLOR_TAM_MAX + Math.random() * (W - FLOR_TAM_MAX * 2);
        const y    = TETO_Y + Math.random() * (CHAO_Y - TETO_Y);
        const size = FLOR_TAM_MIN + Math.random() * (FLOR_TAM_MAX - FLOR_TAM_MIN);

        if (Math.hypot(x - mx, y - my) < BOSS_R) continue;

        const sobrep = posicoes.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST);
        if (sobrep) continue;

        posicoes.push({ x, y, size, glowFase: Math.random() * Math.PI * 2 });
    }

    return posicoes;
}

function initFlores(canvas) {
    _posFixas = _gerarPosFixas(canvas);
    flores    = _posFixas.map((p, i) => _criarFlor(p, i, true));
    floresAtt = [];
}

function _criarFlor(pos, idx, spawnImediato = false) {
    return {
        idx,
        x:          pos.x,
        y:          pos.y,
        size:       pos.size,
        glowFase:   pos.glowFase,
        alpha:      spawnImediato ? 1 : 0,
        glow:       spawnImediato ? 1 : 0,
        conjurando: !spawnImediato,
        conjFrames: 0,
        conjDur:    45,
        viva:       true,
    };
}

function _checarReabastecimento() {
    const vivas = flores.filter(f => f.viva).length;
    if (vivas <= FLORES_REABAST) EventBus.emit('flores:conjurar');
}

EventBus.on('flores:resetar', () => {
    _posFixas.forEach((pos, idx) => {
        const jaExiste = flores.some(f => f.idx === idx && f.viva);
        if (!jaExiste) flores.push(_criarFlor(pos, idx, false));
    });
});

function _atualizarFlores() {
    flores.forEach(f => {
        if (!f.conjurando) return;
        f.conjFrames++;
        const t = f.conjFrames / f.conjDur;
        f.alpha = Math.min(1, t * 1.4);
        f.glow  = Math.sin(t * Math.PI);
        if (f.conjFrames >= f.conjDur) { f.conjurando = false; f.alpha = 1; f.glow = 1; }
    });
    flores = flores.filter(f => f.viva);
}

function _desenharFlores(ctx, canvas) {
    if (!imgOk(assets.flor)) return;
    const t = Date.now();

    flores.forEach(f => {
        if (!f.viva) return;
        const glowPulse = 0.6 + Math.sin(t * 0.002 + f.glowFase) * 0.4;
        const glowRaio  = f.size * 0.7 * glowPulse;

        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.translate(f.x, f.y);

        if (f.glow > 0) {
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRaio);
            grd.addColorStop(0,   `rgba(255,60,60,${0.55 * f.glow * glowPulse})`);
            grd.addColorStop(0.5, `rgba(255,20,20,${0.25 * f.glow})`);
            grd.addColorStop(1,   'rgba(255,0,0,0)');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(0, 0, glowRaio, 0, Math.PI * 2); ctx.fill();
        }

        ctx.drawImage(assets.flor, -f.size / 2, -f.size / 2, f.size, f.size);
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  FLORES PROJÉTEIS
// ════════════════════════════════════════
function dispararFlor(canvas) {
    const mx = monstroX(canvas);
    const my = chaoY(canvas) - canvas.height * 0.30;

    let melhor = null, melhorDist = Infinity;
    flores.forEach(f => {
        if (!f.viva || f.conjurando) return;
        const d = Math.hypot(f.x - mx, f.y - my);
        if (d < melhorDist) { melhorDist = d; melhor = f; }
    });

    if (!melhor) return;

    const angulo = Math.atan2(my - melhor.y, mx - melhor.x);
    const tx = mx + (Math.random() - 0.5) * 70;
    const ty = my + (Math.random() - 0.5) * 70;
    const sp = 10 + Math.random() * 5;

    floresAtt.push({
        x: melhor.x, y: melhor.y,
        vx: Math.cos(angulo) * sp,
        vy: Math.sin(angulo) * sp,
        tx, ty,
        size:    melhor.size,
        angulo,
        vida:    Math.ceil(melhorDist / sp) + 10,
        acertou: false,
    });

    melhor.viva = false;
    _checarReabastecimento();
}

function _atualizarFloresAtt() {
    floresAtt.forEach(f => {
        f.x += f.vx; f.y += f.vy; f.vida--;
        if (!f.acertou && Math.hypot(f.x - f.tx, f.y - f.ty) < 30) {
            f.acertou = true; f.vida = 0;
            for (let p = 0; p < 10; p++) _criarParticula(f.x, f.y);
        }
    });
    floresAtt = floresAtt.filter(f => f.vida > 0);
}

function _desenharFloresAtt(ctx) {
    if (!imgOk(assets.flor)) return;
    floresAtt.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.vida / 12);
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angulo + Math.PI / 2);
        ctx.drawImage(assets.flor, -f.size / 2, -f.size / 2, f.size, f.size);
        ctx.restore();
    });
}

// ════════════════════════════════════════
//  PARTÍCULAS
// ════════════════════════════════════════
let particulas = [];

function _criarParticula(x, y) {
    const ang      = Math.random() * Math.PI * 2;
    const spd      = 1.5 + Math.random() * 4;
    const emojis   = ['✨', '🌹', '💫', '⭐'];
    const useEmoji = Math.random() < 0.4;
    particulas.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        vida: 25 + Math.random() * 15,
        size: useEmoji ? 12 + Math.random() * 6 : 4 + Math.random() * 7,
        cor:  `hsl(${320 + Math.random() * 60},95%,68%)`,
        emoji: useEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        magica: false,
    });
}

function _criarParticulaMagica(x, y, intensidade) {
    const cores = [
        `hsl(${270 + Math.random() * 60},100%,75%)`,
        `hsl(${180 + Math.random() * 40},100%,80%)`,
        '#ffffff',
    ];
    particulas.push({
        x, y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(0.8 + Math.random() * 1.8 + intensidade * 1.5),
        vida: 18 + Math.random() * 18,
        size: 2 + Math.random() * 4 * intensidade,
        cor:  cores[Math.floor(Math.random() * cores.length)],
        emoji: null,
        magica: true,
    });
}

EventBus.on('inimigo:morto', (d) => {
    for (let i = 0; i < 20; i++) _criarParticula(d.x ?? 0, d.y ?? 0);
});

// ════════════════════════════════════════
//  MOEDAS CAINDO
// ════════════════════════════════════════
let moedas = [];

function criarMoeda(canvas) {
    const mx = monstroX(canvas);
    const my = chaoY(canvas) - canvas.height * 0.30;
    moedas.push({
        x:  mx + (Math.random() - 0.5) * 110,
        y:  my,
        vy: -(3.5 + Math.random() * 2.8),
        vx: (Math.random() - 0.5) * 2.8,
        vida: 70, size: 20 + Math.random() * 11,
    });
}

// ════════════════════════════════════════
//  TEXTOS FLUTUANTES
// ════════════════════════════════════════
let textos = [];

function criarTexto(valor, tipo, canvas) {
    const mx = monstroX(canvas);
    const my = chaoY(canvas) - canvas.height * 0.45;
    textos.push({
        x: mx + (Math.random() - 0.5) * 100,
        y: my,
        valor, tipo, vida: 80, max: 80,
    });
}

// ════════════════════════════════════════
//  RENDER COMPLETO
// ════════════════════════════════════════
function render(ctx, canvas) {

    // 1. Cenário de fundo
    _fundo(ctx, canvas);

    // 2. Flores decorativas
    _atualizarFlores();
    _desenharFlores(ctx, canvas);

    // 3. Flores projéteis
    _atualizarFloresAtt();
    _desenharFloresAtt(ctx);

    // 4. Monstro — atrás do chão
    _desenharMonstro(ctx, canvas);

    // 5. Chão — na frente do monstro
    _desenharChao(ctx, canvas);

    // 6. Partículas
    particulas.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.magica ? 0.03 : 0.14;
        p.vida--;
    });
    particulas = particulas.filter(p => p.vida > 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    particulas.forEach(p => {
        ctx.save();
        // Fade quadrático = mais elegante que linear
        const ratio = p.vidaMax ? p.vida / p.vidaMax : Math.min(1, p.vida / 12);
        ctx.globalAlpha = ratio * ratio;
        if (p.emoji) {
            ctx.font = `${p.size}px serif`;
            ctx.fillText(p.emoji, p.x, p.y);
        } else {
            ctx.fillStyle = p.cor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // 7. Moedas
    moedas.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.22; m.vida--; });
    moedas = moedas.filter(m => m.vida > 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    moedas.forEach(m => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, m.vida / 20);
        ctx.font = `${m.size}px serif`;
        ctx.fillText('🪙', m.x, m.y);
        ctx.restore();
    });

    // 8. Santa — na frente de tudo
    _atualizarPB();
    _desenharPB(ctx, canvas);

    // 9. Textos flutuantes
    ctx.textAlign = 'center';
    textos.forEach(t => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.vida / 22);
        const [cor, tam] = t.tipo === 'levelup' ? ['#ffd700', 26]
                         : t.tipo === 'dps'     ? ['#aaffaa', 13]
                         : t.tipo === 'critico' ? ['#ff4400', 26]
                         : ['#ff9de2', 22];
        ctx.font = `bold ${tam}px 'Nunito', sans-serif`;
        ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 4;
        ctx.strokeText(t.valor, t.x, t.y);
        ctx.fillStyle = cor;
        ctx.fillText(t.valor, t.x, t.y);
        ctx.restore();
        t.y -= 1.9;
        t.vida--;
    });
    textos = textos.filter(t => t.vida > 0);
}

return {
    init(canvas) {
        carregarAssets();
        initFlores(canvas);
    },
    onResize(canvas) {
        initFlores(canvas);
        _bloomCanvas = null; // força recriação no novo tamanho
    },
    render,
    dispararFlor,
    criarMoeda,
    criarTexto,
    criarParticula: _criarParticula,
};
})();
