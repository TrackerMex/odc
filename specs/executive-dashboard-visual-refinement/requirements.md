---
feature: "executive-dashboard-visual-refinement"
status: approved
tags: [harness, spec, dashboard, frontend, visual-refinement]
---

# Requisitos — [[executive-dashboard-visual-refinement]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

## Requisitos funcionales

- **R1**: WHEN un usuario de negocio abre el dashboard ejecutivo, THE SYSTEM SHALL presentar un encabezado con su área según el rol, saludo, mes del snapshot y el acceso «Crear ODC» únicamente para `DIRECTOR_OPS`, sin modificar la ruta, el contrato ni los permisos vigentes.

- **R2**: WHEN el snapshot contiene tareas prioritarias, THE SYSTEM SHALL mostrar la cola como el bloque visual principal con estado, número de ODC, descripción, proveedor, antigüedad, importe y siguiente acción; cada acceso SHALL conservar sus enlaces y restricciones actuales por rol. WHILE no existan tareas, THE SYSTEM SHALL conservar un estado vacío comprensible dentro del mismo bloque.

- **R3**: WHEN se muestra el pulso operativo, THE SYSTEM SHALL mostrar tarjetas compactas para tareas prioritarias, compras pagadas, importe pagado y mayor antigüedad, derivadas exclusivamente de `priority`, `pulse` y `oldestActiveOrders`; las variaciones mensuales SHALL comunicar su semántica sin crear métricas, gráficas ni datos ficticios.

- **R4**: WHEN el dashboard contiene contexto secundario, THE SYSTEM SHALL mostrar órdenes activas con mayor antigüedad y proveedores del periodo como módulos equilibrados después de la prioridad y el pulso. WHILE el viewport sea menor a `640px`, THE SYSTEM SHALL conservar el orden semántico prioridad, pulso y contexto, sin recorte horizontal ni pérdida de acciones.

- **R5**: WHILE se cargan, faltan datos o falla el snapshot, THE SYSTEM SHALL conservar los estados de carga, vacío y error recuperable existentes, con etiquetas accesibles, foco visible, tema claro/oscuro y movimiento reducido.

## Fuera de alcance

- Cambiar APIs, contratos TypeScript, backend, permisos, rutas o reglas del flujo de compra.
- Introducir una paleta de marca naranja, gráficas decorativas, dependencias visuales nuevas o métricas no respaldadas por el snapshot existente.
- Rediseñar el sidebar, las pantallas de detalle de ODC o el resumen mensual independiente.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-27) ← gate obligatorio antes de implementar
