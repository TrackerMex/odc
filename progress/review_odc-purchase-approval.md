# review: odc-purchase-approval
Fecha: 2026-07-20
Veredicto: APROBADO

## Revisión 2 — contexto

La **Revisión 1** (mismo día) RECHAZÓ esta feature porque el implementer
sobrescribió/reemplazó (no añadió) 2 describe blocks de test en
`odc.controller.spec.ts` — `R4: POST /api/odcs/:id/reject rejects an ODC
with 200 restricted to ADMINISTRACION` y `R5: reject responds 404 for an
unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO
for ADMINISTRACION` — que pertenecían a la feature 4 `odc-budget-validation`
(ya `done` y aprobada), dejando `specs/odc-budget-validation/traceability.md`
apuntando a tests inexistentes. No había regresión de comportamiento ni de
cobertura, era un problema de integridad de trazabilidad de una feature ya
cerrada.

El commit `c5632ba` (`fix(odc): restore R4/R5 controller tests overwritten
from odc-budget-validation`) restauró ambos describe blocks verbatim desde
`8234e86` (último commit de la feature 4 antes de la regresión), y cambió
una única aserción dentro del R4 restaurado (`ROLES_KEY` del handler
`reject`, de `['ADMINISTRACION']` a `['ADMINISTRACION', 'DIRECTOR_GENERAL']`)
con un comentario explicando que R3 de esta misma feature 5 amplió
legítimamente esa metadata después de que el test original se escribiera.

Esta Revisión 2 repite el checklist C1–C6 completo desde cero, sin asumir
nada de la Revisión 1 salvo como contexto, y ejecuta `./init.sh` de forma
independiente.

## Verificación 1 — describe blocks restaurados

Confirmado en `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts`:
- Línea 440: `describe('R4: POST /api/odcs/:id/reject rejects an ODC with 200 restricted to ADMINISTRACION', ...)` — existe, texto exacto idéntico al referenciado en `specs/odc-budget-validation/traceability.md` línea 14.
- Línea 499: `describe('R5: reject responds 404 for an unknown id, 409 without a rejection rule and 403 on PRESUPUESTO_APROBADO for ADMINISTRACION', ...)` — existe, texto exacto idéntico al referenciado en `specs/odc-budget-validation/traceability.md` línea 15.
- `git show c5632ba` confirma que el diff es puramente aditivo (`117 insertions(+)`, cero líneas eliminadas) sobre el estado post-regresión, y comparado línea por línea con `git show 8234e86:.../odc.controller.spec.ts` el contenido restaurado es idéntico salvo la aserción `ROLES_KEY` señalada abajo.
- Los describes nuevos de esta feature (`odc-purchase-approval`) para R4/R5/R6 quedan en líneas 644, 676 y 721 con textos distintos (`R4: POST /api/odcs/:id/reject accepts DIRECTOR_GENERAL on PRESUPUESTO_APROBADO (T6) with 200`, etc.), coexistiendo con los de la feature 4 sin colisión de contenido — cada string completo es único y coincide exactamente con `specs/odc-purchase-approval/traceability.md`.

**Trazabilidad de la feature 4 queda reparada.**

## Verificación 2 — aceptabilidad del cambio de aserción ROLES_KEY

El cambio es funcionalmente correcto y necesario: el handler `reject` real
declara hoy `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` (ampliado
legítimamente por R3 de esta misma feature, ya revisado). Si el test
restaurado hubiera mantenido la aserción original `toEqual(['ADMINISTRACION'])`
literal, habría fallado contra el código actual — no se puede restaurar el
test "verbatim" a nivel de comportamiento sin romperlo.

Sin embargo, señalo una **inconsistencia cosmética no bloqueante**: el
*título* del describe (`R4: POST /api/odcs/:id/reject rejects an ODC with
200 restricted to ADMINISTRACION`) y el nombre del primer `it`
(`"exposes the handler as POST on ':id/reject' with HTTP 200 restricted to
ADMINISTRACION"`) siguen diciendo textualmente "restricted to ADMINISTRACION",
mientras el cuerpo del test ahora comprueba que el handler acepta **dos**
roles. Alguien que lea solo el nombre del test (o un `grep` sobre
`describe(` / `it(`) se lleva una idea equivocada de lo que el código hace
hoy. El comentario inline (`// ROLES_KEY updated to [...]: R3 of
odc-purchase-approval ... widened this handler's roles after this test was
originally written`) mitiga la confusión para quien lee el archivo completo,
pero no para quien solo ve el nombre del test en un reporte de CI o en
`--listTests`.

No se puede resolver esto sin volver a tocar la evidencia de trazabilidad
de la feature 4 (cambiar el título rompería el string exacto referenciado en
`specs/odc-budget-validation/traceability.md`), así que el implementer optó
correctamente por preservar el título y anotar el porqué en un comentario.
Es la solución de menor daño disponible, y no es bloqueante — pero
recomiendo que si en el futuro `odc-budget-validation` necesitara una
revisión de trazabilidad propia, se documente ahí este matiz (el título R4
de esa feature ya no describe fielmente el alcance de roles del endpoint,
aunque el escenario T4 que prueba sigue vigente).

## Verificación 3 — R6 de esta feature (403 vs 409)

Repetido el trazado, mismo resultado que en la Revisión 1:
- `PurchaseOrder.transition()` en `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` resuelve la regla aplicable **por estado** (`rule.from === this.status`), no por rol.
- `DIRECTOR_GENERAL` sobre `PENDIENTE_ADMIN` → matchea T4 (`role: ADMINISTRACION`) → `rule.role !== role` → `InvalidRoleTransitionError` → 403 (no 409).
- `ADMINISTRACION` sobre `PRESUPUESTO_APROBADO` → matchea T6 (`role: DIRECTOR_GENERAL`) → `InvalidRoleTransitionError` → 403 (no 409).
- Confirmado con tests explícitos en `reject-odc.usecase.spec.ts::R6` (líneas 262-292, ambas combinaciones, assertando `InvalidRoleTransitionError` y `order.status` sin mutar) y `odc.controller.spec.ts::R6` (línea 721, ambas combinaciones, assertando `ForbiddenException`).
- `git diff --stat 9be828a..HEAD -- backend/src/modules/odc/domain backend/src/modules/odc/domain/repositories` → vacío. El dominio no cambió en ningún commit de esta feature, incluido el fix `c5632ba`.

Sigue correcto.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature `in_progress` (`feature_list.json`: id 5 `odc-purchase-approval`; 1-4 `done`, 6-13 `pending`).
- [x] `progress/current.md` describe la sesión activa de forma coherente con el estado real (`reviewer: rechazado, esperando fix` — refleja el momento previo a este veredicto; el leader/implementer debe actualizarlo tras este reporte, no corresponde a este reviewer editarlo).

## Checklist C3 — Arquitectura
- [x] domain sin imports de infrastructure — `git diff --stat 9be828a..HEAD -- backend/src/modules/odc/domain backend/src/modules/odc/domain/repositories` = vacío en todo el ciclo de vida de la feature (incluido el fix).
- [x] Los repositorios/contratos en domain son interfaces puras — no tocados.
- [x] La capa application solo depende de interfaces — `git diff --stat 8234e86..HEAD -- .../reject-odc.usecase.ts .../reject-odc.dto.ts` = vacío (siguen agnósticos de rol); `approve-purchase.usecase.ts` es nuevo, sigue el mismo patrón de `ApproveBudgetUseCase` (inyecta `PurchaseOrderRepository` por token, sin lógica de rol propia).
- [x] La capa infrastructure implementa las interfaces de domain, no al revés — `git diff 9be828a..HEAD -- odc.controller.ts` muestra únicamente: nuevo handler `approvePurchase` (wiring puro) + cambio de metadata `@Roles` en `reject` + comentario actualizado. Sin lógica de negocio nueva. `git diff --stat 9be828a..HEAD -- backend/src/modules/auth` = vacío (guard sin cambios).

## Checklist C4 — TDD
- [x] Cada R<n> tiene al menos un test que lo nombra (R1-R7, verificado en código real, ver tabla de traceability abajo).
- [x] Historial de commits muestra test-primero por requisito: `92acb63` (R1,R2), `485cc78` (R3), `13d0aa6` (R4-R7), más el fix `c5632ba` (restauración, no un requisito nuevo).

## Checklist C5 — Trazabilidad (ambas features)
- [x] `specs/odc-purchase-approval/traceability.md` — 7 filas (R1-R7), ninguna "pendiente", cada referencia de test verificada verbatim en el código actual.
- [x] `specs/odc-budget-validation/traceability.md` — 5 filas (R1-R5), ninguna "pendiente"; R4 y R5 (las dañadas en la Revisión 1) ahora resuelven a describe blocks existentes con texto exacto idéntico. **Reparada.**
- [x] Commits siguen `feat(<scope>): <desc> (R-ids)`; el fix sigue `fix(odc): <desc>` (no es un requisito nuevo, es corrección de regresión — formato apropiado para el tipo de cambio).

## Checklist C6 — Spec aprobada
- [x] `specs/odc-purchase-approval/requirements.md` con `status: approved` en frontmatter.
- [x] Casilla "Aprobado por humano" marcada: `- [X] Aprobado por humano (fecha: 2026-07-20)`.
- [x] Ningún requisito modificado después de la aprobación — R3 ya especificaba `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` desde el inicio; el fix corrige una aserción de test que había quedado desalineada con ese requisito ya aprobado, no modifica el requisito mismo.

## Output de ./init.sh (ejecutado de forma independiente en esta revisión)
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
⚠️  Feature en progreso: odc-purchase-approval

→ Build...
✓ 123 modules transformed. / ✓ 106 modules transformed.
✅ Build exitoso

→ Ejecutando tests...
Test Suites: 33 passed, 33 total
Tests:       291 passed, 291 total
Snapshots:   0 total
Time:        5.713 s

> frontend test: No test files found, exiting with code 0
✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 4/13 completadas | 8 pendientes

  Próxima feature:
  [#6] odc-register-payment (P1)
```

291/291 tests (6 más que los 285 de la Revisión 1, correspondientes a los
2 describe blocks restaurados de R4/R5 de la feature 4), build y lint
verdes, verificado de forma independiente en esta segunda pasada.

## Observaciones

### No bloqueante: título del test R4 restaurado ya no describe fielmente el alcance de roles
Ver "Verificación 2" arriba. El título dice "restricted to ADMINISTRACION"
pero el código ahora acepta también `DIRECTOR_GENERAL`. Documentado con
comentario inline en el propio test; no bloquea esta revisión porque
cambiar el título rompería la trazabilidad ya reparada de la feature 4.
Queda como nota para quien audite `odc-budget-validation` en el futuro.

### Heredado de la Revisión 1 (no bloqueante, sin cambios)
Colisión de etiquetas `R<n>` entre features en los mismos archivos de test
(`odc.controller.spec.ts`, `reject-odc.usecase.spec.ts` tienen más de un
`describe('R4: ...')`, `describe('R5: ...')`, etc. pertenecientes a
features distintas). Jest los ejecuta sin problema y cada string completo
es único, pero complica el grep rápido por R-id. Sugerido para
`spec_author` en features futuras (6-8) que compartan estos archivos.

## Conclusión

El bloqueante de la Revisión 1 (trazabilidad rota de `odc-budget-validation`)
está resuelto: los 2 describe blocks fueron restaurados verbatim y la única
aserción que tuvo que cambiar (ROLES_KEY) está justificada, es funcionalmente
correcta y documentada. R6 de esta feature sigue verificado correctamente
(403 por rol, no 409 por estado, en ambas combinaciones cruzadas). Arquitectura
sin diff en domain/repositories/auth. 291/291 tests, build y lint verdes,
verificado de forma independiente. Trazabilidad de ambas features (4 y 5)
sin filas pendientes ni rotas. Spec aprobada con gate humano marcado.

**Veredicto: APROBADO.**
