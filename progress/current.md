# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Sesión en curso

```
feature: auth-users
id: 2
inicio: 2026-07-19
plan:
  - spec_author escribe specs/auth-users/requirements.md (EARS)
  - PARA hasta aprobación humana (checkbox en requirements.md)
estado: spec_ready
bloqueos: gate humano — falta [x] Aprobado por humano en specs/auth-users/requirements.md
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
