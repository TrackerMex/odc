---
feature: "odc-draft-editing"
status: approved        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-draft-editing]]

## R1/R5 — Visibilidad del formulario

- [x] Añadir primero tests de ruta para BORRADOR del creador, rol incorrecto,
  creador incorrecto y regresión de RECHAZADA.
- [x] Ajustar la condición de edición en `$id.tsx`.

## R2 — Guardar cambios manteniendo BORRADOR

- [x] Añadir test del formulario para PATCH sin submit y actualización local.
- [x] Implementar el comportamiento mínimo si el test revela una carencia.

## R3 — Enviar cambios a Administración

- [x] Añadir test de orden PATCH → submit y status final.
- [x] Implementar el comportamiento mínimo si el test revela una carencia.

## R4 — Errores y reintento

- [x] Añadir tests de fallo de PATCH y submit.
- [x] Ajustar mensajes/estado del formulario si es necesario.

## Verificación

- [x] Actualizar `traceability.md` en cada commit que cubra requisitos.
- [x] Ejecutar `./init.sh`, build, tests y lint.
