// ═══════════════════════════════════════════════════════════
//  BATTLE-RENDERER.JS — Sistema visual completo da batalha
//  Monstros: slime-de-gelo + sapo-gato (animado, ping-pong)
//  Rotação automática entre monstros por estágio
// ═══════════════════════════════════════════════════════════
"use strict";

const BattleRenderer = (() => {

    // ════════════════════════════════════════
    //  ASSETS
    // ════════════════════════════════════════
    const assets = {
        cenario: null,
        chao:    null,
        santa:   new Array(8).fill(null),
        flor:    null,

        // Monstro 0: slime-de-gelo
        slime: {
            normal: null,
            hit:    null,
        },

        // Monstro 1: sapo-gato (13 frames ping-pong + hit)
        sapoGato: {
            frames: new Array(13).fill(null),
            hit:    null,
        },
    };

    function _loadImg(src, onload, label) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => onload(img);
        img.onerror = () => console.warn('Nao carregado: ' + label);
        img.src = src;
    }

    function carregarAssets() {
        const base = CONFIG.ASSET_BASE;

        _loadImg(base + 'piso-de-batalha/cenario1.png', img => assets.cenario = img, 'Cenario');
        _loadImg(base + 'piso-de-batalha/piso1.png',    img => assets.chao    = img, 'Chao');
        _loadImg(base + 'armas/flor-basica.png',         img => assets.flor    = img, 'Flor');

        for (let i = 1; i <= 8; i++) {
            const idx = i - 1;
            _loadImg(base + 'animation_summon/str-conjurando' + i + '.png',
                     img => assets.santa[idx] = img, 'Santa ' + i);
        }

        _loadImg(base + 'monstros/slime-de-gelo/slime-de-gelo.png',
                 img => assets.slime.normal = img, 'Slime normal');
        _loadImg(base + 'monstros/slime-de-gelo/slime-de-gelo-hitado.png',
                 img => assets.slime.hit = img, 'Slime hit');

        for (let i = 1; i <= 13; i++) {
            const idx = i - 1;
            _loadImg(base + 'monstros/slime-de-gelo/sapo-gato/saga' + i + '.png',
                     img => assets.sapoGato.frames[idx] = img, 'SapoGato frame ' + i);
        }
        _loadImg(base + 'monstros/slime-de-gelo/sapo-gato/saga-hit.png',
                 img => assets.sapoGato.hit = img, 'SapoGato hit');
    }

    // ════════════════════════════════════════
    //  ROTACAO DE MONSTROS POR ESTAGIO
    //
    //  Ciclo de 10 estagios:
    //    1-4   -> slime-de-gelo
    //    5-9   -> sapo-gato
    //    ×10   -> chefe (slime dourado grande)
    //
    //  Ajuste GRUPO para mudar quantos estagios
    //  cada monstro aparece antes de alternar.
    // ════════════════════════════════════════
    const GRUPO = 5;

    function _tipoMonstroAtual() {
        const e = BattleState.estagio;
        if (e % 10 === 0) return 'chefe';
        return ((e - 1) % 10) < GRUPO ? 'slime' : 'sapoGato';
    }

    // ════════════════════════════════════════
    //  ANIMACAO PING-PONG DO SAPO-GATO
    //  1->2->...->13->12->...->2->1->...
    // ════════════════════════════════════════
    const sagaAnim = {
        frame: 0,       // 0-12
        dir:   1,       // +1 ou -1
        tick:  0,
        TICK_POR_FRAME: 4,
    };

    function _atualizarSagaAnim() {
        sagaAnim.tick++;
        if (sagaAnim.tick < sagaAnim.TICK_POR_FRAME) return;
        sagaAnim.tick = 0;
        sagaAnim.frame += sagaAnim.dir;
        if (sagaAnim.frame >= 12) { sagaAnim.frame = 12; sagaAnim.dir = -1; }
        if (sagaAnim.frame <= 0)  { sagaAnim.frame = 0;  sagaAnim.dir =  1; }
    }

    // ════════════════════════════════════════
    //  HIT STATE
    // ════════════════════════════════════════
    const hit = { tremendo: 0, flash: 0 };
    EventBus.on('inimigo:dano', () => { hit.tremendo = 14; hit.flash = 8; });

    // ════════════════════════════════════════
    //  POSICOES
    // ════════════════════════════════════════
    function chaoY(canvas)    { return canvas.height * 0.74; }
    function santaX(canvas)   { return canvas.width  * 0.50; }
    function monstroX(canvas) { return canvas.width  * 0.50; }
    function monstroY(canvas) { return chaoY(canvas) - canvas.height * 0.20; }

    // ════════════════════════════════════════
    //  FUNDO
    // ════════════════════════════════════════
    function _fundo(ctx, canvas) {
        const W = canvas.width, H = canvas.height, cy = chaoY(canvas);
        if (imgOk(assets.cenario)) {
            const i = assets.cenario;
            const esc = Math.max(W / i.naturalWidth, H / i.naturalHeight);
            ctx.drawImage(i, (W - i.naturalWidth*esc)/2, (H - i.naturalHeight*esc)/2,
                          i.naturalWidth*esc, i.naturalHeight*esc);
        } else {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0,'#030110'); g.addColorStop(0.45,'#0a0728'); g.addColorStop(1,'#1c0f5e');
            ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
            const t = Date.now();
            for (let i = 0; i < 120; i++) {
                const sx=(i*193+7)%W, sy=(i*99+11)%(cy*0.72);
                ctx.globalAlpha=(Math.abs(Math.sin(t*0.0007+i))*0.55+0.25)*0.5;
                ctx.fillStyle = i%5===0?'#ffddaa':'#fff';
                ctx.beginPath(); ctx.arc(sx,sy,i%4===0?1.8:1.0,0,Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha=1;
            const lx=W*0.76,ly=H*0.14;
            const gl=ctx.createRadialGradient(lx,ly,0,lx,ly,62);
            gl.addColorStop(0,'rgba(255,248,200,1)');
            gl.addColorStop(0.5,'rgba(255,220,130,0.4)');
            gl.addColorStop(1,'rgba(255,200,80,0)');
            ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(lx,ly,62,0,Math.PI*2); ctx.fill();
        }
    }

    // ════════════════════════════════════════
    //  CHAO
    // ════════════════════════════════════════
    function _desenharChao(ctx, canvas) {
        const W=canvas.width, H=canvas.height, cy=chaoY(canvas);
        if (imgOk(assets.chao)) {
            ctx.drawImage(assets.chao, 0, cy, W, H-cy);
        } else {
            const g=ctx.createLinearGradient(0,cy,0,H);
            g.addColorStop(0,'#22095a'); g.addColorStop(0.3,'#160636'); g.addColorStop(1,'#060318');
            ctx.fillStyle=g; ctx.fillRect(0,cy,W,H-cy);
        }
    }

    // ════════════════════════════════════════
    //  MONSTROS
    // ════════════════════════════════════════
    function _desenharMonstro(ctx, canvas) {
        if (hit.flash > 0)    hit.flash--;
        if (hit.tremendo > 0) hit.tremendo--;

        const tipo = _tipoMonstroAtual();
        if (tipo === 'sapoGato') _desenharSapoGato(ctx, canvas);
        else                     _desenharSlime(ctx, canvas, tipo === 'chefe');
    }

    function _monstroBase(canvas, escBase) {
        const ini = BattleState.inimigo;
        const pct = Math.max(0.05, ini.maxHp>0 ? ini.hp/ini.maxHp : 1);
        const tam = canvas.height * (escBase + pct * 0.05);
        const ox  = hit.tremendo>0 ? (Math.random()-0.5)*18 : 0;
        const oy  = hit.tremendo>0 ? (Math.random()-0.5)*10 : 0;
        return { pct, tam, mx: monstroX(canvas)+ox, my: monstroY(canvas)+oy };
    }

    // Slime de gelo (estagio normal ou chefe dourado)
    function _desenharSlime(ctx, canvas, chefe) {
        const { pct, tam, mx, my } = _monstroBase(canvas, 0.88);
        const imgBase = hit.flash>0 && imgOk(assets.slime.hit)
            ? assets.slime.hit : assets.slime.normal;

        ctx.save();
        ctx.shadowBlur  = 42 + Math.sin(Date.now()*0.004)*14;
        ctx.shadowColor = chefe ? 'rgba(255,200,0,1)' : pct<0.25 ? 'rgba(255,220,0,1)' : 'rgba(255,50,50,0.9)';

        if (chefe) {
            const p = 0.5+Math.sin(Date.now()*0.006)*0.5;
            ctx.shadowBlur  = 60+p*40;
            ctx.shadowColor = 'rgba(255,200,0,' + (0.8+p*0.2) + ')';
            ctx.filter      = 'sepia(0.6) saturate(3) hue-rotate(10deg)';
        }

        if (imgOk(imgBase)) {
            const lar = tam*(imgBase.naturalWidth/imgBase.naturalHeight);
            ctx.drawImage(imgBase, mx-lar/2, my-tam/2, lar, tam);
        } else {
            ctx.font=`${tam*0.6}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(chefe?'👑':'🧊', mx, my);
        }
        ctx.restore();
    }

    // Sapo-gato: animacao ping-pong 1-13-1-13...
    function _desenharSapoGato(ctx, canvas) {
        _atualizarSagaAnim();
        const { pct, tam, mx, my } = _monstroBase(canvas, 0.82);

        const isHit = hit.flash>0 && imgOk(assets.sapoGato.hit);
        const img   = isHit ? assets.sapoGato.hit : assets.sapoGato.frames[sagaAnim.frame];

        // Offset vertical: no frame maximo (12) sobe um pouco
        const floatY = (sagaAnim.frame/12) * canvas.height * 0.03;

        ctx.save();
        ctx.shadowBlur  = 38+Math.sin(Date.now()*0.004)*12;
        ctx.shadowColor = pct<0.25 ? 'rgba(255,220,0,1)' : 'rgba(100,220,255,0.85)';

        if (imgOk(img)) {
            const lar = tam*(img.naturalWidth/img.naturalHeight);
            ctx.drawImage(img, mx-lar/2, my-tam/2-floatY, lar, tam);
        } else {
            ctx.font=`${tam*0.6}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('🐸', mx, my);
        }
        ctx.restore();
    }

    // ════════════════════════════════════════
    //  SANTA — conjuracao ping-pong
    // ════════════════════════════════════════
    const pb = {
        frame:0, direcao:1, tempo:0, conjurando:false,
        TICK_NORMAL:6, TICK_ULTIMO:38, FRAME_MAX:7, offX:0,
    };

    EventBus.on('flores:conjurar', () => {
        if (!pb.conjurando) { pb.conjurando=true; pb.frame=0; pb.direcao=1; pb.tempo=0; }
    });

    function _atualizarPB() {
        if (!pb.conjurando) { pb.frame=0; pb.offX=0; return; }
        const dur = pb.frame===pb.FRAME_MAX ? pb.TICK_ULTIMO : pb.TICK_NORMAL;
        pb.tempo++;
        if (pb.tempo >= dur) {
            pb.tempo=0; pb.frame+=pb.direcao;
            if (pb.frame>=pb.FRAME_MAX) { pb.frame=pb.FRAME_MAX; pb.direcao=-1; EventBus.emit('flores:resetar'); }
            if (pb.frame<=0 && pb.direcao===-1) { pb.frame=0; pb.conjurando=false; pb.direcao=1; }
        }
        pb.offX = pb.frame===pb.FRAME_MAX ? Math.sin(Date.now()*0.018)*3.5 : 0;
    }

    function _desenharPB(ctx, canvas) {
        const px=santaX(canvas), py=chaoY(canvas)+10, ALT=canvas.height*0.30;
        const img=assets.santa[pb.frame];
        if (imgOk(img)) {
            const lar=ALT*(img.naturalWidth/img.naturalHeight);
            if (pb.conjurando && Math.random()<0.35)
                _criarParticulaMagica(px+pb.offX+(Math.random()-0.5)*lar*0.6,
                                      py-ALT*(0.2+Math.random()*0.7),
                                      pb.frame/pb.FRAME_MAX);
            ctx.save(); ctx.translate(px+pb.offX,py); ctx.scale(-1,1);
            ctx.drawImage(img,-lar/2,-ALT,lar,ALT); ctx.restore();
        } else {
            // fallback simples
            ctx.save(); ctx.fillStyle='#e8c5ff';
            ctx.beginPath(); ctx.arc(px,py-ALT*0.82,ALT*0.13,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
    }

    // ════════════════════════════════════════
    //  FLORES decorativas + projeteis
    // ════════════════════════════════════════
    const FLORES_MAX=30, FLORES_REABAST=5, FLOR_MIN=28, FLOR_MAX=42;
    let _posFixas=[], flores=[], floresAtt=[];

    function _gerarPosFixas(canvas) {
        const W=canvas.width, H=canvas.height, cy=chaoY(canvas);
        const mx=monstroX(canvas), my=monstroY(canvas);
        const BOSS_R=200, TETO=H*0.04, CHAO=cy*0.80, MIN_D=52;
        const pos=[];
        let t=0;
        while(pos.length<FLORES_MAX && t<3000) {
            t++;
            const x=FLOR_MAX+Math.random()*(W-FLOR_MAX*2);
            const y=TETO+Math.random()*(CHAO-TETO);
            const size=FLOR_MIN+Math.random()*(FLOR_MAX-FLOR_MIN);
            if(Math.hypot(x-mx,y-my)<BOSS_R) continue;
            if(pos.some(p=>Math.hypot(p.x-x,p.y-y)<MIN_D)) continue;
            pos.push({x,y,size,glowFase:Math.random()*Math.PI*2});
        }
        return pos;
    }

    function initFlores(canvas) {
        _posFixas=_gerarPosFixas(canvas);
        flores=_posFixas.map((p,i)=>_criarFlor(p,i,true));
        floresAtt=[];
    }

    function _criarFlor(pos,idx,spawnImediato) {
        return {idx,x:pos.x,y:pos.y,size:pos.size,glowFase:pos.glowFase,
                alpha:spawnImediato?1:0,glow:spawnImediato?1:0,
                conjurando:!spawnImediato,conjFrames:0,conjDur:45,viva:true};
    }

    function _checarReabastecimento() {
        if(flores.filter(f=>f.viva).length<=FLORES_REABAST) EventBus.emit('flores:conjurar');
    }

    EventBus.on('flores:resetar',()=>{
        _posFixas.forEach((pos,idx)=>{
            if(!flores.some(f=>f.idx===idx&&f.viva)) flores.push(_criarFlor(pos,idx,false));
        });
    });

    function _atualizarFlores() {
        flores.forEach(f=>{
            if(!f.conjurando) return;
            f.conjFrames++;
            const t=f.conjFrames/f.conjDur;
            f.alpha=Math.min(1,t*1.4); f.glow=Math.sin(t*Math.PI);
            if(f.conjFrames>=f.conjDur){f.conjurando=false;f.alpha=1;f.glow=1;}
        });
        flores=flores.filter(f=>f.viva);
    }

    function _desenharFlores(ctx) {
        if(!imgOk(assets.flor)) return;
        const t=Date.now();
        flores.forEach(f=>{
            if(!f.viva) return;
            const gp=0.6+Math.sin(t*0.002+f.glowFase)*0.4;
            const gr=f.size*0.7*gp;
            ctx.save(); ctx.globalAlpha=f.alpha; ctx.translate(f.x,f.y);
            if(f.glow>0){
                const grd=ctx.createRadialGradient(0,0,0,0,0,gr);
                grd.addColorStop(0,`rgba(255,60,60,${0.55*f.glow*gp})`);
                grd.addColorStop(0.5,`rgba(255,20,20,${0.25*f.glow})`);
                grd.addColorStop(1,'rgba(255,0,0,0)');
                ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(0,0,gr,0,Math.PI*2); ctx.fill();
            }
            ctx.drawImage(assets.flor,-f.size/2,-f.size/2,f.size,f.size);
            ctx.restore();
        });
    }

    function dispararFlor(canvas) {
        const mx=monstroX(canvas), my=monstroY(canvas);
        let melhor=null, mDist=Infinity;
        flores.forEach(f=>{
            if(!f.viva||f.conjurando) return;
            const d=Math.hypot(f.x-mx,f.y-my);
            if(d<mDist){mDist=d;melhor=f;}
        });
        if(!melhor) return;
        const ang=Math.atan2(my-melhor.y,mx-melhor.x);
        const tx=mx+(Math.random()-0.5)*70, ty=my+(Math.random()-0.5)*70;
        const sp=10+Math.random()*5;
        floresAtt.push({x:melhor.x,y:melhor.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,
                        tx,ty,size:melhor.size,angulo:ang,
                        vida:Math.ceil(mDist/sp)+10,acertou:false});
        melhor.viva=false;
        _checarReabastecimento();
    }

    function _atualizarFloresAtt() {
        floresAtt.forEach(f=>{
            f.x+=f.vx;f.y+=f.vy;f.vida--;
            if(!f.acertou&&Math.hypot(f.x-f.tx,f.y-f.ty)<30){
                f.acertou=true;f.vida=0;
                for(let p=0;p<10;p++) _criarParticula(f.x,f.y);
            }
        });
        floresAtt=floresAtt.filter(f=>f.vida>0);
    }

    function _desenharFloresAtt(ctx) {
        if(!imgOk(assets.flor)) return;
        floresAtt.forEach(f=>{
            ctx.save(); ctx.globalAlpha=Math.min(1,f.vida/12);
            ctx.translate(f.x,f.y); ctx.rotate(f.angulo+Math.PI/2);
            ctx.drawImage(assets.flor,-f.size/2,-f.size/2,f.size,f.size);
            ctx.restore();
        });
    }

    // ════════════════════════════════════════
    //  PARTICULAS
    // ════════════════════════════════════════
    let particulas=[];

    function _criarParticula(x,y) {
        const ang=Math.random()*Math.PI*2, spd=1.5+Math.random()*4;
        const emojis=['✨','🌹','💫','⭐'];
        const useEmoji=Math.random()<0.4;
        particulas.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
                         vida:25+Math.random()*15,size:useEmoji?12+Math.random()*6:4+Math.random()*7,
                         cor:`hsl(${320+Math.random()*60},95%,68%)`,
                         emoji:useEmoji?emojis[Math.floor(Math.random()*emojis.length)]:null,magica:false});
    }

    function _criarParticulaMagica(x,y,intensidade) {
        const cores=[`hsl(${270+Math.random()*60},100%,75%)`,`hsl(${180+Math.random()*40},100%,80%)`,'#fff'];
        particulas.push({x,y,vx:(Math.random()-0.5)*1.5,vy:-(0.8+Math.random()*1.8+intensidade*1.5),
                         vida:18+Math.random()*18,size:2+Math.random()*4*intensidade,
                         cor:cores[Math.floor(Math.random()*cores.length)],emoji:null,magica:true});
    }

    EventBus.on('inimigo:morto',()=>{
        const mx=monstroX({width:400}), my=monstroY({height:700});
        for(let i=0;i<22;i++) _criarParticula(mx,my);
    });

    // ════════════════════════════════════════
    //  MOEDAS
    // ════════════════════════════════════════
    let moedas=[];

    function criarMoeda(canvas) {
        moedas.push({x:monstroX(canvas)+(Math.random()-0.5)*110,y:monstroY(canvas),
                     vy:-(3.5+Math.random()*2.8),vx:(Math.random()-0.5)*2.8,
                     vida:70,size:20+Math.random()*11});
    }

    // ════════════════════════════════════════
    //  TEXTOS FLUTUANTES
    // ════════════════════════════════════════
    let textos=[];

    function criarTexto(valor,tipo,canvas) {
        textos.push({x:monstroX(canvas)+(Math.random()-0.5)*100,
                     y:monstroY(canvas)-canvas.height*0.18,
                     valor,tipo,vida:80,max:80});
    }

    // ════════════════════════════════════════
    //  FLASH DE TRANSICAO ao trocar monstro
    // ════════════════════════════════════════
    let _introFlash=0, _introTipo='';

    EventBus.on('inimigo:configurado',()=>{
        const novo=_tipoMonstroAtual();
        if(novo!==_introTipo){ _introTipo=novo; _introFlash=25; }
    });

    function _desenharIntroFlash(ctx,canvas) {
        if(_introFlash<=0) return;
        _introFlash--;
        ctx.save();
        ctx.fillStyle=`rgba(255,255,255,${(_introFlash/25)*0.30})`;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.restore();
    }

    // ════════════════════════════════════════
    //  RENDER COMPLETO
    // ════════════════════════════════════════
    function render(ctx,canvas) {
        _fundo(ctx,canvas);

        _atualizarFlores();
        _desenharFlores(ctx);

        _atualizarFloresAtt();
        _desenharFloresAtt(ctx);

        _desenharMonstro(ctx,canvas);
        _desenharChao(ctx,canvas);

        // Particulas
        particulas.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.magica?0.03:0.14;p.vida--;});
        particulas=particulas.filter(p=>p.vida>0);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        particulas.forEach(p=>{
            ctx.save(); ctx.globalAlpha=Math.min(1,p.vida/12);
            if(p.emoji){ctx.font=`${p.size}px serif`;ctx.fillText(p.emoji,p.x,p.y);}
            else{ctx.fillStyle=p.cor;ctx.beginPath();ctx.arc(p.x,p.y,p.size*0.5,0,Math.PI*2);ctx.fill();}
            ctx.restore();
        });

        // Moedas
        moedas.forEach(m=>{m.x+=m.vx;m.y+=m.vy;m.vy+=0.22;m.vida--;});
        moedas=moedas.filter(m=>m.vida>0);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        moedas.forEach(m=>{
            ctx.save();ctx.globalAlpha=Math.min(1,m.vida/20);
            ctx.font=`${m.size}px serif`;ctx.fillText('🪙',m.x,m.y);ctx.restore();
        });

        _atualizarPB();
        _desenharPB(ctx,canvas);

        // Textos flutuantes
        ctx.textAlign='center';
        textos.forEach(t=>{
            ctx.save(); ctx.globalAlpha=Math.min(1,t.vida/22);
            const[cor,tam]=t.tipo==='levelup'?['#ffd700',26]:t.tipo==='dps'?['#aaffaa',13]:
                            t.tipo==='critico'?['#ff4400',26]:['#ff9de2',22];
            ctx.font=`bold ${tam}px 'Nunito',sans-serif`;
            ctx.strokeStyle='rgba(0,0,0,0.95)';ctx.lineWidth=4;
            ctx.strokeText(t.valor,t.x,t.y);ctx.fillStyle=cor;ctx.fillText(t.valor,t.x,t.y);
            ctx.restore(); t.y-=1.9; t.vida--;
        });
        textos=textos.filter(t=>t.vida>0);

        _desenharIntroFlash(ctx,canvas);
    }

    return { init(canvas){carregarAssets();initFlores(canvas);},
             onResize(canvas){initFlores(canvas);},
             render, dispararFlor, criarMoeda, criarTexto,
             criarParticula:_criarParticula };
})();
