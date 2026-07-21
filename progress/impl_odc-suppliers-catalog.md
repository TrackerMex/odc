# impl: odc-suppliers-catalog
Fecha: 2026-07-21

## Archivos creados

Módulo nuevo `backend/src/modules/suppliers/` (mismo patrón que `users`):

- `domain/entities/supplier.entity.ts` — clase pura `Supplier(id, name, createdAt)`, sin imports de framework/ORM (R1).
- `domain/entities/supplier.entity.spec.ts` — test de propiedades + chequeo estructural de "sin imports" (R1).
- `domain/repositories/supplier.repository.ts` — interface `SupplierRepository` (`findAll`, `findByName`, `create`), sin spec propio (mismo patrón que `user.repository.ts`) (R2).
- `infrastructure/entities/supplier.orm-entity.ts` — `@Entity('suppliers')`, `name` UNIQUE, `id` UUID PK, `createdAt` (R2).
- `infrastructure/entities/supplier.orm-entity.spec.ts` — metadatos de TypeORM (tabla, columnas, unicidad) (R2).
- `infrastructure/repositories/supplier.typeorm.repository.ts` — implementación TypeORM de `SupplierRepository` (R2).
- `infrastructure/repositories/supplier.typeorm.repository.spec.ts` — `findAll`/`findByName`/`create` con manager mockeado (R2).
- `application/use-cases/seed-suppliers.usecase.ts` — `SEED_SUPPLIERS` (22 nombres exactos de requirements.md) + creación idempotente por `findByName` (R3).
- `application/use-cases/seed-suppliers.usecase.spec.ts` — primera corrida crea las 22 filas exactas; segunda corrida es no-op; corrida mixta crea solo las faltantes (R3).
- `application/use-cases/list-suppliers.usecase.ts` — `findAll` + orden alfabético aplicado en la capa application (comparador `<`/`>`, no `localeCompare`, para evitar dependencia de locale) (R4).
- `application/use-cases/list-suppliers.usecase.spec.ts` — repo mockeado devuelve orden no alfabético; se asserta la salida ordenada (R4).
- `infrastructure/mappers/supplier-response.mapper.ts` — `Supplier` → `{ id, name }` (R4).
- `infrastructure/controller/supplier.controller.ts` — `GET /api/suppliers`, sin `@Roles` (R4).
- `infrastructure/controller/supplier.controller.spec.ts` — ruta, ausencia de `@Roles`, delegación al use-case y mapeo de respuesta (R4).
- `suppliers.module.ts` — token `'SupplierRepository'`, `TypeOrmModule.forFeature([SupplierOrmEntity])`, exporta el token (R2).
- `suppliers.module.spec.ts` — asserta el provider y el export del token (R2).

Módulo existente `odc`:

- `domain/errors/unknown-supplier.error.ts` — nuevo error de dominio (R5), sin spec propio (mismo patrón que `odc-not-found.error.ts`, ejercitado solo vía los use-cases/controller que lo lanzan).

## Archivos modificados

- `backend/src/modules/odc/application/use-cases/create-draft.usecase.ts` — inyecta `SupplierRepository`; valida `dto.supplier` con `findByName` antes de `PurchaseOrder.createDraft`; lanza `UnknownSupplierError` si no matchea (R5).
- `backend/src/modules/odc/application/use-cases/create-draft.usecase.spec.ts` — mocks actualizados con `SupplierRepository` (default: supplier existe, para no romper tests previos a R5); nuevo `describe('R5: ...')`.
- `backend/src/modules/odc/application/use-cases/update-draft.usecase.ts` — inyecta `SupplierRepository`; valida solo si `input.supplier !== undefined` (el PATCH puede omitir el campo) (R5).
- `backend/src/modules/odc/application/use-cases/update-draft.usecase.spec.ts` — mismos ajustes de mocks + `describe('R5: ...')`, incluyendo el caso "PATCH sin supplier no valida contra el catálogo".
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` — nueva rama en `rethrowDomainError`: `UnknownSupplierError` → `BadRequestException` (400), agrupada con `MissingTransitionDataError` porque ambas mapean a 400 (R5).
- `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts` — nuevos tests para `POST /api/odcs` y `PATCH /api/odcs/:id` respondiendo 400 (R5).
- `backend/src/modules/odc/odc.module.ts` — importa `SuppliersModule` (R5).
- `backend/src/app.module.ts` — importa `SuppliersModule` (fuera de módulos).
- `backend/src/seed.ts` — invoca `SeedSuppliersUseCase` después de `SeedUsersUseCase`, mismo comando único `npm run seed` (R3).

## Requisitos cubiertos

- R1: test `supplier.entity.spec.ts::R1: pure Supplier domain entity`, commit `78ee7b0`
- R2: tests `supplier.orm-entity.spec.ts::R2`, `supplier.typeorm.repository.spec.ts::R2`, `suppliers.module.spec.ts::R2`, commit `1fa5727`
- R3: test `seed-suppliers.usecase.spec.ts::R3`, commit `faf1cda`
- R4: tests `list-suppliers.usecase.spec.ts::R4`, `supplier.controller.spec.ts::R4`, commit `5a70597`
- R5: tests `create-draft.usecase.spec.ts::R5`, `update-draft.usecase.spec.ts::R5`, `odc.controller.spec.ts::R5`, commit `743bc9c`

`specs/odc-suppliers-catalog/traceability.md` actualizado sin filas "pendiente" (commit de docs `455efe9`).

## Decisiones de diseño

- Orden alfabético de R4 implementado en `ListSuppliersUseCase` (capa application), no en la query del repositorio: el test de R4 usa un repo mockeado que devuelve orden no alfabético y asserta que la salida del use-case sí lo está, verificando la lógica de negocio independientemente del ORM.
- Comparador `a.name < b.name ? -1 : a.name > b.name ? 1 : 0` en vez de `localeCompare`: evita dependencia del locale del entorno de ejecución (CI vs. dev), consistente con "comparación case-sensitive exacta" que ya pide R5 del catálogo.
- `UnknownSupplierError` vive en `odc/domain/errors/`, no en `suppliers/domain/errors/`: sigue el design.md aprobado — el error pertenece conceptualmente al flujo de creación/edición de ODC, igual que `OdcNotFoundError`/`OdcAccessDeniedError` conviven ahí aunque crucen sub-dominios.
- `UpdateDraftUseCase` solo valida el catálogo cuando `input.supplier !== undefined` (test explícito "does not validate the catalog when the PATCH omits supplier"): un PATCH parcial que no toca `supplier` no debe forzar la validación.
- Mocks de `SupplierRepository` en los specs existentes de `create-draft`/`update-draft` devuelven "supplier encontrado" por default, para que los tests de R2/R7/R11 (ya aprobados, anteriores a esta feature) seguiran pasando sin cambios de comportamiento, tal como exige R5.
- `eslint --fix` reordenó imports y reformateó líneas largas en los archivos tocados (create-draft.usecase.ts, update-draft.usecase.ts, odc.controller.ts/spec.ts, create-draft.usecase.spec.ts, update-draft.usecase.spec.ts); se re-corrieron test+build+lint después y siguen en verde.

## Desviaciones de la spec

Ninguna. Se siguió design.md y tasks.md al pie de la letra: catálogo de 22 nombres sin recortar, sin FK real (`purchase_orders.supplier` sigue siendo `string`), sin paginación en `GET /api/suppliers`, sin campo `active`, sin normalización de mayúsculas/acentos.

## Output de build

```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build

(sin errores)
```

## Output de tests

```
> backend@0.0.1 test C:\Users\alex\Documents\sites\odc\backend
> jest

Test Suites: 51 passed, 51 total
Tests:       436 passed, 436 total
Snapshots:   0 total
Time:        12.198 s
```

## Output de lint

```
> backend@0.0.1 lint C:\Users\alex\Documents\sites\odc\backend
> eslint "{src,apps,libs,test}/**/*.ts" --fix

(sin errores; --fix reformateó imports/wrapping, sin cambios semánticos)
```

## Notas para el reviewer

- Confirmar que la lista de 22 nombres en `seed-suppliers.usecase.ts` coincide carácter por carácter con la de `requirements.md` (incluye casos con espacio: "RBI Topfly", "Georgina Masso", "Mario Ramirez", "Tech Innovation", "ISD Telematics", "Ontracking GPS Remote", "Electrica Saavedra").
- El checkbox de aprobación de `requirements.md` no fue tocado (`[X]` ya estaba marcado antes de empezar).
- `feature_list.json` y `progress/current.md` no fueron modificados por el implementer (ya estaban en `in_progress` por el leader); no se marcó la feature como `done`.
- `docker-compose.yml` y `docs/postman/` mostraban cambios/archivos sin trackear ajenos a esta tarea; no se tocaron ni se incluyeron en los commits de esta feature.
- Pendiente fuera de alcance (documentado en requirements.md): CRUD de proveedores, campo `active`, migración a `supplierId` FK, UI de selección (feature `frontend-odc-form`, aún `pending`).
