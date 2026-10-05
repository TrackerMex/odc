# Sesión activa

```
feature: odc-concurrent-updates (#36)
inicio: 2026-10-05 UTC
agentes lanzados: ninguno
estado: preparando spec aprobada por delegación
```

Objetivo: completar #34–#39, una a la vez. Aprobaciones delegadas por el usuario:
«puedes terminar todas las features pendientes, tienes mi permiso para cada
aprobacion». Desarrollo aquí; pruebas del usuario en su equipo no inventadas.

#34 y #35 cerradas técnicamente. Init #35 exit0: 610 backend / 661 frontend.
Cloudinary live R5 NOT RUN por cuenta de test ausente; bloqueo productivo
conservado, probe entregado. Pendiente aviso del usuario sobre configuración.

#36: las ocho mutaciones existentes confluyen en repository.update que hoy
hace save incondicional. Se propone CAS por versión, historial en la misma
transacción y error409 compartido. Se usará PostgreSQL independiente con
puerto libre loopback y schema único; ningún dato de otros proyectos se toca.

Spec aprobada antes de código: aacb4bc. Pruebas rojas capturadas:
PostgreSQL 16/16 fallan (dos ganadores reales, versión ausente y SQL no creado);
HTTP 8 fallan/24 verdes (409 hoy500;401/403/404 conservados). Error de dominio
definido solo como contrato trivial para probar su traducción antes del fix.
Repositorio anterior se adapta a UPDATE/RETURNING manteniendo historial atómico.
Logs /tmp/odc36-{pg,http,repo}-red.log. Contenedor propio destruido al terminar.

Primer CAS y SQL: verde40 unit/HTTP y16 PostgreSQL. Auto-revisión detectó
RETURNING raw devuelve DATE como Date; prueba nueva compara payload ylectura
y reproduce 2 fallos/14 verdes. Se simplificará al update nativo + lectura ORM
en la misma transacción (fila bloqueada hasta commit), preservando fechas.
