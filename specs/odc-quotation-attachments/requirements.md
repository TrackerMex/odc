---
feature: "odc-quotation-attachments"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Requisitos — [[odc-quotation-attachments]]

> Propuesta para revisión humana. Cada R-id es verificable; ver [[design]].

## Requisitos funcionales

- **R1 — Adjuntar varias cotizaciones**: WHEN el Director de Operaciones
  creador de una ODC guardada en `BORRADOR` o `RECHAZADA` adjunta un documento válido THE
  SYSTEM SHALL asociarlo a esa ODC, conservar los demás documentos y devolver
  su identificador y nombre legible. Los adjuntos son opcionales; se permiten
  varios por ODC y un archivo por solicitud. La UI podrá seleccionar varios
  y enviarlos individualmente. La asociación no SHALL cambiar estado, partidas,
  proveedor, importes fiscales ni historial de estados. Una ODC todavía no
  guardada debe guardarse antes de adjuntar. Abrir el formulario o adjuntar a
  un borrador histórico ya guardado SHALL NOT ejecutar una edición implícita
  ni aplicar IVA. *Verificación*: cero, uno y varios archivos; recarga,
  persistencia y borrador histórico sin cambio fiscal.

- **R2 — Validación de carga**: WHEN llega una carga autenticada THE SYSTEM
  SHALL admitir archivos no vacíos de hasta 10 485 760 bytes inclusive, de
  tipo PDF, JPEG o PNG, con MIME y firma real coherentes. SHALL reutilizar los
  límites multipart existentes antes de cargar o persistir. IF falta archivo,
  está vacío, su firma o MIME no corresponde, o excede el límite THEN THE
  SYSTEM SHALL devolver el error HTTP adecuado sin asociar ni subirlo. SHALL
  preservar los límites existentes para campos, partes y número de archivos
  por solicitud. *Verificación*: parser HTTP real, límite exacto y +1, tres
  formatos, archivo vacío, MIME o firma falsos y parámetros excesivos.

- **R3 — Autorización y consulta**: WHILE la ODC esté en `BORRADOR` o
  `RECHAZADA`, solo su creador con rol `DIRECTOR_OPS` SHALL poder añadir o
  retirar cotizaciones; los demás usuarios no SHALL ver ni descargar los
  documentos de un borrador ajeno. WHEN una ODC es visible a otros roles THE
  SYSTEM SHALL permitirles consultar sus cotizaciones, incluidos Administración
  y Dirección General durante su revisión. En cualquier otro estado distinto de
  `BORRADOR` y `RECHAZADA` SHALL impedir la adición o retirada. Rechazar o
  completar la ODC no elimina los adjuntos. La ODC rechazada mantiene las
  reglas actuales de visibilidad para los roles autorizados.
  Toda descarga SHALL verificar la visibilidad de la ODC y que el documento
  pertenece a ella, incluso si se conoce su identificador. Sin sesión se
  responde 401; los demás errores de acceso y de recurso inexistente seguirán
  la política vigente de ODC. *Verificación*: matriz de roles, creador/otro,
  estados y documento cruzado entre ODC.

- **R4 — Retirar una cotización**: WHEN el creador autorizado retira un
  adjunto de su `BORRADOR` o `RECHAZADA` THE SYSTEM SHALL dejar de mostrarlo y rechazar nuevas
  solicitudes de descarga al confirmarse la operación, sin afectar otras
  cotizaciones o archivos de factura/comprobante. Un enlace temporal entregado
  antes de retirar el archivo puede seguir funcionando hasta su vencimiento o
  la eliminación del objeto. La desvinculación SHALL ser transaccional;
  la limpieza del objeto de almacenamiento SHALL ser durable, reintentable y
  limitada a recursos propiedad de esta operación. IF falla la desvinculación
  THEN el documento SHALL permanecer asociado y accesible. *Verificación*:
  éxito, fallo de persistencia, proveedor no disponible, reintento y adjuntos
  o recursos ajenos protegidos.

- **R5 — Fallos y concurrencia**: IF la validación, subida, asociación o
  autorización falla THEN THE SYSTEM SHALL conservar los adjuntos ya
  confirmados y no registrar uno incompleto. SHALL registrar trabajo de
  recuperación durable antes de contactar al proveedor y nunca borrar un
  recurso que ya quedó asociado, aunque falle la respuesta o se reinicie el
  proceso. WHEN una carga o retirada compite con otra edición o con el envío o reenvío
  de la ODC THE SYSTEM SHALL verificar estado y versión en la transacción y
  rechazar conflictos sin sobrescribir cambios; un archivo no asociado queda
  sujeto a recuperación. Un reintento tras respuesta incierta SHALL permitir
  identificar el resultado sin duplicar una carga ya confirmada. La UI SHALL
  identificar éxito y fallo por archivo y permitir reintentos seguros.
  *Verificación*: caída antes/después de subir y asociar, repetición, reinicio,
  dos cargas concurrentes, carga frente a envío y fallo parcial de selección.

- **R6 — API y presentación**: WHEN una ODC visible se abre o revisa THE
  SYSTEM SHALL presentar su lista de cotizaciones, con nombre y acción de
  consulta, o indicar que no tiene documentos; una carga fallida SHALL mostrar
  un error comprensible. El formulario de `BORRADOR` guardado o `RECHAZADA`
  SHALL permitir añadir varios y retirar los ya asociados antes de enviar o
  reenviar. Las acciones de
  revisión y detalle SHALL mostrar los documentos persistidos, sin requerir
  cotización para enviar o aprobar. La API SHALL usar identificadores opacos
  asociados a la ODC y entrega temporal autenticada conforme al mecanismo
  existente, sin exponer credenciales o referencias internas del proveedor en
  respuestas de datos. *Verificación*: tests de formulario, detalle y revisión
  por rol; ausencia, varios, envío parcial, recarga y descarga autenticada.

- **R7 — Migración y compatibilidad**: WHEN se despliegue esta feature THE
  SYSTEM SHALL incluir una migración SQL versionada para las asociaciones y
  la recuperación requeridas, posterior al esquema fiscal; las ODC existentes
  tendrán lista vacía y conservarán estados, versiones, importes, partidas,
  historial y archivos anteriores. IF falla la migración THEN SHALL hacer
  rollback sin cambios parciales. SHALL probarse en PostgreSQL aislado con
  datos históricos antes de cualquier aplicación a una base compartida. Las
  rutas de evidencia y factura, sus permisos, recuperación y respuestas
  existentes SHALL seguir funcionando. *Verificación*: migración y rollback,
  datos históricos, y regresiones HTTP y de recuperación de ambos archivos.

## Decisiones acordadas

- El 13 de noviembre de 2026 el usuario aprobó que su creador pueda añadir y
  retirar cotizaciones en ODC `BORRADOR` y `RECHAZADA` antes de enviar o
  reenviar. En los demás estados quedan disponibles para consulta y no se
  modifican mediante esta función.
- No se fija un número máximo de cotizaciones por ODC; el límite de 10 MiB se
  aplica por archivo y cada carga se realiza individualmente.

## Fuera de alcance

- Concentrado semanal, envío por correo, comparación de precios, aprobación
  independiente de cotizaciones y modificación de factura o comprobante.
- Guardado automático de una ODC sin que el usuario lo solicite; cambios a
  estados de ODC o al tratamiento aprobado de IVA histórico.

## Aprobación

El usuario expresó su aprobación en el chat el 13 de noviembre de 2026 con
el cambio anterior. La casilla siguiente registra la marca humana requerida
por `AGENTS.md`.

- [ ] Aprobado por humano (fecha: ____)
