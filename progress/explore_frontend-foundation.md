# explore: frontend-foundation

Fecha: 2026-07-21

> Investigación pura para preparar el brief que `spec_author` convertirá en
> `specs/frontend-foundation/requirements.md` (F9). No se tocó código de
> aplicación, specs ni `feature_list.json`.

---

## 1. Qué ya está decidido vs qué queda abierto

### Decidido (no re-preguntar)

- **Stack frontend fijado**: TanStack Start + React 19 + Tailwind 4
  (`docs/conventions.md`, `plans/001-odc-purchase-system.md`). El plan **solo**
  nombra explícitamente `@tanstack/react-router` / `react-start` — no dice
  nada de Query/Table/Form/Store/Virtual. Esa elección queda abierta y es
  justo lo que F9 debe resolver.
- **Proxy `/api`**: el plan lo pide en palabras explícitas (línea ~173):
  *"en dev, el frontend (puerto 3000) proxya `/api` al backend (puerto 3001)
  vía `server.proxy` en `frontend/vite.config.ts` — así la cookie es
  same-origin y no hay CORS"*. Hoy `vite.config.ts` no tiene ningún `server`
  ni `proxy` (ver §2). El backend (`backend/src/bootstrap.ts`) no configura
  CORS en ningún punto — confirma que el proxy no es opcional, es la única
  vía para que la cookie httpOnly funcione sin CORS.
- **Auth por cookie httpOnly** `odc_session`, `SameSite=Lax`, `secure` solo en
  producción, `maxAge` 8h (`backend/src/modules/auth/infrastructure/session-cookie.ts`).
  El JWT se firma con `{ sub, role }` — el rol viaja en el token, no hace
  falta pedirlo aparte.
- **`GET /api/auth/me` es la fuente de sesión** para hidratar el contexto de
  usuario en el frontend (así lo nombra F9 en el plan).
- **Alias de imports** `#/*` → `./src/*` ya configurado en `package.json` y
  `tsconfig.json` (con un segundo alias `@/*` idéntico, redundante pero
  inofensivo).
- **Dependencia F9 → F2** (`auth-users`, ya `done`) y **F10–F13 → F9** —
  confirmado en `plans/README.md` "Dependency notes".
- **Brief F9 del plan maestro** (única fuente de alcance funcional dada):
  proxy `/api`, ruta `/login`, contexto de sesión desde `/api/auth/me`,
  `beforeLoad` que redirige a `/login` sin sesión, layout con nombre/rol +
  logout, cliente API tipado mínimo en `src/lib/api.ts` (fetch con
  `credentials: 'include'`, manejo de 401 → redirect login).

### Abierto (decisión real que F9 debe fijar)

- Ninguna librería del ecosistema TanStack más allá de Router/Start está
  decidida en ningún documento (`docs/architecture.md`, `docs/conventions.md`,
  `docs/specs.md`, `docs/verification.md`, `docs/obsidian.md` — sin
  menciones de Query/Table/Form/Store/Virtual, confirmado por grep).
  `docs/conventions.md` solo dice "rutas file-based en `frontend/src/routes/`,
  componentes en `frontend/src/components/`, utilidades en `frontend/src/lib/`"
  — no dice nada sobre gestión de estado de servidor ni formularios.
- Cómo se guarda el rol en cliente para los guards `beforeLoad` (contexto de
  React vs router context vs un store) no está especificado.
- El plan no dice si el "cliente API tipado" de F9 debe usarse crudo con
  `fetch` + tipos manuales, o envuelto en algo (React Query). Esto es
  exactamente la pregunta que el §4 de este documento responde con
  justificación por feature.

---

## 2. `frontend/package.json` y árbol `src/` actual

### Dependencias — TODAS sin pin de versión (riesgo)

```json
"@tanstack/react-devtools": "latest",
"@tanstack/react-router": "latest",
"@tanstack/react-router-devtools": "latest",
"@tanstack/react-router-ssr-query": "latest",
"@tanstack/react-start": "latest",
"@tanstack/router-plugin": "^1.132.0",
```
(`^1.132.0` sí está pineada; las 5 de arriba con `"latest"` no lo están.)

**Riesgo concreto**: `"latest"` en `package.json` no fija nada — el
`pnpm-lock.yaml` de hoy resolvió `@tanstack/react-router@1.170.18`, pero un
`pnpm install` con lockfile descartado (o en una máquina/CI sin el lockfile
cacheado) puede traer cualquier versión futura, incluyendo un major breaking
change, sin que nadie lo note hasta que algo falle en runtime. Cuando F9
agregue nuevas dependencias del ecosistema TanStack, deben fijarse con rango
explícito (`^x.y.z`), no `"latest"` — y sería razonable que F9 también
corrija las 5 existentes, ya que toca este mismo `package.json` de todas
formas.

Nota: `@tanstack/react-router-ssr-query` ya está instalado (probablemente
scaffolded por defecto de `create-tsrouter-app` para integrar TanStack Query
con SSR de Router) pero **`@tanstack/react-query` mismo NO está instalado**
— es decir, el scaffold trae el puente de integración pero no la librería
que integra. Confirma que Query es una pieza a agregar, no algo ya presente
a medias.

### Árbol `frontend/src/` completo (5 archivos, sin cambios desde el scaffold)

```
frontend/src/routeTree.gen.ts   ← generado por `tsr generate`, no se edita a mano
frontend/src/router.tsx         ← createRouter, sin queryClient ni contexto
frontend/src/routes/__root.tsx  ← <html>/<head>/<Scripts>, título "TanStack Start Starter"
frontend/src/routes/index.tsx   ← página de bienvenida del scaffold, sin lógica
frontend/src/styles.css
```

No existe: `src/lib/`, `src/components/`, ningún cliente API, ningún
contexto de sesión, ninguna ruta protegida, ningún `.env`/`.env.example` para
el frontend. `router.tsx` no registra `context` (`{ queryClient, session }`)
ni `Wrap`/`InnerWrap` — el `Register` de TanStack Router solo declara el tipo
`router`.

`vite.config.ts` (raíz de `frontend/`) — completo, no tiene `server.proxy`:
```ts
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
})
```

---

## 3. Inventario completo de endpoints backend (prefijo global `/api`)

Guards globales (`backend/src/app.module.ts`): `JwtAuthGuard` (lee cookie
`odc_session`, exige sesión salvo `@Public()`) → `RolesGuard` (exige
`@Roles(...)` si está presente; sin `@Roles` = cualquier autenticado). Errores
de dominio se traducen así (confirmado en `odc.controller.ts` +
`docs/conventions.md`): rol equivocado → 403 `ForbiddenException`; estado
equivocado → 409 `ConflictException`; dato faltante o supplier desconocido →
400 `BadRequestException`; recurso no encontrado → 404 `NotFoundException`;
sin sesión → 401. Nest serializa excepciones como
`{ statusCode, message, error }`.

### auth (`backend/src/modules/auth/infrastructure/controller/auth.controller.ts`)

| Método | Ruta | Roles | Body/Query | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | `@Public()` | `LoginDto{email,password}` | `{ user: AuthenticatedUser }` + set-cookie `odc_session` httpOnly |
| POST | `/api/auth/logout` | autenticado (sin `@Public`, sin `@Roles`) | — | `{ success: true }` + clear-cookie |
| GET | `/api/auth/me` | autenticado | — | `AuthenticatedUser{ id, email, fullName, role }` |

`AuthenticatedUser.role` ∈ `USER_ROLES = ['DIRECTOR_OPS','ADMINISTRACION','DIRECTOR_GENERAL']`.

### health (`backend/src/health.controller.ts`)

| Método | Ruta | Roles | Response |
|---|---|---|---|
| GET | `/api/health` | `@Public()` | `{ status: 'ok' }` |

### odc (`backend/src/modules/odc/infrastructure/controller/odc.controller.ts`)

| # | Método | Ruta | Roles | Body/Query | Notas |
|---|---|---|---|---|---|
| T1 | POST | `/api/odcs` | `DIRECTOR_OPS` | `CreateOdcDto{description,quantity(int>0),unit,unitPriceCents(int>0),supplier,comments?}` | crea `BORRADOR`; `supplier` debe matchear (case-sensitive) un `name` del catálogo o 400 (`odc-suppliers-catalog` R5) |
| — | GET | `/api/odcs?status=&page=` | cualquier autenticado | `ListOdcsQueryDto{status?∈ODC_STATUSES, page?>0}` | `OdcPageResponseDto{items,total,page,pageSize}`; visibilidad de `BORRADOR` solo para el creador la aplica el use-case |
| — | GET | `/api/odcs/:id` | cualquier autenticado | — | `OdcResponseDto` con `history: OdcStatusHistoryEntry[]` |
| T2/T10 | PATCH | `/api/odcs/:id` | `DIRECTOR_OPS` | `UpdateOdcDto` (todos los campos de T1, opcionales) | solo `BORRADOR`/`RECHAZADA` y solo el creador (lo valida el use-case, no el controller) |
| T2/T10 | POST | `/api/odcs/:id/submit` | `DIRECTOR_OPS` | — | `BORRADOR→PENDIENTE_ADMIN` o `RECHAZADA→PENDIENTE_ADMIN` |
| T3 | POST | `/api/odcs/:id/approve-budget` | `ADMINISTRACION` | — | `PENDIENTE_ADMIN→PRESUPUESTO_APROBADO` |
| T5 | POST | `/api/odcs/:id/approve-purchase` | `DIRECTOR_GENERAL` | — | `PRESUPUESTO_APROBADO→COMPRA_APROBADA` |
| T4/T6 | POST | `/api/odcs/:id/reject` | `ADMINISTRACION`, `DIRECTOR_GENERAL` | `RejectOdcDto{rejectionReason}` | ruta única compartida; el estado actual de la ODC decide cuál regla aplica |
| T7 | POST | `/api/odcs/:id/payment` | `DIRECTOR_OPS` | `RegisterPaymentDto{paymentDate(ISO),paymentMethod,paymentReference?,paymentNotes?}` | `COMPRA_APROBADA→PAGO_REGISTRADO` |
| T8 | POST | `/api/odcs/:id/payment-evidence` | `ADMINISTRACION` | multipart: `file` (pdf/jpg/png, ≤10MB) + `evidenceReference?` | `PAGO_REGISTRADO→EVIDENCIA_PAGO_SUBIDA` |
| T9 | POST | `/api/odcs/:id/invoice` | `DIRECTOR_OPS` | multipart: `file` + `warehouseEntryDate` (ISO, **obligatorio**) + `invoiceNumber?/invoiceDate?/observations?` | `EVIDENCIA_PAGO_SUBIDA→COMPLETADA` |
| — | GET | `/api/odcs/:id/files/:kind` (`kind`∈`evidence`\|`invoice`) | cualquier autenticado con visibilidad de la ODC | — | `302` a URL firmada de Cloudinary de corta expiración; `kind` fuera del enum → 400 antes de tocar Cloudinary |

`OdcResponseDto` completo (`infrastructure/mappers/odc-response.mapper.ts`):
`id, odcNumber, status (8 valores de ODC_STATUSES), description, quantity,
unit, unitPriceCents, totalCents, supplier, comments, createdById,
rejectionReason, paymentDate, paymentMethod, paymentReference, paymentNotes,
hasPaymentEvidence (bool, no expone el public_id), evidenceReference,
hasInvoice (bool), invoiceNumber, invoiceDate, warehouseEntryDate,
observations, createdAt, updatedAt, history: {id, odcId, fromStatus,
toStatus, userId, note, createdAt}[]`.

### suppliers (`backend/src/modules/suppliers/infrastructure/controller/supplier.controller.ts`)

| Método | Ruta | Roles | Response |
|---|---|---|---|
| GET | `/api/suppliers` | cualquier autenticado (sin `@Roles`) | `SupplierResponseDto[]{id,name}[]`, orden alfabético, sin paginar |

**Importante para F10**: el campo `supplier` de la ODC **ya no es texto
libre real** — aunque el DTO lo tipa `@IsString()`, el use-case rechaza con
400 cualquier valor que no matchee exactamente un `name` del catálogo. El
formulario de creación/edición de ODC (F10) debe poblarse desde
`GET /api/suppliers`, no ser un `<input type="text">`. Esto es contexto
nuevo que no estaba en el brief original de F10 en el plan maestro (que
todavía describe `supplier` como campo de texto) — el spec_author de F10 lo
necesitará, pero no es responsabilidad de F9 resolverlo, solo de anotarlo.

### Módulos backend existentes (para ubicar dónde vive cada cosa)

`auth`, `files` (Cloudinary, sin controller propio — expuesto vía las rutas
`/api/odcs/:id/files/:kind`), `odc`, `suppliers`, `users`.

---

## 4. Evaluación pieza por pieza del ecosistema TanStack

Cada recomendación está atada a un problema concreto de F9–F13, no a "porque
existe en el ecosistema".

### `@tanstack/react-query` → **sí, agregar en F9**

Problemas concretos que resuelve:
- **Invalidación de cache tras mutaciones que cambian de estado la ODC**
  (submit/approve-budget/reject/approve-purchase/payment/payment-evidence/
  invoice — F10–F13): cada una de estas 7 mutaciones debe refrescar tanto el
  detalle (`GET /api/odcs/:id`) como las listas de dashboard
  (`GET /api/odcs?status=`) de las que la ODC puede entrar o salir. Hacerlo a
  mano con `useState`/`useEffect` y refetch manual es exactamente el problema
  que `invalidateQueries`/`queryKey` resuelve de fábrica.
  Sin Query, F11–F13 reinventarían un cache ad-hoc para cada dashboard.
- **Contadores de dashboard** (Borradores, Rechazadas, Listas para comprar,
  Pendientes de factura, Pendientes de validar, Compras pagadas, Esperando mi
  aprobación — F10–F12): son la misma llamada `GET /api/odcs?status=X`
  repetida con distinto filtro; Query da dedupe + refetch-on-mutation sin
  esfuerzo adicional.
- **Manejo de 401 centralizado**: F9 pide "manejo de 401 → redirect login"
  en el cliente API. Con Query, ese manejo se hace una vez en un
  `queryClient` con `onError`/`retry: false` global en vez de repetirlo en
  cada componente que hace `fetch`.
- El scaffold **ya trae** `@tanstack/react-router-ssr-query` (el puente
  Router↔Query para SSR/dehydration) sin traer Query mismo — es una señal
  fuerte de que el scaffold fue generado anticipando esta pieza; agregarla
  completa el par que ya está a medias.

Cómo encaja con Router (ya presente): `beforeLoad`/loaders de rutas
protegidas pueden usar `queryClient.ensureQueryData` para la sesión
(`GET /api/auth/me`), evitando el parpadeo de "verificar sesión" en cada
navegación.

### `@tanstack/react-form` → **sí, agregar (útil ya en F9, imprescindible en F10)**

Problemas concretos:
- **Formulario de login (F9)**: validación de email/password antes de
  llamar a `/api/auth/login`, mostrar error 401 inline. Es el primer
  formulario del proyecto y fija el patrón que F10–F13 repetirán 6+ veces
  (crear/editar ODC, modal de rechazo, registrar pago, subir factura, subir
  comprobante).
- **Total calculado en vivo en el form de creación de ODC (F10)**: el mock
  exige `TOTAL = quantity × unitPrice` recalculado mientras el usuario
  escribe, con los mismos dos campos (`quantity`, `unitPriceCents`)
  validados como enteros positivos (mismas reglas que `CreateOdcDto`
  backend). `@tanstack/react-form` da validación por campo + valor derivado
  reactivo sin re-render manual innecesario — sin él, F10 terminaría
  reimplementando a mano el manejo de estado + validación + cálculo
  derivado que Form ya resuelve.
- **Modales de aprobar/rechazar con motivo obligatorio (F11/F12)**: un solo
  campo (`rejectionReason`) pero con la misma regla de "no vacío" que el
  backend (`RejectOdcDto`) — reutilizar el mismo patrón de formulario que
  F10 en vez de un `useState` + validación manual ad-hoc por modal.
- **Formularios de pago/factura (F13)**: múltiples campos con opcionales
  mezclados (`paymentDate`/`paymentMethod` obligatorios,
  `paymentReference`/`paymentNotes` opcionales; `warehouseEntryDate`
  obligatorio vs `invoiceNumber`/`invoiceDate`/`observations` opcionales) —
  mismo framework de validación reutilizado, consistencia entre las 6+
  pantallas de formulario del proyecto.

No se recomienda por "es parte del ecosistema" sino porque **todas** las
pantallas de F10–F13 son formularios con reglas de obligatoriedad que
espejean 1:1 las del backend (mismos campos, mismas reglas required/optional)
— vale la pena fijar un patrón único desde F9/F10 en vez de que cada feature
P2 (F11/F12/F13) improvise el suyo.

### `@tanstack/react-table` → **no, no hace falta**

Las "listas" de F10–F13 son listas de dashboard por estado (Borradores,
Rechazadas, Pendientes de validar, etc.), no tablas con sort/filter/paginación
de columnas complejas — el plan describe "contadores + listas filtradas por
estado" (§ Dashboards por rol), y el propio backend ya pagina y filtra por
`status` vía query params (`GET /api/odcs?status=&page=`). Una lista de
tarjetas/filas simples mapeadas con `.map()` sobre `items` cubre esto sin
librería adicional. Si en el futuro se pide ordenar por columnas, filtrar
por múltiples criterios en cliente, o una vista tipo "tabla completa" (el
plan menciona "más lista completa" para DIRECTOR_OPS, pero sin exigir
columnas interactivas), ahí sí valdría reconsiderar — hoy no está en el
alcance descrito de ninguna de las 5 features frontend.

### `@tanstack/react-store` → **no, no hace falta**

El estado que el frontend necesita es: (a) estado de servidor → ya cubierto
por Query; (b) estado de sesión/usuario → cabe en React Context poblado por
un loader de Router (`beforeLoad`/`context`) sin necesitar un store
independiente, dado que Router ya expone `context` tipado entre rutas; (c)
estado de formularios → cubierto por `react-form`. No hay ningún estado
"global cliente puro" descrito en F9–F13 (no hay carrito, no hay UI
colaborativa en tiempo real, no hay estado complejo cross-ruta que no sea ya
sesión o datos de servidor) que justifique una librería de estado adicional.
Agregar Store sería una capa sin problema concreto que resolver — exactamente
el caso que la instrucción pide señalar como "no hace falta".

### `@tanstack/react-virtual` → **no, no hace falta**

Virtualización se justifica con listas de cientos/miles de filas donde el
DOM completo sería costoso. Las listas de este proyecto son: ODCs por
usuario/rol filtradas por estado (un sistema interno de compras con volumen
bajo/medio) y un catálogo de 22 proveedores (`odc-suppliers-catalog`, lista
fija sembrada por seed). Ninguna de las dos tiene el volumen que justificaría
virtualización — es la definición misma del caso "no recomendar solo porque
existe en el ecosistema".

---

## 5. Gaps concretos de scaffold — archivo por archivo

Lo que F9 debe crear/modificar (sin implementarlo yo, solo enumerando):

| Archivo | Estado hoy | Qué debe agregar F9 |
|---|---|---|
| `frontend/vite.config.ts` | sin `server` | añadir `server: { proxy: { '/api': 'http://localhost:3001' } }` (el plan lo pide literal) |
| `frontend/src/lib/api.ts` | no existe | cliente API tipado: wrapper de `fetch` con `credentials: 'include'`, base `/api`, manejo de 401 (redirect a `/login`), tipos de request/response para los endpoints del §3 (mínimo: auth, odc, suppliers) |
| `frontend/src/lib/query-client.ts` (o dentro de `router.tsx`) | no existe | `QueryClient` instanciado una vez, inyectado al `router` vía `context` (patrón `@tanstack/react-router-ssr-query`, ya instalado) |
| `frontend/src/routes/login.tsx` | no existe | ruta pública con formulario email/password → `POST /api/auth/login`; en éxito, redirige a `/` o a la ruta protegida original |
| contexto de sesión (`frontend/src/lib/session.ts` o similar) | no existe | fuente única de verdad poblada desde `GET /api/auth/me`, expuesta vía `router.context` o React Context, consumida por guards y por el layout |
| rutas protegidas (`frontend/src/routes/_authenticated.tsx` o similar, layout route) | no existe | `beforeLoad` que verifica sesión (via el contexto/query anterior) y redirige a `/login` si no hay sesión; punto único donde F10–F13 cuelgan sus rutas hijas |
| guard por rol | no existe | mecanismo para restringir rutas por `role` (ej. dashboard de ADMINISTRACION no debe ser navegable por DIRECTOR_OPS) — reutiliza el mismo contexto de sesión |
| layout con nombre/rol + logout | no existe (hoy `__root.tsx` es solo el shell HTML) | componente de layout (posiblemente en la ruta `_authenticated`) que muestra `fullName`/`role` del usuario y botón logout → `POST /api/auth/logout` + limpieza de cache de Query + redirect a `/login` |
| `frontend/src/routes/index.tsx` | página de bienvenida del scaffold | reemplazar o redirigir según rol (el dashboard real por rol es F10–F12, pero F9 decide qué hace `/` para un usuario ya autenticado — al menos un redirect placeholder) |
| `frontend/src/router.tsx` | `createRouter` sin `context` | registrar `context: { queryClient, ...sesión si aplica }` para que `beforeLoad` de las rutas hijas pueda leerlo |
| `frontend/package.json` | 5 deps en `"latest"` | agregar `@tanstack/react-query` (+ el adapter que ya está, `react-router-ssr-query`) y `@tanstack/react-form` con versión pineada (`^x.y.z`, no `latest`); idealmente también pinear las 5 existentes ya que se toca el archivo |
| `.env`/`.env.example` frontend | no existe ninguno | si el proxy apunta a una URL de backend configurable (dev vs otros entornos), variable de entorno para la URL destino del proxy (opcional, decisión de spec_author) |

---

## 6. Tabla resumen

| Paquete TanStack | ¿Agregar? | Para qué feature | Justificación en 1 línea |
|---|---|---|---|
| `@tanstack/react-query` | **Sí** | F9 (base) → usado por F10, F11, F12, F13 | Invalidar cache de listas/detalle tras las 7 mutaciones de transición de estado y centralizar el manejo de 401 |
| `@tanstack/react-form` | **Sí** | F9 (login) → F10 (form ODC + total en vivo), F11/F12 (modal rechazo), F13 (pago/factura) | Validación por campo + valor derivado (total) reutilizable en los 6+ formularios del proyecto, espejando las reglas required/optional del backend |
| `@tanstack/react-table` | **No** | — | Las listas son por-estado con `.map()` simple; no hay sort/filter/paginación de columnas en el alcance descrito |
| `@tanstack/react-store` | **No** | — | Query cubre estado de servidor, Router.context cubre sesión, Form cubre formularios — no queda estado global sin dueño |
| `@tanstack/react-virtual` | **No** | — | Volumen bajo/medio (ODCs de un sistema interno, catálogo fijo de 22 proveedores) — no justifica virtualización |
