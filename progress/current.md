# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

```
feature: odc-purchase-approval
id: 5
inicio: 2026-07-20
plan:
  - spec_author (R1-R7, T5 endpoint nuevo + T6 amplia roles en /reject)
  - aprobacion humana del checkbox en requirements.md
  - implementer TDD por requisito
  - reviewer
estado: spec_ready
bloqueos: esperando aprobacion humana del checkbox en specs/odc-purchase-approval/requirements.md
spec_author: done
implementer: pendiente
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
