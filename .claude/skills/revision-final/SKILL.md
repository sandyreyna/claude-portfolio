---
name: revision-final
description: Revisión final de calidad del sitio (dashboard en localhost:3000) antes de publicar. Úsalo cuando el usuario diga "revisión final", "revisa el sitio", "revision-final" o pida un chequeo del sitio completo contra el checklist de QA. Verifica en un navegador real (Playwright): (1) se ve bien en móvil, (2) los botones/enlaces llevan a donde deben, (3) no hay textos de relleno tipo "lorem ipsum", (4) las imágenes cargan. Entrega una lista de problemas priorizada y NO arregla nada hasta que el usuario apruebe.
---

# revisión-final — QA del sitio antes de publicar

Revisa el dashboard contra un checklist de calidad usando un navegador real y
entrega una **lista de problemas priorizada**. **Regla de oro: NO arreglar nada
hasta que el usuario apruebe explícitamente.** Este skill solo diagnostica.

## Checklist

1. **Móvil** — se ve bien en pantalla de teléfono (sin scroll horizontal, paneles visibles).
2. **Botones/enlaces** — todos llevan a donde deben (sin `href="#"`, sin enlaces muertos; búsqueda y tema funcionan).
3. **Sin relleno** — no hay textos tipo "lorem ipsum" ni placeholders.
4. **Imágenes** — todas cargan (sin imágenes rotas).
5. **Tono** — *omitido por ahora.* Se activa automáticamente solo si existe un archivo `TONE.md` en la raíz del proyecto.

## Procedimiento

### 1. Preparar el entorno
- Asegúrate de que Playwright esté disponible:
  `npm ls playwright >/dev/null 2>&1 || npm install --no-save playwright`
  (en máquina local puede requerir además `npx playwright install chromium`).
- Arranca el sitio si no está corriendo (en segundo plano):
  `npm start` y espera a que responda `http://localhost:3000`
  (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`).

### 2. Ejecutar la verificación automatizada
- Corre el script incluido:
  `node .claude/skills/revision-final/check.mjs http://localhost:3000 martech`
- Produce un JSON (`checks.mobile/buttons/filler/images/tone`) y capturas
  `shot-mobile.png` y `shot-desktop.png` dentro de la carpeta del skill.
- **Revisa tú mismo las capturas** (Read sobre los PNG) para juzgar la
  apariencia móvil y detectar problemas visuales que el JSON no captura
  (solapamientos, texto cortado, contraste).

### 3. Interpretar y priorizar
Convierte los hallazgos en una lista con severidades:
- **Crítico** — rompe el uso: móvil con scroll horizontal, botón principal sin efecto, error de consola que impide el render.
- **Alto** — enlaces muertos (`href="#"`) que el usuario esperaría que funcionen, imágenes rotas del propio sitio (mismo origen), lorem ipsum visible.
- **Medio** — imágenes externas que no cargan, detalles de layout móvil menores.
- **Bajo** — mejoras cosméticas, sugerencias.

> **Matices importantes para no dar falsos positivos** (el sitio puede estar en
> modo *demo* cuando no hay claves de API o cuando la red del entorno bloquea
> las fuentes externas):
> - **Enlaces `#` en modo demo:** las tarjetas de Noticias, Reddit y Videos usan
>   `href="#"` **a propósito** cuando los datos son demo (no hay artículo real al
>   que apuntar). Con datos en vivo llevan URLs reales. NO los marques como
>   Crítico/Alto; anótalo como **"verificar con datos en vivo"**. Comprueba en
>   el badge del panel si dice `demo` o una fuente en vivo antes de juzgar.
> - **Imágenes ausentes en modo demo:** con datos demo puede haber **0 `<img>`**
>   (las miniaturas son placeholders con emoji/gradiente por diseño). "0 imágenes"
>   aquí no es un fallo; re-verifica la carga de imágenes con datos en vivo.
> - **Imágenes externas bloqueadas:** en el sandbox de Claude Code las imágenes
>   externas pueden no cargar por política de red aunque en local sí. Márcalo
>   **Medio** con la nota "posible bloqueo de red; verificar en local".
> - **Texto demo/mock:** es texto real en español, no relleno "lorem ipsum". No
>   lo marques en el punto 3; si acaso, menciónalo como nota informativa aparte.
>
> Para un veredicto fiable de los puntos 2 y 4, corre la revisión con datos en
> vivo (claves en `.env`) o al menos aclara en el reporte qué hallazgos son
> artefactos del modo demo.

### 4. Entregar
- Muestra la lista priorizada **en el chat** (agrupada por severidad, con
  ubicación de cada problema: archivo/selector/panel).
- Escribe también un reporte en `revision-final-report.md` en la raíz del
  proyecto (fecha, checklist con ✅/⚠️/❌ por punto, y la tabla priorizada).
- Termina con una línea clara: **"No arreglaré nada hasta que apruebes. ¿Con
  cuáles avanzo?"**

### 5. Al aprobar (solo entonces)
- Cuando el usuario apruebe (total o parcialmente), aplica **solo** los arreglos
  aprobados, y vuelve a correr el script para confirmar que quedaron resueltos.

### 6. Limpieza
- Detén el servidor que arrancaste en segundo plano al terminar.
- Las capturas y `last-run.json` quedan en la carpeta del skill (no las
  commitees salvo que el usuario lo pida).
