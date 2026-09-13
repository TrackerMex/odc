---
feature: "executive-workspace-v2"
status: draft
tags: [harness, spec, traceability]
---

# Trazabilidad — [[executive-workspace-v2]]

> Aprobación humana registrada antes de implementar. Implementación y evidencia en curso; la revisión independiente y el init final cierran R14.

## Evidencia de implementación en curso

- Aprobación humana registrada en `7fdf66a` antes de código.
- R2–R9 backend: rojo `091f44a` (10 fallos de comportamiento) → implementación `8854dc9`; 25 pruebas focalizadas verdes y 3 pruebas PostgreSQL con tablas temporales/rollback para R2–R10.
- R14 tema: rojo `226e3a5` → verde `56474f1`; `frontend/src/lib/theme.test.tsx` verifica render SSR, hydrateRoot con dark persistido, cero errores y storage bloqueado; tema/layout 20/20 y lint focalizado verdes.
- R11/R12 creación: rojo `e4d4b4c` → verde `37956d9`; `odc-form.test.tsx::workspace v2 R11,R12` cubre revisión, cancelar/Escape/foco, snapshot, doble clic, folio, reintento mismo ID y creación incierta (19/19 verdes).
- R2–R10 interfaz: rojo `0962e9f` (6/6 fallan antes de UI), ahora 6/6 verdes. Regresiones históricas sustituidas conforme a la spec en `7063c42` (30/30 verdes), conservando permisos/foco/contexto.
- R1: rojo `043ef67`; header sticky/offsets implementados y test verde; medición real de scroll pendiente.

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | pendiente — header fijo, offsets y foco | pendiente |
| R2 | `backend/src/modules/odc/application/use-cases/executive-workspace.spec.ts::R2,R3,R4`; `backend/test/executive-workspace.e2e-spec.ts::R2-R10` — límites México/UTC y all | rojo `091f44a` → `8854dc9 feat(workspace): add filtered pages and real monthly analytics` |
| R3 | mismos tests R2,R3,R4 y PostgreSQL R2-R10 — búsqueda literal, roles y filtros completos | rojo `091f44a` → `8854dc9` |
| R4 | mismos tests R2,R3,R4 y PostgreSQL R2-R10 — páginas 10/10/7 y orden estable | rojo `091f44a` → `8854dc9` |
| R5 | `executive-workspace.spec.ts::R5,R7,R8,R9`; PostgreSQL R2-R10 — ADMIN DESC antes de paginar | rojo `091f44a` → `8854dc9` |
| R6 | `frontend/src/components/odc/executive-workspace.test.tsx::R3,R4,R6,R7,R8,R9,R10`; PostgreSQL R2-R10 — periodo independiente | rojo `0962e9f` → UI actual; backend `8854dc9` |
| R7 | `executive-workspace.spec.ts::R5,R7,R8,R9`; PostgreSQL R2-R10; UI R7 — doce meses y tabla textual | rojo `091f44a`/`0962e9f` → backend `8854dc9` y UI actual |
| R8 | mismos tests backend R8 y UI R8 — ocho estados/cohorte y borradores ajenos | rojo `091f44a`/`0962e9f` → backend `8854dc9` y UI actual |
| R9 | mismos tests backend R9 y UI R9 — cuatro KPI, null/cero y total completo | rojo `091f44a`/`0962e9f` → backend `8854dc9` y UI actual |
| R10 | PostgreSQL R2-R10; `executive-workspace.test.tsx::R10`; regresiones `executive-dashboard.test.tsx` — contexto y enlace all | backend `8854dc9`; regresiones `7063c42`; UI actual |
| R11 | `frontend/src/components/odc/odc-form.test.tsx::workspace v2 R11,R12` — revisión, snapshot, Escape/foco, cancelar | rojo `e4d4b4c` → `37956d9 feat(odc): review creation and recover saved submissions` |
| R12 | mismo test R11,R12 — doble clic, folio real, reintento del mismo ID y resultado incierto | rojo `e4d4b4c` → `37956d9` |
| R13 | pendiente — recuperación de consulta y respuestas tardías | pendiente |
| R14 | pendiente — accesibilidad, recarga de tema persistido sin errores de hidratación ni destello, visual, integración e init | pendiente |

Las pruebas de consultas reales complementan las unitarias de DTO/use-case/repositorio. La evidencia visual complementa, sin sustituir, los tests de comportamiento. Reviewer debe confirmar que no queda ninguna fila pendiente antes de declarar done.
