# Historial de sesiones

> Bitácora append-only. Cada sesión cerrada agrega una entrada al final.
> No se editan entradas anteriores.

## Convención de archivos en progress/

Cada tipo de artefacto de sesión tiene su propio prefijo (observado y
consolidado a partir de proyectos reales que usan este harness):

| Archivo | Quién lo escribe | Contenido |
|---|---|---|
| `explore_<feature>.md` | `explorer` | Investigación previa a implementar una feature ambigua |
| `impl_<feature>.md` | `implementer` | Qué se creó/modificó, decisiones, output de build/tests |
| `review_<feature>.md` | `reviewer` | Veredicto (aprobado/rechazado) contra CHECKPOINTS.md |
| `qa_<feature>.md` | quien haga QA manual (opcional) | Resultados de verificación manual/exploratoria |

Formato de cada entrada de `history.md` (una por sesión cerrada):

```
## Sesión <fecha> — <feature> (id: <id>)

- **Feature:** <resumen>
- **Spec:** [[specs/<feature>/requirements|spec]]
- **Acciones:** <qué se hizo>
- **Resultado:** <build/tests, aprobado/rechazado>
- **Commits:** <hash(es) + mensaje(s)>
- **Estado final:** <in_progress|done>
```

---

_El historial comenzará aquí cuando se complete la primera sesión._

## Sesión 2026-07-18/19 — backend-foundation (id: 1)

- **Feature:** fundación del backend NestJS: ConfigModule global (.env raíz), TypeORM/Postgres vía factory, ValidationPipe whitelist, prefijo /api, puerto PORT|3001, GET /api/health, scaffold getHello eliminado
- **Spec:** [[specs/backend-foundation/requirements|spec]] (R1–R8, aprobada por humano 2026-07-18)
- **Acciones:** Fase 0 del plan maestro (stack, harness, backlog de 13 features) + spec_author + implementer (TDD, 1 corte por límite de sesión, reanudado) + reviewer
- **Resultado:** ./init.sh exit 0; 15 tests backend en verde; review APROBADO (C1–C6) → progress/review_backend-foundation.md
- **Commits:** 7187c59 harness, 16cc1f9 spec, b8d25eb..0699abd implementación por requisito (feat+docs por R-id)
- **Estado final:** done

## Sesión 2026-07-19 — auth-users (id: 2)

- **Feature:** módulos users + auth: entidad User pura, ORM entity + UserRepository (token string), seed idempotente de 3 usuarios (bcrypt, pnpm seed), login/logout/me con JWT 8h {sub, role} en cookie httpOnly odc_session, JwtAuthGuard global con @Public() (login/health), RolesGuard + @Roles()
- **Spec:** [[specs/auth-users/requirements|spec]] (R1–R11, aprobada por humano 2026-07-19)
- **Acciones:** spec_author → aprobación humana → implementer (TDD por requisito) → reviewer
- **Resultado:** ./init.sh en verde (15 suites, 63 tests, build + lint); review APROBADO (0 críticos, 0 mayores, 3 menores) → progress/review_auth-users.md; traceability 11/11 completa
- **Commits:** c2f934b spec, 7380749 deps, 8aa3630..5866e61 implementación por R-id, b55b768 lint, 5424c18 reporte
- **Estado final:** done

## Sesión 2026-07-19/20 — odc-create-draft (id: 3)

- **Feature:** módulo `odc` — entidad de dominio pura `PurchaseOrder` con `totalCents` calculado, máquina de estados completa T1–T10 (errores tipados 403/409), persistencia TypeORM `purchase_orders` + `odc_status_history` (update+historial en misma transacción), numeración `ODC-YYYY-NNNNN` con reintento ante colisión; endpoints POST crear borrador (DIRECTOR_OPS), POST submit (T2/T10, solo creador), PATCH editar (BORRADOR/RECHAZADA), GET lista paginada (BORRADOR visible solo al creador), GET detalle con historial
- **Spec:** [[specs/odc-create-draft/requirements|spec]] (R1–R13, aprobada por humano 2026-07-19)
- **Acciones:** spec_author → aprobación humana → implementer TDD por requisito (2 tandas: 1er implementer cortado por límite de sesión API a mitad de R12, 2do implementer reanudado con contexto exacto del corte, terminó R12+R13) → reviewer
- **Resultado:** ./init.sh en verde (29 suites, 220 tests, build+lint); review APROBADO (C1–C6, 0 bloqueantes, 1 nota cosmética en frontmatter de traceability.md) → progress/review_odc-create-draft.md; traceability 13/13 completa
- **Commits:** d25f170 spec, 76783c1..622bf4d implementación R1–R11, 7222ece..106ed32 implementación R12–R13, 401c470 reporte
- **Estado final:** done

## Sesión 2026-07-20 — odc-budget-validation (id: 4)

- **Feature:** endpoints T3/T4 sobre el módulo `odc` ya existente — `POST /api/odcs/:id/approve-budget` (ADMINISTRACION, PENDIENTE_ADMIN → PRESUPUESTO_APROBADO) y `POST /api/odcs/:id/reject` (ADMINISTRACION, `rejectionReason` obligatorio, PENDIENTE_ADMIN → RECHAZADA); reusa intacta la máquina de estados de dominio de `odc-create-draft` (T4/T6 comparten acción `reject` en el dominio, `/reject` queda mecánicamente listo para T6 cuando la feature 5 amplíe roles)
- **Spec:** [[specs/odc-budget-validation/requirements|spec]] (R1–R5, aprobada por humano 2026-07-20)
- **Acciones:** spec_author → aprobación humana → implementer TDD por requisito (sin cortes, 1 sola tanda) → reviewer, con verificación explícita del caso 403 vs 409 en R5 (PRESUPUESTO_APROBADO + actor ADMINISTRACION = 403 por mismatch de rol de T6, no 409)
- **Resultado:** ./init.sh en verde (32 suites, 256 tests, build+lint); review APROBADO (C1–C6, 0 observaciones) → progress/review_odc-budget-validation.md; traceability 5/5 completa; cero cambios en domain/repositorio (confirmado por diff)
- **Commits:** d3aef28 spec, d2399ac (R1,R2), c6bfbb0 (R3), 77713de (R4,R5), 4dff284 reporte
- **Estado final:** done
