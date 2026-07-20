# impl: odc-purchase-approval
Fecha: 2026-07-20

## Archivos creados
- backend/src/modules/odc/application/use-cases/approve-purchase.usecase.ts — `ApprovePurchaseUseCase` (T5: `PRESUPUESTO_APROBADO` -> `COMPRA_APROBADA`), copia estructural exacta de `ApproveBudgetUseCase`.
- backend/src/modules/odc/application/use-cases/approve-purchase.usecase.spec.ts — tests R1 (éxito DIRECTOR_GENERAL + 403 otro rol) y R2 (404 id inexistente + 409 en los 7 estados restantes).

## Archivos modificados
- backend/src/modules/odc/infrastructure/controller/odc.controller.ts — añade handler `POST :id/approve-purchase` (`@HttpCode(200)` + `@Roles('DIRECTOR_GENERAL')`) inyectando `ApprovePurchaseUseCase`; amplía `@Roles(...)` del handler `reject` de `('ADMINISTRACION')` a `('ADMINISTRACION', 'DIRECTOR_GENERAL')`. El cuerpo de `reject` no cambió.
- backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts — añade/reestructura tests: R1/R2 (approve-purchase), R3 (metadata `ROLES_KEY` de `reject`), R4 (T6 éxito DIRECTOR_GENERAL), R5 (regresión T4 ADMINISTRACION), R6 (403 por mismatch de rol en ambos sentidos); conserva cobertura 404/409 preexistente de `reject`.
- backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts — añade tests R4, R5, R6, R7 sobre `RejectOdcUseCase` (sin cambios de código: ya era agnóstico de rol).
- backend/src/modules/odc/odc.module.ts — registra `ApprovePurchaseUseCase` como provider, reutilizando el token `'PurchaseOrderRepository'` existente.
- specs/odc-purchase-approval/traceability.md — filas R1-R7 completadas con test y hash de commit.

Sin cambios en `domain/`, `domain/repositories/`, entidades ORM, repositorio TypeORM, `RejectOdcDto`, `RolesGuard` ni el decorator `@Roles`, tal como exige la spec.

## Requisitos cubiertos
- R1: tests `approve-purchase.usecase.spec.ts::R1`, `odc.controller.spec.ts::R1`, commit `92acb63`
- R2: tests `approve-purchase.usecase.spec.ts::R2`, `odc.controller.spec.ts::R2`, commit `92acb63`
- R3: test `odc.controller.spec.ts::R3`, commit `485cc78`
- R4: tests `reject-odc.usecase.spec.ts::R4`, `odc.controller.spec.ts::R4`, commit `13d0aa6`
- R5: tests `reject-odc.usecase.spec.ts::R5`, `odc.controller.spec.ts::R5`, commit `13d0aa6`
- R6: tests `reject-odc.usecase.spec.ts::R6`, `odc.controller.spec.ts::R6`, commit `13d0aa6`
- R7: test `reject-odc.usecase.spec.ts::R7`, commit `13d0aa6`

Commits de trazabilidad: `977c9d7` (R1,R2), `acdb4ae` (R3), `88b7b80` (R4-R7).

## Decisiones de diseño
- `ApprovePurchaseUseCase` es copia estructural exacta de `ApproveBudgetUseCase`: mismo flujo `findById` -> `OdcNotFoundError` -> `order.transition('approve_purchase', actor.role)` -> `OdcStatusHistoryEntry` -> `repository.update`, sin chequeo de creador, siguiendo el patrón ya aprobado (T3).
- T6 se habilitó ampliando `@Roles` del handler `reject` ya existente en vez de crear ruta/use-case nuevos: `RejectOdcUseCase` ya pasaba `actor.role` sin hardcodear roles, y `PurchaseOrder.transition()` ya resuelve la regla T4 o T6 aplicable según `from === this.status`, así que ampliar la metadata del guard fue el único cambio de código necesario.
- Reestructuré los describe blocks de `reject` en `odc.controller.spec.ts` (reetiquetando los antiguos R4/R5 de `odc-budget-validation`, cuyos números coinciden con los R-ids de esta feature sobre la misma ruta) para que cada describe nombre unívocamente el requisito R3-R6 de `odc-purchase-approval` que verifica, conservando toda la cobertura 404/409 preexistente en un describe sin R-id (no requerido por esta spec a nivel de controller, ver R7).
- Los tests nuevos de R4-R7 en `reject-odc.usecase.spec.ts` y las adiciones equivalentes en el controller no requirieron cambios de código de producción (dominio y use-case ya soportaban T6 desde `odc-create-draft`); aun así se siguió rojo-verde escribiendo el test primero y confirmando su paso, sin production code intermedio que lo hiciera fallar por diseño — el "rojo" real de esta tanda ocurrió únicamente a nivel de compilación/import antes de aplicar la implementación mínima en R1/R2 y R3.

## Output de build
```
> backend@0.0.1 build
> nest build
(sin errores)

> frontend@ build
> vite build
✓ built in 383ms (client) / 506ms (ssr)
```

## Output de tests
```
$ pnpm test (backend)
Test Suites: 33 passed, 33 total
Tests:       285 passed, 285 total

$ pnpm test --passWithNoTests (frontend)
No test files found, exiting with code 0
```

`./init.sh` completo: build OK, tests OK (285 backend + 0 frontend), lint sin errores. Único warning esperado: "Feature en progreso: odc-purchase-approval" (gestión de `feature_list.json` corresponde al leader).

## Notas para el reviewer
- Verificar especialmente la doble capa de autorización en `reject`: `RolesGuard` ahora deja pasar `DIRECTOR_GENERAL` y `ADMINISTRACION`, pero `PurchaseOrder.transition()` sigue exigiendo el rol correcto por estado (`InvalidRoleTransitionError` -> 403) — cubierto por R6 (ambas combinaciones cruzadas).
- Revisar el reetiquetado de describes en `odc.controller.spec.ts` (líneas ~517-650): los R3-R6 ahí corresponden a los R-ids de `odc-purchase-approval`, no a los R-ids preexistentes de `odc-budget-validation` que compartían la misma ruta `/reject` y los mismos números.
- No se tocó `RejectOdcDto` ni `RejectOdcUseCase`: confirmado que ya eran agnósticos de rol antes de esta feature.
