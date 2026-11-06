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
const pad = (n) => String(n).padStart(2, '0');
const ext = (href, label, cls = '') => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${cls ? ` class="${cls}"` : ''}>${label}<span class="sr-only"> (opens in a new tab)</span></a>`;
const arrow = '<span aria-hidden="true">↗</span>';

/* ---------- Page shell ---------- */
function page({ base, title, description, canonical, body, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(c.person.name)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#f2f0e9">
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
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400..700&display=swap">
<link rel="stylesheet" href="${base}assets/site.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
<script src="${base}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(base)}
<main id="main">
${body}
</main>
${footer(base)}
</body>
</html>
`;
}

const NAV = [['work', 'Work'], ['research', 'Research'], ['log', 'Log'], ['experience', 'Experience'], ['expertise', 'Expertise'], ['record', 'Record']];

function header(base) {
  const prefix = base ? `${base}index.html` : '';
  const links = NAV.map(([id, l]) => `<li><a href="${prefix}#${id}">${l}</a></li>`).join('');
  return `<header class="bar">
  <a class="brand" href="${base ? `${base}index.html` : '#top'}">Rashad Asadli</a>
  <nav id="nav" class="nav" aria-label="Primary"><ul>${links}<li><a href="${prefix}#contact">Contact</a></li></ul></nav>
  <button class="menu" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
</header>`;
}

function footer(base) {
  return `<footer class="foot"><div class="wrap foot-in">
  <p>© ${today.getFullYear()} ${esc(c.person.name)}</p>
  <p class="foot-links">${ext(c.person.github, 'GitHub')} ${ext(c.person.linkedin, 'LinkedIn')} <a href="${base}${c.person.resume}">Résumé</a></p>
</div></footer>`;
}

const secHead = (num, label, title, intro) => `<header class="sec-head">
  <p class="tag"><span class="tag-num">${pad(num)}</span> ${esc(label)}</p>
  <h2>${esc(title)}</h2>
  ${intro ? `<p class="sec-intro">${esc(intro)}</p>` : ''}
</header>`;

/* ---------- Architecture Explorer ---------- */
function explorer() {
  const { nodes, edges, initial, caption } = c.explorer;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const links = (id) => edges.filter((e) => e.a === id || e.b === id).map((e) => byId[e.a === id ? e.b : e.a].label);
  const paths = edges.map((e) => `<path pathLength="1" data-a="${e.a}" data-b="${e.b}" d="${e.d}"/>`).join('');
  const refs = ['A', 'B', 'C', 'D'].map((l, i) => `<text x="${[100, 265, 455, 630][i]}" y="18" text-anchor="middle">${l}</text>`).join('')
    + ['1', '2', '3'].map((l, i) => `<text x="10" y="${[94, 254, 414][i]}">${l}</text>`).join('');
  const buttons = nodes.map((n) => `<button type="button" class="node" data-node="${n.id}" aria-pressed="${n.id === initial}" style="left:${(n.x / 720 * 100).toFixed(2)}%;top:${(n.y / 520 * 100).toFixed(2)}%"><span class="node-ref">${n.ref}</span>${esc(n.label)}</button>`).join('');
  const items = nodes.map((n) => `<div class="ex-item" data-item="${n.id}">
      <h2>${esc(n.label)}</h2>
      <p class="ex-role">${esc(n.role)}</p>
      <p>${esc(n.concept)}</p>
      <dl class="ex-meta">
        <div><dt>In my work</dt><dd>${esc(n.work)}</dd></div>
        <div><dt>Connects to</dt><dd>${esc(links(n.id).join(', '))}</dd></div>
      </dl>
    </div>`).join('');
  return `<figure class="explorer" aria-labelledby="ex-cap">
    <div class="ex-plate">
      <svg class="ex-lines" viewBox="0 0 720 520" aria-hidden="true">
        <g class="ex-refs">${refs}</g>
        <g class="ex-marks"><path d="M28 28h14M28 28v14M692 28h-14M692 28v14M28 492h14M28 492v-14M692 492h-14M692 492v-14"/></g>
        <g class="ex-paths">${paths}</g>
      </svg>
      <div class="ex-nodes" role="group" aria-label="Components of the concept diagram. Select one to read about it.">${buttons}</div>
    </div>
    <div class="ex-panel" aria-live="polite">${items}</div>
    <figcaption id="ex-cap">${esc(caption)}</figcaption>
  </figure>`;
}

/* ---------- Career timeline, drawn to scale ---------- */
function timeline() {
  const start = toIndex('2022-09');
  const end = toIndex('2027-07');
  const pct = (i) => ((i - start) / (end - start)) * 100;
  const now = toIndex(nowMonth) + today.getDate() / 31;
  const nowPct = pct(now);
  const years = [2023, 2024, 2025, 2026, 2027].filter((y) => Math.abs(pct(toIndex(`${y}-01`)) - nowPct) > 6);
  const rows = c.trace.map((s) => {
    const left = pct(toIndex(s.start));
    const realEnd = s.end ? toIndex(s.end) + 1 : now;
    const solidEnd = s.expected ? now : realEnd;
    const width = pct(solidEnd) - left;
    const future = s.expected ? pct(realEnd) - pct(solidEnd) : 0;
    const when = s.expected ? `${fmt(s.start)} – ${fmt(s.end)} expected` : range(s.start, s.end);
    return `<li class="tl-row tl-${s.kind}"><a href="${s.to}">
      <span class="tl-label"><b>${esc(s.label)}</b> ${esc(s.detail)}</span>
      <span class="tl-track" aria-hidden="true"><span class="tl-bar" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"></span>${future ? `<span class="tl-future" style="left:${(left + width).toFixed(2)}%;width:${future.toFixed(2)}%"></span>` : ''}</span>
      <span class="sr-only">${esc(when)}</span>
    </a></li>`;
  }).join('\n');
  const ticks = years.map((y) => `<span style="left:${pct(toIndex(`${y}-01`)).toFixed(2)}%">${y}</span>`).join('');
  return `<figure class="tl" style="--now:${nowPct.toFixed(2)}%">
    <figcaption class="tl-cap"><span>Fig. 3. Career, drawn to scale</span><span class="tl-key"><i class="k-work"></i>Engineering <i class="k-teach"></i>Teaching <i class="k-study"></i>Study</span></figcaption>
    <div class="tl-axis" aria-hidden="true"><div>${ticks}<span class="tl-now" style="left:${nowPct.toFixed(2)}%">today</span></div></div>
    <ol class="tl-rows">${rows}</ol>
  </figure>`;
}

/* ---------- Research drawings ---------- */
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
  for (const a of ARRIVALS) {
    if (cur.length && a - cur[0] > maxWait) { out.push({ items: cur, settle: cur[0] + maxWait }); cur = []; }
    cur.push(a);
    if (cur.length === size) { out.push({ items: cur, settle: a }); cur = []; }
  }
  if (cur.length) out.push({ items: cur, settle: cur[0] + maxWait });
  return out;
}
function batchSvg(batches, W, cls) {
  const X = (t) => 8 + (t / 100) * (W - 16);
  const r = W > 500 ? 4 : 2.6;
  const gapL = W > 500 ? 7 : 4;
  const gapR = W > 500 ? 5 : 3;
  const body = batches.map((b) => {
    const x1 = X(b.items[0]) - gapL;
    const x2 = X(b.settle) + gapR;
    const dots = b.items.map((a) => `<circle cx="${X(a).toFixed(1)}" cy="22" r="${r}" class="d-pay"/>`).join('');
    return `<rect x="${x1.toFixed(1)}" y="9" width="${(x2 - x1).toFixed(1)}" height="26" class="d-batch"/>${dots}<line x1="${X(b.settle).toFixed(1)}" x2="${X(b.settle).toFixed(1)}" y1="2" y2="42" class="d-settle"/>`;
  }).join('');
  return `<svg class="${cls}" viewBox="0 0 ${W} 44" aria-hidden="true">${body}</svg>`;
}
function batchDiagram() {
  const row = (label, b) => `<div class="batch-row"><p class="batch-label">${esc(label)}</p>${batchSvg(b, 900, 'd-wide')}${batchSvg(b, 340, 'd-narrow')}</div>`;
  return `<figure class="batch">
    <div role="img" aria-label="Two timelines of the same payment stream. Fixed batching closes a batch every interval, whether or not payments are waiting. Adaptive batching closes sooner during bursts and waits during quiet periods.">
      ${row('Fixed: settle every interval', fixedBatches())}
      ${row('Adaptive: settle on batch size or maximum wait', adaptiveBatches())}
    </div>
    <figcaption><span class="d-key"><i class="k-pay"></i>payment <i class="k-settle"></i>settlement</span> Fig. 4. ${esc(c.research.diagramCaption)}</figcaption>
  </figure>`;
}
const flow = () => `<figure class="flow-fig">
  <ol class="flow">${c.research.flow.map((s) => `<li${s.key ? ' class="flow-key"' : ''}><b>${esc(s.t)}</b><span>${esc(s.d)}</span></li>`).join('')}</ol>
  <figcaption>${esc(c.research.flowCaption)}</figcaption>
</figure>`;

/* ---------- Home sections ---------- */
function hero() {
  const p = c.person;
  return `<section class="hero" id="top"><div class="wrap hero-grid">
  <div class="hero-id">
    <p class="tag">${esc(p.location)}</p>
    <h1>Rashad<br>Asadli.</h1>
    <p class="hero-role">${esc(p.role)} <span>at ${esc(p.employer)}</span></p>
    <p class="hero-sum">${esc(p.statement)}</p>
    <div class="hero-actions">
      <a class="btn btn-solid" href="#work">See the work</a>
      <a class="btn" href="#contact">Contact</a>
    </div>
    <p class="hero-links">${ext(p.github, `GitHub ${arrow}`)} ${ext(p.linkedin, `LinkedIn ${arrow}`)} <a href="${p.resume}">Résumé (PDF)</a></p>
  </div>
  ${explorer()}
</div></section>`;
}

function profileSection() {
  return `<section class="sec wrap" id="profile">
  <div class="split">
    <header class="sec-head"><p class="tag"><span class="tag-num">01</span> Profile</p><h2>From coursework to production to enterprise systems.</h2></header>
    <div class="prose reveal">${c.about.paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  </div>
  <ol class="path reveal">
    ${c.about.path.map((s) => `<li><span class="mono">${esc(s.when)}</span><b>${esc(s.stage)}</b><span class="path-note">${esc(s.note)}</span></li>`).join('')}
  </ol>
</section>`;
}

function workSection() {
  const spread = (p, i) => `<article class="spread spread-${i + 1} reveal">
    <header class="spread-head">
      <p class="tag"><span class="tag-num">P-${pad(i + 1)}</span> ${esc(p.kicker)}</p>
      <h3><a href="work/${p.slug}.html">${esc(p.name)}</a></h3>
      <p class="spread-lead">${esc(p.lead)}</p>
    </header>
    <a class="spread-shot" href="work/${p.slug}.html" tabindex="-1" aria-hidden="true"><img src="${p.image.src}" alt="" width="${p.image.w}" height="${p.image.h}" loading="lazy" decoding="async"></a>
    <div class="spread-body">
      <p>${esc(p.solution)}</p>
      <dl class="meta">
        <div><dt>My role</dt><dd>${esc(p.contribution)}</dd></div>
        <div><dt>Stack</dt><dd>${esc(p.stack.join(', '))}</dd></div>
        <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
      </dl>
      <p class="spread-links"><a class="link" href="work/${p.slug}.html">Read the case study<span class="sr-only">: ${esc(p.name)}</span> <span aria-hidden="true">→</span></a> ${ext(p.link.href, `${esc(p.link.label)} ${arrow}`, 'link link-quiet')}</p>
    </div>
  </article>`;
  return `<section class="sec wrap" id="work">
  ${secHead(2, 'Selected work', 'Systems that real businesses run on.')}
  ${c.featuredProjects.map(spread).join('')}
  <div class="more reveal">
    <h3 class="tag">Also built</h3>
    <ul class="more-list">
      ${c.otherProjects.map((p) => `<li>
        <b>${esc(p.name)}</b>
        <span class="more-what">${esc(p.what)}</span>
        <span class="mono">${esc(p.stack)}</span>
        <span class="more-link">${p.href ? ext(p.href, `${esc(p.linkLabel)} ${arrow}<span class="sr-only">: ${esc(p.name)}</span>`, 'link') : ''}</span>
      </li>`).join('')}
    </ul>
  </div>
</section>`;
}

function researchSection() {
  const r = c.research;
  return `<section class="sec sec-dark" id="research"><div class="wrap">
  <div class="split">
    <header class="sec-head"><p class="tag"><span class="tag-num">03</span> Research</p><h2>${esc(r.title)}</h2><p class="status-line">${esc(r.status)}</p></header>
    <div class="prose reveal"><p class="lede">${esc(r.lead)}</p><p>${esc(r.summary)}</p>
    <p><a class="link" href="work/${r.slug}.html">Read the project overview <span aria-hidden="true">→</span></a></p></div>
  </div>
  <div class="reveal">${flow()}${batchDiagram()}</div>
</div></section>`;
}

function logSection() {
  const fields = [['problem', 'Question'], ['constraints', 'Constraint'], ['approach', 'Approach'], ['tradeoffs', 'Trade-off'], ['outcome', 'Evidence']];
  return `<section class="sec wrap" id="log">
  ${secHead(4, 'Engineering log', 'How the work actually went.', c.caseStudiesNote)}
  ${c.caseStudies.map((k, i) => `<article class="entry reveal">
    <header><p class="mono entry-num">Entry ${pad(i + 1)}</p><h3>${esc(k.title)}</h3><p class="mono">${esc(k.context)}</p></header>
    <dl class="entry-steps">
      ${fields.filter(([f]) => k[f]).map(([f, l]) => `<div><dt>${l}</dt><dd>${esc(k[f])}</dd></div>`).join('')}
    </dl>
  </article>`).join('')}
</section>`;
}

function experienceSection() {
  const job = (e, i) => `<details class="job reveal" id="exp-${e.id}"${i < 2 ? ' open' : ''}>
    <summary>
      <span class="job-co">${esc(e.company)}</span>
      <span class="job-sum">${esc(e.roles[0].title)}</span>
      <span class="mono">${e.roles.length > 1 ? range(e.roles[e.roles.length - 1].start, e.roles[0].end) : range(e.roles[0].start, e.roles[0].end)}</span>
    </summary>
    <div class="job-body${e.roles.length > 1 ? ' job-ladder' : ''}">
      ${e.note ? `<p class="job-note">${esc(e.note)}</p>` : ''}
      ${e.roles.map((r) => `<div class="role">
        <h3>${esc(r.title)}</h3>
        <p class="mono">${range(r.start, r.end)} / ${esc(r.arrangement)}${e.roles.length > 1 ? '' : ` / ${esc(e.location)}`}</p>
        <ul>${r.points.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>`).join('')}
      <p class="mono job-stack">${esc(e.stack.join(' / '))}</p>
      ${e.decision ? `<p class="decision">${esc(e.decision)}</p>` : ''}
    </div>
  </details>`;
  return `<section class="sec sec-paper" id="experience"><div class="wrap">
  ${secHead(5, 'Experience', 'Production work since 2024.')}
  <div class="reveal">${timeline()}</div>
  <div class="jobs">${c.experience.map(job).join('')}</div>
</div></section>`;
}

function expertiseSection() {
  return `<section class="sec wrap" id="expertise">
  ${secHead(6, 'Expertise', 'What I have used, and where.')}
  <div class="skills">
    <div class="skills-head mono" aria-hidden="true"><span>Area</span><span>In professional work</span><span>Projects, study or working knowledge</span></div>
    ${c.skills.map((s) => `<div class="skill-row reveal">
      <h3>${esc(s.group)}</h3>
      <div><p class="mono skill-sub">In professional work</p><p>${s.prod.map(esc).join(', ')}</p></div>
      <div class="skill-other"><p class="mono skill-sub">Projects, study or working knowledge</p><p>${s.other.map(esc).join(', ')}</p></div>
    </div>`).join('')}
  </div>
</section>`;
}

function recordSection() {
  const ledger = (rows) => `<ul class="ledger">${rows.map((r) => `<li><span>${esc(r.title)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${r.when ? `<span class="mono">${esc(r.when)}</span>` : ''}</li>`).join('')}</ul>`;
  return `<section class="sec sec-paper" id="record"><div class="wrap">
  ${secHead(7, 'Record', 'Education, teaching and recognition.')}
  <div class="record-grid">
    <div class="reveal">
      <h3 class="tag">Education</h3>
      ${c.education.map((e) => `<div class="edu"><h4>${esc(e.school)}</h4><p>${esc(e.degree)}</p><p class="mono">${esc(e.when)} / ${esc(e.place)}</p><p class="edu-detail">${esc(e.detail)}</p></div>`).join('')}
    </div>
    <div class="reveal">
      <h3 class="tag">Recognition</h3>
      ${ledger(c.recognition.map((a) => ({ title: a.title, sub: a.org, when: a.when })))}
    </div>
  </div>
  <div class="record-block split-tight reveal" id="teaching">
    <div><h3 class="tag">Teaching and mentorship</h3><p class="pull">${esc(c.teaching.intro)}</p></div>
    ${ledger(c.teaching.roles.map((t) => ({ title: t.title, sub: `${t.org}. ${t.text}`, when: t.when })))}
  </div>
  <div class="record-block split-tight reveal">
    <h3 class="tag">Leadership and community</h3>
    ${ledger(c.community.map((t) => ({ title: t.title, sub: t.text, when: t.when })))}
  </div>
  <div class="record-block split-tight reveal">
    <h3 class="tag">Beyond engineering</h3>
    <div class="beyond">${c.beyond.map((b) => `<div><h4>${esc(b.title)}</h4><p>${esc(b.text)}</p></div>`).join('')}</div>
  </div>
</div></section>`;
}

function contactSection() {
  const p = c.person;
  return `<section class="contact sec-dark" id="contact"><div class="wrap">
  <p class="tag"><span class="tag-num">08</span> Contact</p>
  <h2>${esc(c.contact.heading)}</h2>
  <p class="contact-body">${esc(c.contact.body)}</p>
  <a class="contact-mail" href="mailto:${p.email}">${p.email}</a>
  <p class="contact-links">${ext(p.linkedin, `LinkedIn ${arrow}`)} ${ext(p.github, `GitHub ${arrow}`)} <a href="${p.resume}">Résumé (PDF)</a></p>
</div></section>`;
}

/* ---------- Case-study pages ---------- */
function studySections(list) {
  const shown = list.filter(([, html]) => html);
  return shown.map(([title, html], i) => `<section class="st-sec">
    <h2 class="tag"><span class="tag-num">${pad(i + 1)}</span> ${esc(title)}</h2>
    <div class="st-body">${html}</div>
  </section>`).join('');
}
const contextList = (rows) => (rows?.length ? `<dl class="meta meta-lg">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '');
const plates = (s) => (s.plates ? `<figure><div class="plates">${s.plates.map((p) => `<div><b>${esc(p.t)}</b><span>${esc(p.d)}</span></div>`).join('')}</div><figcaption class="st-cap">${esc(s.platesCaption)}</figcaption></figure>` : '');

function studyPage(p) {
  const s = c.studies[p.slug];
  const others = c.featuredProjects.filter((x) => x.slug !== p.slug);
  const body = `<article class="study">
  <header class="st-head"><div class="wrap">
    <p><a class="link" href="../index.html#work"><span aria-hidden="true">←</span> Back to portfolio</a></p>
    <p class="tag">${esc(p.kicker)}</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.lead)}</p>
    <p class="st-links">${ext(p.link.href, `${esc(p.link.label)} ${arrow}`, 'link')}</p>
  </div></header>
  <div class="wrap"><figure class="st-shot"><img src="../${p.image.src}" alt="${esc(p.image.alt)}" width="${p.image.w}" height="${p.image.h}"></figure>
  ${studySections([
    ['Project thesis', `<p class="lede">${esc(s.thesis)}</p>`],
    ['Engineering context', contextList(s.context)],
    [s.platesTitle || 'Scope map', plates(s)],
    ['Design decisions', s.decisions ? `<p>${esc(s.decisions)}</p>` : ''],
    ['Evidence', s.evidence ? `<p>${esc(s.evidence)}</p>` : ''],
    ['Reflection', s.reflection ? `<p>${esc(s.reflection)}</p>` : ''],
  ])}
  <nav class="st-next" aria-label="Other case studies">${others.map((x) => `<a href="${x.slug}.html"><span class="mono">Next study</span>${esc(x.name)}</a>`).join('')}</nav>
  </div>
</article>`;
  return page({
    base: '../',
    title: `${p.name} | ${c.person.name}`,
    description: `${p.lead} A case study of ${c.person.name}'s work on ${p.name}.`,
    canonical: `${c.site.url}work/${p.slug}.html`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, author: { '@type': 'Person', name: c.person.name } },
    body,
  });
}

function researchPage() {
  const r = c.research;
  const results = r.results?.length ? `<table class="results"><thead><tr><th scope="col">Measure</th><th scope="col">Fixed</th><th scope="col">Adaptive</th><th scope="col">Note</th></tr></thead><tbody>${r.results.map((x) => `<tr><th scope="row">${esc(x.measure)}</th><td>${esc(x.fixed)}</td><td>${esc(x.adaptive)}</td><td>${esc(x.note ?? '')}</td></tr>`).join('')}</tbody></table>` : '';
  const body = `<article class="study">
  <header class="st-head st-head-dark sec-dark"><div class="wrap">
    <p><a class="link" href="../index.html#research"><span aria-hidden="true">←</span> Back to portfolio</a></p>
    <p class="status-line">${esc(r.status)}</p>
    <h1>${esc(r.title)}</h1>
    <p class="lede">${esc(r.lead)}</p>
  </div></header>
  <div class="wrap">
  ${studySections([
    ['Project thesis', `<p class="lede">${esc(r.summary)}</p>`],
    ['Engineering context', contextList(r.context)],
    ['Architecture study', `${flow()}${batchDiagram()}`],
    ['Design decisions', `<p class="lede">${esc(r.decision.question)}</p><div class="plates plates-2">${r.decision.options.map((o) => `<div><b>${esc(o.t)}</b><span>${esc(o.d)}</span></div>`).join('')}</div>`],
    ['Concepts', `<dl class="concepts">${r.concepts.map((k) => `<div><dt>${esc(k.term)}</dt><dd>${esc(k.text)}</dd></div>`).join('')}</dl>`],
    ['Evidence', `${results}<p class="pull">${esc(r.statusNote)}</p>`],
  ])}
  </div>
</article>`;
  return page({
    base: '../',
    title: `${r.title} | ${c.person.name}`,
    description: `${c.person.name}'s ongoing graduation project comparing fixed and adaptive batching for micropayment settlement.`,
    canonical: `${c.site.url}work/${r.slug}.html`,
    jsonLd: { '@context': 'https://schema.org', '@type': 'CreativeWork', name: r.title, author: { '@type': 'Person', name: c.person.name }, creativeWorkStatus: 'In progress' },
    body,
  });
}

/* ---------- Output ---------- */
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

mkdirSync('work', { recursive: true });
writeFileSync('index.html', page({
  base: '',
  title: c.site.title,
  description: c.site.description,
  canonical: c.site.url,
  jsonLd,
  body: [hero(), profileSection(), workSection(), researchSection(), logSection(), experienceSection(), expertiseSection(), recordSection(), contactSection()].join('\n'),
}));
for (const p of c.featuredProjects) writeFileSync(`work/${p.slug}.html`, studyPage(p));
writeFileSync(`work/${c.research.slug}.html`, researchPage());
writeFileSync('404.html', page({
  base: '/portfolio-website/',
  title: `Page not found | ${c.person.name}`,
  description: 'This page does not exist.',
  canonical: c.site.url,
  body: `<section class="wrap nf"><p class="tag">404</p><h1>This page does not exist.</h1><p><a class="btn btn-solid" href="/portfolio-website/index.html">Back to the portfolio</a></p></section>`,
}));
const urls = ['', ...c.featuredProjects.map((p) => `work/${p.slug}.html`), `work/${c.research.slug}.html`];
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${c.site.url}sitemap.xml\n`);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${c.site.url}${u}</loc><lastmod>${isoToday}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`Built index.html, ${urls.length - 1} work pages, 404.html, robots.txt, sitemap.xml`);
