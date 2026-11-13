# Frontend: ODC con partidas múltiples

Feature aprobada: `odc-multi-line-items`, implementación frontend de R5 y R7.

## Archivos de producción

- `frontend/src/lib/odc.ts`: tipos `items[]`, compatibilidad con respuestas legacy, validación por partida, cálculo del total estimado y resumen del conteo.
- `frontend/src/components/odc/odc-form.tsx`: alta, edición, revisión, agregar/quitar partidas y recuperación de errores conservando los datos capturados.
- `frontend/src/components/odc/odc-detail.tsx`: detalle de todas las partidas en el orden recibido.
- `frontend/src/components/odc/executive-task-table.tsx`, `executive-dashboard.tsx`, `monthly-summary.tsx` y `monthly-summary-slide.tsx`: conteo junto al resumen compacto de primera partida, con fallback de una partida para fixtures legacy.

## Tests

- Formulario: `R5: reviews every line item and the updated total before creating an ODC`; `R7: adds and removes line items, keeps one line, and sends the ordered collection`; `R7: preserves every line after a save failure so the user can correct and retry`.
- Detalle: `R5: shows every line item in persisted order`.
- Lista ejecutiva: `R5: shows the item count beside the first-line summary in compact tasks`.
- Resumen mensual: `R5: shows the line-item count in the monthly purchase table and export slide`.
- Dashboard envejecido: `R5: shows the line count in R6 ageing alerts`.

## Verificación

- Vitest enfocado: 6 archivos, 96 tests aprobados (`odc-form`, `odc-detail`, `executive-workspace`, `executive-dashboard`, `monthly-summary`, `lib/odc`).
- Vite production build: aprobado.
- ESLint en los siete archivos de producción: aprobado.
- Prettier en los siete archivos de producción: aprobado.
- `tsc --noEmit`: no aprobado por 16 errores en tests sin modificar: `login-form.test.tsx` (2), `payment-evidence-form.test.tsx` (4), `production-reachability.test.ts` (1), `upload-invoice-form.test.tsx` (5), `__root.test.tsx` (1) y `odc-routes.test.ts` (3). `git blame` confirma que las líneas reportadas anteceden esta feature. Las consultas históricas de `odc-form.test.tsx` y `odc-detail.test.tsx` quedaron tipadas y ya no aparecen en el diagnóstico.
- Se eliminó `frontend/.test-tmp/` después de ejecutar Vitest. La inspección visual Playwright quedó bloqueada porque el puerto 5432 está ocupado por `pet-tracker-postgres`; el intento de levantar Compose creó contenedores ODC en estado `Created`, que se retiraron sin tocar los contenedores externos.
- Full `./init.sh`: frontend production build passed; all 41 files / 697 tests passed. Backend lint also passed in the same run.

## Commits

- `365f0f2` — `test(frontend): cover odc multi-line items`
- `e34ad01` — `test(frontend): cover compact odc item counts`
- `bada31c` — `test(frontend): cover aging order item summary`
- `762e8c0` — `test(frontend): align multi-item payload contract`
- `e870b1f` — `test(frontend): preserve item count in summary response`
- `3cb4860` — `feat(odc-multi-line-items): support multiple ODC items (R5,R7)`
- `0237907` — `test(frontend): trace item summary and type DOM queries`

Los tests R5/R7 quedaron listos para vincularse en `specs/odc-multi-line-items/traceability.md` por el coordinador.
