# Verificar #36 — concurrencia de ODC

Las ocho mutaciones comparan versión y estado anterior al persistir. Un ganador
incrementa versión y guarda historial en la misma transacción; un perdedor
recibe 409 y debe recargar. La versión es interna, no exige cambiar el frontend.

## Prueba PostgreSQL aislada

Con Docker y bash (Git Bash/WSL en Windows):

```sh
bash backend/scripts/verify-postgres-hardening.sh
```

El script crea **su propio** PostgreSQL16, puerto efímero en 127.0.0.1, base
exclusiva y esquema UUID; nunca usa DATABASE_URL de tu .env. Destruye su
contenedor al terminar. La suite comprueba dos conexiones distintas, lecturas
sincronizadas y un solo ganador de aprobar/rechazar, enviar/reenviar, dos
ediciones, editar/enviar, pagar y ambas subidas. También historial/versión
revertidos si falla historial, fechas correctas y SQL idempotente.

Las 32 pruebas HTTP de 409/401/403/404 no requieren PostgreSQL:

```sh
pnpm --dir backend test --runInBand odc-concurrent-updates.http.spec.ts purchase-order.typeorm.repository.spec.ts odc-response.mapper.spec.ts
```

## Incorporar el cambio a tu equipo

Instala dependencias y reinicia backend. En desarrollo (`NODE_ENV` distinto de
production), TypeORM synchronize agrega la columna `version` con default0;
usa solo la configuración de desarrollo de tu equipo y conserva tus puertos.

Con `NODE_ENV=production`, synchronize está deshabilitado: aplicar
`backend/scripts/sql/036-odc-version.sql` en una ventana de mantenimiento con
escrituras detenidas. El SQL agrega una columna con default0; no borra datos y
su repetición es segura. Después **reiniciar todas las instancias** con la
nueva versión antes de abrir escrituras. Un backend viejo no incrementa version
y no es compatible con este control; no mezclar instancias viejas/nuevas.
No se aplicó este SQL a ninguna base compartida o productiva desde aquí.

## Prueba de negocio del usuario

Abrir la misma orden de test en dos sesiones y ejecutar acciones opuestas a la
vez: una aprobación/rechazo gana, la otra recibe409. Confirmar estado y una sola
entrada de historial. Recargar permite revisar y actuar sobre la nueva versión.
Una petición iniciada después de terminar otra carga una versión nueva: el
control protege operaciones concurrentes que cargaron la misma versión; no
implementa ETag para bloquear formularios antiguos enviados de manera serial.

Uploads simultáneos pueden crear dos activos Cloudinary aunque solo uno se
asocie: la compensación de la subida perdedora se resuelve en #38. No se afirma
que #36 por sí sola impida archivos huérfanos.

Evidencia automática: 16 PostgreSQL y 49 unit/HTTP/mapper verdes. Prueba manual
del usuario en su equipo: NOT RUN; cierre técnico con aprobación delegada.
