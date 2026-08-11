---
feature: "ui-surfaces-detail-forms"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, detail, forms, accessibility]
---

# Diseño — [[ui-surfaces-detail-forms]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas del proyecto.

## Decisiones técnicas

- **Composición de detalle** (R1–R4): `OdcDetail` seguirá siendo la superficie
  dueña del grid principal y expondrá un área de acciones dentro de su primera
  columna. La ruta `$id` seguirá decidiendo qué componentes componer y cada
  componente conservará su gate interno; no se moverá lógica de negocio a la
  vista. El historial seguirá en el sidebar `22rem` sticky.
- **Definiciones, no tarjetas internas** (R1–R3): los pares se mantienen en un
  `dl`, pero cada par será una fila `dt`/`dd`. Pago, factura, comentarios,
  rechazo y preview usarán divisores y radios semánticos, no una colección de
  cajas `rounded-2xl`. El timeline reutilizará la misma tabla estado→token que
  ya gobierna `OdcStatusBadge`, sin colores Tailwind crudos.
- **Acciones semánticas** (R4,R5): las barras se implementarán con el footer de
  Card y las variantes locales existentes. Rechazo conserva los dos diálogos
  actuales. Completar se confirma dentro de `UploadInvoiceForm`, porque ese
  submit es el que transiciona a `COMPLETADA`; aprobar, registrar pago y subir
  evidencia no reciben diálogos que el override no exige.
- **Validación pequeña por campo** (R6–R12): se mantendrá estado local simple.
  `OdcForm` y `LoginForm` reutilizan sus schemas; los tres formularios
  operativos reutilizan sus reglas actuales. Los controles de texto/fecha
  requeridos validan al blur, los archivos en change y el selector requerido
  al perder interacción. Los errores de API continúan a nivel formulario.
- **Contrato mínimo de DatePicker** (R6,R9,R11): la primitiva adaptada añadirá
  passthrough de blur, estado/descripcion ARIA y una referencia o mecanismo de
  foco hacia el input. No cambia calendario, parsing, valor ni diálogo.
- **Divulgación progresiva** (R8): solo `Comentarios` de `OdcForm` entra en el
  `Collapsible` existente. Los opcionales operativos no se colapsan porque el
  override identifica expresamente el único opcional del formulario base.
- **Deuda de primitivas** (R13): `toast.tsx` no recibe una clase de radio de
  Base UI que compita con la local; `rounded-2xl!` ya no es necesario después
  de los tokens de la feature 23. Se sustituye por `rounded-card` y se prueba.
  `CardHeader` no se modifica: sus usos activos con `border-b` no intentan
  aplicar otro `pb-*`; los tres casos que originaron `pb-3!` fueron eliminados
  por la feature 30.
- **Autoridad local** (R1–R14): se reutilizan las primitivas adaptadas sobre
  `@base-ui/react`. Las pautas de accesibilidad de `ui-styling` respaldan labels,
  asociación, anuncio, foco y mobile-first, pero `MASTER.md` y sus overrides
  prevalecen. No se ejecutará shadcn ni se añadirá una dependencia.

## Inventario de validación

| Superficie | Validación de cliente de esta feature | Momento | Primer foco en submit |
|---|---|---|---|
| `OdcForm` | descripción, cantidad, unidad, precio, proveedor | blur; cierre/blur del select | ese mismo orden |
| `RegisterPaymentForm` | fecha de pago, método de pago | blur | fecha, método |
| `PaymentEvidenceForm` | archivo requerido, MIME, 10 MB | change | archivo |
| `UploadInvoiceForm` | archivo requerido/MIME/10 MB, fecha de almacén requerida | change; blur | archivo, fecha de almacén |
| `LoginForm` | email y password según `loginSchema` | blur | email, password |

`Comentarios`, referencia/notas de pago, referencia de evidencia, número/fecha
de factura y observaciones siguen opcionales. Los motivos de rechazo conservan
su validación dentro de los diálogos existentes; no forman parte de los cinco
formularios del override `odc-form.md`.

## Archivos afectados

### Aplicación y componentes

- `frontend/src/routes/_authenticated/odcs/$id.tsx` — compone acciones y
  formularios dentro del área al pie de la columna principal; conserva API y
  gates.
- `frontend/src/components/odc/odc-detail.tsx` — filas de definición, secciones,
  comentarios condicionales, total, timeline, banner, sidebar y área de
  acciones (R1–R4).
- `frontend/src/components/odc/odc-document-preview.tsx` — radio semántico sin
  alterar carga, diálogo, retry ni fallback (R3,R14).
- `frontend/src/components/odc/admin-budget-actions.tsx` — footer y variantes;
  conserva diálogo de rechazo y muestra su error de API dentro del diálogo
  activo (R4,R5).
- `frontend/src/components/odc/general-approval-actions.tsx` — footer,
  variantes y responsive en riesgo; conserva diálogo y error recuperable
  visible dentro de él (R4,R5).
- `frontend/src/components/odc/odc-form.tsx` — blur/foco/asociación,
  `Collapsible`, densidad, resumen y footer (R6–R8).
- `frontend/src/components/odc/register-payment-form.tsx` — errores por campo,
  blur/foco, footer confirm y loading (R6,R9).
- `frontend/src/components/odc/payment-evidence-form.tsx` — validación de
  archivo en change, asociación/foco y footer (R6,R10).
- `frontend/src/components/odc/upload-invoice-form.tsx` — validación por campo,
  foco, footer, confirmación de completar y error recuperable dentro del
  diálogo activo (R5,R6,R11).
- `frontend/src/components/login-form.tsx` — blur/foco, asociación y loading;
  conserva el copy para #29 (R6,R12).

### Primitivas locales

- `frontend/src/components/ui/date-picker.tsx` — passthrough mínimo para blur,
  ARIA y foco del input (R6,R9,R11).
- `frontend/src/components/ui/field.tsx` — densidad `gap-4`; `FieldError` ya
  emite `role="alert"` y no necesita otra primitiva (R6,R8).
- `frontend/src/components/ui/toast.tsx` — `rounded-card` sin `!` (R13).

`frontend/src/components/ui/card.tsx`, `collapsible.tsx` y `dialog.tsx` se
reutilizan sin cambios. En particular, `CardHeader` queda fuera por la revisión
de especificidad descrita en R13.

## Tests afectados o en riesgo

- `frontend/src/components/odc/odc-detail.test.tsx` — semántica de filas,
  comentarios condicionales, tokens del timeline, última entrada, contraste
  del banner, sidebar, previews y `flex-wrap`.
- `frontend/src/components/odc/admin-budget-actions.test.tsx` — variantes,
  footer, confirmación, loading y retry.
- `frontend/src/components/odc/general-approval-actions.test.tsx` — variantes,
  diálogo y la aserción existente `flex-col.*sm:flex-row`, que se conserva.
- `frontend/src/components/odc/odc-form.test.tsx` — blur/foco, asociación,
  Collapsible, total, footer y momento de aparición de errores.
- `frontend/src/components/odc/register-payment-form.test.tsx` — blur/foco,
  campos opcionales, loading, payload y retry.
- `frontend/src/components/odc/payment-evidence-form.test.tsx` — validación en
  change, foco, asociación, payload y retry.
- `frontend/src/components/odc/upload-invoice-form.test.tsx` — validación en
  change/blur, foco, diálogo de completar, payload, loading y retry.
- `frontend/src/components/login-form.test.tsx` — blur/foco, asociación,
  loading, 401 y copy preservado.
- `frontend/src/components/ui/date-picker.test.tsx` — nuevo passthrough de
  blur/ARIA/foco sin regresión de calendario.
- `frontend/src/components/ui/toast.test.tsx` — radio `rounded-card` sin `!`.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` y
  `frontend/src/components/odc/production-reachability.test.ts` — gates,
  composición y alcanzabilidad preservados.
- `frontend/src/components/ui/primitives.tokens.test.tsx` y
  `frontend/src/design-system.guardrails.test.ts` — tokens, foco, movimiento,
  dependencias y aserciones responsive existentes permanecen verdes.

## Verificación visual posterior

Testing Library cubrirá estructura, clases normativas, ARIA, foco, contratos y
transiciones. Implementer y reviewer deberán verificar en navegador light/dark
la jerarquía del total, ausencia de cajas anidadas, punto reciente/huecos del
timeline, banner destructivo y barras al pie a 768/1024/1440. Una comprobación
breve de que la composición base no desborda es parte de R14; la auditoría
exhaustiva y evidencia a 375px sigue reservada para la feature 28.

## Alternativas descartadas

- **Cambiar `CardHeader` preventivamente**: no hay un consumidor activo que
  pierda un override de padding; sería trabajo sin defecto observable.
- **Mantener `rounded-2xl!` en Toast**: conserva un radio ajeno al sistema y
  una prioridad sin competidor real.
- **Un framework de formularios o dependencia nueva**: los cinco formularios
  son pequeños y ya tienen schemas/estado local; no justifica migración.
- **Validar opcionales o todos los campos al teclear**: contradice blur,
  inventa reglas y produce ruido prematuro.
- **Diálogo para toda transición**: el override enumera rechazo y completar;
  ampliar confirmaciones cambia UX sin necesidad.
- **Cerrar responsive 375 aquí**: duplicaría la feature 28 y mezclaría
  implementación con la auditoría pendiente.
