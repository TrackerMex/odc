---
feature: "odc-invoice-completion"
status: approved        # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-invoice-completion]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F8 `odc-invoice-completion`** de
> `plans/001-odc-purchase-system.md` (transición T9 de la tabla T1–T10), y la
> superficie API documentada en ese mismo plan
> (`GET /api/odcs/:id/files/:kind`, `kind ∈ evidence|invoice`). Sobre la
> máquina de estados de dominio **ya completa y aprobada** en
> `specs/odc-create-draft/requirements.md` —
> `PurchaseOrder.transition(action, role, data)` en
> `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` ya
> implementa T9 (`action: 'upload_invoice'`, `from:
> 'EVIDENCIA_PAGO_SUBIDA'`, `to: 'COMPLETADA'`, `role: 'DIRECTOR_OPS'`,
> `requiredData: ['invoiceFile', 'warehouseEntryDate']`). Esta feature reutiliza
> el `FileStorageService`/`CloudinaryFileStorageService` creados en
> `odc-payment-evidence` (F7, `done`) y **crea todo lo demás**: DTO, use-cases,
> wiring HTTP y la generalización de la ruta de descarga de archivos.

## Verificación previa contra el código vivo

Confirmado leyendo `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`,
`backend/src/modules/odc/infrastructure/controller/odc.controller.ts`,
`backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts`,
`backend/src/modules/odc/odc.module.ts`,
`backend/src/modules/files/domain/services/file-storage.service.ts`,
`backend/src/modules/files/files.module.ts` y `.env.example` antes de redactar
los requisitos:

- **T9 ya está completa en el dominio, sin endpoint ni DTO**: `TRANSITIONS`
  declara la regla (`action: 'upload_invoice'`, `from:
  'EVIDENCIA_PAGO_SUBIDA'`, `to: 'COMPLETADA'`, `role: 'DIRECTOR_OPS'`,
  `requiredData: ['invoiceFile', 'warehouseEntryDate']`) y `TransitionData` ya
  declara `invoiceFile?`, `invoiceNumber?`, `invoiceDate?`,
  `warehouseEntryDate?`, `observations?: string`. `applyTransitionData` ya
  asigna los cinco campos cuando llegan. No existe `UploadInvoiceDto`, ningún
  use-case de T9, ninguna ruta `invoice` ni `files/invoice`. Esta feature los
  crea siguiendo el patrón de `UploadPaymentEvidenceUseCase`/`POST
  :id/payment-evidence` (T8).
- **`UploadPaymentEvidenceUseCase` ya usa un placeholder antes de subir el
  archivo**: invoca `order.transition('upload_payment_evidence', actor.role,
  { paymentEvidenceFile: PENDING_UPLOAD_PLACEHOLDER, ... })` **antes** de
  llamar a `FileStorageService.upload`. Como `transition()` valida estado →
  rol → datos requeridos (en ese orden, ver `assertRequiredData`) y lanza
  antes de mutar nada si algo falla, ningún rol/estado/dato inválido llega a
  invocar Cloudinary. Esta feature replica ese mismo orden para T9 (ver
  [[design]]), lo que hace innecesario aceptar el riesgo de "archivo huérfano"
  que el diseño original de `odc-payment-evidence` había documentado como
  deuda.
- **El endpoint de descarga hoy es literal, no genérico**: `GET
  :id/files/evidence` (`@Get(':id/files/evidence')`) despacha a
  `GetPaymentEvidenceFileUseCase`. El propio `design.md` de
  `odc-payment-evidence` dejó explícitamente para esta feature la decisión de
  generalizar a `GET /api/odcs/:id/files/:kind`, tal como ya lo documenta la
  tabla de superficie API del plan maestro. Esta spec toma esa decisión: sí se
  generaliza (R7).
- **Ningún endpoint de `OdcController` deja de pasar por `toOdcResponse`/
  `toOdcPageResponse` hoy**, y `invoiceFile` es siempre `null` en la práctica
  (T9 nunca se alcanzó), así que hoy no hay fuga real, pero en cuanto esta
  feature le asigne un `public_id` real, cualquier respuesta que incluya esa
  ODC filtraría el valor si no se corrige el mapper (R4).
- **Las credenciales de Cloudinary ya existen en `.env.example`**
  (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
  añadidas por `odc-payment-evidence`): esta feature no toca `.env`/`.env.example`
  ni instala dependencias nuevas.

## Contexto: transición que cubre esta feature

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T9 | Subir factura + almacén | `EVIDENCIA_PAGO_SUBIDA` → `COMPLETADA` | DIRECTOR_OPS | archivo factura (PDF/JPG/PNG, ≤10MB) obligatorio; `warehouseEntryDate` obligatorio; `invoiceNumber`/`invoiceDate`/`observations` opcionales |

## Requisitos funcionales

- **R1**: WHEN `POST /api/odcs/:id/invoice` llega como `multipart/form-data`
  THE SYSTEM SHALL aceptar un campo `file` obligatorio, un campo
  `warehouseEntryDate` obligatorio (fecha ISO), y los campos opcionales
  `invoiceNumber` (`@IsOptional @IsString`), `invoiceDate` (`@IsOptional
  @IsDateString`) y `observations` (`@IsOptional @IsString`) en
  `UploadInvoiceDto`; y validar el archivo — antes de invocar Cloudinary o el
  use-case — con multer en memoria (`memoryStorage`, sin escribir a disco),
  con el mismo allowlist de MIME (`application/pdf`, `image/jpeg`,
  `image/png`) y el mismo tope de tamaño (≤10 MB / 10 485 760 bytes) que T8;
  IF la petición llega sin `file`, con un `file` cuyo MIME type no está
  permitido, con un `file` que supera 10 MB, o sin `warehouseEntryDate` (o
  vacío) THEN THE SYSTEM SHALL responder HTTP 400 sin llamar a Cloudinary y
  sin transicionar la ODC.
  *Verificación*: test del pipe/DTO con cada caso inválido (`file` ausente,
  MIME no permitido, tamaño mayor a 10 MB, `warehouseEntryDate`
  ausente/vacío) asertando HTTP 400 y que `FileStorageService.upload` nunca se
  invoca; test del DTO (`invoiceNumber`/`invoiceDate`/`observations` ausentes
  no generan error; presentes con valores válidos tampoco).

- **R2**: WHEN un usuario autenticado con rol `DIRECTOR_OPS` hace
  `POST /api/odcs/:id/invoice` con un `file` válido y `warehouseEntryDate`
  (y opcionalmente `invoiceNumber`/`invoiceDate`/`observations`) sobre una ODC
  en estado `EVIDENCIA_PAGO_SUBIDA` THE SYSTEM SHALL subir el buffer del
  archivo a Cloudinary vía `FileStorageService` a la carpeta
  `odc/<odcNumber>/invoice` con `resource_type: 'auto'` y tipo de entrega
  `authenticated` (mismas opciones que T8), persistir el `public_id` devuelto
  (nunca la URL cruda) como `invoiceFile`, persistir `warehouseEntryDate`,
  `invoiceNumber` y `observations` cuando se envíen (o `null` si se omiten),
  transicionar la ODC a `COMPLETADA` (T9), registrar la fila de historial
  (`fromStatus` `EVIDENCIA_PAGO_SUBIDA`, `toStatus` `COMPLETADA`, `userId` de
  la sesión, `note` null) y responder HTTP 200; IF el rol del usuario no es
  `DIRECTOR_OPS` THEN THE SYSTEM SHALL responder HTTP 403 sin subir el archivo
  ni transicionar.
  *Verificación*: test de `UploadInvoiceUseCase` con `PurchaseOrderRepository`
  y `FileStorageService` mockeados (sube el archivo con la carpeta/opciones
  esperadas, persiste `invoiceFile` igual al `publicId` devuelto por el mock
  —nunca una URL—, persiste `warehouseEntryDate`/`invoiceNumber`/
  `invoiceDate`/`observations` con y sin los campos opcionales, historial, ODC
  devuelta con `status COMPLETADA`, y el caso de rol distinto rechazado con
  `InvalidRoleTransitionError` sin llamar a `FileStorageService.upload`); test
  del controller asertando la ruta, `@Roles('DIRECTOR_OPS')` y HTTP 200.

- **R3**: IF `POST /api/odcs/:id/invoice` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero no está en `EVIDENCIA_PAGO_SUBIDA` THEN THE SYSTEM SHALL
  responder HTTP 409 sin persistir cambios de estado y sin llamar a
  `FileStorageService.upload` (la validación de estado y rol ocurre en el
  dominio, mediante un placeholder de `invoiceFile`, antes de que el archivo
  real se suba — ver [[design]] —, así que ningún rol o estado inválido llega
  a invocar Cloudinary).
  *Verificación*: test de `UploadInvoiceUseCase` con id inexistente (404) y
  con la ODC en cada uno de los otros 7 estados de la máquina (409, sin mutar
  `status` ni el resto de propiedades, sin llamar a
  `FileStorageService.upload`).

- **R4**: WHEN cualquier endpoint que devuelve datos de una ODC
  (`POST /api/odcs`, `POST /api/odcs/:id/submit`, `PATCH /api/odcs/:id`,
  `POST /api/odcs/:id/approve-budget`, `POST /api/odcs/:id/approve-purchase`,
  `POST /api/odcs/:id/reject`, `POST /api/odcs/:id/payment`,
  `POST /api/odcs/:id/payment-evidence`, `POST /api/odcs/:id/invoice`,
  `GET /api/odcs`, `GET /api/odcs/:id`) serializa una `PurchaseOrder` en su
  cuerpo JSON THE SYSTEM SHALL omitir el valor crudo de `invoiceFile` (el
  `public_id` de Cloudinary) y exponer en su lugar un booleano `hasInvoice`
  (`true` cuando `invoiceFile` no es `null`, `false` en caso contrario);
  ningún cuerpo de respuesta de estos endpoints SHALL contener el `public_id`
  de `invoiceFile` ni una URL de Cloudinary en ningún campo.
  *Verificación*: test unitario del mapper (`invoiceFile` ausente de la
  salida; `hasInvoice` true/false según el valor de entrada); al menos un test
  de controller (`detail`) que, con el use-case mockeado devolviendo una ODC
  con `invoiceFile` asignado, asegura que el cuerpo de la respuesta no
  contiene esa clave y sí contiene `hasInvoice: true`.

- **R5**: WHEN un usuario autenticado (cualquiera de los 3 roles) hace
  `GET /api/odcs/:id/files/invoice` sobre una ODC visible para él (misma regla
  de visibilidad que `GET /api/odcs/:id`: una ODC en `BORRADOR` solo es
  visible para su creador) y esa ODC tiene `invoiceFile` asignado THE SYSTEM
  SHALL responder HTTP 302 redirigiendo a una URL firmada de Cloudinary de
  corta expiración, generada vía `cloudinary.url(publicId, { sign_url: true,
  type: 'authenticated', expires_at })` (mismo mecanismo que T8, aplicado a
  `invoiceFile`); el cuerpo de la respuesta SHALL NOT contener el `public_id`
  ni la URL sin firmar.
  *Verificación*: test de `GetInvoiceFileUseCase` con `PurchaseOrderRepository`
  y `FileStorageService` mockeados (pide la URL firmada con el `publicId`
  correcto y devuelve la URL del mock); test de controller asertando HTTP 302
  hacia la URL devuelta por el use-case mockeado cuando `kind=invoice`.

- **R6**: IF `GET /api/odcs/:id/files/invoice` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe, es visible, pero `invoiceFile` es `null` (factura aún no subida)
  THEN THE SYSTEM SHALL responder HTTP 404 sin intentar generar ninguna URL
  firmada; IF la ODC está en `BORRADOR` y el usuario no es su creador THEN THE
  SYSTEM SHALL responder HTTP 403 (misma regla que `GET /api/odcs/:id`).
  *Verificación*: test de `GetInvoiceFileUseCase` con id inexistente (404),
  con `invoiceFile` `null` en cada estado anterior a T9 (404, sin llamar a
  `FileStorageService.getSignedUrl`), y con una ODC `BORRADOR` de otro creador
  (403, `OdcAccessDeniedError`).

- **R7**: WHEN se generaliza la ruta de descarga de archivos a
  `GET /api/odcs/:id/files/:kind` THE SYSTEM SHALL soportar `kind ∈ {evidence,
  invoice}`, despachando internamente a `GetPaymentEvidenceFileUseCase` cuando
  `kind = 'evidence'` o a `GetInvoiceFileUseCase` cuando `kind = 'invoice'`,
  preservando exactamente el comportamiento ya aprobado en R5/R6 de
  `odc-payment-evidence` para `kind = 'evidence'` (mismo 302/404/403, mismo
  contrato de respuesta, sin regresión); IF `kind` no es `evidence` ni
  `invoice` THEN THE SYSTEM SHALL responder HTTP 400 sin invocar ningún
  use-case de archivos.
  *Verificación*: se reejecutan contra la ruta generalizada los casos de test
  de controller que cubren R5/R6 de `odc-payment-evidence` para `kind =
  'evidence'` (302 a URL firmada; 404 id inexistente; 404 sin evidencia; 403
  `BORRADOR` ajeno) confirmando cero regresión; test de controller con
  `kind = 'foo'` asertando HTTP 400 y que ni
  `GetPaymentEvidenceFileUseCase.execute` ni `GetInvoiceFileUseCase.execute`
  se invocan.

## Fuera de alcance

- Cambios al dominio (`PurchaseOrder`, `TRANSITIONS`, `domain/errors/*` salvo
  el nuevo error de "factura no encontrada" descrito en [[design]]), a la
  interfaz `PurchaseOrderRepository`, a las entidades ORM o al repositorio
  TypeORM — T9 ya está completa y aprobada en la máquina de estados desde
  `odc-create-draft`; esta feature solo la invoca vía HTTP.
- El puerto `FileStorageService` y su implementación
  `CloudinaryFileStorageService` (`backend/src/modules/files/`): ya existen,
  se reutilizan sin cambios (creados en `odc-payment-evidence`).
- Instalar dependencias (`cloudinary`, `multer`, `@types/multer`) o modificar
  `.env`/`.env.example`: las claves de Cloudinary ya existen desde
  `odc-payment-evidence`.
- Restricción por creador en T9: la tabla T1–T10 no anota "(solo el creador)"
  para T9; cualquier `DIRECTOR_OPS` puede completar cualquier ODC visible en
  `EVIDENCIA_PAGO_SUBIDA`.
- Borrado o limpieza de archivos huérfanos en Cloudinary: no aplica a esta
  feature — el orden placeholder-antes-de-subir de R3 evita el escenario que
  `odc-payment-evidence` documentó como deuda aceptada.
- Cualquier endpoint o lógica de negocio ya entregado por las features 3–7
  (creación, edición, envío, aprobación de presupuesto/compra, rechazo,
  registro de pago, subida de evidencia de pago) más allá del cambio de forma
  de respuesta de R4 y de la generalización de ruta de R7 — esta feature no
  cambia su lógica de negocio.
- Dashboards, contadores y cualquier UI (features 9–13).
- Tests e2e contra PostgreSQL o Cloudinary reales (opcionales,
  `backend/test/`, fuera de `TEST_CMD`); todos los tests de esta feature
  mockean el repositorio y `FileStorageService`.

## Aprobación

- [x] Aprobado por humano (fecha: 2026-07-21) ← gate obligatorio antes de implementar
