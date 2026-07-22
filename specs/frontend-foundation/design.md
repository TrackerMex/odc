---
feature: "frontend-foundation"
status: approved        # draft | approved
tags: [harness, spec]
---

# Diseño — [[frontend-foundation]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.
>
> Revisión tras feedback humano sobre el primer draft: se incorporan 3
> decisiones explícitas (zod para validar el login, zustand para el store de
> sesión, bloques shadcn `login-01`/`sidebar-07` en vez de primitivos sueltos)
> — ver el razonamiento de cada una abajo.

## Decisiones técnicas

- **Sin capas domain/application/infrastructure en el frontend** (todos los
  requisitos): el apéndice de `docs/architecture.md` describe la Clean
  Architecture de módulos NestJS del **backend**; no define una estructura
  equivalente para el frontend. `docs/conventions.md` ya fija la estructura
  real de `frontend/`: rutas file-based en `src/routes/`, componentes en
  `src/components/`, utilidades en `src/lib/`. Esta spec sigue esa
  estructura tal cual, sin forzar el layering del backend sobre código de UI
  — hacerlo sería over-engineering para un cliente HTTP delgado y unas pocas
  rutas.

- **Cliente API como módulo de funciones puras en `src/lib/api.ts`** (R2–R4):
  una función base `apiFetch(path, init?)` que añade `credentials: 'include'`,
  serializa el body si aplica y parsea JSON; sobre ella, `login`, `logout` y
  `getMe` como funciones tipadas que llaman a los tres endpoints de
  `auth-users`. Ante status no-2xx, `apiFetch` rechaza con una clase propia
  `ApiError` (`status`, `message`); el caso particular `status === 401` que
  R4 exige poder distinguir se resuelve comprobando `error.status === 401` —
  no hace falta una subclase, más simple que una jerarquía de errores para un
  único caso especial (ver "Alternativas descartadas"). El cliente **nunca**
  redirige por sí mismo (ni toca `window.location` ni el router): mantiene
  `api.ts` testeable con `fetch` mockeado y sin depender del router, y deja
  la reacción a "sin sesión" en un solo lugar (`resolveSession()` + guards de
  R6/R10).

- **Validación del login con zod, `safeParse` manual, sin librería de
  formularios** (R7 — decisión del humano, reemplaza el chequeo manual
  "campo no vacío" del draft anterior): `src/lib/login-schema.ts` exporta
  `loginSchema = z.object({ email: z.string().email(), password:
  z.string().min(1) })`. El componente de login mantiene los valores de los
  dos campos en estado local de React (`useState`) y, en el submit handler,
  corre `loginSchema.safeParse(values)`; si `success` es `false`, se toma el
  primer mensaje por campo de `error.flatten().fieldErrors` y se muestra sin
  invocar `api.login`. Se evaluó `@tanstack/react-form` (ya dependencia del
  scaffold, y compatible con schemas zod vía su adaptador de "standard
  schema") pero se descarta igual que en el draft anterior: agregar zod no
  cambia la complejidad real del formulario (2 campos, 1 schema) como para
  justificar la maquinaria adicional de una librería de formularios — se
  reevalúa explícitamente y se mantiene el descarte (ver "Alternativas
  descartadas"). `zod` es dependencia nueva del frontend (no estaba en
  `package.json`).

- **Store de sesión con zustand** (R5, R6, R8, R10–R13 — decisión del humano,
  reemplaza la resolución "solo vía loader/contexto del router" del draft
  anterior tras reevaluarla contra un caso de uso concreto): `zustand` es
  dependencia nueva. `src/stores/session.store.ts` define un store mínimo
  `{ user: SessionUser | null, setUser(user), clear() }`, inicializado en
  `user: null`. Razón del cambio de decisión — dos problemas reales que el
  loader/contexto del router por sí solo no resolvía bien:
  1. **Round-trip redundante tras login**: `POST /api/auth/login` ya
     devuelve `{ user }` en la misma respuesta (ver `auth-users`). Sin un
     store compartido, la única forma de que el layout autenticado conociera
     ese usuario era esperar a que `_authenticated` volviera a ejecutar su
     `beforeLoad` y disparara un segundo `GET /api/auth/me` — una llamada de
     red duplicada para datos que ya están en memoria (R8, R13).
  2. **Lectura/actualización síncrona fuera del árbol de rutas**: el control
     de logout (dentro del layout, R12) necesita limpiar la sesión de forma
     síncrona sin esperar red, y cualquier componente futuro que NO cuelgue
     de `_authenticated` (p.ej. algo montado en `__root.tsx`) podría
     necesitar leer el usuario actual sin pasar por el contexto de una ruta
     específica. Un store de zustand es legible desde cualquier componente
     con un hook (`useSessionStore`), sin Provider ni prop-drilling.
  `resolveSession()` (`src/lib/session.ts`) sigue siendo la única función que
  llama a `getMe()`; ahora primero consulta el store (R5) y solo llama a la
  red si está vacío — así R6/R10 (los guards) y R13 (el caso post-login) se
  apoyan en la misma función. Zustand se usa **solo** para este store de
  sesión, no como mecanismo genérico de estado para el resto de la app (ver
  "Fuera de alcance" en [[requirements]]); tampoco se persiste (sin
  middleware `persist`) — cada recarga completa vuelve a resolver la sesión
  contra el backend, evitando una sesión "fantasma" en el cliente si la
  cookie ya expiró o fue borrada en el servidor.

- **Layout de rutas protegidas como ruta pathless `_authenticated`** (R6,
  R11, R12): TanStack Router file-based soporta rutas de layout con prefijo
  `_` que no añaden segmento a la URL. `src/routes/_authenticated.tsx` define
  `beforeLoad` que llama a `resolveSession()`; si devuelve `null`, lanza
  `redirect({ to: '/login' })` (R6); si devuelve un usuario (ya sea porque el
  store lo tenía o porque `getMe()` lo acaba de resolver), deja pasar la
  navegación. El componente del layout lee el usuario actual del store de
  zustand (no vía prop-drilling del resultado de `beforeLoad`) para que
  quede desacoplado de si el dato vino de esta navegación o de un login
  reciente (R11).

- **Ruta `/login` con guard inverso** (R7–R10): `src/routes/login.tsx` define
  su propio `beforeLoad` que llama a `resolveSession()`; si hay usuario,
  `redirect({ to: '/' })` (R10); si no, deja pasar y renderiza el formulario
  (R7). Tras un login exitoso (R8), el formulario escribe el usuario devuelto
  directamente en el store (`setUser(user)`) — sin volver a llamar
  `getMe()` — y navega con `router.navigate({ to: '/' })`; como
  `resolveSession()` ya encuentra el store poblado, `_authenticated` no repite
  la llamada de red (R13).

- **Logout** (R12): el control de logout (dentro de `nav-user`, ver bloque
  shadcn abajo) llama a `api.logout()` y, en su `then`, `clear()` sobre el
  store y `router.navigate({ to: '/login' })`. Al volver a entrar a
  `/login`, su `beforeLoad` llama a `resolveSession()`; como el store quedó
  en `null`, se invoca `getMe()`, que ahora rechaza con 401 (cookie
  limpiada) — el formulario se muestra (R10 con resultado `null`).

- **Bloque de login `login-01` de shadcn/ui, vía MCP `shadcn`** (R7, R9 —
  decisión del humano, reemplaza el ensamblado manual de
  `input`+`label`+`card`+`alert` del draft anterior): en vez de componer los
  primitivos a mano, se instala el bloque `login-01` del registry oficial
  (formulario centrado en `card` con email/password y botón de envío, sin
  columna de imagen ni testimonios — el más simple de los 5 bloques de login
  oficiales) y se adapta:
  - Se reemplaza su validación (si trae alguna decorativa) por el schema zod
    de R7 y su manejo de error por el de R9.
  - Se **elimina** cualquier enlace o acción del bloque sin backend real
    detrás — "Crear cuenta", "¿Olvidaste tu contraseña?", botones de login
    social — porque `auth-users` no expone esos endpoints (ver "Fuera de
    alcance"). No se dejan como links muertos.
  El implementer debe confirmar con el MCP `shadcn` (`search`/`view` antes de
  `add`) que `login-01` sigue siendo, al momento de implementar, el bloque de
  un solo formulario sin esas afordancias adicionales; si el registry cambió
  de nombre, usar el equivalente más simple y anotarlo en el commit y en
  `traceability.md`.

- **Bloque de sidebar `sidebar-07` de shadcn/ui, solo su parte `nav-user`,
  vía MCP `shadcn`** (R11 — decisión del humano, reemplaza el
  `app-layout.tsx` custom desde cero del draft anterior): se instala
  `sidebar-07` (el bloque que arma el patrón mostrado como `dashboard-01` en
  la web de shadcn) y del conjunto de archivos que genera (`app-sidebar.tsx`,
  `nav-main.tsx`, `nav-projects.tsx`, `nav-user.tsx`, `team-switcher.tsx`,
  más los primitivos `components/ui/sidebar.tsx`) esta feature adopta
  **únicamente**:
  - `nav-user.tsx` (adaptado): avatar + dropdown con `fullName`/`email`/
    `role` y la acción de logout (R11, R12).
  - El subconjunto mínimo de primitivos de `sidebar.tsx` necesario para
    montarlo (`SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarFooter`,
    `SidebarInset`) — lo suficiente para tener un layout con sidebar que
    envuelva `<Outlet />` y muestre `nav-user`.
  Se descartan explícitamente `nav-main.tsx`, `nav-projects.tsx` y
  `team-switcher.tsx`: traen navegación de secciones, lista de "proyectos" e
  selector de "equipos" que no existen como concepto en ODC — no hay
  multi-tenant ni multi-equipo, y la navegación real por rol todavía no está
  definida (llega con `frontend-odc-form`/`frontend-admin-flows`, features
  10–11). R11 se limita entonces a "layout con sidebar mínimo que muestra
  `fullName`/`role` vía `nav-user` + logout", no el dashboard completo del
  bloque. El implementer confirma con el MCP `shadcn` el nombre exacto del
  bloque vigente (`sidebar-07` o el que el registry indique como
  equivalente) antes de instalar.

## Archivos afectados

- `frontend/vite.config.ts` — añade `server.proxy['/api']` (R1).
- `frontend/package.json` — nuevas dependencias `zod` y `zustand` (el
  implementer corre `pnpm add zod zustand`; esta spec solo las documenta, no
  las instala).
- `frontend/src/lib/api.ts` (nuevo) — `apiFetch`, `ApiError`, `login`,
  `logout`, `getMe` (R2–R4).
- `frontend/src/lib/login-schema.ts` (nuevo) — `loginSchema` de zod (R7).
- `frontend/src/stores/session.store.ts` (nuevo) — store zustand
  `{ user, setUser, clear }` (R5, R8, R11, R12).
- `frontend/src/lib/session.ts` (nuevo) — tipo `SessionUser` y
  `resolveSession()`, que compone el store de zustand con `api.getMe` (R5,
  R13), reutilizada por ambos `beforeLoad`.
- `frontend/src/routes/_authenticated.tsx` (nuevo) — layout pathless con el
  guard de sesión (R6) y render del layout autenticado (R11).
- `frontend/src/routes/_authenticated/index.tsx` (nuevo, reemplaza a
  `frontend/src/routes/index.tsx`) — contenido protegido mínimo bajo el
  layout, para tener una ruta "/" real que ejercite R6/R11/R13 hasta que
  `frontend-odc-form` (id 10) la reemplace por el dashboard real.
- `frontend/src/routes/login.tsx` (nuevo) — guard inverso (R10) + render del
  formulario de login adaptado del bloque `login-01` (R7–R9).
- `frontend/src/components/login-form.tsx` (nuevo, generado a partir del
  bloque shadcn `login-01` vía MCP y adaptado: schema zod de R7, sin enlaces
  de registro/recuperación de contraseña).
- `frontend/src/components/nav-user.tsx` (nuevo, generado a partir del
  bloque shadcn `sidebar-07` vía MCP y adaptado: nombre/rol + logout, R11,
  R12) y `frontend/src/components/ui/sidebar.tsx` (nuevo, primitivos base del
  mismo bloque, solo lo necesario para montar `nav-user`) — los nombres
  exactos de archivo los fija el CLI de `shadcn` al instalar; el implementer
  los deja anotados en el commit/traceability si difieren de estos paths.
- `frontend/src/components/layout/app-layout.tsx` (nuevo) — compone
  `SidebarProvider`+`Sidebar`+`nav-user` alrededor de `<Outlet />` (R11).
- `frontend/src/routeTree.gen.ts` — regenerado por `tsr generate` al añadir
  rutas; no se edita a mano.
- `frontend/src/routes/index.tsx` — se elimina (su contenido se mueve al
  nuevo `_authenticated/index.tsx`).

## Alternativas descartadas

- **`QueryClientProvider` + React Query para la sesión**: descartado para
  esta feature — `resolveSession()` (store-first + `getMe()` como fallback)
  ya cubre R5/R6/R10/R13 sin caché adicional; introducir React Query aquí
  duplicaría responsabilidad con el store de zustand sin necesidad real
  todavía (no hay refetch en segundo plano, invalidación cruzada de queries
  ni mutaciones que lo justifiquen en esta feature). Nota: esto es sobre
  data-fetching de listas/mutaciones — la sesión ya tiene su propia solución
  (zustand) tras el cambio de decisión de esta revisión.
- **Context API de React en vez de zustand para la sesión**: descartado — un
  Context obligaría a envolver la app en un Provider y re-renderiza todo su
  árbol en cada cambio de usuario; un store de zustand (un hook, sin
  Provider) es más simple para un estado tan chico (`user` o `null`) y ya es
  una dependencia habitual junto a TanStack Router/Query en este tipo de
  stack.
- **Guard endpoint-a-endpoint (repetir `beforeLoad` en cada ruta protegida)**:
  descartado — un layout pathless (`_authenticated`) centraliza el guard una
  sola vez; cualquier ruta nueva nace protegida por defecto al anidarse bajo
  él (fail-safe, mismo principio que el `JwtAuthGuard` global de
  `auth-users`).
- **Token de sesión en `localStorage` accesible desde JS**: descartado — la
  decisión ya tomada con el humano (tabla de `plans/001-odc-purchase-system.md`)
  es cookie httpOnly; el cliente nunca ve ni almacena el JWT.
- **Persistir el store de zustand con su middleware `persist`**: descartado
  — guardar el usuario en `localStorage`/`sessionStorage` recrearía el mismo
  problema que el punto anterior (sesión "fantasma" client-side) si la cookie
  expira o se borra en el servidor sin que el store se entere; el store vive
  solo en memoria y se re-hidrata desde `GET /api/auth/me` en cada recarga
  (R5).
- **Clase `UnauthorizedApiError` como subclase de `ApiError`** para R4:
  descartado en favor de comprobar `error.status === 401` sobre la misma
  clase — una propiedad discriminante es suficiente y más simple que una
  jerarquía de errores para un único caso especial.
- **Redirección a `/login` dentro del propio cliente API** (p.ej. en
  `apiFetch` al ver 401): descartado — acoplaría `src/lib/api.ts` al router y
  lo haría imposible de testear sin mockear navegación; la responsabilidad de
  redirigir queda solo en los guards (R6, R10), que ya la tienen.
- **Formulario de login con `@tanstack/react-form` + adaptador zod**:
  reevaluado tras adoptar zod (el humano pidió reconsiderar la integración
  concreta) y descartado de nuevo — dos campos con un `safeParse` manual en
  el submit no necesitan el motor de estado/validación de una librería de
  formularios; queda disponible para los formularios más complejos de
  `frontend-odc-form` (id 10).
- **Instalar el bloque `sidebar-07`/`dashboard-01` completo (con
  `nav-main`, `nav-projects` y `team-switcher`)**: descartado — trae
  superficie (navegación de secciones, "proyectos", selector de "equipos")
  que no corresponde a ningún concepto de ODC todavía; se decide qué parte
  del resto del bloque (si alguna) se recupera cuando `frontend-odc-form`/
  `frontend-admin-flows` definan la navegación real por rol.
  Instalar solo `nav-user` desde ya evita reescribirlo luego a mano.
- **Componente de login/layout custom desde cero (sin bloque de shadcn)**:
  descartado tras el pedido explícito del humano — instalar y adaptar un
  bloque del registry oficial (`login-01`, `nav-user` de `sidebar-07`) es más
  rápido y más consistente visualmente que ensamblar los primitivos sueltos
  a mano, y sigue la convención ya obligatoria de `docs/conventions.md` de
  preferir shadcn/ui sobre componentes propios.
