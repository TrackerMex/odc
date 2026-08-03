# impl: odc-approval-self-check (extensión R4)
Fecha: 2026-08-02

## Archivos creados
- (ninguno)

## Archivos modificados
- `backend/src/modules/odc/application/use-cases/reject-odc.usecase.ts` — se
  añade el chequeo `if (order.createdById === actor.userId) throw new
  OdcAccessDeniedError('The creator cannot reject their own ODC')`, insertado
  después del null-check de `OdcNotFoundError` y antes de
  `order.transition('reject', actor.role, data)`. Cubre T4 y T6 (mismo
  use-case, misma acción de dominio `reject`). Import de `OdcAccessDeniedError`
  agregado (no existía antes en este archivo). Comentario de cabecera
  actualizado para documentar la regla, igual estilo que
  approve-budget/approve-purchase.
- `backend/src/modules/odc/application/use-cases/reject-odc.usecase.spec.ts` —
  nuevo describe `R4: reject rejects self-action by the ODC creator
  (odc-approval-self-check)` con 2 tests: T4 (ADMINISTRACION,
  PENDIENTE_ADMIN) y T6 (DIRECTOR_GENERAL, PRESUPUESTO_APROBADO), ambos con
  `actor.userId === order.createdById`, assertando `OdcAccessDeniedError`,
  `order.status` sin cambiar y `repository.update` no invocado. Los tests de
  regresión de éxito para T4 (describe `R4: reject transitions
  PENDIENTE_ADMIN...`) y T6 (describe `R4: reject transitions
  PRESUPUESTO_APROBADO...RECHAZADA for DIRECTOR_GENERAL (T6)`) ya existían con
  `actor.userId` distinto a `createdById` — se re-ejecutaron sin cambios y
  siguen en verde.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts` —
  nuevo describe `R4: reject translates self-action OdcAccessDeniedError into
  403 (odc-approval-self-check)` con 1 test: mockea `RejectOdcUseCase` para
  lanzar `OdcAccessDeniedError` y asserta que `controller.reject(...)`
  rechaza con `ForbiddenException`. Sin ningún cambio en `odc.controller.ts`
  de producción (confirmado — no aparece en el diff de ningún commit).
- `specs/odc-approval-self-check/traceability.md` — fila R4 completada.

## Requisitos cubiertos
- R4: test `reject-odc.usecase.spec.ts::R4: reject rejects self-action by the
  ODC creator (odc-approval-self-check)` (más el test de controller
  equivalente citado arriba), commits:
  - `310f1eb` test(odc-approval-self-check): specify reject-odc rejects
    self-action (R4)
  - `f395272` feat(odc-approval-self-check): reject reject-odc self-action
    (R4)
  - `eb5c780` docs(odc-approval-self-check): trace R4 to tests and commits

## Decisiones de diseño
- Ninguna decisión nueva — se replicó literalmente el patrón ya aprobado en
  `design.md` (sección "Extensión R4") y ya usado en
  `approve-budget.usecase.ts`/`approve-purchase.usecase.ts`. Un único chequeo
  en `RejectOdcUseCase` cubre T4 y T6 porque ambas transiciones comparten el
  mismo use-case y la misma acción de dominio `reject`.

## Output de build
```
Backend: nest build → sin errores
Frontend: vite build (client + ssr) → sin errores
✅ Build exitoso
```

## Output de tests
```
Backend (jest): Test Suites: 59 passed, 59 total | Tests: 471 passed, 471 total
Frontend (vitest): Test Files 32 passed (32) | Tests 214 passed (214)
✅ Tests pasados
```

## Output de lint
```
backend: eslint "{src,apps,libs,test}/**/*.ts" --fix → sin errores
✅ Lint sin errores
```

## init.sh completo
Ejecutado end-to-end (install ya estaba hecho, build+test+lint corridos por
`init.sh`): resultado final `✅ Todo verde. Listo para trabajar. Features:
22/22 completadas | 0 pendientes`. Sin regresión en R1-R3 de
odc-approval-self-check, odc-budget-validation ni odc-purchase-approval (471
tests backend en verde, incluidos los suites de approve-budget,
approve-purchase, reject-odc y odc.controller).

## Notas para el reviewer
- Único archivo de producción tocado: `reject-odc.usecase.ts`. No se tocó
  `approve-budget.usecase.ts`, `approve-purchase.usecase.ts`,
  `purchase-order.entity.ts`, `TRANSITIONS`, `RolesGuard`, `odc.controller.ts`
  (producción), ningún DTO ni `package.json`/lockfile — verificable con `git
  show --stat` en los 3 commits de esta rama.
- El test del controller (R4) pasaba desde antes de tocar producción, porque
  `rethrowDomainError` ya traducía `OdcAccessDeniedError` a 403 de forma
  genérica desde R3 — es la misma situación que documenta `design.md` ("R3 no
  requiere ningún cambio en el controller"). El "rojo" real de este ciclo TDD
  está en los 2 tests de `reject-odc.usecase.spec.ts`, confirmado antes de
  implementar (ver output de `pnpm test` en el historial de esta sesión).
- No se hizo push.
