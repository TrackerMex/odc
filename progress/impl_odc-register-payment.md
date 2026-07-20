# impl: odc-register-payment
Fecha: 2026-07-20

## Archivos creados
- `backend/src/modules/odc/application/dto/register-payment.dto.ts` — `RegisterPaymentDto`: `paymentDate` (`@IsDateString`, `@IsNotEmpty`), `paymentMethod` (`@IsString`, `@IsNotEmpty`), `paymentReference`/`paymentNotes` opcionales (`@IsOptional`, `@IsString`).
- `backend/src/modules/odc/application/dto/register-payment.dto.spec.ts` — valida payload completo, solo obligatorios, falta de cada campo obligatorio, fecha no-ISO y método vacío.
- `backend/src/modules/odc/application/use-cases/register-payment.usecase.ts` — `RegisterPaymentUseCase`: `findById` → `OdcNotFoundError` si no existe → `order.transition('register_payment', actor.role, data)` → construye `OdcStatusHistoryEntry` → `repository.update`. Copia estructural de `RejectOdcUseCase`/`ApprovePurchaseUseCase`, sin chequeo de creador (igual que T3/T5).
- `backend/src/modules/odc/application/use-cases/register-payment.usecase.spec.ts` — éxito con y sin campos opcionales, historial, rol distinto (403 vía `InvalidRoleTransitionError`), id inexistente (404 vía `OdcNotFoundError`), y los 7 estados no-`COMPRA_APROBADA` (409 vía `InvalidStatusTransitionError`, sin mutar el order).

## Archivos modificados
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` — añade `POST :id/payment` (`@HttpCode(200)`, `@Roles('DIRECTOR_OPS')`, body `RegisterPaymentDto`), inyecta `RegisterPaymentUseCase` y reutiliza `actorFrom()`/`rethrowDomainError()` existentes, sin manejo de errores nuevo.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts` — añade `registerPaymentUseCase` a `ControllerOverrides`/`createController` y dos `describe` (R2, R3) para el nuevo handler.
- `backend/src/modules/odc/odc.module.ts` — registra `RegisterPaymentUseCase` como provider (mismo token `'PurchaseOrderRepository'`, sin tokens nuevos).
- `specs/odc-register-payment/traceability.md` — R1, R2, R3 marcados como cubiertos con test y hash de commit.

Sin cambios en `domain/`, `infrastructure/entities|repositories|mappers` ni `auth/`, conforme a `design.md` (T7 ya completa en el dominio desde `odc-create-draft`).

## Requisitos cubiertos
- R1: test `register-payment.dto.spec.ts::R1: RegisterPaymentDto requires paymentDate and paymentMethod, keeps paymentReference/paymentNotes optional`, commit `807c9cb`
- R2: test `register-payment.usecase.spec.ts::R2: ...` + `odc.controller.spec.ts::R2: ...`, commit `438f301`
- R3: test `register-payment.usecase.spec.ts::R3: ...` + `odc.controller.spec.ts::R3: ...`, commit `438f301`

## Decisiones de diseño
- Ruta `POST /api/odcs/:id/payment` (no `register-payment`): nombre fijado literalmente por `design.md`/plan maestro.
- Sin chequeo de `createdById`: T7 no lo exige (a diferencia de T2/T10), igual que T3/T5.
- `note` del historial siempre `null` (T7 no usa `rejectionReason`; el dominio ya lo maneja así en `transition()`).
- R2 y R3 se implementaron en un solo ciclo rojo-verde (mismo use-case cubre éxito, 403 vía rol, 404 vía id inexistente y 409 vía estado), agrupados en un commit por estar directamente relacionados, como permite `docs/conventions.md`.
- Se hizo un `git reset --soft` local (rama no pusheada) para corregir un commit que mezcló accidentalmente el fix de lint de R1 con el código de R2/R3, y separarlo en dos commits limpios y trazables.

## Output de build
```
> backend@0.0.1 build
> nest build
(sin errores)

> frontend@ build
> vite build
✓ built in 556ms (client), ✓ built in 523ms (ssr)
```

## Output de tests
```
Backend (jest):
Test Suites: 35 passed, 35 total
Tests:       313 passed, 313 total
(291 antes de esta feature + 22 nuevos: 6 DTO + 11 use-case + 5 controller)

Frontend (vitest --passWithNoTests):
No test files found, exiting with code 0
```

Lint backend: sin errores (`eslint --fix`).

## Notas para el reviewer
- Confirmar que el use-case no duplica ninguna regla de transición (rol/estado/datos requeridos): todo delega en `order.transition(...)`.
- Confirmar que `RegisterPaymentDto` no importa nada de `infrastructure` y que el controller sigue el patrón de `reject`/`approve-purchase` sin lógica de negocio en el handler.
- `feature_list.json`, `progress/current.md` y `specs/odc-register-payment/{requirements,design,tasks}.md` seguían sin commitear al iniciar esta sesión (trabajo previo del leader/spec_author); no los toqué ni los commiteé — solo `traceability.md`, que es explícitamente responsabilidad del implementer.
