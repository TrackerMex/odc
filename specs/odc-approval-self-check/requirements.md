---
feature: "odc-approval-self-check"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-approval-self-check]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: pedido directo del usuario — "en el flujo de aprobación de
> ODC (draft → submitted → approved → ...), implementa un endpoint que valide
> que un usuario no puede aprobar su propia orden. Usa lo que ya existe en el
> codebase, no agregues dependencias nuevas." Esta feature cierra un hueco de
> segregación de funciones sobre T3 (`approve_budget`) y T5
> (`approve_purchase`), las dos transiciones de la máquina de estados
> (`specs/odc-create-draft/requirements.md` R3, R4) que representan una
> aprobación. No introduce dominio, DTOs, guard ni endpoints nuevos — ver
> "Decisión: endpoint nuevo vs. regla en use-case existente" más abajo.

## Verificación previa contra el código vivo

Confirmado leyendo `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`,
`backend/src/modules/odc/application/use-cases/approve-budget.usecase.ts`,
`backend/src/modules/odc/application/use-cases/approve-purchase.usecase.ts`,
`backend/src/modules/odc/application/use-cases/submit-odc.usecase.ts`,
`backend/src/modules/odc/application/use-cases/update-draft.usecase.ts`,
`backend/src/modules/odc/domain/errors/odc-access-denied.error.ts` y
`backend/src/modules/odc/infrastructure/controller/odc.controller.ts` antes de
redactar los requisitos:

- **`PurchaseOrder` ya identifica al creador**: `createdById: string` es un
  campo de la entidad (`PurchaseOrderProps.createdById`), poblado en
  `createDraft()` con `actor.userId` de quien crea (rol `DIRECTOR_OPS`, única
  regla de creación en `TRANSITIONS`). Ningún campo nuevo hace falta.
- **Ni `ApproveBudgetUseCase` ni `ApprovePurchaseUseCase` comparan `actor.userId`
  contra `order.createdById` hoy**: sus comentarios de cabecera lo dicen
  explícitamente ("Any ADMINISTRACION user may approve any ODC... without a
  creator check" / "Any DIRECTOR_GENERAL user may approve the purchase of any
  ODC visible to them, without a creator check"). Ambos siguen el mismo
  cuerpo: `findById` → `OdcNotFoundError` si no existe →
  `order.transition(action, actor.role)` → `OdcStatusHistoryEntry` →
  `repository.update(order, entry)`. Este es el hueco que la feature cierra.
- **El patrón "chequeo de creador en el use-case" ya existe y está aprobado**:
  `SubmitOdcUseCase` (T2/T10) y `UpdateDraftUseCase` (PATCH) ya hacen, antes de
  invocar el dominio, exactamente
  `if (order.createdById !== actor.userId) throw new OdcAccessDeniedError('Only the creator can ...')`
  — aprobado en `specs/odc-create-draft/requirements.md` R9 y R11. Esta
  feature reutiliza el mismo patrón con la comparación invertida
  (`===` en vez de `!==`) y la misma clase de error.
- **`OdcAccessDeniedError` ya existe y ya está mapeada a HTTP 403**: la clase
  vive en `domain/errors/odc-access-denied.error.ts` (constructor de un solo
  `message: string`, sin acoplarse a un caso de uso concreto — su propio
  comentario dice "fine-grained 'only the creator' rule") y
  `odc.controller.ts::rethrowDomainError` ya la traduce a
  `ForbiddenException` (403) junto con `InvalidRoleTransitionError`. No hace
  falta ninguna clase de error nueva ni tocar el controller.
- **`transition(action, role, data)` no recibe `userId`**: solo `role`. Meter
  el chequeo de auto-aprobación dentro del dominio (`PurchaseOrder.transition`)
  exigiría cambiar esa firma en las 8 reglas de `TRANSITIONS` y en los 8 sitios
  que la invocan (features 3–8, ya `done`), un cambio desproporcionado frente
  al patrón ya aprobado de resolver esto en la capa `application` (ver
  decisión más abajo).
- **Alcance de rol vs. alcance del creador (nota de transparencia)**: `User`
  (`users/domain/entities/user.entity.ts`) tiene un único `role` fijo por
  cuenta, y `createdById` de una ODC siempre pertenece a un usuario
  `DIRECTOR_OPS` (única regla de `create`). Con el modelo de roles actual, un
  mismo usuario nunca puede ser simultáneamente el creador (`DIRECTOR_OPS`) y
  pasar el `RolesGuard` de `approve-budget` (`ADMINISTRACION`),
  `approve-purchase` (`DIRECTOR_GENERAL`) o `reject` (`ADMINISTRACION`/
  `DIRECTOR_GENERAL`), así que el escenario no es alcanzable hoy por el flujo
  HTTP completo (aplica igual a R1, R2 y R4). Aun así, se implementa como
  chequeo explícito en el use-case — igual que R9/R11 de `odc-create-draft` ya
  chequean identidad de forma incondicional al rol — como control de
  segregación de funciones explícito en el código (no implícito vía
  asignación de roles) y como defensa ante cambios futuros (p. ej. una
  reasignación de rol o una cuenta con más de un rol). Queda documentado aquí
  para que el reviewer no lo interprete como muerto por error.

- **Extensión R4 — `RejectOdcUseCase` (T4, T6)**: un scan de seguridad pedido
  por el usuario sobre el flujo de aprobación completo encontró que
  `RejectOdcUseCase` (`backend/src/modules/odc/application/use-cases/reject-odc.usecase.ts`)
  es la única transición de aprobación/rechazo que NO compara
  `order.createdById` contra `actor.userId`: su cuerpo hace `findById` →
  `OdcNotFoundError` si no existe → `order.transition('reject', actor.role, data)`
  directamente, sin el chequeo que R1/R2 ya añadieron a
  `ApproveBudgetUseCase`/`ApprovePurchaseUseCase`. Un único use-case cubre T4
  (`PENDIENTE_ADMIN` → `RECHAZADA`, rol `ADMINISTRACION`) y T6
  (`PRESUPUESTO_APROBADO` → `RECHAZADA`, rol `DIRECTOR_GENERAL`), ambas bajo la
  misma acción de dominio `reject` (`purchase-order.entity.ts` `TRANSITIONS`),
  así que un solo requisito (R4) cierra el hueco para las dos. Mismo caveat de
  alcanzabilidad que el punto anterior: con el modelo de roles actual
  (`ADMINISTRACION`/`DIRECTOR_GENERAL`, nunca `DIRECTOR_OPS`, el único rol que
  crea una ODC), el escenario tampoco es alcanzable hoy por el flujo HTTP
  completo — R4 se agrega igual, como defensa en profundidad y simetría de
  código con R1/R2, no porque el escenario se haya vuelto alcanzable.

## Decisión: endpoint nuevo vs. regla en use-case existente

El pedido dice "implementa un endpoint que valide...", pero **no se crea un
endpoint nuevo**. Se añade la regla dentro de los dos use-cases de aprobación
ya existentes (`ApproveBudgetUseCase`, `ApprovePurchaseUseCase`), invocados
por las rutas ya existentes `POST :id/approve-budget` y
`POST :id/approve-purchase`. Razones:

1. Un endpoint separado (p. ej. `GET/POST :id/can-approve`) sería una
   validación de solo-lectura que nadie está obligado a llamar antes de
   aprobar — no bloquea nada por sí sola. Para bloquear de verdad, el chequeo
   tendría que vivir *también* en los endpoints reales de aprobación,
   duplicando la regla en dos sitios.
2. El proyecto ya tiene un patrón idéntico aprobado (creador vs. actor) para
   T2/T10 y PATCH, resuelto en la capa `application`, no como endpoint
   aparte — seguirlo es "usar lo que ya existe" en su sentido más literal.
3. Clean Architecture (`docs/architecture.md`): una regla de negocio
   ("quién puede aprobar qué ODC") pertenece a `application`/`domain`, no a
   una ruta HTTP adicional cuyo único trabajo sería reimplementar la misma
   comparación.

## Contexto: transiciones que cubre esta feature

| # | Acción | De → A | Rol autorizado | Regla añadida |
|---|---|---|---|---|
| T3 | Aprobar presupuesto | `PENDIENTE_ADMIN` → `PRESUPUESTO_APROBADO` | ADMINISTRACION | El actor no puede ser el creador de la ODC |
| T5 | Aprobar compra | `PRESUPUESTO_APROBADO` → `COMPRA_APROBADA` | DIRECTOR_GENERAL | El actor no puede ser el creador de la ODC |
| T4 | Rechazar (admin) | `PENDIENTE_ADMIN` → `RECHAZADA` | ADMINISTRACION | El actor no puede ser el creador de la ODC |
| T6 | Rechazar (director general) | `PRESUPUESTO_APROBADO` → `RECHAZADA` | DIRECTOR_GENERAL | El actor no puede ser el creador de la ODC |

## Requisitos funcionales

- **R1**: IF un usuario autenticado hace `POST /api/odcs/:id/approve-budget`
  sobre una ODC cuyo `createdById` es igual al `userId` de la sesión THEN THE
  SYSTEM SHALL responder HTTP 403 sin transicionar, sin registrar historial y
  sin llamar a `order.transition(...)`, independientemente del estado actual
  de la ODC y del rol de la sesión — este chequeo corre antes de la
  validación de dominio (rol/estado) de T3.
  *Verificación*: test de `ApproveBudgetUseCase` con `actor.userId` igual a
  `order.createdById` (ODC en `PENDIENTE_ADMIN`, rol `ADMINISTRACION`)
  assertando `OdcAccessDeniedError`, `order.status` sin cambiar y
  `repository.update` no invocado; test de regresión reejecutando el caso de
  éxito ya aprobado en `odc-budget-validation` R1 (actor `ADMINISTRACION` con
  `userId` distinto al `createdById`) para confirmar que sigue respondiendo
  HTTP 200 tras el cambio.

- **R2**: IF un usuario autenticado hace `POST /api/odcs/:id/approve-purchase`
  sobre una ODC cuyo `createdById` es igual al `userId` de la sesión THEN THE
  SYSTEM SHALL responder HTTP 403 sin transicionar, sin registrar historial y
  sin llamar a `order.transition(...)`, independientemente del estado actual
  de la ODC y del rol de la sesión — este chequeo corre antes de la
  validación de dominio (rol/estado) de T5.
  *Verificación*: test de `ApprovePurchaseUseCase` con `actor.userId` igual a
  `order.createdById` (ODC en `PRESUPUESTO_APROBADO`, rol `DIRECTOR_GENERAL`)
  assertando `OdcAccessDeniedError`, `order.status` sin cambiar y
  `repository.update` no invocado; test de regresión reejecutando el caso de
  éxito ya aprobado en `odc-purchase-approval` R1 (actor `DIRECTOR_GENERAL`
  con `userId` distinto al `createdById`) para confirmar que sigue
  respondiendo HTTP 200 tras el cambio.

- **R3**: WHEN `ApproveBudgetUseCase` o `ApprovePurchaseUseCase` lanzan
  `OdcAccessDeniedError` por auto-aprobación (R1, R2) THE SYSTEM SHALL
  traducirlo a HTTP 403 reutilizando `rethrowDomainError` del
  `odc.controller.ts` ya existente, sin ninguna modificación al controller ni
  a la tabla de mapeo de errores de `docs/conventions.md`.
  *Verificación*: test del controller (`odc.controller.spec.ts`) que invoca
  `approveBudget`/`approvePurchase` con el use-case mockeado para lanzar
  `OdcAccessDeniedError` y asserta HTTP 403; verificación estática de que
  `rethrowDomainError` ya incluye `OdcAccessDeniedError` en su rama de 403
  (sin diff en esa función).

- **R4**: IF un usuario autenticado hace `POST /api/odcs/:id/reject` sobre
  una ODC cuyo `createdById` es igual al `userId` de la sesión THEN THE
  SYSTEM SHALL responder HTTP 403 sin transicionar, sin registrar historial y
  sin llamar a `order.transition(...)`, independientemente del estado actual
  de la ODC (`PENDIENTE_ADMIN` en T4 o `PRESUPUESTO_APROBADO` en T6) y del
  rol de la sesión (`ADMINISTRACION` o `DIRECTOR_GENERAL`) — este chequeo
  corre antes de la validación de dominio (rol/estado) de T4/T6 por igual,
  ya que ambas transiciones comparten el mismo `RejectOdcUseCase` y la misma
  acción de dominio `reject`.
  *Verificación*: test de `RejectOdcUseCase` con `actor.userId` igual a
  `order.createdById`, cubriendo ambos casos — ODC en `PENDIENTE_ADMIN` con
  rol `ADMINISTRACION` (T4) y ODC en `PRESUPUESTO_APROBADO` con rol
  `DIRECTOR_GENERAL` (T6) — assertando `OdcAccessDeniedError`, `order.status`
  sin cambiar y `repository.update` no invocado; test de regresión
  reejecutando los casos de éxito ya cubiertos por T4/T6 (actor con `userId`
  distinto al `createdById`) para confirmar que siguen respondiendo HTTP 200
  tras el cambio.

## Fuera de alcance

- ~~`POST /api/odcs/:id/reject` (T4, T6): el pedido es específicamente sobre
  **aprobar** la propia orden, no sobre rechazarla~~ — **exclusión revertida
  por R4**. Motivo real: no es que el escenario se haya vuelto alcanzable (el
  mismo caveat de "Alcance de rol vs. alcance del creador" arriba sigue
  aplicando sin cambios: `RejectOdcUseCase` exige rol
  `ADMINISTRACION`/`DIRECTOR_GENERAL`, nunca `DIRECTOR_OPS`, el único rol que
  puede crear una ODC, con el modelo actual de 3 usuarios fijos uno por rol y
  sin gestión de usuarios), sino un scan de seguridad pedido por el usuario
  sobre el flujo de aprobación completo, que encontró que `RejectOdcUseCase`
  era la única transición de aprobación/rechazo sin el chequeo de
  auto-acción, rompiendo la simetría defensiva con
  `ApproveBudgetUseCase`/`ApprovePurchaseUseCase`. R4 cierra ese hueco como
  defensa en profundidad, igual que R1/R2.
- Cualquier endpoint, DTO, guard o entidad de dominio nuevos — ver "Decisión"
  arriba.
- Cambios a `PurchaseOrder.transition()`, a su firma o a `TRANSITIONS` — el
  chequeo vive en `application`, no en `domain` (ver "Verificación previa").
- Cambios a `RolesGuard`, `@Roles` o a cualquier guard HTTP — el chequeo
  depende de `createdById`, un dato de la ODC, no de la ruta ni del rol
  declarado; no es responsabilidad de un guard.
- Cambios de comportamiento en T1, T2, T7–T10 o en cualquier otro endpoint
  del módulo `odc` — solo se tocan los cuerpos de `ApproveBudgetUseCase`
  (R1), `ApprovePurchaseUseCase` (R2) y, con R4, `RejectOdcUseCase` (T4, T6).
- Reasignación de roles de usuario, gestión de cuentas con más de un rol o
  cualquier feature de administración de usuarios — fuera del alcance del
  módulo `odc` y de este pedido.
- Dashboards, contadores y cualquier UI (features 9–13, ya `done`) — esta
  feature es puramente backend.
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-08-02) ← cubre R1-R3
- [X] Aprobado por humano (fecha: 2026-08-02; aprobación explícita en conversación) ← cubre R4
