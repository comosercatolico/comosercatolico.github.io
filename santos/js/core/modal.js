// ═══════════════════════════════════════════════════════════════
//  modal.js  —  Lux Fidei · Santos
//  Versão refatorada: caminhos absolutos, sem fallback errado,
//  tratamento de erros robusto, código limpo e documentado.
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────

/** Raiz pública das imagens de santos */
const IMG_BASE = '/imagens/santos';

/** Fallback se imagem não existir */
const IMG_FALLBACK = '/imagens/default.jpg';

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIO: slugify
// ─────────────────────────────────────────────────────────────

/**
 * Converte o nome do santo em slug URL-safe.
 * Ex.: "São Tomás de Aquino" → "sao-tomas-de-aquino"
 */
function _slugify(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIOS: localStorage
// ─────────────────────────────────────────────────────────────

function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || '0', 10);
}

function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIOS: label e botão
// ─────────────────────────────────────────────────────────────

function _labelStatus(progresso, lido) {
    if (lido)          return '✓ Concluído';
    if (progresso > 0) return `${progresso}%`;
    return '';
}

function _getBtnConfig(lido, progresso) {
    if (lido)          return { label: 'Reler Biografia',  icon: 'fa-redo'      };
    if (progresso > 0) return { label: 'Continuar lendo',  icon: 'fa-book-open' };
    return               { label: 'Ler Biografia',         icon: 'fa-book-open' };
}

// ─────────────────────────────────────────────────────────────
//  UTILITÁRIOS: cores
// ─────────────────────────────────────────────────────────────

function _getCorFill(lido, progresso, cor = null) {
    if (lido && cor)   return cor.fill;
    if (lido)          return 'linear-gradient(180deg,#4caf82 0%,#388e60 100%)';
    if (progresso > 0) return 'linear-gradient(180deg,#5ba3d9 0%,#4a8fc2 100%)';
    return null;
}

function _getCorDominanteCache(slug) {
    const cached = localStorage.getItem(`cor-dominante-${slug}`);
    return cached ? JSON.parse(cached) : null;
}

// ─────────────────────────────────────────────────────────────
//  EXTRAÇÃO DE COR DOMINANTE
// ─────────────────────────────────────────────────────────────

/**
 * Extrai a cor média da imagem do santo via Canvas API
 * e armazena em cache no localStorage para reutilização.
 * Tenta PNG → JPG automaticamente.
 */
async function _extrairECachearCor(slug) {
    const cacheKey = `cor-dominante-${slug}`;
    if (localStorage.getItem(cacheKey)) return; // já cacheado

    const extrair = (src) =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width  = 50;
                    canvas.height = 50;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 50, 50);

                    const data = ctx.getImageData(0, 0, 50, 50).data;
                    let r = 0, g = 0, b = 0, count = 0;

                    for (let i = 0; i < data.length; i += 16) {
                        r += data[i]; g += data[i + 1]; b += data[i + 2];
                        count++;
                    }
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    const esc = (v) => Math.max(0, v - 50);
                    resolve({
                        fill:  `linear-gradient(180deg,rgba(${r},${g},${b},0.88) 0%,rgba(${esc(r)},${esc(g)},${esc(b)},0.98) 100%)`,
                        badge: `rgba(${r},${g},${b},0.92)`,
                    });
                } catch {
                    resolve(null);
                }
            };

            img.onerror = () => resolve(null);
            img.src = src;
        });

    // Tenta PNG primeiro, depois JPG
    let cor = await extrair(`${IMG_BASE}/${slug}.png`);
    if (!cor) cor = await extrair(`${IMG_BASE}/${slug}.jpg`);
    if (cor) localStorage.setItem(cacheKey, JSON.stringify(cor));
}

// ─────────────────────────────────────────────────────────────
//  ATUALIZAR PROGRESSO VISUAL (fill + badge + nome)
// ─────────────────────────────────────────────────────────────

function _atualizarProgressoVisual(slug, pct) {
    const lido = _getLido(slug);
    const cor  = _getCorDominanteCache(slug);

    // Fill líquido
    const fill = document.querySelector(`[data-fill-slug="${slug}"]`);
    if (fill) {
        fill.style.height = (lido ? 100 : pct) + '%';
        fill.style.background = _getCorFill(lido, pct, cor) ||
            'linear-gradient(180deg,#5ba3d9 0%,#4a8fc2 100%)';
    }

    // Nome do card
    const nomeEl = document.querySelector(`[data-nome-slug="${slug}"]`);
    if (nomeEl) {
        nomeEl.style.color = (lido || pct >= 50) ? '#ffffff' : '';
    }
}

// ─────────────────────────────────────────────────────────────
//  ATUALIZAR CARD DO GRID (após toggle lido/não-lido)
// ─────────────────────────────────────────────────────────────

function _atualizarCardGrid(slug, cor = null) {
    const lido = _getLido(slug);
    const pct  = _getProgresso(slug);

    // Fill
    const fill = document.querySelector(`[data-fill-slug="${slug}"]`);
    if (fill) {
        fill.style.height     = (lido ? 100 : pct) + '%';
        fill.style.background = _getCorFill(lido, pct, cor) ||
            'linear-gradient(180deg,#5ba3d9 0%,#4a8fc2 100%)';
    }

    // Badge de status
    const badgeEl = document.querySelector(`[data-badge-slug="${slug}"]`);
    if (badgeEl) {
        if (lido) {
            badgeEl.textContent     = '✓ LIDO';
            badgeEl.style.background = cor ? cor.badge : 'rgba(76,175,130,0.92)';
            badgeEl.style.display    = '';
        } else if (pct > 0) {
            badgeEl.textContent     = `${pct}%`;
            badgeEl.style.background = 'rgba(91,163,217,0.92)';
            badgeEl.style.display    = '';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    // Nome
    const nomeEl = document.querySelector(`[data-nome-slug="${slug}"]`);
    if (nomeEl) {
        nomeEl.style.color = (lido || pct >= 50) ? '#ffffff' : '';
    }
}

// ─────────────────────────────────────────────────────────────
//  CRIAR MODAL (apenas uma vez no DOM)
// ─────────────────────────────────────────────────────────────

export function criarModal(baseDados) {
    if (document.getElementById('santoModal')) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="santoModal" class="modal-blur" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <button class="close-modal" aria-label="Fechar">&times;</button>
            <button class="toggle-highlight" id="toggleHighlight" title="Ativar marcação de linhas">🖍️</button>
            <div class="modal-content" id="modalScrollArea" tabindex="0">
                <div id="modalHeaderImg" class="modal-header-img">
                    <h1 id="modalTitle"></h1>
                </div>
                <div class="modal-body-padding">
                    <div id="modalContent"></div>
                </div>
            </div>
        </div>
    `);

    // Progresso de leitura via scroll
    const scrollArea = document.getElementById('modalScrollArea');
    scrollArea.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollArea;
        const max = scrollHeight - clientHeight;
        if (max <= 0) return;

        const pct  = Math.min(100, Math.round((scrollTop / max) * 100));
        const slug = scrollArea.dataset.slug;
        if (!slug) return;

        localStorage.setItem(`progresso-${slug}`, pct);
        localStorage.setItem(`scroll-${slug}`,    scrollTop);

        _atualizarProgressoVisual(slug, pct);

        // Marca como lido automaticamente ao chegar em 95%
        if (pct >= 95) {
            localStorage.setItem(`lido-${slug}`, '1');
            const btn = document.getElementById('btnFinalizado');
            if (btn && !btn.classList.contains('ativo')) {
                btn.classList.add('ativo');
                btn.textContent = '✓ Leitura concluída';
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
//  ABRIR MODAL
// ─────────────────────────────────────────────────────────────

export async function abrirModal(nomeSanto, baseDados) {
    const santo = baseDados.find(s => s.nome === nomeSanto);
    if (!santo) return;

    const modal      = document.getElementById('santoModal');
    const title      = document.getElementById('modalTitle');
    const content    = document.getElementById('modalContent');
    const headerImg  = document.getElementById('modalHeaderImg');
    const scrollArea = document.getElementById('modalScrollArea');

    const slug = _slugify(santo.nome);
    scrollArea.dataset.slug = slug;
    scrollArea.scrollTop    = 0;

    // Título e estado de carregamento
    title.textContent = santo.nome;
    content.innerHTML = `
        <div style="
            text-align:center;padding:60px 20px;
            color:#aaa;font-family:'Inter',sans-serif;font-size:0.9rem;
        ">
            <div style="margin-bottom:12px;font-size:1.5rem;opacity:0.4">✦</div>
            Carregando...
        </div>
    `;

    // Header: tenta PNG → JPG
    const tentarImgHeader = (exts, i = 0) => {
        if (i >= exts.length) {
            headerImg.style.backgroundImage = `url('${IMG_FALLBACK}')`;
            return;
        }
        const url = `${IMG_BASE}/${slug}.${exts[i]}`;
        const tester = new Image();
        tester.onload  = () => { headerImg.style.backgroundImage = `url('${url}')`; };
        tester.onerror = () => tentarImgHeader(exts, i + 1);
        tester.src = url;
    };
    tentarImgHeader(['png', 'jpg']);

    // Abre o modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');

    // ── Verificação de pasta ──────────────────────────────────
    if (!santo.pasta) {
        content.innerHTML = `
            <div class="vocation-badge">${[...new Set(santo.categorias)].join(' • ')}</div>
            <div class="biografia-container" style="text-align:center;padding:60px 0 40px;">
                <p style="color:#999;font-size:1rem;">Biografia ainda não disponível para este santo.</p>
                <p style="color:#bbb;font-size:0.85rem;margin-top:8px;">Volte em breve — estamos preparando o conteúdo.</p>
            </div>
        `;
        return;
    }

    const caminho = `/santos/${santo.pasta}/${slug}.html`;

    // ── Fetch da biografia + cor dominante em paralelo ────────
    const [responseResult, corResult] = await Promise.allSettled([
        fetch(caminho),
        _extrairECachearCor(slug).then(() => _getCorDominanteCache(slug)),
    ]);

    const cor = corResult.status === 'fulfilled' ? corResult.value : null;

    const categoriasUnicas = [...new Set(santo.categorias)];
    const badgeTexto       = categoriasUnicas.join(' • ');

    try {
        if (responseResult.status !== 'fulfilled' || !responseResult.value.ok) {
            throw new Error(`Não encontrado: ${caminho}`);
        }

        const html         = await responseResult.value.text();
        const progressoSalvo = _getProgresso(slug);
        const lido           = _getLido(slug);
        const badgeStyle     = cor ? `background:${cor.badge};` : '';

        content.innerHTML = `
            <div class="santo-info">
                <div class="vocation-badge">${badgeTexto}</div>
                <div class="biografia-container">${html}</div>
                <button
                    class="btn-finalizado ${lido ? 'ativo' : ''}"
                    id="btnFinalizado"
                    ${lido && badgeStyle ? `style="${badgeStyle}"` : ''}
                >
                    ${lido ? '✓ Leitura concluída' : '✓ Marcar como concluída'}
                </button>
            </div>
        `;

        // ── Botão "Marcar como concluída" ─────────────────────
        document.getElementById('btnFinalizado').addEventListener('click', function () {
            const jaLido = _getLido(slug);

            if (jaLido) {
                localStorage.removeItem(`lido-${slug}`);
                const pctAtual = _getProgresso(slug);
                this.classList.remove('ativo');
                this.textContent  = '✓ Marcar como concluída';
                this.style.cssText = '';
                _atualizarProgressoVisual(slug, pctAtual);
            } else {
                localStorage.setItem(`lido-${slug}`,       '1');
                localStorage.setItem(`progresso-${slug}`,  '100');
                this.classList.add('ativo');
                this.textContent = '✓ Leitura concluída';
                if (badgeStyle) this.style.cssText = badgeStyle;
                _atualizarProgressoVisual(slug, 100);
            }

            _atualizarCardGrid(slug, cor);
        });

        // ── Restaura posição de scroll e progresso visual ─────
        const posicaoSalva = parseInt(localStorage.getItem(`scroll-${slug}`) || '0', 10);
        setTimeout(() => {
            if (posicaoSalva > 0) scrollArea.scrollTop = posicaoSalva;
            _atualizarProgressoVisual(slug, lido ? 100 : progressoSalvo);
        }, 120);

        // ── Abas de navegação (História / Milagres / Geral) ───
        setTimeout(() => {
            content.querySelectorAll('.sl-nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const nomePainel = btn.getAttribute('data-painel');
                    const wrap       = btn.closest('.sl-wrap');
                    if (!wrap) return;

                    wrap.querySelectorAll('.sl-painel').forEach(p => p.classList.remove('ativo'));
                    wrap.querySelectorAll('.sl-nav-btn').forEach(b => b.classList.remove('ativo'));

                    const alvo = wrap.querySelector(`[data-nome="${nomePainel}"]`);
                    if (alvo) alvo.classList.add('ativo');
                    btn.classList.add('ativo');

                    // Volta para o topo ao trocar de aba
                    scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        }, 200);

        // ── Marcação de linhas ────────────────────────────────
        setTimeout(() => _ativarLinhasClicaveis(slug), 120);

        // ── Toggle modo marcação ──────────────────────────────
        document.getElementById('toggleHighlight').onclick = () => {
            const ativo = modal.classList.toggle('modo-marcacao');
            document.getElementById('toggleHighlight').textContent = ativo ? '📍' : '🖍️';
        };

    } catch (err) {
        console.warn('[Lux Fidei] Biografia não encontrada:', err.message);
        content.innerHTML = `
            <div class="vocation-badge">${badgeTexto}</div>
            <div class="biografia-container" style="text-align:center;padding:60px 0 40px;">
                <p style="color:#999;font-size:1rem;">Biografia não encontrada.</p>
                <p style="color:#bbb;font-size:0.85rem;margin-top:8px;">
                    Verifique se o arquivo <code>${slug}.html</code> está na pasta correta.
                </p>
            </div>
        `;
    }
}

// ─────────────────────────────────────────────────────────────
//  FECHAR MODAL
// ─────────────────────────────────────────────────────────────

export function fecharModal() {
    const modal = document.getElementById('santoModal');
    if (!modal) return;

    modal.classList.remove('active', 'modo-marcacao');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';

    const btnH = document.getElementById('toggleHighlight');
    if (btnH) btnH.textContent = '🖍️';
}

// ─────────────────────────────────────────────────────────────
//  EVENTOS GLOBAIS DO MODAL
// ─────────────────────────────────────────────────────────────

export function eventosModal() {
    // Fechar ao clicar no botão × ou no backdrop
    document.addEventListener('click', (e) => {
        if (
            e.target.closest('.close-modal') ||
            e.target.id === 'santoModal'
        ) {
            fecharModal();
        }
    });

    // Fechar com Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharModal();
    });
}

// ─────────────────────────────────────────────────────────────
//  LINHAS CLICÁVEIS (modo marcação)
// ─────────────────────────────────────────────────────────────

function _ativarLinhasClicaveis(slug) {
    const container = document.querySelector('.biografia-container');
    if (!container) return;

    const modal  = document.getElementById('santoModal');
    const linhas = container.querySelectorAll('p');

    linhas.forEach((linha, i) => {
        linha.classList.add('linha');
        linha.dataset.index = i;

        linha.addEventListener('click', () => {
            if (!modal.classList.contains('modo-marcacao')) return;

            // Remove marcação anterior e aplica na nova linha
            linhas.forEach(l => l.classList.remove('linha-marcada'));
            linha.classList.add('linha-marcada');
            localStorage.setItem(`linha-${slug}`, i);
        });
    });

    // Restaura linha marcada anteriormente
    const salvo = localStorage.getItem(`linha-${slug}`);
    if (salvo !== null) {
        const alvo = container.querySelector(`.linha[data-index="${salvo}"]`);
        if (alvo) alvo.classList.add('linha-marcada');
    }
}
