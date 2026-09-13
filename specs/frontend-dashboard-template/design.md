---
feature: "frontend-dashboard-template"
status: draft
tags: [harness, spec, frontend, dashboard]
---

# Diseño — [[frontend-dashboard-template]]

> Ver [[requirements]] y [[../../docs/architecture|architecture]]. Propuesta: no habilita implementación.

## Decisiones técnicas

- **Adaptación selectiva (R1, R2, R4, R8):** referencia fijada en `shadcndashboard/shadcndashboard`, commit `6f99c0b04b7169f9ef12dc99946bc4faaeb40b9b`. Se toma la composición del shell y paneles, no su arquitectura React Router ni sus dependencias. Todo cambio queda en la capa de presentación del frontend; domain, application e infrastructure del backend no cambian.
- **Shell (R1, R7):** reutilizar `AppLayout`, `AppSidebar`, `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `ThemeToggle` y `NavUser`. Sidebar claro sobre token de superficie, activo navy; sidebar navy oscuro mediante tokens vigentes en dark. Ancho expandido 232px; conservar colapso a iconos y sheet móvil existentes. Encabezado 64px en escritorio y 58px en móvil, con breadcrumb derivado del `pathname` ya recibido y tema; sin fetch adicional para obtener el título. Añadir el enlace a `/tasks` para los tres roles. Enlaces raíz/subruta reales, detalle genérico mientras no haya folio disponible. Marco fino del área de trabajo en escritorio y márgenes reducidos en móvil. No cambiar preferencia inicial ni persistencia del tema.
- **Dashboard Modern (R2):** composición modular unida mediante bordes de 1px, fondo de superficie y jerarquía tipográfica. Encabezado breve; comparativa de gasto con dos barras a la izquierda y cuatro métricas a la derecha: compras del periodo, tareas pendientes, variación de compras y mayor antigüedad. Debajo, tabla «Prioridad inmediata» a dos tercios y proveedores/antigüedad en columna derecha desde 1280px; bajo ese ancho el contexto pasa debajo de la tabla. Secuencia constante panel → prioridad → proveedores → antigüedad tanto en DOM como en lectura visual. El orden de foco seguirá esa secuencia; no duplicar controles accesibles ni reordenar secciones solo mediante CSS.
- **Datos y barras (R3, R5):** mantener la consulta y contrato actuales. Formateadores de `lib/odc.ts`, `OdcStatusBadge` y mapas de acción existentes. Barras con CSS nativo; longitudes normalizadas al máximo del par o ranking y cero si el máximo es cero. Valores y meses visibles hacen que el color no sea el único portador de información. Las barras son una representación redundante de valores textuales, sin necesidad de interacción ni tooltip para leerlos.
- **Prioridad (R4):** reutilizar las primitivas `Table`; conservar scroll horizontal local en móvil con contenedor nombrado y accesible por teclado, sin perder contenido ni tabulación. No importar `SimpleBar`, sorting ornamental ni avatares. Mantener enlaces de folio y siguientes acciones autorizadas; no convertir navegación en ejecución de transiciones.
- **Estados (R6):** mantener exports y contratos de `ExecutiveDashboardLoading`/`ExecutiveDashboardError`; ajustar sus superficies a la nueva composición. La lógica de consulta, reintento y sesión sigue en las rutas existentes.
- **Comprobación (R7, R8):** ampliar tests existentes para comportamiento y datos límite. Usar navegador real para composición, foco, contraste, temas y dimensiones; registrar evidencia de ambos temas, los cuatro anchos y los tres roles. El mockup `preview.html` es documental, con datos ficticios explícitos, y no sustituye a la verificación de la aplicación.

## Procedencia de la plantilla

Se elige [Modern en oscuro](https://demos.shadcndashboard.dev/dashboards/modern?mode=dark) frente a Analytics/eCommerce por su composición modular y tabla orientada a operación. [Orders Table](https://demos.shadcndashboard.dev/react-tables/order-datatable?mode=dark) aporta referencia de densidad y filas. Estas demos Pro sirven únicamente de referencia visual: no se presupone acceso a su código. Solo el repositorio público MIT fijado arriba es fuente de código para adaptar.

| Archivo de origen | Adaptación prevista | Destino |
|---|---|---|
| `src/layouts/full/FullLayout.tsx` | Sidebar y área de trabajo enmarcada | `components/layout/app-layout.tsx` |
| `src/layouts/full/vertical/header/Header.tsx` | Cabecera útil, separadores, control de tema | `components/layout/app-layout.tsx` |
| `src/views/dashboards/modern/index.tsx` | Panel compuesto con divisores finos | `components/odc/executive-dashboard.tsx` |
| `src/components/dashboards/modern/projects-orders.tsx` | Tabla como superficie principal | `components/odc/executive-dashboard.tsx` |

Origen: [repositorio](https://github.com/shadcndashboard/shadcndashboard/tree/6f99c0b04b7169f9ef12dc99946bc4faaeb40b9b), licencia MIT, `Copyright (c) 2026 Shadcn Dashboard`. Si se copia código sustancial, incluir el aviso completo en `frontend/THIRD_PARTY_NOTICES.md` y señalar allí los archivos adaptados. No copiar activos de marca ni datos de ejemplo.

## Excepciones propuestas al diseño vigente

No se modifica `design-system/odc/MASTER.md` durante esta fase. Tras aprobación, registrar estas excepciones acotadas en `design-system/odc/pages/dashboard.md`:

1. **Panel dividido:** las métricas del dashboard comparten superficie, borde exterior y divisores; no necesitan tarjeta independiente ni sombra cada una (excepción local a MASTER §4). Tokens de radio, bordes finos y ausencia de sombras decorativas se conservan.
2. **Sentence case:** encabezados, labels y columnas del nuevo shell/dashboard usan mayúscula inicial y tracking normal (excepción local a MASTER §2 y al eyebrow de `pages/dashboard.md`). Inter, tamaños mínimos y cifras tabulares se conservan.
3. **Dos barras comparativas:** comparación categórica de dos importes mensuales, con valores visibles equivalentes; no representa una serie temporal ni necesita librería, tooltip o crecimiento inventado. Aclara MASTER §7 para esta representación redundante.
4. **Jerarquía:** R2 de esta feature determina el orden del nuevo dashboard; reemplaza únicamente las cláusulas visuales históricas indicadas en [[requirements]].

## Archivos afectados

- `frontend/src/components/layout/app-layout.tsx` y `app-sidebar.tsx` — presentación: shell y navegación.
- `frontend/src/components/odc/executive-dashboard.tsx` — presentación: composición, tabla, métricas y estados.
- `frontend/src/styles.css` — solo reglas de composición si las utilidades existentes no bastan; sin redefinir la paleta ni primitivas globales.
- Tests adyacentes del layout/dashboard y comprobaciones de frontend existentes — contratos, permisos y casos límite.
- `frontend/e2e/` — adaptar la comprobación visual ya existente, sin otro framework.
- `design-system/odc/pages/dashboard.md` — excepciones aprobadas; `frontend/THIRD_PARTY_NOTICES.md` solo si hay copia sustancial.
- `specs/frontend-dashboard-template/` y documentación de progreso/estado — especificación, evidencia y trazabilidad.

No se prevé cambiar primitivas compartidas, contratos de `lib/odc.ts`, archivos de rutas, paquetes ni archivos de aplicación fuera de esta lista. Revisar los consumidores antes de modificar cualquier archivo compartido.

## Alternativas descartadas

- Importar la plantilla completa: duplicaría router, tema, sidebar, iconos y componentes ya resueltos.
- Recharts o ApexCharts: dos barras y un ranking se resuelven con CSS y valores visibles.
- Reproducir ingresos, beneficios, avatares o notificaciones de la demo: el contrato de ODC no los proporciona.
- Cambiar todos los formularios durante el rediseño: amplía la feature sin mejorar el shell ni la lectura ejecutiva solicitada.
