// ═══════════════════════════════════════════════════════════
//  UTILS.JS — EventBus, DOM Cache, Formatação, Throttle
// ═══════════════════════════════════════════════════════════
"use strict";

// ════════════════════════════════════════
//  EVENT BUS — comunicação desacoplada
// ════════════════════════════════════════
const EventBus = (() => {
    const _map = new Map();
    return {
        on(ev, fn)     { if (!_map.has(ev)) _map.set(ev, []); _map.get(ev).push(fn); },
        off(ev, fn)    { if (!_map.has(ev)) return; _map.set(ev, _map.get(ev).filter(f => f !== fn)); },
        once(ev, fn)   {
            const wrapper = (d) => { fn(d); this.off(ev, wrapper); };
            this.on(ev, wrapper);
        },
        emit(ev, data) {
            (_map.get(ev) ?? []).slice().forEach(fn => {
                try { fn(data); } catch (e) { console.error(`[EventBus] "${ev}":`, e); }
            });
        },
        clear(ev)      { _map.delete(ev); }
    };
})();

// ════════════════════════════════════════
//  DOM CACHE — evita getElementById repetido
// ════════════════════════════════════════
const DOM = (() => {
    const _c = new Map();
    return {
        get(id)          { if (!_c.has(id)) _c.set(id, document.getElementById(id)); return _c.get(id); },
        txt(id, v)       { const el = this.get(id); if (el) el.textContent = v; },
        html(id, v)      { const el = this.get(id); if (el) el.innerHTML = v; },
        show(id, t='flex'){ const el = this.get(id); if (el) el.style.display = t; },
        hide(id)         { const el = this.get(id); if (el) el.style.display = 'none'; },
        cls(id, c, on)   { const el = this.get(id); if (el) el.classList.toggle(c, on); },
        style(id, k, v)  { const el = this.get(id); if (el) el.style[k] = v; },
        inv(id)          { _c.delete(id); }
    };
})();

// ════════════════════════════════════════
//  FORMATAÇÃO DE NÚMEROS
// ════════════════════════════════════════
function fmtNum(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e15) return (n / 1e15).toFixed(2) + 'Qa';
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9)  return (n / 1e9).toFixed(2)  + 'B';
    if (abs >= 1e6)  return (n / 1e6).toFixed(2)  + 'M';
    if (abs >= 1e3)  return (n / 1e3).toFixed(1)  + 'K';
    return Math.floor(n).toLocaleString('pt-BR');
}

// ════════════════════════════════════════
//  THROTTLE GENÉRICO
// ════════════════════════════════════════
function makeThrottle(ms) {
    let last = 0;
    return { ok() { const n = performance.now(); if (n - last >= ms) { last = n; return true; } return false; } };
}

// ════════════════════════════════════════
//  ANIMAÇÃO DE NÚMERO (contador suave)
// ════════════════════════════════════════
function animarNumero(el, de, para, durMs = 600) {
    if (!el) return;
    const inicio = performance.now();
    function tick(t) {
        const p   = Math.min(1, (t - inicio) / durMs);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = fmtNum(Math.floor(de + (para - de) * ease));
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ════════════════════════════════════════
//  IMAGEM PRONTA
// ════════════════════════════════════════
function imgOk(img) {
    return img && img.complete && img.naturalWidth > 0;
}

// ════════════════════════════════════════
//  CLAMP
// ════════════════════════════════════════
const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
