---
feature: "odc-detail-history-hydration"
status: done
tags: [harness, spec]
---

# Trazabilidad — [[odc-detail-history-hydration]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | purchase-order.typeorm.repository.spec.ts::R1 create/transition/edit persisted metadata; odc-concurrent-updates.e2e-spec.ts::R1 persisted responses | rojo 3384374 → fix def6983; 13 unitarias y 38 PostgreSQL verdes |
| R2 | odc-concurrent-updates.e2e-spec.ts::R2 POST both uploads real JWT/Multer/PostgreSQL; odc-upload-history.test.tsx::R2 complete response state and errors | rojo 3384374 → fix def6983; UI fd84581 (contrato preservado); endpoints/historial/compensación y 4 UI verdes |
| R3 | purchase-order.typeorm.repository.spec.ts::R3 history read rejects; odc-concurrent-updates.e2e-spec.ts::R3 rollback create/order/event/ticket and upload compensation; suites #36/#38 | rojo 3384374 → fix def6983; refinement b374475; 38 PostgreSQL reales verdes |
| R4 | frontend/src/lib/odc.test.ts::R4 explicit Mexico instant formatting; frontend/src/components/odc/odc-hydration.test.tsx::R4,R7 SSR persisted instants | rojo 6b80cdc → fix 2784804; 11 focalizadas verdes |
| R5 | frontend/src/lib/odc.test.ts::R5 calendar across default zones; odc-hydration.test.tsx::R5,R7 visible calendar dates | ea4f4c2; contrato existente UTC preservado, 17 focalizadas verdes, no rojo artificial |
| R6 | frontend/src/components/odc/odc-hydration.test.tsx::R6,R7 new form across midnight, editing/persisted creation | rojo 0460cba → fix 60bb73b; 37 focalizadas verdes |
| R7 | odc-hydration.test.tsx::R4,R7 detail/existing form; R5,R7 calendar; R6,R7 new form, real hydrateRoot + interaction | rojo 6b80cdc → fix 2784804; ea4f4c2; rojo 0460cba → fix 60bb73b; sin onRecoverableError |

El implementer actualiza esta tabla tras cada commit que satisface un requisito; el reviewer comprueba que no quede ninguna fila pendiente antes de cerrar, conforme a [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5. Los tests deben nombrar los R-ids. Convención: `fix(odc): <descripción> (R1,R2)`.

Cierre: revisión independiente aprobada e init final exit0; 885 backend, 691 frontend y 38 PostgreSQL aisladas verdes.
