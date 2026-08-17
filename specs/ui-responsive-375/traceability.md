---
feature: "ui-responsive-375"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, responsive, verification]
---

# Trazabilidad — [[ui-responsive-375]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `e2e/responsive-375.spec.ts::ui-responsive-375 R1: el viewport medido es de verdad 375px` + `src/design-system.guardrails.test.ts::ui-responsive-375 R1: el acta abre con el gate de medición` → acta §0 | `e116538` test: gate the 375px viewport reading (R1) · `b95e9ef` feat: record the measured 375px viewport gate (R1) |
| R2 | `src/design-system.guardrails.test.ts::ui-responsive-375 R2: el inventario auditado son las superficies vivas` (+ `src/components/odc/production-reachability.test.ts`, sin editar) → acta §§1–6 | `c67c475` test: require the acta to cover every mounted surface (R2) · `29ad1f4` feat: record the 375px observation of every surface (R2) |
| R3 | `e2e/responsive-375.spec.ts::ui-responsive-375 R3: cero scroll horizontal de página` + `src/design-system.guardrails.test.ts::ui-responsive-375 R3: cada ruta registra su par de anchos medidos` → acta §§1–6 | `f574a8c` test: forbid page-level horizontal scroll on the six routes (R3) · `ed690bf` feat: record the measured page widths per route (R3) |
| R4 | `src/design-system.guardrails.test.ts::ui-responsive-375 R4: la precondición de 375px se conserva en la fuente` | `1081ab5` test: guard the viewport meta and fixed widths over 375px (R4) · **sin commit de implementación**: la fuente ya cumplía y R6 prohíbe tocar una superficie sin defecto observado |
| R5 | `src/design-system.guardrails.test.ts::ui-responsive-375 R5: los patrones responsive vigentes siguen intactos` | `96d41f6` test: freeze the responsive patterns already in place (R5) · **sin commit de implementación**: los ocho patrones seguían en su sitio |
| R6 | `src/design-system.guardrails.test.ts::ui-responsive-375 R6: la corrección es condicional y mobile-first` → acta §§1–6, todas "Sin corrección (R6)" | `2a21c83` test: keep the conditional correction mobile-first (R6) · **sin commit de implementación**: ninguna observación válida bajo R1 mostró desbordamiento, solape, truncado ilegible ni control inalcanzable, así que no se cambió ni una clase |
| R7 | `src/design-system.guardrails.test.ts::ui-responsive-375 R7: los tres sospechosos reciben veredicto` → acta §5 (R7-2) y §6 (R7-1, R7-3) | `3f7a34b` test: require an explicit verdict for the three suspects (R7) · `ac89c3e` feat: close the verdicts of the three named suspects (R7) |
| R8 | `src/design-system.guardrails.test.ts::ui-responsive-375 R8: el área táctil se mide y se declara` → acta §7 | `6398777` test: require the touch-target measurements and the density freeze (R8) · `f047195` feat: record the measured touch targets as named debt (R8) |
| R9 | `src/design-system.guardrails.test.ts::ui-responsive-375 R9: el acta existe y está levantada` → acta §§0–7 completas; §8 es el gate humano | `be3d228` test: require the acta and the plan to be closed (R9) · `9cbf676` feat: close the plan's unverified 375px point (R9) |
| R10 | `src/design-system.guardrails.test.ts::ui-responsive-375 R10: no se edita ninguna aserción ajena` + `pnpm test` (596 tests) y `pnpm build` en verde | `714fee3` test: forbid touching any foreign assertion (R10) · **sin commit de implementación**: no hubo que conservar ninguna clase contra una aserción, porque no se cambió ninguna clase |

## Choques registrados (R10)

Ninguno. Ningún requisito de esta spec chocó con una aserción vigente, porque la
auditoría no produjo cambios en `frontend/src/components/`. Las cuatro
aserciones en riesgo del plan siguen intactas y sin editar, y la guarda de
alcanzabilidad de la feature 30 sigue en verde tal cual.

## Gate humano — cerrado

La **sección 8 del acta** (`## 8. Veredicto humano`) quedó **APROBADA** el
2026-08-17 en el commit `f914082`. Era la única línea que el implementer no podía
levantar: la guarda de R9 comprueba las secciones 0 a 7 y deja la 8 deliberadamente
fuera, porque ponerla en verde desde un test sería falsificar justo el gate que R9
existe para imponer. El veredicto lo transcribió el leader desde la aprobación
verbal del humano, declarándolo así en el propio acta (mismo procedimiento que la
feature 14); el reviewer lo aceptó explícitamente con ese criterio.

Los requisitos que solo se pueden observar en un navegador real (R1, R3, R7, R8)
citan en la columna de test la **sección del acta**
`progress/verify_ui-responsive-375.md` que los cierra, además de la guarda de
Vitest que exige esa sección completa. R6 puede cerrarse como "sin defecto
observado" citando el acta: es un resultado válido de esta feature, no una fila
pendiente.

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
