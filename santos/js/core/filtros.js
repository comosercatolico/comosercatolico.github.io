let debounceTimer;

/* =========================
      PESQUISA (INPUT)
========================= */
export function iniciarPesquisa(input, baseDados, renderizarGrid, atualizarContador) {
    if (!input) return;

    input.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);

        const termo = normalizar(e.target.value);

        debounceTimer = setTimeout(() => {
            const filtrados = baseDados.filter(s => {
                const nomeMatch = normalizar(s.nome).includes(termo);

                const catMatch = s.categorias.some(c =>
                    normalizar(c).includes(termo)
                );

                return nomeMatch || catMatch;
            });

            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        }, 250);
    });
}

/* =========================
      CATEGORIAS (CHIPS)
========================= */
export function inicializarCategorias(container, baseDados, renderizarGrid, atualizarContador) {
    if (!container) return;

    const categoriasUnicas = [...new Set(baseDados.flatMap(s => s.categorias))].sort();
    const menuCategorias = ["Todos", ...categoriasUnicas];

    container.innerHTML = "";

    menuCategorias.forEach(cat => {
        const chip = document.createElement("button");

        chip.className = `chip ${cat === "Todos" ? "active" : ""}`;

        const quantidade = cat === "Todos"
            ? baseDados.length
            : baseDados.filter(s => s.categorias.includes(cat)).length;

        chip.innerHTML = `
            <span class="chip-text">${cat}</span>
            <span class="chip-count">${quantidade}</span>
        `;

        chip.addEventListener("click", () => {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            const filtrados = cat === "Todos"
                ? baseDados
                : baseDados.filter(s => s.categorias.includes(cat));

            renderizarGrid(filtrados);
            atualizarContador(filtrados.length);
        });

        container.appendChild(chip);
    });
}

/* =========================
      UTIL
========================= */
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
