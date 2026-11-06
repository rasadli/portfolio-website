(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Architecture Explorer: select a node to highlight its connections and show its note
  const nodes = [...document.querySelectorAll('.node')];
  if (nodes.length) {
    const paths = [...document.querySelectorAll('.ex-paths path')];
    const items = [...document.querySelectorAll('.ex-item')];
    const group = document.querySelector('.ex-paths');
    const select = (id) => {
      const near = new Set();
      paths.forEach((p) => {
        const on = p.dataset.a === id || p.dataset.b === id;
        p.classList.toggle('on', on);
        if (on) { near.add(p.dataset.a); near.add(p.dataset.b); }
      });
      group.classList.add('has-sel');
      nodes.forEach((n) => {
        n.setAttribute('aria-pressed', String(n.dataset.node === id));
        n.classList.toggle('near', near.has(n.dataset.node) && n.dataset.node !== id);
      });
      items.forEach((i) => i.classList.toggle('active', i.dataset.item === id));
    };
    nodes.forEach((n) => n.addEventListener('click', () => select(n.dataset.node)));
    const first = nodes.find((n) => n.getAttribute('aria-pressed') === 'true') || nodes[0];
    select(first.dataset.node);
  }

  // Mobile menu
  const menu = document.querySelector('.menu');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menu.focus(); }
  });

  // Opening a linked role in the experience index
  const openTarget = () => {
    const t = location.hash && document.querySelector(location.hash);
    if (t && t.tagName === 'DETAILS') t.open = true;
  };
  addEventListener('hashchange', openTarget);
  openTarget();

  // Section entrances. Content stays visible without JS (see .js .reveal in the CSS).
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // Active nav link
  const links = [...document.querySelectorAll('.nav a[href*="#"]')];
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(en.target.id).setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
})();
