/* =========================
      MENU LATERAL
========================= */
function abrirMenu(){ document.getElementById("sidebar").style.left="0"; }
function fecharMenu(){ document.getElementById("sidebar").style.left="-260px"; }

/* =========================
      MENU PRINCIPAL
========================= */
const indicator = document.querySelector(".menu-indicator");
const items = document.querySelectorAll(".menu-item");

function updateIndicator(el){
  indicator.style.width = el.offsetWidth + "px";
  indicator.style.left = el.offsetLeft + "px";
}

items.forEach(item=>{
  item.addEventListener("click",function(){
    items.forEach(i=>i.classList.remove("active"));
    this.classList.add("active");
    updateIndicator(this);
  });
});

window.onload=()=>{
  const active=document.querySelector(".menu-item.active");
  updateIndicator(active);
};

/* =========================
      LISTA DE SANTOS
========================= */
let santos = [
  {nome:"São Pedro", categoria:"Apóstolo"},
  {nome:"São Paulo", categoria:"Apóstolo"},
  {nome:"São João", categoria:"Evangelista"},
  {nome:"São Mateus", categoria:"Evangelista"},
  {nome:"São Marcos", categoria:"Evangelista"},
  {nome:"São Lucas", categoria:"Evangelista"},
  {nome:"Santo Antônio", categoria:"Confessor"},
  {nome:"São Bento", categoria:"Confessor"},
  {nome:"São Domingos", categoria:"Confessor"},
  {nome:"São Tomás de Aquino", categoria:"Doutor da Igreja"},
  {nome:"Santo Agostinho", categoria:"Doutor da Igreja"},
  {nome:"São Jerônimo", categoria:"Doutor da Igreja"},
  {nome:"São Gregório Magno", categoria:"Doutor da Igreja"},
  {nome:"São Basílio", categoria:"Doutor da Igreja"},
  {nome:"São João Crisóstomo", categoria:"Doutor da Igreja"},
  {nome:"São Francisco de Assis", categoria:"Confessor"},
  {nome:"Santa Clara", categoria:"Virgem"},
  {nome:"Santa Teresinha", categoria:"Doutor da Igreja"},
  {nome:"Santa Teresa d'Ávila", categoria:"Doutor da Igreja"},
  {nome:"São João da Cruz", categoria:"Doutor da Igreja"},
  {nome:"São Luís Gonzaga", categoria:"Confessor"},
  {nome:"São Sebastião", categoria:"Mártir"},
  {nome:"São Jorge", categoria:"Mártir"},
  {nome:"São Miguel Arcanjo", categoria:"Anjo"},
  {nome:"São Rafael", categoria:"Anjo"},
  {nome:"São Gabriel", categoria:"Anjo"},
  {nome:"São Camilo de Lellis Filho (discípulo homônimo)", categoria:"Confessor"}
];

// Adicionar 50 santos extras
for(let i=1;i<=50;i++){
  santos.push({
    nome:`Santo Extra ${i}`,
    categoria:["Mártir","Confessor","Virgem","Doutor da Igreja","Apóstolo"][i%5]
  });
}

/* =========================
      GRID DE SANTOS
========================= */
const grid = document.getElementById("santosGrid");

function criarCard(santo){
  const card = document.createElement("div");
  card.className="santo-card";
  card.dataset.categoria=santo.categoria;
  card.innerHTML=`
    <img src="../imagens/default.jpg">
    <div class="santo-card-content">
      <h3>${santo.nome}</h3>
      <p>Breve descrição da vida e testemunho de ${santo.nome}.</p>
      <a href="#">Ler vida</a>
      <div class="progress-bar"><div class="progress"></div></div>
    </div>
  `;
  card.addEventListener("click", ()=>{
    document.querySelectorAll(".santo-card").forEach(c=>c.classList.remove("active-card"));
    card.classList.add("active-card");
    const rect=card.getBoundingClientRect();
    const offset=rect.left-(window.innerWidth/2-rect.width/2);
    grid.scrollBy({left:offset,behavior:"smooth"});
  });
  grid.appendChild(card);
}

santos.forEach(criarCard);

/* =========================
      FILTRO POR CATEGORIA
========================= */
const categoriasContainer=document.getElementById("categoriasContainer");
const categorias=[...new Set(santos.map(s=>s.categoria))];

categorias.forEach(cat=>{
  const btn=document.createElement("button");
  btn.className="categoria-btn";
  btn.textContent=cat;
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".santo-card").forEach(card=>{
      card.style.display=(card.dataset.categoria===cat||cat==="Todos")?"block":"none";
    });
    document.querySelectorAll(".categoria-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
  categoriasContainer.appendChild(btn);
});

/* =========================
      PESQUISA
========================= */
const inputPesquisa=document.getElementById("pesquisaSantos");
inputPesquisa.addEventListener("input",()=>{
  const termo=inputPesquisa.value.toLowerCase();
  document.querySelectorAll(".santo-card").forEach(card=>{
    const nome=card.querySelector("h3").textContent.toLowerCase();
    card.style.display=nome.includes(termo)?"block":"none";
  });
});

/* =========================
      BARRA DE PROGRESSO
========================= */
window.addEventListener("scroll",()=>{
  const cardAtivo=document.querySelector(".santo-card.active-card");
  if(cardAtivo){
    const rect=cardAtivo.getBoundingClientRect();
    const totalHeight=cardAtivo.scrollHeight-window.innerHeight;
    const progress=Math.min(Math.max((window.scrollY-cardAtivo.offsetTop+window.innerHeight)/totalHeight,0),1);
    cardAtivo.querySelector(".progress").style.width=`${progress*100}%`;
  }
});
