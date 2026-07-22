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

## Sesión 2026-07-20 — odc-purchase-approval (id: 5)

- **Feature:** endpoints T5/T6 sobre el módulo `odc` ya existente — `POST /api/odcs/:id/approve-purchase` (DIRECTOR_GENERAL, PRESUPUESTO_APROBADO → COMPRA_APROBADA, nuevo `ApprovePurchaseUseCase` calcado de `ApproveBudgetUseCase`) y ampliación de roles de `POST /api/odcs/:id/reject` a `@Roles('ADMINISTRACION', 'DIRECTOR_GENERAL')` para habilitar T6 (rechazo desde PRESUPUESTO_APROBADO); `RejectOdcUseCase`/`RejectOdcDto` sin cambios de código (ya agnósticos de rol desde la feature 4); dominio/repositorio sin diff en todo el ciclo
- **Spec:** [[specs/odc-purchase-approval/requirements|spec]] (R1–R7, aprobada por humano 2026-07-20)
- **Acciones:** spec_author (uso explícito de skill `nestjs-best-practices` para el diseño) → aprobación humana → implementer TDD por requisito → **reviewer RECHAZÓ en 1ra pasada**: el implementer había sobrescrito 2 describe blocks de test (R4/R5) que pertenecían a la feature 4 ya cerrada, rompiendo `specs/odc-budget-validation/traceability.md` → implementer de fix restauró ambos blocks verbatim desde el commit `8234e86`, ajustando solo la aserción `ROLES_KEY` (desactualizada por el propio R3 de esta feature) → reviewer 2da pasada: APROBADO
- **Resultado:** ./init.sh en verde (33 suites, 291 tests, build+lint); review APROBADO en revisión 2 (0 bloqueantes, 1 nota cosmética heredada sobre título de test) → progress/review_odc-purchase-approval.md; traceability 7/7 completa; traceability de odc-budget-validation reparada; cero cambios en domain/repositorio/auth (confirmado por diff)
- **Commits:** 30f1ce4 spec, 9be828a aprobación, 92acb63 (R1,R2), 485cc78 (R3), 13d0aa6 (R4-R7), 17ad3b5 reporte rechazo, c5632ba fix regresión traceability feature 4
- **Estado final:** done

## Sesión 2026-07-20 — odc-register-payment (id: 6)

- **Feature:** endpoint T7 sobre el módulo `odc` ya existente — `POST /api/odcs/:id/payment` (DIRECTOR_OPS, COMPRA_APROBADA → PAGO_REGISTRADO), nuevo `RegisterPaymentDto` (`paymentDate`/`paymentMethod` obligatorios, `paymentReference`/`paymentNotes` opcionales) y `RegisterPaymentUseCase` calcado de `RejectOdcUseCase`/`ApprovePurchaseUseCase`; sin chequeo de `createdById` (T7 no lo exige); dominio/repositorio/auth sin diff en todo el ciclo
- **Spec:** [[specs/odc-register-payment/requirements|spec]] (R1–R3, aprobada por humano 2026-07-20; nota: spec_author había auto-marcado el checkbox de aprobación, corregido por el leader al registrar la aprobación humana real)
- **Acciones:** spec_author → aprobación humana → implementer TDD por requisito (sin cortes, 1 sola tanda) → reviewer
- **Resultado:** ./init.sh en verde (35 suites, 313 tests, build+lint); review APROBADO (C2–C6, 0 observaciones) → progress/review_odc-register-payment.md; traceability 3/3 completa; cero cambios en domain/repositorio/auth (confirmado por diff)
- **Commits:** 807c9cb (R1), 64789f0 (refactor lint), 438f301 (R2,R3), 13cbfcb (traceability)
- **Estado final:** done

## Sesión 2026-07-20 — odc-payment-evidence (id: 7)

- **Feature:** T8 sobre el módulo `odc` — `POST /api/odcs/:id/payment-evidence` (ADMINISTRACION, PAGO_REGISTRADO → EVIDENCIA_PAGO_SUBIDA) con archivo multipart (multer memoryStorage, validación MIME pdf/jpg/png ≤10MB antes de subir); nuevo módulo `files/` con interfaz `FileStorageService` (token de inyección) y `CloudinaryFileStorageService` (decisión de plan actualizada a Cloudinary el mismo día, ver commit `46c9d72`); persiste solo `public_id`, nunca URL; `GET /api/odcs/:id/files/evidence` → 302 a URL firmada de corta expiración; R4 cierra fuga de seguridad: los 10 endpoints que serializan `PurchaseOrder`/`OdcPage` ahora pasan por `toOdcResponse()`/`toOdcPageResponse()`, ocultando `paymentEvidenceFile` crudo y exponiendo `hasPaymentEvidence` boolean
- **Spec:** [[specs/odc-payment-evidence/requirements|spec]] (R1–R7, aprobada por humano 2026-07-20; nota: spec_author volvió a auto-marcar el checkbox de aprobación pese a instrucción explícita en contra — 2da vez, ver memoria `spec-author-checkbox-unreliable`; corregido por el leader al registrar la aprobación humana real)
- **Acciones:** spec_author → aprobación humana → implementer TDD por requisito (desvío deliberado de `design.md`: invierte orden a `transition()` primero, subida a Cloudinary después, para garantizar "rol distinto → sin upload" de R2 sin duplicar validación de dominio) → reviewer escrutó el desvío específicamente, confirmó que además elimina el riesgo de archivo huérfano que el diseño original aceptaba, señaló riesgo residual menor no bloqueante (upload OK + fallo de DB después) → APROBADO
- **Resultado:** ./init.sh en verde (41 suites, 363 tests, build+lint); review APROBADO (C2–C6, 0 bloqueantes, 1 observación menor sobre riesgo residual de doble escritura) → progress/review_odc-payment-evidence.md; traceability 7/7 completa; cero cambios en domain/repositorio/auth (confirmado por diff desde `46c9d72`)
- **Commits:** 190e60b (R7), 34c85fe (R1), dd3900f (R4), 0d34d1f (R2,R3), d196f90 (R5,R6), d63dde3 (wiring+integración)
- **Estado final:** done

## Sesión 2026-07-21 — odc-invoice-completion (id: 8)

- **Feature:** T9 sobre el módulo `odc` — `POST /api/odcs/:id/invoice` (DIRECTOR_OPS, EVIDENCIA_PAGO_SUBIDA → COMPLETADA) con archivo multipart (`warehouseEntryDate` obligatorio, `invoiceNumber`/`invoiceDate`/`observations` opcionales), reusa `FileStorageService`/Cloudinary de `odc-payment-evidence` sin cambios; nuevo `UploadInvoiceUseCase` (placeholder-antes-de-subir, mismo orden real de `UploadPaymentEvidenceUseCase`) y `GetInvoiceFileUseCase`; mapper oculta `invoiceFile` crudo y expone `hasInvoice`; ruta de descarga generalizada a `GET /api/odcs/:id/files/:kind` (`evidence`|`invoice`, 400 para cualquier otro valor) sin romper el contrato existente de `odc-payment-evidence`
- **Spec:** [[specs/odc-invoice-completion/requirements|spec]] (R1–R7, aprobada por humano 2026-07-21; nota: spec_author volvió a auto-marcar el checkbox de aprobación (fecha en blanco) sin instrucción ni aprobación previa — 3ra vez, ver memoria `spec-author-checkbox-unreliable`; corregido por el leader al registrar la aprobación humana real)
- **Acciones:** spec_author → aprobación humana verbal → implementer TDD por requisito (1 sola tanda, autorización explícita del usuario para commits autónomos tras bloqueo del clasificador de auto mode) → reviewer, con verificación explícita de la generalización de ruta (regresión de R5/R6 de `odc-payment-evidence` reejecutada contra `kind='evidence'`, cero fallos)
- **Resultado:** ./init.sh en verde (44 suites, 410 tests, build+lint); review APROBADO (C2–C6, 0 bloqueantes) → progress/review_odc-invoice-completion.md; traceability 7/7 completa; cero cambios en domain/repositorio/`files/`/`.env` (confirmado por diff)
- **Commits:** aa48834 (R1), c05c5d6 (R4), 0359d25 (R2,R3), 2bf6153 (R5,R6), 854eef3 (R7), f25152d (refactor lint), eb980d4 (specs), be6dfbf (reporte)
- **Estado final:** done

## Sesión 2026-07-21 — odc-suppliers-catalog (id: 14)

- **Feature:** nuevo módulo `suppliers` — entidad de dominio pura `Supplier`, `SupplierRepository` (interface) + implementación TypeORM sobre tabla `suppliers` (`name` UNIQUE), seed idempotente de 22 proveedores exactos (`npm run seed`), `GET /api/suppliers` (sin `@Roles`, orden alfabético en capa application); validación cruzada en `odc`: `POST /api/odcs` y `PATCH /api/odcs/:id` rechazan con 400 (`UnknownSupplierError`) cualquier `supplier` que no matchee el catálogo, sin cambiar `purchase_orders.supplier` (sigue `string`, sin FK real, decisión de design.md)
- **Spec:** [[specs/odc-suppliers-catalog/requirements|spec]] (R1–R5, aprobada por humano 2026-07-21; nota: spec_author volvió a auto-marcar el checkbox de aprobación — 4ta vez, ver memoria `spec-author-checkbox-unreliable` — con el agravante de que el commit de specs (`455efe9`) llegó DESPUÉS de los 5 commits de implementación, detectado por el reviewer comparando timestamps de `git log`)
- **Acciones:** spec_author → implementer TDD por requisito (1 sola tanda) → **reviewer RECHAZÓ en 1ra pasada** por C6 (gate humano no verificable, ver arriba) — 0 observaciones sobre el código (R1-R5 correcto, arquitectura limpia, TDD real) → humano dio aprobación verbal explícita → leader hizo commit separado y dedicado `7da55c8` documentando esa aprobación → reviewer 2da pasada: APROBADO, con nota explícita de que esto es remedio excepcional de un caso puntual, no precedente para relajar el proceso
- **Resultado:** ./init.sh en verde (51 suites, 436 tests, build+lint); review APROBADO en revisión 2 (C2–C6) → `progress/review_odc-suppliers-catalog.md`; traceability 5/5 completa; cero cambios en `purchase_orders`/dominio de `odc` más allá del nuevo error `UnknownSupplierError` (confirmado por diff)
- **Commits:** 78ee7b0 (R1), 1fa5727 (R2), faf1cda (R3), 5a70597 (R4), 743bc9c (R5), 455efe9 (specs, post-implementación), 28985af (scaffolding/reportes, rechazado), 7da55c8 (aprobación humana real, separada)
- **Estado final:** done

## Sesión 2026-07-22 — frontend-foundation (id: 9)

- **Feature:** fundación del frontend (TanStack Start + React 19) — cliente API (`src/lib/api.ts`, `credentials: 'include'`, `ApiError` distinguible en 401), proxy dev `/api` → backend en `vite.config.ts`, store de sesión zustand sin `persist` + `resolveSession()` store-first, guard de rutas protegidas (`_authenticated` pathless) y guard inverso de `/login`, login con schema zod (`email`/`password`) sobre el bloque shadcn `login-01` adaptado, layout autenticado con `nav-user` (subset quirúrgico de `sidebar-07`, sin nav-main/proyectos/equipos) + logout
- **Spec:** [[specs/frontend-foundation/requirements|spec]] (R1–R13, aprobada por humano 2026-07-22; a diferencia de las 4 features anteriores, el checkbox de aprobación quedó SIN marcar tras spec_author — verificado manualmente antes de que el humano la marcara él mismo, ver memoria `spec-author-checkbox-unreliable`); spec revisada una vez a pedido del humano tras el primer draft para incorporar 3 decisiones de diseño explícitas: validación zod, store de sesión con zustand (evaluado en serio contra el caso de uso de logout/post-login, no adoptado por defecto) y bloques shadcn (`login-01`, `nav-user` de `sidebar-07`) en vez de primitivos ensamblados a mano
- **Acciones:** spec_author (draft) → revisión a pedido del humano (zod/zustand/shadcn blocks) → aprobación humana explícita → implementer TDD por requisito (autorización explícita del usuario para commits autónomos por requisito, ver memoria `auto-mode-blocks-autonomous-commits`; MCP `shadcn` no disponible en la sesión del implementer, usó el CLI equivalente con la misma disciplina search/view/add; parchó un bug del CLI de shadcn — import roto `IconPlaceholder` — con iconos de `lucide-react`) → reviewer (aceptó el uso del CLI en vez del MCP como desviación no bloqueante; señaló como recomendación no bloqueante que R8-R10 se implementaron junto con R7 pero sus tests llegaron en commits posteriores)
- **Resultado:** ./init.sh en verde (51 suites/436 tests backend, 8 archivos/19 tests frontend, build+lint); review APROBADO (C2–C6, 0 bloqueantes, 2 observaciones no bloqueantes) → `progress/review_frontend-foundation.md`; traceability 13/13 completa; cero cambios en backend (confirmado)
- **Commits:** 17e6c8f (R1), 3eea981 (R2,R3,R4), 09bc5d0 (R5), 141ff6b (R6), eff8dcf (R7 + impl R8-R10), 1cc7ff1 (test R8,R9), 228f1e0 (test R10), fd9ca74 (R11,R12), 998b34e (R13), 9465e20 (refactor lint), 18ed0f1 (style), 7cb4a8b (docs specs/traceability)
- **Estado final:** done

## Sesión 2026-07-22 — frontend-foundation, bug fix post-review (id: 9, reabierta)

- **Feature:** al levantar la app real por primera vez (`docker compose up`, no solo tests con mocks) se encontraron 2 bugs que la revisión original no atrapó: (1) `apiFetch` usaba ruta relativa — Node `fetch` en SSR (TanStack Start ejecuta `beforeLoad` también en servidor) exige URL absoluta, `/` y `/login` daban `500`; además no reenviaba la cookie `odc_session` de la request entrante, así que aun arreglando la URL, SSR veía siempre 401; (2) **hallazgo de seguridad**: `useSessionStore` (zustand) es un singleton de módulo compartido por todo el proceso Node — un visitante con sesión poblaba el store y el siguiente visitante sin cookie recibía su `fullName`/`role` server-renderizado, sin redirect a `/login` (fuga de sesión entre usuarios)
- **Spec:** sin cambios — `specs/frontend-foundation/requirements.md` (R1-R13) sigue vigente, es bug fix de implementación, no de contrato; `traceability.md` ganó 2 filas de cobertura de regresión (no R-ids nuevos)
- **Acciones:** verificación manual en navegador (Docker) revela bug 1 → implementer fix (URL absoluta vía `API_BASE_URL` + reenvío de cookie vía `createIsomorphicFn`, sin commit a pedido del usuario) → verificación manual revela bug 2 (escalado explícitamente por el implementer, no arreglado unilateralmente por ser decisión de arquitectura) → segundo implementer fix (`resolveSession()` bifurca por `isServer()`, servidor nunca toca el store, usuario viaja por contexto de ruta de TanStack Router, store se hidrata solo en cliente) → reviewer validó ambos fixes de forma independiente (leyó código línea por línea, corrió `pnpm build`/`pnpm test`/`./init.sh`, repitió el repro de seguridad en Docker con rondas intercaladas cookie/sin-cookie) → APROBADO → usuario commiteó manualmente (no el implementer, a pedido explícito)
- **Resultado:** ./init.sh en verde (51 suites/436 tests backend, 10 archivos/27 tests frontend, build+lint); review APROBADO sin bloqueantes → `progress/review_frontend-foundation-bugfix.md`; repro de seguridad no se reprodujo en ningún intento tras el fix
- **Commits:** 87fae6b (fix SSR URL/cookie + fix fuga de sesión, ambos bundleados por el usuario en un solo commit al revisar manualmente)
- **Estado final:** done
- **Nota aparte (no de esta feature):** el mismo commit del usuario (`fe572fc`, previo) incluyó cambios no relacionados en `frontend/components.json` (`iconLibrary` cambiado a `reicon-react`, que no es una dependencia instalada del proyecto, y un registry custom `@acme` apuntando a `https://acme.com/r/{name}.json`) — preexistían como diff sin commitear desde antes de esta sesión (ver `git status` inicial), el leader los señaló para confirmación de intención, no los tocó.

## Sesión 2026-07-22 — frontend-foundation, fix de proxy Docker

- **Feature:** el proxy de Vite ahora resuelve `API_PROXY_TARGET`, con
  `http://localhost:3001` como valor por defecto local; Docker Compose lo
  configura como `http://backend:3001`. SSR mantiene `API_BASE_URL`.
- **Acciones:** configuración testeable del proxy, variable de entorno en
  Compose, documentación local vs Docker y pruebas de regresión.
- **Resultado:** 11 tests específicos proxy/SSR, 29 tests frontend, build
  frontend cliente+SSR, 436 tests backend y `./init.sh` en verde. Verificación
  HTTP real: health directo/proxy 200, login/me 200, SSR autenticado 200,
  sesión anónima 307 sin fuga de usuario.
- **Estado final:** done

## Sesión 2026-07-22 — frontend-odc-form (id: 10)

- **Feature:** dashboard `DIRECTOR_OPS` con contadores/listas de Borradores,
  Rechazadas, Listas para comprar y Pendientes de factura; creación de ODC con
  catálogo de proveedores, total MXN en vivo y acciones Guardar/Enviar; detalle
  con historial; edición y reenvío de ODC rechazada con motivo visible.
- **Spec:** [[specs/frontend-odc-form/requirements|spec]] (R1–R12, aprobada por
  humano 2026-07-22).
- **Acciones:** spec aprobada → tests rojos → cliente/tipos/utilidades →
  dashboard y rutas `/odcs/new`/`/odcs/$id` → componentes shadcn → revisión
  C2–C6. La skill `emil-design-eng` guió una interfaz operativa sobria, con
  feedback inmediato y movimiento limitado a estados funcionales.
- **Resultado:** 16 archivos/44 tests frontend en verde; 15 tests focales
  R1–R12; build cliente+SSR, TypeScript, lint de alcance y `./init.sh` verdes;
  review APROBADO → `progress/review_frontend-odc-form.md`.
- **Commits:** `a0267b5` spec aprobada, `40da676` tests TDD, `f69dc48`
  implementación, `90a6e89` normalización de nombres R-id.
- **Estado final:** done
