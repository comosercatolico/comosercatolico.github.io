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
    const hit = { tremendo: 0, flash: 0 };
    EventBus.on('inimigo:dano', () => { hit.tremendo = 14; hit.flash = 8; });

    // ════════════════════════════════════════
    //  HELPERS DE POSIÇÃO
    // ════════════════════════════════════════

    // ─────────────────────────────────────────────────────────
    // POSICIONAMENTO VERTICAL DO CHÃO:
    //   Aumente o valor (ex: 0.80) para descer a linha do chão.
    //   Diminua (ex: 0.65) para subir a linha do chão.
    // ─────────────────────────────────────────────────────────
    function chaoY(canvas) { return canvas.height * 0.74; }

    // ─────────────────────────────────────────────────────────
    // POSICIONAMENTO HORIZONTAL DOS PERSONAGENS:
    //   0.50 = centro exato da tela.
    //   Diminua (ex: 0.30) para mover tudo para a ESQUERDA.
    //   Aumente (ex: 0.70) para mover tudo para a DIREITA.
    //
    //   Se quiser Santa e Monstro em lados opostos, separe
    //   as funções santaX e monstroX com valores diferentes,
    //   por exemplo:
    //     santaX  → canvas.width * 0.25   (esquerda)
    //     monstroX → canvas.width * 0.70  (direita)
    // ─────────────────────────────────────────────────────────
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
    //  PERSONAGEM (Santa Teresinha) — Conjuração Ping-Pong
    // ════════════════════════════════════════
    const pb = {
        frame:       0,     // frame atual (0–7)
        direcao:     1,     // +1 avança  /  -1 recua
        tempo:       0,     // contador de ticks
        conjurando:  false, // está animando agora?
        TICK_NORMAL: 6,     // ticks por frame normal
        TICK_ULTIMO: 38,    // ticks no frame do ápice (último frame)
        FRAME_MAX:   7,     // índice do último frame (0-based, total 8 frames)
        offX:        0,     // vibração horizontal no ápice
    };

    // Flores pediram conjuração → Santa inicia animação do zero
    EventBus.on('flores:conjurar', () => {
        if (!pb.conjurando) {
            pb.conjurando = true;
            pb.frame      = 0;
            pb.direcao    = 1;
            pb.tempo      = 0;
        }
    });

    function _atualizarPB() {
        // Parada: trava no frame 0, sem vibração
        if (!pb.conjurando) {
            pb.frame = 0;
            pb.offX  = 0;
            return;
        }

        const duracao = pb.frame === pb.FRAME_MAX
            ? pb.TICK_ULTIMO   // ápice demora mais
            : pb.TICK_NORMAL;  // frames normais

        pb.tempo++;

        if (pb.tempo >= duracao) {
            pb.tempo = 0;
            pb.frame += pb.direcao;

            // Chegou no ápice → inverte direção e dispara reset das flores
            if (pb.frame >= pb.FRAME_MAX) {
                pb.frame   = pb.FRAME_MAX;
                pb.direcao = -1;
                EventBus.emit('flores:resetar');
            }

            // Voltou ao frame 0 vindo de trás → encerra animação
            if (pb.frame <= 0 && pb.direcao === -1) {
                pb.frame      = 0;
                pb.conjurando = false;
                pb.direcao    = 1;
            }
        }

        // Vibração sutil só no ápice
        pb.offX = pb.frame === pb.FRAME_MAX
            ? Math.sin(Date.now() * 0.018) * 3.5
            : 0;
    }

    function _desenharPB(ctx, canvas) {
        // ─────────────────────────────────────────────────────
        // POSIÇÃO HORIZONTAL DA SANTA:
        //   Troque santaX(canvas) por um número fixo ou por
        //   canvas.width * 0.XX para mover para esquerda/direita.
        //   Ex: const px = canvas.width * 0.25;  → esquerda
        // ─────────────────────────────────────────────────────
        const px = santaX(canvas);

        // ─────────────────────────────────────────────────────
        // POSIÇÃO VERTICAL (PÉS DA SANTA):
        //   chaoY(canvas) é a linha do chão.
        //   O +40 empurra os pés um pouco para baixo do chão
        //   (evita flutuar). Aumente para afundar mais,
        //   diminua ou zere para ela ficar mais em cima.
        // ─────────────────────────────────────────────────────
        const py = chaoY(canvas) + 120;

        // ─────────────────────────────────────────────────────
        // TAMANHO DA SANTA:
        //   Aumente o 0.30 para deixá-la maior.
        //   Diminua para deixá-la menor.
        //   Ex: canvas.height * 0.40 → 40% da altura da tela
        // ─────────────────────────────────────────────────────
        const ALT  = canvas.height * 0.30;
        const offX = pb.offX;
        const img  = assets.santa[pb.frame];

        if (imgOk(img)) {
            const lar = ALT * (img.naturalWidth / img.naturalHeight);

            // Sombra elíptica no chão REMOVIDA conforme solicitado.
            // Para reativar, descomente o bloco abaixo:
            /*
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath();
            ctx.ellipse(px + offX, py + 5, lar * 0.38, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            */

            // Efeito de aura no ápice REMOVIDO conforme solicitado.
            // Para reativar, descomente o bloco abaixo:
            /*
            if (pb.conjurando && pb.frame === pb.FRAME_MAX) {
                ctx.save();
                const pulso     = 0.5 + Math.sin(Date.now() * 0.012) * 0.5;
                ctx.shadowBlur  = 40 + pulso * 30;
                ctx.shadowColor = `rgba(180,80,255,${0.6 + pulso * 0.4})`;
                ctx.globalAlpha = 0.18 + pulso * 0.12;
                ctx.fillStyle   = 'rgba(200,100,255,1)';
                ctx.beginPath();
                ctx.ellipse(
                    px + offX, py - ALT * 0.5,
                    lar * 0.45, ALT * 0.55,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.restore();
            }
            */

            // Partículas mágicas subindo durante a conjuração
            if (pb.conjurando && Math.random() < 0.35) {
                const t = pb.frame / pb.FRAME_MAX;
                _criarParticulaMagica(
                    px + offX + (Math.random() - 0.5) * lar * 0.6,
                    py - ALT * (0.2 + Math.random() * 0.7),
                    t
                );
            }

            // ─────────────────────────────────────────────────
            // ESPELHAMENTO HORIZONTAL:
            //   ctx.scale(-1, 1) espelha a Santa para ela
            //   olhar para a direita (padrão atual).
            //   Remova o scale(-1,1) e troque por scale(1,1)
            //   (ou apague a linha) para ela olhar para a esquerda.
            // ─────────────────────────────────────────────────
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
    //  MONSTRO
    // ════════════════════════════════════════
    function _desenharMonstro(ctx, canvas) {
        if (hit.flash > 0)    hit.flash--;
        if (hit.tremendo > 0) hit.tremendo--;

        const ini = BattleState.inimigo;
        const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);

        // ─────────────────────────────────────────────────────
        // TAMANHO DO MONSTRO:
        //   O valor base é 0.88 (88% da altura da tela).
        //   Diminua para deixar menor, aumente para maior.
        //   Ex: canvas.height * 0.55  → monstro bem menor
        // ─────────────────────────────────────────────────────
        const tam = canvas.height * (0.88 + pct * 0.05);

        const ox = hit.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
        const oy = hit.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;

        // ─────────────────────────────────────────────────────
        // POSIÇÃO HORIZONTAL DO MONSTRO:
        //   Troque monstroX(canvas) por canvas.width * 0.XX
        //   Ex: canvas.width * 0.70  → monstro na direita
        // ─────────────────────────────────────────────────────
        const mx = monstroX(canvas) + ox;

        // ─────────────────────────────────────────────────────
        // POSIÇÃO VERTICAL DO MONSTRO:
        //   chaoY(canvas) é a linha do chão.
        //   O - tam * 0.10 faz o monstro ficar semi-enterrado.
        //   Aumente o 0.10 para subi-lo mais,
        //   diminua para afundá-lo mais no chão.
        // ─────────────────────────────────────────────────────
        const my = chaoY(canvas) - tam * 0.10 + oy;

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

    // Verifica se flores estão acabando → pede conjuração à Santa
    function _checarReabastecimento() {
        const vivas = flores.filter(f => f.viva).length;
        if (vivas <= FLORES_REABAST) {
            EventBus.emit('flores:conjurar');
        }
    }

    // Santa atingiu o ápice → flores reaparecem com animação de surgimento
    EventBus.on('flores:resetar', () => {
        _posFixas.forEach((pos, idx) => {
            const jaExiste = flores.some(f => f.idx === idx && f.viva);
            if (!jaExiste) {
                flores.push(_criarFlor(pos, idx, false));
            }
        });
    });

    function _atualizarFlores() {
        flores.forEach(f => {
            if (!f.conjurando) return;
            f.conjFrames++;
            const t = f.conjFrames / f.conjDur;
            f.alpha = Math.min(1, t * 1.4);
            f.glow  = Math.sin(t * Math.PI);
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

    // Partículas mágicas leves que sobem durante a conjuração
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
            // Mágicas sobem levemente; normais caem com gravidade
            p.vy += p.magica ? 0.03 : 0.14;
            p.vida--;
        });
        particulas = particulas.filter(p => p.vida > 0);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        particulas.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.vida / 12);
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
        },
        render,
        dispararFlor,
        criarMoeda,
        criarTexto,
        criarParticula: _criarParticula,
    };
})();
