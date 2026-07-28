# impl: typeset-odc-components
Fecha: 2026-07-27

## Alcance
Pulido tipográfico (cifras, etiquetas, tablas) en `frontend/src/components/odc` —
sin cambio de comportamiento, props ni datos. Ejecutado vía skill `impeccable`
(`typeset`), con setup de `context.mjs` y lectura de `reference/typeset.md` y
`reference/craft-floor.md`. Escaneo mecánico (`detect.mjs --scope type`) no
arrojó hallazgos antes ni después de los cambios.

## Archivos modificados
- `frontend/src/components/odc/odc-detail.tsx` — `DetailItem` ahora acepta
  `numeric` (aplica `tabular-nums`) y `emphasis` (aplica `text-lg font-semibold`).
  Se usa `numeric` en Cantidad, Precio unitario y Total; `emphasis` solo en
  Total, que es la cifra más importante de la orden y antes tenía el mismo
  peso visual que campos de texto libre (Descripción, Proveedor). Las
  etiquetas (`dt` de `DetailItem` y los headers "Comentarios" / "Información
  de pago" / "Información de factura") pasan de `font-medium tracking-[0.1em]`
  a `font-semibold tracking-[0.12em]`, alineándose con el token Label de
  `DESIGN.md` (600, 0.12em) y con el resto del directorio.
- `frontend/src/components/odc/executive-dashboard.tsx` — la mini-etiqueta
  "Siguiente acción" pasa de `font-medium tracking-wide` (0.025em) a
  `font-semibold tracking-[0.12em]`, igual que el resto de labels de la app.
- `frontend/src/components/odc/executive-tasks.tsx` — mismo fix que arriba
  (componente `TaskAction`, duplicado de `PriorityAction`).
- `frontend/src/components/odc/monthly-summary.tsx` — se agrega `tabular-nums`
  al total destacado (`CardTitle` de 4xl/5xl) y a las tres métricas
  secundarias (compras registradas, ticket promedio, ingreso a almacén), que
  antes no alineaban dígitos pese a ser cifras comparables. Los encabezados de
  la tabla "Detalle del periodo" pasan de texto plano heredado
  (`font-medium`/`text-sm` por defecto de `TableHead`) a un tratamiento de
  label explícito (`text-xs font-semibold tracking-[0.12em] uppercase
  text-muted-foreground`), separando visualmente el rol de encabezado del de
  dato — antes solo el peso los distinguía.
- `frontend/src/components/odc/monthly-summary-slide.tsx` — mismo fix de
  `tabular-nums` en el total, compras registradas, ticket promedio y la
  columna Total de la tabla exportada (PNG/PDF para Dirección General, donde
  la alineación de cifras importa más que en pantalla). El `thead` de la
  tabla exportada pasa de `text-slate-600` sin peso explícito y
  `tracking-[0.08em]` a `font-semibold` y `tracking-[0.12em]`, coherente con
  el resto de la jerarquía de labels usada en el mismo archivo y en
  `monthly-summary.tsx`.

No se tocó `frontend/src/components/ui/table.tsx` ni `badge.tsx` (primitivas
shadcn compartidas fuera del alcance de `odc/`); tampoco los formularios
(`odc-form.tsx`, `payment-evidence-form.tsx`, `register-payment-form.tsx`,
`upload-invoice-form.tsx`, `admin-budget-actions.tsx`,
`general-approval-actions.tsx`, `odc-page-state.tsx`) ni `odc-dashboard.tsx`,
`admin-dashboard.tsx`, `general-dashboard.tsx`, `odc-status-badge.tsx`: ya
seguían el token de jerarquía correcto (label `font-semibold
tracking-[0.12em] uppercase`, cifras con `tabular-nums`) y no presentaban
inconsistencias.

## Decisiones de diseño
- **Total como cifra jerárquicamente superior en `OdcDetail`**: antes
  "Total" y "Descripción" compartían el mismo `font-medium` sin distinción,
  violando la "Number-First Rule" de `DESIGN.md` (importes con peso
  medio/semibold reforzado). Se optó por reforzar tipografía dentro de la
  misma grilla (`emphasis` → `text-lg font-semibold`) en vez de rediseñar el
  layout (sacarlo a una tarjeta aparte como en `odc-form.tsx`), respetando el
  alcance de refinamiento, no rediseño.
- **Unificar tracking de labels a 0.12em / font-semibold**: era el patrón
  dominante en el directorio (`odc-dashboard.tsx`, `admin-dashboard.tsx`,
  `general-dashboard.tsx`) y coincide literalmente con el token `label` de
  `DESIGN.md` (`fontWeight: 600`, `letterSpacing: "0.12em"`). Los outliers
  (`odc-detail.tsx` en 0.1em/font-medium, las acciones ejecutivas en
  tracking-wide/font-medium) se alinearon a ese estándar.
- **`tabular-nums` solo en cifras comparables, no en fechas ni en el número
  de ODC**: se siguió el patrón ya establecido en el resto del código (p. ej.
  `formatDate` nunca lleva `tabular-nums`; `odcNumber` tampoco). Esto evita
  aplicar la clase de forma indiscriminada y mantiene consistencia con lo que
  ya existía.
- **Encabezados de tabla con tratamiento de label explícito**: `Table` de
  shadcn solo distingue el header por peso (`font-medium` heredado), lo cual
  es insuficiente en una tabla operativa con muchas columnas
  (`monthly-summary.tsx`). Se aplicó el mismo token de label ya usado en el
  resto de la app directamente vía `className` en cada `TableHead`, sin tocar
  la primitiva compartida `components/ui/table.tsx` (fuera de alcance y usada
  solo aquí en todo el frontend, según búsqueda global).

## Verificación visual
No se levantó el stack completo (frontend + backend + Postgres vía
`docker-compose.yml`) para una captura en navegador: el cambio es puramente
de clases Tailwind sin lógica nueva, el build de producción compila sin
errores y la suite de tests existente (incluye `odc-detail.test.tsx` y
`monthly-summary.test.tsx`, que renderizan exactamente los árboles
modificados) pasa completa. Se consideró que levantar el stack con
Postgres/seed solo para esta verificación no era proporcional al alcance del
cambio. Si se requiere una revisión visual en navegador, se puede levantar
con `docker compose up` o `pnpm --dir backend start:dev` + `pnpm --dir
frontend dev` una vez la base de datos esté disponible.

## Output de build
```
> frontend@ build C:\Users\alex\Documents\sites\odc\frontend
> vite build

vite v8.1.5 building client environment for production...
✓ 2424 modules transformed.
✓ built in 2.01s
vite v8.1.5 building ssr environment for production...
✓ 170 modules transformed.
✓ built in 797ms
```

## Output de tests
```
> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run "--passWithNoTests"

 Test Files  30 passed (30)
      Tests  202 passed (202)
```

Nota: `pnpm lint` en `frontend/` reporta 22 errores preexistentes (p. ej.
`import/consistent-type-specifier-style` en `ui/alert.tsx`, `ui/button.tsx`,
`ui/sidebar.tsx`, `lib/utils.ts`, `routes/_authenticated.tsx`, y
aserciones innecesarias en tests de pago/factura). Ninguno está en los 5
archivos tocados por este cambio ni fue introducido por él — se verificó con
`git diff` que las líneas señaladas por ESLint no forman parte del diff. Se
dejan sin tocar por estar fuera del alcance de este pulido tipográfico.

## Commit
- `40d3bfc` — `style(odc-components): improve typographic hierarchy for
  figures, labels and tables` (sin push).

## Notas para el reviewer
- Confirmar que `emphasis` en `DetailItem` (Total en `OdcDetail`) no genera
  desbordes en el layout de 3 columnas (`sm:grid-cols-2 lg:grid-cols-3`) con
  totales largos (revisar en un ancho angosto, `sm`).
- Confirmar que subir `tracking-[0.12em]` en encabezados de tabla no causa
  `whitespace-nowrap` overflow en columnas cortas ("Almacén", "Factura") en
  viewports angostos — la tabla ya tiene `overflow-x-auto` vía el wrapper de
  `components/ui/table.tsx`, así que en el peor caso solo agrega scroll
  horizontal, no rompe el layout.
- Verificación visual real en navegador (login + datos reales) queda
  pendiente si el reviewer tiene el stack Docker/Postgres disponible.
