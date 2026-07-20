# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Sesión en curso

```
feature: odc-budget-validation
id: 4
inicio: 2026-07-20
plan:
  - spec_author escribe specs/odc-budget-validation/ (requirements, design, tasks, traceability)
  - PARA hasta aprobación humana de la spec
estado: in_progress — spec aprobada por humano 2026-07-20
bloqueos: —
spec_author: done
implementer: en curso
reviewer: pendiente
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
