---
feature: "completed-odc-document-review"
status: approved     # draft | approved
tags: [harness, spec]
---

# Tareas — [[completed-odc-document-review]]

> Disciplina TDD: test rojo → implementación mínima → refactor verde.

## R1 — Referencia privada con metadatos reales
- [x] Test que falla para descriptor/serialización y subida
- [x] Implementación mínima
- [x] Refactor verde

## R2 — Firma con tipo y formato reales
- [x] Test que falla para URL sin `resource_type: auto`
- [x] Implementación mínima
- [x] Refactor verde

## R3 — Compatibilidad histórica y errores externos
- [x] Tests que fallan para legacy, 404 y 502
- [x] Implementación mínima
- [x] Refactor verde

## R4 — Permisos y secretos sin regresión
- [x] Extender tests HTTP existentes
- [x] Implementación mínima del mapeo
- [x] Refactor verde

## R5 — Navegación desde completadas
- [x] Test que falla para enlace y contexto
- [x] Implementación mínima
- [x] Refactor verde

## R6 — Vista previa bajo demanda
- [x] Tests que fallan para acciones y diálogo
- [x] Implementación mínima
- [x] Refactor verde

## R7 — Resiliencia y accesibilidad
- [x] Tests que fallan para carga, cierre y fallback
- [x] Implementación mínima
- [x] Refactor verde

## R8 — Integración y solo lectura
- [x] Tests de regresión de ODC completada
- [x] Integrar primitivas y estilos existentes
- [x] Verificación responsive/dark mode verde
