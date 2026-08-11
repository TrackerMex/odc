# Plan de refactor UI — ODC

> Generado: 2026-08-10 · Fuente: `design-system/odc/MASTER.md` + overrides en
> `design-system/odc/pages/`
> Estado: fases 1–2 **implementadas y revisadas en navegador** (feature 23, done
> 2026-08-10). Fases 3a–3e pendientes. Ver §Revisión en navegador al final.

## Diagnóstico

La app no está mal construida: tiene view transitions, `prefers-reduced-motion`, foco
visible, `aria-busy`, `tabular-nums`, tabla semántica, skeletons y dark mode. Los
problemas son de sistema visual, no de calidad de código. Cuatro causas concretas:

1. **La paleta es acromática.** `--primary` es `oklch(0.205 0 0)` — gris. Un botón primario
   gris sobre fondo blanco es literalmente el default de shadcn sin tematizar. No hay
   ningún color que diga "esto es un sistema financiero".
2. **`--card` y `--background` son ambos `oklch(1 0 0)`.** Las tarjetas no se separan del
   fondo; toda la jerarquía descansa en bordes de 1px.
3. **Las fuentes instaladas nunca se importan.** `@fontsource-variable/inter` y
   `geist` están en `package.json` pero no hay un solo `import` en `frontend/src/`. La app
   renderiza con Segoe UI. Esta es la línea con mejor relación impacto/coste del plan.
4. **Radio y escala son de app de consumo.** `rounded-2xl` en cada caja, `--radius: 0.625rem`
   con controles que llegan a `rounded-xl`, títulos `text-4xl`, `tracking-[0.12em]` en
   labels de 12px, campos envueltos en cajas grises. Ocupa el doble de espacio del que una
   herramienta de escritorio de uso diario debería gastar.

Ninguna de las cuatro requiere reescribir componentes. Tres son cambios de token.

---

## Fase 1 — Fundación de tokens

**Archivos:** `frontend/src/styles.css`, `frontend/src/routes/__root.tsx`

| Cambio | Detalle |
|---|---|
| Importar Inter | `@fontsource-variable/inter` en el root; `--font-sans` en `@theme inline` |
| Paleta navy | `--primary`, `--ring`, `--background`, `--card`, `--border`, `--muted-foreground` a los `oklch` del Master §1 |
| Tokens de estado | 8 pares `--status-*` / `--status-*-surface`, light y dark |
| Radio | `--radius: 0.375rem`; nuevo `--radius-card: 0.625rem` |
| Escala de espaciado | `--space-*` del Master §3 |
| Dark mode | Invertir roles conservando la Inverted Ledger Rule; **arreglar** `--sidebar-primary: oklch(0.488 0.243 264.376)` (violeta huérfano en dark, no corresponde a ningún token del sistema) |

**Riesgo de tests:** ninguno. Ningún test lee variables CSS.
**Verificación:** contraste ≥4.5:1 en los 8 pares de estado y en `destructive/10` sobre
dark, que es el par más frágil.

Esta fase sola resuelve las causas 1, 2 y 3. Es la que hay que hacer primero y evaluar
antes de seguir.

---

## Fase 2 — Primitivas

**Archivos:** `components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`,
`select.tsx`, `textarea.tsx`, `table.tsx`, `field.tsx`, `dialog.tsx`

| Cambio | Detalle |
|---|---|
| Botón | `h-8`, radio `--radius`, peso 500; nueva variante `confirm` (verde) |
| Card | Radio `--radius-card`, padding `1rem`, `shadow-xs` + border; sin hover elevado |
| Input/Select/Textarea | `h-8`, radio `--radius`, foco `ring-[3px] ring-ring/30` |
| Table | Fila `h-9`, header sticky, `border-b` 1px, wrapper `overflow-x-auto` |
| Badge | Radio `0.25rem`, sin borde |
| Field | `role="alert"` en `FieldError` — arregla los 5 formularios de una vez |
| Global | Reemplazar `rounded-xl` / `rounded-2xl` sueltos por los tokens |

**Riesgo de tests:** bajo. Los tests consultan por rol y texto.
**Excepción:** `ui/toast.tsx:43` fija `rounded-2xl!` con `!`. Revisar si el override sigue
haciendo falta tras cambiar los tokens.

---

## Fase 3 — Superficies

### 3a. Dashboards
`components/odc/odc-dashboard.tsx`, `admin-dashboard.tsx`, `general-dashboard.tsx`,
`executive-dashboard.tsx`, `executive-tasks.tsx` — ver `pages/dashboard.md`.
Header compacto, `max-w-[1400px]`, barra de acento por cola, contadores a `text-2xl`.

### 3b. Detalle
`components/odc/odc-detail.tsx` — ver `pages/odc-detail.md`.
Sustituir `DetailItem` (caja gris) por filas de definición; timeline con puntos
coloreados por estado; total como único punto de énfasis. **Es el cambio de mayor impacto
visual del plan** y el más grande en líneas.

### 3c. Formularios
`components/odc/odc-form.tsx`, `register-payment-form.tsx`, `payment-evidence-form.tsx`,
`upload-invoice-form.tsx`, `login-form.tsx` — ver `pages/odc-form.md`.
Validación en blur, comentarios bajo `Collapsible`, panel de total con jerarquía.

### 3d. Resumen mensual
`components/odc/monthly-summary.tsx` — ver `pages/monthly-summary.md`.
Barras horizontales por etapa (sin librería nueva), total a `text-3xl`, tabla con
`overflow-x-auto`.

### 3e. Badge de estado
`components/odc/odc-status-badge.tsx` — sustituir las 8 clases Tailwind hardcodeadas por
los tokens `--status-*`. Archivo pequeño, alto valor: desbloquea el uso del color de
estado en el timeline y en las barras del resumen.

---

## Tests en riesgo

Seis tests consultan `className`. Ninguno se borra; se conserva la clase o se actualiza la
aserción con justificación.

| Test | Aserción | Fase | Acción |
|---|---|---|---|
| `executive-dashboard.test.tsx:272` | link contiene `focus-visible:ring` | 3a | **Conservar la clase.** El foco no se toca |
| `executive-dashboard.test.tsx:274` | existe algún `[class*="motion-reduce"]` | 3a | Conservar |
| `general-approval-actions.test.tsx:342` | `flex-col.*sm:flex-row` | 3b | Conservar el patrón responsive |
| `general-dashboard.test.tsx:84` | `main` contiene `min-w-0` | 3a | Conservar |
| `general-dashboard.test.tsx:86` | link contiene `flex-col.*sm:flex-row` | 3a | Conservar |
| `monthly-summary.test.tsx:139` | contiene `odc-filter-results` | 3d | Conservar clase y keyframe |

Riesgo adicional, **fase 3c**: añadir validación en `blur` puede hacer que aparezcan
errores antes de lo que esperan algunos casos de `odc-form.test.tsx`,
`register-payment-form.test.tsx` (358 líneas) y `upload-invoice-form.test.tsx` (409
líneas). Se revisan uno a uno; si un caso deja de ser válido porque el comportamiento
mejoró, se actualiza la aserción y se anota en la traceability. No se borra ninguno.

---

## Cómo ejecutarlo

Las fases 1 y 2 son un cambio transversal de tokens y primitivas: una feature.
La fase 3 son cinco superficies independientes que pueden ir por separado.

| id | name | priority | alcance | estado |
|---|---|---|---|---|
| 23 | `ui-design-tokens` | P1 | Fases 1 + 2 | **done** (2026-08-10) |
| 24 | `ui-dark-mode-chroma` | P1 | Corrección de dark, ver §Revisión en navegador | **pending** — añadida tras la revisión visual |
| 25 | `ui-surfaces-dashboards` | P2 | 3a + 3e | propuesta, sin añadir |
| 26 | `ui-surfaces-detail-forms` | P2 | 3b + 3c | propuesta, sin añadir |
| 27 | `ui-surfaces-monthly-summary` | P3 | 3d | propuesta, sin añadir |

La 24 no estaba prevista: sale de mirar el resultado de la 23 en un navegador. Va **antes**
que las superficies, para que 25–27 se diseñen sobre un dark ya correcto.

Cada una pasa por el ciclo SDD normal: `spec_author` → gate humano → `implementer` con TDD
→ `reviewer`. Una feature a la vez.

La 23 ya se vio corriendo (§Revisión en navegador), y esa revisión es la que produjo la 24.
Las 25–27 se especifican después de cerrar la 24, por el mismo motivo: conviene decidir las
superficies mirando el resultado, no este documento.

---

## Decisiones tomadas al generar el design system

Registradas aquí para que sean auditables:

1. **El bloque `STYLE` de ui-ux-pro-max se descartó.** Devolvió "Exaggerated Minimalism"
   (fashion/portfolios/luxury) con tres queries distintas, y un patrón de página de
   landing con CTA de "Start trial". Misruteo del ranker. Se usó la fila autoritativa de
   `products.csv` (Invoice & Billing Tool → Minimalism + Flat / Swiss Modernism 2.0 /
   Accessible & Ethical).
2. **Pairing Fira Code/Fira Sans descartado** a favor de Inter, que ya está instalado y es
   el pairing "Minimal Swiss" de la propia DB para admin panels.
3. **Preset GSAP + ScrollTrigger descartado.** La app ya tiene view transitions y keyframes
   que cubren el tier Subtle; ScrollTrigger resuelve un patrón de landing que aquí no
   existe.
4. **Librería de iconos Phosphor descartada** a favor de Lucide, ya instalado.
5. **Conflicto de color resuelto** enmendando la Status-Only Color Rule de `/DESIGN.md` a
   una Two-Color Rule. Ver `MASTER.md` §9.
6. **`monthly-summary-slide.tsx` mantiene sus colores hardcodeados.** Es el render del PDF,
   siempre en claro. Única excepción admitida.

## Decisiones humanas ya tomadas (2026-08-10)

- **`design-system/odc/MASTER.md` es la fuente única de verdad.** `/DESIGN.md` queda
  subordinado y sincronizado: sus 7 conflictos se aplicaron en frontmatter y cuerpo, y
  lleva un banner "derivado, no editar a mano". Se conserva porque la skill `impeccable`
  lo lee automáticamente vía `scripts/context.mjs`; abandonarlo sin más habría dejado a
  esa skill alimentando reglas viejas.
- **Feature 23 `ui-design-tokens` añadida** a `feature_list.json` como `pending`, P1.
  Siguiente paso del ciclo SDD: `spec_author` escribe
  `specs/ui-design-tokens/requirements.md` y **para** hasta aprobación humana.

## Nota de mantenimiento

`.impeccable/design.json` es una caché generada de `/DESIGN.md` (`generatedAt`
2026-07-27) y quedó obsoleta con esta sincronización. La regenera la propia skill; no se
edita a mano.

---

## Revisión en navegador (2026-08-10, tras cerrar la #23)

Ejecutada sobre `pnpm vite dev --port 3005` contra el backend del contenedor, sesión
`ops@odc.local` (DIRECTOR_OPS), 1440×900. Valores tomados con `getComputedStyle` en vivo,
no deducidos del código.

### Confirmado correcto (light)

Las cuatro causas del diagnóstico inicial están resueltas y verificadas en el navegador:

| Token | Valor computado |
|---|---|
| `body` background | `oklch(0.9842 0.0034 247.86)` — frío, ya no blanco |
| card background | `oklch(1 0 0)` — se separa del fondo por tono, no solo por borde |
| card border-radius | `10px` (`--radius-card`) |
| `font-family` | `"Inter Variable", ui-sans-serif, system-ui` — **la fuente carga de verdad** |
| `--primary` | `oklch(0.3462 0.0736 256.04)` — navy |
| `--radius` / `--radius-card` / `--radius-badge` | `0.375rem` / `0.625rem` / `0.25rem` |

### D-V1 — dark mode lava la acción primaria (motiva la feature 24)

`--primary` en `.dark` resuelve a `oklch(0.7137 0.0692 254.62)`. A lightness 0.71, un
chroma de 0.069 no lee como color: el botón primario parece deshabilitado. Se ve peor en
`odc-form.tsx`, donde "Enviar a Administración" queda al lado de un outline que pesa más
que él.

**La causa es la regla, no el valor.** El techo de chroma `0.10` de R3 es correcto en
light, donde el navy vive a lightness 0.35, pero se aplicó igual a `.dark`, donde el token
sube a 0.71. R3 se redactó mirando solo light. Ningún test lo detecta: el contraste pasa
de sobra (es un problema de saturación percibida, no de luminancia).

Dirección propuesta para la spec de la 24: que el techo de chroma dependa de la lightness
del token en lugar de ser un número plano, o que se declare por tema. No fijar el valor
nuevo en el requisito sin comprobarlo antes en pantalla — es el error que produjo D-V1.

### D-V2 — el verde unificado no lo está en dark

En `:root`, `--accent-action` y `--status-done` son idénticos
(`oklch(0.5081 0.1049 165.61)`), que es justo lo que buscaba la enmienda firmada. En
`.dark` divergen: `--accent-action` es `oklch(0.7227 0.1394 165.61)` y `--status-done` es
`oklch(0.8200 0.0630 165.61)`. `MASTER.md` §1 afirma que comparten color sin acotarlo a
light. Entra en el alcance de la 24.

### D-V3 — la densidad no llegó a los botones que se usan

Los CTA principales de `odc-form.tsx:370,380` y `odc-dashboard.tsx:158,163` usan
`size="lg"` → 36px computados. La primitiva por defecto sí mide 32px y cumple R7: son las
superficies las que la sobreescriben. No es defecto de la #23; es trabajo de las fases
3a/3c. Anotado para que nadie concluya que el dial de densidad no funcionó.

### D-V4 — el anidamiento de cajas del detalle sigue intacto

Confirmado visualmente: `odc-detail.tsx` renderiza hasta 9 `DetailItem` como cajas grises
dentro de secciones que a su vez son cajas dentro de una `Card`. Previsto y fuera del
alcance de la #23. Verlo confirma que la fase 3b es la de mayor impacto de lo que queda.

### No verificado

**Responsive a 375px.** `resize_window` no tuvo efecto: tras pedir 390px, `innerWidth`
seguía en 1864. A ancho de escritorio no hay scroll horizontal
(`scrollWidth == clientWidth == 1849`). El punto correspondiente del checklist de
`MASTER.md` §10 **sigue sin comprobar** y no debe darse por bueno.

### Ajenos al refactor visual

- `login-form.tsx` rotula `Email` y `Password` en inglés en una aplicación que es toda en
  español.
- El `<title>` del documento sigue siendo `TanStack Start Starter`.
