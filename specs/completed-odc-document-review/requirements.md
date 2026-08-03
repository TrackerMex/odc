---
feature: "completed-odc-document-review"
status: approved     # draft | approved
tags: [backend, frontend, cloudinary, odc, documentos, spec]
---

# Requisitos — [[completed-odc-document-review]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

## Diagnóstico confirmado

- Los comprobantes de pago y las facturas inspeccionados existen en el
  entorno configurado de Cloudinary, son archivos PNG válidos y tienen tipo de
  entrega `authenticated`; no se requiere moverlos, volverlos públicos ni
  cambiar el plan de Cloudinary.
- La subida usa correctamente `resource_type: 'auto'` para detectar el tipo,
  pero el puerto `FileStorageService` conserva únicamente el `publicId`. Al
  generar la URL firmada, el backend vuelve a usar `resource_type: 'auto'` y
  produce una ruta de entrega `/auto/authenticated/...` que Cloudinary no
  resuelve. La entrega debe firmarse con el `resource_type` y `format` reales
  devueltos por la subida.
- El resumen mensual ya contiene el `id` de cada compra, incluidas las ODC
  `COMPLETADA`, pero muestra `odcNumber` como texto sin navegación. El detalle
  existente sí puede representar una ODC completada y ya conoce si tiene
  comprobante o factura.

## Requisitos funcionales

- **R1**: WHEN Cloudinary acepta una evidencia de pago o una factura THE
  SYSTEM SHALL conservar, junto con el `publicId`, el `resource_type` y el
  `format` reales devueltos por la subida para poder entregar posteriormente
  el mismo recurso; la referencia persistida SHALL NOT contener una URL y
  ningún cuerpo JSON público SHALL exponer el `publicId` ni las credenciales
  de Cloudinary.
  *Verificación*: tests del puerto y de
  `CloudinaryFileStorageService.upload` con el SDK mockeado demuestran que el
  resultado conserva `publicId`, `resourceType` y `format`, omite
  `url`/`secure_url`, y que los mappers HTTP siguen exponiendo únicamente los
  indicadores no sensibles `hasPaymentEvidence` y `hasInvoice`.

- **R2**: WHEN un usuario autenticado solicita
  `GET /api/odcs/:id/files/evidence` o
  `GET /api/odcs/:id/files/invoice` y existe el archivo THE SYSTEM SHALL
  responder HTTP 302 hacia una URL de Cloudinary firmada, de entrega
  `authenticated` y expiración corta (5 minutos), construida con el
  `resource_type` y `format` reales del archivo; la ruta de entrega SHALL NOT
  usar `resource_type: 'auto'` y SHALL incluir el formato necesario para que
  el recurso final responda correctamente.
  *Verificación*: test de `getSignedUrl` con el SDK mockeado que aserta
  `sign_url: true`, `type: 'authenticated'`, el tipo/formato recibido, una
  expiración no mayor a 5 minutos y ausencia de `resource_type: 'auto'`; tests
  de ambos use-cases aseguran que pasan la referencia completa del archivo y
  el controller conserva el 302.

- **R3**: IF una ODC existente conserva una referencia histórica que solo
  contiene el `publicId` THEN THE SYSTEM SHALL resolver mediante el adaptador
  de Cloudinary los metadatos reales del recurso `authenticated` antes de
  firmarlo, sin exigir una nueva carga y sin perder el archivo actual; IF
  Cloudinary confirma que el recurso no existe THEN THE SYSTEM SHALL responder
  HTTP 404 desde la aplicación, y IF Cloudinary no puede consultarse por un
  fallo recuperable THEN THE SYSTEM SHALL responder HTTP 502 sin redirigir a
  una URL inválida.
  *Verificación*: tests con el SDK de Cloudinary mockeado cubren una referencia
  histórica PNG/PDF resuelta y firmada, un recurso ausente traducido a 404 y
  un fallo externo traducido a 502; ningún test unitario realiza llamadas de
  red reales.

- **R4**: WHILE se corrige la entrega de archivos THE SYSTEM SHALL preservar
  las reglas existentes de acceso: cualquier rol autenticado que puede ver el
  detalle puede solicitar sus documentos, una ODC inexistente o un documento
  todavía no cargado responde 404, un `BORRADOR` ajeno responde 403 y un
  `kind` distinto de `evidence` o `invoice` responde 400; ninguna de estas
  respuestas SHALL revelar el `publicId`, una URL sin firma o secretos.
  *Verificación*: se mantienen y renombran con R4 los tests de regresión del
  controller/use-cases para 302, 400, 403 y 404, incluyendo aserciones de que
  los valores sensibles no aparecen en el cuerpo.

- **R5**: WHEN `DIRECTOR_OPS` consulta el detalle del resumen mensual THE
  SYSTEM SHALL presentar el número de cada ODC como un enlace accesible a
  `/odcs/:id`, incluyendo las filas cuyo estado sea `COMPLETADA`, sin alterar
  los datos ni el aspecto estático de la lámina exportada a PDF/PNG; al volver
  con la navegación del navegador se SHALL conservar el mes y la página que
  el usuario estaba consultando.
  *Verificación*: test de `MonthlySummary` confirma que una compra
  `COMPLETADA` enlaza su `odcNumber` al `id` correcto, que la fila conserva el
  resto de sus datos y que `MonthlySummarySlide` sigue siendo una salida
  estática sin controles interactivos.

- **R6**: WHEN una ODC visible tiene `hasPaymentEvidence` o `hasInvoice` y el
  usuario activa la acción correspondiente desde el detalle THE SYSTEM SHALL
  abrir una vista previa protegida dentro de un diálogo, cargar el endpoint
  `/api/odcs/:id/files/:kind` únicamente al abrirlo y permitir revisar el
  archivo entregado por la URL firmada; el diálogo SHALL identificar si se
  está viendo el comprobante o la factura y ofrecer acciones para abrir el
  recurso en otra pestaña y cerrar la vista.
  *Verificación*: tests de `OdcDetail` comprueban que las acciones solo aparecen
  para archivos existentes, que cada una abre el diálogo con el endpoint y
  título correctos, que el recurso no se carga antes de abrir y que el enlace
  externo usa `target="_blank"` con `rel="noopener noreferrer"`.

- **R7**: WHILE la vista previa carga, se muestra en pantallas pequeñas o no
  puede renderizar el recurso THE SYSTEM SHALL mantener el contenido dentro
  del viewport, mostrar un estado de carga, permitir cerrar con teclado y
  devolver el foco al control que la abrió; IF la carga falla THEN THE SYSTEM
  SHALL explicar el error y conservar una acción para reintentar o abrir el
  documento en otra pestaña.
  *Verificación*: tests de accesibilidad/comportamiento cubren nombre accesible
  del diálogo, foco, cierre con Escape, estado de carga/error y fallback; la
  verificación visual con Playwright cubre escritorio, viewport móvil y tema
  oscuro con una ODC `COMPLETADA`.

- **R8**: WHEN se implemente la interfaz de esta feature THE SYSTEM SHALL
  reutilizar `Dialog`, `Button`, `Alert` y demás primitivas disponibles de
  `shadcn/ui`, mantener la jerarquía visual sobria y compacta del detalle y
  SHALL NOT introducir otra cola operativa, cambiar la máquina de estados ni
  habilitar edición sobre una ODC `COMPLETADA`.
  *Verificación*: tests de regresión confirman que los formularios de mutación
  siguen ocultos en `COMPLETADA`; revisión visual confirma que la nueva acción
  y el diálogo usan los tokens y patrones existentes.

## Criterios de aceptación manual

Antes de declarar la feature `done`, con el stack completo y credenciales
reales configuradas:

1. Abrir desde el resumen mensual una ODC `COMPLETADA` y confirmar que carga
   `/odcs/:id`.
2. Abrir la vista previa del comprobante y de la factura; en ambos casos el
   endpoint de la aplicación debe responder 302 y el destino firmado debe
   responder 200 y mostrar el archivo correcto, sin `/auto/authenticated/` en
   la URL de entrega.
3. Confirmar que una referencia histórica guardada antes de esta feature se
   visualiza sin volver a cargar el archivo.

## Fuera de alcance

- Hacer públicos los assets, cambiar el plan o la configuración del dashboard
  de Cloudinary, mover archivos existentes o volverlos a subir manualmente.
- Borrar, reemplazar, versionar, anotar o editar comprobantes y facturas.
- Añadir una cola de `COMPLETADA`, un archivo global de ODC o modificar el
  resumen ejecutivo; el acceso se incorpora en el resumen mensual existente.
- Cambiar permisos, transiciones, historial o campos de negocio de una ODC.
- Rediseñar el dashboard, el detalle completo o la lámina exportable más allá
  de los controles necesarios para navegación y vista previa.
- Tests automatizados contra Cloudinary real; la integración real se verifica
  únicamente mediante los criterios manuales anteriores y los tests unitarios
  mockean el SDK, según `nestjs-best-practices`.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-28) ← gate obligatorio antes de implementar
