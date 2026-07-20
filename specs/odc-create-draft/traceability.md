---
feature: "odc-create-draft"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[odc-create-draft]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts::R1: pure PurchaseOrder domain entity with restricted status` | `76783c1` feat(odc): add pure PurchaseOrder domain entity with computed total (R1,R2) |
| R2 | `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts::R2: totalCents computed in the domain, never accepted from outside` | `76783c1` feat(odc): add pure PurchaseOrder domain entity with computed total (R1,R2) |
| R3 | `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts::R3: transition covers the whole T1-T10 state machine` | `77a4855` feat(odc): add domain state machine T1-T10 with typed errors (R3,R4) |
| R4 | `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts::R4: invalid transitions raise typed domain errors without mutating` | `77a4855` feat(odc): add domain state machine T1-T10 with typed errors (R3,R4) |
| R5 | `backend/src/modules/odc/infrastructure/entities/purchase-order.orm-entity.spec.ts::R5: ORM entity mapped onto the purchase_orders table`; `backend/src/modules/odc/infrastructure/entities/odc-status-history.orm-entity.spec.ts::R5: ORM entity mapped onto the odc_status_history table`; `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.spec.ts::R5: ODC update and history insert share a single transaction` | `ed5c4e1` feat(odc): add TypeORM persistence for purchase orders and status history (R5) |
| R6 | `backend/src/modules/odc/domain/entities/purchase-order.entity.spec.ts::R6: ODC-YYYY-NNNNN numbering with a per-year sequence`; `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.spec.ts::R6: create assigns the next yearly number and retries on UNIQUE collision` | `0a003e3` feat(odc): add ODC-YYYY-NNNNN numbering with yearly sequence and unique retry (R6) |
| R7 | pendiente | pendiente |
| R8 | pendiente | pendiente |
| R9 | pendiente | pendiente |
| R10 | pendiente | pendiente |
| R11 | pendiente | pendiente |
| R12 | pendiente | pendiente |
| R13 | pendiente | pendiente |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
