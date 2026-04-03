export function criarModal(baseDados) {
    if (!document.getElementById("santoModal")) {
        const modalHTML = `
            <div id="santoModal" class="modal-blur">
                <button class="close-modal">&times;</button>
                <button class="toggle-highlight" id="toggleHighlight" title="Destacar texto">🖍️</button>
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

            const fill = document.getElementById(`fill-${slug}`);
            const nome = document.getElementById(`nome-${slug}`);
            const lido = localStorage.getItem(`lido-${slug}`) === '1';
            if (fill && !lido) fill.style.height = pct + "%";
            if (nome && !lido) nome.style.color = pct >= 50 ? "#ffffff" : "";

            if (!lido) {
                const histCard = document.querySelector(`.hist-card[data-slug="${slug}"]`);
                if (histCard) {
                    const histFill = histCard.querySelector('.hist-progresso-fill-bg');
                    const histNome = histCard.querySelector('.hist-nome');
                    const histPct  = histCard.querySelector('.hist-pct');
                    if (histFill) histFill.style.height = pct + "%";
                    if (histNome) histNome.style.color = pct >= 50 ? "#ffffff" : "";
                    if (histPct)  histPct.textContent  = pct > 0 ? pct + "% lido" : "Não iniciado";
                }
            }
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
    content.innerHTML = `<div style="color: #8b6f3d; text-align:center; padding:20px;">Buscando registros sagrados...</div>`;

    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    const progressoSalvo = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
    const lido = localStorage.getItem(`lido-${slug}`) === '1';
    const fill = document.getElementById(`fill-${slug}`);
    const nome = document.getElementById(`nome-${slug}`);
    if (fill) {
        fill.style.height = lido ? '100%' : progressoSalvo + "%";
        fill.style.background = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    }
    if (nome) nome.style.color = (lido || progressoSalvo >= 50) ? "#ffffff" : "";

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
                <button class="btn-finalizado ${lido ? 'ativo' : ''}" id="btnFinalizado">
                    ${lido ? '✓ Biografia concluída' : '✓ Marcar como concluída'}
                </button>
            </div>
        `;

        // Código do highlight (movido para fora do template string)
        const btnHighlight = document.getElementById("toggleHighlight");
        if (btnHighlight) {
            const highlightAtivo = localStorage.getItem(`highlight-${slug}`) === '1';
            if (highlightAtivo) {
                modal.classList.add("highlight-mode");
            }
            btnHighlight.onclick = () => {
                const ativo = modal.classList.toggle("highlight-mode");
                if (ativo) {
                    localStorage.setItem(`highlight-${slug}`, '1');
                } else {
                    localStorage.removeItem(`highlight-${slug}`);
                }
            };
        }

        const posicaoSalva = parseInt(localStorage.getItem(`scroll-${slug}`) || "0");
        if (posicaoSalva > 0) {
            setTimeout(() => {
                scrollArea.scrollTop = posicaoSalva;
            }, 100);
        }

        document.getElementById('btnFinalizado').addEventListener('click', () => {
            const btn = document.getElementById('btnFinalizado');
            const jaLido = localStorage.getItem(`lido-${slug}`) === '1';
            if (jaLido) {
                localStorage.removeItem(`lido-${slug}`);
                localStorage.removeItem(`scroll-${slug}`);
                btn.classList.remove('ativo');
                btn.textContent = '✓ Marcar como concluída';
            } else {
                localStorage.setItem(`lido-${slug}`, '1');
                btn.classList.add('ativo');
                btn.textContent = '✓ Biografia concluída';
            }
            atualizarCoresCard(slug);
        });

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
    if (!modal) return;

    const slug = document.getElementById("modalScrollArea")?.dataset.slug;

    modal.classList.remove("active");
    document.body.style.overflow = "auto";

    if (slug) atualizarCoresCard(slug);
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

function atualizarCoresCard(slug) {
    const lido      = localStorage.getItem(`lido-${slug}`) === '1';
    const progresso = parseInt(localStorage.getItem(`progresso-${slug}`) || '0');
    const corFill   = lido
        ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
        : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';

    const fill = document.getElementById(`fill-${slug}`);
    const nome = document.getElementById(`nome-${slug}`);
    if (fill) {
        fill.style.height     = lido ? '100%' : progresso + '%';
        fill.style.background = corFill;
    }
    if (nome) nome.style.color = (lido || progresso >= 50) ? '#ffffff' : '';

    const histCard = document.querySelector(`.hist-card[data-slug="${slug}"]`);
    if (histCard) {
        const histFill  = histCard.querySelector('.hist-progresso-fill-bg');
        const histNome  = histCard.querySelector('.hist-nome');
        const histPct   = histCard.querySelector('.hist-pct');
        const histBadge = histCard.querySelector('.hist-badge-lido');

        if (lido) {
            histCard.classList.add('lido');
            if (histFill)  { histFill.style.height = '100%'; histFill.style.background = corFill; }
            if (histNome)  histNome.style.color = '#ffffff';
            if (histPct)   histPct.textContent   = '✓ Concluído';
            if (histBadge) histBadge.style.display = 'block';
        } else {
            histCard.classList.remove('lido');
            if (histFill)  { histFill.style.height = progresso + '%'; histFill.style.background = corFill; }
            if (histNome)  histNome.style.color = progresso >= 50 ? '#ffffff' : '';
            if (histPct)   histPct.textContent   = progresso > 0 ? progresso + '% lido' : 'Não iniciado';
            if (histBadge) histBadge.style.display = 'none';
        }
    }
}
