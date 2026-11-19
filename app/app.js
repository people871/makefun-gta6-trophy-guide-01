// Leonida Platinum — GTA 6 trophy guide + offline tracker.
// Vanilla JS, no libraries, no network beyond the same-origin data file.
// Everything on screen is derived from app/data/trophies.json at load time.

const EARNED_KEY = 'leonida-platinum-earned-v1';
const COUNTS_KEY = 'leonida-platinum-counts-v1';
const SPOILER_KEY = 'leonida-platinum-spoiler-v1';
const APP_NAME = 'Leonida Platinum';
const TOTAL = 55;

// The six reference works the guides draw on. The single https string here
// is data only — this file never fetches it or any other outside address.
// `match` is the substring used to count how many of the 55 guides cite
// each source (matched case-insensitively against every trophy's sources).
const SOURCES = [
  { name: 'Exophase', match: 'exophase', url: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/' },
  { name: 'OutputLag', match: 'outputlag', url: '' },
  { name: 'KeenGamer', match: 'keengamer', url: '' },
  { name: 'U7BUY', match: 'u7buy', url: '' },
  { name: 'PlanetGTA6', match: 'planetgta', url: '' },
  { name: 'PowerPyx', match: 'powerpyx', url: '' },
];

const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const $ = (id) => document.getElementById(id);
const norm = (v) => String(v ?? '').toLowerCase();

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}

// ---------------------------------------------------------------- state ---

let trophies = [];
let byId = new Map();
let earned = new Set();
let counts = {};
let spoiler = false;
let demoMode = false; // ?earned=… pre-checks live in memory only, never saved
let currentView = 'checklist';
let selectedId = 28;
let stageFilter = 0; // 0 = every stage

// ------------------------------------------------------------- persistence --

function loadStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    if (Array.isArray(raw)) earned = new Set(raw.filter((n) => Number.isInteger(n)));
  } catch { earned = new Set(); }
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}');
    if (raw && typeof raw === 'object') counts = raw;
  } catch { counts = {}; }
  spoiler = localStorage.getItem(SPOILER_KEY) === 'on';
}

function saveEarned() {
  if (demoMode) return;
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveCounts() {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoiler ? 'on' : 'off');
}

// -------------------------------------------------------------- URL params --

function readParams() {
  const q = new URLSearchParams(window.location.search);

  const view = q.get('view');
  if (['checklist', 'guide', 'roadmap', 'missable', 'about'].includes(view)) currentView = view;

  const id = Number.parseInt(q.get('id') ?? '', 10);
  if (Number.isInteger(id) && id >= 1 && id <= TOTAL) selectedId = id;

  if (q.get('spoiler') === 'on') {
    spoiler = true;
    saveSpoiler();
  }

  // Demo pre-checks: shown ticked, but never written to localStorage.
  const demo = q.get('earned');
  if (demo) {
    demoMode = true;
    earned = new Set(
      demo.split(',').map((s) => Number.parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= TOTAL),
    );
  }

  const demoCounts = q.get('counts');
  if (demoCounts) {
    for (const pair of demoCounts.split(',')) {
      const [a, b] = pair.split(':').map((s) => Number.parseInt(s.trim(), 10));
      if (Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a <= TOTAL) counts[a] = Math.max(0, b);
    }
  }

  // Filter presets, applied to the controls once the page exists.
  const setVal = (idName, value) => {
    const node = $(idName);
    if (node && value) node.value = value;
  };
  setVal('filter-grade', q.get('grade'));
  setVal('filter-kind', q.get('kind'));
  // ?hidden=only maps onto the "Hidden only" option, whose value is "hidden".
  if (q.get('hidden') === 'only') setVal('filter-hidden', 'hidden');
  if (q.get('missable') === 'only') {
    const node = $('filter-missable');
    if (node) {
      if (node.tagName === 'SELECT') node.value = 'only';
      else node.checked = true;
    }
  }
}

// ------------------------------------------------------------ derived data --

function sourceIndexOf(entry) {
  const text = norm(entry);
  return SOURCES.findIndex((s) => text.includes(s.match));
}

// How many of the 55 guides cite each of the six sources.
function sourceTallies() {
  return SOURCES.map((s) => {
    let n = 0;
    for (const t of trophies) {
      const list = Array.isArray(t.sources) ? t.sources : [];
      if (list.some((entry) => norm(entry).includes(s.match))) n += 1;
    }
    return n;
  });
}

function stepTotals() {
  let total = 0;
  let cited = 0;
  for (const t of trophies) {
    for (const step of Array.isArray(t.steps) ? t.steps : []) {
      total += 1;
      if (step && step.source !== undefined && step.source !== null && String(step.source).trim() !== '') cited += 1;
    }
  }
  return { total, cited };
}

function gradeTally() {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (out[t.grade] !== undefined) out[t.grade] += 1;
  return out;
}

// Roadmap order: stage ascending, then trophy id ascending.
function inRoadmapOrder(list) {
  return [...list].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
}

// ----------------------------------------------------------------- audit ---

function renderAudit() {
  const strip = $('audit-strip');
  if (!strip) return;
  const grades = gradeTally();
  const steps = stepTotals();
  const hidden = trophies.filter((t) => t.hidden).length;
  const sourced = trophies.filter((t) => Array.isArray(t.sources) && t.sources.length > 0).length;
  const missable = trophies.filter((t) => t.missable).length;
  const watch = trophies.filter((t) => t.watch).length;
  const disputes = trophies.filter((t) => t.dispute).length;
  const parts = [
    `${trophies.length} official`,
    `${grades.platinum}P ${grades.gold}G ${grades.silver}S ${grades.bronze}B`,
    `${hidden} hidden`,
    `${sourced}/${trophies.length} guides cite a source`,
    `${steps.cited}/${steps.total} steps cited`,
    `${SOURCES.length} sources read 19 Nov 2026`,
    `${missable} possibly missable`,
    `${watch} watch (unconfirmed)`,
    `${disputes} source disagreement`,
  ];
  strip.replaceChildren();
  for (const [i, part] of parts.entries()) {
    if (i > 0) strip.append(el('span', 'audit-sep', '·'));
    strip.append(el('span', 'audit-item', part));
  }
}

// -------------------------------------------------------------- progress ---

function renderProgress() {
  const bar = $('progress-bar');
  const pct = trophies.length ? Math.round((earned.size / trophies.length) * 100) : 0;
  if (bar) {
    if (bar.tagName === 'PROGRESS') {
      bar.max = trophies.length;
      bar.value = earned.size;
    } else {
      bar.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(earned.size));
    }
    bar.textContent = `${earned.size} / ${trophies.length}`;
  }
  const countsNode = $('grade-counts');
  if (countsNode) {
    const grades = gradeTally();
    countsNode.replaceChildren();
    for (const g of GRADE_ORDER) {
      const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
      countsNode.append(el('span', 'grade-count', `${g} ${got}/${grades[g]}`));
    }
    countsNode.append(el('span', 'grade-count', `${earned.size}/${trophies.length} earned · ${pct}%`));
  }
  // Keep the tab title in step with progress so the tracker reads at a glance.
  document.title = earned.size
    ? `${APP_NAME} — ${earned.size}/${trophies.length} trophies`
    : APP_NAME;
}

// ---------------------------------------------------------------- filters --

function filterValues() {
  const pick = (idName) => {
    const node = $(idName);
    return node ? String(node.value ?? '').toLowerCase() : '';
  };
  const missableNode = $('filter-missable');
  const missableOnly =
    (missableNode && missableNode.tagName === 'SELECT' && pick('filter-missable') === 'only') ||
    (missableNode && missableNode.type === 'checkbox' && missableNode.checked);
  return {
    grade: pick('filter-grade'),
    kind: pick('filter-kind'),
    hidden: pick('filter-hidden'),
    missableOnly,
    earned: pick('filter-earned'),
    search: norm($('filter-search') ? $('filter-search').value : ''),
  };
}

function passesFilters(t, f) {
  if (f.grade && f.grade !== 'all' && norm(t.grade) !== f.grade) return false;
  if (f.kind && f.kind !== 'all' && norm(t.kind) !== f.kind) return false;
  if (f.hidden === 'hidden' && !t.hidden) return false;
  if (f.hidden === 'visible' && t.hidden) return false;
  if (f.missableOnly && !t.missable) return false;
  if (f.earned === 'earned' && !earned.has(t.id)) return false;
  if ((f.earned === 'remaining' || f.earned === 'unearned') && earned.has(t.id)) return false;
  if (stageFilter && t.stage !== stageFilter) return false;
  if (f.search) {
    const hay = norm([t.id, t.name, t.description, t.guide, t.short, t.kind, t.stage].join(' '));
    if (!hay.includes(f.search)) return false;
  }
  return true;
}

// --------------------------------------------------------------- checklist --

function isMasked(t) {
  return spoiler && t.hidden && !earned.has(t.id);
}

function tagSpans(t, row) {
  row.append(el('span', `tag tag-grade tag-${norm(t.grade)}`, t.grade));
  if (t.kind) row.append(el('span', 'tag tag-kind', t.kind));
  row.append(el('span', 'tag tag-stage', `S${t.stage}`));
  if (t.hidden) row.append(el('span', 'tag tag-hidden', 'HIDDEN'));
  if (t.missable) row.append(el('span', 'tag tag-missable', 'MISSABLE'));
  if (t.watch) row.append(el('span', 'tag tag-watch', 'WATCH'));
  if (t.target) {
    const have = counts[t.id] ?? 0;
    row.append(el('span', 'tag tag-target', `${have}/${t.target}`));
  }
}

function renderChecklist() {
  const list = $('checklist');
  if (!list) return;
  const f = filterValues();
  const visible = inRoadmapOrder(trophies).filter((t) => passesFilters(t, f));
  list.replaceChildren();
  for (const t of visible) {
    const row = el('div', 'trophy-row');
    row.dataset.id = String(t.id);
    if (earned.has(t.id)) row.classList.add('is-earned');
    if (selectedId === t.id) row.classList.add('is-selected');
    if (isMasked(t)) row.classList.add('is-masked');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark trophy ${t.id} earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveEarned();
      renderAll();
    });
    row.append(box);

    const body = el('div', 'row-body');
    const name = el('span', 'row-name', isMasked(t) ? 'Hidden trophy' : t.name);
    body.append(name);
    body.append(
      el('span', 'row-desc', isMasked(t) ? 'Hidden trophy — earn to reveal' : (t.description ?? '')),
    );
    const tags = el('span', 'row-tags');
    tagSpans(t, tags);
    body.append(tags);
    row.append(body);

    row.addEventListener('click', (event) => {
      if (event.target === box) return;
      selectedId = t.id;
      currentView = 'guide';
      renderAll();
    });
    list.append(row);
  }
  if (!visible.length) list.append(el('p', 'empty-note', 'No trophies match these filters.'));
}

// ------------------------------------------------------------------ detail --

function citeLabel(step, t) {
  const src = step ? step.source : undefined;
  if (src === undefined || src === null || String(src).trim() === '') return '';
  if (typeof src === 'number' || /^\d+$/.test(String(src).trim())) return `[${src}]`;
  const idx = sourceIndexOf(src);
  if (idx >= 0) return `[${idx + 1}]`;
  return `[${src}]`;
}

function renderDetail() {
  const pane = $('guide-detail');
  if (!pane) return;
  const t = byId.get(selectedId);
  pane.replaceChildren();
  if (!t) {
    pane.append(el('p', 'empty-note', 'Select a trophy from the checklist to read its guide.'));
    return;
  }
  const masked = isMasked(t);

  const head = el('div', 'detail-head');
  head.append(el('h2', 'detail-name', masked ? `Hidden trophy #${t.id}` : `#${t.id} — ${t.name}`));
  const tags = el('span', 'row-tags');
  tagSpans(t, tags);
  head.append(tags);
  pane.append(head);

  pane.append(el('p', 'detail-label', 'Official description'));
  pane.append(el('p', 'detail-desc', masked ? 'Hidden trophy — earn to reveal.' : (t.description ?? '')));

  if (t.missable) {
    const box = el('div', 'callout callout-missable');
    box.append(el('strong', null, 'MISSABLE? — possibly missable.'));
    box.append(
      el('p', null, 'Earn this one before the story moves past it; there is no mission replay to go back for it.'),
    );
    pane.append(box);
  }
  if (t.dispute) {
    const box = el('div', 'callout callout-dispute');
    box.append(el('strong', null, 'Sources disagree — both versions shown.'));
    const d = t.dispute;
    if (d && typeof d === 'object') {
      // dispute holds two conflicting statements; show each on its own line.
      if (d.a) box.append(el('p', null, `One source says: ${d.a}`));
      if (d.b) box.append(el('p', null, `Another source says: ${d.b}`));
    } else {
      box.append(el('p', null, String(d)));
    }
    pane.append(box);
  }

  pane.append(el('p', 'detail-label', 'Guide'));
  pane.append(el('p', 'detail-guide', masked ? 'Hidden trophy — earn to reveal.' : (t.guide ?? '')));

  const steps = Array.isArray(t.steps) ? t.steps : [];
  if (steps.length) {
    pane.append(el('p', 'detail-label', 'Steps'));
    const ol = el('ol', 'detail-steps');
    for (const step of steps) {
      const li = el('li', null, step.text ?? '');
      const cite = citeLabel(step, t);
      if (cite) li.append(el('span', 'cite', ` ${cite}`));
      ol.append(li);
    }
    pane.append(ol);
  }

  if (t.short) {
    pane.append(el('p', 'detail-label', 'In short'));
    pane.append(el('p', 'detail-short', String(t.short)));
  }

  // Saved +/− counter for trophies that track a target number.
  if (t.target) {
    const have = Math.min(counts[t.id] ?? 0, t.target);
    const wrap = el('div', 'counter');
    wrap.append(el('strong', 'counter-label', `YOUR COUNT ${have} / ${t.target}`));
    const dec = el('button', 'counter-btn', '−');
    dec.type = 'button';
    dec.addEventListener('click', () => {
      counts[t.id] = Math.max(0, (counts[t.id] ?? 0) - 1);
      saveCounts();
      renderAll();
    });
    const inc = el('button', 'counter-btn', '+');
    inc.type = 'button';
    inc.addEventListener('click', () => {
      counts[t.id] = Math.min(t.target, (counts[t.id] ?? 0) + 1);
      saveCounts();
      renderAll();
    });
    wrap.append(dec, inc);
    const bar = el('div', 'counter-bar');
    const fill = el('div', 'counter-fill');
    fill.style.width = `${Math.round((have / t.target) * 100)}%`;
    bar.append(fill);
    wrap.append(bar);
    pane.append(wrap);
  }

  const srcList = Array.isArray(t.sources) ? t.sources : [];
  if (srcList.length) {
    pane.append(el('p', 'detail-label', 'Sources for this guide'));
    const ul = el('ul', 'detail-sources');
    for (const entry of srcList) {
      const idx = sourceIndexOf(entry);
      ul.append(el('li', null, idx >= 0 ? `[${idx + 1}] ${SOURCES[idx].name}` : String(entry)));
    }
    pane.append(ul);
  }
}

// ------------------------------------------------------------------ sources --

function renderSources() {
  const rail = $('sources-rail');
  if (!rail) return;
  const tallies = sourceTallies();
  rail.replaceChildren();
  rail.append(el('h2', 'rail-title', 'Sources'));
  const ol = el('ol', 'source-list');
  SOURCES.forEach((s, i) => {
    const li = el('li', 'source-item');
    li.append(el('strong', 'source-name', `${i + 1}. ${s.name}`));
    li.append(el('span', 'source-count', ` — cited by ${tallies[i]} of ${trophies.length} guides`));
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.url;
      a.rel = 'noopener';
      li.append(document.createElement('br'), a);
    }
    ol.append(li);
  });
  rail.append(ol);
  rail.append(
    el('p', 'rail-note', 'Guides cite the source list above; the app itself makes zero network requests.'),
  );
}

// -------------------------------------------------------------- stage chips --

// Fill the Kind filter with one option per kind present in the data, so the
// select actually filters instead of offering only "All kinds".
function renderKindOptions() {
  const sel = $('filter-kind');
  if (!sel) return;
  const kinds = [...new Set(trophies.map((t) => t.kind).filter(Boolean))].sort();
  sel.replaceChildren();
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All kinds';
  sel.append(all);
  for (const kind of kinds) {
    const opt = document.createElement('option');
    opt.value = kind;
    opt.textContent = kind.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    sel.append(opt);
  }
}

function renderStageChips() {
  const chips = $('stage-chips');
  if (!chips) return;
  chips.replaceChildren();
  for (let s = 1; s <= 6; s += 1) {
    const inStage = trophies.filter((t) => t.stage === s);
    const got = inStage.filter((t) => earned.has(t.id)).length;
    const chip = el('button', 'stage-chip', `S${s} · ${got}/${inStage.length}`);
    chip.type = 'button';
    if (stageFilter === s) chip.classList.add('is-active');
    chip.addEventListener('click', () => {
      stageFilter = stageFilter === s ? 0 : s;
      currentView = 'checklist';
      renderAll();
    });
    chips.append(chip);
  }
}

// ---------------------------------------------------------------- roadmap --

function renderRoadmap() {
  const view = $('roadmap-view');
  if (!view) return;
  view.replaceChildren();
  view.append(el('h2', null, 'Platinum roadmap'));
  const missable = trophies.find((t) => t.missable);
  if (missable) {
    const banner = el('p', 'roadmap-banner');
    banner.textContent = `Watch out: #${missable.id} ${missable.name} is possibly missable — earn it before the story moves on.`;
    view.append(banner);
  }

  const remaining = inRoadmapOrder(trophies.filter((t) => !earned.has(t.id))).slice(0, 10);
  view.append(el('h3', null, 'Next up — in roadmap order'));
  const next = el('ol', 'next-up');
  for (const t of remaining) {
    next.append(
      el('li', null, `#${t.id} ${isMasked(t) ? 'Hidden trophy' : t.name} — S${t.stage} · ${t.grade}`),
    );
  }
  view.append(next);

  const grid = el('div', 'stage-grid');
  for (let s = 1; s <= 6; s += 1) {
    const inStage = inRoadmapOrder(trophies.filter((t) => t.stage === s));
    const got = inStage.filter((t) => earned.has(t.id)).length;
    const card = el('article', 'stage-card');
    card.append(el('h3', null, `Stage ${s} — ${got}/${inStage.length} earned`));
    const ul = el('ul', 'stage-list');
    for (const t of inStage) {
      ul.append(
        el('li', earned.has(t.id) ? 'is-earned' : '', `#${t.id} ${isMasked(t) ? 'Hidden trophy' : t.name}`),
      );
    }
    card.append(ul);
    grid.append(card);
  }
  view.append(grid);
}

// ---------------------------------------------------------------- missable --

function renderMissable() {
  const view = $('missable-view');
  if (!view) return;
  view.replaceChildren();
  view.append(el('h2', null, 'Missable & watch list'));
  const flagged = trophies.find((t) => t.missable);
  if (flagged) {
    const card = el('article', 'watch-card watch-card-missable');
    card.append(el('h3', null, `#${flagged.id} — ${flagged.name}`));
    card.append(el('p', null, 'Possibly missable. Do this before the story moves past it.'));
    card.append(el('p', null, flagged.short ?? flagged.guide ?? ''));
    const open = el('button', null, 'Open guide');
    open.type = 'button';
    open.addEventListener('click', () => {
      selectedId = flagged.id;
      currentView = 'guide';
      renderAll();
    });
    card.append(open);
    view.append(card);
  }
  const watch = trophies.filter((t) => t.watch);
  view.append(el('h3', null, `Watch — ${watch.length} trophies with no confirmed unlock method at launch`));
  const grid = el('div', 'watch-grid');
  for (const t of inRoadmapOrder(watch)) {
    const card = el('article', 'watch-card');
    card.append(el('h3', null, `#${t.id} — ${isMasked(t) ? 'Hidden trophy' : t.name}`));
    const tags = el('span', 'row-tags');
    tagSpans(t, tags);
    card.append(tags);
    card.append(el('p', null, t.short ?? t.guide ?? ''));
    const open = el('button', null, 'Open guide');
    open.type = 'button';
    open.addEventListener('click', () => {
      selectedId = t.id;
      currentView = 'guide';
      renderAll();
    });
    card.append(open);
    grid.append(card);
  }
  view.append(grid);
}

// -------------------------------------------------------------------- views --

function applyView() {
  // The view sections carry the `hidden` attribute in the HTML, and that
  // attribute beats a plain style.display change, so toggle `hidden` itself
  // on every section — board included — for the selected view.
  const sections = {
    checklist: $('checklist-view'),
    roadmap: $('roadmap-view'),
    missable: $('missable-view'),
    about: $('about-view'),
  };
  const showBoard = currentView === 'checklist' || currentView === 'guide';
  if (sections.checklist) sections.checklist.hidden = !showBoard;
  for (const [name, node] of Object.entries(sections)) {
    if (name === 'checklist' || !node) continue;
    node.hidden = currentView !== name;
  }
  // The guide detail lives inside the board section; keep the board's inner
  // panes in step too, and mark the matching nav tab active (the guide view
  // has no tab of its own, so the Checklist tab stays active for it).
  const board = [$('checklist'), $('guide-detail'), $('sources-rail'), $('stage-chips')];
  for (const node of board) {
    if (node) node.style.display = showBoard ? '' : 'none';
  }
  const activeTab = currentView === 'guide' ? 'checklist-view' : `${currentView}-view`;
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.classList.toggle('is-active', tab.dataset.view === activeTab);
    tab.setAttribute('aria-current', tab.dataset.view === activeTab ? 'true' : 'false');
  }
  // Plain checklist loads open trophy #28 in the detail pane, and the boot
  // deliberately does not scroll anything — the masthead stays in frame.
}

// -------------------------------------------------------------- export/import

function downloadExport() {
  const payload = { app: APP_NAME, trophies: TOTAL, earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-platinum-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importFile(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return;
  }
  const list = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(list)) return;
  const ids = list.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL);
  earned = new Set(ids);
  demoMode = false;
  if (parsed && typeof parsed === 'object' && parsed.counts && typeof parsed.counts === 'object') {
    for (const [k, v] of Object.entries(parsed.counts)) {
      const id = Number.parseInt(k, 10);
      if (id >= 1 && id <= TOTAL && Number.isInteger(v)) counts[id] = Math.max(0, v);
    }
  }
  saveEarned();
  saveCounts();
  renderAll();
}

function wireControls() {
  // Nav tabs: switching views is a click, not just a URL parameter.
  for (const tab of document.querySelectorAll('.view-tab')) {
    tab.addEventListener('click', () => {
      const view = String(tab.dataset.view ?? '').replace(/-view$/, '');
      if (['checklist', 'roadmap', 'missable', 'about'].includes(view)) {
        currentView = view;
        renderAll();
      }
    });
  }
  const exportBtn = $('export-btn');
  if (exportBtn) exportBtn.addEventListener('click', downloadExport);
  const importBtn = $('import-btn');
  const importFileInput = $('import-file');
  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => importFileInput.click());
  }
  if (importFileInput) {
    importFileInput.addEventListener('change', async (event) => {
      await importFile(event.target.files ? event.target.files[0] : null);
      importFileInput.value = '';
    });
  }
  const resetBtn = $('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      earned = new Set();
      counts = {};
      demoMode = false;
      saveEarned();
      saveCounts();
      renderAll();
    });
  }
  for (const idName of ['filter-grade', 'filter-kind', 'filter-hidden', 'filter-missable', 'filter-earned']) {
    const node = $(idName);
    if (node) node.addEventListener('change', renderAll);
  }
  const search = $('filter-search');
  if (search) search.addEventListener('input', renderAll);
}

// --------------------------------------------------------------- render all --

function renderAll() {
  renderAudit();
  renderProgress();
  renderStageChips();
  renderChecklist();
  renderDetail();
  renderSources();
  renderRoadmap();
  renderMissable();
  applyView();
}

// -------------------------------------------------------------------- boot ---

async function boot() {
  loadStored();
  // Load the data first: the Kind options are built from it, and the URL
  // presets in readParams() can only stick once those options exist.
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  trophies = Array.isArray(doc) ? doc : doc.trophies ?? [];
  byId = new Map(trophies.map((t) => [t.id, t]));
  renderKindOptions();
  readParams();
  if (!byId.has(selectedId)) selectedId = 28;
  wireControls();
  renderAll();
}

boot().catch((err) => {
  const pane = $('guide-detail');
  if (pane) pane.append(el('p', 'empty-note', `Could not load trophies.json: ${err.message}`));
});
