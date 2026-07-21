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
feature: odc-suppliers-catalog
id: 14
inicio: 2026-07-21
plan:
  - Módulo nuevo backend/src/modules/suppliers (domain/application/infrastructure)
  - Entidad Supplier, SupplierRepository, seed de 22 proveedores, GET /api/suppliers
  - Validación cruzada en odc: create-draft/update-draft rechazan supplier desconocido (UnknownSupplierError -> 400)
estado: in_progress
bloqueos: —
spec_author: done (specs/odc-suppliers-catalog/, aprobada por humano)
implementer: en curso
reviewer: pendiente
```

