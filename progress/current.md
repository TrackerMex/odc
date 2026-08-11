# Sesion cerrada — 2026-08-11

```
feature: ui-surfaces-dashboards
id: 25
inicio: 2026-08-11
cierre: 2026-08-11
plan: fases 3a + 3e del refactor visual — las 5 superficies de dashboard
      y odc-status-badge.tsx. Ver progress/ui-redesign-plan.md
estado: done — reviewer aprobo, delta posterior validado, R14 firmado
bloqueos: ninguno
spec_author: hecho -> specs/ui-surfaces-dashboards/ (15 requisitos)
gate humano: aprobado 2026-08-11, commiteado aparte en 1f4884b
implementer: hecho -> progress/impl_ui-surfaces-dashboards.md
reviewer:    hecho -> progress/review_ui-surfaces-dashboards.md
             APROBADO CON RESERVAS + delta aprobado
```

## Resultado

R1-R15 completos. `pnpm test` 472/472, `pnpm build` e `init.sh` en verde.
C4 limpio: ningun `feat(...)` toca un archivo de test, por segunda feature
consecutiva.

Verificado en pantalla (sesiones `DIRECTOR_OPS` y `ADMINISTRACION`, ambos temas):

- **D-V3 cerrado**: los CTA del header computan 32px y 28px, frente a los 36px de
  `size="lg"`.
- **R4**: header de 81px, `h1` a 24px, sin parrafo descriptivo.
- **R1/R2**: cuatro lecturas de badge coinciden caracter a caracter con sus pares
  de tokens. De rebote se confirmo que la correccion de gamut de la feature 24
  llega al render (chroma `0.012` y `0.011`, no los originales).
- **R11**: la tarjeta de alertas usa `--status-pending` en vez del ambar
  hardcodeado.
- **R7 SHALL NOT**: cero barras de acento en las dos tarjetas heterogeneas.

## Los cinco defectos del reviewer, todos cerrados

- **D1** — el fix `879624d` no dejaba guarda: `toContain('pb-3')` casaba igual con
  un `pb-3` inerte. Cerrado en `0299139` con una auditoria de fuente que usa
  `not.toMatch(/\bpb-3(?!!)/)`. El reviewer la valido **por mutacion**: quito el
  `!` con sed, vitest fallo, restauro.
- **D2** — el `pb-3!` sube la deuda de `!important` de 1 uso a 4. Aceptado por el
  humano; la **feature 26 hereda** arreglar la primitiva `CardHeader`, retirar los
  3 usos nuevos y resolver el `rounded-2xl!` de `toast.tsx:43`. Escrito en
  §"Encargo heredado por la 26" del plan.
- **D3, D4** — `progress/current.md` desactualizado, dos veces. Este bloque.
- **D5** — linea `Observacion: PENDIENTE` residual en el acta, contradiciendo al
  parrafo de encima. Corregida.

## Lo que este gate encontro y ningun test verde habria encontrado

1. **El ancho de consola no aguanta una lista de una columna.** `/tasks` con
   `max-w-[1400px]` dejaba 663px de hueco entre el importe y su boton de accion a
   un viewport de 1466px, y mas de 880px a ancho completo. El humano firmo la
   enmienda de `design-system/odc/pages/dashboard.md`: el ancho de consola aplica a
   **rejillas de colas**, y una **lista de una sola columna** usa `max-w-4xl`.
   Aplicado en `35edbe2` + `81ec0c3`. El hueco baja a 406px y **queda acotado**;
   no desaparece — cerrarlo del todo seria un cambio de layout de fila, no de
   ancho, y es trabajo de otra feature.
2. **Tres de las seis superficies no las monta ninguna ruta.** Confirmado por el
   reviewer: `OdcDashboard`, `AdminDashboard` y `GeneralDashboard` no tienen un
   solo importador de produccion, y `routes/_authenticated/index.tsx` renderiza
   `ExecutiveDashboard` para los tres roles sin ramificar. Las 7 barras de acento
   de R7 y los CTA de D-V3 **no llegan hoy a ningun usuario**. No es defecto del
   implementer sino de la fase de especificacion.

## Estado del entorno

- Rama `ui-design-system-docs` **mergeada a `main`** por el humano vía PR #12
  (`2dc2021`) al cerrar la sesion. El repo local quedo en `main`, arbol limpio.
  Los 26 commits del refactor estan dentro.
- Features 23, 24 y 25 `done`. **26-30 `pending`.**
- **La feature 30 `ui-dead-surfaces-audit` (P1) va antes que la 26 y la 27**:
  debe decidir si esas 3 superficies se montan o se borran, y comprobar si la 26
  y la 27 apuntan a mas codigo no montado antes de especificarse.
- Orden recomendado revisado: **30 → 26 → 28 → 27 → 29**.
- `pet-tracker-postgres` (otro proyecto) quedo **parado** para liberar el 5432 que
  necesitaba `odc-db-1`. Devolverlo con `docker start pet-tracker-postgres`.
- Para levantar el entorno: `docker compose up -d db backend` y
  `cd frontend && pnpm vite dev --port 3005 --host 127.0.0.1`. Ojo: reiniciar el
  backend con la DB caida le hace perder la red de compose (`ENOTFOUND db`); se
  arregla con `docker compose up -d`.
- Nota de navegador: puede haber mas de un Chrome conectado a la extension. Si
  `localhost` da `ERR_CONNECTION_REFUSED` no es la app — es que esta seleccionado
  el de otro equipo. `list_connected_browsers` + `select_browser` lo arreglan.
- **Sin verificar todavia: responsive a 375px.** Tiene feature propia, la 28.
