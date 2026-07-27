---
feature: "role-based-executive-dashboard"
status: approved
tags: [harness, spec, dashboard, roles]
---

# Requisitos — [[role-based-executive-dashboard]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

## Requisitos funcionales

- **R1**: WHEN un usuario autenticado con rol `DIRECTOR_OPS`, `ADMINISTRACION` o `DIRECTOR_GENERAL` abre `/`, THE SYSTEM SHALL cargar un único resumen ejecutivo del mes solicitado que contenga sus tareas accionables, el pulso mensual global, las órdenes activas con mayor antigüedad y el ranking de proveedores; para cualquier otro rol SHALL mantener el estado de rol no disponible existente.

- **R2**: WHEN el resumen ejecutivo se calcula para un rol, THE SYSTEM SHALL devolver exclusivamente las tareas cuyo siguiente paso está autorizado para ese rol: `DIRECTOR_OPS` verá sus propios `BORRADOR` y `RECHAZADA`, más `COMPRA_APROBADA` y `EVIDENCIA_PAGO_SUBIDA`; `ADMINISTRACION` verá `PENDIENTE_ADMIN` y `PAGO_REGISTRADO`; `DIRECTOR_GENERAL` verá `PRESUPUESTO_APROBADO`. Las tareas `BORRADOR` y `RECHAZADA` SHALL pertenecer al usuario autenticado; ninguna otra etapa SHALL aparecer como tarea de acción.

- **R3**: WHEN existen tareas accionables, THE SYSTEM SHALL mostrar una franja de prioridad antes de las métricas secundarias con como máximo cinco tareas, ordenadas por antigüedad descendente y, en empate, por fecha de creación ascendente. Cada tarea SHALL incluir número de ODC, estado, descripción, proveedor, importe en centavos, antigüedad en días completos desde `createdAt` y el nombre de su siguiente acción. La franja SHALL indicar el total de tareas cuando exceda cinco y enlazar cada tarea a su flujo existente.

- **R4**: WHEN `DIRECTOR_OPS` usa la franja de prioridad, THE SYSTEM SHALL ofrecer una acción visible para crear una ODC y accesos al flujo existente para registrar pago (`COMPRA_APROBADA`), completar factura (`EVIDENCIA_PAGO_SUBIDA`) y reabrir/editar los `BORRADOR` o `RECHAZADA` propios. WHILE una tarea no corresponda a una transición autorizada para el rol autenticado, THE SYSTEM SHALL no mostrar una acción de ejecución para esa tarea.

- **R5**: WHEN se solicita el resumen con un mes válido `YYYY-MM`, THE SYSTEM SHALL calcular el pulso del periodo usando exclusivamente ODC con `paymentDate` dentro del mes y estado `PAGO_REGISTRADO`, `EVIDENCIA_PAGO_SUBIDA` o `COMPLETADA`, y SHALL devolver para el mes solicitado y el inmediatamente anterior el número de compras y el importe total en centavos. THE SYSTEM SHALL devolver la variación porcentual de cada métrica respecto al mes anterior como `null` cuando el valor anterior sea cero.

- **R6**: WHEN el resumen ejecutivo incluye antigüedad operativa, THE SYSTEM SHALL devolver hasta cinco ODC públicas más antiguas con estado `PENDIENTE_ADMIN`, `PRESUPUESTO_APROBADO`, `COMPRA_APROBADA`, `PAGO_REGISTRADO` o `EVIDENCIA_PAGO_SUBIDA`, ordenadas por `createdAt` ascendente y calculando sus días completos desde `createdAt`. THE SYSTEM SHALL excluir `BORRADOR`, `RECHAZADA` y `COMPLETADA` de este indicador global.

- **R7**: WHEN el resumen ejecutivo incluye proveedores, THE SYSTEM SHALL devolver hasta cinco proveedores del mes solicitado, agrupados sobre el mismo conjunto de compras pagadas de R5, con número de compras e importe total en centavos, ordenados por importe descendente y nombre ascendente en caso de empate. WHILE no existan compras pagadas en el mes, THE SYSTEM SHALL devolver una lista vacía y la interfaz SHALL comunicar que no hay datos del periodo.

- **R8**: WHEN la interfaz carga el resumen, THE SYSTEM SHALL exponer un estado de carga accesible (`aria-busy`) sin presentar métricas simuladas. IF la carga del resumen falla, THEN THE SYSTEM SHALL mostrar un error recuperable con una acción para reintentar. WHILE el resumen no contenga tareas accionables, THE SYSTEM SHALL comunicar explícitamente que no hay pendientes para el rol sin ocultar el pulso y los indicadores globales disponibles.

- **R9**: WHEN la vista se muestra en pantalla de escritorio, THE SYSTEM SHALL colocar la prioridad y el pulso del periodo en el primer nivel visual; WHEN se muestra con ancho menor a `640px`, THE SYSTEM SHALL presentar la prioridad y su siguiente acción antes de las métricas, sin recorte horizontal de contenido. THE SYSTEM SHALL conservar foco visible, etiquetas accesibles para secciones y enlaces, y SHALL respetar `prefers-reduced-motion` para cualquier transición de carga o actualización.

- **R10**: WHEN el endpoint del resumen ejecutivo recibe una solicitud autenticada, THE SYSTEM SHALL aplicar la identidad y el rol de la sesión al cálculo de tareas y SHALL no aceptar un identificador de usuario o rol desde el cliente. IF una solicitud no está autenticada, THEN THE SYSTEM SHALL conservar la respuesta `401` del guard global; IF el rol no es uno de los tres roles de negocio, THEN THE SYSTEM SHALL no exponer el resumen ni datos agregados.

- **R11**: WHEN el backend construye el resumen ejecutivo, THE SYSTEM SHALL obtener las tareas priorizadas, los totales mensuales, las órdenes activas antiguas y los proveedores mediante consultas acotadas y agregadas en el repositorio, sin una consulta por ODC ni por proveedor.

- **R12**: WHEN un usuario de negocio selecciona “Ver todas las tareas” desde la franja de prioridad, THE SYSTEM SHALL mostrar una vista paginada con exclusivamente todas sus tareas accionables, ordenadas por antigüedad descendente y fecha de creación ascendente, conservando para cada una el contexto y siguiente acción definidos en R3-R4; la interfaz SHALL enlazar de vuelta a la bandeja de trabajo y no mostrará la vista cuando no existan tareas adicionales.

## Fuera de alcance

- Presupuesto contra gasto, objetivos de gasto, pronósticos o métricas no respaldadas por datos persistidos.
- Cambiar reglas de transición, permisos de detalle o los flujos de pago, evidencia, factura, edición y aprobación existentes.
- Mezclar tareas de otros roles en la prioridad de un usuario, asignación individual adicional o notificaciones.
- Un rediseño de marca, gráficos decorativos, o cambios al lenguaje visual global fuera de la ruta autenticada y sus dashboards.
- Cambiar la página independiente de resumen mensual o permitir su exportación a roles que hoy no tienen acceso.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-27; extensión R12 autorizada en conversación)
