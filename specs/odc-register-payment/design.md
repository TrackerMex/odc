---
feature: "odc-register-payment"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-register-payment]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del
> proyecto. Este diseño aplica además los lineamientos de la skill
> `nestjs-best-practices` (`security-use-guards`, `arch-single-responsibility`,
> `di-use-interfaces-tokens`) ya adoptados por el módulo `odc` en las
> features 3, 4 y 5 — esta feature los mantiene, no los cambia.

## Decisiones técnicas

- **Sin cambios en domain/ ni en infrastructure/entities|repositories**
  (R1, R2, R3): la máquina de estados completa (T1–T10) y la persistencia de
  `purchase_orders`/`odc_status_history` ya viven, probadas y aprobadas, en
  `odc-create-draft`. Esta feature solo añade un DTO
  (`RegisterPaymentDto`), un use-case (`RegisterPaymentUseCase`) y su wiring
  HTTP.
- **`RegisterPaymentDto` con doble validación de fecha y de campo obligatorio**
  (R1): `paymentDate` usa `@IsDateString()` + `@IsNotEmpty()` (formato ISO,
  igual convención que se adoptará para `invoiceDate`/`warehouseEntryDate` en
  la feature 8); `paymentMethod` es texto libre (`Transferencia`, `Efectivo`,
  `Tarjeta`, etc., según el plan maestro) validado solo con `@IsString`
  `@IsNotEmpty`, sin un enum cerrado — el plan maestro no fija una lista
  cerrada de métodos de pago. `paymentReference` y `paymentNotes` son
  `@IsOptional` `@IsString`. Vive en `application/dto/`, sin imports de
  infrastructure, siguiendo el patrón de `RejectOdcDto`.
- **`RegisterPaymentUseCase` como use-case de responsabilidad única** (R2,
  R3), copia estructural de `RejectOdcUseCase` (que sí recibe datos de
  transición) y de `ApprovePurchaseUseCase` (que no requiere chequeo de
  creador): `findById` → lanza `OdcNotFoundError` si no existe →
  `order.transition('register_payment', actor.role, data)` → construye
  `OdcStatusHistoryEntry` con el `TransitionRecord` devuelto →
  `repository.update(order, entry)`. Aplica `arch-single-responsibility`
  (skill `nestjs-best-practices`): un use-case, una transición. Inyecta el
  repositorio por el mismo token string `'PurchaseOrderRepository'` ya
  registrado en `odc.module.ts` (`di-use-interfaces-tokens`), sin tokens
  nuevos. El `data: TransitionData` que recibe se construye en el controller
  a partir del DTO (`paymentDate`, `paymentMethod`, `paymentReference`,
  `paymentNotes`) — el use-case no conoce la forma HTTP del request.
- **Sin chequeo de creador** (R2): igual que T3/T5, T7 lo ejecuta cualquier
  usuario con rol `DIRECTOR_OPS` sobre cualquier ODC visible en
  `COMPRA_APROBADA` — no hay comparación de `createdById`. La tabla T1–T10 del
  plan maestro solo anota "(solo el creador)" para T2 y T10; T7 no lleva esa
  anotación.
- **Reutilización total del manejo de errores existente** (R1, R2, R3): el
  controller reutiliza `actorFrom()` y `rethrowDomainError()`, ya definidos en
  `odc.controller.ts`, que traducen `InvalidRoleTransitionError`→403,
  `InvalidStatusTransitionError`→409, `MissingTransitionDataError`→400 y
  `OdcNotFoundError`→404. No se crea ningún error de dominio nuevo. El 400 de
  R1 se produce en dos capas independientes: el `ValidationPipe` global
  (DTO inválido, nunca llega al use-case) y, como red de seguridad ya
  existente del dominio, `MissingTransitionDataError` si algún día un caller
  interno invocara el use-case saltándose el DTO.
- **Ruta `POST /api/odcs/:id/payment` para T7** (R2, R3): nombre fijado
  literalmente por la superficie API de `plans/001-odc-purchase-system.md`
  (no `register-payment`, a diferencia del nombre del use-case).
  `@Roles('DIRECTOR_OPS')` + `@HttpCode(200)`, mismo patrón declarativo que
  `approve-budget`/`approve-purchase`/`reject`
  (`security-use-guards`: autorización vía guard + decorator, nunca checks
  manuales en el handler).

## Archivos afectados

- `backend/src/modules/odc/application/dto/register-payment.dto.ts` (nuevo) —
  `paymentDate`, `paymentMethod` obligatorios, `paymentReference`,
  `paymentNotes` opcionales, validados con `class-validator` (R1). Capa
  application.
- `backend/src/modules/odc/application/use-cases/register-payment.usecase.ts`
  (nuevo) — T7: `findById`, `order.transition('register_payment',
  actor.role, data)`, historial, `repository.update` (R2, R3). Capa
  application.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`
  (modificado) — añade `POST :id/payment` (`@HttpCode(200)` +
  `@Roles('DIRECTOR_OPS')`, body `RegisterPaymentDto`) inyectando
  `RegisterPaymentUseCase` (R1, R2, R3). Capa infrastructure.
- `backend/src/modules/odc/odc.module.ts` (modificado) — registra
  `RegisterPaymentUseCase` como provider, inyectándolo en `OdcController`;
  reutiliza el token `'PurchaseOrderRepository'` ya existente, sin tokens
  nuevos.

Sin cambios: `domain/entities/purchase-order.entity.ts`,
`domain/entities/odc-status-history-entry.entity.ts`, `domain/errors/*`,
`domain/repositories/purchase-order.repository.ts`,
`infrastructure/entities/*`, `infrastructure/repositories/*`,
`infrastructure/mappers/*`, `auth/infrastructure/decorators/roles.decorator.ts`,
`auth/infrastructure/guards/roles.guard.ts` — todos ya completos y aprobados
en `odc-create-draft`, o ya genéricos respecto a esta transición.

## Alternativas descartadas

- **Nombrar la ruta `POST /api/odcs/:id/register-payment`** (para que
  coincida con el nombre del use-case y de la acción de dominio): descartada
  — la superficie API del plan maestro fija literalmente
  `POST /api/odcs/:id/payment`; renombrar la ruta contradiría esa
  especificación ya acordada con el humano.
- **Chequeo de `createdById` en `RegisterPaymentUseCase`** (tratar T7 como T2/
  T10): descartada — la tabla T1–T10 del plan maestro no anota "(solo el
  creador)" para T7, a diferencia de T2 y T10; añadir el chequeo introduciría
  una restricción de negocio no pedida.
- **Enum cerrado de `paymentMethod`** (`Transferencia | Efectivo | Tarjeta`):
  descartada — el plan maestro describe el campo como "string libre
  (Transferencia/Efectivo/Tarjeta…)", con "…" indicando que la lista no es
  cerrada; un enum limitaría valores válidos de negocio sin que el plan lo
  pida.
- **Repetir el chequeo de rol/estado/datos requeridos en
  `RegisterPaymentUseCase` antes de llamar a `transition`**: descartada —
  duplicaría la máquina de estados fuera del dominio, violando la regla ya
  establecida en `odc-create-draft` ("ninguna regla de transición se duplica
  fuera del dominio").
- **Fusionar T7 en la ruta `POST /api/odcs/:id/approve-purchase`** (inferir la
  acción según el estado actual de la ODC): descartada — la superficie API
  del plan maestro fija rutas separadas con semánticas de negocio distintas
  (aprobación de compra vs. registro de pago); un endpoint combinado ocultaría
  esa distinción y complicaría el `@Roles` estático del handler.
