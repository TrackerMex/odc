# impl: odc-multi-line-items
Fecha: 2026-10-20

## Archivos creados

- `backend/src/modules/odc/application/dto/line-item-format.constraint.ts` y `odc-line-item.dto.ts` — validación y restricción mutuamente excluyente para `items[]` y campos escalares.
- `backend/src/modules/odc/domain/entities/purchase-order.line-items.spec.ts` y `purchase-order.line-items.boundaries.spec.ts` — cálculo del total, proyección de compatibilidad y límites.
- `backend/src/modules/odc/infrastructure/entities/purchase-order-line-item.orm-entity.ts` — entidad hija ordenada con relación a ODC.
- Specs backend de DTO/use-case, mapper, repositorio y conteos compactos bajo `backend/src/modules/odc/` — creación, edición, persistencia, lectura y validación.
- `backend/scripts/sql/040-odc-line-items.sql` — backfill transaccional de órdenes existentes.
- `backend/test/odc-line-items-migration.e2e-spec.ts` — backfill y rollback sobre PostgreSQL aislado.

## Archivos modificados

- `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` — agregado canónico de partidas, total calculado y compatibilidad escalar.
- `backend/src/modules/odc/application/dto/` y `application/use-cases/` — contratos para crear y reemplazar partidas al editar.
- `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts` — campos `itemCount` de los resúmenes compactos.
- `backend/src/modules/odc/infrastructure/entities/`, `mappers/`, `repositories/` y `odc.module.ts` — almacenamiento transaccional, orden, respuestas `items[]` y conteos.
- `frontend/src/lib/odc.ts` — tipos, validación, cálculo de totales y helpers compatibles con respuestas antiguas.
- `frontend/src/components/odc/odc-form.tsx` y `odc-detail.tsx` — alta/edición, agregar/quitar, revisión, recuperación ante error y detalle ordenado.
- `frontend/src/components/odc/executive-task-table.tsx`, `executive-dashboard.tsx`, `monthly-summary.tsx` y `monthly-summary-slide.tsx` — conteo junto al resumen compacto de primera partida.
- Tests existentes de ODC/dashboards — fixtures actualizados para el contrato y conteos nuevos.

## Requisitos cubiertos

- R1: `purchase-order.line-items.spec.ts::R1: purchase orders calculate their total from ordered line items`; commits `13e500c`, `5630741`, `09c21c2`, `89433ef`.
- R2: `create-odc.line-items.spec.ts::R2: create DTO accepts either line items or the legacy scalar contract`; `create-draft.line-items.spec.ts::R2: create use-case persists normalized line items as a draft`; commits `26002b9`, `4032cf6`.
- R3: `update-odc.line-items.spec.ts::R3: update DTO treats items as a nonempty full replacement`; `update-draft.line-items.spec.ts::R3: update use-case replaces items or applies legacy changes to the first`; commits `ab2d6c5`, `baa141f`.
- R4: `odc-line-item.dto.spec.ts::R4: nested line-item input validates fields and integer bounds`; `purchase-order.line-items.boundaries.spec.ts::R4: domain validates each item and the aggregate total`; commits `6b2327a`, `a238ca3`.
- R5: mapper, repository, monthly summary and frontend tests listed in `specs/odc-multi-line-items/traceability.md`; commits `52d2537`, `9650b4d`, `b74f9c8`, `f062960`, `3f448c7`, `365f0f2`, `e34ad01`, `bada31c`, `e870b1f`, `762e8c0`, `0237907`, `3cb4860`, `03d6b40`.
- R6: `odc-line-items-migration.e2e-spec.ts::R6: versioned line-item migration preserves old ODC data`; commits `9712219`, `fc2c3fc`, `03d6b40`.
- R7: `odc-form.test.tsx::R7: adds and removes line items, keeps one line, and sends the ordered collection`; `odc-form.test.tsx::R7: preserves every line after a save failure so the user can correct and retry`; commits `365f0f2`, `0237907`, `3cb4860`.

## Decisiones de diseño

- La ODC conserva proveedor y comentarios en la cabecera; las partidas viven en una tabla hija con `position` y unicidad por orden/posición.
- `items[]` es canónico al persistir y responder. Los campos escalares existentes proyectan la primera partida para mantener clientes previos.
- Crear y reemplazar header/partidas se ejecuta en transacción; el backfill valida totales antiguos antes de crear tabla e insertar filas.
- Los importes se guardan como centavos y todavía no incluyen IVA; IVA, cotizaciones y concentrado semanal pertenecen a features posteriores aprobadas por separado.

## Output de build

```text
Backend npm run build: aprobado.
Frontend Vite production build: aprobado.
ESLint y Prettier de los archivos frontend de producción: aprobados.
tsc --noEmit: quedan 16 errores en tests sin modificar por esta feature; los archivos odc-form.test.tsx y odc-detail.test.tsx ya no generan errores. Ver progress/frontend-odc-multi-line-items.md.
./init.sh: build backend/frontend aprobado; scripts 34/34; backend 84 suites / 935 tests; frontend 41 archivos / 697 tests; lint backend aprobado.
```

## Output de tests

```text
Backend R1–R4: 115/115 tests de dominio/entrada; suite HTTP de límites: 108/108 con acceso loopback escalado.
Backend R5: 10 suites, 51/51 tests.
Backend R6 PostgreSQL aislado: 1 suite, 2/2 tests; backfill de tres estados y rollback por ODC inconsistente.
Frontend: 6 archivos, 96/96 tests dirigidos.
```

## Notas para el reviewer

- `040-odc-line-items.sql` toma un lock exclusivo de `purchase_orders`; ejecutar con escrituras detenidas. Si hay datos históricos inconsistentes, aborta en la transacción y reporta el id de ODC.
- La verificación visual Playwright quedó bloqueada porque el puerto `5432` ya lo ocupa `pet-tracker-postgres`. El intento fallido dejó `odc-backend-1` y `odc-frontend-1` en estado Created; ambos se retiraron. El contenedor ajeno y el `odc-db-1` que ya existía quedaron intactos.
- La revisión independiente inicial encontró una expectativa obsoleta en el dashboard y un mensaje frontend fuera de convención. Se corrigió la prueba (`3f448c7`), se reescribió el mensaje del commit frontend (`3cb4860`) y se actualizaron hashes en traceability.
- La segunda revisión independiente C2–C6 queda pendiente.
