---
feature: "ui-dead-surfaces-audit"
status: draft        # draft | approved
tags: [harness, spec, frontend, audit, routes]
---

# Requisitos — [[ui-dead-surfaces-audit]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para el inventario y las decisiones, y
> [[../../docs/architecture|architecture]] para las reglas de arquitectura.

## Requisitos funcionales

- **R1**: WHEN se aplique la decisión de esta auditoría, THE SYSTEM SHALL
  eliminar `odc-dashboard.tsx`, `admin-dashboard.tsx` y
  `general-dashboard.tsx`, junto con sus tres archivos `*.test.tsx`, y SHALL
  retirar sus referencias de tests, guardas y documentación normativa activa.
  THE SYSTEM SHALL actualizar el plan activo de la feature 26 para que no le
  encargue retirar los tres `pb-3!` eliminados por esta feature, sin borrar la
  evidencia histórica que explica su origen; ningún import de producción ni
  test ejecutable SHALL intentar cargar, leer o renderizar los módulos
  eliminados.

- **R2**: WHEN un usuario autenticado con rol `DIRECTOR_OPS`,
  `ADMINISTRACION` o `DIRECTOR_GENERAL` abre `/`, THE SYSTEM SHALL conservar la
  portada vigente: una sola llamada a `getExecutiveDashboard` y un solo
  `ExecutiveDashboard` configurado con el rol devuelto por el endpoint. IF el
  rol no pertenece a esos tres roles de negocio, THEN THE SYSTEM SHALL no
  solicitar ni exponer el resumen ejecutivo. La eliminación de R1 SHALL no
  reintroducir llamadas por estado a `listOdcs` ni una rama de dashboard por
  rol.

- **R3**: WHEN se ejecuten los tests del frontend, THE SYSTEM SHALL construir
  la alcanzabilidad transitiva desde los archivos de ruta de producción hacia
  todos los archivos `*.tsx` no-test de `frontend/src/components/odc/` y SHALL
  fallar nombrando cada componente que no tenga un camino de imports desde una
  ruta. Los imports exclusivos de `*.test.*`, el árbol de rutas generado y las
  guardas que solo leen código fuente SHALL no contar como uso de producción.

- **R4**: WHEN se aplique la decisión de esta auditoría, THE SYSTEM SHALL
  conservar verificablemente las superficies montadas previstas por las
  features 26 y 27:
  `/odcs/$id` SHALL componer `OdcDetail` y las acciones/formularios
  `AdminBudgetActions`, `GeneralApprovalActions`, `PaymentEvidenceForm`,
  `RegisterPaymentForm` y `UploadInvoiceForm` bajo sus gates de rol/estado
  vigentes, y SHALL mostrar `OdcForm` únicamente al creador `DIRECTOR_OPS` de
  una ODC `BORRADOR` o `RECHAZADA`; `/odcs/new` SHALL componer `OdcForm` para
  `DIRECTOR_OPS`; `/login` SHALL componer `LoginForm`; y `/monthly-summary`
  SHALL componer `MonthlySummary`, que a su vez SHALL alcanzar
  `MonthlySummarySlide`. La ruta mensual SHALL conservar su loader
  `getMonthlyPurchaseSummary`, su acceso de sidebar para `DIRECTOR_OPS` y la
  redirección de cualquier otro rol.

## Fuera de alcance

- Implementar el rediseño de detalle/formularios de la feature 26 o el resumen
  mensual de la feature 27.
- Montar otra vez los tres dashboards sustituidos o cambiar la composición,
  datos, jerarquía visual o navegación de `ExecutiveDashboard`.
- Cambiar endpoints backend, permisos, máquina de estados, contratos HTTP o
  dependencias del proyecto.
- Borrar referencias históricas en specs aprobadas, `progress/` o commits; son
  evidencia de decisiones anteriores, no documentación normativa activa.
- Auditar código muerto fuera de las superficies React indicadas en
  [[design]].

## Aprobación

- [ ] Aprobado por humano (fecha: ____)
