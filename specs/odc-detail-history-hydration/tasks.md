---
feature: "odc-detail-history-hydration"
status: draft
tags: [harness, spec]
---

# Tareas — [[odc-detail-history-hydration]]

> No iniciar hasta aprobación humana de [[requirements]]. Por requisito: rojo, mínimo, refactor. Los nombres de tests incluyen R-ids; registrar evidencias y commits en [[traceability]].

## R1 — Respuesta con historial persistido completo

- [ ] (1) Escribir regresiones rojas para create, update con transición y update sin transición: historial completo, metadatos de filas persistidas, orden cronológico y ausencia de duplicación/eventos nuevos en edición.
- [ ] (2) Cargar y mapear el historial desde el manager de la transacción en ambos métodos, adaptando los mocks a las consultas reales.
- [ ] (3) Refactor con tests verdes sin modificar contratos de dominio/aplicación ni ampliar el alcance a consultas no afectadas.

## R2 — Historial visible tras comprobante y factura

- [ ] (1) Escribir regresiones rojas de ambas subidas con respuestas efectivas del backend y reemplazo del estado en el detalle; comprobar eventos anteriores y nuevo evento, documento/estado, ausencia de GET reparador y conservación visual ante fallo.
- [ ] (2) Usar el historial completo retornado por el flujo existente; realizar cambios de cliente solo si son necesarios para satisfacer la regresión.
- [ ] (3) Refactor con tests verdes de formularios y detalle, sin eventos sintetizados ni confusión entre subida y refresco.

## R3 — Atomicidad, CAS y tickets

- [ ] (1) Extender regresiones de repositorio/PostgreSQL aislado para historial de respuesta dentro de transacción, rollback ante fallo de lectura posterior a escritura y conflictos concurrentes; comprobar ODC, evento y ticket sin confirmación parcial y conservar protección de archivo asociado.
- [ ] (2) Mantener la lectura y el mapeo dentro de la transacción existente y preservar versión, estado, locks, numeración/reintentos y recuperación de archivos.
- [ ] (3) Refactor con suites relevantes de #36/#38 verdes y documentar la ejecución PostgreSQL real, sin asumir que un mock prueba rollback.

## R4 — Instantes deterministas en México

- [ ] (1) Escribir tests rojos para la misma fecha de creación, actualización y evento bajo UTC y otra zona, incluyendo un instante cercano a medianoche y nulos; comprobar texto visible en detalle y formulario persistido.
- [ ] (2) Aplicar `America/Mexico_City` y `es-MX` al formato compartido de instantes y corregir formatos secundarios de ese flujo si existen.
- [ ] (3) Refactor con tests verdes, conservando timestamps/contratos existentes y sin cambiar la zona del proceso como solución.

## R5 — Fechas de calendario sin desplazamiento

- [ ] (1) Escribir regresiones de día calendario y nulos bajo distintas zonas para pago, factura y almacén; cubrir límites de mes/año y año bisiesto.
- [ ] (2) Conservar la representación de calendario separada del formateador de instantes y el anclaje UTC necesario.
- [ ] (3) Refactor con tests verdes de helpers y valores visibles del detalle.

## R6 — Creación pendiente sin reloj de render

- [ ] (1) Escribir test rojo del formulario nuevo que exige `Pendiente` antes de persistencia y fecha real después de guardar; usar relojes distintos a ambos lados de medianoche para SSR/cliente.
- [ ] (2) Sustituir la fecha calculada durante render por `Pendiente` hasta disponer de la ODC persistida, usando R4 después de persistir.
- [ ] (3) Refactor con tests verdes sin añadir efectos de reloj o fechas provisionales al payload.

## R7 — Hidratación real e interacción

- [ ] (1) Escribir regresiones con `renderToString` UTC y `hydrateRoot` bajo zona distinta, mismo estado serializado y `onRecoverableError` vacío para detalle, formulario persistido y nuevo. Verificar fechas visibles y editar campos, activar validación y ejecutar una acción del formulario después de hidratar.
- [ ] (2) Corregir exclusivamente las fuentes restantes de contenido inicial no determinista dentro del flujo; restaurar zonas, relojes y raíces en los tests.
- [ ] (3) Refactor con tests verdes sin `suppressHydrationWarning` ni desactivar SSR. Ejecutar `./init.sh`, completar trazabilidad y someter a reviewer antes de marcar done.
