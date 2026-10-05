---
feature: odc-orphan-file-recovery
status: done
---

# Trazabilidad

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | upload-recovery.spec.ts::R1; cloudinary-owned-files.spec.ts::R1; PostgreSQL asociación/version/historial | rojo17203d7; verde8e6851d |
| R2 | upload-recovery.spec.ts::R2; odc-orphan-file-recovery.e2e-spec.ts::R2 commit ambiguo/fence/asociaciones | rojo17203d7; verde8e6851d |
| R3 | cloudinary-owned-files.spec.ts::R3 propiedad/assetId/ausencia; PostgreSQL rollback/conflicto | rojo17203d7; verde8e6851d |
| R4 | upload-recovery.spec.ts::R4 error original; PostgreSQL retry/reinicio/lease/worker | rojo17203d7; verde8e6851d |
| R5 | tests anteriores nombranR5; PostgreSQL15/15 de #38 +16/16 de #36; init863backend/661frontend exit0 | 8e6851d; cierre9931c47 |

Typecheck adicional68errores previos (70 antes, dos fixtures relacionados
corregidos), cero nuevos. Auto-revisión, no revisión independiente. Prueba
manual y Cloudinary live NOT RUN por indicación del usuario.
