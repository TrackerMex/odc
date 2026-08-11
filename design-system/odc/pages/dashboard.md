# Dashboard — Page Overrides

> Sobrescribe `../MASTER.md`. Solo se documentan las desviaciones.
> Componentes activos: `executive-dashboard.tsx`, `executive-tasks.tsx`.

## Layout

- `executive-dashboard.tsx`: `max-w-[1400px]`, no `max-w-7xl`. Es una consola de
  trabajo, no una landing.
- `executive-tasks.tsx`: `max-w-4xl` (896px) — ver enmienda de abajo.
- Padding de página: `1.5rem` (hoy `p-4 sm:p-6 lg:p-8` → dejar en `p-4 sm:p-6`).

### Enmienda 2026-08-11 — el ancho de consola no aplica a listas de una columna

Autorizada por el humano tras verla en pantalla, en la sesión de verificación de
la feature 25 (`progress/verify_ui-surfaces-dashboards.md` §1).

`executive-tasks.tsx` renderiza una **lista de una sola columna**, no el resumen
ejecutivo compuesto. Aplicarle el ancho de consola la deja así, medido en vivo
con el viewport a 1466px:

| Medida | Valor |
|---|---|
| Borde derecho del importe | x = 611 |
| Borde izquierdo de su botón de acción | x = 1274 |
| **Hueco vacío entre el dato y la acción que opera sobre él** | **663px** |

A 1400px completos el hueco pasaría de 880px. El ojo tiene que cruzar la fila
entera para ligar un importe con su botón, que es justo el tipo de fricción que
el ancho de consola pretendía evitar en las rejillas.

**Regla resultante:** el resumen ejecutivo usa `max-w-[1400px]`. Una superficie
de lista de una sola columna usa `max-w-4xl` (896px), que mantiene la relación
entre el dato y su acción a una distancia legible. Si en el futuro
`executive-tasks.tsx` deja de ser una lista de una columna, vuelve a la regla
general.

## Header

El header actual ocupa ~180px de alto con saludo, subtítulo y descripción. En una
herramienta de uso diario eso es una franja muerta permanente.

- `h1` baja de `text-3xl sm:text-4xl` a `text-2xl`.
- Eliminar el párrafo descriptivo bajo el saludo ("Consulta tus órdenes activas…").
  Es texto de onboarding en una pantalla que el usuario ve 20 veces al día.
- Eyebrow "Operaciones": `tracking-[0.06em]`, no `0.18em`.
- Acciones: `size="sm"` en lugar de `size="lg"`.

## Color

- Los badges usan los tokens de estado del Master.
- Las alertas de antigüedad usan el par `--status-pending`.
- Nada de verde salvo `COMPLETADA`.
