// ═══════════════════════════════════════════════════════
//  UI-UPGRADES.JS
//  Painel de upgrades completo:
//  - Abas: Upgrades | Heróis | Armas | Invocação | Missões
//  - Botões com custo, nível, bônus, estado e brilho
//  - Minimizar/maximizar com animação
//  - Compra múltipla (x1, x10, xMax)
//  - Preview do próximo nível ao hover
//  - Indicador de "pode comprar" com pulso
//  - Scroll de abas com badges
//
//  Depende de: dom-cache.js, event-bus.js, upgrades.js
//  Usado por: battle.js (via EventBus)
// ═══════════════════════════════════════════════════════

"use strict";

const UIUpgrades = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIUpgrades"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        THROTTLE_MS     : 150,    // UI atualiza ~6x/s
        COMPRA_MODOS    : [1, 10, "max"],
        MODO_PADRAO     : 0,      // índice em COMPRA_MODOS

        // Abas registradas — ordem define a exibição
        ABAS: [
            { id: "upgrades",   label: "⚔️ Upgrades",  conteudo: "abaUpgrades"       },
            { id: "herois",     label: "😇 Heróis",    conteudo: "abaHerois"         },
            { id: "armas",      label: "🗡️ Armas",     conteudo: "abaArmas"          },
            { id: "invocacao",  label: "✨ Invocar",   conteudo: "abaInvocacao"      },
            { id: "missoes",    label: "📜 Missões",   conteudo: "abaMissoesBatalha"  },
        ],

        ABA_PADRAO      : "upgrades",

        // Minimizar
        PAINEL_ANIM_MS  : 280,

        // Preview no hover
        HOVER_DELAY_MS  : 120,
    });

    // ════════════════════════════════════════════════════
    // CSS
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_upgrades_css__")) return;

        const s = document.createElement("style");
        s.id    = "__ui_upgrades_css__";
        s.textContent = `
            /* ── Painel principal ── */
            .__upgrades_painel__ {
                transition      : max-height ${CFG.PAINEL_ANIM_MS}ms cubic-bezier(.4,0,.2,1),
                                  opacity    ${CFG.PAINEL_ANIM_MS}ms ease;
                will-change     : max-height, opacity;
                overflow        : hidden;
            }
            .__upgrades_painel__.minimizado {
                max-height      : 0 !important;
                opacity         : 0;
            }

            /* ── Rodapé de abas ── */
            .__aba_rodape__ {
                display         : flex;
                align-items     : center;
                gap             : 2px;
                overflow-x      : auto;
                scrollbar-width : none;
            }
            .__aba_rodape__::-webkit-scrollbar { display: none; }

            /* ── Botão de aba ── */
            .__aba_btn__ {
                flex            : 1 0 auto;
                padding         : 7px 10px;
                border          : none;
                background      : rgba(255,255,255,0.06);
                color           : rgba(255,255,255,0.55);
                border-radius   : 8px 8px 0 0;
                font-size       : 12px;
                font-weight     : 600;
                cursor          : pointer;
                transition      : background 0.18s, color 0.18s, transform 0.15s;
                position        : relative;
                white-space     : nowrap;
            }
            .__aba_btn__:hover {
                background      : rgba(255,255,255,0.12);
                color           : rgba(255,255,255,0.85);
            }
            .__aba_btn__.ativa {
                background      : rgba(255,255,255,0.16);
                color           : #fff;
                border-bottom   : 2px solid #9d4edd;
            }

            /* ── Badge da aba ── */
            .__aba_badge__ {
                display         : inline-flex;
                align-items     : center;
                justify-content : center;
                min-width       : 16px;
                height          : 16px;
                padding         : 0 3px;
                border-radius   : 8px;
                background      : #e74c3c;
                color           : #fff;
                font-size       : 10px;
                font-weight     : 700;
                position        : absolute;
                top             : 2px;
                right           : 2px;
                transition      : transform 0.15s ease, opacity 0.15s ease;
            }
            .__aba_badge__.oculto {
                transform       : scale(0);
                opacity         : 0;
            }

            /* ── Seletor de modo de compra ── */
            .__modo_compra__ {
                display         : flex;
                gap             : 4px;
                margin-bottom   : 8px;
            }
            .__modo_btn__ {
                flex            : 1;
                padding         : 4px 0;
                border          : 1px solid rgba(255,255,255,0.15);
                background      : rgba(255,255,255,0.05);
                color           : rgba(255,255,255,0.6);
                border-radius   : 6px;
                font-size       : 12px;
                font-weight     : 700;
                cursor          : pointer;
                transition      : all 0.15s;
            }
            .__modo_btn__.ativo {
                background      : rgba(157,78,221,0.35);
                border-color    : #9d4edd;
                color           : #fff;
            }

            /* ── Card de upgrade ── */
            .__upgrade_card__ {
                display         : flex;
                align-items     : center;
                gap             : 8px;
                padding         : 8px;
                border-radius   : 10px;
                background      : rgba(255,255,255,0.04);
                border          : 1px solid rgba(255,255,255,0.08);
                margin-bottom   : 6px;
                transition      : border-color 0.2s, background 0.2s;
            }
            .__upgrade_card__.pode-comprar {
                border-color    : rgba(255,215,0,0.45);
                background      : rgba(255,215,0,0.05);
            }
            .__upgrade_card__.pode-comprar .__up_btn__ {
                animation       : __up_pulso__ 1.4s ease-in-out infinite alternate;
            }
            @keyframes __up_pulso__ {
                from { box-shadow: 0 0  6px rgba(255,215,0,0.3); }
                to   { box-shadow: 0 0 16px rgba(255,215,0,0.8); }
            }

            /* ── Ícone do upgrade ── */
            .__up_icone__ {
                font-size       : 26px;
                flex-shrink     : 0;
                width           : 36px;
                text-align      : center;
            }

            /* ── Info do upgrade ── */
            .__up_info__ {
                flex            : 1;
                min-width       : 0;
            }
            .__up_nome__ {
                font-size       : 13px;
                font-weight     : 700;
                color           : #fff;
                white-space     : nowrap;
                overflow        : hidden;
                text-overflow   : ellipsis;
            }
            .__up_desc__ {
                font-size       : 11px;
                color           : rgba(255,255,255,0.55);
                margin-top      : 1px;
            }
            .__up_preview__ {
                font-size       : 10px;
                color           : #44ff88;
                margin-top      : 2px;
                height          : 0;
                overflow        : hidden;
                transition      : height 0.18s ease;
            }
            .__upgrade_card__:hover .__up_preview__ {
                height          : 14px;
            }

            /* ── Botão de compra ── */
            .__up_btn__ {
                flex-shrink     : 0;
                padding         : 6px 10px;
                border          : none;
                border-radius   : 8px;
                background      : linear-gradient(135deg, #6d28d9, #9d4edd);
                color           : #fff;
                font-size       : 12px;
                font-weight     : 700;
                cursor          : pointer;
                min-width       : 72px;
                text-align      : center;
                transition      : opacity 0.15s, transform 0.1s;
                line-height     : 1.3;
            }
            .__up_btn__:disabled {
                opacity         : 0.35;
                cursor          : not-allowed;
                animation       : none !important;
                box-shadow      : none !important;
            }
            .__up_btn__:not(:disabled):active {
                transform       : scale(0.94);
            }

            /* ── Barra de progresso de nível ── */
            .__up_nivel_bar_wrap__ {
                height          : 3px;
                background      : rgba(255,255,255,0.10);
                border-radius   : 2px;
                margin-top      : 4px;
                overflow        : hidden;
            }
            .__up_nivel_bar__ {
                height          : 100%;
                background      : linear-gradient(90deg, #9d4edd, #c084fc);
                border-radius   : 2px;
                transition      : width 0.4s ease;
            }

            /* ── Minimizar ── */
            .__btn_minimizar__ {
                transition      : transform ${CFG.PAINEL_ANIM_MS}ms ease;
            }
            .__btn_minimizar__.rotacionado {
                transform       : rotate(180deg);
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
            if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
            if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
            if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
            return String(Math.floor(n));
        }
    }

    function _estado(chave, fb = 0) {
        try   { return GameState.get(chave) ?? fb; }
        catch { return fb; }
    }

    function _moeda() { return _estado("moeda", 0); }

    // ════════════════════════════════════════════════════
    // THROTTLE
    // ════════════════════════════════════════════════════
    let _ultimaAtualizacao = 0;

    function _podeAtualizar() {
        const agora = performance.now();
        if (agora - _ultimaAtualizacao >= CFG.THROTTLE_MS) {
            _ultimaAtualizacao = agora;
            return true;
        }
        return false;
    }

    // ════════════════════════════════════════════════════
    // MODO DE COMPRA (x1 / x10 / xMax)
    // ════════════════════════════════════════════════════
    let _modoCompraIdx = CFG.MODO_PADRAO;

    function _modoAtual() {
        return CFG.COMPRA_MODOS[_modoCompraIdx];
    }

    function _setModo(idx) {
        _modoCompraIdx = idx;
        _renderModoCompra();
        atualizar(true);
    }

    function _renderModoCompra() {
        const container = _el("modoCompraContainer");
        if (!container) return;

        // Só constrói uma vez
        if (container.dataset.construido) {
            container.querySelectorAll(".__modo_btn__").forEach((btn, i) => {
                btn.classList.toggle("ativo", i === _modoCompraIdx);
            });
            return;
        }

        container.className = "__modo_compra__";
        container.innerHTML = "";

        CFG.COMPRA_MODOS.forEach((modo, i) => {
            const btn      = document.createElement("button");
            btn.className  = "__modo_btn__" + (i === _modoCompraIdx ? " ativo" : "");
            btn.textContent = modo === "max" ? "MAX" : `×${modo}`;
            btn.setAttribute("aria-pressed", String(i === _modoCompraIdx));
            btn.addEventListener("click", () => _setModo(i));
            container.appendChild(btn);
        });

        container.dataset.construido = "1";
    }

    // ════════════════════════════════════════════════════
    // DEFINIÇÃO DOS UPGRADES
    // Lê do módulo Upgrades.js se disponível,
    // ou usa definição local como fallback
    // ════════════════════════════════════════════════════
    const _UPGRADES_DEF = [
        {
            key    : "forca",
            icone  : "💪",
            nome   : "Força da Fé",
            btnId  : "btnForca",
            descId : "forcaDesc",
            getInfo: () => {
                try {
                    const u = Upgrades.get("forca");
                    return { nivel: u.nivel, desc: `+${_fmt(u.dano)} dano/toque`, custo: u.custo, proxDesc: `+${_fmt(u.danoPróximo ?? u.dano * 1.5)} dano/toque` };
                } catch {
                    return { nivel: 1, desc: "Aumenta dano de toque", custo: 15, proxDesc: "" };
                }
            },
            comprar: (qtd) => { try { Upgrades.comprar("forca", qtd); } catch(_) {} },
        },
        {
            key    : "rosa",
            icone  : "🌹",
            nome   : "Rosas Sagradas",
            btnId  : "btnRosa",
            descId : "rosaDesc",
            getInfo: () => {
                try {
                    const u = Upgrades.get("rosa");
                    return { nivel: u.nivel, desc: `+${_fmt(u.dano)} dano/toque`, custo: u.custo, proxDesc: `+${_fmt(u.danoPróximo ?? u.dano * 1.4)} dano/toque` };
                } catch {
                    return { nivel: 1, desc: "Dano extra por toque", custo: 20, proxDesc: "" };
                }
            },
            comprar: (qtd) => { try { Upgrades.comprar("rosa", qtd); } catch(_) {} },
        },
        {
            key    : "velocidade",
            icone  : "⚡",
            nome   : "Velocidade Divina",
            btnId  : "btnVelocidade",
            descId : "velDesc",
            getInfo: () => {
                try {
                    const u = Upgrades.get("velocidade");
                    return { nivel: u.nivel, desc: `×${u.bonus} velocidade`, custo: u.custo, proxDesc: `×${u.bonusPróximo ?? (u.bonus * 1.1).toFixed(2)} velocidade` };
                } catch {
                    return { nivel: 1, desc: "Multiplicador de velocidade", custo: 30, proxDesc: "" };
                }
            },
            comprar: (qtd) => { try { Upgrades.comprar("velocidade", qtd); } catch(_) {} },
        },
        {
            key    : "dps",
            icone  : "🕊️",
            nome   : "Graça Contínua",
            btnId  : "btnDps",
            descId : "dpsDesc",
            getInfo: () => {
                try {
                    const u = Upgrades.get("dps");
                    return { nivel: u.nivel, desc: `+${_fmt(u.valor)} DPS`, custo: u.custo, proxDesc: `+${_fmt(u.valorPróximo ?? u.valor * 1.6)} DPS` };
                } catch {
                    return { nivel: 1, desc: "Dano por segundo passivo", custo: 25, proxDesc: "" };
                }
            },
            comprar: (qtd) => { try { Upgrades.comprar("dps", qtd); } catch(_) {} },
        },
    ];

    // ════════════════════════════════════════════════════
    // CALCULAR QUANTIDADE PARA O MODO ATUAL
    // ════════════════════════════════════════════════════
    function _calcQtd(getInfo) {
        const modo = _modoAtual();
        if (modo === "max") {
            // Calcula quantos upgrades cabem com o saldo atual
            let qtd  = 0;
            let moeda = _moeda();
            while (true) {
                try {
                    const info = getInfo();   // recalcula custo a cada nível
                    if (moeda < info.custo || qtd >= 100) break;
                    moeda -= info.custo;
                    qtd++;
                } catch { break; }
            }
            return Math.max(1, qtd);
        }
        return Number(modo);
    }

    // ════════════════════════════════════════════════════
    // RENDER DOS CARDS
    // ════════════════════════════════════════════════════

    // Cache dos elementos dos cards — criados uma vez
    const _cards = new Map();   // key → { card, nome, desc, preview, btn, barFill }

    function _garantirCard(def, container) {
        if (_cards.has(def.key)) return _cards.get(def.key);

        // ── Estrutura do card ──
        const card = document.createElement("div");
        card.className    = "__upgrade_card__";
        card.dataset.key  = def.key;

        const icone = document.createElement("div");
        icone.className   = "__up_icone__";
        icone.textContent = def.icone;

        const info = document.createElement("div");
        info.className = "__up_info__";

        const nome = document.createElement("div");
        nome.className = "__up_nome__";

        const desc = document.createElement("div");
        desc.className = "__up_desc__";

        const preview = document.createElement("div");
        preview.className = "__up_preview__";

        const barWrap = document.createElement("div");
        barWrap.className = "__up_nivel_bar_wrap__";

        const barFill = document.createElement("div");
        barFill.className = "__up_nivel_bar__";
        barFill.style.width = "0%";

        barWrap.appendChild(barFill);
        info.append(nome, desc, preview, barWrap);

        const btn = document.createElement("button");
        btn.className = "__up_btn__";
        btn.id        = def.btnId;

        // IDs legados para compatibilidade com game-ui.js
        nome.id = def.descId;   // legado
        desc.id = def.descId + "_sub";

        card.append(icone, info, btn);
        container.appendChild(card);

        // Evento de compra
        btn.addEventListener("click", () => {
            const qtd = _calcQtd(def.getInfo);
            def.comprar(qtd);
            // Feedback visual imediato
            btn.style.transform = "scale(0.92)";
            setTimeout(() => { btn.style.transform = ""; }, 120);
        });

        const entry = { card, nome, desc, preview, btn, barFill };
        _cards.set(def.key, entry);
        return entry;
    }

    function _atualizarCard(def, els) {
        const info   = def.getInfo();
        const moeda  = _moeda();
        const qtd    = _calcQtd(def.getInfo);
        const custo  = info.custo;   // custo do próximo nível (ou do lote)
        const pode   = moeda >= custo;

        // Calcula custo total para o modo atual
        let custoTotal = custo;
        if (_modoAtual() !== 1 && _modoAtual() !== "max") {
            // Estimativa simplificada para x10
            custoTotal = custo * Number(_modoAtual());
        }

        // Nome
        els.nome.textContent = `${def.nome}  Nv.${info.nivel}`;

        // Desc
        els.desc.textContent = info.desc;

        // Preview (próximo nível)
        els.preview.textContent = info.proxDesc ? `→ ${info.proxDesc}` : "";

        // Botão
        const labelQtd = _modoAtual() === "max" && qtd > 1 ? ` (×${qtd})` : "";
        els.btn.innerHTML =
            `<span>🪙 ${_fmt(custoTotal)}</span>` +
            (labelQtd ? `<br><small style="opacity:.7">${labelQtd}</small>` : "");
        els.btn.disabled = !pode;

        // Estado visual do card
        els.card.classList.toggle("pode-comprar", pode);

        // Barra de nível — progresso dentro de cada "milestone" de 10
        const pctNivel = (info.nivel % 10) / 10;
        els.barFill.style.width = (pctNivel * 100).toFixed(1) + "%";
    }

    // ════════════════════════════════════════════════════
    // CONTAINER DOS CARDS
    // ════════════════════════════════════════════════════
    let _containerCards = null;

    function _garantirContainer() {
        if (_containerCards) return _containerCards;

        // Tenta achar o container existente no HTML
        _containerCards = _el("abaUpgrades");
        if (!_containerCards) {
            _log.warn("Container 'abaUpgrades' não encontrado.");
            return null;
        }

        // Injeta seletor de modo de compra no topo
        const modoEl = document.createElement("div");
        modoEl.id    = "modoCompraContainer";
        _containerCards.insertBefore(modoEl, _containerCards.firstChild);

        _renderModoCompra();

        return _containerCards;
    }

    // ════════════════════════════════════════════════════
    // ABAS
    // ════════════════════════════════════════════════════
    let _abaAtiva     = CFG.ABA_PADRAO;
    const _abaBadges  = new Map();   // id → badgeEl

    function _renderAbas() {
        const rodape = _el("abaRodape");
        if (!rodape || rodape.dataset.construido) return;

        rodape.className = "__aba_rodape__";

        CFG.ABAS.forEach(aba => {
            const btn = document.createElement("button");
            btn.className    = "__aba_btn__" + (aba.id === _abaAtiva ? " ativa" : "");
            btn.dataset.aba  = aba.id;
            btn.textContent  = aba.label;
            btn.setAttribute("role",     "tab");
            btn.setAttribute("aria-selected", String(aba.id === _abaAtiva));

            // Badge
            const badge = document.createElement("span");
            badge.className = "__aba_badge__ oculto";
            badge.setAttribute("aria-hidden", "true");
            btn.appendChild(badge);
            _abaBadges.set(aba.id, badge);

            btn.addEventListener("click", () => abrirAba(aba.id));
            rodape.appendChild(btn);
        });

        rodape.dataset.construido = "1";
    }

    function abrirAba(id) {
        const def = CFG.ABAS.find(a => a.id === id);
        if (!def) { _log.warn(`Aba desconhecida: "${id}"`); return; }

        _abaAtiva = id;

        // Esconde todos os conteúdos
        CFG.ABAS.forEach(a => {
            const el = _el(a.conteudo);
            if (el) el.style.display = "none";
        });

        // Mostra o alvo
        const alvo = _el(def.conteudo);
        if (alvo) alvo.style.display = "block";

        // Atualiza botões
        document.querySelectorAll(".__aba_btn__").forEach(btn => {
            const ativo = btn.dataset.aba === id;
            btn.classList.toggle("ativa", ativo);
            btn.setAttribute("aria-selected", String(ativo));
        });

        // Dispara evento para submódulos popularem a aba
        try { EventBus.emit("aba:aberta", { id }); } catch(_) {}

        _log.debug(`Aba aberta: "${id}"`);
    }

    function setAbaBadge(abaId, count) {
        const badge = _abaBadges.get(abaId);
        if (!badge) return;

        if (count <= 0) {
            badge.classList.add("oculto");
            badge.textContent = "";
        } else {
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.classList.remove("oculto");
        }
    }

    // ════════════════════════════════════════════════════
    // MINIMIZAR PAINEL
    // ════════════════════════════════════════════════════
    let _minimizado = false;

    function togglePainel() {
        _minimizado = !_minimizado;

        const conteudo = _el("abaConteudo");
        const btnMin   = _el("btnMinimizar");
        const rodape   = _el("abaRodape");

        if (conteudo) {
            conteudo.classList.add("__upgrades_painel__");
            conteudo.classList.toggle("minimizado", _minimizado);
        }
        if (btnMin) {
            btnMin.classList.toggle("rotacionado", _minimizado);
            btnMin.setAttribute("aria-expanded", String(!_minimizado));
            btnMin.textContent = "";  // usa CSS rotate da seta
            btnMin.innerHTML   = _minimizado ? "▲" : "▼";
        }
        if (rodape) {
            rodape.style.display = _minimizado ? "none" : "flex";
        }

        try { EventBus.emit("painel:toggle", { minimizado: _minimizado }); } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR (principal)
    // ════════════════════════════════════════════════════
    function atualizar(forcado = false) {
        if (!forcado && !_podeAtualizar()) return;

        const container = _garantirContainer();
        if (!container) return;

        _UPGRADES_DEF.forEach(def => {
            const els = _garantirCard(def, container);
            _atualizarCard(def, els);
        });
    }

    // ════════════════════════════════════════════════════
    // EVENTOS DO EVENTBUS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Moeda mudou — atualiza botões
            EventBus.on("moeda:update", () => atualizar());

            // Upgrade comprado — força refresh
            EventBus.on("upgrade:comprado", ({ tipo }) => {
                atualizar(true);
                // Pop no card correspondente
                const entry = _cards.get(tipo);
                if (entry) {
                    entry.card.style.transform = "scale(1.03)";
                    setTimeout(() => { entry.card.style.transform = ""; }, 150);
                }
            });

            // Prestígio — reseta visual
            EventBus.on("prestigio:feito", () => atualizar(true));

            // Conquista disponível — badge na aba (via ui-achievements)
            EventBus.on("conquista:desbloqueada", () => {
                // badge na aba herois ou upgrades, conforme design
            });

            // Missão disponível — badge na aba missões
            EventBus.on("quest:disponivel", ({ count }) => {
                setAbaBadge("missoes", count ?? 1);
            });
            EventBus.on("quest:coletada", ({ restantes }) => {
                setAbaBadge("missoes", restantes ?? 0);
            });

            // Aba aberta por outro módulo (ex: input.js tecla de atalho)
            EventBus.on("aba:abrirForce", ({ id }) => abrirAba(id));

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
        _renderAbas();
        _garantirContainer();
        abrirAba(CFG.ABA_PADRAO);
        _registrarEventos();
        atualizar(true);

        // Expõe togglePainel globalmente (pode ser chamado por onclick no HTML)
        window.togglePainel = togglePainel;
        window.abrirAba     = (id, btn) => abrirAba(id);

        _log.info("UIUpgrades inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            abaAtiva   : _abaAtiva,
            minimizado : _minimizado,
            modoCompra : _modoAtual(),
            cardsAtivos: _cards.size,
            badges     : Object.fromEntries(_abaBadges.entries()
                .map(([k, el]) => [k, el.textContent || "0"])),
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        atualizar,
        abrirAba,
        togglePainel,
        setAbaBadge,
        stats,
    });

})();
window.UIUpgrades = UIUpgrades;
