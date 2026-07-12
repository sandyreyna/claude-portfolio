// Videos más populares — con cadena de fallback:
//   1) YouTube Data API v3 (requiere YOUTUBE_API_KEY)
//   2) Piped (frontend abierto de YouTube, sin clave; varias instancias)
//   3) Invidious (frontend abierto de YouTube, sin clave; varias instancias)
//   4) Datos de demostración
import { seeded } from '../util/mock.js';

// Instancias públicas (se prueban en orden hasta que una responda).
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de', 'https://api.piped.private.coffee'];
const INVIDIOUS = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de', 'https://yewtu.be'];

async function fetchJson(url, { timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'MarketingIntelligenceDashboard/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function getYouTube({ keyword, region = 'PE' }) {
  const key = process.env.YOUTUBE_API_KEY;

  // 1) YouTube Data API
  if (key) {
    try {
      return await youtubeApi({ keyword, region, key });
    } catch (apiErr) {
      const alt = await keylessVideos(keyword).catch(() => null);
      if (alt) return alt;
      return mockYouTube({ keyword, reason: apiErr.message });
    }
  }

  // 2/3) Alternativas sin clave
  try {
    return await keylessVideos(keyword);
  } catch (err) {
    // 4) Demo
    return mockYouTube({ keyword, reason: err.message });
  }
}

async function youtubeApi({ keyword, region, key }) {
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

  if (!videos.length) throw new Error('YouTube API sin resultados');
  return { source: 'live', provider: 'YouTube', keyword, videos };
}

// Prueba Piped (grupo en paralelo) y, si falla, Invidious (grupo en paralelo).
// Promise.any devuelve la primera instancia que responda con resultados.
async function keylessVideos(keyword) {
  const q = encodeURIComponent(keyword);

  const pipedTry = PIPED.map(async (base) => {
    const videos = parsePiped(await fetchJson(`${base}/search?q=${q}&filter=videos`, { timeout: 6000 }));
    if (!videos.length) throw new Error('Piped sin resultados');
    return { source: 'live-piped', provider: 'Piped', keyword, videos };
  });
  try { return await Promise.any(pipedTry); } catch { /* prueba Invidious */ }

  const invTry = INVIDIOUS.map(async (base) => {
    const videos = parseInvidious(await fetchJson(`${base}/api/v1/search?q=${q}&type=video&sort_by=view_count`, { timeout: 6000 }));
    if (!videos.length) throw new Error('Invidious sin resultados');
    return { source: 'live-invidious', provider: 'Invidious', keyword, videos };
  });
  try {
    return await Promise.any(invTry);
  } catch {
    throw new Error('ninguna instancia de Piped/Invidious respondió');
  }
}

// Parsers puros (exportados para pruebas).
export function parsePiped(json) {
  const items = json?.items || [];
  return items
    .filter((v) => v.url && /\/watch\?v=/.test(v.url))
    .slice(0, 12)
    .map((v) => {
      const id = v.url.split('v=')[1];
      return {
        id,
        title: v.title,
        channel: v.uploaderName,
        thumbnail: v.thumbnail || null,
        publishedAt: v.uploaded ? new Date(v.uploaded).toISOString() : null,
        url: `https://www.youtube.com/watch?v=${id}`,
        views: Number(v.views ?? 0),
        likes: 0,
      };
    })
    .sort((a, b) => b.views - a.views);
}

export function parseInvidious(json) {
  const items = Array.isArray(json) ? json : (json?.results || []);
  return items
    .filter((v) => v.videoId && (v.type === undefined || v.type === 'video'))
    .slice(0, 12)
    .map((v) => ({
      id: v.videoId,
      title: v.title,
      channel: v.author,
      thumbnail: (v.videoThumbnails || []).find((t) => t.quality === 'medium')?.url
        || v.videoThumbnails?.[0]?.url || null,
      publishedAt: v.published ? new Date(v.published * 1000).toISOString() : null,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
      views: Number(v.viewCount ?? 0),
      likes: 0,
    }))
    .sort((a, b) => b.views - a.views);
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

  return { source: 'mock', provider: 'Demo', keyword, videos, note: reason };
}
