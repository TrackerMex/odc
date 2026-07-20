# review: odc-create-draft
Fecha: 2026-07-20
Veredicto: APROBADO

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress (`feature_list.json`: id 3 `odc-create-draft`; el resto `done`/`pending`)
- [x] `progress/current.md` describe la sesión activa (spec_author: done, implementer: done, reviewer: en curso)

## Checklist C3 — Arquitectura
- [x] `domain/` sin imports de `@nestjs/*` ni `typeorm` (grep sobre `backend/src/modules/odc/domain` sin resultados; `purchase-order.entity.ts` y `odc-status-history-entry.entity.ts` son clases puras)
- [x] `domain/repositories/purchase-order.repository.ts` es una interface pura (`PurchaseOrderRepository`, `OdcListFilter`, `OdcViewer`, `OdcPage`), sin implementación
- [x] `application/` solo depende de interfaces del domain: los use-cases nuevos (`list-odcs.usecase.ts`, `get-odc.usecase.ts`) inyectan `PurchaseOrderRepository` por token string (`@Inject('PurchaseOrderRepository')`) e importan el tipo con `import type`; único import de framework es `@nestjs/common` (`Injectable`/`Inject`), permitido por el apéndice de `docs/architecture.md`; grep de `from 'typeorm'` en `application/` sin resultados
- [x] `infrastructure/` implementa las interfaces del domain sin filtrar lógica de negocio: `purchase-order.typeorm.repository.ts` implementa `PurchaseOrderRepository`; `buildVisibilityWhere` traduce el `OdcListFilter` que ya construyó el use-case a una condición SQL — está documentado y decidido explícitamente en `specs/odc-create-draft/design.md` ("Visibilidad de BORRADOR filtrada en la query, no en memoria", descartando el filtrado en memoria porque rompería `total`/paginación), no es una regla de negocio nueva inventada en infraestructura
- [x] Controller sin lógica de negocio: `list()`/`detail()` delegan a los use-cases; `rethrowDomainError` solo traduce errores tipados de dominio a excepciones HTTP según la tabla de `docs/conventions.md`

## Checklist C4 — TDD
- [x] Cada R1–R13 tiene al menos un test que lo nombra explícitamente (`describe('R<n>: ...')`), verificado con grep sobre los 29 `*.spec.ts` del módulo — lista completa contrastada 1:1 contra `traceability.md`
- [x] Historial de commits muestra el patrón por requisito: un commit `feat(odc): ... (R-ids)` con test+implementación seguido de un commit `docs(odc-create-draft): trace R... ` que actualiza `traceability.md`, repetido para cada requisito (`76783c1`→`0f813d3`, `77a4855`→`2027518`, `ed5c4e1`→`c9276f0`, `0a003e3`→`273b3b8`, `29d02bd`→`1bb2828`, `5db0dea`→`8948917`, `ccdb713`→`3e2e14e`, `ee2e529`→`622bf4d`, `7222ece`→`e83d97f`, `6c81de7`→`106ed32`); no hay un commit único que junte todos los requisitos

## Checklist C5 — Trazabilidad
- [x] `specs/odc-create-draft/traceability.md` existe y ninguna fila R1–R13 dice "pendiente"
- [x] Cada requisito tiene su test (archivo::nombre) y su commit registrados; verificado que los archivos y los `describe()` citados existen literalmente en el código
- [x] Commits siguen `feat(<scope>): <desc> (R1,R2)` — confirmado con `git log --oneline d25f170..HEAD`

Nota menor (no bloqueante): el frontmatter de `traceability.md` sigue en `status: draft` (heredado sin editar de `specs/_template/traceability.md`). CHECKPOINTS C6 y el proceso de reviewer solo exigen `status: approved` en `requirements.md`, que sí está correcto; este campo de `traceability.md` no tiene relevancia normativa en `docs/specs.md`. Se deja como observación cosmética para que un futuro spec_author/implementer lo alinee.

## Checklist C6 — Spec aprobada
- [x] `specs/odc-create-draft/requirements.md` con `status: approved` en el frontmatter
- [x] Casilla "Aprobado por humano" marcada con fecha (2026-07-19)
- [x] Ningún requisito muestra señales de edición post-aprobación sin regate (R1–R13 numerados de forma consecutiva y estable a través de las 13 rondas feat+docs, sin huecos ni renumeraciones)

## Observaciones adicionales

- Verificado especialmente el fix señalado por el implementer en
  `purchase-order.typeorm.repository.ts` (commit `7222ece`): el diff toca
  únicamente la firma de retorno de `buildVisibilityWhere` (tipo explícito
  `FindOptionsWhere<PurchaseOrderOrmEntity> | FindOptionsWhere<...>[]`) y
  `Not('BORRADOR')` → `Not<OdcStatus>('BORRADOR')`. Sin cambios de
  comportamiento ni de la query. Confirmado con
  `git show 7222ece -- .../purchase-order.typeorm.repository.ts`.
- DTOs (`create-odc.dto.ts`, `update-odc.dto.ts`, `list-odcs.query.dto.ts`)
  no declaran `totalCents`; `UpdateOdcDto = PartialType(CreateOdcDto)` según
  convención.
- R12/R13 (esta sesión): `list-odcs.usecase.ts` y `get-odc.usecase.ts`
  siguen el mismo patrón `findById → 404/403 → retorno` ya usado en
  `submit-odc`/`update-draft`; el helper `createController`/
  `ControllerOverrides` de `odc.controller.spec.ts` fue extendido
  correctamente a 5 argumentos sin tocar los describe blocks R7–R11.

## Output de ./init.sh (ejecutado por el reviewer, independiente del implementer)

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
⚠️  Feature en progreso: odc-create-draft

→ Build...
> backend@0.0.1 build ... nest build
> frontend@ build ... vite build
✓ 123 modules transformed (client) / ✓ 106 modules transformed (ssr)
✅ Build exitoso

→ Ejecutando tests...
> backend@0.0.1 test ... jest
Test Suites: 29 passed, 29 total
Tests:       220 passed, 220 total
Snapshots:   0 total
Time:        4.968 s
Ran all test suites.

> frontend@ test ... vitest run --passWithNoTests
No test files found, exiting with code 0
✅ Tests pasados

→ Lint...
> backend@0.0.1 lint ... eslint "{src,apps,libs,test}/**/*.ts" --fix
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 2/13 completadas | 10 pendientes
  Próxima feature: [#4] odc-budget-validation (P1)
```

Exit code 0. Sin regresiones frente al reporte del implementer (mismo conteo: 29 suites / 220 tests).
