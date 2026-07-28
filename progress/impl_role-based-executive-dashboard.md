# Implementación — role-based-executive-dashboard

## Alcance

- Especificación aprobada: `e596de4 docs(role-based-executive-dashboard): approve implementation scope`.
- Pruebas primero: `e509930 test(role-based-executive-dashboard): specify dashboard behavior (R1-R11)`.
- Implementación: `308cdf6 feat(role-based-executive-dashboard): implement dashboard snapshot (R1-R11)`.

## Corrección R3

- El caso de uso devuelve `nextAction` tipado para cada tarea prioritaria, calculado a partir del rol autenticado y el estado que ya puede atender.
- El panel usa ese valor del snapshot para nombrar o enlazar la siguiente acción; no la infiere de `status`.
- Las tareas de Administración y Dirección General permanecen en modo consulta, pero muestran el nombre de su siguiente acción.

## Secuencia TDD

- El commit `e509930` contiene exclusivamente los tests que nombran R1–R11 y precede a cualquier archivo productivo del dashboard.
- El commit `308cdf6` incorpora la implementación mínima que satisface esa especificación.

## Evidencia

- Pruebas focalizadas: backend `get-executive-dashboard.usecase.spec.ts` (6 pruebas) y frontend `executive-dashboard.test.tsx` (199 pruebas totales de frontend) en verde.
- `init.sh` ejecutado con Git Bash el 2026-07-27: build correcto, backend 57 suites / 453 pruebas, frontend 30 archivos / 199 pruebas y lint backend sin errores.

---

# R13 — Reordenar jerarquía visual (alertas, prioridad, pulso, proveedores)

Fecha: 2026-07-27

## Alcance

Solo R13 (reordenamiento visual del resumen ejecutivo, frontend puro). R1-R12
no se tocaron; ni el caso de uso ni el repositorio del backend cambiaron.

## Archivos modificados

- `frontend/src/components/odc/executive-dashboard.tsx` — se dividió
  `OperationalContext` (grid de 2 columnas con "Órdenes con mayor antigüedad"
  y "Proveedores del periodo") en dos componentes independientes:
  - `AgeingAlerts`: card de ancho completo, re-enmarcada visualmente como
    alerta (icono `AlertTriangleIcon` en ámbar, título "Alertas: órdenes con
    mayor antigüedad", borde ámbar sutil). Reutiliza exactamente
    `dashboard.oldestActiveOrders` (mismo dato de R6, mismo orden/límite,
    ninguna consulta nueva).
  - `TopSuppliers`: la card de proveedores, sin cambios de contenido, ahora
    como sección independiente de menor jerarquía.

  Se reordenó el layout de `ExecutiveDashboard`: `AgeingAlerts` →
  (`PriorityQueue` + `Pulse` en grid) → `TopSuppliers`. Al no usarse `order`
  de CSS ni reversión de flex/grid, el orden en el DOM es el mismo en
  desktop y en mobile (stack de una columna), cumpliendo R13 para ambos
  anchos sin recorte horizontal (se conservan las clases `min-w-0` /
  `truncate` existentes). Foco visible, `aria-labelledby` y
  `motion-reduce` de R9 quedaron intactos.

- `frontend/src/components/odc/executive-dashboard.test.tsx` — nuevo
  `describe('R13: ...')` con dos tests: orden en el DOM (alertas < prioridad
  < pulso < proveedores, usando `compareDocumentPosition`) y verificación de
  que la sección de alertas reutiliza literalmente los datos de
  `oldestActiveOrders` (mismo id/enlace/proveedor que R6). El resto de tests
  (R3, R4, R8, R9) no requirió cambios; R9 sigue pasando porque prioridad
  sigue precediendo a pulso.

- `specs/role-based-executive-dashboard/traceability.md` — fila R13
  actualizada (antes "pendiente").

## Requisitos cubiertos

- R13: test `executive-dashboard.test.tsx::R13`, commit `9cac886` (test) +
  `6077742` (feat) + `dc3951f` (docs: traceability)

Historial recompuesto test→feat el 2026-07-27 para cumplir CHECKPOINTS C4
(commit original f92fb90 mezclaba test+impl); backup en rama
backup/role-based-executive-dashboard-r13-pre-rewrite-20260727

## Decisiones de diseño

- **Extraer en dos componentes en vez de reordenar con CSS `order`**: más
  simple y explícito; el orden en el DOM coincide siempre con el orden
  visual en cualquier viewport, sin depender de que las utilidades
  responsive de Tailwind se apliquen correctamente. Coincide con la decisión
  registrada en `design.md` ("cambio puramente de composición/orden en el
  árbol de React").
- **Re-etiquetado visual como alerta**: icono `AlertTriangleIcon` (mismo
  ícono que ya usa `odc-detail.tsx` para el aviso de rechazo) en ámbar,
  reutilizando el tono ya usado por `OdcStatusBadge` para estados
  pendientes (`bg-amber-100 text-amber-800`), en vez de estilo destructivo
  (rojo) reservado para errores reales. Se mantuvo `Card` (no un `Alert` de
  shadcn) porque el contenido es una lista de órdenes, no un mensaje
  puntual.
- `traceability.md` en commit `docs` separado del `feat`, siguiendo el
  patrón ya usado en R12 (`3ccbe33` feat + `125b5b4` docs).

## Output de build

```
pnpm build (frontend)
✓ built in 1.98s   (client, 170 modules)
✓ built in 687ms   (ssr)
```

## Output de tests

```
pnpm test --passWithNoTests (frontend)
 Test Files  30 passed (30)
      Tests  201 passed (201)

pnpm vitest run src/components/odc/executive-dashboard.test.tsx
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

## Notas para el reviewer

- Backend no se tocó (use case y repositorio de R6 intactos), consistente
  con el diseño aprobado.
- Hay cambios preexistentes sin commitear en el working tree que NO son de
  esta sesión de implementación (no los toqué ni los incluí en los commits):
  `backend/src/modules/odc/application/use-cases/get-executive-tasks.usecase.ts`,
  `feature_list.json`, `progress/current.md`, `specs/frontend-odc-form/*` y
  los archivos `requirements.md`/`design.md`/`tasks.md` de
  `role-based-executive-dashboard` (ya contenían R13 aprobado al momento de
  empezar esta sesión). Vale la pena que el leader/reviewer confirme si esos
  cambios pendientes pertenecen a otra sesión (parecen del trabajo de
  `spec_author` para R13 de `frontend-odc-form`, la siguiente feature en la
  cola según `progress/current.md`).
- Verificar visualmente en navegador (no cubierto por jsdom) que el acento
  ámbar de `AgeingAlerts` se ve bien en modo oscuro y no compite visualmente
  con `OdcStatusBadge` dentro de la lista de prioridad.
