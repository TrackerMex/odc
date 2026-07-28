---
feature: "completed-odc-document-review"
status: approved     # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[completed-odc-document-review]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/files/domain/services/file-storage.service.spec.ts::R1`; `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.spec.ts::R1 upload` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R2 | `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.spec.ts::R2`; `get-payment-evidence-file.usecase.spec.ts::R2`; `get-invoice-file.usecase.spec.ts::R2` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R3 | `backend/src/modules/files/domain/services/file-storage.service.spec.ts::R3`; `cloudinary-file-storage.service.spec.ts::R3` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R4 | `backend/src/modules/odc/infrastructure/controller/odc.controller.spec.ts::R3/R4 file delivery` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R5 | `frontend/src/components/odc/monthly-summary.test.tsx::R5 completed detail link + URL state` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R6 | `frontend/src/components/odc/odc-detail.test.tsx::R6 protected previews` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R7 | `frontend/src/components/odc/odc-detail.test.tsx::R7 resilient and accessible preview` | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |
| R8 | `frontend/src/components/odc/odc-detail.test.tsx::R7,R8 detail`; validación manual local de ODC completada | `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)` |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(completed-odc-document-review): <desc> (R1,R2)`.
