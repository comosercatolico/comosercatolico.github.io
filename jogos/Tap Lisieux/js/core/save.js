// ═══════════════════════════════════════════════════════
//  SAVE.JS
//  Sistema de save profissional:
//  - Slot duplo (A/B) com rotação — nunca perde save
//  - Auto-save a cada 30s + ao fechar/minimizar
//  - Compressão LZ-string opcional
//  - Checksum CRC32 para detectar corrupção
//  - Versionamento com migração automática
//  - Progresso offline calculado ao carregar
//  - Backup em memória (fallback se localStorage falhar)
//  - Export/Import JSON para backup manual
//  - Modo de emergência (sessionStorage) se localStorage cheio
//
//  Depende de: state.js, event-bus.js
//  Usado por: main.js
// ═══════════════════════════════════════════════════════

"use strict";

const SaveSystem = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("SaveSystem"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Chaves no localStorage
        KEY_SLOT_A        : "taplisieux_save_A_v3",
        KEY_SLOT_B        : "taplisieux_save_B_v3",
        KEY_META          : "taplisieux_meta_v3",     // qual slot é o mais recente

        // Versão do schema de save
        VERSAO            : 3,

        // Intervalos
        AUTO_SAVE_MS      : 30_000,
        OFFLINE_MAX_HORAS : 8,
        OFFLINE_EFICIENCIA: 0.5,    // 50% do DPS conta offline

        // Migração — versões antigas
        VERSOES_SUPORTADAS: [1, 2, 3],
    });

    // ════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════
    let _autoSaveTimer   = null;
    let _backupMemoria   = null;    // último save em memória (fallback)
    let _ultimoSalvo     = 0;
    let _slotAtivo       = "A";     // qual slot foi carregado
    let _inicializado    = false;

    // ════════════════════════════════════════════════════
    // CRC32 — checksum para detectar corrupção
    // Implementação simples sem dependências
    // ════════════════════════════════════════════════════
    const _CRC_TABLE = (() => {
        const t = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            t[i] = c;
        }
        return t;
    })();

    function _crc32(str) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < str.length; i++) {
            crc = _CRC_TABLE[(crc ^ str.charCodeAt(i)) & 0xFF] ^ (crc >>> 8);
        }
        return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16);
    }

    // ════════════════════════════════════════════════════
    // SNAPSHOT — captura o estado atual para salvar
    // ════════════════════════════════════════════════════
    function _snapshot() {
        try {
            return GameState.snapshot();
        } catch(e) {
            _log.warn("snapshot via GameState falhou — usando fallback:", e);

            // Fallback: lê variáveis globais legadas se existirem
            return {
                moeda               : window.moeda                ?? 0,
                gema                : window.gema                 ?? 50,
                estagio             : window.estagio              ?? 1,
                nivelPersonagem     : window.personagem?.nivel    ?? 1,
                expPersonagem       : window.personagem?.exp      ?? 0,
                expMaxPersonagem    : window.personagem?.expMax   ?? 100,
                heroisObtidos       : window.heroisObtidos        ?? [],
                equipamentosObtidos : window.equipamentosObtidos  ?? [],
                itemEquipado        : window.itemEquipado         ?? null,
                conquistasIds       : [...(window.conquistasDesbloqueadas ?? [])],
                totalPrestígios     : window._totalPrestígios     ?? 0,
                totalKills          : window._totalKills          ?? 0,
                totalUpgrades       : window._totalUpgrades       ?? 0,
                volumeMusica        : 0.7,
                volumeSfx           : 0.8,
                qualidade           : "alto",
            };
        }
    }

    // ════════════════════════════════════════════════════
    // SERIALIZAR / DESERIALIZAR
    // ════════════════════════════════════════════════════
    function _serializar(dados) {
        const payload = JSON.stringify(dados);
        const crc     = _crc32(payload);
        return JSON.stringify({ crc, payload });
    }

    function _deserializar(raw) {
        const envelope = JSON.parse(raw);

        // Formato legado (sem envelope)
        if (!envelope.crc || !envelope.payload) {
            return JSON.parse(raw);
        }

        // Verifica CRC
        const crcCalculado = _crc32(envelope.payload);
        if (crcCalculado !== envelope.crc) {
            throw new Error(`CRC inválido: esperado ${envelope.crc}, calculado ${crcCalculado}`);
        }

        return JSON.parse(envelope.payload);
    }

    // ════════════════════════════════════════════════════
    // STORAGE — tenta localStorage, cai para sessionStorage
    // ════════════════════════════════════════════════════
    function _escrever(chave, valor) {
        try {
            localStorage.setItem(chave, valor);
            return true;
        } catch(e) {
            // QuotaExceededError — tenta limpar slot antigo
            _log.warn("localStorage cheio — tentando emergência:", e);
            try {
                sessionStorage.setItem(chave, valor);
                return true;
            } catch(e2) {
                _log.error("sessionStorage também falhou:", e2);
                return false;
            }
        }
    }

    function _ler(chave) {
        try {
            return localStorage.getItem(chave)
                ?? sessionStorage.getItem(chave);
        } catch {
            return null;
        }
    }

    function _remover(chave) {
        try { localStorage.removeItem(chave);  } catch(_) {}
        try { sessionStorage.removeItem(chave); } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // SLOT DUPLO — rotação A/B
    // Garante que sempre há um save válido disponível
    // ════════════════════════════════════════════════════
    function _slotProximo(slot) {
        return slot === "A" ? "B" : "A";
    }

    function _chaveSlot(slot) {
        return slot === "A" ? CFG.KEY_SLOT_A : CFG.KEY_SLOT_B;
    }

    // ════════════════════════════════════════════════════
    // MIGRAÇÃO DE VERSÕES ANTIGAS
    // ════════════════════════════════════════════════════
    function _migrar(dados, versaoOrigem) {
        let d = { ...dados };

        // v1 → v2: adiciona campos de personagem
        if (versaoOrigem < 2) {
            d.nivelPersonagem  = d.personagem?.nivel ?? 1;
            d.expPersonagem    = d.personagem?.exp   ?? 0;
            d.expMaxPersonagem = d.personagem?.expMax ?? 100;
            delete d.personagem;

            // upgrades eram objeto com 'nivel' dentro
            if (d.upgrades && typeof d.upgrades === "object") {
                d.nivelForca      = d.upgrades.forca?.nivel      ?? 1;
                d.nivelRosa       = d.upgrades.rosa?.nivel       ?? 1;
                d.nivelVelocidade = d.upgrades.velocidade?.nivel ?? 1;
                d.nivelDps        = d.upgrades.dps?.nivel        ?? 1;
                delete d.upgrades;
            }

            // conquistasDesbloqueadas era um Set serializado como array
            if (Array.isArray(d.conquistas)) {
                d.conquistasIds = d.conquistas;
                delete d.conquistas;
            }

            _log.info("Save migrado: v1 → v2");
        }

        // v2 → v3: adiciona campos de config e stats
        if (versaoOrigem < 3) {
            d.volumeMusica       = d.volumeMusica   ?? 0.7;
            d.volumeSfx          = d.volumeSfx      ?? 0.8;
            d.qualidade          = d.qualidade       ?? "alto";
            d.totalPrestígios    = d.totalPrestígios ?? 0;
            d.totalKills         = d.totalKills      ?? 0;
            d.totalUpgrades      = d.totalUpgrades   ?? 0;
            d.titulosDesbloqueados = d.titulosDesbloqueados ?? [];
            d.maiorCombo         = d.maiorCombo      ?? 0;
            d.totalChefes        = d.totalChefes     ?? 0;

            // pity era top-level, agora fica em GameState
            if (typeof d.pity === "number") {
                d.pityGacha = d.pity;
                delete d.pity;
            }

            _log.info("Save migrado: v2 → v3");
        }

        d.versao = CFG.VERSAO;
        return d;
    }

    // ════════════════════════════════════════════════════
    // SALVAR
    // ════════════════════════════════════════════════════
    function salvar() {
        const estado = _snapshot();

        const dados = {
            ...estado,
            versao   : CFG.VERSAO,
            timestamp: Date.now(),
        };

        const raw = _serializar(dados);

        // Grava no slot alternado (não sobrescreve o slot atual ainda)
        const slotNovo = _slotProximo(_slotAtivo);
        const sucesso  = _escrever(_chaveSlot(slotNovo), raw);

        if (sucesso) {
            // Só então atualiza o meta (qual slot é o mais recente)
            _escrever(CFG.KEY_META, JSON.stringify({
                slot     : slotNovo,
                timestamp: dados.timestamp,
                versao   : CFG.VERSAO,
            }));
            _slotAtivo   = slotNovo;
            _ultimoSalvo = dados.timestamp;
        }

        // Sempre atualiza backup em memória
        _backupMemoria = dados;

        try { EventBus.emit("save:salvo", { timestamp: dados.timestamp, slot: slotNovo }); }
        catch(_) {}

        _log.debug(`Salvo no slot ${slotNovo} (${(raw.length / 1024).toFixed(1)} KB)`);
        return sucesso;
    }

    // ════════════════════════════════════════════════════
    // CARREGAR
    // ════════════════════════════════════════════════════
    function carregar() {
        // 1. Lê meta para saber qual slot é o mais recente
        const metaRaw  = _ler(CFG.KEY_META);
        let   slotPref = "A";

        if (metaRaw) {
            try {
                const meta = JSON.parse(metaRaw);
                slotPref   = meta.slot ?? "A";
            } catch(_) {}
        }

        // 2. Tenta carregar slot preferido primeiro, depois o alternativo
        const slots = [slotPref, _slotProximo(slotPref)];

        for (const slot of slots) {
            const dados = _tentarCarregarSlot(slot);
            if (dados) {
                _slotAtivo = slot;
                _log.info(`Save carregado do slot ${slot} (v${dados.versao}, ${new Date(dados.timestamp).toLocaleString()})`);
                return dados;
            }
        }

        // 3. Nenhum slot válido — tenta backup em memória
        if (_backupMemoria) {
            _log.warn("Nenhum slot válido — usando backup em memória.");
            return _backupMemoria;
        }

        // 4. Tenta salves legados (v1/v2)
        const legado = _tentarCarregarLegado();
        if (legado) return legado;

        _log.info("Nenhum save encontrado — começando do zero.");
        return null;
    }

    function _tentarCarregarSlot(slot) {
        const raw = _ler(_chaveSlot(slot));
        if (!raw) return null;

        try {
            const dados = _deserializar(raw);

            // Verifica versão
            if (!CFG.VERSOES_SUPORTADAS.includes(dados.versao)) {
                _log.warn(`Slot ${slot}: versão ${dados.versao} não suportada.`);
                return null;
            }

            // Migra se necessário
            const migrado = dados.versao < CFG.VERSAO
                ? _migrar(dados, dados.versao)
                : dados;

            return migrado;

        } catch(e) {
            _log.warn(`Slot ${slot} corrompido: ${e.message}`);
            _remover(_chaveSlot(slot));
            return null;
        }
    }

    function _tentarCarregarLegado() {
        // Chaves de versões antigas
        const chavesLegadas = [
            "taplisieux_save_v2",
            "taplisieux_save_v1",
            "taplisieux_save",
        ];

        for (const chave of chavesLegadas) {
            const raw = _ler(chave);
            if (!raw) continue;

            try {
                const dados = JSON.parse(raw);
                if (!dados) continue;

                const versaoOrigem = dados.versao ?? 1;
                const migrado = _migrar(dados, versaoOrigem);

                _log.info(`Save legado carregado de "${chave}" (v${versaoOrigem} → v${CFG.VERSAO})`);

                // Apaga a chave legada após migrar
                _remover(chave);

                // Salva imediatamente no novo formato
                setTimeout(salvar, 500);

                return migrado;
            } catch(e) {
                _log.warn(`Chave legada "${chave}" corrompida:`, e);
                _remover(chave);
            }
        }

        return null;
    }

    // ════════════════════════════════════════════════════
    // APLICAR SAVE AO GAMESTATE
    // ════════════════════════════════════════════════════
    function aplicar(dados) {
        if (!dados) return false;

        try {
            GameState.carregar(dados);
            _log.debug("Save aplicado ao GameState.");
            return true;
        } catch(e) {
            _log.warn("GameState.carregar falhou — aplicando manualmente:", e);

            // Fallback: aplica nas variáveis globais legadas
            try {
                if (typeof window.moeda  !== "undefined") window.moeda  = dados.moeda  ?? 0;
                if (typeof window.gema   !== "undefined") window.gema   = dados.gema   ?? 50;
                if (typeof window.estagio!== "undefined") window.estagio= dados.estagio?? 1;

                if (window.personagem) {
                    window.personagem.nivel  = dados.nivelPersonagem  ?? 1;
                    window.personagem.exp    = dados.expPersonagem    ?? 0;
                    window.personagem.expMax = dados.expMaxPersonagem ?? 100;
                }

                if (typeof window.heroisObtidos       !== "undefined") window.heroisObtidos       = dados.heroisObtidos       ?? [];
                if (typeof window.equipamentosObtidos !== "undefined") window.equipamentosObtidos = dados.equipamentosObtidos ?? [];
            } catch(e2) {
                _log.error("Aplicação manual também falhou:", e2);
                return false;
            }

            return true;
        }
    }

    // ════════════════════════════════════════════════════
    // PROGRESSO OFFLINE
    // ════════════════════════════════════════════════════
    function calcularOffline(dados) {
        if (!dados?.timestamp) return null;

        const agora       = Date.now();
        const delta       = agora - dados.timestamp;
        const maxMs       = CFG.OFFLINE_MAX_HORAS * 3_600_000;
        const efetivo     = Math.min(delta, maxMs);
        const segundos    = Math.floor(efetivo / 1000);

        if (segundos < 60) return null;   // menos de 1 min — ignora

        // Calcula DPS offline
        let dps = 0;
        try {
            // Tenta usar o módulo Damage
            dps = Damage.calcDps?.() ?? 0;
        } catch(_) {
            // Fallback: calcula do snapshot
            try {
                const nivel = dados.nivelDps ?? 1;
                dps = Math.floor(2 * Math.pow(1.60, nivel - 1));
            } catch(_) { dps = 0; }
        }

        const moedasGanhas = Math.floor(dps * segundos * CFG.OFFLINE_EFICIENCIA);

        const resultado = {
            segundos,
            moedasGanhas,
            dps,
            eficiencia: CFG.OFFLINE_EFICIENCIA,
        };

        if (moedasGanhas <= 0) return resultado;

        // Aplica as moedas
        try {
            GameState.increment("moeda", moedasGanhas);
            EventBus.emit("moeda:update", {
                valor: GameState.get("moeda"),
                delta: moedasGanhas,
            });
        } catch(_) {
            // Fallback legado
            if (typeof window.moeda !== "undefined") {
                window.moeda += moedasGanhas;
            }
        }

        return resultado;
    }

    /** Exibe toast com o progresso offline */
    function _notificarOffline(resultado) {
        if (!resultado || resultado.moedasGanhas <= 0) return;

        const { segundos, moedasGanhas } = resultado;
        const h   = Math.floor(segundos / 3600);
        const m   = Math.floor((segundos % 3600) / 60);
        const s   = segundos % 60;
        const txt = h > 0 ? `${h}h ${m}min`
                  : m > 0 ? `${m}min ${s}s`
                  : `${s}s`;

        let fmt;
        try   { fmt = Utils.formatarNum(moedasGanhas); }
        catch { fmt = String(moedasGanhas); }

        try {
            Toast.sucesso(`⏰ Offline por ${txt}\n+${fmt} 🪙 coletadas!`, 6000);
        } catch(_) {}

        try {
            EventBus.emit("save:offline", resultado);
        } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // AUTO-SAVE
    // ════════════════════════════════════════════════════
    function iniciarAutoSave() {
        if (_autoSaveTimer) clearInterval(_autoSaveTimer);

        _autoSaveTimer = setInterval(() => {
            salvar();
        }, CFG.AUTO_SAVE_MS);

        // Salva ao fechar a aba
        window.addEventListener("beforeunload", () => salvar());

        // Salva ao minimizar / trocar de aba
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") salvar();
        });

        // Salva em mobile ao perder foco
        window.addEventListener("pagehide", () => salvar());
        window.addEventListener("blur",     () => salvar());

        _log.debug(`Auto-save configurado (${CFG.AUTO_SAVE_MS / 1000}s).`);
    }

    function pararAutoSave() {
        if (_autoSaveTimer) {
            clearInterval(_autoSaveTimer);
            _autoSaveTimer = null;
        }
    }

    // ════════════════════════════════════════════════════
    // LIMPAR (reset total)
    // ════════════════════════════════════════════════════
    function limpar() {
        _remover(CFG.KEY_SLOT_A);
        _remover(CFG.KEY_SLOT_B);
        _remover(CFG.KEY_META);
        _backupMemoria = null;
        _ultimoSalvo   = 0;
        _log.info("Save limpo.");

        try { EventBus.emit("save:limpo"); } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // EXPORT / IMPORT
    // ════════════════════════════════════════════════════
    function exportar() {
        const dados = {
            ..._snapshot(),
            versao   : CFG.VERSAO,
            timestamp: Date.now(),
            exportado: true,
        };

        const json = JSON.stringify(dados, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url  = URL.createObjectURL(blob);

        const a       = document.createElement("a");
        a.href        = url;
        a.download    = `santa_teresinha_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();

        URL.revokeObjectURL(url);
        _log.info("Save exportado.");

        try { EventBus.emit("save:exportado"); } catch(_) {}
        return json;
    }

    function importar(jsonStr) {
        try {
            const dados = JSON.parse(jsonStr);

            if (!dados || typeof dados !== "object") {
                throw new Error("JSON inválido.");
            }

            // Migra se necessário
            const versao  = dados.versao ?? 1;
            const migrado = versao < CFG.VERSAO
                ? _migrar(dados, versao)
                : dados;

            aplicar(migrado);
            salvar();

            _log.info(`Save importado (v${versao} → v${CFG.VERSAO}).`);
            try { EventBus.emit("save:importado", migrado); } catch(_) {}
            return true;

        } catch(e) {
            _log.error("Erro ao importar save:", e);
            try { Toast.erro(`❌ Arquivo de save inválido: ${e.message}`); } catch(_) {}
            return false;
        }
    }

    // ════════════════════════════════════════════════════
    // INFORMAÇÕES DO SAVE
    // ════════════════════════════════════════════════════
    function info() {
        const metaRaw = _ler(CFG.KEY_META);
        let meta      = null;
        try { meta = metaRaw ? JSON.parse(metaRaw) : null; } catch(_) {}

        const slotA  = _ler(CFG.KEY_SLOT_A);
        const slotB  = _ler(CFG.KEY_SLOT_B);

        return {
            slotAtivo   : _slotAtivo,
            ultimoSalvo : _ultimoSalvo ? new Date(_ultimoSalvo).toLocaleString() : "nunca",
            meta,
            slots: {
                A: slotA ? `${(slotA.length / 1024).toFixed(1)} KB` : "vazio",
                B: slotB ? `${(slotB.length / 1024).toFixed(1)} KB` : "vazio",
            },
            backupMemoria: !!_backupMemoria,
            versao       : CFG.VERSAO,
        };
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        if (_inicializado) return null;
        _inicializado = true;

        // 1. Carrega save
        const dados = carregar();

        // 2. Aplica ao GameState
        if (dados) {
            aplicar(dados);

            // 3. Calcula e notifica progresso offline
            const offline = calcularOffline(dados);
            if (offline) {
                // Pequeno delay para garantir que o Toast já foi inicializado
                setTimeout(() => _notificarOffline(offline), 1500);
            }
        }

        // 4. Inicia auto-save
        iniciarAutoSave();

        // 5. Registra eventos
        _registrarEventos();

        _log.info(`SaveSystem inicializado. Slot: ${_slotAtivo}. Save: ${dados ? "carregado" : "novo"}.`);
        return dados;
    }

    // ════════════════════════════════════════════════════
    // EVENTOS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Salva imediatamente ao fazer prestígio
            EventBus.on("prestigio:feito", () => salvar());

            // Salva ao comprar item no gacha
            EventBus.on("gacha:pull",      () => salvar());

            // Salva ao desbloquear conquista
            EventBus.on("conquista:desbloqueada", () => salvar());

            // Salva ao coletar quest
            EventBus.on("quest:coletada",  () => salvar());

            // Salva ao sair da batalha
            EventBus.on("batalha:saiu",    () => salvar());

            // Força save via evento (ui-config usa isso)
            EventBus.on("save:forcar",     () => salvar());

            // Limpa save via evento
            EventBus.on("save:limpar",     () => {
                limpar();
                setTimeout(() => location.reload(), 500);
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return info();
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        salvar,
        carregar,
        aplicar,
        limpar,
        exportar,
        importar,
        calcularOffline,
        iniciarAutoSave,
        pararAutoSave,
        info,
        stats,
    });

})();
