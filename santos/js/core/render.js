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
    if (lido)            return '✓ Concluído';
    if (progresso >= 75) return `${progresso}%`;
    if (progresso >= 30) return `${progresso}%`;
    if (progresso > 0)   return `${progresso}%`;
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

function _imgFallback(img, slug) {
    img.onerror = null;
    img.src = 'imagens/default.jpg';
}

// ─────────────────────────────────────────────
//  FILL LÍQUIDO (reutilizável)
// ─────────────────────────────────────────────
function _criarFill(slug, corFill, idAtributo = 'data-fill-slug') {
    return `
        <div ${idAtributo}="${slug}" style="
            position: absolute; bottom: 0; left: 0;
            width: 100%; height: 0%;
            background: ${corFill};
            z-index: 1;
            border-radius: 0 0 var(--radius) var(--radius);
            transition: height 1.4s cubic-bezier(0.4,0,0.2,1);
        ">
            <div style="
                position: absolute; top: -12px; left: 0;
                width: 100%; overflow: hidden;
                height: 14px; z-index: 2;
            ">
                <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                     style="width:200%; height:100%; animation: waveSlide 3s linear infinite;">
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

    const labelStatus  = _labelStatus(progresso, lido);
    const largura      = lido ? 100 : progresso;
    const corTexto     = modo === 'hist'
        ? (progresso > 0 || lido ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)')
        : 'rgba(255,255,255,0.85)';
    const corBarra     = modo === 'hist'
        ? (progresso > 0 || lido ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)')
        : 'rgba(255,255,255,0.2)';
    const corFill      = modo === 'hist'
        ? (progresso > 0 || lido ? 'rgba(255,255,255,0.7)' : 'transparent')
        : 'rgba(255,255,255,0.7)';
    const margin       = modo === 'grid' ? '-6px 0 10px' : '6px 0 2px';
    const gap          = modo === 'grid' ? '8px' : '6px';
    const fontSize     = modo === 'grid' ? '0.65rem' : '0.62rem';

    return `
        <div style="margin:${margin}; display:flex; align-items:center; gap:${gap};">
            <div style="
                flex:1; height:3px;
                background:${corBarra};
                border-radius:2px; overflow:hidden;
            ">
                <div style="
                    height:100%; width:${largura}%;
                    background:${corFill};
                    transition:width 1s ease;
                "></div>
            </div>
            <span style="
                font-size:${fontSize}; font-weight:600;
                color:${corTexto};
                white-space:nowrap; letter-spacing:0.4px;
            ">${labelStatus}</span>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  ANIMAR FILL
// ─────────────────────────────────────────────
function _animarFill(container, slug, alturaFill, delay = 80) {
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = container.querySelector(`[data-fill-slug="${slug}"]`);
            if (fill) fill.style.height = alturaFill;
        }, delay);
    });
}

// ─────────────────────────────────────────────
//  RENDER DO GRID PRINCIPAL
// ─────────────────────────────────────────────
export function renderizarGrid(lista, grid, abrirModal) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card      = document.createElement("article");
        card.className  = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        const slug        = _slugify(santo.nome);
        const progresso   = _getProgresso(slug);
        const lido        = _getLido(slug);
        const alturaFill  = lido ? '100%' : `${progresso}%`;
        const corFill     = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        const corNome     = (lido || progresso >= 50) ? '#ffffff' : '';
        const btnLabel    = lido ? 'Reler Biografia' : (progresso > 0 ? 'Continuar lendo' : 'Ler Biografia');
        const btnIcon     = lido ? 'fa-redo' : 'fa-book-open';

        card.innerHTML = `
            <div class="card-inner" style="position:relative; border-radius:var(--radius); overflow:hidden;">

                ${_criarFill(slug, corFill, 'data-fill-slug')}

                <!-- BADGES -->
                <div class="santo-badge-container" style="position:relative; z-index:3;">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>

                <!-- IMAGEM -->
                <div class="image-container" style="position:relative; z-index:3;">
                    <img
                        src="${_getImgSrc(slug)}"
                        onerror="
                            if(!this._triedJpg){
                                this._triedJpg=true;
                                this.src='imagens/santos/${slug}.jpg';
                            } else {
                                this.onerror=null;
                                this.src='imagens/default.jpg';
                            }
                        "
                        alt="${santo.nome}"
                        loading="lazy"
                    >
                </div>

                <!-- CONTEÚDO -->
                <div class="santo-card-content" style="position:relative; z-index:3;">
                    <h3
                        id="nome-${slug}"
                        data-nome-slug="${slug}"
                        style="transition:color 0.5s ease; ${corNome ? `color:${corNome};` : ''}"
                    >
                        ${santo.nome}
                    </h3>

                    ${_criarMiniBarra(progresso, lido, 'grid')}

                    <div class="card-footer">
                        <button class="btn-primary">
                            <span>${btnLabel}</span>
                            <i class="fas ${btnIcon}"></i>
                        </button>
                    </div>
                </div>

            </div>
        `;

        _animarFill(card, slug, alturaFill, 80 + (index % 15) * 30);

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

    hist.forEach(nome => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug        = _slugify(nome);
        const progresso   = _getProgresso(slug);
        const lido        = _getLido(slug);
        const alturaFill  = lido ? '100%' : `${progresso}%`;
        const corFill     = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        const corNome     = (lido || progresso >= 50) ? '#ffffff' : '';

        const card        = document.createElement('div');
        card.className    = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;

        card.innerHTML = `
            <div class="card-inner" style="position:relative; border-radius:var(--radius); overflow:hidden;">

                ${_criarFill(slug, corFill, 'data-fill-slug')}

                <!-- BADGES -->
                <div class="santo-badge-container" style="position:relative; z-index:3; padding-top:10px;">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>

                <!-- IMAGEM -->
                <div class="hist-img-wrap" style="
                    margin:8px; width:calc(100% - 16px);
                    border-radius:14px; overflow:hidden;
                    position:relative; z-index:3; height:180px;
                ">
                    <img
                        src="${_getImgSrc(slug)}"
                        onerror="
                            if(!this._triedJpg){
                                this._triedJpg=true;
                                this.src='imagens/santos/${slug}.jpg';
                            } else {
                                this.onerror=null;
                                this.src='imagens/default.jpg';
                            }
                        "
                        alt="${nome}"
                        style="width:100%; height:100%; object-fit:cover; transition:transform 0.6s ease;"
                    >
                    ${lido ? '<span class="hist-badge-lido">✓ Lido</span>' : ''}
                </div>

                <!-- INFO -->
                <div class="hist-info" style="position:relative; z-index:3; padding:12px 16px 16px; text-align:center;">
                    <div
                        class="hist-nome"
                        data-nome-slug="${slug}"
                        style="${corNome ? `color:${corNome};` : ''} transition:color 0.5s ease;"
                    >
                        ${nome}
                    </div>

                    ${_criarMiniBarra(progresso, lido, 'hist')}
                </div>

            </div>
        `;

        _animarFill(card, slug, alturaFill, 80);

        card.addEventListener('click', () => abrirModal(nome));
        scroll.appendChild(card);
    });

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
    };
}
