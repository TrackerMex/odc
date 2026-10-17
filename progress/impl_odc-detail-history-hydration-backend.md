# impl: odc-detail-history-hydration — backend
Fecha: 2026-10-17 (America/Mexico_City)

## Archivos creados
- `progress/impl_odc-detail-history-hydration-backend.md` — evidencias backend R1-R3 para el leader/reviewer.

## Archivos modificados
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts` — create/update cargan filas persistidas de historial mediante el mismo manager transaccional, después de escrituras/asociación del ticket y antes del mapper. Orden `createdAt ASC`, igual que findById. Sólo diez líneas añadidas; se preservan CAS por versión/estado, retry de número y locks de ticket.
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.spec.ts` — regresiones de create, transición, edición sin evento y fallos de lectura; mock find con [] por defecto y distinción por entidad para numeración/historial.
- `backend/test/odc-concurrent-updates.e2e-spec.ts` — reutiliza PostgreSQL aislado para comprobar respuestas completas, HTTP real Nest/Multer/JWT para ambos endpoints, rollback de create/update/ticket y recuperación de ambos archivos ante lectura fallida. Sólo el proveedor externo de archivos se simula; repositorio, transacción, mapper, use cases y controlador son reales.

## Requisitos cubiertos
Todos los ciclos usan test rojo `338437411c0899289c603ac0ebe81c888ff2aa9b` antes del fix `def69830e9a562c896add63d462409937f6b3402`. Refinamiento exclusivo de tipos del test e2e después de verde: `b374475373a99c58b3a28350fcdbde9b3c405a01` (sin cambiar los asserts ni producción).

- R1: `purchase-order.typeorm.repository.spec.ts::R1: create returns persisted opening metadata rather than the unsaved input`; `R1: transition returns every persisted event with its stored metadata in chronological order`; `R1: an edit returns unchanged persisted history without inserting or duplicating events`. E2e: `odc-concurrent-updates.e2e-spec.ts::R1: create and an ordinary edit return the complete stored history with no extra event`.
- R2: `odc-concurrent-updates.e2e-spec.ts::R2: POST $path returns old events plus the newly persisted transition without another detail read` parametrizado para payment-evidence/invoice. Envía multipart HTTP autorizado, verifica historial previo y transición, IDs/actor/nota/fecha persistidos, estado/documento y una sola carga de detalle previa a la subida. `R2,R3: failed $path response read preserves history and compensates only the unassociated file` comprueba que la respuesta del detalle anterior sigue siendo válida después de rollback y se limpia sólo el publicId del ticket fallido. El leader une esta evidencia con las regresiones visuales frontend R2.
- R3: unitario `R3: %s rejects if transactional response history cannot be read` para create/update. E2e `R3: failed response-history read rolls back a newly created order and its opening event`; `R3: failed response-history read rolls back the order, transition and upload association`; ambas variantes del fallo de subida anterior. Se observan estado/version/archivo/historial/ticket desde la segunda conexión real. Suites #36 y #38 completas verdes, incluida protección de archivo asociado ante commit ambiguo y fencing de recuperación.

## Decisiones de diseño
- La lectura forma parte de la transacción existente; si falla, no se entrega una respuesta confirmada ni se confirman escrituras parciales.
- Se devuelve historial de BD, sin fabricar IDs/eventos ni utilizar el historial del objeto recibido. Una edición ordinaria lee pero no agrega historial.
- No hay cambios en dominio/aplicación, esquema, DTO público ni flujo cliente. No se añade GET reparador.
- Fallos se inyectan sólo en manager.find de OdcStatusHistoryOrmEntity dentro de una transacción real. La consulta de numeración y las lecturas externas usan PostgreSQL normalmente. No se usa mock de transaction para demostrar rollback.

## Output de build
```
node <pnpm 10.34.6 cached CLI> --dir backend build
> backend@0.0.1 build C:\sites\odc\backend
> nest build
exit 0
```

## Output de tests
Tras INIT_GREEN del leader se escribieron sólo tests, se verificó rojo y se hizo commit inmediato antes de tocar producción:
```
Jest purchase-order.typeorm.repository.spec.ts, antes del fix:
Test Suites: 1 failed, 1 total
Tests: 5 failed, 8 passed, 13 total
Fallos esperados: history=[] en create/transición/edición y lectura faltante no rechaza create/update.

PostgreSQL aislado odc-concurrent-updates.e2e-spec.ts, antes del fix:
Test Suites: 1 failed, 1 total
Tests: 7 failed, 16 passed, 23 total
Fallos esperados: history=[] en creación y ambos POST; falta rechazo/rollback/compensación al fallar lectura.
```
Después del fix:
```
Jest purchase-order.typeorm.repository.spec.ts:
Test Suites: 1 passed, 1 total
Tests: 13 passed, 13 total
Time: 1.437 s

Jest --runInBand (backend completo):
Test Suites: 73 passed, 73 total
Tests: 885 passed, 885 total
Time: 20.097 s

bash backend/scripts/verify-postgres-hardening.sh odc-concurrent-updates.e2e-spec.ts odc-orphan-file-recovery.e2e-spec.ts
Test Suites: 2 passed, 2 total
Tests: 38 passed, 38 total
Time: 6.751 s

Mismo comando tras refinamiento de tipos del test:
Test Suites: 2 passed, 2 total
Tests: 38 passed, 38 total
Time: 5.742 s, estimated 7 s
```
Se empleó Docker Desktop con contenedor efímero del script oficial, puerto aleatorio local, esquema aislado y limpieza por trap. No se usó BD compartida ni Cloudinary real.

## Formato y lint
- Prettier --check sobre los tres archivos cambiados: todos usan formato correcto.
- ESLint sobre los tres archivos cambiados: exit 0 tras refinar tipos de supertest, EntityManager.find y asymmetric matchers.
- El primer intento de prettier sin elevación encontró EPERM al leer dependencias. Se repitió elevado con éxito. Todas las verificaciones siguientes usaron herramientas locales existentes.

## Notas para el reviewer
- Repetir suites PostgreSQL #36/#38 con el script oficial si necesita confirmar rollback real; las nuevas regresiones son siete, la suite concurrent totaliza 23 y recovery 15.
- El test HTTP compara su historial directamente con filas obtenidas por la segunda conexión y exige los eventos anteriores; no hay respuesta simulada con historial prefabricado.
- El leader mantiene feature_list/current/history y trazabilidad compartida. No se declara done global desde este reporte; pendientes revisión independiente y init final coordinados por leader.
