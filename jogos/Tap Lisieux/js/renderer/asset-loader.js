// ═══════════════════════════════════════════════════════════
//  ASSET-LOADER.JS
//  Sistema completo de carregamento e cache de assets.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, imagens eram criadas com "new Image()"
//  espalhados em game-lobby.js e game-batalha.js. Sem
//  progresso de loading, sem retry em falha, sem cache
//  centralizado, sem remoção do fundo preto do piso1.png
//  de forma organizada.
//
//  SOLUÇÃO:
//  Sistema centralizado com manifesto declarativo de assets,
//  carregamento paralelo com Promise.allSettled(), retry
//  automático, barra de progresso, cache por chave e
//  processamento de imagem (remoção de fundo preto).
//
//  MANIFESTO DE ASSETS:
//  ┌─────────────────┬──────────────────────────────────────┐
//  │ Grupo           │ Assets                               │
//  ├─────────────────┼──────────────────────────────────────┤
//  │ batalha         │ cenario1.png, piso1.png (processado) │
//  │ santa           │ str-conjurando1-8.png (8 frames)     │
//  │ lobby_tiles     │ grama1-5.jpg, ti.png (estrada)       │
//  │ lobby_npc       │ anda1-9.png (9 frames de caminhada)  │
//  │ lobby_objetos   │ mesa, cadeiras, biblioteca           │
//  └─────────────────┴──────────────────────────────────────┘
//
//  PROCESSAMENTO piso1.png:
//  O piso tem fundo preto que precisa ser removido.
//  Usamos um canvas auxiliar offline para tornar pixels
//  escuros (brilho < 30) transparentes e pixels de borda
//  (brilho 30-60) semi-transparentes.
//
//  ESTADOS:
//  IDLE → CARREGANDO → COMPLETO
//                   ↘ ERRO (parcial — assets críticos faltando)
//
//  API:
//    AssetLoader.carregar()           → Promise<boolean>
//    AssetLoader.get(chave)           → HTMLImageElement|HTMLCanvasElement
//    AssetLoader.getSprite(grupo, n)  → frame N de uma sprite sheet
//    AssetLoader.pronto()             → boolean
//    AssetLoader.progresso()          → 0.0 a 1.0
//    AssetLoader.stats()              → objeto com detalhes
//    AssetLoader.recarregar(chave)    → recarrega 1 asset
//
//  Depende de: logger.js, event-bus.js
//  Usado por: renderer-lobby.js, renderer-battle.js, main.js
// ═══════════════════════════════════════════════════════════

"use strict";

const AssetLoader = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("AssetLoader"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[AssetLoader]",  ...a),
            error : (...a) => console.error("[AssetLoader]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        BASE_URL_BATALHA  : "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/",
        BASE_URL_LOCAL    : "tiles/",
        TIMEOUT_MS        : 15_000,   // timeout por asset
        MAX_RETRIES       : 2,        // tentativas antes de desistir
        RETRY_DELAY_MS    : 1_000,    // espera entre tentativas
        CROSS_ORIGIN      : "anonymous",

        // Processamento do piso1.png
        PISO_BRILHO_TRANSPARENTE : 30,   // pixels abaixo disso → alpha=0
        PISO_BRILHO_SUAVE        : 60,   // pixels até isso → alpha suave
    });

    // ════════════════════════════════════════
    // MANIFESTO DE ASSETS
    // Declarativo — adicionar asset = adicionar entrada
    // ════════════════════════════════════════

    /**
     * @typedef {object} AssetDef
     * @property {string}   chave      — identificador único
     * @property {string}   url        — URL relativa à base
     * @property {string}   base       — "batalha"|"local"
     * @property {string}   grupo      — agrupamento lógico
     * @property {boolean}  critico    — se falhar, o jogo não funciona
     * @property {boolean}  [processar]— aplica remoção de fundo preto
     * @property {boolean}  [crossOrigin]
     */
    const _MANIFESTO = Object.freeze([

        // ── BATALHA ──────────────────────────────
        {
            chave    : "cenario",
            url      : "piso-de-batalha/cenario1.png",
            base     : "batalha",
            grupo    : "batalha",
            critico  : false,
            processar: false
        },
        {
            chave    : "piso",
            url      : "piso-de-batalha/piso1.png",
            base     : "batalha",
            grupo    : "batalha",
            critico  : false,
            processar: true    // ← remoção de fundo preto
        },

        // ── SANTA (8 frames de animação) ─────────
        ...Array.from({ length: 8 }, (_, i) => ({
            chave    : `santa_${i}`,
            url      : `animation_summon/str-conjurando${i + 1}.png`,
            base     : "batalha",
            grupo    : "santa",
            critico  : false,
            processar: false
        })),

        // ── NPC LOBBY (9 frames de caminhada) ────
        ...Array.from({ length: 9 }, (_, i) => ({
            chave    : `npc_anda_${i}`,
            url      : `trzn/anda${i + 1}.png`,
            base     : "local",
            grupo    : "lobby_npc",
            critico  : false,
            processar: false
        })),

        // ── TILES DE GRAMA (5 variações) ─────────
        ...Array.from({ length: 5 }, (_, i) => ({
            chave    : `grama_${i}`,
            url      : `chaop1/grama${i + 1}.jpg`,
            base     : "local",
            grupo    : "lobby_tiles",
            critico  : true,
            processar: false
        })),

        // ── TILE DE ESTRADA ───────────────────────
        {
            chave    : "estrada",
            url      : "chaop1/ti.png",
            base     : "local",
            grupo    : "lobby_tiles",
            critico  : true,
            processar: false
        },

        // ── OBJETOS DO LOBBY ──────────────────────
        {
            chave    : "mesa",
            url      : "estruturas/mesa.png",
            base     : "local",
            grupo    : "lobby_objetos",
            critico  : false,
            processar: false
        },
        {
            chave    : "cadeira_esq",
            url      : "estruturas/cadeira_esquerda.png",
            base     : "local",
            grupo    : "lobby_objetos",
            critico  : false,
            processar: false
        },
        {
            chave    : "cadeira_dir",
            url      : "estruturas/cadeira_direita.png",
            base     : "local",
            grupo    : "lobby_objetos",
            critico  : false,
            processar: false
        },
        {
            chave    : "biblioteca",
            url      : "estruturas/bb.png",
            base     : "local",
            grupo    : "lobby_objetos",
            critico  : false,
            processar: false
        }
    ]);

    // ════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════

    // Cache principal: chave → HTMLImageElement | HTMLCanvasElement
    const _cache = new Map();

    // Estado de cada asset: chave → "pendente"|"ok"|"erro"|"fallback"
    const _status = new Map();

    // Contadores para progresso
    let _totalAssets    = _MANIFESTO.length;
    let _assetsCarreg   = 0;
    let _assetsFalhos   = 0;
    let _estadoGeral    = "IDLE";   // "IDLE"|"CARREGANDO"|"COMPLETO"|"ERRO"
    let _promiseGlobal  = null;

    // ════════════════════════════════════════
    // RESOLUÇÃO DE URL
    // ════════════════════════════════════════
    function _resolverUrl(def) {
        const base = def.base === "batalha"
            ? CFG.BASE_URL_BATALHA
            : CFG.BASE_URL_LOCAL;
        return base + def.url;
    }

    // ════════════════════════════════════════
    // CARREGAR UMA IMAGEM COM TIMEOUT E RETRY
    // ════════════════════════════════════════

    /**
     * Carrega uma única imagem com timeout e retry automático.
     *
     * @param {AssetDef} def
     * @param {number}   tentativa — 0-indexed
     * @returns {Promise<HTMLImageElement>}
     */
    function _carregarImagem(def, tentativa = 0) {
        return new Promise((resolve, reject) => {
            const url = _resolverUrl(def);
            const img = new Image();

            if (def.crossOrigin !== false) {
                img.crossOrigin = CFG.CROSS_ORIGIN;
            }

            // Timer de timeout
            let timer = setTimeout(() => {
                img.onload  = null;
                img.onerror = null;
                reject(new Error(`Timeout após ${CFG.TIMEOUT_MS}ms: ${url}`));
            }, CFG.TIMEOUT_MS);

            img.onload = () => {
                clearTimeout(timer);
                resolve(img);
            };

            img.onerror = () => {
                clearTimeout(timer);
                reject(new Error(`Falha ao carregar: ${url}`));
            };

            img.src = url;
        });
    }

    async function _carregarComRetry(def) {
        for (let tentativa = 0; tentativa <= CFG.MAX_RETRIES; tentativa++) {
            try {
                const img = await _carregarImagem(def, tentativa);
                return img;
            } catch (e) {
                if (tentativa < CFG.MAX_RETRIES) {
                    _log.warn(
                        `Tentativa ${tentativa + 1}/${CFG.MAX_RETRIES + 1} falhou` +
                        ` para "${def.chave}". Retentando em ${CFG.RETRY_DELAY_MS}ms...`
                    );
                    await _esperar(CFG.RETRY_DELAY_MS);
                } else {
                    throw e;
                }
            }
        }
    }

    function _esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ════════════════════════════════════════
    // PROCESSAR IMAGEM (remover fundo preto)
    // ════════════════════════════════════════

    /**
     * Remove o fundo preto de uma imagem via canvas auxiliar.
     * Pixels com brilho < BRILHO_TRANSPARENTE → alpha = 0
     * Pixels com brilho entre os limiares → alpha suave
     *
     * @param {HTMLImageElement} img
     * @returns {HTMLCanvasElement} — canvas processado
     */
    function _processarFundoPreto(img) {
        const canvas  = document.createElement("canvas");
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx       = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
            // CORS pode bloquear getImageData
            _log.warn(`_processarFundoPreto(): getImageData falhou (CORS?). Usando imagem original.`);
            return img;
        }

        const data  = imageData.data;
        const limT  = CFG.PISO_BRILHO_TRANSPARENTE;
        const limS  = CFG.PISO_BRILHO_SUAVE;

        for (let i = 0; i < data.length; i += 4) {
            const r      = data[i];
            const g      = data[i + 1];
            const b      = data[i + 2];
            const brilho = (r + g + b) / 3;

            if (brilho < limT) {
                // Totalmente transparente
                data[i + 3] = 0;
            } else if (brilho < limS) {
                // Borda suave — interpolação linear
                data[i + 3] = Math.floor(((brilho - limT) / (limS - limT)) * 255);
            }
            // Caso contrário: mantém alpha original
        }

        ctx.putImageData(imageData, 0, 0);

        _log.debug(
            `Processado: ${img.naturalWidth}×${img.naturalHeight}px` +
            ` → fundo preto removido.`
        );

        return canvas;
    }

    // ════════════════════════════════════════
    // PROCESSAR UM ASSET (carregar + processar)
    // ════════════════════════════════════════
    async function _processarAsset(def) {
        _status.set(def.chave, "pendente");

        try {
            let resultado = await _carregarComRetry(def);

            // Pós-processamento se necessário
            if (def.processar) {
                resultado = _processarFundoPreto(resultado);
            }

            _cache.set(def.chave, resultado);
            _status.set(def.chave, "ok");
            _assetsCarreg++;

            _log.debug(
                `✅ "${def.chave}"` +
                (def.processar ? " [processado]" : "") +
                ` (${_assetsCarreg}/${_totalAssets})`
            );

        } catch (e) {
            _status.set(def.chave, "erro");
            _assetsFalhos++;

            _log.warn(`⚠️ "${def.chave}" falhou: ${e.message}`);

            // Cria fallback para assets não-críticos
            if (!def.critico) {
                _cache.set(def.chave, _criarFallback(def));
                _status.set(def.chave, "fallback");
            }
        }

        // Atualiza barra de progresso
        _atualizarProgresso();
    }

    // ════════════════════════════════════════
    // FALLBACK VISUAL
    // Canvas colorido para assets que falharam
    // ════════════════════════════════════════
    function _criarFallback(def) {
        const canvas  = document.createElement("canvas");
        canvas.width  = 64;
        canvas.height = 64;
        const ctx     = canvas.getContext("2d");

        // Cor por grupo
        const cores = {
            "batalha"      : "#0e0930",
            "santa"        : "#6d28d9",
            "lobby_npc"    : "#2d5a27",
            "lobby_tiles"  : "#2ecc71",
            "lobby_objetos": "#8B4513"
        };

        ctx.fillStyle = cores[def.grupo] ?? "#444";
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = "#ffffff33";
        ctx.strokeRect(2, 2, 60, 60);

        // Ícone por grupo
        const icones = {
            "santa"       : "🌹",
            "lobby_npc"   : "🕊️",
            "lobby_tiles" : "🌿",
            "batalha"     : "⚔️"
        };
        ctx.font         = "28px serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icones[def.grupo] ?? "?", 32, 32);

        return canvas;
    }

    // ════════════════════════════════════════
    // ATUALIZAR PROGRESSO
    // ════════════════════════════════════════
    function _atualizarProgresso() {
        const pct = progresso();

        // Atualiza barra de loading no DOM
        try {
            const barra = document.getElementById("loadingBarra");
            if (barra) barra.style.width = `${Math.round(pct * 100)}%`;

            const txt = document.getElementById("loadingTexto");
            if (txt) {
                const carregados = _assetsCarreg + _assetsFalhos;
                txt.textContent = `Carregando assets... ${carregados}/${_totalAssets}`;
            }
        } catch { /* DOM pode não estar pronto */ }

        // Emite evento de progresso
        try {
            EventBus.emit("assets:progresso", {
                pct,
                carregados : _assetsCarreg,
                falhos     : _assetsFalhos,
                total      : _totalAssets
            });
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // ESCONDER TELA DE LOADING
    // ════════════════════════════════════════
    function _esconderLoading() {
        try {
            const tela = document.getElementById("telaLoading");
            if (!tela) return;

            tela.style.transition = "opacity 0.5s ease";
            tela.style.opacity    = "0";

            setTimeout(() => {
                tela.style.display = "none";
                _log.debug("Tela de loading ocultada.");
            }, 500);
        } catch { /* não crítico */ }
    }

    // ════════════════════════════════════════
    // CARREGAR TUDO
    // ════════════════════════════════════════

    /**
     * Inicia o carregamento de todos os assets do manifesto.
     * Usa Promise.allSettled() — não falha se um asset não crítico falhar.
     *
     * @returns {Promise<boolean>} — true se todos os críticos carregaram
     */
    async function carregar() {
        if (_estadoGeral === "CARREGANDO") {
            _log.warn("carregar(): já em andamento.");
            return _promiseGlobal;
        }

        if (_estadoGeral === "COMPLETO") {
            _log.debug("carregar(): assets já carregados.");
            return true;
        }

        _estadoGeral  = "CARREGANDO";
        _assetsCarreg = 0;
        _assetsFalhos = 0;
        _totalAssets  = _MANIFESTO.length;

        _log.info(`Carregando ${_totalAssets} assets...`);

        try {
            EventBus.emit("assets:iniciando", { total: _totalAssets });
        } catch { /* não crítico */ }

        const t0 = performance.now();

        // Carrega todos em paralelo (allSettled nunca rejeita)
        _promiseGlobal = (async () => {
            await Promise.allSettled(
                _MANIFESTO.map(def => _processarAsset(def))
            );

            const ms = Math.round(performance.now() - t0);

            // Verifica se assets críticos carregaram
            const criticosFalhos = _MANIFESTO
                .filter(d => d.critico && _status.get(d.chave) === "erro")
                .map(d => d.chave);

            if (criticosFalhos.length > 0) {
                _estadoGeral = "ERRO";
                _log.error(`Assets críticos falharam: [${criticosFalhos.join(", ")}]`);

                try {
                    EventBus.emit("assets:erro_critico", { assets: criticosFalhos });
                } catch { /* não crítico */ }

                return false;
            }

            _estadoGeral = "COMPLETO";

            _log.info(
                `Assets carregados em ${ms}ms` +
                ` | ✅ ${_assetsCarreg} ok` +
                (_assetsFalhos > 0 ? ` | ⚠️ ${_assetsFalhos} com fallback` : "")
            );

            // Esconde loading e emite evento de conclusão
            _esconderLoading();

            try {
                EventBus.emit("assets:completo", {
                    ok      : _assetsCarreg,
                    falhos  : _assetsFalhos,
                    total   : _totalAssets,
                    tempoMs : ms
                });
            } catch { /* não crítico */ }

            return true;
        })();

        return _promiseGlobal;
    }

    // ════════════════════════════════════════
    // ACESSO AOS ASSETS
    // ════════════════════════════════════════

    /**
     * Retorna um asset pelo ID.
     * Retorna null se não encontrado (nunca lança).
     *
     * @param {string} chave
     * @returns {HTMLImageElement|HTMLCanvasElement|null}
     */
    function get(chave) {
        const asset = _cache.get(chave);
        if (!asset) {
            _log.warn(`get("${chave}"): asset não encontrado no cache.`);
            return null;
        }
        return asset;
    }

    /**
     * Verifica se um asset está pronto e válido para desenhar.
     *
     * @param {string} chave
     * @returns {boolean}
     */
    function pronto(chave) {
        if (chave === undefined) {
            // Sem argumento → verifica se tudo carregou
            return _estadoGeral === "COMPLETO" || _estadoGeral === "ERRO";
        }

        const asset = _cache.get(chave);
        if (!asset) return false;

        // Canvas sempre está pronto
        if (asset instanceof HTMLCanvasElement) return true;

        // Imagem: verifica naturalWidth
        return asset.complete && asset.naturalWidth > 0;
    }

    /**
     * Retorna um frame de uma sprite sheet por grupo e índice.
     * Atalho para evitar concatenar strings manualmente.
     *
     * @param {string} grupo — "santa" | "lobby_npc" | "grama" | etc.
     * @param {number} idx   — índice 0-based
     * @returns {HTMLImageElement|HTMLCanvasElement|null}
     *
     * @example
     * AssetLoader.getSprite("santa",    pb.frame)   // str-conjurando{n}
     * AssetLoader.getSprite("npc_anda", santa.frame)
     * AssetLoader.getSprite("grama",    tile.tipo)
     */
    function getSprite(grupo, idx) {
        return get(`${grupo}_${idx}`);
    }

    /**
     * Retorna todos os frames de um grupo como array ordenado.
     * Útil para animações.
     *
     * @param {string} grupo
     * @returns {Array<HTMLImageElement|HTMLCanvasElement>}
     *
     * @example
     * const frames = AssetLoader.getFrames("santa");  // [frame0, ..., frame7]
     */
    function getFrames(grupo) {
        const frames = [];
        let   idx    = 0;

        while (true) {
            const chave = `${grupo}_${idx}`;
            // Para quando não há mais frames deste grupo
            if (!_MANIFESTO.some(d => d.chave === chave)) break;
            frames.push(_cache.get(chave) ?? null);
            idx++;
        }

        return frames;
    }

    // ════════════════════════════════════════
    // RECARREGAR UM ASSET
    // ════════════════════════════════════════

    /**
     * Recarrega um asset específico (ex: após falha de rede).
     *
     * @param {string} chave
     * @returns {Promise<boolean>}
     */
    async function recarregar(chave) {
        const def = _MANIFESTO.find(d => d.chave === chave);
        if (!def) {
            _log.warn(`recarregar("${chave}"): chave não encontrada no manifesto.`);
            return false;
        }

        _cache.delete(chave);
        _status.delete(chave);
        _assetsCarreg = Math.max(0, _assetsCarreg - 1);

        await _processarAsset(def);
        return _status.get(chave) === "ok";
    }

    // ════════════════════════════════════════
    // PROGRESSO
    // ════════════════════════════════════════

    /**
     * Retorna o progresso de carregamento de 0.0 a 1.0.
     */
    function progresso() {
        if (_totalAssets === 0) return 1;
        return Math.min(1, (_assetsCarreg + _assetsFalhos) / _totalAssets);
    }

    // ════════════════════════════════════════
    // ESTATÍSTICAS
    // ════════════════════════════════════════

    /**
     * Retorna estatísticas detalhadas do estado do loader.
     */
    function statsDetalhado() {
        const porGrupo     = {};
        const porStatus    = { ok: 0, erro: 0, fallback: 0, pendente: 0 };

        _MANIFESTO.forEach(def => {
            const st = _status.get(def.chave) ?? "pendente";

            if (!porGrupo[def.grupo]) {
                porGrupo[def.grupo] = { ok: 0, erro: 0, fallback: 0, total: 0 };
            }

            porGrupo[def.grupo].total++;
            if (st === "ok")       { porGrupo[def.grupo].ok++;       porStatus.ok++;       }
            if (st === "erro")     { porGrupo[def.grupo].erro++;     porStatus.erro++;     }
            if (st === "fallback") { porGrupo[def.grupo].fallback++; porStatus.fallback++; }
            if (st === "pendente") { porStatus.pendente++;                                 }
        });

        return {
            estado      : _estadoGeral,
            total       : _totalAssets,
            carregados  : _assetsCarreg,
            falhos      : _assetsFalhos,
            progresso   : progresso(),
            porGrupo,
            porStatus,
            cacheSize   : _cache.size
        };
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("AssetLoader — Status", () => {
            const s = statsDetalhado();
            _log.debug(`Estado       : ${s.estado}`);
            _log.debug(`Progresso    : ${Math.round(s.progresso * 100)}%`);
            _log.debug(`Carregados   : ${s.carregados} / ${s.total}`);
            _log.debug(`Falhos       : ${s.falhos}`);
            _log.debug(`Cache size   : ${s.cacheSize}`);
            _log.debug("── Por grupo ──────────────────");
            Object.entries(s.porGrupo).forEach(([grupo, gs]) => {
                _log.debug(
                    `  ${grupo.padEnd(16)}: ${gs.ok}✅ ${gs.erro}❌ ${gs.fallback}⚠️ / ${gs.total}`
                );
            });
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        // Reinicia loader ao resetar save (por segurança)
        EventBus.on("state:reset:total", () => {
            _log.debug("AssetLoader: reset detectado — assets permanecem no cache.");
            // Não relimpa o cache — os assets ainda são válidos
        });
    } catch { /* não crítico */ }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Carregamento
        carregar,
        recarregar,

        // Acesso
        get,
        getSprite,
        getFrames,
        pronto,

        // Estado
        progresso,

        // Diagnóstico
        statsDetalhado,
        logStatus,

        // Manifesto (readonly)
        get MANIFESTO() { return _MANIFESTO; },
        get CFG()       { return CFG;        },
        get estado()    { return _estadoGeral; }
    });

})();
