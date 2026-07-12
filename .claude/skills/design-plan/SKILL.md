---
name: design-plan
description: Genera el plan de implementación a partir de un spec ya APROBADO. Úsalo después de que el usuario apruebe la spec (design-spec), o cuando diga "design-plan", "arma el plan", "genera el plan de implementación". Guarda el plan en docs/plans/YYYY-MM-DD-title.md con objetivo, contexto, spec de referencia y la lista detallada de tareas a implementar. NO escribe código de la feature en esta fase.
---

# design-plan — plan de implementación desde un spec aprobado

Objetivo: convertir un spec **ya aprobado** en un plan de implementación accionable y
detallado. **No escribas código de la feature aquí.** El plan es el puente entre el
"qué" (spec) y el "cómo se construye", listo para ejecutarse tarea por tarea.

## Cuándo usarlo

Solo **después de que el usuario apruebe la spec** correspondiente en `docs/specs/`.
Si la spec aún no está aprobada, vuelve a `design-spec` y pasa por su approval gate
primero. No planees sobre un objetivo que todavía se está iterando.

## 1. Parte del spec aprobado

Localiza y lee el spec aprobado en `docs/specs/YYYY-MM-DD-title.md`. Lee también
`CLAUDE.md` (principios fijos, estructura, convenciones). El plan debe cumplir el
"Alcance v1" del spec — ni menos, ni de más.

## 2. Escribe el documento

Ruta y nombre: **`docs/plans/YYYY-MM-DD-title.md`** (fecha de hoy; `title` en
kebab-case, normalmente el mismo del spec). Estructura fija, en este orden:

1. **Objetivo** — qué se logra al terminar el plan, en 2–3 líneas.
2. **Contexto del problema** — por qué se hace y el estado actual; resumido del spec.
3. **Spec de referencia** — enlace/ruta al spec aprobado y su fecha, para trazabilidad.
4. **Lista de tareas a implementar** — pasos ordenados y detallados. Por cada tarea:
   - **Qué** se hace y **para qué** (a qué parte del comportamiento esperado responde).
   - **Dónde:** archivos concretos (`server.js`, `src/providers/…`, `public/…`,
     config nueva).
   - **Cómo se verifica** que esa tarea quedó (criterio observable).
   - **Dependencias / orden** respecto a otras tareas, si aplica.

## 3. Reglas de contenido

- Cada tarea debe ser **accionable y verificable**: quien la ejecute sabe qué tocar y
  cómo saber que terminó.
- Respeta los principios fijos (funciona sin API keys, sin librerías de gráficos,
  claves solo en backend) y la convención de ramas/commits del proyecto.
- No amplíes el alcance más allá del spec. Si al planear detectas un vacío en el spec,
  dilo y sugiere volver a `design-spec`, no lo resuelvas inventando alcance.
- Breve y sin relleno; listas y tablas antes que párrafos largos.

## 4. Handoff

Al terminar: resume el plan en 2–3 líneas, comparte la ruta del documento y pregunta
si se aprueba para empezar a implementar. Tras implementar, el flujo natural es correr
`verify-after-changes`. No implementes hasta que el plan esté aprobado.

## Estilo

- Documento y chat en **español (es-PE)**. Conciso, directo, sin relleno.
