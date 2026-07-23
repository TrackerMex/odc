---
feature: "frontend-admin-flows"
status: approved        # draft | approved
tags: [frontend, administracion, odc, spec]
---

# Trazabilidad — [[frontend-admin-flows]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `odc-routes.test.ts::R1: dashboard loader requests only ADMINISTRACION queues`; regresión `R1: dashboard loader requests every DIRECTOR_OPS queue` | `8ad0352` test(frontend-admin-flows): define admin workflows (R1-R12); `17d91df` feat(frontend-admin-flows): add admin purchase workflows (R1-R12) |
| R2 | `admin-dashboard.test.tsx::R2,R12: ADMINISTRACION dashboard queues` | `8ad0352`; `17d91df` |
| R3 | `admin-budget-actions.test.tsx::R3,R4,R11,R12: budget action visibility and approval`; `odc-detail.test.tsx::R7,R8: ODC detail and chronological history` | `8ad0352`; `17d91df` |
| R4 | `odc-api.test.ts::R4,R6,R9: ADMINISTRACION mutation contracts`; `admin-budget-actions.test.tsx::R3,R4,R11,R12: budget action visibility and approval` | `8ad0352`; `17d91df` |
| R5 | `admin-budget-actions.test.tsx::R5,R6,R10,R11: rejection dialog` | `8ad0352`; `17d91df` |
| R6 | `odc-api.test.ts::R4,R6,R9: ADMINISTRACION mutation contracts`; `admin-budget-actions.test.tsx::R5,R6,R10,R11: rejection dialog` | `8ad0352`; `17d91df` |
| R7 | `odc-detail.test.tsx::R7: payment information in the shared detail`; `payment-evidence-form.test.tsx::R7,R8,R11,R12: evidence form visibility and validation` | `8ad0352`; `17d91df` |
| R8 | `payment-evidence-form.test.tsx::R7,R8,R11,R12: evidence form visibility and validation` | `8ad0352`; `17d91df` |
| R9 | `odc-api.test.ts::R4,R6,R9: ADMINISTRACION mutation contracts`; `payment-evidence-form.test.tsx::R9,R10,R11: evidence upload lifecycle` | `8ad0352`; `17d91df` |
| R10 | `admin-budget-actions.test.tsx::R5,R6,R10,R11: rejection dialog`; `admin-budget-actions.test.tsx::R10: approval errors remain recoverable`; `payment-evidence-form.test.tsx::R9,R10,R11: evidence upload lifecycle` | `8ad0352`; `17d91df` |
| R11 | `admin-budget-actions.test.tsx::R3,R4,R11,R12: budget action visibility and approval`; `admin-budget-actions.test.tsx::R5,R6,R10,R11: rejection dialog`; `payment-evidence-form.test.tsx::R7,R8,R11,R12: evidence form visibility and validation`; `payment-evidence-form.test.tsx::R9,R10,R11: evidence upload lifecycle` | `8ad0352`; `17d91df` |
| R12 | `admin-dashboard.test.tsx::R2,R12: ADMINISTRACION dashboard queues`; `admin-budget-actions.test.tsx::R3,R4,R11,R12: budget action visibility and approval`; `payment-evidence-form.test.tsx::R7,R8,R11,R12: evidence form visibility and validation` | `8ad0352`; `17d91df` |

Regla: el reviewer no aprueba si alguna fila queda `pendiente`.
Convención de commit: `feat(frontend-admin-flows): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
