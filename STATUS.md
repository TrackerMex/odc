# ODC — Status

**Última actualización**: 2026-07-22
**Features completadas**: 9/14 (`feature_list.json`)
**Pendientes**: 5 (todas frontend: #9-#13, `pending`, sin spec aún)
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

En desarrollo local sin Docker, el proxy de Vite usa por defecto
`http://localhost:3001`. En Docker Compose, el frontend usa
`API_PROXY_TARGET=http://backend:3001` porque `localhost` dentro del contenedor
frontend no apunta al backend. El SSR usa `API_BASE_URL=http://backend:3001`
para resolver el backend y reenviar la cookie de sesión entrante.

Requiere `.env` en la raíz (plantilla en `.env.example`): `DATABASE_URL`,
`JWT_SECRET`, `PORT`.

---

## Estado actual

- **Backend completo (8/8 features de negocio, #1-#8)**: fundación NestJS +
  auth JWT en cookie httpOnly + módulo `odc` con máquina de estados T1-T10
  completa (crear/editar/submit/aprobar presupuesto/aprobar compra/rechazar/
  registrar pago/subir comprobante/subir factura) + Cloudinary para
  archivos + catálogo de proveedores (`suppliers`, #14) validado contra
  `odc` en create/update. Ver `progress/history.md` para detalle sesión por
  sesión de cada una.
- **#14 `odc-suppliers-catalog` done** (2026-07-21): módulo `suppliers`
  (22 proveedores seedeados, `GET /api/suppliers`), `POST/PATCH /api/odcs`
  ahora rechazan con 400 cualquier `supplier` fuera del catálogo. Nota de
  proceso: el reviewer rechazó en 1ra pasada por gate humano no verificable
  (spec aprobada *después* de implementar, checkbox marcado post-hoc — 4ta
  vez que pasa esto con `spec_author`, ver memoria de Claude
  `spec-author-checkbox-unreliable`); se resolvió con aprobación humana real
  + commit de spec dedicado, reviewer aprobó en la re-revisión.
- **Frontend**: sigue sin ninguna feature de negocio implementada (#9-#13
  `pending`). Hoy se investigó (`explorer`) qué hace falta del ecosistema
  TanStack antes de especificar #9 — ver
  `progress/explore_frontend-foundation.md`: agregar `@tanstack/react-query`
  y `@tanstack/react-form` (justificado por feature); NO hace falta
  `react-table`/`react-store`/`react-virtual` con el alcance actual de
  #9-#13. También se instaló y arregló `shadcn/ui` (ver "Última sesión").
- Deuda anotada (backend): `synchronize: true` solo dev (migraciones antes de
  prod); `backend/test/app.e2e-spec.ts` scaffold desactualizado (fuera de
  TEST_CMD); sin fail-fast si falta `JWT_SECRET` al arrancar.
- Siguiente: `spec_author` para `frontend-foundation` (#9) usando el brief de
  `progress/explore_frontend-foundation.md` → aprobación humana → implementer.

---

## Última sesión

**2026-07-21** — Dos cosas distintas:

1. Cierre de `odc-suppliers-catalog` (#14): reviewer había rechazado por el
   gate humano (checkbox de aprobación marcado en el mismo commit que cerraba
   la implementación, sin evidencia previa). Humano aprobó explícitamente en
   el chat → commit dedicado `7da55c8` documentando esa aprobación →
   reviewer re-revisó y aprobó → feature marcada `done`, `./init.sh` verde
   (51 suites / 436 tests backend). Detalle en `progress/history.md` y
   `progress/review_odc-suppliers-catalog.md`.
2. Trabajo exploratorio/tooling de frontend (fuera del pipeline SDD, no es
   ninguna feature de `feature_list.json`):
   - `explorer` investigó qué agregar del ecosistema TanStack para #9-#13
     (brief completo en `progress/explore_frontend-foundation.md`).
   - El usuario instaló `shadcn/ui` manualmente y `shadcn init` falló
     (`ENOENT app/globals.css`) — bug real de esa versión de la CLI: detecta
     "TanStack Start" e ignora `--template`, pero asume el layout viejo
     (`app/`) en vez del `src/` que genera `create-tsrouter-app`. Se arregló
     a mano: `components.json` corregido (`rsc:false`, `css:"src/styles.css"`,
     sin `tailwind.config.js`), `src/styles.css` reconstruido en formato
     Tailwind v4 (`@theme inline`) con valores oklch reales del endpoint
     estable `ui.shadcn.com/r/colors/neutral.json` (el preset "rhea" elegido
     originalmente no se pudo recuperar — endpoints nuevos de presets dan
     404; si se quiere ese look exacto, copiar el CSS desde ui.shadcn.com a
     mano). `npx shadcn add <componente> --overwrite` confirmado funcionando
     con la config corregida. `pnpm build` verde.

**Pendiente antes de la próxima sesión**: los cambios de frontend (deps,
`components.json`, `src/styles.css`, `src/lib/utils.ts`,
`src/components/ui/button.tsx`) están en el working tree — algunos aparecieron
staged sin que el leader ejecutara `git add` (revisar con `git status` al
retomar, no se asumió ni se hizo commit). `progress/explore_frontend-foundation.md`
tampoco está commiteado. `docs/postman/` sigue sin trackear, ajeno a esta
sesión.

Próximos pasos:
1. Decidir/hacer commit de los cambios de frontend pendientes (arriba).
2. Lanzar `spec_author` para `frontend-foundation` (#9) con el brief de
   `progress/explore_frontend-foundation.md` → STOP hasta aprobación humana.

---

## Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16, pnpm, Jest. Puerto 3001,
  prefijo `/api`. Clean Architecture (`docs/architecture.md`).
- **Frontend**: TanStack Start + React 19 + Tailwind 4, Vite (puerto 3000,
  proxy `/api` configurable para local o Docker), Vitest. `shadcn/ui`
  (base `@base-ui/react`, preset base "neutral") agregado 2026-07-21.
- **Infra dev**: Docker Compose (solo PostgreSQL). Archivos subidos a
  `backend/uploads/` (disco local, gitignored).
