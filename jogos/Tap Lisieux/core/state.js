// ═══════════════════════════════════════════════════════════
//  STATE.JS — Estado global do jogo (fonte única de verdade)
//  Balanceamento profissional estilo Tap Titans 2 / AFK Arena
// ═══════════════════════════════════════════════════════════
"use strict";

// ════════════════════════════════════════
//  ECONOMIA
// ════════════════════════════════════════
const Economy = (() => {
    let _moeda = CONFIG.MOEDA_INICIAL;
    let _gema  = CONFIG.GEMA_INICIAL;

    return {
        get moeda() { return _moeda; },
        get gema()  { return _gema;  },

        addMoeda(v) {
            _moeda += Math.floor(v);
            EventBus.emit('economy:moeda', _moeda);
        },
        spendMoeda(v) {
            if (_moeda < v) return false;
            _moeda -= v;
            EventBus.emit('economy:moeda', _moeda);
            return true;
        },
        addGema(v) {
            _gema += Math.floor(v);
            EventBus.emit('economy:gema', _gema);
        },
        spendGema(v) {
            if (_gema < v) return false;
            _gema -= v;
            EventBus.emit('economy:gema', _gema);
            return true;
        },

        load(data) {
            _moeda = data?.moeda ?? CONFIG.MOEDA_INICIAL;
            _gema  = data?.gema  ?? CONFIG.GEMA_INICIAL;
        },
        save() { return { moeda: _moeda, gema: _gema }; }
    };
})();

// ════════════════════════════════════════
//  ENERGIA
// ════════════════════════════════════════
const Energia = (() => {
    let _atual      = CONFIG.ENERGIA_MAX;
    const MAX       = CONFIG.ENERGIA_MAX;
    let _intervalId = null;

    function _startRecarga() {
        if (_intervalId) return;
        _intervalId = setInterval(() => {
            if (_atual < MAX) {
                _atual = Math.min(MAX, _atual + 1);
                EventBus.emit('energia:update', { atual: _atual, max: MAX });
            }
        }, CONFIG.ENERGIA_RECARGA_MS);
    }

    _startRecarga();

    return {
        get atual() { return _atual; },
        get max()   { return MAX;    },
        get pct()   { return _atual / MAX; },

        gastar(v) {
            if (_atual < v) return false;
            _atual -= v;
            EventBus.emit('energia:update', { atual: _atual, max: MAX });
            return true;
        },

        load(v) {
            _atual = clamp(v ?? MAX, 0, MAX);
            EventBus.emit('energia:update', { atual: _atual, max: MAX });
        },
        save() { return _atual; }
    };
})();

// ════════════════════════════════════════
//  UPGRADES
// ════════════════════════════════════════
const Upgrades = (() => {

    const _def = {
        forca: {
            nivel: 1, base: 6,    mult: 1.55,
            cBase: 10, cCres: 1.42,
            icone: '⚔️', label: 'Força'
        },
        rosa: {
            nivel: 1, base: 4,    mult: 1.45,
            cBase: 14, cCres: 1.44,
            icone: '🌹', label: 'Rosa Mística'
        },
        velocidade: {
            nivel: 1, base: 1.0,  mult: 1.08,
            cBase: 22, cCres: 1.48,
            icone: '💨', label: 'Velocidade'
        },
        dps: {
            nivel: 1, base: 3,    mult: 1.55,
            cBase: 18, cCres: 1.46,
            icone: '✨', label: 'Graça Divina'
        },
        critico: {
            nivel: 0, base: 0.04, mult: 1.18,
            cBase: 45, cCres: 1.55,
            icone: '🔥', label: 'Crítico'
        },
        multi: {
            nivel: 0, base: 0.0,  mult: 1.25,
            cBase: 75, cCres: 1.58,
            icone: '💫', label: 'Multi-Golpe'
        },
        ouro: {
            nivel: 0, base: 0.0,  mult: 1.12,
            cBase: 60, cCres: 1.52,
            icone: '🪙', label: 'Bênção do Ouro'
        },
    };

    function _raw(tipo) {
        const u = _def[tipo];
        return u.base * Math.pow(u.mult, Math.max(0, u.nivel - 1));
    }

    function dano(tipo)  { return Math.floor(_raw(tipo)); }
    function bonus(tipo) { return parseFloat(_raw(tipo).toFixed(4)); }

    function custo(tipo) {
        const u    = _def[tipo];
        const raw  = Math.floor(u.cBase * Math.pow(u.cCres, u.nivel));
        const desc = _def.ouro.nivel > 0
            ? Math.max(0, Math.min(0.60, bonus('ouro')))
            : 0;
        return Math.max(1, Math.floor(raw * (1 - desc)));
    }

    function calcDanoClick() {
        const base = dano('forca') + dano('rosa');
        const vel  = bonus('velocidade');

        const taxaCrit = _def.critico.nivel > 0 ? bonus('critico') : 0;
        const multCrit = _def.critico.nivel > 0
            ? 1.5 + _def.critico.nivel * 0.3
            : 1;
        const isCrit = Math.random() < taxaCrit;

        const hits = _def.multi.nivel > 0
            ? Math.max(1, Math.floor(1 + bonus('multi')))
            : 1;

        const itemMult = 1 + (Inventario.bonusDano / 100);
        const total    = Math.floor(base * vel * (isCrit ? multCrit : 1) * hits * itemMult);

        if (isCrit) EventBus.emit('click:critico', total);

        return total;
    }

    function calcDps() {
        const itemMult = 1 + (Inventario.bonusDano / 100);
        return Math.floor(dano('dps') * itemMult);
    }

    function preview(tipo) {
        const u = _def[tipo];
        const proxNivel = u.nivel + 1;
        return Math.floor(u.base * Math.pow(u.mult, Math.max(0, proxNivel - 1)));
    }

    function comprar(tipo) {
        const u = _def[tipo];
        if (!u) return false;

        const c = custo(tipo);
        if (!Economy.spendMoeda(c)) return false;

        u.nivel++;
        window._totalUpgrades = (window._totalUpgrades ?? 0) + 1;

        EventBus.emit('upgrade:comprado', {
            tipo, nivel: u.nivel, label: u.label, icone: u.icone,
        });
        return true;
    }

    function get(tipo) { return _def[tipo]; }

    function load(data) {
        if (!data) return;
        Object.entries(data).forEach(([k, v]) => {
            if (_def[k]) _def[k].nivel = v;
        });
    }
    function save() {
        return Object.fromEntries(
            Object.entries(_def).map(([k, v]) => [k, v.nivel])
        );
    }

    return { get, dano, bonus, custo, preview, comprar, calcDanoClick, calcDps, load, save, all: _def };
})();

// ════════════════════════════════════════
//  PERSONAGEM
// ════════════════════════════════════════
const Personagem = (() => {
    let _nivel  = 1;
    let _exp    = 0;
    let _expMax = 100;

    function _calcExpMax(nivel) {
        return Math.floor(100 * Math.pow(1.32, nivel - 1));
    }

    function ganharExp(qtd) {
        _exp += qtd;
        let levelUp = false;

        while (_exp >= _expMax) {
            _exp    -= _expMax;
            _nivel++;
            _expMax  = _calcExpMax(_nivel);
            levelUp  = true;
        }

        if (levelUp) EventBus.emit('personagem:levelup', _nivel);
        EventBus.emit('personagem:exp', { exp: _exp, expMax: _expMax, nivel: _nivel });
    }

    return {
        get nivel()  { return _nivel;  },
        get exp()    { return _exp;    },
        get expMax() { return _expMax; },
        get pct()    { return _exp / _expMax; },

        ganharExp,

        load(d) {
            _nivel  = d?.nivel  ?? 1;
            _exp    = d?.exp    ?? 0;
            _expMax = d?.expMax ?? _calcExpMax(_nivel);
        },
        save() {
            return { nivel: _nivel, exp: _exp, expMax: _expMax };
        }
    };
})();

// ════════════════════════════════════════
//  BATTLE STATE
// ════════════════════════════════════════
const BattleState = (() => {
    let _estagio    = 1;
    let _emBatalha  = false;
    let _maxEstagio = 1;

    const _inimigo = {
        nome: '', hp: 0, maxHp: 0, nivel: 1,
        rMoeda: 0, rGema: 0, tipo: 0, chefe: false
    };

    // ── Curva de HP híbrida ───────────────────────────────
    function _calcHp(e, chefe) {
        const hp = e <= 20
            ? Math.floor(55 * (1 + e * 0.85))
            : Math.floor(55 * Math.pow(1.22, e - 10));
        return chefe ? Math.floor(hp * 2.5) : hp;
    }

    function _calcMoeda(e, chefe) {
        const base = Math.floor(
            CONFIG.MOEDA_BASE_KILL * Math.pow(CONFIG.MOEDA_ESCALA, e)
        );
        return chefe ? base * CONFIG.MOEDA_CHEFE_MULT : base;
    }

    function _calcGema(e, chefe) {
        if (chefe) {
            return Math.floor(CONFIG.GEMA_CHEFE_BASE + e * CONFIG.GEMA_CHEFE_ESCALA);
        }
        return Math.random() < CONFIG.GEMA_CHANCE_NORMAL ? 1 : 0;
    }

    function configurarInimigo(e) {
        const chefe = e % 10 === 0;
        const idx   = chefe
            ? tiposMonstros.length - 1
            : Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
        const tipo  = tiposMonstros[idx];

        _inimigo.nome   = tipo.nome + (chefe ? ' 👑' : '') + ' Lv.' + e;
        _inimigo.nivel  = e;
        _inimigo.tipo   = idx;
        _inimigo.chefe  = chefe;
        _inimigo.maxHp  = _calcHp(e, chefe);
        _inimigo.hp     = _inimigo.maxHp;   // ← HP RESETADO AQUI
        _inimigo.rMoeda = _calcMoeda(e, chefe);
        _inimigo.rGema  = _calcGema(e, chefe);

        EventBus.emit('inimigo:configurado', { ..._inimigo });
        setTimeout(() => EventBus.emit('inimigo:fala', tipo.nome), 800);
    }

    // ── Morte do inimigo ─────────────────────────────────
    function _matarInimigo() {
        Economy.addMoeda(_inimigo.rMoeda);
        if (_inimigo.rGema > 0) Economy.addGema(_inimigo.rGema);

        const expGanha = Math.floor(
            CONFIG.EXP_BASE_KILL + _estagio * CONFIG.EXP_ESCALA_ESTAGIO
        );
        Personagem.ganharExp(expGanha);

        window._totalKills = (window._totalKills ?? 0) + 1;

        EventBus.emit('inimigo:morto', {
            ..._inimigo,
            estagio: _estagio,
            expGanha,
        });

        // Avança estágio DEPOIS de emitir morto
        _estagio++;
        if (_estagio > _maxEstagio) _maxEstagio = _estagio;

        configurarInimigo(_estagio);
        EventBus.emit('estagio:update', _estagio);
    }

    // ── Dano ─────────────────────────────────────────────
    // CORREÇÃO PRINCIPAL: permite dano mesmo fora de batalha
    // para que o jogo responda ao clique durante a transição inicial.
    // Só bloqueia se o inimigo não estiver configurado (maxHp === 0).
    function darDano(valor) {
        if (valor <= 0)           return;
        if (_inimigo.maxHp <= 0) return;   // inimigo ainda não configurado

        // Se não estava em batalha, inicia automaticamente
        if (!_emBatalha) {
            _emBatalha = true;
            EventBus.emit('batalha:inicio', _estagio);
        }

        _inimigo.hp = Math.max(0, _inimigo.hp - valor);

        EventBus.emit('inimigo:dano', {
            valor,
            hp:    _inimigo.hp,
            maxHp: _inimigo.maxHp,
            pct:   _inimigo.hp / _inimigo.maxHp,
        });

        if (_inimigo.hp <= 0) _matarInimigo();
    }

    // ── Prestígio ─────────────────────────────────────────
    function prestigiar() {
        if (_estagio < CONFIG.ESTAGIO_PRESTIGIO) return false;

        const bonus = Math.floor(
            CONFIG.PRESTIGIO_GEMA_BONUS +
            (_estagio - CONFIG.ESTAGIO_PRESTIGIO) * 0.5
        );

        Economy.load({ moeda: 0, gema: Economy.gema + bonus });

        Object.values(Upgrades.all).forEach(u => {
            u.nivel = u.nivel > 0 ? 1 : 0;
        });

        const total = (window._totalPrestígios ?? 0) + 1;
        window._totalPrestígios = total;

        _estagio   = 1;
        _emBatalha = false;
        configurarInimigo(1);

        EventBus.emit('prestigio:feito', { bonus, total });
        return true;
    }

    return {
        get estagio()    { return _estagio;    },
        get emBatalha()  { return _emBatalha;  },
        get inimigo()    { return _inimigo;    },
        get maxEstagio() { return _maxEstagio; },

        iniciar() {
            _emBatalha = true;
            if (_inimigo.maxHp <= 0) {
                configurarInimigo(_estagio);
            }
            EventBus.emit('batalha:inicio', _estagio);
        },
        sair() {
            _emBatalha = false;
            EventBus.emit('batalha:fim');
        },

        darDano,
        prestigiar,

        irEstagio(e) {
            _estagio = Math.max(1, Math.min(e, _maxEstagio));
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
            _estagio++;
            if (_estagio > _maxEstagio) _maxEstagio = _estagio;
            configurarInimigo(_estagio);
            EventBus.emit('estagio:update', _estagio);
        },
        chefe() {
            _estagio = Math.ceil(_estagio / 10) * 10;
            configurarInimigo(_estagio);
            EventBus.emit('estagio:update', _estagio);
        },

        load(d) {
            _estagio    = d?.estagio    ?? 1;
            _maxEstagio = d?.maxEstagio ?? _estagio;
            _emBatalha  = false;
            // Reconfigura inimigo no estágio salvo para hp não ficar zerado
            configurarInimigo(_estagio);
        },
        save() {
            return { estagio: _estagio, maxEstagio: _maxEstagio };
        }
    };
})();

// ════════════════════════════════════════
//  INVENTÁRIO GACHA
// ════════════════════════════════════════
const Inventario = (() => {
    let _herois   = [];
    let _armas    = [];
    let _equipado = null;

    function _calcBonusDano(item) {
        if (!item) return 0;
        const mult = { 'Comum': 2, 'Raro': 5, 'Épico': 12, 'Lendário': 25 };
        return mult[item.raridade] ?? 2;
    }

    return {
        get herois()    { return [..._herois];  },
        get armas()     { return [..._armas];   },
        get equipado()  { return _equipado;     },
        get bonusDano() { return _calcBonusDano(_equipado); },

        addItem(item) {
            if (item.tipo === 'heroi') _herois.push(item);
            else                       _armas.push(item);
            EventBus.emit('inventario:update', { herois: _herois.length, armas: _armas.length });
        },
        addMany(itens) {
            itens.forEach(i => this.addItem(i));
        },

        equipar(nomeItem) {
            const item = _armas.find(a => a.nome === nomeItem);
            if (!item) return false;
            _equipado = item;
            EventBus.emit('inventario:equipado', item);
            return true;
        },

        temItem(nome) {
            return _herois.some(h => h.nome === nome) ||
                   _armas.some(a => a.nome === nome);
        },

        load(d) {
            _herois   = d?.herois   ?? [];
            _armas    = d?.armas    ?? [];
            _equipado = d?.equipado ?? null;
        },
        save() {
            return { herois: _herois, armas: _armas, equipado: _equipado };
        }
    };
})();
