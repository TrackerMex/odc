# Implementación: frontend-dashboard-template

Fecha: 2026-09-13

Adaptación aprobada de Modern + Orders Table al shell autenticado y dashboard de ODC. Aprobación humana registrada en 6615d94; no se reescribió la aplicación de referencia.

## Archivos y alcance

- `frontend/src/components/layout/app-layout.tsx`, `app-sidebar.tsx`: shell de 232px, encabezado 64/58px, breadcrumb por ruta, navegación activa, menú móvil y enlaces por rol.
- `frontend/src/components/odc/executive-dashboard.tsx`: panel unido, dos barras mensuales, cuatro métricas, tabla prioritaria y contexto proveedores/antigüedad. Datos del contrato existente, sin nuevas consultas.
- `frontend/src/styles.css`, `frontend/src/components/nav-user.tsx`: áreas táctiles de 44px, superficie del sidebar y movimiento reducido incluido el portal móvil.
- Tests existentes de layout, dashboard y guardrails; nueva matriz en `frontend/e2e/dashboard-template.spec.ts`.
- `frontend/THIRD_PARTY_NOTICES.md`: revisión, correspondencia de fuentes y licencia MIT.
- Override del dashboard actualizado antes de implementar. Formularios, backend, dependencias, permisos y contratos sin cambios.

## TDD y trazabilidad

- R1: test fba3c47; implementación 247f41b.
- R2–R6: test efd77fb (13 fallos iniciales); implementación 31d5695. Guard de anchura alineado con scroll local aprobado en 05e742a.
- R7/R8: test 1cccb99, targets de tema inicialmente 32px y aviso MIT inexistente. Test 2b0f493 reprodujo transición móvil de 200ms con movimiento reducido. Implementación 755b2af.
- La matriz espera la hidratación del menú antes de enviar Enter (4ea8e4a); el primer arranque frío de Vite puede superar los cinco segundos. No se cambiaron controles para compensar la espera del test.
- Detalle de requisitos y commits en `specs/frontend-dashboard-template/traceability.md`.

## Validación

- Init inicial: 471 tests backend, 601 frontend, builds y lint verdes.
- Init final: 471 backend, 618 frontend; build y lint. Log local: `%TEMP%/odc-final-init.log`.
- Tests focalizados de layout/dashboard/guardrails: 240/240 verdes.
- ESLint de los cuatro componentes editados y la matriz E2E: verde. Prettier de layout/sidebar/dashboard/matriz: verde.
- Matriz real Chromium: 3/3 tests, 24 combinaciones de rol/tamaño/tema verdes. Movimiento reducido y apertura por Enter incluidos.
- Regresión móvil existente: 2/2 tests, seis rutas con scrollWidth = clientWidth = 375.
- Evidencia y limitaciones de desarrollo en `progress/verify_frontend-dashboard-template.md`.

Revisión independiente requerida antes de marcar done.
