// ─────────────────────────────────────────────────────────────
//  Dashboard de Marketing Intelligence — servidor Express.
//  Actúa de proxy hacia Google Trends, NewsAPI, Reddit y YouTube,
//  manteniendo las claves fuera del navegador.
// ─────────────────────────────────────────────────────────────
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getTrends } from './src/providers/trends.js';
import { getNews } from './src/providers/news.js';
import { getReddit } from './src/providers/reddit.js';
import { getYouTube } from './src/providers/youtube.js';
import { getSentiment } from './src/providers/sentiment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Carga mínima de .env (sin dependencias externas) ---
loadEnv(path.join(__dirname, '.env'));
function loadEnv(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!m || line.trim().startsWith('#')) continue;
      const key = m[1];
      let val = (m[2] || '').trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* .env es opcional */
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Envuelve un handler async y captura errores.
const wrap = (fn) => async (req, res) => {
  const keyword = (req.query.keyword || '').toString().trim();
  if (!keyword) return res.status(400).json({ error: 'Falta el parámetro "keyword".' });
  try {
    const data = await fn(req, keyword);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

app.get('/api/trends', wrap((req, keyword) =>
  getTrends({ keyword, geo: (req.query.geo || '').toString(), hl: 'es' })));

app.get('/api/news', wrap((req, keyword) =>
  getNews({ keyword, lang: (req.query.lang || 'es').toString(), gl: (req.query.region || 'PE').toString() })));

app.get('/api/reddit', wrap((req, keyword) =>
  getReddit({ keyword })));

app.get('/api/youtube', wrap((req, keyword) =>
  getYouTube({ keyword, region: (req.query.region || 'PE').toString() })));

// Endpoint agregado: todo en una sola llamada.
app.get('/api/all', wrap(async (req, keyword) => {
  const geo = (req.query.geo || '').toString();
  const region = (req.query.region || 'PE').toString();
  const [trends, news, reddit, youtube] = await Promise.all([
    getTrends({ keyword, geo, hl: 'es' }),
    getNews({ keyword, lang: 'es', gl: region }),
    getReddit({ keyword }),
    getYouTube({ keyword, region }),
  ]);

  // Sentimiento sobre los titulares de noticias + hilos de Reddit ya obtenidos.
  const entries = [
    ...(news.articles || []).map((a) => ({ text: a.title, from: a.source || 'Noticias' })),
    ...(reddit.posts || []).map((p) => ({ text: p.title, from: p.subreddit || 'Reddit' })),
  ];
  const sentiment = await getSentiment(entries);

  return { keyword, trends, news, reddit, youtube, sentiment };
}));

// Health check liviano para el host (Render): no depende de fuentes externas.
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Estado de configuración (qué APIs están en vivo).
app.get('/api/status', (_req, res) => {
  res.json({
    news: Boolean(process.env.NEWS_API_KEY),
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    reddit: Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET),
    trends: true,
    sentiment: Boolean(process.env.HF_TOKEN),
  });
});

app.listen(PORT, () => {
  console.log(`\n  Marketing Intelligence Dashboard`);
  console.log(`  ▸ http://localhost:${PORT}\n`);
});
