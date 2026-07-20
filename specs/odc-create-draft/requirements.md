---
feature: "odc-create-draft"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-create-draft]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F3 `odc-create-draft`** de
> `plans/001-odc-purchase-system.md`, más su máquina de estados (tabla T1–T10),
> el modelo de datos (`purchase_orders`, `odc_status_history`), la numeración
> `ODC-YYYY-NNNNN` y las reglas transversales (403 rol / 409 estado, historial
> por transición, visibilidad de `BORRADOR`). Los tests unitarios que verifican
> estos requisitos NO tocan PostgreSQL: la máquina de estados se verifica en la
> entidad de dominio pura y los use-cases con repositorios mockeados (ver
> [[design]]).

## Contexto: máquina de estados (fuente de verdad del plan maestro)

```
BORRADOR → PENDIENTE_ADMIN → PRESUPUESTO_APROBADO → COMPRA_APROBADA
         → PAGO_REGISTRADO → EVIDENCIA_PAGO_SUBIDA → COMPLETADA

PENDIENTE_ADMIN ──rechazo──→ RECHAZADA ──reenvío──→ PENDIENTE_ADMIN
PRESUPUESTO_APROBADO ──rechazo──→ RECHAZADA
```

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T1 | Crear borrador | — → `BORRADOR` | DIRECTOR_OPS | description, quantity, unit, unitPriceCents, supplier; comments opcional |
| T2 | Enviar a administración | `BORRADOR` → `PENDIENTE_ADMIN` | DIRECTOR_OPS (solo el creador) | — |
| T3 | Aprobar presupuesto | `PENDIENTE_ADMIN` → `PRESUPUESTO_APROBADO` | ADMINISTRACION | — |
| T4 | Rechazar | `PENDIENTE_ADMIN` → `RECHAZADA` | ADMINISTRACION | rejectionReason obligatorio |
| T5 | Aprobar compra | `PRESUPUESTO_APROBADO` → `COMPRA_APROBADA` | DIRECTOR_GENERAL | — |
| T6 | Rechazar | `PRESUPUESTO_APROBADO` → `RECHAZADA` | DIRECTOR_GENERAL | rejectionReason obligatorio |
| T7 | Registrar pago | `COMPRA_APROBADA` → `PAGO_REGISTRADO` | DIRECTOR_OPS | paymentDate, paymentMethod; paymentReference, paymentNotes opcionales |
| T8 | Subir evidencia de pago | `PAGO_REGISTRADO` → `EVIDENCIA_PAGO_SUBIDA` | ADMINISTRACION | paymentEvidenceFile; evidenceReference opcional |
| T9 | Subir factura + almacén | `EVIDENCIA_PAGO_SUBIDA` → `COMPLETADA` | DIRECTOR_OPS | invoiceFile, warehouseEntryDate; invoiceNumber, invoiceDate, observations opcionales |
| T10 | Editar y reenviar | `RECHAZADA` → `PENDIENTE_ADMIN` | DIRECTOR_OPS (solo el creador) | — (la edición de campos de T1 va por PATCH) |

Esta feature entrega la máquina de estados **completa** en el dominio (las
features 4–8 solo la invocan), pero **solo expone endpoints** para T1, T2, T10,
la edición (PATCH) y las consultas (lista y detalle).

## Requisitos funcionales

- **R1**: WHEN la capa de dominio del módulo `odc` modela una orden de compra
  THE SYSTEM SHALL representarla con una clase pura `PurchaseOrder` con las
  propiedades del modelo de datos (`id`, `odcNumber`, `status`, `description`,
  `quantity`, `unit`, `unitPriceCents`, `totalCents`, `supplier`, `comments?`,
  `createdById`, `rejectionReason?`, los campos opcionales de pago/evidencia/
  factura de las fases posteriores, `createdAt`, `updatedAt`), donde `status`
  solo admite los 8 valores en español de la máquina de estados (`BORRADOR`,
  `PENDIENTE_ADMIN`, `PRESUPUESTO_APROBADO`, `COMPRA_APROBADA`,
  `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA`, `RECHAZADA`), sin
  imports de NestJS, TypeORM ni ninguna librería de infraestructura.
  *Verificación*: test unitario que construye la entidad y asserta sus
  propiedades y el tipo del status; chequeo estructural de que el archivo de la
  entidad no importa framework/ORM.

- **R2**: WHEN el dominio crea o edita una ODC THE SYSTEM SHALL calcular
  `totalCents = quantity * unitPriceCents` dentro de la entidad de dominio y
  SHALL NOT aceptar un `totalCents` provisto desde fuera del dominio (los DTOs
  de entrada no lo declaran y el `ValidationPipe` con `whitelist: true` lo
  descarta si llega en el payload).
  *Verificación*: tests de dominio con varias combinaciones de
  `quantity`/`unitPriceCents` assertando el total; test del use-case de
  creación/edición assertando que un `totalCents` malicioso del payload no
  altera el calculado; chequeo de que los DTOs no declaran `totalCents`.

- **R3**: WHEN se invoca `transition(action, role, data)` sobre una
  `PurchaseOrder` con una acción válida para el estado actual y un rol
  autorizado según la tabla T1–T10 THE SYSTEM SHALL cambiar `status` al estado
  destino de la tabla, aplicar los datos propios de la transición (p. ej.
  `rejectionReason` en T4/T6, campos de pago en T7) y producir la entrada de
  historial correspondiente (`fromStatus`, `toStatus`, `note` — `note` lleva el
  motivo de rechazo en T4/T6). La máquina cubre las 10 transiciones en el
  dominio aunque esta feature solo exponga endpoints para T1, T2 y T10.
  *Verificación*: tests de dominio en
  `purchase-order.entity.spec.ts` que ejercitan TODAS las transiciones válidas
  T1–T10 assertando estado destino, datos aplicados y entrada de historial.

- **R4**: IF `transition` se invoca con un rol no autorizado para la acción
  THEN THE SYSTEM SHALL lanzar un error de dominio de "rol no permitido"
  (traducible a HTTP 403); IF la acción no es válida desde el estado actual
  THEN THE SYSTEM SHALL lanzar un error de dominio de "transición de estado
  inválida" (traducible a HTTP 409); IF faltan los datos requeridos de la
  transición (p. ej. `rejectionReason` vacío en T4/T6) THEN THE SYSTEM SHALL
  lanzar un error de dominio de datos faltantes; en los tres casos la entidad
  SHALL quedar sin mutar.
  *Verificación*: tests de dominio que, por cada estado, intentan acciones
  fuera de orden y roles equivocados, assertando el tipo de error lanzado y
  que `status` y el resto de propiedades no cambian.

- **R5**: WHEN se define la persistencia del módulo `odc` THE SYSTEM SHALL
  mapear entidades ORM sobre la tabla `purchase_orders` (constraint UNIQUE
  sobre `odcNumber`, FK `createdById` → `users`, con TODAS las columnas del
  modelo de datos incluidas las nullable de las fases 4–8) y sobre la tabla
  `odc_status_history` (`id`, FK `odcId`, `fromStatus` nullable, `toStatus`,
  FK `userId`, `note` nullable, `createdAt`), implementando la interface
  `PurchaseOrderRepository` declarada en `domain/repositories` con la
  implementación TypeORM registrada por token string en el module; la
  actualización de una ODC y la inserción de su fila de historial SHALL
  ejecutarse en la misma transacción.
  *Verificación*: tests unitarios que inspeccionan los metadatos de TypeORM de
  ambas entidades ORM (tablas, unicidad de `odcNumber`, FKs, nullables) sin
  abrir conexión; test del repositorio con el manager de TypeORM mockeado
  assertando que update + insert de historial comparten transacción.

- **R6**: WHEN se crea un borrador THE SYSTEM SHALL asignarle un `odcNumber`
  con formato `ODC-YYYY-NNNNN` donde `YYYY` es el año de creación y `NNNNN` es
  una secuencia de 5 dígitos con ceros a la izquierda que empieza en `00001` y
  reinicia con cada año; IF dos creaciones concurrentes calculan el mismo
  número THEN THE SYSTEM SHALL resolver el conflicto (constraint UNIQUE +
  reintento) de modo que ambas terminan con números distintos y ninguna falla
  por la colisión.
  *Verificación*: tests unitarios del formateo y de la secuencia por año en el
  dominio (año nuevo → `00001`, siguiente correlativo dentro del año); test
  del repositorio con conflicto de UNIQUE simulado assertando el reintento con
  el siguiente número.

- **R7**: WHEN un usuario autenticado con rol `DIRECTOR_OPS` hace
  `POST /api/odcs` con `description`, `quantity` (entero > 0), `unit`,
  `unitPriceCents` (entero > 0), `supplier` y opcionalmente `comments`
  THE SYSTEM SHALL crear la ODC en estado `BORRADOR` con `odcNumber` asignado
  (R6), `createdById` igual al usuario de la sesión, `totalCents` calculado
  (R2), registrar la fila de historial (`fromStatus` null → `BORRADOR`) y
  responder HTTP 201 con la ODC creada; IF el rol del usuario no es
  `DIRECTOR_OPS` THEN THE SYSTEM SHALL responder HTTP 403 sin crear nada.
  *Verificación*: test del use-case de creación con repositorio mockeado
  (estado, número, creador, total, historial); test del controller assertando
  la ruta, el status 201 y la metadata `@Roles('DIRECTOR_OPS')`.

- **R8**: IF `POST /api/odcs` o `PATCH /api/odcs/:id` llega con datos
  inválidos (algún campo obligatorio de T1 ausente o vacío, `quantity` o
  `unitPriceCents` no enteros o ≤ 0, o tipos incorrectos) THEN THE SYSTEM
  SHALL responder HTTP 400 sin crear ni modificar ninguna ODC.
  *Verificación*: tests de los DTOs con `class-validator` (`validate()` sobre
  payloads inválidos asserta los errores por campo; payload válido pasa sin
  errores).

- **R9**: WHEN el creador de una ODC en estado `BORRADOR` hace
  `POST /api/odcs/:id/submit` THE SYSTEM SHALL transicionar la ODC a
  `PENDIENTE_ADMIN` (T2), registrar la fila de historial
  (`BORRADOR` → `PENDIENTE_ADMIN` con el userId de la sesión) y responder
  HTTP 200 con la ODC actualizada; IF quien lo intenta no es el creador
  (aunque sea `DIRECTOR_OPS`) THEN THE SYSTEM SHALL responder HTTP 403 sin
  transicionar.
  *Verificación*: test del use-case de submit con repositorio mockeado
  (transición, historial, chequeo de creador) y test del error 403 con un
  userId distinto al `createdById`.

- **R10**: WHEN el creador de una ODC en estado `RECHAZADA` hace
  `POST /api/odcs/:id/submit` THE SYSTEM SHALL transicionar la ODC a
  `PENDIENTE_ADMIN` (T10, reenvío) añadiendo una nueva fila de historial y
  conservando las filas de rechazo anteriores, y responder HTTP 200; IF la ODC
  está en cualquier estado distinto de `BORRADOR` o `RECHAZADA` THEN THE
  SYSTEM SHALL responder HTTP 409 sin transicionar.
  *Verificación*: test del use-case de submit partiendo de `RECHAZADA`
  (nueva fila de historial, sin borrar las previas) y tests del 409 desde
  estados no enviables (p. ej. `PENDIENTE_ADMIN`, `COMPLETADA`).

- **R11**: WHEN el creador de una ODC en estado `BORRADOR` o `RECHAZADA` hace
  `PATCH /api/odcs/:id` con uno o más campos de T1 (`description`, `quantity`,
  `unit`, `unitPriceCents`, `supplier`, `comments`) THE SYSTEM SHALL aplicar
  los cambios, recalcular `totalCents` en el dominio (R2) y responder HTTP 200
  con la ODC actualizada (el estado NO cambia: el reenvío es el submit de
  R10); IF la ODC está en cualquier otro estado THEN THE SYSTEM SHALL
  responder HTTP 409 sin modificarla; IF quien lo intenta no es el creador
  THEN THE SYSTEM SHALL responder HTTP 403.
  *Verificación*: tests del use-case de edición con repositorio mockeado:
  edición en `BORRADOR` y en `RECHAZADA` (campos aplicados, total
  recalculado, status intacto), 409 en estados no editables y 403 con un
  userId distinto al `createdById`.

- **R12**: WHEN un usuario autenticado de cualquiera de los 3 roles hace
  `GET /api/odcs?status=&page=` THE SYSTEM SHALL responder HTTP 200 con una
  lista paginada (`{ items, total, page, pageSize }`, `pageSize` default 20)
  filtrada por `status` cuando se indica, donde las ODCs en `BORRADOR` solo se
  incluyen para su creador y las ODCs en cualquier otro estado son visibles
  para los 3 roles.
  *Verificación*: tests del use-case de listado con repositorio mockeado
  assertando el filtro de visibilidad que recibe el repositorio según el rol/
  usuario de la sesión, el filtro por status y la forma de la paginación.

- **R13**: WHEN un usuario autenticado hace `GET /api/odcs/:id` sobre una ODC
  visible para él (R12) THE SYSTEM SHALL responder HTTP 200 con la ODC y su
  historial de estados en orden cronológico; IF la ODC no existe THEN THE
  SYSTEM SHALL responder HTTP 404; IF la ODC está en `BORRADOR` y quien
  consulta no es su creador THEN THE SYSTEM SHALL responder HTTP 403.
  *Verificación*: tests del use-case de detalle con repositorio mockeado:
  ODC con historial incluido y ordenado, 404 con id inexistente, 403 sobre el
  `BORRADOR` de otro usuario.

## Fuera de alcance

- Endpoints y use-cases de las transiciones T3–T9: aprobación/rechazo de
  presupuesto (`odc-budget-validation`, id 4), aprobación de compra
  (`odc-purchase-approval`, id 5), registro de pago (`odc-register-payment`,
  id 6), evidencia de pago (`odc-payment-evidence`, id 7) y factura/cierre
  (`odc-invoice-completion`, id 8). Aquí solo se entrega la máquina de estados
  de dominio que esas features invocarán.
- Subida, almacenamiento y descarga de archivos (multer, `backend/uploads/`,
  `GET /api/odcs/:id/files/:kind`) — features 7 y 8. Las columnas de archivo
  se crean nullable pero ningún endpoint de esta feature las escribe.
- Validación de presupuesto: el sistema NO almacena presupuesto (decisión del
  plan); la aprobación manual llega con la feature 4.
- ODC multi-línea: una ODC tiene una sola línea (description, quantity,
  unitPrice) — decisión explícita del plan maestro.
- Dashboards, contadores y cualquier UI (features 9–13).
- Borrado de ODCs (ningún DELETE en la superficie API del plan).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).
- Migraciones de producción (deuda ya registrada: `synchronize: true` solo dev).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-19) ← gate obligatorio antes de implementar
