# review: frontend-payment-invoice
Fecha: 2026-07-23 22:52:00 -06:00
Veredicto: APROBADO

> **Esta es la revisión v2**, tras el rechazo v1 por C4 (test+implementación
> mezclados en el mismo commit, sin evidencia rojo→verde). El implementer
> respaldó la v1 completa en `backup/frontend-payment-invoice-pre-rewrite-20260723`
> e hizo `git reset --soft` + recomposición en 5 pares `test(...)`→`feat(...)`.
> Este reviewer no acepta esa recomposición de palabra: repitió el proceso de
> revisión desde cero (código, spec, trazabilidad, `init.sh`) y además
> **verificó en Git, con checkouts reales y `vitest run`, el estado
> rojo→verde de 3 de los 5 pares de commits más el caso dudoso de R12** que
> el propio implementer señaló. Detalle en el Checklist C4.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature `in_progress`: `frontend-payment-invoice` (id 13, único
      `in_progress` en `feature_list.json`; el resto `done`).
- [x] `progress/current.md` actualizado y coherente: refleja v2, implementer
      `done v2`, `reviewer: pendiente (2da revisión)`. A diferencia de la v1
      (donde este archivo había quedado desactualizado), aquí sí se mantuvo
      al día.

## Checklist C3 — Arquitectura
- [x] Feature limitada al frontend: `git diff e0f9588..HEAD -- backend/`
      produce 0 líneas de diferencia (cero cambios en backend en toda la
      feature).
- [x] Domain/application/infrastructure del backend no se tocan.
- [x] Sigue el patrón ya usado por `PaymentEvidenceForm`/`AdminBudgetActions`
      (componente que retorna `null` si `role`/`odc.status` no coinciden);
      verificado leyendo `register-payment-form.tsx` y `upload-invoice-form.tsx`
      completos — la guarda vive al inicio del componente (`if (role !== ... )
      return null`), igual que el precedente.
- [x] Contratos HTTP verificados contra el backend real: `RegisterPaymentDto`
      (`paymentDate`/`paymentMethod` obligatorios, `paymentReference`/
      `paymentNotes` opcionales) y `UploadInvoiceDto`
      (`warehouseEntryDate` obligatorio, resto opcional) en
      `backend/src/modules/odc/application/dto/` coinciden exactamente con
      `RegisterPaymentPayload`/`UploadInvoicePayload` en `frontend/src/lib/api.ts`.

## Checklist C4 — TDD
- [x] Cada R1–R12 tiene al menos un `describe` que lo nombra explícitamente
      (confirmado en los 5 archivos de test).
- [x] **Historial de commits: 5 pares `test(...)`→`feat(...)` sin mezclar**,
      confirmado con `git show --stat` en cada commit (los commits `test`
      solo tocan archivos `*.test.ts(x)`; los commits `feat` no vuelven a
      tocar ningún archivo de test).
- [x] **Verificación independiente rojo→verde (no aceptada de palabra),
      hecha con `git checkout <hash> --detached` + `npx vitest run` real**:
  - `45a3536` (test R1-4,R11) → falla: `register-payment-form.test.tsx` no
    puede importar el componente (no existe) y 2 tests de
    `odc-api.test.ts::R3` fallan con `registerPayment is not a function`.
    `f31f99d` (feat) → 19/19 tests verdes.
  - `f8a014b` (test R10) → falla: 2/3 tests rojos (`getByRole('link', ...)`
    no encuentra el enlace porque no existe). `456a0d0` (feat) → 3/3 verdes.
  - `a09682e` (test R9) → 1 test realmente rojo (el bloque de factura con
    datos aún no existe) + 3 tests que ya pasaban de antes (el guard de
    "oculto en COMPLETADA" ya era cierto desde R1/R5, y "no muestra bloque
    sin datos" es trivialmente cierto sin implementación). `fb18a4d` (feat)
    → verde. Esto es un artefacto normal de TDD incremental (un lote de
    tests puede incluir aserciones que ya se cumplen por trabajo previo real
    y aserciones nuevas que si fallan) y no compromete la evidencia: la
    aserción sustantiva del lote sí estuvo roja.
  - **Caso dudoso señalado por el implementer — R12 (`1f823b7`→`adb0b91`)
    verificado en detalle**: ejecuté los 47 tests etiquetados `R12` en el
    commit `1f823b7` (antes del `feat`) y los 47 ya pasan en verde (0
    rojos). `git show adb0b91 --stat` confirma que el commit `feat`
    correspondiente solo toca `frontend/src/routes/_authenticated/odcs/$id.tsx`
    (composición: agrega `<RegisterPaymentForm>`/`<UploadInvoiceForm>` y el
    wiring a `registerPayment`/`uploadInvoice`), archivo que ningún test de
    la suite ejercita (confirmado: `odc-routes.test.ts` solo prueba los
    loaders `loadOpsDashboard`/`loadOdcDetail`, no el render de la página).
    Es decir: para R12 no hay rojo real en absoluto, ni para el lote de
    tests con nombre R12 ni para el propio archivo que cambia el `feat`.
    **Esto coincide exactamente con lo que el implementer reportó** ("no hay
    rojo real para ellos... verificado ejecutando la suite completa con
    `$id.tsx` aún sin componer: 161/161 verdes") — no lo minimizó ni lo
    ocultó.
    **Veredicto sobre este caso**: no es motivo de rechazo, por tres
    razones verificadas independientemente, no solo alegadas por el
    implementer: (1) la garantía de negocio que R12 exige — el guard de
    rol/estado — sí tiene TDD genuino real, ya verificado arriba en los
    pares R1 y R5 (los componentes devuelven `null` por su propia lógica
    interna, no por algo que añada la composición); (2) el patrón "componer
    en `$id.tsx` sin test de integración dedicado" es precedente ya
    establecido y ya aprobado por este mismo rol de reviewer en
    `frontend-admin-flows` (`AdminBudgetActions`) y `frontend-general-approval`
    (`GeneralApprovalActions`) — ninguna de esas composiciones tiene test de
    render de ruta compuesta tampoco; (3) `design.md` de esta feature ya
    anotaba explícitamente `odc-routes.test.ts` como "regresión de la
    composición existente **si aplica**", dejando la puerta abierta a no
    crearla, decisión tomada en la spec aprobada, no inventada post-hoc.
    **Observación no bloqueante**: el wiring `registerPayment(odc.id ?? '',
    payload)` / `uploadInvoice(odc.id ?? '', file, payload)` en `$id.tsx`
    queda sin ningún test automatizado (ni siquiera indirecto). Es de bajo
    riesgo (glue trivial, sin lógica condicional propia, verificado por
    build exitoso), pero se recomienda que una futura feature agregue un
    test mínimo de regresión en `odc-routes.test.ts` (o similar) para este
    tipo de wiring, cerrando el hueco de cobertura para todas las
    composiciones ya acumuladas en `$id.tsx`.
- [x] Ningún commit `feat(...)` vuelve a tocar archivos de test (confirmado
      con `git show --stat` en los 5 commits `feat`).

## Checklist C5 — Trazabilidad
- [x] `traceability.md` no tiene ninguna fila "pendiente" (R1–R12 completas).
- [x] Cada fila registra el par `test(...)`→`feat(...)` con hashes que
      existen en el log y corresponden a los archivos reales.
- [x] Commits siguen `test(frontend-payment-invoice): <desc> (R-ids)` /
      `feat(frontend-payment-invoice): <desc> (R-ids)`.
- [x] Frontmatter corregido a `status: approved` (en v1 estaba en `draft`,
      señalado como higiene no bloqueante; ya resuelto en v2).
- [x] Respaldo de la v1 confirmado: `backup/frontend-payment-invoice-pre-rewrite-20260723`
      existe y contiene los 5 commits originales mezclados
      (`5d5dd9a`,`6140d33`,`bfc5e5e`,`f90f9a1`,`8264760`) más `f1bbdc0`
      (spec) y los commits de cierre.
- [x] `git diff backup/frontend-payment-invoice-pre-rewrite-20260723 HEAD --
      frontend/ specs/` confirma que el único archivo con diferencia de
      contenido es `traceability.md` (los hashes/pares nuevos y el frontmatter);
      cero diferencias en código de `frontend/` — la recomposición no
      alteró el comportamiento, solo la historia de commits, tal como
      afirmó el implementer.

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` y casilla
      `[x] Aprobado por humano (fecha: 2026-07-23)`.
- [x] Reverificado el hallazgo ya investigado (no relitigado, solo
      reconfirmado con el hash actual): en la v2 el commit que agrega la
      spec es `6a5744d docs(frontend-payment-invoice): add spec, approved by
      human` (22:30:16), único commit en todo el historial que toca
      `specs/frontend-payment-invoice/requirements.md`
      (`git log --format="%H %ai %s" e0f9588..HEAD -- specs/.../requirements.md`
      devuelve solo esa línea). Su contenido en ese mismo commit
      (`git show 6a5744d:specs/.../requirements.md`) ya tiene `[x]` con fecha
      real, y precede a los 5 pares `test`→`feat` (22:31:39 en adelante). No
      es el bug de auto-aprobación de `spec_author`; es consistente con la
      explicación ya validada en v1 (edición manual del leader tras
      aprobación verbal).

## Observaciones
Sin observaciones bloqueantes.

No bloqueante (recomendación a futuro, no aplica a esta feature): agregar un
test mínimo de regresión para el wiring de props que cada formulario/acción
recibe al componerse en `$id.tsx` (ver detalle en C4, caso R12), cerrando un
hueco de cobertura que ya existía desde `AdminBudgetActions`/
`GeneralApprovalActions` y que esta feature simplemente no fue peor en
introducir.

## Output de ./init.sh
Ejecutado por el reviewer, no aceptado del reporte del implementer.
```
══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════

→ Verificando entorno...
✅ node disponible (/c/Program Files/nodejs/node)
✅ pnpm disponible (/c/Users/alex/AppData/Local/pnpm/pnpm)

→ Verificando variables de entorno...
✅ .env encontrado
✅   DATABASE_URL definida
✅   JWT_SECRET definida

→ Instalando dependencias...
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: frontend-payment-invoice

→ Build...
✓ 2199 modules transformed (client), built in 1.12s
✓ 155 modules transformed (ssr), built in 573ms
✅ Build exitoso

→ Ejecutando tests...
Backend:  Test Suites: 51 passed, 51 total | Tests: 436 passed, 436 total
Frontend: Test Files  23 passed (23) | Tests  161 passed (161)
✅ Tests pasados

→ Lint...
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 13/14 completadas | 0 pendientes
```

Verificación adicional del reviewer (no incluida en `init.sh`):
```
cd frontend && npx tsc --noEmit
-> 3 errores, todos preexistentes en payment-evidence-form.test.tsx
   (archivo no tocado por esta feature; introducido en
   frontend-admin-flows, commit 8ad0352)
```

Verificación adicional de evidencia rojo→verde (checkouts reales, no de
palabra): pares `45a3536`→`f31f99d`, `f8a014b`→`456a0d0`, `a09682e`→`fb18a4d`
confirmados con rojo genuino seguido de verde; par `1f823b7`→`adb0b91` (R12)
confirmado SIN rojo real (ver Checklist C4 para el análisis completo de por
qué esto no bloquea la aprobación).
