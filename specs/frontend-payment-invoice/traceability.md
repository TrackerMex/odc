---
feature: "frontend-payment-invoice"
status: approved        # draft | approved
tags: [frontend, director-ops, odc, spec]
---

# Trazabilidad — [[frontend-payment-invoice]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | register-payment-form.test.tsx::R1: register payment form visibility and fields | 45a3536 test(frontend-payment-invoice): add register payment form and API contract tests (R1,R2,R3,R4,R11); f31f99d feat(frontend-payment-invoice): add register payment form and API client (R1,R2,R3,R4,R11) |
| R2 | register-payment-form.test.tsx::R2: required field validation on register payment | 45a3536 test(frontend-payment-invoice): add register payment form and API contract tests (R1,R2,R3,R4,R11); f31f99d feat(frontend-payment-invoice): add register payment form and API client (R1,R2,R3,R4,R11) |
| R3 | register-payment-form.test.tsx::R3: register payment submission and confirmed transition; odc-api.test.ts::R3: registerPayment JSON contract | 45a3536 test(frontend-payment-invoice): add register payment form and API contract tests (R1,R2,R3,R4,R11); f31f99d feat(frontend-payment-invoice): add register payment form and API client (R1,R2,R3,R4,R11) |
| R4 | register-payment-form.test.tsx::R4: recoverable errors on register payment | 45a3536 test(frontend-payment-invoice): add register payment form and API contract tests (R1,R2,R3,R4,R11); f31f99d feat(frontend-payment-invoice): add register payment form and API client (R1,R2,R3,R4,R11) |
| R5 | upload-invoice-form.test.tsx::R5: upload invoice form visibility and fields | 9a05986 test(frontend-payment-invoice): add upload invoice form and API contract tests (R5,R6,R7,R8,R11); f7cf878 feat(frontend-payment-invoice): add upload invoice form (R5,R6,R7,R8,R11) |
| R6 | upload-invoice-form.test.tsx::R6: file and warehouse entry date validation | 9a05986 test(frontend-payment-invoice): add upload invoice form and API contract tests (R5,R6,R7,R8,R11); f7cf878 feat(frontend-payment-invoice): add upload invoice form (R5,R6,R7,R8,R11) |
| R7 | upload-invoice-form.test.tsx::R7: invoice submission and confirmed transition; odc-api.test.ts::R7: uploadInvoice multipart contract | 9a05986 test(frontend-payment-invoice): add upload invoice form and API contract tests (R5,R6,R7,R8,R11); f7cf878 feat(frontend-payment-invoice): add upload invoice form (R5,R6,R7,R8,R11) |
| R8 | upload-invoice-form.test.tsx::R8: recoverable errors on upload invoice | 9a05986 test(frontend-payment-invoice): add upload invoice form and API contract tests (R5,R6,R7,R8,R11); f7cf878 feat(frontend-payment-invoice): add upload invoice form (R5,R6,R7,R8,R11) |
| R9 | odc-detail.test.tsx::R9: COMPLETADA badge and invoice information block; register-payment-form.test.tsx::R9: hidden once the ODC reaches COMPLETADA; upload-invoice-form.test.tsx::R9: hidden once the ODC reaches COMPLETADA | a09682e test(frontend-payment-invoice): add COMPLETADA invoice info block tests (R9); fb18a4d feat(frontend-payment-invoice): show invoice information block on COMPLETADA (R9) |
| R10 | odc.test.ts::R10: file download route builder; odc-detail.test.tsx::R10: evidence and invoice download links | f8a014b test(frontend-payment-invoice): add evidence and invoice download link tests (R10); 456a0d0 feat(frontend-payment-invoice): add evidence and invoice download links (R10) |
| R11 | register-payment-form.test.tsx::R11: loading state and accessibility of register payment; upload-invoice-form.test.tsx::R11: loading state and accessibility of upload invoice | 45a3536 test(frontend-payment-invoice): add register payment form and API contract tests (R1,R2,R3,R4,R11); f31f99d feat(frontend-payment-invoice): add register payment form and API client (R1,R2,R3,R4,R11); 9a05986 test(frontend-payment-invoice): add upload invoice form and API contract tests (R5,R6,R7,R8,R11); f7cf878 feat(frontend-payment-invoice): add upload invoice form (R5,R6,R7,R8,R11) |
| R12 | register-payment-form.test.tsx::R12: role x status boundary for register payment; upload-invoice-form.test.tsx::R12: role x status boundary for upload invoice; odc-detail.test.tsx::R12: responsive layout of the download links row | 1f823b7 test(frontend-payment-invoice): add role/status boundary and responsive layout tests (R12); adb0b91 feat(frontend-payment-invoice): compose payment and invoice forms and enforce role/status boundary (R12) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(frontend-payment-invoice): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).

## Nota v2 (recomposición TDD tras rechazo C4)

Cada requisito lista ahora un par de commits `test(...)` (rojo) →
`feat(...)` (verde), en vez de un único commit que mezclaba test e
implementación. Ver `progress/impl_frontend-payment-invoice.md` para el
detalle de verificación rojo→verde por grupo y el respaldo de la v1 en
`backup/frontend-payment-invoice-pre-rewrite-20260723`.
