---
feature: "odc-multi-line-items"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Diseño — [[odc-multi-line-items]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas de capas.

## Decisiones técnicas

- Usar una colección ordenada de partidas como modelo canónico del dominio.
  `PurchaseOrder` calcula `totalCents` a partir de las partidas; la suma y cada
  producto respetan `MAX_ODC_INTEGER` (R1, R4).
- Normalizar el contrato en el límite HTTP: `items[]` reemplaza la colección;
  el formato legado de creación crea una partida y el PATCH escalar modifica
  parcialmente la primera. Rechazar peticiones que mezclen ambos formatos
  evita precedencias implícitas (R2, R3).
- Persistir las partidas en una entidad relacional hija con posición estable.
  Mantener cabecera, sombra escalar de la primera partida y total en
  `purchase_orders` durante compatibilidad. Guardar cabecera/partidas dentro
  de la transacción de repositorio existente para conservar la garantía de
  concurrencia y evitar colecciones parciales (R5).
- Añadir migración SQL versionada que valida el invariante histórico, crea una
  partida por ODC y no toca estados ni historial; abortar transaccionalmente
  si detecta un total histórico inconsistente (R6).
- Adaptar el formulario dinámico y las vistas de detalle/revisión para mostrar
  todas las líneas. Las vistas compactas conservan el resumen legado y añaden
  el conteo de partidas; no se altera el flujo de estados (R3, R7).

## Archivos afectados

- `backend/src/modules/odc/domain/` — entidad/tipo puro de partida, modelo
  `PurchaseOrder`, cálculo y validaciones de dominio.
- `backend/src/modules/odc/application/` — DTOs de creación/actualización y
  casos de uso para normalización de payloads y partidas.
- `backend/src/modules/odc/infrastructure/` — entidad ORM hija, repositorio,
  mapper y respuesta HTTP con `items[]` más campos escalares legados.
- `backend/scripts/sql/040-odc-line-items.sql` — tabla, índice/clave foránea,
  comprobación de datos y backfill transaccional.
- `frontend/src/lib/odc.ts`, `frontend/src/lib/api.ts` — tipos, normalización y
  construcción de payload compatible.
- `frontend/src/components/odc/odc-form.tsx` — edición dinámica de partidas,
  validación, total y recuperación de errores.
- `frontend/src/components/odc/odc-detail.tsx` y superficies compactas de
  revisión/listado — mostrar partidas y número de líneas.
- Tests unitarios de dominio, DTO/use-case, repositorio/mappers y UI; prueba de
  migración PostgreSQL aislada.

## Alternativas descartadas

- Guardar las partidas en JSONB: se descarta para mantener restricciones
  relacionales, orden consultable y mapeo coherente con TypeORM.
- Eliminar de inmediato los campos escalares existentes: se descarta para no
  romper consumidores actuales; se mantienen sincronizados con la primera
  partida.
- Hacer que los cambios de partidas generen eventos de estado: se descarta
  porque editar una ODC actualmente no es una transición y el historial sigue
  representando exclusivamente cambios de estado.

## Compatibilidad

- El backfill mantiene las columnas escalares existentes y rellena la nueva
  relación antes de que la aplicación lea partidas.
- Los nuevos escritores persisten las mismas propiedades de la primera
  partida en las columnas escalares existentes; los lectores antiguos
  conservarán una proyección consistente.
- No se añaden campos fiscales ni se reinterpretan montos en esta feature.

---
