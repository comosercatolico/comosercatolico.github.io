export function criarModal(baseDados) {
    if (!document.getElementById("santoModal")) {
        const modalHTML = `
            <div id="santoModal" class="modal-blur">
                <button class="close-modal">&times;</button>
                <button class="toggle-highlight" id="toggleHighlight" title="Marcar linha">🖍️</button>
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

        const scrollArea = document.getElementById("modalScrollArea");

        scrollArea.addEventListener("scroll", () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
            const slug = scrollArea.dataset.slug;
            if (!slug) return;

            localStorage.setItem(`progresso-${slug}`, pct);
            localStorage.setItem(`scroll-${slug}`, scrollTop);
        });
    }
}

export async function abrirModal(nomeSanto, baseDados) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal      = document.getElementById("santoModal");
    const title      = document.getElementById("modalTitle");
    const content    = document.getElementById("modalContent");
    const headerImg  = document.getElementById("modalHeaderImg");
    const scrollArea = document.getElementById("modalScrollArea");

    const slug = santo.nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');

    scrollArea.dataset.slug = slug;
    scrollArea.scrollTop = 0;

    title.textContent = santo.nome;
    content.innerHTML = `<div style="text-align:center; padding:20px;">Carregando...</div>`;

    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    try {
        const response = await fetch(`/santos/doutores/${slug}.html`);
        if (!response.ok) throw new Error("Arquivo não encontrado");

        const html = await response.text();

        content.innerHTML = `
            <div class="santo-info">
                <div class="vocation-badge">
                    Doutor da Igreja • ${santo.categorias.join(' • ')}
                </div>

                <div class="biografia-container">
                    ${html}
                </div>

                <button class="btn-finalizado" id="btnFinalizado">
                    ✓ Marcar como concluída
                </button>
            </div>
        `;

        // 🔥 ATIVA MARCAÇÃO DE LINHAS
        setTimeout(() => {
            ativarLinhasClicaveis(slug);
        }, 100);

        // 🔥 BOTÃO DE MARCAR LINHA
        const btnHighlight = document.getElementById("toggleHighlight");

        btnHighlight.onclick = () => {
            const ativo = modal.classList.toggle("modo-marcacao");
            btnHighlight.textContent = ativo ? "📍" : "🖍️";
        };

        // 🔥 RESTAURA SCROLL
        const posicaoSalva = parseInt(localStorage.getItem(`scroll-${slug}`) || "0");
        if (posicaoSalva > 0) {
            setTimeout(() => {
                scrollArea.scrollTop = posicaoSalva;
            }, 100);
        }

    } catch (err) {
        console.error(err);

        content.innerHTML = `
            <div class="vocation-badge">Aviso</div>
            <div class="biografia-container" style="text-align:center;">
                <p>Biografia não encontrada.</p>
            </div>
        `;
    }
}

export function fecharModal() {
    const modal = document.getElementById("santoModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
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

function ativarLinhasClicaveis(slug) {
    const container = document.querySelector(".biografia-container");
    if (!container) return;

    const modal = document.getElementById("santoModal");

    const linhas = container.querySelectorAll("p");

    linhas.forEach((linha, i) => {
        linha.classList.add("linha");
        linha.dataset.index = i;

        linha.addEventListener("click", () => {
            if (!modal.classList.contains("modo-marcacao")) return;

            linhas.forEach(l => l.classList.remove("linha-marcada"));

            linha.classList.add("linha-marcada");

            localStorage.setItem(`linha-${slug}`, i);
        });
    });

    // 🔥 RESTAURA MARCAÇÃO
    const salvo = localStorage.getItem(`linha-${slug}`);
    if (salvo !== null) {
        const alvo = container.querySelector(`.linha[data-index="${salvo}"]`);
        if (alvo) alvo.classList.add("linha-marcada");
    }
}
