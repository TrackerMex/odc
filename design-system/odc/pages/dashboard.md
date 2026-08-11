# Dashboard — Page Overrides

> Sobrescribe `../MASTER.md`. Solo se documentan las desviaciones.
> Componentes: `odc-dashboard.tsx`, `admin-dashboard.tsx`, `general-dashboard.tsx`,
> `executive-dashboard.tsx`, `executive-tasks.tsx`.

## Layout

- Ancho: `max-w-[1400px]`, no `max-w-7xl`. Es una consola de trabajo, no una landing.
- Padding de página: `1.5rem` (hoy `p-4 sm:p-6 lg:p-8` → dejar en `p-4 sm:p-6`).
- Grid de colas: se mantiene `lg:grid-cols-2`. Con 4 colas, 2×2 es correcto.

## Header

El header actual ocupa ~180px de alto con saludo, subtítulo y descripción. En una
herramienta de uso diario eso es una franja muerta permanente.

- `h1` baja de `text-3xl sm:text-4xl` a `text-2xl`.
- Eliminar el párrafo descriptivo bajo el saludo ("Consulta tus órdenes activas…").
  Es texto de onboarding en una pantalla que el usuario ve 20 veces al día.
- Eyebrow "Operaciones": `tracking-[0.06em]`, no `0.18em`.
- Acciones: `size="sm"` en lugar de `size="lg"`.

## Tarjetas de cola (`QueueCard`)

- El contador (`page.total`) baja de `text-3xl` a `text-2xl` y toma
  `text-muted-foreground` salvo cuando la cola representa trabajo bloqueado
  (`RECHAZADA`), donde usa `--status-rejected`.
- Barra de acento vertical de 2px a la izquierda del header con el color del estado de la
  cola. Es lo que convierte cuatro tarjetas idénticas en cuatro colas distinguibles de un
  vistazo. Coste: una clase.
- Padding del `CardHeader`: `1rem` con `pb-3`.
- Radio: `--radius-card` (`0.625rem`), no `rounded-2xl`.
- Estado vacío: se conserva el borde discontinuo, pero baja a `min-h-20`.

## Filas de orden

- Fila a `py-2`, no `py-3`.
- El importe es la columna que más se escanea: `font-medium tabular-nums` — ya está bien.
- Hover: subrayado del folio (ya implementado). **No** añadir fondo ni elevación.
- Foco: `focus-visible:ring-3 focus-visible:ring-ring/30` (ya implementado, conservar —
  hay un test que lo verifica).

## Color

- Contador y eyebrow en `--muted-foreground`.
- Los badges usan los tokens de estado del Master.
- Nada de verde salvo `COMPLETADA`.
