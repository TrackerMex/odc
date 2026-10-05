---
feature: odc-temporary-file-delivery
status: approved
tags: [harness, spec]
---

# Requisitos — #35

F02 de plan002. Depende de #34. Contrato: misma autorización, mismos activos
`authenticated`, misma respuesta HTTP 302, caducidad **300 segundos** desde
la emisión. La URL usa la API segura de descarga Cloudinary; no cambia a
archivos públicos ni a activos `private`.

- **R1**: WHEN una descarga está autorizada THE SYSTEM SHALL emitir una URL
  `private_download_url(publicId, format, { type: authenticated,
  resource_type, expires_at: now + 300 })`. Caducidad y tipo van firmados;
  nunca usar `cloudinary.url` con un parámetro ignorado.
- **R2**: WHEN se comprueba R1 THE SYSTEM SHALL usar el SDK instalado real con
  credenciales ficticias, sin red: PDF/JPEG/PNG, vencimiento exacto, firma
  verificable con crypto de Node, cambio temporal y alteración de expiry.
  Los mocks de SDK solos no bastan.
- **R3**: WHEN se usa un descriptor `cloudinary:v1` THE SYSTEM SHALL conservar
  tipo y formato almacenados, incluidos image/raw; WHEN se usa una referencia
  antigua THE SYSTEM SHALL resolver metadatos authenticated antes de firmar,
  sin reupload. IF Cloudinary confirma 404 THEN devolver error de archivo
  inexistente; IF falla o entrega metadatos inválidos THEN error 502 existente.
- **R4**: WHEN llega una petición sin sesión, con sesión inválida, a una ODC
  inexistente, sin documento o a un borrador ajeno THE SYSTEM SHALL conservar
  401/403/404 y no emitir URLs. Cubrir ambas descargas con Nest, guards y casos
  de uso reales; las tres funciones actuales pueden descargar órdenes visibles.
- **R5**: WHEN hay cuenta de test configurada THE SYSTEM SHALL permitir una
  comprobación ejecutable con tres activos exclusivos PDF/JPEG/PNG: acceso
  antes y rechazo después de 300 segundos, nueva URL válida, sin modificar
  otros activos y limpieza limitada a los recién creados. IF no existe esa
  cuenta THEN registrar **not run** y bloqueo de validación productiva,
  sin inventar resultados ni pedir secretos por chat. La implementación puede
  entregarse con este bloqueo explícito conforme al criterio de #35; no se
  considera comprobado el acceso real hasta ejecutar la prueba.
- **R6**: WHEN se cierra técnicamente la entrega THE SYSTEM SHALL mantener
  `bash init.sh` verde, trazabilidad R1–R6 y guía de comprobación para el usuario.

## Aprobación y alcance

- [x] Aprobado por humano mediante delegación expresa (2026-10-05).

Instrucción del usuario: «puedes terminar todas las features pendientes, tienes
mi permiso para cada aprobacion». La delegación permite resolver el contrato
anterior y aprobar el cierre técnico tras verificación; no equivale a una
prueba humana realizada. Se conservan resultados reales y no ejecutados.
No incluye cambio de datos existentes, migración de archivos ni despliegue.
