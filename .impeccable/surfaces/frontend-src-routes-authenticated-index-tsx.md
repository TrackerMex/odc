---
version: 1
slug: "frontend-src-routes-authenticated-index-tsx"
primary_target: "frontend/src/routes/_authenticated/index.tsx"
related_targets: ["frontend/src/components/odc/odc-dashboard.tsx","frontend/src/components/odc/admin-dashboard.tsx","frontend/src/components/odc/general-dashboard.tsx"]
---

# Dashboard ejecutivo

## Job and audience

- **Mode:** Operate.
- **Audience:** Director de Operaciones, Administración y Director General, con mayor frecuencia de uso por Dirección de Operaciones.
- **Job:** entender qué requiere atención inmediata y completar o revisar el siguiente paso sin recorrer múltiples colas.

## Outcome and proof

- El primer bloque responde a “¿qué aprobaciones o tareas pendientes requieren mi intervención ahora?”.
- Cada rol ve exclusivamente sus propias tareas pendientes; las acciones directas de Dirección de Operaciones son crear ODC, registrar pago, completar factura, reabrir borrador y reabrir rechazada.
- La consulta añade antigüedad de órdenes, proveedores y tendencia mensual frente al mes anterior como contexto verificable, no como métricas decorativas.

## Selected direction

- **Visual authority:** conservar `DESIGN.md` — Panel ejecutivo sobrio, capas suavemente elevadas, neutros y color reservado a estado.
- **Thesis:** una franja de prioridad abre la pantalla con los casos que bloquean el flujo; debajo, una lectura compacta de salud operativa explica por qué requieren atención y cómo evoluciona el periodo.
- **Focal moment:** una cola priorizada de acciones pendientes muestra estado, importe, antigüedad y siguiente acción inequívoca; desde ahí el usuario entra al detalle o ejecuta la acción permitida.
- **Implementation consequence:** la ruta autenticada sigue resolviendo paneles por rol, pero necesita una composición común de prioridades y datos agregados para antigüedad, proveedores y comparación mensual.

## Scope and boundaries

- Rediseñar la superficie de inicio autenticada y los tres dashboards de rol; no alterar el flujo de detalle de ODC ni el lenguaje visual global.
- Reutilizar tarjetas, badges, tablas, foco visible, tema claro/oscuro y el sidebar existentes.
- Antimetas: un dashboard genérico de gráficas, una cola única que mezcle responsabilidades, o nuevos acentos de marca.

## States and ranges

- Estados obligatorios: sin tareas, datos cargando, error recuperable, una o varias tareas pendientes y acciones sin permiso.
- Mantener pendientes por rol como fuente de acción; mostrar sólo un conjunto priorizado y enlazar a la lista completa cuando haya más resultados.
- Las tendencias comparan el mes en curso con el anterior. Antigüedad, ranking de proveedores y definición del alcance de métricas agregadas requieren datos de backend; no se simularán.

## Interaction and layout

- Orden: prioridad inmediata → pulso operativo del periodo → tendencias y proveedores → acceso a las colas completas.
- En escritorio, prioridad y pulso comparten el primer nivel; en móvil, la prioridad y su siguiente acción preceden a cualquier métrica secundaria.
- Los cambios de filtro, carga y finalización de una tarea deben ofrecer feedback de estado breve y respetar movimiento reducido.

## Constraints and open decisions

- Aplicación web en español, con permisos existentes por rol y accesibilidad/foco coherentes con los componentes actuales.
- Decidir en implementación cómo se calcula la antigüedad (desde creación o último cambio de estado) y el alcance de métricas históricas para cada rol.
- Ampliar la API sólo con datos reales necesarios para la comparación mensual y proveedores; no inventar presupuestos ni objetivos.
