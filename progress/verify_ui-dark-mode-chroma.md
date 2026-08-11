# Verificación en navegador — ui-dark-mode-chroma (feature 24)

> Gate de R9. Este archivo **no lo rellena el implementer**: sus valores se copian
> en vivo de un navegador real con la app corriendo y el conmutador de tema de
> `lib/theme.tsx`, y el veredicto lo firma un humano. El implementer solo deja el
> esqueleto para que el test de existencia esté verde y las secciones no se
> inventen.
>
> Razón de ser del gate: los tests de esta feature verifican **invariantes**, y la
> feature existe precisamente porque un invariante verde puede seguir viéndose
> mal. Si este archivo queda con secciones PENDIENTE o su veredicto es negativo,
> el reviewer **no** aprueba el cierre aunque `pnpm test` y `pnpm build` estén en
> verde.
>
> Cómo levantar el entorno: `cd frontend && pnpm vite dev --port 3005`
> (backend en contenedor, puerto 3001).

Valores implementados a verificar (de `frontend/src/styles.css`):

- `.dark --primary` = candidato B de `design.md`, `oklch(0.6800 0.1400 254.62)`.
  `s = 0.2059`, el 97% del navy claro. `--ring`, `--sidebar-primary` y
  `--sidebar-ring` comparten el valor.
- 6 tokens de estado reajustados dentro del gamut sRGB conservando lightness y
  hue. Cambio visible esperado: **ninguno**.

## 1. getComputedStyle en los dos temas

Sesión del **2026-08-11**, Chrome real, app en `http://localhost:3005`, backend y
DB en contenedor. Tema conmutado con el botón de `ThemeToggle` de `lib/theme.tsx`,
no manipulando la clase a mano. Valores leídos con
`getComputedStyle(document.documentElement).getPropertyValue(...)`.

| Token | Tema | `getComputedStyle` | `s = C/L` |
|---|---|---|---|
| `--primary` | light | `oklch(0.3462 0.0736 256.04)` | 0.21259 |
| `--primary` | dark | `oklch(0.6800 0.1400 254.62)` | 0.20588 |
| `--ring` | light | `oklch(0.3462 0.0736 256.04)` | 0.21259 |
| `--ring` | dark | `oklch(0.6800 0.1400 254.62)` | 0.20588 |
| `--accent-action` | light | `oklch(0.5081 0.1049 165.61)` | 0.20645 |
| `--accent-action` | dark | `oklch(0.7227 0.1394 165.61)` | 0.19289 |
| `--status-done` | light | `oklch(0.5081 0.1049 165.61)` | 0.20645 |
| `--status-done` | dark | `oklch(0.8200 0.0630 165.61)` | 0.07683 |

Contexto leído en la misma sesión para poder juzgar R4: `.dark --card` =
`oklch(0.2274 0.0338 264.66)`, `.dark --primary-foreground` =
`oklch(0.1822 0.0362 265.75)`, `.dark --background` = `oklch(0.1822 0.0362 265.75)`.

Invariantes comprobados contra estos valores en vivo:

- **R1**: `s(:root --primary)` = 0.21259 ≤ techo congelado 0.2126. Margen 0.00001,
  el navy queda sujeto al techo, que es lo que pedía la decisión humana.
- **R2**: `s(.dark --primary)` = 0.20588, el **96.8%** del claro — antes era el 46%.
  Suelo del 85% = 0.18070. Cumple con holgura. `--accent-action` en dark = 0.19289
  frente a un suelo de 0.17548. Cumple.
- **R3**: `--ring` idéntico a `--primary` en los dos temas, leído en vivo.
- **R4**: `L(.dark --primary)` = 0.68 > `L(--card)` = 0.2274 y >
  `L(--primary-foreground)` = 0.1822. El primario sigue siendo superficie clara con
  texto oscuro encima; R2 no se cumplió oscureciendo el token.
- **R7**: en light `--accent-action` y `--status-done` son el mismo valor exacto.
  En dark comparten hue `165.61` y difieren en lightness y chroma, como pide la
  spec.

## 2. CTA primario junto al outline en dark

Pantalla: `/odcs/new` (`odc-form.tsx`), tema oscuro. Los dos botones del panel
"Resumen" quedan uno encima del otro: **"Guardar como Borrador"** (outline) y
**"Enviar a Administración"** (primario).

Captura: `screenshot-1786461218069-0.png` (sesión 2026-08-11).

Veredicto de si el primario ya pesa más que el secundario: **sí**. El primario es
un azul lleno que domina la jerarquía a primera vista; el outline queda claramente
subordinado. D-V1 no se reproduce en esta pantalla, que era donde peor se veía.

## 3. Las 8 badges de estado en dark

En lugar de juzgar a ojo si "cambiaron", se midió el píxel realmente pintado por
Chrome para el valor **viejo** (fuera de gamut) y el **nuevo** de cada token
reajustado, con `canvas.getImageData`. Es la comprobación que R5 realmente afirma:
que el navegador ya estaba remapeando los viejos.

| Token | sRGB del valor viejo | sRGB del valor nuevo | Δ máx. por canal |
|---|---|---|---|
| `.dark --status-approved` | `151,195,255` | `167,197,252` | 16 |
| `.dark --status-paid` | `199,178,255` | `197,185,252` | 7 |
| `.dark --status-rejected` | `255,162,150` | `252,173,163` | 13 |
| `:root --status-pending-surface` | `255,245,240` | `254,246,241` | 1 |
| `:root --status-approved-surface` | `241,247,255` | `242,247,254` | 1 |
| `:root --status-paid-surface` | `246,245,255` | `246,245,254` | 1 |

**Los seis valores viejos saturan un canal a 255**, que es exactamente el recorte
que R5 denunciaba: el color declarado no era el pintado.

Matiz honesto sobre el "cambio visible esperado: ninguno" que dice la cabecera de
este archivo: en las 3 surfaces de light el cambio es de 1/255 — invisible, tal
cual se predijo. En los 3 textos de dark el cambio llega a 16/255 en un canal
(`--status-approved`). No es cero. La causa es que Chrome recorta **por canal**,
no hace gamut mapping perceptual, así que el color viejo pintado tenía un hue
ligeramente desviado, no solo menos chroma; el nuevo corrige esa desviación. Sobre
texto de badge de 12px el efecto es imperceptible, y va en la dirección correcta —
el valor declarado y el pintado ahora coinciden. Las 5 badges no tocadas
(`draft`, `pending`, `budget`, `evidence`, `done`) son idénticas por construcción:
sus valores no cambiaron.

Captura de la badge renderizada en la app (`Pendiente de factura`, dashboard en
dark): `screenshot-1786461318288-2.jpg`. El dataset de desarrollo solo tiene una
orden, así que las 8 no coexisten en pantalla; la medición de arriba cubre las 8.

## 4. Veredicto humano

**AFIRMATIVO.** D-V1 queda resuelto: el primario de dark pesa claramente más que
el botón outline en `/odcs/new`, y las badges de estado no cambian de forma
apreciable tras la corrección de gamut. — Alexis, 2026-08-11.

Revisado sobre las capturas y las mediciones de las secciones 1–3 de este archivo,
en sesión de navegador real del 2026-08-11.
