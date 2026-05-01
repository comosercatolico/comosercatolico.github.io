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

// ─────────────────────────────────────────────
//  COR DOMINANTE DA IMAGEM
// ─────────────────────────────────────────────
async function _getCorDominante(slug) {
    const cacheKey = `cor-dominante-${slug}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    const extensoes = ['jpg', 'png'];

    for (const ext of extensoes) {
        const src = `../imagens/santos/${slug}.${ext}`;
        const resultado = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 50;
                    canvas.height = 50;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 50, 50);

                    const data = ctx.getImageData(0, 0, 50, 50).data;
                    let r = 0, g = 0, b = 0, count = 0;

                    for (let i = 0; i < data.length; i += 16) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }

                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    const escuro = (v) => Math.max(0, v - 50);

                    resolve({
                        fill: `linear-gradient(180deg, rgba(${r},${g},${b},0.88) 0%, rgba(${escuro(r)},${escuro(g)},${escuro(b)},0.98) 100%)`,
                        badge: `rgba(${r},${g},${b},0.92)`
                    });
                } catch {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });

        if (resultado) {
            localStorage.setItem(cacheKey, JSON.stringify(resultado));
            return resultado;
        }
    }

    return null;
}

// ─────────────────────────────────────────────
//  ATUALIZAR PROGRESSO VISUAL
// ─────────────────────────────────────────────
function _atualizarProgressoVisual(slug, pct) {
    const fill = document.querySelector(`[data-fill-slug="${slug}"]`);
    if (fill) {
        fill.style.height = pct + "%";
        const lido = localStorage.getItem(`lido-${slug}`) === '1';

        // Tenta usar cor dominante cacheada
        const cached = localStorage.getItem(`cor-dominante-${slug}`);
        if (lido && cached) {
            fill.style.background = JSON.parse(cached).fill;
        } else if (lido) {
            fill.style.background = 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)';
        } else {
            fill.style.background = 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        }
    }

    const nome = document.querySelector(`[data-nome-slug="${slug}"]`);
    if (nome) {
        nome.style.color = pct >= 50 || localStorage.getItem(`lido-${slug}`) === '1'
            ? '#ffffff'
            : '';
    }
}

// ─────────────────────────────────────────────
//  ABRIR MODAL
// ─────────────────────────────────────────────
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
    content.innerHTML = `
        <div style="
            text-align:center;
            padding:40px 20px;
            color:#aaa;
            font-family:'Inter',sans-serif;
            font-size:0.9rem;
        ">Carregando...</div>
    `;

    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg')`;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Categorias sem duplicatas
    const categoriasUnicas = [...new Set(santo.categorias)];
    const badgeTexto = categoriasUnicas.join(' • ');

    const pasta = santo.pasta || "doutores";
    const caminho = `/santos/${pasta}/${slug}.html`;

    // Busca cor dominante em paralelo com o fetch da biografia
    const [response, corDominante] = await Promise.allSettled([
        fetch(caminho),
        _getCorDominante(slug)
    ]);

    const cor = corDominante.status === 'fulfilled' ? corDominante.value : null;

    // Badge de concluído com cor dominante
    const badgeStyle = cor
        ? `background:${cor.badge};`
        : `background:rgba(76,175,130,0.92);`;

    try {
        if (response.status !== 'fulfilled' || !response.value.ok) {
            throw new Error("Não encontrado");
        }

        const html = await response.value.text();

        const progressoSalvo = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
        const lido = localStorage.getItem(`lido-${slug}`) === '1';

        content.innerHTML = `
            <div class="santo-info">
                <div class="vocation-badge">${badgeTexto}</div>
                <div class="biografia-container">${html}</div>
                <button class="btn-finalizado ${lido ? 'ativo' : ''}" id="btnFinalizado"
                    ${lido && cor ? `style="${badgeStyle}"` : ''}>
                    ${lido ? '✓ Leitura concluída' : '✓ Marcar como concluída'}
                </button>
            </div>
        `;

        // Botão finalizado (toggle)
        document.getElementById("btnFinalizado").addEventListener("click", function () {
            const jaLido = localStorage.getItem(`lido-${slug}`) === '1';
            if (jaLido) {
                localStorage.removeItem(`lido-${slug}`);
                const pctAtual = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
                this.classList.remove("ativo");
                this.textContent = '✓ Marcar como concluída';
                this.style.cssText = '';
                _atualizarProgressoVisual(slug, pctAtual);
            } else {
                localStorage.setItem(`lido-${slug}`, '1');
                localStorage.setItem(`progresso-${slug}`, '100');
                this.classList.add("ativo");
                this.textContent = '✓ Leitura concluída';
                if (cor) this.style.cssText = badgeStyle;
                _atualizarProgressoVisual(slug, 100);
            }
            _atualizarCardGrid(slug, cor);
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

// ─────────────────────────────────────────────
//  ATUALIZAR CARD DO GRID APÓS TOGGLE
// ─────────────────────────────────────────────
function _atualizarCardGrid(slug, cor = null) {
    const fill = document.querySelector(`[data-fill-slug="${slug}"]`);
    const lido = localStorage.getItem(`lido-${slug}`) === '1';
    const pct  = parseInt(localStorage.getItem(`progresso-${slug}`) || "0");

    if (fill) {
        fill.style.height = lido ? '100%' : pct + "%";

        if (lido && cor) {
            fill.style.background = cor.fill;
        } else if (lido) {
            fill.style.background = 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)';
        } else {
            fill.style.background = 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
        }
    }

    // Atualiza badge de status (✓ LIDO / %)
    const badgeStatus = document.querySelector(`[data-badge-slug="${slug}"]`);
    if (badgeStatus) {
        if (lido) {
            badgeStatus.textContent = '✓ LIDO';
            badgeStatus.style.background = cor
                ? cor.badge
                : 'rgba(76,175,130,0.92)';
            badgeStatus.style.display = '';
        } else if (pct > 0) {
            badgeStatus.textContent = `${pct}%`;
            badgeStatus.style.background = 'rgba(91,163,217,0.92)';
            badgeStatus.style.display = '';
        } else {
            badgeStatus.style.display = 'none';
        }
    }

    const nomeEl = document.querySelector(`[data-nome-slug="${slug}"]`);
    if (nomeEl) {
        nomeEl.style.color = (lido || pct >= 50) ? '#ffffff' : '';
    }
}

// ─────────────────────────────────────────────
//  FECHAR MODAL
// ─────────────────────────────────────────────
export function fecharModal() {
    const modal = document.getElementById("santoModal");
    if (!modal) return;
    modal.classList.remove("active", "modo-marcacao");
    document.body.style.overflow = "auto";

    const btnH = document.getElementById("toggleHighlight");
    if (btnH) btnH.textContent = "🖍️";
}

// ─────────────────────────────────────────────
//  EVENTOS DO MODAL
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  LINHAS CLICÁVEIS (marcação)
// ─────────────────────────────────────────────
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
