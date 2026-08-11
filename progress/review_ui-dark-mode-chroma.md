# review: ui-dark-mode-chroma (feature 24)

Fecha: 2026-08-11
Rama: `ui-design-system-docs` — rango revisado `8584c79..d6b39a0` (7 commits) más
los cambios de cierre de R9 aún sin commitear.
Veredicto: **APROBADO CON RESERVAS**

Las reservas son de **bookkeeping del harness** (fecha del gate, commit que
registra la aprobación, higiene de sesión). **Ningún defecto en el trabajo del
implementer**: código, tests, alcance y matemática verificados uno a uno de forma
independiente, no leídos del reporte.

---

## Checklist C1 — Arnés completo

- [x] `./init.sh` termina en verde (ejecutado por el reviewer, no aceptado del
      reporte). Salida al final de este archivo.
- [x] Archivos base y agentes presentes (no es la primera feature; verificado por
      la ejecución limpia de `init.sh`).

## Checklist C2 — Estado coherente

- [x] Solo 1 feature `in_progress` en `feature_list.json` (`grep -c '"in_progress"'`
      → 1, id 24). No está marcada `done`: correcto, lo marca el leader tras esta
      revisión.
- [~] `progress/current.md` describe la sesión activa pero está **desactualizado**:
      sigue diciendo `estado: spec_ready — esperando SOLO la casilla del gate
      humano`, `implementer: —`, `reviewer: —` y "12 commits". Ver defecto D4.
- [x] `progress/history.md` — no aplica todavía; la sesión no está cerrada.

## Checklist C3 — Arquitectura

No hay capas implicadas: el cambio vive en la hoja de estilos, su test y
documentación. Verificado con `git diff --name-only 8584c79..HEAD` (10 archivos,
lista abajo en C-R11).

- [x] Cero archivos de `backend/` tocados
- [x] Cero archivos de `frontend/src/components/` tocados
- [x] domain / application / infrastructure: no intervienen (regla de dependencia
      de `docs/architecture.md` no afectada)

## Checklist C4 — TDD

- [x] **Cada R1–R11 tiene al menos un test que lo nombra**, con el prefijo
      `ui-dark-mode-chroma R<n>:` en el `describe` para no colisionar con los
      R-ids de la feature 23 que ya vivían en el archivo. Decisión correcta: sin
      el prefijo la trazabilidad sería ambigua.
- [x] **Ningún `feat(...)` toca un `*.test.ts`.** Verificado commit a commit con
      `git log --name-status 8584c79..HEAD`:

  | Commit | Tipo | Archivos tocados |
  |---|---|---|
  | `8ab92a2` | test | `frontend/src/styles.tokens.test.ts` |
  | `f8bff45` | feat | `frontend/src/styles.css` |
  | `a3d26a3` | test | `frontend/src/styles.tokens.test.ts` |
  | `1cd88ea` | feat | `frontend/src/styles.css` |
  | `2c423f0` | test | `frontend/src/styles.tokens.test.ts` |
  | `4be24a0` | feat | `MASTER.md`, `specs/ui-design-tokens/requirements.md`, `progress/verify_*.md` |
  | `d6b39a0` | docs | specs de la 24 + `progress/impl_*.md` |

  Es el patrón test → feat estricto, alternado, sin mezcla. **C4 deja de fallar
  por cuarta vez.**

- [x] **El `--amend` de `8ab92a2` es cosmético y no hay más reescritura de
      historial.** Evidencia dura, no la palabra del implementer:
  - `git reflog` muestra una única entrada `commit (amend)`, sobre `ceacde9`
    (asunto literal `@`, error de heredoc).
  - `git rev-parse ceacde9^{tree}` = `git rev-parse 8ab92a2^{tree}` =
    `476d9922202a4592fc899ca4908c9e96ee0294a8` → **mismo árbol, contenido
    idéntico**.
  - Mismo padre en ambos (`8584c797…`). Solo cambió el mensaje.

- [x] **Los seis requisitos que "aterrizan verdes" (R1, R3, R4, R7, R8, R11): el
      razonamiento del implementer se sostiene.** No lo acepto de palabra: reproduje
      la auditoría sobre `git show 8584c79:frontend/src/styles.css` con un script
      propio (misma matemática oklch→sRGB del test, escrito aparte):
  - R1 sobre la hoja **vieja**: cero tokens no exentos por encima de `0.2126`.
    Para verlo rojo habría hecho falta romper la hoja a propósito.
  - R3 sobre la hoja vieja: los 6 alias ya coincidían con `--primary`.
  - R4 sobre la hoja vieja: `L = 0.7137 > 0.2274` y `> 0.1822`, ya se cumplía.
  - R7 sobre la hoja vieja: hues `165.61` ya compartidos, identidad en `:root` ya
    exacta.
  - R8 y R11 son auditorías del propio test y del manifiesto: no podían fallar sin
    fabricar el fallo.

  Y cada uno viaja en un commit de test que **sí** estaba rojo por otro requisito
  del grupo, lo que también verifiqué:
  - `8ab92a2` rojo por **R2**: sobre la hoja vieja `s(.dark --primary)` =
    `0.0969595…` frente a un suelo de `0.1807048…`. Coincide **dígito a dígito**
    con el mensaje de error que cita el reporte (`expected 0.09695950679557237 to
    be greater than or equal to 0.18070479491623337`). No es una cita inventada.
  - `a3d26a3` rojo por **R5**: mi script sobre la hoja vieja devuelve **exactamente
    los 6 tokens** que predijo la spec (`:root` → `--status-pending-surface`,
    `--status-approved-surface`, `--status-paid-surface`; `.dark` →
    `--status-approved`, `--status-paid`, `--status-rejected`), ni uno más.
  - `2c423f0` rojo por **R9 y R10**: estructuralmente cierto — el informe de R9 y
    la fila de enmienda se crean en `4be24a0`, un commit **posterior**.

  Veredicto sobre este punto: es una guarda de no-regresión honestamente declarada,
  **no** una excusa para saltarse el rojo. Fabricar un rojo artificial habría sido
  teatro. Se aprueba tal cual.

## Checklist C5 — Trazabilidad

- [x] `traceability.md` **sin filas "pendiente"**. La fila de R9 pasó de
      "**Abierto**" a "**Cerrado el 2026-08-11**" tras la sesión de navegador.
- [x] **Los 7 hashes de la tabla existen de verdad en el log** (`git cat-file -t`
      sobre cada uno: `8ab92a2`, `f8bff45`, `a3d26a3`, `1cd88ea`, `2c423f0`,
      `4be24a0`, `d6b39a0` → todos resuelven, y sus asuntos coinciden con los que
      declara la tabla).
- [x] Formato de commit `feat(<scope>): <desc> (R1,R2)` respetado en los tres
      `feat` y los tres `test`.

## Checklist C6 — Spec aprobada

- [x] `specs/ui-dark-mode-chroma/requirements.md` con `status: approved`
- [x] Casilla "Aprobado por humano" marcada (línea 193)
- [~] **con fecha `11/10/2026`**, que no corresponde al 2026-08-11 en ninguna
      lectura (ni dd/mm ni mm/dd) y rompe la convención ISO que usa la feature 23
      (`fecha: 2026-08-10`, línea 223 de su `requirements.md`). Ver defecto D1.
- [~] Requisitos modificados tras la aprobación: R1 y el bloque del techo de
      `design.md` **sí** cambiaron respecto a `8584c79`, pero son exactamente las
      dos decisiones humanas del 2026-08-11 registradas en `progress/current.md`
      §"Las dos preguntas del gate: respondidas 2026-08-11", y viajan en el mismo
      commit que marca la casilla, así que la aprobación cubre el texto enmendado.
      Contenido correcto; el vehículo es discutible. Ver defecto D2.

---

## Verificación independiente de la matemática

Script propio (no el del repo) sobre `git show 8584c79:frontend/src/styles.css` y
sobre la hoja actual, replicando la conversión oklch→sRGB lineal del test.

**R1 — techo congelado.** `s(:root --primary)` = `0.0736 / 0.3462` =
**0.2125939** ≤ `0.2126`. Margen real **6.1e-6** (el reporte y `current.md` dicen
"0.00001"; es del mismo orden, pero el número exacto es menor). Subir el chroma
del navy rompe el test, que es el efecto buscado. Cero tokens no exentos por
encima del techo en `:root` y en `.dark`. La constante está escrita como
`SATURATION_CEILING = 0.2126` con su origen en comentario y **no** se deriva de
`:root --primary` en tiempo de test: cumple la decisión humana al pie de la letra.

**R2 — suelo del 85%. Recalculado, no aceptado:**

| Token | s dark | Suelo (85% del claro) | % del claro | Resultado |
|---|---|---|---|---|
| `.dark --primary` = `oklch(0.6800 0.1400 254.62)` | **0.2058824** | 0.1807048 | **96.8%** | PASS |
| `.dark --accent-action` | 0.1928878 | 0.1754871 | 93.4% | PASS (sin tocar) |

`0.1400 / 0.6800 = 0.2058823…` — dentro del techo `0.2126` y por encima del suelo
`0.1807`, exactamente como afirma el encargo. El valor anterior daba `0.0969595`
(el 45.6% del claro): D-V1 medido.

**R3.** Los 6 alias (`--ring`, `--sidebar-primary`, `--sidebar-ring` × 2 temas)
son idénticos a su `--primary` de bloque. PASS.

**R4.** `L(.dark --primary)` = 0.68 > `L(--card)` = 0.2274 y > 
`L(--primary-foreground)` = 0.1822. R2 no se satisfizo oscureciendo el token. PASS.

**R5 — gamut.** Hoja nueva: **cero** tokens fuera de `[0,1]` con tolerancia `1e-4`
en ambos temas. Lightness y hue conservados exactos en los 6 corregidos (solo
cambia el segundo número del `oklch()`, verificado en el diff). PASS.

**R6 — contraste.** Los 2 pares nuevos, recalculados: `.dark --primary` sobre
`--background` = **6.502**, sobre `--card` = **5.900**. Coinciden con lo previsto
para el candidato B en `design.md` (6.50 / 5.90). Los 16 pares de estado siguen
todos ≥ 4.5 (el peor es `light rejected` = 4.617, sin tocar). PASS.

**R7.** `:root --accent-action` === `:root --status-done` (mismo literal). Hues
`165.61` compartidos entre `:root` y `.dark` en ambos tokens. PASS.

## R6 — ninguna aserción de contraste eliminada, relajada ni `skip`

- El **único** bloque de aserciones eliminado en todo el rango es el `it.each` del
  techo plano de chroma `≤ 0.10` de la R3 de la feature 23
  (`styles.tokens.test.ts`, sustituido por un comentario que apunta a la enmienda).
  Es exactamente lo que R1 autoriza a sustituir.
- El bloque `R5: contraste WCAG 2.1 >= 4.5:1 en los pares auditados`
  (`styles.tokens.test.ts:251-308`) está **intacto**: sigue generando
  2 temas × (8 estados + 5 pares) = **26 pares** con umbral `4.5`, más el test
  compuesto de `--destructive` al 10% sobre `--card` en dark (línea 299).
- `grep` de `.skip` / `.todo` / `xit(` / `xdescribe` en el archivo de test:
  **ninguna coincidencia**.
- Las aserciones literales de la 23 sobre `:root` se conservan sin tocar
  (`describe('R2: paleta navy…')`, líneas 140-169).

## R11 — alcance y dependencias

`git diff --name-only 8584c79..HEAD` devuelve exactamente 10 archivos, todos
dentro de la lista permitida:

```
design-system/odc/MASTER.md
frontend/src/styles.css
frontend/src/styles.tokens.test.ts
progress/impl_ui-dark-mode-chroma.md
progress/verify_ui-dark-mode-chroma.md
specs/ui-dark-mode-chroma/{design,requirements,tasks,traceability}.md
specs/ui-design-tokens/requirements.md
```

- Cero archivos de `frontend/src/components/`. Cero de `backend/`.
- `frontend/package.json` **no aparece en el diff** → cero dependencias nuevas. El
  test lo blinda además con una lista congelada de 44 nombres.
- Nota menor: cerrar la feature exigirá tocar `feature_list.json`
  (`in_progress` → `done`), archivo que la lista de R11 no contempla. Es
  bookkeeping obligatorio del harness (AGENTS.md §7), no una violación del alcance
  de la implementación.

## R10 — la spec de la feature 23, lo más delicado

- `git show --stat 4be24a0 -- specs/ui-design-tokens/requirements.md` →
  **`1 file changed, 1 insertion(+)`**, cero borrados. Una sola línea añadida a la
  tabla "Enmiendas posteriores a la aprobación", fechada 2026-08-11, con
  autorización humana y el motivo.
- Su casilla de aprobación sigue intacta: línea 223,
  `- [X] Aprobado por humano (fecha: 2026-08-10)`. (El reporte del implementer
  habla de "sus **dos** casillas"; solo hay una. Inexactitud del reporte, no del
  cambio.)
- Nada más de ese archivo fue tocado en ningún commit del rango.

## R7 — la parte que ningún test cubre

`design-system/odc/MASTER.md`, bloque "Acotación 2026-08-11 (feature 24,
`ui-dark-mode-chroma`, R7)", insertado en las líneas 72-81, **dentro de §1 Color**
(§1 empieza en la línea 37, §2 en la 108) y justo después de la enmienda del verde
de la 23, que es donde tiene que estar.

Leído y juzgado: **cumple**. Dice literalmente que la identidad de valor entre
`--accent-action` y `--status-done` es "**solo en tema claro**", nombra ambos
tokens, explica que en `.dark` comparten hue `165.61` pero no lightness, y da la
razón de roles (superficie de acción con texto oscuro encima vs. texto de badge
sobre superficie oscura). No queda ninguna afirmación de verde compartido sin
acotar.

## R9 — gate humano

**Cerrado y válido.** `progress/verify_ui-dark-mode-chroma.md` tiene las 4
secciones rellenadas tras la sesión de navegador del 2026-08-11 (Chrome real,
`localhost:3005`):

1. `getComputedStyle` en vivo de los 4 tokens en los dos temas, más el contexto de
   `--card`, `--primary-foreground` y `--background` para poder juzgar R4.
   Contrastados contra `styles.css`: coinciden.
2. CTA primario junto al outline en `/odcs/new`, con captura y veredicto
   afirmativo de jerarquía.
3. Medición con `canvas.getImageData` del píxel realmente pintado para el valor
   viejo y el nuevo de los 6 tokens de R5.
4. **Veredicto humano AFIRMATIVO, firmado por Alexis, 2026-08-11.**

**Comprobación anti-fabricación de la sección 3.** Recalculé por mi cuenta el
sRGB de 8 bits de los 12 valores (recorte por canal, que es lo que hace Chrome):

| Token | viejo (calculado) | nuevo (calculado) | Δ máx. | Archivo dice |
|---|---|---|---|---|
| `.dark --status-approved` | 151,195,255 | 167,197,252 | 16 | 16 |
| `.dark --status-paid` | 199,178,255 | 197,185,252 | 7 | 7 |
| `.dark --status-rejected` | 255,162,150 | 252,173,163 | 13 | 13 |
| `:root --status-pending-surface` | 255,245,240 | 254,246,241 | 1 | 1 |
| `:root --status-approved-surface` | 241,247,255 | 242,247,254 | 1 | 1 |
| `:root --status-paid-surface` | 246,**244**,255 | 246,245,254 | 1 | 1 |

Reproduce la tabla del archivo, con una única diferencia de 1 en un canal
(`paid-surface` viejo) atribuible al redondeo de Chrome. Que **no** cuadre al 100%
con mi fórmula es, paradójicamente, la mejor prueba de que los números se
midieron y no se calcularon con la misma matemática del test. Y los 6 valores
viejos saturan un canal a 255: el recorte que R5 denunciaba, confirmado en
pantalla.

**Sobre el "cambio visible esperado: ninguno".** Es inexacto y así queda anotado
en el propio archivo (§3), donde el humano lo firmó viéndolo. No incumple ninguna
cláusula SHALL: R5 exige gamut, lightness y hue exactos, y las tres se cumplen;
"efecto esperado en pantalla: ninguno" es justificación, no requisito. Δ de 16/255
en un canal sobre texto de badge de 12px, en la dirección correcta (el declarado y
el pintado ahora coinciden). Se registra como observación D3, **no** como motivo
de reserva bloqueante.

---

## Defectos (ninguno bloqueante, ordenados por gravedad)

**D1 — Fecha del gate humano incoherente.** `specs/ui-dark-mode-chroma/requirements.md`
línea 193: `- [X] Aprobado por humano (fecha: 11/10/2026)`. No es el 2026-08-11 en
ninguna lectura y rompe la convención ISO de la feature 23
(`specs/ui-design-tokens/requirements.md:223` → `fecha: 2026-08-10`). Es el único
rastro documental de cuándo se cruzó el gate más importante del harness. Debe
corregirlo el humano o el leader a `2026-08-11`.

**D2 — La aprobación se registra en el commit del implementer, después de
implementar.** `status: draft → approved` en los 4 archivos de la spec, la casilla
del gate y la enmienda de R1 aterrizan todos en `d6b39a0`, el commit `docs` del
implementer, **posterior** a los seis commits de implementación. El contenido
corrobora bien (coincide punto por punto con las dos decisiones humanas anotadas
en `progress/current.md` antes de empezar), pero el rastro de auditoría queda
débil: desde git solo, no se distingue "el humano marcó la casilla y el agente la
barrió al commitear" de "el agente marcó la casilla". Dado el historial de este
repo con casillas auto-marcadas, conviene que el gate humano viaje en su propio
commit del leader **antes** de lanzar al implementer.

**D3 — "Cambio visible esperado: ninguno" contradicho por la medición.** La
cabecera de `progress/verify_ui-dark-mode-chroma.md` (línea 24), el reporte del
implementer (línea 87) y la justificación de R5 en `requirements.md` afirman efecto
visual nulo; la §3 del mismo archivo de verificación mide hasta 16/255 en un canal
para `.dark --status-approved`. La §3 lo explica con honestidad y el humano firmó
con ese dato delante. Basta con corregir la frase de la cabecera para que el
archivo no se contradiga a sí mismo.

**D4 — Higiene de sesión pendiente (leader).** `progress/current.md` está
congelado en el estado previo: `estado: spec_ready — esperando SOLO la casilla del
gate humano`, `implementer: —`, `reviewer: —`, "12 commits". Y quedan sin commitear
`feature_list.json`, `progress/verify_ui-dark-mode-chroma.md`,
`specs/ui-dark-mode-chroma/tasks.md` y `specs/ui-dark-mode-chroma/traceability.md`
(el cierre de R9). Nada de esto es del implementer, que declaró explícitamente esos
archivos fuera de su alcance.

## Verificación ejecutada por el reviewer

`pnpm test` en `frontend/` (ejecutado por mí, no leído del reporte):

```
 Test Files  35 passed (35)
      Tests  353 passed (353)
```

Re-ejecutado sobre `src/styles.tokens.test.ts` **después** de rellenarse el archivo
de R9, para confirmar que el test de existencia sigue verde con el contenido nuevo:

```
 Test Files  1 passed (1)
      Tests  103 passed (103)
```

`pnpm build` en `frontend/`:

```
✓ built in 1.27s
```

Sin rastro del flaky conocido de `general-approval-actions` en ninguna de las tres
ejecuciones; no hizo falta re-correrlo aislado.

## Output de ./init.sh

```
> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run "--passWithNoTests"

 Test Files  35 passed (35)
      Tests  353 passed (353)

✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 23/24 completadas | 0 pendientes
```

## Veredicto

**APROBADO CON RESERVAS.** El trabajo del implementer se aprueba **sin defectos**:
R1–R11 implementados, cada uno con test que nombra su R-id, TDD test-primero
limpio commit a commit, alcance cerrado en 10 archivos permitidos, cero
dependencias nuevas, matemática verificada de forma independiente y ninguna
aserción de contraste eliminada, relajada ni `skip`. El gate humano de R9 está
cerrado con veredicto afirmativo firmado y evidencia medida, no deducida.

Las cuatro reservas (D1–D4) son de bookkeeping del harness y **corresponden al
leader y al humano**, no al implementer. **D1 y D2 tocan el gate de aprobación y
deberían resolverse antes de marcar la feature `done`**; D3 y D4 pueden cerrarse
en el mismo commit de cierre de sesión.
