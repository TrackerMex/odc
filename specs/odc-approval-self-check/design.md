---
feature: "odc-approval-self-check"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-approval-self-check]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto. Aplica las mismas convenciones de `nestjs-best-practices`
> (`arch-single-responsibility`, `security-use-guards`) ya adoptadas por el
> módulo `odc`.

## Decisiones técnicas

- **Chequeo en la capa `application`, no en `domain`** (R1, R2): se replica
  literalmente el patrón ya aprobado de `SubmitOdcUseCase`/`UpdateDraftUseCase`
  (`if (order.createdById !== actor.userId) throw new OdcAccessDeniedError(...)`),
  con la comparación invertida (`===`), justo antes de llamar a
  `order.transition(...)`. `PurchaseOrder.transition(action, role, data)` no
  recibe `userId` hoy; cambiar su firma para meter el chequeo en `domain`
  obligaría a tocar las 8 reglas de `TRANSITIONS` y sus 8 sitios de invocación
  en features 3–8 ya `done`, un radio de cambio muy superior al problema.
- **Reutiliza `OdcAccessDeniedError` sin cambios** (R1, R2, R3): es un error de
  dominio genérico de un solo `message: string`, ya usado para "solo el
  creador puede X"; aquí se usa para "el creador no puede aprobar su propia
  ODC" — mismo tipo, mensaje distinto. Ya está mapeado a `ForbiddenException`
  (403) en `odc.controller.ts::rethrowDomainError`, así que R3 no requiere
  ningún cambio en el controller.
- **Orden de los checks dentro de cada use-case** (R1, R2): `findById` (404 si
  no existe, sin cambios) → chequeo de auto-aprobación (403,
  `OdcAccessDeniedError`, nuevo) → `order.transition(action, actor.role)`
  (403/409 de dominio, sin cambios) → historial → `repository.update`. El
  chequeo nuevo se inserta como segundo paso, igual que en
  `SubmitOdcUseCase`/`UpdateDraftUseCase`.
- **Sin cambios de firma en `execute(odcId, actor)`**: ambos use-cases ya
  reciben `actor: OdcActor` (`{ userId, role }`); `userId` ya está disponible,
  no hace falta ningún parámetro nuevo.
- **Sin endpoint, DTO, guard ni entidad nuevos**: ver "Decisión: endpoint
  nuevo vs. regla en use-case existente" en [[requirements]]. Las rutas
  `POST :id/approve-budget` y `POST :id/approve-purchase` no cambian su forma
  HTTP; solo cambia lo que hace el use-case que invocan.
- **Extensión R4 — mismo patrón en `RejectOdcUseCase`**: se replica
  literalmente el mismo chequeo (`if (order.createdById === actor.userId) throw new OdcAccessDeniedError(...)`)
  en `RejectOdcUseCase.execute()`, insertado en el mismo punto relativo del
  flujo que R1/R2: justo después de `findById`/el null-check
  (`OdcNotFoundError`) y antes de `order.transition('reject', actor.role, data)`.
  Un único use-case cubre T4 y T6 (comparten la acción de dominio `reject`),
  así que un solo diff en `RejectOdcUseCase` satisface ambas transiciones de
  R4 — no hace falta bifurcar por estado ni por rol. Sin cambios en la firma
  `execute(odcId, actor, data)`: `actor.userId` ya está disponible.

## Archivos afectados

- `backend/src/modules/odc/application/use-cases/approve-budget.usecase.ts`
  (modificado) — añade el chequeo de auto-aprobación antes de
  `order.transition('approve_budget', actor.role)` (R1). Capa application.
- `backend/src/modules/odc/application/use-cases/approve-purchase.usecase.ts`
  (modificado) — añade el chequeo de auto-aprobación antes de
  `order.transition('approve_purchase', actor.role)` (R2). Capa application.
- `backend/src/modules/odc/application/use-cases/reject-odc.usecase.ts`
  (modificado) — añade el chequeo de auto-acción antes de
  `order.transition('reject', actor.role, data)`, cubriendo T4 y T6 (R4).
  Capa application.

Sin cambios: `domain/entities/purchase-order.entity.ts` (incluida
`transition()` y `TRANSITIONS`), `domain/errors/odc-access-denied.error.ts`
(reutilizado tal cual), `infrastructure/controller/odc.controller.ts`
(`rethrowDomainError` ya traduce `OdcAccessDeniedError` a 403 desde
`odc-create-draft`), `odc.module.ts` (no se registra ningún provider nuevo),
`auth/infrastructure/guards/roles.guard.ts`, cualquier DTO.

## Alternativas descartadas

- **Endpoint HTTP nuevo de validación** (p. ej.
  `GET /api/odcs/:id/can-approve`): descartado — no bloquea nada por sí solo
  si nadie lo llama antes de aprobar; para bloquear de verdad habría que
  duplicar la misma comparación en los endpoints reales de aprobación,
  violando DRY sin ganar nada. Ver [[requirements]] §"Decisión".
- **Clase de error nueva** (p. ej. `SelfApprovalNotAllowedError`): descartada
  — `OdcAccessDeniedError` ya modela genéricamente "acceso denegado por
  identidad del actor" con un mensaje parametrizable, y ya está mapeada a 403;
  una clase paralela sería una dependencia nueva para el mismo resultado
  observable (403), contra el pedido explícito de "no agregues dependencias
  nuevas".
- **Chequeo dentro de `PurchaseOrder.transition()`** cambiando su firma a
  recibir el `OdcActor` completo en vez de solo `role`: descartada — afecta
  las 10 reglas de transición y sus 8 sitios de invocación en 6 features ya
  `done` (3–8), un riesgo de regresión desproporcionado frente al patrón ya
  aprobado (creador vs. actor resuelto en `application`) que no requiere tocar
  ninguna transición existente.
- **Chequeo dentro de `RolesGuard`**: descartado — el guard decide por
  metadata de ruta (`@Roles(...)`), no conoce `createdById` de una ODC
  concreta (exigiría una consulta a base de datos dentro del guard, mezclando
  el control grueso de rol con el control fino de identidad que el propio
  `design.md` de `odc-purchase-approval` ya documentó como capas separadas).
- **Repetir la comparación en `PurchaseOrder.edit()` o en otro método de
  dominio**: descartado — no aplica; T3/T5 no pasan por `edit()`, y meter la
  comparación en un método de dominio distinto al que de verdad ejecuta la
  transición no resuelve el problema.
