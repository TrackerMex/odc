# review: odc-suppliers-catalog
Fecha: 2026-07-21
Veredicto: RECHAZADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`feature_list.json`: id 14 `odc-suppliers-catalog` es la única `in_progress`; ni el implementer ni yo la marcamos `done`)
- [x] `progress/current.md` refleja la sesión activa (reviewer: pendiente)

## Checklist C3 — Arquitectura
- [x] `domain/entities/supplier.entity.ts` es clase pura, sin imports de framework/ORM
- [x] `domain/repositories/supplier.repository.ts` es interface pura (`findAll`, `findByName`, `create`)
- [x] `application` (seed/list use-cases, create-draft/update-draft) depende de `SupplierRepository` vía `import type`, nunca de `SupplierTypeOrmRepository`
- [x] `infrastructure` implementa la interface (`supplier.typeorm.repository.ts`), sin lógica de negocio filtrada al controller
- [x] `UnknownSupplierError` vive en `odc/domain/errors/`, consistente con el patrón ya usado por `OdcNotFoundError`/`OdcAccessDeniedError` (design.md aprobado)

## Checklist C4 — TDD
- [x] Cada R1..R5 tiene al menos un test que lo nombra explícitamente (`describe('R1: ...')` ... `describe('R5: ...')`), verificado con grep directo sobre los archivos, no solo sobre el reporte del implementer
- [x] Commits por requisito, uno por uno (78ee7b0 R1, 1fa5727 R2, faf1cda R3, 5a70597 R4, 743bc9c R5), consistente con test-primero por requisito

## Checklist C5 — Trazabilidad
- [x] `traceability.md` sin ninguna fila "pendiente" — las 5 filas (R1..R5) tienen test y commit
- [x] Commits siguen `feat(<scope>): <desc> (R<n>)`

## Checklist C6 — Spec aprobada
- [ ] **FALLA.** `specs/odc-suppliers-catalog/requirements.md` tiene `status: draft` en el frontmatter (línea 3), no `approved`. Mismo problema en `design.md` y `tasks.md`. Compárese con toda feature `done` existente (ej. `odc-invoice-completion/requirements.md:3` → `status: approved`).
- [ ] **FALLA.** La casilla de aprobación dice `- [X] Aprobado por humano (fecha: ____)` — el campo fecha nunca se rellenó, sigue siendo el placeholder literal `____` de la plantilla. Toda otra feature cerrada tiene una fecha real (ej. `odc-invoice-completion`: `fecha: 2026-07-21`; `odc-payment-evidence`: commit "add spec, approved by human" con fecha real).
- [ ] **Evidencia de que el gate humano no ocurrió antes de implementar**: revisé el historial git de `specs/odc-suppliers-catalog/`. Hay un único commit, `455efe9` ("docs(odc-suppliers-catalog): add spec docs and mark R1-R5 in traceability"), a las 14:41. Los 5 commits de implementación (R1..R5) están TODOS antes, entre 14:31 y 14:40. Es decir, `requirements.md`/`design.md`/`tasks.md`/`traceability.md` no existían en el repo (ni el checkbox marcado) hasta después de que la feature completa ya estaba codeada. No hay ningún commit previo tipo "add spec, pending human approval" ni "mark spec approved by human" — el patrón que sí sigue cada feature anterior (ej. `odc-budget-validation`: `d3aef28` "add spec, approved by human" a las 09:19, y solo después arrancan los commits de implementación a las 09:24 en adelante; `odc-purchase-approval` incluso tiene el ciclo completo `pending` → `approved` → implementación en commits separados).
- Conclusión: no hay evidencia verificable de que un humano haya aprobado esta spec antes de que se implementara. El checkbox `[X]` existe únicamente porque llegó ya marcado en el mismo commit que cierra la traceability — coincide con el riesgo ya conocido de que el checkbox de aprobación no es confiable y debe verificarse manualmente, no darse por bueno.

## Verificaciones independientes (no basadas en el reporte del implementer)

- `./init.sh`: **verde**. Build backend+frontend OK, 51 suites / 436 tests backend OK, lint OK.
- Lista de 22 proveedores en `seed-suppliers.usecase.ts`: **coincide exactamente**, nombre por nombre y en el mismo orden, con la lista de `requirements.md` (Ruptela, Suntech, Sirium, Syscom, RBI Topfly, ISD Telematics, Tecnosinergia, Tech Innovation, Teltonika, BSJ, VAES, Escort, Omnicomm, Cantrack, Fireflux, Electrica Saavedra, Cohesa, Georgina Masso, Mario Ramirez, Steren, Ferreshop, Ontracking GPS Remote). Sin recortes ni typos.
- `GET /api/suppliers` (`supplier.controller.ts`): **confirmado sin `@Roles`**, comentario explícito "No @Roles: the 3 roles need the catalog...".
- Rechazo de supplier inexistente con 400: **confirmado leyendo los tests**, no solo el reporte:
  - `create-draft.usecase.spec.ts::R5` — `findByName` devuelve `null` → `rejects.toBeInstanceOf(UnknownSupplierError)` y `repository.create` **no** se llama.
  - `update-draft.usecase.spec.ts::R5` — mismo patrón para `update`; además test explícito de que un PATCH sin `supplier` no dispara la validación.
  - `odc.controller.spec.ts::R5` (dos describe, POST y PATCH) — `UnknownSupplierError` mockeado en el use-case, se asserta `rejects.toBeInstanceOf(BadRequestException)`.
  - `odc.controller.ts::rethrowDomainError` — rama real `error instanceof UnknownSupplierError → throw new BadRequestException(...)`.
- `purchase_orders.supplier`: **sin cambios**, sigue `supplier: string` en `purchase-order.orm-entity.ts:40`. Sin migración a FK, consistente con la decisión central de `design.md` aprobado.
- `feature_list.json`: id 14 sigue `"status": "in_progress"` — nadie la marcó `done` (correcto, eso corresponde al leader tras esta revisión).

## Observaciones

El único motivo de rechazo es el gate de aprobación humana (C6). La
implementación en sí (R1–R5) es correcta, completa, sigue Clean Architecture,
tiene TDD real por requisito y no se desvió de ninguna decisión de
`design.md`. Pero el proceso SDD de este repo es explícito: "Sin esa marca
[aprobación humana], ningún agente puede pasar la feature a `in_progress`"
(`docs/specs.md`). Aquí no hay evidencia verificable de que esa aprobación
haya ocurrido antes de codear — el checkbox llegó pre-marcado en el mismo
commit final, con la fecha sin rellenar y el frontmatter sin actualizar a
`approved`. Esto es exactamente el riesgo ya conocido de que el checkbox de
`spec_author` no es confiable.

**Acción para corregir**: obtener aprobación humana real y verificable sobre
`specs/odc-suppliers-catalog/requirements.md` (fecha real en el checkbox,
`status: approved` en el frontmatter de `requirements.md`/`design.md`/`tasks.md`),
dejando constancia en un commit de spec separado antes de re-presentar la
feature a revisión. No se requiere ningún cambio de código.

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
⚠️  Feature en progreso: odc-suppliers-catalog

→ Build...
✅ Build exitoso

→ Ejecutando tests...
Test Suites: 51 passed, 51 total
Tests:       436 passed, 436 total
✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 8/14 completadas | 5 pendientes

  Próxima feature:
  [#9] frontend-foundation (P1)
```
