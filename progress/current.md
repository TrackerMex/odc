# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Sesión en curso

```
feature: odc-create-draft
id: 3
inicio: 2026-07-19
plan:
  - spec_author escribe specs/odc-create-draft/ (requirements, design, tasks, traceability)
  - PARA hasta aprobación humana de la spec
estado: spec_ready — esperando aprobación humana de la spec
bloqueos: gate humano — falta [x] Aprobado por humano en specs/odc-create-draft/requirements.md
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
