// ═══════════════════════════════════════════════════════════
//  BATTLE.JS
//  Controlador central da batalha.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, a lógica de batalha estava espalhada
//  em game-batalha.js misturada com renderização. iniciarBatalha()
//  manipulava o DOM diretamente, matarInimigo() calculava
//  recompensas inline, e não havia máquina de estados.
//
//  SOLUÇÃO:
//  Controlador puro de lógica — sem tocar no DOM, sem canvas.
//  Usa uma máquina de estados explícita para garantir que
//  transições impossíveis sejam bloqueadas.
//
//  MÁQUINA DE ESTADOS:
//  ┌──────────────┐   iniciar()  ┌──────────────┐
//  │   LOBBY      │ ───────────► │  INICIANDO   │
//  └──────────────┘              └──────┬───────┘
//         ▲                            │ (assets prontos)
//         │                            ▼
//         │             ┌──────────────────────────┐
//    sair()│             │        EM_BATALHA        │
//         │             │  (loop de kills/estágios) │
//         │             └──────────┬───┬───────────┘
//         │                        │   │
//         │           kill()       │   │ irEstagio()
//         │           avançar()    ▼   ▼ irChefe()
//         │             ┌──────────────────────────┐
//         │             │    AVANÇANDO_ESTAGIO      │
//         │             └──────────────────────────┘
//         │
//         └──────────── sair() de qualquer estado ativo
//
//  FLUXO DE KILL:
//  1. Enemy.receberDano() → hp ≤ 0 → Enemy.matar()
//  2. EventBus emite "kill:registrado"
//  3. Battle ouve → Economy.ganhar(moeda/gema)
//  4. Battle ouve → Experience.ganhar(xp)
//  5. Battle ouve → avançar estágio
//  6. Enemy.configurar(novoEstagio)
//  7. Effects.criarMoedas() e Effects.dispararFlores()
//  8. Achievements.verificar()
//
//  API:
//    Battle.iniciar()              → inicia batalha
//    Battle.sair()                 → volta ao lobby
//    Battle.irEstagio(n)           → vai para estágio N
//    Battle.irEstagioAnterior()    → estágio - 1
//    Battle.irProximoEstagio()     → estágio + 1
//    Battle.irParaChefe()          → próximo chefe
//    Battle.prestigiar()           → prestige (se elegível)
//    Battle.estado()               → estado atual da máquina
//    Battle.estagio()              → estágio atual
//    Battle.podePrestígiar()       → boolean
//    Battle.infoAtual()            → objeto completo para UI
//
//  Depende de: constants.js, state.js, event-bus.js,
//              enemy.js, damage.js, economy.js, logger.js,
//              experience.js, combo.js
//  Usado por: main.js, input.js, ui-battle.js, prestige.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Battle = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Battle"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Battle]",  ...a),
            error : (...a) => console.error("[Battle]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // MÁQUINA DE ESTADOS
    // ════════════════════════════════════════
    const ESTADO = Object.freeze({
        LOBBY              : "LOBBY",
        INICIANDO          : "INICIANDO",
        EM_BATALHA         : "EM_BATALHA",
        AVANCANDO_ESTAGIO  : "AVANCANDO_ESTAGIO",
        PAUSADO            : "PAUSADO",
        SAINDO             : "SAINDO"
    });

    let _estadoAtual = ESTADO.LOBBY;

    // Transições válidas
    const _TRANSICOES = Object.freeze({
        [ESTADO.LOBBY]             : [ESTADO.INICIANDO],
        [ESTADO.INICIANDO]         : [ESTADO.EM_BATALHA, ESTADO.LOBBY],
        [ESTADO.EM_BATALHA]        : [ESTADO.AVANCANDO_ESTAGIO, ESTADO.PAUSADO, ESTADO.SAINDO],
        [ESTADO.AVANCANDO_ESTAGIO] : [ESTADO.EM_BATALHA, ESTADO.SAINDO],
        [ESTADO.PAUSADO]           : [ESTADO.EM_BATALHA, ESTADO.SAINDO],
        [ESTADO.SAINDO]            : [ESTADO.LOBBY]
    });

    function _transicionar(novoEstado) {
        const permitidos = _TRANSICOES[_estadoAtual] ?? [];
        if (!permitidos.includes(novoEstado)) {
            _log.warn(
                `Transição inválida: ${_estadoAtual} → ${novoEstado}.` +
                ` Permitidos: [${permitidos.join(", ")}]`
            );
            return false;
        }
        _log.debug(`Estado: ${_estadoAtual} → ${novoEstado}`);
        _estadoAtual = novoEstado;
        return true;
    }

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        ESTAGIO_MIN          : 1,
        ESTAGIO_PRESTIGIO    : 60,    // estágio mínimo para prestigiar
        DELAY_AVANCAR_MS     : 300,   // delay entre kill e próximo inimigo
        DPS_INTERVALO_MS     : 1000,  // ms entre ticks de DPS
        FALA_INTERVALO_MS    : 8000,  // ms entre tentativas de fala
        KILLS_POR_ESTAGIO    : 1,     // kills necessários para avançar (futura expansão)
        MAX_ESTAGIO_PULO     : 100,   // limite de pulo manual de estágio
    });

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════
    let _estagio      = 1;
    let _killsEstagio = 0;   // kills no estágio atual (para multi-kill futuramente)

    // Timers internos
    let _timerDps     = null;
    let _timerFala    = null;
    let _timerAvancar = null;

    // Estatísticas da sessão de batalha
    const _stats = {
        totalKillsSessao  : 0,
        totalEstagiosSessao: 0,
        chefesVencidos    : 0,
        elitesVencidos    : 0,
        tempoInicioMs     : 0,
        moedasGanhasSessao: 0,
        gemasGanhasSessao : 0
    };

    // ════════════════════════════════════════
    // INICIAR BATALHA
    // ════════════════════════════════════════

    /**
     * Inicia a batalha a partir do lobby.
     * Configura UI, inimigo e loops de DPS/Fala.
     *
     * @returns {boolean} — true se iniciou com sucesso
     */
    function iniciar() {
        if (!_transicionar(ESTADO.INICIANDO)) return false;

        _log.info(`Iniciando batalha — Estágio ${_estagio}`);

        // Restaura estágio do GameState (se houver save)
        try {
            const estagioSalvo = GameState.get("estagio");
            if (estagioSalvo && estagioSalvo >= CFG.ESTAGIO_MIN) {
                _estagio = estagioSalvo;
            }
        } catch { /* usa valor atual */ }

        // Reseta estado de sessão
        _killsEstagio = 0;
        _stats.tempoInicioMs     = Date.now();
        _stats.totalKillsSessao  = 0;
        _stats.totalEstagiosSessao = 0;
        _stats.moedasGanhasSessao = 0;
        _stats.gemasGanhasSessao  = 0;

        // Atualiza GameState
        try {
            GameState.set("emBatalha", true);
            GameState.set("estagio",   _estagio);
        } catch { /* não crítico */ }

        // Configura o primeiro inimigo
        try {
            Enemy.configurar(_estagio);
        } catch (e) {
            _log.error("iniciar(): Enemy.configurar falhou:", e);
            _transicionar(ESTADO.LOBBY);
            return false;
        }

        // Inicia loops
        _iniciarTimers();

        // Transição para EM_BATALHA
        _transicionar(ESTADO.EM_BATALHA);

        _log.info(`Batalha iniciada — Estágio ${_estagio}`);

        // Emite evento
        try {
            EventBus.emit("batalha:iniciou", {
                estagio : _estagio,
                chefe   : Enemy.ehChefe(_estagio)
            });
        } catch { /* não crítico */ }

        return true;
    }

    // ════════════════════════════════════════
    // SAIR DA BATALHA
    // ════════════════════════════════════════

    /**
     * Encerra a batalha e volta ao lobby.
     * Salva o progresso automaticamente.
     */
    function sair() {
        if (_estadoAtual === ESTADO.LOBBY) return;
        if (!_transicionar(ESTADO.SAINDO)) return;

        _log.info("Saindo da batalha...");

        // Para todos os timers
        _pararTimers();

        // Reseta combo
        try { ComboSystem.resetar(); } catch { /* não crítico */ }

        // Reseta estado de sessão no GameState
        try {
            GameState.set("emBatalha",        false);
            GameState.set("hitStateTremendo", 0);
            GameState.set("hitStateFlash",    0);
            GameState.set("falaAtiva",        false);
        } catch { /* não crítico */ }

        // Salva progresso
        try { SaveSystem.salvar(); } catch { /* não crítico */ }

        _transicionar(ESTADO.LOBBY);

        _log.info(
            `Batalha encerrada.` +
            ` Kills: ${_stats.totalKillsSessao}` +
            ` | Estágios: ${_stats.totalEstagiosSessao}` +
            ` | +${_fmt(_stats.moedasGanhasSessao)}🪙`
        );

        try {
            EventBus.emit("batalha:saiu", {
                estagio : _estagio,
                stats   : { ..._stats }
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // TIMERS INTERNOS
    // ════════════════════════════════════════
    function _iniciarTimers() {
        _pararTimers(); // garante que não há duplicatas

        // Timer de DPS
        _timerDps = setInterval(() => {
            if (_estadoAtual !== ESTADO.EM_BATALHA) return;
            try { Damage.aplicarDps(); } catch { /* não crítico */ }
        }, CFG.DPS_INTERVALO_MS);

        // Timer de falas do inimigo
        _timerFala = setInterval(() => {
            if (_estadoAtual !== ESTADO.EM_BATALHA) return;
            try { Enemy.falarAleatorio(); } catch { /* não crítico */ }
        }, CFG.FALA_INTERVALO_MS);
    }

    function _pararTimers() {
        if (_timerDps     !== null) { clearInterval(_timerDps);     _timerDps     = null; }
        if (_timerFala    !== null) { clearInterval(_timerFala);     _timerFala    = null; }
        if (_timerAvancar !== null) { clearTimeout(_timerAvancar);   _timerAvancar = null; }
    }

    // ════════════════════════════════════════
    // PROCESSAR KILL (via EventBus)
    // ════════════════════════════════════════
    function _onKill({ rMoeda = 0, rGema = 0, chefe = false, elite = false, estagio: e } = {}) {
        if (_estadoAtual !== ESTADO.EM_BATALHA) return;

        _stats.totalKillsSessao++;
        _killsEstagio++;

        if (chefe)  _stats.chefesVencidos++;
        if (elite)  _stats.elitesVencidos++;

        // Recompensas via Economy
        try {
            if (rMoeda > 0) {
                Economy.ganharComBonus("moeda", rMoeda, `kill:estagio${e}`);
                _stats.moedasGanhasSessao += rMoeda;
            }
            if (rGema > 0) {
                Economy.ganhar("gema", rGema, chefe ? "kill:chefe" : "kill:normal");
                _stats.gemasGanhasSessao += rGema;
            }
        } catch (err) {
            _log.error("_onKill(): Economy falhou:", err);
        }

        // Incrementa contador global de kills
        try { GameState.increment("totalKills"); } catch { /* não crítico */ }

        // Efeitos visuais via EventBus
        try {
            EventBus.emit("effects:moedas_caindo", {
                qtd : Math.min(5, 1 + Math.floor(rMoeda / 10)),
                x   : null   // renderer usa posição do monstro
            });
        } catch { /* não crítico */ }

        // Verifica conquistas
        try {
            EventBus.emit("conquistas:verificar");
        } catch { /* não crítico */ }

        // Avança estágio após delay
        if (_killsEstagio >= CFG.KILLS_POR_ESTAGIO) {
            _killsEstagio = 0;
            _timerAvancar = setTimeout(() => {
                _avancarEstagio();
            }, CFG.DELAY_AVANCAR_MS);
        }
    }

    // ════════════════════════════════════════
    // AVANÇAR ESTÁGIO (interno)
    // ════════════════════════════════════════
    function _avancarEstagio() {
        if (_estadoAtual !== ESTADO.EM_BATALHA) return;
        if (!_transicionar(ESTADO.AVANCANDO_ESTAGIO)) return;

        _estagio++;
        _stats.totalEstagiosSessao++;

        try { GameState.set("estagio", _estagio); } catch { /* não crítico */ }

        _log.info(`Estágio avançou → ${_estagio}${Enemy.ehChefe(_estagio) ? " 👿 CHEFE!" : ""}`);

        // Notifica chefe
        if (Enemy.ehChefeElite(_estagio)) {
            try { Toast.lendario(`⚡ ARQUIDEMÔNIO! Estágio ${_estagio}`); } catch { /* não crítico */ }
        } else if (Enemy.ehChefe(_estagio)) {
            try { Toast.aviso(`👿 CHEFE! Estágio ${_estagio}`); } catch { /* não crítico */ }
        }

        // Configura novo inimigo
        try {
            Enemy.configurar(_estagio);
        } catch (e) {
            _log.error("_avancarEstagio(): Enemy.configurar falhou:", e);
        }

        // Emite evento
        try {
            EventBus.emit("estagio:avancou", {
                estagio : _estagio,
                chefe   : Enemy.ehChefe(_estagio),
                elite   : Enemy.ehChefeElite(_estagio)
            });
        } catch { /* não crítico */ }

        _transicionar(ESTADO.EM_BATALHA);
    }

    // ════════════════════════════════════════
    // NAVEGAÇÃO MANUAL DE ESTÁGIO
    // ════════════════════════════════════════

    /**
     * Navega para um estágio específico.
     * Validado para não ultrapassar o máximo atingido.
     *
     * @param {number} n
     * @returns {boolean}
     */
    function irEstagio(n) {
        if (_estadoAtual !== ESTADO.EM_BATALHA) {
            _log.warn("irEstagio(): não está em batalha.");
            return false;
        }

        if (typeof n !== "number" || n < CFG.ESTAGIO_MIN) {
            _log.warn(`irEstagio(${n}): valor inválido.`);
            return false;
        }

        // Não pode pular mais de MAX_ESTAGIO_PULO estágios à frente
        const max = _estagio + CFG.MAX_ESTAGIO_PULO;
        const alvo = Math.min(n, max);

        if (alvo === _estagio) return false;

        _estagio      = Math.max(CFG.ESTAGIO_MIN, alvo);
        _killsEstagio = 0;

        try { GameState.set("estagio", _estagio); } catch { /* não crítico */ }
        try { Enemy.configurar(_estagio); } catch { /* não crítico */ }
        try { ComboSystem.resetar(); } catch { /* não crítico */ }

        _log.info(`Navegou para estágio ${_estagio}`);

        try {
            EventBus.emit("estagio:navegou", { estagio: _estagio, manual: true });
        } catch { /* não crítico */ }

        return true;
    }

    /**
     * Vai para o estágio anterior.
     * @returns {boolean}
     */
    function irEstagioAnterior() {
        return irEstagio(_estagio - 1);
    }

    /**
     * Vai para o próximo estágio (sem matar inimigo).
     * @returns {boolean}
     */
    function irProximoEstagio() {
        return irEstagio(_estagio + 1);
    }

    /**
     * Vai para o próximo chefe (múltiplo de 10).
     * @returns {boolean}
     */
    function irParaChefe() {
        const proximo = Math.ceil((_estagio + 1) / 10) * 10;
        return irEstagio(proximo);
    }

    /**
     * Vai para o próximo chefe élite (múltiplo de 50).
     * @returns {boolean}
     */
    function irParaElite() {
        const proximo = Math.ceil((_estagio + 1) / 50) * 50;
        return irEstagio(proximo);
    }

    // ════════════════════════════════════════
    // PAUSA
    // ════════════════════════════════════════

    /**
     * Pausa a batalha (DPS e falas param).
     * Útil ao abrir modais durante a batalha.
     */
    function pausar() {
        if (_estadoAtual !== ESTADO.EM_BATALHA) return;
        _transicionar(ESTADO.PAUSADO);
        _pararTimers();
        _log.debug("Batalha pausada.");

        try { EventBus.emit("batalha:pausada"); } catch { /* não crítico */ }
    }

    /**
     * Retoma a batalha após pausa.
     */
    function retomar() {
        if (_estadoAtual !== ESTADO.PAUSADO) return;
        _transicionar(ESTADO.EM_BATALHA);
        _iniciarTimers();
        _log.debug("Batalha retomada.");

        try { EventBus.emit("batalha:retomada"); } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // PRESTÍGIO
    // ════════════════════════════════════════

    /**
     * Verifica se o jogador pode prestigiar.
     * @returns {boolean}
     */
    function podePrestígiar() {
        return _estagio >= CFG.ESTAGIO_PRESTIGIO;
    }

    /**
     * Executa o prestígio se elegível.
     * Delega para Prestige.js toda a lógica de reset.
     *
     * @returns {boolean}
     */
    function prestigiar() {
        if (!podePrestígiar()) {
            _log.warn(
                `prestigiar(): requer estágio ${CFG.ESTAGIO_PRESTIGIO}.` +
                ` Atual: ${_estagio}.`
            );
            try {
                Toast.aviso(
                    `🌟 Alcance o estágio ${CFG.ESTAGIO_PRESTIGIO} para prestigiar!` +
                    ` (Atual: ${_estagio})`
                );
            } catch { /* não crítico */ }
            return false;
        }

        try {
            if (typeof Prestige !== "undefined") {
                return Prestige.executar();
            }
        } catch (e) {
            _log.error("prestigiar(): Prestige.executar() falhou:", e);
        }

        // Fallback se Prestige.js não estiver carregado
        _log.warn("prestigiar(): Prestige.js não disponível — executando fallback.");
        _executarPrestigioFallback();
        return true;
    }

    function _executarPrestigioFallback() {
        const totalAnt = (() => {
            try { return GameState.get("totalPrestígios") ?? 0; } catch { return 0; }
        })();

        _estagio      = CFG.ESTAGIO_MIN;
        _killsEstagio = 0;

        try { GameState.resetGrupo("run"); } catch { /* não crítico */ }
        try { GameState.set("estagio", _estagio); } catch { /* não crítico */ }
        try { GameState.increment("totalPrestígios"); } catch { /* não crítico */ }
        try { Upgrades.resetar(); } catch { /* não crítico */ }
        try { Economy._setDireto("moeda", 0); } catch { /* não crítico */ }
        try { Enemy.configurar(_estagio); } catch { /* não crítico */ }

        try {
            Toast.nivel("🌸 PRESTÍGIO! Recomeçando mais forte!");
        } catch { /* não crítico */ }

        try {
            EventBus.emit("prestigio:feito", {
                total     : totalAnt + 1,
                estagioMax: _estagio
            });
        } catch { /* não crítico */ }

        _log.info(`Prestígio #${totalAnt + 1} executado.`);
    }

    // ════════════════════════════════════════
    // LEITURA
    // ════════════════════════════════════════

    /** Estado atual da máquina. */
    function estado()        { return _estadoAtual;           }

    /** Estágio atual. */
    function estagio()       { return _estagio;               }

    /** True se está em batalha ativa (não pausado). */
    function emBatalha()     { return _estadoAtual === ESTADO.EM_BATALHA; }

    /** True se pausado. */
    function pausado()       { return _estadoAtual === ESTADO.PAUSADO; }

    /**
     * Objeto completo para a UI atualizar de uma vez.
     *
     * @returns {{
     *   estado, estagio, emBatalha, pausado,
     *   podePrestígiar, chefe, elite,
     *   nomeEstagio, inimigo, damage,
     *   stats
     * }}
     */
    function infoAtual() {
        const inimigo = (() => {
            try { return Enemy.infoAtual(); } catch { return null; }
        })();

        const damageInfo = (() => {
            try { return Damage.simular("click"); } catch { return null; }
        })();

        return {
            estado          : _estadoAtual,
            estagio         : _estagio,
            emBatalha       : emBatalha(),
            pausado         : pausado(),
            podePrestígiar  : podePrestígiar(),
            chefe           : Enemy.ehChefe(_estagio),
            elite           : Enemy.ehChefeElite(_estagio),
            nomeEstagio     : Enemy.nomeEstagio(_estagio),
            inimigo,
            damageClick     : damageInfo?.semCrit ?? 0,
            dps             : (() => { try { return Damage.calcDps(); } catch { return 0; } })(),
            stats           : { ..._stats }
        };
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas da sessão atual de batalha.
     */
    function stats() {
        const tempoMs = _stats.tempoInicioMs > 0
            ? Date.now() - _stats.tempoInicioMs
            : 0;

        const killsPorMin = tempoMs > 0
            ? (_stats.totalKillsSessao / (tempoMs / 60000)).toFixed(1)
            : "0";

        return {
            ..._stats,
            tempoSessaoMs   : tempoMs,
            tempoSessaoMin  : (tempoMs / 60000).toFixed(1),
            killsPorMinuto  : killsPorMin,
            estagioAtual    : _estagio,
            estadoMaquina   : _estadoAtual
        };
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Battle — Status", () => {
            const s = stats();
            _log.debug(`Estado         : ${_estadoAtual}`);
            _log.debug(`Estágio        : ${_estagio}`);
            _log.debug(`Chefe          : ${Enemy.ehChefe(_estagio)}`);
            _log.debug(`Pode prestigiar: ${podePrestígiar()}`);
            _log.debug(`Kills sessão   : ${s.totalKillsSessao}`);
            _log.debug(`Estágios sess. : ${s.totalEstagiosSessao}`);
            _log.debug(`Moedas sess.   : ${_fmt(s.moedasGanhasSessao)}`);
            _log.debug(`Tempo          : ${s.tempoSessaoMin}min`);
            _log.debug(`Kills/min      : ${s.killsPorMinuto}`);
        }, true);
    }

    // ════════════════════════════════════════
    // UTILITÁRIOS INTERNOS
    // ════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e9) return (n / 1e9).toFixed(1)  + "B";
            if (n >= 1e6) return (n / 1e6).toFixed(1)  + "M";
            if (n >= 1e3) return (n / 1e3).toFixed(1)  + "K";
            return String(Math.floor(n ?? 0));
        }
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS DO JOGO
    // ════════════════════════════════════════
    try {
        // Kill registrado pelo Enemy.js
        EventBus.on("kill:registrado", _onKill);

        // Pausa ao abrir modal
        EventBus.on("modal:aberto", () => {
            if (emBatalha()) pausar();
        });

        EventBus.on("modal:fechado", () => {
            if (pausado()) retomar();
        });

        // Prestígio externo (Prestige.js reseta e emite)
        EventBus.on("prestigio:feito", () => {
            _estagio      = CFG.ESTAGIO_MIN;
            _killsEstagio = 0;
            try { GameState.set("estagio", _estagio); } catch { /* não crítico */ }

            // Só reinicia o inimigo se estiver em batalha
            if (emBatalha() || pausado()) {
                try { Enemy.configurar(_estagio); } catch { /* não crítico */ }
            }
        });

        // Salvar ao fechar aba
        EventBus.on("app:visibilidade_oculta", () => {
            if (_estadoAtual !== ESTADO.LOBBY) {
                try { SaveSystem.salvar(); } catch { /* não crítico */ }
            }
        });

        // Reset total
        EventBus.on("state:reset:total", () => {
            _pararTimers();
            _estagio      = CFG.ESTAGIO_MIN;
            _killsEstagio = 0;
            _estadoAtual  = ESTADO.LOBBY;
        });

    } catch (e) {
        _log.warn("Falha ao registrar listeners:", e);
    }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Ciclo de vida
        iniciar,
        sair,
        pausar,
        retomar,

        // Navegação
        irEstagio,
        irEstagioAnterior,
        irProximoEstagio,
        irParaChefe,
        irParaElite,

        // Prestígio
        prestigiar,
        podePrestígiar,

        // Leitura
        estado,
        estagio,
        emBatalha,
        pausado,
        infoAtual,

        // Diagnóstico
        stats,
        logStatus,

        // Constantes (readonly)
        get ESTADO() { return ESTADO; },
        get CFG()    { return CFG;    }
    });

})();
