---
feature: "odc-invoice-completion"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-invoice-completion]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `upload-invoice.dto.spec.ts::R1: UploadInvoiceDto requires warehouseEntryDate and keeps invoiceNumber/invoiceDate/observations optional`, `odc.controller.spec.ts::R1: invoice file validation (MIME/size) before Cloudinary (odc-invoice-completion)` | aa48834 feat(odc): add UploadInvoiceDto and invoice file validation pipe (R1) |
| R2 | `upload-invoice.usecase.spec.ts::R2: upload-invoice transitions EVIDENCIA_PAGO_SUBIDA to COMPLETADA for DIRECTOR_OPS`, `odc.controller.spec.ts::R2: POST /api/odcs/:id/invoice uploads to Cloudinary with 200 restricted to DIRECTOR_OPS` | 0359d25 feat(odc): wire T9 POST :id/invoice route and UploadInvoiceUseCase (R2,R3) |
| R3 | `upload-invoice.usecase.spec.ts::R3: upload-invoice rejects unknown ids and non-EVIDENCIA_PAGO_SUBIDA statuses`, `odc.controller.spec.ts::R3: invoice responds 404 for an unknown id and 409 outside EVIDENCIA_PAGO_SUBIDA` | 0359d25 feat(odc): wire T9 POST :id/invoice route and UploadInvoiceUseCase (R2,R3) |
| R4 | `odc-response.mapper.spec.ts::R4: toOdcResponse hides invoiceFile and exposes hasInvoice (odc-invoice-completion)` | c05c5d6 feat(odc): hide invoiceFile and expose hasInvoice in odc responses (R4) |
| R5 | `get-invoice-file.usecase.spec.ts::R5: GET files/invoice resolves a short-lived signed Cloudinary URL` | 2bf6153 feat(odc): add GetInvoiceFileUseCase for signed-URL redirect (R5,R6) |
| R6 | `get-invoice-file.usecase.spec.ts::R6: files/invoice rejects unknown ids, missing invoice and BORRADOR of another creator` | 2bf6153 feat(odc): add GetInvoiceFileUseCase for signed-URL redirect (R5,R6) |
| R7 | `odc.controller.spec.ts::R7: GET /api/odcs/:id/files/:kind generalizes the download route (evidence|invoice)` (plus regression re-runs in `R5`/`R6` describe blocks for both `evidence` and `invoice`) | 854eef3 feat(odc): generalize GET :id/files/:kind to evidence|invoice routes (R7) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
