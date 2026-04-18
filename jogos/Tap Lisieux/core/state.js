// ═══════════════════════════════════════════════════════════════════════════
//  STATE.JS  v2.0.1 — CORRIGIDO
// ═══════════════════════════════════════════════════════════════════════════
"use strict";

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITÁRIOS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

const StateUtils = (() => {

    const SUFFIXES = [
        '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
        'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc',
        'NoDc', 'Vg', 'UVg'
    ];

    function formatBig(value) {
        if (typeof value === 'bigint') value = Number(value);
        if (value < 1000) return Math.floor(value).toString();
        const exp    = Math.floor(Math.log10(value) / 3);
        const suffix = SUFFIXES[exp] ?? `e${exp * 3}`;
        const scaled = value / Math.pow(1000, exp);
        return `${scaled.toFixed(2)}${suffix}`;
    }

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function expCurve(base, rate, level) {
        return base * Math.pow(rate, Math.max(0, level - 1));
    }

    function lerp(a, b, t) {
        return a + (b - a) * clamp(t, 0, 1);
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function createRng(seed) {
        let s = seed >>> 0;
        return function () {
            s += 0x6D2B79F5;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function now() { return Math.floor(Date.now() / 1000); }

    return { formatBig, clamp, expCurve, lerp, hashCode, createRng, now };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  ECONOMY
// ═══════════════════════════════════════════════════════════════════════════

const Economy = (() => {

    let _moeda      = CONFIG.MOEDA_INICIAL;
    let _gema       = CONFIG.GEMA_INICIAL;
    let _moedaTotal = CONFIG.MOEDA_INICIAL;
    let _gemaTotal  = CONFIG.GEMA_INICIAL;
    let _moedaGasta = 0;
    let _gemaGasta  = 0;

    const _historico = [];
    const MAX_HIST   = 50;

    function _registrar(tipo, valor, origem) {
        _historico.push({
            tipo, valor, origem,
            ts:   StateUtils.now(),
            snap: { moeda: _moeda, gema: _gema }
        });
        if (_historico.length > MAX_HIST) _historico.shift();
    }

    function _validarGanho(valor) {
        if (!isFinite(valor) || isNaN(valor) || valor < 0) return 0;
        return valor;
    }

    const _multiplicadores = { moeda: 1.0, gema: 1.0 };

    function setMultiplicador(tipo, valor) {
        if (!_multiplicadores.hasOwnProperty(tipo)) return;
        _multiplicadores[tipo] = Math.max(1, valor);
        EventBus.emit('economy:multiplicador', { tipo, valor });
    }

    return {
        get moeda()      { return _moeda;      },
        get gema()       { return _gema;       },
        get moedaTotal() { return _moedaTotal; },
        get gemaTotal()  { return _gemaTotal;  },
        get moedaGasta() { return _moedaGasta; },
        get gemaGasta()  { return _gemaGasta;  },
        get historico()  { return [..._historico]; },
        get moedaFmt()   { return StateUtils.formatBig(_moeda); },
        get gemaFmt()    { return StateUtils.formatBig(_gema);  },

        addMoeda(v, origem = 'unknown') {
            v = Math.floor(_validarGanho(v) * _multiplicadores.moeda);
            if (v <= 0) return;
            _moeda      += v;
            _moedaTotal += v;
            _registrar('add_moeda', v, origem);
            EventBus.emit('economy:moeda', { atual: _moeda, delta: v, origem });
        },

        spendMoeda(v, origem = 'unknown') {
            v = Math.floor(v);
            if (v <= 0 || _moeda < v) return false;
            _moeda      -= v;
            _moedaGasta += v;
            _registrar('spend_moeda', v, origem);
            EventBus.emit('economy:moeda', { atual: _moeda, delta: -v, origem });
            return true;
        },

        addGema(v, origem = 'unknown') {
            v = Math.floor(_validarGanho(v));
            if (v <= 0) return;
            _gema      += v;
            _gemaTotal += v;
            _registrar('add_gema', v, origem);
            EventBus.emit('economy:gema', { atual: _gema, delta: v, origem });
        },

        spendGema(v, origem = 'unknown') {
            v = Math.floor(v);
            if (v <= 0 || _gema < v) return false;
            _gema      -= v;
            _gemaGasta += v;
            _registrar('spend_gema', v, origem);
            EventBus.emit('economy:gema', { atual: _gema, delta: -v, origem });
            return true;
        },

        setMultiplicador,

        load(data) {
            _moeda      = data?.moeda      ?? CONFIG.MOEDA_INICIAL;
            _gema       = data?.gema       ?? CONFIG.GEMA_INICIAL;
            _moedaTotal = data?.moedaTotal ?? _moeda;
            _gemaTotal  = data?.gemaTotal  ?? _gema;
            _moedaGasta = data?.moedaGasta ?? 0;
            _gemaGasta  = data?.gemaGasta  ?? 0;
            EventBus.emit('economy:loaded', { moeda: _moeda, gema: _gema });
        },

        save() {
            return {
                moeda:      _moeda,
                gema:       _gema,
                moedaTotal: _moedaTotal,
                gemaTotal:  _gemaTotal,
                moedaGasta: _moedaGasta,
                gemaGasta:  _gemaGasta,
            };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  ENERGIA  — CORRIGIDO: get max() estava fora do return
// ═══════════════════════════════════════════════════════════════════════════

const Energia = (() => {

    let _atual     = CONFIG.ENERGIA_MAX;
    let _max       = CONFIG.ENERGIA_MAX;
    let _maxBonus  = 0;
    let _recargaMs = CONFIG.ENERGIA_RECARGA_MS;
    let _intervalId= null;

    const _boosts  = [];

    function _boostAtivo() {
        const agora = StateUtils.now();
        for (let i = _boosts.length - 1; i >= 0; i--) {
            if (_boosts[i].expiresAt <= agora) _boosts.splice(i, 1);
        }
        return _boosts.reduce((acc, b) => acc * b.multiplicador, 1.0);
    }

    // ✅ CORRIGIDO: _getMax() como função normal em vez de get fora do return
    function _getMax() { return _max + _maxBonus; }

    function _emitUpdate() {
        const maxAtual = _getMax();
        EventBus.emit('energia:update', {
            atual:  _atual,
            max:    maxAtual,
            pct:    _atual / maxAtual,
            cheia:  _atual >= maxAtual,
            boost:  _boostAtivo(),
        });
    }

    function _tick() {
        const maxAtual = _getMax();
        if (_atual >= maxAtual) return;
        _atual = Math.min(maxAtual, _atual + _boostAtivo());
        _emitUpdate();
    }

    function _startTimer() {
        if (_intervalId) clearInterval(_intervalId);
        _intervalId = setInterval(_tick, _recargaMs);
    }

    _startTimer();

    function recuperarOffline(segundos) {
        const maxAtual     = _getMax();
        const ticksOffline = Math.floor((segundos * 1000) / _recargaMs);
        _atual = StateUtils.clamp(_atual + ticksOffline, 0, maxAtual);
        _emitUpdate();
        return ticksOffline;
    }

    return {
        // ✅ CORRIGIDO: get max dentro do objeto return
        get atual()     { return _atual;      },
        get max()       { return _getMax();   },
        get pct()       { return _atual / _getMax(); },
        get cheia()     { return _atual >= _getMax(); },
        get recargaMs() { return _recargaMs;  },

        gastar(v) {
            if (_atual < v) return false;
            _atual -= v;
            _emitUpdate();
            return true;
        },

        addBoost(multiplicador, duracaoSegundos) {
            _boosts.push({
                multiplicador,
                expiresAt: StateUtils.now() + duracaoSegundos
            });
            EventBus.emit('energia:boost', { multiplicador, duracaoSegundos });
        },

        addMaxBonus(v) {
            _maxBonus += v;
            _emitUpdate();
        },

        recarregarTotal() {
            const custo = CONFIG.GEMA_RECARGA_ENERGIA ?? 30;
            if (!Economy.spendGema(custo, 'energia:recarga')) return false;
            _atual = _getMax();
            _emitUpdate();
            return true;
        },

        recuperarOffline,

        load(d) {
            _maxBonus = d?.maxBonus ?? 0;
            _atual    = StateUtils.clamp(d?.atual ?? _max, 0, _getMax());
            _emitUpdate();
        },
        save() {
            return { atual: _atual, maxBonus: _maxBonus };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  UPGRADES — CORRIGIDO: condições de desbloqueio lazy (sem ref antecipada)
// ═══════════════════════════════════════════════════════════════════════════

const Upgrades = (() => {

    const _state = {
        forca: {
            nivel: 1, desbloqueado: true,
            base: 6,    mult: 1.55,
            cBase: 10,  cCres: 1.42,
            icone: '⚔️', label: 'Força',
            categoria: 'dano',
            descricao: 'Aumenta o dano base de cada clique.',
            maxNivel: 9999,
            // ✅ CORRIGIDO: sem referência a BattleState/Personagem aqui
            desbloqueioCond: null,
            desbloqueioDica: '',
        },
        rosa: {
            nivel: 1, desbloqueado: true,
            base: 4,    mult: 1.45,
            cBase: 14,  cCres: 1.44,
            icone: '🌹', label: 'Rosa Mística',
            categoria: 'dano',
            descricao: 'Channela magia das rosas para amplificar golpes.',
            maxNivel: 9999,
            desbloqueioCond: null,
            desbloqueioDica: '',
        },
        velocidade: {
            nivel: 1, desbloqueado: true,
            base: 1.0,  mult: 1.08,
            cBase: 22,  cCres: 1.48,
            icone: '💨', label: 'Velocidade',
            categoria: 'multiplicador',
            descricao: 'Multiplica TODO o dano de clique.',
            maxNivel: 9999,
            desbloqueioCond: null,
            desbloqueioDica: '',
        },
        dps: {
            nivel: 1, desbloqueado: true,
            base: 3,    mult: 1.55,
            cBase: 18,  cCres: 1.46,
            icone: '✨', label: 'Graça Divina',
            categoria: 'passivo',
            descricao: 'Dano passivo por segundo.',
            maxNivel: 9999,
            desbloqueioCond: null,
            desbloqueioDica: '',
        },
        critico: {
            nivel: 0, desbloqueado: false,
            base: 0.04, mult: 1.18,
            cBase: 45,  cCres: 1.55,
            icone: '🔥', label: 'Crítico',
            categoria: 'especial',
            descricao: 'Chance de golpe crítico com multiplicador crescente.',
            maxNivel: 200,
            // ✅ CORRIGIDO: arrow function lazy — BattleState só é lido
            //    quando verificarDesbloqueios() for chamado, não na init
            desbloqueioCond: () => typeof BattleState !== 'undefined'
                && BattleState.estagio >= 5,
            desbloqueioDica: 'Alcance o estágio 5.',
        },
        multi: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.25,
            cBase: 75,  cCres: 1.58,
            icone: '💫', label: 'Multi-Golpe',
            categoria: 'especial',
            descricao: 'Cada clique pode atingir múltiplas vezes.',
            maxNivel: 100,
            desbloqueioCond: () => typeof Personagem !== 'undefined'
                && Personagem.nivel >= 5,
            desbloqueioDica: 'Alcance o nível 5.',
        },
        ouro: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.12,
            cBase: 60,  cCres: 1.52,
            icone: '🪙', label: 'Bênção do Ouro',
            categoria: 'economia',
            descricao: 'Reduz o custo de todos os upgrades (cap: 60%).',
            maxNivel: 150,
            desbloqueioCond: () => typeof Economy !== 'undefined'
                && Economy.moedaTotal >= 500,
            desbloqueioDica: 'Acumule 500 moedas no total.',
        },
        stamina: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.20,
            cBase: 90,  cCres: 1.60,
            icone: '💪', label: 'Resistência',
            categoria: 'especial',
            descricao: 'Reduz o custo de energia por batalha.',
            maxNivel: 50,
            desbloqueioCond: () => (window._totalKills ?? 0) >= 50,
            desbloqueioDica: 'Derrote 50 inimigos.',
        },
        fortuna: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.30,
            cBase: 120, cCres: 1.65,
            icone: '🍀', label: 'Fortuna',
            categoria: 'economia',
            descricao: 'Aumenta a chance de drop de gemas.',
            maxNivel: 100,
            desbloqueioCond: () => (window._totalPrestígios ?? 0) >= 1,
            desbloqueioDica: 'Complete um prestígio.',
        },
    };

    // ── Sinergias ─────────────────────────────────────────────────────────
    const _sinergias = [
        {
            id: 'guerreiro_mistico',
            label: 'Guerreira Mística',
            requeridos: { forca: 10, rosa: 10 },
            descricao: '+15% de dano quando ambos ≥ nível 10',
            bonus() {
                return _state.forca.nivel >= 10 && _state.rosa.nivel >= 10
                    ? 1.15 : 1.0;
            }
        },
        {
            id: 'tempestade_critica',
            label: 'Tempestade Crítica',
            requeridos: { critico: 5, multi: 5 },
            descricao: '+25% de dano crítico quando ambos ≥ nível 5',
            bonus() {
                return _state.critico.nivel >= 5 && _state.multi.nivel >= 5
                    ? 1.25 : 1.0;
            }
        },
        {
            id: 'prosperidade',
            label: 'Prosperidade',
            requeridos: { ouro: 5, fortuna: 5 },
            descricao: '+10% de moeda quando ambos ≥ nível 5',
            bonus() {
                return _state.ouro.nivel >= 5 && _state.fortuna.nivel >= 5
                    ? 1.10 : 1.0;
            }
        },
    ];

    // ── Helpers ───────────────────────────────────────────────────────────
    function _raw(tipo) {
        const u = _state[tipo];
        return StateUtils.expCurve(u.base, u.mult, u.nivel);
    }

    function dano(tipo)  { return Math.floor(_raw(tipo)); }
    function bonus(tipo) { return parseFloat(_raw(tipo).toFixed(6)); }

    function custo(tipo) {
        const u    = _state[tipo];
        const raw  = Math.floor(u.cBase * Math.pow(u.cCres, u.nivel));
        const desc = _state.ouro.nivel > 0
            ? StateUtils.clamp(bonus('ouro'), 0, 0.60) : 0;
        return Math.max(1, Math.floor(raw * (1 - desc)));
    }

    function maxCompravel(tipo) {
        let qtd   = 0;
        let total = 0;
        const u   = _state[tipo];
        const desc = _state.ouro.nivel > 0
            ? StateUtils.clamp(bonus('ouro'), 0, 0.60) : 0;

        while (true) {
            const prox = Math.floor(
                u.cBase * Math.pow(u.cCres, u.nivel + qtd) * (1 - desc)
            );
            if (total + prox > Economy.moeda) break;
            total += prox;
            qtd++;
            if (qtd >= 9999) break;
        }
        return { quantidade: qtd, custo: total };
    }

    function calcDanoClick() {
        const base = dano('forca') + dano('rosa');
        const vel  = bonus('velocidade');

        const nivelCrit = _state.critico.nivel;
        const taxaCrit  = nivelCrit > 0
            ? StateUtils.clamp(bonus('critico'), 0, 0.75) : 0;
        const multCrit  = nivelCrit > 0 ? (1.5 + nivelCrit * 0.25) : 1;
        const isCrit    = Math.random() < taxaCrit;

        const nivelMulti = _state.multi.nivel;
        const hits       = nivelMulti > 0
            ? Math.max(1, Math.floor(1 + bonus('multi'))) : 1;

        const sinGuerra  = _sinergias.find(s => s.id === 'guerreiro_mistico')?.bonus() ?? 1;
        const sinTempest = isCrit
            ? (_sinergias.find(s => s.id === 'tempestade_critica')?.bonus() ?? 1)
            : 1;

        const itemMult = 1 + (
            typeof Inventario !== 'undefined' ? Inventario.bonusDano / 100 : 0
        );

        const total = Math.floor(
            base * vel
            * (isCrit ? multCrit : 1)
            * hits
            * sinGuerra
            * sinTempest
            * itemMult
        );

        if (isCrit) EventBus.emit('click:critico', { valor: total, mult: multCrit });

        return { total, isCrit, hits, multCrit: isCrit ? multCrit : 1 };
    }

    function calcDps() {
        const itemMult = 1 + (
            typeof Inventario !== 'undefined' ? Inventario.bonusDano / 100 : 0
        );
        const sinBonus = _sinergias.find(s => s.id === 'guerreiro_mistico')?.bonus() ?? 1;
        return Math.floor(dano('dps') * itemMult * sinBonus);
    }

    function preview(tipo) {
        const u = _state[tipo];
        return Math.floor(StateUtils.expCurve(u.base, u.mult, u.nivel + 1));
    }

    function verificarDesbloqueios() {
        let algumNovo = false;
        Object.entries(_state).forEach(([key, u]) => {
            if (!u.desbloqueado && u.desbloqueioCond?.()) {
                u.desbloqueado = true;
                algumNovo = true;
                EventBus.emit('upgrade:desbloqueado', {
                    tipo:  key,
                    label: u.label,
                    icone: u.icone,
                });
            }
        });
        return algumNovo;
    }

    function comprar(tipo, quantidade = 1) {
        const u = _state[tipo];
        if (!u || !u.desbloqueado) return false;
        if (u.nivel >= u.maxNivel)  return false;

        const { quantidade: maxQtd, custo: custoTotal } = maxCompravel(tipo);
        const qtdReal = Math.min(
            quantidade === 'max' ? maxQtd : quantidade,
            maxQtd
        );

        if (qtdReal <= 0) return false;
        if (!Economy.spendMoeda(custoTotal, `upgrade:${tipo}`)) return false;

        u.nivel = Math.min(u.nivel + qtdReal, u.maxNivel);
        window._totalUpgrades = (window._totalUpgrades ?? 0) + qtdReal;

        verificarDesbloqueios();
        EventBus.emit('upgrade:comprado', {
            tipo,
            nivel:      u.nivel,
            label:      u.label,
            icone:      u.icone,
            quantidade: qtdReal,
        });
        return true;
    }

    function getSinergias() {
        return _sinergias.map(s => ({
            id:       s.id,
            label:    s.label,
            descricao:s.descricao,
            requeridos:s.requeridos,
            ativa:    s.bonus() > 1.0,
        }));
    }

    return {
        all: _state,
        get(tipo)  { return _state[tipo]; },
        dano,
        bonus,
        custo,
        maxCompravel,
        preview,
        calcDanoClick,
        calcDps,
        comprar,
        verificarDesbloqueios,
        getSinergias,

        load(data) {
            if (!data) return;
            Object.entries(data).forEach(([k, v]) => {
                if (!_state[k]) return;
                _state[k].nivel        = v.nivel        ?? 0;
                _state[k].desbloqueado = v.desbloqueado ?? (v.nivel > 0);
            });
            verificarDesbloqueios();
        },
        save() {
            return Object.fromEntries(
                Object.entries(_state).map(([k, v]) => [
                    k, { nivel: v.nivel, desbloqueado: v.desbloqueado }
                ])
            );
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  PERSONAGEM
// ═══════════════════════════════════════════════════════════════════════════

const Personagem = (() => {

    let _nivel    = 1;
    let _exp      = 0;
    let _expMax   = 100;
    let _nivelMax = 1;
    let _totalExp = 0;
    let _pontos   = 0;

    const _atributos = {
        vigor:        0,
        destreza:     0,
        inteligencia: 0,
        sorte:        0,
    };

    function _calcExpMax(nivel) {
        if (nivel <= 10) return Math.floor(100 * (1 + nivel * 0.5));
        if (nivel <= 50) return Math.floor(100 * Math.pow(1.28, nivel - 1));
        return Math.floor(100 * Math.pow(1.22, nivel - 1) * Math.log10(nivel));
    }

    const _titulos = [
        { nivel:   1, titulo: 'Novata',        icone: '🌱' },
        { nivel:   5, titulo: 'Aprendiz',       icone: '📖' },
        { nivel:  10, titulo: 'Aventureira',    icone: '⚔️' },
        { nivel:  20, titulo: 'Caçadora',       icone: '🏹' },
        { nivel:  35, titulo: 'Guardiã',        icone: '🛡️' },
        { nivel:  50, titulo: 'Campeã',         icone: '🏆' },
        { nivel:  75, titulo: 'Lendária',       icone: '🌟' },
        { nivel: 100, titulo: 'Transcendente',  icone: '✨' },
    ];

    function getTitulo(nivel) {
        let atual = _titulos[0];
        for (const t of _titulos) {
            if (nivel >= t.nivel) atual = t;
        }
        return atual;
    }

    function getBonusAtributos() {
        return {
            bonusDps:        1 + (_atributos.inteligencia * 0.02),
            bonusVelocidade: 1 + (_atributos.destreza     * 0.015),
            bonusDrop:       1 + (_atributos.sorte        * 0.025),
            bonusCrit:       _atributos.sorte * 0.005,
        };
    }

    function ganharExp(qtd) {
        qtd = Math.max(0, Math.floor(qtd));
        _exp      += qtd;
        _totalExp += qtd;

        const antes = _nivel;
        while (_exp >= _expMax && _nivel < 9999) {
            _exp    -= _expMax;
            _nivel++;
            _pontos++;
            if (_nivel > _nivelMax) _nivelMax = _nivel;
            _expMax = _calcExpMax(_nivel);
        }

        if (_nivel > antes) {
            const titulo = getTitulo(_nivel);
            EventBus.emit('personagem:levelup', {
                nivel:  _nivel,
                titulo: titulo.titulo,
                icone:  titulo.icone,
                pontos: _pontos,
                ganhos: _nivel - antes,
            });
            Upgrades.verificarDesbloqueios();
        }

        EventBus.emit('personagem:exp', {
            exp:    _exp,
            expMax: _expMax,
            nivel:  _nivel,
            pct:    _exp / _expMax,
            total:  _totalExp,
        });
    }

    function alocarPonto(atributo) {
        if (_pontos <= 0) return false;
        if (!_atributos.hasOwnProperty(atributo)) return false;
        _atributos[atributo]++;
        _pontos--;
        EventBus.emit('personagem:atributo', {
            atributo,
            valor:  _atributos[atributo],
            pontos: _pontos,
        });
        return true;
    }

    return {
        get nivel()      { return _nivel;            },
        get exp()        { return _exp;              },
        get expMax()     { return _expMax;           },
        get pct()        { return _exp / _expMax;    },
        get totalExp()   { return _totalExp;         },
        get pontos()     { return _pontos;           },
        get nivelMax()   { return _nivelMax;         },
        get titulo()     { return getTitulo(_nivel); },
        get atributos()  { return { ..._atributos }; },

        ganharExp,
        alocarPonto,
        getBonusAtributos,
        getTitulo,

        load(d) {
            _nivel    = d?.nivel    ?? 1;
            _exp      = d?.exp      ?? 0;
            _expMax   = d?.expMax   ?? _calcExpMax(_nivel);
            _nivelMax = d?.nivelMax ?? _nivel;
            _totalExp = d?.totalExp ?? 0;
            _pontos   = d?.pontos   ?? 0;
            if (d?.atributos) Object.assign(_atributos, d.atributos);
        },
        save() {
            return {
                nivel:     _nivel,
                exp:       _exp,
                expMax:    _expMax,
                nivelMax:  _nivelMax,
                totalExp:  _totalExp,
                pontos:    _pontos,
                atributos: { ..._atributos },
            };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  BATTLE STATE
// ═══════════════════════════════════════════════════════════════════════════

const BattleState = (() => {

    let _estagio    = 1;
    let _maxEstagio = 1;
    let _emBatalha  = false;
    let _pausado    = false;

    const _inimigo = {
        id: '', nome: '', hp: 0, maxHp: 0, nivel: 1,
        rMoeda: 0, rGema: 0, rExp: 0,
        tipo: 0, chefe: false, elite: false,
        timerMax: 0, timerAtual: 0, timerId: null,
        escudo: 0, regeneracao: 0,
    };

    let _dpsIntervalId = null;

    function _startDpsLoop() {
        if (_dpsIntervalId) clearInterval(_dpsIntervalId);
        _dpsIntervalId = setInterval(() => {
            if (!_emBatalha || _pausado) return;
            const dps = Upgrades.calcDps();
            if (dps > 0) darDano(dps, 'dps');

            if (_inimigo.regeneracao > 0 && _inimigo.hp > 0) {
                _inimigo.hp = Math.min(
                    _inimigo.maxHp,
                    _inimigo.hp + _inimigo.regeneracao
                );
                EventBus.emit('inimigo:dano', _buildPayload(0));
            }
        }, 1000);
    }

    function _clearTimerChefe() {
        if (_inimigo.timerId) {
            clearInterval(_inimigo.timerId);
            _inimigo.timerId = null;
        }
    }

    function _startTimerChefe() {
        _clearTimerChefe();
        _inimigo.timerAtual = _inimigo.timerMax;
        _inimigo.timerId = setInterval(() => {
            _inimigo.timerAtual--;
            EventBus.emit('chefe:timer', {
                atual: _inimigo.timerAtual,
                max:   _inimigo.timerMax,
                pct:   _inimigo.timerAtual / _inimigo.timerMax,
            });
            if (_inimigo.timerAtual <= 0) {
                _clearTimerChefe();
                _estagio = Math.max(1, _estagio - 1);
                EventBus.emit('chefe:fugiu', { estagio: _estagio });
                configurarInimigo(_estagio);
                EventBus.emit('estagio:update', _estagio);
            }
        }, 1000);
    }

    function _calcHp(e, chefe, elite) {
        let hp;
        if (e <= 20)       hp = Math.floor(55 * (1 + e * 0.85));
        else if (e <= 100) hp = Math.floor(55 * Math.pow(1.22, e - 10));
        else               hp = Math.floor(55 * Math.pow(1.18, e - 10) * Math.log10(e));
        if (chefe) hp = Math.floor(hp * 2.8);
        if (elite) hp = Math.floor(hp * 1.5);
        return Math.max(1, hp);
    }

    function _calcMoeda(e, chefe, elite) {
        const base = Math.floor(
            CONFIG.MOEDA_BASE_KILL * Math.pow(CONFIG.MOEDA_ESCALA, e)
        );
        const mult = (chefe ? CONFIG.MOEDA_CHEFE_MULT : 1) * (elite ? 1.5 : 1);
        return Math.floor(base * mult);
    }

    function _calcGema(e, chefe, elite) {
        const bonusSorte    = Personagem.getBonusAtributos().bonusDrop;
        const chanceFortuna = Upgrades.bonus('fortuna');
        if (chefe) {
            return Math.floor(
                (CONFIG.GEMA_CHEFE_BASE + e * CONFIG.GEMA_CHEFE_ESCALA)
                * bonusSorte
            );
        }
        const chance = (CONFIG.GEMA_CHANCE_NORMAL + chanceFortuna) * bonusSorte;
        return Math.random() < (chance + (elite ? 0.15 : 0)) ? 1 : 0;
    }

    function _calcExp(e, chefe) {
        const base = Math.floor(
            CONFIG.EXP_BASE_KILL + e * CONFIG.EXP_ESCALA_ESTAGIO
        );
        return chefe ? Math.floor(base * 3) : base;
    }

    function _buildPayload(valor) {
        return {
            valor,
            hp:    _inimigo.hp,
            maxHp: _inimigo.maxHp,
            pct:   _inimigo.hp / _inimigo.maxHp,
            escudo:_inimigo.escudo,
        };
    }

    function configurarInimigo(e) {
        _clearTimerChefe();

        const chefe = e % 10 === 0;
        const elite = !chefe && e % 5 === 0;
        const idx   = chefe
            ? tiposMonstros.length - 1
            : Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
        const tipo  = tiposMonstros[idx];

        const sufixo = chefe ? ' 👑' : (elite ? ' ⭐' : '');

        _inimigo.id          = `${tipo.nome}_${e}_${Date.now()}`;
        _inimigo.nome        = tipo.nome + sufixo + ' Lv.' + e;
        _inimigo.nivel       = e;
        _inimigo.tipo        = idx;
        _inimigo.chefe       = chefe;
        _inimigo.elite       = elite;
        _inimigo.maxHp       = _calcHp(e, chefe, elite);
        _inimigo.hp          = _inimigo.maxHp;
        _inimigo.escudo      = (chefe && e > 30)
            ? Math.floor(_inimigo.maxHp * 0.2) : 0;
        _inimigo.regeneracao = elite
            ? Math.floor(_inimigo.maxHp * 0.01) : 0;
        _inimigo.rMoeda      = _calcMoeda(e, chefe, elite);
        _inimigo.rGema       = _calcGema(e, chefe, elite);
        _inimigo.rExp        = _calcExp(e, chefe);

        if (chefe) {
            _inimigo.timerMax = Math.max(
                CONFIG.CHEFE_TIMER_MIN ?? 20,
                (CONFIG.CHEFE_TIMER_BASE ?? 30) - Math.floor(e / 20)
            );
            _startTimerChefe();
        }

        EventBus.emit('inimigo:configurado', { ..._inimigo });
        setTimeout(() => EventBus.emit('inimigo:fala', tipo.nome), 800);
    }

    function _matarInimigo() {
        _clearTimerChefe();

        Economy.addMoeda(_inimigo.rMoeda, 'kill');
        if (_inimigo.rGema > 0) Economy.addGema(_inimigo.rGema, 'kill');
        Personagem.ganharExp(_inimigo.rExp);

        if (typeof Conquistas !== 'undefined') Conquistas.verificar();

        window._totalKills = (window._totalKills ?? 0) + 1;
        if (_inimigo.chefe)
            window._totalChefes = (window._totalChefes ?? 0) + 1;

        EventBus.emit('inimigo:morto', { ..._inimigo, estagio: _estagio });

        _estagio++;
        if (_estagio > _maxEstagio) _maxEstagio = _estagio;

        configurarInimigo(_estagio);
        EventBus.emit('estagio:update', _estagio);
        Upgrades.verificarDesbloqueios();
    }

    function darDano(valor, origem = 'click') {
        if (!_emBatalha || _pausado || valor <= 0) return;

        if (_inimigo.escudo > 0) {
            const absorvido   = Math.min(_inimigo.escudo, valor);
            _inimigo.escudo  -= absorvido;
            valor            -= absorvido;
            if (valor <= 0) {
                EventBus.emit('inimigo:dano', _buildPayload(0));
                return;
            }
        }

        _inimigo.hp = Math.max(0, _inimigo.hp - valor);
        EventBus.emit('inimigo:dano', { ..._buildPayload(valor), origem });
        if (_inimigo.hp <= 0) _matarInimigo();
    }

    function clickAtaque() {
        if (!_emBatalha || _pausado) return null;
        const resultado = Upgrades.calcDanoClick();
        darDano(resultado.total, 'click');
        return resultado;
    }

    function prestigiar() {
        if (_estagio < CONFIG.ESTAGIO_PRESTIGIO) return { sucesso: false };

        const excesso = _estagio - CONFIG.ESTAGIO_PRESTIGIO;
        const bonus   = Math.floor(CONFIG.PRESTIGIO_GEMA_BONUS + excesso * 0.5);

        window._totalPrestígios = (window._totalPrestígios ?? 0) + 1;

        Economy.load({ moeda: 0, gema: Economy.gema + bonus });
        Object.values(Upgrades.all).forEach(u => {
            u.nivel = u.nivel > 0 ? 1 : 0;
        });

        const estagioAnterior = _estagio;
        _estagio = 1;
        configurarInimigo(1);

        if (typeof Conquistas !== 'undefined') Conquistas.verificar();

        EventBus.emit('prestigio:feito', {
            bonus,
            total: window._totalPrestígios,
            estagioAnterior,
        });

        return { sucesso: true, bonus };
    }

    _startDpsLoop();

    return {
        get estagio()    { return _estagio;        },
        get maxEstagio() { return _maxEstagio;      },
        get emBatalha()  { return _emBatalha;       },
        get pausado()    { return _pausado;         },
        get inimigo()    { return { ..._inimigo };  },

        iniciar() {
            _emBatalha = true;
            _pausado   = false;
            configurarInimigo(_estagio);
            EventBus.emit('batalha:inicio', { estagio: _estagio });
        },
        pausar() {
            _pausado = !_pausado;
            EventBus.emit('batalha:pausa', _pausado);
        },
        sair() {
            _emBatalha = false;
            _clearTimerChefe();
            EventBus.emit('batalha:fim');
        },

        darDano,
        clickAtaque,
        prestigiar,

        irEstagio(e) {
            _estagio = StateUtils.clamp(Math.floor(e), 1, _maxEstagio);
            configurarInimigo(_estagio);
            EventBus.emit('estagio:update', _estagio);
        },
        anterior() {
            if (_estagio > 1) {
                _estagio--;
                configurarInimigo(_estagio);
                EventBus.emit('estagio:update', _estagio);
            }
        },
        proximo() {
            if (_estagio < _maxEstagio) {
                _estagio++;
                configurarInimigo(_estagio);
                EventBus.emit('estagio:update', _estagio);
            }
        },
        irChefe() {
            const prox = Math.ceil(_estagio / 10) * 10;
            if (prox <= _maxEstagio) {
                _estagio = prox;
                configurarInimigo(_estagio);
                EventBus.emit('estagio:update', _estagio);
            }
        },

        load(d) {
            _estagio    = d?.estagio    ?? 1;
            _maxEstagio = d?.maxEstagio ?? _estagio;
            _emBatalha  = false;
        },
        save() {
            return { estagio: _estagio, maxEstagio: _maxEstagio };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  INVENTÁRIO
// ═══════════════════════════════════════════════════════════════════════════

const Inventario = (() => {

    const _slots = { arma: null, acessorio: null, reliquia: null };
    let _herois     = [];
    let _armas      = [];
    let _acessorios = [];
    let _reliquias  = [];
    let _fragmentos = 0;

    const RARIDADES = {
        Comum:    { bonus: 2,  cor: '#9E9E9E', fragmentos: 5   },
        Raro:     { bonus: 5,  cor: '#2196F3', fragmentos: 10  },
        Épico:    { bonus: 12, cor: '#9C27B0', fragmentos: 25  },
        Lendário: { bonus: 25, cor: '#FF9800', fragmentos: 50  },
        Mítico:   { bonus: 45, cor: '#F44336', fragmentos: 100 },
    };

    function calcBonusTotal() {
        let bonusDano = 0, bonusDps = 0;
        Object.entries(_slots).forEach(([slot, item]) => {
            if (!item) return;
            const r    = RARIDADES[item.raridade];
            if (!r) return;
            const peso = slot === 'arma' ? 1.0 : slot === 'acessorio' ? 0.5 : 0.3;
            bonusDano += r.bonus * peso;
            bonusDps  += (r.bonus * 0.5) * peso;
        });
        return { bonusDano, bonusDps };
    }

    const ORDEM_RAR = ['Comum', 'Raro', 'Épico', 'Lendário', 'Mítico'];

    function _getCol(slot) {
        return { arma: _armas, acessorio: _acessorios, reliquia: _reliquias }[slot];
    }

    function equipar(nomeItem, slot) {
        const col  = _getCol(slot);
        if (!col) return false;
        const item = col.find(i => i.nome === nomeItem);
        if (!item) return false;
        _slots[slot] = item;
        EventBus.emit('inventario:equipado', { item, slot });
        EventBus.emit('inventario:bonus', calcBonusTotal());
        return true;
    }

    function fundir(nomeItem, slot) {
        const col    = _getCol(slot);
        if (!col) return false;
        const iguais = col.filter(i => i.nome === nomeItem);
        if (iguais.length < 3) return false;
        const base   = iguais[0];
        const idxRar = ORDEM_RAR.indexOf(base.raridade);
        if (idxRar < 0 || idxRar >= ORDEM_RAR.length - 1) return false;

        for (let i = 0; i < 3; i++) {
            const idx = col.indexOf(iguais[i]);
            if (idx !== -1) col.splice(idx, 1);
        }
        const novoItem = {
            ...base,
            raridade: ORDEM_RAR[idxRar + 1],
            fusoes:   (base.fusoes ?? 0) + 1,
        };
        col.push(novoItem);
        EventBus.emit('inventario:fusao',   { item: novoItem, slot });
        EventBus.emit('inventario:update',  _buildStats());
        return novoItem;
    }

    function descartar(nomeItem, slot) {
        const col = _getCol(slot);
        if (!col) return 0;
        const idx = col.findIndex(i => i.nome === nomeItem);
        if (idx === -1) return 0;
        const item  = col[idx];
        const ganho = RARIDADES[item.raridade]?.fragmentos ?? 5;
        col.splice(idx, 1);
        _fragmentos += ganho;
        EventBus.emit('inventario:descartado', { item, slot, fragmentos: _fragmentos });
        return ganho;
    }

    function _buildStats() {
        return {
            herois:     _herois.length,
            armas:      _armas.length,
            acessorios: _acessorios.length,
            reliquias:  _reliquias.length,
            fragmentos: _fragmentos,
        };
    }

    return {
        get herois()      { return [..._herois];      },
        get armas()       { return [..._armas];       },
        get acessorios()  { return [..._acessorios];  },
        get reliquias()   { return [..._reliquias];   },
        get slots()       { return { ..._slots };     },
        get fragmentos()  { return _fragmentos;       },
        get raridades()   { return RARIDADES;         },

        // compatibilidade legada
        get equipado()    { return _slots.arma;               },
        get bonusDano()   { return calcBonusTotal().bonusDano; },
        get bonusTotal()  { return calcBonusTotal();           },

        addItem(item) {
            const mapa = {
                heroi:    _herois,
                arma:     _armas,
                acessorio:_acessorios,
                reliquia: _reliquias,
            };
            const col = mapa[item.tipo] ?? _armas;
            col.push({ ...item, obtidoEm: StateUtils.now() });
            EventBus.emit('inventario:update', _buildStats());
        },
        addMany(itens) { itens.forEach(i => this.addItem(i)); },

        equipar,
        fundir,
        descartar,

        temItem(nome) {
            return [_herois, _armas, _acessorios, _reliquias]
                .some(col => col.some(i => i.nome === nome));
        },

        load(d) {
            _herois     = d?.herois     ?? [];
            _armas      = d?.armas      ?? [];
            _acessorios = d?.acessorios ?? [];
            _reliquias  = d?.reliquias  ?? [];
            _fragmentos = d?.fragmentos ?? 0;
            if (d?.slots) Object.assign(_slots, d.slots);
        },
        save() {
            return {
                herois:    _herois,
                armas:     _armas,
                acessorios:_acessorios,
                reliquias: _reliquias,
                fragmentos:_fragmentos,
                slots:     { ..._slots },
            };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  CONQUISTAS
// ═══════════════════════════════════════════════════════════════════════════

const Conquistas = (() => {

    const _def = [
        {
            id: 'primeiros_passos', label: 'Primeiros Passos',
            descricao: 'Derrote seu primeiro inimigo.',
            icone: '👊',
            condicao: () => (window._totalKills ?? 0) >= 1,
            recompensa: { gema: 5 },
        },
        {
            id: 'caçadora', label: 'Caçadora',
            descricao: 'Derrote 100 inimigos.',
            icone: '🏹',
            condicao: () => (window._totalKills ?? 0) >= 100,
            recompensa: { gema: 15 },
        },
        {
            id: 'guerreira', label: 'Guerreira',
            descricao: 'Derrote 1.000 inimigos.',
            icone: '⚔️',
            condicao: () => (window._totalKills ?? 0) >= 1000,
            recompensa: { gema: 50, moeda: 500 },
        },
        {
            id: 'exploradora', label: 'Exploradora',
            descricao: 'Alcance o estágio 10.',
            icone: '🗺️',
            condicao: () => typeof BattleState !== 'undefined'
                && BattleState.maxEstagio >= 10,
            recompensa: { gema: 20 },
        },
        {
            id: 'conquistadora', label: 'Conquistadora',
            descricao: 'Alcance o estágio 50.',
            icone: '🏰',
            condicao: () => typeof BattleState !== 'undefined'
                && BattleState.maxEstagio >= 50,
            recompensa: { gema: 75, moeda: 2000 },
        },
        {
            id: 'rica', label: 'Abençoada pelo Ouro',
            descricao: 'Acumule 10.000 moedas no total.',
            icone: '💰',
            condicao: () => Economy.moedaTotal >= 10000,
            recompensa: { gema: 10 },
        },
        {
            id: 'renascida', label: 'Renascida',
            descricao: 'Complete seu primeiro prestígio.',
            icone: '🌅',
            condicao: () => (window._totalPrestígios ?? 0) >= 1,
            recompensa: { gema: 100 },
        },
        {
            id: 'evoluída', label: 'Evoluída',
            descricao: 'Compre 50 upgrades no total.',
            icone: '📈',
            condicao: () => (window._totalUpgrades ?? 0) >= 50,
            recompensa: { gema: 30 },
        },
    ];

    const _obtidas = new Set();

    function verificar() {
        let novidade = false;
        _def.forEach(c => {
            if (_obtidas.has(c.id)) return;
            try {
                if (!c.condicao()) return;
            } catch (_) { return; }

            _obtidas.add(c.id);
            novidade = true;

            if (c.recompensa.gema)  Economy.addGema(c.recompensa.gema,   'conquista');
            if (c.recompensa.moeda) Economy.addMoeda(c.recompensa.moeda, 'conquista');

            EventBus.emit('conquista:desbloqueada', {
                id:        c.id,
                label:     c.label,
                descricao: c.descricao,
                icone:     c.icone,
                recompensa:c.recompensa,
            });
        });
        return novidade;
    }

    return {
        get lista()   {
            return _def.map(c => ({ ...c, obtida: _obtidas.has(c.id) }));
        },
        get total()   { return _def.length;     },
        get obtidas() { return _obtidas.size;   },
        get pct()     { return _obtidas.size / _def.length; },

        verificar,

        load(d)  { (d ?? []).forEach(id => _obtidas.add(id)); },
        save()   { return [..._obtidas]; }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  OFFLINE PROGRESS
// ═══════════════════════════════════════════════════════════════════════════

const OfflineProgress = (() => {

    let _ultimoSave = StateUtils.now();

    function processar(tsUltimoSave) {
        const agora        = StateUtils.now();
        const ausente      = Math.max(0, agora - tsUltimoSave);
        const maxSeg       = (CONFIG.OFFLINE_MAX_HORAS ?? 8) * 3600;
        const tempoEfetivo = Math.min(ausente, maxSeg);

        if (tempoEfetivo < 10) return null;

        const eficiencia = CONFIG.OFFLINE_EFICIENCIA ?? 0.5;
        const dps        = Upgrades.calcDps();

        const moedaGanha = Math.floor(
            dps * tempoEfetivo * eficiencia * (CONFIG.OFFLINE_MOEDA_POR_DPS ?? 0.8)
        );
        const expGanha   = Math.floor(
            tempoEfetivo * eficiencia * (CONFIG.OFFLINE_EXP_POR_SEG ?? 0.5)
        );
        const energiaRecup = Energia.recuperarOffline(tempoEfetivo);

        const resultado = { ausente: tempoEfetivo, moedaGanha, expGanha, energiaRecup };

        if (moedaGanha > 0) Economy.addMoeda(moedaGanha, 'offline');
        if (expGanha   > 0) Personagem.ganharExp(expGanha);

        _ultimoSave = StateUtils.now();
        EventBus.emit('offline:aplicado', resultado);
        return resultado;
    }

    return {
        get ultimoSave() { return _ultimoSave; },

        processar,
        marcarSave() { _ultimoSave = StateUtils.now(); },

        load(d) { _ultimoSave = d?.ultimoSave ?? StateUtils.now(); },
        save()  { return { ultimoSave: StateUtils.now() };         }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  NAMESPACE GLOBAL
// ═══════════════════════════════════════════════════════════════════════════

const GameState = Object.freeze({
    Economy,
    Energia,
    Upgrades,
    Personagem,
    BattleState,
    Inventario,
    Conquistas,
    OfflineProgress,
    Utils: StateUtils,

    snapshot() {
        return {
            economy:    Economy.save(),
            energia:    Energia.save(),
            upgrades:   Upgrades.save(),
            personagem: Personagem.save(),
            battle:     BattleState.save(),
            inventario: Inventario.save(),
            conquistas: Conquistas.save(),
            offline:    OfflineProgress.save(),
            meta: {
                versao:          '2.0.1',
                totalKills:      window._totalKills      ?? 0,
                totalUpgrades:   window._totalUpgrades   ?? 0,
                totalPrestigios: window._totalPrestígios ?? 0,
                totalChefes:     window._totalChefes     ?? 0,
                ts:              StateUtils.now(),
            }
        };
    }
});
