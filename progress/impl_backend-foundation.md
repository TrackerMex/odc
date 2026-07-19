# impl: backend-foundation

Fecha: 2026-07-19

## Archivos creados

- `backend/src/config/typeorm.config.ts` — factory pura `typeOrmModuleOptionsFactory(ConfigService)` que construye las opciones de TypeORM (R2, R3)
- `backend/src/config/typeorm.config.spec.ts` — tests R2 y R3 con `ConfigService` mockeado (sin tocar PostgreSQL)
- `backend/src/bootstrap.ts` — `configureApp()` (prefijo `api` + `ValidationPipe` whitelist), `resolvePort()` (PORT o 3001) y `bootstrap()` que los compone (R4, R5, R6)
- `backend/src/bootstrap.spec.ts` — tests R4, R5 y R6 con app NestJS mockeada (sin abrir sockets)
- `backend/src/health.controller.ts` — `GET health` → `{ status: 'ok' }` (R7)
- `backend/src/health.controller.spec.ts` — test R7: valor de retorno + metadata de ruta/método
- `backend/src/app.module.spec.ts` — tests R1 (ConfigModule global + envFilePath) y R8 (chequeo estructural de ausencia del scaffold)

## Archivos modificados

- `backend/src/app.module.ts` — registra `ConfigModule.forRoot` con opciones exportadas `configModuleOptions` (R1) y `TypeOrmModule.forRootAsync` con la factory (R2, R3); declara `HealthController` (R7); eliminado el scaffold del module (R8)
- `backend/src/main.ts` — reducido a `void bootstrap()`; toda la lógica vive en `bootstrap.ts`
- `backend/package.json` / `pnpm-lock.yaml` — deps nuevas: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config` (plan) + `class-validator`, `class-transformer` (justificación abajo)
- `specs/backend-foundation/traceability.md` — 8 filas trazadas (ninguna "pendiente")

## Archivos eliminados

- `backend/src/app.controller.ts`, `backend/src/app.service.ts`, `backend/src/app.controller.spec.ts` — scaffold `getHello` (R8)

## Requisitos cubiertos

- R1: test `backend/src/app.module.spec.ts::R1: global ConfigModule loading the repo root .env`, commit `c96671e`
- R2: test `backend/src/config/typeorm.config.spec.ts::R2: TypeORM options built from DATABASE_URL`, commit `7e0c964`
- R3: test `backend/src/config/typeorm.config.spec.ts::R3: synchronize disabled only in production`, commit `7e0c964`
- R4: test `backend/src/bootstrap.spec.ts::R4: global ValidationPipe with whitelist enabled`, commit `def07ce`
- R5: test `backend/src/bootstrap.spec.ts::R5: global route prefix 'api'`, commit `def07ce`
- R6: test `backend/src/bootstrap.spec.ts::R6: HTTP port from PORT with default 3001`, commit `1e2809e`
- R7: test `backend/src/health.controller.spec.ts::R7: GET /api/health responds { status: 'ok' }`, commit `d7747e2`
- R8: test `backend/src/app.module.spec.ts::R8: scaffold getHello endpoint removed`, commit `87bb410`

Commits adicionales: `b8d25eb` (chore: deps) y un `docs(backend-foundation): trace ...` tras cada feat (`04f20e8`, `4670422`, `e1b4b00`, `8b1a304`, `74e7f02`, `0699abd`).

## Decisiones de diseño

- **Helpers de bootstrap en `src/bootstrap.ts` en lugar de `main.ts`**: el design pedía specs "al lado" de los helpers de main; importar `main.ts` desde un spec ejecutaría el arranque real (NestFactory + conexión TypeORM). `main.ts` queda como entrypoint trivial (`void bootstrap()`) y los helpers exportados viven en `bootstrap.ts`, testeables sin side effects.
- **Deps extra `class-validator` + `class-transformer`**: `new ValidationPipe()` las carga en su construcción (falla sin ellas) y `docs/conventions.md` §DTOs las fija como estándar del proyecto. Justificado en el body del commit `def07ce`.
- **Test R1 resuelve los imports con `Promise.all`**: en `@nestjs/config` v4, `ConfigModule.forRoot` devuelve `Promise<DynamicModule>`; el test resuelve la promesa del metadata `imports` de `AppModule` sin levantar la app, y asserta `global: true` + las opciones exportadas `configModuleOptions`.
- **R7 con `@Controller()` + `@Get('health')`**: la spec pide "método decorado con ruta `health`"; el test verifica retorno exacto y metadata `path`/`method` vía property descriptor (evita la regla eslint `unbound-method`).
- **`resolvePort(env)` recibe el env como parámetro**: testeable con y sin `PORT` sin mutar `process.env`.

## Output de build

```
> backend@0.0.1 build C:\Users\alex\Documents\sites\odc\backend
> nest build

(exit 0)
```

## Output de tests

```
Test Suites: 4 passed, 4 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        4.294 s
Ran all test suites.
```

## Verificación final

- `./init.sh` desde la raíz: **exit 0, "✅ Todo verde"** (build backend+frontend, 15 tests backend, lint sin errores).
- `traceability.md` sin filas "pendiente".
- Working tree limpio salvo `feature_list.json`, `progress/current.md` y `specs/backend-foundation/requirements.md` (cambios del leader, no tocados ni commiteados por el implementer).

## Deuda / notas para el reviewer

- **Deuda ya documentada en design.md**: `synchronize: true` fuera de producción; antes de producción se generarán migraciones TypeORM.
- **`backend/test/app.e2e-spec.ts` (scaffold e2e) sigue esperando "Hello World!" en `GET /`**: está fuera de `TEST_CMD` y fuera del alcance de la spec ("Tests e2e ... fuera de alcance"), pero fallará si alguien lo ejecuta con `pnpm test:e2e`. Actualizarlo cuando se aborden los e2e (o en `auth-users`).
- La conexión real a PostgreSQL solo ocurre en runtime (`pnpm start`); ningún test la toca. `DATABASE_URL` debe estar en `.env` de la raíz para arrancar de verdad.
- Verificar que el orden `setGlobalPrefix` antes de `useGlobalPipes` en `configureApp` es indiferente (lo es para Nest) y que el prefijo `api` + ruta `health` produce `/api/health` (cubierto por R5 + metadata en R7, sin test HTTP real por diseño de la spec).
