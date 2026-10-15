# Revalidación de auditoría y registro del backlog

Fecha: 2026-10-01. Alcance autorizado: exclusivamente `TrackerMex/odc`.

## Base y aislamiento

- Checkout existente: `C:\Users\alex\Documents\sites\odc`, rama `main`, limpio al iniciar.
- HEAD y `git ls-remote origin refs/heads/main`: `a8a407e34b5ecc012b732f04d8f276f55aeec1b4`, igual a la auditoría suministrada.
- Worktree de esta sesión: `C:\Users\alex\Documents\Codex\2026-09-30\task\odc-audit`.
- Rama local: `audit/odc-hardening-20261001`. Sin push, merge, despliegue ni cambios en Notion.
- `CODEX_HOME` no definido en el shell; consultado `C:\Users\alex\.codex`. No existen `memories/memory_summary.md` ni `memories_v2/memory_summary.md`; no se modificaron memorias.
- Leídos `AGENTS.md`, instrucciones globales `.codex/AGENTS.md`, `docs/specs.md`, `docs/verification.md`, `docs/conventions.md`, `docs/architecture.md`, `init.sh`, `init.config.sh` y agentes locales leader/spec_author.
- `.agents/skills/` contiene skills visuales, sin una pertinente a este cambio backend. Referencia backend local: `.claude/skills/nestjs-best-practices/SKILL.md` y reglas de validación/tests, respetando la exclusión JWT documentada en AGENTS.

## Hallazgos actuales y correspondencia

Los seis hallazgos ya están en `plans/002-system-review.md`. Se registran como entregas del mismo plan, sin nuevos IDs F ni duplicar el diagnóstico. #1–#33 y sus nombres/estados permanecen intactos.

| Orden | Feature | Hallazgo existente | Prioridad | Evidencia actual |
|---|---|---|---|---|
| 1 | #34 `odc-multipart-protection` | F04 | P1 | `odc.controller.ts:124–160` valida MIME declarado con `skipMagicNumbersValidation: true`; `:305/:334` usan memoryStorage sin limits. `pnpm --dir backend why multer`: una versión 2.2.0, directa y vía Nest 11.1.28. |
| 2 | #35 `odc-temporary-file-delivery` | F02 | P1 | `cloudinary-file-storage.service.ts:43–52` usa expires_at con cloudinary.url; test `:168–197` solo mockea el generador. SDK 2.10.0 real, configuración ficticia y sin red: expires_at=100 y =200 producen URL idéntica. |
| 3 | #36 `odc-concurrent-updates` | F03 | P1 | `approve-budget.usecase.ts:21–41` lee/valida fuera de transacción; repository `:87–106` usa manager.save sin versión/estado esperado. Historial sí está en la transacción, pero no impide escrituras obsoletas. |
| 4 | #37 `odc-input-boundaries` | F05 + F06 | P1 | DTO positivo sin máximo; `computeTotalCents` multiplica sin rango; ORM quantity/unitPriceCents/totalCents son int32. DTOs pago/factura usan IsDateString sin strict; controller no tiene ParseUUIDPipe. F06 conserva P2 en el plan original. |
| 5 | #38 `odc-orphan-file-recovery` | F07 | P2 | Ambos casos de uso suben archivo antes de update; no hay compensación ni conciliación durable. Debe protegerse primero la concurrencia. |
| 6 | #39 `auth-login-rate-limit` | F08 | P1 antes de exposición | Login marcado Public; búsqueda de fuentes backend no encuentra throttler/rate limit/trust proxy. No se inspeccionó protección externa. |

Las dependencias del registro expresan el orden solicitado, no una necesidad arquitectónica de todos los pares. Cada entrega requiere spec propia aprobada, implementación secuencial, verificación y prueba humana antes de pasar a la siguiente.

## Fuentes primarias reconsultadas

- [GHSA-wc9g-mqfw-jrwm](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm): publicado 2026-08-28, afecta <2.3.0, parche 2.3.0.
- [GHSA-535w-7cp7-47q4](https://github.com/expressjs/multer/security/advisories/GHSA-535w-7cp7-47q4): mismo rango y fecha; requiere además configurar `limits.fieldArrayIndexLimit` al mínimo necesario.
- [Cloudinary: acceso temporal](https://cloudinary.com/documentation/control_access_to_media#providing_time_limited_access_to_private_media_assets): usar mecanismo soportado acorde al tipo del activo; conservar autorización antes de emitir acceso.

No se ejecutaron payloads DoS de los advisories. Las rutas de upload requieren sesión y rol; no se demostró ataque anónimo a ODC. JWT/roles son guards globales; borradores privados del creador y autorización de descarga reutilizada. No se plantea IDOR. Documentación declara entorno local; no se certifica producción.

## Verificación y límites

- **Passed**: comparación de SHA remoto/local, checkout limpio, árbol de dependencias Multer y prueba offline del SDK real Cloudinary.
- **Not run**: expiración contra activo real Cloudinary, carreras PostgreSQL, payloads multipart de seguridad, rate limit y prueba humana. No hay implementación aprobada todavía.
- `init.sh` copia `.env.example` al worktree; no se copió el `.env` real ni se iniciaron servicios, seeds o pruebas E2E con bases compartidas.
- Resultados del gate completo y estado final se registran al cerrar en `progress/history.md` y `STATUS.md`.

## Gate siguiente

`AGENTS.md` §3–4: «No se implementa sin spec aprobada»; un humano debe marcar la aprobación antes de código. Preparar únicamente la spec de #34 con frontmatter `draft`, casilla sin marcar y trazabilidad pendiente. No autoaprobar ni declarar corregidos los hallazgos por haberlos registrado.
