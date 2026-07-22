# impl: frontend-foundation
Fecha: 2026-07-22

## Archivos creados
- `frontend/vite.config.test.ts` — test de R1 (proxy `/api`).
- `frontend/vitest.config.ts` — config de Vitest separada de `vite.config.ts` (entorno jsdom, setup file), para no arrastrar los plugins de build de TanStack Start/devtools al runner de tests.
- `frontend/src/test/setup.ts` — cleanup de Testing Library entre tests + stub de `window.matchMedia` (jsdom no lo implementa; lo necesita el hook `useIsMobile` del sidebar).
- `frontend/src/lib/api.ts` — `apiFetch`, `ApiError`, `getMe`, `login`, `logout` (R2-R4, y wrappers usados por R5/R8/R9/R12).
- `frontend/src/lib/api.test.ts` — tests R2, R3, R4.
- `frontend/src/lib/session.ts` — tipo `SessionUser` y `resolveSession()` (R5, R13).
- `frontend/src/lib/session.test.ts` — test R5.
- `frontend/src/stores/session.store.ts` — store zustand `{ user, setUser, clear }`, sin `persist`.
- `frontend/src/routes/_authenticated.tsx` — layout pathless con guard (`authGuardBeforeLoad`, R6) y render del layout autenticado (R11).
- `frontend/src/routes/_authenticated.test.tsx` — test R6.
- `frontend/src/routes/_authenticated/index.tsx` — placeholder protegido en `/` (reemplaza a `routes/index.tsx`).
- `frontend/src/routes/_authenticated.session-reuse.test.tsx` — test R13 (integración real de `resolveSession()` + guard, sin mockear `session.ts`).
- `frontend/src/routes/login.tsx` — guard inverso (`loginBeforeLoad`, R10) + render de `LoginForm` (R7-R9).
- `frontend/src/routes/login.test.tsx` — test R10.
- `frontend/src/lib/login-schema.ts` — `loginSchema` de zod (R7).
- `frontend/src/components/login-form.tsx` — adaptado del bloque shadcn `login-01`: validación zod (R7), login exitoso → store + navegación (R8), 401 → mensaje de error sin tocar store/nav (R9).
- `frontend/src/components/login-form.test.tsx` — tests R7, R8, R9.
- `frontend/src/components/nav-user.tsx` — adaptado del `nav-user` de `sidebar-07`: `fullName`/`role`/`email` + logout (R11, R12).
- `frontend/src/components/layout/app-layout.tsx` — compone `SidebarProvider`/`Sidebar`/`SidebarInset` + `NavUser` alrededor de `children` (R11).
- `frontend/src/components/layout/app-layout.test.tsx` — tests R11, R12.
- shadcn/ui instalado vía CLI (`login-01`, primitivos `sidebar`/`avatar`/`dropdown-menu`): `frontend/src/components/ui/{card,input,label,separator,field,avatar,dropdown-menu,sheet,sidebar,skeleton,tooltip}.tsx`, `frontend/src/hooks/use-mobile.ts`.

## Archivos modificados
- `frontend/vite.config.ts` — añade `server.proxy['/api']` → `http://localhost:3001`, `changeOrigin: true` (R1).
- `frontend/package.json` / `pnpm-lock.yaml` — nuevas dependencias `zod`, `zustand` (runtime) y devDependencies instaladas por el `add` de shadcn (ninguna nueva fuera de las ya declaradas en `components.json`).
- `frontend/tsr.config.json` — `routeFileIgnorePattern` para excluir `*.test.tsx` del codegen de rutas (los tests viven junto a los archivos de ruta, como pide `docs/conventions.md`).
- `frontend/src/routeTree.gen.ts` — regenerado (`pnpm generate-routes`) tras cada cambio de rutas; no editado a mano.

## Requisitos cubiertos
- R1: test `vite.config.test.ts::R1: dev server proxies /api to the backend`, commit `17e6c8f`
- R2: test `api.test.ts::R2: apiFetch sends credentials and parses JSON on 2xx`, commit `3eea981`
- R3: test `api.test.ts::R3: apiFetch rejects with status + message on non-2xx, non-401 responses`, commit `3eea981`
- R4: test `api.test.ts::R4: apiFetch rejects with a distinguishable 401 error, without redirecting`, commit `3eea981`
- R5: test `session.test.ts::R5: resolveSession() consults the session store before GET /api/auth/me`, commit `09bc5d0`
- R6: test `_authenticated.test.tsx::R6: protected route guard redirects to /login without a session`, commit `141ff6b`
- R7: test `login-form.test.tsx::R7: login form validates email/password with zod before submitting`, commit `eff8dcf`
- R8: test `login-form.test.tsx::R8: successful login stores the user and navigates to / without re-calling getMe`; implementación en `eff8dcf` (misma pasada del formulario que R7), test añadido en `1cc7ff1`
- R9: test `login-form.test.tsx::R9: failed login (401) keeps the user on /login with an error, store untouched`; implementación en `eff8dcf`, test añadido en `1cc7ff1`
- R10: test `login.test.tsx::R10: /login guard redirects to / when a session already exists`; implementación en `eff8dcf`, test añadido en `228f1e0`
- R11: test `app-layout.test.tsx::R11: authenticated layout shows fullName/role and a logout control, no section nav`, commit `fd9ca74`
- R12: test `app-layout.test.tsx::R12: logout calls the API, clears the session store and navigates to /login`, commit `fd9ca74`
- R13: test `_authenticated.session-reuse.test.tsx::R13: protected route reuses the post-login session without refetching`, commit `998b34e`

Commits adicionales (no atados a un R nuevo): `9465e20` refactor (eslint), `18ed0f1` style (prettier), `7cb4a8b` docs (specs + traceability final).

## Decisiones de diseño tomadas durante la implementación
- **MCP `shadcn` no disponible en esta sesión**: `frontend/.mcp.json` configura el servidor, pero mi sesión (subagente) no tenía las tools `mcp__shadcn__*` cargadas. Usé el CLI `npx shadcn@latest search|view|add` directamente (es lo que la tool MCP invoca por debajo) — confirmé con `search`/`view` antes de `add` que `login-01` y `sidebar-07` seguían siendo, tal cual dice `design.md`, los bloques vigentes más simples (un solo formulario; sidebar que colapsa a iconos). Lo anoto aquí y en los commits `eff8dcf`/`fd9ca74` porque `design.md` pedía dejar constancia si el mecanismo de instalación cambiaba.
- **`sidebar-07` instalado de forma quirúrgica, no como bloque completo**: en vez de `add sidebar-07` (que trae `app-sidebar.tsx`, `nav-main.tsx`, `nav-projects.tsx`, `team-switcher.tsx` — expresamente fuera de alcance) instalé solo los primitivos `sidebar`, `avatar`, `dropdown-menu` vía CLI y escribí `nav-user.tsx`/`app-layout.tsx` a mano adaptando el código fuente de `nav-user.tsx` del bloque (obtenido con `view`). Evita instalar-y-borrar archivos fuera de alcance.
- **Bug del CLI: `IconPlaceholder` con import roto**: los primitivos instalados en batch (`sidebar.tsx`, `dropdown-menu.tsx`, `sheet.tsx`) trajeron `import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"` — una ruta que solo existe en el sitio de docs de shadcn, no en este proyecto (no usamos Next.js app dir). Rompía el build. Reemplacé esos 5 usos puntuales por imports directos de `lucide-react` (`PanelLeftIcon`, `XIcon`, `ChevronRightIcon`, `CheckIcon`), ya dependencia del proyecto. Nada más de esos archivos se tocó.
- **`vitest.config.ts` separado de `vite.config.ts`**: mantiene los plugins de build (TanStack Start, devtools, tailwind) fuera del test runner; Vitest lo detecta automáticamente por convención (prioriza `vitest.config.ts` sobre `vite.config.ts` si ambos existen).
- **`tsr.config.json` con `routeFileIgnorePattern`**: necesario en cuanto añadí el primer test junto a un archivo de ruta (`_authenticated.test.tsx`) — sin esto, el codegen de TanStack Router trata cualquier archivo bajo `src/routes/` como candidato a ruta.
- **`_authenticated/index.tsx` reemplaza a `routes/index.tsx` ya en el commit de R6** (no en R11 como sugería el orden de "Archivos afectados" de `design.md`): un layout pathless sin hijos colisiona en el mismo path `/` que el `index.tsx` viejo — el build falla si no se mueve de inmediato. Documentado en el mensaje del commit `141ff6b`.
- **R8/R9/R10 comparten implementación con R7**: el formulario de login y el guard de `/login` son una sola pieza cohesiva; separar el código del ciclo TDD de cada R en el mismo archivo hubiera dejado el componente roto a medio camino. Implementé el flujo completo en el commit de R7 (`eff8dcf`) y añadí los tests de R8/R9/R10 en commits `test(frontend): ...` posteriores, dejándolo explícito en el mensaje de cada commit y en `traceability.md` (columna de commit señala ambos hashes).
- **`role` tipado como `string` en `SessionUser`** en vez de importar el union type `UserRole` de `backend/src/modules/users/domain/entities/user.entity.ts`: cruzar el límite de paquetes frontend→backend para un tipo es un acoplamiento que la spec no pide (R11 solo exige mostrar el rol como texto) y rompería el aislamiento del build de `frontend/`.

## Output de build
```
$ pnpm build (backend)  → nest build ✓ (sin salida = sin errores)
$ pnpm build (frontend) → vite build
✓ built in ~1.0s (client) / ~0.5s (ssr)
dist/client/assets/... (styles, login, _authenticated, index chunks)
dist/server/server.js  171.86 kB
```

## Output de tests
```
$ pnpm test (backend)  → Jest: 51 suites, 436 tests passed
$ pnpm test (frontend) → Vitest: 8 test files, 19 tests passed
```

`npx tsc --noEmit -p .` (frontend): sin errores.
`pnpm lint` (frontend): sin hallazgos en archivos de esta feature; quedan 5 findings preexistentes en primitivos generados por el CLI de shadcn (`button.tsx`, `field.tsx`, `sidebar.tsx`, `utils.ts` — estilo de import propio del CLI, `button.tsx`/`utils.ts` ya existían antes de esta feature). `frontend/pnpm lint` no forma parte de `LINT_CMD` en `init.config.sh` (solo backend).

## Notas para el reviewer
- El MCP `shadcn` configurado en `frontend/.mcp.json` no estaba disponible como tool en esta sesión (subagente); se usó el CLI equivalente (`npx shadcn@latest search/view/add`) siguiendo la misma disciplina de `search`/`view` antes de `add` que pedía `design.md`. Si el reviewer sí tiene el MCP disponible, puede confirmar independientemente que `login-01`/`sidebar-07` siguen vigentes.
- R8, R9 y R10 quedaron implementados en el mismo commit que R7 (`eff8dcf`) por la cohesión del componente de login; sus tests dedicados llegaron en commits posteriores (`1cc7ff1`, `228f1e0`). `traceability.md` referencia ambos commits para esos tres requisitos — revisar que esto sea aceptable como excepción al ciclo estrictamente commit-por-commit.
- Los primitivos `sidebar.tsx`/`dropdown-menu.tsx`/`sheet.tsx` traían un import roto (`IconPlaceholder` apuntando a una ruta de Next.js app-dir inexistente en este proyecto) tal como los generó el CLI de shadcn; se corrigió reemplazando esos 5 usos por iconos de `lucide-react` directos — vale la pena que el reviewer confirme que no hay más ocurrencias si se instalan bloques adicionales en `frontend-odc-form`/`frontend-admin-flows`.
- No se tocó `feature_list.json` ni `progress/current.md` (transición a `done` y cierre de sesión quedan fuera del rol de implementer).
- Zustand se usa exclusivamente para `session.store.ts`, sin `persist`, tal como fija "Fuera de alcance" de `requirements.md`.
