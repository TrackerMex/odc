---
feature: "ui-surfaces-monthly-summary"
status: approved     # draft | approved
tags: [harness, spec, frontend, ui, monthly-summary, charts]
---

# Tareas — [[ui-surfaces-monthly-summary]]

> Disciplina TDD. Cada bloque sigue test rojo → implementación mínima →
> refactor con tests verdes. Las guardas de preservación (R6, R7, R10) pueden
> nacer verdes; el rojo debe provenir primero del comportamiento nuevo del
> requisito.
>
> Orden recomendado: **R3 primero**. Es el cambio de mayor impacto visual y el
> que decide el alto de la tarjeta, del que dependen las alturas del skeleton de
> R7. R9 va al final, cuando ya hay algo que mirar.

## R1 — Ancho, padding y header compacto

- [x] (1) Escribir test que falla por `max-w-7xl`, `lg:p-8`, `h1` a `text-3xl sm:text-4xl` y el párrafo descriptivo presente
- [x] (2) Aplicar `max-w-[1400px]`, `p-4 sm:p-6`, `text-2xl` y eliminar el párrafo
- [x] (3) Refactor conservando eyebrow, `h1`, selector de mes, botones de export y `min-w-0 flex-1`

## R2 — Total como único punto de énfasis

- [x] (1) Escribir test que falla por `text-4xl sm:text-5xl` y por la ausencia de la comprobación "ningún otro elemento iguala ese escalón"
- [x] (2) Bajar el total a `text-3xl font-semibold tabular-nums` con el aire de `--space-lg`
- [x] (3) Refactor conservando las tres sub-métricas y el literal `Sin datos`

## R3 — Barras horizontales por etapa

- [x] (1) Escribir tests que fallan: orden por `count` descendente, ancho proporcional, token `--status-*` por etapa, texto siempre visible, etapa con `count` 0 listada, `count` máximo 0 sin `NaN%`
- [x] (2) Implementar las barras con `div` + `width: %` reutilizando `statusStyles` y sustituyendo `StageLabel` por `OdcStatusBadge`
- [x] (3) Refactor sin segunda tabla estado→color, sin variantes `dark:` y con el carril marcado como decorativo

## R4 — Tracking de encabezados de tabla

- [x] (1) Escribir test que falla por las 6 apariciones de `tracking-[0.12em]`
- [x] (2) Sustituirlas por `tracking-[0.06em]`
- [x] (3) Refactor confirmando que no se reimplementa `overflow-x-auto`, `h-9`, `border-b` ni zebra, y que el enlace del folio conserva su anillo de foco

## R5 — Radio semántico y cero color literal

- [x] (1) Escribir test que falla por el `rounded-2xl` del estado vacío y que audita `LITERAL_COLOR` sobre la superficie
- [x] (2) Aplicar `rounded-card` y retirar cualquier literal
- [x] (3) Refactor conservando borde discontinuo y mensaje accionable del estado vacío

## R6 — El slide del PDF congelado y documentado

- [x] (1) Escribir test que falla por la ausencia del comentario que documenta la excepción de color
- [x] (2) Añadir el comentario, sin tocar el render
- [x] (3) Refactor comprobando que las dos guardas del slide (`:218`, `:227`) siguen verdes sin editarse

## R7 — Preservación de contratos

- [x] (1) Escribir las caracterizaciones de la tabla de contratos: mes/página en la URL, retry, `aria-live`/`aria-busy`, `odc-filter-results`, `data-testid`, paginación, export del mes completo, skeleton con `motion-reduce`
- [x] (2) Ajustar las alturas del skeleton al layout resultante, sin más cambios
- [x] (3) Refactor verificando dependencias congeladas, `styles.css` y `components/ui/` intactos y `production-reachability.test.ts` en verde

## R8 — Guardas de invariantes y fuente normativa

- [x] (1) Escribir la guarda que falla al añadir `monthly-summary` al conjunto auditado antes de aplicar R4/R5
- [x] (2) Ampliar el conjunto de superficies y **concatenar** `pages/monthly-summary.md` a la fuente normativa
- [x] (3) Refactor confirmando que `monthly-summary-slide` queda fuera del conjunto y que ningún test fija un valor ausente de la fuente normativa

## R9 — Esqueleto del acta de verificación en navegador

- [x] (1) Escribir el test que falla porque `progress/verify_ui-surfaces-monthly-summary.md` no existe o no declara los seis encabezados
- [x] (2) Crear el archivo con los seis encabezados exactos y el cuerpo de cada uno en `PENDIENTE` — **el implementer no rellena ninguna sección**
- [x] (3) Devolver el control al leader para que levante el acta en navegador y un humano firme la sección 6

## R10 — Suite y build en verde

- [x] (1) Ejecutar `pnpm test` y `pnpm build` y registrar cualquier aserción existente que se ponga roja
- [x] (2) Resolver el choque conservando la clase/texto en el componente, nunca editando el test
- [x] (3) Anotar en [[traceability]] cada choque y su resolución
