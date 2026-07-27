---
name: ODC
description: Sistema interno de órdenes de compra con trazabilidad auditable.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.708 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  sidebar: "oklch(0.985 0 0)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  base: "0.625rem"
  control: "1rem"
  card: "24px"
spacing:
  compact: "0.5rem"
  control-inline: "0.75rem"
  section: "1.25rem"
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
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "{spacing.section}"
---

# Design System: ODC

## Overview

**Creative North Star: "Panel ejecutivo sobrio"**

ODC presenta el ciclo de compras como una superficie de trabajo serena y verificable. La interfaz prioriza estados, importes, evidencia y decisiones sin la teatralidad de un tablero de consumo: blanco, negro, grises funcionales y espacios cortos mantienen el foco en la operación.

La profundidad es contenida, pero tangible. Las tarjetas, diálogos y contenedores se separan con capas suavemente elevadas, anillos finos y sombras discretas; los controles responden con cambios de tono, anillo de foco y desplazamiento mínimo. El resultado debe sentirse táctil y confiable, no ornamental.

**Key Characteristics:**

- Neutros de alto contraste con color reservado para estado y riesgo.
- Densidad compacta para revisar y ejecutar tareas administrativas rápidamente.
- Jerarquía tipográfica clara: etiquetas pequeñas, títulos firmes e importes tabulares.
- Superficies redondeadas y suavemente elevadas que conservan un carácter profesional.

## Colors

La paleta es un sistema semántico monocromático: el contraste organiza el trabajo y el color sólo comunica estado, excepción o progreso.

### Primary

- **Grafito ejecutivo:** acción primaria, texto destacado y bloques de resumen en tema claro. En tema oscuro, el rol se invierte a un neutro claro para conservar contraste.

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

**The Status-Only Color Rule.** Fuera de errores y estados de ODC, la interfaz se apoya en neutros; no se introducen acentos de marca ni gradientes decorativos.

**The Inverted Ledger Rule.** El modo oscuro conserva los mismos roles semánticos invirtiendo fondo, superficie y texto; no crea una segunda identidad visual.

## Typography

**Display Font:** `ui-sans-serif, system-ui, sans-serif`
**Body Font:** `ui-sans-serif, system-ui, sans-serif`

**Character:** La tipografía es directa y funcional. Los títulos y cifras pesan lo suficiente para organizar una revisión rápida, mientras que las etiquetas en mayúsculas y los metadatos reducen su presencia sin perder legibilidad.

### Hierarchy

- **Display** (600, 2.25rem, 1.2, -0.025em): títulos de página y resúmenes de mayor jerarquía; puede crecer de 1.875rem a 2.25rem según el viewport.
- **Headline** (600, 1.875rem, 1.2, -0.025em): métricas destacadas y encabezados de bloques operativos.
- **Title** (500–600, 1rem–1.5rem): títulos de tarjetas, órdenes y diálogos.
- **Body** (400, 0.875rem, 1.5): lectura de formularios, tablas y contenido operativo.
- **Label** (600, 0.75rem, 0.12em, mayúsculas): nombres de métricas, campos y categorías; se reserva para información escaneable.

### Named Rules

**The Number-First Rule.** Importes, fechas y cifras operativas usan peso medio o semibold; los valores numéricos alineables usan cifras tabulares cuando el contexto lo requiere.

## Layout

La aplicación usa un shell con sidebar de 16rem en escritorio, colapsable a 3rem, y una hoja lateral de 18rem en móvil. El contenido ocupa el ancho restante y mantiene una densidad de aplicación administrativa, no de landing page.

El ritmo parte de una cuadrícula de 0.25rem: controles compactos de 2rem de alto, separaciones de 0.5rem–0.75rem dentro de acciones y 1.25rem dentro de tarjetas. Los títulos de página escalan de forma moderada en pantallas pequeñas; las tarjetas y listados conservan su jerarquía sin depender de grandes espacios vacíos.

## Elevation & Depth

ODC usa capas suavemente elevadas. Las superficies descansan sobre el color de fondo con `shadow-sm` y un anillo de primer plano al 5%; los diálogos aumentan a `shadow-xl` para señalar una decisión que bloquea el flujo. Los bordes y el cambio tonal separan la mayoría de los elementos, así que las sombras nunca son pesadas ni difusas por defecto.

### Shadow Vocabulary

- **Card lift** (`shadow-sm` + anillo de primer plano al 5%): tarjetas, estados de carga y superficies secundarias.
- **Dialog lift** (`shadow-xl` + anillo de primer plano al 5%): diálogos modales y decisiones con foco exclusivo.

### Named Rules

**The Gentle Layer Rule.** Una sombra confirma una capa de trabajo; no se usa para decorar botones, tablas ni cada bloque de contenido.

## Shapes

Los controles tienen esquinas amplias y consistentes: botones, campos y áreas de interacción usan una curva de 1rem; tarjetas y diálogos llegan a un máximo de 24px. Los bordes son finos y de bajo contraste, a menudo sustituidos por un anillo sutil. Las superficies no usan recortes angulosos ni formas expresivas.

## Components

### Buttons

**Character:** acciones compactas, táctiles y confiables.

- **Shape:** esquinas redondeadas (1rem), altura predeterminada de 2rem y padding lateral de 0.75rem.
- **Primary:** superficie de acción primaria con texto invertido; en hover reduce la intensidad de la superficie al 80%.
- **Outline / Ghost:** la alternativa visible usa borde de separación y fondo base; la alternativa ghost sólo revela superficie al hover o expansión.
- **Focus / Active:** foco con anillo de 3px al 30% y desplazamiento vertical de 1px al activar; estados deshabilitados al 50% de opacidad.

### Cards / Containers

**Character:** módulos de revisión claramente delimitados, nunca cajas pesadas.

- **Corner Style:** radio suave con tope de 24px.
- **Background:** superficie de tarjeta semántica, igual al papel operativo en tema claro.
- **Shadow Strategy:** `shadow-sm` y anillo discreto; el borde divisorio interno organiza cabeceras y contenido.
- **Internal Padding:** 1.25rem por defecto; 1rem para la variante compacta.

### Inputs / Fields

**Character:** controles discretos que se vuelven explícitos sólo durante la interacción.

- **Style:** 2rem de alto, fondo de entrada al 50%, sin borde fuerte y esquinas de 1rem.
- **Focus:** el borde toma el color de anillo y aparece un anillo de 3px al 30%.
- **Error / Disabled:** el error usa rojo y anillo atenuado; el estado deshabilitado reduce opacidad y bloquea interacción.

### Navigation

**Character:** navegación lateral compacta, utilitaria y adaptable.

- **Style:** sidebar de fondo propio, etiquetas de 0.75rem y acciones de menú con radio de 0.75rem.
- **State:** hover, activo y expandido usan superficie de sidebar; el estado activo añade peso medio.
- **Responsive:** en escritorio se colapsa a iconos; en móvil se presenta como hoja lateral.

### Status Badges

**Character:** etiquetas de estado informativas, no botones de acento.

- **Style:** badge sin borde y con peso medio, usando pares claros/oscuros por estado.
- **Semantic mapping:** borrador usa pizarra; pendiente, ámbar; presupuesto, cielo; compra, azul; pago, violeta; evidencia, cian; completada, esmeralda; rechazo, rojo.

### Dialogs

**Character:** decisiones puntuales, elevadas sobre una capa de enfoque.

- **Surface:** fondo popover, radio de hasta 24px y padding de 1.5rem.
- **Backdrop:** negro al 30% con desenfoque suave cuando el navegador lo permite.
- **Motion:** fade y zoom discretos de 100ms al abrir y cerrar.

## Do's and Don'ts

### Do:

- **Do** conservar los neutros como voz principal y usar color para estados de ODC, error o progreso.
- **Do** mantener controles compactos de 2rem con foco visible de 3px.
- **Do** usar tarjetas o diálogos sólo cuando representen una capa de trabajo real.
- **Do** mostrar importes y métricas con jerarquía fuerte y cifras tabulares cuando se comparen.
- **Do** respetar la inversión semántica completa entre tema claro y oscuro.

### Don't:

- **Don't** añadir gradientes, fondos ilustrativos o acentos de marca que compitan con los estados operativos.
- **Don't** aumentar la elevación de cada bloque: las sombras son una señal de capa, no un relleno visual.
- **Don't** usar bordes oscuros o gruesos para estructurar formularios y tablas; la separación debe mantenerse discreta.
- **Don't** convertir etiquetas, badges o color de estado en llamadas a la acción.
