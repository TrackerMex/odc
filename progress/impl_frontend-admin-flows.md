# implementation: frontend-admin-flows

Fecha: 2026-07-22
Estado: listo para revisión

## Resultado

- Dashboard por rol `ADMINISTRACION` con colas `PENDIENTE_ADMIN` y
  `PAGO_REGISTRADO`.
- Detalle con datos de pago y acciones de aprobar/rechazar presupuesto.
- Diálogo shadcn accesible con motivo obligatorio.
- Formulario de comprobante PDF/JPG/PNG de máximo 10 MB y cliente multipart.
- Frontera de acciones por rol y actualización de UI solo con respuesta del
  servidor.

## Archivos de aplicación

- `frontend/src/lib/api.ts`
- `frontend/src/lib/odc.ts`
- `frontend/src/routes/_authenticated/index.tsx`
- `frontend/src/routes/_authenticated/odcs/$id.tsx`
- `frontend/src/components/odc/admin-dashboard.tsx`
- `frontend/src/components/odc/admin-budget-actions.tsx`
- `frontend/src/components/odc/payment-evidence-form.tsx`
- `frontend/src/components/odc/odc-detail.tsx`
- `frontend/src/components/ui/dialog.tsx`

## Tests

- `frontend/src/lib/odc-api.test.ts`
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts`
- `frontend/src/components/odc/admin-dashboard.test.tsx`
- `frontend/src/components/odc/admin-budget-actions.test.tsx`
- `frontend/src/components/odc/payment-evidence-form.test.tsx`
- `frontend/src/components/odc/odc-detail.test.tsx`

## Commits TDD

- `8ad0352` — `test(frontend-admin-flows): define admin workflows (R1-R12)`
- `17d91df` — `feat(frontend-admin-flows): add admin purchase workflows (R1-R12)`

## Verificación

- Frontend: 19 archivos de test, 55 tests pasados antes del último caso
  adicional de recuperación de aprobación.
- Frontend build: exitoso.
- Frontend ESLint sobre todos los archivos tocados: exitoso.
- Backend build: exitoso.
- Backend: 51 suites, 436 tests pasados.
- Backend lint: exitoso.

La verificación integral se repite durante la revisión antes de marcar `done`.
