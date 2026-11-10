---
feature: "odc-quotation-attachments"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Diseño — [[odc-quotation-attachments]]

Este diseño implementa [[requirements]] después del gate humano y respeta
[[../../docs/architecture|architecture]].

## Decisiones técnicas

- Agregar una tabla de cotizaciones, con UUID opaco, ODC, nombre seguro,
  metadatos necesarios y referencia interna del proveedor. Una fila representa
  un archivo; orden estable para presentar la lista. No usar una columna única
  en la cabecera ni modificar las proyecciones históricas. No exponer referencias
  privadas en DTO. La migración 042 o la siguiente disponible deberá preservar
  datos existentes y ser transaccional (R1, R6, R7).
- Diseñar operaciones autenticadas de lista/carga, retirada y entrega por ODC
  y UUID de cotización. La entrega verifica pertenencia y `GetOdcUseCase`, y
  reutiliza URL temporal/autorizada conforme al mecanismo de archivos actual.
  Validar rol, creador y estado en servidor; no confiar en la visibilidad de
  botones del frontend (R2–R4, R6).
- Reutilizar `OdcUploadInterceptor` y `createOdcFilePipe` para una carga por
  solicitud. Una selección múltiple se procesa individualmente, con resultado
  por archivo y posibilidad de reintentar. Usar un identificador de operación
  estable y acotado por usuario/ODC para resolver respuestas inciertas sin
  duplicar asociaciones; un reintento no debe sobrescribir otro contenido (R5).
- El sistema actual de tickets solo contempla `invoiceFile` y
  `paymentEvidenceFile`, y la protección de recursos asociados consulta esas
  columnas. Extender el modelo, sus restricciones SQL, el worker y la búsqueda
  de asociaciones para cotizaciones; no reutilizarlo suponiendo que soporta
  colecciones. La asociación, validación de versión/estado y finalización del
  ticket comparten transacción. La retirada crea una tarea durable de limpieza
  con prueba de propiedad; coordinarla con recuperación para impedir borrado de
  objetos asociados y permitir reintentos seguros (R4, R5).
- Los cambios de archivo no son una edición de importes ni una transición de
  estado. Una ODC nueva se guarda explícitamente antes de adjuntar; una carga
  sobre un borrador histórico ya guardado no invoca el guardado del formulario
  ni cambia el régimen de IVA. La concurrencia usa las garantías y versión de
  la ODC existentes sin introducir cambios parciales (R1, R5).
- En frontend, integrar componentes y patrones existentes del formulario y
  detalle; consultar el catálogo shadcn conforme a `docs/conventions.md` antes
  de crear componentes. Presentar progreso/errores por archivo, datos
  persistidos y acceso de revisión. Las URLs de entrega se solicitan solo tras
  una acción autenticada, según el patrón actual (R6).

## Capas y verificación

- Dominio/aplicación: reglas de pertenencia, operación, autorización y estado;
  caso de uso de carga, consulta y retirada; interfaces de almacenamiento.
- Infraestructura: TypeORM, migración SQL, controlador multipart, ticket y
  worker de recuperación. Ensayar secuencia y rollback en PostgreSQL aislado;
  documentar precondiciones y compatibilidad de despliegue antes de una base
  compartida.
- Frontend: tipos/API, formulario de borrador y detalle/revisión; reutilizar
  controles accesibles del proyecto. Pruebas con nombres R1–R7, parser HTTP
  real, recuperación ante caídas, concurrencia en PostgreSQL y validación
  visual en escritorio y móvil, además de `./init.sh`.

## Alternativas descartadas

- Almacenar solo una URL o un arreglo en la cabecera: no da identidad ni
  control transaccional individual y no resuelve limpieza/concurrencia.
- Eliminar en el proveedor antes de confirmar la desvinculación: puede dejar
  la base apuntando a un archivo inexistente si falla la transacción.
- Tratar la carga como edición normal del borrador: aplicaría IVA a borradores
  históricos aunque el usuario solo pretenda adjuntar una cotización.
