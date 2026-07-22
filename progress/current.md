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
feature: frontend-odc-form
id: 10
inicio: 2026-07-22
plan:
  - implementar cliente API y utilidades ODC con TDD
  - implementar dashboard DIRECTOR_OPS
  - implementar creación, detalle, edición y reenvío
  - verificar, revisar y cerrar trazabilidad
estado: in_progress
bloqueos: —
spec_author: done
implementer: en curso
reviewer: pendiente
```

