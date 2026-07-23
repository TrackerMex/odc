---
feature: "frontend-general-approval"
status: approved        # draft | approved
tags: [frontend, director-general, odc, spec]
---

# Diseño — [[frontend-general-approval]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas generales del proyecto.

## Decisiones técnicas

- **Dashboard por rol en la ruta raíz existente**: ampliar el loader de
  `src/routes/_authenticated/index.tsx` con una rama
  `DIRECTOR_GENERAL` que solicite solo `PRESUPUESTO_APROBADO`. Las ramas de
  Operaciones y Administración permanecen sin cambios (R1, R2).
- **Componente de Dirección General separado**: crear un dashboard específico
  para la única cola `Esperando mi aprobación`, siguiendo la presentación de
  las colas existentes y reutilizando utilidades de importe, badge y enlace
  cuando corresponda (R2, R10).
- **Panel de aprobación general separado**: componer en la ruta de detalle un
  panel visible solo para `DIRECTOR_GENERAL` +
  `PRESUPUESTO_APROBADO`. No se reutiliza `AdminBudgetActions` porque los
  textos, endpoint de aprobación y frontera de rol/estado son distintos; sí se
  reutilizan los primitivos shadcn ya instalados (R3, R5–R10).
- **Marca derivada del historial**: determinar `Validado por Administración`
  con la existencia de una transición a `PRESUPUESTO_APROBADO` en
  `odc.history`. El historial es la evidencia persistida de T3; no se añade un
  booleano al contrato ni se infiere la marca solo del estado actual (R4).
- **Cliente API tipado**: añadir `approvePurchase` a `src/lib/api.ts` con
  `POST /api/odcs/:id/approve-purchase`. Reutilizar `rejectOdc`, cuyo contrato
  vivo ya recorta y envía `{ rejectionReason }` al endpoint compartido (R6,
  R8).
- **Estado local confirmado por servidor**: conservar el patrón de la ruta
  `$id`: reemplazar la ODC local únicamente con respuestas exitosas. No se
  aplican transiciones optimistas; 403, 409 o errores de red dejan la ODC
  original y habilitan reintento (R6, R8, R9).
- **shadcn/ui y accesibilidad**: reutilizar `Dialog`, `Button`, `Card`,
  `Label` y `Textarea` ya instalados. No se crea modal custom ni se requieren
  nuevos componentes de shadcn (R7, R8, R10).
- **Tests aislados**: usar Vitest + Testing Library con API mockeada; los tests
  del cliente mockean `fetch`. La marca de R4 se prueba con historiales
  explícitos y las fronteras de R5 con una matriz rol/estado (R1–R10).

## Archivos afectados

- `frontend/src/lib/api.ts` — función tipada para aprobar compra.
- `frontend/src/lib/odc-api.test.ts` — contrato HTTP de aprobación y regresión
  del rechazo compartido.
- `frontend/src/routes/_authenticated/index.tsx` — loader y selección del
  dashboard de Dirección General.
- `frontend/src/routes/_authenticated/odcs/$id.tsx` — composición condicional
  del panel de aprobación general y actualización local confirmada.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` — carga por rol
  y regresión de las ramas existentes.
- `frontend/src/components/odc/general-dashboard.tsx` — cola y contador
  `Esperando mi aprobación`.
- `frontend/src/components/odc/general-approval-actions.tsx` — marca de
  validación, aprobación y diálogo de rechazo.
- Tests `*.test.tsx` junto a los dos componentes anteriores, nombrados con
  R1–R10.

No se crea una ruta nueva y `frontend/src/routeTree.gen.ts` no forma parte de
los archivos afectados.

## Alternativas descartadas

- **Reutilizar `AdminDashboard` con condicionales**: se descarta porque sus dos
  colas, encabezado y responsabilidades pertenecen a Administración; una
  variante separada evita mezclar roles.
- **Reutilizar `AdminBudgetActions` cambiando props y textos**: se descarta
  porque podría debilitar las fronteras de rol/estado y acoplar dos endpoints
  de aprobación distintos.
- **Añadir `validatedByAdministration` al backend**: se descarta; el historial
  existente ya registra la transición T3 y el brief exige derivar la marca.
- **Inferir la marca desde `status === PRESUPUESTO_APROBADO`**: se descarta
  porque dejaría de mostrarla después de T5/T6 y no demostraría que la
  transición existe en el historial.
- **Nueva ruta `/general` o `/approvals`**: se descarta; la raíz protegida ya
  selecciona dashboard por rol y el detalle existente es recargable.
- **Optimistic update**: se descarta para no representar transiciones que el
  backend pueda rechazar por rol, estado o concurrencia.
- **Modal custom**: se descarta por accesibilidad y por la convención
  obligatoria de shadcn/ui.
