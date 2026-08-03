---
feature: "odc-approval-self-check"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-approval-self-check]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `approve-budget.usecase.spec.ts::R1: approve-budget rejects self-approval by the ODC creator (odc-approval-self-check)` | `f4c5fde` test(odc-approval-self-check): specify approve-budget rejects self-approval (R1); `6d55280` feat(odc-approval-self-check): reject approve-budget self-approval (R1) |
| R2 | `approve-purchase.usecase.spec.ts::R2: approve-purchase rejects self-approval by the ODC creator (odc-approval-self-check)` | `1659f98` test(odc-approval-self-check): specify approve-purchase rejects self-approval (R2); `915736d` feat(odc-approval-self-check): reject approve-purchase self-approval (R2) |
| R3 | `odc.controller.spec.ts::R3: approve-budget and approve-purchase translate self-approval OdcAccessDeniedError into 403 (odc-approval-self-check)` | `089eb64` test(odc-approval-self-check): confirm self-approval OdcAccessDeniedError maps to 403 (R3) |
| R4 | `reject-odc.usecase.spec.ts::R4: reject rejects self-action by the ODC creator (odc-approval-self-check)` | `310f1eb` test(odc-approval-self-check): specify reject-odc rejects self-action (R4); `f395272` feat(odc-approval-self-check): reject reject-odc self-action (R4) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
