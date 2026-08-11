# Sesion cerrada — 2026-08-11

```
feature: ui-dark-mode-chroma
id: 24
inicio: 2026-08-10
cierre: 2026-08-11
plan: corregir el techo de chroma de dark (D-V1) y resolver el verde
      desalineado en dark (D-V2). Origen: revision en navegador del
      resultado de la #23, en progress/ui-redesign-plan.md
estado: done — reviewer APROBADO CON RESERVAS, reservas cerradas por el leader
bloqueos: ninguno
spec_author: hecho -> specs/ui-dark-mode-chroma/requirements.md (11 requisitos)
implementer: hecho -> progress/impl_ui-dark-mode-chroma.md
reviewer:    hecho -> progress/review_ui-dark-mode-chroma.md
```

## Que se hizo

Las dos preguntas que bloqueaban el gate se respondieron el 2026-08-11:

1. **Techo de chroma autorreferencial** → **congelado `0.2126` como constante
   documentada**. El navy queda sujeto al techo como cualquier otro token no
   exento (margen `0.00001`: subirle el chroma rompe el test). Aplicado a R1 de
   `requirements.md`, al bloque del techo en `design.md` y al titulo de R1 en
   `tasks.md`.
2. **Enmienda en `specs/ui-design-tokens/requirements.md`** → **autorizada**,
   limitada a anadir la fila. El reviewer verifico que `4be24a0` la toca con
   `1 insertion(+)` y cero borrados: las casillas de aprobacion de la 23 intactas.

Humano marco el gate y el implementer entrego R1-R8, R10 y R11 en 7 commits
(`8ab92a2`..`d6b39a0`). R9 lo cerro el leader con el humano.

## Resultado medido

- `.dark --primary` = `oklch(0.6800 0.1400 254.62)`, `s = 0.20588`, el **96.8%**
  de la saturacion del navy claro. Antes era el 46%: D-V1 resuelto.
  `--ring`, `--sidebar-primary` y `--sidebar-ring` lo siguen.
- Los 6 tokens fuera de gamut sRGB, corregidos conservando lightness y hue.
- `pnpm test` 353/353, `pnpm build` y `./init.sh` en verde.
- C4 deja de fallar: ningun `feat(...)` toca un `*.test.ts`. Es la primera vez en
  este repo tras 3 rechazos seguidos por ese motivo.

## Reservas del reviewer y que se hizo con ellas

- **D1 casilla del gate con fecha `11/10/2026`** → corregida a `2026-08-11` con
  nota del leader explicando que solo cambia el formato, no la aprobacion.
- **D2 el `status: approved` y la casilla aterrizan en `d6b39a0`**, commit del
  implementer y posterior a los seis de implementacion, asi que desde git solo no
  se distingue quien marco la casilla. **No se puede arreglar retroactivamente sin
  reescribir historial, y no compensa.** El rastro esta aqui y en el review. Para
  la proxima feature: el leader commitea el gate aprobado *antes* de lanzar al
  implementer, en su propio commit.
- **D3 "cambio visible esperado: ninguno"** es inexacto para los 3 textos de dark:
  el delta real llega a 16/255 en un canal para `.dark --status-approved`. Medido
  con `canvas.getImageData`, anotado en la §3 de
  `progress/verify_ui-dark-mode-chroma.md`, y el humano firmo con ese dato
  delante. No incumple ningun SHALL.
- **D4 bookkeeping sin commitear** → cerrado con este commit.

## Estado del entorno

- Rama `ui-design-system-docs`, **sin push**.
- Feature 23 y 24 `done`, ambas revisadas en navegador.
- Fases 3a-3e pendientes como features 25-27, todavia **sin anadir a
  `feature_list.json`**: dashboards, detalle, formularios, resumen mensual y
  `odc-status-badge.tsx`. Ahi viven D-V3 (los CTA con `size="lg"`) y D-V4 (el
  anidamiento de cajas de `odc-detail.tsx`).
- **Sin verificar todavia: responsive a 375px.** Sigue pendiente en el checklist
  de `MASTER.md` §10.
- Nota de infraestructura para la proxima sesion de navegador: puede haber mas de
  un Chrome conectado a la extension. Si `localhost` da `ERR_CONNECTION_REFUSED`,
  no es la app — es que esta seleccionado el navegador de otro equipo.
  `list_connected_browsers` y `select_browser` lo resuelven.
- Re-saturar la familia de las 8 badges de dark sigue fuera de alcance y sin
  feature asignada: 6 de las 8 no alcanzan el suelo del 85% dentro de sRGB a su
  lightness actual, hace falta bajarles la lightness y re-auditar 16 pares.
