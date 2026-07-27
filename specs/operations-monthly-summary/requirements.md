---
feature: "operations-monthly-summary"
status: approved
tags: [backend, frontend, director-ops, odc, reportes, spec]
---

# Requisitos — [[operations-monthly-summary]]

> Notación EARS. Cada requisito tiene un id único e inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `DIRECTOR_OPS` solicita un mes válido con formato `YYYY-MM`, THE SYSTEM SHALL devolver únicamente las ODC cuyo `paymentDate` pertenezca a ese mes y cuyo estado sea `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA` o `COMPLETADA`.
- **R2**: WHEN el resumen mensual contiene compras, THE SYSTEM SHALL devolver el importe total en centavos calculado como la suma de `totalCents`, la cantidad de compras y el ticket promedio en centavos, junto con el detalle de cada ODC elegible.
- **R3**: WHEN el resumen mensual contiene compras, THE SYSTEM SHALL incluir por cada ODC su número, fecha de pago, solicitante, descripción, proveedor, cantidad, unidad, importe total, fecha de entrada a almacén, estado de factura y comentarios u observaciones disponibles.
- **R4**: IF un usuario que no tiene el rol `DIRECTOR_OPS` solicita el resumen mensual THEN THE SYSTEM SHALL responder `403 Forbidden`; IF el mes no cumple el formato `YYYY-MM` THEN THE SYSTEM SHALL responder `400 Bad Request`; IF no existen compras elegibles THEN THE SYSTEM SHALL responder un resumen válido con totales en cero y una lista vacía.
- **R5**: WHEN `DIRECTOR_OPS` abre el resumen mensual desde su dashboard, THE SYSTEM SHALL mostrar una pantalla con selector de mes, total mensual destacado, cantidad de compras, ticket promedio y el detalle de control de las compras, sin reproducir una cuadrícula de Excel.
- **R6**: WHILE se muestra el resumen mensual, THE SYSTEM SHALL mostrar los KPI operativos del mes: importe total, cantidad de compras, ticket promedio, cantidad e importe por etapa de seguimiento (`PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA`, `COMPLETADA`) y tiempo promedio desde `paymentDate` hasta `warehouseEntryDate` para las órdenes que tengan ambas fechas.
- **R7**: WHEN el Director de Operaciones elige exportar el resumen mensual, THE SYSTEM SHALL generar una lámina visual del mes seleccionado como PDF apaisado y como imagen PNG, incluyendo periodo, KPI, total mensual y detalle de compras, con un nombre de archivo que identifique el mes.
- **R8**: WHILE el resumen carga, está vacío, falla o se exporta, THE SYSTEM SHALL comunicar el estado con mensajes comprensibles y controles accesibles, permitir reintentar tras un error recuperable y no presentar datos de otro mes como si pertenecieran al mes seleccionado.
- **R9**: WHEN se implemente la interfaz de esta feature, THE SYSTEM SHALL usar componentes y primitivas de `shadcn/ui` para tarjetas, botones, tabla, selectores, estados y mensajes; solo se permitirá código propio para la composición específica del resumen y la lámina.

## Fuera de alcance

- Envío automático del PDF o PNG por correo, mensajería u otra integración externa; esta feature entrega archivos listos para que Operaciones los comparta.
- Modificar la máquina de estados, registrar pagos nuevos o cambiar los datos de una ODC desde el resumen.
- Reportes de meses sin `paymentDate`, exportaciones XLSX/CSV y catálogos de presupuesto.
- Los demás dashboards, el historial de aprobaciones de Dirección General y el visor de facturas; se tratarán en features separadas.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-26) ← gate obligatorio antes de implementar
