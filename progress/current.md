# Sesión activa

```
feature: odc-orphan-file-recovery (#38)
inicio: 2026-10-05 UTC
agentes lanzados: ninguno
estado: preparando diseño de recuperación durable
```

Objetivo activo: completar #34–#39 en secuencia, aprobaciones delegadas por el
usuario. #34–#37 cerradas técnicamente. Último init836backend/661frontendverde,
PostgreSQL16carrerasverificadas, typecheck70erroresprevios sin nuevos.
Pruebas manuales del usuario no ejecutadas. Cloudinary live #35 NOT RUN;
usuario indicó continuar y configurar credenciales al terminar (2026-10-05).

#38: preparar trabajo durable ANTES de subir; reservar publicId único y token
privado de propiedad para impedir eliminar activos existentes. Asociación,
versión e historial deben cerrarse en la misma transacción. Conciliación de
resultado ambiguo consulta asociación y bloquea futuras escrituras del ticket
antes de borrar; no eliminar si no se puede resolver. Mantener error original,
trabajo fallido visible/idempotente y recuperación de ambas subidas. Se usará
PostgreSQL aislado; nunca barridos de activos antiguos ni DBs compartidas.

Spec aprobada por delegación en3ce6838. Tests rojos de reserva previa, compensación de ambas subidas y propiedad Cloudinary escritos; implementación aún no modificada.

Rojos17203d7:23 fallos/4 verdes en pruebas directas; PostgreSQL rojo por módulo
nuevo ausente. Implementación usa una función compartida para ambas subidas y
trabajo durable. 27/27 directas, 863 backend y 30 PostgreSQL (#36 + #38) verdes.
Worker agregado a verificación de jobs debidos/activos protegidos antes de cierre.
Cloudinary metadata context y operaciones por assetId verificados contra docs
primarias y SDK2.10.0. Live aún NOT RUN por instrucción del usuario.
