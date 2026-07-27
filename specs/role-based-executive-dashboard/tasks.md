---
feature: "role-based-executive-dashboard"
status: draft
tags: [harness, spec, dashboard, roles]
---

# Tareas — [[role-based-executive-dashboard]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — Cargar un snapshot ejecutivo único por rol

- [ ] (1) Escribir tests que fallen para el loader, cliente API, caso de uso y controlador de R1.
- [ ] (2) Implementar el contrato, endpoint y loader mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R2 — Limitar tareas a las responsabilidades del rol y al creador cuando aplique

- [ ] (1) Escribir tests mockeados del caso de uso/repositorio para las tres matrices de estados y la propiedad del creador.
- [ ] (2) Implementar los filtros de tarea mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R3 — Priorizar, limitar y describir tareas accionables

- [ ] (1) Escribir tests que fallen para orden de antigüedad, máximo cinco, total y campos de prioridad en backend y UI.
- [ ] (2) Implementar la prioridad y sus enlaces mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R4 — Ofrecer sólo los accesos operativos permitidos para Dirección de Operaciones

- [ ] (1) Escribir tests de componente que fallen para crear ODC, registrar pago, completar factura y reabrir borrador/rechazada, y la ausencia de acciones no permitidas.
- [ ] (2) Implementar el mapa de acciones y enlaces mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R5 — Comparar compras pagadas del mes contra el mes anterior

- [ ] (1) Escribir tests mockeados para los filtros mensuales, totales, conteos, mes anterior y variaciones, incluido denominador cero.
- [ ] (2) Implementar el pulso mensual mínimo que los pasa.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R6 — Mostrar las órdenes públicas activas de mayor antigüedad

- [ ] (1) Escribir tests que fallen para estados incluidos/excluidos, orden, límite y cálculo de días UTC completos.
- [ ] (2) Implementar la consulta y presentación de antigüedad mínimas que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R7 — Agrupar los principales proveedores del periodo

- [ ] (1) Escribir tests que fallen para agrupación, orden de empate, límite y estado vacío de proveedores.
- [ ] (2) Implementar el ranking y su estado vacío mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R8 — Resolver carga, error recuperable y ausencia de tareas

- [ ] (1) Escribir tests de UI que fallen para `aria-busy`, error con reintento y vacío de tareas sin ocultar indicadores.
- [ ] (2) Implementar los estados mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R9 — Mantener prioridad y accesibilidad en escritorio, móvil y movimiento reducido

- [ ] (1) Escribir tests que fallen para orden semántico, etiquetas, foco/enlaces y clases responsive/reduced-motion.
- [ ] (2) Implementar la composición accesible y responsive mínima que los pasa.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R10 — Derivar autorización exclusivamente de la sesión

- [ ] (1) Escribir tests de controlador/caso de uso que fallen para actor de sesión, rol desconocido y ausencia de filtrado controlable por cliente.
- [ ] (2) Implementar la derivación de actor y el rechazo mínimos que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R11 — Evitar consultas N+1 en el snapshot ejecutivo

- [ ] (1) Escribir tests de repositorio que fallen para las consultas agregadas/acotadas y que no invocan una consulta por fila.
- [ ] (2) Implementar las consultas TypeORM mínimas que los pasan.
- [ ] (3) Refactorizar manteniendo los tests verdes.

## R12 — Consultar y recorrer todas las tareas accionables

- [X] (1) Escribir tests que fallen para el endpoint paginado, la ruta y el enlace desde la prioridad.
- [X] (2) Implementar la consulta, vista reutilizada y navegación mínima que los pasan.
- [X] (3) Refactorizar manteniendo los tests verdes.
