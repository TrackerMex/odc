# ODC — Status

**Última actualización**: 2026-07-19
**Features completadas**: 1/13 (`feature_list.json`)
**Pendientes**: 12 (`pending`, sin spec aún)
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
- Deuda anotada: `synchronize: true` solo dev (migraciones antes de prod);
  `backend/test/app.e2e-spec.ts` scaffold desactualizado (fuera de TEST_CMD).
- Frontend sigue siendo scaffold.
- Siguiente: spec de `auth-users` (feature #2) vía `spec_author` +
  aprobación humana.

---

## Última sesión

**2026-07-19** — Feature #1 `backend-foundation` completada vía pipeline SDD
completo (spec_author → aprobación humana → implementer TDD → reviewer
APROBADO C1–C6). Detalle en `progress/history.md` y
`progress/review_backend-foundation.md`. `./init.sh` en verde (1/13).

Próximos pasos:
1. Lanzar `spec_author` para `auth-users` → STOP hasta aprobación humana
2. Continuar features 2→13 en orden vía pipeline SDD

---

## Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16, pnpm, Jest. Puerto 3001,
  prefijo `/api`. Clean Architecture (`docs/architecture.md`).
- **Frontend**: TanStack Start + React 19 + Tailwind 4, Vite (puerto 3000,
  proxy `/api` → 3001), Vitest.
- **Infra dev**: Docker Compose (solo PostgreSQL). Archivos subidos a
  `backend/uploads/` (disco local, gitignored).
