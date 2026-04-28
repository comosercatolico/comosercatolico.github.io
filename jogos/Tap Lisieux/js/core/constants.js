// ═══════════════════════════════════════════════════════════
//  jogos/Tap Lisieux/js/core/constants.js
//  Todas as constantes, enums e valores de balanceamento.
//  Nenhuma lógica aqui — só dados imutáveis.
//
//  REGRA: Se um número aparece em mais de um arquivo,
//  ele pertence aqui. Nunca use "magic numbers" nos módulos.
//
//  Usado por: TODOS os outros arquivos
// ═══════════════════════════════════════════════════════════

"use strict";

// ════════════════════════════════════════
//  BALANCEAMENTO GERAL
//  Extraído de: game-ui.js e game-batalha.js
// ════════════════════════════════════════

const BALANCE = Object.freeze({

    // ── Economia inicial ──
    MOEDA_INICIAL:          0,
    GEMA_INICIAL:           50,

    // ── Invocação (Gacha) ──
    CUSTO_INVOCACAO_1:      100,
    CUSTO_INVOCACAO_10:     900,        // desconto de 10% no x10

    // ── Pity ──
    PITY_MAXIMO:            90,         // lendário garantido no pull 90
    PITY_SUAVE:             75,         // soft pity começa aqui
    PITY_SUAVE_BONUS:       0.06,       // +6% de chance por pull acima do suave

    // ── Chances de raridade (acumulativas) ──
    CHANCE_LENDARIO_BASE:   0.006,      // 0,6% base
    CHANCE_EPICO:           0.051,      // 5,1% (inclui lendário)
    CHANCE_RARO:            0.201,      // 20,1% (inclui épico e lendário)
    // Comum = resto (≈74,3%)

    // ── Energia ──
    ENERGIA_MAX:            100,
    ENERGIA_RECARGA_MS:     30_000,     // +1 energia a cada 30s

    // ── Prestígio ──
    ESTAGIO_PRESTIGIO:      60,         // estágio mínimo para prestigiar

    // ── Progresso offline ──
    MAX_OFFLINE_HORAS:      8,          // máximo de horas de progresso offline
    OFFLINE_EFICIENCIA:     0.5,        // 50% do DPS real durante offline

    // ── Save ──
    SAVE_INTERVALO_MS:      30_000,     // auto-save a cada 30s
    SAVE_VERSION:           2,          // versão do formato de save

    // ── UI ──
    UI_THROTTLE_MS:         200,        // UI HTML atualiza 5x/segundo máximo

    // ── Canvas / Renderização ──
    TILE:                   32,         // tamanho de um tile em pixels (lobby)
    MAP_WIDTH:              100,        // largura do mapa em tiles
    MAP_HEIGHT:             100,        // altura do mapa em tiles
    QTD_FLORES_CEU:         14,         // rosas flutuando durante batalha

    // ── Batalha ──
    DPS_INTERVALO_MS:       1_000,      // DPS aplicado a cada 1s
    FALA_INTERVALO_MS:      9_000,      // intervalo entre falas do monstro
    FALA_DURACAO_MS:        3_500,      // duração da fala na tela
    FALA_CHANCE:            0.30,       // 30% de chance de falar

    // ── Inimigos ──
    INIMIGO_HP_BASE:        80,         // HP do inimigo no estágio 1
    INIMIGO_HP_MULT:        1.22,       // multiplicador de HP por estágio
    INIMIGO_MOEDA_BASE:     10,         // moedas base ao matar
    INIMIGO_MOEDA_MULT:     1.15,       // multiplicador de moedas por estágio
    INIMIGO_GEMA_CHANCE:    0.05,       // 5% de chance de dropar gema
    CHEFE_INTERVALO:        10,         // chefe a cada 10 estágios
    CHEFE_GEMA_BASE:        5,          // gemas mínimas do chefe

    // ── Upgrades ──
    // Força de Ataque
    FORCA_BASE:             5,
    FORCA_MULT:             1.50,
    FORCA_CUSTO_BASE:       15,
    FORCA_CUSTO_CRES:       1.60,

    // Poder das Rosas
    ROSA_BASE:              3,
    ROSA_MULT:              1.40,
    ROSA_CUSTO_BASE:        20,
    ROSA_CUSTO_CRES:        1.65,

    // Rapidez Celestial
    VEL_BASE:               1.0,
    VEL_MULT:               1.10,
    VEL_CUSTO_BASE:         30,
    VEL_CUSTO_CRES:         1.70,

    // Fé Passiva (DPS)
    DPS_BASE:               2,
    DPS_MULT:               1.60,
    DPS_CUSTO_BASE:         25,
    DPS_CUSTO_CRES:         1.70,

    // ── Personagem (Santa Teresinha) ──
    SANTA_EXP_BASE:         100,        // EXP necessária para o nível 2
    SANTA_EXP_MULT:         1.30,       // multiplicador de EXP por nível
    SANTA_ESCALA_BATALHA:   0.20,       // altura da Santa = 20% da tela
    SANTA_FRAMES:           8,          // frames de animação da Santa

    // ── Renderização da Santa no lobby ──
    SANTA_LOBBY_ESCALA:     0.28,
    SANTA_LOBBY_FRAMES:     9,
    SANTA_LOBBY_VELOCIDADE: 0.03,       // tiles por frame

    // ── Assets (URLs base) ──
    ASSET_BASE: "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/",

    // ── Posicionamento na batalha ──
    CHAO_Y_PCT:             0.78,       // chão em 78% da altura da tela
    SANTA_X_PCT:            0.46,       // Santa em 46% da largura
    MONSTRO_X_PCT:          0.50,       // monstro em 50% da largura
    MONSTRO_Y_PCT:          0.38,       // monstro em 38% da altura

});

// ════════════════════════════════════════
//  RARIDADES
//  Enum de raridades disponíveis no jogo
// ════════════════════════════════════════

const RARIDADE = Object.freeze({
    COMUM:    "Comum",
    RARO:     "Raro",
    EPICO:    "Épico",
    LENDARIO: "Lendário"
});

// ════════════════════════════════════════
//  CORES POR RARIDADE
//  Usadas em toda a UI (tags, bordas, textos)
//  Extraído de: game-ui.js (COR_RARIDADE)
// ════════════════════════════════════════

const COR_RARIDADE = Object.freeze({
    [RARIDADE.COMUM]:    "#aaaaaa",
    [RARIDADE.RARO]:     "#4a8fff",
    [RARIDADE.EPICO]:    "#b44dff",
    [RARIDADE.LENDARIO]: "#f5a623"
});

// ════════════════════════════════════════
//  BRILHO (GLOW) POR RARIDADE
//  Usado em efeitos de sombra e partículas
// ════════════════════════════════════════

const GLOW_RARIDADE = Object.freeze({
    [RARIDADE.COMUM]:    "rgba(170,170,170,0.4)",
    [RARIDADE.RARO]:     "rgba(74,143,255,0.6)",
    [RARIDADE.EPICO]:    "rgba(180,77,255,0.7)",
    [RARIDADE.LENDARIO]: "rgba(245,166,35,0.9)"
});

// ════════════════════════════════════════
//  TIPOS DE MOEDA
// ════════════════════════════════════════

const MOEDA_TIPO = Object.freeze({
    MOEDA: "moeda",   // moeda comum — ganha em batalha
    GEMA:  "gema"     // gema — usada para invocar
});

// ════════════════════════════════════════
//  ESTADOS DO JOGO
//  Enum para o estado atual da aplicação
// ════════════════════════════════════════

const ESTADO_JOGO = Object.freeze({
    LOADING:  "loading",    // carregando assets
    LOBBY:    "lobby",      // no mapa do lobby
    BATALHA:  "batalha",    // em batalha ativa
    PAUSADO:  "pausado",    // jogo pausado (modal aberto)
    MORTO:    "morto"       // derrota (futura expansão)
});

// ════════════════════════════════════════
//  EVENTOS DO EVENTBUS
//  Centraliza todos os nomes de eventos
//  para evitar typos espalhados pelo código
// ════════════════════════════════════════

const EVENTOS = Object.freeze({

    // ── Economia ──
    MOEDA_UPDATE:       "moeda:update",
    GEMA_UPDATE:        "gema:update",

    // ── Batalha ──
    BATALHA_INICIAR:    "batalha:iniciar",
    BATALHA_SAIR:       "batalha:sair",
    KILL_REGISTRADO:    "kill:registrado",
    ESTAGIO_UPDATE:     "estagio:update",
    CLICK_BATALHA:      "click:batalha",

    // ── Personagem ──
    LEVEL_UP:           "personagem:levelup",
    EXP_GANHOU:         "personagem:exp",

    // ── Upgrades ──
    UPGRADE_COMPRADO:   "upgrade:comprado",

    // ── Prestígio ──
    PRESTIGIO_FEITO:    "prestigio:feito",

    // ── Gacha ──
    GACHA_PULL:         "gacha:pull",
    ITEM_EQUIPADO:      "item:equipado",

    // ── Conquistas ──
    CONQUISTA_DESBLOQUEADA: "conquista:desbloqueada",

    // ── Missões ──
    QUEST_COMPLETADA:   "quest:completada",
    QUEST_COLETADA:     "quest:coletada",

    // ── Sistema ──
    JOGO_PRONTO:        "jogo:pronto",
    JOGO_SAIU:          "jogo:saiu",
    JOGO_VOLTOU:        "jogo:voltou",
    FPS_UPDATE:         "fps:update",
    CANVAS_RESIZE:      "canvas:resize",
    MODAL_FECHADO:      "modal:fechado"
});

// ════════════════════════════════════════
//  CATEGORIAS DE CONQUISTA
//  Para agrupar na tela de conquistas
// ════════════════════════════════════════

const CATEGORIA_CONQUISTA = Object.freeze({
    COMBATE:   "combate",
    ESTAGIO:   "estagio",
    UPGRADE:   "upgrade",
    GACHA:     "gacha",
    PRESTIGIO: "prestigio",
    ECONOMIA:  "economia",
    NIVEL:     "nivel"
});

// ════════════════════════════════════════
//  TIPOS DE MISSÃO
//  Para o sistema de quests diárias/semanais
// ════════════════════════════════════════

const TIPO_MISSAO = Object.freeze({
    KILL:    "kill",
    ESTAGIO: "estagio",
    UPGRADE: "upgrade",
    INVOCAR: "invocar",
    CLICK:   "click"
});

// ════════════════════════════════════════
//  DADOS DOS MONSTROS
//  Extraído de: game-batalha.js
// ════════════════════════════════════════

const NOMES_ESTAGIO = Object.freeze([
    "Jardim das Sombras",
    "Cripta Maldita",
    "Floresta Corrompida",
    "Vale das Trevas",
    "Torre do Mal",
    "Abismo Profundo",
    "Santuário Profanado",
    "Catedral Sombria",
    "Portal Infernal",
    "Domínio do Caos"
]);

const TIPOS_MONSTROS = Object.freeze([
    Object.freeze({
        nome:   "Demônio",
        emojis: Object.freeze({
            normal: "😈",
            dor:    "😖",
            medo:   "😱",
            raiva:  "👿"
        })
    }),
    Object.freeze({
        nome:   "Espírito Maligno",
        emojis: Object.freeze({
            normal: "👻",
            dor:    "😵",
            medo:   "😨",
            raiva:  "💢"
        })
    }),
    Object.freeze({
        nome:   "Sombra Corrompida",
        emojis: Object.freeze({
            normal: "🕷",
            dor:    "💀",
            medo:   "😰",
            raiva:  "🕷"
        })
    }),
    Object.freeze({
        nome:   "Chefe das Trevas",
        emojis: Object.freeze({
            normal: "💀",
            dor:    "😣",
            medo:   "😱",
            raiva:  "😡"
        })
    }),
    Object.freeze({
        nome:   "Anjo Caído",
        emojis: Object.freeze({
            normal: "😤",
            dor:    "🥴",
            medo:   "😰",
            raiva:  "🔥"
        })
    })
]);

const FALAS_MONSTROS = Object.freeze({
    "Demônio": Object.freeze([
        "Você é uma inútil mesmo!",
        "Nem suas orações te salvam!",
        "Que fraquinha!",
        "Vai chorar pro seu Deus?"
    ]),
    "Espírito Maligno": Object.freeze([
        "Florzinhas? Ridículo!",
        "Desista, santinha!",
        "Sua fé não vale nada!"
    ]),
    "Sombra Corrompida": Object.freeze([
        "A escuridão vence a luz!",
        "Suas rosas não têm poder aqui!"
    ]),
    "Chefe das Trevas": Object.freeze([
        "Eu sou eterno!",
        "A santa mais fraca que já enfrentei!"
    ]),
    "Anjo Caído": Object.freeze([
        "Caí por escolha!",
        "Agora sirvo a mim mesmo!"
    ])
});

// ════════════════════════════════════════
//  POOL DO GACHA — HERÓIS E ARMAS
//  Extraído de: game-ui.js
// ════════════════════════════════════════

const POOL_HEROIS = Object.freeze([
    Object.freeze({ nome: "Anjo Gabriel",  raridade: RARIDADE.RARO,     emoji: "😇",  arma: "Espada de Luz"    }),
    Object.freeze({ nome: "São Francisco", raridade: RARIDADE.COMUM,    emoji: "🕊️", arma: "Cajado Sagrado"   }),
    Object.freeze({ nome: "São José",      raridade: RARIDADE.COMUM,    emoji: "🔨",  arma: "Martelo Bento"    }),
    Object.freeze({ nome: "Santa Cecília", raridade: RARIDADE.EPICO,    emoji: "🎵",  arma: "Harpa Celestial"  }),
    Object.freeze({ nome: "São Miguel",    raridade: RARIDADE.LENDARIO, emoji: "⚔️",  arma: "Lança Divina"     }),
    Object.freeze({ nome: "Santa Luzia",   raridade: RARIDADE.RARO,     emoji: "👁️", arma: "Vela da Graça"    }),
    Object.freeze({ nome: "Santo Antônio", raridade: RARIDADE.RARO,     emoji: "📖",  arma: "Livro Sagrado"    }),
    Object.freeze({ nome: "São Bento",     raridade: RARIDADE.EPICO,    emoji: "✝️",  arma: "Cruz de São Bento"})
]);

const POOL_ARMAS = Object.freeze([
    Object.freeze({ nome: "Rosas Sagradas",       raridade: RARIDADE.COMUM,    emoji: "🌹", dano: 50  }),
    Object.freeze({ nome: "Lírios do Céu",         raridade: RARIDADE.RARO,     emoji: "🌸", dano: 120 }),
    Object.freeze({ nome: "Coroa de Espinhos",     raridade: RARIDADE.EPICO,    emoji: "👑", dano: 300 }),
    Object.freeze({ nome: "Pétala Divina",         raridade: RARIDADE.LENDARIO, emoji: "✨", dano: 800 }),
    Object.freeze({ nome: "Terço Abençoado",       raridade: RARIDADE.RARO,     emoji: "📿", dano: 110 }),
    Object.freeze({ nome: "Vela da Misericórdia",  raridade: RARIDADE.EPICO,    emoji: "🕯️",dano: 280 })
]);

// Pool completo — heróis + armas juntos para o gacha
const POOL_GACHA_TOTAL = Object.freeze([...POOL_HEROIS, ...POOL_ARMAS]);

// ════════════════════════════════════════
//  OBJETOS DO LOBBY
//  Extraído de: game-lobby.js
// ════════════════════════════════════════

const OBJETOS_LOBBY = Object.freeze([
    Object.freeze({ tipo: "biblioteca", tileX: 7,    tileY: 10,   escala: 0.90, layer: 0 }),
    Object.freeze({ tipo: "cadeiraEsq", tileX: 48.23,tileY: 49.8, escala: 0.22, layer: 0 }),
    Object.freeze({ tipo: "cadeiraDir", tileX: 51.77,tileY: 49.8, escala: 0.22, layer: 0 }),
    Object.freeze({ tipo: "mesa",       tileX: 50,   tileY: 50,   escala: 0.42, layer: 1 })
]);

// ════════════════════════════════════════
//  CORES DE TEXTO FLUTUANTE
//  Usado em renderer-battle.js / effects.js
// ════════════════════════════════════════

const COR_TEXTO = Object.freeze({
    click:   "#ff9de2",
    dps:     "#aaffaa",
    levelup: "#ffd700",
    padrao:  "#ffffff"
});

const TAM_TEXTO = Object.freeze({
    click:   22,
    dps:     14,
    levelup: 26,
    padrao:  20
});
// ← adiciona essas no final do arquivo
window.BALANCE            = BALANCE;
window.RARIDADE           = RARIDADE;
window.COR_RARIDADE       = COR_RARIDADE;
window.GLOW_RARIDADE      = GLOW_RARIDADE;
window.MOEDA_TIPO         = MOEDA_TIPO;
window.ESTADO_JOGO        = ESTADO_JOGO;
window.EVENTOS            = EVENTOS;
window.NOMES_ESTAGIO      = NOMES_ESTAGIO;
window.TIPOS_MONSTROS     = TIPOS_MONSTROS;
window.FALAS_MONSTROS     = FALAS_MONSTROS;
window.POOL_HEROIS        = POOL_HEROIS;
window.POOL_ARMAS         = POOL_ARMAS;
window.POOL_GACHA_TOTAL   = POOL_GACHA_TOTAL;
window.OBJETOS_LOBBY      = OBJETOS_LOBBY;
window.COR_TEXTO          = COR_TEXTO;
window.TAM_TEXTO          = TAM_TEXTO;
window.CATEGORIA_CONQUISTA= CATEGORIA_CONQUISTA;
window.TIPO_MISSAO        = TIPO_MISSAO;
