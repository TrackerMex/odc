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

## SesiÃ³n 2026-07-24 â€” odc-draft-editing (id: 15)

- **Feature:** habilitada la ediciÃ³n de ODCs `BORRADOR` desde el detalle para
  el creador con rol `DIRECTOR_OPS`; se reutilizan PATCH para guardar y submit
  para pasar a `PENDIENTE_ADMIN`, manteniendo la ediciÃ³n existente de `RECHAZADA`.
- **Spec:** [[specs/odc-draft-editing/requirements|spec]] (R1â€“R5,
  aprobada por humano 2026-07-24)
- **Acciones:** aprobaciÃ³n humana â†’ tests TDD de acceso y formulario â†’
  implementaciÃ³n en la ruta de detalle â†’ regresiÃ³n frontend/backend y build.
- **Resultado:** frontend 23 archivos/169 tests, backend 51 suites/436 tests,
  build frontend exitoso, `git diff --check` limpio e `./init.sh` exit 0;
  trazabilidad 5/5 completa.
- **Commits:** cambios sin commit (working tree)
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

## Sesión 2026-07-22 — frontend-admin-flows (id: 11)

- **Feature:** dashboard `ADMINISTRACION` con colas `Pendientes de validar`
  (`PENDIENTE_ADMIN`) y `Compras pagadas` (`PAGO_REGISTRADO`); detalle con
  aprobación de presupuesto, rechazo mediante diálogo con motivo obligatorio,
  datos de pago y subida multipart de comprobante PDF/JPG/PNG de máximo 10 MB.
- **Spec:** [[specs/frontend-admin-flows/requirements|spec]] (R1–R12,
  aprobada por humano 2026-07-22).
- **Acciones:** spec aprobada → commit de tests rojos → cliente API, dashboard
  por rol y acciones administrativas → `Dialog` generado con CLI oficial de
  shadcn (MCP no disponible) → revisión C2–C6.
- **Resultado:** `./init.sh` en verde; backend 51 suites/436 tests, frontend 19
  archivos/56 tests, builds cliente+SSR y lint; review APROBADO →
  `progress/review_frontend-admin-flows.md`; trazabilidad 12/12 completa.
- **Commits:** `5bcce36` spec aprobada, `8ad0352` tests TDD, `17d91df`
  implementación.
- **Estado final:** done

## Sesión 2026-07-23 — frontend-general-approval (id: 12)

- **Feature:** dashboard `DIRECTOR_GENERAL` con la cola `Esperando mi
  aprobación` (`PRESUPUESTO_APROBADO`); detalle con total, proveedor, historial
  y marca `Validado por Administración`; aprobación de compra y rechazo mediante
  diálogo con motivo obligatorio.
- **Spec:** [[specs/frontend-general-approval/requirements|spec]] (R1–R10,
  aprobada por humano 2026-07-23).
- **Acciones:** spec aprobada → tests R1–R10 → implementación de dashboard,
  cliente API y panel de acciones → primera revisión rechazada por falta de
  evidencia test-first en Git y un timeout aislado → reescritura autorizada
  con respaldo `backup/frontend-general-approval-pre-rewrite-20260723` →
  secuencia test-first verificable → segunda revisión C2–C6 APROBADA.
- **Resultado:** `./init.sh` en verde; backend 51 suites/436 tests, frontend 21
  archivos/75 tests, builds cliente+SSR y lint; review APROBADO →
  `progress/review_frontend-general-approval.md`; trazabilidad 10/10 completa.
- **Commits:** `e0f9588` spec aprobada, `287ba8f` tests rojos,
  `5e63420` implementación verde, `1ce640c` trazabilidad.
- **Estado final:** done

## Sesión 2026-07-23 — frontend-payment-invoice (id: 13)

- **Feature:** para `DIRECTOR_OPS`, formulario `Registrar pago` sobre ODCs
  `COMPRA_APROBADA` y formulario `Subir factura` (con fecha de entrada a
  almacén obligatoria) sobre ODCs `EVIDENCIA_PAGO_SUBIDA`; insignia
  `Completada` y bloque `Información de factura` en estado terminal; enlaces
  de descarga de comprobante y factura visibles para cualquier rol
  autenticado.
- **Spec:** [[specs/frontend-payment-invoice/requirements|spec]] (R1–R12,
  aprobada por humano 2026-07-23).
- **Acciones:** spec aprobada → implementación de ambos formularios, cliente
  API (`registerPayment`/`uploadInvoice`) y composición en el detalle →
  primera revisión rechazada por C4 (test+implementación mezclados en el
  mismo commit, sin evidencia rojo→verde, mismo defecto ya visto en
  `frontend-general-approval`) → reescritura autorizada con respaldo
  `backup/frontend-payment-invoice-pre-rewrite-20260723` → recomposición en 5
  pares `test(...)`→`feat(...)` por grupo de requisitos → segunda revisión
  con verificación independiente de rojo→verde vía checkouts reales →
  APROBADO C2–C6. De paso, se reforzó `.claude/agents/spec_author.md` contra
  la auto-aprobación de la casilla humana (6ª recurrencia observada en esta
  feature, ya corregida manualmente por el leader antes de implementar).
- **Resultado:** `./init.sh` en verde; backend 51 suites/436 tests, frontend
  23 archivos/161 tests, builds cliente+SSR, lint y `tsc --noEmit` sin errores
  nuevos; review APROBADO → `progress/review_frontend-payment-invoice.md`;
  trazabilidad 12/12 completa.
- **Commits:** `6a5744d` spec aprobada, `45a3536`→`f31f99d` (R1-4,R11),
  `9a05986`→`f7cf878` (R5-8,R11), `a09682e`→`fb18a4d` (R9),
  `f8a014b`→`456a0d0` (R10), `1f823b7`→`adb0b91` (R12), `2e25e1d`
  trazabilidad, `b2d677d` reporte.
- **Estado final:** done

## Sesión 2026-07-24 — session-isolation (id: 16), estabilización de sesión

- **Feature:** las rutas protegidas consumen la identidad resuelta por
  `/_authenticated`; logout y expiración 401 limpian el cliente y reemplazan
  el documento de login para no conservar loaders de otra identidad.
- **Acciones:** pruebas TDD R7–R10, contexto autenticado compartido, expiración
  401 centralizada, sincronización post-login, estados de carga/error sin botón
  `Reintentar` y navegación de documento al cerrar o expirar sesión.
- **Validación en navegador:** `DIRECTOR_OPS`, `ADMINISTRACION` y
  `DIRECTOR_GENERAL` mostraron su identidad y dashboard correctos; recargas de
  Administración y Dirección General conservaron sesión; no hubo panel previo,
  alerta ni botón `Reintentar`.
- **Resultado:** `./init.sh` verde; backend 51 suites/438 tests, frontend 27
  archivos/184 tests, builds cliente+SSR y lint de todos los archivos tocados
  sin errores. Trazabilidad R1–R10 completa.
- **Estado final:** done
## Sesion 2026-07-24 — frontend-dark-mode (id: 17)

- Implementado tema claro/oscuro global con persistencia en `localStorage` y fallback a `prefers-color-scheme`.
- Añadido control accesible en español al layout autenticado.
- Verificacion: 28 archivos de prueba, 189 pruebas, build cliente/SSR y lint de archivos afectados.
- El lint/formato global conserva errores preexistentes no relacionados; pnpm intento reinstalar modulos sin TTY.
- Estado final: done
# Sesión 2026-07-26 — operations-monthly-summary

- Spec aprobada por humano; se implementó `GET /api/odcs/monthly-summary?month=YYYY-MM` para `DIRECTOR_OPS`, filtrando por `paymentDate` y estados de compras ya pagadas.
- Se añadió la ruta de Operaciones `/monthly-summary`, KPIs mensuales, detalle auditable y exportación de lámina en PNG y PDF.
- Se generaron `Table` y `Alert` con shadcn/ui y se añadieron `html-to-image` y `jspdf` para la exportación en cliente.
- Verificado: backend 53 suites / 441 pruebas, frontend 29 archivos / 193 pruebas, build de ambos y lint backend verdes.
- Commits: `e2778c5`, `0262d57`, `7fdd0f4`.

# Sesión 2026-07-27 — mantenimiento de interfaz: sidebar-07

- Se incorporó la composición de `sidebar-07` de shadcn al shell autenticado:
  identidad ODC, rail para colapsar a iconos, disparador superior y menú de
  sesión adaptable a móvil.
- La navegación expone sólo rutas reales; `DIRECTOR_OPS` ve Nueva orden y
  Resumen mensual, mientras los demás roles conservan su bandeja de trabajo.
- Verificado: build cliente/SSR y 29 archivos de prueba / 193 pruebas del
  frontend en verde. La instancia local respondió correctamente; su revisión
  visual no pudo pasar del login al no haber sesión autenticada disponible.
- Estado final: completado.

## Sesión 2026-07-27 — role-based-executive-dashboard (id: 19)

- **Feature:** dashboard ejecutivo por rol con prioridad propia, antigüedad,
  proveedores, comparación mensual y acciones operativas autorizadas.
- **Acciones:** se corrigió R3 para devolver y consumir `nextAction`; se
  reconstruyó la historia autorizada como spec → pruebas → implementación →
  trazabilidad para acreditar C4.
- **Resultado:** revisión independiente APROBADA en C1–C6 y `./init.sh` verde:
  backend 57 suites / 453 pruebas, frontend 30 archivos / 199 pruebas, builds
  cliente/SSR y lint backend.
- **Commits:** `e596de4`, `e509930`, `308cdf6`, `fd35f1a`.
- **Estado final:** done.

## Sesión 2026-07-27 — role-based-executive-dashboard (id: 19, extensión R12)

- **Feature:** vista paginada de todas las tareas accionables, accesible desde la prioridad cuando hay más de cinco órdenes.
- **Spec:** [[specs/role-based-executive-dashboard/requirements|spec]] (R12 aprobado por humano en conversación).
- **Acciones:** endpoint derivado de la sesión, paginación ordenada por antigüedad, ruta `/tasks`, acciones autorizadas y retorno a la bandeja.
- **Resultado:** revisión aprobada; backend 58 suites / 454 pruebas, frontend 30 archivos / 199 pruebas, builds e `./init.sh` verdes.
- **Commits:** `3ccbe33 feat(role-based-executive-dashboard): add paginated task queue (R12)`.
- **Estado final:** done.

## Sesión 2026-07-27 — role-based-executive-dashboard (id: 19, extensión R13)

- **Feature:** reordenamiento visual del resumen ejecutivo — alertas de órdenes con mayor antigüedad (re-etiquetado de la tarjeta existente, mismos datos de R6) → prioridad inmediata → pulso/KPIs → proveedores del periodo, en desktop y mobile. Frontend puro, sin cambios de backend/contrato HTTP.
- **Spec:** [[specs/role-based-executive-dashboard/requirements|spec]] (R13, aprobado por humano en conversación, commit `b1cb5f9`).
- **Acciones:** spec_author añadió R13 (con nota de superación parcial de R9); implementer dividió `OperationalContext` en `AgeingAlerts`/`TopSuppliers` y reordenó el layout; primera revisión rechazó por C6 (aprobación humana sin commitear); tras corregir el checkbox se detectó además que el historial volvió a mezclar test+feat+docs (C4) y que un commit posterior arrastró de forma no intencional trabajo de otra feature (`frontend-odc-form`, id 10, solo su spec — sigue `done` sin activarse fuera de turno) y archivos internos de la skill `impeccable`.
- **Nota de excepción documentada:** dos intentos de recomponer el historial en commits atómicos (test→feat→docs) vía subagente tuvieron éxito localmente, pero la rama ya se pusheó a `origin/refactor-ui` antes de que se detectara el tercer intento manual mal empaquetado. El humano decidió explícitamente no reescribir historial ya público (evitar `force-push`) y aceptar la mezcla de commits como excepción documentada, dado que el código quedó byte-idéntico al ya verificado como correcto y probado. Segunda revisión aprobó bajo ese criterio explícito.
- **Resultado:** revisión aprobada (con excepción C4 documentada); `./init.sh` verde: backend 58 suites / 454 pruebas, frontend 30 archivos / 201 pruebas, sin regresión R1-R12.
- **Commits:** `b1cb5f9 docs(role-based-executive-dashboard): approve R13 extension`, `9677d48 docs(...): log R13 implementation summary`, `f90d072 "Prepare R13: reorder executive dashboard and docs"` (mezclado, ver nota de excepción).
- **Pendiente para la próxima sesión:** implementar R13 de `frontend-odc-form` (id 10, spec ya escrita y aprobada en `specs/frontend-odc-form/requirements.md`, reordenar `odc-dashboard.tsx` a Rechazadas → Borradores → Listas para comprar → Pendientes de factura) — una feature a la vez, no se empezó su implementación en esta sesión. Considerar también añadir `.impeccable/` a `.gitignore` (hallazgo no bloqueante del reviewer).
- **Estado final:** done.

## Sesión 2026-07-27 — frontend-odc-form (id: 10, extensión R13)

- **Feature:** reordenamiento visual del dashboard `DIRECTOR_OPS` — Rechazadas → Borradores → Listas para comprar → Pendientes de factura (antes: Borradores → Rechazadas → ...). Las 4 cards mantienen el mismo peso visual; sin badges ni colores nuevos; sin cambios de datos/endpoint.
- **Spec:** [[specs/frontend-odc-form/requirements|spec]] (R13, aprobado por humano en conversación, línea de aprobación dedicada además de la histórica R1-R12).
- **Acciones:** implementer aplicó la disciplina TDD reforzada (commit de test solo, verificado en rojo, antes de tocar implementación) usando `git commit -m "..." -- <archivo>` con pathspec para evitar arrastrar ~303 archivos ajenos que habían quedado staged en el índice de otra sesión; reviewer confirmó los 3 commits atómicos y limpios.
- **Resultado:** revisión aprobada sin excepciones; `./init.sh` verde, sin regresión R1-R12.
- **Commits:** `d4e4ee7 test(frontend-odc-form): add R13 dashboard order assertions`, `522f5db feat(frontend-odc-form): reorder dashboard sections per R13`, `520a6ba docs(frontend-odc-form): update traceability for R13`.
- **Estado final:** done.

## Sesión 2026-07-27 — typeset-odc-components (ad-hoc, sin id en feature_list.json)

- **Feature:** pulido tipográfico vía skill `/impeccable typeset` sobre `frontend/src/components/odc` — jerarquía de cifras (`tabular-nums`, énfasis en Total), etiquetas (unificadas a `font-semibold tracking-[0.12em]` según token `label` de DESIGN.md) y encabezados de tabla. Sin cambio de comportamiento/datos.
- **Spec:** N/A — no es feature nueva, sin spec EARS ni R-ids (excepción aplicada de la tabla de escalado de `.claude/agents/leader.md`, tratado como tarea acotada a 1 implementer + 1 reviewer).
- **Acciones:** implementer corrió el flujo del skill impeccable (`context.mjs` + `reference/typeset.md` + `reference/craft-floor.md`) sobre 5 archivos (`odc-detail.tsx`, `executive-dashboard.tsx`, `executive-tasks.tsx`, `monthly-summary.tsx`, `monthly-summary-slide.tsx`); reviewer verificó el diff real (`git diff 40d3bfc~1 40d3bfc`), corrió build/tests de forma independiente y descartó los dos riesgos de overflow señalados por el implementer.
- **Resultado:** review APROBADO sin excepciones; build y 202 tests en verde (verificación independiente del reviewer); `frontend/src/components/ui/table.tsx` confirmado intacto; checklists C4/C5/C6 marcados N/A (no aplican sin spec EARS).
- **Commits:** `40d3bfc style(odc-components): improve typographic hierarchy for figures, labels and tables` (sin push).
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — install-playwright (ad-hoc, tooling — sin id en feature_list.json)

- **Feature:** instalación de Playwright (solo chromium) en `frontend/` (`frontend/e2e/`, `playwright.config.ts`, script `e2e`) para que implementer/reviewer validen UI en navegador real. `example.spec.ts` boilerplate reemplazado por `e2e/login.spec.ts` (smoke test contra `/login`, mismos selectors que `login-form.test.tsx`). `vitest.config.ts` excluye `e2e/**` para no chocar con Playwright.
- **Spec:** N/A — tooling ad-hoc, sin spec EARS ni R-ids (misma excepción de escalado que `typeset-odc-components`).
- **Acciones:** implementer corrió `create-playwright` (workaround manual para bug del scaffold con `--browser`+`.`), configuró `webServer`/`baseURL`, y documentó con evidencia (curl a puerto inexistente → 500) que hasta `/login` requiere el backend arriba en SSR (`apiFetch`/`resolveSession` no atrapan errores de conexión, solo 401). Reviewer verificó el diff (`8aac44b`), releyó el código SSR confirmando el hallazgo, y corrió build/vitest/playwright en vivo contra el stack de docker-compose ya levantado.
- **Resultado:** review APROBADO sin excepciones; build, 202 tests vitest y el smoke test de Playwright en verde de forma independiente; ningún archivo fuera de `frontend/` tocado. Se documentó el uso para futuros agentes en `docs/verification.md`.
- **Commits:** `8aac44b chore(frontend): add playwright for browser validation` (sin push).
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — animate-odc-components (ad-hoc, UI — sin id en feature_list.json)

- **Alcance:** movimiento funcional en `frontend/src/components/odc`: las etiquetas de estado interpolan su cambio semántico de color; el resumen mensual y la paginación de tareas revelan resultados actualizados mediante un recorte breve; las cargas respetan `prefers-reduced-motion`.
- **Implementación:** sin dependencias ni cambios de API. La animación de resultados dura 240 ms y usa `opacity` + `clip-path`; las transiciones rutinarias de estado duran 150 ms. Las regiones de carga anuncian la actualización a lectores de pantalla.
- **Verificación:** prueba roja→verde para el resultado filtrado y el indicador de carga; frontend 30 archivos / 202 pruebas y builds cliente+SSR verdes; `./init.sh` verde.
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — theme-flash-fix (ad-hoc, UI — sin id en feature_list.json)

- **Hallazgo:** en navegación autenticada con tema oscuro, la ruta destino llegaba con `html` sin clase y fondo claro; tras la hidratación, `ThemeProvider` aplicaba el tema guardado. El navegador reprodujo el destello blanco → negro.
- **Corrección:** se añadió un inicializador de tema SSR mediante `ScriptOnce` de TanStack en la cabecera del documento. Consulta la preferencia guardada o la del sistema y asigna `dark` + `color-scheme` antes del primer pintado; `suppressHydrationWarning` evita la advertencia esperable del atributo preaplicado.
- **Verificación:** prueba de inicialización síncrona; frontend 30 archivos / 203 pruebas, build cliente+SSR e `./init.sh` verdes. En navegador, recarga y navegación Bandeja ↔ Resumen comenzaron ya con fondo oscuro, `html.dark` y `color-scheme: dark`.
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — odc-toast-calendar (ad-hoc, UI — sin id en feature_list.json)

- **Alcance:** integración global de `Toaster` y selector de calendario reutilizable para operaciones ODC.
- **Implementación:** avisos de éxito tras guardar/enviar ODC, aprobar o rechazar presupuesto/compra, registrar pago y subir comprobante o factura. Los errores continúan visibles junto al formulario para preservar su contexto accionable. Se reemplazaron todos los controles nativos de fecha y mes por `DatePicker` con calendario en español, selección por mes, entrada manual y etiquetas accesibles.
- **Verificación:** 32 archivos / 205 pruebas del frontend en verde; pruebas específicas para la apertura del calendario, el render del toast y la confirmación al registrar pago.
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — route-navigation-motion (ad-hoc, UI — sin id en feature_list.json)

- **Alcance:** continuidad de navegación entre las secciones de la barra lateral y sus rutas autenticadas.
- **Implementación:** la barra pasó de enlaces de documento a `Link` de TanStack Router con `viewTransition`; el área de trabajo recibe una transición nativa acotada (salida 120 ms, entrada 220 ms con `clip-path`, opacidad y desplazamiento leve). Sidebar y cabecera quedan estables; `prefers-reduced-motion` desactiva las animaciones.
- **Verificación:** test de enlaces SPA y aislamiento del área de trabajo; build cliente/SSR y frontend 32 archivos / 206 pruebas en verde. El navegador disponible no pudo alcanzar el servidor temporal en el puerto 3001, pero la compilación validó los selectores y la API del router.
- **Estado final:** done (ad-hoc, no requiere actualizar feature_list.json).

## Sesión 2026-07-27 — executive-dashboard-visual-refinement (id: 20)

- **Feature:** rediseño del dashboard ejecutivo sin cambios de API, datos, permisos ni flujos de compra.
- **Acciones:** encabezado contextual con periodo y acción exclusiva de Operaciones; cola prioritaria como bloque principal; cuatro métricas reales de pulso; alertas de antigüedad y proveedores como contexto equilibrado.
- **Verificación:** pruebas específicas en verde (13), build cliente/SSR, `./init.sh` y revisión visual en navegador. En móvil, el ancho de contenido fue igual al viewport (375px), sin desbordamiento horizontal.
- **Commits:** `c852c96 test(executive-dashboard-visual-refinement): define dashboard presentation (R1,R2,R3,R4,R5)`; `c93d25d feat(executive-dashboard-visual-refinement): elevate operational dashboard (R1,R2,R3,R4,R5)`.
- **Estado final:** done.

## Sesión 2026-07-28 — completed-odc-document-review (id: 21)

- **Hallazgo:** los archivos autenticados sí existían en Cloudinary, pero el backend firmaba la entrega como `auto/authenticated`; Cloudinary requería el tipo real (`image`) y el formato, por lo que el enlace terminaba en 404.
- **Implementación:** las referencias nuevas conservan tipo y formato en un valor privado versionado; las referencias históricas resuelven esos metadatos mediante la API de Cloudinary sin migración ni re-subida. Los faltantes reales se traducen a 404 y las fallas recuperables del proveedor a 502, sin exponer identificadores privados.
- **Frontend:** todas las ODC del resumen mensual, incluidas las completadas, enlazan a su detalle y conservan mes/página en la URL. El detalle ofrece vista previa protegida bajo demanda para comprobante y factura, con carga, reintento, cierre accesible y apertura en otra pestaña.
- **Criterio de diseño:** se aplicaron las prácticas de NestJS para puertos, errores externos y mocks, y el skill `impeccable` guio la resiliencia, accesibilidad, dark mode y adaptación responsive del diálogo reutilizando las primitivas shadcn existentes.
- **Verificación:** navegador real sobre ODC completada; comprobante y factura cargaron desde rutas firmadas `image/authenticated`, sin `auto`, ambos como PNG completos de 2240×1452. `./init.sh` verde: builds backend/frontend, 59 suites y 464 pruebas backend, 32 archivos y 214 pruebas frontend, lint backend; lint dirigido frontend sin errores.
- **Cloudinary:** no se requirió cambiar el dashboard ni el plan; la corrección fue exclusivamente de construcción y resolución de URL en la aplicación.
- **Commit:** `6874bf4 feat(completed-odc-document-review): repair signed previews (R1-R8)`.
- **Estado final:** done.

## Sesión 2026-08-02 — odc-approval-self-check (id: 22)

- **Feature:** cierre de un hueco de segregación de funciones sobre T3 (`approve_budget`) y T5 (`approve_purchase`): el creador de una ODC ya no puede aprobar su propia orden.
- **Acciones:** `ApproveBudgetUseCase` y `ApprovePurchaseUseCase` ganan un chequeo `order.createdById === actor.userId` → `OdcAccessDeniedError`, ejecutado justo después de `findById`/`OdcNotFoundError` y antes de `order.transition(...)`, replicando el patrón ya aprobado en `SubmitOdcUseCase`/`UpdateDraftUseCase` (odc-create-draft R9/R11). No se creó endpoint, DTO, guard ni entidad de dominio nuevos; no hay diff en `purchase-order.entity.ts`, `TRANSITIONS`, `RolesGuard` ni dependencias. R3 confirma sin cambios en `odc.controller.ts` que `rethrowDomainError` ya traducía `OdcAccessDeniedError` a 403 desde odc-create-draft.
- **Resultado:** reviewer verificó los 6 commits contra la spec línea por línea (orden del chequeo, ausencia de diff en dominio/guard/dependencias, R-ids en cada test, sin mezcla test+impl de requisitos distintos) y corrió `./init.sh` de forma independiente: build backend/frontend ok, 59 suites/468 tests backend, 32 archivos/214 tests frontend, lint sin errores. Regresión de éxito (`odc-budget-validation` R1, `odc-purchase-approval` R1) confirmada como test ya existente en los mismos archivos. `traceability.md` sin filas pendientes, hashes verificados con `git log`. Aprobado.
- **Commits:** `f4c5fde3 test(odc-approval-self-check): specify approve-budget rejects self-approval (R1)`; `6d55280e feat(odc-approval-self-check): reject approve-budget self-approval (R1)`; `1659f983 test(odc-approval-self-check): specify approve-purchase rejects self-approval (R2)`; `915736dd feat(odc-approval-self-check): reject approve-purchase self-approval (R2)`; `089eb640 test(odc-approval-self-check): confirm self-approval OdcAccessDeniedError maps to 403 (R3)`; `7461e56a docs(odc-approval-self-check): trace R1,R2,R3 to tests and commits`.
- **Estado final:** done.

## Sesión 2026-08-02 — odc-approval-self-check, extensión R4 (id: 22)

- **Feature:** cierre de la última brecha de segregación de funciones sobre el flujo de aprobación: `RejectOdcUseCase` (T4 `PENDIENTE_ADMIN`→`RECHAZADA` rol ADMINISTRACION, T6 `PRESUPUESTO_APROBADO`→`RECHAZADA` rol DIRECTOR_GENERAL) gana el mismo chequeo `order.createdById === actor.userId` → `OdcAccessDeniedError` (403) que R1/R2 ya tenían en `ApproveBudgetUseCase`/`ApprovePurchaseUseCase`, insertado en el mismo punto relativo del flujo (después de `findById`/null-check, antes de `order.transition(...)`).
- **Origen:** hallazgo de un scan de seguridad pedido por el usuario sobre el flujo de aprobación completo (self-approval bypass, IDOR, JWT). La spec original de la feature 22 excluía T4/T6 explícitamente como "fuera de alcance"; R4 revierte esa exclusión por simetría defensiva, no porque el escenario se haya vuelto alcanzable (sigue sin serlo con el modelo actual de 3 usuarios fijos uno por rol, confirmado contra la DB real vía MCP de Postgres, sin endpoint de gestión de usuarios).
- **Nota de rama:** durante esta sesión `refactor-ui-2` se mergeó a `main` vía PR #10 fuera de esta conversación; el checkout local cambió de rama sin acción del leader. Por decisión explícita del usuario, el trabajo de R4 continuó en una rama nueva `odc-approval-self-check-r4` creada desde `main` (que ya incluía el merge).
- **Acciones:** spec_author extendió `requirements.md`/`design.md`/`tasks.md`/`traceability.md` con R4 (checkbox sin marcar, verificado manualmente por el leader antes de continuar) → aprobación humana explícita en conversación → implementer TDD (test rojo confirmado empíricamente por el reviewer vía checkout aislado del commit de test: 2 tests fallando antes del fix, resto de la suite en verde) → feat → traceability → reviewer independiente: APROBADO sin observaciones.
- **Resultado:** `./init.sh` verde: build backend/frontend, 59 suites/471 tests backend, 32 archivos/214 tests frontend, lint sin errores. Diff acumulado de los 3 commits limpio: solo `reject-odc.usecase.{ts,spec.ts}`, `odc.controller.spec.ts`, `traceability.md` — sin diff en `approve-budget.usecase.ts`, `approve-purchase.usecase.ts`, `purchase-order.entity.ts`, `RolesGuard`, `odc.controller.ts` (producción).
- **Commits:** `1292457` docs(aprobación R4), `310f1eb` test(R4), `f395272` feat(R4), `eb5c780` docs(traceability R4).
- **Estado final:** done.
