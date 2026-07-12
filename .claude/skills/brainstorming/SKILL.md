---
name: brainstorming
description: Fase de descubrimiento al iniciar un feature nuevo. Úsalo cuando el usuario diga "brainstorming", "quiero un nuevo feature", "quiero agregar/crear una funcionalidad", "ayúdame a planear una idea" o describa una idea todavía ambigua. Primero hace preguntas para eliminar la ambigüedad del objetivo; al final presenta 2 o 3 enfoques (approaches) con sus tradeoffs para que el usuario decida cómo armar el plan. NO escribe código ni empieza a implementar en esta fase.
---

# brainstorming — descubrimiento antes de construir

Objetivo: convertir una idea vaga en un objetivo claro y ofrecer **2–3 enfoques**
para que el usuario elija. **No escribas código ni empieces a implementar aquí.**
Esta fase termina cuando el usuario elige un enfoque; recién entonces se planea.

## 1. Entiende antes de proponer

Lee primero `CLAUDE.md` (propósito, principios fijos, hoja de ruta) para que las
preguntas y los enfoques encajen con el proyecto. No repitas lo que ya está claro.

## 2. Haz preguntas para quitar la ambigüedad

Usa la herramienta **AskUserQuestion** (opciones concretas, no una a una: agrupa
2–4 por tanda). Cubre solo lo que sea ambiguo de estos ángulos:

- **Problema / valor:** ¿qué necesidad del usuario resuelve? ¿por qué ahora?
- **Alcance:** qué entra y qué queda **fuera** (para no sobre-construir).
- **Éxito:** ¿cómo se ve "listo"? criterio observable de que funciona.
- **Datos / fuentes:** ¿qué información necesita? ¿de dónde sale? (respeta la
  regla de *fallbacks sin API key* y *claves solo en backend*).
- **UX / entrada-salida:** ¿cómo lo dispara y ve el usuario? ¿nuevo panel, ruta,
  botón?
- **Restricciones:** rendimiento, privacidad, límites de API, tiempo.
- **Casos borde:** vacío, error de red, sin resultados.

Reglas de las preguntas:
- Pregunta solo lo que **cambia la decisión**; no interrogues por interrogar.
- Ofrece una opción recomendada cuando exista un default sensato.
- Si algo es razonable asumir, asúmelo y dilo, en vez de preguntar.

## 3. Refleja el objetivo

En 2–4 líneas, resume el problema y el alcance ya sin ambigüedad, y confírmalo:
*"Entonces buscamos X, para Y, sin incluir Z. ¿Correcto?"*

## 4. Presenta 2–3 enfoques

Ofrece **2 o 3** approaches claramente distintos (no variaciones triviales). Por
cada uno:

- **Nombre + idea en una línea.**
- **Cómo funciona** (a grandes rasgos: qué se toca en `server.js`, `src/providers/`,
  `public/`).
- **Pros / contras.**
- **Esfuerzo** (bajo / medio / alto) y **riesgo**.
- **Encaje con los principios fijos** del proyecto (sin API keys, sin librerías de
  gráficos, claves solo en backend) — marca si alguno los tensiona.

Cierra con una **recomendación** y una pregunta directa de elección (idealmente vía
AskUserQuestion): *"¿Con cuál avanzamos para armar el plan?"*

## 5. Handoff

Cuando el usuario elija:
- Resume el enfoque elegido y los siguientes pasos (aún sin implementar).
- Si el cambio es grande, ofrece pasar a un plan detallado antes de tocar código.
- No implementes hasta que el objetivo y el enfoque estén acordados.

## Estilo

- Chat en **español (es-PE)**. Sé concreto y breve; evita párrafos largos.
- Una idea ambigua no es permiso para asumir el alcance: pregunta lo esencial,
  pero tampoco satures — 1 o 2 tandas de preguntas suele bastar.
