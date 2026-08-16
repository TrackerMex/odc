# Verificación visual — ui-surfaces-detail-forms

Fecha: 2026-08-11
Fixture: seed local, `DIRECTOR_OPS`, Chromium headless contra el stack Docker.

## Light

Se verificó el detalle completado en 768, 1024 y 1440 px:

| Ancho | Overflow horizontal | Grid principal | Grid de definiciones |
|---|---:|---|---|
| 768 | no (`scrollWidth=768`) | apilado | 2 columnas de 203 px |
| 1024 | no (`scrollWidth=1024`) | apilado | 2 columnas de 323 px |
| 1440 | no (`scrollWidth=1440`) | 748 px + 352 px | 2 columnas de 345 px |

- Las filas medidas tienen fondo transparente y radio `0px`.
- El total mide `20px`, tiene borde superior de `2px` y ocupa la fila completa.
- El fixture mostró siete puntos del timeline: anteriores huecos y último relleno.
- A 1024 px, el formulario no desborda, `FieldGroup` mide `gap: 16px`,
  comentarios inicia cerrado y el footer es horizontal desde `sm`.

## Dark

Se verificó en 1440 px la ODC `EVIDENCIA_PAGO_SUBIDA`:

- tema dark activo;
- sin overflow horizontal;
- `UploadInvoiceForm` está dentro de la columna principal y antes del sidebar;
- footer horizontal;
- sidebar sticky de 352 px (`22rem`).

No existe una ODC `RECHAZADA` en el fixture vivo actual, por lo que el banner
destructivo no pudo fotografiarse con datos reales. Su estructura y tokens se
cubren en `odc-detail.test.tsx`; el contraste exacto de texto/superficie se
calcula para light y dark en `styles.tokens.test.ts` y supera 4.5:1.

## Alcance

La evidencia exhaustiva a 375 px permanece reservada para la feature 28, como
indican R14 y la spec aprobada.
