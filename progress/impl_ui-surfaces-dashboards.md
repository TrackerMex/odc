# impl: ui-surfaces-dashboards

Fecha: 2026-08-11
Feature 25 — fases 3a + 3e del refactor visual. Rama `ui-design-system-docs`,
sin push. Base: `1f4884b` (spec aprobada por humano).

## Archivos creados

- `frontend/src/components/odc/odc-status-badge.test.tsx` — render de las 8
  badges: par de tokens por estado (R1), ausencia de variantes `dark:` de color,
  contrato accesible `data-status` + etiqueta + sin borde + transición (R2).
- `frontend/src/components/odc/executive-tasks.test.tsx` — la quinta superficie
  no tenía test propio. Cubre R3, R4, R7 (SHALL NOT) y R9.
- `progress/verify_ui-surfaces-dashboards.md` — acta de la sesión de navegador de
  R14, con sus 5 secciones **en PENDIENTE**. Esqueleto solamente: ningún valor
  medido, ninguna captura, ningún veredicto.

## Archivos modificados

Los seis del alcance de R15, y nada más:

- `odc-status-badge.tsx` — las 8 clases de paleta → los 8 pares
  `bg-status-*-surface text-status-*`; desaparecen las 16 variantes `dark:`.
- `odc-dashboard.tsx` — ancho, padding, header, tracking, CTA (`lg` → `sm`,
  cierre de D-V3), barra de acento por cola, contador, filas, radios.
- `admin-dashboard.tsx` — ídem sin CTA.
- `general-dashboard.tsx` — ídem, con la constante local `QUEUE_ACCENT`.
- `executive-dashboard.tsx` — ancho, padding, header (+ borrado de
  `roleCopy.description` y de su tipo), tracking, contador, filas, radios, ámbar
  literal → `--status-pending`.
- `executive-tasks.tsx` — ancho, padding, header, tracking, filas, radios.

Tests: `design-system.guardrails.test.ts` (auditorías de código fuente de R1, R5,
R6, R10, R11 y las guardas de R12–R15) y los 5 `*.test.tsx` de dashboard.

## Requisitos cubiertos

Ver `specs/ui-surfaces-dashboards/traceability.md` para la tabla completa con
test y hashes. Resumen: R1–R13 y R15 implementados y verdes; de R14 solo la
parte del implementer (el esqueleto del acta).

## Commits

Doce commits en pares test→feat, más un `fix`. Ningún `feat` toca un `*.test.*`;
ningún `test` toca código de producción.

| Hash | Asunto |
|---|---|
| `5ddeca0` | test(ui-surfaces-dashboards): assert the status badge consumes the --status-* token pairs (R1,R2) |
| `1811136` | feat(ui-surfaces-dashboards): map the status badge onto the --status-* token pairs (R1,R2) |
| `f1373cc` | test(ui-surfaces-dashboards): assert the 1400px console width and the compact header (R3,R4) |
| `4240a1d` | feat(ui-surfaces-dashboards): widen the surfaces to 1400px and compact their headers (R3,R4) |
| `384162e` | test(ui-surfaces-dashboards): assert label tracking and CTA density (R5,R6) |
| `9994dd9` | feat(ui-surfaces-dashboards): use the 0.06em label tracking and the sm CTA size (R5,R6) |
| `19a0da0` | test(ui-surfaces-dashboards): assert queue accent bars, card padding, empty state and counters (R7,R8) |
| `749946e` | feat(ui-surfaces-dashboards): add queue accent bars and shrink counters and empty states (R7,R8) |
| `494fdf7` | test(ui-surfaces-dashboards): assert denser rows, token radii and zero literal colour (R9,R10,R11) |
| `fe84b91` | feat(ui-surfaces-dashboards): densify rows and move radii and ageing alerts onto tokens (R9,R10,R11) |
| `99036cd` | test(ui-surfaces-dashboards): guard the six at-risk assertions and audit test values, scope and verification record (R12,R13,R14,R15) |
| `595158f` | feat(ui-surfaces-dashboards): add the browser verification record skeleton (R14) |
| `8fd4cc5` | docs: bookkeeping del leader mientras el implementer estaba detenido |
| `879624d` | fix(ui-surfaces-dashboards): make the card header pb-3 win over the primitive variant (R7) |

## Decisiones de diseño

- **Un test nuevo por archivo del alcance, no por archivo del `design.md`.**
  `design.md` §"Archivos afectados" enumera "los 5 de dashboard", pero
  `odc-status-badge.tsx` y `executive-tasks.tsx` no tenían test propio y R2, R3,
  R4 y R9 los necesitan. R15 autoriza explícitamente "los seis
  `components/odc/*.tsx` del alcance **y sus archivos de test**", así que se
  crearon `odc-status-badge.test.tsx` y `executive-tasks.test.tsx`.

- **`pb-3` necesitó `!` (commit `879624d`).** La primitiva `CardHeader` trae
  `[.border-b]:pb-(--card-spacing)`, que compila a
  `.\[\.border-b\]\:pb-\(--card-spacing\).border-b` — dos clases, especificidad
  (0,2,0). Un `pb-3` plano (0,1,0) pierde y el valor declarado queda **inerte**:
  el header seguiría a 1rem abajo. `components/ui/` está fuera de alcance (R15),
  así que la superficie marca su propio valor con `pb-3!`. Verificado en el CSS
  compilado: `pb-3\!{padding-bottom:calc(var(--spacing) * 3)!important}`. Hay
  precedente en el repo (`ui/toast.tsx` usa `rounded-2xl!`). Alternativa
  descartada: quitarle el `border-b` al header, que cambia el separador visual.

- **Radios (R10).** `rounded-2xl` → `rounded-card` en tarjetas, contenedores de
  sección y estados vacíos; `rounded-(--radius)` en el chip de mes de
  `executive-dashboard` y en los seis envoltorios de foco de los `Link`, que es
  lo que R10 llama "controles, chips y envoltorios de foco".

- **Barra de acento (R7).** `border-l-2` + `border-l-status-*` en el `CardHeader`.
  El color sale de la prop `status` en `QueueCard` y `AdminQueue`; en
  `general-dashboard.tsx` es la constante local `QUEUE_ACCENT =
  'border-l-status-budget'`, no derivada de `page.items[0].status`, para que una
  cola vacía siga teniendo color. Un mapa estático por estado porque Tailwind no
  genera clases construidas en runtime.

- **Ámbar de las alertas (R11).** `border-amber-200 dark:border-amber-900/60` →
  `border-status-pending/50`, y `text-amber-600 dark:text-amber-400` →
  `text-status-pending`. La opacidad del borde es elección del implementer: R13
  la deja abierta porque ni el MASTER ni `pages/dashboard.md` fijan el tono de un
  borde de tarjeta de alerta. Se mira en R14.

- **Filas multilínea a `py-3` (R9).** El test afirma la restricción
  (`/\bpy-[23]\b/` y no `py-4`), no el valor, porque R13 prohíbe fijar en un test
  un valor visual que no esté en la fuente normativa.

- **R6 se verifica por ausencia.** El test de render afirma que el CTA **no**
  lleva `h-9` (la altura del tamaño `lg`) y que conserva `focus-visible:ring`; la
  auditoría de código afirma que no queda ningún `size: 'lg'` y que
  `odc-dashboard.tsx` usa `size: 'sm'`, que sí está escrito en
  `pages/dashboard.md`. Los 36px → 32px reales solo se leen con
  `getComputedStyle`: es la sección 2 de R14.

- **La auditoría de R13 mira valores arbitrarios de Tailwind.** Extrae de los
  siete archivos de test de la feature todo `…-[<número><unidad>]` y exige que
  aparezca literalmente en `MASTER.md` o en `pages/dashboard.md`. Los cuatro
  trackings prohibidos se excluyen: se afirman **ausentes**, no fijados. Lleva su
  propia comprobación de no-vacuidad (`max-w-[1400px]`, `tracking-[0.06em]`).

- **Detector de color literal deduplicado.** `LITERAL_COLOR` y las listas
  `FROZEN_*` de la feature 23 pasaron del cuerpo de su `describe` al ámbito de
  módulo para que R11 y R15 los reutilicen. Ni las aserciones ni los nombres de
  test de la 23 cambian.

## Aserciones en riesgo (R12) — comprobadas una a una

Ninguna de las seis se editó. Las dos que R4 y R7 tocaban de frente:

- `executive-dashboard.test.tsx:143` sigue verde porque el eyebrow de rol es
  `copy.label` = "Operaciones"; el párrafo borrado era `copy.description`, que no
  contenía la palabra.
- `general-dashboard.test.tsx:88` sigue devolviendo exactamente 2 "Dirección
  General": el eyebrow de página y el de la tarjeta. La barra de acento se añadió
  **sin** tocar el eyebrow de la tarjeta.

Las seis quedan además guardadas por
`design-system.guardrails.test.ts::ui-surfaces-dashboards R12`, que falla si
alguien borra la línea en el futuro.

## Output de build

```
$ pnpm build
✓ built in 787ms
dist/server/server.js  172.53 kB │ gzip: 43.15 kB
```

## Output de tests

```
$ pnpm test
 Test Files  37 passed (37)
      Tests  469 passed (469)
```

Baseline antes de empezar: 35 archivos / 353 tests. La feature añade 2 archivos
de test y 116 aserciones. `general-approval-actions` no falló en ninguna
ejecución de esta sesión.

## Qué queda pendiente

1. **La sesión de navegador de R14.** `progress/verify_ui-surfaces-dashboards.md`
   tiene sus 5 secciones en PENDIENTE. El implementer **no** rellenó valores de
   `getComputedStyle`, no inventó capturas y no redactó el veredicto: eso sería
   fabricar evidencia. Lo hacen el leader y el usuario.
2. Dentro de esa sesión, la **observación** sobre si las 8 badges de `.dark` se
   ven lavadas (decisión humana 3: solo se registra, no se toca ningún token).
3. El **veredicto sobre `/tasks` a 1400px** (decisión humana 1): si las filas
   estiradas no se sostienen, la salida es enmendar
   `design-system/odc/pages/dashboard.md` con firma humana, nunca saltarse R3.
4. `feature_list.json` sigue sin marcar `done`. Lo hace el leader tras la
   aprobación del reviewer.

## Notas para el reviewer

- **Mirar el `879624d` con lupa.** Es el único commit que no nace de un ciclo
  rojo-verde: corrige un `pb-3` que los tests daban por bueno (la clase estaba
  presente) pero que el CSS compilado dejaba inerte. jsdom no computa cascada, así
  que ningún test de esta feature podía detectarlo; se detectó leyendo el CSS de
  `pnpm build`. Si se prefiere otra salida, la única alternativa sin `!` es tocar
  `components/ui/card.tsx`, que R15 prohíbe.
- **R12, R13 y R15 son guardas y nacen en verde**, igual que las que la feature 23
  dejó en este mismo archivo. Solo R14 estuvo rojo antes de su implementación.
  Está dicho en el cuerpo del commit `99036cd`.
- `git status` limpio fuera de la lista de R15: cero cambios en
  `frontend/src/styles.css`, cero en `frontend/src/components/ui/`, cero en
  `design-system/`, cero en las specs de las features 23 y 24.
- Sin dependencias nuevas, sin tokens nuevos, sin `console.log`, sin `TODO`.
