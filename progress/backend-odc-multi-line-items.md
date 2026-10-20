# Backend — ODC multi-line items

Backend R1–R6 implemented on `codex/odc-history-hydration-startup`.

## Commits

- R1 tests/model: `13e500c`, `5630741`, `09c21c2`, `89433ef`
- R2 tests/creation contract: `26002b9`, `4032cf6`
- R3 tests/PATCH behavior: `ab2d6c5`, `baa141f`
- R4 tests/validation boundaries: `6b2327a`, `a238ca3`
- R5 tests/persistence and counts: `52d2537`, `9650b4d`, `f062960`, `b74f9c8`, `3f448c7`, lint regression/type cleanup `03d6b40`
- R6 migration test/SQL: `9712219`, `fc2c3fc`, typed SQL query results `03d6b40`

## Main backend files

- Domain item collection, aggregate total, create/PATCH compatibility, and limits in `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`.
- Create/update item DTOs and use cases under `backend/src/modules/odc/application/`.
- Ordered child entity, transactional repository persistence, item response mapping, and `itemCount` projections under `backend/src/modules/odc/infrastructure/`.
- Versioned backfill in `backend/scripts/sql/040-odc-line-items.sql`.
- Isolated migration coverage in `backend/test/odc-line-items-migration.e2e-spec.ts`.

## Verification

- Backend `npm run build`: passed after R5.
- R1–R4 domain/input suites: 115/115 passed; HTTP boundary suite: 108/108 passed with loopback access escalated for the local test server.
- R5 focused verification: 10 suites, 51/51 tests passed, including repository, mapper, executive/monthly summaries, and existing repository regressions.
- R6 isolated PostgreSQL e2e: 1 suite, 2/2 passed. It verifies one-line backfill for three statuses, exact preservation of purchase-order headers and history, and rollback plus failing ODC identification for an inconsistent total. The UUID-named temporary Docker container was bound to an ephemeral loopback port and removed after each run.
- Full `./init.sh`: backend build passed; 84 suites / 935 tests passed; frontend build passed; 41 files / 697 tests passed; backend lint passed.

## Risks and deployment note

`040-odc-line-items.sql` takes an exclusive lock on `purchase_orders` while validating and backfilling. Run it with writes stopped. Any legacy row with an invalid total, nonpositive quantity/price, or blank description/unit aborts the transaction and reports its ODC id; reconcile that row before retrying.
