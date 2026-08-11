---
feature: "ui-surfaces-dashboards"
status: draft        # draft | approved
tags: [harness, spec, frontend, design-system, surfaces, dashboards]
---

# Requisitos — [[ui-surfaces-dashboards]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

Alcance: **fases 3a + 3e** de `progress/ui-redesign-plan.md`, ni más ni menos.
Fuente normativa del contenido visual: `design-system/odc/MASTER.md` y su override
de superficie `design-system/odc/pages/dashboard.md`, que **sobrescribe** al MASTER
donde discrepan. Origen adicional: el defecto **D-V3** de la §"Revisión en
navegador (2026-08-10)" del plan.

Archivos de la aplicación en alcance (seis):

| Archivo | Fase |
|---|---|
| `frontend/src/components/odc/odc-dashboard.tsx` | 3a |
| `frontend/src/components/odc/admin-dashboard.tsx` | 3a |
| `frontend/src/components/odc/general-dashboard.tsx` | 3a |
| `frontend/src/components/odc/executive-dashboard.tsx` | 3a |
| `frontend/src/components/odc/executive-tasks.tsx` | 3a |
| `frontend/src/components/odc/odc-status-badge.tsx` | 3e |

## Relación con las features 23 y 24 (ambas `done`)

Esta feature **consume** lo que aquellas dejaron; no reabre nada de las dos.

| Qué dejaron cerrado | Qué hace esta feature |
|---|---|
| Los 8 pares `--status-*` / `--status-*-surface` declarados en `:root` y en `.dark`, expuestos en `@theme inline` como `--color-status-*` (feature 23, R4) | Los **consume** por primera vez (R1). La feature 23 los declaró explícitamente sin consumirlos: sustituir las 8 clases hardcodeadas era, por su propia sección de Fuera de alcance, la fase 3e |
| Contraste ≥ 4.5:1 auditado en los 16 pares de estado, en light y en dark (feature 23 R5 + feature 24 R6) | Se apoya en él. Ningún par nuevo aparece; el badge pasa de clases de paleta **sin auditar** a los pares auditados |
| `.dark --primary` = `oklch(0.6800 0.1400 254.62)`, con suelo y techo de saturación, y `--ring` / `--sidebar-*` siguiéndolo (feature 24, R2–R4) | **Intacto.** Esta feature no toca `frontend/src/styles.css` (R15) |
| El techo de saturación congelado `0.2126` (feature 24, R1) | **Intacto.** No se declara ningún token nuevo |
| Primitivas `button`, `card`, `badge` con `h-8`, `--radius-card` y `--radius-badge` (feature 23, R7/R9/R11) | Deja de sobreescribirlas en las superficies (R6, R10). D-V3 dice justamente que el dial de densidad de la 23 sí funciona: eran las superficies las que lo anulaban |

Esta spec **no** requiere enmendar las specs 23 ni 24. Si la implementación
descubriera lo contrario, R15 fija qué hacer: parar y reportar, nunca enmendar
por cuenta propia.

## Requisitos funcionales

### Fase 3e — Badge de estado (`odc-status-badge.tsx`)

Es la palanca: archivo pequeño, y es lo que desbloquea el color de estado para el
timeline de la feature 26 y las barras de la 27. Va primero (ver [[tasks]]).

- **R1**: WHEN se renderiza `<OdcStatusBadge>` con cualquiera de los 8 valores de
  `OdcStatus`, THE SYSTEM SHALL tomar su color de texto del token
  `--status-<x>` y su fondo del token `--status-<x>-surface`, mediante las
  utilidades que `@theme inline` ya expone, según esta tabla del MASTER §1:

  | `OdcStatus` | Token de texto | Token de superficie |
  |---|---|---|
  | `BORRADOR` | `--status-draft` | `--status-draft-surface` |
  | `PENDIENTE_ADMIN` | `--status-pending` | `--status-pending-surface` |
  | `PRESUPUESTO_APROBADO` | `--status-budget` | `--status-budget-surface` |
  | `COMPRA_APROBADA` | `--status-approved` | `--status-approved-surface` |
  | `PAGO_REGISTRADO` | `--status-paid` | `--status-paid-surface` |
  | `EVIDENCIA_PAGO_SUBIDA` | `--status-evidence` | `--status-evidence-surface` |
  | `COMPLETADA` | `--status-done` | `--status-done-surface` |
  | `RECHAZADA` | `--status-rejected` | `--status-rejected-surface` |

  THE SYSTEM SHALL NOT dejar en `odc-status-badge.tsx` ninguna de las 8 clases de
  paleta Tailwind que hoy tiene (`bg-slate-100`, `dark:bg-amber-950`, …), y el
  mapa de estilos SHALL NOT contener **ninguna variante `dark:`**: la inversión
  por tema ya vive en los tokens declarados en `.dark`, y duplicarla en el
  componente reintroduciría la clase de defecto que esta feature elimina.
  THE SYSTEM SHALL NOT declarar tokens nuevos ni modificar
  `frontend/src/styles.css`.

- **R2**: WHEN se renderiza `<OdcStatusBadge>`, THE SYSTEM SHALL conservar el
  atributo `data-status` con el valor crudo del estado, la etiqueta textual
  `statusLabel(status)` como contenido visible, la ausencia de borde, el radio
  `--radius-badge` que aporta la primitiva y la transición de 150ms con su
  `motion-reduce:transition-none`. THE SYSTEM SHALL seguir siendo una etiqueta
  informativa, nunca un control. IF el color quedara como único portador de la
  información de estado, THEN el requisito está incumplido: la regla obligatoria
  del MASTER §1 (`ux-guidelines.csv`, Charts & Data) exige que el color nunca
  comunique solo.

### Fase 3a — Dashboards (los cinco archivos restantes)

- **R3**: WHEN se renderiza cualquiera de las cinco superficies, THE SYSTEM SHALL
  limitar su contenedor de contenido a `max-w-[1400px]` — sustituyendo las 5
  apariciones de `max-w-7xl` (`odc-dashboard.tsx:141`, `admin-dashboard.tsx:116`,
  `general-dashboard.tsx:23`, `executive-dashboard.tsx:471` y `:493`) y el
  `max-w-5xl` de `executive-tasks.tsx:91` — y SHALL aplicar al `main` el padding
  de página `p-4 sm:p-6`, sin el escalón `lg:p-8` (6 apariciones). El `main`
  SHALL conservar `min-w-0 flex-1`. Motivo: `pages/dashboard.md` §Layout y
  MASTER §3, que prohíbe explícitamente el contenido centrado por debajo de
  1200px con aire a los lados en una herramienta de escritorio de uso diario.

- **R4**: WHEN se renderiza el header de cualquiera de las cinco superficies,
  THE SYSTEM SHALL reducir el `h1` a un solo escalón tipográfico sin salto
  responsive (`text-2xl`, sustituyendo `text-3xl sm:text-4xl` en las 5
  apariciones) y SHALL eliminar el párrafo descriptivo que hoy va bajo el saludo
  en las 5 superficies (`odc-dashboard.tsx:150`, `admin-dashboard.tsx:124`,
  `general-dashboard.tsx:31`, el `copy.description` de
  `executive-dashboard.tsx:137` y `executive-tasks.tsx:96`). THE SYSTEM SHALL
  conservar el saludo/título del `h1` y el eyebrow de rol, ambos afirmados por
  tests existentes (ver R12). Motivo: `pages/dashboard.md` §Header — el header
  ocupa hoy ~180px de franja muerta permanente y el párrafo es texto de
  onboarding en una pantalla que el usuario ve 20 veces al día.

- **R5**: WHEN se renderiza cualquier etiqueta en mayúsculas de los seis archivos,
  THE SYSTEM SHALL usar el tracking de label del MASTER §2, `0.06em`,
  conservando `text-xs` y peso 600. Ninguno de los seis archivos SHALL contener
  una clase `tracking-[0.1em]`, `tracking-[0.12em]`, `tracking-[0.14em]` ni
  `tracking-[0.18em]` (14 apariciones hoy). Motivo: `0.12em`–`0.18em` sobre 12px
  es tracking de póster, ilegible en una fila de tabla (MASTER §2, y
  `pages/dashboard.md` §Header para el eyebrow).

- **R6**: WHEN una de las cinco superficies renderiza una acción — `<Button>` o
  `Link` con `buttonVariants` —, THE SYSTEM SHALL NOT usar `size="lg"`, que
  produce 36px (`h-9`) en `odc-dashboard.tsx:158` y `:163`, y SHALL usar
  `size="sm"` (lo que prescribe `pages/dashboard.md` §Header) o el tamaño por
  defecto de la primitiva; ambos ≤ 32px. Este es el defecto **D-V3**: la
  densidad de la feature 23 no llegó a los botones que la gente usa porque las
  superficies sobreescribían la primitiva. THE SYSTEM SHALL NOT alterar ninguna
  clase de foco al hacerlo, y el área táctil mínima de 44px del MASTER §6 SHALL
  seguir resolviéndose con padding, nunca subiendo la altura del control.

- **R7**: WHEN se renderiza una tarjeta que representa **una sola cola de
  estado** — `QueueCard` de `odc-dashboard.tsx`, `AdminQueue` de
  `admin-dashboard.tsx` y la tarjeta única de `general-dashboard.tsx` —,
  THE SYSTEM SHALL mostrar una barra de acento vertical de 2px en el borde
  izquierdo del header con el token `--status-*` del estado de esa cola (mapa en
  [[design]]), SHALL usar el radio `--radius-card`, SHALL usar `1rem` de padding
  en el `CardHeader` con `pb-3`, y SHALL bajar el alto mínimo del estado vacío a
  `min-h-20` conservando su borde discontinuo y su mensaje accionable.
  THE SYSTEM SHALL NOT añadir barra de acento a la tarjeta "Prioridad inmediata"
  de `executive-dashboard.tsx` ni a "Tareas accionables" de `executive-tasks.tsx`:
  ambas agregan órdenes de varios estados a la vez y un solo color mentiría sobre
  su contenido.

- **R8**: WHEN una tarjeta de cola muestra su contador (`page.total` en las tres
  superficies de cola, `priority.total` en `executive-dashboard.tsx:177`),
  THE SYSTEM SHALL renderizarlo a `text-2xl` con `tabular-nums` y color
  `--muted-foreground`. IF la cola representa trabajo bloqueado (`RECHAZADA`),
  THEN THE SYSTEM SHALL usar `--status-rejected` como color de ese contador.
  Ninguna de las 4 apariciones de `text-3xl` en contadores SHALL sobrevivir
  (`pages/dashboard.md` §Tarjetas de cola).

- **R9**: WHEN se renderiza una fila de orden en las listas de cola, THE SYSTEM
  SHALL usar `py-2` en las listas de una línea (`odc-dashboard.tsx:102`,
  `admin-dashboard.tsx:77`, `general-dashboard.tsx:71`) y SHALL NOT superar
  `py-3` en las listas multilínea de `executive-dashboard.tsx:203` y
  `executive-tasks.tsx:136`, que hoy usan `py-4`. THE SYSTEM SHALL conservar el
  subrayado del folio en hover, el importe con `font-medium tabular-nums` y el
  anillo `focus-visible:ring-3 focus-visible:ring-ring/30`, y SHALL NOT
  introducir fondo, elevación, `translateY`, `scale` ni `cursor-pointer` en el
  hover de la fila (MASTER §4 y §8, `pages/dashboard.md` §Filas de orden).

- **R10**: WHEN se consulta el código de los seis archivos, THE SYSTEM SHALL NOT
  contener las clases `rounded-xl` ni `rounded-2xl` (15 apariciones hoy: 9 de
  `rounded-2xl` y 6 de `rounded-xl`). Cada caja SHALL usar el radio del token que
  le corresponde: `--radius-card` para tarjetas y contenedores de sección,
  `--radius` para controles, chips y envoltorios de foco. Motivo: MASTER §4 y la
  regla global de la fase 2 del plan, "reemplazar `rounded-xl` / `rounded-2xl`
  sueltos por los tokens", que la feature 23 aplicó solo a `components/ui/`.

- **R11**: WHEN se consulta el código de los seis archivos, THE SYSTEM SHALL NOT
  contener ningún color literal — hex crudo o clase de paleta Tailwind — según el
  detector `LITERAL_COLOR` ya calibrado en
  `frontend/src/design-system.guardrails.test.ts`. En particular, las alertas de
  antigüedad de `executive-dashboard.tsx:361` y `:365`
  (`border-amber-200 dark:border-amber-900/60`,
  `text-amber-600 dark:text-amber-400`) SHALL pasar al par `--status-pending`,
  que es el mismo ámbar del sistema y el estado semánticamente correcto para
  "esto lleva demasiado tiempo esperando". Motivo: MASTER §8, "cero hex crudos en
  componentes", y la Two-Color Rule del MASTER §9.
  `components/odc/monthly-summary-slide.tsx` SHALL conservar íntegros sus
  literales — es el render del PDF, siempre en claro, y la única excepción
  admitida (feature 23, R15) — y no entra en esta feature.

### No regresión y verificación

- **R12**: WHILE se ejecuta `pnpm test` en `frontend/`, THE SYSTEM SHALL dejar en
  verde estas aserciones **sin editar ninguna de ellas**:

  | Archivo | Línea | Aserción que debe seguir cumpliéndose | Requisito que la pone en riesgo |
  |---|---|---|---|
  | `components/odc/executive-dashboard.test.tsx` | 272 | link contiene `focus-visible:ring` | R6, R9, R10 |
  | `components/odc/executive-dashboard.test.tsx` | 274 | existe algún `[class*="motion-reduce"]` | R2, R4 |
  | `components/odc/executive-dashboard.test.tsx` | 143 | `header.textContent` casa `/operaciones/i` | R4 |
  | `components/odc/general-dashboard.test.tsx` | 84 | `main` contiene `min-w-0` | R3 |
  | `components/odc/general-dashboard.test.tsx` | 86 | link casa `flex-col.*sm:flex-row` | R9 |
  | `components/odc/general-dashboard.test.tsx` | 88 | `getAllByText('Dirección General')` tiene longitud **2** | R4, R7 |

  El plan enumeraba cuatro de estas seis para la fase 3a. Las otras dos
  (`executive-dashboard.test.tsx:143` y `general-dashboard.test.tsx:88`) las añade
  esta spec porque R4 y R7 las tocan de forma directa: la primera obliga a que el
  eyebrow de rol siga dentro del header al borrar el párrafo; la segunda fija en
  **exactamente dos** las apariciones del texto "Dirección General" — el eyebrow
  de la página y el de la tarjeta —, así que ni quitar el eyebrow de la tarjeta al
  añadir la barra de acento ni introducir una tercera aparición son admisibles.

  IF un requisito de esta spec chocara con una de las seis aserciones, THEN
  THE SYSTEM SHALL conservar la clase o el texto en el componente en lugar de
  modificar el test, y SHALL registrarlo en [[traceability]].
  `general-approval-actions.test.tsx:342` sigue vigente pero pertenece a la fase
  3b (feature 26) y ningún archivo de esta feature lo alcanza; además ese archivo
  falla de forma intermitente al correr la suite completa por una carrera de
  render ya conocida, y esa intermitencia SHALL NOT atribuirse a esta feature.

- **R13**: WHEN el implementer escriba los tests de esta feature, THE SYSTEM SHALL
  afirmar **invariantes** — token consumido, ausencia de clase prohibida,
  jerarquía relativa entre elementos, presencia del contrato accesible — y
  SHALL NOT fijar en ningún test un valor visual que no esté escrito en
  `design-system/odc/MASTER.md` o en `design-system/odc/pages/dashboard.md`. Para
  lo que ninguno de los dos documentos fija — el tono y la opacidad exactos de la
  barra de acento, el resultado final del ancho de `executive-tasks.tsx`, el
  padding concreto de las filas multilínea — el valor lo elige el implementer
  dentro de las restricciones de R3–R11 y lo confirma la sesión de navegador de
  R14; si el valor se mueve ahí, **no hay que tocar esta spec**. Motivo: fijar un
  valor visual en un requisito sin haberlo visto en pantalla es lo que produjo
  D-V1 en la feature 24, y antes la contradicción R2/R5 de la 23.

- **R14**: WHEN la feature se proponga para `done`, THE SYSTEM SHALL existir
  `progress/verify_ui-surfaces-dashboards.md` con las cinco secciones siguientes,
  tomadas en un navegador real con la app corriendo y el conmutador de tema de
  `lib/theme.tsx`:

  1. las cuatro superficies de dashboard vistas con su rol
     (`/` como `DIRECTOR_OPS`, `ADMINISTRACION` y `DIRECTOR_GENERAL`, y `/tasks`)
     en tema claro y en tema oscuro, con el alto computado del header antes y
     después del cambio;
  2. la altura computada con `getComputedStyle` de los CTA del header de
     `odc-dashboard.tsx`, demostrando ≤ 32px — el cierre de D-V3 —, copiada en
     vivo y no deducida del código;
  3. las 8 badges con los tokens nuevos en los dos temas, con el veredicto de si
     alguna perdió legibilidad respecto de las clases de paleta que sustituye;
  4. las barras de acento de las tarjetas de cola, con el veredicto de si
     distinguen las colas de un vistazo o son ruido;
  5. una línea de veredicto humano con fecha, afirmativa o negativa.

  THE SYSTEM SHALL registrar además, en esa misma sesión y **como observación sin
  efecto sobre el código de esta feature**, si la familia de 8 badges de dark se
  ve lavada: es la decisión de diseño que `progress/ui-redesign-plan.md`
  §"Fuera de `feature_list.json` a propósito" aplaza explícitamente hasta poder
  mirarla sobre las superficies de esta feature.

  IF ese archivo no existe, o su veredicto no es afirmativo, THEN el reviewer
  SHALL NOT aprobar el cierre **aunque `pnpm test` y `pnpm build` estén en
  verde**: los tests de esta feature verifican invariantes, y la razón de que la
  fase 3a exista es que un invariante verde puede seguir viéndose mal.

- **R15**: WHILE se ejecutan `pnpm test` y `pnpm build` en `frontend/`,
  THE SYSTEM SHALL terminar ambos en verde; THE SYSTEM SHALL NOT añadir ninguna
  entrada nueva a `dependencies` ni a `devDependencies` de
  `frontend/package.json`; y los únicos archivos que SHALL cambiar son los seis
  `components/odc/*.tsx` del alcance, sus archivos de test,
  `frontend/src/design-system.guardrails.test.ts`, los de
  `specs/ui-surfaces-dashboards/` y los de `progress/`. THE SYSTEM SHALL NOT
  modificar `frontend/src/styles.css` ni ningún archivo de
  `frontend/src/components/ui/`: los 16 tokens de estado que esta feature consume
  ya existen, ya están expuestos en `@theme inline` y ya están auditados por
  contraste por las features 23 y 24. IF durante la implementación resultara que
  falta un token, o que un valor de `styles.css` impide cumplir un requisito,
  THEN el implementer SHALL parar y reportarlo al leader en lugar de enmendar
  `styles.css` o las specs de las features 23/24 por su cuenta: esa autorización
  la da el humano, como se hizo en la feature 24.

## Fuera de alcance

- **Fases 3b y 3c del plan (feature 26, `ui-surfaces-detail-forms`)**:
  `odc-detail.tsx`, `odc-form.tsx`, `register-payment-form.tsx`,
  `payment-evidence-form.tsx`, `upload-invoice-form.tsx` y `login-form.tsx`. En
  particular siguen fuera **D-V4** (el anidamiento de cajas del detalle) y la
  mitad de **D-V3** que vive en `odc-form.tsx:370,380`: esta feature cierra D-V3
  solo en `odc-dashboard.tsx`. El timeline con puntos coloreados por estado es de
  la 26 y es precisamente lo que R1 desbloquea.
- **Fase 3d del plan (feature 27, `ui-surfaces-monthly-summary`)**:
  `monthly-summary.tsx` y sus barras horizontales por etapa, que también
  consumirán los tokens que R1 pone en uso.
- **Re-saturar la familia de las 8 badges de `.dark`.** Sigue deliberadamente sin
  feature. Motivo, tal como lo dejó escrito el plan: 6 de las 8 no alcanzan el
  suelo del 85% de saturación dentro de sRGB a su lightness actual de `0.82`, así
  que no es un ajuste de chroma sino bajarle la lightness a la familia entera y
  re-auditar los 16 pares de contraste de estado. La decisión de diseño previa se
  toma mirando las superficies de **esta** feature; R14 obliga a registrar la
  observación, no a ejecutar el cambio.
- **`frontend/src/styles.css`, los tokens y las primitivas de `components/ui/`**:
  territorio cerrado de las features 23 y 24 (R15).
- **Responsive a 375px** (feature 28, `ui-responsive-375`): sigue sin comprobarse
  y esta feature no lo cubre. La verificación de R14 se hace a ancho de
  escritorio.
- **`login-form.tsx` con etiquetas en inglés y el `<title>` "TanStack Start
  Starter"** (feature 29, `ui-copy-es-and-title`).
- `ui/toast.tsx`, que fija `rounded-2xl!` con `!`: no es un archivo de esta fase.
- El chrome de navegación (`components/layout/`), las rutas, los permisos, el
  backend y cualquier regla del flujo de compra.
- Añadir librería de gráficas, de iconos, de color o de animación (MASTER §5, §7;
  feature 23 R15 y feature 24 R11).
- Virtualizar las listas: el MASTER §6 la condiciona a superar 100 filas
  renderizadas, y hoy hay paginación.

## Aprobación

- [ ] Aprobado por humano (fecha: ____) ← gate obligatorio antes de implementar
