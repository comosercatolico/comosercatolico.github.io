document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.sl-nav-btn');
    const painelContainer = document.getElementById('painel-container');
    let painelAtualCarregado = 'historia';

    // Carrega o painel inicial (história)
    carregarPainel('historia');

    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetPanel = this.dataset.painel;
            
            // Se for o mesmo painel, não faz nada
            if (targetPanel === painelAtualCarregado) return;

            // Remove ativo de todos os botões
            navButtons.forEach(b => b.classList.remove('ativo'));
            
            // Ativa o botão clicado
            this.classList.add('ativo');

            // Carrega o painel
            carregarPainel(targetPanel);
            painelAtualCarregado = targetPanel;
        });
    });

    function carregarPainel(nomePainel) {
        const painel = document.querySelector(`.sl-painel[data-nome="${nomePainel}"]`);
        
        // Se já existe na DOM, apenas mostra
        if (painel && painel.innerHTML.trim() !== '<p style="text-align: center; padding: 2rem; color: #666;">Carregando...</p>') {
            painel.classList.add('ativo');
            document.querySelectorAll('.sl-painel').forEach(p => {
                if (p !== painel) p.classList.remove('ativo');
            });
            return;
        }

        // Fetch do arquivo HTML
        fetch(`paineis/${nomePainel}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar ${nomePainel}.html`);
                }
                return response.text();
            })
            .then(html => {
                // Limpa o container e insere o novo conteúdo
                painelContainer.innerHTML = `<div class="sl-painel ativo" data-nome="${nomePainel}">${html}</div>`;
                
                // Re-vincula os botões em caso de necessidade
                revincularbotoes();
            })
            .catch(error => {
                console.error('Erro ao carregar painel:', error);
                painelContainer.innerHTML = `<div class="sl-painel ativo" data-nome="${nomePainel}"><p style="color: red; padding: 2rem;">Erro ao carregar conteúdo.</p></div>`;
            });
    }

    function revincularbotoes() {
        // Reconecta os botões de navegação após mudança de conteúdo
        const botoesAtualizados = document.querySelectorAll('.sl-nav-btn');
        botoesAtualizados.forEach(btn => {
            btn.removeEventListener('click', null);
            btn.addEventListener('click', function() {
                const targetPanel = this.dataset.painel;
                
                if (targetPanel === painelAtualCarregado) return;

                botoesAtualizados.forEach(b => b.classList.remove('ativo'));
                this.classList.add('ativo');

                carregarPainel(targetPanel);
                painelAtualCarregado = targetPanel;
            });
        });
    }
});
