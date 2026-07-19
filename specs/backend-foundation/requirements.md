---
feature: "backend-foundation"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[backend-foundation]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F1 `backend-foundation`** de
> `plans/001-odc-purchase-system.md`. Los tests unitarios que verifican estos
> requisitos NO tocan PostgreSQL: las factories de configuración y los helpers
> de bootstrap se verifican con `ConfigService`/app mockeados (ver [[design]]).

## Requisitos funcionales

- **R1**: WHEN la aplicación arranca THE SYSTEM SHALL cargar la configuración
  mediante un `ConfigModule` registrado como global (`isGlobal: true`) cuyo
  `envFilePath` apunta al `.env` de la raíz del repo (`'../.env'` relativo a
  `backend/`), de modo que cualquier proveedor pueda inyectar `ConfigService`
  sin volver a importar el módulo.
  *Verificación*: test unitario que inspecciona las opciones con las que
  `AppModule` registra `ConfigModule` (global + envFilePath) sin levantar la app.

- **R2**: WHEN se construyen las opciones de conexión de TypeORM THE SYSTEM
  SHALL producir opciones con `type: 'postgres'`, `url` tomada de la variable
  de entorno `DATABASE_URL` (vía `ConfigService`) y `autoLoadEntities: true`.
  *Verificación*: test unitario que invoca la factory de opciones con un
  `ConfigService` mockeado y asserta el objeto resultante — sin conectar a
  ninguna base de datos.

- **R3**: WHILE `NODE_ENV` es `'production'` THE SYSTEM SHALL construir las
  opciones de TypeORM con `synchronize: false`; en cualquier otro entorno
  (dev/test) SHALL usar `synchronize: true`. (Producción usará migraciones —
  deuda documentada en [[design]] y en el plan maestro.)
  *Verificación*: test unitario de la misma factory con `NODE_ENV` en ambos
  valores.

- **R4**: WHEN la aplicación se configura en el bootstrap THE SYSTEM SHALL
  registrar un `ValidationPipe` global con `whitelist: true`.
  *Verificación*: test unitario del helper de configuración de app (ver
  [[design]]) con una app NestJS mockeada, assertando que `useGlobalPipes`
  recibe un `ValidationPipe` construido con `whitelist: true`.

- **R5**: WHEN la aplicación se configura en el bootstrap THE SYSTEM SHALL
  establecer el prefijo global de rutas `'api'`, de modo que todo endpoint
  quede expuesto bajo `/api/...`.
  *Verificación*: test unitario del mismo helper, assertando la llamada a
  `setGlobalPrefix('api')` sobre la app mockeada.

- **R6**: WHEN la aplicación arranca THE SYSTEM SHALL escuchar en el puerto
  indicado por la variable de entorno `PORT`; IF `PORT` no está definida THEN
  THE SYSTEM SHALL usar el puerto `3001` por defecto.
  *Verificación*: test unitario del helper de resolución de puerto (con y sin
  `PORT` presente), sin abrir sockets reales.

- **R7**: WHEN un cliente hace `GET /api/health` THE SYSTEM SHALL responder
  HTTP 200 con el body exacto `{ "status": "ok" }`.
  *Verificación*: test unitario del controller de health (método decorado con
  ruta `health`) que asserta el valor de retorno `{ status: 'ok' }`; la
  combinación con el prefijo `/api` queda cubierta por R5.

- **R8**: WHEN la aplicación arranca THE SYSTEM SHALL NOT exponer el endpoint
  scaffold `getHello` ("Hello World!"): los archivos `app.controller.ts`,
  `app.service.ts` y `app.controller.spec.ts` del scaffold quedan eliminados o
  reconvertidos íntegramente al endpoint de health de R7.
  *Verificación*: chequeo estructural (los archivos scaffold ya no existen o no
  contienen `getHello`) + la suite de tests del backend pasa sin el spec del
  scaffold.

## Fuera de alcance

- Migraciones de producción de TypeORM (deuda registrada: `synchronize: true`
  es solo dev; antes de producción se generarán migraciones y se desactivará).
- Autenticación, usuarios, guards y JWT (feature `auth-users`, id 2).
- Entidades de negocio, módulos de dominio y tablas (`purchase_orders`,
  `users`, etc. — features 2 y siguientes).
- Tests e2e que requieran PostgreSQL real (opcionales, `backend/test/`, fuera
  de `TEST_CMD`).
- Cambios en `frontend/`, `docker-compose.yml` o `.env.example` (ya cubiertos
  por la Fase 0 del plan).
- CORS y proxy dev (se resuelven en `frontend-foundation`, id 9).

## Aprobación

- [x] Aprobado por humano (fecha: 2026-07-18) ← gate obligatorio antes de implementar
