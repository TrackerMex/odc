# impl: install-playwright
Fecha: 2026-07-27

## Alcance
Instalación de Playwright en frontend/ para validación de UI en navegador real por agentes implementer/reviewer. Tarea ad-hoc de tooling, sin spec EARS ni R-ids — no aplica TDD por requisito.

## Archivos creados/modificados
- `frontend/playwright.config.ts` — config generada por `create-playwright`, editada: `testDir: './e2e'` (renombrado desde `tests/` para no confundirse con `src/test/` de vitest), `baseURL: 'http://localhost:3000'`, y `webServer` que levanta `pnpm dev` reutilizando un server ya corriendo en ese puerto (`reuseExistingServer: !process.env.CI`). Incluye un comentario explícito documentando que `pnpm dev` solo NO basta (ver sección "Cómo correrlo").
- `frontend/e2e/login.spec.ts` — smoke test único. Reemplaza el `tests/example.spec.ts` boilerplate del scaffold (navegaba a playwright.dev, cero valor para este repo — se borró). Navega a `/login` y verifica que el formulario real de la app sea visible (texto "Ingresa a tu cuenta", `data-testid="login-form"`, labels Email/Password, botón "Ingresar"), reutilizando los mismos selectors que ya usa `login-form.test.tsx` (vitest).
- `frontend/package.json` — agregado `"e2e": "playwright test"` a scripts; `@playwright/test ^1.62.0` agregado a devDependencies por el scaffold (`pnpm add --save-dev @playwright/test`).
- `frontend/pnpm-lock.yaml` — actualizado por el mismo `pnpm add`.
- `frontend/.gitignore` — el scaffold de `create-playwright` ya agregó automáticamente `/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/`, `/playwright/.auth/`. No hizo falta editarlo a mano; no toca `playwright.config.ts` ni `e2e/`.
- `frontend/vitest.config.ts` — agregado `exclude: [...configDefaults.exclude, 'e2e/**']`. Necesario: vitest por defecto también matchea `*.spec.ts`, así que sin esto intentaba correr `e2e/login.spec.ts` como test de vitest y fallaba con "Playwright Test did not expect test() to be called here" (dos test runners compitiendo por el mismo glob).
- Navegador `chromium` descargado localmente vía `pnpm exec playwright install chromium` (no queda en git, vive en `%LOCALAPPDATA%\ms-playwright`).

## Cómo correrlo (para futuros agentes)
```
pnpm --dir frontend exec playwright test
# o
pnpm --dir frontend run e2e
```

**Prerequisito real, no solo el dev server de frontend**: hace falta el stack completo arriba —
`docker-compose up -d` desde la raíz del repo (levanta `db` + `backend` + `frontend`, puertos
5432/3001/3000), o `backend` + Postgres corriendo localmente en el puerto 3001. Esto NO es
opcional ni solo para rutas autenticadas — **hasta la pantalla pública de `/login` lo necesita**.

Verificado empíricamente en esta sesión: `src/routes/login.tsx` corre `loginBeforeLoad` en SSR,
que llama a `resolveSession()` → `getMe()` (`src/lib/session.ts`, `src/lib/api.ts`). En SSR,
`resolveUrl()` arma una URL absoluta (`http://localhost:3001` por default, vía `API_BASE_URL`) y
hace `fetch` directo al backend, sin pasar por el proxy de Vite. `apiFetch` solo atrapa 401
(`error instanceof ApiError`); un error de conexión (backend caído) no se atrapa y revienta la
render SSR. Confirmado con un dev server standalone en un puerto libre y `API_BASE_URL` apuntando
a un puerto inexistente: `curl http://localhost:3003/login` devolvió **HTTP 500**, no la pantalla
de login. Con el backend real disponible (docker-compose up, puerto 3001), el mismo `curl` devolvió
200 con el formulario renderizado.

Si `webServer` de `playwright.config.ts` arranca `pnpm dev` desde cero sin el backend arriba, el
smoke test (y cualquier test futuro) va a fallar en el primer `page.goto('/login')` con un 500 —
no es un bug de la config, es el comportamiento real de la app. `reuseExistingServer: true`
significa que si ya tenés el stack completo corriendo (como en esta sesión, vía docker-compose en
el puerto 3000), Playwright reutiliza ese server en vez de levantar uno nuevo sin backend.

## Decisiones de diseño
- **Carpeta `e2e/` en vez de `tests/`** (default del scaffold): el repo ya tiene `frontend/src/test/`
  (setup de vitest) y `backend/test/` (e2e de NestJS). Usar `e2e/` en la raíz de `frontend/` evita
  la ambigüedad de tener dos carpetas casi-homónimas (`tests/` vs `src/test/`) con propósitos
  distintos.
- **Solo Chromium** (`--browser chromium` en el scaffold), no los 3 navegadores por default: reduce
  tiempo/peso de instalación (~190 MB vs ~500+ MB) para un caso de uso de validación visual rápida
  por agentes, no de cobertura cross-browser. Se puede ampliar después si hace falta (editar
  `projects` en `playwright.config.ts`).
- **Se borró el `example.spec.ts` del scaffold**: apuntaba a `https://playwright.dev/` — cero
  relación con esta app, puro placeholder. Se reemplazó por `login.spec.ts`, un smoke test real
  contra la UI del proyecto, reutilizando los mismos selectors (`data-testid`, labels) que ya
  usa `login-form.test.tsx` para consistencia entre vitest y Playwright.
- **`webServer` sí configurado** (el scaffold lo deja comentado por default): se activó porque el
  CLI lo soporta limpio y el propio `package.json` ya expone `pnpm dev` en el puerto correcto. Se
  documentó explícitamente en el config y en este reporte que por sí solo no alcanza (ver arriba).
- **Bug del scaffold**: `pnpm dlx create-playwright@latest --browser chromium .` falla
  (`Invalid installation targets: '.'`) porque arma mal el comando de instalación de navegadores
  cuando se combina `--browser` con el `rootDir` posicional `.`. Workaround: se dejó que el scaffold
  fallara después de escribir `playwright.config.ts`/`tests/`/`package.json` (esos pasos sí
  corrieron bien) y se instaló el navegador aparte con
  `pnpm exec playwright install chromium`.

## Output de build
```
> frontend@ build C:\Users\alex\Documents\sites\odc\frontend
> vite build

vite v8.1.5 building for production...
✓ built in 2.36s
vite v8.1.5 building ssr environment for production...
✓ 170 modules transformed.
✓ built in 1.05s
```
(output completo de chunks omitido por longitud — build terminó sin errores, dist/client y dist/server generados correctamente)

## Output de tests (vitest)
```
> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run "--" "--run"

 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend

 Test Files  30 passed (30)
      Tests  202 passed (202)
   Start at  18:58:32
   Duration  31.97s
```
Nota: una corrida previa tuvo 1 timeout intermitente en
`executive-dashboard.test.tsx > R3 ... renders task context...` (5000ms) — no relacionado a estos
cambios (el archivo no toca esa suite); se re-corrió y pasó limpio. Probable ruido de carga de la
máquina durante la sesión (build + docker + playwright corriendo en paralelo).

## Output de playwright test (smoke)
```
Running 1 test using 1 worker

[1/1] [chromium] › e2e\login.spec.ts:12:1 › login page renders the login form
  1 passed (3.5s)
```
Corrido dos veces: una vez con `pnpm exec playwright test`, otra con `pnpm run e2e` — ambas
pasaron igual, contra el stack ya levantado vía `docker-compose` (contenedores `odc-frontend-1`,
`odc-backend-1`, `odc-db-1` ya estaban `Up` al iniciar esta sesión).

## Commit
- `8aac44b` — `chore(frontend): add playwright for browser validation`
- Archivos incluidos: `frontend/.gitignore`, `frontend/e2e/login.spec.ts`, `frontend/package.json`,
  `frontend/playwright.config.ts`, `frontend/pnpm-lock.yaml`, `frontend/vitest.config.ts`
- No se pusheó (no solicitado).
- Nota: el working tree tenía otros cambios sin relación (`frontend/src/routeTree.gen.ts`,
  `progress/current.md`, `progress/history.md`, `.agents/`, `.claude/skills/impeccable/`, `.codex/`,
  `progress/impl_typeset-odc-components.md`, `progress/review_typeset-odc-components.md`) de otra
  feature en curso (`typeset-odc-components`, a juzgar por los nombres). Se dejaron intactos y
  fuera de este commit — no son parte de esta tarea.

## Notas para el reviewer
- Verificar que el hallazgo sobre SSR + backend obligatorio (incluso para `/login`) es correcto
  releyendo `src/lib/api.ts::resolveUrl`/`apiFetch` y `src/routes/login.tsx::loginBeforeLoad` — es
  el punto más importante de este cambio y el que más puede sorprender a un agente futuro que
  espere correr Playwright con solo `pnpm dev`.
- Confirmar que `reuseExistingServer: !process.env.CI` en `playwright.config.ts` es el
  comportamiento deseado: en local reutiliza cualquier server ya arriba en `:3000` (típicamente el
  de docker-compose); si no hay nada arriba, intenta `pnpm dev` (que sin backend fallará en el
  primer test, de forma visible, no silenciosa).
- No se probó el camino "Playwright levanta `pnpm dev` desde cero sin nada corriendo" de punta a
  punta (hubiera requerido tumbar el docker-compose compartido de la sesión) — la conclusión de que
  fallaría se basa en la prueba aislada con `API_BASE_URL` apuntando a un puerto inexistente
  (HTTP 500 confirmado), que ejercita exactamente el mismo código.
- El scaffold dejó `@tanstack/eslint-config` con un peer-dependency warning preexistente
  (`eslint@^10.0.0` vs `eslint@9.39.5` instalado) — no lo generé yo, ya estaba en el lockfile antes
  de este cambio; no se tocó.
