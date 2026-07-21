# review: odc-invoice-completion
Fecha: 2026-07-21
Veredicto: APROBADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`odc-invoice-completion`, id 8) en `feature_list.json`
- [x] `progress/current.md` describe la sesión activa (feature, plan, estados de spec_author/implementer/reviewer)

## Checklist C3 — Arquitectura
- [x] `domain` sin imports de infrastructure: `invoice-not-found.error.ts` extiende `Error` sin imports externos; `purchase-order.entity.ts` no fue tocado (T9 ya vivía completa desde `odc-create-draft`)
- [x] Repositorios/contratos en domain son interfaces puras (no se tocó `purchase-order.repository.ts` ni se añadió ninguno)
- [x] `application` depende de interfaces vía token (`@Inject('PurchaseOrderRepository')`, `@Inject('FileStorageService')` en `upload-invoice.usecase.ts` y `get-invoice-file.usecase.ts`), nunca de `CloudinaryFileStorageService` ni de `PurchaseOrderTypeOrmRepository` directamente
- [x] `infrastructure` implementa/consume las interfaces de domain sin lógica de negocio: el controller solo delega a use-cases y traduce errores de dominio a HTTP; el mapper es un detalle de serialización
- [x] `git diff aa48834~1 854eef3 --stat` confirma que el único archivo tocado fuera de `application/`, `infrastructure/controller`, `infrastructure/mappers` y `odc.module.ts` es el nuevo `domain/errors/invoice-not-found.error.ts` (mismo patrón que `payment-evidence-not-found.error.ts`, ya aprobado). Ningún archivo de `domain/entities`, `domain/repositories`, `infrastructure/entities|repositories` del módulo `odc`, del módulo `files/`, ni `.env`/`.env.example` cambió — exactamente lo declarado en `design.md`.

## Checklist C4 — TDD
- [x] Cada R1–R7 tiene test(s) que lo nombran explícitamente (`describe('R<n>: ...')`) en `upload-invoice.dto.spec.ts`, `upload-invoice.usecase.spec.ts`, `get-invoice-file.usecase.spec.ts`, `odc-response.mapper.spec.ts` y `odc.controller.spec.ts`
- [x] Historial de commits separado por requisito, coherente con `tasks.md`: `aa48834`(R1) → `c05c5d6`(R4) → `0359d25`(R2,R3) → `2bf6153`(R5,R6) → `854eef3`(R7), igual patrón (test+impl juntos por commit, un commit por requisito/grupo) que el ya aprobado en `odc-payment-evidence`. `f25152d` es un refactor de formateo sin cambio de comportamiento (verificado: solo wrap de línea); `eb980d4`/`be6dfbf` son commits de documentación (specs + reporte).

## Checklist C5 — Trazabilidad
- [x] `specs/odc-invoice-completion/traceability.md` sin ninguna fila "pendiente"; las 7 filas tienen test y commit, verificados contra el código real y `git log --oneline`
- [x] Commits siguen `feat(<scope>): <desc> (R-ids)` — confirmado en los 5 commits `feat` listados arriba

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` y casilla "Aprobado por humano" marcada (fecha: 2026-07-21)
- [x] Ningún requisito modificado después de la aprobación

## Verificación de requisitos (código real, no solo el reporte)

- **R1**: `UploadInvoiceDto` (`warehouseEntryDate` `@IsDateString @IsNotEmpty`; `invoiceNumber`/`invoiceDate`/`observations` `@IsOptional`) verificado línea a línea contra `upload-invoice.dto.spec.ts` (8 casos). `createInvoiceFilePipe()` en `odc.controller.ts` replica exactamente `createPaymentEvidenceFilePipe()` (mismo allowlist MIME, mismo tope 10MB+1, `errorHttpStatusCode: 400`, `fileIsRequired: true`); probado directamente vía `pipe.transform(...)` en `odc.controller.spec.ts`. El pipe se ejecuta en `@UploadedFile()` antes de que el handler invoque el use-case, por lo que un archivo inválido nunca llega a Cloudinary (misma garantía estructural aceptada en la revisión de `odc-payment-evidence`).
- **R2**: `UploadInvoiceUseCase` sube a `odc/<odcNumber>/invoice`, persiste `publicId` (nunca URL — `expect(order.invoiceFile).not.toMatch(/^https?:\/\//)`), persiste `warehouseEntryDate`/`invoiceNumber`/`invoiceDate`/`observations` (con y sin opcionales), transiciona a `COMPLETADA`, registra historial (`fromStatus`/`toStatus`/`userId`/`note: null`), 200. Rol distinto → `InvalidRoleTransitionError` sin invocar `upload`. Confirmado en `upload-invoice.usecase.spec.ts` y `odc.controller.spec.ts`.
- **R3**: id inexistente → `OdcNotFoundError`; los 7 estados restantes → `InvalidStatusTransitionError` (`it.each`), sin mutar `status`/`invoiceFile` y sin invocar `upload`. Confirmado.
- **R4**: `toOdcResponse` desestructura `invoiceFile` y añade `hasInvoice: invoiceFile !== null`; `OdcResponseDto` ya no tiene `invoiceFile`. Verificado que el body serializado nunca contiene el `public_id` (`JSON.stringify` sin la cadena) ni `cloudinary.com`, en el mapper y en el controller (`uploadInvoice` con `hasInvoice: true`).
- **R5**: `GetInvoiceFileUseCase` compone `GetOdcUseCase.execute(odcId, viewer)` (404/403 reutilizado, sin duplicar la regla) + `FileStorageService.getSignedUrl({ publicId: order.invoiceFile })`; controller `@Redirect()` responde `{ url, statusCode: 302 }` para `kind='invoice'`. Confirmado.
- **R6**: id inexistente → 404 (burbujea `OdcNotFoundError`); `invoiceFile === null` en cada uno de los 7 estados previos a T9 → `InvoiceNotFoundError` → 404, sin llamar `getSignedUrl`; `BORRADOR` de otro creador → burbujea `OdcAccessDeniedError` → 403. Confirmado.
- **R7**: `@Get(':id/files/:kind')` reemplaza la ruta literal; `kind='evidence'`/`'invoice'` despachan a los use-cases correspondientes; cualquier otro valor → `BadRequestException` (400) antes del `try`, sin invocar ningún use-case (`expect(...execute).not.toHaveBeenCalled()` para ambos). Regresión de R5/R6 de `odc-payment-evidence` reejecutada contra `kind='evidence'` en la misma suite: cero fallos.
- `feature_list.json`, `docker-compose.yml`, los `Dockerfile.dev`/`.dockerignore` nuevos y `progress/current.md` en el working tree son cambios del leader fuera del alcance de esta feature — no evaluados.

## Output de ./init.sh (ejecutado por el reviewer, no aceptado del reporte del implementer)

```
✅ node disponible / pnpm disponible
✅ .env encontrado, DATABASE_URL y JWT_SECRET definidas
✅ Dependencias instaladas
✅ Archivos del harness presentes
⚠️  Feature en progreso: odc-invoice-completion (esperado, in_progress)

Build:
  nest build → sin errores
  vite build (client+ssr) → ✓ built in ~300ms cada uno

Tests:
  Test Suites: 44 passed, 44 total
  Tests:       410 passed, 410 total
  (frontend: No test files found, exiting 0 — passWithNoTests, esperado, fuera de alcance)

Lint:
  eslint --fix → sin errores

✅ Todo verde. Listo para trabajar.
Features: 7/13 completadas | 5 pendientes
Próxima feature: [#9] frontend-foundation (P1)
```

## Observaciones

Ninguna bloqueante.
