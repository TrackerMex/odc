# Spec escrita — auth-users (feature id 2)

- **Fecha**: 2026-07-19
- **Agente**: spec_author
- **Estado**: spec escrita en `draft`, pendiente de aprobación humana

## Qué se escribió

- `specs/auth-users/requirements.md` — 11 requisitos EARS (R1–R11), cada uno
  con nota de verificación testeable sin PostgreSQL. Frontmatter
  `status: draft`, casilla "Aprobado por humano" SIN marcar.
  - R1 entidad de dominio `User` pura; R2 persistencia (ORM entity `users`
    email UNIQUE + interface `UserRepository`); R3 seed de los 3 usuarios con
    bcrypt de `SEED_PASSWORD`/default dev; R4 idempotencia del seed;
    R5 login exitoso (200 `{ user }` + cookie httpOnly SameSite=Lax);
    R6 contrato del JWT (`JWT_SECRET`, 8h, `{sub, role}`); R7 login fallido
    401 genérico; R8 `JwtAuthGuard` global con `@Public()` en login/health;
    R9 `RolesGuard` + `@Roles(...)`; R10 `GET /api/auth/me`;
    R11 `POST /api/auth/logout` limpia cookie.
- `specs/auth-users/design.md` — decisiones: módulos `users` + `auth`
  separados, guard propio sin Passport, JWT en cookie httpOnly (decisión ya
  tomada con el humano), seed como use-case + script standalone, default dev
  de seed `odc-dev-password`, `cookie-parser` en bootstrap; archivos afectados
  por capa; 7 alternativas descartadas.
- `specs/auth-users/tasks.md` — bloque de preparación (deps) + ciclo TDD de
  3 sub-items por cada R1–R11.
- `specs/auth-users/traceability.md` — 11 filas "pendiente".

## Fuentes

Brief F2 de `plans/001-odc-purchase-system.md`, tabla "Decisiones ya tomadas
con el humano", modelo de datos `users`, superficie API auth,
`docs/architecture.md` (Clean Architecture NestJS+TypeORM),
`docs/conventions.md` y el estilo de `specs/backend-foundation/`.

## Fuera de alcance (explícito en la spec)

Auto-registro, CRUD de usuarios, cambio/recuperación de password, refresh
tokens/revocación server-side, aplicación de `@Roles` a endpoints de negocio
(features 3–8), frontend de login (feature 9), e2e con Postgres real.

## Dudas abiertas / notas para el leader

1. `feature_list.json` NO se tocó (restricción explícita del leader; el
   proceso del rol indicaría pasarla a `spec_ready` — queda en manos del
   leader tras esta entrega).
2. Default de dev del seed fijado en design.md como `odc-dev-password` — el
   plan solo pedía "default de dev documentado"; si el humano prefiere otro
   valor, es un cambio de una línea en design.md antes de aprobar.
3. Nombre de la cookie de sesión propuesto `odc_session` (el plan no lo fija);
   R5/R8/R11 no dependen del nombre concreto.
4. R10 (`/me`) consulta el repositorio para devolver datos frescos (y 401 si
   el usuario ya no existe) — el plan no especificaba si `/me` lee solo el
   payload del JWT; decisión razonada en design.md.
