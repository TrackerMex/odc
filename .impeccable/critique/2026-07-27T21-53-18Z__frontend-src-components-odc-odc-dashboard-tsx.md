---
target: frontend/src/components/odc/odc-dashboard.tsx
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-07-27T21-53-18Z
slug: frontend-src-components-odc-odc-dashboard-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/detector_browser)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Muestra volumen, no carga, fallos, antigüedad, frescura ni prioridad. |
| 2 | Match System / Real World | 3 | El lenguaje de compras es claro, pero no responde cuál es la siguiente tarea. |
| 3 | User Control and Freedom | 2 | Las filas sólo llevan al detalle; no hay acción directa ni acceso a colas completas. |
| 4 | Consistency and Standards | 3 | Tarjetas, badges, importes, tipografía y foco son coherentes con el sistema existente. |
| 5 | Error Prevention | 2 | No diferencia trabajo riesgoso o envejecido ni adelanta la causa de rechazo. |
| 6 | Recognition Rather Than Recall | 2 | Obliga a recordar la transición y acción permitida de cada estado. |
| 7 | Flexibility and Efficiency | 2 | Requiere abrir órdenes una por una para priorizar y ejecutar. |
| 8 | Aesthetic and Minimalist Design | 3 | Es sobrio y legible, aunque cuatro tarjetas equivalentes aplanan la jerarquía. |
| 9 | Error Recovery | 1 | No hay estado de carga, error recuperable, reintento ni explicación de rechazo. |
| 10 | Help and Documentation | 1 | No hay orientación contextual sobre estados, propiedad de tareas ni siguiente decisión. |
| **Total** | | **21/40** | **Aceptable: requiere mejoras significativas.** |

## Design Specificity Verdict

El resultado es un dashboard administrativo competente, pero intercambiable con cualquier sistema de tickets o compras. Agrupa estados de ciclo de vida, no trabajo operativo priorizado. Por eso contradice la dirección de la superficie: prioridad inmediata, pulso mensual, contexto y acceso a colas completas.

El escaneo determinista no encontró hallazgos (`0`, en `frontend/src/components/odc/odc-dashboard.tsx`), por lo que no contradice la evaluación de diseño. La inspección visual en navegador no pudo realizarse porque el entorno no tenía navegador disponible; no existe overlay visible para el usuario.

## Overall Impression

Buena base visual, con una oportunidad estructural clara: convertir un inventario de cuatro estados en un banco de trabajo que indique qué compra desbloquear ahora y por qué.

## What's Working

- Los nombres de etapa y sus descripciones usan español claro y conectan con el flujo de compra.
- La composición sobria, los importes tabulares y los badges respetan el lenguaje visual existente sin ruido decorativo.
- Los enlaces de filas tienen foco visible y los estados no dependen sólo del color.

## Priority Issues

1. **[P1] Inventario de estados en vez de prioridad operativa.** El Director de Operaciones debe inferir urgencia entre cuatro tarjetas equivalentes. Sustituir el primer bloque por una cola priorizada por riesgo y antigüedad, con estado, importe, antigüedad, proveedor y acción explícita como “Registrar pago”, “Completar factura” o “Reabrir y editar”. **Suggested command:** `$impeccable shape`.
2. **[P1] Estados operativos requeridos ausentes y paginación oculta.** No se diferencia cero trabajo, carga o fallo, y `total` puede superar los elementos mostrados sin aviso. Añadir skeleton, error recuperable con reintento, estado vacío útil y “Mostrando N de M / Ver cola completa”. **Suggested command:** `$impeccable harden`.
3. **[P1] Falta contexto para decidir.** Los conteos no explican salud del periodo ni qué orden envejecida desbloquear. Tras la prioridad, mostrar pulso mensual contra el mes anterior, órdenes activas más antiguas y proveedores del periodo, con datos reales. **Suggested command:** `$impeccable shape`.
4. **[P2] Interacción ambigua e indirecta.** El número de ODC indica destino, no tarea. Separar el enlace de detalle de una acción operativa nombrada y explicar cuando la acción pertenece a otro rol. **Suggested command:** `$impeccable clarify`.
5. **[P2] Móvil conserva la jerarquía equivocada.** En pantalla estrecha se apilan CTA y cuatro colas antes de revelar la mejor siguiente acción. Mantener la tarea principal arriba y relegar colas secundarias a “Ver todas”. **Suggested command:** `$impeccable adapt`.

## Persona Red Flags

- **Alex, usuario experto:** debe leer cuatro colas y abrir órdenes una por una para hallar el bloqueo de mayor valor o antigüedad; no puede registrar pago ni completar factura desde la cola.
- **Sam, usuario de teclado/lector:** el foco existe, pero los conteos son números sin asociación textual robusta con su título; no hay anuncios de carga, error, reintento o truncamiento.
- **Jordan, primer usuario:** los estados describen qué pasó, no qué hacer. “Revisa el motivo” obliga a abrir la orden para descubrir la siguiente acción, y el vacío no orienta sobre el flujo completo.

## Minor Observations

- El badge repite el estado que ya define la cola y consume atención que podría destinarse a antigüedad o acción.
- `line-clamp-2` y `truncate` pueden ocultar proveedor o descripción determinantes.
- La etiqueta “Flujo de compra” se repite sin ayudar a comparar tarjetas.
- “Resumen mensual” compite con “Nueva ODC” antes de que exista una decisión prioritaria.

## Questions to Consider

- Si sólo se puede resolver una orden antes de una reunión, ¿la pantalla prueba cuál es?
- ¿Qué debe ganar: una rechazada antigua o una compra aprobada de importe alto que espera pago?
- ¿Por qué obligar a abrir un resumen mensual si las dos comparaciones que cambian la decisión caben en el dashboard?
