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

Spec11e4f20 aprobada por delegación; límites60/IP/60s y5/cuenta/900s. Tests primero: HTTP/proxy y PostgreSQL entre2 instancias, sin cambios de implementación aún.

Rojo1501ce3: proxy4 fallos/13 verdes; PostgreSQL no cargaba sin nuevo módulo.
Con contadores implementados pero sin guard aplicado aún, HTTP demuestra cuatro
fallos reales (429/503 ausentes) y ocho pruebas de contador ya verdes. Contrato
401 existente conserva mensaje inglés Invalid credentials; test corregido.

#39 implementada: guard IP/cuenta compartido, reloj de DB, caducidad, cleanup,
allowlist estricta y canonicalización de IP. PostgreSQL12/12 y proxy22/22
(incluye bootstrap5) verdes. Formulario429/503 aprobado5de218d, rojoa5951c1
(6fallos/22verdes)→verde28/28. Typecheck68backend/18frontend previos,0 nuevos.
Init completo y PostgreSQL agregado en curso; no cerrar hasta sus resultados.
