// ═══════════════════════════════════════════════════════════
//  ASSET-LOADER.JS — CORRIGIDO
//  Correções aplicadas:
//  1. window.AssetLoader = AssetLoader adicionado no final
//  2. _esconderLoading() REMOVIDO — main.js controla o loading
//  3. _promiseGlobal retorna corretamente em chamadas repetidas
// ═══════════════════════════════════════════════════════════

"use strict";

const AssetLoader = (() => {

    const _log = (() => {
        try   { return Logger.de("AssetLoader"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[AssetLoader]",  ...a),
            error : (...a) => console.error("[AssetLoader]", ...a)
        }; }
    })();

    const CFG = Object.freeze({
        BASE_URL_BATALHA  : "https://comosercatolico.github.io/jogos/Tap%20Lisieux/tiles/",
        BASE_URL_LOCAL    : "tiles/",
        TIMEOUT_MS        : 15_000,
        MAX_RETRIES       : 2,
        RETRY_DELAY_MS    : 1_000,
        CROSS_ORIGIN      : "anonymous",
        PISO_BRILHO_TRANSPARENTE : 30,
        PISO_BRILHO_SUAVE        : 60,
    });

    const _MANIFESTO = Object.freeze([
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
            processar: true
        },
        ...Array.from({ length: 8 }, (_, i) => ({
            chave    : `santa_${i}`,
            url      : `animation_summon/str-conjurando${i + 1}.png`,
            base     : "batalha",
            grupo    : "santa",
            critico  : false,
            processar: false
        })),
        ...Array.from({ length: 9 }, (_, i) => ({
            chave    : `npc_anda_${i}`,
            url      : `trzn/anda${i + 1}.png`,
            base     : "local",
            grupo    : "lobby_npc",
            critico  : false,
            processar: false
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
            chave    : `grama_${i}`,
            url      : `chaop1/grama${i + 1}.jpg`,
            base     : "local",
            grupo    : "lobby_tiles",
            critico  : true,
            processar: false
        })),
        {
            chave    : "estrada",
            url      : "chaop1/ti.png",
            base     : "local",
            grupo    : "lobby_tiles",
            critico  : true,
            processar: false
        },
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

    const _cache   = new Map();
    const _status  = new Map();

    let _totalAssets   = _MANIFESTO.length;
    let _assetsCarreg  = 0;
    let _assetsFalhos  = 0;
    let _estadoGeral   = "IDLE";
    let _promiseGlobal = null;

    function _resolverUrl(def) {
        const base = def.base === "batalha"
            ? CFG.BASE_URL_BATALHA
            : CFG.BASE_URL_LOCAL;
        return base + def.url;
    }

    function _carregarImagem(def) {
        return new Promise((resolve, reject) => {
            const url = _resolverUrl(def);
            const img = new Image();

            if (def.crossOrigin !== false) {
                img.crossOrigin = CFG.CROSS_ORIGIN;
            }

            let timer = setTimeout(() => {
                img.onload  = null;
                img.onerror = null;
                reject(new Error(`Timeout após ${CFG.TIMEOUT_MS}ms: ${url}`));
            }, CFG.TIMEOUT_MS);

            img.onload  = () => { clearTimeout(timer); resolve(img); };
            img.onerror = () => { clearTimeout(timer); reject(new Error(`Falha: ${url}`)); };
            img.src = url;
        });
    }

    async function _carregarComRetry(def) {
        for (let tentativa = 0; tentativa <= CFG.MAX_RETRIES; tentativa++) {
            try {
                return await _carregarImagem(def);
            } catch (e) {
                if (tentativa < CFG.MAX_RETRIES) {
                    _log.warn(`Retry ${tentativa + 1} para "${def.chave}"...`);
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

    function _processarFundoPreto(img) {
        const canvas  = document.createElement("canvas");
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx     = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
            _log.warn(`getImageData falhou (CORS?): usando original.`);
            return img;
        }

        const data = imageData.data;
        const limT = CFG.PISO_BRILHO_TRANSPARENTE;
        const limS = CFG.PISO_BRILHO_SUAVE;

        for (let i = 0; i < data.length; i += 4) {
            const brilho = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brilho < limT) {
                data[i+3] = 0;
            } else if (brilho < limS) {
                data[i+3] = Math.floor(((brilho - limT) / (limS - limT)) * 255);
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    async function _processarAsset(def) {
        _status.set(def.chave, "pendente");
        try {
            let resultado = await _carregarComRetry(def);
            if (def.processar) resultado = _processarFundoPreto(resultado);
            _cache.set(def.chave, resultado);
            _status.set(def.chave, "ok");
            _assetsCarreg++;
            _log.debug(`✅ "${def.chave}" (${_assetsCarreg}/${_totalAssets})`);
        } catch (e) {
            _status.set(def.chave, "erro");
            _assetsFalhos++;
            _log.warn(`⚠️ "${def.chave}" falhou: ${e.message}`);
            if (!def.critico) {
                _cache.set(def.chave, _criarFallback(def));
                _status.set(def.chave, "fallback");
            }
        }
        _atualizarProgresso();
    }

    function _criarFallback(def) {
        const canvas  = document.createElement("canvas");
        canvas.width  = 64;
        canvas.height = 64;
        const ctx     = canvas.getContext("2d");
        const cores   = { "batalha":"#0e0930","santa":"#6d28d9","lobby_npc":"#2d5a27","lobby_tiles":"#2ecc71","lobby_objetos":"#8B4513" };
        ctx.fillStyle = cores[def.grupo] ?? "#444";
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = "#ffffff33";
        ctx.strokeRect(2, 2, 60, 60);
        const icones  = { "santa":"🌹","lobby_npc":"🕊️","lobby_tiles":"🌿","batalha":"⚔️" };
        ctx.font         = "28px serif";
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icones[def.grupo] ?? "?", 32, 32);
        return canvas;
    }

    function _atualizarProgresso() {
        const pct = progresso();
        // ✅ Atualiza APENAS o texto secundário da barra — não controla display:none
        // A tela de loading é gerenciada exclusivamente pelo main.js
        try {
            const sub = document.getElementById("loadingSubTexto");
            if (sub) {
                const feitos = _assetsCarreg + _assetsFalhos;
                sub.textContent = `Assets: ${feitos}/${_totalAssets}`;
            }
        } catch { /* DOM pode não estar pronto */ }

        try {
            EventBus.emit("assets:progresso", {
                pct,
                carregados : _assetsCarreg,
                falhos     : _assetsFalhos,
                total      : _totalAssets
            });
        } catch { /* não crítico */ }
    }

    // ✅ _esconderLoading() REMOVIDO COMPLETAMENTE
    // O main.js é o único responsável por esconder a tela de loading

    async function carregar() {
        // ✅ Se já está carregando, retorna a mesma promise (sem criar nova)
        if (_estadoGeral === "CARREGANDO" && _promiseGlobal) {
            _log.warn("carregar(): já em andamento — retornando promise existente.");
            return _promiseGlobal;
        }

        // ✅ Se já completou, emite evento e retorna true imediatamente
        if (_estadoGeral === "COMPLETO") {
            _log.debug("carregar(): assets já carregados.");
            try { EventBus.emit("assets:completo", {}); } catch { /* não crítico */ }
            return true;
        }

        _estadoGeral  = "CARREGANDO";
        _assetsCarreg = 0;
        _assetsFalhos = 0;
        _totalAssets  = _MANIFESTO.length;

        _log.info(`Carregando ${_totalAssets} assets...`);
        try { EventBus.emit("assets:iniciando", { total: _totalAssets }); } catch { /* não crítico */ }

        const t0 = performance.now();

        // ✅ Atribui E retorna a promise corretamente
        _promiseGlobal = Promise.allSettled(
            _MANIFESTO.map(def => _processarAsset(def))
        ).then(() => {
            const ms = Math.round(performance.now() - t0);

            const criticosFalhos = _MANIFESTO
                .filter(d => d.critico && _status.get(d.chave) === "erro")
                .map(d => d.chave);

            if (criticosFalhos.length > 0) {
                _estadoGeral = "ERRO";
                _log.error(`Assets críticos falharam: [${criticosFalhos.join(", ")}]`);
                try { EventBus.emit("assets:erro_critico", { assets: criticosFalhos }); } catch { /* não crítico */ }
                return false;
            }

            _estadoGeral = "COMPLETO";
            _log.info(`Assets em ${ms}ms | ✅ ${_assetsCarreg} ok${_assetsFalhos > 0 ? ` | ⚠️ ${_assetsFalhos} fallback` : ""}`);

            // ✅ Emite evento mas NÃO esconde loading — main.js faz isso
            try {
                EventBus.emit("assets:completo", {
                    ok      : _assetsCarreg,
                    falhos  : _assetsFalhos,
                    total   : _totalAssets,
                    tempoMs : ms
                });
            } catch { /* não crítico */ }

            return true;
        });

        return _promiseGlobal;
    }

    function get(chave) {
        const asset = _cache.get(chave);
        if (!asset) {
            // Só loga warn se o carregamento já terminou
            if (_estadoGeral === "COMPLETO" || _estadoGeral === "ERRO") {
                _log.warn(`get("${chave}"): não encontrado no cache.`);
            }
            return null;
        }
        return asset;
    }

    function pronto(chave) {
        if (chave === undefined) return _estadoGeral === "COMPLETO" || _estadoGeral === "ERRO";
        const asset = _cache.get(chave);
        if (!asset) return false;
        if (asset instanceof HTMLCanvasElement) return true;
        return asset.complete && asset.naturalWidth > 0;
    }

    function getSprite(grupo, idx) {
        return get(`${grupo}_${idx}`);
    }

    function getFrames(grupo) {
        const frames = [];
        let   idx    = 0;
        while (true) {
            const chave = `${grupo}_${idx}`;
            if (!_MANIFESTO.some(d => d.chave === chave)) break;
            frames.push(_cache.get(chave) ?? null);
            idx++;
        }
        return frames;
    }

    async function recarregar(chave) {
        const def = _MANIFESTO.find(d => d.chave === chave);
        if (!def) { _log.warn(`recarregar("${chave}"): não encontrado.`); return false; }
        _cache.delete(chave);
        _status.delete(chave);
        _assetsCarreg = Math.max(0, _assetsCarreg - 1);
        await _processarAsset(def);
        return _status.get(chave) === "ok";
    }

    function progresso() {
        if (_totalAssets === 0) return 1;
        return Math.min(1, (_assetsCarreg + _assetsFalhos) / _totalAssets);
    }

    function statsDetalhado() {
        const porGrupo  = {};
        const porStatus = { ok: 0, erro: 0, fallback: 0, pendente: 0 };
        _MANIFESTO.forEach(def => {
            const st = _status.get(def.chave) ?? "pendente";
            if (!porGrupo[def.grupo]) porGrupo[def.grupo] = { ok:0, erro:0, fallback:0, total:0 };
            porGrupo[def.grupo].total++;
            if (st === "ok")       { porGrupo[def.grupo].ok++;       porStatus.ok++;       }
            if (st === "erro")     { porGrupo[def.grupo].erro++;     porStatus.erro++;     }
            if (st === "fallback") { porGrupo[def.grupo].fallback++; porStatus.fallback++; }
            if (st === "pendente") { porStatus.pendente++;                                 }
        });
        return { estado:_estadoGeral, total:_totalAssets, carregados:_assetsCarreg,
                 falhos:_assetsFalhos, progresso:progresso(), porGrupo, porStatus, cacheSize:_cache.size };
    }

    try {
        EventBus.on("state:reset:total", () => {
            _log.debug("Reset detectado — cache de assets mantido.");
        });
    } catch { /* não crítico */ }

    return Object.freeze({
        carregar, recarregar, get, getSprite, getFrames, pronto, progresso,
        statsDetalhado,
        get MANIFESTO() { return _MANIFESTO; },
        get CFG()       { return CFG;        },
        get estado()    { return _estadoGeral; }
    });

})();

// ✅ ESSENCIAL: expõe globalmente para que main.js encontre via _M.get("AssetLoader")
window.AssetLoader = AssetLoader;
