---
feature: "frontend-odc-form"
status: approved        # draft | approved
tags: [frontend, odc, spec]
---

# Tareas — [[frontend-odc-form]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> se ejecuta como test rojo → implementación mínima → refactor con tests verdes.

## R1 — Dashboard DIRECTOR_OPS con cuatro contadores y listas

- [x] (1) Escribir tests que fallen para las cuatro consultas filtradas, totales, listas y enlaces al detalle
- [x] (2) Implementar las cargas y el dashboard
- [x] (3) Refactorizar componentes compartidos con tests verdes

## R2 — Formulario de creación con campos y metadatos informativos

- [x] (1) Escribir tests que fallen para campos obligatorios, usuario y valores de número/fecha
- [x] (2) Implementar la ruta y el formulario de creación
- [x] (3) Refactorizar el modelo de formulario con tests verdes

## R3 — Selector de proveedores desde el catálogo

- [x] (1) Escribir tests que fallen para la carga, orden y payload del proveedor
- [x] (2) Implementar el selector conectado a `GET /api/suppliers`
- [x] (3) Refactorizar carga y estados vacíos/error con tests verdes

## R4 — Total en vivo y conversión MXN → centavos

- [x] (1) Escribir tests que fallen para total, decimales y ausencia de `totalCents`
- [x] (2) Implementar cálculo y conversión de importe
- [x] (3) Refactorizar formateadores con tests verdes

## R5 — Guardar como borrador

- [x] (1) Escribir tests que fallen para `POST /api/odcs` y navegación al detalle
- [x] (2) Implementar el guardado de borrador
- [x] (3) Refactorizar la acción con tests verdes

## R6 — Crear y enviar a Administración

- [x] (1) Escribir tests que fallen para la secuencia create → submit y bloqueo de duplicados
- [x] (2) Implementar el envío encadenado
- [x] (3) Refactorizar estados de envío con tests verdes

## R7 — Detalle con historial

- [x] (1) Escribir tests que fallen para datos principales, historial y formato
- [x] (2) Implementar la ruta de detalle
- [x] (3) Refactorizar las secciones visuales con tests verdes

## R8 — Edición de ODC rechazada

- [x] (1) Escribir tests que fallen para motivo, precarga y `PATCH`
- [x] (2) Implementar edición reutilizando el formulario
- [x] (3) Refactorizar el modo crear/editar con tests verdes

## R9 — Reenvío de ODC rechazada

- [x] (1) Escribir tests que fallen para `PATCH` → `submit` y estado final
- [x] (2) Implementar el reenvío
- [x] (3) Refactorizar la acción con tests verdes

## R10 — Errores, preservación de valores y reintento

- [x] (1) Escribir tests que fallen para errores API/red en cada operación
- [x] (2) Implementar feedback y reintento sin perder el formulario
- [x] (3) Refactorizar el mapeo de errores con tests verdes

## R11 — Estados de carga y accesibilidad

- [x] (1) Escribir tests que fallen para loading, disabled y mensajes `role="alert"`
- [x] (2) Implementar feedback accesible
- [x] (3) Refactorizar estados compartidos con tests verdes

## R12 — Layout responsive y textos en español

- [x] (1) Escribir tests que fallen para labels/textos y estructura responsive
- [x] (2) Implementar el layout final
- [x] (3) Refactorizar estilos con tests verdes
