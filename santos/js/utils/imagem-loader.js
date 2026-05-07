// ─────────────────────────────────────────────
//  SISTEMA ZERO ERROS 404
//  Sem onerror, sem fallback, sem verificações
//  Apenas placeholder SVG direto
// ─────────────────────────────────────────────

export function setarImagemOtimizada(imgEl, slug) {
    if (!imgEl) return;
    
    // Define apenas o placeholder SVG (sem tentar outras extensões)
    imgEl.src = gerarPlaceholderSVG(imgEl.alt || slug);
    imgEl.style.objectFit = 'contain';
    imgEl.style.background = '#f5ede0';
    imgEl.onerror = null; // Remove qualquer handler
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
//  NÃO FAZ NADA (apenas para compatibilidade)
// ─────────────────────────────────────────────
export function precarregarImagens(baseDados) {
    // Vazio propositalmente - não faz requisições
}
