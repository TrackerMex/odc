---
feature: "odc-register-payment"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-register-payment]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `register-payment.dto.spec.ts::R1: RegisterPaymentDto requires paymentDate and paymentMethod, keeps paymentReference/paymentNotes optional` | `807c9cb` feat(odc-register-payment): add RegisterPaymentDto with paymentDate/paymentMethod validation (R1) |
| R2 | `register-payment.usecase.spec.ts::R2: register-payment transitions COMPRA_APROBADA to PAGO_REGISTRADO for DIRECTOR_OPS`; `odc.controller.spec.ts::R2: POST /api/odcs/:id/payment registers the payment with 200 restricted to DIRECTOR_OPS` | `438f301` feat(odc-register-payment): add RegisterPaymentUseCase and POST :id/payment route (R2,R3) |
| R3 | `register-payment.usecase.spec.ts::R3: register-payment rejects unknown ids and non-COMPRA_APROBADA statuses`; `odc.controller.spec.ts::R3: payment responds 404 for an unknown id and 409 outside COMPRA_APROBADA` | `438f301` feat(odc-register-payment): add RegisterPaymentUseCase and POST :id/payment route (R2,R3) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
