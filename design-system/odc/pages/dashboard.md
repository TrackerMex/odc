# Dashboard — Page Overrides

> Sobrescribe `../MASTER.md`. Solo se documentan las desviaciones.
> Componentes activos: `executive-dashboard.tsx`, `executive-tasks.tsx`.

## Enmienda aprobada 2026-09-13 — executive-workspace-v2 (#32)

La aprobación humana de #32 sustituye las restricciones de composición de #31 y
de la antigua lista de tareas. Se conserva el shell Modern, Inter y tokens.

- Orden: cabecera/periodo, cuatro KPI, tendencia de 12 meses y distribución por
  estado, tabla operativa, proveedores y pendientes antiguos. La tendencia ocupa
  más ancho que la distribución en escritorio; móvil apila la composición.
- KPI: importe pagado, compras pagadas, ODC creadas en el mes y tareas accionables
  de todos los meses. Comparaciones solo de las magnitudes de pago definidas.
- Ambas tablas usan `max-w-[1400px]`, filtros del servidor y 10 filas; mantienen
  scroll horizontal local con foco. Mis tareas ya no es una lista de una columna.
- Gráfica específica SVG con escala cero, datos reales y tabla textual accesible.
  Su ancho mínimo mantiene legibles 12 meses; scroll local, nunca de página.
- Labels en sentence case/tracking normal en ambas superficies. La anterior
  obligación de tracking de label solo se aplica donde siguen existiendo labels
  en mayúsculas, como el resumen mensual.
- Header sticky opaco 58/64px; asides y foco usan esa altura más separación.
  Controles visibles móviles de al menos 44px, diálogos encima de la navegación.
- Mes de creación para tareas/cohorte, fecha de pago para compras. El periodo del
  dashboard no oculta pendientes antiguos; filtros de tabla no alteran métricas.
- Creación con revisión modal y folio posterior, cancelación sin escritura y
  recuperación de envío sobre la identidad persistida. Sin nuevas dependencias.

## Enmienda aprobada 2026-09-13 — frontend-dashboard-template

La spec #31 aprobada reemplaza las reglas visuales siguientes solo en el shell y
`executive-dashboard.tsx`; `executive-tasks.tsx` conserva sus reglas actuales.

- Panel financiero unido mediante divisores, con comparación de dos importes mensuales
  y cuatro métricas. No se dibuja una serie temporal ni se requieren tooltips para leer valores.
- Orden constante de DOM y vista: panel, prioridad, proveedores, antigüedad. Desde 1280px
  prioridad ocupa dos tercios y el contexto la columna derecha; debajo se apilan.
- Shell enmarcado, sidebar expandido 232px, encabezado 64px (58px móvil).
- Labels, encabezados y columnas en sentence case y tracking normal; Inter y todos
  los tokens semánticos de color y radio se conservan.
- La tabla de prioridad es semántica, mantiene columnas y scroll local accesible en móvil.
  Sustituye la regla anterior de ocultar columnas bajo `lg` y las aserciones de composición de listas.
- Los contadores se integran en los encabezados; sin tarjeta o sombra propia por cada métrica.
- Padding de escritorio hasta 32px para el nuevo dashboard, 16px móvil. Los enlaces y
  controles del shell/dashboard tienen área táctil mínima 44px en móvil.

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
