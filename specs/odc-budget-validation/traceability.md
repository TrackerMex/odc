---
feature: "odc-budget-validation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-budget-validation]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R1: approve-budget transitions PENDIENTE_ADMIN to PRESUPUESTO_APROBADO for ADMINISTRACION`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R1: POST /api/odcs/:id/approve-budget approves the budget with 200 restricted to ADMINISTRACION` | pendiente |
| R2 | `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R2: approve-budget rejects unknown ids and non-PENDIENTE_ADMIN statuses`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R2: approve-budget responds 404 for an unknown id and 409 outside PENDIENTE_ADMIN` | pendiente |
| R3 | pendiente | pendiente |
| R4 | pendiente | pendiente |
| R5 | pendiente | pendiente |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
