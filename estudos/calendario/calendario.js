// ═══════════════════════════════════════════════════════════
// SCROLL PROGRESS
// ═══════════════════════════════════════════════════════════
window.addEventListener('scroll', () => {
    const bar = document.getElementById('scroll-bar');
    const total = document.body.scrollHeight - window.innerHeight;
    if (total <= 0) { bar.style.width = '0%'; return; }
    const pct = (window.scrollY / total) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

// ═══════════════════════════════════════════════════════════
// DADOS
// ═══════════════════════════════════════════════════════════
const NS = 'http://www.w3.org/2000/svg';
const CX = 300, CY = 300, ROUT = 260, RIN = 130;

const TEMPOS = [
    {
        id: 'advento', nome: 'Advento', grad: 'g-advento', cor: '#7b1fa2',
        span: 48, label: 'ADVENTO', sub: '4 semanas · Expectativa',
        periodo: 'Primeiro Tempo do Ano Litúrgico',
        desc: 'O Advento inaugura o Ano Litúrgico. Tempo de vigilância, esperança e conversão — a Igreja aguarda a vinda do Senhor.'
    },
    {
        id: 'natal', nome: 'Natal', grad: 'g-natal', cor: '#d4af37',
        span: 30, label: 'NATAL', sub: 'O Verbo se fez carne',
        periodo: 'Da Vigília do Natal ao Batismo do Senhor',
        desc: 'O Tempo do Natal celebra o mistério da Encarnação — o eterno Filho de Deus que assumiu nossa natureza.'
    },
    {
        id: 'comum1', nome: 'Tempo Comum I', grad: 'g-comum1', cor: '#1e88e5',
        span: 52, label: 'COMUM I', sub: 'O ministério de Jesus',
        periodo: 'Entre o Natal e a Quaresma',
        desc: 'O Tempo Comum acompanha o ministério público de Jesus: os ensinamentos, milagres e chamados do Mestre.'
    },
    {
        id: 'quaresma', nome: 'Quaresma', grad: 'g-quaresma', cor: '#8d6e63',
        span: 55, label: 'QUARESMA', sub: '40 dias de conversão',
        periodo: 'Da Quarta-feira de Cinzas ao Tríduo',
        desc: 'A Quaresma é o grande tempo de conversão. Quarenta dias no deserto interior, a caminho da Páscoa.'
    },
    {
        id: 'triduo', nome: 'Tríduo Pascal', grad: 'g-triduo', cor: '#2e7d32',
        span: 14, label: 'TRÍDUO', sub: 'O coração do Ano',
        periodo: 'Quinta · Sexta · Sábado Santo · Páscoa',
        desc: 'O Tríduo Pascal é o ápice de todo o Ano Litúrgico: a Paixão, Morte e Ressurreição gloriosa de Cristo.'
    },
    {
        id: 'pascal', nome: 'Tempo Pascal', grad: 'g-pascal', cor: '#43a047',
        span: 68, label: 'PASCAL', sub: '50 dias de alegria',
        periodo: 'Da Páscoa a Pentecoste',
        desc: 'O Tempo Pascal celebra por cinquenta dias o mistério da Ressurreição, da Ascensão e do dom do Espírito Santo.'
    },
    {
        id: 'comum2', nome: 'Tempo Comum II', grad: 'g-comum2', cor: '#1976d2',
        span: 93, label: 'COMUM II', sub: 'Caminhando com o Senhor',
        periodo: 'De Pentecoste a Cristo Rei',
        desc: 'A segunda parte do Tempo Comum percorre o Evangelho do Ano, culminando na solenidade de Cristo Rei do Universo.'
    }
];

const SEMANAS = {
    advento: [
        { id: 'advento-1', num: '1ª Semana do Advento', titulo: 'O Senhor que vem' },
        { id: 'advento-2', num: '2ª Semana do Advento', titulo: 'Preparar os caminhos' },
        { id: 'advento-3', num: '3ª Semana · Gaudete', titulo: 'Alegrai-vos no Senhor' },
        { id: 'advento-4', num: '4ª Semana do Advento', titulo: 'A Virgem e o Emmanuel' }
    ],
    natal: [
        { id: 'natal-1', num: 'Oitava do Natal', titulo: 'A Palavra feita carne' },
        { id: 'natal-2', num: 'Sagrada Família', titulo: 'O lar de Nazaré' },
        { id: 'natal-3', num: 'Solenidade da Epifania', titulo: 'A luz revelada às nações' },
        { id: 'natal-4', num: 'Batismo do Senhor', titulo: 'O Filho amado do Pai' }
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
        { id: 'quaresma-0', num: 'Quarta-feira de Cinzas', titulo: 'Memento homo quia pulvis es' },
        { id: 'quaresma-1', num: '1ª Semana da Quaresma', titulo: 'A tentação no deserto' },
        { id: 'quaresma-2', num: '2ª Semana da Quaresma', titulo: 'A Transfiguração do Senhor' },
        { id: 'quaresma-3', num: '3ª Semana da Quaresma', titulo: 'A água viva da Samaritana' },
        { id: 'quaresma-4', num: '4ª Semana · Laetare', titulo: 'O cego de nascença' },
        { id: 'quaresma-5', num: '5ª Semana da Quaresma', titulo: 'A ressurreição de Lázaro' },
        { id: 'quaresma-ramos', num: 'Semana Santa', titulo: 'A entrada triunfal em Jerusalém' }
    ],
    triduo: [
        { id: 'triduo-quinta', num: 'Quinta-feira Santa', titulo: 'A Ceia e o mandamento novo' },
        { id: 'triduo-sexta', num: 'Sexta-feira Santa', titulo: 'A Paixão e Morte do Senhor' },
        { id: 'triduo-sabado', num: 'Sábado Santo', titulo: 'O silêncio sagrado do sepulcro' },
        { id: 'triduo-pascoa', num: 'Domingo de Páscoa', titulo: 'Resurrexit, sicut dixit!' }
    ],
    pascal: [
        { id: 'pascal-1', num: 'Oitava da Páscoa', titulo: 'O encontro com o Ressuscitado' },
        { id: 'pascal-2', num: '2ª Semana · Divina Misericórdia', titulo: 'Minha mão na ferida' },
        { id: 'pascal-3', num: '3ª Semana do Tempo Pascal', titulo: 'O pão da vida' },
        { id: 'pascal-4', num: '4ª Semana do Tempo Pascal', titulo: 'O Bom Pastor' },
        { id: 'pascal-5', num: '5ª Semana do Tempo Pascal', titulo: 'A videira verdadeira' },
        { id: 'pascal-6', num: '6ª Semana do Tempo Pascal', titulo: 'O Espírito da verdade' },
        { id: 'pascal-ascensao', num: 'Solenidade da Ascensão', titulo: 'Subiu aos céus em glória' },
        { id: 'pascal-7', num: '7ª Semana do Tempo Pascal', titulo: 'A oração sacerdotal de Jesus' },
        { id: 'pascal-pentecoste', num: 'Solenidade de Pentecoste', titulo: 'O dom do Espírito Santo' }
    ],
    comum2: [
        { id: 'comum-9', num: '9ª Semana', titulo: 'A fé do centurião' },
        { id: 'comum-10', num: '10ª Semana', titulo: 'A vocação de Mateus' },
        { id: 'comum-11', num: '11ª Semana', titulo: 'A missão dos Doze' },
        { id: 'comum-12', num: '12ª Semana', titulo: 'Não temais os homens' },
        { id: 'comum-13', num: '13ª Semana', titulo: 'Seguir a Cristo sem reservas' },
        { id: 'comum-14', num: '14ª Semana', titulo: 'O jugo suave do Senhor' },
        { id: 'comum-15', num: '15ª Semana', titulo: 'A parábola do semeador' },
        { id: 'comum-16', num: '16ª Semana', titulo: 'O trigo e o joio' },
        { id: 'comum-17', num: '17ª Semana', titulo: 'O tesouro e a pérola preciosa' },
        { id: 'comum-18', num: '18ª Semana', titulo: 'A multiplicação dos pães' },
        { id: 'comum-19', num: '19ª Semana', titulo: 'Caminhar sobre as águas' },
        { id: 'comum-20', num: '20ª Semana', titulo: 'A fé da mulher cananeia' },
        { id: 'comum-21', num: '21ª Semana', titulo: 'Tu és Pedro' },
        { id: 'comum-22', num: '22ª Semana', titulo: 'Tomar a cruz e seguir' },
        { id: 'comum-23', num: '23ª Semana', titulo: 'A correção fraterna' },
        { id: 'comum-24', num: '24ª Semana', titulo: 'O perdão sem limites' },
        { id: 'comum-25', num: '25ª Semana', titulo: 'Os operários da vinha' },
        { id: 'comum-26', num: '26ª Semana', titulo: 'Os dois filhos' },
        { id: 'comum-27', num: '27ª Semana', titulo: 'Os vinhateiros homicidas' },
        { id: 'comum-28', num: '28ª Semana', titulo: 'O banquete nupcial' },
        { id: 'comum-29', num: '29ª Semana', titulo: 'Dar a Deus o que é de Deus' },
        { id: 'comum-30', num: '30ª Semana', titulo: 'O grande mandamento do amor' },
        { id: 'comum-31', num: '31ª Semana', titulo: 'Chamai-vos todos irmãos' },
        { id: 'comum-32', num: '32ª Semana', titulo: 'As dez virgens' },
        { id: 'comum-33', num: '33ª Semana', titulo: 'A parábola dos talentos' },
        { id: 'comum-34', num: '34ª Semana · Cristo Rei', titulo: 'O Rei do Universo' }
    ]
};

// ═══════════════════════════════════════════════════════════
// GEOMETRIA SVG
// ═══════════════════════════════════════════════════════════
function deg2rad(d) {
    return (d - 90) * Math.PI / 180;
}

function pt(cx, cy, r, deg) {
    const a = deg2rad(deg);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, ro, ri, s, e) {
    const p1 = pt(cx, cy, ro, s);
    const p2 = pt(cx, cy, ro, e);
    const p3 = pt(cx, cy, ri, e);
    const p4 = pt(cx, cy, ri, s);
    const large = (e - s) > 180 ? 1 : 0;
    return `M${p1.x},${p1.y} A${ro},${ro} 0 ${large} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${ri},${ri} 0 ${large} 0 ${p4.x},${p4.y}Z`;
}

function midAngle(s, e) {
    return (s + e) / 2;
}

function textOnArc(cx, cy, r, ang, lines) {
    const lineH = 13;
    const totalH = (lines.length - 1) * lineH;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'arco-label');

    lines.forEach((line, i) => {
        const offset = -totalH / 2 + i * lineH;
        const perp = deg2rad(ang + 90);
        const radA = deg2rad(ang);
        const ox = Math.cos(perp) * offset;
        const oy = Math.sin(perp) * offset;
        const tx = cx + r * Math.cos(radA) + ox;
        const ty = cy + r * Math.sin(radA) + oy;

        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', tx);
        t.setAttribute('y', ty);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');

        const rot = ang > 90 && ang < 270 ? ang + 180 : ang;
        t.setAttribute('transform', `rotate(${rot}, ${tx}, ${ty})`);
        t.setAttribute('class', line.cls);
        t.textContent = line.text;
        g.appendChild(t);
    });

    return g;
}

// ═══════════════════════════════════════════════════════════
// CONSTRUÇÃO DA RODA
// ═══════════════════════════════════════════════════════════
let tempoAtual = null;
let semanaAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    const gArcos = document.getElementById('g-arcos');
    let angle = 0;
    const LABEL_R = (ROUT + RIN) / 2;
    const GAP = 1.8;

    TEMPOS.forEach(t => {
        const end = angle + t.span;
        const mid = midAngle(angle + GAP, end - GAP);

        // ── Arco principal ──
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', arcPath(CX, CY, ROUT - 2, RIN + 2, angle + GAP, end - GAP));
        path.setAttribute('fill', `url(#${t.grad})`);
        path.setAttribute('class', 'arco-tempo');
        path.setAttribute('role', 'button');
        path.setAttribute('aria-label', `${t.nome} — ${t.sub}`);
        path.setAttribute('tabindex', '0');
        path.dataset.tempoId = t.id;

        path.addEventListener('click', () => selecionarTempo(t));
        path.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selecionarTempo(t);
            }
        });

        gArcos.appendChild(path);

        // ── Brilho de borda superior ──
        const shimmer = document.createElementNS(NS, 'path');
        shimmer.setAttribute('d', arcPath(CX, CY, ROUT - 2, ROUT - 7, angle + GAP, end - GAP));
        shimmer.setAttribute('fill', 'rgba(255,255,255,0.07)');
        shimmer.setAttribute('pointer-events', 'none');
        gArcos.appendChild(shimmer);

        // ── Brilho de borda inferior (perto do centro) ──
        const innerShimmer = document.createElementNS(NS, 'path');
        innerShimmer.setAttribute('d', arcPath(CX, CY, RIN + 7, RIN + 2, angle + GAP, end - GAP));
        innerShimmer.setAttribute('fill', 'rgba(0,0,0,0.15)');
        innerShimmer.setAttribute('pointer-events', 'none');
        gArcos.appendChild(innerShimmer);

        // ── Label ──
        if (t.span > 20) {
            const subText = t.sub.split('·')[1]?.trim() || t.sub;
            const lines = [
                { text: t.label, cls: 'arco-label-main' },
                { text: subText, cls: 'arco-label-sub' }
            ];
            const lbl = textOnArc(CX, CY, LABEL_R, mid, lines);
            gArcos.appendChild(lbl);
        }

        // ── Separador dourado entre arcos ──
        const sepStart = pt(CX, CY, RIN + 4, angle);
        const sepEnd = pt(CX, CY, ROUT - 4, angle);
        const sep = document.createElementNS(NS, 'line');
        sep.setAttribute('x1', sepStart.x);
        sep.setAttribute('y1', sepStart.y);
        sep.setAttribute('x2', sepEnd.x);
        sep.setAttribute('y2', sepEnd.y);
        sep.setAttribute('stroke', 'rgba(154,122,58,0.2)');
        sep.setAttribute('stroke-width', '0.8');
        sep.setAttribute('pointer-events', 'none');
        gArcos.appendChild(sep);

        angle = end;
    });

    // ── Legenda → seleciona tempo ──
    document.querySelectorAll('.leg-item').forEach(el => {
        const tid = el.dataset.tempo;

        el.addEventListener('click', () => {
            const t = TEMPOS.find(x => x.id === tid);
            if (t) {
                selecionarTempo(t);
                document.getElementById('detalhes').scrollIntoView({ behavior: 'smooth' });
            }
        });

        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });

    // ── Intersection Observer (entrada suave) ──
    initScrollAnimations();
});

// ═══════════════════════════════════════════════════════════
// ANIMAÇÕES DE ENTRADA (Intersection Observer)
// ═══════════════════════════════════════════════════════════
function initScrollAnimations() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
        document.querySelectorAll('.roda-texto, .roda-wrap').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.roda-texto, .roda-wrap').forEach(el => {
        observer.observe(el);
    });
}

// ═══════════════════════════════════════════════════════════
// SELEÇÃO DE TEMPO
// ═══════════════════════════════════════════════════════════
function selecionarTempo(tempo) {
    tempoAtual = tempo;
    semanaAtual = null;

    // Atualiza arcos ativos
    document.querySelectorAll('.arco-tempo').forEach(a => {
        a.classList.toggle('ativo', a.dataset.tempoId === tempo.id);
    });

    // Atualiza legenda ativa
    document.querySelectorAll('.leg-item').forEach(el => {
        el.style.opacity = el.dataset.tempo === tempo.id ? '1' : '0.5';
        el.style.borderColor = el.dataset.tempo === tempo.id
            ? 'rgba(154,122,58,0.3)' : 'transparent';
    });

    // Esconde vazio
    document.getElementById('estado-vazio').style.display = 'none';

    // Mostra cabeçalho
    const cab = document.getElementById('tempo-cabecalho');
    cab.classList.remove('vis');

    // Força reflow pra re-disparar animação
    void cab.offsetWidth;
    cab.classList.add('vis');

    document.getElementById('tempo-cor-bar').style.background =
        `linear-gradient(180deg, ${tempo.cor}, ${tempo.cor}88)`;
    document.getElementById('tempo-periodo').textContent = tempo.periodo;
    document.getElementById('tempo-nome').textContent = tempo.nome;
    document.getElementById('tempo-descricao').textContent = tempo.desc;

    // Semanas
    const container = document.getElementById('semanas-container');
    container.innerHTML = '';
    const semanas = SEMANAS[tempo.id] || [];

    semanas.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'semana-btn';
        btn.setAttribute('role', 'listitem');
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(8px)';
        btn.innerHTML = `
            <div class="semana-acento" style="background:${tempo.cor}"></div>
            <span class="semana-num">${s.num}</span>
            <span class="semana-titulo-txt">${s.titulo}</span>
            <span class="semana-seta" aria-hidden="true">→</span>
        `;

        btn.onclick = () => {
            document.querySelectorAll('.semana-btn').forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');
            semanaAtual = s;
            carregarReflexaoIA(s, tempo);
        };

        container.appendChild(btn);

        // Entrada escalonada
        requestAnimationFrame(() => {
            setTimeout(() => {
                btn.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, i * 40);
        });
    });

    // Fecha reflexão anterior
    document.getElementById('reflexao-painel').classList.remove('vis');

    // Scroll suave até o cabeçalho
    setTimeout(() => {
        cab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
}

// ═══════════════════════════════════════════════════════════
// IA — REFLEXÃO VIA CLAUDE API (STREAMING)
// ═══════════════════════════════════════════════════════════
let abortCtrl = null;

async function carregarReflexaoIA(semana, tempo) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    const painel = document.getElementById('reflexao-painel');
    const conteudo = document.getElementById('reflexao-conteudo');
    const topoLine = document.getElementById('reflexao-topo-line');

    document.getElementById('reflexao-titulo').textContent = semana.titulo;
    document.getElementById('reflexao-sub').textContent = semana.num;
    document.getElementById('reflexao-kicker').innerHTML = `
        ${tempo.nome}
        <span class="ia-badge">
            <span class="ia-badge-dot"></span>
            IA · Reflexão
        </span>
    `;
    topoLine.style.background =
        `linear-gradient(90deg, ${tempo.cor}, ${tempo.cor}44, transparent)`;

    conteudo.innerHTML = `
        <div class="reflexao-loading">
            <div class="loading-cruz" aria-hidden="true"></div>
            <span class="loading-txt">Contemplando...</span>
            <div class="loading-dots" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    painel.classList.remove('vis');
    void painel.offsetWidth;
    painel.classList.add('vis');

    setTimeout(() => {
        painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    const prompt = `Você é um guia espiritual católico letrado e contemplativo, especialista em liturgia.
Escreva uma reflexão meditativa sobre a "${semana.num}" do ${tempo.nome}, cujo tema é "${semana.titulo}".

A reflexão deve ter:
- 3 a 4 parágrafos bem desenvolvidos
- Uma citação bíblica central formatada como: <div class="reflexao-cita"><p>texto do versículo</p><cite>— Referência bíblica</cite></div>
- Linguagem elevada, litúrgica e contemplativa, em português do Brasil
- Conexão com a espiritualidade do ${tempo.nome} e com a vida cristã concreta
- Tom de homilia pós-conciliar: profundo mas acessível

Comece diretamente o primeiro parágrafo sem título. Use tags <p> para parágrafos.`;

    try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                stream: true,
                messages: [{ role: 'user', content: prompt }]
            }),
            signal: abortCtrl.signal
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        conteudo.innerHTML = '';
        conteudo.classList.add('streaming');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    if (json.type === 'content_block_delta' && json.delta?.text) {
                        fullText += json.delta.text;
                        conteudo.innerHTML = fullText;
                    }
                } catch { /* ignora parse errors */ }
            }
        }

        conteudo.classList.remove('streaming');

    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Erro na reflexão IA:', err);
        conteudo.classList.remove('streaming');
        conteudo.innerHTML = gerarReflexaoFallback(semana, tempo);
    }
}

// ═══════════════════════════════════════════════════════════
// FALLBACK (sem API)
// ═══════════════════════════════════════════════════════════
function gerarReflexaoFallback(semana, tempo) {
    const reflexoes = {
        'advento-1': `<p>O Advento abre o Ano Litúrgico com uma pergunta que atravessa toda a Escritura: <em>estais prontos?</em> A Igreja não nos convida a uma nostalgia sentimental do Natal passado, mas a uma vigilância real diante do Senhor que vem — que já vem, que sempre vem.</p>
            <div class="reflexao-cita"><p>Estai de prontidão, porque o Filho do Homem virá na hora em que menos esperardes.</p><cite>— Mateus 24, 44</cite></div>
            <p>A cor roxa desta semana não é sinal de tristeza, mas de conversão e expectativa. O Advento é escola de desejo — aprender a desejar a Deus acima de tudo. Não o Natal da nostalgia, mas o Cristo que vem.</p>
            <p>Neste início solene do ano litúrgico, somos convidados a purificar nossos desejos, a vigiar na oração e a preparar o coração para receber o Rei que vem em humildade.</p>`,

        'advento-2': `<p>Na segunda semana do Advento, ressoa com força a voz do Precursor: <em>Preparai o caminho do Senhor, endireitai as suas veredas.</em> João Batista é a figura que atravessa todo este tempo como um dedo apontado para Aquele que vem.</p>
            <div class="reflexao-cita"><p>Voz do que clama no deserto: Preparai o caminho do Senhor, aplainai as suas veredas.</p><cite>— Marcos 1, 3</cite></div>
            <p>Preparar os caminhos exige abrir mão do que é torto em nós: os orgulhos, as mentiras interiores, as muralhas que construímos para não deixar Deus entrar. O deserto é lugar de verdade — ali não há onde se esconder.</p>
            <p>Que possamos, nesta semana, acolher o convite à conversão sincera, tornando reto o caminho por onde o Salvador deseja passar em nossas vidas.</p>`,

        'advento-3': `<p><em>Gaudete in Domino semper!</em> Alegrai-vos sempre no Senhor! A terceira semana do Advento acende a vela rósea no meio do roxo, sinal de que a alegria já desponta mesmo antes da festa. A Igreja nos ensina a alegria da espera.</p>
            <div class="reflexao-cita"><p>Alegrai-vos sempre no Senhor. Repito: alegrai-vos! A vossa bondade seja conhecida de todos. O Senhor está perto.</p><cite>— Filipenses 4, 4-5</cite></div>
            <p>Não se trata de uma alegria mundana ou superficial, mas daquela que nasce da certeza de que o Senhor está perto. É a alegria dos pobres de espírito, dos que não colocaram sua esperança nos poderes do mundo.</p>
            <p>Nesta semana, somos convidados a viver a sobriedade alegre de quem sabe que a promessa se cumpre, que o deserto florirá e que o Salvador já se aproxima.</p>`,

        'triduo-pascoa': `<p>O Domingo de Páscoa é a festa das festas, a rainha de todas as solenidades. A morte foi vencida, o sepulcro está vazio. <em>Resurrexit, sicut dixit</em> — ressuscitou, como havia prometido.</p>
            <div class="reflexao-cita"><p>Por que buscais entre os mortos Aquele que vive? Ele não está aqui, ressuscitou!</p><cite>— Lucas 24, 5-6</cite></div>
            <p>A Páscoa é garantia da nossa própria ressurreição e a vitória definitiva da Vida sobre a morte. O Ressuscitado transforma não apenas o sepulcro vazio, mas o coração de todo aquele que crê.</p>
            <p>Que possamos ser testemunhas do Cristo vivo em nosso meio, proclamando com alegria incontida: <em>Aleluia! Cristo ressuscitou verdadeiramente!</em></p>`,

        'triduo-quinta': `<p>Na Quinta-feira Santa, a Igreja entra no coração do Mistério Pascal. Jesus reúne os seus para uma última ceia, e nela institui o sacramento do seu Corpo e Sangue, e dá o mandamento novo: <em>Amai-vos uns aos outros como eu vos amei.</em></p>
            <div class="reflexao-cita"><p>Eu vos dei o exemplo, para que, como eu vos fiz, assim façais vós também.</p><cite>— João 13, 15</cite></div>
            <p>O lava-pés não é mero gesto simbólico, mas revelação da natureza de Deus. O Criador do universo se ajoelha diante da criatura. O Senhor se faz servo. Aqui está o escândalo e a beleza do Evangelho.</p>
            <p>Nesta noite solene, somos convidados a contemplar o amor que se entrega, o pão que se parte, o serviço que se oferece — e a deixar que Cristo lave também os nossos pés.</p>`,

        'triduo-sexta': `<p>A Sexta-feira Santa é o dia do grande silêncio. A Igreja se recolhe diante do mistério da Cruz — o Filho de Deus, pregado ao madeiro, entrega o espírito. <em>Consummatum est.</em> Tudo está consumado.</p>
            <div class="reflexao-cita"><p>Ele foi traspassado por causa das nossas transgressões, triturado por causa das nossas iniquidades.</p><cite>— Isaías 53, 5</cite></div>
            <p>A liturgia deste dia é sóbria e austera: não há Eucaristia, os altares estão nus, o tabernáculo vazio. Tudo aponta para a kenosis — o esvaziamento de Deus por amor.</p>
            <p>Diante da Cruz, somos convidados ao silêncio reverente, à gratidão pela redenção oferecida e ao reconhecimento de que o amor mais profundo passa necessariamente pelo sofrimento fecundo.</p>`,

        'pascal-pentecoste': `<p>Pentecoste é o coroamento de toda a Páscoa. O Espírito prometido desce sobre os Apóstolos como línguas de fogo, e a Igreja nasce para o mundo. O que estava oculto no Cenáculo agora irrompe pelas ruas de Jerusalém.</p>
            <div class="reflexao-cita"><p>Todos ficaram repletos do Espírito Santo e começaram a falar em outras línguas, conforme o Espírito lhes concedia.</p><cite>— Atos 2, 4</cite></div>
            <p>O dom do Espírito não é privilégio de poucos, mas vocação de todo batizado. É Ele quem nos dá a coragem de anunciar, a sabedoria de discernir e o amor que supera nossas limitações humanas.</p>
            <p>Que a solenidade de Pentecoste renove em nós o desejo de sermos templos vivos do Espírito Santo, abertos à sua ação transformadora no mundo.</p>`
    };

    return reflexoes[semana.id] || `<p>Esta reflexão contempla o mistério de <em>${semana.titulo}</em> no contexto do ${tempo.nome}. Um tempo de graça, de conversão e de encontro com o Deus vivo que age na história de cada alma.</p>
        <div class="reflexao-cita"><p>O Senhor é meu pastor, nada me faltará; em verdes pastagens me faz repousar.</p><cite>— Salmo 23, 1-2</cite></div>
        <p>A liturgia da Igreja não é mero rito externo, mas expressão viva do mistério pascal de Cristo. Em cada celebração, o tempo torna-se sagrado e o eterno se faz presente na história. Somos chamados a mergulhar nesta corrente de graça, deixando-nos transformar pelo ciclo contínuo da fé.</p>
        <p>Que este tempo de <em>${tempo.nome}</em> nos conduza a uma vivência mais profunda do mistério de Cristo, renovando nossa esperança, fortalecendo nossa fé e inflamando em nós a caridade que não se extingue.</p>`;
}

// ═══════════════════════════════════════════════════════════
// CONTROLES
// ═══════════════════════════════════════════════════════════
function fecharReflexao() {
    if (abortCtrl) abortCtrl.abort();
    const painel = document.getElementById('reflexao-painel');
    painel.classList.remove('vis');
    document.querySelectorAll('.semana-btn').forEach(b => b.classList.remove('ativa'));
    semanaAtual = null;

    // Scroll de volta ao cabeçalho do tempo
    const cab = document.getElementById('tempo-cabecalho');
    if (cab.classList.contains('vis')) {
        setTimeout(() => {
            cab.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function regenerarReflexao() {
    if (semanaAtual && tempoAtual) {
        carregarReflexaoIA(semanaAtual, tempoAtual);
    }
}
