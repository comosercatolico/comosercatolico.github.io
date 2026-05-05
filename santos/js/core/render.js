const appearanceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            appearanceObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

// ─────────────────────────────────────────────
//  UTILITÁRIOS INTERNOS
// ─────────────────────────────────────────────
function _slugify(nome) {
    return nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');
}

function _labelStatus(progresso, lido) {
    if (lido)          return '✓ Concluído';
    if (progresso > 0) return `${progresso}%`;
    return '';
}

function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
}

function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

function _getImgSrc(slug) {
    return `imagens/santos/${slug}.png`;
}

// ─────────────────────────────────────────────
//  COR DOMINANTE (cache no localStorage)
// ─────────────────────────────────────────────
function _getCorDominanteCache(slug) {
    const cached = localStorage.getItem(`cor-dominante-${slug}`);
    return cached ? JSON.parse(cached) : null;
}

async function _extrairECachearCor(slug, imgEl) {
    const cacheKey = `cor-dominante-${slug}`;
    if (localStorage.getItem(cacheKey)) return;

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
                    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                }
                r = Math.round(r/count);
                g = Math.round(g/count);
                b = Math.round(b/count);
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

    // Tenta png depois jpg
    let cor = await extrair(`imagens/santos/${slug}.png`);
    if (!cor) cor = await extrair(`imagens/santos/${slug}.jpg`);
    if (cor) localStorage.setItem(cacheKey, JSON.stringify(cor));
}

// ─────────────────────────────────────────────
//  FALLBACK DE IMAGEM
// ─────────────────────────────────────────────
const IMG_FALLBACK_HANDLER = `
    if (!this._triedJpg) {
        this._triedJpg = true;
        this.src = this.src.replace('.png', '.jpg');
    } else {
        this.onerror = null;
        this.src = 'imagens/default.jpg';
    }
`.replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────
//  FILL LÍQUIDO
// ─────────────────────────────────────────────
function _criarFill(slug, corFill) {
    return `
        <div data-fill-slug="${slug}" style="
            position:absolute; bottom:0; left:0;
            width:100%; height:0%;
            background:${corFill};
            z-index:1;
            border-radius:0 0 var(--radius) var(--radius);
            transition:height 1.4s cubic-bezier(0.4,0,0.2,1);
            will-change:height;
        ">
            <div style="
                position:absolute; top:-12px; left:0;
                width:100%; overflow:hidden;
                height:14px; z-index:2;
            ">
                <svg viewBox="0 0 400 14" preserveAspectRatio="none"
                     style="width:200%; height:100%; animation:waveSlide 3s linear infinite;">
                    <path d="M0,7 C50,14 100,0 150,7 C200,14 250,0 300,7 C350,14 400,0 400,7 L400,14 L0,14 Z"
                          fill="rgba(255,255,255,0.18)"/>
                </svg>
            </div>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  MINI BARRA DE PROGRESSO
// ─────────────────────────────────────────────
function _criarMiniBarra(progresso, lido, modo = 'grid') {
    if (progresso === 0 && !lido) return '';

    const labelStatus = _labelStatus(progresso, lido);
    const largura     = lido ? 100 : progresso;
    const isHist      = modo === 'hist';
    const margin      = isHist ? '6px 0 2px' : '-4px 0 10px';
    const fontSize    = isHist ? '0.62rem' : '0.65rem';

    return `
        <div style="margin:${margin}; display:flex; align-items:center; gap:6px;">
            <div style="
                flex:1; height:3px;
                background:rgba(255,255,255,0.2);
                border-radius:2px; overflow:hidden;
            ">
                <div style="
                    height:100%; width:0%;
                    background:rgba(255,255,255,0.75);
                    border-radius:2px;
                    transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
                " data-bar-width="${largura}"></div>
            </div>
            <span style="
                font-size:${fontSize}; font-weight:700;
                color:rgba(255,255,255,0.9);
                white-space:nowrap; letter-spacing:0.5px;
                text-shadow:0 1px 3px rgba(0,0,0,0.2);
            ">${labelStatus}</span>
        </div>
    `;
}

// ─────────────────────────────────────────────
//  ANIMAR FILL + BARRAS
// ─────────────────────────────────────────────
function _animarElementos(container, slug, alturaFill, delay = 80) {
    requestAnimationFrame(() => {
        setTimeout(() => {
            const fill = container.querySelector(`[data-fill-slug="${slug}"]`);
            if (fill) fill.style.height = alturaFill;
            container.querySelectorAll('[data-bar-width]').forEach(bar => {
                bar.style.width = `${bar.dataset.barWidth}%`;
            });
        }, delay);
    });
}

// ─────────────────────────────────────────────
//  CORES
// ─────────────────────────────────────────────
function _getCorFill(lido, progresso, cor = null) {
    if (lido && cor)    return cor.fill;
    if (lido)           return 'linear-gradient(180deg, #4caf82 0%, #388e60 100%)';
    if (progresso > 0)  return 'linear-gradient(180deg, #5ba3d9 0%, #4a8fc2 100%)';
    return null;
}

function _getBtnConfig(lido, progresso) {
    if (lido)          return { label: 'Reler Biografia',  icon: 'fa-redo'      };
    if (progresso > 0) return { label: 'Continuar lendo',  icon: 'fa-book-open' };
    return               { label: 'Ler Biografia',         icon: 'fa-book-open' };
}

// ─────────────────────────────────────────────
//  BADGE DE STATUS (sobre a imagem)
// ─────────────────────────────────────────────
function _criarBadgeStatus(lido, progresso, slug, cor = null) {
    const base = `
        position:absolute; top:8px; right:8px;
        color:#fff; font-size:0.6rem; font-weight:700;
        padding:3px 8px; border-radius:20px;
        letter-spacing:0.5px;
        backdrop-filter:blur(4px);
        -webkit-backdrop-filter:blur(4px);
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        z-index:4;
    `;

    if (lido) {
        const bg = cor ? cor.badge : 'rgba(76,175,130,0.92)';
        return `<span data-badge-slug="${slug}" style="${base} background:${bg};">✓ LIDO</span>`;
    }
    if (progresso > 0) {
        return `<span data-badge-slug="${slug}" style="${base} background:rgba(91,163,217,0.92);">${progresso}%</span>`;
    }
    return `<span data-badge-slug="${slug}" style="${base} display:none;"></span>`;
}

// ─────────────────────────────────────────────
//  BADGES DE CATEGORIA (overlay na imagem)
// ─────────────────────────────────────────────
function _criarBadgesCategorias(categorias) {
    return `
        <div style="
            position:absolute; top:8px; left:8px;
            display:flex; flex-wrap:wrap; gap:4px;
            z-index:4;
            max-width:calc(100% - 70px);
        ">
            ${categorias.map(c => `
                <span style="
                    background:rgba(0,0,0,0.52);
                    color:#fff;
                    font-size:0.58rem;
                    font-weight:700;
                    padding:3px 8px;
                    border-radius:20px;
                    letter-spacing:0.5px;
                    backdrop-filter:blur(6px);
                    -webkit-backdrop-filter:blur(6px);
                    white-space:nowrap;
                    text-transform:uppercase;
                    box-shadow:0 1px 4px rgba(0,0,0,0.2);
                ">${c}</span>
            `).join('')}
        </div>
    `;
}

// ─────────────────────────────────────────────
//  RENDER DO GRID PRINCIPAL
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  GRID VIRTUAL — renderiza só os cards visíveis
//  Substitui renderizarGrid() em render.js
// ─────────────────────────────────────────────

import {
    _slugify,
    _getProgresso,
    _getLido,
    _getCorDominanteCache,
    _getCorFill,
    _getBtnConfig,
    _getImgSrc,
    _criarFill,
    _criarMiniBarra,
    _criarBadgeStatus,
    _criarBadgesCategorias,
    _animarElementos,
    _extrairECachearCor,
    IMG_FALLBACK_HANDLER,
} from "./render.js"; // todas as funções internas já existem lá

// ─────────────────────────────────────────────
//  CONSTANTES DE LAYOUT
//  Ajuste conforme seu CSS atual
// ─────────────────────────────────────────────
const ALTURA_CARD   = 400;  // px — altura estimada de cada card
const GAP           = 16;   // px — gap entre cards (mesmo do seu CSS)
const MARGEM_EXTRA  = 600;  // px — quantos px fora da tela já pré-carrega

// ─────────────────────────────────────────────
//  DETECTA NÚMERO DE COLUNAS DINAMICAMENTE
// ─────────────────────────────────────────────
function _detectarColunas(container) {
    const estilo = getComputedStyle(container);
    const cols   = estilo.gridTemplateColumns;
    // conta quantas colunas o CSS grid definiu
    return cols === "none" ? 1 : cols.trim().split(/\s+/).length;
}

// ─────────────────────────────────────────────
//  CRIA UM CARD COMPLETO (extrai lógica do render.js)
// ─────────────────────────────────────────────
function _criarCard(santo, index, abrirModal) {
    const card      = document.createElement("article");
    card.className  = "santo-card";

    const slug      = _slugify(santo.nome);
    const progresso = _getProgresso(slug);
    const lido      = _getLido(slug);
    const cor       = _getCorDominanteCache(slug);
    const corFill   = _getCorFill(lido, progresso, cor);
    const alturaFill= lido ? "100%" : `${progresso}%`;
    const btn       = _getBtnConfig(lido, progresso);
    const corNome   = (lido || progresso >= 50) ? "#ffffff" : "";

    card.innerHTML = `
        <div class="card-inner" style="
            position:relative;
            border-radius:var(--radius);
            overflow:hidden;
            height:100%;
            display:flex;
            flex-direction:column;
        ">
            ${corFill ? _criarFill(slug, corFill) : ""}

            <div style="
                position:relative; z-index:3;
                margin:8px 8px 0;
                border-radius:12px;
                overflow:hidden;
                aspect-ratio:3/4;
                flex-shrink:0;
                box-shadow:0 4px 12px rgba(0,0,0,0.2);
            ">
                <img
                    src="${_getImgSrc(slug)}"
                    onerror="${IMG_FALLBACK_HANDLER}"
                    alt="${santo.nome}"
                    loading="lazy"
                    style="
                        width:100%; height:100%;
                        object-fit:cover;
                        object-position:center top;
                        display:block;
                        transition:transform 0.6s ease;
                    "
                >
                ${_criarBadgesCategorias(santo.categorias)}
                ${_criarBadgeStatus(lido, progresso, slug, cor)}
            </div>

            <div class="santo-card-content" style="
                position:relative; z-index:3;
                padding:10px 12px 14px;
                display:flex; flex-direction:column;
                flex:1;
            ">
                <h3
                    data-nome-slug="${slug}"
                    style="
                        margin:0 0 4px;
                        transition:color 0.5s ease;
                        ${corNome ? `color:${corNome};` : ""}
                    "
                >${santo.nome}</h3>

                ${_criarMiniBarra(progresso, lido, "grid")}

                <div class="card-footer" style="margin-top:auto; padding-top:8px;">
                    <button class="btn-primary" aria-label="${btn.label} - ${santo.nome}">
                        <span>${btn.label}</span>
                        <i class="fas ${btn.icon}" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const img = card.querySelector("img");
    card.addEventListener("mouseenter", () => (img.style.transform = "scale(1.05)"));
    card.addEventListener("mouseleave", () => (img.style.transform = "scale(1)"));
    img.addEventListener("load", () => _extrairECachearCor(slug, img), { once: true });
    _animarElementos(card, slug, alturaFill, 80);

    card.querySelector(".btn-primary")
        .addEventListener("click", () => abrirModal(santo.nome));

    return card;
}

// ─────────────────────────────────────────────
//  CLASSE PRINCIPAL
// ─────────────────────────────────────────────
export class GridVirtual {
    /**
     * @param {HTMLElement} container  — o elemento #santosGrid
     * @param {Function}    abrirModal — sua função abrirModalWrapper
     */
    constructor(container, abrirModal) {
        this.container  = container;
        this.abrirModal = abrirModal;
        this.lista      = [];
        this.cache      = new Map();   // index → elemento DOM do card
        this.spacer     = null;
        this.colunas    = 1;
        this._scrollHandler = () => this._renderizar();
        this._resizeHandler = () => this._onResize();
    }

    // ── Carrega (ou troca) a lista e reconstrói tudo ──
    carregar(lista) {
        this.lista = lista;
        this._destruir();
        this._construir();
    }

    // ── Monta o spacer e ouve eventos ──
    _construir() {
        if (this.lista.length === 0) {
            this.container.innerHTML = "";
            return;
        }

        this.colunas = _detectarColunas(this.container);

        // O container precisa ser relative para position:absolute funcionar
        this.container.style.position = "relative";
        this.container.style.padding  = "0";

        this.spacer = document.createElement("div");
        this._atualizarAlturaTotal();
        this.container.appendChild(this.spacer);

        window.addEventListener("scroll", this._scrollHandler, { passive: true });
        window.addEventListener("resize", this._resizeHandler, { passive: true });

        this._renderizar();
    }

    // ── Remove tudo e limpa listeners ──
    _destruir() {
        window.removeEventListener("scroll", this._scrollHandler);
        window.removeEventListener("resize", this._resizeHandler);
        this.cache.forEach(card => card.remove());
        this.cache.clear();
        if (this.spacer) {
            this.spacer.remove();
            this.spacer = null;
        }
        this.container.innerHTML = "";
    }

    // ── Recalcula altura total do spacer ──
    _atualizarAlturaTotal() {
        const totalLinhas  = Math.ceil(this.lista.length / this.colunas);
        const alturaTotal  = totalLinhas * (ALTURA_CARD + GAP);
        this.spacer.style.cssText = `
            position: relative;
            width: 100%;
            height: ${alturaTotal}px;
        `;
    }

    // ── Responde ao resize: detecta mudança de colunas ──
    _onResize() {
        const novasColunas = _detectarColunas(this.container);
        if (novasColunas !== this.colunas) {
            this.colunas = novasColunas;
            this._atualizarAlturaTotal();
            // Reposiciona todos os cards em cache
            this.cache.forEach((card, i) => this._posicionarCard(card, i));
        }
        this._renderizar();
    }

    // ── Calcula quais índices devem estar visíveis ──
    _janela() {
        const scrollY    = window.scrollY;
        const viewH      = window.innerHeight;
        const offsetTop  = this.container.getBoundingClientRect().top + scrollY;
        const alturaLinha= ALTURA_CARD + GAP;

        const primeiraLinha = Math.max(0,
            Math.floor((scrollY - offsetTop - MARGEM_EXTRA) / alturaLinha)
        );
        const ultimaLinha = Math.ceil(
            (scrollY - offsetTop + viewH + MARGEM_EXTRA) / alturaLinha
        );

        const inicio = primeiraLinha * this.colunas;
        const fim    = Math.min(ultimaLinha * this.colunas, this.lista.length);
        return { inicio, fim };
    }

    // ── Posiciona card no lugar certo via position:absolute ──
    _posicionarCard(card, index) {
        const linha  = Math.floor(index / this.colunas);
        const coluna = index % this.colunas;
        const largura= (100 / this.colunas);

        card.style.position = "absolute";
        card.style.top      = `${linha * (ALTURA_CARD + GAP)}px`;
        card.style.left     = `calc(${coluna * largura}% + ${coluna > 0 ? GAP / 2 : 0}px)`;
        card.style.width    = `calc(${largura}% - ${GAP}px)`;
        card.style.height   = `${ALTURA_CARD}px`;
        card.style.boxSizing= "border-box";
    }

    // ── Renderiza a janela visível ──
    _renderizar() {
        if (!this.spacer) return;
        const { inicio, fim } = this._janela();

        // Remove os que saíram da janela
        this.cache.forEach((card, index) => {
            if (index < inicio || index >= fim) {
                card.remove();
                this.cache.delete(index);
            }
        });

        // Adiciona os que entraram na janela
        for (let i = inicio; i < fim; i++) {
            if (this.cache.has(i)) continue;

            const card = _criarCard(this.lista[i], i, this.abrirModal);
            this._posicionarCard(card, i);
            this.spacer.appendChild(card);
            this.cache.set(i, card);
        }
    }

    // ── Atualiza um card já renderizado (ex: após marcar como lido) ──
    atualizarCard(nomeSanto) {
        const index = this.lista.findIndex(s => s.nome === nomeSanto);
        if (index === -1) return;

        const cardAntigo = this.cache.get(index);
        if (!cardAntigo) return; // fora da janela, será recriado ao rolar

        const cardNovo = _criarCard(this.lista[index], index, this.abrirModal);
        this._posicionarCard(cardNovo, index);
        cardAntigo.replaceWith(cardNovo);
        this.cache.set(index, cardNovo);
    }
}
// ─────────────────────────────────────────────
//  HISTÓRICO
// ─────────────────────────────────────────────
export function salvarHistorico(nomeSanto) {
    let hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
    hist = hist.filter(n => n !== nomeSanto);
    hist.unshift(nomeSanto);
    if (hist.length > 20) hist = hist.slice(0, 20);
    localStorage.setItem('historico-santos', JSON.stringify(hist));
}

export function renderizarHistorico(baseDados, abrirModal) {
    const section = document.getElementById('historicoSection');
    const scroll  = document.getElementById('historicoScroll');
    const limpar  = document.getElementById('historicoLimpar');
    if (!section || !scroll) return;

    const hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
    if (hist.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    scroll.innerHTML = '';
    const fragment = document.createDocumentFragment();

    hist.forEach((nome, index) => {
        const santo = baseDados.find(s => s.nome === nome);
        if (!santo) return;

        const slug       = _slugify(nome);
        const progresso  = _getProgresso(slug);
        const lido       = _getLido(slug);
        const cor        = _getCorDominanteCache(slug);
        const corFill    = _getCorFill(lido, progresso, cor);
        const alturaFill = lido ? '100%' : `${progresso}%`;
        const corNome    = (lido || progresso >= 50) ? '#ffffff' : '';

        const card        = document.createElement('div');
        card.className    = `hist-card${lido ? ' lido' : ''}`;
        card.dataset.slug = slug;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ver biografia de ${nome}`);

        card.innerHTML = `
            <div class="card-inner" style="
                position:relative;
                border-radius:var(--radius);
                overflow:hidden;
                height:100%;
                display:flex;
                flex-direction:column;
            ">
                ${corFill ? _criarFill(slug, corFill) : ''}

                <!-- IMAGEM + BADGES OVERLAY -->
                <div style="
                    position:relative; z-index:3;
                    margin:8px 8px 0;
                    border-radius:12px;
                    overflow:hidden;
                    aspect-ratio:3/4;
                    flex-shrink:0;
                    box-shadow:0 4px 14px rgba(0,0,0,0.25);
                ">
                    <img
                        src="${_getImgSrc(slug)}"
                        onerror="${IMG_FALLBACK_HANDLER}"
                        alt="${nome}"
                        loading="lazy"
                        style="
                            width:100%; height:100%;
                            object-fit:cover;
                            object-position:center top;
                            display:block;
                            transition:transform 0.6s ease;
                        "
                    >
                    ${_criarBadgesCategorias(santo.categorias)}
                    ${_criarBadgeStatus(lido, progresso, slug, cor)}
                </div>

                <!-- INFO -->
                <div class="hist-info" style="
                    position:relative; z-index:3;
                    padding:10px 14px 14px;
                    text-align:center;
                    display:flex; flex-direction:column;
                    flex:1;
                ">
                    <div
                        class="hist-nome"
                        data-nome-slug="${slug}"
                        style="
                            ${corNome ? `color:${corNome};` : ''}
                            transition:color 0.5s ease;
                        "
                    >${nome}</div>

                    ${_criarMiniBarra(progresso, lido, 'hist')}
                </div>

            </div>
        `;

        // Hover na imagem
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.05)');
        card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');

        // Extrai cor dominante após imagem carregar
        img.addEventListener('load', () => _extrairECachearCor(slug, img), { once: true });

        // Acessibilidade
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirModal(nome);
            }
        });

        _animarElementos(card, slug, alturaFill, 80 + (index % 10) * 40);

        card.addEventListener('click', () => abrirModal(nome));
        fragment.appendChild(card);
    });

    scroll.appendChild(fragment);

    limpar.onclick = () => {
        localStorage.removeItem('historico-santos');
        section.style.display = 'none';
        scroll.innerHTML = '';
    };
}
