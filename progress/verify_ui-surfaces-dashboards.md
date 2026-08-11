# Verificación en navegador — ui-surfaces-dashboards (feature 25)

> Gate de R14. Este archivo **no lo rellena el implementer**: sus valores se
> copian en vivo de un navegador real con la app corriendo y el conmutador de
> tema de `lib/theme.tsx`, y el veredicto lo firma un humano. El implementer
> solo deja el esqueleto para que el test de existencia esté verde y las
> secciones no se inventen.
>
> Razón de ser del gate: los tests de esta feature verifican **invariantes**, y
> la fase 3a existe precisamente porque un invariante verde puede seguir
> viéndose mal. Si este archivo queda con secciones PENDIENTE o su veredicto es
> negativo, el reviewer **no** aprueba el cierre aunque `pnpm test` y
> `pnpm build` estén en verde.
>
> Cómo levantar el entorno: `cd frontend && pnpm vite dev --port 3005 --host 127.0.0.1`
> (backend y DB en contenedor: `docker start odc-db-1 odc-backend-1`,
> puertos 3001 y 5432).
>
> La verificación se hace a ancho de escritorio. El responsive a 375px está
> fuera de alcance (feature 28).

Cambios implementados a verificar:

- Ancho `max-w-[1400px]` y padding `p-4 sm:p-6` en las cinco superficies (R3).
- Header de un solo escalón (`text-2xl`) y sin párrafo descriptivo (R4).
- Tracking de label `0.06em` en las 14 etiquetas en mayúsculas (R5).
- CTA del header de `odc-dashboard.tsx` a `size="sm"` — cierre de **D-V3** (R6).
- Barra de acento de 2px por estado en las 7 tarjetas de cola homogéneas; las
  dos heterogéneas se quedan sin barra a propósito (R7).
- Contadores a `text-2xl` en `--muted-foreground`, salvo `RECHAZADA` (R8).
- Filas a `py-2` (una línea) y `py-3` (multilínea) (R9).
- Radios sobre `--radius-card` / `--radius`; cero color literal (R10, R11).
- Las 8 badges consumen los pares `--status-*` / `--status-*-surface` (R1, R2).

## 1. Las cuatro superficies en los dos temas

Sesión del **2026-08-11**, Chrome real, app en `http://localhost:3006` (el 3005
estaba ocupado), backend y DB en contenedor. Tema conmutado con el `ThemeToggle`
de `lib/theme.tsx`. Viewport `innerWidth` 1482 / `clientWidth` 1466.

### Hallazgo que cambia el alcance real de esta feature

**Tres de las seis superficies no están montadas en la aplicación.**
`admin-dashboard.tsx`, `general-dashboard.tsx` y `odc-dashboard.tsx` no los
importa ninguna ruta ni ningún otro componente: sus únicos importadores son sus
propios archivos de test y la auditoría de fuente de
`design-system.guardrails.test.ts`. Verificado por búsqueda exhaustiva de los
tres símbolos y de los tres nombres de archivo en todo `frontend/src`.

Lo que sí ocurre: `routes/_authenticated/index.tsx:41` renderiza
`<ExecutiveDashboard>` para **los tres roles**, y su loader (líneas 18-23) admite
`DIRECTOR_OPS`, `ADMINISTRACION` y `DIRECTOR_GENERAL` contra el mismo endpoint.
Confirmado en pantalla: con sesión `ADMINISTRACION`, `/` renderiza el mismo
`executive-dashboard` que con `DIRECTOR_OPS`, solo que con sus datos.

Consecuencias, que no son culpa del implementer — hizo lo que la spec pedía —
sino de que nadie comprobó qué se monta antes de especificar:

- **Las 7 barras de acento de R7 no las ve ningún usuario hoy.** Las tres
  superficies que las contienen no se renderizan.
- Los CTA literales que R6 nombraba (`odc-dashboard.tsx:158,163`), origen del
  defecto D-V3, también están en código no montado.
- Los tests de esos tres archivos pasan porque montan el componente directamente,
  no porque la app lo use.

Esto **no invalida** el trabajo: el código es correcto y quedará bien el día que
esas superficies se monten. Pero el valor entregado al usuario por esta feature es
menor de lo que la spec suponía, y conviene decirlo antes de firmar.

**Cobertura real, dicha sin adornos:**

| Superficie | Rol | Tema | Alto del header | Verificado |
|---|---|---|---|---|
| `/` (`executive-dashboard`) | `DIRECTOR_OPS` | oscuro | **81px** | sí |
| `/` (`executive-dashboard`) | `DIRECTOR_OPS` | claro | 81px | sí |
| `/tasks` (`executive-tasks`) | `DIRECTOR_OPS` | oscuro | — | sí |
| `/tasks` (`executive-tasks`) | `DIRECTOR_OPS` | claro | — | sí |
| `/` (`executive-dashboard`) | `ADMINISTRACION` | claro | — | sí |
| `admin-dashboard.tsx` | — | — | — | **no montado en la app** |
| `general-dashboard.tsx` | — | — | — | **no montado en la app** |
| `odc-dashboard.tsx` | — | — | — | **no montado en la app** |

El "alto del header antes" no se midió en vivo: habría exigido revertir el
código con el servidor corriendo. Lo que sí consta es que el `innerText` del
header hoy es `OPERACIONES | Buen día, Director de Operaciones | agosto de 2026 |
Crear ODC` — **el párrafo descriptivo ya no está**, que es lo que R4 pedía. El
`h1` computa `24px` (`text-2xl`) en los dos temas. La captura previa al cambio,
de la sesión de verificación de la feature 24, muestra el mismo header con el
párrafo "Revisa lo que bloquea el flujo y continúa la siguiente acción." y un
título visiblemente mayor.

R3 verificado en vivo en las dos superficies: existe exactamente **un**
contenedor con `max-width: 1400px`, y `scrollWidth == clientWidth` — sin scroll
horizontal.

### Riesgo de R3 en `/tasks`: medido, no opinado

`executive-tasks.tsx` pasó de `max-w-5xl` (1024px) a `max-w-[1400px]` porque lo
manda la fuente normativa, siendo una lista de una sola columna. Medición de la
única fila del dataset:

| Medida | Valor |
|---|---|
| Ancho real del contenedor a este viewport | 1178px |
| Borde derecho del importe `$45,000.00` | x = 611 |
| Borde izquierdo de "Completar factura" | x = 1274 |
| **Hueco horizontal vacío entre el dato y su acción** | **663px** |
| Alto de la fila | 28px |

663px de vacío entre el importe y el botón que actúa sobre él, y eso con el
viewport a 1466px. En una pantalla que aproveche los 1400px completos el hueco
pasaría de 880px. El riesgo que anticipaba la decisión humana 1 **es real y
medible**: el ojo tiene que cruzar toda la fila para ligar el dato con su acción.

Capturas antes de la enmienda: `screenshot-1786470916669-3.jpg` (oscuro) y
`screenshot-1786470947632-4.jpg` (claro).

**Veredicto: no se sostiene.** El humano firmó el 2026-08-11 la enmienda de
`design-system/odc/pages/dashboard.md`, que es la salida que la decisión 1 del
gate dejaba prevista. Regla nueva: el ancho de consola aplica a las superficies de
**rejilla de colas**; una **lista de una sola columna** usa `max-w-4xl` (896px).
Registrada también en la tabla de enmiendas de `requirements.md`.

### Medición después de la enmienda

Aplicada en `81ec0c3`, releída en vivo con 6 tareas en pantalla (sesión
`ADMINISTRACION`) y captura `screenshot-1786471889031-6.jpg`:

| Medida | Antes | Después |
|---|---|---|
| Ancho del contenedor | 1178px (tope 1400) | **896px** (tope 896) |
| Hueco entre el importe y su acción | 663px | **406px** |

El hueco baja un 39% y, más importante, **queda acotado**: antes crecía con la
pantalla hasta pasar de 880px, y ahora tiene techo en el ancho del contenedor.
Dicho sin adornos: 406px sigue siendo un salto apreciable, no es cero. La mejora
es real y la regla es la correcta, pero si alguien quiere el dato y la acción
verdaderamente juntos, eso es un cambio de layout de la fila —no de ancho— y
sería trabajo de otra feature.

Sin scroll horizontal después del cambio.

## 2. Altura computada de los CTA del header

Leído en vivo con `getComputedStyle(el).height` el 2026-08-11, tema oscuro.

| CTA | `getComputedStyle().height` | ≤ 32px |
|---|---|---|
| "agosto de 2026" (selector de periodo) | **32px** | sí |
| "+ Crear ODC" (primario) | **28px** | sí |

**D-V3 cerrado.** Antes de esta feature los CTA usaban `size="lg"`, que computa
36px. Los dos que renderiza el header de `DIRECTOR_OPS` están hoy en 32px y 28px,
ambos dentro del techo. Ningún control del header supera los 32px.

Nota de cobertura: los CTA que la spec nombraba textualmente ("Resumen mensual",
"Nueva ODC") son los de `odc-dashboard.tsx`, la superficie del rol de compras.
Con la sesión `DIRECTOR_OPS` abierta, `/` renderiza `executive-dashboard.tsx`,
cuyos CTA son los dos medidos arriba. La medición vale igual para R6 —es el mismo
requisito y el mismo techo— pero **los CTA literales de `odc-dashboard.tsx` no se
midieron en pantalla**; su cumplimiento hoy solo está atado por la auditoría de
fuente `ui-surfaces-dashboards R6` y por `odc-dashboard.test.tsx`.

Área táctil: el MASTER §6 la resuelve con padding, nunca subiendo la altura del
control. El foco no se tocó: las dos aserciones de `focus-visible:ring` y
`motion-reduce` siguen intactas y verdes (R12, confirmado por el reviewer con
`-0` líneas borradas).

## 3. Las 8 badges con los tokens nuevos

**El dataset de desarrollo tiene una sola orden**, en estado
`EVIDENCIA_PAGO_SUBIDA`, así que las 8 badges no coexisten en pantalla. Solo esa
se pudo leer renderizada; las otras 7 quedan sin comprobar visualmente.

Lo verificado en vivo el 2026-08-11 sobre la badge que sí renderiza:

| `OdcStatus` | Tema | `color` computado | `background-color` computado | Par de tokens |
|---|---|---|---|---|
| `EVIDENCIA_PAGO_SUBIDA` | oscuro | `oklch(0.82 0.056 223.13)` | `oklch(0.29 0.03 223.13)` | `--status-evidence` / `-surface` de `.dark`, exactos |
| `EVIDENCIA_PAGO_SUBIDA` | claro | `oklch(0.5198 0.0936 223.13)` | `oklch(0.974 0.011 223.13)` | `--status-evidence` / `-surface` de `:root`, exactos |
| `PAGO_REGISTRADO` | claro | `oklch(0.4907 0.2412 292.58)` | `oklch(0.974 0.012 292.58)` | `--status-paid` / `-surface` de `:root`, exactos |
| `PENDIENTE_ADMIN` | claro | `oklch(0.5553 0.1455 49)` | `oklch(0.978 0.011 49)` | `--status-pending` / `-surface` de `:root`, exactos |

Las dos últimas se leyeron con sesión `ADMINISTRACION` el mismo día. Detalle que
vale la pena anotar: sus superficies computan `0.012` y `0.011` de chroma, que son
los **valores corregidos por la feature 24** al sacarlos del gamut sRGB, no los
originales `0.018` y `0.014`. La corrección de gamut de la 24 llega al render.

Los cuatro valores coinciden **carácter a carácter** con los tokens declarados en
`styles.css`: R1 se cumple de verdad en el navegador, no solo en la auditoría de
fuente. R2 también: `data-status="EVIDENCIA_PAGO_SUBIDA"` presente, etiqueta
textual "Pendiente de factura" visible, `border-width: 0px` y `border-radius:
4px` (`--radius-badge`).

Legibilidad de esa badge en los dos temas: correcta, sin pérdida respecto de la
clase Tailwind que sustituye.

| `OdcStatus` | Par de tokens | Estado |
|---|---|---|
| `BORRADOR` | `status-draft` | sin datos en el dataset |
| `PENDIENTE_ADMIN` | `status-pending` | **verificado en claro** |
| `PRESUPUESTO_APROBADO` | `status-budget` | sin datos en el dataset |
| `COMPRA_APROBADA` | `status-approved` | sin datos en el dataset |
| `PAGO_REGISTRADO` | `status-paid` | **verificado en claro** |
| `EVIDENCIA_PAGO_SUBIDA` | `status-evidence` | **verificado en los dos temas** |
| `COMPLETADA` | `status-done` | sin datos en el dataset |
| `RECHAZADA` | `status-rejected` | sin datos en el dataset |

Atenuante para las 7 sin comprobar: los 16 pares de estado ya tienen su contraste
auditado por test desde las features 23 y 24, y el mapeo del componente está atado
por la auditoría de fuente de R1. Lo que no se ha visto es el render, no la
corrección del color. Nota de contexto que sigue vigente: `--status-pending` en
claro tiene 4.70:1, el par con menos margen de los 16.

### Observación: saturación de las badges de dark

**Observación sin efecto sobre el código de esta feature** (decisión humana 3 del
gate). Con una sola badge en pantalla no hay base para juzgar si la **familia**
de 8 se ve lavada en oscuro: eso se aprecia viéndolas juntas. La badge de
`EVIDENCIA_PAGO_SUBIDA` en oscuro, aislada, se lee bien.

Sigue en pie el dato que motivaba la observación: 6 de las 8 no alcanzan el suelo
del 85% de saturación dentro de sRGB a su lightness actual de `0.82`, así que
corregirlo no es un ajuste de chroma sino bajarle la lightness a la familia
entera y re-auditar los 16 pares. **Recomendación:** no abrir feature por esto
todavía y volver a mirarlo cuando la 26 o la 27 pongan varias badges juntas en
pantalla, que es cuando el defecto sería visible.

Observación registrada: **sin abrir feature.** Con las badges que llegaron a
verse en oscuro no hay base para afirmar que la familia se vea lavada, y la
corrección real es cara. Se revisa cuando varias coincidan en pantalla.

## 4. Las barras de acento de las tarjetas de cola

**Lo que sí se comprobó: el SHALL NOT.** Barrido del DOM de las dos superficies de
`DIRECTOR_OPS` buscando cualquier elemento de ≤3px de alto, >40px de ancho y con
fondo no transparente. Resultado en `/`: **cero barras de acento**. El único
elemento que casa es un separador de 1px con fondo `oklab(1 0 0 / 0.05)`, que es
un borde neutro, no un token de estado.

Es decir: "Prioridad inmediata" de `executive-dashboard` y "Tareas accionables"
de `executive-tasks` **efectivamente no llevan barra**, tal como exige la
decisión humana 2 del gate — mezclan estados y un solo color mentiría.

**Las 7 barras que sí deben existir son inverificables en pantalla, y no por
falta de credenciales.** Las siete tarjetas de cola homogénea viven en
`odc-dashboard`, `admin-dashboard` y `general-dashboard`, los tres componentes
que **ninguna ruta monta** (ver el hallazgo de §1). Se comprobó con sesión
`ADMINISTRACION` real: `/` renderiza `executive-dashboard`, y el barrido del DOM
devuelve **cero** elementos de barra de acento en toda la página.

| Superficie | Tarjeta | Token de la barra | ¿Distingue o es ruido? |
|---|---|---|---|
| `odc-dashboard` | Rechazadas | `status-rejected` | no montado en la app |
| `odc-dashboard` | Borradores | `status-draft` | no montado en la app |
| `odc-dashboard` | Listas para comprar | `status-approved` | no montado en la app |
| `odc-dashboard` | Pendientes de factura | `status-evidence` | no montado en la app |
| `admin-dashboard` | Pendientes de validar | `status-pending` | no montado en la app |
| `admin-dashboard` | Compras pagadas | `status-paid` | no montado en la app |
| `general-dashboard` | Esperando mi aprobación | `status-budget` | no montado en la app |

El reviewer confirmó que las 7 utilidades de barra **compilan a CSS real en el
bundle**, así que el CSS existe; lo que no existe es una pantalla donde se pinten.
El juicio humano de si ayudan o estorban queda aplazado a cuando esas superficies
se monten, si es que se montan.

Lo que sí se verificó de R11 en pantalla con sesión `ADMINISTRACION`: la tarjeta
"Alertas: órdenes con mayor antigüedad" de `executive-dashboard` usa el borde de
`--status-pending` en lugar del ámbar hardcodeado que tenía en las líneas 361 y
365. Ese cambio sí llega al usuario.

## 5. Veredicto humano

**AFIRMATIVO.** D-V3 queda cerrado —los CTA del header computan 32px y 28px,
frente a los 36px de `size="lg"`—, la densidad y los tokens de estado se ven
correctos en pantalla en los dos temas, y la enmienda de ancho de `/tasks` está
aplicada y verificada. — Alexis, 2026-08-11.

Firmado sabiendo lo que **no** se pudo comprobar, que está detallado en §1 y §4:
las 7 barras de acento de R7 no las juzga nadie porque sus tres superficies no
las monta ninguna ruta. Ese problema tiene dueño: la **feature 30
`ui-dead-surfaces-audit`**, abierta a P1 el mismo día, que además debe comprobar
si las features 26 y 27 apuntan a más código no montado antes de especificarse.

Las dos cosas que este gate encontró y que ningún test verde habría encontrado:
el ancho de 1400px sobre una lista de una columna, y las tres superficies
muertas. Es exactamente la razón de ser de R14.
