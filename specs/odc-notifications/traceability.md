---
feature: "odc-notifications"
status: implemented
tags: [harness, spec, traceability]
---

# Trazabilidad — [[odc-notifications]]

| Requisito | Test | Commit |
|---|---|---|
| R1-R3 | `notifications.usecases.spec.ts::R1-R3`, `notification.typeorm.repository.spec.ts::R1-R3`, `user.orm-entity.spec.ts` — fuente, visibilidad SQL, orden, límite, conteo y corte por usuario | rojo `0e3cc9f` → `56e6002` |
| R4-R6 | `notification-center.test.tsx::R4-R6`, `api.test.ts::R5`, `app-layout.test.tsx` — badge, feed, errores, lectura, evento de mutación e integración | rojo `0e3cc9f` → `56e6002` |

Regla: no marcar `done` con filas pendientes.

Verificación real: `GET /api/notifications` respondió para los tres roles con máximo 20 filas; Administración y Dirección General no recibieron eventos `BORRADOR`. El navegador mostró contador, actores, estados, tiempos, scroll y enlaces en el header oscuro. `./init.sh`: 489 backend / 661 frontend.
