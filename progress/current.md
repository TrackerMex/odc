# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

```
feature: ui-surfaces-monthly-summary
id: 27
inicio: 2026-08-16
plan:
  - escribir pruebas R1-R10 antes del código
  - aplicar el rediseño mínimo en la superficie mensual
  - ejecutar build, tests, lint y validación visual
estado: in_progress
bloqueos: R9 requiere un mes con más de 10 compras para probar paginación; veredicto humano pendiente
spec_author: done
implementer: done
reviewer: pendiente
```

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
