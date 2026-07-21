---
feature: "odc-suppliers-catalog"
status: approved        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-suppliers-catalog]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisión central: catálogo nuevo + validación aplicativa, sin migrar `supplier` a FK

`odc-create-draft` ya está `done` y aprobado; su columna `purchase_orders.supplier`
y sus DTOs (`CreateOdcDto`/`UpdateOdcDto`) son `string` libre. Para que la
creación de ODC "seleccione de una lista en vez de escribir a mano" hay dos
caminos:

1. **Migrar** `supplier` a `supplierId` (FK a `suppliers.id`), tocando el
   ORM-entity, el mapper, los DTOs y el dominio de `PurchaseOrder`.
2. **Mantener compatibilidad**: dejar `purchase_orders.supplier` y los DTOs
   como están (`string`), y validar en el use-case de creación/edición que ese
   string coincide con el `name` de un proveedor del nuevo catálogo.

Se elige la opción **2** (R5). Razones:

- El frontend que consumirá esto (`frontend-odc-form`, feature 10) todavía no
  existe — no hay UI real hoy que dependa de un `supplierId` numérico/UUID; el
  dropdown puede poblarse con `name` desde `GET /api/suppliers` (R4) y seguir
  enviando el mismo campo `supplier: string` que el backend ya acepta.
- Evita tocar el ORM-entity y el mapper de una feature P1 ya cerrada y
  revisada, reduciendo el blast radius de una feature P2.
- Sigue siendo una mejora real: el string ya no es libre, se valida contra el
  catálogo (R5), que es el problema de fondo que pide el negocio ("en vez de
  escribirlo a mano").
- Es reversible sin deuda oculta: si más adelante se necesita FK real (por
  ejemplo, para guardar metadata del proveedor), la migración a `supplierId`
  se hace como su propia feature cuando haga falta, sin haber construido nada
  que estorbe.

## Decisiones técnicas

- **Módulo nuevo `suppliers`** (`backend/src/modules/suppliers/`), con la
  misma Clean Architecture del apéndice de `docs/architecture.md`, siguiendo
  el patrón de archivos ya usado por `users` (R1, R2).
- **Entidad de dominio mínima** (R1): `Supplier(id, name, createdAt)`. Sin
  campo `active` ni metadata adicional — no hay CRUD ni desactivación en
  alcance (ver Fuera de alcance de [[requirements]] y alternativas
  descartadas).
- **Repositorio único `SupplierRepository`** (R2): interface en
  `domain/repositories/supplier.repository.ts` con `findAll`, `findByName` y
  `create`; implementación TypeORM en `infrastructure/repositories/`,
  registrada por token string `'SupplierRepository'` (mismo patrón de
  `docs/conventions.md` §"Tokens de inyección").
- **Seed reutilizando el patrón de `SeedUsersUseCase`** (R3): un
  `SeedSuppliersUseCase` con la lista fija de nombres como constante en el
  código (no en variable de entorno ni archivo aparte — es un dato estático
  del negocio, igual que `SEED_USERS`), que hace `findByName` por cada nombre
  y solo crea los que faltan. `backend/src/seed.ts` se extiende para invocar
  también este use-case tras el de usuarios, conservando el único comando
  `npm run seed` — no se añade un script nuevo.
- **Endpoint de solo lectura, sin roles ni paginación** (R4): `GET
  /api/suppliers` no lleva `@Roles` (igual que `GET /api/odcs`, ver
  `odc.controller.ts`) porque los 3 roles necesitan verlo para el formulario
  de creación. Sin paginación: el catálogo es una lista fija y acotada (~22
  filas), paginar sería over-engineering.
- **Validación cruzada en `odc` sin tocar el schema de `purchase_orders`**
  (R5): `CreateDraftUseCase` y `UpdateDraftUseCase` (ya existentes, del
  módulo `odc`) reciben `SupplierRepository` como nueva dependencia inyectada
  y, antes de crear/actualizar, llaman `findByName(dto.supplier)`; si no
  existe, lanzan un nuevo error de dominio `UnknownSupplierError` (vive en
  `odc/domain/errors/`, igual que `OdcNotFoundError` u
  `OdcAccessDeniedError` conviven ahí aunque conceptualmente crucen
  sub-dominios). El controller de `odc` añade una rama a
  `rethrowDomainError` que traduce `UnknownSupplierError` a
  `BadRequestException` (400), según la tabla de `docs/conventions.md`.
- **Dependencia entre módulos vía import + export de token, no vía HTTP
  interno** (R5): `OdcModule` importa `SuppliersModule` (mismo patrón que ya
  usa `FilesModule` en `odc.module.ts`) y `SuppliersModule` exporta
  `'SupplierRepository'` (igual que `UsersModule` exporta
  `'UserRepository'`), para que `CreateDraftUseCase`/`UpdateDraftUseCase`
  puedan inyectarlo directamente sin pasar por una llamada HTTP.
- **Comparación case-sensitive exacta** (R5): sin normalización de
  mayúsculas/acentos — el catálogo es la única fuente de verdad y el
  frontend siempre mandará el `name` tal cual vino de `GET /api/suppliers`;
  añadir normalización sería resolver un problema que no existe todavía.

## Archivos afectados

Módulo nuevo `suppliers` (`backend/src/modules/suppliers/`):

- `domain/entities/supplier.entity.ts` — clase pura `Supplier` (R1). Capa
  domain.
- `domain/repositories/supplier.repository.ts` — interface
  `SupplierRepository` (R2). Capa domain.
- `application/use-cases/seed-suppliers.usecase.ts` — lista fija de los 22
  nombres + creación idempotente por `findByName` (R3). Capa application.
- `application/use-cases/list-suppliers.usecase.ts` — `findAll` + orden
  alfabético (R4). Capa application.
- `infrastructure/entities/supplier.orm-entity.ts` — `@Entity('suppliers')`,
  `name` UNIQUE (R2). Capa infrastructure.
- `infrastructure/repositories/supplier.typeorm.repository.ts` —
  implementación de `SupplierRepository` (R2). Capa infrastructure.
- `infrastructure/mappers/supplier-response.mapper.ts` — `Supplier` de
  dominio → `{ id, name }` de respuesta (R4). Capa infrastructure.
- `infrastructure/controller/supplier.controller.ts` — `GET /api/suppliers`,
  sin `@Roles` (R4). Capa infrastructure.
- `suppliers.module.ts` — token string `'SupplierRepository'`,
  `TypeOrmModule.forFeature([SupplierOrmEntity])`, exporta el token para que
  `OdcModule` lo consuma (R2, R5).

Módulo existente `odc` (`backend/src/modules/odc/`), impacto de R5:

- `domain/errors/unknown-supplier.error.ts` — nuevo error de dominio (R5).
  Capa domain.
- `application/use-cases/create-draft.usecase.ts` — inyecta
  `SupplierRepository`, valida `dto.supplier` antes de crear (R5). Capa
  application.
- `application/use-cases/update-draft.usecase.ts` — misma validación cuando
  el PATCH trae `supplier` (R5). Capa application.
- `infrastructure/controller/odc.controller.ts` — nueva rama en
  `rethrowDomainError` para `UnknownSupplierError` → 400 (R5). Capa
  infrastructure.
- `odc.module.ts` — importa `SuppliersModule` (R5).

Fuera de los módulos:

- `backend/src/app.module.ts` — importa `SuppliersModule`.
- `backend/src/seed.ts` — invoca también `SeedSuppliersUseCase` (R3).

## Alternativas descartadas

- **Migrar `supplier` a `supplierId` FK ahora**: descartado — ver "Decisión
  central" arriba; blast radius innecesario sobre una feature P1 ya cerrada,
  sin un consumidor real (`frontend-odc-form` sigue `pending`) que lo
  necesite hoy.
- **FK por nombre (`purchase_orders.supplier` como FK natural hacia
  `suppliers.name`)**: descartado — las FKs sobre claves naturales son
  frágiles (renombrar un proveedor rompería la referencia) y esta feature ya
  logra el objetivo (bloquear texto libre) con validación aplicativa, sin
  necesidad de un constraint a nivel de base de datos.
- **Campo `active` en `Supplier` para poder desactivar sin borrar**:
  descartado — no hay ninguna feature en alcance que desactive proveedores;
  añadir la columna ahora sin un caso de uso real es over-engineering (regla
  global del proyecto: no over-engineering). Se añade cuando exista CRUD de
  proveedores.
- **Endpoint `GET /api/suppliers` paginado (`page`, `pageSize` como en `GET
  /api/odcs`)**: descartado — el catálogo es una lista fija y acotada
  (~22 filas), no crece con el uso del sistema como sí crecen las ODCs;
  paginar una lista de dropdown es complejidad sin beneficio.
- **Normalización de `name` (trim, lowercase, remoción de acentos) en la
  validación de R5**: descartado por ahora — el string siempre viene del
  propio catálogo vía el dropdown del frontend, no de tipeo libre; si en el
  futuro se habilita edición manual del campo, esta normalización se
  reconsidera.
- **Script de seed separado (`npm run seed:suppliers`)**: descartado — el
  proyecto ya tiene un único comando `npm run seed`
  (`backend/src/seed.ts`); mantenerlo como entrypoint único es más simple que
  introducir un segundo comando para un seed que también es de arranque
  único.
