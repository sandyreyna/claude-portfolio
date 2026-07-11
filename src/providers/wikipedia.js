// Wikipedia — fuente alternativa SIN API key para tendencias.
// - Pageviews REST API: interés (visitas) del artículo en el tiempo.
// - OpenSearch API: artículos relacionados (temas afines al término).
// Docs: https://wikimedia.org/api/rest_v1/  ·  https://www.mediawiki.org/wiki/API:Opensearch
const UA = 'MarketingIntelligenceDashboard/1.0 (contacto: dashboard@example.com)';

function projectFor(hl) {
  const lang = (hl || 'es').slice(0, 2).toLowerCase();
  return { lang, host: `${lang}.wikipedia.org`, project: `${lang}.wikipedia` };
}

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// Resuelve el término a un artículo real y obtiene títulos relacionados.
async function resolve(keyword, host) {
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set('action', 'opensearch');
  url.searchParams.set('search', keyword);
  url.searchParams.set('limit', '10');
  url.searchParams.set('namespace', '0');
  url.searchParams.set('format', 'json');

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia opensearch HTTP ${res.status}`);
  const [, titles] = await res.json();
  if (!titles?.length) throw new Error('sin coincidencias en Wikipedia');
  return { title: titles[0], related: titles.slice(1) };
}

// Visitas diarias del artículo, agregadas por semana.
async function pageviews(title, project) {
  const end = new Date();
  const start = new Date(end.getTime() - 120 * 864e5); // ~4 meses
  const article = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `${project}/all-access/all-agents/${article}/daily/${ymd(start)}/${ymd(end)}`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia pageviews HTTP ${res.status}`);
  const { items = [] } = await res.json();
  if (!items.length) throw new Error('sin pageviews');

  // Agrupa en cubos semanales.
  const weeks = [];
  for (let i = 0; i < items.length; i += 7) {
    const chunk = items.slice(i, i + 7);
    const sum = chunk.reduce((s, it) => s + (it.views || 0), 0);
    const ts = chunk[0].timestamp; // YYYYMMDD00
    weeks.push({ raw: sum, ts });
  }
  const max = Math.max(...weeks.map((w) => w.raw), 1);
  return weeks.map((w) => ({
    date: `${w.ts.slice(6, 8)}/${w.ts.slice(4, 6)}`,
    value: Math.round((w.raw / max) * 100), // normalizado 0-100 como Google Trends
  }));
}

export async function getWikipediaTrends({ keyword, hl = 'es' }) {
  const { host, project } = projectFor(hl);
  const { title, related } = await resolve(keyword, host);
  const timeline = await pageviews(title, project);

  // "Relacionados" = temas afines de Wikipedia, ponderados por orden de relevancia.
  const relatedRanked = related.map((query, i) => ({
    query,
    value: Math.max(5, Math.round(100 * (related.length - i) / related.length)),
  }));

  return { article: title, timeline, related: relatedRanked };
}
