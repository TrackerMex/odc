# impl: auth-users

Fecha: 2026-07-19

## Archivos creados

Módulo `users` (`backend/src/modules/users/`):

- `domain/entities/user.entity.ts` — clase pura `User` + `USER_ROLES`/`UserRole` (3 roles), sin imports de framework/ORM (R1)
- `domain/repositories/user.repository.ts` — interface `UserRepository` (`findByEmail`, `findById`, `create`) (R2, R10)
- `application/use-cases/seed-users.usecase.ts` — seed idempotente de los 3 usuarios con bcrypt cost 10; `SEED_PASSWORD` o default `odc-dev-password` (R3, R4)
- `infrastructure/entities/user.orm-entity.ts` — `@Entity('users')`, `email` UNIQUE, id uuid, `createdAt` con `@CreateDateColumn` (R2)
- `infrastructure/repositories/user.typeorm.repository.ts` — implementación TypeORM con mapping a dominio (R2, R10)
- `users.module.ts` — provider por token string `'UserRepository'` + export (R2)

Módulo `auth` (`backend/src/modules/auth/`):

- `domain/errors/invalid-credentials.error.ts` — error de dominio único para email inexistente y password incorrecto (R7)
- `domain/errors/session-user-not-found.error.ts` — sub del JWT sin usuario en la base (R10)
- `application/dto/login.dto.ts` — `@IsEmail` + `@IsString`/`@IsNotEmpty` (R5, R7)
- `application/use-cases/login.usecase.ts` — bcrypt.compare + firma JWT, devuelve shape público sin `passwordHash` (R5, R6, R7)
- `application/use-cases/get-me.usecase.ts` — usuario por `sub`; error de dominio si ya no existe (R10)
- `infrastructure/session-cookie.ts` — `SESSION_COOKIE_NAME` (`odc_session`) + opciones (httpOnly, SameSite=Lax, maxAge 8h, secure solo en producción)
- `infrastructure/decorators/public.decorator.ts` — `@Public()` con `IS_PUBLIC_KEY` (R8)
- `infrastructure/decorators/roles.decorator.ts` — `@Roles(...)` con `ROLES_KEY` (R9)
- `infrastructure/guards/jwt-auth.guard.ts` — guard global por cookie; adjunta `{ sub, role }` a `request.user` (R8)
- `infrastructure/guards/roles.guard.ts` — 403 si el rol no está en la metadata; pasa sin metadata (R9)
- `infrastructure/controller/auth.controller.ts` — `POST login` (@Public, 200 + cookie), `POST logout` (clearCookie), `GET me`; traduce errores de dominio a `UnauthorizedException` (R5, R7, R10, R11)
- `auth.module.ts` — `JwtModule.registerAsync` con factory + use-cases; exporta `JwtModule` para el `APP_GUARD` raíz
- `jwt.config.ts` — factory: secret de `JWT_SECRET`, `expiresIn: '8h'` (R6)

Fuera de módulos:

- `backend/src/seed.ts` — entrypoint standalone del seed (`pnpm seed`), solo composición (R3, R4)

Cada archivo de producción tiene su `.spec.ts` al lado (salvo composición pura: `seed.ts`, `session-cookie.ts`, DTO, errores de dominio, modules — cubiertos indirectamente por los specs de sus consumidores).

## Archivos modificados

- `backend/src/app.module.ts` — importa `UsersModule` + `AuthModule`; registra los dos `APP_GUARD` en orden (JWT, luego roles) (R8, R9)
- `backend/src/bootstrap.ts` — registra `cookie-parser` en `configureApp` (R8)
- `backend/src/bootstrap.spec.ts` — mock del app con `use`; test R8 de cookie-parser
- `backend/src/health.controller.ts` — `@Public()` a nivel de clase (R8)
- `backend/package.json` — deps nuevas (`@nestjs/jwt`, `bcrypt`, `cookie-parser` + types) y script `"seed"`
- `.env.example` — documenta `SEED_PASSWORD`
- `specs/auth-users/traceability.md` — 11 filas trazadas
- `specs/auth-users/tasks.md` — checkboxes marcados

## Requisitos cubiertos

- R1: test `user.entity.spec.ts::R1: pure User domain entity with restricted role`, commit `8aa3630`
- R2: tests `user.orm-entity.spec.ts::R2`, `user.typeorm.repository.spec.ts::R2`, `users.module.spec.ts::R2`, commit `f92c1c0`
- R3: test `seed-users.usecase.spec.ts::R3: seed creates the 3 users hashed with bcrypt`, commit `d2900e5`
- R4: test `seed-users.usecase.spec.ts::R4: seed is idempotent when users already exist`, commit `ed7108a`
- R5: tests `login.usecase.spec.ts::R5`, `auth.controller.spec.ts::R5`, commit `539c04b`
- R6: test `jwt.config.spec.ts::R6: session JWT signed with JWT_SECRET, 8h expiration and { sub, role } payload`, commit `98fd244`
- R7: tests `login.usecase.spec.ts::R7`, `auth.controller.spec.ts::R7`, commit `5740f33`
- R8: tests `jwt-auth.guard.spec.ts::R8` (x2 describes), `bootstrap.spec.ts::R8 (auth-users)`, commits `da061e9` + fix `1a16e20`
- R9: test `roles.guard.spec.ts::R9: RolesGuard enforces @Roles(...) metadata`, commit `404c99d`
- R10: tests `get-me.usecase.spec.ts::R10`, `auth.controller.spec.ts::R10`, `user.typeorm.repository.spec.ts::R10`, commit `2758f4c`
- R11: test `auth.controller.spec.ts::R11: POST /api/auth/logout clears the session cookie`, commit `5866e61`

Commits auxiliares: `7380749` (deps), `1a16e20` (fix de build TS1272), `b55b768` (prettier + lint), más un `docs(auth-users): trace R<n>` por requisito.

## Decisiones de diseño

- **Errores de dominio + traducción en controller**: `LoginUseCase`/`GetMeUseCase` lanzan `InvalidCredentialsError`/`SessionUserNotFoundError` (clases en `auth/domain/errors/`) y el controller los traduce a `UnauthorizedException`, siguiendo design.md y la tabla de conventions.md. La spec permitía lanzar `UnauthorizedException` directo; se eligió la vía más limpia por capas. Esto añade una carpeta `domain/` al módulo `auth` no listada en design.md.
- **`findById` añadido a `UserRepository` en el ciclo R10** (no en R2): R2 exige "al menos `findByEmail` y `create`"; `findById` se introdujo cuando R10 lo necesitó, con tests propios en el spec del repositorio.
- **id de usuario como uuid string** (`@PrimaryGeneratedColumn('uuid')`): el modelo de datos del plan no fija tipo; uuid es el default seguro para auth y `sub` del JWT es string.
- **`AuthModule` exporta `JwtModule`**: design.md pide registrar los `APP_GUARD` en `AppModule`; para que el injector raíz resuelva `JwtService` dentro de `JwtAuthGuard`, `AuthModule` exporta `JwtModule`.
- **Seed hashea una sola vez**: los 3 usuarios comparten `SEED_PASSWORD`, así que se calcula un único hash bcrypt (cost 10).
- **`SeedUsersUseCase` inyecta `ConfigService`**: mismo patrón testeable que las factories de TypeORM/JWT ya existentes.
- **`import type` para tipos en firmas decoradas**: `nest build` (isolatedModules + emitDecoratorMetadata) exige TS1272; los tests con ts-jest no lo detectan, por eso existió el commit fix `1a16e20`.

## Output de build

```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build
(exit 0, sin errores)

frontend: vite build OK (via ./init.sh)
```

## Output de tests

```
Test Suites: 15 passed, 15 total
Tests:       63 passed, 63 total
Snapshots:   0 total
```

`./init.sh` completo: entorno, harness, build backend+frontend, 63 tests backend,
frontend `--passWithNoTests`, lint backend — **"✅ Todo verde"**.

## Notas para el reviewer

- Verificar la decisión de errores de dominio vs `UnauthorizedException` directa en application (desviación deliberada hacia design.md/conventions.md).
- `backend/src/seed.ts` usa `console.log` intencionalmente: es el output visible del script CLI `pnpm seed`, no debug.
- Los commits `da061e9` (R8) y anteriores a `1a16e20` no compilan con `nest build` por TS1272 (los tests sí pasaban); el fix quedó como commit separado en vez de amend. Estado final verde.
- El seed real contra PostgreSQL (`pnpm seed`) no se ejecutó aquí (no hay DB en el entorno del implementer); R3/R4 están cubiertos por tests unitarios con repo mockeado según la spec. Verificación manual sugerida: `cd backend && pnpm seed` dos veces → segunda corrida termina OK con 3 skipped.
- `feature_list.json` sigue `in_progress` y no se hizo push (reglas del encargo). Cambios previos sin commitear del leader (`feature_list.json`, `progress/current.md`, `specs/auth-users/requirements.md`) quedaron intactos y sin stagear.
