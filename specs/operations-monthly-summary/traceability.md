---
feature: "operations-monthly-summary"
status: draft
tags: [backend, frontend, director-ops, odc, reportes, spec]
---

# Trazabilidad — [[operations-monthly-summary]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | get-monthly-purchase-summary.usecase.spec.ts::R1,R2,R6; monthly-summary.controller.spec.ts::R1,R4; odc-api.test.ts::R1,R4 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R2 | get-monthly-purchase-summary.usecase.spec.ts::R1,R2,R6 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R3 | monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | 7fdd0f4 test(operations-monthly-summary): cover monthly purchase detail |
| R4 | monthly-summary.controller.spec.ts::R1,R4; odc-api.test.ts::R1,R4 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R5 | monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R6 | get-monthly-purchase-summary.usecase.spec.ts::R1,R2,R6; monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R7 | monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R8 | monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |
| R9 | monthly-summary.test.tsx::R3,R5,R6,R7,R8,R9 | e2778c5 test(operations-monthly-summary); 0262d57 feat(operations-monthly-summary) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(operations-monthly-summary): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
