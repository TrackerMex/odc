# Auto-revisión — #38

Auto-revisión del mismo agente, sin atribuir revisión independiente ni prueba
manual al usuario. Aprobación de spec y cierre por delegación expresa.

C1–C6: arnés existente, una feature activa, arquitectura por puertos existentes,
TDD separado17203d7, R1–R5 en tests, spec aprobada antes del código. Trazabilidad
actualizada con implementación y cierre. No dependencia nueva.

Reserva durable anterior al proveedor; asociación/version/historial en una
transacción. Ambas subidas comparten función. Recuperación bloquea trabajo y
orden, consulta referencias y cierra futuras escrituras antes de borrar. Commit
ambiguo se concilia, fallo de DB conserva archivo. Eliminar exige publicId,
tipo, delivery y token coincidentes, por assetId inmutable y ausencia confirmada.
Rollback real, error original, retry durable, escritura tardía, dos conexiones,
conflicto concurrente, worker y SQL idempotente cubiertos por PostgreSQL real.

27 tests directos verdes (23 rojos/4 verdes originalmente); PostgreSQL31/31
incluye16 de #36 y15 de #38. Regresión backend863. Typecheck adicional68 errores
previos, dos fixtures relacionados corregidos, cero nuevos. Init final exit0,863backend/661frontend, builds y lint verdes; no afirmar tsc completo verde.

Cloudinary live y prueba manual del usuario NOT RUN, diferidas por él al terminar.
No toca activos existentes ni bases compartidas. Techo conocido: resultados de
upload desconocidos aún ausentes permanecen retryables hasta conciliación del
proveedor; guía explica inspección, no se inventa cancelación.
