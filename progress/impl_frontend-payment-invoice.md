# impl: frontend-payment-invoice
Fecha: 2026-07-23 (v2, recompuesta tras rechazo C4)

## Archivos creados
- frontend/src/components/odc/register-payment-form.tsx — formulario "Registrar pago" (R1-R4, R9, R11, R12): visible solo para `DIRECTOR_OPS` en `COMPRA_APROBADA`, valida fecha/método obligatorios, envía `registerPayment`, bloquea doble envío, conserva valores y permite reintento tras error.
- frontend/src/components/odc/register-payment-form.test.tsx — tests de R1, R2, R3, R4, R9, R11, R12 para el formulario anterior.
- frontend/src/components/odc/upload-invoice-form.tsx — formulario "Subir factura" (R5-R9, R11, R12): visible solo para `DIRECTOR_OPS` en `EVIDENCIA_PAGO_SUBIDA`, valida archivo (MIME/tamaño) y fecha de entrada a almacén, envía `uploadInvoice` como `FormData`, bloquea doble envío, conserva valores y permite reintento tras error.
- frontend/src/components/odc/upload-invoice-form.test.tsx — tests de R5, R6, R7, R8, R9, R11, R12 para el formulario anterior.

## Archivos modificados
- frontend/src/lib/api.ts — se añadieron `registerPayment` (JSON, reutiliza `jsonRequest`, tipo `RegisterPaymentPayload`) y `uploadInvoice` (`FormData`, tipo `UploadInvoicePayload`, sin fijar `Content-Type`).
- frontend/src/lib/odc-api.test.ts — se añadieron los describe `R3: registerPayment JSON contract` y `R7: uploadInvoice multipart contract` con los contratos HTTP de ambas funciones (con y sin campos opcionales).
- frontend/src/lib/odc.ts — se añadió el helper puro `odcFileUrl(id, kind)` (`kind: 'evidence' | 'invoice'`) para construir `/api/odcs/:id/files/:kind`.
- frontend/src/lib/odc.test.ts — test `R10: file download route builder` para el helper anterior.
- frontend/src/components/odc/odc-detail.tsx — bloque "Información de factura" (mismo patrón que "Información de pago": `formatDateOnly` para fechas, se omite el campo si no hay valor, se muestra cuando existe al menos un dato de factura) y fila de enlaces de descarga (`<a>` planos a `odcFileUrl`, `target="_blank"`, `rel="noopener noreferrer"`, envoltura `flex flex-wrap`) para comprobante de pago y factura.
- frontend/src/components/odc/odc-detail.test.tsx — tests `R9` (bloque de factura, fechas pendientes, campos de texto omitidos, ausencia de bloque sin datos), `R10` (presencia/ausencia y `href`/`target`/`rel` de ambos enlaces) y `R12` (layout `flex-wrap` de la fila de enlaces).
- frontend/src/routes/_authenticated/odcs/$id.tsx — se componen `RegisterPaymentForm` y `UploadInvoiceForm` junto a los formularios ya existentes, conectados a `registerPayment`/`uploadInvoice` de `lib/api.ts`.

## Requisitos cubiertos
- R1: test `register-payment-form.test.tsx::R1: register payment form visibility and fields`, commits `45a3536` (test, rojo) → `f31f99d` (feat, verde)
- R2: test `register-payment-form.test.tsx::R2: required field validation on register payment`, commits `45a3536` → `f31f99d`
- R3: tests `register-payment-form.test.tsx::R3: register payment submission and confirmed transition` y `odc-api.test.ts::R3: registerPayment JSON contract`, commits `45a3536` → `f31f99d`
- R4: test `register-payment-form.test.tsx::R4: recoverable errors on register payment`, commits `45a3536` → `f31f99d`
- R5: test `upload-invoice-form.test.tsx::R5: upload invoice form visibility and fields`, commits `9a05986` (test, rojo) → `f7cf878` (feat, verde)
- R6: test `upload-invoice-form.test.tsx::R6: file and warehouse entry date validation`, commits `9a05986` → `f7cf878`
- R7: tests `upload-invoice-form.test.tsx::R7: invoice submission and confirmed transition` y `odc-api.test.ts::R7: uploadInvoice multipart contract`, commits `9a05986` → `f7cf878`
- R8: test `upload-invoice-form.test.tsx::R8: recoverable errors on upload invoice`, commits `9a05986` → `f7cf878`
- R9: tests `odc-detail.test.tsx::R9: COMPLETADA badge and invoice information block`, `register-payment-form.test.tsx::R9: hidden once the ODC reaches COMPLETADA` y `upload-invoice-form.test.tsx::R9: hidden once the ODC reaches COMPLETADA`, commits `a09682e` (test, rojo) → `fb18a4d` (feat, verde)
- R10: tests `odc.test.ts::R10: file download route builder` y `odc-detail.test.tsx::R10: evidence and invoice download links`, commits `f8a014b` (test, rojo) → `456a0d0` (feat, verde)
- R11: tests `register-payment-form.test.tsx::R11: loading state and accessibility of register payment` y `upload-invoice-form.test.tsx::R11: loading state and accessibility of upload invoice`, commits `45a3536`→`f31f99d` y `9a05986`→`f7cf878`
- R12: tests `register-payment-form.test.tsx::R12: role x status boundary for register payment`, `upload-invoice-form.test.tsx::R12: role x status boundary for upload invoice` y `odc-detail.test.tsx::R12: responsive layout of the download links row`, commits `1f823b7` (test) → `adb0b91` (feat, compone ambos formularios en `$id.tsx`)

## Decisiones de diseño
- Se reutilizó exactamente el patrón de `PaymentEvidenceForm`/`AdminBudgetActions` (componente que retorna `null` si `role`/`odc.status` no coinciden) en lugar de un componente genérico parametrizable, tal como fija `design.md`.
- `RegisterPaymentPayload` y `UploadInvoicePayload` se definen una sola vez en `lib/api.ts` y los componentes los importan como tipo, evitando duplicar la forma del payload.
- Para R12 se optó por un test exhaustivo `role × ODC_STATUSES` por formulario (excluyendo solo la combinación válida) en vez de un archivo de integración nuevo para la ruta compuesta, evitando abstracción adicional; la verificación de "sin scroll horizontal involuntario" se tradujo en una aserción sobre la clase `flex-wrap` del contenedor de enlaces de descarga, siguiendo el precedente ya usado en `general-approval-actions.test.tsx` (aserciones de clases Tailwind responsive en jsdom).
- Los enlaces de descarga (`<a>` con `target="_blank"`) no pasan por `apiFetch`; siguen usando `buttonVariants` para mantener la apariencia de botón, igual que el `Link` de "Volver al dashboard" en la misma ruta.
- No se crearon componentes shadcn nuevos: `Card`, `Input`, `Label`, `Textarea`, `Button` ya estaban instalados y cubren ambos formularios.

## Output de build
```
cd backend && pnpm build
> backend@0.0.1 build
> nest build
(sin errores)

cd frontend && pnpm build
> frontend@ build
> vite build
✓ 2199 modules transformed. (client)
✓ built in 1.12s
✓ 155 modules transformed. (ssr)
✓ built in 661ms
```

## Output de tests
```
cd backend && pnpm test
Test Suites: 51 passed, 51 total
Tests:       436 passed, 436 total

cd frontend && pnpm test --passWithNoTests
Test Files  23 passed (23)
Tests  161 passed (161)
```

## Notas para el reviewer
- **Esta es la v2 de la feature, recompuesta tras el rechazo por C4 (TDD)**
  de la v1 (commits `5d5dd9a`, `6140d33`, `bfc5e5e`, `f90f9a1`, `8264760`,
  ver `progress/review_frontend-payment-invoice.md`). La v1 quedó intacta
  y respaldada en la rama `backup/frontend-payment-invoice-pre-rewrite-20260723`
  (no se pierde nada; solo se dejó de usar en `frontend-general-approval-12`).
  El código, los tests y la trazabilidad de la v2 son **exactamente el mismo
  contenido final** que la v1 (verificado con
  `git diff f8d8eb1 HEAD -- frontend/ specs/` → sin diferencias de código,
  solo se reescribió el historial de commits). Lo único que cambió es cómo
  se llegó a ese contenido: cada requisito o grupo de requisitos relacionados
  ahora tiene un commit `test(...)` que deja la suite en rojo (verificado
  ejecutando `pnpm vitest run <archivo>` antes de comitear, con el
  componente/función aún sin existir) seguido de un commit `feat(...)` que
  la pone en verde, sin volver a tocar archivos de test en el commit `feat`.
  Mismo procedimiento ya aplicado y aprobado en `frontend-general-approval`
  (ver `backup/frontend-general-approval-pre-rewrite-20260723`).
- Grupos rojo→verde verificados uno por uno con `pnpm vitest run`:
  registrar pago (R1,R2,R3,R4,R11) → subir factura (R5,R6,R7,R8,R11) →
  estado COMPLETADA (R9) → enlaces de descarga (R10) → frontera rol/estado
  y composición en `$id.tsx` (R12). Detalle completo en
  `specs/frontend-payment-invoice/traceability.md`.
- Nota de honestidad sobre R12: los 3 archivos de test del commit rojo de
  ese grupo (`odc-detail.test.tsx`, `register-payment-form.test.tsx`,
  `upload-invoice-form.test.tsx`, porción R12) ejercitan los componentes
  standalone, no la composición en `$id.tsx`; como esos componentes ya
  existían en verde desde los grupos anteriores, esos 3 tests concretos
  pasan de inmediato (no hay rojo real para ellos, y así se confirmó
  ejecutando la suite completa con `$id.tsx` aún sin componer: 161/161
  tests en verde). El propio `design.md` ya anotaba esto como "si aplica"
  al no crear un test de integración de la ruta compuesta. La composición
  de `$id.tsx` en sí (que sí tiene su propio commit `feat` separado, sin
  tocar tests) se verifica por build exitoso y por revisión estructural
  contra el patrón ya usado por `AdminBudgetActions`/`GeneralApprovalActions`/
  `PaymentEvidenceForm` en la misma ruta.
- `npx tsc --noEmit` en `frontend/` solo reporta 3 errores preexistentes en
  `payment-evidence-form.test.tsx` (no tocado por esta feature, ya presentes
  antes de este trabajo); ningún archivo nuevo o modificado por esta feature
  produce errores de tipos.
- `traceability.md` no tiene filas "pendiente"; todas las R1-R12 están
  cerradas con su par de commits `test`→`feat`.
- El backend no se modificó: se verificó contra `RegisterPaymentDto`,
  `UploadInvoiceDto` y las rutas `POST :id/payment`, `POST :id/invoice`,
  `GET :id/files/:kind` ya existentes en `odc.controller.ts`.
- No se agregaron rutas nuevas ni se editó `frontend/src/routeTree.gen.ts`
  manualmente.
- `./init.sh` completo ejecutado tras la recomposición: build, tests
  (backend 436/436, frontend 161/161) y lint en verde.
