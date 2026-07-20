# impl: odc-budget-validation
Fecha: 2026-07-20

## Archivos creados
- backend/src/modules/odc/application/use-cases/approve-budget.usecase.ts — `ApproveBudgetUseCase`: T3 (`PENDIENTE_ADMIN` → `PRESUPUESTO_APROBADO`), `findById` → `order.transition('approve_budget', actor.role)` → historial → `repository.update`.
- backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts — tests R1, R2.
- backend/src/modules/odc/application/dto/reject-odc.dto.ts — `RejectOdcDto` con `rejectionReason: string` (`@IsString`, `@IsNotEmpty`).
- backend/src/modules/odc/application/dto/reject-odc.dto.spec.ts — tests R3.
- backend/src/modules/odc/application/use-cases/reject-odc.usecase.ts — `RejectOdcUseCase`: T4/T6 compartidos vía la acción de dominio `reject`, `findById` → `order.transition('reject', actor.role, data)` → historial con `note` = `rejectionReason` → `repository.update`.
- backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts — tests R3 (defensa en profundidad), R4, R5.

## Archivos modificados
- backend/src/modules/odc/infrastructure/controller/odc.controller.ts — se añaden `POST :id/approve-budget` (`@Roles('ADMINISTRACION')`, `@HttpCode(200)`) y `POST :id/reject` (`@Roles('ADMINISTRACION')`, `@HttpCode(200)`, body `RejectOdcDto`), ambos reusando `actorFrom()` y `rethrowDomainError()` ya existentes. Se inyectan `ApproveBudgetUseCase` y `RejectOdcUseCase` en el constructor.
- backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts — se añaden `approveBudgetUseCase`/`rejectOdcUseCase` a `ControllerOverrides`/`createController`, y los describe blocks `R1`, `R2`, `R4`, `R5` a nivel controller (metadata de ruta/rol/HTTP code, delegación al use-case, traducción de errores de dominio a HTTP).
- backend/src/modules/odc/odc.module.ts — se registran `ApproveBudgetUseCase` y `RejectOdcUseCase` como providers (mismo token `'PurchaseOrderRepository'`, sin tokens nuevos).
- specs/odc-budget-validation/traceability.md — las 5 filas actualizadas con test y commit, sin "pendiente".

## Requisitos cubiertos
- R1: test `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R1: approve-budget transitions PENDIENTE_ADMIN to PRESUPUESTO_APROBADO for ADMINISTRACION` + `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R1: POST /api/odcs/:id/approve-budget approves the budget with 200 restricted to ADMINISTRACION`, commit `d2399ac`
- R2: test `backend/src/modules/odc/application/use-cases/approve-budget.usecase.spec.ts::R2: approve-budget rejects unknown ids and non-PENDIENTE_ADMIN statuses` + `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R2: approve-budget responds 404 for an unknown id and 409 outside PENDIENTE_ADMIN`, commit `d2399ac`
- R3: test `backend/src/modules/odc/application/dto/reject-odc.dto.spec.ts::R3: RejectOdcDto requires a non-empty rejectionReason` (commit `c6bfbb0`) + `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R3: reject requires rejectionReason (defense in depth below the DTO)` (commit `77713de`)
- R4: test `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R4: reject transitions PENDIENTE_ADMIN to RECHAZADA for ADMINISTRACION` + `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION`, commit `77713de`
- R5: test `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts::R5: reject rejects unknown ids, non-rejectable statuses and role mismatch on PRESUPUESTO_APROBADO` + `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION`, commit `77713de`

Commit adicional `28f35ea` (docs): actualiza traceability.md con los hashes finales de R3/R4/R5.

## Decisiones de diseño
- Sin chequeo de creador en ninguno de los dos use-cases (a diferencia de `SubmitOdcUseCase`): `approve_budget` y `reject` los ejecuta cualquier `ADMINISTRACION`, tal como especifica design.md — no hay comparación `order.createdById !== actor.userId`.
- `RejectOdcUseCase.execute` recibe `TransitionData` completo (no solo `rejectionReason` como string suelto) para pasar directo a `order.transition('reject', role, data)`, igual patrón que otros use-cases con datos de transición.
- Test adicional bajo `describe('R3: ...')` en `reject-odc.usecase.spec.ts`: invoca el use-case con `rejectionReason: undefined` para verificar que `MissingTransitionDataError` (→ 400) se propaga incluso si el DTO no filtrara el dato — defensa en profundidad ya existente en el dominio, sin lógica nueva en el use-case. Referenciado en la fila R3 de traceability junto al test del DTO.
- No se repite ninguna regla de rol/estado fuera del dominio: ambos use-cases son `findById` → `transition()` → `update()`, igual que `SubmitOdcUseCase`. El caso "R5: ADMINISTRACION sobre PRESUPUESTO_APROBADO → 403" no requiere código adicional: `PurchaseOrder.transition('reject', 'ADMINISTRACION')` encuentra la regla T6 (rol `DIRECTOR_GENERAL`) por `from: 'PRESUPUESTO_APROBADO'` y lanza `InvalidRoleTransitionError` por mismatch de rol, ya traducido a 403 por `rethrowDomainError()`.
- No se tocó `domain/`, `domain/repositories/`, entidades ORM ni el repositorio TypeORM, según lo pactado en design.md.

## Output de build
```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build

(sin errores, sin warnings)
```

## Output de tests
```
> backend@0.0.1 test C:\Users\alex\Documents\sites\odc\backend
> jest

Test Suites: 32 passed, 32 total
Tests:       256 passed, 256 total
Snapshots:   0 total
Time:        5.416 s
```
(baseline previo: 220 tests reportados por el leader más 15 (R1,R2: 10 use-case + 5 controller) + 4 (R3 DTO) + 11 (R4,R5 use-case, incluye el test extra de R3) + 6 (R4,R5 controller) = 256. Coincide exactamente, cero regresiones.)

## Output de lint
```
> backend@0.0.1 lint C:\Users\alex\Documents\sites\odc\backend
> eslint "{src,apps,libs,test}/**/*.ts" --fix

(sin errores)
```

## Notas para el reviewer
- Confirmar que la fila R3 de traceability.md, que referencia dos tests en dos commits distintos (`c6bfbb0` y `77713de`), es aceptable — sigue el mismo patrón multi-test/multi-commit ya usado en `specs/odc-create-draft/traceability.md` (p. ej. su fila R2 y R5).
- El endpoint `/reject` queda mecánicamente listo para T6 (rol `DIRECTOR_GENERAL`, estado `PRESUPUESTO_APROBADO`) tal como pauta design.md, pero esta feature no añade `@Roles('DIRECTOR_GENERAL')` ni tests para T6 — eso es explícitamente feature 5 (`odc-purchase-approval`), fuera de alcance aquí.
- No se creó ningún error de dominio nuevo; se reutilizan `InvalidRoleTransitionError` (403), `InvalidStatusTransitionError` (409), `MissingTransitionDataError` (400) y `OdcNotFoundError` (404), ya traducidos por `rethrowDomainError()` en `odc.controller.ts`.
- Todo el trabajo quedó completo, sin partes a medias. Working tree limpio, sin push a origin.
