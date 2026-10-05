# Sesión activa

```
feature: odc-input-boundaries (#37)
inicio: 2026-10-05 UTC
agentes lanzados: ninguno
estado: preparando spec de límites/fechas/UUID
```

Objetivo:#34–#39 en secuencia, aprobaciones delegadas por el usuario. #34,#35,#36
cerradas técnicamente; último init644backend/661frontend verde,16PostgreSQL.
Pruebas manuales del usuario no ejecutadas aquí. Cloudinary real #35 NOT RUN;
usuario indica continuar y configurar credenciales al terminar (2026-10-05).

#37: escoger contrato entero positivo int32 para cantidad/precio/total; fecha
civil YYYY-MM-DD años0001–9999 sin hora/offset y calendario estricto. Reutilizar
computeTotalCents en crear/editar (validar antes de mutar), IsDateString strict
más formatoexacto en DTO y validación pura compartida en dominio. ParseUUIDPipe
en todos los parámetrosid; guards antes de pipes401/403, UUID inválido400,
UUID válido sin orden404. No tocar otras features ni fijar puertos ocupados.

Spec aprobada f57c65e antes de código. Tests directos y HTTP escritos primero;
rojo en /tmp/odc37-red.log (operaciones inseguras hoy aceptadas, calendario
normalizado por DTO sin strict y ids malformados llegan al caso de uso).
InvalidOdcInputError es únicamente el contrato trivial para clasificar errores
en estos tests; todavía no hay validación implementada.

Rojo inicial104fallos/88verdes (192casos). Primer fix189verdes/3fallos: DTO
IsDateString strict de validator13.15.35 rechaza0001 por pérdida de padding
(1-01-01 reinterpretado). Diseño ajustado a ValidateBy nativo reutilizando
isCalendarDate puro, mismo calendario que dominio, sin nueva dependencia.

Verde192/192, dominio + HTTP: límites int32 y producto, edición parcial
antes de mutar, fechas sin conversiones (0001 y9999 incluidas), UUID400 en11
endpoints, guards401/403 y404 conservados. Siguiente:init completo.
