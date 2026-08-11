---
feature: "ui-dead-surfaces-audit"
status: draft        # draft | approved
tags: [harness, spec, frontend, audit, routes]
---

# Trazabilidad — [[ui-dead-surfaces-audit]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `frontend/src/components/odc/production-reachability.test.ts::R1: superseded dashboards are absent from executable surfaces` | `6153dd6 test(ui-dead-surfaces-audit): detect unreachable ODC surfaces (R1,R2,R3,R4)` → `4f60a9b feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)` |
| R2 | `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts::R2: authenticated home loads one shared executive snapshot by role`; `frontend/src/components/odc/production-reachability.test.ts::R2: the authenticated home keeps the shared executive dashboard` | `6153dd6 test(ui-dead-surfaces-audit): detect unreachable ODC surfaces (R1,R2,R3,R4)` → `4f60a9b feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)` |
| R3 | `frontend/src/components/odc/production-reachability.test.ts::R3: every ODC surface is transitively reachable from a route` | `6153dd6 test(ui-dead-surfaces-audit): detect unreachable ODC surfaces (R1,R2,R3,R4)` → `4f60a9b feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)` |
| R4 | `frontend/src/components/odc/production-reachability.test.ts::R4: detail, form, login and monthly summary surfaces stay mounted` | `6153dd6 test(ui-dead-surfaces-audit): detect unreachable ODC surfaces (R1,R2,R3,R4)` → `4f60a9b feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)` |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(ui-dead-surfaces-audit): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
