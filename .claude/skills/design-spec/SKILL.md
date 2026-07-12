---
name: design-spec
description: Diseña un archivo de especificación desde el punto de vista del usuario. Úsalo DESPUÉS de tener claridad del problema y del enfoque (típicamente tras brainstorming), cuando el usuario diga "design-spec", "especificación", "spec", "documenta lo que vamos a hacer" o pida un documento de diseño antes de implementar. Produce un documento en docs/specs/YYYY-MM-DD-title.md con seis secciones fijas. NO escribe código de la feature en esta fase.
---

# design-spec — especificación desde el punto de vista del usuario

Objetivo: convertir un objetivo ya acordado en un **documento de especificación**
centrado en el usuario, no en la implementación. **No escribas código de la feature
aquí.** El foco es *qué* experimenta el usuario y *por qué*, no *cómo* se programa.

## Cuándo usarlo

Solo cuando el problema y el enfoque ya están claros (normalmente después de
`brainstorming`). Si el objetivo todavía es ambiguo, vuelve a brainstorming primero.

## 1. Reúne el contexto

Lee `CLAUDE.md` (propósito, principios fijos, hoja de ruta) y recupera lo acordado:
el problema, el alcance elegido y el enfoque. No re-preguntes lo que ya se decidió.
Si falta un dato que cambia la spec, pregúntalo antes de escribir (usa
AskUserQuestion), pero no interrogues por interrogar.

## 2. Escribe el documento

Ruta y nombre: **`docs/specs/YYYY-MM-DD-title.md`** (fecha de hoy, `title` en
kebab-case y en el idioma del proyecto). Estructura fija, en este orden:

1. **Overview** — qué es y qué resuelve, en 2–4 líneas.
2. **Usuarios objetivo** — quién lo usa y qué necesita de esto.
3. **Contexto del problema** — por qué hace falta ahora; el estado actual y su dolor.
4. **Alcance v1** — qué entra y, explícito, qué queda **fuera** (para no sobre-construir).
5. **Comportamiento esperado** — qué ve y hace el usuario paso a paso; criterio
   observable de "listo".
6. **Posibles errores y mitigaciones** — casos borde (vacío, sin red, sin resultados,
   fallos de fuente) y cómo el sistema los maneja de cara al usuario.

## 3. Reglas de contenido

- Escribe desde el **punto de vista del usuario**: comportamiento y valor, no diseño
  técnico interno. Menciona restricciones técnicas solo si afectan lo que el usuario
  percibe.
- Sé concreto y observable: cada afirmación de "Comportamiento esperado" debería
  poder verificarse mirando la app.
- Respeta los principios fijos del proyecto (funciona sin API keys, sin librerías de
  gráficos, claves solo en backend). Si algo los tensiona, dilo en la spec.
- Breve y sin relleno. Mejor una tabla o lista clara que párrafos largos.

## 4. Approval gate (iterar o aprobar)

Al terminar: resume en 2–3 líneas lo que quedó especificado y comparte la ruta del
documento. Luego **detente en una compuerta de aprobación** — pregunta explícitamente
(idealmente con AskUserQuestion) entre dos caminos:

- **Iterar la spec** — el usuario pide cambios (alcance, comportamiento, casos borde).
  Aplícalos sobre el mismo documento y vuelve a esta compuerta. Repite hasta que
  apruebe. No avances mientras haya cambios pendientes.
- **Aprobar y continuar** — el usuario da el visto bueno. Marca la spec como aprobada
  (estado en el encabezado del documento) y encadena con el skill **`design-plan`**
  para generar el plan de implementación.

No implementes la feature ni pases a `design-plan` hasta que la spec esté **aprobada**
en esta compuerta.

## Estilo

- Documento y chat en **español (es-PE)**. Conciso, directo, sin relleno.
