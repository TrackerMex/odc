# Sesion en curso — 2026-08-11

```
feature: ui-surfaces-detail-forms
id: 26
inicio: 2026-08-11 13:43 -06:00
plan: fases 3b + 3c del refactor visual — detalle, acciones y formularios;
      revisar la deuda heredada de CardHeader y toast
estado: in_progress; implementación R1-R14 terminada, pendiente de reviewer
bloqueos: ninguno
spec_author: hecho -> specs/ui-surfaces-detail-forms/ (14 requisitos)
gate humano: aprobado por el usuario el 2026-08-11
implementer: terminado -> commits 66d55d8 y b04d3d0
reviewer: no lanzado
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
