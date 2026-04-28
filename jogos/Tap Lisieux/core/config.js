// ═══════════════════════════════════════════════════════════
//  CONFIG.JS — Configurações centrais e constantes do jogo
//  Tap Lisieux — Balanceamento estilo Tap Titans 2 / AFK Arena
// ═══════════════════════════════════════════════════════════
"use strict";

const CONFIG = Object.freeze({

    // ════════════════════════════════════════
    //  SAVE
    // ════════════════════════════════════════
    SAVE_VERSION:       3,
    SAVE_KEY:           "taplisieux_v3",
    SAVE_INTERVAL_MS:   20000,

    // ════════════════════════════════════════
    //  ASSETS
    // ════════════════════════════════════════
    ASSET_BASE: "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/",

    // ════════════════════════════════════════
    //  RENDERIZAÇÃO
    // ════════════════════════════════════════
    TARGET_FPS:         60,

    // ════════════════════════════════════════
    //  LOBBY / MAPA
    // ════════════════════════════════════════
    TILE:               32,
    MAP_W:              100,
    MAP_H:              100,

    // ════════════════════════════════════════
    //  BATALHA
    // ════════════════════════════════════════
    QTD_FLORES_CEU:     18,
    DPS_INTERVAL_MS:    1000,
    FALA_INTERVAL_MS:   8000,
    FALA_DURACAO_MS:    3200,
    FALA_CHANCE:        0.28,

    // ════════════════════════════════════════
    //  PROGRESSÃO
    // ════════════════════════════════════════
    ESTAGIO_PRESTIGIO:  60,     // estágio mínimo para prestigiar

    // ════════════════════════════════════════
    //  ECONOMIA — Moeda
    // ════════════════════════════════════════
    MOEDA_INICIAL:          0,
    MOEDA_BASE_KILL:        12,     // moeda base por kill no estágio 1
    MOEDA_ESCALA:           1.13,   // fator de escala por estágio (suave)
    MOEDA_CHEFE_MULT:       8,      // chefe vale 8x a moeda normal

    // ════════════════════════════════════════
    //  ECONOMIA — Gema
    // ════════════════════════════════════════
    GEMA_INICIAL:           50,
    GEMA_CHANCE_NORMAL:     0.04,   // 4% de chance de drop em kill normal
    GEMA_CHEFE_BASE:        3,      // gemas garantidas ao matar chefe
    GEMA_CHEFE_ESCALA:      0.15,   // +0.15 gema por estágio no chefe

    // ════════════════════════════════════════
    //  ECONOMIA — Energia
    // ════════════════════════════════════════
    ENERGIA_MAX:            100,
    ENERGIA_RECARGA_MS:     30000,  // 1 energia a cada 30s = full em 50min

    // ════════════════════════════════════════
    //  ECONOMIA — Experiência
    // ════════════════════════════════════════
    EXP_BASE_KILL:          8,      // exp base por kill
    EXP_ESCALA_ESTAGIO:     2.2,    // exp extra por estágio

    // ════════════════════════════════════════
    //  PRESTÍGIO
    // ════════════════════════════════════════
    PRESTIGIO_GEMA_BONUS:   20,     // gemas base ao prestigiar
    // bônus extra = (estagio - ESTAGIO_PRESTIGIO) * 0.5

    // ════════════════════════════════════════
    //  GACHA
    // ════════════════════════════════════════
    CUSTO_PULL_1:           100,    // 1 invocação = 100 gemas
    CUSTO_PULL_10:          900,    // 10 invocações = 900 gemas (10% desconto)
    PITY_MAX:               90,     // lendário garantido no pull 90
    PITY_SUAVE:             75,     // soft pity começa no pull 75
    CHANCE_LEND_BASE:       0.006,  // 0.6% base
    CHANCE_EPICO:           0.051,  // 5.1%
    CHANCE_RARO:            0.201,  // 20.1%
    // Comum preenche o resto (~74.2%)

    // ════════════════════════════════════════
    //  UI
    // ════════════════════════════════════════
    UI_THROTTLE_MS:         150,    // throttle de atualização dos HUDs
    TOAST_DURACAO_MS:       3500,   // duração das notificações

    // ════════════════════════════════════════
    //  OFFLINE
    // ════════════════════════════════════════
    MAX_OFFLINE_HORAS:      8,      // cap de progresso offline em horas
});

// ════════════════════════════════════════
//  RARIDADE — Paleta visual
// ════════════════════════════════════════
const RARIDADE_COR = Object.freeze({
    "Comum":    {
        hex:  "#8898aa",
        glow: "rgba(136, 152, 170, 0.40)",
        bg:   "rgba(136, 152, 170, 0.08)",
    },
    "Raro":     {
        hex:  "#4a8fff",
        glow: "rgba( 74, 143, 255, 0.45)",
        bg:   "rgba( 74, 143, 255, 0.09)",
    },
    "Épico":    {
        hex:  "#c052ff",
        glow: "rgba(192,  82, 255, 0.50)",
        bg:   "rgba(192,  82, 255, 0.10)",
    },
    "Lendário": {
        hex:  "#f5a623",
        glow: "rgba(245, 166,  35, 0.55)",
        bg:   "rgba(245, 166,  35, 0.11)",
    },
});

// ════════════════════════════════════════
//  RARIDADE — Chances acumuladas (para validação)
// ════════════════════════════════════════
const RARIDADE_CHANCE = Object.freeze({
    "Lendário": CONFIG.CHANCE_LEND_BASE,                                            // 0.60%
    "Épico":    CONFIG.CHANCE_LEND_BASE + CONFIG.CHANCE_EPICO,                      // 5.70%
    "Raro":     CONFIG.CHANCE_LEND_BASE + CONFIG.CHANCE_EPICO + CONFIG.CHANCE_RARO, // 25.80%
    "Comum":    1.0,                                                                 // resto
});
