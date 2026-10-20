---
feature: "odc-multi-line-items"
status: approved     # draft | approved
tags: [backend, frontend, odc, spec]
---

# Requisitos — [[odc-multi-line-items]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de capas del proyecto.

## Requisitos funcionales

- **R1**: WHEN una ODC se crea o se edita THE SYSTEM SHALL representarla con una
  colección ordenada de una o más partidas, cada una con `description`,
  `quantity`, `unit` y `unitPriceCents`; `supplier` y `comments` SHALL
  permanecer a nivel de ODC. THE SYSTEM SHALL calcular `totalCents` como la
  suma de `quantity × unitPriceCents` de todas las partidas, en centavos, sin
  aceptar un total enviado por el cliente.
  *Verificación*: tests de dominio con una y varias partidas, orden estable,
  total calculado y cabecera independiente de las partidas.

- **R2**: WHEN `DIRECTOR_OPS` crea una ODC con `POST /api/odcs` THE SYSTEM
  SHALL aceptar `items[]` con campos completos por partida, o el contrato
  escalar legado (`description`, `quantity`, `unit`, `unitPriceCents`) como una
  única partida; ambos formatos SHALL NOT aparecer juntos en la misma
  petición. `supplier` SHALL ser obligatorio y `comments` SHALL ser opcional
  en ambos formatos. La ODC SHALL conservar la asignación de número, creador,
  estado `BORRADOR` e historial actuales.
  *Verificación*: tests de DTO/controller/use-case para ambos formatos,
  rechazo HTTP 400 al mezclar formatos, y confirmación de que el total,
  creador, estado e historial son correctos.

- **R3**: WHEN el creador `DIRECTOR_OPS` edita una ODC `BORRADOR` o
  `RECHAZADA` con `PATCH /api/odcs/:id` THE SYSTEM SHALL aceptar `items[]`
  como reemplazo completo de la colección o campos escalares legados como
  cambios parciales de la primera partida; una actualización escalar SHALL
  conservar las demás partidas. Si se envían ambas representaciones de
  partidas, el sistema SHALL responder HTTP 400. Una colección vacía SHALL
  ser rechazada. La edición SHALL conservar el estado y las reglas actuales
  de propietario/rol; enviar la ODC SHALL seguir siendo la transición
  existente y no SHALL registrar una transición de historial por cada
  edición.
  *Verificación*: tests de PATCH para reemplazo, cambio parcial legado,
  conservación de partidas adicionales, colección vacía, rol/propietario,
  estados no editables y preservación de la máquina de estados.

- **R4**: WHEN se persisten partidas THE SYSTEM SHALL validar cada descripción
  y unidad no vacías, cantidad y precio unitario como enteros positivos
  compatibles con los límites de entrada existentes, y cada producto y suma
  de partidas como entero seguro positivo no mayor que `MAX_ODC_INTEGER`.
  IF cualquier partida o total agregado no cumple esos límites THEN THE SYSTEM
  SHALL responder HTTP 400 antes de guardar cambios; la entidad de dominio
  SHALL rechazar igualmente el mismo dato si se invoca sin la capa HTTP.
  *Verificación*: tests de DTO y dominio para campos ausentes, tipo incorrecto,
  cero/negativo, máximo, máximo + 1, producto desbordado y suma agregada
  desbordada; confirmar que el repositorio no se invoca al fallar validación.

- **R5**: WHEN se guarda o se lee una ODC THE SYSTEM SHALL persistir la
  cabecera, el total y todas las partidas en una sola operación atómica,
  conservar el orden de las partidas y devolver `items[]` en respuestas de
  creación, edición, detalle y lista. Para compatibilidad, los campos escalares
  legados SHALL reflejar la primera partida. Las vistas de detalle y revisión
  SHALL mostrar todas las partidas; las vistas compactas SHALL identificar el
  número de partidas además del resumen de primera partida.
  *Verificación*: tests del repositorio y mapper para persistencia/orden y
  proyección legado; tests de interfaz para formularios y detalle/revisión con
  varias partidas, incluida la actualización de total.

- **R6**: WHEN se despliega el esquema de partidas sobre ODCs existentes THE
  SYSTEM SHALL crear una partida equivalente por cada ODC, conservando sus
  campos escalares, `totalCents`, estado e historial sin cambios. La migración
  SHALL ejecutarse como una transacción versionada. IF una ODC histórica no
  satisface la invariante anterior de `totalCents` THEN THE SYSTEM SHALL
  abortar la migración sin cambios parciales y reportar el registro que requiere
  conciliación.
  *Verificación*: prueba de migración sobre una base PostgreSQL aislada con
  órdenes en varios estados; comparar partidas/cabeceras antes y después, y
  probar rollback completo ante una fila inconsistente.

- **R7**: WHEN un usuario guarda un formulario de ODC THE SYSTEM SHALL
  permitir agregar partidas y quitar partidas existentes en `BORRADOR` y
  `RECHAZADA`, SHALL impedir quitar la última partida, y SHALL conservar los
  valores introducidos cuando falle el guardado para que el usuario pueda
  corregirlos o reintentar. Al cargar el detalle, el sistema SHALL mostrar las
  partidas en el orden persistido sin alterar la secuencia existente de
  submit/aprobación/pago.
  *Verificación*: tests de interfaz para agregar/quitar, límite de una partida,
  orden, guardar borrador, guardar y enviar, errores recuperables y matriz de
  permisos/estados.

## Fuera de alcance

- Aplicar IVA o cambiar el significado de precios y totales; se definirá en una
  feature posterior.
- Adjuntar documentos de cotización o cambiar la subida de facturas y
  comprobantes.
- Crear o aprobar concentrados semanales.
- Asignar proveedor por partida; el proveedor permanece en la cabecera.
- Editar partidas en estados distintos de `BORRADOR` y `RECHAZADA` o cambiar
  la máquina de estados de una ODC.
- Introducir un límite de negocio para la cantidad de partidas distinto de
  los límites de entrada y almacenamiento existentes.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-10-20) ← gate obligatorio antes de implementar

---
