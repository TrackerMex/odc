---
feature: "ui-design-tokens"
status: draft        # draft | approved
tags: [harness, spec, frontend, design-system, tokens]
---

# Diseño — [[ui-design-tokens]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Todo el cambio vive en la capa de presentación del frontend.** No hay
  `domain`, `application` ni `infrastructure` implicados: la regla de
  dependencia de `docs/architecture.md` no se ve afectada porque no se toca
  `backend/` ni ningún contrato de datos (R1–R15).

- **Los tokens son la única fuente de valores.** `styles.css` declara los
  valores en `:root` / `.dark` y los publica en `@theme inline`; las primitivas
  consumen utilidades Tailwind, nunca literales. Es lo que permite que la fase
  3 cambie superficies sin volver a tocar color (R2, R4, R6, R15).

- **Import de la fuente en la hoja de estilos o en el root, no en un
  componente.** `@fontsource-variable/inter` se carga una sola vez para toda la
  app. Si se importa desde `styles.css`, el `@import` debe ir antes de las
  reglas propias; si se importa desde `routes/__root.tsx`, va junto al import de
  `appCss`. Cualquiera de las dos satisface R1; se elige la que no rompa el
  orden de cascada de Tailwind v4.

- **Dark y `-surface` se derivan, no se dictan.** El MASTER §1 fija numéricamente
  solo los foregrounds claros. Los valores de `.dark` y los 16
  `--status-*-surface` los calcula el implementer respetando dos invariantes
  verificables: mismo rol semántico (R3) y contraste ≥ 4.5:1 (R5). Fijar
  números inventados en la spec habría dado precisión falsa.

- **El contraste se verifica con un helper de test propio, sin dependencias.**
  El test parsea `styles.css`, extrae los `oklch(...)`, convierte
  oklch → oklab → sRGB lineal → sRGB, calcula la luminancia relativa WCAG y la
  razón de contraste. Son ~40 líneas de matemática pura en el propio archivo de
  test; añadir `culori` o similar violaría R15 (R5).

- **Los tokens de estado se declaran ahora y se consumen después.** Declararlos
  en la fase 1 permite auditarlos por contraste de una vez, aunque
  `odc-status-badge.tsx` siga con sus clases Tailwind hasta la fase 3e. El coste
  de declararlos sin consumirlos es cero; el de auditarlos dos veces, no (R4).

- **`--sidebar-primary` en `.dark` pasa a ser un alias de `--primary`.** Es la
  forma más barata de eliminar el violeta huérfano y de garantizar que no
  reaparezca: no hay un segundo valor que mantener sincronizado (R3).

- **La invariante "chroma ≤ 0.10 salvo estado/destructive/accent-action" es la
  forma testeable de la Two-Color Rule** del MASTER §9. Un test que recorre
  todos los `oklch()` de `styles.css` la comprueba sin juicio estético (R3).

- **Las primitivas se ajustan por clase, no por reescritura.** Cada uno de los 9
  archivos de la fase 2 cambia sus cadenas de `cva`/`cn`: radios, alturas,
  padding y la nueva variante `confirm`. No cambia ninguna firma de componente
  ni ninguna prop existente, lo que mantiene intacto el riesgo para los tests de
  `components/odc/` (R7–R13).

- **La variante `confirm` se añade al `cva` de `button.tsx` sin tocar
  `default`.** Los consumidores actuales no cambian; la fase 3c decidirá qué
  botones pasan a `confirm` ("Registrar pago", "Completar orden"). Aquí solo se
  crea la variante y su test (R7).

- **`TableHeader` sticky tiene un techo conocido:** el contenedor actual solo
  desborda en X, así que el efecto sólo será visible cuando una vista imponga
  altura máxima. Se implementa igual porque es la clase que el MASTER pide y no
  cuesta nada; la vista que lo aproveche llegará en la fase 3 (R10).

## Archivos afectados

Todos en la capa de presentación (`frontend/`, sin equivalente de capas
domain/application/infrastructure):

| Archivo | Qué cambia | Requisitos |
|---|---|---|
| `frontend/src/styles.css` | Tokens de color light/dark, 16 pares de estado, radios, escala `--space-*`, `--font-sans`, mapeos en `@theme inline` | R1–R6, R14 |
| `frontend/src/routes/__root.tsx` | Import de `@fontsource-variable/inter` (si no se hace desde `styles.css`) | R1 |
| `frontend/src/components/ui/button.tsx` | Radio, alto, peso, variante `confirm` | R7 |
| `frontend/src/components/ui/input.tsx` | Radio, alto, foco | R8 |
| `frontend/src/components/ui/select.tsx` | Radio del trigger y del popup, alto | R8 |
| `frontend/src/components/ui/textarea.tsx` | Radio, foco | R8 |
| `frontend/src/components/ui/field.tsx` | Radio del `FieldLabel` envolvente; `role="alert"` preservado | R8 |
| `frontend/src/components/ui/card.tsx` | Radio, padding, `shadow-xs` + borde | R9 |
| `frontend/src/components/ui/table.tsx` | Alto de fila, padding de celda, header sticky | R10 |
| `frontend/src/components/ui/badge.tsx` | Radio, sin borde | R11 |
| `frontend/src/components/ui/dialog.tsx` | Radio, padding, sombra | R12 |
| Tests nuevos en `frontend/src/` | Un test de tokens/contraste sobre `styles.css` + tests por primitiva | R1–R15 |

Fuera de esta tabla no debe cambiar ningún archivo, salvo el ajuste mecánico
mínimo que contempla R15.

## Alternativas descartadas

- **Hacer las fases 1 y 2 en features separadas**: se descarta porque la fase 2
  consume tokens (`--radius-card`, `--radius-badge`, `--accent-action`) que solo
  existen tras la fase 1; separarlas dejaría una feature intermedia con la UI a
  medio camino y dos rondas de revisión visual para un solo resultado.
- **Rediseñar `odc-status-badge.tsx` en esta feature** (es un archivo pequeño y
  tentador): se descarta porque es fase 3e y porque su cambio es el que hace
  visible el color de estado en timeline y resumen — decisiones que el plan
  quiere tomar mirando el resultado de esta feature, no antes.
- **Añadir una dependencia de color (`culori`, `colorjs.io`) para el test de
  contraste**: se descarta por R15; la conversión oklch→sRGB es determinista y
  cabe en el archivo de test.
- **Verificar el contraste con Playwright sobre el navegador real**: se descarta
  por coste; los valores son estáticos y se pueden auditar leyendo la hoja de
  estilos, sin arrancar la app.
- **Renombrar los tokens shadcn existentes (`--accent`, `--muted`, `--input`)
  para alinearlos con el MASTER**: se descarta porque obligaría a tocar
  decenas de consumidores fuera de alcance; se conservan sus nombres y solo se
  armonizan sus valores dentro de la invariante de chroma de R3.
- **Importar también `@fontsource-variable/geist`**: se descarta por el MASTER
  §2 — una sola familia, un solo payload; Geist queda instalado y sin usar.
