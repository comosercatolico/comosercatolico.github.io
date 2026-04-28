// ═══════════════════════════════════════
//  TAPLISIEUX.JS
//  Loop principal do jogo + bootstrapping
// ═══════════════════════════════════════

// ── Loop ──
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (emBatalha) {
        window.desenharBatalha();
        atualizarUIBatalha();
    } else {
        window.desenharLobby();
    }

    requestAnimationFrame(loop);
}

// ── Inicialização ──
(function init() {
    // UI inicial
    atualizarHUDLobby();
    atualizarUIUpgrades();
    loop();
})();
