// revision-final — verificación automatizada del sitio con navegador real.
// Uso: node check.mjs [baseUrl] [keyword]
//   baseUrl  por defecto http://localhost:3000
//   keyword  término para poblar el dashboard (por defecto "martech")
// Imprime un JSON con los hallazgos por cada punto del checklist.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] || process.env.REVISION_URL || 'http://localhost:3000';
const KEYWORD = process.argv[3] || 'martech';
const OUT_DIR = new URL('./', import.meta.url).pathname;

// Chromium: usa el del entorno si existe, si no el que trae Playwright.
const EXE = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const launchOpts = fs.existsSync(EXE) ? { executablePath: EXE } : {};

const FILLER = /lorem ipsum|dolor sit amet|consectetur adipiscing|text here|your text|placeholder text|insert text|xxxx+|todo:|tbd\b|coming soon|próximamente|contenido de ejemplo aquí/i;

const report = { baseUrl: BASE, keyword: KEYWORD, when: new Date().toISOString(), checks: {} };

async function populate(page) {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#keyword', KEYWORD).catch(() => {});
  await page.click('#searchBtn').catch(() => {});
  // Espera a que aparezca contenido de algún panel.
  await page.waitForSelector('.video-card, .senti-bar, .news-item, .reddit-item', { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(600);
}

const browser = await chromium.launch(launchOpts);
try {
  // ── 1) MÓVIL: sin desbordamiento horizontal, contenido visible ──
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await populate(page);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const panels = await page.$$eval('.panel', (els) => els.length);
    await page.screenshot({ path: OUT_DIR + 'shot-mobile.png', fullPage: true });
    report.checks.mobile = {
      horizontalOverflowPx: overflow,
      hasHorizontalScroll: overflow > 1,
      panelsRendered: panels,
      screenshot: 'shot-mobile.png',
    };
    await ctx.close();
  }

  // ── Desktop: base para el resto de checks ──
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await populate(page);
  await page.screenshot({ path: OUT_DIR + 'shot-desktop.png', fullPage: true });

  // ── 2) BOTONES / ENLACES: destino válido + interacciones funcionan ──
  const links = await page.$$eval('a', (as) => as.map((a) => ({
    href: a.getAttribute('href'), text: (a.textContent || '').trim().slice(0, 70),
  })));
  const deadLinks = links.filter((l) => !l.href || l.href === '#' || l.href.startsWith('javascript:'));
  const externalLinks = links.filter((l) => l.href && /^https?:/.test(l.href));

  // Interacciones reales
  const interactions = {};
  // Tema
  const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
  await page.click('#themeBtn').catch(() => {});
  await page.waitForTimeout(200);
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
  interactions.themeToggleWorks = themeBefore !== themeAfter;
  // Búsqueda produjo resultados
  interactions.searchProducesResults = await page.$$eval('.video-card, .news-item, .reddit-item', (e) => e.length > 0);

  report.checks.buttons = {
    totalLinks: links.length,
    externalLinks: externalLinks.length,
    deadLinks: deadLinks.map((l) => l.text || '(sin texto)'),
    deadLinkCount: deadLinks.length,
    interactions,
    consoleErrors,
  };

  // ── 3) TEXTOS DE RELLENO ──
  const bodyText = await page.evaluate(() => document.body.innerText);
  const fillerHit = bodyText.match(FILLER);
  report.checks.filler = {
    loremIpsumFound: Boolean(fillerHit),
    match: fillerHit ? fillerHit[0] : null,
  };

  // ── 4) IMÁGENES CARGAN ──
  const imgs = await page.$$eval('img', (els) => els.map((i) => ({
    src: i.currentSrc || i.src, w: i.naturalWidth, complete: i.complete,
  })));
  const broken = imgs.filter((i) => i.complete && i.w === 0);
  const sameOrigin = (u) => { try { return new URL(u).origin === new URL(location.href).origin; } catch { return false; } };
  report.checks.images = {
    total: imgs.length,
    brokenCount: broken.length,
    broken: broken.map((i) => ({ src: i.src, external: !i.src.includes('localhost') && !i.src.startsWith('data:') })),
  };

  // ── 5) TONO: sólo si existe una guía de tono en el proyecto ──
  const toneFile = ['TONE.md', 'tone.md', '.claude/TONE.md'].map((f) => OUT_DIR + '../../../' + f)
    .find((f) => fs.existsSync(f));
  report.checks.tone = { enabled: Boolean(toneFile), reference: toneFile ? toneFile : 'omitido (no hay TONE.md)' };

  await ctx.close();
} finally {
  await browser.close();
}

fs.writeFileSync(OUT_DIR + 'last-run.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
