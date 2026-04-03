const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

export function renderizarGrid(lista, grid, abrirModal) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();
    lista.forEach((santo, index) => {
        const card = document.createElement("article");
        card.className = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;
        const nomeArquivo = santo.nome.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-')
            .replace(/'/g, '');
        card.innerHTML = `
    <div class="card-inner" style="position:relative; border-radius: var(--radius); overflow: hidden;">
        <div class="progresso-fill" id="fill-${nomeArquivo}" style="
            position: absolute; bottom: 0; left: 0; width: 100%;
            background: linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%);
            height: 0%; z-index: 1; transition: height 1.2s cubic-bezier(0.4,0,0.2,1);
            border-radius: 0 0 var(--radius) var(--radius);
        "></div>
        <div class="santo-badge-container">
            ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
        </div>
        <div class="image-container" style="
            margin: 8px; width: calc(100% - 16px);
            border-radius: 14px; overflow: hidden; position: relative; z-index: 2;
        ">
            <img src="imagens/santos/${nomeArquivo}.jpg" 
                 onerror="this.onerror=null; this.src='imagens/default.jpg';" 
                 alt="${santo.nome}" loading="lazy">
        </div>
        <div class="santo-card-content" style="position: relative; z-index: 2;">
            <h3 id="nome-${nomeArquivo}" style="transition: color 0.4s ease;">${santo.nome}</h3>
            <div class="card-footer">
                <button class="btn-primary">
                    <span>Ler Biografia</span>
                    <i class="fas fa-book-open"></i>
                </button>
            </div>
        </div>
    </div>
`;
        const progresso = parseInt(localStorage.getItem(`progresso-${nomeArquivo}`) || "0");
        const lido = localStorage.getItem(`lido-${nomeArquivo}`) === '1';
        setTimeout(() => {
            const fill = card.querySelector(".progresso-fill");
            const nome = card.querySelector("h3");
            if (fill) {
                fill.style.height = lido ? '100%' : progresso + "%";
                fill.style.background = lido
                    ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
                    : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
            }
            if (nome && (lido || progresso >= 50)) nome.style.color = "#ffffff";
        }, 100);
        const botao = card.querySelector(".btn-primary");
        botao.addEventListener("click", () => abrirModal(santo.nome));
        fragment.appendChild(card);
        appearanceObserver.observe(card);
    });
    grid.appendChild(fragment);
}

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

        const slug = nome.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-')
            .replace(/'/g, '');

        const progresso = parseInt(localStorage.getItem(`progresso-${slug}`) || '0');
        const lido = localStorage.getItem(`lido-${slug}`) === '1';
        const altura  = lido ? '100%' : progresso + '%';
        const corFill = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        const corNome  = (lido || progresso >= 50) ? '#ffffff' : '';
        const textoPct = lido ? '✓ Concluído' : (progresso > 0 ? progresso + '% lido' : 'Não iniciado');

        const card = document.createElement('div');
        card.className = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;
        card.innerHTML = `
            <div class="card-inner" style="position:relative; border-radius: var(--radius); overflow:hidden;">
                <div class="hist-progresso-fill-bg" style="
                    position: absolute; bottom: 0; left: 0; width: 100%;
                    height: ${altura};
                    background: ${corFill};
                    z-index: 1;
                    transition: height 1.2s cubic-bezier(0.4,0,0.2,1);
                    border-radius: 0 0 var(--radius) var(--radius);
                "></div>
                <div class="santo-badge-container" style="position:relative; z-index:2; padding-top:10px;">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>
                <div class="hist-img-wrap" style="
                    margin: 8px; width: calc(100% - 16px);
                    border-radius: 14px; overflow: hidden; position: relative; z-index: 2;
                    height: 180px;
                ">
                    <img src="imagens/santos/${slug}.jpg"
                         onerror="this.onerror=null;this.src='imagens/default.jpg';"
                         alt="${nome}"
                         style="width:100%; height:100%; object-fit:cover; transition: transform 0.6s ease;">
                    ${lido ? '<span class="hist-badge-lido">✓ Lido</span>' : ''}
                </div>
                <div class="hist-info" style="position:relative; z-index:2; padding: 12px 16px 16px; text-align:center;">
                    <div class="hist-nome" style="color:${corNome}; transition: color 0.4s ease;">${nome}</div>
                    <div class="hist-pct">${textoPct}</div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => abrirModal(nome));
        scroll.appendChild(card);
    });

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
    };
}
