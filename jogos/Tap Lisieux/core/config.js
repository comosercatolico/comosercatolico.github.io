// ═══════════════════════════════════════════════════════════
//  CONFIG.JS — Configurações centrais e constantes do jogo
// ═══════════════════════════════════════════════════════════
"use strict";

const CONFIG = Object.freeze({
    // ── Versão do save ──
    SAVE_VERSION: 3,
    SAVE_KEY: "taplisieux_v3",
    SAVE_INTERVAL_MS: 20_000,

    // ── Assets ──
    ASSET_BASE: "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/",

    // ── Renderização ──
    TARGET_FPS: 60,

    // ── Lobby ──
    TILE: 32,
    MAP_W: 100,
    MAP_H: 100,

    // ── Batalha ──
    QTD_FLORES_CEU: 18,
    DPS_INTERVAL_MS: 1000,
    FALA_INTERVAL_MS: 8000,
    FALA_DURACAO_MS: 3200,
    FALA_CHANCE: 0.28,
    ESTAGIO_PRESTIGIO: 60,

    // ── Economia ──
    GEMA_INICIAL: 50,
    MOEDA_INICIAL: 0,
    ENERGIA_MAX: 100,
    ENERGIA_RECARGA_MS: 30_000,

    // ── Gacha ──
    CUSTO_PULL_1: 100,
    CUSTO_PULL_10: 900,
    PITY_MAX: 90,
    PITY_SUAVE: 75,
    CHANCE_LEND_BASE: 0.006,
    CHANCE_EPICO: 0.051,
    CHANCE_RARO: 0.201,

    // ── UI ──
    UI_THROTTLE_MS: 150,
    TOAST_DURACAO_MS: 3500,

    // ── Offline ──
    MAX_OFFLINE_HORAS: 8,
});

// ── Paleta de raridades ──
const RARIDADE_COR = Object.freeze({
    "Comum":    { hex: "#8898aa", glow: "rgba(136,152,170,0.4)", bg: "rgba(136,152,170,0.08)" },
    "Raro":     { hex: "#4a8fff", glow: "rgba(74,143,255,0.45)", bg: "rgba(74,143,255,0.09)"  },
    "Épico":    { hex: "#c052ff", glow: "rgba(192,82,255,0.50)", bg: "rgba(192,82,255,0.10)"  },
    "Lendário": { hex: "#f5a623", glow: "rgba(245,166,35,0.55)", bg: "rgba(245,166,35,0.11)"  },
});
