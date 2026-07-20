---
feature: "odc-payment-evidence"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-payment-evidence]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto. Este diseño aplica además los lineamientos de la skill
> `nestjs-best-practices` (`security-use-guards`, `security-validate-all-input`,
> `arch-single-responsibility`, `di-use-interfaces-tokens`,
> `arch-module-sharing`, `test-mock-external-services`) ya adoptados por el
> módulo `odc` en las features 3–6 — esta feature los mantiene y añade
> `arch-module-sharing` por primera vez (módulo `files` dedicado y
> exportado).

## Decisiones técnicas

- **Sin cambios en `domain/entities/purchase-order.entity.ts` ni en
  `infrastructure/entities|repositories` del módulo `odc`** (R2, R3): T8 ya
  vive, probada y aprobada, en `odc-create-draft`. Esta feature solo añade un
  DTO (`UploadPaymentEvidenceDto`), dos use-cases
  (`UploadPaymentEvidenceUseCase`, `GetPaymentEvidenceFileUseCase`), un error
  de dominio nuevo (`PaymentEvidenceNotFoundError`, ver más abajo) y su wiring
  HTTP, más un módulo `files` nuevo con el servicio de almacenamiento.

- **`UploadPaymentEvidenceDto` solo valida `evidenceReference`** (R1): el
  archivo no viaja en el DTO de `class-validator` — multer lo entrega aparte
  como `Express.Multer.File` vía `@UploadedFile()`. `evidenceReference` es
  `@IsOptional` `@IsString`, igual patrón que `paymentReference`/`paymentNotes`
  en `RegisterPaymentDto`. Vive en `application/dto/`, sin imports de
  infrastructure.

- **Validación de archivo en la capa infrastructure, antes del use-case**
  (R1, `security-validate-all-input`): multer se configura en memoria
  (`memoryStorage()`, sin escribir a disco) vía `FileInterceptor('file', {
  storage: memoryStorage() })` en el controller. La validación de MIME
  (`application/pdf`, `image/jpeg`, `image/png`) y tamaño (≤10 MB) se hace con
  `ParseFilePipe` (validators `FileTypeValidator` + `MaxFileSizeValidator`,
  `fileIsRequired: true`) **configurado con `errorHttpStatusCode:
  HttpStatus.BAD_REQUEST`** — el default de Nest para `ParseFilePipe` es 422,
  pero la tabla de errores de `docs/conventions.md` fija 400 para "datos
  inválidos", así que se fija explícitamente. Esto garantiza que un archivo
  inválido nunca llega a `FileStorageService.upload` ni al use-case.

- **`UploadPaymentEvidenceUseCase` como use-case de responsabilidad única**
  (R2, R3), estructuralmente igual a `RegisterPaymentUseCase` pero con un
  paso adicional de subida: `findById` → lanza `OdcNotFoundError` si no
  existe → `fileStorageService.upload({ buffer, mimeType, folder:
  \`odc/${order.odcNumber}/evidence\` })` → obtiene `{ publicId }` →
  `order.transition('upload_payment_evidence', actor.role, {
  paymentEvidenceFile: publicId, evidenceReference: dto.evidenceReference })`
  → construye `OdcStatusHistoryEntry` con el `TransitionRecord` devuelto →
  `repository.update(order, entry)`. Aplica `arch-single-responsibility`: un
  use-case, una transición. Inyecta `PurchaseOrderRepository` (token
  existente) y `FileStorageService` (token nuevo, ver más abajo), sin repetir
  el chequeo de rol/estado/datos requeridos fuera del dominio (mismo
  principio ya establecido en `odc-register-payment`).

- **Orden subida→transición acepta un riesgo documentado de archivo huérfano**
  (R2, R3): el `publicId` solo se conoce después de subir el buffer a
  Cloudinary, así que la subida ocurre antes de invocar `order.transition(...)`.
  Si la ODC no existe, se corta antes de subir (404 limpio). Si la ODC existe
  pero no está en `PAGO_REGISTRADO`, el archivo **ya se subió** cuando
  `transition` lanza `InvalidStatusTransitionError` (409) — el archivo queda
  huérfano en Cloudinary, sin `public_id` persistido en ningún lado. Se
  acepta como deuda documentada (ver "Alternativas descartadas") en vez de
  pre-validar el estado en el use-case, que duplicaría la máquina de estados
  fuera del dominio.

- **`GetPaymentEvidenceFileUseCase` compone `GetOdcUseCase` en vez de
  duplicar la regla de visibilidad** (R5, R6): inyecta `GetOdcUseCase` (ya
  aprobado en `odc-create-draft`, encapsula el 404/403 de
  visibilidad —`OdcNotFoundError`/`OdcAccessDeniedError`— sin volver a tocar
  el repositorio) y `FileStorageService`. Flujo: `order =
  getOdcUseCase.execute(odcId, viewer)` → si `order.paymentEvidenceFile ===
  null` lanza `PaymentEvidenceNotFoundError` (dominio, nuevo, ver abajo) → en
  otro caso `fileStorageService.getSignedUrl({ publicId:
  order.paymentEvidenceFile })` → devuelve la URL firmada al controller.
  Ningún chequeo de visibilidad se repite: se delega enteramente en
  `GetOdcUseCase`.

- **Nuevo error de dominio `PaymentEvidenceNotFoundError`** (R6): archivo
  `domain/errors/payment-evidence-not-found.error.ts` del módulo `odc`, mismo
  patrón que `OdcNotFoundError`/`OdcAccessDeniedError` (clase que extiende
  `Error`, sin imports de framework). El controller extiende
  `rethrowDomainError` para traducirlo a `NotFoundException` (404). No es una
  regla de transición nueva — es una condición de "recurso relacionado
  todavía no existe", coherente con mantener el use-case libre de excepciones
  de `@nestjs/common`.

- **Respuesta HTTP nunca expone el `public_id` (R4)**: como ningún endpoint
  de `OdcController` filtra su salida hoy (ver "Verificación previa" en
  [[requirements]]), se introduce
  `infrastructure/mappers/odc-response.mapper.ts` con una función
  `toOdcResponse(order: PurchaseOrder): OdcResponseDto` que copia todas las
  propiedades públicas de `PurchaseOrder` **excepto** `paymentEvidenceFile`,
  al que sustituye por `hasPaymentEvidence: boolean` (`order.paymentEvidenceFile
  !== null`). Los 9 handlers de `OdcController` que hoy devuelven
  `PurchaseOrder`/`OdcPage` pasan su resultado por este mapper antes de
  responder (`list` mapea `page.items`). Este mapper vive en
  `infrastructure/` (no en `domain/` ni `application/`): es un detalle de
  serialización HTTP, no una regla de negocio — coherente con la regla de
  dependencia de `docs/architecture.md` (`application`/`domain` no conocen la
  forma de la respuesta HTTP).

- **Módulo `files` dedicado para `FileStorageService`** (R7,
  `arch-module-sharing`): dado que el plan maestro indica explícitamente que
  la feature 8 reutiliza el mismo servicio, la interfaz y su implementación
  Cloudinary no viven dentro del módulo `odc` — viven en
  `backend/src/modules/files/`, con la misma separación
  domain/infrastructure que el resto del proyecto:
  - `domain/services/file-storage.service.ts` — interfaz `FileStorageService`,
    sin imports de Cloudinary ni de ningún framework (mismo espíritu que
    `domain/repositories/`, pero bajo `domain/services/` porque no es un
    repositorio de un agregado de negocio, sino un puerto de infraestructura
    genérico consumido por varios módulos de feature).
  - `infrastructure/services/cloudinary-file-storage.service.ts` — implementa
    la interfaz con el SDK oficial `cloudinary`; configura
    `cloudinary.config({ cloud_name, api_key, api_secret })` a partir de
    `ConfigService` (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
    `CLOUDINARY_API_SECRET`); el método de subida llama al uploader del SDK
    con `resource_type: 'auto'` y `type: 'authenticated'` en la carpeta
    recibida, y devuelve solo `{ publicId: result.public_id }` (nunca
    `result.secure_url` ni ningún otro campo de URL); el método de URL firmada
    llama a `cloudinary.url(publicId, { sign_url: true, type: 'authenticated',
    resource_type: 'auto', expires_at })` con una expiración corta (p. ej.
    ahora + 5 minutos).
  - `files.module.ts` — registra `CloudinaryFileStorageService` bajo el token
    `'FileStorageService'` y lo exporta (`di-use-interfaces-tokens`,
    `arch-module-sharing`: "dedicated module + exports", igual patrón que
    evita instancias duplicadas del ejemplo de la skill). `OdcModule` importa
    `FilesModule` (no re-declara el provider); `odc-invoice-completion` (F8)
    hará lo mismo.
  - Tests unitarios de `CloudinaryFileStorageService` mockean el paquete
    `cloudinary` completo (`jest.mock('cloudinary')`,
    `test-mock-external-services`): ninguna llamada de red real en la suite.

- **Credenciales por env, fuera del alcance de esta spec** (R7): el
  implementer añade `CLOUDINARY_CLOUD_NAME=`, `CLOUDINARY_API_KEY=`,
  `CLOUDINARY_API_SECRET=` a `.env.example` (raíz) y las instala como
  dependencias nuevas (`cloudinary`, `multer`, `@types/multer` en
  `backend/package.json`); no se hardcodean ni se commitean valores reales.

## Archivos afectados

- `backend/src/modules/files/domain/services/file-storage.service.ts`
  (nuevo) — interfaz `FileStorageService` (R7). Capa domain.
- `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.ts`
  (nuevo) — implementación con el SDK `cloudinary` (R7). Capa infrastructure.
- `backend/src/modules/files/files.module.ts` (nuevo) — registra y exporta el
  provider bajo el token `'FileStorageService'` (R7).
- `backend/src/modules/odc/application/dto/upload-payment-evidence.dto.ts`
  (nuevo) — `evidenceReference` opcional (R1). Capa application.
- `backend/src/modules/odc/application/use-cases/upload-payment-evidence.usecase.ts`
  (nuevo) — T8: sube el archivo, `order.transition('upload_payment_evidence',
  ...)`, historial, `repository.update` (R2, R3). Capa application.
- `backend/src/modules/odc/application/use-cases/get-payment-evidence-file.usecase.ts`
  (nuevo) — compone `GetOdcUseCase` + `FileStorageService.getSignedUrl` (R5,
  R6). Capa application.
- `backend/src/modules/odc/domain/errors/payment-evidence-not-found.error.ts`
  (nuevo) — error de dominio para "evidencia aún no subida" (R6). Capa
  domain.
- `backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts`
  (nuevo) — `toOdcResponse()`, sustituye `paymentEvidenceFile` por
  `hasPaymentEvidence` (R4). Capa infrastructure.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`
  (modificado) — añade `POST :id/payment-evidence` (multer +
  `ParseFilePipe`, `@Roles('ADMINISTRACION')`, `@HttpCode(200)`) y
  `GET :id/files/evidence` (`@Redirect()`, sin `@Roles`, visibilidad vía
  use-case); pasa el resultado de los 9 handlers existentes por
  `toOdcResponse()`/mapeo de `OdcPage` (R2, R3, R4, R5, R6). Capa
  infrastructure.
- `backend/src/modules/odc/odc.module.ts` (modificado) — importa
  `FilesModule`, registra `UploadPaymentEvidenceUseCase` y
  `GetPaymentEvidenceFileUseCase` como providers (R2, R3, R5, R6, R7).

Sin cambios: `domain/entities/purchase-order.entity.ts`,
`domain/entities/odc-status-history-entry.entity.ts`,
`domain/errors/invalid-role-transition.error.ts`,
`domain/errors/invalid-status-transition.error.ts`,
`domain/errors/missing-transition-data.error.ts`,
`domain/errors/odc-access-denied.error.ts`,
`domain/errors/odc-not-found.error.ts`,
`domain/repositories/purchase-order.repository.ts`,
`infrastructure/entities/*`, `infrastructure/repositories/*`,
`infrastructure/mappers/purchase-order.mapper.ts` (ORM↔domain, no confundir
con el nuevo `odc-response.mapper.ts` domain↔HTTP),
`auth/infrastructure/decorators/roles.decorator.ts`,
`auth/infrastructure/guards/roles.guard.ts`,
`application/use-cases/get-odc.usecase.ts` (se reutiliza, no se modifica) —
todos ya completos y aprobados, o ya genéricos respecto a esta transición.

## Alternativas descartadas

- **Persistir la URL cruda de Cloudinary (`secure_url`) en vez del
  `public_id`**: descartada — el plan maestro fija explícitamente "se
  persiste el `public_id`... nunca la URL cruda".
- **Dejar `paymentEvidenceFile` tal cual en las respuestas JSON de
  list/detail** (sin `hasPaymentEvidence`): descartada — filtraría el
  `public_id` de Cloudinary en cualquier respuesta de la API, violando "nunca
  se expone el `public_id`... sin pasar por este guard" del brief F7.
- **Pre-validar rol/estado de la ODC en `UploadPaymentEvidenceUseCase` antes
  de subir el archivo** (para evitar el archivo huérfano del 409):
  descartada — duplicaría la máquina de estados fuera del dominio, violando
  el principio ya establecido en `odc-register-payment` ("ninguna regla de
  transición se duplica fuera del dominio"); el riesgo se documenta como
  deuda aceptada en vez de resolverse aquí.
- **`FileStorageService` dentro de `domain/repositories/` del módulo `odc`**
  (mismo patrón que `PurchaseOrderRepository`): descartada — el plan maestro
  indica que la feature 8 reutiliza el mismo servicio; ponerlo dentro de
  `odc` acoplaría `odc-invoice-completion` a importar internals de otro
  módulo de feature. Se crea el módulo `files` dedicado en su lugar
  (`arch-module-sharing`).
- **Endpoint genérico `GET /api/odcs/:id/files/:kind`**: descartada para esta
  feature — la tabla resumen de superficie API lo sugiere como atajo, pero el
  brief propio de F7 y la instrucción de esta tarea fijan la ruta literal
  `GET /api/odcs/:id/files/evidence`; generalizar a `:kind` queda como
  decisión de la feature 8.
- **`ParseFilePipe` con el `errorHttpStatusCode` por defecto (422)**:
  descartada — la tabla de errores de `docs/conventions.md` fija 400 para
  "datos inválidos"; se configura explícitamente `HttpStatus.BAD_REQUEST`.
- **Repetir el chequeo de rol/estado/datos requeridos en
  `UploadPaymentEvidenceUseCase` antes de llamar a `transition`**: descartada
  — mismo principio que en `odc-register-payment`, ninguna regla de
  transición se duplica fuera del dominio.
- **Restricción por creador en T8**: descartada — la tabla T1–T10 del plan
  maestro no anota "(solo el creador)" para T8, a diferencia de T2/T10.
