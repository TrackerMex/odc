---
feature: "frontend-admin-flows"
status: approved        # draft | approved
tags: [frontend, administracion, odc, spec]
---

# Requisitos — [[frontend-admin-flows]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas generales del proyecto.
>
> Fuente funcional: brief **F11 `frontend-admin-flows`** de
> `plans/001-odc-purchase-system.md`, pasos 2 y 5 del flujo, y los contratos
> backend ya implementados por `odc-budget-validation` y
> `odc-payment-evidence`. La feature extiende la sesión, dashboard, cliente API
> y detalle entregados por `frontend-foundation` y `frontend-odc-form`; no
> modifica reglas de negocio ni endpoints backend.

## Contratos backend consumidos

| Operación | Contrato |
|---|---|
| Cola pendiente | `GET /api/odcs?status=PENDIENTE_ADMIN&page=1` |
| Cola pagada | `GET /api/odcs?status=PAGO_REGISTRADO&page=1` |
| Detalle | `GET /api/odcs/:id` |
| Aprobar presupuesto | `POST /api/odcs/:id/approve-budget` |
| Rechazar presupuesto | `POST /api/odcs/:id/reject` con `{ rejectionReason }` |
| Subir comprobante | `POST /api/odcs/:id/payment-evidence` multipart con `file` y `evidenceReference?` |

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `ADMINISTRACION` entra a la ruta
  principal protegida THE SYSTEM SHALL cargar exactamente las páginas 1 de
  `PENDIENTE_ADMIN` y `PAGO_REGISTRADO` mediante los dos filtros documentados,
  sin cargar las cuatro colas ni la acción `Nueva ODC` del dashboard de
  `DIRECTOR_OPS`.
  *Verificación*: test del loader con contexto `ADMINISTRACION` que asserta las
  dos llamadas y sus status; test de regresión con `DIRECTOR_OPS` que conserva
  sus cuatro llamadas existentes.

- **R2**: WHEN las colas de R1 terminan de cargar THE SYSTEM SHALL mostrar un
  dashboard de Administración con los bloques `Pendientes de validar`
  (`PENDIENTE_ADMIN`) y `Compras pagadas` (`PAGO_REGISTRADO`); cada bloque SHALL
  mostrar el `total` devuelto por la API, una lista de sus ODCs con número,
  descripción, proveedor e importe total, un estado vacío explícito cuando no
  haya items y un enlace por ODC hacia `/odcs/:id`.
  *Verificación*: test de render con páginas pobladas y vacías que asserta
  títulos, contadores, datos, enlaces y mensajes vacíos.

- **R3**: WHILE un usuario `ADMINISTRACION` visualiza el detalle de una ODC en
  estado `PENDIENTE_ADMIN` THE SYSTEM SHALL mostrar número, descripción,
  cantidad/unidad, proveedor, precio unitario, total, comentarios e historial,
  junto con las acciones `Aprobar presupuesto` y `Rechazar`; THE SYSTEM SHALL
  NOT mostrar el formulario de comprobante en ese estado.
  *Verificación*: test de render del detalle administrativo pendiente que
  asserta los datos y ambas acciones, y la ausencia del formulario de archivo.

- **R4**: WHEN el usuario activa `Aprobar presupuesto` sobre una ODC
  `PENDIENTE_ADMIN` THE SYSTEM SHALL ejecutar una sola petición
  `POST /api/odcs/:id/approve-budget`, deshabilitar las acciones incompatibles
  mientras está pendiente y, si responde exitosamente, actualizar el detalle
  con la ODC devuelta en estado `PRESUPUESTO_APROBADO` y retirar las acciones
  administrativas de presupuesto sin exigir una recarga de página.
  *Verificación*: test del cliente API para ruta/método; test de componente que
  simula la acción, evita doble envío y asserta el estado actualizado.

- **R5**: WHEN el usuario activa `Rechazar` sobre una ODC `PENDIENTE_ADMIN`
  THE SYSTEM SHALL abrir un diálogo accesible con un campo visible
  `Motivo del rechazo` y acciones para cancelar o confirmar; IF el motivo está
  vacío o contiene solo espacios THEN THE SYSTEM SHALL mostrar un error de
  validación, SHALL NOT invocar la API y SHALL mantener abierto el diálogo.
  *Verificación*: test con Testing Library que abre el diálogo, confirma sin
  motivo y asserta mensaje, foco/estado abierto y cero llamadas a `rejectOdc`.

- **R6**: WHEN el usuario confirma el diálogo de R5 con un motivo no vacío THE
  SYSTEM SHALL ejecutar `POST /api/odcs/:id/reject` con JSON
  `{ rejectionReason: <motivo recortado> }`, impedir confirmaciones duplicadas
  mientras está pendiente y, si responde exitosamente, cerrar el diálogo,
  actualizar el detalle con la ODC devuelta en estado `RECHAZADA`, mostrar el
  motivo y retirar las acciones administrativas sin recargar la página.
  *Verificación*: test del cliente API para ruta/método/body; test de componente
  para payload recortado, bloqueo durante envío y actualización de UI.

- **R7**: WHILE un usuario `ADMINISTRACION` visualiza una ODC en estado
  `PAGO_REGISTRADO` THE SYSTEM SHALL mostrar, además del detalle común, la fecha
  y método de pago y, cuando existan, la referencia y notas de pago; THE SYSTEM
  SHALL mostrar un formulario `Subir comprobante de pago` con archivo
  obligatorio y `Referencia del comprobante` opcional, y SHALL NOT mostrar las
  acciones de aprobación/rechazo de presupuesto.
  *Verificación*: test de render con campos opcionales presentes y ausentes que
  asserta los datos de pago, el formulario y la exclusión mutua de acciones.

- **R8**: WHEN el usuario selecciona un archivo para el comprobante THE SYSTEM
  SHALL aceptar únicamente MIME `application/pdf`, `image/jpeg` o `image/png`
  con tamaño máximo de 10 485 760 bytes; IF no hay archivo, el MIME no está
  permitido o el tamaño excede el límite THEN THE SYSTEM SHALL mostrar un error
  en español, SHALL NOT invocar la API y SHALL conservar la referencia escrita.
  *Verificación*: tests del formulario para archivo ausente, MIME inválido,
  tamaño mayor a 10 MB y un archivo válido en cada MIME permitido.

- **R9**: WHEN el formulario de R7 se confirma con un archivo válido THE
  SYSTEM SHALL enviar `POST /api/odcs/:id/payment-evidence` como `FormData` con
  la clave `file` y, solo cuando no esté vacía, la clave
  `evidenceReference` recortada; el cliente SHALL NOT fijar manualmente el
  header `Content-Type`. Mientras la petición está pendiente SHALL impedir
  envíos duplicados; si responde exitosamente SHALL actualizar el detalle con
  estado `EVIDENCIA_PAGO_SUBIDA`, `hasPaymentEvidence: true` y la referencia
  devuelta, y retirar el formulario sin recargar la página.
  *Verificación*: test del cliente API inspeccionando `FormData`, método y
  ausencia de `Content-Type`; test de componente para bloqueo y transición de
  UI exitosa.

- **R10**: IF cualquiera de las mutaciones de R4, R6 o R9 responde con error de
  validación, permisos, estado o red THEN THE SYSTEM SHALL mostrar un mensaje
  de error en español asociado a la operación, conservar el detalle y los
  valores introducidos, restaurar las acciones para permitir reintento y SHALL
  NOT representar localmente una transición que el servidor no confirmó.
  *Verificación*: test de cada flujo con promesa rechazada que asserta mensaje,
  valores conservados, status original y segundo intento habilitado.

- **R11**: WHILE el dashboard o el detalle administrativo esperan datos o una
  mutación THE SYSTEM SHALL exponer un estado de carga (`aria-busy` o texto
  equivalente), deshabilitar controles incompatibles y anunciar errores con
  `role="alert"`; los diálogos SHALL tener nombre accesible, los campos SHALL
  tener etiquetas visibles y el foco SHALL poder operarse con teclado.
  *Verificación*: tests de accesibilidad semántica sobre carga, errores,
  labels, diálogo y estados disabled.

- **R12**: WHEN cualquier usuario con rol distinto de `ADMINISTRACION` abre el
  detalle de una ODC THE SYSTEM SHALL NOT renderizar `Aprobar presupuesto`,
  `Rechazar` ni `Subir comprobante de pago`, aunque el status de la ODC coincida;
  WHEN el dashboard administrativo o sus formularios se muestran en una
  ventana estrecha THE SYSTEM SHALL mantener listas, detalle y acciones
  utilizables sin scroll horizontal involuntario y con textos de UI en español.
  *Verificación*: test parametrizado para `DIRECTOR_OPS` y `DIRECTOR_GENERAL`
  que asserta ausencia de acciones; verificación de clases/layout responsive y
  textos visibles en los tests de componentes.

## Fuera de alcance

- Aprobación o rechazo por `DIRECTOR_GENERAL`; corresponde a
  `frontend-general-approval` (feature 12).
- Registro de pago por `DIRECTOR_OPS`, subida de factura y entrada a almacén;
  corresponden a `frontend-payment-invoice` (feature 13).
- Crear, editar o reenviar ODCs y CRUD de proveedores; ya pertenecen a
  `frontend-odc-form` o al backend existente.
- Previsualizar, descargar o eliminar comprobantes; esta feature solo sube el
  archivo y consume `hasPaymentEvidence`/`evidenceReference` de la respuesta.
- Paginación interactiva, búsqueda, ordenamiento y filtros adicionales; el
  alcance usa la página 1 de cada cola, igual que el dashboard existente.
- Cambios en el backend, Cloudinary, permisos, máquina de estados o contratos
  HTTP existentes.
- Presupuesto numérico o saldo disponible: la validación de Administración es
  manual y el sistema no almacena presupuesto.
- Toasts globales, optimistic updates y tests e2e de navegador; los tests de
  esta feature son Vitest + Testing Library con API mockeada.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-22) ← gate obligatorio antes de implementar
