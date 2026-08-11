---
feature: "ui-design-tokens"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, tokens]
---

# Requisitos — [[ui-design-tokens]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

Fuente normativa del contenido visual: `design-system/odc/MASTER.md` (§1 color,
§2 tipografía, §3 espaciado, §4 forma, §5 motion, §6 componentes).
Alcance: **fases 1 y 2** de `progress/ui-redesign-plan.md`, ni más ni menos.

## Requisitos funcionales

### Fase 1 — Fundación de tokens (`frontend/src/styles.css`, `frontend/src/routes/__root.tsx`)

- **R1**: WHEN la aplicación sirve cualquier ruta, THE SYSTEM SHALL cargar
  `@fontsource-variable/inter` mediante un import estático dentro de
  `frontend/src/` y SHALL declarar `--font-sans` en `@theme inline` con
  `'Inter Variable'` como primera familia del stack, de modo que el `body` deje
  de resolver a `ui-sans-serif, system-ui`. Ninguna otra familia (Geist
  incluida) SHALL importarse.

- **R2**: WHEN el tema claro está activo, THE SYSTEM SHALL declarar en `:root`
  exactamente estos valores del MASTER §1:

  | Token | Valor |
  |---|---|
  | `--background` | `oklch(0.9842 0.0034 247.86)` |
  | `--card` | `oklch(1 0 0)` |
  | `--foreground` | `oklch(0.2077 0.0398 265.75)` |
  | `--primary` | `oklch(0.3462 0.0736 256.04)` |
  | `--primary-foreground` | `oklch(0.985 0 0)` |
  | `--secondary` | `oklch(0.9632 0.0034 247.86)` |
  | `--muted-foreground` | `oklch(0.5544 0.0407 257.42)` |
  | `--border` | `oklch(0.9268 0.0063 255.48)` |
  | `--destructive` | `oklch(0.5771 0.2152 27.33)` |
  | `--ring` | `oklch(0.3462 0.0736 256.04)` |
  | `--accent-action` | `oklch(0.5081 0.1049 165.61)` |
  | `--accent-action-foreground` | `oklch(0.985 0 0)` |

  `--background` y `--card` SHALL tener valores distintos entre sí.

- **R3**: WHILE el tema oscuro (`.dark`) está activo, THE SYSTEM SHALL conservar
  el rol semántico de cada token de R2 (Inverted Ledger Rule: mismos roles, no
  nuevos roles), SHALL declarar `--sidebar-primary` con el mismo valor que
  `--primary` en `.dark` — eliminando el violeta huérfano
  `oklch(0.488 0.243 264.376)` de `styles.css:67` — y ningún token declarado en
  `:root` o en `.dark` distinto de `--status-*`, `--destructive` y
  `--accent-action` SHALL tener un chroma oklch mayor que `0.10`.

- **R4**: WHEN se consulta la hoja de estilos, THE SYSTEM SHALL declarar los 8
  pares de estado `--status-<x>` (texto) y `--status-<x>-surface` (fondo) tanto
  en `:root` como en `.dark` — 32 declaraciones — para
  `draft`, `pending`, `budget`, `approved`, `paid`, `evidence`, `done`,
  `rejected`, usando en tema claro los foregrounds del MASTER §1:

  | Token | Valor (light) |
  |---|---|
  | `--status-draft` | `oklch(0.4455 0.0374 257.28)` |
  | `--status-pending` | `oklch(0.5553 0.1455 49.00)` |
  | `--status-budget` | `oklch(0.5000 0.1193 242.75)` |
  | `--status-approved` | `oklch(0.5461 0.2152 262.88)` |
  | `--status-paid` | `oklch(0.4907 0.2412 292.58)` |
  | `--status-evidence` | `oklch(0.5198 0.0936 223.13)` |
  | `--status-done` | `oklch(0.5081 0.1049 165.61)` |
  | `--status-rejected` | `oklch(0.5771 0.2152 27.33)` |

  `@theme inline` SHALL exponer los 16 tokens como colores utilizables por
  utilidades Tailwind. Los valores de `.dark` y los de `-surface` no están
  fijados numéricamente: quedan restringidos por R3 y R5.

- **R5**: WHEN se calcula el contraste WCAG 2.1 entre los colores resueltos de
  la hoja de estilos, THE SYSTEM SHALL alcanzar una razón ≥ 4.5:1 en todos
  estos pares, en tema claro y en tema oscuro:
  1. cada `--status-<x>` sobre su `--status-<x>-surface` (8 pares × 2 temas);
  2. `--foreground` sobre `--background` y `--foreground` sobre `--card`;
  3. `--muted-foreground` sobre `--card`;
  4. `--primary-foreground` sobre `--primary`;
  5. `--accent-action-foreground` sobre `--accent-action`;
  6. `--destructive` sobre la superficie `--destructive` al 10% compuesta sobre
     `--card` en tema oscuro (el par más frágil según el plan).

- **R6**: WHEN se consulta la hoja de estilos, THE SYSTEM SHALL declarar
  `--radius: 0.375rem`, `--radius-card: 0.625rem`, `--radius-badge: 0.25rem` y
  la escala de espaciado del MASTER §3 (`--space-xs: 0.125rem`,
  `--space-sm: 0.25rem`, `--space-md: 0.5rem`, `--space-lg: 0.75rem`,
  `--space-xl: 1rem`, `--space-2xl: 1.5rem`, `--space-3xl: 2rem`), y `@theme
  inline` SHALL exponer `--radius-card` y `--radius-badge` como radios
  utilizables.

### Fase 2 — Primitivas (`frontend/src/components/ui/`)

- **R7**: WHEN se renderiza `<Button>` con el tamaño por defecto, THE SYSTEM
  SHALL producir un control de `2rem` de alto (`h-8`), padding lateral
  `0.75rem`, peso 500 y radio `--radius`, conservando el foco
  `ring-[3px] ring-ring/30` visible. WHEN se renderiza con `variant="confirm"`,
  THE SYSTEM SHALL usar `--accent-action` como superficie y
  `--accent-action-foreground` como texto. Ninguna variante ni tamaño de
  `button.tsx` SHALL emitir `rounded-2xl`.

- **R8**: WHEN se renderizan `<Input>`, `<SelectTrigger>` o `<Textarea>`,
  THE SYSTEM SHALL aplicar radio `--radius` (nunca `rounded-2xl`) y conservar el
  foco `ring-[3px] ring-ring/30`; `<Input>` y `<SelectTrigger>` en su tamaño por
  defecto SHALL medir `2rem` de alto. WHEN `<FieldError>` recibe contenido o
  errores, THE SYSTEM SHALL renderizar un elemento con `role="alert"`
  (comportamiento ya presente en `field.tsx`; esta feature lo preserva y lo
  vuelve verificable).

- **R9**: WHEN se renderiza `<Card>`, THE SYSTEM SHALL aplicar radio
  `--radius-card`, padding de `1rem` (`--card-spacing`), sombra `shadow-xs` y un
  borde de 1px con `--border`. THE SYSTEM SHALL NOT aplicar `translateY`,
  `scale`, `cursor-pointer` ni escalada de sombra en el hover de la tarjeta.

- **R10**: WHEN se renderiza `<Table>`, THE SYSTEM SHALL conservar la estructura
  semántica actual (`table > thead > tr > th` + `tbody`) y el contenedor
  `overflow-x-auto`, SHALL producir filas de datos de `2.25rem` de alto con
  padding de celda `0.5rem 0.75rem`, SHALL separar filas con `border-b` de 1px
  sin zebra, y SHALL fijar `TableHeader` como `sticky top-0` con superficie
  opaca.

- **R11**: WHEN se renderiza `<Badge>`, THE SYSTEM SHALL aplicar radio
  `--radius-badge` (`0.25rem`) y ningún borde visible, conservando `text-xs`,
  peso 500 y el anillo de foco actual. `badge.tsx` SHALL NOT emitir
  `rounded-2xl`.

- **R12**: WHEN se abre `<DialogContent>`, THE SYSTEM SHALL aplicar radio
  `--radius-card`, padding `1.25rem` y `shadow-xl`, sobre un backdrop negro al
  30% con blur, conservando la animación de apertura existente y el botón de
  cierre con su texto accesible.

### No regresión

- **R13**: WHILE se ejecuta `pnpm test` en `frontend/`, THE SYSTEM SHALL dejar
  en verde los 6 tests que afirman sobre `className` **sin editar ninguna de sus
  aserciones**:

  | Archivo | Línea | Aserción que debe seguir cumpliéndose |
  |---|---|---|
  | `components/odc/executive-dashboard.test.tsx` | 272 | link contiene `focus-visible:ring` |
  | `components/odc/executive-dashboard.test.tsx` | 274 | existe algún `[class*="motion-reduce"]` |
  | `components/odc/general-approval-actions.test.tsx` | 342 | `flex-col.*sm:flex-row` en el nodo `aria-busy` |
  | `components/odc/general-dashboard.test.tsx` | 84 | `main` contiene `min-w-0` |
  | `components/odc/general-dashboard.test.tsx` | 86 | link contiene `flex-col.*sm:flex-row` |
  | `components/odc/monthly-summary.test.tsx` | 139 | contiene `odc-filter-results` |

  IF un cambio de primitiva rompiera una de esas aserciones, THEN THE SYSTEM
  SHALL conservar la clase en el componente en lugar de modificar el test.
  `pnpm build` SHALL terminar sin errores.

- **R14**: WHILE el usuario declara `prefers-reduced-motion: reduce`, THE SYSTEM
  SHALL desactivar toda animación, incluidas las que esta feature introduzca o
  modifique, añadiéndolas al bloque existente de `styles.css`. Toda transición
  de hover y de foco SHALL durar entre 150ms y 300ms; ninguna SHALL ser
  instantánea.

- **R15**: WHEN se cierra la feature, THE SYSTEM SHALL no haber añadido ninguna
  entrada nueva a `dependencies` ni a `devDependencies` de
  `frontend/package.json`, y ninguno de los archivos tocados de
  `components/ui/` SHALL contener color literal (hex crudo o clase de paleta
  Tailwind tipo `bg-slate-100`), con la única excepción del backdrop
  `bg-black/30` que el propio MASTER §6 prescribe para el diálogo.
  IF un cambio de primitiva obliga mecánicamente a tocar un archivo de
  `components/odc/` o `components/layout/`, THEN THE SYSTEM SHALL limitarse al
  ajuste mínimo que restaura el comportamiento previo y SHALL registrarlo en
  [[traceability]]; ningún otro archivo de esas dos carpetas SHALL cambiar.
  `components/odc/monthly-summary-slide.tsx` SHALL conservar íntegras sus clases
  de paleta literales (`bg-white`, `text-slate-*`, `border-slate-*`): es el
  render del PDF, siempre en claro, y la única excepción admitida a la regla de
  "cero color crudo en componentes".

## Fuera de alcance

- **Fases 3a–3e del plan** (features 24–26): rediseño de dashboards
  (`odc-dashboard.tsx`, `admin-dashboard.tsx`, `general-dashboard.tsx`,
  `executive-dashboard.tsx`, `executive-tasks.tsx`), detalle (`odc-detail.tsx`),
  formularios (`odc-form.tsx`, `register-payment-form.tsx`,
  `payment-evidence-form.tsx`, `upload-invoice-form.tsx`, `login-form.tsx`),
  resumen mensual (`monthly-summary.tsx`) y `odc-status-badge.tsx`.
  En particular, **los tokens `--status-*` de R4 se declaran pero todavía no se
  consumen**: sustituir las 8 clases Tailwind hardcodeadas de
  `odc-status-badge.tsx` es fase 3e.
- Validación en `blur` de los formularios (fase 3c): esta feature solo garantiza
  que `FieldError` emite `role="alert"`, no cambia cuándo aparece el error.
- `ui/toast.tsx`, que fija `rounded-2xl!` con `!`: no está en la lista de 9
  primitivas de la fase 2. El plan lo marca como "revisar tras cambiar los
  tokens"; queda para una feature posterior.
- Resto de primitivas de `components/ui/` no listadas en la fase 2 (`alert`,
  `avatar`, `calendar`, `collapsible`, `date-picker`, `dropdown-menu`, `label`,
  `pagination`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`).
- Backend, contratos TypeScript, rutas, permisos y cualquier regla del flujo de
  compra.
- Añadir librería de gráficas, de iconos o de animación (MASTER §5, §7).

## Enmiendas posteriores a la aprobación

| Fecha | Requisito | Cambio | Autoriza |
|---|---|---|---|
| 2026-08-10 | R2 | `--accent-action` de `oklch(0.5960 0.1274 163.23)` (#059669) a `oklch(0.5081 0.1049 165.61)` (#047857) | Humano, en sesión |

Motivo: R2 y R5 eran **contradictorios tal como se aprobaron**. R2 fijaba
`--accent-action-foreground` en blanco sobre `--accent-action` #059669, combinación que da
3.77:1 y viola el mínimo de 4.5:1 que exige R5. No existía implementación que cumpliera
ambos. Se corrige por el lado del verde, no del texto: #047857 da 5.48:1 con blanco y
coincide con `--status-done`, unificando el color de la acción de confirmar con el del
estado al que conduce. `--accent-action-foreground` vuelve a blanco, como fijaba R2.

Sobre el chroma resultante (0.1049), corrigiendo lo que decía una versión anterior de esta
nota (hallazgo D2 del reviewer): la restricción de chroma la impone **R3**, no R2, y es un
**techo** de `0.10`, no un suelo. `--accent-action` está **exento** de ese techo por
nombre, junto a `--status-*` y `--destructive`, tal como R3 se aprobó. Es decir: el nuevo
valor no "cumple" el límite, está fuera de su alcance por diseño. La exención es anterior
a esta enmienda —figura en el test desde `aa31027`— así que no se introdujo para dar
cabida al color nuevo.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-08-10) ← gate obligatorio antes de implementar
- [X] Enmienda de R2 aprobada por humano (fecha: 2026-08-10)
