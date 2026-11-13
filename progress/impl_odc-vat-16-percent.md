# Implementación — odc-vat-16-percent

Fecha: 2026-11-03. Spec aprobada por humano en `00e2201`.

## Cambios

- El dominio calcula subtotal, IVA al 16 % redondeado una sola vez y total en
  centavos, valida el límite int32 y conserva la tasa histórica cero. Guardar
  un borrador histórico lo convierte a 16 %; editar una rechazada histórica
  conserva tasa cero. Las transiciones no recalculan importes.
- Entidad ORM, mapper y DTO de respuesta almacenan y exponen el desglose en
  las mismas transacciones que la cabecera y partidas. La whitelist no permite
  al cliente fijar importes fiscales. Listas y agregados existentes suman
  `totalCents` una sola vez, mezclando totales históricos y gravados.
- Formulario, revisión y detalle presentan subtotal, IVA y total. El borrador
  histórico muestra una proyección y aviso antes de guardar; la recuperación
  tras fallo de envío refleja el estado fiscal ya guardado.
- `041-odc-vat.sql` verifica partidas y totales antes de introducir el desglose
  histórico. `040a-reconcile-missing-items.sql` es una operación separada y
  repetible para bases donde la tabla de partidas ya existe pero faltó backfill.
  `docs/odc-vat-migration.md` describe precondiciones y secuencia.

## Trazabilidad

R1–R7, nombres de tests y commits figuran en
`specs/odc-vat-16-percent/traceability.md`. La prueba R3 de fallo de envío
`c562871` precede a su corrección `fe78d22`. Los fallos de importes y límites
de las suites anteriores se ajustaron en `5c9b48d` para reflejar IVA.

## Verificación

- Init inicial: builds, 34 pruebas tooling, 84 suites / 935 pruebas backend,
  41 archivos / 697 pruebas frontend y lint; exit 0.
- Suite backend de integración: 86 suites / 950 pruebas; exit 0 antes de
  añadir dos pruebas adicionales dirigidas de agregación y PATCH.
- Suite frontend: 41 archivos / 701 pruebas; exit 0 antes de añadir la prueba
  dirigida de recuperación R3, que también pasó.
- PostgreSQL aislado: 26 pruebas de persistencia y concurrencia; 7 pruebas de
  reconciliación, migración, secuencia y rollback. Contenedores efímeros
  retirados al terminar.
- Chromium local con API simulada: formulario y detalle en 1440×900 y 390×844
  mostraron subtotal $350, IVA $56 y total $406. Se revisaron capturas y se
  retiraron archivos y servicios temporales; no se consultó la base ODC.
- Build frontend y backend y lint de backend y archivos frontend modificados
  verdes. Typecheck adicional de frontend sigue reportando 16 errores previos
  en tests ajenos a esta feature; el typecheck global adicional de backend
  también presenta errores previos de mocks. El build oficial excluye tests.
- Init actualizado tras el último cambio: builds, 34 pruebas tooling,
  86 suites / 953 pruebas backend, 41 archivos / 702 pruebas frontend y lint;
  exit 0. Validación de registros fiscales incompletos: `2880dcf` → `36cf812`.
  Segunda revisión independiente: aprobada tras las correcciones. Un último
  `init.sh` posterior al ajuste SQL terminó exit 0: 34 pruebas tooling, 954
  backend, 707 frontend, builds y lint verdes.

## Correcciones de la primera revisión

La revisión inicial rechazó la entrega por tres riesgos: migraciones que no
validaban algunas partidas históricas inválidas, hidratación que ocultaba
partidas faltantes y formulario que permitía importes fuera de límites. Las
pruebas fallaron antes de las correcciones `6bab6a1` → `dc65dec`; los mensajes
de valores inválidos se cubrieron y ajustaron en `a857519` → `d769149`. Se
actualizaron los mocks de repositorio en `5009a36`. Las pruebas dirigidas
pasaron. La segunda revisión identificó una diferencia entre `String.trim()` y
la expresión SQL dependiente del locale: `cd68b20` → `9af0873` la corrigió.
Las 18 pruebas SQL pasaron en PostgreSQL aislado.

El frontend y backend se detuvieron durante la preparación del esquema. Se
creó un respaldo local, se restauró y se ensayaron ambas migraciones en una
copia aislada antes de aplicarlas a la base local.

## Nota para revisión y aplicación

La lectura de la base local del 3 de noviembre encontró 10 órdenes y 8 sin
partidas persistidas; las 8 cabeceras eran coherentes y las 2 órdenes con
partidas tenían sumas consistentes. Se respaldó y restauró la base local en
PostgreSQL aislado y se ensayaron y aplicaron `040a` y `041`: 8 partidas
reconciliadas y 10 órdenes con tasa cero e importes intactos; se compararon
las cabeceras y los conteos de 56 eventos de historial. No se migró ninguna
base compartida.
