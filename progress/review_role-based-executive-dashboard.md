# review: role-based-executive-dashboard (R13)
Fecha: 2026-07-27
Veredicto: RECHAZADO

Alcance de esta revisión: únicamente R13 (reordenar jerarquía visual:
alertas -> prioridad -> pulso -> proveedores). R1-R12 se re-verifican solo
para descartar regresión (init.sh), no se re-audita su spec/trazabilidad
(ya aprobadas en revisiones previas de esta misma feature).

## Checklist C2 — Estado coherente
- [x] Máximo una feature en `in_progress` en `feature_list.json` (id 19,
      única `in_progress`; el resto `done`).
- [ ] `progress/current.md` desactualizado: dice `implementer: pendiente de
      lanzar` y `reviewer: pendiente`, pero el implementer ya entregó y
      commiteó R13 (9cac886, 6077742, dc3951f, 4dda53b) y el reviewer ya se
      ejecutó (esta sesión). No refleja el estado real de la sesión.
- Nota adicional: los valores `in_progress` / plan de sesión de
  `feature_list.json` y `progress/current.md` están **sin commitear** en el
  working tree (HEAD todavía trae `role-based-executive-dashboard: done` de
  la sesión de R12). Bookkeeping válido para que lo edite el leader, pero no
  está persistido.

## Checklist C3 — Arquitectura
- [x] Cambio es frontend puro (`executive-dashboard.tsx`), no toca
      domain/application/infrastructure del backend. Nada salta a la vista;
      no se re-audita C3 completo (fuera del alcance pedido para R13).

## Checklist C4 — TDD
- [x] R13 tiene test que lo nombra explícitamente:
      `describe('R13: executive dashboard orders sections by hierarchy...')`
      en `executive-dashboard.test.tsx`.
- [x] Historial test-primero confirmado con mis propios ojos vía
      `git show --stat`:
      - `9cac886 test(...)`: **solo** toca
        `frontend/src/components/odc/executive-dashboard.test.tsx`
        (58 inserciones, 0 borrados) — commit de test puro.
      - `6077742 feat(...)`: **solo** toca
        `frontend/src/components/odc/executive-dashboard.tsx`
        (98 inserciones / 82 borrados) — commit de implementación puro.
      - Ningún archivo se mezcla entre ambos commits. Confirma que la
        corrección reportada es real: `git show --stat f92fb90` (commit
        original antes de la recomposición) muestra los dos archivos juntos
        en un solo commit mixto, y la rama de respaldo
        `backup/role-based-executive-dashboard-r13-pre-rewrite-20260727`
        existe y conserva ese historial original intacto.
- [x] El test de R13 verifica **orden en el DOM**, no solo presencia: usa
      `compareDocumentPosition` + `Node.DOCUMENT_POSITION_FOLLOWING` para
      las cuatro relaciones (alerts<priority, priority<pulse, pulse<suppliers,
      alerts<suppliers) — no es un `toBeTruthy()` de mera existencia.
- [x] El test reutiliza literalmente los datos de R6: el segundo test de R13
      (`reuses the R6 ageing orders data verbatim...`) verifica el link a
      `ODC-2026-00004` -> `/odcs/active-1` y el texto `Software MX`, que son
      exactamente los valores del único fixture `dashboard.oldestActiveOrders`
      declarado una vez al inicio del archivo. No se agregó mock de endpoint
      ni dato nuevo. El componente (`AgeingAlerts`) consume
      `dashboard.oldestActiveOrders` directamente, sin transformación ni
      fetch adicional.

## Checklist C5 — Trazabilidad
- [x] `traceability.md` fila R13 sin "pendiente", con test y los dos commits
      (test + feat) registrados; el commit `dc3951f` que la actualiza toca
      únicamente ese archivo.
- [x] Commits siguen convención `test(<scope>): <desc>` /
      `feat(<scope>): <desc>`.

## Checklist C6 — Spec aprobada
- [ ] **Hallazgo crítico**: la aprobación humana de R13 en
      `specs/role-based-executive-dashboard/requirements.md` (la segunda
      casilla `[X] Aprobado por humano (fecha: 2026-07-27; R13 autorizada en
      conversación)` y el propio texto del requisito R13) **no está
      commiteada en ningún commit**. Verificado con:
      - `git show HEAD:specs/role-based-executive-dashboard/requirements.md`
        → no contiene R13 ni la segunda casilla.
      - `git log --oneline --all -- specs/role-based-executive-dashboard/requirements.md`
        → solo 3 commits (`65b1a6f`, `e596de4`, `3ccbe33`), ninguno posterior
        a R12.
      - `git stash list` → vacío (tampoco está guardado ahí).
      - El texto de R13 y su aprobación existen **únicamente** en el archivo
        sin commitear del working tree, mezclados en el mismo `git status`
        sucio con cambios no relacionados de otra feature
        (`specs/frontend-odc-form/*`) y de un agente
        (`.claude/agents/implementer.md`).
      - A diferencia de R1-R12, que tuvieron un commit dedicado de aprobación
        (`e596de4 docs(...): approve implementation scope`), R13 no tiene
        ningún commit equivalente.
      - No hay forma de auditar quién marcó la casilla ni cuándo, más allá de
        la nota de texto ("autorizada en conversación"). Dado el patrón ya
        conocido de que `spec_author` tiene prohibido marcar su propia
        aprobación (`.claude/agents/spec_author.md`, líneas 51-62: "esto ha
        ocurrido por error 6 veces antes"), y que aquí no hay ningún commit
        que fije con autoría/fecha real quién hizo el cambio, **no puedo
        confirmar que sea una aprobación humana genuina y no un checkbox
        marcado por error o por un agente**.
      - El implementer y el commit de traceability (`dc3951f`) ya dan por
        aprobado R13 y lo commitean como si el gate hubiera pasado, pero el
        propio gate (el archivo con la aprobación) nunca se persistió. Esto
        es exactamente el tipo de checkbox sospechoso que se pidió no dar
        por bueno sin verificar.
- [x] `status: approved` en el frontmatter — presente (heredado de R1-R12,
      no cambia con R13).

## Observaciones
1. **Bloqueante (C6)**: commitear `specs/role-based-executive-dashboard/requirements.md`
   (y `design.md`/`tasks.md`, que también traen cambios de R13 sin commitear)
   en un commit dedicado tipo `docs(role-based-executive-dashboard): approve
   R13 scope`, análogo a `e596de4`, separado de cualquier cambio de
   `frontend-odc-form` o de `.claude/agents/implementer.md`. El leader debe
   confirmar con el humano que la casilla R13 refleja una aprobación real
   antes de commitear.
2. **No bloqueante, pero corregir antes de cerrar**: actualizar
   `progress/current.md` para reflejar que implementer y reviewer ya
   corrieron en esta sesión (o vaciar la plantilla si la sesión se cierra),
   y commitear junto con el cambio de `feature_list.json`.
3. El working tree tiene cambios sin commitear de al menos dos sesiones
   distintas mezclados (R13 de esta feature + trabajo de spec para
   `frontend-odc-form`, la siguiente feature en cola). Recomiendo separarlos
   antes de seguir, para no arrastrar el mismo problema de trazabilidad a la
   siguiente feature.
4. Nada que objetar en el código: R9 (foco visible `focus-visible:ring`,
   `aria-labelledby` único por sección — `priority-title`, `pulse-title`,
   `ageing-alerts-title`, `suppliers-title` —, `motion-reduce:transition-none`
   / `motion-reduce:animate-none`, y clases `min-w-0`/`truncate` para no
   recortar horizontalmente) sigue intacto en las cuatro secciones
   reordenadas, y el test `R9` sigue pasando sin haber sido modificado.

## Output de ./init.sh
```
✅ Dependencias instaladas
✅ Archivos del harness presentes
⚠️  Feature en progreso: role-based-executive-dashboard

→ Build...
✓ built in 2.36s (client)
✓ built in 2.30s (ssr)
✅ Build exitoso

→ Ejecutando tests...
Backend  Test Suites: 58 passed, 58 total | Tests: 454 passed, 454 total
Frontend Test Files  30 passed (30) | Tests  201 passed (201)
✅ Tests pasados

→ Lint...
✅ Lint sin errores

✅ Todo verde. Listo para trabajar.
Features: 18/19 completadas | 0 pendientes
```

Sin regresión en R1-R12: el backend no fue tocado por R13 (confirmado por
`git show --stat` de los 4 commits de R13, todos limitados a
`frontend/src/components/odc/executive-dashboard.tsx(.test.tsx)` y a
`specs/.../traceability.md` / `progress/impl_....md`), y los conteos de
tests suben respecto al reporte previo del implementer (453→454 backend,
199→201 frontend) sin ningún test en rojo.
