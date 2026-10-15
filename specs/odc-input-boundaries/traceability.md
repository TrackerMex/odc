---
feature: odc-input-boundaries
status: done
tags: [harness, spec]
---

# Trazabilidad — #37

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | `purchase-order.boundaries.spec.ts::R1 limits/product/atomic partial edits; odc-input-boundaries.http.spec.ts::R1 create/PATCH no writes` | rojo `0013ba7`; verde `6a64b0c` |
| R2 | `purchase-order.boundaries.spec.ts::R2 three calendar fields; odc-input-boundaries.http.spec.ts::R2 strict dates and zero upload/persistence` | rojo `0013ba7`; verde `6a64b0c` |
| R3 | `odc-input-boundaries.http.spec.ts::R3 all11 :id endpoints,401/403/404 and UUIDv1/v4/v5/v7` | rojo `0013ba7`; verde `6a64b0c` |
| R4 | `odc-input-boundaries.http.spec.ts::R4` integración; init exit0 (836 backend /661 frontend), typecheck igual70previos, auto-revisión y guía | cierre `54995dc` |

Rojo104fallos/88verdes → verde192/192, dominio y HTTP reales. Guards
existentes se caracterizaron sin introducir rojos artificiales. La prueba de
año0001 detectó un fallo en IsDateString strict; ValidateBy nativo reutiliza
el mismo predicado puro del dominio. Sin nueva dependencia ni marco propio.
