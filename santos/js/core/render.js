const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// ─────────────────────────────────────────────
//  RENDER DO GRID PRINCIPAL
// ─────────────────────────────────────────────
export function renderizarGrid(lista, grid, abrirModal) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card = document.createElement("article");
        card.className = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        const slug = _slugify(santo.nome);
        const progresso = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
        const lido = localStorage.getItem(`lido-${slug}`) === '1';

        const alturaFill   = lido ? '100%' : progresso + "%";
        const corFill      = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        const corNome      = (lido || progresso >= 50) ? '#ffffff' : '';
        const labelStatus  = _labelStatus(progresso, lido);

        card.innerHTML = `
            <div class="card-inner" style="position:relative; border-radius: var(--radius); overflow: hidden;">

                <!-- FILL LÍQUIDO -->
                <div id="fill-${slug}"
                     data-fill-slug="${slug}"
                     style="
                        position: absolute; bottom: 0; left: 0;
                        width: 100%; height: 0%;
                        background: ${corFill};
                        z-index: 1;
                        border-radius: 0 0 var(--radius) var(--radius);
                        transition: height 1.4s cubic-bezier(0.4,0,0.2,1);
                     ">
                    <!-- ONDA SVG no topo do líquido -->
                    <div style="
                        position: absolute; top: -12px; left: 0; width: 100%;
                        overflow: hidden; height: 14px; z-index: 2;
                    ">
                        <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                             style="width:200%; height:100%; animation: waveSlide 3s linear infinite;">
                            <path d="M0,7 C50,14 100,0 150,7 C200,14 250,0 300,7 C350,14 400,0 400,7 L400,14 L0,14 Z"
                                  fill="rgba(255,255,255,0.18)"/>
                        </svg>
                    </div>
                </div>

                <!-- BADGES -->
                <div class="santo-badge-container" style="position:relative; z-index:3;">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>

                <!-- IMAGEM -->
                <div class="image-container" style="position:relative; z-index:3;">
                    <img src="imagens/santos/${slug}.jpg"
                         onerror="this.onerror=null; this.src='imagens/default.jpg';"
                         alt="${santo.nome}" loading="lazy">
                </div>

                <!-- CONTEÚDO -->
                <div class="santo-card-content" style="position:relative; z-index:3;">
                    <h3 id="nome-${slug}"
                        data-nome-slug="${slug}"
                        style="transition:color 0.5s ease; ${corNome ? `color:${corNome};` : ''}">
                        ${santo.nome}
                    </h3>

                    <!-- MINI BARRA DE PROGRESSO -->
                    ${progresso > 0 || lido ? `
                    <div style="
                        margin: -6px 0 10px;
                        display: flex; align-items: center; gap: 8px;
                    ">
                        <div style="
                            flex:1; height:3px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 2px; overflow:hidden;
                        ">
                            <div style="
                                height:100%;
                                width: ${lido ? 100 : progresso}%;
                                background: rgba(255,255,255,0.7);
                                transition: width 1s ease;
                            "></div>
                        </div>
                        <span style="
                            font-size:0.65rem; font-weight:600;
                            color: rgba(255,255,255,0.85);
                            white-space:nowrap; letter-spacing:0.4px;
                        ">${labelStatus}</span>
                    </div>
                    ` : ''}

                    <div class="card-footer">
                        <button class="btn-primary">
                            <span>${lido ? 'Reler Biografia' : (progresso > 0 ? 'Continuar lendo' : 'Ler Biografia')}</span>
                            <i class="fas ${lido ? 'fa-redo' : 'fa-book-open'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Anima o fill após render
        requestAnimationFrame(() => {
            setTimeout(() => {
                const fill = card.querySelector(`#fill-${slug}`);
                if (fill) fill.style.height = alturaFill;
            }, 80 + (index % 15) * 30);
        });

        card.querySelector(".btn-primary").addEventListener("click", () => abrirModal(santo.nome));
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
    if (hist.length === 0) { section.style.display = 'none'; return; }

    section.style.display = 'block';
    scroll.innerHTML = '';

    hist.forEach(nome => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug      = _slugify(nome);
        const progresso = parseInt(localStorage.getItem(`progresso-${slug}`) || '0');
        const lido      = localStorage.getItem(`lido-${slug}`) === '1';

        const alturaFill = lido ? '100%' : progresso + '%';
        const corFill    = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';
        const labelStatus = _labelStatus(progresso, lido);

        const card = document.createElement('div');
        card.className = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;

        card.innerHTML = `
            <div class="card-inner" style="position:relative; border-radius: var(--radius); overflow:hidden;">

                <!-- FILL LÍQUIDO -->
                <div data-fill-slug="${slug}" style="
                    position: absolute; bottom: 0; left: 0;
                    width: 100%; height: 0%;
                    background: ${corFill};
                    z-index: 1;
                    border-radius: 0 0 var(--radius) var(--radius);
                    transition: height 1.4s cubic-bezier(0.4,0,0.2,1);
                ">
                    <!-- ONDA -->
                    <div style="
                        position: absolute; top: -12px; left: 0;
                        width: 100%; overflow: hidden; height: 14px; z-index: 2;
                    ">
                        <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                             style="width:200%; height:100%; animation: waveSlide 3s linear infinite;">
                            <path d="M0,7 C50,14 100,0 150,7 C200,14 250,0 300,7 C350,14 400,0 400,7 L400,14 L0,14 Z"
                                  fill="rgba(255,255,255,0.18)"/>
                        </svg>
                    </div>
                </div>

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
                    <img src="imagens/santos/${slug}.jpg"
                         onerror="this.onerror=null;this.src='imagens/default.jpg';"
                         alt="${nome}"
                         style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s ease;">
                    ${lido ? '<span class="hist-badge-lido">✓ Lido</span>' : ''}
                </div>

                <!-- INFO -->
                <div class="hist-info" style="position:relative; z-index:3; padding:12px 16px 16px; text-align:center;">
                    <div class="hist-nome"
                         data-nome-slug="${slug}"
                         style="${corNome ? `color:${corNome};` : ''} transition:color 0.5s ease;">
                        ${nome}
                    </div>

                    <!-- MINI BARRA -->
                    <div style="
                        margin: 6px 0 2px;
                        display: flex; align-items: center; gap: 6px;
                    ">
                        <div style="
                            flex:1; height:3px;
                            background: ${progresso > 0 || lido ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'};
                            border-radius: 2px; overflow:hidden;
                        ">
                            <div style="
                                height:100%;
                                width: ${lido ? 100 : progresso}%;
                                background: ${progresso > 0 || lido ? 'rgba(255,255,255,0.7)' : 'transparent'};
                                transition: width 1s ease;
                            "></div>
                        </div>
                        <span style="
                            font-size:0.62rem; font-weight:600;
                            color: ${progresso > 0 || lido ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)'};
                            white-space:nowrap;
                        ">${labelStatus}</span>
                    </div>
                </div>

            </div>
        `;

        // Anima fill após render
        requestAnimationFrame(() => {
            setTimeout(() => {
                const fill = card.querySelector(`[data-fill-slug="${slug}"]`);
                if (fill) fill.style.height = alturaFill;
            }, 80);
        });

        card.addEventListener('click', () => abrirModal(nome));
        scroll.appendChild(card);
    });

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
    };
}

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
    if (lido)           return '✓ Concluído';
    if (progresso >= 75) return `${progresso}%`;
    if (progresso >= 30) return `${progresso}%`;
    if (progresso > 0)  return `${progresso}%`;
    return '';
}
