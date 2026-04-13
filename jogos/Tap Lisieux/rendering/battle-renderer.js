// ═══════════════════════════════════════════════════════════════════════════
//  BATTLE-RENDERER.JS  —  Sistema visual de batalha  [versão comercial 2.0]
//  Suporta múltiplos monstros com animações idle, hit-flash e conjuração.
// ═══════════════════════════════════════════════════════════════════════════
"use strict";

const BattleRenderer = (() => {

    // ═══════════════════════════════════════════════════════
    //  CONSTANTES GLOBAIS DE LAYOUT
    //  Ajuste aqui para mover elementos sem tocar no resto.
    // ═══════════════════════════════════════════════════════
    const LAYOUT = {
        CHAO_Y:          0.74,   // linha do chão (0=topo, 1=base)
        SANTA_X:         0.28,   // posição horizontal da santa  (esquerda)
        MONSTRO_X:       0.65,   // posição horizontal do monstro (direita)
        SANTA_ALTURA:    0.30,   // altura da santa (% da tela)
        SANTA_PY_OFFSET: 10,     // empurra os pés da santa para baixo do chão
        MONSTRO_TAM:     0.88,   // tamanho base do monstro
        MONSTRO_EMERG:   0.20,   // quanto o monstro afunda no chão (0=topo, 1=enterrado)
    };

    // ════════════════════════════════════════
    //  HELPERS DE LAYOUT
    // ════════════════════════════════════════
    const chaoY    = c => c.height * LAYOUT.CHAO_Y;
    const santaX   = c => c.width  * LAYOUT.SANTA_X;
    const monstroX = c => c.width  * LAYOUT.MONSTRO_X;

    // ═══════════════════════════════════════════════════════
    //  CATÁLOGO DE MONSTROS
    //  Para adicionar um novo monstro: inclua uma entrada
    //  com id, caminhos de assets e configurações de animação.
    // ═══════════════════════════════════════════════════════
    const MONSTER_CATALOG = {

        // ── Slime de Gelo (monstro original, sem animação idle) ──────────
        'slime-de-gelo': {
            basePath:     'monstros/slime-de-gelo/',
            normal:       'slime-de-gelo.png',
            hit:          'slime-de-gelo-hitado.png',
            hitAlt:       null,
            idle: {
                enabled:  false,
            },
        },

        // ── Sapo-Gato (novo monstro com idle ping-pong 13 frames) ────────
        'sapo-gato': {
            basePath:  'monstros/slime-de-gelo/sapo-gato/',
            normal:    null,          // usa idle frame 1 como pose base
            hit:       'saga-hit.png',
            hitAlt:    null,          // saga-hit2 reservado para uso futuro
            idle: {
                enabled:   true,
                prefix:    'saga',    // arquivos: saga1.png … saga13.png
                frames:    13,        // total de frames
                tickNorm:  4,         // ticks por frame normal
                tickApex:  10,        // ticks no frame do ápice (frame 13)
                hitDelay:  6,         // ticks que o sprite de hit fica visível
            },
        },
    };

    // ═══════════════════════════════════════════════════════
    //  ASSETS — armazenados por monstro
    // ═══════════════════════════════════════════════════════
    const assets = {
        cenario: null,
        chao:    null,
        flor:    null,
        santa:   new Array(8).fill(null),
        monsters: {},   // { [monstroId]: { normal, hit, idle: [] } }
    };

    // ═══════════════════════════════════════════════════════
    //  CARREGAMENTO DE ASSETS
    // ═══════════════════════════════════════════════════════
    function _loadImg(src, onLoad, label) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => onLoad(img);
        img.onerror = () => console.warn(`⚠️ Asset não carregado: ${label}`);
        img.src = src;
        return img;
    }

    function carregarAssets() {
        const base = CONFIG.ASSET_BASE;

        _loadImg(base + 'piso-de-batalha/cenario1.png', img => assets.cenario = img, 'cenario');
        _loadImg(base + 'piso-de-batalha/piso1.png',   img => assets.chao    = img, 'chao');
        _loadImg(base + 'armas/flor-basica.png',        img => assets.flor    = img, 'flor');

        for (let i = 1; i <= 8; i++) {
            const idx = i - 1;
            _loadImg(
                base + `animation_summon/str-conjurando${i}.png`,
                img => { assets.santa[idx] = img; },
                `santa-frame-${i}`
            );
        }

        // Carrega todos os monstros do catálogo
        for (const [id, def] of Object.entries(MONSTER_CATALOG)) {
            const entry = { normal: null, hit: null, idle: [] };
            const bp = base + def.basePath;

            if (def.normal) {
                _loadImg(bp + def.normal, img => entry.normal = img, `${id}-normal`);
            }
            if (def.hit) {
                _loadImg(bp + def.hit, img => entry.hit = img, `${id}-hit`);
            }

            if (def.idle.enabled) {
                for (let i = 1; i <= def.idle.frames; i++) {
                    const fi = i - 1;
                    entry.idle.push(null);
                    _loadImg(
                        bp + `${def.idle.prefix}${i}.png`,
                        img => { entry.idle[fi] = img; },
                        `${id}-idle-${i}`
                    );
                }
            }

            assets.monsters[id] = entry;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  ESTADO DE HIT
    // ═══════════════════════════════════════════════════════
    const hit = { tremendo: 0, flash: 0 };
    EventBus.on('inimigo:dano', () => {
        hit.tremendo = 14;
        hit.flash    = 8;
    });

    // ═══════════════════════════════════════════════════════
    //  ESTADO DE ANIMAÇÃO IDLE DO MONSTRO (ping-pong)
    // ═══════════════════════════════════════════════════════
    const idle = {
        frame:    0,    // frame atual (0-based)
        dir:      1,    // +1 avança / -1 recua
        tick:     0,    // contador de ticks
        hitTimer: 0,    // contador de exibição do sprite de hit
    };

    function _atualizarIdle(def) {
        if (idle.hitTimer > 0) {
            idle.hitTimer--;
            return;
        }

        const isApex   = idle.frame === def.idle.frames - 1;
        const duracao  = isApex ? def.idle.tickApex : def.idle.tickNorm;

        idle.tick++;
        if (idle.tick < duracao) return;
        idle.tick = 0;

        idle.frame += idle.dir;

        if (idle.frame >= def.idle.frames) {
            idle.frame = def.idle.frames - 1;
            idle.dir   = -1;
        }
        if (idle.frame < 0) {
            idle.frame = 0;
            idle.dir   = 1;
        }
    }

    // Quando leva hit, trava no sprite de hit por alguns ticks
    EventBus.on('inimigo:dano', () => {
        const id  = BattleState?.inimigo?.tipo ?? '';
        const def = MONSTER_CATALOG[id];
        if (def?.idle?.enabled) {
            idle.hitTimer = def.idle.hitDelay ?? 6;
        }
    });

    // Reseta idle ao trocar de monstro
    EventBus.on('inimigo:novo', () => {
        idle.frame    = 0;
        idle.dir      = 1;
        idle.tick     = 0;
        idle.hitTimer = 0;
    });

    // ═══════════════════════════════════════════════════════
    //  FUNDO
    // ═══════════════════════════════════════════════════════
    function _fundo(ctx, canvas) {
        const W = canvas.width, H = canvas.height;
        if (_imgOk(assets.cenario)) {
            const i   = assets.cenario;
            const esc = Math.max(W / i.naturalWidth, H / i.naturalHeight);
            const dw  = i.naturalWidth  * esc;
            const dh  = i.naturalHeight * esc;
            ctx.drawImage(i, (W - dw) / 2, (H - dh) / 2, dw, dh);
        } else {
            _fundoFallback(ctx, W, H, chaoY(canvas));
        }
    }

    function _fundoFallback(ctx, W, H, cy) {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0,    '#030110');
        g.addColorStop(0.45, '#0a0728');
        g.addColorStop(1,    '#1c0f5e');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

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
        ctx.beginPath();
        ctx.arc(lx, ly, 62, 0, Math.PI * 2);
        ctx.fill();
    }

    // ═══════════════════════════════════════════════════════
    //  CHÃO
    // ═══════════════════════════════════════════════════════
    function _desenharChao(ctx, canvas) {
        const W  = canvas.width;
        const H  = canvas.height;
        const cy = chaoY(canvas);
        if (_imgOk(assets.chao)) {
            ctx.drawImage(assets.chao, 0, cy, W, H - cy);
        } else {
            const g = ctx.createLinearGradient(0, cy, 0, H);
            g.addColorStop(0,   '#22095a');
            g.addColorStop(0.3, '#160636');
            g.addColorStop(1,   '#060318');
            ctx.fillStyle = g;
            ctx.fillRect(0, cy, W, H - cy);
        }
    }

    // ═══════════════════════════════════════════════════════
    //  MONSTRO — despacha para o renderizador correto
    // ═══════════════════════════════════════════════════════
    function _desenharMonstro(ctx, canvas) {
        if (hit.flash    > 0) hit.flash--;
        if (hit.tremendo > 0) hit.tremendo--;

        const ini  = BattleState.inimigo;
        const id   = ini.tipo ?? 'slime-de-gelo';
        const def  = MONSTER_CATALOG[id] ?? MONSTER_CATALOG['slime-de-gelo'];
        const mAssets = assets.monsters[id] ?? assets.monsters['slime-de-gelo'];

        const pct = Math.max(0.05, ini.maxHp > 0 ? ini.hp / ini.maxHp : 1);
        const tam = canvas.height * (LAYOUT.MONSTRO_TAM + pct * 0.05);

        const ox = hit.tremendo > 0 ? (Math.random() - 0.5) * 18 : 0;
        const oy = hit.tremendo > 0 ? (Math.random() - 0.5) * 10 : 0;

        const mx = monstroX(canvas) + ox;
        const my = chaoY(canvas) - tam * LAYOUT.MONSTRO_EMERG + oy;

        ctx.save();
        ctx.shadowBlur  = 42 + Math.sin(Date.now() * 0.004) * 14;
        ctx.shadowColor = pct < 0.25 ? 'rgba(255,220,0,1)' : 'rgba(255,50,50,0.9)';

        if (def.idle.enabled) {
            _desenharMonstroAnimado(ctx, canvas, def, mAssets, mx, my, tam, pct);
        } else {
            _desenharMonstroEstatico(ctx, ini, def, mAssets, mx, my, tam);
        }

        ctx.restore();
    }

    // ─── Monstro com sprite sheet de hit simples (slime original) ───────
    function _desenharMonstroEstatico(ctx, ini, def, mAssets, mx, my, tam) {
        const useHit   = hit.flash > 0 && _imgOk(mAssets.hit);
        const imgM     = useHit ? mAssets.hit : mAssets.normal;

        if (_imgOk(imgM)) {
            const lar = tam * (imgM.naturalWidth / imgM.naturalHeight);
            ctx.drawImage(imgM, mx - lar / 2, my - tam / 2, lar, tam);
        } else {
            _monstroEmojisFallback(ctx, ini, mx, my, tam);
        }
    }

    // ─── Monstro com animação idle ping-pong (sapo-gato) ────────────────
    function _desenharMonstroAnimado(ctx, canvas, def, mAssets, mx, my, tam, pct) {
        _atualizarIdle(def);

        let imgM;
        const emHit = idle.hitTimer > 0 && _imgOk(mAssets.hit);

        if (emHit) {
            imgM = mAssets.hit;
        } else {
            imgM = mAssets.idle[idle.frame] ?? null;
            // fallback: frame 0 ou normal
            if (!_imgOk(imgM)) imgM = mAssets.idle[0] ?? mAssets.normal;
        }

        if (_imgOk(imgM)) {
            // Escala vertical sutil: no ápice o monstro fica ligeiramente maior
            const apexScale = def.idle.enabled
                ? 1 + (idle.frame / (def.idle.frames - 1)) * 0.08
                : 1;
            const tamEsc = tam * apexScale;
            const lar    = tamEsc * (imgM.naturalWidth / imgM.naturalHeight);

            // Brilho verde/mágico pulsando conforme o frame de esticamento
            if (!emHit) {
                const t        = Date.now();
                const progress = idle.frame / (def.idle.frames - 1);
                ctx.shadowBlur  = 20 + progress * 40;
                ctx.shadowColor = `rgba(80, 255, 180, ${0.3 + progress * 0.5})`;
            }

            ctx.drawImage(imgM, mx - lar / 2, my - tamEsc / 2, lar, tamEsc);
        } else {
            // Fallback texto enquanto assets carregam
            ctx.font = `${tam * 0.5}px serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐸', mx, my);
        }
    }

    function _monstroEmojisFallback(ctx, ini, mx, my, tam) {
        const tipo = tiposMonstros?.[ini.tipo] ?? tiposMonstros?.[0];
        ctx.font = `${tam}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tipo?.emojis?.normal ?? '👾', mx, my);
    }

    // ═══════════════════════════════════════════════════════
    //  PERSONAGEM (Santa Teresinha) — Conjuração Ping-Pong
    // ═══════════════════════════════════════════════════════
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

    EventBus.on('flores:conjurar', () => {
        if (!pb.conjurando) {
            pb.conjurando = true;
            pb.frame      = 0;
            pb.direcao    = 1;
            pb.tempo      = 0;
        }
    });

    function _atualizarPB() {
        if (!pb.conjurando) { pb.frame = 0; pb.offX = 0; return; }

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

        pb.offX = pb.frame === pb.FRAME_MAX
            ? Math.sin(Date.now() * 0.018) * 3.5
            : 0;
    }

    function _desenharPB(ctx, canvas) {
        const px  = santaX(canvas);
        const py  = chaoY(canvas) + LAYOUT.SANTA_PY_OFFSET;
        const ALT = canvas.height * LAYOUT.SANTA_ALTURA;
        const off = pb.offX;
        const img = assets.santa[pb.frame];

        if (_imgOk(img)) {
            const lar = ALT * (img.naturalWidth / img.naturalHeight);

            if (pb.conjurando && Math.random() < 0.35) {
                const t = pb.frame / pb.FRAME_MAX;
                _criarParticulaMagica(
                    px + off + (Math.random() - 0.5) * lar * 0.6,
                    py - ALT * (0.2 + Math.random() * 0.7),
                    t
                );
            }

            ctx.save();
            ctx.translate(px + off, py);
            ctx.scale(-1, 1);   // espelhada para olhar para a direita
            ctx.drawImage(img, -lar / 2, -ALT, lar, ALT);
            ctx.restore();
        } else {
            _santaFallback(ctx, px, py, ALT, off);
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

    // ═══════════════════════════════════════════════════════
    //  FLORES — Sistema completo
    // ═══════════════════════════════════════════════════════
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
            if (posicoes.some(p => Math.hypot(p.x - x, p.y - y) < MIN_DIST)) continue;

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
            x: pos.x, y: pos.y, size: pos.size, glowFase: pos.glowFase,
            alpha:      spawnImediato ? 1 : 0,
            glow:       spawnImediato ? 1 : 0,
            conjurando: !spawnImediato,
            conjFrames: 0,
            conjDur:    45,
            viva:       true,
        };
    }

    function _checarReabastecimento() {
        if (flores.filter(f => f.viva).length <= FLORES_REABAST) {
            EventBus.emit('flores:conjurar');
        }
    }

    EventBus.on('flores:resetar', () => {
        _posFixas.forEach((pos, idx) => {
            if (!flores.some(f => f.idx === idx && f.viva)) {
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
                f.conjurando = false; f.alpha = 1; f.glow = 1;
            }
        });
        flores = flores.filter(f => f.viva);
    }

    function _desenharFlores(ctx, canvas) {
        if (!_imgOk(assets.flor)) return;
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

    // ═══════════════════════════════════════════════════════
    //  FLORES PROJÉTEIS
    // ═══════════════════════════════════════════════════════
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
            x:  melhor.x, y: melhor.y,
            vx: Math.cos(angulo) * sp, vy: Math.sin(angulo) * sp,
            tx, ty, size: melhor.size, angulo,
            vida: Math.ceil(melhorDist / sp) + 10,
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
        if (!_imgOk(assets.flor)) return;
        floresAtt.forEach(f => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, f.vida / 12);
            ctx.translate(f.x, f.y);
            ctx.rotate(f.angulo + Math.PI / 2);
            ctx.drawImage(assets.flor, -f.size / 2, -f.size / 2, f.size, f.size);
            ctx.restore();
        });
    }

    // ═══════════════════════════════════════════════════════
    //  PARTÍCULAS
    // ═══════════════════════════════════════════════════════
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

    EventBus.on('inimigo:morto', d => {
        for (let i = 0; i < 20; i++) _criarParticula(d?.x ?? 0, d?.y ?? 0);
    });

    // ═══════════════════════════════════════════════════════
    //  MOEDAS CAINDO
    // ═══════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════
    //  TEXTOS FLUTUANTES
    // ═══════════════════════════════════════════════════════
    let textos = [];

    function criarTexto(valor, tipo, canvas) {
        const mx = monstroX(canvas);
        const my = chaoY(canvas) - canvas.height * 0.45;
        textos.push({
            x: mx + (Math.random() - 0.5) * 100,
            y: my, valor, tipo, vida: 80, max: 80,
        });
    }

    // ═══════════════════════════════════════════════════════
    //  UTILITÁRIOS INTERNOS
    // ═══════════════════════════════════════════════════════
    function _imgOk(img) {
        return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    }

    // ═══════════════════════════════════════════════════════
    //  RENDER PRINCIPAL
    // ═══════════════════════════════════════════════════════
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
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        particulas.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.magica ? 0.03 : 0.14;
            p.vida--;
        });
        particulas = particulas.filter(p => p.vida > 0);
        particulas.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.min(1, p.vida / 12);
            if (p.emoji) {
                ctx.font = `${p.size}px serif`;
                ctx.fillText(p.emoji, p.x, p.y);
            } else {
                ctx.fillStyle = p.cor;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });

        // 7. Moedas
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        moedas.forEach(m => { m.x += m.vx; m.y += m.vy; m.vy += 0.22; m.vida--; });
        moedas = moedas.filter(m => m.vida > 0);
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
            const [cor, tam] =
                t.tipo === 'levelup' ? ['#ffd700', 26] :
                t.tipo === 'dps'     ? ['#aaffaa', 13] :
                t.tipo === 'critico' ? ['#ff4400', 26] :
                                       ['#ff9de2', 22];
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

    // ═══════════════════════════════════════════════════════
    //  API PÚBLICA
    // ═══════════════════════════════════════════════════════
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

        // Permite registrar monstros extras em runtime sem editar este arquivo
        registrarMonstro(id, definicao) {
            MONSTER_CATALOG[id] = definicao;
        },
    };

})();
