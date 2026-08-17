# review: ui-responsive-375

Fecha: 2026-08-17
Feature 28, rango revisado `19bcea3..HEAD` (20 commits, `f914082` incluido).
Veredicto: **APROBADO**

Esta feature es de verificación: el resultado esperado es "no se rompió nada", y
un "no encontré defectos" mal medido es indistinguible de no haber mirado. Por
eso nada de lo que sigue se acepta de palabra: el gate de R1 se reprodujo en esta
sesión, las cuatro guardas nacidas en verde se rompieron a mano, y la separación
test/implementación se comprobó con `git show --stat`, no con los mensajes.

---

## Checklist C1 — Arnés

- [x] `./init.sh` termina con exit code 0 (ejecutado por el reviewer, output al final)

## Checklist C2 — Estado coherente

- [x] Solo 1 feature `in_progress` (28 `ui-responsive-375`); la 29 queda `pending`
- [x] `progress/current.md` describe la sesión activa
- [x] Árbol de trabajo limpio (`git status --short` vacío antes y después de la revisión)

## Checklist C3 — Arquitectura

- [x] No aplica violación posible: la feature **no tocó ni un archivo de aplicación**.
      `git diff --stat 19bcea3..HEAD` da 7 archivos: 2 de test
      (`frontend/e2e/responsive-375.spec.ts`, `frontend/src/design-system.guardrails.test.ts`)
      y 5 de documentación (`progress/` × 3, `specs/` × 2)
- [x] Cero cambios en `frontend/src/components/`, `frontend/src/styles.css`,
      `components/ui/`, rutas, cliente API y backend — que es el cierre que la
      tabla "Naturaleza de la feature" de la spec declara válido

## Checklist C4 — TDD

- [x] Cada R1–R10 tiene al menos un `describe` que lo nombra. Los diez viven en
      `frontend/src/design-system.guardrails.test.ts` con el prefijo
      `ui-responsive-375 R<n>:`, y R1/R3 además en
      `frontend/e2e/responsive-375.spec.ts`
- [x] **Ningún commit mezcla test e implementación.** Verificado uno a uno con
      `git show --stat`, no por el mensaje:

| Commit | Tipo | Archivos reales |
|---|---|---|
| `e116538` | test R1 | `e2e/responsive-375.spec.ts`, `design-system.guardrails.test.ts` |
| `b95e9ef` | feat R1 | solo `progress/verify_ui-responsive-375.md` |
| `c67c475` | test R2 | solo `design-system.guardrails.test.ts` |
| `29ad1f4` | feat R2 | solo el acta |
| `f574a8c` | test R3 | solo los dos archivos de test |
| `ed690bf` | feat R3 | solo el acta |
| `1081ab5` | test R4 | solo `design-system.guardrails.test.ts` (las 2 supresiones son una fusión de imports, no una aserción) |
| `96d41f6` | test R5 | solo `design-system.guardrails.test.ts` |
| `3f7a34b` | test R7 | solo `design-system.guardrails.test.ts` |
| `ac89c3e` | feat R7 | solo el acta |
| `6398777` | test R8 | solo `design-system.guardrails.test.ts` |
| `f047195` | feat R8 | solo el acta |
| `2a21c83` | test R6 | solo `design-system.guardrails.test.ts` |
| `be3d228` | test R9 | solo `design-system.guardrails.test.ts` |
| `9cbf676` | feat R9 | solo `progress/ui-redesign-plan.md` |
| `714fee3` | test R10 | solo `design-system.guardrails.test.ts` |
| `568373c` | docs | impl report + `tasks.md` + `traceability.md` |
| `74093c5` | refactor | solo comentarios de lint en los 2 archivos de test |
| `f914082` | docs | solo el acta (§8, veredicto humano) |

### Rojo→verde comprobado de forma independiente

R1, R2, R3, R7, R8 y R9 tienen par `test(...)` → `feat(...)`: el rojo es
estructural (el acta o su sección no existían todavía).

R4, R5, R6 y R10 cerraron **solo con commit `test(...)`**. El implementer los
declara guardas de no regresión con rojo demostrado por mutación. **No acepté esa
afirmación**: rompí yo mismo la fuente real y corrí `vitest run` sobre el archivo
de guardas. Ocho mutaciones, ocho rojos, y `git status --short` vacío tras
revertir cada una con `git checkout --`:

| Mutación aplicada por el reviewer | Guarda que cayó |
|---|---|
| `__root.tsx`: meta viewport → `content: 'width=980'` | `× R4 routes/__root.tsx conserva la meta viewport` |
| `odc-detail.tsx`: introducir `w-[420px]` sin prefijo | `× R4 solo el slide del PDF declara un ancho fijo mayor que el viewport` |
| `ui/table.tsx`: `overflow-x-auto` → `overflow-hidden` | `× R5 table.tsx conserva el wrapper con overflow horizontal` |
| `use-mobile.ts`: `MOBILE_BREAKPOINT = 768` → `0` | `× R5 el sidebar sigue pasando a Sheet por debajo de 768px` |
| `general-approval-actions.tsx:129`: desapilar la fila (`flex-col … sm:flex-row` → `flex-row`) | `× R5 general-approval-actions.tsx apila la fila de acciones bajo sm` |
| `styles.css`: declarar `--breakpoint-xs` | `× R6 no se declara ningún breakpoint personalizado` |
| `odc-detail.tsx`: introducir la variante `min-[420px]:` | `× R6 las superficies vivas no inventan variantes de ancho propias` |
| `odc-detail.test.tsx`: sembrar el marcador `ui-responsive-375` | `× R10 src/components/odc/odc-detail.test.tsx no contiene aserciones de esta feature` |

Las cuatro guardas nacidas en verde **no son vacuas**. Queda cerrado el punto.

## Checklist C5 — Trazabilidad

- [x] `specs/ui-responsive-375/traceability.md` sin ninguna fila "pendiente":
      las 10 filas tienen test y commit(s). Las cuatro sin `feat` lo declaran
      explícitamente con su razón, no como pendiente
- [x] Commits en formato `feat(<scope>): <desc> (R-ids)` / `test(...)` / `docs(...)`

## Checklist C6 — Spec aprobada

- [x] `requirements.md` con `status: approved` y `- [X] Aprobado por humano (fecha: 2026-08-17)`
- [x] **Ningún requisito se modificó después de aprobar**: `git log -- specs/ui-responsive-375/requirements.md`
      devuelve exactamente un commit, `19bcea3`, que es la propia aprobación

---

## Verificaciones específicas exigidas a esta revisión

### 1. R1 es el gate de todo lo demás — reproducido por el reviewer

Con el stack de `docker compose` arriba, corrí yo mismo
`pnpm --dir frontend exec playwright test responsive-375 --reporter=list`:

```
R1 gate: {"innerWidth":375,"clientWidth":375,"devicePixelRatio":1,"sm":false,"md":false}
R3 /login: scrollWidth=375 clientWidth=375
R3 /: scrollWidth=375 clientWidth=375
R3 /tasks: scrollWidth=375 clientWidth=375
R3 /odcs/new: scrollWidth=375 clientWidth=375
R3 /odcs/7c2eb067-3e66-4432-9314-12a26f80795b: scrollWidth=375 clientWidth=375
R3 /monthly-summary: scrollWidth=375 clientWidth=375
  2 passed (22.4s)
```

Idéntico a lo que declara el acta §0, hasta el id de la ODC. Tres puntos que
importan y que sí verifiqué:

- El método es `page.setViewportSize({ width: 375, height: 667 })`, no
  `resize_window`. El antecedente del 2026-08-10 fue un instrumento que no
  aplicaba el resize y devolvía `innerWidth` 1864 en silencio. Aquí el viewport
  por defecto de Playwright es 1280×720: **leer 375 es la prueba positiva de que
  el resize se aplicó**, no una afirmación de intención.
- `matchMedia('(min-width: 40rem)')` y `('(min-width: 48rem)')` salen las dos en
  `false`, que es el gate real de R1: a 375px la app aplica solo clases base.
- `expectGateHolds()` se vuelve a evaluar **dentro del bucle de las seis rutas**,
  no solo una vez al principio. Ninguna medición de R3 cuenta sin su cabecera.

El instrumento queda además re-ejecutable para siempre, que es lo que la
decisión abierta 1 de la spec dejaba a criterio del gate humano.

### 2. Las mediciones del acta son reales, no verosímiles

Recalculé la geometría contra la fuente. Los números no solo son plausibles:
caen en la retícula de 1/64px de Chromium y cuadran al píxel.

- **R7-1** `monthly-summary.tsx:287` es `grid grid-cols-3 gap-4 pt-5`. Sobre un
  contenido de 309px: 309 − 32 (dos `gap-4`) = 277 para tres columnas → 92.333,
  que Chromium reparte como `92.328125 / 92.328125 / 92.34375`. El acta registra
  `92.3281 / 92.3281 / 92.3438`. Exacto.
- **R7-2** `odc-detail.tsx:40` es
  `grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] … gap-3` sobre 309px:
  309 − 12 = 297, repartido 1:1.5 → 118.8 / 178.2 → `118.796875 / 178.203125`.
  El acta registra `118.797px / 178.203px`. Exacto.
- **§2** el `Sheet` del sidebar a 281.25px: `sheet.tsx` lleva
  `data-[side=left]:w-3/4` y su `sm:max-w-sm` no aplica a 375px → 375 × 0.75 =
  281.25 exacto. Ojo: `SIDEBAR_WIDTH_MOBILE` vale `18rem` (288px), así que 281.25
  solo se obtiene **midiendo**, no leyendo la constante.
- **§1** tarjeta de login 327px = 375 − 48 (`p-6`), y `max-w-sm` (384px) en efecto
  no llega a aplicarse. **§5** diálogo 343px = 375 − 32 (`max-w-[calc(100%-2rem)]`).

Las tres líneas que la spec señala como sospechosas están donde dice
(`monthly-summary.tsx:287`, `odc-detail.tsx:40`, `monthly-summary-slide.tsx:12`
con su `w-[1120px]`), y las tres reciben veredicto explícito en el acta.

### 3. Ninguna aserción ajena editada (R10)

Comprobado a nivel de git, que es más fuerte que la guarda: el rango completo
`19bcea3..HEAD` toca **7 archivos**, y ninguno es un test de superficie ni una
primitiva. En particular **no fueron tocados**:

- `general-approval-actions.test.tsx` (incluida la intermitente `:163` y la
  aserción en riesgo `/flex-col.*sm:flex-row/`)
- `primitives.tokens.test.tsx` (los `h-8` de la feature 23)
- los cuatro tests de la tabla de riesgo de `progress/ui-redesign-plan.md` §112:
  `executive-dashboard.test.tsx`, `general-approval-actions.test.tsx`,
  `monthly-summary.test.tsx`

El test intermitente **no falló** tampoco en mi ejecución: 596/596 a la primera
con la suite completa. No hay nada que imputar a esta feature.

### 4. Gate humano de R9

La sección 8 del acta trae `**APROBADO** — 2026-08-17` y declara en el propio
texto que **no la tecleó el humano**: es la transcripción por el leader de una
aprobación verbal, con cita literal («sí, así está bien») y commit dedicado
`f914082`, separado del resto de la entrega.

**Lo valoro con ese criterio y lo doy por bueno**, por tres razones: es el mismo
procedimiento aceptado en la feature 14; la propia acta declara su naturaleza en
lugar de disfrazarla de firma; y el alcance de lo aprobado está enumerado
(resultado de la auditoría + las dos deudas sin corregir), no es un "ok" en el
vacío. No es una casilla auto-marcada, que es el fallo que este harness ya
arrastra documentado. Si el humano quiere un gate más fuerte que la
transcripción, eso es un cambio de proceso del harness, no un defecto de esta
feature.

### 5. Deudas abiertas por decisión humana

Ambas están declaradas, con número, sitio y dueño. No se imputan como defecto:

1. **Área táctil < 44×44px** — acta §7, cinco rectángulos medidos
   (`SidebarTrigger` 28×28, botón por defecto 309×32, enlace de folio 120.86×17,
   paginación 36×32 y 32×32). Prevista por R8 y por §"Fuera de alcance".
   Dueño: el leader la lleva a decisión humana como feature aparte.
2. **`grid-cols-3` del resumen mensual a partir de 7 cifras** — acta §6, desborda
   10 / 19 / 28px con importes más largos; sin defecto con los datos reales.
   No prevista por la spec, pero anotada con medida y recogida en el veredicto
   humano §8 y en `ui-redesign-plan.md`. Dueño: decisión humana.

---

## Observaciones (defectos no bloqueantes)

Ninguno impide el cierre. Se listan para que el implementer los corrija, porque
el acta es el entregable de la feature y merece ser exacta.

**O1 — El acta §5 cita mal la clase viva de `GeneralApprovalActions`.**
La fila del estado `PRESUPUESTO_APROBADO` dice:

> `GeneralApprovalActions` | fila `flex-direction: column` (clase viva
> `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`)

Esa cadena **no existe en `general-approval-actions.tsx`**. La clase real es
`general-approval-actions.tsx:129`:
`"border-t flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"`.
La cadena citada pertenece a `odc-detail.tsx:90`, que es la cabecera de la
tarjeta de detalle (folio + badge), otro elemento y otro archivo.

Alcance del error: es una cita, no una medición. La afirmación medida
(`flex-direction: column` y botones a 309×32px) es correcta y reproducible —a
375px `sm` está apagado, cosa que verifiqué yo, y la clase real apila igual—, y
la guarda de R5 asserta la clase real del archivo real, no la citada. Ningún
veredicto cambia. Es un copy-paste, y es el único que encontré tras cruzar el
resto de la geometría del acta contra la fuente.

**O2 — `traceability.md` quedó desfasado tras `f914082`.**
La sección §"Pendiente del gate humano" sigue afirmando que la sección 8 del acta
"sigue en `PENDIENTE`". Dejó de ser cierto en el último commit del rango. La
tabla de trazabilidad —que es lo que exige C5— está correcta y sin filas
pendientes; lo desfasado es la prosa de debajo.

**O3 — `progress/current.md` sigue diciendo "implementación TDD en curso".**
Cosmético y propio del cierre de sesión, que es del leader.

---

## Output de `./init.sh` (ejecutado por el reviewer)

```
✓ built in 686ms
✅ Build exitoso

→ Ejecutando tests...
Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total

 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend
 Test Files  35 passed (35)
      Tests  596 passed (596)
   Duration  29.49s
✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 28/30 completadas | 1 pendientes

[exited with code 0]
```

---

## Conclusión

**APROBADO.** El entregable es el acta y el acta se sostiene: el gate de R1 lo
reproduje yo, las mediciones cuadran al píxel contra la fuente, las guardas
nacidas en verde caen cuando rompo el código que protegen, ningún commit mezcla
test e implementación, ninguna aserción ajena se tocó y `./init.sh` termina en
verde en mi máquina. El veredicto "a 375px no se rompe nada" está medido, no
supuesto.

Quedan O1 (cita equivocada en el acta §5), O2 y O3 como correcciones de
documentación para el implementer / el leader. El leader cierra la feature; el
reviewer no marca `done` en `feature_list.json`.
