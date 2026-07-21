---
feature: "odc-invoice-completion"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-invoice-completion]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto. Este diseño mantiene los lineamientos de la skill
> `nestjs-best-practices` ya adoptados por el módulo `odc`
> (`security-use-guards`, `security-validate-all-input`,
> `arch-single-responsibility`, `di-use-interfaces-tokens`,
> `arch-module-sharing`, `test-mock-external-services`) y **no introduce
> ninguno nuevo**: esta feature reutiliza infraestructura ya aprobada en
> `odc-payment-evidence` en vez de crear una nueva.

## Decisiones técnicas

- **Sin cambios en `domain/entities/purchase-order.entity.ts` ni en
  `infrastructure/entities|repositories` del módulo `odc`** (R2, R3): T9 ya
  vive, probada y aprobada, en `odc-create-draft`. Esta feature solo añade un
  DTO (`UploadInvoiceDto`), dos use-cases (`UploadInvoiceUseCase`,
  `GetInvoiceFileUseCase`), un error de dominio nuevo
  (`InvoiceNotFoundError`, mismo patrón que `PaymentEvidenceNotFoundError`) y
  su wiring HTTP, generalizando además la ruta de descarga existente.

- **`UploadInvoiceDto` valida los cuatro campos de formulario** (R1): el
  archivo no viaja en el DTO — multer lo entrega aparte como
  `Express.Multer.File` vía `@UploadedFile()`. `warehouseEntryDate` es
  `@IsDateString @IsNotEmpty` (mismo patrón que `paymentDate` en
  `RegisterPaymentDto`, T7); `invoiceNumber` y `observations` son `@IsOptional
  @IsString`; `invoiceDate` es `@IsOptional @IsDateString`. Vive en
  `application/dto/`, sin imports de infrastructure.

- **Validación de archivo idéntica a T8, factorizada como una función de pipe
  dedicada a esta ruta** (R1, `security-validate-all-input`): mismo
  `FileInterceptor('file', { storage: memoryStorage() })` en el controller, y
  una función exportada `createInvoiceFilePipe()` que replica exactamente la
  configuración de `createPaymentEvidenceFilePipe()` (mismo allowlist de MIME,
  mismo tope de 10 MB, `errorHttpStatusCode: HttpStatus.BAD_REQUEST`,
  `fileIsRequired: true`). Se mantiene el patrón ya establecido de una función
  de pipe nombrada por ruta (no se introduce una fábrica genérica
  parametrizable): los valores son idénticos hoy, pero cada ruta declara su
  propia función testeable de forma explícita, igual que T8.

- **`UploadInvoiceUseCase` replica la estructura de
  `UploadPaymentEvidenceUseCase`, incluyendo el placeholder previo a la
  subida** (R2, R3): `findById` → lanza `OdcNotFoundError` si no existe →
  `order.transition('upload_invoice', actor.role, { invoiceFile:
  PENDING_UPLOAD_PLACEHOLDER, warehouseEntryDate: input.warehouseEntryDate,
  invoiceNumber: input.invoiceNumber, invoiceDate: input.invoiceDate,
  observations: input.observations })` → como `transition()` valida estado →
  rol → datos requeridos **antes** de mutar cualquier propiedad (ver
  `assertRequiredData` en `purchase-order.entity.ts`), un estado o rol
  inválido lanza (`InvalidStatusTransitionError`/`InvalidRoleTransitionError`)
  sin que el use-case haya llamado todavía a
  `fileStorageService.upload(...)` → solo si la transición-con-placeholder
  tiene éxito se sube el buffer real a la carpeta
  `odc/${order.odcNumber}/invoice` → `order.invoiceFile = publicId` (se
  sobreescribe el placeholder) → construye `OdcStatusHistoryEntry` con el
  `TransitionRecord` devuelto → `repository.update(order, entry)`. Aplica
  `arch-single-responsibility`: un use-case, una transición. Inyecta
  `PurchaseOrderRepository` y `FileStorageService` (mismos tokens existentes,
  sin declarar providers nuevos).

- **El orden placeholder-antes-de-subir elimina el riesgo de archivo huérfano
  que `odc-payment-evidence` había aceptado como deuda** (R3): a diferencia de
  lo que describía el `design.md` original de esa feature ("la subida ocurre
  antes de invocar `order.transition(...)`"), el código realmente
  implementado en `UploadPaymentEvidenceUseCase` ya invierte ese orden
  (transiciona con un placeholder primero, sube después). Esta feature
  adopta el mismo orden para T9 desde el inicio: ningún caso de rol o estado
  inválido llega a invocar Cloudinary, así que no hay archivo huérfano que
  documentar como deuda.

- **`GetInvoiceFileUseCase` compone `GetOdcUseCase`, mismo patrón que
  `GetPaymentEvidenceFileUseCase`** (R5, R6): inyecta `GetOdcUseCase` (ya
  aprobado, encapsula el 404/403 de visibilidad) y `FileStorageService`.
  Flujo: `order = getOdcUseCase.execute(odcId, viewer)` → si
  `order.invoiceFile === null` lanza `InvoiceNotFoundError` (dominio, nuevo)
  → en otro caso `fileStorageService.getSignedUrl({ publicId:
  order.invoiceFile })` → devuelve la URL firmada al controller. Ningún
  chequeo de visibilidad se repite.

- **Nuevo error de dominio `InvoiceNotFoundError`** (R6): archivo
  `domain/errors/invoice-not-found.error.ts` del módulo `odc`, mismo patrón
  que `PaymentEvidenceNotFoundError` (clase que extiende `Error`, sin imports
  de framework). El controller extiende `rethrowDomainError` para traducirlo a
  `NotFoundException` (404).

- **Respuesta HTTP nunca expone el `public_id` de `invoiceFile` (R4)**: se
  extiende `infrastructure/mappers/odc-response.mapper.ts` — `toOdcResponse`
  desestructura también `invoiceFile` de `PurchaseOrder` y añade
  `hasInvoice: invoiceFile !== null` al resultado, junto al `hasPaymentEvidence`
  ya existente. `OdcResponseDto` gana el campo `hasInvoice: boolean` y pierde
  `invoiceFile` de su forma pública. No se crea un mapper nuevo: es una
  extensión del mismo mapper de `odc-payment-evidence`.

- **La ruta de descarga se generaliza a `GET /api/odcs/:id/files/:kind`**
  (R7, decisión que `odc-payment-evidence` dejó explícitamente para esta
  feature): el único handler `@Get(':id/files/:kind')` reemplaza al literal
  `@Get(':id/files/evidence')` existente. Como el parámetro de ruta captura
  el mismo segmento literal (`/files/evidence` sigue resolviendo
  `kind = 'evidence'`, `/files/invoice` resuelve `kind = 'invoice'`), el
  contrato HTTP de `odc-payment-evidence` no cambia para clientes existentes
  — mismas URLs, mismas respuestas. Dentro del handler: `switch` (o
  equivalente) sobre `kind` que exige exactamente `'evidence'` o `'invoice'`
  antes de invocar cualquier use-case; para cualquier otro valor, se lanza
  `BadRequestException` (400) sin llamar a `GetPaymentEvidenceFileUseCase` ni
  a `GetInvoiceFileUseCase`. `kind = 'evidence'` sigue despachando a
  `GetPaymentEvidenceFileUseCase` (sin cambios en ese use-case);
  `kind = 'invoice'` despacha al nuevo `GetInvoiceFileUseCase`.

- **`GetPaymentEvidenceFileUseCase` y `GetInvoiceFileUseCase` permanecen
  como dos use-cases separados** (`arch-single-responsibility`): no se
  introduce un `GetOdcFileUseCase` genérico parametrizado por `kind`. El
  controller es el único punto que conoce el mapeo `kind → use-case`; cada
  use-case mantiene una única responsabilidad (un campo de la ODC, un error
  de dominio).

- **Sin cambios en el módulo `files` ni en sus providers** (R2, R3, R5, R6):
  `UploadInvoiceUseCase` y `GetInvoiceFileUseCase` inyectan el token
  `'FileStorageService'` ya exportado por `FilesModule` (importado por
  `OdcModule` desde `odc-payment-evidence`); no se declara ningún provider
  nuevo ni se importa `FilesModule` una segunda vez.

## Archivos afectados

- `backend/src/modules/odc/application/dto/upload-invoice.dto.ts` (nuevo) —
  `warehouseEntryDate` obligatorio, `invoiceNumber`/`invoiceDate`/
  `observations` opcionales (R1). Capa application.
- `backend/src/modules/odc/application/use-cases/upload-invoice.usecase.ts`
  (nuevo) — T9: transiciona con placeholder, sube el archivo, persiste
  `invoiceFile`, historial, `repository.update` (R2, R3). Capa application.
- `backend/src/modules/odc/application/use-cases/get-invoice-file.usecase.ts`
  (nuevo) — compone `GetOdcUseCase` + `FileStorageService.getSignedUrl` (R5,
  R6). Capa application.
- `backend/src/modules/odc/domain/errors/invoice-not-found.error.ts` (nuevo)
  — error de dominio para "factura aún no subida" (R6). Capa domain.
- `backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts`
  (modificado) — añade `hasInvoice`, retira `invoiceFile` de
  `OdcResponseDto` (R4). Capa infrastructure.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`
  (modificado) — añade `POST :id/invoice` (multer + `createInvoiceFilePipe()`,
  `@Roles('DIRECTOR_OPS')`, `@HttpCode(200)`) (R1, R2, R3); reemplaza
  `@Get(':id/files/evidence')` por `@Get(':id/files/:kind')` que despacha a
  `GetPaymentEvidenceFileUseCase`/`GetInvoiceFileUseCase` según `kind`, con
  400 para cualquier otro valor (R5, R6, R7); pasa el resultado del nuevo
  handler `invoice` por `toOdcResponse()` igual que el resto. Capa
  infrastructure.
- `backend/src/modules/odc/odc.module.ts` (modificado) — registra
  `UploadInvoiceUseCase` y `GetInvoiceFileUseCase` como providers (R2, R3, R5,
  R6). No modifica sus imports de `FilesModule` (ya presente desde F7).

Sin cambios: `domain/entities/purchase-order.entity.ts` (T9 ya completa),
`domain/entities/odc-status-history-entry.entity.ts`,
`domain/errors/invalid-role-transition.error.ts`,
`domain/errors/invalid-status-transition.error.ts`,
`domain/errors/missing-transition-data.error.ts`,
`domain/errors/odc-access-denied.error.ts`, `domain/errors/odc-not-found.error.ts`,
`domain/errors/payment-evidence-not-found.error.ts`,
`domain/repositories/purchase-order.repository.ts`,
`infrastructure/entities/*`, `infrastructure/repositories/*`,
`infrastructure/mappers/purchase-order.mapper.ts` (ORM↔domain),
`application/use-cases/get-odc.usecase.ts` (se reutiliza, no se modifica),
`application/use-cases/upload-payment-evidence.usecase.ts`,
`application/use-cases/get-payment-evidence-file.usecase.ts`,
`application/dto/upload-payment-evidence.dto.ts` (T8, sin cambios de
comportamiento),
`backend/src/modules/files/**` (puerto e implementación de Cloudinary, ya
aprobados en `odc-payment-evidence`), `files.module.ts`,
`auth/infrastructure/decorators/roles.decorator.ts`,
`auth/infrastructure/guards/roles.guard.ts`, `.env`/`.env.example` — todos ya
completos y aprobados, o ya genéricos respecto a esta transición.

## Alternativas descartadas

- **Mantener `GET /api/odcs/:id/files/invoice` como ruta literal separada de
  `/files/evidence`** (dos rutas paralelas, sin generalizar): descartada — el
  plan maestro ya documenta `GET /api/odcs/:id/files/:kind` como la superficie
  API objetivo, y el `design.md` de `odc-payment-evidence` dejó esa decisión
  explícitamente para esta feature.
- **Unificar `GetPaymentEvidenceFileUseCase` y `GetInvoiceFileUseCase` en un
  único `GetOdcFileUseCase` parametrizado por `kind`**: descartada — rompería
  `arch-single-responsibility` (un use-case pasaría a conocer dos campos de
  dominio distintos y su lógica condicional), y el patrón ya aprobado en F7
  favorece un use-case por campo.
- **Persistir la subida a Cloudinary antes de validar rol/estado en el
  dominio** (el orden que el `design.md` original de `odc-payment-evidence`
  describía y aceptaba como riesgo): descartada para esta feature — se adopta
  el orden placeholder-antes-de-subir que el código de
  `UploadPaymentEvidenceUseCase` ya usa en la práctica, que evita el archivo
  huérfano en vez de aceptarlo como deuda.
- **`400` reemplazado por `404` para un `kind` no soportado en
  `GET .../files/:kind`**: descartada — un valor de enum inválido en un
  parámetro de ruta es un error de entrada del cliente (`400`), no una
  condición de "recurso no encontrado"; `404` se reserva para ODC inexistente
  o archivo aún no subido.
- **Fábrica de pipe genérica y parametrizable compartida entre
  `payment-evidence` e `invoice`** (para no repetir constantes de MIME/tamaño):
  descartada — introduciría una abstracción nueva que esta feature no
  necesita; se replica el mismo patrón de función de pipe nombrada por ruta
  ya establecido en T8.
- **Restricción por creador en T9**: descartada — la tabla T1–T10 del plan
  maestro no anota "(solo el creador)" para T9, a diferencia de T2/T10.
