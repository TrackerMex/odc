---
feature: "odc-register-payment"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-register-payment]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — `RegisterPaymentDto`: paymentDate/paymentMethod obligatorios, paymentReference/paymentNotes opcionales, 400 si faltan o son inválidos

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — `POST /api/odcs/:id/payment` (T7): éxito DIRECTOR_OPS con y sin campos opcionales, 403 otro rol

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — payment: 404 id inexistente, 409 si no está en COMPRA_APROBADA

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
