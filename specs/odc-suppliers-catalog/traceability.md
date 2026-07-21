---
feature: "odc-suppliers-catalog"
status: approved        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-suppliers-catalog]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `supplier.entity.spec.ts::R1: pure Supplier domain entity` | `78ee7b0` feat(suppliers): add pure Supplier domain entity (R1) |
| R2 | `supplier.orm-entity.spec.ts::R2`, `supplier.typeorm.repository.spec.ts::R2`, `suppliers.module.spec.ts::R2` | `1fa5727` feat(suppliers): add suppliers table persistence and repository token (R2) |
| R3 | `seed-suppliers.usecase.spec.ts::R3` | `faf1cda` feat(suppliers): add idempotent catalog seed use-case (R3) |
| R4 | `list-suppliers.usecase.spec.ts::R4`, `supplier.controller.spec.ts::R4` | `5a70597` feat(suppliers): add GET /api/suppliers listing sorted alphabetically (R4) |
| R5 | `create-draft.usecase.spec.ts::R5`, `update-draft.usecase.spec.ts::R5`, `odc.controller.spec.ts::R5` | `743bc9c` feat(odc): validate supplier against suppliers catalog on create/update (R5) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
