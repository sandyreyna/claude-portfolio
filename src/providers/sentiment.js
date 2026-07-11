// Sentimiento del mercado — enriquece los textos ya obtenidos (noticias + Reddit).
// Cadena de fallback:
//   1) Hugging Face Inference API (modelo multilingüe, requiere HF_TOKEN)
//   2) Léxico local ES/EN (heurístico, sin clave — resultado real, no demo)
//   3) Vacío si no hay textos
const HF_MODEL = 'cardiffnlp/twitter-xlm-roberta-base-sentiment';

const POS = { label: 'positivo', color: '#22c55e' };
const NEU = { label: 'neutro', color: '#94a3b8' };
const NEG = { label: 'negativo', color: '#ef4444' };

export async function getSentiment(entries = []) {
  const clean = entries.filter((e) => e && e.text).slice(0, 40);
  if (!clean.length) {
    return empty('sin textos que analizar');
  }
  const texts = clean.map((e) => e.text);
  const token = process.env.HF_TOKEN;

  // 1) Hugging Face
  if (token) {
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
      });
      if (!res.ok) throw new Error(`HF HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const scored = texts.map((_, i) => fromHF(data[i]));
      return aggregate(clean, scored, 'live', 'Hugging Face');
    } catch (err) {
      return lexiconScore(clean, `HF no disponible (${err.message}); usando léxico local.`);
    }
  }

  // 2) Léxico local (sin clave)
  return lexiconScore(clean, 'HF_TOKEN no configurada; usando léxico local.');
}

// Convierte la salida de HF ([{label,score}...]) en {label, signed}.
function fromHF(arr) {
  if (!Array.isArray(arr)) return { label: NEU.label, signed: 0 };
  let pos = 0, neg = 0, best = { label: '', score: -1 };
  for (const { label = '', score = 0 } of arr) {
    const l = label.toLowerCase();
    if (l.includes('pos') || l === 'label_2') pos = score;
    else if (l.includes('neg') || l === 'label_0') neg = score;
    if (score > best.score) best = { label: l, score };
  }
  const label = best.label.includes('pos') || best.label === 'label_2' ? POS.label
    : best.label.includes('neg') || best.label === 'label_0' ? NEG.label : NEU.label;
  return { label, signed: pos - neg };
}

// ── Léxico local (heurístico, multilingüe ligero) ──────────────
const LEX_POS = new Set(['crece', 'crecimiento', 'éxito', 'exito', 'gana', 'ganancia', 'mejora',
  'mejor', 'lidera', 'líder', 'lider', 'innovación', 'innovacion', 'oportunidad', 'positivo',
  'aumenta', 'impulsa', 'récord', 'record', 'rentable', 'beneficio', 'avance', 'fuerte', 'auge',
  'prometedor', 'destaca', 'transforma', 'potencia', 'boom', 'growth', 'win', 'best', 'gain',
  'surge', 'rise', 'success', 'boost', 'top', 'love', 'great', 'leader', 'profit', 'up']);
const LEX_NEG = new Set(['cae', 'caída', 'caida', 'crisis', 'pierde', 'pérdida', 'perdida', 'fracaso',
  'riesgo', 'problema', 'error', 'errores', 'peor', 'malo', 'negativo', 'baja', 'desploma',
  'amenaza', 'preocupa', 'débil', 'debil', 'estafa', 'fraude', 'demanda', 'polémica', 'polemica',
  'sobrevalorado', 'muriendo', 'matando', 'fall', 'drop', 'loss', 'risk', 'fail', 'crash', 'worst',
  'bad', 'down', 'scam', 'fear', 'hate', 'weak', 'decline', 'crisis', 'threat', 'bubble']);

function lexiconScore(entries, note) {
  const scored = entries.map((e) => {
    const words = e.text.toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/);
    let p = 0, n = 0;
    for (const w of words) { if (LEX_POS.has(w)) p++; if (LEX_NEG.has(w)) n++; }
    const signed = p + n === 0 ? 0 : (p - n) / (p + n);
    const label = signed > 0.15 ? POS.label : signed < -0.15 ? NEG.label : NEU.label;
    return { label, signed };
  });
  return aggregate(entries, scored, 'live-lexicon', 'Léxico local', note);
}

// ── Agregación común ───────────────────────────────────────────
function aggregate(entries, scored, source, provider, note) {
  const breakdown = { positivo: 0, neutro: 0, negativo: 0 };
  const items = entries.map((e, i) => {
    const s = scored[i] || { label: NEU.label, signed: 0 };
    breakdown[s.label] = (breakdown[s.label] || 0) + 1;
    return { text: e.text, from: e.from || '', label: s.label, score: Number(s.signed.toFixed(3)) };
  });

  const avg = items.reduce((sum, it) => sum + it.score, 0) / (items.length || 1);
  const overallLabel = avg > 0.12 ? POS.label : avg < -0.12 ? NEG.label : NEU.label;

  const sorted = [...items].sort((a, b) => b.score - a.score);
  return {
    source, provider, note,
    total: items.length,
    overall: { score: Number(avg.toFixed(3)), label: overallLabel },
    breakdown,
    mostPositive: sorted[0]?.score > 0 ? sorted[0] : null,
    mostNegative: sorted[sorted.length - 1]?.score < 0 ? sorted[sorted.length - 1] : null,
    items,
  };
}

function empty(note) {
  return {
    source: 'mock', provider: '—', note, total: 0,
    overall: { score: 0, label: NEU.label },
    breakdown: { positivo: 0, neutro: 0, negativo: 0 },
    mostPositive: null, mostNegative: null, items: [],
  };
}
