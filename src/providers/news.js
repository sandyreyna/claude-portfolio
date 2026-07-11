// Noticias del sector — con cadena de fallback:
//   1) NewsAPI (requiere NEWS_API_KEY)
//   2) Google News RSS (alternativa real, sin clave)
//   3) Datos de demostración
import { seeded } from '../util/mock.js';

export async function getNews({ keyword, lang = 'es', gl = 'PE' }) {
  const key = process.env.NEWS_API_KEY;

  // 1) NewsAPI
  if (key) {
    try {
      const url = new URL('https://newsapi.org/v2/everything');
      url.searchParams.set('q', keyword);
      url.searchParams.set('language', lang);
      url.searchParams.set('sortBy', 'publishedAt');
      url.searchParams.set('pageSize', '12');

      const res = await fetch(url, { headers: { 'X-Api-Key': key } });
      if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'ok') throw new Error(data.message || 'error de NewsAPI');

      const articles = (data.articles || []).map((a) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        image: a.urlToImage,
        source: a.source?.name,
        publishedAt: a.publishedAt,
      }));
      if (articles.length) {
        return { source: 'live', provider: 'NewsAPI', keyword, total: data.totalResults, articles };
      }
      throw new Error('NewsAPI sin resultados');
    } catch (err) {
      const rss = await googleNewsRss({ keyword, lang, gl }).catch(() => null);
      if (rss) return rss;
      return mockNews({ keyword, reason: err.message });
    }
  }

  // 2) Google News RSS (sin clave)
  const rss = await googleNewsRss({ keyword, lang, gl }).catch((e) => ({ error: e.message }));
  if (rss && rss.articles) return rss;

  // 3) Demo
  return mockNews({ keyword, reason: rss?.error || 'NEWS_API_KEY no configurada' });
}

// Parseo ligero del RSS de Google News (XML) sin dependencias.
async function googleNewsRss({ keyword, lang = 'es', gl = 'PE' }) {
  const hl = `${lang}-419`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}` +
    `&hl=${hl}&gl=${gl}&ceid=${gl}:${lang}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (MarketingIntelligenceDashboard)' } });
  if (!res.ok) throw new Error(`Google News RSS HTTP ${res.status}`);
  const items = parseGoogleNewsRss(await res.text());

  if (!items.length) throw new Error('Google News RSS sin resultados');
  return { source: 'live-rss', provider: 'Google News', keyword, total: items.length, articles: items };
}

// Parser puro (exportado para pruebas) del XML de Google News RSS.
export function parseGoogleNewsRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12).map((m) => {
    const block = m[1];
    const pick = (tag) => {
      const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return r ? decode(r[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()) : '';
    };
    const rawTitle = pick('title');
    // El título suele venir como "Titular - Fuente"
    const source = pick('source') || rawTitle.split(' - ').slice(-1)[0];
    const title = source && rawTitle.endsWith(` - ${source}`)
      ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
    return {
      title,
      description: '',
      url: pick('link'),
      image: null,
      source,
      publishedAt: pick('pubDate') ? new Date(pick('pubDate')).toISOString() : null,
    };
  }).filter((a) => a.title);
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
}

function mockNews({ keyword, reason }) {
  const rnd = seeded('news' + keyword);
  const outlets = ['Gestión', 'El Comercio', 'Forbes', 'TechCrunch', 'Marketing Directo', 'Merca2.0'];
  const templates = [
    `Cómo ${keyword} está transformando el marketing digital en 2026`,
    `5 tendencias de ${keyword} que las marcas no pueden ignorar`,
    `Inversión en ${keyword} crece un 34% en Latinoamérica`,
    `Guía práctica: implementar ${keyword} en tu estrategia`,
    `Los líderes del sector apuestan por ${keyword}`,
    `${keyword}: qué esperar para el próximo trimestre`,
    `Casos de éxito de ${keyword} en empresas peruanas`,
    `El impacto de la IA sobre ${keyword}`,
    `Errores comunes al adoptar ${keyword}`,
    `${keyword} y el futuro de la experiencia del cliente`,
  ];
  const articles = templates.map((title, i) => ({
    title,
    description: `Análisis sobre ${keyword} y su relevancia para el sector. Este es contenido de demostración; configura NEWS_API_KEY para ver noticias reales.`,
    url: '#',
    image: null,
    source: outlets[Math.floor(rnd() * outlets.length)],
    publishedAt: new Date(Date.now() - i * 36e5 * (1 + rnd() * 6)).toISOString(),
  }));

  return { source: 'mock', provider: 'Demo', keyword, total: articles.length, articles, note: reason };
}
