# Sesión activa

```
feature: auth-login-rate-limit (#39)
inicio: 2026-10-05 UTC
agentes lanzados: ninguno
estado: preparando spec de límites compartidos y proxy confiable
```

Objetivo activo: completar #34–#39 en secuencia, aprobaciones delegadas por el
usuario. #34–#38 cerradas técnicamente. Último init863backend/661frontendverde,
PostgreSQL31/31 (#36+#38), typecheck68errores previos, cero nuevos.
Pruebas manuales NOT RUN. Cloudinary live #35/#38 NOT RUN; el usuario configurará
credenciales al terminar, indicó continuar. No se modificaron DBs compartidas.

#39: reutilizar PostgreSQL para límites atómicos entre instancias. Backend
actual usa Express sin trust proxy; Vite reenvía /api y no añade xfwd. Default
conservador: socket peer, ignorar XFF externo. Infraestructura de producción
externa no inspeccionada; trust proxy solo con allowlist explícita y proxy que
sanee/agregue dirección real del cliente. No confiar en headers arbitrarios.
