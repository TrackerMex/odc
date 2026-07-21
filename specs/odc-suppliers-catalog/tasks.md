---
feature: "odc-suppliers-catalog"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-suppliers-catalog]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — Entidad de dominio `Supplier` pura

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — Persistencia: tabla `suppliers` + `SupplierRepository` por token string

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — Seed idempotente del catálogo completo (22 nombres)

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — `GET /api/suppliers`: lista alfabética, 200, cualquier rol autenticado

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — Validación de `supplier` contra el catálogo en create/update de ODC; 400 si no matchea

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
