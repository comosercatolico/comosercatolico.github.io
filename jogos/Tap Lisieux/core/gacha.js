// ═══════════════════════════════════════════════════════════
//  GACHA.JS — Sistema de invocação + conquistas
// ═══════════════════════════════════════════════════════════
"use strict";

// ════════════════════════════════════════
//  GACHA SYSTEM (com pity completo)
// ════════════════════════════════════════
const GachaSystem = (() => {
    let _pity      = 0;
    let _history   = [];

    function _chanceLend() {
        if (_pity >= CONFIG.PITY_MAX) return 1.0;
        if (_pity >= CONFIG.PITY_SUAVE) {
            return CONFIG.CHANCE_LEND_BASE + 0.065 * (_pity - CONFIG.PITY_SUAVE);
        }
        return CONFIG.CHANCE_LEND_BASE;
    }

    function _raridade() {
        const r = Math.random();
        if (r < _chanceLend())          return 'Lendário';
        if (r < CONFIG.CHANCE_EPICO)    return 'Épico';
        if (r < CONFIG.CHANCE_RARO)     return 'Raro';
        return 'Comum';
    }

    function _pull(pool) {
        _pity++;
        const rar  = _raridade();
        let cands  = pool.filter(i => i.raridade === rar);
        if (!cands.length) cands = pool.filter(i => i.raridade === 'Comum');
        const item = cands[Math.floor(Math.random() * cands.length)];
        if (item.raridade === 'Lendário') _pity = 0;
        _history.push({ item: item.nome, raridade: item.raridade, num: _history.length + 1 });
        return item;
    }

    return {
        get pityAtual()   { return _pity; },
        get historico()   { return [..._history]; },
        pullsAteLend()    { return CONFIG.PITY_MAX - _pity; },
        setPity(v)        { _pity = Number(v) || 0; },
        pull(pool)        { return _pull(pool); },
    };
})();

// ════════════════════════════════════════
//  FUNÇÃO PRINCIPAL DE INVOCAR
// ════════════════════════════════════════
function invocar(qtd) {
    const custo = qtd === 10 ? CONFIG.CUSTO_PULL_10 : CONFIG.CUSTO_PULL_1 * qtd;
    if (!Economy.spendGema(custo)) {
        ToastSystem.mostrar(`❌ Gemas insuficientes! Precisa de 💎${fmtNum(custo)}`, 'erro');
        EventBus.emit('gacha:fail', { custo });
        return;
    }

    const resultados = Array.from({ length: qtd }, () => GachaSystem.pull(POOL_TOTAL));
    Inventario.addMany(resultados);

    window._totalPulls = (window._totalPulls ?? 0) + qtd;

    const lend = resultados.filter(r => r.raridade === 'Lendário');
    const epic = resultados.filter(r => r.raridade === 'Épico');

    // Toast especial para lendário
    if (lend.length > 0) {
        lend.forEach(l => {
            ToastSystem.mostrar(`🌟 LENDÁRIO! ${l.emoji} ${l.nome}`, 'lendario', 5500);
        });
    } else if (epic.length > 0) {
        ToastSystem.mostrar(`💜 Épico obtido! ${epic[0].emoji} ${epic[0].nome}`, 'epico', 4000);
    }

    EventBus.emit('gacha:resultado', { resultados, lend: lend.length, epic: epic.length, qtd });
    ConquistasSystem.verificar();
}

// ════════════════════════════════════════
//  SISTEMA DE CONQUISTAS
// ════════════════════════════════════════
const conquistasDesbloqueadas = new Set();

const ConquistasSystem = (() => {
    function verificar() {
        CONQUISTAS_DEF.forEach(c => {
            if (conquistasDesbloqueadas.has(c.id)) return;
            try {
                if (!c.check()) return;
            } catch { return; }

            conquistasDesbloqueadas.add(c.id);

            // Recompensa
            if (c.recompensa.gema)  Economy.addGema(c.recompensa.gema);
            if (c.recompensa.moeda) Economy.addMoeda(c.recompensa.moeda);

            ToastSystem.mostrar(`🏆 ${c.emoji} ${c.nome}!`, 'sucesso', 4500);
            EventBus.emit('conquista:desbloqueada', c);
        });
    }

    return { verificar };
})();

// Verifica conquistas ao matar inimigos e ao fazer upgrades
EventBus.on('inimigo:morto', () => ConquistasSystem.verificar());
EventBus.on('upgrade:comprado', () => ConquistasSystem.verificar());
EventBus.on('estagio:update', () => ConquistasSystem.verificar());
EventBus.on('prestigio:feito', () => ConquistasSystem.verificar());
EventBus.on('gacha:resultado', () => ConquistasSystem.verificar());
