# review: odc-payment-evidence
Fecha: 2026-07-20
Veredicto: APROBADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`odc-payment-evidence`, id 7) en `feature_list.json`
- [x] `progress/current.md` describe la sesión activa (feature, plan, estados de spec_author/implementer/reviewer)

## Checklist C3 — Arquitectura
- [x] `domain` sin imports de infrastructure: `file-storage.service.ts` (interfaz) no importa `cloudinary` ni ningún framework; `payment-evidence-not-found.error.ts` extiende `Error` sin imports externos
- [x] Repositorios/contratos en domain son interfaces puras (`FileStorageService` es solo tipos + interfaz)
- [x] `application` depende de interfaces vía token (`@Inject('FileStorageService')`, `@Inject('PurchaseOrderRepository')`), nunca de `CloudinaryFileStorageService` directamente
- [x] `infrastructure` implementa las interfaces de domain (`CloudinaryFileStorageService implements FileStorageService`); el mapper `odc-response.mapper.ts` vive correctamente en infrastructure (detalle de serialización HTTP, no regla de negocio)
- [x] `git diff --stat` desde `46c9d72` (antes de esta feature) confirma que NINGÚN archivo de `domain/entities`, `domain/repositories`, `infrastructure/entities|repositories` del módulo `odc`, ni `auth/` cambiaron. Los únicos cambios: módulo `files/` nuevo, `odc/application/{dto,use-cases}` nuevos, `odc/domain/errors/payment-evidence-not-found.error.ts` nuevo, `odc/infrastructure/{controller,mappers}`, `odc.module.ts`. Exactamente lo declarado en `design.md`.

## Checklist C4 — TDD
- [x] Cada R1-R7 tiene test(s) que lo nombran explícitamente (`describe('R<n>: ...')`) en los specs de dto, use-cases, mapper, controller y `CloudinaryFileStorageService`
- [x] Historial de commits separado por requisito: `190e60b`(R7) → `34c85fe`(R1) → `dd3900f`(R4) → `0d34d1f`(R2,R3) → `d196f90`(R5,R6) → `d63dde3`(wiring+integración R1-R7), coherente con el orden sugerido en `tasks.md`

## Checklist C5 — Trazabilidad
- [x] `specs/odc-payment-evidence/traceability.md` sin ninguna fila "pendiente"; los 7 requisitos tienen test y commit registrados, verificados contra el código real y `git log`
- [x] Commits siguen `feat(<scope>): <desc> (R-ids)`

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` y casilla "Aprobado por humano" marcada (fecha 2026-07-20)
- [x] Ningún requisito modificado después de la aprobación

## Punto crítico: inversión de orden transición→subida (desvío de design.md)

Verificado directamente en `upload-payment-evidence.usecase.ts`:

1. `order.transition('upload_payment_evidence', actor.role, { paymentEvidenceFile: 'pending-upload', evidenceReference })` se ejecuta primero. Esto muta el objeto `order` **solo en memoria** (rol/estado/datos requeridos validados exclusivamente dentro de `PurchaseOrder.transition()`, sin ningún chequeo duplicado en el use-case — confirmado leyendo `purchase-order.entity.ts`: el use-case no repite validación de rol ni estado en ninguna parte).
2. Solo si `transition()` no lanza, se invoca `fileStorageService.upload(...)`.
3. `repository.update(order, entry)` — el **único** punto de persistencia — se ejecuta al final, después de que la subida haya devuelto el `publicId` real.

**Conclusión sobre el hueco "transición exitosa pero subida falla después"**: no existe. Como `repository.update()` solo se llama después de que `fileStorageService.upload()` resuelve exitosamente, un fallo de red en Cloudinary aborta la función antes de tocar la base de datos — el objeto `order` mutado en memoria (con el placeholder o el estado `EVIDENCIA_PAGO_SUBIDA`) se descarta sin persistirse. La ODC permanece en `PAGO_REGISTRADO` en la base de datos. Esto en realidad **elimina** el riesgo de archivo huérfano que `design.md` aceptaba como deuda documentada para el caso 409 (en el diseño original, `upload()` iba antes de `transition()`, así que un 409 dejaba un archivo real en Cloudinary sin ningún `public_id` persistido en ningún lado).

Riesgo residual distinto (no mencionado explícitamente en el impl report, pero de categoría genérica y no exigido por R2/R3): si `fileStorageService.upload()` tiene éxito pero `repository.update()` falla después (ej. caída de conexión a Postgres), quedaría un blob huérfano en Cloudinary sin referencia — pero la ODC seguiría en `PAGO_REGISTRADO` en la base de datos (nunca queda en `EVIDENCIA_PAGO_SUBIDA` sin archivo real, que era la preocupación concreta a descartar). Este riesgo es simétrico al de cualquier otra escritura en dos sistemas sin transacción distribuida (aplica igual a `register-payment`, etc.) y no es un hallazgo bloqueante — se anota como observación menor, no como defecto.

- Tests de R2/R3 con el nuevo orden: verificados completos, incluyendo el caso "rol distinto → 403 sin llamar a upload" (`upload-payment-evidence.usecase.spec.ts`, `fileStorageService.upload).not.toHaveBeenCalled()`) y la matriz de los 7 estados no válidos para R3 (409, sin mutar `status` ni `paymentEvidenceFile`, sin invocar upload).
- Trazabilidad del desvío: documentado en 3 lugares — comentario en el código (`upload-payment-evidence.usecase.ts` líneas 17-24), sección "Decisiones de diseño" de `progress/impl_odc-payment-evidence.md`, y explícitamente señalado como "para el reviewer" en la sección de notas del mismo archivo. Trazable.

## Verificación de requisitos (código real, no solo el reporte)

- **R1**: `memoryStorage()` + `ParseFilePipe` (`FileTypeValidator` + `MaxFileSizeValidator`, `errorHttpStatusCode: 400`) resuelto vía `@UploadedFile()` — Nest ejecuta el pipe antes del cuerpo del handler, por lo que un archivo inválido nunca llega a `uploadPaymentEvidenceUseCase.execute()` ni a Cloudinary. Confirmado en `odc.controller.ts` y probado directamente sobre `createPaymentEvidenceFilePipe()` en `odc.controller.spec.ts`.
- **R2**: sube a `odc/<odcNumber>/evidence`, persiste solo `publicId` (nunca URL — verificado con `expect(order.paymentEvidenceFile).not.toMatch(/^https?:\/\//)`), transición + historial + 200; rol distinto → 403 sin upload. Confirmado.
- **R3**: 404 id inexistente; 409 en los 7 estados restantes, sin mutar `status` ni `paymentEvidenceFile`. Confirmado con `it.each`.
- **R4**: los 10 endpoints que serializan `PurchaseOrder`/`OdcPage` (create, submit, update, approve-budget, approve-purchase, reject, payment, payment-evidence, list, detail) pasan por `toOdcResponse()`/`toOdcPageResponse()` — verificado leyendo `odc.controller.ts` completo, línea por línea, los 10 handlers. Ninguno devuelve la entidad cruda.
- **R5**: `@Redirect()` sin `@Roles`, delega visibilidad en `GetPaymentEvidenceFileUseCase` → `GetOdcUseCase` (misma regla que detail). Confirmado.
- **R6**: 404 id inexistente, 404 `paymentEvidenceFile` null (probado en los 7 estados previos a T8), 403 BORRADOR ajeno (vía `OdcAccessDeniedError` de `GetOdcUseCase`, sin duplicar la regla). Confirmado.
- **R7**: `FileStorageService` sin imports de Cloudinary/framework; `CloudinaryFileStorageService` separado en infrastructure; token `'FileStorageService'`; `FilesModule` dedicado, exportado, importado por `OdcModule`. Confirmado, incluyendo `files.module.spec.ts` verificando provider/export vía metadata de Nest.
- Cero llamadas de red reales: único `jest.mock('cloudinary', ...)` cubre el SDK completo; las URLs "https://res.cloudinary.com/..." en los specs son valores de mock, no llamadas reales (confirmado con grep).
- `.env` real no tocado; solo `.env.example` recibió las 3 claves vacías de Cloudinary.

## Output de ./init.sh (ejecutado por el reviewer, no aceptado del reporte del implementer)

```
✅ node disponible / pnpm disponible
✅ .env encontrado, DATABASE_URL y JWT_SECRET definidas
✅ Dependencias instaladas
✅ Archivos del harness presentes
⚠️  Feature en progreso: odc-payment-evidence (esperado, in_progress)

Build:
  nest build → sin errores
  vite build (client+ssr) → ✓ built

Tests:
  Test Suites: 41 passed, 41 total
  Tests:       363 passed, 363 total
  (frontend: No test files found, exiting 0 — passWithNoTests)

Lint:
  eslint --fix → sin errores

✅ Todo verde. Listo para trabajar.
Features: 6/13 completadas | 6 pendientes
Próxima feature: [#8] odc-invoice-completion (P1)
```

## Observaciones

Ninguna bloqueante. Nota menor no bloqueante: el riesgo residual "upload a Cloudinary exitoso + fallo posterior de `repository.update()`" (archivo huérfano en Cloudinary sin corrupción de estado de la ODC) no está mencionado explícitamente en `impl_odc-payment-evidence.md` ni en `design.md`; se sugiere anotarlo como limitación aceptada cuando se documente esta decisión en una futura sesión, mismo tratamiento que el riesgo original que reemplaza. No amerita rechazo: la condición concreta que se pidió descartar (ODC en `EVIDENCIA_PAGO_SUBIDA` sin archivo real) está estructuralmente descartada por el orden de persistencia.
