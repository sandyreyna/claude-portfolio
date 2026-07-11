// Tendencias de búsqueda — con cadena de fallback:
//   1) Google Trends (google-trends-api, sin clave)
//   2) Wikipedia Pageviews (alternativa real, sin clave)
//   3) Datos de demostración
import googleTrends from 'google-trends-api';
import { getWikipediaTrends } from './wikipedia.js';
import { seeded } from '../util/mock.js';

export async function getTrends({ keyword, geo = '', hl = 'es' }) {
  // 1) Google Trends
  try {
    const [interestRaw, relatedRaw] = await Promise.all([
      googleTrends.interestOverTime({ keyword, geo, hl }),
      googleTrends.relatedQueries({ keyword, geo, hl }).catch(() => null),
    ]);

    const interest = JSON.parse(interestRaw);
    const timeline = (interest?.default?.timelineData || []).map((p) => ({
      date: p.formattedTime,
      value: p.value?.[0] ?? 0,
    }));

    let related = [];
    if (relatedRaw) {
      const parsed = JSON.parse(relatedRaw);
      const ranked =
        parsed?.default?.rankedList?.[1]?.rankedKeyword ||
        parsed?.default?.rankedList?.[0]?.rankedKeyword ||
        [];
      related = ranked.slice(0, 10).map((r) => ({
        query: r.query,
        value: r.value,
      }));
    }

    if (!timeline.length) throw new Error('sin datos de timeline');

    return { source: 'live', provider: 'Google Trends', keyword, geo, timeline, related };
  } catch (googleErr) {
    // 2) Wikipedia (alternativa real sin clave)
    try {
      const wiki = await getWikipediaTrends({ keyword, hl });
      return {
        source: 'live-wikipedia',
        provider: 'Wikipedia',
        keyword,
        geo,
        article: wiki.article,
        timeline: wiki.timeline,
        related: wiki.related,
        note: `Google Trends no disponible (${googleErr.message}); usando Wikipedia.`,
      };
    } catch (wikiErr) {
      // 3) Demo
      return mockTrends({ keyword, geo, reason: `${googleErr.message} · ${wikiErr.message}` });
    }
  }
}

function mockTrends({ keyword, geo, reason }) {
  const rnd = seeded(keyword + geo);
  const timeline = Array.from({ length: 26 }, (_, i) => {
    const base = 40 + 30 * Math.sin(i / 3) + rnd() * 25;
    return {
      date: `Sem ${i + 1}`,
      value: Math.max(5, Math.min(100, Math.round(base))),
    };
  });
  const suffixes = [
    'precio', 'qué es', 'gratis', 'ejemplos', 'herramientas',
    'software', 'tendencias', 'estrategia', 'perú', 'cursos',
  ];
  const related = suffixes.map((s) => ({
    query: `${keyword} ${s}`,
    value: Math.round(20 + rnd() * 80),
  })).sort((a, b) => b.value - a.value);

  return { source: 'mock', provider: 'Demo', keyword, geo, timeline, related, note: reason };
}
