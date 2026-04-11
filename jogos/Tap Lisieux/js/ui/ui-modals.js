// ═══════════════════════════════════════════════════════
//  UI-MODALS.JS
//  Gerencia todos os modais do jogo:
//  - Abrir / fechar com animação CSS (entrada + saída)
//  - Overlay com blur do fundo
//  - Fechar ao clicar fora (overlay)
//  - Fechar com tecla ESC (respeita pilha)
//  - Pilha de modais (modal em cima de modal)
//  - Foco preso dentro do modal (acessibilidade)
//  - aria-modal, role="dialog", aria-labelledby
//  - Bloqueio de scroll do body
//  - Histórico de scroll restaurado ao fechar
//
//  Depende de: dom-cache.js, event-bus.js
//  Usado por: ui-gacha.js, ui-achievements.js, ui-config.js
// ═══════════════════════════════════════════════════════

"use strict";

const UIModals = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIModals"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Duração das animações CSS (ms)
        ANIM_ENTRADA_MS   : 220,
        ANIM_SAIDA_MS     : 180,

        // Z-index base — cada modal da pilha soma +10
        Z_BASE            : 1000,
        Z_PASSO           : 10,

        // Overlay
        OVERLAY_ID        : "__modal_overlay__",
        OVERLAY_COR       : "rgba(0, 0, 0, 0.72)",
        OVERLAY_BLUR      : "blur(3px)",    // backdrop-filter no body

        // Seletores focáveis (para trap de foco)
        FOCAVEIS          : [
            'a[href]', 'button:not([disabled])', 'input:not([disabled])',
            'select:not([disabled])', 'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(", "),

        // Classes CSS injetadas
        CLASS_MODAL       : "__modal__",
        CLASS_ENTRANDO    : "__modal_entrando__",
        CLASS_SAINDO      : "__modal_saindo__",
        CLASS_ATIVO       : "__modal_ativo__",
    });

    // ════════════════════════════════════════════════════
    // CSS — injetado uma vez no <head>
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_modals_css__")) return;

        const style = document.createElement("style");
        style.id    = "__ui_modals_css__";
        style.textContent = `
            /* ── Overlay ── */
            #${CFG.OVERLAY_ID} {
                position         : fixed;
                inset            : 0;
                background       : ${CFG.OVERLAY_COR};
                z-index          : ${CFG.Z_BASE - 1};
                opacity          : 0;
                transition       : opacity ${CFG.ANIM_ENTRADA_MS}ms ease;
                pointer-events   : none;
                backdrop-filter  : none;
                -webkit-backdrop-filter: none;
            }
            #${CFG.OVERLAY_ID}.ativo {
                opacity          : 1;
                pointer-events   : all;
                backdrop-filter  : ${CFG.OVERLAY_BLUR};
                -webkit-backdrop-filter: ${CFG.OVERLAY_BLUR};
            }

            /* ── Modal base ── */
            .${CFG.CLASS_MODAL} {
                display          : none;
                position         : fixed;
                top              : 50%;
                left             : 50%;
                transform        : translate(-50%, -50%) scale(0.92);
                opacity          : 0;
                transition       : opacity ${CFG.ANIM_ENTRADA_MS}ms cubic-bezier(.34,1.38,.64,1),
                                   transform ${CFG.ANIM_ENTRADA_MS}ms cubic-bezier(.34,1.38,.64,1);
                will-change      : opacity, transform;
                outline          : none;
            }

            /* ── Entrada ── */
            .${CFG.CLASS_MODAL}.${CFG.CLASS_ENTRANDO},
            .${CFG.CLASS_MODAL}.${CFG.CLASS_ATIVO} {
                display          : flex;
                opacity          : 1;
                transform        : translate(-50%, -50%) scale(1);
            }

            /* ── Saída ── */
            .${CFG.CLASS_MODAL}.${CFG.CLASS_SAINDO} {
                display          : flex;
                opacity          : 0;
                transform        : translate(-50%, -50%) scale(0.88);
                transition       : opacity ${CFG.ANIM_SAIDA_MS}ms ease,
                                   transform ${CFG.ANIM_SAIDA_MS}ms ease;
            }

            /* ── Body bloqueado ── */
            body.__modal_aberto__ {
                overflow         : hidden;
            }
        `;
        document.head.appendChild(style);
        _log.debug("CSS de modais injetado.");
    }

    // ════════════════════════════════════════════════════
    // OVERLAY
    // ════════════════════════════════════════════════════
    let _overlay = null;

    function _garantirOverlay() {
        if (_overlay) return _overlay;

        _overlay    = document.createElement("div");
        _overlay.id = CFG.OVERLAY_ID;
        document.body.appendChild(_overlay);

        // Clique no overlay fecha o modal do topo
        _overlay.addEventListener("click", e => {
            if (e.target !== _overlay) return;
            const topo = _pilha[_pilha.length - 1];
            if (topo?.fecharAoClicarFora) fechar(topo.id);
        });

        return _overlay;
    }

    function _mostrarOverlay() {
        const ov = _garantirOverlay();
        // Force reflow para a transição funcionar
        ov.getBoundingClientRect();
        ov.classList.add("ativo");
    }

    function _esconderOverlay() {
        _overlay?.classList.remove("ativo");
    }

    // ════════════════════════════════════════════════════
    // PILHA DE MODAIS
    // Cada entrada: { id, el, fecharAoClicarFora,
    //                 focoAnterior, scrollY }
    // ════════════════════════════════════════════════════
    const _pilha = [];

    function _profundidade() {
        return _pilha.length;
    }

    function _estaAberto(id) {
        return _pilha.some(m => m.id === id);
    }

    function _removerDaPilha(id) {
        const idx = _pilha.findIndex(m => m.id === id);
        if (idx !== -1) _pilha.splice(idx, 1);
    }

    // ════════════════════════════════════════════════════
    // TRAP DE FOCO
    // Mantém Tab/Shift+Tab dentro do modal
    // ════════════════════════════════════════════════════
    function _iniciarTrapFoco(el) {
        function handler(e) {
            if (e.key !== "Tab") return;

            const focaveis = Array.from(el.querySelectorAll(CFG.FOCAVEIS))
                                  .filter(el => !el.closest("[hidden]"));

            if (focaveis.length === 0) { e.preventDefault(); return; }

            const primeiro = focaveis[0];
            const ultimo   = focaveis[focaveis.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === primeiro) {
                    e.preventDefault();
                    ultimo.focus();
                }
            } else {
                if (document.activeElement === ultimo) {
                    e.preventDefault();
                    primeiro.focus();
                }
            }
        }

        el.__trapFoco__ = handler;
        el.addEventListener("keydown", handler);
    }

    function _pararTrapFoco(el) {
        if (el.__trapFoco__) {
            el.removeEventListener("keydown", el.__trapFoco__);
            delete el.__trapFoco__;
        }
    }

    // ════════════════════════════════════════════════════
    // ESC — listener global
    // ════════════════════════════════════════════════════
    let _escRegistrado = false;

    function _registrarESC() {
        if (_escRegistrado) return;
        _escRegistrado = true;

        document.addEventListener("keydown", e => {
            if (e.key !== "Escape" || _pilha.length === 0) return;
            const topo = _pilha[_pilha.length - 1];
            if (topo?.fecharComESC) {
                e.preventDefault();
                fechar(topo.id);
            }
        });
    }

    // ════════════════════════════════════════════════════
    // ABRIR
    // ════════════════════════════════════════════════════

    /**
     * Abre um modal pelo ID do elemento.
     *
     * @param {string}  id
     * @param {object}  [opts]
     * @param {boolean} [opts.fecharAoClicarFora=true]
     * @param {boolean} [opts.fecharComESC=true]
     * @param {string}  [opts.labelId]   - id do elemento que serve de título (aria)
     * @param {Function}[opts.onAbrir]   - callback após animação de entrada
     * @param {Function}[opts.onFechar]  - callback após animação de saída
     */
    function abrir(id, opts = {}) {
        const {
            fecharAoClicarFora = true,
            fecharComESC       = true,
            labelId            = null,
            onAbrir            = null,
            onFechar           = null,
        } = opts;

        // Busca elemento — tenta DOM cache primeiro
        let el;
        try       { el = DOM.get(id); }
        catch(_)  { el = document.getElementById(id); }

        if (!el) {
            _log.warn(`abrir: elemento "${id}" não encontrado.`);
            return false;
        }

        // Já aberto — não abre de novo
        if (_estaAberto(id)) {
            _log.debug(`Modal "${id}" já está aberto.`);
            el.focus();
            return false;
        }

        // Guarda foco atual para restaurar ao fechar
        const focoAnterior = document.activeElement;
        const scrollY      = window.scrollY;

        // Z-index baseado na profundidade da pilha
        const z = CFG.Z_BASE + _profundidade() * CFG.Z_PASSO;
        el.style.zIndex = String(z);

        // Garante que o modal tem a classe base
        el.classList.add(CFG.CLASS_MODAL);

        // Acessibilidade
        el.setAttribute("role",        "dialog");
        el.setAttribute("aria-modal",  "true");
        if (labelId) el.setAttribute("aria-labelledby", labelId);
        el.setAttribute("tabindex",    "-1");

        // Entra na pilha
        _pilha.push({ id, el, fecharAoClicarFora, fecharComESC, focoAnterior, scrollY, onFechar });

        // Bloqueia scroll do body na primeira abertura
        if (_pilha.length === 1) {
            document.body.classList.add("__modal_aberto__");
            _mostrarOverlay();
        }

        // ── Animação de entrada ──
        el.style.display = "flex";
        el.classList.remove(CFG.CLASS_SAINDO, CFG.CLASS_ATIVO);
        el.classList.add(CFG.CLASS_ENTRANDO);

        // Force reflow
        el.getBoundingClientRect();

        el.classList.remove(CFG.CLASS_ENTRANDO);
        el.classList.add(CFG.CLASS_ATIVO);

        // Foco e trap após animação
        setTimeout(() => {
            // Foca o primeiro elemento focável, ou o próprio modal
            const primeiro = el.querySelector(CFG.FOCAVEIS);
            (primeiro ?? el).focus();

            _iniciarTrapFoco(el);

            if (typeof onAbrir === "function") {
                try { onAbrir(el); } catch(e) { _log.error("onAbrir:", e); }
            }
        }, CFG.ANIM_ENTRADA_MS);

        // Emite evento
        try { EventBus.emit("modal:aberto", { id }); } catch(_) {}

        _log.debug(`Modal aberto: "${id}" (pilha: ${_pilha.length})`);
        return true;
    }

    // ════════════════════════════════════════════════════
    // FECHAR
    // ════════════════════════════════════════════════════

    /**
     * Fecha um modal pelo ID.
     * Se omitido, fecha o modal do topo da pilha.
     *
     * @param {string} [id]
     */
    function fechar(id) {
        // Se não informado, fecha o topo
        const entrada = id
            ? _pilha.find(m => m.id === id)
            : _pilha[_pilha.length - 1];

        if (!entrada) {
            if (id) _log.warn(`fechar: modal "${id}" não está aberto.`);
            return false;
        }

        const { el, focoAnterior, scrollY, onFechar } = entrada;

        // Para trap de foco
        _pararTrapFoco(el);

        // ── Animação de saída ──
        el.classList.remove(CFG.CLASS_ATIVO, CFG.CLASS_ENTRANDO);
        el.classList.add(CFG.CLASS_SAINDO);

        setTimeout(() => {
            el.classList.remove(CFG.CLASS_SAINDO, CFG.CLASS_MODAL);
            el.style.display = "none";
            el.removeAttribute("role");
            el.removeAttribute("aria-modal");
            el.removeAttribute("aria-labelledby");
            el.removeAttribute("tabindex");

            // Remove da pilha
            _removerDaPilha(entrada.id);

            // Se a pilha ficou vazia — libera scroll e esconde overlay
            if (_pilha.length === 0) {
                document.body.classList.remove("__modal_aberto__");
                _esconderOverlay();
                // Restaura posição de scroll
                window.scrollTo(0, scrollY);
            }

            // Restaura foco anterior
            try { focoAnterior?.focus?.(); } catch(_) {}

            // Callback
            if (typeof onFechar === "function") {
                try { onFechar(); } catch(e) { _log.error("onFechar:", e); }
            }

            // Emite evento
            try { EventBus.emit("modal:fechado", { id: entrada.id }); } catch(_) {}

            _log.debug(`Modal fechado: "${entrada.id}" (pilha: ${_pilha.length})`);
        }, CFG.ANIM_SAIDA_MS);

        return true;
    }

    // ════════════════════════════════════════════════════
    // FECHAR TODOS
    // ════════════════════════════════════════════════════
    function fecharTodos() {
        if (_pilha.length === 0) return;

        // Copia para evitar mutação durante iteração
        const ids = _pilha.map(m => m.id).reverse();
        ids.forEach((id, i) => {
            // Pequeno delay escalonado para não colidir animações
            setTimeout(() => fechar(id), i * 40);
        });

        _log.debug(`Fechando todos (${ids.length}) modais.`);
    }

    // ════════════════════════════════════════════════════
    // TOGGLE
    // ════════════════════════════════════════════════════
    function toggle(id, opts = {}) {
        return _estaAberto(id) ? fechar(id) : abrir(id, opts);
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR CONTEÚDO SEM REABRIR
    // Útil para modais que atualizam dados em tempo real
    // ════════════════════════════════════════════════════
    function atualizar(id, fn) {
        const entrada = _pilha.find(m => m.id === id);
        if (!entrada) {
            _log.warn(`atualizar: modal "${id}" não está aberto.`);
            return false;
        }
        if (typeof fn === "function") {
            try { fn(entrada.el); }
            catch(e) { _log.error(`atualizar modal "${id}":`, e); }
        }
        return true;
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR BOTÕES DE FECHAR DENTRO DO MODAL
    // Qualquer elemento com [data-fechar-modal] ou
    // [data-fechar-modal="id"] recebe listener automático
    // ════════════════════════════════════════════════════
    function _registrarBotoesFechar() {
        document.addEventListener("click", e => {
            const btn = e.target.closest("[data-fechar-modal]");
            if (!btn) return;

            const alvo = btn.dataset.fecharModal;

            // data-fechar-modal="" → fecha o topo
            if (!alvo) {
                fechar();
            } else {
                fechar(alvo);
            }
        });
    }

    // ════════════════════════════════════════════════════
    // REGISTRAR BOTÕES DE ABRIR MODAL
    // [data-abrir-modal="id"] abre o modal correspondente
    // ════════════════════════════════════════════════════
    function _registrarBotoesAbrir() {
        document.addEventListener("click", e => {
            const btn = e.target.closest("[data-abrir-modal]");
            if (!btn) return;

            const alvo = btn.dataset.abrirModal;
            if (alvo) abrir(alvo);
        });
    }

    // ════════════════════════════════════════════════════
    // INTEGRAÇÃO COM EventBus
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // Permite abrir/fechar modais via eventos
            EventBus.on("modal:abrir",      ({ id, opts }) => abrir(id, opts ?? {}));
            EventBus.on("modal:fechar",     ({ id })       => fechar(id));
            EventBus.on("modal:fecharTodos",()             => fecharTodos());

            // Fecha tudo ao sair da batalha
            EventBus.on("batalha:saiu",     ()             => fecharTodos());

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
        _garantirOverlay();
        _registrarESC();
        _registrarBotoesFechar();
        _registrarBotoesAbrir();
        _registrarEventos();
        _log.info("UIModals inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            abertos    : _pilha.map(m => m.id),
            profundidade: _pilha.length,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        abrir,
        fechar,
        fecharTodos,
        toggle,
        atualizar,
        estaAberto : _estaAberto,
        stats,
    });

})();
window.UIModals = UIModals;
