// JS para sao-joao-maria-vianney
document.addEventListener('DOMContentLoaded', function() {
    // Botões de navegação
    const navButtons = document.querySelectorAll('.sl-nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetPanel = this.dataset.painel;
            
            // Remove ativo de todos
            navButtons.forEach(b => b.classList.remove('ativo'));
            document.querySelectorAll('.sl-painel').forEach(p => p.classList.remove('ativo'));
            
            // Ativa o botão clicado e o painel correspondente
            this.classList.add('ativo');
            const targetPanelElement = document.querySelector(`.sl-painel[data-nome="${targetPanel}"]`);
            if (targetPanelElement) {
                targetPanelElement.classList.add('ativo');
            }
        });
    });
});
