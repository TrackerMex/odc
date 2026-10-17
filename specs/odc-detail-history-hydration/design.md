---
feature: "odc-detail-history-hydration"
status: draft
tags: [harness, spec]
---

# Diseño — [[odc-detail-history-hydration]]

> Ver [[requirements]] y [[../../docs/architecture|architecture]].

## Diagnóstico

`PurchaseOrderTypeOrmRepository.create` y `update` guardan el evento, pero retornan `toDomain(saved)` sin `historyRows`; el mapper usa un arreglo vacío por defecto. La ruta `/odcs/$id` hace `setOdc` con la respuesta y desaparece el historial. `findById` sí lo carga, lo que explica que reaparezca al recargar. `formatDate` no declara zona, mientras que `OdcForm` además usa `new Date()` directamente para una ODC aún inexistente.

## Decisiones técnicas

1. **Respuesta desde la persistencia confirmable (R1–R3):** cargar las filas de `OdcStatusHistoryOrmEntity` por el ID guardado mediante el mismo `manager` transaccional, después de guardar cualquier nueva transición y antes de convertir la respuesta. Aplicar tanto a `create` como a `update`, incluso si no se recibió `historyEntry`. Ordenar como `findById` (`createdAt ASC`). Reutilizar el mapper existente y los metadatos guardados; no fabricar eventos desde el estado del formulario o dominio. El resultado solo sale cuando la transacción se confirma.
2. **Conservar garantías de escritura (R3):** no cambiar el CAS por versión y estado, la numeración/reintentos de creación, el orden de locks de tickets, ni las reglas de recuperación y compensación. Una lectura adicional fallida dentro de la transacción también debe producir rollback. Los tests del manager deben distinguir búsquedas de numeración e historial, sin respuestas por defecto irreales. No agregar dependencias de TypeORM a dominio o aplicación.
3. **Actualización existente del detalle (R2):** aprovechar la respuesta completa de la mutación en el `setOdc` actual. Mantener el manejo existente de fallo de subida. Verificar ambas subidas con su respuesta efectiva y la línea de tiempo visible; cambiar código cliente solo si la regresión descubre una necesidad real.
4. **Instantes con zona explícita (R4):** centralizar la política `es-MX`/`America/Mexico_City` en el formato compartido de instantes de ODC. Auditar consumidores del detalle y formulario para evitar formatos locales secundarios. No modificar los timestamps persistidos ni la zona del proceso para imponer el resultado.
5. **Calendario separado (R5):** conservar `formatDateOnly` como fecha sin hora, con anclaje UTC, para pago, factura y almacén. No pasar esas fechas por el formateador de instantes.
6. **Fecha de creación aún inexistente (R6):** mostrar `Pendiente` hasta que exista una ODC persistida. Se elimina el reloj de render como fuente de contenido inicial; fijar solo `timeZone` no evita diferencias de fecha si SSR y navegador renderizan a ambos lados de medianoche. Después de guardar, usar `persistedOdc.createdAt` y la misma política R4.
7. **Prueba real de hidratación (R7):** SSR con `renderToString`, conservación del HTML y estado inicial, y luego `hydrateRoot` bajo otra zona con `onRecoverableError`. Restaurar zonas/relojes al terminar y evitar que el propio test cambie los datos entre renders. Verificar eventos e interacción; los snapshots o tests del helper solos no prueban hidratación. Usar el patrón de runner actual o procesos aislados si el runtime exige fijar zona al inicio.

## Archivos afectados

| Capa | Archivos previstos | Motivo |
|---|---|---|
| Infrastructure backend | `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts` y su `.spec.ts` | Cargar historial transaccional y comprobar respuesta/rollback de create/update. |
| Infrastructure backend | Tests HTTP existentes de subida de comprobante/factura y `backend/test/odc-concurrent-updates.e2e-spec.ts` | Verificar respuesta efectiva, concurrencia e invariantes en PostgreSQL aislado. Ampliar suites cercanas en lugar de crear infraestructura general. |
| Frontend | `frontend/src/lib/odc.ts` y `odc.test.ts` | Zona explícita, instantes nulos y calendario sin desplazamientos. |
| Frontend | `frontend/src/components/odc/odc-form.tsx` y `odc-form.test.tsx` | Fecha pendiente antes de persistencia e interacción posterior a hidratación. |
| Frontend | `frontend/src/components/odc/odc-detail.test.tsx`, `payment-evidence-form.test.tsx`, `upload-invoice-form.test.tsx`, `odc-page-state.test.tsx` y pruebas de rutas cercanas | Regresión del estado y línea de tiempo tras ambas subidas y SSR/hidratación del detalle. |
| Frontend, si la prueba lo exige | `frontend/src/components/odc/odc-detail.tsx` y `frontend/src/routes/_authenticated/odcs/$id.tsx` | Solo correcciones necesarias al flujo existente verificadas por regresión. |
| Dominio/aplicación | Sin cambios funcionales previstos | Preservar contratos y reglas de negocio. |

## Alternativas descartadas

- Segundo GET tras subir: introduce otra condición de fallo después de una subida correcta y deja incompletas otras respuestas del mismo repositorio.
- Conservar únicamente el historial antiguo en el cliente o agregar eventos sintéticos: oculta respuestas incompletas y puede omitir metadatos o la transición recién guardada.
- Consultar historial fuera de la transacción: permite una respuesta incoherente respecto del estado y transición guardados.
- Aplicar la zona de México a todas las fechas: desplaza fechas de calendario que no representan instantes.
- `suppressHydrationWarning`, omitir SSR o esperar a montaje para todo el detalle: oculta el defecto y degrada una vista que puede renderizarse determinísticamente.
- Mostrar el día actual como fecha de una ODC no guardada: confunde una fecha provisional con su creación real y depende de relojes distintos.

## Verificación y cierre

Ejecutar ciclos TDD de [[tasks]], mantener [[traceability]] por requisito y validar [[../../CHECKPOINTS|CHECKPOINTS]]. Las pruebas PostgreSQL deben usar una base aislada conforme a los scripts/documentación actuales. No marcar `done` sin revisión, trazabilidad completa y `./init.sh` verde. Esta spec no autoriza implementación hasta el gate humano.
