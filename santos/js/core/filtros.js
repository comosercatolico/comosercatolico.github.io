// ─────────────────────────────────────────────
//  ESTADO GLOBAL DO FILTRO
// ─────────────────────────────────────────────
const estadoFiltro = {
    termo: '',
    categoria: 'Todos',
    ordenacao: 'nome', // 'nome' | 'progresso' | 'recente'
};

let debounceTimer;

// ─────────────────────────────────────────────
//  UTIL
// ─────────────────────────────────────────────
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function _getProgresso(slug) {
    return parseInt(localStorage.getItem(`progresso-${slug}`) || "0");
}

function _getLido(slug) {
    return localStorage.getItem(`lido-${slug}`) === '1';
}

function _slugify(nome) {
    return nome.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '-')
        .replace(/'/g, '');
}

// ─────────────────────────────────────────────
//  FILTRO COMBINADO (pesquisa + categoria + ordem)
// ─────────────────────────────────────────────
function _aplicarFiltros(baseDados) {
    const { termo, categoria, ordenacao } = estadoFiltro;

    let resultado = baseDados.filter(s => {
        // 1. Filtro por categoria
        const catOk = categoria === 'Todos' || s.categorias.includes(categoria);

        // 2. Filtro por termo (nome + categorias + descrição se existir)
        const termoOk = !termo || (() => {
            const nomeMatch = normalizar(s.nome).includes(termo);
            const catMatch  = s.categorias.some(c => normalizar(c).includes(termo));
            const descMatch = s.descricao ? normalizar(s.descricao).includes(termo) : false;
            return nomeMatch || catMatch || descMatch;
        })();

        return catOk && termoOk;
    });

    // 3. Ordenação
    resultado = _ordenar(resultado, ordenacao);

    return resultado;
}

// ─────────────────────────────────────────────
//  ORDENAÇÃO
// ─────────────────────────────────────────────
function _ordenar(lista, criterio) {
    return [...lista].sort((a, b) => {
        switch (criterio) {
            case 'progresso': {
                const slugA = _slugify(a.nome);
                const slugB = _slugify(b.nome);
                const pA = _getLido(slugA) ? 101 : _getProgresso(slugA);
                const pB = _getLido(slugB) ? 101 : _getProgresso(slugB);
                return pB - pA; // maior progresso primeiro
            }
            case 'recente': {
                const hist = JSON.parse(localStorage.getItem('historico-santos') || '[]');
                const iA = hist.indexOf(a.nome);
                const iB = hist.indexOf(b.nome);
                // Se não está no histórico, vai pro final
                const posA = iA === -1 ? 9999 : iA;
                const posB = iB === -1 ? 9999 : iB;
                return posA - posB;
            }
            case 'nome':
            default:
                return a.nome.localeCompare(b.nome, 'pt-BR');
        }
    });
}

// ─────────────────────────────────────────────
//  HIGHLIGHT DE TERMO NA BUSCA
// ─────────────────────────────────────────────
export function highlightTermo(texto, termo) {
    if (!termo) return texto;
    const regex = new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark style="background:rgba(255,220,0,0.4); border-radius:2px; padding:0 1px;">$1</mark>');
}

// ─────────────────────────────────────────────
//  PESQUISA (INPUT)
// ─────────────────────────────────────────────
export function iniciarPesquisa(input, baseDados, renderizarGrid, atualizarContador) {
    if (!input) return;

    // 4. Botão de limpar pesquisa
    const wrapper = input.parentElement;
    const btnLimpar = document.createElement('button');
    btnLimpar.innerHTML = '✕';
    btnLimpar.setAttribute('aria-label', 'Limpar pesquisa');
    btnLimpar.style.cssText = `
        position:absolute; right:12px; top:50%; transform:translateY(-50%);
        background:none; border:none; cursor:pointer;
        color:var(--text-muted); font-size:0.85rem;
        opacity:0; transition:opacity 0.2s;
        padding:4px; border-radius:50%;
        line-height:1;
    `;
    if (getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative';
    }
    wrapper.appendChild(btnLimpar);

    function atualizarBtnLimpar(valor) {
        btnLimpar.style.opacity = valor ? '1' : '0';
        btnLimpar.style.pointerEvents = valor ? 'auto' : 'none';
    }

    btnLimpar.addEventListener('click', () => {
        input.value = '';
        estadoFiltro.termo = '';
        atualizarBtnLimpar('');
        input.focus();
        _disparar(baseDados, renderizarGrid, atualizarContador);
    });

    // 5. Debounce otimizado com cancelamento
    input.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const termo = normalizar(e.target.value);
        atualizarBtnLimpar(termo);

        // 6. Resposta imediata ao limpar campo
        if (!termo) {
            estadoFiltro.termo = '';
            _disparar(baseDados, renderizarGrid, atualizarContador);
            return;
        }

        debounceTimer = setTimeout(() => {
            estadoFiltro.termo = termo;
            _disparar(baseDados, renderizarGrid, atualizarContador);
        }, 250);
    });

    // 7. Suporte à tecla Escape para limpar
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            estadoFiltro.termo = '';
            atualizarBtnLimpar('');
            _disparar(baseDados, renderizarGrid, atualizarContador);
        }
    });
}

// ─────────────────────────────────────────────
//  CATEGORIAS (CHIPS)
// ─────────────────────────────────────────────
export function inicializarCategorias(container, baseDados, renderizarGrid, atualizarContador) {
    if (!container) return;

    const categoriasUnicas = [...new Set(baseDados.flatMap(s => s.categorias))].sort();
    const menuCategorias   = ["Todos", ...categoriasUnicas];

    container.innerHTML = "";
    const fragment = document.createDocumentFragment();

    menuCategorias.forEach(cat => {
        const chip = document.createElement("button");
        chip.className = `chip ${cat === "Todos" ? "active" : ""}`;
        chip.setAttribute('role', 'radio');
        chip.setAttribute('aria-checked', cat === "Todos" ? 'true' : 'false');
        chip.setAttribute('aria-label', `Filtrar por ${cat}`);

        // 8. Contagem dinâmica (respeita filtro de pesquisa ativo)
        const quantidade = cat === "Todos"
            ? baseDados.length
            : baseDados.filter(s => s.categorias.includes(cat)).length;

        // 9. Indicador visual de progresso por categoria
        const totalLidos = cat === "Todos"
            ? baseDados.filter(s => _getLido(_slugify(s.nome))).length
            : baseDados.filter(s =>
                s.categorias.includes(cat) && _getLido(_slugify(s.nome))
              ).length;

        const pctLidos = quantidade > 0 ? Math.round((totalLidos / quantidade) * 100) : 0;

        chip.innerHTML = `
            <span class="chip-text">${cat}</span>
            <span class="chip-count">${quantidade}</span>
            ${pctLidos > 0 ? `
                <span style="
                    position:absolute; bottom:0; left:0;
                    height:2px; width:${pctLidos}%;
                    background:var(--primary, #4caf82);
                    border-radius:0 0 20px 20px;
                    transition:width 0.6s ease;
                "></span>
            ` : ''}
        `;
        chip.style.position = 'relative';
        chip.style.overflow = 'hidden';

        chip.addEventListener("click", () => {
            _setCategoria(container, chip, cat);
            estadoFiltro.categoria = cat;
            _disparar(baseDados, renderizarGrid, atualizarContador);
        });

        // 10. Navegação por teclado entre chips
        chip.addEventListener('keydown', (e) => {
            const chips = [...container.querySelectorAll('.chip')];
            const idx   = chips.indexOf(chip);
            if (e.key === 'ArrowRight') chips[(idx + 1) % chips.length]?.focus();
            if (e.key === 'ArrowLeft')  chips[(idx - 1 + chips.length) % chips.length]?.focus();
        });

        fragment.appendChild(chip);
    });

    container.setAttribute('role', 'radiogroup');
    container.setAttribute('aria-label', 'Filtrar por categoria');
    container.appendChild(fragment);
}

// ─────────────────────────────────────────────
//  ORDENAÇÃO (SELETOR)
// ─────────────────────────────────────────────

// 11. Inicializar seletor de ordenação
export function inicializarOrdenacao(selectEl, baseDados, renderizarGrid, atualizarContador) {
    if (!selectEl) return;

    const opcoes = [
        { value: 'nome',      label: '🔤 Nome (A-Z)'       },
        { value: 'progresso', label: '📖 Mais lidos'        },
        { value: 'recente',   label: '🕐 Vistos recentemente'},
    ];

    selectEl.innerHTML = opcoes
        .map(o => `<option value="${o.value}">${o.label}</option>`)
        .join('');

    selectEl.addEventListener('change', () => {
        estadoFiltro.ordenacao = selectEl.value;
        _disparar(baseDados, renderizarGrid, atualizarContador);
    });
}

// ─────────────────────────────────────────────
//  ESTADO VAZIO (sem resultados)
// ─────────────────────────────────────────────

// 12. Mostrar/esconder estado vazio
function _gerenciarEstadoVazio(grid, quantidade, termo) {
    let vazio = document.getElementById('estado-vazio');

    if (quantidade === 0) {
        if (!vazio) {
            vazio = document.createElement('div');
            vazio.id = 'estado-vazio';
            vazio.style.cssText = `
                text-align:center; padding:60px 20px;
                color:var(--text-muted);
                grid-column:1/-1;
            `;
            grid.parentElement?.appendChild(vazio);
        }
        vazio.innerHTML = `
            <div style="font-size:3rem; margin-bottom:12px;">🔍</div>
            <p style="font-size:1.1rem; font-weight:600; margin:0 0 6px;">
                Nenhum resultado para "${termo}"
            </p>
            <p style="font-size:0.85rem; opacity:0.7; margin:0;">
                Tente buscar por outro nome ou categoria
            </p>
        `;
        grid.style.display = 'none';
    } else {
        vazio?.remove();
        grid.style.display = '';
    }
}

// ─────────────────────────────────────────────
//  CONTADOR ANIMADO
// ─────────────────────────────────────────────

// 13. Contador com animação numérica
export function atualizarContadorAnimado(el, novoValor) {
    if (!el) return;
    const anterior = parseInt(el.dataset.valor || '0');
    el.dataset.valor = novoValor;

    if (anterior === novoValor) return;

    const duracao  = 400;
    const inicio   = performance.now();
    const diff     = novoValor - anterior;

    function animar(agora) {
        const progresso = Math.min((agora - inicio) / duracao, 1);
        const ease      = 1 - Math.pow(1 - progresso, 3); // easeOutCubic
        const atual     = Math.round(anterior + diff * ease);
        el.textContent  = `${atual} santo${atual !== 1 ? 's' : ''}`;
        if (progresso < 1) requestAnimationFrame(animar);
    }

    requestAnimationFrame(animar);
}

// ─────────────────────────────────────────────
//  PERSISTÊNCIA DO FILTRO
// ─────────────────────────────────────────────

// 14. Salvar estado do filtro na URL (compartilhável)
function _salvarNaURL() {
    const params = new URLSearchParams();
    if (estadoFiltro.termo)                params.set('q', estadoFiltro.termo);
    if (estadoFiltro.categoria !== 'Todos') params.set('cat', estadoFiltro.categoria);
    if (estadoFiltro.ordenacao !== 'nome')  params.set('ord', estadoFiltro.ordenacao);

    const novaURL = params.toString()
        ? `${location.pathname}?${params}`
        : location.pathname;

    history.replaceState(null, '', novaURL);
}

// 15. Restaurar filtro da URL ao carregar
export function restaurarDaURL(input, container, selectEl, baseDados, renderizarGrid, atualizarContador) {
    const params = new URLSearchParams(location.search);

    if (params.has('q')) {
        estadoFiltro.termo = params.get('q');
        if (input) input.value = params.get('q');
    }
    if (params.has('cat')) {
        estadoFiltro.categoria = params.get('cat');
        container?.querySelectorAll('.chip').forEach(chip => {
            const isAtivo = chip.querySelector('.chip-text')?.textContent === estadoFiltro.categoria;
            chip.classList.toggle('active', isAtivo);
            chip.setAttribute('aria-checked', String(isAtivo));
        });
    }
    if (params.has('ord')) {
        estadoFiltro.ordenacao = params.get('ord');
        if (selectEl) selectEl.value = estadoFiltro.ordenacao;
    }

    if (params.toString()) {
        _disparar(baseDados, renderizarGrid, atualizarContador);
    }
}

// ─────────────────────────────────────────────
//  RESET GERAL
// ─────────────────────────────────────────────

// 16. Resetar todos os filtros de uma vez
export function resetarFiltros(input, container, selectEl, baseDados, renderizarGrid, atualizarContador) {
    estadoFiltro.termo      = '';
    estadoFiltro.categoria  = 'Todos';
    estadoFiltro.ordenacao  = 'nome';

    if (input)    input.value = '';
    if (selectEl) selectEl.value = 'nome';

    _setCategoria(container, container?.querySelector('.chip'), 'Todos');
    _disparar(baseDados, renderizarGrid, atualizarContador);
}

// ─────────────────────────────────────────────
//  SUGESTÕES DE BUSCA (autocomplete leve)
// ─────────────────────────────────────────────

// 17. Dropdown de sugestões
export function iniciarSugestoes(input, baseDados) {
    if (!input) return;

    const dropdown = document.createElement('ul');
    dropdown.style.cssText = `
        position:absolute; top:calc(100% + 4px); left:0; right:0;
        background:var(--card-bg, #fff);
        border:1px solid var(--border, #e0e0e0);
        border-radius:12px; margin:0; padding:4px;
        list-style:none; z-index:999;
        box-shadow:0 8px 24px rgba(0,0,0,0.12);
        max-height:220px; overflow-y:auto;
        display:none;
    `;

    const wrapper = input.parentElement;
    if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';
    wrapper.appendChild(dropdown);

    function mostrarSugestoes(termo) {
        if (!termo || termo.length < 2) { dropdown.style.display = 'none'; return; }

        const sugestoes = baseDados
            .filter(s => normalizar(s.nome).includes(termo))
            .slice(0, 6);

        if (!sugestoes.length) { dropdown.style.display = 'none'; return; }

        dropdown.innerHTML = sugestoes.map(s => `
            <li style="
                padding:8px 12px; cursor:pointer;
                border-radius:8px; font-size:0.9rem;
                transition:background 0.15s;
            "
            onmouseenter="this.style.background='var(--hover-bg, #f5f5f5)'"
            onmouseleave="this.style.background=''"
            data-nome="${s.nome}"
            >${s.nome}</li>
        `).join('');

        dropdown.style.display = 'block';

        dropdown.querySelectorAll('li').forEach(li => {
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = li.dataset.nome;
                input.dispatchEvent(new Event('input'));
                dropdown.style.display = 'none';
            });
        });
    }

    input.addEventListener('input', e => mostrarSugestoes(normalizar(e.target.value)));
    input.addEventListener('blur',  () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));
    input.addEventListener('focus', e => mostrarSugestoes(normalizar(e.target.value)));
}

// ─────────────────────────────────────────────
//  FILTRO DE PROGRESSO
// ─────────────────────────────────────────────

// 18. Chips de status de leitura
export function inicializarFiltroLeitura(container, baseDados, renderizarGrid, atualizarContador) {
    if (!container) return;

    const opcoes = [
        { value: 'todos',        label: 'Todos'        },
        { value: 'lido',         label: '✓ Lidos'      },
        { value: 'em-andamento', label: '📖 Lendo'      },
        { value: 'nao-lido',     label: '○ Não lidos'  },
    ];

    opcoes.forEach(op => {
        const btn = document.createElement('button');
        btn.className = `chip-leitura ${op.value === 'todos' ? 'active' : ''}`;
        btn.textContent = op.label;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.chip-leitura').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            estadoFiltro.leitura = op.value;
            _disparar(baseDados, renderizarGrid, atualizarContador);
        });
        container.appendChild(btn);
    });
}

// ─────────────────────────────────────────────
//  HISTÓRICO DE BUSCAS
// ─────────────────────────────────────────────

// 19. Salvar e exibir buscas recentes
const HISTORICO_KEY = 'historico-buscas';

function _salvarBusca(termo) {
    if (!termo || termo.length < 2) return;
    let hist = JSON.parse(localStorage.getItem(HISTORICO_KEY) || '[]');
    hist = [termo, ...hist.filter(t => t !== termo)].slice(0, 5);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(hist));
}

export function mostrarBuscasRecentes(input, dispararBusca) {
    const recentes = JSON.parse(localStorage.getItem(HISTORICO_KEY) || '[]');
    if (!recentes.length || !input) return;

    const lista = recentes.map(t =>
        `<button style="
            background:none; border:1px solid var(--border, #e0e0e0);
            border-radius:20px; padding:4px 12px;
            font-size:0.8rem; cursor:pointer;
            color:var(--text-muted); transition:all 0.2s;
        " data-termo="${t}">🕐 ${t}</button>`
    ).join('');

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;';
    wrapper.innerHTML = lista;

    wrapper.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.termo;
            input.dispatchEvent(new Event('input'));
        });
    });

    input.parentElement?.after(wrapper);
}

// ─────────────────────────────────────────────
//  INTERNOS
// ─────────────────────────────────────────────
function _setCategoria(container, chipAtivo, cat) {
    container?.querySelectorAll('.chip').forEach(c => {
        const isAtivo = c === chipAtivo;
        c.classList.toggle('active', isAtivo);
        c.setAttribute('aria-checked', String(isAtivo));
    });
}

// 20. Dispatcher central — aplica todos os filtros de uma vez
function _disparar(baseDados, renderizarGrid, atualizarContador) {
    // Aplica filtro de leitura se existir
    let resultado = _aplicarFiltros(baseDados);

    if (estadoFiltro.leitura && estadoFiltro.leitura !== 'todos') {
        resultado = resultado.filter(s => {
            const slug = _slugify(s.nome);
            const lido = _getLido(slug);
            const prog = _getProgresso(slug);
            if (estadoFiltro.leitura === 'lido')          return lido;
            if (estadoFiltro.leitura === 'em-andamento')  return !lido && prog > 0;
            if (estadoFiltro.leitura === 'nao-lido')      return !lido && prog === 0;
            return true;
        });
    }

    renderizarGrid(resultado);
    atualizarContador(resultado.length);
    _salvarNaURL();
    _salvarBusca(estadoFiltro.termo);

    // Estado vazio
    const grid = document.querySelector('.grid, #grid, [data-grid]');
    if (grid) _gerenciarEstadoVazio(grid, resultado.length, estadoFiltro.termo);
}
