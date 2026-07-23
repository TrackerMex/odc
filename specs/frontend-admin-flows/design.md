---
feature: "frontend-admin-flows"
status: approved        # draft | approved
tags: [frontend, administracion, odc, spec]
---

# Diseño — [[frontend-admin-flows]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas generales del proyecto.

## Decisiones técnicas

- **Dashboard por rol en la ruta raíz existente**: ampliar el loader de
  `src/routes/_authenticated/index.tsx` para resolver el dashboard según
  `context.user.role`. `DIRECTOR_OPS` conserva sus cuatro colas;
  `ADMINISTRACION` carga `PENDIENTE_ADMIN` y `PAGO_REGISTRADO`; el placeholder
  queda para `DIRECTOR_GENERAL` hasta la feature 12 (R1, R2, R12).
- **Componente administrativo separado**: crear `AdminDashboard` en vez de
  llenar `OdcDashboard` de condicionales por rol. Puede reutilizar una tarjeta
  de cola extraída si eso reduce duplicación sin alterar el dashboard Ops
  (R1, R2).
- **Detalle común + paneles de acción**: mantener `OdcDetail` como presentación
  de datos compartidos y componer debajo paneles específicos para presupuesto
  o comprobante. La ruta `$id` conserva la ODC actualizada en estado local y
  reemplaza ese valor solo con respuestas exitosas del backend (R3–R10, R12).
- **Cliente API tipado**: añadir `approveBudget`, `rejectOdc` y
  `uploadPaymentEvidence` a `src/lib/api.ts`. Las dos primeras reutilizan
  `jsonRequest`; la subida usa `FormData` directamente y omite `Content-Type`
  para que `fetch` genere el boundary multipart (R4, R6, R9).
- **Validación local mínima y alineada al backend**: motivo recortado no vacío;
  archivo requerido, allowlist PDF/JPEG/PNG y máximo 10 MB. La validación de UI
  evita viajes inútiles, pero el backend conserva la autoridad y sus errores
  se presentan vía `ApiError` (R5, R8, R10).
- **shadcn/ui obligatorio**: instalar mediante MCP/CLI el componente `Dialog`
  para rechazo si no existe. Reutilizar `Button`, `Card`, `Input`, `Label` y
  los componentes de feedback ya instalados; no crear un modal custom (R5,
  R11).
- **Sin optimistic update**: aprobación, rechazo y evidencia cambian la UI
  únicamente con la ODC retornada por el servidor. Así un 403/409/red deja el
  status original visible y permite reintentar (R4, R6, R9, R10).
- **Tests aislados**: Vitest + Testing Library con funciones API mockeadas; los
  tests del cliente mockean `fetch` y examinan JSON/FormData. No se requiere
  backend, PostgreSQL ni Cloudinary reales (R1–R12).

## Archivos afectados

- `frontend/src/lib/api.ts` — funciones tipadas de aprobar, rechazar y subir
  evidencia.
- `frontend/src/lib/odc-api.test.ts` — contratos HTTP JSON y multipart.
- `frontend/src/routes/_authenticated/index.tsx` — selección del dashboard por
  rol y loader de las dos colas administrativas.
- `frontend/src/routes/_authenticated/odcs/$id.tsx` — composición condicional
  de acciones de Administración y actualización local con la respuesta API.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` — carga por rol y
  regresión de rutas existentes.
- `frontend/src/components/odc/admin-dashboard.tsx` — dos colas y contadores de
  Administración.
- `frontend/src/components/odc/admin-budget-actions.tsx` — aprobación y diálogo
  de rechazo.
- `frontend/src/components/odc/payment-evidence-form.tsx` — validación y envío
  de archivo/referencia.
- `frontend/src/components/odc/odc-detail.tsx` — presentación de datos de pago
  cuando existan.
- `frontend/src/components/ui/dialog.tsx` — componente shadcn, solo si falta.
- Tests `*.test.tsx` junto a los componentes anteriores, nombrados con R1–R12.
- `frontend/src/routeTree.gen.ts` — solo si la herramienta de TanStack lo
  regenera; no se edita manualmente.

## Alternativas descartadas

- **Un dashboard único con configuración para todos los roles**: se descarta
  por ahora; las acciones y encabezados difieren y la feature 12 aún no define
  la tercera variante. Compartir una tarjeta pequeña sigue permitido.
- **Nueva ruta `/admin`**: se descarta; la raíz protegida ya es el punto de
  entrada por rol y la sesión expone `context.user.role`.
- **Modal implementado a mano**: se descarta por accesibilidad y por la
  convención obligatoria de shadcn/ui.
- **Codificar el archivo en base64 o JSON**: se descarta; el endpoint existente
  exige `multipart/form-data` con `file`.
- **Fijar `Content-Type: multipart/form-data` manualmente**: se descarta porque
  omitiría el boundary que `fetch` genera al recibir `FormData`.
- **Actualizar el status antes de recibir respuesta**: se descarta para no
  mostrar transiciones que el backend podría rechazar por rol o concurrencia.
- **Estado global zustand para colas y mutaciones**: se descarta; el store
  existente es exclusivamente de sesión y el estado de esta pantalla es local.
