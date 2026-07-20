# review: odc-budget-validation
Fecha: 2026-07-20
Veredicto: APROBADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`feature_list.json`: id 4 `odc-budget-validation` es la única `in_progress`; id 3 `done`, id 5+ `pending`)
- [x] `progress/current.md` actualizado (sesión activa describe feature 4, spec_author/implementer `done`, reviewer `en curso`)

## Checklist C3 — Arquitectura
- [x] domain sin imports de infrastructure — `git diff --stat d3aef28..HEAD` confirma **cero cambios** en `backend/src/modules/odc/domain/**`, `domain/repositories/**`, entidades ORM y repositorio TypeORM. Se reutiliza intacta la máquina de estados aprobada en la feature 3.
- [x] Los repositorios/contratos en domain son interfaces puras — no tocados en esta feature.
- [x] La capa application solo depende de interfaces — `approve-budget.usecase.ts` y `reject-odc.usecase.ts` inyectan `PurchaseOrderRepository` vía `@Inject('PurchaseOrderRepository')` con `import type`, solo llaman `findById`/`update`/`order.transition(...)`. Sin lógica de negocio (reglas de rol/estado) filtrada al use-case.
- [x] La capa infrastructure implementa las interfaces de domain, no al revés — `odc.controller.ts` añade `approveBudget`/`reject` como wiring puro (decorators `@Post/@HttpCode/@Roles`, `actorFrom()`, `rethrowDomainError()`), sin reglas de negocio; `odc.module.ts` solo registra providers nuevos, mismo token `'PurchaseOrderRepository'`.

## Checklist C4 — TDD
- [x] Cada R<n> tiene al menos un test que lo nombra — verificado en código real, no solo en el reporte:
  - R1: `approve-budget.usecase.spec.ts` `describe('R1: ...')` + `odc.controller.spec.ts` `describe('R1: ...')`
  - R2: `approve-budget.usecase.spec.ts` `describe('R2: ...')` + `odc.controller.spec.ts` `describe('R2: ...')`
  - R3: `reject-odc.dto.spec.ts` `describe('R3: ...')` + `reject-odc.usecase.spec.ts` `describe('R3: ...')`
  - R4: `reject-odc.usecase.spec.ts` `describe('R4: ...')` + `odc.controller.spec.ts` `describe('R4: ...')`
  - R5: `reject-odc.usecase.spec.ts` `describe('R5: ...')` + `odc.controller.spec.ts` `describe('R5: ...')`
- [x] Historial de commits: 3 commits `feat` (`d2399ac` R1,R2; `c6bfbb0` R3; `77713de` R4,R5), cada uno con test+implementación juntos por requisito — mismo grano que la feature 3 ya aprobada (no es "todo en un commit": R1-R5 están repartidos en 3 commits temáticos). Revisado `git show --stat` de los 3; el único cambio "extra" en `77713de` sobre `approve-budget.usecase.spec.ts` es reformateo de Prettier (6 líneas, sin cambio semántico).

## Checklist C5 — Trazabilidad
- [x] `traceability.md` sin ninguna fila "pendiente" — las 5 filas (R1-R5) tienen test y commit.
- [x] Commits siguen el formato `feat(<scope>): <desc> (R-ids)` — confirmado en los 3 commits `feat(odc): ... (R1,R2)`, `(R3)`, `(R4,R5)`.

## Checklist C6 — Spec aprobada
- [x] `specs/odc-budget-validation/requirements.md` tiene `status: approved` en el frontmatter.
- [x] Casilla "Aprobado por humano" marcada con fecha: `- [X] Aprobado por humano (fecha: 2026-07-20)`.
- [x] Ningún requisito modificado después de la aprobación (spec de una sola tanda, sin historial de ediciones posteriores visible en el diff).

## Verificación específica R5 (403 vs 409)
Trazado el flujo completo en el dominio (`purchase-order.entity.ts::transition`, sin cambios en esta feature):
1. `candidates` filtra por `action === 'reject'` → dos reglas: T4 (`from: PENDIENTE_ADMIN`, `role: ADMINISTRACION`) y T6 (`from: PRESUPUESTO_APROBADO`, `role: DIRECTOR_GENERAL`).
2. `rule = candidates.find(candidate.from === this.status)` — con `status = PRESUPUESTO_APROBADO` encuentra la regla T6 (match por estado antes que por rol).
3. `rule.role !== role` → `DIRECTOR_GENERAL !== ADMINISTRACION` → lanza `InvalidRoleTransitionError` → `rethrowDomainError()` lo traduce a 403 (no 409).
4. Confirmado con test explícito en `reject-odc.usecase.spec.ts` (`R5`, caso `'rejects an ADMINISTRACION actor on PRESUPUESTO_APROBADO with the role domain error (T6 reserved to DIRECTOR_GENERAL)'` → `InvalidRoleTransitionError`) y en `odc.controller.spec.ts` (`R5`, caso homólogo → `ForbiddenException`).
5. Los otros 6 estados sin regla de rechazo (`BORRADOR`, `COMPRA_APROBADA`, `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA`, `RECHAZADA`) sí caen en `InvalidStatusTransitionError` → 409, cubiertos con `it.each` en ambos specs.
Correcto: el caso `PRESUPUESTO_APROBADO` se distingue bien de los demás y no se coló código nuevo en el use-case para lograrlo (comportamiento heredado del dominio, tal como afirma el reporte del implementer).

## Observaciones
Ninguna. Sin bloqueos.

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
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: odc-budget-validation

→ Build...
> backend@0.0.1 build && nest build
> frontend@ build && vite build
✓ 123 modules transformed. / ✓ 106 modules transformed.
✅ Build exitoso

→ Ejecutando tests...
> backend@0.0.1 test && jest
Test Suites: 32 passed, 32 total
Tests:       256 passed, 256 total
Snapshots:   0 total
Time:        6.603 s

> frontend@ test && vitest run --passWithNoTests
No test files found, exiting with code 0
✅ Tests pasados

→ Lint...
> backend@0.0.1 lint && eslint "{src,apps,libs,test}/**/*.ts" --fix
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 3/13 completadas | 9 pendientes

  Próxima feature:
  [#5] odc-purchase-approval (P1)
```

Coincide exactamente con el reporte del implementer (256/256 tests, build y lint verdes) — cero regresiones, verificado de forma independiente.
