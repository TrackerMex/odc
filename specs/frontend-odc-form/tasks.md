---
feature: "frontend-odc-form"
status: approved        # draft | approved
tags: [frontend, odc, spec]
---

# Tareas — [[frontend-odc-form]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> se ejecuta como test rojo → implementación mínima → refactor con tests verdes.

## R1 — Dashboard DIRECTOR_OPS con cuatro contadores y listas

- [ ] (1) Escribir tests que fallen para las cuatro consultas filtradas, totales, listas y enlaces al detalle
- [ ] (2) Implementar las cargas y el dashboard
- [ ] (3) Refactorizar componentes compartidos con tests verdes

## R2 — Formulario de creación con campos y metadatos informativos

- [ ] (1) Escribir tests que fallen para campos obligatorios, usuario y valores de número/fecha
- [ ] (2) Implementar la ruta y el formulario de creación
- [ ] (3) Refactorizar el modelo de formulario con tests verdes

## R3 — Selector de proveedores desde el catálogo

- [ ] (1) Escribir tests que fallen para la carga, orden y payload del proveedor
- [ ] (2) Implementar el selector conectado a `GET /api/suppliers`
- [ ] (3) Refactorizar carga y estados vacíos/error con tests verdes

## R4 — Total en vivo y conversión MXN → centavos

- [ ] (1) Escribir tests que fallen para total, decimales y ausencia de `totalCents`
- [ ] (2) Implementar cálculo y conversión de importe
- [ ] (3) Refactorizar formateadores con tests verdes

## R5 — Guardar como borrador

- [ ] (1) Escribir tests que fallen para `POST /api/odcs` y navegación al detalle
- [ ] (2) Implementar el guardado de borrador
- [ ] (3) Refactorizar la acción con tests verdes

## R6 — Crear y enviar a Administración

- [ ] (1) Escribir tests que fallen para la secuencia create → submit y bloqueo de duplicados
- [ ] (2) Implementar el envío encadenado
- [ ] (3) Refactorizar estados de envío con tests verdes

## R7 — Detalle con historial

- [ ] (1) Escribir tests que fallen para datos principales, historial y formato
- [ ] (2) Implementar la ruta de detalle
- [ ] (3) Refactorizar las secciones visuales con tests verdes

## R8 — Edición de ODC rechazada

- [ ] (1) Escribir tests que fallen para motivo, precarga y `PATCH`
- [ ] (2) Implementar edición reutilizando el formulario
- [ ] (3) Refactorizar el modo crear/editar con tests verdes

## R9 — Reenvío de ODC rechazada

- [ ] (1) Escribir tests que fallen para `PATCH` → `submit` y estado final
- [ ] (2) Implementar el reenvío
- [ ] (3) Refactorizar la acción con tests verdes

## R10 — Errores, preservación de valores y reintento

- [ ] (1) Escribir tests que fallen para errores API/red en cada operación
- [ ] (2) Implementar feedback y reintento sin perder el formulario
- [ ] (3) Refactorizar el mapeo de errores con tests verdes

## R11 — Estados de carga y accesibilidad

- [ ] (1) Escribir tests que fallen para loading, disabled y mensajes `role="alert"`
- [ ] (2) Implementar feedback accesible
- [ ] (3) Refactorizar estados compartidos con tests verdes

## R12 — Layout responsive y textos en español

- [ ] (1) Escribir tests que fallen para labels/textos y estructura responsive
- [ ] (2) Implementar el layout final
- [ ] (3) Refactorizar estilos con tests verdes
