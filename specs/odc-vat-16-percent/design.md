---
feature: "odc-vat-16-percent"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Diseño — [[odc-vat-16-percent]]

> Decisiones para implementar [[requirements]] respetando
> [[../../docs/architecture|architecture]]. Esta spec requiere aprobación
> humana antes de implementar.

## Decisiones técnicas

- El dominio representa subtotal, tasa en puntos base, IVA y total con centavos
  enteros. Calcula una sola vez sobre el subtotal y valida el total final y los
  límites antes de modificar el agregado. Usar multiplicación entera con
  precisión suficiente o una fórmula equivalente segura; por ejemplo,
  `floor((subtotalCents * 16 + 50) / 100)` para tasa 16 %, validando también
  intermedios y límites. No usar sumas de impuestos redondeados por partida.
- El valor persistido `vatRateBps` distingue `0` histórico de `1600` actual,
  incluso cuando el importe de IVA se redondea a cero. No inferir el régimen
  por `vatCents` ni por el estado actual de la ODC. La hidratación debe
  comprobar `subtotal = suma(partidas)` y `total = subtotal + IVA` según la
  tasa, reemplazando la invariante anterior que iguala total con partidas.
- Un `BORRADOR` histórico pasa a tasa 1600 en el guardado de edición por el
  creador autorizado; una transición directa sin guardado previo o una lectura
  sola no cambia su régimen. El flujo del formulario `persistAndSend` llama
  primero a `persist`, por lo que un guardado exitoso aplica el IVA antes de
  enviar; un fallo de guardado conserva los importes persistidos, mientras un
  fallo del envío posterior conserva el desglose ya guardado y el estado previo
  a la transición. Por
  propuesta, las demás órdenes históricas mantienen su tasa 0 al editar o
  transicionar, incluidas las rechazadas. Esta decisión se presenta para
  aprobación en requirements; no inferirla de la fecha del sistema.
- Mantener subtotal, tasa, IVA y total en la cabecera y escribirlos junto con
  partidas y versión en las transacciones existentes. DTOs no aceptan control
  de importe o tasa del cliente. Conservar proyección escalar de primera
  partida; `totalCents` pasa a representar total final en nuevas ODC, por lo
  que consumidores y reportes deben actualizar su interpretación.
- El backfill asigna subtotal=total anterior, tasa=0, IVA=0 sin modificar
  importes ni historial. La migración versionada valida previamente existencia
  y coherencia del esquema de partidas, datos y límites; usa una transacción
  y aborta si no puede preservar una ODC. Definir una secuencia de despliegue
  para que versión de aplicación y esquema sean compatibles, evitando escrituras
  mixtas mientras se migra. Nunca ejecutar sobre base compartida sin validar
  destino, respaldo y precondiciones operativas.
- Las vistas capturan precios sin IVA y presentan desglose antes de confirmar.
  Al editar un borrador histórico, captura y revisión muestran el cálculo
  proyectado al 16 % e informan que se aplicará al guardar; no alteran los
  importes persistidos hasta que el guardado termine con éxito. El detalle de
  la ODC y la revisión por Administración o Dirección General muestran los
  importes de la respuesta persistida. Los
  reportes agregan `totalCents` una vez para mezclar órdenes históricas y
  gravadas correctamente. Los permisos y estados de revisión no cambian.
- El concentrado semanal todavía no existe; su futura spec debe almacenar la
  instantánea de `subtotalCents`, `vatRateBps`, `vatCents` y `totalCents` sin
  recalcularla desde datos actuales.

## Archivos y capas afectados

- `backend/src/modules/odc/domain/entities/purchase-order.entity.ts` y
  `input-boundaries.ts`: cálculo puro, validación, hidratación y transición del
  régimen al guardar un borrador histórico.
- `backend/src/modules/odc/application/dto/` y `application/use-cases/`:
  mantener whitelist, permisos y operaciones de creación/edición/transición.
- `backend/src/modules/odc/infrastructure/entities/`, `mappers/`,
  `repositories/` y controller: columnas, persistencia atómica, serialización,
  consultas de dashboard y resumen mensual.
- `backend/scripts/sql/` y `backend/test/`: nueva migración posterior a 040,
  comprobación de precondiciones y pruebas de PostgreSQL aislado.
- `frontend/src/lib/odc.ts`, formulario, detalle y vistas ejecutivas/mensuales:
  tipos, cálculo de vista previa, desglose persistido y agregados de totales.
- Tests de dominio, límites HTTP, repositorio, mapper, flujos, UI y migración,
  con R-ids en sus nombres.

## Alternativas descartadas

- Calcular IVA por partida y sumar: puede diferir del redondeo único acordado.
- Aplicar 16 % retroactivamente a todas las ODC: altera importes históricos.
- Usar `vatCents === 0` como marcador histórico: falla en importes pequeños
  de nuevas ODC cuya tasa es 16 % pero el IVA redondea a cero.
- Implementar un concentrado nuevo dentro de esta feature: corresponde a una
  spec posterior con su propio gate humano.
