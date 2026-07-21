# impl: odc-invoice-completion
Fecha: 2026-07-21

## Archivos creados
- backend/src/modules/odc/application/dto/upload-invoice.dto.ts — `UploadInvoiceDto`: `warehouseEntryDate` obligatorio (`@IsDateString @IsNotEmpty`), `invoiceNumber`/`invoiceDate`/`observations` opcionales.
- backend/src/modules/odc/application/dto/upload-invoice.dto.spec.ts — tests R1 del DTO.
- backend/src/modules/odc/application/use-cases/upload-invoice.usecase.ts — `UploadInvoiceUseCase` (T9): placeholder → `order.transition('upload_invoice', ...)` → sube a `odc/<odcNumber>/invoice` → persiste `invoiceFile` real → historial → `repository.update`.
- backend/src/modules/odc/application/use-cases/upload-invoice.usecase.spec.ts — tests R2/R3.
- backend/src/modules/odc/application/use-cases/get-invoice-file.usecase.ts — `GetInvoiceFileUseCase`: compone `GetOdcUseCase` (404/403) + `FileStorageService.getSignedUrl`.
- backend/src/modules/odc/application/use-cases/get-invoice-file.usecase.spec.ts — tests R5/R6.
- backend/src/modules/odc/domain/errors/invoice-not-found.error.ts — `InvoiceNotFoundError`, mismo patrón que `PaymentEvidenceNotFoundError`.

## Archivos modificados
- backend/src/modules/odc/infrastructure/controller/odc.controller.ts — añade `createInvoiceFilePipe()` (R1); nuevo handler `POST :id/invoice` (`uploadInvoice`, `@Roles('DIRECTOR_OPS')`, `@HttpCode(200)`, multer en memoria) (R2, R3); reemplaza `@Get(':id/files/evidence')` por `@Get(':id/files/:kind')` (`getOdcFile`), que despacha a `GetPaymentEvidenceFileUseCase`/`GetInvoiceFileUseCase` según `kind`, 400 (`BadRequestException`) antes de invocar cualquier use-case si `kind` no es `evidence`/`invoice` (R7); `rethrowDomainError` ahora también traduce `InvoiceNotFoundError` a 404.
- backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts — tests R1 (pipe), R2/R3 (ruta invoice), R7 (ruta generalizada + 400 `kind=foo`), regresión R5/R6 de `odc-payment-evidence` reejecutada contra `kind='evidence'`, y R5/R6 nuevos para `kind='invoice'`.
- backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts — `toOdcResponse` desestructura también `invoiceFile` y añade `hasInvoice: invoiceFile !== null`; `OdcResponseDto` pierde `invoiceFile`, gana `hasInvoice: boolean`.
- backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.spec.ts — tests R4 para `hasInvoice`/ausencia de `invoiceFile`; corrige una aserción preexistente que esperaba `invoiceFile: null` (ahora la propiedad no existe en absoluto).
- backend/src/modules/odc/odc.module.ts — registra `UploadInvoiceUseCase` y `GetInvoiceFileUseCase` como providers (sin nuevos imports de módulo; `FilesModule` ya estaba importado desde F7).
- specs/odc-invoice-completion/traceability.md — las 7 filas actualizadas (test + commit), ninguna "pendiente".

## Requisitos cubiertos
- R1: tests `upload-invoice.dto.spec.ts::R1: UploadInvoiceDto requires warehouseEntryDate and keeps invoiceNumber/invoiceDate/observations optional` y `odc.controller.spec.ts::R1: invoice file validation (MIME/size) before Cloudinary (odc-invoice-completion)`, commit `aa48834`.
- R2: tests `upload-invoice.usecase.spec.ts::R2: upload-invoice transitions EVIDENCIA_PAGO_SUBIDA to COMPLETADA for DIRECTOR_OPS` y `odc.controller.spec.ts::R2: POST /api/odcs/:id/invoice uploads to Cloudinary with 200 restricted to DIRECTOR_OPS`, commit `0359d25`.
- R3: tests `upload-invoice.usecase.spec.ts::R3: upload-invoice rejects unknown ids and non-EVIDENCIA_PAGO_SUBIDA statuses` y `odc.controller.spec.ts::R3: invoice responds 404 for an unknown id and 409 outside EVIDENCIA_PAGO_SUBIDA`, commit `0359d25`.
- R4: test `odc-response.mapper.spec.ts::R4: toOdcResponse hides invoiceFile and exposes hasInvoice (odc-invoice-completion)`, commit `c05c5d6`.
- R5: test `get-invoice-file.usecase.spec.ts::R5: GET files/invoice resolves a short-lived signed Cloudinary URL` (+ controller `R5: GET /api/odcs/:id/files/invoice redirects...`), commit `2bf6153` (use-case), `854eef3` (controller).
- R6: test `get-invoice-file.usecase.spec.ts::R6: files/invoice rejects unknown ids, missing invoice and BORRADOR of another creator` (+ controller `R6: files/invoice responds 404...`), commit `2bf6153` (use-case), `854eef3` (controller).
- R7: test `odc.controller.spec.ts::R7: GET /api/odcs/:id/files/:kind generalizes the download route (evidence|invoice)`, más los bloques `R5`/`R6` reejecutados contra `kind='evidence'` (regresión de `odc-payment-evidence`, cero fallos) y contra `kind='invoice'`, commit `854eef3`.

Commit adicional `f25152d` (refactor): formateo de `eslint --fix` sobre dos archivos ya committeados (solo wrap de línea, sin cambio de comportamiento; verificado con test suite completa antes y después).

Commit `eb980d4` (docs): versiona `specs/odc-invoice-completion/{requirements,design,tasks,traceability}.md`, que nunca habían sido comiteados por spec_author antes de que empezara a implementar.

## Decisiones de diseño
- Placeholder-antes-de-subir en `UploadInvoiceUseCase`: idéntico al patrón real de `UploadPaymentEvidenceUseCase` (no al `design.md` original de esa feature, que describía el orden inverso). `order.transition('upload_invoice', ...)` valida estado → rol → datos requeridos y lanza antes de tocar Cloudinary, eliminando el riesgo de archivo huérfano (R3), tal como especifica `design.md` de esta feature.
- `createInvoiceFilePipe()` como función nombrada independiente, replicando exactamente el allowlist MIME y el tope de 10 MB de `createPaymentEvidenceFilePipe()`, sin introducir una fábrica genérica compartida (decisión explícita de `design.md`, "Alternativas descartadas").
- `GetInvoiceFileUseCase` como use-case separado de `GetPaymentEvidenceFileUseCase` (no se unificó en un `GetOdcFileUseCase` parametrizado), preservando `arch-single-responsibility`.
- Ruta generalizada `GET :id/files/:kind`: el controller (`getOdcFile`) es el único punto que conoce el mapeo `kind → use-case`; `kind` inválido responde 400 (`BadRequestException`) antes del `try`, sin pasar por `rethrowDomainError`, para no invocar ningún use-case.
- Renombrado el handler `getPaymentEvidenceFile` → `getOdcFile` (nombre no fijado por la spec, solo la ruta); los tests de regresión de R5/R6 de `odc-payment-evidence` se adaptaron a la nueva firma `(id, kind, request)` en lugar de mantenerse byte-idénticos, como permite R7 ("se reejecutan... confirmando cero regresión").

## Output de build
```
backend: pnpm build -> nest build (sin errores)
frontend: pnpm build -> vite build (client + ssr), "built in ~500ms" cada uno, sin errores
```

## Output de tests
```
backend: pnpm test
Test Suites: 44 passed, 44 total
Tests:       410 passed, 410 total

frontend: pnpm test --passWithNoTests
No test files found, exiting with code 0 (esperado, sin regresión — fuera de alcance de esta feature)
```

## Notas para el reviewer
- La suite completa de `odc.controller.spec.ts` (77 tests) incluye la regresión explícita de R5/R6 de `odc-payment-evidence` contra la ruta generalizada (`kind='evidence'`): cero fallos.
- `specs/odc-invoice-completion/{requirements,design,tasks}.md` no habían sido comiteados nunca (todo el directorio estaba `untracked` al empezar); se versionaron en el commit `eb980d4` junto con `traceability.md` completo.
- No se tocó dominio, `PurchaseOrderRepository`, entidades ORM, `FileStorageService`/`FilesModule`, `.env`/`.env.example`, ni se instalaron dependencias — todo conforme a "Fuera de alcance" de `requirements.md`.
- `feature_list.json` no se marcó `done`; queda para el leader tras la revisión del reviewer.
