(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
