# Sesion en curso — 2026-08-11

```
feature: ui-surfaces-detail-forms
id: 26
inicio: 2026-08-11 13:43 -06:00
plan: fases 3b + 3c del refactor visual — detalle, acciones y formularios;
      revisar la deuda heredada de CardHeader y toast
estado: spec_ready; implementacion bloqueada por gate humano
bloqueos: ninguno
spec_author: hecho -> specs/ui-surfaces-detail-forms/ (14 requisitos)
gate humano: pendiente
implementer: no lanzado
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
- La feature esta en `spec_ready`; el siguiente paso es la aprobacion humana
  de `requirements.md`.

## Verificacion inicial

`./init.sh` verde: 471 tests backend, 419 frontend, builds y lint correctos.
