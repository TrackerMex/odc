---
version: 1
slug: "frontend-src-routes-authenticated-index-tsx"
primary_target: "frontend/src/routes/_authenticated/index.tsx"
related_targets: ["frontend/src/components/odc/executive-dashboard.tsx", "frontend/src/components/odc/executive-analytics.tsx", "frontend/src/components/odc/executive-task-table.tsx", "frontend/src/components/odc/executive-tasks.tsx", "frontend/src/routes/_authenticated/tasks.tsx", "frontend/src/components/odc/odc-form.tsx", "frontend/src/components/layout/app-layout.tsx"]
---

# Dashboard ejecutivo

## Job and audience

- **Mode:** Operate.
- **Audience:** Dirección de Operaciones, Administración y Dirección General, con permisos y responsabilidades existentes.
- **Job:** comprender el periodo, encontrar tareas accionables del rol y entrar al siguiente paso de una ODC con datos verificables.

## Outcome and proof

- Cuatro indicadores independientes: importe pagado, compras pagadas, ODC visibles creadas en el mes y tareas accionables de todos los meses sin filtros de tabla.
- Importe y compras usan fecha de pago; cohorte y Mis tareas usan fecha de creación. El mes inicial corresponde a `America/Mexico_City`.
- Tendencia real de 12 meses hasta el seleccionado, ocho estados actuales de la cohorte con ceros explícitos, hasta cinco proveedores por importe pagado y cinco órdenes activas más antiguas.
- Una nueva ODC se revisa antes de escribir y muestra después el folio/estado del servidor; el envío fallido se recupera sobre el borrador ya creado.

## Selected direction

- **Visual authority:** `design-system/odc/MASTER.md`, con la enmienda #32 de `design-system/odc/pages/dashboard.md`; `DESIGN.md` es derivado. Decisión humana aprobada el 2026-09-13 en `specs/executive-workspace-v2/requirements.md` R1–R14.
- **Thesis:** extender el dashboard Modern aprobado con Inter, navy y tokens vigentes, separando contexto estadístico y cola de trabajo.
- **Focal moment:** tendencia mensual dominante acompañada por distribución de estados; debajo, tabla completa de prioridades consultable por rol.
- **Implementation consequence:** `ExecutiveDashboard` integra `ExecutiveAnalytics` y `ExecutiveTaskTable`; Mis tareas reutiliza esta última tabla. La composición reemplaza la franja prioritaria y la comparación de dos meses anteriores, sin cambiar la identidad global.

## Scope and boundaries

- Dashboard, Mis tareas, encabezado autenticado adhesivo y revisión de nueva ODC; mantener guards, ocho estados y transiciones existentes.
- Reutilizar controles, Dialog, tablas y tokens locales. SVG específico y tabla textual equivalente, sin dependencia nueva de gráficas.
- Sin presupuestos objetivo, beneficios, previsiones, acciones masivas, realtime, motor genérico de tablas ni nuevos flujos de aprobación. No extender estas decisiones de composición a otras páginas.

## States and ranges

- «Periodo estadístico» afecta los agregados del dashboard; la tabla conserva pendientes de todos los meses. Sus filtros no cambian las estadísticas.
- Mis tareas inicia con «Mes de creación» actual y permite otros meses, «Todos los meses» explícito y volver a «Mes actual». El enlace «Ver pendientes de todos los meses» abre `/tasks?month=all&page=1`, incluso si el mes no tiene tareas.
- Búsqueda por folio/proveedor al enviar, estado limitado al rol, orden y página viven en URL y se aplican en servidor antes de contar y paginar. Máximo 10 filas; Administración inicia por más recientes, OPS/Dirección General por más antiguas. «Limpiar filtros» conserva el periodo y vuelve a página 1.
- Carga anunciada sin cifras ficticias, errores con reintento de la consulta fallida, vacíos propios y recuperación de página sin resultados. Respuestas anteriores no sustituyen la selección vigente.
- Comparaciones de pago con el mes anterior: cero es distinto de «Sin base de comparación»; mayor gasto no se presenta como ahorro. Meses sin compras muestran cero.

## Interaction and layout

- Orden: cabecera/periodo → cuatro KPI → tendencia y distribución → tabla operativa → enlace histórico → proveedores y antigüedad.
- Hasta 1400px; KPI en una, dos o cuatro columnas; desde 1280px tendencia/distribución comparten fila con proporción 1.7:1. Contexto inferior en dos columnas desde 1024px. En móvil se apilan conservando el orden.
- Tabla de ancho mínimo 820px y SVG de ancho mínimo 560px dentro de regiones con scroll local y foco. Ejes de 16 unidades en viewBox de 720px conservan al menos 12px efectivos. «Ver datos de la gráfica» abre la tabla textual consultable con teclado.
- Header opaco adhesivo de 58px bajo 768px y 64px desde 768px; asides/foco añaden 16px de separación. Menús y diálogos quedan por encima. Áreas móviles mínimas 44×44px; sin scroll horizontal de página.
- Nueva ODC: validar y enfocar error → revisar snapshot y destino → confirmar una vez → mostrar folio/estado real. Cancelar o Escape conserva campos sin escribir. Envío fallido: reintentar solo el mismo id o abrir su detalle; creación incierta: informar sin éxito ni reenvío automático.

## Constraints and open decisions

- Aplicación en español; labels en sentence case y tracking normal en estas superficies. Inter, navy, radios, badges y temas vigentes se conservan.
- Contraste textual mínimo 4.5:1, foco visible, movimiento reducido y tema persistido desde el primer pintado sin divergencia de hidratación.
- Evidencia visual de composición: `.impeccable/review/desktop.png` y `mobile.png`; ajuste posterior de ejes a 16 unidades y validación del proveedor conservan la composición. La matriz y resultados de verificación se registran en la trazabilidad de #32.
- No quedan decisiones de dirección visual abiertas dentro de la spec aprobada. La idempotencia global y otros hallazgos de auditoría siguen fuera de alcance.
