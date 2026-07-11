# 📊 Marketing Intelligence Dashboard

Dashboard web que reúne **cuatro fuentes de inteligencia de mercado** en una sola
vista. Ingresas una palabra clave y obtienes:

| Sección | Fuente | Qué muestra |
|---|---|---|
| 🔍 **Tendencias de búsqueda** | Google Trends | Interés en el tiempo + búsquedas relacionadas (donut) |
| 📰 **Noticias del sector** | NewsAPI | Últimos artículos sobre el término |
| 💬 **Temas más comentados** | Reddit | Publicaciones ordenadas por número de comentarios |
| ▶️ **Videos más populares** | YouTube Data API | Videos ordenados por visualizaciones |

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
| `YOUTUBE_API_KEY` | https://console.cloud.google.com → *YouTube Data API v3* | Activa la API y crea una clave |
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | https://www.reddit.com/prefs/apps → app tipo *script* | Opcional: sin ellas se usa el endpoint público `.json` |
| *Google Trends* | — | No requiere clave (vía `google-trends-api`) |

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
| YouTube | YouTube Data API *(requiere clave)* | — | Demo |

Así el dashboard muestra **datos reales sin ninguna API key** en tres de las
cuatro secciones (solo YouTube requiere clave). Cada panel indica su fuente
real: `● Google Trends`, `● Wikipedia`, `● NewsAPI`, `● Google News`, etc.

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/all?keyword=&geo=&region=` | Las cuatro fuentes en una sola respuesta |
| `GET` | `/api/trends?keyword=&geo=` | Google Trends |
| `GET` | `/api/news?keyword=&lang=` | NewsAPI |
| `GET` | `/api/reddit?keyword=` | Reddit |
| `GET` | `/api/youtube?keyword=&region=` | YouTube |
| `GET` | `/api/status` | Qué APIs tienen credenciales configuradas |

---

## 📁 Estructura

```
server.js              Servidor Express + carga de .env + rutas
src/providers/         Un módulo por fuente (live + fallback demo)
src/util/mock.js       PRNG determinista para datos de demostración
public/                Frontend (index.html, styles.css, app.js)
.env.example           Plantilla de variables de entorno
```
