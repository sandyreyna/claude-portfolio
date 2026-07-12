# Plan de implementación — Despliegue público del dashboard en Render

- **Fecha:** 2026-07-12
- **Estado:** aprobado (2026-07-12)
- **Rama de trabajo:** `claude/project-implementation-dpw8gf`

---

## 1. Objetivo

Dejar el **Marketing Intelligence Dashboard** listo para publicarse en Render como
Web Service Node nativo, arrancando keyless. Al terminar el plan, un `git push`
conectado a Render debe producir una **URL pública** funcional, sin cambiar el
comportamiento de la app.

## 2. Contexto del problema

Hoy la app solo corre en `localhost:3000` y no cumple la meta de `CLAUDE.md` (URL
pública, un solo dashboard, sin auth). Falta la configuración que le diga a Render
cómo instalar, arrancar y vigilar la app, más un endpoint de salud para que no la
reinicie por error. El proyecto ya funciona sin claves (fallbacks keyless por panel),
así que puede salir a producción con datos reales sin bloquear el lanzamiento.

## 3. Spec de referencia

- **Spec:** `docs/specs/2026-07-12-despliegue-publico-render.md` — **aprobada 2026-07-12**.
- El plan cumple el "Alcance v1" de esa spec (ni menos, ni de más).

## 4. Lista de tareas a implementar

### Tarea 1 — Endpoint de salud `/healthz`

- **Qué / para qué:** agregar una ruta liviana que responda `200` con un JSON mínimo,
  para que el health check de Render confirme que la app está viva y no la reinicie
  por error (Comportamiento esperado §5, Mitigaciones "health check").
- **Dónde:** `server.js`, junto a las rutas `/api/*` (antes de `app.listen`). No toca
  proveedores ni frontend.
- **Cómo se verifica:** `curl -s http://localhost:3000/healthz` devuelve `200` y un
  cuerpo tipo `{"status":"ok"}` sin depender de fuentes externas.
- **Orden:** primera; el `render.yaml` la referencia.

### Tarea 2 — Blueprint `render.yaml`

- **Qué / para qué:** declarar el Web Service para que Render despliegue desde el repo
  sin configuración manual (Alcance v1: "config de despliegue para Render").
- **Dónde:** nuevo archivo `render.yaml` en la raíz. Contenido:
  - `type: web`, `env: node`, `plan: free`.
  - `buildCommand: npm install`, `startCommand: npm start`.
  - `healthCheckPath: /healthz`.
  - `envVars` declaradas **opcionales** (`sync: false`) para `NEWS_API_KEY`,
    `YOUTUBE_API_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `HF_TOKEN` — se
    llenan luego desde el panel sin redeploy manual.
- **Cómo se verifica:** el YAML es válido y sus comandos coinciden con `package.json`
  (`start` → `node server.js`); `server.js` ya respeta `process.env.PORT` (revisado,
  línea 37). No requiere Docker.
- **Dependencias:** usa `/healthz` de la Tarea 1.

### Tarea 3 — Sección "Desplegar en Render" en el README

- **Qué / para qué:** documentar el paso a paso de publicación y cómo agregar keys
  después (Alcance v1: "documentación breve").
- **Dónde:** `README.md`, sección nueva. Cubre: conectar el repo en Render (usa el
  Blueprint automáticamente), que keyless funciona sin tocar nada, dónde poner las
  variables de entorno después, y la nota del cold start del free tier.
- **Cómo se verifica:** el README explica el flujo de forma que alguien externo pueda
  desplegar sin preguntar; rutas y nombres de variables coinciden con `render.yaml` y
  `.env.example`.
- **Dependencias:** refleja lo definido en la Tarea 2.

### Tarea 4 — Commit y push a la rama de feature

- **Qué / para qué:** publicar los cambios en `claude/project-implementation-dpw8gf`
  para que Render pueda conectarse al repo.
- **Dónde:** git (sin PR salvo que se pida). Mensaje en inglés, imperativo.
- **Cómo se verifica:** `git status` limpio y la rama remota actualizada.
- **Orden:** última.

### Verificación posterior (fuera del plan, con `verify-after-changes`)

- Levantar el servidor y confirmar `/healthz` y el flujo del dashboard en navegador
  real (5 casos). Recordatorio: en el sandbox el egress cae a demo por diseño; la
  validación de **datos en vivo** se hace contra la URL real de Render.

---

**Nota de alcance:** ninguna tarea toca la lógica de los proveedores ni el diseño del
frontend. Todo es config de despliegue + un endpoint de salud, alineado con los
principios fijos (funciona sin keys, sin librerías de gráficos, claves solo en backend).
