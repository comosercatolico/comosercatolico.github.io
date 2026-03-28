/* =========================
      GRID DE SANTOS MODERNO
========================= */
const grid = document.getElementById("santosGrid");
const pesquisaInput = document.querySelector(".santos-pesquisa input");
const categoriasContainer = document.getElementById("categoriasContainer");

// Função para criar card
function criarCard(santo) {
  const card = document.createElement("div");
  card.className = "santo-card";
  card.dataset.nome = santo.nome.toLowerCase();
  card.dataset.categoria = santo.categoria;

  card.innerHTML = `
    <img src="../imagens/default.jpg" alt="${santo.nome}">
    <div class="santo-card-content">
      <h3>${santo.nome}</h3>
      <p>Breve descrição da vida e testemunho de ${santo.nome}.</p>
      <a href="#" class="ler-vida">Ler vida</a>
    </div>
  `;

  // Evento para abrir modal ao clicar "Ler vida"
  card.querySelector(".ler-vida").addEventListener("click", e => {
    e.preventDefault();
    abrirModal(santo);
  });

  grid.appendChild(card);
}

/* =========================
      POPULAR GRID COM SANTOS
========================= */
// Aqui é onde você coloca os 400 santos
// Cada santo deve ser um objeto {nome:"", categoria:""}
santos.forEach(criarCard);
/* =========================
      LISTA DE 400 SANTOS
========================= */
const santos = [
  { nome: "São Pedro", categoria: "Apóstolo" },
  { nome: "São Paulo", categoria: "Apóstolo" },
  { nome: "São João", categoria: "Evangelista" },
  { nome: "São Mateus", categoria: "Evangelista" },
  { nome: "São Marcos", categoria: "Evangelista" },
  { nome: "São Lucas", categoria: "Evangelista" },
  { nome: "Santo Estevão", categoria: "Mártir" },
  { nome: "São Tiago Maior", categoria: "Apóstolo" },
  { nome: "São Tiago Menor", categoria: "Apóstolo" },
  { nome: "São Judas Tadeu", categoria: "Apóstolo" },
  { nome: "São Bartolomeu", categoria: "Apóstolo" },
  { nome: "São Simão", categoria: "Apóstolo" },
  { nome: "São Tomé", categoria: "Apóstolo" },
  { nome: "São Matias", categoria: "Apóstolo" },
  { nome: "São Paulo da Cruz", categoria: "Confessor" },
  { nome: "São Francisco de Assis", categoria: "Confessor" },
  { nome: "Santa Clara de Assis", categoria: "Virgem" },
  { nome: "Santa Teresinha do Menino Jesus", categoria: "Doutor da Igreja" },
  { nome: "Santa Teresa d'Ávila", categoria: "Doutor da Igreja" },
  { nome: "São João da Cruz", categoria: "Doutor da Igreja" },
  { nome: "São Tomás de Aquino", categoria: "Doutor da Igreja" },
  { nome: "São Agostinho", categoria: "Doutor da Igreja" },
  { nome: "São Jerônimo", categoria: "Doutor da Igreja" },
  { nome: "São Gregório Magno", categoria: "Doutor da Igreja" },
  { nome: "São Basílio Magno", categoria: "Doutor da Igreja" },
  { nome: "São Gregório Nazianzeno", categoria: "Doutor da Igreja" },
  { nome: "São João Crisóstomo", categoria: "Doutor da Igreja" },
  { nome: "São Leão Magno", categoria: "Doutor da Igreja" },
  { nome: "São Bento", categoria: "Abade" },
  { nome: "Santa Benedita", categoria: "Virgem" },
  { nome: "São Maurício", categoria: "Mártir" },
  { nome: "São Sebastião", categoria: "Mártir" },
  { nome: "São Jorge", categoria: "Mártir" },
  { nome: "São Lourenço", categoria: "Mártir" },
  { nome: "São Vicente de Paulo", categoria: "Confessor" },
  { nome: "Santa Catarina de Sena", categoria: "Doutor da Igreja" },
  { nome: "São José", categoria: "Justo" },
  { nome: "Santo Antônio de Pádua", categoria: "Confessor" },
  { nome: "São João Bosco", categoria: "Presbítero" },
  { nome: "São Raimundo Nonato", categoria: "Confessor" },
  { nome: "São Pio X", categoria: "Papa" },
  { nome: "São Gregório VII", categoria: "Papa" },
  { nome: "São João Paulo II", categoria: "Papa" },
  { nome: "São Paulo VI", categoria: "Papa" },
  { nome: "São Pio de Pietrelcina", categoria: "Presbítero" },
  { nome: "Santa Ângela de Mérici", categoria: "Fundadora" },
  { nome: "Santa Paulina", categoria: "Religiosa" },
  { nome: "Santa Rita de Cássia", categoria: "Religiosa" },
  { nome: "São João Maria Vianney", categoria: "Presbítero" },
  { nome: "São Luís Gonzaga", categoria: "Religioso" },
  { nome: "São Carlos Borromeu", categoria: "Bispo" },
  { nome: "São Francisco Xavier", categoria: "Missionário" },
  { nome: "São José de Anchieta", categoria: "Missionário" },
  { nome: "São Francisco Solano", categoria: "Missionário" },
  { nome: "Santa Rosa de Lima", categoria: "Virgem" },
  { nome: "Santa Maria Goretti", categoria: "Virgem" },
  { nome: "Santa Faustina Kowalska", categoria: "Religiosa" },
  { nome: "São Maximiliano Kolbe", categoria: "Mártir" },
  { nome: "São João XXIII", categoria: "Papa" },
  { nome: "São Cipriano", categoria: "Bispo" },
  { nome: "São Policarpo", categoria: "Bispo" },
  { nome: "São Inácio de Antioquia", categoria: "Bispo" },
  { nome: "São Justino Mártir", categoria: "Mártir" },
  { nome: "São Ireneu", categoria: "Bispo" },
  { nome: "São Atanásio", categoria: "Bispo" },
  { nome: "São Cirilo de Jerusalém", categoria: "Bispo" },
  { nome: "São Metódio", categoria: "Missionário" },
  { nome: "São Patrício", categoria: "Bispo" },
  { nome: "Santa Brígida da Suécia", categoria: "Religiosa" },
  { nome: "Santa Edith Stein", categoria: "Mártir" },
  { nome: "São João de Deus", categoria: "Confessor" },
  { nome: "São Martinho de Tours", categoria: "Bispo" },
  { nome: "São Leandro", categoria: "Bispo" },
  { nome: "São Teotônio", categoria: "Bispo" },
  { nome: "São Francisco de Sales", categoria: "Bispo" },
  { nome: "São Afonso de Ligório", categoria: "Bispo" },
  { nome: "São Antônio Maria Claret", categoria: "Bispo" },
  { nome: "São Norberto", categoria: "Bispo" },
  { nome: "São Bernardo de Claraval", categoria: "Abade" },
  { nome: "São Pedro Damião", categoria: "Bispo" },
  { nome: "São João Damasceno", categoria: "Doutor da Igreja" },
  { nome: "São João Batista", categoria: "Profeta" },
  { nome: "São Josafá", categoria: "Mártir" },
  { nome: "São Valentim", categoria: "Mártir" },
  { nome: "Santa Luzia", categoria: "Virgem" },
  { nome: "Santa Ágata", categoria: "Virgem" },
  { nome: "Santa Cecília", categoria: "Virgem" },
  { nome: "Santa Maria Madalena", categoria: "Penitente" },
  { nome: "Santa Ana", categoria: "Justa" },
  { nome: "Santa Isabel da Hungria", categoria: "Religiosa" },
  { nome: "Santa Margarida da Escócia", categoria: "Rainha" },
  { nome: "São Casimiro", categoria: "Justo" },
  { nome: "São Estanislau", categoria: "Bispo" },
  { nome: "São João Nepomuceno", categoria: "Mártir" },
  { nome: "São Carlos Lwanga", categoria: "Mártir" },
  { nome: "Santa Josefina Bakhita", categoria: "Religiosa" },
  { nome: "Santa Kateri Tekakwitha", categoria: "Virgem" },
  { nome: "São Junípero Serra", categoria: "Missionário" },
  { nome: "São Damião de Molokai", categoria: "Missionário" },
  { nome: "Santa Dulce dos Pobres", categoria: "Religiosa" },
  { nome: "São Óscar Romero", categoria: "Mártir" },
  { nome: "São André Kim", categoria: "Mártir" },
  { nome: "São Lourenço Ruiz", categoria: "Mártir" },
  { nome: "Santa Mônica", categoria: "Confessora" },
  { nome: "Santa Perpétua", categoria: "Mártir" },
  { nome: "Santa Felicidade", categoria: "Mártir" },
  { nome: "Santa Blandina", categoria: "Mártir" },
  { nome: "São Justo", categoria: "Mártir" },
  { nome: "São Pastor", categoria: "Mártir" },
  { nome: "São Protásio", categoria: "Mártir" },
  { nome: "São Pancrácio", categoria: "Mártir" },
  { nome: "Santa Prisca", categoria: "Virgem" },
  { nome: "Santa Sabina", categoria: "Virgem" },
  { nome: "São Félix de Nola", categoria: "Mártir" },
  { nome: "São Januário", categoria: "Bispo" },
  { nome: "São Genaro", categoria: "Bispo" },
  { nome: "São Frutuoso", categoria: "Bispo" },
  { nome: "São Hermenegildo", categoria: "Mártir" },
  { nome: "Santa Ludmila", categoria: "Rainha" },
  { nome: "Santa Adelaide", categoria: "Imperatriz" },
  { nome: "Santa Cunegundes", categoria: "Imperatriz" },
  { nome: "São Fernando III", categoria: "Rei" },
  { nome: "São Nicolau", categoria: "Bispo" },
  { nome: "São Cosme", categoria: "Mártir" },
  { nome: "São Damião", categoria: "Mártir" },
  { nome: "São Roque", categoria: "Confessor" },
  { nome: "São Cristóvão", categoria: "Mártir" },
  { nome: "São Valentim", categoria: "Mártir" },
  { nome: "Santa Inês", categoria: "Virgem" },
  { nome: "Santa Cecília", categoria: "Virgem" },
  { nome: "Santa Marta", categoria: "Confessora" },
  { nome: "São Joaquim", categoria: "Justo" },
  { nome: "São Zacarias", categoria: "Profeta" },
  { nome: "Santa Isabel", categoria: "Justa" },
  { nome: "São Filipe", categoria: "Apóstolo" },
  { nome: "São Bartolomeu", categoria: "Apóstolo" },
  { nome: "São André", categoria: "Apóstolo" },
  { nome: "São Matias", categoria: "Apóstolo" },
  { nome: "São Hilário de Poitiers", categoria: "Bispo" },
  { nome: "São Efrém", categoria: "Doutor da Igreja" },
  { nome: "São Beda, o Venerável", categoria: "Doutor da Igreja" },
  { nome: "São Pedro Damião", categoria: "Bispo" },
  { nome: "São Bruno", categoria: "Religioso" },
  { nome: "São Norberto", categoria: "Bispo" },
  { nome: "São Bernardo de Claraval", categoria: "Abade" },
  { nome: "São Pedro Canísio", categoria: "Bispo" },
  { nome: "São Francisco de Sales", categoria: "Bispo" },
  { nome: "São Afonso de Ligório", categoria: "Bispo" },
  { nome: "São Leonardo de Porto Maurício", categoria: "Presbítero" },
  { nome: "São João Maria Vianney", categoria: "Presbítero" },
  { nome: "São Pedro Julião Eymard", categoria: "Presbítero" },
  { nome: "São João Eudes", categoria: "Presbítero" },
  { nome: "São Luís Maria Grignion de Montfort", categoria: "Presbítero" },
  { nome: "São José de Anchieta", categoria: "Missionário" },
  { nome: "São Roque González", categoria: "Missionário" },
  { nome: "São Turíbio de Mongrovejo", categoria: "Bispo" },
  { nome: "São Francisco Solano", categoria: "Missionário" },
  { nome: "São Martinho de Lima", categoria: "Presbítero" },
  { nome: "Santa Rosa de Lima", categoria: "Virgem" },
  { nome: "Santa Mariana de Jesus", categoria: "Virgem" },
  { nome: "Santa Teresa dos Andes", categoria: "Virgem" },
  { nome: "São Alberto Magno", categoria: "Doutor da Igreja" },
  { nome: "Santa Hildegarda de Bingen", categoria: "Doutor da Igreja" },
  { nome: "Santa Matilde", categoria: "Rainha" },
  { nome: "Santa Gertrudes", categoria: "Virgem" },
  { nome: "Santa Escolástica", categoria: "Virgem" },
  { nome: "São Romualdo", categoria: "Abade" },
  { nome: "São Columbano", categoria: "Abade" },
  { nome: "São Bonifácio", categoria: "Bispo" },
  { nome: "São Willibrordo", categoria: "Bispo" },
  { nome: "São Venceslau", categoria: "Rei" },
  { nome: "Santa Ludmila", categoria: "Rainha" },
  { nome: "Santa Adelaide", categoria: "Imperatriz" },
  { nome: "Santa Cunegundes", categoria: "Imperatriz" },
  { nome: "São Henrique II", categoria: "Rei" },
  { nome: "São Fernando III", categoria: "Rei" },
  { nome: "Santa Isabel da Hungria", categoria: "Rainha" },
  { nome: "Santa Margarida da Escócia", categoria: "Rainha" },
  { nome: "São Casimiro", categoria: "Justo" },
  { nome: "São Estanislau", categoria: "Bispo" },
  { nome: "São Adalberto", categoria: "Bispo" },
  { nome: "São Bruno de Querfurt", categoria: "Bispo" },
  { nome: "São João Nepomuceno", categoria: "Mártir" },
  { nome: "São Carlos Lwanga", categoria: "Mártir" },
  { nome: "Santa Josefina Bakhita", categoria: "Religiosa" },
  { nome: "Santa Kateri Tekakwitha", categoria: "Virgem" },
  { nome: "São Junípero Serra", categoria: "Missionário" },
  { nome: "São Damião de Molokai", categoria: "Missionário" },
  { nome: "Santa Paulina", categoria: "Religiosa" },
  { nome: "Santa Dulce dos Pobres", categoria: "Religiosa" },
  { nome: "São Óscar Romero", categoria: "Mártir" },
  { nome: "São André Kim", categoria: "Mártir" },
  { nome: "São Paulo Chong", categoria: "Mártir" },
  { nome: "São Lourenço Ruiz", categoria: "Mártir" },
  { nome: "Santa Mônica", categoria: "Confessora" },
  { nome: "Santa Helena", categoria: "Imperatriz" },
  { nome: "Santa Perpétua", categoria: "Mártir" },
  { nome: "Santa Felicidade", categoria: "Mártir" },
  { nome: "Santa Blandina", categoria: "Mártir" },
  { nome: "São Justo", categoria: "Mártir" },
  { nome: "São Pastor", categoria: "Mártir" },
  { nome: "São Gervásio", categoria: "Mártir" },
  { nome: "São Protásio", categoria: "Mártir" },
  { nome: "São Vital", categoria: "Mártir" },
  { nome: "Santa Valéria", categoria: "Virgem" },
  { nome: "São Narciso", categoria: "Bispo" },
  { nome: "São Quadrato", categoria: "Bispo" },
  { nome: "São Tarcísio", categoria: "Mártir" },
  { nome: "São Pancrácio", categoria: "Mártir" },
  { nome: "Santa Prisca", categoria: "Virgem" },
  { nome: "Santa Sabina", categoria: "Virgem" },
  { nome: "São Félix de Nola", categoria: "Mártir" },
  { nome: "São Januário", categoria: "Bispo" },
  { nome: "São Genaro", categoria: "Bispo" },
  { nome: "São Severo", categoria: "Bispo" },
  { nome: "São Leandro", categoria: "Bispo" },
  { nome: "São Isidoro de Sevilha", categoria: "Doutor da Igreja" },
  { nome: "São Frutuoso", categoria: "Bispo" },
  { nome: "São Ildefonso", categoria: "Bispo" },
  { nome: "São Hermenegildo", categoria: "Mártir" },
  { nome: "São Teotônio", categoria: "Bispo" },
  { nome: "São Gonçalo", categoria: "Confessor" },
  { nome: "São Nuno de Santa Maria", categoria: "Confessor" },
  { nome: "Santa Beatriz da Silva", categoria: "Religiosa" },
  { nome: "Santa Joana de Portugal", categoria: "Virgem" },
  { nome: "São Frei Galvão", categoria: "Presbítero" },
  { nome: "São José Moscati", categoria: "Confessor" },
  { nome: "São Ricardo Pampuri", categoria: "Presbítero" },
  { nome: "Santa Maria Bertilla", categoria: "Religiosa" },
  { nome: "Santa Ângela de Mérici", categoria: "Fundadora" },
  { nome: "Santa Paula Frassinetti", categoria: "Religiosa" },
  { nome: "São Luís Orione", categoria: "Presbítero" },
  { nome: "São João Calabria", categoria: "Bispo" },
  { nome: "São Vicente Pallotti", categoria: "Presbítero" },
  { nome: "São Gaspar del Búfalo", categoria: "Presbítero" },
  { nome: "São Camilo de Lellis", categoria: "Presbítero" }
];
/* =========================
      PESQUISA INTELIGENTE
========================= */
pesquisaInput.addEventListener("input", () => {
  const termo = pesquisaInput.value.toLowerCase();
  document.querySelectorAll(".santo-card").forEach(card => {
    const nome = card.dataset.nome;
    const categoria = card.dataset.categoria.toLowerCase();
    card.style.display = (nome.includes(termo) || categoria.includes(termo)) ? "block" : "none";
  });
});

/* =========================
      FILTRO POR CATEGORIA
========================= */
const categorias = [...new Set(santos.map(s => s.categoria))];

categorias.forEach(cat => {
  const btn = document.createElement("button");
  btn.textContent = cat;
  btn.className = "categoria-btn";

  btn.addEventListener("click", () => {
    // Marcar botão ativo
    document.querySelectorAll(".categoria-btn").forEach(b => b.classList.remove("active-btn"));
    btn.classList.add("active-btn");

    document.querySelectorAll(".santo-card").forEach(card => {
      card.style.display = card.dataset.categoria === cat ? "block" : "none";
    });
  });

  categoriasContainer.appendChild(btn);
});

/* =========================
      MODAL DE VIDA DO SANTO
========================= */
const modal = document.createElement("div");
modal.id = "santoModal";
modal.style.display = "none";
modal.innerHTML = `
  <div class="modal-content">
    <span class="close-modal">&times;</span>
    <h2 class="modal-title"></h2>
    <p class="modal-text">Aqui aparecerá a vida completa do santo.</p>
  </div>
`;
document.body.appendChild(modal);

function abrirModal(santo) {
  modal.querySelector(".modal-title").textContent = santo.nome;
  modal.style.display = "flex";
}

// Fechar modal
modal.querySelector(".close-modal").addEventListener("click", () => {
  modal.style.display = "none";
});

// Fechar modal ao clicar fora do conteúdo
modal.addEventListener("click", e => {
  if(e.target === modal) modal.style.display = "none";
});
