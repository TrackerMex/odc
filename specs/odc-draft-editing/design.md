---
feature: "odc-draft-editing"
status: approved        # draft | approved
tags: [harness, spec]
---

# Diseño — [[odc-draft-editing]]

## Decisión

Extender la condición `canEdit` de la ruta de detalle para incluir
`odc.status === 'BORRADOR'` cuando el usuario sea el creador y tenga rol
`DIRECTOR_OPS`. Reutilizar `OdcForm`, `updateOdc` y `submitOdc`; no se agrega un
campo `status` al DTO. El botón de guardar mantiene el borrador y el botón de
enviar ejecuta la transición existente después de persistir los campos.

## Superficie afectada

- `frontend/src/routes/_authenticated/odcs/$id.tsx`: habilitación del formulario
  para borradores y texto/contexto de edición.
- Tests de la ruta y del formulario: cobertura R1–R5 con nombres de requisito.
- Backend: solo se verificará regresión de PATCH/submit; no se prevé cambio.

## Límites de seguridad

La UI no sustituye la autorización del backend. `PATCH` y `submit` continúan
validando creador, rol y estado, y cualquier 403/409 se presenta mediante el
manejo existente del formulario.
