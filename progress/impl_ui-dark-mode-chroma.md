# impl: ui-dark-mode-chroma (feature 24)

Fecha: 2026-08-11
Rama: `ui-design-system-docs` (6 commits nuevos, **sin push**)
Base: `8584c79`

## Resumen

Implementados **R1–R8, R10 y R11 completos**, y de **R9 solo el sub-item (1)**
(el test de existencia y estructura). Los sub-items (2) y (3) de R9 —la sesión de
navegador y el veredicto humano— quedan abiertos a propósito: rellenarlos yo sería
fabricar evidencia de verificación.

## Archivos creados

- `progress/verify_ui-dark-mode-chroma.md` — esqueleto del informe de R9. Declara
  las 4 secciones que exige el requisito, todas marcadas `PENDIENTE`. Incluye los
  valores implementados a verificar y el comando para levantar el entorno.

## Archivos modificados

- `frontend/src/styles.css`
  - `.dark`: `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` pasan de
    `oklch(0.7137 0.0692 254.62)` a `oklch(0.6800 0.1400 254.62)`.
  - Chroma reajustado en los 6 tokens declarados fuera del gamut sRGB, conservando
    lightness y hue exactos.
  - Un comentario sobre `.dark --primary` documentando la saturación y D-V1.
- `frontend/src/styles.tokens.test.ts`
  - Eliminada la cláusula de chroma plano `≤ 0.10` de la R3 de la feature 23,
    sustituida por la R1 de esta feature (queda un comentario en su lugar que
    apunta a la enmienda). El resto de la R3 de la 23 sigue intacto.
  - `oklchToLinearRgb` se parte en `oklchToRawLinearRgb` (sin recortar) + la
    versión recortada de siempre. Ninguna aserción de contraste existente se
    tocó, relajó ni marcó `skip`.
  - 11 bloques `describe` nuevos, prefijados `ui-dark-mode-chroma R<n>` para no
    colisionar con los R-ids de la feature 23 que ya vivían en el archivo.
  - 25 tests nuevos (328 → 353 en la suite completa).
- `design-system/odc/MASTER.md` §1 — nueva "Acotación 2026-08-11" tras la enmienda
  del verde (R7).
- `specs/ui-design-tokens/requirements.md` — **una sola línea**: la fila de enmienda
  en "Enmiendas posteriores a la aprobación". Verificado con `git show`: el diff de
  ese archivo es exactamente `1 insertion(+)`, cero borrados. Sus casillas de
  aprobación no se tocaron.
- `specs/ui-dark-mode-chroma/tasks.md` — casillas marcadas salvo R9 (2) y (3).
- `specs/ui-dark-mode-chroma/traceability.md` — hashes reales, sin filas "pendiente".

## Valores oklch elegidos y por qué

### `.dark --primary` → `oklch(0.6800 0.1400 254.62)` — **candidato B** de `design.md`

Es la recomendación de partida del propio documento de diseño. Reproduje su tabla
de candidatos con la misma matemática del test antes de elegir; los tres cumplen
R1–R6, así que la elección es de criterio, no de aritmética:

| # | Candidato | s | % del navy light | Contraste con `--primary-foreground` | % del gamut |
|---|---|---|---|---|---|
| A | `oklch(0.7137 0.1400 254.62)` | 0.1962 | 92% | 7.38 | 92% |
| **B** | **`oklch(0.6800 0.1400 254.62)`** | **0.2059** | **97%** | **6.50** | **81%** |
| C | `oklch(0.6500 0.1380 254.62)` | 0.2123 | 100% | 5.79 | 73% |

Razón de B sobre A: A conserva la lightness actual pero deja el token al 92% del
gamut disponible, sin margen para que la sesión de R9 lo afine. Razón de B sobre C:
C alcanza paridad exacta con el navy claro pero baja el contraste a 5.79, y a esa
lightness el azul empieza a competir con `--status-approved`. B queda holgado por
los dos lados: `s = 0.2059` está por encima del suelo de R2 (`0.1807`) y por debajo
del techo congelado de R1 (`0.2126`).

El valor anterior era `oklch(0.7137 0.0692 254.62)`, `s = 0.0970` — el 46% de la
saturación del navy claro, que es D-V1 exactamente.

### Los 6 tokens fuera de gamut (R5) — los valores propuestos en `design.md`

Misma lightness, mismo hue, chroma bajado a ~95% del máximo en gamut. Verifiqué
uno a uno que quedan dentro de `[0,1]` con tolerancia `1e-4`:

| Token | Antes | Ahora | Contraste con su par |
|---|---|---|---|
| `:root --status-pending-surface` | `oklch(0.9780 0.0140 49.00)` | `oklch(0.9780 0.0110 49.00)` | 4.70 |
| `:root --status-approved-surface` | `oklch(0.9740 0.0160 262.88)` | `oklch(0.9740 0.0110 262.88)` | 4.80 |
| `:root --status-paid-surface` | `oklch(0.9740 0.0180 292.58)` | `oklch(0.9740 0.0120 292.58)` | 6.58 |
| `.dark --status-approved` | `oklch(0.8200 0.1290 262.88)` | `oklch(0.8200 0.0850 262.88)` | 8.09 |
| `.dark --status-paid` | `oklch(0.8200 0.1400 292.58)` | `oklch(0.8200 0.0930 292.58)` | 8.02 |
| `.dark --status-rejected` | `oklch(0.8200 0.1290 27.33)` | `oklch(0.8200 0.0950 27.33)` | 7.97 |

Coinciden hasta el segundo decimal con los contrastes previstos en `design.md`.
Efecto visual esperado: **ninguno** — es el color que el navegador ya pintaba tras
su propio gamut mapping.

### Lo que NO cambió

`--accent-action` y `--status-done` no se tocan en ninguno de los dos temas.
`--accent-action` en dark ya cumplía el suelo de R2 (`s = 0.1929`, el 93% del claro),
así que R2 lo **fija** sin moverlo; `--status-done` queda fuera de alcance por la
decisión de D-V2. Tampoco se tocó `:root` salvo los 3 `--status-*-surface` de R5.

## Commits (en orden, test-primero por ciclo)

| Hash | Asunto | Toca |
|---|---|---|
| `8ab92a2` | `test(ui-dark-mode-chroma): saturation ceiling and dark primary floor (R1,R2,R3,R4)` | solo el `.test.ts` |
| `f8bff45` | `feat(ui-dark-mode-chroma): re-saturate the dark primary and its aliases (R1,R2,R3,R4)` | solo `styles.css` |
| `a3d26a3` | `test(ui-dark-mode-chroma): sRGB gamut audit and the two new dark primary pairs (R5,R6)` | solo el `.test.ts` |
| `1cd88ea` | `feat(ui-dark-mode-chroma): bring the 6 out-of-gamut tokens inside sRGB (R5,R6)` | solo `styles.css` |
| `2c423f0` | `test(ui-dark-mode-chroma): green hue, literal audit, verify report and scope (R7,R8,R9,R10,R11)` | solo el `.test.ts` |
| `4be24a0` | `feat(ui-dark-mode-chroma): bound the shared green in MASTER and register the amendment (R7,R9,R10)` | `MASTER.md`, spec de la 23, informe de R9 |

**Ningún `feat` toca un `*.test.ts` y ningún `test` toca implementación.** Cada
commit de test se verificó rojo con `pnpm vitest run` *antes* de existir la
implementación:

- `8ab92a2` → rojo en R2: `expected 0.09695950679557237 to be greater than or equal to 0.18070479491623337`.
- `a3d26a3` → rojo en R5, con los 6 tokens exactos que predijo la spec:
  `:root` → `--status-pending-surface`, `--status-approved-surface`,
  `--status-paid-surface`; `.dark` → `--status-approved`, `--status-paid`,
  `--status-rejected`.
- `2c423f0` → rojo en R9 (4 casos, el informe no existía) y R10 (la fila de
  enmienda no existía).

## Decisiones de diseño

- **Prefijo `ui-dark-mode-chroma R<n>` en los `describe` nuevos.** El archivo ya
  contenía `describe('R1: ...')`…`describe('R14: ...')` de la feature 23 y los
  R-ids colisionan. Sin el prefijo, la trazabilidad sería ambigua para el reviewer.
- **Tres ciclos rojo→verde, no once.** Se agrupan los requisitos que comparten el
  mismo cambio de token, como autoriza el rol: (R1,R2,R3,R4) comparten el cambio de
  `.dark --primary`; (R5,R6) comparten el reajuste de gamut; (R7,R8,R9,R10,R11) son
  los de documentación y alcance.
- **Tres requisitos aterrizan verdes y son guardas, no tests fallidos.** R1 (el
  techo ya se cumplía: el cambio es que ahora existe y es la métrica correcta), R3,
  R4, R7, R8 y R11 no podían fallar contra la hoja de estilos actual sin romperla a
  propósito primero. Fabricarles un rojo artificial habría sido teatro de TDD. Cada
  uno viaja en un commit de test que **sí** está rojo por otro requisito del grupo,
  y su valor real es de no-regresión: R3 rompe si alguien mueve `--primary` sin
  mover sus alias, R4 rompe si alguien satisface R2 oscureciendo el token, R8 rompe
  si alguien fija un literal nuevo.
- **El techo de R1 es la constante `SATURATION_CEILING = 0.2126`**, escrita con su
  origen en un comentario, **no derivada** de `:root --primary` en tiempo de test.
  `:root --primary` queda sujeto a ella (`s = 0.21259`, margen `0.00001`).
- **R8 se verifica auditando el propio archivo de test**: todo literal `oklch(...)`
  del test debe ser un valor declarado hoy en `:root`, o el violeta huérfano que la
  R3 de la 23 exige que no exista. Cualquier literal para un token de `.dark` —
  justo los que esta feature mueve— rompe el test.
- **R11 se verifica con la lista congelada de dependencias** de `frontend/package.json`
  (44 nombres). Añadir `culori` o `colorjs.io` para el gamut rompe el test a propósito.
  Cero dependencias nuevas: la conversión oklch→sRGB se amplió a mano.

## Output de build

```
✓ built in 786ms   (frontend, pnpm build)
```

## Output de tests

```
Test Files  35 passed (35)
     Tests  353 passed (353)
```

`./init.sh` → `✅ Todo verde. Listo para trabajar.` (backend + frontend + lint).
Sin rastro del flaky conocido de `general-approval-actions` en esta sesión.

## Qué queda pendiente

1. **R9 sub-item (2)**: ejecutar la sesión de navegador y rellenar las 4 secciones
   de `progress/verify_ui-dark-mode-chroma.md` con valores de `getComputedStyle`
   copiados en vivo.
2. **R9 sub-item (3)**: recoger el veredicto humano con fecha.

Hasta entonces el reviewer **no** debe aprobar el cierre, aunque `pnpm test` y
`pnpm build` estén en verde: los tests de esta feature verifican invariantes, y la
razón de que la feature exista es que un invariante verde puede seguir viéndose mal.

## Notas para el reviewer

- **C4 (test-primero)**: `git log --format="%h %s" 8584c79..HEAD` alterna
  `test(...)` / `feat(...)`. Comprobar con `git show --stat <hash>` que ningún
  `feat` incluye `styles.tokens.test.ts`. `8ab92a2` lleva un `--amend` (solo para
  arreglar un `@` que se coló en el asunto por sintaxis de heredoc equivocada; el
  contenido del commit no cambió).
- **R10, lo más delicado**: `git show 4be24a0 -- specs/ui-design-tokens/requirements.md`
  debe mostrar exactamente `1 insertion(+)` y cero borrados. Sus dos casillas
  `- [X] Aprobado por humano` siguen intactas.
- **R7, la parte sin test**: `design-system/odc/MASTER.md` §1, bloque "Acotación
  2026-08-11", justo después de la enmienda del verde. Nombra ambos tokens y dice
  explícitamente que la identidad de valor es solo en tema claro.
- **R11, alcance**: `git diff --name-only 8584c79..HEAD` devuelve 5 archivos, todos
  en la lista permitida. Cero archivos de `frontend/src/components/` y cero de
  `backend/`.
- **Fuera de mi alcance y sin commitear**: `feature_list.json` (ya estaba en
  `in_progress` al empezar, cambio del leader) y `progress/current.md`. No los toqué;
  `feature_list.json` no está en la lista de R11 y su cambio no es mío.
- **Margen justo, ojo si algo se retoca**: los pares `light --status-pending`
  (4.70), `light --status-approved` (4.80) y `light --status-rejected` (4.62, el
  peor de los 26) tienen poco margen sobre el mínimo de 4.5. Cualquier retoque de
  esas superficies obliga a volver a correr la auditoría de contraste.
