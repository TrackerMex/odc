---
feature: "operations-monthly-summary"
status: draft
tags: [backend, frontend, director-ops, odc, reportes, spec]
---

# Diseño — [[operations-monthly-summary]]

> Ver [[requirements]] para los requisitos y
> [[../../docs/architecture|architecture]] para las reglas generales del proyecto.

## Decisiones técnicas

- **El mes se define por `paymentDate` y no por creación o factura**: representa el momento en que la compra se realizó. La consulta incluye `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA` y `COMPLETADA`, de modo que las compras ya pagadas permanecen en el reporte aunque aún les falte evidencia o factura (R1–R4).
- **Caso de uso de lectura y contrato de repositorio específicos**: añadir `GetMonthlyPurchaseSummaryUseCase` en `application/use-cases/` que dependa de una nueva operación de `PurchaseOrderRepository`. La implementación TypeORM realizará el filtro por rango semiabierto `[primer día del mes, primer día del siguiente mes)`, los estados permitidos y el `JOIN` con usuario solicitante en una consulta, evitando N+1 (R1–R3).
- **Agregados con dinero entero**: el repositorio devolverá las compras elegibles y el caso de uso calculará total, conteos, ticket promedio y desglose de etapas con centavos enteros; el frontend será el único responsable de formatearlos como moneda. El promedio de almacén se calcula únicamente para filas con ambas fechas y no inventa valor cuando no hay casos comparables (R2, R6).
- **Endpoint protegido y sin colisión con `:id`**: exponer `GET /api/odcs/monthly-summary?month=YYYY-MM` antes de las rutas `GET /api/odcs/:id`; el controller usará `@Roles('DIRECTOR_OPS')`, DTO validado con `class-validator` y el mapper de respuesta. El endpoint no aceptará ni confiará en un rol enviado por cliente (R1–R4).
- **Superficie Operate, no una réplica de Excel**: crear ruta autenticada `/monthly-summary` y enlazarla desde el dashboard de Operaciones. La cabecera muestra mes y acciones; las tarjetas muestran los KPI; la tabla conserva el seguimiento auditable de la captura de referencia. En móvil, las tarjetas se apilan y la tabla conserva legibilidad mediante contenedor horizontal, sin ocultar importes ni estados (R5, R6, R8).
- **shadcn/ui obligatorio para primitivas**: antes de construir la pantalla, usar el MCP de shadcn para comprobar e instalar `table`, `alert`, `select` o cualquier primitiva faltante. Reutilizar los componentes ya instalados (`Card`, `Button`, `Skeleton`, `Badge`, `Tooltip`) y no crear sustitutos manuales. Los componentes `MonthlySummary` y `MonthlySummarySlide` solo componen esas primitivas para el dominio ODC (R5, R8, R9).
- **Exportación desde una representación dedicada de la lámina**: `MonthlySummarySlide` compartirá los datos del resumen pero tendrá un diseño fijo de reporte. Un adaptador de exportación generará PNG y PDF apaisado desde esa representación, esperará fuentes o recursos necesarios y restaurará el estado de los botones ante error. La lámina llevará el periodo y los importes formateados, por lo que un archivo no puede confundirse con otro mes (R7, R8).
- **Sin mutaciones ni datos persistidos**: el reporte se calcula al solicitarlo; no añade columnas ni tablas, no registra una transición y no altera una ODC (R1–R8).

## Archivos afectados

- `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts` — contrato de consulta mensual y tipos de salida.
- `backend/src/modules/odc/application/dto/get-monthly-purchase-summary.query.dto.ts` — validación del parámetro `month`.
- `backend/src/modules/odc/application/use-cases/get-monthly-purchase-summary.usecase.ts` — autorización de aplicación y cálculo de KPI en centavos.
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts` — consulta TypeORM eficiente, filtro temporal y unión con solicitante.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` — endpoint protegido y mapeo de errores HTTP.
- Tests unitarios del repositorio, caso de uso y controller — cobertura de R1–R4 y R6 con nombres de requisito.
- `frontend/src/lib/api.ts` y sus tests — cliente tipado para el resumen mensual.
- `frontend/src/routes/_authenticated/monthly-summary.tsx` y pruebas de ruta — carga protegida de la nueva superficie.
- `frontend/src/routes/_authenticated/index.tsx` y `frontend/src/components/odc/odc-dashboard.tsx` — acceso desde Operaciones.
- `frontend/src/components/odc/monthly-summary.tsx` y pruebas — tablero, tabla, estados y accesibilidad.
- `frontend/src/components/odc/monthly-summary-slide.tsx` y pruebas — composición de lámina exportable.
- `frontend/src/lib/monthly-summary-export.ts` y pruebas — adaptador PNG/PDF, aislado de los componentes React.
- `frontend/src/components/ui/*` — solo archivos añadidos mediante el MCP de shadcn cuando falte una primitiva; nunca edición manual de una primitiva instalada.

No se editará manualmente `frontend/src/routeTree.gen.ts`.

## Alternativas descartadas

- **Sumar ODC por `createdAt` o por `invoiceDate`**: se descarta porque no corresponde con la compra realizada; `paymentDate` ya es el dato de negocio que representa ese evento.
- **Incluir `COMPRA_APROBADA`**: se descarta porque aún no hay pago y contabilizarla inflaría el gasto mensual real.
- **Generar los archivos en el backend y almacenarlos**: se descarta en esta primera versión; añadirá infraestructura, retención y permisos para un reporte que se puede construir con datos ya autorizados en el navegador.
- **Enviar automáticamente por correo o chat**: se descarta porque no existe una integración externa autorizada ni una política de destinatarios; la descarga deja el archivo listo para compartir.
- **Recrear la hoja como tabla sin jerarquía**: se descarta porque mantiene el problema de escaneabilidad. La tabla se conserva solo como detalle, después de los indicadores ejecutivos.
- **Construir botones, tablas o selectores propios**: se descarta explícitamente por la decisión del producto de usar shadcn/ui; cualquier primitiva ausente se obtiene mediante su MCP.
