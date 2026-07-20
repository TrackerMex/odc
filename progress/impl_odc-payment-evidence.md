# impl: odc-payment-evidence
Fecha: 2026-07-20

## Archivos creados

- `backend/src/modules/files/domain/services/file-storage.service.ts` — interfaz `FileStorageService` (upload/getSignedUrl), sin imports de Cloudinary ni de framework (R7).
- `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.ts` — implementación con el SDK `cloudinary` (data URI en memoria, `resource_type: 'auto'`, `type: 'authenticated'`, URL firmada de 5 minutos) (R7).
- `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.spec.ts` — tests con `jest.mock('cloudinary')`, cero red real (R7).
- `backend/src/modules/files/files.module.ts` — registra `CloudinaryFileStorageService` bajo el token `'FileStorageService'` y lo exporta (R7).
- `backend/src/modules/files/files.module.spec.ts` — verifica el provider/export (R7).
- `backend/src/modules/odc/application/dto/upload-payment-evidence.dto.ts` — `evidenceReference` opcional; el archivo viaja fuera del DTO vía multer/`@UploadedFile` (R1).
- `backend/src/modules/odc/application/dto/upload-payment-evidence.dto.spec.ts` (R1).
- `backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts` — `toOdcResponse()`/`toOdcPageResponse()`: sustituyen `paymentEvidenceFile` por `hasPaymentEvidence` (R4).
- `backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.spec.ts` (R4).
- `backend/src/modules/odc/domain/errors/payment-evidence-not-found.error.ts` — error de dominio para "evidencia aún no subida" (R6).
- `backend/src/modules/odc/application/use-cases/upload-payment-evidence.usecase.ts` — T8 completo: sube a Cloudinary, persiste `public_id`, transiciona, historial (R2, R3).
- `backend/src/modules/odc/application/use-cases/upload-payment-evidence.usecase.spec.ts` (R2, R3).
- `backend/src/modules/odc/application/use-cases/get-payment-evidence-file.usecase.ts` — compone `GetOdcUseCase` + `FileStorageService.getSignedUrl` (R5, R6).
- `backend/src/modules/odc/application/use-cases/get-payment-evidence-file.usecase.spec.ts` (R5, R6).

## Archivos modificados

- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` — añade `POST :id/payment-evidence` (multer `memoryStorage`, `ParseFilePipe` con `FileTypeValidator`+`MaxFileSizeValidator`, `errorHttpStatusCode: 400`, `@Roles('ADMINISTRACION')`, `@HttpCode(200)`) y `GET :id/files/evidence` (`@Redirect()`, sin `@Roles`); los 10 handlers que serializan `PurchaseOrder`/`OdcPage` ahora devuelven `toOdcResponse()`/`toOdcPageResponse()` (R1-R7).
- `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts` — reescrito: los tests existentes ahora comparan contra `toOdcResponse(...)` en vez de identidad (`toBe`), más las describe nuevas de R1-R6 de esta feature.
- `backend/src/modules/odc/odc.module.ts` — importa `FilesModule`, registra `UploadPaymentEvidenceUseCase` y `GetPaymentEvidenceFileUseCase`.
- `backend/package.json` / `backend/pnpm-lock.yaml` — `pnpm add cloudinary multer && pnpm add -D @types/multer`.
- `.env.example` — añadidas `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` vacías (no se tocó `.env` real, no se inventaron credenciales).

## Requisitos cubiertos

- R1: `upload-payment-evidence.dto.spec.ts::R1: UploadPaymentEvidenceDto keeps evidenceReference optional`; `odc.controller.spec.ts::R1: payment-evidence file validation (MIME/size) before Cloudinary (odc-payment-evidence)`, commits `34c85fe`, `d63dde3`.
- R2: `upload-payment-evidence.usecase.spec.ts::R2: ...`; `odc.controller.spec.ts::R2: POST /api/odcs/:id/payment-evidence uploads to Cloudinary with 200 restricted to ADMINISTRACION`, commits `0d34d1f`, `d63dde3`.
- R3: `upload-payment-evidence.usecase.spec.ts::R3: ...`; `odc.controller.spec.ts::R3: payment-evidence responds 404 for an unknown id and 409 outside PAGO_REGISTRADO`, commits `0d34d1f`, `d63dde3`.
- R4: `odc-response.mapper.spec.ts::R4: ...` (x2); `odc.controller.spec.ts::R4: GET /api/odcs/:id detail never exposes the raw paymentEvidenceFile (odc-payment-evidence)`, commits `dd3900f`, `d63dde3`.
- R5: `get-payment-evidence-file.usecase.spec.ts::R5: ...`; `odc.controller.spec.ts::R5: GET /api/odcs/:id/files/evidence redirects (302) to a signed Cloudinary URL`, commits `d196f90`, `d63dde3`.
- R6: `get-payment-evidence-file.usecase.spec.ts::R6: ...`; `odc.controller.spec.ts::R6: files/evidence responds 404 for an unknown id, 404 without evidence yet, and 403 on a BORRADOR of another creator`, commits `d196f90`, `d63dde3`.
- R7: `cloudinary-file-storage.service.spec.ts::R7: ...` (x3); `files.module.spec.ts::R7: ...`, commit `190e60b`.

`specs/odc-payment-evidence/traceability.md` actualizado (commit `4b99477`), sin filas "pendiente".

## Decisiones de diseño

- **Orden transición→subida (desvío deliberado de design.md, documentado para el reviewer)**: design.md proponía `upload() → order.transition(...)`. R2 exige explícitamente "IF el rol del usuario no es ADMINISTRACION THEN... SHALL responder 403 sin subir el archivo"; con `upload()` antes de `transition()`, un rol equivocado habría subido el archivo igual (el `order.transition()` solo revisa rol después de encontrar la regla de estado, y en ese punto el diseño original ya habría llamado a Cloudinary). Implementé en su lugar: `order.transition('upload_payment_evidence', actor.role, { paymentEvidenceFile: 'pending-upload', evidenceReference })` primero — esto valida rol+estado+datos requeridos usando **exclusivamente** la máquina de estados del dominio (sin duplicar ninguna regla fuera de `PurchaseOrder`, principio ya establecido en `odc-register-payment`) y lanza antes de mutar nada si algo falla. Solo si la validación pasa se invoca `FileStorageService.upload(...)`, y el placeholder se sobrescribe con el `publicId` real antes de persistir. Efecto: `FileStorageService.upload` nunca se llama para rol o estado inválidos (verificado con 12 tests en `upload-payment-evidence.usecase.spec.ts`), lo cual además elimina por completo el riesgo de "archivo huérfano en Cloudinary" que design.md aceptaba como deuda para el caso 409 — sin tocar el dominio.
- **`FileTypeValidator` con `skipMagicNumbersValidation: true`** (R1): la versión instalada de Nest (11.x) valida por defecto los "magic numbers" del buffer vía el paquete ESM `file-type`, no el string de MIME type. Eso complica los tests (buffers de prueba pequeños no tienen firma binaria real) y no es lo que pide el requisito ("archivo cuyo MIME type no es..."). Se configuró para comparar directamente `file.mimetype`, evitando además una dependencia ESM adicional.
- **`MaxFileSizeValidator` con `maxSize: 10MB + 1`**: el validador de Nest usa `size < maxSize` (estrictamente menor). Como el requisito es "≤ 10MB" (un archivo de exactamente 10 485 760 bytes debe pasar), se pasa `maxSize` con +1 byte para que el límite se comporte como `<=`.
- **Upload vía data URI base64** en `CloudinaryFileStorageService` (en vez de `upload_stream`): usa el mismo método `cloudinary.uploader.upload(dataUri, options)` para ambos casos síncronos/async, simplifica el mock en tests (una sola llamada resuelta, sin manejar streams), y usa el `mimeType` recibido de forma explícita en el propio data URI.
- **Mapper de respuesta en `infrastructure/mappers/odc-response.mapper.ts`**: destructura `{ paymentEvidenceFile, ...rest }` sobre la instancia de `PurchaseOrder` y agrega `hasPaymentEvidence`; se aplicó a los 10 handlers de `OdcController` que serializan una ODC (los 9 preexistentes + el nuevo `payment-evidence`), cerrando la fuga de R4 en toda la superficie de la API, no solo en el endpoint nuevo.

## Notas para el reviewer

- El desvío del orden transición→subida frente a `design.md` (arriba) es la decisión más importante a revisar: confirma que satisface R2/R3 literalmente y no reintroduce ninguna regla de negocio fuera del dominio.
- `odc.controller.spec.ts` fue reescrito por completo: los tests preexistentes (R1,R2,...,R13 de otras features) mantienen su intención pero ahora comparan `toEqual(toOdcResponse(...))` en vez de `toBe(...)` porque el controller ya no devuelve la entidad de dominio cruda. Vale la pena revisar que ningún assert quedó débil por el cambio.
- Variables de entorno pendientes de configurar en `.env` real (no tocado, no inventadas): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (ya documentadas vacías en `.env.example`).
- `tsc --noEmit` standalone (fuera de `TEST_CMD`) reporta ruido preexistente no relacionado con esta feature (helpers `sessionUser()`/`UserRepositoryMock` en specs de `auth`/`users` y en el propio `odc.controller.spec.ts` heredado); confirmado con `git stash` que ya existía antes de esta sesión y que `pnpm test`/`pnpm build` (los comandos reales de `init.config.sh`) no se ven afectados.

## Output de build

```
> backend@0.0.1 build
> nest build
(sin errores)

> frontend@ build
> vite build
✓ built in 659ms (client) / 616ms (ssr)
```

## Output de tests

```
> backend@0.0.1 test
> jest
Test Suites: 41 passed, 41 total
Tests:       363 passed, 363 total   (313 antes de esta feature + 50 nuevos)

> frontend@ test
> vitest run --passWithNoTests
No test files found, exiting with code 0
```

`pnpm lint` (backend): sin errores. `./init.sh`: verde de punta a punta.
