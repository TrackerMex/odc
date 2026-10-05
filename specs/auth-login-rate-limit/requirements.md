---
feature: auth-login-rate-limit
status: approved
tags: [harness, spec]
---

# Requisitos — #39

F08, requerida antes de exposición; depende de #38. Contrato aprobado por
la delegación del usuario: **60 intentos/IP por60s y5 intentos/cuenta por900s**,
ventana fija desde primer intento, cuenta trim/lowercase; éxitos y errores cuentan.

- **R1**: WHEN se intenta POST /api/auth/login THE SYSTEM SHALL consumir límites
  IP/cuenta antes del caso de uso. IF se excede THEN responder429 en español con
  Retry-After entero >=1, sin autenticar ni emitir cookie. Después de ventana,
  permitir nuevos intentos. IP ya bloqueada no consume cuentas adicionales.
  El formulario muestra429/503 en español, conserva captura/sesión y no navega;
  usa Retry-After válido para indicar espera sin temporizador nuevo.
- **R2**: WHILE no haya proxy confiable configurado THE SYSTEM SHALL usar el peer
  del socket e ignorar X-Forwarded-For. WHEN se configura TRUSTED_PROXY_CIDRS
  THE SYSTEM SHALL aceptar solo IPs/CIDRs explícitos acotados, no true/hop count/
  comodines/global /0. Express determina el primer salto no confiable. Pruebas
  prueban peer directo y proxy local que agrega la IP real; header externo no
  evita límite ni bloquea otra IP. IPv4 mapeado/IPv6 equivalente comparten clave.
- **R3**: WHEN hay peticiones concurrentes/varias instancias THE SYSTEM SHALL
  usar contadores atómicos compartidos en PostgreSQL y reloj de DB, sin contador
  en memoria. Saturar contador, no prolongar ventana por rechazo; limpiar claves
  vencidas por lotes1000 cada minuto. Fallo DB conserva cierre503, no permite bypass.
- **R4**: WHEN se deriva clave THE SYSTEM SHALL limitar email bruto a254 caracteres,
  usar hash SHA256 para cuenta/IP y agrupar valores malformados en clave fija.
  No consultar existencia para limitar, no guardar emails/passwords/IPs en claro
  ni cambiar respuesta según existencia. Login exitoso mantiene cookie y roles;
  login incorrecto conserva401 sin distinguir cuenta existente/inexistente.
- **R5**: WHEN se cierra THE SYSTEM SHALL tener HTTP Nest real y PostgreSQL aislado,
  concurrencia entre dos instancias, caducidad, claves, proxy y SQL idempotente,
  init verde y guía. Producción externa no inspeccionada: no atribuirle protección
  verificada. Proxy real debe sanear/agregar dirección de cliente y restringir
  acceso al backend antes de configurar allowlist. Prueba humana NOT RUN.

## Aprobación

- [x] Aprobado por humano mediante delegación expresa (2026-10-05), antes de código.

«puedes terminar todas las features pendientes, tienes mi permiso para cada
aprobacion». Incluye umbrales y cierre técnico; no autoriza afirmar verificación
manual ni infraestructura externa inexistente. No desplegar en esta sesión.

Ampliación aprobada por la misma delegación antes del cambio de UI: manejar las
nuevas respuestas429/503 en el formulario existente, sin rediseño ni alcance F20 completo.
