# Plan 001: Orquestar el desarrollo completo del Sistema de Gestión de Compras (ODC)

> **Instrucciones para el ejecutor**: Sigue este plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de avanzar.
> Si ocurre cualquier condición de la sección "STOP conditions", detente y
> reporta — no improvises. Al terminar cada fase, actualiza la fila de estado
> de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat a987ea2..HEAD -- backend/ frontend/ feature_list.json init.config.sh docs/ specs/`
> Si algún archivo in-scope cambió desde que se escribió este plan, compara los
> extractos de "Current state" contra el código vivo antes de continuar; ante
> una discrepancia, trátalo como condición de STOP.

## Status

- **Priority**: P1
- **Effort**: L (proyecto completo, ejecutado feature a feature)
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a987ea2`, 2026-07-18

## Why this matters

El repo es un esqueleto: backend NestJS y frontend TanStack recién generados,
`feature_list.json` vacío, stack marcado "por definir" en docs. El objetivo de
negocio es un sistema interno de Órdenes de Compra (ODC) con un flujo de
aprobación de 6 pasos entre 3 roles (Director de Operaciones, Administración,
Director General). Este plan fija las decisiones de stack ya tomadas con el
humano, descompone el sistema en 13 features ordenadas, y da la especificación
funcional completa de cada una para que el pipeline SDD del repo
(spec → aprobación humana → TDD → review) pueda ejecutarlas sin volver a
preguntar nada.

## Decisiones ya tomadas con el humano (no re-preguntar)

| Decisión | Valor elegido |
|---|---|
| Base de datos / ORM | **PostgreSQL + TypeORM** (alineado con el apéndice de `docs/architecture.md`) |
| Presupuesto | **Solo validación manual**: el sistema NO almacena presupuesto. Administración ve el total de la ODC y decide aprobar/rechazar. El "Presupuesto disponible" del mock es información externa al sistema. |
| Rechazo | **Rechazada editable**: estado `RECHAZADA` con motivo obligatorio. Director Ops puede editar la ODC y reenviarla (vuelve a `PENDIENTE_ADMIN`). El historial de rechazos se conserva. |
| Autenticación | **Email/password + JWT**. Usuarios internos creados por seed, sin auto-registro. Rol en el payload del JWT. Guards de NestJS por rol. |
| Archivos (comprobantes/facturas) | **Cloudinary** (carpeta `odc/<odcNumber>/...`), subida vía SDK oficial `cloudinary` con `resource_type: 'auto'` y tipo de entrega `authenticated`/`private` (nunca URL pública directa). Se persiste el `public_id`, no la URL. Descarga vía endpoint autenticado del backend que valida rol/visibilidad y redirige a una URL firmada de corta expiración. PDF/JPG/PNG, máx 10 MB. Credenciales por env (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). |
| Dinero | Enteros en **centavos** (`unitPriceCents`, `totalCents`) para evitar flotantes. UI muestra MXN con 2 decimales. |
| Idiomas | Código e identificadores en inglés; textos de UI en español; valores del enum de estado en español (vienen del negocio). |

## Current state

Ejecutado contra commit `a987ea2`. Monorepo con dos paquetes pnpm independientes
(sin workspace root — cada uno tiene su propio `pnpm-lock.yaml`):

- `backend/` — NestJS 11 scaffold puro. Solo `src/app.module.ts`,
  `app.controller.ts`, `app.service.ts`, `main.ts`. **Sin** ORM, sin auth, sin
  variables de entorno. Scripts: `pnpm build`, `pnpm test` (jest, `rootDir: src`,
  `testRegex .*\.spec\.ts$`), `pnpm lint`.
- `frontend/` — TanStack Start + React 19 + Tailwind 4 scaffold. Rutas file-based
  en `src/routes/` (`__root.tsx`, `index.tsx`), `routeTree.gen.ts` generado por
  `tsr generate`. Alias de imports `#/*` → `./src/*` (ver `frontend/package.json`
  campo `imports`). Scripts: `pnpm dev` (puerto 3000), `pnpm build`,
  `pnpm test` (vitest), `pnpm lint`.
- `feature_list.json` — literalmente `[]`. Schema esperado por `init.sh`:
  array de `{id, name, status, priority}` donde `status` ∈
  `pending | spec_ready | in_progress | done` y `specs/<name>/requirements.md`
  debe existir para toda feature `in_progress`.
- `init.config.sh` — vacío (`INSTALL_CMD=""`, `BUILD_CMD=""`, `TEST_CMD=""`,
  `LINT_CMD=""`, `REQUIRED_ENV_VARS=()`). `init.sh` hace `eval` de cada uno y
  además valida coherencia del harness y de `feature_list.json`.
- `docs/architecture.md` — Clean Architecture obligatoria
  (domain ← application ← infrastructure) con apéndice NestJS+TypeORM que ahora
  ES la estructura del proyecto (módulos en `backend/src/modules/<nombre>/` con
  `domain/entities`, `domain/repositories` (interfaces), `application/dto`,
  `application/use-cases`, `infrastructure/entities` (ORM),
  `infrastructure/repositories`, `infrastructure/controller`, `<nombre>.module.ts`
  con tokens string para inyección).
- `docs/conventions.md`, `STATUS.md` — esqueletos con huecos "por definir".
- Proceso SDD (`docs/specs.md`, `AGENTS.md`): ninguna feature se implementa sin
  spec EARS aprobada por humano en `specs/<feature>/requirements.md`. TDD por
  requisito, traceability por commit. **Este plan no salta ese proceso: lo
  alimenta.**

## El producto: flujo ODC de 6 pasos

Una ODC es una orden de compra de **una sola línea** (una descripción, una
cantidad, un precio unitario — así lo define el mock aprobado; multi-línea queda
explícitamente fuera de alcance).

### Máquina de estados (fuente de verdad)

```
BORRADOR → PENDIENTE_ADMIN → PRESUPUESTO_APROBADO → COMPRA_APROBADA
         → PAGO_REGISTRADO → EVIDENCIA_PAGO_SUBIDA → COMPLETADA

PENDIENTE_ADMIN ──rechazo──→ RECHAZADA ──reenvío──→ PENDIENTE_ADMIN
PRESUPUESTO_APROBADO ──rechazo──→ RECHAZADA
```

| # | Transición | De → A | Rol autorizado | Datos requeridos |
|---|---|---|---|---|
| T1 | Crear borrador | — → `BORRADOR` | DIRECTOR_OPS | description, quantity, unit, unitPriceCents, supplier; comments opcional |
| T2 | Enviar a administración | `BORRADOR` → `PENDIENTE_ADMIN` | DIRECTOR_OPS (solo el creador) | — |
| T3 | Aprobar presupuesto | `PENDIENTE_ADMIN` → `PRESUPUESTO_APROBADO` | ADMINISTRACION | — |
| T4 | Rechazar | `PENDIENTE_ADMIN` → `RECHAZADA` | ADMINISTRACION | rejectionReason obligatorio |
| T5 | Aprobar compra | `PRESUPUESTO_APROBADO` → `COMPRA_APROBADA` | DIRECTOR_GENERAL | — |
| T6 | Rechazar | `PRESUPUESTO_APROBADO` → `RECHAZADA` | DIRECTOR_GENERAL | rejectionReason obligatorio |
| T7 | Registrar pago | `COMPRA_APROBADA` → `PAGO_REGISTRADO` | DIRECTOR_OPS | paymentDate, paymentMethod; paymentReference, paymentNotes opcionales |
| T8 | Subir evidencia de pago | `PAGO_REGISTRADO` → `EVIDENCIA_PAGO_SUBIDA` | ADMINISTRACION | archivo (PDF/JPG/PNG ≤10MB), evidenceReference opcional |
| T9 | Subir factura + almacén | `EVIDENCIA_PAGO_SUBIDA` → `COMPLETADA` | DIRECTOR_OPS | archivo factura, **warehouseEntryDate obligatorio**; invoiceNumber, invoiceDate, observations opcionales |
| T10 | Editar y reenviar | `RECHAZADA` → `PENDIENTE_ADMIN` | DIRECTOR_OPS (solo el creador) | puede modificar los campos de T1 |

Reglas transversales:

- Toda transición inválida (estado equivocado o rol equivocado) → HTTP 403 si
  es problema de rol, 409 si es problema de estado.
- Cada transición inserta una fila en `odc_status_history`
  (odcId, fromStatus, toStatus, userId, timestamp, note — note lleva el motivo
  de rechazo en T4/T6).
- `BORRADOR` solo es visible y editable por su creador. Los demás estados son
  visibles para los 3 roles.
- Número ODC: `ODC-YYYY-NNNNN` (año de creación + secuencia de 5 dígitos que
  reinicia cada año). Se asigna al crear el borrador. Generación segura ante
  concurrencia: constraint UNIQUE sobre `odcNumber` + reintento, o tabla de
  secuencia por año dentro de la misma transacción.
- `totalCents = quantity * unitPriceCents`, calculado en el dominio y
  persistido; nunca aceptado del cliente.

### Modelo de datos

`users`: id, email (unique), passwordHash (bcrypt), fullName,
role ∈ {DIRECTOR_OPS, ADMINISTRACION, DIRECTOR_GENERAL}, createdAt.

`purchase_orders`: id, odcNumber (unique), status, description, quantity (int>0),
unit, unitPriceCents (int>0), totalCents, supplier, comments?,
createdById (FK users), rejectionReason?, paymentDate?, paymentMethod?,
paymentReference?, paymentNotes?, paymentEvidenceFile?, evidenceReference?,
invoiceFile?, invoiceNumber?, invoiceDate?, warehouseEntryDate?, observations?,
createdAt, updatedAt.

`odc_status_history`: id, odcId (FK), fromStatus?, toStatus, userId (FK),
note?, createdAt.

### Dashboards por rol (contadores + listas filtradas por estado)

- DIRECTOR_OPS: "Borradores" (`BORRADOR`), "Rechazadas" (`RECHAZADA`),
  "Listas para comprar" (`COMPRA_APROBADA`), "Pendientes de factura"
  (`EVIDENCIA_PAGO_SUBIDA`), más lista completa.
- ADMINISTRACION: "Pendientes de validar" (`PENDIENTE_ADMIN`),
  "Compras pagadas" (`PAGO_REGISTRADO`).
- DIRECTOR_GENERAL: "Esperando mi aprobación" (`PRESUPUESTO_APROBADO`).

### Superficie API (prefijo global `/api`)

```
POST   /api/auth/login                     → { user } + cookie httpOnly con JWT
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/odcs                           (T1, crea BORRADOR)
GET    /api/odcs?status=&page=             (filtrado por rol según visibilidad)
GET    /api/odcs/:id                       (incluye historial)
PATCH  /api/odcs/:id                       (solo BORRADOR o RECHAZADA, solo creador)
POST   /api/odcs/:id/submit                (T2 y T10)
POST   /api/odcs/:id/approve-budget        (T3)
POST   /api/odcs/:id/approve-purchase      (T5)
POST   /api/odcs/:id/reject                (T4/T6, body: { reason })
POST   /api/odcs/:id/payment               (T7)
POST   /api/odcs/:id/payment-evidence      (T8, multipart)
POST   /api/odcs/:id/invoice               (T9, multipart)
GET    /api/odcs/:id/files/:kind           (kind ∈ evidence|invoice, autenticado)
```

Auth por cookie httpOnly (SameSite=Lax) que el backend setea en login. En dev,
el frontend (puerto 3000) proxya `/api` al backend (puerto 3001) vía
`server.proxy` en `frontend/vite.config.ts` — así la cookie es same-origin y no
hay CORS.

## Commands you will need

| Propósito | Comando (desde la raíz del repo) | Esperado |
|---|---|---|
| Harness completo | `./init.sh` | exit 0, "Todo verde" |
| Install backend | `cd backend && pnpm install` | exit 0 |
| Install frontend | `cd frontend && pnpm install` | exit 0 |
| Build backend | `cd backend && pnpm build` | exit 0 |
| Tests backend | `cd backend && pnpm test` | todos pasan |
| Lint backend | `cd backend && pnpm lint` | exit 0 |
| Build frontend | `cd frontend && pnpm build` | exit 0 |
| Tests frontend | `cd frontend && pnpm test` | todos pasan |
| DB dev | `docker compose up -d` (compose creado en Fase 0) | postgres healthy |

Los tests unitarios NO deben requerir Postgres: la Clean Architecture obliga a
que los use-cases dependan de interfaces de repositorio, que en tests se
mockean. Solo los e2e (opcionales, `backend/test/`) tocan DB real.

## Scope

**In scope** (lo que este plan autoriza a crear/modificar, fase a fase):
- `feature_list.json`, `init.config.sh`, `docs/conventions.md`,
  `docs/architecture.md`, `STATUS.md`, `progress/*`, `specs/*` (vía pipeline SDD)
- `backend/**` y `frontend/**` (vía features implementadas por el pipeline SDD)
- `docker-compose.yml`, `.env.example` (raíz), `.gitignore` (raíz)
- `plans/README.md` (filas de estado)

**Out of scope** (NO tocar):
- `AGENTS.md`, `CLAUDE.md`, `CHECKPOINTS.md`, `init.sh`, `.claude/agents/*` —
  el harness SDD no se modifica, se usa.
- Multi-línea de ítems por ODC, edición de usuarios vía UI, notificaciones por
  email, reportes/exportes, presupuesto almacenado — nada de esto existe en v1.
- No subir a `origin` sin instrucción del operador humano.

## Git workflow

- Trabajar en `main` (convención actual del repo, un solo branch).
- Conventional commits en inglés con R-ids, según `docs/conventions.md`:
  `feat(odc-create-draft): add draft creation use case (R1,R2)`.
- Un commit por feature completada como mínimo (regla del CLAUDE.md global del
  operador); el pipeline TDD puede producir commits por requisito.

## Steps

### Fase 0 — Fundación del harness (edición directa, sin pipeline SDD)

Estos archivos son del harness/docs; el leader puede editarlos directamente.

**0.1** Crear `docker-compose.yml` en la raíz:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: odc
      POSTGRES_PASSWORD: odc
      POSTGRES_DB: odc
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

**0.2** Crear `.env.example` en la raíz con claves sin valores reales:
`DATABASE_URL=postgres://odc:odc@localhost:5432/odc`, `JWT_SECRET=`,
`PORT=3001`. Añadir a `.gitignore` raíz (crearlo): `.env`, `backend/uploads/`,
`.obsidian/`.

**0.3** Rellenar `init.config.sh`:

```bash
REQUIRED_TOOLS=("node" "pnpm")
REQUIRED_ENV_VARS=("DATABASE_URL" "JWT_SECRET")
INSTALL_CMD="(cd backend && pnpm install) && (cd frontend && pnpm install)"
BUILD_CMD="(cd backend && pnpm build) && (cd frontend && pnpm build)"
TEST_CMD="(cd backend && pnpm test) && (cd frontend && pnpm test)"
LINT_CMD="(cd backend && pnpm lint)"
```

Nota: `frontend pnpm lint` del scaffold puede fallar sin config completa —
verificar antes de incluirlo en LINT_CMD; si falla, dejarlo fuera y anotarlo
en STATUS.md.

**0.4** Rellenar `docs/conventions.md` (tabla de nombres de archivo según el
apéndice NestJS de `docs/architecture.md`; DTOs con `class-validator`; tabla de
errores: NotFoundException→404, ConflictException→409 para transición de estado
inválida, UnauthorizedException→401, ForbiddenException→403,
BadRequestException→400; tests jest/vitest con `describe('R1: ...')`).
Actualizar `docs/architecture.md`: reemplazar "por definir" por
`backend/src/modules/<nombre>/` y declarar el apéndice como estructura oficial.
Actualizar `STATUS.md` (stack, descripción del proyecto, cómo arrancar).

**0.5** Poblar `feature_list.json`:

```json
[
  { "id": 1,  "name": "backend-foundation",         "status": "pending", "priority": "P1" },
  { "id": 2,  "name": "auth-users",                 "status": "pending", "priority": "P1" },
  { "id": 3,  "name": "odc-create-draft",           "status": "pending", "priority": "P1" },
  { "id": 4,  "name": "odc-budget-validation",      "status": "pending", "priority": "P1" },
  { "id": 5,  "name": "odc-purchase-approval",      "status": "pending", "priority": "P1" },
  { "id": 6,  "name": "odc-register-payment",       "status": "pending", "priority": "P1" },
  { "id": 7,  "name": "odc-payment-evidence",       "status": "pending", "priority": "P1" },
  { "id": 8,  "name": "odc-invoice-completion",     "status": "pending", "priority": "P1" },
  { "id": 9,  "name": "frontend-foundation",        "status": "pending", "priority": "P1" },
  { "id": 10, "name": "frontend-odc-form",          "status": "pending", "priority": "P1" },
  { "id": 11, "name": "frontend-admin-flows",       "status": "pending", "priority": "P2" },
  { "id": 12, "name": "frontend-general-approval",  "status": "pending", "priority": "P2" },
  { "id": 13, "name": "frontend-payment-invoice",   "status": "pending", "priority": "P2" }
]
```

**Verify Fase 0**: `./init.sh` → exit 0; `git status` sin archivos fuera del
scope de la fase; commit `chore(harness): define stack and feature backlog`.

### Fases 1–13 — Una feature por sesión, vía pipeline SDD

Para CADA feature, en orden de id, aplicar el ciclo de `AGENTS.md` §6:
spec_author escribe `specs/<name>/requirements.md` (EARS, usando el brief de
abajo) → **STOP hasta aprobación humana** → implementer con TDD →
reviewer valida → `done` en `feature_list.json` → `./init.sh` verde → commit.

Briefs por feature (el spec_author convierte cada bullet en requisitos EARS
medibles):

**F1 `backend-foundation`** — Instalar `@nestjs/typeorm typeorm pg @nestjs/config`.
`ConfigModule` global leyendo `.env` de la raíz (`envFilePath: '../.env'`).
`TypeOrmModule` con `url: DATABASE_URL`, `autoLoadEntities`, `synchronize: true`
solo en dev (documentar que producción usará migraciones). `ValidationPipe`
global (`whitelist: true`). Prefijo global `/api`. Puerto desde `PORT` (3001).
`GET /api/health` → `{ status: 'ok' }`. Borrar `app.controller/service` del
scaffold o reutilizarlos como health.

**F2 `auth-users`** — Módulo `users` + `auth` con Clean Architecture. Entidad
de dominio `User`; ORM entity; seed idempotente (script `pnpm seed`) que crea
3 usuarios: `ops@odc.local` (DIRECTOR_OPS), `admin@odc.local` (ADMINISTRACION),
`dg@odc.local` (DIRECTOR_GENERAL) con password desde env `SEED_PASSWORD` o
default de dev documentado. `POST /api/auth/login` valida bcrypt, firma JWT
(`@nestjs/jwt`, secret `JWT_SECRET`, expiración 8h, payload `{sub, role}`),
setea cookie httpOnly. `JwtAuthGuard` global (excepto login/health) +
`@Roles(...)` decorator + `RolesGuard`. `GET /api/auth/me`, `POST /api/auth/logout`.

**F3 `odc-create-draft`** — Módulo `odc`. Entidad de dominio `PurchaseOrder`
con la máquina de estados COMPLETA (método `transition(action, role, data)` que
lanza error de dominio ante rol/estado inválido — los use-cases posteriores F4–F8
solo la invocan). Tablas `purchase_orders` y `odc_status_history` (modelo de
datos de arriba). T1, T2, T10, PATCH de edición, numeración `ODC-YYYY-NNNNN`,
`GET /api/odcs` (visibilidad: BORRADOR solo creador) y `GET /api/odcs/:id` con
historial. Tests de dominio de TODAS las transiciones (válidas e inválidas).

**F4 `odc-budget-validation`** — T3 y T4 (endpoints approve-budget / reject
desde PENDIENTE_ADMIN). Reject exige `reason` no vacío → va a
`rejectionReason` y a la fila de historial.

**F5 `odc-purchase-approval`** — T5 y T6 (approve-purchase / reject desde
PRESUPUESTO_APROBADO). Mismo contrato de reject que F4.

**F6 `odc-register-payment`** — T7. DTO: paymentDate (ISO date, obligatoria),
paymentMethod (obligatorio, string libre: Transferencia/Efectivo/Tarjeta…),
paymentReference y paymentNotes opcionales.

**F7 `odc-payment-evidence`** — Infra de archivos: multer en memoria
(`memoryStorage`) solo para parsear el multipart, validación MIME (pdf/jpg/png)
y ≤10MB **antes** de subir. Subida del buffer a **Cloudinary** vía un
`FileStorageService`/interfaz inyectada por token (para que cambiar de
proveedor sea solo un cambio de `infrastructure`), carpeta
`odc/<odcNumber>/evidence`, tipo de entrega `authenticated`/`private`. Se
persiste el `public_id` devuelto por Cloudinary, nunca la URL cruda. T8
(multipart: file + evidenceReference opcional). `GET
/api/odcs/:id/files/evidence` autenticado: valida rol/visibilidad de la ODC y
responde con `302` a una URL firmada de Cloudinary de corta expiración
(`cloudinary.url(publicId, { sign_url: true, type: 'authenticated',
expires_at })`) — nunca se expone el `public_id` ni una URL pública sin pasar
por este guard.

**F8 `odc-invoice-completion`** — T9 (multipart: file obligatorio,
`warehouseEntryDate` obligatoria — el sistema debe rechazar la petición sin
ella, invoiceNumber/invoiceDate/observations opcionales). Reusa el mismo
`FileStorageService` de F7 (carpeta `odc/<odcNumber>/invoice`), mismo patrón de
`public_id` + URL firmada. Al completar: estado `COMPLETADA`, fila de
historial. `GET /api/odcs/:id/files/invoice` con el mismo esquema de redirect
firmado que F7.

**F9 `frontend-foundation`** — Proxy `/api` → `localhost:3001` en
`vite.config.ts`. Ruta `/login` (form email/password → `POST /api/auth/login`).
Contexto de sesión desde `GET /api/auth/me`; `beforeLoad` en rutas protegidas
redirige a `/login` sin sesión. Layout con nombre/rol del usuario y logout.
Cliente API tipado mínimo en `src/lib/api.ts` (fetch con `credentials:
'include'`, manejo de 401 → redirect login). Usar el alias `#/` existente.

**F10 `frontend-odc-form`** — Dashboard DIRECTOR_OPS con contadores/listas
(Borradores, Rechazadas, Listas para comprar, Pendientes de factura). Formulario
de creación según el mock del Paso 1: número ODC y fecha y usuario
auto-mostrados (el número real lo asigna el backend al guardar), campos
obligatorios description/quantity/unit/unitPrice/supplier, comments opcional,
TOTAL calculado en vivo (`quantity × unitPrice`), botones "Guardar como
Borrador" y "Enviar a Administración". Vista detalle con historial de estados.
Edición y reenvío de RECHAZADA (muestra el motivo del rechazo).

**F11 `frontend-admin-flows`** — Dashboard ADMINISTRACION: "Pendientes de
validar" con detalle y botones Aprobar Presupuesto / Rechazar (modal con motivo
obligatorio); "Compras pagadas" con formulario de subida de comprobante
(file + referencia). Pasos 2 y 5 del flujo.

**F12 `frontend-general-approval`** — Dashboard DIRECTOR_GENERAL: "Esperando
mi aprobación" con detalle (total, proveedor, marca "Validado por
Administración" derivada del historial) y botones Aprobar Compra / Rechazar
(modal con motivo). Paso 3.

**F13 `frontend-payment-invoice`** — Para DIRECTOR_OPS: formulario Registrar
Pago (fecha, método, referencia, notas) sobre ODCs `COMPRA_APROBADA`; formulario
Subir Factura (archivo, número, fecha factura, **fecha entrada almacén
obligatoria**, observaciones) sobre ODCs `EVIDENCIA_PAGO_SUBIDA`; badge de
estado `COMPLETADA`. Pasos 4 y 6. Descarga de comprobante y factura desde el
detalle.

**Verify por feature**: `./init.sh` → exit 0; tests de la feature nombran sus
R-ids; `specs/<name>/traceability.md` sin filas "pendiente"; fila actualizada
en `plans/README.md`.

## Test plan

- Dominio (crítico): suite exhaustiva de la máquina de estados en
  `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts` —
  cada transición válida (T1–T10) y, por cada estado, los intentos inválidos de
  rol equivocado y de acción fuera de orden. Es la red de seguridad de todo el
  flujo.
- Use-cases: tests unitarios con repositorios mockeados (patrón del apéndice de
  `docs/architecture.md` — inyección por token string).
- Controllers: tests e2e opcionales en `backend/test/` (requieren DB) — no
  entran en `TEST_CMD`.
- Frontend: vitest + testing-library ya instalados; como mínimo, tests del
  cálculo de total en vivo (F10) y del guard de rutas por rol (F9).
- Convención de nombres: `describe('R<n>: <resumen>', ...)` según
  `docs/conventions.md`.

## Done criteria

- [ ] `./init.sh` exit 0 con las 13 features `done` en `feature_list.json`
- [ ] `specs/<name>/requirements.md` aprobado por humano existe para las 13
- [ ] Suite de dominio cubre T1–T10 + rechazos inválidos (rol y estado)
- [ ] Flujo completo manual: login con cada rol seed y recorrer Pasos 1→6 del
      mock hasta `COMPLETADA`, más un ciclo rechazo→edición→reenvío
- [ ] `grep -rn "por definir" docs/ STATUS.md` sin resultados
- [ ] Ningún archivo de "Out of scope" modificado (`git log --stat`)

## STOP conditions

Detente y reporta (no improvises) si:

- Una spec espera aprobación humana — STOP es el comportamiento correcto del
  pipeline; retoma cuando la casilla "Aprobado por humano" esté marcada.
- `./init.sh` falla por algo ajeno a la feature en curso.
- No hay Postgres accesible en `DATABASE_URL` y la feature lo necesita
  (F1 en adelante para e2e/arranque) — reporta cómo levantarlo
  (`docker compose up -d`) en vez de cambiar de motor de DB.
- El humano pide cambiar una decisión de la tabla "Decisiones ya tomadas" —
  actualiza este plan y las specs afectadas antes de seguir codificando.
- Cualquier requisito del mock contradice la máquina de estados de este plan.

## Maintenance notes

- La máquina de estados vive en la entidad de dominio (F3). Cualquier paso
  nuevo del flujo (ej. recepción parcial de almacén) se añade ahí primero, con
  sus tests, antes de tocar endpoints o UI.
- `synchronize: true` de TypeORM es solo dev. Antes de producción: generar
  migraciones y desactivarlo (deuda registrada aquí a propósito).
- Si algún día se almacena presupuesto (opción descartada en v1), el punto de
  enganche es el use-case de T3 (`approve-budget`).
- Storage de archivos: proveedor **Cloudinary** desde F7 (decisión actualizada
  el 2026-07-20; v1 original consideraba disco local). La interfaz de storage
  (`FileStorageService`) debe mantenerse detrás de un token de inyección para
  que cambiar de proveedor en el futuro sea solo un cambio de
  `infrastructure`. Credenciales de Cloudinary solo por env, nunca
  hardcodeadas ni commiteadas.
- Revisar en cada PR: que ningún use-case importe TypeORM (regla de
  dependencia), y que ningún endpoint acepte `totalCents` del cliente.
