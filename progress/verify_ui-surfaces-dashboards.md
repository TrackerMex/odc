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

PENDIENTE — sesión de navegador no ejecutada.

Qué hay que registrar aquí: `/` con los tres roles (`DIRECTOR_OPS`,
`ADMINISTRACION`, `DIRECTOR_GENERAL`) y `/tasks`, en tema claro y en tema
oscuro, con el **alto computado del header antes y después** del cambio.

| Superficie | Rol | Tema | Alto del header (antes) | Alto del header (después) | Captura |
|---|---|---|---|---|---|
| `/` | `DIRECTOR_OPS` | claro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/` | `DIRECTOR_OPS` | oscuro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/` | `ADMINISTRACION` | claro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/` | `ADMINISTRACION` | oscuro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/` | `DIRECTOR_GENERAL` | claro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/` | `DIRECTOR_GENERAL` | oscuro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/tasks` | `DIRECTOR_OPS` | claro | PENDIENTE | PENDIENTE | PENDIENTE |
| `/tasks` | `DIRECTOR_OPS` | oscuro | PENDIENTE | PENDIENTE | PENDIENTE |

Riesgo abierto que esta sección decide (decisión humana 1 del gate):
`executive-tasks.tsx` pasó de `max-w-5xl` (1024px) a `max-w-[1400px]` porque lo
manda la fuente normativa, pero es una lista de una sola columna. Si las filas
estiradas no se sostienen en pantalla, la salida correcta es **enmendar
`design-system/odc/pages/dashboard.md`** con firma humana, nunca saltarse R3.

Veredicto de si las filas estiradas de `/tasks` se sostienen: PENDIENTE.

## 2. Altura computada de los CTA del header

PENDIENTE — sesión de navegador no ejecutada.

Cierre de **D-V3**. Los valores se leen en vivo con
`getComputedStyle(el).height` sobre los CTA del header de `odc-dashboard.tsx`,
**no** se deducen del código: jsdom no computa layout y el test solo puede
afirmar que `size="lg"` no aparece en el archivo.

| CTA | `getComputedStyle().height` | ≤ 32px |
|---|---|---|
| "Resumen mensual" (outline) | PENDIENTE | PENDIENTE |
| "Nueva ODC" (primario) | PENDIENTE | PENDIENTE |

Área táctil: el MASTER §6 la resuelve con padding, nunca subiendo la altura del
control. Comprobación de que el foco sigue visible tras el cambio: PENDIENTE.

## 3. Las 8 badges con los tokens nuevos

PENDIENTE — sesión de navegador no ejecutada.

Las 8 badges pasaron de clases de paleta Tailwind **sin auditar** a los pares de
tokens ya auditados por contraste (feature 23 R5 + feature 24 R6). Hay que
mirarlas en los dos temas y decir si alguna **perdió legibilidad** respecto de la
clase que sustituye.

| `OdcStatus` | Par de tokens | Claro | Oscuro | ¿Pierde legibilidad? |
|---|---|---|---|---|
| `BORRADOR` | `status-draft` | PENDIENTE | PENDIENTE | PENDIENTE |
| `PENDIENTE_ADMIN` | `status-pending` | PENDIENTE | PENDIENTE | PENDIENTE |
| `PRESUPUESTO_APROBADO` | `status-budget` | PENDIENTE | PENDIENTE | PENDIENTE |
| `COMPRA_APROBADA` | `status-approved` | PENDIENTE | PENDIENTE | PENDIENTE |
| `PAGO_REGISTRADO` | `status-paid` | PENDIENTE | PENDIENTE | PENDIENTE |
| `EVIDENCIA_PAGO_SUBIDA` | `status-evidence` | PENDIENTE | PENDIENTE | PENDIENTE |
| `COMPLETADA` | `status-done` | PENDIENTE | PENDIENTE | PENDIENTE |
| `RECHAZADA` | `status-rejected` | PENDIENTE | PENDIENTE | PENDIENTE |

Nota de contexto para juzgar: `--status-pending` en claro tiene 4.70:1, el par
con menos margen de los 16.

### Observación: saturación de las badges de dark

PENDIENTE — sesión de navegador no ejecutada.

**Observación sin efecto sobre el código de esta feature** (decisión humana 3 del
gate). Hay que registrar si la familia de 8 badges de `.dark` se ve lavada sobre
las superficies de esta feature. No se cambia ningún token aquí: 6 de las 8 no
alcanzan el suelo del 85% de saturación dentro de sRGB a su lightness actual de
`0.82`, así que no es un ajuste de chroma sino bajarle la lightness a la familia
entera y re-auditar los 16 pares de contraste. El veredicto humano de esta acta
decide si nace una feature nueva antes de la 26/27.

Observación: PENDIENTE.

## 4. Las barras de acento de las tarjetas de cola

PENDIENTE — sesión de navegador no ejecutada.

Siete tarjetas de cola homogénea recibieron una barra de 2px con el token de su
estado. Hay que decir si **distinguen las colas de un vistazo o son ruido**.

| Superficie | Tarjeta | Token de la barra | ¿Distingue o es ruido? |
|---|---|---|---|
| `odc-dashboard` | Rechazadas | `status-rejected` | PENDIENTE |
| `odc-dashboard` | Borradores | `status-draft` | PENDIENTE |
| `odc-dashboard` | Listas para comprar | `status-approved` | PENDIENTE |
| `odc-dashboard` | Pendientes de factura | `status-evidence` | PENDIENTE |
| `admin-dashboard` | Pendientes de validar | `status-pending` | PENDIENTE |
| `admin-dashboard` | Compras pagadas | `status-paid` | PENDIENTE |
| `general-dashboard` | Esperando mi aprobación | `status-budget` | PENDIENTE |

Las dos tarjetas heterogéneas — "Prioridad inmediata" de `executive-dashboard` y
"Tareas accionables" de `executive-tasks` — se quedan **sin** barra por decisión
humana 2 del gate: mezclan estados y un solo color mentiría. Comprobación de que
efectivamente no la tienen: PENDIENTE.

## 5. Veredicto humano

PENDIENTE — sin firmar.

Debe ser una línea afirmativa o negativa, con fecha y nombre. Si es negativa, o
si queda en PENDIENTE, el reviewer no aprueba el cierre de la feature.
