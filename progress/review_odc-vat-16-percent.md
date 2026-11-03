# review: odc-vat-16-percent
Fecha: 2026-11-03
Veredicto final: APROBADO para el estado corregido hasta `9af0873`.

Revisión de la implementación hasta `53f192d`. El implementador inició
correcciones después de recibir los hallazgos; este veredicto corresponde al
estado revisado y debe repetirse sobre las correcciones.

## Checklist C2 — Estado coherente
- [x] Una sola feature `in_progress`: `odc-vat-16-percent`.
- [x] `progress/current.md` describe la sesión activa y la verificación.

## Checklist C3 — Arquitectura
- [x] El dominio no importa ORM, infraestructura ni IO.
- [x] El contrato de repositorio pertenece al dominio y la aplicación depende
  de interfaces; la infraestructura implementa persistencia y mapeo.

## Checklist C4 — TDD
- [x] R1–R7 cuentan con tests que nombran sus identificadores.
- [x] La historia muestra commits de test separados y anteriores a los commits
  de implementación; las correcciones posteriores incluyen pruebas.

## Checklist C5 — Trazabilidad
- [x] `traceability.md` tiene una fila por requisito y ninguna fila pendiente.
- [x] Los commits de implementación emplean el scope y los R-ids requeridos.

## Checklist C6 — Spec aprobada
- [x] `requirements.md` declara `status: approved` y la casilla humana está
  marcada con fecha 2026-11-03; los requisitos no cambiaron tras la firma.

## Hallazgos funcionales

1. **R6/R7 — la migración admite partidas no hidratables.**
   `backend/scripts/sql/041-odc-vat.sql` comprueba cantidad, precio y suma,
   pero no verifica que `description` y `unit` no estén vacías ni que la
   posición sea válida. `040a-reconcile-missing-items.sql` tampoco verifica
   esas propiedades en las partidas ya existentes. Las tablas creadas por
   TypeORM pueden carecer de los CHECK de la migración 040. En PostgreSQL
   desechable se insertó una orden de 100 centavos con una partida con
   descripción de espacios y unidad vacía: `041` terminó con `COMMIT` y
   exit 0, aunque el dominio rechaza esa partida al hidratarla. El script
   debe abortar antes de cambiar el esquema e identificar la ODC afectada.

2. **R7 — la hidratación puede ocultar partidas faltantes.**
   `backend/src/modules/odc/infrastructure/mappers/purchase-order.mapper.ts`
   omite `items` cuando la consulta devuelve cero filas, y el constructor de
   `PurchaseOrder` reconstruye una partida desde las columnas escalares aun
   cuando la fila ya contiene los campos fiscales. Para una ODC de una sola
   partida con desglose fiscal coherente, eliminar sus filas de partidas queda
   oculto y una mutación posterior puede volver a insertarlas. `create`,
   `update`, `findById` y `findAll` pasan las filas consultadas al mapper, y
   R6/R7 exigen comprobar el desglose frente a las partidas persistidas.
   `purchase-order.vat.mapper.spec.ts` actualmente prueba la hidratación sin
   filas como caso exitoso, por lo que no detecta esta inconsistencia.

3. **R7 — precio sin precisión segura causa excepción sin mensaje de campo.**
   `frontend/src/lib/odc.ts` acepta en el esquema un precio positivo como
   `90071992547409.92`, pero `parseUnitPriceCents` devuelve `null` por exceder
   el entero seguro y `buildOdcPayload` lanza `Invalid unit price`.
   `validatedPayload`/`runAction` en `odc-form.tsx` no capturan ese error, de
   modo que guardar o enviar no informa al usuario del dato inválido. Es una
   ruta preexistente afectada por el requisito de límites R7; debe rechazarse
   de forma controlada sin persistir.

## Output de `./init.sh`

La ejecución independiente usó Git Bash y una copia LF temporal de `init.sh`
en la raíz; se retiró al terminar. Resultado:

```text
Build backend/frontend: exitoso
Tooling: 34/34 pruebas
Backend: 86 suites, 953/953 pruebas
Frontend: 41 archivos, 702/702 pruebas
Lint backend: sin errores
✅ Todo verde. Listo para trabajar.
```

Exit code: `0`. La prueba adicional de la migración indicada en el hallazgo 1
usó un contenedor PostgreSQL temporal, eliminado al finalizar; no se ejecutó
ningún script sobre la base del proyecto.

## Segunda revisión — correcciones hasta `5009a36`

Los cambios `6bab6a1` → `dc65dec`, `a857519` → `d769149` y `5009a36`
incluyen pruebas anteriores a la implementación, cobertura de los tres
hallazgos y referencias en la trazabilidad. Se comprueban partidas faltantes
en la hidratación fiscal, validaciones de campos y montos en el formulario y
precondiciones adicionales antes de migrar. La ejecución completa de `init.sh`
posterior a estos cambios está a cargo del implementador.

**Hallazgo adicional R6/R7 — espacios Unicode:** el patrón PostgreSQL
`[^[:space:]]` acepta U+FEFF como contenido, mientras que `String.trim()` del
dominio lo elimina. Se verificó que PostgreSQL devuelve verdadero para
`U&'\FEFF' ~ '[^[:space:]]'`. Por tanto, una descripción o unidad formada
solo por ese carácter puede superar las verificaciones de `040a`/`041` y
después fallar en la hidratación. La revisión quedó rechazada hasta verificar
la corrección descrita a continuación.

**Corrección revisada:** `cd68b20` agrega los casos de U+FEFF y `9af0873`
reemplaza la clase de espacio dependiente del locale por la lista de espacios
y terminadores de línea de `String.trim()` de ECMAScript en ambos scripts.
El implementador informó 18/18 pruebas PostgreSQL aisladas verdes. El código
resuelve el hallazgo.

## Veredicto final

Los tres hallazgos iniciales y el hallazgo de espacios Unicode quedaron
corregidos; no se identificaron otros bloqueos. La trazabilidad incluye R1–R7
y las parejas de commits test → implementación de las correcciones.

El implementador ejecutó `init.sh` con resultado 0: builds, 34 pruebas de
tooling, 954 pruebas backend, 707 frontend y lint verdes. Esa ejecución
comenzó antes de los últimos commits `cd68b20`/`9af0873`, que modificaron
únicamente las pruebas y los scripts SQL; el implementador verificó esos
cambios después en PostgreSQL aislado con 18/18 pruebas verdes. No se
aplicaron migraciones a la base del proyecto. La aplicación de migraciones
sigue sujeta a revisar las precondiciones del destino conforme a R6.
