# Design System Master — ODC

> **LOGIC:** Al construir una página, revisa primero `design-system/odc/pages/<page>.md`.
> Si existe, sus reglas **sobrescriben** este Master. Si no, sigue este archivo.

---

**Project:** ODC — sistema interno de órdenes de compra
**Category (products.csv):** Invoice & Billing Tool (row 105)
**Design Dials:** Variance 3/10 (Centered/Minimal) · Motion 3/10 (Subtle) · Density 8/10 (Dense/Dashboard)
**Stack:** React 19 + TanStack Start/Router + Tailwind v4 + shadcn/ui sobre `@base-ui/react`
**Fuente única de verdad.** `/DESIGN.md` queda subordinado: se mantiene sincronizado con
este archivo únicamente porque la skill `impeccable` lo lee automáticamente
(`scripts/context.mjs`). Si discrepan, **gana este archivo**. Ver §9 para el registro de
qué se enmendó y por qué.

## Procedencia de las recomendaciones

| Sección | Origen | Estado |
|---|---|---|
| Colores | `colors.csv` → "Invoice & Billing Tool" | Match directo de la DB |
| Estilo | `products.csv` row 105 → Minimalism + Flat Design / Swiss Modernism 2.0 / Accessible & Ethical | Match directo de la DB |
| Typography | `typography.csv` → "Minimal Swiss" (Inter/Inter) | Match de la DB, **sustituye** al pairing Fira que devolvió `--design-system` |
| Spacing | dial `--density 8` | Generado |
| UX rules | `ux-guidelines.csv` | Match directo |
| Stack rules | `stacks/shadcn.csv`, `stacks/react.csv` | Match directo |
| Motion | **defaults propios del proyecto**, no la DB | El preset GSAP de `--motion 3` se descarta (ver §Motion) |

> El bloque `STYLE` de `--design-system` devolvió "Exaggerated Minimalism" (Best For:
> *fashion, portfolios, luxury, editorial*) y el `PATTERN` devolvió una landing page de
> ventas, con tres queries distintas. Es un misruteo del ranker, no una recomendación
> aplicable a una app interna. Se descarta y se usa la fila de producto, que es
> autoritativa. Registrado aquí para que nadie lo "restaure" pensando que se perdió.

---

## 1. Color

Paleta semántica navy + verde pagado + rojo excepción sobre neutros fríos. Convertida a
`oklch` para encajar con los tokens ya existentes en `frontend/src/styles.css`.

### Tokens base (light)

| Token | oklch | hex origen | Rol |
|---|---|---|---|
| `--primary` | `oklch(0.3462 0.0736 256.04)` | `#1E3A5F` | Acción primaria, ring de foco, texto de énfasis |
| `--primary-foreground` | `oklch(0.985 0 0)` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `oklch(0.9632 0.0034 247.86)` | `#F1F3F5` | Superficie secundaria neutra |
| `--accent-action` | `oklch(0.5960 0.1274 163.23)` | `#059669` | **Solo** confirmación de pago/cierre. No es el color de todos los CTA |
| `--background` | `oklch(0.9842 0.0034 247.86)` | `#F8FAFC` | Fondo de app |
| `--card` | `oklch(1 0 0)` | `#FFFFFF` | Superficie de tarjeta (contraste contra el fondo, no igual) |
| `--foreground` | `oklch(0.2077 0.0398 265.75)` | `#0F172A` | Texto principal |
| `--muted-foreground` | `oklch(0.5544 0.0407 257.42)` | `#64748B` | Metadatos, ayudas |
| `--border` | `oklch(0.9268 0.0063 255.48)` | `#E4E7EB` | Bordes y divisiones |
| `--destructive` | `oklch(0.5771 0.2152 27.33)` | `#DC2626` | Rechazo, error |
| `--ring` | `oklch(0.3462 0.0736 256.04)` | `#1E3A5F` | Anillo de foco |

Cambio clave frente al estado actual: hoy `--background` y `--card` son ambos
`oklch(1 0 0)` y `--primary` es gris `oklch(0.205 0 0)`. Card sobre fondo idéntico +
primary acromático es la causa mecánica de que la UI lea como shadcn sin tematizar.

### Tokens de estado ODC (nuevos)

Hoy los colores de estado viven hardcodeados como clases Tailwind en
`odc-status-badge.tsx`. Pasan a tokens semánticos para poder invertirlos en dark y
auditarlos por contraste.

| Estado | Token | Hue base | Foreground (light) |
|---|---|---|---|
| `BORRADOR` | `--status-draft` | slate `oklch(0.4455 0.0374 257.28)` | `#475569` |
| `PENDIENTE_ADMIN` | `--status-pending` | amber `oklch(0.5553 0.1455 49.00)` | `#B45309` |
| `PRESUPUESTO_APROBADO` | `--status-budget` | sky `oklch(0.5000 0.1193 242.75)` | `#0369A1` |
| `COMPRA_APROBADA` | `--status-approved` | blue `oklch(0.5461 0.2152 262.88)` | `#2563EB` |
| `PAGO_REGISTRADO` | `--status-paid` | violet `oklch(0.4907 0.2412 292.58)` | `#6D28D9` |
| `EVIDENCIA_PAGO_SUBIDA` | `--status-evidence` | cyan `oklch(0.5198 0.0936 223.13)` | `#0E7490` |
| `COMPLETADA` | `--status-done` | emerald `oklch(0.5081 0.1049 165.61)` | `#047857` |
| `RECHAZADA` | `--status-rejected` | red `oklch(0.5771 0.2152 27.33)` | `#DC2626` |

Cada estado usa un par `--status-x` (texto) + `--status-x-surface` (fondo al ~12% de
luminancia invertida). Todos los foregrounds listados superan 4.5:1 sobre su surface claro.

**Regla obligatoria (`ux-guidelines.csv`, Charts & Data):** el color nunca comunica solo.
El badge siempre lleva su etiqueta textual y `data-status`, como ya hace hoy. No se
introduce ningún indicador que dependa únicamente del hue.

---

## 2. Typography

**Pairing:** `Minimal Swiss` — Inter / Inter (`typography.csv`, *Best For: dashboards,
admin panels, enterprise apps*).

Se **descarta** el pairing Fira Code / Fira Sans que devolvió `--design-system`: exigiría
dos familias nuevas descargadas de Google Fonts, mientras el repo ya tiene
`@fontsource-variable/inter` y `@fontsource-variable/geist` en `package.json`.

> **Hallazgo:** ninguna de las dos fuentes se importa en `frontend/src/`. El body cae hoy
> a `ui-sans-serif, system-ui`, es decir Segoe UI en Windows. La app nunca ha renderizado
> con la tipografía que tiene instalada. Coste de arreglarlo: un `import` y una línea de
> `--font-sans`.

| Rol | Familia | Specs |
|---|---|---|
| Body / UI | Inter Variable | 14px / 1.5 / 400 |
| Label | Inter Variable | 12px / 600 / `0.06em` uppercase |
| Title | Inter Variable | 16–20px / 600 / `-0.01em` |
| Display | Inter Variable | 28–30px / 600 / `-0.02em` |
| Numerales | Inter Variable + `font-variant-numeric: tabular-nums` | importes, folios, fechas |

Geist queda como opcional para display; no se usa hasta que haya una razón. Una sola
familia es suficiente y evita un segundo payload de fuente.

**Cambios respecto a `/DESIGN.md`:** display baja de 2.25rem a 1.875rem (dial de densidad
8) y el label baja su tracking de `0.12em` a `0.06em` — `0.12em` en 12px es tracking de
poster, ilegible en una fila de tabla.

**Regla Number-First (heredada de `/DESIGN.md`, se mantiene):** todo importe, folio y
fecha usa cifras tabulares. Aplica a la columna de montos del listado, al total del
detalle y al resumen mensual.

---

## 3. Spacing & density (dial 8/10)

| Token | Valor | Uso |
|---|---|---|
| `--space-xs` | `0.125rem` | Gaps mínimos |
| `--space-sm` | `0.25rem` | Icono ↔ texto |
| `--space-md` | `0.5rem` | Padding estándar, gap entre acciones |
| `--space-lg` | `0.75rem` | Padding de celda, padding de sección compacta |
| `--space-xl` | `1rem` | Padding de tarjeta |
| `--space-2xl` | `1.5rem` | Margen entre secciones |
| `--space-3xl` | `2rem` | Padding de página |

Consistente con la cuadrícula de 0.25rem de `/DESIGN.md`. El padding de tarjeta baja de
`1.25rem` a `1rem`, y la fila de tabla usa `0.5rem 0.75rem`.

**Regla:** ancho de contenido hasta `1400px` o full-width en vistas de datos. Nunca
`max-width: 1200px` centrado con aire a los lados — desperdicia el viewport de una
herramienta de escritorio de uso diario.

---

## 4. Shape & elevation

| Token | Valor | Antes (`/DESIGN.md`) |
|---|---|---|
| `--radius` (control) | `0.375rem` | `1rem` |
| `--radius-card` | `0.625rem` | `24px` |
| `--radius-badge` | `0.25rem` | pill |

Radio de 1rem sobre un control de 2rem de alto produce una cápsula: lectura de app de
consumo. Las herramientas financieras usan esquinas cerradas. Este es uno de los dos
cambios que más mueven la aguja del "se ve genérico".

**Elevación — se conserva la Gentle Layer Rule de `/DESIGN.md`.** Una sombra señala una
capa de trabajo, no decora:

- Tarjeta: `shadow-xs` + `border` de 1px. Nada más.
- Popover / dropdown: `shadow-md`.
- Dialog: `shadow-xl` + backdrop negro 30% con blur.
- **Prohibido:** `translateY` en hover de tarjeta, `cursor:pointer` en tarjetas no
  clicables, y la escalada de sombra en hover que propone el MASTER autogenerado.
  Una tabla de 40 filas que levita al pasar el ratón es ruido, no feedback.

Separación estructural: `border` de 1px o cambio tonal. Sin bordes gruesos ni oscuros.

---

## 5. Motion (dial 3/10 — Subtle)

**Se descarta el preset GSAP + ScrollTrigger.** Razones: la app ya tiene view transitions
y keyframes propios en `styles.css` (`odc-route-enter`, `odc-filter-settle`) que cubren
exactamente el tier "Subtle"; ScrollTrigger es para revelar secciones de landing al hacer
scroll, patrón que no existe en esta UI; y añade una dependencia con plugin registrado
globalmente para un efecto de 12px de desplazamiento.

Vocabulario que sí aplica:

| Interacción | Duración | Easing |
|---|---|---|
| Hover / focus de control | 150ms | `ease-out` |
| Cambio de estado de badge | 150ms | `ease-out` (ya implementado) |
| Entrada de dialog / sheet | 200ms fade + zoom | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Transición de ruta | 220ms | `cubic-bezier(0.16, 1, 0.3, 1)` (ya implementado) |
| Salida | 120ms | `ease-out` — la salida siempre más rápida que la entrada |

`prefers-reduced-motion: reduce` desactiva todo. Ya está implementado en `styles.css:201`;
cualquier animación nueva se añade a ese bloque.

---

## 6. Componentes

### Botones

- Alto `2rem` (`h-8`), padding lateral `0.75rem`, radio `0.375rem`, peso 500.
- **Primary:** superficie `--primary` (navy), texto `--primary-foreground`.
- **Confirm:** variante nueva sobre `--accent-action` (verde). **Solo** para "Registrar
  pago" y "Completar orden". Un CTA verde en cada pantalla destruye su significado.
- **Destructive:** `--destructive`, para rechazar.
- **Outline / Ghost:** borde `--border` sobre `--background`; ghost sin superficie hasta hover.
- **Foco:** `ring-[3px] ring-ring/30`, visible siempre. Nunca `outline-none` sin sustituto.
- Área táctil mínima 44×44px en móvil: usar padding, no altura del control.

### Tabla de datos

`stacks/shadcn.csv` (severity High/Medium):

- Estructura semántica obligatoria: `Table > TableHeader > TableRow > TableHead` +
  `TableBody`. Nada de `div` en grid simulando tabla.
- Wrapper `overflow-x-auto` para no romper el layout en móvil.
- Header sticky, fila de `2.25rem`, zebra **no** — usar `border-b` de 1px. El zebra en
  neutros fríos se lee sucio.
- Alineación: texto a la izquierda, **importes y fechas a la derecha con `tabular-nums`**.
- Estado vacío con mensaje accionable, nunca un hueco en blanco.
- `key={odc.id}`, nunca el índice.
- Virtualización solo si una vista supera 100 filas renderizadas; hoy hay paginación, así
  que no aplica todavía.

### Formularios

`ux-guidelines.csv`:

- Label visible siempre. Placeholder nunca sustituye al label.
- Validación en `blur`, no solo en submit.
- Error junto al campo, con `role="alert"`, no solo un borde rojo ni un resumen arriba.
- Foco al primer campo con error al fallar el submit.
- Divulgación progresiva: los campos opcionales van en una sección colapsable.

### Badges de estado

Sin borde, peso 500, radio `0.25rem`, `text-xs`, par token texto/superficie de §1.
Es una etiqueta informativa, nunca un control.

### Diálogos

Superficie popover, radio `0.625rem`, padding `1.25rem`, `shadow-xl`, backdrop 30% + blur.
Toda acción irreversible (rechazar, completar) pasa por diálogo con confirmación explícita.

### Iconos

Lucide, ya instalado, tamaño 16px en controles densos y 20px en navegación. Trazo
uniforme. **Sin emojis como iconos.** Todo botón solo-icono lleva `aria-label`.

> La consulta a `icons.csv` devolvió recomendaciones de Phosphor. Se ignora la librería
> (Lucide ya está en el proyecto y cubre el set); se conserva el criterio: estilo outline,
> 20px, un solo set.

---

## 7. Gráficas (resumen mensual)

De `charts.csv`:

- **Serie temporal de gasto → Line Chart** (grade AA). No usar con menos de 4 puntos:
  con 1–3 meses, stat cards. Diferenciar series por estilo de línea además de por color.
- **Desglose por categoría/proveedor → barras horizontales ordenadas**, no dona. Sunburst
  y treemap son grade C y exigen tabla alternativa obligatoria; no valen el coste aquí.
- Toda gráfica lleva leyenda, tooltip y **tabla de datos equivalente** — que además ya es
  lo que se exporta a PDF.
- No añadir una librería de charts para una sola vista: barras horizontales se resuelven
  con divs y `width: %`. Un Line Chart sí justificaría Recharts, decidir cuando exista
  el requisito.

---

## 8. Anti-patrones

Prohibido en este proyecto:

- ❌ Emojis como iconos
- ❌ Gradientes, fondos ilustrativos, efectos 3D, sombras difusas
- ❌ Hover que desplaza el layout (`translateY`, `scale` en tarjetas o filas)
- ❌ `cursor: pointer` en elementos no interactivos
- ❌ Texto por debajo de 12px, o gris sobre gris con menos de 4.5:1
- ❌ Hex crudo en componentes — siempre token semántico
- ❌ Verde de acento fuera de pago/cierre
- ❌ Cambios de estado instantáneos (0ms) o foco invisible
- ❌ `z-[9999]`; usar la escala 10/20/30/50
- ❌ Tabla ancha sin `overflow-x-auto`

---

## 9. Conflictos resueltos contra `/DESIGN.md`

Los siete conflictos están **aplicados** en `/DESIGN.md` (frontmatter y cuerpo) para que
ninguna herramienta que lo parsee reciba reglas contradictorias. La columna "`/DESIGN.md`"
recoge lo que decía **antes** de la sincronización.

| # | `/DESIGN.md` (antes) | ui-ux-pro-max | Resolución |
|---|---|---|---|
| 1 | Status-Only Color Rule: cero acentos de marca | Navy primary + verde pagado | **Enmendada** → Two-Color Rule (abajo) |
| 2 | Radio control `1rem`, card `24px` | 8px / 12px | Control `0.375rem`, card `0.625rem` |
| 3 | Padding de tarjeta `1.25rem` | 24px | `1rem` (dial de densidad 8) |
| 4 | Display `2.25rem`, label tracking `0.12em` | — | Display `1.875rem`, tracking `0.06em` |
| 5 | `card` = `background` (ambos blancos) | Card blanco sobre fondo `#F8FAFC` | Fondo frío, card blanco |
| 6 | Gentle Layer Rule (sombra = capa) | Hover con sombra + `translateY` | **Gana `/DESIGN.md`** |
| 7 | Inverted Ledger Rule (dark = mismos roles) | — | Se mantiene |

**Two-Color Rule (sustituye a la Status-Only Color Rule):** la interfaz tiene exactamente
dos voces cromáticas — el navy institucional para chrome, acción primaria y foco; y los
hues de estado para comunicar en qué punto del ciclo está una orden. Cualquier otro color
está prohibido. El navy no es decoración de marca: es el que distingue la acción primaria
de las secundarias, distinción que el gris acromático no puede hacer. La intención
original de la regla —que nada compita con los estados operativos— se conserva íntegra.

---

## 10. Pre-delivery checklist

- [ ] Contraste ≥ 4.5:1 en light y dark, incluidos los 8 pares de estado
- [ ] Foco visible en todo elemento interactivo (`ring-[3px]`)
- [ ] Navegación completa por teclado; orden de tabulación coherente
- [ ] `aria-label` en todo botón solo-icono; errores con `role="alert"`
- [ ] `prefers-reduced-motion` respetado en toda animación nueva
- [ ] Responsive verificado en 375 / 768 / 1024 / 1440
- [ ] Sin scroll horizontal; tablas envueltas en `overflow-x-auto`
- [ ] Sin emojis como iconos; un solo set (Lucide)
- [ ] Cero hex crudos en componentes
- [ ] Transiciones 150–300ms en hover y foco
- [ ] `pnpm test` y `pnpm build` en verde
