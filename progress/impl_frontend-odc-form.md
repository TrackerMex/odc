# impl: frontend-odc-form (R13)
Fecha: 2026-07-27

## Alcance
Solo R13 (reorden de las cuatro secciones del dashboard `DIRECTOR_OPS`). R1-R12
ya estaban implementados y en producción; no se tocaron.

## Archivos modificados
- `frontend/src/components/odc/odc-dashboard.tsx` — se reordenó el array
  `sectionConfig` de `['BORRADOR', 'RECHAZADA', 'COMPRA_APROBADA',
  'EVIDENCIA_PAGO_SUBIDA']` a `['RECHAZADA', 'BORRADOR', 'COMPRA_APROBADA',
  'EVIDENCIA_PAGO_SUBIDA']`. Cambio puramente de orden de las entradas del
  array; ningún campo de cada entrada, `QueueCard`, el grid ni las consultas
  se modificaron.
- `frontend/src/components/odc/odc-dashboard.test.tsx` — se añadió el
  `describe('R13: ...')` con aserciones de orden en el DOM vía
  `compareDocumentPosition` (mismo patrón que
  `executive-dashboard.test.tsx::R13`), comprobando
  Rechazadas → Borradores → Listas para comprar → Pendientes de factura.
- `specs/frontend-odc-form/traceability.md` — fila de R13 actualizada con el
  test y ambos hashes de commit.

## Requisitos cubiertos
- R13: test `odc-dashboard.test.tsx::R13: DIRECTOR_OPS dashboard orders
  sections by visual priority`, commits `d4e4ee7` (test) y `522f5db` (feat)

## Commits (en orden)
1. `d4e4ee7` — `test(frontend-odc-form): add R13 dashboard order assertions`
   (solo `odc-dashboard.test.tsx`; confirmado en rojo contra el código viejo
   antes de commitear)
2. `522f5db` — `feat(frontend-odc-form): reorder dashboard sections per R13`
   (solo `odc-dashboard.tsx`)
3. `520a6ba` — `docs(frontend-odc-form): update traceability for R13` (solo
   `traceability.md`)

Cada commit se hizo con `git commit -m "..." -- <archivo>` (pathspec) en vez
de `git add` + `git commit` normal, porque el índice ya tenía ~303 archivos
de otras sesiones (`.agents/`, `.claude/skills/`, `.codex/`) staged de
antemano. El pathspec limita el commit exclusivamente al archivo nombrado sin
tocar el resto del índice, evitando arrastrar esos archivos ajenos a mis
commits. Verificado con `git diff --cached --stat` antes/después de cada
commit: siguen esos 303 archivos staged (intactos, no comiteados por mí) y
`feature_list.json`/`progress/current.md` siguen modified sin stagear, tal
como estaban al empezar.

## Decisiones de diseño
- Las aserciones de orden usan `screen.getByText(<título de cada tarjeta>)`
  en vez de `getByRole('region', ...)` porque `QueueCard` no expone un
  landmark `region` con `aria-label` por tarjeta (a diferencia de
  `executive-dashboard.tsx`); el texto del título (`CardTitle`) es único y
  suficiente para verificar orden en el DOM sin tocar `QueueCard`.

## Output de build
```
npx vite build
✓ built in 1.51s (client)
✓ built in 861ms (server)
```

## Output de tests
```
npx vitest run                 → 30 test files passed, 202 tests passed
npx vitest run odc-dashboard    → 2 tests passed (R1,R12 y R13)
```

## Notas para el reviewer
- Confirmar que la spec (`requirements.md`) tiene `status: approved` y ambas
  casillas de aprobación (R1-R12 y R13) marcadas — ya verificado por mí antes
  de implementar.
- El diff de `odc-dashboard.tsx` es exclusivamente el reordenamiento de dos
  bloques dentro de `sectionConfig` (6 líneas +/-), sin tocar `QueueCard`,
  estilos, grid ni datos.
- El índice de git tenía ~303 archivos staged de sesiones anteriores
  (`.agents/`, `.claude/skills/impeccable/`, `.codex/`) que no me
  correspondía tocar; no fueron incluidos en ninguno de mis 3 commits
  (verificar con `git show --stat <hash>` en cada uno).
- No se tocó `feature_list.json` (feature sigue `in_progress`, no se marcó
  `done`).
