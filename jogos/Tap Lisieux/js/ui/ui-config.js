// ═══════════════════════════════════════════════════════
//  UI-CONFIG.JS
//  Tela de configurações completa:
//  - Volume de música e SFX com sliders animados
//  - Toggle de qualidade gráfica (Alto/Médio/Baixo)
//  - Toggle de partículas e shake de câmera
//  - Modo daltônico
//  - Informações do save (tempo jogado, estatísticas)
//  - Reset de save com confirmação em duas etapas
//  - Exportar/Importar save em JSON
//  - Botão de voltar ao site com save automático
//  - Preferências persistidas no localStorage
//
//  Depende de: dom-cache.js, save.js
//  Usado por: botão de config no HUD
// ═══════════════════════════════════════════════════════

"use strict";

const UIConfig = (() => {

    // ── Logger ───────────────────────────────────────────
    const _log = (() => {
        try   { return Logger.de("UIConfig"); }
        catch { return { debug:()=>{}, info:()=>{}, warn:()=>{}, error:()=>{} }; }
    })();

    // ════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════════════════
    const CFG = Object.freeze({
        STORAGE_KEY   : "taplisieux_config_v1",

        // Defaults
        DEFAULTS: {
            volumeMusica    : 0.7,
            volumeSfx       : 0.8,
            qualidade       : "alto",    // "alto" | "medio" | "baixo"
            particulas      : true,
            cameraShake     : true,
            daltonico       : false,
            mostrarFps      : false,
            autoSave        : true,
        },

        // Qualidade
        QUALIDADES: [
            { id: "alto",  label: "🌟 Alto",  desc: "Todas as partículas e efeitos" },
            { id: "medio", label: "⚡ Médio", desc: "Efeitos reduzidos"             },
            { id: "baixo", label: "🐢 Baixo", desc: "Sem partículas, máx. FPS"     },
        ],

        // Confirmação de reset
        RESET_CONFIRM_MS  : 5000,    // janela para confirmar o reset
        RESET_CONTA_DOWN  : 5,       // segundos no botão de confirmação
    });

    // ════════════════════════════════════════════════════
    // ESTADO DAS PREFERÊNCIAS
    // ════════════════════════════════════════════════════
    let _prefs = { ...CFG.DEFAULTS };

    // ════════════════════════════════════════════════════
    // CSS
    // ════════════════════════════════════════════════════
    function _injetarCSS() {
        if (document.getElementById("__ui_config_css__")) return;

        const s = document.createElement("style");
        s.id    = "__ui_config_css__";
        s.textContent = `
            /* ── Janela de config ── */
            .__config_janela__ {
                display         : flex;
                flex-direction  : column;
                gap             : 0;
                max-height      : 90vh;
                overflow        : hidden;
                border-radius   : 16px;
                background      : #0f0a1e;
                border          : 1px solid rgba(157,78,221,0.35);
                box-shadow      : 0 8px 48px rgba(0,0,0,0.7),
                                  0 0 0 1px rgba(157,78,221,0.15);
                width           : min(420px, 96vw);
            }

            /* ── Header ── */
            .__config_header__ {
                display         : flex;
                align-items     : center;
                justify-content : space-between;
                padding         : 16px 20px 12px;
                border-bottom   : 1px solid rgba(255,255,255,0.07);
                background      : rgba(157,78,221,0.12);
            }
            .__config_titulo__ {
                font-size       : 16px;
                font-weight     : 800;
                color           : #fff;
                letter-spacing  : 0.3px;
            }
            .__config_fechar__ {
                width           : 28px;
                height          : 28px;
                border-radius   : 50%;
                border          : none;
                background      : rgba(255,255,255,0.08);
                color           : rgba(255,255,255,0.7);
                font-size       : 16px;
                cursor          : pointer;
                display         : flex;
                align-items     : center;
                justify-content : center;
                transition      : background 0.15s, color 0.15s;
                line-height     : 1;
            }
            .__config_fechar__:hover {
                background      : rgba(255,80,80,0.25);
                color           : #ff6b6b;
            }

            /* ── Abas de seção ── */
            .__config_abas__ {
                display         : flex;
                border-bottom   : 1px solid rgba(255,255,255,0.07);
                background      : rgba(0,0,0,0.2);
            }
            .__config_aba__ {
                flex            : 1;
                padding         : 10px 6px;
                border          : none;
                background      : transparent;
                color           : rgba(255,255,255,0.45);
                font-size       : 12px;
                font-weight     : 600;
                cursor          : pointer;
                transition      : color 0.15s, background 0.15s;
                border-bottom   : 2px solid transparent;
            }
            .__config_aba__:hover { color: rgba(255,255,255,0.75); }
            .__config_aba__.ativa {
                color           : #c084fc;
                border-bottom-color: #9d4edd;
                background      : rgba(157,78,221,0.08);
            }

            /* ── Conteúdo rolável ── */
            .__config_corpo__ {
                overflow-y      : auto;
                flex            : 1;
                padding         : 16px 20px;
                scrollbar-width : thin;
                scrollbar-color : rgba(157,78,221,0.4) transparent;
            }
            .__config_corpo__::-webkit-scrollbar       { width: 4px; }
            .__config_corpo__::-webkit-scrollbar-thumb { background: rgba(157,78,221,0.5); border-radius: 2px; }

            /* ── Seção ── */
            .__config_secao__ { display: none; }
            .__config_secao__.ativa { display: block; }

            /* ── Grupo de controle ── */
            .__config_grupo__ {
                margin-bottom   : 14px;
            }
            .__config_label__ {
                display         : flex;
                align-items     : center;
                justify-content : space-between;
                font-size       : 13px;
                font-weight     : 600;
                color           : rgba(255,255,255,0.80);
                margin-bottom   : 6px;
            }
            .__config_label__ small {
                font-size       : 11px;
                color           : rgba(255,255,255,0.40);
                font-weight     : 400;
            }

            /* ── Slider ── */
            .__config_slider_wrap__ {
                display         : flex;
                align-items     : center;
                gap             : 10px;
            }
            .__config_slider__ {
                flex            : 1;
                -webkit-appearance: none;
                appearance      : none;
                height          : 6px;
                border-radius   : 3px;
                background      : rgba(255,255,255,0.12);
                outline         : none;
                cursor          : pointer;
            }
            .__config_slider__::-webkit-slider-thumb {
                -webkit-appearance: none;
                width           : 18px;
                height          : 18px;
                border-radius   : 50%;
                background      : #9d4edd;
                cursor          : pointer;
                box-shadow      : 0 0 6px rgba(157,78,221,0.6);
                transition      : transform 0.1s, box-shadow 0.1s;
            }
            .__config_slider__::-webkit-slider-thumb:hover {
                transform       : scale(1.2);
                box-shadow      : 0 0 10px rgba(157,78,221,0.9);
            }
            .__config_slider__::-moz-range-thumb {
                width           : 18px;
                height          : 18px;
                border-radius   : 50%;
                background      : #9d4edd;
                border          : none;
                cursor          : pointer;
            }
            .__slider_valor__ {
                font-size       : 12px;
                font-weight     : 700;
                color           : #c084fc;
                min-width       : 32px;
                text-align      : right;
            }

            /* ── Toggle switch ── */
            .__toggle_wrap__ {
                display         : flex;
                align-items     : center;
                justify-content : space-between;
                padding         : 10px 12px;
                background      : rgba(255,255,255,0.04);
                border          : 1px solid rgba(255,255,255,0.07);
                border-radius   : 10px;
                margin-bottom   : 8px;
                cursor          : pointer;
                transition      : background 0.15s;
            }
            .__toggle_wrap__:hover { background: rgba(255,255,255,0.07); }
            .__toggle_info__ { flex: 1; }
            .__toggle_nome__ {
                font-size       : 13px;
                font-weight     : 600;
                color           : rgba(255,255,255,0.85);
            }
            .__toggle_desc__ {
                font-size       : 11px;
                color           : rgba(255,255,255,0.40);
                margin-top      : 2px;
            }
            .__toggle_switch__ {
                width           : 40px;
                height          : 22px;
                border-radius   : 11px;
                background      : rgba(255,255,255,0.15);
                position        : relative;
                flex-shrink     : 0;
                transition      : background 0.2s;
                margin-left     : 12px;
            }
            .__toggle_switch__.ativo { background: #9d4edd; }
            .__toggle_switch__::after {
                content         : "";
                position        : absolute;
                top             : 3px;
                left            : 3px;
                width           : 16px;
                height          : 16px;
                border-radius   : 50%;
                background      : #fff;
                transition      : transform 0.2s cubic-bezier(.4,1.4,.6,1);
                box-shadow      : 0 1px 4px rgba(0,0,0,0.4);
            }
            .__toggle_switch__.ativo::after { transform: translateX(18px); }

            /* ── Qualidade ── */
            .__qualidade_opts__ {
                display         : flex;
                gap             : 6px;
            }
            .__qualidade_btn__ {
                flex            : 1;
                padding         : 8px 6px;
                border          : 1px solid rgba(255,255,255,0.12);
                background      : rgba(255,255,255,0.04);
                color           : rgba(255,255,255,0.55);
                border-radius   : 10px;
                font-size       : 11px;
                font-weight     : 700;
                cursor          : pointer;
                text-align      : center;
                transition      : all 0.15s;
                line-height     : 1.4;
            }
            .__qualidade_btn__:hover { background: rgba(255,255,255,0.08); }
            .__qualidade_btn__.ativo {
                border-color    : #9d4edd;
                background      : rgba(157,78,221,0.2);
                color           : #c084fc;
            }
            .__qualidade_desc__ {
                font-size       : 10px;
                color           : rgba(255,255,255,0.35);
                font-weight     : 400;
                margin-top      : 2px;
            }

            /* ── Botões de ação ── */
            .__config_btn__ {
                width           : 100%;
                padding         : 11px 16px;
                border          : none;
                border-radius   : 10px;
                font-size       : 13px;
                font-weight     : 700;
                cursor          : pointer;
                margin-bottom   : 8px;
                display         : flex;
                align-items     : center;
                justify-content : center;
                gap             : 8px;
                transition      : transform 0.1s, box-shadow 0.15s, opacity 0.15s;
            }
            .__config_btn__:active { transform: scale(0.97); }

            .__config_btn__.primario {
                background      : linear-gradient(135deg, #6d28d9, #9d4edd);
                color           : #fff;
                box-shadow      : 0 4px 14px rgba(109,40,217,0.4);
            }
            .__config_btn__.primario:hover {
                box-shadow      : 0 4px 20px rgba(157,78,221,0.6);
            }
            .__config_btn__.secundario {
                background      : rgba(255,255,255,0.07);
                color           : rgba(255,255,255,0.75);
                border          : 1px solid rgba(255,255,255,0.12);
            }
            .__config_btn__.secundario:hover {
                background      : rgba(255,255,255,0.12);
                color           : #fff;
            }
            .__config_btn__.perigo {
                background      : rgba(220,38,38,0.15);
                color           : #f87171;
                border          : 1px solid rgba(220,38,38,0.35);
            }
            .__config_btn__.perigo:hover {
                background      : rgba(220,38,38,0.28);
            }
            .__config_btn__.perigo-confirmacao {
                background      : #dc2626;
                color           : #fff;
                animation       : __reset_pulso__ 0.6s ease-in-out infinite alternate;
            }
            @keyframes __reset_pulso__ {
                from { box-shadow: 0 0 8px rgba(220,38,38,0.5); }
                to   { box-shadow: 0 0 20px rgba(220,38,38,0.9); }
            }

            /* ── Info do save ── */
            .__save_info__ {
                background      : rgba(255,255,255,0.04);
                border          : 1px solid rgba(255,255,255,0.08);
                border-radius   : 10px;
                padding         : 12px 14px;
                margin-bottom   : 12px;
            }
            .__save_info__ table {
                width           : 100%;
                border-collapse : collapse;
                font-size       : 12px;
            }
            .__save_info__ td {
                padding         : 3px 0;
                color           : rgba(255,255,255,0.6);
            }
            .__save_info__ td:first-child {
                color           : rgba(255,255,255,0.40);
                width           : 50%;
            }
            .__save_info__ td strong {
                color           : rgba(255,255,255,0.90);
            }

            /* ── Divider ── */
            .__config_divider__ {
                height          : 1px;
                background      : rgba(255,255,255,0.07);
                margin          : 14px 0;
            }

            /* ── Versão ── */
            .__config_versao__ {
                text-align      : center;
                font-size       : 11px;
                color           : rgba(255,255,255,0.20);
                padding-top     : 8px;
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

    function _estado(chave, fb) {
        try   { return GameState.get(chave) ?? fb; }
        catch { return fb; }
    }

    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch { return String(Math.floor(n ?? 0)); }
    }

    function _formatarTempo(ms) {
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (h > 0) return `${h}h ${m}min`;
        return `${m}min`;
    }

    // ════════════════════════════════════════════════════
    // PERSISTÊNCIA
    // ════════════════════════════════════════════════════
    function salvarPrefs() {
        try {
            localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(_prefs));
            _aplicarPrefs();
            _log.debug("Preferências salvas.");
        } catch(e) {
            _log.error("Erro ao salvar preferências:", e);
        }
    }

    function carregarPrefs() {
        try {
            const raw = localStorage.getItem(CFG.STORAGE_KEY);
            if (!raw) return;
            const salvo = JSON.parse(raw);
            _prefs = { ...CFG.DEFAULTS, ...salvo };
            _aplicarPrefs();
            _log.debug("Preferências carregadas.");
        } catch(e) {
            _log.warn("Preferências corrompidas — usando padrões.");
            _prefs = { ...CFG.DEFAULTS };
        }
    }

    function _aplicarPrefs() {
        // Aplica ao GameState para outros módulos consumirem
        try {
            GameState.patch({
                volumeMusica : _prefs.volumeMusica,
                volumeSfx    : _prefs.volumeSfx,
                qualidade    : _prefs.qualidade,
            });
        } catch(_) {}

        // Aplica ao Audio
        try {
            Audio.setVolume(_prefs.volumeMusica, _prefs.volumeSfx);
        } catch(_) {}

        // Aplica qualidade ao Effects
        try {
            if (_prefs.qualidade === "baixo") {
                Effects.setQualidade?.("baixo");
            }
        } catch(_) {}

        // Emite evento para outros módulos
        try {
            EventBus.emit("config:atualizada", { ..._prefs });
        } catch(_) {}
    }

    // ════════════════════════════════════════════════════
    // CONSTRUÇÃO DA JANELA
    // Constrói o HTML da janela de config dinamicamente
    // caso o HTML do jogo não a tenha
    // ════════════════════════════════════════════════════
    function _garantirJanela() {
        let janela = _el("janelaConfig");
        if (janela) {
            janela.classList.add("__config_janela__");
            return janela;
        }

        // Cria do zero
        janela    = document.createElement("div");
        janela.id = "janelaConfig";
        janela.className = "__config_janela__";
        janela.setAttribute("role",        "dialog");
        janela.setAttribute("aria-modal",  "true");
        janela.setAttribute("aria-label",  "Configurações");
        janela.style.display = "none";
        janela.style.position = "fixed";
        janela.style.top      = "50%";
        janela.style.left     = "50%";
        janela.style.transform = "translate(-50%,-50%)";
        janela.style.zIndex   = "9000";

        document.body.appendChild(janela);
        return janela;
    }

    // ════════════════════════════════════════════════════
    // RENDER DA JANELA
    // ════════════════════════════════════════════════════

    let _janelaEl   = null;
    let _abaAtiva   = "audio";

    const _ABAS_DEF = [
        { id: "audio",    label: "🎵 Áudio"        },
        { id: "grafico",  label: "🎮 Gráficos"      },
        { id: "save",     label: "💾 Save"          },
    ];

    function _renderJanela() {
        const janela = _garantirJanela();
        _janelaEl    = janela;

        janela.innerHTML = `
            <!-- Header -->
            <div class="__config_header__">
                <span class="__config_titulo__">⚙️ Configurações</span>
                <button class="__config_fechar__" id="__cfg_fechar__" aria-label="Fechar">✕</button>
            </div>

            <!-- Abas -->
            <div class="__config_abas__" role="tablist" id="__cfg_abas__"></div>

            <!-- Corpo -->
            <div class="__config_corpo__">
                <!-- SEÇÃO: Áudio -->
                <div class="__config_secao__ ativa" id="__cfg_sec_audio__" role="tabpanel">
                    ${_renderSecaoAudio()}
                </div>

                <!-- SEÇÃO: Gráficos -->
                <div class="__config_secao__" id="__cfg_sec_grafico__" role="tabpanel">
                    ${_renderSecaoGrafico()}
                </div>

                <!-- SEÇÃO: Save -->
                <div class="__config_secao__" id="__cfg_sec_save__" role="tabpanel">
                    <div id="__cfg_save_info__"></div>
                    ${_renderSecaoSave()}
                </div>
            </div>

            <!-- Versão -->
            <div class="__config_versao__">
                Santa Teresinha Idle — v1.0.0
            </div>
        `;

        _renderAbas();
        _bindEventos();
        _sincronizarUI();
    }

    function _renderAbas() {
        const container = document.getElementById("__cfg_abas__");
        if (!container) return;

        _ABAS_DEF.forEach(aba => {
            const btn = document.createElement("button");
            btn.className    = "__config_aba__" + (aba.id === _abaAtiva ? " ativa" : "");
            btn.dataset.aba  = aba.id;
            btn.textContent  = aba.label;
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", String(aba.id === _abaAtiva));
            btn.addEventListener("click", () => _trocarAba(aba.id));
            container.appendChild(btn);
        });
    }

    function _trocarAba(id) {
        _abaAtiva = id;

        _ABAS_DEF.forEach(a => {
            const sec = document.getElementById(`__cfg_sec_${a.id}__`);
            if (sec) sec.classList.toggle("ativa", a.id === id);
        });

        document.querySelectorAll(".__config_aba__").forEach(btn => {
            const ativo = btn.dataset.aba === id;
            btn.classList.toggle("ativa", ativo);
            btn.setAttribute("aria-selected", String(ativo));
        });

        // Atualiza info do save ao abrir essa aba
        if (id === "save") _atualizarInfoSave();
    }

    // ════════════════════════════════════════════════════
    // SEÇÃO ÁUDIO
    // ════════════════════════════════════════════════════
    function _renderSecaoAudio() {
        return `
            <div class="__config_grupo__">
                <div class="__config_label__">
                    🎵 Música
                    <small id="__val_musica__">${Math.round(_prefs.volumeMusica * 100)}%</small>
                </div>
                <div class="__config_slider_wrap__">
                    <input type="range" class="__config_slider__" id="__sl_musica__"
                        min="0" max="100" step="1"
                        value="${Math.round(_prefs.volumeMusica * 100)}"
                        aria-label="Volume da música">
                </div>
            </div>

            <div class="__config_grupo__">
                <div class="__config_label__">
                    🔊 Efeitos Sonoros
                    <small id="__val_sfx__">${Math.round(_prefs.volumeSfx * 100)}%</small>
                </div>
                <div class="__config_slider_wrap__">
                    <input type="range" class="__config_slider__" id="__sl_sfx__"
                        min="0" max="100" step="1"
                        value="${Math.round(_prefs.volumeSfx * 100)}"
                        aria-label="Volume dos efeitos">
                </div>
            </div>

            <div class="__config_divider__"></div>

            <div class="__toggle_wrap__" id="__tog_musica_wrap__">
                <div class="__toggle_info__">
                    <div class="__toggle_nome__">Música de fundo</div>
                    <div class="__toggle_desc__">Tocar música durante o jogo</div>
                </div>
                <div class="__toggle_switch__ ${_prefs.volumeMusica > 0 ? 'ativo' : ''}" id="__tog_musica__"></div>
            </div>
        `;
    }

    // ════════════════════════════════════════════════════
    // SEÇÃO GRÁFICOS
    // ════════════════════════════════════════════════════
    function _renderSecaoGrafico() {
        const opts = CFG.QUALIDADES.map(q => `
            <button class="__qualidade_btn__ ${_prefs.qualidade === q.id ? 'ativo' : ''}"
                    data-qualidade="${q.id}">
                ${q.label}
                <div class="__qualidade_desc__">${q.desc}</div>
            </button>
        `).join("");

        return `
            <div class="__config_grupo__">
                <div class="__config_label__">🎮 Qualidade Gráfica</div>
                <div class="__qualidade_opts__">${opts}</div>
            </div>

            <div class="__config_divider__"></div>

            <div class="__toggle_wrap__" data-pref="particulas">
                <div class="__toggle_info__">
                    <div class="__toggle_nome__">✨ Partículas</div>
                    <div class="__toggle_desc__">Efeitos de impacto e moedas</div>
                </div>
                <div class="__toggle_switch__ ${_prefs.particulas ? 'ativo' : ''}" data-toggle="particulas"></div>
            </div>

            <div class="__toggle_wrap__" data-pref="cameraShake">
                <div class="__toggle_info__">
                    <div class="__toggle_nome__">📳 Vibração da Câmera</div>
                    <div class="__toggle_desc__">Tremor ao causar dano</div>
                </div>
                <div class="__toggle_switch__ ${_prefs.cameraShake ? 'ativo' : ''}" data-toggle="cameraShake"></div>
            </div>

            <div class="__toggle_wrap__" data-pref="daltonico">
                <div class="__toggle_info__">
                    <div class="__toggle_nome__">👁️ Modo Daltônico</div>
                    <div class="__toggle_desc__">Ajusta cores para daltonismo</div>
                </div>
                <div class="__toggle_switch__ ${_prefs.daltonico ? 'ativo' : ''}" data-toggle="daltonico"></div>
            </div>

            <div class="__toggle_wrap__" data-pref="mostrarFps">
                <div class="__toggle_info__">
                    <div class="__toggle_nome__">📊 Mostrar FPS</div>
                    <div class="__toggle_desc__">Overlay de performance</div>
                </div>
                <div class="__toggle_switch__ ${_prefs.mostrarFps ? 'ativo' : ''}" data-toggle="mostrarFps"></div>
            </div>
        `;
    }

    // ════════════════════════════════════════════════════
    // SEÇÃO SAVE
    // ════════════════════════════════════════════════════
    function _renderSecaoSave() {
        return `
            <button class="__config_btn__ primario" id="__cfg_exportar__">
                📤 Exportar Save
            </button>

            <button class="__config_btn__ secundario" id="__cfg_importar__">
                📥 Importar Save
            </button>
            <input type="file" id="__cfg_import_file__" accept=".json"
                   style="display:none" aria-hidden="true">

            <div class="__config_divider__"></div>

            <button class="__config_btn__ secundario" id="__cfg_voltar__">
                🏠 Salvar e Voltar ao Site
            </button>

            <div class="__config_divider__"></div>

            <button class="__config_btn__ perigo" id="__cfg_reset__">
                🗑️ Resetar Progresso
            </button>

            <div id="__cfg_reset_confirmacao__" style="display:none;margin-top:8px">
                <p style="font-size:12px;color:#f87171;text-align:center;margin-bottom:8px">
                    ⚠️ Isso apaga TODO o seu progresso permanentemente!
                </p>
                <button class="__config_btn__ perigo-confirmacao" id="__cfg_reset_confirmar__">
                    💀 CONFIRMAR RESET (<span id="__reset_countdown__">5</span>s)
                </button>
                <button class="__config_btn__ secundario" id="__cfg_reset_cancelar__">
                    ← Cancelar
                </button>
            </div>
        `;
    }

    // ════════════════════════════════════════════════════
    // INFO DO SAVE
    // ════════════════════════════════════════════════════
    function _atualizarInfoSave() {
        const el = document.getElementById("__cfg_save_info__");
        if (!el) return;

        const estagio  = _estado("estagio",          1);
        const moeda    = _estado("moeda",             0);
        const gema     = _estado("gema",              0);
        const kills    = _estado("totalKills",        0);
        const nivel    = _estado("nivelPersonagem",   1);
        const prestigio= _estado("totalPrestígios",   0);
        const upgrades = _estado("totalUpgrades",     0);
        const herois   = _estado("heroisObtidos",    []);
        const equips   = _estado("equipamentosObtidos", []);

        // Tempo de jogo (sessão atual)
        const sessaoMs = performance.now();
        const tempoStr = _formatarTempo(sessaoMs);

        el.innerHTML = `
            <div class="__save_info__">
                <table>
                    <tr><td>Estágio atual</td><td><strong>${estagio}</strong></td></tr>
                    <tr><td>Nível da Santa</td><td><strong>${nivel}</strong></td></tr>
                    <tr><td>Prestígios</td><td><strong>${prestigio}</strong></td></tr>
                    <tr><td>Total de kills</td><td><strong>${_fmt(kills)}</strong></td></tr>
                    <tr><td>Upgrades feitos</td><td><strong>${_fmt(upgrades)}</strong></td></tr>
                    <tr><td>Moedas atuais</td><td><strong>🪙 ${_fmt(moeda)}</strong></td></tr>
                    <tr><td>Gemas atuais</td><td><strong>💎 ${_fmt(gema)}</strong></td></tr>
                    <tr><td>Itens obtidos</td><td><strong>${(Array.isArray(herois) ? herois.length : 0) + (Array.isArray(equips) ? equips.length : 0)}</strong></td></tr>
                    <tr><td>Sessão atual</td><td><strong>${tempoStr}</strong></td></tr>
                </table>
            </div>
        `;
    }

    // ════════════════════════════════════════════════════
    // RESET COM COUNTDOWN
    // ════════════════════════════════════════════════════
    let _resetTimer    = null;
    let _resetContagem = 0;

    function _iniciarReset() {
        const confirmDiv = document.getElementById("__cfg_reset_confirmacao__");
        if (confirmDiv) confirmDiv.style.display = "block";

        _resetContagem = CFG.RESET_CONTA_DOWN;
        _tickReset();
    }

    function _tickReset() {
        const cdEl  = document.getElementById("__reset_countdown__");
        const btn   = document.getElementById("__cfg_reset_confirmar__");

        if (cdEl) cdEl.textContent = String(_resetContagem);
        if (btn)  btn.disabled = _resetContagem > 0;

        if (_resetContagem > 0) {
            _resetContagem--;
            _resetTimer = setTimeout(_tickReset, 1000);
        }
    }

    function _cancelarReset() {
        clearTimeout(_resetTimer);
        _resetContagem = 0;
        const confirmDiv = document.getElementById("__cfg_reset_confirmacao__");
        if (confirmDiv) confirmDiv.style.display = "none";
    }

    function _executarReset() {
        clearTimeout(_resetTimer);
        try {
            GameState.resetTotal();
        } catch(_) {}
        try {
            SaveSystem.limpar?.() ?? localStorage.clear();
        } catch(_) {
            localStorage.clear();
        }
        try { Toast.aviso("🗑️ Progresso resetado. Recarregando..."); } catch(_) {}
        setTimeout(() => location.reload(), 1200);
    }

    // ════════════════════════════════════════════════════
    // EXPORTAR / IMPORTAR SAVE
    // ════════════════════════════════════════════════════
    function _exportarSave() {
        try {
            let dados;
            try   { dados = GameState.snapshot(); }
            catch { dados = {}; }

            const json = JSON.stringify({ v: 2, ts: Date.now(), dados }, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url  = URL.createObjectURL(blob);

            const a    = document.createElement("a");
            a.href     = url;
            a.download = `taplisieux_save_${new Date().toISOString().slice(0,10)}.json`;
            a.click();

            URL.revokeObjectURL(url);
            try { Toast.sucesso("✅ Save exportado!"); } catch(_) {}

        } catch(e) {
            _log.error("Erro ao exportar save:", e);
            try { Toast.erro("❌ Erro ao exportar save."); } catch(_) {}
        }
    }

    function _importarSave(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const obj = JSON.parse(e.target.result);
                if (!obj?.dados) throw new Error("Formato inválido");
                GameState.carregar(obj.dados);
                try { SaveSystem.salvar?.(); } catch(_) {}
                try { Toast.sucesso("✅ Save importado! Recarregando..."); } catch(_) {}
                setTimeout(() => location.reload(), 1200);
            } catch(err) {
                _log.error("Erro ao importar save:", err);
                try { Toast.erro("❌ Arquivo de save inválido."); } catch(_) {}
            }
        };
        reader.readAsText(file);
    }

    // ════════════════════════════════════════════════════
    // SINCRONIZAR UI COM PREFS
    // ════════════════════════════════════════════════════
    function _sincronizarUI() {
        // Sliders
        const slMusica = document.getElementById("__sl_musica__");
        const slSfx    = document.getElementById("__sl_sfx__");
        if (slMusica) slMusica.value = Math.round(_prefs.volumeMusica * 100);
        if (slSfx)    slSfx.value    = Math.round(_prefs.volumeSfx   * 100);

        // Toggles
        document.querySelectorAll("[data-toggle]").forEach(sw => {
            const pref = sw.dataset.toggle;
            if (pref in _prefs) {
                sw.classList.toggle("ativo", !!_prefs[pref]);
            }
        });

        // Qualidade
        document.querySelectorAll("[data-qualidade]").forEach(btn => {
            btn.classList.toggle("ativo", btn.dataset.qualidade === _prefs.qualidade);
        });
    }

    // ════════════════════════════════════════════════════
    // BIND DE EVENTOS DA JANELA
    // ════════════════════════════════════════════════════
    function _bindEventos() {
        const janela = _janelaEl;
        if (!janela) return;

        // Fechar
        janela.querySelector("#__cfg_fechar__")?.addEventListener("click", fechar);

        // Slider música
        const slMusica = document.getElementById("__sl_musica__");
        slMusica?.addEventListener("input", e => {
            const v = Number(e.target.value) / 100;
            _prefs.volumeMusica = v;
            const lbl = document.getElementById("__val_musica__");
            if (lbl) lbl.textContent = `${e.target.value}%`;
            // Atualiza em tempo real
            try { Audio.setMusicaVolume?.(v); } catch(_) {}
            _atualizarSliderFill(slMusica);
            salvarPrefs();
        });

        // Slider SFX
        const slSfx = document.getElementById("__sl_sfx__");
        slSfx?.addEventListener("input", e => {
            const v = Number(e.target.value) / 100;
            _prefs.volumeSfx = v;
            const lbl = document.getElementById("__val_sfx__");
            if (lbl) lbl.textContent = `${e.target.value}%`;
            try { Audio.setSfxVolume?.(v); } catch(_) {}
            _atualizarSliderFill(slSfx);
            salvarPrefs();
        });

        // Toggles genéricos
        janela.querySelectorAll("[data-pref]").forEach(wrap => {
            wrap.addEventListener("click", () => {
                const pref = wrap.dataset.pref;
                if (!(pref in _prefs)) return;
                _prefs[pref] = !_prefs[pref];
                const sw = wrap.querySelector("[data-toggle]");
                if (sw) sw.classList.toggle("ativo", _prefs[pref]);
                salvarPrefs();
            });
        });

        // Toggle música simples
        const togMusica = document.getElementById("__tog_musica__");
        const togMusWrap = document.getElementById("__tog_musica_wrap__");
        togMusWrap?.addEventListener("click", () => {
            const novoVol = _prefs.volumeMusica > 0 ? 0 : (CFG.DEFAULTS.volumeMusica);
            _prefs.volumeMusica = novoVol;
            togMusica?.classList.toggle("ativo", novoVol > 0);
            if (slMusica) {
                slMusica.value = Math.round(novoVol * 100);
                _atualizarSliderFill(slMusica);
            }
            const lbl = document.getElementById("__val_musica__");
            if (lbl) lbl.textContent = `${Math.round(novoVol * 100)}%`;
            try { Audio.setMusicaVolume?.(novoVol); } catch(_) {}
            salvarPrefs();
        });

        // Qualidade
        janela.querySelectorAll("[data-qualidade]").forEach(btn => {
            btn.addEventListener("click", () => {
                _prefs.qualidade = btn.dataset.qualidade;
                janela.querySelectorAll("[data-qualidade]").forEach(b => {
                    b.classList.toggle("ativo", b.dataset.qualidade === _prefs.qualidade);
                });
                salvarPrefs();
            });
        });

        // Voltar ao site
        document.getElementById("__cfg_voltar__")?.addEventListener("click", () => {
            try { SaveSystem.salvar?.(); } catch(_) {}
            try { Toast.info("💾 Jogo salvo! Voltando..."); } catch(_) {}
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        });

        // Exportar save
        document.getElementById("__cfg_exportar__")?.addEventListener("click", _exportarSave);

        // Importar save
        document.getElementById("__cfg_importar__")?.addEventListener("click", () => {
            document.getElementById("__cfg_import_file__")?.click();
        });
        document.getElementById("__cfg_import_file__")?.addEventListener("change", e => {
            _importarSave(e.target.files?.[0]);
        });

        // Reset
        document.getElementById("__cfg_reset__")?.addEventListener("click", _iniciarReset);
        document.getElementById("__cfg_reset_confirmar__")?.addEventListener("click", _executarReset);
        document.getElementById("__cfg_reset_cancelar__")?.addEventListener("click", _cancelarReset);
    }

    // ════════════════════════════════════════════════════
    // SLIDER FILL — fundo gradiente no slider
    // ════════════════════════════════════════════════════
    function _atualizarSliderFill(input) {
        const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
        input.style.background = `linear-gradient(90deg,
            #9d4edd ${pct}%,
            rgba(255,255,255,0.12) ${pct}%)`;
    }

    function _inicializarSliders() {
        document.querySelectorAll(".__config_slider__").forEach(_atualizarSliderFill);
    }

    // ════════════════════════════════════════════════════
    // ABRIR / FECHAR
    // ════════════════════════════════════════════════════
    function abrir() {
        _renderJanela();
        _inicializarSliders();

        try {
            UIModals.abrir("janelaConfig", {
                labelId           : "__cfg_titulo__",
                fecharAoClicarFora: true,
                fecharComESC      : true,
            });
        } catch(_) {
            const el = _el("janelaConfig");
            if (el) el.style.display = "flex";
        }
    }

    function fechar() {
        _cancelarReset();
        try { UIModals.fechar("janelaConfig"); }
        catch(_) {
            const el = _el("janelaConfig");
            if (el) el.style.display = "none";
        }
    }

    // ════════════════════════════════════════════════════
    // EVENTOS GLOBAIS
    // ════════════════════════════════════════════════════
    function _registrarEventos() {
        try {
            EventBus.on("config:abrir",  () => abrir());
            EventBus.on("config:fechar", () => fechar());

            // Outros módulos podem ler as prefs
            EventBus.on("config:get", ({ chave, callback }) => {
                if (typeof callback === "function") {
                    callback(_prefs[chave] ?? CFG.DEFAULTS[chave]);
                }
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
        carregarPrefs();
        _registrarEventos();

        // Expõe globalmente para onclick no HTML
        window.abrirConfig = abrir;
        window.fecharConfig = fechar;
        window.voltarSite   = () => {
            try { SaveSystem.salvar?.(); } catch(_) {}
            window.location.href = "index.html";
        };

        _log.info("UIConfig inicializado.");
    }

    // ════════════════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════════════════
    function stats() {
        return { ..._prefs };
    }

    // ════════════════════════════════════════════════════
    // API PÚBLICA
    // ════════════════════════════════════════════════════
    return Object.freeze({
        init,
        abrir,
        fechar,
        salvarPrefs,
        carregarPrefs,
        get prefs() { return { ..._prefs }; },
        stats,
    });

})();
window.UIConfig = UIConfig;
