# Verificar #39

Aprobación técnica delegada; prueba manual del usuario NOT RUN. Límites de
ventana fija desde primer intento: **60/IP por60s; 5/cuenta por900s**. Todos los
intentos cuentan, incluso login exitoso y entradas inválidas. Cuenta normalizada
trim/lowercase; los intentos rechazados no prolongan la ventana. Una IP ya
bloqueada no consume más cuentas. 429 devuelve Retry-After entero en segundos;
el formulario indica minutos redondeados hacia arriba y conserva la captura.
503 por DB no disponible también tiene mensaje recuperable. No hay reintento
automático ni nuevo timer en el navegador.

```bash
bash backend/scripts/verify-postgres-hardening.sh auth-login-rate-limit.e2e-spec.ts
bash init.sh
```

El script crea su propio PostgreSQL y puerto aleatorio; verifica dos instancias
Nest con contadores comunes, 25 llamadas concurrentes a una misma cuenta,
caducidad con reloj de DB, fallos de DB, claves acotadas y limpieza. Pruebas de
proxy Node/Express reales en `backend/src/trusted-proxy.spec.ts`; formulario y
ApiError verificados por Testing Library/Vitest. No se afirma prueba visual
manual ni protección externa inspeccionada.

En tu equipo, en DB de pruebas y con una cuenta de pruebas, falla cinco veces
el login; la sexta petición debe ser429 sin cookie nueva. Revisa Network para
Retry-After. Espera la ventana y prueba acceso correcto; logout y roles siguen
igual. Valores capturados deben conservarse, botón recuperarse y mensaje quedar
visible. No hagas intentos masivos sobre cuentas reales para probar el límite.

En producción con synchronize:false, aplica antes SQL039, junto a036/038 si
actualizas desde main. No se ha modificado tu DB ni desplegado aquí. Los
contadores viven en PostgreSQL: reiniciar una instancia no reinicia la cuota.
La tabla auth_login_attempts almacena hash de cuenta/IP, no password ni claves
en claro; vencidos se purgan por lotes1000 cada minuto. DB inaccesible implica
503, sin bypass de protección. No borres contadores activos para evadir el límite.

## Proxy

Por defecto TRUSTED_PROXY_CIDRS está vacío y Express usa socket peer. Headers
X-Forwarded-For externos se ignoran. El proxy Vite actual no añade xfwd; las
peticiones por él comparten IP del proxy en desarrollo, mientras la cuenta
conserva cuota propia. No confíes en Vite ni en todas las redes privadas.

Para producción, identifica primero el reverse proxy que conecta al backend,
comprueba que sanea/agrega la dirección REAL del cliente y restringe acceso al
backend según esa topología. Entonces configura solo su IP/CIDR real (ejemplo
ilustrativo, reemplazar): TRUSTED_PROXY_CIDRS=10.42.0.10/32. Sin true, cantidad
de saltos, nombres, comodines ni /0. Máximo32 entradas; configuración inválida
impide el arranque. Dos rutas de diferente longitud deben conservar esa frontera.

Verifica con dos clientes reales y XFF añadido por el cliente: el límite de uno
no debe poder moverse al otro. La infraestructura productiva externa no ha sido
inspeccionada en esta sesión. Criterio nativo documentado en
[Express](https://expressjs.com/en/guide/behind-proxies/); atomicidad usa
[UPSERT PostgreSQL](https://www.postgresql.org/docs/16/sql-insert.html).
