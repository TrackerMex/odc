---
feature: "executive-workspace-v2"
status: implemented
tags: [harness, spec, traceability]
---

# Trazabilidad — [[executive-workspace-v2]]

> Aprobación humana registrada antes de implementar. Código y pruebas completos; el acta de revisión registra la validación final de R14.

## Evidencia de implementación en curso

- Aprobación humana registrada en `7fdf66a` antes de código.
- R2–R9 backend: rojo `091f44a` (10 fallos de comportamiento) → implementación `8854dc9`; 25 pruebas focalizadas verdes y 3 pruebas PostgreSQL con tablas temporales/rollback para R2–R10.
- R14 tema: rojo `226e3a5` → verde `56474f1`; `frontend/src/lib/theme.test.tsx` verifica render SSR, hydrateRoot con dark persistido, cero errores y storage bloqueado; tema/layout 20/20 y lint focalizado verdes.
- R11/R12 creación: rojo `e4d4b4c` → verde `37956d9`; `odc-form.test.tsx::workspace v2 R11,R12` cubre revisión, cancelar/Escape/foco, snapshot, doble clic, folio, reintento mismo ID y creación incierta (19/19 verdes).
- R2–R10 interfaz: rojo `0962e9f` (6/6 fallan antes de UI), ahora 6/6 verdes. Regresiones históricas sustituidas conforme a la spec en `7063c42` (30/30 verdes), conservando permisos/foco/contexto.
- R1: rojo `043ef67` → `192d74e`; header sticky/offsets y medición real en dashboard/formulario verdes.
- R13 navegador: rojo `f121eed` → `192d74e`; `88981de` añade respuesta tardía de página 3 tras volver a página 1, sin sobrescribir datos/URL.
- R14 SSR: rojo `0542704` → `0652537`, títulos SVG de un solo string; 7/7 pruebas de workspace verdes. R14 ejes: rojo `e5a1ca4` (8.555px efectivos) → `67bff4d` (≥12px medidos).
- Ajuste R7 solicitado: rojo `784c9a6` → componente interactivo shadcn/Recharts `f53561b`; selector de importe/compras, tooltip, escala desde cero y tabla textual. Guardas de dependencia actualizadas en `1054c8f`. Playwright ADMIN pasó 8 combinaciones de tema/ancho y `init.sh` final pasó 484 backend / 656 frontend.
- R11 proveedor: navegador rojo `88981de` → `67bff4d`, sin revalidar el valor anterior al cerrar el selector; 26 pruebas formulario/workspace verdes. E2E de creación intercepta todas las escrituras; no crea datos de negocio.
- Matriz `frontend/e2e/dashboard-template.spec.ts`: 3 pruebas / 24 combinaciones verdes; 375/768/1024/1440, OPS/ADMIN/DG, claro/oscuro, sin desbordamiento global ni errores de hidratación. Contraste de tokens ≥4.5:1 cubierto por `frontend/src/styles.tokens.test.ts::R5`.

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `frontend/src/components/layout/app-layout.test.tsx::R1`; `frontend/e2e/dashboard-template.spec.ts::R1,R14`; `frontend/e2e/executive-workspace.spec.ts::R1,R11,R12,R14` — header/aside y scroll reales | rojo `043ef67` → `192d74e`; E2E `8fddbef` |
| R2 | `backend/src/modules/odc/application/use-cases/executive-workspace.spec.ts::R2,R3,R4`; `backend/test/executive-workspace.e2e-spec.ts::R2-R10` — límites México/UTC y all | rojo `091f44a` → `8854dc9 feat(workspace): add filtered pages and real monthly analytics` |
| R3 | mismos tests R2,R3,R4 y PostgreSQL R2-R10 — búsqueda literal, roles y filtros completos | rojo `091f44a` → `8854dc9` |
| R4 | mismos tests R2,R3,R4 y PostgreSQL R2-R10 — páginas 10/10/7 y orden estable | rojo `091f44a` → `8854dc9` |
| R5 | `executive-workspace.spec.ts::R5,R7,R8,R9`; PostgreSQL R2-R10 — ADMIN DESC antes de paginar | rojo `091f44a` → `8854dc9` |
| R6 | `frontend/src/components/odc/executive-workspace.test.tsx::R3,R4,R6,R7,R8,R9,R10`; PostgreSQL R2-R10 — periodo independiente | rojo `0962e9f` → `192d74e`; backend `8854dc9` |
| R7 | `executive-workspace.spec.ts::R5,R7,R8,R9`; PostgreSQL R2-R10; UI R7 — doce meses, selector interactivo y tabla textual | rojo `091f44a`/`0962e9f` → backend `8854dc9`, UI `192d74e`; ajuste rojo `784c9a6` → `f53561b` |
| R8 | mismos tests backend R8 y UI R8 — ocho estados/cohorte y borradores ajenos | rojo `091f44a`/`0962e9f` → backend `8854dc9`, UI `192d74e` |
| R9 | mismos tests backend R9 y UI R9 — cuatro KPI, null/cero y total completo | rojo `091f44a`/`0962e9f` → backend `8854dc9`, UI `192d74e` |
| R10 | PostgreSQL R2-R10; `executive-workspace.test.tsx::R10`; regresiones `executive-dashboard.test.tsx` — contexto y enlace all | backend `8854dc9`; regresiones `7063c42`; UI `192d74e` |
| R11 | `frontend/src/components/odc/odc-form.test.tsx::workspace v2 R11,R12` — revisión, snapshot, Escape/foco, cancelar | rojo `e4d4b4c` → `37956d9 feat(odc): review creation and recover saved submissions` |
| R12 | mismo test R11,R12 — doble clic, folio real, reintento del mismo ID y resultado incierto | rojo `e4d4b4c` → `37956d9` |
| R13 | `frontend/e2e/executive-workspace.spec.ts::R3,R4,R13` — retry de página 2 conserva filtros, back/forward y respuesta tardía de página 3 | rojo `f121eed` → `192d74e`; prueba ampliada `88981de` |
| R14 | `frontend/src/lib/theme.test.tsx`; `executive-workspace.test.tsx::R14`; matriz `dashboard-template.spec.ts::R1,R14`; flujo `executive-workspace.spec.ts::R11,R12,R14`; contraste `styles.tokens.test.ts::R5`; acta de revisión e init final | tema `56474f1`; SVG inicial `0652537`; legibilidad/formulario `67bff4d`; E2E `8fddbef`; gráfica interactiva `f53561b` |

Las pruebas PostgreSQL usan tablas temporales y rollback, sin modificar las tablas de negocio. Las capturas finales y el resultado del reviewer se registran en `progress/review_executive-workspace-v2.md`. El typecheck adicional mantiene los 18 errores históricos de tests documentados en la auditoría, sin errores nuevos en la aplicación.
