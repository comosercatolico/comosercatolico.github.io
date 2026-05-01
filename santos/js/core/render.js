// ═══════════════════════════════════════════════════════════════
//  cards.js  —  Lux Fidei · Santos
//  Renderização de cards (grid principal e histórico).
//  Versão refatorada: caminhos absolutos, código limpo,
//  sem dependências externas além do localStorage.
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────

const IMG_BASE     = '/imagens/santos';
const IMG_FALLBACK = '/imagens/default.jpg';

// ─────────────────────────────────────────────────────────────
//  INTERSECTION OBSERVER (animação de entrada dos cards)
// ─────────────────────────────────────────────────────────────

const appearanceObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                appearanceObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.08 }
);

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Converte o nome do santo em slug URL-safe.
 */
export function _slugify(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || '0', 10);
}

function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

function _getCorDominanteCache(slug) {
    const cached = localStorage.getItem(`cor-dominante-${slug}`);
    return cached ? JSON.parse(cached) : null;
}

function _labelStatus(progresso, lido) {
    if (lido)          return '✓ Concluído';
    if (progresso > 0) return `${progresso}%`;
    return '';
}

function _getBtnConfig(lido, progresso) {
    if (lido)          return { label: 'Reler Biografia',  icon: 'fa-redo'      };
    if (progresso > 0) return { label: 'Continuar lendo',  icon: 'fa-book-open' };
    return               { label: 'Ler Biografia',         icon: 'fa-book-open' };
}

function _getCorFill(lido, progresso, cor = null) {
    if (lido && cor)   return cor.fill;
    if (lido)          return 'linear-gradient(180deg,#4caf82 0%,#388e60 100%)';
    if (progresso > 0) return 'linear-gradient(180deg,#5ba3d9 0%,#4a8fc2 100%)';
    return null;
}

// ─────────────────────────────────────────────────────────────
//  EXTRAÇÃO DE COR DOMINANTE
// ─────────────────────────────────────────────────────────────

/**
 * Tenta extrair a cor média da imagem e cachear no localStorage.
 * Testa PNG primeiro, depois JPG.
 */
async function _extrairECachearCor(slug) {
    const cacheKey = `cor-dominante-${slug}`;
    if (localStorage.getItem(cacheKey)) return; // já cacheado

    const extrair = (src) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width  = 50;
                    canvas.height = 50;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 50, 50);

                    const data = ctx.getImageData(0, 0, 50, 50).data;
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 16) {
                        r += data[i]; g += data[i + 1]; b += data[i + 2];
                        count++;
                    }
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    const esc = (v) => Math.max(0, v - 50);
                    resolve({
                        fill:  `linear-gradient(180deg,rgba(${r},${g},${b},0.88) 0%,rgba(${esc(r)},${esc(g)},${esc(b)},0.98) 100%)`,
                        badge: `rgba(${r},${g},${b},0.92)`,
                    });
                } catch {
                    resolve(null);
                }
            };

            img.onerror = () => resolve(null);
            img.src = src;
        });

    let cor = await extrair(`${IMG_BASE}/${slug}.png`);
    if (!cor) cor = await extrair(`${IMG_BASE}/${slug}.jpg`);
    if (cor) localStorage.setItem(cacheKey, JSON.stringify(cor));
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTES DE MARKUP
// ─────────────────────────────────────────────────────────────

/**
 * Fill líquido animado no fundo do card.
 */
function _criarFill(slug, corFill) {
    return `
        <div data-fill-slug="${slug}" style="
            position:absolute;bottom:0;left:0;
            width:100%;height:0%;
            background:${corFill};
            z-index:1;
            border-radius:0 0 var(--radius) var(--radius);
            transition:height 1.4s cubic-bezier(0.4,0,0.2,1);
            will-change:height;
        ">
            <div style="
                position:absolute;top:-12px;left:0;
                width:100%;overflow:hidden;height:14px;z-index:2;
            ">
                <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                     style="width:200%;height:100%;animation:waveSlide 3s linear infinite;">
                    <path d="M0,7 C50,14 100,0 150,7 C200,14 250,0 300,7 C350,14 400,0 400,7 L400,14 L0,14 Z"
                          fill="rgba(255,255,255,0.18)"/>
                </svg>
            </div>
        </div>
    `;
}

/**
 * Mini barra de progresso para uso dentro dos cards.
 */
function _criarMiniBarra(progresso, lido, modo = 'grid') {
    if (progresso === 0 && !lido) return '';

    const largura   = lido ? 100 : progresso;
    const isHist    = modo === 'hist';
    const margin    = isHist ? '6px 0 2px' : '-4px 0 10px';
    const fontSize  = isHist ? '0.62rem' : '0.65rem';
    const label     = _labelStatus(progresso, lido);

    return `
        <div style="margin:${margin};display:flex;align-items:center;gap:6px;">
            <div style="
                flex:1;height:3px;
                background:rgba(255,255,255,0.2);
                border-radius:2px;overflow:hidden;
            ">
                <div style="
                    height:100%;width:0%;
                    background:rgba(255,255,255,0.75);
                    border-radius:2px;
                    transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
                " data-bar-width="${largura}"></div>
            </div>
            <span style="
                font-size:${fontSize};font-weight:700;
                color:rgba(255,255,255,0.9);
                white-space:nowrap;letter-spacing:0.5px;
                text-shadow:0 1px 3px rgba(0,0,0,0.2);
            ">${label}</span>
        </div>
    `;
}

/**
 * Badges de categoria sobrepostos à imagem (canto superior esquerdo).
 */
function _criarBadgesCategorias(categorias) {
    return `
        <div style="
            position:absolute;top:8px;left:8px;
            display:flex;flex-wrap:wrap;gap:4px;
            z-index:4;max-width:calc(100% - 70px);
        ">
            ${categorias.map(c => `
                <span style="
                    background:rgba(0,0,0,0.52);color:#fff;
                    font-size:0.58rem;font-weight:700;
                    padding:3px 8px;border-radius:20px;
                    letter-spacing:0.5px;
                    backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
                    white-space:nowrap;text-transform:uppercase;
                    box-shadow:0 1px 4px rgba(0,0,0,0.2);
                ">${c}</span>
            `).join('')}
        </div>
    `;
}

/**
 * Badge de status (✓ LIDO / XX%) no canto superior direito da imagem.
 */
function _criarBadgeStatus(lido, progresso, slug, cor = null) {
    const baseStyle = `
        position:absolute;top:8px;right:8px;
        color:#fff;font-size:0.6rem;font-weight:700;
        padding:3px 8px;border-radius:20px;
        letter-spacing:0.5px;
        backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        z-index:4;
    `;

    if (lido) {
        const bg = cor ? cor.badge : 'rgba(76,175,130,0.92)';
        return `<span data-badge-slug="${slug}" style="${baseStyle}background:${bg};">✓ LIDO</span>`;
    }
    if (progresso > 0) {
        return `<span data-badge-slug="${slug}" style="${baseStyle}background:rgba(91,163,217,0.92);">${progresso}%</span>`;
    }
    return `<span data-badge-slug="${slug}" style="${baseStyle}display:none;"></span>`;
}

// ─────────────────────────────────────────────────────────────
//  ANIMAR FILL + BARRAS (após render)
// ─────────────────────────────────────────────────────────────

function _animarElementos(container, slug, alturaFill, delay = 80) {
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = container.querySelector(`[data-fill-slug="${slug}"]`);
            if (fill) fill.style.height = alturaFill;

            container.querySelectorAll('[data-bar-width]').forEach((bar) => {
                bar.style.width = `${bar.dataset.barWidth}%`;
            });
        }, delay);
    });
}

// ─────────────────────────────────────────────────────────────
//  FALLBACK DE IMAGEM (inline handler)
// ─────────────────────────────────────────────────────────────

/**
 * Handler inline para <img onerror>: tenta JPG se PNG falhou,
 * e usa imagem padrão como último recurso.
 */
const IMG_FALLBACK_HANDLER = `
    if (!this._triedJpg) {
        this._triedJpg = true;
        this.src = this.src.replace('.png', '.jpg');
    } else if (!this._triedDefault) {
        this._triedDefault = true;
        this.src = '${IMG_FALLBACK}';
    } else {
        this.onerror = null;
    }
`.replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────────────────────
//  RENDER DO GRID PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function renderizarGrid(lista, grid, abrirModal) {
    if (!grid) return;
    grid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card     = document.createElement('article');
        card.className = 'santo-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver biografia de ${santo.nome}`);
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        const slug       = _slugify(santo.nome);
        const progresso  = _getProgresso(slug);
        const lido       = _getLido(slug);
        const cor        = _getCorDominanteCache(slug);
        const corFill    = _getCorFill(lido, progresso, cor);
        const alturaFill = lido ? '100%' : `${progresso}%`;
        const btn        = _getBtnConfig(lido, progresso);
        const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';

        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;border-radius:var(--radius);
                overflow:hidden;height:100%;
                display:flex;flex-direction:column;
            ">
                ${corFill ? _criarFill(slug, corFill) : ''}

                <!-- Imagem + badges sobrepostos -->
                <div style="
                    position:relative;z-index:3;
                    margin:8px 8px 0;border-radius:12px;
                    overflow:hidden;aspect-ratio:3/4;
                    flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.2);
                ">
                    <img
                        src="${IMG_BASE}/${slug}.png"
                        onerror="${IMG_FALLBACK_HANDLER}"
                        alt="${santo.nome}"
                        loading="lazy"
                        style="
                            width:100%;height:100%;
                            object-fit:cover;object-position:center top;
                            display:block;transition:transform 0.6s ease;
                        "
                    >
                    ${_criarBadgesCategorias(santo.categorias)}
                    ${_criarBadgeStatus(lido, progresso, slug, cor)}
                </div>

                <!-- Conteúdo textual -->
                <div class="santo-card-content" style="
                    position:relative;z-index:3;
                    padding:10px 12px 14px;
                    display:flex;flex-direction:column;flex:1;
                ">
                    <h3
                        data-nome-slug="${slug}"
                        style="margin:0 0 4px;transition:color 0.5s ease;${corNome ? `color:${corNome};` : ''}"
                    >${santo.nome}</h3>

                    ${_criarMiniBarra(progresso, lido, 'grid')}

                    <div class="card-footer" style="margin-top:auto;padding-top:8px;">
                        <button class="btn-primary" aria-label="${btn.label} de ${santo.nome}">
                            <span>${btn.label}</span>
                            <i class="fas ${btn.icon}" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Hover zoom na imagem
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.06)'; });
        card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)';   });

        // Extrai cor dominante após carregar (cache para próxima visita)
        img.addEventListener('load', () => _extrairECachearCor(slug), { once: true });

        // Acessibilidade via teclado
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirModal(santo.nome);
            }
        });

        // Animar fill após render
        _animarElementos(card, slug, alturaFill, 80 + (index % 15) * 30);

        // Abrir modal ao clicar no botão
        card.querySelector('.btn-primary').addEventListener('click', () => abrirModal(santo.nome));

        fragment.appendChild(card);
        appearanceObserver.observe(card);
    });

    grid.appendChild(fragment);
}

// ─────────────────────────────────────────────────────────────
//  HISTÓRICO
// ─────────────────────────────────────────────────────────────

/**
 * Salva o santo no histórico de leituras recentes (máx. 20).
 */
export function salvarHistorico(nomeSanto) {
    let hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
    hist = hist.filter(n => n !== nomeSanto);
    hist.unshift(nomeSanto);
    if (hist.length > 20) hist = hist.slice(0, 20);
    localStorage.setItem('historico-santos', JSON.stringify(hist));
}

/**
 * Renderiza a seção de histórico ("Continue lendo").
 */
export function renderizarHistorico(baseDados, abrirModal) {
    const section = document.getElementById('historicoSection');
    const scroll  = document.getElementById('historicoScroll');
    const limpar  = document.getElementById('historicoLimpar');
    if (!section || !scroll) return;

    const hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
    if (hist.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    scroll.innerHTML = '';
    const fragment = document.createDocumentFragment();

    hist.forEach((nome, index) => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug       = _slugify(nome);
        const progresso  = _getProgresso(slug);
        const lido       = _getLido(slug);
        const cor        = _getCorDominanteCache(slug);
        const corFill    = _getCorFill(lido, progresso, cor);
        const alturaFill = lido ? '100%' : `${progresso}%`;
        const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';

        const card = document.createElement('div');
        card.className    = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;
        card.setAttribute('role',     'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver biografia de ${nome}`);

        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;border-radius:var(--radius);
                overflow:hidden;height:100%;
                display:flex;flex-direction:column;
            ">
                ${corFill ? _criarFill(slug, corFill) : ''}

                <!-- Imagem + badges -->
                <div style="
                    position:relative;z-index:3;
                    margin:8px 8px 0;border-radius:12px;
                    overflow:hidden;aspect-ratio:3/4;
                    flex-shrink:0;box-shadow:0 4px 14px rgba(0,0,0,0.25);
                ">
                    <img
                        src="${IMG_BASE}/${slug}.png"
                        onerror="${IMG_FALLBACK_HANDLER}"
                        alt="${nome}"
                        loading="lazy"
                        style="
                            width:100%;height:100%;
                            object-fit:cover;object-position:center top;
                            display:block;transition:transform 0.6s ease;
                        "
                    >
                    ${_criarBadgesCategorias(santo.categorias)}
                    ${_criarBadgeStatus(lido, progresso, slug, cor)}
                </div>

                <!-- Info -->
                <div class="hist-info" style="
                    position:relative;z-index:3;
                    padding:10px 14px 14px;
                    text-align:center;
                    display:flex;flex-direction:column;flex:1;
                ">
                    <div
                        class="hist-nome"
                        data-nome-slug="${slug}"
                        style="
                            transition:color 0.5s ease;
                            ${corNome ? `color:${corNome};` : ''}
                        "
                    >${nome}</div>

                    ${_criarMiniBarra(progresso, lido, 'hist')}
                </div>
            </div>
        `;

        // Hover zoom
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.06)'; });
        card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)';   });

        // Cache cor após carregar
        img.addEventListener('load', () => _extrairECachearCor(slug), { once: true });

        // Acessibilidade
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirModal(nome);
            }
        });

        _animarElementos(card, slug, alturaFill, 80 + (index % 10) * 40);
        card.addEventListener('click', () => abrirModal(nome));

        fragment.appendChild(card);
    });

    scroll.appendChild(fragment);

    // Limpar histórico
    if (limpar) {
        limpar.onclick = () => {
            localStorage.removeItem('historico-santos');
            section.style.display = 'none';
            scroll.innerHTML = '';
        };
    }
}
