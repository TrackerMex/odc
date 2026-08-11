# review: ui-surfaces-dashboards (feature 25)

Fecha: 2026-08-11
Rango revisado: `1f4884b..064ff4c` (rama `ui-design-system-docs`, sin push)
Veredicto: **APROBADO CON RESERVAS** — el trabajo del implementer (R1–R13, R15)
está correcto. La feature **no puede marcarse `done` todavía**: R14 sigue abierto
por diseño y C5/C6 dependen de él.

> Nota de contexto: el brief de review decía que `progress/impl_ui-surfaces-dashboards.md`
> no existía y que la trazabilidad la había reconstruido el leader. Durante esta
> review el implementer se reanudó y añadió `879624d` (fix de R7) y `064ff4c`
> (reporte + trazabilidad corregida). Este review juzga el estado en `064ff4c`, y
> aun así verificó el código y los commits directamente, sin fiarse del reporte.

---

## Verificación independiente ejecutada

| Comando | Resultado |
|---|---|
| `./init.sh` | **exit 0**. Backend 471/471, frontend 469/469, lint sin errores, build de backend y frontend en verde |
| `pnpm test` (frontend, aislado) | **37 archivos / 469 tests, 469 passed** |
| `pnpm build` (frontend, aislado) | **✓ built in 1.26s**, sin warnings de error |
| `git status` | limpio |

`general-approval-actions` **no falló** en ninguna de las tres ejecuciones
(la del reviewer aislada, la de `init.sh`, y la del implementer). El flaky
conocido no apareció.

---

## Checklist C1 — Harness completo

No aplica (no es la primera feature). `./init.sh` termina en exit 0: verificado.

## Checklist C2 — Estado coherente

- [x] Máximo una feature en `in_progress` — solo `ui-surfaces-dashboards` (id 25).
      Verificado sobre `feature_list.json`: 29 features, 24 `done`, 1 `in_progress`.
- [ ] **`progress/current.md` describe la sesión activa** → **FAIL**. Ver defecto **D3**.
- [x] `progress/history.md` — no aplica: la sesión 25 no está cerrada.
- [x] `feature_list.json` **no** fue tocado por el implementer (id 25 sigue
      `in_progress`). Correcto: marcarlo es del leader tras la aprobación.

## Checklist C3 — Arquitectura

- [x] Todo el cambio vive en la capa de presentación (`frontend/src/components/odc/`).
      Ningún archivo de `domain`, `application` ni `infrastructure` tocado; ningún
      archivo de `backend/`. Verificado con `git diff --name-only 1f4884b..HEAD`:
      16 archivos, todos en `frontend/src/components/odc/`,
      `frontend/src/design-system.guardrails.test.ts`, `progress/` y `specs/`.
- [x] Ningún contrato de `lib/odc.ts` ni llamada de `lib/api.ts` modificado.
- [x] La regla de dependencia hacia adentro no se ve afectada.

## Checklist C4 — TDD (el que falló 3 veces en este repo)

- [x] **Ningún commit `feat(...)` toca un `*.test.ts(x)`.** Verificado commit a
      commit con `git log --stat`:

  | Commit | Tipo | Archivos tocados | ¿Mezcla? |
  |---|---|---|---|
  | `5ddeca0` | test | `odc-status-badge.test.tsx`, `design-system.guardrails.test.ts` | no |
  | `1811136` | feat | `odc-status-badge.tsx` | **no** |
  | `f1373cc` | test | 5 × `*.test.tsx` | no |
  | `4240a1d` | feat | 5 × `*.tsx` | **no** |
  | `384162e` | test | `odc-dashboard.test.tsx`, guardrails | no |
  | `9994dd9` | feat | 5 × `*.tsx` | **no** |
  | `19a0da0` | test | 5 × `*.test.tsx` | no |
  | `749946e` | feat | 5 × `*.tsx` | **no** |
  | `494fdf7` | test | 5 × `*.test.tsx`, guardrails | no |
  | `fe84b91` | feat | 5 × `*.tsx` | **no** |
  | `99036cd` | test | guardrails | no |
  | `595158f` | feat | `progress/verify_…md` | **no** |
  | `879624d` | fix | 3 × `*.tsx` | **no** (pero sin test — ver **D1**) |

  Seis pares `test → feat` limpios, en orden cronológico correcto. **C4 pasa por
  segunda vez consecutiva en este repo.**

- [x] Cada `R<n>` tiene al menos un test que lo nombra. Verificado uno a uno
      contra los archivos (ver §Trazabilidad).
- [x] Las guardas que "nacen en verde" (R12, R13, R15) están declaradas como
      tales en el cuerpo de `99036cd` y en comentario dentro del propio archivo
      (`design-system.guardrails.test.ts:5-7` y `:247-249`). **R14 sí estuvo rojo**:
      el test de existencia del acta se escribió en `99036cd` y el archivo
      `progress/verify_ui-surfaces-dashboards.md` no nació hasta `595158f`. Es
      comprobable en el historial, no hay que creérselo.
- [x] Las guardas born-green llevan su propia comprobación de no-vacuidad
      (`el detector de color literal no es vacuo` y `la auditoría no es vacua:
      encuentra los valores que la feature sí fija`). Sin eso serían tests que
      pasan siempre; con eso son auditables.
- [ ] Excepción: `879624d` no nace de un ciclo rojo-verde **y no deja guarda**.
      Ver **D1**.

## Checklist C5 — Trazabilidad

- [x] `specs/ui-surfaces-dashboards/traceability.md` existe.
- [x] Los 15 nombres de test de la tabla **existen de verdad**, verificados
      abriendo los archivos (ver §Trazabilidad, fila a fila).
- [x] Los hashes de la tabla existen en el log y corresponden al requisito
      declarado (verificado con `git log --stat` por commit).
- [x] `879624d` **sí** está registrado en la fila de R7 (lo añadió `064ff4c`).
      En la versión que el leader dejó en `8fd4cc5` faltaba: quedó corregido.
- [x] Formato de commit `<tipo>(<scope>): <desc> (R…)` en los 14 commits.
- [ ] **Fila R14 marcada "Abierto"** → C5 **no cierra**. Es deliberado y no es
      defecto del implementer (el alcance que se le dio excluía la sesión de
      navegador), pero **bloquea el `done`**.

## Checklist C6 — Spec aprobada

- [x] `specs/ui-surfaces-dashboards/requirements.md` con `status: approved`.
- [x] Casilla humana marcada con fecha: `- [X] Aprobado por humano (fecha: 2026-08-11)`
      (línea 324). Verificada a mano en el archivo, no por reporte.
- [x] Ningún requisito modificado tras la aprobación: `git diff 1f4884b..HEAD --
      specs/ui-surfaces-dashboards/requirements.md` está vacío. Solo cambiaron
      `tasks.md` (casillas) y `traceability.md`.
- [ ] R14 exige veredicto humano afirmativo antes del cierre. Sigue PENDIENTE.

---

## Requisito a requisito

### R1 — El badge consume los 8 pares `--status-*` — **PASS**

`odc-status-badge.tsx:9-18`: el mapa son exactamente 8 líneas
`bg-status-<x>-surface text-status-<x>`, en el orden de la tabla del MASTER.

- **Cero clases de paleta Tailwind**: `grep "bg-slate\|amber\|sky\|blue\|violet\|cyan\|emerald\|red"` → sin resultados.
- **Cero variantes `dark:`**: `grep "dark:" odc-status-badge.tsx` → exit 1, sin
  una sola aparición. El SHALL NOT más importante de R1 se cumple.
- **No declara tokens ni toca `styles.css`**: confirmado por `git diff --name-only`.
- **Las utilidades existen de verdad**, no solo en el fuente. Verificado en el CSS
  compilado (`frontend/dist/client/assets/styles-BeepKjg4.css`), 23 reglas:
  ```
  .bg-status-draft-surface{background-color:var(--status-draft-surface)}
  .text-status-draft{color:var(--status-draft)}
  … los 8 pares completos …
  ```
  Esto descarta el fallo silencioso clásico (clase escrita, utilidad inexistente,
  badge sin color y test verde porque solo mira el `className`).

### R2 — Contrato accesible del badge — **PASS**

`odc-status-badge.tsx:28-38` conserva `data-status={status}`, `statusLabel(status)`
como contenido visible, `border-0`, y
`transition-[background-color,color] duration-150 ease-out motion-reduce:transition-none`.
El radio `--radius-badge` lo aporta la primitiva: verificado en el CSS compilado
(`.rounded-badge{border-radius:.25rem}`) y afirmado por
`odc-status-badge.test.tsx:70`.

El test `es una etiqueta informativa, nunca un control` (`:58-64`) afirma
`tagName === 'SPAN'`, `role` nulo y `tabindex` nulo. Cubre bien la parte "nunca un
control" de R2. La regla "el color nunca comunica solo" queda cubierta porque
`textContent === statusLabel(status)` se afirma para los 8 estados (`:51-56`).

### R3 — `max-w-[1400px]` + `p-4 sm:p-6` — **PASS**

`grep max-w-7xl\|max-w-5xl\|lg:p-8` sobre los seis archivos → **cero resultados**.
Las 6 apariciones de `max-w-[1400px]` están en:
`odc-dashboard.tsx:162`, `admin-dashboard.tsx:129`, `general-dashboard.tsx:28`,
`executive-dashboard.tsx:456` y `:478` (el `Loading`), `executive-tasks.tsx:91`.
Los seis `main` conservan `min-w-0 flex-1`.

`executive-tasks.tsx` **sí** pasó a `max-w-[1400px]` (decisión humana 1). Si en
pantalla no se sostiene, la salida es enmendar `pages/dashboard.md`, no este código.

### R4 — Header a un escalón, sin párrafo — **PASS, y sin trampa al test**

Los 5 `h1` a `text-2xl`; `grep text-3xl\|text-4xl` sobre los seis archivos → cero.
Los 5 párrafos descriptivos borrados, verificado en el diff de `4240a1d`:
- `odc-dashboard.tsx`: "Consulta tus órdenes activas y continúa cada compra…"
- `executive-tasks.tsx`: "Prioriza las órdenes más antiguas…"
- `executive-dashboard.tsx`: el campo `roleCopy.description` **y su tipo**, para
  los tres roles, en el mismo commit. `roleCopy` queda como
  `Record<ExecutiveDashboardRole, { label: string }>`.

**Comprobación de honestidad exigida por el brief** (`executive-dashboard.test.tsx:143`,
hoy `:217` tras la inserción de 74 líneas encima):

```js
const header = screen.getByRole('region', { name: /resumen ejecutivo/i })
expect(header.textContent).toMatch(/operaciones/i)
```

El texto sale del **eyebrow de rol preexistente** `<p>{copy.label}</p>`
(`executive-dashboard.tsx:114-116`), que ya estaba ahí antes de la feature y que
R4 obliga explícitamente a conservar. El campo borrado era `description`
("Revisa lo que bloquea el flujo…"), que **no contiene la palabra "operaciones"**.
**No hay nodo artificial, no hay texto movido de sitio, no hay rescate del test.**
El diff de ese archivo es `+74 / -0`: no se editó ni una línea existente.

### R5 — Tracking de label `0.06em` — **PASS**

`grep "tracking-\[0.1"` sobre los seis → cero (ninguno de `0.1em`, `0.12em`,
`0.14em`, `0.18em`). Recuento de `tracking-[0.06em]`:
odc 2 + admin 2 + general 2 + executive 7 + tasks 1 = **14**, exactamente las 14
apariciones que R5 enumera. `0.06em` está escrito en `MASTER.md:125` y
`pages/dashboard.md:21`.

### R6 — Densidad de los CTA (D-V3) — **PASS**

`grep "size: 'lg'\|size=\"lg\""` sobre los seis → cero.
`odc-dashboard.tsx:175` y `:180` usan `size: 'sm'`, que es lo que prescribe
`pages/dashboard.md:22`. Ninguna clase de foco alterada: los `Link` siguen
saliendo de `buttonVariants` sin override, y `components/ui/button.tsx` no se tocó.
El test de render afirma la ausencia de `h-9` (altura del `lg`) y la presencia de
`focus-visible:ring` — que es lo máximo que jsdom puede afirmar. Los 36→32px reales
son la sección 2 de R14.

### R7 — Barras de acento, radio, padding y estado vacío — **PASS con reserva (D1)**

Las 7 tarjetas de cola homogénea llevan `border-l-2` + su token, con el mapa de
`design.md`:
`odc-dashboard.tsx:62-67` (rejected/draft/approved/evidence),
`admin-dashboard.tsx:40-43` (pending/paid),
`general-dashboard.tsx:17` (`QUEUE_ACCENT = 'border-l-status-budget'` como
**constante local**, no derivada de `page.items[0].status` — correcto: una cola
vacía sigue teniendo color, y el test lo afirma renderizando `page([])`).

Las 7 utilidades `border-l-status-*` compilan a CSS real (verificado en el bundle).

**SHALL NOT verificado**: `executive-dashboard.tsx:149` (`Prioridad inmediata`) y
`executive-tasks.tsx:117` (`Tareas accionables`) no llevan `border-l-`. Ambos con
test propio que lo afirma (`not.toMatch(/border-l-/)`). Decisión humana 2 respetada.

`min-h-20` en los 5 estados vacíos, conservando `border-dashed` y su mensaje.
Radio `--radius-card` vía la primitiva `Card` (`.rounded-card{border-radius:.625rem}`
en el CSS compilado).

**Padding `1rem` con `pb-3`**: la primitiva aporta `px-(--card-spacing)` = 1rem.
El `pb-3` necesitó `!` — ver **D1** y **D2** abajo. Verifiqué el diagnóstico yo
mismo en el CSS compilado y **es correcto**:

```css
.\[\.border-b\]\:pb-\(--card-spacing\).border-b{padding-bottom:var(--card-spacing)}   /* (0,2,0) */
.pb-3{padding-bottom:calc(var(--spacing) * 3)}                                        /* (0,1,0) — pierde */
.pb-3\!{padding-bottom:calc(var(--spacing) * 3)!important}                            /* gana */
```

Sin el `!`, el `pb-3` que R7 exige quedaba **inerte** y el header seguía a 1rem
abajo. El fix es real, no cosmético.

### R8 — Contadores `text-2xl` — **PASS**

`grep text-3xl` sobre los seis → cero. Los 4 contadores a `text-2xl tabular-nums`:
`odc-dashboard.tsx:103-112`, `admin-dashboard.tsx:77`, `general-dashboard.tsx:58`,
`executive-dashboard.tsx:162`. La excepción de `RECHAZADA` está implementada como
ternario sobre `status` (`odc-dashboard.tsx:106-108`) y afirmada por el test
`el contador baja de escalón y solo se tiñe cuando la cola está bloqueada`, que
comprueba **las dos ramas**: `Rechazadas` → `text-status-rejected`,
`Borradores` → `text-muted-foreground`. Test bien construido.

### R9 — Filas más densas — **PASS**

`py-2` en las tres listas de una línea (`odc:123`, `admin:90`, `general:74`);
`py-3` en las dos multilínea (`executive:188`, `tasks:135`), ninguna `py-4`.
Conservados: subrayado del folio en hover (`group-hover:underline`), importe con
`font-medium tabular-nums`, anillo `focus-visible:ring-3 focus-visible:ring-ring/30`.
Los cinco tests afirman además la **ausencia** de
`hover:bg-|hover:shadow|translate-y|scale-|cursor-pointer` sobre fila y enlace —
que es exactamente el SHALL NOT de MASTER §4/§8.

### R10 — Cero `rounded-xl` / `rounded-2xl` — **PASS**

`grep "rounded-xl\|rounded-2xl"` sobre los seis → **cero**, contra las 15
apariciones del inventario. Sustituidas por `rounded-card` (tarjetas, contenedores
de sección, estados vacíos) y `rounded-(--radius)` (chip de mes y envoltorios de
foco de los `Link`), que es el reparto que R10 pide.

### R11 — Cero color literal — **PASS**

El detector `LITERAL_COLOR` se aplica a los seis archivos con `it.each(SURFACES)`.
Verificado además a mano el punto concreto que pedía el brief:
`executive-dashboard.tsx:346` y `:350` pasaron de
`border-amber-200 dark:border-amber-900/60` → **`border-status-pending/50`**, y de
`text-amber-600 dark:text-amber-400` → **`text-status-pending`**. Compilan a CSS real:
```css
.border-status-pending\/50{border-color:color-mix(in oklab, var(--status-pending) 50%, transparent)}
.text-status-pending{color:var(--status-pending)}
```
`monthly-summary-slide.tsx` conserva sus literales y sigue siendo el calibrador de
no-vacuidad del detector. El único `dark:` que queda en las superficies es
`dark:ring-foreground/10` (`executive-dashboard.tsx:270`), que es un **token**, no
un color literal, y está fuera de la prohibición de R1 (que aplica al mapa del badge).

### R12 — Las 6 aserciones en riesgo — **PASS, verificado una a una**

`git diff --numstat` sobre los 4 archivos de test preexistentes:
**`+86/-0`, `+74/-0`, `+76/-0`, `+126/-0`. Cero líneas borradas.** Materialmente
imposible que se editara una aserción.

| # | Aserción | Estado |
|---|---|---|
| 1 | `executive-dashboard.test.tsx` `toMatch(/focus-visible:ring/)` | intacta, hoy en `:347` |
| 2 | `executive-dashboard.test.tsx` `querySelector('[class*="motion-reduce"]')` | intacta, `:348` |
| 3 | `executive-dashboard.test.tsx` `expect(header.textContent).toMatch(/operaciones/i)` | intacta, `:217`. **Verificada en profundidad — ver R4** |
| 4 | `general-dashboard.test.tsx` `main` contiene `min-w-0` | intacta, `:160` |
| 5 | `general-dashboard.test.tsx` `toMatch(/flex-col.*sm:flex-row/)` | intacta, `:163` |
| 6 | `general-dashboard.test.tsx` `getAllByText('Dirección General')` → 2 | intacta, `:164` |

Sobre la #6: sigue devolviendo exactamente 2 porque las dos apariciones son el
eyebrow de página (`general-dashboard.tsx:31`) y el de la tarjeta (`:48`). La barra
de acento se añadió al `CardHeader` **sin tocar el eyebrow de la tarjeta**, que era
justo el riesgo anotado. No hay tercera aparición.

Además, las seis quedan guardadas por
`design-system.guardrails.test.ts::ui-surfaces-dashboards R12`, que las afirma como
**subcadena literal del archivo de test**: si alguien las borra en la feature 26, ese
test se pone rojo. Es la forma correcta de guardar una no-regresión de este tipo.

### R13 — Los tests afirman invariantes — **PASS**

La auditoría extrae de los 7 archivos de test todo valor arbitrario de Tailwind
(`…-[<número><unidad>]`) y exige que aparezca literalmente en `MASTER.md` o
`pages/dashboard.md`. Comprobé la fuente normativa a mano: **todos los valores que
los tests fijan están escritos ahí**:

| Valor fijado en test | Dónde está escrito |
|---|---|
| `max-w-[1400px]` | `pages/dashboard.md:9`, `MASTER.md:158` |
| `tracking-[0.06em]` | `pages/dashboard.md:21`, `MASTER.md:125` |
| `text-2xl` (h1 y contador) | `pages/dashboard.md:18` y `:26` |
| `size="sm"` | `pages/dashboard.md:22` |
| `pb-3` / `1rem` | `pages/dashboard.md:32` |
| `min-h-20` | `pages/dashboard.md:34` |
| `py-2` | `pages/dashboard.md:38` |

Lo que **no** está en la fuente normativa se afirma como **restricción, no como
valor**: el padding de las filas multilínea se testea con `/\bpy-[23]\b/` y
`not.toMatch(/\bpy-4\b/)`, no con un valor exacto; la opacidad `/50` del borde de
las alertas no se testea en absoluto. Es exactamente lo que R13 pide, y evita el
fallo que produjo D-V1 en la feature 24. La auditoría lleva su comprobación de
no-vacuidad, así que no es un test que pase siempre.

### R14 — Verificación en navegador — **ABIERTO (por diseño), sin fabricación**

`progress/verify_ui-surfaces-dashboards.md` existe con las 5 secciones + la
subsección de observación. Revisado línea a línea:

- **Ningún valor de `getComputedStyle` inventado.** Las dos celdas de altura de CTA
  están en `PENDIENTE` (`:73-74`).
- **Ninguna captura fabricada.** Las 8 filas de la tabla de superficies tienen
  `PENDIENTE` en las tres columnas de medida y en la de captura (`:45-52`).
- **Ningún veredicto humano redactado.** §5 dice `PENDIENTE — sin firmar` (`:140`).
- **La observación de saturación de dark está en PENDIENTE** (`:114`), y el texto
  deja explícito que no se toca ningún token — decisión humana 3 respetada.
- Ningún token de saturación cambió: `styles.css` no aparece en el diff, y el test
  `no declara tokens de estado nuevos en styles.css` sigue contando exactamente 16.

**El implementer no fabricó evidencia.** Es el comportamiento correcto y merece
constar. El acta queda lista para que el leader y el usuario la rellenen.

### R15 — Alcance cerrado — **PASS**

`git diff --name-only 1f4884b..HEAD` devuelve 16 archivos y **ni uno fuera de la
lista autorizada**:

- 6 × `components/odc/*.tsx` del alcance
- 6 × sus `*.test.tsx` (2 creados: `odc-status-badge.test.tsx` y
  `executive-tasks.test.tsx`; R15 autoriza "sus archivos de test" explícitamente,
  y esas dos superficies no tenían test propio)
- `frontend/src/design-system.guardrails.test.ts`
- `progress/verify_…md`, `specs/ui-surfaces-dashboards/{tasks,traceability}.md`

Confirmado por ausencia:
- **`frontend/src/styles.css` — sin tocar.**
- **`frontend/src/components/ui/` — sin tocar** (ni `card.tsx`, pese a que era la
  salida "fácil" para el problema de `pb-3`).
- **`frontend/package.json` — sin tocar.** Cero dependencias nuevas, afirmado además
  por dos tests que congelan las 26 + 18 entradas.
- **`backend/` — sin tocar.** `design-system/` — sin tocar. Specs de 23 y 24 — sin tocar.

---

## Trazabilidad — validación fila a fila

Cada nombre de test se comprobó abriendo el archivo; cada hash, contra `git log --stat`.

| R | Test declarado | ¿Existe? | Commits declarados | ¿Correctos? |
|---|---|---|---|---|
| R1 | `odc-status-badge.test.tsx::R1: …` + `guardrails::…R1: el badge deja de pintar paleta cruda` | sí (`:28`, guardrails `:41`) | test `5ddeca0` + feat `1811136` | sí |
| R2 | `odc-status-badge.test.tsx::R2: …contrato accesible y su transición` | sí (`:50`) | test `5ddeca0` + feat `1811136` | sí |
| R3 | los 5 `::ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing` | sí, los 5 | test `f1373cc` + feat `4240a1d` | sí |
| R4 | mismos 5 bloques | sí | test `f1373cc` + feat `4240a1d` | sí |
| R5 | `guardrails::…R5: las etiquetas usan el tracking de label del MASTER` | sí (`:106`) | test `384162e` + feat `9994dd9` | sí |
| R6 | `guardrails::…R6: …densidad de la primitiva` + `odc-dashboard.test.tsx::…R6: los CTA del header cierran D-V3` | sí (`:122`; test `:187`) | test `384162e` + feat `9994dd9` | sí |
| R7 | 5 bloques `R7,R8` / `R7` en las 5 superficies | sí, los 5 | test `19a0da0` + feat `749946e` + **fix `879624d`** | sí |
| R8 | mismos bloques `R7,R8` de las 4 superficies con contador | sí | test `19a0da0` + feat `749946e` | sí |
| R9 | los 5 `::ui-surfaces-dashboards R9: …` | sí, los 5 | test `494fdf7` + feat `fe84b91` | sí |
| R10 | `guardrails::…R10: cada caja usa el radio de su token` | sí (`:143`) | test `494fdf7` + feat `fe84b91` | sí |
| R11 | `guardrails::…R11: cero color literal en las seis superficies` | sí (`:149`) | test `494fdf7` + feat `fe84b91` | sí |
| R12 | `guardrails::…R12: las 6 aserciones en riesgo siguen intactas` | sí (`:250`) | test `99036cd` | sí |
| R13 | `guardrails::…R13: los tests no fijan valores visuales inventados` | sí (`:281`) | test `99036cd` | sí |
| R14 | `guardrails::…R14: la verificación en navegador existe` | sí (`:317`) | test `99036cd` + feat `595158f` | sí — **fila Abierta** |
| R15 | `guardrails::…R15: alcance cerrado, sin tokens ni dependencias nuevas` | sí (`:335`) | test `99036cd` | sí |

**Cero errores en la reconstrucción.** Las 15 filas apuntan a tests que existen con
ese nombre exacto y a hashes que existen y corresponden al requisito. La única fila
que en la versión del leader (`8fd4cc5`) estaba incompleta era R7 —le faltaba
`879624d`—, y `064ff4c` lo corrigió.

Verificado también que el implementer **no borró ni renombró** ningún test de la
feature 23 al refactorizar `design-system.guardrails.test.ts`: de las 59 líneas
eliminadas, la única que contiene `describe`/`it(`/`expect` es
`describe('R15: sin dependencias nuevas…')`, que sigue presente en el archivo
(`:211`). El resto son el movimiento de `LITERAL_COLOR` y las listas `FROZEN_*` al
ámbito de módulo, tal como declara el reporte.

---

## Defectos, por gravedad

### D1 — MODERADO. El fix de R7 (`879624d`) no dejó guarda de regresión

Los tests de R7 afirman el padding así:

```js
expect(header.className).toContain('pb-3')   // odc-dashboard.test.tsx, general-dashboard.test.tsx, admin-dashboard.test.tsx
```

`'pb-3!'.includes('pb-3')` es `true`. **La suite está igual de verde con `pb-3!`
(correcto) que con `pb-3` (inerte).** Es decir: el estado roto que `879624d` acaba
de arreglar sigue siendo indetectable por los tests. Cualquiera puede quitar el `!`
en la feature 26 —o un formateador puede comérselo— y R7 se revierte en silencio
con 469/469 en verde.

El argumento del reporte ("jsdom no computa cascada, ningún test podía detectarlo")
es cierto **para un test de render**, pero no para una auditoría de código fuente:
`design-system.guardrails.test.ts` ya lee archivos con `readFileSync` y ya hace
exactamente este tipo de aserción para R5, R6, R10 y R11. Una línea del estilo
`expect(surfaceSource(s)).toContain('pb-3!')` sobre las tres superficies de cola
habría nacido **roja** antes de `879624d` y habría cerrado el ciclo TDD.

Es el único requisito de la feature cuyo cumplimiento efectivo no está guardado.
No rompe nada hoy y `pnpm build` demuestra que el CSS sale bien, por eso es reserva
y no rechazo.

**Qué haría falta**: una aserción de código fuente en
`frontend/src/design-system.guardrails.test.ts` que distinga `pb-3!` de `pb-3` en
`odc-dashboard.tsx`, `admin-dashboard.tsx` y `general-dashboard.tsx`.

### D2 — MENOR. `pb-3!` triplica la deuda de `!important` del repo

Antes de esta feature el repo tenía **un** modificador `!` en toda la aplicación:
`frontend/src/components/ui/toast.tsx:43` (`rounded-2xl!`), y
`progress/ui-redesign-plan.md` ya lo tenía anotado para revisión. Ahora hay cuatro:
los tres `pb-3!` nuevos más ese.

Ni `MASTER.md` ni `pages/dashboard.md` mencionan `!important` (comprobado con grep:
cero apariciones), así que no hay regla que se incumpla. Y la salida elegida es
defendible: R15 prohíbe tocar `components/ui/`, la alternativa sin `!` era quitarle
el `border-b` al header (que cambia el separador visual), y el diagnóstico es
correcto —lo verifiqué en el CSS compilado, no me lo creí del reporte—.

Pero es un parche de especificidad en una superficie para compensar una primitiva,
que es la forma de deuda que este mismo refactor está intentando eliminar. Merece
una decisión explícita: o se acepta como patrón y se documenta en el MASTER, o la
feature 26 arregla `CardHeader` en origen. **No lo decido yo; es material para el
gate humano de R14 o para el alcance de la 26.**

### D3 — MENOR (bookkeeping del leader, no del implementer). `progress/current.md` obsoleto → C2 no pasa

El archivo describe un estado que dejó de ser cierto hace horas:

```
# Sesion activa — PAUSADA en el gate humano 2026-08-11
estado: pending con spec escrita — BLOQUEADA en el gate humano
implementer: —
reviewer: —
```

La spec está aprobada (casilla marcada, `status: approved`), el implementer entregó
14 commits y el reviewer ha corrido. C2 exige que `current.md` "esté vacío
(plantilla) o describa la sesión activa"; hoy no hace ninguna de las dos cosas.
Es el mismo tipo de reserva de bookkeeping que salió en la review de la feature 24.

### Observación (no es defecto) — desviación menor respecto de `design.md`

`design.md` §"Dónde vive cada test" decía que R12 se cubriría "ampliando el bloque
ya existente `R13:`" de `design-system.guardrails.test.ts`. El implementer creó en
su lugar un bloque nuevo, `ui-surfaces-dashboards R12`, y dejó el `R13:` de la
feature 24 intacto. **Es la decisión correcta**: los seis renglones del bloque viejo
son el conjunto de la feature 24 (incluye `general-approval-actions.test.tsx` y
`monthly-summary.test.tsx`), que no coincide con la tabla de R12 de esta spec.
Fusionarlos habría mezclado dos conjuntos de guardas distintos. Lo registro para que
nadie lea la discrepancia como un olvido.

### Observación (no es defecto) — el flaky no apareció

`general-approval-actions.test.tsx` pasó en las tres ejecuciones de suite completa
que hice. No hay nada que atribuir a esta feature.

---

## Qué falta para poder marcar `done`

1. **La sesión de navegador de R14**, con las 5 secciones rellenadas con lecturas
   en vivo. En particular la sección 2 (`getComputedStyle().height` ≤ 32px de los
   CTA de `odc-dashboard.tsx`), que es el cierre formal de **D-V3**.
2. **El veredicto humano firmado con fecha** (§5 del acta). R14 es explícito: sin
   veredicto afirmativo, el reviewer no aprueba el cierre **aunque `pnpm test` y
   `pnpm build` estén en verde**.
3. **El veredicto sobre `/tasks` a 1400px** (decisión humana 1). Si las filas
   estiradas no se sostienen, la salida es enmendar `design-system/odc/pages/dashboard.md`
   con firma humana — nunca revertir R3 en silencio.
4. **La observación sobre la saturación de las 8 badges de `.dark`** (decisión
   humana 3): se registra, no se ejecuta.
5. Cerrada la sesión de R14, actualizar la fila R14 de `traceability.md` para que
   deje de estar "Abierta", y **entonces** C5 pasa.
6. Resolver **D1** (guarda del `pb-3!`) y decidir **D2**. Actualizar `current.md` (**D3**).

---

## Veredicto

**APROBADO CON RESERVAS.**

El código que el implementer entregó cumple R1–R13 y R15. Lo verifiqué contra el
código y los commits, no contra el reporte: los seis archivos del alcance no
conservan **ninguna** de las clases prohibidas, el badge consume los 8 pares de
tokens sin una sola variante `dark:`, el ámbar hardcodeado pasó a `--status-pending`,
las 6 aserciones en riesgo están intactas con `-0` líneas borradas, el alcance está
cerrado (cero cambios en `styles.css`, en `components/ui/`, en `package.json` y en
`backend/`), y las utilidades de token compilan a CSS real y no solo a texto en un
`className`. C4 pasa limpio por segunda vez consecutiva: seis pares `test → feat`,
ningún `feat` toca un archivo de test. El implementer **no fabricó** valores de
`getComputedStyle`, capturas ni veredictos humanos, y lo dejó dicho.

Las reservas son **D1** (falta la guarda de regresión que distinga `pb-3!` de un
`pb-3` inerte), **D2** (deuda de `!important`, a decidir en el gate) y **D3**
(`current.md` obsoleto, bookkeeping del leader). Ninguna justifica devolver el
trabajo al implementer.

**La feature NO puede marcarse `done` todavía.** No por defecto de la
implementación, sino porque C5 tiene la fila R14 abierta y C6 exige el veredicto
humano que la propia spec impone. Ese es el siguiente paso: la sesión de navegador
del leader con el usuario.

---

## Output de `./init.sh`

```
══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════

→ Verificando entorno...
✅ node disponible (/c/Program Files/nodejs/node)
✅ pnpm disponible (/c/Users/alex/AppData/Local/pnpm/pnpm)

→ Verificando variables de entorno...
✅ .env encontrado
✅   DATABASE_URL definida
✅   JWT_SECRET definida

→ Instalando dependencias...
Lockfile is up to date, resolution step is skipped
Already up to date
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: ui-surfaces-dashboards

→ Build...
✓ built in 1.96s   (client)
✓ built in 808ms   (ssr)
✅ Build exitoso

→ Ejecutando tests...
Test Suites: 59 passed, 59 total          (backend)
Tests:       471 passed, 471 total

 Test Files  37 passed (37)                (frontend)
      Tests  469 passed (469)
✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 24/29 completadas | 4 pendientes

  Próxima feature:
  [#26] ui-surfaces-detail-forms (P2)

EXIT=0
```
