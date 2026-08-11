# Sesion en curso — 2026-08-11

```
feature: ui-surfaces-detail-forms
id: 26
inicio: 2026-08-11 13:43 -06:00
plan: fases 3b + 3c del refactor visual — detalle, acciones y formularios;
      revisar la deuda heredada de CardHeader y toast
estado: in_progress; reviewer aprobado, pendiente de cierre por leader
bloqueos: ninguno
spec_author: hecho -> specs/ui-surfaces-detail-forms/ (14 requisitos)
gate humano: aprobado por el usuario el 2026-08-11
implementer: corrección -> commits aea3c7b y 631fb5a
reviewer: aprobado -> progress/review_ui-surfaces-detail-forms.md
```

## Contexto

- La feature 30 confirmo que detalle, formularios, login y resumen mensual
  tienen caminos desde rutas de produccion.
- El alcance visual se rige por `design-system/odc/MASTER.md` y los overrides
  `pages/odc-detail.md` y `pages/odc-form.md`.
- La skill `ui-styling` aporta las guardas de accesibilidad de formularios,
  foco visible, errores asociados y composicion responsive. Las primitivas
  existentes sobre `@base-ui/react` y el sistema de diseno local siguen siendo
  autoritativos; no se regeneran componentes shadcn.
- La spec fue aprobada por el usuario el 2026-08-11 y la feature pasó a
  `in_progress`; el implementer no la marca `done` antes de revisión.

## Verificacion inicial

`./init.sh` verde: 471 tests backend, 419 frontend, builds y lint correctos.

## Implementación

- Skill `ui-styling` y referencias de accesibilidad/responsive releidas.
- Tests de contrato R1-R14 agregados antes de tocar produccion: detalle,
  acciones, formularios, DatePicker, Toast y guardas transversales.
- Demostración roja: 25 fallos esperados y 186 tests verdes antes de producción.
- Commit test-only: `66d55d8`; no contiene archivos de producción.
- Implementación: `b04d3d0`; filas semánticas, timeline por estado, acciones al
  pie, confirmación de completar, validación accesible en los cinco formularios,
  passthrough de DatePicker, comentarios Collapsible y Toast `rounded-card`.
- Los tests de factura que antes esperaban una subida inmediata se ajustaron
  después del commit rojo porque R5 introduce un paso explícito de confirmación;
  ahora prueban cancelación, una sola llamada al confirmar, loading y retry
  dentro del diálogo. También se añadió cobertura de composición de ruta y del
  contraste exacto light/dark para cerrar huecos detectados durante el verde.

## Verificación del implementer

- Suite dirigida: 316/316 verde.
- Suite frontend completa: 455/455 verde.
- Build frontend y smoke Playwright de login: verdes.
- Lint dirigido a producción modificada y a la ruta: verde. El lint global de
  frontend conserva fallos preexistentes fuera de esta feature (dashboard,
  reachability, primitivas generadas y `api.ssr`); no se amplió el alcance.
- Verificación visual real documentada en
  `progress/verify_ui-surfaces-detail-forms.md`: light 768/1024/1440 y dark
  1440, sin overflow; 375 queda para #28. El fixture no contiene una ODC
  rechazada, por lo que el banner dark se valida por tests de tokens/contraste.
- `./init.sh` final verde: build backend/frontend, 471 tests backend, 455 tests
  frontend y lint backend. Se entrega al reviewer sin cambiar el estado de la
  feature a `done`.

## Corrección solicitada por reviewer

- El reviewer detectó que el error API de rechazo compartía estado con la
  validación local y atribuía incorrectamente la alerta al textarea en los dos
  diálogos de aprobación.
- Regresiones R6 escritas primero en ambos componentes. Rojo confirmado: 2
  fallos exactos porque los textareas tenían `aria-invalid="true"`; 62 tests
  circundantes verdes. Commit test-only: `aea3c7b`.
- `AdminBudgetActions` y `GeneralApprovalActions` separan ahora el error local
  del motivo, el error API de aprobar y el error API de rechazar. Solo el error
  local usa `aria-describedby`; el fallo API permanece como alerta dentro del
  diálogo y conserva motivo y retry. Commit de corrección: `631fb5a`.
- Se eliminaron las aserciones de tipo innecesarias de
  `upload-invoice-form.test.tsx`; ESLint dirigido sobre producción y los tres
  tests tocados queda verde.
- Suite frontend completa verde: 35 archivos y 455/455 tests.
- `./init.sh` final verde: build backend/frontend, 471 tests backend, 455 tests
  frontend y lint backend. Corrección lista para segunda revisión.

## Segunda revisión

- Reviewer confirmó `aea3c7b` como test-only y reprodujo el rojo aislado: 2
  fallos R6 exactos y 62 tests circundantes verdes.
- La separación de errores locales, de aprobación y de rechazo cumple R5/R6;
  conserva el motivo, el diálogo activo y el retry sin atribuir el fallo API al
  `Textarea`.
- Lint dirigido verde sobre las dos superficies y los tres tests tocados.
- Suite dirigida 331/331 verde; `./init.sh` independiente verde con 471 tests
  backend y 455 frontend.
- Acta `APROBADO` en `progress/review_ui-surfaces-detail-forms.md`. La feature
  permanece `in_progress` hasta el cierre del leader.
