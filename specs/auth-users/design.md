---
feature: "auth-users"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[auth-users]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Dos módulos, `users` y `auth`** (según el brief F2): `users` posee la
  entidad de dominio, la interface de repositorio, la entidad ORM, el
  repositorio TypeORM y el seed (R1–R4); `auth` posee login/logout/me, el
  JWT y los guards (R5–R11). `auth` depende de `users` solo vía la interface
  `UserRepository` (token string exportado por `users.module.ts`), respetando
  la regla de dependencia.
- **Dependencias nuevas en `backend/`**: `@nestjs/jwt`, `bcrypt`,
  `cookie-parser` (+ `@types/bcrypt`, `@types/cookie-parser`). Prerequisito de
  R3, R5–R8; verificado porque build y tests compilan con esos imports.
- **Cookie de sesión** (R5, R11): nombre fijo (p.ej. `odc_session`),
  `httpOnly: true`, `sameSite: 'lax'`, `maxAge` alineado con la expiración de
  8h del JWT, `secure` solo cuando `NODE_ENV === 'production'` (en dev la
  cookie viaja por http://localhost vía el proxy del frontend). `cookie-parser`
  se registra en el helper de configuración de app existente
  (`backend/src/bootstrap`/`main.ts`) para que el guard pueda leer
  `request.cookies`.
- **JWT con `@nestjs/jwt`** (R6): `JwtModule.registerAsync` con factory que
  toma `JWT_SECRET` de `ConfigService` (mismo patrón testeable que la factory
  de TypeORM de `backend-foundation`) y `expiresIn: '8h'`. Payload mínimo
  `{ sub, role }` — el rol viaja en el token (decisión del humano), así el
  `RolesGuard` no consulta la base en cada request.
- **`JwtAuthGuard` global + decorator `@Public()`** (R8): el guard se registra
  como provider `APP_GUARD` en `AppModule`; un decorator `@Public()` deja
  metadata que el guard lee con `Reflector` para excluir `POST /api/auth/login`
  y `GET /api/health`. El guard lee el token de la cookie de sesión, lo
  verifica con `JwtService` y adjunta `{ sub, role }` a `request.user`.
- **`RolesGuard` + decorator `@Roles(...)`** (R9): segundo `APP_GUARD`
  (se evalúa tras el de JWT); lee la metadata de roles con `Reflector` y
  compara contra `request.user.role`. Sin metadata → pasa (el endpoint solo
  exige autenticación). Se entrega con tests pero sin consumidores de negocio:
  las features 3–8 lo aplicarán a los endpoints de ODC.
- **Login como use-case** (R5–R7): `LoginUseCase` depende de la interface
  `UserRepository` y de un firmador de tokens; compara con `bcrypt.compare` y
  ante email inexistente o password incorrecto lanza el MISMO error (mensaje
  genérico, sin filtrar cuál falló). El controller traduce a
  `UnauthorizedException` (401) según la tabla de `docs/conventions.md` y es
  el único que toca la response HTTP (setear/limpiar cookie).
- **`GET /api/auth/me` consulta el repositorio** (R10): resuelve el usuario
  por el `sub` del JWT para devolver datos frescos (`email`, `fullName`);
  si el usuario ya no existe → 401. Nunca serializa `passwordHash`: el
  use-case devuelve un shape explícito `{ id, email, fullName, role }`.
- **Seed como script standalone idempotente** (R3, R4): script `pnpm seed`
  (`backend/src/seed.ts`) que levanta un application context de Nest
  (`NestFactory.createApplicationContext`) y ejecuta `SeedUsersUseCase`. El
  use-case hace `findByEmail` antes de cada `create` (idempotencia) y hashea
  con bcrypt (cost factor 10). Password fuente: `SEED_PASSWORD` del entorno o
  el **default de desarrollo `odc-dev-password`** si no está definida (solo
  dev; documentado aquí a propósito, R3). La lógica vive en el use-case (capa
  application, testeable con repo mockeado); el script es solo composición.

## Archivos afectados

Módulo `users` (`backend/src/modules/users/`):

- `domain/entities/user.entity.ts` (nuevo) — clase pura `User` + tipo/const
  de roles (R1). Capa domain.
- `domain/repositories/user.repository.ts` (nuevo) — interface
  `UserRepository` (R2). Capa domain.
- `application/use-cases/seed-users.usecase.ts` (nuevo) — seed idempotente de
  los 3 usuarios (R3, R4). Capa application.
- `infrastructure/entities/user.orm-entity.ts` (nuevo) — `@Entity('users')`
  con `email` UNIQUE (R2). Capa infrastructure.
- `infrastructure/repositories/user.typeorm.repository.ts` (nuevo) —
  implementación de la interface (R2). Capa infrastructure.
- `users.module.ts` (nuevo) — token string `'UserRepository'` + exports.

Módulo `auth` (`backend/src/modules/auth/`):

- `application/dto/login.dto.ts` (nuevo) — `email` (`@IsEmail`) y `password`
  (`@IsString`, no vacío) (R5, R7). Capa application.
- `application/use-cases/login.usecase.ts` (nuevo) — bcrypt + firma JWT
  (R5, R6, R7). Capa application.
- `application/use-cases/get-me.usecase.ts` (nuevo) — usuario por `sub` sin
  `passwordHash` (R10). Capa application.
- `infrastructure/decorators/public.decorator.ts` y
  `infrastructure/decorators/roles.decorator.ts` (nuevos) — metadata para los
  guards (R8, R9). Capa infrastructure.
- `infrastructure/guards/jwt-auth.guard.ts` (nuevo) — guard global de JWT por
  cookie (R8). Capa infrastructure.
- `infrastructure/guards/roles.guard.ts` (nuevo) — guard por rol (R9). Capa
  infrastructure.
- `infrastructure/controller/auth.controller.ts` (nuevo) — `POST login`
  (@Public), `POST logout`, `GET me`; setea/limpia cookie (R5, R7, R10, R11).
  Capa infrastructure.
- `auth.module.ts` (nuevo) — `JwtModule.registerAsync` + use-cases + guards.

Fuera de los módulos:

- `backend/src/app.module.ts` — importa `UsersModule` y `AuthModule`; registra
  los dos `APP_GUARD` (R8, R9).
- `backend/src/health.controller.ts` — se marca `@Public()` (R8).
- `backend/src/main.ts` / helper de bootstrap — registra `cookie-parser` (R8).
- `backend/src/seed.ts` (nuevo) — entrypoint del script de seed (R3, R4).
- `backend/package.json` — dependencias nuevas + script `"seed"`.

## Alternativas descartadas

- **Passport (`@nestjs/passport` + `passport-jwt`)**: descartado por
  over-engineering — una sola estrategia (JWT en cookie) no justifica la capa
  de abstracción de Passport; un guard propio con `JwtService` es más corto y
  directamente testeable con mocks.
- **JWT en header `Authorization: Bearer`**: descartado — la decisión tomada
  con el humano es cookie httpOnly (inaccesible a JS del navegador) con
  SameSite=Lax, y el proxy dev del frontend la hace same-origin sin CORS.
- **Rol consultado en DB en cada request en lugar de en el payload**:
  descartado — la decisión tomada es rol en el payload del JWT; un cambio de
  rol requiere re-login, aceptable para 3 usuarios internos con expiración 8h.
- **Blacklist/estado server-side de tokens para logout**: descartado —
  fuera del alcance decidido; logout limpia la cookie y la expiración de 8h
  acota la ventana de un token filtrado.
- **Guard aplicado endpoint a endpoint en lugar de global**: descartado — el
  brief F2 fija `JwtAuthGuard` global con excepciones explícitas (login,
  health); global + `@Public()` hace que un endpoint nuevo nazca protegido
  por defecto (fail-safe).
- **Seed vía migraciones o fixtures SQL**: descartado — el proyecto aún no usa
  migraciones (`synchronize: true` en dev, deuda registrada); un script
  `pnpm seed` idempotente sobre el use-case es testeable sin DB y re-ejecutable.
- **`bcryptjs` (implementación JS pura)**: descartado en favor de `bcrypt`
  (nativo, más rápido); si la compilación nativa diera problemas en algún
  entorno, el cambio es un import — la interface no cambia.
