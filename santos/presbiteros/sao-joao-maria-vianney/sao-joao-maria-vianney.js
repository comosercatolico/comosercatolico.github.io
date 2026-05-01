/* ═══════════════════════════════════════════════════════════
   SÃO JOÃO MARIA VIANNEY — JS GLOBAL
   sao-joao-maria-vianney.js
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   1. PARTÍCULAS DE FUNDO
   ───────────────────────────────────────── */
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = window.innerWidth < 640 ? 18 : 36;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';

    const size   = Math.random() * 3 + 1;
    const x      = Math.random() * 100;
    const y      = Math.random() * 100;
    const dur    = Math.random() * 10 + 6;
    const delay  = Math.random() * 10;
    const op     = (Math.random() * 0.05 + 0.02).toFixed(3);

    p.style.cssText = `
      width:  ${size}px;
      height: ${size}px;
      left:   ${x}%;
      top:    ${y}%;
      --dur:   ${dur}s;
      --delay: ${delay}s;
      --op:    ${op};
    `;

    container.appendChild(p);
  }
}

/* ─────────────────────────────────────────
   2. FADE-IN AO SCROLL (Intersection Observer)
   ───────────────────────────────────────── */
function initFadeIn() {
  /* Adiciona a classe fade-in nos elementos que devem animar */
  const targets = [
    '.frase-central-inner',
    '.sobre-texto',
    '.sobre-tags',
    '.partes-titulo',
    '.parte-card',
    '.tl-titulo',
    '.tl-item',
    '.frases-titulo',
    '.frase-item',
    '.cta-inner',
  ];

  targets.forEach((sel, si) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('fade-in');

      /* delay escalonado por grupo */
      const delayClass = `fade-in-delay-${(i % 6) + 1}`;
      el.classList.add(delayClass);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────
   3. SMOOTH SCROLL (âncoras internas)
   ───────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─────────────────────────────────────────
   4. HOVER PARALAXE NOS CARDS DE PARTES
   ───────────────────────────────────────── */
function initCardParallax() {
  const cards = document.querySelectorAll('.parte-destaque');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotX   = (-dy * 4).toFixed(2);
      const rotY   = ( dx * 4).toFixed(2);

      card.style.transform =
        `translateY(-4px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

/* ─────────────────────────────────────────
   5. LINHA DO TEMPO — highlight ao scroll
   ───────────────────────────────────────── */
function initTimeline() {
  const items = document.querySelectorAll('.tl-item');
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }
      });
    },
    { threshold: 0.2 }
  );

  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-16px)';
    item.style.transition = `opacity 0.5s ease ${i * 0.06}s,
                             transform 0.5s ease ${i * 0.06}s`;
    observer.observe(item);
  });
}

/* ─────────────────────────────────────────
   6. CURSOR PERSONALIZADO (apenas desktop)
   ───────────────────────────────────────── */
function initCursor() {
  if (window.innerWidth < 1024) return;

  const cursor = document.createElement('div');
  cursor.id = 'vianney-cursor';
  cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 1.5px solid rgba(201,168,76,0.5);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-50%,-50%);
    transition: width 0.25s ease, height 0.25s ease,
                border-color 0.25s ease, opacity 0.25s ease;
    opacity: 0;
  `;
  document.body.appendChild(cursor);

  const dot = document.createElement('div');
  dot.style.cssText = `
    position: fixed;
    width: 4px;
    height: 4px;
    background: rgba(201,168,76,0.7);
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-50%,-50%);
    transition: opacity 0.25s ease;
    opacity: 0;
  `;
  document.body.appendChild(dot);

  let mx = 0, my = 0;
  let cx = 0, cy = 0;
  let visible = false;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    if (!visible) {
      cursor.style.opacity = '1';
      dot.style.opacity    = '1';
      visible = true;
    }

    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    dot.style.opacity    = '0';
    visible = false;
  });

  /* suavização do anel */
  function animateCursor() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  /* expansão nos links e cards */
  const hoverable = document.querySelectorAll(
    'a, button, .parte-card, .frase-item, .tag-info'
  );

  hoverable.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width       = '38px';
      cursor.style.height      = '38px';
      cursor.style.borderColor = 'rgba(201,168,76,0.8)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width       = '20px';
      cursor.style.height      = '20px';
      cursor.style.borderColor = 'rgba(201,168,76,0.5)';
    });
  });
}

/* ─────────────────────────────────────────
   7. CONTADOR ANIMADO NOS VITALS
   ───────────────────────────────────────── */
function initCounters() {
  const vitals = document.querySelectorAll('.vital-num');
  if (!vitals.length) return;

  /* mapeia o texto original para valor numérico + sufixo */
  const parse = (raw) => {
    raw = raw.trim();
    const suffix = raw.replace(/[\d.]/g, '');   /* "+1M", "~6h", "k" etc. */
    const num    = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return { num, suffix, raw };
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const el = entry.target;
        const { num, suffix, raw } = parse(el.textContent);

        /* se não for numérico, não anima */
        if (isNaN(num)) return;

        const duration = 1400;
        const start    = performance.now();

        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);

          /* easing out-expo */
          const eased = progress === 1
            ? 1
            : 1 - Math.pow(2, -10 * progress);

          const current = Math.round(eased * num);

          /* reconstrói o texto mantendo o sufixo original */
          el.textContent = raw.replace(/[\d.]+/, current);

          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = raw; /* garante o valor final exato */
        };

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );

  vitals.forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────
   8. BARRA DE PROGRESSO DE SCROLL (index)
   ───────────────────────────────────────── */
function initScrollProgress() {
  /* só cria se não existir (as partes têm a própria) */
  if (document.getElementById('progress-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    width: 0%;
    background: linear-gradient(90deg, #c9a84c, #f5d680, #c9a84c);
    z-index: 9999;
    transition: width 0.15s linear;
    pointer-events: none;
  `;
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const h   = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

/* ─────────────────────────────────────────
   9. BOTÃO "VOLTAR AO TOPO"
   ───────────────────────────────────────── */
function initBackTop() {
  /* só cria se não existir (as partes têm o próprio) */
  if (document.getElementById('back-top') ||
      document.getElementById('p2-back-top')) return;

  const btn = document.createElement('button');
  btn.id = 'global-back-top';
  btn.innerHTML = '↑';
  btn.setAttribute('aria-label', 'Voltar ao topo');
  btn.style.cssText = `
    position: fixed;
    bottom: 30px; right: 30px;
    width: 48px; height: 48px;
    border-radius: 50%;
    border: 1.5px solid rgba(201,168,76,0.4);
    background: rgba(10,10,15,0.85);
    backdrop-filter: blur(10px);
    color: #c9a84c;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: all 0.35s ease;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 600;
    btn.style.opacity       = show ? '1' : '0';
    btn.style.pointerEvents = show ? 'all' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  btn.addEventListener('mouseenter', () => {
    btn.style.background  = 'rgba(201,168,76,0.15)';
    btn.style.transform   = 'scale(1.1)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background  = 'rgba(10,10,15,0.85)';
    btn.style.transform   = 'scale(1)';
  });
}

/* ─────────────────────────────────────────
   10. HEADER HERO — efeito parallax leve
   ───────────────────────────────────────── */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const rate     = scrolled * 0.25;
    hero.style.backgroundPositionY = `-${rate}px`;

    /* fade out suave do conteúdo hero */
    const opacity = Math.max(1 - scrolled / 600, 0);
    const title   = hero.querySelector('.hero-title');
    const desc    = hero.querySelector('.hero-desc');
    const epiteto = hero.querySelector('.hero-epiteto');
    if (title)   title.style.opacity   = opacity;
    if (desc)    desc.style.opacity    = opacity;
    if (epiteto) epiteto.style.opacity = opacity;
  }, { passive: true });
}

/* ─────────────────────────────────────────
   11. TOOLTIPS nas tags de tema das partes
   ───────────────────────────────────────── */
function initTooltips() {
  const map = {
    'Origens'      : 'A família Vianney e a França revolucionária',
    'Formação'     : 'Os anos de seminário e reprovações',
    'Ars'          : 'A chegada e a transformação da aldeia',
    'Confessionário': 'Décadas de serviço e o dom de ler almas',
    'Morte'        : 'Os últimos dias e o velório de 30.000 pessoas',
    'Canonização'  : 'De camponês a Patrono Universal dos Párocos',
    'Oração'       : 'Oração como estado permanente, não prática',
    'Penitência'   : 'Mortificação e teologia da penitência vicária',
    'Humildade'    : 'A virtude que definia tudo o que ele era',
    'Mística'      : 'Êxtases, levitações e a noite escura da alma',
    'Maria'        : 'O rosário como companheiro constante',
    'Purgatório'   : 'As almas que dependem dos nossos sufrágios',
  };

  document.querySelectorAll('.parte-temas span').forEach((span) => {
    const desc = map[span.textContent.trim()];
    if (!desc) return;

    span.style.cursor = 'help';
    span.title = desc;
  });
}

/* ─────────────────────────────────────────
   12. PRELOAD DAS PÁGINAS DE PARTE
       (prefetch ao hover nos cards)
   ───────────────────────────────────────── */
function initPrefetch() {
  const prefetched = new Set();

  document.querySelectorAll('.parte-destaque').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const href = card.getAttribute('href');
      if (!href || prefetched.has(href)) return;

      const link = document.createElement('link');
      link.rel  = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      prefetched.add(href);
    });
  });
}

/* ─────────────────────────────────────────
   13. FRASES — rotação automática
       (destaca uma frase diferente a cada 5s)
   ───────────────────────────────────────── */
function initFrasesRotation() {
  const frases = document.querySelectorAll('.frase-item');
  if (frases.length < 2) return;

  let current = 0;

  const highlight = (index) => {
    frases.forEach((f, i) => {
      if (i === index) {
        f.style.borderColor = 'rgba(201,168,76,0.28)';
        f.style.background  = 'linear-gradient(160deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))';
      } else {
        f.style.borderColor = '';
        f.style.background  = '';
      }
    });
  };

  /* só inicia se a seção estiver visível */
  let started = false;
  let interval;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started) {
          started  = true;
          interval = setInterval(() => {
            current = (current + 1) % frases.length;
            highlight(current);
          }, 5000);
        }
      });
    },
    { threshold: 0.3 }
  );

  const section = document.querySelector('.frases-section');
  if (section) observer.observe(section);

  /* pausa ao hover */
  frases.forEach((f) => {
    f.addEventListener('mouseenter', () => clearInterval(interval));
    f.addEventListener('mouseleave', () => {
      interval = setInterval(() => {
        current = (current + 1) % frases.length;
        highlight(current);
      }, 5000);
    });
  });
}

/* ─────────────────────────────────────────
   14. ACESSIBILIDADE — foco visível
   ───────────────────────────────────────── */
function initA11y() {
  /* mostra outline apenas ao navegar pelo teclado */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });

  const style = document.createElement('style');
  style.textContent = `
    body:not(.keyboard-nav) *:focus { outline: none; }
    body.keyboard-nav *:focus {
      outline: 2px solid rgba(201,168,76,0.7);
      outline-offset: 3px;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────
   15. REDUCED MOTION — respeita preferência
   ───────────────────────────────────────── */
function checkReducedMotion() {
  const pref = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!pref.matches) return;

  /* desativa partículas */
  const particles = document.getElementById('particles');
  if (particles) particles.style.display = 'none';

  /* desativa parallax do hero */
  const hero = document.querySelector('.hero');
  if (hero) hero.style.backgroundAttachment = 'scroll';

  /* remove transições de timeline */
  document.querySelectorAll('.tl-item').forEach((el) => {
    el.style.transition = 'none';
    el.style.opacity    = '1';
    el.style.transform  = 'none';
  });
}

/* ─────────────────────────────────────────
   INIT — aguarda DOM pronto
   ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  checkReducedMotion();   /* primeiro — pode desativar outros */

  initParticles();
  initFadeIn();
  initSmoothScroll();
  initCardParallax();
  initTimeline();
  initCursor();
  initCounters();
  initScrollProgress();
  initBackTop();
  initHeroParallax();
  initTooltips();
  initPrefetch();
  initFrasesRotation();
  initA11y();

  /* log de confirmação (remova em produção) */
  console.log(
    '%c✦ São João Maria Vianney — JS carregado',
    'color:#c9a84c; font-size:13px; font-style:italic;'
  );

});
