---
feature: "odc-register-payment"
status: approved        # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-register-payment]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F6 `odc-register-payment`** de
> `plans/001-odc-purchase-system.md` (transición T7 de la tabla T1–T10), sobre
> la máquina de estados de dominio **ya completa y aprobada** en
> `specs/odc-create-draft/requirements.md` (R3, R4) —
> `PurchaseOrder.transition(action, role, data)` en
> `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` ya
> implementa T7 (`action: 'register_payment'`, `from: 'COMPRA_APROBADA'`,
> `to: 'PAGO_REGISTRADO'`, `role: 'DIRECTOR_OPS'`,
> `requiredData: ['paymentDate', 'paymentMethod']`), con errores tipados de rol
> (403), de estado (409) y de datos faltantes (400), e historial automático.
> Esta feature **solo añade** el DTO, el use-case y el wiring HTTP que invocan
> esa regla — no modifica `domain/`, `domain/repositories/` ni las entidades
> ORM/repositorio de infraestructura ya existentes. Los tests son unitarios
> con el repositorio mockeado; no tocan PostgreSQL.

## Verificación previa contra el código vivo

Confirmado leyendo `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`
y `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` antes
de redactar los requisitos:

- **T7 no tiene endpoint HTTP ni DTO**: la regla de dominio existe en
  `TRANSITIONS` (`action: 'register_payment'`, `from: 'COMPRA_APROBADA'`,
  `to: 'PAGO_REGISTRADO'`, `role: 'DIRECTOR_OPS'`,
  `requiredData: ['paymentDate', 'paymentMethod']`) y la interfaz
  `TransitionData` ya declara `paymentDate?`, `paymentMethod?`,
  `paymentReference?` y `paymentNotes?`, pero no existe `RegisterPaymentDto`,
  `RegisterPaymentUseCase` ni ninguna ruta `payment` en el controller. Esta
  feature crea los tres, siguiendo el patrón exacto de
  `ApproveBudgetUseCase`/`POST :id/approve-budget` (T3) y
  `ApprovePurchaseUseCase`/`POST :id/approve-purchase` (T5), con la diferencia
  de que T7 sí exige datos de entrada (como `RejectOdcDto` para T4/T6), por lo
  que también sigue el patrón de `RejectOdcDto`/`RejectOdcUseCase`.
- **T7 no tiene restricción de creador**: a diferencia de T2 y T10 (tabla
  T1–T10 de `plans/001-odc-purchase-system.md`, columna "Rol autorizado"
  con la anotación explícita "DIRECTOR_OPS (solo el creador)"), T7 solo lista
  `DIRECTOR_OPS` sin esa anotación — mismo patrón que T3 (`ADMINISTRACION`) y
  T5 (`DIRECTOR_GENERAL`), donde cualquier usuario con el rol autorizado puede
  ejecutar la transición sobre cualquier ODC visible, sin comparar
  `createdById`. Ver [[design]].
- **`assertRequiredData` del dominio ya reconoce ambos campos obligatorios de
  T7**: la función privada `assertRequiredData` en `purchase-order.entity.ts`
  ya trata `paymentDate` y `paymentMethod` como parte de `rule.requiredData`
  para la acción `register_payment`, lanzando `MissingTransitionDataError` si
  llegan `undefined` o como string vacío tras `trim()`. El DTO de esta feature
  añade una segunda capa de validación (HTTP 400 vía `class-validator`, antes
  de llegar al dominio), sin duplicar la regla de negocio.

## Contexto: transición que cubre esta feature

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T7 | Registrar pago | `COMPRA_APROBADA` → `PAGO_REGISTRADO` | DIRECTOR_OPS | `paymentDate`, `paymentMethod` obligatorios; `paymentReference`, `paymentNotes` opcionales |

## Requisitos funcionales

- **R1**: WHEN se define el DTO del registro de pago THE SYSTEM SHALL declarar
  `RegisterPaymentDto` con `paymentDate: string` obligatorio validado como
  fecha ISO (`@IsDateString`, `@IsNotEmpty`), `paymentMethod: string`
  obligatorio (`@IsString`, `@IsNotEmpty`), y `paymentReference?: string` y
  `paymentNotes?: string` opcionales (`@IsOptional`, `@IsString`); IF
  `POST /api/odcs/:id/payment` llega sin `paymentDate`, sin `paymentMethod`,
  con `paymentDate` en un formato que no es una fecha ISO válida, o con
  `paymentMethod` como string vacío THEN THE SYSTEM SHALL responder HTTP 400
  sin transicionar la ODC.
  *Verificación*: test del DTO (`validate()` sobre payload sin cada campo
  obligatorio, con `paymentDate` no-fecha y con `paymentMethod` vacío asserta
  errores; payload válido con y sin los campos opcionales no genera errores);
  test del controller/use-case con cada dato obligatorio faltante assertando
  HTTP 400.

- **R2**: WHEN un usuario autenticado con rol `DIRECTOR_OPS` hace
  `POST /api/odcs/:id/payment` con `paymentDate` y `paymentMethod` válidos
  (y opcionalmente `paymentReference` y/o `paymentNotes`) sobre una ODC en
  estado `COMPRA_APROBADA` THE SYSTEM SHALL transicionarla a
  `PAGO_REGISTRADO` (T7), persistir `paymentDate` y `paymentMethod`, persistir
  `paymentReference` y `paymentNotes` cuando se envíen (o dejarlos en `null`
  si se omiten), registrar la fila de historial (`fromStatus`
  `COMPRA_APROBADA`, `toStatus` `PAGO_REGISTRADO`, `userId` de la sesión,
  `note` null) y responder HTTP 200 con la ODC actualizada; IF el rol del
  usuario no es `DIRECTOR_OPS` THEN THE SYSTEM SHALL responder HTTP 403 sin
  transicionar.
  *Verificación*: test del use-case `RegisterPaymentUseCase` con repositorio
  mockeado (transición, campos obligatorios y opcionales persistidos con y
  sin `paymentReference`/`paymentNotes`, historial, ODC devuelta, y el caso de
  rol distinto rechazado con `InvalidRoleTransitionError`); test del
  controller assertando la ruta, la metadata `@Roles('DIRECTOR_OPS')` y el
  HTTP 200.

- **R3**: IF `POST /api/odcs/:id/payment` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero no está en `COMPRA_APROBADA` THEN THE SYSTEM SHALL responder
  HTTP 409 sin transicionar (la acción `register_payment` del dominio solo
  tiene una regla, desde `COMPRA_APROBADA`, así que cualquier otro estado cae
  en este caso).
  *Verificación*: test del use-case con id inexistente (404) y con la ODC en
  cada uno de los otros 7 estados de la máquina (409, sin mutar `status` ni
  el resto de propiedades).

## Fuera de alcance

- T8 (evidencia de pago) y T9 (factura + almacén) — features 7 y 8
  (`odc-payment-evidence`, `odc-invoice-completion`).
- Cualquier endpoint de creación, edición, listado, detalle, aprobación de
  presupuesto o aprobación de compra de ODC (`POST /api/odcs`,
  `PATCH /api/odcs/:id`, `GET /api/odcs`, `GET /api/odcs/:id`,
  `POST /api/odcs/:id/submit`, `POST /api/odcs/:id/approve-budget`,
  `POST /api/odcs/:id/approve-purchase`, `POST /api/odcs/:id/reject`) — ya
  entregados por `odc-create-draft`, `odc-budget-validation` y
  `odc-purchase-approval` (features 3, 4 y 5), sin cambios en esta feature.
- Cambios al dominio (`PurchaseOrder`, `domain/errors/*`), a la interface
  `PurchaseOrderRepository`, a las entidades ORM o al repositorio TypeORM — T7
  ya está completa y aprobada en la máquina de estados desde
  `odc-create-draft`; esta feature solo la invoca vía HTTP.
- Subida, almacenamiento o descarga de archivos (`paymentEvidenceFile`,
  `evidenceReference`, `invoiceFile`, etc.) — features 7 y 8. Esta feature
  registra únicamente los datos de pago (`paymentDate`, `paymentMethod`,
  `paymentReference`, `paymentNotes`), sin ningún archivo adjunto.
  T8 requiere un comprobante subido por `ADMINISTRACION`, no por
  `DIRECTOR_OPS`, y queda fuera de este alcance.
- Restricción por creador: T7 no la exige (a diferencia de T2/T10); esta
  feature no añade ningún chequeo de `createdById`.
- Almacenamiento de presupuesto: el sistema NO almacena presupuesto (decisión
  del plan maestro); no aplica a T7.
- Dashboards, contadores y cualquier UI (features 9–13).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-20) ← gate obligatorio antes de implementar
