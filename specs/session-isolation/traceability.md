---
feature: "session-isolation"
status: approved
tags: [harness, spec, auth, frontend]
---

# Trazabilidad — [[session-isolation]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/auth/infrastructure/controller/auth.controller.spec.ts::R1` | working tree (uncommitted) |
| R2 | `backend/src/modules/auth/infrastructure/controller/auth.controller.spec.ts::R2` | working tree (uncommitted) |
| R3 | `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts::R3` | working tree (uncommitted) |
| R4 | `frontend/src/lib/session.ssr.test.ts::R4`, `frontend/src/lib/api.ssr.test.ts::R4` | working tree (uncommitted) |
| R5 | `frontend/src/components/layout/app-layout.test.tsx::R5`, `backend/src/modules/auth/infrastructure/controller/auth.controller.spec.ts::R11` | working tree (uncommitted) |
| R6 | `backend/src/modules/auth/infrastructure/guards/jwt-auth.guard.spec.ts::R6` | working tree (uncommitted) |
| R7 | `frontend/src/lib/use-authenticated-user.test.tsx::session-isolation R7` | working tree (uncommitted) |
| R8 | `frontend/src/components/login-form.test.tsx::R8` | working tree (uncommitted) |
| R9 | `frontend/src/lib/api.test.ts::session-isolation R9`, `frontend/src/lib/session-expiration.test.ts::session-isolation R9`, `frontend/src/components/session-expiration-redirect.test.tsx::session-isolation R9`, `frontend/src/components/layout/app-layout.test.tsx::R5,R12` | working tree (uncommitted) |
| R10 | `frontend/src/components/odc/odc-page-state.test.tsx::session-isolation R10` | working tree (uncommitted) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
