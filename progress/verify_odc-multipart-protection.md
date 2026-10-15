# Prueba local de #34 — comprobantes y facturas

Implementación en `audit/odc-hardening-20261001`. Esta prueba corresponde al
usuario en su equipo, con órdenes y documentos exclusivamente de prueba.

## Preparar

Traer los commits de esa rama e instalar las dependencias **del backend**:

```sh
git switch audit/odc-hardening-20261001
git pull --ff-only
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend test --runInBand odc-multipart.http.spec.ts odc-upload-dependencies.spec.ts
```

Reinicia el backend después de instalar. Si usas Docker, reconstruye su imagen
para actualizar Multer.
Conserva los puertos de tu equipo. Las pruebas automáticas eligen un puerto
libre en loopback y no requieren Postgres, frontend ni Cloudinary reales.
La prueba de negocio siguiente sí usa tu stack local y su configuración habitual.

## Casos de negocio

Cada subida válida avanza el estado: usa una orden diferente o recorre el flujo
normal para cada caso. No repitas una subida válida sobre una orden ya avanzada.

| Caso | Sesión / estado previo | Resultado esperado |
|---|---|---|
| PDF, JPG y PNG reales | Administración / PAGO_REGISTRADO | Comprobante guardado, estado EVIDENCIA_PAGO_SUBIDA, descarga autorizada funciona |
| PDF, JPG y PNG reales | Operaciones / EVIDENCIA_PAGO_SUBIDA | Factura guardada, estado COMPLETADA, descarga autorizada funciona |
| Factura con todos los metadatos | Operaciones / EVIDENCIA_PAGO_SUBIDA | Fecha almacén, número, fecha factura y observaciones conservados |
| Factura con solo fecha almacén | Operaciones / EVIDENCIA_PAGO_SUBIDA | Campos opcionales pueden omitirse |
| Texto guardado como `.pdf` | Rol autorizado / estado requerido | HTTP 400; orden, historial y documentos sin cambios |
| PNG enviado con MIME `image/jpeg` | Rol autorizado / estado requerido | HTTP 400 por MIME discordante; orden sin cambios |
| Archivo vacío | Rol autorizado / estado requerido | HTTP 400; orden sin cambios |
| Archivo de 10485760 bytes | Rol autorizado / estado requerido | Aceptado si firma, MIME y metadatos son válidos |
| Archivo de 10485761 bytes | Rol autorizado / estado requerido | HTTP 413 al llamar directamente a API; ningún guardado |

Para los dos últimos casos se puede copiar un PDF real pequeño y añadir espacios
después de su final hasta alcanzar el tamaño exacto. Los tests automatizados
ya prueban ambos límites por chunks y ambos órdenes de campos/archivo.

El frontend impide elegir un archivo demasiado grande antes de enviarlo. Para
comprobar el 413 **del backend**, abre la aplicación local como Administración,
elige una ODC de prueba en PAGO_REGISTRADO y ejecuta en la consola del navegador:

```js
const odcId = 'ID_DE_ODC_DE_PRUEBA'
const form = new FormData()
form.append('file', new File([new Uint8Array(10485761)], 'grande.pdf', {
  type: 'application/pdf',
}))
const response = await fetch(`/api/odcs/${odcId}/payment-evidence`, {
  method: 'POST', body: form, credentials: 'include',
});
({ status: response.status, body: await response.json() })
// Esperado: status 413. La orden e historial deben conservarse.
```

En la pestaña Red puedes revisar los 400/413. La sesión viaja por la cookie
existente; no es necesario copiar tokens o contraseñas.

## Resultado humano

- [ ] Casos revisados por el usuario en su equipo.
- Fecha / resultados: por completar.
- [ ] Aprobación de cierre de #34.

Cierre técnico aprobado por delegación expresa del usuario el 2026-10-05.
La validación manual anterior sigue disponible para su equipo; ninguna casilla
se marca como ejecutada sin evidencia humana.
