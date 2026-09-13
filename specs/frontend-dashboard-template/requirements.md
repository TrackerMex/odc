---
feature: "frontend-dashboard-template"
status: approved
tags: [harness, spec, frontend, dashboard]
---

# Requisitos — [[frontend-dashboard-template]]

> Aprobada por el usuario el 2026-09-13, casilla marcada por el humano y confirmada en chat: «ya lo aprobe». Ver [[design]] y [[../../docs/architecture|architecture]].

## Alcance

Adaptar la estructura visual de [shadcndashboard/shadcndashboard](https://github.com/shadcndashboard/shadcndashboard) al shell autenticado de ODC y a su dashboard ejecutivo para los tres roles. Se elige [Modern](https://demos.shadcndashboard.dev/dashboards/modern?mode=dark) tras comparar Analytics, eCommerce y Modern; [Orders Table](https://demos.shadcndashboard.dev/react-tables/order-datatable?mode=dark) complementa la referencia de filas. Las demos Pro son referencia visual; el repositorio público MIT es la única fuente de código disponible. La referencia visual documental es `preview.html`; contiene datos ficticios señalados como tales y no es código de producción.

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado abre `/`, `/tasks`, `/odcs/new`, `/odcs/$id` o `/monthly-summary`, THE SYSTEM SHALL mostrar el mismo shell con marca ODC / TrackerMex, sidebar expandido de 232px en escritorio, encabezado de 64px en escritorio y 58px en móvil con contexto de ruta, control de sidebar y conmutador de tema existente, conservando usuario y cierre de sesión. La navegación SHALL señalar la ruta activa, ofrecer `/tasks` a los tres roles y mantener «Nueva orden» y «Resumen mensual» exclusivamente para `DIRECTOR_OPS`; los guards, enlaces, permisos y comportamiento de sesión existentes SHALL permanecer vigentes. El breadcrumb de detalle SHALL identificar «Detalle de orden» sin inventar un folio que todavía no se haya cargado. La selección inicial de tema SHALL respetar la preferencia persistida del usuario y el sistema actuales.

- **R2**: WHEN se muestra el dashboard ejecutivo, THE SYSTEM SHALL presentar encabezado con área del rol, saludo, mes recibido y «Crear ODC» solo para `DIRECTOR_OPS`, seguido de un panel ejecutivo con divisores finos, la tabla «Prioridad inmediata» y el contexto de proveedores/antigüedad, en esa misma secuencia de DOM y lectura visual en todos los anchos. A ≥1280px la tabla SHALL ocupar aproximadamente dos tercios del bloque de trabajo y el contexto la columna derecha, con antigüedad debajo de proveedores; a menor ancho el contexto SHALL colocarse debajo de la tabla. El panel SHALL integrar comparación de importe pagado y cuatro métricas —compras del periodo, tareas pendientes, variación de compras y mayor antigüedad— sin una tarjeta flotante por cada cifra.

- **R3**: WHEN se presenta el panel ejecutivo, THE SYSTEM SHALL usar únicamente `ExecutiveDashboardResponse`, formateadores existentes, importes en centavos y cifras tabulares. La comparación SHALL mostrar exactamente dos barras etiquetadas con el mes e importe de `pulse.current` y `pulse.previous`, con escala común proporcional al mayor importe, barras de longitud cero para importes cero y ninguna división por cero si ambos son cero. Las variaciones SHALL respetar los valores recibidos, comunicar `null` como «Sin base de comparación» y diferenciarlo de `0%`; el mayor gasto no SHALL etiquetarse como una mejora económica. El total de tareas SHALL usar `priority.total`, nunca el número de filas visibles, y la mayor antigüedad SHALL usar el primer elemento de `oldestActiveOrders` o indicar ausencia de órdenes.

- **R4**: WHEN existen tareas prioritarias, THE SYSTEM SHALL mostrar como máximo los cinco elementos recibidos, en su orden original, con folio enlazado al detalle existente, descripción, proveedor, estado textual mediante el badge existente, antigüedad en días, importe y siguiente acción autorizada. THE SYSTEM SHALL usar tabla HTML semántica con encabezados e importes alineados a la derecha; en móvil SHALL conservar todos esos datos y enlaces mediante scroll local de la tabla, accesible por teclado y con nombre accesible del contenedor. «Ver todas las tareas» SHALL enlazar a `/tasks` solo cuando `priority.total` supere las filas recibidas. WHILE no existan tareas, THE SYSTEM SHALL mostrar un mensaje explícito sin ocultar los demás datos disponibles.

- **R5**: WHEN existen proveedores o antigüedad operativa, THE SYSTEM SHALL presentar hasta cinco proveedores en el orden recibido, con nombre, compras, importe y barras horizontales normalizadas al mayor importe del ranking, y hasta cinco órdenes antiguas en su orden recibido, con folio enlazado, estado y días. Las barras SHALL acompañarse de valores textuales equivalentes, ser cero cuando el importe es cero y permanecer finitas cuando todos los importes sean cero. WHILE una colección esté vacía, THE SYSTEM SHALL mostrar un mensaje propio para esa sección; ninguna fila, vencimiento, umbral de riesgo ni porcentaje sobre un total desconocido SHALL fabricarse.

- **R6**: WHILE el resumen carga, THE SYSTEM SHALL conservar `aria-busy`, un estado de carga acorde con la nueva estructura y ausencia de cifras simuladas. IF la carga falla, THEN THE SYSTEM SHALL conservar un error anunciado y el botón «Reintentar» conectado al reintento existente. Las vistas de rol no disponible, sesión expirada y acceso denegado SHALL conservar el comportamiento actual.

- **R7**: WHEN la interfaz se verifica a 375, 768, 1024 y 1440px en ambos temas, THE SYSTEM SHALL evitar scroll horizontal de página y solapamientos, permitir abrir/cerrar el menú móvil y acceder a todas las acciones por teclado, conservar foco visible y etiquetas para controles de icono, mantener contraste de texto ≥4.5:1 y áreas táctiles de al menos 44×44px en móvil, y respetar `prefers-reduced-motion`. El contenido largo SHALL poder consultarse sin eliminar datos ni acciones; las tablas secundarias existentes podrán mantener su scroll local. La fuente Inter, los tokens semánticos navy y los ocho pares de estado SHALL conservarse; las secciones nuevas SHALL usar sentence case sin colores literales en componentes.

- **R8**: WHEN se entrega la adaptación, THE SYSTEM SHALL documentar procedencia y correspondencia de las partes tomadas de la plantilla, conservar su aviso MIT en cualquier código sustancial copiado y pasar `./init.sh` junto con las comprobaciones funcionales y visuales asociadas a R1–R7. La implementación SHALL reutilizar TanStack Start/Router/Query, Base UI/shadcn, Lucide y las utilidades actuales, sin endpoints, dependencias, datos de demostración ni controles decorativos sin función en producción.

## Relación con requisitos anteriores

Esta propuesta, solo después de aprobarse, reemplaza las cláusulas de composición y orden de `role-based-executive-dashboard` R9/R13 y `executive-dashboard-visual-refinement` R2–R4 por R2–R5 de esta feature. Conserva íntegros sus contratos, cálculos, límites, permisos y manejo de errores. También permite cambiar la composición de tarjetas del dashboard y sus etiquetas uppercase fijadas por `ui-surfaces-dashboards`, exclusivamente dentro del alcance presente. Los documentos históricos no se reescriben; las excepciones vigentes se registrarán en el override del dashboard antes de implementar.

## Fuera de alcance

- Reescribir login, formularios, detalle de orden, contenido de `/tasks` o resumen mensual independiente; las rutas autenticadas reciben únicamente el shell común.
- Cambiar backend, autenticación, roles, exportaciones o reglas de compra.
- Añadir selección de periodos, búsqueda, notificaciones, configuración de temas, sorting, filtros o menús de acciones que no existan hoy.
- Series diarias, objetivos, presupuestos, ingresos, beneficios, proyecciones o datos ajenos al contrato actual.
- Copiar la aplicación completa, el branding, avatares o dependencias de la plantilla.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-09-13)
