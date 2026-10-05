# Entrega #34–#39 — audit/odc-hardening-20261001

39/39 features del registro completadas: #34–#39 implementadas en esta entrega.
Verificación final: init exit0, 880 pruebas backend / 672 frontend, builds y lint
verdes; PostgreSQL aislado43/43 y lint frontend de los cuatro archivos tocados
verde. Typecheck adicional conserva68 errores backend y18 frontend previos,
sin nuevos; es deuda F11, no se afirma typecheck completo verde.

Cambios implementados en este entorno, aprobaciones y cierre técnico delegados.
El usuario prueba en su equipo. No despliegue ni cambios en bases compartidas.

Actualiza la rama:

```bash
git switch audit/odc-hardening-20261001
git pull --ff-only
bash init.sh
```

Conserva tus puertos locales. Los tests HTTP usan puertos efímeros y el script de
PostgreSQL crea/elimina únicamente su contenedor dedicado, también con puerto
aleatorio. Nunca usa DATABASE_URL de tu .env para las pruebas de concurrencia.

```bash
bash backend/scripts/verify-postgres-hardening.sh odc-concurrent-updates.e2e-spec.ts odc-orphan-file-recovery.e2e-spec.ts auth-login-rate-limit.e2e-spec.ts
```

Guías específicas:

- [#34 Multipart y firmas](verify_odc-multipart-protection.md).
- [#35 Entrega temporal y probe real](verify_odc-temporary-file-delivery.md).
- [#36 Concurrencia y SQL036](verify_odc-concurrent-updates.md).
- [#37 Límites, calendarios y UUID](verify_odc-input-boundaries.md).
- [#38 Recuperación de archivos y SQL038](verify_odc-orphan-file-recovery.md).
- [#39 Login, proxy y SQL039](verify_auth-login-rate-limit.md).

Cloudinary real: **NOT RUN** por instrucción del usuario («continua, los subo en cuando termines»). Configura las tres variables CLOUDINARY_* en .env de la
raíz, sin compartir secretos en chat. En cuenta de pruebas segura y autorizada:

```bash
ODC_CLOUDINARY_TEST=1 pnpm --dir backend verify:temporary-files
```

La prueba sube tres archivos propios, verifica acceso/caducidad real de300s y
limpia solo esos archivos. Usa tu backend local para probar comprobante/factura
y consultar odc_file_uploads (#38). No ejecutar barridos ni simular fallos sobre
producción. Los tests de proveedor con credenciales ficticias no equivalen a
verificación live. Esto y la prueba manual siguen pendientes para producción.

Producción synchronize:false: con la aplicación detenida y procedimiento de
backup normal, aplicar036-odc-version.sql,038-odc-file-uploads.sql y
039-auth-login-attempts.sql desde backend/scripts/sql/; reiniciar todas las
instancias nuevas antes de permitir escrituras. SQL no aplicado en tu DB aquí.
Revisar proxy real según la guía #39 antes de confiar en XFF. Otros pendientes
operativos de plan002 (migraciones generales, backup/restore, observabilidad,
typecheck F11 y restantes mejoras no registradas) no se cierran con esta entrega.
