# impl: ui-responsive-375

Fecha: 2026-08-17
Feature 28, spec aprobada por humano el 2026-08-17 (`19bcea3`, `status: approved`).

## Resultado en una línea

**A 375px no se rompe nada.** Las seis rutas de producción y las veinte
superficies que montan se midieron en un navegador real bajo el gate de R1 y
ninguna produce scroll horizontal de página, solape, truncado ilegible ni
control inalcanzable. Por tanto **no cambió ni una línea de
`frontend/src/components/`**, que es el cierre correcto según la tabla
"Naturaleza de la feature" de la spec. El entregable es el acta.

## Archivos creados

- `progress/verify_ui-responsive-375.md` — el acta. Nueve encabezados exigidos
  por R9; secciones 0 a 7 levantadas con medidas reales, sección 8 (veredicto
  humano) en `PENDIENTE` a propósito.
- `frontend/e2e/responsive-375.spec.ts` — instrumento de R1 y R3. Playwright con
  `page.setViewportSize({ width: 375, height: 667 })`: lee las cinco lecturas de
  control y recorre las seis rutas comprobando
  `scrollWidth <= clientWidth + 1`.
- `progress/impl_ui-responsive-375.md` — este archivo.

## Archivos modificados

- `frontend/src/design-system.guardrails.test.ts` — diez `describe` nuevos, uno
  por requisito, al final del archivo. Es donde ya viven las guardas
  equivalentes de las features 25, 26 y 27; no se creó un archivo nuevo para lo
  mismo (design.md).
- `progress/ui-redesign-plan.md` — §"No verificado / Responsive a 375px" cerrada
  con el resultado. El registro histórico del fallo de `resize_window` (390px
  pedidos, `innerWidth` 1864) **se conserva íntegro**, con el cierre añadido
  debajo como cita.
- `specs/ui-responsive-375/traceability.md` — tabla completa, sin filas
  pendientes.
- `specs/ui-responsive-375/tasks.md` — 30 sub-items cerrados con su resultado.

**No cambió nada** en `frontend/src/components/`, `frontend/src/styles.css`,
`frontend/src/components/ui/`, `frontend/package.json`, rutas, cliente API ni
backend.

## Requisitos cubiertos

Ver `specs/ui-responsive-375/traceability.md` para la tabla con los dos hashes
por requisito. Resumen del ciclo rojo → verde:

| Req | Rojo verificado | Verde |
|---|---|---|
| R1 | `e116538`: 6 aserciones, `ENOENT` al leer el acta inexistente | `b95e9ef` |
| R2 | `c67c475`: 31 aserciones, secciones 1–6 en `PENDIENTE` | `29ad1f4` |
| R3 | `f574a8c`: 6 aserciones, ningún par de anchos registrado | `ed690bf` |
| R4 | `1081ab5`: guarda de no regresión — rojo por mutación (ver abajo) | sin cambio de implementación |
| R5 | `96d41f6`: guarda de no regresión — rojo por mutación | sin cambio de implementación |
| R6 | `2a21c83`: guarda de no regresión — rojo por mutación | sin cambio de implementación |
| R7 | `3f7a34b`: 4 aserciones, ningún veredicto en el acta | `ac89c3e` |
| R8 | `6398777`: 5 aserciones, sección 7 en `PENDIENTE` | `f047195` |
| R9 | `be3d228`: el plan no citaba el acta | `9cbf676` |
| R10 | `714fee3`: guarda de no regresión — rojo por mutación | sin cambio de implementación |

Cada commit `test(...)` contiene **solo** archivos de test; cada commit
`feat(...)` contiene **solo** el acta o el plan. Ningún commit mezcla ambos.

### Por qué R4, R5, R6 y R10 no tienen commit `feat`

Son guardas de no regresión: nacen en verde porque afirman que algo que ya está
bien sigue estando bien (el mismo patrón que los `describe` de R12, R13 y R15
que ya viven en ese archivo desde la feature 25). Producir un `feat` para ellas
exigiría cambiar código que la spec prohíbe cambiar: R6 dice literalmente que
si una superficie no presenta defecto, "THE SYSTEM SHALL NOT cambiar ni una
clase de esa superficie".

Para que "verde por construcción" no se confunda con "vacuo", cada una se
comprobó **por mutación**: se rompió la fuente a propósito, se corrió el test,
se guardó la salida roja y se revirtió con `git checkout --` antes de commitear.
Salidas reales:

```
# R4 (mutando meta viewport, añadiendo w-[420px] a odc-detail y moviendo el
#     contenedor del slide al lienzo)
FAIL  ui-responsive-375 R4 > routes/__root.tsx conserva la meta viewport
FAIL  ui-responsive-375 R4 > solo el slide del PDF declara un ancho fijo mayor que el viewport
FAIL  ui-responsive-375 R4 > la excepción sigue condicionada al contenedor fuera de pantalla
      Tests  3 failed | 136 skipped (139)

# R5 (desapilando la fila de aprobación, mostrando una etiqueta de paginación,
#     quitando overflow-x-auto de table.tsx y poniendo MOBILE_BREAKPOINT = 0)
FAIL  ui-responsive-375 R5 > general-approval-actions.tsx apila la fila de acciones bajo sm
FAIL  ui-responsive-375 R5 > pagination.tsx oculta las etiquetas de página bajo sm
FAIL  ui-responsive-375 R5 > table.tsx conserva el wrapper con overflow horizontal
FAIL  ui-responsive-375 R5 > el sidebar sigue pasando a Sheet por debajo de 768px
      Tests  4 failed | 10 passed | 139 skipped (153)

# R6 (declarando --breakpoint-xs en styles.css y una variante min-[420px]:)
FAIL  ui-responsive-375 R6 > no se declara ningún breakpoint personalizado
FAIL  ui-responsive-375 R6 > las superficies vivas no inventan variantes de ancho propias
      Tests  2 failed | 6 passed | 164 skipped (172)

# R10 (metiendo un marcador de esta feature en odc-detail.test.tsx)
FAIL  ui-responsive-375 R10 > src/components/odc/odc-detail.test.tsx no contiene aserciones de esta feature
      Tests  1 failed | 19 passed | 182 skipped (202)
```

Tras cada mutación, `git status --short` quedó limpio antes del commit.

## El gate de R1: cómo se demostró que el viewport medía 375px

`resize_window` **no se usó**, ni como método principal ni como respaldo: es el
instrumento que falló en silencio el 2026-08-10. Se usó Playwright (chromium)
con `page.setViewportSize({ width: 375, height: 667 })` contra el stack completo
de `docker-compose` ya levantado (frontend `:3000`, backend `:3001`, Postgres
`:5432`). Salida literal, reproducible con
`pnpm --dir frontend exec playwright test responsive-375`:

```
R1 gate: {"innerWidth":375,"clientWidth":375,"devicePixelRatio":1,"sm":false,"md":false}
R3 /login: scrollWidth=375 clientWidth=375
R3 /: scrollWidth=375 clientWidth=375
R3 /tasks: scrollWidth=375 clientWidth=375
R3 /odcs/new: scrollWidth=375 clientWidth=375
R3 /odcs/7c2eb067-3e66-4432-9314-12a26f80795b: scrollWidth=375 clientWidth=375
R3 /monthly-summary: scrollWidth=375 clientWidth=375
```

Las lecturas 4 y 5 (`matchMedia('(min-width: 40rem)')` y `('(min-width: 48rem)')`
ambas en `false`) son el gate real: confirman que a 375px la app aplica solo las
clases base, sin `sm:` ni `md:`. `devicePixelRatio` es `1` porque chromium
headless no emula densidad de teléfono; R1 solo exige registrarlo y el layout de
Tailwind se decide en píxeles CSS.

## Medidas del acta (resumen; el detalle está en el acta)

- **R3** — las seis rutas:
  `document.documentElement.scrollWidth` = 375 y `clientWidth` = 375 en todas.
  16 observaciones en total (seis rutas más siete variantes de `/odcs/$id` y los
  estados transitorios). Cero elementos con borde derecho más allá del viewport
  fuera de un contenedor con `overflow-x`.
- **R7-1** `monthly-summary.tsx:287` (`grid-cols-3` sin prefijo): columnas de
  `92.3281 / 92.3281 / 92.3438px`; los tres importes del corte 2026-07 caben en
  una línea con `0px` de desbordamiento. **Correcto a 375px.**
- **R7-2** `odc-detail.tsx:40` (`grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]` sin
  prefijo): `118.797px / 178.203px` sobre 309px; desbordamiento `0px` en las 13
  `dt` y las 13 `dd`; la etiqueta más larga envuelve a 3 líneas sin truncarse.
  **Correcto a 375px.**
- **R7-3** `monthly-summary-slide.tsx:12` (`w-[1120px]`): `left` -1200,
  `right` -80; `scrollWidth` de la página = 375 con y sin el nodo en el árbol,
  o sea **0 px de contribución**. **Correcto a 375px.**
- **R8** — área táctil contra los 44 × 44px de MASTER §6: `SidebarTrigger`
  28 × 28, botón por defecto 309 × 32, enlace de folio 120.86 × 17, paginación
  `Siguiente` 36 × 32, enlace de página 32 × 32. **Ninguno llega.** Anotado como
  deuda con nombre y medida; no se corrigió (R8 y §Fuera de alcance lo prohíben).
- **R5 comprobado en vivo**, no solo en fuente: filas de acción con
  `flex-direction: column`, rejillas `sm:grid-cols-2` resueltas en una columna de
  309px, cabecera de columnas del dashboard en `display: none`, etiqueta
  `Siguiente` de paginación en `display: none`, wrapper de tabla con
  `overflow-x: auto` (`clientWidth` 309, `scrollWidth` 1244) y sidebar servido
  como `Sheet` de 281.25px.

## Decisiones discutibles

1. **Se añadió `frontend/e2e/responsive-375.spec.ts`, que la spec dejaba como
   método *recomendado*, no como requisito** (decisión abierta 1). Motivo: R1 es
   el gate de todo lo demás y exige demostrar 375px reales; `resize_window` está
   descartado por antecedente y la emulación de DevTools no deja rastro
   ejecutable. **No se añadió ningún gate nuevo**: `pnpm e2e` ya existía desde la
   instalación de Playwright, `vitest.config.ts` ya excluye `e2e/**`, y ni
   `pnpm test` ni `pnpm build` dependen del nuevo spec. Si el reviewer prefiere
   que el acta sea la única evidencia, el archivo se puede borrar sin tocar nada
   más; el acta queda igual de completa.

2. **El implementer levantó el acta en lugar de dejar solo el esqueleto.** R9
   dice que el esqueleto lo deja el implementer y el acta la levanta el leader.
   El encargo de esta sesión pedía explícitamente el acta rellenada y sin filas
   en `PENDIENTE`, y `tasks.md` describe el ciclo de R1/R3/R7/R8 como
   "(1) dejar la sección en `PENDIENTE` → (2) tomar la medición → (3)
   registrarla". Se siguió esa lectura: cada sección se commiteó primero en
   `PENDIENTE` (rojo) y después con la medición (verde). **Quien la levantó no
   cambia ni una medida**; si el leader prefiere repetir la sesión por su cuenta,
   el spec de Playwright la reproduce entera.

3. **La sección 8 del acta sigue en `PENDIENTE` y la guarda de R9 no la
   comprueba.** Es el veredicto humano: no se puede firmar desde aquí y ponerlo
   en verde desde un test sería falsificar el único gate que R9 existe para
   imponer. La guarda cubre las secciones 0 a 7; el resto lo cubre el reviewer,
   que según la propia R9 no aprueba el cierre "aunque `pnpm test` y `pnpm build`
   estén en verde" — que es exactamente el estado en que queda esta entrega.

4. **Hallazgo medido que NO se corrigió: el `grid-cols-3` del resumen aguanta
   seis cifras y no siete.** Con los datos observados los tres importes caben
   (`0px` de desbordamiento), pero sustituyendo el nodo por importes más largos
   con el mismo estilo, el valor desborda su columna de 92.33px en `10px`
   (`$1,425,400.00`), `19px` (`$12,345,678.90`) y `28px` (`$999,999,999.99`), sin
   envolver, porque un importe no tiene puntos de corte. **No se tocó**: R6
   prohíbe cambiar una clase de una superficie sin defecto observado, y el
   defecto no se observa con los datos de la aplicación. Queda anotado en el acta
   §6 como deuda con nombre y medida. Si el humano decide corregirlo, la
   corrección mobile-first es una sola clase base con `sm:` restaurando el valor
   actual, y no cambia nada a ≥ 640px — pero es decisión suya, no de esta
   feature.

5. **Se sembraron datos de desarrollo en Postgres para poder observar lo que R2
   exige.** La base no tenía órdenes en `PRESUPUESTO_APROBADO`,
   `COMPRA_APROBADA` ni `BORRADOR`, y el resumen mensual no llegaba a 10 compras,
   así que no había forma de ver ni `GeneralApprovalActions` ni
   `RegisterPaymentForm` ni la paginación que mide R8. Se insertaron
   `ODC-2026-00011` a `ODC-2026-00018` en la base del contenedor. **Es dato de
   desarrollo, no código**: no toca el repo, no toca migraciones y está listado
   en el acta §0 para que la sesión sea reproducible.

6. **No se tocó el test intermitente `general-approval-actions.test.tsx:163`.**
   Es deuda previa y ajena (R10). En esta sesión no falló: `pnpm test` pasó
   596/596 a la primera con la suite completa.

## Output de build

```
$ pnpm --dir frontend build
dist/server/server.js  172.53 kB │ gzip: 43.15 kB
✓ built in 1.01s

$ pnpm --dir backend build
> nest build
(sin errores)
```

## Output de tests

```
$ pnpm --dir frontend test
 Test Files  35 passed (35)
      Tests  596 passed (596)
   Duration  38.08s

$ pnpm --dir backend test
Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total

$ pnpm --dir frontend exec playwright test responsive-375
  2 passed (9.7s)
```

Aserciones nuevas de esta feature en `design-system.guardrails.test.ts`: 96, las
96 en verde.

## Notas para el reviewer

- **Lo importante que hay que mirar es el acta**, no el diff de código: el diff
  de aplicación es vacío a propósito. `progress/verify_ui-responsive-375.md`.
- **La sección 8 del acta necesita firma humana.** Es lo único que bloquea el
  cierre. La guarda de R9 no la comprueba, por diseño; está explicado en el
  comentario del propio test y en la decisión 3 de arriba.
- **Comprobar que las guardas nuevas no son vacuas.** Las de R4, R5, R6 y R10
  nacen en verde. La evidencia de mutación está arriba; se puede repetir en un
  minuto rompiendo cualquiera de las líneas citadas y revirtiendo.
- **Reproducir el gate de R1 en independiente**: con `docker-compose` arriba,
  `pnpm --dir frontend exec playwright test responsive-375 --reporter=list`
  imprime las cinco lecturas y los seis pares de anchos. Si `innerWidth` no sale
  375 o alguna `matchMedia` sale `true`, el acta entera se cae — es justo lo que
  R1 pretende.
- **Dos hallazgos quedan como deuda para decisión humana**, ninguno resuelto
  aquí: los 44px de área táctil (R8, ya previsto por la spec) y el margen del
  `grid-cols-3` del resumen (decisión 4, no previsto). Ambos con número y sitio.
- `feature_list.json` **no se tocó**: marcar `done` es del reviewer.
