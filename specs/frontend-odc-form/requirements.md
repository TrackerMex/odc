---
feature: "frontend-odc-form"
status: approved        # draft | approved
tags: [frontend, odc, spec]
---

# Requisitos — [[frontend-odc-form]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas generales del proyecto.
>
> Fuente funcional: brief **F10 `frontend-odc-form`** de
> `plans/001-odc-purchase-system.md`, el contrato HTTP ya implementado por
> `odc-create-draft` y `odc-suppliers-catalog`, y la sesión autenticada de
> `frontend-foundation`. La feature se limita al flujo del usuario
> `DIRECTOR_OPS`; los dashboards de `ADMINISTRACION` y `DIRECTOR_GENERAL` son
> features posteriores.

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `DIRECTOR_OPS` entra a la ruta
  principal protegida THE SYSTEM SHALL mostrar un dashboard con cuatro bloques
  visibles: `Borradores` (`BORRADOR`), `Rechazadas` (`RECHAZADA`), `Listas para
  comprar` (`COMPRA_APROBADA`) y `Pendientes de factura`
  (`EVIDENCIA_PAGO_SUBIDA`). Cada bloque SHALL mostrar el total devuelto por
  `GET /api/odcs?status=<status>&page=1` y una lista de sus ODCs; cada ODC
  SHALL enlazar a su vista de detalle.

- **R2**: WHEN el usuario abre la acción de crear una ODC THE SYSTEM SHALL
  renderizar una ruta de formulario con los campos obligatorios `description`,
  `quantity`, `unit`, `unitPrice` y `supplier`, más el campo opcional
  `comments`. El formulario SHALL mostrar también el usuario autenticado y
  valores informativos para número y fecha: antes de guardar el número SHALL
  indicar que será asignado por el servidor y la fecha SHALL representar la
  fecha de creación; después de guardar SHALL mostrar los valores reales
  devueltos por la API.

- **R3**: WHEN se carga el formulario THE SYSTEM SHALL obtener los proveedores
  mediante `GET /api/suppliers` y ofrecerlos en un control de selección como
  nombres del catálogo, ordenados alfabéticamente. El formulario SHALL enviar
  el `name` seleccionado como `supplier`, no el id ni texto libre.

- **R4**: WHEN el usuario escribe una cantidad y un precio unitario válidos THE
  SYSTEM SHALL calcular y mostrar inmediatamente el total como
  `quantity × unitPrice` en MXN con dos decimales. El campo de precio de la UI
  SHALL aceptar pesos con hasta dos decimales y el payload SHALL convertirlo a
  `unitPriceCents` entero; el formulario nunca SHALL enviar `totalCents`.

- **R5**: WHEN el usuario pulsa `Guardar como Borrador` con datos válidos THE
  SYSTEM SHALL enviar `POST /api/odcs` con los campos T1 y convertir el precio a
  centavos, SHALL mantener `comments` opcional y SHALL navegar al detalle de la
  ODC creada mostrando el número, estado `BORRADOR` y total devueltos por la
  API.

- **R6**: WHEN el usuario pulsa `Enviar a Administración` con datos válidos
  THE SYSTEM SHALL crear la ODC con `POST /api/odcs` y, usando el id devuelto,
  ejecutar `POST /api/odcs/:id/submit`; si ambas respuestas son exitosas SHALL
  navegar al detalle mostrando estado `PENDIENTE_ADMIN`. Mientras la operación
  está en curso SHALL impedir envíos duplicados.

- **R7**: WHEN el usuario autenticado abre el enlace de una ODC THE SYSTEM
  SHALL obtener `GET /api/odcs/:id` y mostrar sus datos principales (número,
  estado, descripción, cantidad, unidad, precio unitario, proveedor, total,
  comentarios y fechas disponibles) junto con su historial de estados en orden
  cronológico, incluyendo fecha, transición y motivo cuando exista.

- **R8**: WHILE una ODC está en estado `RECHAZADA` y pertenece al usuario
  `DIRECTOR_OPS` THE SYSTEM SHALL mostrar el motivo de rechazo y permitir editar
  los campos T1 mediante el mismo formulario, precargado con los valores de la
  ODC. El guardado SHALL usar `PATCH /api/odcs/:id` y SHALL conservar el estado
  `RECHAZADA` hasta que el usuario la reenvíe.

- **R9**: WHEN el usuario guarda cambios de una ODC `RECHAZADA` usando la
  acción `Enviar a Administración` THE SYSTEM SHALL ejecutar el `PATCH` y
  después `POST /api/odcs/:id/submit`; si ambas respuestas son exitosas SHALL
  mostrar la ODC en estado `PENDIENTE_ADMIN` y retirar el formulario de edición.

- **R10**: IF una llamada de esta feature responde con error de validación,
  permisos, estado o red THEN THE SYSTEM SHALL mostrar un mensaje de error en
  español, asociado a la operación que falló, SHALL conservar los valores
  introducidos en el formulario y SHALL permitir reintentar sin recargar la
  página. Un fallo del `PATCH` SHALL impedir el `submit`; un fallo del `submit`
  SHALL dejar visible la ODC creada/editada y el error correspondiente.

- **R11**: WHILE el dashboard, el formulario o el detalle esperan una respuesta
  de la API THE SYSTEM SHALL mostrar un estado de carga y deshabilitar las
  acciones que no pueden ejecutarse todavía; los controles de formulario SHALL
  tener etiquetas visibles y los mensajes de validación SHALL ser anunciados
  como errores para lectores de pantalla.

- **R12**: WHEN el usuario visualiza cualquiera de las rutas de esta feature en
  una ventana estrecha THE SYSTEM SHALL conservar acceso a las cuatro listas,
  al formulario y a sus acciones mediante un layout responsive sin scroll
  horizontal involuntario; los textos de interfaz SHALL estar en español y los
  identificadores de código/API SHALL permanecer en inglés.

## Fuera de alcance

- Acciones de aprobación, rechazo administrativo, registro de pago, subida de
  comprobante o subida de factura; pertenecen a `frontend-admin-flows` y
  `frontend-payment-invoice`.
- Cambios en el backend, en el modelo de datos o en las reglas de autorización.
- CRUD de proveedores; el frontend solo consume `GET /api/suppliers`.
- ODCs multi-línea, exportes, notificaciones y edición de usuarios.
- Persistencia de formularios sin guardar en `localStorage` o zustand.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-22) ← gate obligatorio antes de implementar
