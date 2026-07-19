---
feature: "auth-users"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[auth-users]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Fuente funcional: brief **F2 `auth-users`** de
> `plans/001-odc-purchase-system.md`, más la tabla "Decisiones ya tomadas con
> el humano" (email/password + JWT en cookie httpOnly, usuarios por seed sin
> auto-registro, rol en el payload del JWT, guards por rol) y el modelo de
> datos de la tabla `users`. Los tests unitarios que verifican estos requisitos
> NO tocan PostgreSQL: use-cases y guards se verifican con repositorios,
> `JwtService` y contextos de ejecución mockeados (ver [[design]]).

## Requisitos funcionales

- **R1**: WHEN la capa de dominio del módulo `users` modela un usuario
  THE SYSTEM SHALL representarlo con una clase pura `User` con las propiedades
  del modelo de datos (`id`, `email`, `passwordHash`, `fullName`, `role`,
  `createdAt`), donde `role` solo admite los valores `DIRECTOR_OPS`,
  `ADMINISTRACION` y `DIRECTOR_GENERAL`, sin imports de NestJS, TypeORM ni
  ninguna librería de infraestructura.
  *Verificación*: test unitario que construye la entidad y asserta sus
  propiedades y el tipo del rol; chequeo estructural de que el archivo de la
  entidad no importa framework/ORM.

- **R2**: WHEN se define la persistencia de usuarios THE SYSTEM SHALL mapear
  una entidad ORM sobre la tabla `users` con las columnas del modelo de datos
  y constraint UNIQUE sobre `email`, implementando la interface
  `UserRepository` declarada en `domain/repositories` (al menos
  `findByEmail(email)` y `create(user)`), con la implementación TypeORM
  registrada por token string en el module.
  *Verificación*: test unitario que inspecciona los metadatos de TypeORM de la
  entidad ORM (nombre de tabla `users`, unicidad de `email`) sin abrir
  conexión, y test del repositorio con el manager/repository de TypeORM
  mockeado.

- **R3**: WHEN se ejecuta el script de seed (`pnpm seed` en `backend/`) y los
  usuarios seed no existen THE SYSTEM SHALL crear exactamente 3 usuarios:
  `ops@odc.local` con rol `DIRECTOR_OPS`, `admin@odc.local` con rol
  `ADMINISTRACION` y `dg@odc.local` con rol `DIRECTOR_GENERAL`, cada uno con
  `passwordHash` generado con bcrypt a partir de la variable de entorno
  `SEED_PASSWORD`; IF `SEED_PASSWORD` no está definida THEN THE SYSTEM SHALL
  usar el password default de desarrollo documentado en [[design]].
  *Verificación*: test unitario del use-case de seed con `UserRepository`
  mockeado: asserta los 3 emails/roles creados y que `bcrypt.compare` del
  password fuente contra el hash persistido es `true`.

- **R4**: IF un usuario del seed ya existe (mismo `email`) THEN THE SYSTEM
  SHALL omitir su creación sin duplicarlo ni fallar, de modo que una segunda
  ejecución del seed termina con éxito y deja los mismos 3 usuarios.
  *Verificación*: test unitario del mismo use-case con el repositorio mockeado
  devolviendo usuarios existentes en `findByEmail`: cero llamadas a `create` y
  ejecución sin error.

- **R5**: WHEN un cliente hace `POST /api/auth/login` con `email` y `password`
  que corresponden a un usuario (comparación bcrypt contra `passwordHash`)
  THE SYSTEM SHALL responder HTTP 200 con body `{ user }` conteniendo `id`,
  `email`, `fullName` y `role` — nunca `passwordHash` — y setear una cookie
  httpOnly con `SameSite=Lax` que contiene el JWT de sesión.
  *Verificación*: test unitario del use-case de login con repositorio y
  `JwtService` mockeados (usuario devuelto sin `passwordHash`), y test del
  controller con response mockeado assertando la llamada a `cookie(...)` con
  `httpOnly: true` y `sameSite: 'lax'`.

- **R6**: WHEN se firma el JWT de sesión THE SYSTEM SHALL firmarlo con el
  secret de la variable de entorno `JWT_SECRET`, con expiración de 8 horas y
  payload `{ sub: <id del usuario>, role: <rol del usuario> }`.
  *Verificación*: test unitario que ejecuta el login con un `JwtService` real
  configurado con un secret de test (o mockeado capturando argumentos) y
  asserta payload `{sub, role}` y expiración de 8h.

- **R7**: IF el `email` de login no corresponde a ningún usuario, o el
  `password` no coincide con el `passwordHash` THEN THE SYSTEM SHALL responder
  HTTP 401 con el mismo mensaje genérico en ambos casos (sin revelar cuál de
  los dos falló) y SHALL NOT setear ninguna cookie.
  *Verificación*: tests unitarios del use-case en ambos escenarios (email
  inexistente y password incorrecto) assertando el mismo error de dominio /
  `UnauthorizedException`, y que el controller no llama a `cookie(...)`.

- **R8**: WHEN llega una petición sin JWT válido en la cookie de sesión
  (cookie ausente, token expirado o firma inválida) a cualquier endpoint
  THE SYSTEM SHALL responder HTTP 401, excepto en los endpoints marcados como
  públicos — `POST /api/auth/login` y `GET /api/health` — que SHALL seguir
  respondiendo sin autenticación.
  *Verificación*: tests unitarios del `JwtAuthGuard` con `ExecutionContext` y
  `Reflector` mockeados: sin cookie → lanza 401; token inválido/expirado →
  lanza 401; token válido → deja pasar y adjunta el usuario al request;
  handler marcado con el decorator público → deja pasar sin token. Chequeo de
  que login y health llevan el decorator público.

- **R9**: WHEN una petición autenticada llega a un endpoint decorado con
  `@Roles(...)` y el `role` del JWT no está en la lista declarada THE SYSTEM
  SHALL responder HTTP 403; IF el `role` está en la lista, o el endpoint no
  declara roles THEN THE SYSTEM SHALL dejar proceder la petición.
  *Verificación*: tests unitarios del `RolesGuard` con `Reflector` y contexto
  mockeados: rol fuera de la lista → 403; rol en la lista → pasa; sin
  metadata de roles → pasa.

- **R10**: WHEN un cliente autenticado hace `GET /api/auth/me` THE SYSTEM
  SHALL responder HTTP 200 con `{ id, email, fullName, role }` del usuario
  identificado por el `sub` del JWT, sin incluir `passwordHash`; IF ese
  usuario ya no existe en la base THEN THE SYSTEM SHALL responder HTTP 401.
  *Verificación*: test unitario del use-case con repositorio mockeado (usuario
  encontrado → shape sin `passwordHash`; no encontrado → error 401).

- **R11**: WHEN un cliente autenticado hace `POST /api/auth/logout` THE SYSTEM
  SHALL expirar/limpiar la cookie de sesión en la respuesta, de modo que las
  peticiones posteriores sin un nuevo login reciban HTTP 401 (por R8).
  *Verificación*: test unitario del controller con response mockeado
  assertando la llamada a `clearCookie` (o cookie vacía con expiración
  inmediata) sobre la cookie de sesión.

## Fuera de alcance

- Auto-registro: NO existe `POST /api/auth/register` ni ningún alta de
  usuarios por API — los usuarios se crean solo por seed (decisión del plan).
- CRUD/edición de usuarios (API o UI), cambio o recuperación de contraseña.
- Refresh tokens, revocación server-side de JWT o sesiones persistidas —
  logout se limita a limpiar la cookie; la expiración de 8h acota la ventana.
- Aplicar `@Roles(...)` a endpoints de negocio — los endpoints de ODC llegan
  con las features 3–8; aquí solo se entregan los guards y el decorator.
- Frontend de login y manejo de sesión en UI (`frontend-foundation`, id 9).
- CORS / proxy dev (se resuelve en `frontend-foundation` vía `server.proxy`).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).
- Migraciones de producción (deuda ya registrada en `backend-foundation`).

## Aprobación

- [x] Aprobado por humano (fecha: 2026-07-19) ← gate obligatorio antes de implementar
