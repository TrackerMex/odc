---
feature: "frontend-general-approval"
status: approved        # draft | approved
tags: [frontend, director-general, odc, spec]
---

# Requisitos — [[frontend-general-approval]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas generales del proyecto.
>
> Fuente funcional: brief **F12 `frontend-general-approval`** de
> `plans/001-odc-purchase-system.md`, paso 3 del flujo, y los contratos backend
> ya implementados por `odc-purchase-approval`. La feature extiende la sesión,
> el dashboard, el cliente API y el detalle entregados por
> `frontend-foundation`, `frontend-odc-form` y `frontend-admin-flows`; no
> modifica reglas de negocio ni endpoints backend.

## Contratos backend consumidos

| Operación | Contrato |
|---|---|
| Cola pendiente | `GET /api/odcs?status=PRESUPUESTO_APROBADO&page=1` |
| Detalle | `GET /api/odcs/:id` |
| Aprobar compra | `POST /api/odcs/:id/approve-purchase` |
| Rechazar compra | `POST /api/odcs/:id/reject` con `{ rejectionReason }` |

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `DIRECTOR_GENERAL` entra a la
  ruta principal protegida THE SYSTEM SHALL cargar exactamente la página 1 de
  `PRESUPUESTO_APROBADO` mediante el filtro documentado, sin cargar las cuatro
  colas de `DIRECTOR_OPS`, las dos colas de `ADMINISTRACION` ni la acción
  `Nueva ODC`.
  *Verificación*: test del loader con contexto `DIRECTOR_GENERAL` que asserta
  una sola llamada con status `PRESUPUESTO_APROBADO` y página 1; tests de
  regresión que conservan las llamadas existentes de los otros dos roles.

- **R2**: WHEN la cola de R1 termina de cargar THE SYSTEM SHALL mostrar un
  dashboard de Dirección General con el bloque `Esperando mi aprobación`, el
  `total` devuelto por la API y una lista de sus ODCs; cada elemento SHALL
  mostrar número, descripción, proveedor e importe total en MXN y SHALL enlazar
  a `/odcs/:id`. IF la página no contiene items THEN THE SYSTEM SHALL mostrar
  un estado vacío explícito.
  *Verificación*: test de render con páginas poblada y vacía que asserta
  encabezado, contador, datos, formato monetario, enlaces y mensaje vacío.

- **R3**: WHILE un usuario `DIRECTOR_GENERAL` visualiza el detalle de una ODC
  en estado `PRESUPUESTO_APROBADO` THE SYSTEM SHALL mostrar número, estado,
  descripción, cantidad/unidad, proveedor, precio unitario, total, comentarios
  cuando existan e historial, junto con las acciones `Aprobar compra` y
  `Rechazar`.
  *Verificación*: test de render del detalle pendiente que asserta todos los
  datos, el historial y ambas acciones.

- **R4**: WHEN el detalle contiene al menos una entrada de historial cuyo
  `toStatus` es `PRESUPUESTO_APROBADO` THE SYSTEM SHALL mostrar la marca visible
  `Validado por Administración`; IF el historial no contiene esa transición
  THEN THE SYSTEM SHALL NOT mostrar la marca, aunque otro dato o el estado
  actual de la ODC sea similar.
  *Verificación*: test parametrizado con y sin la transición de historial que
  asserta que la marca se deriva exclusivamente del historial recibido.

- **R5**: WHEN cualquier usuario con rol distinto de `DIRECTOR_GENERAL`
  visualiza una ODC, o WHEN un `DIRECTOR_GENERAL` visualiza una ODC cuyo estado
  no es `PRESUPUESTO_APROBADO`, THE SYSTEM SHALL NOT renderizar `Aprobar
  compra`, `Rechazar` ni el panel de aprobación general.
  *Verificación*: test parametrizado para `DIRECTOR_OPS`, `ADMINISTRACION` y
  estados distintos que asserta la ausencia de las acciones.

- **R6**: WHEN el usuario activa `Aprobar compra` sobre una ODC
  `PRESUPUESTO_APROBADO` THE SYSTEM SHALL ejecutar una sola petición
  `POST /api/odcs/:id/approve-purchase`, deshabilitar las acciones
  incompatibles mientras está pendiente y, si responde exitosamente,
  actualizar el detalle con la ODC devuelta en estado `COMPRA_APROBADA` y
  retirar el panel de aprobación general sin recargar la página.
  *Verificación*: test del cliente API para ruta y método; test de componente
  que evita doble envío y asserta la actualización confirmada por el servidor.

- **R7**: WHEN el usuario activa `Rechazar` sobre una ODC
  `PRESUPUESTO_APROBADO` THE SYSTEM SHALL abrir un diálogo accesible con el
  campo visible `Motivo del rechazo` y acciones para cancelar o confirmar; IF
  el motivo está vacío o contiene solo espacios THEN THE SYSTEM SHALL mostrar
  un error de validación, SHALL NOT invocar la API y SHALL mantener abierto el
  diálogo.
  *Verificación*: test con Testing Library que abre el diálogo, confirma sin
  motivo y asserta mensaje, estado abierto y cero llamadas a `rejectOdc`.

- **R8**: WHEN el usuario confirma el diálogo de R7 con un motivo no vacío THE
  SYSTEM SHALL ejecutar `POST /api/odcs/:id/reject` con JSON
  `{ rejectionReason: <motivo recortado> }`, impedir confirmaciones duplicadas
  mientras está pendiente y, si responde exitosamente, cerrar el diálogo,
  actualizar el detalle con la ODC devuelta en estado `RECHAZADA`, mostrar el
  motivo y retirar el panel de aprobación general sin recargar la página.
  *Verificación*: test del cliente API para ruta, método y body; test de
  componente para payload recortado, bloqueo y actualización exitosa.

- **R9**: IF la aprobación o el rechazo responde con error de validación,
  permisos, estado o red THEN THE SYSTEM SHALL mostrar un mensaje de error en
  español asociado a la operación, conservar la ODC y el motivo introducido,
  restaurar las acciones para permitir reintento y SHALL NOT representar
  localmente una transición que el servidor no confirmó.
  *Verificación*: test de ambos flujos con promesa rechazada que asserta
  mensaje, status y valores conservados, y segundo intento habilitado.

- **R10**: WHILE el dashboard, el detalle o una mutación de esta feature
  esperan respuesta THE SYSTEM SHALL exponer un estado de carga mediante
  `aria-busy` o texto equivalente y deshabilitar controles incompatibles; los
  errores SHALL usar `role="alert"`, el diálogo SHALL tener nombre accesible y
  sus campos SHALL tener etiquetas visibles. WHEN estas vistas se muestran en
  una ventana estrecha THE SYSTEM SHALL mantener lista, detalle y acciones
  utilizables sin scroll horizontal involuntario y con textos de UI en español.
  *Verificación*: tests de semántica accesible, estados disabled, clases/layout
  responsive y textos visibles.

## Fuera de alcance

- Validación o rechazo de presupuesto por `ADMINISTRACION` y subida de
  comprobante; pertenecen a `frontend-admin-flows`.
- Crear, editar, reenviar o registrar el pago de una ODC, subir factura,
  registrar entrada a almacén o descargar archivos; pertenecen a otras
  features.
- Cambios en backend, permisos, máquina de estados, base de datos o contratos
  HTTP existentes.
- Presupuesto numérico o saldo disponible: el sistema solo representa que
  Administración completó su validación mediante el historial.
- Paginación interactiva, búsqueda, ordenamiento y filtros adicionales; el
  alcance usa la página 1 de la única cola de Dirección General.
- Optimistic updates, estado global para las ODCs, notificaciones, toasts
  globales y tests e2e de navegador.
- Crear rutas nuevas o editar manualmente `frontend/src/routeTree.gen.ts`; la
  feature reutiliza la raíz protegida y `/odcs/:id`.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-23) ← gate obligatorio antes de implementar
