const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
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
//  FALLBACK DE IMAGEM (centralizado)
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
//  FILL LÍQUIDO (reutilizável)
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
//  MINI BARRA DE PROGRESSO (reutilizável)
// ─────────────────────────────────────────────
function _criarMiniBarra(progresso, lido, modo = 'grid') {
    if (progresso === 0 && !lido) return '';

    const labelStatus = _labelStatus(progresso, lido);
    const largura     = lido ? 100 : progresso;
    const isHist      = modo === 'hist';

    const corTexto = isHist ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)';
    const corBarra = 'rgba(255,255,255,0.2)';
    const corFill  = 'rgba(255,255,255,0.75)';
    const margin   = isHist ? '6px 0 2px' : '-4px 0 10px';
    const gap      = '6px';
    const fontSize = isHist ? '0.62rem' : '0.65rem';

    return `
        <div style="margin:${margin}; display:flex; align-items:center; gap:${gap};">
            <div style="
                flex:1; height:3px;
                background:${corBarra};
                border-radius:2px; overflow:hidden;
            ">
                <div style="
                    height:100%; width:0%;
                    background:${corFill};
                    border-radius:2px;
                    transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
                " data-bar-width="${largura}"></div>
            </div>
            <span style="
                font-size:${fontSize}; font-weight:700;
                color:${corTexto};
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
            // Anima fill líquido
            const fill = container.querySelector(`[data-fill-slug="${slug}"]`);
            if (fill) fill.style.height = alturaFill;

            // Anima barras de progresso
            container.querySelectorAll('[data-bar-width]').forEach(bar => {
                bar.style.width = `${bar.dataset.barWidth}%`;
            });
        }, delay);
    });
}

// ─────────────────────────────────────────────
//  CORES (centralizadas)
// ─────────────────────────────────────────────
function _getCorFill(lido, progresso) {
    if (lido)         return 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)';
    if (progresso > 0) return 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    return null;
}

function _getBtnConfig(lido, progresso) {
    if (lido)          return { label: 'Reler Biografia',   icon: 'fa-redo'      };
    if (progresso > 0) return { label: 'Continuar lendo',   icon: 'fa-book-open' };
    return               { label: 'Ler Biografia',          icon: 'fa-book-open' };
}

// ─────────────────────────────────────────────
//  BADGE DE STATUS (sobre a imagem)
// ─────────────────────────────────────────────
function _criarBadgeStatus(lido, progresso) {
    if (lido) {
        return `
            <span style="
                position:absolute; top:10px; right:10px;
                background:rgba(76,175,130,0.92);
                color:#fff; font-size:0.6rem; font-weight:700;
                padding:3px 8px; border-radius:20px;
                letter-spacing:0.5px;
                backdrop-filter:blur(4px);
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
                z-index:4;
            ">✓ LIDO</span>
        `;
    }
    if (progresso > 0) {
        return `
            <span style="
                position:absolute; top:10px; right:10px;
                background:rgba(91,163,217,0.92);
                color:#fff; font-size:0.6rem; font-weight:700;
                padding:3px 8px; border-radius:20px;
                letter-spacing:0.5px;
                backdrop-filter:blur(4px);
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
                z-index:4;
            ">${progresso}%</span>
        `;
    }
    return '';
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

        const slug      = _slugify(santo.nome);
        const progresso = _getProgresso(slug);
        const lido      = _getLido(slug);
        const corFill   = _getCorFill(lido, progresso);
        const alturaFill = lido ? '100%' : `${progresso}%`;
        const btn       = _getBtnConfig(lido, progresso);
        const corNome   = (lido || progresso >= 50) ? '#ffffff' : '';

        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;
                border-radius:var(--radius);
                overflow:hidden;
                height:100%;
                display:flex;
                flex-direction:column;
            ">
                ${corFill ? _criarFill(slug, corFill) : ''}

                <!-- BADGES DE CATEGORIA -->
                <div class="santo-badge-container" style="
                    position:relative; z-index:3;
                    padding:10px 10px 4px;
                    display:flex; flex-wrap:wrap; gap:4px;
                ">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join('')}
                </div>

                <!-- IMAGEM COM PROPORÇÃO FIXA -->
                <div style="
                    position:relative; z-index:3;
                    margin:6px 8px;
                    border-radius:12px;
                    overflow:hidden;
                    aspect-ratio:3/4;
                    flex-shrink:0;
                    box-shadow:0 4px 12px rgba(0,0,0,0.2);
                ">
                    <img
                        src="${_getImgSrc(slug)}"
                        onerror="${IMG_FALLBACK_HANDLER}"
                        alt="${santo.nome}"
                        loading="lazy"
                        style="
                            width:100%; height:100%;
                            object-fit:cover;
                            object-position:center top;
                            display:block;
                            transition:transform 0.6s ease;
                        "
                    >
                    ${_criarBadgeStatus(lido, progresso)}
                </div>

                <!-- CONTEÚDO -->
                <div class="santo-card-content" style="
                    position:relative; z-index:3;
                    padding:8px 12px 14px;
                    display:flex; flex-direction:column;
                    flex:1;
                ">
                    <h3
                        data-nome-slug="${slug}"
                        style="
                            margin:0 0 4px;
                            transition:color 0.5s ease;
                            ${corNome ? `color:${corNome};` : ''}
                        "
                    >${santo.nome}</h3>

                    ${_criarMiniBarra(progresso, lido, 'grid')}

                    <div class="card-footer" style="margin-top:auto; padding-top:8px;">
                        <button class="btn-primary" aria-label="${btn.label} - ${santo.nome}">
                            <span>${btn.label}</span>
                            <i class="fas ${btn.icon}" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

            </div>
        `;

        // Hover na imagem
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

        _animarElementos(card, slug, alturaFill, 80 + (index % 15) * 30);

        card.querySelector(".btn-primary")
            .addEventListener("click", () => abrirModal(santo.nome));

        fragment.appendChild(card);
        appearanceObserver.observe(card);
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

    hist.forEach((nome, index) => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug       = _slugify(nome);
        const progresso  = _getProgresso(slug);
        const lido       = _getLido(slug);
        const corFill    = _getCorFill(lido, progresso);
        const alturaFill = lido ? '100%' : `${progresso}%`;
        const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';

        const card        = document.createElement('div');
        card.className    = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver biografia de ${nome}`);

        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;
                border-radius:var(--radius);
                overflow:hidden;
                height:100%;
                display:flex;
                flex-direction:column;
            ">
                ${corFill ? _criarFill(slug, corFill) : ''}

                <!-- BADGES -->
                <div class="santo-badge-container" style="
                    position:relative; z-index:3;
                    padding:10px 10px 4px;
                    display:flex; flex-wrap:wrap; gap:4px;
                ">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join('')}
                </div>

                <!-- IMAGEM COM PROPORÇÃO FIXA -->
                <div style="
                    position:relative; z-index:3;
                    margin:6px 8px;
                    border-radius:12px;
                    overflow:hidden;
                    aspect-ratio:3/4;
                    flex-shrink:0;
                    box-shadow:0 4px 14px rgba(0,0,0,0.25);
                ">
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
                    ${_criarBadgeStatus(lido, progresso)}
                </div>

                <!-- INFO -->
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
                        style="
                            ${corNome ? `color:${corNome};` : ''}
                            transition:color 0.5s ease;
                        "
                    >${nome}</div>

                    ${_criarMiniBarra(progresso, lido, 'hist')}
                </div>

            </div>
        `;

        // Hover na imagem
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

        // Acessibilidade: Enter/Space abre modal
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

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
        scroll.innerHTML = '';
    };
}
