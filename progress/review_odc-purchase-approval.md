# review: odc-purchase-approval
Fecha: 2026-07-20
Veredicto: RECHAZADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`feature_list.json`: id 5 `odc-purchase-approval` es la única `in_progress`; id 1-4 `done`, id 6-13 `pending`)
- [x] `progress/current.md` actualizado (sesión activa describe feature 5, `spec_author: done`, `implementer: en curso`, `reviewer: pendiente` — coherente con que el reviewer aún no cerraba veredicto)

## Checklist C3 — Arquitectura
- [x] domain sin imports de infrastructure — `git diff --stat 9be828a..HEAD -- backend/src/modules/odc/domain backend/src/modules/odc/domain/repositories` devuelve **cero archivos**. Confirmado también con `git diff --stat 9be828a..HEAD -- backend/src/modules/auth` (guard/decorator sin diff) y `git diff 9be828a..HEAD -- .../reject-odc.usecase.ts .../application/dto` (sin diff): `RejectOdcUseCase` y `RejectOdcDto` siguen agnósticos de rol, tal como exige la spec.
- [x] Los repositorios/contratos en domain son interfaces puras — no tocados en esta feature.
- [x] La capa application solo depende de interfaces — `approve-purchase.usecase.ts` inyecta `PurchaseOrderRepository` vía `@Inject('PurchaseOrderRepository')` con `import type`; su flujo es `findById` → `OdcNotFoundError` → `order.transition('approve_purchase', actor.role)` → `OdcStatusHistoryEntry` → `repository.update`, sin chequeo de creador ni reglas de rol/estado filtradas (viven en `PurchaseOrder.transition()`). Copia estructural fiel de `ApproveBudgetUseCase`.
- [x] La capa infrastructure implementa las interfaces de domain, no al revés — `odc.controller.ts` añade el handler `approvePurchase` como wiring puro (`@Post/@HttpCode/@Roles` + `actorFrom()` + `rethrowDomainError()`), sin reglas de negocio; el único cambio en `reject` es ampliar `@Roles('ADMINISTRACION')` a `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')`, su cuerpo no cambió. `odc.module.ts` solo registra `ApprovePurchaseUseCase` reutilizando el token `'PurchaseOrderRepository'` existente.

## Checklist C4 — TDD
- [x] Cada R<n> tiene al menos un test que lo nombra — verificado en código real:
  - R1: `approve-purchase.usecase.spec.ts` `describe('R1: ...')` + `odc.controller.spec.ts` `describe('R1: ...')`
  - R2: `approve-purchase.usecase.spec.ts` `describe('R2: ...')` + `odc.controller.spec.ts` `describe('R2: ...')`
  - R3: `odc.controller.spec.ts` `describe('R3: ...')`
  - R4: `reject-odc.usecase.spec.ts` `describe('R4: reject transitions PRESUPUESTO_APROBADO...')` + `odc.controller.spec.ts` `describe('R4: POST /api/odcs/:id/reject accepts DIRECTOR_GENERAL...')`
  - R5: `reject-odc.usecase.spec.ts` `describe('R5: reject regression...')` + `odc.controller.spec.ts` `describe('R5: reject regression...')`
  - R6: `reject-odc.usecase.spec.ts` `describe('R6: ...')` + `odc.controller.spec.ts` `describe('R6: ...')`
  - R7: `reject-odc.usecase.spec.ts` `describe('R7: ...')`
- [x] Historial de commits: 3 commits `feat` (`92acb63` R1,R2; `485cc78` R3; `13d0aa6` R4-R7), grano por requisito consistente con el patrón ya aprobado en la feature 4.
- [ ] **Pero ver "Observaciones"**: dos de estos describes en `odc.controller.spec.ts` (R4 y R5) no son adiciones — **reemplazan/renombran** describes `R4`/`R5` que pertenecían a la feature `odc-budget-validation` (ya `done` y aprobada), rompiendo la trazabilidad de esa feature. Ver detalle abajo.

## Checklist C5 — Trazabilidad
- [x] `specs/odc-purchase-approval/traceability.md` sin ninguna fila "pendiente" — las 7 filas (R1-R7) tienen test y commit, y cada referencia de test existe verbatim en el código actual (verificado leyendo los 3 archivos de test).
- [x] Commits de esta feature siguen el formato `feat(<scope>): <desc> (R-ids)` — confirmado en los 3 commits `feat`.
- [ ] **`specs/odc-budget-validation/traceability.md` (feature 4, ya `done` y previamente APROBADA) queda con dos filas rotas** como efecto colateral de esta feature. Ver "Observaciones".

## Checklist C6 — Spec aprobada
- [x] `specs/odc-purchase-approval/requirements.md` tiene `status: approved` en el frontmatter.
- [x] Casilla "Aprobado por humano" marcada con fecha: `- [X] Aprobado por humano (fecha: 2026-07-20)`.
- [x] Ningún requisito modificado después de la aprobación (spec de una sola tanda).

## Verificación específica R6 (403 vs 409, ambos sentidos)
Trazado el flujo completo en `purchase-order.entity.ts::transition` (sin cambios en esta feature, confirmado por diff vacío en `domain/`):
1. `candidates = TRANSITIONS.filter(rule => rule.action === 'reject' && rule.from !== null)` → dos reglas: T4 (`from: PENDIENTE_ADMIN`, `role: ADMINISTRACION`) y T6 (`from: PRESUPUESTO_APROBADO`, `role: DIRECTOR_GENERAL`).
2. `rule = candidates.find(candidate => candidate.from === this.status)` — el match es **por estado**, no por rol.
3. Caso `DIRECTOR_GENERAL` sobre `PENDIENTE_ADMIN`: `rule` resuelto es T4 (`role: ADMINISTRACION`). `rule.role !== role` → `InvalidRoleTransitionError` → 403. **No** cae en `InvalidStatusTransitionError`.
4. Caso `ADMINISTRACION` sobre `PRESUPUESTO_APROBADO`: `rule` resuelto es T6 (`role: DIRECTOR_GENERAL`). `rule.role !== role` → `InvalidRoleTransitionError` → 403. **No** cae en `InvalidStatusTransitionError`.
5. Confirmado con tests explícitos: `reject-odc.usecase.spec.ts::R6` (ambas combinaciones, assertando `InvalidRoleTransitionError` y `order.status` sin mutar) y `odc.controller.spec.ts::R6` (ambas combinaciones, assertando `ForbiddenException`).
6. Guard HTTP: `RolesGuard.canActivate` usa `requiredRoles.includes(role)` (sin cambios, `git diff --stat 9be828a..HEAD -- backend/src/modules/auth` vacío) — con `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` en `reject`, **ambos** roles pasan el guard HTTP antes de llegar al use-case/dominio, que es quien aplica la regla fina de rol-por-estado. Doble capa de autorización correcta, tal como describe la spec y las notas del implementer.

Este punto específico de la tarea está correctamente implementado y probado.

## Observaciones

### Bloqueante: traceability.md de la feature 4 (`odc-budget-validation`) queda con referencias rotas
Al implementar R4/R5 de esta feature, el implementer **reescribió/reemplazó** (no añadió) dos describe blocks de `odc.controller.spec.ts` que pertenecían a la feature `odc-budget-validation` (id 4, `done`, ya revisada y APROBADA en `progress/review_odc-budget-validation.md`):

- `describe('R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION', ...)` — **eliminado**. Su contenido (delegación con actor ADMINISTRACION + caso 403 rol distinto) fue movido dentro de un nuevo `describe('R5: reject regression — ADMINISTRACION on PENDIENTE_ADMIN (T4) keeps returning 200 after the R3 roles widening', ...)`.
- `describe('R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION', ...)` — **eliminado**. Su contenido se repartió entre un nuevo `describe('R6: reject responds 403 on role/status mismatch...', ...)` (casos 403) y un describe **sin R-id** `describe('reject: 404/409 handling is unaffected by the R3 roles widening', ...)` (casos 404/409).

Confirmado con `git diff 9be828a..HEAD -- backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts`: son hunks de `-`/`+` sobre los describes originales, no adiciones puras.

Consecuencia: `specs/odc-budget-validation/traceability.md` (líneas 14-15) sigue referenciando, para R4 y R5, los nombres de test exactos:
- `odc.controller.spec.ts::R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION`
- `odc.controller.spec.ts::R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION`

Ninguno de los dos existe ya en el árbol. La feature 4 está `done` y fue aprobada con esa trazabilidad como evidencia; ahora esa evidencia es inexacta (no "pendiente", sino **incorrecta**), lo que rompe el principio de trazabilidad inmutable post-aprobación del harness (ver CHECKPOINTS C5 y C6: "Ningún requisito fue modificado después de la aprobación sin pasar de nuevo por el gate" — aquí no se modificó el requisito, pero sí su evidencia de test).

**Nota**: no hay regresión de comportamiento ni de cobertura — los escenarios de T4 (200 ADMINISTRACION, 403 rol distinto, 404, 409, 403 en `PRESUPUESTO_APROBADO`) siguen probados, solo que bajo nombres distintos. El problema es puramente de integridad de trazabilidad para una feature ya cerrada.

**Corrección sugerida para el implementer** (no prescriptiva en la forma, sí en el resultado): restaurar/duplicar los dos describes originales de `odc-budget-validation` en `odc.controller.spec.ts` tal como estaban (o, alternativamente, actualizar `specs/odc-budget-validation/traceability.md` para apuntar a los nombres nuevos y dejar constancia explícita de por qué se re-etiquetó evidencia de una feature ya aprobada) y añadir los describes nuevos de `odc-purchase-approval` (R4, R5, R6) **sin tocar** los de la feature 4. En `reject-odc.usecase.spec.ts` sí se hizo correctamente: los describes `R3`, `R4`, `R5` originales de `odc-budget-validation` se dejaron intactos y los nuevos `R4`-`R7` de esta feature se añadieron después (confirmado por diff: solo hunks `+`).

### No bloqueante: colisión de etiquetas R<n> entre features en los mismos archivos de test
Como consecuencia de que cada spec de feature numera sus requisitos desde R1, `odc.controller.spec.ts` y `reject-odc.usecase.spec.ts` terminan con más de un `describe('R1: ...')`, `describe('R4: ...')`, etc. con contenido distinto perteneciente a features distintas (p. ej. `R1` de `approve-budget` y `R1` de `approve-purchase` en el mismo archivo). Jest no tiene problema ejecutándolos, y cada nombre completo sigue siendo unívoco, pero grepear por `describe('R4:` en el archivo da más de un resultado y obliga a leer el texto completo para saber a qué feature pertenece. No bloquea esta revisión porque no rompe trazabilidad de ninguna fila existente (a diferencia del punto bloqueante arriba), pero conviene que `spec_author` considere un prefijo de feature en los ids (o que `implementer` evite reetiquetar describes de features ya cerradas) para futuras features (6-8) que comparten estos mismos archivos.

## Output de ./init.sh
```
══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════

→ Verificando entorno...
✅ node disponible (/c/Program Files/nodejs/node)
✅ pnpm disponible (/c/Users/alex/AppData/Local/pnpm/pnpm)

→ Verificando variables de entorno...
✅ .env encontrado
✅   DATABASE_URL definida
✅   JWT_SECRET definida

→ Instalando dependencias...
Lockfile is up to date, resolution step is skipped
Already up to date
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: odc-purchase-approval

→ Build...
> backend@0.0.1 build && nest build
> frontend@ build && vite build
✓ 123 modules transformed. / ✓ 106 modules transformed.
✅ Build exitoso

→ Ejecutando tests...
> backend@0.0.1 test && jest
Test Suites: 33 passed, 33 total
Tests:       285 passed, 285 total
Snapshots:   0 total
Time:        5.89 s

> frontend@ test && vitest run --passWithNoTests
No test files found, exiting with code 0
✅ Tests pasados

→ Lint...
> backend@0.0.1 lint && eslint "{src,apps,libs,test}/**/*.ts" --fix
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 4/13 completadas | 8 pendientes

  Próxima feature:
  [#6] odc-register-payment (P1)
```

Coincide con el reporte del implementer (285/285 tests, build y lint verdes) — sin regresiones funcionales, verificado de forma independiente. El rechazo de esta revisión es por integridad de trazabilidad (C4/C5 sobre la feature 4 ya aprobada), no por tests, build ni arquitectura de esta feature, que están correctos.
