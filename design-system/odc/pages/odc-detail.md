# ODC Detail — Page Overrides

> Sobrescribe `../MASTER.md`. Solo desviaciones.
> Componentes: `odc-detail.tsx`, `odc-document-preview.tsx`, `admin-budget-actions.tsx`,
> `general-approval-actions.tsx`.

## Problema estructural actual

Cada campo se renderiza como `DetailItem` = caja `rounded-2xl bg-muted/60 p-4`. Con 6
campos base más los bloques de pago y factura, la pantalla acumula hasta 14 cajas grises
redondeadas anidadas dentro de secciones que a su vez son cajas dentro de una `Card`.
Tres niveles de caja para mostrar pares label/valor. Es el patrón que más contribuye a la
lectura de "plantilla genérica".

## Layout de datos

- **Sustituir `DetailItem` por filas de definición**: label a la izquierda en
  `--muted-foreground` `text-xs uppercase`, valor a la derecha, separadas por `border-b`
  de 1px. Sin fondo, sin radio, sin padding de caja.
- Grid: `sm:grid-cols-2`, no `lg:grid-cols-3`. Dos columnas de pares label/valor se leen;
  tres fragmentan.
- El **Total** rompe el patrón deliberadamente: es el único valor con
  `text-xl font-semibold tabular-nums`, en una fila propia a ancho completo con
  `border-t-2`. Un solo punto de énfasis por pantalla.
- Los bloques "Información de pago" / "Información de factura" pasan de caja con borde a
  sección con encabezado de label y `border-t`.

## Timeline de historial

Es el activo diferencial del producto (trazabilidad auditable) y hoy se ve como una lista
con puntos grises.

- El punto de cada entrada toma el color del `toStatus` (`--status-*`), no
  `bg-foreground`. Convierte el historial en una lectura cromática del ciclo.
- La entrada más reciente lleva el punto relleno con `ring-4`; las anteriores, punto hueco
  de 1.5px. Marca el "ahora" sin texto extra.
- La línea conectora se conserva en `bg-border`.
- La nota (`entry.note`) baja de `rounded-xl bg-muted px-3 py-2` a texto con
  `border-l-2 pl-3`.
- `pb-4` en lugar de `pb-5`.

## Banner de rechazo

Se conserva la estructura. Ajustes: radio `--radius-card`, y el `AlertTriangleIcon` a
`size-4`. El fondo `bg-destructive/10` con texto `text-destructive` debe verificarse a
4.5:1 en dark — es el par de contraste más frágil de la app.

## Acciones

- Barra de acciones fija al pie de la columna principal, no dispersa entre secciones.
- "Aprobar" usa `variant="default"` (navy); "Registrar pago" y "Completar" usan la
  variante `confirm` (verde); "Rechazar" usa `destructive`.
- Toda acción irreversible pasa por `Dialog` con confirmación explícita.
- `general-approval-actions.test.tsx:342` verifica `flex-col.*sm:flex-row` en el
  contenedor de acciones. Conservar esas clases.
- `odc-detail.test.tsx:234` verifica `flex-wrap` en el contenedor de la acción de
  evidencia. Conservar.

## Sidebar de historial

`xl:sticky xl:top-6` se conserva. Ancho `22rem` se conserva.
