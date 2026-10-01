---
feature: "odc-multipart-protection"
status: draft
tags: [harness, spec]
---

# Requisitos - [[odc-multipart-protection]]

Feature #34, P1, hallazgo F04 de [[../../plans/002-system-review|plan002]].
Base: main `a8a407e`, revalidado 2026-10-01. Ver [[design]], [[tasks]] y
[[traceability]]. Esta propuesta requiere aprobación antes de código.

## Contrato propuesto para aprobación

- Se mantienen rutas, roles, campo `file` y formatos PDF/JPEG/PNG.
- Un archivo, hasta **10485760 bytes (10 MiB), inclusive**.
- Comprobante: solo campo opcional `evidenceReference` (máximo 1 campo).
- Factura: `warehouseEntryDate` obligatorio y `invoiceNumber`,
  `invoiceDate`, `observations` opcionales (máximo 4 campos).
- Máximo **8192 bytes UTF-8 por campo** y **100 bytes por nombre**.
  Campos desconocidos, repetidos o con notación de array/objeto se rechazan.
- Máximo lógico 2 partes en comprobante y 5 en factura (incluye archivo).
  El límite configurado de parser debe preservar la aceptación exacta del
  máximo: considerar la semántica real de Busboy, ver [[design]].
- Exceso de tamaño de archivo: **413**. Resto de estructura, firma o MIME
  inválidos: **400**, con mensaje útil sin exponer detalles internos.

## Requisitos funcionales

- **R1**: WHEN un usuario autorizado envía a cualquiera de las dos rutas un
  PDF/JPEG/PNG con firma válida, MIME coincidente y metadatos válidos THE SYSTEM
  SHALL aceptar tamaños desde 1 hasta 10485760 bytes inclusive y conservar el
  contrato actual del caso de uso. Probar tres formatos y ambas rutas.

- **R2**: IF el archivo supera 10485760 bytes THEN THE SYSTEM SHALL interrumpir
  su recepción en el parser y responder 413 sin ejecutar el caso de uso,
  subir a Cloudinary ni persistir orden/historial. Probar +1 byte y flujo mayor
  dividido en chunks; comprobar que el almacenamiento no recibe un archivo
  completo de tamaño superior al máximo. El pipe posterior no es la única defensa.

- **R3**: WHEN se recibe un archivo THE SYSTEM SHALL comprobar su firma real
  como PDF/JPEG/PNG y su correspondencia con el MIME declarado antes del caso de uso.
  IF el archivo falta, está vacío, tiene formato no permitido o MIME falso THEN
  THE SYSTEM SHALL responder 400 sin upload ni persistencia. Cubrir texto
  rotulado PDF, PNG rotulado JPEG y firma truncada/no reconocida.

- **R4**: IF se exceden los límites de archivos, campos, tamaño/nombre de campo
  o partes, o se usan campos repetidos/desconocidos/estructurados THEN THE SYSTEM
  SHALL rechazar con 400 durante recepción/validación de frontera antes del caso
  de uso. Probar cada máximo permitido y su +1, ambos órdenes archivo/campos,
  UTF-8 multibyte, segundo archivo, archivo con nombre diferente de `file`,
  los 4 campos válidos de factura juntos y metadatos actuales del frontend.

- **R5**: WHILE las rutas aceptan multipart THE SYSTEM SHALL utilizar Multer
  >=2.3.0 en dependencias directas y transitivas runtime, compatible con Nest
  11.1.28 y Node del proyecto, y configurar explícitamente
  `limits.fieldArrayIndexLimit` al mínimo soportado para rutas que no aceptan
  arrays (propuesta: 0; confirmar en API real antes de implementar).
  No aceptar la feature si Nest sigue resolviendo una versión vulnerable.
  Evidencia: lockfile, `pnpm why multer` y pruebas con el parser real.

- **R6**: WHEN una petición llega sin sesión o con rol no autorizado THE SYSTEM
  SHALL conservar 401/403 y ejecutar guards antes de procesamiento de uploads.
  WHEN una petición multipart es rechazada THE SYSTEM SHALL dejar sin cambios
  orden, referencias e historial, no crear archivos locales ni invocar
  almacenamiento externo. Probar proveedores externos mockeados con cero llamadas.

- **R7**: WHEN se verifica esta feature THE SYSTEM SHALL contar con pruebas HTTP
  de Nest/Multer reales que cubran R1–R6, incluyendo límites recibidos durante
  streaming, y con `./init.sh` verde. Tests directos de pipe o mocks del parser
  solos no satisfacen los límites. Los tests nombran sus R-ids y la historia
  demuestra test rojo antes de implementación por requisito.

## Fuera de alcance

- Caducidad (#35), concurrencia (#36), rangos/fechas/UUID (#37), compensación
  (#38), login (#39), migraciones y despliegue.
- Antivirus, prueba de malware, validación completa de documentos, cambio del
  límite de negocio de 10 MiB y almacenamiento productivo.
- No se afirma ataque anónimo a estas rutas ni IDOR; sesión/roles ya existen.

## Prueba humana antes de done

En aplicación local y órdenes exclusivamente de test: subir un PDF, PNG y JPEG
válidos en el rol correspondiente; comprobar que factura con sus 4 metadatos
funciona, que 10 MiB se acepta y +1/MIME falso se rechazan sin cambio de orden.
Revisar mensajes 400/413 y confirmar descarga autorizada del archivo válido.
Registrar evidencia y aprobación humana; no usar activos ni datos productivos.

## Aprobación

- [ ] Aprobado por humano (fecha: ____)
