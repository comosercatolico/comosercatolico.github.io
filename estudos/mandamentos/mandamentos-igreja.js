// ══════════════════════════════════════
// PARTÍCULAS
// ══════════════════════════════════════
const canvas = document.getElementById('particulas');
const ctx = canvas.getContext('2d');
let particulas = [];

function redimensionar() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
redimensionar();
window.addEventListener('resize', redimensionar);

function criarParticula() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.3,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.4 - 0.1,
    vida: 0,
    maxVida: Math.random() * 200 + 100
  };
}

for (let i = 0; i < 80; i++) particulas.push(criarParticula());

function animarParticulas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particulas.forEach((p, i) => {
    p.vida++;
    p.x += p.vx; p.y += p.vy;
    const alpha = Math.sin((p.vida / p.maxVida) * Math.PI) * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,76,${alpha})`;
    ctx.fill();
    if (p.vida >= p.maxVida) particulas[i] = criarParticula();
  });
  requestAnimationFrame(animarParticulas);
}
animarParticulas();

// ══════════════════════════════════════
// BARRA DE PROGRESSO DE LEITURA
// ══════════════════════════════════════
window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - window.innerHeight;
  const pct = Math.round((window.scrollY / max) * 100);
  document.getElementById('barraProgresso').style.width = pct + '%';
  document.getElementById('barraPct').textContent = pct + '%';

  // botão topo
  document.getElementById('btnTopo').classList.toggle('visivel', window.scrollY > 400);

  // nav lateral
  document.getElementById('navLateral').classList.toggle('visivel', window.scrollY > 300);

  // ativo na nav
  const itens = document.querySelectorAll('.nav-lat-item[data-num]');
  itens.forEach(item => {
    const n = item.getAttribute('data-num');
    const sec = document.getElementById('p' + n);
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    item.classList.toggle('ativo', rect.top <= 200 && rect.bottom > 200);
  });
});

// ══════════════════════════════════════
// ANIMAÇÕES AO SCROLLAR
// ══════════════════════════════════════
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visivel'); });
}, { threshold: 0.1 });
document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

// ══════════════════════════════════════
// CONTADORES ANIMADOS
// ══════════════════════════════════════
function animarContador(el) {
  const target = +el.dataset.target;
  if (isNaN(target)) return;
  let current = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('pt-BR');
    if (current >= target) clearInterval(timer);
  }, 20);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num[data-target]').forEach(animarContador);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ══════════════════════════════════════
// PROGRESSO DE ESTUDO
// ══════════════════════════════════════
const total = 6;
let estudados = JSON.parse(localStorage.getItem('prec-estudados') || '[]');

function marcarEstudado(n, checked) {
  if (checked && !estudados.includes(n)) estudados.push(n);
  if (!checked) estudados = estudados.filter(x => x !== n);
  localStorage.setItem('prec-estudados', JSON.stringify(estudados));
  atualizarProgresso();
}

function atualizarProgresso() {
  const dots = document.getElementById('progressoDots');
  if (!dots) return;
  dots.innerHTML = '';
  for (let i = 1; i <= total; i++) {
    const feito = estudados.includes(i);
    const a = document.createElement('a');
    a.href = '#p' + i;
    a.className = 'prog-dot' + (feito ? ' feito' : '');
    a.textContent = ['I','II','III','IV','V','VI'][i-1];
    dots.appendChild(a);
  }
  const pct = Math.round((estudados.length / total) * 100);
  document.getElementById('progressoBarraGeral').style.width = pct + '%';
  const msgs = [
    'Você ainda não começou. O primeiro passo é o mais importante.',
    'Bom começo! Continue — cada preceito aprendido vale.',
    'Você está no caminho. Não pare agora.',
    'Metade do caminho. Você está indo muito bem!',
    'Quase lá! Falta pouco para completar o estudo.',
    'Excelente! Você estudou quase todos os preceitos.',
    '🏆 Parabéns! Você estudou todos os 6 Preceitos da Igreja!'
  ];
  const idx = Math.min(estudados.length, 6);
  document.getElementById('progressoMensagem').textContent = msgs[idx];

  // sincronizar checkboxes
  document.querySelectorAll('.preceito').forEach(sec => {
    const n = +sec.getAttribute('data-preceito');
    const cb = sec.querySelector('input[type=checkbox]');
    if (cb) cb.checked = estudados.includes(n);
  });
}

atualizarProgresso();

// ══════════════════════════════════════
// QUIZ
// ══════════════════════════════════════
const perguntas = [
  {
    p: "Quantos são os Preceitos da Igreja Católica?",
    ops: ["4", "5", "6", "10"],
    c: 2,
    exp: "São 6 os Preceitos da Igreja, listados no CIC 2041-2043. Eles definem o mínimo da vida sacramental e comunitária do cristão."
  },
  {
    p: "O 1º Preceito obriga o católico a:",
    ops: ["Rezar o Rosário diariamente", "Participar da Missa aos domingos e festas de guarda", "Confessar-se toda semana", "Fazer jejum toda segunda-feira"],
    c: 1,
    exp: "O 1º Preceito obriga à participação na Missa dominical e nas festas de guarda. Faltar deliberadamente sem causa grave é pecado mortal."
  },
  {
    p: "Com que frequência mínima o 2º Preceito obriga o cristão a se confessar?",
    ops: ["Todo mês", "Toda semana santa", "Ao menos uma vez por ano", "A cada dois anos"],
    c: 2,
    exp: "O 2º Preceito exige confissão ao menos uma vez por ano — especialmente para quem tem pecados mortais. É o mínimo absoluto; os santos confessavam muito mais frequentemente."
  },
  {
    p: "O 3º Preceito exige que o cristão comungue ao menos:",
    ops: ["Uma vez por semana", "Uma vez por mês", "Na época pascal", "Toda sexta-feira"],
    c: 2,
    exp: "O 3º Preceito exige comunhão ao menos uma vez por ano, na época pascal (período entre a Quaresma e Pentecostes). É o mínimo — a Igreja recomenda comunhão mais frequente."
  },
  {
    p: "Qual condição é necessária para receber a Eucaristia dignamente?",
    ops: ["Ter ido à Missa na semana anterior", "Estar em graça — sem pecado mortal", "Ter feito jejum por 24 horas", "Ser membro ativo de uma equipe paroquial"],
    c: 1,
    exp: "Para comungar dignamente, é preciso estar em estado de graça. Quem tem consciência de pecado mortal deve antes confessar-se. Comungar em pecado mortal é sacrilégio (cf. 1Cor 11,27-29)."
  },
  {
    p: "O 4º Preceito trata de:",
    ops: ["Rezar o ofício divino", "Guardar os dias de jejum e abstinência", "Pagar o dízimo", "Frequentar a catequese"],
    c: 1,
    exp: "O 4º Preceito obriga ao jejum e abstinência nos dias prescritos — especialmente Quarta de Cinzas, Sexta-feira Santa e todas as sextas do ano."
  },
  {
    p: "Em que dias os católicos são obrigados à abstinência de carne?",
    ops: ["Apenas na Semana Santa", "Toda quarta e sexta-feira do ano", "Todas as sextas-feiras do ano (e Quarta de Cinzas)", "Apenas nas sextas da Quaresma"],
    c: 2,
    exp: "A abstinência de carne é obrigatória na Quarta de Cinzas e em todas as sextas-feiras do ano — não apenas da Quaresma. Pode ser substituída por outra mortificação equivalente (verificar normas da conferência episcopal local)."
  },
  {
    p: "O 5º Preceito trata da responsabilidade do cristão em:",
    ops: ["Evangelizar nas ruas", "Prover as necessidades materiais da Igreja", "Educar os filhos na fé", "Rezar por vocações sacerdotais"],
    c: 1,
    exp: "O 5º Preceito obriga cada fiel a contribuir — segundo suas possibilidades — para as necessidades materiais da Igreja: templos, sustento do clero, obras sociais, missões."
  },
  {
    p: "O 6º Preceito refere-se a:",
    ops: ["Obrigação de frequentar grupos de oração", "Observância das leis da Igreja sobre o matrimônio", "Dever de participar de peregrinações", "Obrigação de rezar o Rosário em família"],
    c: 1,
    exp: "O 6º Preceito exige a observância das leis canônicas sobre o matrimônio — celebração na forma canônica, fidelidade conjugal e abertura à vida."
  },
  {
    p: "O Catecismo chama os Preceitos da Igreja de:",
    ops: ["O máximo da vida cristã", "O mínimo indispensável do espírito de oração", "Sugestões pastorais", "Tradições regionais variáveis"],
    c: 1,
    exp: "O CIC 2041 chama os Preceitos de 'mínimo indispensável no espírito de oração e esforço moral'. São o piso — não o teto — da vida cristã."
  }
];

let quizAtual = 0, quizAcertos = 0, respondidas = [];

function iniciarQuiz() {
  quizAtual = 0; quizAcertos = 0; respondidas = [];
  document.getElementById('quizIntro').style.display = 'none';
  document.getElementById('quizPerguntas').style.display = 'block';
  document.getElementById('quizResultado').style.display = 'none';
  mostrarPergunta();
}

function mostrarPergunta() {
  const q = perguntas[quizAtual];
  document.getElementById('quizNumTxt').textContent = `Pergunta ${quizAtual + 1} de 10`;
  document.getElementById('quizAcertosTxt').textContent = `✅ ${quizAcertos} acertos`;
  document.getElementById('quizBarraFill').style.width = (quizAtual / 10 * 100) + '%';
  document.getElementById('quizPerguntaTxt').textContent = q.p;
  document.getElementById('quizFeedback').className = 'quiz-feedback';
  document.getElementById('quizFeedback').innerHTML = '';
  document.getElementById('btnProximo').style.display = 'none';

  const letras = ['A', 'B', 'C', 'D'];
  const container = document.getElementById('quizOpcoes');
  container.innerHTML = '';
  q.ops.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opcao';
    btn.innerHTML = `<span class="opcao-letra">${letras[i]}</span>${op}`;
    btn.onclick = () => responder(i);
    container.appendChild(btn);
  });
}

function responder(idx) {
  const q = perguntas[quizAtual];
  const botoes = document.querySelectorAll('.quiz-opcao');
  botoes.forEach(b => b.disabled = true);

  const acertou = idx === q.c;
  if (acertou) quizAcertos++;
  respondidas.push({ acertou, idx, certo: q.c });

  botoes[idx].classList.add(acertou ? 'correta' : 'errada');
  if (!acertou) botoes[q.c].classList.add('correta');

  const fb = document.getElementById('quizFeedback');
  fb.className = 'quiz-feedback visivel ' + (acertou ? 'acerto' : 'erro');
  fb.innerHTML = `<strong>${acertou ? '✅ Correto!' : '❌ Não foi dessa vez.'}</strong>${q.exp}`;

  document.getElementById('quizAcertosTxt').textContent = `✅ ${quizAcertos} acertos`;
  document.getElementById('btnProximo').style.display = 'block';
  document.getElementById('btnProximo').textContent = quizAtual < 9 ? 'Próxima →' : 'Ver resultado →';
}

function proximaPergunta() {
  quizAtual++;
  if (quizAtual < 10) {
    mostrarPergunta();
  } else {
    mostrarResultado();
  }
}

function mostrarResultado() {
  document.getElementById('quizPerguntas').style.display = 'none';
  document.getElementById('quizResultado').style.display = 'block';

  const pct = quizAcertos / 10;
  let emoji, titulo, msg;
  if (pct === 1) { emoji = '🏆'; titulo = 'Perfeito!'; msg = 'Você domina os Preceitos da Igreja. Agora, viver é o desafio.' }
  else if (pct >= 0.8) { emoji = '🌟'; titulo = 'Excelente!'; msg = 'Você conhece muito bem os preceitos. Continue aprofundando!' }
  else if (pct >= 0.6) { emoji = '✅'; titulo = 'Muito bem!'; msg = 'Bom desempenho. Revise os pontos que escaparam.' }
  else if (pct >= 0.4) { emoji = '📖'; titulo = 'Pode melhorar!'; msg = 'Há espaço para crescer. Releia o conteúdo e tente novamente.' }
  else { emoji = '🙏'; titulo = 'Começando a jornada'; msg = 'Todo mestre já foi um iniciante. Revise o material e volte!' }

  document.getElementById('resultadoEmoji').textContent = emoji;
  document.getElementById('resultadoTitulo').textContent = titulo;
  document.getElementById('scoreFinal').textContent = quizAcertos;
  document.getElementById('resultadoMsg').textContent = msg;

  setTimeout(() => {
    document.getElementById('resultadoBarraFill').style.width = (pct * 100) + '%';
  }, 100);
}

function reiniciarQuiz() {
  document.getElementById('quizResultado').style.display = 'none';
  document.getElementById('quizIntro').style.display = 'block';
}
