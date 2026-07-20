---
feature: "odc-create-draft"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-create-draft]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — Entidad de dominio `PurchaseOrder` pura con status restringido

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — `totalCents` calculado en el dominio, nunca aceptado del cliente

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — `transition(action, role, data)`: las 10 transiciones válidas T1–T10

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Errores de dominio: rol (403), estado (409), datos faltantes; sin mutar

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — Persistencia: `purchase_orders` + `odc_status_history` en una transacción

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — Numeración `ODC-YYYY-NNNNN` con reinicio anual y reintento ante colisión

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — `POST /api/odcs` (T1): crea `BORRADOR`, 201; 403 si no es DIRECTOR_OPS

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R8 — Validación de entrada: 400 en create/edit con datos inválidos

- [ ] (1) Escribir test que falla para R8
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R9 — `POST /api/odcs/:id/submit` (T2): `BORRADOR` → `PENDIENTE_ADMIN`, solo creador

- [ ] (1) Escribir test que falla para R9
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R10 — Submit desde `RECHAZADA` (T10): reenvío con historial conservado; 409 en otros estados

- [ ] (1) Escribir test que falla para R10
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R11 — `PATCH /api/odcs/:id`: edición en `BORRADOR`/`RECHAZADA`, solo creador

- [ ] (1) Escribir test que falla para R11
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R12 — `GET /api/odcs`: lista paginada con visibilidad de `BORRADOR` solo creador

- [ ] (1) Escribir test que falla para R12
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R13 — `GET /api/odcs/:id`: detalle con historial; 404 inexistente, 403 borrador ajeno

- [ ] (1) Escribir test que falla para R13
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
