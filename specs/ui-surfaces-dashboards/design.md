---
feature: "ui-surfaces-dashboards"
status: draft        # draft | approved
tags: [harness, spec, frontend, design-system, surfaces, dashboards]
---

# Diseño — [[ui-surfaces-dashboards]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

Todos los recuentos y números de línea de este documento salen de leer los seis
archivos en el estado del commit `8584c79` (rama `ui-design-system-docs`). Son
verificables con `grep`; ninguno es una estimación.

## Decisiones técnicas

- **3e va antes que 3a, y por eso `odc-status-badge.tsx` tiene requisitos
  propios (R1, R2).** Las cinco superficies de 3a renderizan `<OdcStatusBadge>`:
  `odc-dashboard` y `admin-dashboard` una por fila, `general-dashboard`,
  `executive-dashboard` y `executive-tasks` también. Si el badge se cambia
  después, cada ajuste de densidad de 3a se juzga sobre un color que va a cambiar
  y hay que volver a mirarlo. Hacerlo primero cuesta un archivo de 43 líneas y
  deja el color de estado disponible para el timeline de la feature 26 y las
  barras de la 27, que es el orden que recomienda el plan.

- **El badge pierde sus variantes `dark:`, y eso es el punto (R1).** Hoy cada
  estado declara dos pares de clases, uno para claro y otro para oscuro. Con
  tokens, la inversión ya está resuelta en `.dark` dentro de `styles.css` — es
  literalmente para lo que la feature 23 declaró 32 valores. Un mapa con `dark:`
  después del cambio sería la misma enfermedad con otro disfraz: dos fuentes de
  verdad para el mismo color. El mapa queda en 8 líneas de un par de utilidades
  cada una.

  | `OdcStatus` | Utilidades esperadas | Contraste ya auditado (light / dark) |
  |---|---|---|
  | `BORRADOR` | `bg-status-draft-surface text-status-draft` | ≥ 4.5:1 en ambos |
  | `PENDIENTE_ADMIN` | `bg-status-pending-surface text-status-pending` | 4.70 en light — el par con menos margen |
  | `PRESUPUESTO_APROBADO` | `bg-status-budget-surface text-status-budget` | ≥ 4.5:1 en ambos |
  | `COMPRA_APROBADA` | `bg-status-approved-surface text-status-approved` | 4.80 en light / 8.09 en dark |
  | `PAGO_REGISTRADO` | `bg-status-paid-surface text-status-paid` | 6.57 / 8.02 |
  | `EVIDENCIA_PAGO_SUBIDA` | `bg-status-evidence-surface text-status-evidence` | ≥ 4.5:1 en ambos |
  | `COMPLETADA` | `bg-status-done-surface text-status-done` | ≥ 4.5:1 en ambos |
  | `RECHAZADA` | `bg-status-rejected-surface text-status-rejected` | 7.97 en dark |

  Las cifras de la última columna son las que ya audita
  `styles.tokens.test.ts` (feature 23 R5 + feature 24 R6). El detalle relevante:
  **hoy el badge pinta colores que nadie ha auditado nunca** — las clases
  `bg-amber-100 text-amber-800` de Tailwind no pasan por ningún test de este
  repositorio. Tras R1, los 8 badges heredan una auditoría de contraste que ya
  está en verde en los dos temas. No hay pares nuevos que auditar, y por eso esta
  feature no añade ni una aserción de contraste.

- **La barra de acento solo tiene sentido donde la tarjeta es una sola cola
  (R7).** Es una clase (`border-l-2` con el color del token) y es lo que convierte
  cuatro tarjetas idénticas en cuatro colas distinguibles. El mapa:

  | Superficie | Tarjeta | Estado de la cola | Token de la barra |
  |---|---|---|---|
  | `odc-dashboard.tsx` | Rechazadas | `RECHAZADA` | `--status-rejected` |
  | `odc-dashboard.tsx` | Borradores | `BORRADOR` | `--status-draft` |
  | `odc-dashboard.tsx` | Listas para comprar | `COMPRA_APROBADA` | `--status-approved` |
  | `odc-dashboard.tsx` | Pendientes de factura | `EVIDENCIA_PAGO_SUBIDA` | `--status-evidence` |
  | `admin-dashboard.tsx` | Pendientes de validar | `PENDIENTE_ADMIN` | `--status-pending` |
  | `admin-dashboard.tsx` | Compras pagadas | `PAGO_REGISTRADO` | `--status-paid` |
  | `general-dashboard.tsx` | Esperando mi aprobación | `PRESUPUESTO_APROBADO` | `--status-budget` |
  | `executive-dashboard.tsx` | Prioridad inmediata | — (varios) | **ninguno** |
  | `executive-tasks.tsx` | Tareas accionables | — (varios) | **ninguno** |

  `QueueCard` y `AdminQueue` ya reciben `status` como prop, así que el color sale
  de ahí. `general-dashboard.tsx` no tiene prop de estado: su cola es
  `PRESUPUESTO_APROBADO` por construcción (son las órdenes validadas por
  Administración que esperan decisión) y el implementer lo declara como constante
  local, no lo deriva de `page.items[0].status` — una cola vacía dejaría la
  tarjeta sin color.

- **Las dos tarjetas heterogéneas se quedan sin barra a propósito.** "Prioridad
  inmediata" y "Tareas accionables" mezclan órdenes de estados distintos; pintar
  el borde de un solo color afirmaría algo falso, y pintar varios convertiría la
  tarjeta en un semáforo. Cada fila ya lleva su propio badge, que tras R1 es el
  portador correcto del color de estado.

- **Inventario de clases a sustituir.** Es el trabajo real de 3a, y cabe en una
  tabla:

  | Qué | Cuántas | Dónde | Destino | Req. |
  |---|---|---|---|---|
  | `max-w-7xl` | 5 | `odc:141`, `admin:116`, `general:23`, `executive:471` y `:493` | `max-w-[1400px]` | R3 |
  | `max-w-5xl` | 1 | `tasks:91` | `max-w-[1400px]` | R3 |
  | `p-4 sm:p-6 lg:p-8` | 6 | los cinco `main` + el `main` de `ExecutiveDashboardLoading` | `p-4 sm:p-6` | R3 |
  | `text-3xl … sm:text-4xl` en `h1` | 5 | `odc:147`, `admin:121`, `general:28`, `executive:133`, `tasks:95` | `text-2xl` | R4 |
  | Párrafo descriptivo | 5 | `odc:150`, `admin:124`, `general:31`, `executive:137`, `tasks:96` | eliminado | R4 |
  | `tracking-[0.18em]` | 3 | `odc:144`, `admin:118`, `general:25` | `tracking-[0.06em]` | R5 |
  | `tracking-[0.14em]` | 1 | `executive:128` | `tracking-[0.06em]` | R5 |
  | `tracking-[0.12em]` | 4 | `odc:80`, `admin:57`, `general:44`, `tasks:60` | `tracking-[0.06em]` | R5 |
  | `tracking-[0.1em]` | 6 | `executive:189, 224, 230, 236, 242, 287` | `tracking-[0.06em]` | R5 |
  | `size: 'lg'` | 2 | `odc:158`, `odc:163` | `sm` o por defecto | R6 |
  | `text-3xl` en contador | 4 | `odc:89`, `admin:64`, `general:55`, `executive:177` | `text-2xl` + `--muted-foreground` | R8 |
  | `py-3` / `py-4` en fila | 5 | `odc:102`, `admin:77`, `general:71`, `executive:203`, `tasks:136` | `py-2` / ≤ `py-3` | R9 |
  | `rounded-2xl` | 9 | `odc:96`, `admin:71`, `general:62`, `executive:140, 184, 285, 379, 432`, `tasks:126` | `--radius-card` o `--radius` | R10 |
  | `rounded-xl` | 6 | `odc:106`, `admin:81`, `general:75`, `executive:208, 392`, `tasks:138` | `--radius` | R10 |
  | Ámbar literal | 2 | `executive:361`, `executive:365` | `--status-pending` | R11 |
  | `min-h-28` / `min-h-32` en vacío | 5 | los cinco estados vacíos | `min-h-20` | R7 |

  Ninguna de esas sustituciones toca una prop de datos, un `aria-*`, un `role` ni
  un `key`. El diff es de `className` salvo en R4 (borra JSX) y R7 (añade la
  barra).

- **`roleCopy` de `executive-dashboard.tsx` pierde su campo `description` (R4).**
  El párrafo de esa superficie no es una cadena literal, sale de
  `roleCopy[dashboard.role].description`. Al borrar el párrafo, el campo queda
  muerto para los tres roles: se elimina también del objeto y de su tipo, en el
  mismo commit. No lo consume nadie más (`grep` sobre `src/` lo confirma).
  El campo `label`, en cambio, alimenta el eyebrow y lo afirma
  `executive-dashboard.test.tsx:143`.

- **Dónde vive cada test.** No hace falta ningún archivo nuevo:

  | Tipo de verificación | Archivo | Requisitos |
  |---|---|---|
  | Auditoría de código fuente (ausencia de clase prohibida, presencia de utilidad de token) | `frontend/src/design-system.guardrails.test.ts`, que ya lee archivos con `readFileSync` y ya tiene el detector `LITERAL_COLOR` calibrado | R1, R5, R6, R10, R11, R15 |
  | Render con RTL (contrato accesible, jerarquía, clases de un nodo concreto) | los `*.test.tsx` de cada componente en `components/odc/` | R2, R3, R4, R7, R8, R9 |
  | Existencia y estructura del acta de verificación | `design-system.guardrails.test.ts` (mismo patrón que el test de R9 de la feature 24) | R14 |
  | Aserciones intactas de los seis tests en riesgo | el bloque ya existente `R13:` de `design-system.guardrails.test.ts`, ampliado con las 2 filas nuevas | R12 |

  El detector `LITERAL_COLOR` ya cubre `#hex`, `bg|text|border|ring|…-<paleta>-<n>`
  y `bg|text|border|…-black|white`. Aplicarlo a los seis archivos de esta feature
  es añadir un `it.each` con la lista; no hay que escribir regex nueva. Su test de
  no-vacuidad (`el detector de color literal no es vacuo`) ya existe y sigue
  calibrándose contra `monthly-summary-slide.tsx`.

- **Por qué la altura de los CTA se comprueba en navegador y no en jsdom (R6,
  R14).** jsdom no computa layout: `getBoundingClientRect` devuelve ceros y las
  clases de Tailwind no se resuelven a píxeles. El test puede afirmar que la clase
  `size` correcta está presente y que `size="lg"` no aparece en el archivo; los
  36px → 32px de D-V3 solo se leen con `getComputedStyle` en un navegador real,
  que es lo que pide la sección 2 de R14.

- **Todo el cambio vive en la capa de presentación.** Ningún `domain`,
  `application` ni `infrastructure` implicado; la regla de dependencia de
  `docs/architecture.md` no se ve afectada. Tampoco cambia ningún contrato de
  `lib/odc.ts` ni ninguna llamada de `lib/api.ts`.

## Riesgos conocidos

- **`executive-tasks.tsx` a `max-w-[1400px]` (R3).** Hoy está a `max-w-5xl`
  (1024px), que es exactamente lo que MASTER §3 prohíbe, y
  `pages/dashboard.md` lo lista entre sus cinco componentes. Pero es una lista de
  una sola columna: a 1400px las filas se estiran y el ojo tiene que recorrer más
  distancia entre el folio y la acción. El requisito lo exige porque la fuente
  normativa lo exige; la sección 1 de R14 es donde se comprueba si el resultado
  se sostiene. Si no se sostiene, es material para una enmienda firmada del
  `pages/dashboard.md`, no para saltarse el requisito en silencio.
- **`general-dashboard.test.tsx:88` cuenta exactamente 2 "Dirección General".**
  Cualquier retoque del eyebrow de la tarjeta lo rompe. Anotado en R12.
- **El par `--status-pending` en light tiene 4.70:1, menos del 7% de margen.** No
  cambia en esta feature, pero es el color que R11 lleva a las alertas de
  antigüedad: si alguien compusiera ese texto sobre una superficie distinta de
  `--status-pending-surface`, habría que reauditarlo.
- **`general-approval-actions.test.tsx` falla de forma intermitente** al correr la
  suite completa, por una carrera de render conocida y ajena a esta feature. Si
  aparece, se vuelve a correr ese archivo aislado antes de culpar al cambio.

## Archivos afectados

Todos en la capa de presentación o en documentación.

| Archivo | Qué cambia | Requisitos |
|---|---|---|
| `frontend/src/components/odc/odc-status-badge.tsx` | Las 8 clases de paleta → los 8 pares de tokens; desaparecen las variantes `dark:` | R1, R2 |
| `frontend/src/components/odc/odc-dashboard.tsx` | Ancho, padding, header, eyebrows, CTA (D-V3), barra de acento, contador, filas, radios | R3–R10 |
| `frontend/src/components/odc/admin-dashboard.tsx` | Ídem, sin CTA | R3–R5, R7–R10 |
| `frontend/src/components/odc/general-dashboard.tsx` | Ídem, con la constante de estado de su cola | R3–R5, R7–R10 |
| `frontend/src/components/odc/executive-dashboard.tsx` | Ancho, padding, header (+ `roleCopy.description`), eyebrows, contador, filas, radios, ámbar literal | R3–R5, R8–R11 |
| `frontend/src/components/odc/executive-tasks.tsx` | Ancho, padding, header, eyebrow, filas, radios | R3–R5, R9, R10 |
| `frontend/src/design-system.guardrails.test.ts` | Auditorías de código fuente + las 2 filas nuevas de R12 | R1, R5, R6, R10–R12, R14, R15 |
| `frontend/src/components/odc/*.test.tsx` (los 5 de dashboard) | Casos nuevos de render por requisito | R2–R4, R7–R9 |
| `progress/verify_ui-surfaces-dashboards.md` | Nuevo: acta de la sesión de navegador | R14 |

Fuera de esta tabla no debe cambiar ningún archivo. En particular **no**
`frontend/src/styles.css`, **no** `frontend/src/components/ui/`, **no**
`design-system/`, **no** las specs de las features 23 y 24.

## Alternativas descartadas

- **Hacer 3a antes que 3e**, o meter el badge como un añadido sin requisitos
  propios: obligaría a revisar en navegador dos veces las mismas cinco
  superficies, una con el color viejo y otra con el nuevo. El plan recomienda el
  orden contrario por la misma razón.
- **Resolver el badge con selectores de atributo sobre `data-status` en
  `styles.css`** (`[data-status="BORRADOR"] { … }`): es elegante y evita el mapa
  en JS, pero toca `styles.css`, que R15 declara fuera de alcance, y se salta las
  utilidades que `@theme inline` ya expone. El mapa en el componente es lo que ya
  hay; solo cambia su contenido.
- **Conservar variantes `dark:` en el mapa del badge "por si acaso"**: duplicaría
  la inversión que ya hacen los tokens y volvería a partir la fuente de verdad en
  dos.
- **Añadir un token nuevo tipo `--status-*-accent` para la barra de acento**: los
  `--status-*` de texto ya tienen la saturación adecuada para un filete de 2px, y
  declarar tokens es territorio de la feature 23. Ocho tokens más para una clase
  no lo justifica.
- **Poner barra de acento en "Prioridad inmediata" con el estado más frecuente de
  la lista**: un color que cambia según los datos, que miente cuando la lista es
  mixta y que no se puede testear de forma estable.
- **Quitar el eyebrow de las tarjetas de cola** ("Flujo de compra",
  "Administración", "Dirección General") para ganar densidad: no lo pide
  `pages/dashboard.md`, la barra de acento ya aporta la distinción, y en
  `general-dashboard.tsx` rompería `general-dashboard.test.tsx:88`.
- **Re-saturar la familia de badges de dark en esta feature**: 6 de las 8 no
  alcanzan el suelo de saturación dentro de sRGB a `L = 0.82`; exige rediseñar la
  lightness de la familia y re-auditar los 16 pares. R14 recoge la observación
  para que la decisión se tome con las superficies delante, que es lo que el plan
  pide.
- **Verificar la densidad con un test de altura computada en jsdom**: jsdom no
  computa layout. Sería un test que pasa siempre.
- **Sustituir el gate humano de R14 por capturas automáticas en CI**: lo que R14
  aporta es el juicio que ningún invariante captura. Automatizarlo reproduciría
  el fallo que originó la feature 24.
