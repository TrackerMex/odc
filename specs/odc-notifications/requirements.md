---
feature: "odc-notifications"
status: approved
tags: [harness, spec, notifications, frontend, backend]
---

# Requisitos — [[odc-notifications]]

> El usuario solicitó el 2026-09-13 validar y construir una solución profesional de notificaciones para creación y cambios de estado de ODC en los tres roles. Ver [[design]], [[tasks]] y [[../../docs/architecture|architecture]].

## Requisitos funcionales

- **R1**: WHEN se crea una ODC o cambia su estado, THE SYSTEM SHALL exponer una notificación basada en la fila de historial ya persistida con folio, estado destino, autor y fecha, sin duplicar el evento en otra tabla. Editar campos sin cambiar el estado SHALL no generar una notificación nueva.
- **R2**: WHEN un usuario consulta notificaciones, THE SYSTEM SHALL aplicar la visibilidad vigente: un evento `BORRADOR` solo es visible para quien creó la ODC; los eventos posteriores son visibles para `DIRECTOR_OPS`, `ADMINISTRACION` y `DIRECTOR_GENERAL`. El endpoint SHALL requerir sesión y no aceptará identidad o rol desde el cliente.
- **R3**: WHEN se obtiene el feed, THE SYSTEM SHALL devolver hasta 20 eventos recientes ordenados por `createdAt DESC, id DESC`, el conteo exacto de no leídos y `isRead` por evento. El estado leído SHALL persistirse por usuario; «Marcar todas como leídas» SHALL afectar únicamente al usuario autenticado.
- **R4**: WHEN se muestra el shell autenticado, THE SYSTEM SHALL incluir un control de campana etiquetado, badge de no leídas y panel accesible con encabezado, acción de lectura, estados de carga/error/vacío y enlaces al detalle de cada ODC. Cada fila SHALL distinguir creación y transición, mostrar actor, folio, estado y tiempo, sin depender solo del color.
- **R5**: WHEN una mutación de ODC termina correctamente, se abre el panel, vuelve el foco a la ventana o transcurren 30 segundos, THE SYSTEM SHALL actualizar el feed sin recargar la página. Una petición fallida SHALL conservar el shell operativo y permitir reintento; no se implementará WebSocket para este volumen.
- **R6**: WHEN se verifica en los tres roles, temas claro/oscuro y móvil/escritorio, THE SYSTEM SHALL conservar permisos, foco visible, navegación SPA, objetivo táctil de 44px en móvil, contraste y ausencia de desbordamiento. La implementación SHALL reutilizar historial, sesión, Base UI/shadcn, Lucide y `apiFetch`, sin dependencias nuevas.

## Fuera de alcance

- Correo, push del sistema operativo, preferencias por tipo, eliminación, paginación histórica o WebSockets.
- Notificar ediciones de contenido que no cambien el estado.
- Cambiar el flujo, estados o permisos de las ODC.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-09-13; instrucción explícita en chat: «valida tu mismo y crea una solución que sea profesional»).
