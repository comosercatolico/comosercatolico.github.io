;
/* =========================
      CONFIGURAÇÕES GERAIS
========================= */
const grid = document.getElementById("santosGrid");
const pesquisaInput = document.getElementById("pesquisaSantos");
const categoriasContainer = document.getElementById("categoriasContainer");

const baseDados = typeof listaSantos !== 'undefined' ? listaSantos : [];

/* =========================
      MOTOR DE RENDERIZAÇÃO
========================= */
const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

function renderizarGrid(lista) {
    if (!grid) return;
    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    lista.forEach((santo, index) => {
        const card = document.createElement("article");
        card.className = "santo-card";
        card.style.transitionDelay = `${(index % 15) * 30}ms`;

        // Normalização do nome para o arquivo de imagem
        const nomeArquivo = santo.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/'/g, '');

        card.innerHTML = `
            <div class="card-inner">
                <div class="santo-badge-container">
                    ${santo.categorias.map(c => `<span class="badge">${c}</span>`).join(' ')}
                </div>
                <div class="image-container">
                    <img src="../imagens/santos/${nomeArquivo}.jpg" 
                         onerror="this.src='imagens/default.jpg'" 
                         alt="${santo.nome}" loading="lazy">
                </div>
                <div class="santo-card-content">
                    <h3>${santo.nome}</h3>
                    <div class="card-footer">
                        <button class="btn-primary" onclick="abrirModal('${santo.nome.replace(/'/g, "\\'")}')">
                            <span>Ler Biografia</span>
                            <i class="fas fa-book-open"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        fragment.appendChild(card);
        appearanceObserver.observe(card);
    });

    grid.appendChild(fragment);
}

/* =========================
      FILTROS E PESQUISA
========================= */
let debounceTimer;
if (pesquisaInput) {
    pesquisaInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const termo = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        debounceTimer = setTimeout(() => {
            const filtrados = baseDados.filter(s => {
                const nomeNormalizado = s.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const nomeMatch = nomeNormalizado.includes(termo);
                const catMatch = s.categorias.some(c => 
                    c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(termo)
                );
                return nomeMatch || catMatch;
            });
            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        }, 250);
    });
}

function inicializarCategorias() {
    if (!categoriasContainer) return;
    const cats = [...new Set(baseDados.flatMap(s => s.categorias))].sort();
    const menuCategorias = ["Todos", ...cats];

    categoriasContainer.innerHTML = "";

    menuCategorias.forEach(cat => {
        const chip = document.createElement("button");
        chip.className = `chip ${cat === "Todos" ? "active" : ""}`;
        chip.innerHTML = `
            <span class="chip-text">${cat}</span>
            <span class="chip-count">${cat === "Todos" ? baseDados.length : baseDados.filter(s => s.categorias.includes(cat)).length}</span>
        `;

        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const filtrados = cat === "Todos" ? baseDados : baseDados.filter(s => s.categorias.includes(cat));
            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        });

        categoriasContainer.appendChild(chip);
    });
}

/* =========================
      MODAL DINÂMICO (CORRIGIDO)
========================= */
if (!document.getElementById("santoModal")) {
    const modalHTML = `
        <div id="santoModal" class="modal-blur">
            <button class="close-modal">&times;</button>
            <div class="modal-content">
                <div id="modalHeaderImg" class="modal-header-img"></div>
                <div class="modal-body-padding">
                    <h1 id="modalTitle"></h1>
                    <div id="modalContent"></div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.abrirModal = async function(nomeSanto) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal = document.getElementById("santoModal");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const headerImg = document.getElementById("modalHeaderImg");

    // Limpa e prepara o modal
    title.textContent = santo.nome;
    content.innerHTML = `<div style="color: #8b6f3d; text-align:center; padding:20px;">Buscando registros sagrados...</div>`;
    
    const slug = santo.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/'/g, '');
    
    // Define a imagem de fundo do cabeçalho
    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    try {
    const response = await fetch(`/santos/doutores/${slug}.html`);
if (!response.ok) throw new Error("Arquivo não encontrado");

const html = await response.text();

content.innerHTML = `
    <div class="santo-info">
        <div class="vocation-badge">Doutor da Igreja • ${santo.categorias.join(' • ')}</div>
        <div class="biografia-container">
            ${html}
        </div>
    </div>
`;
    } catch (err) {
        console.error(err);
        content.innerHTML = `
            <div class="vocation-badge">Aviso</div>
            <div class="biografia-container" style="text-align: center;">
                <p>A biografia de <strong>${santo.nome}</strong> está sendo preparada. <br>
                <small>(Verifique se o arquivo doutores/${slug}.md existe)</small></p>
            </div>`;
    }
};
document.addEventListener("click", (e) => {
    if (e.target.closest(".close-modal") || e.target.id === "santoModal") {
        fecharModal();
    }
});

function fecharModal() {
    const modal = document.getElementById("santoModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    }
}

/* =========================
      INICIALIZAÇÃO FINAL
========================= */
function atualizarContador(num) {
    const contador = document.getElementById("santoContador");
    if(contador) contador.textContent = `${num} santos encontrados`;
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        renderizarGrid(baseDados);
        inicializarCategorias();
        atualizarContador(baseDados.length);
    }, 150);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharModal();
});
