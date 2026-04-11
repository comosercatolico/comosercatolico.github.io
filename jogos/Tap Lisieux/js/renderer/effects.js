// ═══════════════════════════════════════════════════════
//  EFFECTS.JS
//  Todos os efeitos visuais do canvas:
//  - Partículas de impacto (rosa acertou monstro)
//  - Moedas caindo ao matar inimigo
//  - Textos flutuantes de dano (click, dps, levelup)
//  - Rosas do céu flutuando (decorativas)
//  - Rosas projéteis voando (ataque)
//
//  Depende de: state.js, event-bus.js
//  Usado por: renderer-battle.js
// ═══════════════════════════════════════════════════════

"use strict";

const Effects = (() => {

    // ── Logger com fallback ──────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Effects"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Flores do céu
        FLORES_CEU_QTD       : 14,
        FLORES_CEU_SIZE_MIN  : 18,
        FLORES_CEU_SIZE_MAX  : 32,
        FLORES_CEU_ALPHA_MIN : 0.60,
        FLORES_CEU_ALPHA_MAX : 0.95,
        FLORES_CEU_SPD_MIN   : 0.0007,
        FLORES_CEU_SPD_MAX   : 0.0013,

        // Projéteis
        PROJ_VELOCIDADE_MIN  : 10,
        PROJ_VELOCIDADE_MAX  : 14,
        PROJ_BURST_QTD       : 8,   // partículas ao acertar

        // Partículas
        PART_VIDA_MIN        : 22,
        PART_VIDA_MAX        : 36,
        PART_SIZE_MIN        : 5,
        PART_SIZE_MAX        : 13,
        PART_VEL_MIN         : 1.5,
        PART_VEL_MAX         : 5.0,
        PART_GRAVIDADE       : 0.13,

        // Moedas
        MOEDA_VY_MIN         : -6.0,
        MOEDA_VY_MAX         : -3.5,
        MOEDA_VX_SPREAD      : 2.5,
        MOEDA_GRAVIDADE      : 0.22,
        MOEDA_VIDA           : 65,
        MOEDA_SIZE_MIN       : 20,
        MOEDA_SIZE_MAX       : 30,

        // Textos flutuantes
        TEXTO_VIDA           : 75,
        TEXTO_SPREAD_X       : 90,
        TEXTO_OFFSET_Y       : 70,
        TEXTO_SUBIDA         : 1.8,

        // Max objetos ativos (performance)
        MAX_PARTICULAS       : 200,
        MAX_MOEDAS           : 30,
        MAX_TEXTOS           : 40,
        MAX_PROJETEIS        : 30,
    });

    // ════════════════════════════════════════════════════
    // REFERÊNCIA AO CANVAS
    // Injetada pelo renderer — Effects não cria o canvas
    // ════════════════════════════════════════════════════
    let _canvas = null;
    let _ctx    = null;

    // ════════════════════════════════════════════════════
    // HELPERS DE POSIÇÃO
    // Calculados a partir do canvas atual
    // ════════════════════════════════════════════════════
    function _chaoY()   { return _canvas ? _canvas.height * 0.78 : 400; }
    function _monstroX(){ return _canvas ? _canvas.width  * 0.50 : 300; }
    function _monstroY(){ return _canvas ? _canvas.height * 0.38 : 200; }

    // ════════════════════════════════════════════════════
    // HELPER ALEATÓRIO
    // ════════════════════════════════════════════════════
    function _rand(min, max) { return min + Math.random() * (max - min); }

    // ════════════════════════════════════════════════════
    // FLORES DO CÉU (decorativas — flutuam no fundo)
    // ════════════════════════════════════════════════════
    let _floresCeu = [];

    /** Cria uma única flor decorativa */
    function _criarFlorCeu(posAleatoria = false) {
        if (!_canvas) return null;

        const W  = _canvas.width;
        const cy = _chaoY();

        const baseX = W * (0.04 + Math.random() * 0.90);
        const baseY = _canvas.height * (0.03 + Math.random() * (posAleatoria ? 0.55 : 0.48));

        return {
            baseX,
            baseY,
            x    : baseX,
            y    : baseY,
            size : _rand(CFG.FLORES_CEU_SIZE_MIN, CFG.FLORES_CEU_SIZE_MAX),
            fase : Math.random() * Math.PI * 2,
            faseV: Math.random() * Math.PI * 2,
            ampH : _rand(5, 13),
            ampV : _rand(2, 5),
            spd  : _rand(CFG.FLORES_CEU_SPD_MIN, CFG.FLORES_CEU_SPD_MAX),
            alpha: _rand(CFG.FLORES_CEU_ALPHA_MIN, CFG.FLORES_CEU_ALPHA_MAX),
        };
    }

    /** Inicializa o conjunto de flores (chamar ao entrar na batalha) */
    function inicializarFlores() {
        _floresCeu = [];
        for (let i = 0; i < CFG.FLORES_CEU_QTD; i++) {
            const f = _criarFlorCeu(true);
            if (f) _floresCeu.push(f);
        }
        _log.debug(`Flores inicializadas: ${_floresCeu.length}`);
    }

    /** Atualiza posição oscilatória das flores */
    function _atualizarFloresCeu() {
        const t = Date.now();
        _floresCeu.forEach(f => {
            f.x = f.baseX + Math.sin(t * f.spd + f.fase)  * f.ampH;
            f.y = f.baseY + Math.sin(t * f.spd * 0.65 + f.faseV) * f.ampV;
        });
    }

    /** Desenha flores decorativas no ctx */
    function _desenharFloresCeu() {
        if (!_ctx || _floresCeu.length === 0) return;

        _ctx.save();
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";

        _floresCeu.forEach(f => {
            _ctx.globalAlpha = f.alpha;
            _ctx.font        = `${f.size}px serif`;
            _ctx.fillText("🌹", f.x, f.y);
        });

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // PROJÉTEIS (rosas voando para o monstro)
    // ════════════════════════════════════════════════════
    let _projeteis = [];

    /**
     * Dispara uma rosa do céu em direção ao monstro.
     * Escolhe a flor decorativa mais próxima do monstro
     * e a reposiciona após o disparo.
     *
     * @param {Function} [onAcerto] - Callback quando a rosa acerta
     */
    function dispararRosa(onAcerto) {
        if (!_canvas || _floresCeu.length === 0) return;
        if (_projeteis.length >= CFG.MAX_PROJETEIS)  return;

        // Escolhe flor mais próxima do monstro
        const mx = _monstroX();
        const my = _monstroY();
        let idx  = 0;
        let dist = Infinity;

        _floresCeu.forEach((f, i) => {
            const d = Math.hypot(f.x - mx, f.y - my);
            if (d < dist) { dist = d; idx = i; }
        });

        const fo  = _floresCeu[idx];
        const tx  = mx + _rand(-60, 60);
        const ty  = my + _rand(-60, 60);
        const d   = Math.hypot(tx - fo.x, ty - fo.y);
        const sp  = _rand(CFG.PROJ_VELOCIDADE_MIN, CFG.PROJ_VELOCIDADE_MAX);
        const ang = Math.atan2(ty - fo.y, tx - fo.x);

        _projeteis.push({
            x      : fo.x,
            y      : fo.y,
            vx     : Math.cos(ang) * sp,
            vy     : Math.sin(ang) * sp,
            tx, ty,
            size   : fo.size,
            vida   : Math.ceil(d / sp) + 8,
            acertou: false,
            onAcerto,
        });

        // Reposiciona a flor usada
        const nova = _criarFlorCeu(true);
        if (nova) _floresCeu[idx] = nova;
    }

    function _atualizarProjeteis() {
        _projeteis.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vida--;

            if (!p.acertou && Math.hypot(p.x - p.tx, p.y - p.ty) < 28) {
                p.acertou = true;
                p.vida    = 0;

                // Cria burst de partículas no ponto de impacto
                for (let i = 0; i < CFG.PROJ_BURST_QTD; i++) {
                    _criarParticula(p.x, p.y);
                }

                // Callback externo (ex.: reduzir HP)
                if (typeof p.onAcerto === "function") {
                    try { p.onAcerto(); }
                    catch(e) { _log.error("onAcerto projétil:", e); }
                }
            }
        });

        _projeteis = _projeteis.filter(p => p.vida > 0);
    }

    function _desenharProjeteis() {
        if (!_ctx || _projeteis.length === 0) return;

        _ctx.save();
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";

        _projeteis.forEach(p => {
            _ctx.globalAlpha = Math.min(1, p.vida / 10);
            _ctx.font        = `${p.size}px serif`;
            _ctx.fillText("🌹", p.x, p.y);
        });

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // PARTÍCULAS (impacto de acerto)
    // ════════════════════════════════════════════════════
    let _particulas = [];

    /** Cria partícula de impacto na posição (x, y) */
    function _criarParticula(x, y) {
        if (_particulas.length >= CFG.MAX_PARTICULAS) return;

        const ang = Math.random() * Math.PI * 2;
        const spd = _rand(CFG.PART_VEL_MIN, CFG.PART_VEL_MAX);

        _particulas.push({
            x, y,
            vx  : Math.cos(ang) * spd,
            vy  : Math.sin(ang) * spd,
            vida: _rand(CFG.PART_VIDA_MIN, CFG.PART_VIDA_MAX) | 0,
            size: _rand(CFG.PART_SIZE_MIN, CFG.PART_SIZE_MAX),
            cor : `hsl(${325 + Math.random() * 50},90%,65%)`,
        });
    }

    /**
     * API pública: cria partículas em (x, y).
     * @param {number} x
     * @param {number} y
     * @param {number} [qtd=6]
     */
    function criarParticulas(x, y, qtd = 6) {
        for (let i = 0; i < qtd; i++) _criarParticula(x, y);
    }

    function _atualizarParticulas() {
        _particulas.forEach(p => {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += CFG.PART_GRAVIDADE;
            p.vida--;
        });
        _particulas = _particulas.filter(p => p.vida > 0);
    }

    function _desenharParticulas() {
        if (!_ctx || _particulas.length === 0) return;

        _ctx.save();
        _particulas.forEach(p => {
            _ctx.globalAlpha = Math.min(1, p.vida / 12);
            _ctx.fillStyle   = p.cor;
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            _ctx.fill();
        });
        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // MOEDAS CAINDO (ao matar inimigo)
    // ════════════════════════════════════════════════════
    let _moedas = [];

    /**
     * Spawna `qtd` moedas caindo a partir da posição do monstro.
     * @param {number} [qtd=3]
     * @param {object} [pos] - { x, y } — padrão: monstro
     */
    function criarMoedasCaindo(qtd = 3, pos) {
        const sx = pos?.x ?? _monstroX();
        const sy = pos?.y ?? _monstroY();
        const max = Math.min(qtd, CFG.MAX_MOEDAS - _moedas.length);

        for (let i = 0; i < max; i++) {
            _moedas.push({
                x   : sx + _rand(-100, 100),
                y   : sy,
                vy  : _rand(CFG.MOEDA_VY_MIN, CFG.MOEDA_VY_MAX),
                vx  : _rand(-CFG.MOEDA_VX_SPREAD, CFG.MOEDA_VX_SPREAD),
                vida: CFG.MOEDA_VIDA,
                size: _rand(CFG.MOEDA_SIZE_MIN, CFG.MOEDA_SIZE_MAX),
            });
        }
    }

    function _atualizarMoedas() {
        _moedas.forEach(m => {
            m.x  += m.vx;
            m.y  += m.vy;
            m.vy += CFG.MOEDA_GRAVIDADE;
            m.vida--;
        });
        _moedas = _moedas.filter(m => m.vida > 0);
    }

    function _desenharMoedas() {
        if (!_ctx || _moedas.length === 0) return;

        _ctx.save();
        _ctx.textAlign    = "center";
        _ctx.textBaseline = "middle";

        _moedas.forEach(m => {
            _ctx.globalAlpha = Math.min(1, m.vida / 18);
            _ctx.font        = `${m.size}px serif`;
            _ctx.fillText("🪙", m.x, m.y);
        });

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // TEXTOS FLUTUANTES (dano, levelup, etc.)
    // ════════════════════════════════════════════════════

    /**
     * Estilos por tipo de texto.
     * Fácil de expandir sem mexer na lógica de desenho.
     */
    const _ESTILOS_TEXTO = Object.freeze({
        click  : { cor: "#ff9de2", tam: 22, negrito: true  },
        dps    : { cor: "#aaffaa", tam: 14, negrito: false  },
        levelup: { cor: "#ffd700", tam: 26, negrito: true   },
        critico: { cor: "#ff4444", tam: 28, negrito: true   },
        gema   : { cor: "#88eeff", tam: 18, negrito: true   },
        padrao : { cor: "#ffffff", tam: 20, negrito: false   },
    });

    let _textos = [];

    /**
     * Cria um texto flutuante na tela.
     * @param {string} valor   - Texto a exibir (ex.: "-1.2K")
     * @param {string} tipo    - "click" | "dps" | "levelup" | "critico" | "gema"
     * @param {object} [pos]   - { x, y } — padrão: área do monstro
     */
    function criarTexto(valor, tipo = "padrao", pos) {
        if (_textos.length >= CFG.MAX_TEXTOS) return;

        const mx = pos?.x ?? (_monstroX() + _rand(-CFG.TEXTO_SPREAD_X / 2, CFG.TEXTO_SPREAD_X / 2));
        const my = pos?.y ?? (_monstroY() - CFG.TEXTO_OFFSET_Y);

        _textos.push({
            x    : mx,
            y    : my,
            valor: String(valor),
            tipo,
            vida : CFG.TEXTO_VIDA,
        });
    }

    function _atualizarTextos() {
        _textos.forEach(t => {
            t.y -= CFG.TEXTO_SUBIDA;
            t.vida--;
        });
        _textos = _textos.filter(t => t.vida > 0);
    }

    function _desenharTextos() {
        if (!_ctx || _textos.length === 0) return;

        _ctx.save();

        _textos.forEach(t => {
            const estilo = _ESTILOS_TEXTO[t.tipo] ?? _ESTILOS_TEXTO.padrao;
            const peso   = estilo.negrito ? "bold " : "";

            _ctx.globalAlpha  = Math.min(1, t.vida / 20);
            _ctx.font         = `${peso}${estilo.tam}px 'Nunito', sans-serif`;
            _ctx.textAlign    = "center";
            _ctx.textBaseline = "middle";

            // Contorno escuro para legibilidade
            _ctx.strokeStyle  = "rgba(0,0,0,0.90)";
            _ctx.lineWidth    = 4;
            _ctx.strokeText(t.valor, t.x, t.y);

            // Texto colorido
            _ctx.fillStyle    = estilo.cor;
            _ctx.fillText(t.valor, t.x, t.y);
        });

        _ctx.restore();
    }

    // ════════════════════════════════════════════════════
    // LIMPAR TUDO (ao sair da batalha)
    // ════════════════════════════════════════════════════
    function limpar() {
        _floresCeu  = [];
        _projeteis  = [];
        _particulas = [];
        _moedas     = [];
        _textos     = [];
        _log.debug("Effects limpos.");
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR + DESENHAR (chamado a cada frame)
    //
    // Ordem de renderização (de trás para frente):
    //   1. Flores do céu (fundo decorativo)
    //   2. Projéteis voando
    //   3. Partículas de impacto
    //   4. Moedas caindo
    //   5. Textos flutuantes (sempre na frente)
    // ════════════════════════════════════════════════════
    function atualizar() {
        _atualizarFloresCeu();
        _atualizarProjeteis();
        _atualizarParticulas();
        _atualizarMoedas();
        _atualizarTextos();
    }

    function desenhar() {
        if (!_ctx) return;

        _desenharFloresCeu();
        _desenharProjeteis();
        _desenharParticulas();
        _desenharMoedas();
        _desenharTextos();
    }

    // ════════════════════════════════════════════════════
    // INTEGRAÇÃO COM EventBus
    // Effects reage a eventos do jogo automaticamente
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Disparo de rosa ao clicar
            EventBus.on("damage:click", ({ valor }) => {
                dispararRosa();
                criarTexto(`-${_formatarNum(valor)}`, "click");
            });

            // DPS passivo — texto menor, sem projétil
            EventBus.on("damage:dps", ({ valor }) => {
                criarTexto(`-${_formatarNum(valor)}`, "dps");
            });

            // Dano crítico
            EventBus.on("damage:critico", ({ valor }) => {
                criarTexto(`💥 ${_formatarNum(valor)}`, "critico");
                criarParticulas(_monstroX(), _monstroY(), 12);
            });

            // Inimigo morreu → moedas
            EventBus.on("kill:registrado", ({ inimigo }) => {
                const qtd = Math.min(5, 1 + Math.floor((inimigo?.rMoeda ?? 10) / 10));
                criarMoedasCaindo(qtd);
            });

            // Level up
            EventBus.on("nivel:up", ({ nivel }) => {
                criarTexto(`⭐ LEVEL UP! Lv.${nivel}`, "levelup");
                criarParticulas(_monstroX(), _monstroY() - 80, 20);
            });

            // Gema ganha
            EventBus.on("gema:update", ({ delta }) => {
                if (delta > 0) criarTexto(`+${delta} 💎`, "gema");
            });

            // Prestígio
            EventBus.on("prestigio:feito", () => {
                criarTexto("✨ PRESTÍGIO!", "levelup");
                criarParticulas(_monstroX(), _monstroY(), 30);
            });

            // Batalha encerrada → limpa efeitos
            EventBus.on("batalha:saiu", () => limpar());

            _log.debug("Eventos registrados.");
        } catch (e) {
            _log.warn("EventBus indisponível — eventos não registrados:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // HELPER INTERNO: formatar número
    // Evita dependência circular com utils.js
    // (utils.js será carregado antes na Fase 1, mas
    //  este fallback garante robustez)
    // ════════════════════════════════════════════════════
    function _formatarNum(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
            if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
            if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
            return String(Math.floor(n));
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════

    /**
     * Deve ser chamado pelo renderer ANTES de qualquer
     * draw, passando o canvas e ctx ativos.
     *
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    function init(canvas, ctx) {
        if (!canvas || !ctx) {
            _log.error("init: canvas ou ctx inválido.");
            return;
        }

        _canvas = canvas;
        _ctx    = ctx;

        _registrarEventos();
        _log.info("Effects inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            floresCeu : _floresCeu.length,
            projeteis : _projeteis.length,
            particulas: _particulas.length,
            moedas    : _moedas.length,
            textos    : _textos.length,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        // Setup
        init,

        // Ciclo de vida
        atualizar,
        desenhar,
        limpar,

        // Flores
        inicializarFlores,
        dispararRosa,

        // Efeitos
        criarParticulas,
        criarMoedasCaindo,
        criarTexto,

        // Debug
        stats,
    });

})();
