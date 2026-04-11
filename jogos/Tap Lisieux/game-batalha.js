/* ═══════════════════════════════════════
   RESET & BASE
═══════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --cor-fundo:      #07060f;
    --cor-painel:     #100f26;
    --cor-painel2:    #18163a;
    --cor-borda:      #2b2858;
    --cor-acento:     #f5a623;
    --cor-acento2:    #e8416f;
    --cor-verde:      #4caf7d;
    --cor-azul:       #4a90d9;
    --cor-roxo:       #9b59b6;
    --cor-texto:      #ede9f8;
    --cor-texto2:     #8c88a8;
    --fonte-titulo:   'Cinzel', serif;
    --fonte-corpo:    'Nunito', sans-serif;
    --r:              12px;
    --sombra:         0 4px 24px rgba(0,0,0,0.6);
}

body {
    background: var(--cor-fundo);
    font-family: var(--fonte-corpo);
    color: var(--cor-texto);
    overflow: hidden;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

canvas {
    display: block;
    position: fixed;
    top: 0; left: 0;
    z-index: 0;
}

/* ═══════════════════════════════════════
   LOBBY HUD (TOPO)
═══════════════════════════════════════ */
#lobbyHUD {
    position: fixed;
    top: 0; left: 0; right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    background: linear-gradient(180deg, rgba(5,4,14,0.96) 0%, rgba(5,4,14,0.6) 100%);
    border-bottom: 1px solid var(--cor-borda);
    z-index: 80;
    backdrop-filter: blur(8px);
}

#lobbyHUDEsq { display: flex; gap: 8px; }
#lobbyMoedas { display: flex; gap: 6px; align-items: center; }

.moedaHUD {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 13px;
    font-weight: 800;
    color: var(--cor-texto);
    backdrop-filter: blur(4px);
    transition: background 0.2s;
}
.moedaHUD:hover { background: rgba(255,255,255,0.10); }

.btnTop {
    background: rgba(255,255,255,0.07);
    color: var(--cor-texto);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.15s;
    backdrop-filter: blur(4px);
}
.btnTop:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.btnTop:active { transform: translateY(1px); }

/* ═══════════════════════════════════════
   BOTÕES DO LOBBY (RODAPÉ)
═══════════════════════════════════════ */
#lobbybotoes {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    display: flex;
    gap: 12px;
    z-index: 80;
    background: linear-gradient(0deg, rgba(5,4,14,0.98) 0%, rgba(5,4,14,0.65) 100%);
    border-top: 1px solid var(--cor-borda);
    padding: 10px 20px 20px;
    justify-content: center;
}

.btnLobby {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    background: linear-gradient(160deg, #252345 0%, #181632 100%);
    color: var(--cor-texto);
    border: 1px solid var(--cor-borda);
    border-radius: 14px;
    padding: 12px 20px 10px;
    font-family: var(--fonte-corpo);
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    min-width: 88px;
    transition: all 0.15s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.btnLobby:hover  { transform: translateY(-3px); filter: brightness(1.2); }
.btnLobby:active { transform: translateY(0); }
.btnLobby .btnIcon  { font-size: 22px; }
.btnLobby .btnLabel { font-size: 11px; }

.btnLobby.gacha {
    background: linear-gradient(160deg, #3e2e00 0%, #281d00 100%);
    border-color: var(--cor-acento);
    box-shadow: 0 2px 16px rgba(245,166,35,0.22), inset 0 1px 0 rgba(255,255,255,0.07);
    color: var(--cor-acento);
}
.btnLobby.gacha:hover { box-shadow: 0 4px 24px rgba(245,166,35,0.42); }

.btnLobby.batalha {
    background: linear-gradient(160deg, #3d0b1a 0%, #250710 100%);
    border-color: var(--cor-acento2);
    box-shadow: 0 2px 16px rgba(232,65,111,0.22), inset 0 1px 0 rgba(255,255,255,0.07);
    color: var(--cor-acento2);
}
.btnLobby.batalha:hover { box-shadow: 0 4px 24px rgba(232,65,111,0.42); }

/* ═══════════════════════════════════════
   MODAIS
═══════════════════════════════════════ */
.modalOverlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.80);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    backdrop-filter: blur(4px);
}

.modalBox {
    background: linear-gradient(160deg, #15132c 0%, #0d0b22 100%);
    border: 1px solid var(--cor-borda);
    border-radius: 18px;
    padding: 22px;
    width: 92%;
    max-width: 460px;
    max-height: 88vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.75);
}
.modalBox.grande { max-width: 540px; }
.modalBox.small  { max-width: 360px; }
.modalBox::-webkit-scrollbar { width: 4px; }
.modalBox::-webkit-scrollbar-thumb { background: var(--cor-borda); border-radius: 4px; }

.modalTopo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--cor-borda);
}
.modalTopo h2 {
    font-family: var(--fonte-titulo);
    font-size: 17px;
    color: var(--cor-acento);
    letter-spacing: 1px;
}

.btnFecharModal {
    background: rgba(232,65,111,0.14);
    color: var(--cor-acento2);
    border: 1px solid rgba(232,65,111,0.38);
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.15s;
}
.btnFecharModal:hover { background: rgba(232,65,111,0.28); }

.secaoTitulo {
    color: var(--cor-acento);
    font-family: var(--fonte-titulo);
    font-size: 13px;
    letter-spacing: 1px;
    margin: 14px 0 8px;
    text-transform: uppercase;
}

.dica { color: var(--cor-texto2); font-size: 12px; margin-top: 10px; }
.configLabel { display: block; color: var(--cor-texto2); font-size: 12px; margin-bottom: 6px; margin-top: 10px; }
.slider { width: 100%; accent-color: var(--cor-acento); }

/* ═══════════════════════════════════════
   GACHA / INVOCAR
═══════════════════════════════════════ */
.taxasRaridade { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.taxa { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid; }
.taxa.comum    { background: rgba(150,150,150,0.12); border-color: #777; color: #aaa; }
.taxa.raro     { background: rgba(68,136,255,0.12);  border-color: #4488ff; color: #6ba3ff; }
.taxa.epico    { background: rgba(170,68,255,0.12);  border-color: #aa44ff; color: #c480ff; }
.taxa.lendario { background: rgba(255,170,0,0.12);   border-color: var(--cor-acento); color: var(--cor-acento); }

.resultadoInvocar {
    min-height: 28px;
    font-size: 15px;
    font-weight: 800;
    font-style: italic;
    margin-bottom: 14px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    border-left: 3px solid var(--cor-acento);
    color: var(--cor-acento);
}
.resultadoInvocar.small { font-size: 12px; min-height: 20px; padding: 5px 10px; }

.invocarBotoes { display: flex; gap: 10px; margin-bottom: 16px; }
.btnInvocar {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    background: linear-gradient(160deg, #252345 0%, #181632 100%);
    border: 1px solid var(--cor-borda);
    border-radius: 12px;
    padding: 12px 8px;
    color: var(--cor-texto);
    font-family: var(--fonte-corpo);
    font-weight: 800; font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
}
.btnInvocar .custo { font-size: 12px; color: #88eeff; }
.btnInvocar:hover { filter: brightness(1.2); transform: translateY(-2px); }
.btnInvocar.destaque {
    background: linear-gradient(160deg, #3e2e00 0%, #281d00 100%);
    border-color: var(--cor-acento);
    color: var(--cor-acento);
}
.btnInvocar.small { font-size: 12px; padding: 8px 6px; border-radius: 8px; }

.inventarioGrid { display: flex; flex-direction: column; gap: 12px; }
.inventarioSecao h4 { color: var(--cor-texto2); font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.gridItens { display: flex; flex-wrap: wrap; gap: 6px; }
.gridItens.small { gap: 4px; }

.itemTag {
    display: inline-flex; align-items: center; gap: 4px;
    border-radius: 8px; padding: 4px 10px;
    font-size: 12px; font-weight: 700; border: 1px solid;
    background: rgba(0,0,0,0.3);
    transition: transform 0.1s;
}
.itemTag:hover { transform: scale(1.05); }

/* ═══════════════════════════════════════
   PERSONAGEM / EQUIPAR CARD
═══════════════════════════════════════ */
.personagemCard {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 12px; padding: 12px;
    border: 1px solid var(--cor-borda);
    margin-bottom: 8px;
    transition: border-color 0.2s;
}
.personagemCard.ativo { border-color: var(--cor-acento); }
.personagemIcone { font-size: 38px; width: 52px; text-align: center; }
.personagemInfo { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.personagemInfo b { font-size: 14px; }
.personagemInfo small { color: var(--cor-texto2); font-size: 12px; }
.badge { background: var(--cor-acento); color: #000; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; }

/* ═══════════════════════════════════════
   UI DE BATALHA  ─ Estilo Tap Titans 2
═══════════════════════════════════════ */
#uiBatalha {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    z-index: 200;
    display: flex;
    flex-direction: column;
    pointer-events: none;
}
#uiBatalha button,
#batalhaNavTopo,
#painelInferior,
#statsRapidos,
#btnSairBatalha { pointer-events: auto; }

/* ── NAV TOPO ─ estágio + setas + chefe ── */
#batalhaNavTopo {
    position: absolute;
    top: 0; left: 0; right: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px 6px;
    background: linear-gradient(180deg, rgba(5,4,14,0.97) 0%, rgba(5,4,14,0.0) 100%);
    pointer-events: auto;
}

.navBtn {
    background: rgba(255,255,255,0.07);
    border: 1px solid var(--cor-borda);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 16px;
    color: var(--cor-texto2);
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--fonte-corpo);
}
.navBtn:hover { background: rgba(255,255,255,0.13); color: var(--cor-texto); }
.navBtn:active { transform: scale(0.95); }

#estagioInfo { flex: 1; text-align: center; line-height: 1; }
#estagioNum {
    font-family: var(--fonte-titulo);
    font-size: 24px;
    font-weight: 900;
    color: var(--cor-acento);
    text-shadow: 0 0 16px rgba(245,166,35,0.55);
    line-height: 1;
}
#estagioNome {
    font-size: 11px;
    color: var(--cor-texto2);
    letter-spacing: 0.5px;
    margin-top: 1px;
}

#btnEnfrentarChefe {
    background: linear-gradient(135deg, #b03020, #7a1508);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    font-family: var(--fonte-corpo);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(180,50,30,0.55);
    transition: all 0.15s;
    white-space: nowrap;
}
#btnEnfrentarChefe:hover { filter: brightness(1.2); transform: scale(1.04); }

/* ── BARRA HP INIMIGO ── */
#hpAreaBatalha {
    position: absolute;
    top: 56px; left: 50%;
    transform: translateX(-50%);
    width: 60%;
    min-width: 270px;
    max-width: 480px;
    pointer-events: none;
}

#hpNomeRow {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
}
#nomeInimigo {
    font-weight: 800;
    font-size: 13px;
    color: #ffcccc;
    text-shadow: 0 0 12px rgba(255,100,100,0.65);
}
#hpNumero { font-size: 12px; color: var(--cor-texto2); font-weight: 700; }

#hpBarraContainer {
    position: relative;
    width: 100%;
    height: 16px;
    background: rgba(0,0,0,0.55);
    border-radius: 20px;
    border: 1px solid rgba(255,100,100,0.30);
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
#hpInimigo {
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #a02020 0%, #d43535 45%, #ff5858 100%);
    border-radius: 20px;
    transition: width 0.18s ease-out;
}
#hpBrilho {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 42%;
    background: rgba(255,255,255,0.18);
    border-radius: 20px 20px 0 0;
    pointer-events: none;
}

/* ── MOEDA CENTRO (TT2) ── */
#moedaCentro {
    position: absolute;
    top: 106px; left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 28px;
    font-weight: 900;
    color: var(--cor-acento);
    text-shadow: 0 2px 12px rgba(245,166,35,0.65);
    font-family: var(--fonte-titulo);
    pointer-events: none;
    white-space: nowrap;
}
#moedaCentroIcon { font-size: 22px; }

/* ── FALA DO MONSTRO ── */
#falaInimigo {
    position: absolute;
    top: 150px; left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s;
    z-index: 10;
}
#falaInimigo.visivel { opacity: 1; }
#falaTexto {
    background: rgba(18,4,4,0.94);
    border: 1px solid rgba(255,70,70,0.45);
    border-radius: 14px;
    padding: 8px 18px;
    font-size: 13px;
    color: #ffbbbb;
    font-style: italic;
    max-width: 72vw;
    white-space: normal;
    text-align: center;
    box-shadow: 0 4px 20px rgba(255,50,50,0.2);
}

/* ── PAINEL INFERIOR ─ idêntico ao TT2 ── */
#painelInferior {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    display: flex;
    flex-direction: column;
}

/* Barra de stats rápidos */
#statsRapidos {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    background: rgba(5,4,14,0.95);
    border-top: 1px solid var(--cor-borda);
    font-size: 12px;
    font-weight: 700;
    gap: 8px;
}
#danoTaqueUI   { color: var(--cor-acento); }
#moedaUIBatalha{ color: #ffd070; }
#gemaUIBatalha { color: #88eeff; }

/* Abas rodapé */
#abaRodape {
    display: flex;
    background: rgba(5,4,14,0.98);
    border-top: 1px solid var(--cor-borda);
}
.abaRodapeBtn {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 8px 4px 6px;
    background: transparent;
    border: none;
    border-top: 3px solid transparent;
    color: var(--cor-texto2);
    font-family: var(--fonte-corpo);
    font-size: 10px; font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}
.abaRodapeBtn .abaIcon { font-size: 18px; }
.abaRodapeBtn:hover { color: var(--cor-texto); background: rgba(255,255,255,0.03); }
.abaRodapeBtn.ativa {
    color: var(--cor-acento);
    border-top-color: var(--cor-acento);
    background: rgba(245,166,35,0.05);
}

/* Conteúdo da aba */
#abaConteudo {
    background: rgba(5,4,14,0.98);
    border-top: 1px solid var(--cor-borda);
    overflow-y: auto;
    max-height: 240px;
    transition: max-height 0.3s ease;
}
#abaConteudo.minimizado { max-height: 0; overflow: hidden; }
#abaConteudo::-webkit-scrollbar { width: 3px; }
#abaConteudo::-webkit-scrollbar-thumb { background: var(--cor-borda); border-radius: 3px; }

.abaPanel { padding: 10px 14px 12px; }
.upgradeScroll { display: flex; flex-direction: column; gap: 6px; }

/* Item de upgrade */
.upgradeItem {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.055);
    border-radius: 10px;
    padding: 8px 12px;
    transition: background 0.15s;
}
.upgradeItem:hover { background: rgba(255,255,255,0.05); }
.upIcone { font-size: 22px; width: 28px; text-align: center; }
.upInfo  { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.upNome  { font-size: 13px; font-weight: 800; color: var(--cor-texto); }
.upDesc  { font-size: 11px; color: var(--cor-texto2); }

.btnUp {
    background: linear-gradient(135deg, #1e5c1e, #0e3a0e);
    color: #70e870;
    border: 1px solid #2e7a2e;
    border-radius: 8px;
    padding: 6px 14px;
    font-family: var(--fonte-corpo);
    font-size: 12px; font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    min-width: 80px; text-align: center;
    transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.btnUp:hover    { filter: brightness(1.25); transform: scale(1.04); }
.btnUp:active   { transform: scale(0.98); }
.btnUp:disabled { background: #1a1a28; color: #555; border-color: #333; cursor: not-allowed; transform: none; filter: none; }

/* Prestigiar */
.prestigiarBox {
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, rgba(36,26,4,0.85), rgba(22,15,2,0.85));
    border: 1px solid rgba(245,166,35,0.28);
    border-radius: 10px;
    padding: 10px 12px;
    margin-top: 6px;
}
.prestigiarInfo { flex: 1; }
.prestigiarInfo b     { font-size: 13px; color: var(--cor-acento); }
.prestigiarInfo small { display: block; font-size: 11px; color: var(--cor-texto2); margin-top: 3px; }
.btnPrestigiar {
    background: var(--cor-acento); color: #000;
    border: none; border-radius: 8px;
    padding: 8px 14px;
    font-family: var(--fonte-corpo); font-size: 12px; font-weight: 800;
    cursor: pointer; white-space: nowrap;
    transition: all 0.15s;
}
.btnPrestigiar:hover:not(:disabled) { filter: brightness(1.15); }
.btnPrestigiar:disabled { background: #333; color: #888; cursor: not-allowed; }

/* Botão minimizar */
#btnMinimizar {
    position: absolute;
    top: -30px; right: 12px;
    background: rgba(5,4,14,0.96);
    border: 1px solid var(--cor-borda);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    color: var(--cor-texto2);
    padding: 4px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}
#btnMinimizar:hover { color: var(--cor-texto); background: rgba(255,255,255,0.05); }

/* Sair da batalha */
#btnSairBatalha {
    position: absolute;
    top: 9px; right: 12px;
    background: rgba(180,45,35,0.16);
    color: #ff7070;
    border: 1px solid rgba(180,45,35,0.42);
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px; font-weight: 800;
    cursor: pointer;
    transition: all 0.15s;
    pointer-events: auto;
}
#btnSairBatalha:hover { background: rgba(180,45,35,0.32); color: #fff; }

/* ═══════════════════════════════════════
   CARDS PÁGINA PRINCIPAL (mantido)
═══════════════════════════════════════ */
.jogos-list{display:flex;flex-direction:column;gap:30px;}
.jogo-card-horizontal{display:flex;background:linear-gradient(145deg,#fff,#f7f7f7);border-radius:16px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,.15);transition:transform .3s,box-shadow .3s;}
.jogo-card-horizontal:hover{transform:translateY(-5px);box-shadow:0 15px 35px rgba(0,0,0,.25);}
.jogo-card-horizontal .jogo-thumb{flex:0 0 180px;}
.jogo-card-horizontal .jogo-thumb img{width:100%;height:100%;object-fit:cover;}
.jogo-card-horizontal .jogo-info{padding:20px 25px;flex:1;display:flex;flex-direction:column;justify-content:space-between;}
.jogo-card-horizontal .jogo-info h3{font-family:'Libre Baskerville',serif;font-size:1.6rem;margin-bottom:8px;color:#2c1f17;}
.jogo-card-horizontal .jogo-info p{font-size:1rem;color:#555;margin-bottom:20px;line-height:1.4;}
.jogo-card-horizontal .btn-jogar{align-self:flex-start;text-decoration:none;font-weight:600;background:#f44336;color:white;padding:10px 20px;border-radius:8px;transition:background .3s,transform .2s;}
.jogo-card-horizontal .btn-jogar:hover{background:#d32f2f;transform:translateY(-2px);}
@media(max-width:768px){.jogo-card-horizontal{flex-direction:column;}.jogo-card-horizontal .jogo-thumb{width:100%;height:200px;}.jogo-card-horizontal .jogo-info{padding:15px 20px;}}
