---
feature: "completed-odc-document-review"
status: approved     # draft | approved
tags: [harness, spec]
---

# Diseño — [[completed-odc-document-review]]

> Ver [[requirements]] y [[../../docs/architecture|architecture]]. Se aplican
> `arch-single-responsibility`, `di-use-interfaces-tokens`,
> `error-handle-async-errors` y `test-mock-external-services` de
> `nestjs-best-practices`, más el modo Operate y `harden` de `impeccable`.

## Decisiones técnicas

- **Referencia versionada sin migración de esquema (R1, R3)**: los campos
  privados `paymentEvidenceFile` e `invoiceFile` mantienen su tipo `varchar`,
  pero las cargas nuevas almacenan una cadena compacta
  `cloudinary:v1:<resourceType>:<format>:<publicId>`. Un parser puro del módulo
  `files/domain` devuelve una referencia tipada; una cadena sin el prefijo se
  interpreta como `publicId` legacy con metadatos ausentes. Esto preserva los
  registros existentes y evita columnas nuevas en un proyecto que aún no
  dispone de migraciones productivas.
- **El puerto conserva el descriptor, no URLs (R1, R2)**:
  `UploadFileResult` incorpora `resourceType` y `format` del resultado real del
  SDK. `GetSignedUrlInput` recibe la referencia parseada. Los use-cases siguen
  dependiendo únicamente del token `FileStorageService`.
- **Resolución legacy dentro del adaptador (R2, R3)**: si la referencia no
  incluye metadatos, `CloudinaryFileStorageService` consulta
  `cloudinary.api.resource` como `image/authenticated` (los MIME permitidos
  PDF/JPEG/PNG se entregan como recursos `image`). Después genera
  `cloudinary.url` con `format`, `resource_type`, entrega `authenticated`,
  firma y expiración de 5 minutos.
- **Errores externos tipados (R3, R4)**: el dominio de `files` declara errores
  sin imports de Nest para recurso ausente y almacenamiento no disponible; el
  controller los traduce respectivamente a 404 y 502.
- **Navegación mínima desde el resumen (R5)**: `MonthlySummary` usa el `id` ya
  incluido en cada fila para enlazar `/odcs/$id`. Mes y página viven en search
  params para que volver restaure el contexto. La exportación queda estática.
- **Visor bajo demanda (R6–R8)**: `OdcDocumentPreview` reutiliza el `Dialog`
  de shadcn ya instalado, crea el `iframe` solo cuando está abierto y conserva
  una acción de apertura en pestaña nueva. No hay tool MCP de shadcn disponible
  en esta sesión, así que se reutiliza la primitiva existente sin crear una
  alternativa custom.

## Archivos afectados

- `backend/src/modules/files/domain/services/file-storage.service.ts` —
  descriptor, serialización y parseo.
- `backend/src/modules/files/domain/errors/*` — errores puros de almacenamiento.
- `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.ts`
  — metadatos, resolución legacy y firma.
- `backend/src/modules/odc/application/use-cases/upload-*.usecase.ts` y
  `get-*-file.usecase.ts` — escritura/lectura de la referencia versionada.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` —
  traducción HTTP de errores externos.
- `frontend/src/components/odc/monthly-summary.tsx` — navegación al detalle.
- `frontend/src/components/odc/odc-document-preview.tsx` — diálogo de vista.
- `frontend/src/components/odc/odc-detail.tsx` — composición de acciones.
- Tests colocados junto a cada unidad modificada.

## Alternativas descartadas

- **Columnas nuevas para metadatos**: exigirían migraciones productivas que el
  repositorio todavía no tiene.
- **Hacer públicos los assets o cambiar Cloudinary**: los recursos están sanos
  y deben conservar el tipo `authenticated`.
- **`fetch` + Blob en el cliente**: duplicaría memoria y manejo de cookies; el
  iframe sigue el 302 protegido de forma nativa.
- **Nueva cola de completadas**: el resumen mensual ya es el archivo operativo.
