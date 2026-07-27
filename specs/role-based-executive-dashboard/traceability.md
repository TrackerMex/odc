---
feature: "role-based-executive-dashboard"
status: draft
tags: [harness, spec, dashboard, roles]
---

# Trazabilidad — [[role-based-executive-dashboard]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.controller.spec.ts::R1,R10; odc-routes.test.ts::R1 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R2 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.typeorm.repository.spec.ts::R2,R5,R6,R7,R11 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R3 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.test.tsx::R3; odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R4 | executive-dashboard.test.tsx::R4 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R5 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.typeorm.repository.spec.ts::R2,R5,R6,R7,R11 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R6 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.typeorm.repository.spec.ts::R2,R5,R6,R7,R11 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R7 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.typeorm.repository.spec.ts::R2,R5,R6,R7,R11 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R8 | executive-dashboard.test.tsx::R8; odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R9 | executive-dashboard.test.tsx::R9; odc-api.test.ts::R1,R3,R5,R6,R7,R8,R9 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R10 | get-executive-dashboard.usecase.spec.ts::R1,R2,R5,R6,R7,R10; executive-dashboard.controller.spec.ts::R1,R10 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |
| R11 | executive-dashboard.typeorm.repository.spec.ts::R2,R5,R6,R7,R11 | e509930 test(role-based-executive-dashboard); 308cdf6 feat(role-based-executive-dashboard) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
