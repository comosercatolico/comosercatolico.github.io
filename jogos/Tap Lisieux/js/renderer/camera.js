// ═══════════════════════════════════════════════════════════
//  CAMERA.JS
//  Sistema de câmera completo do jogo.
//
//  DOIS MODOS:
//
//  1. CÂMERA DO LOBBY (arrasto livre)
//     - Arrastar com mouse (drag)
//     - Arrastar com touch (mobile)
//     - Limites do mapa (não sai da borda)
//     - Inércia suave ao soltar (momentum)
//     - Centralização suave em ponto alvo (follow)
//
//  2. CÂMERA DA BATALHA (fixa com efeitos)
//     - Posição fixa (canvas é estático)
//     - Shake ao causar dano (intensidade proporcional)
//     - Shake especial para chefes e lendários
//     - Fila de shakes (não cancela, acumula)
//     - Retorna suavemente ao centro (spring)
//
//  API:
//    Camera.lobby.iniciar(e)   → mousedown / touchstart
//    Camera.lobby.mover(e)     → mousemove / touchmove
//    Camera.lobby.parar()      → mouseup / touchend
//    Camera.lobby.centralizar(tileX, tileY, animado)
//    Camera.lobby.limitar()    → aplica limites do mapa
//    Camera.lobby.x / .y       → posição atual
//
//    Camera.batalha.shake(intensidade, duracao, tipo)
//    Camera.batalha.shakeClick()  → dano normal
//    Camera.batalha.shakeChefe()  → dano em chefe
//    Camera.batalha.shakeLend()   → item lendário
//    Camera.batalha.offsetX / .offsetY → aplicar no ctx
//    Camera.batalha.atualizar()   → chamado todo frame
//
//    Camera.atualizar()   → chamado no loop principal
//
//  Depende de: constants.js, logger.js, event-bus.js
//  Usado por: renderer-lobby.js, renderer-battle.js, input.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Camera = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Camera"); }
        catch { return {
            debug : () => {},
            warn  : (...a) => console.warn("[Camera]",  ...a),
            error : (...a) => console.error("[Camera]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // REFERÊNCIA AO CANVAS
    // ════════════════════════════════════════
    // Resolvida tardiamente para não depender
    // da ordem de carregamento dos scripts
    let _canvas = null;

    function _getCanvas() {
        if (!_canvas) _canvas = document.getElementById("game");
        return _canvas;
    }

    function _W() { return _getCanvas()?.width  ?? window.innerWidth;  }
    function _H() { return _getCanvas()?.height ?? window.innerHeight; }

    // ════════════════════════════════════════
    // CONSTANTES DO MAPA
    // ════════════════════════════════════════
    // Lidas de BALANCE se disponível, fallback seguro
    const _TILE       = (() => { try { return BALANCE.TILE       ?? 32; } catch { return 32; } })();
    const _MAP_W      = (() => { try { return BALANCE.MAP_WIDTH  ?? 100; } catch { return 100; } })();
    const _MAP_H      = (() => { try { return BALANCE.MAP_HEIGHT ?? 100; } catch { return 100; } })();
    const _MAPA_PX_W  = () => _MAP_W * _TILE;
    const _MAPA_PX_H  = () => _MAP_H * _TILE;

    // ════════════════════════════════════════
    // ── 1. CÂMERA DO LOBBY ──
    // ════════════════════════════════════════
    const lobby = (() => {

        // ── Estado ──
        let _x = 0;
        let _y = 0;

        // Arrasto
        let _arrastando  = false;
        let _ultimoX     = 0;
        let _ultimoY     = 0;
        let _ultimoTempo = 0;

        // Inércia (momentum)
        let _velX = 0;
        let _velY = 0;
        const _ATRITO       = 0.88;   // 0→para imediato, 1→desliza para sempre
        const _VEL_MIN      = 0.3;    // velocidade mínima para continuar deslizando
        const _VEL_MAX      = 40;     // cap de velocidade (evita lançamentos absurdos)

        // Follow (centralizar suavemente)
        let _followAtivo    = false;
        let _followAlvoX    = 0;
        let _followAlvoY    = 0;
        const _FOLLOW_LERP  = 0.08;   // velocidade da interpolação (0→instantâneo suave)

        // ── Limitar posição dentro do mapa ──
        function _limitar() {
            const maxX = Math.max(0, _MAPA_PX_W() - _W());
            const maxY = Math.max(0, _MAPA_PX_H() - _H());
            _x = Math.max(0, Math.min(maxX, _x));
            _y = Math.max(0, Math.min(maxY, _y));
        }

        // ── Iniciar arrasto (mousedown / touchstart) ──
        function iniciar(e) {
            _arrastando  = true;
            _followAtivo = false;    // cancela follow ao tocar
            _velX        = 0;
            _velY        = 0;

            const pt     = _ponteiro(e);
            _ultimoX     = pt.x;
            _ultimoY     = pt.y;
            _ultimoTempo = performance.now();

            _getCanvas().style.cursor = "grabbing";
        }

        // ── Mover (mousemove / touchmove) ──
        function mover(e) {
            if (!_arrastando) return;

            const pt    = _ponteiro(e);
            const dx    = pt.x - _ultimoX;
            const dy    = pt.y - _ultimoY;
            const agora = performance.now();
            const dt    = agora - _ultimoTempo || 1;

            _x -= dx;
            _y -= dy;
            _limitar();

            // Calcula velocidade para inércia (pixels/ms → pixels/frame a 60fps)
            _velX = _clamp((-dx / dt) * 16, -_VEL_MAX, _VEL_MAX);
            _velY = _clamp((-dy / dt) * 16, -_VEL_MAX, _VEL_MAX);

            _ultimoX     = pt.x;
            _ultimoY     = pt.y;
            _ultimoTempo = agora;
        }

        // ── Parar arrasto (mouseup / touchend / mouseleave) ──
        function parar() {
            if (!_arrastando) return;
            _arrastando = false;
            _getCanvas().style.cursor = "grab";
            // Inércia continua no atualizar()
        }

        // ── Centralizar suavemente em tile ──
        /**
         * Anima a câmera suavemente até centralizar em (tileX, tileY).
         * @param {number}  tileX
         * @param {number}  tileY
         * @param {boolean} [animado=true]
         */
        function centralizar(tileX, tileY, animado = true) {
            const alvoX = tileX * _TILE + _TILE / 2 - _W() / 2;
            const alvoY = tileY * _TILE + _TILE / 2 - _H() / 2;

            if (!animado) {
                _x = alvoX;
                _y = alvoY;
                _limitar();
                return;
            }

            _followAlvoX = alvoX;
            _followAlvoY = alvoY;
            _followAtivo = true;
            _velX        = 0;
            _velY        = 0;
        }

        // ── Centralizar no meio do mapa ──
        function centralizarMapa(animado = false) {
            centralizar(_MAP_W / 2, _MAP_H / 2, animado);
        }

        // ── Atualizar (chamado todo frame) ──
        function atualizar() {
            if (_followAtivo) {
                // Interpolação suave (lerp) até o alvo
                _x = _lerp(_x, _followAlvoX, _FOLLOW_LERP);
                _y = _lerp(_y, _followAlvoY, _FOLLOW_LERP);

                // Chegou perto o suficiente — para o follow
                if (Math.abs(_x - _followAlvoX) < 0.5 &&
                    Math.abs(_y - _followAlvoY) < 0.5) {
                    _x           = _followAlvoX;
                    _y           = _followAlvoY;
                    _followAtivo = false;
                }

                _limitar();
                return;
            }

            if (!_arrastando) {
                // Aplica inércia
                if (Math.abs(_velX) > _VEL_MIN || Math.abs(_velY) > _VEL_MIN) {
                    _x   += _velX;
                    _y   += _velY;
                    _velX *= _ATRITO;
                    _velY *= _ATRITO;
                    _limitar();
                } else {
                    _velX = 0;
                    _velY = 0;
                }
            }
        }

        // ── Extrair ponto de mouse ou touch ──
        function _ponteiro(e) {
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        return {
            iniciar,
            mover,
            parar,
            centralizar,
            centralizarMapa,
            atualizar,
            limitar: _limitar,

            get x()          { return _x; },
            get y()          { return _y; },
            get arrastando() { return _arrastando; },

            // Setter controlado (ex: ao restaurar save)
            setPos(x, y) {
                _x = x;
                _y = y;
                _limitar();
            }
        };

    })(); // fim lobby

    // ════════════════════════════════════════
    // ── 2. CÂMERA DA BATALHA (shake) ──
    // ════════════════════════════════════════
    const batalha = (() => {

        // ── Offset atual (aplicado no ctx) ──
        let _offsetX = 0;
        let _offsetY = 0;

        // ── Fila de shakes ──
        // Cada shake é independente e acumula
        // { intensidade, duracao, decaimento, tipo, tempoRestante, angulo }
        const _filaShake = [];

        // Constantes de decaimento por tipo
        const TIPOS_SHAKE = Object.freeze({
            // Dano normal de clique — pequeno, rápido
            click: {
                intensidade : 3,
                duracao     : 180,    // ms
                decaimento  : "rapido"
            },
            // Dano de DPS — quase imperceptível
            dps: {
                intensidade : 1.2,
                duracao     : 100,
                decaimento  : "rapido"
            },
            // Morte de inimigo normal
            morte: {
                intensidade : 5,
                duracao     : 280,
                decaimento  : "medio"
            },
            // Morte de chefe
            chefe: {
                intensidade : 14,
                duracao     : 550,
                decaimento  : "lento"
            },
            // Item lendário invocado
            lendario: {
                intensidade : 10,
                duracao     : 700,
                decaimento  : "lento"
            },
            // Level up
            levelup: {
                intensidade : 7,
                duracao     : 400,
                decaimento  : "medio"
            }
        });

        // ── Adicionar shake à fila ──
        /**
         * Adiciona um shake à câmera de batalha.
         *
         * @param {number} intensidade — pixels de deslocamento máximo
         * @param {number} duracao     — duração em ms
         * @param {string} [tipo]      — "click"|"dps"|"morte"|"chefe"|"lendario"|"levelup"
         *
         * @example
         * Camera.batalha.shake(8, 300);
         * Camera.batalha.shake(14, 500, "chefe");
         */
        function shake(intensidade, duracao, tipo = "click") {
            if (intensidade <= 0 || duracao <= 0) return;

            // Cap de intensidade para não ficar insano
            const intCap = Math.min(intensidade, 30);

            _filaShake.push({
                intensidade  : intCap,
                duracaoTotal : duracao,
                tempoRestante: duracao,
                decaimento   : TIPOS_SHAKE[tipo]?.decaimento ?? "rapido",
                tipo,
                // Ângulo aleatório para direção do shake
                angulo       : Math.random() * Math.PI * 2
            });
        }

        // ── Atalhos semânticos ──
        function shakeClick()   { shake(TIPOS_SHAKE.click.intensidade,   TIPOS_SHAKE.click.duracao,   "click");   }
        function shakeDps()     { shake(TIPOS_SHAKE.dps.intensidade,     TIPOS_SHAKE.dps.duracao,     "dps");     }
        function shakeMorte()   { shake(TIPOS_SHAKE.morte.intensidade,   TIPOS_SHAKE.morte.duracao,   "morte");   }
        function shakeChefe()   { shake(TIPOS_SHAKE.chefe.intensidade,   TIPOS_SHAKE.chefe.duracao,   "chefe");   }
        function shakeLend()    { shake(TIPOS_SHAKE.lendario.intensidade,TIPOS_SHAKE.lendario.duracao,"lendario");}
        function shakeLevelUp() { shake(TIPOS_SHAKE.levelup.intensidade, TIPOS_SHAKE.levelup.duracao, "levelup"); }

        // ── Atualizar (chamado todo frame com deltaTime em ms) ──
        function atualizar(dt = 16) {
            if (_filaShake.length === 0) {
                // Retorno suave ao zero (spring)
                _offsetX = _lerp(_offsetX, 0, 0.25);
                _offsetY = _lerp(_offsetY, 0, 0.25);

                if (Math.abs(_offsetX) < 0.1) _offsetX = 0;
                if (Math.abs(_offsetY) < 0.1) _offsetY = 0;
                return;
            }

            // Acumula offset de todos os shakes ativos
            let somaX = 0;
            let somaY = 0;

            for (let i = _filaShake.length - 1; i >= 0; i--) {
                const s = _filaShake[i];
                s.tempoRestante -= dt;

                if (s.tempoRestante <= 0) {
                    _filaShake.splice(i, 1);
                    continue;
                }

                // Progresso 1→0
                const progresso = s.tempoRestante / s.duracaoTotal;

                // Envelope de amplitude baseado no decaimento
                let envelope;
                switch (s.decaimento) {
                    case "rapido": envelope = progresso * progresso;            break;
                    case "medio":  envelope = progresso;                        break;
                    case "lento":  envelope = Math.sqrt(progresso);             break;
                    default:       envelope = progresso;
                }

                const amp = s.intensidade * envelope;

                // Shake direcional com ângulo aleatório por frame
                // (rotaciona levemente o ângulo para vibração natural)
                s.angulo += 1.8 + Math.random() * 0.8;
                somaX    += Math.cos(s.angulo) * amp;
                somaY    += Math.sin(s.angulo) * amp;
            }

            // Suaviza para evitar saltos bruscos entre frames
            _offsetX = _lerp(_offsetX, somaX, 0.6);
            _offsetY = _lerp(_offsetY, somaY, 0.6);
        }

        // ── Aplicar no ctx (chame dentro de ctx.save/restore) ──
        /**
         * Aplica o offset de shake no contexto 2D.
         * Chame APÓS ctx.save() e ANTES de desenhar.
         *
         * @param {CanvasRenderingContext2D} ctx
         */
        function aplicar(ctx) {
            if (_offsetX !== 0 || _offsetY !== 0) {
                ctx.translate(_offsetX, _offsetY);
            }
        }

        // ── Parar todos os shakes imediatamente ──
        function parar() {
            _filaShake.length = 0;
            _offsetX = 0;
            _offsetY = 0;
        }

        return {
            // Core
            shake,
            atualizar,
            aplicar,
            parar,

            // Atalhos semânticos
            shakeClick,
            shakeDps,
            shakeMorte,
            shakeChefe,
            shakeLend,
            shakeLevelUp,

            // Leitura do offset (para aplicar manualmente)
            get offsetX()       { return _offsetX; },
            get offsetY()       { return _offsetY; },
            get shakesAtivos()  { return _filaShake.length; },
            get TIPOS()         { return TIPOS_SHAKE; }
        };

    })(); // fim batalha

    // ════════════════════════════════════════
    // ATUALIZAR GERAL
    // Chamado 1x por frame no loop principal
    // ════════════════════════════════════════

    let _ultimoTempo = performance.now();

    /**
     * Atualiza tanto a câmera de lobby quanto a de batalha.
     * Deve ser chamado no início de cada frame do loop.
     *
     * @param {boolean} emBatalha — modo atual do jogo
     */
    function atualizar(emBatalha) {
        const agora = performance.now();
        const dt    = Math.min(agora - _ultimoTempo, 50); // cap em 50ms (tab inativa)
        _ultimoTempo = agora;

        if (emBatalha) {
            batalha.atualizar(dt);
        } else {
            lobby.atualizar();
        }
    }

    // ════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════

    /**
     * Inicializa a câmera do lobby centrada no mapa.
     * Chamado em main.js após o DOM estar pronto.
     */
    function inicializar() {
        lobby.centralizarMapa(false);
        _log.debug(
            `Camera inicializada.` +
            ` Mapa: ${_MAP_W}x${_MAP_H} tiles` +
            ` (${_MAPA_PX_W()}x${_MAPA_PX_H()}px).`
        );
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // Shake automático sem acoplar com battle.js
    // ════════════════════════════════════════
    try {
        EventBus.on("kill:registrado",          ({ chefe } = {}) => {
            chefe ? batalha.shakeChefe() : batalha.shakeMorte();
        });
        EventBus.on("damage:click",             ()  => batalha.shakeClick());
        EventBus.on("damage:dps",               ()  => batalha.shakeDps());
        EventBus.on("nivel:up",                 ()  => batalha.shakeLevelUp());
        EventBus.on("gacha:pull:lendario",      ()  => batalha.shakeLend());
    } catch {
        _log.warn("EventBus não disponível — shakes automáticos desativados.");
    }

    // ════════════════════════════════════════
    // UTILITÁRIOS INTERNOS
    // ════════════════════════════════════════
    function _lerp(a, b, t)        { return a + (b - a) * t; }
    function _clamp(v, min, max)   { return Math.max(min, Math.min(max, v)); }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        lobby,
        batalha,
        atualizar,
        inicializar,

        // Tile size (útil para renderers)
        get TILE()  { return _TILE;  },
        get MAP_W() { return _MAP_W; },
        get MAP_H() { return _MAP_H; }
    });

})();
window.Camera = Camera; // ← adiciona essa
