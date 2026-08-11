---
name: ODC
description: Sistema interno de órdenes de compra con trazabilidad auditable.
colors:
  background: "oklch(0.9842 0.0034 247.86)"
  foreground: "oklch(0.2077 0.0398 265.75)"
  primary: "oklch(0.3462 0.0736 256.04)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.9632 0.0034 247.86)"
  muted: "oklch(0.9632 0.0034 247.86)"
  muted-foreground: "oklch(0.5544 0.0407 257.42)"
  border: "oklch(0.9268 0.0063 255.48)"
  input: "oklch(0.9268 0.0063 255.48)"
  ring: "oklch(0.3462 0.0736 256.04)"
  destructive: "oklch(0.5771 0.2152 27.33)"
  sidebar: "oklch(1 0 0)"
typography:
  display:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  base: "0.375rem"
  control: "0.375rem"
  card: "0.625rem"
spacing:
  compact: "0.5rem"
  control-inline: "0.75rem"
  section: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 0.75rem"
    height: "2rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 0.75rem"
    height: "2rem"
  card-default:
    backgroundColor: "oklch(1 0 0)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "{spacing.section}"
---

> **DERIVADO — NO EDITAR A MANO.**
> La fuente única de verdad del sistema de diseño de ODC es
> [`design-system/odc/MASTER.md`](design-system/odc/MASTER.md), con sus overrides por
> página en `design-system/odc/pages/`.
>
> Este archivo existe porque la skill `impeccable` lo lee automáticamente
> (`.claude/skills/impeccable/scripts/context.mjs`). Se mantiene sincronizado con MASTER
> para que ninguna herramienta reciba reglas contradictorias. Si MASTER y este archivo
> discrepan, **MASTER gana** y este archivo está desactualizado.
>
> `.impeccable/design.json` es una caché generada de este archivo; queda obsoleta tras
> cada edición y la regenera la propia skill.

# Design System: ODC

## Overview

**Creative North Star: "Panel ejecutivo sobrio"**

ODC presenta el ciclo de compras como una superficie de trabajo serena y verificable. La interfaz prioriza estados, importes, evidencia y decisiones sin la teatralidad de un tablero de consumo: navy institucional, neutros fríos y espacios cortos mantienen el foco en la operación.

La profundidad es contenida, pero tangible. Las tarjetas, diálogos y contenedores se separan con capas suavemente elevadas, anillos finos y sombras discretas; los controles responden con cambios de tono, anillo de foco y desplazamiento mínimo. El resultado debe sentirse táctil y confiable, no ornamental.

**Key Characteristics:**

- Navy institucional sobre neutros fríos, con hues reservados a estado y riesgo.
- Densidad compacta para revisar y ejecutar tareas administrativas rápidamente.
- Jerarquía tipográfica clara: etiquetas pequeñas, títulos firmes e importes tabulares.
- Superficies redondeadas y suavemente elevadas que conservan un carácter profesional.

## Colors

La paleta es un sistema semántico de dos voces: un navy institucional para el chrome y la acción, y hues de estado para comunicar en qué punto del ciclo está una orden. Todo lo demás son neutros fríos.

### Primary

- **Navy institucional** `oklch(0.3462 0.0736 256.04)`: acción primaria, anillo de foco, texto destacado y bloques de resumen en tema claro. En tema oscuro, el rol se invierte a un neutro claro para conservar contraste.

### Accent

- **Verde de liquidación** `oklch(0.5960 0.1274 163.23)`: reservado a la confirmación de pago y al cierre de la orden. No es el color de todos los CTA.

### Secondary

- **Gris de trabajo:** fondos secundarios, controles neutros y estados hover de bajo énfasis.

### Tertiary

- **Rojo de excepción:** errores, rechazo y validación fallida; se usa con fondo suavizado, nunca como decoración.

### Neutral

- **Papel operativo:** la superficie base clara y el fondo de tarjetas en tema claro.
- **Tinta de registro:** texto principal, métricas y contraste estructural.
- **Línea de separación:** bordes, campos y divisiones de baja prominencia.
- **Texto de contexto:** descripciones, ayudas y metadatos secundarios.

### Named Rules

**The Two-Color Rule.** La interfaz tiene exactamente dos voces cromáticas: el navy institucional para chrome, acción primaria y foco; y los hues de estado para el ciclo de una orden. Cualquier otro color está prohibido, igual que los gradientes decorativos. El navy no es ornamento de marca: es lo que distingue una acción primaria de una secundaria, distinción que un gris acromático no puede hacer.

*(Sustituye a la Status-Only Color Rule original, que prohibía todo acento. Motivo del cambio y alternativas descartadas en `design-system/odc/MASTER.md` §9.)*

**The Inverted Ledger Rule.** El modo oscuro conserva los mismos roles semánticos invirtiendo fondo, superficie y texto; no crea una segunda identidad visual.

## Typography

**Display Font:** `Inter Variable` (`@fontsource-variable/inter`)
**Body Font:** `Inter Variable` (`@fontsource-variable/inter`)

**Character:** La tipografía es directa y funcional. Los títulos y cifras pesan lo suficiente para organizar una revisión rápida, mientras que las etiquetas en mayúsculas y los metadatos reducen su presencia sin perder legibilidad.

### Hierarchy

- **Display** (600, 1.875rem, 1.2, -0.02em): títulos de página y resúmenes de mayor jerarquía.
- **Headline** (600, 1.5rem, 1.2, -0.02em): métricas destacadas y encabezados de bloques operativos.
- **Title** (500–600, 1rem–1.25rem): títulos de tarjetas, órdenes y diálogos.
- **Body** (400, 0.875rem, 1.5): lectura de formularios, tablas y contenido operativo.
- **Label** (600, 0.75rem, 0.06em, mayúsculas): nombres de métricas, campos y categorías; se reserva para información escaneable.

### Named Rules

**The Number-First Rule.** Importes, fechas y cifras operativas usan peso medio o semibold; los valores numéricos alineables usan cifras tabulares cuando el contexto lo requiere.

## Layout

La aplicación usa un shell con sidebar de 16rem en escritorio, colapsable a 3rem, y una hoja lateral de 18rem en móvil. El contenido ocupa el ancho restante y mantiene una densidad de aplicación administrativa, no de landing page.

El ritmo parte de una cuadrícula de 0.25rem: controles compactos de 2rem de alto, separaciones de 0.5rem–0.75rem dentro de acciones y 1rem dentro de tarjetas. Las vistas de datos llegan a 1400px o ancho completo; no se centra el contenido en 1200px dejando aire lateral en una herramienta de escritorio de uso diario. Los títulos de página escalan de forma moderada en pantallas pequeñas; las tarjetas y listados conservan su jerarquía sin depender de grandes espacios vacíos.

## Elevation & Depth

ODC usa capas suavemente elevadas. Las superficies descansan sobre el color de fondo con `shadow-xs` y un borde de 1px; los diálogos aumentan a `shadow-xl` para señalar una decisión que bloquea el flujo. Los bordes y el cambio tonal separan la mayoría de los elementos, así que las sombras nunca son pesadas ni difusas por defecto.

### Shadow Vocabulary

- **Card lift** (`shadow-xs` + borde de 1px): tarjetas, estados de carga y superficies secundarias.
- **Dialog lift** (`shadow-xl` + anillo de primer plano al 5%): diálogos modales y decisiones con foco exclusivo.

### Named Rules

**The Gentle Layer Rule.** Una sombra confirma una capa de trabajo; no se usa para decorar botones, tablas ni cada bloque de contenido.

## Shapes

Los controles tienen esquinas cerradas y consistentes: botones, campos y áreas de interacción usan una curva de 0.375rem; tarjetas y diálogos llegan a 0.625rem; los badges, a 0.25rem. Un radio amplio sobre un control de 2rem produce una cápsula, lectura de app de consumo que no corresponde a una herramienta financiera. Los bordes son finos y de bajo contraste, a menudo sustituidos por un anillo sutil. Las superficies no usan recortes angulosos ni formas expresivas.

## Components

### Buttons

**Character:** acciones compactas, táctiles y confiables.

- **Shape:** esquinas cerradas (0.375rem), altura predeterminada de 2rem y padding lateral de 0.75rem. Área táctil mínima de 44×44px en móvil, resuelta con padding y no con altura del control.
- **Primary:** navy institucional con texto invertido; en hover reduce la intensidad de la superficie al 80%.
- **Confirm:** verde de liquidación, exclusivo para registrar pago y completar la orden.
- **Outline / Ghost:** la alternativa visible usa borde de separación y fondo base; la alternativa ghost sólo revela superficie al hover o expansión.
- **Focus / Active:** foco con anillo de 3px al 30% y desplazamiento vertical de 1px al activar; estados deshabilitados al 50% de opacidad.

### Cards / Containers

**Character:** módulos de revisión claramente delimitados, nunca cajas pesadas.

- **Corner Style:** radio de 0.625rem.
- **Background:** blanco puro sobre el fondo frío de la aplicación; la tarjeta se separa por tono, no solo por borde.
- **Shadow Strategy:** `shadow-xs` y borde de 1px; el borde divisorio interno organiza cabeceras y contenido. Sin elevación ni desplazamiento en hover.
- **Internal Padding:** 1rem por defecto; 0.75rem para la variante compacta.

### Inputs / Fields

**Character:** controles discretos que se vuelven explícitos sólo durante la interacción.

- **Style:** 2rem de alto, fondo de entrada al 50%, sin borde fuerte y esquinas de 0.375rem.
- **Focus:** el borde toma el color de anillo y aparece un anillo de 3px al 30%.
- **Error / Disabled:** el error usa rojo y anillo atenuado; el estado deshabilitado reduce opacidad y bloquea interacción.
- **Validación:** en `blur`, no solo al enviar. El mensaje de error va junto al campo y se anuncia con `role="alert"`; nunca un borde rojo sin texto ni un resumen únicamente al inicio del formulario.

### Navigation

**Character:** navegación lateral compacta, utilitaria y adaptable.

- **Style:** sidebar de fondo propio, etiquetas de 0.75rem y acciones de menú con radio de 0.75rem.
- **State:** hover, activo y expandido usan superficie de sidebar; el estado activo añade peso medio.
- **Responsive:** en escritorio se colapsa a iconos; en móvil se presenta como hoja lateral.

### Status Badges

**Character:** etiquetas de estado informativas, no botones de acento.

- **Style:** badge sin borde, radio de 0.25rem y peso medio, usando pares token texto/superficie por estado (`--status-*` / `--status-*-surface`). Sin clases de color hardcodeadas.
- **Semantic mapping:** borrador usa pizarra; pendiente, ámbar; presupuesto, cielo; compra, azul; pago, violeta; evidencia, cian; completada, esmeralda; rechazo, rojo.
- **El color nunca comunica solo:** el badge lleva siempre su etiqueta textual y su atributo `data-status`.

### Dialogs

**Character:** decisiones puntuales, elevadas sobre una capa de enfoque.

- **Surface:** fondo popover, radio de 0.625rem y padding de 1.25rem.
- **Backdrop:** negro al 30% con desenfoque suave cuando el navegador lo permite.
- **Motion:** fade y zoom discretos de 100ms al abrir y cerrar.

## Do's and Don'ts

### Do:

- **Do** conservar el navy y los neutros como voz principal y usar color de estado para el ciclo de la orden, error o progreso.
- **Do** mantener controles compactos de 2rem con foco visible de 3px.
- **Do** usar tarjetas o diálogos sólo cuando representen una capa de trabajo real.
- **Do** mostrar importes y métricas con jerarquía fuerte y cifras tabulares cuando se comparen.
- **Do** respetar la inversión semántica completa entre tema claro y oscuro.

### Don't:

- **Don't** añadir gradientes, fondos ilustrativos o cualquier color fuera del navy y los hues de estado.
- **Don't** usar el verde de liquidación fuera de registrar pago y completar la orden.
- **Don't** elevar ni desplazar tarjetas y filas en hover; una tabla que levita al pasar el ratón es ruido, no feedback.
- **Don't** aumentar la elevación de cada bloque: las sombras son una señal de capa, no un relleno visual.
- **Don't** usar bordes oscuros o gruesos para estructurar formularios y tablas; la separación debe mantenerse discreta.
- **Don't** convertir etiquetas, badges o color de estado en llamadas a la acción.
