---
feature: "odc-suppliers-catalog"
status: approved        # draft | approved
tags: [harness, spec]
---

# Requisitos — [[odc-suppliers-catalog]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.
>
> Origen: pedido directo del negocio (no es un brief F-n del plan maestro
> `plans/001-odc-purchase-system.md`). Hoy `odc-create-draft` (feature 3, ya
> `done`) modela el proveedor como texto libre: `supplier: string` en
> `CreateOdcDto`/`UpdateOdcDto` y en la columna `supplier` de
> `purchase_orders` (`backend/src/modules/odc/infrastructure/entities/purchase-order.orm-entity.ts`).
> No existe ninguna tabla de proveedores en el código actual (verificado). Esta
> feature añade un catálogo fijo para que la creación de ODC deje de aceptar
> cualquier texto y solo acepte un nombre del catálogo — ver [[design]] para la
> decisión de por qué esto se resuelve con validación aplicativa y no con una
> migración a `supplierId` FK.

## Catálogo de proveedores a semillar

Lista provista tal cual por el negocio, sin recortar ni inventar nombres:

Ruptela, Suntech, Sirium, Syscom, RBI Topfly, ISD Telematics, Tecnosinergia,
Tech Innovation, Teltonika, BSJ, VAES, Escort, Omnicomm, Cantrack, Fireflux,
Electrica Saavedra, Cohesa, Georgina Masso, Mario Ramirez, Steren, Ferreshop,
Ontracking GPS Remote.

> **Nota para quien apruebe**: el pedido original habla de "21 proveedores",
> pero la lista tal como fue dictada contiene **22** nombres distintos (se
> cuentan uno por uno arriba). Se usa la lista completa de 22 sin recortar,
> tal como indica la instrucción de no inventar ni recortar — si el número
> correcto era 21 y sobra o falta un nombre, es una corrección que debe venir
> del negocio, no una decisión de esta spec.

## Requisitos funcionales

- **R1**: WHEN la capa de dominio del nuevo módulo `suppliers` modela un
  proveedor THE SYSTEM SHALL representarlo con una clase pura `Supplier` con
  las propiedades `id` (`string | null`), `name` (`string`) y `createdAt`
  (`Date | null`), sin imports de NestJS, TypeORM ni ninguna librería de
  infraestructura.
  *Verificación*: test unitario que construye la entidad y asserta sus
  propiedades; chequeo estructural de que el archivo de la entidad no importa
  framework/ORM.

- **R2**: WHEN se define la persistencia del módulo `suppliers` THE SYSTEM
  SHALL mapear una entidad ORM sobre una tabla `suppliers` (`id` UUID primary
  key, `name` UNIQUE NOT NULL, `createdAt`), implementando la interface
  `SupplierRepository` (declarada en `domain/repositories`, con al menos
  `findAll(): Promise<Supplier[]>`, `findByName(name): Promise<Supplier |
  null>` y `create(supplier): Promise<Supplier>`) con su implementación
  TypeORM registrada por token string `'SupplierRepository'` en
  `suppliers.module.ts`.
  *Verificación*: test unitario que inspecciona los metadatos de TypeORM de
  la entidad ORM (tabla, unicidad de `name`) sin abrir conexión; test del
  repositorio TypeORM con el manager mockeado para `findAll`, `findByName` y
  `create`; test del module que asserta el token de inyección.

- **R3**: WHEN se ejecuta el seed del módulo `suppliers` (mismo mecanismo que
  `SeedUsersUseCase`, invocado desde `backend/src/seed.ts` vía
  `npm run seed`) THE SYSTEM SHALL crear en la tabla `suppliers` una fila por
  cada nombre de la lista de la sección "Catálogo de proveedores a semillar"
  que todavía no exista (comparación exacta por `name`), sin duplicar los que
  ya existen; IF el seed se ejecuta más de una vez THEN THE SYSTEM SHALL
  dejar exactamente una fila por nombre (idempotencia).
  *Verificación*: test del use-case de seed con repositorio mockeado: primera
  ejecución crea una fila por cada uno de los nombres exactos de la lista (se
  asserta la lista completa, incluyendo casos con espacio como "RBI Topfly" o
  "Georgina Masso"); segunda ejecución con esos nombres ya existentes no
  vuelve a crear ninguno (`skipped` cubre todos).

- **R4**: WHEN un usuario autenticado de cualquiera de los 3 roles hace
  `GET /api/suppliers` THE SYSTEM SHALL responder HTTP 200 con la lista
  completa de proveedores del catálogo (`id`, `name`), ordenada
  alfabéticamente por `name`, sin paginar.
  *Verificación*: test del use-case de listado con repositorio mockeado
  assertando el orden alfabético; test del controller assertando la ruta, el
  status 200 y que no hay `@Roles` restringiendo por rol (a diferencia de
  `POST /api/odcs`, que sí exige `DIRECTOR_OPS`).

- **R5**: WHEN `POST /api/odcs` o `PATCH /api/odcs/:id` recibe un `supplier`
  cuyo valor coincide exactamente (comparación sensible a mayúsculas) con el
  `name` de un proveedor existente en la tabla `suppliers` THE SYSTEM SHALL
  continuar el flujo de creación/edición sin cambios de comportamiento
  respecto a `odc-create-draft` (R2, R7, R11 de esa spec siguen cumpliéndose
  igual); IF el valor de `supplier` no coincide con ningún nombre del
  catálogo THEN THE SYSTEM SHALL responder HTTP 400 sin crear ni modificar la
  ODC.
  *Verificación*: tests de `CreateDraftUseCase` y `UpdateDraftUseCase` con
  `SupplierRepository` mockeado — un `supplier` existente en el catálogo deja
  pasar la creación/edición igual que antes; un `supplier` que no matchea
  ningún nombre lanza el nuevo error de dominio sin llamar a `create`/`update`
  del `PurchaseOrderRepository`; test del controller assertando el 400 en
  `POST /api/odcs` y `PATCH /api/odcs/:id`.

## Fuera de alcance

- CRUD de proveedores desde UI o API (`POST`/`PATCH`/`DELETE /api/suppliers`):
  el catálogo se puebla solo por seed (R3); añadir/editar/desactivar
  proveedores no está pedido y queda fuera de esta feature.
- Campo `active`/soft-delete en `suppliers`: no hay forma de desactivar un
  proveedor en esta feature (ver [[design]], alternativas descartadas); si en
  el futuro se necesita, es una feature nueva.
- Migración de `purchase_orders.supplier` (o de `CreateOdcDto`/`UpdateOdcDto`)
  a una columna `supplierId` con FK real: esta feature valida contra el
  catálogo pero **no** cambia el tipo de dato ni el nombre del campo
  existente (ver [[design]] para la justificación y la alternativa
  descartada).
- Metadata adicional de proveedor (contacto, dirección, RFC/tax id, etc.):
  el catálogo solo guarda `name`.
- Cualquier UI de selección/dropdown en el frontend: esta spec entrega el
  endpoint de backend (R4); el consumo desde un formulario es
  `frontend-odc-form` (feature 10, `pending`).
- Tests e2e contra PostgreSQL real (opcionales, `backend/test/`, fuera de
  `TEST_CMD`).

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-21) ← gate obligatorio antes de implementar

> **Confirmación explícita (2026-07-21)**: este checkbox había sido marcado
> en el mismo commit que cerraba la implementación (`28985af`), sin evidencia
> verificable previa — motivo de rechazo C6 en
> `progress/review_odc-suppliers-catalog.md`. El humano confirma ahora,
> explícitamente y en este commit dedicado, que revisó y aprueba el contenido
> de esta spec (catálogo de 22 proveedores, R1-R5, alcance y fuera de
> alcance). Esta nota deja constancia verificable de esa aprobación para que
> el reviewer pueda re-evaluar C6.
