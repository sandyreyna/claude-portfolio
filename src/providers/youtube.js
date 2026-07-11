// YouTube Data API v3 — videos más populares.
// https://developers.google.com/youtube/v3/docs/search/list
import { seeded } from '../util/mock.js';

export async function getYouTube({ keyword, region = 'PE' }) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return mockYouTube({ keyword, reason: 'YOUTUBE_API_KEY no configurada' });

  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', keyword);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('order', 'viewCount');
    searchUrl.searchParams.set('maxResults', '12');
    searchUrl.searchParams.set('regionCode', region);
    searchUrl.searchParams.set('relevanceLanguage', 'es');
    searchUrl.searchParams.set('key', key);

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
    const data = await res.json();

    const ids = (data.items || []).map((i) => i.id.videoId).filter(Boolean);
    let stats = {};
    if (ids.length) {
      const statUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      statUrl.searchParams.set('part', 'statistics');
      statUrl.searchParams.set('id', ids.join(','));
      statUrl.searchParams.set('key', key);
      const statRes = await fetch(statUrl);
      if (statRes.ok) {
        const statData = await statRes.json();
        stats = Object.fromEntries((statData.items || []).map((i) => [i.id, i.statistics]));
      }
    }

    const videos = (data.items || []).map((i) => ({
      id: i.id.videoId,
      title: i.snippet.title,
      channel: i.snippet.channelTitle,
      thumbnail: i.snippet.thumbnails?.medium?.url || i.snippet.thumbnails?.default?.url,
      publishedAt: i.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
      views: Number(stats[i.id.videoId]?.viewCount || 0),
      likes: Number(stats[i.id.videoId]?.likeCount || 0),
    }));

    return { source: 'live', keyword, videos };
  } catch (err) {
    return mockYouTube({ keyword, reason: err.message });
  }
}

function mockYouTube({ keyword, reason }) {
  const rnd = seeded('yt' + keyword);
  const channels = ['Marketing Latam', 'Growth Academy', 'Neil Patel Español', 'HubSpot', 'Platzi', 'Emprende Aprendiendo'];
  const templates = [
    `${keyword} explicado en 10 minutos`,
    `Cómo usar ${keyword} paso a paso (2026)`,
    `${keyword}: la estrategia que cambió mi negocio`,
    `Tutorial completo de ${keyword} para principiantes`,
    `Los secretos de ${keyword} que nadie te cuenta`,
    `${keyword} vs la competencia — comparativa real`,
    `Genera resultados con ${keyword} desde cero`,
    `Masterclass de ${keyword} | Curso gratis`,
    `Errores de ${keyword} que están matando tus ventas`,
    `El futuro de ${keyword} y la IA`,
  ];
  const videos = templates
    .map((title) => {
      const views = Math.round(5000 + rnd() * 2_000_000);
      return {
        id: null,
        title,
        channel: channels[Math.floor(rnd() * channels.length)],
        thumbnail: null,
        publishedAt: new Date(Date.now() - rnd() * 300 * 864e5).toISOString(),
        url: '#',
        views,
        likes: Math.round(views * (0.02 + rnd() * 0.05)),
      };
    })
    .sort((a, b) => b.views - a.views);

  return { source: 'mock', keyword, videos, note: reason };
}
