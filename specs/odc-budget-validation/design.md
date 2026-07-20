---
feature: "odc-budget-validation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-budget-validation]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto.

## Decisiones técnicas

- **Sin cambios en domain/ ni en infrastructure/entities|repositories** (R1–R5):
  la máquina de estados completa (T1–T10) y la persistencia de
  `purchase_orders`/`odc_status_history` ya viven, probadas y aprobadas, en
  `odc-create-draft`. Esta feature solo añade dos use-cases nuevos y su
  wiring HTTP en el `odc.controller.ts` ya existente, siguiendo exactamente
  el patrón de `SubmitOdcUseCase` (T2/T10): `findById` → `order.transition(action,
  role, data)` → construir `OdcStatusHistoryEntry` con el `TransitionRecord`
  devuelto → `repository.update(order, entry)`.
- **Sin chequeo de creador**: a diferencia de T2/T10/PATCH (solo el creador),
  T3 y T4 las ejecuta cualquier usuario con rol `ADMINISTRACION` sobre
  cualquier ODC visible — no hay comparación de `createdById` en estos
  use-cases (a diferencia de `SubmitOdcUseCase`/`UpdateDraftUseCase`).
- **Reutilización total del manejo de errores existente** (R2, R3, R5): el
  controller reutiliza `actorFrom()` y `rethrowDomainError()`, ya definidos en
  `odc.controller.ts`, que traducen `InvalidRoleTransitionError`→403,
  `InvalidStatusTransitionError`→409, `MissingTransitionDataError`→400 y
  `OdcNotFoundError`→404. No se crea ningún error de dominio nuevo: los cuatro
  ya cubren exactamente los casos de R1–R5 porque la máquina de estados ya
  distingue rol vs. estado por cada regla de la tabla T1–T10 (decisión de
  `odc-create-draft`, ver su R4).
- **Ruta `POST /api/odcs/:id/approve-budget` para T3** (R1, R2): nombre fijado
  literalmente por la superficie API de `plans/001-odc-purchase-system.md`.
  `@Roles('ADMINISTRACION')` + `@HttpCode(200)`, mismo patrón que
  `submit`/`update` en el controller actual.
- **Ruta compartida `POST /api/odcs/:id/reject` para T4 (y, mecánicamente,
  T6 en el futuro)** (R3, R4, R5): la superficie API del plan maestro fija
  una única ruta `/reject` para T4/T6 (`body: { reason }`), y el brief de la
  feature 5 dice explícitamente "mismo contrato de reject que F4". Esto
  refleja que el dominio modela T4 y T6 como la **misma** acción `reject`
  (decisión ya aprobada en `odc-create-draft`, R3/R4) — exactamente el mismo
  patrón que llevó a compartir `/submit` para T2/T10 en esa feature (ver su
  `design.md` § Alternativas descartadas). Esta feature restringe la ruta con
  `@Roles('ADMINISTRACION')`, de modo que solo T4 es alcanzable ahora; la
  feature 5 solo necesita ampliar la metadata de roles
  (`@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')`) para habilitar T6 sobre la
  misma ruta, sin tocar el use-case, el DTO ni el dominio.
- **Campo de body `rejectionReason`, no `reason`** (R3, R4): el modelo de
  datos del plan maestro y la interface `TransitionData` del dominio usan
  `rejectionReason`; `reason` es solo la abreviatura usada en la tabla
  compacta de "Superficie API" del plan. Se mantiene el mapeo 1:1
  DTO↔dominio que ya siguen `CreateOdcDto`/`UpdateOdcDto` en vez de introducir
  un renombrado de campo en esta feature.
- **`RejectOdcDto` nuevo, no reutiliza `UpdateOdcDto`** (R3): un solo campo
  obligatorio (`rejectionReason: string`, `@IsString() @IsNotEmpty()`),
  siguiendo el estilo de `CreateOdcDto` (`application/dto/create-odc.dto.ts`).
  Vive en `application/dto/` y no importa nada de infrastructure.
- **`ApproveBudgetUseCase` y `RejectOdcUseCase` como use-cases de
  responsabilidad única** (R1, R4): cada uno solo orquesta una transición,
  igual que `SubmitOdcUseCase`; no comparten código entre sí más allá del
  patrón común ya establecido en el módulo.

## Archivos afectados

- `backend/src/modules/odc/application/dto/reject-odc.dto.ts` (nuevo) —
  `RejectOdcDto` con `rejectionReason` validado (R3). Capa application.
- `backend/src/modules/odc/application/use-cases/approve-budget.usecase.ts`
  (nuevo) — T3: `findById`, `order.transition('approve_budget', actor.role)`,
  historial, `repository.update` (R1, R2). Capa application.
- `backend/src/modules/odc/application/use-cases/reject-odc.usecase.ts`
  (nuevo) — T4: `findById`,
  `order.transition('reject', actor.role, { rejectionReason })`, historial
  con `note`, `repository.update` (R3, R4, R5). Capa application.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`
  (modificado) — añade `POST :id/approve-budget` y `POST :id/reject`, ambos
  `@HttpCode(200)` y `@Roles('ADMINISTRACION')`, reusando `actorFrom()` y
  `rethrowDomainError()` ya definidos (R1–R5). Capa infrastructure.
- `backend/src/modules/odc/odc.module.ts` (modificado) — registra
  `ApproveBudgetUseCase` y `RejectOdcUseCase` como providers, inyectándolos
  en `OdcController`; reutiliza el token `'PurchaseOrderRepository'` ya
  existente, sin tokens nuevos.

Sin cambios: `domain/entities/purchase-order.entity.ts`,
`domain/entities/odc-status-history-entry.entity.ts`, `domain/errors/*`,
`domain/repositories/purchase-order.repository.ts`,
`infrastructure/entities/*`, `infrastructure/repositories/*`,
`infrastructure/mappers/*` — todos ya completos y aprobados en
`odc-create-draft`.

## Alternativas descartadas

- **Ruta separada `POST /api/odcs/:id/reject-budget` para T4**: descartada —
  el plan maestro fija una única ruta `/reject` compartida para T4/T6 y el
  brief de la feature 5 la reutiliza explícitamente; el dominio ya modela
  `reject` como una sola acción para ambos estados. Bifurcar la ruta ahora
  forzaría a la feature 5 a duplicar un endpoint casi idéntico o a renombrar
  este, contradiciendo el precedente ya sentado para `/submit` (T2/T10) en
  `odc-create-draft`.
- **Campo de body `reason` en vez de `rejectionReason`**: descartado por
  inconsistencia con el nombre de campo del dominio/columna persistida y con
  el resto de DTOs del módulo, que mapean 1:1 con los campos de
  `TransitionData`.
- **Repetir el chequeo de estado/rol en el use-case antes de llamar a
  `transition`** (p. ej. `if (order.status !== 'PENDIENTE_ADMIN') throw ...`):
  descartado — duplicaría la máquina de estados fuera del dominio, violando
  la regla ya establecida en `odc-create-draft` ("ninguna regla de
  transición se duplica fuera del dominio") y produciendo dos fuentes de
  verdad ante un cambio futuro de la tabla T1–T10.
- **Nuevo error de dominio para "estado no rechazable"**: descartado — los
  errores existentes (`InvalidStatusTransitionError`,
  `InvalidRoleTransitionError`) ya cubren exactamente los casos 409/403 sin
  código nuevo.
- **Controller dedicado `budget-validation.controller.ts`**: descartado — el
  módulo ya tiene un único controller para todas las transiciones sobre
  `/api/odcs/:id/*`; crear uno nuevo fragmentaría el recurso y forzaría
  registrar dos controllers para la misma ruta base.
- **Reutilizar `UpdateOdcDto`/`PartialType` para el body de reject**:
  descartado — sus campos son los de T1 (description, quantity...), no
  tienen relación con `rejectionReason`; un DTO propio es más claro y evita
  campos opcionales que no aplican.
