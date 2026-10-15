# Comprobar #35 en una cuenta de test

La descarga autorizada ahora redirige a la API segura de Cloudinary con una
firma que incluye caducidad de 300 segundos. Se conservan los activos y su tipo
`authenticated`; no se modifica ninguna referencia existente.

## Pruebas automáticas sin credenciales

```sh
pnpm --dir backend test --runInBand cloudinary-temporary-url.spec.ts cloudinary-file-storage.service.spec.ts odc-file-delivery.http.spec.ts cloudinary-live-probe.spec.ts
```

SDK real con credenciales ficticias, firma Node crypto, clock controlado y
rutas HTTP reales; las pruebas no tocan Cloudinary ni una base compartida.

## Acceso real antes/después

Configura exclusivamente una cuenta Cloudinary **de test** en `.env` raíz:
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
No escribas los valores en chat, commits ni capturas. En esa misma `.env`,
`ODC_CLOUDINARY_TEST=1` confirma que esta cuenta es segura para el probe.

```sh
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend verify:temporary-files
```

El comando construye el backend, crea un PDF, un JPEG y un PNG pequeños en una
carpeta única `odc-test/temporary-delivery-<uuid>` y prueba el adaptador real.
Comprueba acceso inicial, denegación de expiry alterado, espera 300 segundos
reales, denegación de la misma URL y acceso con una URL recién emitida. No
imprime las URLs o secretos. Limpia exclusivamente esos tres activos; no
sobrescribe ni barre activos existentes. Si la limpieza falla, muestra el id
del activo de test para eliminarlo manualmente.

No requiere levantar backend/frontend/DB ni ocupar puertos. Sin configuración
opt-in termina con **NOT RUN**, exit 2; éxito exit 0, fallo exit 1. Un 4xx
inicial (p. ej. política de PDF de la cuenta) es fallo de la comprobación: no se
habilitan políticas públicas de la cuenta automáticamente para hacerlo pasar.

## Validación de negocio en el equipo del usuario

Con los tres roles, abrir comprobante y factura de una orden visible, copiar
la URL final en la pestaña Red, comprobar acceso antes de cinco minutos y
rechazo después. Volver a descargar desde la aplicación debe generar otra URL.
Un borrador ajeno, ODC/documento ausente o sesión inválida debe rechazarse sin
redirect. Usa exclusivamente órdenes y archivos de prueba.

## Evidencia en este entorno — 2026-10-05

- SDK/HTTP sin red: verde; firma y TTL exactos verificados.
- Probe sin configuración: NOT RUN, exit 2, sin acceso a Cloudinary.
- Acceso Cloudinary real antes/después: **NOT RUN**; no hay credenciales de test.
- Prueba manual del usuario en su equipo: **NOT RUN**.
- Bloqueo de verificación antes de producción: ejecutar el probe en cuenta de
  test y registrar su resultado. Se entrega implementación con esta limitación
  explícita según el criterio condicional de #35; no se afirma éxito live.
