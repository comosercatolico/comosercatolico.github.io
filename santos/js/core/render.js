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

        // Tratamento do nome para buscar o arquivo de imagem
        const nomeArquivo = santo.nome.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-')
            .replace(/'/g, '');

        card.innerHTML = `
            <div class="card-inner">
                <div class="santo-badge-container">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>
                <div class="image-container">
                    <img src="imagens/santos/${nomeArquivo}.jpg" 
                         onerror="this.onerror=null; this.src='imagens/default.jpg';" 
                         alt="${santo.nome}" loading="lazy">
                </div>
                <div class="santo-card-content">
                    <h3>${santo.nome}</h3>
                    <div class="card-footer">
                        <button class="btn-primary">
                            <span>Ler Biografia</span>
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const botao = card.querySelector(".btn-primary");
        botao.addEventListener("click", () => abrirModal(santo.nome));

        fragment.appendChild(card);
        appearanceObserver.observe(card);
    });

    grid.appendChild(fragment);
}
