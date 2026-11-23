/* Vidraçaria União — prévia conceitual. Sem dependências. */
(() => {
  'use strict';
  const WHATS = '5548991230037';
  const doc = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const waLink = texto => `https://wa.me/${WHATS}?text=${encodeURIComponent(texto)}`;

  /* Links de WhatsApp com mensagem pronta */
  document.querySelectorAll('[data-whats]').forEach(a => { a.href = waLink(a.dataset.whats); });

  /* ---------- Lâmina canelada (assinatura) ---------- */
  const hero = document.querySelector('[data-hero]');
  const moldura = document.querySelector('[data-moldura]');
  const contador = document.querySelector('[data-abertura]');
  const feImg = document.getElementById('mapa-canelado');
  // Safari não aplica filtros SVG com feImage em HTML de forma confiável: usa vidro jateado.
  const safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  if (safari) doc.classList.add('sem-filtro');

  function mapaCanelado() {
    if (!moldura || !feImg || safari) return;
    const w = Math.max(1, Math.round(moldura.clientWidth));
    const h = Math.max(1, Math.round(moldura.clientHeight));
    const c = document.createElement('canvas');
    c.width = w; c.height = 2;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, 2);
    const passo = w < 340 ? 11 : 15; // largura de cada canelura em px
    for (let x = 0; x < w; x++) {
      const t = (x % passo) / passo;              // 0..1 dentro da canelura
      const lente = Math.sin(t * Math.PI * 2);     // curvatura da canelura
      const r = Math.round(128 + 120 * lente);
      for (let y = 0; y < 2; y++) {
        const i = (y * w + x) * 4;
        img.data[i] = r; img.data[i + 1] = 128; img.data[i + 2] = 128; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    feImg.setAttribute('href', c.toDataURL());
    feImg.setAttribute('width', w);
    feImg.setAttribute('height', h);
  }

  let pHero = -1, alvo = 0, atual = 0, rodando = false;
  function lerHero() {
    if (!hero) return 0;
    const r = hero.getBoundingClientRect();
    const curso = hero.offsetHeight - innerHeight;
    return curso > 0 ? clamp(-r.top / (curso * .82)) : 1;
  }
  function pintaHero(p) {
    if (Math.abs(p - pHero) < .001) return;
    pHero = p;
    moldura.style.setProperty('--p', p.toFixed(4));
    hero.style.setProperty('--p', p.toFixed(4));
    if (contador) contador.textContent = `${Math.round(p * 100)}% aberta`;
  }
  // Mola leve: a lâmina segue a rolagem com um pouco de inércia, sem atrasar o conteúdo.
  function passo() {
    atual += (alvo - atual) * .16;
    if (Math.abs(alvo - atual) < .0008) atual = alvo;
    pintaHero(atual);
    if (atual !== alvo) requestAnimationFrame(passo); else rodando = false;
  }

  /* ---------- Corte da lâmina ---------- */
  const tecnica = document.querySelector('[data-tecnica]');
  const corte = document.querySelector('[data-corte]');
  function lerTecnica() {
    if (!tecnica) return 0;
    const r = tecnica.getBoundingClientRect();
    const curso = tecnica.offsetHeight - innerHeight;
    if (curso > 40) return clamp((-r.top + innerHeight * .15) / (curso * .7));
    return clamp((innerHeight * .85 - r.top) / (innerHeight * .9));
  }

  /* ---------- Topo e barra fixa ---------- */
  const topo = document.querySelector('[data-topo]');
  const barra = document.querySelector('[data-barra]');
  const orcamento = document.getElementById('orcamento');
  let orcVisivel = false;

  function aoRolar() {
    const y = scrollY;
    topo.classList.toggle('is-solido', y > 30);
    if (barra) barra.classList.toggle('is-visivel', y > innerHeight * .9 && !orcVisivel);
    if (reduz.matches) return;
    alvo = lerHero();
    if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    if (corte) corte.style.setProperty('--q', lerTecnica().toFixed(3));
  }

  function iniciaMovimento() {
    if (reduz.matches) {
      if (moldura) { moldura.style.removeProperty('--p'); }
      if (contador) contador.textContent = '62% aberta';
      if (corte) corte.style.setProperty('--q', '1');
    } else {
      atual = alvo = lerHero(); pintaHero(atual);
    }
    aoRolar();
  }

  addEventListener('scroll', aoRolar, { passive: true });
  let tResize;
  addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(() => { mapaCanelado(); aoRolar(); }, 120); });
  reduz.addEventListener?.('change', iniciaMovimento);

  /* ---------- Revelações (line-mask, curtain, régua) ---------- */
  const anos = document.querySelector('[data-anos]');
  const regua = document.querySelector('[data-regua]');
  function contaAnos() {
    if (!anos) return;
    if (reduz.matches) { anos.textContent = '57'; return; }
    const t0 = performance.now();
    const anima = t => {
      const k = clamp((t - t0) / 1600);
      const e = 1 - Math.pow(1 - k, 3);
      anos.textContent = Math.round(e * 57);
      if (k < 1) requestAnimationFrame(anima);
    };
    requestAnimationFrame(anima);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entradas => {
      entradas.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-visivel');
        if (el === regua) { el.style.setProperty('--r', 1); contaAnos(); }
        io.unobserve(el);
      });
    }, { threshold: .25, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.mascara, .revela').forEach(el => io.observe(el));
    if (regua) { regua.style.setProperty('--r', 0); io.observe(regua); }
    if (orcamento) new IntersectionObserver(([en]) => { orcVisivel = en.isIntersecting; aoRolar(); }, { threshold: .15 }).observe(orcamento);
  } else {
    doc.classList.add('sem-js');
  }

  /* ---------- Linhas: painéis (accordion) ---------- */
  const paineis = [...document.querySelectorAll('[data-painel]')];
  function abre(idx, foco) {
    paineis.forEach((p, i) => {
      const on = i === idx;
      p.classList.toggle('is-aberto', on);
      const aba = p.querySelector('.painel__aba');
      aba.setAttribute('aria-expanded', on);
      p.querySelector('[role="region"]').hidden = !on;
      if (on && foco) aba.focus({ preventScroll: true });
    });
  }
  paineis.forEach((p, i) => {
    const aba = p.querySelector('.painel__aba');
    aba.addEventListener('click', () => abre(i));
    aba.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); abre((i + d + paineis.length) % paineis.length, true); }
      if (e.key === 'Home') { e.preventDefault(); abre(0, true); }
      if (e.key === 'End') { e.preventDefault(); abre(paineis.length - 1, true); }
    });
  });

  /* ---------- Seletor do tipo de vidro ---------- */
  const seletor = document.querySelector('[data-seletor]');
  const rotulos = {
    temperado: ['Vidro temperado', '', ''],
    laminado: ['Lâmina 4 mm', 'Intercamada PVB', 'Lâmina 5 mm'],
    sentry: ['Lâmina 4 mm', 'Intercamada SentryGlas', 'Lâmina 5 mm'],
  };
  if (seletor && corte) {
    const botoes = [...seletor.querySelectorAll('[data-tipo]')];
    const escolhe = (b, foco) => {
      const tipo = b.dataset.tipo;
      botoes.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
      corte.dataset.tipo = tipo;
      document.querySelectorAll('[data-explica]').forEach(d => { d.hidden = d.dataset.explica !== tipo; });
      const [a, m, c] = rotulos[tipo];
      corte.querySelector('[data-rotulo-a]').textContent = a;
      corte.querySelector('[data-rotulo-b]').textContent = m;
      corte.querySelector('[data-rotulo-c]').textContent = c;
      if (foco) b.focus();
    };
    botoes.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', () => escolhe(b));
      b.addEventListener('keydown', e => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); escolhe(botoes[(i + d + botoes.length) % botoes.length], true); }
      });
    });
    escolhe(botoes[0]);
  }

  /* ---------- Formulário → WhatsApp ---------- */
  const form = document.querySelector('[data-form]');
  if (form) {
    const erro = form.querySelector('[data-erro]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      const nome = (f.get('nome') || '').toString().trim();
      const campoNome = form.elements.nome;
      if (!nome) {
        erro.textContent = 'Informe seu nome para a União saber com quem está falando.';
        erro.hidden = false;
        campoNome.setAttribute('aria-invalid', 'true');
        campoNome.focus();
        return;
      }
      erro.hidden = true; campoNome.removeAttribute('aria-invalid');
      const linhas = f.getAll('linha');
      const partes = [
        `Olá! Meu nome é ${nome} e vim pela página da União.`,
        linhas.length ? `Preciso de: ${linhas.join(', ')}.` : 'Gostaria de um orçamento.',
        f.get('cidade') ? `Cidade: ${f.get('cidade').toString().trim()}.` : '',
        f.get('medidas') ? `Medidas aproximadas: ${f.get('medidas').toString().trim()}.` : '',
        f.get('mensagem') ? `Sobre o projeto: ${f.get('mensagem').toString().trim()}` : '',
      ].filter(Boolean);
      window.open(waLink(partes.join('\n')), '_blank', 'noopener');
    });
    form.elements.nome.addEventListener('input', () => { erro.hidden = true; form.elements.nome.removeAttribute('aria-invalid'); });
  }

  mapaCanelado();
  iniciaMovimento();
})();
