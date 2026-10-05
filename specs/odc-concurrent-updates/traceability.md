---
feature: odc-concurrent-updates
status: in_progress
tags: [harness, spec]
---

# Trazabilidad — #36

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | `odc-concurrent-updates.e2e-spec.ts one winner in 13 races; purchase-order.typeorm.repository.spec.ts stale writes` | rojo `08441ef`; CAS `f6a1f9c`; rojo fechas/DTO `528281d` → hidratación nativa en siguiente commit |
| R2 | `odc-concurrent-updates.e2e-spec.ts single history and rollback on bad history FK` | rojo `08441ef`; CAS `f6a1f9c`; rojo fechas/DTO `528281d` → hidratación nativa en siguiente commit |
| R3 | `odc-concurrent-updates.http.spec.ts 32 HTTP cases (8 new409,24 existing401/403/404)` | rojo `08441ef`; CAS `f6a1f9c`; rojo fechas/DTO `528281d` → hidratación nativa en siguiente commit |
| R4 | `odc-concurrent-updates.e2e-spec.ts two PostgreSQL connections and barrier across all eight mutations` | rojo `08441ef`; CAS `f6a1f9c`; rojo fechas/DTO `528281d` → hidratación nativa en siguiente commit |
| R5 | `odc-concurrent-updates.e2e-spec.ts version0/new version/stale reuse and additive SQL idempotence` | rojo `08441ef`; CAS `f6a1f9c`; rojo fechas/DTO `528281d` → hidratación nativa en siguiente commit |
| R6 | pendiente | pendiente |

Primer verde: 40 tests repositorio/HTTP y 16 PostgreSQL. Auto-revisión añadió
comparación de fechas: RETURNING crudo devuelve DATE como Date, rompiendo
el contrato de cadena. Nueva prueba roja 2 fallos / 14 verdes exige corregir
hidratación antes de cierre. No se declara done con este hallazgo abierto.

Verde definitivo: 49 tests unit/HTTP/mapper y 16 PostgreSQL. SQL aditivo
probado sobre filas anteriores y repetido sin cambios de datos. Actualización
manager.update CAS y lectura ORM bajo la misma transacción conserva fechas
YYYY-MM-DD; token version interno omitido del DTO. Guías/init aún en curso.
