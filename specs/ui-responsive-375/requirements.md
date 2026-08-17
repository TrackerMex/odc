---
feature: "ui-responsive-375"
status: approved     # draft | approved
tags: [harness, spec, frontend, ui, responsive, verification]
---

# Requisitos — [[ui-responsive-375]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para el inventario, el método de medición y las decisiones, y
> [[../../docs/architecture|architecture]] para las reglas de arquitectura.

Alcance: el punto **375px** del checklist de `design-system/odc/MASTER.md` §10,
que **nunca se ha comprobado**. Origen: `progress/ui-redesign-plan.md`
§"28 `ui-responsive-375`" y §"No verificado / Responsive a 375px" — en la
revisión del 2026-08-10 `resize_window` no tuvo efecto (tras pedir 390px,
`innerWidth` seguía en 1864), así que hoy no hay evidencia ni a favor ni en
contra.

**Esta feature es de verificación con corrección condicional, no de rediseño.**
Si a 375px no se rompe nada, la evidencia *es* el entregable y no cambia una
línea de la aplicación. Si algo se rompe, se arregla — pero solo eso, y solo por
debajo del breakpoint `sm`.

## Naturaleza de la feature y qué cuenta como "hecho"

| Resultado posible | Qué se entrega |
|---|---|
| Ninguna superficie se rompe | El acta de R9 con las mediciones de R1/R3, cero cambios en `frontend/src/components/` |
| Alguna se rompe | Lo anterior **más** la corrección mínima de R6 en las superficies afectadas |

Un acta completa con veredicto "no se rompe nada" es un cierre **válido**. Un
cierre sin acta no lo es, aunque `pnpm test` esté en verde.

## Instrumento de verificación por requisito

El encargo distingue explícitamente qué se puede afirmar en JSDOM y qué exige un
navegador real. Ningún requisito puede quedar sin instrumento.

| Req | Qué afirma | Instrumento |
|---|---|---|
| R1 | El viewport medido es de verdad 375px y `sm` está apagado | **Navegador real** (gate de todo lo demás) |
| R2 | El inventario auditado son las superficies vivas, todas | Vitest (guarda de alcanzabilidad) + acta |
| R3 | Cero scroll horizontal de página en las 6 rutas | **Navegador real** |
| R4 | `meta viewport` correcto y cero anchos fijos > 375px en el flujo | Vitest sobre fuente |
| R5 | Los patrones responsive vigentes siguen intactos | Vitest sobre fuente + tests existentes |
| R6 | Toda corrección es mobile-first y no toca ≥ 640px | Vitest sobre fuente + **navegador real** (antes/después) |
| R7 | Los tres sospechosos ya identificados reciben veredicto | **Navegador real** |
| R8 | Área táctil medida y declarada; densidad de la 23 intacta | **Navegador real** (medida) + Vitest (densidad) |
| R9 | El acta existe, está completa y firmada | Vitest (existe, sin `PENDIENTE`) + gate humano |
| R10 | `pnpm test` y `pnpm build` en verde sin editar aserciones | Vitest + build |

## Superficies en alcance

Solo superficies **montadas en rutas de producción**, según el inventario que
dejó cerrado la feature 30 (`[[../ui-dead-surfaces-audit/design|ui-dead-surfaces-audit design]]`)
y que reconfirma la guarda `components/odc/production-reachability.test.ts`.
**Ninguna superficie sin ruta entra en esta spec.**

| Ruta | Superficies que monta |
|---|---|
| `/login` | `LoginForm`, dentro del contenedor `p-6 md:p-10` + `max-w-sm` de `routes/login.tsx` |
| `/` | `AppLayout` + `AppSidebar` + `SidebarTrigger`, y `ExecutiveDashboard` (con `OdcStatusBadge`) |
| `/tasks` | `ExecutiveTasks` |
| `/odcs/new` | `OdcForm` |
| `/odcs/$id` | `OdcDetail`, `OdcDocumentPreview`, `AdminBudgetActions`, `GeneralApprovalActions`, `RegisterPaymentForm`, `PaymentEvidenceForm`, `UploadInvoiceForm` y `OdcForm` (creador `DIRECTOR_OPS` en `BORRADOR`/`RECHAZADA`) |
| `/monthly-summary` | `MonthlySummary` y `MonthlySummarySlide` (fuera de pantalla, render del PDF) |

Estados transitorios compartidos: `OdcPagePending`, `OdcPageError`,
`RolePlaceholder`.

## Requisitos funcionales

- **R1**: WHEN se tome cualquier observación de esta feature, THE SYSTEM SHALL
  registrar primero, en la misma sesión y **desde el propio navegador**, estas
  cinco lecturas:

  1. `window.innerWidth` — SHALL ser exactamente `375`;
  2. `document.documentElement.clientWidth`;
  3. `window.devicePixelRatio`;
  4. `window.matchMedia('(min-width: 40rem)').matches` — SHALL ser `false`;
  5. `window.matchMedia('(min-width: 48rem)').matches` — SHALL ser `false`.

  Las lecturas 4 y 5 son el gate real: `sm` y `md` son los prefijos de los que
  depende todo el layout de la app, y un viewport de 375px que los deje
  encendidos significa que el instrumento mintió. IF cualquiera de las cinco no
  cumple, THEN la observación SHALL descartarse entera y THE SYSTEM SHALL NOT
  registrarla como evidencia — el fallo silencioso de `resize_window` del
  2026-08-10 es exactamente lo que este requisito impide repetir. THE SYSTEM
  SHALL NOT aceptar `resize_window` como método único: el método SHALL ser
  Playwright con `setViewportSize({ width: 375, height: 667 })` o la emulación
  de dispositivo de Chrome DevTools, y el acta SHALL nombrar cuál se usó.
  Instrumento: navegador real; ningún otro requisito de browser cuenta sin esta
  cabecera registrada.

- **R2**: WHEN se levante el acta, THE SYSTEM SHALL cubrir las **seis rutas** de
  producción y **cada** superficie montada listada en §"Superficies en alcance",
  con al menos una observación por superficie. `/odcs/$id` SHALL visitarse con
  las sesiones y estados necesarios para que cada bloque de acciones
  (`AdminBudgetActions` en `PENDIENTE_ADMIN` con `ADMINISTRACION`,
  `GeneralApprovalActions` en `PRESUPUESTO_APROBADO` con `DIRECTOR_GENERAL`,
  `RegisterPaymentForm` en `COMPRA_APROBADA`, `UploadInvoiceForm` en
  `EVIDENCIA_PAGO_SUBIDA` y `PaymentEvidenceForm` en `PAGO_REGISTRADO`) se
  observe al menos una vez a 375px. THE SYSTEM SHALL NOT auditar, montar ni
  mencionar como pendiente ninguna superficie sin ruta: los tres dashboards
  sustituidos desaparecieron con la feature 30 y la guarda
  `components/odc/production-reachability.test.ts` SHALL seguir en verde sin
  editarse. Instrumento: Vitest (la guarda) + acta (la cobertura).

- **R3**: WHEN cada una de las seis rutas se renderiza a 375px bajo el gate de
  R1, THE SYSTEM SHALL cumplir
  `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`
  (el margen de 1px absorbe el redondeo sub-pixel), y el acta SHALL registrar
  los dos valores medidos por ruta. El desbordamiento **interno** de un
  contenedor con `overflow-x-auto` — hoy el wrapper de
  `components/ui/table.tsx:9`, que envuelve las tablas de `MonthlySummary` —
  SHALL NOT contarse como defecto: MASTER §6 y §8 lo prescriben como la forma
  correcta de resolver una tabla ancha en móvil, y lo prohibido es el scroll
  horizontal **de la página**. IF una ruta desborda, THEN el acta SHALL nombrar
  el elemento culpable (selector y ancho computado) antes de que se escriba
  ninguna corrección. Instrumento: navegador real.

- **R4**: WHEN se consulte la fuente del frontend, THE SYSTEM SHALL conservar en
  `frontend/src/routes/__root.tsx` la meta `viewport` con contenido
  `width=device-width, initial-scale=1` — sin ella un navegador móvil renderiza
  a ~980px y toda medición de 375px sería ficción —, y ninguna superficie viva
  SHALL declarar un ancho fijo mayor que 375px (`w-[<n>px]`, `min-w-[<n>px]` o
  equivalente en `rem`) fuera de un prefijo `sm:`/`md:`/`lg:`/`xl:`. Se admite
  **una sola excepción**, que el test SHALL codificar por nombre:
  `components/odc/monthly-summary-slide.tsx:12` conserva su `w-[1120px]` porque
  es el render del PDF y vive fuera del lienzo, en el contenedor
  `fixed top-0 left-[-1200px]` con `aria-hidden="true"` de
  `monthly-summary.tsx:222`; la excepción SHALL seguir condicionada a que ese
  contenedor conserve su posicionamiento fuera de pantalla. Instrumento: Vitest
  sobre fuente (guarda nueva en `frontend/src/design-system.guardrails.test.ts`).

- **R5**: WHILE dure esta feature, THE SYSTEM SHALL conservar sin retirar ni
  debilitar los patrones responsive que ya existen en las superficies vivas:

  | Patrón | Dónde vive hoy |
  |---|---|
  | `flex flex-col … sm:flex-row` en la fila de acciones | `general-approval-actions.tsx:129`, `admin-budget-actions.tsx:121`, `register-payment-form.tsx:210`, `payment-evidence-form.tsx:151`, `upload-invoice-form.tsx:234`, `odc-form.tsx:398` |
  | `grid min-w-0` + `sm:grid-cols-2` | `odc-detail.tsx:102`, `:157`, `:189` |
  | `min-w-0` en el formulario | `odc-form.tsx` |
  | Cabecera de columnas oculta bajo `lg` (`hidden … lg:grid`) | `executive-dashboard.tsx:174` |
  | Etiquetas de paginación ocultas bajo `sm` (`hidden sm:block`) | `components/ui/pagination.tsx:82`, `:99` |
  | Wrapper `overflow-x-auto` de la tabla | `components/ui/table.tsx:9` |
  | Diálogo `max-w-[calc(100%-2rem)]` base + `sm:max-w-md` / `sm:max-w-5xl` | `components/ui/dialog.tsx:54`, `odc-document-preview.tsx:80` |
  | Sidebar en `Sheet` por debajo de 768px (`useIsMobile`) | `hooks/use-mobile.ts:3`, `components/ui/sidebar.tsx:69` |

  Las cuatro aserciones en riesgo de `progress/ui-redesign-plan.md` §"Tests en
  riesgo" SHALL seguir intactas, en particular
  `general-approval-actions.test.tsx:342` (`/flex-col.*sm:flex-row/`) y la guarda
  equivalente de `design-system.guardrails.test.ts:250`. IF una corrección de R6
  exigiera cambiar uno de estos patrones, THEN THE SYSTEM SHALL conservar el
  patrón y buscar otra solución, o parar y reportar al leader. Instrumento:
  Vitest sobre fuente y los tests ya existentes.

- **R6**: IF una observación válida bajo R1 muestra a 375px un desbordamiento de
  página (R3), un solape de elementos, un texto truncado que deja el dato
  ilegible o un control inalcanzable, THEN THE SYSTEM SHALL corregirlo con la
  clase Tailwind **mobile-first** mínima en la superficie viva afectada —valor
  base para < 640px y prefijo `sm:` restaurando el valor actual— y THE SYSTEM
  SHALL NOT producir ningún cambio observable en el render a ≥ 640px. Cada
  corrección SHALL quedar registrada en el acta con la medición **antes y
  después** del mismo elemento, bajo el mismo gate de R1. THE SYSTEM SHALL NOT
  añadir tokens, dependencias, breakpoints personalizados ni utilidades nuevas,
  y SHALL NOT modificar `frontend/src/styles.css` ni ningún archivo de
  `frontend/src/components/ui/`. IF el defecto observado vive en una primitiva de
  `components/ui/` o en un token, THEN el implementer SHALL parar y reportarlo al
  leader en lugar de enmendar por su cuenta el territorio cerrado de las features
  23 y 24. IF una superficie no presenta defecto, THEN el acta SHALL registrar
  igualmente su medición y THE SYSTEM SHALL NOT cambiar ni una clase de esa
  superficie: "no se rompe" es un resultado, no una tarea pendiente. Instrumento:
  Vitest sobre fuente (mobile-first, sin tokens ni dependencias) + navegador real
  (antes/después).

- **R7**: WHEN se levante el acta, THE SYSTEM SHALL emitir un veredicto explícito
  —"correcto a 375px" o "defecto + corrección"— para los **tres puntos ya
  identificados al redactar esta spec**, ninguno de los cuales puede quedar sin
  respuesta:

  1. `monthly-summary.tsx:287` — `grid-cols-3` **sin prefijo responsive** reparte
     `Compras registradas`, `Ticket promedio` e `Ingreso a almacén` en tres
     columnas dentro de una tarjeta que a 375px mide ~311px de contenido; el acta
     SHALL registrar el ancho computado de cada columna y si el importe cabe sin
     partirse;
  2. `odc-detail.tsx:40` — las filas de definición usan
     `grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]` **sin prefijo responsive**: a
     375px la columna de etiqueta (`text-xs uppercase tracking-[0.06em]`) y la de
     valor (`break-words text-right`) conviven en ~300px; el acta SHALL registrar
     el ancho de ambas columnas y si alguna etiqueta larga se parte de forma
     ilegible;
  3. `monthly-summary-slide.tsx:12` — el `w-[1120px]` del render de PDF dentro de
     `fixed top-0 left-[-1200px]`; el acta SHALL confirmar con la medición de R3
     que no aporta ni un píxel al `scrollWidth` de la página a 375px.

  Instrumento: navegador real. Esta lista es el suelo, no el techo: R2 obliga a
  cubrir todas las superficies aunque no estén aquí.

- **R8**: WHEN se levante el acta, THE SYSTEM SHALL registrar el rectángulo real
  (`getBoundingClientRect`) a 375px de, al menos, el `SidebarTrigger` de
  `app-layout.tsx` (hoy `size="icon-sm"` → 28px), un botón de acción por defecto
  (hoy `h-8` → 32px), un enlace de folio de la tabla de `MonthlySummary` y un
  control de paginación, y SHALL contrastarlo con el mínimo de 44×44px que exige
  `MASTER.md` §6 para móvil. THE SYSTEM SHALL NOT cambiar la altura de los
  controles ni el dial de densidad de la feature 23 dentro de esta feature: `h-8`
  está fijado por `components/ui/primitives.tokens.test.tsx:37`, `:68` y `:93`, y
  subirlo sería rediseñar, no verificar. IF alguna medida queda por debajo de
  44px, THEN THE SYSTEM SHALL anotarla en el acta como **deuda con nombre y
  medida** y el leader SHALL llevarla a decisión humana como feature aparte, no
  resolverla aquí. Instrumento: navegador real (la medida) + Vitest (que la
  densidad no se tocó).

- **R9**: WHEN la feature se proponga para `done`, THE SYSTEM SHALL existir
  `progress/verify_ui-responsive-375.md` con exactamente estos nueve
  encabezados, en este orden y con este texto:

  ```
  ## 0. Gate de medición
  ## 1. /login
  ## 2. / (portada ejecutiva)
  ## 3. /tasks
  ## 4. /odcs/new
  ## 5. /odcs/$id
  ## 6. /monthly-summary
  ## 7. Área táctil
  ## 8. Veredicto humano
  ```

  La sección 0 SHALL contener las cinco lecturas de R1 y el nombre del
  instrumento. Las secciones 1–6 SHALL contener, cada una, el par
  `scrollWidth`/`clientWidth` de R3, las observaciones de las superficies que
  monta esa ruta y —si hubo— la medición antes/después de cada corrección de R6;
  las secciones 5 y 6 SHALL además cerrar los veredictos de R7. La sección 7
  SHALL contener las medidas de R8. La sección 8 SHALL ser una línea de veredicto
  humano con fecha, afirmativa o negativa.

  **El implementer solo deja el esqueleto**: crea el archivo con los nueve
  encabezados y el cuerpo de cada uno en `PENDIENTE`, y no rellena ninguno. El
  acta la levanta el leader en una sesión de navegador real y la sección 8 la
  firma un humano. THE SYSTEM SHALL además actualizar en
  `progress/ui-redesign-plan.md` la sección §"No verificado / Responsive a 375px"
  con el resultado, sin borrar el registro histórico del fallo de
  `resize_window`. IF el acta no existe, o alguna sección sigue en `PENDIENTE`, o
  su veredicto no es afirmativo, THEN el reviewer SHALL NOT aprobar el cierre
  **aunque `pnpm test` y `pnpm build` estén en verde**: este gate encontró
  defectos reales las tres veces que se ha aplicado (features 24, 25 y 27), y en
  esta feature el acta no acompaña al entregable — **es** el entregable.
  Instrumento: Vitest (existencia y ausencia de `PENDIENTE`) + gate humano.

- **R10**: WHILE se ejecutan `pnpm test` y `pnpm build` en `frontend/`, THE
  SYSTEM SHALL terminar ambos en verde **sin editar ninguna aserción existente**
  de los tests de las superficies vivas. IF un requisito de esta spec chocara con
  una aserción vigente, THEN THE SYSTEM SHALL conservar la clase o el contrato en
  el componente en lugar de modificar el test, y SHALL registrarlo en
  [[traceability]]. La intermitencia conocida de
  `general-approval-actions.test.tsx:163` —falla solo al correr la suite completa,
  por una carrera de render— SHALL NOT atribuirse a esta feature ni arreglarse
  dentro de ella: es deuda previa y ajena al responsive. Instrumento: Vitest +
  build.

## Fuera de alcance

- **Rediseño de layout a ancho de escritorio.** Ningún cambio observable a
  ≥ 640px (R6). Esta feature no reabre jerarquía, densidad, tipografía ni
  composición de ninguna superficie.
- **Superficies sin ruta.** No se audita, monta ni restaura nada que la feature
  30 dejó fuera del grafo de producción.
- **Feature 29 (`ui-copy-es-and-title`).** Los rótulos `Email`/`Password` de
  `login-form.tsx` y el `<title>` `TanStack Start Starter` se verán al auditar
  `/login` y `__root.tsx`: **no se tocan aquí**. R4 solo mira la meta `viewport`
  de ese archivo.
- **Los otros tres anchos del checklist de MASTER §10 (768 / 1024 / 1440).**
  1440 quedó verificado en la sesión del 2026-08-10; 768 y 1024 siguen sin
  comprobar y **siguen sin comprobar al cerrar esta feature** — ver
  §"Decisiones abiertas".
- **`frontend/src/styles.css`, los tokens y las primitivas de `components/ui/`**:
  territorio cerrado de las features 23 y 24 (R6).
- **Subir la altura de los controles a 44px** o cambiar el dial de densidad de la
  feature 23 (R8). Se mide y se declara; no se corrige aquí.
- **El test intermitente `general-approval-actions.test.tsx:163`** (R10).
- **Backend, API, DTOs, permisos, máquina de estados y datos**: esta feature es
  solo presentación.
- **Añadir dependencias**, breakpoints personalizados, una librería de testing de
  viewport o un framework de visual regression.
- **Re-saturar la familia de las 8 badges de `.dark`**: sigue deliberadamente sin
  feature (plan §"Fuera de `feature_list.json` a propósito").

## Decisiones abiertas para el gate humano

Tres puntos donde ni el MASTER ni el plan deciden y esta spec ha elegido. Si se
confirman tal cual, **ningún requisito cambia**.

1. **El acta es manual; no se exige un spec de Playwright permanente (R1).**
   `@playwright/test` ya está instalado, hay `frontend/e2e/login.spec.ts` y
   `pnpm e2e`, y `page.setViewportSize({ width: 375, height: 667 })` haría el
   gate de R1 auto-demostrable y re-ejecutable para siempre. Se ha dejado como
   *método recomendado* y no como requisito porque `pnpm e2e` exige el stack
   completo (`docker-compose up -d`), no corre en `pnpm test`, y convertirlo en
   requisito añade un gate nuevo al reviewer y una sesión autenticada por rol.
   Alternativa: exigir `frontend/e2e/responsive-375.spec.ts` con las seis rutas y
   la aserción de R3, y que el acta cite su salida. **Es la decisión de mayor
   consecuencia de esta spec.**
2. **768px y 1024px quedan fuera.** El nombre de la feature, el plan y el hueco
   real de evidencia hablan solo de 375. Cerrar los tres anchos en una sola
   sesión costaría poco más que cerrar uno, pero triplica la superficie de
   corrección condicional de R6 y difumina el alcance. Alternativa: ampliar R1 y
   R3 a `375 / 768 / 1024` y renombrar la feature.
3. **Los 44px de área táctil se miden pero no se corrigen (R8).** MASTER §6 los
   exige en móvil y la app entrega hoy 32px (`h-8`) y 28px (`icon-sm`),
   ambos fijados por los tests de la feature 23. Corregirlo obliga a elegir entre
   contradecir el dial de densidad 8/10 o introducir un escalón de altura solo
   para móvil, y eso es una decisión de diseño, no una verificación. Alternativa:
   autorizar aquí mismo un escalón de padding táctil bajo `sm` y aceptar que esta
   feature toque `components/ui/button.tsx`.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-08-17) ← gate obligatorio antes de implementar
