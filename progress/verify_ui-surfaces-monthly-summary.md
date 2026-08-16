# Verificación — ui-surfaces-monthly-summary

## 1. La superficie en los dos temas

Verificada en `/monthly-summary?month=2026-07&page=1`, sesión
`DIRECTOR_OPS` y viewport 1440×900. En claro y oscuro el header pasó de
`100px` a `59.9875px`; el `h1` pasó de `36px` a `24px` y el párrafo
"Un corte mensual listo para revisar y compartir." dejó de estar en el DOM.
No se observó desbordamiento horizontal de la página.

## 2. Jerarquía tipográfica del total

El total `$502,000.00` computó `font-size: 30px` en claro y oscuro. La
inspección de todos los elementos visibles no encontró otro texto con tamaño
igual o mayor, por lo que el total conserva el escalón tipográfico principal.

## 3. Las barras de etapa

Con datos reales de julio, el orden fue Pago registrado (`3 · $301,400.00`),
Completada (`3 · $155,600.00`) y Pendiente de factura (`1 · $45,000.00`). Los
empates respetaron el orden canónico.

| Etapa | Claro: color / ancho | Oscuro: color / ancho |
|---|---|---|
| Pago registrado | `oklch(0.4907 0.2412 292.58)` / `391.325px` | `oklch(0.82 0.093 292.58)` / `391.325px` |
| Completada | `oklch(0.5081 0.1049 165.61)` / `391.325px` | `oklch(0.82 0.063 165.61)` / `391.325px` |
| Pendiente de factura | `oklch(0.5198 0.0936 223.13)` / `130.4375px` | `oklch(0.82 0.056 223.13)` / `130.4375px` |

El carril midió `391.325px`. En agosto, las tres etapas con `count` 0
mantuvieron etiqueta, `0 · $0.00` y color computado, con relleno de `0px` y
sin `NaN`. Veredicto: la proporción 3/3/1 se entiende de un vistazo y no añade
ruido.

## 4. La tabla de detalle

En julio la tabla midió `scrollWidth: 1087px` y `clientWidth: 1087px` a
1440×900, sin scroll horizontal. El encabezado computó
`letter-spacing: 0.72px` (`0.06em` sobre `12px`).

PENDIENTE: la base local solo contiene 7 compras pagadas en el mes disponible;
falta repetir la sesión con más de 10 registros para ejercer la paginación real.

## 5. La exportación PNG y PDF

Ejecutadas de verdad sobre julio. Se generaron
`resumen-compras-2026-07.png` (359,066 bytes) y
`resumen-compras-2026-07.pdf` (10,553,703 bytes). El PDF es una página A4
horizontal. Ambos archivos se inspeccionaron renderizados: tipografía, totales
y siete filas permanecen legibles, alineados y sin recortes ni solapamientos.
Veredicto: el slide conserva el aspecto previo al rediseño; su único cambio de
código es el comentario que documenta la paleta clara deliberada.

## 6. Veredicto humano

PENDIENTE
