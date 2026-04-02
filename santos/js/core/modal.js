export function criarModal(baseDados) {
    if (!document.getElementById("santoModal")) {
        const modalHTML = `
            <div id="santoModal" class="modal-blur">
                <button class="close-modal">&times;</button>
                <div class="modal-content">
                    <div id="modalHeaderImg" class="modal-header-img">
                        <h1 id="modalTitle"></h1>
                    </div>
                    <div class="modal-body-padding">
                        <div id="modalContent"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

export async function abrirModal(nomeSanto, baseDados) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal = document.getElementById("santoModal");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const headerImg = document.getElementById("modalHeaderImg");

    title.textContent = santo.nome;
    content.innerHTML = `<div style="color: #8b6f3d; text-align:center; padding:20px;">Buscando registros sagrados...</div>`;
    
    const slug = santo.nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');

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
                <p>A biografia de <strong>${santo.nome}</strong> está sendo preparada.<br>
                <small>(Verifique se o arquivo doutores/${slug}.html existe)</small></p>
            </div>`;
    }
}

export function fecharModal() {
    const modal = document.getElementById("santoModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    }
}

export function eventosModal() {
    document.addEventListener("click", (e) => {
        if (e.target.closest(".close-modal") || e.target.id === "santoModal") {
            fecharModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") fecharModal();
    });
}
