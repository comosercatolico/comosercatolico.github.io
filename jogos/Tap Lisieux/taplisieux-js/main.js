// ===================================================
// MAIN (PONTO CENTRAL DO JOGO)
// ===================================================


// ===================================================
// IMPORTS
// ===================================================

// render (loop principal)
import { iniciarRender } from "./render.js";

// batalha
import { iniciarBatalha } from "./batalha.js";

// economia
import { iniciarEnergia, atualizarHUDLobby } from "./economia.js";

// lobby (movimento, santa, objetos)
import { inicializarLobby } from "./lobby.js";

// câmera
import { inicializarCamera } from "./camera.js";

// imagens
import { carregarImagens } from "./imagens.js";


// ===================================================
// INICIALIZAÇÃO DO JOGO
// ===================================================
async function iniciarJogo(){

    console.log("🔄 Iniciando jogo...");

    // 1. carregar imagens
    await carregarImagens();

    // 2. iniciar sistemas base
    inicializarCamera();
    inicializarLobby();

    // 3. economia
    iniciarEnergia();
    atualizarHUDLobby();

    // 4. iniciar render (loop principal)
    iniciarRender();

    console.log("✅ Jogo iniciado com sucesso!");
}


// ===================================================
// EVENTOS GLOBAIS
// ===================================================

// botão de iniciar batalha
const btnBatalha = document.getElementById("btnBatalha");

if(btnBatalha){
    btnBatalha.addEventListener("click", ()=>{
        iniciarBatalha();
    });
}


// ===================================================
// START
// ===================================================
iniciarJogo();
