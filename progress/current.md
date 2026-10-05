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
