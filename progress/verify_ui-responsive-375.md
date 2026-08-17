# Verificación en navegador — ui-responsive-375

> Acta de la feature 28 (`specs/ui-responsive-375`). Es el entregable principal:
> R1, R3, R7 y R8 solo se pueden observar en un navegador real. Las medidas de
> este documento se tomaron con el instrumento declarado en la sección 0 y
> ninguna observación es válida sin esa cabecera.

## 0. Gate de medición

Instrumento: **Playwright (chromium) con `page.setViewportSize({ width: 375, height: 667 })`**,
ejecutado desde `frontend/e2e/responsive-375.spec.ts` contra el stack completo de
`docker-compose` (frontend `:3000`, backend `:3001`, Postgres `:5432`).
`resize_window` queda descartado como método único (R1): es el instrumento que
falló en silencio el 2026-08-10.

Fecha de la sesión: 2026-08-17.

| # | Lectura | Valor medido | Exigido por R1 |
|---|---|---|---|
| 1 | `window.innerWidth` | `375` | `375` exacto — cumple |
| 2 | `document.documentElement.clientWidth` | `375` | solo registrar — registrado |
| 3 | `window.devicePixelRatio` | `1` | solo registrar — registrado |
| 4 | `window.matchMedia('(min-width: 40rem)').matches` | `false` | `false` — cumple |
| 5 | `window.matchMedia('(min-width: 48rem)').matches` | `false` | `false` — cumple |

Salida literal de la sesión:

```
R1 gate: {"innerWidth":375,"clientWidth":375,"devicePixelRatio":1,"sm":false,"md":false}
```

`devicePixelRatio` es `1` porque chromium headless no emula la densidad de un
teléfono. R1 solo exige registrarlo: el layout de Tailwind se decide en píxeles
CSS, que son los que leen las lecturas 1, 2, 4 y 5. Las lecturas 4 y 5 son el
gate real y ambas están apagadas, así que a 375px la app aplica únicamente las
clases base, sin prefijo `sm:` ni `md:`.

### Datos de la sesión

Las seis rutas se recorrieron con las tres sesiones sembradas
(`ops@odc.local` DIRECTOR_OPS, `admin@odc.local` ADMINISTRACION,
`dg@odc.local` DIRECTOR_GENERAL). Para poder observar los cinco bloques de
acción de `/odcs/$id` en su propio estado, la sesión sembró en la base de
desarrollo las órdenes `ODC-2026-00011` (PRESUPUESTO_APROBADO),
`ODC-2026-00012` (COMPRA_APROBADA), `ODC-2026-00013` (BORRADOR) y
`ODC-2026-00014`–`ODC-2026-00018` (PAGO_REGISTRADO con fecha de pago en
2026-07, necesarias para que el resumen mensual pase de 10 compras y renderice
la paginación que mide R8).

## 1. /login

**Superficies observadas:** `LoginForm`, dentro del contenedor `p-6 md:p-10` +
`max-w-sm` de `routes/login.tsx`.

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Elemento | Medida a 375px | Observación |
|---|---|---|
| Tarjeta del formulario | 327 × 310.5px | `max-w-sm` (384px) no llega a aplicarse: manda el `p-6` del contenedor. Cabe con 24px de margen a cada lado |
| `form[data-testid="login-form"]` | 293px de ancho | dentro de la tarjeta, sin desbordar |
| Campo de correo | 293 × 32px | ancho completo de la columna |
| Botón `Ingresar` | 293 × 32px | alcanzable, ancho completo |

Veredicto: **correcto a 375px**. Sin corrección (R6).

## 2. / (portada ejecutiva)

**Superficies observadas:** `AppLayout`, `AppSidebar`, `SidebarTrigger` y
`ExecutiveDashboard` (con `OdcStatusBadge`), con sesión DIRECTOR_OPS y
ADMINISTRACION.

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Elemento | Medida a 375px | Observación |
|---|---|---|
| `header` de `AppLayout` | 375 × 48px | ocupa el ancho exacto del viewport |
| `SidebarTrigger` | 28 × 28px | ver sección 7 (área táctil) |
| `AppSidebar` fuera de pantalla | no está en el DOM con la hoja cerrada | `useIsMobile` (768px) lo pasa a `Sheet`; el riel fijo no se monta |
| `AppSidebar` como `Sheet` abierto | 281.25px de ancho, `left` 0 | los 3 enlaces de navegación miden 264 × 32px cada uno |
| Tarjetas del dashboard | 343px (`left` 16, `right` 359) | una columna, sin desbordar |
| Cabecera de columnas `hidden … lg:grid` | `display: none` | oculta bajo `lg`, como prescribe el patrón conservado (R5) |
| `OdcStatusBadge` | 135.28 × 20px, texto `Pendiente de factura` | cabe en una línea |
| Enlace de folio de la cola | 309 × 68px | zona de toque amplia por altura de tarjeta |
| `h1` de bienvenida | 343px, `Buen día, Director de Operaciones` | envuelve sin desbordar |

Veredicto: **correcto a 375px**. Sin corrección (R6).

## 3. /tasks

**Superficies observadas:** `ExecutiveTasks`.

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Elemento | Medida a 375px | Observación |
|---|---|---|
| `main` | 375px | ancho exacto del viewport |
| Tarjeta de la lista | 343px (`left` 16, `right` 359) | una sola columna |
| Encabezado | `Todas las tareas` | sin truncar |

Veredicto: **correcto a 375px**. Sin corrección (R6).

## 4. /odcs/new

**Superficies observadas:** `OdcForm` (sesión DIRECTOR_OPS) y `RolePlaceholder`
(sesión ADMINISTRACION, que no puede crear órdenes).

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Elemento | Medida a 375px | Observación |
|---|---|---|
| `form` | 343px | dentro del `min-w-0` de la ruta |
| Rejilla `sm:grid-cols-2` | `grid-template-columns: 309px` | colapsa a una columna, patrón conservado (R5) |
| Fila de acciones `flex-col … sm:flex-row` | `flex-direction: column`, 341px | apilada, patrón conservado (R5) |
| Campo `description` | 309 × 64px | |
| Campos `quantity` / `unit` | 309 × 32px | |
| `RolePlaceholder` | texto `Panel en preparación` | centrado, sin desbordar |

Veredicto: **correcto a 375px**. Sin corrección (R6).

## 5. /odcs/$id

**Superficies observadas:** `OdcDetail`, `OdcDocumentPreview`,
`AdminBudgetActions`, `GeneralApprovalActions`, `RegisterPaymentForm`,
`PaymentEvidenceForm`, `UploadInvoiceForm` y `OdcForm` (edición del creador),
más los estados transitorios `OdcPagePending` y `OdcPageError`.

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Estado / sesión | Bloque expuesto | Medida a 375px |
|---|---|---|
| `PENDIENTE_ADMIN` · ADMINISTRACION | `AdminBudgetActions` | fila `flex-direction: column`, 309px; botones `Aprobar presupuesto` y `Rechazar` a 309 × 32px |
| `PRESUPUESTO_APROBADO` · DIRECTOR_GENERAL | `GeneralApprovalActions` | fila `flex-direction: column` (clase viva `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`); botones `Aprobar compra` y `Rechazar` a 309 × 32px |
| `COMPRA_APROBADA` · DIRECTOR_OPS | `RegisterPaymentForm` | fila `flex-direction: column`; formulario de registro de pago visible |
| `EVIDENCIA_PAGO_SUBIDA` · DIRECTOR_OPS | `UploadInvoiceForm` | formulario de factura visible junto al comprobante ya cargado |
| `PAGO_REGISTRADO` · ADMINISTRACION | `PaymentEvidenceForm` | fila `flex-direction: column`; `input[type=file]` a 309 × 32px |
| `BORRADOR` · DIRECTOR_OPS (creador) | `OdcForm` en modo edición | sección `Editar y reenviar` montada bajo el detalle |
| `COMPLETADA` · DIRECTOR_OPS | `OdcDetail` + `OdcDocumentPreview` | botones `Ver comprobante de pago` (220 × 28px) y `Ver factura` (120 × 28px); diálogo abierto a 343px (`left` 16, `right` 359), dentro del `max-w-[calc(100%-2rem)]` de la primitiva |
| id inexistente · DIRECTOR_OPS | `OdcPageError` | `No pudimos cargar esta información`, centrado, sin desbordar |
| navegación con el loader retenido | `OdcPagePending` | `main[aria-busy="true"]` a 375px con el indicador `Cargando información…` |

`OdcDetail` — filas de definición (13 filas medidas en la orden COMPLETADA,
que expone además los bloques de pago y factura):

- `grid-template-columns` computado: `118.797px 178.203px` sobre una fila de
  309px.
- Desbordamiento horizontal máximo medido en las 13 filas: `dt` 0px, `dd` 0px.
- Etiqueta más alta: `Fecha de entrada a almacén`, 118.8px de ancho en 3
  líneas. Le siguen `Última actualización`, `Referencia de pago`,
  `Número de factura` y `Fecha de factura`, todas en 2 líneas.
- Ningún valor (`dd`, `break-words text-right`) pasa de 1 línea ni se parte de
  forma ilegible.

**R7-2** — `odc-detail.tsx:40`, `grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]` sin
prefijo responsive. A 375px la fila mide 309px y las dos columnas se resuelven
en `118.797px` (etiqueta) y `178.203px` (valor). El `minmax(0,…)` cumple su
función: el desbordamiento horizontal medido es de `0px` tanto en las 13 `dt`
como en las 13 `dd`. La etiqueta más larga, `Fecha de entrada a almacén`, ocupa
3 líneas de `118.8px`; otras cuatro ocupan 2. Envuelve, no se trunca, y el par
etiqueta/valor sigue siendo legible porque el valor conserva su línea única.
Veredicto: **correcto a 375px**, sin corrección.

Veredicto de la ruta: **correcto a 375px**. Sin corrección (R6).

## 6. /monthly-summary

**Superficies observadas:** `MonthlySummary` y `MonthlySummarySlide` (render de
PDF fuera de pantalla), sobre el corte `2026-07`, que es el que tiene compras
pagadas (12).

- Anchos medidos: `document.documentElement.scrollWidth` = 375 · `document.documentElement.clientWidth` = 375 → sin scroll horizontal de página (R3).

| Elemento | Medida a 375px | Observación |
|---|---|---|
| Tarjeta de indicadores | 341px (`left` 17, `right` 358) | |
| `grid-cols-3` de métricas | `92.3281px 92.3281px 92.3438px` | veredicto de R7 al cierre de esta sección |
| Total del mes | 309 × 36px, `$1,425,400.00` | una línea, `tabular-nums` |
| Wrapper de la tabla | `clientWidth` 309, `scrollWidth` 1244, `overflow-x: auto` | desbordamiento **interno**, prescrito por MASTER §6 y §8: no es defecto (R3) |
| Enlace de folio (`ODC-2026-00014`) | 120.86 × 17px | ver sección 7 |
| Control de paginación `Siguiente` | 36 × 32px | su etiqueta de texto está en `display: none` bajo `sm`, patrón conservado (R5) |
| Enlace de página `1` | 32 × 32px | ver sección 7 |
| `MonthlySummarySlide` | 1120px de ancho, `left` -1200, `right` -80 | íntegramente fuera del lienzo, dentro del contenedor `fixed` con `aria-hidden="true"` |

**R7-1** — `monthly-summary.tsx:287`, `grid-cols-3` sin prefijo responsive. A
375px la tarjeta ofrece 277px de contenido y las tres columnas se resuelven en
`92.3281px`, `92.3281px` y `92.3438px`. Con los datos del corte 2026-07 los tres
importes caben sin partirse: `Compras registradas` = `12`, `Ticket promedio` =
`$118,783.33` e `Ingreso a almacén` = `5 días`, los tres en **una sola línea** y
con desbordamiento horizontal medido de `0px` (`scrollWidth` 92 = `clientWidth`
92 en los tres valores). Las etiquetas sí envuelven a 2 líneas
(`Compras registradas`, `Ingreso a almacén`), lo que es envolver, no truncar.
Veredicto: **correcto a 375px**, sin corrección.

> Margen medido, para que quede con número y no como impresión: `$118,783.33`
> son 11 caracteres y encajan justos. Sustituyendo el nodo por importes más
> largos con el mismo estilo, el valor deja de caber en su columna y la pisa:
> `$1,425,400.00` desborda `10px`, `$12,345,678.90` `19px` y `$999,999,999.99`
> `28px`, siempre en una línea porque un importe no tiene puntos de corte. Es
> decir: la tarjeta aguanta hasta importes de seis cifras y se rompe a partir de
> siete. Con los datos observados **no hay defecto** y R6 prohíbe cambiar una
> clase de una superficie sin defecto observado, así que aquí no se corrige
> nada; queda anotado como deuda con nombre y medida para decisión humana, igual
> que los 44px de la sección 7.

**R7-3** — `monthly-summary-slide.tsx:12`, `w-[1120px]` dentro del contenedor
`fixed top-0 left-[-1200px]` con `aria-hidden="true"` de `monthly-summary.tsx`.
Medido a 375px: el `section` del slide ocupa `1120px` con `left` = `-1200px` y
`right` = `-80px`, es decir íntegramente a la izquierda del lienzo. Contraste
directo contra la medición de R3: `document.documentElement.scrollWidth` = 375
con el nodo en el DOM y 375 tras retirarlo del árbol en la misma sesión, o sea
una contribución de **0 px** al `scrollWidth` de la página.
Veredicto: **correcto a 375px**, sin corrección; la excepción de R4 sigue
justificada.

Veredicto de la ruta: **correcto a 375px**. Sin corrección (R6).

## 7. Área táctil

Rectángulos reales (`getBoundingClientRect`) medidos a 375px bajo el gate de la
sección 0, contrastados con el mínimo de **44 × 44px** que exige
`design-system/odc/MASTER.md` §6 para móvil.

| Control | Dónde | Rectángulo medido | Contra 44 × 44px |
|---|---|---|---|
| `SidebarTrigger` (`size="icon-sm"`) | `app-layout.tsx`, cabecera de `/` | 28 × 28px | **-16px de ancho y -16px de alto** |
| Botón de acción por defecto (`Aprobar presupuesto`) | `admin-budget-actions.tsx` en `PENDIENTE_ADMIN` | 309 × 32px | ancho de sobra; **-12px de alto** |
| Enlace de folio de la tabla (`ODC-2026-00014`) | `monthly-summary.tsx`, tabla de compras | 120.86 × 17px | ancho de sobra; **-27px de alto** |
| Control de paginación (`Siguiente`) | `components/ui/pagination.tsx` | 36 × 32px | **-8px de ancho y -12px de alto** |
| Enlace de página (`1`) | `components/ui/pagination.tsx` | 32 × 32px | **-12px de ancho y -12px de alto** |

Ninguno de los cinco alcanza el mínimo de 44px de alto. Es un choque real y ya
conocido entre MASTER §6 y el dial de densidad 8/10 que materializó la feature
23 (`h-8` = 32px, `icon-sm` = 28px), fijado por
`components/ui/primitives.tokens.test.tsx:37`, `:68` y `:93`.

**Queda anotado como deuda con nombre y medida**, no se corrige aquí: R8 y la
sección "Fuera de alcance" de la spec lo excluyen expresamente, porque subir la
altura de los controles es rediseño (contradice el dial de densidad o introduce
un escalón de altura solo para móvil) y esa es una decisión humana, no una
verificación. El leader la lleva a decisión como feature aparte.

Atenuante medido, no excusa: el enlace de folio de la portada mide 309 × 68px
porque toda la tarjeta de la cola es el área de toque, así que el patrón de
"fila entera pulsable" ya resuelve el caso donde más se usa. Los que quedan
cortos son los controles densos: el disparador del sidebar y la paginación.

## 8. Veredicto humano

**APROBADO** — 2026-08-17.

Aprobación verbal del humano en la sesión de Claude Code, transcrita aquí por el
leader. Se declara explícitamente que **no la tecleó el humano en este archivo**:
la cita literal es «sí, así está bien», dada tras el reporte del resultado de la
auditoría y de las dos deudas de abajo. Mismo procedimiento que en la feature 14
(aprobación real en chat + commit dedicado), no una casilla auto-marcada.

Alcance de lo aprobado:

- El resultado de la auditoría: a 375px no se rompe nada en las seis rutas vivas
  (`scrollWidth == clientWidth == 375`), y por tanto cero cambios en
  `frontend/src/components/`.
- Las dos deudas medidas quedan **sin corregir**, con dueño declarado:
  1. Área táctil por debajo de 44 × 44px (R8, previsto por la spec): corregirla
     contradice el dial de densidad fijado en la feature 23.
  2. `grid-cols-3` del resumen mensual (no previsto): desborda 10-28px a partir
     de importes de siete cifras. Sin defecto con los datos reales, y R6 prohibía
     tocarlo en esta feature.
