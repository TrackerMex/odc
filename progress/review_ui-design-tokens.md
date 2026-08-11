# review: ui-design-tokens

Fecha: 2026-08-10
Feature: 23 `ui-design-tokens` (`in_progress`)
Rama: `ui-design-system-docs` · rango revisado: `3212483..HEAD` (11 commits)
Veredicto: **APROBADO** — con 2 correcciones de documentación obligatorias antes
de cerrar la sesión (no tocan código; son territorio del leader).

---

## Checklist C2 — Estado coherente

- [x] Solo 1 feature `in_progress` — `feature_list.json:131-132` (id 23). Las 22
      anteriores en `done`, ninguna otra abierta.
- [x] `progress/current.md` describe la sesión activa (feature 23, spec aprobada,
      fases 1+2). Ver observación O4: quedó desfasado en dos líneas.
- [x] `progress/history.md` tiene entrada de cada sesión cerrada (última:
      `odc-approval-self-check` extensión R4).
- [x] Árbol de trabajo limpio, sin cambios sin commitear (`git status` vacío).

## Checklist C3 — Arquitectura

Feature exclusivamente de frontend (tokens CSS + 9 primitivas de
`components/ui/`). No introduce ni toca capas `domain` / `application` /
`infrastructure`.

- [x] `backend/` sin un solo archivo modificado — `git diff --name-only 3212483..HEAD -- backend` vacío.
- [x] domain sin imports de infrastructure — n/a, no se tocó domain.
- [x] repositories/contratos en domain son interfaces puras — n/a.
- [x] application depende de interfaces — n/a.
- [x] infrastructure sin lógica de negocio — n/a.
- [x] Convenciones de frontend respetadas (`docs/conventions.md`): tests
      `*.test.ts(x)` junto al código, Vitest, `describe('R<n>: ...')`,
      componentes shadcn/ui reestilizados en su sitio, no reescritos.
- [x] Alcance respetado: `components/odc/` y `components/layout/` sin ningún
      cambio (`git diff --name-only` vacío para ambas), `ui/toast.tsx` intacto,
      `frontend/package.json` intacto.

## Checklist C4 — TDD

- [x] **Cada R1..R15 tiene al menos un test que lo nombra.** Verificado abriendo
      los tres archivos:
      - `frontend/src/styles.tokens.test.ts` — R1 (:108), R2 (:130), R3 (:161),
        R4 (:204), R5 (:249), R6 (:308), R14 (:333)
      - `frontend/src/components/ui/primitives.tokens.test.tsx` — R7 (:33),
        R8 (:62), R9 (:106), R10 (:135), R11 (:181), R12 (:200)
      - `frontend/src/design-system.guardrails.test.ts` — R13 (:25), R15 (:53)
      15/15 cubiertos, ninguno huérfano.

- [x] **Ningún commit mezcla `*.test.*` con código de producción.** Revisado
      archivo por archivo con `git show --name-status` en los 11 commits del
      rango (este repo ha fallado C4 tres veces; no se dio por bueno el reporte):

      | Commit | Tipo | Archivos |
      |---|---|---|
      | `aa31027` | test | solo `styles.tokens.test.ts` (A) |
      | `f038a70` | test | solo `styles.tokens.test.ts` (M) |
      | `e9401d9` | feat | solo `styles.css` (M) |
      | `e677d90` | test | solo `primitives.tokens.test.tsx` (A) |
      | `31c88a7` | feat | solo los 9 `.tsx` de `components/ui/` (M) |
      | `81f7ee7` | test | solo `design-system.guardrails.test.ts` (A) |
      | `d35bce8` | docs | `impl_*.md`, `tasks.md`, `traceability.md` |
      | `6e20170` | test | solo `styles.tokens.test.ts` (M) |
      | `a48404a` | feat | solo `styles.css` (M) |
      | `694385f` | docs | `impl_*.md`, `traceability.md` |
      | `32b4628` | docs | `MASTER.md`, `requirements.md` |

      Separación limpia. Ningún `feat` toca un test; ningún `test` toca
      producción; ningún `docs` toca ninguno de los dos.

- [x] **Rojo verificado empíricamente**, no aceptado del reporte. Se montó un
      worktree aislado (`git worktree add --detach`) con junction a
      `node_modules` y se corrió cada commit de test en su propio árbol:

      | Commit de test | Resultado medido | Reportado por el implementer |
      |---|---|---|
      | `aa31027` | **55 failed / 22 passed (77)** | 55/77 — coincide |
      | `e677d90` | **12 failed / 6 passed (18)** | 11/18 — ver O3 |
      | `6e20170` | **3 failed / 75 passed (78)**, los 3 de `--accent-action` | 3 rojos — coincide |

      El ciclo rojo→verde está probado, no afirmado.

- [x] Formato de commit correcto: `feat(ui-design-tokens): <desc> (R1,R2,...)` en
      los tres `feat`, `test(...)` con R-ids en los cinco de test.

- [x] **R14 nace en verde pero su test precede al feat que guarda**: `aa31027`
      (1.º) antes de `e9401d9` (3.º). Correcto.

- [ ] ⚠️ **R13 y R15: el commit de test NO precede a los feats que guardan.**
      `81f7ee7` es el 6.º commit del rango, posterior a `e9401d9` (3.º) y a
      `31c88a7` (5.º). Ver **D1** abajo: el hecho no invalida la guarda, pero
      dos documentos afirman lo contrario.

## Checklist C5 — Trazabilidad

- [x] `specs/ui-design-tokens/traceability.md` existe y **ninguna fila dice
      "pendiente"** — las 15 filas cerradas con test + hash(es).
- [x] Los hashes de cada fila existen y corresponden al commit que dice.
      Verificado contra `git log` uno a uno; los pares test/feat de R1–R12 y R14
      son los de la tabla de C4.
- [x] Las filas de R13 y R15 registran correctamente "guarda las
      implementaciones `e9401d9` y `31c88a7`" — la fila en sí es exacta; el
      defecto D1 está en la nota en prosa, no en la tabla.
- [x] La enmienda de R2 está trazada con sus dos hashes (`6e20170` test,
      `a48404a` feat) en las filas de R2 y R5.
- [x] Commits de la feature con el formato `feat(<scope>): <desc> (R-ids)`.

## Checklist C6 — Spec aprobada

- [x] `requirements.md` con `status: approved` en el frontmatter (línea 3).
- [x] Casilla firmada: `- [X] Aprobado por humano (fecha: 2026-08-10)` (línea 216).
- [x] Sección "Enmiendas posteriores a la aprobación" presente (líneas 199-212)
      con fecha, requisito, cambio y autorizador.
- [x] Casilla de la enmienda firmada: `- [X] Enmienda de R2 aprobada por humano
      (fecha: 2026-08-10)` (línea 217).
- [x] **Ningún otro requisito se modificó después de la aprobación.** Diff
      completo contra `3212483` (la spec tal como se aprobó): el único cambio
      normativo es una línea — `--accent-action` de `oklch(0.5960 0.1274 163.23)`
      a `oklch(0.5081 0.1049 165.61)` en la tabla de R2 — más la sección de
      enmiendas y la segunda casilla. R1, R3–R15 byte-idénticos.
- [x] `specs/ui-design-tokens/design.md` sin cambios desde la aprobación.
- [x] `tasks.md` solo cambió marcando checkboxes (`- [ ]` → `- [x]`); ninguna
      tarea añadida, borrada ni reescrita.
- [x] La enmienda está replicada en la fuente de verdad: `design-system/odc/MASTER.md`
      §1 tabla + nota "Enmienda 2026-08-10 (decisión humana)" (`32b4628`).

---

## Verificación de los 4 puntos que el implementer marcó como frágiles

### 1. La exención de chroma de `--accent-action` (0.1049) — JUSTIFICADA

El test **no se auto-exime**. R3, **tal como se aprobó** en `3212483` y sin
cambios desde entonces, escribe la exención dentro del propio requisito:

> "ningún token declarado en `:root` o en `.dark` distinto de `--status-*`,
> `--destructive` y `--accent-action` SHALL tener un chroma oklch mayor que `0.10`"

El regex del test (`styles.tokens.test.ts:194`,
`/^--(status-|destructive|accent-action)/`) es transcripción literal de esa
cláusula y está en el archivo desde el primer commit de test `aa31027`, es decir
**antes** de que existiera el conflicto R2/R5 y antes de la enmienda. No se
añadió para salvar el token. La exención es de la spec, no del test.

Margen real sin la exención: el token quedaría fuera por 0.0049. Es estrecho,
como avisa el implementer, pero el que decide es R3 y R3 lo nombra.

**Defecto documental asociado (D2)**: `requirements.md:212` afirma "El chroma
resultante (0.1049) sigue cumpliendo la restricción de R2 de `> 0.10`". La frase
está mal dos veces: la restricción es de **R3**, no de R2; y 0.1049 **no**
cumple el tope de 0.10 — pasa únicamente porque R3 exime a `--accent-action`.
Es prosa de la enmienda, no afecta a código ni a tests, pero deja escrito en la
spec justo lo contrario de por qué el token es legal.

### 2. Composición de alpha en sRGB codificado — MÉTODO CORRECTO

Es el método del navegador, no el que hace pasar el test. Verificado con una
implementación **propia**, escrita desde cero para esta revisión:

| Método | `dark --destructive` sobre `--destructive/10` compuesto sobre `--card` |
|---|---|
| Composición en sRGB **codificado** (la del test) | **5.262** |
| Composición en luz **lineal** | 3.986 |
| Simulación de rasterizado a **8 bits** (lo que realmente pinta el navegador) | **5.279** |

Los navegadores componen el alpha de `background-color` en el espacio de
dispositivo sRGB con gamma, no en luz lineal — es el clásico "blending
gamma-incorrecto". La simulación a 8 bits lo confirma numéricamente:
`rgb(255,102,105)` al 10% sobre `rgb(20,28,44)` da `rgb(44,35,50)`, que contra
el destructive mide 5.279:1. El test luego calcula la luminancia relativa sobre
canales **linealizados**, que es lo que exige WCAG 2.1. Las dos mitades del
cálculo son correctas y el 3.99 es efectivamente artefacto del método.

**Comprobación extra no pedida**: el test recorta los oklch fuera de gamut por
**clamp en espacio lineal**, no con el gamut mapping por reducción de chroma de
CSS Color 4. Seis tokens están fuera de gamut (3 surfaces claras, 3 foregrounds
oscuros). Recalculé los 16 pares de estado con gamut mapping real: el clamp
resulta **conservador** (subestima), ningún par baja de 4.5 y el peor sigue
siendo `light --status-rejected` en 4.617. El atajo no fabrica ningún aprobado.

### 3. Los valores de `.dark` y los 16 `--status-*-surface` — CUMPLEN

Recalculé **los 26 pares de R5** con mi propio conversor. Ninguno por debajo de
4.5:1:

- Claro: `status-rejected` 4.617 (peor), `status-pending` 4.687,
  `muted-foreground/card` 4.759, `status-approved` 4.787, `status-evidence` 4.982,
  `status-done` 5.110, `accent-action` 5.253, `status-budget` 5.513,
  `status-paid` 6.555, `status-draft` 6.950, `primary-foreground/primary` 11.016,
  `foreground/background` 17.065, `foreground/card` 17.852.
- Oscuro: `muted-foreground/card` 6.669, `primary-foreground/primary` 7.411,
  `status-rejected` 7.474, `status-paid` 7.685, `status-approved` 7.827,
  `status-pending` 8.001, `status-draft` 8.088, `status-budget` 8.123,
  `accent-action` 8.134, `status-evidence` 8.141, `status-done` 8.181,
  `foreground/card` 16.279, `foreground/background` 17.941.

Invariante de chroma de R3: se cumple en los dos bloques. Máximo chroma no
exento — `:root` `--primary` 0.0736, `.dark` `--primary`/`--ring`/`--sidebar-*`
0.0692. Todos los demás por debajo.

Rol semántico conservado (Inverted Ledger Rule):
- `.dark` redeclara los 12 tokens semánticos de R2 (verificado por el test y a
  mano en `styles.css:70-120`).
- Superficies claras = tintes casi blancos (L 0.974–0.985) del **mismo hue** que
  su foreground; superficies oscuras = tintes oscuros (L 0.29) del mismo hue.
  El rol texto/fondo no se invierte por accidente en ningún par.
- `--sidebar-primary` es alias de `--primary` en `.dark` (`styles.css:114`) y el
  violeta huérfano `oklch(0.488 0.243 264.376)` ya no aparece en el archivo.
- `--accent-action` en dark mantiene el rol invertido (superficie verde clara
  `oklch(0.7227 0.1394 165.61)`, texto navy), igual patrón que `--primary`.
- Coherencia con la enmienda: `:root --accent-action` es **exactamente**
  `--status-done`, y hay un test que lo fija (`styles.tokens.test.ts:156`).

### 4. R13/R14/R15 nacidos en verde — SOLO R14 CUMPLE EL ORDEN

Orden real del rango (del más antiguo al más nuevo):
`aa31027` → `f038a70` → `e9401d9` → `e677d90` → `31c88a7` → **`81f7ee7`** → ...

- **R14**: test en `aa31027` (1.º), feat en `e9401d9` (3.º). El test precede.
- **R13 y R15**: test en `81f7ee7` (6.º), posterior a `e9401d9` (3.º) y a
  `31c88a7` (5.º). **El test NO precede a los feats que guarda.**

Materialidad medida, no supuesta: monté el árbol pre-feature (`3212483`) y le
inyecté el `design-system.guardrails.test.ts` de `81f7ee7`. Resultado:
**18/18 en verde**. La guarda es verde a ambos lados de los feats, así que nunca
hubo un ciclo rojo→verde que invertir y su poder discriminante (vallar
regresiones futuras) es idéntico esté donde esté. Por eso C4 se da por cumplido
en lo sustantivo: el requisito del checkpoint es que el historial muestre el
patrón test-primero donde hay ciclo, y lo muestra en los 13 requisitos que lo
tienen.

Lo que sí falla es la **exactitud de la documentación** → defecto D1.

---

## Defectos

### D1 (bloquea la documentación, no el código) — afirmación falsa sobre el historial

Dos documentos afirman algo que `git log` desmiente:

- `progress/impl_ui-design-tokens.md:243-244`: "Sus commits de test son
  igualmente previos a la implementación que guardan."
- `specs/ui-design-tokens/traceability.md:44`: "Su commit de test es igualmente
  previo al commit de implementación que guardan."

Es cierto para R14, **falso para R13 y R15** (`81f7ee7` es posterior a `e9401d9`
y a `31c88a7`). Corrección: acotar la frase a R14 y decir de R13/R15 que su
guarda se añadió después de los feats, lo cual es admisible porque es verde en
ambos estados (comprobado 18/18 sobre `3212483`). `traceability.md` es el
registro auditable de este arnés; no puede contener una afirmación desmentible
con un `git log`.

### D2 (bloquea la documentación) — la enmienda justifica mal el chroma

`specs/ui-design-tokens/requirements.md:212`: "El chroma resultante (0.1049)
sigue cumpliendo la restricción de R2 de `> 0.10`."

Es R3, no R2; y 0.1049 no cumple el tope, pasa por la exención nominal que R3
concede a `--accent-action`. Corrección: "El chroma resultante (0.1049) supera
el tope de 0.10, y es legal porque R3 exime nominalmente a `--accent-action`."

Ninguno de los dos exige tocar código, tests ni volver a pasar por el gate de
aprobación: son correcciones de prosa en archivos que el leader edita él mismo.

---

## Observaciones (no bloquean)

- **O1** — El reporte del implementer termina con "Pendiente para el leader: la
  enmienda vive en el working tree sin commitear". **Está desfasado**: la
  enmienda se commiteó en `32b4628` (`requirements.md` + `MASTER.md`) y el árbol
  está limpio. Conviene borrar esa nota para que nadie la persiga.
- **O2** — Sin verificación visual en navegador (Playwright exige el stack con
  Postgres arriba). Ningún R la exige y los 15 requisitos están cubiertos por
  tests, pero los cambios de densidad se juzgan mirando: padding de tarjeta
  1.25rem→1rem, fila de tabla 2.5rem→2.25rem y `ring-1`→`border` (suma 1px de
  caja). Recomendación, no condición.
- **O3** — El reporte dice "11/18 en `e677d90`"; medido son **12/18**. Rojo
  igualmente sólido, solo un conteo impreciso.
- **O4** — `progress/current.md` sigue con `reviewer: —` y conserva el
  recordatorio "verificar a mano que requirements.md termina con
  `- [ ] Aprobado por humano` sin marcar", ya superado. Es archivo del leader.
- **O5** — `TableHeader` sticky no se aprecia aún (el contenedor solo desborda
  en X). Techo conocido y declarado en `design.md`; R10 solo exige la clase, que
  está puesta y testeada.
- **O6** — `dialog.tsx` y `select.tsx` llevan `duration-100` en su animación de
  apertura, por debajo de los 200ms que sugiere MASTER §5. **No es defecto**:
  era preexistente, R12 manda "conservar la animación de apertura existente" y
  R14 acota los 150–300ms a transiciones de hover y foco (input, select-trigger
  y textarea llevan `duration-200`, dentro de rango).
- **O7** — El detector de color literal de R15 no reconoce `oklch(...)` ni
  `rgb(...)` crudos, solo hex y clases de paleta Tailwind. Suficiente para lo
  que R15 pide; anotado por si la fase 3 se apoya en él.
- **O8** — Las líneas que cita la tabla de R13 en la spec están desplazadas en 1
  respecto al archivo real (272→273, 86→87, 139→140). Precede a esta feature
  (esos archivos no se tocaron); el test ancla por contenido, no por línea, así
  que la guarda es correcta igualmente.

---

## Output de `./init.sh`

```
→ Ejecutando build...
✓ built in 684ms
✅ Build exitoso

→ Ejecutando tests...
> backend@0.0.1 test
> jest
Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total
Snapshots:   0 total
Time:        6.673 s

> frontend@ test
> vitest run "--passWithNoTests"
 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend
 Test Files  35 passed (35)
      Tests  328 passed (328)
   Duration  19.75s
✅ Tests pasados

→ Lint...
> backend@0.0.1 lint
> eslint "{src,apps,libs,test}/**/*.ts" --fix
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 22/23 completadas | 0 pendientes

EXIT=0
```

## Verificación independiente desde `frontend/`

```
pnpm build → ✓ built in 787ms                    (exit 0)
pnpm test  → Test Files 35 passed (35)
             Tests      328 passed (328)          (exit 0)
```

**Confirmado**: 328/328 y build por debajo del segundo, igual que reportó el
implementer (871ms). El flake de `general-approval-actions.test.tsx:163` no
apareció en ninguna de las dos pasadas completas (init.sh + `frontend/`).

Baseline pre-feature: 32 archivos / 214 tests. Ahora 35 / 328: +3 archivos y
+114 tests, ningún test preexistente modificado (verificado: `components/odc/`
sin diff en todo el rango). Sin regresiones.

---

## Veredicto

**APROBADO.** El código cumple los 15 requisitos, la disciplina TDD está probada
empíricamente comprobando el rojo en los tres commits de test, ningún commit
mezcla tests con producción, la trazabilidad no tiene filas pendientes, la spec
está aprobada y su única enmienda posterior está firmada y correctamente
acotada a R2. Los tres puntos frágiles que señaló el implementer (exención de
chroma, composición de alpha, valores derivados de `.dark`) resisten la
verificación independiente: la exención la concede la spec, el método de
composición es el del navegador y los 26 pares de contraste dan de 4.617 a
17.941.

Queda pendiente **antes de cerrar la sesión** corregir D1 y D2: dos frases
falsas, una en `traceability.md` y otra en `requirements.md`, que no afectan al
comportamiento pero corrompen el registro auditable. Son ediciones de prosa en
archivos del leader; no reabren el gate de aprobación ni requieren volver al
implementer.

**No se marca la feature como `done` en `feature_list.json`** — eso lo hace el
leader tras leer este informe.
