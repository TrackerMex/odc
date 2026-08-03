---
feature: "executive-dashboard-visual-refinement"
status: approved
tags: [harness, spec, dashboard, frontend, visual-refinement]
---

# Diseño — [[executive-dashboard-visual-refinement]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Composición frontend sin cambios de datos**: reorganizar exclusivamente `ExecutiveDashboard` y sus componentes internos para reutilizar el snapshot ya cargado por la ruta autenticada. No se cambia `ExecutiveDashboardResponse`, `getExecutiveDashboard`, rutas ni backend (R1-R5).

- **Prioridad como superficie dominante**: convertir la cola prioritaria en una tarjeta de trabajo amplia, con una cabecera informativa y filas en cuadrícula que separen identidad de ODC/proveedor, estado, antigüedad, importe y acción. En móvil, las filas se apilan sin ocultar la acción (R2, R4).

- **Pulso legible, no decorativo**: crear cuatro tarjetas de resumen compactas con iconos de `lucide-react`, tipografía tabular y badges/tonos semánticos existentes. La cuarta tarjeta toma el primer elemento de `oldestActiveOrders` y muestra un estado neutral cuando no haya órdenes activas (R3).

- **Contexto balanceado**: presentar antigüedad y proveedores en una cuadrícula de dos columnas a partir de `md`, después de la prioridad y el pulso; los estados vacíos reutilizan el patrón de borde discontinuo de las tarjetas actuales (R4, R5).

- **Sistema visual existente**: mantener `Card`, `Button`, `Alert`, `Skeleton`, `OdcStatusBadge`, tokens Tailwind, tema y foco visible existentes. Se usan neutros como voz principal y color sólo para el significado ya existente de los estados (R1-R5).

## Archivos afectados

- `frontend/src/components/odc/executive-dashboard.tsx` — nueva composición, jerarquía, tarjetas de pulso y responsive del dashboard.
- `frontend/src/components/odc/executive-dashboard.test.tsx` — pruebas de los requisitos visuales y de comportamiento preservado.

## Alternativas descartadas

- **Añadir endpoint o datos históricos para gráficas**: se descarta porque el objetivo se cumple con el snapshot actual y no se permiten datos ficticios (R3).
- **Copiar la paleta naranja de la referencia**: se descarta porque contradice el sistema de ODC, que reserva el color para estados semánticos (R1-R5).
- **Modificar los componentes de detalle o el sidebar**: se descarta para mantener el alcance en la superficie del dashboard (R1-R5).
