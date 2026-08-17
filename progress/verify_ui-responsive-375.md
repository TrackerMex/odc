# Verificación en navegador — ui-responsive-375

> Acta de la feature 28 (`specs/ui-responsive-375`). Es el entregable principal:
> R1, R3, R7 y R8 solo se pueden observar en un navegador real. Las medidas de
> este documento se tomaron con el instrumento declarado en la sección 0 y
> ninguna observación es válida sin esa cabecera.

## 0. Gate de medición

Instrumento: **Playwright (chromium) con `page.setViewportSize({ width: 375, height: 667 })`**,
ejecutado desde `frontend/e2e/responsive-375.spec.ts` contra el stack completo de
`docker-compose` (frontend `:3000`, backend `:3001`, Postgres `:5432`).
`resize_window` queda descartado como método único (R1): es el instrumento que
falló en silencio el 2026-08-10.

Fecha de la sesión: 2026-08-17.

| # | Lectura | Valor medido | Exigido por R1 |
|---|---|---|---|
| 1 | `window.innerWidth` | `375` | `375` exacto — cumple |
| 2 | `document.documentElement.clientWidth` | `375` | solo registrar — registrado |
| 3 | `window.devicePixelRatio` | `1` | solo registrar — registrado |
| 4 | `window.matchMedia('(min-width: 40rem)').matches` | `false` | `false` — cumple |
| 5 | `window.matchMedia('(min-width: 48rem)').matches` | `false` | `false` — cumple |

Salida literal de la sesión:

```
R1 gate: {"innerWidth":375,"clientWidth":375,"devicePixelRatio":1,"sm":false,"md":false}
```

`devicePixelRatio` es `1` porque chromium headless no emula la densidad de un
teléfono. R1 solo exige registrarlo: el layout de Tailwind se decide en píxeles
CSS, que son los que leen las lecturas 1, 2, 4 y 5. Las lecturas 4 y 5 son el
gate real y ambas están apagadas, así que a 375px la app aplica únicamente las
clases base, sin prefijo `sm:` ni `md:`.

## 1. /login

PENDIENTE

## 2. / (portada ejecutiva)

PENDIENTE

## 3. /tasks

PENDIENTE

## 4. /odcs/new

PENDIENTE

## 5. /odcs/$id

PENDIENTE

## 6. /monthly-summary

PENDIENTE

## 7. Área táctil

PENDIENTE

## 8. Veredicto humano

PENDIENTE
