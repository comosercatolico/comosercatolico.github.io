// =========================
// IMPORTS (puxa tudo que o jogo precisa iniciar)
// =========================
import { initCamera } from "./camera.js";
import { carregarImagens } from "./imagens.js";
import { gerarMapa } from "./mapa.js";
import { loop } from "./loop.js";

import { atualizarHUDLobby } from "./economia.js";
import { atualizarUIUpgrades } from "./upgrades.js";

// (opcional - se você tiver sistema de invocação separado)
// import { initInvocacao } from "./invocacao.js";


// =========================
// FUNÇÃO PRINCIPAL (start do jogo)
// =========================
function iniciarJogo(){

    // 🎥 câmera + canvas
    initCamera();

    // 🖼️ carregar sprites/imagens
    carregarImagens();

    // 🗺️ gerar mapa
    gerarMapa();

    // 💰 atualizar interface
    atualizarHUDLobby();
    atualizarUIUpgrades();

    // 🔮 sistemas extras (se existir)
    // initInvocacao();

    // 🔁 iniciar loop do jogo
    loop();
}


// =========================
// START AUTOMÁTICO
// =========================
iniciarJogo();
