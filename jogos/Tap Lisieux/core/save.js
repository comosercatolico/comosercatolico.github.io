// ═══════════════════════════════════════════════════════════
//  SAVE.JS — Sistema de salvamento e progresso offline
// ═══════════════════════════════════════════════════════════
"use strict";

const SaveSystem = (() => {
    const KEY  = CONFIG.SAVE_KEY;
    const VER  = CONFIG.SAVE_VERSION;

    function salvar() {
        try {
            const data = {
                ver:        VER,
                timestamp:  Date.now(),
                economy:    Economy.save(),
                energia:    Energia.save(),
                upgrades:   Upgrades.save(),
                personagem: Personagem.save(),
                inventario: Inventario.save(),
                estagio:    BattleState.estagio,
                gacha: {
                    pity:       GachaSystem.pityAtual,
                    totalPulls: window._totalPulls ?? 0,
                },
                stats: {
                    kills:       window._totalKills      ?? 0,
                    upgrades:    window._totalUpgrades   ?? 0,
                    prestigios:  window._totalPrestígios ?? 0,
                    crits:       window._totalCrits      ?? 0,
                },
                conquistas: [...conquistasDesbloqueadas],
            };
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[Save] Falha:', e);
        }
    }

    function carregar() {
        try {
            const raw  = localStorage.getItem(KEY);
            if (!raw)  return null;
            const data = JSON.parse(raw);
            if (data.ver !== VER) {
                console.warn('[Save] Versão antiga — resetando.');
                localStorage.removeItem(KEY);
                return null;
            }
            return data;
        } catch {
            console.warn('[Save] Corrompido — resetando.');
            localStorage.removeItem(KEY);
            return null;
        }
    }

    function aplicar(data) {
        if (!data) return;
        Economy.load(data.economy);
        Energia.load(data.energia);
        Upgrades.load(data.upgrades);
        Personagem.load(data.personagem);
        Inventario.load(data.inventario);
        BattleState.load({ estagio: data.estagio });
        GachaSystem.setPity(data.gacha?.pity ?? 0);

        // Stats globais
        window._totalPulls      = data.gacha?.totalPulls ?? 0;
        window._totalKills      = data.stats?.kills       ?? 0;
        window._totalUpgrades   = data.stats?.upgrades    ?? 0;
        window._totalPrestígios = data.stats?.prestigios  ?? 0;
        window._totalCrits      = data.stats?.crits       ?? 0;

        // Conquistas
        (data.conquistas ?? []).forEach(id => conquistasDesbloqueadas.add(id));
    }

    function offlineProgress(data) {
        if (!data?.timestamp) return;
        const secs = Math.floor((Date.now() - data.timestamp) / 1000);
        const eff  = Math.min(secs, CONFIG.MAX_OFFLINE_HORAS * 3600);
        if (eff < 60) return;

        const moedas = Math.floor(Upgrades.calcDps() * eff * 0.5);
        if (moedas <= 0) return;

        Economy.addMoeda(moedas);
        const h = Math.floor(eff / 3600), m = Math.floor((eff % 3600) / 60);
        const tempo = h > 0 ? `${h}h ${m}min` : `${m}min`;
        ToastSystem.mostrar(`⏰ Offline ${tempo} → +${fmtNum(moedas)} 🪙`, 'sucesso', 5000);
    }

    function autoSave() {
        setInterval(salvar, CONFIG.SAVE_INTERVAL_MS);
        window.addEventListener('beforeunload', salvar);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') salvar();
        });
    }

    function resetar() {
        localStorage.removeItem(KEY);
        location.reload();
    }

    return { salvar, carregar, aplicar, offlineProgress, autoSave, resetar };
})();
