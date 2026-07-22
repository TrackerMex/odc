---
feature: "frontend-foundation"
status: approved        # draft | approved
tags: [harness, spec]
---

# Tareas — [[frontend-foundation]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — Proxy `/api` → `localhost:3001` en el dev server de Vite

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — Cliente API base: `fetch` con `credentials: 'include'` y parseo JSON en 2xx

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — Cliente API: error con status/message en respuestas no-2xx distintas de 401

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Cliente API: error 401 distinguible, sin redirección propia

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — `resolveSession()`: store de zustand primero, `GET /api/auth/me` si está vacío

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — Guard de rutas protegidas: redirige a `/login` sin sesión

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — Formulario de `/login` (bloque `login-01`): campos email/password validados con zod

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R8 — Login exitoso: escribe el usuario en el store (sin re-llamar `getMe`) y navega a `/`

- [ ] (1) Escribir test que falla para R8
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R9 — Login fallido (401): permanece en `/login` con mensaje de error, store sin cambios

- [ ] (1) Escribir test que falla para R9
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R10 — Guard inverso de `/login`: redirige a `/` con sesión activa

- [ ] (1) Escribir test que falla para R10
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R11 — Layout autenticado (`sidebar-07`/`nav-user`): muestra `fullName`, `role` y control de logout

- [ ] (1) Escribir test que falla para R11
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R12 — Logout: llama al endpoint, limpia el store y navega a `/login`

- [ ] (1) Escribir test que falla para R12
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R13 — Tras login exitoso, la ruta protegida no repite `GET /api/auth/me`

- [ ] (1) Escribir test que falla para R13
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
