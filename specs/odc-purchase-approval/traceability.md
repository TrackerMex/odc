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
| R4 | `reject-odc.usecase.spec.ts::R4: reject transitions PRESUPUESTO_APROBADO to RECHAZADA for DIRECTOR_GENERAL (T6)`, `odc.controller.spec.ts::R4: POST /api/odcs/:id/reject accepts DIRECTOR_GENERAL on PRESUPUESTO_APROBADO (T6) with 200` | `13d0aa6` feat(odc): add reject test coverage for T6 and T4 regression (R4,R5,R6,R7) |
| R5 | `reject-odc.usecase.spec.ts::R5: reject regression — ADMINISTRACION on PENDIENTE_ADMIN (T4) still succeeds after widening the controller roles for T6`, `odc.controller.spec.ts::R5: reject regression — ADMINISTRACION on PENDIENTE_ADMIN (T4) keeps returning 200 after the R3 roles widening` | `13d0aa6` feat(odc): add reject test coverage for T6 and T4 regression (R4,R5,R6,R7) |
| R6 | `reject-odc.usecase.spec.ts::R6: reject rejects role/status mismatches (DIRECTOR_GENERAL on PENDIENTE_ADMIN, ADMINISTRACION on PRESUPUESTO_APROBADO)`, `odc.controller.spec.ts::R6: reject responds 403 on role/status mismatch (DIRECTOR_GENERAL on PENDIENTE_ADMIN, ADMINISTRACION on PRESUPUESTO_APROBADO)` | `13d0aa6` feat(odc): add reject test coverage for T6 and T4 regression (R4,R5,R6,R7) |
| R7 | `reject-odc.usecase.spec.ts::R7: reject rejects unknown ids and non-rejectable statuses for a DIRECTOR_GENERAL actor` | `13d0aa6` feat(odc): add reject test coverage for T6 and T4 regression (R4,R5,R6,R7) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
