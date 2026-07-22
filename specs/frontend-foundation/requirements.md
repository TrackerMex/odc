---
feature: "frontend-foundation"
status: approved        # draft | approved
tags: [harness, spec]
---

# Requisitos — [[frontend-foundation]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F9 `frontend-foundation`** de
> `plans/001-odc-purchase-system.md`, más la superficie de auth ya implementada
> en `auth-users` (`POST /api/auth/login`, `POST /api/auth/logout`,
> `GET /api/auth/me`, cookie httpOnly `SameSite=Lax`, payload `{sub, role}`),
> más 3 decisiones de diseño explícitas del humano tras revisar el primer
> draft de esta spec: (1) el formulario de login valida con un schema **zod**,
> no con un chequeo manual de "campo vacío"; (2) el estado de sesión en el
> cliente vive en un store **zustand** compartido, no solo en el
> loader/contexto del router; (3) el login y el layout autenticado se arman a
> partir de **bloques de shadcn/ui** (`login-01`, `sidebar-07`) instalados vía
> el MCP `shadcn`, adaptados al alcance real de esta feature, en vez de
> ensamblar primitivos sueltos a mano. Ver [[design]] para el razonamiento de
> cada una. Estado real de `frontend/` en el momento de escribir esta spec:
> scaffold TanStack Start + React 19 + Tailwind 4 con `src/routes/__root.tsx`,
> `src/routes/index.tsx` (placeholder del starter), `src/router.tsx`,
> `src/lib/utils.ts`, `src/components/ui/button.tsx` (shadcn ya instalado),
> `components.json` y `frontend/.mcp.json` (servidor MCP `shadcn`) ya
> configurados, alias `#/*` y `@/*` ya apuntando a `./src/*` en
> `tsconfig.json`. Ningún cliente API, ninguna ruta `/login`, ningún guard de
> sesión, ningún store cliente y ningún proxy dev existen todavía — eso es lo
> que esta feature entrega. Los tests que verifican estos requisitos son
> unitarios/de componente (Vitest + Testing Library): el cliente API, el
> router y `fetch` se mockean, no se levanta el backend real (ver [[design]]).

## Requisitos funcionales

- **R1**: WHEN el servidor de desarrollo de Vite se configura THE SYSTEM SHALL
  definir un proxy para cualquier ruta que empiece con `/api` hacia
  `http://localhost:3001` con `changeOrigin: true`, de modo que en desarrollo
  el navegador vea el backend como same-origin (sin CORS).
  *Verificación*: test unitario que importa la configuración de
  `frontend/vite.config.ts` y asserta que `server.proxy['/api']` existe con
  `target: 'http://localhost:3001'` y `changeOrigin: true`, sin arrancar
  ningún servidor.

- **R2**: WHEN cualquier parte de la aplicación invoca el cliente API para
  hacer una petición THE SYSTEM SHALL emitir un `fetch` con
  `credentials: 'include'` hacia la ruta indicada y, ante una respuesta 2xx,
  SHALL devolver el body ya parseado como JSON.
  *Verificación*: test unitario del cliente API con `fetch` global mockeado:
  asserta que la opción `credentials: 'include'` viaja en la llamada y que el
  valor resuelto es el JSON parseado de una respuesta 200 simulada.

- **R3**: IF la API responde con un status distinto de 2xx y distinto de 401
  THEN THE SYSTEM SHALL rechazar la promesa con un error que expone el status
  HTTP y el mensaje del body de error.
  *Verificación*: test unitario del cliente API con `fetch` mockeado
  devolviendo 400 y 500 en dos casos: asserta que la promesa se rechaza con un
  error cuyo `status` y `message` corresponden a la respuesta simulada.

- **R4**: IF la API responde con status 401 THEN THE SYSTEM SHALL rechazar la
  promesa con un error distinguible de los demás (p.ej. propiedad
  `status: 401`), sin que el cliente API ejecute ninguna redirección por sí
  mismo — la reacción a la sesión ausente es responsabilidad de R5/R6/R10.
  *Verificación*: test unitario del cliente API con `fetch` mockeado
  devolviendo 401: asserta que el error rechazado es identificable como 401
  (mismo mecanismo que R3, pero comprobando que el llamador puede
  distinguirlo del resto de errores).

- **R5**: WHEN la aplicación resuelve la sesión actual a través de una función
  `resolveSession()` THE SYSTEM SHALL consultar primero el store de sesión
  (zustand): IF el store ya contiene un usuario THEN THE SYSTEM SHALL
  devolverlo sin invocar `GET /api/auth/me`; IF el store está vacío
  (`user: null`) THEN THE SYSTEM SHALL invocar `GET /api/auth/me` a través del
  cliente API, y si resuelve con éxito, SHALL guardar en el store el usuario
  `{ id, email, fullName, role }` devuelto y devolverlo; IF esa petición
  rechaza con el error 401 de R4 THEN THE SYSTEM SHALL dejar el store en
  `user: null` y devolver `null` en lugar de propagar el error.
  *Verificación*: test unitario de `resolveSession()` en tres escenarios: (a)
  store con usuario ya presente → `getMe` (spy) NO se invoca y se devuelve ese
  usuario; (b) store vacío + `getMe` resuelve con éxito → el store queda con
  el usuario y se devuelve; (c) store vacío + `getMe` rechaza con 401 → el
  store queda en `null` y se devuelve `null` sin lanzar.

- **R6**: WHEN se navega a una ruta protegida THE SYSTEM SHALL invocar
  `resolveSession()` (R5) y, si el resultado es `null`, SHALL redirigir la
  navegación a `/login` antes de renderizar el componente de la ruta; si el
  resultado es un usuario, SHALL dejar proceder la navegación.
  *Verificación*: test unitario del guard (`beforeLoad`) del layout de rutas
  protegidas con `resolveSession()` mockeada: devuelve `null` → asserta
  redirección a `/login`; devuelve un usuario → asserta que NO redirige.

- **R7**: WHEN un usuario abre `/login` THE SYSTEM SHALL renderizar un
  formulario con campos `email` y `password` y un control de envío; WHEN se
  envía el formulario THE SYSTEM SHALL validar los valores contra un schema
  zod que exige `email` con formato de correo sintácticamente válido
  (`z.string().email()`) y `password` no vacío (`z.string().min(1)`); IF esa
  validación falla THEN THE SYSTEM SHALL NOT invocar el login y SHALL mostrar
  el/los mensaje(s) de error de validación derivados del schema, sin navegar.
  *Verificación*: test de render (Testing Library) de la ruta/componente de
  login en dos casos de fallo — (a) email con formato inválido
  (`"not-an-email"`) y password no vacío, (b) email válido y password
  vacío — assertando en ambos que la función de login del cliente API NO se
  invoca y que se muestra el mensaje de validación correspondiente; un tercer
  caso con ambos campos válidos queda cubierto por R8.

- **R8**: WHEN el usuario envía el formulario de login, la validación de R7
  pasa, y la petición `POST /api/auth/login` resuelve con éxito THE SYSTEM
  SHALL escribir el usuario devuelto directamente en el store de sesión (sin
  volver a invocar `GET /api/auth/me`) y navegar a la ruta autenticada raíz
  (`/`).
  *Verificación*: test de render con `api.login` mockeado resolviendo
  `{ user }`: completa el formulario con datos válidos, simula el envío, y
  asserta que el store de sesión queda con ese usuario, que `api.getMe` (spy)
  NO fue invocado durante el proceso, y que se invocó la navegación a `/`.

- **R9**: IF la petición de login rechaza con el error 401 de R4 (tras pasar
  la validación de R7) THEN THE SYSTEM SHALL permanecer en `/login`, SHALL NOT
  modificar el store de sesión, mostrar un mensaje de error visible al
  usuario y NO navegar a ninguna otra ruta.
  *Verificación*: test de render con el login del cliente API mockeado
  rechazando con el error 401: completa y envía el formulario con datos
  sintácticamente válidos, asserta que se muestra un mensaje de error, que el
  store de sesión sigue en `null` y que la navegación no fue invocada.

- **R10**: WHEN un usuario navega a `/login` THE SYSTEM SHALL invocar
  `resolveSession()` (R5); IF devuelve un usuario THEN THE SYSTEM SHALL
  redirigirlo a `/` en lugar de mostrar el formulario; IF devuelve `null`
  THEN THE SYSTEM SHALL dejar pasar la navegación y renderizar el formulario.
  *Verificación*: test unitario del guard/loader de la ruta `/login` con
  `resolveSession()` mockeada en ambos casos: usuario presente → asserta
  redirección a `/`; `null` → asserta que NO redirige (se muestra el
  formulario).

- **R11**: WHEN una ruta protegida se renderiza para un usuario autenticado
  THE SYSTEM SHALL leer ese usuario del store de sesión y mostrarlo (su
  `fullName` y su `role`) en un layout con sidebar mínimo — subconjunto
  adaptado del bloque shadcn `sidebar-07`: solo el componente de usuario
  (`nav-user`) y los primitivos base de `sidebar` necesarios para montarlo —
  junto con un control para cerrar sesión; THE SYSTEM SHALL NOT incluir
  navegación de secciones/proyectos ni selector de equipos del bloque
  original (fuera de alcance, ver "Fuera de alcance").
  *Verificación*: test de render del layout con el store de sesión
  pre-poblado con un usuario mockeado: asserta que el texto de `fullName` y
  `role` está presente, que existe un control de "Cerrar sesión" (o
  equivalente accesible), y que NO hay ningún elemento de navegación de
  proyectos/equipos en el DOM.

- **R12**: WHEN el usuario activa el control de cerrar sesión THE SYSTEM
  SHALL invocar `POST /api/auth/logout` a través del cliente API, limpiar el
  store de sesión (`user: null`) y navegar a `/login`.
  *Verificación*: test de render del layout con el logout del cliente API
  mockeado: simula el click en el control, asserta que se invocó el endpoint
  de logout, que el store de sesión quedó en `null`, y que se navegó a
  `/login`.

- **R13**: WHEN, inmediatamente después de un login exitoso (R8), el usuario
  es dirigido a una ruta protegida THE SYSTEM SHALL renderizarla sin invocar
  de nuevo `GET /api/auth/me`, porque el store de sesión ya quedó poblado por
  R8 y el guard de R6 lo reutiliza vía R5.
  *Verificación*: test del guard de R6 con el store de sesión PRE-poblado
  (simulando el estado inmediatamente posterior a un login exitoso) y un spy
  sobre `api.getMe`: asserta que el spy NO fue invocado y que la ruta
  protegida se renderiza sin redirección.

## Fuera de alcance

- Formularios y dashboards específicos de ODC (creación, aprobación, pago,
  factura) — features `frontend-odc-form` (id 10), `frontend-admin-flows`
  (id 11), `frontend-general-approval` (id 12) y `frontend-payment-invoice`
  (id 13).
- Cualquier vista o comportamiento condicionado por el valor concreto del
  `role` más allá de mostrarlo como texto en el layout (R11) — los dashboards
  por rol llegan con las features 10–13.
- Navegación de secciones, lista de "proyectos" y selector de equipos del
  bloque `sidebar-07` (`nav-main`, `nav-projects`, `team-switcher`) — no se
  instalan ni se adaptan en esta feature; se retoman (o se descartan del
  todo) cuando `frontend-odc-form`/`frontend-admin-flows` definan la
  navegación real por rol.
- Enlaces o acciones del bloque `login-01` sin backend real detrás (p.ej.
  "Crear cuenta", "¿Olvidaste tu contraseña?", login social) — se eliminan al
  adaptar el bloque; `auth-users` no expone esos endpoints.
- Persistencia de sesión en `localStorage`/`sessionStorage`, o cualquier
  middleware de persistencia del store de zustand (p.ej. `persist`): el store
  vive solo en memoria del cliente y se re-hidrata desde `GET /api/auth/me`
  en cada recarga completa (R5); la fuente de verdad de la sesión sigue
  siendo la cookie httpOnly del backend.
- Zustand como store general de la aplicación: en esta feature se usa
  exclusivamente para el usuario autenticado, no como mecanismo genérico de
  estado compartido para features futuras.
- Refresh tokens o renovación silenciosa de sesión — el backend (`auth-users`)
  no los implementa; una sesión expirada (401) se resuelve con un nuevo login.
- Configuración de CORS/proxy de producción — R1 cubre solo el proxy de
  desarrollo (`vite dev`); el despliegue de producción no está decidido
  todavía.
- Sistema global de notificaciones/toasts — el mensaje de error de R9 es
  local al formulario de login, no un mecanismo reutilizable.
- Componentes o bloques shadcn/ui no necesarios para login/layout (tablas,
  diálogos, formularios complejos, etc.) — se instalan en las features que
  los necesiten.
- Tests end-to-end de navegador — solo Vitest + Testing Library, según
  `docs/conventions.md`.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-22) ← gate obligatorio antes de implementar
