// ═══════════════════════════════════════════════════════════
//  BATTLE-RENDERER.JS — Todo sistema visual da batalha
// ═══════════════════════════════════════════════════════════
"use strict";

const BattleRenderer = (() => {

    const assets = {
        cenario:       null,
        chao:          null,
        santa:         new Array(8).fill(null),
        monstroNormal: null,
        monstroHitado: null,
        flor:          null,
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
    }

    // ════════════════════════════════════════
    //  HIT STATE
    // ════════════════════════════════════════
    const hit = {
        tremendo: 0,
        flash:    0,
        ondas:    [],      // ondas de choque no impacto
        telaFlash: 0,      // flash vermelho na tela inteira
    };

    EventBus.on('inimigo:dano', () => {
        hit.tremendo  = 14;
        hit.flash     = 8;
        hit.telaFlash = 6;
        // Onda de choque
        hit.ondas.push({ r: 0, maxR: 90, alpha: 0.7, vida: 18 });
    });

    // ════════════════════════════════════════
    //  MORTE DO MONSTRO
    // ════════════════════════════════════════
    const morte = { ativo: false, alpha: 1, escala: 1, frames: 0 };

    EventBus.on('inimigo:morto', (d) => {
        morte.ativo  = true;
        morte.alpha  = 1;
        morte.escala = 1;
        morte.frames = 0;
        // Explosão de partículas dramática
        for (let i = 0; i < 40; i++) _criarParticula(d.x ?? 0, d.y ?? 0, true);
        for (let i = 0; i < 15; i++) _criarEstrela(d.x ?? 0, d.y ?? 0);
    });

    // ════════════════════════════════════════
    //  HELPERS DE POSIÇÃO
    // ════════════════════════════════════════

    // ↓ Linha do topo do chão — aumenta para descer, diminui para subir
    function chaoY(canvas)    { return canvas.height * 0.74; }

    // ↓ Centro horizontal — monstro e santa no mesmo X
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
        const W  = canvas.width;
        const H  = canvas.height;
        const cy = chaoY(canvas);

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
            ctx.beginPath();
            ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.0, 0, Math.PI * 2);
            ctx.fill();
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
    //  FLASH DE TELA (impacto)
    // ════════════════════════════════════════
    function _desenharTelaFlash(ctx, canvas) {
        if (hit.telaFlash <= 0) return;
        hit.telaFlash--;
        const alpha = (hit.telaFlash / 6) * 0.18;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = '#ff2200';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // ════════════════════════════════════════
    //  ONDAS DE CHOQUE
    // ════════════════════════════════════════
    function _desenharOndas(ctx, canvas) {
        const mx = monstroX(canvas);
        const my = chaoY(canvas) - canvas.height * 0.10;

        hit.ondas.forEach(o => {
            o.r    += (o.maxR - o.r) * 0.22;
            o.alpha -= 0.038;
            o.vida--;

            ctx.save();
            ctx.globalAlpha  = Math.max(0, o.alpha);
            ctx.strokeStyle  = 'rgba(255, 80, 80, 1)';
            ctx.lineWidth    = 3;
            ctx.shadowBlur   = 18;
            ctx.shadowColor  = 'rgba(255,50,50,0.8)';
            ctx.beginPath();
            ctx.arc(mx, my, o.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        hit.ondas = hit.ondas.filter(o => o.vida > 0 && o.alpha > 0);
    }

    // ════════════════════════════════════════
    //  PERSONAGEM (Santa Teresinha)
    // ════════════════════════════════════════
    const pb = { atacando: 0, durAtaque: 28, frame: 0, tempo: 0, bob: 0 };
    EventBus.on('inimigo:dano', () => { pb.atacando = pb.durAtaque; });

    function _atualizarPB() {
        pb.tempo++;
        pb.bob++;
        if (pb.tempo >= 5) { pb.tempo = 0; pb.frame = (pb.frame + 1) % 8; }
        if (pb.atacando > 0) pb.atacando--;
    }

    function _desenharPB(ctx, canvas) {
        const px = santaX(canvas);

        // ↓ Pés da santa — toca o topo do chão (+40 = desce 40px)
        const py = chaoY(canvas) + 40;

        // Bob suave idle
        const bobY = pb.atacando > 0 ? 0 : Math.sin(pb.bob * 0.04) * 3;

        // ↓ Altura da santa — aumenta para ficar maior
        const ALT  = canvas.height * 0.30;
        const offX = pb.atacando > 0
            ? Math.sin((pb.atacando / pb.durAtaque) * Math.PI) * 14
            : 0;
        const img = assets.santa[pb.frame];

        // Flash branco ao atacar
        const atacandoFlash = pb.atacando > pb.durAtaque - 4;

        if (imgOk(img)) {
            const lar = ALT * (img.naturalWidth / img.naturalHeight);

            // Sombra no chão — estica ao atacar
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.beginPath();
            const slarX = pb.atacando > 0 ? lar * 0.50 : lar * 0.38;
            ctx.ellipse(px + offX, py + 6, slarX, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Sprite
            ctx.save();
            ctx.translate(px + offX, py + bobY);
            ctx.scale(-1, 1);

            if (atacandoFlash) {
                ctx.filter = 'brightness(3) saturate(0)';
            }

            ctx.drawImage(img, -lar / 2, -ALT, lar, ALT);
            ctx.restore();

            // Aura sagrada idle
            if (pb.atacando === 0) {
                const auraAlpha = 0.08 + Math.sin(pb.bob * 0.05) * 0.04;
                ctx.save();
                ctx.globalAlpha = auraAlpha;
                const auraGrd = ctx.createRadialGradient(px, py - ALT * 0.5, 0, px, py - ALT * 0.5, ALT * 0.6);
                auraGrd.addColorStop(0,   'rgba(255,220,120,0.6)');
                auraGrd.addColorStop(1,   'rgba(255,180,60,0)');
                ctx.fillStyle = auraGrd;
                ctx.beginPath();
                ctx.arc(px, py - ALT * 0.5, ALT * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

        } else {
            _santaFallback(ctx, px, py + bobY, ALT, offX);
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
    //  MONSTRO
    // ════════════════════════════════════════
    const monstroAnim = { respira: 0 };

    function _desenharMonstro(ctx, canvas) {
        if (hit.flash > 0)    hit.flash--;
        if (hit.tremendo > 0) hit.tremendo--;

        monstroAnim.respira++;

        const ini = BattleState.inimigo;
        const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);

        // ↓ Tamanho base do monstro — aumenta para ficar maior
        const tamBase = canvas.height * (0.88 + pct * 0.05);

        // Respiração suave — escala pulsando
        const respiracao = 1 + Math.sin(monstroAnim.respira * 0.03) * 0.018;

        // HP baixo → tremor constante + respiração acelerada
        const hpBaixo = pct < 0.30;
        const tremorExtra = hpBaixo ? (Math.random() - 0.5) * 6 : 0;

        const tam = tamBase * respiracao;
        const ox  = (hit.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0) + tremorExtra;
        const oy  = hit.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;
        const mx  = monstroX(canvas) + ox;

        // ↓ my = posição vertical — diminui 0.10 para subir, aumenta para descer
        const my = chaoY(canvas) - tam * 0.10 + oy;

        const imgMonstro = (hit.flash > 0 && imgOk(assets.monstroHitado))
            ? assets.monstroHitado
            : assets.monstroNormal;

        // Glow — HP baixo fica dourado pulsante
        const glowIntensidade = hpBaixo
            ? 55 + Math.sin(Date.now() * 0.012) * 30
            : 42 + Math.sin(Date.now() * 0.004) * 14;
        const glowCor = hpBaixo
            ? `rgba(255,200,0,${0.8 + Math.sin(Date.now() * 0.01) * 0.2})`
            : pct < 0.50
                ? 'rgba(255,120,0,0.9)'
                : 'rgba(255,50,50,0.9)';

        ctx.save();
        ctx.shadowBlur  = glowIntensidade;
        ctx.shadowColor = glowCor;

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

        // Sombra no chão do monstro
        ctx.save();
        const sombW = tam * 0.35 * respiracao;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(mx, chaoY(canvas) + 8, sombW, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Ondas de choque no impacto
        _desenharOndas(ctx, canvas);

        // Animação de morte
        if (morte.ativo) {
            morte.frames++;
            morte.escala += 0.06;
            morte.alpha  -= 0.055;
            if (morte.alpha <= 0) {
                morte.ativo = false;
            } else if (imgOk(imgMonstro)) {
                const lar = tam * (imgMonstro.naturalWidth / imgMonstro.naturalHeight);
                ctx.save();
                ctx.globalAlpha = morte.alpha;
                ctx.translate(mx, my);
                ctx.scale(morte.escala, morte.escala);
                ctx.shadowBlur  = 60;
                ctx.shadowColor = 'rgba(255,200,0,1)';
                ctx.drawImage(imgMonstro, -lar / 2, -tam / 2, lar, tam);
                ctx.restore();
            }
        }
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
        if (vivas <= FLORES_REABAST) {
            _posFixas.forEach((pos, idx) => {
                const jaExiste = flores.some(f => f.idx === idx && f.viva);
                if (!jaExiste) flores.push(_criarFlor(pos, idx, false));
            });
        }
    }

    function _atualizarFlores() {
        flores.forEach(f => {
            if (!f.conjurando) return;
            f.conjFrames++;
            const t = f.conjFrames / f.conjDur;
            f.alpha = Math.min(1, t * 1.4);
            f.glow  = Math.sin(t * Math.PI);

            // Estrelinhas saindo enquanto conjura
            if (f.conjurando && f.conjFrames % 4 === 0) {
                _criarEstrelaMini(f.x, f.y);
            }

            if (f.conjFrames >= f.conjDur) {
                f.conjurando = false;
                f.alpha = 1;
                f.glow  = 1;
            }
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

            // Glow vermelho pulsante
            if (f.glow > 0) {
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRaio);
                grd.addColorStop(0,   `rgba(255,60,60,${0.55 * f.glow * glowPulse})`);
                grd.addColorStop(0.5, `rgba(255,20,20,${0.25 * f.glow})`);
                grd.addColorStop(1,   'rgba(255,0,0,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, glowRaio, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur  = 8 * f.glow * glowPulse;
            ctx.shadowColor = 'rgba(255,80,80,0.6)';
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
            x:       melhor.x,
            y:       melhor.y,
            vx:      Math.cos(angulo) * sp,
            vy:      Math.sin(angulo) * sp,
            tx, ty,
            size:    melhor.size,
            angulo,
            vida:    Math.ceil(melhorDist / sp) + 10,
            acertou: false,
            trail:   [], // rastro
        });

        melhor.viva = false;
        _checarReabastecimento();
    }

    function _atualizarFloresAtt() {
        floresAtt.forEach(f => {
            // Salva posição no trail
            f.trail.push({ x: f.x, y: f.y });
            if (f.trail.length > 8) f.trail.shift();

            f.x += f.vx; f.y += f.vy; f.vida--;
            if (!f.acertou && Math.hypot(f.x - f.tx, f.y - f.ty) < 30) {
                f.acertou = true; f.vida = 0;
                for (let p = 0; p < 12; p++) _criarParticula(f.x, f.y, false);
                for (let p = 0; p < 5;  p++) _criarEstrelaMini(f.x, f.y);
            }
        });
        floresAtt = floresAtt.filter(f => f.vida > 0);
    }

    function _desenharFloresAtt(ctx) {
        if (!imgOk(assets.flor)) return;

        floresAtt.forEach(f => {
            // Desenha trail
            f.trail.forEach((p, i) => {
                const a = (i / f.trail.length) * 0.35;
                const s = f.size * (i / f.trail.length) * 0.7;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.translate(p.x, p.y);
                ctx.rotate(f.angulo + Math.PI / 2);
                ctx.drawImage(assets.flor, -s / 2, -s / 2, s, s);
                ctx.restore();
            });

            // Desenha flor principal
            ctx.save();
            ctx.globalAlpha = Math.min(1, f.vida / 12);
            ctx.translate(f.x, f.y);
            ctx.rotate(f.angulo + Math.PI / 2);
            ctx.shadowBlur  = 12;
            ctx.shadowColor = 'rgba(255,80,80,0.7)';
            ctx.drawImage(assets.flor, -f.size / 2, -f.size / 2, f.size, f.size);
            ctx.restore();
        });
    }

    // ════════════════════════════════════════
    //  PARTÍCULAS
    // ════════════════════════════════════════
    const MAX_PARTICULAS = 120;
    let particulas = [];
    let estrelas   = [];

    function _criarParticula(x, y, grande = false) {
        if (particulas.length >= MAX_PARTICULAS) return;
        const ang      = Math.random() * Math.PI * 2;
        const spd      = grande
            ? 3 + Math.random() * 7
            : 1.5 + Math.random() * 4;
        const emojis   = ['✨', '🌹', '💫', '⭐', '🌸'];
        const useEmoji = Math.random() < (grande ? 0.5 : 0.3);
        particulas.push({
            x, y,
            vx:    Math.cos(ang) * spd,
            vy:    Math.sin(ang) * spd - (grande ? 2 : 0),
            vida:  grande ? 40 + Math.random() * 20 : 25 + Math.random() * 15,
            size:  useEmoji
                ? (grande ? 16 + Math.random() * 10 : 12 + Math.random() * 6)
                : (grande ? 6  + Math.random() * 8  : 4  + Math.random() * 7),
            cor:   `hsl(${grande ? 40 + Math.random() * 30 : 320 + Math.random() * 60},95%,68%)`,
            emoji: useEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : null,
        });
    }

    // Estrelas douradas para conjuração e impacto
    function _criarEstrela(x, y) {
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const spd = 3 + Math.random() * 5;
            estrelas.push({
                x, y,
                vx:   Math.cos(ang) * spd,
                vy:   Math.sin(ang) * spd,
                vida: 30 + Math.random() * 20,
                size: 8 + Math.random() * 10,
                cor:  `hsl(${45 + Math.random() * 20},100%,70%)`,
            });
        }
    }

    function _criarEstrelaMini(x, y) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 1 + Math.random() * 2;
        estrelas.push({
            x, y,
            vx:   Math.cos(ang) * spd,
            vy:   Math.sin(ang) * spd - 1,
            vida: 15 + Math.random() * 10,
            size: 4 + Math.random() * 5,
            cor:  `hsl(${45 + Math.random() * 40},100%,75%)`,
        });
    }

    EventBus.on('inimigo:morto', (d) => {
        for (let i = 0; i < 40; i++) _criarParticula(d.x ?? 0, d.y ?? 0, true);
        _criarEstrela(d.x ?? 0, d.y ?? 0);
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
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.2,
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
            x:     mx + (Math.random() - 0.5) * 100,
            y:     my,
            valor, tipo,
            vida:  80, max: 80,
            escala: tipo === 'critico' ? 1.4 : 1.0, // crítico começa maior
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

        // 6. Estrelas
        estrelas.forEach(e => {
            e.x += e.vx; e.y += e.vy;
            e.vy += 0.08;
            e.vida--;
        });
        estrelas = estrelas.filter(e => e.vida > 0);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        estrelas.forEach(e => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, e.vida / 15);
            ctx.fillStyle   = e.cor;
            ctx.shadowBlur  = 10;
            ctx.shadowColor = e.cor;
            ctx.font = `${e.size}px serif`;
            ctx.fillText('✦', e.x, e.y);
            ctx.restore();
        });

        // 7. Partículas
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
                ctx.fillStyle   = p.cor;
                ctx.shadowBlur  = 6;
                ctx.shadowColor = p.cor;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });

        // 8. Moedas com rotação
        moedas.forEach(m => {
            m.x += m.vx; m.y += m.vy; m.vy += 0.22;
            m.rot += m.rotV;
            m.vida--;
        });
        moedas = moedas.filter(m => m.vida > 0);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        moedas.forEach(m => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, m.vida / 20);
            ctx.translate(m.x, m.y);
            ctx.rotate(m.rot);
            ctx.font = `${m.size}px serif`;
            ctx.fillText('🪙', 0, 0);
            ctx.restore();
        });

        // 9. Flash de tela no impacto
        _desenharTelaFlash(ctx, canvas);

        // 10. Santa — na frente de tudo
        _atualizarPB();
        _desenharPB(ctx, canvas);

        // 11. Textos flutuantes com escala
        ctx.textAlign = 'center';
        textos.forEach(t => {
            ctx.save();
            const progresso = t.vida / t.max;
            ctx.globalAlpha = Math.min(1, t.vida / 22);

            const [cor, tam] = t.tipo === 'levelup' ? ['#ffd700', 26]
                             : t.tipo === 'dps'     ? ['#aaffaa', 13]
                             : t.tipo === 'critico' ? ['#ff4400', 28]
                             : ['#ff9de2', 22];

            // Crítico pulsa no início
            const escalaFinal = t.tipo === 'critico'
                ? 1 + Math.sin(progresso * Math.PI) * 0.3
                : 1;

            ctx.translate(t.x, t.y);
            ctx.scale(escalaFinal, escalaFinal);

            ctx.font = `bold ${tam}px 'Nunito', sans-serif`;
            ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = 4;
            ctx.strokeText(t.valor, 0, 0);
            ctx.fillStyle = cor;

            if (t.tipo === 'critico') {
                ctx.shadowBlur  = 12;
                ctx.shadowColor = '#ff6600';
            }

            ctx.fillText(t.valor, 0, 0);
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
