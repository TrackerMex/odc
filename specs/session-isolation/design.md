---
feature: "session-isolation"
status: approved
tags: [harness, spec, auth, frontend]
---

# Diseño — [[session-isolation]]

## Decisiones técnicas

- Mantener JWT stateless en cookie `httpOnly`; cada request se autentica desde
  su propio header `Cookie` y no desde un singleton de sesión (R1, R2, R5, R6).
- Mantener `resolveSession()` sin leer ni escribir el store Zustand durante
  SSR. En cliente puede reutilizar el store del navegador para evitar una
  llamada redundante después de login (R4, R5).
- Mantener el usuario en el contexto de ruta de TanStack Router y seleccionar
  el dashboard en el loader según `context.user.role`; el store no será la
  fuente de identidad durante SSR (R3, R4).
- Cubrir el contrato con tests unitarios de auth y tests Vitest de loaders,
  route guard y resolución SSR. Los tests no requieren PostgreSQL (R1–R6).
- Hacer que toda página hija consuma `user` mediante la API de la ruta padre
  `/_authenticated`; el contexto propio de una ruta hija no se considera una
  fuente estable durante invalidaciones o navegación cliente (R7).
- Logout y expiración usan navegación con `reloadDocument` hacia `/login`; el
  formulario nace en un router sin matches del usuario anterior. Después de
  login, Zustand permite navegar a `/` sin una llamada cliente redundante a
  `/me`. Las respuestas `401` protegidas limpian el store y emiten un
  evento de expiración que el root traduce en navegación a `/login` (R8, R9).
- Mantener componentes de carga y error declarativos; el error no recarga la
  página ni ofrece un botón de reintento manual (R10).

## Archivos afectados

- `backend/src/modules/auth/**` — tests y, si hace falta, guard/controller o
  utilidades de cookie en infrastructure.
- `frontend/src/lib/api.ts` — forwarding aislado de cookies SSR.
- `frontend/src/lib/session.ts` y `frontend/src/stores/session.store.ts` —
  resolución y limpieza de sesión por entorno.
- `frontend/src/routes/_authenticated.tsx` y
  `frontend/src/routes/_authenticated/index.tsx` — contexto, guard y loaders
  por rol.
- `frontend/src/routes/__root.tsx`, `frontend/src/components/login-form.tsx` y
  `frontend/src/lib/session-events.ts` — sincronización y expiración global.
- `frontend/src/components/odc/odc-page-state.tsx` — estados de carga y error.
- `frontend/src/**/*.test.ts(x)` y `backend/src/**/*.spec.ts` — cobertura R1–R6.

## Alternativas descartadas

- Store global compartido en SSR: puede filtrar la identidad del primer
  visitante al siguiente request.
- Una sesión server-side global por rol: mezcla usuarios y agrega estado
  compartido innecesario; contradice el JWT stateless ya aprobado.
- Logout global o invalidación de todos los tokens: rompería sesiones válidas
  de otros clientes y queda fuera del alcance.
