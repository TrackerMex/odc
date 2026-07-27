---
feature: "role-based-executive-dashboard"
status: draft
tags: [harness, spec, dashboard, roles]
---

# Diseño — [[role-based-executive-dashboard]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Decisiones técnicas

- **Un snapshot autenticado para la portada**: añadir `GET /api/odcs/executive-dashboard?month=YYYY-MM`, protegido por el guard JWT global y sin `@Roles` adicional; el controlador derivará `OdcViewer` de la sesión y delegará en `GetExecutiveDashboardUseCase`. Evita que la ruta `/` coordine múltiples listas y asegura que tareas y métricas se calculen para la misma consulta (R1, R2, R5-R10).

- **Contrato de consulta en el dominio**: extender `PurchaseOrderRepository` con `getExecutiveDashboard(viewer, month)`, y definir allí los tipos puros de tareas, pulso, órdenes antiguas y proveedores. El caso de uso sólo validará/coordinará el mes, calculará el mes anterior y mapeará la prioridad; no importará TypeORM ni HTTP. El token de inyección seguirá siendo exactamente `'PurchaseOrderRepository'` (R1-R7, R10-R11).

- **Tareas propias a partir de transiciones existentes**: el repositorio construirá el filtro por rol con las etapas que ya autorizan `PurchaseOrder.transition()`. Para `DIRECTOR_OPS`, `BORRADOR` y `RECHAZADA` llevarán siempre `createdById = viewer.userId`; las etapas posteriores se asignan por responsabilidad de rol porque el modelo no posee asignación individual. No se añadirán roles, permisos ni transiciones (R2, R4, R10).

- **Prioridad explícita y estable**: el caso de uso ordenará las tareas admisibles por edad descendente; la infraestructura proporcionará `createdAt` y un orden estable secundario. Devolverá sólo las primeras cinco y el total de todas las tareas admisibles. Los días de antigüedad se calculan como días UTC completos desde `createdAt`; se eligió creación y no último cambio de estado porque éste último requeriría una semántica no acordada para el historial (R3, R6).

- **Pulso y proveedores desde pagos reales**: la infraestructura reutilizará exactamente las etapas mensuales ya empleadas por `GetMonthlyPurchaseSummaryUseCase` y filtrará por `paymentDate` del mes actual y anterior. Los totales/contadores y los cinco proveedores se obtendrán con `SUM`, `COUNT` y `GROUP BY`; la variación se calcula en application, retornando `null` si no hay base anterior. No se duplicará la página o exportación de resumen mensual (R5, R7, R11).

- **Antigüedad global sin filtrar información privada**: la consulta de órdenes activas sólo considerará las cinco etapas públicas de R6. Excluir borradores evita divulgar el trabajo privado de otras personas y excluir rechazadas/completadas mantiene el indicador centrado en flujo bloqueado o incompleto (R6, R10).

- **Composición frontend común**: reemplazar los tres paneles por un `ExecutiveDashboard` reutilizable con configuración de etiqueta y acciones según el rol, conservando `Card`, `Button`, `Badge`, `Skeleton` y `Alert` de shadcn/ui ya instalados. La ruta autenticada hará una única llamada `getExecutiveDashboard(currentMonth())`; los enlaces de tareas reutilizarán `/odcs/$id` y el acceso de creación `/odcs/new` (R1, R3-R4, R8-R9).

- **Estados y movimiento prudente**: la ruta seguirá usando componentes de pending/error existentes para la carga inicial y el panel añadirá estados de vacío por sección. Las actualizaciones o reintentos usarán transiciones CSS discretas condicionadas por `motion-reduce`; no se introducirá una librería de animación nueva (R8-R9).

- **Vista completa de tareas**: añadir `GET /api/odcs/executive-dashboard/tasks?page=N`, que deriva el rol y la identidad exclusivamente de la sesión y devuelve una página de tareas bajo el mismo filtro, proyección, orden y mapa de siguiente acción que R2-R4. La ruta autenticada `/tasks` reutilizará la lista visual de prioridad y ofrecerá un retorno claro a la bandeja; el dashboard sólo expone el enlace cuando quedan tareas fuera de las primeras cinco (R12).

## Contrato HTTP propuesto

`GET /api/odcs/executive-dashboard?month=YYYY-MM`

La respuesta serializada no expondrá archivos de evidencia/factura ni IDs de Cloudinary. Tendrá esta forma conceptual:

```ts
interface ExecutiveDashboardResponse {
  month: string
  role: 'DIRECTOR_OPS' | 'ADMINISTRACION' | 'DIRECTOR_GENERAL'
  priority: { total: number; items: ExecutiveTask[] }
  pulse: {
    current: { purchaseCount: number; totalCents: number }
    previous: { month: string; purchaseCount: number; totalCents: number }
    purchaseCountChangePercent: number | null
    totalCentsChangePercent: number | null
  }
  oldestActiveOrders: ExecutiveOrder[]
  topSuppliers: { supplier: string; purchaseCount: number; totalCents: number }[]
}
```

`ExecutiveTask` y `ExecutiveOrder` incluyen solamente `id`, `odcNumber`, `status`, `description`, `supplier`, `totalCents`, `createdAt` y `ageDays`; `ExecutiveTask` añade `nextAction`. El frontend transforma `nextAction` en texto y enlace permitido por el mapa de rol/estado, no en una mutación nueva.

## Archivos afectados

- `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts` — contratos puros para el snapshot ejecutivo.
- `backend/src/modules/odc/application/dto/get-executive-dashboard.query.dto.ts` — validación de `month` con formato `YYYY-MM`.
- `backend/src/modules/odc/application/use-cases/get-executive-dashboard.usecase.ts` — coordinación, límite/prioridad, mes anterior y variaciones.
- `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts` — consultas paginadas/agregadas y filtros de visibilidad, sin N+1.
- `backend/src/modules/odc/infrastructure/mappers/odc-response.mapper.ts` — DTO HTTP y serialización segura del snapshot.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts` — ruta, DTO y viewer de sesión.
- `backend/src/modules/odc/odc.module.ts` — registro del nuevo caso de uso bajo el proveedor existente.
- `frontend/src/lib/odc.ts` — tipos de respuesta y formateadores puros de antigüedad/variación si hacen falta.
- `frontend/src/lib/api.ts` — cliente `getExecutiveDashboard(month)`.
- `frontend/src/routes/_authenticated/index.tsx` — loader único y composición de la portada por rol.
- `frontend/src/components/odc/executive-dashboard.tsx` — prioridad, pulso, antigüedad, proveedores, estados y diseño responsive compartido.
- `frontend/src/routes/_authenticated/tasks.tsx` y `frontend/src/components/odc/executive-task-list.tsx` — vista completa paginada y lista reutilizada por el dashboard.
- `frontend/src/components/odc/{odc-dashboard,admin-dashboard,general-dashboard}.tsx` — retirar o sustituir la composición de colas duplicada, manteniendo los flujos de detalle enlazados.
- Archivos `*.spec.ts` y `*.test.tsx` adyacentes — pruebas unitarias, de repositorio, controlador, cliente y UI nombradas por R-id.

## Alternativas descartadas

- **Componer la portada con llamadas a `listOdcs` y al resumen mensual actual**: se descartó porque no resuelve antigüedad/proveedores para todos los roles, multiplica las solicitudes de SSR y no ofrece una vista consistente del periodo.
- **Exponer las tareas de todos los roles y filtrar en React**: se descartó porque filtra datos privados en el cliente y permitiría mezclar responsabilidades.
- **Calcular antigüedad desde el último cambio de estado**: se descartó porque el brief dejó esa semántica abierta y el historial no representa de forma inequívoca el inicio de cada tarea; `createdAt` es un dato persistido, verificable y común.
- **Añadir gráficas o una librería de motion**: se descartó para preservar el panel ejecutivo sobrio; las cifras comparables, colas y feedback de estado satisfacen el objetivo sin ruido visual ni dependencia nueva.
