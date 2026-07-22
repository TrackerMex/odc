---
feature: "frontend-odc-form"
status: approved        # draft | approved
tags: [frontend, odc, spec]
---

# Trazabilidad — [[frontend-odc-form]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `odc-dashboard.test.tsx::R1,R12: DIRECTOR_OPS dashboard exposes four responsive workflow queues`; `odc-routes.test.ts::R1: dashboard loader requests every DIRECTOR_OPS queue`; `odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9: typed ODC API client` | `40da676` tests; `f69dc48` implementation |
| R2 | `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total`; `odc.test.ts::R2,R3: ODC form validation` | `40da676` tests; `f69dc48` implementation |
| R3 | `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total`; `odc-routes.test.ts::R3,R7: detail loader resolves the ODC and supplier catalog`; `odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9: typed ODC API client` | `40da676` tests; `f69dc48` implementation |
| R4 | `odc.test.ts::R4: MXN totals and API payload conversion`; `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total` | `40da676` tests; `f69dc48` implementation |
| R5 | `odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9: typed ODC API client`; `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total::selects a catalog supplier and creates before submitting a new ODC` | `40da676` tests; `f69dc48` implementation |
| R6 | `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total::selects a catalog supplier and creates before submitting a new ODC`; `odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9: typed ODC API client` | `40da676` tests; `f69dc48` implementation |
| R7 | `odc-detail.test.tsx::R7,R8: ODC detail and chronological history`; `odc-routes.test.ts::R3,R7: detail loader resolves the ODC and supplier catalog` | `40da676` tests; `f69dc48` implementation |
| R8 | `odc-form.test.tsx::R8,R9,R10,R11: rejected ODC editing, resend and failures`; `odc-detail.test.tsx::R7,R8: ODC detail and chronological history` | `40da676` tests; `f69dc48` implementation |
| R9 | `odc-form.test.tsx::R8,R9,R10,R11: rejected ODC editing, resend and failures`; `odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9: typed ODC API client` | `40da676` tests; `f69dc48` implementation |
| R10 | `odc-form.test.tsx::R8,R9,R10,R11: rejected ODC editing, resend and failures::preserves the form, skips submit after PATCH failure and reports a Spanish error` | `40da676` tests; `f69dc48` implementation |
| R11 | `odc-form.test.tsx::R8,R9,R10,R11: rejected ODC editing, resend and failures`; `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total::announces field errors and never persists invalid values` | `40da676` tests; `f69dc48` implementation |
| R12 | `odc-dashboard.test.tsx::R1,R12: DIRECTOR_OPS dashboard exposes four responsive workflow queues`; `odc-form.test.tsx::R2,R3,R4,R5,R6: ODC form metadata, fields and live total` | `40da676` tests; `f69dc48` implementation |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(frontend-odc-form): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).

> Los tests base se registraron en `40da676`; `90a6e89` normalizó sus nombres
> para enumerar explícitamente cada R-id sin cambiar comportamiento. La
> implementación correspondiente está en `f69dc48`.
