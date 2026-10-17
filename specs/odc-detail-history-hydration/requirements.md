---
feature: "odc-detail-history-hydration"
status: approved
tags: [harness, spec]
---

# Requisitos — [[odc-detail-history-hydration]]

> Feature #40. Estabilidad del detalle de ODC después de mutaciones y durante SSR/hidratación.
> Notación EARS; R1..R7 son verificables e inmutables una vez aprobados.
> Ver [[design]] y [[../../docs/architecture|architecture]].

## Contexto y alcance

Las mutaciones guardan el historial pero retornan una ODC sin cargar sus filas; el detalle sustituye su estado con esa respuesta y muestra el historial vacío hasta recargar. El formato de instantes depende de la zona del proceso, por lo que SSR y navegador pueden producir texto diferente. Son dos defectos del mismo flujo de detalle y formulario de ODC, tratados en una sola feature.

## Requisitos funcionales

- **R1**: WHEN una creación o actualización de ODC termina correctamente mediante el repositorio compartido THE SYSTEM SHALL devolver la ODC con su historial persistido completo, incluidos identificadores, actor, nota y fecha persistidos y cualquier transición recién guardada, ordenado cronológicamente igual que la consulta de detalle. WHEN la actualización no genera una transición THE SYSTEM SHALL conservar el historial existente sin agregar eventos ni duplicarlos.
- **R2**: WHEN un usuario autorizado sube correctamente un comprobante de pago o una factura desde el detalle THE SYSTEM SHALL actualizar el documento y estado de la ODC y mantener visibles todos sus eventos previos junto con la transición realmente persistida, sin recarga manual ni una segunda consulta de detalle necesaria para completar la operación. WHILE la subida falla THE SYSTEM SHALL conservar el historial previamente visible y mostrar el manejo de error existente, sin anunciar una transición no confirmada.
- **R3**: WHEN una mutación guarda la ODC, su transición y, si corresponde, la asociación del ticket de archivo THE SYSTEM SHALL obtener el historial de respuesta dentro de la misma transacción y mantener el control de versión/estado y las garantías actuales de atomicidad. IF existe conflicto concurrente o falla la escritura o lectura transaccional necesaria para formar la respuesta THEN THE SYSTEM SHALL abortar la transacción y aplicar el error y recuperación de archivos existentes, sin confirmar parcialmente ODC, historial o ticket ni borrar un archivo ya asociado por una transacción confirmada.
- **R4**: WHEN la interfaz de ODC presenta un instante persistido de creación, actualización o historial THE SYSTEM SHALL usar el idioma `es-MX` y la zona explícita `America/Mexico_City`, produciendo el mismo texto para el mismo instante durante SSR y la primera hidratación aunque la zona predeterminada del servidor y navegador difiera, incluidos instantes cercanos a medianoche. WHEN el instante es nulo THE SYSTEM SHALL conservar el texto `Pendiente`.
- **R5**: WHEN el detalle presenta una fecha de calendario de pago, factura o entrada a almacén THE SYSTEM SHALL conservar el día calendario recibido independientemente de la zona del entorno, sin convertirlo al día anterior o siguiente al aplicar R4. WHEN la fecha es nula THE SYSTEM SHALL conservar el texto `Pendiente`.
- **R6**: WHEN se renderiza el formulario de creación de ODC sin una fecha de creación persistida THE SYSTEM SHALL presentar `Pendiente` como fecha de creación durante SSR, hidratación y edición hasta recibir una ODC persistida. WHEN la persistencia devuelve una ODC THE SYSTEM SHALL presentar su fecha de creación real con la regla R4, sin calcular una fecha de creación mediante el reloj de render del servidor o navegador.
- **R7**: WHEN se hidrata el detalle o formulario de ODC a partir del mismo estado serializado en entornos con zonas y relojes diferentes THE SYSTEM SHALL conservar el marcado inicial de fechas sin errores recuperables de hidratación y mantener operativos los campos, la validación y las acciones del formulario después de hidratar, sin suprimir advertencias ni desactivar SSR.

## Criterios de verificación

- Regresión del repositorio con respuestas reales de creación, actualización con transición y edición sin transición; comprobar metadatos persistidos y ausencia de eventos añadidos.
- Regresión de ambos endpoints de subida y del estado del detalle usando el contrato real de respuesta, sin que un mock con historial prefabricado o una recarga oculte el defecto.
- Prueba PostgreSQL aislada del historial retornado y de rollback ante fallos; mantener verificaciones de concurrencia y recuperación de archivos de #36/#38.
- `renderToString` bajo UTC e hidratación con `hydrateRoot` bajo una zona diferente (incluida `America/Mexico_City`), capturando `onRecoverableError`; verificar que esté vacío. Usar instantes que cambien de día entre zonas y relojes a ambos lados de medianoche para R6/R7.
- Verificar texto visible de creación, actualización, eventos y fechas calendario, así como interacción del formulario tras hidratación; no limitarse a probar helpers.
- Tests con R-ids en sus nombres, build y suite sin regresiones mediante `./init.sh` antes del cierre; seguir [[../../docs/verification|verification]].

## Fuera de alcance

- Nuevas transiciones, eventos de auditoría o cambios a permisos, DTOs públicos, esquema de base de datos o ciclo de archivos.
- Cambiar las reglas de negocio o la zona de reportes, filtros ejecutivos o tareas, que ya usan la convención de México.
- Rediseño visual, nuevas preferencias de zona por usuario, cambios de almacenamiento de instantes o conversión de fechas calendario a instantes.
- Ampliar el trabajo al sistema de notificaciones: se carga después del montaje y no requiere otro flujo de SSR para esta corrección.

## Aprobación

- [x] Aprobado por humano en conversación (fecha: 2026-10-17). «Apruebo la especificación; implementa ambas correcciones».
