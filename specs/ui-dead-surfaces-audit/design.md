---
feature: "ui-dead-surfaces-audit"
status: draft        # draft | approved
tags: [harness, spec, frontend, audit, routes]
---

# Diseño — [[ui-dead-surfaces-audit]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas del proyecto.

## Evidencia y decisión

La auditoría se hizo sobre las rutas de producción y los imports de
`frontend/src` el 2026-08-11. La evidencia decisiva no requiere una nueva
decisión de producto: la spec humana aprobada
`[[../role-based-executive-dashboard/requirements]]` exige una portada común
para los tres roles, y su diseño ordena reemplazar los tres paneles por
`ExecutiveDashboard`. El commit `308cdf6` retiró de
`routes/_authenticated/index.tsx` las siete composiciones de `listOdcs` y las
ramas `OdcDashboard`/`AdminDashboard`/`GeneralDashboard`, pero dejó sus archivos
y tests en el árbol.

Los tests de cada dashboard importan su componente directamente.
`frontend/src/design-system.guardrails.test.ts` además lee esos archivos con
`readFileSync`; esa lectura textual verifica estilo, pero no los hace
alcanzables por la aplicación.

### Rutas de producción

| Ruta | Superficie raíz | Datos / control vigente |
|---|---|---|
| `/login` | `LoginForm` | `login`; redirige a `/` tras autenticar |
| `/` | `ExecutiveDashboard` | una llamada a `getExecutiveDashboard` para los tres roles |
| `/tasks` | `ExecutiveTasks` | `getExecutiveTasks`; tareas filtradas por la sesión |
| `/odcs/new` | `OdcForm` | `listSuppliers`, `createOdc`, `submitOdc`; solo `DIRECTOR_OPS` muestra el formulario |
| `/odcs/$id` | `OdcDetail` + acciones/formularios | `getOdc` + `listSuppliers`; cada acción conserva su gate de rol y estado |
| `/monthly-summary` | `MonthlySummary` | `getMonthlyPurchaseSummary`; solo `DIRECTOR_OPS` |

No existe otra ruta de producción bajo `frontend/src/routes/` que monte una
superficie ODC.

### Inventario de componentes

| Componente | Importador de producción / camino desde ruta | Estado |
|---|---|---|
| `AdminBudgetActions` | `/odcs/$id` | montado; visible para `ADMINISTRACION` en `PENDIENTE_ADMIN` |
| `AdminDashboard` | ninguno; solo su test y lecturas de guardrail | **muerto — eliminar** |
| `ExecutiveDashboard` | `/` | montado para los tres roles |
| `ExecutiveTasks` | `/tasks` | montado |
| `GeneralApprovalActions` | `/odcs/$id` | montado; visible para `DIRECTOR_GENERAL` en `PRESUPUESTO_APROBADO` |
| `GeneralDashboard` | ninguno; solo su test y lecturas de guardrail | **muerto — eliminar** |
| `MonthlySummary` | `/monthly-summary` | montado; objetivo válido de la feature 27 |
| `MonthlySummarySlide` | `MonthlySummary` → `/monthly-summary` | montado transitivamente |
| `OdcDashboard` | ninguno; solo su test y lecturas de guardrail | **muerto — eliminar** |
| `OdcDetail` | `/odcs/$id` | montado; objetivo válido de la feature 26 |
| `OdcDocumentPreview` | `OdcDetail` → `/odcs/$id` | montado transitivamente cuando hay documento |
| `OdcForm` | `/odcs/new` y, para el creador `DIRECTOR_OPS` en `BORRADOR`/`RECHAZADA`, `/odcs/$id` | montado; objetivo válido de la feature 26 |
| `OdcPagePending`, `OdcPageError`, `RolePlaceholder` | rutas `/tasks`, `/monthly-summary`, `/odcs/new`, `/odcs/$id` | montados |
| `OdcStatusBadge` | `ExecutiveDashboard`, `ExecutiveTasks`, `OdcDetail` | montado aun después de eliminar los tres dashboards |
| `PaymentEvidenceForm` | `/odcs/$id` | montado; visible para `ADMINISTRACION` en `PAGO_REGISTRADO` |
| `RegisterPaymentForm` | `/odcs/$id` | montado; visible para `DIRECTOR_OPS` en `COMPRA_APROBADA` |
| `UploadInvoiceForm` | `/odcs/$id` | montado; visible para `DIRECTOR_OPS` en `EVIDENCIA_PAGO_SUBIDA` |
| `LoginForm` (fuera de `components/odc/`) | `/login` | montado; objetivo válido de la feature 26 |

### Decisión por superficie muerta

| Superficie | Decisión | Sustento implementable |
|---|---|---|
| `OdcDashboard` | eliminar componente y test | La portada aprobada de la feature 19 lo sustituyó por el snapshot ejecutivo. Sus cuatro colas provenían de llamadas separadas por estado; la prioridad de `DIRECTOR_OPS`, `/tasks`, `/odcs/new` y `/monthly-summary` ya cubren los accesos vigentes sin restaurar esa composición. |
| `AdminDashboard` | eliminar componente y test | Sus colas `PENDIENTE_ADMIN` y `PAGO_REGISTRADO` están representadas como tareas accionables de `ADMINISTRACION` en el endpoint ejecutivo; sus acciones reales siguen montadas en `/odcs/$id`. |
| `GeneralDashboard` | eliminar componente y test | La tarea `PRESUPUESTO_APROBADO` pertenece a la prioridad de `DIRECTOR_GENERAL` del snapshot ejecutivo; la aprobación/rechazo sigue montada en `/odcs/$id`. |

Montarlas de nuevo duplicaría una navegación que una spec posterior y aprobada
reemplazó de forma explícita. Por ello no hay gate de producto adicional: el
único gate pendiente es la aprobación humana de esta spec.

## Guarda automatizada

Se añadirá un test de alcanzabilidad independiente de los guardrails visuales.
Partirá de cada `frontend/src/routes/**/*.tsx` de producción, resolverá imports
locales por alias `@/` y rutas relativas, y recorrerá el grafo hasta obtener los
archivos alcanzables. Después comparará ese conjunto con todos los `*.tsx`
no-test de `frontend/src/components/odc/`.

La comparación será transitiva, no una búsqueda de texto por nombre. Así una
cadena o ciclo de componentes sin ruta tampoco contará como montada. El fallo
mostrará las rutas de los archivos huérfanos. Las rutas generadas, tests y
archivos que solo leen fuentes quedan fuera de las raíces para que no oculten
el mismo defecto que originó esta feature (R3).

## Archivos afectados

- `frontend/src/components/odc/odc-dashboard.tsx` y
  `odc-dashboard.test.tsx` — eliminar superficie sustituida y su test aislado.
- `frontend/src/components/odc/admin-dashboard.tsx` y
  `admin-dashboard.test.tsx` — eliminar superficie sustituida y su test aislado.
- `frontend/src/components/odc/general-dashboard.tsx` y
  `general-dashboard.test.tsx` — eliminar superficie sustituida y su test aislado.
- `frontend/src/components/odc/production-reachability.test.ts` — nueva guarda
  del grafo de imports de producción (R1, R3, R4).
- `frontend/src/design-system.guardrails.test.ts` — retirar lecturas y
  aserciones que dependan de los tres archivos eliminados; conservar las
  guardas aplicables a superficies activas.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` — nombrar y
  mantener la cobertura de la portada ejecutiva única (R2).
- `design-system/odc/pages/dashboard.md` — listar solo dashboards activos y
  retirar reglas que describan exclusivamente las colas eliminadas.
- `progress/ui-redesign-plan.md` — registrar el resultado de la auditoría y
  actualizar el encargo activo de la feature 26: los tres `pb-3!` desaparecen
  con R1; la revisión de `CardHeader` y `toast.tsx` conserva su dueño. Las
  menciones históricas de la feature 25 permanecen intactas.

No cambia ningún archivo de aplicación montado, ruta, cliente API ni backend.
Las specs y reportes previos permanecen intactos como historia del proyecto.

## Alternativas descartadas

- **Montar un dashboard distinto por rol**: contradice la feature 19 aprobada,
  reintroduce composiciones por estado y divide otra vez la portada común.
- **Conservar los archivos “por si se usan después”**: ya fueron sustituidos y
  sus tests aislados dieron una señal falsa de cobertura en la feature 25.
- **Aceptar cualquier importador inmediato como uso**: un componente podría
  quedar dentro de una cadena o ciclo huérfano; la alcanzabilidad debe partir
  de rutas reales.
- **Borrar menciones en specs y reportes históricos**: destruiría
  trazabilidad; solo se actualiza documentación normativa y planificación
  activa.
