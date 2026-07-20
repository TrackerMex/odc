---
feature: "odc-budget-validation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-budget-validation]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — `POST /api/odcs/:id/approve-budget` (T3): éxito ADMINISTRACION, 403 otro rol

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — approve-budget: 404 id inexistente, 409 si no está en PENDIENTE_ADMIN

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — `RejectOdcDto`: `rejectionReason` obligatorio no vacío, 400 si falta

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — `POST /api/odcs/:id/reject` (T4): éxito ADMINISTRACION, 403 otro rol

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — reject: 404 id inexistente, 409 estado sin regla, 403 ADMINISTRACION sobre PRESUPUESTO_APROBADO

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
