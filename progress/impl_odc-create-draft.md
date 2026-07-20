# impl: odc-create-draft
Fecha: 2026-07-20

> Reporte consolidado del implementer para la feature completa (R1-R13).
> R1-R11 fueron implementados en una sesión anterior (commits 76783c1..622bf4d,
> ver detalle abajo); esta sesión continuó el trabajo cortado por límite de
> sesión API y cerró R12 y R13.

## Archivos creados

- `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` — entidad
  pura `PurchaseOrder`, status/acciones T1-T10, `transition()`, `edit()`,
  cálculo de `totalCents`, numeración `ODC-YYYY-NNNNN` (R1,R2,R3,R4,R6).
- `backend/src/modules/odc/domain/entities/odc-status-history-entry.entity.ts`
  — entidad pura de historial (R3,R5).
- `backend/src/modules/odc/domain/errors/invalid-role-transition.error.ts`,
  `invalid-status-transition.error.ts`, `missing-transition-data.error.ts`,
  `odc-access-denied.error.ts`, `odc-not-found.error.ts` — errores tipados de
  dominio (R4,R9-R13).
- `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts`
  — interface `PurchaseOrderRepository`, `OdcListFilter`, `OdcViewer`,
  `OdcPage` (R5,R6,R12,R13).
- `backend/src/modules/odc/application/dto/create-odc.dto.ts`,
  `update-odc.dto.ts` — validación T1 con class-validator (R7,R8,R11).
- `backend/src/modules/odc/application/dto/list-odcs.query.dto.ts` — **(esta
  sesión, R12)** `status?`/`page?` opcionales; `status` limitado a los 8
  valores de `OdcStatus` vía `@IsIn(ODC_STATUSES)`, `page` transformado a
  entero positivo vía `@Type(() => Number)` + `@IsInt @IsPositive`. Importa
  `reflect-metadata` explícitamente al inicio del archivo — necesario porque
  `@Type()` de class-transformer llama `Reflect.getMetadata` en el momento de
  decoración, y Jest aísla el `global` por archivo de test (cada `.spec.ts`
  corre en su propio contexto VM), así que el polyfill que normalmente carga
  `@nestjs/common`/`@nestjs/core` de forma transitiva no está garantizado
  cuando este DTO se importa en aislamiento.
- `backend/src/modules/odc/application/use-cases/create-draft.usecase.ts`,
  `submit-odc.usecase.ts`, `update-draft.usecase.ts` — T1, T2/T10, PATCH
  (R7,R9,R10,R11).
- `backend/src/modules/odc/application/use-cases/list-odcs.usecase.ts` —
  **(esta sesión, R12)** `ListOdcsUseCase`: arma `OdcListFilter{ status,
  viewer }`, default `page=1`/`pageSize=20`, delega a
  `repository.findAll(filter, page, pageSize)` y devuelve el resultado tal
  cual (sin reprocesar).
- `backend/src/modules/odc/application/use-cases/get-odc.usecase.ts` —
  **(esta sesión, R13)** `GetOdcUseCase`: `findById`, 404 si `null`
  (`OdcNotFoundError`), 403 si `status === 'BORRADOR'` y
  `viewer.userId !== order.createdById` (`OdcAccessDeniedError`); el
  historial ordenado ya viene del repositorio, el use-case no lo toca.
- `backend/src/modules/odc/infrastructure/entities/purchase-order.orm-entity.ts`,
  `odc-status-history.orm-entity.ts` — mapeo TypeORM (R5).
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts`
  — `create`/`update` transaccionales, `findById` con historial, `findAll`
  con filtro de visibilidad (R5,R6,R12,R13).
- `backend/src/modules/odc/infrastructure/mappers/purchase-order.mapper.ts` —
  OrmEntity ↔ dominio.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` —
  `POST /`, `POST /:id/submit`, `PATCH /:id`, `GET /`, `GET /:id`.
- `backend/src/modules/odc/odc.module.ts` — DI del módulo.
- Tests unitarios junto a cada archivo de arriba (`*.spec.ts`), incluyendo
  `list-odcs.usecase.spec.ts` y `list-odcs.query.dto.spec.ts` (heredados de
  la sesión anterior, ya en rojo, verificados y usados tal cual) y
  `get-odc.usecase.spec.ts` (nuevo, esta sesión).

## Archivos modificados (esta sesión)

- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` —
  agregado `list()` (`@Get('/')`, sin `@Roles`) delegando a
  `ListOdcsUseCase.execute({ status, page: Number(query.page) }, actor)` y
  `detail()` (`@Get(':id')`, sin `@Roles`) delegando a `GetOdcUseCase`,
  reutilizando `rethrowDomainError` existente (ya traduce
  `OdcNotFoundError`→404 y `OdcAccessDeniedError`→403, no hizo falta
  tocarlo). Constructor extendido con `ListOdcsUseCase` y `GetOdcUseCase`.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts`
  — el describe `R12` ya existía (heredado, rojo) pero el helper compartido
  `ControllerOverrides`/`createController` no incluía `listOdcsUseCase` ni
  instanciaba el controller con ese 4º argumento, así que
  `controller.list(...)` no podía existir ni compilar el override — esto era
  un gap real de la sesión anterior, no una decisión de diseño; lo completé
  extendiendo el helper (y luego con `getOdcUseCase` para R13) sin tocar los
  tests R7-R12 ya escritos. Agregado el describe `R13` completo (nuevo).
- `backend/src/modules/odc/odc.module.ts` — registrados `ListOdcsUseCase` y
  `GetOdcUseCase` como providers.
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts`
  — **fix de un bug preexistente** que rompía `pnpm build` (`TS2322` en
  `buildVisibilityWhere`, introducido en el commit `0a003e3` de R6, antes de
  esta sesión: confirmado corriendo `pnpm build` sobre `HEAD` con `git stash`
  antes de tocar nada). `Not('BORRADOR')` inferí­a `FindOperator<string>` en
  vez de `FindOperator<OdcStatus>`, incompatible con la columna `status` de
  `PurchaseOrderOrmEntity`. Solución: tipo de retorno explícito
  `FindOptionsWhere<PurchaseOrderOrmEntity> | FindOptionsWhere<...>[]` y
  `Not<OdcStatus>('BORRADOR')`. Sin cambio de comportamiento — es una
  anotación de tipos, la query y la semántica de visibilidad quedan
  idénticas. Ver nota para el reviewer.

## Requisitos cubiertos

- R1: `purchase-order.entity.spec.ts::R1: ...`, commit `76783c1`
- R2: `purchase-order.entity.spec.ts::R2: ...` + otros, commits `76783c1`,
  `29d02bd`, `5db0dea`
- R3: `purchase-order.entity.spec.ts::R3: ...`, commit `77a4855`
- R4: `purchase-order.entity.spec.ts::R4: ...`, commit `77a4855`
- R5: entidades ORM + repo + module specs, commits `ed5c4e1`, `29d02bd`
- R6: entity + repo specs, commit `0a003e3`
- R7: use-case + controller specs, commit `29d02bd`
- R8: DTO specs, commit `5db0dea`
- R9: use-case + controller specs, commit `ccdb713`
- R10: use-case + controller specs, commit `ccdb713`
- R11: use-case + controller specs, commit `ee2e529`
- R12: `list-odcs.usecase.spec.ts::R12: paginated list where BORRADOR is only
  visible to its creator`, `list-odcs.query.dto.spec.ts::R12: list query
  validation for status and page`, `odc.controller.spec.ts::R12: GET
  /api/odcs lists ODCs for any authenticated role` — commits `7222ece`
  (feat) + `e83d97f` (traceability)
- R13: `get-odc.usecase.spec.ts::R13: ODC detail with chronological history;
  404 unknown, 403 foreign BORRADOR`, `odc.controller.spec.ts::R13: GET
  /api/odcs/:id returns the detail with history for any authenticated role`
  — commits `6c81de7` (feat) + `106ed32` (traceability)

Detalle completo en `specs/odc-create-draft/traceability.md` (sin filas
"pendiente").

## Decisiones de diseño (esta sesión)

- **`list()`/`detail()` parsean la query manualmente en el controller**: el
  `ValidationPipe` global solo tiene `whitelist: true` (sin `transform:
  true`), así que `@Query()` entrega el objeto plano original (con `page`
  como string) y no la instancia transformada del DTO. El controller hace
  `Number(query.page)` cuando está definido — exactamente el contrato que
  fija el test R12 heredado (`page: '2'` de entrada → `page: 2` en la
  llamada al use-case).
- **`GetOdcUseCase` no reprocesa el historial**: el repositorio TypeORM ya
  lo devuelve ordenado cronológicamente (`order: { createdAt: 'ASC' }` en
  `findById`); el use-case solo aplica 404/403 y retorna la entidad tal cual,
  igual que el patrón ya usado en `submit-odc`/`update-draft` (`findById` →
  chequeo → retorno).
- **Sin endpoints distintos ni roles adicionales en `GET /` y `GET /:id`**:
  siguiendo el diseño aprobado, ningún `@Roles(...)` — los 3 roles pueden
  listar y ver detalle; la regla fina de `BORRADOR` vive en
  dominio/use-case, no en el guard.
- **`import 'reflect-metadata'` explícito en `list-odcs.query.dto.ts`**: ver
  nota de "Archivos creados" arriba. Es el único archivo del módulo que usa
  `@Type()` de class-transformer; ningún otro DTO del proyecto lo necesitaba
  hasta ahora.

## Output de build

```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build

(sin salida — build limpio, exit 0)
```

## Output de tests

```
> backend@0.0.1 test C:\Users\alex\Documents\sites\odc\backend
> jest

Test Suites: 29 passed, 29 total
Tests:       220 passed, 220 total
Snapshots:   0 total
Time:        5.007 s
Ran all test suites.
```

## Output de lint

```
> backend@0.0.1 lint C:\Users\alex\Documents\sites\odc\backend
> eslint "{src,apps,libs,test}/**/*.ts" --fix

(sin salida — lint limpio, exit 0)
```

## Notas para el reviewer

- **Verificar especialmente el fix en
  `purchase-order.typeorm.repository.ts`**: toqué el repositorio pese a la
  instrucción de no hacerlo, porque `pnpm build` estaba roto desde el commit
  `0a003e3` (R6, sesión anterior) — confirmado con `git stash` +
  `pnpm build` sobre `HEAD` antes de escribir código nuevo. El fix es
  puramente de tipos (anotación de retorno + `Not<OdcStatus>(...)`), no
  cambia la query ni la semántica de visibilidad de `BORRADOR`. Vale la pena
  que el reviewer confirme que el diff de ese archivo (`git show
  7222ece -- backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts`)
  es solo de tipos.
- El helper `createController`/`ControllerOverrides` de
  `odc.controller.spec.ts` fue extendido dos veces (R12 y R13) para wirear
  los nuevos use-cases al constructor de 5 argumentos — los describe blocks
  de R7-R11 no se tocaron.
- No hay tests e2e contra Postgres (fuera de `TEST_CMD`, según lo acordado
  en la spec).
- `domain/` sigue sin imports de `@nestjs/*` ni `typeorm` (verificado con
  grep). `application/` solo importa `@nestjs/common` (decoradores DI) e
  interfaces de `domain/repositories`.
- Sin `console.log` de debug ni `TODO` sin contexto en `src/modules/odc/`
  (verificado con grep).
