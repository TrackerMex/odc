---
feature: "odc-notifications"
status: approved
tags: [harness, spec, design]
---

# Diseño — [[odc-notifications]]

## Decisión

`odc_status_history` es la fuente de eventos: ya se escribe en la misma transacción que cada creación o transición. Una columna nullable `users.notificationsReadAt` guarda el corte de lectura por usuario. No se crea una segunda tabla de eventos.

Un módulo `notifications` consulta historial unido con ODC, autor y usuario autenticado. El repositorio aplica visibilidad, orden y conteo; los casos de uso solo coordinan listar y marcar leído. `GET /api/notifications` devuelve 20 filas y `POST /api/notifications/read` actualiza el corte del usuario de sesión.

El encabezado monta un `NotificationCenter` con el menú existente. Consulta al montar, al abrir, al recuperar foco, cada 30 segundos y tras el evento local emitido por una mutación ODC exitosa. El panel mantiene un solo nivel, enlaces al detalle y mensajes en español.

## Seguridad y consistencia

- El servidor toma `userId` y `role` del JWT; no hay parámetros de identidad.
- Los borradores ajenos se excluyen en SQL.
- Marcar leído actualiza solo la fila del usuario autenticado.
- El historial evita notificaciones fantasma si una transición falla.
