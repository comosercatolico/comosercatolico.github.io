// ─────────────────────────────────────────────
//  CACHE DE MÓDULO
// ─────────────────────────────────────────────
const _cache = {
    biografias: new Map(),   // slug → html
    cores:      new Map(),   // slug → {fill, badge}
};

// ─────────────────────────────────────────────
//  SLUGIFY
// ─────────────────────────────────────────────
function _slugify(nome) {
    return nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');
}

// ─────────────────────────────────────────────
//  COR DOMINANTE
// ─────────────────────────────────────────────
async function _getCorDominante(slug) {
    // 1. cache em memória (sessão)
    if (_cache.cores.has(slug)) return _cache.cores.get(slug);

    // 2. cache em localStorage (visitas anteriores)
    const lsKey  = `cor-dominante-${slug}`;
    const cached = localStorage.getItem(lsKey);
    if (cached) {
        const cor = JSON.parse(cached);
        _cache.cores.set(slug, cor);
        return cor;
    }

    // 3. extrai da imagem
    const extrair = (src) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 50; canvas.height = 50;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 50, 50);
                const data = ctx.getImageData(0, 0, 50, 50).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 16) {
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                }
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                const esc = (v) => Math.max(0, v - 50);
                resolve({
                    fill:  `linear-gradient(180deg,rgba(${r},${g},${b},0.88) 0%,rgba(${esc(r)},${esc(g)},${esc(b)},0.98) 100%)`,
                    badge: `rgba(${r},${g},${b},0.92)`
                });
            } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });

    for (const ext of ['jpg', 'png']) {
        const cor = await extrair(`../imagens/santos/${slug}.${ext}`);
        if (cor) {
            _cache.cores.set(slug, cor);
            localStorage.setItem(lsKey, JSON.stringify(cor));
            return cor;
        }
    }

    return null;
}

// ─────────────────────────────────────────────
//  BUSCA BIOGRAFIA (com cache em memória)
// ─────────────────────────────────────────────
async function _fetchBiografia(slug, pasta) {
    if (_cache.biografias.has(slug)) return _cache.biografias.get(slug);

    const res = await fetch(`/santos/${pasta}/${slug}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    _cache.biografias.set(slug, html);
    return html;
}

// ─────────────────────────────────────────────
//  PROGRESSO / LIDO
// ─────────────────────────────────────────────
function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
}
function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

// ─────────────────────────────────────────────
//  CRIAR MODAL (uma vez)
// ─────────────────────────────────────────────
export function criarModal(baseDados) {
    if (document.getElementById("santoModal")) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="santoModal" class="modal-blur" role="dialog"
             aria-modal="true" aria-labelledby="modalTitle">

            <button class="close-modal" aria-label="Fechar">&times;</button>
            <button class="toggle-highlight" id="toggleHighlight"
                    title="Marcar linha" aria-pressed="false">🖍️</button>

            <div class="modal-content" id="modalScrollArea">
                <div id="modalHeaderImg" class="modal-header-img">
                    <h1 id="modalTitle"></h1>
                </div>
                <div class="modal-body-padding">
                    <div id="modalContent"></div>
                </div>
            </div>
        </div>
    `);

    // Listener de scroll — único, permanente
    const scrollArea = document.getElementById("modalScrollArea");
    let _scrollTicking = false;

    scrollArea.addEventListener("scroll", () => {
        if (_scrollTicking) return;
        _scrollTicking = true;
        requestAnimationFrame(() => {
            _onModalScroll(scrollArea);
            _scrollTicking = false;
        });
    }, { passive: true });
}

function _onModalScroll(scrollArea) {
    const { scrollTop, scrollHeight, clientHeight } = scrollArea;
    const max = scrollHeight - clientHeight;
    if (max <= 0) return;

    const pct  = Math.min(100, Math.round((scrollTop / max) * 100));
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
    if (!modal) return;

    const slug = _slugify(santo.nome);

    // ── Estado inicial ────────────────────────────────────────
    scrollArea.dataset.slug = slug;
    scrollArea.scrollTop    = 0;
    title.textContent       = santo.nome;

    // Imagem de cabeçalho com fallback
    headerImg.style.backgroundImage = `url('../imagens/santos/${slug}.jpg'),
                                        url('../imagens/santos/${slug}.png'),
                                        url('../imagens/default.jpg')`;

    // Skeleton loader
    content.innerHTML = _skeletonLoader();

    // Abre o modal imediatamente (não espera o fetch)
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Foco acessível
    requestAnimationFrame(() => {
        modal.querySelector('.close-modal')?.focus();
    });

    // ── Carrega em paralelo ───────────────────────────────────
    const pasta = santo.pasta || "doutores";

    const [bioResult, corResult] = await Promise.allSettled([
        _fetchBiografia(slug, pasta),
        _getCorDominante(slug)
    ]);

    const cor = corResult.status === 'fulfilled' ? corResult.value : null;

    // ── Renderiza conteúdo ────────────────────────────────────
    if (bioResult.status !== 'fulfilled') {
        content.innerHTML = _erroHTML();
        return;
    }

    const html        = bioResult.value;
    const progressoSalvo = _getProgresso(slug);
    const lido           = _getLido(slug);
    const categoriasUnicas = [...new Set(santo.categorias)];

    content.innerHTML = _montarConteudo({
        html,
        categorias: categoriasUnicas,
        lido,
        cor,
        slug
    });

    // ── Botão finalizado ──────────────────────────────────────
    _iniciarBtnFinalizado(slug, cor);

    // ── Scroll salvo ──────────────────────────────────────────
    const posicaoSalva = parseInt(localStorage.getItem(`scroll-${slug}`) || "0");
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (posicaoSalva > 0) scrollArea.scrollTop = posicaoSalva;
            _atualizarProgressoVisual(slug, lido ? 100 : progressoSalvo);
        }, 120);
    });

    // ── Abas ──────────────────────────────────────────────────
    _iniciarAbas(content);

    // ── Marcação de linhas ────────────────────────────────────
    _iniciarLinhasClicaveis(slug);

    // ── Toggle marcação ───────────────────────────────────────
    const btnH = document.getElementById("toggleHighlight");
    // Remove listener anterior (clonando o nó)
    const btnHNovo = btnH.cloneNode(true);
    btnH.replaceWith(btnHNovo);
    btnHNovo.addEventListener('click', () => {
        const ativo = modal.classList.toggle("modo-marcacao");
        btnHNovo.textContent       = ativo ? "📍" : "🖍️";
        btnHNovo.setAttribute('aria-pressed', String(ativo));
    });
}

// ─────────────────────────────────────────────
//  MONTAR HTML DO CONTEÚDO
// ─────────────────────────────────────────────
function _montarConteudo({ html, categorias, lido, cor, slug }) {
    const badgeTexto  = categorias.join(' • ');
    const badgeStyle  = cor ? `style="background:${cor.badge};"` : '';
    const btnStyle    = lido && cor ? `style="background:${cor.badge};"` : '';

    return `
        <div class="santo-info">
            <div class="vocation-badge">${badgeTexto}</div>
            <div class="biografia-container">${html}</div>
            <button
                class="btn-finalizado ${lido ? 'ativo' : ''}"
                id="btnFinalizado"
                ${lido ? btnStyle : ''}
                aria-pressed="${lido}"
            >
                ${lido ? '✓ Leitura concluída' : '✓ Marcar como concluída'}
            </button>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  SKELETON LOADER
// ─────────────────────────────────────────────
function _skeletonLoader() {
    const linha = (w) => `
        <div style="
            height:14px; width:${w};
            background:rgba(255,255,255,0.07);
            border-radius:6px;
            margin-bottom:10px;
            animation:skeletonPulse 1.4s ease-in-out infinite;
        "></div>`;

    return `
        <div style="padding:24px 20px;">
            ${linha('60%')}
            ${linha('100%')}
            ${linha('100%')}
            ${linha('85%')}
            ${linha('100%')}
            ${linha('90%')}
            ${linha('70%')}
        </div>
    `;
}

// Adiciona o keyframe uma única vez
if (!document.getElementById('_skeletonStyle')) {
    const s = document.createElement('style');
    s.id = '_skeletonStyle';
    s.textContent = `
        @keyframes skeletonPulse {
            0%,100% { opacity:.4 }
            50%      { opacity:.9 }
        }
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────
//  HTML DE ERRO
// ─────────────────────────────────────────────
function _erroHTML() {
    return `
        <div class="vocation-badge">Aviso</div>
        <div class="biografia-container"
             style="text-align:center;padding:40px 0;">
            <p>Biografia não encontrada.</p>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  BOTÃO FINALIZADO
// ─────────────────────────────────────────────
function _iniciarBtnFinalizado(slug, cor) {
    const btn = document.getElementById("btnFinalizado");
    if (!btn) return;

    btn.addEventListener("click", function () {
        const jaLido = _getLido(slug);

        if (jaLido) {
            localStorage.removeItem(`lido-${slug}`);
            const pctAtual = _getProgresso(slug);
            this.classList.remove("ativo");
            this.textContent = '✓ Marcar como concluída';
            this.style.cssText = '';
            this.setAttribute('aria-pressed', 'false');
            _atualizarProgressoVisual(slug, pctAtual);
        } else {
            localStorage.setItem(`lido-${slug}`, '1');
            localStorage.setItem(`progresso-${slug}`, '100');
            this.classList.add("ativo");
            this.textContent = '✓ Leitura concluída';
            this.setAttribute('aria-pressed', 'true');
            if (cor) this.style.cssText = `background:${cor.badge};`;
            _atualizarProgressoVisual(slug, 100);
        }

        _atualizarCardGrid(slug, cor);
    });
}

// ─────────────────────────────────────────────
//  NAVEGAÇÃO POR ABAS
// ─────────────────────────────────────────────
function _iniciarAbas(container) {
    container.querySelectorAll('.sl-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const nomePainel = btn.dataset.painel;
            const wrap = btn.closest('.sl-wrap');
            if (!wrap) return;
            wrap.querySelectorAll('.sl-painel').forEach(p => p.classList.remove('ativo'));
            wrap.querySelectorAll('.sl-nav-btn').forEach(b => b.classList.remove('ativo'));
            wrap.querySelector(`[data-nome="${nomePainel}"]`)?.classList.add('ativo');
            btn.classList.add('ativo');
        });
    });
}

// ─────────────────────────────────────────────
//  ATUALIZAR PROGRESSO VISUAL (grid + histório)
// ─────────────────────────────────────────────
function _atualizarProgressoVisual(slug, pct) {
    const lido   = _getLido(slug);
    const cached = localStorage.getItem(`cor-dominante-${slug}`);
    const cor    = cached ? JSON.parse(cached) : null;

    // Fill líquido
    document.querySelectorAll(`[data-fill-slug="${slug}"]`).forEach(fill => {
        fill.style.height = lido ? '100%' : pct + '%';
        fill.style.background = lido && cor
            ? cor.fill
            : lido
                ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
                : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    });

    // Nome
    document.querySelectorAll(`[data-nome-slug="${slug}"]`).forEach(el => {
        el.style.color = (pct >= 50 || lido) ? '#ffffff' : '';
    });

    // Barras de progresso nos cards
    document.querySelectorAll(`[data-bar-width]`).forEach(bar => {
        const card = bar.closest('[data-slug]');
        if (card?.dataset.slug === slug) {
            bar.style.width = (lido ? 100 : pct) + '%';
        }
    });
}

// ─────────────────────────────────────────────
//  ATUALIZAR CARD DO GRID
// ─────────────────────────────────────────────
function _atualizarCardGrid(slug, cor = null) {
    const lido = _getLido(slug);
    const pct  = _getProgresso(slug);

    // Fill
    document.querySelectorAll(`[data-fill-slug="${slug}"]`).forEach(fill => {
        fill.style.height = lido ? '100%' : pct + '%';
        fill.style.background = lido && cor
            ? cor.fill
            : lido
                ? 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)'
                : 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    });

    // Badge de status
    document.querySelectorAll(`[data-badge-slug="${slug}"]`).forEach(badge => {
        if (lido) {
            badge.textContent        = '✓ LIDO';
            badge.style.background   = cor?.badge ?? 'rgba(76,175,130,0.92)';
            badge.style.display      = '';
        } else if (pct > 0) {
            badge.textContent        = `${pct}%`;
            badge.style.background   = 'rgba(91,163,217,0.92)';
            badge.style.display      = '';
        } else {
            badge.style.display      = 'none';
        }
    });

    // Nome
    document.querySelectorAll(`[data-nome-slug="${slug}"]`).forEach(el => {
        el.style.color = (lido || pct >= 50) ? '#ffffff' : '';
    });

    // Botão do card
    document.querySelectorAll(`.santo-card[data-slug="${slug}"] .btn-primary span,
                               .hist-card[data-slug="${slug}"] .btn-primary span`).forEach(span => {
        span.textContent = lido ? 'Reler Biografia' : pct > 0 ? 'Continuar lendo' : 'Ler Biografia';
    });
}

// ─────────────────────────────────────────────
//  LINHAS CLICÁVEIS
// ─────────────────────────────────────────────
function _iniciarLinhasClicaveis(slug) {
    const container = document.querySelector(".biografia-container");
    const modal     = document.getElementById("santoModal");
    if (!container || !modal) return;

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

    // Restaura marcação salva
    const salvo = localStorage.getItem(`linha-${slug}`);
    if (salvo !== null) {
        container.querySelector(`.linha[data-index="${salvo}"]`)
                 ?.classList.add("linha-marcada");
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
    if (btnH) {
        btnH.textContent = "🖍️";
        btnH.setAttribute('aria-pressed', 'false');
    }

    // Limpa slug para parar o listener de scroll
    const scrollArea = document.getElementById("modalScrollArea");
    if (scrollArea) delete scrollArea.dataset.slug;
}

// ─────────────────────────────────────────────
//  EVENTOS GLOBAIS DO MODAL
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
