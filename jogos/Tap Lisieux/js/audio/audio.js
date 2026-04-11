// ═══════════════════════════════════════════════════════
//  AUDIO.JS
//  Sistema de áudio completo via Web Audio API:
//  - Síntese procedural (sem arquivos externos)
//  - Efeitos sonoros: clique, kill, level up, lendário,
//    upgrade, prestígio, gacha, combo, boss, UI
//  - Música de fundo generativa (osciladores + LFO)
//  - Volume separado para música e SFX
//  - Fade in/out suave na música
//  - AudioContext lazy (cria só ao primeiro som)
//  - Mudo global + mudo por canal
//  - Pool de nós para evitar clipping
//  - Suspende quando aba fica oculta
//
//  Depende de: event-bus.js
//  Usado por: main.js (via EventBus)
// ═══════════════════════════════════════════════════════

"use strict";

const Audio = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("Audio"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Volume default (0~1)
        VOL_MUSICA_DEFAULT : 0.35,
        VOL_SFX_DEFAULT    : 0.60,

        // Música
        MUSICA_FADE_MS     : 1200,
        MUSICA_BPM         : 90,

        // SFX — duração máxima de nós simultâneos
        MAX_NOS_SIMULTANEOS: 12,

        // Notas musicais (Hz) — escala de Dó maior
        NOTAS: Object.freeze({
            C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
            G3: 196.00, A3: 220.00, B3: 246.94,
            C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
            G4: 392.00, A4: 440.00, B4: 493.88,
            C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
        }),
    });

    // ════════════════════════════════════════════════════
    // ESTADO
    // ════════════════════════════════════════════════════
    let _ctx          = null;    // AudioContext (lazy)
    let _masterGain   = null;
    let _musicaGain   = null;
    let _sfxGain      = null;
    let _compressor   = null;

    let _volMusica    = CFG.VOL_MUSICA_DEFAULT;
    let _volSfx       = CFG.VOL_SFX_DEFAULT;
    let _mudo         = false;
    let _mudoMusica   = false;
    let _mudoSfx      = false;

    let _musicaAtiva  = false;
    let _musicaNos    = [];      // osciladores da música generativa
    let _nosAtivos    = 0;       // contador de SFX simultâneos

    let _inicializado = false;

    // ════════════════════════════════════════════════════
    // LAZY INIT DO AudioContext
    // Navegadores exigem gesto do usuário para criar
    // ════════════════════════════════════════════════════
    function _garantirCtx() {
        if (_ctx) return true;

        try {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Compressor master — evita clipping
            _compressor              = _ctx.createDynamicsCompressor();
            _compressor.threshold.value = -18;
            _compressor.knee.value      =  8;
            _compressor.ratio.value     =  4;
            _compressor.attack.value    =  0.004;
            _compressor.release.value   =  0.25;
            _compressor.connect(_ctx.destination);

            // Master gain
            _masterGain       = _ctx.createGain();
            _masterGain.gain.value = _mudo ? 0 : 1;
            _masterGain.connect(_compressor);

            // Canal música
            _musicaGain       = _ctx.createGain();
            _musicaGain.gain.value = _mudoMusica ? 0 : _volMusica;
            _musicaGain.connect(_masterGain);

            // Canal SFX
            _sfxGain          = _ctx.createGain();
            _sfxGain.gain.value = _mudoSfx ? 0 : _volSfx;
            _sfxGain.connect(_masterGain);

            _log.info(`AudioContext criado (sample rate: ${_ctx.sampleRate}Hz)`);
            return true;

        } catch(e) {
            _log.warn("Web Audio API não disponível:", e);
            return false;
        }
    }

    function _resumirCtx() {
        if (_ctx?.state === "suspended") {
            _ctx.resume().catch(_=>_);
        }
    }

    // ════════════════════════════════════════════════════
    // HELPER — criar oscilador simples
    // ════════════════════════════════════════════════════
    function _oscilador(freq, tipo, gain, duracao, destino, inicio = 0) {
        if (!_ctx) return null;
        if (_nosAtivos >= CFG.MAX_NOS_SIMULTANEOS) return null;

        const agora = _ctx.currentTime + inicio;

        const osc  = _ctx.createOscillator();
        const amp  = _ctx.createGain();

        osc.type          = tipo;
        osc.frequency.setValueAtTime(freq, agora);

        amp.gain.setValueAtTime(0, agora);
        amp.gain.linearRampToValueAtTime(gain,  agora + 0.005);
        amp.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);

        osc.connect(amp);
        amp.connect(destino ?? _sfxGain);

        osc.start(agora);
        osc.stop(agora + duracao + 0.01);

        _nosAtivos++;
        osc.onended = () => { _nosAtivos = Math.max(0, _nosAtivos - 1); };

        return osc;
    }

    /** Cria ruído branco */
    function _ruido(duracao, gain, destino) {
        if (!_ctx) return;

        const sampleRate  = _ctx.sampleRate;
        const frameCount  = Math.ceil(sampleRate * duracao);
        const buffer      = _ctx.createBuffer(1, frameCount, sampleRate);
        const data        = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const source = _ctx.createBufferSource();
        source.buffer = buffer;

        const amp   = _ctx.createGain();
        const agora = _ctx.currentTime;
        amp.gain.setValueAtTime(gain, agora);
        amp.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);

        // Filtro passa-baixa para suavizar
        const filtro       = _ctx.createBiquadFilter();
        filtro.type        = "lowpass";
        filtro.frequency.value = 800;

        source.connect(filtro);
        filtro.connect(amp);
        amp.connect(destino ?? _sfxGain);
        source.start();
        source.stop(agora + duracao);
    }

    // ════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════
    // SFX — EFEITOS SONOROS PROCEDURAIS
    // ════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════

    // ── Click / Toque ────────────────────────────────────
    function sfxClick() {
        if (!_garantirCtx()) return;
        _resumirCtx();
        const N = CFG.NOTAS;
        _oscilador(N.C5, "sine",     0.18, 0.06);
        _oscilador(N.E5, "sine",     0.10, 0.04, null, 0.01);
    }

    // ── Dano crítico ─────────────────────────────────────
    function sfxCritico() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.G5, "sawtooth", 0.15, 0.12);
        _oscilador(N.E5, "square",   0.08, 0.10, null, 0.02);
        _ruido(0.06, 0.04);
    }

    // ── Inimigo morreu ───────────────────────────────────
    function sfxKill() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Descida cromática rápida
        [N.E4, N.D4, N.C4].forEach((freq, i) => {
            _oscilador(freq, "sawtooth", 0.18, 0.08, null, i * 0.04);
        });
        _ruido(0.12, 0.06);
    }

    // ── Chefe morreu ─────────────────────────────────────
    function sfxBossKill() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Fanfarra descendente
        [N.G4, N.E4, N.C4, N.G3].forEach((freq, i) => {
            _oscilador(freq, "square",  0.20, 0.14, null, i * 0.07);
        });
        [N.G4, N.C4].forEach((freq, i) => {
            _oscilador(freq, "sine",    0.12, 0.22, null, 0.28 + i * 0.04);
        });
        _ruido(0.18, 0.08);
    }

    // ── Level up ─────────────────────────────────────────
    function sfxLevelUp() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Fanfarra ascendente
        [N.C4, N.E4, N.G4, N.C5].forEach((freq, i) => {
            _oscilador(freq, "sine",    0.22, 0.18, null, i * 0.08);
        });
        _oscilador(N.C5, "sine",       0.28, 0.40, null, 0.32);
    }

    // ── Upgrade comprado ─────────────────────────────────
    function sfxUpgrade() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.C4, "sine",    0.15, 0.08);
        _oscilador(N.G4, "sine",    0.18, 0.12, null, 0.06);
    }

    // ── Prestígio ────────────────────────────────────────
    function sfxPrestigio() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Glissando ascendente + sino
        for (let i = 0; i < 8; i++) {
            const freq = N.C4 * Math.pow(2, i / 12);
            _oscilador(freq, "sine", 0.12, 0.18, null, i * 0.06);
        }
        _oscilador(N.C5, "sine",   0.30, 0.60, null, 0.48);
        _oscilador(N.G5, "sine",   0.20, 0.50, null, 0.52);
    }

    // ── Gacha pull ───────────────────────────────────────
    function sfxGacha() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.C4, "triangle", 0.14, 0.10);
        _oscilador(N.E4, "triangle", 0.14, 0.10, null, 0.06);
        _oscilador(N.G4, "triangle", 0.18, 0.14, null, 0.12);
    }

    // ── Lendário ─────────────────────────────────────────
    function sfxLendario() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Fanfarra épica em 3 camadas
        [N.C4, N.E4, N.G4, N.C5, N.E5].forEach((freq, i) => {
            _oscilador(freq, "sine",     0.22, 0.30, null, i * 0.07);
        });
        [N.C4, N.G4, N.C5].forEach((freq, i) => {
            _oscilador(freq, "triangle", 0.15, 0.50, null, 0.35 + i * 0.05);
        });
        _oscilador(N.C5, "sine",         0.30, 0.80, null, 0.65);
        _ruido(0.08, 0.05);
    }

    // ── Combo ────────────────────────────────────────────
    function sfxCombo(nivel = 1) {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        // Pitch sobe com o combo
        const escala  = [N.C4, N.D4, N.E4, N.F4, N.G4, N.A4, N.B4, N.C5];
        const idx     = Math.min(nivel - 1, escala.length - 1);
        _oscilador(escala[idx], "square", 0.15, 0.07);
    }

    // ── Moeda coletada ───────────────────────────────────
    function sfxMoeda() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.G4, "sine", 0.10, 0.06);
        _oscilador(N.C5, "sine", 0.12, 0.08, null, 0.04);
    }

    // ── Conquista desbloqueada ───────────────────────────
    function sfxConquista() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        [N.C4, N.E4, N.G4, N.C5].forEach((freq, i) => {
            _oscilador(freq, "sine", 0.16, 0.20, null, i * 0.06);
        });
        _oscilador(N.C5, "triangle", 0.20, 0.35, null, 0.24);
    }

    // ── Quest concluída ──────────────────────────────────
    function sfxQuest() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        [N.C4, N.G4].forEach((freq, i) => {
            _oscilador(freq, "sine", 0.15, 0.18, null, i * 0.10);
        });
        _oscilador(N.C5, "sine", 0.18, 0.22, null, 0.20);
    }

    // ── Erro / sem dinheiro ──────────────────────────────
    function sfxErro() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.A3, "sawtooth", 0.15, 0.10);
        _oscilador(N.G3, "sawtooth", 0.12, 0.10, null, 0.06);
    }

    // ── UI: abrir modal ──────────────────────────────────
    function sfxModalAbrir() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.C4, "sine", 0.08, 0.08);
        _oscilador(N.E4, "sine", 0.08, 0.08, null, 0.05);
    }

    // ── UI: fechar modal ─────────────────────────────────
    function sfxModalFechar() {
        if (!_garantirCtx()) return;
        const N = CFG.NOTAS;
        _oscilador(N.E4, "sine", 0.07, 0.07);
        _oscilador(N.C4, "sine", 0.07, 0.07, null, 0.05);
    }

    // ── Hover em botão ───────────────────────────────────
    function sfxHover() {
        if (!_garantirCtx()) return;
        _oscilador(CFG.NOTAS.C5, "sine", 0.03, 0.03);
    }

    // ════════════════════════════════════════════════════
    // MÚSICA GENERATIVA
    // Melodia procedural baseada em arpejo de Dó maior
    // ════════════════════════════════════════════════════

    const _musicaState = {
        tocando      : false,
        fadeTimer    : null,
        sequencia    : null,
        passoAtual   : 0,
        intervalId   : null,
    };

    // Progressão de acordes: C - Am - F - G (loop)
    const _ACORDES = [
        [CFG.NOTAS.C3, CFG.NOTAS.E3, CFG.NOTAS.G3],   // C
        [CFG.NOTAS.A3, CFG.NOTAS.C4, CFG.NOTAS.E4],   // Am
        [CFG.NOTAS.F3, CFG.NOTAS.A3, CFG.NOTAS.C4],   // F
        [CFG.NOTAS.G3, CFG.NOTAS.B3, CFG.NOTAS.D4],   // G
    ];

    const _MELODIA = [
        CFG.NOTAS.C4, CFG.NOTAS.E4, CFG.NOTAS.G4, CFG.NOTAS.E4,
        CFG.NOTAS.D4, CFG.NOTAS.F4, CFG.NOTAS.A4, CFG.NOTAS.F4,
        CFG.NOTAS.C4, CFG.NOTAS.E4, CFG.NOTAS.G4, CFG.NOTAS.C5,
        CFG.NOTAS.G4, CFG.NOTAS.F4, CFG.NOTAS.E4, CFG.NOTAS.D4,
    ];

    function _tocarPassoMusica() {
        if (!_ctx || !_musicaState.tocando) return;

        const beat       = _musicaState.passoAtual;
        const acordeIdx  = Math.floor(beat / 4) % _ACORDES.length;
        const acorde     = _ACORDES[acordeIdx];
        const notaMelod  = _MELODIA[beat % _MELODIA.length];

        // Baixo (primeiro compasso de cada acorde)
        if (beat % 4 === 0) {
            _oscilador(acorde[0] / 2, "sine",     0.10, 0.45, _musicaGain);
        }

        // Arpejo médio
        const arpNota = acorde[beat % acorde.length];
        _oscilador(arpNota,     "triangle", 0.06, 0.22, _musicaGain);

        // Melodia principal (mais suave)
        _oscilador(notaMelod,   "sine",     0.07, 0.28, _musicaGain);

        // Pad harmônico (só no início de cada acorde)
        if (beat % 4 === 0) {
            acorde.forEach(freq => {
                _oscilador(freq * 2, "sine", 0.03, 0.80, _musicaGain);
            });
        }

        _musicaState.passoAtual++;
    }

    function iniciarMusica() {
        if (!_garantirCtx()) return;
        if (_musicaState.tocando) return;
        _resumirCtx();

        _musicaState.tocando   = true;
        _musicaState.passoAtual = 0;

        // Fade in
        const agora = _ctx.currentTime;
        _musicaGain.gain.cancelScheduledValues(agora);
        _musicaGain.gain.setValueAtTime(0, agora);
        _musicaGain.gain.linearRampToValueAtTime(
            _mudoMusica ? 0 : _volMusica,
            agora + CFG.MUSICA_FADE_MS / 1000
        );

        // Intervalo = 1 beat
        const beatMs = (60 / CFG.MUSICA_BPM) * 1000;
        _musicaState.intervalId = setInterval(_tocarPassoMusica, beatMs);

        _log.debug("Música iniciada.");
    }

    function pararMusica(fadeOut = true) {
        if (!_musicaState.tocando) return;

        _musicaState.tocando = false;
        clearInterval(_musicaState.intervalId);
        _musicaState.intervalId = null;

        if (!_ctx) return;

        if (fadeOut) {
            const agora = _ctx.currentTime;
            _musicaGain.gain.cancelScheduledValues(agora);
            _musicaGain.gain.setValueAtTime(_musicaGain.gain.value, agora);
            _musicaGain.gain.linearRampToValueAtTime(0, agora + CFG.MUSICA_FADE_MS / 1000);
        }

        _log.debug("Música parada.");
    }

    // ════════════════════════════════════════════════════
    // VOLUME
    // ════════════════════════════════════════════════════
    function setVolume(musica, sfx) {
        if (typeof musica === "number") setMusicaVolume(musica);
        if (typeof sfx    === "number") setSfxVolume(sfx);
    }

    function setMusicaVolume(v) {
        _volMusica = Math.max(0, Math.min(1, v));
        if (!_musicaGain || _mudoMusica) return;

        const agora = _ctx?.currentTime ?? 0;
        _musicaGain.gain.cancelScheduledValues(agora);
        _musicaGain.gain.setValueAtTime(_musicaGain.gain.value, agora);
        _musicaGain.gain.linearRampToValueAtTime(_volMusica, agora + 0.05);
    }

    function setSfxVolume(v) {
        _volSfx = Math.max(0, Math.min(1, v));
        if (!_sfxGain || _mudoSfx) return;

        const agora = _ctx?.currentTime ?? 0;
        _sfxGain.gain.setValueAtTime(_volSfx, agora);
    }

    // ════════════════════════════════════════════════════
    // MUDO
    // ════════════════════════════════════════════════════
    function setMudo(mudo) {
        _mudo = mudo;
        if (!_masterGain) return;

        const agora = _ctx?.currentTime ?? 0;
        _masterGain.gain.cancelScheduledValues(agora);
        _masterGain.gain.setValueAtTime(_masterGain.gain.value, agora);
        _masterGain.gain.linearRampToValueAtTime(mudo ? 0 : 1, agora + 0.05);
    }

    function toggleMudo() { setMudo(!_mudo); return _mudo; }

    function setMudoMusica(mudo) {
        _mudoMusica = mudo;
        if (!_musicaGain || !_ctx) return;

        const agora = _ctx.currentTime;
        _musicaGain.gain.cancelScheduledValues(agora);
        _musicaGain.gain.setValueAtTime(_musicaGain.gain.value, agora);
        _musicaGain.gain.linearRampToValueAtTime(
            mudo ? 0 : _volMusica,
            agora + 0.08
        );
    }

    function setMudoSfx(mudo) {
        _mudoSfx = mudo;
        if (!_sfxGain || !_ctx) return;

        const agora = _ctx.currentTime;
        _sfxGain.gain.setValueAtTime(mudo ? 0 : _volSfx, agora);
    }

    // ════════════════════════════════════════════════════
    // EVENTBUS — reage a eventos do jogo
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // ── Batalha ──
            EventBus.on("damage:click",        () => sfxClick());
            EventBus.on("damage:critico",      () => sfxCritico());

            EventBus.on("kill:registrado",     ({ chefe }) => {
                chefe ? sfxBossKill() : sfxKill();
            });

            EventBus.on("nivel:up",            () => sfxLevelUp());
            EventBus.on("upgrade:comprado",    () => sfxUpgrade());
            EventBus.on("prestigio:feito",     () => sfxPrestigio());

            // ── Combo ──
            EventBus.on("combo:atualizado",    ({ combo }) => {
                if (combo >= 3) sfxCombo(combo);
            });

            // ── Gacha ──
            EventBus.on("gacha:pull",          ({ lend }) => {
                if (lend > 0) sfxLendario();
                else          sfxGacha();
            });
            EventBus.on("gacha:pull:lendario", () => sfxLendario());

            // ── Moedas / Gemas ──
            EventBus.on("kill:registrado",     () => sfxMoeda());

            // ── Conquistas / Missões ──
            EventBus.on("conquista:desbloqueada", () => sfxConquista());
            EventBus.on("quest:coletada",          () => sfxQuest());

            // ── Erros ──
            EventBus.on("economia:semSaldo",   () => sfxErro());
            EventBus.on("gacha:semGema",       () => sfxErro());

            // ── UI ──
            EventBus.on("modal:aberto",        () => sfxModalAbrir());
            EventBus.on("modal:fechado",       () => sfxModalFechar());

            // ── Música ──
            EventBus.on("batalha:iniciou",     () => iniciarMusica());
            EventBus.on("batalha:saiu",        () => {
                pararMusica();
                // Religa no lobby (tom mais suave)
                setTimeout(() => {
                    if (!_emBatalha()) iniciarMusica();
                }, CFG.MUSICA_FADE_MS + 200);
            });

            // ── Config ──
            EventBus.on("config:atualizada",   ({ volumeMusica, volumeSfx }) => {
                if (typeof volumeMusica === "number") setMusicaVolume(volumeMusica);
                if (typeof volumeSfx    === "number") setSfxVolume(volumeSfx);
            });

            // ── Visibilidade ──
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    _ctx?.suspend();
                } else {
                    _ctx?.resume();
                }
            });

            // ── Primeiro gesto do usuário ──
            // AudioContext precisa ser criado/retomado após interação
            const _primeiroGesto = () => {
                if (_ctx?.state === "suspended") _ctx.resume();
                document.removeEventListener("click",     _primeiroGesto);
                document.removeEventListener("touchstart",_primeiroGesto);
                document.removeEventListener("keydown",   _primeiroGesto);
            };
            document.addEventListener("click",      _primeiroGesto, { once: true });
            document.addEventListener("touchstart", _primeiroGesto, { once: true });
            document.addEventListener("keydown",    _primeiroGesto, { once: true });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    function _emBatalha() {
        try   { return GameState.get("emBatalha") === true; }
        catch { return false; }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        if (_inicializado) return;
        _inicializado = true;

        // Carrega preferências salvas
        try {
            _volMusica = GameState.get("volumeMusica") ?? CFG.VOL_MUSICA_DEFAULT;
            _volSfx    = GameState.get("volumeSfx")    ?? CFG.VOL_SFX_DEFAULT;
        } catch(_) {}

        _registrarEventos();

        // Inicia música no lobby após curto delay
        setTimeout(() => iniciarMusica(), 800);

        _log.info("Audio inicializado (Web Audio API — síntese procedural).");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            ctxEstado    : _ctx?.state ?? "não criado",
            sampleRate   : _ctx?.sampleRate ?? 0,
            nosAtivos    : _nosAtivos,
            musicaTocando: _musicaState.tocando,
            passoMusical : _musicaState.passoAtual,
            volMusica    : _volMusica,
            volSfx       : _volSfx,
            mudo         : _mudo,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,

        // Música
        iniciarMusica,
        pararMusica,

        // SFX
        sfxClick,
        sfxCritico,
        sfxKill,
        sfxBossKill,
        sfxLevelUp,
        sfxUpgrade,
        sfxPrestigio,
        sfxGacha,
        sfxLendario,
        sfxCombo,
        sfxMoeda,
        sfxConquista,
        sfxQuest,
        sfxErro,
        sfxModalAbrir,
        sfxModalFechar,
        sfxHover,

        // Volume
        setVolume,
        setMusicaVolume,
        setSfxVolume,

        // Mudo
        setMudo,
        toggleMudo,
        setMudoMusica,
        setMudoSfx,

        // Estado
        get mudo()         { return _mudo;               },
        get volMusica()    { return _volMusica;           },
        get volSfx()       { return _volSfx;              },
        get musicaTocando(){ return _musicaState.tocando; },

        stats,
    });

})();
