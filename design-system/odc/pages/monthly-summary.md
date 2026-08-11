# Monthly Summary — Page Overrides

> Sobrescribe `../MASTER.md`. Solo desviaciones.
> Componentes: `monthly-summary.tsx`, `monthly-summary-slide.tsx`,
> `lib/monthly-summary-export.ts`.

## Layout

- Ancho `max-w-[1400px]`, no `max-w-7xl`.
- Header: `h1` de `text-3xl sm:text-4xl` a `text-2xl`; eliminar el párrafo descriptivo
  bajo el título.
- Grid superior `lg:grid-cols-[1.6fr_1fr]` se conserva. Es correcto.

## Métrica principal

El total actual está en `text-4xl sm:text-5xl`. Con el dial de densidad 8 y un `h1` de
`text-2xl`, un total de `text-5xl` desequilibra la jerarquía.

- Total: `text-3xl font-semibold tabular-nums`.
- Es el único elemento de la pantalla en ese tamaño. Las tres sub-métricas se quedan en
  `font-semibold tabular-nums` a tamaño body.
- Añadir `--space-lg` de aire por encima; la métrica se lee por aislamiento, no por tamaño.

## "En qué etapa están"

Hoy es una lista de pares texto/número. Es una distribución por etapa: se lee mucho mejor
como barras.

- **Barras horizontales ordenadas de mayor a menor** (`charts.csv` → alternativa
  recomendada frente a dona/sunburst para desglose por categoría).
- Cada barra usa el `--status-*` de su etapa. Es el uso legítimo del color de estado.
- Implementación: `div` con `width: %`. **No añadir librería de charts para esto.**
- Valor numérico siempre visible junto a la barra — el color nunca comunica solo
  (`charts.csv`, accesibilidad).

## Tabla de detalle

- Ya usa `ui/table.tsx` con estructura semántica. Correcto.
- Encabezados: bajar `tracking-[0.12em]` a `0.06em`.
- Envolver en `overflow-x-auto` (`ux-guidelines.csv` → Responsive/Table Handling).
- Columna de importes alineada a la derecha con `tabular-nums`.
- Fila a `h-9`, `border-b` de 1px, sin zebra.

## Estados

- El skeleton (`h-52` + `h-72`) se conserva; ajustar alturas si cambia el layout, para no
  provocar CLS.
- `motion-reduce:animate-none` ya está aplicado. Conservar.
- `aria-live="polite"` del anuncio de resultados: conservar.

## Export PDF

`monthly-summary-slide.tsx` usa `bg-white text-slate-950` hardcodeados a propósito, porque
el PDF se renderiza siempre en claro vía `html-to-image`. **Es correcto y es la única
excepción admitida a la regla de "cero hex/colores crudos".** Documentarla con un
comentario en el archivo para que ninguna auditoría posterior la "arregle".

Si se adoptan los tokens de estado, el slide debe usar sus equivalentes en claro para que
el PDF y la pantalla coincidan.

## Tests a conservar

`monthly-summary.test.tsx:139` verifica que `[data-testid="monthly-summary-results"]`
contiene la clase `odc-filter-results`. Esa clase y su keyframe en `styles.css` no se
tocan.
