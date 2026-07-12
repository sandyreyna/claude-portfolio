// Reddit — temas más comentados.
// Con credenciales usa OAuth (oauth.reddit.com); si no, el endpoint público .json.
import { seeded } from '../util/mock.js';

const UA = 'MarketingIntelligenceDashboard/1.0';
let cachedToken = null; // { token, expires }

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Reddit token HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

export async function getReddit({ keyword }) {
  try {
    const token = await getToken();
    const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
    const url = new URL(`${base}/search.json`);
    url.searchParams.set('q', keyword);
    url.searchParams.set('sort', 'comments');
    url.searchParams.set('t', 'month');
    url.searchParams.set('limit', '12');

    const headers = { 'User-Agent': UA };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Reddit HTTP ${res.status}`);
    const data = await res.json();

    const posts = (data?.data?.children || []).map(({ data: p }) => ({
      title: p.title,
      subreddit: p.subreddit_name_prefixed,
      comments: p.num_comments,
      score: p.score,
      url: `https://www.reddit.com${p.permalink}`,
      author: p.author,
      created: p.created_utc * 1000,
    }));

    if (!posts.length) throw new Error('sin resultados de Reddit');

    return { source: token ? 'live' : 'live-public', keyword, posts };
  } catch (err) {
    return mockReddit({ keyword, reason: err.message });
  }
}

function mockReddit({ keyword, reason }) {
  const rnd = seeded('reddit' + keyword);
  const subs = ['r/marketing', 'r/PPC', 'r/SEO', 'r/socialmedia', 'r/Entrepreneur', 'r/analytics', 'r/digital_marketing'];
  const templates = [
    `¿Vale la pena invertir en ${keyword} en 2026?`,
    `Mi experiencia usando ${keyword} durante 6 meses`,
    `¿Qué herramientas de ${keyword} recomiendan?`,
    `Debate: ${keyword} vs los métodos tradicionales`,
    `Guía completa de ${keyword} para principiantes`,
    `¿${keyword} está sobrevalorado? Cambien mi opinión`,
    `Resultados reales después de aplicar ${keyword}`,
    `¿Cómo miden el ROI de ${keyword}?`,
    `Los mejores recursos gratuitos sobre ${keyword}`,
    `${keyword}: lo que nadie te cuenta`,
  ];
  const posts = templates
    .map((title, i) => ({
      title,
      subreddit: subs[Math.floor(rnd() * subs.length)],
      comments: Math.round(50 + rnd() * 900),
      score: Math.round(100 + rnd() * 4000),
      url: '#',
      author: `user_${Math.floor(rnd() * 9999)}`,
      created: Date.now() - i * 864e5 * rnd() * 3,
    }))
    .sort((a, b) => b.comments - a.comments);

  return { source: 'mock', keyword, posts, note: reason };
}
