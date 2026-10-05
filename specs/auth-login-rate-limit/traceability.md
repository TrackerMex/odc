---
feature: auth-login-rate-limit
status: done
---

# Trazabilidad

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | auth-login-rate-limit.e2e-spec.ts::R1 HTTP429/Retry-After; login-form.test.tsx y api.test.ts::auth-login-rate-limit R1 | rojo1501ce3/c4958c7/a5951c1; verde9419938 |
| R2 | trusted-proxy.spec.ts::R2 HTTP directo y proxy real; PostgreSQL::R2 XFF/IP y IPv6 | rojo1501ce3; verde9419938 |
| R3 | PostgreSQL::R3 dos instancias/25 concurrentes/DB503/expiry/cleanup; formulario::R3 | rojo1501ce3/c4958c7/a5951c1; verde9419938 |
| R4 | PostgreSQL::R4 cuentas/keys/known-unknown/401/cookie/me/logout | rojo1501ce3/c4958c7; verde9419938 |
| R5 | PostgreSQL12/12 de #39, agregado43/43 (#36/#38/#39); proxy17/17+bootstrap5; init880backend/672frontend verde | 9419938; init final exit0, cierre técnico delegado |

Typecheck adicional backend68 y frontend18 errores previos, cero nuevos.
Lint de los cuatro archivos frontend tocados verde, además del lint del arnés.
Verificación final init exit0 tras ajustes de lint/fixtures; no revisión
independiente. Infraestructura externa, prueba manual y Cloudinary live NOT RUN.
