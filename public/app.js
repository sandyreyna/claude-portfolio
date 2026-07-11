'use strict';

const PALETTE = ['#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f97316',
                '#e11d48', '#f59e0b', '#22c55e', '#ec4899', '#64748b'];

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function fmtNum(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
function timeAgo(iso) {
  const d = new Date(iso).getTime();
  if (!d) return '';
  const s = (Date.now() - d) / 1000;
  if (s < 3600) return `hace ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}
const badge = (src) => {
  const live = src && src.startsWith('live');
  return `<span class="src-badge ${live ? 'live' : 'demo'}">${live ? '● en vivo' : '◐ demo'}</span>`;
};

// ── Theme ─────────────────────────────────────────────
const savedTheme = localStorage.getItem('mi-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('mi-theme', next);
});

// ── API status ────────────────────────────────────────
async function loadStatus() {
  try {
    const s = await fetch('/api/status').then((r) => r.json());
    const row = $('#statusRow');
    row.innerHTML = '';
    const items = [
      ['Google Trends', s.trends], ['NewsAPI', s.news],
      ['Reddit', s.reddit], ['YouTube', s.youtube],
    ];
    for (const [name, live] of items) {
      const p = el('span', `status-pill ${live ? 'live' : 'demo'}`,
        `<i></i>${esc(name)} · ${live ? 'conectado' : 'sin clave (demo)'}`);
      p.title = live
        ? `${name} tiene credenciales configuradas.`
        : `${name} usará datos de demostración hasta que agregues su clave en .env`;
      row.appendChild(p);
    }
  } catch { /* silencioso */ }
}
loadStatus();

// ── Search wiring ─────────────────────────────────────
const input = $('#keyword');
const regionSel = $('#region');
$('#searchBtn').addEventListener('click', run);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
document.querySelectorAll('.chip').forEach((c) =>
  c.addEventListener('click', () => { input.value = c.textContent; run(); }));

async function run() {
  const keyword = input.value.trim();
  if (!keyword) { input.focus(); return; }
  const region = regionSel.value;
  const geo = regionSel.selectedOptions[0].dataset.geo;

  const board = $('#board');
  board.innerHTML = `<div class="loading"><div class="spinner"></div>Analizando “${esc(keyword)}”…</div>`;
  $('#searchBtn').disabled = true;

  try {
    const url = `/api/all?keyword=${encodeURIComponent(keyword)}&geo=${encodeURIComponent(geo)}&region=${encodeURIComponent(region)}`;
    const data = await fetch(url).then((r) => r.json());
    render(data);
    $('#genTime').textContent = 'Generado ' + new Date().toLocaleString('es-PE');
  } catch (err) {
    board.innerHTML = `<div class="loading">No se pudo completar el análisis.<br><small>${esc(err.message)}</small></div>`;
  } finally {
    $('#searchBtn').disabled = false;
  }
}

// ── Render ────────────────────────────────────────────
function render(data) {
  const board = $('#board');
  board.innerHTML = '';
  const frag = $('#tpl-dashboard').content.cloneNode(true);
  board.appendChild(frag);

  renderTrends(data.trends);
  renderNews(data.news);
  renderReddit(data.reddit);
  renderYouTube(data.youtube);
}

function panel(name) { return document.querySelector(`[data-panel="${name}"]`); }

// 1. Trends
function renderTrends(t) {
  const p = panel('trends');
  $('.src-badge', p).outerHTML = badge(t.source);
  drawLineChart($('.line-chart', p), t.timeline || []);
  drawDonut($('.donut', p), t.related || []);

  const total = (t.related || []).length;
  $('.donut-center strong', p).textContent = total;

  const list = $('.related-list', p);
  list.innerHTML = '';
  (t.related || []).slice(0, 8).forEach((r, i) => {
    const li = el('li', '',
      `<span class="swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>` +
      `<b>${esc(r.query)}</b><span class="val">${esc(r.value)}</span>`);
    list.appendChild(li);
  });
}

function drawLineChart(svg, points) {
  const W = 640, H = 220, pad = 24;
  svg.innerHTML = '';
  if (!points.length) return;
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = (W - pad * 2) / (points.length - 1 || 1);
  const x = (i) => pad + i * stepX;
  const y = (v) => H - pad - (v / max) * (H - pad * 2);

  // gridlines
  for (let g = 0; g <= 4; g++) {
    const gy = pad + (g / 4) * (H - pad * 2);
    svg.appendChild(svgEl('line', { x1: pad, y1: gy, x2: W - pad, y2: gy,
      stroke: 'var(--line)', 'stroke-width': 1 }));
  }
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;

  const grad = svgEl('linearGradient', { id: 'gTrend', x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#6366f1', 'stop-opacity': .35 }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#6366f1', 'stop-opacity': 0 }));
  const defs = svgEl('defs', {}); defs.appendChild(grad); svg.appendChild(defs);

  svg.appendChild(svgEl('path', { d: area, fill: 'url(#gTrend)' }));
  svg.appendChild(svgEl('path', { d: line, fill: 'none', stroke: '#6366f1',
    'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));

  // último punto destacado
  const last = points.length - 1;
  svg.appendChild(svgEl('circle', { cx: x(last), cy: y(points[last].value), r: 4,
    fill: '#fff', stroke: '#6366f1', 'stroke-width': 2.5 }));
}

function drawDonut(svg, related) {
  svg.innerHTML = '';
  const cx = 100, cy = 100, r = 74, w = 26;
  const items = (related || []).slice(0, 8);
  const total = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
  let a0 = -Math.PI / 2;
  items.forEach((it, i) => {
    const frac = (Number(it.value) || 0) / total;
    const a1 = a0 + frac * Math.PI * 2;
    svg.appendChild(svgEl('path', {
      d: arc(cx, cy, r, a0, a1),
      fill: 'none', stroke: PALETTE[i % PALETTE.length], 'stroke-width': w,
    }));
    a0 = a1;
  });
  if (!items.length) {
    svg.appendChild(svgEl('circle', { cx, cy, r, fill: 'none',
      stroke: 'var(--line)', 'stroke-width': w }));
  }
}

function arc(cx, cy, r, a0, a1) {
  const gap = 0.03;
  a0 += gap; a1 -= gap;
  if (a1 < a0) a1 = a0;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
}

function svgEl(tag, attrs) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}

// 2. News
function renderNews(n) {
  const p = panel('news');
  $('.src-badge', p).outerHTML = badge(n.source);
  const list = $('.news-list', p);
  list.innerHTML = '';
  (n.articles || []).slice(0, 10).forEach((a) => {
    const item = el('a', 'news-item');
    item.href = a.url || '#';
    item.target = '_blank'; item.rel = 'noopener';
    const thumb = a.image
      ? `<img class="news-thumb" src="${esc(a.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'news-thumb',textContent:'📰'}))">`
      : `<div class="news-thumb">📰</div>`;
    item.innerHTML = thumb +
      `<div><h4>${esc(a.title)}</h4>` +
      `<div class="meta">${esc(a.source || '')} · ${timeAgo(a.publishedAt)}</div></div>`;
    list.appendChild(item);
  });
}

// 3. Reddit
function renderReddit(rd) {
  const p = panel('reddit');
  $('.src-badge', p).outerHTML = badge(rd.source);
  const list = $('.reddit-list', p);
  list.innerHTML = '';
  (rd.posts || []).slice(0, 10).forEach((post, i) => {
    const item = el('a', 'reddit-item');
    item.href = post.url || '#';
    item.target = '_blank'; item.rel = 'noopener';
    item.innerHTML =
      `<div class="reddit-rank">${i + 1}</div>` +
      `<div class="reddit-body"><h4>${esc(post.title)}</h4>` +
      `<div class="meta">${esc(post.subreddit)} · ▲ ${fmtNum(post.score)}</div></div>` +
      `<div class="reddit-comments"><b>${fmtNum(post.comments)}</b><span>coment.</span></div>`;
    list.appendChild(item);
  });
}

// 4. YouTube
function renderYouTube(yt) {
  const p = panel('youtube');
  $('.src-badge', p).outerHTML = badge(yt.source);
  const grid = $('.video-grid', p);
  grid.innerHTML = '';
  (yt.videos || []).slice(0, 9).forEach((v) => {
    const card = el('a', 'video-card');
    card.href = v.url || '#';
    card.target = '_blank'; card.rel = 'noopener';
    const thumb = v.thumbnail
      ? `<div class="video-thumb" style="padding:0"><img src="${esc(v.thumbnail)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:10px"><span class="play">▶</span></div>`
      : `<div class="video-thumb"><span class="play">▶</span></div>`;
    card.innerHTML = thumb +
      `<h4>${esc(v.title)}</h4>` +
      `<div class="meta">${esc(v.channel)} · ${fmtNum(v.views)} vistas</div>`;
    grid.appendChild(card);
  });
}
