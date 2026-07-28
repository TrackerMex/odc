# review: install-playwright
Fecha: 2026-07-27
Veredicto: APROBADO

## Contexto
Tarea ad-hoc de tooling (instalación de Playwright en `frontend/`), sin spec EARS ni R-ids.
Por instrucción del leader, C4/C5/C6 se marcan N/A con su razón. Aplican C2 y C3.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress relevante a este cambio (el resto de archivos sueltos en el
      working tree — `routeTree.gen.ts`, `progress/current.md`, `progress/history.md`, `.agents/`,
      `.claude/skills/impeccable/`, `.codex/`, `progress/impl_typeset-odc-components.md`,
      `progress/review_typeset-odc-components.md` — pertenecen a otra feature en curso
      (`typeset-odc-components`) y NO están en el commit `8aac44b`; confirmado con
      `git show --stat 8aac44b` y `git status --short`).
- [x] El commit `8aac44b` contiene exactamente los 6 archivos que el reporte del implementer dice:
      `frontend/.gitignore`, `frontend/e2e/login.spec.ts`, `frontend/package.json`,
      `frontend/playwright.config.ts`, `frontend/pnpm-lock.yaml`, `frontend/vitest.config.ts`.

## Checklist C3 — Arquitectura / alcance
- [x] El cambio se queda enteramente en `frontend/` (tooling de dev), no toca `backend/` ni
      lógica de negocio de la app.
- [x] `frontend/vitest.config.ts`: agrega `exclude: [...configDefaults.exclude, 'e2e/**']` —
      confirmado que separa correctamente los dos test runners (ver corrida de vitest abajo: 202
      tests, sin interferencia de Playwright).
- [x] `frontend/pnpm-lock.yaml`: diff revisado línea por línea — solo agrega el subárbol de
      `@playwright/test`/`playwright-core`/`playwright` (+ `fsevents@2.3.2` optional, dependencia
      transitiva de Playwright para darwin). Sin cambios a versiones de dependencias existentes.
- [x] `frontend/package.json`: solo agrega script `"e2e": "playwright test"` y la devDependency
      `@playwright/test`. Sin tocar otros scripts/deps.
- [x] `frontend/.gitignore`: agrega únicamente las 5 rutas estándar del scaffold de Playwright.

## Verificación del hallazgo SSR + backend obligatorio
Leí `frontend/src/routes/login.tsx` (`loginBeforeLoad` → `resolveSession()`), `frontend/src/lib/session.ts`
(`fetchSession()`) y `frontend/src/lib/api.ts` (`resolveUrl`, `apiFetch`). Confirmado el
razonamiento del implementer:
- `apiFetch` hace `fetch(resolveUrl(path), ...)` y solo inspecciona `response.ok`/`response.status`
  después de que el `fetch` resuelve. Un error de conexión (backend caído/puerto inexistente) hace
  que la promesa de `fetch` se **rechace** (TypeError de Node, no `ApiError`) antes de llegar a esa
  rama — no hay try/catch alrededor del `fetch` en `apiFetch`.
- `fetchSession()` en `session.ts` sí tiene un try/catch, pero solo absorbe el caso
  `error instanceof ApiError && error.status === 401` (comentario explícito: "una 401 de getMe
  significa que no hay sesión"). Cualquier otro error (incluyendo el TypeError de conexión
  rechazada) se re-lanza (`throw error`) sin atraparse.
- Ese error se propaga sin atrapar a través de `resolveSession()` → `loginBeforeLoad` (beforeLoad
  de la ruta `/login`), que corre en SSR. No hay manejo de error en `loginBeforeLoad` tampoco.
- Conclusión: el análisis del implementer es correcto — sin backend arriba, `/login` revienta en
  SSR con 500 antes de que el HTML del form llegue al navegador. No es exclusivo de rutas
  autenticadas.

## Verificación independiente
Stack completo confirmado arriba vía `docker compose ps` (`odc-backend-1`, `odc-db-1`,
`odc-frontend-1`, todos `Up`).

### `pnpm --dir frontend build`
```
✓ built in 1.96s (client)
✓ 170 modules transformed.
✓ built in 782ms (ssr)
```
Sin errores.

### `pnpm --dir frontend test -- --run`
```
 Test Files  30 passed (30)
      Tests  202 passed (202)
   Duration  22.46s
```
202/202, sin que Playwright interfiera (confirma que el `exclude: ['e2e/**']` en
`vitest.config.ts` funciona).

### `pnpm --dir frontend exec playwright test`
```
Running 1 test using 1 worker
[1/1] [chromium] › e2e\login.spec.ts:12:1 › login page renders the login form
  1 passed (1.8s)
```
Corrido en vivo contra el stack docker-compose ya levantado. Pasa.

## Observaciones
- Decisión de instalar solo Chromium (no los 3 navegadores): razonable para el propósito
  declarado (validación visual rápida de agentes implementer/reviewer, no cobertura
  cross-browser). El propio `playwright.config.ts` deja firefox/webkit comentados, fácil de
  ampliar si hace falta. Sin objeción.
- Decisión de borrar `example.spec.ts` boilerplate (apuntaba a `playwright.dev`, sin relación con
  el repo) y reemplazarlo por `login.spec.ts`: correcto, evita ruido y deja un smoke test real que
  reutiliza los mismos selectors (`data-testid`, labels) que `login-form.test.tsx` de vitest.
- El comentario en `playwright.config.ts` documentando el requisito de backend+Postgres arriba
  (no solo `pnpm dev`) es un buen detalle preventivo para agentes futuros — evita que alguien
  pierda tiempo diagnosticando un 500 que en realidad es un prerequisito de infraestructura, no un
  bug del test.
- Sin objeciones. No se encontró ningún archivo fuera de `frontend/` ni lógica de negocio tocada.

## Checklist C4 — TDD
N/A — tarea de tooling ad-hoc sin spec EARS ni R-ids, según alcance definido por el leader.

## Checklist C5 — Trazabilidad
N/A — no existe `specs/install-playwright/traceability.md`; no aplica por la misma razón que C4.

## Checklist C6 — Spec aprobada
N/A — no hay `specs/install-playwright/requirements.md`; tarea de tooling, no de feature de
producto.
