---
feature: "ui-surfaces-monthly-summary"
status: approved     # draft | approved
tags: [harness, spec, frontend, ui, monthly-summary, charts]
---

# Trazabilidad — [[ui-surfaces-monthly-summary]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `monthly-summary.test.tsx::R1: compact layout and header` | test `7a2be38` + feat `2092adb` |
| R2 | `monthly-summary.test.tsx::R2: the monthly total is the only display-sized metric` | test `7a2be38` + feat `2092adb` |
| R3 | `monthly-summary.test.tsx::R3: stage distribution uses accessible horizontal bars` | test `7a2be38` + feat `2092adb` |
| R4 | `monthly-summary.test.tsx::R4: detail headers use the system label tracking` | test `7a2be38` + feat `2092adb` |
| R5 | `monthly-summary.test.tsx::R5: empty state uses semantic shape and copy`; `design-system.guardrails.test.ts::ui-surfaces-dashboards R10/R11` | test `7a2be38` + feat `2092adb` |
| R6 | `design-system.guardrails.test.ts::ui-surfaces-monthly-summary R6: the export slide exception is documented`; guardas congeladas de `R15` | test `7a2be38` + feat `2092adb` |
| R7 | `monthly-summary.test.tsx::R7: existing loading and result contracts remain accessible`; caracterizaciones preexistentes del resumen; `production-reachability.test.ts::R4` | test `7a2be38` + feat `2092adb` |
| R8 | `design-system.guardrails.test.ts::ui-surfaces-monthly-summary R8: the active surface is audited`; auditorías `ui-surfaces-dashboards R5/R10/R11/R13/R15` | test `7a2be38` + feat `2092adb` |
| R9 | `design-system.guardrails.test.ts::ui-surfaces-monthly-summary R9: browser verification record exists`; `progress/verify_ui-surfaces-monthly-summary.md` | test `7a2be38` + esqueleto `2092adb`; acta y firma humana pendientes |
| R10 | `design-system.guardrails.test.ts::ui-surfaces-monthly-summary R10: existing summary assertions stay intact`; suite completa | test `7a2be38` + feat `2092adb`; `pnpm -C frontend test` 480/480 y `pnpm -C frontend build` verdes |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(ui-surfaces-monthly-summary): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).

R9 se cierra con `progress/verify_ui-surfaces-monthly-summary.md` firmado por un
humano, no solo con el test que comprueba que el archivo existe.
