---
feature: "auth-users"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[auth-users]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `backend/src/modules/users/domain/entities/user.entity.spec.ts::R1: pure User domain entity with restricted role` | `8aa3630` feat(auth-users): add pure User domain entity with restricted role (R1) |
| R2 | `backend/src/modules/users/infrastructure/entities/user.orm-entity.spec.ts::R2: ORM entity mapped onto the users table`; `backend/src/modules/users/infrastructure/repositories/user.typeorm.repository.spec.ts::R2: UserTypeOrmRepository implements the domain UserRepository`; `backend/src/modules/users/users.module.spec.ts::R2: UsersModule registers the repository under the 'UserRepository' token` | `f92c1c0` feat(auth-users): add users persistence with UserRepository and ORM entity (R2) |
| R3 | `backend/src/modules/users/application/use-cases/seed-users.usecase.spec.ts::R3: seed creates the 3 users hashed with bcrypt` | `d2900e5` feat(auth-users): add seed use-case and pnpm seed script (R3) |
| R4 | `backend/src/modules/users/application/use-cases/seed-users.usecase.spec.ts::R4: seed is idempotent when users already exist` | `ed7108a` feat(auth-users): make seed idempotent on existing users (R4) |
| R5 | pendiente | pendiente |
| R6 | pendiente | pendiente |
| R7 | pendiente | pendiente |
| R8 | pendiente | pendiente |
| R9 | pendiente | pendiente |
| R10 | pendiente | pendiente |
| R11 | pendiente | pendiente |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
