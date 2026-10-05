---
feature: odc-temporary-file-delivery
status: approved
tags: [harness, spec]
---

# Diseño — #35

La causa es `cloudinary.url`: firma la ruta CDN, pero `expires_at` no forma
parte de ese contrato. Sustituir esa única llamada compartida por
`cloudinary.utils.private_download_url`. El SDK 2.10.0 instalado firma
`expires_at`, `public_id`, `format`, `timestamp` y `type`. La documentación
oficial admite `type: authenticated` y resource types image/video/raw.
[Cloudinary: acceso temporal](https://cloudinary.com/documentation/control_access_to_media#providing-time-limited-access-to-private-media-assets).

Se mantienen upload authenticated, interfaz de dominio y descriptores; ambas
rutas llaman al mismo adaptador después de GetOdcUseCase. Los metadatos
históricos se consultan como image/authenticated, igual que antes (auto
clasifica los PDF/JPEG/PNG existentes como image). No hay fallback público.
Validar resource type antes de entregarlo al SDK; fallo de configuración o
firma se traduce al error de servicio 503 existente sin detalles internos.

Prueba SDK real independiente de mocks, fechas controladas y firma comprobada
con node:crypto. Suite HTTP pequeña del controller real con repositorio
simulado; autorización, errores y orden de resolución reales. No se duplican
las pruebas de uploads #34.

Prueba live opt-in en scripts: genera archivos diminutos propios, carpeta con
UUID, `overwrite: false`, 300 segundos reales, URLs nunca impresas, chequeos
antes/después y regeneración, limpieza de esos ids únicamente. No necesita
backend, frontend ni puertos. Requiere que el operador confirme cuenta de test;
no se conecta de oficio a cuentas productivas.
