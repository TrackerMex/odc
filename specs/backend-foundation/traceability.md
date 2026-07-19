---
feature: "backend-foundation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[backend-foundation]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/app.module.spec.ts::R1: global ConfigModule loading the repo root .env` | `c96671e` feat(backend-foundation): register global ConfigModule loading root .env (R1) |
| R2 | `backend/src/config/typeorm.config.spec.ts::R2: TypeORM options built from DATABASE_URL` | `7e0c964` feat(backend-foundation): add typeorm options factory wired via forRootAsync (R2,R3) |
| R3 | `backend/src/config/typeorm.config.spec.ts::R3: synchronize disabled only in production` | `7e0c964` feat(backend-foundation): add typeorm options factory wired via forRootAsync (R2,R3) |
| R4 | pendiente | pendiente |
| R5 | pendiente | pendiente |
| R6 | pendiente | pendiente |
| R7 | pendiente | pendiente |
| R8 | pendiente | pendiente |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
