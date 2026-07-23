# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Plantilla (sesión sin iniciar)

```
feature: —
inicio: —
agentes lanzados: —
estado: sin sesión activa
```

---

_Cuando inicies una sesión, reemplaza la plantilla con:_

```
feature: <nombre de la feature>
id: <id en feature_list.json>
inicio: <fecha y hora>
plan:
  - <paso 1>
  - <paso 2>
estado: pending / spec_ready / in_progress / done
bloqueos: —
spec_author: pendiente / en curso / done
implementer: pendiente / en curso / done
reviewer: pendiente / en curso / aprobado / rechazado
```

---

## Sesión activa

```
feature: frontend-general-approval
id: 12
inicio: 2026-07-23 10:55:52 -06:00
plan:
  - spec_author redacta requirements, design, tasks y traceability
  - revisar que la spec quede en spec_ready sin autoaprobar el gate humano
  - implementer ejecuta TDD para R1-R10 y completa trazabilidad
  - reviewer valida C2-C6 y el cierre de la feature
estado: in_progress
bloqueos: —
spec_author: done
implementer: en curso
reviewer: pendiente
gate humano: aprobado por el usuario el 2026-07-23
```
