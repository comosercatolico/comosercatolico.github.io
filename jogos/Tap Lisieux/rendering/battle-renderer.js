// ═══════════════════════════════════════════════════════════
//  BATTLE-RENDERER.JS — Todo sistema visual da batalha
// ═══════════════════════════════════════════════════════════
"use strict";

const BattleRenderer = (() => {

    // ════════════════════════════════════════
    //  ASSETS DE BATALHA
    // ════════════════════════════════════════
    const assets = {
        cenario: null,
        chao:    null,
        santa:   new Array(8).fill(null),
    };

    let _chaoCanvas = null, _chaoCtx = null, _chaoOk = false;

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
    }

    function processarChao() {
        if (_chaoOk || !imgOk(assets.chao)) return;
        const src = assets.chao;
        _chaoCanvas = document.createElement('canvas');
        _chaoCanvas.width  = src.naturalWidth;
        _chaoCanvas.height = src.naturalHeight;
        _chaoCtx = _chaoCanvas.getContext('2d');
        _chaoCtx.drawImage(src, 0, 0);

        const id   = _chaoCtx.getImageData(0, 0, _chaoCanvas.width, _chaoCanvas.height);
        const data = id.data;
        for (let i = 0; i < data.length; i += 4) {
            const brilho = (data[i] + data[i+1] + data[i+2]) / 3;
            if      (brilho < 28)  data[i+3] = 0;
            else if (brilho < 60)  data[i+3] = Math.floor(((brilho - 28) / 32) * 255);
        }
        _chaoCtx.putImageData(id, 0, 0);
        _chaoOk = true;
    }

    // ════════════════════════════════════════
    //  HIT STATE
    // ════════════════════════════════════════
    const hit = { tremendo: 0, flash: 0 };

    EventBus.on('inimigo:dano', () => { hit.tremendo = 14; hit.flash = 8; });

    // ════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════
    function chaoY(canvas) { return canvas.height * 0.78; }
    function santaX(canvas){ return canvas.width  * 0.46; }
    function monstroX(canvas){ return canvas.width  * 0.50; }
    function monstroY(canvas){ return canvas.height * 0.38; }

    // ════════════════════════════════════════
    //  FUNDO
    // ════════════════════════════════════════
    function _fundo(ctx, canvas) {
        const W = canvas.width, H = canvas.height, cy = chaoY(canvas);

        if (imgOk(assets.cenario)) {
            const i   = assets.cenario;
            const esc = Math.max(W / i.naturalWidth, H / i.naturalHeight);
            const dw  = i.naturalWidth * esc, dh = i.naturalHeight * esc;
            ctx.drawImage(i, (W - dw) / 2, (H - dh) / 2, dw, dh);
        } else {
            _fundoFallback(ctx, W, H, cy);
        }

        if (imgOk(assets.chao)) {
            processarChao();
            const src  = _chaoOk ? _chaoCanvas : assets.chao;
            const pw   = W;
            const ph   = assets.chao.naturalHeight * (W / assets.chao.naturalWidth);
            const py   = cy - ph * 0.30;
            ctx.drawImage(src, 0, py, pw, ph);
        } else {
            _chaoFallback(ctx, W, H, cy);
        }

        // Sombra de transição
        const gs = ctx.createLinearGradient(0, cy - 18, 0, cy + 32);
        gs.addColorStop(0, 'rgba(0,0,0,0)');
        gs.addColorStop(1, 'rgba(0,0,0,0.32)');
        ctx.fillStyle = gs;
        ctx.fillRect(0, cy - 18, W, 50);
    }

    function _fundoFallback(ctx, W, H, cy) {
        const g = ctx.createLinearGradient(0, 0, 0, cy);
        g.addColorStop(0,    '#030110');
        g.addColorStop(0.45, '#0a0728');
        g.addColorStop(1,    '#1c0f5e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, cy);

        const t = Date.now();
        for (let i = 0; i < 120; i++) {
            const sx = (i * 193 + 7)  % W;
            const sy = (i * 99  + 11) % (cy * 0.72);
            ctx.globalAlpha = (Math.abs(Math.sin(t * 0.0007 + i)) * 0.55 + 0.25) * 0.5;
            ctx.fillStyle   = i % 5 === 0 ? '#ffddaa' : '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Lua
        const lx = W * 0.76, ly = H * 0.14;
        const gl = ctx.createRadialGradient(lx, ly, 0, lx, ly, 62);
        gl.addColorStop(0,   'rgba(255,248,200,1)');
        gl.addColorStop(0.5, 'rgba(255,220,130,0.40)');
        gl.addColorStop(1,   'rgba(255,200,80,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(lx, ly, 62, 0, Math.PI * 2); ctx.fill();
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
    const pb = { atacando: 0, durAtaque: 28, frame: 0, tempo: 0 };

    EventBus.on('inimigo:dano', (d) => {
        // Só no dano por clique (click dispara darDano)
        pb.atacando = pb.durAtaque;
    });

    function _atualizarPB() {
        pb.tempo++;
        if (pb.tempo >= 5) { pb.tempo = 0; pb.frame = (pb.frame + 1) % 8; }
        if (pb.atacando > 0) pb.atacando--;
    }

    function _desenharPB(ctx, canvas) {
        const px  = santaX(canvas);
        const py  = chaoY(canvas);
        const ALT = canvas.height * 0.20;
        const offX = pb.atacando > 0 ? Math.sin((pb.atacando / pb.durAtaque) * Math.PI) * 14 : 0;
        const img  = assets.santa[pb.frame];

        if (imgOk(img)) {
            const lar = ALT * (img.naturalWidth / img.naturalHeight);

            // Sombra
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath();
            ctx.ellipse(px + offX, py + 5, lar * 0.38, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Sprite espelhado
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
        ctx.font = `${r * 1.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🌹', px + offX + r * 1.7, py - ALT * 0.75);
        ctx.restore();
    }

    // ════════════════════════════════════════
    //  MONSTRO
    // ════════════════════════════════════════
    function _emojiMonstro() {
        const ini = BattleState.inimigo;
        const tipo = tiposMonstros[ini.tipo] ?? tiposMonstros[0];
        const pct  = ini.maxHp > 0 ? ini.hp / ini.maxHp : 1;
        if (hit.flash > 0)  return tipo.emojis.dor;
        if (pct < 0.20)     return tipo.emojis.medo;
        if (pct < 0.50)     return tipo.emojis.raiva;
        return tipo.emojis.normal;
    }

    function _desenharMonstro(ctx, canvas) {
        if (hit.flash > 0)    hit.flash--;
        if (hit.tremendo > 0) hit.tremendo--;

        const ini = BattleState.inimigo;
        const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);
        const tam = canvas.height * (0.36 + pct * 0.06);
        const ox  = hit.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
        const oy  = hit.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;
        const mx  = monstroX(canvas) + ox;
        const my  = monstroY(canvas) + oy;

        ctx.save();
        if (hit.flash > 0) {
            ctx.filter = 'sepia(1) saturate(18) hue-rotate(300deg)';
            ctx.globalAlpha = 0.88;
        }
        ctx.shadowBlur  = 38 + Math.sin(Date.now() * 0.004) * 14;
        ctx.shadowColor = pct < 0.25 ? 'rgba(255,220,0,1)' : 'rgba(255,50,50,0.9)';
        ctx.font = `${tam}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(_emojiMonstro(), mx, my);
        ctx.restore();

        // Sombra chão
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(monstroX(canvas), chaoY(canvas) + 6, tam * 0.28, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ════════════════════════════════════════
    //  ROSAS DO CÉU
    // ════════════════════════════════════════
    let flores = [], floresAtt = [];

    function _criarFlor(rand = false) {
        return {
            baseX: 0, baseY: 0, x: 0, y: 0,
            size: 18 + Math.random() * 14,
            fase: Math.random() * Math.PI * 2, fasev: Math.random() * Math.PI * 2,
            ampH: 5 + Math.random() * 8, ampV: 2 + Math.random() * 3,
            spd:  0.0007 + Math.random() * 0.0006,
            alpha:0.58 + Math.random() * 0.38,
            emoji: Math.random() < 0.75 ? '🌹' : '✨',
        };
    }

    function initFlores(canvas) {
        flores = Array.from({ length: CONFIG.QTD_FLORES_CEU }, (_, i) => {
            const f = _criarFlor(true);
            f.baseX = canvas.width  * (0.04 + Math.random() * 0.88);
            f.baseY = canvas.height * (0.03 + Math.random() * 0.52);
            f.x = f.baseX; f.y = f.baseY;
            return f;
        });
        floresAtt = [];
    }

    function _atualizarFlores(canvas) {
        const t = Date.now();
        flores.forEach(f => {
            // Atualiza posição base no resize
            if (f.baseX > canvas.width || f.baseY > canvas.height) {
                f.baseX = canvas.width  * (0.04 + Math.random() * 0.88);
                f.baseY = canvas.height * (0.03 + Math.random() * 0.52);
            }
            f.x = f.baseX + Math.sin(t * f.spd + f.fase)         * f.ampH;
            f.y = f.baseY + Math.sin(t * f.spd * 0.65 + f.fasev) * f.ampV;
        });
    }

    function dispararFlor(canvas) {
        if (!flores.length) return;
        let idx = 0, dist = Infinity;
        const mx = monstroX(canvas), my = monstroY(canvas);
        flores.forEach((f, i) => {
            const d = Math.hypot(f.x - mx, f.y - my);
            if (d < dist) { dist = d; idx = i; }
        });
        const fo = flores[idx];
        const tx = mx + (Math.random() - 0.5) * 70;
        const ty = my + (Math.random() - 0.5) * 70;
        const d  = Math.hypot(tx - fo.x, ty - fo.y);
        const sp = 10 + Math.random() * 5;
        const ag = Math.atan2(ty - fo.y, tx - fo.x);

        floresAtt.push({
            x: fo.x, y: fo.y,
            vx: Math.cos(ag) * sp, vy: Math.sin(ag) * sp,
            tx, ty, size: fo.size, vida: Math.ceil(d / sp) + 10, acertou: false
        });

        // Substitui rosa disparada
        const nf = _criarFlor(true);
        nf.baseX = canvas.width  * (0.04 + Math.random() * 0.88);
        nf.baseY = canvas.height * (0.03 + Math.random() * 0.52);
        nf.x = nf.baseX; nf.y = nf.baseY;
        flores[idx] = nf;
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

    // ════════════════════════════════════════
    //  PARTÍCULAS
    // ════════════════════════════════════════
    let particulas = [];

    function _criarParticula(x, y) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 4;
        const emojis = ['✨', '🌹', '💫', '⭐'];
        const useEmoji = Math.random() < 0.4;
        particulas.push({
            x, y,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            vida: 25 + Math.random() * 15,
            size: useEmoji ? 12 + Math.random() * 6 : 4 + Math.random() * 7,
            cor: `hsl(${320 + Math.random() * 60},95%,68%)`,
            emoji: useEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        });
    }

    // Cria partículas na morte do inimigo
    EventBus.on('inimigo:morto', (d) => {
        for (let i = 0; i < 20; i++) _criarParticula(d.x ?? 0, d.y ?? 0);
    });

    // ════════════════════════════════════════
    //  MOEDAS CAINDO
    // ════════════════════════════════════════
    let moedas = [];

    function criarMoeda(canvas) {
        const mx = monstroX(canvas);
        const my = monstroY(canvas);
        moedas.push({
            x: mx + (Math.random() - 0.5) * 110,
            y: my,
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
        const my = monstroY(canvas);
        textos.push({
            x: mx + (Math.random() - 0.5) * 100,
            y: my - 70,
            valor, tipo, vida: 80, max: 80,
        });
    }

    // ════════════════════════════════════════
    //  RENDER COMPLETO
    // ════════════════════════════════════════
    function render(ctx, canvas) {
        _fundo(ctx, canvas);

        // Flores decorativas
        _atualizarFlores(canvas);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        flores.forEach(f => {
            ctx.save(); ctx.globalAlpha = f.alpha;
            ctx.font = `${f.size}px serif`;
            ctx.fillText(f.emoji, f.x, f.y);
            ctx.restore();
        });

        // Flores projéteis
        _atualizarFloresAtt();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        floresAtt.forEach(f => {
            ctx.save(); ctx.globalAlpha = Math.min(1, f.vida / 12);
            ctx.font = `${f.size}px serif`;
            ctx.fillText('🌹', f.x, f.y);
            ctx.restore();
        });

        // Partículas
        particulas.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vida--;
        });
        particulas = particulas.filter(p => p.vida > 0);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        particulas.forEach(p => {
            ctx.save(); ctx.globalAlpha = Math.min(1, p.vida / 12);
            if (p.emoji) {
                ctx.font = `${p.size}px serif`;
                ctx.fillText(p.emoji, p.x, p.y);
            } else {
                ctx.fillStyle = p.cor;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });

        // Moedas
        moedas.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.22; m.vida--; });
        moedas = moedas.filter(m => m.vida > 0);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        moedas.forEach(m => {
            ctx.save(); ctx.globalAlpha = Math.min(1, m.vida / 20);
            ctx.font = `${m.size}px serif`; ctx.fillText('🪙', m.x, m.y); ctx.restore();
        });

        // Monstro
        _desenharMonstro(ctx, canvas);

        // Santa
        _atualizarPB();
        _desenharPB(ctx, canvas);

        // Textos flutuantes
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
            t.y -= 1.9; t.vida--;
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
        },
        render,
        dispararFlor,
        criarMoeda,
        criarTexto,
        criarParticula: _criarParticula,
    };
})();
