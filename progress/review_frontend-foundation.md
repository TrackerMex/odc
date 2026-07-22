# review: frontend-foundation
Fecha: 2026-07-22
Veredicto: APROBADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature en `in_progress` (`frontend-foundation`, id 9) en `feature_list.json`
- [x] `progress/current.md` describe la sesión activa correctamente (feature, plan, estados de spec_author/implementer/reviewer)

## Checklist C3 — Arquitectura
- [x] N/A justificado: `docs/architecture.md` define Clean Architecture (domain/application/infrastructure) para módulos NestJS del **backend**; no aplica al frontend. `design.md` lo razona explícitamente y sigue en su lugar la estructura de `docs/conventions.md` (rutas file-based, `src/components/`, `src/lib/`). No hay lógica de negocio de backend filtrada al frontend (confirmado: `SessionUser.role` se tipa como `string` propio en vez de importar el union type del backend — evita acoplar paquetes).
- [x] `src/lib/api.ts` es el único punto que llama `fetch`; no redirige por sí mismo (verificado en código).

## Checklist C4 — TDD
- [x] Cada R1–R13 tiene al menos un test que lo nombra explícitamente (`describe('R<n>: ...')`) — verificado abriendo cada archivo de test: `vite.config.test.ts`, `api.test.ts` (R2-R4), `session.test.ts` (R5), `_authenticated.test.tsx` (R6), `login-form.test.tsx` (R7-R9), `login.test.tsx` (R10), `app-layout.test.tsx` (R11-R12), `_authenticated.session-reuse.test.tsx` (R13).
- [~] Historial de commits: R1-R6 y R11-R13 muestran test+implementación juntos por commit, consistente con el patrón de las 9 features previas del repo (`git log` revisado: ~60 commits anteriores, 100% test+impl en el mismo commit, sin excepciones). R7 se implementó junto con la lógica de R8/R9/R10 en `eff8dcf`, pero los tests de R8/R9/R10 se añadieron en commits posteriores (`1cc7ff1`, `228f1e0`) sin cambios de implementación adicionales — confirmado con `git show --stat`. Es la única excepción a la disciplina estricta test+commit-por-requisito de todo el proyecto. Ver "Observaciones" para el juicio detallado; no bloquea el veredicto porque CHECKPOINTS.md fija explícitamente "no se evalúa el camino, se evalúa el destino" y el destino (tests correctos, con nombre de R-id, en verde, y traceability.md honesto sobre los dos commits) se cumple.

## Checklist C5 — Trazabilidad
- [x] `traceability.md` existe y **no tiene ninguna fila "pendiente"** (las 13 filas están completas, incluidas R8/R9/R10 con referencia a ambos commits)
- [x] Commits siguen el formato `feat(<scope>): <desc> (R1,R2)` / `test(<scope>): <desc> (R…)`; scope `frontend` consistente

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` en frontmatter
- [x] Casilla "Aprobado por humano" marcada con fecha (2026-07-22)
- [x] Ningún requisito fue modificado después de la aprobación (frontmatter y contenido intactos, coherentes con `design.md`)

## Puntos señalados por el implementer — veredicto de cada uno

1. **MCP `shadcn` no disponible, uso del CLI `npx shadcn@latest search/view/add`**: ACEPTADO. La convención de `docs/conventions.md` ("usar las tools del MCP `shadcn`... en vez de escribirlo a mano") existe para evitar componentes custom, no para prohibir el mecanismo exacto de invocación. El CLI es lo que la tool MCP invoca por debajo; el implementer mantuvo la misma disciplina `search`→`view`→`add` exigida por `design.md` antes de instalar, y lo dejó documentado en commits (`eff8dcf`, `fd9ca74`) y en el impl report. El resultado — `login-01` y los primitivos de `sidebar-07` instalados correctamente desde el registry oficial — es lo que importa. Verificado: `frontend/src/components/ui/{card,field,input,label,separator,avatar,dropdown-menu,sheet,sidebar,skeleton,tooltip}.tsx` existen y corresponden a los primitivos esperados.

2. **R8/R9/R10 implementados en `eff8dcf` (junto a R7), tests dedicados en `1cc7ff1`/`228f1e0`**: Es una desviación real y verificada del patrón que el resto del proyecto sigue sin excepción (test+implementación en el mismo commit, ~60 commits previos revisados). El argumento de cohesión del implementer justifica agrupar la *implementación* de R7-R10 en un commit, pero no explica por qué los *tests* de R8-R10 no se escribieron y commitearon junto con esa misma implementación (técnicamente podían haberse agrupado los 4 `describe` en el mismo commit, como se hizo con R2-R4 en `3eea981` y R11-R12 en `fd9ca74`). Dicho esto, no es una violación que deba corregirse retroactivamente: ninguna fila de `traceability.md` quedó oculta o "pendiente", cada test nombra su R-id, todos pasan, y CHECKPOINTS.md antepone explícitamente evaluar el destino sobre el camino. **Recomendación no bloqueante**: en las próximas features (`frontend-odc-form`, etc.), mantener el estándar ya usado en R1-R6/R11-R13 — test y su implementación en el mismo commit, sin excepciones — para no erosionar la trazabilidad commit-a-commit que el resto del repo mantiene intacta.

3. **Bug del CLI (`IconPlaceholder`) parchado con iconos de `lucide-react`**: CONFIRMADO resuelto. `grep -r "IconPlaceholder" frontend/src` no arroja ninguna coincidencia. Los 5 usos reemplazados están verificados uno a uno: `sidebar.tsx` (`PanelLeftIcon`, 1 uso en `SidebarTrigger`), `dropdown-menu.tsx` (`ChevronRightIcon` en `SubTrigger`, `CheckIcon` x2 en `CheckboxItem`/`RadioItem`), `sheet.tsx` (`XIcon` en el botón de cierre) — total 5, coincide exactamente con lo reportado. El build de producción (`vite build`) terminó sin errores, lo que corrobora que no quedan imports rotos.

4. **`traceability.md` sin filas pendientes**: CONFIRMADO. Las 13 filas (R1-R13) tienen test y commit(s) asignados; ninguna dice "pendiente".

5. **zod/zustand fuera de alcance respetado**: CONFIRMADO por grep (`from 'zod'` solo en `login-schema.ts`; `zustand`/`persist` solo en `session.store.ts`, sin middleware `persist`, store en memoria pura). `session.ts` solo menciona "persist" en un comentario explicativo, no en código.

## Observaciones adicionales (no bloqueantes)
- El working tree tiene un diff sin commitear en `frontend/components.json` (`iconLibrary` y `registries`) — confirmado con `git log --follow` que ningún commit de esta feature lo tocó; es un residuo preexistente anterior al inicio de esta sesión (ya aparecía como `M` en el git status inicial). No afecta el build/tests actuales ni la spec de esta feature; se deja como nota para que se limpie o commitee intencionalmente en otro momento.
- `role: string` en `SessionUser` (en vez de importar el union type del backend) está bien justificado en el impl report: evita acoplar el build de `frontend/` a `backend/src`; consistente con "Fuera de alcance" de `requirements.md` (no se condiciona UI por valor de rol en esta feature).

## Output de ./init.sh
```
→ Build...
nest build ✓
vite build ✓ (client + ssr, sin errores)

→ Ejecutando tests...
Backend:  Test Suites: 51 passed, 51 total | Tests: 436 passed, 436 total
Frontend: Test Files  8 passed (8) | Tests  19 passed (19)

→ Lint...
eslint "{src,apps,libs,test}/**/*.ts" --fix → sin errores

✅ Todo verde. Listo para trabajar.
Features: 9/14 completadas | 4 pendientes
Próxima feature: [#10] frontend-odc-form (P1)
```
