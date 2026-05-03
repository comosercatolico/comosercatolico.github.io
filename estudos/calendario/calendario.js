
// ═══════════════════════════════════════════════════════════
// SCROLL PROGRESS
// ═══════════════════════════════════════════════════════════
window.addEventListener('scroll', () => {
    const bar = document.getElementById('scroll-bar');
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
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
function deg2rad(d) { return (d - 90) * Math.PI / 180; }

function pt(cx, cy, r, deg) {
    const a = deg2rad(deg);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, ro, ri, s, e) {
    const p1 = pt(cx, cy, ro, s), p2 = pt(cx, cy, ro, e);
    const p3 = pt(cx, cy, ri, e), p4 = pt(cx, cy, ri, s);
    const large = (e - s) > 180 ? 1 : 0;
    return `M${p1.x},${p1.y} A${ro},${ro} 0 ${large} 1 ${p2.x},${p2.y} L${p3.x},${p3.y} A${ri},${ri} 0 ${large} 0 ${p4.x},${p4.y}Z`;
}

function midAngle(s, e) { return (s + e) / 2; }

function textOnArc(cx, cy, r, ang, lines) {
    const lineH = 12;
    const totalH = (lines.length - 1) * lineH;
    const perpAng = ang;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'arco-label');

    lines.forEach((line, i) => {
        const offset = -totalH / 2 + i * lineH;
        const perp = deg2rad(perpAng + 90);
        const radA = deg2rad(perpAng);
        const ox = Math.cos(perp) * offset;
        const oy = Math.sin(perp) * offset;
        const tx = cx + r * Math.cos(radA) + ox;
        const ty = cy + r * Math.sin(radA) + oy;
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', tx);
        t.setAttribute('y', ty);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        const rot = perpAng > 90 && perpAng < 270 ? perpAng + 180 : perpAng;
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
    const GAP = 1.5;

    TEMPOS.forEach(t => {
        const end = angle + t.span;
        const mid = midAngle(angle + GAP, end - GAP);

        // Arco
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', arcPath(CX, CY, ROUT - 2, RIN + 2, angle + GAP, end - GAP));
        path.setAttribute('fill', `url(#${t.grad})`);
        path.setAttribute('class', 'arco-tempo');
        path.setAttribute('role', 'button');
        path.setAttribute('aria-label', `${t.nome} — ${t.sub}`);
        path.setAttribute('tabindex', '0');
        path.dataset.tempoId = t.id;
        path.addEventListener('click', () => selecionarTempo(t));
        path.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selecionarTempo(t); });
        gArcos.appendChild(path);

        // Brilho de borda
        const shimmer = document.createElementNS(NS, 'path');
        shimmer.setAttribute('d', arcPath(CX, CY, ROUT - 2, ROUT - 6, angle + GAP, end - GAP));
        shimmer.setAttribute('fill', 'rgba(255,255,255,0.06)');
        shimmer.setAttribute('pointer-events', 'none');
        gArcos.appendChild(shimmer);

        // Label
        const labelSpan = t.span;
        if (labelSpan > 20) {
            const lines = [
                { text: t.label, cls: 'arco-label-main' },
                { text: t.sub.split('·')[1]?.trim() || t.sub, cls: 'arco-label-sub' }
            ];
            const lbl = textOnArc(CX, CY, LABEL_R, mid, lines);
            gArcos.appendChild(lbl);
        }

        angle = end;
    });

    // Clique na legenda → seleciona tempo
    document.querySelectorAll('.leg-item').forEach(el => {
        const tid = el.dataset.tempo;
        el.addEventListener('click', () => {
            const t = TEMPOS.find(x => x.id === tid);
            if (t) { selecionarTempo(t); document.getElementById('detalhes').scrollIntoView({ behavior: 'smooth' }); }
        });
    });

    // Intersection Observer para animações de entrada
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.roda-texto, .roda-wrap').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.9s var(--ease), transform 0.9s var(--ease)';
        io.observe(el);
    });
});

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

    // Esconde vazio
    document.getElementById('estado-vazio').style.display = 'none';

    // Mostra cabeçalho
    const cab = document.getElementById('tempo-cabecalho');
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
        btn.innerHTML = `
            <div class="semana-acento" style="background:${tempo.cor}"></div>
            <span class="semana-num">${s.num}</span>
            <span class="semana-titulo-txt">${s.titulo}</span>
            <span class="semana-seta" aria-hidden="true">→</span>
        `;
        btn.style.animationDelay = `${i * 0.05}s`;
        btn.onclick = () => {
            document.querySelectorAll('.semana-btn').forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');
            semanaAtual = s;
            carregarReflexaoIA(s, tempo);
        };
        container.appendChild(btn);
    });

    // Fecha reflexão anterior
    document.getElementById('reflexao-painel').classList.remove('vis');

    cab.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ═══════════════════════════════════════════════════════════
// IA — REFLEXÃO VIA CLAUDE API (STREAMING)
// ═══════════════════════════════════════════════════════════
let abortCtrl = null;

async function carregarReflexaoIA(semana, tempo) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    // Prepara o painel
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
    topoLine.style.background = `linear-gradient(90deg, ${tempo.cor}, ${tempo.cor}44, transparent)`;

    conteudo.innerHTML = `
        <div class="reflexao-loading">
            <div class="loading-cruz" aria-hidden="true"></div>
            <span class="loading-txt">Contemplando...</span>
            <div class="loading-dots" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    painel.classList.add('vis');
    painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

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
                } catch {}
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

function gerarReflexaoFallback(semana, tempo) {
    const reflexoes = {
        'advento-1': `<p>O Advento abre o Ano Litúrgico com uma pergunta que atravessa toda a Escritura: <em>estais prontos?</em> A Igreja não nos convida a uma nostalgia sentimental do Natal passado, mas a uma vigilância real diante do Senhor que vem — que já vem, que sempre vem.</p><div class="reflexao-cita"><p>Estai de prontidão, porque o Filho do Homem virá na hora em que menos esperardes.</p><cite>— Mateus 24, 44</cite></div><p>A cor roxa desta semana não é sinal de tristeza, mas de conversão e expectativa. O Advento é escola de desejo — aprender a desejar a Deus acima de tudo. Não o Natal da nostalgia, mas o Cristo que vem.</p><p>Neste início solene do ano litúrgico, somos convidados a purificar nossos desejos, a vigiar na oração e a preparar o coração para receber o Rei que vem em humildade.</p>`,
        'triduo-pascoa': `<p>O Domingo de Páscoa é a festa das festas, a rainha de todas as solenidades. A morte foi vencida, o sepulcro está vazio. <em>Resurrexit, sicut dixit</em> — ressuscitou, como havia prometido.</p><div class="reflexao-cita"><p>Por que buscais entre os mortos Aquele que vive? Ele não está aqui, ressuscitou!</p><cite>— Lucas 24, 5-6</cite></div><p>A Páscoa é garantia da nossa própria ressurreição e a vitória definitiva da Vida sobre a morte. O Ressuscitado transforma não apenas o sepulcro vazio, mas o coração de todo aquele que crê.</p><p>Que possamos ser testemunhas do Cristo vivo em nosso meio, proclamando com alegria incontida: <em>Aleluia! Cristo ressuscitou verdadeiramente!</em></p>`,
    };
    return reflexoes[semana.id] || `<p>Esta reflexão contempla o mistério de <em>${semana.titulo}</em> no contexto do ${tempo.nome}. Um tempo de graça, de conversão e de encontro com o Deus vivo que age na história de cada alma.</p><div class="reflexao-cita"><p>O Senhor é meu pastor, nada me faltará; em verdes pastagens me faz repousar.</p><cite>— Salmo 23, 1-2</cite></div><p>A liturgia da Igreja não é mero rito externo, mas expressão viva do mistério pascal de Cristo. Em cada celebração, o tempo torna-se sagrado e o eterno se faz presente na história.</p>`;
}

function fecharReflexao() {
    if (abortCtrl) abortCtrl.abort();
    document.getElementById('reflexao-painel').classList.remove('vis');
    document.querySelectorAll('.semana-btn').forEach(b => b.classList.remove('ativa'));
    semanaAtual = null;
}

function regenerarReflexao() {
    if (semanaAtual && tempoAtual) {
        carregarReflexaoIA(semanaAtual, tempoAtual);
    }
}
