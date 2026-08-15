# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

```
feature: ui-surfaces-monthly-summary
id: 27
inicio: 2026-08-15
plan:
  - spec_author investiga alcanzabilidad real de las superficies de resumen mensual
  - spec_author escribe specs/ui-surfaces-monthly-summary/ y deja la feature en spec_ready
  - gate humano: aprobar el checkbox en requirements.md (verificar a mano, no fiarse del agente)
  - implementer con TDD tras la aprobación
estado: pending
bloqueos: —
spec_author: en curso
implementer: pendiente
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
