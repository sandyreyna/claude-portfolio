# 📊 Marketing Intelligence Dashboard

Dashboard web que reúne **cuatro fuentes de inteligencia de mercado** en una sola
vista. Ingresas una palabra clave y obtienes:

| Sección | Fuente | Qué muestra |
|---|---|---|
| 🔍 **Tendencias de búsqueda** | Google Trends | Interés en el tiempo + búsquedas relacionadas (donut) |
| 📰 **Noticias del sector** | NewsAPI | Últimos artículos sobre el término |
| 💬 **Temas más comentados** | Reddit | Publicaciones ordenadas por número de comentarios |
| ▶️ **Videos más populares** | YouTube Data API | Videos ordenados por visualizaciones |
| 😊 **Sentimiento del mercado** | Hugging Face | Ánimo (positivo/neutro/negativo) sobre titulares y hilos |

Diseño responsive, modo claro/oscuro y gráficos dibujados en SVG nativo
(sin librerías de terceros en el navegador).

> **Funciona sin configuración.** Si no defines claves de API, el dashboard
> muestra **datos de demostración** realistas para que puedas ver la interfaz
> completa. Cada panel indica si los datos son `● en vivo` o `◐ demo`.

---

## 🚀 Puesta en marcha

```bash
npm install
cp .env.example .env      # opcional: agrega tus claves
npm start
```

Abre **http://localhost:3000**, escribe una palabra (ej. `martech`), elige la
región y pulsa **Analizar**.

---

## 🔑 Claves de API (para datos en vivo)

Todas son opcionales y con planes gratuitos. Colócalas en `.env`:

| Variable | Dónde obtenerla | Notas |
|---|---|---|
| `NEWS_API_KEY` | https://newsapi.org/register | Plan Developer gratuito |
| `YOUTUBE_API_KEY` | https://console.cloud.google.com → *YouTube Data API v3* | Opcional: sin ella se usan Piped/Invidious (frontends abiertos) |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | https://www.reddit.com/prefs/apps → app tipo *script* | Opcional: sin ellas se usa el endpoint público `.json` |
| `HF_TOKEN` | https://huggingface.co/settings/tokens | Opcional: sin él se usa un léxico local para el sentimiento |
| *Google Trends* | — | No requiere clave (vía `google-trends-api`) |

---

## ☁️ Desplegar en Render

El repo incluye un **Blueprint** (`render.yaml`) para publicarlo como Web Service
Node nativo (sin Docker), con una **URL pública** y sin autenticación.

1. En [Render](https://render.com) → **New → Blueprint** y conecta este repositorio.
2. Render lee `render.yaml`, corre `npm install` y arranca con `npm start`; vigila la
   app en `/healthz`. Al terminar te da una URL `https://<nombre>.onrender.com`.
3. **Funciona sin claves:** en producción keyless, cada panel usa su fuente sin API
   key (Google Trends, Google News RSS, Reddit público, Piped/Invidious, léxico local).

### Agregar claves después (opcional, datos en vivo)

En el servicio → **Environment**, define las variables que quieras
(`NEWS_API_KEY`, `YOUTUBE_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`,
`HF_TOKEN`). Están declaradas en `render.yaml` como opcionales (`sync: false`), así
que **no** viven en el repo — se cargan a mano en el panel. Al guardarlas, Render
redeploya y esos paneles pasan a `● en vivo`.

> **Cold start (plan free):** tras ~15 min sin tráfico la app se duerme y el primer
> request tarda ~30 s en despertar. Se elimina con un plan de pago.

---

## 🏗️ Arquitectura

```
Navegador (public/)  ──►  Express (server.js)  ──►  APIs externas
   dashboard SPA          proxy + claves seguras     Trends/News/Reddit/YT
```

El backend actúa de **proxy**: las claves nunca llegan al navegador y se
resuelven los bloqueos de CORS de NewsAPI, Reddit y Google Trends. Cada
proveedor (`src/providers/*.js`) intenta una llamada en vivo y, si falla o no
hay clave, pasa a una alternativa y por último a datos demo deterministas.

### Cadena de fallback por fuente

| Sección | 1º (principal) | 2º (alternativa sin clave) | 3º |
|---|---|---|---|
| Tendencias | Google Trends | **Wikipedia Pageviews** | Demo |
| Noticias | NewsAPI *(con clave)* | **Google News RSS** | Demo |
| Reddit | Reddit OAuth *(con clave)* | Reddit público `.json` | Demo |
| YouTube | YouTube Data API *(con clave)* | **Piped / Invidious** (frontends abiertos) | Demo |
| Sentimiento | Hugging Face *(con `HF_TOKEN`)* | **Léxico local ES/EN** | Demo |

> **Sobre Hugging Face:** sus *datasets* son estáticos (no en tiempo real), así
> que no alimentan los paneles; lo que se usa es un **modelo** de sentimiento
> (`cardiffnlp/twitter-xlm-roberta-base-sentiment`) vía Inference API para
> *interpretar* los titulares y hilos que ya se obtienen en vivo. Sin token,
> un léxico local hace el mismo trabajo de forma aproximada y sin instalar nada.

Así el dashboard muestra **datos reales sin ninguna API key** en las cinco
secciones. Cada panel indica su fuente real: `● Google Trends`, `● Wikipedia`,
`● NewsAPI`, `● Google News`, `● Piped`, `● Léxico local`, etc.

> **Nota sobre Piped/Invidious:** son frontends abiertos de YouTube con
> instancias públicas que van y vienen; el proveedor prueba varias en paralelo
> y usa la primera que responde. Para máxima estabilidad, agrega tu
> `YOUTUBE_API_KEY` (oficial) y estos quedan solo como respaldo.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/all?keyword=&geo=&region=` | Las cuatro fuentes en una sola respuesta |
| `GET` | `/api/trends?keyword=&geo=` | Google Trends |
| `GET` | `/api/news?keyword=&lang=` | NewsAPI |
| `GET` | `/api/reddit?keyword=` | Reddit |
| `GET` | `/api/youtube?keyword=&region=` | YouTube |
| `GET` | `/api/status` | Qué APIs tienen credenciales configuradas |
| `GET` | `/healthz` | Health check del host (Render); `200` sin tocar fuentes externas |

---

## 📁 Estructura

```
server.js              Servidor Express + carga de .env + rutas
src/providers/         Un módulo por fuente (live + fallback demo)
src/util/mock.js       PRNG determinista para datos de demostración
public/                Frontend (index.html, styles.css, app.js)
.env.example           Plantilla de variables de entorno
```
