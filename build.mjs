// Zero-dependency static generator. Run `node build.mjs`, then commit the output.
// GitHub Pages serves the generated HTML directly; no build runs on the server.
import { writeFileSync, mkdirSync } from 'node:fs';
import * as c from './content/portfolio.mjs';

const today = new Date();
const nowMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
const isoToday = today.toISOString().slice(0, 10);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toIndex = (ym) => { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1); };
const fmt = (ym) => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const range = (a, b) => `${fmt(a)} – ${b ? fmt(b) : 'Present'}`;
const dur = (a, b) => {
  const months = toIndex(b ?? nowMonth) - toIndex(a) + 1;
  const y = Math.floor(months / 12), m = months % 12;
  return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ');
};

const icon = {
  github: '<path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/>',
  linkedin: '<path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1Zm1.8 13.1H3.6V9h3.5v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/>',
};
const svgIcon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${icon[name]}</svg>`;
const ext = (href, label, cls = '') => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ''}>${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

/* ---------- Page shell ---------- */
function page({ base, title, description, canonical, body, jsonLd, nav = true }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(c.person.name)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#0e1216">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(c.person.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(c.site.url)}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(c.person.name)}, ${esc(c.person.role)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<script>try{var t=localStorage.getItem('theme');if(t){document.documentElement.dataset.theme=t}}catch(e){}document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,300..500;1,6..72,300..400&display=swap">
<link rel="stylesheet" href="${base}assets/site.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
<script src="${base}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(base, nav)}
<main id="main">
${body}
</main>
${footer(base)}
</body>
</html>
`;
}

const NAV = [['experience', 'Experience'], ['work', 'Work'], ['cases', 'Case studies'], ['research', 'Research'], ['stack', 'Stack'], ['record', 'Record']];

function header(base, nav) {
  const home = base ? `${base}index.html` : '#top';
  const links = NAV.map(([id, l]) => `<li><a href="${base ? `${base}index.html` : ''}#${id}">${l}</a></li>`).join('');
  return `<header class="bar">
  <a class="brand" href="${home}" aria-label="${esc(c.person.name)}, home"><span class="brand-mark" aria-hidden="true"></span>Rashad Asadli</a>
  <nav id="nav" class="nav" aria-label="Primary"><ul>${links}<li><a href="${base ? `${base}index.html` : ''}#contact" class="nav-cta">Contact</a></li></ul></nav>
  <div class="bar-tools">
    <button class="theme" type="button" aria-label="Switch color theme"><span aria-hidden="true" class="theme-dot"></span></button>
    <button class="menu" type="button" aria-expanded="false" aria-controls="nav"><span class="sr-only">Menu</span><span aria-hidden="true" class="menu-icon"></span></button>
  </div>
</header>`;
}

function footer(base) {
  return `<footer class="foot wrap">
  <p>© ${today.getFullYear()} ${esc(c.person.name)}</p>
  <p class="foot-links">${ext(c.person.github, 'GitHub')} ${ext(c.person.linkedin, 'LinkedIn')} <a href="${base}${c.person.resume}">Résumé</a></p>
</footer>`;
}

/* ---------- Trace waterfall ---------- */
function traceView() {
  const axisStart = toIndex('2022-09');
  const axisEnd = toIndex('2027-07');
  const pct = (i) => ((i - axisStart) / (axisEnd - axisStart)) * 100;
  const nowPct = pct(toIndex(nowMonth) + today.getDate() / 31);
  const years = [2023, 2024, 2025, 2026, 2027].filter((y) => Math.abs(pct(toIndex(`${y}-01`)) - nowPct) > 6);

  const rows = c.trace.map((s, i) => {
    const left = pct(toIndex(s.start));
    const realEnd = s.end ? toIndex(s.end) + 1 : null;
    const barEnd = realEnd ?? toIndex(nowMonth) + today.getDate() / 31;
    const isFuture = s.expected;
    const solidEnd = isFuture ? toIndex(nowMonth) + today.getDate() / 31 : barEnd;
    const width = pct(solidEnd) - left;
    const futureWidth = isFuture ? pct(realEnd) - pct(solidEnd) : 0;
    const when = s.expected ? `${fmt(s.start)} – ${fmt(s.end)} expected` : range(s.start, s.end);
    return `<li class="span span-${s.kind}${s.end ? '' : ' span-live'}" style="--i:${i}">
      <a href="${s.to}">
        <span class="span-label"><b>${esc(s.label)}</b> <span>${esc(s.detail)}</span></span>
        <span class="span-track" aria-hidden="true"><span class="span-bar" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>${futureWidth ? `<span class="span-future" style="left:${(left + width).toFixed(2)}%;width:${futureWidth.toFixed(2)}%"></span>` : ''}</span>
        <span class="span-time">${s.expected ? 'to ' + fmt(s.end) : s.end ? dur(s.start, s.end) : 'now'}</span>
        <span class="sr-only">${esc(when)}</span>
      </a>
    </li>`;
  }).join('\n');

  const ticks = years.map((y) => `<span style="left:${pct(toIndex(`${y}-01`)).toFixed(2)}%">${y}</span>`).join('');
  return `<figure class="trace" aria-labelledby="trace-title">
    <figcaption class="trace-head">
      <span id="trace-title" class="trace-title">Career trace, drawn to scale</span>
      <span class="legend"><i class="k-work"></i>Engineering <i class="k-teach"></i>Teaching <i class="k-study"></i>Study</span>
    </figcaption>
    <div class="trace-body" style="--now:${nowPct.toFixed(2)}%">
      <div class="trace-axis" aria-hidden="true"><div class="trace-ticks">${ticks}<span class="tick-now" style="left:${nowPct.toFixed(2)}%">today</span></div></div>
      <ol class="spans">
${rows}
      </ol>
    </div>
  </figure>`;
}

/* ---------- Batching diagram (fixed vs adaptive) ---------- */
const ARRIVALS = [3, 5.5, 8, 10.5, 13, 15.5, 18, 21.5, 34, 52, 57, 70, 72.5, 75, 77.5, 80, 82.5, 85, 96];
function fixedBatches() {
  const out = [];
  for (let t = 20; t <= 100; t += 20) {
    const items = ARRIVALS.filter((a) => a > t - 20 && a <= t);
    if (items.length) out.push({ items, settle: t });
  }
  return out;
}
function adaptiveBatches({ size = 5, maxWait = 16 } = {}) {
  const out = [];
  let cur = [];
  for (let k = 0; k < ARRIVALS.length; k++) {
    const a = ARRIVALS[k];
    if (cur.length && a - cur[0] > maxWait) { out.push({ items: cur, settle: cur[0] + maxWait }); cur = []; }
    cur.push(a);
    if (cur.length === size) { out.push({ items: cur, settle: a }); cur = []; }
  }
  if (cur.length) out.push({ items: cur, settle: cur[0] + maxWait });
  return out;
}
function batchRow(batches, y) {
  const X = (t) => 12 + (t / 100) * 876;
  return batches.map((b) => {
    const x1 = X(b.items[0]) - 7;
    const x2 = X(b.settle) + 5;
    const dots = b.items.map((a, i) => `<circle cx="${X(a).toFixed(1)}" cy="${y}" r="4" class="d-pay"/>`).join('');
    return `<rect x="${x1.toFixed(1)}" y="${y - 15}" width="${(x2 - x1).toFixed(1)}" height="30" rx="4" class="d-batch"/>${dots}<line x1="${X(b.settle).toFixed(1)}" x2="${X(b.settle).toFixed(1)}" y1="${y - 22}" y2="${y + 22}" class="d-settle"/>`;
  }).join('');
}
function batchDiagram() {
  const fixed = fixedBatches();
  const adaptive = adaptiveBatches();
  return `<figure class="diagram">
    <svg viewBox="0 0 900 214" role="img" aria-label="Two timelines of the same payment stream. Fixed batching closes a batch every interval whether or not payments are waiting. Adaptive batching closes sooner during bursts and waits during quiet periods.">
      <text x="12" y="20" class="d-label">Fixed: settle every interval</text>
      ${batchRow(fixed, 56)}
      <text x="12" y="118" class="d-label">Adaptive: settle on batch size or maximum wait</text>
      ${batchRow(adaptive, 154)}
      <line x1="12" x2="888" y1="200" y2="200" class="d-axis"/>
      <text x="888" y="212" text-anchor="end" class="d-label d-small">time</text>
    </svg>
    <figcaption><span class="d-key"><i class="k-pay"></i>payment <i class="k-settle"></i>settlement</span> ${esc(c.research.diagramCaption)}</figcaption>
  </figure>`;
}

/* ---------- Sections ---------- */
function hero() {
  const p = c.person;
  return `<section class="hero wrap" id="top">
  <p class="hero-meta"><span class="live-dot" aria-hidden="true"></span>${esc(p.role)} at ${esc(p.employer)} <span class="sep" aria-hidden="true">/</span> ${esc(p.location)}</p>
  <h1 class="hero-name">${esc(p.name)}</h1>
  <div class="hero-grid">
    <p class="hero-tag">${esc(p.tagline)}</p>
    <div class="hero-side">
      <p class="hero-sum">${esc(p.summary)}</p>
      <div class="hero-actions">
        <a class="btn btn-solid" href="#contact">Get in touch</a>
        <a class="btn" href="${p.resume}">Download résumé</a>
        ${ext(p.github, `${svgIcon('github')}<span class="sr-only">GitHub</span>`, 'btn btn-icon')}
        ${ext(p.linkedin, `${svgIcon('linkedin')}<span class="sr-only">LinkedIn</span>`, 'btn btn-icon')}
      </div>
    </div>
  </div>
  ${traceView()}
</section>`;
}

const sectionHead = (label, title, intro) => `<header class="sec-head">
  <p class="sec-label">${esc(label)}</p>
  <h2>${title}</h2>
  ${intro ? `<p class="sec-intro">${esc(intro)}</p>` : ''}
</header>`;

function aboutSection() {
  return `<section class="sec wrap" id="about">
  <div class="split">
    <header class="sec-head"><p class="sec-label">About</p><h2>From coursework to production to enterprise systems.</h2></header>
    <div class="prose reveal">${c.about.paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  </div>
  <ol class="path reveal">
    ${c.about.path.map((s) => `<li><span class="path-when">${esc(s.when)}</span><b>${esc(s.stage)}</b><span class="path-note">${esc(s.note)}</span></li>`).join('')}
  </ol>
</section>`;
}

function experienceSection() {
  const company = (e) => `<article class="job reveal" id="exp-${e.id}">
    <header class="job-head">
      <h3>${esc(e.company)}</h3>
      <p>${esc(e.location)}</p>
    </header>
    <div class="job-body${e.roles.length > 1 ? ' job-ladder' : ''}">
      ${e.roles.map((r) => `<div class="role">
        <div class="role-head">
          <h4>${esc(r.title)}</h4>
          <p class="mono">${range(r.start, r.end)} <span class="sep" aria-hidden="true">/</span> ${esc(r.arrangement)}</p>
        </div>
        <ul>${r.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>`).join('')}
      ${e.note ? `<p class="job-note">${esc(e.note)}</p>` : ''}
      <p class="chips">${e.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</p>
      ${e.decision ? `<p class="decision">${esc(e.decision)}</p>` : ''}
    </div>
  </article>`;
  return `<section class="sec sec-tint" id="experience"><div class="wrap">
  ${sectionHead('Experience', 'Production work since 2024.')}
  ${c.experience.map(company).join('\n')}
</div></section>`;
}

function projectSection() {
  const feat = (p) => `<article class="proj${p.size === 'wide' ? ' proj-wide' : ''} reveal">
    <a class="proj-shot" href="${esc(p.link.href)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">
      <img src="${p.image.src}" alt="" width="${p.image.w}" height="${p.image.h}" loading="lazy" decoding="async">
    </a>
    <div class="proj-text">
      <p class="sec-label">${esc(p.kicker)}</p>
      <h3>${esc(p.name)}</h3>
      <p class="proj-lead">${esc(p.lead)}</p>
      <dl class="facts">
        <div><dt>Problem</dt><dd>${esc(p.problem)}</dd></div>
        <div><dt>Solution</dt><dd>${esc(p.solution)}</dd></div>
        <div><dt>My part</dt><dd>${esc(p.contribution)}</dd></div>
      </dl>
      <p class="chips">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</p>
      <p class="proj-foot"><span class="mono status">${esc(p.status)}</span> ${ext(p.link.href, `${esc(p.link.label)} <span aria-hidden="true">↗</span>`, 'link')}</p>
    </div>
  </article>`;
  const [wide, ...rest] = c.featuredProjects;
  return `<section class="sec wrap" id="work">
  ${sectionHead('Selected work', 'Systems that real businesses run on.')}
  ${feat(wide)}
  <div class="proj-pair">${rest.map(feat).join('')}</div>
  <div class="more reveal">
    <h3 class="sec-label">Also built</h3>
    <ul class="more-list">
      ${c.otherProjects.map((p) => `<li>
        <b>${esc(p.name)}</b>
        <span class="more-what">${esc(p.what)}</span>
        <span class="mono more-stack">${esc(p.stack)}</span>
        <span class="more-link">${p.href ? ext(p.href, `${esc(p.linkLabel)} <span aria-hidden="true">↗</span>`, 'link') : ''}</span>
      </li>`).join('')}
    </ul>
  </div>
</section>`;
}

function caseSection() {
  const fields = [['problem', 'Problem'], ['constraints', 'Constraints'], ['approach', 'Approach'], ['tradeoffs', 'Trade-offs'], ['outcome', 'Outcome']];
  return `<section class="sec sec-tint" id="cases"><div class="wrap">
  ${sectionHead('Case studies', 'How the work actually went.', c.caseStudiesNote)}
  ${c.caseStudies.map((k) => `<article class="case reveal">
    <header><h3>${esc(k.title)}</h3><p class="mono">${esc(k.context)}</p></header>
    <ol class="case-steps">
      ${fields.filter(([f]) => k[f]).map(([f, l]) => `<li><span class="mono step">${l}</span><p>${esc(k[f])}</p></li>`).join('')}
    </ol>
  </article>`).join('')}
</div></section>`;
}

function researchSection() {
  const r = c.research;
  return `<section class="sec wrap" id="research">
  <div class="split">
    <header class="sec-head"><p class="sec-label">Research</p><h2>${esc(r.title)}</h2><p class="pill mono"><span class="live-dot" aria-hidden="true"></span>${esc(r.status)}</p></header>
    <div class="prose reveal"><p class="proj-lead">${esc(r.lead)}</p><p>${esc(r.summary)}</p>
    <p><a class="link" href="work/${r.slug}.html">Read the project overview <span aria-hidden="true">→</span></a></p></div>
  </div>
  <div class="reveal">${batchDiagram()}</div>
</section>`;
}

function stackSection() {
  return `<section class="sec sec-tint" id="stack"><div class="wrap">
  ${sectionHead('Stack', 'What I have used, and where.')}
  <p class="stack-key"><span><i class="m-prod"></i>Used in professional work</span> <span><i class="m-other"></i>Projects, coursework or working knowledge</span></p>
  <div class="stack-rows">
    ${c.skills.map((s) => `<div class="stack-row reveal">
      <h3>${esc(s.group)}</h3>
      <ul class="tags">
        ${s.prod.map((t) => `<li class="t-prod">${esc(t)}</li>`).join('')}
        ${s.other.map((t) => `<li class="t-other">${esc(t)}</li>`).join('')}
      </ul>
    </div>`).join('')}
  </div>
</div></section>`;
}

function recordSection() {
  return `<section class="sec wrap" id="record">
  ${sectionHead('Record', 'Education, teaching and recognition.')}
  <div class="record-grid">
    <div class="reveal">
      <h3 class="sec-label">Education</h3>
      ${c.education.map((e) => `<div class="edu"><h4>${esc(e.school)}</h4><p>${esc(e.degree)}</p><p class="mono">${esc(e.when)} <span class="sep" aria-hidden="true">/</span> ${esc(e.place)}</p><p class="edu-detail">${esc(e.detail)}</p></div>`).join('')}
    </div>
    <div class="reveal">
      <h3 class="sec-label">Recognition</h3>
      <ul class="ledger">${c.recognition.map((a) => `<li><span>${esc(a.title)}<small>${esc(a.org)}</small></span><span class="mono">${esc(a.when)}</span></li>`).join('')}</ul>
    </div>
  </div>
  <div class="record-block reveal" id="teaching">
    <div class="split split-tight">
      <div><h3 class="sec-label">Teaching and mentorship</h3><p class="pull">${esc(c.teaching.intro)}</p></div>
      <ul class="ledger">${c.teaching.roles.map((t) => `<li><span>${esc(t.title)}<small>${esc(t.org)}. ${esc(t.text)}</small></span><span class="mono">${esc(t.when)}</span></li>`).join('')}</ul>
    </div>
  </div>
  <div class="record-block reveal">
    <div class="split split-tight">
      <div><h3 class="sec-label">Leadership and community</h3></div>
      <ul class="ledger">${c.community.map((t) => `<li><span>${esc(t.title)}<small>${esc(t.text)}</small></span><span class="mono">${esc(t.when)}</span></li>`).join('')}</ul>
    </div>
  </div>
  <div class="record-block reveal">
    <div class="split split-tight">
      <div><h3 class="sec-label">Beyond engineering</h3></div>
      <div class="beyond">${c.beyond.map((b) => `<div><h4>${esc(b.title)}</h4><p>${esc(b.text)}</p></div>`).join('')}</div>
    </div>
  </div>
</section>`;
}

function contactSection() {
  const p = c.person;
  return `<section class="contact" id="contact"><div class="wrap">
  <p class="sec-label">Contact</p>
  <h2>${esc(c.contact.heading)}</h2>
  <p class="contact-body">${esc(c.contact.body)}</p>
  <a class="contact-mail" href="mailto:${p.email}">${p.email}</a>
  <p class="contact-links">${ext(p.linkedin, `${svgIcon('linkedin')} LinkedIn`)} ${ext(p.github, `${svgIcon('github')} GitHub`)} <a href="${p.resume}">Résumé (PDF)</a></p>
</div></section>`;
}

/* ---------- Pages ---------- */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: c.person.name,
  url: c.site.url,
  jobTitle: c.person.role,
  worksFor: { '@type': 'Organization', name: c.person.employer },
  alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'ADA University' }, { '@type': 'CollegeOrUniversity', name: 'University of Latvia' }],
  address: { '@type': 'PostalAddress', addressLocality: 'Baku', addressCountry: 'AZ' },
  knowsAbout: ['C#', '.NET', 'ASP.NET Core', 'REST APIs', 'SQL Server', 'Backend engineering', 'Distributed systems'],
  sameAs: [c.person.github, c.person.linkedin],
};

const home = page({
  base: '',
  title: c.site.title,
  description: c.site.description,
  canonical: c.site.url,
  jsonLd,
  body: [hero(), aboutSection(), experienceSection(), projectSection(), caseSection(), researchSection(), stackSection(), recordSection(), contactSection()].join('\n'),
});

const r = c.research;
const researchPage = page({
  base: '../',
  title: `${r.title} | ${c.person.name}`,
  description: `${c.person.name}'s ongoing graduation project on fixed and adaptive batching for AZN micropayment settlement.`,
  canonical: `${c.site.url}work/${r.slug}.html`,
  jsonLd: { '@context': 'https://schema.org', '@type': 'CreativeWork', name: r.title, author: { '@type': 'Person', name: c.person.name }, creativeWorkStatus: 'In progress' },
  body: `<article class="wrap article">
  <p><a class="link" href="../index.html#research"><span aria-hidden="true">←</span> Back to portfolio</a></p>
  <p class="pill mono"><span class="live-dot" aria-hidden="true"></span>${esc(r.status)}</p>
  <h1 class="article-title">${esc(r.title)}</h1>
  <p class="proj-lead article-lead">${esc(r.lead)}</p>
  <p class="article-text">${esc(r.summary)}</p>
  ${batchDiagram()}
  <section aria-labelledby="concepts"><h2 id="concepts" class="sec-label">Concepts the project works with</h2>
    <dl class="concepts">${r.concepts.map((k) => `<div><dt>${esc(k.term)}</dt><dd>${esc(k.text)}</dd></div>`).join('')}</dl>
  </section>
  <section aria-labelledby="status" class="article-status"><h2 id="status" class="sec-label">Status</h2><p class="pull">${esc(r.statusNote)}</p></section>
</article>`,
});

const notFound = page({
  base: '/portfolio-website/',
  title: `Page not found | ${c.person.name}`,
  description: 'This page does not exist.',
  canonical: c.site.url,
  body: `<section class="wrap article nf"><p class="mono">404</p><h1 class="article-title">This page does not exist.</h1><p><a class="btn btn-solid" href="/portfolio-website/index.html">Back to the portfolio</a></p></section>`,
});

mkdirSync('work', { recursive: true });
writeFileSync('index.html', home);
writeFileSync(`work/${r.slug}.html`, researchPage);
writeFileSync('404.html', notFound);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${c.site.url}sitemap.xml\n`);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${c.site.url}</loc><lastmod>${isoToday}</lastmod></url>
  <url><loc>${c.site.url}work/${r.slug}.html</loc><lastmod>${isoToday}</lastmod></url>
</urlset>
`);
console.log('Built index.html, work/, 404.html, robots.txt, sitemap.xml');
