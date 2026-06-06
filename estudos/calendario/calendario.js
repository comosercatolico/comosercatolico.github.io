   'use strict';

    /* ── CONSTANTS ── */
    const CX = 450, CY = 450;
    const R_OUTER = 420;
    const R_DATE = 398;
    const R_WEEK = 370;
    const R_WEEK_IN = 270;
    const R_SEASON = 255;
    const R_SEASON_IN = 205;
    const HUB_R = 188;

    /* ── SEASONS DATA ── */
    const SEASONS = [
      {
        id: 'advento', label: 'Advento', latin: 'Adventus Domini',
        color: '#6b3fa0', colorLight: '#9b6fcf', textColor: '#fff',
        gradient: 'url(#grad-advento)',
        startDeg: 0, spanDeg: 28, weeks: 4,
        liturgicalColor: 'Roxo / Violeta', badgeColor: '#6b3fa0',
        symbol: '🕯️',
        content: {
          historia: 'O Advento é o ponto de partida do ano litúrgico, a grande espera do Messias. Com origem nas tradições do século IV na Gália e na Espanha, foi inicialmente um tempo de jejum de 40 dias antes do Natal (chamado "Quadragesima Sancti Martini"). Roma adotou o Advento de apenas 4 semanas por volta do século VI, sob o pontificado de São Gregório Magno. Etimologicamente, "Adventus" (chegada) traduz o grego "Parousía" — a vinda gloriosa do Senhor.',
          espiritualidade: 'O Advento cultiva a tríplice dimensão da espera cristã: a lembrança histórica do nascimento do Verbo em Belém; a presença interior de Cristo na alma pela graça; e a expectativa escatológica de Sua vinda na glória. Os quatro domingos evocam os milênios de anseio de Israel pelo Redentor. A Igreja reza intensamente com os "Ó Antífonos" — sete clamores solenes da semana antes do Natal.',
          personagens: 'São João Batista, a Virgem Maria, o profeta Isaías e os Patriarcas bíblicos são as figuras centrais. A liturgia medita especialmente no "Precursor" que preparou os caminhos do Senhor e na Imaculada que carregou a Palavra feita carne.',
          praticas: 'Coroa do Advento com quatro velas (três roxas, uma rosa), Calendário do Advento, Rorate Caeli (Missa votiva da Virgem ao amanhecer), Novena do Natal, confissão e preparação espiritual. No III Domingo — "Gaudete" — a cor festiva rosa pode ser usada.',
          quote: '"Vinde, Senhor, não tardes." — Antífona de Advento',
          dates: 'Final de novembro até 24 de dezembro',
        }
      },
      {
        id: 'natal', label: 'Natal', latin: 'Tempus Nativitatis',
        color: '#c9a84c', colorLight: '#e8cc88', textColor: '#1a150d',
        gradient: 'url(#grad-natal)',
        startDeg: 28, spanDeg: 22, weeks: 3,
        liturgicalColor: 'Branco / Dourado', badgeColor: '#c9a84c',
        symbol: '⭐',
        content: {
          historia: 'A festa do Natal — celebração do nascimento de Jesus Cristo — é atestada em Roma desde 336 d.C. Em 25 de dezembro, data possivelmente escolhida por seu alinhamento com o solstício de inverno romano (Natalis Solis Invicti), a Igreja proclama que o verdadeiro "Sol de Justiça" surgiu para o mundo. O Tempo de Natal se estende do 25 de dezembro ao Domingo do Batismo do Senhor.',
          espiritualidade: 'O mistério da Encarnação — Deus tornando-se homem no seio da Virgem — está no coração do Natal. A contemplação do Menino na manjedoura convida à kênosis: a grandeza de Deus que se faz pequeno por amor à humanidade. A Epifania celebra a universalidade da salvação, revelada aos Magos como representantes das nações pagãs.',
          personagens: 'O Menino Jesus, a Virgem Maria e São José, os Magos do Oriente, os Pastores de Belém e os Santos Inocentes (28 de dezembro) são as figuras contempladas neste tempo.',
          praticas: 'Presépio, Missa da Meia-Noite (In nocte), Missa da Aurora (In aurora) e Missa do Dia (In die), Adoração ao Santíssimo, procissão da Epifania, bênção da casa com giz (K+M+B).',
          quote: '"O Verbo se fez carne e habitou entre nós." — Jo 1, 14',
          dates: '25 de dezembro até o Batismo do Senhor',
        }
      },
      {
        id: 'comum-pre', label: 'Tempo Comum I', latin: 'Per Annum',
        color: '#2e7d4f', colorLight: '#5aaa78', textColor: '#fff',
        gradient: 'url(#grad-comum)',
        startDeg: 50, spanDeg: 38, weeks: 6,
        liturgicalColor: 'Verde', badgeColor: '#2e7d4f', isCommon: true,
        symbol: '🌿',
        content: {
          historia: 'O Tempo Comum ("Tempus per Annum") é o maior período do ano litúrgico, dividido em dois blocos. A denominação "comum" refere-se ao calendário "numerado" — as semanas são contadas ordinalmente. Reformado pelo Missal Romano de 1969 (Vaticano II).',
          espiritualidade: 'Tempo de crescimento e amadurecimento na fé. A Igreja percorre continuamente os evangelhos sinóticos, contemplando os ensinamentos, milagres e gestos de misericórdia de Cristo. É o tempo das bem-aventuranças vividas no cotidiano.',
          personagens: 'Os Santos do calendário universal e local marcam este período com sua rica variedade: mártires, confessores, doutores, virgens, religiosos e leigos.',
          praticas: 'Leitura contínua das Epístolas e dos Evangelhos, Lectio Divina, devoções marianas (Maio e Outubro), Festas de Santos, Liturgia das Horas.',
          quote: '"Crescei na graça e no conhecimento de Nosso Senhor." — 2 Pd 3, 18',
          dates: 'Após o Batismo do Senhor até a Quarta-feira de Cinzas',
        }
      },
      {
        id: 'quaresma', label: 'Quaresma', latin: 'Quadragesima',
        color: '#7a5080', colorLight: '#c9a4bc', textColor: '#fff',
        gradient: 'url(#grad-quaresma)',
        startDeg: 88, spanDeg: 40, weeks: 6,
        liturgicalColor: 'Roxo / Violeta', badgeColor: '#7a5080',
        symbol: '✝',
        content: {
          historia: 'A Quaresma remonta ao século IV como período final de preparação dos catecúmenos para o Batismo na Vigília Pascal. São Leão Magno a teologizou como "décima parte do ano" consagrada a Deus. Os 40 dias evocam Moisés no Sinai, Elias no deserto e os 40 dias de Cristo no deserto.',
          espiritualidade: 'A tradição quaresmal conjuga três pilares: oração, jejum e esmola. A Quaresma é uma "grande páscoa" interior: o cristão percorre com Cristo o caminho da cruz, morrendo ao pecado para ressuscitar à graça.',
          personagens: 'Cristo tentado no deserto (I Dom.), a Transfiguração (II Dom.), a Samaritana, o Cego de nascença e Lázaro (domingos do Ano A) dominam a meditação quaresmal.',
          praticas: 'Imposição das Cinzas, Via Sacra, abstinência e jejum, confissão, RICA, retiros, adoração noturna. Rosa é a cor no IV Domingo (Laetare).',
          quote: '"Convertei-vos a mim de todo o coração." — Jl 2, 12',
          dates: 'Quarta-feira de Cinzas até a Quinta-feira Santa',
        }
      },
      {
        id: 'triduo', label: 'Tríduo Pascal', latin: 'Triduum Paschale',
        color: '#9b1a2a', colorLight: '#c44050', textColor: '#fff',
        gradient: 'url(#grad-triduo)',
        startDeg: 128, spanDeg: 12, weeks: 1,
        liturgicalColor: 'Vermelho / Branco', badgeColor: '#9b1a2a',
        symbol: '🕆',
        content: {
          historia: 'O Tríduo Pascal — Quinta-feira Santa à tarde até Domingo de Páscoa — é o ápice absoluto do ano litúrgico. Popularizado por Santo Ambrósio e Santo Agostinho. Celebra o único Mistério Pascal: Paixão, Morte, Sepultura e Ressurreição de Cristo.',
          espiritualidade: 'A "passagem" do Senhor da morte à vida. A Quinta-feira Santa revela o amor até o fim. A Sexta contempla o Servo sofredor. O Sábado é o silêncio sepulcral. A Vigília Pascal é "a mãe de todas as vigílias" (Sto. Agostinho).',
          personagens: 'Cristo no centro absoluto. Maria Mãe das Dores junto à Cruz. São João Apóstolo. Maria Madalena, primeira testemunha da Ressurreição.',
          praticas: 'Missa In Cena Domini (lavagem dos pés), Ação Litúrgica da Paixão (Adoração da Cruz), Vigília Pascal com Exsultet, bênção do fogo, Pregão Pascal, Liturgia Batismal.',
          quote: '"Eis o madeiro da Cruz em que esteve suspenso o Salvador do mundo." — Antífona',
          dates: 'Quinta-feira Santa até Domingo de Páscoa',
        }
      },
      {
        id: 'pascoa', label: 'Tempo Pascal', latin: 'Tempus Paschale',
        color: '#b8891a', colorLight: '#e8cc88', textColor: '#fff',
        gradient: 'url(#grad-pascoa)',
        startDeg: 140, spanDeg: 70, weeks: 7,
        liturgicalColor: 'Branco / Dourado', badgeColor: '#b8891a',
        symbol: '☀',
        content: {
          historia: 'O Tempo Pascal celebra durante 50 dias a Ressurreição de Cristo, culminando em Pentecostes. Nos primeiros séculos, os cristãos celebravam a Páscoa como uma única festa de 50 dias — o "Grande Domingo". O domingo de Páscoa é a "festa das festas" (Sto. Agostinho).',
          espiritualidade: 'O Ressuscitado está vivo e presente. Os aparecimentos do Ressuscitado revelam a continuidade e a transformação glorificada do Corpo de Cristo. Pentecostes efunde o Espírito prometido, "alma" da Igreja.',
          personagens: 'O Ressuscitado, Maria Madalena ("Apostola Apostolorum"), os Onze, Tomé, os discípulos de Emaús, o Espírito Santo no Cenáculo.',
          praticas: '"Aleluia" em todas as orações. Círio Pascal aceso. Oitava de Páscoa. Divina Misericórdia (II Dom. Pascal). Rogações antes da Ascensão.',
          quote: '"Aleluia! Cristo ressuscitou! Ressuscitou de verdade, aleluia!" — Aclamação',
          dates: 'Domingo de Páscoa até Pentecostes (50 dias)',
        }
      },
      {
        id: 'pentecostes-solenidades', label: 'Solenidades', latin: 'Post Pentecosten',
        color: '#5c4009', colorLight: '#8b6914', textColor: '#fff',
        gradient: 'url(#grad-solenidades)',
        startDeg: 210, spanDeg: 22, weeks: 3,
        liturgicalColor: 'Vermelho / Branco / Verde', badgeColor: '#5c4009',
        symbol: '🔥',
        content: {
          historia: 'Após Pentecostes, a Igreja celebra três solenidades: a Santíssima Trindade, Corpus Christi (estabelecida em 1264 pelo papa Urbano IV, com liturgia de Sto. Tomás de Aquino) e o Sagrado Coração de Jesus.',
          espiritualidade: 'Este período revela o fruto do Mistério Pascal: o Espírito manifesta o rosto trinitário de Deus e alimenta a Igreja com o Corpo eucarístico de Cristo. A procissão de Corpus Christi é ato de fé pública.',
          personagens: 'Santa Juliana de Liège, Beata Eva de Liège, Santa Marguerite-Marie Alacoque, São João Eudes.',
          praticas: 'Procissão de Corpus Christi, adoração eucarística, Bênção com o Santíssimo, Hora Santa, Novena do Sagrado Coração.',
          quote: '"Quantas vezes repetirdes isto, o fareis em memória de mim." — 1 Cor 11, 25',
          dates: 'Semana de Pentecostes até final de junho',
        }
      },
      {
        id: 'comum-pos', label: 'Tempo Comum II', latin: 'Per Annum',
        color: '#2e7d4f', colorLight: '#5aaa78', textColor: '#fff',
        gradient: 'url(#grad-comum)',
        startDeg: 232, spanDeg: 113, weeks: 28,
        liturgicalColor: 'Verde', badgeColor: '#2e7d4f', isCommon: true,
        symbol: '🌿',
        content: {
          historia: 'O segundo bloco do Tempo Comum é o mais longo do ano, percorrendo verão, outono e parte do inverno até Cristo Rei. As semanas (até a 34ª) continuam a leitura semicontínua dos evangelhos sinóticos.',
          espiritualidade: 'Período da "pedagogia da cotidianidade": encontrar Cristo no trabalho, na família, na solidariedade. A liturgia convida ao crescimento nas virtudes teologais e cardeais.',
          personagens: 'São João Maria Vianney, Santa Teresa de Calcutá, São Francisco de Assis, Todos os Santos (1/11), Todos os Fiéis Defuntos (2/11) — calendário particularmente rico.',
          praticas: 'Missas dominicais com leitura contínua, Liturgia das Horas, Rosário (outubro), Visitas ao cemitério (novembro), Festas de padroeiros.',
          quote: '"Sede perfeitos como o vosso Pai celeste é perfeito." — Mt 5, 48',
          dates: 'Final de junho até a Solenidade de Cristo Rei',
        }
      },
      {
        id: 'cristo-rei', label: 'Cristo Rei', latin: 'Christus Rex',
        color: '#8b6914', colorLight: '#c9a84c', textColor: '#fff',
        gradient: 'url(#grad-cristorei)',
        startDeg: 345, spanDeg: 15, weeks: 1,
        liturgicalColor: 'Branco / Dourado', badgeColor: '#8b6914',
        symbol: '👑',
        content: {
          historia: 'Instituída por Pio XI em 1925 (enc. Quas Primas) como resposta ao laicismo. O Vaticano II deslocou-a para o último domingo do ano litúrgico (XXXIV Semana), conferindo tom escatológico acentuado.',
          espiritualidade: 'Cristo Rei não é monarca temporal, mas o Servo Sofredor que reina pela cruz. O Evangelho do julgamento final (Mt 25) revela o critério: a caridade com os pobres, doentes, presos.',
          personagens: 'Cristo Pantocrator e Juiz escatológico, Pilatos, o Bom Ladrão que recebe o paraíso. Os profetas que anunciaram o reinado eterno.',
          praticas: 'Missa solene de encerramento do Ano, meditação escatológica sobre o Julgamento Final e as Novíssimas (morte, julgamento, inferno, glória).',
          quote: '"Meu reino não é deste mundo." — Jo 18, 36',
          dates: 'Último Domingo do Tempo Comum (final de novembro)',
        }
      },
    ];

    /* ── HELPERS ── */
    function degToRad(d) { return (d - 90) * Math.PI / 180; }

    function polarToXY(cx, cy, r, deg) {
      const rad = degToRad(deg);
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    function arcPath(cx, cy, r1, r2, startDeg, endDeg) {
      const s1 = polarToXY(cx, cy, r1, startDeg);
      const e1 = polarToXY(cx, cy, r1, endDeg);
      const s2 = polarToXY(cx, cy, r2, endDeg);
      const e2 = polarToXY(cx, cy, r2, startDeg);
      const large = (endDeg - startDeg) > 180 ? 1 : 0;
      return [
        `M ${s1.x} ${s1.y}`,
        `A ${r1} ${r1} 0 ${large} 1 ${e1.x} ${e1.y}`,
        `L ${s2.x} ${s2.y}`,
        `A ${r2} ${r2} 0 ${large} 0 ${e2.x} ${e2.y}`,
        'Z'
      ].join(' ');
    }

    function createSVGEl(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      return el;
    }

    /* ── DETERMINE TODAY'S SEASON ── */
    function getTodaySeason() {
      const now = new Date();
      const month = now.getMonth(); // 0-indexed
      const day = now.getDate();

      // Approximate liturgical season based on date
      // This is simplified — real calculation depends on Easter date
      if (month === 11 && day >= 27) return 'advento';
      if (month === 0 && day <= 5) return 'natal';
      if (month === 11 && day < 27 && day >= 20) return 'cristo-rei';
      if (month === 0 && day <= 12) return 'natal';
      if (month === 0 || (month === 1 && day < 14)) return 'comum-pre';
      if ((month === 1 && day >= 14) || (month === 2 && day < 25)) return 'quaresma';
      if (month === 2 && day >= 25 && day <= 31) return 'triduo';
      if (month === 3 && day <= 3) return 'triduo';
      if ((month === 3 && day >= 4) || (month === 4 && day <= 19)) return 'pascoa';
      if (month === 4 && day >= 20 && day <= 31) return 'pentecostes-solenidades';
      if (month === 5 && day <= 15) return 'pentecostes-solenidades';
      return 'comum-pos';
    }

    function getTodayDegree() {
      const season = getTodaySeason();
      const s = SEASONS.find(ss => ss.id === season);
      if (!s) return 180;
      return s.startDeg + s.spanDeg / 2;
    }

    /* ── BUILD WHEEL ── */
    function buildWheel() {
      const arcsG = document.getElementById('season-arcs');
      const labelsG = document.getElementById('season-labels');
      const spokesG = document.getElementById('spokes');
      const dateG = document.getElementById('date-labels');
      const weekG = document.getElementById('week-labels');

      SEASONS.forEach((season, idx) => {
        const midDeg = season.startDeg + season.spanDeg / 2;
        const endDeg = season.startDeg + season.spanDeg;

        // ── OUTER COLOR RING ──
        const outerArc = createSVGEl('path', {
          d: arcPath(CX, CY, R_OUTER, R_DATE, season.startDeg, endDeg),
          fill: season.color,
          opacity: '0.7',
          class: 'outer-ring-seg',
        });
        arcsG.appendChild(outerArc);

        // ── SEASON ARC ──
        const arc = createSVGEl('path', {
          d: arcPath(CX, CY, R_SEASON, R_SEASON_IN, season.startDeg, endDeg),
          fill: season.gradient || season.color,
          stroke: 'rgba(255,255,255,0.2)',
          'stroke-width': '1',
          class: 'season-arc',
          tabindex: '0',
          role: 'button',
          'aria-label': season.label,
          'data-season': season.id,
          style: `animation-delay: ${idx * 80}ms`,
        });
        arcsG.appendChild(arc);

        // Highlight overlay for season arc
        const highlight = createSVGEl('path', {
          d: arcPath(CX, CY, R_SEASON, R_SEASON - 15, season.startDeg, endDeg),
          fill: 'rgba(255,255,255,0.1)',
          'pointer-events': 'none',
        });
        arcsG.appendChild(highlight);

        // ── WEEK SEGMENTS ──
        if (season.weeks >= 1) {
          const weekSpan = season.spanDeg / season.weeks;
          for (let w = 0; w < season.weeks; w++) {
            const wStart = season.startDeg + w * weekSpan;
            const wEnd = wStart + weekSpan;
            const wMid = (wStart + wEnd) / 2;

            const shade = w % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
            const wseg = createSVGEl('path', {
              d: arcPath(CX, CY, R_WEEK, R_WEEK_IN, wStart, wEnd),
              fill: shade,
              stroke: 'rgba(255,255,255,0.12)',
              'stroke-width': '0.5',
              class: 'week-seg',
              'data-season': season.id,
              'data-week': w + 1,
            });
            arcsG.appendChild(wseg);

            // Week background color (tinted)
            const weekBg = createSVGEl('path', {
              d: arcPath(CX, CY, R_WEEK, R_WEEK_IN, wStart, wEnd),
              fill: season.color,
              opacity: '0.15',
              'pointer-events': 'none',
            });
            arcsG.insertBefore(weekBg, wseg);

            // Week label
            if (weekSpan > 4) {
              const rLabel = (R_WEEK + R_WEEK_IN) / 2;
              const lPos = polarToXY(CX, CY, rLabel, wMid);
              const lAngle = wMid > 180 ? wMid - 270 : wMid - 90;

              const wLabel = createSVGEl('text', {
                x: lPos.x, y: lPos.y,
                transform: `rotate(${lAngle},${lPos.x},${lPos.y})`,
                'text-anchor': 'middle',
                'dominant-baseline': 'central',
                class: 'wheel-week-label',
                'data-season': season.id,
              });
              wLabel.textContent = season.weeks > 1 ? `${w + 1}ª` : '';
              weekG.appendChild(wLabel);
            }

            // Spoke
            const sp = polarToXY(CX, CY, R_WEEK, wStart);
            const ep = polarToXY(CX, CY, R_WEEK_IN, wStart);
            spokesG.appendChild(createSVGEl('line', {
              x1: sp.x, y1: sp.y, x2: ep.x, y2: ep.y
            }));
          }
        }

        // ── SEASON LABEL ──
        const labelR = (R_SEASON + R_SEASON_IN) / 2;
        const lPos = polarToXY(CX, CY, labelR, midDeg);
        const baseAngle = midDeg - 90;
        const lAngle = midDeg > 180 ? baseAngle + 180 : baseAngle;

        const ltext = createSVGEl('text', {
          x: lPos.x, y: lPos.y,
          transform: `rotate(${lAngle},${lPos.x},${lPos.y})`,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          class: 'wheel-season-label',
          fill: season.textColor,
        });

        if (season.spanDeg >= 35) {
          const parts = season.label.split(' ');
          const t1 = createSVGEl('tspan', {
            x: lPos.x, dy: '-6', 'text-anchor': 'middle'
          });
          t1.textContent = parts[0];
          const t2 = createSVGEl('tspan', {
            x: lPos.x, dy: '12', 'text-anchor': 'middle',
            'font-size': '8.5', 'font-style': 'italic', 'font-weight': '400',
            'font-family': 'Cormorant Garamond, serif'
          });
          t2.textContent = parts.length > 1 ? parts.slice(1).join(' ') : season.latin;
          ltext.appendChild(t1);
          ltext.appendChild(t2);
        } else if (season.spanDeg >= 15) {
          ltext.textContent = season.label;
        } else {
          ltext.setAttribute('font-size', '9');
          ltext.textContent = season.label;
        }
        labelsG.appendChild(ltext);

        // Main spoke
        const spMain = polarToXY(CX, CY, R_OUTER, season.startDeg);
        const epMain = polarToXY(CX, CY, R_SEASON_IN, season.startDeg);
        spokesG.appendChild(createSVGEl('line', {
          x1: spMain.x, y1: spMain.y, x2: epMain.x, y2: epMain.y,
          'stroke-width': '1'
        }));
      });

      // ── DATE LABELS ──
      const dates = [
        { deg: 0, label: '1º Dom. Advento' },
        { deg: 28, label: '25 Dez — Natal' },
        { deg: 50, label: 'Batismo do Senhor' },
        { deg: 88, label: 'Quarta de Cinzas' },
        { deg: 128, label: 'Quinta-Feira Santa' },
        { deg: 140, label: 'Páscoa' },
        { deg: 210, label: 'Pentecostes' },
        { deg: 232, label: 'Tempo Comum' },
        { deg: 345, label: 'Cristo Rei' },
      ];

      dates.forEach(d => {
        const rDate = (R_OUTER + R_DATE) / 2 + 2;
        const pos = polarToXY(CX, CY, rDate, d.deg + 2);
        const baseAngle = d.deg + 2 - 90;
        const angle = (d.deg + 2) > 180 ? baseAngle + 180 : baseAngle;
        const anchor = (d.deg + 2) > 180 ? 'end' : 'start';

        const txt = createSVGEl('text', {
          x: pos.x, y: pos.y,
          transform: `rotate(${angle},${pos.x},${pos.y})`,
          class: 'wheel-date-label',
          'text-anchor': anchor,
          'dominant-baseline': 'central',
        });
        txt.textContent = d.label;
        dateG.appendChild(txt);
      });

      // ── TODAY INDICATOR ──
      const todayDeg = getTodayDegree();
      const todayG = document.getElementById('today-indicator');

      const todayOuter = polarToXY(CX, CY, R_OUTER + 8, todayDeg);
      const todayInner = polarToXY(CX, CY, R_SEASON_IN - 5, todayDeg);

      // Glowing line
      const todayLine = createSVGEl('line', {
        x1: todayOuter.x, y1: todayOuter.y,
        x2: todayInner.x, y2: todayInner.y,
        stroke: '#d4a820', 'stroke-width': '2.5',
        opacity: '0.8', 'stroke-linecap': 'round',
      });
      todayG.appendChild(todayLine);

      // Pulsing dot
      const todayDot = polarToXY(CX, CY, R_OUTER + 14, todayDeg);
      const dotOuter = createSVGEl('circle', {
        cx: todayDot.x, cy: todayDot.y, r: '8',
        fill: 'none', stroke: '#d4a820', 'stroke-width': '1.5',
        opacity: '0.5',
      });
      const animR = createSVGEl('animate', {
        attributeName: 'r', values: '6;12;6',
        dur: '2s', repeatCount: 'indefinite'
      });
      const animOp = createSVGEl('animate', {
        attributeName: 'opacity', values: '0.6;0.1;0.6',
        dur: '2s', repeatCount: 'indefinite'
      });
      dotOuter.appendChild(animR);
      dotOuter.appendChild(animOp);
      todayG.appendChild(dotOuter);

      const dotInner = createSVGEl('circle', {
        cx: todayDot.x, cy: todayDot.y, r: '4',
        fill: '#d4a820', stroke: '#fff', 'stroke-width': '1.5',
      });
      todayG.appendChild(dotInner);

      // "HOJE" label
      const todayLabelPos = polarToXY(CX, CY, R_OUTER + 28, todayDeg);
      const todayLabelAngle = todayDeg > 180 ? todayDeg - 270 : todayDeg - 90;
      const todayLabel = createSVGEl('text', {
        x: todayLabelPos.x, y: todayLabelPos.y,
        transform: `rotate(${todayLabelAngle},${todayLabelPos.x},${todayLabelPos.y})`,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-family': 'Cinzel, serif', 'font-size': '7',
        'font-weight': '700', fill: '#d4a820',
        'letter-spacing': '2',
      });
      todayLabel.textContent = 'HOJE';
      todayG.appendChild(todayLabel);

      // ── START ARROW ──
      const arrowG = document.getElementById('start-arrow');
      const arrowTip = polarToXY(CX, CY, R_OUTER - 4, 0);
      const arrowL = polarToXY(CX, CY, R_OUTER + 10, -3);
      const arrowR = polarToXY(CX, CY, R_OUTER + 10, 3);
      const tri = createSVGEl('polygon', {
        points: `${arrowTip.x},${arrowTip.y} ${arrowL.x},${arrowL.y} ${arrowR.x},${arrowR.y}`,
        fill: '#6b3fa0', opacity: '0.85',
      });
      arrowG.appendChild(tri);

      const startLabel = polarToXY(CX, CY, R_OUTER + 24, 0);
      const sLabel = createSVGEl('text', {
        x: startLabel.x, y: startLabel.y,
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        'font-family': 'Cinzel, serif', 'font-size': '6',
        fill: '#6b3fa0', 'font-weight': '600', 'letter-spacing': '1.5',
      });
      sLabel.textContent = 'INÍCIO';
      arrowG.appendChild(sLabel);
    }

    /* ── BUILD MINI WHEEL ── */
    function buildMiniWheel() {
      const svg = document.getElementById('mini-wheel-svg');
      const cx = 50, cy = 50;
      const r1 = 44, r2 = 28;

      SEASONS.forEach(season => {
        const endDeg = season.startDeg + season.spanDeg;
        const s1 = polarToXY(cx, cy, r1, season.startDeg);
        const e1 = polarToXY(cx, cy, r1, endDeg);
        const s2 = polarToXY(cx, cy, r2, endDeg);
        const e2 = polarToXY(cx, cy, r2, season.startDeg);
        const large = season.spanDeg > 180 ? 1 : 0;
        const d = [
          `M ${s1.x} ${s1.y}`,
          `A ${r1} ${r1} 0 ${large} 1 ${e1.x} ${e1.y}`,
          `L ${s2.x} ${s2.y}`,
          `A ${r2} ${r2} 0 ${large} 0 ${e2.x} ${e2.y}`,
          'Z'
        ].join(' ');
        const p = createSVGEl('path', {
          d, fill: season.color, opacity: activeId === season.id ? '1' : '0.6',
        });
        svg.appendChild(p);
      });

      // Center
      const c = createSVGEl('circle', {
        cx, cy, r: '26', fill: '#c9a84c',
      });
      svg.appendChild(c);
      const cross = createSVGEl('text', {
        x: cx, y: cy + 3, 'text-anchor': 'middle',
        'font-size': '16', fill: '#fff', 'font-family': 'serif',
      });
      cross.textContent = '✟';
      svg.appendChild(cross);
    }

    /* ── DETAIL PANEL ── */
    function showDetail(seasonId) {
      const season = SEASONS.find(s => s.id === seasonId);
      if (!season) return;

      const panel = document.getElementById('detail-inner');
      const c = season.content;
      const color = season.color;

      panel.innerHTML = `
        <div class="detail-card" data-season="${season.id}">
          <div class="detail-header">
            <div class="detail-color-bar" style="background:${color}"></div>
            <div class="detail-header-content">
              <p class="detail-season-label">Tempo Litúrgico</p>
              <h2 class="detail-title" style="color:${color}">${season.label}</h2>
              <p class="detail-latin">${season.latin}</p>
            </div>
            <div class="detail-header-symbol" style="color:${color}">${season.symbol || '✦'}</div>
          </div>

          <div class="detail-tabs" role="tablist">
            <button class="detail-tab active" data-tab="historia" role="tab">História</button>
            <button class="detail-tab" data-tab="espirit" role="tab">Espiritualidade</button>
            <button class="detail-tab" data-tab="figuras" role="tab">Figuras</button>
            <button class="detail-tab" data-tab="praticas" role="tab">Práticas</button>
          </div>

          <div class="detail-tab-content active" data-tab-content="historia">
            <h4>História & Origem</h4>
            <p>${c.historia}</p>
          </div>

          <div class="detail-tab-content" data-tab-content="espirit">
            <h4>Espiritualidade</h4>
            <p>${c.espiritualidade}</p>
          </div>

          <div class="detail-tab-content" data-tab-content="figuras">
            <h4>Personagens & Figuras Centrais</h4>
            <p>${c.personagens}</p>
          </div>

          <div class="detail-tab-content" data-tab-content="praticas">
            <h4>Práticas Litúrgicas</h4>
            <p>${c.praticas}</p>
          </div>

          <div class="detail-footer">
            <span class="detail-badge" style="color:${color};border-color:${color};background:${color}15">
              🎨 ${season.liturgicalColor}
            </span>
            <span class="detail-badge" style="color:var(--text-secondary);border-color:var(--border);background:var(--bg-warm)">
              📅 ${c.dates}
            </span>
            <p class="detail-quote">${c.quote}</p>
          </div>
        </div>
      `;

      // Attach tab events
      panel.querySelectorAll('.detail-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          panel.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
          panel.querySelectorAll('.detail-tab-content').forEach(tc => tc.classList.remove('active'));
          tab.classList.add('active');
          const target = tab.dataset.tab;
          panel.querySelector(`[data-tab-content="${target}"]`).classList.add('active');
        });
      });

      document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ── INTERACTION ── */
    let activeId = null;
    let seasonOrder = SEASONS.map(s => s.id);

    function handleSeasonClick(seasonId) {
      // Toggle highlight
      document.querySelectorAll('.season-arc').forEach(el => {
        el.classList.remove('active', 'dimmed');
      });
      document.querySelectorAll('.week-seg').forEach(el => {
        el.classList.remove('dimmed');
      });

      if (activeId === seasonId) {
        activeId = null;
        document.getElementById('detail-inner').innerHTML = `
          <div class="detail-placeholder">
            <div class="placeholder-icon">✟</div>
            <p>Clique em um tempo litúrgico na roda para conhecer sua história, simbolismo e espiritualidade</p>
          </div>`;
        document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
        updateMiniWheel();
        return;
      }

      activeId = seasonId;

      // Highlight active, dim others
      document.querySelectorAll('.season-arc').forEach(el => {
        if (el.dataset.season === seasonId) {
          el.classList.add('active');
        } else {
          el.classList.add('dimmed');
        }
      });

      document.querySelectorAll('.week-seg').forEach(el => {
        if (el.dataset.season !== seasonId) {
          el.classList.add('dimmed');
        }
      });

      // Legend
      document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
      document.querySelectorAll(`.legend-item[data-season="${seasonId}"]`).forEach(li => li.classList.add('active'));
      // Handle "comum" legend for both common periods
      if (seasonId === 'comum-pre' || seasonId === 'comum-pos') {
        document.querySelectorAll('.legend-item[data-season="comum"]').forEach(li => li.classList.add('active'));
      }

      showDetail(seasonId);
      updateMiniWheel();
    }

    function updateMiniWheel() {
      const svg = document.getElementById('mini-wheel-svg');
      svg.innerHTML = '';
      buildMiniWheel();
    }

    /* Tooltip */
    const tooltip = document.getElementById('tooltip');
    function showTooltip(seasonId, x, y) {
      const s = SEASONS.find(ss => ss.id === seasonId);
      if (!s) return;

      tooltip.innerHTML = `
        <div class="tooltip-title">${s.label}</div>
        <div class="tooltip-latin">${s.latin}</div>
        <div class="tooltip-color-bar" style="background:${s.color}"></div>
      `;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
      tooltip.classList.add('visible');
    }

    function hideTooltip() {
      tooltip.classList.remove('visible');
    }

    function attachEvents() {
      const wheel = document.getElementById('liturgical-wheel');

      wheel.addEventListener('click', e => {
        const target = e.target.closest('[data-season]');
        if (!target) return;
        handleSeasonClick(target.dataset.season);
      });

      wheel.addEventListener('mousemove', e => {
        const target = e.target.closest('[data-season]');
        if (!target) { hideTooltip(); return; }
        const rect = wheel.closest('.wheel-wrapper').getBoundingClientRect();
        const wx = e.clientX - rect.left;
        const wy = e.clientY - rect.top;
        showTooltip(target.dataset.season, wx, wy);
      });

      wheel.addEventListener('mouseleave', hideTooltip);

      // Keyboard navigation
      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const currentIdx = activeId ? seasonOrder.indexOf(activeId) : -1;
          const nextIdx = (currentIdx + dir + seasonOrder.length) % seasonOrder.length;
          handleSeasonClick(seasonOrder[nextIdx]);
        }
        if (e.key === 'Escape' && activeId) {
          handleSeasonClick(activeId); // deselect
        }
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.classList.contains('season-arc')) {
          handleSeasonClick(document.activeElement.dataset.season);
        }
      });

      // Legend clicks
      document.querySelectorAll('.legend-item').forEach(li => {
        li.addEventListener('click', () => {
          const sid = li.dataset.season;
          const map = {
            advento: 'advento', natal: 'natal', quaresma: 'quaresma',
            triduo: 'triduo', pascoa: 'pascoa',
            comum: activeId === 'comum-pre' ? 'comum-pos' : 'comum-pre',
          };
          handleSeasonClick(map[sid] || sid);
        });
      });

      // Mini wheel
      const miniWheel = document.getElementById('mini-wheel');
      miniWheel.addEventListener('click', () => {
        document.querySelector('.calendar-section').scrollIntoView({ behavior: 'smooth' });
      });

      // Show/hide mini wheel on scroll
      const wheelWrapper = document.querySelector('.wheel-wrapper');
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          miniWheel.classList.toggle('visible', !entry.isIntersecting);
        });
      }, { threshold: 0.3 });
      observer.observe(wheelWrapper);
    }

    /* ── TODAY BANNER ── */
    function initTodayBanner() {
      const todaySeason = getTodaySeason();
      const s = SEASONS.find(ss => ss.id === todaySeason);
      if (!s) return;

      const banner = document.getElementById('today-banner');
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      banner.innerHTML = `
        <p class="today-label">Hoje na Liturgia</p>
        <p class="today-season">
          <span class="today-color-dot" style="background:${s.color};color:${s.color}"></span>
          ${s.label}
        </p>
        <p class="today-date">${dateStr}</p>
      `;

      banner.style.cursor = 'pointer';
      banner.addEventListener('click', () => {
        handleSeasonClick(todaySeason);
      });
    }

    /* ── SCROLL REVEAL ── */
    function initReveal() {
      const els = document.querySelectorAll('.color-card, .sac-item, .intro-verse');
      els.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 60}ms`;
      });

      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });

      els.forEach(el => obs.observe(el));
    }

    /* ── INIT ── */
    document.addEventListener('DOMContentLoaded', () => {
      buildWheel();
      buildMiniWheel();
      attachEvents();
      initTodayBanner();
      initReveal();
    });
