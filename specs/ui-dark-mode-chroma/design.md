---
feature: "ui-dark-mode-chroma"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, tokens, dark-mode]
---

# Diseño — [[ui-dark-mode-chroma]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

Todas las cifras de este documento salen de la misma matemática oklch→sRGB que ya
vive en `frontend/src/styles.tokens.test.ts`, ejecutada sobre los valores actuales
de `frontend/src/styles.css`. Son reproducibles; ninguna es una estimación.

## Decisiones técnicas

- **El bug es la métrica, no el número.** El chroma oklch es absoluto; la
  sensación de "cuánto color tiene esto" a una lightness dada se aproxima con
  `s = C / L`. Con esa métrica D-V1 deja de ser una opinión:

  | Token | L | C | s | % del light |
  |---|---|---|---|---|
  | `:root --primary` | 0.3462 | 0.0736 | **0.2126** | — |
  | `.dark --primary` | 0.7137 | 0.0692 | **0.0970** | **46%** |

  El dark tiene menos de la mitad de la saturación del light con casi el mismo
  chroma. Ningún test de contraste puede verlo: la luminancia no cambia. Por eso
  R1 y R2 se expresan sobre `s` y no sobre `C` (R1, R2).

- **El techo sale del navy, pero se congela.** R1 fija el techo en `s ≤ 0.2126`,
  constante documentada cuyo origen es la saturación del navy institucional
  (`0.0736 / 0.3462 = 0.21259`). Se lee como la Two-Color Rule del MASTER §9:
  *nada fuera de estado, `--destructive` y `--accent-action` puede saturar más
  que el navy institucional*. Se congela en vez de leerse del token en tiempo de
  test (decisión humana, 2026-08-11) porque un techo derivado es
  autorreferencial: exime al navy de su propio límite y se mueve solo si alguien
  le sube el chroma. Congelado, `:root --primary` queda sujeto al techo como
  cualquier otro token — con margen de `0.00001`, así que subirle el chroma
  rompe el test, que es justo lo que se quiere. En chroma, ese techo no es plano:

  | Lightness | Techo antiguo (plano) | Techo nuevo (`0.2126 · L`) |
  |---|---|---|
  | 0.18 (fondo dark) | 0.100 | **0.038** |
  | 0.35 (navy light) | 0.100 | **0.074** |
  | 0.55 | 0.100 | **0.117** |
  | 0.71 (primary dark) | 0.100 | **0.152** |
  | 0.98 (fondo light) | 0.100 | 0.209 (el gamut corta antes, en ~0.04) |

  Es **más estricto** que el plano por debajo de L≈0.47 y más laxo por encima,
  que es exactamente la corrección que pide D-V1. Los 6 tokens que hoy viven en
  la zona ahora más estricta pasan igualmente; el más ajustado es
  `.dark --background` / `.dark --primary-foreground` (`s = 0.1987`, el 93% del
  techo). Techo conocido y aceptado: un futuro fondo dark más cálido chocaría con
  la regla — es el comportamiento buscado, un casi-negro con chroma alto es un
  tinte fuerte (R1).

- **El suelo del 85% se aplica a dos tokens, y solo porque en esos dos es
  alcanzable.** No es una regla universal disfrazada de lista: el gamut de sRGB
  decide dónde puede aplicarse. `--primary` en dark necesita `C ≥ 0.1290` a
  `L = 0.7137` y el máximo en gamut ahí es `0.1519`: cabe. `--accent-action` en
  dark ya cumple (`s = 0.1929`, el 93% del claro), así que el suelo lo **fija**
  sin cambiarlo. En cambio (R2, y la sección Fuera de alcance):

  | Token dark | s dark | % del light | C que exigiría el 85% | C máx. en gamut | ¿alcanzable? |
  |---|---|---|---|---|---|
  | `--status-draft` | 0.027 | 32% | 0.0585 | 0.0908 | sí |
  | `--status-pending` | 0.106 | 40% | 0.1826 | 0.1112 | **no** |
  | `--status-budget` | 0.088 | 37% | 0.1663 | 0.0984 | **no** |
  | `--status-approved` | 0.157 | 40% | 0.2747 | 0.0897 | **no** |
  | `--status-paid` | 0.171 | 35% | 0.3426 | 0.0987 | **no** |
  | `--status-evidence` | 0.068 | 38% | 0.1255 | 0.1250 | **no** (por 0.0005) |
  | `--status-done` | 0.077 | 37% | 0.1439 | 0.1711 | sí |
  | `--status-rejected` | 0.157 | 42% | 0.2599 | 0.1010 | **no** |
  | `--destructive` | 0.265 | 71% | 0.3168 | 0.1870 | **no** (ya al 99.8% del gamut) |

  Aplicar el suelo a la familia de estado la partiría: solo `draft` y `done`
  podrían cumplirlo, y `done` pasaría a gritar más que sus 7 hermanos. Por eso la
  lista de R2 tiene exactamente dos nombres.

- **D-V2 se resuelve acotando la afirmación del MASTER, no igualando el hex.** La
  enmienda firmada de la 23 buscaba eliminar un verde casi-duplicado *de hue
  distinto* (163.23 vs 165.61) a lightness parecida. En `.dark` los dos tokens ya
  comparten hue exacto (165.61) y difieren en lightness porque **desempeñan
  papeles distintos**: `--accent-action` es una superficie de acción con texto
  oscuro encima (`L = 0.7227`), `--status-done` es texto de badge sobre una
  superficie oscura (`L = 0.82`, la lightness común de las 8 badges). Forzar un
  único valor obligaría a elegir entre sacar la badge de su familia o restarle
  peso al botón. Se conserva la identidad exacta en light (donde una sola
  lightness sirve para ambos papeles) y se exige hue compartido en los dos temas:
  siguen siendo un verde en dos papeles, no dos verdes (R7).

- **El chequeo de gamut cuesta tres líneas y arregla una mentira del test.** La
  conversión del test recorta cada canal a `[0,1]`; los navegadores hacen gamut
  mapping de CSS Color 4, que reduce chroma conservando L y H. Para 6 tokens
  declarados fuera de gamut, el color que audita el test **no es** el que pinta
  el navegador. El contraste real de esos 6 está entre 4.7 y 8.1, así que nada
  estaba mal en pantalla, pero la auditoría de R5 de la 23 no los cubría de
  verdad. Basta con reutilizar la conversión existente sin recortar y comprobar
  que los tres canales caen en `[0,1]` (R5).

- **La spec fija invariantes; los valores los propone este documento y los
  confirma un humano en pantalla.** R8 prohíbe explícitamente que el test fije un
  literal nuevo. Es la lección de las dos veces que este proyecto se equivocó por
  el mismo motivo: `#059669` fijado a ciegas (contradicción R2/R5 de la 23) y el
  techo de chroma fijado mirando solo light (D-V1) (R8, R9).

- **Todo el cambio vive en la hoja de estilos y en su test.** No hay `domain`,
  `application` ni `infrastructure` implicados; la regla de dependencia de
  `docs/architecture.md` no se ve afectada (R11).

## Valores propuestos — **pendientes de comprobación visual (R9)**

Ninguno de estos números es normativo. Son puntos de partida que satisfacen
R1–R6; el implementer elige uno y la sesión de navegador de R9 lo confirma o lo
mueve. Si se mueve, basta con que el valor final siga cumpliendo los invariantes:
no hay que tocar la spec.

### `.dark --primary` (y por R3, `--ring`, `--sidebar-primary`, `--sidebar-ring`)

Hue fijo en 254.62. Rango admisible por R1 + R2: `s ∈ [0.1807, 0.2126]`.

| # | Candidato | s | % del navy light | Contraste con `--primary-foreground` | % del gamut usado | Nota |
|---|---|---|---|---|---|---|
| A | `oklch(0.7137 0.1400 254.62)` | 0.1962 | 92% | 7.38 | 92% | Cambio mínimo: conserva la lightness actual, solo dobla el chroma |
| B | `oklch(0.6800 0.1400 254.62)` | 0.2059 | 97% | 6.50 | 81% | Un punto más oscuro y con más margen de gamut; lee más como botón |
| C | `oklch(0.6500 0.1380 254.62)` | 0.2123 | 100% | 5.79 | 73% | Paridad exacta con el navy claro; el más saturado de los tres |

Los tres cumplen R4 (`L` por encima de `.dark --card` = 0.2274 y de
`.dark --primary-foreground` = 0.1822) y los dos pares nuevos de R6 (`--primary`
sobre `--background`: 7.38 / 6.50 / 5.79; sobre `--card`: 6.70 / 5.90 / 5.25).
El actual, para comparar, es `oklch(0.7137 0.0692 254.62)` con `s = 0.0970`.

Recomendación de partida: **B**. A conserva más el estado actual pero deja el
token al 92% del gamut, sin sitio para afinar; C es el más vivo pero baja el
contraste a 5.79 y a esa lightness el azul empieza a competir con
`--status-approved`.

### Los 6 tokens fuera de gamut (R5)

Misma lightness, mismo hue, chroma bajado a ~95% del máximo en gamut:

| Token | Actual | Propuesto | Contraste con su par tras el cambio |
|---|---|---|---|
| `:root --status-pending-surface` | `oklch(0.9780 0.0140 49.00)` | `oklch(0.9780 0.0110 49.00)` | 4.70 |
| `:root --status-approved-surface` | `oklch(0.9740 0.0160 262.88)` | `oklch(0.9740 0.0110 262.88)` | 4.80 |
| `:root --status-paid-surface` | `oklch(0.9740 0.0180 292.58)` | `oklch(0.9740 0.0120 292.58)` | 6.57 |
| `.dark --status-approved` | `oklch(0.8200 0.1290 262.88)` | `oklch(0.8200 0.0850 262.88)` | 8.09 |
| `.dark --status-paid` | `oklch(0.8200 0.1400 292.58)` | `oklch(0.8200 0.0930 292.58)` | 8.02 |
| `.dark --status-rejected` | `oklch(0.8200 0.1290 27.33)` | `oklch(0.8200 0.0950 27.33)` | 7.97 |

Aviso para el implementer: los pares `pending` (4.70) y `approved` (4.80) en
light tienen menos del 7% de margen sobre el mínimo de 4.5. Cualquier retoque de
esas superficies obliga a volver a correr la auditoría de contraste antes de
commitear.

`--accent-action` y `--status-done` **no cambian** en ninguno de los dos temas:
el primero ya cumple el suelo de R2 y el segundo queda fuera de alcance por la
decisión de D-V2.

## Archivos afectados

Todos en la capa de presentación o en documentación; ninguna capa
domain/application/infrastructure implicada.

| Archivo | Qué cambia | Requisitos |
|---|---|---|
| `frontend/src/styles.css` | `.dark`: `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`; chroma de 6 tokens de estado fuera de gamut | R2–R5 |
| `frontend/src/styles.tokens.test.ts` | El bloque de chroma de R3 pasa a la métrica `s`; nuevos casos de suelo, alias, dirección de lightness, gamut, hue del verde y 2 pares de contraste | R1–R8 |
| `design-system/odc/MASTER.md` §1 | Acotación del verde compartido a tema claro + hue compartido en dark | R7 |
| `specs/ui-design-tokens/requirements.md` | **Solo** una fila en "Enmiendas posteriores a la aprobación" | R10 |
| `progress/verify_ui-dark-mode-chroma.md` | Nuevo: sesión de verificación en navegador | R9 |

Fuera de esta tabla no debe cambiar ningún archivo.

## Alternativas descartadas

- **Techo plano declarado por tema** (`0.10` en light, `0.16` en dark): resuelve
  D-V1 con menos matemática, pero los dos números serían inventados y el problema
  volvería en cuanto un token cambie de lightness dentro del mismo tema. El
  defecto no es que light y dark sean temas distintos, es que el mismo token vive
  a lightness distinta.
- **Chroma relativo al gamut** (`C / Cmax(L, H)`): conceptualmente la más limpia,
  y medible con una búsqueda binaria de ~10 líneas sobre la conversión que ya
  existe. Se descarta por los números: `:root --primary` usa el 62% del gamut
  disponible a su lightness y `.dark --primary` el 46%, así que un suelo del 85%
  en esa métrica pediría `C ≥ 0.080` — apenas por encima del 0.0692 actual. Sería
  un suelo que casi no corrige D-V1. La métrica `C/L` pide `C ≥ 0.129`, que es lo
  que el ojo reclamaba.
- **Exentar `--primary` del techo** (la opción más barata: añadir un nombre a la
  lista de exenciones de R3 de la 23): un token de identidad quedaría sin ninguna
  cota, ni por arriba ni por abajo, y el defecto que se está corrigiendo es
  precisamente la ausencia de cota por abajo.
- **Fijar el valor nuevo de `.dark --primary` en el requisito**: es el error que
  esta feature existe para no repetir. Los valores viven en este documento como
  candidatos y se confirman en pantalla (R8, R9).
- **Unificar el verde por hex también en dark** (la otra lectura defendible de
  D-V2): obliga a elegir entre sacar `--status-done` de la familia de badges
  (todas a `L = 0.82`) o rebajar `--accent-action` a texto de badge, perdiendo
  peso como superficie de acción. Se prefiere acotar la afirmación del MASTER,
  que es lo que estaba mal redactado.
- **Re-saturar los 8 estados de dark en esta feature**: 6 de los 8 no pueden
  alcanzar el suelo dentro de sRGB a `L = 0.82` (tabla arriba). Hacerlo bien
  exige rediseñar la lightness de la familia y re-auditar los 16 pares de estado.
- **Añadir `culori` / `colorjs.io`** para gamut y conversión: descartado en la 23
  por R15 y aquí por R11; el chequeo de gamut son tres líneas sobre la conversión
  que ya está escrita.
- **Verificar la saturación con un navegador headless en CI** en lugar del gate
  humano de R9: la máquina ya verifica los invariantes; lo que R9 aporta es
  justamente el juicio que ningún invariante captura. Automatizarlo sería
  reproducir el fallo que produjo esta feature.
