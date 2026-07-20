---
feature: "odc-budget-validation"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-budget-validation]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F4 `odc-budget-validation`** de
> `plans/001-odc-purchase-system.md` (transiciones T3 y T4 de la tabla
> T1–T10), sobre la máquina de estados de dominio **ya completa y aprobada**
> en `specs/odc-create-draft/requirements.md` (R3, R4) —
> `PurchaseOrder.transition(action, role, data)` en
> `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` ya
> implementa las 10 transiciones, con errores tipados de rol (403), de estado
> (409) y de datos faltantes (400), e historial automático. Esta feature
> **solo añade** los use-cases y el wiring HTTP que invocan esa máquina para
> T3 y T4 — no modifica `domain/`, `domain/repositories/` ni las entidades
> ORM/repositorio de infraestructura ya existentes. Los tests son unitarios
> con el repositorio mockeado; no tocan PostgreSQL.

## Contexto: transiciones que cubre esta feature

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T3 | Aprobar presupuesto | `PENDIENTE_ADMIN` → `PRESUPUESTO_APROBADO` | ADMINISTRACION | — |
| T4 | Rechazar | `PENDIENTE_ADMIN` → `RECHAZADA` | ADMINISTRACION | `rejectionReason` obligatorio |

> **Nota sobre la acción `reject`**: en el dominio, T4 y T6
> (`PRESUPUESTO_APROBADO → RECHAZADA`, rol `DIRECTOR_GENERAL`) comparten la
> **misma** acción `reject` — decisión ya aprobada en `odc-create-draft`
> (R3/R4). El endpoint `POST /api/odcs/:id/reject` que esta feature expone
> queda restringido a `ADMINISTRACION` (`@Roles('ADMINISTRACION')`), así que
> solo T4 es alcanzable a través de él hasta que la feature 5
> (`odc-purchase-approval`) amplíe los roles permitidos sobre esta misma ruta
> para habilitar T6. Ver [[design]] para el razonamiento completo.

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `ADMINISTRACION` hace
  `POST /api/odcs/:id/approve-budget` sobre una ODC en estado
  `PENDIENTE_ADMIN` THE SYSTEM SHALL transicionarla a `PRESUPUESTO_APROBADO`
  (T3), registrar la fila de historial (`fromStatus` `PENDIENTE_ADMIN`,
  `toStatus` `PRESUPUESTO_APROBADO`, `userId` de la sesión, `note` null) y
  responder HTTP 200 con la ODC actualizada; IF el rol del usuario no es
  `ADMINISTRACION` THEN THE SYSTEM SHALL responder HTTP 403 sin transicionar.
  *Verificación*: test del use-case `ApproveBudgetUseCase` con repositorio
  mockeado (transición, historial, ODC devuelta); test del controller
  assertando la ruta, la metadata `@Roles('ADMINISTRACION')` y el HTTP 200.

- **R2**: IF `POST /api/odcs/:id/approve-budget` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero no está en `PENDIENTE_ADMIN` THEN THE SYSTEM SHALL responder
  HTTP 409 sin transicionar (la acción `approve_budget` del dominio solo
  tiene una regla, desde `PENDIENTE_ADMIN`, así que cualquier otro estado cae
  en este caso).
  *Verificación*: test del use-case con id inexistente (404) y con la ODC en
  cada uno de los otros 7 estados de la máquina (409, sin mutar `status` ni
  el resto de propiedades).

- **R3**: WHEN se define el DTO del rechazo THE SYSTEM SHALL declarar
  `RejectOdcDto` con `rejectionReason: string` obligatorio validado con
  `class-validator` (`@IsString`, `@IsNotEmpty`); IF
  `POST /api/odcs/:id/reject` llega sin `rejectionReason` o con un string
  vacío THEN THE SYSTEM SHALL responder HTTP 400 sin transicionar.
  *Verificación*: test del DTO (`validate()` sobre payload sin el campo y con
  string vacío asserta error; payload válido no genera errores); test del
  controller/use-case con el dato faltante assertando HTTP 400.

- **R4**: WHEN un usuario autenticado con rol `ADMINISTRACION` hace
  `POST /api/odcs/:id/reject` con `rejectionReason` no vacío sobre una ODC en
  estado `PENDIENTE_ADMIN` THE SYSTEM SHALL transicionarla a `RECHAZADA` (T4),
  persistir `rejectionReason` en la ODC, registrar la fila de historial
  (`fromStatus` `PENDIENTE_ADMIN`, `toStatus` `RECHAZADA`, `userId` de la
  sesión, `note` = `rejectionReason`) y responder HTTP 200 con la ODC
  actualizada; IF el rol del usuario no es `ADMINISTRACION` THEN THE SYSTEM
  SHALL responder HTTP 403 sin transicionar (el endpoint queda restringido a
  `ADMINISTRACION` en esta feature; ver nota de contexto sobre T6).
  *Verificación*: test del use-case `RejectOdcUseCase` con repositorio
  mockeado (transición, `rejectionReason` persistido, historial con `note`);
  test del controller assertando la ruta, la metadata
  `@Roles('ADMINISTRACION')` y el HTTP 200.

- **R5**: IF `POST /api/odcs/:id/reject` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero está en un estado sin regla de rechazo (`BORRADOR`,
  `COMPRA_APROBADA`, `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA`
  o ya `RECHAZADA`) THEN THE SYSTEM SHALL responder HTTP 409 sin
  transicionar; IF la ODC está en `PRESUPUESTO_APROBADO` (regla de rechazo
  T6, reservada a `DIRECTOR_GENERAL`) y quien invoca es `ADMINISTRACION` THEN
  THE SYSTEM SHALL responder HTTP 403 sin transicionar (es un mismatch de rol
  para la regla que sí existe para ese estado, no de estado — comportamiento
  heredado del dominio ya aprobado en R4 de `odc-create-draft`, sin lógica
  nueva en el use-case).
  *Verificación*: test del use-case con id inexistente (404); test con la ODC
  en cada uno de los 6 estados sin regla de rechazo (409, sin mutar); test
  específico con la ODC en `PRESUPUESTO_APROBADO` y actor `ADMINISTRACION`
  (403, sin mutar).

## Fuera de alcance

- T5 (`approve_purchase`, `PRESUPUESTO_APROBADO → COMPRA_APROBADA`) y ampliar
  `/reject` con el rol `DIRECTOR_GENERAL` para habilitar T6 — feature 5
  (`odc-purchase-approval`). El endpoint `/reject` que esta feature crea
  queda mecánicamente listo para T6 (la acción de dominio ya existe y está
  aprobada desde `odc-create-draft`), pero esta feature no añade tests,
  guard ni documentación de T6 — solo T4.
- T7–T9 (registro de pago, evidencia de pago, factura y cierre) — features 6,
  7 y 8.
- Cualquier endpoint de creación, edición, listado o detalle de ODC
  (`POST /api/odcs`, `PATCH /api/odcs/:id`, `GET /api/odcs`,
  `GET /api/odcs/:id`) — ya entregados por `odc-create-draft` (feature 3),
  sin cambios en esta feature.
- Cambios al dominio (`PurchaseOrder`, `domain/errors/*`), a la interface
  `PurchaseOrderRepository`, a las entidades ORM o al repositorio TypeORM —
  la máquina de estados y la persistencia ya están completas y aprobadas;
  esta feature solo las invoca.
- Almacenamiento de presupuesto: el sistema NO almacena presupuesto (decisión
  del plan maestro); `ADMINISTRACION` aprueba o rechaza manualmente sin dato
  adicional en T3.
- Dashboards, contadores y cualquier UI (features 9–13).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-20) ← gate obligatorio antes de implementar
