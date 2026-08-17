---
feature: "ui-responsive-375"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, responsive, verification]
---

# Diseño — [[ui-responsive-375]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Contexto: por qué esta feature existe

`design-system/odc/MASTER.md` §10 pide "Responsive verificado en 375 / 768 /
1024 / 1440". La revisión en navegador del 2026-08-10
(`progress/ui-redesign-plan.md` §"Revisión en navegador") cerró 1440 y dejó 375
**sin comprobar**, con una causa registrada: se pidió `resize_window` a 390px y
`window.innerWidth` siguió devolviendo 1864. El instrumento falló en silencio y
la revisión lo detectó solo porque leyó `innerWidth` después de pedir el
cambio. De ahí sale R1: la lectura de control no es un detalle de proceso, es el
requisito que impide que la feature entera se cierre sobre humo.

## Decisiones técnicas

- **El gate de viewport se mide con `matchMedia` contra los breakpoints reales,
  no solo con `innerWidth` (R1).** Tailwind v4 se usa aquí con sus breakpoints
  por defecto — `sm` 40rem/640px, `md` 48rem/768px, `lg` 64rem/1024px, `xl`
  80rem/1280px —; `frontend/src/styles.css` no declara ningún `--breakpoint-*`
  ni `@custom-media` que los altere (verificado). A 375px lo único que se aplica
  son las clases **base**, sin prefijo. Por eso el gate afirma
  `matchMedia('(min-width: 40rem)').matches === false`: es la comprobación que
  ata la medición al mecanismo que realmente decide el layout, y no depende de
  que la herramienta de navegador reporte bien su propio tamaño.

- **Método primario Playwright, fallback emulación de dispositivo (R1).**
  `@playwright/test` ya está en `frontend/package.json`, hay
  `playwright.config.ts` con `webServer` y una spec de humo
  (`e2e/login.spec.ts`), y `setViewportSize` sí cambia el viewport de verdad. Es
  el instrumento con menos coste marginal disponible. El fallback documentado es
  la emulación de dispositivo de Chrome DevTools, con las mismas cinco lecturas
  copiadas a mano en el acta. `resize_window` queda descartado como método
  único por antecedente de fallo silencioso. Si convertirlo en spec permanente
  entra o no en el alcance es la decisión abierta 1 de [[requirements]].

- **La corrección es condicional y mobile-first (R6).** Tailwind aplica la clase
  base por debajo del primer breakpoint, así que cualquier arreglo se expresa
  como `<valor-móvil> sm:<valor-actual>`: eso garantiza por construcción que el
  render a ≥ 640px no cambia, que es la condición que el resto del refactor
  (features 23–27, todas `done` y verificadas a 1440) necesita para no
  reabrirse.

- **El desbordamiento interno de las tablas no es defecto (R3).** MASTER §6 y §8
  prescriben `overflow-x-auto` como *la* solución correcta para una tabla ancha
  en móvil, y `components/ui/table.tsx:9` ya lo aporta. Distinguirlo del scroll
  de página es lo que evita que la auditoría "arregle" algo que ya está bien.

- **La excepción de `monthly-summary-slide.tsx` se codifica por nombre (R4).**
  Es el único ancho fijo grande del árbol (`w-[1120px]`), es el render del PDF
  vía `html-to-image`, siempre en claro, y ya es la excepción admitida de color
  literal de la feature 23 R15 / plan §Decisiones 6. Vive en
  `fixed top-0 left-[-1200px]` con `aria-hidden="true"`, es decir fuera del
  lienzo por la izquierda, donde en LTR no aporta `scrollWidth`. Un test que
  prohíba anchos fijos sin esta excepción nombrada nacería rojo y tentaría a
  romper la exportación.

- **La meta `viewport` entra como requisito aunque hoy esté bien (R4).**
  `routes/__root.tsx:22` ya declara `width=device-width, initial-scale=1`. Sin
  ella un navegador móvil renderiza a ~980px y **toda** la evidencia de esta
  feature sería falsa. Es la única precondición de 375px que se puede afirmar en
  Vitest, cuesta tres líneas de guarda y protege el resultado de la feature
  frente a un cambio futuro en el root.

- **El área táctil se mide y se declara, no se corrige (R8).** Hay un choque
  real entre MASTER §6 ("Área táctil mínima 44×44px en móvil") y el dial de
  densidad 8/10 que la feature 23 materializó en `h-8` (32px) y `icon-sm`
  (28px), con `primitives.tokens.test.tsx:37,:68,:93` fijándolo. Resolverlo es
  una decisión de diseño; medirlo y ponerle número es verificación. Esta feature
  hace lo segundo y deja lo primero como deuda con nombre.

## Inventario de la auditoría

### Rutas de producción (`frontend/src/routes/`)

Seis, sin contar `__root.tsx` ni el layout `_authenticated.tsx`:
`login.tsx`, `_authenticated/index.tsx`, `_authenticated/tasks.tsx`,
`_authenticated/odcs/new.tsx`, `_authenticated/odcs/$id.tsx`,
`_authenticated/monthly-summary.tsx`. Coincide exactamente con la tabla de
rutas de [[../ui-dead-surfaces-audit/design|ui-dead-surfaces-audit design]].

### Lo que ya está resuelto (se verifica, no se espera defecto)

| Punto | Evidencia en fuente |
|---|---|
| Sidebar pasa a `Sheet` bajo 768px, con ancho `18rem` | `hooks/use-mobile.ts:3`, `components/ui/sidebar.tsx:69,193` |
| Filas de acciones apiladas bajo `sm` | 6 superficies con `flex-col … sm:flex-row` |
| Rejillas de detalle apiladas bajo `sm` | `odc-detail.tsx:102,157,189` |
| Cabecera de columnas del dashboard oculta bajo `lg` | `executive-dashboard.tsx:174` (`hidden … lg:grid`) |
| Etiquetas "Anterior"/"Siguiente" ocultas bajo `sm` | `components/ui/pagination.tsx:82,99` |
| Diálogos limitados a `calc(100% - 2rem)` en base | `components/ui/dialog.tsx:54` |
| Previsualización de documento con altura y padding móviles | `odc-document-preview.tsx:80,89,104,128` |
| Tabla envuelta en `overflow-x-auto` | `components/ui/table.tsx:9` |
| `max-w-sm` del login (384px > 375px, pero es `max-`, con `p-6` alrededor) | `routes/login.tsx` |
| Meta `viewport` correcta | `routes/__root.tsx:22` |

### Sospechosos (los tres de R7)

| # | Dónde | Por qué |
|---|---|---|
| 1 | `monthly-summary.tsx:287` | `grid-cols-3` **sin prefijo**: tres métricas con importe en ~311px de ancho de tarjeta |
| 2 | `odc-detail.tsx:40` | `grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]` **sin prefijo**: etiqueta uppercase + valor `break-words` conviviendo en ~300px. `minmax(0,…)` evita el desbordamiento, pero no la ilegibilidad |
| 3 | `monthly-summary-slide.tsx:12` | `w-[1120px]` fuera del lienzo; se espera correcto, hay que demostrarlo con la medición de R3 |

Ninguno es una certeza de defecto. Se listan porque son los únicos puntos donde
la fuente no tiene ya una respuesta mobile-first, y porque una auditoría que no
nombra de antemano lo que más probablemente falla acaba mirando solo lo fácil.

## Archivos afectados

Todos en `infrastructure` según [[../../docs/architecture|architecture]]: es UI,
no toca `domain` ni `application` de ningún módulo.

- `progress/verify_ui-responsive-375.md` — **nuevo**. Esqueleto de nueve
  encabezados en `PENDIENTE` (implementer) y acta rellenada en navegador real
  (leader + firma humana). Es el entregable principal (R9).
- `frontend/src/design-system.guardrails.test.ts` — guardas nuevas de R4
  (meta `viewport`, ausencia de anchos fijos > 375px con la excepción nombrada),
  R5 (patrones responsive vigentes) y R9 (el acta existe y no tiene `PENDIENTE`).
  Es el archivo donde ya viven las guardas equivalentes de las features 25, 26 y
  27; no se crea un archivo nuevo para lo mismo.
- `progress/ui-redesign-plan.md` — cerrar §"No verificado / Responsive a 375px"
  con el resultado, conservando el registro histórico del fallo de
  `resize_window` (R9).
- `specs/ui-responsive-375/traceability.md` — el implementer la completa por
  requisito.
- **Condicional (R6), solo si el acta encuentra defecto**: la superficie viva
  afectada y su `*.test.tsx`. Candidatas conocidas:
  `frontend/src/components/odc/monthly-summary.tsx` y
  `frontend/src/components/odc/odc-detail.tsx`. **Si el acta sale limpia, ningún
  archivo de `frontend/src/components/` cambia y eso es un cierre correcto.**

No cambia: `frontend/src/styles.css`, `frontend/src/components/ui/*`,
`frontend/package.json`, rutas, cliente API ni backend.

## Riesgos

- **`general-approval-actions.test.tsx:163` es intermitente**: falla solo con la
  suite completa, por una carrera de render. Es deuda previa. Si aparece rojo
  durante esta feature, se re-ejecuta antes de atribuirlo al cambio (R10). No es
  un defecto a arreglar aquí.
- **Las cuatro aserciones sobre `className`** de `progress/ui-redesign-plan.md`
  §"Tests en riesgo" siguen vivas; `general-approval-actions.test.tsx:342`
  (`/flex-col.*sm:flex-row/`) es la que más directamente choca con cualquier
  cambio de layout responsive (R5).
- **`/odcs/$id` necesita tres sesiones y varios estados** para exponer las cinco
  superficies de acción (R2). Es el punto donde el acta puede quedarse corta sin
  que ningún test lo note; por eso R2 lo enumera estado por estado.
- **El stack completo (`docker-compose up -d`) es condición para cualquier
  medición**: `/login` resuelve la sesión en SSR contra el backend, así que sin
  backend ni siquiera la ruta pública renderiza. Está documentado en
  `playwright.config.ts`.

## Alternativas descartadas

- **Simular el viewport en JSDOM** (mockear `window.innerWidth`, `matchMedia` y
  medir en Vitest): JSDOM no aplica CSS ni calcula layout, así que devolvería
  `0` en todo `getBoundingClientRect` y no puede ver un desbordamiento, un
  solape ni un área táctil. Se usa JSDOM para lo que sí puede afirmar —clases
  en fuente, ausencia de anchos fijos, patrones responsive conservados— y nada
  más.
- **Añadir una librería de regresión visual** (Percy, Chromatic, comparación de
  capturas): dependencia nueva y un baseline que mantener, para una verificación
  puntual de un checklist. MASTER §8 y el propio plan cierran el sistema a lo
  que ya está instalado.
- **Declarar breakpoints personalizados o un `container query`** para resolver
  los sospechosos: cambiaría el sistema de layout completo por dos casos, y
  reabre el territorio de tokens de la feature 23.
- **Auditar los cuatro anchos del checklist (375/768/1024/1440) de una vez**:
  triplica la superficie de corrección condicional. Queda como decisión abierta
  2 de [[requirements]], no como alcance por defecto.
- **Fiarse de `resize_window` con un reintento**: ya falló silenciosamente una
  vez y no hay forma de distinguir "funcionó" de "no funcionó" sin la lectura de
  control, que es justo lo que R1 convierte en obligatorio para cualquier
  método.
