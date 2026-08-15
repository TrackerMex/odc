---
feature: "ui-surfaces-monthly-summary"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, monthly-summary, charts]
---

# Requisitos — [[ui-surfaces-monthly-summary]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

Alcance: **fase 3d** de `progress/ui-redesign-plan.md`, ni más ni menos. Es la
tercera y última superficie de la serie de refactor UI, después de la feature 25
(`ui-surfaces-dashboards`, fases 3a+3e) y la 26 (`ui-surfaces-detail-forms`,
fases 3b+3c), ambas `done`.

Fuente normativa del contenido visual: `design-system/odc/MASTER.md` y su
override de superficie `design-system/odc/pages/monthly-summary.md`, que
**sobrescribe** al MASTER donde discrepan.

Archivos de la aplicación en alcance (dos):

| Archivo | Papel |
|---|---|
| `frontend/src/components/odc/monthly-summary.tsx` | La superficie que se rediseña |
| `frontend/src/components/odc/monthly-summary-slide.tsx` | Solo recibe el comentario documental de R6; su render **no** cambia |

`frontend/src/lib/monthly-summary-export.ts` y
`frontend/src/routes/_authenticated/monthly-summary.tsx` entran únicamente como
contratos a preservar (R7): esta feature no cambia ni una línea de ninguno.

## Gate de alcanzabilidad (comprobado antes de redactar)

Las cuatro superficies **están vivas**; ninguna es código muerto. La feature 30
(`ui-dead-surfaces-audit`) ya lo dejó afirmado y guardado por un test, y esta
spec lo reconfirmó a mano:

| Símbolo | Importador de producción | Ruta registrada |
|---|---|---|
| `monthly-summary.tsx` (`MonthlySummary`) | `routes/_authenticated/monthly-summary.tsx:2` | `/monthly-summary` en `routeTree.gen.ts:127` |
| `monthly-summary-slide.tsx` (`MonthlySummarySlide`) | `monthly-summary.tsx:48` | idem, transitivo |
| `lib/monthly-summary-export.ts` (`exportMonthlySummarySlide`) | `monthly-summary.tsx:39` | idem, transitivo |
| `routes/_authenticated/monthly-summary.tsx` | — | es la ruta |

Además hay un camino de usuario real: `components/layout/app-sidebar.tsx:100`
publica el enlace "Resumen mensual" bajo el gate `canManageOrders`, y la ruta
redirige a `/` a cualquier rol que no sea `DIRECTOR_OPS`. La guarda
`components/odc/production-reachability.test.ts` (feature 30, R4) ya exige
que `monthly-summary.tsx` y `monthly-summary-slide.tsx` sigan alcanzables:
**ningún requisito de esta spec puede romper esa lista** (R7).

## Relación con las features 23, 24, 25 y 26 (las cuatro `done`)

Esta feature **consume** lo que aquellas dejaron; no reabre nada.

| Qué dejaron cerrado | Qué hace esta feature |
|---|---|
| Los 16 tokens `--status-*` / `--status-*-surface` en `@theme inline` (feature 23 R4), auditados a ≥ 4.5:1 en light y dark (23 R5 + 24 R6) | Los consume en las barras de etapa de R3. No declara ninguno nuevo |
| El mapa único estado→clase `statusStyles` de `odc-status-badge.tsx` (feature 25, R1), sin variantes `dark:` | Lo reutiliza. La inversión por tema sigue viviendo en los tokens, no en el componente (R3) |
| `--radius-card` y la utilidad `rounded-card` (feature 23 R7/R9/R11, usada por la 26 en R13) | La aplica al último `rounded-2xl` que queda en esta superficie (R5) |
| El tracking de label `0.06em` del MASTER §2, ya impuesto en las superficies de la 25 (R5) | Lo aplica a los 6 encabezados de tabla de esta superficie (R4) |
| `max-w-[1400px]` como ancho de contenido (MASTER §3, feature 25 R3) | Lo aplica al único `max-w-7xl` que queda (R1) |
| El detector `LITERAL_COLOR` y las guardas de `design-system.guardrails.test.ts` (feature 25 R11/R13/R15) | Extiende su conjunto de superficies y su fuente normativa (R8) |
| La excepción de color literal de `monthly-summary-slide.tsx` (feature 23 R15, plan §Decisiones 6) | La **conserva** y la documenta en el propio archivo (R6) |

Esta spec **no** requiere enmendar las specs 23, 24, 25 ni 26. Si la
implementación descubriera lo contrario, R7 fija qué hacer: parar y reportar,
nunca enmendar por cuenta propia.

## Requisitos funcionales

- **R1**: WHEN se renderiza `MonthlySummary`, THE SYSTEM SHALL limitar su
  contenedor de contenido a `max-w-[1400px]`, sustituyendo el único `max-w-7xl`
  de `monthly-summary.tsx:142`, y SHALL aplicar al `main` el padding de página
  `p-4 sm:p-6` sin el escalón `lg:p-8`, conservando `min-w-0 flex-1`. El `h1`
  SHALL bajar a `text-2xl` sin salto responsive, sustituyendo
  `text-3xl ... sm:text-4xl`, y THE SYSTEM SHALL eliminar el párrafo descriptivo
  "Un corte mensual listo para revisar y compartir." de
  `monthly-summary.tsx:151-153`. THE SYSTEM SHALL conservar el texto del `h1`
  ("Compras que sí se realizaron"), el eyebrow "Operaciones / Seguimiento
  mensual", el selector `Mes de pago` con su `label` asociado y los dos botones
  de exportación dentro del mismo header. El grid superior
  `lg:grid-cols-[1.6fr_1fr]` SHALL permanecer intacto: el override lo declara
  correcto. Motivo: `pages/monthly-summary.md` §Layout y MASTER §3.

- **R2**: WHEN se renderiza el total del mes, THE SYSTEM SHALL usar
  `text-3xl font-semibold tabular-nums`, sustituyendo
  `text-4xl ... sm:text-5xl`, y SHALL separarlo del contenido superior con
  `--space-lg` (0.75rem) de aire. THE SYSTEM SHALL NOT dejar ningún otro
  elemento de la superficie a un tamaño tipográfico igual o mayor que ese total:
  es el único de la pantalla en ese escalón. Las tres sub-métricas
  (`Compras registradas`, `Ticket promedio`, `Ingreso a almacén`) SHALL
  conservar su tamaño body con `font-semibold tabular-nums` y sus etiquetas
  actuales, incluido el literal `Sin datos` cuando `averageWarehouseDays` es
  `null`. Motivo: `pages/monthly-summary.md` §Métrica principal — con un `h1` de
  `text-2xl`, un total de `text-5xl` desequilibra la jerarquía; la métrica se
  lee por aislamiento, no por tamaño.

- **R3**: WHEN la tarjeta "En qué etapa están" recibe `summary.stages`, THE
  SYSTEM SHALL presentar cada etapa como una **barra horizontal**, sustituyendo
  la lista de pares texto/número actual, y SHALL ordenarlas de mayor a menor por
  `count`, resolviendo los empates por el orden canónico de la máquina de
  estados (`PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA`). El ancho
  de cada barra SHALL ser proporcional a su `count` respecto del `count` máximo
  del corte, expresado como porcentaje sobre un carril de ancho fijo. El relleno
  de cada barra SHALL tomar su color del token `--status-*` de esa etapa
  — `--status-paid`, `--status-evidence` y `--status-done` — **reutilizando el
  mapa único `statusStyles` de `odc-status-badge.tsx`**; THE SYSTEM SHALL NOT
  declarar una segunda tabla estado→color ni ninguna variante `dark:` en esta
  superficie. Cada etapa SHALL mostrar siempre, como texto, su etiqueta
  `statusLabel(status)`, su `count` y su `formatCurrency(totalCents)` con
  `tabular-nums`: el color nunca comunica solo (MASTER §1, regla obligatoria de
  `ux-guidelines.csv`). IF una etapa tiene `count` 0, THEN THE SYSTEM SHALL
  seguir listándola con su etiqueta y su `0` visibles y una barra de ancho cero
  — desaparecer haría ilegible que la etapa existe y está vacía. IF el `count`
  máximo del corte es 0, THEN todas las barras SHALL medir cero y THE SYSTEM
  SHALL NOT dividir por cero ni emitir `NaN%`. El carril de la barra SHALL ser
  decorativo para tecnologías de asistencia (`aria-hidden="true"` o
  equivalente), porque su información ya la porta el texto adyacente. Motivo:
  `pages/monthly-summary.md` §"En qué etapa están" y MASTER §7 — barras
  horizontales ordenadas, resueltas con `div` y `width: %`.

- **R4**: WHEN se renderizan los encabezados de la tabla de detalle, THE SYSTEM
  SHALL usar el tracking de label del MASTER §2, `tracking-[0.06em]`, y
  `monthly-summary.tsx` SHALL NOT contener ninguna de las 6 apariciones actuales
  de `tracking-[0.12em]` (`:337`, `:340`, `:343`, `:346`, `:349`, `:352`) ni
  ninguna otra clase de tracking de póster. THE SYSTEM SHALL conservar la
  estructura semántica `Table > TableHeader > TableRow > TableHead` +
  `TableBody`, el `key={purchase.id}`, el enlace del folio a `/odcs/$id` con su
  `focus-visible:ring-3 focus-visible:ring-ring/30`, la columna `Total` alineada
  a la derecha con `tabular-nums` y el badge `Facturada`/`Pendiente`. THE SYSTEM
  SHALL NOT reimplementar localmente el wrapper `overflow-x-auto`, la altura de
  fila `h-9`, el `border-b` de 1px ni la ausencia de zebra: la primitiva
  `components/ui/table.tsx` ya los aporta desde la feature 23, y duplicarlos
  aquí sería trabajo sin defecto observable.

- **R5**: WHEN se consulta el código de `monthly-summary.tsx`, THE SYSTEM SHALL
  NOT contener las clases `rounded-xl` ni `rounded-2xl` — hoy queda una, el
  estado vacío de `:228` —, y cada caja SHALL usar el radio de su token:
  `rounded-card` para tarjetas y contenedores de sección, el radio de control
  para chips y envoltorios de foco. THE SYSTEM SHALL NOT contener ningún color
  literal — hex crudo o clase de paleta Tailwind — según el detector
  `LITERAL_COLOR` ya calibrado en `frontend/src/design-system.guardrails.test.ts`.
  El estado vacío SHALL conservar su borde discontinuo y su mensaje accionable
  ("No hay compras con pago registrado en <mes>."). Motivo: MASTER §4 y §8.

- **R6**: WHILE se aplica este rediseño, `monthly-summary-slide.tsx` SHALL
  conservar íntegros su render, su tipografía y sus clases de paleta literales
  (`bg-white`, `text-slate-*`, `border-slate-*`, `tracking-[0.16em]`,
  `tracking-[0.12em]`): es el render del PDF, siempre en claro vía
  `html-to-image`, y la única excepción admitida a la regla de "cero colores
  crudos" (feature 23 R15; plan §Decisiones tomadas, punto 6). THE SYSTEM SHALL
  añadir en ese archivo un comentario que explique por qué esos literales son
  deliberados, para que ninguna auditoría posterior los "arregle", como pide
  `pages/monthly-summary.md` §Export PDF. THE SYSTEM SHALL NOT añadir al slide
  el desglose por etapa ni los tokens `--status-*`: el slide no pinta hoy ningún
  color de estado, así que no hay nada que alinear entre PDF y pantalla, y
  añadirle una sección sería una superficie nueva, no un rediseño. Las dos
  guardas de `design-system.guardrails.test.ts:218` y `:227` — la que exige que
  el slide conserve sus literales y la que calibra el detector contra él —
  SHALL seguir en verde sin editarse.

- **R7**: WHILE se aplica este rediseño, THE SYSTEM SHALL conservar sin cambio
  observable todos estos contratos vigentes:

  | Contrato | Dónde se observa hoy |
  |---|---|
  | Gate de rol `DIRECTOR_OPS` y `redirect` a `/` | `routes/_authenticated/monthly-summary.tsx:13` |
  | `loader`, `pendingComponent` y `errorComponent` de la ruta | mismo archivo, `:15-17` |
  | Recarga por mes y `getMonthlyPurchaseSummary(month)` | `monthly-summary.tsx:92` |
  | Sincronía de `month` y `page` con la query string | `:112-121` |
  | Alerta de error con acción `Reintentar` y `requestVersion` | `:187-201` |
  | `aria-live="polite"` del anuncio y `aria-busy` de la sección | `:203`, `:210` |
  | Clase `odc-filter-results` y su keyframe en `styles.css` | `:217`; test `monthly-summary.test.tsx:139` |
  | `data-testid` `monthly-summary-results` y `monthly-summary-detail` | `:216`, `:333` |
  | Paginación de 10 por página, `visiblePages`, "Mostrando a–b de n compras" | `:50`, `:427-437`, `:497` |
  | `exportMonthlySummarySlide(element, summary.month, format)` y el bloqueo mientras `exporting !== null` | `:130`, `:169-183` |
  | Que el elemento exportado contenga **el mes completo**, no solo la página visible | `:233-237`; test `monthly-summary.test.tsx:214-216` |
  | Skeleton con `motion-reduce:animate-none` | `:244-247` |
  | Alcanzabilidad de las dos superficies desde rutas de producción | `production-reachability.test.ts` R4 |

  Las alturas del skeleton (`h-52` + `h-72`) SHALL ajustarse si el layout
  resultante cambia de alto, para no introducir CLS, y SHALL conservar
  `motion-reduce:animate-none`. THE SYSTEM SHALL NOT añadir ninguna entrada
  nueva a `dependencies` ni a `devDependencies` de `frontend/package.json`, y
  los únicos archivos que SHALL cambiar son `monthly-summary.tsx`,
  `monthly-summary-slide.tsx`, sus archivos de test,
  `frontend/src/design-system.guardrails.test.ts`, los de
  `specs/ui-surfaces-monthly-summary/` y los de `progress/`. THE SYSTEM SHALL
  NOT modificar `frontend/src/styles.css` ni ningún archivo de
  `frontend/src/components/ui/`. IF durante la implementación resultara que
  falta un token, o que un valor de `styles.css` o de una primitiva impide
  cumplir un requisito, THEN el implementer SHALL parar y reportarlo al leader
  en lugar de enmendar `styles.css`, las primitivas o las specs de las features
  23–26 por su cuenta.

- **R8**: WHEN el implementer escriba los tests de esta feature, THE SYSTEM
  SHALL afirmar **invariantes** — token consumido, ausencia de clase prohibida,
  orden relativo de las barras, presencia del texto que acompaña al color,
  contrato accesible preservado — y SHALL NOT fijar en ningún test un valor
  visual que no esté escrito en `design-system/odc/MASTER.md` o en
  `design-system/odc/pages/monthly-summary.md`. Concretamente, en
  `frontend/src/design-system.guardrails.test.ts`:

  1. `monthly-summary` SHALL entrar en el conjunto de superficies auditadas por
     color literal, radio y tracking; `monthly-summary-slide` SHALL quedar
     **fuera** de ese conjunto, porque R6 le conserva literales y tracking
     propios y añadirlo pondría rojas sus dos guardas actuales.
  2. La fuente normativa de la auditoría de "valores inventados" SHALL pasar a
     ser la **concatenación** de `MASTER.md`, `pages/dashboard.md` y
     `pages/monthly-summary.md`, nunca una sustitución: el literal
     `tracking-[0.06em]` solo aparece en `pages/dashboard.md`, así que
     reemplazar la fuente en vez de ampliarla dejaría rojas las guardas ya
     verdes de la feature 25.

  Para lo que ninguno de los documentos normativos fija — el alto y el radio
  concretos del carril de la barra, el ancho de la columna de etiquetas, el
  reparto exacto del aire dentro de la tarjeta —, el valor lo elige el
  implementer dentro de las restricciones de R1–R5 y lo confirma la sesión de
  navegador de R9; si el valor se mueve ahí, **no hay que tocar esta spec**.

- **R9**: WHEN la feature se proponga para `done`, THE SYSTEM SHALL existir
  `progress/verify_ui-surfaces-monthly-summary.md` con exactamente estos seis
  encabezados, en este orden y con este texto:

  ```
  ## 1. La superficie en los dos temas
  ## 2. Jerarquía tipográfica del total
  ## 3. Las barras de etapa
  ## 4. La tabla de detalle
  ## 5. La exportación PNG y PDF
  ## 6. Veredicto humano
  ```

  El contenido de cada sección SHALL tomarse en un navegador real, con la app
  corriendo, sesión `DIRECTOR_OPS`, y el conmutador de tema de `lib/theme.tsx`;
  los valores SHALL copiarse en vivo con `getComputedStyle`, nunca deducirse del
  código:

  1. `/monthly-summary` en tema claro y oscuro, con el alto computado del header
     antes y después del cambio;
  2. el `font-size` computado del total y la comprobación de que ningún otro
     elemento de la página lo iguala o supera — el cierre de R2;
  3. las tres barras con datos reales en los dos temas: el `background-color`
     computado de cada relleno, el ancho en px de cada una, el aspecto de la
     etapa con `count` 0, y el veredicto de si la distribución se lee de un
     vistazo o es ruido;
  4. la tabla con un mes de más de 10 compras: paginación funcionando,
     `scrollWidth == clientWidth` a ancho de escritorio, y el `letter-spacing`
     computado de un encabezado;
  5. exportación PNG y PDF **ejecutadas de verdad** sobre el mes verificado, con
     el veredicto de si el archivo generado sigue siendo el de antes del
     rediseño: R6 congela el slide y esta es la única forma de comprobarlo;
  6. una línea de veredicto humano con fecha, afirmativa o negativa.

  **El implementer solo deja el esqueleto**: crea el archivo con los seis
  encabezados y el cuerpo de cada uno en `PENDIENTE`, y no rellena ninguno. El
  acta la levanta el leader en una sesión de navegador real, y la sección 6 la
  firma un humano. IF ese archivo no existe, o alguna sección sigue en
  `PENDIENTE`, o su veredicto no es afirmativo, THEN el reviewer SHALL NOT
  aprobar el cierre **aunque `pnpm test` y `pnpm build` estén en verde**: los
  tests de esta feature verifican invariantes, y este gate encontró defectos
  reales que la suite en verde no veía las dos veces que se ha aplicado
  (features 24 y 25).

- **R10**: WHILE se ejecutan `pnpm test` y `pnpm build` en `frontend/`, THE
  SYSTEM SHALL terminar ambos en verde, sin editar ninguna de las aserciones
  existentes de `monthly-summary.test.tsx`. IF un requisito de esta spec chocara
  con una de ellas, THEN THE SYSTEM SHALL conservar la clase, el texto o el
  contrato en el componente en lugar de modificar el test, y SHALL registrarlo
  en [[traceability]]. La intermitencia conocida de
  `general-approval-actions.test.tsx` al correr la suite completa SHALL NOT
  atribuirse a esta feature.

## Fuera de alcance

- **Backend, API y datos**: endpoints, DTOs, el contrato de
  `getMonthlyPurchaseSummary`, el gate de rol `DIRECTOR_OPS`, la máquina de
  estados y los importes calculados. Esta feature es solo presentación.
- **Añadir una librería de gráficas.** MASTER §7 lo prohíbe explícitamente para
  esta vista: las barras horizontales se resuelven con `div` y `width: %`.
  También queda fuera el Line Chart de serie temporal de gasto que el MASTER §7
  contempla: exige ≥ 4 puntos, hoy la vista carga un solo mes, y no existe el
  requisito que lo justifique.
- **Añadir el desglose por etapa al PDF** o retematizar
  `monthly-summary-slide.tsx`. R6 lo congela.
- **`frontend/src/styles.css`, los tokens y las primitivas de `components/ui/`**:
  territorio cerrado de las features 23 y 24 (R7).
- **Montar o restaurar los dashboards eliminados por la feature 30.**
- **Responsive a 375px** (feature 28, `ui-responsive-375`). La verificación de
  R9 se hace a ancho de escritorio; aquí solo se preservan las clases responsive
  de las composiciones que R1–R5 tocan.
- **Traducir copy o cambiar el `<title>`** (feature 29, `ui-copy-es-and-title`).
- **Re-saturar la familia de las 8 badges de `.dark`**: sigue deliberadamente
  sin feature (plan §"Fuera de `feature_list.json` a propósito").
- **Cambiar el tamaño de página de la paginación, el contrato de la query string
  o virtualizar la tabla**: MASTER §6 condiciona la virtualización a superar 100
  filas renderizadas y hoy hay paginación de 10.
- **Reimplementar lo que la primitiva `table.tsx` ya aporta** (R4).

## Decisiones abiertas para el gate humano

Dos puntos donde el override de superficie calla y esta spec ha elegido. Se
listan para que la aprobación humana los confirme o los corrija; si se
confirman tal cual, **ningún requisito cambia**.

1. **Padding de página `p-4 sm:p-6` sin `lg:p-8` (R1).**
   `pages/monthly-summary.md` §Layout no menciona el padding; solo el ancho. La
   spec lo alinea con lo que las features 25 y 26 ya dejaron en las demás
   superficies, para que `/` y `/monthly-summary` no tengan márgenes distintos
   vistos uno detrás de otro. Alternativa: dejar `lg:p-8` como está y aceptar la
   inconsistencia.
2. **Orden de las barras por `count`, no por `totalCents` (R3).**
   El override dice "de mayor a menor" sin decir de qué. La spec elige `count`
   porque es la magnitud que la propia tarjeta anuncia ("Compras contabilizadas
   en el corte") y la que hace comparable la longitud de las barras con el
   número que va al lado. Alternativa: ordenar y dimensionar por importe, que
   respondería "dónde está el dinero" en vez de "cuántas órdenes".

## Aprobación

- [X] Aprobado por humano (fecha: 2026-08-15) ← gate obligatorio antes de implementar
