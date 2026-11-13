---
feature: "odc-multi-line-items"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Tareas — [[odc-multi-line-items]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> sigue test rojo → implementación mínima → refactor.

## R1 — Modelo de partidas y total agregado

- [x] (1) Escribir tests de dominio para una/múltiples partidas, orden, total y cabecera.
- [x] (2) Implementar el modelo canónico de partidas y el cálculo agregado en el dominio.
- [x] (3) Refactorizar manteniendo propiedades y total de órdenes de una partida.

## R2 — Creación nueva y contrato legado

- [x] (1) Escribir tests de DTO, controller y use-case para ambos formatos y colisión de formatos.
- [x] (2) Implementar normalización de `items[]` y payload escalar como una partida.
- [x] (3) Refactorizar sin duplicar reglas de creación ni cambiar T1.

## R3 — Edición compatible en estados editables

- [x] (1) Escribir tests de PATCH para reemplazo, edición escalar parcial y partidas preservadas.
- [x] (2) Implementar la normalización de actualización y validación de estado/propietario.
- [x] (3) Refactorizar sin alterar estados ni historial de transiciones.

## R4 — Validación por partida y límites agregados

- [x] (1) Escribir tests de entrada HTTP y dominio para límites, tipos y desbordamientos.
- [x] (2) Implementar validación de cada línea y del total antes de persistir.
- [x] (3) Refactorizar errores manteniendo respuestas HTTP 400 estables.

## R5 — Persistencia, respuesta y lectura

- [x] (1) Escribir tests del repositorio/mapper para escritura atómica, orden y proyección legado.
- [x] (2) Implementar entidad hija, persistencia transaccional y `items[]` en respuestas.
- [x] (3) Refactorizar consultas y vistas compactas sin romper listas ni detalles actuales.

## R6 — Backfill versionado

- [x] (1) Escribir prueba sobre PostgreSQL aislado para backfill correcto y rollback por inconsistencia.
- [x] (2) Implementar el SQL transaccional con precondiciones, relación y backfill de una línea por ODC.
- [x] (3) Refactorizar script e invariantes verificando que estado, total e historial se conservan.

## R7 — Formulario y detalle multi-partida

- [x] (1) Escribir tests de interfaz para agregar/quitar líneas, mínimos, errores y presentación.
- [x] (2) Implementar edición dinámica en creación y borradores/rechazadas, y render de todas las líneas.
- [x] (3) Refactorizar con teclado/accesibilidad y estados actuales de guardar/enviar.

---
