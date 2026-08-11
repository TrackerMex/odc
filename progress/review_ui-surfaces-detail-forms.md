# review: ui-surfaces-detail-forms
Fecha: 2026-08-11T14:59:17-06:00
Veredicto: APROBADO

## Historial de revisión

- Primera revisión: `RECHAZADO`. Los dos diálogos de rechazo compartían el
  error local del motivo con el error API y atribuían el fallo del servidor al
  `Textarea` mediante `aria-invalid` y `aria-describedby`, contra R6.
- La primera revisión también detectó una aserción de tipo innecesaria añadida
  en `upload-invoice-form.test.tsx` y visible en el lint dirigido.
- Remediación TDD: `aea3c7b` añadió primero las regresiones R6 y solo modificó
  los tres archivos de test; `631fb5a` separó los estados de error y limpió las
  aserciones; `a5c880d` registró la evidencia.
- Segunda revisión: ambos hallazgos están corregidos, sin regresiones nuevas.

## Checklist C1 — Arnés

- [x] `./init.sh` terminó con exit code 0.
- [x] Build backend y frontend verdes.
- [x] 471 tests backend y 455 frontend verdes.

## Checklist C2 — Estado coherente

- [x] `ui-surfaces-detail-forms` (#26) es la única feature `in_progress`.
- [x] `progress/current.md` describe la sesión activa, el gate, la
      implementación, el rechazo inicial y la remediación.
- [x] El reviewer no cambia todavía la feature a `done`; el leader hará el
      cierre de sesión.

## Checklist C3 — Arquitectura y alcance

- [x] No hubo cambios backend ni de contratos HTTP, DTOs, roles o estados.
- [x] La ruta conserva los gates existentes y las acciones siguen dentro de la
      columna principal del detalle.
- [x] Las primitivas locales sobre Base UI y los tokens semánticos siguen siendo
      la autoridad; no se añadieron dependencias ni se regeneró shadcn.
- [x] #27, #28, #29 y `CardHeader` permanecen fuera de alcance.

## Checklist C4 — TDD

- [x] R1–R14 tienen tests que nombran sus R-ids.
- [x] El commit original `66d55d8` es test-only. Su rojo se reprodujo en un
      worktree detached: 25 fallos esperados y 186 tests verdes.
- [x] El commit de remediación `aea3c7b` contiene únicamente
      `admin-budget-actions.test.tsx`, `general-approval-actions.test.tsx` y
      `upload-invoice-form.test.tsx`.
- [x] El rojo de `aea3c7b` se reprodujo de forma aislada: 2 fallos exactos por
      `aria-invalid="true"` en los errores API y 62 tests circundantes verdes.
- [x] `631fb5a` vuelve verdes esas regresiones. El worktree y el junction
      temporal quedaron eliminados.

Orden verificado:

```text
769594e gate humano aprobado
66d55d8 test(ui-surfaces-detail-forms): specify detail and form surfaces (...)
b04d3d0 feat(ui-surfaces-detail-forms): refine detail and form workflows (...)
aea3c7b test(ui-surfaces-detail-forms): separate rejection error semantics (R6)
631fb5a fix(ui-surfaces-detail-forms): separate rejection errors (R6)
```

## Checklist C5 — Trazabilidad

- [x] `traceability.md` contiene R1–R14 y ninguna fila pendiente.
- [x] R6 registra los tests originales y las dos regresiones de rechazo, junto
      con `aea3c7b` y `631fb5a`.
- [x] Todos los commits de implementación y corrección siguen Conventional
      Commits y nombran los R-ids correspondientes.

## Checklist C6 — Spec aprobada

- [x] `requirements.md` conserva `status: approved`.
- [x] La casilla humana sigue marcada con fecha 2026-08-11.
- [x] `git diff 769594e HEAD -- requirements.md` está vacío: los requisitos no
      cambiaron después del gate.

## Evidencia funcional y de accesibilidad

- Los errores locales de motivo usan `reasonError`, `role="alert"`, id estable,
  `aria-invalid` y `aria-describedby` en los dos diálogos.
- Los errores de aprobar usan `approveError` y permanecen como alertas fuera
  del diálogo.
- Los errores API de rechazar usan `rejectError`, permanecen dentro del diálogo
  activo y no se atribuyen al `Textarea`.
- Motivo escrito, bloqueo de duplicados, estado pendiente y acción de retry se
  conservan en Administración y Dirección General.
- El lint dirigido de las dos superficies de producción y los tres tests
  tocados terminó con exit code 0.
- La suite dirigida completa terminó con 14 archivos y 331/331 tests verdes.
- La evidencia visual previa sigue aplicando: la remediación no altera clases,
  layout, temas ni responsive; solo separa estado y semántica ARIA.

## Output de ./init.sh

```text
Comando: C:\Program Files\Git\bin\bash.exe ./init.sh
Exit code: 0
Build backend/frontend: exitoso
Backend: 59 suites, 471 tests passed
Frontend: 35 archivos, 455 tests passed
Lint backend: sin errores
Resultado: Todo verde. Listo para trabajar.
```

## Observaciones

Sin observaciones bloqueantes. La skill `ui-styling` respaldó la separación
entre errores de campo y alertas API; las primitivas Base UI locales y la spec
aprobada prevalecieron como contrato.
