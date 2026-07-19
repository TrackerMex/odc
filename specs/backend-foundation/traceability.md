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
| R4 | `backend/src/bootstrap.spec.ts::R4: global ValidationPipe with whitelist enabled` | `def07ce` feat(backend-foundation): add app setup helper with global pipe and api prefix (R4,R5) |
| R5 | `backend/src/bootstrap.spec.ts::R5: global route prefix 'api'` | `def07ce` feat(backend-foundation): add app setup helper with global pipe and api prefix (R4,R5) |
| R6 | `backend/src/bootstrap.spec.ts::R6: HTTP port from PORT with default 3001` | `1e2809e` feat(backend-foundation): resolve http port from PORT with 3001 default (R6) |
| R7 | `backend/src/health.controller.spec.ts::R7: GET /api/health responds { status: 'ok' }` | `d7747e2` feat(backend-foundation): add health controller returning status ok (R7) |
| R8 | `backend/src/app.module.spec.ts::R8: scaffold getHello endpoint removed` | `87bb410` feat(backend-foundation): remove getHello scaffold in favor of health endpoint (R8) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
