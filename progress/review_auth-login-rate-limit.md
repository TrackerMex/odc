# Auto-revisión — #39

Auto-revisión del mismo agente, sin revisión independiente ni prueba manual
atribuida al usuario. Spec11e4f20 aprobada mediante delegación antes del código;
ampliación de feedback429/503 aprobada5de218d antes de modificar formulario.

C1–C6: arnés existente; única feature activa; guard/ORM en infrastructure,
aplicación de negocio conservada; TDD1501ce3/c4958c7 y a5951c1; testsR1–R5;
trazabilidad y cierre tras init verde. No dependencias nuevas ni contador local.

Guard solo de login. Transacción IP→cuenta con UPSERT, ventanas de DB y límite+1
saturado. IP bloqueada no consume cuentas. Retry-After >=1, fallos DB503 sin
login/cookie. Claves SHA256 acotadas y valores malformados agrupados; las cuentas
existentes/inexistentes obtienen el mismo límite y error401. Conserva cookie,
logout y me401. Limpieza SQL limitada y SKIP LOCKED; ninguna DB compartida tocada.

Proxy defaultfalse, allowlist explícita validada. Pruebas HTTP con un proxy Node
que conecta desde127.0.0.2 y agrega peer127.0.0.1: la cadena no permite atribuir
IP inyectada por cliente. Vite sin xfwd se deja sin confianza; alcance local y
verificación productiva pendiente descritos en guía. IPv6 y mappedIPv4 canónicos.

Rojo HTTP real5 fallos/7 verdes antes de aplicar guard/normalizar inválidos;
PostgreSQL verde12/12. Proxy17 tests verdes, más bootstrap5 anteriores.
Frontend rojo6 fallos/22 verdes, incluyó errores no tratados; verde28/28, captura,
alerta, sesión y reintento. Typecheck backend68 y frontend18 errores previos,
cero nuevos según comparación contra bases anteriores; no afirmar tsc verde.

Init final exit0: 880 backend / 672 frontend, builds y lint verdes.
PostgreSQL agregado43/43; lint frontend tocado sin errores ni warnings. SQL039 aditivo/idempotente.
Cloudinary real y prueba manual del usuario siguen NOT RUN, diferidas por él.
Otros hallazgos de plan002 no registrados en #34–#39 mantienen su alcance propio;
no se declara certificación productiva.
