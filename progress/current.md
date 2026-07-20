# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Plantilla (sesión sin iniciar)

```
feature: —
inicio: —
agentes lanzados: —
estado: sin sesión activa
```


---

_Cuando inicies una sesión, reemplaza la plantilla con:_

```
feature: <nombre de la feature>
id: <id en feature_list.json>
inicio: <fecha y hora>
plan:
  - <paso 1>
  - <paso 2>
estado: pending / spec_ready / in_progress / done
bloqueos: —
spec_author: pendiente / en curso / done
implementer: pendiente / en curso / done
reviewer: pendiente / en curso / aprobado / rechazado
```

---

```
feature: odc-payment-evidence
id: 7
inicio: 2026-07-20
plan:
  - Módulo files: interfaz FileStorageService (token 'FileStorageService') + CloudinaryFileStorageService (SDK cloudinary mockeado en tests)
  - UploadPaymentEvidenceDto (multer memoryStorage, validación MIME pdf/jpg/png + <=10MB antes de subir)
  - UploadPaymentEvidenceUseCase: sube a Cloudinary, persiste public_id (nunca URL), transiciona T8, historial
  - GetPaymentEvidenceFileUseCase: valida visibilidad, responde 302 a URL firmada de corta expiración
  - POST /api/odcs/:id/payment-evidence y GET /api/odcs/:id/files/evidence en odc.controller.ts
  - R4: mapper de respuesta oculta paymentEvidenceFile crudo, expone hasPaymentEvidence boolean en todos los endpoints que serializan PurchaseOrder
  - Wiring en odc.module.ts (importa módulo files)
  - TDD por requisito R1-R7, ver specs/odc-payment-evidence/tasks.md
estado: in_progress
bloqueos: —
spec_author: done
implementer: en curso
reviewer: pendiente
```
