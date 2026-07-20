---
feature: "odc-budget-validation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-budget-validation]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R1: approve-budget transitions PENDIENTE_ADMIN to PRESUPUESTO_APROBADO for ADMINISTRACION`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R1: POST /api/odcs/:id/approve-budget approves the budget with 200 restricted to ADMINISTRACION` | `d2399ac` feat(odc): add POST /api/odcs/:id/approve-budget for T3 (R1,R2) |
| R2 | `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R2: approve-budget rejects unknown ids and non-PENDIENTE_ADMIN statuses`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R2: approve-budget responds 404 for an unknown id and 409 outside PENDIENTE_ADMIN` | `d2399ac` feat(odc): add POST /api/odcs/:id/approve-budget for T3 (R1,R2) |
| R3 | `backend/src/modules/odc/application/dto/reject-odc.dto.spec.ts::R3: RejectOdcDto requires a non-empty rejectionReason`; `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R3: reject requires rejectionReason (defense in depth below the DTO)` | `c6bfbb0` feat(odc): add RejectOdcDto with required rejectionReason (R3); `77713de` feat(odc): add POST /api/odcs/:id/reject for T4 (R4,R5) |
| R4 | `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R4: reject transitions PENDIENTE_ADMIN to RECHAZADA for ADMINISTRACION`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION` | `77713de` feat(odc): add POST /api/odcs/:id/reject for T4 (R4,R5) |
| R5 | `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R5: reject rejects unknown ids, non-rejectable statuses and role mismatch on PRESUPUESTO_APROBADO`; `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION` | `77713de` feat(odc): add POST /api/odcs/:id/reject for T4 (R4,R5) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
