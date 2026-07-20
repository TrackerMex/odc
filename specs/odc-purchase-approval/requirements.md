---
feature: "odc-purchase-approval"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-purchase-approval]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F5 `odc-purchase-approval`** de
> `plans/001-odc-purchase-system.md` (transiciones T5 y T6 de la tabla
> T1–T10), sobre la máquina de estados de dominio **ya completa y aprobada**
> en `specs/odc-create-draft/requirements.md` (R3, R4) —
> `PurchaseOrder.transition(action, role, data)` en
> `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` ya
> implementa las 10 transiciones, incluidas T5 (`approve_purchase`,
> `PRESUPUESTO_APROBADO → COMPRA_APROBADA`, rol `DIRECTOR_GENERAL`) y T6
> (`reject`, `PRESUPUESTO_APROBADO → RECHAZADA`, rol `DIRECTOR_GENERAL`), con
> errores tipados de rol (403), de estado (409) y de datos faltantes (400), e
> historial automático. Esta feature **solo añade** el use-case y el wiring
> HTTP que invocan T5, y **amplía los roles HTTP permitidos** sobre la ruta
> `/reject` ya existente (entregada en `odc-budget-validation`, feature 4)
> para habilitar T6 — no modifica `domain/`, `domain/repositories/` ni las
> entidades ORM/repositorio de infraestructura ya existentes. Los tests son
> unitarios con el repositorio mockeado; no tocan PostgreSQL.

## Verificación previa contra el código vivo

Confirmado leyendo `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`
y `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` antes
de redactar los requisitos:

- **T5 no tiene endpoint HTTP**: la regla de dominio existe en `TRANSITIONS`
  (`action: 'approve_purchase'`, `from: 'PRESUPUESTO_APROBADO'`,
  `to: 'COMPRA_APROBADA'`, `role: 'DIRECTOR_GENERAL'`), pero no existe
  `ApprovePurchaseUseCase` ni ninguna ruta `approve-purchase` en el
  controller. Esta feature crea ambos, siguiendo el patrón exacto de
  `ApproveBudgetUseCase`/`POST :id/approve-budget` (T3).
- **T6 ya es alcanzable a nivel de dominio pero no a nivel HTTP**: la regla
  de dominio existe en `TRANSITIONS` (`action: 'reject'`,
  `from: 'PRESUPUESTO_APROBADO'`, `role: 'DIRECTOR_GENERAL'`,
  `requiredData: ['rejectionReason']`) y `RejectOdcUseCase`/`RejectOdcDto`
  (creados en `odc-budget-validation`) ya son agnósticos de rol — no
  hardcodean `ADMINISTRACION` en ninguna parte, solo pasan `actor.role` tal
  cual a `order.transition('reject', actor.role, data)`. Lo único que
  bloquea T6 hoy es la metadata `@Roles('ADMINISTRACION')` del handler
  `reject` en `odc.controller.ts`, consumida por `RolesGuard`
  (`backend/src/modules/auth/infrastructure/guards/roles.guard.ts`), que
  responde 403 **antes** de que la petición llegue al controller/use-case si
  el rol de sesión no está en la lista. `RolesGuard.canActivate` usa
  `requiredRoles.includes(role)` — una lista con más de un rol ya funciona
  con la implementación actual del guard, sin cambios en el guard mismo.
  Esta feature solo cambia la metadata a
  `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` en el handler `reject`.
- **Doble capa de autorización ya existente (sin cambios de diseño)**: el
  `RolesGuard` decide, a nivel de ruta, qué roles pueden siquiera intentar el
  endpoint (control grueso); `PurchaseOrder.transition()` decide, a nivel de
  regla, qué rol es válido para el estado actual de la ODC (control fino,
  vía `InvalidRoleTransitionError` → 403). Ampliar la metadata del guard no
  le da a `DIRECTOR_GENERAL` poder de rechazo sobre `PENDIENTE_ADMIN`: el
  dominio sigue exigiendo `ADMINISTRACION` para esa regla y seguirá
  respondiendo 403 si `DIRECTOR_GENERAL` lo intenta. Ver [[design]].

## Contexto: transiciones que cubre esta feature

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T5 | Aprobar compra | `PRESUPUESTO_APROBADO` → `COMPRA_APROBADA` | DIRECTOR_GENERAL | — |
| T6 | Rechazar | `PRESUPUESTO_APROBADO` → `RECHAZADA` | DIRECTOR_GENERAL | `rejectionReason` obligatorio |

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `DIRECTOR_GENERAL` hace
  `POST /api/odcs/:id/approve-purchase` sobre una ODC en estado
  `PRESUPUESTO_APROBADO` THE SYSTEM SHALL transicionarla a
  `COMPRA_APROBADA` (T5), registrar la fila de historial (`fromStatus`
  `PRESUPUESTO_APROBADO`, `toStatus` `COMPRA_APROBADA`, `userId` de la
  sesión, `note` null) y responder HTTP 200 con la ODC actualizada; IF el rol
  del usuario no es `DIRECTOR_GENERAL` THEN THE SYSTEM SHALL responder HTTP
  403 sin transicionar.
  *Verificación*: test del use-case `ApprovePurchaseUseCase` con repositorio
  mockeado (transición, historial, ODC devuelta, y el caso de rol distinto
  rechazado con `InvalidRoleTransitionError`); test del controller
  assertando la ruta, la metadata `@Roles('DIRECTOR_GENERAL')` y el HTTP 200.

- **R2**: IF `POST /api/odcs/:id/approve-purchase` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero no está en `PRESUPUESTO_APROBADO` THEN THE SYSTEM SHALL
  responder HTTP 409 sin transicionar (la acción `approve_purchase` del
  dominio solo tiene una regla, desde `PRESUPUESTO_APROBADO`, así que
  cualquier otro estado cae en este caso).
  *Verificación*: test del use-case con id inexistente (404) y con la ODC en
  cada uno de los otros 7 estados de la máquina (409, sin mutar `status` ni
  el resto de propiedades).

- **R3**: WHEN se amplía la ruta `POST /api/odcs/:id/reject` THE SYSTEM SHALL
  declarar su metadata de roles como `@Roles('ADMINISTRACION',
  'DIRECTOR_GENERAL')` (antes solo `'ADMINISTRACION'`), sin modificar
  `RejectOdcUseCase` ni `RejectOdcDto`, que ya son agnósticos de rol.
  *Verificación*: test del controller assertando que la metadata
  `ROLES_KEY` del handler `reject` es exactamente
  `['ADMINISTRACION', 'DIRECTOR_GENERAL']`.

- **R4**: WHEN un usuario autenticado con rol `DIRECTOR_GENERAL` hace
  `POST /api/odcs/:id/reject` con `rejectionReason` no vacío sobre una ODC en
  estado `PRESUPUESTO_APROBADO` THE SYSTEM SHALL transicionarla a
  `RECHAZADA` (T6), persistir `rejectionReason` en la ODC, registrar la fila
  de historial (`fromStatus` `PRESUPUESTO_APROBADO`, `toStatus` `RECHAZADA`,
  `userId` de la sesión, `note` = `rejectionReason`) y responder HTTP 200 con
  la ODC actualizada.
  *Verificación*: test del use-case `RejectOdcUseCase` (ya existente, sin
  cambios de código, solo nuevo caso de test) con actor `DIRECTOR_GENERAL` y
  la ODC en `PRESUPUESTO_APROBADO`; test del controller invocando `reject`
  con sesión `DIRECTOR_GENERAL` y assertando HTTP 200.

- **R5**: WHEN un usuario autenticado con rol `ADMINISTRACION` hace
  `POST /api/odcs/:id/reject` con `rejectionReason` no vacío sobre una ODC en
  estado `PENDIENTE_ADMIN` THE SYSTEM SHALL seguir transicionándola a
  `RECHAZADA` (T4) exactamente como antes de esta feature — la ampliación de
  roles en R3 no debe alterar el comportamiento de T4 ya aprobado en
  `odc-budget-validation`.
  *Verificación*: test de regresión del use-case y del controller
  reejecutando el caso de éxito de T4 (actor `ADMINISTRACION`, ODC en
  `PENDIENTE_ADMIN`) tras el cambio de metadata de R3, assertando el mismo
  HTTP 200 y la misma fila de historial que antes.

- **R6**: IF un usuario autenticado con rol `DIRECTOR_GENERAL` hace
  `POST /api/odcs/:id/reject` sobre una ODC en estado `PENDIENTE_ADMIN`
  THEN THE SYSTEM SHALL responder HTTP 403 sin transicionar (la regla T4 del
  dominio exige `ADMINISTRACION` para ese estado; `DIRECTOR_GENERAL` ya pasa
  el guard HTTP tras R3 pero el dominio sigue rechazándolo por rol); IF un
  usuario autenticado con rol `ADMINISTRACION` hace
  `POST /api/odcs/:id/reject` sobre una ODC en estado `PRESUPUESTO_APROBADO`
  THEN THE SYSTEM SHALL responder HTTP 403 sin transicionar (la regla T6
  exige `DIRECTOR_GENERAL`; comportamiento ya cubierto en
  `odc-budget-validation` R5, que debe seguir intacto tras esta feature).
  *Verificación*: test del use-case `RejectOdcUseCase` con ambas
  combinaciones (`DIRECTOR_GENERAL`+`PENDIENTE_ADMIN`,
  `ADMINISTRACION`+`PRESUPUESTO_APROBADO`) assertando
  `InvalidRoleTransitionError` y que `order.status` no cambia; test del
  controller assertando HTTP 403 en ambos casos.

- **R7**: IF `POST /api/odcs/:id/reject` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404
  independientemente de si el actor es `ADMINISTRACION` o
  `DIRECTOR_GENERAL`; IF la ODC existe pero está en un estado sin ninguna
  regla de rechazo (`BORRADOR`, `COMPRA_APROBADA`, `PAGO_REGISTRADO`,
  `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA` o ya `RECHAZADA`) THEN THE SYSTEM
  SHALL responder HTTP 409 sin transicionar, para ambos roles ahora
  permitidos por el guard.
  *Verificación*: test del use-case con id inexistente (404) reejecutado con
  actor `DIRECTOR_GENERAL`; test con la ODC en cada uno de los 6 estados sin
  regla de rechazo usando actor `DIRECTOR_GENERAL` (409, sin mutar) — el caso
  equivalente con `ADMINISTRACION` ya está cubierto en
  `odc-budget-validation` R5 y no se duplica aquí.

## Fuera de alcance

- T7–T9 (registro de pago, evidencia de pago, factura y cierre) — features 6,
  7 y 8.
- Cualquier endpoint de creación, edición, listado o detalle de ODC
  (`POST /api/odcs`, `PATCH /api/odcs/:id`, `GET /api/odcs`,
  `GET /api/odcs/:id`), así como `POST /api/odcs/:id/submit` y
  `POST /api/odcs/:id/approve-budget` — ya entregados por `odc-create-draft`
  (feature 3) y `odc-budget-validation` (feature 4), sin cambios en esta
  feature.
- Cambios al dominio (`PurchaseOrder`, `domain/errors/*`), a la interface
  `PurchaseOrderRepository`, a las entidades ORM o al repositorio TypeORM —
  T5 y T6 ya están completas y aprobadas en la máquina de estados desde
  `odc-create-draft`; esta feature solo las invoca vía HTTP.
- Cambios a `RolesGuard` o a la implementación del decorator `@Roles` —
  ambos ya soportan listas de más de un rol sin modificación (`R3`).
- Cambios a `RejectOdcDto` o a `RejectOdcUseCase` — ya son agnósticos de rol
  y de estado desde `odc-budget-validation`; esta feature no toca su código,
  solo añade casos de test que ejercitan rutas ya soportadas por ellos.
- Almacenamiento de presupuesto: el sistema NO almacena presupuesto (decisión
  del plan maestro); `DIRECTOR_GENERAL` aprueba o rechaza la compra
  manualmente sin dato adicional en T5.
- Dashboards, contadores y cualquier UI (features 9–13).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-20) ← gate obligatorio antes de implementar
