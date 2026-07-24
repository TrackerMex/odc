---
feature: "odc-draft-editing"
status: approved        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-draft-editing]]

| Requisito | Test | Commit |
|---|---|---|
| R1 | `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts::R1,R5: draft editing access is limited to the creator in DIRECTOR_OPS` | working tree |
| R2 | `frontend/src/components/odc/odc-form.test.tsx::R2,R3,R4: saved BORRADOR editing and status transition — saves draft changes without submitting` | working tree |
| R3 | `frontend/src/components/odc/odc-form.test.tsx::R2,R3,R4: saved BORRADOR editing and status transition — persists draft changes before submitting them` | working tree |
| R4 | `frontend/src/components/odc/odc-form.test.tsx::R2,R3,R4: saved BORRADOR editing and status transition — keeps saved draft data when submit fails` | working tree |
| R5 | `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts::R1,R5: draft editing access is limited to the creator in DIRECTOR_OPS` | working tree |
