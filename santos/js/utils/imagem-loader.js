// ─────────────────────────────────────────────
//  SISTEMA SIMPLES DE IMAGENS
//  Sem verificações, sem HEAD requests
//  Só usa placeholders quando imagem não carrega
// ─────────────────────────────────────────────

export function setarImagemOtimizada(imgEl, slug) {
    if (!imgEl) return;

    // Tenta PNG primeiro (mais comum)
    imgEl.src = `imagens/santos/${slug}.png`;
    
    // Se falhar, tenta JPG
    imgEl.onerror = function() {
        if (!this._tentouJpg) {
            this._tentouJpg = true;
            this.src = `imagens/santos/${slug}.jpg`;
            return;
        }
        
        // Se ambas falharem, usa placeholder SVG
        if (!this._tentouPlaceholder) {
            this._tentouPlaceholder = true;
            this.src = gerarPlaceholderSVG(imgEl.alt || slug);
            this.style.objectFit = 'contain';
            this.style.background = '#f5ede0';
            this.onerror = null; // Para de tentar
        }
    };
}

// ─────────────────────────────────────────────
//  GERAR PLACEHOLDER SVG COM INICIAIS
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
//  PRECARREGAR IMAGENS
//  SEM FAZER VERIFICAÇÕES - só carrega as reais
// ─────────────────────────────────────────────
export function precarregarImagens(baseDados) {
    // Cria uma lista de imagens para preload (silencioso)
    baseDados.forEach(santo => {
        const slug = santo.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ /g, '-')
            .replace(/'/g, '');

        // Tenta PNG
        const img1 = new Image();
        img1.src = `imagens/santos/${slug}.png`;
        
        // Se não carregar PNG, tenta JPG
        img1.onerror = () => {
            const img2 = new Image();
            img2.src = `imagens/santos/${slug}.jpg`;
        };
    });
}
