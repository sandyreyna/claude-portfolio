// NewsAPI — noticias del sector.
// https://newsapi.org/docs/endpoints/everything
import { seeded } from '../util/mock.js';

export async function getNews({ keyword, lang = 'es' }) {
  const key = process.env.NEWS_API_KEY;
  if (!key) return mockNews({ keyword, reason: 'NEWS_API_KEY no configurada' });

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

    return { source: 'live', keyword, total: data.totalResults, articles };
  } catch (err) {
    return mockNews({ keyword, reason: err.message });
  }
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

  return { source: 'mock', keyword, total: articles.length, articles, note: reason };
}
