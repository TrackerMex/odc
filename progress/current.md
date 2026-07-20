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
estado: in_progress
bloqueos: reviewer rechazo — odc.controller.spec.ts sobrescribio 2 describe blocks de R4/R5 de feature 4 (odc-budget-validation), rompiendo su traceability.md
spec_author: done
implementer: en curso (fix de regresion)
reviewer: rechazado, esperando fix
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
