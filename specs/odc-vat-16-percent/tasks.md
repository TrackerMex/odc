---
feature: "odc-vat-16-percent"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Tareas — [[odc-vat-16-percent]]

> Disciplina TDD: cada requisito sigue test rojo, implementación mínima y
> refactor con pruebas verdes. No comenzar antes de la aprobación humana.

## R1 — Cálculo del IVA en ODC nuevas
- [x] (1) Probar una y múltiples partidas, redondeo y tasa 1600 con IVA cero.
- [x] (2) Calcular subtotal, IVA y total en dominio con centavos enteros.
- [x] (3) Refactorizar manteniendo las pruebas y el redondeo agregado.

## R2 — Ediciones y transiciones
- [x] (1) Probar recálculo, transacciones, permisos, conflictos y transiciones.
- [x] (2) Persistir el desglose recalculado en ediciones autorizadas.
- [x] (3) Refactorizar preservando estados e historial.

## R3 — Conservación de registros históricos
- [x] (1) Probar tasa histórica, guardado fallido, envío fallido tras guardar, envío directo, guardar y enviar desde formulario y rechazadas según decisión aprobada.
- [x] (2) Implementar la transición de régimen al guardar borrador histórico.
- [x] (3) Refactorizar lecturas y mutaciones sin conversiones implícitas.

## R4 — Contrato API y permisos
- [x] (1) Probar respuestas, formatos legado/nuevo, whitelist y permisos.
- [x] (2) Exponer el desglose calculado sin aceptar importes fiscales del cliente.
- [x] (3) Refactorizar serialización y compatibilidad.

## R5 — Desglose y agregados
- [x] (1) Probar vista previa proyectada y aviso para borrador histórico, guardado fallido, detalle, aprobación, dashboard y resumen mixto.
- [x] (2) Mostrar importes y usar total final en vistas y agregados existentes.
- [x] (3) Refactorizar presentación y etiquetas sin confundir tasa con IVA cero.

## R6 — Migración y backfill
- [x] (1) Probar migración y rollback en PostgreSQL aislado con estados variados e inconsistencias.
- [x] (2) Crear migración transaccional versionada con precondiciones y backfill.
- [x] (3) Verificar preservación y documentar secuencia de aplicación y reversión operacional.

## R7 — Límites e integridad
- [x] (1) Probar límites, desbordamiento por IVA, hidratación y ausencia de escrituras ante error.
- [x] (2) Validar aritmética entera, límite de almacenamiento y coherencia del agregado.
- [x] (3) Refactorizar reglas y errores con cobertura de regresión.
