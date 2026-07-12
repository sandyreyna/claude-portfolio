# Especificación — Despliegue público del dashboard en Render

- **Fecha:** 2026-07-12
- **Estado:** aprobada (2026-07-12)
- **Enfoque acordado:** Render (Web Service Node nativo), keyless de arranque

---

## 1. Overview

Publicar el **Marketing Intelligence Dashboard** existente en una **URL pública**
accesible para cualquiera, sin autenticación y sin cuentas de usuario. La app ya
está construida y funciona en local; esta fase solo la lleva a producción en Render,
arrancando con las fuentes de datos que no requieren API keys. El código de la app no
cambia: se agrega configuración de despliegue y un pequeño *hardening* de producción.

## 2. Usuarios objetivo

| Usuario | Qué necesita de esto |
|---|---|
| **Visitante público** (marketer, analista, curioso) | Abrir una URL, escribir una palabra clave y ver al instante tendencias, noticias, temas comentados, videos y sentimiento del mercado — sin instalar ni configurar nada. |
| **Dueño del dashboard** | Tener el sitio en línea de forma estable, con la opción de conectar API keys más adelante desde el panel del host, sin volver a tocar el código. |

No hay roles, login ni datos por usuario: es **un solo dashboard público**.

## 3. Contexto del problema

Hoy el dashboard solo corre en `localhost:3000`: nadie más puede verlo y no cumple la
meta declarada en `CLAUDE.md` (*URL pública, un solo dashboard, sin autenticación*).
Para publicarlo se necesita un runtime Node real (Express) — un host solo-estático no
sirve. Falta la configuración que le diga al host cómo instalar, arrancar y vigilar la
app, además de una forma de confirmar que sigue viva. El proyecto ya está diseñado
para **funcionar sin claves** (cada panel tiene un fallback keyless), así que puede
salir a producción con datos reales desde el día uno, sin bloquear el lanzamiento a la
espera de configurar APIs.

## 4. Alcance v1

**Dentro:**

- Configuración de despliegue para Render (Blueprint `render.yaml`): entorno Node,
  build `npm install`, arranque `npm start`, health check.
- Endpoint de salud liviano para que Render sepa que la app está viva.
- Variables de entorno de las APIs declaradas como **opcionales** en la config, para
  llenarlas después desde el panel de Render sin redeploy manual.
- Documentación breve en el README: cómo conectar el repo y desplegar, y cómo agregar
  claves más tarde.
- Arranque **keyless**: el sitio muestra datos reales vía Google Trends, Google News
  RSS, Reddit público, Piped/Invidious y léxico local; cada panel indica su fuente
  (`● en vivo` / `◐ demo`).

**Fuera (no en v1):**

- Autenticación, cuentas o multi-tenant.
- Configurar las API keys de pago (NewsAPI, YouTube, Reddit OAuth, Hugging Face) — se
  hará después, cuando el dueño las tenga.
- Dominio personalizado / DNS propio (se usa la URL `*.onrender.com`).
- Cambios de funcionalidad o rediseño del dashboard.
- CI/CD avanzado, staging, o monitoreo/alertas externas.

## 5. Comportamiento esperado

1. El dueño conecta el repositorio en Render; Render lee `render.yaml`, instala
   dependencias y arranca la app con `npm start`.
2. Render asigna una **URL pública** (`https://<nombre>.onrender.com`). La app escucha
   en el puerto que Render inyecta (`PORT`), no en uno fijo.
3. Un visitante abre esa URL y ve el dashboard cargado con una palabra clave por
   defecto; escribe una nueva keyword, pulsa **Analizar** y los cinco paneles se
   actualizan.
4. Cada panel muestra su **badge de fuente real**: en producción keyless, Google
   Trends suele salir `● en vivo` y el resto según disponibilidad de red del host;
   ningún panel queda en blanco (siempre degrada a demo con texto real en español).
5. Render consulta periódicamente el **health check** y mantiene la app corriendo; un
   reinicio no rompe la URL.

**Criterio observable de "listo":** al abrir la URL pública desde un dispositivo
cualquiera (incluido móvil), el dashboard carga, una búsqueda devuelve resultados en
los cinco paneles, y cada panel muestra su badge de fuente. La verificación de datos
en vivo se hace **contra la URL real de Render**, no desde el sandbox (cuyo egress está
bloqueado y por diseño cae a demo).

## 6. Posibles errores y mitigaciones

| Situación | Qué percibe el usuario / cómo se maneja |
|---|---|
| **Una fuente externa falla o va lenta** (Trends, News RSS, Reddit, video, sentimiento) | El panel degrada a su fallback keyless y, en última instancia, a demo con texto real; el badge lo refleja. Nunca se rompe la vista. |
| **Keyword vacía** | El backend responde `400` con un mensaje claro; el frontend no dispara la búsqueda con entrada vacía. |
| **Sin resultados para la keyword** | El panel muestra su estado vacío/demo en vez de quedarse en blanco. |
| **App dormida (cold start del free tier)** | El primer request tras inactividad tarda ~30 s mientras Render la despierta; luego responde normal. Mitigación futura: plan de pago o un ping periódico (fuera de v1). |
| **Health check falla / arranque roto** | Render reintenta el deploy y no promueve la versión rota; la URL sigue sirviendo la versión anterior estable. |
| **API key inválida o ausente en el host** | La fuente cae a su ruta keyless sin tumbar el panel; agregar/corregir la clave en el panel de Render y redeploy la reactiva. |
| **Egress bloqueado en el entorno de build/sandbox** | Comportamiento esperado, no un bug: se cae a demo. La validación real se hace contra la URL pública de Render. |
