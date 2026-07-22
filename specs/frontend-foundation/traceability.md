---
feature: "frontend-foundation"
status: approved        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[frontend-foundation]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | vite.config.test.ts::R1: dev server proxies /api to the backend | 17e6c8f feat(frontend): add /api dev proxy and vitest setup (R1) |
| R2 | api.test.ts::R2: apiFetch sends credentials and parses JSON on 2xx | 3eea981 feat(frontend): add API client base with typed errors (R2,R3,R4) |
| R3 | api.test.ts::R3: apiFetch rejects with status + message on non-2xx, non-401 responses | 3eea981 feat(frontend): add API client base with typed errors (R2,R3,R4) |
| R4 | api.test.ts::R4: apiFetch rejects with a distinguishable 401 error, without redirecting | 3eea981 feat(frontend): add API client base with typed errors (R2,R3,R4) |
| R5 | session.test.ts::R5: resolveSession() consults the session store before GET /api/auth/me | 09bc5d0 feat(frontend): add session store and resolveSession() (R5) |
| R6 | _authenticated.test.tsx::R6: protected route guard redirects to /login without a session | 141ff6b feat(frontend): add protected route guard via pathless layout (R6) |
| R7 | login-form.test.tsx::R7: login form validates email/password with zod before submitting | eff8dcf feat(frontend): add login form and route with zod validation (R7) |
| R8 | login-form.test.tsx::R8: successful login stores the user and navigates to / without re-calling getMe | eff8dcf (impl, R7 commit) + 1cc7ff1 test(frontend): cover successful and failed login submit (R8,R9) |
| R9 | login-form.test.tsx::R9: failed login (401) keeps the user on /login with an error, store untouched | eff8dcf (impl, R7 commit) + 1cc7ff1 test(frontend): cover successful and failed login submit (R8,R9) |
| R10 | login.test.tsx::R10: /login guard redirects to / when a session already exists | eff8dcf (impl, R7 commit) + 228f1e0 test(frontend): cover /login inverse guard (R10) |
| R11 | app-layout.test.tsx::R11: authenticated layout shows fullName/role and a logout control, no section nav | fd9ca74 feat(frontend): add authenticated layout with nav-user + logout (R11,R12) |
| R12 | app-layout.test.tsx::R12: logout calls the API, clears the session store and navigates to /login | fd9ca74 feat(frontend): add authenticated layout with nav-user + logout (R11,R12) |
| R13 | _authenticated.session-reuse.test.tsx::R13: protected route reuses the post-login session without refetching | 998b34e test(frontend): cover post-login session reuse in the route guard (R13) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).

## Ampliación de cobertura (bug fix post-aprobación, sin commit)

| Cubre | Test (archivo::nombre) | Nota |
|---|---|---|
| R2 (SSR) | api.ssr.test.ts::"bug: apiFetch on the server must use an absolute URL and forward the incoming Cookie header" | Regresión de un bug real (no un R-id nuevo): `apiFetch` reventaba en SSR real (Docker) con "Failed to parse URL from /api/auth/me" — los tests existentes de R2-R4 corren en jsdom (con `window`) y nunca ejercitaban la rama de servidor. Este archivo fuerza `// @vitest-environment node` para cubrirla: URL absoluta + reenvío del header `Cookie`. Ver `progress/impl_frontend-foundation-bugfix.md`. Sin commit — cambios pendientes de revisión humana en el working tree. |
| R5/R6/R10/R13 (SSR) | session.ssr.test.ts::"bug: resolveSession() must not read or write the shared store on the server" | Segundo bug real encontrado en la verificación manual del fix anterior: `useSessionStore` es un único módulo compartido por todo el proceso Node, y `resolveSession()` lo leía/escribía también durante SSR — un visitante con sesión poblaba el store y el siguiente visitante SIN cookie, en el mismo proceso, heredaba su usuario (fuga de sesión entre usuarios). Fix: `resolveSession()` ahora bifurca por `isServer()` — en servidor siempre resuelve fresco vía `getMe()` sin tocar el store; en cliente mantiene el comportamiento store-first intacto (R8/R13). El guard (`_authenticated.tsx`) pasa el usuario resuelto por `beforeLoad` a través del contexto de ruta (por-request, no un singleton) y el store se hidrata solo en un efecto de cliente tras el montaje. Este archivo fuerza `// @vitest-environment node` y cubre explícitamente el caso de dos requests de servidor consecutivas con estados de sesión distintos sin contaminarse. Repro confirmado corregido en Docker (ver `progress/impl_frontend-foundation-bugfix.md`). Sin commit — cambios pendientes de revisión humana en el working tree. |
