document.addEventListener('DOMContentLoaded', function() {
    // Navegação por teclado (setas ← →)
    document.addEventListener('keydown', function(e) {
        // Ignora se o usuário estiver digitando em campos de texto
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowLeft') {
            const btn = document.querySelector('.btn-nav[href*="Anterior"], .btn-primary[href*="Anterior"]');
            if (btn && !btn.classList.contains('desabilitado')) btn.click();
        }
        
        if (e.key === 'ArrowRight') {
            const btn = document.querySelector('.btn-nav[href*="Próxima"], .btn-primary[href*="Próxima"]');
            if (btn && !btn.classList.contains('desabilitado')) btn.click();
        }
    });

    // Previne navegação acidental em botões desabilitados
    document.querySelectorAll('.desabilitado').forEach(el => {
        el.addEventListener('click', e => e.preventDefault());
    });
});
