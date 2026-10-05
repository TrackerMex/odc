---
feature: odc-orphan-file-recovery
status: approved
tags: [harness, spec]
---

# Requisitos — #38

F07; depende de #37. Solo nuevas subidas de factura y comprobante.

- **R1**: WHEN se sube un documento válido THE SYSTEM SHALL guardar primero un
  trabajo durable con publicId único y token de propiedad, sin sobrescribir activos.
  Asociación del trabajo, orden/version e historial se confirman en la misma
  transacción. Validación de dominio precede al trabajo y al upload.
- **R2**: IF persistencia falla o devuelve un resultado ambiguo THEN THE SYSTEM
  SHALL consultar el trabajo y las asociaciones persistidas antes de borrar.
  Un commit confirmado o una asociación existente impide borrar. Si no se puede
  consultar la DB, se conserva el archivo. La conciliación bloquea futuras
  asociaciones del ticket antes de invocar eliminación.
- **R3**: IF se confirma ausencia de asociación THEN THE SYSTEM SHALL eliminar
  exclusivamente el activo con publicId/tipo/token coincidentes, usando su assetId
  inmutable. No barrer, sobrescribir, borrar referencias antiguas ni activos sin
  marca de propiedad. Resultado repetido es idempotente.
- **R4**: IF falla cleanup THEN THE SYSTEM SHALL conservar el error original y
  trabajo durable con estado, intentos, próximo intento y diagnóstico sin secretos.
  Reconciliación periódica reanuda tras reinicio y entre instancias. Un upload de
  resultado desconocido y activo aún ausente queda en conciliación, porque puede
  aparecer tarde; no se presume cancelación del proveedor.
- **R5**: WHEN se verifica THE SYSTEM SHALL cubrir ambos uploads, rollback real,
  cleanup fallido, timeout antes/después de commit, conflicto con dos conexiones,
  barrera de escrituras tardías y permanencia tras recrear repositorio. Init verde,
  trazabilidad, SQL aditivo y guía. Pruebas Cloudinary reales NOT RUN hasta que el
  usuario configure credenciales; no inventar revisión independiente ni prueba humana.

## Aprobación

- [x] Aprobado por humano mediante delegación expresa (2026-10-05), antes de código.

«puedes terminar todas las features pendientes, tienes mi permiso para cada
aprobacion». Cierre técnico delegado; prueba manual del usuario NOT RUN.
