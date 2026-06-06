/* ═══════════════════════════════════════════════════════════
   LUX FIDEI · ANO LITÚRGICO — calendario.js
═══════════════════════════════════════════════════════════ */

// ── Scroll progress ──────────────────────────────────────
window.addEventListener('scroll', () => {
    const bar   = document.getElementById('scroll-bar');
    const total = document.body.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    bar.style.width = Math.min((window.scrollY / total) * 100, 100) + '%';
}, { passive: true });

// ═══════════════════════════════════════════════════════════
// CONSTANTES SVG
// ═══════════════════════════════════════════════════════════
const NS   = 'http://www.w3.org/2000/svg';
const CX   = 300;
const CY   = 300;
const ROUT = 260;   // raio externo dos arcos
const RIN  = 132;   // raio interno (borda do centro)
const GAP  = 2;     // espaço em graus entre cada arco

// ═══════════════════════════════════════════════════════════
// DADOS DOS TEMPOS
// ═══════════════════════════════════════════════════════════
const TEMPOS = [
    {
        id: 'advento',
        nome: 'Advento',
        grad: 'g-advento',
        cor: '#6b2fa0',
        span: 48,
        label: 'ADVENTO',
        sub: '4 semanas',
        periodo: 'Primeiro Tempo do Ano Litúrgico',
        desc: 'O Advento inaugura o Ano Litúrgico. Tempo de vigilância, esperança e conversão — a Igreja aguarda a vinda do Senhor.'
    },
    {
        id: 'natal',
        nome: 'Natal',
        grad: 'g-natal',
        cor: '#c8980a',
        span: 30,
        label: 'NATAL',
        sub: 'O Verbo encarnado',
        periodo: 'Da Vigília do Natal ao Batismo do Senhor',
        desc: 'O Tempo do Natal celebra o mistério da Encarnação — o eterno Filho de Deus que assumiu nossa natureza humana.'
    },
    {
        id: 'comum1',
        nome: 'Tempo Comum I',
        grad: 'g-comum1',
        cor: '#2468b8',
        span: 52,
        label: 'COMUM I',
        sub: 'O ministério',
        periodo: 'Entre o Natal e a Quaresma',
        desc: 'O Tempo Comum acompanha o ministério público de Jesus: seus ensinamentos, milagres e o chamado dos discípulos.'
    },
    {
        id: 'quaresma',
        nome: 'Quaresma',
        grad: 'g-quaresma',
        cor: '#8b5a2b',
        span: 55,
        label: 'QUARESMA',
        sub: '40 dias',
        periodo: 'Da Quarta-feira de Cinzas ao Tríduo',
        desc: 'A Quaresma é o grande tempo de conversão. Quarenta dias no deserto interior, a caminho da Páscoa.'
    },
    {
        id: 'triduo',
        nome: 'Tríduo Pascal',
        grad: 'g-triduo',
        cor: '#1a6b35',
        span: 14,
        label: 'TRÍDUO',
        sub: 'O coração do Ano',
        periodo: 'Quinta · Sexta · Sábado Santo · Páscoa',
        desc: 'O Tríduo Pascal é o ápice de todo o Ano Litúrgico: a Paixão, Morte e Ressurreição gloriosa de Cristo.'
    },
    {
        id: 'pascal',
        nome: 'Tempo Pascal',
        grad: 'g-pascal',
        cor: '#2e9e4a',
        span: 68,
        label: 'PASCAL',
        sub: '50 dias',
        periodo: 'Da Páscoa a Pentecoste',
        desc: 'O Tempo Pascal celebra por cinquenta dias o mistério da Ressurreição, da Ascensão e do dom do Espírito Santo.'
    },
    {
        id: 'comum2',
        nome: 'Tempo Comum II',
        grad: 'g-comum2',
        cor: '#2468b8',
        span: 93,
        label: 'COMUM II',
        sub: 'Caminhando com Cristo',
        periodo: 'De Pentecoste a Cristo Rei',
        desc: 'A segunda parte do Tempo Comum percorre o Evangelho do Ano, culminando na solenidade de Cristo Rei do Universo.'
    }
];

// ═══════════════════════════════════════════════════════════
// DADOS DAS SEMANAS
// ═══════════════════════════════════════════════════════════
const SEMANAS = {
    advento: [
        { id: 'advento-1', num: '1ª Semana do Advento',   titulo: 'O Senhor que vem' },
        { id: 'advento-2', num: '2ª Semana do Advento',   titulo: 'Preparar os caminhos' },
        { id: 'advento-3', num: '3ª Semana · Gaudete',    titulo: 'Alegrai-vos no Senhor' },
        { id: 'advento-4', num: '4ª Semana do Advento',   titulo: 'A Virgem e o Emmanuel' }
    ],
    natal: [
        { id: 'natal-1', num: 'Oitava do Natal',          titulo: 'A Palavra feita carne' },
        { id: 'natal-2', num: 'Sagrada Família',           titulo: 'O lar de Nazaré' },
        { id: 'natal-3', num: 'Solenidade da Epifania',   titulo: 'A luz revelada às nações' },
        { id: 'natal-4', num: 'Batismo do Senhor',        titulo: 'O Filho amado do Pai' }
    ],
    comum1: [
        { id: 'comum-2', num: '2ª Semana do Tempo Comum', titulo: 'O início do ministério' },
        { id: 'comum-3', num: '3ª Semana do Tempo Comum', titulo: 'Convertei-vos e crede' },
        { id: 'comum-4', num: '4ª Semana do Tempo Comum', titulo: 'A autoridade da Palavra' },
        { id: 'comum-5', num: '5ª Semana do Tempo Comum', titulo: 'Luz do mundo, sal da terra' },
        { id: 'comum-6', num: '6ª Semana do Tempo Comum', titulo: 'A Lei e o coração novo' },
        { id: 'comum-7', num: '7ª Semana do Tempo Comum', titulo: 'Amai os vossos inimigos' },
        { id: 'comum-8', num: '8ª Semana do Tempo Comum', titulo: 'Servir a Deus ou às riquezas' }
    ],
    quaresma: [
        { id: 'quaresma-0',    num: 'Quarta-feira de Cinzas',   titulo: 'Memento homo quia pulvis es' },
        { id: 'quaresma-1',    num: '1ª Semana da Quaresma',    titulo: 'A tentação no deserto' },
        { id: 'quaresma-2',    num: '2ª Semana da Quaresma',    titulo: 'A Transfiguração do Senhor' },
        { id: 'quaresma-3',    num: '3ª Semana da Quaresma',    titulo: 'A água viva da Samaritana' },
        { id: 'quaresma-4',    num: '4ª Semana · Laetare',      titulo: 'O cego de nascença' },
        { id: 'quaresma-5',    num: '5ª Semana da Quaresma',    titulo: 'A ressurreição de Lázaro' },
        { id: 'quaresma-ramos',num: 'Semana Santa',             titulo: 'A entrada triunfal em Jerusalém' }
    ],
    triduo: [
        { id: 'triduo-quinta',  num: 'Quinta-feira Santa',  titulo: 'A Ceia e o mandamento novo' },
        { id: 'triduo-sexta',   num: 'Sexta-feira Santa',   titulo: 'A Paixão e Morte do Senhor' },
        { id: 'triduo-sabado',  num: 'Sábado Santo',        titulo: 'O silêncio sagrado do sepulcro' },
        { id: 'triduo-pascoa',  num: 'Domingo de Páscoa',   titulo: 'Resurrexit, sicut dixit!' }
    ],
    pascal: [
        { id: 'pascal-1',         num: 'Oitava da Páscoa',               titulo: 'O encontro com o Ressuscitado' },
        { id: 'pascal-2',         num: '2ª Semana · Divina Misericórdia', titulo: 'Minha mão na ferida' },
        { id: 'pascal-3',         num: '3ª Semana do Tempo Pascal',       titulo: 'O pão da vida' },
        { id: 'pascal-4',         num: '4ª Semana do Tempo Pascal',       titulo: 'O Bom Pastor' },
        { id: 'pascal-5',         num: '5ª Semana do Tempo Pascal',       titulo: 'A videira verdadeira' },
        { id: 'pascal-6',         num: '6ª Semana do Tempo Pascal',       titulo: 'O Espírito da verdade' },
        { id: 'pascal-ascensao',  num: 'Solenidade da Ascensão',          titulo: 'Subiu aos céus em glória' },
        { id: 'pascal-7',         num: '7ª Semana do Tempo Pascal',       titulo: 'A oração sacerdotal de Jesus' },
        { id: 'pascal-pentecoste',num: 'Solenidade de Pentecoste',        titulo: 'O dom do Espírito Santo' }
    ],
    comum2: [
        { id: 'comum-9',  num: '9ª Semana',                titulo: 'A fé do centurião' },
        { id: 'comum-10', num: '10ª Semana',               titulo: 'A vocação de Mateus' },
        { id: 'comum-11', num: '11ª Semana',               titulo: 'A missão dos Doze' },
        { id: 'comum-12', num: '12ª Semana',               titulo: 'Não temais os homens' },
        { id: 'comum-13', num: '13ª Semana',               titulo: 'Seguir a Cristo sem reservas' },
        { id: 'comum-14', num: '14ª Semana',               titulo: 'O jugo suave do Senhor' },
        { id: 'comum-15', num: '15ª Semana',               titulo: 'A parábola do semeador' },
        { id: 'comum-16', num: '16ª Semana',               titulo: 'O trigo e o joio' },
        { id: 'comum-17', num: '17ª Semana',               titulo: 'O tesouro e a pérola preciosa' },
        { id: 'comum-18', num: '18ª Semana',               titulo: 'A multiplicação dos pães' },
        { id: 'comum-19', num: '19ª Semana',               titulo: 'Caminhar sobre as águas' },
        { id: 'comum-20', num: '20ª Semana',               titulo: 'A fé da mulher cananeia' },
        { id: 'comum-21', num: '21ª Semana',               titulo: 'Tu és Pedro' },
        { id: 'comum-22', num: '22ª Semana',               titulo: 'Tomar a cruz e seguir' },
        { id: 'comum-23', num: '23ª Semana',               titulo: 'A correção fraterna' },
        { id: 'comum-24', num: '24ª Semana',               titulo: 'O perdão sem limites' },
        { id: 'comum-25', num: '25ª Semana',               titulo: 'Os operários da vinha' },
        { id: 'comum-26', num: '26ª Semana',               titulo: 'Os dois filhos' },
        { id: 'comum-27', num: '27ª Semana',               titulo: 'Os vinhateiros homicidas' },
        { id: 'comum-28', num: '28ª Semana',               titulo: 'O banquete nupcial' },
        { id: 'comum-29', num: '29ª Semana',               titulo: 'Dar a Deus o que é de Deus' },
        { id: 'comum-30', num: '30ª Semana',               titulo: 'O grande mandamento do amor' },
        { id: 'comum-31', num: '31ª Semana',               titulo: 'Chamai-vos todos irmãos' },
        { id: 'comum-32', num: '32ª Semana',               titulo: 'As dez virgens' },
        { id: 'comum-33', num: '33ª Semana',               titulo: 'A parábola dos talentos' },
        { id: 'comum-34', num: '34ª Semana · Cristo Rei',  titulo: 'O Rei do Universo' }
    ]
};

// ═══════════════════════════════════════════════════════════
// GEOMETRIA SVG
// ═══════════════════════════════════════════════════════════

/** Converte graus (com 0° no topo) para radianos */
function deg2rad(d) {
    return (d - 90) * Math.PI / 180;
}

/** Ponto num círculo de raio r no ângulo deg */
function pt(cx, cy, r, deg) {
    const a = deg2rad(deg);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Path SVG de um arco anelar (donut slice) */
function arcPath(cx, cy, ro, ri, startDeg, endDeg) {
    const p1 = pt(cx, cy, ro, startDeg);
    const p2 = pt(cx, cy, ro, endDeg);
    const p3 = pt(cx, cy, ri, endDeg);
    const p4 = pt(cx, cy, ri, startDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return [
        `M ${p1.x} ${p1.y}`,
        `A ${ro} ${ro} 0 ${large} 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${ri} ${ri} 0 ${large} 0 ${p4.x} ${p4.y}`,
        'Z'
    ].join(' ');
}

/** Ângulo médio entre dois ângulos */
function midAngle(a, b) { return (a + b) / 2; }

// ═══════════════════════════════════════════════════════════
// CRIAÇÃO DOS RÓTULOS
// ═══════════════════════════════════════════════════════════

/**
 * Cria um grupo SVG com rótulo de texto curvo
 * centralizado no arco, sem stroke pesado.
 */
function criarRotulo(cx, cy, r, angMid, linhas) {
    const ESPACAMENTO = 13;
    const totalAltura = (linhas.length - 1) * ESPACAMENTO;

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'arco-label');

    // Ângulo de rotação do texto
    const rotacao = angMid > 90 && angMid < 270
        ? angMid + 180
        : angMid;

    linhas.forEach((linha, i) => {
        const offset = -totalAltura / 2 + i * ESPACAMENTO;

        // Posição perpendicular ao raio
        const perpRad = deg2rad(angMid + 90);
        const centroRad = deg2rad(angMid);
        const tx = cx + r * Math.cos(centroRad) + Math.cos(perpRad) * offset;
        const ty = cy + r * Math.sin(centroRad) + Math.sin(perpRad) * offset;

        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', tx);
        t.setAttribute('y', ty);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('transform', `rotate(${rotacao}, ${tx}, ${ty})`);
        t.setAttribute('class', linha.cls);
        t.textContent = linha.texto;
        g.appendChild(t);
    });

    return g;
}

// ═══════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════
let tempoAtual  = null;
let semanaAtual = null;
let abortCtrl   = null;

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    construirRoda();
    iniciarLegenda();
    iniciarAnimacoesEntrada();

});

// ═══════════════════════════════════════════════════════════
// CONSTRUÇÃO DA RODA SVG
// ═══════════════════════════════════════════════════════════
function construirRoda() {
    const gArcos  = document.getElementById('g-arcos');
    const LABEL_R = (ROUT + RIN) / 2;   // raio do centro dos rótulos
    let   angulo  = 0;

    TEMPOS.forEach(tempo => {
        const angInicio = angulo + GAP;
        const angFim    = angulo + tempo.span - GAP;
        const angMeio   = midAngle(angInicio, angFim);

        // ── 1. Arco principal ──────────────────────────
        const arco = document.createElementNS(NS, 'path');
        arco.setAttribute('d', arcPath(CX, CY, ROUT, RIN, angInicio, angFim));
        arco.setAttribute('fill', `url(#${tempo.grad})`);
        arco.setAttribute('class', 'arco-tempo');
        arco.setAttribute('role', 'button');
        arco.setAttribute('aria-label', `${tempo.nome}: ${tempo.sub}`);
        arco.setAttribute('tabindex', '0');
        arco.dataset.tempoId = tempo.id;

        arco.addEventListener('click', () => selecionarTempo(tempo));
        arco.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selecionarTempo(tempo);
            }
        });

        gArcos.appendChild(arco);

        // ── 2. Brilho na borda superior do arco ───────
        const brilho = document.createElementNS(NS, 'path');
        brilho.setAttribute('d', arcPath(CX, CY, ROUT, ROUT - 6, angInicio, angFim));
        brilho.setAttribute('fill', 'rgba(255,255,255,0.12)');
        brilho.setAttribute('pointer-events', 'none');
        gArcos.appendChild(brilho);

        // ── 3. Sombra na borda inferior do arco ───────
        const sombra = document.createElementNS(NS, 'path');
        sombra.setAttribute('d', arcPath(CX, CY, RIN + 8, RIN, angInicio, angFim));
        sombra.setAttribute('fill', 'rgba(0,0,0,0.12)');
        sombra.setAttribute('pointer-events', 'none');
        gArcos.appendChild(sombra);

        // ── 4. Separador branco entre arcos ───────────
        const p1Sep = pt(CX, CY, RIN + 2,  angulo);
        const p2Sep = pt(CX, CY, ROUT - 2, angulo);
        const sep = document.createElementNS(NS, 'line');
        sep.setAttribute('x1', p1Sep.x); sep.setAttribute('y1', p1Sep.y);
        sep.setAttribute('x2', p2Sep.x); sep.setAttribute('y2', p2Sep.y);
        sep.setAttribute('stroke', 'rgba(255,255,255,0.35)');
        sep.setAttribute('stroke-width', '1.5');
        sep.setAttribute('pointer-events', 'none');
        gArcos.appendChild(sep);

        // ── 5. Rótulo de texto ─────────────────────────
        if (tempo.span >= 20) {
            const linhas = [
                { texto: tempo.label, cls: 'arco-label-main' },
                { texto: tempo.sub,   cls: 'arco-label-sub'  }
            ];
            const rotulo = criarRotulo(CX, CY, LABEL_R, angMeio, linhas);
            gArcos.appendChild(rotulo);
        }

        angulo += tempo.span;
    });

    // Separador final (fecha o círculo)
    const p1Final = pt(CX, CY, RIN + 2,  angulo);
    const p2Final = pt(CX, CY, ROUT - 2, angulo);
    const sepFinal = document.createElementNS(NS, 'line');
    sepFinal.setAttribute('x1', p1Final.x); sepFinal.setAttribute('y1', p1Final.y);
    sepFinal.setAttribute('x2', p2Final.x); sepFinal.setAttribute('y2', p2Final.y);
    sepFinal.setAttribute('stroke', 'rgba(255,255,255,0.35)');
    sepFinal.setAttribute('stroke-width', '1.5');
    sepFinal.setAttribute('pointer-events', 'none');
    gArcos.appendChild(sepFinal);
}

// ═══════════════════════════════════════════════════════════
// LEGENDA — cliques e foco
// ═══════════════════════════════════════════════════════════
function iniciarLegenda() {
    document.querySelectorAll('.leg-item').forEach(el => {
        const tid = el.dataset.tempo;

        const acao = () => {
            const t = TEMPOS.find(x => x.id === tid);
            if (!t) return;
            selecionarTempo(t);
            document.getElementById('detalhes')
                .scrollIntoView({ behavior: 'smooth' });
        };

        el.addEventListener('click', acao);
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                acao();
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════
// ANIMAÇÕES DE ENTRADA (Intersection Observer)
// ═══════════════════════════════════════════════════════════
function iniciarAnimacoesEntrada() {
    const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReduced) {
        document.querySelectorAll('.anim-entrada')
            .forEach(el => el.classList.add('visivel'));
        return;
    }

    const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visivel');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.anim-entrada').forEach(el => obs.observe(el));
}

// ═══════════════════════════════════════════════════════════
// SELECIONAR TEMPO
// ═══════════════════════════════════════════════════════════
function selecionarTempo(tempo) {
    tempoAtual  = tempo;
    semanaAtual = null;

    // ── Atualiza arcos ──
    const gArcos = document.getElementById('g-arcos');
    document.querySelectorAll('.arco-tempo').forEach(a => {
        const ativo = a.dataset.tempoId === tempo.id;
        a.classList.toggle('ativo', ativo);
    });

    // Classe no <g> pai controla opacidade dos inativos (via CSS)
    gArcos.classList.toggle('g-arcos-com-ativo', true);

    // ── Atualiza legenda ──
    document.querySelectorAll('.leg-item').forEach(el => {
        el.classList.toggle('leg-ativa', el.dataset.tempo === tempo.id);
    });

    // ── Mostra cabeçalho ──
    document.getElementById('estado-vazio').style.display = 'none';

    const cab = document.getElementById('tempo-cabecalho');
    cab.classList.remove('vis');
    void cab.offsetWidth; // força reflow para re-disparar animação
    cab.classList.add('vis');

    // Barra colorida lateral
    document.getElementById('tempo-cor-bar').style.cssText =
        `background: ${tempo.cor}; box-shadow: 0 0 12px ${tempo.cor}55;`;

    document.getElementById('tempo-periodo').textContent   = tempo.periodo;
    document.getElementById('tempo-nome').textContent      = tempo.nome;
    document.getElementById('tempo-descricao').textContent = tempo.desc;

    // ── Monta grid de semanas ──
    const container = document.getElementById('semanas-container');
    container.innerHTML = '';
    const semanas = SEMANAS[tempo.id] || [];

    semanas.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'semana-btn';
        btn.setAttribute('role', 'listitem');
        btn.setAttribute('type', 'button');

        // Entrada escalonada
        btn.style.opacity   = '0';
        btn.style.transform = 'translateY(8px)';

        btn.innerHTML = `
            <div class="semana-acento"
                 style="background:${tempo.cor}"></div>
            <span class="semana-num">${s.num}</span>
            <span class="semana-titulo-txt">${s.titulo}</span>
            <span class="semana-seta" aria-hidden="true">→</span>
        `;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.semana-btn')
                .forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');
            semanaAtual = s;
            carregarReflexao(s, tempo);
        });

        container.appendChild(btn);

        // Anima entrada com delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                btn.style.transition = 'opacity 0.38s ease, transform 0.38s ease';
                btn.style.opacity    = '1';
                btn.style.transform  = 'translateY(0)';
            }, i * 35);
        });
    });

    // Esconde painel de reflexão anterior
    document.getElementById('reflexao-painel').classList.remove('vis');

    // Scroll suave para o cabeçalho
    setTimeout(() => {
        cab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
}

// ═══════════════════════════════════════════════════════════
// CARREGAR REFLEXÃO VIA CLAUDE API (STREAMING)
// ═══════════════════════════════════════════════════════════
async function carregarReflexao(semana, tempo) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    const painel   = document.getElementById('reflexao-painel');
    const conteudo = document.getElementById('reflexao-conteudo');
    const topLine  = document.getElementById('reflexao-topo-line');

    // Preenche cabeçalho do card
    document.getElementById('reflexao-titulo').textContent = semana.titulo;
    document.getElementById('reflexao-sub').textContent    = semana.num;
    document.getElementById('reflexao-kicker').innerHTML = `
        ${tempo.nome}
        <span class="ia-badge">
            <span class="ia-badge-dot"></span>
            IA · Reflexão
        </span>
    `;

    // Linha colorida no topo do card
    topLine.style.background =
        `linear-gradient(90deg, ${tempo.cor}, ${tempo.cor}60, transparent)`;

    // Estado de carregamento
    conteudo.innerHTML = `
        <div class="reflexao-loading">
            <div class="loading-cruz" aria-hidden="true"></div>
            <span class="loading-txt">Contemplando...</span>
            <div class="loading-dots" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    // Mostra painel com animação
    painel.classList.remove('vis');
    void painel.offsetWidth;
    painel.classList.add('vis');

    setTimeout(() => {
        painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);

    // Prompt para a IA
    const prompt = `Você é um guia espiritual católico letrado e contemplativo, especialista em liturgia.
Escreva uma reflexão meditativa sobre a "${semana.num}" do ${tempo.nome}, cujo tema é "${semana.titulo}".

Estrutura obrigatória:
- 3 parágrafos bem desenvolvidos, em português do Brasil
- 1 citação bíblica formatada como:
  <div class="reflexao-cita"><p>texto do versículo</p><cite>— Referência</cite></div>
- Linguagem elevada, litúrgica e contemplativa
- Conexão com a espiritualidade do ${tempo.nome} e com a vida cristã concreta
- Tom de homilia: profundo mas acessível

Comece direto no primeiro parágrafo sem título nem introdução. Use <p> para parágrafos.`;

    try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model:      'claude-sonnet-4-20250514',
                max_tokens: 1000,
                stream:     true,
                messages:   [{ role: 'user', content: prompt }]
            }),
            signal: abortCtrl.signal
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        // Inicia streaming
        conteudo.innerHTML = '';
        conteudo.classList.add('streaming');

        const reader  = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';
        let fullText  = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // guarda linha incompleta

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') continue;
                try {
                    const json = JSON.parse(raw);
                    if (json.type === 'content_block_delta' && json.delta?.text) {
                        fullText += json.delta.text;
                        conteudo.innerHTML = fullText;
                    }
                } catch { /* ignora parse errors parciais */ }
            }
        }

        conteudo.classList.remove('streaming');

    } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('API indisponível, usando fallback:', err.message);
        conteudo.classList.remove('streaming');
        conteudo.innerHTML = fallback(semana, tempo);
    }
}

// ═══════════════════════════════════════════════════════════
// FALLBACKS (quando a API não está disponível)
// ═══════════════════════════════════════════════════════════
function fallback(semana, tempo) {
    const reflexoes = {

        'advento-1': `
            <p>O Advento abre o Ano Litúrgico com uma pergunta que atravessa toda a Escritura:
            <em>estais prontos?</em> A Igreja não nos convida a uma nostalgia sentimental
            do Natal passado, mas a uma vigilância real diante do Senhor que vem —
            que já vem, que sempre vem.</p>
            <div class="reflexao-cita">
                <p>Estai de prontidão, porque o Filho do Homem virá
                na hora em que menos esperardes.</p>
                <cite>— Mateus 24, 44</cite>
            </div>
            <p>A cor roxa desta semana não é sinal de tristeza, mas de conversão
            e expectativa. O Advento é escola de desejo — aprender a desejar a Deus
            acima de tudo. Neste início solene do ano litúrgico, somos convidados
            a purificar nossos desejos, vigiar na oração e preparar o coração
            para receber o Rei que vem em humildade.</p>`,

        'triduo-pascoa': `
            <p>O Domingo de Páscoa é a festa das festas, a rainha de todas as solenidades.
            A morte foi vencida, o sepulcro está vazio.
            <em>Resurrexit, sicut dixit</em> — ressuscitou, como havia prometido.</p>
            <div class="reflexao-cita">
                <p>Por que buscais entre os mortos Aquele que vive?
                Ele não está aqui, ressuscitou!</p>
                <cite>— Lucas 24, 5-6</cite>
            </div>
            <p>A Páscoa é garantia da nossa própria ressurreição e a vitória definitiva
            da Vida sobre a morte. O Ressuscitado transforma não apenas o sepulcro vazio,
            mas o coração de todo aquele que crê. Que possamos ser testemunhas do Cristo
            vivo, proclamando com alegria incontida: <em>Aleluia!</em></p>`,

        'triduo-quinta': `
            <p>Na Quinta-feira Santa, a Igreja entra no coração do Mistério Pascal.
            Jesus reúne os seus para a última ceia e institui o sacramento do seu
            Corpo e Sangue. Então se ajoelha diante dos discípulos e lava-lhes os pés —
            escândalo e beleza do Evangelho num único gesto.</p>
            <div class="reflexao-cita">
                <p>Eu vos dei o exemplo, para que, como eu vos fiz,
                assim façais vós também.</p>
                <cite>— João 13, 15</cite>
            </div>
            <p>Nesta noite solene somos convidados a contemplar o amor que se entrega,
            o pão que se parte, o serviço que se oferece — e a deixar que Cristo
            lave também os nossos pés, transformando nossa soberba em serviço.</p>`,

        'pascal-pentecoste': `
            <p>Pentecoste é o coroamento de toda a Páscoa. O Espírito prometido desce
            sobre os Apóstolos como línguas de fogo, e a Igreja nasce para o mundo.
            O que estava fechado no Cenáculo irrompe pelas ruas de Jerusalém.</p>
            <div class="reflexao-cita">
                <p>Todos ficaram repletos do Espírito Santo e começaram a falar
                em outras línguas, conforme o Espírito lhes concedia.</p>
                <cite>— Atos 2, 4</cite>
            </div>
            <p>O dom do Espírito não é privilégio de poucos, mas vocação de todo
            batizado. É Ele quem nos dá coragem de anunciar, sabedoria de discernir
            e amor que supera nossas limitações humanas. Que esta solenidade
            renove em nós o desejo de sermos templos vivos do Espírito Santo.</p>`
    };

    return reflexoes[semana.id] || `
        <p>Esta reflexão contempla o mistério de <em>${semana.titulo}</em>
        no contexto do ${tempo.nome} — tempo de graça, conversão e encontro
        com o Deus vivo que age na história de cada alma.</p>
        <div class="reflexao-cita">
            <p>O Senhor é meu pastor, nada me faltará;
            em verdes pastagens me faz repousar.</p>
            <cite>— Salmo 23, 1-2</cite>
        </div>
        <p>A liturgia da Igreja não é mero rito externo, mas expressão viva do
        mistério pascal de Cristo. Em cada celebração, o tempo torna-se sagrado
        e o eterno se faz presente na história. Que este tempo de
        <em>${tempo.nome}</em> nos conduza a uma fé mais profunda e a uma
        caridade que não se extingue.</p>
    `;
}

// ═══════════════════════════════════════════════════════════
// CONTROLES DO PAINEL
// ═══════════════════════════════════════════════════════════
function fecharReflexao() {
    if (abortCtrl) abortCtrl.abort();

    const painel = document.getElementById('reflexao-painel');
    painel.classList.remove('vis');

    document.querySelectorAll('.semana-btn')
        .forEach(b => b.classList.remove('ativa'));

    semanaAtual = null;

    // Volta o scroll ao cabeçalho do tempo
    const cab = document.getElementById('tempo-cabecalho');
    if (cab.classList.contains('vis')) {
        setTimeout(() => {
            cab.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }
}

function regenerarReflexao() {
    if (semanaAtual && tempoAtual) {
        carregarReflexao(semanaAtual, tempoAtual);
    }
}
