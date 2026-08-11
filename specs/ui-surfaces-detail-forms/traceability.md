---
feature: "ui-surfaces-detail-forms"
status: approved     # draft | approved
tags: [harness, spec, frontend, ui, detail, forms, accessibility]
---

# Trazabilidad — [[ui-surfaces-detail-forms]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `odc-detail.test.tsx::R1: definition rows and a single emphasized total` | `66d55d8 test(...): specify detail and form surfaces`; `b04d3d0 feat(...): refine detail and form workflows` |
| R2 | `odc-detail.test.tsx::R2: semantic ODC timeline` | `66d55d8`; `b04d3d0` |
| R3 | `odc-detail.test.tsx::R3: semantic rejection and protected preview surfaces`; `styles.tokens.test.ts::ui-surfaces-detail-forms R3: contraste del banner destructivo` | `66d55d8`; `b04d3d0` |
| R4 | `odc-detail.test.tsx::R4: action surface belongs to the detail main column`; `admin-budget-actions.test.tsx::R4: administrative action footer hierarchy`; `general-approval-actions.test.tsx::R4: general approval footer hierarchy`; `odc-routes.test.ts::R4: permitted actions compose inside the detail main column` | `66d55d8`; `b04d3d0` |
| R5 | `upload-invoice-form.test.tsx::R5: explicit completion confirmation`; rejection dialog characterizations in `admin-budget-actions.test.tsx` and `general-approval-actions.test.tsx` | `66d55d8`; `b04d3d0` |
| R6 | `odc-form.test.tsx::R6,R7: adjacent field errors, blur validation and focus order`; `register-payment-form.test.tsx::R6,R9`; `payment-evidence-form.test.tsx::R6,R10`; `upload-invoice-form.test.tsx::R6,R11`; `login-form.test.tsx::R6,R12`; `admin-budget-actions.test.tsx::R6 keeps the API rejection alert separate from the reason field`; `general-approval-actions.test.tsx::R6 keeps the API rejection alert separate from the reason field` | `66d55d8`; `b04d3d0`; `aea3c7b`; `631fb5a` |
| R7 | `odc-form.test.tsx::R6,R7: adjacent field errors, blur validation and focus order` | `66d55d8`; `b04d3d0` |
| R8 | `odc-form.test.tsx::R8: progressive comments, dense fields and total hierarchy` | `66d55d8`; `b04d3d0` |
| R9 | `register-payment-form.test.tsx::R6,R9: payment field validation, focus and confirm footer`; `date-picker.test.tsx::R9: DatePicker blur, ARIA and focus passthrough` | `66d55d8`; `b04d3d0` |
| R10 | `payment-evidence-form.test.tsx::R6,R10: immediate evidence validation and accessible focus` | `66d55d8`; `b04d3d0` |
| R11 | `upload-invoice-form.test.tsx::R6,R11: invoice field validation and focus order`; `upload-invoice-form.test.tsx::R5: explicit completion confirmation` | `66d55d8`; `b04d3d0` |
| R12 | `login-form.test.tsx::R6,R12: login blur validation, focus and pending state` | `66d55d8`; `b04d3d0` |
| R13 | `toast.test.tsx::R13: semantic toast radius` | `66d55d8`; `b04d3d0` |
| R14 | `design-system.guardrails.test.ts::ui-surfaces-detail-forms R14: preservación transversal`; route, payload, retry, preview and toast characterizations above; `progress/verify_ui-surfaces-detail-forms.md` | `66d55d8`; `b04d3d0` |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(ui-surfaces-detail-forms): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
