// Leonida Platinum — offline GTA 6 trophy tracker.
// Loads data/trophies.json (a file inside this app, nothing from the network), keeps
// earned ticks + the spoiler setting in localStorage, and renders four views:
// checklist, platinum roadmap, missable warnings, and sources. Deep links:
// ?view=checklist|roadmap|missable|about, ?view=guide&id=<n>, ?spoiler=on,
// ?earned=2,3,5 — the ?earned list is demo state kept in memory only (it is not
// written to localStorage until the reader ticks a box themselves).
const EARNED_KEY = 'leonida-platinum-earned-v1';
const SPOILER_KEY = 'leonida-platinum-spoiler-v1';
const STAGES = [
  { n: 1, title: 'Stage 1 — Story chapters', note: 'Chapters 1–4 plus the final mission. Play the story straight through; these pop as the chapters end.' },
  { n: 2, title: 'Stage 2 — Story missions & stranger strands', note: 'Named story missions and the side strands for Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 stranger strands across Leonida.' },
  { n: 3, title: 'Stage 3 — Activities & skills', note: 'Stunts, races, drone races, fishing, arcade, shooting range, partner wanted levels and Combat Focus — sample everything early so nothing is left for the end.' },
  { n: 4, title: 'Stage 4 — Collectibles, exploration & hidden moments', note: 'Meditation spots (do them as you find them — one is missable), cards, WAiNK It, vehicles, exploring Leonida and the hidden one-off moments.' },
  { n: 5, title: 'Stage 5 — Robberies & money', note: 'Jewelry store, bank vaults, armored truck, gang operations, laundering Marked Bills, spending and garages. Robberies open up in Chapters 3 and 4.' },
  { n: 6, title: 'Stage 6 — Grind, 100% & the platinum', note: '50 challenges, then 100% completion (A Long Road, gold), then the platinum pops on its own.' },
];
const KIND_LABELS = {
  story: 'Story', side: 'Side strand', activity: 'Activity', collectible: 'Collectible',
  robbery: 'Robbery', money: 'Money', grind: 'Grind', misc: 'Hidden moment', platinum: 'Platinum',
};

const params = new URLSearchParams(location.search);
const demoEarned = params.get('earned');
const demoIds = demoEarned ? demoEarned.split(',').map((s) => Number(s.trim())).filter(Number.isFinite) : [];

let trophies = [];
let earned = new Set();
let demoMode = false;
try {
  earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
} catch { earned = new Set(); }
if (demoIds.length) {
  // Demo pre-checks for screenshots / shared links: in-memory only, never persisted.
  earned = new Set(demoIds);
  demoMode = true;
}
let spoilerOn = localStorage.getItem(SPOILER_KEY) === 'on' || params.get('spoiler') === 'on';
let currentView = 'checklist';
let selectedId = null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPane');

function saveEarned() {
  if (demoMode) demoMode = false; // the reader's own tick replaces demo state
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}
function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? 'on' : 'off');
}
function byId(id) { return trophies.find((t) => t.id === id); }
function isEarned(t) { return earned.has(t.id); }
function isMasked(t) {
  return spoilerOn && t.hidden && !isEarned(t);
}
function gradeCounts() {
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  return grades.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(t)).length;
    return `${g[0].toUpperCase() + g.slice(1)} ${got}/${total}`;
  }).join(' · ');
}

function renderProgress() {
  const total = trophies.length;
  const got = trophies.filter(isEarned).length;
  $('earnedCount').textContent = String(got);
  $('barFill').style.width = total ? `${Math.round((got / total) * 100)}%` : '0%';
  $('gradeCounts').textContent = gradeCounts();
  $('progressNote').textContent = got === 0
    ? 'Start with Stage 1 — and meditate at every spot you find.'
    : got === total
      ? 'Platinum earned — Vice Got a Price! Congratulations, Leonida Legend.'
      : `${total - got} to go. Next up: ${nextUp()}`;
}
function nextUp() {
  const rest = trophies.filter((x) => !isEarned(x) && x.id !== 1).sort((a, b) => a.stage - b.stage || a.id - b.id);
  if (rest.length) return `${rest[0].name} (#${rest[0].id})`;
  const t = trophies.find((x) => !isEarned(x));
  return t ? `${t.name} (#${t.id})` : 'the platinum';
}

function trophyMatches(t) {
  const q = $('search').value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  if ($('gradeFilter').value !== 'all' && t.grade !== $('gradeFilter').value) return false;
  if ($('kindFilter').value !== 'all' && t.kind !== $('kindFilter').value) return false;
  if ($('statusFilter').value === 'earned' && !isEarned(t)) return false;
  if ($('statusFilter').value === 'remaining' && isEarned(t)) return false;
  if ($('hiddenFilter').value === 'hidden' && !t.hidden) return false;
  if ($('hiddenFilter').value === 'visible' && t.hidden) return false;
  if ($('missableOnly').checked && !t.missable) return false;
  return true;
}

function renderList() {
  listEl.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  $('noResults').hidden = shown.length > 0;
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (isEarned(t) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveEarned();
      renderAll();
    });
    const mid = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = `#${t.id}`;
    name.append(num, document.createTextNode(isMasked(t) ? 'Hidden trophy — earn to reveal' : t.name));
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isMasked(t) ? 'Spoiler shield is on. Tick this trophy off once you earn it to reveal its name and description.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const mkTag = (text, cls) => {
      const s = document.createElement('span');
      s.className = `tag ${cls}`;
      s.textContent = text;
      return s;
    };
    tags.append(mkTag(t.grade, `grade-${t.grade}`));
    tags.append(mkTag(KIND_LABELS[t.kind] || t.kind, ''));
    if (t.hidden) tags.append(mkTag('Hidden', 'hidden-tag'));
    if (t.missable) tags.append(mkTag('Missable', 'missable-tag'));
    if (isEarned(t)) tags.append(mkTag('Earned', 'earned-tag'));
    if (t.count) tags.append(mkTag(`Target: ${t.count.toLocaleString('en-US')}`, ''));
    mid.append(name, desc, tags);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-btn';
    btn.textContent = 'Guide →';
    btn.addEventListener('click', () => showGuide(t.id));
    li.append(box, mid, btn);
    listEl.append(li);
  }
  renderProgress();
}

function showGuide(id) {
  const t = byId(id);
  if (!t) return;
  selectedId = id;
  currentView = 'checklist';
  setTab('checklist');
  detailEl.replaceChildren();
  const h = document.createElement('h3');
  h.textContent = isMasked(t) ? 'Hidden trophy' : t.name;
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = isMasked(t)
    ? 'Spoiler shield is on — earn this trophy to reveal its official description.'
    : `Official description: “${t.description}” — ${t.grade}, #${t.id}`;
  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  const mkTag = (text, cls) => {
    const s = document.createElement('span');
    s.className = `tag ${cls}`;
    s.textContent = text;
    return s;
  };
  tags.append(mkTag(t.grade, `grade-${t.grade}`));
  tags.append(mkTag(KIND_LABELS[t.kind] || t.kind, ''));
  tags.append(mkTag(`Roadmap stage ${t.stage}`, ''));
  if (t.hidden) tags.append(mkTag('Hidden', 'hidden-tag'));
  if (t.missable) tags.append(mkTag('Missable', 'missable-tag'));
  const guideH = document.createElement('h4');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  detailEl.append(h, off, tags, guideH, guide);
  if (t.missable) {
    const warn = document.createElement('p');
    warn.className = 'warn';
    warn.textContent = 'Missable warning: meditate at every spot as you find it, starting in Chapter 1 — one spot disappears after that chapter and there is no mission replay. Keep a manual save at the start of every chapter.';
    detailEl.append(warn);
  }
  const srcH = document.createElement('h4');
  srcH.textContent = 'Sources';
  const src = document.createElement('ul');
  for (const s of t.sources || []) {
    const li = document.createElement('li');
    li.textContent = s;
    src.append(li);
  }
  detailEl.append(srcH, src);
  detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.replaceChildren();
  for (const st of STAGES) {
    const items = trophies.filter((t) => t.stage === st.n);
    const got = items.filter(isEarned).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = st.title + ' ';
    const c = document.createElement('span');
    c.className = 'stage-count';
    c.textContent = `(${got}/${items.length} earned)`;
    h.append(c);
    const p = document.createElement('p');
    p.textContent = st.note;
    const ul = document.createElement('ul');
    for (const t of items) {
      const row = document.createElement('li');
      row.className = isEarned(t) ? 'done' : '';
      row.textContent = `${isMasked(t) ? 'Hidden trophy' : t.name} — ${t.grade}${t.missable ? ' — ⚠ MISSABLE' : ''}`;
      ul.append(row);
    }
    li.append(h, p, ul);
    wrap.append(li);
  }
}

function renderMissable() {
  const wrap = $('missableList');
  wrap.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  for (const t of flagged) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = `⚠ ${t.name} (#${t.id}) — ${t.grade}`;
    const d = document.createElement('p');
    d.textContent = `Official description: “${t.description}”`;
    const g = document.createElement('p');
    g.textContent = t.guide;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guide-btn';
    btn.textContent = 'Open full guide →';
    btn.addEventListener('click', () => showGuide(t.id));
    card.append(h, d, g, btn);
    wrap.append(card);
  }
  $('missablePill').textContent = String(flagged.length);
}

function setTab(view) {
  currentView = view;
  for (const b of document.querySelectorAll('.tab')) {
    b.classList.toggle('active', b.dataset.view === view);
  }
  for (const v of ['checklist', 'roadmap', 'missable', 'about']) {
    $(`view-${v}`).hidden = v !== view;
  }
}

function renderAll() {
  renderList();
  renderRoadmap();
  renderMissable();
}

function exportProgress() {
  const payload = { app: 'leonida-platinum', trophies: 55, earned: [...earned].sort((a, b) => a - b), exportedAt: new Date().toISOString() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    earned = new Set(ids.map(Number).filter((n) => Number.isFinite(n) && byId(n)));
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
}

function bindControls() {
  for (const b of document.querySelectorAll('.tab')) {
    b.addEventListener('click', () => setTab(b.dataset.view));
  }
  for (const id of ['search', 'gradeFilter', 'kindFilter', 'statusFilter', 'hiddenFilter', 'missableOnly']) {
    $(id).addEventListener('input', renderList);
    $(id).addEventListener('change', renderList);
  }
  $('spoilerToggle').checked = spoilerOn;
  $('spoilerToggle').addEventListener('change', (e) => {
    spoilerOn = e.target.checked;
    saveSpoiler();
    renderAll();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => importProgress(e.target.files[0]));
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned ticks?')) return;
    earned = new Set();
    saveEarned();
    renderAll();
  });
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  trophies = doc.trophies || doc;
  trophies.sort((a, b) => a.id - b.id);
  bindControls();
  renderAll();
  const view = params.get('view');
  const id = Number(params.get('id'));
  if (view === 'guide' && Number.isFinite(id) && byId(id)) {
    showGuide(id);
  } else if (view && ['checklist', 'roadmap', 'missable', 'about'].includes(view)) {
    setTab(view);
  }
  if (demoIds.length) {
    // Demo state from ?earned= is shown, not saved; the header says so in the
    // progress note when nothing has been ticked by hand yet.
    renderProgress();
  }
}
boot();
