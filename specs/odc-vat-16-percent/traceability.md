---
feature: "odc-vat-16-percent"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Trazabilidad — [[odc-vat-16-percent]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/odc/domain/entities/purchase-order.vat.spec.ts::R1: VAT is rounded once on the subtotal of a new ODC` | `b685ee0 test(odc-vat-16-percent): cover VAT rounding on new orders (R1)` → `af1ca85 feat(odc-vat-16-percent): calculate VAT on new orders (R1)` |
| R2 | `backend/src/modules/odc/domain/entities/purchase-order.vat.spec.ts::R2: taxable orders recalculate on edit and retain amounts on transitions`; `backend/test/odc-concurrent-updates.e2e-spec.ts::R2: persists and reloads a new VAT breakdown with its line items` | `a13be80 test(odc-vat-16-percent): cover taxable order edits (R2)` → `bd67e9c feat(odc-vat-16-percent): recalculate VAT on order edits (R2)`; PostgreSQL regression `a478ef1` |
| R3 | `backend/src/modules/odc/domain/entities/purchase-order.vat.spec.ts::R3: historic orders preserve amounts until an old draft is saved`; PostgreSQL coverage in `backend/test/odc-concurrent-updates.e2e-spec.ts`; `frontend/src/components/odc/odc-form.test.tsx::R3: historical draft save and send recovery` | `9a3fdb7 test(odc-vat-16-percent): cover historical tax behavior (R3)` → `ef328ad feat(odc-vat-16-percent): apply VAT when old drafts are edited (R3)`; `a478ef1` PostgreSQL; `c562871` → `fe78d22` send recovery |
| R4 | `backend/src/modules/odc/infrastructure/mappers/purchase-order.vat.mapper.spec.ts::R4: VAT amounts persist and appear in authenticated ODC responses`; `backend/src/modules/odc/infrastructure/controller/odc-input-boundaries.http.spec.ts::R4: ignores client-supplied fiscal amounts and calculates VAT on the server`; `R4: ignores fiscal values supplied on PATCH` | `fad1eed test(odc-vat-16-percent): cover fiscal persistence and responses (R4)` → `c3f5e76 feat(odc-vat-16-percent): persist and expose fiscal amounts (R4)`; HTTP checks `5c9b48d`, `c55d653` |
| R5 | `frontend/src/components/odc/odc-form.test.tsx::R5: VAT preview for a historical draft`; `frontend/src/components/odc/odc-detail.test.tsx::R5: VAT breakdown in ODC detail`; `backend/src/modules/odc/application/use-cases/get-monthly-purchase-summary.usecase.spec.ts::R5: aggregates historical amounts and taxable gross totals once` | `aefe8b9 test(odc-vat-16-percent): cover VAT presentation (R5)`; `a2dc55d test(odc-vat-16-percent): update gross total expectation (R5)` → `21344d1 feat(odc-vat-16-percent): show fiscal breakdown in ODC views (R5)`; mixed totals `b255c02` |
| R6 | `backend/test/odc-vat-migration.e2e-spec.ts::R6: VAT migration preserves historic ODCs or rolls back`; `backend/test/odc-missing-line-items-reconcile.e2e-spec.ts::R6: reconcile missing historical lines before VAT migration` | `8c164a2 test(odc-vat-16-percent): cover fiscal backfill and rollback (R6)` → `94efc7b feat(odc-vat-16-percent): add historical fiscal backfill (R6)`; `84a4f6f` → `9eff775` prerequisite reconciliation; `5fed5a0` → `35b1965` existing-line guard; sequence test `c55d653`; revisión de integridad `6bab6a1` → `dc65dec`; espacios Unicode `cd68b20` → `9af0873` |
| R7 | `backend/src/modules/odc/domain/entities/purchase-order.vat.spec.ts::R7: VAT arithmetic and hydration respect storage limits` | `9b1c002 test(odc-vat-16-percent): cover fiscal limits and hydration (R7)` → `a540659 feat(odc-vat-16-percent): validate fiscal totals on hydration (R7)`; `2880dcf` → `36cf812` partial fiscal record validation; revisión `6bab6a1` → `dc65dec`, mensajes `a857519` → `d769149`, mocks `5009a36` |

El implementer registra el test y commit al cerrar cada requisito. El reviewer
no aprueba la feature si alguna fila permanece pendiente. Convención:
`feat(odc-vat-16-percent): <desc> (R1,R2)`.
