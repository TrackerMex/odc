# impl: odc-detail-history-hydration
Fecha: 2026-10-17 (America/Mexico_City)

## Resultado y alcance

Feature #40, una sola tarea aprobada explícitamente en conversación antes de código. Se corrigieron los dos fallos observados el 8 de octubre: respuesta de mutación sin historial y fechas dependientes de la zona/reloj de render. Revisión independiente aprobada y cierre técnico completado con init verde.

Tres archivos de producción: `PurchaseOrderTypeOrmRepository.create/update` leen las filas reales de historial dentro de la misma transacción; `formatDate` fija `America/Mexico_City`; `OdcForm` muestra `Pendiente` hasta recibir la fecha real de creación. El calendario de pago/factura/almacén conserva UTC. No cambian esquema, DTOs, permisos, dominio, contratos de almacenamiento ni diseño visual.

## Evidencia por requisito

La trazabilidad completa está en `specs/odc-detail-history-hydration/traceability.md`.

- R1/R2/R3: test rojo `3384374` (5 unitarios y 7 PostgreSQL fallan) → fix `def6983`; tipos del test refinados en `b374475`. Respuestas de create/transición/edición y de ambos POST reales contienen historial persistido. Se comprueban rollback de orden/evento/ticket, compensación de ambas subidas y garantías previas de concurrencia/commit ambiguo.
- R4/R7: test rojo `6b80cdc` → fix `2784804`. SSR e hidratación reales de React con defaults de zona distintos y mismo instante; sin `onRecoverableError` después del fix, campos/validación/guardado operativos.
- R5: contrato UTC ya correcto, regresiones verdes `ea4f4c2`, sin fabricar fallo o modificar producción innecesariamente.
- R6/R7: test rojo `0460cba` cruzando medianoche → fix `60bb73b`, fecha pendiente hasta persistencia y fecha real después; payload sin fecha calculada.
- R2 UI: `fd84581`, detalle/formularios/API cliente reales y `setOdc`, fixture HTTP exclusivamente para comprobar aplicación del contrato; timeline previo/nuevo, documentos/estado, error y ausencia de GET reparador. La persistencia real la demuestran los tests PostgreSQL/HTTP anteriores.

## Verificación implementers

- Build backend y build frontend cliente/SSR: exit0.
- Backend completo: 73 suites, 885 tests passed.
- Frontend completo: 41 archivos, 691 tests passed (`--pool=threads --maxWorkers=2`, 62.24s).
- PostgreSQL aislado: 38/38, dos suites (#36 concurrent23 y #38 recovery15), último resultado 5.742s. Contenedor temporal propio eliminado; no se usó base compartida ni proveedor Cloudinary real.
- ESLint/Prettier de archivos cambiados: exit0. `git diff --check` sobre cambios propios sin errores; historial previo del usuario tenía una línea vacía al EOF y se preservó.
- Typecheck frontend adicional: conserva 18 diagnósticos anteriores de tests, ninguno nuevo en los archivos de esta entrega. Este comando extra no se declara verde.
- Init inicial completo del líder: exit0, builds,880backend/672frontend/lint. Se resolvió el runtime pnpm11 que ignoraba overrides usando pnpm10.34.6 ya cacheado y lockfile congelado; no hay cambios de dependencias o lockfiles. Los workers forks sufrieron timeout; threads2 pasó sin desactivar aislamiento ni excluir pruebas. Una suspensión del equipo afectó una pasada anterior.

## Reportes de implementación

- `progress/impl_odc-detail-history-hydration-backend.md`: comandos, conteos, rojo/verde y transacciones/HTTP reales.
- `progress/impl_odc-detail-history-hydration-frontend.md`: SSR/hidratación, UI y límites del typecheck.
- `progress/verify_odc-detail-history-hydration.md`: guía de comprobación de negocio y ejecución de pruebas.

## Notas para revisión y cierre

El reviewer debe repetir init y validar CHECKPOINTS C2-C6 antes de done. Los tests de hidratación usan jsdom y simulan únicamente la zona implícita de Intl porque los threads no actualizan el default ICU al cambiar TZ; el constructor y React SSR/hydrateRoot son reales. No se ha ejecutado una prueba manual en un navegador contra el stack completo ni despliegue. No se modificó información de negocio existente. Cambios previos de routeTree/current/history y configuraciones locales pnpm se conservan fuera de los commits de implementación.
## Cierre

Revisión independiente APROBADA en progress/review_odc-detail-history-hydration.md. Init final del líder exit0: ambos builds, 885 backend, 691 frontend y lint. PostgreSQL aislado 38/38 confirmado por implementer y reviewer. Feature40 done, trazabilidad y tareas completas; sesión archivada y plantilla de current restaurada. No se modificó código después de los checks finales.
