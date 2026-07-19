---
feature: "auth-users"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[auth-users]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## Preparación (prerequisito, sin ciclo TDD)

- [ ] Instalar dependencias en `backend/`: `@nestjs/jwt`, `bcrypt`,
      `cookie-parser` y dev `@types/bcrypt`, `@types/cookie-parser`
      (`pnpm add`). Verificar `pnpm build` en verde antes de empezar los
      ciclos TDD.

## R1 — Entidad de dominio `User` pura con rol restringido

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — Persistencia: ORM entity `users` (email UNIQUE) + `UserRepository`

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — Seed crea los 3 usuarios con bcrypt de `SEED_PASSWORD`/default

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Seed idempotente (segunda ejecución no duplica ni falla)

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — Login exitoso: 200 `{ user }` + cookie httpOnly SameSite=Lax

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — JWT firmado con `JWT_SECRET`, 8h, payload `{ sub, role }`

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — Login fallido: 401 genérico sin cookie

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R8 — `JwtAuthGuard` global con `@Public()` en login y health

- [ ] (1) Escribir test que falla para R8
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R9 — `RolesGuard` + `@Roles(...)`: 403 si el rol no está en la lista

- [ ] (1) Escribir test que falla para R9
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R10 — `GET /api/auth/me`: usuario de la sesión sin `passwordHash`

- [ ] (1) Escribir test que falla para R10
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R11 — `POST /api/auth/logout` limpia la cookie de sesión

- [ ] (1) Escribir test que falla para R11
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
