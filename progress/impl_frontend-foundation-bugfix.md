# impl: frontend-foundation (bug fix, sin commit)
Fecha: 2026-07-22

> Bug fix sobre la feature ya implementada `frontend-foundation` (id 9,
> reabierta a `in_progress`). No hay spec nueva ni requisitos nuevos — la
> spec aprobada (`specs/frontend-foundation/requirements.md`) sigue vigente
> sin cambios. **NO se hizo `git commit`**: todos los cambios quedan sin
> commitear en el working tree para revisión humana explícita.

## Causa raíz confirmada

`frontend/src/lib/api.ts` (`apiFetch`) construía la URL como ruta relativa
(`/api/auth/me`, etc.) y nunca reenviaba la cookie de la request entrante.
Con `docker compose up` real:

1. **URL relativa en SSR**: TanStack Start ejecuta `beforeLoad` de las rutas
   (`_authenticated.tsx`, `login.tsx`) también en el servidor (SSR). El
   `fetch` de Node exige URL absoluta — a diferencia del `fetch` del
   navegador, que resuelve rutas relativas contra el origin actual. Por eso
   `/` y `/login` reventaban con `Failed to parse URL from /api/auth/me` en
   el primer render (500).
2. **Cookie no reenviada**: aun arreglando la URL, el `fetch` de Node no
   reenvía automáticamente la cookie `odc_session` (httpOnly) de la request
   entrante del navegador. Sin reenviarla, `GET /api/auth/me` en SSR siempre
   devuelve 401, y el guard (R6/R10) redirige incorrectamente aunque el
   usuario tenga sesión válida.

Ambas causas fueron confirmadas corriendo la app real en Docker (no solo con
tests): ver sección "Verificación manual" abajo.

## Archivos modificados

- `frontend/src/lib/api.ts` — `apiFetch` ahora:
  - Detecta servidor con `typeof window === 'undefined'` y en ese caso
    construye la URL absoluta contra `API_BASE_URL` (env var, default
    `http://localhost:3001` — el mismo target que ya usa el proxy de
    `vite.config.ts` para R1). En cliente (navegador) sigue usando la ruta
    relativa sin cambios (R1-R4 intactos).
  - Reenvía el header `Cookie` de la request SSR entrante al backend,
    usando `createIsomorphicFn().server(...).client(...)` de
    `@tanstack/react-start` para obtener `getRequestHeaders()` de
    `@tanstack/react-start/server` **solo** en la implementación de
    servidor; el cliente es un no-op (el navegador ya maneja sus cookies).
- `frontend/src/test/setup.ts` — el `window.matchMedia` global ahora está
  guardado tras `if (typeof window !== 'undefined')`: este setup corre para
  todos los archivos de test, incluido el nuevo `api.ssr.test.ts` que fuerza
  entorno `node` (sin `window`) a propósito; sin el guard, el setup mismo
  reventaba con `ReferenceError: window is not defined` antes de correr ese
  archivo. No afecta ningún test existente en jsdom.
- `docker-compose.yml` — el servicio `frontend` ahora define
  `API_BASE_URL: http://backend:3001` (el backend es alcanzable como
  `backend` en la red de docker-compose, no `localhost`, solo para el uso
  server-side de arriba).
- `specs/frontend-foundation/traceability.md` — nota añadida (sin tocar las
  filas R1-R13 existentes) documentando la ampliación de cobertura de R2
  con el test de regresión de este bug (ver más abajo). No se creó ningún
  R14: es cobertura de regresión de un bug, no un requisito nuevo.

## Archivo creado

- `frontend/src/lib/api.ssr.test.ts` — test de regresión que sí hubiera
  atrapado el bug: fuerza `// @vitest-environment node` (sin `window`
  global) para ejercitar la rama de servidor de `apiFetch`, mockeando
  `@tanstack/react-start/server`. Asserta (a) que la URL con la que se llama
  a `fetch` es absoluta y no la ruta relativa que Node no puede parsear, (b)
  que el header `Cookie` viaja cuando `getRequestHeaders()` lo expone, y (c)
  que no revienta y omite el header cuando no hay contexto de request
  (p. ej. fuera de un handler real). Anotado en `traceability.md` como
  ampliación de R2, no como R14 nuevo (instrucción explícita del leader).

## Decisiones de diseño

- **`API_BASE_URL` en vez de hardcodear `http://backend:3001`**: mantiene
  `localhost:3001` como default (coincide con el proxy dev de R1 y con
  correr el frontend fuera de Docker) y permite a Docker sobreescribirlo sin
  tocar código.
- **`createIsomorphicFn()` en vez de un `typeof window` + `await import()`
  suelto para el header Cookie**: probé primero un import estático de
  `@tanstack/react-start/server` en el módulo (rompió el dev server SSR real
  con un deadlock de 60s+ en el "module runner" de Vite — confirmado
  reiniciando el contenedor varias veces) y luego un `await import(...)`
  perezoso dentro de un `if` (compiló en tests, pero `pnpm build` lo
  rechazó explícitamente: el plugin `tanstack-start-core:import-protection`
  del framework prohíbe importar `@tanstack/react-start/server` desde código
  alcanzable por el cliente, y sugiere exactamente `createIsomorphicFn`/
  `createServerOnlyFn`/mover el import a un `.server.ts`). `createIsomorphicFn`
  es la vía oficial: su compilador separa `.server()`/`.client()` por
  bundle, así que el import server-only nunca llega al bundle de cliente.
  Verificado inspeccionando `dist/client/assets/*.js` tras `pnpm build`: no
  aparece `getRequestHeaders` ni rastro del import ahí, solo en
  `dist/server/`.
- **`isServer()` (basado en `typeof window`) se mantiene para la URL**, no
  para el header: no requiere ningún import restringido, así que no tiene el
  mismo problema — usar `createIsomorphicFn` ahí también habría sido
  sobre-ingeniería innecesaria.

## Output de `pnpm test` (frontend)

```
> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run "--passWithNoTests"

 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend

 Test Files  9 passed (9)
      Tests  23 passed (23)
```

Los 8 archivos de test preexistentes (19 tests, R1-R13) siguen en verde sin
modificar su intención original; el noveno es el nuevo `api.ssr.test.ts` (4
tests).

## Output de `pnpm build` (frontend)

```
> frontend@ build
> vite build

vite v8.1.5 building client environment for production...
✓ 2138 modules transformed.
✓ built in 998ms
vite v8.1.5 building ssr environment for production...
✓ 131 modules transformed.
✓ built in 407ms
```

Build de cliente y de servidor (SSR) ambos verdes, sin errores del plugin de
import-protection.

## Verificación manual contra Docker real

Contenedores usados: `odc-frontend-1` (puerto 3000), `odc-backend-1` (puerto
3001), ya corriendo vía `docker compose up`. No se instalaron dependencias
nuevas (no hizo falta `pnpm install` dentro del contenedor). Se hizo
`docker restart odc-frontend-1` tras cada cambio relevante (y
`docker compose up -d frontend` al tocar `docker-compose.yml`, para que
recreara el contenedor con la nueva env var).

**Antes del fix** (código original, sesión sin cookie):
- `GET /login` → `500` (`Failed to parse URL from /api/auth/me`)
- `GET /` → `500` (mismo error)

**Después del fix**, contenedor recién reiniciado, sin cookie de sesión:
- `GET /login` → `200`
- `GET /` → `307` → `Location: /login` (correcto: sin sesión, R6 redirige)

**Después del fix**, con una cookie `odc_session` real (obtenida vía
`POST /api/auth/login` directo al backend en `:3001` con
`admin@odc.local` / `odc-dev-password`, usuario de seed):
- `GET /` con esa cookie → `200` (SSR reconoce la sesión — antes de reenviar
  la cookie, este caso hubiera dado `401`/redirect igualmente incorrecto)
- `GET /login` con esa cookie → `307` → `Location: /` (R10: sesión ya
  existente redirige fuera de `/login`)

Esto confirma ambas partes del fix funcionando end-to-end: URL absoluta (ya
no revienta) y reenvío de cookie (la sesión SSR se resuelve correctamente en
ambas direcciones).

## ⚠️ Hallazgo fuera de alcance — requiere decisión del leader/humano, NO lo arreglé

Durante la verificación manual encontré que **el store de sesión de zustand
(`useSessionStore`) es un singleton de módulo compartido entre requests SSR
del mismo proceso Node** — no solo dentro de una misma sesión de navegador.
Repro:

1. Reiniciar el contenedor (proceso Node limpio).
2. `GET /` sin cookie → `307` a `/login` (correcto).
3. `GET /` CON una cookie de sesión válida → `200` (correcto, el store se
   puebla vía `resolveSession()`/R5).
4. `GET /` de nuevo SIN ninguna cookie (simulando otro visitante/navegador)
   → `200`, **sin redirigir a `/login`** — porque R5 mira el store ANTES de
   llamar a `getMe()`, y el store ya quedó poblado en el paso 3 y vive en el
   mismo proceso Node para todos los requests subsiguientes, no por usuario.

Esto es un problema de aislamiento de sesión en SSR (potencial fuga de
sesión entre usuarios distintos en el mismo proceso de servidor), pero es
una decisión de arquitectura mayor (p. ej. no usar el store compartido
durante SSR, o resolver la sesión con contexto por-request en vez de un
store global) que excede el alcance de este bug fix (URL + cookie) y que no
debo decidir unilateralmente como implementer. Lo dejo señalado para que el
leader decida cómo (y si) abrirlo como bug/feature aparte — no toqué
`session.ts` ni el store para esto.

## Notas para el reviewer

- Revisar especialmente la decisión de `createIsomorphicFn` en `api.ts`:
  confirmar en `dist/client/assets/*.js` (tras `pnpm build`) que no aparece
  `getRequestHeaders` ni el import de `@tanstack/react-start/server`.
- El hallazgo de la sección anterior (store de sesión compartido entre
  requests SSR) no se corrigió a propósito — está fuera del alcance de este
  ticket. Decidir cómo escalarlo.
- **No se hizo `git commit`** — todos los cambios (`docker-compose.yml`,
  `frontend/src/lib/api.ts`, `frontend/src/test/setup.ts`,
  `frontend/src/lib/api.ssr.test.ts`, `specs/frontend-foundation/traceability.md`)
  quedan sin commitear en el working tree, tal como pidió el usuario, para
  que los revise él mismo antes de commitear.
- El contenedor `odc-frontend-1` quedó corriendo (reiniciado tras el fix)
  para que el humano pueda probarlo directamente en `http://localhost:3000`.

---

## Segunda sección — fix del hallazgo escalado: fuga de sesión entre visitantes en SSR

> Sigue siendo el mismo bug fix de `frontend-foundation` (id 9, `in_progress`),
> sin spec nueva ni R-ids nuevos. **Tampoco se hizo `git commit`** en esta
> sección: todo queda sin commitear en el working tree para revisión humana,
> tal como se pidió explícitamente.

### Causa raíz confirmada

`frontend/src/stores/session.store.ts` crea `useSessionStore` con
`create<SessionState>(...)` a nivel de módulo: una única instancia
compartida por todo el proceso Node, no por request ni por usuario.
`resolveSession()` (`frontend/src/lib/session.ts`) era "store-first": miraba
`useSessionStore.getState().user` antes de llamar a `getMe()`, y lo escribía
tras un `getMe()` exitoso. Ese patrón es correcto en el navegador (una
pestaña = un usuario), pero durante SSR el mismo store vive en memoria del
proceso Node y sobrevive entre requests de visitantes distintos:

1. Visitante A con cookie válida → `GET /` → `resolveSession()` llama a
   `getMe()`, lo resuelve y hace `setUser(fetched)` → el store queda
   poblado con el usuario de A para el resto de la vida del proceso.
2. Visitante B, sin ninguna cookie, mismo proceso → `GET /` →
   `resolveSession()` ve el store ya poblado (por A) y devuelve ese usuario
   **sin llamar a `getMe()` en absoluto** → B recibe el HTML
   server-renderizado con el `fullName`/`role` de A y ningún redirect a
   `/login`.

Confirmado en Docker antes del fix (ver repro al final de esta sección).

### Decisión de diseño tomada y por qué

**`resolveSession()` bifurca por `isServer()`** (la misma detección
`typeof window === 'undefined'` ya usada en `api.ts`, ahora exportada desde
ahí):

- **Servidor**: siempre resuelve fresco contra `getMe()` (que ya reenvía la
  cookie correcta gracias al fix de la sección anterior) y **nunca** lee ni
  escribe `useSessionStore`. Cada request obtiene su propio resultado; no
  hay estado compartido que pueda filtrarse entre requests.
- **Cliente**: sin cambios de comportamiento — sigue siendo store-first
  (evita un `GET /api/auth/me` redundante tras login, R8; permite que
  navegaciones cliente subsiguientes reutilicen la sesión sin refetch, R13).

El problema real no era solo "quién lee primero", sino "cómo llega el
usuario al layout autenticado en el primer render sin pasar por el store
compartido". Opción elegida: **contexto de ruta de TanStack Router**.

- `authGuardBeforeLoad` (`_authenticated.tsx`) ahora retorna `{ user }` en
  vez de `undefined` cuando hay sesión. TanStack Router fusiona ese valor de
  retorno en el `context` del match (confirmado leyendo
  `router-core/dist/esm/router.js`: `match.context = {...parentContext,
  ...match.__routeContext, ...match.__beforeLoadContext}`, donde
  `__beforeLoadContext` es exactamente lo que retorna `beforeLoad`). Ese
  contexto es por-request/por-render — no un singleton mutable — así que
  funciona igual en servidor y cliente sin riesgo de fuga.
- `AuthenticatedLayout` lee el usuario con `Route.useRouteContext()` para el
  render (server y cliente), no del store. Un `useEffect` (que por
  definición nunca corre en SSR, solo tras montar en el navegador) hidrata
  `useSessionStore` con ese mismo usuario **solo del lado cliente**, para
  que el logout (R12) y la reutilización de sesión en navegaciones
  posteriores (R13) sigan funcionando exactamente igual que antes.
- Verificado además que TanStack Start deshidrata/rehidrata
  `__beforeLoadContext` entre servidor y cliente (`ssr-server.js` lo
  serializa con la clave corta `"b"`, `ssr-client.js` lo reasigna en
  `match.__beforeLoadContext` en el cliente) — el `beforeLoad` no necesita
  volver a ejecutarse tras la hidratación para que el contexto llegue al
  componente, así que no hay ventana en la que el componente cliente vea un
  valor distinto al que efectivamente resolvió el servidor para ese request.

Se descartó la alternativa de "seguir usando el store pero resetearlo por
request": no existe forma segura de resetear un singleton de módulo entre
requests concurrentes del mismo proceso Node (dos requests podrían
solaparse), así que cualquier variante que siguiera tocando el store durante
SSR reintroduciría la misma clase de bug bajo concurrencia real.

### Archivos modificados

- `frontend/src/lib/api.ts` — `isServer()` ahora exportado (sin cambios de
  comportamiento), reutilizado desde `session.ts`.
- `frontend/src/lib/session.ts` — `resolveSession()` bifurca por
  `isServer()`; extraído `fetchSession()` (llama a `getMe()`, resuelve a
  `null` en 401) compartido por ambas ramas. La rama de servidor no toca
  `useSessionStore` en ningún punto.
- `frontend/src/routes/_authenticated.tsx` — `authGuardBeforeLoad` retorna
  `{ user }` (tipado `SessionUser`) en vez de `undefined`; `AuthenticatedLayout`
  lee el usuario de `Route.useRouteContext()` en vez de
  `useSessionStore((s) => s.user)`, y un `useEffect` hidrata el store con ese
  usuario solo en cliente. Se eliminó el guard `if (!user) return <Outlet />`:
  ya no hace falta, `user` viene tipado no-nulo desde el contexto.
- `frontend/src/routes/_authenticated.test.tsx` (R6) — ajustado el assert de
  "no redirige con sesión": ahora `authGuardBeforeLoad()` resuelve
  `{ user: mockUser }` en vez de `undefined`.
- `frontend/src/routes/_authenticated.session-reuse.test.tsx` (R13) — mismo
  ajuste de assert (`resolves.toEqual({ user })` en vez de
  `resolves.toBeUndefined()`); la cobertura de fondo (no se llama a `getMe`
  cuando el store ya tiene el usuario, en cliente) sigue intacta sin más
  cambios.

### Archivo creado

- `frontend/src/lib/session.ssr.test.ts` — fuerza
  `// @vitest-environment node` (sin `window` global) para ejercitar la
  rama de servidor de `resolveSession()`, mockeando `getMe`. Cubre: (a) que
  un store ya poblado se ignora y `getMe` se llama igual, (b) que un
  usuario resuelto en servidor nunca se escribe en el store, y (c) el caso
  pedido explícitamente — **dos llamadas consecutivas a `resolveSession()`
  en modo servidor, con `getMe` mockeado distinto en cada una (usuario
  resuelto vs. 401), no se contaminan entre sí aunque el store módulo siga
  vivo entre ambas llamadas del test.**

### Ajuste en trazabilidad

`specs/frontend-foundation/traceability.md` — nueva fila en la tabla de
"Ampliación de cobertura (bug fix post-aprobación, sin commit)" para
`session.ssr.test.ts`, marcada como cobertura ampliada de R5/R6/R10/R13 (no
un R-id nuevo), siguiendo la misma convención que la fila de `api.ssr.test.ts`
ya existente.

### Output de `pnpm test` (frontend)

```
> frontend@ test C:\Users\alex\Documents\sites\odc\frontend
> vitest run

 RUN  v4.1.10 C:/Users/alex/Documents/sites/odc/frontend

 Test Files  10 passed (10)
      Tests  27 passed (27)
```

Los 9 archivos de test preexistentes (23 tests, incluyendo el fix de
URL/cookie de la sección anterior) siguen en verde con solo los dos ajustes
de aserción descritos arriba; el décimo archivo es el nuevo
`session.ssr.test.ts` (4 tests).

### Output de `pnpm build` (frontend)

```
> frontend@ build
> vite build

vite v8.1.5 building client environment for production...
✓ 2138 modules transformed.
✓ built in 1.35s
vite v8.1.5 building ssr environment for production...
✓ 131 modules transformed.
✓ built in 673ms
```

Build de cliente y de servidor (SSR) ambos verdes.

### Verificación manual obligatoria en Docker (repro de los 4 pasos)

Contenedor `odc-frontend-1` reiniciado (`docker restart odc-frontend-1`,
proceso Node limpio) antes de correr el repro, backend/db ya corriendo sin
cambios.

**Antes de este fix** (comportamiento documentado por el implementer
anterior en el hallazgo fuera de alcance, sección previa de este mismo
archivo): paso 4 del repro devolvía `200` sin redirect, filtrando el
`fullName`/`role` de A al visitante B.

**Después de este fix**, mismo proceso, sin reiniciar entre pasos:

1. `docker restart odc-frontend-1` → proceso limpio confirmado (esperado
   hasta que `GET /login` respondiera `200`).
2. Sin cookie, `GET /` → **`307`**, `Location: /login` (correcto).
3. Con cookie `odc_session` real (obtenida vía
   `POST http://localhost:3001/api/auth/login` con
   `admin@odc.local` / `odc-dev-password`, seed real), `GET /` con esa
   cookie → **`200`**. Verificado además que el HTML servido contiene el
   nombre del usuario autenticado ("Administraci[óo]n" aparece en el body).
4. Sin ninguna cookie de nuevo, mismo proceso, sin reiniciar el contenedor →
   **`307`**, `Location: /login` (repetido tres veces seguidas para
   confirmar estabilidad, no solo un resultado aislado). Verificado
   explícitamente que el HTML servido a este "visitante B" contiene el
   formulario de login ("Ingresa a tu cuenta") y **no** contiene ningún
   rastro del nombre del usuario de la cookie del paso 3 (`grep` sobre el
   body no encontró coincidencias de "Administraci*").

Los 4 pasos quedan documentados con su resultado explícito: **antes roto
(200 sin redirect, fuga de sesión) → ahora corregido (307 a /login, sin
fuga, confirmado también a nivel de contenido HTML)**.

### Notas para el reviewer (segunda sección)

- Revisar la decisión de usar `Route.useRouteContext()` + hidratación del
  store en un `useEffect` de cliente, en vez de, por ejemplo, envolver todo
  en un `loader` o usar un patrón distinto de TanStack Start — se eligió
  por ser el mecanismo idiomático más simple para pasar datos resueltos en
  `beforeLoad` a un componente sin abrir un singleton nuevo.
- `useSessionStore` sigue siendo un módulo compartido — a propósito no se
  tocó `session.store.ts` para convertirlo en algo per-request (p. ej. vía
  contexto de React), porque su único uso restante es client-side
  (hidratado, logout, R13), donde un singleton de módulo es el patrón
  correcto y ya funcionaba bien antes de este bug.
- **Sigue sin haber `git commit`** — todos los cambios de ambas secciones
  de este documento (`docker-compose.yml`, `frontend/src/lib/api.ts`,
  `frontend/src/lib/session.ts`, `frontend/src/routes/_authenticated.tsx`,
  los tests ajustados/creados, `frontend/src/test/setup.ts`,
  `specs/frontend-foundation/traceability.md`) quedan sin commitear en el
  working tree para que el humano los revise antes de commitear.
- El contenedor `odc-frontend-1` quedó corriendo (reiniciado tras el fix)
  para que el humano pueda repetir el repro directamente si lo desea.
