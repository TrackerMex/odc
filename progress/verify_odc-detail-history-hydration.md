# Verificar #40 — historial e hidratación del detalle de ODC

Spec aprobada: `specs/odc-detail-history-hydration/requirements.md`.

## Resultado esperado

Las respuestas de creación/actualización contienen el historial persistido completo. Al subir un comprobante o factura, el detalle conserva los eventos y muestra la transición confirmada sin recargar. Los instantes se muestran en `America/Mexico_City`; pago, factura y almacén mantienen su fecha de calendario. Una ODC nueva muestra `Pendiente` como fecha hasta guardarse.

## Comprobación de interfaz

1. Con Administración, abrir una orden de prueba en `PAGO_REGISTRADO` y observar los eventos existentes. Subir un comprobante PDF/JPG/PNG válido. Confirmar que los eventos anteriores siguen visibles y aparece la nueva transición sin recargar.
2. Con Dirección de Operaciones, abrir esa orden en `EVIDENCIA_PAGO_SUBIDA`, subir una factura válida con sus fechas y confirmar `Completar orden`. Deben permanecer todos los eventos, añadirse el de completada y mostrarse los datos/documento de factura inmediatamente.
3. Intentar un archivo inválido: el error debe conservar la orden e historial previos.
4. Abrir directamente el detalle y el formulario nuevo con servidor UTC y navegador en otra zona (por ejemplo Asia/Tokyo). Comprobar ausencia de errores de hidratación, fechas de eventos en hora de México y funcionamiento de campos, validación y envío. La fecha de pago/factura/almacén conserva el día capturado.
5. En formulario nuevo, `Fecha` debe mostrar `Pendiente`; guardar un borrador de prueba y confirmar que muestra la fecha real de creación.

## Verificación automática

`./init.sh` ejecuta builds backend/frontend, suites completas y lint backend. La prueba PostgreSQL usa exclusivamente el contenedor/esquema temporal del script existente:

```bash
bash backend/scripts/verify-postgres-hardening.sh odc-concurrent-updates.e2e-spec.ts odc-orphan-file-recovery.e2e-spec.ts
```

En este Windows, el pnpm del runtime es v11 e ignora los overrides del package.json. Se utiliza el pnpm10.34.6 ya instalado, sin cambiar dependencias/lockfiles. Se ejecutan exactamente las suites del arnés: Jest `--runInBand` y Vitest `--pool=threads --maxWorkers=2`, manteniendo aislamiento. La ejecución con forks sufrió timeouts de arranque de workers; una suspensión del equipo afectó otra pasada. La evidencia válida es la pasada completa que termina exit0.

La regresión backend cubre respuesta efectiva de ambos endpoints con repositorio y PostgreSQL reales y almacenamiento de archivos de prueba simulado. Los tests frontend comprueban SSR/hydrateRoot con zonas distintas, texto visible, interacción y reemplazo del detalle tras ambas subidas. Una respuesta prefabricada en frontend se usa solo para comprobar la aplicación de ese contrato; no sustituye la regresión de persistencia/HTTP.
## Resultado de cierre

Init final y revisión independiente aprobados: 885 pruebas backend, 691 frontend y 38 PostgreSQL aisladas verdes. Los límites de verificación manual y typecheck adicional se detallan en el reporte consolidado.
