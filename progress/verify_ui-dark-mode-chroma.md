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

PENDIENTE — copiar en vivo, no deducir del código. Un renglón por token y tema.

| Token | Tema | `getComputedStyle` |
|---|---|---|
| `--primary` | light | pendiente |
| `--primary` | dark | pendiente |
| `--ring` | light | pendiente |
| `--ring` | dark | pendiente |
| `--accent-action` | light | pendiente |
| `--accent-action` | dark | pendiente |
| `--status-done` | light | pendiente |
| `--status-done` | dark | pendiente |

## 2. CTA primario junto al outline en dark

PENDIENTE — el CTA primario de `odc-form.tsx` junto a su botón outline, en tema
oscuro. Es la pantalla concreta donde D-V1 se vio peor.

Veredicto de si el primario ya pesa más que el secundario: pendiente.

## 3. Las 8 badges de estado en dark

PENDIENTE — confirmar que la corrección de gamut de R5 no cambió visiblemente
ninguna de las 8 badges (`draft`, `pending`, `budget`, `approved`, `paid`,
`evidence`, `done`, `rejected`). Las tres reajustadas son `approved`, `paid` y
`rejected`.

## 4. Veredicto humano

PENDIENTE — una línea, afirmativa o negativa, con fecha y firma.
