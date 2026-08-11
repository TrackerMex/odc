---
feature: "ui-surfaces-dashboards"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, surfaces, dashboards]
---

# Trazabilidad — [[ui-surfaces-dashboards]]

Las auditorías de código fuente viven en
`frontend/src/design-system.guardrails.test.ts`; los tests de render, en el
`*.test.tsx` de cada componente. Ver [[design]] §"Dónde vive cada test".

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `odc-status-badge.test.tsx::R1: el badge toma su color de los 8 pares de tokens --status-*` + `design-system.guardrails.test.ts::ui-surfaces-dashboards R1: el badge deja de pintar paleta cruda` | test `5ddeca0` + feat `1811136` |
| R2 | `odc-status-badge.test.tsx::R2: el badge conserva su contrato accesible y su transición` | test `5ddeca0` + feat `1811136` |
| R3 | `{odc,admin,general,executive}-dashboard.test.tsx` y `executive-tasks.test.tsx`, los cinco `::ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing` | test `f1373cc` + feat `4240a1d` |
| R4 | mismos cinco bloques `::ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing` | test `f1373cc` + feat `4240a1d` |
| R5 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R5: las etiquetas usan el tracking de label del MASTER` | test `384162e` + feat `9994dd9` |
| R6 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R6: las acciones no sobreescriben la densidad de la primitiva` + `odc-dashboard.test.tsx::ui-surfaces-dashboards R6: los CTA del header cierran D-V3` | test `384162e` + feat `9994dd9` |
| R7 | `odc-dashboard` y `admin-dashboard` `::R7,R8: cada cola se distingue de un vistazo`; `general-dashboard::R7,R8: la cola de aprobación se distingue de un vistazo`; `executive-dashboard::R7,R8` y `executive-tasks::R7`, ambos `: la tarjeta heterogénea no miente con un color` | test `19a0da0` + feat `749946e` |
| R8 | mismos bloques `R7,R8` de las cuatro superficies con contadores | test `19a0da0` + feat `749946e` |
| R9 | los cinco `::ui-surfaces-dashboards R9: filas más densas / multilínea densas sin ruido en el hover` | test `494fdf7` + feat `fe84b91` |
| R10 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R10: cada caja usa el radio de su token` | test `494fdf7` + feat `fe84b91` |
| R11 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R11: cero color literal en las seis superficies` | test `494fdf7` + feat `fe84b91` |
| R12 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R12: las 6 aserciones en riesgo siguen intactas` | test `99036cd` (guarda de no regresión; sin implementación asociada) |
| R13 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R13: los tests no fijan valores visuales inventados` | test `99036cd` (auditoría del propio código de test) |
| R14 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R14: la verificación en navegador existe` | test `99036cd` + feat `595158f` (esqueleto). **Abierto**: las 5 secciones y el veredicto humano |
| R15 | `design-system.guardrails.test.ts::ui-surfaces-dashboards R15: alcance cerrado, sin tokens ni dependencias nuevas` | test `99036cd` (`pnpm test` 469/469 y `pnpm build` en verde tras `595158f`) |

> Nota del leader (2026-08-11): esta tabla la rellenó el leader, no el
> implementer. El subagente fue detenido por el usuario justo después de commitear
> `595158f`, con todo el código ya entregado y `pnpm test` / `pnpm build` en verde,
> pero antes de escribir su reporte y de cerrar el bookkeeping. Los hashes y los
> nombres de test están tomados del historial y de los archivos, uno a uno.
> Consecuencia: **no existe `progress/impl_ui-surfaces-dashboards.md`**, así que el
> reviewer no tiene reporte del implementer contra el que contrastar. Debe juzgar
> mirando el código y los commits directamente.

R14 no se cierra con su test de existencia: hace falta
`progress/verify_ui-surfaces-dashboards.md` con sus 5 secciones rellenadas con
lecturas en vivo y el veredicto humano firmado con fecha. Si alguna sección
queda en PENDIENTE, la fila sigue pendiente.

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
