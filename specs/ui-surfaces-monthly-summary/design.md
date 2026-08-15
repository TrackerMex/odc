---
feature: "ui-surfaces-monthly-summary"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, monthly-summary, charts]
---

# Diseño — [[ui-surfaces-monthly-summary]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Alcanzabilidad: ninguna superficie está muerta

Se comprobó antes de redactar ningún requisito, porque la feature 30
(`ui-dead-surfaces-audit`) nació justamente de que la feature 25 refactorizó
tres dashboards que ninguna ruta montaba.

Resultado: **las cuatro superficies del encargo están vivas y son alcanzables
desde una ruta registrada en `routeTree.gen.ts`.** No hay código muerto en esta
feature y no se escribe ningún requisito sobre código que nadie renderiza.

```
routeTree.gen.ts:127  '/_authenticated/monthly-summary'
  └── routes/_authenticated/monthly-summary.tsx      (gate: role === 'DIRECTOR_OPS')
        └── components/odc/monthly-summary.tsx       (:2)
              ├── components/odc/monthly-summary-slide.tsx   (:48)
              └── lib/monthly-summary-export.ts              (:39)
```

Camino de usuario real, no solo importación: `components/layout/app-sidebar.tsx:100`
publica el enlace "Resumen mensual" bajo `canManageOrders`. Y
`components/odc/production-reachability.test.ts` (feature 30, R4) ya afirma que
`monthly-summary.tsx` y `monthly-summary-slide.tsx` siguen alcanzables desde
rutas de producción: es un invariante heredado que esta feature debe respetar,
no reescribir.

## Decisiones técnicas

- **Reutilizar `statusStyles`, no duplicarlo** (R3). El mapa estado→clase de
  `components/odc/odc-status-badge.tsx` es la fuente única del color de estado
  desde la feature 25 (R1) y ya lo reutilizó el timeline de la 26 (R2). Las
  barras toman de ahí su token `--status-*`. Si hiciera falta una tercera forma
  de la clase (relleno sólido sin borde), se añade una clave al mismo `Record`,
  nunca una tabla nueva. Corolario heredado: **ninguna variante `dark:` en esta
  superficie** — la inversión por tema vive en los tokens declarados en `.dark`.

- **`StageLabel` desaparece a favor de `OdcStatusBadge`** (R3). Hoy
  `monthly-summary.tsx:64-70` declara un `StageLabel` local que pinta
  `Badge variant="secondary"` — es decir, las tres etapas se ven idénticas en
  gris. `OdcStatusBadge` ya hace exactamente eso pero con el par de tokens
  correcto, `data-status` y la transición de 150ms con `motion-reduce`. Es
  reutilización, no componente nuevo.

- **Barras con `div` y `width: %`, sin librería** (R3). Lo manda MASTER §7 de
  forma explícita, y la lista congelada de dependencias de
  `design-system.guardrails.test.ts` lo hace verificable. Un carril con fondo
  `--muted` y un relleno con el token de estado; el porcentaje se calcula contra
  `Math.max(...counts)` con el guardia de división por cero que exige R3.

- **Accesibilidad: el texto porta la información, la barra decora** (R3). Etiqueta
  + `count` + importe son texto real; el carril lleva `aria-hidden="true"`. Es
  la lectura más barata de la regla obligatoria del MASTER §1 ("el color nunca
  comunica solo") y evita inventar un `role="img"` con `aria-label` que
  duplicaría en audio lo que ya está escrito al lado.

- **No reimplementar la primitiva de tabla** (R4). `components/ui/table.tsx` ya
  trae, desde la feature 23, el wrapper `relative w-full overflow-x-auto`, el
  `TableRow` a `h-9 border-b`, el `TableHeader` sticky y la ausencia de zebra.
  Los cuatro puntos correspondientes de `pages/monthly-summary.md` §"Tabla de
  detalle" **ya están cumplidos**; el único defecto real de esa sección es el
  `tracking-[0.12em]` de los seis `TableHead`. Escribir requisitos para lo demás
  sería trabajo sin defecto observable.

- **`--space-lg` se expresa en la escala de Tailwind** (R2). Los siete
  `--space-*` viven en `:root` (`styles.css:9-15`) pero **no** están expuestos
  en `@theme inline`, así que no existe ninguna utilidad `*-lg` derivada de
  ellos. `--space-lg` es `0.75rem`, que es exactamente el escalón `3` de la
  escala por defecto: `mt-3` / `pt-3`. La alternativa `mt-[var(--space-lg)]`
  funciona igual pero mete un valor arbitrario que la auditoría de R8 tendría
  que perdonar. No se toca `styles.css` para exponer los tokens de espaciado:
  eso es territorio de la feature 23 (R7 de esta spec).

- **El slide del PDF se congela y se documenta** (R6). `monthly-summary-slide.tsx`
  es la única excepción admitida a "cero colores crudos" y además es lo que
  calibra el detector `LITERAL_COLOR` (`design-system.guardrails.test.ts:227`):
  si alguien lo "arregla", el detector se vuelve vacuo y las guardas de color de
  todas las superficies dejan de valer sin ponerse rojas. Por eso la única
  edición admitida en ese archivo es el comentario que explica la excepción, y
  por eso R8 lo mantiene fuera del conjunto de superficies auditadas.

- **La fuente normativa de la auditoría se amplía, no se sustituye** (R8). El
  test `ui-surfaces-dashboards R13` compara cada valor arbitrario de los tests
  de la feature contra `MASTER.md + pages/dashboard.md`. `max-w-[1400px]` sí
  está literal en `pages/monthly-summary.md:9`, pero `tracking-[0.06em]` **solo**
  aparece literal en `pages/dashboard.md:46` (el override de resumen mensual
  escribe "bajar `tracking-[0.12em]` a `0.06em`", sin la forma de clase). Si la
  implementación reemplazara la fuente en vez de concatenarla, pondría rojas
  guardas ya verdes de la feature 25.

## Archivos afectados

Todo es capa de presentación del frontend. Ni `domain`, ni `application`, ni
backend: esta feature no cruza ninguna frontera de
[[../../docs/architecture|architecture]].

| Archivo | Qué cambia | Requisitos |
|---|---|---|
| `frontend/src/components/odc/monthly-summary.tsx` | Ancho, padding, header, total, barras de etapa, tracking de encabezados, radio del estado vacío, alturas del skeleton | R1–R5, R7 |
| `frontend/src/components/odc/monthly-summary-slide.tsx` | **Solo** un comentario que documenta la excepción de color | R6 |
| `frontend/src/components/odc/monthly-summary.test.tsx` | Casos nuevos por requisito; las aserciones existentes no se editan | R1–R5, R10 |
| `frontend/src/design-system.guardrails.test.ts` | Añade `monthly-summary` al conjunto auditado; amplía la fuente normativa con `pages/monthly-summary.md` | R8 |
| `progress/verify_ui-surfaces-monthly-summary.md` | Esqueleto con seis secciones en `PENDIENTE` (lo rellena el leader, lo firma un humano) | R9 |
| `specs/ui-surfaces-monthly-summary/*` | Trazabilidad y tareas | — |

Sin cambios, y verificados como tales: `lib/monthly-summary-export.ts`,
`routes/_authenticated/monthly-summary.tsx`, `components/ui/*`, `styles.css`,
`components/layout/app-sidebar.tsx`, `frontend/package.json`.

## Tests afectados o en riesgo

- `monthly-summary.test.tsx` — las seis pruebas actuales cubren KPIs, enlace al
  detalle, restauración de mes/página desde la URL, exportación PNG/PDF,
  paginación y fallo de API. Ninguna debería romperse: R1–R5 no tocan textos
  consultados por rol o contenido, salvo el párrafo descriptivo eliminado por R1,
  que ningún test afirma. La aserción de `odc-filter-results` (`:139`) está en la
  lista de riesgo del plan y R7 la conserva.
- `design-system.guardrails.test.ts` — las guardas del slide (`:218`, `:227`) y
  la auditoría de valores inventados (`:314`) son las que R8 obliga a mantener
  verdes al ampliar el conjunto.
- `production-reachability.test.ts` — R4 de la feature 30 exige que las dos
  superficies sigan alcanzables. Nace verde y debe seguir así.
- `odc-status-badge.test.tsx` — si se añade una clave al `Record` de
  `statusStyles`, sus pruebas de los 8 pares deben seguir intactas.

## Alternativas descartadas

- **Añadir Recharts u otra librería de charts** para tres barras: MASTER §7 lo
  prohíbe para esta vista y la lista congelada de dependencias lo detectaría.
  Tres `div` resuelven el requisito.
- **Ordenar y dimensionar las barras por importe** en vez de por `count`: es la
  decisión abierta 2 del gate humano. Se descarta por defecto porque la tarjeta
  anuncia "Compras contabilizadas en el corte", no dinero.
- **Ocultar la etapa con `count` 0**: la lista dejaría de mostrar que la etapa
  existe y está vacía, que es información operativa real ("nadie ha subido
  evidencia este mes").
- **Exponer los `--space-*` en `@theme inline`** para poder escribir `mt-lg`:
  toca `styles.css`, que R7 cierra, y el valor ya es expresable con la escala
  existente.
- **Retematizar el slide del PDF con tokens semánticos**: rompería la única
  excepción admitida, dejaría el detector `LITERAL_COLOR` sin calibración y
  cambiaría un artefacto que se comparte fuera de la app.
- **Añadir la sección de etapas al PDF**: es superficie nueva, no rediseño, y
  el override no la pide.
- **Cerrar aquí el responsive a 375px**: duplicaría la feature 28.
