---
feature: "frontend-general-approval"
status: approved        # draft | approved
tags: [frontend, director-general, odc, spec]
---

# Trazabilidad — [[frontend-general-approval]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts::R1: dashboard loader requests only the DIRECTOR_GENERAL queue` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R2 | `frontend/src/components/odc/general-dashboard.test.tsx::R2: Dirección General approval dashboard` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R3 | `frontend/src/components/odc/general-approval-actions.test.tsx::R3: pending purchase detail and actions` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R4 | `frontend/src/components/odc/general-approval-actions.test.tsx::R4: administration validation mark comes only from history` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R5 | `frontend/src/components/odc/general-approval-actions.test.tsx::R5: general approval role and status boundary` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R6 | `frontend/src/components/odc/general-approval-actions.test.tsx::R6: approve purchase with server-confirmed state`; `frontend/src/lib/odc-api.test.ts::R6: DIRECTOR_GENERAL purchase approval contract` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R7 | `frontend/src/components/odc/general-approval-actions.test.tsx::R7: accessible rejection dialog and required reason` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R8 | `frontend/src/components/odc/general-approval-actions.test.tsx::R8: reject purchase with trimmed reason and server state`; `frontend/src/lib/odc-api.test.ts::R4,R6,R8,R9: ADMINISTRACION and shared rejection contracts` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R9 | `frontend/src/components/odc/general-approval-actions.test.tsx::R9: recoverable purchase decision errors` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |
| R10 | `frontend/src/components/odc/general-dashboard.test.tsx::R10: responsive Dirección General dashboard`; `frontend/src/components/odc/general-approval-actions.test.tsx::R10: loading semantics and responsive actions` | `5e63420 feat(frontend-general-approval): add flow (R1-R10)` |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(frontend-general-approval): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
