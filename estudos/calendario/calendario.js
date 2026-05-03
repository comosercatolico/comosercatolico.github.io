const NS = "http://www.w3.org/2000/svg";
const CX = 300, CY = 300, ROUT = 260, RIN = 130;

// Dados dos Tempos Litúrgicos
const TEMPOS = [
    { id: 'advento', nome: 'Advento', grad: 'g-advento', cor: '#6a1faa', span: 48, label: 'ADVENTO', sub: '4 semanas de espera', desc: 'O Advento inaugura o Ano Litúrgico. Tempo de vigilância, esperança e preparação para o Natal.' },
    { id: 'natal', nome: 'Natal', grad: 'g-natal', cor: '#b89040', span: 30, label: 'NATAL', sub: 'O Verbo se fez carne', desc: 'O Tempo do Natal celebra o mistério da Encarnação — o Verbo que se fez carne e habitou entre nós.' },
    { id: 'comum1', nome: 'Tempo Comum I', grad: 'g-comum1', cor: '#2a5898', span: 52, label: 'COMUM I', sub: 'A vida pública de Jesus', desc: 'O Tempo Comum acompanha o ministério público de Jesus e a vida ordinária da Igreja.' },
    { id: 'quaresma', nome: 'Quaresma', grad: 'g-quaresma', cor: '#7a3a10', span: 55, label: 'QUARESMA', sub: '40 dias de penitência', desc: 'A Quaresma é o grande tempo de conversão. Quarenta dias no deserto, a caminho da Páscoa.' },
    { id: 'triduo', nome: 'Tríduo Pascal', grad: 'g-triduo', cor: '#0e5a2e', span: 14, label: 'TRÍDUO', sub: 'O coração do ano', desc: 'O Tríduo Pascal é o ápice de todo o Ano Litúrgico: Paixão, Morte e Ressurreição de Cristo.' },
    { id: 'pascal', nome: 'Tempo Pascal', grad: 'g-pascal', cor: '#1a8048', span: 68, label: 'PASCAL', sub: '50 dias de alegria', desc: 'O Tempo Pascal celebra por cinquenta dias o mistério da Ressurreição, da Ascensão e de Pentecoste.' },
    { id: 'comum2', nome: 'Tempo Comum II', grad: 'g-comum2', cor: '#1e4880', span: 93, label: 'COMUM II', sub: 'Caminhando com o Senhor', desc: 'A segunda parte do Tempo Comum percorre o Evangelho do ano, culminando em Cristo Rei.' }
];

// Dados das Semanas
const SEMANAS = {
    advento: [
        { id: 'advento-1', num: '1ª Semana', titulo: 'O Senhor que vem' },
        { id: 'advento-2', num: '2ª Semana', titulo: 'Preparar os caminhos' },
        { id: 'advento-3', num: '3ª Semana', titulo: 'Gaudete — Alegrai-vos' },
        { id: 'advento-4', num: '4ª Semana', titulo: 'A Virgem e o Emmanuel' }
    ],
    natal: [
        { id: 'natal-1', num: 'Oitava do Natal', titulo: 'A Palavra feita carne' },
        { id: 'natal-2', num: 'Sagrada Família', titulo: 'O lar de Nazaré' },
        { id: 'natal-3', num: 'Epifania', titulo: 'A luz às nações' },
        { id: 'natal-4', num: 'Batismo do Senhor', titulo: 'O Filho amado' }
    ],
    comum1: [
        { id: 'comum-2', num: '2ª Semana', titulo: 'O início do ministério' },
        { id: 'comum-3', num: '3ª Semana', titulo: 'Convertei-vos' },
        { id: 'comum-4', num: '4ª Semana', titulo: 'A autoridade da Palavra' },
        { id: 'comum-5', num: '5ª Semana', titulo: 'Luz do mundo, sal da terra' },
        { id: 'comum-6', num: '6ª Semana', titulo: 'A Lei e o coração' },
        { id: 'comum-7', num: '7ª Semana', titulo: 'Amai os vossos inimigos' },
        { id: 'comum-8', num: '8ª Semana', titulo: 'Servir a Deus ou às riquezas' }
    ],
    quaresma: [
        { id: 'quaresma-0', num: 'Quarta de Cinzas', titulo: 'Lembrai que sois pó' },
        { id: 'quaresma-1', num: '1ª Semana', titulo: 'A tentação no deserto' },
        { id: 'quaresma-2', num: '2ª Semana', titulo: 'A Transfiguração' },
        { id: 'quaresma-3', num: '3ª Semana', titulo: 'A água viva' },
        { id: 'quaresma-4', num: '4ª Semana', titulo: 'Laetare — O cego de nascença' },
        { id: 'quaresma-5', num: '5ª Semana', titulo: 'A ressurreição de Lázaro' },
        { id: 'quaresma-ramos', num: 'Semana Santa', titulo: 'A entrada em Jerusalém' }
    ],
    triduo: [
        { id: 'triduo-quinta', num: 'Quinta-feira Santa', titulo: 'A Ceia e o mandamento novo' },
        { id: 'triduo-sexta', num: 'Sexta-feira Santa', titulo: 'A Paixão do Senhor' },
        { id: 'triduo-sabado', num: 'Sábado Santo', titulo: 'O silêncio do sepulcro' },
        { id: 'triduo-pascoa', num: 'Domingo de Páscoa', titulo: 'Resurrexit, sicut dixit' }
    ],
    pascal: [
        { id: 'pascal-1', num: 'Oitava da Páscoa', titulo: 'O encontro com o Ressuscitado' },
        { id: 'pascal-2', num: '2ª Semana', titulo: 'Domingo da Divina Misericórdia' },
        { id: 'pascal-3', num: '3ª Semana', titulo: 'O pão da vida' },
        { id: 'pascal-4', num: '4ª Semana', titulo: 'O Bom Pastor' },
        { id: 'pascal-5', num: '5ª Semana', titulo: 'A videira e os ramos' },
        { id: 'pascal-6', num: '6ª Semana', titulo: 'O Espírito da verdade' },
        { id: 'pascal-ascensao', num: 'Ascensão', titulo: 'Subiu aos céus' },
        { id: 'pascal-7', num: '7ª Semana', titulo: 'A oração sacerdotal' },
        { id: 'pascal-pentecoste', num: 'Pentecoste', titulo: 'O dom do Espírito Santo' }
    ],
    comum2: [
        { id: 'comum-9', num: '9ª Semana', titulo: 'A fé do centurião' },
        { id: 'comum-10', num: '10ª Semana', titulo: 'A vocação de Mateus' },
        { id: 'comum-11', num: '11ª Semana', titulo: 'A missão dos doze' },
        { id: 'comum-12', num: '12ª Semana', titulo: 'Não temais os homens' },
        { id: 'comum-13', num: '13ª Semana', titulo: 'Seguir a Cristo' },
        { id: 'comum-14', num: '14ª Semana', titulo: 'O jugo suave' },
        { id: 'comum-15', num: '15ª Semana', titulo: 'O semeador' },
        { id: 'comum-16', num: '16ª Semana', titulo: 'O trigo e o joio' },
        { id: 'comum-17', num: '17ª Semana', titulo: 'O tesouro escondido' },
        { id: 'comum-18', num: '18ª Semana', titulo: 'A multiplicação dos pães' },
        { id: 'comum-19', num: '19ª Semana', titulo: 'Caminhar sobre as águas' },
        { id: 'comum-20', num: '20ª Semana', titulo: 'A fé da cananeia' },
        { id: 'comum-21', num: '21ª Semana', titulo: 'Tu és Pedro' },
        { id: 'comum-22', num: '22ª Semana', titulo: 'Carregar a cruz' },
        { id: 'comum-23', num: '23ª Semana', titulo: 'A correção fraterna' },
        { id: 'comum-24', num: '24ª Semana', titulo: 'O perdão sem limites' },
        { id: 'comum-25', num: '25ª Semana', titulo: 'Os operários da vinha' },
        { id: 'comum-26', num: '26ª Semana', titulo: 'Os dois filhos' },
        { id: 'comum-27', num: '27ª Semana', titulo: 'Os vinhateiros' },
        { id: 'comum-28', num: '28ª Semana', titulo: 'O banquete nupcial' },
        { id: 'comum-29', num: '29ª Semana', titulo: 'A Deus e a César' },
        { id: 'comum-30', num: '30ª Semana', titulo: 'O grande mandamento' },
        { id: 'comum-31', num: '31ª Semana', titulo: 'Chamai-vos todos irmãos' },
        { id: 'comum-32', num: '32ª Semana', titulo: 'As dez virgens' },
        { id: 'comum-33', num: '33ª Semana', titulo: 'Os talentos' },
        { id: 'comum-34', num: '34ª Semana', titulo: 'Cristo Rei do Universo' }
    ]
};

// Reflexões (Exemplos baseados no original)
const REF = {
    'advento-1': {
        tempo: 'Advento', cor: '#6a1faa', titulo: 'Primeira Semana do Advento', sub: 'O Senhor que vem',
        texto: `<p>O Advento abre o Ano Litúrgico com uma pergunta que atravessa toda a Escritura: <em>estais prontos?</em> A Igreja não nos convida a uma nostalgia sentimental do Natal que foi, mas a uma vigilância real diante do Senhor que vem.</p><div class="reflexao-cita">"Estai de prontidão, porque o Filho do Homem virá na hora em que menos esperardes."<cite>— Mateus 24, 44</cite></div><p>A cor roxa desta semana não é sinal de tristeza, mas de conversão e expectativa. O Advento é escola de desejo — aprender a desejar a Deus acima de tudo.</p>`
    },
    'quaresma-0': {
        tempo: 'Quaresma', cor: '#7a3a10', titulo: 'Quarta-feira de Cinzas', sub: 'Lembrai que sois pó',
        texto: `<p>A Igreja impõe cinzas na testa com a fórmula que atravessa milênios: <em>Memento homo quia pulvis es</em>. Nenhuma outra tradição tem este gesto de radical honestidade sobre a condição humana.</p><div class="reflexao-cita">"Rasgai os vossos corações e não as vossas vestes; convertei-vos ao Senhor vosso Deus."<cite>— Joel 2, 13</cite></div><p>A cinza não é punição — é lucidez. A Quaresma começa com este ato de verdade.</p>`
    },
    'triduo-pascoa': {
        tempo: 'Tríduo Pascal', cor: '#0e5a2e', titulo: 'Domingo de Páscoa', sub: 'A Ressurreição do Senhor',
        texto: `<p>O Domingo de Páscoa é a festa das festas. A morte foi vencida, o sepulcro está vazio. Cristo ressuscitou verdadeiramente!</p><div class="reflexao-cita">"Por que buscais entre os mortos Aquele que vive? Ele não está aqui, ressuscitou!"<cite>— Lucas 24, 5-6</cite></div><p>A Páscoa é a garantia da nossa própria ressurreição e a vitória definitiva da Vida sobre a morte.</p>`
    }
};

// Funções Auxiliares SVG
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const gArcos = document.getElementById('g-arcos');
    let currentAngle = 0;

    TEMPOS.forEach(t => {
        const path = document.createElementNS(NS, 'path');
        const endAngle = currentAngle + t.span;
        path.setAttribute('d', arcPath(CX, CY, ROUT, RIN, currentAngle, endAngle));
        path.setAttribute('fill', `url(#${t.grad})`);
        path.setAttribute('class', 'arco-tempo');
        path.addEventListener('click', () => selecionarTempo(t));
        gArcos.appendChild(path);
        currentAngle = endAngle;
    });
});

function selecionarTempo(tempo) {
    const label = document.getElementById('sec-label');
    const header = document.getElementById('tempo-header');
    const badge = document.getElementById('tempo-badge-el');
    const desc = document.getElementById('tempo-desc-el');
    const container = document.getElementById('semanas-container');
    const painel = document.getElementById('reflexao-painel');

    label.classList.add('vis');
    header.classList.add('vis');
    badge.textContent = tempo.nome;
    badge.style.backgroundColor = tempo.cor;
    desc.textContent = tempo.desc;
    painel.classList.remove('vis');

    container.innerHTML = '';
    const semanas = SEMANAS[tempo.id] || [];
    semanas.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'semana-btn';
        btn.innerHTML = `<span class="semana-num">${s.num}</span><span class="semana-titulo">${s.titulo}</span>`;
        btn.onclick = () => {
            document.querySelectorAll('.semana-btn').forEach(b => b.classList.remove('ativa'));
            btn.classList.add('ativa');
            mostrarReflexao(s.id);
        };
        container.appendChild(btn);
    });
}

function mostrarReflexao(id) {
    const painel = document.getElementById('reflexao-painel');
    const conteudo = document.getElementById('reflexao-conteudo');
    const r = REF[id] || {
        titulo: 'Em breve',
        sub: 'Conteúdo em preparação',
        texto: '<p>Esta reflexão está sendo preparada para o novo calendário.</p>'
    };

    conteudo.innerHTML = `
        <h2 class="reflexao-titulo">${r.titulo}</h2>
        <p class="reflexao-sub">${r.sub}</p>
        <div class="reflexao-texto">${r.texto}</div>
        <button class="btn-voltar" style="margin: 2rem auto 0;" onclick="document.getElementById('reflexao-painel').classList.remove('vis')">Fechar</button>
    `;
    painel.classList.add('vis');
    painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
