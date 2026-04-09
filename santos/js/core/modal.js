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
            const max = scrollHeight - clientHeight;
            if (max <= 0) return;

            const pct = Math.min(100, Math.round((scrollTop / max) * 100));
            const slug = scrollArea.dataset.slug;
            if (!slug) return;

            localStorage.setItem(`progresso-${slug}`, pct);
            localStorage.setItem(`scroll-${slug}`, scrollTop);

            _atualizarProgressoVisual(slug, pct);

            if (pct >= 95) {
                localStorage.setItem(`lido-${slug}`, '1');
                const btn = document.getElementById("btnFinalizado");
                if (btn && !btn.classList.contains("ativo")) {
                    btn.classList.add("ativo");
                    btn.textContent = "✓ Leitura concluída";
                }
            }
        });
    }
}

function _atualizarProgressoVisual(slug, pct) {
    const fill = document.querySelector(`[data-fill-slug="${slug}"]`);
    if (fill) {
        fill.style.height = pct + "%";
        const lido = localStorage.getItem(`lido-${slug}`) === '1';
        fill.style.background = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    }

    const nome = document.querySelector(`[data-nome-slug="${slug}"]`);
    if (nome) {
        nome.style.color = pct >= 50 || localStorage.getItem(`lido-${slug}`) === '1'
            ? '#ffffff'
            : '';
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
    content.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#aaa;font-family:'Inter',sans-serif;font-size:0.9rem;">Carregando...</div>`;

    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // ✅ Badge sem duplicatas
    const categoriasUnicas = [...new Set(santo.categorias)];
    const badgeTexto = categoriasUnicas.join(' • ');

    const pasta = santo.pasta || "doutores";
    const caminho = `/santos/${pasta}/${slug}.html`;

    try {
        const response = await fetch(caminho);
        if (!response.ok) throw new Error("Não encontrado");

        const html = await response.text();

        const progressoSalvo = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
        const lido = localStorage.getItem(`lido-${slug}`) === '1';

        content.innerHTML = `
            <div class="santo-info">
                <div class="vocation-badge">${badgeTexto}</div>
                <div class="biografia-container">${html}</div>
                <button class="btn-finalizado ${lido ? 'ativo' : ''}" id="btnFinalizado">
                    ${lido ? '✓ Leitura concluída' : '✓ Marcar como concluída'}
                </button>
            </div>
        `;

        // Botão finalizado (toggle)
        document.getElementById("btnFinalizado").addEventListener("click", function() {
            const jaLido = localStorage.getItem(`lido-${slug}`) === '1';
            if (jaLido) {
                localStorage.removeItem(`lido-${slug}`);
                const pctAtual = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
                this.classList.remove("ativo");
                this.textContent = '✓ Marcar como concluída';
                _atualizarProgressoVisual(slug, pctAtual);
            } else {
                localStorage.setItem(`lido-${slug}`, '1');
                localStorage.setItem(`progresso-${slug}`, '100');
                this.classList.add("ativo");
                this.textContent = '✓ Leitura concluída';
                _atualizarProgressoVisual(slug, 100);
            }
            // Atualiza cards no grid e histórico
            _atualizarCardGrid(slug);
        });

        // Restaura scroll e visual
        const posicaoSalva = parseInt(localStorage.getItem(`scroll-${slug}`) || "0");
        setTimeout(() => {
            if (posicaoSalva > 0) scrollArea.scrollTop = posicaoSalva;
            _atualizarProgressoVisual(slug, lido ? 100 : progressoSalvo);
        }, 120);

        // Navegação por abas
        setTimeout(() => {
            content.querySelectorAll('.sl-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const nomePainel = btn.getAttribute('data-painel');
                    const wrap = btn.closest('.sl-wrap');
                    if (!wrap) return;
                    wrap.querySelectorAll('.sl-painel').forEach(p => p.classList.remove('ativo'));
                    wrap.querySelectorAll('.sl-nav-btn').forEach(b => b.classList.remove('ativo'));
                    const alvo = wrap.querySelector(`[data-nome="${nomePainel}"]`);
                    if (alvo) alvo.classList.add('ativo');
                    btn.classList.add('ativo');
                });
            });
        }, 200);

        // Marcação de linhas
        setTimeout(() => ativarLinhasClicaveis(slug), 120);

        // Toggle marcação
        document.getElementById("toggleHighlight").onclick = () => {
            const ativo = modal.classList.toggle("modo-marcacao");
            document.getElementById("toggleHighlight").textContent = ativo ? "📍" : "🖍️";
        };

    } catch (err) {
        console.error(err);
        content.innerHTML = `
            <div class="vocation-badge">Aviso</div>
            <div class="biografia-container" style="text-align:center;padding:40px 0;">
                <p>Biografia não encontrada.</p>
            </div>
        `;
    }
}

// Atualiza o card do grid principal após toggle de lido
function _atualizarCardGrid(slug) {
    const fill = document.getElementById(`fill-${slug}`);
    const lido = localStorage.getItem(`lido-${slug}`) === '1';
    const pct  = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");

    if (fill) {
        fill.style.height = lido ? '100%' : pct + "%";
        fill.style.background = lido
            ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
            : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    }

    const nomeEl = document.getElementById(`nome-${slug}`);
    if (nomeEl) {
        nomeEl.style.color = (lido || pct >= 50) ? '#ffffff' : '';
    }
}

export function fecharModal() {
    const modal = document.getElementById("santoModal");
    if (!modal) return;
    modal.classList.remove("active", "modo-marcacao");
    document.body.style.overflow = "auto";

    const btnH = document.getElementById("toggleHighlight");
    if (btnH) btnH.textContent = "🖍️";
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

    const salvo = localStorage.getItem(`linha-${slug}`);
    if (salvo !== null) {
        const alvo = container.querySelector(`.linha[data-index="${salvo}"]`);
        if (alvo) alvo.classList.add("linha-marcada");
    }
}
