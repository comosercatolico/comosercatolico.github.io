const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            _carregarConteudoCard(entry.target); // ← carrega só agora
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// ─────────────────────────────────────────────
//  UTILITÁRIOS INTERNOS
// ─────────────────────────────────────────────
function _slugify(nome) {
    return nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');
}

function _labelStatus(progresso, lido) {
    if (lido)          return '✓ Concluído';
    if (progresso > 0) return `${progresso}%`;
    return '';
}

function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
}

function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

function _getImgSrc(slug) {
    return `imagens/santos/${slug}.png`;
}

// ─────────────────────────────────────────────
//  COR DOMINANTE (cache no localStorage)
// ─────────────────────────────────────────────
function _getCorDominanteCache(slug) {
    const cached = localStorage.getItem(`cor-dominante-${slug}`);
    return cached ? JSON.parse(cached) : null;
}

async function _extrairECachearCor(slug, imgEl) {
    const cacheKey = `cor-dominante-${slug}`;
    if (localStorage.getItem(cacheKey)) return;

    const extrair = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 50; canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 50, 50);
                const data = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 16) {
                    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                }
                r = Math.round(r/count);
                g = Math.round(g/count);
                b = Math.round(b/count);
                const esc = (v) => Math.max(0, v - 50);
                resolve({
                    fill:  `linear-gradient(180deg,rgba(${r},${g},${b},0.88) 0%,rgba(${esc(r)},${esc(g)},${esc(b)},0.98) 100%)`,
                    badge: `rgba(${r},${g},${b},0.92)`
                });
            } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });

    let cor = await extrair(`imagens/santos/${slug}.png`);
    if (!cor) cor = await extrair(`imagens/santos/${slug}.jpg`);
    if (cor) localStorage.setItem(cacheKey, JSON.stringify(cor));
}

// ─────────────────────────────────────────────
//  FALLBACK DE IMAGEM
// ─────────────────────────────────────────────
const IMG_FALLBACK_HANDLER = `
    if (!this._triedJpg) {
        this._triedJpg = true;
        this.src = this.src.replace('.png', '.jpg');
    } else {
        this.onerror = null;
        this.src = 'imagens/default.jpg';
    }
`.replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────
//  FILL LÍQUIDO
// ─────────────────────────────────────────────
function _criarFill(slug, corFill) {
    return `
        <div data-fill-slug="${slug}" style="
            position:absolute; bottom:0; left:0;
            width:100%; height:0%;
            background:${corFill};
            z-index:1;
            border-radius:0 0 var(--radius) var(--radius);
            transition:height 1.4s cubic-bezier(0.4,0,0.2,1);
            will-change:height;
        ">
            <div style="
                position:absolute; top:-12px; left:0;
                width:100%; overflow:hidden;
                height:14px; z-index:2;
            ">
                <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                     style="width:200%; height:100%; animation:waveSlide 3s linear infinite;">
                    <path d="M0,7 C50,14 100,0 150,7 C200,14 250,0 300,7 C350,14 400,0 400,7 L400,14 L0,14 Z"
                          fill="rgba(255,255,255,0.18)"/>
                </svg>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  MINI BARRA DE PROGRESSO
// ─────────────────────────────────────────────
function _criarMiniBarra(progresso, lido, modo = 'grid') {
    if (progresso === 0 && !lido) return '';

    const labelStatus = _labelStatus(progresso, lido);
    const largura     = lido ? 100 : progresso;
    const isHist      = modo === 'hist';
    const margin      = isHist ? '6px 0 2px' : '-4px 0 10px';
    const fontSize    = isHist ? '0.62rem' : '0.65rem';

    return `
        <div style="margin:${margin}; display:flex; align-items:center; gap:6px;">
            <div style="
                flex:1; height:3px;
                background:rgba(255,255,255,0.2);
                border-radius:2px; overflow:hidden;
            ">
                <div style="
                    height:100%; width:0%;
                    background:rgba(255,255,255,0.75);
                    border-radius:2px;
                    transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
                " data-bar-width="${largura}"></div>
            </div>
            <span style="
                font-size:${fontSize}; font-weight:700;
                color:rgba(255,255,255,0.9);
                white-space:nowrap; letter-spacing:0.5px;
                text-shadow:0 1px 3px rgba(0,0,0,0.2);
            ">${labelStatus}</span>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  ANIMAR FILL + BARRAS
// ─────────────────────────────────────────────
function _animarElementos(container, slug, alturaFill, delay = 80) {
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = container.querySelector(`[data-fill-slug="${slug}"]`);
            if (fill) fill.style.height = alturaFill;
            container.querySelectorAll('[data-bar-width]').forEach(bar => {
                bar.style.width = `${bar.dataset.barWidth}%`;
            });
        }, delay);
    });
}

// ─────────────────────────────────────────────
//  CORES
// ─────────────────────────────────────────────
function _getCorFill(lido, progresso, cor = null) {
    if (lido && cor)    return cor.fill;
    if (lido)           return 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)';
    if (progresso > 0)  return 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    return null;
}

function _getBtnConfig(lido, progresso) {
    if (lido)          return { label: 'Reler Biografia',  icon: 'fa-redo'      };
    if (progresso > 0) return { label: 'Continuar lendo',  icon: 'fa-book-open' };
    return               { label: 'Ler Biografia',         icon: 'fa-book-open' };
}

// ─────────────────────────────────────────────
//  BADGE DE STATUS (sobre a imagem)
// ─────────────────────────────────────────────
function _criarBadgeStatus(lido, progresso, slug, cor = null) {
    const base = `
        position:absolute; top:8px; right:8px;
        color:#fff; font-size:0.6rem; font-weight:700;
        padding:3px 8px; border-radius:20px;
        letter-spacing:0.5px;
        backdrop-filter:blur(4px);
        -webkit-backdrop-filter:blur(4px);
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        z-index:4;
    `;

    if (lido) {
        const bg = cor ? cor.badge : 'rgba(76,175,130,0.92)';
        return `<span data-badge-slug="${slug}" style="${base} background:${bg};">✓ LIDO</span>`;
    }
    if (progresso > 0) {
        return `<span data-badge-slug="${slug}" style="${base} background:rgba(91,163,217,0.92);">${progresso}%</span>`;
    }
    return `<span data-badge-slug="${slug}" style="${base} display:none;"></span>`;
}

// ─────────────────────────────────────────────
//  BADGES DE CATEGORIA (overlay na imagem)
// ─────────────────────────────────────────────
function _criarBadgesCategorias(categorias) {
    return `
        <div style="
            position:absolute; top:8px; left:8px;
            display:flex; flex-wrap:wrap; gap:4px;
            z-index:4;
            max-width:calc(100% - 70px);
        ">
            ${categorias.map(c => `
                <span style="
                    background:rgba(0,0,0,0.52);
                    color:#fff;
                    font-size:0.58rem;
                    font-weight:700;
                    padding:3px 8px;
                    border-radius:20px;
                    letter-spacing:0.5px;
                    backdrop-filter:blur(6px);
                    -webkit-backdrop-filter:blur(6px);
                    white-space:nowrap;
                    text-transform:uppercase;
                    box-shadow:0 1px 4px rgba(0,0,0,0.2);
                ">${c}</span>
            `).join('')}
        </div>
    `;
}

// ─────────────────────────────────────────────
//  CARREGAR CONTEÚDO DO CARD (chamado só ao entrar na viewport)
// ─────────────────────────────────────────────
function _carregarConteudoCard(card) {
    // Marca como carregado para não repetir
    if (card.dataset.carregado === '1') return;
    card.dataset.carregado = '1';

    const slug       = card.dataset.slug;
    const progresso  = _getProgresso(slug);
    const lido       = _getLido(slug);
    const cor        = _getCorDominanteCache(slug);
    const corFill    = _getCorFill(lido, progresso, cor);
    const alturaFill = lido ? '100%' : `${progresso}%`;
    const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';
    const modo       = card.dataset.modo || 'grid'; // 'grid' ou 'hist'
    const nome       = card.dataset.nome;
    const categorias = JSON.parse(card.dataset.categorias || '[]');

    // ── Monta o innerHTML real agora ──────────────────────────
    const inner = card.querySelector('.card-inner');

    // Fill líquido
    if (corFill) {
        inner.insertAdjacentHTML('afterbegin', _criarFill(slug, corFill));
    }

    // Imagem + badges (substitui o placeholder)
    const imgWrapper = card.querySelector('.img-wrapper');
    imgWrapper.innerHTML = `
        <img
            src="${_getImgSrc(slug)}"
            onerror="${IMG_FALLBACK_HANDLER}"
            alt="${nome}"
            loading="lazy"
            style="
                width:100%; height:100%;
                object-fit:cover;
                object-position:center top;
                display:block;
                transition:transform 0.6s ease;
            "
        >
        ${_criarBadgesCategorias(categorias)}
        ${_criarBadgeStatus(lido, progresso, slug, cor)}
    `;

    // Hover na imagem
    const img = imgWrapper.querySelector('img');
    card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.05)');
    card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

    // Extrai cor dominante ao carregar imagem
    img.addEventListener('load', () => _extrairECachearCor(slug, img), { once: true });

    // Barra de progresso
    const barraSlot = card.querySelector('.barra-slot');
    if (barraSlot) barraSlot.innerHTML = _criarMiniBarra(progresso, lido, modo);

    // Cor do nome
    const nomeEl = card.querySelector('[data-nome-slug]');
    if (nomeEl && corNome) nomeEl.style.color = corNome;

    // Animações
    _animarElementos(card, slug, alturaFill, 80);
}

// ─────────────────────────────────────────────
//  RENDER DO GRID PRINCIPAL
// ─────────────────────────────────────────────
export function renderizarGrid(lista, grid, abrirModal) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card     = document.createElement("article");
        card.className = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        const slug = _slugify(santo.nome);

        // ── Guarda os dados no dataset — conteúdo real só no observer ──
        card.dataset.slug       = slug;
        card.dataset.nome       = santo.nome;
        card.dataset.categorias = JSON.stringify(santo.categorias);
        card.dataset.modo       = 'grid';

        const btn = _getBtnConfig(_getLido(slug), _getProgresso(slug));

        // Esqueleto leve: só estrutura, SEM imagem, SEM fill, SEM cor
        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;
                border-radius:var(--radius);
                overflow:hidden;
                height:100%;
                display:flex;
                flex-direction:column;
            ">
                <!-- placeholder da imagem -->
                <div class="img-wrapper" style="
                    position:relative; z-index:3;
                    margin:8px 8px 0;
                    border-radius:12px;
                    overflow:hidden;
                    aspect-ratio:3/4;
                    flex-shrink:0;
                    background:#1a1a2e;
                    box-shadow:0 4px 12px rgba(0,0,0,0.2);
                "></div>

                <!-- conteúdo -->
                <div class="santo-card-content" style="
                    position:relative; z-index:3;
                    padding:10px 12px 14px;
                    display:flex; flex-direction:column;
                    flex:1;
                ">
                    <h3
                        data-nome-slug="${slug}"
                        style="margin:0 0 4px; transition:color 0.5s ease;"
                    >${santo.nome}</h3>

                    <!-- barra preenchida pelo observer -->
                    <div class="barra-slot"></div>

                    <div class="card-footer" style="margin-top:auto; padding-top:8px;">
                        <button class="btn-primary" aria-label="${btn.label} - ${santo.nome}">
                            <span>${btn.label}</span>
                            <i class="fas ${btn.icon}" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector(".btn-primary")
            .addEventListener("click", () => abrirModal(santo.nome));

        fragment.appendChild(card);
        appearanceObserver.observe(card); // ← só carrega quando aparecer
    });

    grid.appendChild(fragment);
}

// ─────────────────────────────────────────────
//  HISTÓRICO
// ─────────────────────────────────────────────
export function salvarHistorico(nomeSanto) {
    let hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
    hist = hist.filter(n => n !== nomeSanto);
    hist.unshift(nomeSanto);
    if (hist.length > 20) hist = hist.slice(0, 20);
    localStorage.setItem('historico-santos', JSON.stringify(hist));
}

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

    hist.forEach((nome) => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug = _slugify(nome);
        const lido = _getLido(slug);

        const card        = document.createElement('div');
        card.className    = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug       = slug;
        card.dataset.nome       = nome;
        card.dataset.categorias = JSON.stringify(santo.categorias);
        card.dataset.modo       = 'hist';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver biografia de ${nome}`);

        // Esqueleto leve
        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;
                border-radius:var(--radius);
                overflow:hidden;
                height:100%;
                display:flex;
                flex-direction:column;
            ">
                <!-- placeholder da imagem -->
                <div class="img-wrapper" style="
                    position:relative; z-index:3;
                    margin:8px 8px 0;
                    border-radius:12px;
                    overflow:hidden;
                    aspect-ratio:3/4;
                    flex-shrink:0;
                    background:#1a1a2e;
                    box-shadow:0 4px 14px rgba(0,0,0,0.25);
                "></div>

                <!-- info -->
                <div class="hist-info" style="
                    position:relative; z-index:3;
                    padding:10px 14px 14px;
                    text-align:center;
                    display:flex; flex-direction:column;
                    flex:1;
                ">
                    <div
                        class="hist-nome"
                        data-nome-slug="${slug}"
                        style="transition:color 0.5s ease;"
                    >${nome}</div>

                    <!-- barra preenchida pelo observer -->
                    <div class="barra-slot"></div>
                </div>
            </div>
        `;

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirModal(nome);
            }
        });

        card.addEventListener('click', () => abrirModal(nome));
        fragment.appendChild(card);
        appearanceObserver.observe(card); // ← só carrega quando aparecer
    });

    scroll.appendChild(fragment);

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
        scroll.innerHTML = '';
    };
}
