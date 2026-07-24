---
feature: "frontend-payment-invoice"
status: draft        # draft | approved
tags: [frontend, director-ops, odc, spec]
---

# Diseño — [[frontend-payment-invoice]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas generales del proyecto.

## Decisiones técnicas

- **Dos componentes de formulario separados, siguiendo el patrón
  `PaymentEvidenceForm`**: crear `RegisterPaymentForm` y `UploadInvoiceForm`
  como componentes independientes que retornan `null` cuando
  `role`/`odc.status` no coinciden con su combinación válida, igual que
  `PaymentEvidenceForm` y `GeneralApprovalActions` ya hacen. No se crea un
  componente genérico parametrizable por transición porque cada formulario
  tiene campos, validación y endpoint distintos (R1, R5, R12).
- **Composición en la ruta de detalle existente**: añadir ambos formularios a
  `frontend/src/routes/_authenticated/odcs/$id.tsx`, junto a
  `AdminBudgetActions`, `GeneralApprovalActions` y `PaymentEvidenceForm` ya
  compuestos ahí. No se crea una ruta nueva (R1, R5, R12).
- **Cliente API tipado**: añadir `registerPayment` (JSON, reutiliza
  `jsonRequest` como `approveBudget`/`rejectOdc`) y `uploadInvoice`
  (`FormData`, mismo patrón que `uploadPaymentEvidence`, sin fijar
  `Content-Type`) a `src/lib/api.ts` (R3, R7).
- **Recorte y omisión de opcionales igual que en `uploadPaymentEvidence`**:
  `paymentReference`, `paymentNotes`, `invoiceNumber`, `invoiceDate` y
  `observations` se recortan y solo se incluyen en la petición si el
  resultado no es una cadena vacía; los campos de fecha obligatorios
  (`paymentDate`, `warehouseEntryDate`) siempre viajan tal como los produce
  el input `type="date"` (formato `YYYY-MM-DD`, compatible con
  `@IsDateString` en el backend) (R3, R7).
- **Validación local mínima y alineada al backend**: fecha y método
  obligatorios para el pago; archivo (allowlist PDF/JPEG/PNG, máximo 10 MB,
  mismas constantes que `PaymentEvidenceForm`) y fecha de entrada a almacén
  obligatorios para la factura. La UI evita viajes inútiles, pero el backend
  conserva la autoridad; sus errores se presentan vía `ApiError` (R2, R4, R6,
  R8).
- **Sin optimistic update**: ambos formularios actualizan el detalle
  únicamente con la ODC devuelta por el servidor, igual que el resto de
  mutaciones ya implementadas. Un 403/409/error de red deja el estado
  original visible y permite reintentar (R3, R4, R7, R8).
- **Descarga de archivos como enlaces `<a>` planos, no como llamada de
  `fetch`**: `GET /api/odcs/:id/files/:kind` responde HTTP 302 hacia una URL
  firmada de Cloudinary; un enlace `<a href="/api/odcs/:id/files/evidence"
  target="_blank" rel="noopener noreferrer">` deja que el navegador siga la
  redirección directamente (con las cookies de sesión de la navegación normal
  del navegador), sin pasar por `apiFetch` ni intentar interpretar el 302
  como JSON. Se añade un helper puro `odcFileUrl(id, kind)` en `src/lib/odc.ts`
  para construir la ruta y poder testear el `href` sin mockear `fetch` (R10).
- **Bloque `Información de factura` como hermano del bloque `Información de
  pago` ya existente**: extender `OdcDetail` con un bloque condicional
  análogo (mismo componente `DetailItem`, mismo criterio de "Pendiente" para
  fechas ausentes) que se muestra cuando existe al menos un dato de factura,
  igual que el bloque de pago ya se muestra cuando existe al menos un dato de
  pago. Se reutiliza el patrón, no se generaliza en un componente
  parametrizado por sección para no introducir abstracción prematura (R9).
- **Insignia `COMPLETADA` sin cambios**: `OdcStatusBadge` ya declara estilo y
  etiqueta (`'Completada'`) para `COMPLETADA` y `OdcDetail` ya la renderiza
  para cualquier estado; no se requiere ningún cambio de código para R9 más
  allá de que ambos formularios retornen `null` en ese estado (verificado con
  un test de regresión, no con implementación nueva).
- **shadcn/ui existente**: reutilizar `Card`, `Input`, `Label`, `Textarea`,
  `Button` ya instalados; no se requieren componentes nuevos de shadcn (R1,
  R5, R11).
- **Tests aislados**: Vitest + Testing Library con funciones API mockeadas;
  los tests del cliente mockean `fetch` y examinan JSON/`FormData`. No se
  requiere backend, PostgreSQL ni Cloudinary reales (R1–R12).

## Archivos afectados

- `frontend/src/lib/api.ts` — funciones tipadas `registerPayment` y
  `uploadInvoice`.
- `frontend/src/lib/odc-api.test.ts` — contratos HTTP JSON y multipart de
  ambas funciones.
- `frontend/src/lib/odc.ts` — helper `odcFileUrl(id, kind)` para construir
  las rutas de descarga.
- `frontend/src/routes/_authenticated/odcs/$id.tsx` — composición de
  `RegisterPaymentForm` y `UploadInvoiceForm`.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` — regresión de
  la composición existente si aplica.
- `frontend/src/components/odc/register-payment-form.tsx` (nuevo) —
  formulario y validación de R1–R4.
- `frontend/src/components/odc/upload-invoice-form.tsx` (nuevo) — formulario
  y validación de R5–R8.
- `frontend/src/components/odc/odc-detail.tsx` — bloque `Información de
  factura` (R9) y enlaces de descarga de comprobante/factura (R10).
- Tests `*.test.tsx` junto a los dos componentes nuevos y `odc-detail.test.tsx`,
  nombrados con R1–R12.

No se crea ninguna ruta nueva ni se edita manualmente
`frontend/src/routeTree.gen.ts`.

## Alternativas descartadas

- **Un único formulario `PaymentAndInvoiceForm` con pasos**: se descarta
  porque las dos transiciones (T7, T9) tienen estados de origen, roles y
  endpoints distintos, y nunca están disponibles simultáneamente para la
  misma ODC — dos componentes independientes reflejan mejor esa exclusión
  mutua, igual que ya se hizo con `AdminBudgetActions`/`PaymentEvidenceForm`.
- **Descargar el archivo vía `fetch` y crear una URL de blob en el cliente**:
  se descarta; el endpoint ya responde con una redirección HTTP 302 pensada
  para navegación directa del navegador, y usar `fetch` obligaría a manejar
  manualmente la redirección y el `Content-Disposition`.
- **`<select>` de métodos de pago predefinidos**: se descarta; el dominio y
  el DTO del backend (`RegisterPaymentDto.paymentMethod`) no restringen
  valores y el brief no define un catálogo cerrado.
- **Añadir una quinta cola `Completadas` al dashboard de `DIRECTOR_OPS`**: se
  descarta; el brief de esta feature (F13) no la pide y el dashboard actual
  ya cubre el seguimiento de las cuatro colas activas del flujo.
- **Fijar `Content-Type: multipart/form-data` manualmente en `uploadInvoice`**:
  se descarta por la misma razón que en `uploadPaymentEvidence` — omitiría
  el boundary que `fetch` genera al recibir `FormData`.
- **Generalizar el bloque de "Información de pago"/"Información de factura"
  en un componente único parametrizado por lista de campos**: se descarta por
  ahora; solo hay dos instancias y la abstracción no reduce duplicación
  significativa todavía.
