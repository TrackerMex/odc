---
feature: "frontend-payment-invoice"
status: approved        # draft | approved
tags: [frontend, director-ops, odc, spec]
---

# Requisitos — [[frontend-payment-invoice]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas generales del proyecto.
>
> Fuente funcional: brief **F13 `frontend-payment-invoice`** de
> `plans/001-odc-purchase-system.md`, pasos 4 y 6 del flujo, y los contratos
> backend ya implementados por `odc-register-payment` (T7),
> `odc-payment-evidence` (T8) y `odc-invoice-completion` (T9). La feature
> extiende la sesión, el dashboard, el cliente API y el detalle entregados por
> `frontend-foundation`, `frontend-odc-form`, `frontend-admin-flows` y
> `frontend-general-approval`; no modifica reglas de negocio ni endpoints
> backend.
>
> Verificado contra el código vivo: `frontend/src/lib/odc.ts` ya declara en el
> tipo `Odc` todos los campos que esta feature necesita mostrar o enviar
> (`paymentDate`, `paymentMethod`, `paymentReference`, `paymentNotes`,
> `hasPaymentEvidence`, `evidenceReference`, `hasInvoice`, `invoiceNumber`,
> `invoiceDate`, `warehouseEntryDate`, `observations`); el backend ya expone
> `POST /api/odcs/:id/payment`, `POST /api/odcs/:id/invoice` y
> `GET /api/odcs/:id/files/:kind` (`kind ∈ {evidence, invoice}`) en
> `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`.

## Contratos backend consumidos

| Operación | Contrato |
|---|---|
| Detalle | `GET /api/odcs/:id` (ya consumido) |
| Registrar pago | `POST /api/odcs/:id/payment` JSON `{ paymentDate, paymentMethod, paymentReference?, paymentNotes? }`; rol `DIRECTOR_OPS`; solo válido desde `COMPRA_APROBADA` |
| Subir factura | `POST /api/odcs/:id/invoice` multipart con `file`, `warehouseEntryDate` obligatorios y `invoiceNumber?`/`invoiceDate?`/`observations?` opcionales; rol `DIRECTOR_OPS`; solo válido desde `EVIDENCIA_PAGO_SUBIDA` |
| Descargar comprobante | `GET /api/odcs/:id/files/evidence` → HTTP 302 a URL firmada de Cloudinary |
| Descargar factura | `GET /api/odcs/:id/files/invoice` → HTTP 302 a URL firmada de Cloudinary |

## Requisitos funcionales

- **R1**: WHILE un usuario `DIRECTOR_OPS` visualiza el detalle de una ODC en
  estado `COMPRA_APROBADA` THE SYSTEM SHALL mostrar un formulario `Registrar
  pago` con los campos visibles `Fecha de pago` (fecha, obligatorio),
  `Método de pago` (texto, obligatorio), `Referencia` (texto, opcional) y
  `Notas` (texto largo, opcional); THE SYSTEM SHALL NOT mostrar este
  formulario para ningún otro rol ni para una ODC en un estado distinto de
  `COMPRA_APROBADA`.
  *Verificación*: test de render con `DIRECTOR_OPS` + `COMPRA_APROBADA` que
  asserta los 4 campos y sus etiquetas; test parametrizado con otros roles y
  otros estados que asserta la ausencia del formulario.

- **R2**: WHEN el formulario de R1 se confirma sin `Fecha de pago` o con
  `Método de pago` vacío o solo espacios THE SYSTEM SHALL mostrar un error de
  validación en español asociado al campo faltante, SHALL NOT invocar la API
  y SHALL conservar los valores ya escritos en los demás campos.
  *Verificación*: tests que confirman el formulario sin fecha, sin método y
  con método en blanco, assertando el mensaje, cero llamadas a
  `registerPayment` y que `Referencia`/`Notas` conservan su valor.

- **R3**: WHEN el formulario de R1 se confirma con `Fecha de pago` y `Método
  de pago` válidos (y opcionalmente `Referencia` y/o `Notas`) THE SYSTEM
  SHALL ejecutar una sola petición `POST /api/odcs/:id/payment` con JSON
  `{ paymentDate, paymentMethod: <recortado>, paymentReference?: <recortado>,
  paymentNotes?: <recortado> }`, incluyendo `paymentReference`/`paymentNotes`
  solo cuando no queden vacíos tras recortar; mientras la petición está
  pendiente SHALL impedir envíos duplicados; si responde exitosamente SHALL
  actualizar el detalle con la ODC devuelta en estado `PAGO_REGISTRADO` y
  retirar el formulario sin recargar la página.
  *Verificación*: test del cliente API inspeccionando método, ruta y cuerpo
  JSON con y sin los campos opcionales; test de componente que evita doble
  envío y asserta la transición de UI confirmada por el servidor.

- **R4**: IF `POST /api/odcs/:id/payment` responde con error de validación,
  permisos, estado o red THEN THE SYSTEM SHALL mostrar un mensaje de error en
  español asociado al formulario, conservar los valores introducidos,
  restaurar los controles para permitir reintento y SHALL NOT representar
  localmente una transición que el servidor no confirmó.
  *Verificación*: test con la promesa de `registerPayment` rechazada que
  asserta mensaje, status original conservado, valores conservados y segundo
  intento habilitado.

- **R5**: WHILE un usuario `DIRECTOR_OPS` visualiza el detalle de una ODC en
  estado `EVIDENCIA_PAGO_SUBIDA` THE SYSTEM SHALL mostrar un formulario
  `Subir factura` con los campos visibles `Archivo de la factura` (archivo,
  obligatorio), `Número de factura` (texto, opcional), `Fecha de factura`
  (fecha, opcional), `Fecha de entrada a almacén` (fecha, obligatorio) y
  `Observaciones` (texto largo, opcional); THE SYSTEM SHALL NOT mostrar este
  formulario para ningún otro rol ni para una ODC en un estado distinto de
  `EVIDENCIA_PAGO_SUBIDA`.
  *Verificación*: test de render con `DIRECTOR_OPS` + `EVIDENCIA_PAGO_SUBIDA`
  que asserta los 5 campos y sus etiquetas; test parametrizado con otros
  roles y otros estados que asserta la ausencia del formulario.

- **R6**: WHEN el formulario de R5 se confirma THE SYSTEM SHALL aceptar
  únicamente un archivo con MIME `application/pdf`, `image/jpeg` o
  `image/png` y tamaño máximo de 10 485 760 bytes; IF no hay archivo, el MIME
  no está permitido, el tamaño excede el límite, o `Fecha de entrada a
  almacén` está vacía THEN THE SYSTEM SHALL mostrar un error de validación en
  español asociado al campo correspondiente, SHALL NOT invocar la API y
  SHALL conservar los valores ya escritos en los demás campos.
  *Verificación*: tests del formulario para archivo ausente, MIME inválido,
  tamaño mayor a 10 MB, `Fecha de entrada a almacén` ausente, y la
  combinación válida en cada MIME permitido.

- **R7**: WHEN el formulario de R5 se confirma con un archivo válido y
  `Fecha de entrada a almacén` (y opcionalmente `Número de factura`, `Fecha
  de factura` y/o `Observaciones`) THE SYSTEM SHALL enviar
  `POST /api/odcs/:id/invoice` como `FormData` con la clave `file`, la clave
  `warehouseEntryDate`, y `invoiceNumber`/`invoiceDate`/`observations`
  (recortados) solo cuando no queden vacíos; el cliente SHALL NOT fijar
  manualmente el header `Content-Type`. Mientras la petición está pendiente
  SHALL impedir envíos duplicados; si responde exitosamente SHALL actualizar
  el detalle con la ODC devuelta en estado `COMPLETADA`, `hasInvoice: true` y
  los datos de factura recibidos, y retirar el formulario sin recargar la
  página.
  *Verificación*: test del cliente API inspeccionando `FormData`, método y
  ausencia de `Content-Type`; test de componente para bloqueo de doble envío
  y transición de UI exitosa.

- **R8**: IF `POST /api/odcs/:id/invoice` responde con error de validación,
  permisos, estado o red THEN THE SYSTEM SHALL mostrar un mensaje de error en
  español asociado al formulario, conservar los valores de texto/fecha
  introducidos, restaurar los controles para permitir reintento y SHALL NOT
  representar localmente una transición que el servidor no confirmó.
  *Verificación*: test con la promesa de `uploadInvoice` rechazada que
  asserta mensaje, status original conservado, valores de texto/fecha
  conservados y segundo intento habilitado.

- **R9**: WHEN una ODC alcanza el estado `COMPLETADA` THE SYSTEM SHALL
  mostrar la insignia de estado `Completada` en el detalle mediante el
  componente de badge ya existente y SHALL NOT mostrar los formularios
  `Registrar pago` ni `Subir factura`; WHEN el detalle tiene al menos uno de
  `invoiceNumber`, `invoiceDate`, `warehouseEntryDate` u `observations` con
  valor THE SYSTEM SHALL mostrar un bloque `Información de factura` con esos
  datos, mostrando "Pendiente" para los campos de fecha ausentes y omitiendo
  los campos de texto ausentes, igual que el bloque `Información de pago` ya
  existente.
  *Verificación*: test de render de una ODC `COMPLETADA` que asserta la
  insignia, la ausencia de ambos formularios y el contenido del bloque de
  factura; test con datos de factura parcialmente ausentes.

- **R10**: WHEN `odc.hasPaymentEvidence` es `true` THE SYSTEM SHALL mostrar
  en el detalle un enlace `Descargar comprobante de pago` que apunta a
  `GET /api/odcs/:id/files/evidence` y se abre en una pestaña nueva; WHEN
  `odc.hasInvoice` es `true` THE SYSTEM SHALL mostrar un enlace `Descargar
  factura` que apunta a `GET /api/odcs/:id/files/invoice` y se abre en una
  pestaña nueva; estos enlaces SHALL ser visibles para cualquier rol
  autenticado que pueda ver el detalle (no solo `DIRECTOR_OPS`) y SHALL NOT
  aparecer cuando el indicador correspondiente es `false`.
  *Verificación*: test parametrizado por rol (`DIRECTOR_OPS`,
  `ADMINISTRACION`, `DIRECTOR_GENERAL`) y por combinación de
  `hasPaymentEvidence`/`hasInvoice` que asserta presencia/ausencia y el
  `href` de cada enlace.

- **R11**: WHILE cualquiera de los formularios de esta feature espera una
  mutación THE SYSTEM SHALL exponer un estado de carga (`aria-busy` o texto
  equivalente) y deshabilitar sus controles; los errores SHALL usar
  `role="alert"`, todos los campos SHALL tener etiquetas visibles asociadas y
  el foco SHALL poder operarse con teclado.
  *Verificación*: tests de semántica accesible sobre carga, errores, labels
  y estados disabled de ambos formularios.

- **R12**: WHEN cualquier usuario con rol distinto de `DIRECTOR_OPS` abre el
  detalle de una ODC, o WHEN un `DIRECTOR_OPS` abre una ODC cuyo estado no es
  `COMPRA_APROBADA` ni `EVIDENCIA_PAGO_SUBIDA`, THE SYSTEM SHALL NOT
  renderizar `Registrar pago` ni `Subir factura`; WHEN estas vistas se
  muestran en una ventana estrecha THE SYSTEM SHALL mantener detalle,
  formularios y enlaces de descarga utilizables sin scroll horizontal
  involuntario y con todos los textos de UI en español.
  *Verificación*: test parametrizado rol × estado que asserta la ausencia de
  ambos formularios fuera de su combinación válida; verificación de
  clases/layout responsive y textos visibles en los tests de componentes.

## Fuera de alcance

- Aprobación o rechazo de presupuesto/compra; pertenecen a
  `frontend-admin-flows` y `frontend-general-approval`.
- Subida de evidencia de pago por `ADMINISTRACION`; ya entregada por
  `frontend-admin-flows`.
- Crear, editar, reenviar ODCs y CRUD de proveedores; ya pertenecen a
  `frontend-odc-form` o al backend existente.
- Vista previa embebida (imagen/PDF inline) del comprobante o la factura;
  esta feature solo enlaza a la ruta de descarga existente, que redirige a
  una URL firmada de Cloudinary.
- Eliminar o reemplazar un comprobante o factura ya subidos.
- Un dashboard o cola nueva para ODCs `COMPLETADA`; el dashboard de
  `DIRECTOR_OPS` y sus cuatro colas existentes no cambian en esta feature.
- Selección de método de pago mediante catálogo o `<select>`: el backend
  acepta cualquier texto no vacío y el brief no define opciones fijas;
  `Método de pago` es un campo de texto libre.
- Paginación interactiva, búsqueda, ordenamiento y filtros; no aplica al
  detalle de una sola ODC.
- Cambios en el backend, Cloudinary, permisos, máquina de estados o
  contratos HTTP existentes.
- Presupuesto numérico o saldo disponible: no aplica a esta feature.
- Toasts globales, optimistic updates y tests e2e de navegador; los tests de
  esta feature son Vitest + Testing Library con API mockeada.

## Aprobación

- [x] Aprobado por humano (fecha: 2026-07-23) ← gate obligatorio antes de implementar
