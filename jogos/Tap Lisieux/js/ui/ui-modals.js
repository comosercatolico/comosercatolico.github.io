// ═══════════════════════════════════════════════════════
//  UI-MODALS.JS
// ═══════════════════════════════════════════════════════

"use strict";

const UIModals = (() => {

    const _log = (() => {
        try   { return Logger.de("UIModals"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    const CFG = Object.freeze({
        ANIM_ENTRADA_MS : 220,
        ANIM_SAIDA_MS   : 180,
        Z_BASE          : 1000,
        Z_PASSO         : 10,
        OVERLAY_ID      : "__modal_overlay__",
        OVERLAY_COR     : "rgba(0, 0, 0, 0.72)",
        OVERLAY_BLUR    : "blur(3px)",
        FOCAVEIS        : [
            'a[href]', 'button:not([disabled])', 'input:not([disabled])',
            'select:not([disabled])', 'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(", "),
        CLASS_MODAL    : "__modal__",
        CLASS_ENTRANDO : "__modal_entrando__",
        CLASS_SAINDO   : "__modal_saindo__",
        CLASS_ATIVO    : "__modal_ativo__",
    });

    function _injetarCSS() {
        if (document.getElementById("__ui_modals_css__")) return;

        const style = document.createElement("style");
        style.id    = "__ui_modals_css__";
        style.textContent = `
            #${CFG.OVERLAY_ID} {
                position        : fixed;
                inset           : 0;
                background      : ${CFG.OVERLAY_COR};
                z-index         : ${CFG.Z_BASE - 1};
                opacity         : 0;
                transition      : opacity ${CFG.ANIM_ENTRADA_MS}ms ease;
                pointer-events  : none;
                backdrop-filter : none;
                -webkit-backdrop-filter: none;
            }
            #${CFG.OVERLAY_ID}.ativo {
                opacity         : 1;
                pointer-events  : all;
                backdrop-filter : ${CFG.OVERLAY_BLUR};
                -webkit-backdrop-filter: ${CFG.OVERLAY_BLUR};
            }
            .${CFG.CLASS_MODAL} {
                display    : none;
                position   : fixed;
                top        : 50%;
                left       : 50%;
                transform  : translate(-50%, -50%) scale(0.92);
                opacity    : 0;
                transition : opacity ${CFG.ANIM_ENTRADA_MS}ms cubic-bezier(.34,1.38,.64,1),
                             transform ${CFG.ANIM_ENTRADA_MS}ms cubic-bezier(.34,1.38,.64,1);
                will-change: opacity, transform;
                outline    : none;
            }
            .${CFG.CLASS_MODAL}.${CFG.CLASS_ENTRANDO},
            .${CFG.CLASS_MODAL}.${CFG.CLASS_ATIVO} {
                display   : flex;
                opacity   : 1;
                transform : translate(-50%, -50%) scale(1);
            }
            .${CFG.CLASS_MODAL}.${CFG.CLASS_SAINDO} {
                display    : flex;
                opacity    : 0;
                transform  : translate(-50%, -50%) scale(0.88);
                transition : opacity ${CFG.ANIM_SAIDA_MS}ms ease,
                             transform ${CFG.ANIM_SAIDA_MS}ms ease;
            }
            body.__modal_aberto__ {
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    let _overlay = null;

    function _garantirOverlay() {
        if (_overlay) return _overlay;
        _overlay    = document.createElement("div");
        _overlay.id = CFG.OVERLAY_ID;
        document.body.appendChild(_overlay);
        _overlay.addEventListener("click", e => {
            if (e.target !== _overlay) return;
            const topo = _pilha[_pilha.length - 1];
            if (topo?.fecharAoClicarFora) fechar(topo.id);
        });
        return _overlay;
    }

    function _mostrarOverlay() {
        const ov = _garantirOverlay();
        ov.getBoundingClientRect();
        ov.classList.add("ativo");
    }

    function _esconderOverlay() {
        _overlay?.classList.remove("ativo");
    }

    const _pilha = [];

    function _profundidade()   { return _pilha.length; }
    function _estaAberto(id)   { return _pilha.some(m => m.id === id); }
    function _removerDaPilha(id) {
        const idx = _pilha.findIndex(m => m.id === id);
        if (idx !== -1) _pilha.splice(idx, 1);
    }

    function _iniciarTrapFoco(el) {
        function handler(e) {
            if (e.key !== "Tab") return;
            const focaveis = Array.from(el.querySelectorAll(CFG.FOCAVEIS))
                                  .filter(el => !el.closest("[hidden]"));
            if (focaveis.length === 0) { e.preventDefault(); return; }
            const primeiro = focaveis[0];
            const ultimo   = focaveis[focaveis.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
            } else {
                if (document.activeElement === ultimo)  { e.preventDefault(); primeiro.focus(); }
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

    let _escRegistrado = false;
    function _registrarESC() {
        if (_escRegistrado) return;
        _escRegistrado = true;
        document.addEventListener("keydown", e => {
            if (e.key !== "Escape" || _pilha.length === 0) return;
            const topo = _pilha[_pilha.length - 1];
            if (topo?.fecharComESC) { e.preventDefault(); fechar(topo.id); }
        });
    }

    function abrir(id, opts = {}) {
        const {
            fecharAoClicarFora = true,
            fecharComESC       = true,
            labelId            = null,
            onAbrir            = null,
            onFechar           = null,
        } = opts;

        let el;
        try       { el = DOM.get(id); }
        catch(_)  { el = document.getElementById(id); }

        if (!el) { _log.warn(`abrir: "${id}" não encontrado.`); return false; }
        if (_estaAberto(id)) { el.focus(); return false; }

        const focoAnterior = document.activeElement;
        const scrollY      = window.scrollY;
        const z            = CFG.Z_BASE + _profundidade() * CFG.Z_PASSO;

        el.style.zIndex = String(z);
        el.classList.add(CFG.CLASS_MODAL);
        el.setAttribute("role",       "dialog");
        el.setAttribute("aria-modal", "true");
        if (labelId) el.setAttribute("aria-labelledby", labelId);
        el.setAttribute("tabindex", "-1");

        _pilha.push({ id, el, fecharAoClicarFora, fecharComESC, focoAnterior, scrollY, onFechar });

        if (_pilha.length === 1) {
            document.body.classList.add("__modal_aberto__");
            _mostrarOverlay();
        }

        el.style.display = "flex";
        el.classList.remove(CFG.CLASS_SAINDO, CFG.CLASS_ATIVO);
        el.classList.add(CFG.CLASS_ENTRANDO);
        el.getBoundingClientRect();
        el.classList.remove(CFG.CLASS_ENTRANDO);
        el.classList.add(CFG.CLASS_ATIVO);

        setTimeout(() => {
            const primeiro = el.querySelector(CFG.FOCAVEIS);
            (primeiro ?? el).focus();
            _iniciarTrapFoco(el);
            if (typeof onAbrir === "function") {
                try { onAbrir(el); } catch(e) { _log.error("onAbrir:", e); }
            }
        }, CFG.ANIM_ENTRADA_MS);

        try { EventBus.emit("modal:aberto", { id }); } catch(_) {}
        _log.debug(`Aberto: "${id}" (pilha: ${_pilha.length})`);
        return true;
    }

    function fechar(id) {
        const entrada = id
            ? _pilha.find(m => m.id === id)
            : _pilha[_pilha.length - 1];

        if (!entrada) { return false; }

        const { el, focoAnterior, scrollY, onFechar } = entrada;

        _pararTrapFoco(el);
        el.classList.remove(CFG.CLASS_ATIVO, CFG.CLASS_ENTRANDO);
        el.classList.add(CFG.CLASS_SAINDO);

        setTimeout(() => {
            el.classList.remove(CFG.CLASS_SAINDO, CFG.CLASS_MODAL);
            el.style.display = "none";
            el.removeAttribute("role");
            el.removeAttribute("aria-modal");
            el.removeAttribute("aria-labelledby");
            el.removeAttribute("tabindex");

            _removerDaPilha(entrada.id);

            if (_pilha.length === 0) {
                document.body.classList.remove("__modal_aberto__");
                _esconderOverlay();
                window.scrollTo(0, scrollY);
            }

            try { focoAnterior?.focus?.(); } catch(_) {}

            if (typeof onFechar === "function") {
                try { onFechar(); } catch(e) { _log.error("onFechar:", e); }
            }

            try { EventBus.emit("modal:fechado", { id: entrada.id }); } catch(_) {}
            _log.debug(`Fechado: "${entrada.id}" (pilha: ${_pilha.length})`);
        }, CFG.ANIM_SAIDA_MS);

        return true;
    }

    function fecharTodos() {
        if (_pilha.length === 0) return;
        _pilha.map(m => m.id).reverse().forEach((id, i) => {
            setTimeout(() => fechar(id), i * 40);
        });
    }

    function toggle(id, opts = {}) {
        return _estaAberto(id) ? fechar(id) : abrir(id, opts);
    }

    function atualizar(id, fn) {
        const entrada = _pilha.find(m => m.id === id);
        if (!entrada) return false;
        if (typeof fn === "function") {
            try { fn(entrada.el); } catch(e) { _log.error(`atualizar "${id}":`, e); }
        }
        return true;
    }

    // ════════════════════════════════════════════════════
    // ✅ FUNÇÃO ADICIONADA — chamada pelo HTML nos overlays
    // onclick="UIModals.fecharSeFora(event,'janelaConfig')"
    // Fecha o modal APENAS se o clique foi no overlay,
    // não no conteúdo interno
    // ════════════════════════════════════════════════════
    function fecharSeFora(event, id) {
        // Só fecha se clicou diretamente no elemento (o overlay)
        // e não em um filho (o conteúdo do modal)
        if (event.target === event.currentTarget) {
            fechar(id);
        }
    }

    function _registrarBotoesFechar() {
        document.addEventListener("click", e => {
            const btn = e.target.closest("[data-fechar-modal]");
            if (!btn) return;
            const alvo = btn.dataset.fecharModal;
            if (!alvo) fechar(); else fechar(alvo);
        });
    }

    function _registrarBotoesAbrir() {
        document.addEventListener("click", e => {
            const btn = e.target.closest("[data-abrir-modal]");
            if (!btn) return;
            const alvo = btn.dataset.abrirModal;
            if (alvo) abrir(alvo);
        });
    }

    function _registrarEventos() {
        try {
            EventBus.on("modal:abrir",       ({ id, opts }) => abrir(id, opts ?? {}));
            EventBus.on("modal:fechar",      ({ id })       => fechar(id));
            EventBus.on("modal:fecharTodos", ()             => fecharTodos());
            EventBus.on("batalha:saiu",      ()             => fecharTodos());
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    function init() {
        _injetarCSS();
        _garantirOverlay();
        _registrarESC();
        _registrarBotoesFechar();
        _registrarBotoesAbrir();
        _registrarEventos();
        _log.info("UIModals inicializado.");
    }

    function stats() {
        return {
            abertos      : _pilha.map(m => m.id),
            profundidade : _pilha.length,
        };
    }

    return Object.freeze({
        init,
        abrir,
        fechar,
        fecharTodos,
        fecharSeFora,   // ✅ exposta na API pública
        toggle,
        atualizar,
        estaAberto : _estaAberto,
        stats,
    });

})();

window.UIModals = UIModals;
