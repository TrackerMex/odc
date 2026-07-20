---
feature: "odc-purchase-approval"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-purchase-approval]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `approve-purchase.usecase.spec.ts::R1: approve-purchase transitions PRESUPUESTO_APROBADO to COMPRA_APROBADA for DIRECTOR_GENERAL`, `odc.controller.spec.ts::R1: POST /api/odcs/:id/approve-purchase approves the purchase with 200 restricted to DIRECTOR_GENERAL` | `92acb63` feat(odc): add POST /api/odcs/:id/approve-purchase for T5 (R1,R2) |
| R2 | `approve-purchase.usecase.spec.ts::R2: approve-purchase rejects unknown ids and non-PRESUPUESTO_APROBADO statuses`, `odc.controller.spec.ts::R2: approve-purchase responds 404 for an unknown id and 409 outside PRESUPUESTO_APROBADO` | `92acb63` feat(odc): add POST /api/odcs/:id/approve-purchase for T5 (R1,R2) |
| R3 | `odc.controller.spec.ts::R3: POST /api/odcs/:id/reject widens its roles metadata to ADMINISTRACION and DIRECTOR_GENERAL` | `485cc78` feat(odc): widen POST /api/odcs/:id/reject roles to DIRECTOR_GENERAL (R3) |
| R4 | pendiente | pendiente |
| R5 | pendiente | pendiente |
| R6 | pendiente | pendiente |
| R7 | pendiente | pendiente |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
