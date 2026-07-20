---
feature: "odc-payment-evidence"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-payment-evidence]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `upload-payment-evidence.dto.spec.ts::R1: UploadPaymentEvidenceDto keeps evidenceReference optional`; `odc.controller.spec.ts::R1: payment-evidence file validation (MIME/size) before Cloudinary (odc-payment-evidence)` | `34c85fe` feat(odc-payment-evidence): add UploadPaymentEvidenceDto with optional evidenceReference (R1); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R2 | `upload-payment-evidence.usecase.spec.ts::R2: upload-payment-evidence transitions PAGO_REGISTRADO to EVIDENCIA_PAGO_SUBIDA for ADMINISTRACION`; `odc.controller.spec.ts::R2: POST /api/odcs/:id/payment-evidence uploads to Cloudinary with 200 restricted to ADMINISTRACION` | `0d34d1f` feat(odc-payment-evidence): add UploadPaymentEvidenceUseCase for T8 (R2,R3); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R3 | `upload-payment-evidence.usecase.spec.ts::R3: upload-payment-evidence rejects unknown ids and non-PAGO_REGISTRADO statuses`; `odc.controller.spec.ts::R3: payment-evidence responds 404 for an unknown id and 409 outside PAGO_REGISTRADO` | `0d34d1f` feat(odc-payment-evidence): add UploadPaymentEvidenceUseCase for T8 (R2,R3); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R4 | `odc-response.mapper.spec.ts::R4: toOdcResponse hides paymentEvidenceFile and exposes hasPaymentEvidence`; `odc-response.mapper.spec.ts::R4: toOdcPageResponse maps every item through toOdcResponse`; `odc.controller.spec.ts::R4: GET /api/odcs/:id detail never exposes the raw paymentEvidenceFile (odc-payment-evidence)` | `dd3900f` feat(odc-payment-evidence): add response mapper hiding paymentEvidenceFile behind hasPaymentEvidence (R4); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R5 | `get-payment-evidence-file.usecase.spec.ts::R5: GET files/evidence resolves a short-lived signed Cloudinary URL`; `odc.controller.spec.ts::R5: GET /api/odcs/:id/files/evidence redirects (302) to a signed Cloudinary URL` | `d196f90` feat(odc-payment-evidence): add GetPaymentEvidenceFileUseCase for signed-URL redirect (R5,R6); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R6 | `get-payment-evidence-file.usecase.spec.ts::R6: files/evidence rejects unknown ids, missing evidence and BORRADOR of another creator`; `odc.controller.spec.ts::R6: files/evidence responds 404 for an unknown id, 404 without evidence yet, and 403 on a BORRADOR of another creator` | `d196f90` feat(odc-payment-evidence): add GetPaymentEvidenceFileUseCase for signed-URL redirect (R5,R6); `d63dde3` feat(odc-payment-evidence): wire T8 payment-evidence routes and mask paymentEvidenceFile everywhere (R1,R2,R3,R4,R5,R6,R7) |
| R7 | `cloudinary-file-storage.service.spec.ts::R7: CloudinaryFileStorageService configures the SDK from ConfigService`; `cloudinary-file-storage.service.spec.ts::R7: CloudinaryFileStorageService.upload uploads the buffer and returns only the public_id`; `cloudinary-file-storage.service.spec.ts::R7: CloudinaryFileStorageService.getSignedUrl requests a short-lived signed URL`; `files.module.spec.ts::R7: FilesModule registers CloudinaryFileStorageService under the 'FileStorageService' token and exports it` | `190e60b` feat(odc-payment-evidence): add FileStorageService port and CloudinaryFileStorageService adapter (R7) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
