// ═══════════════════════════════════════════════════════
//  UI-BATTLE.JS
//  Atualiza a UI da batalha:
//  - Barra de HP animada com lerp + cor dinâmica + gloss
//  - Nome, nível e tipo do inimigo com transição
//  - Estágio atual com nome do local
//  - Fala do monstro com typewriter + fila de falas
//  - Dano de toque e DPS atualizados
//  - Botão de prestigiar com countdown e brilho
//  - Navegação de estágio com feedback de cooldown
//  - Combo multiplier exibido
//
//  Depende de: dom-cache.js, event-bus.js, state.js
//  Usado por: battle.js (via EventBus)
// ═══════════════════════════════════════════════════════

"use strict";

const UIBattle = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIBattle"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        // Throttle
        THROTTLE_HP_MS      : 50,    // 20x/s — HP muda muito
        THROTTLE_INFO_MS    : 200,   // 5x/s  — nome/estágio
        THROTTLE_DANO_MS    : 300,   // 3x/s  — dano de toque

        // HP bar
        HP_LERP_SPEED       : 0.10,  // suavização por frame
        HP_CRITICO_PCT      : 0.25,  // abaixo = vermelho pulsante
        HP_AVISO_PCT        : 0.50,  // abaixo = laranja

        // Fala
        FALA_TYPEWRITER_MS  : 28,    // ms por caractere
        FALA_DURACAO_MS     : 3500,  // tempo visível após completar
        FALA_FILA_MAX       : 3,     // máximo de falas na fila

        // Prestígio
        PRESTIGIO_ESTAGIO   : 60,

        // Combo
        COMBO_MOSTRAR_MIN   : 2,     // só exibe a partir do combo X

        // Animações
        NOME_ANIM_DURACAO   : 300,   // ms de fade ao trocar inimigo
        ESTAGIO_ANIM_DURACAO: 250,
    });

    // ════════════════════════════════════════════════════
    // CSS — injetado uma única vez
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_battle_css__")) return;

        const s = document.createElement("style");
        s.id = "__ui_battle_css__";
        s.textContent = `
            /* ── HP Bar ── */
            .__hp_fill__ {
                height          : 100%;
                border-radius   : inherit;
                transition      : none; /* controlado por lerp no JS */
                will-change     : width, background;
                position        : relative;
                overflow        : hidden;
            }
            .__hp_fill__::after {
                content         : "";
                position        : absolute;
                inset           : 0;
                background      : linear-gradient(180deg,
                    rgba(255,255,255,0.22) 0%,
                    rgba(255,255,255,0.00) 55%);
                border-radius   : inherit;
                pointer-events  : none;
            }
            .__hp_critico__ {
                animation       : __hp_pulso__ 0.7s ease-in-out infinite alternate;
            }
            @keyframes __hp_pulso__ {
                from { filter: brightness(1);   }
                to   { filter: brightness(1.5); }
            }

            /* ── Nome do inimigo ── */
            .__inimigo_nome__ {
                transition      : opacity ${CFG.NOME_ANIM_DURACAO}ms ease,
                                  transform ${CFG.NOME_ANIM_DURACAO}ms ease;
                will-change     : opacity, transform;
            }
            .__inimigo_nome__.saindo {
                opacity         : 0;
                transform       : translateY(-6px);
            }
            .__inimigo_nome__.entrando {
                opacity         : 0;
                transform       : translateY(6px);
            }

            /* ── Estágio ── */
            .__estagio_num__ {
                transition      : opacity ${CFG.ESTAGIO_ANIM_DURACAO}ms ease,
                                  transform ${CFG.ESTAGIO_ANIM_DURACAO}ms ease;
                will-change     : opacity, transform;
            }
            .__estagio_num__.saindo {
                opacity         : 0;
                transform       : translateX(-8px);
            }

            /* ── Fala do monstro ── */
            .__fala_balao__ {
                transition      : opacity 0.25s ease, transform 0.25s ease;
                will-change     : opacity, transform;
            }
            .__fala_balao__.oculta {
                opacity         : 0;
                transform       : translateY(6px) scale(0.97);
                pointer-events  : none;
            }
            .__fala_cursor__ {
                display         : inline-block;
                width           : 2px;
                height           : 1em;
                background      : currentColor;
                margin-left     : 2px;
                vertical-align  : text-bottom;
                animation       : __cursor_pisca__ 0.5s step-end infinite;
            }
            @keyframes __cursor_pisca__ {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0; }
            }

            /* ── Prestígio ── */
            .__btn_prestigio_pronto__ {
                animation       : __prestigio_brilho__ 1.2s ease-in-out infinite alternate;
            }
            @keyframes __prestigio_brilho__ {
                from { box-shadow: 0 0  8px rgba(255,215,0,0.4); }
                to   { box-shadow: 0 0 22px rgba(255,215,0,0.9); }
            }

            /* ── Combo ── */
            .__combo_display__ {
                transition      : opacity 0.2s ease, transform 0.2s ease;
                will-change     : opacity, transform;
            }
            .__combo_display__.oculto {
                opacity         : 0;
                transform       : scale(0.8);
            }
            .__combo_pop__ {
                animation       : __combo_pop_anim__ 0.25s cubic-bezier(.34,1.5,.64,1);
            }
            @keyframes __combo_pop_anim__ {
                from { transform: scale(1.4); }
                to   { transform: scale(1);   }
            }

            /* ── Chefe badge ── */
            .__chefe_badge__ {
                animation       : __chefe_pulse__ 0.9s ease-in-out infinite alternate;
            }
            @keyframes __chefe_pulse__ {
                from { filter: drop-shadow(0 0 4px #ffd700); }
                to   { filter: drop-shadow(0 0 12px #ff8c00); }
            }
        `;
        document.head.appendChild(s);
    }

    // ════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════
    function _el(id) {
        try   { return DOM.get(id); }
        catch { return document.getElementById(id); }
    }

    function _set(id, txt) {
        const el = _el(id);
        if (el) el.textContent = txt;
    }

    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
            if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
            if (n >= 1e3) return (n/1e3).toFixed(1)+"K";
            return String(Math.floor(n));
        }
    }

    function _estado(chave, fb = 0) {
        try   { return GameState.get(chave) ?? fb; }
        catch { return fb; }
    }

    // ════════════════════════════════════════════════════
    // THROTTLE
    // ════════════════════════════════════════════════════
    const _ultima = { hp: 0, info: 0, dano: 0 };

    function _pode(chave, ms) {
        const agora = performance.now();
        if (agora - _ultima[chave] >= ms) {
            _ultima[chave] = agora;
            return true;
        }
        return false;
    }

    // ════════════════════════════════════════════════════
    // HP BAR — lerp suave + cor dinâmica
    // ════════════════════════════════════════════════════
    const _hpBar = {
        pctAtual  : 1.0,
        pctAlvo   : 1.0,
        fillEl    : null,
        numEl     : null,
        hpMax     : 0,
        hpValor   : 0,
    };

    function _garantirHpBar() {
        _hpBar.fillEl = _hpBar.fillEl ?? _el("hpInimigo");
        _hpBar.numEl  = _hpBar.numEl  ?? _el("hpNumero");

        if (_hpBar.fillEl) {
            _hpBar.fillEl.classList.add("__hp_fill__");
        }
    }

    function _tickHpBar() {
        if (!_hpBar.fillEl) return;

        // Lerp suave
        _hpBar.pctAtual += (_hpBar.pctAlvo - _hpBar.pctAtual) * CFG.HP_LERP_SPEED;
        const pct = Math.max(0, Math.min(1, _hpBar.pctAtual));

        // Largura
        _hpBar.fillEl.style.width = (pct * 100).toFixed(2) + "%";

        // Cor dinâmica — verde → laranja → vermelho
        let cor;
        if      (pct > CFG.HP_AVISO_PCT)   cor = `hsl(${Math.round(pct * 110)}, 80%, 42%)`;
        else if (pct > CFG.HP_CRITICO_PCT)  cor = "#e07820";
        else                                cor = "#cc2222";

        _hpBar.fillEl.style.background = cor;

        // Pulso ao crítico
        if (pct <= CFG.HP_CRITICO_PCT) {
            _hpBar.fillEl.classList.add("__hp_critico__");
        } else {
            _hpBar.fillEl.classList.remove("__hp_critico__");
        }

        // Número HP — só atualiza se throttle ok
        if (_pode("hp", CFG.THROTTLE_HP_MS) && _hpBar.numEl) {
            const hpAtual = Math.max(0, Math.round(_hpBar.hpValor));
            _hpBar.numEl.textContent =
                `${_fmt(hpAtual)} / ${_fmt(_hpBar.hpMax)}`;
        }
    }

    function _setHP(hp, maxHp) {
        _hpBar.hpValor = hp;
        _hpBar.hpMax   = maxHp;
        _hpBar.pctAlvo = maxHp > 0 ? Math.max(0, hp / maxHp) : 0;
    }

    // ════════════════════════════════════════════════════
    // NOME DO INIMIGO — com transição de fade
    // ════════════════════════════════════════════════════
    const _nomeState = {
        atual    : "",
        el       : null,
        chefeBadge: null,
    };

    function _garantirNome() {
        if (_nomeState.el) return;
        _nomeState.el = _el("nomeInimigo");
        if (_nomeState.el) _nomeState.el.classList.add("__inimigo_nome__");
    }

    function _animarNome(novoNome, chefe = false) {
        _garantirNome();
        const el = _nomeState.el;
        if (!el) { return; }
        if (_nomeState.atual === novoNome) return;

        // Fase 1: saindo
        el.classList.add("saindo");

        setTimeout(() => {
            el.textContent   = novoNome;
            _nomeState.atual = novoNome;

            // Badge de chefe
            if (chefe) {
                el.insertAdjacentHTML("afterend",
                    `<span class="__chefe_badge__" aria-label="Chefe"> 👑</span>`
                );
            } else {
                el.parentElement?.querySelector(".__chefe_badge__")?.remove();
            }

            // Fase 2: entrando
            el.classList.remove("saindo");
            el.classList.add("entrando");

            requestAnimationFrame(() => {
                requestAnimationFrame(() => el.classList.remove("entrando"));
            });

        }, CFG.NOME_ANIM_DURACAO);
    }

    // ════════════════════════════════════════════════════
    // ESTÁGIO — número e nome do local
    // ════════════════════════════════════════════════════
    const _estagioState = {
        atual : 0,
        numEl : null,
        nomeEl: null,
    };

    function _garantirEstagio() {
        _estagioState.numEl  = _estagioState.numEl  ?? _el("estagioNum");
        _estagioState.nomeEl = _estagioState.nomeEl ?? _el("estagioNome");

        if (_estagioState.numEl) {
            _estagioState.numEl.classList.add("__estagio_num__");
        }
    }

    function _animarEstagio(novoEstagio, nomeLocal) {
        _garantirEstagio();
        if (_estagioState.atual === novoEstagio) return;
        _estagioState.atual = novoEstagio;

        const numEl  = _estagioState.numEl;
        const nomeEl = _estagioState.nomeEl;

        if (numEl) {
            numEl.classList.add("saindo");
            setTimeout(() => {
                numEl.textContent = String(novoEstagio);
                numEl.classList.remove("saindo");
            }, CFG.ESTAGIO_ANIM_DURACAO);
        }

        if (nomeEl) nomeEl.textContent = nomeLocal ?? "";
    }

    // ════════════════════════════════════════════════════
    // FALA DO MONSTRO — typewriter + fila
    // ════════════════════════════════════════════════════
    const _fala = {
        fila        : [],
        ativa       : false,
        timerTW     : null,   // typewriter
        timerSaida  : null,   // timer de saída
        balaoEl     : null,
        textoEl     : null,
        cursorEl    : null,
    };

    function _garantirFala() {
        _fala.balaoEl = _fala.balaoEl ?? _el("falaInimigo");
        _fala.textoEl = _fala.textoEl ?? _el("falaTexto");

        if (_fala.balaoEl) _fala.balaoEl.classList.add("__fala_balao__", "oculta");

        // Adiciona cursor piscante se não existe
        if (_fala.textoEl && !_fala.textoEl.querySelector(".__fala_cursor__")) {
            _fala.cursorEl = document.createElement("span");
            _fala.cursorEl.className  = "__fala_cursor__";
            _fala.cursorEl.setAttribute("aria-hidden", "true");
            _fala.textoEl.appendChild(_fala.cursorEl);
        }
    }

    /**
     * Enfileira uma fala para exibição.
     * Se o monstro já está falando, a fala vai para a fila.
     */
    function exibirFala(texto) {
        _garantirFala();
        if (!texto) return;

        // Descarta se a fila já está cheia
        if (_fala.fila.length >= CFG.FALA_FILA_MAX) return;

        _fala.fila.push(texto);
        if (!_fala.ativa) _processarFila();
    }

    function _processarFila() {
        if (_fala.fila.length === 0) {
            _ocultarFala();
            return;
        }

        const texto = _fala.fila.shift();
        _fala.ativa = true;
        _mostrarFalaTypewriter(texto);
    }

    function _mostrarFalaTypewriter(texto) {
        const { balaoEl, textoEl, cursorEl } = _fala;
        if (!balaoEl || !textoEl) return;

        // Limpa estado anterior
        clearTimeout(_fala.timerTW);
        clearTimeout(_fala.timerSaida);

        // Escapa texto
        const seguro = String(texto)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;");

        textoEl.textContent = "";
        if (cursorEl) textoEl.appendChild(cursorEl);

        // Mostra balão
        balaoEl.classList.remove("oculta");

        // Typewriter
        let i = 0;
        const chars = [...seguro];   // suporte a emoji (unicode)

        function escrever() {
            if (i < chars.length) {
                // Insere antes do cursor
                const nó = document.createTextNode(chars[i]);
                textoEl.insertBefore(nó, cursorEl ?? null);
                i++;
                _fala.timerTW = setTimeout(escrever, CFG.FALA_TYPEWRITER_MS);
            } else {
                // Typewriter concluído — agenda saída
                if (cursorEl) cursorEl.style.display = "none";
                _fala.timerSaida = setTimeout(() => {
                    if (cursorEl) cursorEl.style.display = "";
                    _ocultarFala(() => {
                        _fala.ativa = false;
                        _processarFila();
                    });
                }, CFG.FALA_DURACAO_MS);
            }
        }

        escrever();
    }

    function _ocultarFala(cb) {
        const { balaoEl } = _fala;
        if (balaoEl) balaoEl.classList.add("oculta");
        if (typeof cb === "function") setTimeout(cb, 260);
    }

    function limparFala() {
        clearTimeout(_fala.timerTW);
        clearTimeout(_fala.timerSaida);
        _fala.fila  = [];
        _fala.ativa = false;
        _ocultarFala();
    }

    // ════════════════════════════════════════════════════
    // DANO DE TOQUE E DPS
    // ════════════════════════════════════════════════════
    function _atualizarDano() {
        if (!_pode("dano", CFG.THROTTLE_DANO_MS)) return;

        let danoClick = 0, dps = 0;
        try {
            danoClick = Damage.calcClick?.() ?? 0;
            dps       = Damage.calcDps?.()   ?? 0;
        } catch(_) {
            // Damage.js ainda não carregou
        }

        _set("danoTaqueUI", `👆 ${_fmt(danoClick)} Dano de Toque`);

        const dpsEl = _el("dpsUI");
        if (dpsEl) dpsEl.textContent = `⚡ ${_fmt(dps)} DPS`;
    }

    // ════════════════════════════════════════════════════
    // BOTÃO PRESTIGIAR
    // ════════════════════════════════════════════════════
    const _prestigio = {
        el        : null,
        pronto    : false,
    };

    function _garantirPrestigio() {
        _prestigio.el = _prestigio.el ?? _el("btnPrestigiar");
    }

    function _atualizarPrestigio(estagio) {
        _garantirPrestigio();
        const el = _prestigio.el;
        if (!el) return;

        const pronto = estagio >= CFG.PRESTIGIO_ESTAGIO;

        if (pronto === _prestigio.pronto) return;
        _prestigio.pronto = pronto;

        el.disabled = !pronto;

        if (pronto) {
            el.textContent = "🌟 Prestigiar!";
            el.classList.add("__btn_prestigio_pronto__");
        } else {
            const faltam = CFG.PRESTIGIO_ESTAGIO - estagio;
            el.textContent = `⭐ Estágio ${estagio}/${CFG.PRESTIGIO_ESTAGIO} (faltam ${faltam})`;
            el.classList.remove("__btn_prestigio_pronto__");
        }
    }

    // ════════════════════════════════════════════════════
    // COMBO MULTIPLIER
    // ════════════════════════════════════════════════════
    const _combo = {
        el      : null,
        ultimo  : 0,
    };

    function _garantirCombo() {
        _combo.el = _combo.el ?? _el("comboDisplay");
    }

    function _atualizarCombo(valor, mult) {
        _garantirCombo();
        const el = _combo.el;
        if (!el) return;

        if (valor < CFG.COMBO_MOSTRAR_MIN) {
            el.classList.add("oculto");
            _combo.ultimo = 0;
            return;
        }

        el.classList.remove("oculto");

        if (valor !== _combo.ultimo) {
            _combo.ultimo = valor;

            el.textContent = `🔥 ×${mult?.toFixed(1) ?? valor} COMBO`;

            // Pop ao aumentar
            el.classList.remove("__combo_pop__");
            void el.offsetWidth;
            el.classList.add("__combo_pop__");
        }
    }

    // ════════════════════════════════════════════════════
    // NAVEGAÇÃO DE ESTÁGIO — botões com feedback
    // ════════════════════════════════════════════════════
    function _configurarNavegacao() {
        const btnAntes  = _el("btnEstagioAntes")  ?? _el("btnAnterior");
        const btnProx   = _el("btnEstagioProximo") ?? _el("btnProximo");
        const btnChefe  = _el("btnEnfrentarChefe");

        [btnAntes, btnProx, btnChefe].forEach(btn => {
            if (!btn) return;
            btn.addEventListener("click", () => {
                // Feedback tátil — desabilita por 300ms para evitar spam
                btn.disabled = true;
                setTimeout(() => { btn.disabled = false; }, 300);
            });
        });
    }

    // ════════════════════════════════════════════════════
    // ATUALIZAR — chamado a cada frame relevante
    // ════════════════════════════════════════════════════
    function atualizar(dados = {}) {
        const {
            hp       = _estado("hpInimigo",      0),
            maxHp    = _estado("maxHpInimigo",    1),
            nome     = _estado("nomeInimigo",     ""),
            estagio  = _estado("estagio",         1),
            nomeLocal= "",
            chefe    = estagio % 10 === 0,
            combo    = _estado("comboAtual",      0),
            comboMult= _estado("comboMultiplier", 1),
        } = dados;

        _setHP(hp, maxHp);
        _animarNome(nome, chefe);
        _animarEstagio(estagio, nomeLocal);
        _atualizarPrestigio(estagio);
        _atualizarCombo(combo, comboMult);
        _atualizarDano();
    }

    // ════════════════════════════════════════════════════
    // TICK — chamado a cada frame pelo renderer
    // ════════════════════════════════════════════════════
    function tick() {
        _tickHpBar();
    }

    // ════════════════════════════════════════════════════
    // EVENTOS DO EVENTBUS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            // ── HP atualizado ──
            EventBus.on("inimigo:hp", ({ hp, maxHp }) => {
                _setHP(hp, maxHp);
            });

            // ── Novo inimigo configurado ──
            EventBus.on("inimigo:configurado", (dados) => {
                _setHP(dados.hp, dados.maxHp);
                _animarNome(dados.nome, dados.chefe);
                _atualizarPrestigio(dados.estagio ?? _estado("estagio", 1));
                limparFala();

                // Emite para o renderer também
                try {
                    RendererBattle.setMonstro({
                        emoji     : dados.emoji      ?? "😈",
                        emojiDor  : dados.emojiDor   ?? "😖",
                        emojiMedo : dados.emojiMedo  ?? "😱",
                        emojiRaiva: dados.emojiRaiva ?? "👿",
                        nome      : dados.nome,
                        hpPct     : dados.maxHp > 0 ? dados.hp / dados.maxHp : 1,
                        chefe     : dados.chefe ?? false,
                    });
                } catch(_) {}
            });

            // ── Estágio avançou ──
            EventBus.on("estagio:avancou", ({ estagio, nomeLocal, chefe }) => {
                _animarEstagio(estagio, nomeLocal);
                _atualizarPrestigio(estagio);
                limparFala();
            });

            // ── Fala do monstro ──
            EventBus.on("inimigo:fala", ({ texto }) => {
                exibirFala(texto);
            });

            // ── Upgrades comprados — atualiza dano exibido ──
            EventBus.on("upgrade:comprado", () => {
                _atualizarDano();
            });

            // ── Combo atualizado ──
            EventBus.on("combo:atualizado", ({ combo, multiplier }) => {
                _atualizarCombo(combo, multiplier);
            });

            EventBus.on("combo:resetado", () => {
                _atualizarCombo(0, 1);
            });

            // ── Prestígio feito — reseta UI ──
            EventBus.on("prestigio:feito", () => {
                _setHP(0, 1);
                _atualizarPrestigio(1);
                limparFala();
            });

            // ── Saiu da batalha — limpa ──
            EventBus.on("batalha:saiu", () => {
                limparFala();
            });

            _log.debug("Eventos registrados.");
        } catch(e) {
            _log.warn("EventBus indisponível:", e);
        }
    }

    // ════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ════════════════════════════════════════════════════
    function init() {
        _injetarCSS();
        _garantirHpBar();
        _garantirNome();
        _garantirEstagio();
        _garantirFala();
        _garantirPrestigio();
        _garantirCombo();
        _configurarNavegacao();
        _registrarEventos();

        _log.info("UIBattle inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return {
            hp        : { pctAtual: _hpBar.pctAtual.toFixed(3), pctAlvo: _hpBar.pctAlvo.toFixed(3) },
            nome      : _nomeState.atual,
            estagio   : _estagioState.atual,
            fala      : { ativa: _fala.ativa, fila: _fala.fila.length },
            prestigio : { pronto: _prestigio.pronto },
            combo     : _combo.ultimo,
        };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        tick,
        atualizar,
        exibirFala,
        limparFala,
        stats,
    });

})();
window.UIBattle = UIBattle;
