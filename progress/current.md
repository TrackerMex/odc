# Sesion activa — PAUSADA en el gate humano 2026-08-11

```
feature: ui-surfaces-dashboards
id: 25
inicio: 2026-08-11
plan: fases 3a + 3e del refactor visual — las 5 superficies de dashboard
      y odc-status-badge.tsx. Ver progress/ui-redesign-plan.md
estado: pending con spec escrita — BLOQUEADA en el gate humano
        (spec_ready exige aprobacion humana, ver AGENTS.md §3)
bloqueos: tres decisiones abiertas al humano (abajo)
spec_author: hecho -> specs/ui-surfaces-dashboards/ (15 requisitos)
implementer: —
reviewer: —
```

## Cerrado antes en esta misma sesion

Feature 24 `ui-dark-mode-chroma` **done** (commit `6520d59`). Reviewer aprobo con
reservas, todas bookkeeping del leader y todas cerradas. `.dark --primary` quedo en
`oklch(0.6800 0.1400 254.62)`, saturacion al 96.8% del navy claro frente al 46%
anterior: D-V1 resuelto y firmado por el humano en
`progress/verify_ui-dark-mode-chroma.md`.

Features **25-29 anadidas** a `feature_list.json` (commit `0e0953e`) con su alcance
escrito en §Como ejecutarlo del plan. Orden recomendado: 25 → 26 → 28 → 27 → 29.

## Para retomar: tres decisiones esperando respuesta humana

1. **`executive-tasks.tsx` a `max-w-[1400px]` (R3).** `pages/dashboard.md` lo lista
   entre sus 5 componentes y MASTER §3 prohibe su `max-w-5xl` (1024px) actual, pero
   es una lista de una sola columna y a 1400px las filas se estiran. El spec_author
   lo redacto como requisito porque la fuente normativa lo exige, con el riesgo
   anotado en `design.md` y la comprobacion en R14. Si no se sostiene en pantalla,
   la salida correcta es enmendar `pages/dashboard.md`, no saltarse el requisito.
2. **Barra de acento en las dos tarjetas heterogeneas.** Propuesta del spec_author:
   "Prioridad inmediata" de `executive-dashboard` y "Tareas accionables" de
   `executive-tasks` se quedan **sin** barra, porque mezclan estados y un solo color
   mentiria. Esta redactado como SHALL NOT en R7. Si el humano prefiere otra cosa,
   se cambia aqui.
3. **Re-saturacion de las 8 badges de dark.** R14 obliga a registrar la observacion
   en la sesion de navegador, no a ejecutar el cambio. El veredicto del humano ahi
   decide si las features 26/27 heredan una feature nueva o no.

Hasta que las tres se respondan y la casilla de
`specs/ui-surfaces-dashboards/requirements.md` (linea 306) este marcada por un
humano, **no se lanza el implementer**.

## Verificado por el leader antes de pausar

- Gate limpio: `status: draft` en los 4 archivos, linea 306 `- [ ] Aprobado por
  humano`, cero casillas marcadas. Verificado a mano, no por reporte del subagente.
- `git status` solo muestra `specs/ui-surfaces-dashboards/` como nuevo: el
  spec_author no toco codigo de aplicacion.
- **Los dos tests en riesgo que el plan no enumeraba son reales**, comprobados en el
  archivo: `executive-dashboard.test.tsx:143` exige que `header.textContent` siga
  casando `/operaciones/i` despues de que R4 borre el parrafo descriptivo, y
  `general-dashboard.test.tsx:88` exige `getAllByText('Direccion General')` con
  longitud **exactamente 2**, asi que el eyebrow de la tarjeta no se puede quitar.
  Ambos entran en la tabla de R12.

## Estado del entorno

- Rama `ui-design-system-docs`, **sin push**.
- Features 23 y 24 `done`. 25-29 `pending`.
- Dev server detenido. Para la verificacion visual:
  `cd frontend && pnpm vite dev --port 3005 --host 127.0.0.1`, backend y DB con
  `docker start odc-db-1 odc-backend-1` (puertos 3001 y 5432).
- Nota de navegador: puede haber mas de un Chrome conectado a la extension. Si
  `localhost` da `ERR_CONNECTION_REFUSED` no es la app — es que esta seleccionado el
  de otro equipo. `list_connected_browsers` + `select_browser` lo arreglan.
- **Sin verificar todavia: responsive a 375px.** Ya tiene feature propia, la 28.
