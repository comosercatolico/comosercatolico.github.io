export function criarModal(baseDados) {
    if (!document.getElementById("santoModal")) {
        const modalHTML = `
            <div id="santoModal" class="modal-blur">
                <button class="close-modal">&times;</button>
                <div class="modal-content" id="modalScrollArea">
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

        // ✅ Listener adicionado UMA única vez, no elemento certo
        const scrollArea = document.getElementById("modalScrollArea");
        scrollArea.addEventListener("scroll", () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
            const slug = scrollArea.dataset.slug; // ✅ pega o slug salvo no dataset
            if (!slug) return;

            localStorage.setItem(`progresso-${slug}`, pct);

            const fill = document.getElementById(`fill-${slug}`);
            const nome = document.getElementById(`nome-${slug}`);
            if (fill) fill.style.height = pct + "%";
            if (nome) nome.style.color = pct >= 50 ? "#ffffff" : "";
        });
    }
}

export async function abrirModal(nomeSanto, baseDados) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal = document.getElementById("santoModal");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const headerImg = document.getElementById("modalHeaderImg");
    const scrollArea = document.getElementById("modalScrollArea");

    // ✅ slug definido antes de tudo
    const slug = santo.nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');

    // ✅ salva o slug no dataset para o listener de scroll acessar
    scrollArea.dataset.slug = slug;

    // ✅ reseta o scroll para o topo ao abrir
    scrollArea.scrollTop = 0;

    title.textContent = santo.nome;
    content.innerHTML = `<div style="color: #8b6f3d; text-align:center; padding:20px;">Buscando registros sagrados...</div>`;

    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // ✅ restaura o progresso salvo ao abrir
    const progressoSalvo = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
    const fill = document.getElementById(`fill-${slug}`);
    const nome = document.getElementById(`nome-${slug}`);
    if (fill) fill.style.height = progressoSalvo + "%";
    if (nome) nome.style.color = progressoSalvo >= 50 ? "#ffffff" : "";

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
