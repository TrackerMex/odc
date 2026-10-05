---
feature: auth-login-rate-limit
status: approved
---

# Diseño

Guard solo sobre login; PostgreSQL ya instalado. Tabla auth_login_attempts:
key varchar66 PK, attempts int, expiresAt timestamptz indexado. Cada intento en
transacción hace UPSERT de IP y, si admite, de cuenta, siempre en ese orden.
ON CONFLICT serializa claves; clock_timestamp de DB calcula/reset de ventana,
contadores saturados límite+1. Retry-After desde DB. No reinicio por éxito.

SHA256 con prefijo i:/a:, email trim/lowercase <=254, malformado marcador fijo.
IP válida normalizada con net.isIP y URL de Node; mappedIPv4 comparte identidad.
No dependencia nueva, Redis ni contador por proceso. Guard tiene limpieza nativa
setInterval/unref y teardown; falla DB responde503. SQL039 aditivo antes de
arrancar todas las instancias. Mutex de filas compartido entre procesos.

configureApp recibe allowlist opcional; defaultfalse. Bootstrap interpreta env
TRUSTED_PROXY_CIDRS (máximo32, sin /0, nombres ni boolean/hops). Reutiliza trust
proxy nativo Express. Topología local real: Vite /api changeOrigin:true sin xfwd;
no se confía en Vite ni en redes privadas enteras por defecto. En desarrollo
las peticiones por ese proxy comparten su IP; cuenta sigue separada. La prueba
HTTP usa dos backends y proxy Node local que agrega peer real para demostrar
tratamiento de cadena. Producción externa queda pendiente de operador.

Referencias primarias: https://expressjs.com/en/guide/behind-proxies/ y
https://www.postgresql.org/docs/16/sql-insert.html
