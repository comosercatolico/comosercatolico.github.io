/* =====================================================
   MANDAMENTOS.JS — Lux Fidei
   ===================================================== */

'use strict';

/* ============================================================
   1. PARTÍCULAS
   ============================================================ */
(function initParticulas() {
  const canvas = document.getElementById('particulas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W = 0, H = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.body.scrollHeight;
  }

  function spawn() {
    particles = [];
    const n = Math.min(Math.floor((W * H) / 22000), 120);
    for (let i = 0; i < n; i++) {
      particles.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.4 + 0.2,
        dx: (Math.random() - 0.5) * 0.25,
        dy: (Math.random() - 0.5) * 0.25,
        a:  Math.random() * 0.35 + 0.05
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize(); spawn(); draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); spawn(); }, 300);
  });

  new ResizeObserver(() => {
    H = canvas.height = document.body.scrollHeight;
  }).observe(document.body);
})();


/* ============================================================
   2. BARRA DE PROGRESSO DE LEITURA
   ============================================================ */
(function initProgressoLeitura() {
  const bar = document.getElementById('barraProgresso');
  const pct = document.getElementById('barraPct');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    const p        = total > 0 ? Math.min((scrolled / total) * 100, 100) : 0;
    bar.style.width = p + '%';
    if (pct) pct.textContent = Math.round(p) + '%';
  }, { passive: true });
})();


/* ============================================================
   3. NAV LATERAL — aparece após 300px de scroll
   ============================================================ */
(function initNavLateral() {
  const nav     = document.getElementById('navLateral');
  const btnTopo = document.getElementById('btnTopo');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      nav.classList.add('visivel');
      if (btnTopo) btnTopo.classList.add('visivel');
    } else {
      nav.classList.remove('visivel');
      if (btnTopo) btnTopo.classList.remove('visivel');
    }

    // Destacar mandamento ativo
    const items = nav.querySelectorAll('.nav-lat-item[data-num]');
    items.forEach(item => item.classList.remove('ativo'));

    for (let i = 10; i >= 1; i--) {
      const sec = document.getElementById('m' + i);
      if (sec && sec.getBoundingClientRect().top <= window.innerHeight / 2) {
        const ativo = nav.querySelector(`[data-num="${i}"]`);
        if (ativo) ativo.classList.add('ativo');
        break;
      }
    }
  }, { passive: true });

  // Scroll suave nos links
  nav.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id  = a.getAttribute('href').slice(1);
      const el  = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();


/* ============================================================
   4. SCROLL SUAVE (função global)
   ============================================================ */
function scrollSuave(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* ============================================================
   5. ANIMAÇÕES AO SCROLL (IntersectionObserver)
   ============================================================ */
(function initAOS() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visivel');
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.timeline-item, [data-aos]').forEach(el => obs.observe(el));
})();


/* ============================================================
   6. CONTADORES ANIMADOS (Hero)
   ============================================================ */
(function initContadores() {
  const nums = document.querySelectorAll('.stat-num[data-target]');
  if (!nums.length) return;

  let iniciado = false;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !iniciado) {
      iniciado = true;
      nums.forEach(el => {
        const target   = parseInt(el.dataset.target);
        const duracao  = 1800;
        const passoMs  = 16;
        const passos   = duracao / passoMs;
        const incremento = target / passos;
        let atual = 0;

        const timer = setInterval(() => {
          atual += incremento;
          if (atual >= target) {
            atual = target;
            clearInterval(timer);
          }
          const val = Math.floor(atual);
          el.textContent = target >= 1000
            ? val.toLocaleString('pt-BR') + '+'
            : val;
        }, passoMs);
      });
    }
  }, { threshold: 0.5 });

  const container = nums[0].closest('.hero-stats');
  if (container) obs.observe(container);
})();


/* ============================================================
   7. PROGRESSO DE ESTUDO (localStorage)
   ============================================================ */
function getEstudados() {
  return JSON.parse(localStorage.getItem('mand_estudados') || '[]');
}
function setEstudados(arr) {
  localStorage.setItem('mand_estudados', JSON.stringify(arr));
}

function marcarEstudado(num, checked) {
  let est = getEstudados();
  if (checked && !est.includes(num)) est.push(num);
  else if (!checked) est = est.filter(n => n !== num);
  setEstudados(est);
  atualizarProgressoFinal();
}

// Restaurar checkboxes ao carregar
(function restaurarChecks() {
  const est = getEstudados();
  est.forEach(num => {
    const sec = document.querySelector(`.mandamento[data-mandamento="${num}"]`);
    if (sec) {
      const cb = sec.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = true;
    }
  });
})();

function atualizarProgressoFinal() {
  const container = document.getElementById('progressoDots');
  const barra     = document.getElementById('progressoBarraGeral');
  const msg       = document.getElementById('progressoMensagem');
  if (!container) return;

  const est    = getEstudados();
  const total  = 10;
  const feitos = est.length;
  const pct    = (feitos / total) * 100;
  const romanos = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

  container.innerHTML = '';
  romanos.forEach((r, i) => {
    const dot       = document.createElement('div');
    const mandNum   = i + 1;
    const concluido = est.includes(mandNum);
    dot.className   = 'pdot ' + (concluido ? 'feito' : 'pendente');
    dot.textContent = r;
    dot.title       = (concluido ? '✅ ' : '⬜ ') + mandNum + 'º Mandamento';
    container.appendChild(dot);
  });

  if (barra) barra.style.width = pct + '%';

  if (msg) {
    if (feitos === 0)
      msg.textContent = 'Comece marcando os mandamentos que você estudou acima!';
    else if (feitos < 4)
      msg.textContent = `${feitos} de 10 estudados. Ótimo começo! Continue! 🕯️`;
    else if (feitos < 7)
      msg.textContent = `${feitos} de 10 estudados. Você está indo muito bem! 🔥`;
    else if (feitos < 10)
      msg.textContent = `${feitos} de 10 estudados. Quase lá! Continue firme! 💪`;
    else
      msg.textContent = '🏆 Parabéns! Você estudou todos os 10 Mandamentos! Deus abençoe sua dedicação!';
  }
}

// Inicializar ao carregar
atualizarProgressoFinal();


/* ============================================================
   8. QUIZ
   ============================================================ */
const PERGUNTAS_BASE = [
  {
    p: 'Quantas tábuas de pedra Deus entregou a Moisés no Monte Sinai?',
    opts: ['Uma', 'Duas', 'Três', 'Dez'],
    c: 1,
    exp: '📜 Deus entregou <strong>duas tábuas de pedra</strong>, escritas pelo "dedo de Deus" (Ex 31,18). A 1ª tábua contém os mandamentos sobre o amor a Deus (1–3) e a 2ª sobre o amor ao próximo (4–10).'
  },
  {
    p: 'Qual é o único dos 10 Mandamentos que vem acompanhado de uma promessa explícita?',
    opts: ['1º — Amar a Deus', '4º — Honrar pai e mãe', '5º — Não matar', '7º — Não furtar'],
    c: 1,
    exp: '👨‍👩‍👧 O 4º mandamento: <em>"Honra teu pai e tua mãe, <strong>para que se prolonguem os teus dias</strong>"</em> (Ex 20,12). É o único que traz uma promessa de bênção — vida longa!'
  },
  {
    p: 'Segundo o Catecismo da Igreja Católica, faltar à Missa dominical deliberadamente, sem motivo grave, é:',
    opts: ['Pecado venial leve', 'Apenas falta de devoção', 'Pecado mortal', 'Recomendável evitar, mas não é pecado'],
    c: 2,
    exp: '⛪ O CIC 2181 é claro: os fiéis têm <strong>obrigação grave</strong> de participar da Missa nos domingos e festas de guarda. Faltar deliberadamente sem razão séria é <strong>pecado mortal</strong>.'
  },
  {
    p: 'Jesus disse que quem olha para outra pessoa com desejo impuro já cometeu:',
    opts: ['Somente pensamento pecaminoso venial', 'Adultério no coração', 'Fornicação espiritual', 'Uma tentação, não pecado'],
    c: 1,
    exp: '❤️ Mt 5,28: <em>"Todo aquele que olhar para uma mulher para desejá-la <strong>já cometeu adultério com ela no seu coração</strong>."</em> Jesus vai à raiz: o pecado começa no consentimento interior.'
  },
  {
    p: 'A superstição (consultar horóscopo, usar amuletos, fazer simpatias) viola principalmente qual mandamento?',
    opts: ['8º — Não mentir', '1º — Não ter outros deuses', '3º — Guardar o domingo', '2º — Não usar o nome de Deus em vão'],
    c: 1,
    exp: '🔮 A superstição é uma forma de <strong>idolatria</strong> (CIC 2110-2111). Atribuir poder a objetos, astros ou rituais é colocar a confiança em algo que não é Deus — viola o 1º mandamento.'
  },
  {
    p: 'Na moral católica, qual é a diferença entre "calúnia" e "difamação"?',
    opts: [
      'São sinônimos — a mesma coisa',
      'Calúnia = revelar defeitos reais; Difamação = atribuir defeitos falsos',
      'Calúnia = atribuir defeitos FALSOS; Difamação = revelar defeitos REAIS sem necessidade',
      'Difamação é mais grave que calúnia'
    ],
    c: 2,
    exp: '🗣️ <strong>Calúnia:</strong> atribuir ao próximo uma falta ou crime que não cometeu. <strong>Difamação:</strong> revelar sem necessidade defeitos reais da pessoa. Ambas violam o 8º mandamento e a reputação do próximo.'
  },
  {
    p: 'Quem escreveu os 10 Mandamentos nas tábuas de pedra?',
    opts: ['Moisés, sob ditado divino', 'Os sacerdotes levitas', 'O próprio Deus — "pelo dedo de Deus"', 'Um profeta anônimo'],
    c: 2,
    exp: '✍️ A Bíblia é explícita: <em>"Deu a Moisés duas tábuas de pedra, escritas <strong>pelo dedo de Deus</strong>"</em> (Ex 31,18). Moisés as recebeu — não as escreveu.'
  },
  {
    p: 'São Paulo chama a cobiça de:',
    opts: ['Pecado capital apenas', 'Uma forma de preguiça', 'Idolatria', 'Falta leve que não precisa de confissão'],
    c: 2,
    exp: '💰 Cl 3,5: <em>"Mortificai... a cobiça, <strong>que é idolatria</strong>."</em> Quando cobiçamos, colocamos o bem desejado acima de Deus. Por isso São Paulo a chama de idolatria — viola simultaneamente o 1º e o 10º mandamentos.'
  },
  {
    p: 'Jesus resumiu todos os 10 mandamentos em dois. Quais são?',
    opts: [
      'Amar a Deus e guardar os sacramentos',
      'Amar a Deus sobre tudo e amar o próximo como a si mesmo',
      'Não matar e não roubar',
      'Orar sempre e jejuar frequentemente'
    ],
    c: 1,
    exp: '✝️ Mt 22,37-40: <em>"Amarás o Senhor teu Deus de todo o coração... e <strong>amarás o teu próximo como a ti mesmo</strong>. Destes dois mandamentos dependem toda a Lei e os Profetas."</em>'
  },
  {
    p: 'Segundo a Igreja, o sigilo da confissão sacramental:',
    opts: [
      'Pode ser quebrado em casos de crime grave',
      'É inviolável — o padre nunca pode revelar o que ouviu na confissão',
      'Pode ser quebrado com permissão do bispo',
      'Aplica-se apenas a pecados mortais'
    ],
    c: 1,
    exp: '🔐 O sigilo sacramental é <strong>absolutamente inviolável</strong> (CIC 2490). O padre que o quebrasse sofreria excomunhão automática. Isso está relacionado ao 8º mandamento (sigilo) e ao respeito pela intimidade da pessoa.'
  }
];

let quizPerguntas  = [];
let quizAtual      = 0;
let quizAcertos    = 0;
let quizRespondido = false;

function iniciarQuiz() {
  // Embaralhar
  quizPerguntas  = [...PERGUNTAS_BASE].sort(() => Math.random() - 0.5);
  quizAtual      = 0;
  quizAcertos    = 0;
  quizRespondido = false;

  document.getElementById('quizIntro').style.display    = 'none';
  document.getElementById('quizResultado').style.display = 'none';
  document.getElementById('quizPerguntas').style.display = 'block';

  renderPergunta();
}

function renderPergunta() {
  const q = quizPerguntas[quizAtual];
  document.getElementById('quizNumTxt').textContent    = `Pergunta ${quizAtual + 1} de ${quizPerguntas.length}`;
  document.getElementById('quizAcertosTxt').textContent = `✅ ${quizAcertos} acertos`;
  document.getElementById('quizBarraFill').style.width  = `${((quizAtual) / quizPerguntas.length) * 100}%`;
  document.getElementById('quizPerguntaTxt').textContent = q.p;

  const opcoesEl = document.getElementById('quizOpcoes');
  opcoesEl.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const btn       = document.createElement('button');
    btn.className   = 'opcao-btn';
    btn.innerHTML   = `<strong>${['A','B','C','D'][i]})</strong> ${opt}`;
    btn.onclick     = () => responder(i);
    opcoesEl.appendChild(btn);
  });

  const fb = document.getElementById('quizFeedback');
  fb.className  = 'quiz-feedback';
  fb.innerHTML  = '';
  document.getElementById('btnProximo').style.display = 'none';
  quizRespondido = false;
}

function responder(idx) {
  if (quizRespondido) return;
  quizRespondido = true;

  const q       = quizPerguntas[quizAtual];
  const botoes  = document.querySelectorAll('.opcao-btn');
  const fb      = document.getElementById('quizFeedback');
  const btnProx = document.getElementById('btnProximo');
  const acertou = idx === q.c;

  if (acertou) quizAcertos++;

  botoes.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.c)  btn.classList.add('correta');
    if (i === idx && !acertou) btn.classList.add('errada');
  });

  fb.className = 'quiz-feedback show ' + (acertou ? 'certo' : 'errado');
  fb.innerHTML = (acertou ? '✅ <strong>Correto!</strong>' : '❌ <strong>Incorreto.</strong>') + '<br>' + q.exp;

  const ultimo = quizAtual === quizPerguntas.length - 1;
  btnProx.textContent      = ultimo ? '🏆 Ver resultado' : 'Próxima →';
  btnProx.style.display    = 'inline-block';
}

function proximaPergunta() {
  quizAtual++;
  if (quizAtual >= quizPerguntas.length) {
    mostrarResultado();
    return;
  }
  renderPergunta();
  document.getElementById('quizAcertosTxt').textContent = `✅ ${quizAcertos} acertos`;
}

function mostrarResultado() {
  document.getElementById('quizPerguntas').style.display  = 'none';
  const res = document.getElementById('quizResultado');
  res.style.display = 'block';

  const pct = quizAcertos / quizPerguntas.length;
  let emoji, titulo, msg;

  if (pct === 1)      { emoji = '🏆'; titulo = 'Perfeito — Mestre da Lei!';         msg = 'Você acertou todas as 10 perguntas! Seu conhecimento dos mandamentos é exemplar. Continue vivendo e compartilhando essa sabedoria!'; }
  else if (pct >= .8) { emoji = '🌟'; titulo = 'Excelente!';                          msg = 'Quase perfeito! Você demonstra um conhecimento sólido. Reveja as que errou e certamente alcançará 100%.'; }
  else if (pct >= .6) { emoji = '📖'; titulo = 'Muito bem!';                          msg = 'Bom resultado! Há ainda riquezas a descobrir nos mandamentos. Releia as seções e refaça o quiz.'; }
  else if (pct >= .4) { emoji = '🕯️'; titulo = 'Bom começo!';                        msg = 'Você está no caminho certo. Os mandamentos têm profundidade inexaurível — estude cada seção com calma e tente de novo!'; }
  else                 { emoji = '🙏'; titulo = 'Hora de mergulhar no estudo!';       msg = 'Não desanime — a humildade de reconhecer que não sabemos é o início de toda sabedoria. Leia cada mandamento com atenção e volte!'; }

  document.getElementById('resultadoEmoji').textContent  = emoji;
  document.getElementById('resultadoTitulo').textContent  = titulo;
  document.getElementById('scoreFinal').textContent       = quizAcertos;
  document.getElementById('resultadoMsg').textContent     = msg;

  setTimeout(() => {
    const barraRes = document.getElementById('resultadoBarraFill');
    if (barraRes) barraRes.style.width = pct * 100 + '%';
  }, 100);
}

function reiniciarQuiz() {
  quizPerguntas  = [...PERGUNTAS_BASE].sort(() => Math.random() - 0.5);
  quizAtual      = 0;
  quizAcertos    = 0;
  quizRespondido = false;

  document.getElementById('quizResultado').style.display  = 'none';
  document.getElementById('quizPerguntas').style.display  = 'block';
  renderPergunta();
}
