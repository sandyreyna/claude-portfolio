# CLAUDE.md — Memoria del proyecto

Guía para Claude al trabajar en este repositorio. Léela antes de hacer cambios.

## Qué es

**Marketing Intelligence Dashboard**: una app web donde, al ingresar una palabra
clave, se ven en una sola vista:

1. **Tendencias de búsqueda**
2. **Noticias del sector**
3. **Temas más comentados**
4. **Videos más populares**
5. **Sentimiento del mercado** (añadido; interpreta los titulares/hilos)

Objetivo: un **dashboard público de marketing intelligence** desplegado en una
**URL pública** (un solo dashboard, sin cuentas de usuario por ahora).

## Stack

- **Backend:** Node.js + Express (`server.js`), ESM (`"type": "module"`). Node ≥ 18.
- **Frontend:** HTML/CSS/JS vanilla en `public/` (sin framework actualmente).
  Gráficos dibujados a mano en SVG.
- **Dependencias:** `express`, `google-trends-api`. Sin librerías de gráficos.
- **UI en español (es-PE).**

## Estructura

```
server.js                 Servidor Express: carga .env, sirve public/, rutas /api/*
src/providers/            Un módulo por fuente, cada uno con su cadena de fallback
  trends.js  news.js  reddit.js  youtube.js  sentiment.js  wikipedia.js
src/util/mock.js          PRNG determinista para datos demo
public/                   index.html, styles.css, app.js (dashboard)
.claude/skills/           Skills del proyecto (ver "QA")
.env.example              Plantilla de claves (todas opcionales)
```

Endpoints: `/api/all`, `/api/trends`, `/api/news`, `/api/reddit`, `/api/youtube`,
`/api/status`.

## Comandos

```bash
npm install
npm start        # → http://localhost:3000
npm run dev      # con --watch
```

## Variables de entorno (`.env`, todas opcionales)

`NEWS_API_KEY`, `YOUTUBE_API_KEY`, `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET`,
`HF_TOKEN`, `PORT`. Google Trends no necesita clave. **`.env` no se versiona.**

## Arquitectura y flujo de datos

El backend actúa de **proxy**: recibe la keyword, llama a cada fuente y devuelve
JSON al frontend. Cada proveedor implementa una **cadena de fallback**:

| Panel | 1º Principal | 2º Sin clave | 3º |
|---|---|---|---|
| Tendencias | Google Trends | Wikipedia Pageviews | Demo |
| Noticias | NewsAPI | Google News RSS | Demo |
| Reddit | Reddit OAuth | Reddit público `.json` | Demo |
| Videos | YouTube Data API | Piped / Invidious | Demo |
| Sentimiento | Hugging Face (modelo) | Léxico local ES/EN | Demo |

Cada panel muestra un badge con su fuente real (`● en vivo` con el nombre, o
`◐ demo`). Los datos "demo" son texto real en español, **no** son relleno.

## Principios de diseño (NO romper)

1. **Funciona sin API keys.** Mantén siempre una fuente de respaldo *keyless* por
   panel para que el dashboard muestre datos reales sin configurar nada. No
   introduzcas una dependencia dura de una clave.
2. **Sin librerías de gráficos en el navegador.** Todo gráfico se dibuja a mano en
   SVG (nada de Chart.js, D3, Recharts, etc.).
3. **Claves solo en el backend.** Las API keys nunca llegan al navegador; todo
   pasa por el proxy de Express. No expongas secretos en `public/`.

> El frontend hoy es vanilla (sin framework) y de una sola página; es el estado
> actual, no una regla rígida. Si algún cambio grande justifica un framework,
> proponlo antes.

## Convenciones

- **Idioma:** respuestas de chat en **español (es-PE)**. Comentarios de código en
  **español** (consistente con el código existente). Mensajes de commit y de PR
  en **inglés**, modo imperativo.
- **Ramas/commits:** desarrolla en una rama de feature; no hagas push a `main`
  directo. Commits pequeños y descriptivos.
- **Estilo:** sigue el estilo del archivo que editas (misma densidad de
  comentarios, nombres e idioms).

## Skills del proyecto

En `.claude/skills/`:

- **`brainstorming`** — al **iniciar un feature nuevo**. Hace preguntas para
  eliminar la ambigüedad del objetivo y termina presentando **2–3 enfoques** con
  sus tradeoffs para que el usuario elija cómo armar el plan. No implementa nada
  en esta fase.
- **`revision-final`** — QA del sitio antes de publicar (móvil, botones/enlaces,
  sin relleno, imágenes) con navegador real; entrega una lista priorizada y no
  arregla nada hasta aprobación.

## QA / Verificación

- No hay framework de tests formal. Las funciones puras (parsers de RSS, Piped,
  Invidious) se validan con scripts `node` ad-hoc; las cadenas de fallback deben
  degradar sin romperse.
- Verifica los cambios **corriendo la app** y, para UI, con un navegador real
  (Playwright). Existe un skill de proyecto **`revision-final`**
  (`.claude/skills/revision-final/`) que revisa el sitio contra un checklist
  (móvil, botones/enlaces, sin relleno, imágenes) y entrega una lista priorizada
  **sin arreglar nada hasta aprobación**.

## Despliegue

Meta: **URL pública, un solo dashboard, sin autenticación.**
- Requiere un runtime Node (Express) — un host solo-estático no sirve; usa
  Render / Railway / Fly / un VPS, o adapta a funciones serverless.
- Configura las claves como variables de entorno en el host (no en el repo).
- Sin claves, el sitio igual funciona con las fuentes keyless.

## Hoja de ruta

Dirección declarada por el dueño:
**Search Intelligence Platform → AI Visibility Dashboard.**
Evolucionar de "ver señales de búsqueda/medios" hacia una plataforma de
inteligencia de búsqueda y, luego, un panel de **visibilidad en IA** (medir cómo
aparece una marca/tema en respuestas de asistentes de IA). Confirmar el alcance
concreto de cada fase antes de construir.

## Notas del entorno (gotchas)

- En el **sandbox de Claude Code (web)** la red de egress bloquea las fuentes
  externas (Google, NewsAPI, Reddit, YouTube frontends, Hugging Face). Ahí el
  dashboard cae a **demo**; en una máquina/hosting normal funciona en vivo. No lo
  confundas con un bug del código.
- El servidor escucha en el puerto `3000` (o `PORT`).
