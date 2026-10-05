# Verificar #38 en tu equipo

Código y aprobación técnica delegada terminados. Prueba manual del usuario y
Cloudinary real: **NOT RUN**; configura las credenciales al terminar como indicaste.

En desarrollo, TypeORM crea la nueva tabla si synchronize está habilitado.
En producción, con synchronize:false, aplica primero los SQL036 y SQL038
(`backend/scripts/sql/`) con la aplicación detenida y copia de seguridad normal.
Arranca todas las instancias nuevas juntas. No mezclar versiones antiguas que
no registren la reserva o escriban sin version. No se ha aplicado SQL en tu DB.

Verificación automatizada, PostgreSQL en contenedor dedicado y puerto aleatorio:

```bash
bash backend/scripts/verify-postgres-hardening.sh odc-concurrent-updates.e2e-spec.ts odc-orphan-file-recovery.e2e-spec.ts
bash init.sh
```

Con una ODC de pruebas, sube comprobante y factura con los roles actuales.
Comprueba descarga y transiciones/historial. En la DB de pruebas, consulta:

```sql
SELECT id, "orderId", state, attempts, "lastOutcome", "nextAttemptAt"
FROM odc_file_uploads ORDER BY "createdAt" DESC LIMIT 20;
```

Una subida confirmada queda `associated`. Tras un fallo, `retry`/`cleaning`
se reanudan automáticamente: lotes20 cada minuto, espera inicial10min para
operaciones abandonadas, reintentos hasta1h. `done` significa eliminación o
ausencia confirmada tras upload reconocido. `protected` significa que la marca
no coincide y exige inspección; no fuerces borrado de archivos existentes.

Si el proveedor dio timeout y el activo todavía no existe, el trabajo sigue
`retry`: puede llegar tarde. No cierres ese trabajo suponiendo que se canceló
la subida. El SQL guarda solo códigos acotados, nunca errores del proveedor,
URLs firmadas o credenciales. Logs: `file_recovery_deferred job=<uuid>` o
`file_recovery_database_unavailable`.

Los tests inyectan fallos y timeout de forma controlada; no reproduzcas eso en
producción ni ejecutes barridos. La marca context y la eliminación por assetId
siguen la [API oficial Cloudinary](https://cloudinary.com/documentation/admin_api).
No se borran archivos anteriores ni se promete verificación live con mocks.
