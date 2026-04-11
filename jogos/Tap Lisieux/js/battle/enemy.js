// ═══════════════════════════════════════════════════════════
//  ENEMY.JS
//  Sistema completo de inimigos do jogo.
//
//  PROBLEMA QUE RESOLVE:
//  No código antigo, dados de inimigos eram arrays soltos,
//  o HP era calculado inline, as falas eram disparadas com
//  setTimeout espalhados, e o estado do inimigo era um objeto
//  global mutável sem validação nem eventos.
//
//  SOLUÇÃO:
//  Sistema declarativo completo com definição rica de tipos,
//  curva de HP configurável, sistema de falas com cooldown,
//  recompensas escaladas, variantes especiais e estado
//  reativo via EventBus.
//
//  TIPOS DE INIMIGOS:
//  ┌──────────────────┬────────────────────────────────────┐
//  │ Tipo             │ Aparece em                         │
//  ├──────────────────┼────────────────────────────────────┤
//  │ Demônio          │ Estágios 1-3, 11-13, ...           │
//  │ Espírito Maligno │ Estágios 4-6, 14-16, ...           │
//  │ Sombra Corrompida│ Estágios 7-9, 17-19, ...           │
//  │ Anjo Caído       │ Estágios variados                  │
//  │ Chefe das Trevas │ CHEFE — todo estágio × 10          │
//  │ Arquidemônio     │ CHEFE — todo estágio × 50 (élite)  │
//  └──────────────────┴────────────────────────────────────┘
//
//  SISTEMA DE FALAS:
//  - Fala ao aparecer (entrada)
//  - Fala ao levar dano (HP < 50% e < 20%)
//  - Fala aleatória periódica (se não estiver em cooldown)
//  - Falas únicas para chefes e chefes élite
//
//  RECOMPENSAS:
//  - Moeda: escala exponencial com estágio
//  - Gema: 5% chance em normal, garantida em chefe
//  - Chefe élite (×50): recompensa x5
//
//  API:
//    Enemy.configurar(estagio)    → configura e retorna inimigo
//    Enemy.estado()               → estado atual somente leitura
//    Enemy.receberDano(valor)     → aplica dano e retorna resultado
//    Enemy.matar()                → finaliza e emite eventos
//    Enemy.falarEntrada()         → fala de entrada
//    Enemy.falarAleatorio()       → fala periódica (com cooldown)
//    Enemy.emojiAtual()           → emoji baseado no estado de HP
//    Enemy.nomeEstagio(n)         → nome do bioma do estágio n
//    Enemy.ehChefe(n)             → boolean
//    Enemy.ehChefeElite(n)        → boolean (×50)
//    Enemy.infoAtual()            → objeto completo para UI/renderer
//
//  Depende de: constants.js, event-bus.js, state.js, logger.js
//  Usado por: battle.js, renderer-battle.js, ui-battle.js
// ═══════════════════════════════════════════════════════════

"use strict";

const Enemy = (() => {

    // ════════════════════════════════════════
    // LOGGER
    // ════════════════════════════════════════
    const _log = (() => {
        try   { return Logger.de("Enemy"); }
        catch { return {
            debug : () => {},
            info  : () => {},
            warn  : (...a) => console.warn("[Enemy]",  ...a),
            error : (...a) => console.error("[Enemy]", ...a)
        }; }
    })();

    // ════════════════════════════════════════
    // CONFIGURAÇÃO
    // ════════════════════════════════════════
    const CFG = Object.freeze({
        // Curva de HP: floor(HP_BASE × HP_ESCALA^estagio)
        HP_BASE           : 80,
        HP_ESCALA         : 1.22,

        // Recompensas
        MOEDA_BASE        : 10,
        MOEDA_ESCALA      : 1.15,
        GEMA_CHANCE       : 0.05,    // 5% de chance de gema em normal
        GEMA_CHEFE_MIN    : 5,       // gemas mínimas de chefe
        GEMA_ELITE_MULT   : 5,       // multiplicador de recompensa de elite

        // Falas
        FALA_COOLDOWN_MS  : 9000,    // intervalo mínimo entre falas
        FALA_CHANCE       : 0.30,    // 30% de chance de falar no tick
        FALA_DANO_LIMIAR1 : 0.50,    // fala ao atingir 50% HP
        FALA_DANO_LIMIAR2 : 0.20,    // fala ao atingir 20% HP

        // Chefes
        INTERVALO_CHEFE   : 10,      // chefe a cada N estágios
        INTERVALO_ELITE   : 50,      // chefe élite a cada N estágios
        MULT_HP_CHEFE     : 3.5,     // HP do chefe vs normal
        MULT_HP_ELITE     : 8.0,     // HP do élite vs normal
    });

    // ════════════════════════════════════════
    // NOMES DE ESTÁGIO (biomas)
    // ════════════════════════════════════════
    const _NOMES_ESTAGIO = Object.freeze([
        "Jardim das Sombras",
        "Cripta Maldita",
        "Floresta Corrompida",
        "Vale das Trevas",
        "Torre do Mal",
        "Abismo Profundo",
        "Santuário Profanado",
        "Catedral Sombria",
        "Portal Infernal",
        "Domínio do Caos",
        "Fortaleza Demoníaca",
        "Labirinto Sombrio",
        "Pântano Amaldiçoado",
        "Ruínas Esquecidas",
        "Trono das Trevas"
    ]);

    // ════════════════════════════════════════
    // DEFINIÇÃO DOS TIPOS DE INIMIGOS
    // ════════════════════════════════════════

    /**
     * @typedef {object} TipoInimigo
     * @property {string}   id          — chave única
     * @property {string}   nome        — base do nome
     * @property {object}   emojis      — { normal, dor, medo, raiva, morte }
     * @property {string[]} tags        — para efeitos especiais futuros
     * @property {boolean}  chefe       — é um chefe
     * @property {boolean}  elite       — é um chefe élite
     * @property {object}   falas       — { entrada, dano50, dano20, aleatorio[], morte[] }
     */
    const _TIPOS = Object.freeze([
        {
            id    : "demonio",
            nome  : "Demônio",
            emojis: {
                normal : "😈",
                dor    : "😖",
                medo   : "😱",
                raiva  : "👿",
                morte  : "💨"
            },
            tags  : ["demonio", "comum"],
            chefe : false,
            elite : false,
            falas : {
                entrada  : [
                    "Outra santinha fraca apareceu!",
                    "Você não me assusta com essas florzinhas!",
                    "Hah! Isso vai ser fácil..."
                ],
                dano50   : [
                    "Você se atreve a me machucar?!",
                    "Que dor insignificante!",
                    "Isso só me irrita!"
                ],
                dano20   : [
                    "N-não pode ser...",
                    "Impossível! Uma criança me vencendo?!",
                    "Eu ainda vou te derrotar!"
                ],
                aleatorio: [
                    "Você é uma inútil mesmo!",
                    "Nem suas orações te salvam!",
                    "Que fraquinha!",
                    "Vai chorar pro seu Deus?",
                    "As trevas são eternas!",
                    "Desista, é mais fácil!"
                ],
                morte    : [
                    "Isso... não acabou...",
                    "Você terá de enfrentar meus irmãos!",
                    "Maldiçãaaaooo..."
                ]
            }
        },
        {
            id    : "espirito",
            nome  : "Espírito Maligno",
            emojis: {
                normal : "👻",
                dor    : "😵",
                medo   : "😨",
                raiva  : "💢",
                morte  : "🌫️"
            },
            tags  : ["espirito", "comum"],
            chefe : false,
            elite : false,
            falas : {
                entrada  : [
                    "Florzinhas? Ridículo!",
                    "Atravesso paredes, você não pode me pegar!",
                    "Minha maldição vai te consumir..."
                ],
                dano50   : [
                    "Você consegue tocar em mim?!",
                    "Isso é... impossível!",
                    "Sua fé está me enfraquecendo!"
                ],
                dano20   : [
                    "A luz... ela queima...",
                    "N-não, não me dissolva!",
                    "Como sua fé é tão forte?!"
                ],
                aleatorio: [
                    "Desista, santinha!",
                    "Sua fé não vale nada!",
                    "Você está perdendo tempo!",
                    "Eu sou imortal!",
                    "O medo te consome por dentro!"
                ],
                morte    : [
                    "A luz... tão brilhante...",
                    "Livre... finalmente livre...",
                    "Voltarei... mais forte..."
                ]
            }
        },
        {
            id    : "sombra",
            nome  : "Sombra Corrompida",
            emojis: {
                normal : "🕷️",
                dor    : "💀",
                medo   : "😰",
                raiva  : "🕸️",
                morte  : "🌑"
            },
            tags  : ["sombra", "comum"],
            chefe : false,
            elite : false,
            falas : {
                entrada  : [
                    "A escuridão te engole viva!",
                    "Você não pode ver o que não existe!",
                    "Sou feita das suas próprias dúvidas!"
                ],
                dano50   : [
                    "A luz... ela me corrói!",
                    "Como você me encontra?!",
                    "Para! Para de brilhar assim!"
                ],
                dano20   : [
                    "A escuridão... some...",
                    "Não quero ser dissolvida!",
                    "Por favor... misericórdia..."
                ],
                aleatorio: [
                    "A escuridão vence a luz!",
                    "Suas rosas não têm poder aqui!",
                    "Você é tão pequena!",
                    "Minha teia te aprisiona!",
                    "Ninguém escapa da sombra!"
                ],
                morte    : [
                    "A luz... venceu...",
                    "Nunca pensei... que seria assim...",
                    "A sombra... recua..."
                ]
            }
        },
        {
            id    : "anjo_caido",
            nome  : "Anjo Caído",
            emojis: {
                normal : "😤",
                dor    : "🥴",
                medo   : "😰",
                raiva  : "🔥",
                morte  : "🪶"
            },
            tags  : ["anjo", "caido", "raro"],
            chefe : false,
            elite : false,
            falas : {
                entrada  : [
                    "Caí por escolha, não por fraqueza!",
                    "Eu conheço seus truques, santinha!",
                    "Uma vez fui como você... agora sou livre!"
                ],
                dano50   : [
                    "Suas penas ainda me ferem...",
                    "Sinto o Céu me chamando — mas recuso!",
                    "Dói... mas não vou voltar atrás!"
                ],
                dano20   : [
                    "Isso foi um erro... cair...",
                    "Eu... me lembro do Céu...",
                    "Talvez... eu tenha errado..."
                ],
                aleatorio: [
                    "Agora sirvo a mim mesmo!",
                    "A liberdade tem um preço!",
                    "Você nunca entenderá minha escolha!",
                    "O orgulho me sustenta!",
                    "Não me arrependo de nada!"
                ],
                morte    : [
                    "O Céu... ainda me esperava?",
                    "Que paz estranha...",
                    "Eu... escolho voltar..."
                ]
            }
        },
        {
            id    : "chefe_trevas",
            nome  : "Chefe das Trevas",
            emojis: {
                normal : "💀",
                dor    : "😣",
                medo   : "😱",
                raiva  : "😡",
                morte  : "☠️"
            },
            tags  : ["chefe", "boss", "trevas"],
            chefe : true,
            elite : false,
            falas : {
                entrada  : [
                    "Você ousa desafiar o CHEFE?!",
                    "Meus servos falharam. Desta vez, eu mesmo te destruirei!",
                    "Santa Teresinha... seu nome será esquecido!",
                    "Prepara-se para conhecer o verdadeiro poder das trevas!"
                ],
                dano50   : [
                    "IMPOSSÍVEL! Ninguém me fere assim!",
                    "Você é mais forte do que parecia...",
                    "Vou liberar meu poder TOTAL!",
                    "ARGH! Você vai pagar por isso!"
                ],
                dano20   : [
                    "C-como... como você pode ser tão forte?!",
                    "Não... os servos das trevas não perdem!",
                    "Meu poder... está diminuindo...",
                    "Isso não é possível! EU SOU O CHEFE!"
                ],
                aleatorio: [
                    "EU SOU ETERNO!",
                    "A santa mais fraca que já enfrentei!",
                    "Seus aliados do Céu não podem te salvar aqui!",
                    "As trevas NUNCA serão vencidas!",
                    "Você deveria ter fugido quando teve a chance!",
                    "Meu poder é absoluto!"
                ],
                morte    : [
                    "Não... não pode ser... EU SOU O CHEFE...",
                    "As trevas... se recolhem...",
                    "Isso foi... apenas uma batalha. A guerra... continua...",
                    "Meus servos vão... vingar... minha derrota..."
                ]
            }
        },
        {
            id    : "arquidemonio",
            nome  : "Arquidemônio",
            emojis: {
                normal : "👹",
                dor    : "🤬",
                medo   : "😳",
                raiva  : "💢",
                morte  : "🌋"
            },
            tags  : ["chefe", "boss", "elite", "arquidemonio"],
            chefe : true,
            elite : true,
            falas : {
                entrada  : [
                    "⚠️ EU SOU O ARQUIDEMÔNIO! ⚠️",
                    "Nem o Céu inteiro pode me deter!",
                    "Sua jornada termina aqui, filha da luz!",
                    "Tremo os pilares do inferno ao caminhar!"
                ],
                dano50   : [
                    "VOCÊ... VOCÊ OUSOU?!",
                    "A DOR?! EU SINTO DOR?! IMPOSSÍVEL!",
                    "Criança! Você não sabe com quem está mexendo!",
                    "Libero TUDO! PODER ABSOLUTO!"
                ],
                dano20   : [
                    "Não... não... NÃO!!!",
                    "Milênios de poder... sendo apagados...",
                    "Como... uma simples mortal...",
                    "O inferno inteiro vai ouvir sobre isso..."
                ],
                aleatorio: [
                    "TREMA DIANTE DE MIM!",
                    "Sou mais antigo que o próprio tempo!",
                    "Suas flores são inúteis contra mim!",
                    "EU SOU O FIM DE TUDO!",
                    "Dobra seus joelhos, criatura!",
                    "Meu poder reescreve a realidade!"
                ],
                morte    : [
                    "Im... impossível... um ser como eu...",
                    "Que força é essa... que vem de cima...",
                    "O inferno... nunca mais será o mesmo...",
                    "Você... você vai se arrepender... quando eu voltar..."
                ]
            }
        }
    ]);

    // Mapa rápido por ID
    const _MAPA_TIPOS = new Map(_TIPOS.map(t => [t.id, t]));

    // ════════════════════════════════════════
    // ESTADO DO INIMIGO ATUAL
    // ════════════════════════════════════════

    /**
     * @typedef {object} EstadoInimigo
     * @property {string}  nome
     * @property {string}  tipoId
     * @property {number}  hp
     * @property {number}  maxHp
     * @property {number}  estagio
     * @property {boolean} chefe
     * @property {boolean} elite
     * @property {number}  rMoeda
     * @property {number}  rGema
     * @property {number}  pctHp         — 0.0 a 1.0
     * @property {boolean} falaLimiar1   — já falou ao 50%?
     * @property {boolean} falaLimiar2   — já falou ao 20%?
     * @property {number}  ultimaFalaMs  — timestamp da última fala
     */
    const _estado = {
        nome          : "",
        tipoId        : "demonio",
        hp            : 0,
        maxHp         : 0,
        estagio       : 1,
        chefe         : false,
        elite         : false,
        rMoeda        : 0,
        rGema         : 0,
        pctHp         : 1.0,
        falaLimiar1   : false,
        falaLimiar2   : false,
        ultimaFalaMs  : 0,
        vivo          : false
    };

    // Timer de fala de entrada
    let _timerEntrada = null;

    // ════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════

    function ehChefe(estagio)      {
        return estagio % CFG.INTERVALO_CHEFE === 0;
    }

    function ehChefeElite(estagio) {
        return estagio % CFG.INTERVALO_ELITE === 0;
    }

    function nomeEstagio(estagio) {
        return _NOMES_ESTAGIO[(estagio - 1) % _NOMES_ESTAGIO.length];
    }

    // Seleciona o tipo de inimigo para o estágio
    function _selecionarTipo(estagio) {
        if (ehChefeElite(estagio)) return _MAPA_TIPOS.get("arquidemonio");
        if (ehChefe(estagio))      return _MAPA_TIPOS.get("chefe_trevas");

        // Normal: cicla pelos tipos não-chefe a cada 3 estágios
        const tiposNormais = _TIPOS.filter(t => !t.chefe);
        const idx = Math.floor((estagio - 1) / 3) % tiposNormais.length;
        return tiposNormais[idx];
    }

    // Calcula HP base para o estágio
    function _calcMaxHp(estagio, chefe, elite) {
        const base = Math.floor(CFG.HP_BASE * Math.pow(CFG.HP_ESCALA, estagio));
        if (elite)  return Math.floor(base * CFG.MULT_HP_ELITE);
        if (chefe)  return Math.floor(base * CFG.MULT_HP_CHEFE);
        return base;
    }

    // Calcula moeda recompensa
    function _calcMoeda(estagio, elite) {
        const base = Math.floor(CFG.MOEDA_BASE * Math.pow(CFG.MOEDA_ESCALA, estagio));
        return elite ? base * CFG.GEMA_ELITE_MULT : base;
    }

    // Calcula gemas recompensa
    function _calcGema(estagio, chefe, elite) {
        if (elite)  return Math.floor((CFG.GEMA_CHEFE_MIN + estagio / 5) * CFG.GEMA_ELITE_MULT);
        if (chefe)  return Math.floor(CFG.GEMA_CHEFE_MIN + estagio / 5);
        return Math.random() < CFG.GEMA_CHANCE ? 1 : 0;
    }

    // Fala aleatória de uma categoria
    function _falaAleatoria(tipo, categoria) {
        const lista = tipo?.falas?.[categoria];
        if (!lista || lista.length === 0) return null;
        return lista[Math.floor(Math.random() * lista.length)];
    }

    // Exibe fala na UI
    function _exibirFala(texto, duracao = 3500) {
        if (!texto) return;

        try {
            EventBus.emit("enemy:fala", { texto, duracao });
        } catch { /* não crítico */ }

        _estado.ultimaFalaMs = performance.now();

        _log.debug(`Fala: "${texto}"`);
    }

    // ════════════════════════════════════════
    // CONFIGURAR INIMIGO
    // ════════════════════════════════════════

    /**
     * Configura um novo inimigo para o estágio.
     * Deve ser chamado ao avançar de estágio.
     *
     * @param {number} estagio
     * @returns {object} — cópia somente leitura do estado
     *
     * @example
     * Enemy.configurar(5);
     * Enemy.configurar(10); // chefe
     */
    function configurar(estagio) {
        if (typeof estagio !== "number" || estagio < 1) {
            _log.error(`configurar(): estágio inválido: ${estagio}`);
            estagio = 1;
        }

        // Cancela timer de fala anterior
        if (_timerEntrada !== null) {
            clearTimeout(_timerEntrada);
            _timerEntrada = null;
        }

        const tipo  = _selecionarTipo(estagio);
        const chefe = ehChefe(estagio);
        const elite = ehChefeElite(estagio);
        const maxHp = _calcMaxHp(estagio, chefe, elite);

        // Sufixo do nome
        let sufixo = "";
        if (elite)        sufixo = " ⚡ ÉLITE";
        else if (chefe)   sufixo = " [CHEFE]";

        // Monta estado
        _estado.nome         = `${tipo.nome}${sufixo} Lv.${estagio}`;
        _estado.tipoId       = tipo.id;
        _estado.hp           = maxHp;
        _estado.maxHp        = maxHp;
        _estado.estagio      = estagio;
        _estado.chefe        = chefe;
        _estado.elite        = elite;
        _estado.rMoeda       = _calcMoeda(estagio, elite);
        _estado.rGema        = _calcGema(estagio, chefe, elite);
        _estado.pctHp        = 1.0;
        _estado.falaLimiar1  = false;
        _estado.falaLimiar2  = false;
        _estado.ultimaFalaMs = 0;
        _estado.vivo         = true;

        _log.info(
            `Inimigo: "${_estado.nome}"` +
            ` | HP: ${_fmt(maxHp)}` +
            ` | ${_fmt(_estado.rMoeda)}🪙` +
            (elite ? " ⚡ ÉLITE" : chefe ? " 👿 CHEFE" : "")
        );

        // Emite evento de configuração
        try {
            EventBus.emit("enemy:configurado", {
                ...estado()
            });
        } catch { /* não crítico */ }

        // Agenda fala de entrada (delay natural)
        _timerEntrada = setTimeout(() => {
            falarEntrada();
            _timerEntrada = null;
        }, chefe ? 600 : 900);

        return estado();
    }

    // ════════════════════════════════════════
    // RECEBER DANO
    // ════════════════════════════════════════

    /**
     * Aplica dano ao inimigo atual.
     * Verifica limiares de fala e morte.
     *
     * @param {number} valor — dano a aplicar (positivo)
     * @returns {{
     *   morreu     : boolean,
     *   hpAntes    : number,
     *   hpDepois   : number,
     *   pctHp      : number,
     *   cruzou50   : boolean,
     *   cruzou20   : boolean
     * }}
     */
    function receberDano(valor) {
        if (!_estado.vivo) {
            return { morreu: false, hpAntes: 0, hpDepois: 0, pctHp: 0,
                     cruzou50: false, cruzou20: false };
        }

        if (typeof valor !== "number" || valor <= 0 || isNaN(valor)) {
            _log.warn(`receberDano(): valor inválido: ${valor}`);
            return { morreu: false, hpAntes: _estado.hp, hpDepois: _estado.hp,
                     pctHp: _estado.pctHp, cruzou50: false, cruzou20: false };
        }

        const hpAntes   = _estado.hp;
        _estado.hp      = Math.max(0, _estado.hp - Math.floor(valor));
        _estado.pctHp   = _estado.maxHp > 0
            ? _estado.hp / _estado.maxHp
            : 0;

        const cruzou50  = !_estado.falaLimiar1 && _estado.pctHp <= CFG.FALA_DANO_LIMIAR1;
        const cruzou20  = !_estado.falaLimiar2 && _estado.pctHp <= CFG.FALA_DANO_LIMIAR2;

        if (cruzou50) { _estado.falaLimiar1 = true; _falarLimiar("dano50"); }
        if (cruzou20) { _estado.falaLimiar2 = true; _falarLimiar("dano20"); }

        const morreu = _estado.hp <= 0;
        if (morreu) matar();

        return {
            morreu,
            hpAntes,
            hpDepois : _estado.hp,
            pctHp    : _estado.pctHp,
            cruzou50,
            cruzou20
        };
    }

    // ════════════════════════════════════════
    // MATAR INIMIGO
    // ════════════════════════════════════════

    /**
     * Finaliza o inimigo atual e emite eventos de recompensa.
     * Chamado automaticamente por receberDano() quando HP ≤ 0.
     */
    function matar() {
        if (!_estado.vivo) return;

        _estado.vivo = false;
        _estado.hp   = 0;
        _estado.pctHp = 0;

        _log.info(
            `Inimigo morto: "${_estado.nome}"` +
            ` | Estagio ${_estado.estagio}` +
            ` | +${_fmt(_estado.rMoeda)}🪙` +
            (_estado.rGema > 0 ? ` +${_estado.rGema}💎` : "")
        );

        // Fala de morte (chance 40%)
        if (Math.random() < 0.40) {
            const tipo = _MAPA_TIPOS.get(_estado.tipoId);
            const fala = _falaAleatoria(tipo, "morte");
            if (fala) _exibirFala(fala, 2500);
        }

        // Emite evento principal de kill
        try {
            EventBus.emit("kill:registrado", {
                nome    : _estado.nome,
                tipoId  : _estado.tipoId,
                estagio : _estado.estagio,
                chefe   : _estado.chefe,
                elite   : _estado.elite,
                rMoeda  : _estado.rMoeda,
                rGema   : _estado.rGema
            });
        } catch (e) {
            _log.error("matar(): falha ao emitir kill:registrado:", e);
        }

        // Emite evento de chefe especificamente
        if (_estado.elite) {
            try { EventBus.emit("enemy:elite_morto", { estagio: _estado.estagio }); }
            catch { /* não crítico */ }
        } else if (_estado.chefe) {
            try { EventBus.emit("enemy:chefe_morto", { estagio: _estado.estagio }); }
            catch { /* não crítico */ }
        }
    }

    // ════════════════════════════════════════
    // SISTEMA DE FALAS
    // ════════════════════════════════════════

    /**
     * Fala de entrada ao aparecer.
     * Chamada automaticamente por configurar() após delay.
     */
    function falarEntrada() {
        if (!_estado.vivo) return;
        const tipo = _MAPA_TIPOS.get(_estado.tipoId);
        const fala = _falaAleatoria(tipo, "entrada");
        _exibirFala(fala, _estado.chefe ? 4000 : 3500);
    }

    /**
     * Tenta falar aleatoriamente.
     * Respeita cooldown e chance configurados.
     * Chamado pelo timer periódico do battle.js.
     *
     * @returns {boolean} — true se falou
     */
    function falarAleatorio() {
        if (!_estado.vivo) return false;

        const agora    = performance.now();
        const passado  = agora - _estado.ultimaFalaMs;

        if (passado < CFG.FALA_COOLDOWN_MS)  return false;
        if (Math.random() >= CFG.FALA_CHANCE) return false;

        const tipo = _MAPA_TIPOS.get(_estado.tipoId);
        const fala = _falaAleatoria(tipo, "aleatorio");
        if (!fala) return false;

        _exibirFala(fala);
        return true;
    }

    // Fala ao cruzar limiar de HP
    function _falarLimiar(categoria) {
        const tipo = _MAPA_TIPOS.get(_estado.tipoId);
        const fala = _falaAleatoria(tipo, categoria);
        if (fala) _exibirFala(fala, 3000);
    }

    // ════════════════════════════════════════
    // EMOJI ATUAL
    // ════════════════════════════════════════

    /**
     * Retorna o emoji correto baseado no estado de HP.
     * Usado pelo renderer a cada frame.
     *
     * @param {boolean} [flash=false] — true se está recebendo dano agora
     * @returns {string}
     */
    function emojiAtual(flash = false) {
        const tipo = _MAPA_TIPOS.get(_estado.tipoId);
        if (!tipo) return "👾";

        if (flash)               return tipo.emojis.dor;
        if (_estado.pctHp <= 0)  return tipo.emojis.morte;
        if (_estado.pctHp < 0.20) return tipo.emojis.medo;
        if (_estado.pctHp < 0.50) return tipo.emojis.raiva;
        return tipo.emojis.normal;
    }

    // ════════════════════════════════════════
    // LEITURA DO ESTADO
    // ════════════════════════════════════════

    /**
     * Retorna cópia somente leitura do estado atual.
     * @returns {EstadoInimigo}
     */
    function estado() {
        return {
            nome    : _estado.nome,
            tipoId  : _estado.tipoId,
            hp      : _estado.hp,
            maxHp   : _estado.maxHp,
            estagio : _estado.estagio,
            chefe   : _estado.chefe,
            elite   : _estado.elite,
            rMoeda  : _estado.rMoeda,
            rGema   : _estado.rGema,
            pctHp   : _estado.pctHp,
            vivo    : _estado.vivo
        };
    }

    /**
     * Objeto completo para UI e renderer.
     */
    function infoAtual(flash = false) {
        const tipo = _MAPA_TIPOS.get(_estado.tipoId);
        return {
            ...estado(),
            emoji       : emojiAtual(flash),
            nomeEstagio : nomeEstagio(_estado.estagio),
            corHP       : _estado.pctHp > 0.50
                ? "#44ff88"
                : _estado.pctHp > 0.20
                    ? "#f5a623"
                    : "#ff4444",
            descTipo    : tipo?.nome ?? "Inimigo",
            tags        : tipo?.tags ?? [],
        };
    }

    // ════════════════════════════════════════
    // UTILITÁRIOS
    // ════════════════════════════════════════
    function _fmt(n) {
        try   { return Utils.formatarNum(n); }
        catch {
            if (n >= 1e9) return (n / 1e9).toFixed(1)  + "B";
            if (n >= 1e6) return (n / 1e6).toFixed(1)  + "M";
            if (n >= 1e3) return (n / 1e3).toFixed(1)  + "K";
            return String(Math.floor(n ?? 0));
        }
    }

    // ════════════════════════════════════════
    // DIAGNÓSTICO
    // ════════════════════════════════════════
    function logStatus() {
        try { if (!Logger.isDev) return; } catch { return; }

        Logger.grupo("Enemy — Status Atual", () => {
            _log.debug(`Nome    : ${_estado.nome}`);
            _log.debug(`HP      : ${_fmt(_estado.hp)} / ${_fmt(_estado.maxHp)} (${Math.round(_estado.pctHp * 100)}%)`);
            _log.debug(`Chefe   : ${_estado.chefe} | Élite: ${_estado.elite}`);
            _log.debug(`Recomp. : ${_fmt(_estado.rMoeda)}🪙 ${_estado.rGema}💎`);
        }, true);
    }

    // ════════════════════════════════════════
    // REAGIR A EVENTOS
    // ════════════════════════════════════════
    try {
        EventBus.on("state:reset:total", () => {
            _estado.vivo = false;
            _estado.hp   = 0;
        });
    } catch { /* não crítico */ }

    // ════════════════════════════════════════
    // EXPORTAÇÃO
    // ════════════════════════════════════════
    return Object.freeze({
        // Ciclo de vida
        configurar,
        receberDano,
        matar,

        // Falas
        falarEntrada,
        falarAleatorio,

        // Leitura
        estado,
        infoAtual,
        emojiAtual,

        // Helpers estáticos
        ehChefe,
        ehChefeElite,
        nomeEstagio,

        // Diagnóstico
        logStatus,

        // Referências (readonly)
        get TIPOS() { return _TIPOS; },
        get CFG()   { return CFG;    }
    });

})();
