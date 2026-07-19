# ODC — Status

**Última actualización**: 2026-07-19
**Features completadas**: 2/13 (`feature_list.json`)
**Pendientes**: 11 (`pending`, sin spec aún)
**En producción**: no

---

## Qué es este proyecto

Sistema interno de gestión de Órdenes de Compra (ODC) para TrackerMex.
Flujo de aprobación de 6 pasos entre 3 roles: Director de Operaciones crea la
ODC, Administración valida presupuesto, Director General aprueba, se registra
pago, se sube comprobante y se cierra con factura + entrada a almacén.
Plan maestro en `plans/001-odc-purchase-system.md`.

---

## Cómo arrancar

```bash
docker compose up -d   # PostgreSQL 16 en :5432
./init.sh              # instala, build, tests, verificación del harness
```

Requiere `.env` en la raíz (plantilla en `.env.example`): `DATABASE_URL`,
`JWT_SECRET`, `PORT`.

---

## Estado actual

- Fase 0 completada: stack decidido (NestJS 11 + TypeORM + PostgreSQL /
  TanStack Start + React 19 + Tailwind 4), harness configurado,
  backlog de 13 features en `feature_list.json`.
- **#1 `backend-foundation` done** (review APROBADO): ConfigModule global,
  TypeORM desde `DATABASE_URL`, ValidationPipe whitelist, prefijo `/api`,
  `GET /api/health`, scaffold eliminado. 15 tests unitarios sin DB.
- **#2 `auth-users` done** (review APROBADO): módulos `users` + `auth` en
  Clean Architecture. Seed idempotente de 3 usuarios (`pnpm seed`, bcrypt,
  `SEED_PASSWORD` o default dev), login/logout/me, JWT 8h `{sub, role}` en
  cookie httpOnly `odc_session`, `JwtAuthGuard` global con `@Public()`
  (login/health) y `RolesGuard` + `@Roles()`. 63 tests unitarios sin DB.
- Deuda anotada: `synchronize: true` solo dev (migraciones antes de prod);
  `backend/test/app.e2e-spec.ts` scaffold desactualizado (fuera de TEST_CMD);
  sin fail-fast si falta `JWT_SECRET` al arrancar (menor M2 del review).
- Frontend sigue siendo scaffold.
- Siguiente: spec de `odc-create-draft` (feature #3) vía `spec_author` +
  aprobación humana.

---

## Última sesión

**2026-07-19** — Feature #2 `auth-users` completada vía pipeline SDD completo
(spec_author → aprobación humana → implementer TDD R1–R11 → reviewer APROBADO,
0 críticos / 0 mayores / 3 menores). Detalle en `progress/history.md` y
`progress/review_auth-users.md`. `./init.sh` en verde (2/13, 63 tests).

Próximos pasos:
1. Lanzar `spec_author` para `odc-create-draft` (#3) → STOP hasta aprobación humana
2. Continuar features 3→13 en orden vía pipeline SDD

---

## Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16, pnpm, Jest. Puerto 3001,
  prefijo `/api`. Clean Architecture (`docs/architecture.md`).
- **Frontend**: TanStack Start + React 19 + Tailwind 4, Vite (puerto 3000,
  proxy `/api` → 3001), Vitest.
- **Infra dev**: Docker Compose (solo PostgreSQL). Archivos subidos a
  `backend/uploads/` (disco local, gitignored).
