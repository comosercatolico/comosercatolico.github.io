// ─────────────────────────────────────────────
//  CACHE DE IMAGENS DISPONÍVEIS
// ─────────────────────────────────────────────
const imagemCache = new Map();
const imagensDisponíveis = new Set();

// ─────────────────────────────────────────────
//  VERIFICAR EXISTÊNCIA DE IMAGEM (head request)
// ─────────────────────────────────────────────
async function verificarImagemExiste(src) {
    // Usa cache se já verificada
    if (imagemCache.has(src)) {
        return imagemCache.get(src);
    }

    try {
        const response = await fetch(src, { method: 'HEAD', cache: 'default' });
        const existe = response.ok;
        imagemCache.set(src, existe);
        return existe;
    } catch {
        // Se houver erro (CORS, rede, etc), assume que não existe
        imagemCache.set(src, false);
        return false;
    }
}

// ─────────────────────────────────────────────
//  ENCONTRAR MELHOR IMAGEM DISPONÍVEL
// ─────────────────────────────────────────────
async function encontrarMelhorImagem(slug) {
    const caminhos = [
        `imagens/santos/${slug}.png`,
        `imagens/santos/${slug}.jpg`,
        `imagens/santos/${slug}.jpeg`,
        `imagens/santos/${slug}.webp`,
        `../imagens/santos/${slug}.png`,
        `../imagens/santos/${slug}.jpg`,
        `../imagens/santos/${slug}.jpeg`,
        `../imagens/santos/${slug}.webp`,
    ];

    for (const caminho of caminhos) {
        if (await verificarImagemExiste(caminho)) {
            imagensDisponíveis.add(slug);
            return caminho;
        }
    }

    // Fallback padrão
    return 'imagens/default.jpg';
}

// ─────────────────────────────────────────────
//  GERAR PLACEHOLDER COM INITIALS (SVG)
// ─────────────────────────────────────────────
function gerarPlaceholderSVG(nome, cor = '#8b6f3d') {
    const initials = nome
        .split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect fill='${encodeURIComponent(cor)}' width='200' height='300'/%3E%3Ctext x='100' y='160' font-size='80' font-family='Georgia,serif' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${initials}%3C/text%3E%3C/svg%3E`;
}

// ─────────────────────────────────────────────
//  SETAR IMAGEM OTIMIZADA EM ELEMENT
// ─────────────────────────────────────────────
export async function setarImagemOtimizada(imgEl, slug) {
    if (!imgEl) return;

    const melhorSrc = await encontrarMelhorImagem(slug);

    if (melhorSrc.includes('default.jpg')) {
        // Placeholder SVG com iniciais
        imgEl.src = gerarPlaceholderSVG(imgEl.alt || slug, '#d4af37');
        imgEl.style.objectFit = 'contain';
        imgEl.style.background = '#f5ede0';
        imgEl.dataset.placeholder = 'true';
    } else {
        imgEl.src = melhorSrc;
        imgEl.dataset.placeholder = 'false';
    }

    // Remove fallback handler que causa 404s
    imgEl.onerror = null;
}

// ─────────────────────────────────────────────
//  PRELOAD DE IMAGENS (background)
// ─────────────────────────────────────────────
export async function precarregarImagens(baseDados) {
    // Carrega em background sem bloquear
    // Usa um pequeno delay para não sobrecarregar
    for (const santo of baseDados) {
        const slug = santo.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-')
            .replace(/'/g, '');
        
        // Inicia verificação sem await (background)
        encontrarMelhorImagem(slug).catch(err => {
            console.debug(`Erro ao precarregar ${slug}:`, err);
        });
    }
}

// ─────────────────────────────────────────────
//  VERIFICAR SE IMAGEM EXISTE (para UI)
// ─────────────────────────────────────────────
export function imagemDisponível(slug) {
    return imagensDisponíveis.has(slug);
}

// ─────────────────────────────────────────────
//  OBTER CACHE PARA DEBUG
// ─────────────────────────────────────────────
export function obterCacheImagens() {
    return imagemCache;
}

// ─────────────────────────────────────────────
//  LIMPAR CACHE (se necessário)
// ─────────────────────────────────────────────
export function limparCacheImagens() {
    imagemCache.clear();
    imagensDisponíveis.clear();
}
