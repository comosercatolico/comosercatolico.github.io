/* MENU LATERAL */

function abrirMenu(){
document.getElementById("sidebar").style.left="0";
}

function fecharMenu(){
document.getElementById("sidebar").style.left="-260px";
}

/* ANIMAÇÃO MENU */

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
}
const santos = [
"São Pedro","São Paulo","São João","São Mateus","São Marcos","São Lucas",
"Santo Antônio","São Bento","São Domingos","São Tomás de Aquino",
"Santo Agostinho","São Jerônimo","São Gregório Magno","São Basílio",
"São João Crisóstomo","São Francisco de Assis","Santa Clara",
"Santa Teresinha","Santa Teresa d'Ávila","São João da Cruz",
"São Luís Gonzaga","São Sebastião","São Jorge","São Miguel Arcanjo",
"São Rafael","São Gabriel","Santa Catarina de Sena","Santa Rita de Cássia",
"São Vicente de Paulo","São João Bosco","São Padre Pio","São Maximiliano Kolbe",
"Santa Faustina","Santa Gianna","São José","Santa Maria Goretti",
"São Cipriano","São Policarpo","Santo Inácio de Loyola","São Francisco Xavier",
"São Camilo de Lellis","São Martinho de Tours","São Leão Magno",
"São Anselmo","São Boaventura","São Bernardino de Sena","São Roberto Belarmino",
"São João Damasceno","São Cirilo","São Metódio","São Patrício",
"Santa Brígida","Santa Edith Stein","São João Paulo II","São Paulo VI",
"São João XXIII","São Pio X","São Cornélio","São Lourenço",
"São Estêvão","São Barnabé","São Timóteo","São Tito",
"São Clemente","São Inácio de Antioquia","São Justino",
"Santo Irineu","São Atanásio","São Cirilo de Jerusalém",
"São Gregório Nazianzeno","São Leão II","São Nicolau",
"São Cosme","São Damião","São Roque","São Cristóvão",
"São Valentim","Santa Luzia","Santa Ágata","Santa Inês",
"Santa Cecília","Santa Marta","Santa Maria Madalena",
"Santa Ana","São Joaquim","São Zacarias","Santa Isabel",
"São João Batista","São Simão","São Judas Tadeu",
"São Filipe","São Bartolomeu","São Tiago Maior",
"São Tiago Menor","São André","São Matias",
"São Hilário de Poitiers","São Efrém","São Beda, o Venerável",
"São Pedro Damião","São Bruno","São Norberto",
"São Bernardo de Claraval","São Pedro Canísio","São Francisco de Sales",
"São Afonso de Ligório","São Leonardo de Porto Maurício",
"São João Maria Vianney","São Pedro Julião Eymard",
"São João Eudes","São Luís Maria Grignion de Montfort",
"São José de Anchieta","São Roque González",
"São Turíbio de Mongrovejo","São Francisco Solano",
"São Martinho de Lima","Santa Rosa de Lima",
"Santa Mariana de Jesus","Santa Teresa dos Andes",
"São Alberto Magno","Santa Hildegarda de Bingen",
"Santa Matilde","Santa Gertrudes","Santa Escolástica",
"São Romualdo","São Columbano","São Bonifácio",
"São Willibrordo","São Venceslau","Santa Ludmila",
"Santa Adelaide","Santa Cunegundes","São Henrique II",
"São Fernando III","Santa Isabel da Hungria",
"Santa Margarida da Escócia","São Casimiro",
"São Estanislau","São Adalberto","São Bruno de Querfurt",
"São João Nepomuceno","São Carlos Lwanga",
"Santa Josefina Bakhita","Santa Kateri Tekakwitha",
"São Junípero Serra","São Damião de Molokai",
"Santa Paulina","Santa Dulce dos Pobres",
"São Óscar Romero","São André Kim","São Paulo Chong",
"São Lourenço Ruiz","Santa Mônica","Santa Helena",
"Santa Perpétua","Santa Felicidade","Santa Blandina",
"São Justo","São Pastor","São Gervásio",
"São Protásio","São Vital","Santa Valéria",
"São Narciso","São Quadrato","São Tarcísio",
"São Pancrácio","Santa Prisca","Santa Sabina",
"São Félix de Nola","São Januário","São Genaro",
"São Severo","São Leandro","São Isidoro de Sevilha",
"São Frutuoso","São Ildefonso","São Hermenegildo",
"São Teotônio","São Gonçalo","São Nuno de Santa Maria",
"Santa Beatriz da Silva","Santa Joana de Portugal",
"São Frei Galvão","São José Moscati",
"São Ricardo Pampuri","Santa Maria Bertilla",
"Santa Ângela de Mérici","Santa Paula Frassinetti",
"São Luís Orione","São João Calabria",
"São Vicente Pallotti","São Gaspar del Búfalo",
"São Camilo de Lellis Filho (discípulo homônimo)"];

const grid = document.getElementById("santosGrid");

santos.forEach(nome => {
  const card = document.createElement("div");
  card.className = "santo-card";

  card.innerHTML = `
    <img src="../imagens/default.jpg">
    <div class="santo-card-content">
      <h3>${nome}</h3>
      <p>Breve descrição da vida e testemunho de ${nome}.</p>
      <a href="#">Ler vida</a>
    </div>
  `;

  grid.appendChild(card);
});
