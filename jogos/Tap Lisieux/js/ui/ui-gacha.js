// ═══════════════════════════════════════════════════════
//  UI-GACHA.JS
//  Modal de invocação (gacha) completo:
//  - Animação de invocação com suspense (carta virada)
//  - Resultado x1 e x10 com raridade + brilho
//  - Grid de resultados múltiplos com reveal escalonado
//  - Pity bar animada com soft pity indicator
//  - Histórico de pulls paginado
//  - Lista de heróis e armas com filtro por raridade
//  - Toast especial para lendários com partículas
//  - Garantia visual de próximo lendário
//
//  Depende de: dom-cache.js, gacha.js, inventory.js
//  Usado por: UIModals (via EventBus)
// ═══════════════════════════════════════════════════════

"use strict";

const UIGacha = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIGacha"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Custos
        CUSTO_1   : 100,
        CUSTO_10  : 900,

        // Pity
        PITY_MAX  : 90,
        PITY_SOFT : 75,

        // Cores por raridade
        CORES: {
            "Comum"   : { borda: "#888888", glow: "rgba(136,136,136,0.4)", fundo: "rgba(30,30,30,0.9)",  texto: "#cccccc" },
            "Raro"    : { borda: "#4a8fff", glow: "rgba(74,143,255,0.5)",  fundo: "rgba(10,20,60,0.95)", texto: "#88bbff" },
            "Épico"   : { borda: "#b44dff", glow: "rgba(180,77,255,0.6)",  fundo: "rgba(25,5,50,0.95)",  texto: "#d488ff" },
            "Lendário": { borda: "#f5a623", glow: "rgba(245,166,35,0.8)",  fundo: "rgba(40,20,0,0.98)",  texto: "#ffd700" },
        },

        // Animação de reveal
        REVEAL_DELAY_MS   : 120,   // delay entre cada carta no x10
        REVEAL_FLIP_MS    : 400,   // duração do flip de cada carta
        SUSPENSE_MS       : 800,   // pausa antes do reveal lendário

        // Histórico
        HISTORICO_POR_PAG : 20,

        // Filtros
        RARIDADES: ["Todos", "Lendário", "Épico", "Raro", "Comum"],
    });

    // ════════════════════════════════════════════════════
    // CSS
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_gacha_css__")) return;

        const s = document.createElement("style");
        s.id    = "__ui_gacha_css__";
        s.textContent = `
            /* ── Botões de invocar ── */
            .__gacha_btn__ {
                position        : relative;
                overflow        : hidden;
                transition      : transform 0.15s, box-shadow 0.15s;
            }
            .__gacha_btn__:not(:disabled):hover {
                transform       : translateY(-2px);
            }
            .__gacha_btn__:not(:disabled):active {
                transform       : scale(0.95);
            }
            .__gacha_btn__::after {
                content         : "";
                position        : absolute;
                inset           : 0;
                background      : linear-gradient(120deg,
                    transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
                transform       : translateX(-100%);
                transition      : transform 0.5s ease;
            }
            .__gacha_btn__:not(:disabled):hover::after {
                transform       : translateX(100%);
            }

            /* ── Pity bar ── */
            .__pity_wrap__ {
                background      : rgba(255,255,255,0.08);
                border-radius   : 8px;
                height          : 8px;
                overflow        : hidden;
                position        : relative;
            }
            .__pity_fill__ {
                height          : 100%;
                border-radius   : 8px;
                transition      : width 0.5s cubic-bezier(.4,1.2,.6,1);
                will-change     : width;
            }
            .__pity_soft_marker__ {
                position        : absolute;
                top             : 0;
                bottom          : 0;
                width           : 2px;
                background      : rgba(255,165,0,0.8);
                border-radius   : 1px;
            }

            /* ── Grid de resultados (x10) ── */
            .__gacha_grid__ {
                display         : grid;
                grid-template-columns: repeat(5, 1fr);
                gap             : 8px;
                margin          : 12px 0;
            }
            @media (max-width: 420px) {
                .__gacha_grid__ { grid-template-columns: repeat(4, 1fr); }
            }

            /* ── Carta de resultado ── */
            .__carta_wrap__ {
                perspective     : 600px;
            }
            .__carta_inner__ {
                position        : relative;
                width           : 100%;
                padding-bottom  : 140%;
                transform-style : preserve-3d;
                transition      : transform var(--flip-dur, 0.4s) cubic-bezier(.4,0,.2,1);
                border-radius   : 10px;
                cursor          : default;
            }
            .__carta_inner__.virada {
                transform       : rotateY(180deg);
            }
            .__carta_frente__,
            .__carta_verso__ {
                position        : absolute;
                inset           : 0;
                border-radius   : 10px;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
                display         : flex;
                flex-direction  : column;
                align-items     : center;
                justify-content : center;
                gap             : 4px;
                padding         : 6px 4px;
            }
            .__carta_frente__ {
                background      : linear-gradient(135deg, #1a0a3a, #2d1060);
                border          : 2px solid rgba(157,78,221,0.5);
            }
            .__carta_frente__::before {
                content         : "✨";
                font-size       : 28px;
            }
            .__carta_verso__ {
                transform       : rotateY(180deg);
                border          : 2px solid var(--carta-borda, #888);
                background      : var(--carta-fundo, rgba(30,30,30,0.9));
                box-shadow      : 0 0 16px var(--carta-glow, transparent);
            }
            .__carta_emoji__ {
                font-size       : 28px;
                line-height     : 1;
            }
            .__carta_nome__ {
                font-size       : 9px;
                font-weight     : 700;
                text-align      : center;
                color           : var(--carta-texto, #ccc);
                line-height     : 1.2;
                word-break      : break-word;
            }
            .__carta_raridade__ {
                font-size       : 8px;
                color           : var(--carta-borda, #888);
                font-weight     : 600;
            }

            /* ── Carta lendária — brilho especial ── */
            .__carta_lendaria__ .__carta_verso__ {
                animation       : __lend_shine__ 1.5s ease-in-out infinite alternate;
            }
            @keyframes __lend_shine__ {
                from { box-shadow: 0 0 12px rgba(245,166,35,0.6); }
                to   { box-shadow: 0 0 28px rgba(245,166,35,1.0); }
            }

            /* ── Resultado x1 ── */
            .__resultado_unico__ {
                display         : flex;
                align-items     : center;
                gap             : 12px;
                padding         : 14px 16px;
                border-radius   : 12px;
                border          : 2px solid var(--res-borda, #888);
                background      : var(--res-fundo, rgba(30,30,30,0.9));
                box-shadow      : 0 0 20px var(--res-glow, transparent);
                margin          : 10px 0;
                opacity         : 0;
                transform       : translateY(8px) scale(0.97);
                transition      : opacity 0.35s ease, transform 0.35s ease,
                                  box-shadow 0.35s ease;
            }
            .__resultado_unico__.visivel {
                opacity         : 1;
                transform       : translateY(0) scale(1);
            }
            .__res_emoji__ {
                font-size       : 42px;
                line-height     : 1;
            }
            .__res_info__ { flex: 1; }
            .__res_nome__ {
                font-size       : 16px;
                font-weight     : 800;
                color           : var(--res-texto, #fff);
            }
            .__res_raridade__ {
                font-size       : 12px;
                color           : var(--res-borda, #888);
                font-weight     : 600;
                margin-top      : 2px;
            }
            .__res_extra__ {
                font-size       : 12px;
                color           : rgba(255,255,255,0.55);
                margin-top      : 2px;
            }

            /* ── Filtro de raridade ── */
            .__filtro_wrap__ {
                display         : flex;
                gap             : 4px;
                flex-wrap       : wrap;
                margin-bottom   : 8px;
            }
            .__filtro_btn__ {
                padding         : 3px 10px;
                border-radius   : 20px;
                border          : 1px solid rgba(255,255,255,0.15);
                background      : rgba(255,255,255,0.05);
                color           : rgba(255,255,255,0.6);
                font-size       : 11px;
                font-weight     : 600;
                cursor          : pointer;
                transition      : all 0.15s;
            }
            .__filtro_btn__.ativo {
                background      : rgba(157,78,221,0.35);
                border-color    : #9d4edd;
                color           : #fff;
            }

            /* ── Item de inventário ── */
            .__item_tag__ {
                display         : inline-flex;
                align-items     : center;
                gap             : 4px;
                padding         : 4px 8px;
                border-radius   : 8px;
                border          : 1px solid var(--it-borda, #888);
                font-size       : 12px;
                font-weight     : 600;
                color           : var(--it-cor, #ccc);
                background      : rgba(0,0,0,0.3);
                margin          : 2px;
                transition      : transform 0.12s;
            }
            .__item_tag__:hover { transform: scale(1.05); }

            /* ── Estatísticas do pull ── */
            .__pull_stats__ {
                display         : flex;
                gap             : 8px;
                justify-content : center;
                margin          : 6px 0;
                font-size       : 12px;
                flex-wrap       : wrap;
            }
            .__pull_stat__ {
                padding         : 3px 10px;
                border-radius   : 20px;
                font-weight     : 700;
            }

            /* ── Shimmer em loading ── */
            .__shimmer__ {
                background      : linear-gradient(90deg,
                    rgba(255,255,255,0.04) 25%,
                    rgba(255,255,255,0.10) 50%,
                    rgba(255,255,255,0.04) 75%);
                background-size : 200% 100%;
                animation       : __shimmer_anim__ 1.2s linear infinite;
            }
            @keyframes __shimmer_anim__ {
                from { background-position: 200% 0; }
                to   { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(s);
    }

    // ════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════
    function _el(id) {
        try   { return DOM.get(id); }
        catch { return document.getElementById(id); }
    }

    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
            return String(Math.floor(n));
        }
    }

    function _escapar(str) {
        return String(str)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;");
    }

    function _cores(raridade) {
        return CFG.CORES[raridade] ?? CFG.CORES["Comum"];
    }

    function _setCSSVars(el, raridade) {
        const c = _cores(raridade);
        el.style.setProperty("--carta-borda",  c.borda);
        el.style.setProperty("--carta-glow",   c.glow);
        el.style.setProperty("--carta-fundo",  c.fundo);
        el.style.setProperty("--carta-texto",  c.texto);
    }

    // ════════════════════════════════════════════════════
    // ESTADO INTERNO
    // ════════════════════════════════════════════════════
    let _invocando       = false;    // lock durante animação
    let _filtrAtivo      = "Todos";
    let _pagHistorico    = 0;

    // ════════════════════════════════════════════════════
    // PITY BAR
    // ════════════════════════════════════════════════════
    function _atualizarPity() {
        let pity = 0, faltam = CFG.PITY_MAX;
        try {
            pity   = GachaSystem.pityAtual;
            faltam = GachaSystem.pullsAteLend();
        } catch(_) {}

        // Texto
        const infoEl = _el("pityInfo");
        if (infoEl) {
            const emSoft = pity >= CFG.PITY_SOFT;
            infoEl.innerHTML =
                `🎯 Pity: <strong>${pity}</strong>/${CFG.PITY_MAX} · ` +
                `Lendário garantido em <strong style="color:${emSoft ? '#f5a623' : '#fff'}">${faltam}</strong> pulls` +
                (emSoft ? ` <span style="color:#f5a623">⚠️ Soft pity ativo!</span>` : "");
        }

        // Barra
        const wrap = _el("pityBarWrap");
        if (wrap && !wrap.dataset.construido) {
            wrap.className = "__pity_wrap__";

            const fill   = document.createElement("div");
            fill.className = "__pity_fill__";
            fill.id        = "__pity_fill_inner__";

            const marker = document.createElement("div");
            marker.className = "__pity_soft_marker__";
            marker.style.left = `${(CFG.PITY_SOFT / CFG.PITY_MAX) * 100}%`;
            marker.title = `Soft pity a partir de ${CFG.PITY_SOFT} pulls`;

            wrap.appendChild(fill);
            wrap.appendChild(marker);
            wrap.dataset.construido = "1";
        }

        const fill = document.getElementById("__pity_fill_inner__");
        if (fill) {
            const pct    = Math.min(1, pity / CFG.PITY_MAX);
            const emSoft = pity >= CFG.PITY_SOFT;
            fill.style.width      = `${(pct * 100).toFixed(2)}%`;
            fill.style.background = emSoft
                ? "linear-gradient(90deg, #9d4edd, #f5a623)"
                : "linear-gradient(90deg, #6d28d9, #9d4edd)";
        }
    }

    // ════════════════════════════════════════════════════
    // INVOCAR x1 — reveal com animação
    // ════════════════════════════════════════════════════
    async function _invocarUm() {
        if (_invocando) return;

        const custo = CFG.CUSTO_1;
        let gema = 0;
        try { gema = GameState.get("gema") ?? 0; } catch(_) {}

        if (gema < custo) {
            _mostrarErro(`Gemas insuficientes! Precisa de 💎${custo}`);
            return;
        }

        _invocando = true;
        _setLoading(true);

        // Pequeno delay de suspense
        await _esperar(300);

        let resultado;
        try {
            resultado = GachaSystem.pull(
                [...(typeof poolHerois !== "undefined" ? poolHerois : []),
                 ...(typeof poolArmas  !== "undefined" ? poolArmas  : [])]
            );
            GameState.decrement("gema", custo);
        } catch(e) {
            _log.error("Erro no pull:", e);
            _invocando = false;
            _setLoading(false);
            return;
        }

        // Adiciona ao inventário
        try { Inventory.adicionar(resultado); } catch(_) {}

        // Se lendário — suspense extra
        if (resultado.raridade === "Lendário") {
            await _esperar(CFG.SUSPENSE_MS);
            _dispararLendario(resultado);
        }

        _mostrarResultadoUnico(resultado);
        _atualizarPity();
        _atualizarInventario();

        try { EventBus.emit("gacha:pull", { resultados: [resultado], lend: resultado.raridade === "Lendário" ? 1 : 0, epic: resultado.raridade === "Épico" ? 1 : 0 }); } catch(_) {}

        _invocando = false;
        _setLoading(false);
    }

    // ════════════════════════════════════════════════════
    // INVOCAR x10 — grid com reveal escalonado
    // ════════════════════════════════════════════════════
    async function _invocarDez() {
        if (_invocando) return;

        const custo = CFG.CUSTO_10;
        let gema = 0;
        try { gema = GameState.get("gema") ?? 0; } catch(_) {}

        if (gema < custo) {
            _mostrarErro(`Gemas insuficientes! Precisa de 💎${custo}`);
            return;
        }

        _invocando = true;
        _setLoading(true);

        await _esperar(200);

        let resultados = [];
        try {
            const pool = [
                ...(typeof poolHerois !== "undefined" ? poolHerois : []),
                ...(typeof poolArmas  !== "undefined" ? poolArmas  : []),
            ];
            for (let i = 0; i < 10; i++) {
                resultados.push(GachaSystem.pull(pool));
            }
            GameState.decrement("gema", custo);
        } catch(e) {
            _log.error("Erro no pull x10:", e);
            _invocando = false;
            _setLoading(false);
            return;
        }

        // Adiciona ao inventário
        resultados.forEach(r => { try { Inventory.adicionar(r); } catch(_) {} });

        // Ordena — lendários aparecem por último (mais impacto)
        const ordemRar = { "Comum": 0, "Raro": 1, "Épico": 2, "Lendário": 3 };
        const ordenados = [...resultados].sort(
            (a, b) => (ordemRar[a.raridade] ?? 0) - (ordemRar[b.raridade] ?? 0)
        );

        await _mostrarGridResultados(ordenados);
        _atualizarPity();
        _atualizarInventario();

        const lend = resultados.filter(r => r.raridade === "Lendário").length;
        const epic = resultados.filter(r => r.raridade === "Épico").length;

        if (lend > 0) {
            const lendItem = resultados.find(r => r.raridade === "Lendário");
            _dispararLendario(lendItem);
        }

        _mostrarStatsPull(resultados);

        try { EventBus.emit("gacha:pull", { resultados, lend, epic }); } catch(_) {}

        _invocando = false;
        _setLoading(false);
    }

    // ════════════════════════════════════════════════════
    // RESULTADO x1
    // ════════════════════════════════════════════════════
    function _mostrarResultadoUnico(item) {
        const ids = ["invocarResultado", "invocarResultado2"];
        const c   = _cores(item.raridade);

        ids.forEach(id => {
            const el = _el(id);
            if (!el) return;

            el.className = "__resultado_unico__";
            el.style.setProperty("--res-borda", c.borda);
            el.style.setProperty("--res-glow",  c.glow);
            el.style.setProperty("--res-fundo", c.fundo);
            el.style.setProperty("--res-texto", c.texto);

            const extra = item.dano
                ? `+${_fmt(item.dano)} de dano`
                : item.arma ?? "";

            el.innerHTML = `
                <span class="__res_emoji__">${_escapar(item.emoji)}</span>
                <div class="__res_info__">
                    <div class="__res_nome__">${_escapar(item.nome)}</div>
                    <div class="__res_raridade__">${_escapar(item.raridade)}</div>
                    ${extra ? `<div class="__res_extra__">${_escapar(extra)}</div>` : ""}
                </div>
                <span style="font-size:20px">${_estrelasRaridade(item.raridade)}</span>
            `;

            // Anima entrada
            requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.add("visivel"));
            });
        });
    }

    // ════════════════════════════════════════════════════
    // RESULTADO x10 — grid com flip escalonado
    // ════════════════════════════════════════════════════
    async function _mostrarGridResultados(itens) {
        const container = _el("invocarResultado") ?? _el("invocarResultado2");
        if (!container) return;

        container.className = "";
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "__gacha_grid__";
        container.appendChild(grid);

        const wrappers = [];

        itens.forEach(item => {
            const c = _cores(item.raridade);

            const wrap  = document.createElement("div");
            wrap.className = "__carta_wrap__";

            const inner = document.createElement("div");
            inner.className = "__carta_inner__";
            inner.style.setProperty("--flip-dur", `${CFG.REVEAL_FLIP_MS}ms`);
            if (item.raridade === "Lendário") inner.classList.add("__carta_lendaria__");

            const frente = document.createElement("div");
            frente.className = "__carta_frente__";

            const verso  = document.createElement("div");
            verso.className = "__carta_verso__";
            _setCSSVars(verso, item.raridade);

            const extra = item.dano ? `+${_fmt(item.dano)}` : "";

            verso.innerHTML = `
                <span class="__carta_emoji__">${_escapar(item.emoji)}</span>
                <span class="__carta_nome__">${_escapar(item.nome)}</span>
                <span class="__carta_raridade__">${_estrelasRaridade(item.raridade)}</span>
                ${extra ? `<span style="font-size:9px;color:${c.texto};font-weight:700">${extra}</span>` : ""}
            `;

            inner.appendChild(frente);
            inner.appendChild(verso);
            wrap.appendChild(inner);
            grid.appendChild(wrap);
            wrappers.push({ inner, item });
        });

        // Reveal escalonado
        for (let i = 0; i < wrappers.length; i++) {
            const { inner, item } = wrappers[i];

            // Pausa extra antes de lendário
            if (item.raridade === "Lendário" && i > 0) {
                await _esperar(CFG.SUSPENSE_MS);
            } else {
                await _esperar(CFG.REVEAL_DELAY_MS);
            }

            inner.classList.add("virada");
        }
    }

    // ════════════════════════════════════════════════════
    // ESTATÍSTICAS DO PULL x10
    // ════════════════════════════════════════════════════
    function _mostrarStatsPull(resultados) {
        const statsEl = _el("pullStats");
        if (!statsEl) return;

        const contagem = {};
        resultados.forEach(r => {
            contagem[r.raridade] = (contagem[r.raridade] ?? 0) + 1;
        });

        const cores = { "Lendário": "#f5a623", "Épico": "#b44dff", "Raro": "#4a8fff", "Comum": "#888" };

        statsEl.className = "__pull_stats__";
        statsEl.innerHTML = Object.entries(contagem)
            .sort(([a], [b]) => {
                const ord = { "Lendário": 0, "Épico": 1, "Raro": 2, "Comum": 3 };
                return (ord[a] ?? 9) - (ord[b] ?? 9);
            })
            .map(([rar, qtd]) =>
                `<span class="__pull_stat__" style="background:${cores[rar] ?? '#888'}22;color:${cores[rar] ?? '#888'};border:1px solid ${cores[rar] ?? '#888'}44">
                    ${qtd}× ${rar}
                </span>`
            ).join("");
    }

    // ════════════════════════════════════════════════════
    // INVENTÁRIO — lista filtrada por raridade
    // ════════════════════════════════════════════════════
    let _filtroRaridade = "Todos";

    function _renderFiltros(containerId) {
        const el = _el(containerId);
        if (!el || el.dataset.filtrosConstruidos) return;

        const wrap = document.createElement("div");
        wrap.className = "__filtro_wrap__";

        CFG.RARIDADES.forEach(r => {
            const btn      = document.createElement("button");
            btn.className  = "__filtro_btn__" + (r === _filtroRaridade ? " ativo" : "");
            btn.textContent = r;
            btn.addEventListener("click", () => {
                _filtroRaridade = r;
                wrap.querySelectorAll(".__filtro_btn__").forEach(b => {
                    b.classList.toggle("ativo", b.textContent === r);
                });
                _atualizarInventario();
            });
            wrap.appendChild(btn);
        });

        el.insertBefore(wrap, el.firstChild);
        el.dataset.filtrosConstruidos = "1";
    }

    function _atualizarInventario() {
        let herois = [], armas = [];
        try { herois = Inventory.herois();   } catch(_) {}
        try { armas  = Inventory.armas();    } catch(_) {}

        const filtrar = lista => _filtroRaridade === "Todos"
            ? lista
            : lista.filter(i => i.raridade === _filtroRaridade);

        _renderLista("listaHerois",          filtrar(herois), false);
        _renderLista("listaEquipamentos",    filtrar(armas),  false);
        _renderLista("listaHeroisBatalha2",  filtrar([...herois, ...armas]), false);
        _renderLista("listaArmasBatalha",    filtrar(armas),  false);
        _renderLista("listaEquipamentosEquipar", filtrar(armas), true);
    }

    function _renderLista(id, itens, mostraEquipar) {
        const el = _el(id);
        if (!el) return;

        if (itens.length === 0) {
            el.innerHTML = `<p style="color:rgba(255,255,255,0.4);font-size:13px;text-align:center;padding:12px 0">
                Nenhum item${_filtroRaridade !== "Todos" ? ` ${_filtroRaridade}` : ""} obtido ainda.
            </p>`;
            return;
        }

        // Ordena por raridade (lendário primeiro) e nome
        const ord = { "Lendário": 0, "Épico": 1, "Raro": 2, "Comum": 3 };
        const ordenados = [...itens].sort(
            (a, b) => ((ord[a.raridade] ?? 9) - (ord[b.raridade] ?? 9)) ||
                      a.nome.localeCompare(b.nome)
        );

        el.innerHTML = ordenados.map(item => _itemTagHTML(item, mostraEquipar)).join("");

        // Listener para equipar
        if (mostraEquipar) {
            el.querySelectorAll("[data-equipar]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const nome = btn.dataset.equipar;
                    _equiparItem(nome);
                });
            });
        }
    }

    function _itemTagHTML(item, mostraEquipar = false) {
        const c     = _cores(item.raridade);
        const extra = item.dano ? ` +${_fmt(item.dano)}` : "";
        const nome  = _escapar(item.nome);
        const emoji = _escapar(item.emoji);

        const btn = mostraEquipar
            ? `<button data-equipar="${nome}" style="
                margin-left:6px;padding:2px 8px;border-radius:6px;border:none;
                background:#9d4edd;color:#fff;font-size:10px;font-weight:700;cursor:pointer">
                Equipar
               </button>`
            : "";

        return `<span class="__item_tag__"
            style="--it-borda:${c.borda};--it-cor:${c.texto};border-color:${c.borda}">
            ${emoji} ${nome}${extra}${btn}
        </span>`;
    }

    function _equiparItem(nome) {
        try {
            Inventory.equipar(nome);
            Toast.sucesso(`✅ ${nome} equipado!`);
            try { UIModals.fechar("modalEquipar"); } catch(_) {}
        } catch(e) {
            _log.error("Erro ao equipar:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // LENDÁRIO — efeito especial
    // ════════════════════════════════════════════════════
    function _dispararLendario(item) {
        // Toast especial
        try {
            Toast.lendario(`🌟 LENDÁRIO! ${item.emoji} ${item.nome}`);
        } catch(_) {
            try { Toast.mostrar(`🌟 LENDÁRIO! ${item.emoji} ${item.nome}`, "lendario", 6000); } catch(_) {}
        }

        // Partículas no canvas
        try {
            Effects.criarParticulas(
                window.innerWidth / 2,
                window.innerHeight / 2,
                30
            );
        } catch(_) {}

        try { EventBus.emit("gacha:pull:lendario", { item }); } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // LOADING STATE
    // ════════════════════════════════════════════════════
    function _setLoading(ativo) {
        ["btnInvocar1", "btnInvocar10"].forEach(id => {
            const btn = _el(id);
            if (!btn) return;
            btn.disabled = ativo;
            if (ativo) {
                btn.dataset.textoOriginal = btn.textContent;
                btn.innerHTML = `<span class="__shimmer__" style="display:inline-block;width:80px;height:14px;border-radius:4px"></span>`;
            } else {
                btn.textContent = btn.dataset.textoOriginal ?? btn.textContent;
            }
        });
    }

    // ════════════════════════════════════════════════════
    // ERRO
    // ════════════════════════════════════════════════════
    function _mostrarErro(msg) {
        try { Toast.erro(`❌ ${msg}`); } catch(_) {}

        ["invocarResultado", "invocarResultado2"].forEach(id => {
            const el = _el(id);
            if (el) {
                el.className  = "";
                el.textContent = `❌ ${msg}`;
                el.style.color = "#ff4444";
            }
        });
    }

    // ════════════════════════════════════════════════════
    // ESTRELAS POR RARIDADE
    // ════════════════════════════════════════════════════
    function _estrelasRaridade(rar) {
        const map = { "Comum": "⭐", "Raro": "⭐⭐", "Épico": "⭐⭐⭐", "Lendário": "✨✨✨" };
        return map[rar] ?? "⭐";
    }

    // ════════════════════════════════════════════════════
    // UTILITÁRIO — Promise de delay
    // ════════════════════════════════════════════════════
    function _esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ════════════════════════════════════════════════════
    // ABRIR / FECHAR
    // ════════════════════════════════════════════════════
    function abrir() {
        _atualizarPity();
        _atualizarInventario();
        _renderFiltros("listaHerois");
        _renderFiltros("listaEquipamentos");

        try {
            UIModals.abrir("modalInvocar", {
                labelId          : "modalInvocarTitulo",
                fecharAoClicarFora: true,
            });
        } catch(_) {
            const el = _el("modalInvocar");
            if (el) el.style.display = "flex";
        }
    }

    function fechar() {
        try { UIModals.fechar("modalInvocar"); }
        catch(_) {
            const el = _el("modalInvocar");
            if (el) el.style.display = "none";
        }
    }

    function abrirEquipar() {
        _atualizarInventario();
        _renderFiltros("listaEquipamentosEquipar");

        try {
            UIModals.abrir("modalEquipar", {
                labelId          : "modalEquiparTitulo",
                fecharAoClicarFora: true,
            });
        } catch(_) {
            const el = _el("modalEquipar");
            if (el) el.style.display = "flex";
        }
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR BOTÕES
    // ════════════════════════════════════════════════════
    function _registrarBotoes() {
        const btn1  = _el("btnInvocar1");
        const btn10 = _el("btnInvocar10");

        if (btn1) {
            btn1.className += " __gacha_btn__";
            btn1.addEventListener("click", _invocarUm);
        }
        if (btn10) {
            btn10.className += " __gacha_btn__";
            btn10.addEventListener("click", _invocarDez);
        }
    }

    // ════════════════════════════════════════════════════
    // EVENTOS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            EventBus.on("gacha:abrir",   () => abrir());
            EventBus.on("gacha:fechar",  () => fechar());
            EventBus.on("equipar:abrir", () => abrirEquipar());

            // Atualiza pity ao voltar para a aba de invocação
            EventBus.on("aba:aberta", ({ id }) => {
                if (id === "invocacao") {
                    _atualizarPity();
                    _atualizarInventario();
                }
            });

            // Item equipado por outro módulo
            EventBus.on("item:equipado", () => _atualizarInventario());

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        _injetarCSS();
        _registrarBotoes();
        _registrarEventos();
        _log.info("UIGacha inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            invocando     : _invocando,
            filtroRaridade: _filtroRaridade,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        abrir,
        fechar,
        abrirEquipar,
        stats,
    });

})();
