# impl: ui-design-tokens

Fecha: 2026-08-10
Rama: `ui-design-system-docs` (sin push)
Spec: `specs/ui-design-tokens/requirements.md` — `status: approved`, casilla de
aprobación humana marcada el 2026-08-10 (verificado antes de escribir código).

## Archivos creados

- `frontend/src/styles.tokens.test.ts` — auditoría estática de `styles.css`:
  import de la fuente, valores de `:root` y `.dark`, invariante de chroma, los
  32 tokens de estado, contraste WCAG 2.1 (conversor oklch→OKLab→sRGB propio,
  sin dependencias) y el bloque de `prefers-reduced-motion`. R1–R6, R14.
- `frontend/src/components/ui/primitives.tokens.test.tsx` — renderiza las 9
  primitivas y comprueba radio, alto, padding, elevación, foco y estructura
  semántica de la tabla. R7–R12.
- `frontend/src/design-system.guardrails.test.ts` — guardas de no regresión:
  las 6 aserciones sobre `className` siguen literalmente en su sitio, el set de
  dependencias de `frontend/package.json` no cambió, ninguna primitiva usa
  color literal (salvo `bg-black/30` del diálogo) y `monthly-summary-slide.tsx`
  conserva su paleta cruda. R13, R15.

## Archivos modificados

- `frontend/src/styles.css` — import de `@fontsource-variable/inter`; paleta
  navy del MASTER §1 en `:root`; `.dark` reescrito con los mismos roles
  (Inverted Ledger Rule) y `--sidebar-primary` como alias de `--primary`; 16
  pares `--status-*`/`--status-*-surface`; `--radius: 0.375rem`, `--radius-card`,
  `--radius-badge`; escala `--space-*`; `--font-sans`, `--color-accent-action*`
  y los 16 `--color-status-*` publicados en `@theme inline`;
  `body { font-family: var(--font-sans) }`.
- `frontend/src/components/ui/button.tsx` — `rounded-2xl` → `rounded-(--radius)`;
  nueva variante `confirm` sobre el par `accent-action`.
- `frontend/src/components/ui/input.tsx`, `textarea.tsx` — radio de control.
- `frontend/src/components/ui/select.tsx` — radio de control en trigger e items,
  `rounded-card` en el popup.
- `frontend/src/components/ui/field.tsx` — radio de control en el `FieldLabel`
  envolvente (`FieldError` ya emitía `role="alert"`; se conserva y se testea).
- `frontend/src/components/ui/card.tsx` — `rounded-card`, `--card-spacing` de
  `1.25rem` a `1rem` (y `sm` de `1rem` a `0.75rem`), `shadow-sm` → `shadow-xs`,
  `ring-1 ring-foreground/5` → `border border-border`.
- `frontend/src/components/ui/table.tsx` — `TableHeader` sticky con superficie
  opaca, fila `h-9`, celdas `px-3 py-2`.
- `frontend/src/components/ui/badge.tsx` — `rounded-badge`, borde eliminado de
  la base (pasa a la variante `outline`, que es la única que lo quiere).
- `frontend/src/components/ui/dialog.tsx` — `rounded-card`, `p-6` → `p-5`,
  `gap-6` → `gap-5`.
- `specs/ui-design-tokens/traceability.md` — 15 filas cerradas.
- `specs/ui-design-tokens/tasks.md` — 45 checkboxes marcadas.

`frontend/src/routes/__root.tsx` **no** se tocó: el import de la fuente se hizo
desde `styles.css`, opción que `design.md` contempla explícitamente y que evita
mover CSS al grafo de módulos de una ruta SSR.

## Requisitos cubiertos

| R | Test | Commit test | Commit feat |
|---|---|---|---|
| R1 | `styles.tokens.test.ts::R1: Inter Variable cargada y --font-sans declarada` | `aa31027` | `e9401d9` |
| R2 | `styles.tokens.test.ts::R2: paleta navy del MASTER §1 en :root` | `aa31027`, `f038a70` | `e9401d9` |
| R3 | `styles.tokens.test.ts::R3: dark conserva roles, corrige --sidebar-primary y acota el chroma` | `aa31027` | `e9401d9` |
| R4 | `styles.tokens.test.ts::R4: 8 pares --status-* / --status-*-surface en light y dark` | `aa31027` | `e9401d9` |
| R5 | `styles.tokens.test.ts::R5: contraste WCAG 2.1 >= 4.5:1 en los pares auditados` | `aa31027`, `f038a70` | `e9401d9` |
| R6 | `styles.tokens.test.ts::R6: radios y escala de espaciado` | `aa31027` | `e9401d9` |
| R7 | `primitives.tokens.test.tsx::R7: botón h-8, radio --radius, peso 500 y variante confirm` | `e677d90` | `31c88a7` |
| R8 | `primitives.tokens.test.tsx::R8: input, select y textarea con radio y foco del sistema` | `e677d90` | `31c88a7` |
| R9 | `primitives.tokens.test.tsx::R9: card con --radius-card, padding 1rem, shadow-xs y borde` | `e677d90` | `31c88a7` |
| R10 | `primitives.tokens.test.tsx::R10: tabla con fila 2.25rem, header sticky y overflow-x-auto` | `e677d90` | `31c88a7` |
| R11 | `primitives.tokens.test.tsx::R11: badge con --radius-badge y sin borde visible` | `e677d90` | `31c88a7` |
| R12 | `primitives.tokens.test.tsx::R12: diálogo con --radius-card, padding 1.25rem y shadow-xl` | `e677d90` | `31c88a7` |
| R13 | `design-system.guardrails.test.ts::R13: las 6 aserciones sobre className siguen intactas` | `81f7ee7` | guarda `e9401d9` + `31c88a7` |
| R14 | `styles.tokens.test.ts::R14: prefers-reduced-motion respetado y transiciones de 150-300ms` | `aa31027` | `e9401d9` |
| R15 | `design-system.guardrails.test.ts::R15: sin dependencias nuevas y sin color literal en las primitivas` | `81f7ee7` | guarda `e9401d9` + `31c88a7` |

Historial (más reciente arriba):

```
81f7ee7 test(ui-design-tokens): non-regression guards for className assertions, deps and literal colour (R13,R15)
31c88a7 feat(ui-design-tokens): restyle the 9 primitives onto the design tokens (R7,R8,R9,R10,R11,R12)
e677d90 test(ui-design-tokens): shape, size and focus of the 9 primitives (R7,R8,R9,R10,R11,R12)
e9401d9 feat(ui-design-tokens): navy palette, status tokens, radii and Inter (R1,R2,R3,R4,R5,R6,R14)
f038a70 test(ui-design-tokens): ignore CSS comments when parsing token blocks (R2,R5)
aa31027 test(ui-design-tokens): audit stylesheet tokens, contrast and motion (R1,R2,R3,R4,R5,R6,R14)
```

Ningún commit mezcla `*.test.*` con código de producción. Rojo verificado antes
de cada `feat`: 55/77 fallos en `aa31027` y 11/18 en `e677d90`.

## Conflicto de spec: R2 vs R5 en `--accent-action-foreground`

**Los dos requisitos no se pueden cumplir a la vez.** R2 fija
`--accent-action: oklch(0.5960 0.1274 163.23)` (el `#059669` del MASTER §1) y
`--accent-action-foreground: oklch(0.985 0 0)`. R5 exige ≥ 4.5:1 entre ellos.
El par real da **3.61:1** (incluso con blanco puro son 3.77:1). No es un error
de redondeo: emerald-600 con texto blanco está por debajo de AA y no hay tercer
grado de libertad.

Resolución aplicada, la de menor daño:

- `--accent-action` se conserva **exactamente** como lo fija el MASTER §1 y R2.
- `--accent-action-foreground` pasa a `oklch(0.2077 0.0398 265.75)` — el propio
  `--foreground` navy del sistema — que da **4.74:1**.

Criterio: `--accent-action-foreground` **no aparece en la tabla del MASTER §1**,
mientras que `--accent-action` sí (con hex y rol). R2 dice "exactamente estos
valores del MASTER §1", así que el valor inventado por la spec es el eslabón
menos normativo del par. La alternativa (bajar el verde a `L ≈ 0.53` para
sostener el texto blanco) habría alterado el color de marca que el MASTER nombra
por hex. Accesibilidad ≥ criterio estético heredado, y el MASTER §10 y §8
también exigen 4.5:1.

El test lo deja explícito en vez de esconderlo: R2 verifica los 11 valores del
MASTER uno a uno, y la desviación tiene su propio caso, con comentario, en
`styles.tokens.test.ts` y en `styles.css`.

**Esto necesita decisión del leader/humano**: o se enmienda R2 para registrar
el valor real, o se prefiere oscurecer el verde. El código actual es
funcionalmente accesible en ambos escenarios.

## Decisiones de diseño

- **Valores de `.dark` y de los 16 `-surface` calculados, no inventados.** El
  MASTER sólo fija los foregrounds claros; el resto se derivó buscando el
  mínimo margen que cumple R5 con holgura. Contrastes resultantes: 4.62–6.95:1
  en los 8 pares de estado claros, 7.47–8.18:1 en los oscuros, 5.26:1 en el par
  frágil `destructive/10` sobre `--card` en dark.
- **El test compone alpha en sRGB codificado, no lineal.** Es lo que hace el
  navegador. Componer en lineal daba 3.99:1 para el par `destructive/10` y
  habría forzado a retocar toda la escala oscura por un artefacto del método.
- **`--radius-card` y `--radius-badge` viven en `@theme inline` con valor
  literal**, no como `var(--radius-card)` desde `:root`: eso habría sido una
  autorreferencia (Tailwind emite el mismo nombre a `:root`). Verificado en el
  CSS compilado: `.rounded-card{border-radius:.625rem}` y
  `--radius-card:.625rem` en `:root`.
- **Controles con `rounded-(--radius)` en vez de `rounded-lg`.** Son
  equivalentes (`--radius-lg: var(--radius)`), pero la forma explícita se lee y
  se grepea como "el radio de control", que es lo que la fase 3 va a querer.
- **`body { font-family: var(--font-sans) }` explícito** además del token. En el
  build `--default-font-family` ya resuelve a Inter Variable, pero la regla
  explícita hace que R1 no dependa de un detalle interno del preflight de
  Tailwind v4.
- **El borde del badge se movió de la base a la variante `outline`.** R11 pide
  badge sin borde; dejar `border-border` en `outline` sin ancho lo habría
  convertido en código muerto.
- **`--chart-1..5` se dejaron acromáticos.** Cumplen la invariante de chroma de
  R3, nadie los consume todavía y colorearlos sería rediseño fuera de alcance.

## Alcance: lo que NO cambió

Ningún archivo de `components/odc/`, `components/layout/`, `ui/toast.tsx` ni el
resto de primitivas de `ui/`. El ajuste mecánico que R15 contempla no hizo
falta: `odc-status-badge.tsx` ya traía `border-0`, así que quitar el borde de
`badge.tsx` no lo afectó. `frontend/package.json` intacto.

Los tokens `--status-*` quedan **declarados y sin consumir**, como manda la
spec: sustituir las clases Tailwind de `odc-status-badge.tsx` es fase 3e.

## Output de build

`BUILD_CMD` = `(cd backend && pnpm build) && (cd frontend && pnpm build)` — exit 0.

```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build


> frontend@ build C:\Users\alex\Documents\sites\odc\frontend
> vite build

vite v8.1.5 building client environment for production...
transforming...
[@tanstack/devtools-vite] Removed devtools code from: /src/routes/__root.tsx

... (listado de assets omitido: 110 líneas sin errores ni warnings) ...

dist/server/assets/date-picker-ULhmt7E-.js                  12.42 kB │ gzip:  3.42 kB
dist/server/assets/odc-form-DaCHusRM.js                     18.54 kB │ gzip:  4.73 kB
dist/server/assets/executive-dashboard-C38sdOjD.js          18.86 kB │ gzip:  4.34 kB
dist/server/assets/monthly-summary-DM05PKXD.js              25.34 kB │ gzip:  6.09 kB
dist/server/assets/_authenticated-rcmGSGjg.js               29.05 kB │ gzip:  6.85 kB
dist/server/assets/_id-CpUsTpgh.js                          38.43 kB │ gzip:  7.43 kB
dist/server/server.js                                      172.53 kB │ gzip: 43.15 kB

✓ built in 923ms
```

Comprobaciones sobre el CSS compilado (`dist/client/assets/styles-*.css`):

```
--font-sans:"Inter Variable", ui-sans-serif, system-ui, sans-serif
--default-font-family:"Inter Variable", ui-sans-serif, system-ui, sans-serif
body{font-family:var(--font-sans);margin:0}
.rounded-card{border-radius:.625rem}
.rounded-badge{border-radius:.25rem}
.bg-accent-action{background-color:var(--accent-action)}
--status-pending-surface:oklch(97.8% .014 49)      (:root)
--status-pending-surface:oklch(29% .047 49)        (.dark)
7 ficheros .woff2 de Inter Variable emitidos
```

## Output de tests

`TEST_CMD` = `(cd backend && pnpm test) && (cd frontend && pnpm test --passWithNoTests)` — exit 0.

```
> backend@0.0.1 test C:\Users\alex\Documents\sites\odc\backend
> jest


Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total
Snapshots:   0 total
Time:        10.789 s
Ran all test suites.

> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run "--passWithNoTests"


 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend


 Test Files  35 passed (35)
      Tests  327 passed (327)
   Start at  22:01:05
   Duration  29.45s (transform 8.58s, setup 27.75s, import 132.81s, tests 58.49s, environment 115.34s)
```

Baseline antes de la feature: 32 ficheros / 214 tests en frontend. Ahora 35 /
327: +3 ficheros y +113 tests, ninguno preexistente modificado.

`./init.sh` termina en `✅ Todo verde. Listo para trabajar.`

## Notas para el reviewer

1. **El conflicto R2/R5** (sección propia arriba) es lo único que se aparta de
   la spec y necesita una decisión humana. La aritmética está en el propio test
   de contraste: se puede reproducir cambiando
   `--accent-action-foreground` a `oklch(0.985 0 0)` en `styles.css` y viendo
   fallar `R5 ... light --accent-action-foreground sobre --accent-action`.
2. **R13, R14 y R15 nacen en verde.** Son la sección "No regresión" de la spec:
   son guardas, no ciclos rojo→verde. **Corrección (D1 del reviewer):** la
   redacción original decía que sus commits de test preceden a la
   implementación que guardan. Es falso para R13 y R15 — `81f7ee7` va después
   de `e9401d9` y `31c88a7`. Solo se cumple en R14. Para que R15 no fuera una guarda
   vacua se añadió un caso que calibra el detector de color literal contra
   `monthly-summary-slide.tsx`.
3. **`f038a70` es un segundo commit de test antes del primer `feat`.** El parser
   de `styles.css` del test no ignoraba comentarios CSS y se rompía con el
   comentario que documenta el conflicto R2/R5. Se arregló en un commit de test
   aparte, nunca mezclado con implementación.
4. **`TableHeader` sticky no se aprecia todavía.** Es el techo conocido que ya
   anticipaba `design.md`: el contenedor sólo desborda en X. La clase está
   puesta y testeada; la vista que la aproveche llega en fase 3.
5. **Sin verificación visual en navegador.** No se lanzó Playwright: exige el
   stack completo con Postgres arriba (`docs/verification.md`). Todo lo
   comprobado es build, tests y CSS compilado. Si el leader quiere confirmación
   visual del cambio de paleta y densidad antes de cerrar, ese es el hueco.
6. **Cambios de tamaño con efecto en cascada** que conviene mirar en pantalla:
   el padding de tarjeta baja de `1.25rem` a `1rem`, la fila de tabla de `2.5rem`
   a `2.25rem`, y la tarjeta cambia `ring-1` por `border`, lo que suma 1px de
   caja. Ningún test se rompió, pero es el tipo de cambio que se juzga mirando.

---

## Adenda 2026-08-10 — enmienda firmada de R2 aplicada

El conflicto R2/R5 que escalé arriba lo resolvió el humano **por el lado del
verde, no del texto** — al revés de lo que había parcheado yo. La enmienda está
firmada en `specs/ui-design-tokens/requirements.md` ("Enmiendas posteriores a la
aprobación", casilla marcada) y en `design-system/odc/MASTER.md` §1.

| Token | Antes (mi parche) | Ahora (enmienda) |
|---|---|---|
| `:root --accent-action` | `oklch(0.5960 0.1274 163.23)` #059669 | `oklch(0.5081 0.1049 165.61)` #047857 |
| `:root --accent-action-foreground` | `oklch(0.2077 0.0398 265.75)` navy | `oklch(0.985 0 0)` blanco |
| `.dark --accent-action` | `oklch(0.7227 0.1394 163.23)` | `oklch(0.7227 0.1394 165.61)` |
| `.dark --accent-action-foreground` | `oklch(0.1822 0.0362 265.75)` | sin cambio |

- **Light**: blanco sobre #047857 mide **5.25:1** con el conversor del test
  (la enmienda cita 5.48:1, calculado desde el hex; ambos muy por encima de
  4.5). El verde nuevo es **exactamente `--status-done`**, así que confirmar y
  el estado al que lleva comparten color. Añadí un test que fija esa igualdad
  (`--accent-action es el mismo verde que --status-done en tema claro`) para que
  no se despareje en silencio en la fase 3e.
- **Dark**: el par no lo fija ni la spec ni el MASTER. Lo recalculé con las
  mismas invariantes que el resto: sólo desplacé el hue a `165.61` para seguir
  al verde enmendado y conservé L/C. Con el texto navy da **8.13:1**. El rol
  invertido se mantiene (superficie verde clara, texto oscuro), igual que
  `--primary` en dark.
- **Chroma**: `0.1049` supera el tope de `0.10`, así que la invariante de R3
  sólo pasa por la **exención** de `--accent-action`. Ya estaba en el test
  (`/^--(status-|destructive|accent-action)/`) desde el primer commit, no hizo
  falta tocarla — pero es margen estrecho y load-bearing: si alguien quita esa
  exención, el token cae.

Commits (misma disciplina: test rojo primero, `feat` después, nunca mezclados):

```
a48404a feat(ui-design-tokens): adopt amended emerald-700 accent-action (R2,R5)
6e20170 test(ui-design-tokens): expect the amended emerald-700 accent-action (R2,R5)
```

`6e20170` es el **único** test ya escrito que edité en toda la feature, y sólo
porque el requisito que lo respaldaba cambió por enmienda firmada. Dejó 3 casos
rojos (`--accent-action`, `--accent-action-foreground` y la igualdad con
`--status-done`) antes de `a48404a`.

Verificación tras la enmienda, desde `frontend/`:

```
> frontend@ build
> vite build
✓ built in 1.01s

--accent-action:oklch(50.81% .1049 165.61)     (:root)
--accent-action:oklch(72.27% .1394 165.61)     (.dark)

> frontend@ test
> vitest run

 Test Files  35 passed (35)
      Tests  328 passed (328)
   Duration  23.24s
```

328 tests (uno más que antes: el de igualdad con `--status-done`), verde a la
primera. El flake preexistente de `general-approval-actions.test.tsx:163` no
apareció en esta corrida.

**Pendiente para el leader, no para mí**: la enmienda vive en el working tree
sin commitear (`specs/ui-design-tokens/requirements.md` y
`design-system/odc/MASTER.md` salen como modificados). No los commiteo porque
son la edición del humano y territorio del leader, pero si se cierra la sesión
sin ellos el rastro de la enmienda se pierde del historial.
