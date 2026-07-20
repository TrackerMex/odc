---
feature: "odc-payment-evidence"
status: approved        # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-payment-evidence]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F7 `odc-payment-evidence`** de
> `plans/001-odc-purchase-system.md` (transición T8 de la tabla T1–T10),
> actualizado el 2026-07-20 para usar **Cloudinary** en vez de disco local
> (ver "Maintenance notes" del plan). Sobre la máquina de estados de dominio
> **ya completa y aprobada** en `specs/odc-create-draft/requirements.md` —
> `PurchaseOrder.transition(action, role, data)` en
> `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` ya
> implementa T8 (`action: 'upload_payment_evidence'`, `from:
> 'PAGO_REGISTRADO'`, `to: 'EVIDENCIA_PAGO_SUBIDA'`, `role: 'ADMINISTRACION'`,
> `requiredData: ['paymentEvidenceFile']`). Esta feature **crea todo lo
> demás**: DTO, use-cases, el servicio de almacenamiento de archivos y su
> wiring HTTP — nada de eso existe aún.

## Verificación previa contra el código vivo

Confirmado leyendo `backend/src/modules/odc/domain/entities/purchase-order.entity.ts`,
`backend/src/modules/odc/infrastructure/controller/odc.controller.ts`,
`backend/src/modules/odc/odc.module.ts` y `backend/package.json` antes de
redactar los requisitos:

- **T8 ya está completa en el dominio, sin endpoint ni DTO**: `TRANSITIONS`
  declara la regla (`action: 'upload_payment_evidence'`, `from:
  'PAGO_REGISTRADO'`, `to: 'EVIDENCIA_PAGO_SUBIDA'`, `role: 'ADMINISTRACION'`,
  `requiredData: ['paymentEvidenceFile']`) y `TransitionData` ya declara
  `paymentEvidenceFile?: string` y `evidenceReference?: string` (este último
  **no** está en `requiredData`, confirmando que es opcional tal como dice el
  brief). `applyTransitionData` ya asigna ambos campos cuando llegan. No existe
  `UploadPaymentEvidenceDto`, ningún use-case de T8, ninguna ruta
  `payment-evidence` ni `files/evidence`, y ningún servicio de archivos. Esta
  feature los crea siguiendo el patrón de `RegisterPaymentUseCase`/`POST
  :id/payment` (T7), con la diferencia de que T8 exige un archivo además de
  datos de formulario.
- **No existe ningún servicio de almacenamiento de archivos**: no hay
  `FileStorageService`, ni carpeta `files/`, ni dependencias `cloudinary`,
  `multer` o `@types/multer` en `backend/package.json`. El implementer deberá
  añadirlas (`pnpm add cloudinary multer && pnpm add -D @types/multer`); no es
  tarea de esta spec instalar paquetes ni tocar `.env`/`.env.example`, solo
  documentar que `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y
  `CLOUDINARY_API_SECRET` deben existir en `.env` (ver [[design]]).
- **Ningún endpoint de `OdcController` filtra su respuesta hoy**: `create`,
  `submit`, `update`, `approveBudget`, `approvePurchase`, `reject`,
  `registerPayment`, `list` y `detail` devuelven la entidad de dominio
  `PurchaseOrder` (o `OdcPage` con `items: PurchaseOrder[]`) tal cual, serializada
  a JSON sin ningún interceptor ni DTO de respuesta (`grep` de
  `ClassSerializerInterceptor`/`@Exclude`/`instanceToPlain` en `backend/src`
  no arroja resultados). Hoy eso es inofensivo porque `paymentEvidenceFile`
  siempre vale `null`. En cuanto esta feature empiece a asignarle el
  `public_id` real de Cloudinary, esos mismos endpoints **filtrarían el
  `public_id`** en texto plano si no se corrige — lo cual contradice
  explícitamente el brief ("nunca se expone el `public_id` ni una URL pública
  sin pasar por este guard"). Esta feature debe cerrar esa fuga (R4), no solo
  añadir los endpoints nuevos.
- **Superficie API**: la tabla resumen de `plans/001-odc-purchase-system.md`
  documenta un endpoint genérico `GET /api/odcs/:id/files/:kind`, pero el
  brief propio de la feature F7 (y la instrucción de esta tarea) fijan la ruta
  literal `GET /api/odcs/:id/files/evidence`. Esta spec usa la ruta literal —
  unificar en `:kind` queda como decisión de la feature 8 (`odc-invoice-completion`),
  que deberá decidir si generaliza o mantiene rutas separadas.

## Contexto: transición que cubre esta feature

| # | Acción | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T8 | Subir evidencia de pago | `PAGO_REGISTRADO` → `EVIDENCIA_PAGO_SUBIDA` | ADMINISTRACION | archivo (PDF/JPG/PNG, ≤10MB) obligatorio; `evidenceReference` opcional |

## Requisitos funcionales

- **R1**: WHEN `POST /api/odcs/:id/payment-evidence` llega como
  `multipart/form-data` THE SYSTEM SHALL aceptar un campo `file` obligatorio y
  un campo `evidenceReference` opcional (`@IsOptional`, `@IsString`) en
  `UploadPaymentEvidenceDto`, y validar el archivo — antes de invocar
  Cloudinary o el use-case — con multer en memoria (`memoryStorage`, sin
  escribir a disco); IF la petición llega sin `file`, con un `file` cuyo MIME
  type no es `application/pdf`, `image/jpeg` ni `image/png`, o con un `file`
  que supera 10 MB (10 485 760 bytes) THEN THE SYSTEM SHALL responder HTTP 400
  sin llamar a Cloudinary y sin transicionar la ODC.
  *Verificación*: test del pipe/interceptor del controller con cada caso
  inválido (`file` ausente, MIME no permitido p.ej. `text/plain`, tamaño
  mayor a 10 MB) asertando HTTP 400 y que `FileStorageService.upload` nunca se
  invoca (mock `toHaveBeenCalledTimes(0)`); test del DTO
  (`evidenceReference` ausente no genera error, presente como string no
  genera error).

- **R2**: WHEN un usuario autenticado con rol `ADMINISTRACION` hace
  `POST /api/odcs/:id/payment-evidence` con un `file` válido (y opcionalmente
  `evidenceReference`) sobre una ODC en estado `PAGO_REGISTRADO` THE SYSTEM
  SHALL subir el buffer del archivo a Cloudinary vía `FileStorageService` a la
  carpeta `odc/<odcNumber>/evidence` con `resource_type: 'auto'` y tipo de
  entrega `authenticated`, persistir el `public_id` devuelto (nunca la URL
  cruda) como `paymentEvidenceFile`, persistir `evidenceReference` cuando se
  envíe (o `null` si se omite), transicionar la ODC a
  `EVIDENCIA_PAGO_SUBIDA` (T8), registrar la fila de historial (`fromStatus`
  `PAGO_REGISTRADO`, `toStatus` `EVIDENCIA_PAGO_SUBIDA`, `userId` de la
  sesión, `note` null) y responder HTTP 200; IF el rol del usuario no es
  `ADMINISTRACION` THEN THE SYSTEM SHALL responder HTTP 403 sin subir el
  archivo ni transicionar.
  *Verificación*: test de `UploadPaymentEvidenceUseCase` con
  `PurchaseOrderRepository` y `FileStorageService` mockeados (sube el archivo
  con la carpeta/opciones esperadas, persiste `paymentEvidenceFile` igual al
  `publicId` devuelto por el mock —nunca una URL—, persiste
  `evidenceReference` con y sin el campo opcional, historial, ODC devuelta, y
  el caso de rol distinto rechazado con `InvalidRoleTransitionError` sin
  llamar a `FileStorageService.upload`); test del controller asertando la
  ruta, `@Roles('ADMINISTRACION')` y HTTP 200.

- **R3**: IF `POST /api/odcs/:id/payment-evidence` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe pero no está en `PAGO_REGISTRADO` THEN THE SYSTEM SHALL responder
  HTTP 409 sin persistir cambios de estado (la acción
  `upload_payment_evidence` del dominio solo tiene una regla, desde
  `PAGO_REGISTRADO`, así que cualquier otro estado cae en este caso).
  *Verificación*: test de `UploadPaymentEvidenceUseCase` con id inexistente
  (404) y con la ODC en cada uno de los otros 7 estados de la máquina (409,
  sin mutar `status` ni el resto de propiedades).

- **R4**: WHEN cualquier endpoint que devuelve datos de una ODC
  (`POST /api/odcs`, `POST /api/odcs/:id/submit`, `PATCH /api/odcs/:id`,
  `POST /api/odcs/:id/approve-budget`, `POST /api/odcs/:id/approve-purchase`,
  `POST /api/odcs/:id/reject`, `POST /api/odcs/:id/payment`,
  `POST /api/odcs/:id/payment-evidence`, `GET /api/odcs`, `GET /api/odcs/:id`)
  serializa una `PurchaseOrder` en su cuerpo JSON THE SYSTEM SHALL omitir el
  valor crudo de `paymentEvidenceFile` (el `public_id` de Cloudinary) y
  exponer en su lugar un booleano `hasPaymentEvidence` (`true` cuando
  `paymentEvidenceFile` no es `null`, `false` en caso contrario); ningún
  cuerpo de respuesta de estos endpoints SHALL contener el `public_id` ni una
  URL de Cloudinary en ningún campo.
  *Verificación*: test unitario del mapper de respuesta (`paymentEvidenceFile`
  ausente de la salida; `hasPaymentEvidence` true/false según el valor de
  entrada); al menos un test de controller (`detail`) que, con el use-case
  mockeado devolviendo una ODC con `paymentEvidenceFile` asignado, asegura que
  el cuerpo de la respuesta no contiene esa clave y sí contiene
  `hasPaymentEvidence: true`.

- **R5**: WHEN un usuario autenticado (cualquiera de los 3 roles) hace
  `GET /api/odcs/:id/files/evidence` sobre una ODC visible para él (misma
  regla de visibilidad que `GET /api/odcs/:id`: una ODC en `BORRADOR` solo es
  visible para su creador) y esa ODC tiene `paymentEvidenceFile` asignado THE
  SYSTEM SHALL responder HTTP 302 redirigiendo a una URL firmada de Cloudinary
  de corta expiración, generada vía `cloudinary.url(publicId, { sign_url:
  true, type: 'authenticated', expires_at })`; el cuerpo de la respuesta
  SHALL NOT contener el `public_id` ni la URL sin firmar.
  *Verificación*: test de `GetPaymentEvidenceFileUseCase` con
  `PurchaseOrderRepository` y `FileStorageService` mockeados (pide la URL
  firmada con el `publicId` correcto y devuelve la URL del mock); test de
  controller asertando `@Redirect()`/HTTP 302 hacia la URL devuelta por el
  use-case mockeado.

- **R6**: IF `GET /api/odcs/:id/files/evidence` se hace sobre un id que no
  corresponde a ninguna ODC THEN THE SYSTEM SHALL responder HTTP 404; IF la
  ODC existe, es visible, pero `paymentEvidenceFile` es `null` (evidencia aún
  no subida) THEN THE SYSTEM SHALL responder HTTP 404 sin intentar generar
  ninguna URL firmada; IF la ODC está en `BORRADOR` y el usuario no es su
  creador THEN THE SYSTEM SHALL responder HTTP 403 (misma regla que
  `GET /api/odcs/:id`).
  *Verificación*: test de `GetPaymentEvidenceFileUseCase` con id inexistente
  (404), con `paymentEvidenceFile` `null` en cada estado anterior a T8 (404,
  sin llamar a `FileStorageService.getSignedUrl`), y con una ODC `BORRADOR`
  de otro creador (403, `OdcAccessDeniedError`).

- **R7**: WHEN se define el puerto de almacenamiento de archivos THE SYSTEM
  SHALL declarar una interfaz `FileStorageService` (sin imports de Cloudinary
  ni de ningún framework) con un método de subida que recibe el buffer, el
  MIME type y la carpeta destino y devuelve el `publicId`, y un método de URL
  firmada que recibe el `publicId` y devuelve una URL de corta expiración; THE
  SYSTEM SHALL registrar esa interfaz bajo el token de inyección
  `'FileStorageService'` en un módulo `files` dedicado y exportarlo para que
  `OdcModule` (y, en el futuro, `odc-invoice-completion`) lo importen sin
  duplicar el provider; la implementación concreta (`CloudinaryFileStorageService`)
  SHALL usar el SDK oficial `cloudinary`, configurado con
  `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` leídos
  vía `ConfigService`.
  *Verificación*: test unitario de `CloudinaryFileStorageService` con el
  paquete `cloudinary` mockeado (`jest.mock('cloudinary')`, ninguna llamada de
  red real): asegura que la subida invoca al SDK con `resource_type: 'auto'`
  y `type: 'authenticated'` en la carpeta indicada y devuelve solo el
  `public_id` de la respuesta mockeada (nunca la URL); asegura que la URL
  firmada invoca `cloudinary.url` con `sign_url: true`, `type: 'authenticated'`
  y un `expires_at` de corta duración.

## Fuera de alcance

- T9 (factura + almacén) — feature 8 (`odc-invoice-completion`); esa feature
  reutiliza el mismo `FileStorageService` creado aquí.
- Enmascarar `invoiceFile` en las respuestas JSON: ese campo sigue siendo
  siempre `null` hasta que exista T9, así que no hay fuga que cerrar todavía;
  queda a cargo de la feature 8 cuando ese campo empiece a llevar un
  `public_id` real.
- Cualquier endpoint de creación, edición, listado, detalle, aprobación de
  presupuesto, aprobación de compra o registro de pago de ODC (ya entregados
  por las features 3, 4, 5 y 6) más allá del cambio de forma de respuesta de
  R4 — esta feature no cambia su lógica de negocio.
- Cambios al dominio (`PurchaseOrder`, `domain/errors/*` salvo el nuevo error
  de "evidencia no encontrada" descrito en [[design]]), a la interface
  `PurchaseOrderRepository`, a las entidades ORM o al repositorio TypeORM — T8
  ya está completa y aprobada en la máquina de estados desde
  `odc-create-draft`; esta feature solo la invoca vía HTTP.
- Borrado o limpieza de archivos huérfanos en Cloudinary cuando una subida se
  completa pero la transición posterior falla (409): se documenta como
  limitación aceptada en [[design]], no se resuelve en esta feature.
- Instalar dependencias (`cloudinary`, `multer`, `@types/multer`) o añadir las
  claves reales a `.env`/`.env.example`: tarea del implementer, no de esta
  spec.
- Restricción por creador en T8: la tabla T1–T10 no anota "(solo el creador)"
  para T8; cualquier `ADMINISTRACION` puede subir la evidencia de cualquier
  ODC visible en `PAGO_REGISTRADO`.
- Almacenamiento de presupuesto: no aplica a T8.
- Dashboards, contadores y cualquier UI (features 9–13).
- Tests e2e contra PostgreSQL o Cloudinary reales (opcionales,
  `backend/test/`, fuera de `TEST_CMD`); todos los tests de esta feature
  mockean el repositorio y el SDK de Cloudinary.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-20) ← gate obligatorio antes de implementar
