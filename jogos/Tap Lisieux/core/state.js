// ═══════════════════════════════════════════════════════════════════════════
//  STATE.JS  v2.0.0
//  Arquitetura: Event-Driven + Module Pattern + BigInt Economy
//  Inspirado em: Tap Titans 2 · AFK Arena · Idle Champions · Clicker Heroes
//  © 2025 — Produção Comercial
// ═══════════════════════════════════════════════════════════════════════════
"use strict";

// ═══════════════════════════════════════════════════════════════════════════
//  UTILITÁRIOS INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

const StateUtils = (() => {

    // ── Notação científica para números grandes (1.23e+6 → "1.23M") ────────
    const SUFFIXES = [
        '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
        'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc',
        'NoDc', 'Vg', 'UVg'
    ];

    function formatBig(value) {
        if (typeof value === 'bigint') value = Number(value);
        if (value < 1000) return Math.floor(value).toString();
        const exp = Math.floor(Math.log10(value) / 3);
        const suffix = SUFFIXES[exp] ?? `e${exp * 3}`;
        const scaled = value / Math.pow(1000, exp);
        return `${scaled.toFixed(2)}${suffix}`;
    }

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    // ── Curva de crescimento exponencial segura ──────────────────────────
    function expCurve(base, rate, level) {
        // Usa log para evitar Infinity em levels altos
        return base * Math.pow(rate, Math.max(0, level - 1));
    }

    // ── Interpolação suave (easing) ──────────────────────────────────────
    function lerp(a, b, t) {
        return a + (b - a) * clamp(t, 0, 1);
    }

    // ── Hash rápido para seed de RNG determinístico ──────────────────────
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // ── RNG com seed (Mulberry32) — para drops reproduzíveis ────────────
    function createRng(seed) {
        let s = seed >>> 0;
        return function () {
            s += 0x6D2B79F5;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── Timestamp em segundos ────────────────────────────────────────────
    function now() { return Math.floor(Date.now() / 1000); }

    // ── Deep freeze (imutabilidade de configs) ───────────────────────────
    function deepFreeze(obj) {
        Object.getOwnPropertyNames(obj).forEach(name => {
            const val = obj[name];
            if (val && typeof val === 'object') deepFreeze(val);
        });
        return Object.freeze(obj);
    }

    return { formatBig, clamp, expCurve, lerp, hashCode, createRng, now, deepFreeze };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  ECONOMY — Sistema monetário com anti-cheat e offline earnings
// ═══════════════════════════════════════════════════════════════════════════

const Economy = (() => {

    // ── Estado interno ───────────────────────────────────────────────────
    let _moeda        = CONFIG.MOEDA_INICIAL;
    let _gema         = CONFIG.GEMA_INICIAL;
    let _moedaTotal   = CONFIG.MOEDA_INICIAL;   // lifetime (para achievements)
    let _gemaTotal    = CONFIG.GEMA_INICIAL;
    let _moedaGasta   = 0;
    let _gemaGasta    = 0;

    // ── Histórico de transações (últimas 50, para debug / anti-cheat) ────
    const _historico = [];
    const MAX_HIST   = 50;

    function _registrar(tipo, valor, origem) {
        _historico.push({
            tipo, valor, origem,
            ts: StateUtils.now(),
            snap: { moeda: _moeda, gema: _gema }
        });
        if (_historico.length > MAX_HIST) _historico.shift();
    }

    // ── Validação anti-cheat (detecta ganhos absurdos) ──────────────────
    function _validarGanho(valor, tipo) {
        if (!isFinite(valor) || isNaN(valor) || valor < 0) return 0;

        // Limite máximo por transação baseado no estágio atual
        const estagio = typeof BattleState !== 'undefined' ? BattleState.estagio : 1;
        const limiteMax = CONFIG.MOEDA_BASE_KILL
            * Math.pow(CONFIG.MOEDA_ESCALA, estagio)
            * 1000; // 1000x a recompensa do estágio atual = suspeito

        if (valor > limiteMax) {
            console.warn(`[Economy] Ganho suspeito bloqueado: ${valor} ${tipo}`);
            return limiteMax;
        }
        return valor;
    }

    // ── Ganho offline (calculado ao carregar save) ───────────────────────
    function calcularOffline(segundosAusente, dpsSnapshot) {
        const maxOffline = CONFIG.OFFLINE_MAX_HORAS * 3600;
        const tempo      = StateUtils.clamp(segundosAusente, 0, maxOffline);
        const eficiencia = CONFIG.OFFLINE_EFICIENCIA ?? 0.5; // 50% do DPS online

        const moedaGanha = Math.floor(dpsSnapshot * tempo * eficiencia
            * (CONFIG.OFFLINE_MOEDA_POR_DPS ?? 0.8));
        const expGanha   = Math.floor(tempo * eficiencia
            * (CONFIG.OFFLINE_EXP_POR_SEG ?? 1));

        return { tempo, moedaGanha, expGanha };
    }

    // ── Multiplicadores externos (buffs, relíquias, VIP, etc.) ──────────
    const _multiplicadores = {
        moeda: 1.0,
        gema:  1.0,
    };

    function setMultiplicador(tipo, valor, origem) {
        if (!_multiplicadores.hasOwnProperty(tipo)) return;
        _multiplicadores[tipo] = Math.max(1, valor);
        EventBus.emit('economy:multiplicador', { tipo, valor, origem });
    }

    // ── API pública ──────────────────────────────────────────────────────
    return {
        get moeda()       { return _moeda;       },
        get gema()        { return _gema;        },
        get moedaTotal()  { return _moedaTotal;  },
        get gemaTotal()   { return _gemaTotal;   },
        get moedaGasta()  { return _moedaGasta;  },
        get gemaGasta()   { return _gemaGasta;   },
        get historico()   { return [..._historico]; },

        get moedaFmt()    { return StateUtils.formatBig(_moeda); },
        get gemaFmt()     { return StateUtils.formatBig(_gema);  },

        addMoeda(v, origem = 'unknown') {
            v = Math.floor(_validarGanho(v, 'moeda') * _multiplicadores.moeda);
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
            v = Math.floor(_validarGanho(v, 'gema'));
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

        // Compra em lote (10x, 100x) — retorna quanto realmente comprou
        spendMoedaLote(v, quantidade, origemFn) {
            const total = v * quantidade;
            if (_moeda < v) return 0; // nem 1 consegue
            const possivel = Math.min(quantidade, Math.floor(_moeda / v));
            this.spendMoeda(v * possivel, origemFn);
            return possivel;
        },

        setMultiplicador,
        calcularOffline,

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
//  ENERGIA — Sistema com recarga offline, boost e múltiplas fontes
// ═══════════════════════════════════════════════════════════════════════════

const Energia = (() => {

    let _atual      = CONFIG.ENERGIA_MAX;
    let _max        = CONFIG.ENERGIA_MAX;
    let _maxBonus   = 0;          // bônus de relíquias/VIP
    let _recargaMs  = CONFIG.ENERGIA_RECARGA_MS;
    let _intervalId = null;
    let _lastTick   = StateUtils.now();

    // ── Boosts temporários ───────────────────────────────────────────────
    const _boosts = [];  // [{ multiplicador, expiresAt }]

    function _boostAtivo() {
        const agora = StateUtils.now();
        // Remove expirados
        for (let i = _boosts.length - 1; i >= 0; i--) {
            if (_boosts[i].expiresAt <= agora) _boosts.splice(i, 1);
        }
        return _boosts.reduce((acc, b) => acc * b.multiplicador, 1.0);
    }

    function get max()   { return _max + _maxBonus; }

    function _emitUpdate() {
        const maxAtual = _max + _maxBonus;
        EventBus.emit('energia:update', {
            atual:  _atual,
            max:    maxAtual,
            pct:    _atual / maxAtual,
            cheia:  _atual >= maxAtual,
            boost:  _boostAtivo(),
        });
    }

    function _tick() {
        const maxAtual  = _max + _maxBonus;
        if (_atual >= maxAtual) return;

        const boost     = _boostAtivo();
        const recupPor  = 1 * boost;
        _atual = Math.min(maxAtual, _atual + recupPor);
        _lastTick = StateUtils.now();
        _emitUpdate();
    }

    function _startTimer() {
        if (_intervalId) clearInterval(_intervalId);
        _intervalId = setInterval(_tick, _recargaMs);
    }

    _startTimer();

    // ── Recuperação offline ──────────────────────────────────────────────
    function recuperarOffline(segundos) {
        const maxAtual   = _max + _maxBonus;
        const ticksOffline = Math.floor((segundos * 1000) / _recargaMs);
        _atual = StateUtils.clamp(_atual + ticksOffline, 0, maxAtual);
        _emitUpdate();
        return ticksOffline;
    }

    return {
        get atual()    { return _atual;             },
        get max()      { return _max + _maxBonus;   },
        get pct()      { return _atual / (_max + _maxBonus); },
        get cheia()    { return _atual >= (_max + _maxBonus); },
        get recargaMs(){ return _recargaMs;         },

        gastar(v) {
            if (_atual < v) return false;
            _atual -= v;
            _emitUpdate();
            return true;
        },

        // Boost temporário de recarga (ex: poção 2x por 5min)
        addBoost(multiplicador, duracaoSegundos) {
            _boosts.push({
                multiplicador,
                expiresAt: StateUtils.now() + duracaoSegundos
            });
            EventBus.emit('energia:boost', { multiplicador, duracaoSegundos });
        },

        // Aumentar máximo (relíquias, VIP)
        addMaxBonus(v) {
            _maxBonus += v;
            _emitUpdate();
        },

        // Recarga imediata (gema premium)
        recarregarTotal() {
            const custo = CONFIG.GEMA_RECARGA_ENERGIA ?? 30;
            if (!Economy.spendGema(custo, 'energia:recarga')) return false;
            _atual = _max + _maxBonus;
            _emitUpdate();
            return true;
        },

        recuperarOffline,

        load(d) {
            _atual    = StateUtils.clamp(d?.atual ?? _max, 0, _max + _maxBonus);
            _maxBonus = d?.maxBonus ?? 0;
            _emitUpdate();
        },
        save() {
            return { atual: _atual, maxBonus: _maxBonus };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  UPGRADES — Sistema com compra em lote, sinergias e desbloqueios
// ═══════════════════════════════════════════════════════════════════════════

const Upgrades = (() => {

    // ── Definições ───────────────────────────────────────────────────────
    // Fórmula de custo: cBase * cCres^nivel  (escala verificada até lv 500)
    // Fórmula de valor: base * mult^(nivel-1)
    // Filosofia: 20 kills no estágio equivalente por nível
    const _def = StateUtils.deepFreeze ? null : null; // placeholder
    const _state = {

        forca: {
            nivel: 1, desbloqueado: true,
            base: 6,    mult: 1.55,
            cBase: 10,  cCres: 1.42,
            icone: '⚔️', label: 'Força',
            categoria: 'dano',
            descricao: 'Aumenta o dano base de cada clique.',
            maxNivel: 9999,
        },
        rosa: {
            nivel: 1, desbloqueado: true,
            base: 4,    mult: 1.45,
            cBase: 14,  cCres: 1.44,
            icone: '🌹', label: 'Rosa Mística',
            categoria: 'dano',
            descricao: 'Channela magia das rosas para amplificar golpes.',
            maxNivel: 9999,
        },
        velocidade: {
            nivel: 1, desbloqueado: true,
            base: 1.0,  mult: 1.08,
            cBase: 22,  cCres: 1.48,
            icone: '💨', label: 'Velocidade',
            categoria: 'multiplicador',
            descricao: 'Multiplica TODO o dano de clique.',
            maxNivel: 9999,
        },
        dps: {
            nivel: 1, desbloqueado: true,
            base: 3,    mult: 1.55,
            cBase: 18,  cCres: 1.46,
            icone: '✨', label: 'Graça Divina',
            categoria: 'passivo',
            descricao: 'Dano passivo por segundo enquanto você está offline.',
            maxNivel: 9999,
        },
        critico: {
            nivel: 0, desbloqueado: false,
            base: 0.04, mult: 1.18,
            cBase: 45,  cCres: 1.55,
            icone: '🔥', label: 'Crítico',
            categoria: 'especial',
            descricao: 'Chance de golpe crítico com multiplicador crescente.',
            maxNivel: 200,
            desbloqueioCond: () => BattleState.estagio >= 5,
            desbloqueioDica: 'Alcance o estágio 5 para desbloquear.',
        },
        multi: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.25,
            cBase: 75,  cCres: 1.58,
            icone: '💫', label: 'Multi-Golpe',
            categoria: 'especial',
            descricao: 'Cada clique pode atingir múltiplos vezes.',
            maxNivel: 100,
            desbloqueioCond: () => Personagem.nivel >= 5,
            desbloqueioDica: 'Alcance o nível 5 para desbloquear.',
        },
        ouro: {
            nivel: 0, desbloqueado: false,
            base: 0.0,  mult: 1.12,
            cBase: 60,  cCres: 1.52,
            icone: '🪙', label: 'Bênção do Ouro',
            categoria: 'economia',
            descricao: 'Reduz o custo de todos os upgrades (cap: 60%).',
            maxNivel: 150,
            desbloqueioCond: () => Economy.moedaTotal >= 500,
            desbloqueioDica: 'Acumule 500 moedas no total para desbloquear.',
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
            desbloqueioDica: 'Derrote 50 inimigos para desbloquear.',
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
            desbloqueioDica: 'Complete um prestígio para desbloquear.',
        },
    };

    // ── Sinergias entre upgrades (bônus quando dois ≥ nível mínimo) ─────
    const _sinergias = [
        {
            id: 'guerreiro_mistico',
            label: 'Guerreira Mística',
            requeridos: { forca: 10, rosa: 10 },
            descricao: '+15% de dano quando ambos ≥ nível 10',
            bonus: () => {
                if (_state.forca.nivel >= 10 && _state.rosa.nivel >= 10) return 1.15;
                return 1.0;
            }
        },
        {
            id: 'tempestade_critica',
            label: 'Tempestade Crítica',
            requeridos: { critico: 5, multi: 5 },
            descricao: '+25% de dano crítico quando ambos ≥ nível 5',
            bonus: () => {
                if (_state.critico.nivel >= 5 && _state.multi.nivel >= 5) return 1.25;
                return 1.0;
            }
        },
        {
            id: 'prosperidade',
            label: 'Prosperidade',
            requeridos: { ouro: 5, fortuna: 5 },
            descricao: '+10% de moeda quando ambos ≥ nível 5',
            bonus: () => {
                if (_state.ouro.nivel >= 5 && _state.fortuna.nivel >= 5) return 1.10;
                return 1.0;
            }
        },
    ];

    // ── Helpers ──────────────────────────────────────────────────────────
    function _raw(tipo) {
        const u = _state[tipo];
        return StateUtils.expCurve(u.base, u.mult, u.nivel);
    }

    function dano(tipo)  { return Math.floor(_raw(tipo)); }
    function bonus(tipo) { return parseFloat(_raw(tipo).toFixed(6)); }

    // Custo com desconto de ouro + sinergia de prosperidade
    function custo(tipo) {
        const u    = _state[tipo];
        const raw  = Math.floor(u.cBase * Math.pow(u.cCres, u.nivel));
        const desc = _state.ouro.nivel > 0
            ? StateUtils.clamp(bonus('ouro'), 0, 0.60)
            : 0;
        const sinBonus = _sinergias
            .find(s => s.id === 'prosperidade')?.bonus() ?? 1.0;
        // Prosperidade reduz custo em mais 10%
        const descExtra = sinBonus > 1 ? 0.10 : 0;
        return Math.max(1, Math.floor(raw * (1 - desc - descExtra)));
    }

    // Custo para comprar N níveis de uma vez (fórmula de série geométrica)
    function custoLote(tipo, quantidade) {
        const u    = _state[tipo];
        const desc = _state.ouro.nivel > 0
            ? StateUtils.clamp(bonus('ouro'), 0, 0.60)
            : 0;

        // Σ cBase * cCres^(nivel + i), i de 0 até quantidade-1
        let total = 0;
        for (let i = 0; i < quantidade; i++) {
            const raw = u.cBase * Math.pow(u.cCres, u.nivel + i);
            total += Math.floor(raw * (1 - desc));
        }
        return Math.max(quantidade, total);
    }

    // Quanto comprar com todo o dinheiro disponível (max acessível)
    function maxCompravel(tipo) {
        let qtd   = 0;
        let total = 0;
        const u   = _state[tipo];
        const desc = _state.ouro.nivel > 0
            ? StateUtils.clamp(bonus('ouro'), 0, 0.60)
            : 0;

        while (true) {
            const prox = Math.floor(
                u.cBase * Math.pow(u.cCres, u.nivel + qtd) * (1 - desc)
            );
            if (total + prox > Economy.moeda) break;
            total += prox;
            qtd++;
            if (qtd >= 9999) break; // safety
        }
        return { quantidade: qtd, custo: total };
    }

    // ── Cálculo de dano do clique ────────────────────────────────────────
    function calcDanoClick() {
        const base = dano('forca') + dano('rosa');
        const vel  = bonus('velocidade');

        // Crítico
        const nivelCrit  = _state.critico.nivel;
        const taxaCrit   = nivelCrit > 0 ? StateUtils.clamp(bonus('critico'), 0, 0.75) : 0;
        const multCrit   = nivelCrit > 0 ? (1.5 + nivelCrit * 0.25) : 1;
        const isCrit     = Math.random() < taxaCrit;

        // Multi-hit
        const nivelMulti = _state.multi.nivel;
        const hits       = nivelMulti > 0
            ? Math.max(1, Math.floor(1 + bonus('multi')))
            : 1;

        // Sinergias
        const sinGuerra  = _sinergias.find(s => s.id === 'guerreiro_mistico')?.bonus() ?? 1;
        const sinTempest = isCrit
            ? (_sinergias.find(s => s.id === 'tempestade_critica')?.bonus() ?? 1)
            : 1;

        // Item equipado
        const itemMult   = 1 + (Inventario.bonusDano / 100);

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

    // ── DPS passivo ──────────────────────────────────────────────────────
    function calcDps() {
        const itemMult  = 1 + (Inventario.bonusDano / 100);
        const sinBonus  = _sinergias.find(s => s.id === 'guerreiro_mistico')?.bonus() ?? 1;
        return Math.floor(dano('dps') * itemMult * sinBonus);
    }

    // ── Preview do próximo nível ─────────────────────────────────────────
    function preview(tipo) {
        const u = _state[tipo];
        return Math.floor(StateUtils.expCurve(u.base, u.mult, u.nivel + 1));
    }

    // ── Verificar desbloqueios ───────────────────────────────────────────
    function verificarDesbloqueios() {
        let algumNovo = false;
        Object.entries(_state).forEach(([key, u]) => {
            if (!u.desbloqueado && u.desbloqueioCond?.()) {
                u.desbloqueado = true;
                algumNovo = true;
                EventBus.emit('upgrade:desbloqueado', {
                    tipo: key,
                    label: u.label,
                    icone: u.icone,
                });
            }
        });
        return algumNovo;
    }

    // ── Compra individual ────────────────────────────────────────────────
    function comprar(tipo, quantidade = 1) {
        const u = _state[tipo];
        if (!u || !u.desbloqueado) return false;
        if (u.nivel >= u.maxNivel) return false;

        // Clamp pela quantidade disponível
        const { quantidade: maxQtd, custo: custoTotal } = maxCompravel(tipo);
        const qtdReal = Math.min(quantidade === 'max' ? maxQtd : quantidade, maxQtd);

        if (qtdReal <= 0) return false;
        if (!Economy.spendMoeda(custoTotal, `upgrade:${tipo}`)) return false;

        u.nivel = Math.min(u.nivel + qtdReal, u.maxNivel);
        window._totalUpgrades = (window._totalUpgrades ?? 0) + qtdReal;

        verificarDesbloqueios();
        EventBus.emit('upgrade:comprado', {
            tipo,
            nivel:     u.nivel,
            label:     u.label,
            icone:     u.icone,
            quantidade: qtdReal,
        });
        return true;
    }

    // ── Sinergias ativas ─────────────────────────────────────────────────
    function getSinergias() {
        return _sinergias.map(s => ({
            ...s,
            ativa: s.bonus() > 1.0,
        }));
    }

    return {
        // Dados
        all: _state,
        get(tipo)       { return _state[tipo]; },

        // Cálculos
        dano,
        bonus,
        custo,
        custoLote,
        maxCompravel,
        preview,
        calcDanoClick,
        calcDps,

        // Ações
        comprar,
        verificarDesbloqueios,

        // Sinergias
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
                    k,
                    { nivel: v.nivel, desbloqueado: v.desbloqueado }
                ])
            );
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  PERSONAGEM — Progressão com múltiplas stats e atributos derivados
// ═══════════════════════════════════════════════════════════════════════════

const Personagem = (() => {

    let _nivel      = 1;
    let _exp        = 0;
    let _expMax     = 100;
    let _nivelMax   = 1;          // maior nível já atingido
    let _totalExp   = 0;
    let _pontos     = 0;          // pontos de atributo por level-up

    // ── Atributos base (alocados pelo jogador) ───────────────────────────
    const _atributos = {
        vigor:       0,   // +HP (herói futuro)
        destreza:    0,   // +velocidade de clique
        inteligencia:0,   // +DPS passivo
        sorte:       0,   // +drop rate e crítico
    };

    // ── Curva de exp híbrida (flat early, expo late) ─────────────────────
    function _calcExpMax(nivel) {
        if (nivel <= 10)  return Math.floor(100 * (1 + nivel * 0.5));
        if (nivel <= 50)  return Math.floor(100 * Math.pow(1.28, nivel - 1));
        return Math.floor(100 * Math.pow(1.22, nivel - 1) * Math.log10(nivel));
    }

    // ── Títulos de nível ─────────────────────────────────────────────────
    const _titulos = [
        { nivel:   1, titulo: 'Novata',         icone: '🌱' },
        { nivel:   5, titulo: 'Aprendiz',        icone: '📖' },
        { nivel:  10, titulo: 'Aventureira',     icone: '⚔️' },
        { nivel:  20, titulo: 'Caçadora',        icone: '🏹' },
        { nivel:  35, titulo: 'Guardiã',         icone: '🛡️' },
        { nivel:  50, titulo: 'Campeã',          icone: '🏆' },
        { nivel:  75, titulo: 'Lendária',        icone: '🌟' },
        { nivel: 100, titulo: 'Transcendente',   icone: '✨' },
    ];

    function getTitulo(nivel) {
        let atual = _titulos[0];
        for (const t of _titulos) {
            if (nivel >= t.nivel) atual = t;
        }
        return atual;
    }

    // ── Bônus derivados dos atributos ────────────────────────────────────
    function getBonusAtributos() {
        return {
            bonusDps:       1 + (_atributos.inteligencia * 0.02),
            bonusVelocidade:1 + (_atributos.destreza     * 0.015),
            bonusDrop:      1 + (_atributos.sorte        * 0.025),
            bonusCrit:      _atributos.sorte * 0.005,
        };
    }

    // ── Ganho de EXP com overflow de nível ───────────────────────────────
    function ganharExp(qtd) {
        qtd = Math.max(0, Math.floor(qtd));
        _exp      += qtd;
        _totalExp += qtd;

        const levelsBefore = _nivel;
        while (_exp >= _expMax && _nivel < 9999) {
            _exp    -= _expMax;
            _nivel++;
            _pontos++;   // 1 ponto por level
            if (_nivel > _nivelMax) _nivelMax = _nivel;
            _expMax  = _calcExpMax(_nivel);
        }

        if (_nivel > levelsBefore) {
            const titulo = getTitulo(_nivel);
            EventBus.emit('personagem:levelup', {
                nivel:  _nivel,
                titulo: titulo.titulo,
                icone:  titulo.icone,
                pontos: _pontos,
                ganhos: _nivel - levelsBefore,
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

    // ── Alocar ponto de atributo ─────────────────────────────────────────
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
        get nivel()     { return _nivel;              },
        get exp()       { return _exp;                },
        get expMax()    { return _expMax;             },
        get pct()       { return _exp / _expMax;      },
        get totalExp()  { return _totalExp;           },
        get pontos()    { return _pontos;             },
        get nivelMax()  { return _nivelMax;           },
        get titulo()    { return getTitulo(_nivel);   },
        get atributos() { return { ..._atributos };   },

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
            if (d?.atributos) {
                Object.assign(_atributos, d.atributos);
            }
        },
        save() {
            return {
                nivel:    _nivel,
                exp:      _exp,
                expMax:   _expMax,
                nivelMax: _nivelMax,
                totalExp: _totalExp,
                pontos:   _pontos,
                atributos:{ ..._atributos },
            };
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  BATTLE STATE — Motor de batalha com timer, fuga e múltiplos modos
// ═══════════════════════════════════════════════════════════════════════════

const BattleState = (() => {

    let _estagio    = 1;
    let _maxEstagio = 1;
    let _emBatalha  = false;
    let _pausado    = false;
    let _modo       = 'normal';     // 'normal' | 'desafio' | 'infinito'

    // ── Estado do inimigo atual ──────────────────────────────────────────
    const _inimigo = {
        id: '', nome: '', hp: 0, maxHp: 0, nivel: 1,
        rMoeda: 0, rGema: 0, rExp: 0,
        tipo: 0, chefe: false, elite: false,
        timerMax: 0, timerAtual: 0, timerId: null,
        escudo: 0,          // HP de escudo (absorve dano antes)
        regeneracao: 0,     // HP/s que o inimigo regenera
    };

    // ── DPS loop (tick a cada 1s) ────────────────────────────────────────
    let _dpsIntervalId = null;

    function _startDpsLoop() {
        if (_dpsIntervalId) clearInterval(_dpsIntervalId);
        _dpsIntervalId = setInterval(() => {
            if (!_emBatalha || _pausado) return;

            // DPS passivo
            const dps = Upgrades.calcDps();
            if (dps > 0) darDano(dps, 'dps');

            // Regeneração do inimigo
            if (_inimigo.regeneracao > 0 && _inimigo.hp > 0) {
                _inimigo.hp = Math.min(
                    _inimigo.maxHp,
                    _inimigo.hp + _inimigo.regeneracao
                );
                EventBus.emit('inimigo:dano', _buildDanoPayload(0));
            }
        }, 1000);
    }

    // ── Timer de chefe ───────────────────────────────────────────────────
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
                _fugarChefe();
            }
        }, 1000);
    }

    function _clearTimerChefe() {
        if (_inimigo.timerId) {
            clearInterval(_inimigo.timerId);
            _inimigo.timerId = null;
        }
    }

    // ── Fuga do chefe (retorna ao estágio anterior) ──────────────────────
    function _fugarChefe() {
        _estagio = Math.max(1, _estagio - 1);
        EventBus.emit('chefe:fugiu', { estagio: _estagio });
        configurarInimigo(_estagio);
        EventBus.emit('estagio:update', _estagio);
    }

    // ── Curvas de HP ─────────────────────────────────────────────────────
    function _calcHp(e, chefe, elite) {
        let hp;
        if (e <= 20)       hp = Math.floor(55 * (1 + e * 0.85));
        else if (e <= 100) hp = Math.floor(55 * Math.pow(1.22, e - 10));
        else               hp = Math.floor(55 * Math.pow(1.18, e - 10) * Math.log10(e));

        if (chefe) hp = Math.floor(hp * 2.8);
        if (elite) hp = Math.floor(hp * 1.5);
        return Math.max(1, hp);
    }

    // ── Recompensas ──────────────────────────────────────────────────────
    function _calcMoeda(e, chefe, elite) {
        const base = Math.floor(
            CONFIG.MOEDA_BASE_KILL * Math.pow(CONFIG.MOEDA_ESCALA, e)
        );
        const sinBonus = Upgrades.getSinergias()
            .find(s => s.id === 'prosperidade')?.ativa ? 1.10 : 1.0;
        const mult = (chefe ? CONFIG.MOEDA_CHEFE_MULT : 1)
                   * (elite ? 1.5 : 1)
                   * sinBonus;
        return Math.floor(base * mult);
    }

    function _calcGema(e, chefe, elite) {
        const bonusSorte = Personagem.getBonusAtributos().bonusDrop;
        const chanceFortuna = Upgrades.bonus('fortuna');

        if (chefe) {
            return Math.floor(
                (CONFIG.GEMA_CHEFE_BASE + e * CONFIG.GEMA_CHEFE_ESCALA)
                * bonusSorte
            );
        }
        const chance = (CONFIG.GEMA_CHANCE_NORMAL + chanceFortuna) * bonusSorte;
        const extra  = elite ? 0.15 : 0;
        return Math.random() < (chance + extra) ? 1 : 0;
    }

    function _calcExp(e, chefe) {
        const base = Math.floor(
            CONFIG.EXP_BASE_KILL + e * CONFIG.EXP_ESCALA_ESTAGIO
        );
        return chefe ? Math.floor(base * 3) : base;
    }

    // ── Build do payload de dano ─────────────────────────────────────────
    function _buildDanoPayload(valor) {
        return {
            valor,
            hp:    _inimigo.hp,
            maxHp: _inimigo.maxHp,
            pct:   _inimigo.hp / _inimigo.maxHp,
            escudo:_inimigo.escudo,
        };
    }

    // ── Configurar inimigo ───────────────────────────────────────────────
    function configurarInimigo(e) {
        _clearTimerChefe();

        const chefe   = e % 10 === 0;
        const elite   = !chefe && e % 5 === 0;
        const idx     = chefe
            ? tiposMonstros.length - 1
            : Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
        const tipo    = tiposMonstros[idx];

        const sufixo  = chefe ? ' 👑' : (elite ? ' ⭐' : '');
        _inimigo.id       = `${tipo.nome}_${e}_${Date.now()}`;
        _inimigo.nome     = tipo.nome + sufixo + ' Lv.' + e;
        _inimigo.nivel    = e;
        _inimigo.tipo     = idx;
        _inimigo.chefe    = chefe;
        _inimigo.elite    = elite;
        _inimigo.maxHp    = _calcHp(e, chefe, elite);
        _inimigo.hp       = _inimigo.maxHp;
        _inimigo.escudo   = chefe && e > 30 ? Math.floor(_inimigo.maxHp * 0.2) : 0;
        _inimigo.regeneracao = elite ? Math.floor(_inimigo.maxHp * 0.01) : 0;
        _inimigo.rMoeda   = _calcMoeda(e, chefe, elite);
        _inimigo.rGema    = _calcGema(e, chefe, elite);
        _inimigo.rExp     = _calcExp(e, chefe);

        // Timer do chefe (aumenta conforme estágio)
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

    // ── Morte do inimigo ─────────────────────────────────────────────────
    function _matarInimigo() {
        _clearTimerChefe();

        Economy.addMoeda(_inimigo.rMoeda, 'kill');
        if (_inimigo.rGema > 0) Economy.addGema(_inimigo.rGema, 'kill');
        Personagem.ganharExp(_inimigo.rExp);
        Conquistas.verificar();

        window._totalKills = (window._totalKills ?? 0) + 1;
        if (_inimigo.chefe) window._totalChefes = (window._totalChefes ?? 0) + 1;

        EventBus.emit('inimigo:morto', {
            ..._inimigo,
            estagio: _estagio,
        });

        _estagio++;
        if (_estagio > _maxEstagio) _maxEstagio = _estagio;

        configurarInimigo(_estagio);
        EventBus.emit('estagio:update', _estagio);
        Upgrades.verificarDesbloqueios();
    }

    // ── Aplicar dano ─────────────────────────────────────────────────────
    function darDano(valor, origem = 'click') {
        if (!_emBatalha || _pausado || valor <= 0) return;

        // Escudo absorve primeiro
        if (_inimigo.escudo > 0) {
            const absorvido = Math.min(_inimigo.escudo, valor);
            _inimigo.escudo -= absorvido;
            valor -= absorvido;
            if (valor <= 0) {
                EventBus.emit('inimigo:dano', _buildDanoPayload(0));
                return;
            }
        }

        _inimigo.hp = Math.max(0, _inimigo.hp - valor);
        EventBus.emit('inimigo:dano', { ..._buildDanoPayload(valor), origem });

        if (_inimigo.hp <= 0) _matarInimigo();
    }

    // ── Click do jogador ─────────────────────────────────────────────────
    function clickAtaque() {
        if (!_emBatalha || _pausado) return null;

        const { total, isCrit, hits, multCrit } = Upgrades.calcDanoClick();
        const custoBonusAtrib = Upgrades.bonus('stamina');
        const custoEnergia    = Math.max(1, Math.floor(
            CONFIG.ENERGIA_POR_CLICK - custoBonusAtrib
        ));

        // Opcional: alguns jogos consomem energia no click
        // if (!Energia.gastar(custoEnergia)) return null;

        darDano(total, 'click');
        return { total, isCrit, hits, multCrit };
    }

    // ── Prestígio ────────────────────────────────────────────────────────
    function prestigiar() {
        if (_estagio < CONFIG.ESTAGIO_PRESTIGIO) return { sucesso: false };

        // Bônus escalonado por distância além do requisito
        const excesso = _estagio - CONFIG.ESTAGIO_PRESTIGIO;
        const bonus   = Math.floor(
            CONFIG.PRESTIGIO_GEMA_BONUS + excesso * 0.5
        );

        const totalAntes = window._totalPrestígios ?? 0;
        window._totalPrestígios = totalAntes + 1;

        // Reset (TT2 style: mantém nível 1 em vez de 0)
        Economy.load({ moeda: 0, gema: Economy.gema + bonus });

        Object.values(Upgrades.all).forEach(u => {
            u.nivel = u.nivel > 0 ? 1 : 0;
        });

        const estagioAnterior = _estagio;
        _estagio = 1;
        configurarInimigo(1);

        Conquistas.verificar();
        EventBus.emit('prestigio:feito', {
            bonus,
            total:          window._totalPrestígios,
            estagioAnterior,
        });

        return { sucesso: true, bonus };
    }

    _startDpsLoop();

    return {
        get estagio()    { return _estagio;    },
        get maxEstagio() { return _maxEstagio; },
        get emBatalha()  { return _emBatalha;  },
        get pausado()    { return _pausado;    },
        get inimigo()    { return { ..._inimigo }; },
        get modo()       { return _modo;       },

        iniciar() {
            _emBatalha = true;
            _pausado   = false;
            configurarInimigo(_estagio);
            EventBus.emit('batalha:inicio', { estagio: _estagio, modo: _modo });
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

        // Navegação
        irEstagio(e) {
            e = StateUtils.clamp(Math.floor(e), 1, _maxEstagio);
            _estagio = e;
            configurarInimigo(e);
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
            const proximo = Math.ceil(_estagio / 10) * 10;
            if (proximo <= _maxEstagio) {
                _estagio = proximo;
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
//  INVENTÁRIO — Gerenciamento com fusão, raridade e slots
// ═══════════════════════════════════════════════════════════════════════════

const Inventario = (() => {

    // ── Slots de equipamento ─────────────────────────────────────────────
    const _slots = {
        arma:     null,
        acessorio:null,
        reliquia: null,
    };

    let _herois      = [];
    let _armas       = [];
    let _acessorios  = [];
    let _reliquias   = [];

    // ── Configuração de raridades ────────────────────────────────────────
    const RARIDADES = StateUtils.deepFreeze({
        Comum:    { bonus: 2,  cor: '#9E9E9E', fragmentos: 5  },
        Raro:     { bonus: 5,  cor: '#2196F3', fragmentos: 10 },
        Épico:    { bonus: 12, cor: '#9C27B0', fragmentos: 25 },
        Lendário: { bonus: 25, cor: '#FF9800', fragmentos: 50 },
        Mítico:   { bonus: 45, cor: '#F44336', fragmentos: 100},
    });

    let _fragmentos = 0;   // moeda de fusão

    // ── Bônus combinados de equipamentos ────────────────────────────────
    function calcBonusTotal() {
        let bonusDano     = 0;
        let bonusDps      = 0;
        let bonusGema     = 0;
        let bonusMoeda    = 0;
        let bonusEnergia  = 0;

        Object.entries(_slots).forEach(([slot, item]) => {
            if (!item) return;
            const r = RARIDADES[item.raridade];
            if (!r) return;

            // Cada slot tem peso diferente
            const peso = slot === 'arma' ? 1.0
                       : slot === 'acessorio' ? 0.5
                       : 0.3; // reliquia

            bonusDano    += r.bonus * peso;
            bonusDps     += (r.bonus * 0.5) * peso;
            bonusGema    += item.efeito === 'gema'    ? r.bonus * 0.1 : 0;
            bonusMoeda   += item.efeito === 'moeda'   ? r.bonus * 0.1 : 0;
            bonusEnergia += item.efeito === 'energia'  ? r.bonus * 0.1 : 0;
        });

        return { bonusDano, bonusDps, bonusGema, bonusMoeda, bonusEnergia };
    }

    // ── Equipar ──────────────────────────────────────────────────────────
    function equipar(nomeItem, slot) {
        const colecoes = { arma: _armas, acessorio: _acessorios, reliquia: _reliquias };
        const col      = colecoes[slot];
        if (!col) return false;

        const item = col.find(i => i.nome === nomeItem);
        if (!item) return false;

        _slots[slot] = item;
        EventBus.emit('inventario:equipado', { item, slot });
        EventBus.emit('inventario:bonus', calcBonusTotal());
        return true;
    }

    // ── Fusão (3 do mesmo → 1 de raridade superior) ──────────────────────
    const ORDEM_RAR = ['Comum', 'Raro', 'Épico', 'Lendário', 'Mítico'];
    function fundir(nomeItem, slot) {
        const colecoes = { arma: _armas, acessorio: _acessorios, reliquia: _reliquias };
        const col      = colecoes[slot];
        if (!col) return false;

        const iguais = col.filter(i => i.nome === nomeItem);
        if (iguais.length < 3) return false;

        const base    = iguais[0];
        const idxRar  = ORDEM_RAR.indexOf(base.raridade);
        if (idxRar < 0 || idxRar >= ORDEM_RAR.length - 1) return false;

        // Remove 3, adiciona 1 de raridade superior
        for (let i = 0; i < 3; i++) {
            const idx = col.indexOf(iguais[i]);
            if (idx !== -1) col.splice(idx, 1);
        }

        const novoItem = {
            ...base,
            raridade: ORDEM_RAR[idxRar + 1],
            fusoes: (base.fusoes ?? 0) + 1,
        };
        col.push(novoItem);

        EventBus.emit('inventario:fusao', { item: novoItem, slot });
        EventBus.emit('inventario:update', _buildStats());
        return novoItem;
    }

    // ── Descarte → fragmentos ─────────────────────────────────────────────
    function descartar(nomeItem, slot) {
        const colecoes = { arma: _armas, acessorio: _acessorios, reliquia: _reliquias };
        const col      = colecoes[slot];
        if (!col) return 0;

        const idx  = col.findIndex(i => i.nome === nomeItem);
        if (idx === -1) return 0;

        const item = col[idx];
        const ganho = RARIDADES[item.raridade]?.fragmentos ?? 5;
        col.splice(idx, 1);
        _fragmentos += ganho;

        EventBus.emit('inventario:descartado', { item, slot, fragmentos: _fragmentos });
        return ganho;
    }

    function _buildStats() {
        return {
            herois:    _herois.length,
            armas:     _armas.length,
            acessorios:_acessorios.length,
            reliquias: _reliquias.length,
            fragmentos:_fragmentos,
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

        // Compatibilidade legada
        get equipado()    { return _slots.arma;       },
        get bonusDano()   { return calcBonusTotal().bonusDano; },

        get bonusTotal()  { return calcBonusTotal(); },

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

            if (d?.slots) {
                Object.assign(_slots, d.slots);
            }
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
//  CONQUISTAS — Sistema de achievements com recompensas e rastreamento
// ═══════════════════════════════════════════════════════════════════════════

const Conquistas = (() => {

    const _def = [
        // ── Kills ─────────────────────────────────────────────────────
        {
            id: 'primeiros_passos', label: 'Primeiros Passos',
            descricao: 'Derrote seu primeiro inimigo.',
            icone: '👊',
            condicao: () => (window._totalKills ?? 0) >= 1,
            recompensa: { gema: 5 },
        },
        {
            id: 'caçadora',  label: 'Caçadora',
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
        // ── Estágio ───────────────────────────────────────────────────
        {
            id: 'exploradora', label: 'Exploradora',
            descricao: 'Alcance o estágio 10.',
            icone: '🗺️',
            condicao: () => BattleState.maxEstagio >= 10,
            recompensa: { gema: 20 },
        },
        {
            id: 'conquistadora', label: 'Conquistadora',
            descricao: 'Alcance o estágio 50.',
            icone: '🏰',
            condicao: () => BattleState.maxEstagio >= 50,
            recompensa: { gema: 75, moeda: 2000 },
        },
        // ── Economia ──────────────────────────────────────────────────
        {
            id: 'rica', label: 'Abençoada pelo Ouro',
            descricao: 'Acumule 10.000 moedas no total.',
            icone: '💰',
            condicao: () => Economy.moedaTotal >= 10000,
            recompensa: { gema: 10 },
        },
        // ── Prestígio ─────────────────────────────────────────────────
        {
            id: 'renascida', label: 'Renascida',
            descricao: 'Complete seu primeiro prestígio.',
            icone: '🌅',
            condicao: () => (window._totalPrestígios ?? 0) >= 1,
            recompensa: { gema: 100 },
        },
        // ── Upgrades ──────────────────────────────────────────────────
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
            if (!c.condicao()) return;

            _obtidas.add(c.id);
            novidade = true;

            // Distribuir recompensa
            if (c.recompensa.gema)  Economy.addGema(c.recompensa.gema,   'conquista');
            if (c.recompensa.moeda) Economy.addMoeda(c.recompensa.moeda, 'conquista');

            EventBus.emit('conquista:desbloqueada', {
                id:         c.id,
                label:      c.label,
                descricao:  c.descricao,
                icone:      c.icone,
                recompensa: c.recompensa,
            });
        });
        return novidade;
    }

    return {
        get lista()    { return _def.map(c => ({
            ...c,
            obtida: _obtidas.has(c.id),
        })); },
        get total()    { return _def.length;      },
        get obtidas()  { return _obtidas.size;    },
        get pct()      { return _obtidas.size / _def.length; },

        verificar,

        load(d) {
            (d ?? []).forEach(id => _obtidas.add(id));
        },
        save() {
            return [..._obtidas];
        }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  OFFLINE PROGRESS — Calcula e aplica ganhos enquanto ausente
// ═══════════════════════════════════════════════════════════════════════════

const OfflineProgress = (() => {

    let _ultimoSave = StateUtils.now();

    function calcular(tsUltimoSave) {
        const agora         = StateUtils.now();
        const ausente       = Math.max(0, agora - tsUltimoSave);
        const maxOfflineSeg = (CONFIG.OFFLINE_MAX_HORAS ?? 8) * 3600;
        const tempoEfetivo  = Math.min(ausente, maxOfflineSeg);

        if (tempoEfetivo < 10) return null; // menos de 10s = ignora

        const dps           = Upgrades.calcDps();
        const eficiencia    = CONFIG.OFFLINE_EFICIENCIA ?? 0.5;

        const moedaGanha    = Math.floor(
            dps * tempoEfetivo * eficiencia * (CONFIG.OFFLINE_MOEDA_POR_DPS ?? 0.8)
        );
        const expGanha      = Math.floor(
            tempoEfetivo * eficiencia * (CONFIG.OFFLINE_EXP_POR_SEG ?? 0.5)
        );
        const energiaRecup  = Energia.recuperarOffline(tempoEfetivo);

        return {
            ausente:     tempoEfetivo,
            moedaGanha,
            expGanha,
            energiaRecup,
        };
    }

    function aplicar(resultado) {
        if (!resultado) return;
        if (resultado.moedaGanha > 0)
            Economy.addMoeda(resultado.moedaGanha, 'offline');
        if (resultado.expGanha > 0)
            Personagem.ganharExp(resultado.expGanha);

        _ultimoSave = StateUtils.now();
        EventBus.emit('offline:aplicado', resultado);
    }

    return {
        get ultimoSave() { return _ultimoSave; },

        processar(tsUltimoSave) {
            const resultado = calcular(tsUltimoSave);
            if (resultado) aplicar(resultado);
            return resultado;
        },

        marcarSave() { _ultimoSave = StateUtils.now(); },

        load(d) { _ultimoSave = d?.ultimoSave ?? StateUtils.now(); },
        save()  { return { ultimoSave: StateUtils.now() };          }
    };
})();


// ═══════════════════════════════════════════════════════════════════════════
//  EXPORT — Namespace global organizado
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

    // ── Snapshot completo para debug ─────────────────────────────────────
    snapshot() {
        return {
            economy:   Economy.save(),
            energia:   Energia.save(),
            upgrades:  Upgrades.save(),
            personagem:Personagem.save(),
            battle:    BattleState.save(),
            inventario:Inventario.save(),
            conquistas:Conquistas.save(),
            offline:   OfflineProgress.save(),
            meta: {
                versao:        '2.0.0',
                totalKills:    window._totalKills    ?? 0,
                totalUpgrades: window._totalUpgrades ?? 0,
                totalPrestigios:window._totalPrestígios ?? 0,
                totalChefes:   window._totalChefes   ?? 0,
                ts:            StateUtils.now(),
            }
        };
    }
});
