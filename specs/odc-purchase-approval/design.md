---
feature: "odc-purchase-approval"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-purchase-approval]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto. Este diseño aplica además los lineamientos de la skill
> `nestjs-best-practices` (`security-use-guards`, `arch-single-responsibility`,
> `di-use-interfaces-tokens`) ya adoptados por el módulo `odc` en las
> features 3 y 4 — esta feature los mantiene, no los cambia.

## Decisiones técnicas

- **Sin cambios en domain/ ni en infrastructure/entities|repositories**
  (R1, R2, R3, R4, R5, R6, R7): la máquina de estados completa (T1–T10) y la
  persistencia de `purchase_orders`/`odc_status_history` ya viven, probadas y
  aprobadas, en `odc-create-draft`. Esta feature solo añade un use-case nuevo
  (`ApprovePurchaseUseCase`) y su wiring HTTP, y amplía la metadata de un
  handler ya existente (`reject`) en el `odc.controller.ts` ya existente.
- **`ApprovePurchaseUseCase` como use-case de responsabilidad única** (R1,
  R2), copia estructural exacta de `ApproveBudgetUseCase`
  (`application/use-cases/approve-budget.usecase.ts`): `findById` → lanza
  `OdcNotFoundError` si no existe → `order.transition('approve_purchase',
  actor.role)` → construye `OdcStatusHistoryEntry` con el `TransitionRecord`
  devuelto → `repository.update(order, entry)`. Aplica
  `arch-single-responsibility` (skill `nestjs-best-practices`): un use-case,
  una transición, sin lógica compartida más allá del patrón común del
  módulo. Inyecta el repositorio por el mismo token string
  `'PurchaseOrderRepository'` ya registrado en `odc.module.ts`
  (`di-use-interfaces-tokens`), sin tokens nuevos.
- **Sin chequeo de creador** (R1): igual que T3/T4, T5 lo ejecuta cualquier
  usuario con rol `DIRECTOR_GENERAL` sobre cualquier ODC visible en
  `PRESUPUESTO_APROBADO` — no hay comparación de `createdById`.
- **Reutilización total del manejo de errores existente** (R1, R2, R6, R7):
  el controller reutiliza `actorFrom()` y `rethrowDomainError()`, ya
  definidos en `odc.controller.ts`, que traducen
  `InvalidRoleTransitionError`→403, `InvalidStatusTransitionError`→409,
  `MissingTransitionDataError`→400 y `OdcNotFoundError`→404. No se crea
  ningún error de dominio nuevo.
- **Ruta `POST /api/odcs/:id/approve-purchase` para T5** (R1, R2): nombre
  fijado literalmente por la superficie API de
  `plans/001-odc-purchase-system.md`. `@Roles('DIRECTOR_GENERAL')` +
  `@HttpCode(200)`, mismo patrón declarativo que `approve-budget`
  (`security-use-guards`: autorización vía guard + decorator, nunca checks
  manuales en el handler).
- **Ampliar `@Roles(...)` del handler `reject` en vez de crear una ruta o un
  use-case nuevos para T6** (R3, R4, R5, R6, R7): la ruta
  `POST /api/odcs/:id/reject` ya existe desde `odc-budget-validation` y su
  `design.md` dejó explícito que compartir la ruta para T4/T6 era la decisión
  ya tomada (misma acción `reject` en el dominio desde `odc-create-draft`).
  El único cambio HTTP necesario es
  `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` — `RolesGuard`
  (`backend/src/modules/auth/infrastructure/guards/roles.guard.ts`) ya
  soporta listas de más de un rol vía `requiredRoles.includes(role)`, sin
  requerir cambios en el guard ni en el decorator `@Roles`.
- **Doble capa de autorización: guard grueso + dominio fino** (R6): esta
  feature depende explícitamente de que ampliar la lista del `@Roles` del
  guard **no** amplía qué transiciones son válidas — eso lo sigue decidiendo
  `PurchaseOrder.transition()` por regla (`from` + `role`). Tras esta
  feature, `DIRECTOR_GENERAL` pasa el guard en `/reject` pero sigue
  recibiendo 403 de dominio (`InvalidRoleTransitionError`) si la ODC está en
  `PENDIENTE_ADMIN`, porque esa regla exige `ADMINISTRACION`; simétricamente,
  `ADMINISTRACION` sigue recibiendo 403 de dominio sobre
  `PRESUPUESTO_APROBADO`. Ningún código nuevo implementa esta distinción —ya
  existe en la tabla `TRANSITIONS`— pero el diseño la deja explícita porque
  es la propiedad que hace segura la ampliación del guard.
- **`RejectOdcUseCase` y `RejectOdcDto` sin cambios de código** (R3, R4, R5,
  R6, R7): ambos ya reciben `actor.role` y lo pasan tal cual a
  `order.transition(...)`, sin hardcodear `ADMINISTRACION` en ningún punto
  (confirmado leyendo el código antes de escribir esta spec). Solo se añaden
  casos de test nuevos que ejercitan rutas de código que el use-case ya
  soporta.

## Archivos afectados

- `backend/src/modules/odc/application/use-cases/approve-purchase.usecase.ts`
  (nuevo) — T5: `findById`,
  `order.transition('approve_purchase', actor.role)`, historial,
  `repository.update` (R1, R2). Capa application.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`
  (modificado) — añade `POST :id/approve-purchase`
  (`@HttpCode(200)` + `@Roles('DIRECTOR_GENERAL')`) inyectando
  `ApprovePurchaseUseCase` (R1, R2); cambia la metadata del handler
  `reject` de `@Roles('ADMINISTRACION')` a
  `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` (R3) — el cuerpo del
  método `reject` no cambia. Capa infrastructure.
- `backend/src/modules/odc/odc.module.ts` (modificado) — registra
  `ApprovePurchaseUseCase` como provider, inyectándolo en `OdcController`;
  reutiliza el token `'PurchaseOrderRepository'` ya existente, sin tokens
  nuevos.

Sin cambios: `domain/entities/purchase-order.entity.ts`,
`domain/entities/odc-status-history-entry.entity.ts`, `domain/errors/*`,
`domain/repositories/purchase-order.repository.ts`,
`infrastructure/entities/*`, `infrastructure/repositories/*`,
`infrastructure/mappers/*`,
`application/dto/reject-odc.dto.ts`,
`application/use-cases/reject-odc.usecase.ts`,
`auth/infrastructure/decorators/roles.decorator.ts`,
`auth/infrastructure/guards/roles.guard.ts` — todos ya completos y
aprobados en `odc-create-draft` / `odc-budget-validation`, o ya genéricos
respecto al número de roles permitidos.

## Alternativas descartadas

- **Ruta separada `POST /api/odcs/:id/reject-purchase` para T6**: descartada
  — ya descartada explícitamente en el `design.md` de `odc-budget-validation`
  cuando se decidió compartir `/reject` para T4/T6; bifurcar ahora
  duplicaría un endpoint casi idéntico y contradiría el precedente ya
  sentado (y documentado) para esa ruta.
- **Nuevo use-case `RejectPurchaseUseCase` dedicado a T6**: descartado — el
  dominio modela T4 y T6 como la misma acción `reject`; `RejectOdcUseCase`
  ya es agnóstico de rol y de estado de origen (los deriva de `transition()`),
  así que un use-case paralelo sería código duplicado sin ninguna diferencia
  de comportamiento.
- **Repetir el chequeo de rol/estado en `ApprovePurchaseUseCase` antes de
  llamar a `transition`** (p. ej. `if (actor.role !== 'DIRECTOR_GENERAL')
  throw ...`): descartado — duplicaría la máquina de estados fuera del
  dominio, violando la regla ya establecida en `odc-create-draft` ("ninguna
  regla de transición se duplica fuera del dominio").
- **Guard o decorator `@Roles` nuevos/paralelos para soportar múltiples
  roles**: descartado — `RolesGuard.canActivate` ya usa
  `requiredRoles.includes(role)` sobre un array, por lo que ya soporta N
  roles sin ningún cambio; crear una variante sería trabajo redundante.
- **Endpoint único `POST /api/odcs/:id/approve`** que infiera T3 o T5 según
  el estado actual de la ODC: descartado — la superficie API del plan
  maestro fija rutas separadas `approve-budget` (T3) y `approve-purchase`
  (T5) con roles y semánticas de negocio distintas (validación de
  presupuesto vs. aprobación de compra); un endpoint combinado ocultaría esa
  distinción de negocio y complicaría el `@Roles` estático del handler.
