# ODC — Status

**Última actualización**: 2026-07-18
**Features completadas**: 0/13 (`feature_list.json`)
**Pendientes**: 13 (todas `pending`, sin spec aún)
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
  TanStack Start + React 19 + Tailwind 4), harness configurado
  (`init.config.sh`, `docs/conventions.md`, `docs/architecture.md`),
  backlog de 13 features en `feature_list.json`.
- Backend y frontend son scaffolds sin lógica de negocio todavía.
- Siguiente: spec de `backend-foundation` (feature #1) vía `spec_author` +
  aprobación humana.

---

## Última sesión

**2026-07-18** — Proyecto subido a `github.com/TrackerMex/odc` (monorepo,
`.git` anidados de scaffolds eliminados). Plan maestro escrito
(`plans/001-odc-purchase-system.md`) con decisiones de stack tomadas con el
humano: PostgreSQL + TypeORM, presupuesto solo validación manual, rechazo
editable con motivo, auth email/password + JWT. Fase 0 ejecutada:
`docker-compose.yml`, `.env.example`, `.gitignore`, `init.config.sh`,
`docs/` rellenados, `feature_list.json` poblado con 13 features.

Próximos pasos:
1. Lanzar `spec_author` para `backend-foundation` → STOP hasta aprobación humana
2. Implementar features 1→13 en orden vía pipeline SDD

---

## Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16, pnpm, Jest. Puerto 3001,
  prefijo `/api`. Clean Architecture (`docs/architecture.md`).
- **Frontend**: TanStack Start + React 19 + Tailwind 4, Vite (puerto 3000,
  proxy `/api` → 3001), Vitest.
- **Infra dev**: Docker Compose (solo PostgreSQL). Archivos subidos a
  `backend/uploads/` (disco local, gitignored).
