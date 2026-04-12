// ═══════════════════════════════════════════════════════════
//  STATE.JS — Estado global do jogo (fonte única de verdade)
// ═══════════════════════════════════════════════════════════
"use strict";

// ════════════════════════════════════════
//  ECONOMIA
// ════════════════════════════════════════
const Economy = (() => {
    let _moeda = CONFIG.MOEDA_INICIAL;
    let _gema  = CONFIG.GEMA_INICIAL;

    return {
        get moeda()  { return _moeda; },
        get gema()   { return _gema;  },

        addMoeda(v)  {
            _moeda += v;
            EventBus.emit('economy:moeda', _moeda);
        },
        spendMoeda(v) {
            if (_moeda < v) return false;
            _moeda -= v;
            EventBus.emit('economy:moeda', _moeda);
            return true;
        },
        addGema(v)   {
            _gema += v;
            EventBus.emit('economy:gema', _gema);
        },
        spendGema(v) {
            if (_gema < v) return false;
            _gema -= v;
            EventBus.emit('economy:gema', _gema);
            return true;
        },

        load(data) {
            _moeda = data.moeda ?? CONFIG.MOEDA_INICIAL;
            _gema  = data.gema  ?? CONFIG.GEMA_INICIAL;
        },
        save() { return { moeda: _moeda, gema: _gema }; }
    };
})();

// ════════════════════════════════════════
//  ENERGIA
// ════════════════════════════════════════
const Energia = (() => {
    let _atual = CONFIG.ENERGIA_MAX;
    const MAX  = CONFIG.ENERGIA_MAX;

    setInterval(() => {
        if (_atual < MAX) {
            _atual = Math.min(MAX, _atual + 1);
            EventBus.emit('energia:update', { atual: _atual, max: MAX });
        }
    }, CONFIG.ENERGIA_RECARGA_MS);

    return {
        get atual() { return _atual; },
        get max()   { return MAX; },
        gastar(v)   {
            if (_atual < v) return false;
            _atual -= v;
            EventBus.emit('energia:update', { atual: _atual, max: MAX });
            return true;
        },
        load(v)     { _atual = clamp(v ?? MAX, 0, MAX); },
        save()      { return _atual; }
    };
})();

// ════════════════════════════════════════
//  UPGRADES
// ════════════════════════════════════════
const Upgrades = (() => {
    const _def = {
        forca:      { nivel: 1, base: 5,   mult: 1.50, cBase: 15,  cCres: 1.60 },
        rosa:       { nivel: 1, base: 3,   mult: 1.40, cBase: 20,  cCres: 1.65 },
        velocidade: { nivel: 1, base: 1.0, mult: 1.10, cBase: 30,  cCres: 1.70 },
        dps:        { nivel: 1, base: 2,   mult: 1.60, cBase: 25,  cCres: 1.70 },
        critico:    { nivel: 0, base: 0.05,mult: 1.20, cBase: 50,  cCres: 1.75 }, // novo
        multi:      { nivel: 0, base: 0.0, mult: 1.30, cBase: 80,  cCres: 1.80 }, // novo
    };

    function get(tipo) { return _def[tipo]; }

    function dano(tipo) {
        const u = _def[tipo];
        return Math.floor(u.base * Math.pow(u.mult, u.nivel - 1));
    }
    function custo(tipo) {
        const u = _def[tipo];
        return Math.floor(u.cBase * Math.pow(u.cCres, u.nivel - 1));
    }
    function bonus(tipo) {
        const u = _def[tipo];
        return parseFloat((u.base * Math.pow(u.mult, u.nivel - 1)).toFixed(3));
    }

    function comprar(tipo) {
        const u = _def[tipo];
        if (!u) return false;
        const c = custo(tipo);
        if (!Economy.spendMoeda(c)) return false;
        u.nivel++;
        window._totalUpgrades = (window._totalUpgrades ?? 0) + 1;
        EventBus.emit('upgrade:comprado', { tipo, nivel: u.nivel });
        return true;
    }

    function calcDanoClick() {
        const base = dano('forca') + dano('rosa');
        const vel  = bonus('velocidade');
        const crit = _def.critico.nivel > 0 ? bonus('critico') : 0;
        const mult2 = _def.multi.nivel > 0 ? (1 + bonus('multi')) : 1;
        // Chance de crítico x3
        const isCrit = Math.random() < crit;
        return Math.floor(base * vel * mult2 * (isCrit ? 3 : 1));
    }
    function calcDps() { return dano('dps'); }

    function load(data) {
        if (!data) return;
        Object.entries(data).forEach(([k, v]) => {
            if (_def[k]) _def[k].nivel = v;
        });
    }
    function save() {
        return Object.fromEntries(Object.entries(_def).map(([k, v]) => [k, v.nivel]));
    }

    return { get, dano, custo, bonus, comprar, calcDanoClick, calcDps, load, save, all: _def };
})();

// ════════════════════════════════════════
//  PERSONAGEM
// ════════════════════════════════════════
const Personagem = (() => {
    let _nivel = 1, _exp = 0, _expMax = 100;

    function ganharExp(qtd) {
        _exp += qtd;
        let levelUp = false;
        while (_exp >= _expMax) {
            _exp    -= _expMax;
            _nivel++;
            _expMax  = Math.floor(100 * Math.pow(1.35, _nivel - 1));
            levelUp  = true;
        }
        if (levelUp) EventBus.emit('personagem:levelup', _nivel);
    }

    return {
        get nivel()  { return _nivel; },
        get exp()    { return _exp; },
        get expMax() { return _expMax; },
        get pct()    { return _exp / _expMax; },
        ganharExp,
        load(d) { _nivel = d?.nivel ?? 1; _exp = d?.exp ?? 0; _expMax = d?.expMax ?? 100; },
        save()  { return { nivel: _nivel, exp: _exp, expMax: _expMax }; }
    };
})();

// ════════════════════════════════════════
//  ESTÁGIO E INIMIGO
// ════════════════════════════════════════
const BattleState = (() => {
    let _estagio  = 1;
    let _emBatalha = false;

    // Dados do inimigo ativo
    const _inimigo = {
        nome: '', hp: 0, maxHp: 0, nivel: 1,
        rMoeda: 0, rGema: 0, tipo: 0, chefe: false
    };

    function configurarInimigo(e) {
        const idx   = e % 10 === 0 ? 3 : Math.floor((e - 1) / 3) % (tiposMonstros.length - 1);
        const tipo  = tiposMonstros[idx];
        const chefe = e % 10 === 0;

        _inimigo.nome   = tipo.nome + (chefe ? ' ☠' : '') + ' Lv.' + e;
        _inimigo.nivel  = e;
        _inimigo.tipo   = idx;
        _inimigo.chefe  = chefe;
        _inimigo.maxHp  = Math.floor(70 * Math.pow(1.24, e));
        _inimigo.hp     = _inimigo.maxHp;
        _inimigo.rMoeda = Math.floor(8 * Math.pow(1.18, e));
        _inimigo.rGema  = chefe ? Math.floor(5 + e / 4) : (Math.random() < 0.06 ? 1 : 0);

        EventBus.emit('inimigo:configurado', { ..._inimigo });
        setTimeout(() => EventBus.emit('inimigo:fala', tipo.nome), 1000);
    }

    function darDano(valor) {
        if (!_emBatalha || valor <= 0) return;
        _inimigo.hp -= valor;
        EventBus.emit('inimigo:dano', { valor, hp: _inimigo.hp, maxHp: _inimigo.maxHp });
        if (_inimigo.hp <= 0) _matarInimigo();
    }

    function _matarInimigo() {
        Economy.addMoeda(_inimigo.rMoeda);
        if (_inimigo.rGema > 0) Economy.addGema(_inimigo.rGema);
        Personagem.ganharExp(5 + _estagio * 2);
        window._totalKills = (window._totalKills ?? 0) + 1;
        EventBus.emit('inimigo:morto', { ..._inimigo, estagio: _estagio });
        _estagio++;
        configurarInimigo(_estagio);
        EventBus.emit('estagio:update', _estagio);
    }

    return {
        get estagio()   { return _estagio; },
        get emBatalha() { return _emBatalha; },
        get inimigo()   { return _inimigo; },

        iniciar() {
            _emBatalha = true;
            configurarInimigo(_estagio);
            EventBus.emit('batalha:inicio', _estagio);
        },
        sair() {
            _emBatalha = false;
            EventBus.emit('batalha:fim');
        },
        darDano,

        irEstagio(e) {
            _estagio = Math.max(1, e);
            configurarInimigo(_estagio);
            EventBus.emit('estagio:update', _estagio);
        },
        anterior() { if (_estagio > 1) { _estagio--; configurarInimigo(_estagio); EventBus.emit('estagio:update', _estagio); } },
        proximo()  { _estagio++; configurarInimigo(_estagio); EventBus.emit('estagio:update', _estagio); },
        chefe()    { _estagio = Math.ceil(_estagio / 10) * 10; configurarInimigo(_estagio); EventBus.emit('estagio:update', _estagio); },

        prestigiar() {
            if (_estagio < CONFIG.ESTAGIO_PRESTIGIO) return false;
            _estagio = 1;
            Economy.load({ moeda: 0, gema: Economy.gema });
            Object.values(Upgrades.all).forEach(u => u.nivel = 1);
            window._totalPrestígios = (window._totalPrestígios ?? 0) + 1;
            configurarInimigo(1);
            EventBus.emit('prestigio:feito');
            return true;
        },

        load(d) {
            _estagio = d?.estagio ?? 1;
            _emBatalha = false;
        },
        save() { return { estagio: _estagio }; }
    };
})();

// ════════════════════════════════════════
//  INVENTÁRIO GACHA
// ════════════════════════════════════════
const Inventario = (() => {
    let _herois = [];
    let _armas  = [];
    let _equipado = null;

    return {
        get herois()    { return [..._herois]; },
        get armas()     { return [..._armas];  },
        get equipado()  { return _equipado;    },
        get bonusDano() { return _equipado?.dano ?? 0; },

        addItem(item) {
            if (item.arma && !item.dano) _herois.push(item);
            else _armas.push(item);
            EventBus.emit('inventario:update');
        },
        addMany(itens)  { itens.forEach(i => this.addItem(i)); },

        equipar(nomeItem) {
            const item = _armas.find(a => a.nome === nomeItem);
            if (!item) return false;
            _equipado = item;
            EventBus.emit('inventario:equipado', item);
            return true;
        },

        load(d) {
            _herois   = d?.herois  ?? [];
            _armas    = d?.armas   ?? [];
            _equipado = d?.equipado ?? null;
        },
        save() { return { herois: _herois, armas: _armas, equipado: _equipado }; }
    };
})();
