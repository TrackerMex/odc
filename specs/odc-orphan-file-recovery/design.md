---
feature: odc-orphan-file-recovery
status: approved
---

# Diseño

Reutilizar PostgreSQL/TypeORM y los dos puertos existentes, sin cola externa.
Tabla odc_file_uploads guarda reserva antes del proveedor. UUID para ticket y
publicId, expectedVersion y field. Espera inicial 10 minutos para procesos
abandonados; errores conocidos se concilian inmediatamente. Reintentos con
espera hasta una hora, lotes de 20 y sondeo cada minuto.

update(ticket) bloquea trabajo antes de CAS de orden y cierra como associated
junto a orden/historial. claimRecovery bloquea en el mismo orden, consulta ambas
referencias de la orden (incluidas referencias serializadas), marca associated
si corresponde; en otro caso marca cleaning y evita todo update posterior con
ese ticket. Fallo de DB no autoriza borrar. Lease de 10 minutos permite retomar
cleaning abandonado; estados terminales nunca se reabren por resultados tardíos.

Cloudinary usa authenticated/image para PDF/JPEG/PNG, public_id explícito,
overwrite:false y context.odc_upload_job. La limpieza consulta metadata, exige
propiedad y borra por assetId inmutable; comprueba ausencia por assetIds antes
de cerrar. Activo ajeno pasa a protected, requiere inspección manual. Si falta
activo y no hay confirmación de upload, permanece retry (posible llegada tardía).
Token/URL/credenciales no aparecen en logs. DB muestra diagnóstico acotado y
contadores; worker solo registra id de trabajo y código estable.

SQL038 aditivo antes de arrancar todos los procesos nuevos; synchronize:false
productivo se conserva. Sin cambios en API, cookies, roles ni archivos antiguos.
Referencia primaria: https://cloudinary.com/documentation/admin_api
