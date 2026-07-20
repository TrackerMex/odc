---
feature: "odc-purchase-approval"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-purchase-approval]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — `POST /api/odcs/:id/approve-purchase` (T5): éxito DIRECTOR_GENERAL, 403 otro rol

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — approve-purchase: 404 id inexistente, 409 si no está en PRESUPUESTO_APROBADO

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — `POST /api/odcs/:id/reject`: metadata de roles ampliada a ADMINISTRACION + DIRECTOR_GENERAL

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — reject (T6): éxito DIRECTOR_GENERAL sobre PRESUPUESTO_APROBADO

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — reject (T4): regresión, ADMINISTRACION sobre PENDIENTE_ADMIN sigue funcionando tras R3

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — reject: 403 por mismatch de rol (DIRECTOR_GENERAL en PENDIENTE_ADMIN; ADMINISTRACION en PRESUPUESTO_APROBADO)

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — reject: 404 id inexistente y 409 estado sin regla, para actor DIRECTOR_GENERAL

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
