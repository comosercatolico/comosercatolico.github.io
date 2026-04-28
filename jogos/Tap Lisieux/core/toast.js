// ═══════════════════════════════════════════════════════════
//  TOAST.JS — Notificações elegantes
// ═══════════════════════════════════════════════════════════
"use strict";

const ToastSystem = (() => {
    let _container = null;

    const ESTILOS = {
        info:    { borda: '#4a8fff', fundo: 'rgba(8,18,55,0.97)',   icone: 'ℹ️'  },
        sucesso: { borda: '#44ff88', fundo: 'rgba(8,35,18,0.97)',   icone: '✅'  },
        aviso:   { borda: '#f5a623', fundo: 'rgba(38,24,8,0.97)',   icone: '⚠️'  },
        erro:    { borda: '#ff4444', fundo: 'rgba(38,8,8,0.97)',    icone: '❌'  },
        lendario:{ borda: '#f5a623', fundo: 'rgba(38,24,0,0.97)',   icone: '🌟'  },
        epico:   { borda: '#c052ff', fundo: 'rgba(30,10,45,0.97)',  icone: '💜'  },
        levelup: { borda: '#88ff44', fundo: 'rgba(18,38,8,0.97)',   icone: '⬆️'  },
    };

    function _criarContainer() {
        if (_container) return;
        _container = document.createElement('div');
        Object.assign(_container.style, {
            position:      'fixed',
            top:           '76px',
            right:         '12px',
            zIndex:        '99999',
            display:       'flex',
            flexDirection: 'column',
            gap:           '8px',
            pointerEvents: 'none',
            maxWidth:      '300px',
        });
        document.body.appendChild(_container);
    }

    function mostrar(msg, tipo = 'info', ms = CONFIG.TOAST_DURACAO_MS) {
        _criarContainer();
        const s = ESTILOS[tipo] ?? ESTILOS.info;

        const toast = document.createElement('div');
        Object.assign(toast.style, {
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            background:   s.fundo,
            border:       `1.5px solid ${s.borda}`,
            borderLeft:   `4px solid ${s.borda}`,
            color:        '#fff',
            padding:      '11px 15px',
            borderRadius: '12px',
            fontSize:     '13px',
            lineHeight:   '1.4',
            boxShadow:    `0 0 20px ${s.borda}44, 0 4px 16px rgba(0,0,0,0.6)`,
            backdropFilter: 'blur(8px)',
            transition:   'opacity 0.3s ease, transform 0.3s ease',
            opacity:      '0',
            transform:    'translateX(28px) scale(0.96)',
            fontFamily:   'var(--fonte-corpo)',
            fontWeight:   '700',
        });

        toast.innerHTML = `<span style="font-size:16px;flex-shrink:0">${s.icone}</span><span>${msg}</span>`;
        _container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity   = '1';
            toast.style.transform = 'translateX(0) scale(1)';
        });

        setTimeout(() => {
            toast.style.opacity   = '0';
            toast.style.transform = 'translateX(28px) scale(0.96)';
            setTimeout(() => toast.remove(), 320);
        }, ms);
    }

    return { mostrar };
})();
