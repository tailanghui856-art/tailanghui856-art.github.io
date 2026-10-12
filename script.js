(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 4) * 70, 210)}ms`;
      observer.observe(el);
    });
  } else revealEls.forEach(el => el.classList.add('in-view'));

  // Project category filter
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.project-card');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.classList.toggle('active', item === button));
    const selected = button.dataset.filter;
    cards.forEach(card => {
      card.classList.toggle('is-hidden', selected !== 'all' && card.dataset.category !== selected);
    });
  }));

  // Mobile navigation
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menuButton?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  // Cursor label on project cards
  const cursorLabel = document.querySelector('.cursor-label');
  if (cursorLabel && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('pointerenter', () => cursorLabel.classList.add('visible'));
      card.addEventListener('pointerleave', () => cursorLabel.classList.remove('visible'));
      card.addEventListener('pointermove', e => {
        cursorLabel.style.left = `${e.clientX}px`;
        cursorLabel.style.top = `${e.clientY}px`;
      });
    });
  }

  // Lightweight blue particle trail. Disabled on touch and reduced-motion devices.
  const canvas = document.getElementById('particles');
  if (!canvas || reduceMotion || !matchMedia('(pointer:fine)').matches) return;
  const ctx = canvas.getContext('2d');
  let width, height, particles = [], lastSpawn = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastSpawn < 22) return;
    lastSpawn = now;
    particles.push({ x:e.clientX, y:e.clientY, r:1.2 + Math.random()*2.1, a:.75, vx:(Math.random()-.5)*.7, vy:(Math.random()-.5)*.7 });
    if (particles.length > 75) particles.shift();
  }, { passive: true });
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    particles = particles.filter(p => p.a > .035);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.a *= .955; p.r *= .992;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(74, 110, 255, ${p.a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
})();