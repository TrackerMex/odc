---
feature: "ui-design-tokens"
status: draft        # draft | approved
tags: [harness, spec, frontend, design-system, tokens]
---

# Trazabilidad — [[ui-design-tokens]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `frontend/src/styles.tokens.test.ts::R1: Inter Variable cargada y --font-sans declarada` | test `aa31027` test(ui-design-tokens): audit stylesheet tokens, contrast and motion (R1,R2,R3,R4,R5,R6,R14) · feat `e9401d9` feat(ui-design-tokens): navy palette, status tokens, radii and Inter (R1,R2,R3,R4,R5,R6,R14) |
| R2 | `frontend/src/styles.tokens.test.ts::R2: paleta navy del MASTER §1 en :root` | test `aa31027` (+ `f038a70` test(ui-design-tokens): ignore CSS comments when parsing token blocks) · feat `e9401d9` · **enmienda**: test `6e20170` test(ui-design-tokens): expect the amended emerald-700 accent-action (R2,R5) · feat `a48404a` feat(ui-design-tokens): adopt amended emerald-700 accent-action (R2,R5) |
| R3 | `frontend/src/styles.tokens.test.ts::R3: dark conserva roles, corrige --sidebar-primary y acota el chroma` | test `aa31027` · feat `e9401d9` |
| R4 | `frontend/src/styles.tokens.test.ts::R4: 8 pares --status-* / --status-*-surface en light y dark` | test `aa31027` · feat `e9401d9` |
| R5 | `frontend/src/styles.tokens.test.ts::R5: contraste WCAG 2.1 >= 4.5:1 en los pares auditados` | test `aa31027` (+ `f038a70`) · feat `e9401d9` · **enmienda**: test `6e20170` · feat `a48404a` |
| R6 | `frontend/src/styles.tokens.test.ts::R6: radios y escala de espaciado` | test `aa31027` · feat `e9401d9` |
| R7 | `frontend/src/components/ui/primitives.tokens.test.tsx::R7: botón h-8, radio --radius, peso 500 y variante confirm` | test `e677d90` test(ui-design-tokens): shape, size and focus of the 9 primitives (R7,R8,R9,R10,R11,R12) · feat `31c88a7` feat(ui-design-tokens): restyle the 9 primitives onto the design tokens (R7,R8,R9,R10,R11,R12) |
| R8 | `frontend/src/components/ui/primitives.tokens.test.tsx::R8: input, select y textarea con radio y foco del sistema` | test `e677d90` · feat `31c88a7` |
| R9 | `frontend/src/components/ui/primitives.tokens.test.tsx::R9: card con --radius-card, padding 1rem, shadow-xs y borde` | test `e677d90` · feat `31c88a7` |
| R10 | `frontend/src/components/ui/primitives.tokens.test.tsx::R10: tabla con fila 2.25rem, header sticky y overflow-x-auto` | test `e677d90` · feat `31c88a7` |
| R11 | `frontend/src/components/ui/primitives.tokens.test.tsx::R11: badge con --radius-badge y sin borde visible` | test `e677d90` · feat `31c88a7` |
| R12 | `frontend/src/components/ui/primitives.tokens.test.tsx::R12: diálogo con --radius-card, padding 1.25rem y shadow-xl` | test `e677d90` · feat `31c88a7` |
| R13 | `frontend/src/design-system.guardrails.test.ts::R13: las 6 aserciones sobre className siguen intactas` | test `81f7ee7` test(ui-design-tokens): non-regression guards for className assertions, deps and literal colour (R13,R15) · guarda las implementaciones `e9401d9` y `31c88a7` |
| R14 | `frontend/src/styles.tokens.test.ts::R14: prefers-reduced-motion respetado y transiciones de 150-300ms` | test `aa31027` · feat `e9401d9` |
| R15 | `frontend/src/design-system.guardrails.test.ts::R15: sin dependencias nuevas y sin color literal en las primitivas` | test `81f7ee7` · guarda las implementaciones `e9401d9` y `31c88a7` |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).

Si R15 obliga a un ajuste mecánico en `components/odc/` o `components/layout/`,
se anota aquí el archivo y la razón.

## Notas de trazabilidad

- **Ningún archivo de `components/odc/` ni de `components/layout/` cambió.** El
  ajuste mecánico que contempla R15 no hizo falta: `odc-status-badge.tsx` ya
  traía `border-0`, así que quitar el borde de la base de `badge.tsx` no obligó
  a tocarlo.
- **R13, R14 y R15 son los requisitos de "no regresión" de la spec.** Sus tests
  son guardas: nacen en verde y sólo se ponen rojos si el rediseño rompe algo
  que debía quedar intacto, así que no existe un ciclo rojo→verde para ellos.
  **Corrección (2026-08-10, hallazgo D1 del reviewer):** una versión anterior de
  esta nota afirmaba que su commit de test precedía a la implementación que
  guardan. Es falso y `git log` lo desmiente: `81f7ee7` es **posterior** a
  `e9401d9` y `31c88a7`. Solo R14 cumple el orden test-primero (`aa31027` antes
  de `e9401d9`). No altera el poder de la guarda —el reviewer la ejecutó sobre
  el árbol pre-feature `3212483` y pasa 18/18, o sea es verde a ambos lados—
  pero este archivo es el registro auditable y no puede contradecir el
  historial. R15 incluye un test de calibración
  (`el detector de color literal no es vacuo`) para que la guarda no pueda pasar
  por no detectar nada.
- **Enmienda firmada de R2 (2026-08-10), aplicada en `6e20170` + `a48404a`.**
  R2 y R5 eran contradictorios tal como se aprobaron. El humano resolvió por el
  lado del verde: `--accent-action` pasa de `oklch(0.5960 0.1274 163.23)`
  (#059669) a `oklch(0.5081 0.1049 165.61)` (#047857) y
  `--accent-action-foreground` vuelve a blanco `oklch(0.985 0 0)`. El verde
  nuevo es idéntico a `--status-done`, así que el botón de confirmar y el estado
  al que conduce comparten color; hay un test que fija esa igualdad. En `.dark`
  el par no lo fija nadie: se recalculó a `oklch(0.7227 0.1394 165.61)` sobre
  texto `oklch(0.1822 0.0362 265.75)` (8.13:1), conservando el rol invertido.
