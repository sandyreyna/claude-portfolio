---
name: verify-after-changes
description: Verificación de una implementación ya terminada contra su plan y su spec. Úsalo cuando se considere que la implementación del plan está lista y toca probar los cambios, o cuando el usuario diga "verify-after-changes", "verifica los cambios", "prueba que funcione", "ya terminé, revisa". Levanta el servidor, elige 5 casos de prueba importantes y los prueba en el navegador real; recoge feedback, lo compara con el plan y el spec, y ARREGLA lo que falle o no alcance el objetivo, o da luz verde para terminar.
---

# verify-after-changes — probar lo implementado contra el plan y el spec

Objetivo: confirmar que la implementación **cumple el objetivo acordado** ejercitando
los cambios de punta a punta en un navegador real, no solo leyendo el diff. A
diferencia de `revision-final` (QA de calidad pre-publicación que NO arregla hasta
aprobación), aquí **sí se corrige** lo que falle contra el plan/spec.

## Cuándo usarlo

Cuando la implementación del plan se considera terminada y el foco pasa a **probar**.
Si el diff solo toca docs o config sin superficie ejecutable, no hace falta.

## 1. Recupera el objetivo

Lee el **spec** correspondiente en `docs/specs/` y el **plan** en `docs/plans/`
(mismo `YYYY-MM-DD-title`, generado por `design-plan`). Extrae de ahí
el criterio observable de "listo" y el "Comportamiento esperado". Vas a probar contra
eso, no contra una idea vaga.

## 2. Levanta el servidor

Arranca la app (`npm start`, o `npm run dev`) y confirma que responde en
`http://localhost:3000`. Si no levanta, ese es el primer fallo a arreglar antes de
seguir.

## 3. Elige 5 casos de prueba importantes

Selecciona **exactamente 5** casos que cubran lo que más importa del objetivo — no 5
triviales. Prioriza:

- El **flujo principal** (camino feliz del comportamiento esperado del spec).
- Al menos un **caso borde** de la sección "Posibles errores y mitigaciones"
  (keyword vacía, sin resultados, fuente caída, etc.).
- **Móvil** si el spec habla de responsive.
- Cualquier **riesgo específico** que el plan haya señalado.

Escríbelos antes de probar, para no improvisar.

## 4. Pruébalos en el navegador real

Usa un navegador real (Playwright con el Chromium preinstalado en
`/opt/pw-browsers/chromium`). Por cada caso: ejecuta la acción, observa el resultado,
captura pantalla si ayuda, y anota **console errors / pageerror**. Prueba
comportamiento observable, no solo que el endpoint responda 200.

> Nota de entorno: en el sandbox el egress está bloqueado y las fuentes caen a demo
> por diseño — no lo confundas con un bug. Verifica que la **degradación a demo** sea
> limpia; la validación de datos en vivo se hace contra el hosting real.

## 5. Recoge feedback y compáralo con plan + spec

Para cada caso, marca **pasa / falla / no alcanza**. "No alcanza" = funciona pero no
cumple el criterio del spec. Lista las diferencias concretas contra el
"Comportamiento esperado" y el "Alcance v1".

## 6. Arregla o da luz verde

- **Si algo falla o no alcanza:** arréglalo (cambios acotados, sin salirte del alcance
  v1), vuelve a levantar y re-prueba el caso afectado. Repite hasta cerrar.
- **Si un fallo implica cambiar el alcance o el spec:** no lo asumas — dilo y pregunta
  antes de expandir.
- **Si los 5 casos pasan y cumplen el spec:** da **luz verde**. Resume qué se probó,
  el resultado de cada caso, y qué quedó fuera de verificación (p. ej. datos en vivo).

## Estilo

- Chat en **español (es-PE)**. Concreto: reporta por caso, con evidencia (captura o
  error de consola), no en abstracto.
