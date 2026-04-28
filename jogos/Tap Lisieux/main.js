// ═══════════════════════════════════════════════════════════
//  MAIN.JS — Bootstrap, canvas, loop principal
// ═══════════════════════════════════════════════════════════
"use strict";

// ── Canvas ──
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ── Resize ──
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

window.addEventListener('resize', () => {
    resizeCanvas();
    LobbyRenderer.onResize(canvas.width, canvas.height);
    BattleRenderer.onResize(canvas);
});

// ════════════════════════════════════════
//  FUNÇÕES GLOBAIS (chamadas pelo HTML)
// ════════════════════════════════════════

function iniciarBatalha() {
    BattleState.iniciar();
    BattleRenderer.init(canvas); // garante flores reiniciadas
    UIManager.entrarBatalha();
    UIManager.refreshBatalha();
    UIManager.refreshUpgrades();
}

function sairBatalha() {
    BattleState.sair();
    UIManager.sairBatalha();
}

function irEstagioAnterior() { BattleState.anterior(); UIManager.refreshBatalha(); }
function irProximoEstagio()  { BattleState.proximo();  UIManager.refreshBatalha(); }
function irParaChefe()       { BattleState.chefe();    UIManager.refreshBatalha(); }

function prestigiar() {
    if (!BattleState.prestigiar()) {
        ToastSystem.mostrar('⚠️ Alcance o estágio 60 primeiro!', 'aviso');
        return;
    }
    BattleRenderer.criarTexto('✨ PRESTIGIADO!', 'levelup', canvas);
    UIManager.refreshBatalha();
    UIManager.refreshUpgrades();
}

function comprarUpgrade(tipo) {
    if (!Upgrades.comprar(tipo)) {
        ToastSystem.mostrar('❌ Moedas insuficientes!', 'erro', 1800);
        return;
    }
    UIManager.refreshUpgrades();
    UIManager.refreshBatalha();
}

// Gacha
function invocarUI(qtd) {
    invocar(qtd);
}

// Configurações
function abrirConfig()      { UIManager.abrirModal('janelaConfig'); }
function fecharConfig()     { UIManager.fecharModal('janelaConfig'); }
function voltarSite()       { SaveSystem.salvar(); window.location.href = 'index.html'; }
function abrirModalInvocar(){ UIManager.abrirModal('modalInvocar', () => UIManager.refreshPity()); }
function abrirModalEquipar(){ UIManager.abrirModal('modalEquipar', () => UIManager.refreshListaEquipar()); }
function fecharModal(id)    { UIManager.fecharModal(id); }
function fecharSeForaModal(e, id) { UIManager.fecharSeForaModal(e, id); }
function togglePainel()     { UIManager.togglePainel(); }
function abrirAba(nome, btn){ UIManager.abrirAba(nome, btn); }

// ════════════════════════════════════════
//  EVENTOS DO CANVAS (click/touch = atacar)
// ════════════════════════════════════════
canvas.addEventListener('click', () => {
    if (!BattleState.emBatalha) return;
    const dano = Upgrades.calcDanoClick();
    BattleState.darDano(dano);
    BattleRenderer.dispararFlor(canvas);
    BattleRenderer.criarTexto(`-${fmtNum(dano)}`, 'click', canvas);
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!BattleState.emBatalha) return;
    const dano = Upgrades.calcDanoClick();
    BattleState.darDano(dano);
    BattleRenderer.dispararFlor(canvas);
    BattleRenderer.criarTexto(`-${fmtNum(dano)}`, 'click', canvas);
}, { passive: false });

// ════════════════════════════════════════
//  DPS (timer)
// ════════════════════════════════════════
setInterval(() => {
    if (!BattleState.emBatalha) return;
    const dps = Upgrades.calcDps();
    if (dps > 0) {
        BattleState.darDano(dps);
        BattleRenderer.criarTexto(`-${fmtNum(dps)}`, 'dps', canvas);
    }
}, CONFIG.DPS_INTERVAL_MS);

// ════════════════════════════════════════
//  EVENTOS DO GAME
// ════════════════════════════════════════

// Moeda / Gema → atualiza HUD
EventBus.on('economy:moeda', () => UIManager.refreshHUDLobby());
EventBus.on('economy:gema',  () => UIManager.refreshHUDLobby());
EventBus.on('energia:update',() => UIManager.refreshHUDLobby());

// Inimigo morto → moedas + exp
EventBus.on('inimigo:morto', (ini) => {
    const qtd = Math.min(7, 1 + Math.floor(ini.rMoeda / 10));
    for (let i = 0; i < qtd; i++) BattleRenderer.criarMoeda(canvas);
    UIManager.refreshBatalha();
});

// Fala do inimigo
EventBus.on('inimigo:fala', (nomeBase) => UIManager.exibirFala(nomeBase));

// Level up
EventBus.on('personagem:levelup', (lv) => {
    BattleRenderer.criarTexto(`⬆ LEVEL ${lv}!`, 'levelup', canvas);
    ToastSystem.mostrar(`⬆ Subiu para Lv.${lv}!`, 'levelup', 3000);
    UIManager.refreshBatalha();
});

// Upgrade comprado
EventBus.on('upgrade:comprado', () => UIManager.refreshUpgrades());

// Prestígio
EventBus.on('prestigio:feito', () => {
    ToastSystem.mostrar('🌟 Prestígio realizado! Relíquias ganhas!', 'lendario', 5000);
});

// Gacha resultado
EventBus.on('gacha:resultado', ({ resultados, lend, epic, qtd }) => {
    const primeiroItem = resultados[0];
    let txt, cor;
    if (qtd === 1) {
        const c = RARIDADE_COR[primeiroItem.raridade] ?? RARIDADE_COR['Comum'];
        txt = `${primeiroItem.emoji} ${primeiroItem.nome} (${primeiroItem.raridade})!`;
        cor = c.hex;
    } else {
        txt = `✨ ${qtd} invocações! Lendários: ${lend} · Épicos: ${epic}`;
        cor = lend > 0 ? '#f5a623' : epic > 0 ? '#c052ff' : '#eeddff';
    }
    UIManager.setResultadoGacha(txt, cor);
    UIManager.refreshListaInvocacao();
    UIManager.refreshBatalha();
    UIManager.refreshHUDLobby();
    UIManager.refreshPity();
});

// Inventário atualizado
EventBus.on('inventario:update', () => {
    UIManager.refreshListaInvocacao();
});

// Conquista desbloqueada
EventBus.on('conquista:desbloqueada', (c) => {
    if (BattleState.emBatalha) {
        BattleRenderer.criarTexto(`🏆 ${c.nome}!`, 'levelup', canvas);
    }
});

// ════════════════════════════════════════
//  LOOP PRINCIPAL
// ════════════════════════════════════════
let _lastFrame = 0;
const FRAME_MS = 1000 / CONFIG.TARGET_FPS;

function loop(ts) {
    requestAnimationFrame(loop);
    if (ts - _lastFrame < FRAME_MS * 0.8) return; // cap FPS
    _lastFrame = ts;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (BattleState.emBatalha) {
        BattleRenderer.render(ctx, canvas);
        UIManager.refreshBatalha();
    } else {
        LobbyRenderer.render(ctx, canvas.width, canvas.height);
    }
}

// ════════════════════════════════════════
//  INICIALIZAÇÃO
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Carrega save
    const saveData = SaveSystem.carregar();
    SaveSystem.aplicar(saveData);
    SaveSystem.offlineProgress(saveData);
    SaveSystem.autoSave();

    // Inicializa renderers
    LobbyRenderer.init(canvas);
    BattleRenderer.init(canvas);

    // UI inicial
    UIManager.refreshHUDLobby();
    UIManager.refreshListaInvocacao();
    UIManager.refreshUpgrades();

    // Inicia loop
    requestAnimationFrame(loop);

    console.log('✅ Santa Teresinha Idle — Iniciado!');
});
