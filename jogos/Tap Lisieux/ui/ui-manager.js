// ═══════════════════════════════════════════════════════════
//  UI.JS — HUDs, modais, abas, upgrades (tudo HTML/CSS)
// ═══════════════════════════════════════════════════════════
"use strict";

const UIManager = (() => {

    const uiThrottle = makeThrottle(CONFIG.UI_THROTTLE_MS);

    // ════════════════════════════════════════
    //  HUD LOBBY
    // ════════════════════════════════════════
    function refreshHUDLobby() {
        DOM.txt('hudMoedaVal', fmtNum(Economy.moeda));
        DOM.txt('hudGemaVal',  fmtNum(Economy.gema));
        DOM.txt('hudEnergiaVal', `${Energia.atual}/${Energia.max}`);
    }

    // ════════════════════════════════════════
    //  HUD BATALHA
    // ════════════════════════════════════════
    function refreshBatalha() {
        if (!BattleState.emBatalha || !uiThrottle.ok()) return;

        const ini  = BattleState.inimigo;
        const hp   = Math.max(0, ini.hp);
        const pct  = ini.maxHp > 0 ? clamp((hp / ini.maxHp) * 100, 0, 100) : 0;

        DOM.style('hpInimigo', 'width', pct + '%');
        // Cor da barra por HP
        const cor = pct > 50 ? 'linear-gradient(90deg,#a02020 0%,#d43535 45%,#ff5858 100%)'
                  : pct > 25 ? 'linear-gradient(90deg,#a06020 0%,#d48535 45%,#ff9958 100%)'
                  :             'linear-gradient(90deg,#a0a020 0%,#d4c535 45%,#ffee58 100%)';
        DOM.style('hpInimigo', 'background', cor);

        DOM.txt('nomeInimigo',   ini.nome);
        DOM.txt('hpNumero',      `${fmtNum(hp)} / ${fmtNum(ini.maxHp)}`);
        DOM.txt('estagioNum',    String(BattleState.estagio));
        DOM.txt('estagioNome',   getNomeEstagio(BattleState.estagio));
        DOM.txt('moedaCentroVal',fmtNum(Economy.moeda));
        DOM.txt('danoTaqueUI',   `👆 ${fmtNum(Upgrades.calcDanoClick())} Dano de Toque`);
        DOM.txt('moedaUIBatalha',`🪙 ${fmtNum(Economy.moeda)}`);
        DOM.txt('gemaUIBatalha', `💎 ${fmtNum(Economy.gema)}`);

        // Level Santa
        document.querySelectorAll('[data-santa-lv]').forEach(el => {
            el.textContent = Personagem.nivel;
        });

        refreshUpgrades();
        refreshHUDLobby();
        _refreshPrestigiar();
    }

    // ════════════════════════════════════════
    //  UPGRADES
    // ════════════════════════════════════════
    function refreshUpgrades() {
        const u = Upgrades;

        DOM.txt('forcaDesc',   `Nv.${u.all.forca.nivel} · +${fmtNum(u.dano('forca'))} dano/toque`);
        DOM.txt('rosaDesc',    `Nv.${u.all.rosa.nivel} · +${fmtNum(u.dano('rosa'))} dano/toque`);
        DOM.txt('velDesc',     `Nv.${u.all.velocidade.nivel} · x${u.bonus('velocidade').toFixed(2)} velocidade`);
        DOM.txt('dpsDesc',     `Nv.${u.all.dps.nivel} · +${fmtNum(u.dano('dps'))} DPS`);
        DOM.txt('criticoDesc', `Nv.${u.all.critico.nivel} · ${(u.bonus('critico')*100).toFixed(1)}% crítico`);
        DOM.txt('multiDesc',   `Nv.${u.all.multi.nivel} · x${(1+u.bonus('multi')).toFixed(2)} multiplicador`);

        const botoesUp = [
            { id:'btnForca',      tipo:'forca'      },
            { id:'btnRosa',       tipo:'rosa'       },
            { id:'btnVelocidade', tipo:'velocidade' },
            { id:'btnDps',        tipo:'dps'        },
            { id:'btnCritico',    tipo:'critico'    },
            { id:'btnMulti',      tipo:'multi'      },
        ];

        botoesUp.forEach(({ id, tipo }) => {
            const btn  = DOM.get(id);
            if (!btn)  return;
            const c    = u.custo(tipo);
            const pode = Economy.moeda >= c;
            btn.textContent    = `🪙 ${fmtNum(c)}`;
            btn.disabled       = !pode;
            btn.style.boxShadow = pode ? '0 0 10px rgba(255,215,0,0.5)' : 'none';
        });
    }

    function _refreshPrestigiar() {
        const btn = DOM.get('btnPrestigiar');
        if (!btn) return;
        const ok = BattleState.estagio >= CONFIG.ESTAGIO_PRESTIGIO;
        btn.disabled    = !ok;
        btn.textContent = ok ? '🌟 Prestigiar!' : `Alcance o Est. ${CONFIG.ESTAGIO_PRESTIGIO}`;
    }

    // ════════════════════════════════════════
    //  ABAS
    // ════════════════════════════════════════
    const ABAS_IDS = ['abaUpgrades','abaHerois','abaArmas','abaInvocacao','abaConquistas'];
    let _abaAtual  = 'upgrades';

    function abrirAba(nome, btn) {
        _abaAtual = nome;
        ABAS_IDS.forEach(id => {
            const el = DOM.get(id);
            if (el) el.style.display = 'none';
        });
        const id    = 'aba' + nome.charAt(0).toUpperCase() + nome.slice(1);
        const alvo  = DOM.get(id);
        if (alvo) alvo.style.display = 'block';

        document.querySelectorAll('.abaRodapeBtn').forEach(b => b.classList.remove('ativa'));
        if (btn) btn.classList.add('ativa');

        // Atualiza conteúdo da aba aberta
        if      (nome === 'armas')      refreshArmasBatalha();
        else if (nome === 'herois')     refreshHeroisBatalha();
        else if (nome === 'invocacao')  refreshPity();
        else if (nome === 'conquistas') refreshConquistas();
    }

    // ════════════════════════════════════════
    //  HELPERS DE CARD / TAG
    // ════════════════════════════════════════
    function _itemTag(item) {
        const c     = RARIDADE_COR[item.raridade] ?? RARIDADE_COR['Comum'];
        const extra = item.dano ? ` +${fmtNum(item.dano)}` : (item.bonus ? ` ${item.bonus}` : '');
        const nome  = item.nome.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `<span class="itemTag" style="border-color:${c.hex};color:${c.hex};box-shadow:0 0 8px ${c.glow};background:${c.bg}">${item.emoji} ${nome}${extra}</span>`;
    }

    function _itemCard(item, equipBtn = false) {
        const c    = RARIDADE_COR[item.raridade] ?? RARIDADE_COR['Comum'];
        const dano = item.dano ? `+${fmtNum(item.dano)} dano` : (item.bonus ?? (item.arma ?? ''));
        const nome = item.nome.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const equip = Inventario.equipado?.nome === item.nome;
        const btn  = equipBtn
            ? `<button class="btnUp ${equip ? 'equipado' : ''}" onclick="UIManager.equiparItem('${item.nome}')">${equip ? '✅ Equipado' : 'Equipar'}</button>`
            : '';
        return `
        <div class="upgradeItem" style="border-color:${c.hex}44;margin-bottom:6px;">
            <div class="upIcone">${item.emoji}</div>
            <div class="upInfo">
                <span class="upNome" style="color:${c.hex}">${nome}</span>
                <span class="upDesc">${item.raridade} · ${dano}</span>
            </div>
            ${btn}
        </div>`;
    }

    // ════════════════════════════════════════
    //  LISTAS
    // ════════════════════════════════════════
    function refreshListaInvocacao() {
        const lh = DOM.get('listaHerois');
        const le = DOM.get('listaEquipamentos');
        if (lh) lh.innerHTML = Inventario.herois.length
            ? Inventario.herois.map(_itemTag).join('')
            : "<p class='dica'>Nenhum herói. Invoque para obter!</p>";
        if (le) le.innerHTML = Inventario.armas.length
            ? Inventario.armas.map(_itemTag).join('')
            : "<p class='dica'>Nenhuma arma. Invoque para obter!</p>";
    }

    function refreshHeroisBatalha() {
        const el = DOM.get('listaHeroisBatalha2');
        if (!el) return;
        const todos = [...Inventario.herois, ...Inventario.armas];
        el.innerHTML = todos.length
            ? todos.map(_itemTag).join('')
            : "<p class='dica'>Nenhum item. Invoque!</p>";
    }

    function refreshArmasBatalha() {
        const el = DOM.get('listaArmasBatalha');
        if (!el) return;
        el.innerHTML = Inventario.armas.length
            ? Inventario.armas.map(_itemTag).join('')
            : "<p class='dica'>Nenhuma arma ainda.</p>";
    }

    function refreshListaEquipar() {
        const el = DOM.get('listaEquipamentosEquipar');
        if (!el) return;
        if (!Inventario.armas.length) {
            el.innerHTML = "<p class='dica'>Nenhuma arma obtida ainda. Invoque para obter!</p>";
            return;
        }
        const ord = [...Inventario.armas].sort((a, b) => (b.dano ?? 0) - (a.dano ?? 0));
        el.innerHTML = ord.map(a => _itemCard(a, true)).join('');
    }

    function refreshPity() {
        const el = DOM.get('pityInfo');
        if (!el) return;
        const faltam = GachaSystem.pullsAteLend();
        el.textContent = `🎯 Pity: ${GachaSystem.pityAtual}/${CONFIG.PITY_MAX} · Lendário em ${faltam} pulls`;
    }

    function refreshConquistas() {
        const el = DOM.get('listaConquistas');
        if (!el) return;
        el.innerHTML = CONQUISTAS_DEF.map(c => {
            const ok = conquistasDesbloqueadas.has(c.id);
            const rTxt = c.recompensa.gema ? `💎${c.recompensa.gema}` : `🪙${fmtNum(c.recompensa.moeda ?? 0)}`;
            return `
            <div class="upgradeItem" style="opacity:${ok ? 1 : 0.45};">
                <div class="upIcone">${ok ? c.emoji : '🔒'}</div>
                <div class="upInfo">
                    <span class="upNome">${c.nome}</span>
                    <span class="upDesc">${c.desc} · ${rTxt}</span>
                </div>
                ${ok ? '<span style="color:#44ff88;font-size:17px">✅</span>' : ''}
            </div>`;
        }).join('');
    }

    // ════════════════════════════════════════
    //  RESULTADO GACHA
    // ════════════════════════════════════════
    function setResultadoGacha(txt, cor) {
        ['invocarResultado','invocarResultado2'].forEach(id => {
            const el = DOM.get(id);
            if (!el) return;
            el.textContent = txt;
            el.style.color = cor;
            el.style.borderLeftColor = cor;
        });
    }

    // ════════════════════════════════════════
    //  MINIMIZAR PAINEL
    // ════════════════════════════════════════
    let _painelMin = false;

    function togglePainel() {
        _painelMin = !_painelMin;
        DOM.cls('abaConteudo', 'minimizado', _painelMin);
        DOM.txt('btnMinimizar', _painelMin ? '▲' : '▼');
        DOM.style('abaRodape', 'display', _painelMin ? 'none' : 'flex');
    }

    // ════════════════════════════════════════
    //  MODAIS
    // ════════════════════════════════════════
    function abrirModal(id, fn) {
        const el = DOM.get(id);
        if (el) { el.style.display = 'flex'; fn?.(); }
    }

    function fecharModal(id) {
        const el = DOM.get(id);
        if (el) el.style.display = 'none';
    }

    function fecharSeForaModal(e, id) {
        if (e.target.id === id) fecharModal(id);
    }

    // ════════════════════════════════════════
    //  BATALHA: MOSTRAR / OCULTAR
    // ════════════════════════════════════════
    function entrarBatalha() {
        DOM.show('uiBatalha', 'flex');
        DOM.hide('lobbyHUD');
        DOM.hide('lobbybotoes');
    }

    function sairBatalha() {
        DOM.hide('uiBatalha');
        DOM.show('lobbyHUD', 'flex');
        DOM.show('lobbybotoes', 'flex');
    }

    function equiparItem(nomeItem) {
        if (Inventario.equipar(nomeItem)) {
            const item = Inventario.equipado;
            ToastSystem.mostrar(`✅ ${item.emoji} ${item.nome} equipado!`, 'sucesso');
            fecharModal('modalEquipar');
            refreshBatalha();
        }
    }

    // ════════════════════════════════════════
    //  FALA DO MONSTRO
    // ════════════════════════════════════════
    let _timerFala = null, _falaAtiva = false;

    function exibirFala(nomeBase) {
        const txt = getFalaMonstro(nomeBase);
        const el  = DOM.get('falaInimigo');
        const tel = DOM.get('falaTexto');
        if (!el || !tel) return;
        tel.innerText = `"${txt}"`;
        el.classList.add('visivel');
        _falaAtiva = true;
        if (_timerFala) clearTimeout(_timerFala);
        _timerFala = setTimeout(() => {
            el.classList.remove('visivel');
            _falaAtiva = false;
        }, CONFIG.FALA_DURACAO_MS);
    }

    setInterval(() => {
        if (!BattleState.emBatalha || _falaAtiva) return;
        if (Math.random() < CONFIG.FALA_CHANCE) {
            exibirFala(tiposMonstros[getNomeMonstro(BattleState.estagio)].nome);
        }
    }, CONFIG.FALA_INTERVAL_MS);

    return {
        refreshHUDLobby,
        refreshBatalha,
        refreshUpgrades,
        refreshListaInvocacao,
        refreshListaEquipar,
        refreshPity,
        refreshConquistas,
        setResultadoGacha,
        abrirAba,
        togglePainel,
        abrirModal,
        fecharModal,
        fecharSeForaModal,
        entrarBatalha,
        sairBatalha,
        equiparItem,
        exibirFala,
    };
})();
