---
feature: "odc-create-draft"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-create-draft]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Un solo módulo `odc`** (`backend/src/modules/odc/`) con la Clean
  Architecture del apéndice de `docs/architecture.md`, siguiendo el patrón de
  archivos ya establecido por los módulos `users` y `auth` (R1–R13).
- **La máquina de estados vive completa en la entidad de dominio** (R3, R4):
  `PurchaseOrder.transition(action, role, data)` valida rol y estado contra la
  tabla T1–T10, aplica los datos de la transición y produce la entrada de
  historial. Las features 4–8 solo añadirán use-cases/endpoints que la
  invocan — ninguna regla de transición se duplica fuera del dominio
  (nota de mantenimiento del plan maestro).
- **Errores de dominio tipados** (R4), en `domain/errors/` como en el módulo
  `auth`: error de rol no permitido, error de transición de estado inválida y
  error de datos de transición faltantes. El controller los traduce a
  `ForbiddenException` (403), `ConflictException` (409) y
  `BadRequestException` (400) según la tabla de `docs/conventions.md`; el
  dominio nunca importa `@nestjs/common`.
- **Status como union type de TypeScript + columna varchar** (R1, R5): los 8
  valores en español (vienen del negocio, decisión del plan) se declaran como
  const array + union type en el dominio (mismo patrón que `USER_ROLES` en
  `user.entity.ts`) y se persisten como `varchar`. La validez la garantiza la
  máquina de estados, no la base.
- **Historial como entidad de dominio propia** (R3, R5): clase pura
  `OdcStatusHistoryEntry` (`odcId`, `fromStatus | null`, `toStatus`, `userId`,
  `note?`, `createdAt`). `transition` la devuelve junto con la ODC mutada; el
  use-case la pasa al repositorio para persistirla con la ODC.
- **Un solo repositorio `PurchaseOrderRepository` para las dos tablas**
  (R5): la interface de dominio expone al menos
  `create(order, historyEntry)`, `update(order, historyEntry?)`,
  `findById(id)` (con historial), `findAll(filter, page)` y el apoyo de
  numeración (`nextSequenceForYear(year)` o equivalente). Actualizar la ODC e
  insertar su fila de historial en la misma operación permite a la
  implementación TypeORM envolver ambas escrituras en una transacción única —
  con dos repositorios separados la atomicidad no sería garantizable desde
  application sin acoplarla al ORM.
- **Numeración `ODC-YYYY-NNNNN`: formateo en dominio, unicidad en
  infraestructura** (R6): el dominio formatea el número a partir de año +
  secuencia (función pura, testeable). La implementación TypeORM obtiene la
  siguiente secuencia del año (MAX sobre `odcNumber` del año en curso, dentro
  de la transacción de creación) y confía en el constraint UNIQUE de
  `odcNumber` + un reintento acotado ante colisión concurrente — opción del
  plan que no requiere tabla de secuencias adicional.
- **Autorización en dos niveles** (R7, R9–R13): el rol grueso lo aplican los
  guards existentes de `auth` (`@Roles('DIRECTOR_OPS')` en POST/PATCH/submit;
  lista y detalle solo exigen sesión — cualquiera de los 3 roles). La regla
  fina "solo el creador" (T2/T10/PATCH y visibilidad de `BORRADOR`) se decide
  en dominio/use-case comparando `createdById` con el `sub` de la sesión,
  porque depende de datos de la ODC que el guard no conoce.
- **Visibilidad de `BORRADOR` filtrada en la query, no en memoria** (R12): el
  use-case de listado pasa al repositorio el viewer (`userId`, `role`) y el
  repositorio excluye los `BORRADOR` ajenos en la consulta (condición
  `status != 'BORRADOR' OR createdById = :viewerId`), para que la paginación
  (`page`, `pageSize` 20) sea correcta sin post-filtrado.
- **DTOs con `class-validator`** (R7, R8, R11): `CreateOdcDto` con los campos
  de T1 (`@IsInt` + `@IsPositive` para `quantity` y `unitPriceCents`,
  `@IsNotEmpty` para los strings, `comments` opcional) y `UpdateOdcDto =
  PartialType(CreateOdcDto)` según `docs/conventions.md`. Ninguno declara
  `totalCents`: con `whitelist: true` global (backend-foundation R4) el campo
  se descarta si llega del cliente (R2).

## Archivos afectados

Módulo `odc` (`backend/src/modules/odc/`), todo nuevo:

- `domain/entities/purchase-order.entity.ts` — clase pura `PurchaseOrder`,
  const/union de los 8 status, const/union de acciones T1–T10, método
  `transition(action, role, data)`, cálculo de `totalCents`, formateo
  `ODC-YYYY-NNNNN` (R1, R2, R3, R4, R6). Capa domain.
- `domain/entities/odc-status-history-entry.entity.ts` — clase pura de la
  entrada de historial (R3, R5). Capa domain.
- `domain/errors/invalid-role-transition.error.ts`,
  `domain/errors/invalid-status-transition.error.ts`,
  `domain/errors/missing-transition-data.error.ts` — errores tipados de la
  máquina de estados (R4). Capa domain.
- `domain/repositories/purchase-order.repository.ts` — interface
  `PurchaseOrderRepository` (R5, R6, R12, R13). Capa domain.
- `application/dto/create-odc.dto.ts` — campos de T1 con class-validator
  (R7, R8). Capa application.
- `application/dto/update-odc.dto.ts` — `PartialType(CreateOdcDto)` (R8,
  R11). Capa application.
- `application/dto/list-odcs.query.dto.ts` — `status?` y `page?` validados
  (R12). Capa application.
- `application/use-cases/create-draft.usecase.ts` — T1: crea `BORRADOR` con
  número e historial (R6, R7). Capa application.
- `application/use-cases/submit-odc.usecase.ts` — T2 y T10 vía
  `transition('submit', ...)` + chequeo de creador (R9, R10). Capa application.
- `application/use-cases/update-draft.usecase.ts` — PATCH en
  `BORRADOR`/`RECHAZADA`, recálculo de total (R11). Capa application.
- `application/use-cases/list-odcs.usecase.ts` — listado paginado con filtro
  de visibilidad (R12). Capa application.
- `application/use-cases/get-odc.usecase.ts` — detalle con historial + reglas
  404/403 (R13). Capa application.
- `infrastructure/entities/purchase-order.orm-entity.ts` —
  `@Entity('purchase_orders')`, UNIQUE `odcNumber`, FK `createdById`, columnas
  nullable de las fases 4–8 (R5). Capa infrastructure.
- `infrastructure/entities/odc-status-history.orm-entity.ts` —
  `@Entity('odc_status_history')`, FKs `odcId`/`userId` (R5). Capa
  infrastructure.
- `infrastructure/repositories/purchase-order.typeorm.repository.ts` —
  implementación con transacción única para ODC + historial y reintento de
  numeración (R5, R6, R12). Capa infrastructure.
- `infrastructure/mappers/purchase-order.mapper.ts` — OrmEntity ↔ entidad de
  dominio (la conversión ya no es trivial: historial + muchos nullables)
  (R5). Capa infrastructure.
- `infrastructure/controller/odc.controller.ts` — `POST /api/odcs`,
  `POST /api/odcs/:id/submit`, `PATCH /api/odcs/:id`, `GET /api/odcs`,
  `GET /api/odcs/:id`; `@Roles('DIRECTOR_OPS')` donde aplica; traduce errores
  de dominio a HTTP (R7–R13). Capa infrastructure.
- `odc.module.ts` — token string `'PurchaseOrderRepository'` +
  `TypeOrmModule.forFeature` de las dos entidades ORM.

Fuera del módulo:

- `backend/src/app.module.ts` — importa `OdcModule`.

## Alternativas descartadas

- **Reglas de transición repartidas en los use-cases (F4–F8 cada uno con su
  `if` de estado/rol)**: descartado — el plan exige la máquina completa en la
  entidad de dominio como red de seguridad única; repartirla duplicaría reglas
  y permitiría que un use-case futuro se salte una validación.
- **Librería de máquinas de estados (XState o similar)**: descartado por
  over-engineering — 10 transiciones con una tabla declarativa en la entidad
  se testean directo y no añaden dependencia.
- **Enum nativo de PostgreSQL para `status`**: descartado — con
  `synchronize: true` los cambios de enum en Postgres son frágiles, y la
  validez ya la garantiza el dominio; `varchar` + union type es suficiente.
- **Tabla de secuencias por año para `odcNumber`**: descartado en favor de
  UNIQUE + reintento (ambas opciones válidas según el plan) — evita una tabla
  y un repositorio extra; con 3 usuarios internos la colisión es rara y el
  reintento acotado la resuelve.
- **Repositorio separado para `odc_status_history`**: descartado — la fila de
  historial debe commitearse con la transición (regla transversal del plan);
  dos repositorios inyectados por tokens distintos no pueden compartir
  transacción sin filtrar el ORM hacia application.
- **Endpoints distintos para T2 y T10 (`/submit` vs `/resubmit`)**: descartado
  — la superficie API del plan define un único `POST /api/odcs/:id/submit`
  para ambos; el dominio distingue el `fromStatus` y el historial lo refleja.
- **Visibilidad de `BORRADOR` filtrada en memoria tras la query**: descartado
  — rompería `total` y la paginación; el filtro va en la consulta.
- **DELETE de borradores**: descartado — no existe en la superficie API del
  plan; añadirlo sería scope creep sin decisión del humano.
