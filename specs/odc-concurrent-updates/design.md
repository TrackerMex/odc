---
feature: odc-concurrent-updates
status: approved
tags: [harness, spec]
---

# Diseño — #36

Las ocho mutaciones del módulo llaman al mismo repository.update después de
leer fuera de la transacción. Reemplazar save incondicional por UPDATE CAS:
`WHERE id = expectedId AND version = expectedVersion AND status = expectedStatus`.
El estado esperado es fromStatus del historial, o el estado de la orden para
edición. Native PostgreSQL garantiza un ganador sin locks globales ni cachés.
UPDATE incrementa version, usa RETURNING para el resultado y comparte la
transacción con insert de historial. Si affected no es 1, error puro de dominio
OdcConcurrentUpdateError; controller compartido lo traduce 409.

Versión readonly en la entidad de dominio (no cambia durante transition/edit),
prop opcional inicial 0 para crear y fixtures, columna int default 0, mapper
bidireccional. El cliente sigue enviando el mismo contrato; protege operaciones
que leen concurrentemente, no ediciones antiguas serializadas desde la UI.
SQL aditivo version para instancias production, sin nueva infraestructura de
migraciones para una sola columna. Aplicarlo en mantenimiento y reiniciar todas
las instancias antes de reabrir escrituras; mezclar versiones no es compatible.

Pruebas: repositorio existente conserva transacción/historial y se adapta al
UPDATE nativo. Nueva suite E2E usa schema UUID exclusivo en PostgreSQL aislado,
dos DataSources con pool max1, barrier común tras findById, casos de uso reales.
El wrapper de lectura sincroniza la carrera; la escritura no se simula. Un
script levanta y destruye exclusivamente su contenedor postgres:16 con puerto
aleatorio en loopback; no usa docker compose de otros proyectos ni .env DB.
También caso fallo FK en historial demuestra rollback, lectura serial de una
nueva versión permite otro éxito y carga de fixtures versión inicial0.
