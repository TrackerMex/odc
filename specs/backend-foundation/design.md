---
feature: "backend-foundation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[backend-foundation]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Dependencias nuevas en `backend/`**: `@nestjs/typeorm`, `typeorm`, `pg`,
  `@nestjs/config` (prerequisito de R1–R3; no es un requisito EARS en sí —
  queda verificado porque el build y los tests compilan con esos imports).
- **`ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' })`** (R1):
  un único `.env` en la raíz del repo, compartido con el resto del monorepo,
  según `docs/conventions.md` § Variables de entorno. Global para no
  re-importar el módulo en cada feature posterior.
- **Factory de opciones TypeORM extraída a función nombrada y exportada**
  (R2, R3): `TypeOrmModule.forRootAsync({ useFactory })` donde la factory es
  una función pura que recibe `ConfigService` y devuelve las opciones
  (`type: 'postgres'`, `url: DATABASE_URL`, `autoLoadEntities: true`,
  `synchronize: NODE_ENV !== 'production'`). Al ser una función exportada, los
  tests unitarios la invocan con un `ConfigService` mockeado sin abrir
  conexiones — cumple la regla "los tests unitarios NO tocan Postgres".
- **`synchronize` solo en dev** (R3): deuda registrada a propósito (también en
  "Maintenance notes" del plan maestro): antes de producción se generarán
  migraciones de TypeORM y se desactivará `synchronize`. Esta feature solo
  documenta la decisión, no implementa migraciones.
- **Helper de configuración de app separado del bootstrap** (R4, R5, R6):
  `main.ts` se divide en (a) una función exportada que aplica
  `setGlobalPrefix('api')` y `useGlobalPipes(new ValidationPipe({ whitelist: true }))`
  sobre la app recibida, (b) un helper exportado que resuelve el puerto
  (`PORT` o default `3001`) y (c) el `bootstrap()` que solo compone a+b y
  llama `listen`. Así R4–R6 se verifican con una app mockeada, sin HTTP real
  ni base de datos.
- **Health como controller mínimo, sin módulo Clean Architecture completo**
  (R7, R8): `GET health` devuelve `{ status: 'ok' }`. No hay lógica de negocio
  ni persistencia, por lo que no aplica la estructura
  `modules/<nombre>/domain|application|infrastructure` — sería ceremonia vacía.
  El scaffold `app.controller.ts` / `app.service.ts` / `app.controller.spec.ts`
  se elimina y se sustituye por el controller de health con su spec al lado
  (convención `<nombre>.spec.ts`).

## Archivos afectados

Todo en capa **infrastructure/arranque** (no hay domain ni application en esta
feature — no existe aún lógica de negocio):

- `backend/package.json` — nuevas dependencias (`@nestjs/typeorm`, `typeorm`,
  `pg`, `@nestjs/config`).
- `backend/src/app.module.ts` — registra `ConfigModule` global (R1) y
  `TypeOrmModule.forRootAsync` con la factory (R2, R3); declara el controller
  de health.
- `backend/src/config/typeorm.config.ts` (nuevo) — factory de opciones TypeORM
  exportada (R2, R3) + su spec al lado.
- `backend/src/main.ts` — bootstrap recompuesto: helper de configuración de
  app (prefijo + pipe, R4/R5) y resolución de puerto (R6), con specs de los
  helpers al lado.
- `backend/src/health.controller.ts` (nuevo) — endpoint de health (R7) + su
  spec al lado.
- `backend/src/app.controller.ts`, `backend/src/app.service.ts`,
  `backend/src/app.controller.spec.ts` — eliminados (R8).

## Alternativas descartadas

- **`TypeOrmModule.forRoot` síncrono leyendo `process.env` directamente**:
  acopla el módulo al entorno global y hace imposible testear las opciones con
  `ConfigService` mockeado; `forRootAsync` + factory exportada es testeable.
- **Módulo `health` con estructura Clean Architecture completa**
  (`domain/application/infrastructure`): descartado por over-engineering — no
  hay entidad ni caso de uso; un controller con retorno estático basta. La
  estructura completa se estrena con `auth-users` (feature 2).
- **Health check con ping a la base de datos** (p.ej. `@nestjs/terminus`):
  descartado en esta feature — obligaría a que el test toque Postgres o a
  mockear la conexión sin valor añadido. El contrato del plan es estático:
  `{ status: 'ok' }`. Si más adelante se necesita liveness de DB, será una
  feature aparte.
- **`.env` propio en `backend/`**: descartado — `docs/conventions.md` y la
  Fase 0 del plan fijan un único `.env` en la raíz (`envFilePath: '../.env'`).
- **Implementar migraciones ya en esta feature**: descartado — el plan decide
  explícitamente `synchronize: true` en dev y deja las migraciones como deuda
  documentada previa a producción.
