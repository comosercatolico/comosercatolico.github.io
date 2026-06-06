/* ══════════════════════════════════════════════════════
   CALENDÁRIO LITÚRGICO — JS
   Draws the SVG wheel and manages interactions
   ══════════════════════════════════════════════════════ */

'use strict';

/* ── CONSTANTS ── */
const CX = 450, CY = 450;        // SVG centre
const R_OUTER  = 420;             // outermost date ring
const R_DATE   = 398;             // inner edge of date ring
const R_WEEK   = 370;             // outer edge of week ring
const R_WEEK_IN = 270;            // inner edge of week ring
const R_SEASON = 255;             // outer edge of season arc
const R_SEASON_IN = 205;          // inner edge (hugs the hub)
const HUB_R    = 188;             // golden hub radius

/* ── SEASONS DATA ── */
// startDeg = degrees from top (N), clockwise
// 1 full year = 360°; starting point = 1st Sunday of Advent ≈ late November

const SEASONS = [
  {
    id: 'advento',
    label: 'Advento',
    latin: 'Adventus Domini',
    color: '#6b3fa0',
    colorLight: '#9b6fcf',
    textColor: '#fff',
    startDeg: 0,
    spanDeg: 28,   // ~4 weeks
    weeks: 4,
    liturgicalColor: 'Roxo / Violeta',
    badgeColor: '#6b3fa0',
    content: {
      historia: 'O Advento é o ponto de partida do ano litúrgico, a grande espera do Messias. Com origem nas tradições do século IV na Gália e na Espanha, foi inicialmente um tempo de jejum de 40 dias antes do Natal (chamado "Quadragesima Sancti Martini"). Roma adotou o Advento de apenas 4 semanas por volta do século VI, sob o pontificado de São Gregório Magno. Etimologicamente, "Adventus" (chegada) traduz o grego "Parousía" — a vinda gloriosa do Senhor.',
      espiritualidade: 'O Advento cultiva a tríplice dimensão da espera cristã: a lembrança histórica do nascimento do Verbo em Belém; a presença interior de Cristo na alma pela graça; e a expectativa escatológica de Sua vinda na glória. Os quatro domingos evocam os milênios de anseio de Israel pelo Redentor. A Igreja reza intensamente com os "O Antífonos" — sete clamores solenes da semana antes do Natal: Ó Sapiência, Ó Adonai, Ó Raiz de Jessé...',
      personagens: 'São João Batista, a Virgem Maria, o profeta Isaías e os Patriarcas bíblicos são as figuras centrais. A liturgia medita especialmente no "Precursor" que preparou os caminhos do Senhor e na Imaculada que carregou a Palavra feita carne.',
      praticas: 'Coroa do Advento com quatro velas (três roxas, uma rosa), Calendário do Advento, Rorate Caeli (Missa votiva da Virgem ao amanhecer), Novena do Natal, confissão e preparação espiritual. No III Domingo — "Gaudete" — a cor festiva rosa pode ser usada.',
      quote: '"Vinde, Senhor, não tardes." — Antífona de Advento',
      dates: 'Início: 1.º Domingo do Advento (final de novembro) · Fim: 24 de dezembro',
      symbol: '✦',
    }
  },
  {
    id: 'natal',
    label: 'Natal',
    latin: 'Tempus Nativitatis',
    color: '#c9a84c',
    colorLight: '#e8cc88',
    textColor: '#1a150d',
    startDeg: 28,
    spanDeg: 22,   // 25/12 até Batismo do Senhor
    weeks: 3,
    liturgicalColor: 'Branco / Dourado',
    badgeColor: '#c9a84c',
    content: {
      historia: 'A festa do Natal — celebração do nascimento de Jesus Cristo — é atestada em Roma desde 336 d.C. Em 25 de dezembro, data possivelmente escolhida por seu alinhamento com o solstício de inverno romano (Natalis Solis Invicti), a Igreja proclama que o verdadeiro "Sol de Justiça" surgiu para o mundo. O Tempo de Natal se estende do 25 de dezembro ao Domingo do Batismo do Senhor, passando pela Sagrada Família, Santa Maria Mãe de Deus (1.º de janeiro) e a Epifania.',
      espiritualidade: 'O mistério da Encarnação — Deus tornando-se homem no seio da Virgem — está no coração do Natal. A contemplação do Menino na manjedoura convida à kênosis (esvaziamento): a grandeza de Deus que se faz pequeno por amor à humanidade. A Epifania ("manifestação") celebra a universalidade da salvação, revelada aos Magos como representantes das nações pagãs.',
      personagens: 'O Menino Jesus, a Virgem Maria e São José, os Magos do Oriente, os Pastores de Belém e os Santos Inocentes (28 de dezembro) são as figuras que a liturgia contempla neste tempo.',
      praticas: 'Presépio (cena natalícia), Missa da Meia-Noite (In nocte), Missa da Aurora (In aurora) e Missa do Dia (In die), Adoração ao Santíssimo, procissão da Epifania, bênção da casa com giz (K+M+B), Oferta da Paz.',
      quote: '"O Verbo se fez carne e habitou entre nós." — Jo 1, 14',
      dates: '25 de dezembro · Encerramento: Batismo do Senhor (segunda semana de janeiro)',
      symbol: '✦',
    }
  },
  {
    id: 'comum-pre',
    label: 'Tempo Comum I',
    latin: 'Per Annum',
    color: '#2e7d4f',
    colorLight: '#5aaa78',
    textColor: '#fff',
    startDeg: 50,
    spanDeg: 38,   // do Batismo do Senhor até Quarta-feira de Cinzas
    weeks: 6,
    liturgicalColor: 'Verde',
    badgeColor: '#2e7d4f',
    isCommon: true,
    content: {
      historia: 'O Tempo Comum ("Tempus per Annum") é o maior período do ano litúrgico, dividido em dois blocos: antes e depois do Tempo Pascal. A denominação "comum" não significa ordinário ou menos importante, mas refere-se ao calendário "numerado" (do latim "numerus") — as semanas são contadas ordinalmente. Esse sistema foi reformado e sistematizado pelo Missal Romano de 1969, resultado do Concílio Vaticano II.',
      espiritualidade: 'Este é o tempo de crescimento, de aprofundamento e de amadurecimento na fé. A Igreja percorre continuamente os evangelhos sinóticos (Mateus, Marcos, Lucas em anos A, B e C), contemplando os ensinamentos, os milagres e os gestos de misericórdia de Cristo. É o tempo das bem-aventuranças vividas no cotidiano.',
      personagens: 'Os Santos do calendário universal e local marcam este período com sua rica variedade: mártires, confessores, doutores, virgens, religiosos e leigos. Cada festa dos santos ilumina uma faceta do único mistério de Cristo.',
      praticas: 'Leitura contínua das Epístolas e dos Evangelhos, aprofundamento da Lectio Divina, devoções marianas (Maio e Outubro), Festas de Santos, Corpus Christi (após Pentecostes), Sagrado Coração de Jesus, Liturgia das Horas.',
      quote: '"Crescei na graça e no conhecimento de Nosso Senhor Jesus Cristo." — 2 Pd 3, 18',
      dates: 'Após o Batismo do Senhor até a Quarta-feira de Cinzas',
      symbol: '✦',
    }
  },
  {
    id: 'quaresma',
    label: 'Quaresma',
    latin: 'Quadragesima',
    color: '#7a5080',
    colorLight: '#c9a4bc',
    textColor: '#fff',
    startDeg: 88,
    spanDeg: 40,   // 40 dias
    weeks: 6,
    liturgicalColor: 'Roxo / Violeta',
    badgeColor: '#7a5080',
    content: {
      historia: 'A Quaresma ("Quadragesima" = quarenta dias) remonta ao século IV como período final de preparação dos catecúmenos para o Batismo na Vigília Pascal, e simultaneamente de penitência pública para os pecadores reconciliados na Quinta-feira Santa. O papa São Leão Magno (séc. V) a teologizou como "décima parte do ano" consagrada a Deus. Os 40 dias evocam Moisés no Sinai, Elias no deserto e os 40 anos de Israel no êremo — sobretudo os 40 dias de Cristo no deserto.',
      espiritualidade: 'A tradição quaresmal conjuga três pilares: oração (intensificação da vida litúrgica e pessoal), jejum (mortificação do corpo e da vontade) e esmola (caridade ativa com o próximo). A Quaresma é uma "grande pascoa" interior: o cristão percorre com Cristo o caminho da cruz, morrendo ao pecado para ressuscitar à graça. As escrutínios dos catecúmenos nos III, IV e V Domingos revelam a dimensão batismal do tempo.',
      personagens: 'Cristo tentado no deserto (I Domingo), a Transfiguração (II Domingo), Simeão, a Samaritana, o Cego de nascença e a Ressurreição de Lázaro (domingos do Ano A) dominam a meditação quaresmal. São João Batista e os profetas completam o elenco.',
      praticas: 'Imposição das Cinzas (Quarta-Feira de Cinzas), Via Sacra, abstinência e jejum (sextas-feiras e Quarta e Sexta-feira Santa), confissão sacramental, RICA (Rito de Iniciação Cristã de Adultos), retiros, adoração noturna. Rosa é a cor no IV Domingo (Laetare).',
      quote: '"Convertei-vos a mim de todo o coração — com jejum, choro e pranto." — Jl 2, 12',
      dates: 'Quarta-Feira de Cinzas (fevereiro/março) até o início do Tríduo Pascal (Quinta-Feira Santa)',
      symbol: '✦',
    }
  },
  {
    id: 'triduo',
    label: 'Tríduo Pascal',
    latin: 'Triduum Paschale',
    color: '#9b1a2a',
    colorLight: '#c44050',
    textColor: '#fff',
    startDeg: 128,
    spanDeg: 12,
    weeks: 1,
    liturgicalColor: 'Vermelho / Branco',
    badgeColor: '#9b1a2a',
    content: {
      historia: 'O Tríduo Pascal — Quinta-Feira Santa à tarde até Domingo de Páscoa à noite — é o ápice absoluto de todo o ano litúrgico, o "ponto de gravidade" da fé cristã. O termo "Triduum" foi popularizado por Santo Ambrósio de Milão (†397) e São Agostinho (†430). Celebra o único Mistério Pascal: a Paixão, Morte, Sepultura e Ressurreição de Cristo — não como três eventos separados, mas como um único ato redentor.',
      espiritualidade: 'O Tríduo é a "páscoa" no sentido mais literal: a "passagem" do Senhor da morte à vida, na qual o cristão batizado participa sacramentalmente. A Quinta-Feira Santa revela o amor até o fim (mandato da lavagem dos pés e instituição da Eucaristia). A Sexta-Feira Santa contempla o Servo sofredor que "carregou os nossos pecados". O Sábado Santo é o silêncio sepulcral da terra orphã. A Vigília Pascal é "a mãe de todas as vigílias" (Santo Agostinho).',
      personagens: 'Cristo Senhor no centro absoluto. Maria, a Mãe dos Doores, permanece junto à Cruz (Stabat Mater). São João Apóstolo, o Discípulo Amado. Maria Madalena, primeira testemunha da Ressurreição. Os Doze, os soldados romanos, Simão de Cirene.',
      praticas: 'Missa In Cena Domini (Quinta-Feira, com lavagem dos pés e procissão ao Monumento), Ação Litúrgica da Paixão do Senhor (Sexta-Feira, com a Adoração da Santa Cruz), Vigília Pascal com o Exsultet, bênção do fogo, Pregão Pascal, Liturgia Batismal e Eucaristia da Ressurreição.',
      quote: '"Eis o madeiro da Cruz em que esteve suspenso o Salvador do mundo. Vinde adorai." — Antífona da Sexta-Feira Santa',
      dates: 'Quinta-Feira Santa (após a Missa vespertina) até Domingo de Páscoa (2.ª Vésperas)',
      symbol: '✦',
    }
  },
  {
    id: 'pascoa',
    label: 'Tempo Pascal',
    latin: 'Tempus Paschale',
    color: '#b8891a',
    colorLight: '#e8cc88',
    textColor: '#fff',
    startDeg: 140,
    spanDeg: 70,   // 50 days to Pentecost
    weeks: 7,
    liturgicalColor: 'Branco / Dourado',
    badgeColor: '#b8891a',
    content: {
      historia: 'O Tempo Pascal celebra durante 50 dias a Ressurreição de Cristo, culminando em Pentecostes. Nos primeiros séculos, os cristãos celebravam a Páscoa como uma única festa de 50 dias — o "Grande Domingo". A Ascensão do Senhor (40.º dia) e Pentecostes (50.º dia) foram paulatinamente individualizadas como solenidades. O domingo de Páscoa é a "festa das festas", a "solennitas sollenitatum" (Santo Agostinho), superior a todos os outros dias do calendário.',
      espiritualidade: 'O Ressuscitado está vivo e presente — esta é a proclamação central do Tempo Pascal. Os aparecimentos do Ressuscitado (Maria Madalena, discípulos de Emaús, Tomé, orla do lago de Tiberíades) revelam a continuidade e a transformação glorificada do Corpo de Cristo. A Ascensão não é ausência, mas presença transformada. Pentecostes efunde o Espírito prometido, "alma" da Igreja.',
      personagens: 'O Ressuscitado, Maria Madalena ("Apostola Apostolorum"), os Onze, Tomé o incrédulo-crente, os discípulos de Emaús, o Espírito Santo derramado sobre Maria e os discípulos no Cenáculo de Jerusalém.',
      praticas: '"Aleluia" ressoa em todas as orações. Rito do Círio Pascal permanece aceso junto ao altar. Oito dias da Oitava de Páscoa celebrados como um único "Grande Domingo". Primeiras Comunhões de crianças. Domingo da Divina Misericórdia (II Domingo Pascal). Festa do Padroeiro em muitas paróquias. Rogações antes da Ascensão.',
      quote: '"Aleluia! Cristo ressuscitou! Ressuscitou de verdade, aleluia!" — Aclamação Pascal',
      dates: 'Domingo de Páscoa até Pentecostes (domingo, 50 dias depois)',
      symbol: '✦',
    }
  },
  {
    id: 'pentecostes-solenidades',
    label: 'Solenidades',
    latin: 'Post Pentecosten',
    color: '#5c4009',
    colorLight: '#8b6914',
    textColor: '#fff',
    startDeg: 210,
    spanDeg: 22,
    weeks: 3,
    liturgicalColor: 'Vermelho / Branco / Verde',
    badgeColor: '#5c4009',
    content: {
      historia: 'Imediatamente após Pentecostes, a Igreja celebra três solenidades de altíssimo grau: a Santíssima Trindade (domingo seguinte), o Corpo e Sangue de Cristo — Corpus Christi (segunda quinta-feira após Pentecostes) e, no Sexta-Feira seguinte, o Sagrado Coração de Jesus. Corpus Christi foi estabelecida pelo papa Urbano IV em 1264, após o Milagre de Bolsena, com a bela liturgia composta por Santo Tomás de Aquino (Pange Lingua, Tantum Ergo).',
      espiritualidade: 'Este período revela o fruto do Mistério Pascal: o Espírito derramado manifesta o rosto trinitário de Deus e alimenta a Igreja com o Corpo eucarístico de Cristo. A procissão de Corpus Christi é um ato de fé pública, levando a presença real de Cristo pelas ruas do mundo. O Sagrado Coração revela o amor infinito que moveu a Encarnação e a Cruz.',
      personagens: 'Santa Juliana de Liège (mística que inspirou Corpus Christi), Beata Eva de Liège, Santa Marguerite-Marie Alacoque (revelações do Sagrado Coração), São João Eudes.',
      praticas: 'Procissão de Corpus Christi com o Santíssimo (domus), adoração eucarística, Bênção com o Santíssimo, Exposição e Benedição, Hora Santa, Novena e Missa do Sagrado Coração.',
      quote: '"Quantas vezes repetirdes isto, o fareis em memória de mim." — 1 Cor 11, 25',
      dates: 'Da semana de Pentecostes até a entrada no Tempo Comum (final de junho)',
      symbol: '✦',
    }
  },
  {
    id: 'comum-pos',
    label: 'Tempo Comum II',
    latin: 'Per Annum',
    color: '#2e7d4f',
    colorLight: '#5aaa78',
    textColor: '#fff',
    startDeg: 232,
    spanDeg: 113,  // goes back to Christ the King
    weeks: 28,
    liturgicalColor: 'Verde',
    badgeColor: '#2e7d4f',
    isCommon: true,
    content: {
      historia: 'O segundo bloco do Tempo Comum é o mais longo do ano litúrgico, percorrendo o verão, o outono e parte do inverno até encerrar com o grande domingo de Cristo Rei. Estas semanas ordinais (que podem chegar à 34.ª semana) continuam a leitura semicontínua dos evangelhos sinóticos e das cartas apostólicas, aprofundando o discipulado cristão na vida cotidiana.',
      espiritualidade: 'Este é o período da "pedagogia da cotidianidade": encontrar Cristo no trabalho, na família, na solidariedade. Os documentos do Vaticano II (especialmente a Gaudium et Spes) propõem que o cristão "leia os sinais dos tempos" à luz do Evangelho. A liturgia convida ao crescimento nas virtudes teologais (fé, esperança, caridade) e cardeais.',
      personagens: 'O calendário dos santos é particularmente rico neste período: São João Maria Vianney (4/8), São Pio X (21/8), Santa Teresa de Calcutá (5/9), São Miguel Arcanjo (29/9), São Francisco de Assis (4/10), São Lucas (18/10), Todos os Santos (1/11), Todos os Fiéis Defuntos (2/11), São Carlos Borromeu (4/11).',
      praticas: 'Missas dominicais e diárias com leitura contínua dos evangelhos, Liturgia das Horas, Novenas de santos, Devoção ao Rosário (especialmente em outubro, Mês do Rosário), Visitas ao cemitério em Novembro, Missa pelos defuntos, Festas de padroeiros e titulares.',
      quote: '"Sede perfeitos como o vosso Pai celeste é perfeito." — Mt 5, 48',
      dates: 'Final de junho (após Corpus Christi) até a Solenidade de Cristo Rei',
      symbol: '✦',
    }
  },
  {
    id: 'cristo-rei',
    label: 'Cristo Rei',
    latin: 'Christus Rex',
    color: '#8b6914',
    colorLight: '#c9a84c',
    textColor: '#fff',
    startDeg: 345,
    spanDeg: 15,
    weeks: 1,
    liturgicalColor: 'Branco / Dourado',
    badgeColor: '#8b6914',
    content: {
      historia: 'A Solenidade de Nosso Senhor Jesus Cristo, Rei do Universo encerra o ano litúrgico com uma proclamação triunfal. Foi instituída pelo papa Pio XI em 1925 (encíclica Quas Primas) como resposta ao laicismo crescente do século XX, afirmando a soberania de Cristo sobre todos os domínios da vida. O Vaticano II deslocou-a para o último domingo do ano litúrgico (XXXIV Semana do Tempo Comum), conferindo-lhe um tom escatológico ainda mais acentuado.',
      espiritualidade: 'Cristo Rei não é um monarca temporal, mas o Servo Sofredor que reina pela cruz e pelo amor. O Evangelho do julgamento final (Mt 25) revela o critério de Seu reino: a caridade com os pobres, os doentes, os presos, os forasteiros. Este domingo constitui ao mesmo tempo o coroamento do ano que passa e o limiar que abre para o Advento do ano seguinte.',
      personagens: 'Cristo Pantocrator e Juiz escatológico, Pilatos diante de Quem o Verdadeiro Rei testemunha (Jo 18), o Bom Ladrão que recebe o paraíso (Lc 23). Os profetas que anunciaram o reinado eterno do filho de Davi.',
      praticas: 'Missa solene de encerramento do Ano Litúrgico, Bênção Papal Urbi et Orbi em algumas igrejas, procissão com a Coroa de Cristo, meditação escatológica sobre o Julgamento Final e as Novíssimas (morte, julgamento, inferno, glória).',
      quote: '"Meu reino não é deste mundo." — Jo 18, 36',
      dates: 'Último Domingo do Tempo Comum (XXXIV Semana) — final de novembro',
      symbol: '✦',
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

/* ── BUILD WHEEL ── */
function buildWheel() {
  const arcsG   = document.getElementById('season-arcs');
  const labelsG = document.getElementById('season-labels');
  const spokesG = document.getElementById('spokes');
  const dateG   = document.getElementById('date-labels');
  const weekG   = document.getElementById('week-labels');

  SEASONS.forEach(season => {
    const midDeg = season.startDeg + season.spanDeg / 2;
    const endDeg = season.startDeg + season.spanDeg;

    /* ── SEASON ARC ── */
    const arc = createSVGEl('path', {
      d: arcPath(CX, CY, R_SEASON, R_SEASON_IN, season.startDeg, endDeg),
      fill: season.color,
      stroke: 'rgba(255,255,255,0.25)',
      'stroke-width': '1',
      class: 'season-arc',
      tabindex: '0',
      role: 'button',
      'aria-label': season.label,
      'data-season': season.id,
    });
    arcsG.appendChild(arc);

    /* ── WEEK SUB-SEGMENTS ── */
    if (season.weeks > 1) {
      const weekSpan = season.spanDeg / season.weeks;
      for (let w = 0; w < season.weeks; w++) {
        const wStart = season.startDeg + w * weekSpan;
        const wEnd   = wStart + weekSpan;
        const wMid   = (wStart + wEnd) / 2;

        // alternating shade
        const shade = w % 2 === 0 ? 0 : 0.09;
        const wseg = createSVGEl('path', {
          d: arcPath(CX, CY, R_WEEK, R_WEEK_IN, wStart, wEnd),
          fill: `rgba(0,0,0,${shade})`,
          stroke: 'rgba(255,255,255,0.18)',
          'stroke-width': '0.6',
          class: 'week-seg',
          'data-season': season.id,
          'data-week': w + 1,
        });
        arcsG.appendChild(wseg);

        /* week number label */
        const rLabel = (R_WEEK + R_WEEK_IN) / 2;
        const lPos   = polarToXY(CX, CY, rLabel, wMid);
        const lAngle = wMid - 90;

        const wLabel = createSVGEl('text', {
          x: lPos.x,
          y: lPos.y,
          transform: `rotate(${lAngle},${lPos.x},${lPos.y})`,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          class: 'wheel-week-label',
          'data-season': season.id,
        });
        wLabel.textContent = `${w + 1}ª sem.`;
        weekG.appendChild(wLabel);

        /* spoke lines */
        const sp = polarToXY(CX, CY, R_OUTER, wStart);
        const ep = polarToXY(CX, CY, R_SEASON_IN, wStart);
        spokesG.appendChild(createSVGEl('line', {
          x1: sp.x, y1: sp.y, x2: ep.x, y2: ep.y
        }));
      }
    }

    /* ── SEASON LABEL (curved text) ── */
    // Place label at mid-radius of season arc
    const labelR = (R_SEASON + R_SEASON_IN) / 2 - 2;
    // For short arcs use a straight rotated text; for long arcs use a text path
    const arcSpan = season.spanDeg;
    const lPos    = polarToXY(CX, CY, labelR, midDeg);
    const lAngle  = midDeg - 90 + (midDeg > 180 ? 180 : 0);

    const ltext = createSVGEl('text', {
      x: lPos.x, y: lPos.y,
      transform: `rotate(${lAngle},${lPos.x},${lPos.y})`,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      class: 'wheel-season-label',
      fill: season.textColor,
    });

    if (arcSpan >= 40) {
      // Multi-line
      const t1 = createSVGEl('tspan', { x: lPos.x, dy: '-7', 'text-anchor': 'middle' });
      t1.textContent = season.label.split(' ')[0];
      const t2 = createSVGEl('tspan', { x: lPos.x, dy: '13', 'text-anchor': 'middle', 'font-size': '9' });
      t2.textContent = season.label.split(' ').slice(1).join(' ') || season.latin;
      ltext.appendChild(t1);
      ltext.appendChild(t2);
    } else {
      ltext.textContent = season.label;
    }
    labelsG.appendChild(ltext);

    /* main spoke at season boundary */
    const spMain  = polarToXY(CX, CY, R_OUTER, season.startDeg);
    const epMain  = polarToXY(CX, CY, R_SEASON_IN, season.startDeg);
    const mainSpoke = createSVGEl('line', {
      x1: spMain.x, y1: spMain.y, x2: epMain.x, y2: epMain.y,
      'stroke-width': '1.2'
    });
    spokesG.appendChild(mainSpoke);
  });

  /* ── DATE LABELS ── */
  const dates = [
    { deg: 0,   label: '1º Dom. Advento' },
    { deg: 28,  label: '25/12 — Natal' },
    { deg: 50,  label: 'Batismo Senhor' },
    { deg: 88,  label: 'Cinzas' },
    { deg: 128, label: 'Quinta-Feira Santa' },
    { deg: 140, label: 'Páscoa' },
    { deg: 210, label: 'Pentecostes' },
    { deg: 232, label: 'Tempo Comum II' },
    { deg: 345, label: 'Cristo Rei' },
  ];
  dates.forEach(d => {
    const rDate = (R_OUTER + R_DATE) / 2;
    const pos   = polarToXY(CX, CY, rDate, d.deg + 2);
    const angle = d.deg + 2 - 90;
    const txt   = createSVGEl('text', {
      x: pos.x, y: pos.y,
      transform: `rotate(${angle},${pos.x},${pos.y})`,
      class: 'wheel-date-label',
      'text-anchor': 'start',
      'dominant-baseline': 'central',
    });
    txt.textContent = d.label;
    dateG.appendChild(txt);
  });

  /* ── ARROW for "Início do Ano Litúrgico" ── */
  const arrowG  = document.getElementById('start-arrow');
  const arrowPos = polarToXY(CX, CY, R_OUTER - 10, 0);
  // small filled triangle
  const tri = createSVGEl('polygon', {
    points: `${arrowPos.x},${arrowPos.y - 14} ${arrowPos.x - 7},${arrowPos.y + 2} ${arrowPos.x + 7},${arrowPos.y + 2}`,
    fill: '#6b3fa0',
    opacity: '0.9',
  });
  arrowG.appendChild(tri);
}

/* ── DETAIL PANEL ── */
const COLORS = {
  advento:               '#6b3fa0',
  natal:                 '#c9a84c',
  'comum-pre':           '#2e7d4f',
  'comum-pos':           '#2e7d4f',
  quaresma:              '#7a5080',
  triduo:                '#9b1a2a',
  pascoa:                '#b8891a',
  'pentecostes-solenidades': '#5c4009',
  'cristo-rei':          '#8b6914',
};

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
      </div>

      <div class="detail-body">
        <div class="detail-col">
          <h4>História & Origem</h4>
          <p>${c.historia}</p>
          <h4 style="margin-top:1rem">Personagens & Figuras</h4>
          <p>${c.personagens}</p>
        </div>
        <div class="detail-col">
          <h4>Espiritualidade</h4>
          <p>${c.espiritualidade}</p>
          <h4 style="margin-top:1rem">Práticas Litúrgicas</h4>
          <p>${c.praticas}</p>
        </div>
      </div>

      <div class="detail-footer">
        <span class="detail-badge" style="color:${color};border-color:${color};background:${color}18">
          🎨 ${season.liturgicalColor}
        </span>
        <span class="detail-badge" style="color:var(--text-secondary);border-color:var(--border)">
          📅 ${c.dates}
        </span>
        <p class="detail-quote">${c.quote}</p>
      </div>
    </div>
  `;

  // Scroll into view
  document.getElementById('detail-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── INTERACTION ── */
let activeId = null;

function handleSeasonClick(seasonId) {
  // Toggle active arc highlight
  document.querySelectorAll('.season-arc').forEach(el => el.classList.remove('active'));
  if (activeId === seasonId) {
    activeId = null;
    document.getElementById('detail-inner').innerHTML = `
      <div class="detail-placeholder">
        <div class="placeholder-icon">✦</div>
        <p>Clique em um tempo litúrgico para conhecer sua história, simbolismo e espiritualidade</p>
      </div>`;
    return;
  }
  activeId = seasonId;
  document.querySelectorAll(`[data-season="${seasonId}"].season-arc`).forEach(el => el.classList.add('active'));

  // Legend highlight
  document.querySelectorAll('.legend-item').forEach(li => li.classList.remove('active'));
  document.querySelectorAll(`.legend-item[data-season="${seasonId}"]`).forEach(li => li.classList.add('active'));

  showDetail(seasonId);
}

/* Tooltip */
const tooltip = document.getElementById('tooltip');
function showTooltip(text, x, y) {
  tooltip.textContent = text;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
  tooltip.classList.add('visible');
}
function hideTooltip() {
  tooltip.classList.remove('visible');
}

function attachEvents() {
  const wheel = document.getElementById('liturgical-wheel');
  const rect  = () => wheel.getBoundingClientRect();

  wheel.addEventListener('click', e => {
    const target = e.target.closest('[data-season]');
    if (!target) return;
    handleSeasonClick(target.dataset.season);
  });

  wheel.addEventListener('mousemove', e => {
    const target = e.target.closest('[data-season]');
    if (!target) { hideTooltip(); return; }
    const s = SEASONS.find(s => s.id === target.dataset.season);
    if (!s) return;
    const r = rect();
    // Convert to wrapper-relative coords
    const wx = e.clientX - r.left;
    const wy = e.clientY - r.top;
    showTooltip(s.label, wx, wy);
  });

  wheel.addEventListener('mouseleave', hideTooltip);

  // Keyboard
  wheel.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = document.activeElement.closest('[data-season]') || document.activeElement;
    if (target && target.dataset.season) handleSeasonClick(target.dataset.season);
  });

  // Legend clicks
  document.querySelectorAll('.legend-item').forEach(li => {
    li.addEventListener('click', () => {
      // Map legend data-season to closest season id
      const sid = li.dataset.season;
      const map = {
        advento: 'advento',
        natal:   'natal',
        quaresma:'quaresma',
        triduo:  'triduo',
        pascoa:  'pascoa',
        comum:   activeId === 'comum-pre' ? 'comum-pos' : 'comum-pre',
      };
      handleSeasonClick(map[sid] || sid);
    });
  });
}

/* ── SCROLL REVEAL ── */
function initReveal() {
  const els = document.querySelectorAll('.color-card, .sac-item, .intro-verse');
  els.forEach(el => el.classList.add('reveal'));
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  buildWheel();
  attachEvents();
  initReveal();
});
