# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Director de Operaciones: crea y envía órdenes de compra, registra pagos y completa el cierre operativo.
- Administración: valida o rechaza presupuestos y adjunta la evidencia de pago correspondiente.
- Director General: aprueba o rechaza compras una vez validado el presupuesto.

## Product Purpose

ODC es un sistema interno de gestión de órdenes de compra. Permite crear, aprobar, pagar, documentar y consultar compras con rapidez operativa y una trazabilidad auditable de cada cambio.

## Positioning

ODC convierte el ciclo completo de una compra en un flujo de roles y estados verificables: desde el borrador hasta la factura y la evidencia de pago, con historial asociado a cada orden.

## Operating Context

El producto se utiliza en operaciones administrativas internas. Las órdenes tienen una numeración anual y transitan entre etapas de borrador, revisión presupuestal, aprobación de compra, pago, evidencia de pago y cierre con factura. Los usuarios trabajan con proveedores, presupuestos, comprobantes de pago y facturas.

## Capabilities and Constraints

- Autenticación de usuarios y control de acceso por rol.
- Creación y edición de borradores de ODC, seguimiento de estado e historial de transiciones.
- Validación y aprobación presupuestal, aprobación de compra, registro de pagos y carga de evidencia y factura.
- Catálogo de proveedores y vistas de consulta para los distintos roles.
- La interfaz y el contenido operativo se presentan en español.
- No se han confirmado restricciones de cumplimiento, accesibilidad, marca ni entorno de uso adicionales.

## Evidence on Hand

- [Plan funcional del sistema](plans/001-odc-purchase-system.md).
- Flujos implementados en `frontend/src/routes/` y módulos de dominio en `backend/src/modules/odc/`.
- La próxima capacidad especificada es el resumen mensual de operaciones para `DIRECTOR_OPS` en `specs/operations-monthly-summary/`.
- No hay testimonios, casos de estudio, métricas de producto ni activos de marca confirmados; no deben inventarse.

## Product Principles

1. Cada compra debe tener un recorrido verificable y atribuible.
2. Los controles deben proteger el presupuesto sin frenar innecesariamente la operación.
3. Las tareas de cada rol deben ser claras, acotadas y coherentes con su responsabilidad.
4. La documentación de pago y factura debe permanecer vinculada a la orden correspondiente.
5. La rapidez operativa no debe sacrificar control ni auditabilidad.
