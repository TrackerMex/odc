# review: auth-users

Fecha: 2026-07-19
Veredicto: APROBADO

## Checklist C2 — Estado coherente

- [x] Solo 1 feature in_progress (`auth-users`, id 2, en `feature_list.json`)
- [x] progress/current.md actualizado (describe la sesión activa de auth-users)

## Checklist C3 — Arquitectura

- [x] domain sin imports de infrastructure
  - `users/domain/entities/user.entity.ts` — cero imports (verificado además
    por test estructural en `user.entity.spec.ts`)
  - `users/domain/repositories/user.repository.ts` — solo importa la entidad de dominio
  - `auth/domain/errors/*.error.ts` — subclases puras de `Error`, sin framework
- [x] repositories/contratos en domain son interfaces puras
  (`UserRepository`: `findByEmail`, `findById`, `create` — sin implementación)
- [x] application depende de interfaces, no implementaciones
  (`SeedUsersUseCase`, `LoginUseCase`, `GetMeUseCase` inyectan
  `@Inject('UserRepository')` contra la interface; ver observación menor M1
  sobre `JwtService`/`ConfigService`)
- [x] infrastructure sin lógica de negocio
  (`UserTypeOrmRepository` solo mapea ORM↔dominio; `AuthController` solo
  orquesta use-cases, setea/limpia cookie y traduce errores de dominio a HTTP)

## Checklist C4 — TDD

- [x] Cada R<n> tiene al menos un test que lo nombra
  - R1: `user.entity.spec.ts` — construye la entidad, asserta las 6 propiedades,
    los 3 roles, y chequeo estructural de cero imports
  - R2: `user.orm-entity.spec.ts` (tabla `users`, columnas, UNIQUE email vía
    `getMetadataArgsStorage`, sin conexión), `user.typeorm.repository.spec.ts`
    (manager mockeado), `users.module.spec.ts` (token string `'UserRepository'`
    + export)
  - R3/R4: `seed-users.usecase.spec.ts` — 3 emails/roles exactos,
    `bcrypt.compare` real contra el hash persistido, fallback documentado
    `odc-dev-password`, idempotencia total y parcial (cero `create` si existen)
  - R5: `login.usecase.spec.ts` (shape sin `passwordHash` + token) y
    `auth.controller.spec.ts` (metadata POST/200, `cookie()` con
    `httpOnly: true`, `sameSite: 'lax'`)
  - R6: `jwt.config.spec.ts` — factory con `JWT_SECRET` y `expiresIn: '8h'`,
    más verificación con `JwtService` REAL: payload `{sub, role}` y
    `exp - iat === 28800`
  - R7: `login.usecase.spec.ts` (mismo `InvalidCredentialsError` con mensaje
    idéntico en email inexistente y password incorrecto) y
    `auth.controller.spec.ts` (401 y `cookie()` no llamado)
  - R8: `jwt-auth.guard.spec.ts` (sin cookie → 401, token inválido/expirado →
    401, token válido → pasa y adjunta `request.user`, `@Public()` → pasa;
    login y health llevan la metadata pública; `APP_GUARD` en `AppModule`) y
    `bootstrap.spec.ts::R8 (auth-users)` (cookie-parser registrado)
  - R9: `roles.guard.spec.ts` — rol fuera de lista → 403, rol en lista → pasa,
    sin metadata → pasa, decorator guarda la metadata, segundo `APP_GUARD`
    tras `JwtAuthGuard`
  - R10: `get-me.usecase.spec.ts` (shape sin `passwordHash`; no encontrado →
    `SessionUserNotFoundError`), `auth.controller.spec.ts` (401) y
    `user.typeorm.repository.spec.ts::R10` (`findById`)
  - R11: `auth.controller.spec.ts` — `clearCookie('odc_session', ...)` con los
    mismos atributos, `cookie()` no llamado
  - Ningún test vacío ni tautológico: todos assertan comportamiento real
    (bcrypt real con cost bajo en tests, JWT real en R6, metadata de Nest
    inspeccionada sin levantar la app)
- [x] Historial de commits muestra ciclos por requisito, no todo junto
  (un commit `feat(auth-users): ... (R<n>)` con test+implementación por
  requisito + su commit `docs(auth-users): trace R<n>`; mismo patrón aprobado
  en backend-foundation)

## Checklist C5 — Trazabilidad

- [x] traceability.md sin filas "pendiente" — 11 filas completas
- [x] Commits siguen el formato `feat(<scope>): <desc> (R-ids)`
- [x] Los 12 hashes citados existen en `git log`:
  `8aa3630` (R1), `f92c1c0` (R2), `d2900e5` (R3), `ed7108a` (R4),
  `539c04b` (R5), `98fd244` (R6), `5740f33` (R7), `da061e9` + `1a16e20` (R8),
  `404c99d` (R9), `2758f4c` (R10), `5866e61` (R11)
- [x] Los tests referenciados existen y nombran su R-id (verificado archivo
  por archivo)

## Checklist C6 — Spec aprobada

- [x] requirements.md con `status: approved` y casilla humana marcada
  (fecha 2026-07-19). Nota: el cambio de aprobación está en working tree sin
  commitear (responsabilidad del leader al cerrar, ver I3).

## Verificaciones adicionales

- [x] Tests unitarios NO tocan PostgreSQL: repos y manager mockeados; la
  entidad ORM se inspecciona vía `getMetadataArgsStorage()` sin abrir conexión
- [x] `passwordHash` nunca sale en respuestas: `LoginUseCase.execute` y
  `GetMeUseCase.execute` devuelven shape explícito `{ id, email, fullName,
  role }`; tests assertan `not.toHaveProperty('passwordHash')` en login, me y
  controller
- [x] 401 genérico en login: `InvalidCredentialsError` único con mensaje
  idéntico para email inexistente y password incorrecto; cookie solo se setea
  tras éxito del use-case (`auth.controller.ts:41-48`)
- [x] Cookie: `odc_session`, `httpOnly: true`, `sameSite: 'lax'`,
  `secure` solo en producción, `maxAge` 8h alineado con el JWT
  (`session-cookie.ts`)
- [x] JWT: secret de `JWT_SECRET`, `expiresIn: '8h'`, payload `{sub, role}`
  (`jwt.config.ts`, verificado con firma+verify reales en `jwt.config.spec.ts`)
- [x] Guards: `JwtAuthGuard` y `RolesGuard` como `APP_GUARD` en orden correcto
  (`app.module.ts:32-36`); `@Public()` SOLO en `AuthController.login`
  (método) y `HealthController` (clase) — logout y me quedan protegidos
  (leído en código, no solo en tests)
- [x] Seed idempotente (`findByEmail` antes de cada `create`) y bcrypt cost 10;
  hash calculado una sola vez para los 3 usuarios; `SEED_PASSWORD` con default
  dev `odc-dev-password` documentado en design.md y `.env.example`
- [x] Sin regresiones: los 4 specs de backend-foundation
  (`app.module.spec.ts`, `bootstrap.spec.ts`, `health.controller.spec.ts`,
  `typeorm.config.spec.ts`) siguen en verde dentro de los 63 tests

## Evaluación de la desviación documentada

**Errores de dominio (`auth/domain/errors/`) traducidos en el controller** —
ACEPTADA. No solo no rompe la arquitectura: es exactamente lo que exige
`docs/conventions.md` §Manejo de errores ("El dominio lanza errores propios
(clases en `domain/`); el controller o un filter los traduce"). Los errores
son subclases puras de `Error` sin imports de `@nestjs/common`, la capa
application queda libre de HTTP, y la carpeta `domain/` extra en `auth` es
consistente con la estructura oficial de módulo de `docs/architecture.md`.
La spec R7 admitía ambas vías ("error de dominio / `UnauthorizedException`").

## Observaciones

Ninguna bloquea la aprobación.

Menores:

- **M1** `backend/src/modules/auth/application/use-cases/login.usecase.ts:3,25`
  y `backend/src/modules/users/application/use-cases/seed-users.usecase.ts:2-3,36`:
  la capa application inyecta servicios concretos de framework (`JwtService`,
  `ConfigService`) en lugar de interfaces propias. Está sancionado
  explícitamente por la spec (R3/R5/R6 piden verificar con `JwtService`/repo
  mockeados) y por design.md, y sigue el precedente de las factories de
  backend-foundation — pero es el punto blando frente a la regla "application
  depende solo de interfaces" de architecture.md. Si en features futuras se
  quisiera endurecer, bastaría un puerto `TokenSigner` en domain.
- **M2** `backend/src/modules/auth/jwt.config.ts:8`: si `JWT_SECRET` no está
  definida, `secret` queda `undefined` y falla en runtime al firmar, no al
  arrancar. Mitigado porque `./init.sh` valida que `JWT_SECRET` esté definida
  en `.env`. Posible mejora futura: fail-fast en la factory.
- **M3** `backend/src/modules/auth/infrastructure/guards/jwt-auth.guard.spec.ts:87-113`:
  el describe "login and health are the only public endpoints" prueba que
  login y health SON públicos, pero no puede probar la ausencia de `@Public()`
  en otros handlers. Verificado manualmente en esta revisión: ningún otro
  handler lo lleva.

Informativas:

- **I1** `backend/src/modules/auth/infrastructure/session-cookie.ts:9`: lee
  `process.env` directamente en vez de `ConfigService` (capa infrastructure,
  funciona; leve inconsistencia con el patrón de factories).
- **I2** `backend/src/modules/auth/infrastructure/controller/auth.controller.ts:57`:
  `clearCookie` recibe `sessionCookieOptions()` incluyendo `maxAge`; Express 5
  (el de NestJS 11) ignora `maxAge`/`expires` en `clearCookie`, así que el
  borrado es correcto.
- **I3** Working tree: `feature_list.json`, `progress/current.md` y
  `specs/auth-users/requirements.md` (la aprobación humana) están modificados
  sin commitear — pertenecen al leader y deben commitearse al cerrar la
  feature.
- **I4** pnpm advierte "Ignored build scripts: bcrypt@6.0.0" al instalar;
  bcrypt funciona (los tests ejecutan hash/compare reales), solo es el aviso
  estándar de pnpm 10 sobre scripts de build no aprobados.
- **I5** El seed real contra PostgreSQL (`pnpm seed`) no se ejecutó (sin DB en
  este entorno); R3/R4 quedan cubiertos por unit tests según la spec.
  Verificación manual sugerida cuando haya DB: `cd backend && pnpm seed` dos
  veces — la segunda debe terminar OK con los 3 usuarios en skipped.

## Output de ./init.sh

```
INIT — ODC (Harness SDD)
✅ node disponible / ✅ pnpm disponible
✅ .env encontrado — DATABASE_URL definida, JWT_SECRET definida
✅ Dependencias instaladas
✅ Archivos del harness presentes
⚠️  Feature en progreso: auth-users
→ Build...
backend: nest build OK
frontend: vite build OK (client 502ms, ssr 546ms)
✅ Build exitoso
→ Ejecutando tests...
Test Suites: 15 passed, 15 total
Tests:       63 passed, 63 total
Time:        7.552 s
frontend: vitest --passWithNoTests OK
✅ Tests pasados
→ Lint... ✅ Lint sin errores
✅ Todo verde. Listo para trabajar.
Features: 1/13 completadas | 11 pendientes
```

(Ejecutado por el reviewer el 2026-07-19; el working tree quedó sin cambios
nuevos tras el lint `--fix`.)
