# ODC — Status

**Última actualización**: 2026-08-17
**Features completadas**: 30/30 (`feature_list.json`)
**Pendientes**: ninguna
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
- **Frontend completo (5/5 features de negocio, #9-#13)**: fundación
  TanStack Start + shadcn/ui + sesión (#9), dashboard/creación/edición de ODC
  para `DIRECTOR_OPS` (#10), flujos de `ADMINISTRACION` (#11), aprobación de
  `DIRECTOR_GENERAL` (#12), y registro de pago + subida de factura para
  `DIRECTOR_OPS` (#13, última, cerrada 2026-07-23). Ver `progress/history.md`
  para detalle sesión por sesión.
- Deuda anotada (backend): `synchronize: true` solo dev (migraciones antes de
  prod); `backend/test/app.e2e-spec.ts` scaffold desactualizado (fuera de
  TEST_CMD); sin fail-fast si falta `JWT_SECRET` al arrancar.
- Deuda anotada (frontend, no bloqueante, señalada por el reviewer en #13):
  el wiring de props al componer acciones/formularios en
  `frontend/src/routes/_authenticated/odcs/$id.tsx` (`AdminBudgetActions`,
  `GeneralApprovalActions`, `RegisterPaymentForm`, `UploadInvoiceForm`) no
  tiene ningún test de regresión — bajo riesgo (glue trivial), pero pendiente
  si se toca esa ruta de nuevo.
- **Sistema de diseño (2026-08-10)**: `design-system/odc/MASTER.md` es la
  **fuente única de verdad** visual. `/DESIGN.md` queda subordinado y
  sincronizado (se conserva solo porque la skill `impeccable` lo lee vía
  `scripts/context.mjs`). Overrides por página en `design-system/odc/pages/`.
  Regla cromática vigente: **Two-Color Rule** — navy institucional para chrome,
  acción primaria y foco; hues de estado para el ciclo de la orden; nada más.
- **#23 `ui-design-tokens` done** (2026-08-10): fases 1-2 del refactor visual.
  Tokens navy + 8 pares `--status-*`, Inter importada (nunca lo había estado
  pese a llevar dos años en `package.json`), radios cerrados y las 9 primitivas
  de `ui/` reestiladas. Los `--status-*` ya se consumen desde
  `odc-status-badge.tsx` tras la feature 25.
- **#24, #25 y #30 done** (2026-08-11): corrección cromática de dark mode,
  refactor de dashboards activos y eliminación auditada de tres dashboards
  sustituidos. Una guarda transitiva impide nuevas superficies ODC sin ruta.
- **#26 `ui-surfaces-detail-forms` done** (2026-08-11): detalle y timeline
  semánticos, acciones integradas en la columna principal, confirmación de
  cierre y validación accesible con blur/foco en los cinco formularios.
- **#27 `ui-surfaces-monthly-summary` done** (2026-08-16): resumen mensual con
  header compacto, barras de estado por tokens, tabla alineada al sistema y
  exportaciones PNG/PDF preservadas; gate visual y humano aprobados.
- **#28 `ui-responsive-375` done** (2026-08-17): auditoría a 375px de las seis
  rutas vivas. **No se rompió nada** — `scrollWidth == clientWidth == 375` en
  todas, cero cambios en `frontend/src/components/`; el entregable es el acta
  `progress/verify_ui-responsive-375.md`. El viewport se demostró con Playwright
  (`frontend/e2e/responsive-375.spec.ts`) porque `resize_window` nunca
  redimensionó de verdad. Dos deudas medidas y abiertas por decisión humana:
  área táctil bajo 44×44px (choca con el dial de densidad de la #23) y el
  `grid-cols-3` del resumen mensual, que desborda a partir de importes de siete
  cifras.
- **#29 `ui-copy-es-and-title` done** (2026-08-17): login rotulado en español
  (`Correo electrónico` / `Contraseña`), mensajes de validación de `loginSchema`
  en español —zod v4 los emitía en inglés a la vista, defecto encontrado al
  especificar— y `<title>` global `ODC — Órdenes de compra` en `__root.tsx`.
  5 líneas en 3 archivos. Verificado en Chromium real, no solo en jsdom.
- **No queda ninguna feature abierta.** Lo siguiente es decisión de producto, no
  del backlog. Candidatos ya anotados y sin dueño: las dos deudas de la #28
  (área táctil bajo 44×44px, `grid-cols-3` del resumen mensual a siete cifras),
  el copy en inglés de las primitivas `ui/` (`pagination.tsx`, `sheet.tsx`,
  `sidebar.tsx`, hallazgo de la #29), re-saturar las 8 badges de dark
  (`progress/ui-redesign-plan.md`), la rama "correo vacío" de R2 sin test en
  jsdom, y la deuda de backend de más abajo (migraciones antes de producción).
- Deuda anotada (tests): `general-approval-actions.test.tsx:163` es flaky —
  solo falla con la suite completa, por una carrera de render (`waitFor`
  seguido de `getByText` síncrono). Re-correr antes de culpar a un cambio.

---

## Última sesión

**2026-08-17** — Cierre de `ui-copy-es-and-title` (#29) → **30/30, backlog vacío**.

- Los dos defectos anotados el 2026-08-10 (copy inglés en login, `<title>` del
  starter) más un tercero encontrado al especificar: zod v4 emitía los mensajes
  de validación en inglés, visibles en el formulario. Aprobado meterlo como R2.
- 8 commits, par `test`→`feat` por requisito; C4 limpio a la primera. Actualizar
  `getByLabelText` en los tests era inevitable al cambiar copy: el reviewer
  verificó línea por línea que solo cambiaron localizadores, ninguna aserción.
- R2 verificado en Chromium real por el reviewer, no solo en jsdom.
- `./init.sh` verde: 471 tests backend, 601 frontend.

---

**2026-08-17** — Cierre de `ui-responsive-375` (#28) → **29/30**.

- Feature de verificación: el resultado es que a 375px no se rompe nada. 16
  observaciones en navegador real, cero cambios de componente.
- R1 era el gate de todo lo demás: sin demostrar el viewport, un "no encontré
  defectos" es indistinguible de no haber mirado. Playwright lo demostró
  (`innerWidth` 375, `matchMedia` 40rem y 48rem en `false`) donde
  `resize_window` había fallado en silencio el 2026-08-10.
- 18 commits con par `test`→`feat` por requisito; C4 limpio a la primera. El
  reviewer verificó el rojo de las cuatro guardas de no regresión mutando la
  fuente real (8 mutaciones → 8 rojos).
- Gate humano de la §8 del acta: aprobación verbal transcrita por el leader y
  declarada como tal en el archivo (`f914082`), no casilla auto-marcada.
- `./init.sh` verde: 471 tests backend, 596 frontend.

---

**2026-08-16** — Cierre de `ui-surfaces-monthly-summary` (#27) → **28/30**.

- Header reducido de 100px a 59.9875px en ambos temas, total único a 30px y
  barras 3/3/1 legibles con los tokens de estado existentes.
- Paginación real validada con 11 registros locales; los cuatro temporales se
  eliminaron y la base volvió a 7 compras.
- PNG y PDF ejecutados e inspeccionados sin recortes; reviewer y gate humano
  aprobados. `./init.sh` verde con 471 tests backend y 480 frontend.

---

**2026-08-11** — UI/UX Pro Max inicializado para Codex.

- El CLI oficial generó las skills locales bajo `.agents/skills/`.
- No cambió el estado de ninguna feature.
- `./init.sh` verde: 471 tests backend, 472 frontend, builds y lint.

---

**2026-08-10** — Sistema de diseño + cierre de `ui-design-tokens` (#23) →
**23/23 completadas**.

- Diagnóstico de por qué la UI "se veía genérica": `--primary` acromático,
  `--card` idéntico a `--background`, radios de app de consumo y —el hallazgo
  caro— las fuentes de `package.json` **nunca importadas**, así que la app
  renderizaba con Segoe UI.
- Se generó el sistema de diseño con la skill `ui-ux-pro-max` contra el tipo
  de producto "Invoice & Billing Tool". Se descartaron cuatro de sus
  recomendaciones con motivo registrado en `MASTER.md`: el bloque STYLE
  (misruteado a "Exaggerated Minimalism" con tres queries distintas), el
  pairing Fira (Inter ya instalada), el preset GSAP (las view transitions ya
  cubren ese tier) y los iconos Phosphor (Lucide ya en uso).
- `MASTER.md` pasa a fuente única; `/DESIGN.md` sincronizado en vez de
  abandonado, porque `impeccable` lo lee solo.
- **R2 y R5 salieron contradictorios de la spec aprobada**: R2 fijaba texto
  blanco sobre `#059669` (3.77:1) y R5 exigía 4.5:1. Ninguna implementación
  podía cumplir ambos; el `spec_author` no lo detectó al redactarlos, el
  `implementer` sí al chocar con ello. Resuelto por decisión humana bajando el
  verde a `#047857` (5.48:1), que además coincide con `--status-done`.
  Registrado como enmienda firmada en `requirements.md`, no como edición
  silenciosa, porque C6 lo exige.
- C4 limpio a la primera, por una vez: 11 commits, ningún par test+impl
  mezclado. El reviewer lo verificó archivo por archivo y con rojo empírico en
  worktree aislado.
- El reviewer aprobó con dos defectos de documentación, ambos corregidos: una
  afirmación falsa sobre el orden de commits de R13/R15 en `traceability.md`
  (el `git log` la desmentía) y una justificación mía del chroma que citaba el
  requisito equivocado y leía la restricción al revés.
- `./init.sh` verde: 471 tests backend, 328 frontend, builds y lint.

**Próxima sesión**: evaluar visualmente el resultado de la #23 en el navegador
—nada de esto se ha visto correr, solo tests y CSS compilado— y decidir si se
especifican las features 24-26 (fases 3a-3e) de `progress/ui-redesign-plan.md`.

---

**2026-07-23** — Cierre de `frontend-payment-invoice` (#13), última feature
del plan maestro → **14/14 completadas**.

- Spec aprobada por humano (R1-R12) → implementación de `RegisterPaymentForm`
  y `UploadInvoiceForm` + cliente API + composición en el detalle.
- 1ra revisión RECHAZADA por C4: los 5 commits mezclaban test+implementación
  sin evidencia rojo→verde en Git (mismo defecto ya visto en
  `frontend-general-approval`, #12).
- Corregido con la misma técnica que ya funcionó en #12: rama de respaldo
  (`backup/frontend-payment-invoice-pre-rewrite-20260723`), `git reset --soft`
  + recomposición en 5 pares `test(...)`→`feat(...)` por grupo de
  requisitos, sin tocar tests en el commit `feat`.
- 2da revisión APROBADA, con verificación independiente de rojo→verde
  (checkouts reales + `vitest run`, no aceptada de palabra).
- De paso: se reforzó `.claude/agents/spec_author.md` contra la
  auto-aprobación de la casilla humana (6ta recurrencia observada; ver
  memoria de Claude `spec-author-checkbox-unreliable`) y se documentó el
  patrón de rechazo C4 recurrente (memoria `implementer-bundles-test-impl-commits`).
- `./init.sh` en verde: backend 51 suites/436 tests, frontend 23
  archivos/161 tests, build cliente+SSR y lint sin errores.
- El usuario pusheó los cambios manualmente al terminar la sesión.

**Próxima sesión**: sin feature pendiente del plan maestro — definir qué
sigue (nueva feature, deuda técnica anotada arriba, o cierre del proyecto).

---

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
